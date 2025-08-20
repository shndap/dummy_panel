import React, { useState, useEffect, useMemo, useRef } from "react";
import { PageContainer, PageHeader, Card } from "./shared/UIComponents";
import { getFrontendExperiments, getComparisonFiles } from "../api/fulltests";
import { useTheme } from "../contexts/ThemeContext";
import { getChartColors } from "../utils/theme";

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

const ImprovementBadges = ({ improvements }) => {
  const { theme } = useTheme();

  // Use the same color logic as in ExperimentList.js
  const chartColors = getChartColors(theme);

  const improvementList = Array.isArray(improvements)
    ? improvements
    : typeof improvements === "string"
    ? [improvements]
    : [];

  if (improvementList.length === 0) {
    return (
      <span
        style={{
          padding: "4px 8px",
          borderRadius: "12px",
          fontSize: "12px",
          fontWeight: "500",
          color: theme.colors.text.secondary,
        }}
      >
        No Improvement
      </span>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        gap: "4px",
        flexWrap: "wrap",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {improvementList.map((imp, index) => (
        <span
          key={index}
          style={{
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            backgroundColor:
              imp === "Open"
                ? chartColors.open.bg
                : imp === "Close"
                ? chartColors.close.bg
                : chartColors.reg.bg,
            color:
              imp === "Open"
                ? chartColors.open.border
                : imp === "Close"
                ? chartColors.close.border
                : chartColors.reg.border,
          }}
        >
          {imp}
        </span>
      ))}
    </div>
  );
};

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
          background: theme.colors.background.paper,
          padding: "8px 12px",
          fontWeight: 600,
          color: theme.colors.text.primary,
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
                color: theme.colors.text.primary,
              }}
            >
              Metric
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px",
                borderBottom: `1px solid ${theme.colors.border}`,
                color: theme.colors.text.primary,
              }}
            >
              Exp 1
            </th>
            <th
              style={{
                textAlign: "right",
                padding: "8px",
                borderBottom: `1px solid ${theme.colors.border}`,
                color: theme.colors.text.primary,
              }}
            >
              Exp 2
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "8px",
                borderBottom: `1px solid ${theme.colors.border}`,
                color: theme.colors.text.primary,
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

