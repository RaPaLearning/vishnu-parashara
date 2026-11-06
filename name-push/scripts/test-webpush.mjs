/**
 * Round-trip smoke test for src/webpush.js (run with Node 19+):
 *  1. Generates a "subscription" key pair standing in for the browser.
 *  2. Calls sendNotification() with a mocked fetch and captures the request.
 *  3. Decrypts the aes128gcm body exactly as a push service/browser would
 *     (RFC 8291 receiver side) and compares with the original payload.
 *  4. Verifies the VAPID JWT ES256 signature against the public key.
 */
import { generateVapidKeys, sendNotification } from '../src/webpush.js';

function b64urlDecode(str) {
  let b = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b.length % 4) b += '=';
  return new Uint8Array([...atob(b)].map((c) => c.charCodeAt(0)));
}

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const a of arrays) { out.set(a, o); o += a.length; }
  return out;
}

async function hkdf(salt, ikm, info, length) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, length * 8));
}

// 1. Browser-side subscription keys.
const uaPair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const uaPublicRaw = new Uint8Array(await crypto.subtle.exportKey('raw', uaPair.publicKey));
function b64urlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
const subscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: b64urlEncode(uaPublicRaw),
    auth: b64urlEncode(crypto.getRandomValues(new Uint8Array(16))),
  },
};

const vapid = await generateVapidKeys();

// 2. Mock the push service and capture the request.
let captured;
globalThis.fetch = async (url, init) => {
  captured = { url, init };
  return new Response(null, { status: 201 });
};

const payload = JSON.stringify({
  index: 42,
  number: 43,
  word: 'viṣvaksenaḥ',
  meaning: 'He who has an unconquerable army.',
  deviceId: 'test-device',
  apiBase: 'https://example.workers.dev',
});

const response = await sendNotification(subscription, payload, {
  vapidPublicKey: vapid.publicKey,
  vapidPrivateKey: vapid.privateKey,
});
console.log('status:', response.status);
console.log('endpoint:', captured.url);
console.log('headers:', JSON.stringify(Object.fromEntries(Object.entries(captured.init.headers))));

const body = new Uint8Array(captured.init.body);

// 3. RFC 8291 receiver side: parse header, decrypt.
const salt = body.slice(0, 16);
const rs = (body[16] << 24) | (body[17] << 16) | (body[18] << 8) | body[19];
const idlen = body[20];
const asPublic = body.slice(21, 21 + idlen);
const ciphertext = body.slice(21 + idlen);
console.log('rs:', rs, 'idlen:', idlen, 'asPublic bytes:', asPublic.length, 'ciphertext bytes:', ciphertext.length);

const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits(
  {
    name: 'ECDH',
    public: await crypto.subtle.importKey('raw', asPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []),
  },
  uaPair.privateKey,
  256
));
const ikm = await hkdf(salt, sharedSecret, concat(new TextEncoder().encode('WebPush: info'), new Uint8Array(1), uaPublicRaw, asPublic), 32);
const cek = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: aes128gcm\0'), 16);
const nonce = await hkdf(salt, ikm, new TextEncoder().encode('Content-Encoding: nonce\0'), 12);

const record = new Uint8Array(await crypto.subtle.decrypt(
  { name: 'AES-GCM', iv: nonce },
  await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']),
  ciphertext
));
if (record[record.length - 1] !== 0x02) throw new Error('missing padding delimiter 0x02');
const decrypted = new TextDecoder().decode(record.slice(0, record.length - 1));
if (decrypted !== payload) throw new Error(`round-trip mismatch:\n  got:      ${decrypted}\n  expected: ${payload}`);
console.log('payload round-trip: OK');

// 4. Verify the VAPID JWT.
const authHeader = captured.init.headers.Authorization;
const jwt = authHeader.match(/vapid t=([^,]+), k=(.+)/);
if (!jwt) throw new Error('bad Authorization header');
const [h, c, s] = jwt[1].split('.');
const headerJson = JSON.parse(new TextDecoder().decode(b64urlDecode(h)));
const claimsJson = JSON.parse(new TextDecoder().decode(b64urlDecode(c)));
console.log('jwt header:', headerJson, 'claims:', claimsJson);
if (headerJson.alg !== 'ES256') throw new Error('bad alg');
if (claimsJson.aud !== 'https://fcm.googleapis.com') throw new Error('bad aud');
const sigBytes = b64urlDecode(s);
if (sigBytes.length !== 64) throw new Error('signature must be raw r||s (64 bytes)');
const sigOk = await crypto.subtle.verify(
  { name: 'ECDSA', hash: 'SHA-256' },
  await crypto.subtle.importKey('raw', b64urlDecode(vapid.publicKey), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']),
  sigBytes,
  new TextEncoder().encode(`${h}.${c}`)
);
if (!sigOk) throw new Error('VAPID signature verification failed');
if (jwt[2] !== vapid.publicKey) throw new Error('k= must be the raw public key');
console.log('VAPID JWT: OK');
console.log('\nAll checks passed.');
