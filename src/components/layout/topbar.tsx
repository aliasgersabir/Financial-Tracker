"use client"

import { useSession } from "next-auth/react"
import { getInitials } from "@/lib/utils"
import { Bell } from "lucide-react"
import { useState, useEffect } from "react"

export function TopBar() {
  const { data: session } = useSession()
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 30,
        display: "flex",
        height: "60px",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #F3F4F6",
        background: "rgba(248,248,246,0.8)",
        backdropFilter: "blur(24px)",
        paddingInline: "16px",
      }}
    >
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          style={{
            position: "relative",
            display: "flex",
            height: "36px",
            width: "36px",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            color: "#6B7280",
            transition: "all 0.15s",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <Bell style={{ height: "18px", width: "18px" }} />
          <span
            style={{
              position: "absolute",
              right: "8px",
              top: "8px",
              height: "8px",
              width: "8px",
              borderRadius: "9999px",
              background: "#DC2626",
            }}
          />
        </button>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginLeft: "8px",
            paddingLeft: "12px",
            borderLeft: "1px solid #F3F4F6",
          }}
        >
          <div
            style={{
              display: "flex",
              height: "32px",
              width: "32px",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "9999px",
              background: "#111111",
              fontSize: "12px",
              fontWeight: 500,
              color: "white",
              flexShrink: 0,
            }}
          >
            {getInitials(session?.user?.name || "U")}
          </div>
          {isDesktop && (
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", lineHeight: 1.25 }}>{session?.user?.name}</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: 1.25 }}>{session?.user?.email}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
