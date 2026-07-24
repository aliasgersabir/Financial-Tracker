"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import { MessageCircle, Send, Bot, User, Lightbulb } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  suggestions?: string[]
  data?: Record<string, unknown>
  timestamp: Date
}

const QUICK_QUESTIONS = [
  "How can I save money?",
  "What caused expenses to increase?",
  "Which subscriptions can I cancel?",
  "When will I reach my savings goal?",
  "Which category should I reduce?",
]

export default function AssistantPage() {
  const { status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      window.location.href = "/login"
    } else {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || sending) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: question.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setSending(true)

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      })
      const data = await res.json()

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.answer || "I couldn't generate a response.",
        suggestions: data.suggestions || [],
        data: data.data || {},
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <div
          style={{
            height: "24px",
            width: "24px",
            animation: "spin 1s linear infinite",
            borderRadius: "9999px",
            border: "2px solid #E5E7EB",
            borderTopColor: "#2563EB",
          }}
        />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        input::placeholder { color: #9CA3AF; }
        input:focus { outline: none; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 128px)", gap: "0" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em", margin: 0 }}>
            Financial Assistant
          </h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>
            Ask anything about your finances
          </p>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            borderRadius: "20px",
            background: "white",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  padding: "48px 24px",
                }}
              >
                <div
                  style={{
                    height: "72px",
                    width: "72px",
                    borderRadius: "9999px",
                    background: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MessageCircle style={{ height: "32px", width: "32px", color: "#2563EB" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: "18px", fontWeight: 600, color: "#111111", margin: 0 }}>
                    How can I help you today?
                  </p>
                  <p style={{ fontSize: "14px", color: "#9CA3AF", marginTop: "8px", maxWidth: "400px" }}>
                    Ask me about your spending patterns, savings goals, budgets, or anything else related to your finances.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    animation: "fadeIn 0.3s ease",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      height: "32px",
                      width: "32px",
                      borderRadius: "9999px",
                      background: msg.role === "user" ? "#111111" : "#EFF6FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {msg.role === "user" ? (
                      <User style={{ height: "16px", width: "16px", color: "white" }} />
                    ) : (
                      <Bot style={{ height: "16px", width: "16px", color: "#2563EB" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "14px",
                        lineHeight: "1.6",
                        color: "#111111",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {msg.content}
                    </div>
                    {msg.data && Object.keys(msg.data).length > 0 && (
                      <div
                        style={{
                          marginTop: "12px",
                          padding: "12px 16px",
                          borderRadius: "12px",
                          background: "#F9FAFB",
                          border: "1px solid #F3F4F6",
                        }}
                      >
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", margin: "0 0 8px 0", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                          Data Summary
                        </p>
                        {Object.entries(msg.data).map(([key, value]) => (
                          <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                            <span style={{ fontSize: "13px", color: "#6B7280" }}>
                              {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: 500, color: "#111111" }}>
                              {typeof value === "number" ? value.toFixed(2) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.suggestions && msg.suggestions.length > 0 && (
                      <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Lightbulb style={{ height: "14px", width: "14px", color: "#F59E0B" }} />
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                            Suggestions
                          </span>
                        </div>
                        {msg.suggestions.map((s, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "10px 14px",
                              borderRadius: "10px",
                              background: "#FFFBEB",
                              border: "1px solid #FEF3C7",
                              fontSize: "13px",
                              color: "#92400E",
                              lineHeight: "1.5",
                            }}
                          >
                            {s}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div
                  style={{
                    height: "32px",
                    width: "32px",
                    borderRadius: "9999px",
                    background: "#EFF6FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Bot style={{ height: "16px", width: "16px", color: "#2563EB" }} />
                </div>
                <div style={{ display: "flex", gap: "4px", padding: "12px 16px", background: "#F9FAFB", borderRadius: "12px" }}>
                  <div style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "#9CA3AF", animation: "fadeIn 0.6s ease infinite" }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "#9CA3AF", animation: "fadeIn 0.6s ease 0.2s infinite" }} />
                  <div style={{ width: "6px", height: "6px", borderRadius: "9999px", background: "#9CA3AF", animation: "fadeIn 0.6s ease 0.4s infinite" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={{ borderTop: "1px solid #F3F4F6", padding: "16px 24px" }}>
            {messages.length === 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "9999px",
                      border: "1px solid #E5E7EB",
                      background: "white",
                      fontSize: "13px",
                      color: "#6B7280",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap" as const,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#2563EB"
                      e.currentTarget.style.color = "#2563EB"
                      e.currentTarget.style.background = "#EFF6FF"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#E5E7EB"
                      e.currentTarget.style.color = "#6B7280"
                      e.currentTarget.style.background = "white"
                    }}
                  >
                    <Lightbulb style={{ height: "12px", width: "12px" }} />
                    {q}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your finances..."
                disabled={sending}
                style={{
                  flex: 1,
                  height: "48px",
                  borderRadius: "14px",
                  border: "1px solid #E5E7EB",
                  background: "#F9FAFB",
                  padding: "0 20px",
                  fontSize: "14px",
                  color: "#111111",
                  transition: "all 0.15s",
                  boxSizing: "border-box" as const,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#2563EB"
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.08)"
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E5E7EB"
                  e.currentTarget.style.boxShadow = "none"
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                style={{
                  height: "48px",
                  width: "48px",
                  borderRadius: "14px",
                  border: "none",
                  background: input.trim() && !sending ? "#2563EB" : "#E5E7EB",
                  color: input.trim() && !sending ? "white" : "#9CA3AF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: input.trim() && !sending ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (input.trim() && !sending) {
                    e.currentTarget.style.background = "#1D4ED8"
                  }
                }}
                onMouseLeave={(e) => {
                  if (input.trim() && !sending) {
                    e.currentTarget.style.background = "#2563EB"
                  }
                }}
              >
                <Send style={{ height: "18px", width: "18px" }} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
