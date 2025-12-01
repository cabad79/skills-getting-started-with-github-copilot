import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentUser,
  getBigFiveScores,
  getUserPool,
  initializeUserPool,
  saveMatch,
  getMatches,
  saveUserPreferences
} from '../utils/database';
import { generateMatches, explainMatch } from '../utils/matching';
import './Matches.css';

function Matches() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userScores, setUserScores] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    minAge: 18,
    maxAge: 100,
    seekingGender: 'any'
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    initializeMatching();
  }, []);

  const initializeMatching = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/consent');
      return;
    }

    const scores = getBigFiveScores(currentUser.user_id);

    // Check if user pool exists
    let pool = getUserPool();
    if (pool.length === 0) {
      console.log('Initializing user pool...');
      initializeUserPool(50); // Create 50 simulated candidates
      pool = getUserPool();
    }

    setUser(currentUser);
    setUserScores(scores);

    // Generate matches
    generateMatchesForUser(scores, preferences, pool);

    setLoading(false);
  };

  const generateMatchesForUser = (scores, prefs, pool) => {
    // Convert scores to format expected by matching algorithm
    const userTraits = {
      openness: scores.openness,
      conscientiousness: scores.conscientiousness,
      extraversion: scores.extraversion,
      agreeableness: scores.agreeableness,
      neuroticism: scores.neuroticism
    };

    const matches = generateMatches(userTraits, prefs, pool, 20);

    // Save matches to database
    matches.forEach(match => {
      saveMatch(user?.user_id || 'unknown', {
        candidateId: match.candidate.pool_user_id,
        similarityScore: match.similarity,
        compatibilityScore: match.complementarity,
        finalScore: match.finalScore,
        rank: match.rank
      });
    });

    setMatches(matches);
  };

  const handlePreferencesUpdate = () => {
    saveUserPreferences(user.user_id, preferences);
    const pool = getUserPool();
    generateMatchesForUser(userScores, preferences, pool);
    setShowPreferences(false);
  };

  const handleMatchClick = (match) => {
    // Extract candidate traits
    const candidateTraits = {
      openness: { score: match.candidate.trait_o },
      conscientiousness: { score: match.candidate.trait_c },
      extraversion: { score: match.candidate.trait_e },
      agreeableness: { score: match.candidate.trait_a },
      neuroticism: { score: match.candidate.trait_n }
    };

    const explanation = explainMatch(userScores, candidateTraits);
    setSelectedMatch({ ...match, explanation });
  };

  if (loading) {
    return <div className="loading">Loading matches...</div>;
  }

  return (
    <div className="matches">
      <div className="matches-header">
        <h2>Your Compatible Matches</h2>
        <p>Based on personality similarity and complementarity</p>
        <button className="btn btn-secondary" onClick={() => setShowPreferences(!showPreferences)}>
          ⚙️ Preferences
        </button>
      </div>

      {showPreferences && (
        <div className="preferences-panel">
          <h3>Matching Preferences</h3>
          <div className="prefs-form">
            <div className="form-group">
              <label>Age Range</label>
              <div className="range-inputs">
                <input
                  type="number"
                  value={preferences.minAge}
                  onChange={(e) => setPreferences({ ...preferences, minAge: parseInt(e.target.value) })}
                  min="18"
                  max="100"
                />
                <span>to</span>
                <input
                  type="number"
                  value={preferences.maxAge}
                  onChange={(e) => setPreferences({ ...preferences, maxAge: parseInt(e.target.value) })}
                  min="18"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Seeking</label>
              <select
                value={preferences.seekingGender}
                onChange={(e) => setPreferences({ ...preferences, seekingGender: e.target.value })}
              >
                <option value="any">Any Gender</option>
                <option value="male">Men</option>
                <option value="female">Women</option>
                <option value="non-binary">Non-binary</option>
              </select>
            </div>

            <button className="btn btn-primary" onClick={handlePreferencesUpdate}>
              Update Matches
            </button>
          </div>
        </div>
      )}

      <div className="matches-grid">
        {matches.length === 0 ? (
          <div className="no-matches">
            <h3>No matches found</h3>
            <p>Try adjusting your preferences</p>
          </div>
        ) : (
          matches.map((match, index) => (
            <div
              key={index}
              className="match-card"
              onClick={() => handleMatchClick(match)}
            >
              <div className="match-rank">#{match.rank}</div>

              <div className="match-avatar">
                {match.candidate.gender === 'male' ? '👨' : match.candidate.gender === 'female' ? '👩' : '🧑'}
              </div>

              <div className="match-info">
                <h3>Match #{match.rank}</h3>
                <p className="match-age">{match.candidate.age} years old • {match.candidate.gender}</p>
              </div>

              <div className="match-scores">
                <div className="score-item">
                  <span className="score-label">Compatibility</span>
                  <div className="score-bar-small">
                    <div
                      className="score-fill"
                      style={{ width: `${match.finalScore * 100}%` }}
                    ></div>
                  </div>
                  <span className="score-value">{(match.finalScore * 100).toFixed(0)}%</span>
                </div>
              </div>

              <div className="match-traits-preview">
                <div className="trait-mini">
                  O: {match.candidate.trait_o.toFixed(1)}
                </div>
                <div className="trait-mini">
                  C: {match.candidate.trait_c.toFixed(1)}
                </div>
                <div className="trait-mini">
                  E: {match.candidate.trait_e.toFixed(1)}
                </div>
                <div className="trait-mini">
                  A: {match.candidate.trait_a.toFixed(1)}
                </div>
                <div className="trait-mini">
                  N: {match.candidate.trait_n.toFixed(1)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedMatch && (
        <div className="match-detail-modal" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedMatch(null)}>×</button>

            <h2>Match Details</h2>

            <div className="match-detail-header">
              <div className="match-avatar-large">
                {selectedMatch.candidate.gender === 'male' ? '👨' : selectedMatch.candidate.gender === 'female' ? '👩' : '🧑'}
              </div>
              <div>
                <h3>Match #{selectedMatch.rank}</h3>
                <p>{selectedMatch.candidate.age} years old • {selectedMatch.candidate.gender}</p>
              </div>
            </div>

            <div className="compatibility-breakdown">
              <h3>Compatibility Score: {(selectedMatch.finalScore * 100).toFixed(0)}%</h3>

              <div className="score-breakdown">
                <div className="breakdown-item">
                  <span>Similarity</span>
                  <div className="breakdown-bar">
                    <div style={{ width: `${selectedMatch.similarity * 100}%` }}></div>
                  </div>
                  <span>{(selectedMatch.similarity * 100).toFixed(0)}%</span>
                </div>
                <div className="breakdown-item">
                  <span>Complementarity</span>
                  <div className="breakdown-bar">
                    <div style={{ width: `${selectedMatch.complementarity * 100}%` }}></div>
                  </div>
                  <span>{(selectedMatch.complementarity * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="personality-comparison">
              <h3>Personality Comparison</h3>

              {Object.keys(selectedMatch.explanation.similarities).length > 0 && (
                <div className="similarities">
                  <h4>✓ Strong Similarities</h4>
                  {Object.values(selectedMatch.explanation.similarities).map((sim, idx) => (
                    <p key={idx}>Both score similarly on <strong>{sim.name}</strong></p>
                  ))}
                </div>
              )}

              {Object.keys(selectedMatch.explanation.differences).length > 0 && (
                <div className="differences">
                  <h4>⚡ Notable Differences</h4>
                  {Object.values(selectedMatch.explanation.differences).map((diff, idx) => (
                    <p key={idx}>Different levels of <strong>{diff.name}</strong></p>
                  ))}
                </div>
              )}
            </div>

            <div className="trait-comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>Trait</th>
                    <th>You</th>
                    <th>Them</th>
                    <th>Similarity</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Openness</td>
                    <td>{userScores.openness.score.toFixed(2)}</td>
                    <td>{selectedMatch.candidate.trait_o.toFixed(2)}</td>
                    <td>{(1 - Math.abs(userScores.openness.score - selectedMatch.candidate.trait_o) / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Conscientiousness</td>
                    <td>{userScores.conscientiousness.score.toFixed(2)}</td>
                    <td>{selectedMatch.candidate.trait_c.toFixed(2)}</td>
                    <td>{(1 - Math.abs(userScores.conscientiousness.score - selectedMatch.candidate.trait_c) / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Extraversion</td>
                    <td>{userScores.extraversion.score.toFixed(2)}</td>
                    <td>{selectedMatch.candidate.trait_e.toFixed(2)}</td>
                    <td>{(1 - Math.abs(userScores.extraversion.score - selectedMatch.candidate.trait_e) / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Agreeableness</td>
                    <td>{userScores.agreeableness.score.toFixed(2)}</td>
                    <td>{selectedMatch.candidate.trait_a.toFixed(2)}</td>
                    <td>{(1 - Math.abs(userScores.agreeableness.score - selectedMatch.candidate.trait_a) / 4).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>Emotional Stability</td>
                    <td>{(-userScores.neuroticism.score).toFixed(2)}</td>
                    <td>{(-selectedMatch.candidate.trait_n).toFixed(2)}</td>
                    <td>{(1 - Math.abs(userScores.neuroticism.score - selectedMatch.candidate.trait_n) / 4).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="match-disclaimer">
              <p>
                <strong>Note:</strong> Personality compatibility is just one factor in relationship success.
                This score indicates potential compatibility based on Big Five research,
                but getting to know someone personally is essential.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="matches-footer">
        <button className="btn btn-secondary" onClick={() => navigate('/results')}>
          ← Back to Profile
        </button>
      </div>
    </div>
  );
}

export default Matches;
