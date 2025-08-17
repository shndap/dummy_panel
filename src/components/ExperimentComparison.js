import React, { useState, useEffect, useMemo } from "react";
import { PageContainer, PageHeader, Card, Select } from "./shared/UIComponents";
import { getFrontendExperiments, getComparisonFiles } from "../api/fulltests";
import { useTheme } from "../contexts/ThemeContext";

function parseMaybeJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeExperiment(exp) {
  return {
    ...exp,
    metrics: parseMaybeJSON(exp.metrics, exp.metrics || {}),
    improvements:
      Array.isArray(exp.improvements) || typeof exp.improvements === "string"
        ? exp.improvements
        : [],
  };
}

const ImprovementBadges = ({ improvements }) => (
  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
    {["Open", "Close", "Reg"].map((imp) => (
      <span
        key={imp}
        title={improvements.includes(imp) ? `${imp} present` : `${imp} absent`}
        style={{
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "500",
          border: "1px solid #E2E8F0",
          backgroundColor: improvements.includes(imp)
            ? imp === "Open"
              ? "#F0FFF4"
              : imp === "Close"
              ? "#FFF5F5"
              : "#EBF8FF"
            : "#F7FAFC",
          color: improvements.includes(imp)
            ? imp === "Open"
              ? "#38A169"
              : imp === "Close"
              ? "#E53E3E"
              : "#3182CE"
            : "#A0AEC0",
        }}
      >
        {imp}
      </span>
    ))}
  </div>
);

const Box = ({ children, label }) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: theme.tokens.grey[200],
          padding: "8px 12px",
          fontWeight: 600,
          color: theme.tokens.grey[800],
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
};

// Named simple comparison table (not default export)
export const MetricComparisonTable = ({ label, diff, emphasis }) => {
  const { theme } = useTheme();
  const headerBg = theme.tokens.grey[200];
  const headerColor = theme.tokens.grey[800];
  const neutral = theme.colors.text.secondary;

  const renderRow = (name, v1, v2, better) => {
    const color =
      better === 0
        ? neutral
        : better > 0
        ? theme.colors.success.main
        : theme.colors.danger.main;
    return (
      <tr>
        <td
          style={{
            padding: "8px",
            borderBottom: `1px solid ${theme.tokens.ui.divider}`,
            color: theme.colors.text.primary,
          }}
        >
          {name}
        </td>
        <td
          style={{
            padding: "8px",
            borderBottom: `1px solid ${theme.tokens.ui.divider}`,
            color: theme.colors.text.primary,
            textAlign: "right",
          }}
        >
          {v1}
        </td>
        <td
          style={{
            padding: "8px",
            borderBottom: `1px solid ${theme.tokens.ui.divider}`,
            color: theme.colors.text.primary,
            textAlign: "right",
          }}
        >
          {v2}
        </td>
        <td
          style={{
            padding: "8px",
            borderBottom: `1px solid ${theme.tokens.ui.divider}`,
            color,
          }}
        >
          {better}
        </td>
      </tr>
    );
  };

  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: headerBg,
          padding: "8px 12px",
          fontWeight: 600,
          color: headerColor,
        }}
      >
        {label}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "8px",
                borderBottom: `1px solid ${theme.colors.border}`,
                color: theme.tokens.grey[800],
              }}
            >
              Metric
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px",
                borderBottom: `1px solid ${theme.colors.border}`,
                color: theme.tokens.grey[800],
              }}
            >
              Exp 1
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px",
                borderBottom: `1px solid ${theme.colors.border}`,
                color: theme.tokens.grey[800],
              }}
            >
              Exp 2
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "8px",
                borderBottom: `1px solid ${theme.colors.border}`,
                color: theme.tokens.grey[800],
              }}
            >
              Δ
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(diff) &&
            diff.map((d, idx) => renderRow(d.name, d.v1, d.v2, d.better))}
        </tbody>
      </table>
    </div>
  );
};

