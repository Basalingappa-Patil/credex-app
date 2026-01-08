const { generateVerifiablePresentation, verifySignature, generateSignature } = require('./utils/signature');
const fs = require('fs');
const path = require('path');

// Check if keys exist
const keyPath = path.join(__dirname, 'keys.json');
if (!fs.existsSync(keyPath)) {
    console.log("Keys not found. They should be generated on first use.");
}

// Mock Data
const candidate = {
    _id: '123456789012345678901234',
    name: 'Test Candidate'
};
const skills = [
    {
        skillName: 'JavaScript',
        nsqfLevel: '5',
        proficiency: 90,
        lastVerified: new Date(),
        sources: [{ issuerName: 'Test Issuer', verifiedDate: new Date() }]
    }
];

try {
    console.log("1. Generating VP...");
    const vp = generateVerifiablePresentation(candidate, skills);
    console.log("VP Generated.");

    // Simulate Network/JSON Parsing Roundtrip
    // This often reorders keys!
    const vpString = JSON.stringify(vp);
    const vpParsed = JSON.parse(vpString);

    console.log("2. Verifying VP Signature (after JSON roundtrip)...");
    const proof = vpParsed.proof;
    if (!proof) throw new Error("No proof found in VP");

    // Emulate verifyJSON logic
    const docToVerify = { ...vpParsed };
    delete docToVerify.proof;

    const isValid = verifySignature(docToVerify, proof.proofValue);
    console.log(`Verification Result: ${isValid}`);

    if (isValid) {
        console.log("SUCCESS: Real-time verification working with Canonicalization.");
    } else {
        console.error("FAILURE: Verification returned false.");
    }

} catch (err) {
    console.error("Error during test:", err);
}
