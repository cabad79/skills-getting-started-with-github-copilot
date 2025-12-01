import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getStats } from '../utils/database';
import { useState, useEffect } from 'react';
import './Welcome.css';

function Welcome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [hasExistingUser, setHasExistingUser] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    const dbStats = getStats();

    setHasExistingUser(!!user);
    setStats(dbStats);
  }, []);

  return (
    <div className="welcome">
      <div className="hero">
        <h1>Welcome to PersonalityMatch 💚</h1>
        <p className="tagline">
          Find meaningful connections through science-based personality matching
        </p>
      </div>

      <div className="info-section">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Consent & Privacy</h3>
            <p>Review how your data will be used and provide informed consent</p>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <h3>Complete Questionnaire</h3>
            <p>Answer 50 questions to assess your Big Five personality traits</p>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <h3>View Your Profile</h3>
            <p>Understand your personality across five major dimensions</p>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <h3>Find Matches</h3>
            <p>Discover compatible partners based on personality science</p>
          </div>
        </div>
      </div>

      <div className="research-note">
        <h3>📚 Research-Backed Approach</h3>
        <p>
          This system uses the <strong>Big Five personality model</strong> (OCEAN),
          the most empirically validated framework in psychology. Our matching
          algorithm is based on peer-reviewed research about relationship compatibility.
        </p>
        <p className="disclaimer">
          <strong>Note:</strong> While personality similarity can improve initial compatibility,
          it's only one factor in relationship success. This tool should complement,
          not replace, getting to know someone personally.
        </p>
      </div>

      <div className="tech-info">
        <h3>🔒 Your Privacy Matters</h3>
        <ul>
          <li>All data stored <strong>locally in your browser</strong> using SQLite</li>
          <li>No data sent to external servers</li>
          <li>You can delete all your data at any time</li>
          <li>Open source and transparent</li>
        </ul>
      </div>

      {stats && (
        <div className="stats-box">
          <h4>System Statistics</h4>
          <ul>
            <li>Users: {stats.users}</li>
            <li>Responses: {stats.responses}</li>
            <li>Candidate Pool: {stats.poolSize}</li>
          </ul>
        </div>
      )}

      <div className="cta-section">
        {hasExistingUser ? (
          <>
            <button className="btn btn-primary" onClick={() => navigate('/results')}>
              View My Profile
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/matches')}>
              Find Matches
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-large" onClick={() => navigate('/consent')}>
            Get Started →
          </button>
        )}
      </div>
    </div>
  );
}

export default Welcome;
