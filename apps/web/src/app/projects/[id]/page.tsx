"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { RunReportResponse, ApproveDiagramRequest } from "@spec-engine/shared";

const STATUS_COLORS: Record<string, string> = {
  draft: "#999",
  queued: "#f59e0b",
  running: "#3b82f6",
  awaiting_approval: "#8b5cf6",
  blocked: "#ef4444",
  completed: "#22c55e",
  ready_for_devin: "#10b981",
  failed: "#dc2626",
};

const POLL_INTERVAL = 5000;

export default function ProjectMonitorPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [report, setReport] = useState<RunReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionPending, setActionPending] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/run-report`);
      if (!res.ok) throw new Error("Failed to fetch report");
      const data: RunReportResponse = await res.json();
      setReport(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchReport();
    const interval = setInterval(fetchReport, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchReport]);

  async function handleStart() {
    setActionPending(true);
    try {
      await fetch(`/api/projects/${projectId}/start`, { method: "POST" });
      await fetchReport();
    } finally {
      setActionPending(false);
    }
  }

  async function handleStop() {
    setActionPending(true);
    try {
      await fetch(`/api/projects/${projectId}/stop`, { method: "POST" });
      await fetchReport();
    } finally {
      setActionPending(false);
    }
  }

  async function handleResume() {
    setActionPending(true);
    try {
      await fetch(`/api/projects/${projectId}/resume`, { method: "POST" });
      await fetchReport();
    } finally {
      setActionPending(false);
    }
  }

  async function handleApprove(approved: boolean) {
    setActionPending(true);
    try {
      const body: ApproveDiagramRequest = { approved };
      await fetch(`/api/projects/${projectId}/approve-diagram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await fetchReport();
    } finally {
      setActionPending(false);
    }
  }

  if (loading) {
    return <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>読み込み中...</main>;
  }

  if (error && !report) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        <p style={{ color: "#dc2626" }}>Error: {error}</p>
        <Link href="/projects" style={{ color: "#0070f3" }}>案件一覧に戻る</Link>
      </main>
    );
  }

  if (!report) return null;

  const { project, phase, scores, conflictsSummary, artifactsSummary, readyForDevin } = report;

  const panelStyle: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "1rem",
    background: "#fff",
  };

  const headingStyle: React.CSSProperties = {
    fontSize: "0.9rem",
    fontWeight: 700,
    marginBottom: "0.75rem",
    color: "#374151",
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <Link href="/projects" style={{ color: "#0070f3", textDecoration: "none", fontSize: "0.85rem" }}>
            &larr; 案件一覧
          </Link>
          <h1 style={{ fontSize: "1.5rem", margin: "0.25rem 0 0" }}>{project.title}</h1>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span
            style={{
              padding: "0.3rem 0.75rem",
              borderRadius: "4px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "#fff",
              background: STATUS_COLORS[project.status] ?? "#999",
            }}
          >
            {project.status}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>フェーズ: {phase}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        {project.status === "draft" && (
          <button onClick={handleStart} disabled={actionPending}
            style={{ padding: "0.5rem 1rem", background: "#22c55e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            ワークフロー開始
          </button>
        )}
        {(project.status === "running" || project.status === "queued") && (
          <button onClick={handleStop} disabled={actionPending}
            style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            緊急停止
          </button>
        )}
        {project.status === "blocked" && (
          <button onClick={handleResume} disabled={actionPending}
            style={{ padding: "0.5rem 1rem", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            再開
          </button>
        )}
        {project.status === "awaiting_approval" && (
          <>
            <button onClick={() => handleApprove(true)} disabled={actionPending}
              style={{ padding: "0.5rem 1rem", background: "#22c55e", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              図を承認
            </button>
            <button onClick={() => handleApprove(false)} disabled={actionPending}
              style={{ padding: "0.5rem 1rem", background: "#ef4444", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}>
              図を却下
            </button>
          </>
        )}
        {(project.status === "completed" || project.status === "ready_for_devin") && (
          <a href={`/api/projects/${projectId}/export-zip`}
            style={{ padding: "0.5rem 1rem", background: "#0070f3", color: "#fff", border: "none", borderRadius: "6px", textDecoration: "none", display: "inline-block" }}>
            ZIPダウンロード
          </a>
        )}
      </div>

      {/* Dashboard Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Progress Panel */}
        <div style={panelStyle}>
          <h3 style={headingStyle}>進捗</h3>
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.85rem" }}>ステップ {report.project.latestStepStatus?.stepOrder ?? "-"}/20</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{project.progressPercent}%</span>
            </div>
            <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "5px" }}>
              <div style={{ width: `${project.progressPercent}%`, height: "100%", background: "#3b82f6", borderRadius: "5px", transition: "width 0.3s" }} />
            </div>
          </div>
          {report.project.latestStepStatus && (
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.5rem 0 0" }}>
              現在: {report.project.latestStepStatus.stepKey} ({report.project.latestStepStatus.status})
            </p>
          )}
          {report.totalRuntimeSec !== null && (
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.25rem 0 0" }}>
              実行時間: {Math.floor(report.totalRuntimeSec / 60)}分 {report.totalRuntimeSec % 60}秒
            </p>
          )}
        </div>

        {/* Loop Panel */}
        <div style={panelStyle}>
          <h3 style={headingStyle}>ループ状態</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.85rem" }}>
            <div>ループ回数: <strong>{project.loopCount ?? 0}</strong></div>
            <div>上限: <strong>7</strong></div>
            {project.loopStopReason && <div style={{ gridColumn: "1 / -1" }}>停止理由: <strong>{project.loopStopReason}</strong></div>}
          </div>
        </div>

        {/* Scores Panel */}
        <div style={panelStyle}>
          <h3 style={headingStyle}>スコア</h3>
          {scores ? (
            <>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: scores.total >= 94 ? "#22c55e" : scores.total >= 80 ? "#f59e0b" : "#ef4444" }}>
                {scores.total}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#999", marginBottom: "0.75rem" }}>/ 100 (目標: 94)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem", fontSize: "0.8rem" }}>
                {Object.entries(scores.categories).map(([cat, val]) => (
                  <div key={cat} style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight: 600, color: (val as number) >= 80 ? "#22c55e" : "#ef4444" }}>{val as number}</span>
                  </div>
                ))}
              </div>
              {report.scoreDelta !== null && (
                <p style={{ fontSize: "0.8rem", color: report.scoreDelta >= 0 ? "#22c55e" : "#ef4444", marginTop: "0.5rem" }}>
                  Delta: {report.scoreDelta >= 0 ? "+" : ""}{report.scoreDelta}
                </p>
              )}
            </>
          ) : (
            <p style={{ color: "#999", fontSize: "0.85rem" }}>スコアはステップ15以降に表示されます</p>
          )}
        </div>

        {/* Conflicts Panel */}
        <div style={panelStyle}>
          <h3 style={headingStyle}>矛盾検出</h3>
          <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.9rem" }}>
            <div>
              <span style={{ color: "#dc2626", fontWeight: 700, fontSize: "1.5rem" }}>{conflictsSummary.critical}</span>
              <div style={{ color: "#999", fontSize: "0.75rem" }}>重大</div>
            </div>
            <div>
              <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "1.5rem" }}>{conflictsSummary.major}</span>
              <div style={{ color: "#999", fontSize: "0.75rem" }}>警告</div>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontWeight: 700, fontSize: "1.5rem" }}>{conflictsSummary.minor}</span>
              <div style={{ color: "#999", fontSize: "0.75rem" }}>軽微</div>
            </div>
          </div>
        </div>

        {/* Artifacts Panel */}
        <div style={{ ...panelStyle, gridColumn: "1 / -1" }}>
          <h3 style={headingStyle}>成果物</h3>
          {artifactsSummary.length === 0 ? (
            <p style={{ color: "#999", fontSize: "0.85rem" }}>成果物はまだありません</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
              {artifactsSummary.map((a) => (
                <div key={a.artifactType} style={{ padding: "0.5rem", background: "#f9fafb", borderRadius: "4px", fontSize: "0.8rem" }}>
                  <div style={{ fontWeight: 600 }}>{a.artifactType}</div>
                  <div style={{ color: "#999" }}>v{a.versionNo}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Devin Gate Panel */}
        <div style={{ ...panelStyle, gridColumn: "1 / -1" }}>
          <h3 style={headingStyle}>Devin ゲート</h3>
          <div style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: readyForDevin ? "#22c55e" : "#999",
          }}>
            {readyForDevin ? "DEVIN実装可能" : "まだ準備中"}
          </div>
          {report.improvementRecommendations.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <div style={{ fontSize: "0.8rem", color: "#666", marginBottom: "0.25rem" }}>改善提案:</div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.8rem", color: "#666" }}>
                {report.improvementRecommendations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
