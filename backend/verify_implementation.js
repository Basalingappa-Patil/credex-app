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
    // console.log(JSON.stringify(vp, null, 2));

    console.log("2. Verifying VP Signature...");
    const proof = vp.proof;
    if (!proof) throw new Error("No proof found in VP");

    // Emulate verifyJSON logic
    const docToVerify = { ...vp };
    delete docToVerify.proof;

    const isValid = verifySignature(docToVerify, proof.proofValue);
    console.log(`Verification Result: ${isValid}`);

    if (isValid) {
        console.log("SUCCESS: Real-time verification working.");
    } else {
        console.error("FAILURE: Verification returned false.");
    }

    // 3. Negative Test
    console.log("3. Tampering with data...");
    docToVerify.holder = "did:candidate:TAMPERED";
    const isTamperedValid = verifySignature(docToVerify, proof.proofValue);
    console.log(`Tampered Verification Result: ${isTamperedValid}`);

    if (!isTamperedValid) {
        console.log("SUCCESS: Tampered data correctly rejected.");
    } else {
        console.error("FAILURE: Tampered data was accepted!");
    }

} catch (err) {
    console.error("Error during test:", err);
}
