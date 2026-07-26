"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"
import { useState, useEffect } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
      <Sidebar />
      <div style={{ paddingLeft: isDesktop ? "256px" : "0" }}>
        <TopBar />
        <main style={{ padding: isDesktop ? "32px" : "16px" }}>{children}</main>
      </div>
    </div>
  )
}
