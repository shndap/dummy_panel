import React, { useRef, useEffect, useState, useMemo } from 'react';
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
import { getImprovedExperiments } from '../api/fulltests';
import { migrateData } from '../api/dashboard';

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

function getPlotsUrl(code) {
  if (!code) return null;
  return `https://trader-results.roshan-ai.ir/fulltest_cache/${encodeURIComponent(code)}_FullTest/plots.html`;
}

const Card = ({ title, value, color, expName, date }) => {
  // Format value to 5 decimals if it's a number
  let displayValue = value;
  if (typeof value === 'number') {
    displayValue = value.toFixed(5);
  } else if (!isNaN(Number(value))) {
    displayValue = Number(value).toFixed(5);
  }

  // Better date handling
  let displayDate = '';
  if (date) {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      // Format: YYYY-MM-DD HH:mm (24h)
      const pad = n => n.toString().padStart(2, '0');
      displayDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } else if (typeof date === 'string') {
      displayDate = date;
    }
  }

  return (
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
        {displayValue}
      </p>
      {(expName || displayDate) && (
        <div style={{ fontSize: '12px', color: '#888', marginTop: '-8px' }}>
          {expName && <div>{expName}</div>}
          {displayDate && <div>{displayDate}</div>}
        </div>
      )}
    </div>
  );
};

