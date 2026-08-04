"use client"

import { useSession } from "next-auth/react"
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isMobile, setIsMobile] = useState(false)
  const [form, setForm] = useState({
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    type: "expense",
    accountId: "",
    categoryId: "",
  })
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCatName, setNewCatName] = useState("")
  const [newCatIcon, setNewCatIcon] = useState("📁")

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
      fetchData()
    }
  }, [status])

  const fetchData = async () => {
    try {
      const [txRes, accRes, catRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/accounts"),
        fetch("/api/categories"),
      ])
      const txData = txRes.ok ? await txRes.json() : []
      const accData = accRes.ok ? await accRes.json() : []
      const catData = catRes.ok ? await catRes.json() : []
      setTransactions(Array.isArray(txData) ? txData : [])
      setAccounts(Array.isArray(accData) ? accData : [])
      setCategories(Array.isArray(catData) ? catData : [])
      if (Array.isArray(accData) && accData.length > 0 && !form.accountId) {
        setForm((prev) => ({ ...prev, accountId: accData[0].id }))
      }
    } catch (err) {
      console.error("Failed to load transactions:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingTx ? `/api/transactions/${editingTx.id}` : "/api/transactions"
    const method = editingTx ? "PUT" : "POST"
    try {
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      setModalOpen(false)
      setEditingTx(null)
      setForm({ amount: "", description: "", date: new Date().toISOString().split("T")[0], type: filterType === "all" ? "expense" : filterType, accountId: accounts[0]?.id || "", categoryId: "" })
      fetchData()
    } catch (err) {
      console.error("Failed to save transaction:", err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return
    await fetch(`/api/transactions/${id}`, { method: "DELETE" })
    fetchData()
  }

  const openEdit = (tx: Transaction) => {
    setEditingTx(tx)
    setForm({ amount: tx.amount.toString(), description: tx.description, date: new Date(tx.date).toISOString().split("T")[0], type: tx.type, accountId: tx.accountId, categoryId: tx.categoryId || "" })
    setModalOpen(true)
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === "all" || tx.type === filterType
    return matchesSearch && matchesType
  })

  const filteredCategories = categories.filter((cat) => cat.type === form.type)

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <div style={{ height: "24px", width: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder, select::placeholder { color: #9CA3AF; }
        input:focus, select:focus { outline: none; border-color: #2563EB !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1); }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
        <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em", margin: 0 }}>Transactions</h1>
            <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "2px" }}>Track your income and expenses</p>
          </div>
          <button
            onClick={() => {
              setEditingTx(null)
              setForm({ amount: "", description: "", date: new Date().toISOString().split("T")[0], type: filterType === "all" ? "expense" : filterType, accountId: accounts[0]?.id || "", categoryId: "" })
              setModalOpen(true)
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              background: "#2563EB",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              cursor: "pointer",
              border: "none",
              flexShrink: 0,
            }}
          >
            <Plus style={{ height: "16px", width: "16px" }} />
            Add Transaction
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", height: "16px", width: "16px", color: "#9CA3AF", pointerEvents: "none" }} />
            <input type="text" placeholder="Search transactions..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ height: "40px", width: "100%", borderRadius: "9999px", border: "1px solid #E5E7EB", background: "white", paddingLeft: "40px", paddingRight: "16px", fontSize: "14px", color: "#111111", outline: "none", boxSizing: "border-box" as const }} />
          </div>
          <div style={{ display: "flex", gap: "4px", background: "white", borderRadius: "9999px", padding: "4px", border: "1px solid #E5E7EB", flexShrink: 0 }}>
            {["all", "income", "expense"].map((type) => {
              const isActive = filterType === type
              return (
                <button key={type} onClick={() => setFilterType(type)} style={{ borderRadius: "9999px", padding: isMobile ? "6px 12px" : "6px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", border: "none", background: isActive ? "#111111" : "transparent", color: isActive ? "white" : "#6B7280", flex: isMobile ? 1 : "none", textAlign: "center" as const }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              )
            })}
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredTransactions.map((tx) => (
                <div key={tx.id} style={{ borderRadius: "16px", background: "white", padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <div style={{ height: "36px", width: "36px", borderRadius: "10px", background: "#F9FAFB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                        {tx.category?.icon || "💰"}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontSize: "14px", fontWeight: 500, color: "#111111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{tx.description}</p>
                        <p style={{ fontSize: "11px", color: "#9CA3AF", margin: "2px 0 0 0" }}>{formatDate(tx.date)}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: "15px", fontWeight: 600, color: tx.type === "income" ? "#16A34A" : "#111111", flexShrink: 0, marginLeft: "8px" }}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {tx.category?.name && <span style={{ fontSize: "11px", color: "#6B7280", background: "#F3F4F6", borderRadius: "6px", padding: "2px 8px" }}>{tx.category.name}</span>}
                      <span style={{ fontSize: "11px", color: "#6B7280", background: "#F3F4F6", borderRadius: "6px", padding: "2px 8px" }}>{tx.account?.name}</span>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => openEdit(tx)} style={{ display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center", borderRadius: "9999px", cursor: "pointer", border: "none", background: "none" }}>
                        <Pencil style={{ height: "13px", width: "13px", color: "#6B7280" }} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} style={{ display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center", borderRadius: "9999px", cursor: "pointer", border: "none", background: "none" }}>
                        <Trash2 style={{ height: "13px", width: "13px", color: "#DC2626" }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ borderRadius: "20px", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" as const }}>
                <table style={{ width: "100%", borderCollapse: "collapse" as const }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Transaction</th>
                      <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Category</th>
                      <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Account</th>
                      <th style={{ textAlign: "left", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Date</th>
                      <th style={{ textAlign: "right", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Amount</th>
                      <th style={{ textAlign: "right", padding: "12px 24px", fontSize: "12px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: "1px solid #F3F4F6", transition: "background 0.15s" }}>
                        <td style={{ padding: "14px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: "#F9FAFB", fontSize: "16px" }}>{tx.category?.icon || "💰"}</div>
                            <span style={{ fontSize: "14px", fontWeight: 500, color: "#111111" }}>{tx.description}</span>
                          </div>
                        </td>
                        <td style={{ padding: "14px 24px", fontSize: "13px", color: "#6B7280" }}>{tx.category?.name || "—"}</td>
                        <td style={{ padding: "14px 24px", fontSize: "13px", color: "#6B7280" }}>{tx.account?.name}</td>
                        <td style={{ padding: "14px 24px", fontSize: "13px", color: "#9CA3AF" }}>{formatDate(tx.date)}</td>
                        <td style={{ padding: "14px 24px", textAlign: "right" }}>
                          <span style={{ fontSize: "14px", fontWeight: 600, color: tx.type === "income" ? "#16A34A" : "#111111" }}>
                            {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td style={{ padding: "14px 24px", textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "2px" }}>
                            <button onClick={() => openEdit(tx)} style={{ display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center", borderRadius: "9999px", cursor: "pointer", border: "none", background: "transparent" }}>
                              <Pencil style={{ height: "14px", width: "14px", color: "#6B7280" }} />
                            </button>
                            <button onClick={() => handleDelete(tx.id)} style={{ display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center", borderRadius: "9999px", cursor: "pointer", border: "none", background: "transparent" }}>
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
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ height: "64px", width: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <Search style={{ height: "24px", width: "24px", color: "#D1D5DB" }} />
            </div>
            <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>
              {search || filterType !== "all" ? "No matching transactions" : "No transactions yet"}
            </p>
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>
              {search || filterType !== "all" ? "Try adjusting your filters" : "Add your first transaction to get started"}
            </p>
          </div>
        )}

        <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingTx(null) }} title={editingTx ? "Edit Transaction" : "Add Transaction"}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Type</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {["expense", "income"].map((type) => {
                  const isActive = form.type === type
                  return (
                    <button key={type} type="button" onClick={() => setForm({ ...form, type, categoryId: "" })} style={{ borderRadius: "12px", border: `1px solid ${isActive ? (type === "income" ? "#16A34A" : "#DC2626") : "#E5E7EB"}`, padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer", background: isActive ? (type === "income" ? "#F0FDF4" : "#FEF2F2") : "white", color: isActive ? (type === "income" ? "#16A34A" : "#DC2626") : "#6B7280" }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Amount</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} style={{ height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB", background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none", boxSizing: "border-box" as const }} placeholder="0.00" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB", background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none", boxSizing: "border-box" as const }} placeholder="e.g. Coffee at Starbucks" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={{ height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB", background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none", boxSizing: "border-box" as const }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Account</label>
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} style={{ height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB", background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none", cursor: "pointer", boxSizing: "border-box" as const }} required>
                {accounts.map((acc) => (<option key={acc.id} value={acc.id}>{acc.name}</option>))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Category</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", maxHeight: "128px", overflowY: "auto", padding: "2px" }}>
                <button type="button" onClick={() => setForm({ ...form, categoryId: "" })} style={{ borderRadius: "12px", border: `1px solid ${!form.categoryId ? "#2563EB" : "#E5E7EB"}`, background: !form.categoryId ? "#EFF6FF" : "white", padding: "8px", fontSize: "12px", fontWeight: 500, color: !form.categoryId ? "#2563EB" : "#6B7280", cursor: "pointer" }}>None</button>
                {filteredCategories.map((cat) => {
                  const isSelected = form.categoryId === cat.id
                  return (
                    <button key={cat.id} type="button" onClick={() => setForm({ ...form, categoryId: cat.id })} style={{ borderRadius: "12px", border: `1px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`, background: isSelected ? "#EFF6FF" : "white", padding: "8px", fontSize: "12px", fontWeight: 500, color: isSelected ? "#2563EB" : "#6B7280", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                      <span style={{ fontSize: "16px" }}>{cat.icon}</span><br />
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{cat.name}</span>
                    </button>
                  )
                })}
                <button type="button" onClick={() => { setShowAddCategory(!showAddCategory); setNewCatName(""); setNewCatIcon("📁") }} style={{ borderRadius: "12px", border: "1px dashed #D1D5DB", background: showAddCategory ? "#EFF6FF" : "white", padding: "8px", fontSize: "12px", fontWeight: 500, color: showAddCategory ? "#2563EB" : "#6B7280", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                  <Plus style={{ height: "16px", width: "16px" }} />
                  <span>Add</span>
                </button>
              </div>
              {showAddCategory && (
                <div style={{ marginTop: "12px", padding: "12px", borderRadius: "12px", border: "1px solid #E5E7EB", background: "#F9FAFB" }}>
                  <input type="text" placeholder="Category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} style={{ height: "36px", width: "100%", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white", padding: "0 12px", fontSize: "13px", color: "#111111", outline: "none", boxSizing: "border-box" as const, marginBottom: "8px" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "4px", marginBottom: "8px" }}>
                    {["📁","💰","🛒","🍔","🚗","🏠","🎬","✈️","📚","🏥","💡","🎁","☕","🛒","💊","🏋️","🎵","📱","🐾","👶","🔧","👔","💻","🎓","🏠","💼","🎂","🔑","🚌","💊"].map((icon) => (
                      <button key={icon} type="button" onClick={() => setNewCatIcon(icon)} style={{ height: "32px", borderRadius: "8px", border: `1px solid ${newCatIcon === icon ? "#2563EB" : "#E5E7EB"}`, background: newCatIcon === icon ? "#EFF6FF" : "white", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {icon}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button type="button" onClick={() => setShowAddCategory(false)} style={{ flex: 1, height: "32px", borderRadius: "8px", border: "1px solid #E5E7EB", background: "white", fontSize: "12px", fontWeight: 500, color: "#6B7280", cursor: "pointer" }}>Cancel</button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!newCatName.trim()) return
                        try {
                          const res = await fetch("/api/categories", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newCatName.trim(), type: form.type, icon: newCatIcon, color: "#2563EB" }),
                          })
                          if (res.ok) {
                            const cat = await res.json()
                            setCategories((prev) => [...prev, cat])
                            setForm((prev) => ({ ...prev, categoryId: cat.id }))
                            setShowAddCategory(false)
                            setNewCatName("")
                            setNewCatIcon("📁")
                          }
                        } catch (err) {
                          console.error("Failed to add category:", err)
                        }
                      }}
                      style={{ flex: 1, height: "32px", borderRadius: "8px", background: "#2563EB", color: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "none" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
              <button type="button" onClick={() => { setModalOpen(false); setEditingTx(null) }} style={{ flex: 1, height: "44px", borderRadius: "9999px", border: "1px solid #E5E7EB", background: "white", fontSize: "14px", fontWeight: 500, color: "#111111", cursor: "pointer" }}>Cancel</button>
              <button type="submit" style={{ flex: 1, height: "44px", borderRadius: "9999px", background: "#2563EB", color: "white", fontSize: "14px", fontWeight: 500, cursor: "pointer", border: "none" }}>{editingTx ? "Save Changes" : "Add Transaction"}</button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
