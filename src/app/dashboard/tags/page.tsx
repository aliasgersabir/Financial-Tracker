"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface Tag {
  id: string
  name: string
  color: string
  _count?: { transactions: number }
}

const colors = [
  "#2563EB", "#6B7280", "#16A34A", "#F59E0B",
  "#DC2626", "#8B5CF6", "#EC4899", "#06B6D4",
  "#F97316", "#84CC16",
]

export default function TagsPage() {
  const { status } = useSession()
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [form, setForm] = useState({ name: "", color: "#2563EB" })
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [addBtnHovered, setAddBtnHovered] = useState(false)
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false)
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false)
  const [editBtnHover, setEditBtnHover] = useState<string | null>(null)
  const [deleteBtnHover, setDeleteBtnHover] = useState<string | null>(null)
  const [hoveredColor, setHoveredColor] = useState<string | null>(null)
  const [emptyAddHovered, setEmptyAddHovered] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteConfirmHovered, setDeleteConfirmHovered] = useState(false)
  const [deleteCancelHovered, setDeleteCancelHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

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
    if (status === "authenticated") fetchTags()
  }, [status])

  const fetchTags = async () => {
    const res = await fetch("/api/tags")
    const data = await res.json()
    setTags(data)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingTag
      ? `/api/tags/${editingTag.id}`
      : "/api/tags"
    const method = editingTag ? "PUT" : "POST"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })

    setModalOpen(false)
    setEditingTag(null)
    setForm({ name: "", color: "#2563EB" })
    fetchTags()
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/tags/${id}`, { method: "DELETE" })
    setDeleteConfirmId(null)
    fetchTags()
  }

  const openEdit = (tag: Tag) => {
    setEditingTag(tag)
    setForm({ name: tag.name, color: tag.color })
    setModalOpen(true)
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "24px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? "12px" : "0" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Tags</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Label and organize your transactions</p>
        </div>
        <button
          onClick={() => {
            setEditingTag(null)
            setForm({ name: "", color: "#2563EB" })
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
          Add Tag
        </button>
      </div>

      {tags.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: "12px" }}>
          {tags.map((tag) => (
            <div
              key={tag.id}
              onMouseEnter={() => setHoveredCard(tag.id)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: "relative",
                borderRadius: "16px",
                background: "white",
                padding: "16px",
                boxShadow: hoveredCard === tag.id ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                transition: "all 200ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "9999px", backgroundColor: tag.color }} />
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tag.name}</p>
                </div>
                <div style={{ display: "flex", gap: "2px", opacity: hoveredCard === tag.id ? 1 : 0, transition: "opacity 150ms ease" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openEdit(tag)
                    }}
                    onMouseEnter={() => setEditBtnHover(tag.id)}
                    onMouseLeave={() => setEditBtnHover(null)}
                    style={{
                      display: "flex",
                      width: "24px",
                      height: "24px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9999px",
                      background: editBtnHover === tag.id ? "#F3F4F6" : "transparent",
                      cursor: "pointer",
                      transition: "background 150ms ease",
                    }}
                  >
                    <Pencil style={{ width: "12px", height: "12px", color: "#6B7280" }} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirmId(tag.id)
                    }}
                    onMouseEnter={() => setDeleteBtnHover(tag.id)}
                    onMouseLeave={() => setDeleteBtnHover(null)}
                    style={{
                      display: "flex",
                      width: "24px",
                      height: "24px",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "9999px",
                      background: deleteBtnHover === tag.id ? "#FEF2F2" : "transparent",
                      cursor: "pointer",
                      transition: "background 150ms ease",
                    }}
                  >
                    <Trash2 style={{ width: "12px", height: "12px", color: "#DC2626" }} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "#9CA3AF" }}>
                {tag._count?.transactions ?? 0} transaction{(tag._count?.transactions ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>🏷️</span>
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No tags yet</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>Add tags to label and organize your transactions</p>
          <button
            onClick={() => {
              setForm({ name: "", color: "#2563EB" })
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
            Add Tag
          </button>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingTag(null)
        }}
        title={editingTag ? "Edit Tag" : "Add Tag"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>
              Tag Name
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
                setEditingTag(null)
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
              {editingTag ? "Save Changes" : "Add Tag"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Tag"
      >
        <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>
          Are you sure you want to delete this tag? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => setDeleteConfirmId(null)}
            onMouseEnter={() => setDeleteCancelHovered(true)}
            onMouseLeave={() => setDeleteCancelHovered(false)}
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "9999px",
              border: "1px solid #E5E7EB",
              background: deleteCancelHovered ? "#F9FAFB" : "white",
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
            type="button"
            onClick={() => {
              if (deleteConfirmId) handleDelete(deleteConfirmId)
            }}
            onMouseEnter={() => setDeleteConfirmHovered(true)}
            onMouseLeave={() => setDeleteConfirmHovered(false)}
            style={{
              flex: 1,
              height: "44px",
              borderRadius: "9999px",
              background: deleteConfirmHovered ? "#B91C1C" : "#DC2626",
              color: "white",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 150ms ease",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  )
}
