"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ListProjectsResponse, ProjectListItem } from "@spec-engine/shared";

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/projects");
        const data: ListProjectsResponse = await res.json();
        setProjects(data.projects);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>案件一覧</h1>
        <Link
          href="/projects/new"
          style={{
            padding: "0.5rem 1rem",
            background: "#0070f3",
            color: "#fff",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          + 新規作成
        </Link>
      </div>

      {loading ? (
        <p>読み込み中...</p>
      ) : projects.length === 0 ? (
        <p style={{ color: "#666" }}>案件がありません。新規作成してください。</p>
      ) : (
        <div className="table-wrapper">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
              <th style={{ padding: "0.75rem 0.5rem" }}>コード</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>タイトル</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>ステータス</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>進捗</th>
              <th style={{ padding: "0.75rem 0.5rem" }}>ループ</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <Link href={`/projects/${p.id}`} style={{ color: "#0070f3", textDecoration: "none" }}>
                    {p.projectCode}
                  </Link>
                </td>
                <td style={{ padding: "0.75rem 0.5rem" }}>{p.title}</td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: "#fff",
                      background: STATUS_COLORS[p.status] ?? "#999",
                    }}
                  >
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: "0.75rem 0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ flex: 1, height: "8px", background: "#e5e7eb", borderRadius: "4px" }}>
                      <div
                        style={{
                          width: `${p.progressPercent}%`,
                          height: "100%",
                          background: "#3b82f6",
                          borderRadius: "4px",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: "0.8rem", color: "#666" }}>{p.progressPercent}%</span>
                  </div>
                </td>
                <td style={{ padding: "0.75rem 0.5rem", color: "#666" }}>{p.loopCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}
