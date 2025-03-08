import React, { useState } from 'react';
import { PageContainer, PageHeader, Card, Button, Input } from './shared/UIComponents';

const ExperimentInfo = () => {
  const [experimentCode, setExperimentCode] = useState('');
  const [experimentData, setExperimentData] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    // Simulate fetching experiment data based on experimentCode.
    // In a real implementation, make an API call here.
    const dummyData = {
      gitDiff: `diff --git a/file.js b/file.js
index 83db48f..bf3b5a1 100644
--- a/file.js
+++ b/file.js
@@ -1,4 +1,4 @@
-console.log('Hello World');
+console.log('Hello, Updated World!');`,
      gitInfo: "Commit: abcdef12345\nAuthor: Your Name\nDate: 2023-10-10",
      otherInfo: "Additional experiment info here..."
    };
    setExperimentData(dummyData);
  };

  return (
    <PageContainer>
      <PageHeader title="Experiment Info" />
      
      <Card>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <Input 
              type="text" 
              placeholder="Enter experiment code" 
              value={experimentCode}
              onChange={(e) => setExperimentCode(e.target.value)}
            />
          </div>
          <Button type="submit">Search</Button>
        </form>

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