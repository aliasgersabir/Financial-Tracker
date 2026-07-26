"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Plus, Play, Pause, Pencil, Trash2, Calendar } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { formatCurrency } from "@/lib/utils"

interface RecurringRule {
  id: string
  amount: number
  description: string
  type: string
  frequency: string
  interval: number
  startDate: string
  endDate: string | null
  nextRunDate: string
  lastRunDate: string | null
  isActive: boolean
  account: { id: string; name: string; color: string }
  category: { id: string; name: string; icon: string; color: string } | null
}

interface Account { id: string; name: string; color: string }
interface Category { id: string; name: string; type: string; icon: string; color: string }

const frequencyLabels: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
}

export default function RecurringPage() {
  const { status } = useSession()
  const [rules, setRules] = useState<RecurringRule[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null)
  const [addBtnHovered, setAddBtnHovered] = useState(false)
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false)
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [upcoming, setUpcoming] = useState<RecurringRule[]>([])
  const [isMobile, setIsMobile] = useState(false)

  const [form, setForm] = useState({
    accountId: "",
    categoryId: "",
    amount: "",
    description: "",
    type: "expense",
    frequency: "monthly",
    interval: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  })

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") {
      fetchRules()
      fetchAccounts()
      fetchCategories()
      fetchUpcoming()
    }
  }, [status])

  const fetchRules = async () => {
    const res = await fetch("/api/recurring")
    const data = await res.json()
    setRules(data)
    setLoading(false)
  }

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts")
    const data = await res.json()
    setAccounts(data)
    if (data.length > 0 && !form.accountId) setForm((f) => ({ ...f, accountId: data[0].id }))
  }

  const fetchCategories = async () => {
    const res = await fetch("/api/categories")
    const data = await res.json()
    setCategories(data)
  }

  const fetchUpcoming = async () => {
    const res = await fetch("/api/recurring/upcoming?days=30")
    const data = await res.json()
    setUpcoming(data.slice(0, 5))
  }

  const filteredRules = rules.filter((r) => {
    if (filter === "active") return r.isActive
    if (filter === "paused") return !r.isActive
    return true
  })

  const filteredCategories = categories.filter((c) => c.type === form.type)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      interval: parseInt(form.interval),
      categoryId: form.categoryId || undefined,
      endDate: form.endDate || undefined,
    }

    if (editingRule) {
      await fetch(`/api/recurring/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    }

    setModalOpen(false)
    setEditingRule(null)
    resetForm()
    fetchRules()
    fetchUpcoming()
  }

  const resetForm = () => {
    setForm({
      accountId: accounts[0]?.id || "",
      categoryId: "",
      amount: "",
      description: "",
      type: "expense",
      frequency: "monthly",
      interval: "1",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
    })
  }

  const toggleActive = async (rule: RecurringRule) => {
    await fetch(`/api/recurring/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    })
    fetchRules()
    fetchUpcoming()
  }

  const runNow = async (rule: RecurringRule) => {
    await fetch(`/api/recurring/${rule.id}/run`, { method: "POST" })
    fetchRules()
    fetchUpcoming()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this recurring rule?")) return
    await fetch(`/api/recurring/${id}`, { method: "DELETE" })
    fetchRules()
    fetchUpcoming()
  }

  const openEdit = (rule: RecurringRule) => {
    setEditingRule(rule)
    setForm({
      accountId: rule.account.id,
      categoryId: rule.category?.id || "",
      amount: rule.amount.toString(),
      description: rule.description,
      type: rule.type,
      frequency: rule.frequency,
      interval: rule.interval.toString(),
      startDate: rule.startDate.split("T")[0],
      endDate: rule.endDate ? rule.endDate.split("T")[0] : "",
    })
    setModalOpen(true)
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })



  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "24px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? "12px" : "0" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Recurring Transactions</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Automate your regular income and expenses</p>
        </div>
        <button
          onClick={() => { resetForm(); setEditingRule(null); setModalOpen(true) }}
          onMouseEnter={() => setAddBtnHovered(true)}
          onMouseLeave={() => setAddBtnHovered(false)}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: "8px",
            borderRadius: "9999px", background: addBtnHovered ? "#1D4ED8" : "#2563EB",
            padding: "10px 20px", fontSize: "14px", fontWeight: 500, color: "white",
            transition: "all 150ms ease", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", cursor: "pointer",
          }}
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          Add Rule
        </button>
      </div>

      <div style={{ display: "flex", gap: "6px", background: "white", borderRadius: "9999px", padding: "4px", border: "1px solid #E5E7EB", width: "fit-content" }}>
        {(["all", "active", "paused"] as const).map((f) => {
          const isActive = filter === f
          const isHovered = hoveredFilter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              onMouseEnter={() => setHoveredFilter(f)}
              onMouseLeave={() => setHoveredFilter(null)}
              style={{
                borderRadius: "9999px", padding: isMobile ? "6px 12px" : "6px 16px", fontSize: "13px", fontWeight: 500,
                transition: "all 150ms ease", cursor: "pointer",
                background: isActive ? "#111111" : "transparent",
                color: isActive ? "white" : isHovered ? "#111111" : "#6B7280",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          )
        })}
      </div>

      {filteredRules.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredRules.map((rule) => (
            <div
              key={rule.id}
              onMouseEnter={() => setHoveredCard(rule.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: isMobile ? "stretch" : "space-between",
                borderRadius: "16px", background: "white", padding: isMobile ? "16px" : "16px 20px",
                boxShadow: hoveredCard === rule.id ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 200ms ease", opacity: rule.isActive ? 1 : 0.6, gap: isMobile ? "12px" : "0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
                <div style={{
                  width: "40px", height: "40px", borderRadius: "10px",
                  background: rule.category ? rule.category.color + "15" : rule.account.color + "15",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
                }}>
                  {rule.category?.icon || "🔄"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{rule.description}</span>
                    <span style={{
                      fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "9999px",
                      background: rule.type === "income" ? "#F0FDF4" : "#FEF2F2",
                      color: rule.type === "income" ? "#16A34A" : "#DC2626",
                    }}>
                      {rule.type}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{frequencyLabels[rule.frequency]}{rule.interval > 1 ? ` (every ${rule.interval})` : ""}</span>
                    <span style={{ fontSize: "12px", color: "#D1D5DB" }}>·</span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{rule.account.name}</span>
                    {rule.category && (
                      <>
                        <span style={{ fontSize: "12px", color: "#D1D5DB" }}>·</span>
                        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{rule.category.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: isMobile ? "space-between" : "flex-end" }}>
                <div style={{ textAlign: isMobile ? "left" : "right" }}>
                  <span style={{ fontSize: "16px", fontWeight: 600, color: rule.type === "income" ? "#16A34A" : "#DC2626" }}>
                    {rule.type === "income" ? "+" : "-"}{formatCurrency(rule.amount)}
                  </span>
                  <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
                    Next: {formatDate(rule.nextRunDate)}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "16px" }}>
                  <button
                    onClick={() => toggleActive(rule)}
                    style={{
                      width: "44px", height: "24px", borderRadius: "12px", border: "none", cursor: "pointer",
                      background: rule.isActive ? "#2563EB" : "#E5E7EB",
                      position: "relative", transition: "background 200ms ease",
                    }}
                  >
                    <div style={{
                      width: "20px", height: "20px", borderRadius: "9999px", background: "white",
                      position: "absolute", top: "2px",
                      left: rule.isActive ? "22px" : "2px",
                      transition: "left 200ms ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                    }} />
                  </button>

                  {!isMobile && (
                    <>
                      <button
                        onClick={() => runNow(rule)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #E5E7EB",
                          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 150ms ease",
                        }}
                        title="Run now"
                      >
                        <Play style={{ width: "14px", height: "14px", color: "#2563EB" }} />
                      </button>

                      <button
                        onClick={() => openEdit(rule)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #E5E7EB",
                          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 150ms ease",
                        }}
                        title="Edit"
                      >
                        <Pencil style={{ width: "14px", height: "14px", color: "#6B7280" }} />
                      </button>

                      <button
                        onClick={() => handleDelete(rule.id)}
                        style={{
                          width: "32px", height: "32px", borderRadius: "8px", border: "1px solid #E5E7EB",
                          background: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", transition: "all 150ms ease",
                        }}
                        title="Delete"
                      >
                        <Trash2 style={{ width: "14px", height: "14px", color: "#DC2626" }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "40px 0" : "80px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>🔄</span>
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No recurring rules</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>Set up automated transactions to save time</p>
          <button
            onClick={() => { resetForm(); setEditingRule(null); setModalOpen(true) }}
            onMouseEnter={() => setAddBtnHovered(true)}
            onMouseLeave={() => setAddBtnHovered(false)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              borderRadius: "9999px", background: addBtnHovered ? "#1D4ED8" : "#2563EB",
              padding: "10px 20px", fontSize: "14px", fontWeight: 500, color: "white",
              transition: "all 150ms ease", cursor: "pointer",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Add Rule
          </button>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Calendar style={{ width: "16px", height: "16px", color: "#9CA3AF" }} />
            <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Upcoming (Next 30 Days)
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: isMobile ? "8px" : "10px" }}>
            {upcoming.map((rule) => (
              <div key={rule.id} style={{ borderRadius: "14px", background: "white", padding: isMobile ? "12px" : "14px", border: "1px solid #F3F4F6" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rule.description}</p>
                <p style={{ fontSize: "15px", fontWeight: 600, color: rule.type === "income" ? "#16A34A" : "#DC2626", marginBottom: "6px" }}>
                  {rule.type === "income" ? "+" : "-"}{formatCurrency(rule.amount)}
                </p>
                <p style={{ fontSize: "11px", color: "#9CA3AF" }}>{formatDate(rule.nextRunDate)}</p>
                <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{rule.account.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRule(null) }}
        title={editingRule ? "Edit Rule" : "Add Recurring Rule"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px", fontSize: "14px", color: "#111111",
                outline: "none", transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
              placeholder="e.g. Netflix subscription"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none",
                }}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {["expense", "income"].map((t) => {
                  const active = form.type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t, categoryId: "" })}
                      style={{
                        borderRadius: "12px", padding: "10px", fontSize: "13px", fontWeight: 500,
                        transition: "all 150ms ease", cursor: "pointer",
                        border: active ? (t === "income" ? "1px solid #16A34A" : "1px solid #DC2626") : "1px solid #E5E7EB",
                        background: active ? (t === "income" ? "#F0FDF4" : "#FEF2F2") : "transparent",
                        color: active ? (t === "income" ? "#16A34A" : "#DC2626") : "#6B7280",
                      }}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Account</label>
              <select
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none",
                  appearance: "auto" as const,
                }}
                required
              >
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none",
                  appearance: "auto" as const,
                }}
              >
                <option value="">None</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none",
                  appearance: "auto" as const,
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Interval</label>
              <input
                type="number"
                min="1"
                value={form.interval}
                onChange={(e) => setForm({ ...form, interval: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none",
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none",
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>End Date <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span></label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingRule(null) }}
              onMouseEnter={() => setCancelBtnHovered(true)}
              onMouseLeave={() => setCancelBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px", border: "1px solid #E5E7EB",
                background: cancelBtnHovered ? "#F9FAFB" : "white", fontSize: "14px", fontWeight: 500,
                color: "#111111", transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onMouseEnter={() => setSubmitBtnHovered(true)}
              onMouseLeave={() => setSubmitBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                background: submitBtnHovered ? "#1D4ED8" : "#2563EB", color: "white",
                fontSize: "14px", fontWeight: 500, transition: "all 150ms ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)", cursor: "pointer",
              }}
            >
              {editingRule ? "Save Changes" : "Add Rule"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
