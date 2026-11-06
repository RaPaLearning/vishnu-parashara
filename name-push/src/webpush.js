/**
 * Zero-dependency Web Push for Cloudflare Workers (and any WebCrypto+fetch
 * runtime such as Node 19+).
 *
 * Implements:
 *   - RFC 8291: Message Encryption for Web Push ("aes128gcm" content coding)
 *   - RFC 8292: VAPID authentication (ES256 JWT in the Authorization header)
 *
 * Exports:
 *   - generateVapidKeys() -> { publicKey, privateKey } (base64url)
 *     publicKey is the raw uncompressed point (65 bytes), exactly the format
 *     browsers expect for pushManager.subscribe({ applicationServerKey }).
 *   - sendNotification(subscription, payload, options) -> Response
 *     options: { vapidPublicKey, vapidPrivateKey, ttl?, subject? }
 *     Errors carry a `statusCode` property when the push service responded.
 */

function utf8(str) {
  return new TextEncoder().encode(str);
}

function b64urlDecode(str) {
  let base64 = String(str).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function b64urlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concat(...arrays) {
  const total = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    out.set(arr, offset);
    offset += arr.length;
  }
  return out;
}

function uint32be(value) {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8
  );
  return new Uint8Array(bits);
}

/** RFC 8292 VAPID JWT, signed ES256 with the stored private key. */
async function buildVapidJwt(audience, options) {
  const header = b64urlEncode(utf8(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const claims = b64urlEncode(
    utf8(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
        sub: options.subject || 'mailto:admin@example.com',
      })
    )
  );
  const signingInput = `${header}.${claims}`;
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    b64urlDecode(options.vapidPrivateKey),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, utf8(signingInput))
  );
  return `${signingInput}.${b64urlEncode(signature)}`;
}

export async function generateVapidKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
  ]);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const privateKey = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
  return {
    publicKey: b64urlEncode(publicKey),
    privateKey: b64urlEncode(privateKey),
  };
}

/**
 * Sanity-checks a VAPID key pair as configured on the server:
 *  - publicKeyOk: base64url of a 65-byte uncompressed P-256 point (0x04 ...)
 *  - privateKeyOk: base64url of a PKCS#8 ECDSA P-256 private key
 *  - match: the public key corresponds to the private key
 * Used by the worker's /debug/vapid endpoint for troubleshooting.
 */
export async function validateVapidKeys(publicKeyB64url, privateKeyB64url) {
  const result = { publicKeyOk: false, privateKeyOk: false, match: false, publicKeyLength: 0 };
  const pub = typeof publicKeyB64url === 'string' ? publicKeyB64url.trim() : '';
  const priv = typeof privateKeyB64url === 'string' ? privateKeyB64url.trim() : '';
  if (!pub) {
    return result;
  }
  try {
    const pubBytes = b64urlDecode(pub);
    result.publicKeyLength = pubBytes.length;
    result.publicKeyOk = pubBytes.length === 65 && pubBytes[0] === 0x04;
  } catch {
    return result;
  }
  if (!priv) {
    return result;
  }
  try {
    const jwk = await crypto.subtle.exportKey(
      'jwk',
      await crypto.subtle.importKey(
        'pkcs8',
        b64urlDecode(priv),
        { name: 'ECDSA', namedCurve: 'P-256' },
        true,
        ['sign']
      )
    );
    result.privateKeyOk = true;
    if (result.publicKeyOk && jwk.crv === 'P-256' && jwk.x && jwk.y) {
      const derived = concat(new Uint8Array([0x04]), b64urlDecode(jwk.x), b64urlDecode(jwk.y));
      result.match = b64urlEncode(derived) === pub;
    }
  } catch {
    // invalid private key
  }
  return result;
}

/**
 * RFC 8291 aes128gcm encryption. Returns the full request body:
 *   salt(16) || rs(4) || keyidlen(1) || keyid || encrypted record
 * where keyid is our ephemeral uncompressed public key.
 */
async function encryptPayload(payload, uaPublic) {
  const asKeys = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));

  const remoteKey = await crypto.subtle.importKey(
    'raw',
    uaPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    []
  );
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: remoteKey }, asKeys.privateKey, 256)
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(salt, sharedSecret, concat(utf8('WebPush: info'), new Uint8Array(1), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, utf8('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, utf8('Content-Encoding: nonce\0'), 12);

  // Single record: payload followed by the padding delimiter 0x02.
  const record = concat(utf8(payload), new Uint8Array([0x02]));
  const RECORD_SIZE = 4096;
  if (record.length > RECORD_SIZE - 17) {
    throw new Error('payload too large for a single aes128gcm record');
  }
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']),
      record
    )
  );

  return concat(salt, uint32be(RECORD_SIZE), new Uint8Array([asPublic.length]), asPublic, encrypted);
}

export async function sendNotification(subscription, payload, options = {}) {
  const keys = subscription.keys || {};
  if (!subscription.endpoint || !keys.p256dh || !keys.auth) {
    const err = new Error('subscription is missing endpoint or keys');
    err.statusCode = 400;
    throw err;
  }

  const uaPublic = b64urlDecode(keys.p256dh);
  const body = await encryptPayload(payload, uaPublic);
  const jwt = await buildVapidJwt(new URL(subscription.endpoint).origin, options);
  const authorization = `vapid t=${jwt}, k=${options.vapidPublicKey}`;

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      TTL: String(options.ttl ?? 3 * 24 * 3600),
      Authorization: authorization,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      Urgency: 'normal',
    },
    body,
  });

  if (response.status >= 400) {
    const err = new Error(`push service responded ${response.status}`);
    err.statusCode = response.status;
    throw err;
  }
  return response;
}
