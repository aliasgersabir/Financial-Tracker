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
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
]

export default function AccountsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [form, setForm] = useState({
    name: "",
    type: "checking",
    balance: "",
    color: "#6366f1",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

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
    setForm({ name: "", type: "checking", balance: "", color: "#6366f1" })
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
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-gray-500 mt-1">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => {
            setEditingAccount(null)
            setForm({ name: "", type: "checking", balance: "", color: "#6366f1" })
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      <div className="rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
        <p className="text-sm text-white/80">Total Balance</p>
        <p className="text-4xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
        <p className="text-sm text-white/60 mt-2">
          Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const typeInfo = accountTypes.find((t) => t.value === account.type)
            return (
              <div
                key={account.id}
                className="rounded-2xl border-2 border-gray-100 bg-white p-6 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: account.color }}
                  >
                    {typeInfo && <typeInfo.icon className="h-6 w-6" />}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(account)}
                      className="rounded-lg p-1.5 hover:bg-gray-100 cursor-pointer"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="rounded-lg p-1.5 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold">{account.name}</h3>
                <p className="text-sm text-gray-500 capitalize">{account.type}</p>
                <p className="text-2xl font-bold mt-3">{formatCurrency(account.balance)}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-6xl mb-4">🏦</p>
          <p className="text-lg font-medium mb-2">No accounts yet</p>
          <p className="text-sm mb-6">Add your first account to start tracking</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Main Checking"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {accountTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium transition-all cursor-pointer ${
                    form.type === type.value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <type.icon className="h-5 w-5" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`h-8 w-8 rounded-full transition-all cursor-pointer ${
                    form.color === color ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false)
                setEditingAccount(null)
              }}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {editingAccount ? "Save Changes" : "Add Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
