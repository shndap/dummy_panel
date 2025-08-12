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

      // Prepare git diff content
      const gitDiffText = gitDiff.status === 'success' ? gitDiff.content : 'Failed to load git diff';

      // Prepare git info content (parse JSON if possible)
      const gitInfoContent = gitInfo.status === 'success' ? gitInfo.content : null;
      let gitInfoObject = null;
      let gitInfoRaw = '';
      if (gitInfoContent != null) {
        if (typeof gitInfoContent === 'string') {
          gitInfoRaw = gitInfoContent;
          try {
            const parsed = JSON.parse(gitInfoContent);
            if (parsed && typeof parsed === 'object') gitInfoObject = parsed;
          } catch (_) {
            // keep as raw string
          }
        } else if (typeof gitInfoContent === 'object') {
          gitInfoObject = gitInfoContent;
          gitInfoRaw = JSON.stringify(gitInfoContent, null, 2);
        }
      }

      setExperimentData({
        gitDiff: gitDiffText,
        gitInfoObject,
        gitInfoRaw,
        otherInfo: 'Loaded from backend',
      });
    } catch (e) {
      setError('Failed to fetch experiment info, make sure the experiment code is correct.');
      setExperimentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderGitInfo = () => {
    if (!experimentData) return null;
    const { gitInfoObject, gitInfoRaw } = experimentData;

    if (gitInfoObject && typeof gitInfoObject === 'object') {
      const entries = Object.entries(gitInfoObject);
      return (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0', color: '#4A5568' }}>Key</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #E2E8F0', color: '#4A5568' }}>Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #EDF2F7', color: '#2D3748', whiteSpace: 'nowrap' }}>{key}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #EDF2F7', color: '#2D3748' }}>
                    {typeof value === 'object' ? (
                      <pre style={{ margin: 0 }}>{JSON.stringify(value, null, 2)}</pre>
                    ) : (
                      String(value)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Fallback to raw text
    return (
      <pre style={{ 
        background: '#f7fafc',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        fontSize: '13px',
        lineHeight: 1.5,
      }}>
        {gitInfoRaw || 'No git info available'}
      </pre>
    );
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
              {renderGitInfo()}
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