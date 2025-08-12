import React, { useState, useEffect } from 'react';
import { PageContainer, PageHeader, Card, Button, Input } from './shared/UIComponents';
import { apiFetch } from '../api/client';
import { getFrontendExperiments } from '../api/fulltests';

const ExperimentInfo = () => {
  const [experimentCode, setExperimentCode] = useState('');
  const [experimentData, setExperimentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const resolveId = async (input) => {
    if (/^\d+$/.test(input)) return input; // numeric id
    const { results } = await getFrontendExperiments({ search: input, limit: 1, page: 1 });
    const match = Array.isArray(results) ? results.find(r => r.code === input) || results[0] : null;
    return match?.pk ?? match?.id ?? input;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const raw = experimentCode.trim();
      const id = await resolveId(raw);
      const [gitDiff, gitInfo] = await Promise.all([
        apiFetch(`/api/fulltests/${id}/git_diff/`),
        apiFetch(`/api/fulltests/${id}/git_info/`),
      ]);
      setExperimentData({
        gitDiff: gitDiff.success ? gitDiff.content : "Failed to load git diff",
        gitInfo: gitInfo.success ? gitInfo.content : "Failed to load git info",
        otherInfo: 'Loaded from backend',
      });
      console.log(gitDiff);
    } catch (e) {
      setError('Failed to fetch experiment info, make sure the experiment code is correct.');
      setExperimentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Experiment Info" />
      
      <Card>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <Input 
              type="text" 
              placeholder="Enter experiment id or code" 
              value={experimentCode}
              onChange={(e) => setExperimentCode(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Loading...' : 'Search'}</Button>
        </form>

        {error && (
          <div style={{ color: '#E53E3E', marginTop: '12px' }}>{String(error)}</div>
        )}

        {experimentData && (
          <div style={{ marginTop: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#2d3748', marginBottom: '12px' }}>Git Diff</h4>
              <pre style={{ 
                background: '#2d3748',
                color: '#e2e8f0',
                padding: '16px',
                borderRadius: '8px',
                overflowX: 'auto',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                {experimentData.gitDiff}
              </pre>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#2d3748', marginBottom: '12px' }}>Git Info</h4>
              <pre style={{ 
                background: '#f7fafc',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '13px',
                lineHeight: 1.5,
              }}>
                {experimentData.gitInfo}
              </pre>
            </div>

            <div>
              <h4 style={{ color: '#2d3748', marginBottom: '12px' }}>Other Info</h4>
              <p style={{ 
                color: '#4a5568',
                lineHeight: 1.6,
                fontSize: '14px',
              }}>
                {experimentData.otherInfo}
              </p>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default ExperimentInfo;