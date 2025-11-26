const Skill = require('../models/Skill');
const CandidateSkillGraph = require('../models/CandidateSkillGraph');
const Credential = require('../models/Credential');
const { mapSkillToNSQF, calculateProficiency, calculateRecencyScore } = require('../utils/nsqfMapper');

class SkillMappingService {
  async mapCredentialSkills(credential) {
    const mappedSkills = [];

    for (const skillData of credential.skills) {
      if (!skillData.name || typeof skillData.name !== 'string' || skillData.name.trim() === '') {
        console.warn(`[SkillMapping] Skipping invalid skill in credential ${credential._id}:`, skillData);
        continue;
      }

      const skillMapping = mapSkillToNSQF(
        skillData.name,
        credential.type,
        0
      );

      let skill = await Skill.findOne({
        normalizedName: skillData.name.toLowerCase()
      });

      if (!skill) {
        skill = await Skill.create({
          name: skillData.name,
          normalizedName: skillData.name.toLowerCase(),
          category: skillMapping.category,
          nsqfLevel: skillMapping.nsqfLevel,
          competencyFramework: skillMapping.competency,
          synonyms: [skillData.name.toLowerCase()]
        });
      }

      mappedSkills.push({
        skill: skill._id,
        skillName: skill.name,
        nsqfLevel: skillMapping.nsqfLevel,
        proficiency: skillData.proficiency || 50,
        source: {
          credentialId: credential._id,
          issuerName: credential.issuerName,
          verifiedDate: credential.verifiedAt || credential.createdAt,
          weight: this.calculateSourceWeight(credential.type, credential.verificationStatus)
        }
      });
    }

    return mappedSkills;
  }

  calculateSourceWeight(credentialType, status) {
    if (status === 'pending') return 0.5; // Lower confidence for unverified skills

    const weights = {
      'certification': 1.0,
      'education': 0.9,
      'assessment': 0.85,
      'experience': 0.8
    };
    return weights[credentialType] || 0.7;
  }

  async updateCandidateSkillGraph(candidateId) {
    const credentials = await Credential.find({
      candidateId,
      verificationStatus: { $in: ['verified', 'pending'] }
    }).sort({ issuedDate: -1 });

    const skillMap = new Map();

    for (const credential of credentials) {
      const mappedSkills = await this.mapCredentialSkills(credential);

      for (const mappedSkill of mappedSkills) {
        const skillKey = mappedSkill.skillName;

        if (skillMap.has(skillKey)) {
          const existing = skillMap.get(skillKey);
          existing.sources.push(mappedSkill.source);
          existing.proficiency = Math.max(existing.proficiency, mappedSkill.proficiency);
        } else {
          skillMap.set(skillKey, {
            ...mappedSkill,
            sources: [mappedSkill.source],
            lastVerified: new Date()
          });
        }
      }
    }

    const skills = Array.from(skillMap.values()).map(skill => {
      const recencyScore = calculateRecencyScore(skill.lastVerified);
      const proficiency = calculateProficiency(skill.sources, recencyScore);

      return {
        ...skill,
        recencyScore,
        proficiency
      };
    });

    const overallScore = skills.length > 0
      ? skills.reduce((sum, s) => sum + s.proficiency, 0) / skills.length
      : 0;

    const strengthAreas = this.identifyStrengthAreas(skills);

    let skillGraph = await CandidateSkillGraph.findOne({ candidateId });

    if (skillGraph) {
      skillGraph.skills = skills;
      skillGraph.overallScore = overallScore;
      skillGraph.strengthAreas = strengthAreas;
      skillGraph.skillCount = skills.length;
      skillGraph.lastUpdated = new Date();
      await skillGraph.save();
    } else {
      skillGraph = await CandidateSkillGraph.create({
        candidateId,
        skills,
        overallScore,
        strengthAreas,
        skillCount: skills.length
      });
    }

    return skillGraph;
  }

  identifyStrengthAreas(skills) {
    const categoryScores = {};

    for (const skill of skills) {
      const skillDoc = skill.skill;
      if (skillDoc && skillDoc.category) {
        if (!categoryScores[skillDoc.category]) {
          categoryScores[skillDoc.category] = [];
        }
        categoryScores[skillDoc.category].push(skill.proficiency);
      }
    }

    const averages = Object.entries(categoryScores).map(([category, scores]) => ({
      category,
      average: scores.reduce((sum, s) => sum + s, 0) / scores.length
    }));

    return averages
      .sort((a, b) => b.average - a.average)
      .slice(0, 3)
      .map(item => item.category);
  }

  async deduplicateSkills(candidateId) {
    const skillGraph = await CandidateSkillGraph.findOne({ candidateId });

    if (!skillGraph) return;

    const uniqueSkills = new Map();

    for (const skill of skillGraph.skills) {
      const normalizedName = skill.skillName.toLowerCase();

      if (!uniqueSkills.has(normalizedName)) {
        uniqueSkills.set(normalizedName, skill);
      } else {
        const existing = uniqueSkills.get(normalizedName);
        existing.sources = [...existing.sources, ...skill.sources];
        existing.proficiency = Math.max(existing.proficiency, skill.proficiency);
      }
    }

    skillGraph.skills = Array.from(uniqueSkills.values());
    skillGraph.skillCount = skillGraph.skills.length;
    await skillGraph.save();

    return skillGraph;
  }
}

module.exports = new SkillMappingService();
