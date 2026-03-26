"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectTitle, setProjectTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    async function loadChat() {
      try {
        // Load project info
        const projRes = await fetch(`/api/projects/${projectId}`);
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjectTitle(projData.project.title);
        }

        // Load chat history
        const res = await fetch(`/api/projects/${projectId}/chat`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);

          // If no messages yet, send initial greeting
          if (data.messages.length === 0) {
            const initRes = await fetch(`/api/projects/${projectId}/chat`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: "要件の深掘りをお願いします" }),
            });
            if (initRes.ok) {
              const initData = await initRes.json();
              setMessages(initData.messages);
            }
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadChat();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    setInput("");
    setSending(true);

    // Optimistic: add user message immediately
    const tempUserMsg: ChatMessage = {
      id: "temp-" + Date.now(),
      role: "user",
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  async function handleSaveTitle() {
    if (!titleDraft.trim() || titleSaving) return;
    setTitleSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleDraft.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjectTitle(data.project.title);
        setEditingTitle(false);
      }
    } catch {
      // ignore
    } finally {
      setTitleSaving(false);
    }
  }

  async function handleStartWorkflow() {
    try {
      await fetch(`/api/projects/${projectId}/start`, { method: "POST" });
      router.push(`/projects/${projectId}`);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
        読み込み中...
      </main>
    );
  }

  const hasEnoughContext = messages.filter((m) => m.role === "user").length >= 3;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      minHeight: "-webkit-fill-available",
      fontFamily: "system-ui, sans-serif",
      background: "#f9fafb",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "0.75rem 1.5rem",
        background: "#fff",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link href="/projects" style={{ color: "#0070f3", textDecoration: "none", fontSize: "0.85rem" }}>
            &larr; 案件一覧
          </Link>
          {editingTitle ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <input
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                autoFocus
                style={{ fontSize: "1rem", fontWeight: 700, border: "1px solid #d1d5db", borderRadius: "4px", padding: "0.2rem 0.4rem", width: "200px" }}
              />
              <button onClick={handleSaveTitle} disabled={titleSaving}
                style={{ padding: "0.2rem 0.5rem", background: "#22c55e", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600 }}>
                {titleSaving ? "..." : "保存"}
              </button>
              <button onClick={() => setEditingTitle(false)}
                style={{ padding: "0.2rem 0.5rem", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem" }}>
                ×
              </button>
            </div>
          ) : (
            <h1
              onClick={() => { setTitleDraft(projectTitle || "要件ヒアリング"); setEditingTitle(true); }}
              title="クリックでタイトルを編集"
              style={{ fontSize: "1.1rem", margin: 0, cursor: "pointer", borderBottom: "1px dashed #d1d5db", paddingBottom: "1px" }}
            >
              {projectTitle || "要件ヒアリング"}
            </h1>
          )}
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {hasEnoughContext && (
            <button
              onClick={handleStartWorkflow}
              style={{
                padding: "0.5rem 1rem",
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              仕様書生成を開始
            </button>
          )}
          <Link
            href={`/projects/${projectId}`}
            style={{
              padding: "0.5rem 1rem",
              background: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              textDecoration: "none",
              fontSize: "0.85rem",
            }}
          >
            監視画面へ
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "70%",
                padding: "0.75rem 1rem",
                borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role === "user" ? "#0070f3" : "#fff",
                color: msg.role === "user" ? "#fff" : "#1f2937",
                border: msg.role === "user" ? "none" : "1px solid #e5e7eb",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              {msg.role === "assistant" && (
                <div style={{
                  fontSize: "0.75rem",
                  color: "#6b7280",
                  marginBottom: "0.25rem",
                  fontWeight: 600,
                }}>
                  工場長 AI
                </div>
              )}
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "0.75rem 1rem",
              borderRadius: "16px 16px 16px 4px",
              background: "#fff",
              border: "1px solid #e5e7eb",
              color: "#9ca3af",
              fontSize: "0.9rem",
            }}>
              <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>考え中...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{
        padding: "1rem 1.5rem",
        background: "#fff",
        borderTop: "1px solid #e5e7eb",
        flexShrink: 0,
        zIndex: 10,
      }}>
        {hasEnoughContext && (
          <div style={{
            padding: "0.5rem 0.75rem",
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderRadius: "6px",
            marginBottom: "0.75rem",
            fontSize: "0.85rem",
            color: "#166534",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span>要件が整理できました。仕様書の生成を開始できます。</span>
            <button
              onClick={handleStartWorkflow}
              style={{
                padding: "0.4rem 0.75rem",
                background: "#22c55e",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              仕様書生成を開始
            </button>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="メッセージを入力..."
            rows={2}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "0.9rem",
              resize: "none",
              fontFamily: "system-ui, sans-serif",
              outline: "none",
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{
              padding: "0.75rem 1.25rem",
              background: sending || !input.trim() ? "#93c5fd" : "#0070f3",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: sending || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              alignSelf: "flex-end",
            }}
          >
            送信
          </button>
        </div>
        <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: "0.5rem 0 0" }}>
          Enter で送信 / Shift+Enter で改行
        </p>
      </div>
    </div>
  );
}
