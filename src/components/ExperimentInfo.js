import React, { useState, useEffect } from 'react';
import { PageContainer, PageHeader, Card, Button, Input } from './shared/UIComponents';
import { apiFetch } from '../api/client';
import { getFrontendExperiments } from '../api/fulltests';
import { useTheme } from '../contexts/ThemeContext';

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

  const fetchByInput = async (rawInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = (rawInput || '').trim();
      if (!raw) throw new Error('No experiment code provided');
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

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchByInput(experimentCode);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exp = params.get('exp');
    if (exp) {
      setExperimentCode(exp);
      fetchByInput(exp);
    }
  }, []);

  const renderGitDiffPretty = (text) => {
    const lines = String(text || '').split('\n');
    const isHeader = (l) => l.startsWith('diff --git') || l.startsWith('index ') || l.startsWith('+++ ') || l.startsWith('--- ');
    const isHunk = (l) => l.startsWith('@@');
    const isAdd = (l) => l.startsWith('+') && !l.startsWith('+++ ');
    const isDel = (l) => l.startsWith('-') && !l.startsWith('--- ');

    return (
      <div style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: '12px',
        background: '#1e1e1e',
        color: '#e2e8f0',
        padding: '12px',
        borderRadius: '8px',
        overflowX: 'auto',
      }}>
        {lines.map((line, idx) => {
          const style = {
            padding: '0 8px',
            whiteSpace: 'pre',
          };
          if (isHeader(line)) {
            style.background = '#2d3748';
            style.color = '#63b3ed';
          } else if (isHunk(line)) {
            style.background = '#2a4365';
            style.color = '#fbd38d';
          } else if (isAdd(line)) {
            style.background = '#1f3d2b';
            style.color = '#9ae6b4';
          } else if (isDel(line)) {
            style.background = '#4a2020';
            style.color = '#feb2b2';
          } else {
            style.color = '#e2e8f0';
          }
          return (
            <div key={idx} style={style}>
              {line || '\u00A0'}
            </div>
          );
        })}
      </div>
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
              {renderGitDiffPretty(experimentData.gitDiff)}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: '#2d3748', marginBottom: '12px' }}>Git Info</h4>
              {(() => {
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
              })()}
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