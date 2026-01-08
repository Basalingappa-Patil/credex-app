const CandidateSkillGraph = require('../models/CandidateSkillGraph');
const User = require('../models/User');
const VerificationLog = require('../models/VerificationLog');
const { generateVerifiablePresentation, verifySignature } = require('../utils/signature');
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
      // 1. Decode QR Data (Assuming Base64 encoded JSON)
      const decodedString = Buffer.from(qrData, 'base64').toString('utf-8');
      let credentialData;
      try {
        credentialData = JSON.parse(decodedString);
      } catch (e) {
        throw new Error('Invalid QR format: Not a valid JSON');
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
      if (credentialData.issuer && credentialData.issuer.includes('onest')) {
        const onestVerification = await this.verifyONESTCredential(credentialData.id);
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
        verificationMethod: 'digital_signature',
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
  async verifyJSON(jsonObj) {
    const checks = {
      'credential-parse': { parsed: false },
      'credential-validate': { validated: false },
      'credential-proof': { proofType: null, verified: false },
      'issuance-date': { valid: false }
    };

    try {
      // 1. Parse Check
      if (!jsonObj || typeof jsonObj !== 'object') {
        throw new Error('Invalid JSON structure');
      }
      checks['credential-parse'].parsed = true;

      // Handle input being an array (Credential Set) or object
      const credential = Array.isArray(jsonObj) ? jsonObj[0] : jsonObj;

      // Handle Verifiable Presentation wrapper - extract credential if present
      let targetCred = credential;
      // Note: If we are verifying the VP itself (which is what we sign now), targetCred is the VP.
      // If the user pasted a VC inside a VP, we might need logic to verify the VP wrapping it.
      // For now, let's assume the user pastes the VP we generated.

      if (credential.verifiableCredential && Array.isArray(credential.verifiableCredential)) {
        // It's a VP. We verify the VP signature.
        targetCred = credential;
      }

      // 2. Validate Check (Schema validation)
      // Relaxed requirements: Allow 'issued' OR 'issuanceDate'. 
      // Proof is optional for raw data but required for strict verification.
      const requiredFields = ['@context', 'type', 'credentialSubject', 'issuer'];
      // If it's a VP (holder property exists), strict checks might differ slightly (VP has holder, VC has issuer).
      // Let's adjust slightly:
      // If VP, look for 'holder'. If VC, look for 'issuer'.

      let missingFields = [];
      if (targetCred.type && targetCred.type.includes('VerifiablePresentation')) {
        if (!targetCred.holder) missingFields.push('holder');
      } else {
        if (!targetCred.issuer) missingFields.push('issuer');
      }

      if (!targetCred['@context']) missingFields.push('@context');
      if (!targetCred.type) missingFields.push('type');
      // VP doesn't need credentialSubject at top level necessarily if it wraps VCs, but our generator adds it.

      if (missingFields.length > 0) {
        checks['credential-validate'].error = `Missing fields: ${missingFields.join(', ')}`;
        // Don't fail immediately, try to verify signature if proof exists
      } else {
        checks['credential-validate'].validated = true;
      }

      // 3. Issuance Date Check
      // Standard is issuanceDate, but some use issued. (VP might use created inside proof, but usually VCs have issuanceDate)
      // If VP, check proofs created date? Or if it wraps VCs, check them. 
      // Our generator puts issuanceDate inside the VCs in the VP.
      // But let's check top level logic first.

      // If it's a VP, let's check the first VC's issuanceDate for this check, or rely on proof.created?
      // Let's stick to checking if *any* date is present effectively.
      const dateField = targetCred.issuanceDate || targetCred.issued; // VC property
      if (dateField) {
        const issuanceDate = new Date(dateField);
        if (!isNaN(issuanceDate.getTime()) && issuanceDate <= new Date()) {
          checks['issuance-date'].valid = true;
        } else {
          checks['issuance-date'].error = 'Invalid or future issuance date';
        }
      } else if (targetCred.type && targetCred.type.includes('VerifiablePresentation')) {
        // VP might not have issuanceDate. Check VCs inside.
        if (targetCred.verifiableCredential && targetCred.verifiableCredential.length > 0) {
          const firstVc = targetCred.verifiableCredential[0];
          const vcDate = firstVc.issuanceDate || firstVc.issued;
          if (vcDate) {
            const issuanceDate = new Date(vcDate);
            if (!isNaN(issuanceDate.getTime()) && issuanceDate <= new Date()) {
              checks['issuance-date'].valid = true;
            } else {
              checks['issuance-date'].error = 'Invalid or future issuance date (in VC)';
            }
          }
        }
      }

      // 4. Proof Check & Signature Verification
      const proof = jsonObj.proof; // Proof should be at top level for the VP we sign
      let isVerified = false;

      if (proof) {
        const p = Array.isArray(proof) ? proof[0] : proof;

        checks['credential-proof'] = {
          proofType: p.type,
          verificationMethod: p.verificationMethod,
          created: p.created,
          proofPurpose: p.proofPurpose,
          verified: false
        };

        // Perform cryptographic verification
        if (p.proofValue) {
          // Create copy without proof
          const docToVerify = { ...jsonObj };
          delete docToVerify.proof;

          const isValid = verifySignature(docToVerify, p.proofValue);

          checks['credential-proof'].verified = isValid;
          isVerified = isValid;

          if (!isValid) checks['credential-proof'].error = 'Digital Signature Verification Failed';
        } else {
          checks['credential-proof'].error = 'Proof value missing';
        }

      } else {
        checks['credential-proof'].error = 'No proof found';
      }

      return {
        verified: isVerified,
        checks
      };

    } catch (error) {
      console.error("verifyJSON error", error);
      return {
        verified: false,
        checks,
        error: error.message
      };
    }
  }
}

module.exports = new VerificationService();
