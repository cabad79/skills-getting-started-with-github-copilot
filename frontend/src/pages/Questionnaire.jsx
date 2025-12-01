import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, saveQuestionnaireResponse, saveAttentionCheck, saveTraitEstimate } from '../utils/database';
import { IPIP50_ITEMS, ATTENTION_CHECKS, RESPONSE_SCALE, calculateBigFiveScores } from '../data/ipip50';
import './Questionnaire.css';

function Questionnaire() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [startTime, setStartTime] = useState(Date.now());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/consent');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  // Merge attention checks into items
  const allItems = [...IPIP50_ITEMS];
  ATTENTION_CHECKS.forEach(check => {
    allItems.splice(check.position, 0, {
      id: `AC_${check.position}`,
      isAttentionCheck: true,
      text: check.text,
      expected: check.expected
    });
  });

  const currentItem = allItems[currentItemIndex];
  const progress = ((currentItemIndex + 1) / allItems.length) * 100;

  const handleResponse = (value) => {
    const responseTime = Date.now() - startTime;

    if (currentItem.isAttentionCheck) {
      // Save attention check
      saveAttentionCheck(user.user_id, {
        itemNumber: currentItemIndex,
        expected: currentItem.expected,
        actual: value,
        passed: value === currentItem.expected
      });
    } else {
      // Save regular response
      saveQuestionnaireResponse(user.user_id, 'IPIP-50', {
        itemNumber: currentItem.id,
        question: currentItem.text,
        response: value,
        responseTime: responseTime
      });

      setResponses([...responses, {
        itemId: currentItem.id,
        response: value
      }]);
    }

    // Move to next item
    if (currentItemIndex < allItems.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      setStartTime(Date.now());
    } else {
      // Questionnaire complete
      completeQuestionnaire();
    }
  };

  const completeQuestionnaire = () => {
    // Calculate Big Five scores
    const scores = calculateBigFiveScores(responses);

    // Save trait estimates
    Object.keys(scores).forEach(trait => {
      if (scores[trait].items > 0) {
        saveTraitEstimate(user.user_id, {
          trait: trait,
          score: scores[trait].z,
          uncertainty: 0.3, // Lower uncertainty for questionnaire
          source: 'IPIP-50'
        });
      }
    });

    setCompleted(true);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  if (completed) {
    return (
      <div className="questionnaire-complete">
        <div className="complete-container">
          <h2>✅ Questionnaire Complete!</h2>
          <p>Your personality profile has been calculated.</p>

          <div className="completion-stats">
            <div className="stat">
              <h3>{responses.length}</h3>
              <p>Questions Answered</p>
            </div>
            <div className="stat">
              <h3>5</h3>
              <p>Traits Assessed</p>
            </div>
          </div>

          <button className="btn btn-primary btn-large" onClick={() => navigate('/results')}>
            View My Personality Profile →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="questionnaire">
      <div className="questionnaire-header">
        <h2>Personality Questionnaire</h2>
        <div className="progress-info">
          <p>Question {currentItemIndex + 1} of {allItems.length}</p>
          <div className="progress-bar">
            <div className="progress" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>

      <div className="question-container">
        {currentItem.isAttentionCheck && (
          <div className="attention-check-badge">Attention Check</div>
        )}

        <div className="question-text">
          <h3>{currentItem.text}</h3>
        </div>

        <div className="response-options">
          {RESPONSE_SCALE.map(option => (
            <button
              key={option.value}
              className="response-button"
              onClick={() => handleResponse(option.value)}
            >
              <span className="response-value">{option.value}</span>
              <span className="response-label">{option.label}</span>
            </button>
          ))}
        </div>

        <div className="questionnaire-tips">
          <p>💡 <strong>Tip:</strong> Answer based on how you generally are, not how you wish to be.</p>
        </div>
      </div>
    </div>
  );
}

export default Questionnaire;
