"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Plus, Trash2, ArrowLeft, Target } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { formatCurrency } from "@/lib/utils"

interface GoalContribution {
  id: string
  amount: number
  date: string
  notes?: string
}

interface Goal {
  id: string
  name: string
  targetAmount: number
  currentSaved: number
  deadline?: string
  monthlyTarget?: number
  notes?: string
  icon: string
  color: string
  status: string
  contributions?: GoalContribution[]
  _count?: { contributions: number }
  createdAt: string
}

interface Overview {
  totalSaved: number
  totalTarget: number
  activeGoals: number
  completedGoals: number
  goals: {
    id: string
    name: string
    target: number
    current: number
    percentage: number
    estimatedCompletion: string | null
  }[]
}

const goalIcons = [
  "🎯", "🏠", "🚗", "✈️", "💻", "🎓", "🏥",
  "🌍", "🏖️", "🏕️", "🏔️", "🗺️", "🛳️", "🚂",
  "🏡", "🔑", "🏗️", "🛋️", "🔧", "🔨",
  "🚌", "⛽", "🏍️", "🚲", "🛻", "⛵",
  "📚", "🔬", "🧪", "📝", "🎒",
  "💪", "🏋️", "🧘", "🏃", "⚽", "🏀", "🎾",
  "🍎", "🍕", "🍔", "☕", "🍰", "🥗", "🍳",
  "🛒", "🛍️", "👗", "👔", "👟", "💎",
  "🐶", "🐱", "🐰", "🐾", "🐠", "🐦",
  "👨‍👩‍👧", "👶", "💒", "🎉", "🎂", "🎁",
  "💼", "📈", "🏢", "🤝", "💰", "📊",
  "🩺", "❤️", "💊", "🧬", "🩹",
  "💵", "💳", "🪙", "🏧",
  "🚐", "⛷️", "🎿", "🎣", "🤿", "🏊",
  "🎨", "🖼️", "📷", "🎵", "🎸", "🎮",
  "🌱", "🌿", "🪴", "🌻", "🌺", "🌳",
  "👕", "🧥", "🧣", "🧤", "🎀",
  "🎬", "📖", "🎧", "📸", "🎤",
]
const goalColors = ["#2563EB", "#16A34A", "#F59E0B", "#DC2626", "#8B5CF6", "#EC4899", "#06B6D4", "#F97316"]

function ProgressRing({ percentage, color, size = 80 }: { percentage: number; color: string; size?: number }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F3F4F6"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  )
}

