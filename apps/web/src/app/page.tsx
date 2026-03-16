"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [railwayUrl, setRailwayUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("railway_url");
    if (stored) setRailwayUrl(stored);
  }, []);

  function handleSave() {
    localStorage.setItem("railway_url", railwayUrl);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2rem)", marginBottom: "0.5rem" }}>要件定義・仕様書生成システム【工場長】</h1>
      <p style={{ color: "#666", marginBottom: "2rem", fontSize: "clamp(0.9rem, 2.5vw, 1rem)" }}>
        ラフな要件から検証済み仕様書を自動生成します。
      </p>
      <div className="button-row" style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <Link
          href="/projects"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.75rem 1.5rem",
            background: "#0070f3",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            minHeight: "44px",
          }}
        >
          案件一覧
        </Link>
        <Link
          href="/projects/new"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0.75rem 1.5rem",
            background: "#fff",
            color: "#0070f3",
            border: "2px solid #0070f3",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
            minHeight: "44px",
          }}
        >
          新規作成
        </Link>
      </div>

      <section style={{
        padding: "1.5rem",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
      }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, marginTop: 0, marginBottom: "0.75rem" }}>
          Railway 設定
        </h2>
        <label style={{ display: "block", fontSize: "0.85rem", color: "#555", marginBottom: "0.25rem" }}>
          デプロイ先 URL
        </label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="url"
            value={railwayUrl}
            onChange={(e) => setRailwayUrl(e.target.value)}
            placeholder="https://s-factory.up.railway.app"
            style={{
              flex: 1,
              padding: "0.5rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.9rem",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={handleSave}
            style={{
              padding: "0.5rem 1rem",
              background: saved ? "#22c55e" : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              minHeight: "44px",
            }}
          >
            {saved ? "保存済み" : "保存"}
          </button>
        </div>
        {railwayUrl && (
          <p style={{ fontSize: "0.8rem", color: "#666", marginTop: "0.5rem", marginBottom: 0 }}>
            現在のURL:{" "}
            <a href={railwayUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0070f3" }}>
              {railwayUrl}
            </a>
          </p>
        )}
      </section>
    </main>
  );
}
