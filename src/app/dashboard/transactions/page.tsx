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
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-gray-500 mt-1">Track your income and expenses</p>
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
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Transaction
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-xl border-2 border-gray-200 bg-white pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          {["all", "income", "expense"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
                filterType === type
                  ? "bg-indigo-600 text-white"
                  : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filteredTransactions.length > 0 ? (
        <div className="rounded-2xl border-2 border-gray-100 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Transaction
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Account
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg">
                          {tx.category?.icon || "💰"}
                        </div>
                        <span className="font-medium text-sm">{tx.description}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.category?.name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tx.account?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(tx.date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-semibold ${
                          tx.type === "income" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(tx)}
                          className="rounded-lg p-1.5 hover:bg-gray-100 cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="rounded-lg p-1.5 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-6xl mb-4">💸</p>
          <p className="text-lg font-medium mb-2">
            {search || filterType !== "all"
              ? "No matching transactions"
              : "No transactions yet"}
          </p>
          <p className="text-sm mb-6">
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["expense", "income"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setForm({ ...form, type, categoryId: "" })
                  }
                  className={`rounded-xl border-2 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                    form.type === type
                      ? type === "income"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Coffee at Starbucks"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Account
            </label>
            <select
              value={form.accountId}
              onChange={(e) =>
                setForm({ ...form, accountId: e.target.value })
              }
              className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer"
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto p-1">
              <button
                type="button"
                onClick={() => setForm({ ...form, categoryId: "" })}
                className={`rounded-xl border-2 p-2 text-xs font-medium transition-all cursor-pointer ${
                  !form.categoryId
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                None
              </button>
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setForm({ ...form, categoryId: cat.id })}
                  className={`rounded-xl border-2 p-2 text-xs font-medium transition-all cursor-pointer ${
                    form.categoryId === cat.id
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="text-lg">{cat.icon}</span>
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
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {editingTx ? "Save Changes" : "Add Transaction"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