// --- Autocomplete Experiment Search Input ---
const ExperimentSearchInput = ({
  label,
  value,
  onChange,
  onSelect,
  excludeCodes = [],
  placeholder = "Search experiment...",
  style = {},
}) => {
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  // Keep inputValue in sync with value prop
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  // Fetch suggestions as user types
  useEffect(() => {
    let active = true;
    if (!inputValue) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoading(true);
    setError(null);
    getFrontendExperiments({
      search: inputValue,
      limit: 10,
      page: 1,
    })
      .then(({ results }) => {
        if (!active) return;
        let filtered = (results || []).filter(
          (r) => !excludeCodes.includes(r.code)
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.data || e.message || "Failed to load suggestions");
        setSuggestions([]);
        setShowSuggestions(false);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [inputValue, excludeCodes]);

  // Handle keyboard navigation
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  useEffect(() => {
    setHighlightedIdx(-1);
  }, [suggestions]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange && onChange(e.target.value);
  };

  const handleSelect = (exp) => {
    setInputValue(exp.code);
    setShowSuggestions(false);
    setSuggestions([]);
    setHighlightedIdx(-1);
    onSelect && onSelect(exp.code);
  };

  const handleBlur = () => {
    setTimeout(() => setShowSuggestions(false), 120); // allow click
  };

  const handleFocus = () => {
    if (suggestions.length > 0) setShowSuggestions(true);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((idx) =>
        idx < suggestions.length - 1 ? idx + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((idx) =>
        idx > 0 ? idx - 1 : suggestions.length - 1
      );
    } else if (e.key === "Enter") {
      if (highlightedIdx >= 0 && highlightedIdx < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIdx]);
      }
    }
  };

  // --- THEME-BASED SEARCH BAR STYLES ---
  // Use theme background colors, not gray, for input background
  const inputBg =
    theme.colors.background?.paper ||
    theme.colors.background?.main ||
    theme.colors.background?.default ||
    "#fff";

  const inputBorder =
    theme.colors.ui?.border ||
    theme.colors.border ||
    "#E2E8F0";

  const inputFocusBorder =
    theme.colors.ui?.focus ||
    theme.colors.primary?.main ||
    "#3182CE";

  const inputText =
    theme.colors.text?.primary ||
    "#2D3748";

  const inputPlaceholder =
    theme.colors.text?.secondary ||
    "#718096";

  const dropdownBg =
    theme.colors.background?.paper ||
    "#fff";

  const dropdownBorder =
    theme.colors.ui?.border ||
    theme.colors.border ||
    "#E2E8F0";

  const dropdownShadow =
    theme.shadows?.md ||
    "0 4px 16px rgba(0,0,0,0.13)";

  const dropdownZ = 1002; // high z-index for visibility

  // Focus state for border color
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ boxSizing: "border-box", position: "relative", ...style }}>
      <label
        style={{
          color: theme.colors.text.primary,
          marginBottom: "8px",
          display: "block",
        }}
      >
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={e => {
          setIsFocused(true);
          handleFocus(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          handleBlur(e);
        }}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: `1.5px solid ${isFocused ? inputFocusBorder : inputBorder}`,
          borderRadius: "6px",
          fontSize: "15px",
          background: inputBg,
          color: inputText,
          outline: "none",
          transition: "border-color 0.15s",
          boxShadow: isFocused ? "0 0 0 2px " + theme.colors.primary.light : "none",
          fontFamily: "inherit",
          fontWeight: 500,
          letterSpacing: "0.01em",
          "::placeholder": {
            color: inputPlaceholder,
            opacity: 1,
          },
          boxSizing: "border-box",
        }}
        autoComplete="off"
      />
      {loading && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: theme.colors.text.secondary,
            fontSize: "13px",
            pointerEvents: "none",
            background: inputBg,
            padding: "0 4px",
            borderRadius: "3px",
          }}
        >
          Loading...
        </div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            background: dropdownBg,
            border: `1.5px solid ${dropdownBorder}`,
            borderTop: "none",
            borderRadius: "0 0 6px 6px",
            boxShadow: dropdownShadow,
            maxHeight: "260px",
            overflowY: "auto",
            marginTop: "-1.5px",
            minWidth: "100%",
            transition: "box-shadow 0.15s",
          }}
        >
          {suggestions.map((exp, idx) => (
            <div
              key={exp.code}
              onMouseDown={() => handleSelect(exp)}
              onMouseEnter={() => setHighlightedIdx(idx)}
              style={{
                padding: "10px 14px",
                background:
                  idx === highlightedIdx
                    ? theme.tokens.primary[50] || "#e3f2fd"
                    : theme.colors.background.paper,
                color:
                  idx === highlightedIdx
                    ? theme.colors.primary.main
                    : theme.colors.text.primary,
                cursor: "pointer",
                fontWeight: idx === highlightedIdx ? 600 : 400,
                borderBottom:
                  idx === suggestions.length - 1
                    ? "none"
                    : `1px solid ${theme.tokens.ui.divider}`,
                display: "flex",
                alignItems: "center",
                transition: "background 0.12s, color 0.12s",
              }}
            >
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "14px",
                  color:
                    idx === highlightedIdx
                      ? theme.colors.primary.main
                      : theme.colors.text.primary,
                }}
              >
                {exp.code}
              </span>
              {exp.name && (
                <span
                  style={{
                    marginLeft: 10,
                    color:
                      idx === highlightedIdx
                        ? theme.colors.primary.dark
                        : theme.colors.text.secondary,
                    fontSize: "13px",
                  }}
                >
                  {exp.name}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {error && (
        <div style={{ color: theme.colors.danger.main, fontSize: "13px", marginTop: 4 }}>
          {String(error)}
        </div>
      )}
    </div>
  );
};

const ExperimentComparison = () => {
  const { theme } = useTheme();
  const [selectedExp1, setSelectedExp1] = useState("");
  const [selectedExp2, setSelectedExp2] = useState("");
  const [exp1, setExp1] = useState(null);
  const [exp2, setExp2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState(null);

  // Load experiment by code
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
    // eslint-disable-next-line
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
                background: theme.colors.background.paper,
                padding: "8px",
                border: `1px solid ${theme.colors.border}`,
                borderRadius: "4px",
                color: theme.colors.text.primary,
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
                  color: theme.colors.text.primary,
                }}
              >
                Path
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px",
                  borderBottom: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
                }}
              >
                Exp 1
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: "8px",
                  borderBottom: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text.primary,
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
            <ExperimentSearchInput
              label="Experiment 1"
              value={selectedExp1}
              onChange={(val) => {
                setSelectedExp1(val);
                if (!val) setExp1(null);
              }}
              onSelect={(code) => {
                setSelectedExp1(code);
                loadByCode(code, setExp1);
              }}
              excludeCodes={selectedExp2 ? [selectedExp2] : []}
              placeholder="Search experiment code..."
            />
          </div>
          <div style={{ flex: 1 }}>
            <ExperimentSearchInput
              label="Experiment 2"
              value={selectedExp2}
              onChange={(val) => {
                setSelectedExp2(val);
                if (!val) setExp2(null);
              }}
              onSelect={(code) => {
                setSelectedExp2(code);
                loadByCode(code, setExp2);
              }}
              excludeCodes={selectedExp1 ? [selectedExp1] : []}
              placeholder="Search experiment code..."
            />
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
