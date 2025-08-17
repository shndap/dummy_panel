import React, { useEffect, useState } from "react";
import {
  listTestSuites,
  getTestSuitePlot,
  listTestSuiteTests,
} from "../api/fulltests";
import { useTheme } from "../contexts/ThemeContext";
import { hexToRgba } from "../utils/color";

const ProgressBar = ({ value, theme }) => {
  const pct = Math.max(0, Math.min(100, Math.round((value || 0) * 100)));
  const color = pct >= 100 ? theme.colors.success.main : theme.colors.info.main;
  return (
    <div
      style={{
        width: "100%",
        background: theme.tokens.grey[300],
        borderRadius: 6,
        height: 10,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 6,
          transition: "width 0.2s",
        }}
      />
    </div>
  );
};

const TestSuiteDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plotModal, setPlotModal] = useState({ open: false, html: "" });
  const [testsModal, setTestsModal] = useState({
    open: false,
    suite: null,
    items: [],
    page: 1,
    limit: 20,
    pagination: {},
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const { theme } = useTheme();
  const overlayBg = hexToRgba(theme.tokens.grey[1000] || "#1A202C", 0.5);
  const dangerColor = theme.colors.danger.main;

  const load = async (p = page, q = search, l = limit) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTestSuites({ page: p, limit: l, search: q });
      if (data?.success === false) {
        throw new Error(data?.error || "Failed to load");
      }
      // apiFetch returns parsed JSON directly
      setItems(data?.data || []);
      setPagination(data?.pagination || {});
      setPage(data?.pagination?.currentPage || p);
      setLimit(data?.pagination?.itemsPerPage || l);
    } catch (e) {
      setError(e?.message || "Failed to load test suites");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, "");
  }, []);

  const openPlot = async (suite) => {
    try {
      const res = await getTestSuitePlot({ path: suite.plot_path });
      const html = res?.content || "";
      setPlotModal({ open: true, html });
    } catch (e) {
      setPlotModal({
        open: true,
        html: `<pre style="white-space:pre-wrap;color:${dangerColor}">${String(
          e?.message || e
        )}</pre>`,
      });
    }
  };

  const openTests = async (suite) => {
    try {
      const data = await listTestSuiteTests({
        suite_path: suite.path,
        page: 1,
        limit: 20,
      });
      console.log(data);
      setTestsModal({
        open: true,
        suite,
        items: data?.data || [],
        page: data?.pagination?.currentPage || 1,
        limit: data?.pagination?.itemsPerPage || 20,
        pagination: data?.pagination || {},
      });
    } catch (e) {
      setTestsModal({
        open: true,
        suite,
        items: [],
        page: 1,
        limit: 20,
        pagination: {},
        error: e?.message || "Failed to load tests",
      });
    }
  };

  const loadMoreTests = async (page, limit) => {
    if (!testsModal.suite) return;
    const data = await listTestSuiteTests({
      suite_path: testsModal.suite.path,
      page,
      limit,
    });
    setTestsModal((prev) => ({
      ...prev,
      items: data?.data || [],
      page: data?.pagination?.currentPage || page,
      limit: data?.pagination?.itemsPerPage || limit,
      pagination: data?.pagination || {},
    }));
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1400px",
        margin: "0 auto",
        background: `linear-gradient(120deg, ${theme.colors.border} 30%, ${theme.colors.border} 50%)`,
        minHeight: "100vh",
        borderRadius: "16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0, color: theme.colors.text.primary }}>
          Test Suite Dashboard
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search asset/suite/signal"
            style={{
              padding: "6px 10px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              background: theme.colors.background.paper,
              color: theme.colors.text.primary,
            }}
          />
          <button
            onClick={() => load(1, search, limit)}
            style={{
              padding: "6px 10px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              background: theme.colors.background.paper,
              color: theme.colors.text.primary,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
          <button
            onClick={() => {
              setSearch("");
              load(1, "", limit);
            }}
            style={{
              padding: "6px 10px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
              background: theme.colors.background.paper,
              color: theme.colors.text.primary,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </div>
      {loading && (
        <div style={{ color: theme.colors.text.secondary }}>Loading...</div>
      )}
      {error && (
        <div style={{ color: theme.colors.danger.main }}>{String(error)}</div>
      )}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: 14,
            background: theme.colors.background.paper,
            borderRadius: 16,
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  ...thStyle(theme),
                }}
              >
                Asset
              </th>
              <th
                style={{
                  ...thStyle(theme),
                }}
              >
                Signal
              </th>
              <th
                style={{
                  ...thStyle(theme),
                  textAlign: "left",
                }}
              >
                Suite
              </th>
              <th
                style={{
                  ...thStyle(theme),
                  textAlign: "center",
                }}
              >
                Progress
              </th>
              <th
                style={{
                  ...thStyle(theme),
                  textAlign: "center",
                }}
              >
                Runs (done/started/total)
              </th>
              <th
                style={{
                  ...thStyle(theme),
                  textAlign: "center",
                }}
              >
                Tests
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((s, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    ...tdStyle(theme),
                  }}
                >
                  {s.asset}
                </td>
                <td
                  style={{
                    ...tdStyle(theme),
                  }}
                >
                  {s.signal || "-"}
                </td>
                <td
                  style={{
                    ...tdStyle(theme),
                    textAlign: "left",
                  }}
                >
                  {s.suite}
                </td>
                <td
                  style={{
                    ...tdStyle(theme),
                  }}
                >
                  <ProgressBar value={s.progress} theme={theme} />
                </td>
                <td
                  style={{
                    ...tdStyle(theme),
                    textAlign: "center",
                  }}
                >
                  {s.completed_runs}/{s.started_runs ?? s.completed_runs}/
                  {s.total_runs}
                  {Number(s.in_progress_count) > 0 && (
                    <span
                      style={{
                        marginLeft: 6,
                        color: theme.tokens.warning.dark,
                      }}
                    >
                      ({s.in_progress_count} in progress)
                    </span>
                  )}
                </td>
                <td
                  style={{
                    ...tdStyle(theme),
                    textAlign: "center",
                  }}
                >
                  <button
                    onClick={() => openTests(s)}
                    style={{
                      padding: "6px 10px",
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: 6,
                      background: theme.colors.background.paper,
                      color: theme.colors.text.primary,
                      cursor: "pointer",
                    }}
                  >
                    View Tests ({s.tests_count || 0})
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 12,
        }}
      >
        <button
          onClick={() => {
            const p = Math.max(1, page - 1);
            load(p, search, limit);
          }}
          disabled={!pagination?.hasPrevPage}
          style={{
            padding: "6px 10px",
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 6,
            background: theme.colors.background.paper,
            cursor: pagination?.hasPrevPage ? "pointer" : "not-allowed",
            color: pagination?.hasPrevPage
              ? theme.colors.text.primary
              : theme.colors.text.disabled,
          }}
        >
          Previous
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          Page {page} / {pagination?.totalPages || 1}
          <select
            value={limit}
            onChange={(e) => {
              const l = parseInt(e.target.value, 10) || 20;
              setLimit(l);
              load(1, search, l);
            }}
            style={{
              padding: "4px 8px",
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 6,
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <button
          onClick={() => {
            const p = page + 1;
            load(p, search, limit);
          }}
          disabled={!pagination?.hasNextPage}
          style={{
            padding: "6px 10px",
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 6,
            background: theme.colors.background.paper,
            cursor: pagination?.hasNextPage ? "pointer" : "not-allowed",
            color: pagination?.hasNextPage
              ? theme.colors.text.primary
              : theme.colors.text.disabled,
          }}
        >
          Next
        </button>
      </div>

      {plotModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: overlayBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              width: "95%",
              height: "90vh",
              background: theme.colors.background.paper,
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 10,
                borderBottom: `1px solid ${theme.colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ fontWeight: 600, color: theme.colors.text.primary }}
              >
                Test Suite Plot
              </div>
              <button
                onClick={() => setPlotModal({ open: false, html: "" })}
                style={{
                  padding: "6px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 6,
                  background: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <div style={{ flex: 1 }}>
              <iframe
                title="plot"
                srcDoc={plotModal.html}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>
        </div>
      )}

      {testsModal.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: overlayBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
        >
          <div
            style={{
              width: "95%",
              maxWidth: 1100,
              maxHeight: "90vh",
              background: theme.colors.background.paper,
              borderRadius: 8,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: 10,
                borderBottom: `1px solid ${theme.colors.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ fontWeight: 600, color: theme.colors.text.primary }}
              >
                Tests for {testsModal.suite?.asset} /{" "}
                {testsModal.suite?.signal || "-"} / {testsModal.suite?.suite}
              </div>
              <button
                onClick={() =>
                  setTestsModal({
                    open: false,
                    suite: null,
                    items: [],
                    page: 1,
                    limit: 20,
                    pagination: {},
                  })
                }
                style={{
                  padding: "6px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 6,
                  background: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: 12, overflow: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: 14,
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        ...thStyle(theme),
                        textAlign: "left",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        ...thStyle(theme),
                        textAlign: "center",
                      }}
                    >
                      Progress
                    </th>
                    <th
                      style={{
                        ...thStyle(theme),
                        textAlign: "center",
                      }}
                    >
                      Runs (done/started/total)
                    </th>
                    <th
                      style={{
                        ...thStyle(theme),
                        textAlign: "center",
                      }}
                    >
                      Plot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {testsModal.items.map((t, i) => (
                    <tr key={i}>
                      <td
                        style={{
                          ...tdStyle(theme),
                          textAlign: "left",
                        }}
                      >
                        {t.name}
                      </td>
                      <td
                        style={{
                          ...tdStyle(theme),
                        }}
                      >
                        <ProgressBar value={t.progress} theme={theme} />
                      </td>
                      <td
                        style={{
                          ...tdStyle(theme),
                          textAlign: "center",
                        }}
                      >
                        {t.completed_runs}/{t.started_runs}/{t.total_runs}
                      </td>
                      <td
                        style={{
                          ...tdStyle(theme),
                          textAlign: "center",
                        }}
                      >
                        {t.plot_available ? (
                          <button
                            onClick={() => {
                              if (t.plot_path) {
                                const plotUrl = t.plot_path.replace(
                                  "/mnt/storage/trader",
                                  "https://trader-results.roshan-ai.ir"
                                );
                                window.open(
                                  plotUrl,
                                  "_blank",
                                  "noopener,noreferrer"
                                );
                              }
                            }}
                            style={{
                              padding: "6px 10px",
                              border: `1px solid ${theme.colors.info.main}`,
                              borderRadius: 6,
                              background: theme.colors.info.main,
                              color: theme.colors.text.primary,
                              cursor: "pointer",
                            }}
                          >
                            View Plot
                          </button>
                        ) : (
                          <span style={{ color: theme.colors.text.disabled }}>
                            Not ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 10,
                borderTop: `1px solid ${theme.colors.border}`,
              }}
            >
              <button
                onClick={() =>
                  loadMoreTests(
                    Math.max(1, testsModal.page - 1),
                    testsModal.limit
                  )
                }
                disabled={!testsModal.pagination?.hasPrevPage}
                style={{
                  padding: "6px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 6,
                  background: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  cursor: "pointer",
                  ...(testsModal.pagination?.hasPrevPage === false
                    ? { cursor: "not-allowed" }
                    : {}),
                }}
              >
                Previous
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                Page {testsModal.page} /{" "}
                {testsModal.pagination?.totalPages || 1}
                <select
                  value={testsModal.limit}
                  onChange={(e) => {
                    const l = parseInt(e.target.value, 10) || 20;
                    loadMoreTests(1, l);
                  }}
                  style={{
                    padding: "4px 8px",
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: 6,
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <button
                onClick={() =>
                  loadMoreTests(testsModal.page + 1, testsModal.limit)
                }
                disabled={!testsModal.pagination?.hasNextPage}
                style={{
                  padding: "6px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 6,
                  background: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                  cursor: "pointer",
                  ...(testsModal.pagination?.hasNextPage === false
                    ? { cursor: "not-allowed" }
                    : {}),
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Shared table styles consistent with other tabs
const thStyle = (theme) => ({
  padding: "12px",
  textAlign: "left",
  borderBottom: `2px solid ${theme.tokens.ui.divider}`,
  color: theme.colors.text.secondary,
  fontWeight: "600",
});

const tdStyle = (theme) => ({
  padding: "16px 12px",
  borderBottom: `1px solid ${theme.tokens.ui.divider}`,
  color: theme.colors.text.primary,
});

export default TestSuiteDashboard;
