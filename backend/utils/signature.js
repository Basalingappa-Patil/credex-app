const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEY_FILE = path.join(__dirname, '../keys.json');

let privateKey;
let publicKey;

// Load or Generate Keys
try {
  if (fs.existsSync(KEY_FILE)) {
    const keys = JSON.parse(fs.readFileSync(KEY_FILE, 'utf8'));
    publicKey = crypto.createPublicKey({ key: Buffer.from(keys.publicKey, 'hex'), format: 'der', type: 'spki' });
    privateKey = crypto.createPrivateKey({ key: Buffer.from(keys.privateKey, 'hex'), format: 'der', type: 'pkcs8' });
    // console.log('Loaded existing keys from keys.json');
  } else {
    const keyPair = crypto.generateKeyPairSync('ed25519');
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;

    // Save keys (DER format hex strings)
    const pubDer = publicKey.export({ format: 'der', type: 'spki' }).toString('hex');
    const privDer = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('hex');

    fs.writeFileSync(KEY_FILE, JSON.stringify({ publicKey: pubDer, privateKey: privDer }, null, 2));
    console.log('Generated and saved new Ed25519 keys to keys.json');
    console.log('Public Key (hex):', pubDer);
  }
} catch (err) {
  console.error("Error initializing keys:", err);
  // Fallback to generating ephemeral keys if fs fails
  const keyPair = crypto.generateKeyPairSync('ed25519');
  publicKey = keyPair.publicKey;
  privateKey = keyPair.privateKey;
}

// Helper to ensure deterministic JSON stringification (sort keys)
const canonicalize = (obj) => {
  if (obj === null || typeof obj !== 'object' || obj.toJSON) {
    return JSON.stringify(obj);
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalize(item)).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  return '{' + keys.map(key => {
    return JSON.stringify(key) + ':' + canonicalize(obj[key]);
  }).join(',') + '}';
};

const generateSignature = (data) => {
  // Sign the canonicalized string
  const dataString = canonicalize(data);
  // console.log('[Debugging] Signing Data:', dataString); 
  const signature = crypto.sign(null, Buffer.from(dataString), privateKey);
  return signature.toString('base64');
};

const verifySignature = (data, signatureBase64) => {
  try {
    const dataString = canonicalize(data);
    // console.log('[Debugging] Verifying Data:', dataString);
    return crypto.verify(null, Buffer.from(dataString), publicKey, Buffer.from(signatureBase64, 'base64'));
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
};

const generateVerifiablePresentation = (candidateData, skills) => {
  // 1. Construct the VP object WITHOUT proof
  const vp = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiablePresentation'],
    verifiableCredential: skills.map(skill => ({
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'SkillCredential'],
      issuer: 'urn:beckn:skill-verification-network',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: `did:candidate:${candidateData._id}`,
        name: candidateData.name,
        skill: {
          name: skill.skillName,
          nsqfLevel: skill.nsqfLevel,
          proficiency: skill.proficiency,
          lastVerified: skill.lastVerified,
          sources: skill.sources.map(s => ({
            issuer: s.issuerName,
            verifiedDate: s.verifiedDate
          }))
        }
      }
    })),
    holder: `did:candidate:${candidateData._id}`
  };

  // 2. Sign the VP object
  const signatureValue = generateSignature(vp);

  // 3. Attach Proof
  vp.proof = {
    type: 'Ed25519Signature2020',
    created: new Date().toISOString(),
    proofPurpose: 'assertionMethod', // 'authentication' or 'assertionMethod'
    verificationMethod: 'urn:beckn:verification-key',
    proofValue: signatureValue
  };

  return vp;
};

module.exports = { generateSignature, verifySignature, generateVerifiablePresentation };
