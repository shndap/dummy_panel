import React, { useState } from 'react';
import { PageContainer, PageHeader, Card, Select } from './shared/UIComponents';

const ExperimentComparison = () => {
  const [selectedExp1, setSelectedExp1] = useState('');
  const [selectedExp2, setSelectedExp2] = useState('');

  const experiments = [
    { 
      id: 1, 
      code: 'EXP001',
      metrics: {
        open: {
          buy: 205,
          sell: 195
        },
        close: {
          buy: 150,
          sell: 148
        },
        reg: {
          mse: 0.0182,
          highlowBuy: 0.85,
          highlowSell: 0.82
        }
      }
    },
    // ... add more experiments
  ];

  const exp1 = experiments.find(exp => exp.code === selectedExp1);
  const exp2 = experiments.find(exp => exp.code === selectedExp2);

  const MetricComparison = ({ label, metrics1, metrics2, color }) => {
    if (!metrics1 || !metrics2) return null;

    const renderValue = (key, value) => {
      if (key === 'mse') return value.toFixed(4);
      if (key.includes('highlow')) return `${(value * 100).toFixed(1)}%`;
      return value;
    };

    const getChangeIndicator = (key, value1, value2) => {
      const improvement = key === 'mse' ? value2 > value1 : value1 > value2;
      const change = key === 'mse' 
        ? ((value2 - value1) / value1 * 100).toFixed(2)
        : ((value1 - value2) / value2 * 100).toFixed(2);
      
      return (
        <span style={{
          color: improvement ? '#38A169' : '#E53E3E',
          fontSize: '12px',
          marginLeft: '8px',
        }}>
          {improvement ? '↑' : '↓'} {Math.abs(change)}%
        </span>
      );
    };

    return (
      <div style={{
        padding: '16px',
        backgroundColor: `${color}10`,
        borderRadius: '8px',
        border: `1px solid ${color}30`,
      }}>
        <h4 style={{ 
          color: color, 
          margin: '0 0 12px 0',
          fontSize: '16px',
          fontWeight: '600',
        }}>
          {label}
        </h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          {Object.entries(metrics1).map(([key, value1]) => (
            <div 
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: 'white',
                borderRadius: '4px',
              }}
            >
              <div style={{ color: '#4A5568', fontWeight: '500' }}>
                {key === 'mse' ? 'MSE' : 
                  key.includes('highlow') ? 
                    `High/Low ${key.replace('highlow', '')}` : 
                    key.charAt(0).toUpperCase() + key.slice(1)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>{renderValue(key, value1)}</span>
                <span style={{ color: '#A0AEC0' }}>vs</span>
                <span>{renderValue(key, metrics2[key])}</span>
                {getChangeIndicator(key, value1, metrics2[key])}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Experiment Comparison" />
      
      <Card>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <Select
            value={selectedExp1}
            onChange={(e) => setSelectedExp1(e.target.value)}
            placeholder="Select first experiment"
          >
            <option value="">Select Experiment 1</option>
            {experiments.map(exp => (
              <option key={exp.id} value={exp.code}>{exp.code}</option>
            ))}
          </Select>
          <Select
            value={selectedExp2}
            onChange={(e) => setSelectedExp2(e.target.value)}
            placeholder="Select second experiment"
          >
            <option value="">Select Experiment 2</option>
            {experiments.map(exp => (
              <option key={exp.id} value={exp.code}>{exp.code}</option>
            ))}
          </Select>
        </div>

        {exp1 && exp2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <MetricComparison
              label="Open Metrics"
              metrics1={exp1.metrics.open}
              metrics2={exp2.metrics.open}
              color="#38A169"
            />
            <MetricComparison
              label="Close Metrics"
              metrics1={exp1.metrics.close}
              metrics2={exp2.metrics.close}
              color="#E53E3E"
            />
            <MetricComparison
              label="Reg Metrics"
              metrics1={exp1.metrics.reg}
              metrics2={exp2.metrics.reg}
              color="#3182CE"
            />
          </div>
        ) : (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#718096',
          }}>
            Select two experiments to compare their metrics
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default ExperimentComparison;