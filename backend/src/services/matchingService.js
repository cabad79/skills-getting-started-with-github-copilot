const { Profile, User, Match } = require('../models');
const { Op } = require('sequelize');

class MatchingService {
  /**
   * Calculate Mahalanobis distance-based similarity between two personality profiles
   * @param {object} traits1 - First user's Big Five traits
   * @param {object} traits2 - Second user's Big Five traits
   * @returns {number} Similarity score (0-1, higher is better)
   */
  calculateSimilarity(traits1, traits2) {
    const traitNames = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    let distance = 0;

    traitNames.forEach(trait => {
      const t1 = traits1[trait] || { score: 0, uncertainty: 1.0 };
      const t2 = traits2[trait] || { score: 0, uncertainty: 1.0 };

      // Calculate difference
      const diff = t1.score - t2.score;

      // Combined variance (uncertainty-weighted)
      const combinedVar = (t1.uncertainty * t1.uncertainty) +
                         (t2.uncertainty * t2.uncertainty) +
                         1.0; // Add small constant to prevent division by zero

      // Squared Mahalanobis distance component
      distance += (diff * diff) / combinedVar;
    });

    // Convert distance to similarity score (exponential decay)
    // Distance of 0 = similarity of 1.0
    // Distance increases = similarity decreases exponentially
    const similarity = Math.exp(-0.5 * distance);

    return Math.max(0, Math.min(1, similarity)); // Clamp to [0, 1]
  }

  /**
   * Calculate per-trait compatibility breakdown
   * @param {object} traits1 - First user's traits
   * @param {object} traits2 - Second user's traits
   * @returns {object} Per-trait compatibility scores
   */
  calculateCompatibilityBreakdown(traits1, traits2) {
    const traitNames = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    const breakdown = {};

    traitNames.forEach(trait => {
      const t1 = traits1[trait] || { score: 0, uncertainty: 1.0 };
      const t2 = traits2[trait] || { score: 0, uncertainty: 1.0 };

      // Calculate normalized difference (0-1 scale, 1 is perfect match)
      const diff = Math.abs(t1.score - t2.score);
      const maxDiff = 4.0; // Big Five typically ranges -2 to +2
      const compatibility = 1 - (diff / maxDiff);

      breakdown[trait] = {
        score: Math.max(0, Math.min(1, compatibility)),
        user1_score: t1.score,
        user2_score: t2.score,
        difference: diff
      };
    });

    return breakdown;
  }

  /**
   * Find next match for a user
   * @param {string} userId - User ID
   * @returns {object|null} Match object or null
   */
  async findNextMatch(userId) {
    try {
      // Get user's profile
      const userProfile = await Profile.findOne({
        where: { user_id: userId },
        include: [{
          model: User,
          as: 'user'
        }]
      });

      if (!userProfile || !userProfile.personality_traits) {
        throw new Error('User profile incomplete');
      }

      // Get user's preferences
      const preferences = userProfile.preferences || {};
      const userGender = userProfile.user.encrypted_gender ?
        userProfile.user.decryptField(userProfile.user.encrypted_gender, process.env.ENCRYPTION_KEY) :
        null;

      // Find users already shown to this user
      const existingMatches = await Match.findAll({
        where: { viewer_user_id: userId },
        attributes: ['matched_user_id']
      });

      const excludeUserIds = existingMatches.map(m => m.matched_user_id);
      excludeUserIds.push(userId); // Exclude self

      // Build query for potential matches
      const whereClause = {
        user_id: {
          [Op.notIn]: excludeUserIds
        },
        is_visible: true,
        is_searchable: true
      };

      // Get all potential matches
      const potentialMatches = await Profile.findAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          where: {
            is_active: true,
            is_banned: false,
            profile_complete: true
          }
        }],
        limit: 100 // Get top 100 to score and pick best
      });

      if (potentialMatches.length === 0) {
        return null; // No more matches available
      }

      // Score all potential matches
      const scoredMatches = potentialMatches.map(candidateProfile => {
        const similarity = this.calculateSimilarity(
          userProfile.personality_traits,
          candidateProfile.personality_traits
        );

        const breakdown = this.calculateCompatibilityBreakdown(
          userProfile.personality_traits,
          candidateProfile.personality_traits
        );

        return {
          profile: candidateProfile,
          similarity,
          breakdown
        };
      });

      // Sort by similarity (highest first)
      scoredMatches.sort((a, b) => b.similarity - a.similarity);

      // Pick the best match
      const bestMatch = scoredMatches[0];

      // Create match record
      const match = await Match.create({
        viewer_user_id: userId,
        matched_user_id: bestMatch.profile.user_id,
        similarity_score: bestMatch.similarity,
        compatibility_breakdown: bestMatch.breakdown,
        status: 'shown',
        shown_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Increment match statistics
      await bestMatch.profile.increment('total_matches_shown');
      await bestMatch.profile.update({ last_match_shown_at: new Date() });

      return match;
    } catch (error) {
      console.error('Find match error:', error);
      throw error;
    }
  }

  /**
   * Get detailed match information
   * @param {string} matchId - Match ID
   * @param {string} userId - Requesting user ID
   * @returns {object} Match details
   */
  async getMatchDetails(matchId, userId) {
    try {
      const match = await Match.findOne({
        where: {
          match_id: matchId,
          viewer_user_id: userId
        },
        include: [
          {
            model: User,
            as: 'matchedUser',
            attributes: ['user_id', 'age', 'created_at'],
            include: [{
              model: Profile,
              as: 'profile',
              attributes: ['personality_traits', 'profile_quality_score']
            }]
          }
        ]
      });

      if (!match) {
        throw new Error('Match not found');
      }

      // Decrypt basic info (always shown)
      const matchedUser = match.matchedUser;
      const gender = matchedUser.encrypted_gender ?
        matchedUser.decryptField(matchedUser.encrypted_gender, process.env.ENCRYPTION_KEY) :
        null;
      const location = matchedUser.encrypted_location ?
        matchedUser.decryptField(matchedUser.encrypted_location, process.env.ENCRYPTION_KEY) :
        null;

      // Basic profile (always visible)
      const basicProfile = {
        match_id: match.match_id,
        age: matchedUser.age,
        gender,
        location: location ? location.split(',')[0] : null, // Just city, not full address
        similarity_score: match.similarity_score,
        compatibility_breakdown: match.compatibility_breakdown,
        profile_quality: matchedUser.profile?.profile_quality_score || 0,
        is_unlocked: match.is_unlocked,
        status: match.status
      };

      // If unlocked, include contact info
      if (match.is_unlocked) {
        basicProfile.email = matchedUser.email;
        basicProfile.user_id = matchedUser.user_id;
        basicProfile.personality_traits = matchedUser.profile?.personality_traits;
        basicProfile.chat_enabled = match.chat_enabled;
      }

      return basicProfile;
    } catch (error) {
      console.error('Get match details error:', error);
      throw error;
    }
  }

  /**
   * Check if a user can receive new matches
   * @param {string} userId - User ID
   * @returns {boolean} True if user can receive matches
   */
  async canReceiveMatches(userId) {
    const user = await User.findByPk(userId, {
      include: ['profile']
    });

    if (!user) return false;
    if (!user.is_active || user.is_banned) return false;
    if (!user.profile_complete) return false;
    if (!user.questionnaire_complete) return false;
    if (!user.profile) return false;
    if (!user.profile.personality_traits) return false;

    return true;
  }
}

module.exports = new MatchingService();
