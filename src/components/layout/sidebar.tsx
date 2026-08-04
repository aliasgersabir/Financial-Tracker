"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  LogOut,
  Menu,
  X,
  PiggyBank,
  Target,
  Repeat,
  Upload,
  BarChart3,
  FileText,
  MessageCircle,
  Calculator,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react"
import * as React from "react"

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const navSections = [
  {
    title: "Core",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboard/accounts", label: "Accounts", icon: Wallet },
      { href: "/dashboard/transactions", label: "Transactions", icon: ArrowLeftRight },

    ],
  },
  {
    title: "Planning",
    items: [
      { href: "/dashboard/budgets", label: "Budgets", icon: PiggyBank },
      { href: "/dashboard/goals", label: "Goals", icon: Target },
      { href: "/dashboard/recurring", label: "Recurring", icon: Repeat },
      { href: "/dashboard/simulator", label: "Simulator", icon: Calculator },
    ],
  },
  {
    title: "Tools",
    items: [
      { href: "/dashboard/assistant", label: "Assistant", icon: MessageCircle },
      { href: "/dashboard/receipts", label: "Receipts", icon: FileText },
      { href: "/dashboard/imports", label: "Imports", icon: Upload },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
]

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname()
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

  return (
    <>
      {!isDesktop && isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.2)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onToggle}
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
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div style={{ display: "flex", height: "100%", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingInline: "20px", paddingBlock: "16px" }}>
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div style={{ display: "flex", height: "34px", width: "34px", alignItems: "center", justifyContent: "center", borderRadius: "10px", background: "#111111" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "white", letterSpacing: "-0.025em" }}>f</span>
              </div>
              <span style={{ fontSize: "17px", fontWeight: 600, color: "#111111", letterSpacing: "-0.025em" }}>
                FinOS
              </span>
            </Link>
            <button
              onClick={onToggle}
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
                border: "none",
              }}
            >
              <X style={{ height: "16px", width: "16px" }} />
            </button>
          </div>

          <nav style={{ flex: 1, paddingInline: "12px", paddingBlock: "8px", overflowY: "auto" }}>
            {navSections.map((section) => (
              <div key={section.title} style={{ marginBottom: "8px" }}>
                <div style={{ paddingInline: "12px", paddingBlock: "6px", fontSize: "11px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {section.title}
                </div>
                {section.items.map((item) => {
                  const isActive = pathname === item.href
                  const isHovered = hoveredItem === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onToggle}
                      onMouseEnter={() => setHoveredItem(item.href)}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        borderRadius: "12px",
                        paddingInline: "12px",
                        paddingBlock: "8px",
                        fontSize: "14px",
                        fontWeight: 500,
                        transition: "all 0.15s",
                        marginBottom: "1px",
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
                          height: "16px",
                          width: "16px",
                          color: isActive ? "#2563EB" : "#9CA3AF",
                        }}
                      />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            ))}
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

export function SidebarToggleButton({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [hovered, setHovered] = React.useState(false)

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        height: "34px",
        width: "34px",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        border: "1px solid #E5E7EB",
        background: hovered ? "#F3F4F6" : "white",
        cursor: "pointer",
        transition: "all 150ms ease",
        flexShrink: 0,
        color: "#6B7280",
      }}
    >
      {isOpen ? <PanelLeftClose style={{ height: "16px", width: "16px" }} /> : <PanelLeftOpen style={{ height: "16px", width: "16px" }} />}
    </button>
  )
}
