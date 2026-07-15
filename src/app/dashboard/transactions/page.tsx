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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

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
      type: "expense",
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
      <div className="flex items-center justify-center h-64">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#2563EB]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] tracking-tight">Transactions</h1>
          <p className="text-[15px] text-[#6B7280] mt-0.5">Track your income and expenses</p>
        </div>
        <button
          onClick={() => {
            setEditingTx(null)
            setForm({
              amount: "",
              description: "",
              date: new Date().toISOString().split("T")[0],
              type: "expense",
              accountId: accounts[0]?.id || "",
              categoryId: "",
            })
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-full border border-[#E5E7EB] bg-white pl-10 pr-4 text-[14px] text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
          />
        </div>
        <div className="flex gap-1.5 bg-white rounded-full p-1 border border-[#E5E7EB]">
          {["all", "income", "expense"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                filterType === type
                  ? "bg-[#111111] text-white"
                  : "text-[#6B7280] hover:text-[#111111]"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="rounded-[20px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  <th className="text-left px-6 py-3 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="text-left px-6 py-3 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider hidden sm:table-cell">
                    Account
                  </th>
                  <th className="text-left px-6 py-3 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-right px-6 py-3 text-[12px] font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors duration-150"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F9FAFB] text-base">
                          {tx.category?.icon || "💰"}
                        </div>
                        <span className="text-[14px] font-medium text-[#111111]">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-[#6B7280]">
                      {tx.category?.name || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-[#6B7280] hidden sm:table-cell">
                      {tx.account?.name}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-[#9CA3AF] hidden md:table-cell">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span
                        className={`text-[14px] font-semibold ${
                          tx.type === "income" ? "text-[#16A34A]" : "text-[#111111]"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex justify-end gap-0.5">
                        <button
                          onClick={() => openEdit(tx)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#F3F4F6] transition-colors cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[#6B7280]" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#DC2626]" />
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
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
            <Search className="h-6 w-6 text-[#D1D5DB]" />
          </div>
          <p className="text-[16px] font-medium text-[#111111] mb-1">
            {search || filterType !== "all"
              ? "No matching transactions"
              : "No transactions yet"}
          </p>
          <p className="text-[14px] text-[#9CA3AF]">
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {["expense", "income"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type, categoryId: "" })}
                  className={`rounded-xl border py-2.5 text-[13px] font-medium transition-all duration-150 cursor-pointer ${
                    form.type === type
                      ? type === "income"
                        ? "border-[#16A34A] bg-[#F0FDF4] text-[#16A34A]"
                        : "border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]"
                      : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Amount</label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
              placeholder="e.g. Coffee at Starbucks"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Account</label>
            <select
              value={form.accountId}
              onChange={(e) => setForm({ ...form, accountId: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:18px] bg-[right_12px_center] bg-no-repeat pr-10 transition-all duration-150"
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
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Category</label>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-0.5">
              <button
                type="button"
                onClick={() => setForm({ ...form, categoryId: "" })}
                className={`rounded-xl border p-2 text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                  !form.categoryId
                    ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                    : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                }`}
              >
                None
              </button>
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, categoryId: cat.id })}
                  className={`rounded-xl border p-2 text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                    form.categoryId === cat.id
                      ? "border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]"
                      : "border-[#E5E7EB] text-[#6B7280] hover:border-[#D1D5DB]"
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <br />
                  <span className="truncate block">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false)
                setEditingTx(null)
              }}
              className="flex-1 h-11 rounded-full border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111111] hover:bg-[#F9FAFB] transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-full bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm cursor-pointer"
            >
              {editingTx ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
