"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Modal } from "@/components/ui/modal"

interface Transaction {
  id: string
  amount: number
  description: string
  date: string
  type: string
  accountId: string
  categoryId: string | null
  account: { id: string; name: string }
  category: { id: string; name: string; icon: string } | null
}

interface Account {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  icon: string
  type: string
}

export default function TransactionsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    accountId: "",
    categoryId: "",
  })

  const [hoverAdd, setHoverAdd] = useState(false)
  const [hoverFilterType, setHoverFilterType] = useState<string | null>(null)
  const [hoverRow, setHoverRow] = useState<string | null>(null)
  const [hoverEdit, setHoverEdit] = useState<string | null>(null)
  const [hoverDelete, setHoverDelete] = useState<string | null>(null)
  const [hoverCancel, setHoverCancel] = useState(false)
  const [hoverSubmit, setHoverSubmit] = useState(false)
  const [hoverCatBtn, setHoverCatBtn] = useState<string | null>(null)
  const [hoverFormType, setHoverFormType] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") {
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    const [txRes, accRes, catRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/accounts"),
      fetch("/api/categories"),
    ])
    const [txData, accData, catData] = await Promise.all([
      txRes.json(),
      accRes.json(),
      catRes.json(),
    ])
    setTransactions(txData)
    setAccounts(accData)
    setCategories(catData)
    if (accData.length > 0 && !form.accountId) {
      setForm((prev) => ({ ...prev, accountId: accData[0].id }))
    }
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingTx ? `/api/transactions/${editingTx.id}` : "/api/transactions"
    const method = editingTx ? "PUT" : "POST"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setModalOpen(false)
    setEditingTx(null)
    setForm({
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      type: filterType === "all" ? "expense" : filterType,
      accountId: accounts[0]?.id || "",
      categoryId: "",
    })
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return
    await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    fetchData()
  }

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setForm({
      amount: tx.amount.toString(),
      description: tx.description,
      date: new Date(tx.date).toISOString().split("T")[0],
      type: tx.type,
      accountId: tx.accountId,
      categoryId: tx.categoryId || "",
    })
    setModalOpen(true)
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description
      .toLowerCase()
      .includes(search.toLowerCase())
    const matchesType = filterType === "all" || tx.type === filterType
    return matchesSearch && matchesType
  })

  const filteredCategories = categories.filter(
    (cat) => cat.type === form.type
  )

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <div style={{ height: "24px", width: "24px", animation: "txSpin 1s linear infinite", borderRadius: "9999px", borderWidth: "2px", borderStyle: "solid", borderColor: "#E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes txSpin { to { transform: rotate(360deg); } }
        input::placeholder { color: #9CA3AF; }
        input:focus { border-color: #2563EB !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
        select:focus { border-color: #2563EB !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em", margin: 0 }}>
              Transactions
            </h1>
            <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>
              Track your income and expenses
            </p>
          </div>
          <button
            onClick={() => {
              setEditingTx(null)
              setForm({
                amount: "",
                description: "",
                date: new Date().toISOString().split("T")[0],
                type: filterType === "all" ? "expense" : filterType,
                accountId: accounts[0]?.id || "",
                categoryId: "",
              })
              setModalOpen(true)
            }}
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              background: hoverAdd ? "#1D4ED8" : "#2563EB",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              transition: "all 0.15s",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              cursor: "pointer",
              border: "none",
            }}
          >
            <Plus style={{ height: "16px", width: "16px" }} />
            Add Transaction
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "row", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", height: "16px", width: "16px", color: "#9CA3AF", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: "40px",
                width: "100%",
                borderRadius: "9999px",
                border: "1px solid #E5E7EB",
                background: "white",
                paddingLeft: "40px",
                paddingRight: "16px",
                fontSize: "14px",
                color: "#111111",
                outline: "none",
                transition: "all 0.15s",
                boxSizing: "border-box" as const,
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "6px", background: "white", borderRadius: "9999px", padding: "4px", border: "1px solid #E5E7EB" }}>
            {["all", "income", "expense"].map((type) => {
              const isActive = filterType === type
              const isHovered = hoverFilterType === type
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  onMouseEnter={() => setHoverFilterType(type)}
                  onMouseLeave={() => setHoverFilterType(null)}
                  style={{
                    borderRadius: "9999px",
                    padding: "6px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    cursor: "pointer",
                    border: "none",
                    background: isActive ? "#111111" : "transparent",
                    color: isActive ? "white" : isHovered ? "#111111" : "#6B7280",
                  }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div style={{ borderRadius: "20px", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" as const }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      Transaction
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      Category
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      Account
                    </th>
                    <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      Date
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      Amount
                    </th>
                    <th style={{ textAlign: "right", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      onMouseEnter={() => setHoverRow(tx.id)}
                      onMouseLeave={() => setHoverRow(null)}
                      style={{
                        borderBottom: "1px solid #F3F4F6",
                        background: hoverRow === tx.id ? "#F9FAFB" : "white",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: "#F9FAFB", fontSize: "16px" }}>
                            {tx.category?.icon || "\uD83D\uDCB0"}
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{tx.description}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: "13px", color: "#6B7280" }}>
                        {tx.category?.name || "\u2014"}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: "13px", color: "#6B7280" }}>
                        {tx.account?.name}
                      </td>
                      <td style={{ padding: "14px 24px", fontSize: "13px", color: "#9CA3AF" }}>
                        {formatDate(tx.date)}
                      </td>
                      <td style={{ padding: "14px 24px", textAlign: "right" }}>
                        <span style={{ fontSize: "14px", fontWeight: 600, color: tx.type === "income" ? "#16A34A" : "#111111" }}>
                          {tx.type === "income" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td style={{ padding: "14px 24px", textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "2px" }}>
                          <button
                            onClick={() => openEdit(tx)}
                            onMouseEnter={() => setHoverEdit(tx.id)}
                            onMouseLeave={() => setHoverEdit(null)}
                            style={{
                              display: "flex",
                              height: "28px",
                              width: "28px",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "9999px",
                              background: hoverEdit === tx.id ? "#F3F4F6" : "transparent",
                              transition: "background 0.15s",
                              cursor: "pointer",
                              border: "none",
                            }}
                          >
                            <Pencil style={{ height: "14px", width: "14px", color: "#6B7280" }} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            onMouseEnter={() => setHoverDelete(tx.id)}
                            onMouseLeave={() => setHoverDelete(null)}
                            style={{
                              display: "flex",
                              height: "28px",
                              width: "28px",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "9999px",
                              background: hoverDelete === tx.id ? "#FEF2F2" : "transparent",
                              transition: "background 0.15s",
                              cursor: "pointer",
                              border: "none",
                            }}
                          >
                            <Trash2 style={{ height: "14px", width: "14px", color: "#DC2626" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ height: "64px", width: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <Search style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>
              {search || filterType !== "all"
                ? "No matching transactions"
                : "No transactions yet"}
            </p>
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>
              {search || filterType !== "all"
                ? "Try adjusting your filters"
                : "Add your first transaction to get started"}
            </p>
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditingTx(null)
          }}
          title={editingTx ? "Edit Transaction" : "Add Transaction"}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {["expense", "income"].map((type) => {
                  const isActive = form.type === type
                  const isHovered = hoverFormType === type
                  let borderColor = "#E5E7EB"
                  let background = "white"
                  let textColor = "#6B7280"

                  if (isActive) {
                    if (type === "income") {
                      borderColor = "#16A34A"
                      background = "#F0FDF4"
                      textColor = "#16A34A"
                    } else {
                      borderColor = "#DC2626"
                      background = "#FEF2F2"
                      textColor = "#DC2626"
                    }
                  } else if (isHovered) {
                    borderColor = "#D1D5DB"
                  }

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm({ ...form, type, categoryId: "" })}
                      onMouseEnter={() => setHoverFormType(type)}
                      onMouseLeave={() => setHoverFormType(null)}
                      style={{
                        borderRadius: "12px",
                        border: `1px solid ${borderColor}`,
                        padding: "10px",
                        fontSize: "13px",
                        fontWeight: 500,
                        transition: "all 0.15s",
                        cursor: "pointer",
                        background,
                        color: textColor,
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Amount</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                style={{
                  height: "44px",
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  background: "white",
                  paddingLeft: "14px",
                  paddingRight: "14px",
                  fontSize: "14px",
                  color: "#111111",
                  outline: "none",
                  transition: "all 0.15s",
                  boxSizing: "border-box" as const,
                }}
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                style={{
                  height: "44px",
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  background: "white",
                  paddingLeft: "14px",
                  paddingRight: "14px",
                  fontSize: "14px",
                  color: "#111111",
                  outline: "none",
                  transition: "all 0.15s",
                  boxSizing: "border-box" as const,
                }}
                placeholder="e.g. Coffee at Starbucks"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={{
                  height: "44px",
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  background: "white",
                  paddingLeft: "14px",
                  paddingRight: "14px",
                  fontSize: "14px",
                  color: "#111111",
                  outline: "none",
                  transition: "all 0.15s",
                  boxSizing: "border-box" as const,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Account</label>
              <select
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                style={{
                  height: "44px",
                  width: "100%",
                  borderRadius: "12px",
                  border: "1px solid #E5E7EB",
                  background: "white",
                  paddingLeft: "14px",
                  paddingRight: "40px",
                  fontSize: "14px",
                  color: "#111111",
                  outline: "none",
                  cursor: "pointer",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                  appearance: "none",
                  backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E\")",
                  backgroundSize: "18px",
                  backgroundPosition: "right 12px center",
                  backgroundRepeat: "no-repeat",
                  transition: "all 0.15s",
                  boxSizing: "border-box" as const,
                }}
                required
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Category</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", maxHeight: "128px", overflowY: "auto", padding: "2px" }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, categoryId: "" })}
                  onMouseEnter={() => setHoverCatBtn("none")}
                  onMouseLeave={() => setHoverCatBtn(null)}
                  style={{
                    borderRadius: "12px",
                    border: `1px solid ${!form.categoryId ? "#2563EB" : hoverCatBtn === "none" ? "#D1D5DB" : "#E5E7EB"}`,
                    background: !form.categoryId ? "#EFF6FF" : "white",
                    padding: "8px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: !form.categoryId ? "#2563EB" : "#6B7280",
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                >
                  None
                </button>
                {filteredCategories.map((cat) => {
                  const isSelected = form.categoryId === cat.id
                  const isHovered = hoverCatBtn === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm({ ...form, categoryId: cat.id })}
                      onMouseEnter={() => setHoverCatBtn(cat.id)}
                      onMouseLeave={() => setHoverCatBtn(null)}
                      style={{
                        borderRadius: "12px",
                        border: `1px solid ${isSelected ? "#2563EB" : isHovered ? "#D1D5DB" : "#E5E7EB"}`,
                        background: isSelected ? "#EFF6FF" : "white",
                        padding: "8px",
                        fontSize: "12px",
                        fontWeight: 500,
                        color: isSelected ? "#2563EB" : "#6B7280",
                        transition: "all 0.15s",
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap" as const,
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>{cat.icon}</span>
                      <br />
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  setEditingTx(null)
                }}
                onMouseEnter={() => setHoverCancel(true)}
                onMouseLeave={() => setHoverCancel(false)}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "9999px",
                  border: "1px solid #E5E7EB",
                  background: hoverCancel ? "#F9FAFB" : "white",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#111111",
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                onMouseEnter={() => setHoverSubmit(true)}
                onMouseLeave={() => setHoverSubmit(false)}
                style={{
                  flex: 1,
                  height: "44px",
                  borderRadius: "9999px",
                  background: hoverSubmit ? "#1D4ED8" : "#2563EB",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.15s",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                {editingTx ? "Save Changes" : "Add Transaction"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
