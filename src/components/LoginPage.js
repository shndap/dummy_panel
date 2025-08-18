import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const LoginPage = ({ onLogin }) => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const expectedPassword = process.env.REACT_APP_DASHBOARD_PASSWORD || 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Please enter the password');
      return;
    }
    setLoading(true);
    try {
      if (password === expectedPassword) {
        localStorage.setItem('auth_token', '1');
        if (typeof onLogin === 'function') onLogin();
        navigate('/');
      } else {
        setError('Invalid password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: theme.colors.background.main,
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: theme.colors.background.paper,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: theme.colors.text.primary }}>Dashboard Login</h2>
          <div style={{ color: theme.colors.text.secondary, fontSize: '13px', marginTop: '6px' }}>
            Enter the shared credentials to continue
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
          <div style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>Username (optional)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., guest"
              autoComplete="username"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 44px 10px 12px',
                borderRadius: '8px',
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.background.paper,
                color: theme.colors.text.primary,
              }}
            />
          </div>
          <div style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
            <label style={{ display: 'block', fontSize: '12px', color: theme.colors.text.secondary, marginBottom: '6px' }}>Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 44px 10px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.background.paper,
                  color: theme.colors.text.secondary,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  maxWidth: '32px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <span role="img" aria-label="Hide password" title="Hide password">
                    👁️‍🗨️
                  </span>
                ) : (
                  <span role="img" aria-label="Show password" title="Show password">
                    👁️
                  </span>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div style={{ color: theme.colors.error.main, fontSize: '13px' }}>{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.info.main}`,
              background: theme.colors.info.main,
              color: theme.tokens.grey[100],
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 