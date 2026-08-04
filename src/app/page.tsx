"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  MessageCircle,
  Shield,
  Smartphone,
  Lock,
  Heart,
  PieChart,
  Wallet,
} from "lucide-react"

const features = [
  {
    icon: TrendingUp,
    title: "See Everything",
    desc: "All your accounts, subscriptions, and spending in one place.",
  },
  {
    icon: Target,
    title: "Hit Your Goals",
    desc: "Set savings targets and watch your progress grow.",
  },
  {
    icon: MessageCircle,
    title: "AI Assistant",
    desc: "Ask questions about your money and get instant answers.",
  },
]

const donutSegments = [
  { color: "#2563EB", pct: 35, label: "Rent" },
  { color: "#16A34A", pct: 25, label: "Food" },
  { color: "#F59E0B", pct: 20, label: "Travel" },
  { color: "#DC2626", pct: 12, label: "Shopping" },
  { color: "#8B5CF6", pct: 8, label: "Other" },
]

export default function LandingPage() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#F8F8F6", overflowX: "hidden" }}>
      {/* Nav */}
      <nav
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: isMobile ? "16px 20px" : "20px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "12px",
              background: "#111111",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles style={{ width: "16px", height: "16px", color: "white" }} />
          </div>
          <span style={{ fontSize: "17px", fontWeight: 600, color: "#111111" }}>FinOS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/login"
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#6B7280",
              borderRadius: "9999px",
              textDecoration: "none",
            }}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            style={{
              padding: "8px 20px",
              fontSize: "14px",
              fontWeight: 500,
              color: "white",
              background: "#2563EB",
              borderRadius: "9999px",
              textDecoration: "none",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          maxWidth: "1120px",
          margin: "0 auto",
          padding: isMobile ? "48px 20px 24px" : "80px 24px 24px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: isMobile ? "clamp(2rem, 8vw, 2.5rem)" : "clamp(2.5rem, 5vw, 3.5rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: "#111111",
            marginBottom: "16px",
          }}
        >
          Take Control of
          <br />
          Your Money
        </h1>
        <p
          style={{
            maxWidth: "520px",
            margin: "0 auto 36px",
            fontSize: isMobile ? "16px" : "18px",
            lineHeight: 1.6,
            color: "#6B7280",
          }}
        >
          Track every rupee. See where it goes. Build the life you want.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              background: "#2563EB",
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: 600,
              color: "white",
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)",
            }}
          >
            Start Free
            <ArrowRight style={{ width: "16px", height: "16px" }} />
          </Link>
          <Link
            href="#features"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "9999px",
              border: "1px solid #E5E7EB",
              background: "transparent",
              padding: "12px 28px",
              fontSize: "15px",
              fontWeight: 500,
              color: "#111111",
              textDecoration: "none",
            }}
          >
            See How It Works
          </Link>
        </div>
      </section>

      {/* Mini Dashboard Preview */}
      <section
        style={{
          width: "100%",
          maxWidth: "780px",
          margin: "0 auto",
          padding: isMobile ? "32px 20px 64px" : "56px 24px 100px",
        }}
      >
        <div
          style={{
            width: "100%",
            borderRadius: "20px",
            border: "1px solid #E5E7EB",
            background: "#FFFFFF",
            padding: isMobile ? "16px" : "24px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
          }}
        >
          {/* Stat cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            {/* Balance */}
            <div
              style={{
                borderRadius: "16px",
                background: "#F8F8F6",
                padding: isMobile ? "16px" : "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#EEF2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Wallet style={{ width: "20px", height: "20px", color: "#2563EB" }} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "#9CA3AF", margin: 0 }}>
                  Balance
                </p>
                <p
                  style={{
                    fontSize: isMobile ? "20px" : "22px",
                    fontWeight: 700,
                    color: "#111111",
                    margin: "2px 0 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ₹2,45,630
                </p>
              </div>
            </div>

            {/* Income */}
            <div
              style={{
                borderRadius: "16px",
                background: "#F8F8F6",
                padding: isMobile ? "16px" : "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#ECFDF5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <TrendingUp style={{ width: "20px", height: "20px", color: "#16A34A" }} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "#9CA3AF", margin: 0 }}>
                  Income
                </p>
                <p
                  style={{
                    fontSize: isMobile ? "20px" : "22px",
                    fontWeight: 700,
                    color: "#16A34A",
                    margin: "2px 0 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ₹85,000
                </p>
              </div>
            </div>

            {/* Expenses */}
            <div
              style={{
                borderRadius: "16px",
                background: "#F8F8F6",
                padding: isMobile ? "16px" : "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "#FEF2F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <PieChart style={{ width: "20px", height: "20px", color: "#DC2626" }} />
              </div>
              <div>
                <p style={{ fontSize: "12px", fontWeight: 500, color: "#9CA3AF", margin: 0 }}>
                  Expenses
                </p>
                <p
                  style={{
                    fontSize: isMobile ? "20px" : "22px",
                    fontWeight: 700,
                    color: "#DC2626",
                    margin: "2px 0 0",
                    letterSpacing: "-0.02em",
                  }}
                >
                  ₹42,500
                </p>
              </div>
            </div>
          </div>

          {/* Spending breakdown row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "16px" : "28px",
              borderRadius: "16px",
              background: "#F8F8F6",
              padding: isMobile ? "16px" : "20px 24px",
              flexDirection: isMobile ? "column" : "row",
            }}
          >
            {/* Donut placeholder */}
            <div
              style={{
                position: "relative",
                width: isMobile ? "100px" : "110px",
                height: isMobile ? "100px" : "110px",
                flexShrink: 0,
              }}
            >
              <svg viewBox="0 0 36 36" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                {(() => {
                  let cumulative = 0
                  return donutSegments.map((seg, i) => {
                    const dash = seg.pct
                    const offset = 100 - cumulative
                    cumulative += seg.pct
                    return (
                      <circle
                        key={i}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="3.5"
                        strokeDasharray={`${dash} ${offset}`}
                        strokeDashoffset={`${offset}`}
                        strokeLinecap="round"
                      />
                    )
                  })
                })()}
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>Spent</p>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#111111", margin: "1px 0 0" }}>
                  ₹42.5K
                </p>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", flex: 1 }}>
              {donutSegments.map((seg) => (
                <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      background: seg.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: "13px", color: "#6B7280" }}>
                    {seg.label} · {seg.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        style={{
          width: "100%",
          borderTop: "1px solid #E5E7EB",
          background: "#FFFFFF",
          padding: isMobile ? "48px 0" : "80px 0",
        }}
      >
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2
              style={{
                fontSize: isMobile ? "24px" : "30px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#111111",
                marginBottom: "12px",
              }}
            >
              What you get
            </h2>
            <p style={{ fontSize: "17px", color: "#6B7280", margin: 0 }}>
              Everything you need to feel good about your money.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.35 }}
                style={{
                  borderRadius: "20px",
                  background: "#F8F8F6",
                  padding: isMobile ? "24px" : "32px 28px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "14px",
                    background: "#EEF2FF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "20px",
                  }}
                >
                  <feature.icon style={{ width: "22px", height: "22px", color: "#2563EB" }} />
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#111111",
                    marginBottom: "8px",
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "#6B7280",
                    margin: 0,
                  }}
                >
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section
        style={{
          width: "100%",
          borderTop: "1px solid #E5E7EB",
          background: "#FFFFFF",
          padding: isMobile ? "32px 20px" : "40px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? "12px" : "32px",
            flexWrap: "wrap",
          }}
        >
          {[
            { icon: Lock, text: "Bank-level encryption" },
            { icon: Shield, text: "No ads" },
            { icon: Heart, text: "Free forever" },
            { icon: Smartphone, text: "Works on mobile" },
          ].map((item) => (
            <div
              key={item.text}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                fontWeight: 500,
                color: "#6B7280",
              }}
            >
              <item.icon style={{ width: "16px", height: "16px", color: "#9CA3AF" }} />
              {item.text}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid #E5E7EB",
          background: "#FFFFFF",
          padding: "32px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1120px",
            margin: "0 auto",
            textAlign: "center",
            fontSize: "13px",
            color: "#9CA3AF",
          }}
        >
          Built with <Heart style={{ width: "13px", height: "13px", fill: "#DC2626", color: "#DC2626", verticalAlign: "-2px" }} /> by FinOS &middot; Your data stays yours
        </div>
      </footer>
    </div>
  )
}
