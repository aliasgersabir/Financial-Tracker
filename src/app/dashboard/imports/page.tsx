"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Upload, X, CheckCircle2, AlertCircle, Clock, Trash2, Download } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface ImportJob {
  id: string
  accountId: string
  fileName: string
  fileType: string
  status: string
  totalRows: number
  importedRows: number
  skippedRows: number
  duplicateRows: number
  errorMessage?: string | null
  createdAt: string
  completedAt?: string | null
  account?: { name: string }
  rows?: ImportRow[]
}

interface ImportRow {
  id: string
  date: string
  description: string
  amount: number
  type: string
  balance?: number | null
  merchantName?: string | null
  suggestedCategoryId?: string | null
  status: string
}

interface Account {
  id: string
  name: string
  balance: number
}

interface Category {
  id: string
  name: string
  type: string
  icon: string
  color: string
}

export default function ImportsPage() {
  const { status } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [activeJob, setActiveJob] = useState<ImportJob | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importing, setImporting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [hoverStates, setHoverStates] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") {
      loadData()
    }
  }, [status])

  const loadData = async () => {
    setLoading(true)
    const [jobsRes, accountsRes, catsRes] = await Promise.all([
      fetch("/api/imports"),
      fetch("/api/accounts"),
      fetch("/api/categories"),
    ])
    const jobsData = await jobsRes.json()
    const accountsData = await accountsRes.json()
    const catsData = await catsRes.json()
    setJobs(Array.isArray(jobsData) ? jobsData : [])
    setAccounts(Array.isArray(accountsData) ? accountsData : [])
    setCategories(Array.isArray(catsData) ? catsData : [])
    setLoading(false)
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      setSelectedFile(file)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedAccountId) return
    setUploading(true)
    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("accountId", selectedAccountId)

    const res = await fetch("/api/imports", { method: "POST", body: formData })
    const data = await res.json()

    if (res.ok) {
      setSelectedFile(null)
      setSelectedAccountId("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      await loadData()
      loadActiveJob(data.id)
    }
    setUploading(false)
  }

  const loadActiveJob = async (jobId: string) => {
    const res = await fetch(`/api/imports/${jobId}`)
    const data = await res.json()
    if (res.ok) {
      setActiveJob(data)
      setRows(data.rows || [])
    }
  }

  const handleRowUpdate = async (rowId: string, updates: Partial<ImportRow>) => {
    if (!activeJob) return
    const res = await fetch(`/api/imports/${activeJob.id}/rows/${rowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    if (res.ok) {
      setRows(prev => prev.map(r => r.id === rowId ? { ...r, ...updates } : r))
    }
  }

  const handleRowDelete = async (rowId: string) => {
    if (!activeJob) return
    const res = await fetch(`/api/imports/${activeJob.id}/rows/${rowId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setRows(prev => prev.filter(r => r.id !== rowId))
    }
  }

  const handleConfirmImport = async () => {
    if (!activeJob) return
    setImporting(true)
    const res = await fetch(`/api/imports/${activeJob.id}/confirm`, { method: "POST" })
    const data = await res.json()
    if (res.ok) {
      setActiveJob(null)
      setRows([])
      loadData()
    }
    setImporting(false)
  }

  const handleCancelImport = () => {
    setActiveJob(null)
    setRows([])
  }

  const handleDeleteJob = async (jobId: string) => {
    await fetch(`/api/imports/${jobId}`, { method: "DELETE" })
    setDeleteConfirm(null)
    loadData()
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  }

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case "new": return "#2563EB"
      case "duplicate": return "#F59E0B"
      case "skipped": return "#9CA3AF"
      case "imported": return "#16A34A"
      default: return "#9CA3AF"
    }
  }

  const getJobStatusIcon = (s: string) => {
    switch (s) {
      case "completed": return <CheckCircle2 style={{ width: 16, height: 16, color: "#16A34A" }} />
      case "failed": return <AlertCircle style={{ width: 16, height: 16, color: "#DC2626" }} />
      default: return <Clock style={{ width: 16, height: 16, color: "#F59E0B" }} />
    }
  }

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 256 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: 24, height: 24, animation: "spin 1s linear infinite", borderRadius: 9999, border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  const previewRows = activeJob?.status === "preview" ? rows : []
  const newCount = previewRows.filter(r => r.status === "new").length
  const dupCount = previewRows.filter(r => r.status === "duplicate").length

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Statement Import</h1>
          <p style={{ fontSize: 15, color: "#6B7280", marginTop: 2 }}>Import transactions from bank CSV files</p>
        </div>
      </div>

      {/* Upload Section */}
      <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "#2563EB" : "#E5E7EB"}`,
            borderRadius: 16,
            padding: "40px 24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
            transition: "all 150ms ease",
            background: dragOver ? "#EFF6FF" : selectedFile ? "#F0FDF4" : "#FAFAFA",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: dragOver ? "#DBEAFE" : "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Upload style={{ width: 20, height: 20, color: dragOver ? "#2563EB" : "#9CA3AF" }} />
          </div>
          {selectedFile ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111111" }}>{selectedFile.name}</p>
              <p style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111111" }}>
                Drop your CSV file here, or click to browse
              </p>
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                Supports standard bank CSV exports
              </p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#111111", marginBottom: 6 }}>
              Target Account
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 12,
                border: "1px solid #E5E7EB",
                padding: "0 14px",
                fontSize: 14,
                color: "#111111",
                background: "white",
                outline: "none",
                appearance: "none" as const,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 14px center",
              }}
            >
              <option value="">Select account...</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({formatCurrency(a.balance)})</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !selectedAccountId || uploading}
            onMouseEnter={() => setHoverStates({ ...hoverStates, upload: true })}
            onMouseLeave={() => setHoverStates({ ...hoverStates, upload: false })}
            style={{
              height: 44,
              padding: "0 24px",
              borderRadius: 9999,
              background: (!selectedFile || !selectedAccountId || uploading) ? "#93C5FD" : (hoverStates.upload ? "#1D4ED8" : "#2563EB"),
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              border: "none",
              cursor: (!selectedFile || !selectedAccountId || uploading) ? "not-allowed" : "pointer",
              transition: "all 150ms ease",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              whiteSpace: "nowrap",
            }}
          >
            {uploading ? (
              <>
                <div style={{ width: 14, height: 14, animation: "spin 1s linear infinite", borderRadius: 9999, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                Parsing...
              </>
            ) : (
              <>
                <Upload style={{ width: 14, height: 14 }} />
                Import
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Import Preview */}
      {activeJob && activeJob.status === "preview" && (
        <div style={{ background: "white", borderRadius: 20, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111111" }}>{activeJob.fileName}</h2>
              <p style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>Preview — review rows before importing</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleCancelImport}
                onMouseEnter={() => setHoverStates({ ...hoverStates, cancelBtn: true })}
                onMouseLeave={() => setHoverStates({ ...hoverStates, cancelBtn: false })}
                style={{
                  height: 36, padding: "0 16px", borderRadius: 9999,
                  border: "1px solid #E5E7EB",
                  background: hoverStates.cancelBtn ? "#F9FAFB" : "white",
                  fontSize: 13, fontWeight: 500, color: "#111111",
                  cursor: "pointer", transition: "all 150ms ease",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing || newCount === 0}
                onMouseEnter={() => setHoverStates({ ...hoverStates, importBtn: true })}
                onMouseLeave={() => setHoverStates({ ...hoverStates, importBtn: false })}
                style={{
                  height: 36, padding: "0 16px", borderRadius: 9999,
                  background: (importing || newCount === 0) ? "#93C5FD" : (hoverStates.importBtn ? "#1D4ED8" : "#2563EB"),
                  color: "white", fontSize: 13, fontWeight: 500, border: "none",
                  cursor: (importing || newCount === 0) ? "not-allowed" : "pointer",
                  transition: "all 150ms ease",
                  display: "inline-flex", alignItems: "center", gap: 6,
                }}
              >
                {importing ? (
                  <>
                    <div style={{ width: 12, height: 12, animation: "spin 1s linear infinite", borderRadius: 9999, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                    Importing...
                  </>
                ) : (
                  `Import ${newCount} Transactions`
                )}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Total Rows", value: previewRows.length, color: "#111111" },
              { label: "New", value: newCount, color: "#2563EB" },
              { label: "Duplicates", value: dupCount, color: "#F59E0B" },
              { label: "Skipped", value: previewRows.filter(r => r.status === "skipped").length, color: "#9CA3AF" },
            ].map(s => (
              <div key={s.label} style={{
                borderRadius: 12, padding: "12px 16px",
                background: s.color === "#111111" ? "#F9FAFB" : s.color + "0D",
                border: `1px solid ${s.color}15`,
              }}>
                <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{s.label}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Rows Table */}
          <div style={{ borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Date</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Description</th>
                    <th style={{ padding: "10px 16px", textAlign: "right", fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Amount</th>
                    <th style={{ padding: "10px 16px", textAlign: "left", fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Category</th>
                    <th style={{ padding: "10px 16px", textAlign: "center", fontWeight: 500, color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Status</th>
                    <th style={{ padding: "10px 16px", width: 40, borderBottom: "1px solid #E5E7EB" }} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.id}
                      style={{
                        background: row.status === "duplicate" ? "#F9FAFB" : "white",
                        borderBottom: "1px solid #F3F4F6",
                      }}
                    >
                      <td style={{ padding: "10px 16px", color: "#111111", whiteSpace: "nowrap" }}>
                        {formatDate(row.date)}
                      </td>
                      <td style={{ padding: "10px 16px", color: "#111111", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.description}
                      </td>
                      <td style={{
                        padding: "10px 16px", textAlign: "right",
                        color: row.type === "debit" ? "#DC2626" : "#16A34A",
                        fontWeight: 500, whiteSpace: "nowrap",
                      }}>
                        {row.type === "debit" ? "-" : "+"}{formatCurrency(row.amount)}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <select
                          value={row.suggestedCategoryId || ""}
                          onChange={(e) => handleRowUpdate(row.id, { suggestedCategoryId: e.target.value || null } as any)}
                          style={{
                            height: 30, borderRadius: 8,
                            border: "1px solid #E5E7EB",
                            padding: "0 8px", fontSize: 12,
                            color: "#111111", background: "white",
                            outline: "none", cursor: "pointer",
                            minWidth: 120,
                          }}
                        >
                          <option value="">No category</option>
                          {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ padding: "10px 16px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 10px",
                          borderRadius: 9999, fontSize: 11, fontWeight: 500,
                          color: getStatusColor(row.status),
                          background: getStatusColor(row.status) + "15",
                        }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        {row.status !== "imported" && (
                          <button
                            onClick={() => handleRowDelete(row.id)}
                            onMouseEnter={() => setHoverStates({ ...hoverStates, [`del-${row.id}`]: true })}
                            onMouseLeave={() => setHoverStates({ ...hoverStates, [`del-${row.id}`]: false })}
                            style={{
                              display: "flex", width: 28, height: 28,
                              alignItems: "center", justifyContent: "center",
                              borderRadius: 9999, border: "none", background: "none",
                              cursor: "pointer", color: hoverStates[`del-${row.id}`] ? "#DC2626" : "#9CA3AF",
                              transition: "color 150ms ease",
                            }}
                          >
                            <Trash2 style={{ width: 14, height: 14 }} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Import History */}
      <div>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
          Import History
        </h2>
        {jobs.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 0",
            background: "white", borderRadius: 20,
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 9999, background: "#F3F4F6",
              display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
            }}>
              <Download style={{ width: 24, height: 24, color: "#9CA3AF" }} />
            </div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#111111", marginBottom: 4 }}>No imports yet</p>
            <p style={{ fontSize: 14, color: "#9CA3AF" }}>Upload a CSV file to get started</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {jobs.map(job => (
              <div
                key={job.id}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "white", borderRadius: 16, padding: "14px 20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  cursor: job.status === "preview" ? "pointer" : "default",
                  transition: "box-shadow 150ms ease",
                }}
                onClick={() => job.status === "preview" && loadActiveJob(job.id)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {getJobStatusIcon(job.status)}
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "#111111" }}>{job.fileName}</p>
                    <p style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
                      {job.account?.name || "Account"} · {formatDate(job.createdAt)}
                      {job.completedAt ? ` · Completed` : ""}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6B7280" }}>
                    <span>{job.totalRows} rows</span>
                    {job.importedRows > 0 && <span style={{ color: "#16A34A" }}>{job.importedRows} imported</span>}
                    {job.duplicateRows > 0 && <span style={{ color: "#F59E0B" }}>{job.duplicateRows} dupes</span>}
                  </div>
                  <span style={{
                    display: "inline-block", padding: "3px 10px",
                    borderRadius: 9999, fontSize: 11, fontWeight: 500,
                    color: job.status === "completed" ? "#16A34A" : job.status === "failed" ? "#DC2626" : "#F59E0B",
                    background: job.status === "completed" ? "#F0FDF4" : job.status === "failed" ? "#FEF2F2" : "#FFFBEB",
                    textTransform: "capitalize",
                  }}>
                    {job.status}
                  </span>
                  {deleteConfirm === job.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteJob(job.id) }}
                        style={{
                          padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500,
                          background: "#DC2626", color: "white", border: "none", cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null) }}
                        style={{
                          padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500,
                          background: "#F3F4F6", color: "#111111", border: "none", cursor: "pointer",
                        }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(job.id) }}
                      onMouseEnter={() => setHoverStates({ ...hoverStates, [`hist-${job.id}`]: true })}
                      onMouseLeave={() => setHoverStates({ ...hoverStates, [`hist-${job.id}`]: false })}
                      style={{
                        display: "flex", width: 32, height: 32,
                        alignItems: "center", justifyContent: "center",
                        borderRadius: 9999, border: "none", background: "none",
                        cursor: "pointer", color: hoverStates[`hist-${job.id}`] ? "#DC2626" : "#9CA3AF",
                        transition: "color 150ms ease",
                      }}
                    >
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
