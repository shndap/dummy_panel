import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer, PageHeader, Card, Input, Select, Button } from './shared/UIComponents';
import { getFrontendExperiments, patchFulltest, addImprovement, removeImprovement } from '../api/fulltests';

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

// Recursively collect numeric leaf keys as dotted paths
function collectNumericPaths(obj, basePath, pathSet) {
  if (!obj || typeof obj !== 'object') return;
  for (const [key, val] of Object.entries(obj)) {
    const path = basePath ? `${basePath}.${key}` : key;
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      collectNumericPaths(val, path, pathSet);
    } else if (typeof val === 'number') {
      pathSet.add(path);
    }
  }
}

function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && typeof acc === 'object' ? acc[part] : undefined), obj);
}

// Build hierarchical header rows and leaf order from dotted paths
function buildFinancialHeader(paths) {
  const root = { label: null, children: {} };
  const insert = (segments) => {
    let node = root;
    for (const seg of segments) {
      if (!node.children[seg]) node.children[seg] = { label: seg, children: {} };
      node = node.children[seg];
    }
  };
  (paths || []).forEach(p => insert(String(p).split('.').filter(Boolean)));

  const countLeaves = (node) => {
    const keys = Object.keys(node.children);
    if (keys.length === 0) return 1;
    return keys.reduce((sum, k) => sum + countLeaves(node.children[k]), 0);
  };
  const depthOf = (node) => {
    const keys = Object.keys(node.children);
    if (keys.length === 0) return 1;
    return 1 + Math.max(...keys.map(k => depthOf(node.children[k])));
  };

  const depth = Math.max(1, depthOf(root) - 0); // depth below root
  const rows = Array.from({ length: Math.max(1, depth - 0) }, () => []);
  const leafOrder = [];
  const fill = (node, level, prefix) => {
    const keys = Object.keys(node.children).sort();
    for (const k of keys) {
      const child = node.children[k];
      const colSpan = countLeaves(child);
      const isLeaf = Object.keys(child.children).length === 0;
      const rowSpan = isLeaf ? (depth - level) : 1;
      rows[level].push({ label: child.label, colSpan, rowSpan });
      if (isLeaf) {
        leafOrder.push(prefix ? `${prefix}.${child.label}` : child.label);
      } else {
        fill(child, level + 1, prefix ? `${prefix}.${child.label}` : child.label);
      }
    }
  };
  if (Object.keys(root.children).length > 0) fill(root, 0, '');

  const headerDepth = rows.length || 1;
  return { headerRows: rows, leafOrder, headerDepth };
}

function formatNumberCell(value) {
  if (value == null || (typeof value === 'number' && Number.isNaN(value))) {
    return { text: '', style: {} };
  }
  if (typeof value === 'number') {
    const text = Number(value).toFixed(5);
    const style = {
      color: value > 0 ? '#38A169' : value < 0 ? '#E53E3E' : '#2D3748',
      fontWeight: value !== 0 ? 600 : undefined,
    };
    return { text, style };
  }
  return { text: String(value), style: {} };
}

function getPlotsUrl(code) {
  if (!code) return null;
  return `https://trader-results.roshan-ai.ir/fulltest_cache/${encodeURIComponent(code)}_FullTest/plots.html`;
}

