"use client"

import { useSession } from "next-auth/react"
import { getInitials } from "@/lib/utils"
import { Bell, Search } from "lucide-react"

export function TopBar() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#F3F4F6] bg-[#F8F8F6]/80 backdrop-blur-xl px-6 lg:px-8">
      <div className="lg:hidden w-10" />
      <div className="flex-1 max-w-md mx-4 hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-full rounded-full border border-[#E5E7EB] bg-white pl-9 pr-4 text-sm text-[#111111] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10 transition-all duration-150"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111111] transition-all duration-150 cursor-pointer">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#DC2626]" />
        </button>
        <div className="flex items-center gap-2.5 ml-2 pl-3 border-l border-[#F3F4F6]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111111] text-[12px] font-medium text-white">
            {getInitials(session?.user?.name || "U")}
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-medium text-[#111111] leading-tight">{session?.user?.name}</p>
            <p className="text-[12px] text-[#9CA3AF] leading-tight">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
