"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CreateProjectRequest, CommonFeatureResponse, CommonFeatureListResponse } from "@spec-engine/shared";

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [rawRequirements, setRawRequirements] = useState("");
  const [goal, setGoal] = useState("");
  const [problem, setProblem] = useState("");
  const [targetUsers, setTargetUsers] = useState("");
  const [commonFeatures, setCommonFeatures] = useState<CommonFeatureResponse[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadFeatures() {
      try {
        const res = await fetch("/api/common-features");
        const data: CommonFeatureListResponse = await res.json();
        setCommonFeatures(data.commonFeatures);
        setSelectedFeatures(
          data.commonFeatures.filter((f) => f.defaultEnabled).map((f) => f.id),
        );
      } catch {
        // Ignore - common features are optional
      }
    }
    loadFeatures();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const body: CreateProjectRequest = {
        title,
        rawRequirements,
        goal: goal || null,
        problem: problem || null,
        targetUsers: targetUsers || null,
        commonFeatureIds: selectedFeatures.length > 0 ? selectedFeatures : null,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create project");
      }

      const data = await res.json();
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    fontSize: "0.9rem",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    marginBottom: "0.25rem",
    fontSize: "0.9rem",
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "700px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>New Project</h1>

      {error && (
        <div style={{ padding: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", marginBottom: "1rem", color: "#dc2626" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input
            style={inputStyle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project title"
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Raw Requirements *</label>
          <textarea
            style={{ ...inputStyle, minHeight: "150px", resize: "vertical" }}
            value={rawRequirements}
            onChange={(e) => setRawRequirements(e.target.value)}
            placeholder="Describe what you want to build..."
            required
          />
        </div>

        <div>
          <label style={labelStyle}>Goal</label>
          <input
            style={inputStyle}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What is the goal of this project?"
          />
        </div>

        <div>
          <label style={labelStyle}>Problem</label>
          <input
            style={inputStyle}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="What problem does this solve?"
          />
        </div>

        <div>
          <label style={labelStyle}>Target Users</label>
          <input
            style={inputStyle}
            value={targetUsers}
            onChange={(e) => setTargetUsers(e.target.value)}
            placeholder="Who will use this?"
          />
        </div>

        {commonFeatures.length > 0 && (
          <div>
            <label style={labelStyle}>Common Features</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {commonFeatures.map((f) => (
                <label key={f.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={selectedFeatures.includes(f.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFeatures([...selectedFeatures, f.id]);
                      } else {
                        setSelectedFeatures(selectedFeatures.filter((id) => id !== f.id));
                      }
                    }}
                  />
                  <span>{f.name}</span>
                  <span style={{ color: "#999", fontSize: "0.8rem" }}>- {f.description}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !title || !rawRequirements}
          style={{
            padding: "0.75rem 1.5rem",
            background: submitting ? "#93c5fd" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Creating..." : "Create Project"}
        </button>
      </form>
    </main>
  );
}
