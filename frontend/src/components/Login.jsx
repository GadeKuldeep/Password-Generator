import React, { useState } from 'react';
import API_BASE_URL from "@/config";
import "./Login.css";

const Login = ({ onToggleMode, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
    if (!formData.email || !formData.password) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      setLoading(false);
      return;
    }

    try {

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Success - handle the response
      const { token, encSalt, userId, email } = data;

      // Store authentication data
      localStorage.setItem('token', token);
      localStorage.setItem('encSalt', encSalt);
      localStorage.setItem('userId', userId);
      localStorage.setItem('email', email);

      setMessage({
        text: 'Login successful!',
        type: 'success'
      });

      // Call success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess({ token, encSalt, userId, email });
      }

      // Optional: redirect after delay
      setTimeout(() => {
        window.location.href = '/vault';
      }, 1000);

    } catch (error) {
      setMessage({
        text: error.message || 'An error occurred during login',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpClick = () => {
    // If onToggleMode prop is provided, use it (existing functionality)
    if (onToggleMode) {
      onToggleMode();
    } else {
      // Otherwise, redirect to /auth/signup
      window.location.href = '/auth/signup';
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login to Your Account</h2>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
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
              placeholder="Enter your password"
              minLength="6"
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              className="toggle-button"
              onClick={handleSignUpClick}
              disabled={loading}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;