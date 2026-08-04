"use client"

import * as React from "react"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />
      <div style={{ position: "relative", zIndex: 50, width: "100%", maxWidth: "512px", margin: "0 16px", background: "white", borderRadius: "20px", padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#111111" }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ display: "flex", height: "32px", width: "32px", alignItems: "center", justifyContent: "center", borderRadius: "9999px", color: "#6B7280", cursor: "pointer", background: "none", border: "none", transition: "all 0.15s" }}
          >
            <X style={{ width: "16px", height: "16px" }} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  )
}
