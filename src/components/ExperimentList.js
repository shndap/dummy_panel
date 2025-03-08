import React, { useState } from 'react';
import { PageContainer, PageHeader, Card, Input, Select, Button } from './shared/UIComponents';
import { experiments } from '../data/experiments';

const ExperimentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedExps, setSelectedExps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter experiments
  const filteredExperiments = experiments
    .filter(exp => 
      exp.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(exp => {
      if (filterType === 'all') return true;
      if (filterType === 'invalid') return exp.status === 'invalid';
      if (filterType === 'no_improvement') return exp.improvements.length === 0 && exp.status !== 'invalid';
      return exp.improvements.includes(filterType);
    });

  // Pagination
  const totalPages = Math.ceil(filteredExperiments.length / itemsPerPage);
  const paginatedExperiments = filteredExperiments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const sortedExperiments = [...paginatedExperiments].sort((a, b) => {
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date);
    }
    // Add other sort cases
  });

  const ImprovementBadges = ({ improvements, status }) => {
    if (status === 'invalid') {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: '#FED7D7',
          color: '#E53E3E',
        }}>
          Invalid
        </span>
      );
    }

    if (improvements.length === 0) {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: '#EDF2F7',
          color: '#718096',
        }}>
          No Improvement
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {improvements.map((imp, index) => (
          <span
            key={index}
            style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: 
                imp === 'Open' ? '#F0FFF4' :
                imp === 'Close' ? '#FFF5F5' :
                '#EBF8FF',
              color:
                imp === 'Open' ? '#38A169' :
                imp === 'Close' ? '#E53E3E' :
                '#3182CE',
            }}
          >
            {imp}
          </span>
        ))}
      </div>
    );
  };

  // Add back the MetricGroup component
  const MetricGroup = ({ label, metrics, color }) => (
    <div style={{ 
      padding: '4px 8px',
      backgroundColor: `${color}10`,
      borderRadius: '4px',
      border: `1px solid ${color}30`,
      fontSize: '12px',
    }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: `${color}DD`,
      }}>
        <span style={{ 
          fontWeight: '600',
          color: color,
        }}>
          {label}:
        </span>
        {Object.entries(metrics).map(([key, value]) => (
          <span key={key}>
            {key === 'mse' ? 
              `MSE:${value.toFixed(4)}` : 
              key.includes('highlow') ?
                `${key.includes('Buy') ? 'HB' : 'HS'}:${(value * 100).toFixed(1)}%` :
                `${key.includes('buy') ? 'B' : 'S'}:${value}`
            }
          </span>
        ))}
      </div>
    </div>
  );

  const QuickFilter = ({ label, count, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        background: active ? '#EDF2F7' : 'white',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {label}
      <span style={{ 
        background: active ? '#4A5568' : '#A0AEC0',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '11px',
      }}>
        {count}
      </span>
    </button>
  );

  const exportToCSV = () => {
    const headers = ['Code', 'Date', 'Author', 'Description', 'Status'];
    const data = filteredExperiments.map(exp => [
      exp.code,
      exp.date,
      exp.author,
      exp.description,
      exp.status,
    ]);
    
    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiments.csv';
    a.click();
  };

  return (
    <PageContainer>
      <PageHeader title="All Experiments" />
      
      <Card>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <Input
            type="text"
            placeholder="Search experiments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '200px' }}
          >
            <option value="all">All Types</option>
            <option value="invalid">Invalid Experiments</option>
            <option value="no_improvement">No Improvement</option>
            <option value="Open">Open Improvements</option>
            <option value="Close">Close Improvements</option>
            <option value="Reg">Reg Improvements</option>
          </Select>
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}>
          <QuickFilter 
            label="All"
            count={experiments.length}
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          />
          <QuickFilter 
            label="Invalid"
            count={experiments.filter(e => e.status === 'invalid').length}
            active={filterType === 'invalid'}
            onClick={() => setFilterType('invalid')}
          />
          {/* Add more quick filters */}
        </div>

        {isLoading && (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#718096',
          }}>
            Loading experiments...
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px',
            background: '#FED7D7',
            color: '#E53E3E',
            borderRadius: '6px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        <div style={{ 
          overflowX: 'auto',
          position: 'relative',
          zIndex: 1,
        }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: '0',
            fontSize: '14px',
          }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: '40px' }}>
                  <input
                    type="checkbox"
                    onChange={e => {
                      setSelectedExps(e.target.checked ? paginatedExperiments.map(exp => exp.id) : []);
                    }}
                  />
                </th>
                <th style={{ ...thStyle }}>Code</th>
                <th 
                  style={{ 
                    ...thStyle, 
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onClick={() => {
                    setSortConfig({
                      key: 'date',
                      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
                    });
                  }}
                >
                  Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ ...thStyle }}>Author</th>
                <th style={{ ...thStyle }}>Description</th>
                <th style={{ ...thStyle }}>Metrics</th>
                <th style={{ ...thStyle }}>Improvements</th>
                <th style={{ ...thStyle }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedExperiments.map(exp => (
                <tr 
                  key={exp.id}
                  style={{
                    transition: 'background-color 0.2s ease',
                    backgroundColor: exp.status === 'invalid' ? '#FFF5F5' : 'white',
                    '&:hover': {
                      backgroundColor: exp.status === 'invalid' ? '#FED7D7' : '#F7FAFC',
                    },
                  }}
                >
                  <td style={tdStyle}>
                    <input
                      type="checkbox"
                      checked={selectedExps.includes(exp.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedExps([...selectedExps, exp.id]);
                        } else {
                          setSelectedExps(selectedExps.filter(id => id !== exp.id));
                        }
                      }}
                    />
                  </td>
                  <td style={{ ...tdStyle, fontWeight: '500' }}>{exp.code}</td>
                  <td style={tdStyle}>{new Date(exp.date).toLocaleDateString()}</td>
                  <td style={tdStyle}>{exp.author}</td>
                  <td style={tdStyle}>{exp.description}</td>
                  <td style={{ ...tdStyle }}>
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}>
                      <MetricGroup 
                        label="Open" 
                        metrics={exp.metrics.open}
                        color="#38A169"
                      />
                      <MetricGroup 
                        label="Close" 
                        metrics={exp.metrics.close}
                        color="#E53E3E"
                      />
                      <MetricGroup 
                        label="Reg" 
                        metrics={exp.metrics.reg}
                        color="#3182CE"
                      />
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <ImprovementBadges 
                      improvements={exp.improvements}
                      status={exp.status}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        variant="secondary" 
                        onClick={() => window.location.href = `/comparison?exp=${exp.code}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Compare
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={() => window.location.href = `/info?exp=${exp.code}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Details
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
            position: 'relative',
            zIndex: 2,
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                background: 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#A0AEC0' : '#2D3748',
              }}
            >
              Previous
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 16px',
            }}>
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                background: 'white',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                color: currentPage === totalPages ? '#A0AEC0' : '#2D3748',
              }}
            >
              Next
            </button>
          </div>
        )}

        {selectedExps.length > 0 && (
          <div style={{
            position: 'sticky',
            bottom: 0,
            padding: '16px',
            background: 'white',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}>
            <span>{selectedExps.length} selected</span>
            <Button variant="secondary">Compare Selected</Button>
            <Button variant="danger">Delete Selected</Button>
          </div>
        )}

        <Button 
          variant="secondary" 
          onClick={exportToCSV}
          style={{ marginLeft: 'auto' }}
        >
          Export CSV
        </Button>
      </Card>
    </PageContainer>
  );
};

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  borderBottom: '2px solid #E2E8F0',
  color: '#4A5568',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '16px',
  borderBottom: '1px solid #E2E8F0',
  color: '#2D3748',
};

export default ExperimentList;