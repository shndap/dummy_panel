import React, { useState, useEffect } from 'react';
import { PageContainer, PageHeader, Card, Select } from './shared/UIComponents';
import { getFrontendExperiments } from '../api/fulltests';

function parseMaybeJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeExperiment(exp) {
  return {
    ...exp,
    metrics: parseMaybeJSON(exp.metrics, exp.metrics || {}),
    improvements: Array.isArray(exp.improvements) || typeof exp.improvements === 'string'
      ? exp.improvements
      : (exp.improvement_type ?? []),
  };
}

const ExperimentComparison = () => {
  const [selectedExp1, setSelectedExp1] = useState('');
  const [selectedExp2, setSelectedExp2] = useState('');
  const [options, setOptions] = useState([]); // array of { code, id, pk }
  const [exp1, setExp1] = useState(null);
  const [exp2, setExp2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      setError(null);
      try {
        const { results } = await getFrontendExperiments({ limit: 100, page: 1 });
        if (!mounted) return;
        const list = (results || []).map(r => ({ code: r.code, id: r.id, pk: r.pk }));
        setOptions(list);
      } catch (e) {
        if (mounted) setError(e.data || e.message || 'Failed to load experiments');
      }
    }
    loadOptions();
    return () => { mounted = false; };
  }, []);

  async function loadByCode(code, setter) {
    if (!code) { setter(null); return; }
    setLoading(true);
    setError(null);
    try {
      const { results } = await getFrontendExperiments({ search: code, limit: 1, page: 1 });
      const match = Array.isArray(results) ? results.find(r => r.code === code) || results[0] : null;
      setter(match ? normalizeExperiment(match) : null);
    } catch (e) {
      setter(null);
      setError(e.data || e.message || 'Failed to load experiment');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadByCode(selectedExp1, setExp1); }, [selectedExp1]);
  useEffect(() => { loadByCode(selectedExp2, setExp2); }, [selectedExp2]);

  const MetricComparison = ({ label, metrics1, metrics2, color }) => {
    if (!metrics1 || !metrics2) return null;

    const renderValue = (key, value) => {
      if (key === 'mse') return Number(value).toFixed(4);
      if (key.toLowerCase().includes('highlow')) return `${(Number(value) * 100).toFixed(1)}%`;
      return value;
    };

    const getChangeIndicator = (key, value1, value2) => {
      const v1 = Number(value1);
      const v2 = Number(value2);
      const improvement = key === 'mse' ? v2 > v1 : v1 > v2;
      const denom = key === 'mse' ? v1 : v2;
      const change = denom ? ((key === 'mse' ? (v2 - v1) / v1 : (v1 - v2) / v2) * 100).toFixed(2) : '0.00';
      return (
        <span style={{
          color: improvement ? '#38A169' : '#E53E3E',
          fontSize: '12px',
          marginLeft: '8px',
        }}>
          {improvement ? '↑' : '↓'} {Math.abs(Number(change))}%
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
                  key.toLowerCase().includes('highlow') ? 
                    `High/Low ${key.replace(/highlow/i, '')}` : 
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
            {options.map(opt => (
              <option key={opt.pk ?? opt.id ?? opt.code} value={opt.code}>{opt.code}</option>
            ))}
          </Select>
          <Select
            value={selectedExp2}
            onChange={(e) => setSelectedExp2(e.target.value)}
            placeholder="Select second experiment"
          >
            <option value="">Select Experiment 2</option>
            {options.map(opt => (
              <option key={opt.pk ?? opt.id ?? opt.code} value={opt.code}>{opt.code}</option>
            ))}
          </Select>
        </div>

        {error && (
          <div style={{ color: '#E53E3E', marginBottom: '12px' }}>{String(error)}</div>
        )}

        {exp1 && exp2 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <MetricComparison
              label="Open Metrics"
              metrics1={exp1.metrics?.open || {}}
              metrics2={exp2.metrics?.open || {}}
              color="#38A169"
            />
            <MetricComparison
              label="Close Metrics"
              metrics1={exp1.metrics?.close || {}}
              metrics2={exp2.metrics?.close || {}}
              color="#E53E3E"
            />
            <MetricComparison
              label="Reg Metrics"
              metrics1={exp1.metrics?.reg || {}}
              metrics2={exp2.metrics?.reg || {}}
              color="#3182CE"
            />
          </div>
        ) : (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#718096',
          }}>
            {loading ? 'Loading...' : 'Select two experiments to compare their metrics'}
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default ExperimentComparison;