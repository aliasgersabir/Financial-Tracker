"use client"

import { useSession, signOut } from "next-auth/react"
import { getInitials, CURRENCIES, getCurrency, setCurrency } from "@/lib/utils"
import { Bell, Calendar, ChevronLeft, ChevronRight, LogOut, User, Wallet, Settings } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  link: string | null
  createdAt: string
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function TopBar({ sidebarToggle }: { sidebarToggle?: React.ReactNode }) {
  const { data: session } = useSession()
  const [isDesktop, setIsDesktop] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [calMonth, setCalMonth] = useState(new Date().getMonth())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [currency, setCurrencyState] = useState("INR")

  const notifRef = useRef<HTMLDivElement>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const calRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await fetch("/api/notifications?limit=20")
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch {}
    }
    fetchNotifs()
    setCurrencyState(getCurrency())
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false)
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setShowAccount(false)
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCalendar(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" }).catch(() => {})
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const calDays = new Date(calYear, calMonth + 1, 0).getDate()
  const calFirstDay = new Date(calYear, calMonth, 1).getDay()
  const today = new Date()

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        height: "56px",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #F3F4F6",
        background: "rgba(248,248,246,0.8)",
        backdropFilter: "blur(24px)",
        paddingInline: isDesktop ? "16px" : "12px",
      }}
    >
      {/* Left: Toggle + Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
        {sidebarToggle}
        <Link
          href="/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            textDecoration: "none",
          }}
        >
          <div style={{
            display: "flex", height: "28px", width: "28px", alignItems: "center", justifyContent: "center",
            borderRadius: "8px", background: "#111111",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "white", letterSpacing: "-0.025em" }}>f</span>
          </div>
          <span style={{ fontSize: isDesktop ? "16px" : "15px", fontWeight: 600, color: "#111111", letterSpacing: "-0.025em" }}>
            FinOS
          </span>
        </Link>
      </div>

      {/* Right: Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {/* Calendar Icon */}
        <div ref={calRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowCalendar(!showCalendar); setShowNotifications(false); setShowAccount(false) }}
            style={{
              display: "flex", height: "34px", width: "34px", alignItems: "center", justifyContent: "center",
              borderRadius: "9999px", color: "#6B7280", cursor: "pointer", border: "none", background: showCalendar ? "#F3F4F6" : "transparent",
              transition: "background 150ms ease",
            }}
          >
            <Calendar style={{ height: "17px", width: "17px" }} />
          </button>
          {showCalendar && (
            <div style={{
              position: "absolute", top: "44px", right: 0, width: "300px",
              background: "white", borderRadius: "16px", border: "1px solid #E5E7EB",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)", padding: "16px", zIndex: 50,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1) } else setCalMonth(calMonth - 1) }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer" }}>
                  <ChevronLeft style={{ width: "14px", height: "14px", color: "#6B7280" }} />
                </button>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111111" }}>{MONTH_NAMES[calMonth]} {calYear}</span>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1) } else setCalMonth(calMonth + 1) }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer" }}>
                  <ChevronRight style={{ width: "14px", height: "14px", color: "#6B7280" }} />
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
                {WEEKDAYS.map((d) => (
                  <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: 600, color: "#9CA3AF", padding: "4px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {Array.from({ length: calFirstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: calDays }).map((_, i) => {
                  const day = i + 1
                  const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()
                  return (
                    <div key={day} style={{
                      textAlign: "center", fontSize: "13px", padding: "6px 0", borderRadius: "8px",
                      background: isToday ? "#2563EB" : "transparent",
                      color: isToday ? "white" : "#111111",
                      fontWeight: isToday ? 600 : 400,
                      cursor: "pointer",
                    }}>
                      {day}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F3F4F6", display: "flex", gap: "8px" }}>
                <Link href="/dashboard/budgets" onClick={() => setShowCalendar(false)} style={{
                  flex: 1, textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#2563EB",
                  padding: "8px", borderRadius: "8px", background: "#EFF6FF", textDecoration: "none",
                }}>Budgets</Link>
                <Link href="/dashboard/goals" onClick={() => setShowCalendar(false)} style={{
                  flex: 1, textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#2563EB",
                  padding: "8px", borderRadius: "8px", background: "#EFF6FF", textDecoration: "none",
                }}>Goals</Link>
                <Link href="/dashboard/recurring" onClick={() => setShowCalendar(false)} style={{
                  flex: 1, textAlign: "center", fontSize: "12px", fontWeight: 500, color: "#2563EB",
                  padding: "8px", borderRadius: "8px", background: "#EFF6FF", textDecoration: "none",
                }}>Recurring</Link>
              </div>
            </div>
          )}
        </div>

        {/* Notification Icon */}
        <div ref={notifRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowAccount(false); setShowCalendar(false) }}
            style={{
              position: "relative", display: "flex", height: "34px", width: "34px", alignItems: "center", justifyContent: "center",
              borderRadius: "9999px", color: "#6B7280", cursor: "pointer", border: "none",
              background: showNotifications ? "#F3F4F6" : "transparent", transition: "background 150ms ease",
            }}
          >
            <Bell style={{ height: "17px", width: "17px" }} />
            {unreadCount > 0 && (
              <span style={{
                position: "absolute", top: "4px", right: "4px", height: "16px", minWidth: "16px",
                borderRadius: "9999px", background: "#DC2626", color: "white",
                fontSize: "10px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                paddingInline: "4px",
              }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div style={{
              position: "absolute", top: "44px", right: 0, width: "360px", maxHeight: "440px",
              background: "white", borderRadius: "16px", border: "1px solid #E5E7EB",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid #F3F4F6" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#111111" }}>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: "12px", color: "#2563EB", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}>
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ overflowY: "auto", maxHeight: "360px" }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "40px 16px", textAlign: "center", color: "#9CA3AF", fontSize: "13px" }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <Link
                      key={n.id}
                      href={n.link || "/dashboard/notifications"}
                      onClick={() => { setShowNotifications(false) }}
                      style={{
                        display: "block", padding: "12px 16px", borderBottom: "1px solid #F9FAFB",
                        textDecoration: "none", background: n.isRead ? "white" : "#F0F7FF",
                        transition: "background 150ms ease",
                      }}
                    >
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <div style={{
                          width: "8px", height: "8px", borderRadius: "9999px", marginTop: "5px", flexShrink: 0,
                          background: n.isRead ? "#E5E7EB" : "#2563EB",
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</p>
                          <p style={{ fontSize: "12px", color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</p>
                          <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setShowNotifications(false)}
                  style={{
                    display: "block", textAlign: "center", padding: "12px", borderTop: "1px solid #F3F4F6",
                    fontSize: "13px", fontWeight: 500, color: "#2563EB", textDecoration: "none",
                  }}
                >
                  View all notifications
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "#E5E7EB", marginInline: "4px" }} />

        {/* Account Icon */}
        <div ref={accountRef} style={{ position: "relative" }}>
          <button
            onClick={() => { setShowAccount(!showAccount); setShowNotifications(false); setShowCalendar(false) }}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "4px", paddingRight: isDesktop ? "8px" : "4px",
              borderRadius: "9999px", border: "none", background: "transparent", cursor: "pointer",
              transition: "background 150ms ease",
            }}
          >
            <div style={{
              display: "flex", height: "30px", width: "30px", alignItems: "center", justifyContent: "center",
              borderRadius: "9999px", background: "#111111", fontSize: "11px", fontWeight: 600, color: "white", flexShrink: 0,
            }}>
              {getInitials(session?.user?.name || "U")}
            </div>
            {isDesktop && (
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", lineHeight: 1.2 }}>{session?.user?.name}</p>
                <p style={{ fontSize: "11px", color: "#9CA3AF", lineHeight: 1.2 }}>{session?.user?.email}</p>
              </div>
            )}
          </button>
          {showAccount && (
            <div style={{
              position: "absolute", top: "44px", right: 0, width: "220px",
              background: "white", borderRadius: "16px", border: "1px solid #E5E7EB",
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden", padding: "6px",
            }}>
              <div style={{ padding: "10px 12px", borderBottom: "1px solid #F3F4F6", marginBottom: "4px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#111111" }}>{session?.user?.name}</p>
                <p style={{ fontSize: "12px", color: "#9CA3AF" }}>{session?.user?.email}</p>
              </div>
              <Link href="/dashboard/accounts" onClick={() => setShowAccount(false)} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px",
                fontSize: "13px", color: "#111111", textDecoration: "none", transition: "background 150ms ease",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Wallet style={{ width: "16px", height: "16px", color: "#6B7280" }} />
                Manage Accounts
              </Link>
              <Link href="/dashboard/categories" onClick={() => setShowAccount(false)} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px",
                fontSize: "13px", color: "#111111", textDecoration: "none", transition: "background 150ms ease",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Settings style={{ width: "16px", height: "16px", color: "#6B7280" }} />
                Settings
              </Link>
              <div style={{ padding: "6px 12px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Currency</label>
                <select
                  value={currency}
                  onChange={(e) => { setCurrencyState(e.target.value); setCurrency(e.target.value); window.location.reload() }}
                  style={{
                    width: "100%", height: "32px", borderRadius: "8px", border: "1px solid #E5E7EB",
                    padding: "0 8px", fontSize: "13px", color: "#111111", background: "white",
                    outline: "none", cursor: "pointer",
                  }}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
              <div style={{ height: "1px", background: "#F3F4F6", margin: "4px 0" }} />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  display: "flex", width: "100%", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px",
                  fontSize: "13px", color: "#DC2626", background: "none", border: "none", cursor: "pointer", transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut style={{ width: "16px", height: "16px" }} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
