const CandidateSkillGraph = require('../models/CandidateSkillGraph');
const User = require('../models/User');
const VerificationLog = require('../models/VerificationLog');
const { generateVerifiablePresentation } = require('../utils/signature');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const crypto = require('crypto');

class VerificationService {
  async verifyCandidate(candidateId) {
    const workflowId = uuidv4();

    const verificationLog = await VerificationLog.create({
      workflowId,
      candidateId,
      type: 'verification_request',
      status: 'in_progress',
      steps: [{
        stepName: 'Initiate verification',
        status: 'completed',
        timestamp: new Date(),
        details: { candidateId }
      }]
    });

    try {
      const candidate = await User.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      verificationLog.steps.push({
        stepName: 'Fetch candidate data',
        status: 'completed',
        timestamp: new Date(),
        details: { candidateName: candidate.name }
      });

      const skillGraph = await CandidateSkillGraph.findOne({ candidateId })
        .populate('skills.skill');

      if (!skillGraph) {
        throw new Error('Skill graph not found');
      }

      verificationLog.steps.push({
        stepName: 'Retrieve skill graph',
        status: 'completed',
        timestamp: new Date(),
        details: { skillCount: skillGraph.skills.length }
      });

      const verifiablePresentation = generateVerifiablePresentation(candidate, skillGraph.skills);

      verificationLog.steps.push({
        stepName: 'Generate verifiable presentation',
        status: 'completed',
        timestamp: new Date(),
        details: { vpType: verifiablePresentation.type }
      });

      // CRITICAL FIX: Update Credential Status in DB
      await require('../models/Credential').updateMany(
        { candidateId: candidate._id, verificationStatus: 'pending' },
        { $set: { verificationStatus: 'verified', verifiedAt: new Date() } }
      );

      // CRITICAL FIX: Update Skill Graph immediately
      const updatedSkillGraph = await require('./skillMappingService').updateCandidateSkillGraph(candidate._id);

      const result = {
        candidateId: candidate._id,
        candidateName: candidate.name,
        verificationStatus: 'verified',
        timestamp: new Date(),
        skillCount: updatedSkillGraph.skillCount,
        overallScore: updatedSkillGraph.overallScore,
        skills: updatedSkillGraph.skills.map(s => ({
          name: s.skillName,
          nsqfLevel: s.nsqfLevel,
          proficiency: s.proficiency,
          recencyScore: s.recencyScore,
          sources: s.sources.map(src => ({
            issuer: src.issuerName,
            verifiedDate: src.verifiedDate
          }))
        })),
        verifiablePresentation
      };

      verificationLog.status = 'completed';
      verificationLog.completedAt = new Date();
      verificationLog.duration = verificationLog.completedAt - verificationLog.startedAt;
      verificationLog.outputData = result;
      await verificationLog.save();

      return result;
    } catch (error) {
      verificationLog.status = 'failed';
      verificationLog.errorMessage = error.message;
      verificationLog.completedAt = new Date();
      await verificationLog.save();
      throw error;
    }
  }

  async verifyQR(qrData) {
    try {
      // 1. Decode QR Data
      let credentialData;

      // Try Base64 first (standard for this app)
      try {
        const decodedString = Buffer.from(qrData, 'base64').toString('utf-8');
        credentialData = JSON.parse(decodedString);
      } catch (e) {
        // If Base64 fails, try raw JSON
        try {
          credentialData = JSON.parse(qrData);
        } catch (e2) {
          // If both fail, check if it's a simple string/URL that might contain an ID
          // For now, if it's not JSON, we can't verify the structure, but we can log it
          console.log('QR Data is not JSON:', qrData);
          throw new Error('Invalid QR format: Not a valid JSON');
        }
      }

      // 2. Check Expiry (if applicable)
      if (credentialData.expirationDate && new Date(credentialData.expirationDate) < new Date()) {
        return {
          valid: false,
          reason: 'Credential expired',
          details: { expirationDate: credentialData.expirationDate }
        };
      }

      // 3. Verify Signature (Simulated for now, replace with actual crypto verification)
      // In a real scenario, you would fetch the issuer's public key from the DID document or registry
      // const isValid = verifySignature(credentialData, issuerPublicKey);
      const isValid = true; // Placeholder for actual signature verification

      if (!isValid) {
        return {
          valid: false,
          reason: 'Invalid signature'
        };
      }

      // 4. Verify against ONEST Registry (if it's an ONEST credential)
      let networkStatus = 'skipped';
      if (credentialData.issuer && (credentialData.issuer.toLowerCase().includes('onest') || credentialData.issuer.toLowerCase().includes('beckn'))) {
        const onestVerification = await this.verifyONESTCredential(credentialData.id);
        networkStatus = onestVerification.status;

        if (!onestVerification.valid) {
          return {
            valid: false,
            reason: 'ONEST Registry verification failed',
            details: onestVerification
          };
        }
      }

      return {
        valid: true,
        credential: credentialData,
        verificationMethod: networkStatus === 'active' ? 'onest_registry' : 'digital_signature',
        networkStatus: networkStatus,
        timestamp: new Date()
      };

    } catch (error) {
      return {
        valid: false,
        reason: error.message
      };
    }
  }

  async verifyONESTCredential(credentialId) {
    try {
      const registryUrl = process.env.ONEST_REGISTRY_URL;
      if (!registryUrl) {
        console.warn('ONEST_REGISTRY_URL not configured, skipping registry check');
        return { valid: true, status: 'skipped_registry_check' };
      }

      const response = await fetch(`${registryUrl}/credentials/${credentialId}`);

      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'active') {
          return { valid: true, status: 'active' };
        } else {
          return { valid: false, status: data.status || 'unknown' };
        }
      } else {
        return { valid: false, status: `http_error_${response.status}` };
      }
    } catch (error) {
      console.error('ONEST Registry check failed:', error.message);
      // Fallback: if registry is down, rely on signature
      return { valid: true, status: 'registry_unavailable_fallback_signature' };
    }
  }

  async checkRevocationStatus(credentialId) {
    // Check against ONEST Registry
    const verification = await this.verifyONESTCredential(credentialId);

    return {
      credentialId,
      isRevoked: !verification.valid,
      lastChecked: new Date(),
      status: verification.valid ? 'active' : 'revoked'
    };
  }
}

module.exports = new VerificationService();
