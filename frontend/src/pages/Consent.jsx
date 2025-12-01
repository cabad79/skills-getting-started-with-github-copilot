import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUser, updateConsent } from '../utils/database';
import './Consent.css';

function Consent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    locale: 'en-US'
  });
  const [consent, setConsent] = useState({
    photo: false,
    video: false,
    text: false,
    sensors: false
  });
  const [ageVerified, setAgeVerified] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleConsentChange = (e) => {
    setConsent({
      ...consent,
      [e.target.name]: e.target.checked
    });
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (parseInt(formData.age) < 18) {
      alert('You must be 18 or older to use this service.');
      return;
    }
    setStep(2);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handleAgeVerification = () => {
    // In production: implement liveness check
    setAgeVerified(true);
    setStep(4);
  };

  const handleFinalSubmit = () => {
    // Create user
    const userId = createUser({
      age: parseInt(formData.age),
      gender: formData.gender,
      locale: formData.locale,
      age_verified: ageVerified
    });

    // Update consent
    updateConsent(userId, consent);

    // Navigate to questionnaire
    navigate('/questionnaire');
  };

  return (
    <div className="consent">
      <div className="consent-container">
        <div className="progress-bar">
          <div className="progress" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        <h2>Consent & Setup</h2>
        <p className="step-indicator">Step {step} of 4</p>

        {step === 1 && (
          <div className="consent-step">
            <h3>📋 Basic Information</h3>
            <form onSubmit={handleStep1Submit}>
              <div className="form-group">
                <label htmlFor="age">Age *</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="100"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gender">Gender *</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary">
                Continue →
              </button>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="consent-step">
            <h3>🔒 Privacy & Data Use</h3>

            <div className="info-box">
              <h4>How Your Data Will Be Used</h4>
              <ul>
                <li>To assess your Big Five personality traits</li>
                <li>To generate personality-based match recommendations</li>
                <li>All data stored locally in your browser</li>
                <li>No data sent to external servers</li>
                <li>You can delete your data at any time</li>
              </ul>
            </div>

            <div className="info-box">
              <h4>Data Retention</h4>
              <p>
                Your questionnaire responses and personality scores will be retained
                in your browser's local storage until you choose to delete them.
                Optional modality data (photos, text) will be simulated for this demo
                and not actually collected.
              </p>
            </div>

            <form onSubmit={handleStep2Submit}>
              <div className="checkbox-group">
                <label>
                  <input type="checkbox" required />
                  I understand how my data will be used *
                </label>
              </div>

              <div className="checkbox-group">
                <label>
                  <input type="checkbox" required />
                  I consent to participate in this personality assessment *
                </label>
              </div>

              <div className="button-group">
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary">
                  Continue →
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="consent-step">
            <h3>📸 Optional Data Modalities</h3>
            <p>
              For research purposes, our system can incorporate multiple data sources.
              For this demo, only the questionnaire will be used.
            </p>

            <div className="modality-options">
              <div className="modality-option">
                <label>
                  <input
                    type="checkbox"
                    name="photo"
                    checked={consent.photo}
                    onChange={handleConsentChange}
                    disabled
                  />
                  <div className="modality-info">
                    <h4>📷 Facial Images (Demo disabled)</h4>
                    <p>Research shows modest predictive power (r ≈ 0.14-0.28)</p>
                    <p className="note">Not implemented in this demo</p>
                  </div>
                </label>
              </div>

              <div className="modality-option">
                <label>
                  <input
                    type="checkbox"
                    name="sensors"
                    checked={consent.sensors}
                    onChange={handleConsentChange}
                    disabled
                  />
                  <div className="modality-info">
                    <h4>📱 Smartphone Sensing (Demo disabled)</h4>
                    <p>Strongest behavioral signal (r ≈ 0.37-0.40)</p>
                    <p className="note">Not implemented in this demo</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                ← Back
              </button>
              <button className="btn btn-primary" onClick={handleAgeVerification}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="consent-step">
            <h3>✅ Ready to Begin</h3>

            <div className="summary-box">
              <h4>Your Choices:</h4>
              <ul>
                <li>Age: {formData.age}</li>
                <li>Gender: {formData.gender}</li>
                <li>Questionnaire: ✓ Enabled</li>
                <li>Photos: {consent.photo ? '✓' : '✗'} (Demo)</li>
                <li>Sensors: {consent.sensors ? '✓' : '✗'} (Demo)</li>
              </ul>
            </div>

            <div className="info-box">
              <p>
                You're about to complete the <strong>IPIP-50</strong> personality questionnaire.
                This will take approximately <strong>7-10 minutes</strong>.
              </p>
              <p>
                Please answer honestly and avoid overthinking your responses.
                Your first instinct is usually most accurate.
              </p>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                ← Back
              </button>
              <button className="btn btn-primary btn-large" onClick={handleFinalSubmit}>
                Start Questionnaire →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Consent;
