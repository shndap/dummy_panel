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
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { getImprovedExperiments } from '../api/fulltests';
import { migrateData } from '../api/dashboard';
import { useTheme } from '../contexts/ThemeContext';
import { hexToRgba } from '../utils/color';
import { getThemeColor, getThemeColorVariant, getChartColors, ThemeColors } from '../utils/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
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
  const [plotType, setPlotType] = useState('overall');

  const { theme } = useTheme();

  // helper chart colors mapped to theme
  const chartColors = getChartColors(theme);

  // Replace the values from default theme palette closest to above hues
  const info = getThemeColor(theme, ThemeColors.INFO);

  // where chartColors were used, swap to chartMapped
  // and replace generic rgba(0,0,0,0.05) grid colors with hexToRgba(theme.tokens.grey[1000], 0.05)
  const gridColor = hexToRgba(theme.tokens.grey[1000] || '#1A202C', 0.05);

  // Also replace boxShadow rgba(0,0,0,0.1) with theme.shadows.sm/md from theme.js where used

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
          ensureArray(exp.goals)
            .filter(goal => {
              // Check if the goal_type is present in exp.improvements (case-insensitive)
              const improvements = ensureArray(exp.improvements).map(i => String(i).toLowerCase());
              const goalType = String(goal.goal_type || '').toLowerCase();
              return improvements.includes(goalType);
            })
            .map(goal => ({
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
      console.log(goalsByType);
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
    const toDate = (d) => {
      if (!d) return null;
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const types = (
      plotType === 'overall' ? ['open', 'close', 'reg'] :
      plotType === 'classification' ? ['open', 'close'] :
      plotType === 'open' ? ['open'] :
      plotType === 'close' ? ['close'] :
      ['reg']
    );

    const colorFor = (type) => (
      type === 'open' ? { border: 'rgba(75,192,192,1)', bg: 'rgba(75,192,192,0.2)' } :
      type === 'close' ? { border: 'rgba(255,99,132,1)', bg: 'rgba(255,99,132,0.2)' } :
      { border: 'rgba(54,162,235,1)', bg: 'rgba(54,162,235,0.2)' }
    );

    const datasets = types.map((type) => {
      const raw = (GoalsByType[type] || [])
        .map(({ date, value }) => ({ x: toDate(date), y: Number(value) }))
        .filter(p => p.x && isFinite(p.y));
      // Sort by date
      raw.sort((a, b) => a.x - b.x);
      const { border, bg } = colorFor(type);
      return {
        label: type.charAt(0).toUpperCase() + type.slice(1),
        data: raw,
        parsing: true, // x/y points
        borderColor: border,
        backgroundColor: bg,
        fill: true,
        tension: 0.3,
        spanGaps: true,
      };
    });

    return { datasets };
  }, [GoalsByType, plotType]);

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
            return parts;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: false, grid: { color: gridColor } },
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'yyyy-MM-dd HH:mm',
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MM-dd HH',
            day: 'yyyy-MM-dd',
            month: 'yyyy-MM',
          }
        },
        grid: { color: gridColor },
        ticks: {
          source: 'auto',
          autoSkip: true,
          maxTicksLimit: 8,
        }
      },
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: theme.colors.background.main,
      minHeight: '100vh'
    }}>
      <h2 style={{ 
        color: theme.colors.text.primary,
        borderBottom: `1px solid ${theme.tokens.ui.divider}`,
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
            border: `1px solid ${theme.colors.border}`,
            background: isMigrating ? theme.tokens.grey[300] : theme.colors.background.paper,
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
          color={chartColors.open.border} 
          expName={maxGoalsByType.open?.expName}
          date={maxGoalsByType.open?.date}
        />
        <Card 
          title="Close" 
          value={maxGoalsByType.close?.value} 
          color={chartColors.close.border} 
          expName={maxGoalsByType.close?.expName}
          date={maxGoalsByType.close?.date}
        />
        <Card 
          title="Reg" 
          value={maxGoalsByType.reg?.value} 
          color={chartColors.reg.border} 
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
          boxShadow: theme.shadows.sm
        }}>
          <h3 style={{ 
            color: theme.colors.text || theme.tokens.text?.main || '#333',
            marginTop: 0,
            marginBottom: '15px'
          }}>
            Improved Experiments
          </h3>

          {isLoading && (
            <div style={{ color: theme.colors.text.secondary, fontSize: '14px' }}>Loading...</div>
          )}
          {error && <div style={{ color: getThemeColor(theme, ThemeColors.ERROR), fontSize: '14px' }}>{String(error)}</div>}

          <div style={{ 
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {experiments
              .filter(exp => ensureArray(exp.improvements).length > 0)
              .map(exp => {
                    const improvements = ensureArray(exp.improvements);
                    const colors = [];
                    if (improvements.includes('Open')) colors.push(chartColors.open.border);
                    if (improvements.includes('Close')) colors.push(chartColors.close.border);
                    if (improvements.includes('Reg')) colors.push(chartColors.reg.border);
                    const colorStops = colors.map((color, index) => `${color} ${(index / colors.length) * 100}%, ${color} ${((index + 1) / colors.length) * 100}%`).join(', ');

                    return (
                      <div 
                        key={exp.id}
                        style={{
                          padding: '10px',
                          marginBottom: '10px',
                          borderLeft: '4px solid',
                          borderImage: `linear-gradient(to bottom, ${colorStops}) 1 100%`,
                          backgroundColor: '#f8f9fa',
                          borderRadius: '0 4px 4px 0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontWeight: 'bold', color: theme.colors.text.primary }}>{exp.code}</div>
                          <button
                            onClick={() => { const u = getPlotsUrl(exp.code); if (u) window.open(u, '_blank', 'noopener'); }}
                            title="Open plots"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M14 3h7v7" stroke={info} strokeWidth="2" strokeLinecap="round"/>
                              <path d="M10 14L21 3" stroke={info} strokeWidth="2" strokeLinecap="round"/>
                              <path d="M21 14v6a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1h6" stroke={info} strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                        <div style={{ fontSize: '12px', color: theme.colors.text.secondary }}>{exp.description}</div>
                        <div style={{ marginTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {ensureArray(exp.improvements).map((imp, idx) => (
                            <span key={idx} style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              backgroundColor: imp === 'Open' ? theme.tokens.grey[100] : imp === 'Close' ? (theme.tokens.red?.light || '#FFF5F5') : theme.tokens.accent.blue.light,
                              color: imp === 'Open' ? getThemeColor(theme, ThemeColors.SUCCESS) :
                            imp === 'Close' ? getThemeColor(theme, ThemeColors.ERROR) :
                            getThemeColor(theme, ThemeColors.INFO),
                              border: `1px solid ${theme.colors.border}`
                            }}>{imp}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
          </div>
        </div>

        {/* Chart */}
        <div style={{ 
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: theme.shadows.sm
        }}>
          <Line ref={chartRef} data={chartData} options={options} />
        </div>

      <div style={{ marginBottom: '20px', textAlign: 'right', display: 'flex', alignItems: 'center', height: '40px' }}>
        <div style={{ marginLeft: 'auto' }}>Select plot type</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setPlotType('overall')} style={{ 
    padding: '8px 12px', 
    borderRadius: '6px', 
    border: `1px solid ${theme.colors.border}`, 
    background: plotType === 'overall' ? getThemeColor(theme, ThemeColors.INFO) : theme.colors.background.paper, 
    color: plotType === 'overall' ? 'white' : theme.colors.text.primary, 
    cursor: 'pointer' 
  }}>Overall</button>
        <button onClick={() => setPlotType('classification')} style={{ 
    padding: '8px 12px', 
    borderRadius: '6px', 
    border: `1px solid ${theme.colors.border}`, 
    background: plotType === 'classification' ? getThemeColor(theme, ThemeColors.INFO) : theme.colors.background.paper, 
    color: plotType === 'classification' ? 'white' : theme.colors.text.primary, 
    cursor: 'pointer' 
  }}>Classification</button>
        <button onClick={() => setPlotType('open')} style={{ 
    padding: '8px 12px', 
    borderRadius: '6px', 
    border: `1px solid ${theme.colors.border}`, 
    background: plotType === 'open' ? getThemeColor(theme, ThemeColors.INFO) : theme.colors.background.paper, 
    color: plotType === 'open' ? 'white' : theme.colors.text.primary, 
    cursor: 'pointer' 
  }}>Open</button>
        <button onClick={() => setPlotType('close')} style={{ 
    padding: '8px 12px', 
    borderRadius: '6px', 
    border: `1px solid ${theme.colors.border}`, 
    background: plotType === 'close' ? getThemeColor(theme, ThemeColors.INFO) : theme.colors.background.paper, 
    color: plotType === 'close' ? 'white' : theme.colors.text.primary, 
    cursor: 'pointer' 
  }}>Close</button>
        <button onClick={() => setPlotType('reg')} style={{ 
    padding: '8px 12px', 
    borderRadius: '6px', 
    border: `1px solid ${theme.colors.border}`, 
    background: plotType === 'reg' ? getThemeColor(theme, ThemeColors.INFO) : theme.colors.background.paper, 
    color: plotType === 'reg' ? 'white' : theme.colors.text.primary, 
    cursor: 'pointer' 
  }}>Reg</button>
      </div>

      </div>
    </div>
  );
};

export default ExperimentManager;