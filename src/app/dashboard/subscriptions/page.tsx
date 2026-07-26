"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { CreditCard, RefreshCw, Calendar, Plus, Search } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface Subscription {
  id: string
  name: string
  amount: number
  frequency: string
  nextRenewal: string
  color: string
  active: boolean
  createdAt: string
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function SubscriptionsPage() {
  const { status } = useSession()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [search, setSearch] = useState("")
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "monthly",
    nextRenewal: "",
    color: "#2563EB",
  })

  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoverAdd, setHoverAdd] = useState(false)
  const [hoverDetect, setHoverDetect] = useState(false)
  const [hoverEdit, setHoverEdit] = useState<string | null>(null)
  const [hoverDelete, setHoverDelete] = useState<string | null>(null)
  const [hoverCancel, setHoverCancel] = useState(false)
  const [hoverSubmit, setHoverSubmit] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") fetchSubscriptions()
  }, [status])

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/subscriptions")
      const data = await res.json()
      setSubscriptions(Array.isArray(data) ? data : data.subscriptions || [])
    } catch {
      console.error("Failed to fetch subscriptions")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingSub ? `/api/subscriptions/${editingSub.id}` : "/api/subscriptions"
    const method = editingSub ? "PUT" : "POST"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
      }),
    })

    setModalOpen(false)
    setEditingSub(null)
    setForm({ name: "", amount: "", frequency: "monthly", nextRenewal: "", color: "#2563EB" })
    fetchSubscriptions()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subscription?")) return
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" })
    fetchSubscriptions()
  }

  const handleDetect = async () => {
    setDetecting(true)
    try {
      await fetch("/api/subscriptions/detect", { method: "POST" })
      fetchSubscriptions()
    } catch {
      console.error("Failed to detect subscriptions")
    } finally {
      setDetecting(false)
    }
  }

  const openEdit = (sub: Subscription) => {
    setEditingSub(sub)
    setForm({
      name: sub.name,
      amount: sub.amount.toString(),
      frequency: sub.frequency,
      nextRenewal: sub.nextRenewal ? new Date(sub.nextRenewal).toISOString().split("T")[0] : "",
      color: sub.color || "#2563EB",
    })
    setModalOpen(true)
  }

  const getMonthlyEquivalent = (amount: number, frequency: string) => {
    switch (frequency) {
      case "weekly": return amount * 4.33
      case "biweekly": return amount * 2.17
      case "monthly": return amount
      case "quarterly": return amount / 3
      case "yearly": return amount / 12
      default: return amount
    }
  }

  const activeSubs = subscriptions.filter((s) => s.active)
  const filteredSubs = activeSubs.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalMonthly = activeSubs.reduce((sum, s) => sum + getMonthlyEquivalent(s.amount, s.frequency), 0)
  const totalAnnual = totalMonthly * 12

  const colors = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]

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
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? "12px" : "0" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Subscriptions</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Track and manage recurring payments</p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
          <button
            onClick={handleDetect}
            onMouseEnter={() => setHoverDetect(true)}
            onMouseLeave={() => setHoverDetect(false)}
            disabled={detecting}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px", flex: isMobile ? 1 : "none", justifyContent: "center",
              borderRadius: "9999px", padding: "10px 20px",
              background: hoverDetect ? "#F3F4F6" : "white",
              border: "1px solid #E5E7EB", fontSize: "14px", fontWeight: 500,
              color: "#6B7280", transition: "all 150ms ease", cursor: "pointer",
              opacity: detecting ? 0.6 : 1,
            }}
          >
            <RefreshCw style={{ width: "16px", height: "16px", animation: detecting ? "spin 1s linear infinite" : "none" }} />
            {detecting ? "Detecting..." : "Detect"}
          </button>
          <button
            onClick={() => { setEditingSub(null); setForm({ name: "", amount: "", frequency: "monthly", nextRenewal: "", color: "#2563EB" }); setModalOpen(true) }}
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px", flex: isMobile ? 1 : "none", justifyContent: "center",
              borderRadius: "9999px", padding: "10px 20px",
              background: hoverAdd ? "#1D4ED8" : "#2563EB",
              fontSize: "14px", fontWeight: 500, color: "white",
              transition: "all 150ms ease", cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Add
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: isMobile ? "12px" : "16px" }}>
        {[
          { label: "Total Monthly Cost", value: formatCurrency(totalMonthly), icon: CreditCard, iconBg: "#EFF6FF", iconColor: "#2563EB" },
          { label: "Total Annual Cost", value: formatCurrency(totalAnnual), icon: Calendar, iconBg: "#FEF3C7", iconColor: "#D97706" },
          { label: "Active Subscriptions", value: activeSubs.length.toString(), icon: RefreshCw, iconBg: "#F0FDF4", iconColor: "#16A34A" },
        ].map((card) => (
          <div
            key={card.label}
            style={{
              borderRadius: "20px", background: "white", padding: isMobile ? "16px" : "20px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "box-shadow 200ms",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "#6B7280" }}>{card.label}</span>
              <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: card.iconBg }}>
                <card.icon style={{ height: "18px", width: "18px", color: card.iconColor }} />
              </div>
            </div>
            <p style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 600, color: "#111111", letterSpacing: "-0.025em" }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", height: "16px", width: "16px", color: "#9CA3AF", pointerEvents: "none" }} />
        <input
          type="text"
          placeholder="Search subscriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            height: "40px", width: "100%", borderRadius: "9999px",
            border: "1px solid #E5E7EB", background: "white",
            paddingLeft: "40px", paddingRight: "16px", fontSize: "14px",
            color: "#111111", outline: "none", transition: "all 0.15s",
            boxSizing: "border-box" as const,
          }}
        />
      </div>

      {filteredSubs.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? "12px" : "16px" }}>
          {filteredSubs.map((sub) => {
            const isHovered = hoveredCard === sub.id
            const monthlyEq = getMonthlyEquivalent(sub.amount, sub.frequency)
            return (
              <div
                key={sub.id}
                onMouseEnter={() => setHoveredCard(sub.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: "white", borderRadius: "20px", padding: isMobile ? "16px" : "20px",
                  boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 200ms ease", display: "flex", flexDirection: "column", gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "10px", height: "10px", borderRadius: "9999px",
                      backgroundColor: sub.color || "#2563EB",
                    }} />
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>{sub.name}</p>
                      <p style={{ fontSize: "12px", color: "#9CA3AF", margin: "2px 0 0", textTransform: "capitalize" }}>{sub.frequency}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => openEdit(sub)}
                      onMouseEnter={() => setHoverEdit(sub.id)}
                      onMouseLeave={() => setHoverEdit(null)}
                      style={{
                        display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center",
                        borderRadius: "9999px", background: hoverEdit === sub.id ? "#F3F4F6" : "transparent",
                        border: "none", cursor: "pointer", transition: "all 150ms ease",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      onMouseEnter={() => setHoverDelete(sub.id)}
                      onMouseLeave={() => setHoverDelete(null)}
                      style={{
                        display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center",
                        borderRadius: "9999px", background: hoverDelete === sub.id ? "#FEF2F2" : "transparent",
                        border: "none", cursor: "pointer", transition: "all 150ms ease",
                      }}
                    >
                      <span style={{ fontSize: "12px", color: "#DC2626" }}>Del</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "#111111" }}>{formatCurrency(sub.amount)}</span>
                  <span style={{ fontSize: "13px", color: "#9CA3AF" }}>/{sub.frequency}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                  <div>
                    <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly Equivalent</p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "#6B7280", margin: "2px 0 0" }}>{formatCurrency(monthlyEq)}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Next Renewal</p>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#6B7280", margin: "2px 0 0" }}>
                      {sub.nextRenewal ? new Date(sub.nextRenewal).toLocaleDateString() : "—"}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "40px 16px" : "80px 0", background: "white", borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
          }}>
            <CreditCard style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>
            {search ? "No matching subscriptions" : "No subscriptions yet"}
          </p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>
            {search ? "Try a different search term" : "Add your first subscription to track recurring payments"}
          </p>
          {!search && (
            <button
              onClick={() => { setEditingSub(null); setForm({ name: "", amount: "", frequency: "monthly", nextRenewal: "", color: "#2563EB" }); setModalOpen(true) }}
              onMouseEnter={() => setHoverAdd(true)}
              onMouseLeave={() => setHoverAdd(false)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                borderRadius: "9999px", padding: "10px 20px",
                background: hoverAdd ? "#1D4ED8" : "#2563EB",
                fontSize: "14px", fontWeight: 500, color: "white",
                transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              <Plus style={{ width: "16px", height: "16px" }} />
              Add Subscription
            </button>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingSub(null) }}
        title={editingSub ? "Edit Subscription" : "Add Subscription"}
      >
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Netflix"
              required
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px", fontSize: "14px",
                color: "#111111", outline: "none", transition: "all 150ms ease",
                boxSizing: "border-box" as const,
              }}
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
                placeholder="0.00"
                min="0.01"
                required
                style={{
                  height: "44px", width: "100%", borderRadius: "12px",
                  border: "1px solid #E5E7EB", background: "white",
                  padding: "0 14px", fontSize: "14px", color: "#111111",
                  outline: "none", boxSizing: "border-box" as const,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px",
                  border: "1px solid #E5E7EB", background: "white",
                  padding: "0 14px", fontSize: "14px", color: "#111111",
                  outline: "none", cursor: "pointer", boxSizing: "border-box" as const,
                }}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Next Renewal</label>
            <input
              type="date"
              value={form.nextRenewal}
              onChange={(e) => setForm({ ...form, nextRenewal: e.target.value })}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: "1px solid #E5E7EB", background: "white",
                padding: "0 14px", fontSize: "14px", color: "#111111",
                outline: "none", boxSizing: "border-box" as const,
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Color</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {colors.map((color) => {
                const isSelected = form.color === color
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    style={{
                      width: "32px", height: "32px", borderRadius: "9999px",
                      backgroundColor: color, cursor: "pointer", transition: "all 150ms ease",
                      boxShadow: isSelected ? "0 0 0 2px white, 0 0 0 4px #111111" : "none",
                      transform: isSelected ? "scale(1.1)" : "scale(1)",
                      border: "none",
                    }}
                  />
                )
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditingSub(null) }}
              onMouseEnter={() => setHoverCancel(true)}
              onMouseLeave={() => setHoverCancel(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB", background: hoverCancel ? "#F9FAFB" : "white",
                fontSize: "14px", fontWeight: 500, color: "#111111",
                transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onMouseEnter={() => setHoverSubmit(true)}
              onMouseLeave={() => setHoverSubmit(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                background: hoverSubmit ? "#1D4ED8" : "#2563EB",
                color: "white", fontSize: "14px", fontWeight: 500,
                transition: "all 150ms ease", cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)", border: "none",
              }}
            >
              {editingSub ? "Save Changes" : "Add Subscription"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
