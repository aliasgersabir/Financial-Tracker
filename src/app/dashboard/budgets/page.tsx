"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { formatCurrency } from "@/lib/utils"

interface Category {
  id: string
  name: string
  type: string
  icon: string
  color: string
}

interface BudgetItem {
  id: string
  categoryId: string
  amount: number
  category: Category
}

interface Budget {
  id: string
  name: string
  month: number
  year: number
  period: number
  items: BudgetItem[]
}

interface OverviewItem {
  id: string
  category: Category
  budgeted: number
  spent: number
  remaining: number
  percentage: number
  status: "normal" | "warning" | "exceeded"
}

interface OverviewData {
  totalBudgeted: number
  totalSpent: number
  totalRemaining: number
  items: OverviewItem[]
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const SHORT_MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

const PERIOD_OPTIONS = [
  { value: 1, label: "Monthly" },
  { value: 3, label: "Quarterly" },
  { value: 6, label: "Half-yearly" },
  { value: 12, label: "Yearly" },
]

function getEndMonthYear(month: number, year: number, period: number) {
  const totalMonths = period - 1
  const endMonth = ((month - 1 + totalMonths) % 12) + 1
  const endYear = year + Math.floor((month - 1 + totalMonths) / 12)
  return { endMonth, endYear }
}

function formatDateRange(month: number, year: number, period: number) {
  if (period === 1) return `${MONTH_NAMES[month - 1]} ${year}`
  const { endMonth, endYear } = getEndMonthYear(month, year, period)
  return `${SHORT_MONTH_NAMES[month - 1]} ${year} — ${SHORT_MONTH_NAMES[endMonth - 1]} ${endYear}`
}

export default function BudgetsPage() {
  const { status } = useSession()
  const router = useRouter()

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [budget, setBudget] = useState<Budget | null>(null)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [addItemModalOpen, setAddItemModalOpen] = useState(false)
  const [editItemModalOpen, setEditItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<OverviewItem | null>(null)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [createForm, setCreateForm] = useState({ name: "", totalAmount: "", period: 1 })
  const [newItem, setNewItem] = useState({ categoryId: "", amount: "" })
  const [editAmount, setEditAmount] = useState("")

  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [addBtnHovered, setAddBtnHovered] = useState(false)
  const [emptyAddHovered, setEmptyAddHovered] = useState(false)
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false)
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false)
  const [deleteBtnHover, setDeleteBtnHover] = useState<string | null>(null)
  const [editBtnHover, setEditBtnHover] = useState<string | null>(null)
  const [inputFocused, setInputFocused] = useState(false)
  const [selectedCatHover, setSelectedCatHover] = useState<string | null>(null)
  const [deleteConfirmHover, setDeleteConfirmHover] = useState(false)
  const [deleteCancelHover, setDeleteCancelHover] = useState(false)

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [budgetRes, overviewRes, catRes] = await Promise.all([
      fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`),
      fetch(`/api/budgets/overview?month=${selectedMonth}&year=${selectedYear}`),
      fetch("/api/categories"),
    ])
    const budgetData = await budgetRes.json()
    const overviewData = await overviewRes.json()
    const catData = await catRes.json()
    setBudget(budgetData.length > 0 ? budgetData[0] : null)
    setOverview(overviewData)
    setCategories(catData)
    setLoading(false)
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    if (status === "authenticated") fetchData()
  }, [status, fetchData])

  const prevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const nextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createForm.name.trim()) return
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: createForm.name,
        month: selectedMonth,
        year: selectedYear,
        period: createForm.period,
        totalAmount: createForm.totalAmount ? parseFloat(createForm.totalAmount) : 0,
        items: [],
      }),
    })
    setCreateModalOpen(false)
    setCreateForm({ name: "", totalAmount: "", period: 1 })
    fetchData()
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budget || !newItem.categoryId || !newItem.amount) return
    await fetch(`/api/budgets/${budget.id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: newItem.categoryId,
        amount: parseFloat(newItem.amount),
      }),
    })
    setAddItemModalOpen(false)
    setNewItem({ categoryId: "", amount: "" })
    fetchData()
  }

  const handleEditItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budget || !editingItem || !editAmount) return
    await fetch(`/api/budgets/${budget.id}/items/${editingItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(editAmount) }),
    })
    setEditItemModalOpen(false)
    setEditingItem(null)
    fetchData()
  }

  const handleDeleteItem = async () => {
    if (!budget || !deleteItemId) return
    await fetch(`/api/budgets/${budget.id}/items/${deleteItemId}`, {
      method: "DELETE",
    })
    setDeleteItemId(null)
    fetchData()
  }

  const handleDeleteBudget = async () => {
    if (!budget) return
    if (!confirm("Delete this entire budget?")) return
    await fetch(`/api/budgets/${budget.id}`, { method: "DELETE" })
    fetchData()
  }

  const getStatusColor = (status: string) => {
    if (status === "exceeded") return "#DC2626"
    if (status === "warning") return "#F59E0B"
    return "#16A34A"
  }

  const expenseCategories = categories.filter((c) => c.type === "expense")
  const availableCategories = expenseCategories.filter(
    (c) => !overview?.items.some((i) => i.category.id === c.id)
  )

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progressFill { from { width: 0%; } }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between",
        gap: isMobile ? "12px" : undefined,
      }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Budgets</h1>
          <p style={{ fontSize: isMobile ? "13px" : "15px", color: "#6B7280", marginTop: "2px" }}>Plan and track your spending</p>
        </div>
        {budget && (
          <button
            onClick={() => setAddItemModalOpen(true)}
            onMouseEnter={() => setAddBtnHovered(true)}
            onMouseLeave={() => setAddBtnHovered(false)}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)" }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: isMobile ? "center" : undefined,
              gap: "8px",
              borderRadius: "9999px",
              background: addBtnHovered ? "#1D4ED8" : "#2563EB",
              padding: isMobile ? "10px 16px" : "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              transition: "all 150ms ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Add Category
          </button>
        )}
      </div>

      {/* Month/Year Selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? "10px" : "16px" }}>
        <button
          onClick={prevMonth}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", borderRadius: "9999px",
            border: "1px solid #E5E7EB", background: "white", cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "white" }}
        >
          <ChevronLeft style={{ width: "16px", height: "16px", color: "#6B7280" }} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 600, color: "#111111" }}>
            {MONTH_NAMES[selectedMonth - 1]}
          </span>
          <span style={{ fontSize: isMobile ? "15px" : "18px", fontWeight: 600, color: "#111111" }}>
            {selectedYear}
          </span>
        </div>
        <button
          onClick={nextMonth}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: isMobile ? "32px" : "36px", height: isMobile ? "32px" : "36px", borderRadius: "9999px",
            border: "1px solid #E5E7EB", background: "white", cursor: "pointer",
            transition: "all 150ms ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "white" }}
        >
          <ChevronRight style={{ width: "16px", height: "16px", color: "#6B7280" }} />
        </button>
      </div>

      {/* Empty state */}
      {!budget && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "48px 0" : "80px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <Wallet style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 500, color: "#111111", marginBottom: "4px", textAlign: "center" }}>No budget for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</p>
          <p style={{ fontSize: isMobile ? "13px" : "14px", color: "#9CA3AF", marginBottom: "24px", textAlign: "center" }}>Create a budget to start tracking your spending</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            onMouseEnter={() => setEmptyAddHovered(true)}
            onMouseLeave={() => setEmptyAddHovered(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              background: emptyAddHovered ? "#1D4ED8" : "#2563EB",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              transition: "all 150ms ease",
              cursor: "pointer",
            }}
          >
            <Plus style={{ width: "16px", height: "16px" }} />
            Create Budget
          </button>
        </div>
      )}

      {/* Budget exists */}
      {budget && overview && (
        <>
          {/* Overview Card */}
          <div style={{
            borderRadius: "20px",
            background: "white",
            padding: isMobile ? "16px" : "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            border: "1px solid #E5E7EB",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 style={{ fontSize: isMobile ? "14px" : "16px", fontWeight: 600, color: "#111111" }}>{budget.name}</h2>
                <p style={{ fontSize: isMobile ? "12px" : "13px", color: "#9CA3AF", marginTop: "2px" }}>
                  {formatDateRange(selectedMonth, selectedYear, budget.period || 1)} Overview
                </p>
              </div>
              <button
                onClick={handleDeleteBudget}
                onMouseEnter={() => setDeleteBtnHover("budget")}
                onMouseLeave={() => setDeleteBtnHover(null)}
                style={{
                  display: "flex", width: "32px", height: "32px", alignItems: "center", justifyContent: "center",
                  borderRadius: "9999px",
                  background: deleteBtnHover === "budget" ? "#FEF2F2" : "transparent",
                  cursor: "pointer", transition: "background 150ms ease", border: "none",
                }}
              >
                <Trash2 style={{ width: "14px", height: "14px", color: "#DC2626" }} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr 1fr" : "1fr 1fr 1fr", gap: isMobile ? "8px" : "16px", marginBottom: "20px" }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Budgeted</p>
                <p style={{ fontSize: isMobile ? "17px" : "22px", fontWeight: 700, color: "#111111" }}>{formatCurrency(overview.totalBudgeted)}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Spent</p>
                <p style={{ fontSize: isMobile ? "17px" : "22px", fontWeight: 700, color: "#DC2626" }}>{formatCurrency(overview.totalSpent)}</p>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: isMobile ? "10px" : "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Remaining</p>
                <p style={{ fontSize: isMobile ? "17px" : "22px", fontWeight: 700, color: overview.totalRemaining >= 0 ? "#16A34A" : "#DC2626" }}>
                  {formatCurrency(overview.totalRemaining)}
                </p>
              </div>
            </div>

            {/* Total progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: isMobile ? "12px" : "13px", color: "#6B7280" }}>Overall Progress</span>
                <span style={{ fontSize: isMobile ? "12px" : "13px", fontWeight: 500, color: "#111111" }}>
                  {overview.totalBudgeted > 0 ? Math.round((overview.totalSpent / overview.totalBudgeted) * 100) : 0}%
                </span>
              </div>
              <div style={{ height: "8px", borderRadius: "9999px", background: "#F3F4F6", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: "9999px",
                    background: (() => {
                      const pct = overview.totalBudgeted > 0 ? (overview.totalSpent / overview.totalBudgeted) * 100 : 0
                      if (pct > 100) return "#DC2626"
                      if (pct >= 80) return "#F59E0B"
                      return "#16A34A"
                    })(),
                    width: `${Math.min(overview.totalBudgeted > 0 ? (overview.totalSpent / overview.totalBudgeted) * 100 : 0, 100)}%`,
                    animation: "progressFill 0.8s ease-out",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Category Cards Grid */}
          {overview.items.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
              gap: isMobile ? "10px" : "12px",
            }}>
              {overview.items.map((item) => {
                const isHovered = hoveredCard === item.id
                const statusColor = getStatusColor(item.status)
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredCard(item.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      borderRadius: "16px",
                      background: "white",
                      padding: isMobile ? "12px" : "16px",
                      boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                      transition: "all 200ms ease",
                      position: "relative",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "10px" }}>
                        <div
                          style={{
                            display: "flex", width: isMobile ? "36px" : "40px", height: isMobile ? "36px" : "40px", alignItems: "center", justifyContent: "center",
                            borderRadius: "10px", fontSize: isMobile ? "16px" : "18px", backgroundColor: item.category.color + "15",
                          }}
                        >
                          {item.category.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: isMobile ? "13px" : "14px", fontWeight: 500, color: "#111111" }}>{item.category.name}</p>
                          <p style={{ fontSize: isMobile ? "11px" : "12px", color: "#9CA3AF" }}>
                            {formatCurrency(item.spent)} of {formatCurrency(item.budgeted)}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "2px", opacity: isMobile ? 1 : (isHovered ? 1 : 0), transition: "opacity 150ms ease" }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingItem(item)
                            setEditAmount(String(item.budgeted))
                            setEditItemModalOpen(true)
                          }}
                          onMouseEnter={() => setEditBtnHover(item.id)}
                          onMouseLeave={() => setEditBtnHover(null)}
                          style={{
                            display: "flex", width: "24px", height: "24px", alignItems: "center", justifyContent: "center",
                            borderRadius: "9999px",
                            background: editBtnHover === item.id ? "#F3F4F6" : "transparent",
                            cursor: "pointer", transition: "background 150ms ease",
                          }}
                        >
                          <Pencil style={{ width: "12px", height: "12px", color: "#6B7280" }} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteItemId(item.id)
                          }}
                          onMouseEnter={() => setDeleteBtnHover(item.id)}
                          onMouseLeave={() => setDeleteBtnHover(null)}
                          style={{
                            display: "flex", width: "24px", height: "24px", alignItems: "center", justifyContent: "center",
                            borderRadius: "9999px",
                            background: deleteBtnHover === item.id ? "#FEF2F2" : "transparent",
                            cursor: "pointer", transition: "background 150ms ease",
                          }}
                        >
                          <Trash2 style={{ width: "12px", height: "12px", color: "#DC2626" }} />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{item.percentage}% used</span>
                        <span style={{ fontSize: "12px", fontWeight: 500, color: statusColor }}>
                          {item.status === "exceeded" ? "Exceeded" : item.status === "warning" ? "Almost there" : "On track"}
                        </span>
                      </div>
                      <div style={{ height: "6px", borderRadius: "9999px", background: "#F3F4F6", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            borderRadius: "9999px",
                            background: statusColor,
                            width: `${Math.min(item.percentage, 100)}%`,
                            animation: "progressFill 0.8s ease-out",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "48px 0",
              borderRadius: "20px",
              background: "white",
              border: "1px solid #E5E7EB",
            }}>
              <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "16px" }}>No categories in this budget yet</p>
              <button
                onClick={() => setAddItemModalOpen(true)}
                onMouseEnter={() => setEmptyAddHovered(true)}
                onMouseLeave={() => setEmptyAddHovered(false)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  borderRadius: "9999px",
                  background: emptyAddHovered ? "#1D4ED8" : "#2563EB",
                  padding: "10px 20px",
                  fontSize: "14px", fontWeight: 500, color: "white",
                  transition: "all 150ms ease", cursor: "pointer",
                }}
              >
                <Plus style={{ width: "16px", height: "16px" }} />
                Add Category
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Item Confirm */}
      {deleteItemId && (
        <Modal open={true} onClose={() => setDeleteItemId(null)} title="Remove Category">
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>
            Are you sure you want to remove this category from the budget?
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => setDeleteItemId(null)}
              onMouseEnter={() => setDeleteCancelHover(true)}
              onMouseLeave={() => setDeleteCancelHover(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB",
                background: deleteCancelHover ? "#F9FAFB" : "white",
                fontSize: "14px", fontWeight: 500, color: "#111111",
                transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteItem}
              onMouseEnter={() => setDeleteConfirmHover(true)}
              onMouseLeave={() => setDeleteConfirmHover(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                background: deleteConfirmHover ? "#B91C1C" : "#DC2626",
                color: "white", fontSize: "14px", fontWeight: 500,
                transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              Remove
            </button>
          </div>
        </Modal>
      )}

      {/* Create Budget Modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Budget">
        <form onSubmit={handleCreateBudget} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
              Budget Name
            </label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px",
                fontSize: "14px", color: "#111111", outline: "none",
                transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
              placeholder="e.g. Monthly Budget"
              required
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
              Total Budget Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={createForm.totalAmount}
              onChange={(e) => setCreateForm({ ...createForm, totalAmount: e.target.value })}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px",
                fontSize: "14px", color: "#111111", outline: "none",
                transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
              placeholder="0.00"
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Period</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {PERIOD_OPTIONS.map((opt) => {
                const isActive = createForm.period === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setCreateForm({ ...createForm, period: opt.value })}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "9999px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 150ms ease",
                      border: isActive ? "1px solid #2563EB" : "1px solid #E5E7EB",
                      background: isActive ? "#2563EB" : "white",
                      color: isActive ? "white" : "#6B7280",
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: "13px", color: "#6B7280", padding: "10px 14px", background: "#F9FAFB", borderRadius: "12px", marginTop: "8px" }}>
              {formatDateRange(selectedMonth, selectedYear, createForm.period)}
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              onMouseEnter={() => setCancelBtnHovered(true)}
              onMouseLeave={() => setCancelBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB",
                background: cancelBtnHovered ? "#F9FAFB" : "white",
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
                transition: "all 150ms ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)", cursor: "pointer",
              }}
            >
              Create Budget
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Item Modal */}
      <Modal open={addItemModalOpen} onClose={() => setAddItemModalOpen(false)} title="Add Budget Category">
        <form onSubmit={handleAddItem} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
              Select Category
            </label>
            {availableCategories.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(4, 1fr)", gap: "8px", maxHeight: "200px", overflowY: "auto", padding: "2px" }}>
                {availableCategories.map((cat) => {
                  const isSelected = newItem.categoryId === cat.id
                  const isHover = selectedCatHover === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNewItem({ ...newItem, categoryId: cat.id })}
                      onMouseEnter={() => setSelectedCatHover(cat.id)}
                      onMouseLeave={() => setSelectedCatHover(null)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                        padding: isMobile ? "8px 4px" : "10px 4px", borderRadius: "12px",
                        border: isSelected ? `2px solid ${cat.color}` : "2px solid transparent",
                        background: isSelected ? cat.color + "15" : isHover ? "#F3F4F6" : "#F9FAFB",
                        cursor: "pointer", transition: "all 150ms ease",
                      }}
                    >
                      <span style={{ fontSize: isMobile ? "16px" : "18px" }}>{cat.icon}</span>
                      <span style={{ fontSize: "11px", fontWeight: 500, color: "#111111", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "#9CA3AF", padding: "16px", textAlign: "center", background: "#F9FAFB", borderRadius: "12px" }}>
                All expense categories are already in this budget
              </p>
            )}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
              Budget Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newItem.amount}
              onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px",
                fontSize: "14px", color: "#111111", outline: "none",
                transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
              placeholder="0.00"
              required
            />
          </div>
          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => setAddItemModalOpen(false)}
              onMouseEnter={() => setCancelBtnHovered(true)}
              onMouseLeave={() => setCancelBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB",
                background: cancelBtnHovered ? "#F9FAFB" : "white",
                fontSize: "14px", fontWeight: 500, color: "#111111",
                transition: "all 150ms ease", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newItem.categoryId || !newItem.amount}
              onMouseEnter={() => setSubmitBtnHovered(true)}
              onMouseLeave={() => setSubmitBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                background: submitBtnHovered ? "#1D4ED8" : "#2563EB",
                color: "white", fontSize: "14px", fontWeight: 500,
                transition: "all 150ms ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)", cursor: "pointer",
                opacity: !newItem.categoryId || !newItem.amount ? 0.5 : 1,
              }}
            >
              Add Category
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal open={editItemModalOpen} onClose={() => { setEditItemModalOpen(false); setEditingItem(null) }} title="Edit Budget Amount">
        <form onSubmit={handleEditItem} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {editingItem && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px", background: "#F9FAFB", borderRadius: "12px" }}>
              <div style={{ display: "flex", width: "36px", height: "36px", alignItems: "center", justifyContent: "center", borderRadius: "8px", fontSize: "16px", backgroundColor: editingItem.category.color + "15" }}>
                {editingItem.category.icon}
              </div>
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{editingItem.category.name}</span>
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
              Budget Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                height: "44px", width: "100%", borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white", padding: "0 14px",
                fontSize: "14px", color: "#111111", outline: "none",
                transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
              placeholder="0.00"
              required
            />
          </div>
          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => { setEditItemModalOpen(false); setEditingItem(null) }}
              onMouseEnter={() => setCancelBtnHovered(true)}
              onMouseLeave={() => setCancelBtnHovered(false)}
              style={{
                flex: 1, height: "44px", borderRadius: "9999px",
                border: "1px solid #E5E7EB",
                background: cancelBtnHovered ? "#F9FAFB" : "white",
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
                transition: "all 150ms ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)", cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
