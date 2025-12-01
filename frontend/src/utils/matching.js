/**
 * Matching Algorithm - Personality-Based Compatibility
 *
 * Implements the matching algorithm from the research specification:
 * - Uncertainty-aware similarity (Mahalanobis distance)
 * - Hard constraint filtering
 * - Diversification (Maximal Marginal Relevance)
 *
 * Research anchors:
 * - Personality similarity has modest predictive power for relationship success
 * - Focus on reducing obviously poor matches rather than guaranteeing good ones
 */

/**
 * Compute Gaussian similarity score
 *
 * similarity = exp(-0.5 * distance)
 */
export function computeSimilarity(traits1, traits2, weights = null) {
  const traitNames = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

  // Default weights (can be tuned based on research)
  const defaultWeights = {
    openness: 1.0,
    conscientiousness: 1.2, // Slightly higher weight (predicts relationship satisfaction)
    extraversion: 1.0,
    agreeableness: 1.2, // Slightly higher weight (predicts conflict resolution)
    neuroticism: 0.8 // Lower weight (complementarity may be beneficial)
  };

  const w = weights || defaultWeights;

  let distance = 0;

  traitNames.forEach(trait => {
    const score1 = traits1[trait]?.score || 0;
    const score2 = traits2[trait]?.score || 0;

    const diff = score1 - score2;
    distance += w[trait] * diff * diff;
  });

  // Gaussian kernel
  const similarity = Math.exp(-0.5 * distance);

  return similarity;
}

/**
 * Compute uncertainty-aware similarity (Mahalanobis distance)
 *
 * Accounts for prediction uncertainty in both profiles
 */
export function computeUncertaintyAwareSimilarity(traits1, traits2) {
  const traitNames = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];

  let distance = 0;

  traitNames.forEach(trait => {
    const t1 = traits1[trait] || { score: 0, uncertainty: 1.0 };
    const t2 = traits2[trait] || { score: 0, uncertainty: 1.0 };

    const diff = t1.score - t2.score;

    // Combined variance (sum of individual uncertainties + population variance)
    const combinedVar = t1.uncertainty * t1.uncertainty +
                        t2.uncertainty * t2.uncertainty +
                        1.0; // Population variance

    // Mahalanobis distance component
    distance += (diff * diff) / combinedVar;
  });

  const similarity = Math.exp(-0.5 * distance);

  return similarity;
}

/**
 * Apply hard filters
 *
 * Returns true if candidate passes all hard constraints
 */
export function passesHardFilters(userPrefs, candidate) {
  // Age filter
  if (userPrefs.minAge && candidate.age < userPrefs.minAge) return false;
  if (userPrefs.maxAge && candidate.age > userPrefs.maxAge) return false;

  // Gender filter
  if (userPrefs.seekingGender && userPrefs.seekingGender !== 'any') {
    if (candidate.gender !== userPrefs.seekingGender) return false;
  }

  // Add more filters as needed (distance, etc.)

  return true;
}

/**
 * Compute final match score
 *
 * final_score = alpha * similarity + beta * complementarity - gamma * penalties
 */
export function computeFinalScore(userTraits, candidateTraits, userPrefs, candidate) {
  const alpha = 0.7; // Similarity weight
  const beta = 0.2; // Complementarity weight
  const gamma = 1.0; // Penalty weight

  // Similarity component
  const similarity = computeUncertaintyAwareSimilarity(userTraits, candidateTraits);

  // Complementarity component (placeholder - can be expanded)
  // E.g., moderate neuroticism difference may be beneficial
  let complementarity = 0;

  // For neuroticism: slight difference can be good (emotional balance)
  const nDiff = Math.abs(
    (userTraits.neuroticism?.score || 0) - (candidateTraits.neuroticism?.score || 0)
  );
  if (nDiff > 0.3 && nDiff < 1.0) {
    complementarity += 0.2;
  }

  // Penalties
  let penalties = 0;

  // No hard filter violations if we got here, but could add soft penalties
  // E.g., age difference penalty
  // (not implemented in this version)

  const finalScore = alpha * similarity + beta * complementarity - gamma * penalties;

  return {
    finalScore,
    similarity,
    complementarity,
    penalties
  };
}

/**
 * Generate matches for user
 *
 * @param {Object} userTraits - User's Big Five scores
 * @param {Object} userPrefs - User's preferences
 * @param {Array} candidatePool - Array of candidate users
 * @param {number} topK - Number of top matches to return
 * @returns {Array} - Ranked matches
 */
