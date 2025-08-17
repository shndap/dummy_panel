import React, { useState, useEffect } from "react";
import {
  PageContainer,
  PageHeader,
  Card,
  Button,
  Input,
} from "./shared/UIComponents";
import { apiFetch } from "../api/client";
import { getFrontendExperiments } from "../api/fulltests";
import { useTheme } from "../contexts/ThemeContext";

const ExperimentInfo = () => {
  const [experimentCode, setExperimentCode] = useState("");
  const [experimentData, setExperimentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { theme } = useTheme();

  const resolveId = async (input) => {
    if (/^\d+$/.test(input)) return input; // numeric id
    const { results } = await getFrontendExperiments({
      search: input,
      limit: 1,
      page: 1,
    });
    const match = Array.isArray(results)
      ? results.find((r) => r.code === input) || results[0]
      : null;
    return match?.pk ?? match?.id ?? input;
  };

  const fetchByInput = async (rawInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const raw = (rawInput || "").trim();
      if (!raw) throw new Error("No experiment code provided");
      const id = await resolveId(raw);
      const [gitDiff, gitInfo] = await Promise.all([
        apiFetch(`/api/fulltests/${id}/git_diff/`),
        apiFetch(`/api/fulltests/${id}/git_info/`),
      ]);

      const gitDiffText =
        gitDiff.status === "success"
          ? gitDiff.content
          : "Failed to load git diff";

      const gitInfoContent =
        gitInfo.status === "success" ? gitInfo.content : null;
      let gitInfoObject = null;
      let gitInfoRaw = "";
      if (gitInfoContent != null) {
        if (typeof gitInfoContent === "string") {
          gitInfoRaw = gitInfoContent;
          try {
            const parsed = JSON.parse(gitInfoContent);
            if (parsed && typeof parsed === "object") gitInfoObject = parsed;
          } catch (_) {
            // keep as raw string
          }
        } else if (typeof gitInfoContent === "object") {
          gitInfoObject = gitInfoContent;
          gitInfoRaw = JSON.stringify(gitInfoContent, null, 2);
        }
      }

      setExperimentData({
        gitDiff: gitDiffText,
        gitInfoObject,
        gitInfoRaw,
        otherInfo: "Loaded from backend",
      });
    } catch (e) {
      setError(
        "Failed to fetch experiment info, make sure the experiment code is correct."
      );
      setExperimentData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchByInput(experimentCode);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const exp = params.get("exp");
    if (exp) {
      setExperimentCode(exp);
      fetchByInput(exp);
    }
  }, []);

  const renderGitDiffPretty = (text) => {
    const lines = String(text || "").split("\n");
    const isHeader = (l) =>
      l.startsWith("diff --git") ||
      l.startsWith("index ") ||
      l.startsWith("+++ ") ||
      l.startsWith("--- ");
    const isHunk = (l) => l.startsWith("@@");
    const isAdd = (l) => l.startsWith("+") && !l.startsWith("+++ ");
    const isDel = (l) => l.startsWith("-") && !l.startsWith("--- ");

    return (
      <div
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize: "12px",
          background: theme.tokens.background.dark,
          color: theme.tokens.grey[300],
          padding: "12px",
          borderRadius: "8px",
          overflowX: "auto",
        }}
      >
        {lines.map((line, idx) => {
          const style = {
            padding: "0 8px",
            whiteSpace: "pre",
          };
          if (isHeader(line)) {
            style.background = theme.tokens.gitDiff.header.bg;
            style.color = theme.tokens.gitDiff.header.text;
          } else if (isHunk(line)) {
            style.background = theme.tokens.gitDiff.hunk.bg;
            style.color = theme.tokens.gitDiff.hunk.text;
          } else if (isAdd(line)) {
            style.background = theme.tokens.gitDiff.add.bg;
            style.color = theme.tokens.gitDiff.add.text;
          } else if (isDel(line)) {
            style.background = theme.tokens.gitDiff.del.bg;
            style.color = theme.tokens.gitDiff.del.text;
          } else {
            style.color = theme.tokens.grey[300];
          }
          return (
            <div key={idx} style={style}>
              {line || "\u00A0"}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <PageContainer>
      <PageHeader title="Experiment Info" />

      <Card>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1 }}>
            <Input
              type="text"
              placeholder="Enter experiment id or code"
              value={experimentCode}
              onChange={(e) => setExperimentCode(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </form>

        {error && (
          <div style={{ color: theme.colors.danger.main, marginTop: "12px" }}>
            {String(error)}
          </div>
        )}

        {experimentData && (
          <div style={{ marginTop: "24px" }}>
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  color: theme.colors.text.primary,
                  marginBottom: "12px",
                }}
              >
                Git Diff
              </h4>
              {renderGitDiffPretty(experimentData.gitDiff)}
            </div>

            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  color: theme.colors.text.primary,
                  marginBottom: "12px",
                }}
              >
                Git Info
              </h4>
              {(() => {
                const { gitInfoObject, gitInfoRaw } = experimentData;
                if (gitInfoObject && typeof gitInfoObject === "object") {
                  const entries = Object.entries(gitInfoObject);
                  return (
                    <div style={{ overflowX: "auto" }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "13px",
                        }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "8px",
                                borderBottom: `1px solid ${theme.colors.border}`,
                                color: theme.colors.text.secondary,
                              }}
                            >
                              Key
                            </th>
                            <th
                              style={{
                                textAlign: "left",
                                padding: "8px",
                                borderBottom: `1px solid ${theme.colors.border}`,
                                color: theme.colors.text.secondary,
                              }}
                            >
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {entries.map(([key, value]) => (
                            <tr key={key}>
                              <td
                                style={{
                                  padding: "8px",
                                  borderBottom: `1px solid ${theme.colors.border}`,
                                  color: theme.colors.text.primary,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {key}
                              </td>
                              <td
                                style={{
                                  padding: "8px",
                                  borderBottom: `1px solid ${theme.colors.border}`,
                                  color: theme.colors.text.primary,
                                }}
                              >
                                {typeof value === "object" ? (
                                  <pre style={{ margin: 0 }}>
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  String(value)
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }
                return (
                  <pre
                    style={{
                      background: theme.colors.background.main,
                      padding: "16px",
                      borderRadius: "8px",
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: "13px",
                      lineHeight: 1.5,
                    }}
                  >
                    {gitInfoRaw || "No git info available"}
                  </pre>
                );
              })()}
            </div>

            <div>
              <h4
                style={{
                  color: theme.colors.text.primary,
                  marginBottom: "12px",
                }}
              >
                Other Info
              </h4>
              <p
                style={{
                  color: theme.colors.text.secondary,
                  lineHeight: 1.6,
                  fontSize: "14px",
                }}
              >
                {experimentData.otherInfo}
              </p>
            </div>
          </div>
        )}
      </Card>
    </PageContainer>
  );
};

export default ExperimentInfo;
