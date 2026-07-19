"use client"

import { useSession } from "next-auth/react"
import { getInitials } from "@/lib/utils"
import { Bell } from "lucide-react"

export function TopBar() {
  const { data: session } = useSession()

  return (
    <>
      <style>{`
        .topbar-search:focus {
          outline: none;
          border-color: #2563EB;
          box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
        }
        .topbar-btn:hover {
          background: #F3F4F6;
          color: #111111;
        }
      `}</style>
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
          paddingInline: "32px",
        }}
      >
        <div style={{ width: "40px" }} />
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
              }}
            >
              {getInitials(session?.user?.name || "U")}
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#111111", lineHeight: 1.25 }}>{session?.user?.name}</p>
              <p style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: 1.25 }}>{session?.user?.email}</p>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
