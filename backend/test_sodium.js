const sodium = require('sodium-native');

const publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
const secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);

sodium.crypto_sign_keypair(publicKey, secretKey);

console.log('Keys generated successfully');
console.log('Public Key:', publicKey.toString('hex'));
console.log('Secret Key:', secretKey.toString('hex'));

const message = Buffer.from('Hello World');
const signature = Buffer.alloc(sodium.crypto_sign_BYTES);

sodium.crypto_sign_detached(signature, message, secretKey);

const verified = sodium.crypto_sign_verify_detached(signature, message, publicKey);
console.log('Verification Result:', verified);
