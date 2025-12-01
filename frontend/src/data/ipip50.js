/**
 * IPIP-50 Big Five Questionnaire
 *
 * International Personality Item Pool - 50 items
 * 10 items per Big Five trait
 *
 * Scoring: 1 (Very Inaccurate) to 5 (Very Accurate)
 *
 * Reference: Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure.
 */

export const IPIP50_ITEMS = [
  // EXTRAVERSION (10 items)
  { id: 1, trait: 'extraversion', text: 'I am the life of the party.', keyed: 'plus' },
  { id: 2, trait: 'extraversion', text: "I don't talk a lot.", keyed: 'minus' },
  { id: 3, trait: 'extraversion', text: 'I feel comfortable around people.', keyed: 'plus' },
  { id: 4, trait: 'extraversion', text: 'I keep in the background.', keyed: 'minus' },
  { id: 5, trait: 'extraversion', text: 'I start conversations.', keyed: 'plus' },
  { id: 6, trait: 'extraversion', text: 'I have little to say.', keyed: 'minus' },
  { id: 7, trait: 'extraversion', text: 'I talk to a lot of different people at parties.', keyed: 'plus' },
  { id: 8, trait: 'extraversion', text: "I don't like to draw attention to myself.", keyed: 'minus' },
  { id: 9, trait: 'extraversion', text: "I don't mind being the center of attention.", keyed: 'plus' },
  { id: 10, trait: 'extraversion', text: 'I am quiet around strangers.', keyed: 'minus' },

  // AGREEABLENESS (10 items)
  { id: 11, trait: 'agreeableness', text: 'I feel little concern for others.', keyed: 'minus' },
  { id: 12, trait: 'agreeableness', text: 'I am interested in people.', keyed: 'plus' },
  { id: 13, trait: 'agreeableness', text: 'I insult people.', keyed: 'minus' },
  { id: 14, trait: 'agreeableness', text: "I sympathize with others' feelings.", keyed: 'plus' },
  { id: 15, trait: 'agreeableness', text: "I am not interested in other people's problems.", keyed: 'minus' },
  { id: 16, trait: 'agreeableness', text: 'I have a soft heart.', keyed: 'plus' },
  { id: 17, trait: 'agreeableness', text: 'I am not really interested in others.', keyed: 'minus' },
  { id: 18, trait: 'agreeableness', text: 'I take time out for others.', keyed: 'plus' },
  { id: 19, trait: 'agreeableness', text: "I feel others' emotions.", keyed: 'plus' },
  { id: 20, trait: 'agreeableness', text: 'I make people feel at ease.', keyed: 'plus' },

  // CONSCIENTIOUSNESS (10 items)
  { id: 21, trait: 'conscientiousness', text: 'I am always prepared.', keyed: 'plus' },
  { id: 22, trait: 'conscientiousness', text: 'I leave my belongings around.', keyed: 'minus' },
  { id: 23, trait: 'conscientiousness', text: 'I pay attention to details.', keyed: 'plus' },
  { id: 24, trait: 'conscientiousness', text: 'I make a mess of things.', keyed: 'minus' },
  { id: 25, trait: 'conscientiousness', text: 'I get chores done right away.', keyed: 'plus' },
  { id: 26, trait: 'conscientiousness', text: 'I often forget to put things back in their proper place.', keyed: 'minus' },
  { id: 27, trait: 'conscientiousness', text: 'I like order.', keyed: 'plus' },
  { id: 28, trait: 'conscientiousness', text: 'I shirk my duties.', keyed: 'minus' },
  { id: 29, trait: 'conscientiousness', text: 'I follow a schedule.', keyed: 'plus' },
  { id: 30, trait: 'conscientiousness', text: 'I am exacting in my work.', keyed: 'plus' },

  // NEUROTICISM (10 items)
  { id: 31, trait: 'neuroticism', text: 'I get stressed out easily.', keyed: 'plus' },
  { id: 32, trait: 'neuroticism', text: 'I am relaxed most of the time.', keyed: 'minus' },
  { id: 33, trait: 'neuroticism', text: 'I worry about things.', keyed: 'plus' },
  { id: 34, trait: 'neuroticism', text: 'I seldom feel blue.', keyed: 'minus' },
  { id: 35, trait: 'neuroticism', text: 'I am easily disturbed.', keyed: 'plus' },
  { id: 36, trait: 'neuroticism', text: 'I get upset easily.', keyed: 'plus' },
  { id: 37, trait: 'neuroticism', text: 'I change my mood a lot.', keyed: 'plus' },
  { id: 38, trait: 'neuroticism', text: 'I have frequent mood swings.', keyed: 'plus' },
  { id: 39, trait: 'neuroticism', text: 'I get irritated easily.', keyed: 'plus' },
  { id: 40, trait: 'neuroticism', text: 'I often feel blue.', keyed: 'plus' },

  // OPENNESS (10 items)
  { id: 41, trait: 'openness', text: 'I have a rich vocabulary.', keyed: 'plus' },
  { id: 42, trait: 'openness', text: 'I have difficulty understanding abstract ideas.', keyed: 'minus' },
  { id: 43, trait: 'openness', text: 'I have a vivid imagination.', keyed: 'plus' },
  { id: 44, trait: 'openness', text: 'I am not interested in abstract ideas.', keyed: 'minus' },
  { id: 45, trait: 'openness', text: 'I have excellent ideas.', keyed: 'plus' },
  { id: 46, trait: 'openness', text: 'I do not have a good imagination.', keyed: 'minus' },
  { id: 47, trait: 'openness', text: 'I am quick to understand things.', keyed: 'plus' },
  { id: 48, trait: 'openness', text: 'I use difficult words.', keyed: 'plus' },
  { id: 49, trait: 'openness', text: 'I spend time reflecting on things.', keyed: 'plus' },
  { id: 50, trait: 'openness', text: 'I am full of ideas.', keyed: 'plus' }
];

