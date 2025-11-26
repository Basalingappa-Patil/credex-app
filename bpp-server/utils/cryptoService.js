const sodium = require('sodium-native');

class CryptoService {
    constructor() {
        // Generate a Key Pair for this BPP (Ed25519)
        this.publicKey = Buffer.alloc(sodium.crypto_sign_PUBLICKEYBYTES);
        this.secretKey = Buffer.alloc(sodium.crypto_sign_SECRETKEYBYTES);
        sodium.crypto_sign_keypair(this.publicKey, this.secretKey);

        console.log('[Crypto] BPP Keys Generated');
        console.log('Public Key (Base64):', this.publicKey.toString('base64'));
    }

    async signPayload(payload) {
        // 1. Canonicalize the payload (simplified for this demo: JSON.stringify)
        // In production, use a proper canonicalization library
        const payloadString = JSON.stringify(payload);
        const payloadBuffer = Buffer.from(payloadString);

        // 2. Sign
        const signature = Buffer.alloc(sodium.crypto_sign_BYTES);
        sodium.crypto_sign_detached(signature, payloadBuffer, this.secretKey);

        // 3. Attach Signature (Mocking the Authorization header format for the payload)
        // In Beckn, the signature is usually in the 'Authorization' header of the HTTP request,
        // but for this demo, we'll attach it to the body to show it's signed.
        return {
            ...payload,
            signature: signature.toString('base64')
        };
    }

    verifySignature(payload, signatureBase64, publicKeyBase64) {
        const signature = Buffer.from(signatureBase64, 'base64');
        const publicKey = Buffer.from(publicKeyBase64, 'base64');
        const message = Buffer.from(JSON.stringify(payload));

        return sodium.crypto_sign_verify_detached(signature, message, publicKey);
    }
}

module.exports = new CryptoService();
