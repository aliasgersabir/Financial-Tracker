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
  "#2563EB", "#6B7280", "#16A34A", "#F59E0B",
  "#DC2626", "#8B5CF6", "#EC4899", "#06B6D4",
  "#F97316", "#84CC16",
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
    color: "#2563EB",
  })

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

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
    setForm({ name: "", type: "expense", icon: "📦", color: "#2563EB" })
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#2563EB]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-[#111111] tracking-tight">Categories</h1>
          <p className="text-[15px] text-[#6B7280] mt-0.5">Organize your transactions</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setForm({ name: "", type: "expense", icon: "📦", color: "#2563EB" })
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      <div className="flex gap-1.5 bg-white rounded-full p-1 border border-[#E5E7EB] w-fit">
        {["all", "expense", "income"].map((type) => (
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
            {type !== "all" && (
              <span className="ml-1.5 text-[11px] opacity-60">
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
                <h2 className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
                  Expense
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group relative rounded-[16px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer"
                      onClick={() => openEdit(cat)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-[10px] text-lg"
                          style={{ backgroundColor: cat.color + "15" }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(cat)
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#F3F4F6] cursor-pointer"
                          >
                            <Pencil className="h-3 w-3 text-[#6B7280]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cat.id)
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 text-[#DC2626]" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[13px] font-medium text-[#111111] truncate">{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {(filterType === "all" || filterType === "income") &&
            incomeCategories.length > 0 && (
              <div>
                <h2 className="text-[13px] font-medium text-[#9CA3AF] uppercase tracking-wider mb-3">
                  Income
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="group relative rounded-[16px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer"
                      onClick={() => openEdit(cat)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-[10px] text-lg"
                          style={{ backgroundColor: cat.color + "15" }}
                        >
                          {cat.icon}
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(cat)
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#F3F4F6] cursor-pointer"
                          >
                            <Pencil className="h-3 w-3 text-[#6B7280]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cat.id)
                            }}
                            className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-[#FEF2F2] cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 text-[#DC2626]" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[13px] font-medium text-[#111111] truncate">{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-16 w-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-4">
            <span className="text-2xl">🏷️</span>
          </div>
          <p className="text-[16px] font-medium text-[#111111] mb-1">No categories yet</p>
          <p className="text-[14px] text-[#9CA3AF] mb-6">Add categories to organize your transactions</p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-5 py-2.5 text-[14px] font-medium text-white hover:bg-[#1D4ED8] transition-all duration-150 cursor-pointer"
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
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">
              Category Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
              placeholder="e.g. Groceries"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {["expense", "income"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, type })}
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
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Icon</label>
            <div className="grid grid-cols-10 gap-1.5 max-h-32 overflow-y-auto p-0.5">
              {emojiIcons.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-base transition-all duration-150 cursor-pointer ${
                    form.icon === emoji
                      ? "bg-[#EFF6FF] ring-2 ring-[#2563EB] scale-110"
                      : "hover:bg-[#F3F4F6]"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">Color</label>
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
                setEditingCategory(null)
              }}
              className="flex-1 h-11 rounded-full border border-[#E5E7EB] bg-white text-[14px] font-medium text-[#111111] hover:bg-[#F9FAFB] transition-all duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-full bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm cursor-pointer"
            >
              {editingCategory ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
