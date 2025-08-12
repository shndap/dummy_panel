import React, { useRef, useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getFrontendExperiments, listFulltests } from '../api/fulltests';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

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

function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

function normalizeExperiment(exp) {
  return {
    ...exp,
    tags: ensureArray(exp.tags),
    improvements: ensureArray(exp.improvements),
    financial: parseMaybeJSON(exp.financial, exp.financial || {}),
    mlMetrics: parseMaybeJSON(exp.mlMetrics, exp.mlMetrics || {}),
    metrics: parseMaybeJSON(exp.metrics, exp.metrics || {}),
  };
}

const Card = ({ title, value, color }) => (
  <div 
    style={{ 
      flex: 1, 
      margin: '10px', 
      padding: '20px', 
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      textAlign: 'center',
      border: `1px solid ${color}`,
    }}
  >
    <h3 style={{ color: color, marginTop: 0 }}>{title}</h3>
    <p style={{ 
      fontSize: '24px', 
      fontWeight: 'bold',
      color: color,
      margin: '10px 0' 
    }}>
      {value}
    </p>
  </div>
);

const ExperimentManager = () => {
  const chartRef = useRef(null);
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const { results } = await listFulltests({});
        const normalized = (results || []).map(normalizeExperiment);
        console.log(normalized.filter(exp => ensureArray(exp.improvements).length > 0));
        if (mounted) setExperiments(normalized);
      } catch (e) {
        if (mounted) setError(e.data || e.message || 'Failed to load experiments');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Baseline values for the tests (optional: could compute from data)
  const baselineData = {
    open: 200,
    close: 150,
    reg: 180,
  };

  // Dummy data for the chart (kept for now)
  const chartLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5'];
  const data = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Open',
        data: [200, 205, 210, 208, 207],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Close',
        data: [150, 152, 149, 151, 150],
        borderColor: 'rgba(255,99,132,1)',
        backgroundColor: 'rgba(255,99,132,0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Reg',
        data: [180, 182, 181, 183, 185],
        borderColor: 'rgba(54,162,235,1)',
        backgroundColor: 'rgba(54,162,235,0.2)',
        fill: true,
        tension: 0.4
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Mean Values Over Time', font: { size: 16 } },
    },
    scales: {
      y: { beginAtZero: false, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { color: 'rgba(0,0,0,0.05)' } },
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h2 style={{ 
        color: '#333',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px',
        marginBottom: '20px'
      }}>
        Experiment Manager (Improvements)
      </h2>

      {/* Baseline Cards */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '20px'
      }}>
        <Card title="Open" value={baselineData.open} color="rgb(75,192,192)" />
        <Card title="Close" value={baselineData.close} color="rgb(255,99,132)" />
        <Card title="Reg" value={baselineData.reg} color="rgb(54,162,235)" />
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 2fr',
        gap: '20px',
        marginBottom: '20px' 
      }}>
        {/* Improvements List */}
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            color: '#333',
            marginTop: 0,
            marginBottom: '15px'
          }}>
            Improved Experiments
          </h3>

          {isLoading && (
            <div style={{ color: '#718096', fontSize: '14px' }}>Loading...</div>
          )}
          {error && (
            <div style={{ color: '#E53E3E', fontSize: '14px' }}>{String(error)}</div>
          )}

          <div style={{ 
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {experiments
              .filter(exp => ensureArray(exp.improvements).length > 0)
              .map(exp => (
                <div 
                  key={exp.id}
                  style={{
                    padding: '10px',
                    marginBottom: '10px',
                    borderLeft: '4px solid',
                    borderLeftColor: 
                      ensureArray(exp.improvements).includes('Open') ? 'rgb(75,192,192)' :
                      ensureArray(exp.improvements).includes('Close') ? 'rgb(255,99,132)' :
                      'rgb(54,162,235)',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '0 4px 4px 0'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{exp.name}</div>
                  <div style={{ fontSize: '12px', color: '#4A5568' }}>{exp.description}</div>
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {ensureArray(exp.improvements).map((imp, idx) => (
                      <span key={idx} style={{
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '11px',
                        backgroundColor: imp === 'Open' ? '#F0FFF4' : imp === 'Close' ? '#FFF5F5' : '#EBF8FF',
                        color: imp === 'Open' ? '#38A169' : imp === 'Close' ? '#E53E3E' : '#3182CE',
                        border: '1px solid #E2E8F0'
                      }}>{imp}</span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Chart */}
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: '400px'
        }}>
          <Line ref={chartRef} data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default ExperimentManager;