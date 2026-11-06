// Generates a VAPID key pair for Web Push (uses WebCrypto, no dependencies).
// Usage:  npm run generate-keys
// Then:   npx wrangler secret put VAPID_PUBLIC_KEY
//         npx wrangler secret put VAPID_PRIVATE_KEY
import { generateVapidKeys } from '../src/webpush.js';

const keys = await generateVapidKeys();

console.log('VAPID keys generated. Store them as worker secrets:\n');
console.log(`Public key  (VAPID_PUBLIC_KEY):\n${keys.publicKey}\n`);
console.log(`Private key (VAPID_PRIVATE_KEY):\n${keys.privateKey}\n`);
console.log('Commands:\n');
console.log('  npx wrangler secret put VAPID_PUBLIC_KEY');
console.log('  npx wrangler secret put VAPID_PRIVATE_KEY');
