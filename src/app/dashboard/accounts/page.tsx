"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Plus, Wallet, CreditCard, Landmark, Banknote, Pencil, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Modal } from "@/components/ui/modal"

interface Account {
  id: string
  name: string
  type: string
  balance: number
  color: string
}

const accountTypes = [
  { value: "checking", label: "Checking", icon: Landmark },
  { value: "savings", label: "Savings", icon: Wallet },
  { value: "credit", label: "Credit Card", icon: CreditCard },
  { value: "cash", label: "Cash", icon: Banknote },
  { value: "investment", label: "Investment", icon: Wallet },
]

const colors = [
  "#2563EB", "#6B7280", "#16A34A", "#F59E0B",
  "#DC2626", "#8B5CF6", "#EC4899", "#06B6D4",
]

export default function AccountsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [form, setForm] = useState({
    name: "",
    type: "checking",
    balance: "",
    color: "#2563EB",
  })

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

  useEffect(() => {
    if (status === "authenticated") fetchAccounts()
  }, [status])

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts")
    const data = await res.json()
    setAccounts(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingAccount ? `/api/accounts/${editingAccount.id}` : "/api/accounts"
    const method = editingAccount ? "PUT" : "POST"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        balance: parseFloat(form.balance) || 0,
      }),
    })

    setModalOpen(false)
    setEditingAccount(null)
    setForm({ name: "", type: "checking", balance: "", color: "#2563EB" })
    fetchAccounts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this account?")) return
    await fetch(`/api/accounts/${id}`, { method: "DELETE" })
    fetchAccounts()
  }

  const openEdit = (account: Account) => {
    setEditingAccount(account)
    setForm({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      color: account.color,
    })
    setModalOpen(true)
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  if (status === "loading" || loading) {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid #E5E7EB", borderTopColor: "#2563EB", animation: "spin 1s linear infinite" }} />
        </div>
      </>
    )
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 20 : 32 }}>
        <div style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "stretch" : "center",
          justifyContent: "space-between",
          gap: isMobile ? 12 : 0,
        }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Accounts</h1>
            <p style={{ fontSize: isMobile ? 13 : 15, color: "#6B7280", marginTop: 2 }}>Manage your financial accounts</p>
          </div>
          <button
            onClick={() => {
              setEditingAccount(null)
              setForm({ name: "", type: "checking", balance: "", color: "#2563EB" })
              setModalOpen(true)
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 9999,
              background: "#2563EB",
              padding: isMobile ? "10px 16px" : "10px 20px",
              fontSize: isMobile ? 13 : 14,
              fontWeight: 500,
              color: "white",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              transition: "all 0.15s ease",
              border: "none",
              width: isMobile ? "100%" : undefined,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1D4ED8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
          >
            <Plus style={{ width: 16, height: 16 }} />
            Add Account
          </button>
        </div>

        <div style={{ borderRadius: 20, background: "#111111", padding: isMobile ? 16 : 24, color: "white" }}>
          <p style={{ fontSize: isMobile ? 12 : 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>Total Balance</p>
          <p style={{ fontSize: isMobile ? 28 : 36, fontWeight: 600, marginTop: 4, letterSpacing: "-0.025em" }}>{formatCurrency(totalBalance)}</p>
          <p style={{ fontSize: isMobile ? 12 : 13, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>
            Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>

        {accounts.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
            gap: isMobile ? 12 : 16,
          }}>
            {accounts.map((account) => {
              const typeInfo = accountTypes.find((t) => t.value === account.type)
              const isHovered = hoveredCard === account.id
              return (
                <div
                  key={account.id}
                  style={{
                    borderRadius: 20,
                    background: "white",
                    padding: isMobile ? 16 : 20,
                    boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                    transition: "box-shadow 0.2s ease",
                  }}
                  onMouseEnter={() => !isMobile && setHoveredCard(account.id)}
                  onMouseLeave={() => !isMobile && setHoveredCard(null)}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: isMobile ? 12 : 16 }}>
                    <div
                      style={{
                        display: "flex",
                        width: isMobile ? 36 : 40,
                        height: isMobile ? 36 : 40,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 12,
                        color: "white",
                        background: account.color,
                      }}
                    >
                      {typeInfo && <typeInfo.icon style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20 }} />}
                    </div>
                    <div style={{
                      display: "flex",
                      gap: 2,
                      opacity: isMobile ? 1 : (isHovered ? 1 : 0),
                      transition: "opacity 0.15s ease",
                    }}>
                      <button
                        onClick={() => openEdit(account)}
                        style={{
                          display: "flex",
                          width: 28,
                          height: 28,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                          background: "transparent",
                          border: "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Pencil style={{ width: 14, height: 14, color: "#6B7280" }} />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        style={{
                          display: "flex",
                          width: 28,
                          height: 28,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "50%",
                          cursor: "pointer",
                          transition: "background 0.15s ease",
                          background: "transparent",
                          border: "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <Trash2 style={{ width: 14, height: 14, color: "#DC2626" }} />
                      </button>
                    </div>
                  </div>
                  <h3 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: "#111111" }}>{account.name}</h3>
                  <p style={{ fontSize: isMobile ? 12 : 13, color: "#9CA3AF", textTransform: "capitalize" }}>{account.type}</p>
                  <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 600, color: "#111111", marginTop: isMobile ? 8 : 12, letterSpacing: "-0.025em" }}>{formatCurrency(account.balance)}</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "40px 0" : "80px 0" }}>
            <div style={{ width: isMobile ? 56 : 64, height: isMobile ? 56 : 64, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Wallet style={{ width: isMobile ? 24 : 28, height: isMobile ? 24 : 28, color: "#D1D5DB" }} />
            </div>
            <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 500, color: "#111111", marginBottom: 4 }}>No accounts yet</p>
            <p style={{ fontSize: isMobile ? 13 : 14, color: "#9CA3AF", marginBottom: 24 }}>Add your first account to start tracking</p>
            <button
              onClick={() => setModalOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 9999,
                background: "#2563EB",
                padding: isMobile ? "10px 16px" : "10px 20px",
                fontSize: isMobile ? 13 : 14,
                fontWeight: 500,
                color: "white",
                cursor: "pointer",
                transition: "all 0.15s ease",
                border: "none",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#1D4ED8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Add Account
            </button>
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setEditingAccount(null)
          }}
          title={editingAccount ? "Edit Account" : "Add Account"}
        >
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: isMobile ? 12 : 13, fontWeight: 500, color: "#111111", marginBottom: 6 }}>
                Account Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{
                  height: 44,
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  background: "white",
                  padding: "0 14px",
                  fontSize: isMobile ? 13 : 14,
                  color: "#111111",
                  outline: "none",
                  transition: "all 0.15s ease",
                  boxSizing: "border-box",
                }}
                placeholder="e.g. Main Checking"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: isMobile ? 12 : 13, fontWeight: 500, color: "#111111", marginBottom: 6 }}>
                Account Type
              </label>
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
                gap: isMobile ? 6 : 8,
              }}>
                {accountTypes.map((type) => {
                  const isSelected = form.type === type.value
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: type.value })}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        borderRadius: 12,
                        border: `1px solid ${isSelected ? "#2563EB" : "#E5E7EB"}`,
                        padding: isMobile ? 8 : 12,
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: isSelected ? "#EFF6FF" : "white",
                        color: isSelected ? "#2563EB" : "#6B7280",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = "#D1D5DB"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.borderColor = "#E5E7EB"
                      }}
                    >
                      <type.icon style={{ width: isMobile ? 18 : 20, height: isMobile ? 18 : 20 }} />
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: isMobile ? 12 : 13, fontWeight: 500, color: "#111111", marginBottom: 6 }}>
                Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={form.balance}
                onChange={(e) => setForm({ ...form, balance: e.target.value })}
                style={{
                  height: 44,
                  width: "100%",
                  borderRadius: 12,
                  border: "1px solid #E5E7EB",
                  background: "white",
                  padding: "0 14px",
                  fontSize: isMobile ? 13 : 14,
                  color: "#111111",
                  outline: "none",
                  transition: "all 0.15s ease",
                  boxSizing: "border-box",
                }}
                placeholder="0.00"
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: isMobile ? 12 : 13, fontWeight: 500, color: "#111111", marginBottom: 6 }}>
                Color
              </label>
              <div style={{ display: "flex", gap: isMobile ? 6 : 8, flexWrap: "wrap" }}>
                {colors.map((color) => {
                  const isSelected = form.color === color
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      style={{
                        width: isMobile ? 28 : 32,
                        height: isMobile ? 28 : 32,
                        borderRadius: "50%",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: color,
                        border: "none",
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                        boxShadow: isSelected ? "0 0 0 2px white, 0 0 0 4px #111111" : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = "scale(1.05)"
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.transform = "scale(1)"
                      }}
                    />
                  )
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  setEditingAccount(null)
                }}
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 9999,
                  border: "1px solid #E5E7EB",
                  background: "white",
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 500,
                  color: "#111111",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 9999,
                  background: "#2563EB",
                  color: "white",
                  fontSize: isMobile ? 13 : 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  border: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1D4ED8")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "#2563EB")}
              >
                {editingAccount ? "Save Changes" : "Add Account"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}
