const { generateVerifiablePresentation, verifySignature } = require('./utils/signature');

// Mock Data
const candidate = {
    _id: "test-user-123",
    name: "Test User"
};

const skills = [
    {
        skillName: "Debugging",
        nsqfLevel: "5",
        proficiency: 90,
        lastVerified: new Date().toISOString(),
        sources: []
    }
];

console.log("--- 1. Generating VP ---");
const vp = generateVerifiablePresentation(candidate, skills);
console.log("VP Generated.");
console.log("Proof Value:", vp.proof.proofValue);

console.log("\n--- 2. Verifying VP ---");
const docToVerify = { ...vp };
delete docToVerify.proof;

const isValid = verifySignature(docToVerify, vp.proof.proofValue);
console.log("Verification Result:", isValid);

if (isValid) {
    console.log("\n✅ SYSTEM IS WORKING CORRECTLY.");
    console.log("If your JSON fails to verify, it was likely signed with an old key key.");
    console.log("Please REGENERATE your JSON from the Candidate Dashboard.");
} else {
    console.error("\n❌ SYSTEM VERIFICATION FAILED.");
}
