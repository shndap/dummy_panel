import React, { useEffect, useState } from 'react';
import { listTestSuites, getTestSuitePlot, listTestSuiteTests } from '../api/fulltests';

const ProgressBar = ({ value }) => {
  const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
  const color = pct >= 100 ? '#38A169' : '#3182CE';
  return (
    <div style={{ width: '100%', background: '#EDF2F7', borderRadius: 6, height: 10 }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.2s' }} />
    </div>
  );
};

const TestSuiteDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plotModal, setPlotModal] = useState({ open: false, html: '' });
  const [testsModal, setTestsModal] = useState({ open: false, suite: null, items: [], page: 1, limit: 20, pagination: {} });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false });

  const load = async (p = page, q = search, l = limit) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTestSuites({ page: p, limit: l, search: q });
      if (data?.success === false) {
        throw new Error(data?.error || 'Failed to load');
      }
      // apiFetch returns parsed JSON directly
      setItems(data?.data || []);
      setPagination(data?.pagination || {});
      setPage(data?.pagination?.currentPage || p);
      setLimit(data?.pagination?.itemsPerPage || l);
    } catch (e) {
      setError(e?.message || 'Failed to load test suites');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, '');
  }, []);

  const openPlot = async (suite) => {
    try {
      const res = await getTestSuitePlot({ path: suite.plot_path });
      const html = res?.content || '';
      setPlotModal({ open: true, html });
    } catch (e) {
      setPlotModal({ open: true, html: `<pre style=\"white-space:pre-wrap;color:#E53E3E\">${String(e?.message || e)}</pre>` });
    }
  };

  const openTests = async (suite) => {
    try {
      const data = await listTestSuiteTests({ suite_path: suite.path, page: 1, limit: 20 });
      console.log(data);
      setTestsModal({ open: true, suite, items: data?.data || [], page: data?.pagination?.currentPage || 1, limit: data?.pagination?.itemsPerPage || 20, pagination: data?.pagination || {} });
    } catch (e) {
      setTestsModal({ open: true, suite, items: [], page: 1, limit: 20, pagination: {}, error: e?.message || 'Failed to load tests' });
    }
  };

  const loadMoreTests = async (page, limit) => {
    if (!testsModal.suite) return;
    const data = await listTestSuiteTests({ suite_path: testsModal.suite.path, page, limit });
    setTestsModal((prev) => ({ ...prev, items: data?.data || [], page: data?.pagination?.currentPage || page, limit: data?.pagination?.itemsPerPage || limit, pagination: data?.pagination || {} }));
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, color: '#2D3748' }}>Test Suite Dashboard</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search asset/suite/signal" style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6 }} />
          <button onClick={() => load(1, search, limit)} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white' }}>Apply</button>
          <button onClick={() => { setSearch(''); load(1, '', limit); }} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white' }}>Reset</button>
        </div>
      </div>
      {loading && <div style={{ color: '#718096' }}>Loading...</div>}
      {error && <div style={{ color: '#E53E3E' }}>{String(error)}</div>}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 12, borderBottom: '2px solid #EDF2F7' }}>Asset</th>
              <th style={{ textAlign: 'left', padding: 12, borderBottom: '2px solid #EDF2F7' }}>Signal</th>
              <th style={{ textAlign: 'left', padding: 12, borderBottom: '2px solid #EDF2F7' }}>Suite</th>
              <th style={{ textAlign: 'center', padding: 12, borderBottom: '2px solid #EDF2F7' }}>Progress</th>
              <th style={{ textAlign: 'center', padding: 12, borderBottom: '2px solid #EDF2F7' }}>Runs (done/started/total)</th>
              <th style={{ textAlign: 'center', padding: 12, borderBottom: '2px solid #EDF2F7' }}>Tests</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, idx) => (
              <tr key={idx}>
                <td style={{ padding: '12px', borderBottom: '1px solid #EDF2F7' }}>{s.asset}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #EDF2F7' }}>{s.signal || '-'}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #EDF2F7' }}>{s.suite}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #EDF2F7' }}>
                  <ProgressBar value={s.progress} />
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #EDF2F7', textAlign: 'center' }}>
                  {s.completed_runs}/{(s.started_runs ?? s.completed_runs)}/{s.total_runs}
                  {Number(s.in_progress_count) > 0 && (
                    <span style={{ marginLeft: 6, color: '#D69E2E' }}>({s.in_progress_count} in progress)</span>
                  )}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid #EDF2F7', textAlign: 'center' }}>
                  <button onClick={() => openTests(s)} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white' }}>View Tests ({s.tests_count || 0})</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        <button onClick={() => { const p = Math.max(1, (page - 1)); load(p, search, limit); }} disabled={!pagination?.hasPrevPage} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white', cursor: pagination?.hasPrevPage ? 'pointer' : 'not-allowed', color: pagination?.hasPrevPage ? '#2D3748' : '#A0AEC0' }}>Previous</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Page {page} / {pagination?.totalPages || 1}
          <select value={limit} onChange={(e) => { const l = parseInt(e.target.value, 10) || 20; setLimit(l); load(1, search, l); }} style={{ padding: '4px 8px', border: '1px solid #CBD5E0', borderRadius: 6 }}>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <button onClick={() => { const p = page + 1; load(p, search, limit); }} disabled={!pagination?.hasNextPage} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white', cursor: pagination?.hasNextPage ? 'pointer' : 'not-allowed', color: pagination?.hasNextPage ? '#2D3748' : '#A0AEC0' }}>Next</button>
      </div>

      {plotModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ width: '95%', height: '90vh', background: 'white', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Test Suite Plot</div>
              <button onClick={() => setPlotModal({ open: false, html: '' })} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white' }}>Close</button>
            </div>
            <div style={{ flex: 1 }}>
              <iframe title="plot" srcDoc={plotModal.html} style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
          </div>
        </div>
      )}

      {testsModal.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ width: '95%', maxWidth: 1100, maxHeight: '90vh', background: 'white', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Tests for {testsModal.suite?.asset} / {testsModal.suite?.signal || '-'} / {testsModal.suite?.suite}</div>
              <button onClick={() => setTestsModal({ open: false, suite: null, items: [], page: 1, limit: 20, pagination: {} })} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white' }}>Close</button>
            </div>
            <div style={{ padding: 12, overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '2px solid #EDF2F7' }}>Name</th>
                    <th style={{ textAlign: 'center', padding: 8, borderBottom: '2px solid #EDF2F7' }}>Progress</th>
                    <th style={{ textAlign: 'center', padding: 8, borderBottom: '2px solid #EDF2F7' }}>Runs (done/started/total)</th>
                    <th style={{ textAlign: 'center', padding: 8, borderBottom: '2px solid #EDF2F7' }}>Plot</th>
                  </tr>
                </thead>
                <tbody>
                  {testsModal.items.map((t, i) => (
                    <tr key={i}>
                      <td style={{ padding: 8, borderBottom: '1px solid #EDF2F7' }}>{t.name}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #EDF2F7' }}><ProgressBar value={t.progress} /></td>
                      <td style={{ padding: 8, borderBottom: '1px solid #EDF2F7', textAlign: 'center' }}>{t.completed_runs}/{t.started_runs}/{t.total_runs}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #EDF2F7', textAlign: 'center' }}>
                        {t.plot_available ? (
                          <button
                            onClick={() => {
                              if (t.plot_path) {
                                const plotUrl = t.plot_path.replace('/mnt/storage/trader', 'https://trader-results.roshan-ai.ir');
                                window.open(plotUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            style={{ padding: '6px 10px', border: '1px solid #3182CE', borderRadius: 6, background: '#3182CE', color: 'white' }}
                          >
                            View Plot
                          </button>
                        ) : (
                          <span style={{ color: '#A0AEC0' }}>Not ready</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, borderTop: '1px solid #E2E8F0' }}>
              <button onClick={() => loadMoreTests(Math.max(1, testsModal.page - 1), testsModal.limit)} disabled={!testsModal.pagination?.hasPrevPage} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white' }}>Previous</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Page {testsModal.page} / {testsModal.pagination?.totalPages || 1}
                <select value={testsModal.limit} onChange={(e) => { const l = parseInt(e.target.value, 10) || 20; loadMoreTests(1, l); }} style={{ padding: '4px 8px', border: '1px solid #CBD5E0', borderRadius: 6 }}>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button onClick={() => loadMoreTests(testsModal.page + 1, testsModal.limit)} disabled={!testsModal.pagination?.hasNextPage} style={{ padding: '6px 10px', border: '1px solid #CBD5E0', borderRadius: 6, background: 'white' }}>Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSuiteDashboard;

