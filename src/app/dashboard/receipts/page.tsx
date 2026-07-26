"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState, useRef } from "react"
import { FileText, Camera, Check, Upload, Eye } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface Receipt {
  id: string
  fileName: string
  uploadDate: string
  status: string
  merchantName: string | null
  totalAmount: number | null
  filePath: string
  processedData: string | null
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function ReceiptsPage() {
  const { status } = useSession()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [hoverAdd, setHoverAdd] = useState(false)
  const [hoverCard, setHoverCard] = useState<string | null>(null)
  const [hoverProcess, setHoverProcess] = useState<string | null>(null)
  const [hoverConfirm, setHoverConfirm] = useState<string | null>(null)
  const [hoverView, setHoverView] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") fetchReceipts()
  }, [status])

  const fetchReceipts = async () => {
    try {
      const res = await fetch("/api/receipts")
      const data = await res.json()
      setReceipts(Array.isArray(data) ? data : data.receipts || [])
    } catch {
      console.error("Failed to fetch receipts")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      await fetch("/api/receipts", { method: "POST", body: formData })
      setUploadModalOpen(false)
      setSelectedFile(null)
      fetchReceipts()
    } catch {
      console.error("Failed to upload receipt")
    } finally {
      setUploading(false)
    }
  }

  const handleProcess = async (id: string) => {
    setProcessingId(id)
    try {
      await fetch(`/api/receipts/${id}/process`, { method: "POST" })
      fetchReceipts()
    } catch {
      console.error("Failed to process receipt")
    } finally {
      setProcessingId(null)
    }
  }

  const handleConfirm = async (id: string) => {
    setConfirmingId(id)
    try {
      await fetch(`/api/receipts/${id}/confirm`, { method: "POST" })
      fetchReceipts()
    } catch {
      console.error("Failed to confirm receipt")
    } finally {
      setConfirmingId(null)
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "#FEF3C7", color: "#D97706", label: "Pending" }
      case "processed":
        return { bg: "#EFF6FF", color: "#2563EB", label: "Processed" }
      case "confirmed":
        return { bg: "#F0FDF4", color: "#16A34A", label: "Confirmed" }
      default:
        return { bg: "#F3F4F6", color: "#6B7280", label: status }
    }
  }

  const handleFileSelect = (file: File) => {
    if (file.type.startsWith("image/") || file.type === "application/pdf") {
      setSelectedFile(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "12px" : "24px" }}>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? "12px" : "0" }}>
        <div>
          <h1 style={{ fontSize: isMobile ? "22px" : "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Receipt Scanner</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Scan and manage receipts with OCR</p>
        </div>
        <button
          onClick={() => { setSelectedFile(null); setUploadModalOpen(true) }}
          onMouseEnter={() => setHoverAdd(true)}
          onMouseLeave={() => setHoverAdd(false)}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px",
            borderRadius: "9999px", padding: "10px 20px",
            background: hoverAdd ? "#1D4ED8" : "#2563EB",
            fontSize: "14px", fontWeight: 500, color: "white",
            transition: "all 150ms ease", cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <Upload style={{ width: "16px", height: "16px" }} />
          Upload Receipt
        </button>
      </div>

      {receipts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "8px" : "12px" }}>
          {receipts.map((receipt) => {
            const statusConfig = getStatusConfig(receipt.status)
            const isHovered = hoverCard === receipt.id
            let parsedData: any = null
            if (receipt.processedData) {
              try { parsedData = JSON.parse(receipt.processedData) } catch {}
            }
            return (
              <div
                key={receipt.id}
                onMouseEnter={() => setHoverCard(receipt.id)}
                onMouseLeave={() => setHoverCard(null)}
                style={{
                  background: "white", borderRadius: "20px", padding: isMobile ? "16px" : "20px",
                  boxShadow: isHovered ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 200ms ease",
                }}
              >
                <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", gap: isMobile ? "12px" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
                    <div style={{
                      display: "flex", width: "44px", height: "44px", alignItems: "center", justifyContent: "center",
                      borderRadius: "12px", background: "#F9FAFB", flexShrink: 0,
                    }}>
                      <FileText style={{ width: "20px", height: "20px", color: "#6B7280" }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <p style={{ fontSize: "15px", fontWeight: 600, color: "#111111", margin: 0 }}>{receipt.fileName}</p>
                        <span style={{
                          display: "inline-block", fontSize: "11px", fontWeight: 500,
                          padding: "2px 8px", borderRadius: "9999px",
                          background: statusConfig.bg, color: statusConfig.color,
                        }}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <p style={{ fontSize: "13px", color: "#9CA3AF", margin: "2px 0 0" }}>
                        Uploaded {new Date(receipt.uploadDate).toLocaleDateString()}
                        {receipt.merchantName && ` · ${receipt.merchantName}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "8px", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                    {receipt.totalAmount && (
                      <span style={{ fontSize: "16px", fontWeight: 600, color: "#111111" }}>
                        {formatCurrency(receipt.totalAmount)}
                      </span>
                    )}

                    {receipt.status === "pending" && (
                      <button
                        onClick={() => handleProcess(receipt.id)}
                        disabled={processingId === receipt.id}
                        onMouseEnter={() => setHoverProcess(receipt.id)}
                        onMouseLeave={() => setHoverProcess(null)}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          borderRadius: "9999px", padding: "8px 14px",
                          background: hoverProcess === receipt.id ? "#1D4ED8" : "#2563EB",
                          color: "white", fontSize: "13px", fontWeight: 500,
                          transition: "all 150ms ease", cursor: "pointer", border: "none",
                          opacity: processingId === receipt.id ? 0.6 : 1,
                        }}
                      >
                        <Camera style={{ width: "14px", height: "14px", animation: processingId === receipt.id ? "spin 1s linear infinite" : "none" }} />
                        {processingId === receipt.id ? "Processing..." : "Process OCR"}
                      </button>
                    )}

                    {receipt.status === "processed" && (
                      <button
                        onClick={() => handleConfirm(receipt.id)}
                        disabled={confirmingId === receipt.id}
                        onMouseEnter={() => setHoverConfirm(receipt.id)}
                        onMouseLeave={() => setHoverConfirm(null)}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          borderRadius: "9999px", padding: "8px 14px",
                          background: hoverConfirm === receipt.id ? "#15803D" : "#16A34A",
                          color: "white", fontSize: "13px", fontWeight: 500,
                          transition: "all 150ms ease", cursor: "pointer", border: "none",
                          opacity: confirmingId === receipt.id ? 0.6 : 1,
                        }}
                      >
                        <Check style={{ width: "14px", height: "14px" }} />
                        {confirmingId === receipt.id ? "Creating..." : "Confirm & Create Transaction"}
                      </button>
                    )}

                    {parsedData && (
                      <button
                        onClick={() => { setSelectedReceipt(receipt); setDetailModalOpen(true) }}
                        onMouseEnter={() => setHoverView(receipt.id)}
                        onMouseLeave={() => setHoverView(null)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center",
                          width: "32px", height: "32px", borderRadius: "9999px",
                          background: hoverView === receipt.id ? "#F3F4F6" : "transparent",
                          border: "none", cursor: "pointer", transition: "all 150ms ease",
                        }}
                      >
                        <Eye style={{ width: "16px", height: "16px", color: "#6B7280" }} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "40px 16px" : "80px 0", background: "white", borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
          }}>
            <Camera style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>No receipts yet</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "24px" }}>Upload your first receipt to get started</p>
          <button
            onClick={() => { setSelectedFile(null); setUploadModalOpen(true) }}
            onMouseEnter={() => setHoverAdd(true)}
            onMouseLeave={() => setHoverAdd(false)}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              borderRadius: "9999px", padding: "10px 20px",
              background: hoverAdd ? "#1D4ED8" : "#2563EB",
              fontSize: "14px", fontWeight: 500, color: "white",
              transition: "all 150ms ease", cursor: "pointer",
            }}
          >
            <Upload style={{ width: "16px", height: "16px" }} />
            Upload Receipt
          </button>
        </div>
      )}

      <Modal open={uploadModalOpen} onClose={() => { setUploadModalOpen(false); setSelectedFile(null) }} title="Upload Receipt">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragOver ? "#2563EB" : "#E5E7EB"}`,
              borderRadius: "16px", padding: isMobile ? "24px 16px" : "40px 24px",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: dragOver ? "#EFF6FF" : "#F9FAFB",
              cursor: "pointer", transition: "all 200ms ease",
            }}
          >
            <div style={{
              width: "48px", height: "48px", borderRadius: "9999px", background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px",
            }}>
              <Upload style={{ width: "20px", height: "20px", color: "#9CA3AF" }} />
            </div>
            {selectedFile ? (
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#111111", textAlign: "center" }}>{selectedFile.name}</p>
            ) : (
              <>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "#111111", marginBottom: "4px", textAlign: "center" }}>Drop a file here or click to browse</p>
                <p style={{ fontSize: "13px", color: "#9CA3AF", textAlign: "center" }}>Supports images and PDFs</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelect(file)
              }}
              style={{ display: "none" }}
            />
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              height: "44px", borderRadius: "9999px",
              background: selectedFile ? "#2563EB" : "#E5E7EB",
              color: "white", fontSize: "14px", fontWeight: 500,
              transition: "all 150ms ease", cursor: selectedFile ? "pointer" : "not-allowed",
              border: "none", opacity: uploading ? 0.6 : 1,
            }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </Modal>

      <Modal open={detailModalOpen} onClose={() => { setDetailModalOpen(false); setSelectedReceipt(null) }} title="Receipt Details">
        {selectedReceipt && (() => {
          let parsed: any = null
          if (selectedReceipt.processedData) {
            try { parsed = JSON.parse(selectedReceipt.processedData) } catch {}
          }
          return parsed ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {Object.entries(parsed).map(([key, value]) => (
                <div key={key} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ fontSize: "13px", color: "#6B7280", fontWeight: 500, textTransform: "capitalize" }}>
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                  <span style={{ fontSize: "14px", color: "#111111", fontWeight: 500 }}>
                    {typeof value === "number" ? formatCurrency(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "#9CA3AF", textAlign: "center", padding: "24px 0" }}>No processed data available</p>
          )
        })()}
      </Modal>
    </div>
  )
}
