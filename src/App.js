import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ExperimentManager from './components/ExperimentManager';
import ExperimentInfo from './components/ExperimentInfo';
import ExperimentList from './components/ExperimentList';
import ExperimentComparison from './components/ExperimentComparison';
import FulltestDashboard from './components/FulltestDashboard';
import TestSuiteDashboard from './components/TestSuiteDashboard';
import { useTheme } from './contexts/ThemeContext';
import ThemeSelector from './components/shared/ThemeSelector';
import LoginPage from './components/LoginPage';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const { theme } = useTheme();
  const isActive = location.pathname === to || 
    (to === '/improvements' && location.pathname === '/');
  
  return (
    <Link 
      to={to} 
      style={{ 
        padding: '12px 16px',
        textDecoration: 'none',
        color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
        fontWeight: isActive ? '600' : '500',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '6px',
        backgroundColor: isActive ? theme.colors.primary.main : 'transparent',
        transition: 'all 0.2s ease',
        marginBottom: '4px',
      }}
    >
      {children}
    </Link>
  );
};

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isAuthed, setIsAuthed] = useState(Boolean(localStorage.getItem('auth_token') === '1'));
  const { theme } = useTheme();

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthed(false);
  };

  const supportsTextClip = typeof CSS !== 'undefined' && (
    (typeof CSS.supports === 'function' && CSS.supports('-webkit-background-clip:text')) ||
    (typeof CSS.supports === 'function' && CSS.supports('background-clip:text'))
  );

  const titleGradientStyle = supportsTextClip ? {
    backgroundImage: `linear-gradient(135deg, ${theme.colors.primary.main}, ${theme.colors.secondary.main})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    display: 'inline',
    fontWeight: '700',
  } : {
    color: theme.colors.primary.main,
    fontWeight: '700',
  };

  return (
    <Router>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          backgroundColor: theme.colors.background.main,
        }}>
          {/* Header (only when authenticated) */}
          {isAuthed && (
            <header style={{
              background: theme.colors.background.paper,
              borderBottom: `1px solid ${theme.colors.border}`,
              padding: '16px 24px',
              position: 'sticky',
              top: 0,
              zIndex: 1000,
            }}>
              <div style={{
                margin: '0 auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <button
                    onClick={toggleSidebar}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '4px',
                      color: theme.colors.text.primary,
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        fontSize: '24px',
                        transition: 'color 0.2s',
                        color: isSidebarOpen ? theme.colors.text.primary : theme.colors.primary.main,
                      }}
                      aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                      title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    >
                      {/* Hamburger icon */}
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 28 28"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{
                          display: 'block',
                        }}
                      >
                        <rect y="6" width="28" height="3" rx="1.5" fill="currentColor"/>
                        <rect y="13" width="28" height="3" rx="1.5" fill="currentColor"/>
                        <rect y="20" width="28" height="3" rx="1.5" fill="currentColor"/>
                      </svg>
                    </span>
                  </button>
                  <h1 style={{
                    margin: 0,
                    fontSize: '24px',
                    fontWeight: '600',
                    color: theme.colors.text.primary,
                    background: 'none',
                  }}>
                    <span style={titleGradientStyle}>
                      PNL Dashboard
                    </span>
                  </h1>
                </div>

                {/* Theme Selector + Logout */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}>
                  <ThemeSelector />
                  <button
                    onClick={handleLogout}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${theme.colors.border}`,
                      background: theme.colors.background.paper,
                      color: theme.colors.text.primary,
                      cursor: 'pointer',
                    }}
                    title="Logout"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </header>
          )}
          {/* Auth-aware layout */}
          {isAuthed ? (
            <div style={{ 
              display: 'flex',
              flex: 1,
            }}>
              {/* Sidebar */}
              <aside style={{
                width: isSidebarOpen ? '240px' : '0',
                background: theme.colors.background.paper,
                borderRight: `1px solid ${theme.colors.border}`,
                padding: isSidebarOpen ? '24px 16px' : '24px 0',
                position: 'sticky',
                top: '69px',
                height: 'calc(100vh - 69px)',
                overflowY: 'auto',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
              }}>
                <nav style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  opacity: isSidebarOpen ? 1 : 0,
                  transition: 'opacity 0.3s ease',
                }}>
                  <NavLink to="/improvements">
                    <span style={{ fontSize: '18px' }}>📈</span> Improvement Types
                  </NavLink>
                  <NavLink to="/info">
                    <span style={{ fontSize: '18px' }}>ℹ️</span> Experiment Info
                  </NavLink>
                  <NavLink to="/experiments">
                    <span style={{ fontSize: '18px' }}>🧪</span> All Experiments
                  </NavLink>
                  <NavLink to="/comparison">
                    <span style={{ fontSize: '18px' }}>⚖️</span> Comparison
                  </NavLink>
                  <NavLink to="/fulltest">
                    <span style={{ fontSize: '18px' }}>🔬</span> Fulltest
                  </NavLink>
                  <NavLink to="/testsuite">
                    <span style={{ fontSize: '18px' }}>🧩</span> Test Suite
                  </NavLink>
                </nav>
              </aside>

              {/* Main Content */}
              <main style={{ 
                flex: 1, 
                padding: '24px',
                transition: 'all 0.3s ease',
              }}>
                <Routes>
                  <Route path="/improvements" element={<ExperimentManager />} />
                  <Route path="/info" element={<ExperimentInfo />} />
                  <Route path="/experiments" element={<ExperimentList />} />
                  <Route path="/comparison" element={<ExperimentComparison />} />
                  <Route path="/fulltest" element={<FulltestDashboard />} />
                  <Route path="/testsuite" element={<TestSuiteDashboard />} />
                  <Route path="/" element={<ExperimentManager />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          ) : (
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/login" element={<LoginPage onLogin={() => setIsAuthed(true)} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </main>
          )}
        </div>
      </Router>
  );
}

export default App;