const ExperimentManager = () => {
  const chartRef = useRef(null);
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [maxGoalsByType, setMaxGoalsByType] = useState({});
  const [GoalsByType, setGoalsByType] = useState({});
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  async function loadExperiments() {
    setIsLoading(true);
    setError(null);
    try {
      const { results } = await getImprovedExperiments({ limit: 50, page: 1 });
      const normalized = (results || []).map(normalizeExperiment);
      setExperiments(normalized.filter(exp => ensureArray(exp.improvements).length > 0 && exp.isValid));
      // Flatten all goals into a single array
      // Group goals by goal_type and filter valid: true
      // Collect goals by type, include exp.name with goal.value, and ensure open/close/reg are present
      const types = ['open', 'close', 'reg'];
      const goalsByType = normalized
        .filter(exp => ensureArray(exp.improvements).length > 0)
        .filter(exp => exp.isValid)
        .flatMap(exp =>
          ensureArray(exp.goals).map(goal => ({
            ...goal,
            expName: exp.code,
            expDate: exp.created_at || exp.date || null
          }))
        )
        .reduce((acc, goal) => {
          const type = goal.goal_type || 'unknown';
          if (!acc[type]) acc[type] = [];
          acc[type].push({ 
            value: goal.value, 
            expName: goal.expName, 
            date: goal.expDate 
          });
          return acc;
        }, {});

      // Ensure open, close, reg keys exist (even if empty)
      types.forEach(type => {
        if (!goalsByType[type]) goalsByType[type] = [];
      });

      // Extract the max value for each type, along with its date and expName
      const maxGoalsByType = {};
      types.forEach(type => {
        const arr = goalsByType[type];
        if (arr.length > 0) {
          const maxGoal = arr.reduce((max, curr) => 
            (max == null || (curr.value != null && curr.value > max.value)) ? curr : max
          , null);
          maxGoalsByType[type] = maxGoal;
        } else {
          maxGoalsByType[type] = null;
        }
      });
      setMaxGoalsByType(maxGoalsByType);
      setGoalsByType(goalsByType);
    } catch (e) {
      setError(e.data || e.message || 'Failed to load experiments');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      await loadExperiments();
    })();
    return () => { mounted = false; };
  }, []);

  const onRefreshClick = async () => {
    setIsMigrating(true);
    setError(null);
    try {
      await migrateData();
      await loadExperiments();
    } catch (e) {
      setError(e.data || e.message || 'Failed to refresh experiments');
    } finally {
      setIsMigrating(false);
    }
  };

  // Build chart data from goals by type
  const chartData = useMemo(() => {
    // Collect unique timestamps (ms) from all types
    const toTs = (d) => {
      if (!d) return null;
      const t = new Date(d).getTime();
      return isNaN(t) ? null : t;
    };
    const tsSet = new Set();
    ['open', 'close', 'reg'].forEach(type => {
      const arr = GoalsByType[type] || [];
      arr.forEach(({ date }) => {
        const ts = toTs(date);
        if (ts != null) tsSet.add(ts);
      });
    });
    let labelsTs = Array.from(tsSet).sort((a, b) => a - b);
    // Limit to most recent 50 points for readability
    if (labelsTs.length > 50) labelsTs = labelsTs.slice(-50);

    const formatLabel = (ts) => {
      const d = new Date(ts);
      const pad = n => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    const labels = labelsTs.map(formatLabel);

    const buildSeries = (type) => {
      const map = {};
      (GoalsByType[type] || []).forEach(({ date, value }) => {
        const ts = toTs(date);
        if (ts != null) map[ts] = Number(value);
      });
      return labelsTs.map(ts => (ts in map ? map[ts] : null));
    };

    const buildNameSeries = (type) => {
      const map = {};
      (GoalsByType[type] || []).forEach(({ date, expName }) => {
        const ts = toTs(date);
        if (ts != null) map[ts] = expName;
      });
      return labelsTs.map(ts => (ts in map ? map[ts] : ''));
    };

    return {
      labels,
      datasets: [
        {
          label: 'Open',
          data: buildSeries('open'),
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
          fill: true,
          tension: 0.4,
          pointExpNames: buildNameSeries('open'),
        },
        {
          label: 'Close',
          data: buildSeries('close'),
          borderColor: 'rgba(255,99,132,1)',
          backgroundColor: 'rgba(255,99,132,0.2)',
          fill: true,
          tension: 0.4,
          pointExpNames: buildNameSeries('close'),
        },
        {
          label: 'Reg',
          data: buildSeries('reg'),
          borderColor: 'rgba(54,162,235,1)',
          backgroundColor: 'rgba(54,162,235,0.2)',
          fill: true,
          tension: 0.4,
          pointExpNames: buildNameSeries('reg'),
        },
      ],
    };
  }, [GoalsByType]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Mean Values Over Time', font: { size: 16 } },
      tooltip: {
        callbacks: {
          label: function(ctx) {
            const y = ctx.parsed.y;
            const parts = [];
            if (y != null) parts.push(`${ctx.dataset.label}: ${y}`);
            const name = (ctx.dataset.pointExpNames || [])[ctx.dataIndex];
            if (name) parts.push(`Exp: ${name}`);
            // Use array for multi-line, not join('\n'), for Chart.js v3+ compatibility
            return parts;
          }
        }
      }
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
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>Experiment Manager (Improvements)</span>
        <button
          onClick={onRefreshClick}
          disabled={isMigrating}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #CBD5E0',
            background: isMigrating ? '#EDF2F7' : 'white',
            cursor: isMigrating ? 'not-allowed' : 'pointer',
            fontSize: '13px'
          }}
        >
          {isMigrating ? 'Refreshing…' : 'Refresh'}
        </button>
      </h2>

      {/* Baseline Cards */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '20px'
      }}>
        <Card 
          title="Open" 
          value={maxGoalsByType.open?.value} 
          color="rgb(75,192,192)" 
          expName={maxGoalsByType.open?.expName}
          date={maxGoalsByType.open?.date}
        />
        <Card 
          title="Close" 
          value={maxGoalsByType.close?.value} 
          color="rgb(255,99,132)" 
          expName={maxGoalsByType.close?.expName}
          date={maxGoalsByType.close?.date}
        />
        <Card 
          title="Reg" 
          value={maxGoalsByType.reg?.value} 
          color="rgb(54,162,235)" 
          expName={maxGoalsByType.reg?.expName}
          date={maxGoalsByType.reg?.date}
        />
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 'bold', color: '#2D3748' }}>{exp.code}</div>
                    <button
                      onClick={() => { const u = getPlotsUrl(exp.code); if (u) window.open(u, '_blank', 'noopener'); }}
                      title="Open plots"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M6 4h9a3 3 0 013 3v11a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z"
                          stroke="#2F855A"
                          strokeWidth="2"
                        />
                        <path d="M15 4c0 1.657 1.343 3 3 3" stroke="#2F855A" strokeWidth="2" />
                        <path
                          d="M9 10h6M9 14h6"
                          stroke="#2F855A"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
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
          <Line ref={chartRef} data={chartData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default ExperimentManager;