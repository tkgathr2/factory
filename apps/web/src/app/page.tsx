import Link from "next/link";

export default function Home() {
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
    </main>
  );
}
