"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { RunReportResponse, ApproveDiagramRequest, WorkflowLogItem } from "@spec-engine/shared";

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

/** Poll fast while running/queued, slower otherwise */
const POLL_INTERVAL_ACTIVE = 2000;
const POLL_INTERVAL_IDLE = 10000;

const STATUS_LABELS: Record<string, string> = {
  draft: "下書き",
  queued: "処理待ち",
  running: "実行中",
  awaiting_approval: "承認待ち",
  blocked: "停止中",
  completed: "完了",
  ready_for_devin: "Devin実装可",
  failed: "失敗",
};

const STATUS_MESSAGES: Record<string, string> = {
  queued: "ワーカーが処理を開始するまでお待ちください...",
  running: "ワークフローを実行中です...",
  awaiting_approval: "UI画面遷移図の承認をお願いします",
  blocked: "処理が停止されました。再開ボタンで続行できます",
  completed: "すべてのステップが完了しました",
  ready_for_devin: "Devinで実装可能な状態です",
  failed: "処理中にエラーが発生しました",
};

const STEP_LABELS: Record<string, string> = {
  intake: "要件取込",
  common_features_apply: "共通機能適用",
  requirements_generate: "要件生成",
  requirements_polish_1: "要件磨き上げ1",
  requirements_polish_2: "要件磨き上げ2",
  requirements_audit_1: "要件監査1",
  requirements_audit_2: "要件監査2",
  specification_generate: "仕様書生成",
  specification_polish_1: "仕様書磨き上げ1",
  specification_polish_2: "仕様書磨き上げ2",
  specification_audit_1: "仕様書監査1",
  specification_audit_2: "仕様書監査2",
  specification_id_assign: "仕様書ID付与",
  conflict_check: "矛盾検出",
  spec_score: "仕様スコア",
  spec_test: "仕様テスト",
  spec_feedback: "仕様フィードバック",
  ui_navigation_diagram: "UI画面遷移図",
  export_spec: "仕様書エクスポート",
  devin_gate: "Devinゲート",
};

