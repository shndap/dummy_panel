import React, { useState, useEffect } from "react";
import {
  listFulltests,
  startFulltest,
  deleteFulltest,
  getFulltestLogs,
  getFrontendExperiments,
  stopFulltest,
  getKubeLogs,
  createFulltestEntry,
  getJobStatus,
} from "../api/fulltests";
import { useTheme } from "../contexts/ThemeContext";

const getColorsByStatus = (theme) => ({
  created: theme.tokens.grey[500],
  running: theme.colors.info.main,
  completed: theme.colors.success.main,
  failed: theme.colors.error.main,
  stopped: theme.colors.warning.main,
});

const IconButton = ({ onClick, title, children, variant = "default", disabled = false }) => {
  const [hovered, setHovered] = useState(false);
  const { theme } = useTheme();

  return (
    <button
      onClick={disabled ? undefined : onClick}
      title={title}
      disabled={disabled}
      style={{
        border: "none",
        background: hovered
          ? variant === "danger"
            ? theme.tokens.ui.warning
            : theme.tokens.grey[300]
          : "transparent",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "6px",
        borderRadius: "6px",
        color:
          variant === "danger"
            ? theme.colors.danger.main
            : theme.colors.text.primary,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
};

const Spinner = ({ size = 18, color = "currentColor" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 50 50"
    style={{ display: "block" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="25"
      cy="25"
      r="20"
      fill="none"
      stroke={color}
      strokeWidth="5"
      strokeLinecap="round"
      strokeDasharray="31.415, 31.415"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 25 25"
        to="360 25 25"
        dur="0.9s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

const PlayIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
  </svg>
);

const PlayHighPriorityIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red play triangle for urgency */}
    <path d="M8 5v14l11-7L8 5z" fill="#2B6CB0" />
    {/* Exclamation mark badge in top-left */}
    <circle cx="6" cy="6" r="5" fill="#E53E3E" />
    <text
      x="6"
      y="9"
      textAnchor="middle"
      fontSize="8"
      fontWeight="bold"
      fill="#fff"
      fontFamily="Arial, sans-serif"
      style={{ pointerEvents: "none", userSelect: "none" }}
    >
      !
    </text>
  </svg>
);

const TrashIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 6h18" stroke="#E53E3E" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"
      stroke="#E53E3E"
      strokeWidth="2"
    />
    <path
      d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"
      stroke="#E53E3E"
      strokeWidth="2"
    />
    <path
      d="M10 11v6M14 11v6"
      stroke="#E53E3E"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ScrollIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
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
);

const PauseIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="6" y="5" width="4" height="14" rx="1" fill="#D69E2E" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="#D69E2E" />
  </svg>
);

const LogsIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 6h16M4 12h16M4 18h10"
      stroke="pink"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ExternalLinkIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M14 3h7v7"
      stroke="#3182CE"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M10 14L21 3"
      stroke="#3182CE"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M21 14v6a1 1 0 0 1-1 1h-14a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1h6"
      stroke="#3182CE"
      strokeWidth="2"
    />
  </svg>
);

function getPlotsUrl(code) {
  if (!code) return null;
  return `https://trader-results.roshan-ai.ir/fulltest_cache/${encodeURIComponent(
    code
  )}_FullTest/plots.html`;
}

// Card component for sections
const Card = ({ title, children, style = {} }) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        background: theme.colors.background.paper,
        borderRadius: "12px",
        boxShadow: theme.shadows.sm,
        overflow: "hidden",
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.tokens.ui.divider}`,
            background: theme.colors.background.main,
          }}
        >
          <h3
            style={{
              margin: 0,
              color: theme.colors.text.primary,
              fontSize: "18px",
            }}
          >
            {title}
          </h3>
        </div>
      )}
      <div style={{ padding: "20px" }}>{children}</div>
    </div>
  );
};

const StatusCircle = ({ status, progress = 0 }) => {
  const { theme } = useTheme();
  const colorsByStatus = getColorsByStatus(theme);
  const s = String(status || "").toLowerCase();
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  if (s === "completed") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill={colorsByStatus.completed} />
        <path
          d="M8 14l4 4 8-8"
          stroke={theme.tokens.grey[100]}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (s === "failed") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="12" fill={colorsByStatus.failed} />
        <path
          d="M10 10l8 8M18 10l-8 8"
          stroke={theme.tokens.grey[100]}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (s === "running") {
    return (
      <svg width="28" height="28" viewBox="0 0 32 32">
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke={theme.colors.border}
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="16"
          cy="16"
          r={radius}
          stroke={colorsByStatus.running}
          strokeWidth="4"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
        />
      </svg>
    );
  }

  // created: show a dashed circle with a plus sign
  if (s === "created") {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle
          cx="14"
          cy="14"
          r="12"
          fill="none"
          stroke={theme.tokens.grey[600]}
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
        {/* Plus sign */}
        <rect
          x="13"
          y="8"
          width="2"
          height="12"
          rx="1"
          fill={theme.tokens.grey[600]}
        />
        <rect
          x="8"
          y="13"
          width="12"
          height="2"
          rx="1"
          fill={theme.tokens.grey[600]}
        />
      </svg>
    );
  }
  // stopped/others: empty circle with pause sign
  const fill =
    s === "stopped" ? colorsByStatus.stopped : theme.tokens.grey[500];
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill={fill} />
      {/* Pause sign: two vertical bars */}
      <rect
        x="9"
        y="8"
        width="3"
        height="12"
        rx="1"
        fill={theme.colors.text.primary}
      />
      <rect
        x="16"
        y="8"
        width="3"
        height="12"
        rx="1"
        fill={theme.colors.text.primary}
      />
    </svg>
  );
};

const FulltestDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [showFullLogs, setShowFullLogs] = useState(false);
  const [fulltests, setFulltests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progressById, setProgressById] = useState({});
  const [jobStatus, setJobStatus] = useState(null);
  const { theme } = useTheme();
  const colorsByStatus = getColorsByStatus(theme);

  // New state: filters and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [nameToMeta, setNameToMeta] = useState({}); // { name: { tags: [], improvements: [] } }
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedImprovement, setSelectedImprovement] = useState("");

  // New: create fulltest modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  // New: Kubernetes container logs modal state
  const [isPodLogsOpen, setIsPodLogsOpen] = useState(false);
  const [podLogsMap, setPodLogsMap] = useState({}); // { podName: string }
  const [selectedPod, setSelectedPod] = useState("");

  async function refreshList(p = page, q = searchTerm) {
    setLoading(true);
    setError(null);
    try {
      const data = await listFulltests({ page: p, search: q || undefined });
      const items = data?.results || [];
      setFulltests(items);
      setCount(data?.count || items.length || 0);
      setNextUrl(data?.next || null);
      setPrevUrl(data?.previous || null);

      // Build name -> meta by fetching experiments matching names (cached)
      const uniqueNames = Array.from(
        new Set(items.map((t) => t.name || t.code).filter(Boolean))
      );
      const missing = uniqueNames.filter((n) => !nameToMeta[n]);
      if (missing.length > 0) {
        const fetchedEntries = await Promise.all(
          missing.map(async (nm) => {
            try {
              const { results } = await getFrontendExperiments({
                search: nm,
                limit: 1,
              });
              const exp = Array.isArray(results)
                ? results.find(
                    (e) => e.code === nm || e.id === nm || e.name === nm
                  ) || results[0]
                : null;
              const tags = Array.isArray(exp?.tags) ? exp.tags : [];
              const improvements = Array.isArray(exp?.improvements)
                ? exp.improvements
                : [];
              return [nm, { tags, improvements }];
            } catch (_) {
              return [nm, { tags: [], improvements: [] }];
            }
          })
        );
        setNameToMeta((prev) => ({
          ...prev,
          ...Object.fromEntries(fetchedEntries),
        }));
      }
    } catch (e) {
      setError(e.data || e.message || "Failed to load fulltests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshList(1, "");
  }, []);

  useEffect(() => {
    // Fetch job status when the component mounts
    getJobStatus()
      .then((response) => {
        setJobStatus(response);
      })
      .catch((error) => {
        console.error("Error fetching job status:", error);
      });
  }, []);

  // Poll progress for running jobs by parsing "%" from logs
  // Disabled per request: no need to refresh by time
  // useEffect(() => {
  //   const interval = setInterval(async () => {
  //     const running = fulltests.filter(
  //       (t) => String(t.status).toLowerCase() === "running"
  //     );
  //     if (running.length === 0) return;
  //     try {
  //       const entries = await Promise.all(
  //         running.map(async (t) => {
  //           const data = await getFulltestLogs(t.id);
  //           const text = Array.isArray(data)
  //             ? data.join("\n")
  //             : typeof data === "string"
  //             ? data
  //             : JSON.stringify(data);
  //           const matches = Array.from(text.matchAll(/(\d{1,3})%/g));
  //           const last = matches.length
  //             ? parseInt(matches[matches.length - 1][1], 10)
  //             : undefined;
  //           return [
  //             t.id,
  //             isFinite(last) ? Math.max(0, Math.min(100, last)) : undefined,
  //           ];
  //         })
  //       );
  //       setProgressById((prev) => {
  //         const next = { ...prev };
  //         for (const [id, pct] of entries) {
  //           if (pct !== undefined) next[id] = pct;
  //         }
  //         return next;
  //       });
  //     } catch (_) {
  //       // ignore polling errors
  //     }
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, [fulltests]);

  const [startingById, setStartingById] = useState({});

  const handleStart = async (id, highPriority = false) => {
    setStartingById((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await startFulltest(id, highPriority);
      console.log(response);
      await refreshList(page, searchTerm);
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    } finally {
      setStartingById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handlePause = async (id) => {
    try {
      await stopFulltest(id);
      await refreshList(page, searchTerm);
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFulltest(id);
      await refreshList(page, searchTerm);
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    }
  };

  const openLogs = async (id) => {
    try {
      const data = await getFulltestLogs(id);
      const text = Array.isArray(data.content)
        ? data.content.join("\n")
        : typeof data.content === "string"
        ? data.content
        : JSON.stringify(data.content, null, 2);
      const pretty = formatLogsString(text);
      setLogs(pretty.split("\n"));
      setShowFullLogs(id);
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    }
  };

  function normalizePodLogs(content) {
    // content is a string! Parse it first.
    // Flatten JSON if nested
    let parsed;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
      // If the parsed object has a single key and its value is an object, flatten one level
      const keys = Object.keys(parsed || {});
      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed) &&
        keys.length > 0 &&
        keys.every(
          (k) =>
            parsed[k] &&
            typeof parsed[k] === "object" &&
            !Array.isArray(parsed[k])
        )
      ) {
        // If all values are objects, merge them into one object
        parsed = Object.assign({}, ...keys.map((k) => parsed[k]));
      }
    } catch (e) {
      // If parsing fails, return empty object
      return {};
    }
    const out = {};
    if (!parsed || typeof parsed !== "object") return out;
    for (const [pod, val] of Object.entries(parsed)) {
      if (Array.isArray(val)) {
        out[pod] = val.join("\n");
      } else if (typeof val === "string") {
        out[pod] = val;
      } else if (val && typeof val === "object") {
        const s = val.content || val.logs || val.message || JSON.stringify(val);
        out[pod] = Array.isArray(s) ? s.join("\n") : String(s);
      } else {
        out[pod] = String(val);
      }
    }
    return out;
  }

  function formatLogsString(raw) {
    if (!raw || typeof raw !== "string") return "";
    const lines = raw.split(/\r?\n/);
    const cleaned = lines.map((ln) => {
      let s = ln.replace(/^[\u2500-\u257F]+\s*/g, "");
      s = s.replace(/^[\u2502▏│]\s*/g, "");
      // Trim excessive leading spaces that came from visual pipes
      s = s.replace(/^\s{2,}/, "  ");
      return s;
    });
    // Collapse multiple blank lines
    const collapsed = [];
    let blank = 0;
    for (const l of cleaned) {
      const isBlank = l.trim().length === 0;
      if (isBlank) {
        blank += 1;
        if (blank <= 1) collapsed.push("");
      } else {
        blank = 0;
        collapsed.push(l);
      }
    }
    return collapsed.join("\n");
  }

  const openContainerLogs = async (name) => {
    try {
      const res = await getKubeLogs(name, 500);
      const pods = normalizePodLogs(res?.content);
      const first = Object.keys(pods)[0] || "";
      setPodLogsMap(pods);
      setSelectedPod(first);
      setIsPodLogsOpen(true);
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      alert("Please provide a name");
      return;
    }
    setCreating(true);
    try {
      await createFulltestEntry({
        name: newName.trim(),
        tag: newTag.trim(),
        description: newDescription.trim(),
      });
      setIsCreateOpen(false);
      setNewName("");
      setNewTag("");
      setNewDescription("");
      await refreshList(1, searchTerm);
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (d) => {
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Derived filters options
  const allTags = Array.from(
    new Set(
      fulltests
        .map((t) => nameToMeta[t.name || t.code]?.tags || [])
        .flat()
        .filter(Boolean)
    )
  ).sort();
  const allImprovements = Array.from(
    new Set(
      fulltests
        .map((t) => nameToMeta[t.name || t.code]?.improvements || [])
        .flat()
        .filter(Boolean)
    )
  ).sort();

  // Apply client-side filters using meta
  const filteredFulltests = fulltests.filter((t) => {
    const nm = t.name || t.code;
    const meta = nameToMeta[nm] || { tags: [], improvements: [] };
    const tagOk = !selectedTag || meta.tags.includes(selectedTag);
    const impOk =
      !selectedImprovement || meta.improvements.includes(selectedImprovement);
    const searchOk =
      !searchTerm ||
      (nm && nm.toLowerCase().includes(searchTerm.toLowerCase()));
    return tagOk && impOk && searchOk;
  });

  // Local date derivation (Author_YYYYMMDDHHMM -> created_at -> epoch)
  const deriveFulltestDate = (test) => {
    const nm = test?.name || test?.code || "";
    const m = /^(.*)_([0-9]{12})$/.exec(nm);
    if (m && m[2]) {
      const s = m[2];
      const year = Number(s.slice(0, 4));
      const month = Number(s.slice(4, 6)) - 1;
      const day = Number(s.slice(6, 8));
      const hour = Number(s.slice(8, 10));
      const minute = Number(s.slice(10, 12));
      const d = new Date(Date.UTC(year, month, day, hour, minute));
      if (!isNaN(d.getTime())) return d;
    }
    const created = test?.created_at ? new Date(test.created_at) : null;
    if (created && !isNaN(created.getTime())) return created;
    return new Date(0);
  };

  const sortedFulltests = [...filteredFulltests].sort(
    (a, b) => deriveFulltestDate(b) - deriveFulltestDate(a)
  );

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1400px",
        margin: "0 auto",
        background: `linear-gradient(120deg, ${theme.colors.border} 60%, ${theme.colors.border} 100%)`,
        minHeight: "100vh",
        borderRadius: "16px",
      }}
    >
      {jobStatus && (
        <section
          style={{
            background: theme.colors.background.paper,
            padding: "24px 32px",
            borderRadius: "16px",
            boxShadow: "0 4px 24px 0 rgba(44,62,80,0.08)",
            marginBottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "32px",
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div style={{ flex: "0 0 auto" }}>
            <h3
              style={{
                margin: 0,
                color: theme.colors.text.primary,
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  verticalAlign: "middle",
                  marginRight: "10px",
                  color: theme.colors.info.main,
                }}
              >
                ⏱️
              </span>
              Job Status
            </h3>
            <div
              style={{
                fontSize: "13px",
                color: theme.colors.text.secondary,
                marginTop: "2px",
              }}
            >
              Cluster queue overview
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "32px",
              flex: 1,
              justifyContent: "flex-end",
            }}
          >
            <div
              style={{
                background: theme.tokens.accent.blue.extra,
                color: theme.tokens.accent.blue.main,
                borderRadius: "8px",
                padding: "12px 20px",
                minWidth: "120px",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "16px",
                boxShadow: theme.shadows.sm,
                border: `1px solid ${theme.tokens.accent.blue.dark}`,
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: theme.tokens.accent.blue.main,
                  fontWeight: 500,
                  marginBottom: "2px",
                }}
              >
                High Priority
              </div>
              {jobStatus.high_priority_jobs}
            </div>
            <div
              style={{
                background: theme.tokens.accent.purple.extra,
                color: theme.tokens.accent.purple.dark,
                borderRadius: "8px",
                padding: "12px 20px",
                minWidth: "120px",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "16px",
                boxShadow: theme.shadows.sm,
                border: `1px solid ${theme.tokens.accent.purple.dark}`,
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: theme.tokens.accent.purple.main,
                  fontWeight: 500,
                  marginBottom: "2px",
                }}
              >
                Normal Priority
              </div>
              {jobStatus.normal_priority_jobs}
            </div>
            <div
              style={{
                background: theme.tokens.accent.green.extra,
                color: theme.tokens.accent.green.main,
                borderRadius: "8px",
                padding: "12px 20px",
                minWidth: "120px",
                textAlign: "center",
                fontWeight: 600,
                fontSize: "16px",
                boxShadow: theme.shadows.sm,
                border: `1px solid ${theme.tokens.accent.green.dark}`,
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  color: theme.tokens.accent.green.main,
                  fontWeight: 500,
                  marginBottom: "2px",
                }}
              >
                Running Total
              </div>
              {jobStatus.total_running_jobs}
            </div>
          </div>
        </section>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2
          style={{
            color: theme.colors.text.primary,
            margin: 0,
            fontSize: "24px",
            fontWeight: "600",
          }}
        >
          Fulltest Dashboard
        </h2>
        <button
          onClick={() => setIsCreateOpen(true)}
          style={{
            padding: "10px 20px",
            border: "none",
            borderRadius: "8px",
            background: `linear-gradient(90deg, ${theme.colors.info.main} 0%, ${theme.colors.info.light} 100%)`,
            color: theme.tokens.grey[100],
            fontWeight: 600,
            fontSize: "16px",
            boxShadow: theme.shadows.sm,
            cursor: "pointer",
            transition: "background 0.2s, box-shadow 0.2s",
            outline: "none",
            letterSpacing: "0.5px",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = `linear-gradient(90deg, ${theme.colors.info.dark} 0%, ${theme.colors.info.main} 100%)`;
            e.currentTarget.style.boxShadow = theme.shadows.md;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = `linear-gradient(90deg, ${theme.colors.info.main} 0%, ${theme.colors.info.light} 100%)`;
            e.currentTarget.style.boxShadow = theme.shadows.sm;
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            style={{
              verticalAlign: "middle",
              marginRight: "8px",
              marginBottom: "2px",
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="10" cy="10" r="10" fill="#fff" fillOpacity="0.50" />
            <path
              d="M10 5v10M5 10h10"
              stroke={theme.colors.info.main}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          New Fulltest
        </button>
      </div>

      {isCreateOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: theme.colors.background.paper,
              borderRadius: "8px",
              padding: "16px",
              width: "90%",
              maxWidth: "480px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: "12px",
                color: theme.colors.text.primary,
              }}
            >
              Create New Fulltest
            </h3>
            <div style={{ display: "grid", gap: "8px" }}>
              <label
                style={{ fontSize: "12px", color: theme.colors.text.secondary }}
              >
                Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., sahand_202508121535"
                style={{
                  padding: "8px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                }}
              />
              <label
                style={{ fontSize: "12px", color: theme.colors.text.secondary }}
              >
                Tag (optional)
              </label>
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="comma,separated,tags"
                style={{
                  padding: "8px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                }}
              />
              <label
                style={{ fontSize: "12px", color: theme.colors.text.secondary }}
              >
                Description (optional)
              </label>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe the fulltest"
                style={{
                  padding: "8px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                  minHeight: "80px",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={() => setIsCreateOpen(false)}
                disabled={creating}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                  background: theme.colors.background.paper,
                  cursor: creating ? "not-allowed" : "pointer",
                  color: theme.colors.text.primary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.info.main}`,
                  borderRadius: "6px",
                  background: theme.colors.info.main,
                  color: theme.tokens.grey[100],
                  cursor: creating ? "not-allowed" : "pointer",
                }}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pod logs modal */}
      {isPodLogsOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
        >
          <div
            style={{
              background: theme.colors.background.paper,
              borderRadius: "10px",
              width: "95%",
              maxWidth: "70vw",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${theme.colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ fontWeight: 600, color: theme.colors.text.primary }}
              >
                Kubernetes Container Logs
              </div>
              <button
                onClick={() => setIsPodLogsOpen(false)}
                style={{
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.background.paper,
                  borderRadius: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: theme.colors.text.primary,
                }}
              >
                Close
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "240px 1fr",
                minHeight: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  borderRight: `1px solid ${theme.colors.border}`,
                  padding: "10px",
                  overflowY: "auto",
                }}
              >
                {Object.keys(podLogsMap).length === 0 ? (
                  <div
                    style={{
                      color: theme.colors.text.disabled,
                      fontSize: "14px",
                    }}
                  >
                    No pods
                  </div>
                ) : (
                  Object.keys(podLogsMap).map((pod) => (
                    <div
                      key={pod}
                      onClick={() => setSelectedPod(pod)}
                      style={{
                        padding: "8px 10px",
                        marginBottom: "6px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        background:
                          selectedPod === pod
                            ? theme.tokens.grey[300]
                            : "transparent",
                        color:
                          selectedPod === pod
                            ? theme.colors.text.primary
                            : theme.colors.text.secondary,
                        border: `1px solid ${theme.colors.border}`,
                        display: "inline-block",
                        maxWidth: "100%",
                        wordBreak: "break-all",
                        whiteSpace: "normal",
                      }}
                      title={pod}
                    >
                      {pod}
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: "10px", overflow: "auto" }}>
                <div
                  style={{
                    background: theme.tokens.grey[800],
                    color: theme.tokens.grey[300],
                    padding: "12px",
                    borderRadius: "8px",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: 0,
                    fontSize: "10px",
                    fontFamily: "monospace",
                  }}
                >
                  {podLogsMap[selectedPod] || ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gap: "24px",
          gridTemplateColumns: "1.5fr 1fr",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card title="Fulltest History">
            {loading && (
              <div
                style={{ padding: "8px", color: theme.colors.text.secondary }}
              >
                Loading...
              </div>
            )}
            {error && (
              <div style={{ padding: "8px", color: theme.colors.error.main }}>
                {String(error)}
              </div>
            )}

            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "12px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    refreshList(1, e.target.value);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                  background: theme.colors.background.paper,
                  color: theme.colors.text.primary,
                }}
              />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                style={{
                  padding: "8px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.background.paper,
                  borderRadius: "6px",
                  color: theme.colors.text.primary,
                }}
              >
                <option value="">All Tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={selectedImprovement}
                onChange={(e) => setSelectedImprovement(e.target.value)}
                style={{
                  padding: "8px 10px",
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.background.paper,
                  borderRadius: "6px",
                  color: theme.colors.text.primary,
                }}
              >
                <option value="">All Improvements</option>
                {allImprovements.map((imp) => (
                  <option key={imp} value={imp}>
                    {imp}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  setPage(1);
                  refreshList(1, searchTerm);
                }}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                  background: theme.colors.background.paper,
                  cursor: "pointer",
                  color: theme.colors.text.primary,
                }}
              >
                Apply
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0",
                  fontSize: "14px",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ ...thStyle(theme), textAlign: "left" }}>
                      Name
                    </th>
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>
                      Tags
                    </th>
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>
                      Improvements
                    </th>
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>
                      Status
                    </th>
                    <th style={{ ...thStyle(theme), textAlign: "center" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFulltests.map((test) => {
                    const nm = test.name || test.code;
                    const meta = nameToMeta[nm] || {
                      tags: [],
                      improvements: [],
                    };
                    return (
                      <tr key={test.id} style={{ transition: "all 0.2s ease" }}>
                        <td style={{ ...tdStyle(theme) }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            <div style={{ fontWeight: "500" }}>
                              {nm || `#${test.id}`}
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: theme.colors.text.secondary,
                              marginTop: "2px",
                            }}
                          >
                            {formatDate(deriveFulltestDate(test))}
                          </div>
                        </td>
                        <td style={{ ...tdStyle(theme), textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "4px",
                              justifyContent: "center",
                            }}
                          >
                            {meta.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  padding: "2px 6px",
                                  border: `1px solid ${theme.colors.border}`,
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  color: theme.colors.text.secondary,
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                            {meta.tags.length > 3 && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: theme.colors.text.secondary,
                                }}
                              >
                                +{meta.tags.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ ...tdStyle(theme), textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "4px",
                              justifyContent: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            {meta.improvements.map((imp, idx) => (
                              <span
                                key={idx}
                                style={{
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                  fontSize: "11px",
                                  border: `1px solid ${theme.colors.border}`,
                                  backgroundColor:
                                    imp === "Open"
                                      ? theme.tokens.success.light
                                      : imp === "Close"
                                      ? theme.tokens.error.light
                                      : theme.tokens.info.light,
                                  color:
                                    imp === "Open"
                                      ? theme.tokens.success.main
                                      : imp === "Close"
                                      ? theme.tokens.error.main
                                      : theme.tokens.info.main,
                                }}
                              >
                                {imp}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td style={{ ...tdStyle(theme), textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "8px",
                              position: "relative",
                            }}
                            title={
                              test.status
                                ? String(test.status).charAt(0).toUpperCase() +
                                  String(test.status).slice(1) +
                                  (String(test.status).toLowerCase() ===
                                    "running" &&
                                  typeof test.progress === "number"
                                    ? ` (${Math.round(test.progress)}%)`
                                    : "")
                                : ""
                            }
                          >
                            <StatusCircle
                              status={test.status}
                              progress={test.progress}
                            />
                          </div>
                        </td>
                        <td style={{ ...tdStyle(theme), textAlign: "center" }}>
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              justifyContent: "center",
                            }}
                          >
                            <IconButton
                              onClick={() =>
                                window.open(getPlotsUrl(nm), "_blank")
                              }
                              title="View results"
                            >
                              <ExternalLinkIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleStart(test.id)}
                              title="Start"
                              disabled={!!startingById[test.id]}
                            >
                              {startingById[test.id] ? (
                                <Spinner color={theme.colors.info.main} size={18} />
                              ) : (
                                <PlayIcon />
                              )}
                            </IconButton>
                            <IconButton
                              onClick={() => handleStart(test.id, true)}
                              title="Start High Priority"
                              disabled={!!startingById[test.id]}
                            >
                              {startingById[test.id] ? (
                                <Spinner color={theme.colors.info.main} size={18} />
                              ) : (
                                <PlayHighPriorityIcon />
                              )}
                            </IconButton>
                            <IconButton
                              onClick={() => handlePause(test.id)}
                              title="Pause"
                            >
                              <PauseIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => openContainerLogs(nm)}
                              title="View Container Logs"
                            >
                              <LogsIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => openLogs(test.id)}
                              title="View Logs"
                            >
                              <ScrollIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDelete(test.id)}
                              title="Delete"
                              variant="danger"
                            >
                              <TrashIcon />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "12px",
              }}
            >
              <button
                onClick={() => {
                  const p = Math.max(1, page - 1);
                  setPage(p);
                  refreshList(p, searchTerm);
                }}
                disabled={!prevUrl}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                  background: theme.colors.background.paper,
                  cursor: prevUrl ? "pointer" : "not-allowed",
                  color: prevUrl
                    ? theme.colors.text.primary
                    : theme.colors.text.disabled,
                }}
              >
                Previous
              </button>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px", color: theme.colors.text.primary }}
              >
                Page {page}
              </div>
              <button
                onClick={() => {
                  const p = page + 1;
                  setPage(p);
                  refreshList(p, searchTerm);
                }}
                disabled={!nextUrl}
                style={{
                  padding: "8px 12px",
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: "6px",
                  background: theme.colors.background.paper,
                  cursor: nextUrl ? "pointer" : "not-allowed",
                  color: nextUrl
                    ? theme.colors.text.primary
                    : theme.colors.text.disabled,
                }}
              >
                Next
              </button>
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card
            title={
              showFullLogs
                ? `Logs: ${
                    fulltests.find((t) => t.id === showFullLogs)?.name ||
                    `#${showFullLogs}`
                  }`
                : "Live Logs"
            }
            style={{ flex: 1 }}
          >
            <pre
              style={{
                background: theme.tokens.grey[800],
                color: theme.tokens.grey[300],
                padding: "16px",
                borderRadius: "8px",
                maxHeight: "500px",
                overflowY: "auto",
                fontSize: "13px",
                margin: 0,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {logs.join("\n")}
            </pre>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Shared styles (theme-aware)
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

export default FulltestDashboard;
