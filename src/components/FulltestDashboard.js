import React, { useState, useEffect } from 'react';

// Reusable styled button component
const Button = ({ onClick, disabled, variant = 'primary', children, style = {} }) => {
  const baseStyle = {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    border: 'none',
    borderRadius: '6px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    ...style,
  };

  const variants = {
    primary: {
      backgroundColor: disabled ? '#A0AEC0' : '#4CAF50',
      color: 'white',
      '&:hover': {
        backgroundColor: '#45a049',
      },
    },
    danger: {
      backgroundColor: '#ff5252',
      color: 'white',
      '&:hover': {
        backgroundColor: '#ff3838',
      },
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...baseStyle,
        ...variants[variant],
        '&:hover': disabled ? {} : variants[variant]['&:hover'],
      }}
    >
      {children}
    </button>
  );
};

// Card component for sections
const Card = ({ title, children, style = {} }) => (
  <div style={{
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    ...style,
  }}>
    {title && (
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #edf2f7',
        background: '#f8fafc',
      }}>
        <h3 style={{ margin: 0, color: '#2d3748', fontSize: '18px' }}>{title}</h3>
      </div>
    )}
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

const FulltestDashboard = () => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showFullLogs, setShowFullLogs] = useState(false);
  const [experimentName, setExperimentName] = useState('');
  const [fulltests, setFulltests] = useState([
    { 
      id: 1, 
      name: 'Fulltest 001',
      date: '2024-03-08',
      status: 'completed',
      isExperiment: true,
      improvement: 'open',
      progress: 100,
      logs: ['Started fulltest...', 'Progress: 50%', 'Fulltest completed.']
    },
    { 
      id: 2, 
      name: 'Fulltest 002',
      date: '2024-03-07',
      status: 'completed',
      isExperiment: false,
      improvement: null,
      progress: 100,
      logs: ['Started fulltest...', 'Progress: 50%', 'Fulltest completed.']
    },
    { 
      id: 3, 
      name: 'Fulltest 003',
      date: '2024-03-06',
      status: 'completed',
      isExperiment: true,
      improvement: 'reg',
      progress: 100,
      logs: ['Started fulltest...', 'Progress: 50%', 'Fulltest completed.']
    },
  ]);

  useEffect(() => {
    let interval;
    if (isRunning && progress < 100) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = Math.min(prev + Math.floor(Math.random() * 10) + 5, 100);
          const newLog = `Progress: ${newProgress}%`;
          setLogs(oldLogs => [...oldLogs, newLog]);
          return newProgress;
        });
      }, 1000);
    } else if (progress >= 100) {
      setIsRunning(false);
      setLogs(oldLogs => [...oldLogs, "Fulltest completed."]);
      // Add new fulltest to the list
      const newFulltest = {
        id: Date.now(),
        name: experimentName,
        date: new Date().toISOString(),
        status: 'completed',
        isExperiment: false,
        improvement: null,
        progress: 100,
        logs: [...logs, "Fulltest completed."]
      };
      setFulltests(prev => [newFulltest, ...prev]);
      setExperimentName(''); // Reset name input
    }
    return () => clearInterval(interval);
  }, [isRunning, progress, experimentName, logs]);

  const startFulltest = (e) => {
    e.preventDefault();
    if (!experimentName.trim()) {
      alert('Please enter an experiment name');
      return;
    }
    setProgress(0);
    setLogs(["Starting fulltest..."]);
    setIsRunning(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this fulltest?')) {
      setFulltests(prev => prev.filter(test => test.id !== id));
    }
  };

  const toggleExperiment = (id) => {
    setFulltests(prev => prev.map(test => 
      test.id === id ? { ...test, isExperiment: !test.isExperiment } : test
    ));
  };

  const setImprovement = (id, type) => {
    setFulltests(prev => prev.map(test => 
      test.id === id ? { ...test, improvement: type } : test
    ));
  };

  // Format date to be more readable
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <h2 style={{ 
          color: '#1a202c',
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
        }}>
          Fulltest Dashboard
        </h2>
        <form 
          onSubmit={startFulltest}
          style={{ 
            display: 'flex', 
            gap: '12px',
            alignItems: 'center'
          }}
        >
          <input
            type="text"
            value={experimentName}
            onChange={(e) => setExperimentName(e.target.value)}
            placeholder="Enter experiment name"
            disabled={isRunning}
            style={{
              padding: '10px 16px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              width: '250px'
            }}
          />
          <Button type="submit" disabled={isRunning || !experimentName.trim()}>
            <span style={{ fontSize: '18px' }}>▶</span> Start Fulltest
          </Button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: '2fr 1fr' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Fulltests List */}
          <Card title="Fulltest History">
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: '0',
                fontSize: '14px',
              }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle }}>Name</th>
                    <th style={{ ...thStyle }}>Date</th>
                    <th style={{ ...thStyle }}>Progress</th>
                    <th style={{ ...thStyle }}>Status</th>
                    <th style={{ ...thStyle }}>Experiment</th>
                    <th style={{ ...thStyle }}>Improvement</th>
                    <th style={{ ...thStyle }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fulltests.map(test => (
                    <tr 
                      key={test.id}
                      style={{ 
                        transition: 'all 0.2s ease',
                        backgroundColor: test.isExperiment ? '#f0fff4' : 'white',
                      }}
                    >
                      <td style={{ ...tdStyle }}>
                        <div style={{ fontWeight: '500' }}>{test.name}</div>
                        <button 
                          onClick={() => setShowFullLogs(test.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#4299e1',
                            fontSize: '12px',
                            cursor: 'pointer',
                            padding: 0,
                            marginTop: '4px'
                          }}
                        >
                          View Logs
                        </button>
                      </td>
                      <td style={{ ...tdStyle }}>{formatDate(test.date)}</td>
                      <td style={{ ...tdStyle }}>
                        <div style={{ 
                          width: '100px',
                          height: '6px',
                          background: '#edf2f7',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${test.progress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #48bb78, #38a169)',
                            transition: 'width 0.3s ease'
                          }}/>
                        </div>
                        <div style={{ fontSize: '12px', color: '#718096', marginTop: '4px' }}>
                          {test.progress}%
                        </div>
                      </td>
                      <td style={{ ...tdStyle }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: test.status === 'completed' ? '#e6fffa' : '#fff3e0',
                          color: test.status === 'completed' ? '#047481' : '#c05621',
                        }}>
                          {test.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle }}>
                        <label style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}>
                          <input 
                            type="checkbox"
                            checked={test.isExperiment}
                            onChange={() => toggleExperiment(test.id)}
                            style={{ marginRight: '8px' }}
                          />
                          <span>Yes</span>
                        </label>
                      </td>
                      <td style={{ ...tdStyle }}>
                        <select
                          value={test.improvement || ''}
                          onChange={(e) => setImprovement(test.id, e.target.value)}
                          disabled={!test.isExperiment}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: test.isExperiment ? 'white' : '#f7fafc',
                            color: test.isExperiment ? '#2d3748' : '#a0aec0',
                            cursor: test.isExperiment ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <option value="">None</option>
                          <option value="open">Open</option>
                          <option value="close">Close</option>
                          <option value="reg">Reg</option>
                        </select>
                      </td>
                      <td style={{ ...tdStyle }}>
                        <Button 
                          variant="danger" 
                          onClick={() => handleDelete(test.id)}
                          style={{ padding: '6px 12px' }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Current Progress Card - only show when running */}
          {isRunning && (
            <Card title={`Running: ${experimentName}`}>
              <div style={{ 
                background: '#edf2f7',
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '12px',
              }}>
                <div style={{ 
                  width: `${progress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #48bb78, #38a169)',
                  transition: 'width 0.3s ease',
                }}/>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                color: '#4a5568',
                fontSize: '14px',
              }}>
                <span>Progress</span>
                <span>{progress}%</span>
              </div>
            </Card>
          )}

          {/* Live Logs */}
          <Card 
            title={showFullLogs ? 
              `Logs: ${fulltests.find(t => t.id === showFullLogs)?.name || 'Current'}` : 
              'Live Logs'
            }
            style={{ flex: 1 }}
          >
            <pre style={{ 
              background: '#2d3748',
              color: '#e2e8f0',
              padding: '16px',
              borderRadius: '8px',
              maxHeight: '500px',
              overflowY: 'auto',
              fontSize: '13px',
              margin: 0,
              lineHeight: 1.5,
            }}>
              {showFullLogs ? 
                fulltests.find(t => t.id === showFullLogs)?.logs.join('\n') : 
                logs.join('\n')
              }
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Shared styles
const thStyle = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #edf2f7',
  color: '#4a5568',
  fontWeight: '600',
};

const tdStyle = {
  padding: '16px 12px',
  borderBottom: '1px solid #edf2f7',
};

export default FulltestDashboard;