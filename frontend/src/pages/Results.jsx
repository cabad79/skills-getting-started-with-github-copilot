import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getBigFiveScores } from '../utils/database';
import { getTraitInterpretation } from '../data/ipip50';
import './Results.css';

function Results() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [scores, setScores] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/consent');
      return;
    }

    const bigFiveScores = getBigFiveScores(currentUser.user_id);
    setUser(currentUser);
    setScores(bigFiveScores);
  }, [navigate]);

  if (!user || !scores) {
    return <div className="loading">Loading...</div>;
  }

  const traitInfo = {
    openness: {
      name: 'Openness to Experience',
      icon: '🎨',
      description: 'Imagination, curiosity, and appreciation for new experiences'
    },
    conscientiousness: {
      name: 'Conscientiousness',
      icon: '📋',
      description: 'Organization, responsibility, and goal-directed behavior'
    },
    extraversion: {
      name: 'Extraversion',
      icon: '🎉',
      description: 'Sociability, assertiveness, and energetic engagement with the world'
    },
    agreeableness: {
      name: 'Agreeableness',
      icon: '🤝',
      description: 'Compassion, cooperation, and concern for social harmony'
    },
    neuroticism: {
      name: 'Emotional Stability',
      icon: '🧘',
      description: 'Emotional resilience and stress management (inverse of neuroticism)',
      inverted: true
    }
  };

  const getScorePosition = (zScore, inverted = false) => {
    // Convert z-score to percentage for visualization
    // z-score range: roughly -3 to +3
    // map to 0-100%
    let displayScore = inverted ? -zScore : zScore;
    const percentage = Math.max(0, Math.min(100, ((displayScore + 3) / 6) * 100));
    return percentage;
  };

  const getScoreLabel = (zScore) => {
    if (zScore > 1.5) return 'Very High';
    if (zScore > 0.5) return 'High';
    if (zScore > -0.5) return 'Average';
    if (zScore > -1.5) return 'Low';
    return 'Very Low';
  };

  return (
    <div className="results">
      <div className="results-header">
        <h2>Your Personality Profile</h2>
        <p>Based on the Big Five (OCEAN) personality model</p>
      </div>

      <div className="results-summary">
        <div className="summary-card">
          <h3>Profile Completed</h3>
          <p>Your personality has been assessed across five major dimensions</p>
        </div>
      </div>

      <div className="traits-container">
        {Object.keys(traitInfo).map(trait => {
          const info = traitInfo[trait];
          const scoreData = scores[trait];
          const zScore = scoreData?.score || 0;
          const displayScore = info.inverted ? -zScore : zScore;
          const position = getScorePosition(zScore, info.inverted);
          const label = getScoreLabel(displayScore);
          const interpretation = getTraitInterpretation(trait, zScore);

          return (
            <div key={trait} className="trait-card">
              <div className="trait-header">
                <span className="trait-icon">{info.icon}</span>
                <div className="trait-title">
                  <h3>{info.name}</h3>
                  <p className="trait-description">{info.description}</p>
                </div>
                <span className={`score-label ${label.toLowerCase().replace(' ', '-')}`}>
                  {label}
                </span>
              </div>

              <div className="trait-score-bar">
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{ width: `${position}%` }}
                  ></div>
                  <div
                    className="score-marker"
                    style={{ left: `${position}%` }}
                  ></div>
                </div>
                <div className="score-labels">
                  <span>Low</span>
                  <span>Average</span>
                  <span>High</span>
                </div>
              </div>

              <div className="trait-interpretation">
                <p>{interpretation}</p>
              </div>

              <div className="trait-technical">
                <small>z-score: {zScore.toFixed(2)} • uncertainty: ±{scoreData?.uncertainty.toFixed(2)}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="results-actions">
        <button className="btn btn-primary btn-large" onClick={() => navigate('/matches')}>
          Find Compatible Matches →
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>

      <div className="results-disclaimer">
        <h4>📊 Understanding Your Results</h4>
        <p>
          These scores represent where you fall on each personality dimension relative to the general population.
          "Average" scores (around the middle) are completely normal and common.
        </p>
        <p>
          <strong>Important:</strong> Personality is complex and multifaceted. This assessment provides
          a snapshot based on your responses, not a complete picture of who you are.
        </p>
      </div>
    </div>
  );
}

export default Results;
