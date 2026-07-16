"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  Wallet,
  BarChart3,
  Tags,
  Zap,
  Heart,
} from "lucide-react"

const features = [
  {
    icon: Wallet,
    title: "Track Accounts",
    desc: "All your bank accounts, wallets, and cards in one place.",
  },
  {
    icon: BarChart3,
    title: "Visual Insights",
    desc: "Beautiful charts that make your spending patterns clear.",
  },
  {
    icon: Tags,
    title: "Smart Categories",
    desc: "Organize transactions with custom categories and icons.",
  },
]

const barHeights = [65, 45, 80, 35, 55, 70, 40, 90, 60, 75, 50, 85]

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#F8F8F6", overflowX: "hidden" }}>
      {/* Nav */}
      <nav style={{ maxWidth: "1120px", margin: "0 auto", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#111111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles style={{ width: "16px", height: "16px", color: "white" }} />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 600, color: "#111111" }}>FinOS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link href="/login" style={{ padding: "8px 16px", fontSize: "14px", fontWeight: 500, color: "#6B7280", borderRadius: "9999px", textDecoration: "none" }}>
            Log in
          </Link>
          <Link href="/signup" style={{ padding: "8px 20px", fontSize: "14px", fontWeight: 500, color: "white", background: "#2563EB", borderRadius: "9999px", textDecoration: "none" }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "1120px", margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", border: "1px solid #F3F4F6", background: "white", padding: "6px 16px", fontSize: "13px", fontWeight: 500, color: "#6B7280", marginBottom: "32px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <Zap style={{ width: "14px", height: "14px", color: "#2563EB" }} />
          Your money, beautifully organized
        </div>

        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", color: "#111111", marginBottom: "24px" }}>
          Personal Finance
          <br />
          <span style={{ color: "#9CA3AF" }}>Operating System</span>
        </h1>

        <p style={{ maxWidth: "640px", margin: "0 auto 40px", fontSize: "18px", lineHeight: 1.6, color: "#6B7280" }}>
          Stop juggling spreadsheets. FinOS gives you a single, beautiful place
          to track accounts, categorize spending, and understand your money flow.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", background: "#2563EB", padding: "12px 28px", fontSize: "15px", fontWeight: 500, color: "white", textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            Start Tracking Free
            <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
          <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: "8px", borderRadius: "9999px", border: "1px solid #E5E7EB", background: "white", padding: "12px 28px", fontSize: "15px", fontWeight: 500, color: "#111111", textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
            I have an account
          </Link>
        </div>
      </section>

      {/* Mock Dashboard — pure inline styles, no Tailwind */}
      <section style={{ width: "100%", maxWidth: "860px", margin: "0 auto", padding: "0 24px 96px" }}>
        <div style={{ width: "100%", borderRadius: "20px", border: "1px solid #E5E7EB", background: "white", padding: "12px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <div style={{ width: "100%", borderRadius: "14px", background: "#F3F4F6", padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
              <div style={{ borderRadius: "12px", background: "white", padding: "14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF", margin: 0 }}>Total Balance</p>
                <p style={{ fontSize: "20px", fontWeight: 600, color: "#111111", margin: "2px 0 0", whiteSpace: "nowrap" }}>$24,563</p>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#16A34A", margin: "2px 0 0" }}>+12.5% this month</p>
              </div>
              <div style={{ borderRadius: "12px", background: "white", padding: "14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF", margin: 0 }}>Income</p>
                <p style={{ fontSize: "20px", fontWeight: 600, color: "#16A34A", margin: "2px 0 0", whiteSpace: "nowrap" }}>$8,450</p>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF", margin: "2px 0 0" }}>This month</p>
              </div>
              <div style={{ borderRadius: "12px", background: "white", padding: "14px", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", overflow: "hidden" }}>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF", margin: 0 }}>Expenses</p>
                <p style={{ fontSize: "20px", fontWeight: 600, color: "#DC2626", margin: "2px 0 0", whiteSpace: "nowrap" }}>$3,241</p>
                <p style={{ fontSize: "11px", fontWeight: 500, color: "#9CA3AF", margin: "2px 0 0" }}>This month</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "80px" }}>
              {barHeights.map((h, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", height: `${h}%`, borderRadius: "3px", background: "#2563EB", opacity: 0.65 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ width: "100%", borderTop: "1px solid #F3F4F6", background: "white", padding: "80px 0" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <h2 style={{ fontSize: "30px", fontWeight: 700, letterSpacing: "-0.02em", color: "#111111", marginBottom: "16px" }}>
              Everything you need, nothing you don&apos;t
            </h2>
            <p style={{ fontSize: "18px", color: "#6B7280" }}>
              Clean, fast, and simple. Just like your finances should be.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                style={{ borderRadius: "20px", background: "#F8F8F6", padding: "28px", transition: "all 0.2s" }}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                  <feature.icon style={{ width: "20px", height: "20px", color: "#2563EB" }} />
                </div>
                <h3 style={{ fontSize: "17px", fontWeight: 600, color: "#111111", marginBottom: "8px" }}>{feature.title}</h3>
                <p style={{ fontSize: "15px", lineHeight: 1.6, color: "#6B7280", margin: 0 }}>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #F3F4F6", background: "white", padding: "32px 0" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#9CA3AF" }}>
            Built with <Heart style={{ width: "14px", height: "14px", fill: "#DC2626", color: "#DC2626" }} /> by FinOS
          </div>
          <p style={{ fontSize: "13px", color: "#D1D5DB", margin: 0 }}>
            Phase 1 — Your Personal Finance OS
          </p>
        </div>
      </footer>
    </div>
  )
}
