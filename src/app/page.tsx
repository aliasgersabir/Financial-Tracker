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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#F8F8F6]">
      {/* Nav */}
      <nav className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#111111]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold text-[#111111] tracking-tight">
            FinOS
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/login"
            className="px-4 py-2 text-[14px] font-medium text-[#6B7280] hover:text-[#111111] transition-colors rounded-full hover:bg-white"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-[14px] font-medium text-white bg-[#2563EB] rounded-full hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1120px] px-6 pt-20 pb-20 text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#F3F4F6] bg-white px-4 py-1.5 text-[13px] font-medium text-[#6B7280] shadow-sm">
          <Zap className="h-3.5 w-3.5 text-[#2563EB]" />
          Your money, beautifully organized
        </div>

        <h1 className="mb-6 text-[clamp(2.5rem,8vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-[#111111]">
          Personal Finance
          <br />
          <span className="text-[#9CA3AF]">Operating System</span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#6B7280]">
          Stop juggling spreadsheets. FinOS gives you a single, beautiful place
          to track accounts, categorize spending, and understand your money flow.
        </p>

        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3 text-[15px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#1D4ED8]"
          >
            Start Tracking Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-7 py-3 text-[15px] font-medium text-[#111111] shadow-sm transition-all duration-150 hover:bg-[#F9FAFB]"
          >
            I have an account
          </Link>
        </div>
      </section>

      {/* Mock Dashboard */}
      <section className="mx-auto w-full max-w-[900px] px-6 pb-24">
        <div className="w-full rounded-[20px] border border-[#E5E7EB] bg-white p-3 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:p-4">
          <div className="w-full rounded-[14px] bg-[#F3F4F6] p-5 sm:p-7">
            <div className="mb-4 grid w-full grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-[12px] bg-white p-3 shadow-sm sm:p-4">
                <p className="text-[11px] font-medium text-[#9CA3AF]">Total Balance</p>
                <p className="mt-0.5 truncate text-[18px] font-semibold text-[#111111] sm:text-[22px]">$24,563</p>
                <p className="text-[11px] font-medium text-[#16A34A]">+12.5% this month</p>
              </div>
              <div className="min-w-0 rounded-[12px] bg-white p-3 shadow-sm sm:p-4">
                <p className="text-[11px] font-medium text-[#9CA3AF]">Income</p>
                <p className="mt-0.5 truncate text-[18px] font-semibold text-[#16A34A] sm:text-[22px]">$8,450</p>
                <p className="text-[11px] font-medium text-[#9CA3AF]">This month</p>
              </div>
              <div className="min-w-0 rounded-[12px] bg-white p-3 shadow-sm sm:p-4">
                <p className="text-[11px] font-medium text-[#9CA3AF]">Expenses</p>
                <p className="mt-0.5 truncate text-[18px] font-semibold text-[#DC2626] sm:text-[22px]">$3,241</p>
                <p className="text-[11px] font-medium text-[#9CA3AF]">This month</p>
              </div>
            </div>
            <div className="flex w-full items-end gap-[5px]" style={{ height: "80px" }}>
              {barHeights.map((h, i) => (
                <div key={i} className="min-h-0 min-w-0 flex-1">
                  <div
                    className="w-full rounded-[3px] bg-[#2563EB] sm:rounded-[4px]"
                    style={{ height: `${h}%`, opacity: 0.65 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="w-full border-t border-[#F3F4F6] bg-white py-20">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#111111]">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-lg text-[#6B7280]">
              Clean, fast, and simple. Just like your finances should be.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="rounded-[20px] bg-[#F8F8F6] p-7 transition-all duration-200 hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-white shadow-sm">
                  <feature.icon className="h-5 w-5 text-[#2563EB]" />
                </div>
                <h3 className="mb-2 text-[17px] font-semibold text-[#111111]">{feature.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#6B7280]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#F3F4F6] bg-white py-8">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
            Built with <Heart className="h-3.5 w-3.5 fill-[#DC2626] text-[#DC2626]" /> by FinOS
          </div>
          <p className="text-[13px] text-[#D1D5DB]">
            Phase 1 — Your Personal Finance OS
          </p>
        </div>
      </footer>
    </div>
  )
}
