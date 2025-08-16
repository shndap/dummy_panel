import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ExperimentManager from './components/ExperimentManager';
import ExperimentInfo from './components/ExperimentInfo';
import ExperimentList from './components/ExperimentList';
import ExperimentComparison from './components/ExperimentComparison';
import FulltestDashboard from './components/FulltestDashboard';
import TestSuiteDashboard from './components/TestSuiteDashboard';

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || 
    (to === '/improvements' && location.pathname === '/');
  
  return (
    <Link 
      to={to} 
      style={{ 
        padding: '12px 16px',
        textDecoration: 'none',
        color: isActive ? '#2D3748' : '#718096',
        fontWeight: isActive ? '600' : '500',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderRadius: '6px',
        backgroundColor: isActive ? '#EDF2F7' : 'transparent',
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

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <Router>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        backgroundColor: '#F8FAFC',
      }}>
        {/* Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
        }}>
          <div style={{
            maxWidth: '1400px',
            margin: '0 auto',
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
                color: '#2D3748',
              }}
            >
              {isSidebarOpen ? '◀' : '▶'}
            </button>
            <h1 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: '600',
              color: '#2D3748',
            }}>
              <span style={{
                background: 'linear-gradient(135deg, #4CAF50, #2196F3)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '700',
              }}>
                PNL Dashboard
              </span>
            </h1>
          </div>
        </header>

        <div style={{ 
          display: 'flex',
          flex: 1,
        }}>
          {/* Sidebar */}
          <aside style={{
            width: isSidebarOpen ? '240px' : '0',
            background: 'white',
            borderRight: '1px solid #E2E8F0',
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
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
