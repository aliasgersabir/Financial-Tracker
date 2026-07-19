"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

const typeConfig: Record<string, { color: string; icon: string }> = {
  bill: { color: "#DC2626", icon: "📄" },
  goal: { color: "#8B5CF6", icon: "🎯" },
  budget: { color: "#F59E0B", icon: "📊" },
  report: { color: "#2563EB", icon: "📈" },
  import: { color: "#16A34A", icon: "📥" },
  security: { color: "#6B7280", icon: "🔒" },
  system: { color: "#9CA3AF", icon: "⚙️" },
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function NotificationsPage() {
  const { status } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null)
  const [markAllHovered, setMarkAllHovered] = useState(false)
  const [clearHovered, setClearHovered] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") fetchNotifications()
  }, [status])

  const fetchNotifications = async () => {
    const res = await fetch("/api/notifications?limit=100")
    const data = await res.json()
    setNotifications(data.notifications)
    setUnreadCount(data.unreadCount)
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PUT" })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const clearRead = async () => {
    await fetch("/api/notifications/read-all", { method: "DELETE" })
    setNotifications((prev) => prev.filter((n) => !n.isRead))
  }

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead
    if (filter === "bills") return n.type === "bill"
    if (filter === "goals") return n.type === "goal"
    if (filter === "budgets") return n.type === "budget"
    return true
  })

  const handleClick = (n: Notification) => {
    if (!n.isRead) markAsRead(n.id)
    if (n.link) window.location.href = n.link
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "bills", label: "Bills" },
    { key: "goals", label: "Goals" },
    { key: "budgets", label: "Budgets" },
  ]

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Notifications</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={markAllRead}
            onMouseEnter={() => setMarkAllHovered(true)}
            onMouseLeave={() => setMarkAllHovered(false)}
            disabled={unreadCount === 0}
            style={{
              borderRadius: "9999px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 150ms ease",
              cursor: unreadCount === 0 ? "not-allowed" : "pointer",
              background: markAllHovered && unreadCount > 0 ? "#1D4ED8" : "#2563EB",
              color: "white",
              opacity: unreadCount === 0 ? 0.5 : 1,
            }}
          >
            Mark All Read
          </button>
          <button
            onClick={clearRead}
            onMouseEnter={() => setClearHovered(true)}
            onMouseLeave={() => setClearHovered(false)}
            style={{
              borderRadius: "9999px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 500,
              transition: "all 150ms ease",
              cursor: "pointer",
              background: clearHovered ? "#F3F4F6" : "white",
              color: "#111111",
              border: "1px solid #E5E7EB",
            }}
          >
            Clear Read
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "6px", background: "white", borderRadius: "9999px", padding: "4px", border: "1px solid #E5E7EB", width: "fit-content" }}>
        {filterTabs.map((tab) => {
          const isActive = filter === tab.key
          const isHovered = hoveredFilter === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              onMouseEnter={() => setHoveredFilter(tab.key)}
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
              {tab.label}
            </button>
          )
        })}
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "white", borderRadius: "20px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {filtered.map((n, i) => {
            const config = typeConfig[n.type] || typeConfig.system
            const isHovered = hoveredItem === n.id
            return (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                onMouseEnter={() => setHoveredItem(n.id)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "14px",
                  padding: "16px 20px",
                  cursor: "pointer",
                  background: !n.isRead ? "#F8FAFF" : isHovered ? "#FAFAFA" : "white",
                  transition: "background 150ms ease",
                  borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none",
                }}
              >
                {!n.isRead && (
                  <div style={{ width: "8px", height: "8px", borderRadius: "9999px", background: "#2563EB", marginTop: "6px", flexShrink: 0 }} />
                )}
                <div
                  style={{
                    display: "flex",
                    width: "40px",
                    height: "40px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "10px",
                    fontSize: "18px",
                    backgroundColor: config.color + "15",
                    flexShrink: 0,
                  }}
                >
                  {config.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "14px", fontWeight: n.isRead ? 400 : 600, color: "#111111", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: "13px", color: "#6B7280", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {n.message}
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: "#9CA3AF", flexShrink: 0, marginTop: "2px" }}>
                  {timeAgo(n.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>🔔</span>
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No notifications</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF" }}>
            {filter === "unread" ? "You're all caught up!" : "Notifications will appear here"}
          </p>
        </div>
      )}
    </div>
  )
}
