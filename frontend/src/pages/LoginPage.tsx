import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Database,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { login, isAuthenticated } = useAuth();
  const { showToast } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // If already authenticated, redirect to destination or dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(username, password);
      if (result.success) {
        showToast('Admin authenticated successfully. Welcome to PharmaChain!', 'success');
        navigate(from, { replace: true });
      } else {
        const errMsg = result.error || 'Invalid credentials. Access denied.';
        setError(errMsg);
        showToast(errMsg, 'error');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Authentication service error.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-portal-wrapper">
      {/* Dynamic Background Glow Elements */}
      <div className="login-ambient-orb login-ambient-orb-1" />
      <div className="login-ambient-orb login-ambient-orb-2" />
      <div className="login-ambient-orb login-ambient-orb-3" />

      <div className="login-container">
        {/* Main Glassmorphic Login Card */}
        <div className="glass-card login-card">
          {/* Card Header & Brand */}
          <div className="login-card-header">
            <div className="login-brand-wrapper">
              <div className="login-brand-logo">
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="brand-svg-pill"
                >
                  <rect
                    x="3"
                    y="7"
                    width="18"
                    height="10"
                    rx="5"
                    transform="rotate(-45 12 12)"
                    fill="url(#pill-gradient-login)"
                  />
                  <path
                    d="M7.757 7.757L16.243 16.243"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="pill-gradient-login" x1="3" y1="7" x2="21" y2="17" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#38bdf8" />
                      <stop offset="0.5" stopColor="#0ea5e9" />
                      <stop offset="1" stopColor="#0284c7" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <div className="login-brand-info">
                <div className="login-brand-title-row">
                  <span className="login-brand-name">PharmaChain</span>
                  <span className="login-admin-badge">ADMIN PORTAL</span>
                </div>
                <span className="login-brand-tagline">Oracle 21c Enterprise Ledger</span>
              </div>
            </div>

            <div className="login-title-section">
              <h1 className="login-heading">System Sign In</h1>
              <p className="login-subheading">
                Enter administrator credentials to manage pharmaceutical custody, batch verification, and compliance monitoring.
              </p>
            </div>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="login-error-alert" role="alert">
              <AlertCircle size={18} className="login-error-icon" />
              <div className="login-error-text">
                <strong>Access Denied:</strong> {error}
              </div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
            {/* Username Input */}
            <div className="login-field-group">
              <label htmlFor="login-username" className="login-field-label">
                Admin Username
              </label>
              <div className="login-input-container">
                <User size={18} className="login-input-icon" />
                <input
                  id="login-username"
                  type="text"
                  className="login-input"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="login-field-group">
              <div className="login-field-header-row">
                <label htmlFor="login-password" className="login-field-label">
                  Password
                </label>
              </div>
              <div className="login-input-container">
                <Lock size={18} className="login-input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input password-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="login-options-row">
              <label className="login-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                />
                <span>Remember admin session</span>
              </label>
              <span className="login-help-hint" title="Requires SYSTEM administrative privileges">
                Requires SYSTEM rights
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn-login-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="login-btn-spinner" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight size={17} className="btn-login-arrow" />
                </>
              )}
            </button>
          </form>

          {/* Card Footer Security Badges */}
          <div className="login-card-footer">
            <div className="login-security-pill">
              <ShieldCheck size={14} className="sec-icon sec-icon-green" />
              <span>Oracle 21c Protected</span>
            </div>
            <div className="login-security-pill">
              <Database size={14} className="sec-icon sec-icon-blue" />
              <span>SYSTEM DBA Role</span>
            </div>
            <div className="login-security-pill">
              <CheckCircle2 size={14} className="sec-icon sec-icon-teal" />
              <span>Audit Logging Active</span>
            </div>
          </div>
        </div>

        {/* Ambient Footer Note */}
        <div className="login-outer-footer">
          <span>PharmaChain DBMS • Pharmaceutical Supply Chain & Batch Verification</span>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