function normalizeExperiment(exp) {
  const financial = parseMaybeJSON(exp.financial, exp.financial || {});
  const mlMetrics = parseMaybeJSON(exp.mlMetrics, exp.mlMetrics || {});
  const metrics = parseMaybeJSON(exp.metrics, exp.metrics || {});
  const rawImprovements = exp.improvements;
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
    improvements: []
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

  // Dynamic financial keys from nested summary.json numeric leaves (no cap)
  const financialKeys = useMemo(() => {
    const keySet = new Set();
    for (const exp of experiments) {
      collectNumericPaths(exp.financial || {}, '', keySet);
    }
    return Array.from(keySet);
  }, [experiments]);

  // Split keys by presence of "average"
  const financialKeysMetrics = useMemo(
    () => financialKeys.filter(k => String(k).toLowerCase().includes('average')),
    [financialKeys]
  );
  const financialKeysData = useMemo(
    () => financialKeys.filter(k => !String(k).toLowerCase().includes('average')),
    [financialKeys]
  );

  // Build headers per view
  const { headerRows: headerRowsData, leafOrder: leafOrderData, headerDepth: headerDepthData } = useMemo(
    () => buildFinancialHeader(financialKeysData),
    [financialKeysData]
  );
  const { headerRows: headerRowsMetrics, leafOrder: leafOrderMetrics, headerDepth: headerDepthMetrics } = useMemo(
    () => buildFinancialHeader(financialKeysMetrics),
    [financialKeysMetrics]
  );

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
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
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
    // Keep all financial keys in CSV
    const finHeaders = [...leafOrderData, ...leafOrderMetrics];
    const headers = [
      'Code', 'Date', 'Author', 'Description', 'Status', 'Tags', 
      ...finHeaders
    ];

    const toCell = (v) => v == null ? '' : (typeof v === 'number' ? Number(v).toFixed(5) : String(v));

    const data = experiments.map(exp => {
      const fin = exp.financial || {};
      return [
        exp.code,
        exp.date,
        exp.author,
        exp.description,
        exp.status,
        Array.isArray(exp.tags) ? exp.tags.join(';') : toCell(exp.tags),
        ...finHeaders.map(k => toCell(getByPath(fin, k)))
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
    setEditForm({
      code: experiment.code,
      description: experiment.description,
      author: experiment.author,
      status: experiment.status || '',
      is_valid: experiment.isValid === undefined ? true : !!experiment.isValid,
      tags: [...experiment.tags],
      improvements: ensureArray(experiment.improvements)
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
      improvements: []
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
      improvements: prev.improvements.includes(improvement)
        ? prev.improvements.filter(imp => imp !== improvement)
        : [...prev.improvements, improvement]
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
      const after = Array.isArray(editForm.improvements) ? editForm.improvements : String(editForm.improvements || '').split(',').map(s => s.trim()).filter(Boolean);
      const toAdd = after.filter(x => !before.includes(x));
      const toRemove = before.filter(x => !after.includes(x));

      await Promise.all([
        ...toAdd.map(imp => addImprovement(entityId, imp, editingExperiment.code || editingExperiment.name)),
        ...toRemove.map(imp => removeImprovement(entityId, imp, editingExperiment.code || editingExperiment.name)),
      ]);

      setExperiments(prev => prev.map(exp => {
        if ((exp.pk ?? exp.id) !== entityId) return exp;
        const updated = { ...exp };
        updated.description = editForm.description;
        if (VALID_STATUS.includes(editForm.status)) {
          updated.status = editForm.status;
        }
        updated.is_valid = !!editForm.is_valid;
        updated.improvements = after;
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
              ML Metrics Table
            </Button>
            <Button 
              variant={viewMode === 'metrics' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('metrics')}
            >
              PNL Table
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
            count={experiments.filter(e => e.status === 'invalid' || !e.isValid).length}
            active={filterType === 'invalid'}
            onClick={() => setFilterType('invalid')}
          />
          <QuickFilter 
            label="Profitable"
            count={experiments.filter(e => typeof e.financial?.pnl === 'number' && e.financial.pnl > 0).length}
            active={false}
            onClick={() => {}}
          />
          <QuickFilter 
            label="High Win Rate"
            count={experiments.filter(e => typeof e.financial?.winRate === 'number' && e.financial.winRate > 0.6).length}
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
                  <th style={{ ...thStyle, maxWidth: '40px', borderRight: '1px solid #E2E8F0' }}>
                    <input
                      type="checkbox"
                      onChange={e => {
                        setSelectedExps(e.target.checked ? paginatedExperiments.map(exp => exp.id) : []);
                      }}
                    />
                  </th>
                  <th style={{ ...thStyle, textAlign: 'left', borderRight: '1px solid #E2E8F0' }}>Code</th>
                  <th 
                    style={{ 
                      ...thStyle, 
                      cursor: 'pointer',
                      userSelect: 'none',
                      borderRight: '1px solid #E2E8F0'
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
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }}>Author</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }}>Description</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }}>Tags</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }}>Improvements</th>
                  <th style={{ ...thStyle }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedExperiments.map(exp => {
                  const improved = ensureArray(exp.improvements).length > 0;
                  const url = improved ? getPlotsUrl(exp.code) : null;
                  return (
                    <tr 
                      key={exp.id}
                      style={{
                        transition: 'background-color 0.2s ease',
                        backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FFF5F5' : 'white',
                        '&:hover': {
                          backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FED7D7' : '#F7FAFC',
                        },
                      }}
                    >
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
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
                      <td style={{ ...tdStyle, fontWeight: '500', textAlign: 'left', borderRight: '1px solid #F1F5F9' }}>
                        {improved && url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3182CE', textDecoration: 'underline' }}>{exp.code}</a>
                        ) : (
                          exp.code
                        )}
                      </td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>{new Date(exp.date).toLocaleDateString()}</td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>{exp.author}</td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>{exp.description}</td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'flex-start', width: 'fit-content' }}>
                          {exp.tags.map(tag => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, width: 'fit-content', borderRight: '1px solid #F1F5F9' }}>
                        <ImprovementBadges 
                          improvements={exp.improvements}
                          status={exp.status}
                        />
                      </td>
                      <td style={{ ...tdStyle, width: 'fit-content' }}>
                        <div style={{ display: 'flex', gap: '8px', boxSizing: 'border-box', width: 'fit-content' }}>
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
                  );
                })}
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
                  <th style={{ ...thStyle, width: '40px', borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthData}>
                    <input
                      type="checkbox"
                      onChange={e => {
                        setSelectedExps(e.target.checked ? paginatedExperiments.map(exp => exp.id) : []);
                      }}
                    />
                  </th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthData}>Code</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthData}>Date</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthData}>Author</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthData}>Status</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthData}>Tags</th>
                  {headerRowsData.length > 0 ? headerRowsData[0].map((cell, idx) => (
                    <th key={`h1-${idx}`} style={{ ...thStyle, backgroundColor: '#F0FFF4', borderRight: '1px solid #E2E8F0' }} colSpan={cell.colSpan} rowSpan={cell.rowSpan}>{cell.label}</th>
                  )) : null}
                  <th style={{ ...thStyle }} rowSpan={headerDepthData}>Actions</th>
                </tr>
                {headerRowsData.slice(1).map((row, rIdx) => (
                  <tr key={`hr-${rIdx}`}>
                    {row.map((cell, idx) => (
                      <th key={`h${rIdx+2}-${idx}`} style={{ ...thStyle, backgroundColor: '#F0FFF4', borderRight: '1px solid #E2E8F0' }} colSpan={cell.colSpan} rowSpan={cell.rowSpan}>{cell.label}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {sortedExperiments.map(exp => {
                  const improved = ensureArray(exp.improvements).length > 0;
                  const url = improved ? getPlotsUrl(exp.code) : null;
                  return (
                    <tr 
                      key={exp.id}
                      style={{
                        transition: 'background-color 0.2s ease',
                        backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FFF5F5' : 'white',
                        '&:hover': {
                          backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FED7D7' : '#F7FAFC',
                        },
                      }}
                    >
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
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
                      <td style={{ ...tdStyle, fontWeight: '500', borderRight: '1px solid #F1F5F9' }}>
                        {improved && url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3182CE', textDecoration: 'underline' }}>{exp.code}</a>
                        ) : (
                          exp.code
                        )}
                      </td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>{new Date(exp.date).toLocaleDateString()}</td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>{exp.author}</td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FED7D7' : '#F0FFF4',
                          color: exp.status === 'invalid' || !exp.isValid ? '#E53E3E' : '#38A169',
                        }}>
                          {exp.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
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
                      {leafOrderData.map(k => {
                        const v = getByPath(exp.financial, k);
                        const { text, style } = formatNumberCell(v);
                        return (
                          <td key={k} style={{ ...tdStyle, ...style, borderRight: '1px solid #F1F5F9' }}>
                            {text}
                          </td>
                        );
                      })}
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
                  );
                })}
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
                  <th style={{ ...thStyle, width: '40px', borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>
                    <input
                      type="checkbox"
                      onChange={e => {
                        setSelectedExps(e.target.checked ? paginatedExperiments.map(exp => exp.id) : []);
                      }}
                    />
                  </th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>Code</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>Date</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>Status</th>
                  <th style={{ ...thStyle, borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>Tags</th>
                  
                  {/* Dynamic Financial Metrics from summary.json (average only) */}
                  {headerRowsMetrics.length > 0 ? headerRowsMetrics[0].map((cell, idx) => (
                    <th key={`mh1-${idx}`} style={{ ...thStyle, backgroundColor: '#F0FFF4', borderRight: '1px solid #E2E8F0' }} colSpan={cell.colSpan} rowSpan={cell.rowSpan}>{cell.label}</th>
                  )) : null}
                  
                  {/* ML Metrics */}
                  {/* <th style={{ ...thStyle, backgroundColor: '#EBF8FF', borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>Precision</th> */}
                  {/* <th style={{ ...thStyle, backgroundColor: '#EBF8FF', borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>Recall</th> */}
                  {/* <th style={{ ...thStyle, backgroundColor: '#EBF8FF', borderRight: '1px solid #E2E8F0' }} rowSpan={headerDepthMetrics}>F1 Score</th> */}
                  {/* <th style={{ ...thStyle, backgroundColor: '#EBF8FF' }} rowSpan={headerDepthMetrics}>Accuracy</th> */}
                  
                  <th style={{ ...thStyle }} rowSpan={headerDepthMetrics}>Actions</th>
                </tr>
                {headerRowsMetrics.slice(1).map((row, rIdx) => (
                  <tr key={`mhr-${rIdx}`}>
                    {row.map((cell, idx) => (
                      <th key={`mh${rIdx+2}-${idx}`} style={{ ...thStyle, backgroundColor: '#F0FFF4', borderRight: '1px solid #E2E8F0' }} colSpan={cell.colSpan} rowSpan={cell.rowSpan}>{cell.label}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {sortedExperiments.map(exp => {
                  const improved = ensureArray(exp.improvements).length > 0;
                  const url = improved ? getPlotsUrl(exp.code) : null;
                  return (
                    <tr 
                      key={exp.id}
                      style={{
                        transition: 'background-color 0.2s ease',
                        backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FFF5F5' : 'white',
                        '&:hover': {
                          backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FED7D7' : '#F7FAFC',
                        },
                      }}
                    >
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
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
                      <td style={{ ...tdStyle, fontWeight: '500', borderRight: '1px solid #F1F5F9' }}>
                        {improved && url ? (
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#3182CE', textDecoration: 'underline' }}>{exp.code}</a>
                        ) : (
                          exp.code
                        )}
                      </td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>{new Date(exp.date).toLocaleDateString()}</td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '500',
                          backgroundColor: exp.status === 'invalid' || !exp.isValid ? '#FED7D7' : '#F0FFF4',
                          color: exp.status === 'invalid' || !exp.isValid ? '#E53E3E' : '#38A169',
                        }}>
                          {exp.status}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, borderRight: '1px solid #F1F5F9' }}>
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
                      {leafOrderMetrics.map(k => {
                        const v = getByPath(exp.financial, k);
                        const { text, style } = formatNumberCell(v);
                        return (
                          <td key={k} style={{ ...tdStyle, ...style, borderRight: '1px solid #F1F5F9' }}>
                            {text}
                          </td>
                        );
                      })}
                      
                      {/* ML Metrics */}
                      {/* <td style={{ 
                        ...tdStyle, 
                        color: exp.mlMetrics?.precision > 0.7 ? '#38A169' : 
                               exp.mlMetrics?.precision > 0.5 ? '#D69E2E' : '#E53E3E',
                        borderRight: '1px solid #F1F5F9'
                      }}>
                        {(exp.mlMetrics?.precision * 100).toFixed(1) || '0.0'}%
                      </td>
                      <td style={{ 
                        ...tdStyle, 
                        color: exp.mlMetrics?.recall > 0.7 ? '#38A169' : 
                               exp.mlMetrics?.recall > 0.5 ? '#D69E2E' : '#E53E3E',
                        borderRight: '1px solid #F1F5F9'
                      }}>
                        {(exp.mlMetrics?.recall * 100).toFixed(1) || '0.0'}%
                      </td>
                      <td style={{ 
                        ...tdStyle, 
                        color: exp.mlMetrics?.f1Score > 0.7 ? '#38A169' : 
                               exp.mlMetrics?.f1Score > 0.5 ? '#D69E2E' : '#E53E3E',
                        borderRight: '1px solid #F1F5F9'
                      }}>
                        {(exp.mlMetrics?.f1Score * 100).toFixed(1) || '0.0'}%
                      </td>
                      <td style={{ 
                        ...tdStyle, 
                        color: exp.mlMetrics?.accuracy > 0.7 ? '#38A169' : 
                               exp.mlMetrics?.accuracy > 0.5 ? '#D69E2E' : '#E53E3E'
                      }}>
                        {(exp.mlMetrics?.accuracy * 100).toFixed(1) || '0.0'}%
                      </td> */}
                      
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
                  );
                })}
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
            <Button variant="secondary"
              onClick={() => {
                if (selectedExps.length < 2) {
                  alert('Select at least two experiments to compare.');
                  return;
                }
                const ids = selectedExps.slice(0, 2);
                // Map selected ids to experiment codes
                const idToExp = new Map(experiments.map(e => [(e.pk ?? e.id), e]));
                const codes = ids.map(id => idToExp.get(id)?.code).filter(Boolean);
                if (codes.length < 2) {
                  alert('Could not resolve selected experiments.');
                  return;
                }
                window.location.href = `/comparison?exp1=${encodeURIComponent(codes[0])}&exp2=${encodeURIComponent(codes[1])}`;
              }}
            >Compare Selected</Button>
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

              {/* Improvements */}
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#4A5568' }}>
                  Improvements
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
                        backgroundColor: editForm.improvements.includes(imp) ? '#3182CE' : '#EDF2F7',
                        color: editForm.improvements.includes(imp) ? 'white' : '#4A5568',
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
                {editForm.improvements.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#718096', marginTop: '8px' }}>
                    Selected: {editForm.improvements.join(', ')}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <Button variant="secondary" onClick={closeEditModal}>Cancel</Button>
                <Button variant="primary" onClick={saveExperiment}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

const thStyle = {
  textAlign: 'center',
  padding: '12px 12px',
  fontWeight: 600,
  fontSize: '12px',
  color: '#4A5568',
  borderBottom: '1px solid #E2E8F0',
  backgroundColor: '#F7FAFC',
};

const tdStyle = {
  padding: '12px 12px',
  borderBottom: '1px solid #EDF2F7',
  color: '#2D3748',
  textAlign: 'center',
  width: 'fit-content',
  alignItems: 'center',
  justifyContent: 'center',
};

export default ExperimentList;