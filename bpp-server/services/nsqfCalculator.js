/**
 * NSQF Level Calculator
 *
 * Inputs:
 *  - marks (0–100)
 *  - credits (number)
 *  - difficulty (1–5)
 *
 * Output:
 *  - NSQF Level (1–8)
 *
 * Rationale:
 *  - Marks → performance
 *  - Credits → learning volume
 *  - Difficulty → skill complexity
 */
function calculateNSQFLevel({ marks, credits, difficulty }) {
  // Normalize components to 0–1
  const performanceScore = marks / 100;          // 0–1
  const creditScore = Math.min(credits / 5, 1);  // cap at 1
  const difficultyScore = difficulty / 5;        // 0–1

  // Weighted aggregate (explainable weights)
  const compositeScore =
    0.5 * performanceScore +
    0.3 * creditScore +
    0.2 * difficultyScore;

  // Map composite score to NSQF level (1–8)
  if (compositeScore >= 0.85) return 8;
  if (compositeScore >= 0.75) return 7;
  if (compositeScore >= 0.65) return 6;
  if (compositeScore >= 0.55) return 5;
  if (compositeScore >= 0.45) return 4;
  if (compositeScore >= 0.35) return 3;
  if (compositeScore >= 0.25) return 2;
  return 1;
}

module.exports = {
  calculateNSQFLevel
};
