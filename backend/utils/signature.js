const crypto = require('crypto');

const generateSignature = (data) => {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
};

const verifySignature = (data, signature) => {
  const expectedSignature = generateSignature(data);
  return expectedSignature === signature;
};

const generateVerifiablePresentation = (candidateData, skills) => {
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
    holder: `did:candidate:${candidateData._id}`,
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofPurpose: 'authentication',
      verificationMethod: 'urn:beckn:verification-key',
      proofValue: generateSignature({ candidateData, skills })
    }
  };
  
  return vp;
};

module.exports = { generateSignature, verifySignature, generateVerifiablePresentation };
