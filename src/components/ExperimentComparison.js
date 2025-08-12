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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <h3>Experiment 1</h3>
            {exp1 ? (
              <pre style={{ background: '#f7fafc', padding: '12px' }}>
                {JSON.stringify(exp1, null, 2)}
              </pre>
            ) : (
              <div>Select an experiment</div>
            )}
          </div>
          <div>
            <h3>Experiment 2</h3>
            {exp2 ? (
              <pre style={{ background: '#f7fafc', padding: '12px' }}>
                {JSON.stringify(exp2, null, 2)}
              </pre>
            ) : (
              <div>Select an experiment</div>
            )}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default ExperimentComparison;