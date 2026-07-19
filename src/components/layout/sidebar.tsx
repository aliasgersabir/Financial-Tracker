"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tag,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react"
import * as React from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
  { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard/categories", label: "Categories", icon: Tag },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [isDesktop, setIsDesktop] = React.useState(true)

  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  const [signOutHovered, setSignOutHovered] = React.useState(false)
  const [closeBtnHovered, setCloseBtnHovered] = React.useState(false)

  React.useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const sidebarVisible = isDesktop || mobileOpen

  return (
    <>
      {!isDesktop && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: "fixed",
            top: "16px",
            left: "16px",
            zIndex: 50,
            display: "flex",
            height: "40px",
            width: "40px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            background: "white",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            border: "1px solid #E5E7EB",
            cursor: "pointer",
          }}
        >
          <Menu style={{ height: "16px", width: "16px", color: "#111111" }} />
        </button>
      )}

      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          zIndex: 40,
          height: "100%",
          width: "260px",
          background: "white",
          borderRight: "1px solid #F3F4F6",
          transition: "transform 200ms ease-out",
          transform: sidebarVisible ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: "24px", paddingBlock: "20px" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", height: "36px", width: "36px", alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "#111111" }}>
                <Sparkles style={{ height: "16px", width: "16px", color: "white" }} />
              </div>
              <span style={{ fontSize: "17px", fontWeight: 600, color: "#111111", letterSpacing: "-0.025em" }}>
                FinOS
              </span>
            </Link>
            {!isDesktop && (
              <button
                onClick={() => setMobileOpen(false)}
                onMouseEnter={() => setCloseBtnHovered(true)}
                onMouseLeave={() => setCloseBtnHovered(false)}
                style={{
                  display: "flex",
                  height: "32px",
                  width: "32px",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "9999px",
                  color: "#6B7280",
                  background: closeBtnHovered ? "#F3F4F6" : undefined,
                  cursor: "pointer",
                }}
              >
                <X style={{ height: "16px", width: "16px" }} />
              </button>
            )}
          </div>

          <nav style={{ flex: 1, paddingInline: "12px", paddingBlock: "8px" }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const isHovered = hoveredItem === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    borderRadius: "12px",
                    paddingInline: "12px",
                    paddingBlock: "10px",
                    fontSize: "14px",
                    fontWeight: 500,
                    transition: "all 0.15s",
                    marginBottom: "2px",
                    background: isActive
                      ? "#EFF6FF"
                      : isHovered
                      ? "#F9FAFB"
                      : undefined,
                    color: isActive
                      ? "#2563EB"
                      : isHovered
                      ? "#111111"
                      : "#6B7280",
                    textDecoration: "none",
                  }}
                >
                  <item.icon
                    style={{
                      height: "18px",
                      width: "18px",
                      color: isActive ? "#2563EB" : "#9CA3AF",
                    }}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div style={{ paddingInline: "12px", paddingBottom: "16px" }}>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              onMouseEnter={() => setSignOutHovered(true)}
              onMouseLeave={() => setSignOutHovered(false)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                gap: "12px",
                borderRadius: "12px",
                paddingInline: "12px",
                paddingBlock: "10px",
                fontSize: "14px",
                fontWeight: 500,
                color: signOutHovered ? "#DC2626" : "#6B7280",
                background: signOutHovered ? "#FEF2F2" : undefined,
                transition: "all 0.15s",
                cursor: "pointer",
                border: "none",
              }}
            >
              <LogOut style={{ height: "18px", width: "18px" }} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
