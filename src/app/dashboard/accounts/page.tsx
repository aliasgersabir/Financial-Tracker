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
  const [form, setForm] = useState({
    name: "",
    type: "checking",
    balance: "",
    color: "#2563EB",
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
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#2563EB]" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] tracking-tight">Accounts</h1>
          <p className="text-[15px] text-[#6B7280] mt-0.5">Manage your financial accounts</p>
        </div>
        <button
          onClick={() => {
            setEditingAccount(null)
            setForm({ name: "", type: "checking", balance: "", color: "#2563EB" })
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Account
        </button>
      </div>

      <div className="rounded-[20px] bg-[#111111] p-6 text-white">
        <p className="text-[13px] text-white/50 font-medium">Total Balance</p>
        <p className="text-[36px] font-semibold mt-1 tracking-tight">{formatCurrency(totalBalance)}</p>
        <p className="text-[13px] text-white/40 mt-2">
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
                className="rounded-[20px] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow duration-200 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white"
                    style={{ backgroundColor: account.color }}
                  >
                    {typeInfo && <typeInfo.icon className="h-5 w-5" />}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => openEdit(account)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#6B7280]" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-[#DC2626]" />
                    </button>
                  </div>
                </div>
                <h3 className="text-[15px] font-semibold text-[#111111]">{account.name}</h3>
                <p className="text-[13px] text-[#9CA3AF] capitalize">{account.type}</p>
                <p className="text-[22px] font-semibold text-[#111111] mt-3 tracking-tight">{formatCurrency(account.balance)}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
            <Wallet className="h-7 w-7 text-[#D1D5DB]" />
          </div>
          <p className="text-[16px] font-medium text-[#111111] mb-1">No accounts yet</p>
          <p className="text-[14px] text-[#9CA3AF] mb-6">Add your first account to start tracking</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8] transition-all duration-150 cursor-pointer"
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
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">
              Account Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
              placeholder="e.g. Main Checking"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">
              Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {accountTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                    form.type === type.value
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB] text-[#6B7280]"
                  }`}
                >
                  <type.icon className="h-5 w-5" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">
              Balance
            </label>
            <input
              type="number"
              step="0.01"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">
              Color
            </label>
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`h-8 w-8 rounded-full transition-all duration-150 cursor-pointer ${
                    form.color === color ? "ring-2 ring-offset-2 ring-[#111111] scale-110" : "hover:scale-105"
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
              className="flex-1 h-11 rounded-full border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111111] hover:bg-[#F9FAFB] transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-full bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm cursor-pointer"
            >
              {editingAccount ? "Save Changes" : "Add Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
