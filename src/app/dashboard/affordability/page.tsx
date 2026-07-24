"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { ShoppingCart, Calculator, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface AnalysisResult {
  recommendation: string
  remainingSavings: number
  emergencyFundImpact: string
  goalDelay: string
  budgetImpact: string
  cashFlowProjection: { month: string; balance: number }[]
}

const formatCurrency = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function AffordabilityPage() {
  const { status } = useSession()
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [form, setForm] = useState({
    productName: "",
    price: "",
    paymentMethod: "cash",
    purchaseDate: new Date().toISOString().split("T")[0],
  })

  const [hoverAnalyze, setHoverAnalyze] = useState(false)
  const [inputFocused, setInputFocused] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") window.location.href = "/login"
  }, [status])

  useEffect(() => {
    if (status === "authenticated") setLoading(false)
  }, [status])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setAnalyzing(true)
    setResult(null)
    try {
      const res = await fetch("/api/affordability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName,
          price: parseFloat(form.price),
          paymentMethod: form.paymentMethod,
          purchaseDate: form.purchaseDate,
        }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      console.error("Failed to analyze affordability")
    } finally {
      setAnalyzing(false)
    }
  }

  const getRecommendationConfig = (rec: string) => {
    switch (rec?.toLowerCase()) {
      case "buy":
        return { icon: CheckCircle, bg: "#F0FDF4", color: "#16A34A", border: "#BBF7D0", label: "Buy" }
      case "caution":
        return { icon: AlertCircle, bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", label: "Caution" }
      case "wait":
        return { icon: XCircle, bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", label: "Wait" }
      default:
        return { icon: AlertCircle, bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", label: rec || "Unknown" }
    }
  }

  const inputStyle = (field: string): React.CSSProperties => ({
    height: "44px",
    width: "100%",
    borderRadius: "12px",
    border: inputFocused === field ? "1px solid #2563EB" : "1px solid #E5E7EB",
    background: "white",
    padding: "0 14px",
    fontSize: "14px",
    color: "#111111",
    outline: "none",
    transition: "all 150ms ease",
    boxShadow: inputFocused === field ? "0 0 0 2px rgba(37,99,235,0.1)" : "none",
    boxSizing: "border-box" as const,
  })

  if (status === "loading" || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "24px", height: "24px", animation: "spin 1s linear infinite", borderRadius: "9999px", border: "2px solid #E5E7EB", borderTopColor: "#2563EB" }} />
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111111", letterSpacing: "-0.025em" }}>Affordability Simulator</h1>
        <p style={{ fontSize: "15px", color: "#6B7280", marginTop: "2px" }}>Test before you buy</p>
      </div>

      <div style={{ borderRadius: "20px", background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <form onSubmit={handleAnalyze} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Product Name</label>
            <input
              type="text"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
              onFocus={() => setInputFocused("productName")}
              onBlur={() => setInputFocused(null)}
              placeholder="e.g. MacBook Pro"
              required
              style={inputStyle("productName")}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                onFocus={() => setInputFocused("price")}
                onBlur={() => setInputFocused(null)}
                placeholder="0.00"
                min="0.01"
                required
                style={inputStyle("price")}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Payment Method</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                style={{
                  ...inputStyle("paymentMethod"),
                  cursor: "pointer",
                  WebkitAppearance: "none",
                  appearance: "none",
                  backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E\")",
                  backgroundSize: "18px",
                  backgroundPosition: "right 12px center",
                  backgroundRepeat: "no-repeat",
                  paddingRight: "40px",
                }}
              >
                <option value="cash">Cash</option>
                <option value="credit card">Credit Card</option>
                <option value="emi">EMI</option>
                <option value="loan">Loan</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Purchase Date</label>
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                style={inputStyle("purchaseDate")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={analyzing}
            onMouseEnter={() => setHoverAnalyze(true)}
            onMouseLeave={() => setHoverAnalyze(false)}
            style={{
              alignSelf: "flex-end", display: "inline-flex", alignItems: "center", gap: "8px",
              borderRadius: "9999px", padding: "10px 24px",
              background: hoverAnalyze ? "#1D4ED8" : "#2563EB",
              fontSize: "14px", fontWeight: 500, color: "white",
              transition: "all 150ms ease", cursor: "pointer",
              opacity: analyzing ? 0.6 : 1, border: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <Calculator style={{ width: "16px", height: "16px", animation: analyzing ? "spin 1s linear infinite" : "none" }} />
            {analyzing ? "Analyzing..." : "Analyze"}
          </button>
        </form>
      </div>

      {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{
              borderRadius: "20px", background: getRecommendationConfig(result.recommendation).bg, padding: "24px",
              border: `1px solid ${getRecommendationConfig(result.recommendation).border}`,
              display: "flex", alignItems: "center", gap: "16px",
            }}>
              <div style={{
                width: "48px", height: "48px", borderRadius: "9999px",
                background: "white", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {(() => { const C = getRecommendationConfig(result.recommendation).icon; return <C style={{ width: "24px", height: "24px", color: getRecommendationConfig(result.recommendation).color }} /> })()}
              </div>
              <div>
                <p style={{ fontSize: "13px", color: getRecommendationConfig(result.recommendation).color, fontWeight: 500, margin: 0 }}>Recommendation</p>
                <p style={{ fontSize: "28px", fontWeight: 700, color: getRecommendationConfig(result.recommendation).color, margin: "2px 0 0", letterSpacing: "-0.025em" }}>{getRecommendationConfig(result.recommendation).label}</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
              <div style={{ borderRadius: "20px", background: "white", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Remaining Savings</p>
                <p style={{ fontSize: "22px", fontWeight: 700, color: "#111111", margin: "6px 0 0" }}>{formatCurrency(result.remainingSavings)}</p>
              </div>
              <div style={{ borderRadius: "20px", background: "white", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Emergency Fund Impact</p>
                <p style={{ fontSize: "15px", fontWeight: 500, color: "#111111", margin: "6px 0 0", lineHeight: "1.5" }}>{result.emergencyFundImpact}</p>
              </div>
              <div style={{ borderRadius: "20px", background: "white", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Goal Delay Analysis</p>
                <p style={{ fontSize: "15px", fontWeight: 500, color: "#111111", margin: "6px 0 0", lineHeight: "1.5" }}>{result.goalDelay}</p>
              </div>
              <div style={{ borderRadius: "20px", background: "white", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <p style={{ fontSize: "12px", color: "#9CA3AF", margin: 0, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Budget Impact</p>
                <p style={{ fontSize: "15px", fontWeight: 500, color: "#111111", margin: "6px 0 0", lineHeight: "1.5" }}>{result.budgetImpact}</p>
              </div>
            </div>

            {result.cashFlowProjection && result.cashFlowProjection.length > 0 && (
              <div style={{ borderRadius: "20px", background: "white", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", marginBottom: "20px" }}>Cash Flow Projection</h3>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "120px" }}>
                  {result.cashFlowProjection.map((item, i) => {
                    const maxVal = Math.max(...result.cashFlowProjection.map((p) => Math.abs(p.balance)), 1)
                    const height = Math.max((Math.abs(item.balance) / maxVal) * 100, 4)
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{formatCurrency(item.balance)}</span>
                        <div style={{
                          width: "100%", height: `${height}%`, borderRadius: "4px 4px 0 0",
                          background: item.balance >= 0 ? "#2563EB" : "#DC2626",
                          transition: "height 300ms ease",
                        }} />
                        <span style={{ fontSize: "10px", color: "#9CA3AF" }}>{item.month}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
      )}

      {!result && !analyzing && (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "60px 0", background: "white", borderRadius: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "9999px", background: "#F3F4F6",
            display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px",
          }}>
            <ShoppingCart style={{ width: "24px", height: "24px", color: "#9CA3AF" }} />
          </div>
          <p style={{ fontSize: "16px", fontWeight: 500, color: "#111111", marginBottom: "4px" }}>Enter a purchase above</p>
          <p style={{ fontSize: "14px", color: "#9CA3AF" }}>We&apos;ll analyze how it impacts your finances</p>
        </div>
      )}
    </div>
  )
}
