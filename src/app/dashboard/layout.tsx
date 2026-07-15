"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/topbar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
