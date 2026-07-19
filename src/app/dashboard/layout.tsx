"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ minHeight: "100vh", background: "#F8F8F6" }}>
      <Sidebar />
      <div style={{ paddingLeft: "256px" }}>
        <TopBar />
        <main style={{ padding: "32px" }}>{children}</main>
      </div>
    </div>
  )
}
