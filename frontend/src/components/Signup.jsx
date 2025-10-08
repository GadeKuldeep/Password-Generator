import React, { useState } from 'react';
import API_BASE_URL from '@/config';
import "./Signup.css";

const Signup = ({ onToggleMode, onSignupSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Validation
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      // Success - handle the response
      const { token, encSalt } = data;

      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('encSalt', encSalt);

      setMessage({
        text: 'Account created successfully!',
        type: 'success'
      });

      // Call success callback if provided
      if (onSignupSuccess) {
        onSignupSuccess({ token, encSalt });
      }

      // Optional: redirect after delay
      setTimeout(() => {
        window.location.href = '/vault';
      }, 1000);

    } catch (error) {
      setMessage({
        text: error.message || 'An error occurred during signup',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignInClick = () => {
    // If onToggleMode prop is provided, use it (existing functionality)
    if (onToggleMode) {
      onToggleMode();
    } else {
      // Otherwise, redirect to /auth/login
      window.location.href = '/auth/login';
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create Your Account</h2>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Create a password (min 6 characters)"
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Confirm your password"
              minLength="6"
            />
          </div>

          <button
            type="submit"
            className="signup-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="signup-toggle">
          <p>
            Already have an account?{' '}
            <button
              type="button"
              className="toggle-button"
              onClick={handleSignInClick}
              disabled={loading}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;