function formatElapsed(sec: number): string {
  if (sec <= 0) return "0秒";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}分${s}秒` : `${s}秒`;
}

export default function ProjectMonitorPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [report, setReport] = useState<RunReportResponse | null>(null);
  const [logs, setLogs] = useState<WorkflowLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [diagramSvg, setDiagramSvg] = useState<string>("");
  const [diagramLoading, setDiagramLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mermaidInitRef = useRef(false);

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

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/logs?limit=30`);
      if (!res.ok) return;
      const data = await res.json();
      setLogs(data.logs.reverse());
    } catch {
      // ignore log fetch errors
    }
  }, [projectId]);

  // Adaptive polling: fast when active, slow when idle
  useEffect(() => {
    fetchReport();
    fetchLogs();

    const isActive = report?.project.status === "running" || report?.project.status === "queued";
    const interval = isActive ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_IDLE;

    const id = setInterval(() => {
      fetchReport();
      fetchLogs();
    }, interval);
    return () => clearInterval(id);
  }, [fetchReport, fetchLogs, report?.project.status]);

  // Elapsed time counter for running state
  useEffect(() => {
    if (report?.project.status === "running" || report?.project.status === "queued") {
      if (report.totalRuntimeSec !== null) {
        setElapsedSec(report.totalRuntimeSec);
      }
      timerRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (report?.totalRuntimeSec !== null && report?.totalRuntimeSec !== undefined) {
        setElapsedSec(report.totalRuntimeSec);
      }
    }
  }, [report?.project.status, report?.totalRuntimeSec]);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // Fetch and render Mermaid diagram when awaiting_approval
  useEffect(() => {
    if (report?.project.status !== "awaiting_approval") {
      setDiagramSvg("");
      return;
    }
    if (diagramSvg || diagramLoading) return;

    setDiagramLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/artifacts/ui_navigation_diagram_mermaid`);
        if (!res.ok) return;
        const data = await res.json();
        const mermaidSource = data.content;
        if (!mermaidSource) return;

        // Dynamically load mermaid.js
        if (!mermaidInitRef.current) {
          const script = document.createElement("script");
          script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
          script.onload = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mermaid = (window as any).mermaid;
            mermaid.initialize({ startOnLoad: false, theme: "default" });
            mermaidInitRef.current = true;
            renderDiagram(mermaid, mermaidSource);
          };
          document.head.appendChild(script);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mermaid = (window as any).mermaid;
          renderDiagram(mermaid, mermaidSource);
        }
      } catch {
        // ignore
      } finally {
        setDiagramLoading(false);
      }
    })();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function renderDiagram(mermaid: any, source: string) {
      try {
        const { svg } = await mermaid.render("diagram-" + Date.now(), source);
        setDiagramSvg(svg);
      } catch {
        // If mermaid render fails, show the raw source
        setDiagramSvg(`<pre style="background:#f9fafb;padding:1rem;border-radius:8px;overflow:auto;font-size:0.85rem">${source}</pre>`);
      } finally {
        setDiagramLoading(false);
      }
    }
  }, [report?.project.status, projectId, diagramSvg, diagramLoading]);

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
      <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <Link href="/projects" style={{ color: "#0070f3", textDecoration: "none", fontSize: "0.85rem" }}>
            &larr; 案件一覧
          </Link>
          <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.5rem)", margin: "0.25rem 0 0" }}>{project.title}</h1>
        </div>
        <div className="status-row" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
          <span style={{ fontSize: "0.85rem", color: "#666" }}>フェーズ: {phase}</span>
        </div>
      </div>

      {/* Status Banner - Active Processing */}
      {(project.status === "queued" || project.status === "running") && (
        <div style={{
          padding: "1rem",
          background: project.status === "running" ? "#eff6ff" : "#fffbeb",
          border: `1px solid ${project.status === "running" ? "#bfdbfe" : "#fde68a"}`,
          borderRadius: "8px",
          marginBottom: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span className="spinner" style={{
              display: "inline-block",
              width: "20px",
              height: "20px",
              border: `3px solid ${project.status === "running" ? "#bfdbfe" : "#fde68a"}`,
              borderTopColor: project.status === "running" ? "#3b82f6" : "#f59e0b",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <span style={{ fontSize: "0.95rem", color: project.status === "running" ? "#1d4ed8" : "#92400e", fontWeight: 600 }}>
              {STATUS_MESSAGES[project.status]}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#999", marginLeft: "auto" }}>
              {formatElapsed(elapsedSec)} | 2秒ごとに自動更新中
            </span>
          </div>

          {/* Step progress bar with step labels */}
          {project.status === "running" && report.project.latestStepStatus && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1d4ed8" }}>
                  ステップ {report.project.latestStepStatus.stepOrder}/20: {STEP_LABELS[report.project.latestStepStatus.stepKey] ?? report.project.latestStepStatus.stepKey}
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1d4ed8" }}>{project.progressPercent}%</span>
              </div>
              <div style={{ height: "8px", background: "#dbeafe", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{
                  width: `${project.progressPercent}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                  borderRadius: "4px",
                  transition: "width 0.5s ease",
                  animation: "shimmer 1.5s ease-in-out infinite",
                }} />
              </div>
            </div>
          )}
        </div>
      )}

      {project.status === "awaiting_approval" && (
        <div style={{
          padding: "1rem",
          background: "#f5f3ff",
          border: "1px solid #c4b5fd",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ fontSize: "1.2rem" }}>&#9888;</span>
            <span style={{ fontSize: "0.9rem", color: "#5b21b6", fontWeight: 500 }}>
              {STATUS_MESSAGES[project.status]}
            </span>
          </div>
          {/* Mermaid Diagram Display */}
          <div style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            padding: "1.5rem",
            textAlign: "center",
            minHeight: "200px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {diagramLoading && (
              <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>図を読み込み中...</span>
            )}
            {diagramSvg && (
              <div
                dangerouslySetInnerHTML={{ __html: diagramSvg }}
                style={{ width: "100%", overflow: "auto" }}
              />
            )}
            {!diagramLoading && !diagramSvg && (
              <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>図を読み込めませんでした</span>
            )}
          </div>
        </div>
      )}

      {(project.status === "completed" || project.status === "ready_for_devin") && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "#f0fdf4",
          border: "1px solid #86efac",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}>
          <span style={{ fontSize: "1.2rem", color: "#22c55e" }}>&#10003;</span>
          <span style={{ fontSize: "0.9rem", color: "#166534", fontWeight: 500 }}>
            {STATUS_MESSAGES[project.status]}
          </span>
        </div>
      )}

      {project.status === "failed" && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem 1rem",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
          marginBottom: "1rem",
        }}>
          <span style={{ fontSize: "1.2rem", color: "#dc2626" }}>&#10007;</span>
          <span style={{ fontSize: "0.9rem", color: "#991b1b", fontWeight: 500 }}>
            {STATUS_MESSAGES[project.status]}
          </span>
        </div>
      )}

      {/* Real-time Activity Log */}
      {(project.status === "running" || project.status === "queued") && logs.length > 0 && (
        <div style={{
          marginBottom: "1rem",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          background: "#1e1e1e",
          maxHeight: "200px",
          overflow: "auto",
        }}>
          <div style={{ padding: "0.5rem 0.75rem", borderBottom: "1px solid #333", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s ease-in-out infinite" }} />
            <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>LIVE LOG</span>
          </div>
          <div style={{ padding: "0.5rem 0.75rem", fontFamily: "monospace", fontSize: "0.75rem" }}>
            {logs.map((log, i) => (
              <div key={i} style={{
                padding: "0.15rem 0",
                color: log.logLevel === "error" ? "#f87171" : log.logLevel === "warn" ? "#fbbf24" : "#d1d5db",
                borderBottom: "1px solid #2a2a2a",
              }}>
                <span style={{ color: "#6b7280", marginRight: "0.5rem" }}>
                  {new Date(log.createdAt).toLocaleTimeString("ja-JP")}
                </span>
                <span style={{ color: "#60a5fa", marginRight: "0.5rem" }}>[{log.source}]</span>
                {log.message}
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="button-row" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
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
      <div className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Progress Panel */}
        <div style={panelStyle}>
          <h3 style={headingStyle}>進捗</h3>
          <div style={{ marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.85rem" }}>ステップ {report.project.latestStepStatus?.stepOrder ?? "-"}/20</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{project.progressPercent}%</span>
            </div>
            <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "5px", overflow: "hidden" }}>
              <div style={{
                width: `${project.progressPercent}%`,
                height: "100%",
                background: project.status === "running" ? "linear-gradient(90deg, #3b82f6, #60a5fa)" : "#3b82f6",
                borderRadius: "5px",
                transition: "width 0.5s ease",
                ...(project.status === "running" ? { animation: "shimmer 1.5s ease-in-out infinite" } : {}),
              }} />
            </div>
          </div>
          {report.project.latestStepStatus && (
            <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.5rem 0 0" }}>
              現在: {STEP_LABELS[report.project.latestStepStatus.stepKey] ?? report.project.latestStepStatus.stepKey}
              <span style={{
                marginLeft: "0.5rem",
                padding: "0.1rem 0.4rem",
                borderRadius: "3px",
                fontSize: "0.75rem",
                background: report.project.latestStepStatus.status === "running" ? "#dbeafe" : report.project.latestStepStatus.status === "success" ? "#dcfce7" : "#fef3c7",
                color: report.project.latestStepStatus.status === "running" ? "#1d4ed8" : report.project.latestStepStatus.status === "success" ? "#166534" : "#92400e",
              }}>
                {report.project.latestStepStatus.status === "running" ? "実行中" : report.project.latestStepStatus.status === "success" ? "完了" : report.project.latestStepStatus.status}
              </span>
            </p>
          )}
          <p style={{ fontSize: "0.85rem", color: "#666", margin: "0.25rem 0 0" }}>
            実行時間: {formatElapsed(elapsedSec)}
          </p>
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
              <div className="score-categories" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem", fontSize: "0.8rem" }}>
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
        <div className="full-span" style={{ ...panelStyle, gridColumn: "1 / -1" }}>
          <h3 style={headingStyle}>成果物</h3>
          {artifactsSummary.length === 0 ? (
            <p style={{ color: "#999", fontSize: "0.85rem" }}>成果物はまだありません</p>
          ) : (
            <div className="artifact-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.5rem" }}>
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
        <div className="full-span" style={{ ...panelStyle, gridColumn: "1 / -1" }}>
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