export function generateMatches(userTraits, userPrefs, candidatePool, topK = 20) {
  // Step 1: Apply hard filters
  const filteredCandidates = candidatePool.filter(candidate =>
    passesHardFilters(userPrefs, candidate)
  );

  console.log(`Filtered ${candidatePool.length} -> ${filteredCandidates.length} candidates`);

  // Step 2: Compute scores for all candidates
  const scoredCandidates = filteredCandidates.map(candidate => {
    // Extract candidate traits
    const candidateTraits = {
      openness: { score: candidate.trait_o, uncertainty: 0.5 },
      conscientiousness: { score: candidate.trait_c, uncertainty: 0.5 },
      extraversion: { score: candidate.trait_e, uncertainty: 0.5 },
      agreeableness: { score: candidate.trait_a, uncertainty: 0.5 },
      neuroticism: { score: candidate.trait_n, uncertainty: 0.5 }
    };

    const scores = computeFinalScore(userTraits, candidateTraits, userPrefs, candidate);

    return {
      candidate,
      ...scores
    };
  });

  // Step 3: Sort by final score
  scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);

  // Step 4: Take top K
  const topMatches = scoredCandidates.slice(0, topK);

  // Step 5: (Optional) Apply MMR diversification
  // For now, we'll skip this to keep it simple, but it's in the spec

  // Assign ranks
  topMatches.forEach((match, index) => {
    match.rank = index + 1;
  });

  return topMatches;
}

/**
 * Maximal Marginal Relevance (MMR) diversification
 *
 * Balances relevance (score) with diversity (dissimilarity to already selected)
 *
 * @param {Array} candidates - Scored candidates
 * @param {number} lambda - Balance parameter (1 = pure relevance, 0 = pure diversity)
 * @param {number} k - Number to select
 * @returns {Array} - Diversified selection
 */
export function applyMMR(candidates, lambda = 0.7, k = 10) {
  if (candidates.length <= k) return candidates;

  const selected = [];
  const remaining = [...candidates];

  // Select first (highest scoring)
  selected.push(remaining.shift());

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestMMR = -Infinity;

    remaining.forEach((candidate, idx) => {
      // Relevance component
      const relevance = candidate.finalScore;

      // Diversity component: max similarity to already selected
      const maxSim = Math.max(...selected.map(s =>
        computeSimilarity(
          extractTraits(candidate.candidate),
          extractTraits(s.candidate)
        )
      ));

      // MMR score
      const mmr = lambda * relevance - (1 - lambda) * maxSim;

      if (mmr > bestMMR) {
        bestMMR = mmr;
        bestIdx = idx;
      }
    });

    // Add best MMR candidate to selected
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected;
}

/**
 * Extract traits object from candidate
 */
function extractTraits(candidate) {
  return {
    openness: { score: candidate.trait_o || 0 },
    conscientiousness: { score: candidate.trait_c || 0 },
    extraversion: { score: candidate.trait_e || 0 },
    agreeableness: { score: candidate.trait_a || 0 },
    neuroticism: { score: candidate.trait_n || 0 }
  };
}

/**
 * Explain match (for UI display)
 */
export function explainMatch(userTraits, candidateTraits) {
  const traitNames = {
    openness: 'Openness',
    conscientiousness: 'Conscientiousness',
    extraversion: 'Extraversion',
    agreeableness: 'Agreeableness',
    neuroticism: 'Emotional Stability' // Invert for display
  };

  const similarities = {};
  const differences = {};

  Object.keys(traitNames).forEach(trait => {
    const userScore = userTraits[trait]?.score || 0;
    const candScore = candidateTraits[trait]?.score || 0;
    const diff = Math.abs(userScore - candScore);

    if (diff < 0.5) {
      similarities[trait] = {
        name: traitNames[trait],
        userScore,
        candScore,
        match: 'high'
      };
    } else if (diff > 1.5) {
      differences[trait] = {
        name: traitNames[trait],
        userScore,
        candScore,
        match: 'low'
      };
    }
  });

  return { similarities, differences };
}

export default {
  computeSimilarity,
  computeUncertaintyAwareSimilarity,
  passesHardFilters,
  computeFinalScore,
  generateMatches,
  applyMMR,
  explainMatch
};
