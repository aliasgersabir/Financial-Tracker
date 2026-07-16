"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sparkles, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        setLoading(false)
        return
      }

      router.push("/login?registered=true")
    } catch {
      setError("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F8F6", padding: "24px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "40px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#111111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: "16px", height: "16px", color: "white" }} />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 600, color: "#111111" }}>FinOS</span>
        </div>

        <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#111111", marginBottom: "8px" }}>Create account</h1>
        <p style={{ fontSize: "15px", color: "#6B7280", marginBottom: "32px" }}>Get started with your free account</p>

        {error && (
          <div style={{ marginBottom: "24px", borderRadius: "12px", background: "#FEF2F2", border: "1px solid #FECACA", padding: "14px", fontSize: "13px", color: "#DC2626", fontWeight: 500 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB", background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none", boxSizing: "border-box" }}
              placeholder="John Doe"
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB", background: "white", padding: "0 14px", fontSize: "14px", color: "#111111", outline: "none", boxSizing: "border-box" }}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#111111", marginBottom: "6px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ height: "44px", width: "100%", borderRadius: "12px", border: "1px solid #E5E7EB", background: "white", padding: "0 44px 0 14px", fontSize: "14px", color: "#111111", outline: "none", boxSizing: "border-box" }}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", padding: "4px", color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}
              >
                {showPassword ? <EyeOff style={{ width: "16px", height: "16px" }} /> : <Eye style={{ width: "16px", height: "16px" }} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", height: "44px", borderRadius: "9999px", background: "#2563EB", color: "white", fontSize: "14px", fontWeight: 500, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "8px" }}
          >
            {loading ? (
              <div style={{ width: "16px", height: "16px", border: "2px solid white", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            ) : (
              <>
                Create account
                <ArrowRight style={{ width: "16px", height: "16px" }} />
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#6B7280", marginTop: "32px" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ fontWeight: 500, color: "#2563EB", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
