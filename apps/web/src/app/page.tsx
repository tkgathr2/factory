import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Specification Engine v35</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        Generate verified specification documents from rough requirements.
      </p>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link
          href="/projects"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "#0070f3",
            color: "#fff",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          View Projects
        </Link>
        <Link
          href="/projects/new"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            background: "#fff",
            color: "#0070f3",
            border: "2px solid #0070f3",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Create Project
        </Link>
      </div>
    </main>
  );
}
