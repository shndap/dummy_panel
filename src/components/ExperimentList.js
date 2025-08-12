import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer, PageHeader, Card, Input, Select, Button } from './shared/UIComponents';
import { getFrontendExperiments, patchFulltest, addImprovementType, removeImprovementType } from '../api/fulltests';

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
  const financial = parseMaybeJSON(exp.financial, exp.financial || {});
  const mlMetrics = parseMaybeJSON(exp.mlMetrics, exp.mlMetrics || {});
  const metrics = parseMaybeJSON(exp.metrics, exp.metrics || {});
  const rawImprovements = exp.improvements != null ? exp.improvements : exp.improvement_type;
  return {
    ...exp,
    tags: ensureArray(exp.tags),
    improvements: ensureArray(rawImprovements),
    financial,
    mlMetrics,
    metrics,
  };
}

const ExperimentList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'table', or 'metrics'
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedExps, setSelectedExps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState(null);
  const [editForm, setEditForm] = useState({
    code: '',
    description: '',
    author: '',
    status: '',
    is_valid: true,
    tags: [],
    improvement_types: []
  });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const { results, count } = await getFrontendExperiments({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm || undefined,
          filterType: filterType === 'all' ? undefined : filterType,
          sortBy: sortConfig.key,
          sortOrder: sortConfig.direction,
          tags: selectedTags.join(',') || undefined,
        });
        const normalized = (results || []).map(normalizeExperiment);
        setExperiments(normalized);
        setTotalCount(typeof count === 'number' ? count : normalized.length);
      } catch (e) {
        setError(e.data || e.message || 'Failed to load experiments');
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [currentPage, itemsPerPage, searchTerm, filterType, sortConfig.key, sortConfig.direction, selectedTags]);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    for (const exp of experiments) {
      ensureArray(exp.tags).forEach(t => tagSet.add(t));
    }
    return Array.from(tagSet).sort();
  }, [experiments]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const paginatedExperiments = experiments;

  const sortedExperiments = useMemo(() => {
    // Backend already sorts, but keep client-side as a fallback
    const arr = [...paginatedExperiments];
    const { key, direction } = sortConfig;
    return arr.sort((a, b) => {
      const dir = direction === 'asc' ? 1 : -1;
      if (key === 'date') return (new Date(a.date) - new Date(b.date)) * dir;
      if (key === 'pnl') return ((a.financial?.pnl ?? 0) - (b.financial?.pnl ?? 0)) * dir;
      if (key === 'winRate') return ((a.financial?.winRate ?? 0) - (b.financial?.winRate ?? 0)) * dir;
      if (key === 'precision') return ((a.mlMetrics?.precision ?? 0) - (b.mlMetrics?.precision ?? 0)) * dir;
      return 0;
    });
  }, [paginatedExperiments, sortConfig]);

  const TagBadge = ({ tag, onClick, selected }) => (
    <span
      onClick={onClick}
      style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '500',
        backgroundColor: selected ? '#3182CE' : '#EDF2F7',
        color: selected ? 'white' : '#4A5568',
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-block',
        margin: '2px',
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
        maxWidth: '120px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        border: '1px solid',
        borderColor: selected ? '#3182CE' : '#E2E8F0',
        '&:hover': {
          backgroundColor: selected ? '#2C5282' : '#E2E8F0',
        }
      }}
      title={tag}
    >
      {tag}
    </span>
  );

  const ImprovementBadges = ({ improvements, status }) => {
    if (status === 'invalid') {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: '#FED7D7',
          color: '#E53E3E',
        }}>
          Invalid
        </span>
      );
    }

    const improvementList = ensureArray(improvements);

    if (improvementList.length === 0) {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
          backgroundColor: '#EDF2F7',
          color: '#718096',
        }}>
          No Improvement
        </span>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {improvementList.map((imp, index) => (
          <span
            key={index}
            style={{
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: 
                imp === 'Open' ? '#F0FFF4' :
                imp === 'Close' ? '#FFF5F5' :
                '#EBF8FF',
              color:
                imp === 'Open' ? '#38A169' :
                imp === 'Close' ? '#E53E3E' :
                '#3182CE',
            }}
          >
            {imp}
          </span>
        ))}
      </div>
    );
  };

  // Add back the MetricGroup component
  const MetricGroup = ({ label, metrics, color }) => (
    <div style={{ 
      padding: '4px 8px',
      backgroundColor: `${color}10`,
      borderRadius: '4px',
      border: `1px solid ${color}30`,
      fontSize: '12px',
    }}>
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: `${color}DD`,
      }}>
        <span style={{ 
          fontWeight: '600',
          color: color,
        }}>
          {label}:
        </span>
        {Object.entries(metrics).map(([key, value]) => (
          <span key={key}>
            {key === 'mse' ? 
              `MSE:${value.toFixed(4)}` : 
              key.includes('highlow') ?
                `${key.includes('Buy') ? 'HB' : 'HS'}:${(value * 100).toFixed(1)}%` :
                `${key.includes('buy') ? 'B' : 'S'}:${value}`
            }
          </span>
        ))}
      </div>
    </div>
  );

  const QuickFilter = ({ label, count, active, onClick }) => (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        background: active ? '#EDF2F7' : 'white',
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {label}
      <span style={{ 
        background: active ? '#4A5568' : '#A0AEC0',
        color: 'white',
        padding: '2px 6px',
        borderRadius: '10px',
        fontSize: '11px',
      }}>
        {count}
      </span>
    </button>
  );

  const exportToCSV = () => {
    const headers = [
      'Code', 'Date', 'Author', 'Description', 'Status', 'Tags', 
      'PnL', 'Profit', 'Loss', 'Win Rate', 'Total Trades', 'Sharpe Ratio', 'Max Drawdown',
      'PnL Q1', 'PnL Q2', 'PnL Q3', 'PnL Q4',
      'Precision', 'Recall', 'F1 Score', 'Accuracy',
      'Val Precision', 'Val Recall', 'Val F1', 'Val Accuracy',
      'Profit Factor', 'Calmar Ratio', 'Sortino Ratio'
    ];

    const toPercent = (v) => v == null ? '' : `${(v * 100).toFixed(1)}%`;
    const safe = (v) => (v == null ? '' : String(v));

    const data = experiments.map(exp => {
      const fin = typeof exp.financial === 'string' ? JSON.parse(exp.financial) : (exp.financial || {});
      const ml = typeof exp.mlMetrics === 'string' ? JSON.parse(exp.mlMetrics) : (exp.mlMetrics || {});
      return [
        exp.code,
        exp.date,
        exp.author,
        exp.description,
        exp.status,
        Array.isArray(exp.tags) ? exp.tags.join(';') : safe(exp.tags),
        safe(fin.pnl?.toFixed ? fin.pnl.toFixed(2) : fin.pnl),
        safe(fin.profit?.toFixed ? fin.profit.toFixed(2) : fin.profit),
        safe(fin.loss?.toFixed ? fin.loss.toFixed(2) : fin.loss),
        toPercent(fin.winRate),
        safe(fin.totalTrades),
        safe(fin.sharpeRatio?.toFixed ? fin.sharpeRatio.toFixed(3) : fin.sharpeRatio),
        fin.maxDrawdown != null ? `${(fin.maxDrawdown * 100).toFixed(1)}%` : '',
        safe(fin.pnlQ1),
        safe(fin.pnlQ2),
        safe(fin.pnlQ3),
        safe(fin.pnlQ4),
        toPercent(ml.precision),
        toPercent(ml.recall),
        toPercent(ml.f1Score),
        toPercent(ml.accuracy),
        toPercent(ml.validationPrecision),
        toPercent(ml.validationRecall),
        toPercent(ml.validationF1),
        toPercent(ml.validationAccuracy),
        safe(fin.profitFactor?.toFixed ? fin.profitFactor.toFixed(2) : fin.profitFactor),
        safe(fin.calmarRatio?.toFixed ? fin.calmarRatio.toFixed(3) : fin.calmarRatio),
        safe(fin.sortinoRatio?.toFixed ? fin.sortinoRatio.toFixed(3) : fin.sortinoRatio),
      ];
    });

    const csvContent = [headers, ...data]
      .map(row => row.join(','))
      .join('\n');
      
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'experiments_metrics.csv';
    a.click();
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
    setCurrentPage(1);
  };

  // Edit modal functions
  const openEditModal = (experiment) => {
    setEditingExperiment(experiment);
    console.log('Editting:', experiment);
    setEditForm({
      code: experiment.code,
      description: experiment.description,
      author: experiment.author,
      status: experiment.status || '',
      is_valid: experiment.is_valid === undefined ? true : !!experiment.is_valid,
      tags: [...experiment.tags],
      improvement_types: ensureArray(experiment.improvements)
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingExperiment(null);
    setEditForm({
      code: '',
      description: '',
      author: '',
      status: '',
      is_valid: true,
      tags: [],
      improvement_types: []
    });
  };

  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setEditForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleImprovementToggle = (improvement) => {
    setEditForm(prev => ({
      ...prev,
      improvement_types: prev.improvement_types.includes(improvement)
        ? prev.improvement_types.filter(imp => imp !== improvement)
        : [...prev.improvement_types, improvement]
    }));
  };

  const addNewTag = (newTag) => {
    if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
      setEditForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
    }
  };

  const saveExperiment = async () => {
    if (!editingExperiment) return;

    try {
      const entityId = editingExperiment.pk ?? editingExperiment.id;
      const VALID_STATUS = ['created', 'running', 'completed', 'failed', 'stopped'];

      const patchBody = { description: editForm.description, is_valid: !!editForm.is_valid };
      if (VALID_STATUS.includes(editForm.status)) {
        patchBody.status = editForm.status;
      }

      await patchFulltest(entityId, patchBody);

      const before = Array.isArray(editingExperiment.improvements) ? editingExperiment.improvements : String(editingExperiment.improvements || '').split(',').map(s => s.trim()).filter(Boolean);
      const after = Array.isArray(editForm.improvement_types) ? editForm.improvement_types : String(editForm.improvement_types || '').split(',').map(s => s.trim()).filter(Boolean);
      const toAdd = after.filter(x => !before.includes(x));
      const toRemove = before.filter(x => !after.includes(x));

      await Promise.all([
        ...toAdd.map(type => addImprovementType(entityId, type)),
        ...toRemove.map(type => removeImprovementType(entityId, type)),
      ]);
      console.log(editForm);

      setExperiments(prev => prev.map(exp => {
        if ((exp.pk ?? exp.id) !== entityId) return exp;
        const updated = { ...exp };
        updated.description = editForm.description;
        if (VALID_STATUS.includes(editForm.status)) {
          updated.status = editForm.status;
        }
        updated.is_valid = !!editForm.is_valid;
        updated.improvements = after;
        delete updated.improvement_types;
        return normalizeExperiment(updated);
      }));
    } catch (e) {
      alert(`Failed to save: ${e.data ? JSON.stringify(e.data) : e.message}`);
    } finally {
      closeEditModal();
    }
  };

  return (
    <PageContainer>
      <PageHeader title="All Experiments" />
      
      <Card>
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <Input
            type="text"
            placeholder="Search experiments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '200px' }}
          >
            <option value="all">All Types</option>
            <option value="invalid">Invalid Experiments</option>
            <option value="no_improvement">No Improvement</option>
            <option value="Open">Open Improvement</option>
            <option value="Close">Close Improvement</option>
            <option value="Reg">Reg Improvement</option>
          </Select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button 
              variant={viewMode === 'list' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('list')}
            >
              List View
            </Button>
            <Button 
              variant={viewMode === 'table' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('table')}
            >
              Data Table
            </Button>
            <Button 
              variant={viewMode === 'metrics' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('metrics')}
            >
              Metrics Table
            </Button>
          </div>
        </div>

        {/* Tag Filter */}
        <div style={{ 
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#F7FAFC',
          borderRadius: '8px',
          border: '1px solid #E2E8F0',
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '600', 
            marginBottom: '8px',
            color: '#4A5568'
          }}>
            Filter by Tags:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'flex-start' }}>
            {allTags.map(tag => (
              <TagBadge
                key={tag}
                tag={tag}
                selected={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
          {selectedTags.length > 0 && (
            <div style={{ 
              marginTop: '8px',
              fontSize: '12px',
              color: '#718096'
            }}>
              Selected: {selectedTags.join(', ')}
              <button
                onClick={() => setSelectedTags([])}
                style={{
                  marginLeft: '8px',
                  padding: '2px 6px',
                  fontSize: '11px',
                  border: '1px solid #CBD5E0',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '16px',
          flexWrap: 'wrap',
        }}>
          <QuickFilter 
            label="All"
            count={totalCount}
            active={filterType === 'all'}
            onClick={() => setFilterType('all')}
          />
          <QuickFilter 
            label="Invalid"
            count={experiments.filter(e => e.status === 'invalid').length}
            active={filterType === 'invalid'}
            onClick={() => setFilterType('invalid')}
          />
          <QuickFilter 
            label="Profitable"
            count={experiments.filter(e => e.financial?.pnl > 0).length}
            active={false}
            onClick={() => {}}
          />
          <QuickFilter 
            label="High Win Rate"
            count={experiments.filter(e => e.financial?.winRate > 0.6).length}
            active={false}
            onClick={() => {}}
          />
        </div>

        {isLoading && (
          <div style={{
            padding: '32px',
            textAlign: 'center',
            color: '#718096',
          }}>
            Loading experiments...
          </div>
        )}

        {error && (
          <div style={{
            padding: '16px',
            background: '#FED7D7',
            color: '#E53E3E',
            borderRadius: '6px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {viewMode === 'list' ? (
          <div style={{ 
            overflowX: 'auto',
            position: 'relative',
            zIndex: 1,
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0',
              fontSize: '14px',
            }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={e => {
                        setSelectedExps(e.target.checked ? paginatedExperiments.map(exp => exp.id) : []);
                      }}
                    />
                  </th>
                  <th style={{ ...thStyle }}>Code</th>
                  <th 
                    style={{ 
                      ...thStyle, 
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      setSortConfig({
                        key: 'date',
                        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
                      });
                    }}
                  >
                    Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ ...thStyle }}>Author</th>
                  <th style={{ ...thStyle }}>Description</th>
                  <th style={{ ...thStyle }}>Tags</th>
                  <th style={{ ...thStyle }}>Metrics</th>
                  <th style={{ ...thStyle }}>Improvement Types</th>
                  <th style={{ ...thStyle }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedExperiments.map(exp => (
                  <tr 
                    key={exp.id}
                    style={{
                      transition: 'background-color 0.2s ease',
                      backgroundColor: exp.status === 'invalid' ? '#FFF5F5' : 'white',
                      '&:hover': {
                        backgroundColor: exp.status === 'invalid' ? '#FED7D7' : '#F7FAFC',
                      },
                    }}
                  >
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={selectedExps.includes(exp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedExps([...selectedExps, exp.id]);
                          } else {
                            setSelectedExps(selectedExps.filter(id => id !== exp.id));
                          }
                        }}
                      />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>{exp.code}</td>
                    <td style={tdStyle}>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={tdStyle}>{exp.author}</td>
                    <td style={tdStyle}>{exp.description}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '200px', alignItems: 'flex-start' }}>
                        {exp.tags.map(tag => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                    </td>
                    <td style={{ ...tdStyle }}>
                      <div style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}>
                        <MetricGroup 
                          label="Open" 
                          metrics={exp.metrics.open}
                          color="#38A169"
                        />
                        <MetricGroup 
                          label="Close" 
                          metrics={exp.metrics.close}
                          color="#E53E3E"
                        />
                        <MetricGroup 
                          label="Reg" 
                          metrics={exp.metrics.reg}
                          color="#3182CE"
                        />
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <ImprovementBadges 
                        improvements={exp.improvements}
                        status={exp.status}
                      />
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          variant="secondary" 
                          onClick={() => window.location.href = `/comparison?exp=${exp.code}`}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Compare
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => window.location.href = `/info?exp=${exp.code}`}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Details
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => openEditModal(exp)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : viewMode === 'table' ? (
          <div style={{ 
            overflowX: 'auto',
            position: 'relative',
            zIndex: 1,
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0',
              fontSize: '14px',
            }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={e => {
                        setSelectedExps(e.target.checked ? paginatedExperiments.map(exp => exp.id) : []);
                      }}
                    />
                  </th>
                  <th style={{ ...thStyle }}>Code</th>
                  <th style={{ ...thStyle }}>Date</th>
                  <th style={{ ...thStyle }}>Author</th>
                  <th style={{ ...thStyle }}>Status</th>
                  <th style={{ ...thStyle }}>Tags</th>
                  <th 
                    style={{ 
                      ...thStyle, 
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      setSortConfig({
                        key: 'pnl',
                        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
                      });
                    }}
                  >
                    PnL {sortConfig.key === 'pnl' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ ...thStyle }}>Profit</th>
                  <th style={{ ...thStyle }}>Loss</th>
                  <th style={{ ...thStyle }}>Total Trades</th>
                  <th 
                    style={{ 
                      ...thStyle, 
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => {
                      setSortConfig({
                        key: 'winRate',
                        direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
                      });
                    }}
                  >
                    Win Rate {sortConfig.key === 'winRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ ...thStyle }}>Avg Win</th>
                  <th style={{ ...thStyle }}>Avg Loss</th>
                  <th style={{ ...thStyle }}>Sharpe Ratio</th>
                  <th style={{ ...thStyle }}>Max Drawdown</th>
                  <th style={{ ...thStyle }}>Volatility</th>
                  <th style={{ ...thStyle }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedExperiments.map(exp => (
                  <tr 
                    key={exp.id}
                    style={{
                      transition: 'background-color 0.2s ease',
                      backgroundColor: exp.status === 'invalid' ? '#FFF5F5' : 'white',
                      '&:hover': {
                        backgroundColor: exp.status === 'invalid' ? '#FED7D7' : '#F7FAFC',
                      },
                    }}
                  >
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={selectedExps.includes(exp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedExps([...selectedExps, exp.id]);
                          } else {
                            setSelectedExps(selectedExps.filter(id => id !== exp.id));
                          }
                        }}
                      />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>{exp.code}</td>
                    <td style={tdStyle}>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={tdStyle}>{exp.author}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: exp.status === 'invalid' ? '#FED7D7' : '#F0FFF4',
                        color: exp.status === 'invalid' ? '#E53E3E' : '#38A169',
                      }}>
                        {exp.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '150px', alignItems: 'flex-start' }}>
                        {exp.tags.slice(0, 2).map(tag => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                        {exp.tags.length > 2 && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            backgroundColor: '#EDF2F7',
                            color: '#4A5568',
                            whiteSpace: 'nowrap',
                          }}>
                            +{exp.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.pnl > 0 ? '#38A169' : '#E53E3E',
                      fontWeight: '600'
                    }}>
                      ${exp.financial?.pnl?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ ...tdStyle, color: '#38A169' }}>
                      ${exp.financial?.profit?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ ...tdStyle, color: '#E53E3E' }}>
                      ${exp.financial?.loss?.toFixed(2) || '0.00'}
                    </td>
                    <td style={tdStyle}>{exp.financial?.totalTrades || 0}</td>
                    <td style={tdStyle}>
                      <span style={{
                        color: exp.financial?.winRate > 0.6 ? '#38A169' : 
                               exp.financial?.winRate > 0.4 ? '#D69E2E' : '#E53E3E',
                        fontWeight: '600'
                      }}>
                        {(exp.financial?.winRate * 100).toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td style={{ ...tdStyle, color: '#38A169' }}>
                      ${exp.financial?.avgWin?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ ...tdStyle, color: '#E53E3E' }}>
                      ${exp.financial?.avgLoss?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.sharpeRatio > 1 ? '#38A169' : 
                             exp.financial?.sharpeRatio > 0 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {exp.financial?.sharpeRatio?.toFixed(3) || '0.000'}
                    </td>
                    <td style={{ ...tdStyle, color: '#E53E3E' }}>
                      {(exp.financial?.maxDrawdown * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={tdStyle}>
                      {(exp.financial?.volatility * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          variant="secondary" 
                          onClick={() => window.location.href = `/comparison?exp=${exp.code}`}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Compare
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => window.location.href = `/info?exp=${exp.code}`}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Details
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => openEditModal(exp)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Comprehensive Metrics Table View
          <div style={{ 
            overflowX: 'auto',
            position: 'relative',
            zIndex: 1,
          }}>
            <table style={{ 
              width: '100%',
              borderCollapse: 'separate',
              borderSpacing: '0',
              fontSize: '12px',
            }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={e => {
                        setSelectedExps(e.target.checked ? paginatedExperiments.map(exp => exp.id) : []);
                      }}
                    />
                  </th>
                  <th style={{ ...thStyle }}>Code</th>
                  <th style={{ ...thStyle }}>Date</th>
                  <th style={{ ...thStyle }}>Status</th>
                  <th style={{ ...thStyle }}>Tags</th>
                  
                  {/* Financial Metrics */}
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>Total PnL</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>PnL Q1</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>PnL Q2</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>PnL Q3</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>PnL Q4</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>Win Rate</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>Sharpe</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>Max DD</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>Profit Factor</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>Calmar</th>
                  <th style={{ ...thStyle, backgroundColor: '#F0FFF4' }}>Sortino</th>
                  
                  {/* ML Metrics */}
                  <th style={{ ...thStyle, backgroundColor: '#EBF8FF' }}>Precision</th>
                  <th style={{ ...thStyle, backgroundColor: '#EBF8FF' }}>Recall</th>
                  <th style={{ ...thStyle, backgroundColor: '#EBF8FF' }}>F1 Score</th>
                  <th style={{ ...thStyle, backgroundColor: '#EBF8FF' }}>Accuracy</th>
                  
                  {/* Validation Metrics */}
                  <th style={{ ...thStyle, backgroundColor: '#FFF5F5' }}>Val Precision</th>
                  <th style={{ ...thStyle, backgroundColor: '#FFF5F5' }}>Val Recall</th>
                  <th style={{ ...thStyle, backgroundColor: '#FFF5F5' }}>Val F1</th>
                  <th style={{ ...thStyle, backgroundColor: '#FFF5F5' }}>Val Accuracy</th>
                  
                  <th style={{ ...thStyle }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedExperiments.map(exp => (
                  <tr 
                    key={exp.id}
                    style={{
                      transition: 'background-color 0.2s ease',
                      backgroundColor: exp.status === 'invalid' ? '#FFF5F5' : 'white',
                      '&:hover': {
                        backgroundColor: exp.status === 'invalid' ? '#FED7D7' : '#F7FAFC',
                      },
                    }}
                  >
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={selectedExps.includes(exp.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedExps([...selectedExps, exp.id]);
                          } else {
                            setSelectedExps(selectedExps.filter(id => id !== exp.id));
                          }
                        }}
                      />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: '500' }}>{exp.code}</td>
                    <td style={tdStyle}>{new Date(exp.date).toLocaleDateString()}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '500',
                        backgroundColor: exp.status === 'invalid' ? '#FED7D7' : '#F0FFF4',
                        color: exp.status === 'invalid' ? '#E53E3E' : '#38A169',
                      }}>
                        {exp.status}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', maxWidth: '120px', alignItems: 'flex-start' }}>
                        {exp.tags.slice(0, 2).map(tag => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                        {exp.tags.length > 2 && (
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            backgroundColor: '#EDF2F7',
                            color: '#4A5568',
                            whiteSpace: 'nowrap',
                          }}>
                            +{exp.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* Financial Metrics */}
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.pnl > 0 ? '#38A169' : '#E53E3E',
                      fontWeight: '600'
                    }}>
                      ${exp.financial?.pnl?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.pnlQ1 > 0 ? '#38A169' : '#E53E3E'
                    }}>
                      ${exp.financial?.pnlQ1?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.pnlQ2 > 0 ? '#38A169' : '#E53E3E'
                    }}>
                      ${exp.financial?.pnlQ2?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.pnlQ3 > 0 ? '#38A169' : '#E53E3E'
                    }}>
                      ${exp.financial?.pnlQ3?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.pnlQ4 > 0 ? '#38A169' : '#E53E3E'
                    }}>
                      ${exp.financial?.pnlQ4?.toFixed(2) || '0.00'}
                    </td>
                    <td style={tdStyle}>
                      <span style={{
                        color: exp.financial?.winRate > 0.6 ? '#38A169' : 
                               exp.financial?.winRate > 0.4 ? '#D69E2E' : '#E53E3E',
                        fontWeight: '600'
                      }}>
                        {(exp.financial?.winRate * 100).toFixed(1) || '0.0'}%
                      </span>
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.sharpeRatio > 1 ? '#38A169' : 
                             exp.financial?.sharpeRatio > 0 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {exp.financial?.sharpeRatio?.toFixed(3) || '0.000'}
                    </td>
                    <td style={{ ...tdStyle, color: '#E53E3E' }}>
                      {(exp.financial?.maxDrawdown * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.profitFactor > 1.5 ? '#38A169' : 
                             exp.financial?.profitFactor > 1 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {exp.financial?.profitFactor?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.calmarRatio > 0.5 ? '#38A169' : 
                             exp.financial?.calmarRatio > 0 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {exp.financial?.calmarRatio?.toFixed(3) || '0.000'}
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.financial?.sortinoRatio > 1 ? '#38A169' : 
                             exp.financial?.sortinoRatio > 0 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {exp.financial?.sortinoRatio?.toFixed(3) || '0.000'}
                    </td>
                    
                    {/* ML Metrics */}
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.precision > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.precision > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.precision * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.recall > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.recall > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.recall * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.f1Score > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.f1Score > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.f1Score * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.accuracy > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.accuracy > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.accuracy * 100).toFixed(1) || '0.0'}%
                    </td>
                    
                    {/* Validation Metrics */}
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.validationPrecision > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.validationPrecision > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.validationPrecision * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.validationRecall > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.validationRecall > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.validationRecall * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.validationF1 > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.validationF1 > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.validationF1 * 100).toFixed(1) || '0.0'}%
                    </td>
                    <td style={{ 
                      ...tdStyle, 
                      color: exp.mlMetrics?.validationAccuracy > 0.7 ? '#38A169' : 
                             exp.mlMetrics?.validationAccuracy > 0.5 ? '#D69E2E' : '#E53E3E'
                    }}>
                      {(exp.mlMetrics?.validationAccuracy * 100).toFixed(1) || '0.0'}%
                    </td>
                    
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Button 
                          variant="secondary" 
                          onClick={() => window.location.href = `/comparison?exp=${exp.code}`}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Compare
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => window.location.href = `/info?exp=${exp.code}`}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Details
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => openEditModal(exp)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '24px',
            position: 'relative',
            zIndex: 2,
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                background: 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#A0AEC0' : '#2D3748',
              }}
            >
              Previous
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0 16px',
            }}>
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 16px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                background: 'white',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                color: currentPage === totalPages ? '#A0AEC0' : '#2D3748',
              }}
            >
              Next
            </button>
          </div>
        )}

        {selectedExps.length > 0 && (
          <div style={{
            position: 'sticky',
            bottom: 0,
            padding: '16px',
            background: 'white',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
          }}>
            <span>{selectedExps.length} selected</span>
            <Button variant="secondary">Compare Selected</Button>
            <Button variant="danger">Delete Selected</Button>
          </div>
        )}

        <Button 
          variant="secondary" 
          onClick={exportToCSV}
          style={{ marginLeft: 'auto' }}
        >
          Export CSV
        </Button>
      </Card>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}>
              <h2 style={{ margin: 0, color: '#2D3748' }}>
                Edit Experiment: {editingExperiment?.code}
              </h2>
              <button
                onClick={closeEditModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#718096',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Basic Information */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Code
                </label>
                <Input
                  value={editForm.code}
                  onChange={(e) => handleEditFormChange('code', e.target.value)}
                  placeholder="Experiment code"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => handleEditFormChange('description', e.target.value)}
                  placeholder="Experiment description"
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '12px',
                    border: '1px solid #E2E8F0',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Author
                </label>
                <Input
                  value={editForm.author}
                  onChange={(e) => handleEditFormChange('author', e.target.value)}
                  placeholder="Author name"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Status
                </label>
                <Select
                  value={editForm.status}
                  onChange={(e) => handleEditFormChange('status', e.target.value)}
                >
                  <option value="">(no change)</option>
                  <option value="created">Created</option>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="stopped">Stopped</option>
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Validity
                </label>
                <Select
                  value={editForm.is_valid ? 'true' : 'false'}
                  onChange={(e) => handleEditFormChange('is_valid', e.target.value === 'true')}
                >
                  <option value="true">Valid</option>
                  <option value="false">Invalid</option>
                </Select>
              </div>

              {/* Tags */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Tags
                </label>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', marginBottom: '8px', alignItems: 'flex-start' }}>
                    {allTags.map(tag => (
                      <TagBadge
                        key={tag}
                        tag={tag}
                        selected={editForm.tags.includes(tag)}
                        onClick={() => handleTagToggle(tag)}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Input
                      placeholder="Add new tag"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addNewTag(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        addNewTag(input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                {editForm.tags.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#718096' }}>
                    Selected: {editForm.tags.join(', ')}
                  </div>
                )}
              </div>

              {/* Improvement Types */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Improvement Types
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'flex-start' }}>
                  {['Open', 'Close', 'Reg'].map(imp => (
                    <span
                      key={imp}
                      onClick={() => handleImprovementToggle(imp)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: editForm.improvement_types.includes(imp) ? '#3182CE' : '#EDF2F7',
                        color: editForm.improvement_types.includes(imp) ? 'white' : '#4A5568',
                        cursor: 'pointer',
                        border: '1px solid #E2E8F0',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {imp}
                    </span>
                  ))}
                </div>
                {editForm.improvement_types.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
                    Selected: {editForm.improvement_types.join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #E2E8F0',
            }}>
              <Button variant="secondary" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveExperiment}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  borderBottom: '2px solid #E2E8F0',
  color: '#4A5568',
  fontWeight: '600',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '16px',
  borderBottom: '1px solid #E2E8F0',
  color: '#2D3748',
};

export default ExperimentList;