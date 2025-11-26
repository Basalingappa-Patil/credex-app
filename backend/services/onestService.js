const Credential = require('../models/Credential');
const Issuer = require('../models/Issuer');
const { v4: uuidv4 } = require('uuid');

const MOCK_ONEST_CREDENTIALS = {
  'ONEST001': {
    type: 'education',
    title: 'Bachelor of Technology - Computer Science',
    institution: 'Indian Institute of Technology',
    skills: [
      { name: 'Data Structures', level: 'Advanced', proficiency: 85 },
      { name: 'Algorithms', level: 'Advanced', proficiency: 80 },
      { name: 'Database Systems', level: 'Intermediate', proficiency: 75 }
    ],
    issuedDate: '2022-06-15',
    grade: 'First Class with Distinction'
  },
  'ONEST002': {
    type: 'certification',
    title: 'AWS Certified Solutions Architect',
    institution: 'Amazon Web Services',
    skills: [
      { name: 'Cloud Computing', level: 'Professional', proficiency: 90 },
      { name: 'AWS Services', level: 'Advanced', proficiency: 85 },
      { name: 'System Architecture', level: 'Advanced', proficiency: 80 }
    ],
    issuedDate: '2023-03-20',
    expiryDate: '2026-03-20'
  },
  'ONEST003': {
    type: 'assessment',
    title: 'Full Stack Development Assessment',
    institution: 'NSDC Skill Assessment Platform',
    skills: [
      { name: 'JavaScript', level: 'Expert', proficiency: 92 },
      { name: 'React', level: 'Advanced', proficiency: 88 },
      { name: 'Node.js', level: 'Advanced', proficiency: 85 },
      { name: 'MongoDB', level: 'Intermediate', proficiency: 78 }
    ],
    issuedDate: '2023-08-10',
    score: 88
  }
};

class ONESTService {
  async fetchCredentialFromONEST(credentialReferenceId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockData = MOCK_ONEST_CREDENTIALS[credentialReferenceId];
    
    if (!mockData) {
      throw new Error('Credential not found in ONEST network');
    }
    
    return {
      credentialId: credentialReferenceId,
      ...mockData,
      verificationUrl: `https://onest.network/verify/${credentialReferenceId}`,
      signature: this.generateMockSignature(mockData)
    };
  }

  async validateCredential(credentialData) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!credentialData.signature) {
      return { isValid: false, reason: 'Missing signature' };
    }
    
    if (!credentialData.issuedDate) {
      return { isValid: false, reason: 'Missing issue date' };
    }
    
    const issueDate = new Date(credentialData.issuedDate);
    if (issueDate > new Date()) {
      return { isValid: false, reason: 'Invalid issue date' };
    }
    
    if (credentialData.expiryDate) {
      const expiryDate = new Date(credentialData.expiryDate);
      if (expiryDate < new Date()) {
        return { isValid: false, reason: 'Credential expired' };
      }
    }
    
    return { isValid: true, reason: 'Credential validated successfully' };
  }

  normalizeCredentialData(rawCredentialData) {
    return {
      type: rawCredentialData.type || 'education',
      title: rawCredentialData.title,
      issuerName: rawCredentialData.institution,
      description: rawCredentialData.description || rawCredentialData.title,
      skills: rawCredentialData.skills || [],
      issuedDate: new Date(rawCredentialData.issuedDate),
      expiryDate: rawCredentialData.expiryDate ? new Date(rawCredentialData.expiryDate) : null,
      rawData: rawCredentialData
    };
  }

  generateMockSignature(data) {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data) + 'onest-secret-key');
    return hash.digest('hex');
  }

  async fetchFromMultipleSources(candidateId, referenceIds) {
    const credentials = [];
    
    for (const refId of referenceIds) {
      try {
        const credentialData = await this.fetchCredentialFromONEST(refId);
        const validation = await this.validateCredential(credentialData);
        
        if (validation.isValid) {
          const normalized = this.normalizeCredentialData(credentialData);
          credentials.push({
            ...normalized,
            credentialId: refId,
            verificationStatus: 'verified',
            signature: credentialData.signature
          });
        }
      } catch (error) {
        console.error(`Error fetching credential ${refId}:`, error.message);
      }
    }
    
    return credentials;
  }
}

module.exports = new ONESTService();
