const cron = require('node-cron');
const Credential = require('../models/Credential');
const CandidateSkillGraph = require('../models/CandidateSkillGraph');
const skillMappingService = require('./skillMappingService');
const { calculateRecencyScore } = require('../utils/nsqfMapper');

let jobQueue = [];
let isProcessing = false;

const addToQueue = (job) => {
  jobQueue.push(job);
  processQueue();
};

const processQueue = async () => {
  if (isProcessing || jobQueue.length === 0) return;

  isProcessing = true;
  const job = jobQueue.shift();

  try {
    await job.handler(job.data);
    console.log(`✓ Completed job: ${job.type}`);
  } catch (error) {
    console.error(`✗ Failed job: ${job.type}`, error.message);
  }

  isProcessing = false;
  if (jobQueue.length > 0) {
    setTimeout(processQueue, 100);
  }
};

const updateSkillGraphJob = async (candidateId) => {
  await skillMappingService.updateCandidateSkillGraph(candidateId);
  console.log(`Updated skill graph for candidate: ${candidateId}`);
};

const updateRecencyScoresJob = async () => {
  const skillGraphs = await CandidateSkillGraph.find({});
  
  for (const graph of skillGraphs) {
    let updated = false;
    
    for (const skill of graph.skills) {
      const newRecencyScore = calculateRecencyScore(skill.lastVerified);
      if (skill.recencyScore !== newRecencyScore) {
        skill.recencyScore = newRecencyScore;
        updated = true;
      }
    }
    
    if (updated) {
      graph.lastUpdated = new Date();
      await graph.save();
    }
  }
  
  console.log(`Updated recency scores for ${skillGraphs.length} candidates`);
};

const checkExpiredCredentials = async () => {
  const expiredCredentials = await Credential.find({
    expiryDate: { $lt: new Date() },
    verificationStatus: 'verified'
  });

  for (const credential of expiredCredentials) {
    credential.verificationStatus = 'revoked';
    await credential.save();
    
    addToQueue({
      type: 'update_skill_graph',
      data: credential.candidateId,
      handler: updateSkillGraphJob
    });
  }

  if (expiredCredentials.length > 0) {
    console.log(`Marked ${expiredCredentials.length} credentials as revoked`);
  }
};

const startBackgroundJobs = () => {
  cron.schedule('0 2 * * *', async () => {
    console.log('Running daily recency score update...');
    await updateRecencyScoresJob();
  });

  cron.schedule('0 */6 * * *', async () => {
    console.log('Checking for expired credentials...');
    await checkExpiredCredentials();
  });

  console.log('✓ Background jobs scheduled');
};

module.exports = { 
  startBackgroundJobs, 
  addToQueue,
  updateSkillGraphJob
};
