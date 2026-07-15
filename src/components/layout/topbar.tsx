"use client"

import { useSession } from "next-auth/react"
import { getInitials } from "@/lib/utils"
import { Bell } from "lucide-react"

export function TopBar() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b-2 border-gray-100 bg-white/80 backdrop-blur-md px-6 lg:px-8">
      <div className="lg:hidden w-10" />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <button className="relative rounded-xl p-2 hover:bg-gray-100 transition-colors cursor-pointer">
          <Bell className="h-5 w-5 text-gray-500" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-medium text-white">
            {getInitials(session?.user?.name || "U")}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <p className="text-xs text-gray-500">{session?.user?.email}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
