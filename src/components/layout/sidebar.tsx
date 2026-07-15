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
import { cn } from "@/lib/utils"
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

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-[#E5E7EB] lg:hidden cursor-pointer"
      >
        <Menu className="h-4 w-4 text-[#111111]" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-[260px] bg-white border-r border-[#F3F4F6] transition-transform duration-200 ease-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-5">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#111111]">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-[17px] font-semibold text-[#111111] tracking-tight">
                FinOS
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6] lg:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-all duration-150 mb-0.5",
                    isActive
                      ? "bg-[#EFF6FF] text-[#2563EB]"
                      : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111111]"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-[18px] w-[18px]",
                      isActive ? "text-[#2563EB]" : "text-[#9CA3AF]"
                    )}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="px-3 pb-4">
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-[#6B7280] hover:bg-[#FEF2F2] hover:text-[#DC2626] transition-all duration-150 cursor-pointer"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