/**
 * Attention check items (inserted at strategic positions)
 */
export const ATTENTION_CHECKS = [
  {
    position: 12, // Insert after item 12
    text: 'Please select "Very Accurate" for this item to show you are paying attention.',
    expected: 5
  },
  {
    position: 25,
    text: 'To demonstrate attention, please select "Very Inaccurate" for this item.',
    expected: 1
  },
  {
    position: 40,
    text: 'For quality control, please choose "Moderately Accurate" here.',
    expected: 4
  }
];

/**
 * Response scale
 */
export const RESPONSE_SCALE = [
  { value: 1, label: 'Very Inaccurate' },
  { value: 2, label: 'Moderately Inaccurate' },
  { value: 3, label: 'Neither Accurate nor Inaccurate' },
  { value: 4, label: 'Moderately Accurate' },
  { value: 5, label: 'Very Accurate' }
];

/**
 * Calculate Big Five scores from responses
 *
 * @param {Array} responses - Array of {itemId, response} objects
 * @returns {Object} - Big Five scores as z-scores
 */
export function calculateBigFiveScores(responses) {
  const traits = {
    extraversion: [],
    agreeableness: [],
    conscientiousness: [],
    neuroticism: [],
    openness: []
  };

  // Group responses by trait
  responses.forEach(r => {
    const item = IPIP50_ITEMS.find(i => i.id === r.itemId);
    if (!item) return;

    let score = r.response;

    // Reverse-score minus-keyed items
    if (item.keyed === 'minus') {
      score = 6 - score; // Reverse: 1->5, 2->4, 3->3, 4->2, 5->1
    }

    traits[item.trait].push(score);
  });

  // Calculate mean scores and convert to z-scores
  const results = {};

  Object.keys(traits).forEach(trait => {
    const scores = traits[trait];

    if (scores.length === 0) {
      results[trait] = { raw: 0, z: 0, items: 0 };
      return;
    }

    // Calculate raw mean (1-5 scale)
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Convert to z-score
    // Population norms (approximated from IPIP literature):
    // Mean ≈ 3.0, SD ≈ 0.7 for most traits
    const populationMean = 3.0;
    const populationSD = 0.7;
    const z = (mean - populationMean) / populationSD;

    results[trait] = {
      raw: mean,
      z: z,
      items: scores.length
    };
  });

  return results;
}

/**
 * Get trait interpretation
 */
export function getTraitInterpretation(trait, zScore) {
  const interpretations = {
    extraversion: {
      high: 'You tend to be outgoing, energetic, and enjoy social situations.',
      average: 'You balance social engagement with alone time.',
      low: 'You tend to be reserved and prefer smaller social circles.'
    },
    agreeableness: {
      high: 'You are compassionate, cooperative, and value harmony.',
      average: 'You balance empathy with assertiveness.',
      low: 'You tend to be more competitive and straightforward.'
    },
    conscientiousness: {
      high: 'You are organized, responsible, and goal-oriented.',
      average: 'You balance planning with flexibility.',
      low: 'You tend to be spontaneous and prefer flexibility.'
    },
    neuroticism: {
      high: 'You may experience emotions intensely and be sensitive to stress.',
      average: 'You have moderate emotional stability.',
      low: 'You tend to be calm and emotionally stable.'
    },
    openness: {
      high: 'You are imaginative, curious, and appreciate new experiences.',
      average: 'You balance novelty with tradition.',
      low: 'You tend to prefer familiarity and concrete experiences.'
    }
  };

  let level = 'average';
  if (zScore > 0.5) level = 'high';
  if (zScore < -0.5) level = 'low';

  return interpretations[trait]?.[level] || '';
}

export default {
  IPIP50_ITEMS,
  ATTENTION_CHECKS,
  RESPONSE_SCALE,
  calculateBigFiveScores,
  getTraitInterpretation
};
