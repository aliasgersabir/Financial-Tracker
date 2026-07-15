"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface Category {
  id: string
  name: string
  type: string
  icon: string
  color: string
}

const emojiIcons = [
  "🍔", "🚗", "🛍️", "🎬", "💡", "🏥", "📚", "📦", "☕", "🏠",
  "✈️", "🎮", "💊", "🐕", "🎁", "💰", "💻", "📈", "💵", "🏦",
  "🛒", "🎵", "📱", "🔧", "🏋️", "🎬", "👗", "🍕", "✈️", "🎉",
]

const colors = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f97316",
  "#10b981", "#3b82f6", "#f59e0b", "#ef4444",
  "#06b6d4", "#84cc16",
]

export default function CategoriesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [filterType, setFilterType] = useState("all")
  const [form, setForm] = useState({
    name: "",
    type: "expense",
    icon: "📦",
    color: "#6366f1",
  })

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  useEffect(() => {
    if (status === "authenticated") fetchCategories()
  }, [status])

  const fetchCategories = async () => {
    const res = await fetch("/api/categories")
    const data = await res.json()
    setCategories(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingCategory
      ? `/api/categories/${editingCategory.id}`
      : "/api/categories"
    const method = editingCategory ? "PUT" : "POST"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setModalOpen(false)
    setEditingCategory(null)
    setForm({ name: "", type: "expense", icon: "📦", color: "#6366f1" })
    fetchCategories()
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return
    await fetch(`/api/categories/${id}`, { method: "DELETE" })
    fetchCategories()
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setForm({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
    })
    setModalOpen(true)
  }

  const filteredCategories = categories.filter(
    (cat) => filterType === "all" || cat.type === filterType
  )

  const expenseCategories = filteredCategories.filter((c) => c.type === "expense")
  const incomeCategories = filteredCategories.filter((c) => c.type === "income")

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
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-gray-500 mt-1">Organize your transactions</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setForm({ name: "", type: "expense", icon: "📦", color: "#6366f1" })
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="flex gap-2">
        {["all", "expense", "income"].map((type) => (
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
            {type !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({categories.filter((c) => c.type === type).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredCategories.length > 0 ? (
        <div className="space-y-8">
          {(filterType === "all" || filterType === "expense") &&
            expenseCategories.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Expense Categories
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group relative rounded-2xl border-2 border-gray-100 bg-white p-4 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer"
                      onClick={() => openEdit(cat)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                          style={{ backgroundColor: cat.color + "20" }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(cat)
                            }}
                            className="rounded-lg p-1 hover:bg-gray-100 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cat.id)
                            }}
                            className="rounded-lg p-1 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate">{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {(filterType === "all" || filterType === "income") &&
            incomeCategories.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Income Categories
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group relative rounded-2xl border-2 border-gray-100 bg-white p-4 hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer"
                      onClick={() => openEdit(cat)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                          style={{ backgroundColor: cat.color + "20" }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(cat)
                            }}
                            className="rounded-lg p-1 hover:bg-gray-100 cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5 text-gray-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cat.id)
                            }}
                            className="rounded-lg p-1 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate">{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <p className="text-6xl mb-4">🏷️</p>
          <p className="text-lg font-medium mb-2">No categories yet</p>
          <p className="text-sm mb-6">Add categories to organize your transactions</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Category
          </button>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCategory(null)
        }}
        title={editingCategory ? "Edit Category" : "Add Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Groceries"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["expense", "income"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type })}
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
              Icon
            </label>
            <div className="grid grid-cols-10 gap-1.5 max-h-32 overflow-y-auto p-1">
              {emojiIcons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-all cursor-pointer ${
                    form.icon === emoji
                      ? "bg-indigo-100 ring-2 ring-indigo-500 scale-110"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
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
                setEditingCategory(null)
              }}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 font-medium hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-12 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all cursor-pointer"
            >
              {editingCategory ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
