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
      : [],
  };
}

const ImprovementBadges = ({ improvements }) => (
  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
    {['Open', 'Close', 'Reg'].map((imp) => (
      <span
        key={imp}
        title={improvements.includes(imp) ? `${imp} present` : `${imp} absent`}
        style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          border: '1px solid #E2E8F0',
          backgroundColor: improvements.includes(imp)
            ? (imp === 'Open' ? '#F0FFF4' : imp === 'Close' ? '#FFF5F5' : '#EBF8FF')
            : '#F7FAFC',
          color: improvements.includes(imp)
            ? (imp === 'Open' ? '#38A169' : imp === 'Close' ? '#E53E3E' : '#3182CE')
            : '#A0AEC0',
        }}
      >
        {imp}
      </span>
    ))}
  </div>
);

const MetricTable = ({ label, m1 = {}, m2 = {} }) => {
  const rows = [
    { key: 'mse', name: 'MSE', higherIsBetter: false, format: (v) => (v == null ? '-' : Number(v).toFixed(4)) },
    { key: 'buyHighlow', name: 'Buy High/Low', higherIsBetter: true, format: (v) => (v == null ? '-' : `${(Number(v) * 100).toFixed(1)}%`) },
    { key: 'sellHighlow', name: 'Sell High/Low', higherIsBetter: true, format: (v) => (v == null ? '-' : `${(Number(v) * 100).toFixed(1)}%`) },
  ];

  const compare = (v1, v2, higherIsBetter) => {
    if (v1 == null || v2 == null || isNaN(Number(v1)) || isNaN(Number(v2))) return { better: 0, change: null };
    const n1 = Number(v1);
    const n2 = Number(v2);
    if (n1 === n2) return { better: 0, change: 0 };
    const better = higherIsBetter ? (n1 > n2 ? 1 : -1) : (n1 < n2 ? 1 : -1);
    const base = higherIsBetter ? n2 : n2; // percentage vs exp2
    const change = base !== 0 ? ((n1 - n2) / Math.abs(base)) * 100 : null;
    return { better, change };
  };

  return (
    <div style={{ border: '1px solid #E2E8F0', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ background: '#F7FAFC', padding: '8px 12px', fontWeight: 600, color: '#4A5568' }}>{label}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0', color: '#4A5568' }}>Metric</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #E2E8F0', color: '#4A5568' }}>Exp 1</th>
            <th style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #E2E8F0', color: '#4A5568' }}>Exp 2</th>
            <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0', color: '#4A5568' }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, name, higherIsBetter, format }) => {
            const v1 = m1[key];
            const v2 = m2[key];
            const { better, change } = compare(v1, v2, higherIsBetter);
            const arrow = better === 0 ? '–' : better > 0 ? '↑' : '↓';
            const color = better === 0 ? '#718096' : better > 0 ? '#38A169' : '#E53E3E';
            return (
              <tr key={key}>
                <td style={{ padding: '8px', borderBottom: '1px solid #EDF2F7', color: '#2D3748' }}>{name}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #EDF2F7', color: '#2D3748', textAlign: 'right' }}>{format(v1)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #EDF2F7', color: '#2D3748', textAlign: 'right' }}>{format(v2)}</td>
                <td style={{ padding: '8px', borderBottom: '1px solid #EDF2F7', color }}>
                  {change == null ? arrow : (
                    <span>{arrow} {Math.abs(change).toFixed(2)}%</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

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
      setError(e.data || e.message || 'Failed to load experiment');
      setter(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer>
      <PageHeader title="Experiment Comparison" />
      <Card>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 1 }}>
            <label>Experiment 1</label>
            <Select value={selectedExp1} onChange={(e) => { setSelectedExp1(e.target.value); loadByCode(e.target.value, setExp1); }}>
              <option value="">Select...</option>
              {options.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.code}</option>
              ))}
            </Select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Experiment 2</label>
            <Select value={selectedExp2} onChange={(e) => { setSelectedExp2(e.target.value); loadByCode(e.target.value, setExp2); }}>
              <option value="">Select...</option>
              {options.map(opt => (
                <option key={opt.code} value={opt.code}>{opt.code}</option>
              ))}
            </Select>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div style={{ color: '#E53E3E' }}>{String(error)}</div>}

        {exp1 || exp2 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px', color: '#2D3748' }}>{exp1?.code || 'Experiment 1'}</h3>
              <ImprovementBadges improvements={Array.isArray(exp1?.improvements) ? exp1.improvements : []} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 8px', color: '#2D3748' }}>{exp2?.code || 'Experiment 2'}</h3>
              <ImprovementBadges improvements={Array.isArray(exp2?.improvements) ? exp2.improvements : []} />
            </div>
          </div>
        ) : null}

        {exp1 && exp2 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <MetricTable label="Open Metrics" m1={exp1.metrics?.open} m2={exp2.metrics?.open} />
            <MetricTable label="Close Metrics" m1={exp1.metrics?.close} m2={exp2.metrics?.close} />
            <MetricTable label="Reg Metrics" m1={exp1.metrics?.reg} m2={exp2.metrics?.reg} />
          </div>
        ) : (
          <div style={{ padding: '24px', color: '#718096' }}>
            Select two experiments to compare their metrics.
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default ExperimentComparison;