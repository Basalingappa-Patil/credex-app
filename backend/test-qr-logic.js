const Jimp = require('jimp');
const jsQR = require('jsqr');
const fs = require('fs');
const path = require('path');

// Mock function to simulate what we do in the controller
async function testQRDecoding(imagePath) {
    console.log(`Testing QR decoding for: ${imagePath}`);

    if (!fs.existsSync(imagePath)) {
        console.error('File does not exist');
        return;
    }

    try {
        const image = await Jimp.read(imagePath);
        const { data, width, height } = image.bitmap;
        // data is a Buffer, but jsQR expects Uint8ClampedArray. 
        // In Node, Buffer is a Uint8Array. jsQR handles it fine usually.

        const code = jsQR(data, width, height);

        if (code) {
            console.log('✅ QR Code Found!');
            console.log('Data:', code.data);

            try {
                const decodedJson = JSON.parse(code.data);
                console.log('Parsed JSON:', decodedJson);
            } catch (e) {
                // Try base64 decode
                try {
                    const decodedString = Buffer.from(code.data, 'base64').toString('utf-8');
                    const json = JSON.parse(decodedString);
                    console.log('Parsed Base64 JSON:', json);
                } catch (e2) {
                    console.log('Raw Data (not JSON):', code.data);
                }
            }
        } else {
            console.error('❌ No QR code found.');
        }
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

// Check if an image path was provided
const args = process.argv.slice(2);
if (args.length > 0) {
    testQRDecoding(args[0]);
} else {
    console.log('Usage: node test-qr-logic.js <path-to-image>');
    console.log('Please provide an image path to test.');
}
