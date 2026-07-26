"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useMemo, useCallback } from "react"
import { ChevronLeft, ChevronRight, Plus, Check, X } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  amount?: number | null
  accountId?: string | null
  categoryId?: string | null
  date: string
  endDate?: string | null
  type: string
  recurrence: string
  recurrenceInterval: number
  reminderBefore?: number | null
  isCompleted: boolean
  account?: { id: string; name: string } | null
  category?: { id: string; name: string; icon: string; color: string } | null
}

interface Account { id: string; name: string }
interface Category { id: string; name: string; icon: string; color: string }

const TYPE_COLORS: Record<string, string> = {
  bill: "#DC2626",
  income: "#16A34A",
  goal_deadline: "#8B5CF6",
  subscription: "#F59E0B",
  custom: "#6B7280",
}

const TYPE_BG: Record<string, string> = {
  bill: "#FEF2F2",
  income: "#F0FDF4",
  goal_deadline: "#F5F3FF",
  subscription: "#FFFBEB",
  custom: "#F3F4F6",
}

const TYPES = ["bill", "income", "goal_deadline", "subscription", "custom"]
const RECURRENCES = ["none", "daily", "weekly", "monthly", "yearly"]
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatMonth(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0]
}

function toLocalDateStr(dateStr: string) {
  const d = new Date(dateStr)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function CalendarPage() {
  const { status } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()))
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    accountId: "",
    categoryId: "",
    date: formatDate(new Date()),
    endDate: "",
    type: "custom",
    recurrence: "none",
    recurrenceInterval: "1",
    reminderBefore: "",
  })

  const [addBtnHovered, setAddBtnHovered] = useState(false)
  const [cancelBtnHovered, setCancelBtnHovered] = useState(false)
  const [submitBtnHovered, setSubmitBtnHovered] = useState(false)
  const [prevHovered, setPrevHovered] = useState(false)
  const [nextHovered, setNextHovered] = useState(false)
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
  const [completeHovered, setCompleteHovered] = useState<string | null>(null)
  const [hoveredType, setHoveredType] = useState<string | null>(null)
  const [hoveredRecurrence, setHoveredRecurrence] = useState<string | null>(null)
  const [inputFocused, setInputFocused] = useState<string | null>(null)
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
    if (status === "authenticated") {
      fetchEvents()
      fetchAccounts()
      fetchCategories()
    }
  }, [status, currentMonth])

  const fetchEvents = useCallback(async () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const start = new Date(year, month, 1)
    const end = new Date(year, month + 1, 0, 23, 59, 59)
    const res = await fetch(`/api/events?start=${start.toISOString()}&end=${end.toISOString()}`)
    const data = await res.json()
    setEvents(data)
    setLoading(false)
  }, [currentMonth])

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts")
    const data = await res.json()
    setAccounts(data)
  }

  const fetchCategories = async () => {
    const res = await fetch("/api/categories")
    const data = await res.json()
    setCategories(data)
  }

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: { date: string; day: number; isCurrentMonth: boolean }[] = []

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({ date: formatDate(d), day: daysInPrevMonth - i, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({ date: formatDate(d), day: i, isCurrentMonth: true })
    }

    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: formatDate(d), day: i, isCurrentMonth: false })
    }

    return days
  }, [currentMonth])

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach((ev) => {
      const key = toLocalDateStr(ev.date)
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  const selectedDayEvents = eventsByDate[selectedDate] || []

  const today = formatDate(new Date())

  const handlePrevMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() - 1)
    setCurrentMonth(d)
  }

  const handleNextMonth = () => {
    const d = new Date(currentMonth)
    d.setMonth(d.getMonth() + 1)
    setCurrentMonth(d)
  }

  const openAdd = (dateStr?: string) => {
    setEditingEvent(null)
    setForm({
      title: "",
      description: "",
      amount: "",
      accountId: "",
      categoryId: "",
      date: dateStr || selectedDate || formatDate(new Date()),
      endDate: "",
      type: "custom",
      recurrence: "none",
      recurrenceInterval: "1",
      reminderBefore: "",
    })
    setModalOpen(true)
  }

  const openEdit = (ev: CalendarEvent) => {
    setEditingEvent(ev)
    setForm({
      title: ev.title,
      description: ev.description || "",
      amount: ev.amount ? String(ev.amount) : "",
      accountId: ev.accountId || "",
      categoryId: ev.categoryId || "",
      date: toLocalDateStr(ev.date),
      endDate: ev.endDate ? toLocalDateStr(ev.endDate) : "",
      type: ev.type,
      recurrence: ev.recurrence,
      recurrenceInterval: String(ev.recurrenceInterval),
      reminderBefore: ev.reminderBefore ? String(ev.reminderBefore) : "",
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      amount: form.amount || undefined,
      accountId: form.accountId || undefined,
      categoryId: form.categoryId || undefined,
      endDate: form.endDate || undefined,
      reminderBefore: form.reminderBefore || undefined,
    }

    const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events"
    const method = editingEvent ? "PUT" : "POST"

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setModalOpen(false)
    setEditingEvent(null)
    fetchEvents()
  }

  const handleComplete = async (id: string) => {
    await fetch(`/api/events/${id}/complete`, { method: "POST" })
    fetchEvents()
  }

  const getEventsForDate = (dateStr: string) => eventsByDate[dateStr] || []

  const inputStyle = (field: string): React.CSSProperties => ({
    height: "44px",
    width: "100%",
    borderRadius: "12px",
    border: inputFocused === field ? "1px solid #2563EB" : "1px solid #E5E7EB",
    background: "white",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111111",
    outline: "none",
    transition: "all 150ms ease",
    boxShadow: inputFocused === field ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
  })

  const selectStyle: React.CSSProperties = {
    height: "44px",
    width: "100%",
    borderRadius: "12px",
    border: "1px solid #E5E7EB",
    background: "white",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111111",
    outline: "none",
    appearance: "none" as const,
    cursor: "pointer",
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
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
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Financial Calendar</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Track bills, income, and financial deadlines</p>
        </div>
        <button
          onClick={() => openAdd()}
          onMouseEnter={() => setAddBtnHovered(true)}
          onMouseLeave={() => setAddBtnHovered(false)}
          onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.98)" }}
          onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)" }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: isMobile ? "center" : "flex-start",
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
          Add Event
        </button>
      </div>

      {/* Month Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? "16px" : "24px" }}>
        <button
          onClick={handlePrevMonth}
          onMouseEnter={() => setPrevHovered(true)}
          onMouseLeave={() => setPrevHovered(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "9999px",
            border: "1px solid #E5E7EB",
            background: prevHovered ? "#F9FAFB" : "white",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          <ChevronLeft style={{ width: "18px", height: "18px", color: "#111111" }} />
        </button>
        <h2 style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: 600, color: "#111111", minWidth: isMobile ? "140px" : "180px", textAlign: "center" }}>
          {formatMonth(currentMonth)}
        </h2>
        <button
          onClick={handleNextMonth}
          onMouseEnter={() => setNextHovered(true)}
          onMouseLeave={() => setNextHovered(false)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "9999px",
            border: "1px solid #E5E7EB",
            background: nextHovered ? "#F9FAFB" : "white",
            cursor: "pointer",
            transition: "all 150ms ease",
          }}
        >
          <ChevronRight style={{ width: "18px", height: "18px", color: "#111111" }} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div style={{ background: "white", borderRadius: "20px", padding: isMobile ? "12px" : "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #F3F4F6" }}>
        {/* Weekday Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "8px" }}>
          {WEEKDAYS.map((day) => (
            <div key={day} style={{ textAlign: "center", fontSize: "12px", fontWeight: 600, color: "#9CA3AF", padding: isMobile ? "4px 0" : "8px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {isMobile ? day.charAt(0) : day}
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {calendarDays.map((cell) => {
            const dayEvents = getEventsForDate(cell.date)
            const isSelected = cell.date === selectedDate
            const isToday = cell.date === today
            const isHovered = hoveredDay === cell.date

            return (
              <div
                key={cell.date}
                onClick={() => setSelectedDate(cell.date)}
                onMouseEnter={() => setHoveredDay(cell.date)}
                onMouseLeave={() => setHoveredDay(null)}
                style={{
                  position: "relative",
                  borderRadius: "12px",
                  padding: isMobile ? "4px" : "6px",
                  minHeight: isMobile ? "40px" : "60px",
                  cursor: "pointer",
                  background: isSelected ? "#EFF6FF" : isHovered ? "#F9FAFB" : "transparent",
                  border: isToday ? "2px solid #2563EB" : "2px solid transparent",
                  transition: "all 150ms ease",
                }}
              >
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: isMobile ? "22px" : "26px",
                  height: isMobile ? "22px" : "26px",
                  borderRadius: "9999px",
                  fontSize: isMobile ? "11px" : "13px",
                  fontWeight: 500,
                  color: !cell.isCurrentMonth ? "#D1D5DB" : isToday ? "#2563EB" : "#111111",
                  background: isToday && !isSelected ? "#2563EB" : "transparent",
                  ...(isToday && !isSelected ? { color: "white" } : {}),
                  margin: "0 auto 4px auto",
                }}>
                  {cell.day}
                </span>
                {!isMobile && dayEvents.length > 0 && (
                  <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "center" }}>
                    {dayEvents.slice(0, 4).map((ev) => (
                      <div
                        key={ev.id}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "9999px",
                          backgroundColor: TYPE_COLORS[ev.type] || "#6B7280",
                          opacity: ev.isCompleted ? 0.4 : 1,
                        }}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span style={{ fontSize: "9px", color: "#9CA3AF" }}>+{dayEvents.length - 4}</span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Day Events */}
      <div style={{ background: "white", borderRadius: "20px", padding: isMobile ? "16px" : "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", border: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", marginBottom: "16px", gap: isMobile ? "12px" : "0" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#111111" }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            {selectedDayEvents.length > 0 && (
              <p style={{ fontSize: "13px", color: "#9CA3AF", marginTop: "2px" }}>
                {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => openAdd(selectedDate)}
            onMouseEnter={() => setAddBtnHovered(true)}
            onMouseLeave={() => setAddBtnHovered(false)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              borderRadius: "9999px",
              background: addBtnHovered ? "#1D4ED8" : "#2563EB",
              padding: "8px 16px",
              fontSize: "13px",
              fontWeight: 500,
              color: "white",
              transition: "all 150ms ease",
              cursor: "pointer",
            }}
          >
            <Plus style={{ width: "14px", height: "14px" }} />
            Add
          </button>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "9999px", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "20px" }}>📅</span>
            </div>
            <p style={{ fontSize: "14px", color: "#9CA3AF" }}>No events for this day</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {selectedDayEvents.map((ev) => (
              <div
                key={ev.id}
                onMouseEnter={() => setHoveredEvent(ev.id)}
                onMouseLeave={() => setHoveredEvent(null)}
                onClick={() => openEdit(ev)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: isMobile ? "10px 12px" : "12px 16px",
                  borderRadius: "12px",
                  background: hoveredEvent === ev.id ? "#F9FAFB" : "white",
                  border: "1px solid #F3F4F6",
                  cursor: "pointer",
                  transition: "all 150ms ease",
                  opacity: ev.isCompleted ? 0.6 : 1,
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: TYPE_BG[ev.type] || "#F3F4F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "9999px", backgroundColor: TYPE_COLORS[ev.type] || "#6B7280" }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "#111111",
                      textDecoration: ev.isCompleted ? "line-through" : "none",
                    }}>
                      {ev.title}
                    </span>
                    {!isMobile && (
                      <span style={{
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: TYPE_BG[ev.type],
                        color: TYPE_COLORS[ev.type],
                      }}>
                        {ev.type.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                    {ev.amount != null && (
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>
                        ${ev.amount.toFixed(2)}
                      </span>
                    )}
                    {ev.category && (
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        {ev.category.icon} {ev.category.name}
                      </span>
                    )}
                    {ev.account && (
                      <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
                        {ev.account.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleComplete(ev.id)
                  }}
                  onMouseEnter={() => setCompleteHovered(ev.id)}
                  onMouseLeave={() => setCompleteHovered(null)}
                  style={{
                    display: "flex",
                    width: "32px",
                    height: "32px",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "9999px",
                    border: ev.isCompleted ? "none" : "1px solid #E5E7EB",
                    background: ev.isCompleted ? "#16A34A" : completeHovered === ev.id ? "#F3F4F6" : "white",
                    cursor: "pointer",
                    transition: "all 150ms ease",
                    flexShrink: 0,
                  }}
                  title={ev.isCompleted ? "Mark incomplete" : "Mark complete"}
                >
                  {ev.isCompleted ? (
                    <Check style={{ width: "14px", height: "14px", color: "white" }} />
                  ) : (
                    <div style={{ width: "14px", height: "14px", borderRadius: "9999px", border: "1.5px solid #D1D5DB" }} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingEvent(null)
        }}
        title={editingEvent ? "Edit Event" : "Add Event"}
      >
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              onFocus={() => setInputFocused("title")}
              onBlur={() => setInputFocused(null)}
              style={inputStyle("title")}
              placeholder="e.g. Rent Payment"
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              onFocus={() => setInputFocused("description")}
              onBlur={() => setInputFocused(null)}
              style={inputStyle("description")}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              onFocus={() => setInputFocused("amount")}
              onBlur={() => setInputFocused(null)}
              style={inputStyle("amount")}
              placeholder="0.00"
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Type</label>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {TYPES.map((t) => {
                const isActive = form.type === t
                const isHover = hoveredType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    onMouseEnter={() => setHoveredType(t)}
                    onMouseLeave={() => setHoveredType(null)}
                    style={{
                      borderRadius: "9999px",
                      padding: "6px 14px",
                      fontSize: "13px",
                      fontWeight: 500,
                      transition: "all 150ms ease",
                      cursor: "pointer",
                      border: isActive ? `1px solid ${TYPE_COLORS[t]}` : "1px solid #E5E7EB",
                      background: isActive ? TYPE_BG[t] : isHover ? "#F9FAFB" : "white",
                      color: isActive ? TYPE_COLORS[t] : "#6B7280",
                    }}
                  >
                    {t.replace("_", " ")}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={{ ...inputStyle("date"), colorScheme: "light" }}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>End Date</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                style={{ ...inputStyle("endDate"), colorScheme: "light" }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Recurrence</label>
              <select
                value={form.recurrence}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value })}
                style={selectStyle}
              >
                {RECURRENCES.map((r) => (
                  <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Interval</label>
              <input
                type="number"
                min="1"
                value={form.recurrenceInterval}
                onChange={(e) => setForm({ ...form, recurrenceInterval: e.target.value })}
                onFocus={() => setInputFocused("interval")}
                onBlur={() => setInputFocused(null)}
                style={inputStyle("interval")}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Account</label>
              <select
                value={form.accountId}
                onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                style={selectStyle}
              >
                <option value="">None</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Category</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                style={selectStyle}
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Remind Before (minutes)</label>
            <input
              type="number"
              min="0"
              value={form.reminderBefore}
              onChange={(e) => setForm({ ...form, reminderBefore: e.target.value })}
              onFocus={() => setInputFocused("reminder")}
              onBlur={() => setInputFocused(null)}
              style={inputStyle("reminder")}
              placeholder="e.g. 30"
            />
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "8px" }}>
            <button
              type="button"
              onClick={() => {
                setModalOpen(false)
                setEditingEvent(null)
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
              {editingEvent ? "Save Changes" : "Add Event"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