const ExperimentComparison = () => {
  const { theme } = useTheme();
  const [selectedExp1, setSelectedExp1] = useState("");
  const [selectedExp2, setSelectedExp2] = useState("");
  const [options, setOptions] = useState([]); // array of { code, id, pk }
  const [exp1, setExp1] = useState(null);
  const [exp2, setExp2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      setError(null);
      try {
        const { results } = await getFrontendExperiments({
          limit: 100,
          page: 1,
        });
        if (!mounted) return;
        const list = (results || []).map((r) => ({
          code: r.code,
          id: r.id,
          pk: r.pk,
        }));
        setOptions(list);
      } catch (e) {
        if (mounted)
          setError(e.data || e.message || "Failed to load experiments");
      }
    }
    loadOptions();
    return () => {
      mounted = false;
    };
  }, []);

  async function loadByCode(code, setter) {
    if (!code) {
      setter(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { results } = await getFrontendExperiments({
        search: code,
        limit: 1,
        page: 1,
      });
      const match = Array.isArray(results)
        ? results.find((r) => r.code === code) || results[0]
        : null;
      setter(match ? normalizeExperiment(match) : null);
    } catch (e) {
      setError(e.data || e.message || "Failed to load experiment");
      setter(null);
    } finally {
      setLoading(false);
    }
  }

  // Load from query params on mount: /comparison?exp1=CODE1&exp2=CODE2
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e1 = params.get("exp1");
    const e2 = params.get("exp2");
    if (e1) {
      setSelectedExp1(e1);
      loadByCode(e1, setExp1);
    }
    if (e2) {
      setSelectedExp2(e2);
      loadByCode(e2, setExp2);
    }
  }, []);

  // When both codes are selected, fetch params/summary for file comparison
  useEffect(() => {
    async function loadFiles() {
      if (!selectedExp1 || !selectedExp2) {
        setFiles(null);
        return;
      }
      try {
        const res = await getComparisonFiles(selectedExp1, selectedExp2);
        setFiles(res);
      } catch (e) {
        // Non-fatal
        setFiles(null);
      }
    }
    loadFiles();
  }, [selectedExp1, selectedExp2]);

  // Diff helpers
  const MAX_DIFF_ITEMS = 300;
  const isArray = (x) => Array.isArray(x);
  const isPlainObject = (x) => x && typeof x === "object" && !Array.isArray(x);
  const typeLabel = (v) => {
    if (v === undefined) return "missing";
    if (v === null) return "null";
    if (isArray(v)) return `array[${v.length}]`;
    if (isPlainObject(v)) return `object{${Object.keys(v).length}}`;
    return typeof v;
  };
  const renderValueCell = (v, emphasis) => {
    const baseStyle = {
      padding: "8px",
      borderBottom: `1px solid ${theme.tokens.ui.divider}`,
      color:
        emphasis === "added"
          ? theme.colors.success.main
          : emphasis === "removed"
          ? theme.colors.danger.main
          : theme.colors.text.primary,
      fontFamily: "inherit",
      verticalAlign: "top",
    };
    if (v === undefined) {
      return (
        <td style={baseStyle}>
          <span
            style={{ color: theme.colors.text.disabled, fontStyle: "italic" }}
          >
            missing
          </span>
        </td>
      );
    }
    if (isPlainObject(v) || isArray(v)) {
      const summary = typeLabel(v);
      return (
        <td style={baseStyle}>
          <details>
            <summary style={{ cursor: "pointer" }}>{summary}</summary>
            <pre
              style={{
                margin: "6px 0 0",
                background: theme.tokens.grey[200],
                padding: "8px",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "4px",
              }}
            >
              {JSON.stringify(v, null, 2)}
            </pre>
          </details>
        </td>
      );
    }
    // Primitive values
    const display = typeof v === "number" ? v.toFixed(6) : String(v);
    return <td style={baseStyle}>{display}</td>;
  };
  const diffObjects = (a, b, base = "") => {
    const changes = [];
    const keys = new Set([
      ...(a ? Object.keys(a) : []),
      ...(b ? Object.keys(b) : []),
    ]);
    for (const k of keys) {
      const path = base ? `${base}.${k}` : k;
      const va = a ? a[k] : undefined;
      const vb = b ? b[k] : undefined;
      if (va === undefined && vb !== undefined) {
        changes.push({ type: "added", path, a: "", b: vb });
      } else if (vb === undefined && va !== undefined) {
        changes.push({ type: "removed", path, a: va, b: "" });
      } else if (isPlainObject(va) && isPlainObject(vb)) {
        changes.push(...diffObjects(va, vb, path));
      } else if (JSON.stringify(va) !== JSON.stringify(vb)) {
        changes.push({ type: "changed", path, a: va, b: vb });
      }
      if (changes.length >= MAX_DIFF_ITEMS) break;
    }
    return changes;
  };

  const paramsDiff = useMemo(() => {
    if (!files || !files.success) return [];
    return diffObjects(files.exp1?.params || {}, files.exp2?.params || {});
  }, [files]);
  const summaryDiff = useMemo(() => {
    if (!files || !files.success) return [];
    return diffObjects(files.exp1?.summary || {}, files.exp2?.summary || {});
  }, [files]);

  const DiffTable = ({ title, diff }) => (
    <div
      style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          background: theme.tokens.grey[200],
          padding: "8px 12px",
          fontWeight: 600,
          color: theme.tokens.grey[800],
        }}
      >
        {title} ({diff.length})
      </div>
      {diff.length === 0 ? (
        <div style={{ padding: "12px", color: theme.colors.text.secondary }}>
          No differences
        </div>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px",
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                Path
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px",
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                Exp 1
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px",
                  borderBottom: `1px solid ${theme.colors.border}`,
                }}
              >
                Exp 2
              </th>
            </tr>
          </thead>
          <tbody>
            {diff.slice(0, MAX_DIFF_ITEMS).map((d, idx) => (
              <tr key={idx}>
                <td
                  style={{
                    padding: "8px",
                    borderBottom: `1px solid ${theme.tokens.ui.divider}`,
                    color: theme.colors.text.primary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.path}
                </td>
                {renderValueCell(
                  d.a,
                  d.type === "removed" ? "removed" : undefined
                )}
                {renderValueCell(d.b, d.type === "added" ? "added" : undefined)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <PageContainer>
      <PageHeader title="Experiment Comparison" />
      <Card>
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <div style={{ flex: 1 }}>
            <label>Experiment 1</label>
            <Select
              value={selectedExp1}
              onChange={(e) => {
                setSelectedExp1(e.target.value);
                loadByCode(e.target.value, setExp1);
              }}
            >
              <option value="">Select...</option>
              {options.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </Select>
          </div>
          <div style={{ flex: 1 }}>
            <label>Experiment 2</label>
            <Select
              value={selectedExp2}
              onChange={(e) => {
                setSelectedExp2(e.target.value);
                loadByCode(e.target.value, setExp2);
              }}
            >
              <option value="">Select...</option>
              {options.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loading && <div>Loading...</div>}
        {error && (
          <div style={{ color: theme.colors.danger.main }}>{String(error)}</div>
        )}

        {exp1 || exp2 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3
                style={{ margin: "0 0 8px", color: theme.colors.text.primary }}
              >
                {exp1?.code || "Experiment 1"}
              </h3>
              <ImprovementBadges
                improvements={
                  Array.isArray(exp1?.improvements) ? exp1.improvements : []
                }
              />
            </div>
            <div>
              <h3
                style={{ margin: "0 0 8px", color: theme.colors.text.primary }}
              >
                {exp2?.code || "Experiment 2"}
              </h3>
              <ImprovementBadges
                improvements={
                  Array.isArray(exp2?.improvements) ? exp2.improvements : []
                }
              />
            </div>
          </div>
        ) : null}

        {exp1 && exp2 ? (
          <div style={{ display: "grid", gap: "16px" }}>
            {files && files.success && (
              <div style={{ display: "grid", gap: "16px" }}>
                <DiffTable title={`Params differences`} diff={paramsDiff} />
                <DiffTable title={`Summary differences`} diff={summaryDiff} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: "24px", color: theme.colors.text.secondary }}>
            Select two experiments to compare their metrics.
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default ExperimentComparison;
