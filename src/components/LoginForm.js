import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginForm.css';

const LoginForm = () => {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (formData.username || formData.password)) {
      setError('');
    }
  }, [formData.username, formData.password, error]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const result = login(formData.username.trim(), formData.password);
    
    if (!result.success) {
      setError(result.error);
    }

    setIsSubmitting(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (isLoading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-loading">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-overlay"></div>
      </div>
      
      <div className="login-card">
        {/* Header with Logo */}
        <div className="login-header">
          <div className="login-logo">
            <img 
              src="/images/oursayso-logo.svg" 
              alt="OurSayso Logo" 
              className="logo-image"
            />
          </div>
          <h1 className="login-title">Sales iPad App CMS</h1>
          <p className="login-subtitle">Portfolio Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="Enter your username"
              disabled={isSubmitting}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="Enter your password"
                disabled={isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`login-button ${isSubmitting ? 'loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="button-spinner"></div>
                <span>Signing In...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <p className="login-help">
            Contact your team administrator if you need access
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;