"use client"

import { Sidebar, SidebarToggleButton } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { useState, useEffect, useCallback } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const check = () => {
      const desktop = window.innerWidth >= 768
      setIsDesktop(desktop)
    }
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div style={{ paddingLeft: isDesktop && sidebarOpen ? "260px" : "0", transition: "padding-left 200ms ease" }}>
        <TopBar sidebarToggle={isDesktop ? <SidebarToggleButton isOpen={sidebarOpen} onToggle={toggleSidebar} /> : undefined} />
        <main style={{ padding: isDesktop ? "24px 32px 32px" : "16px" }}>{children}</main>
      </div>
    </div>
  )
}
