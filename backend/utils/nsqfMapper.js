const NSQF_LEVELS = {
  1: {
    name: 'Entry Level',
    knowledge: 'Basic factual knowledge',
    skills: 'Simple, routine tasks',
    responsibility: 'Works under direct supervision',
    complexity: 'Very basic tasks'
  },
  2: {
    name: 'Basic',
    knowledge: 'Knowledge of facts, principles, processes',
    skills: 'Cognitive & practical skills; follows guidelines',
    responsibility: 'Some autonomy under supervision',
    complexity: 'Routine tasks with some variation'
  },
  3: {
    name: 'Intermediate',
    knowledge: 'Factual & theoretical knowledge in field contexts',
    skills: 'Solves specific problems; broader task range',
    responsibility: 'Works independently; may supervise',
    complexity: 'Non-routine tasks requiring judgment'
  },
  4: {
    name: 'Advanced',
    knowledge: 'Comprehensive factual & theoretical knowledge',
    skills: 'Manages processes; decision-making',
    responsibility: 'High responsibility; supervisory role',
    complexity: 'Complex problem-solving'
  },
  5: {
    name: 'Specialist',
    knowledge: 'Comprehensive, specialized knowledge',
    skills: 'Advanced technical & managerial skills',
    responsibility: 'Manages teams & resources',
    complexity: 'Advanced analytical skills'
  },
  6: {
    name: 'Professional',
    knowledge: 'Graduate-level professional knowledge',
    skills: 'Professional competence and innovation',
    responsibility: 'Independent professional practice',
    complexity: 'Strategic thinking and planning'
  },
  7: {
    name: 'Senior Professional',
    knowledge: 'Specialized expertise and research knowledge',
    skills: 'Innovation and strategic application',
    responsibility: 'Senior leadership and strategic decisions',
    complexity: 'High-level innovation and research'
  },
  8: {
    name: 'Expert',
    knowledge: 'Research-level expertise',
    skills: 'Cutting-edge innovation and research',
    responsibility: 'Highest level leadership',
    complexity: 'Groundbreaking research and innovation'
  }
};

const SKILL_TAXONOMY = {
  'javascript': { category: 'technical', baseLevel: 3 },
  'python': { category: 'technical', baseLevel: 3 },
  'java': { category: 'technical', baseLevel: 3 },
  'react': { category: 'technical', baseLevel: 4 },
  'node.js': { category: 'technical', baseLevel: 4 },
  'mongodb': { category: 'technical', baseLevel: 3 },
  'sql': { category: 'technical', baseLevel: 3 },
  'machine learning': { category: 'technical', baseLevel: 6 },
  'data science': { category: 'technical', baseLevel: 5 },
  'cloud computing': { category: 'technical', baseLevel: 4 },
  'communication': { category: 'soft', baseLevel: 2 },
  'leadership': { category: 'soft', baseLevel: 5 },
  'teamwork': { category: 'soft', baseLevel: 2 },
  'project management': { category: 'soft', baseLevel: 5 },
  'problem solving': { category: 'soft', baseLevel: 3 }
};

const mapSkillToNSQF = (skillName, credentialType, experience) => {
  const normalizedSkill = skillName.toLowerCase();
  const taxonomy = SKILL_TAXONOMY[normalizedSkill] || { category: 'technical', baseLevel: 3 };
  
  let level = taxonomy.baseLevel;
  
  if (credentialType === 'certification') level += 1;
  if (credentialType === 'experience' && experience > 3) level += 1;
  if (credentialType === 'education') level += 0.5;
  
  level = Math.min(Math.round(level), 8);
  level = Math.max(level, 1);
  
  return {
    nsqfLevel: level,
    category: taxonomy.category,
    competency: NSQF_LEVELS[level]
  };
};

const calculateProficiency = (sources, recency) => {
  const sourceWeight = sources.length * 15;
  const recencyWeight = recency;
  const baseScore = 50;
  
  let proficiency = baseScore + sourceWeight + (recencyWeight * 0.3);
  return Math.min(Math.round(proficiency), 100);
};

const calculateRecencyScore = (lastVerifiedDate) => {
  if (!lastVerifiedDate) return 0;
  
  const now = new Date();
  const verified = new Date(lastVerifiedDate);
  const daysDiff = (now - verified) / (1000 * 60 * 60 * 24);
  
  if (daysDiff < 30) return 100;
  if (daysDiff < 90) return 90;
  if (daysDiff < 180) return 75;
  if (daysDiff < 365) return 60;
  if (daysDiff < 730) return 40;
  return 20;
};

module.exports = {
  NSQF_LEVELS,
  SKILL_TAXONOMY,
  mapSkillToNSQF,
  calculateProficiency,
  calculateRecencyScore
};
