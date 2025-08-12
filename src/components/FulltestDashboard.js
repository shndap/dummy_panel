import React, { useState, useEffect } from "react";
import {
  listFulltests,
  startFulltest,
  deleteFulltest,
  getFulltestLogs,
} from "../api/fulltests";

const colorsByStatus = {
  created: "#CBD5E0",
  running: "#3182CE",
  completed: "#48BB78",
  failed: "#E53E3E",
  stopped: "#ED8936",
  };

const IconButton = ({ onClick, title, children, variant = "default" }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        border: "none",
        background: hovered
          ? variant === "danger"
            ? "#FFF5F5"
            : "#EDF2F7"
          : "transparent",
        cursor: "pointer",
        padding: "6px",
        borderRadius: "6px",
        color: variant === "danger" ? "#E53E3E" : "#2D3748",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </button>
  );
};

const PlayIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 5v14l11-7L8 5z" fill="#2B6CB0" />
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

// Card component for sections
const Card = ({ title, children, style = {} }) => (
  <div
    style={{
      background: "white",
      borderRadius: "12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      overflow: "hidden",
    ...style,
    }}
  >
    {title && (
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #edf2f7",
          background: "#f8fafc",
        }}
      >
        <h3 style={{ margin: 0, color: "#2d3748", fontSize: "18px" }}>
          {title}
        </h3>
      </div>
    )}
    <div style={{ padding: "20px" }}>{children}</div>
  </div>
);

const StatusCircle = ({ status, progress = 0 }) => {
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
          stroke="white"
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
          stroke="white"
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
          stroke="#E2E8F0"
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

  // created/stopped/others: empty circle
  const fill = s === "stopped" ? colorsByStatus.stopped : "#CBD5E0";
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill={fill} />
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

  async function refreshList() {
    setLoading(true);
    setError(null);
    try {
      const data = await listFulltests({ page: 1 });
      const items = data?.results || [];
      setFulltests(items);
    } catch (e) {
      setError(e.data || e.message || "Failed to load fulltests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshList();
  }, []);

  // Poll progress for running jobs by parsing "%" from logs
  useEffect(() => {
    const interval = setInterval(async () => {
      const running = fulltests.filter(
        (t) => String(t.status).toLowerCase() === "running"
      );
      if (running.length === 0) return;
      try {
        const entries = await Promise.all(
          running.map(async (t) => {
            const data = await getFulltestLogs(t.id);
            const text = Array.isArray(data)
              ? data.join("\n")
              : typeof data === "string"
              ? data
              : JSON.stringify(data);
            const matches = Array.from(text.matchAll(/(\d{1,3})%/g));
            const last = matches.length
              ? parseInt(matches[matches.length - 1][1], 10)
              : undefined;
            return [
              t.id,
              isFinite(last) ? Math.max(0, Math.min(100, last)) : undefined,
            ];
          })
        );
        setProgressById((prev) => {
          const next = { ...prev };
          for (const [id, pct] of entries) {
            if (pct !== undefined) next[id] = pct;
          }
          return next;
        });
      } catch (_) {
        // ignore polling errors
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fulltests]);

  const handleStart = async (id) => {
    try {
      await startFulltest(id);
      await refreshList();
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteFulltest(id);
      await refreshList();
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    }
  };

  const openLogs = async (id) => {
    try {
      const data = await getFulltestLogs(id);
      const text = Array.isArray(data)
        ? data.join("\n")
        : typeof data === "string"
        ? data
        : JSON.stringify(data, null, 2);
      setLogs(text.split("\n"));
      setShowFullLogs(id);
    } catch (e) {
      alert(e.data ? JSON.stringify(e.data) : e.message);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1400px",
        margin: "0 auto",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
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
            color: "#1a202c",
          margin: 0,
            fontSize: "24px",
            fontWeight: "600",
          }}
        >
          Fulltest Dashboard
        </h2>
      </div>

      <div
        style={{ display: "grid", gap: "24px", gridTemplateColumns: "1fr 1fr" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <Card title="Fulltest History">
            {loading && (
              <div style={{ padding: "8px", color: "#718096" }}>Loading...</div>
            )}
            {error && (
              <div style={{ padding: "8px", color: "#E53E3E" }}>
                {String(error)}
              </div>
            )}
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
                    <th style={{ ...thStyle, textAlign: "left" }}>Name</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Date</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fulltests.map((test) => (
                    <tr key={test.id} style={{ transition: "all 0.2s ease" }}>
                      <td style={{ ...tdStyle }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div style={{ fontWeight: "500" }}>
                            {test.name || test.code || `#${test.id}`}
                          </div>
                        </div>
                        <button 
                          onClick={() => openLogs(test.id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#4299e1",
                            fontSize: "12px",
                            cursor: "pointer",
                            padding: 0,
                            marginTop: "4px",
                          }}
                        >
                          View Logs
                        </button>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        {test.created_at ? formatDate(test.created_at) : "-"}
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <StatusCircle
                            status={test.status}
                            progress={progressById[test.id]}
                          />
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            justifyContent: "center",
                          }}
                        >
                          <IconButton
                            onClick={() => handleStart(test.id)}
                            title="Start"
                          >
                            <PlayIcon />
                          </IconButton>
                          <IconButton
                            onClick={() =>
                              window.open(test.results_path, "_blank")
                            }
                            title="View results"
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
                  ))}
                </tbody>
              </table>
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
                background: "#2d3748",
                color: "#e2e8f0",
                padding: "16px",
                borderRadius: "8px",
                maxHeight: "500px",
                overflowY: "auto",
                fontSize: "13px",
              margin: 0,
              lineHeight: 1.5,
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

// Shared styles
const thStyle = {
  padding: "12px",
  textAlign: "left",
  borderBottom: "2px solid #edf2f7",
  color: "#4a5568",
  fontWeight: "600",
};

const tdStyle = {
  padding: "16px 12px",
  borderBottom: "1px solid #edf2f7",
};

export default FulltestDashboard;
