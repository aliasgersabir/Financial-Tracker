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
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null)
  const [addBtnHovered, setAddBtnHovered] = useState(false)
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false)
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false)
  const [editBtnHover, setEditBtnHover] = useState<string | null>(null)
  const [deleteBtnHover, setDeleteBtnHover] = useState<string | null>(null)
  const [hoveredIcon, setHoveredIcon] = useState<string | null>(null)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  const [emptyAddHovered, setEmptyAddHovered] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

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
    setForm({ name: "", type: filterType === "all" ? "expense" : filterType, icon: "📦", color: "#2563EB" })
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Categories</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Organize your transactions</p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null)
            setForm({ name: "", type: filterType === "all" ? "expense" : filterType, icon: "📦", color: "#2563EB" })
            setModalOpen(true)
          }}
          onMouseEnter={() => setAddBtnHovered(true)}
          onMouseLeave={() => setAddBtnHovered(false)}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            borderRadius: "9999px",
            background: addBtnHovered ? "#1D4ED8" : "#2563EB",
            padding: "10px 20px",
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
      </div>

      <div style={{ display: "flex", gap: "6px", background: "white", borderRadius: "9999px", padding: "4px", border: "1px solid #E5E7EB", width: "fit-content" }}>
        {["all", "expense", "income"].map((type) => {
          const isActive = filterType === type
          const isHovered = hoveredFilter === type
          return (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              onMouseEnter={() => setHoveredFilter(type)}
              onMouseLeave={() => setHoveredFilter(null)}
              style={{
                borderRadius: "9999px",
                padding: "6px 16px",
                fontSize: "13px",
                fontWeight: 500,
                transition: "all 150ms ease",
                cursor: "pointer",
                background: isActive ? "#111111" : "transparent",
                color: isActive ? "white" : isHovered ? "#111111" : "#6B7280",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
              {type !== "all" && (
                <span style={{ marginLeft: "6px", fontSize: "11px", opacity: 0.6 }}>
                  ({categories.filter((c) => c.type === type).length})
                </span>
              )}
            </button>
          )
        })}
      </div>

      {filteredCategories.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {(filterType === "all" || filterType === "expense") &&
            expenseCategories.length > 0 && (
              <div>
                <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                  Expense
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                  {expenseCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onMouseEnter={() => setHoveredCard(cat.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => openEdit(cat)}
                      style={{
                        position: "relative",
                        borderRadius: "16px",
                        background: "white",
                        padding: "16px",
                        boxShadow: hoveredCard === cat.id ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                        transition: "all 200ms ease",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div
                          style={{ display: "flex", width: "40px", height: "40px", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontSize: "18px", backgroundColor: cat.color + "15" }}
                        >
                          {cat.icon}
                        </div>
                        <div style={{ display: "flex", gap: "2px", opacity: hoveredCard === cat.id ? 1 : 0, transition: "opacity 150ms ease" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(cat)
                            }}
                            onMouseEnter={() => setEditBtnHover(cat.id)}
                            onMouseLeave={() => setEditBtnHover(null)}
                            style={{
                              display: "flex",
                              width: "24px",
                              height: "24px",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "9999px",
                              background: editBtnHover === cat.id ? "#F3F4F6" : "transparent",
                              cursor: "pointer",
                              transition: "background 150ms ease",
                            }}
                          >
                            <Pencil style={{ width: "12px", height: "12px", color: "#6B7280" }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cat.id)
                            }}
                            onMouseEnter={() => setDeleteBtnHover(cat.id)}
                            onMouseLeave={() => setDeleteBtnHover(null)}
                            style={{
                              display: "flex",
                              width: "24px",
                              height: "24px",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "9999px",
                              background: deleteBtnHover === cat.id ? "#FEF2F2" : "transparent",
                              cursor: "pointer",
                              transition: "background 150ms ease",
                            }}
                          >
                            <Trash2 style={{ width: "12px", height: "12px", color: "#DC2626" }} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {(filterType === "all" || filterType === "income") &&
            incomeCategories.length > 0 && (
              <div>
                <h2 style={{ fontSize: "13px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>
                  Income
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                  {incomeCategories.map((cat) => (
                    <div
                      key={cat.id}
                      onMouseEnter={() => setHoveredCard(cat.id)}
                      onMouseLeave={() => setHoveredCard(null)}
                      onClick={() => openEdit(cat)}
                      style={{
                        position: "relative",
                        borderRadius: "16px",
                        background: "white",
                        padding: "16px",
                        boxShadow: hoveredCard === cat.id ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                        transition: "all 200ms ease",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div
                          style={{ display: "flex", width: "40px", height: "40px", alignItems: "center", justifyContent: "center", borderRadius: "10px", fontSize: "18px", backgroundColor: cat.color + "15" }}
                        >
                          {cat.icon}
                        </div>
                        <div style={{ display: "flex", gap: "2px", opacity: hoveredCard === cat.id ? 1 : 0, transition: "opacity 150ms ease" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openEdit(cat)
                            }}
                            onMouseEnter={() => setEditBtnHover(cat.id)}
                            onMouseLeave={() => setEditBtnHover(null)}
                            style={{
                              display: "flex",
                              width: "24px",
                              height: "24px",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "9999px",
                              background: editBtnHover === cat.id ? "#F3F4F6" : "transparent",
                              cursor: "pointer",
                              transition: "background 150ms ease",
                            }}
                          >
                            <Pencil style={{ width: "12px", height: "12px", color: "#6B7280" }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(cat.id)
                            }}
                            onMouseEnter={() => setDeleteBtnHover(cat.id)}
                            onMouseLeave={() => setDeleteBtnHover(null)}
                            style={{
                              display: "flex",
                              width: "24px",
                              height: "24px",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "9999px",
                              background: deleteBtnHover === cat.id ? "#FEF2F2" : "transparent",
                              cursor: "pointer",
                              transition: "background 150ms ease",
                            }}
                          >
                            <Trash2 style={{ width: "12px", height: "12px", color: "#DC2626" }} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cat.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>🏷️</span>
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No categories yet</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>Add categories to organize your transactions</p>
          <button
            onClick={() => {
              setForm({ name: "", type: filterType === "all" ? "expense" : filterType, icon: "📦", color: "#2563EB" })
              setModalOpen(true)
            }}
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
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
              Category Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{
                height: "44px",
                width: "100%",
                borderRadius: "12px",
                border: inputFocused ? "1px solid #2563EB" : "1px solid #E5E7EB",
                background: "white",
                padding: "0 14px",
                fontSize: "14px",
                color: "#111111",
                outline: "none",
                transition: "all 150ms ease",
                boxShadow: inputFocused ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
              }}
              placeholder="e.g. Groceries"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {["expense", "income"].map((type) => {
                const isActive = form.type === type
                const isIncome = type === "income"
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, type })}
                    style={{
                      borderRadius: "12px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 500,
                      transition: "all 150ms ease",
                      cursor: "pointer",
                      border: isActive
                        ? isIncome ? "1px solid #16A34A" : "1px solid #DC2626"
                        : "1px solid #E5E7EB",
                      background: isActive
                        ? isIncome ? "#F0FDF4" : "#FEF2F2"
                        : "transparent",
                      color: isActive
                        ? isIncome ? "#16A34A" : "#DC2626"
                        : "#6B7280",
                    }}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Icon</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "6px", maxHeight: "128px", overflowY: "auto", padding: "2px" }}>
              {emojiIcons.map((emoji) => {
                const isSelected = form.icon === emoji
                const isHovered = hoveredIcon === emoji
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setForm({ ...form, icon: emoji })}
                    onMouseEnter={() => setHoveredIcon(emoji)}
                    onMouseLeave={() => setHoveredIcon(null)}
                    style={{
                      display: "flex",
                      width: "36px",
                      height: "36px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "10px",
                      fontSize: "16px",
                      transition: "all 150ms ease",
                      cursor: "pointer",
                      background: isSelected ? "#EFF6FF" : isHovered ? "#F3F4F6" : "transparent",
                      boxShadow: isSelected ? "0 0 0 2px #2563EB" : "none",
                      transform: isSelected ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    {emoji}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Color</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {colors.map((color) => {
                const isSelected = form.color === color
                const isHovered = hoveredColor === color
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    onMouseEnter={() => setHoveredColor(color)}
                    onMouseLeave={() => setHoveredColor(null)}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9999px",
                      transition: "all 150ms ease",
                      cursor: "pointer",
                      backgroundColor: color,
                      boxShadow: isSelected ? "0 0 0 2px white, 0 0 0 4px #111111" : "none",
                      transform: isSelected ? "scale(1.1)" : isHovered ? "scale(1.05)" : "scale(1)",
                    }}
                  />
                )
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false)
                setEditingCategory(null)
              }}
              onMouseEnter={() => setCancelBtnHovered(true)}
              onMouseLeave={() => setCancelBtnHovered(false)}
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "9999px",
                border: "1px solid #E5E7EB",
                background: cancelBtnHovered ? "#F9FAFB" : "white",
                fontSize: "14px",
                fontWeight: 500,
                color: "#111111",
                transition: "all 150ms ease",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              onMouseEnter={() => setSubmitBtnHovered(true)}
              onMouseLeave={() => setSubmitBtnHovered(false)}
              style={{
                flex: 1,
                height: "44px",
                borderRadius: "9999px",
                background: submitBtnHovered ? "#1D4ED8" : "#2563EB",
                color: "white",
                fontSize: "14px",
                fontWeight: 500,
                transition: "all 150ms ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
            >
              {editingCategory ? "Save Changes" : "Add Category"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