export default function GoalsPage() {
  const { status } = useSession()
  const [goals, setGoals] = useState<Goal[]>([])
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [addContributionOpen, setAddContributionOpen] = useState(false)
  const [contributionGoalId, setContributionGoalId] = useState<string | null>(null)

  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    monthlyTarget: "",
    deadline: "",
    notes: "",
    icon: "🎯",
    color: "#2563EB",
  })
  const [contributionForm, setContributionForm] = useState({
    amount: "",
    date: "",
    notes: "",
  })

  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [addBtnHovered, setAddBtnHovered] = useState(false)
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false)
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false)
  const [contributeBtnHovered, setContributeBtnHovered] = useState<string | null>(null)
  const [quickAmountHovered, setQuickAmountHovered] = useState<string | null>(null)
  const [deleteBtnHovered, setDeleteBtnHovered] = useState<string | null>(null)
  const [emptyAddHovered, setEmptyAddHovered] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
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
    if (status === "authenticated") {
      fetchGoals()
      fetchOverview()
    }
  }, [status])

  const fetchGoals = async () => {
    const res = await fetch("/api/goals")
    const data = await res.json()
    setGoals(data)
    setLoading(false)
  }

  const fetchOverview = async () => {
    const res = await fetch("/api/goals/overview")
    const data = await res.json()
    setOverview(data)
  }

  const fetchGoalDetail = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`)
    const data = await res.json()
    setSelectedGoal(data)
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: goalForm.name,
        targetAmount: goalForm.targetAmount,
        monthlyTarget: goalForm.monthlyTarget || undefined,
        deadline: goalForm.deadline || undefined,
        notes: goalForm.notes || undefined,
        icon: goalForm.icon,
        color: goalForm.color,
      }),
    })
    setAddGoalOpen(false)
    resetGoalForm()
    fetchGoals()
    fetchOverview()
  }

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contributionGoalId) return
    await fetch(`/api/goals/${contributionGoalId}/contributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: contributionForm.amount,
        date: contributionForm.date || undefined,
        notes: contributionForm.notes || undefined,
      }),
    })
    setAddContributionOpen(false)
    setContributionGoalId(null)
    setContributionForm({ amount: "", date: "", notes: "" })
    fetchGoals()
    fetchOverview()
    if (selectedGoal) fetchGoalDetail(selectedGoal.id)
  }

  const handleDeleteContribution = async (goalId: string, contributionId: string) => {
    if (!confirm("Delete this contribution?")) return
    await fetch(`/api/goals/${goalId}/contributions/${contributionId}`, { method: "DELETE" })
    fetchGoals()
    fetchOverview()
    if (selectedGoal) fetchGoalDetail(selectedGoal.id)
  }

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Delete this goal and all its contributions?")) return
    await fetch(`/api/goals/${id}`, { method: "DELETE" })
    setSelectedGoal(null)
    fetchGoals()
    fetchOverview()
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    await fetch(`/api/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    fetchGoals()
    fetchOverview()
    if (selectedGoal?.id === id) fetchGoalDetail(id)
  }

  const resetGoalForm = () => {
    setGoalForm({ name: "", targetAmount: "", monthlyTarget: "", deadline: "", notes: "", icon: "🎯", color: "#2563EB" })
  }

  const openContribute = (goalId: string) => {
    setContributionGoalId(goalId)
    setContributionForm({ amount: "", date: "", notes: "" })
    setAddContributionOpen(true)
  }

  const overallPercentage = overview && overview.totalTarget > 0
    ? Math.min((overview.totalSaved / overview.totalTarget) * 100, 100)
    : 0

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  if (selectedGoal) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => { setSelectedGoal(null); fetchGoals(); fetchOverview() }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)" }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "36px", height: "36px", borderRadius: "9999px",
              background: "white", border: "1px solid #E5E7EB",
              cursor: "pointer", transition: "all 150ms ease",
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px", color: "#111111" }} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>
              {selectedGoal.icon} {selectedGoal.name}
            </h1>
            <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#6B7280", marginTop: "2px" }}>
              {selectedGoal.status === "active" ? "Active goal" : selectedGoal.status === "completed" ? "Completed" : "Paused"}
            </p>
          </div>
          <button
            onClick={() => handleDeleteGoal(selectedGoal.id)}
            onMouseEnter={() => setDeleteBtnHovered(selectedGoal.id)}
            onMouseLeave={() => setDeleteBtnHovered(null)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "36px", height: "36px", borderRadius: "9999px",
              background: deleteBtnHovered === selectedGoal.id ? "#FEF2F2" : "white",
              border: "1px solid #E5E7EB", cursor: "pointer", transition: "all 150ms ease",
            }}
          >
            <Trash2 style={{ width: "16px", height: "16px", color: "#DC2626" }} />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: isMobile ? "8px" : "12px" }}>
          {selectedGoal.status === "active" && (
            <>
              <button
                onClick={() => openContribute(selectedGoal.id)}
                onMouseEnter={() => setContributeBtnHovered("main")}
                onMouseLeave={() => setContributeBtnHovered(null)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  borderRadius: "9999px", padding: "10px 20px",
                  background: contributeBtnHovered === "main" ? "#1D4ED8" : "#2563EB",
                  color: "white", fontSize: isMobile ? "13px" : "14px", fontWeight: 500,
                  transition: "all 150ms ease", cursor: "pointer",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Add Contribution
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedGoal.id, "paused")}
                style={{
                  borderRadius: "9999px", padding: "10px 20px",
                  background: "white", border: "1px solid #E5E7EB",
                  fontSize: isMobile ? "13px" : "14px", fontWeight: 500, color: "#6B7280",
                  cursor: "pointer", transition: "all 150ms ease",
                }}
              >
                Pause
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedGoal.id, "completed")}
                style={{
                  borderRadius: "9999px", padding: "10px 20px",
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  fontSize: isMobile ? "13px" : "14px", fontWeight: 500, color: "#16A34A",
                  cursor: "pointer", transition: "all 150ms ease",
                }}
              >
                Complete
              </button>
            </>
          )}
          {selectedGoal.status === "paused" && (
            <>
              <button
                onClick={() => handleUpdateStatus(selectedGoal.id, "active")}
                onMouseEnter={() => setContributeBtnHovered("resume")}
                onMouseLeave={() => setContributeBtnHovered(null)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  borderRadius: "9999px", padding: "10px 20px",
                  background: contributeBtnHovered === "resume" ? "#1D4ED8" : "#2563EB",
                  color: "white", fontSize: isMobile ? "13px" : "14px", fontWeight: 500,
                  transition: "all 150ms ease", cursor: "pointer",
                }}
              >
                Resume Goal
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedGoal.id, "completed")}
                style={{
                  borderRadius: "9999px", padding: "10px 20px",
                  background: "#F0FDF4", border: "1px solid #BBF7D0",
                  fontSize: isMobile ? "13px" : "14px", fontWeight: 500, color: "#16A34A",
                  cursor: "pointer", transition: "all 150ms ease",
                }}
              >
                Complete
              </button>
            </>
          )}
          {selectedGoal.status === "completed" && (
            <button
              onClick={() => handleUpdateStatus(selectedGoal.id, "active")}
              onMouseEnter={() => setContributeBtnHovered("reopen")}
              onMouseLeave={() => setContributeBtnHovered(null)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                borderRadius: "9999px", padding: "10px 20px",
                background: contributeBtnHovered === "reopen" ? "#1D4ED8" : "#2563EB",
                color: "white", fontSize: isMobile ? "13px" : "14px", fontWeight: 500,
                transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              Reopen Goal
            </button>
          )}
        </div>

        <div style={{ background: "white", borderRadius: "20px", padding: isMobile ? "16px" : "24px", border: "1px solid #E5E7EB", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? "16px" : "24px" }}>
          <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-start" }}>
            <ProgressRing
              percentage={selectedGoal.targetAmount > 0 ? Math.min((selectedGoal.currentSaved / selectedGoal.targetAmount) * 100, 100) : 0}
              color={selectedGoal.color}
              size={isMobile ? 80 : 100}
            />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111" }}>{formatCurrency(selectedGoal.currentSaved)}</p>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "2px" }}>of {formatCurrency(selectedGoal.targetAmount)} target</p>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "13px", fontWeight: 600, color: selectedGoal.color }}>
                {selectedGoal.targetAmount > 0 ? Math.round((selectedGoal.currentSaved / selectedGoal.targetAmount) * 100) : 0}%
              </span>
              {selectedGoal.monthlyTarget && (
                <span style={{ fontSize: "13px", color: "#9CA3AF" }}>· {formatCurrency(selectedGoal.monthlyTarget)}/month</span>
              )}
              {selectedGoal.deadline && (
                <span style={{ fontSize: "13px", color: "#9CA3AF" }}>· Due {new Date(selectedGoal.deadline).toLocaleDateString()}</span>
              )}
            </div>
            {selectedGoal.notes && (
              <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "8px" }}>{selectedGoal.notes}</p>
            )}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
            Contributions ({selectedGoal.contributions?.length || 0})
          </h2>
          {selectedGoal.contributions && selectedGoal.contributions.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "#E5E7EB", borderRadius: "16px", overflow: "hidden" }}>
              {selectedGoal.contributions.map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: isMobile ? "12px" : "14px 16px", background: "white",
                  }}
                >
                  <div>
                    <p style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "#111111" }}>{formatCurrency(c.amount)}</p>
                    <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>
                      {new Date(c.date).toLocaleDateString()}
                      {c.notes && ` · ${c.notes}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteContribution(selectedGoal.id, c.id)}
                    onMouseEnter={() => setDeleteBtnHovered(c.id)}
                    onMouseLeave={() => setDeleteBtnHovered(null)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "28px", height: "28px", borderRadius: "9999px",
                      background: deleteBtnHovered === c.id ? "#FEF2F2" : "transparent",
                      cursor: "pointer", transition: "all 150ms ease", border: "none",
                    }}
                  >
                    <Trash2 style={{ width: "12px", height: "12px", color: "#DC2626" }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 0", background: "white", borderRadius: "16px", border: "1px solid #E5E7EB" }}>
              <Target style={{ width: "32px", height: "32px", color: "#D1D5DB", marginBottom: "8px" }} />
              <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No contributions yet</p>
            </div>
          )}
        </div>

        <Modal open={addContributionOpen} onClose={() => { setAddContributionOpen(false); setContributionGoalId(null) }} title="Add Contribution">
          <form onSubmit={handleAddContribution} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Amount</label>
              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                {[100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setContributionForm({ ...contributionForm, amount: String(amt) })}
                    onMouseEnter={() => setQuickAmountHovered(String(amt))}
                    onMouseLeave={() => setQuickAmountHovered(null)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: "12px", fontSize: isMobile ? "13px" : "14px", fontWeight: 500,
                      border: contributionForm.amount === String(amt) ? "1px solid #2563EB" : "1px solid #E5E7EB",
                      background: contributionForm.amount === String(amt) ? "#EFF6FF" : quickAmountHovered === String(amt) ? "#F9FAFB" : "white",
                      color: contributionForm.amount === String(amt) ? "#2563EB" : "#111111",
                      cursor: "pointer", transition: "all 150ms ease",
                    }}
                  >
                    ${amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={contributionForm.amount}
                onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Custom amount"
                min="0.01"
                step="0.01"
                required
                style={{
                  height: "44px", width: "100%", borderRadius: "12px",
                  border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                  background: "white", padding: "0 14px", fontSize: "14px",
                  color: "#111111", outline: "none", transition: "all 150ms ease",
                  boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Date (optional)</label>
              <input
                type="date"
                value={contributionForm.date}
                onChange={(e) => setContributionForm({ ...contributionForm, date: e.target.value })}
                style={{
                  height: "44px", width: "100%", borderRadius: "12px",
                  border: "1px solid #E5E7EB", background: "white",
                  padding: "0 14px", fontSize: "14px", color: "#111111",
                  outline: "none", transition: "all 150ms ease",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Notes (optional)</label>
              <input
                type="text"
                value={contributionForm.notes}
                onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })}
                placeholder="e.g. Birthday money"
                style={{
                  height: "44px", width: "100%", borderRadius: "12px",
                  border: "1px solid #E5E7EB", background: "white",
                  padding: "0 14px", fontSize: "14px", color: "#111111",
                  outline: "none", transition: "all 150ms ease",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              <button
                type="button"
                onClick={() => { setAddContributionOpen(false); setContributionGoalId(null) }}
                onMouseEnter={() => setCancelBtnHovered(true)}
                onMouseLeave={() => setCancelBtnHovered(false)}
                style={{
                  flex: 1, height: "44px", borderRadius: "9999px",
                  border: "1px solid #E5E7EB", background: cancelBtnHovered ? "#F9FAFB" : "white",
                  fontSize: "14px", fontWeight: 500, color: "#111111",
                  transition: "all 150ms ease", cursor: "pointer",
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
                  background: submitBtnHovered ? "#1D4ED8" : "#2563EB",
                  color: "white", fontSize: "14px", fontWeight: 500,
                  transition: "all 150ms ease", cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
              >
                Add Contribution
              </button>
            </div>
          </form>
        </Modal>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? "12px" : "0" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Savings Goals</h1>
          <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#6B7280", marginTop: "2px" }}>Track your savings progress</p>
        </div>
        <button
          onClick={() => { resetGoalForm(); setAddGoalOpen(true) }}
          onMouseEnter={() => setAddBtnHovered(true)}
          onMouseLeave={() => setAddBtnHovered(false)}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: isMobile ? "center" : "flex-start", gap: "8px",
            borderRadius: "9999px", padding: "10px 20px",
            background: addBtnHovered ? "#1D4ED8" : "#2563EB",
            fontSize: "14px", fontWeight: 500, color: "white",
            transition: "all 150ms ease", boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            cursor: "pointer",
          }}
        >
          <Plus style={{ width: "16px", height: "16px" }} />
          Add Goal
        </button>
      </div>

      {overview && (
        <div style={{ background: "white", borderRadius: "20px", padding: isMobile ? "16px" : "24px", border: "1px solid #E5E7EB", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", gap: isMobile ? "16px" : "24px" }}>
          <div style={{ display: "flex", justifyContent: isMobile ? "center" : "flex-start" }}>
            <ProgressRing percentage={overallPercentage} color="#2563EB" size={isMobile ? 72 : 96} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "13px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>Overall Progress</p>
            <p style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", marginTop: "4px" }}>{formatCurrency(overview.totalSaved)}</p>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "2px" }}>of {formatCurrency(overview.totalTarget)} total target</p>
          </div>
          <div style={{ display: "flex", gap: "32px", justifyContent: isMobile ? "center" : "flex-start" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 700, color: "#111111" }}>{overview.activeGoals}</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Active</p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: isMobile ? "20px" : "24px", fontWeight: 700, color: "#16A34A" }}>{overview.completedGoals}</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Completed</p>
            </div>
          </div>
        </div>
      )}

      {goals.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: isMobile ? "12px" : "16px" }}>
          {goals.map((goal) => {
            const percentage = goal.targetAmount > 0 ? Math.min((goal.currentSaved / goal.targetAmount) * 100, 100) : 0
            const isHovered = hoveredCard === goal.id
            return (
              <div
                key={goal.id}
                onClick={() => fetchGoalDetail(goal.id)}
                onMouseEnter={() => setHoveredCard(goal.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: "white", borderRadius: "20px", padding: isMobile ? "16px" : "24px",
                  border: "1px solid #E5E7EB",
                  boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 200ms ease", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      display: "flex", width: isMobile ? "36px" : "40px", height: isMobile ? "36px" : "40px", alignItems: "center", justifyContent: "center",
                      borderRadius: "10px", fontSize: isMobile ? "16px" : "18px", backgroundColor: goal.color + "15",
                    }}>
                      {goal.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: isMobile ? "14px" : "15px", fontWeight: 600, color: "#111111" }}>{goal.name}</p>
                      <span style={{
                        display: "inline-block", fontSize: "11px", fontWeight: 500, padding: "2px 8px",
                        borderRadius: "9999px", marginTop: "2px",
                        background: goal.status === "completed" ? "#F0FDF4" : goal.status === "paused" ? "#FEF3C7" : "#EFF6FF",
                        color: goal.status === "completed" ? "#16A34A" : goal.status === "paused" ? "#D97706" : "#2563EB",
                      }}>
                        {goal.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
                  <ProgressRing percentage={percentage} color={goal.color} size={isMobile ? 72 : 88} />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px" }}>
                  <p style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: "#111111" }}>
                    {formatCurrency(goal.currentSaved)} <span style={{ fontWeight: 400, color: "#9CA3AF" }}>of {formatCurrency(goal.targetAmount)}</span>
                  </p>
                  <p style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 600, color: goal.color }}>{Math.round(percentage)}%</p>
                </div>

                {goal.deadline && (
                  <p style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "12px" }}>
                    Due {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                )}

                {goal.status === "active" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openContribute(goal.id) }}
                    onMouseEnter={() => setContributeBtnHovered(goal.id)}
                    onMouseLeave={() => setContributeBtnHovered(null)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "9999px",
                      background: contributeBtnHovered === goal.id ? "#EFF6FF" : "#F3F4F6",
                      fontSize: "13px", fontWeight: 500, color: goal.color,
                      transition: "all 150ms ease", cursor: "pointer", border: "none",
                    }}
                  >
                    Add Contribution
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "48px 0" : "80px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Target style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: isMobile ? "15px" : "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No savings goals yet</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>Create a goal to start tracking your savings</p>
          <button
            onClick={() => { resetGoalForm(); setAddGoalOpen(true) }}
            onMouseEnter={() => setEmptyAddHovered(true)}
            onMouseLeave={() => setEmptyAddHovered(false)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              borderRadius: "9999px", padding: "10px 20px",
              background: emptyAddHovered ? "#1D4ED8" : "#2563EB",
              fontSize: "14px", fontWeight: 500, color: "white",
              transition: "all 150ms ease", cursor: "pointer",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Add Goal
          </button>
        </div>
      )}

      <Modal open={addGoalOpen} onClose={() => { setAddGoalOpen(false); resetGoalForm() }} title="Add Savings Goal">
        <form onSubmit={handleCreateGoal} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Goal Name</label>
            <input
              type="text"
              value={goalForm.name}
              onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="e.g. Emergency Fund"
              required
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px", fontSize: "14px",
                color: "#111111", outline: "none", transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Target Amount</label>
              <input
                type="number"
                value={goalForm.targetAmount}
                onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
                placeholder="10000"
                min="1"
                step="0.01"
                required
                style={{
                  height: "44px", width: "100%", borderRadius: "12px",
                  border: "1px solid #E5E7EB", background: "white",
                  padding: "0 14px", fontSize: "14px", color: "#111111",
                  outline: "none", transition: "all 150ms ease",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Monthly Target</label>
              <input
                type="number"
                value={goalForm.monthlyTarget}
                onChange={(e) => setGoalForm({ ...goalForm, monthlyTarget: e.target.value })}
                placeholder="500"
                min="0"
                step="0.01"
                style={{
                  height: "44px", width: "100%", borderRadius: "12px",
                  border: "1px solid #E5E7EB", background: "white",
                  padding: "0 14px", fontSize: "14px", color: "#111111",
                  outline: "none", transition: "all 150ms ease",
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Deadline (optional)</label>
            <input
              type="date"
              value={goalForm.deadline}
              onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: "1px solid #E5E7EB", background: "white",
                padding: "0 14px", fontSize: "14px", color: "#111111",
                outline: "none", transition: "all 150ms ease",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Icon</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {goalIcons.map((emoji) => {
                const isSelected = goalForm.icon === emoji
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setGoalForm({ ...goalForm, icon: emoji })}
                    onMouseEnter={() => setSelectedIcon(emoji)}
                    onMouseLeave={() => setSelectedIcon(null)}
                    style={{
                      display: "flex", width: isMobile ? "36px" : "40px", height: isMobile ? "36px" : "40px", alignItems: "center", justifyContent: "center",
                      borderRadius: "10px", fontSize: isMobile ? "16px" : "18px", transition: "all 150ms ease", cursor: "pointer",
                      background: isSelected ? "#EFF6FF" : selectedIcon === emoji ? "#F3F4F6" : "transparent",
                      boxShadow: isSelected ? "0 0 0 2px #2563EB" : "none",
                      transform: isSelected ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Color</label>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {goalColors.map((color) => {
                const isSelected = goalForm.color === color
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setGoalForm({ ...goalForm, color })}
                    onMouseEnter={() => setSelectedColor(color)}
                    onMouseLeave={() => setSelectedColor(null)}
                    style={{
                      width: isMobile ? "28px" : "32px", height: isMobile ? "28px" : "32px", borderRadius: "9999px",
                      transition: "all 150ms ease", cursor: "pointer",
                      backgroundColor: color,
                      boxShadow: isSelected ? "0 0 0 2px white, 0 0 0 4px #111111" : "none",
                      transform: isSelected ? "scale(1.1)" : selectedColor === color ? "scale(1.05)" : "scale(1)",
                    }}
                  />
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Notes (optional)</label>
            <input
              type="text"
              value={goalForm.notes}
              onChange={(e) => setGoalForm({ ...goalForm, notes: e.target.value })}
              placeholder="Any extra details"
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: "1px solid #E5E7EB", background: "white",
                padding: "0 14px", fontSize: "14px", color: "#111111",
                outline: "none", transition: "all 150ms ease",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => { setAddGoalOpen(false); resetGoalForm() }}
              onMouseEnter={() => setCancelBtnHovered(true)}
              onMouseLeave={() => setCancelBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB", background: cancelBtnHovered ? "#F9FAFB" : "white",
                fontSize: "14px", fontWeight: 500, color: "#111111",
                transition: "all 150ms ease", cursor: "pointer",
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
                background: submitBtnHovered ? "#1D4ED8" : "#2563EB",
                color: "white", fontSize: "14px", fontWeight: 500,
                transition: "all 150ms ease", cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              Create Goal
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={addContributionOpen} onClose={() => { setAddContributionOpen(false); setContributionGoalId(null) }} title="Add Contribution">
        <form onSubmit={handleAddContribution} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Amount</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              {[100, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setContributionForm({ ...contributionForm, amount: String(amt) })}
                  onMouseEnter={() => setQuickAmountHovered(String(amt))}
                  onMouseLeave={() => setQuickAmountHovered(null)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "12px", fontSize: isMobile ? "13px" : "14px", fontWeight: 500,
                    border: contributionForm.amount === String(amt) ? "1px solid #2563EB" : "1px solid #E5E7EB",
                    background: contributionForm.amount === String(amt) ? "#EFF6FF" : quickAmountHovered === String(amt) ? "#F9FAFB" : "white",
                    color: contributionForm.amount === String(amt) ? "#2563EB" : "#111111",
                    cursor: "pointer", transition: "all 150ms ease",
                  }}
                >
                  ${amt.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              value={contributionForm.amount}
              onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Custom amount"
              min="0.01"
              step="0.01"
              required
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px", fontSize: "14px",
                color: "#111111", outline: "none", transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Date (optional)</label>
            <input
              type="date"
              value={contributionForm.date}
              onChange={(e) => setContributionForm({ ...contributionForm, date: e.target.value })}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: "1px solid #E5E7EB", background: "white",
                padding: "0 14px", fontSize: "14px", color: "#111111",
                outline: "none", transition: "all 150ms ease",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Notes (optional)</label>
            <input
              type="text"
              value={contributionForm.notes}
              onChange={(e) => setContributionForm({ ...contributionForm, notes: e.target.value })}
              placeholder="e.g. Birthday money"
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: "1px solid #E5E7EB", background: "white",
                padding: "0 14px", fontSize: "14px", color: "#111111",
                outline: "none", transition: "all 150ms ease",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => { setAddContributionOpen(false); setContributionGoalId(null) }}
              onMouseEnter={() => setCancelBtnHovered(true)}
              onMouseLeave={() => setCancelBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB", background: cancelBtnHovered ? "#F9FAFB" : "white",
                fontSize: "14px", fontWeight: 500, color: "#111111",
                transition: "all 150ms ease", cursor: "pointer",
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
                background: submitBtnHovered ? "#1D4ED8" : "#2563EB",
                color: "white", fontSize: "14px", fontWeight: 500,
                transition: "all 150ms ease", cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              Add Contribution
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
