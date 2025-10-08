import React from 'react';
import { useNavigate } from 'react-router-dom';
import "./LandingPage.css";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/auth/login');
  };

  const handleLearnMore = () => {
    // Add learn more logic here
    console.log('Learn more clicked');
  };

  return (
    <div className="landing-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Secure Your Digital World with Confidence</h1>
          <p>
            Generate strong, unique passwords and store them securely in your personal vault. 
            Protect your accounts with our advanced password management solution.
          </p>
          
          <div className="cta-buttons">
            <button className="login-btn" onClick={handleLogin}>
              Login to Your Vault
            </button>
            <button className="secondary-btn" onClick={handleLearnMore}>
              Learn More
            </button>
          </div>

          <div className="features">
            <div className="feature">
              <span className="feature-icon">🔒</span>
              <span>Military-Grade Encryption</span>
            </div>
            <div className="feature">
              <span className="feature-icon">⚡</span>
              <span>Instant Password Generation</span>
            </div>
            <div className="feature">
              <span className="feature-icon">🌐</span>
              <span>Cross-Platform Sync</span>
            </div>
          </div>
        </div>

        <div className="hero-image">
          <div className="hero-image-placeholder">
            <span>🔐 Secure Vault Illustration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;