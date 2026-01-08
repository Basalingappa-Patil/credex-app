const sodium = require("sodium-native");

const publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
const privateKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);

sodium.crypto_sign_keypair(publicKey, privateKey);

console.log("BPP_PUBLIC_KEY=" + publicKey.toString("base64"));
console.log("BPP_PRIVATE_KEY=" + privateKey.toString("base64"));
