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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F8F6]">
      <nav className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#111111]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold text-[#111111] tracking-tight">
            FinOS
          </span>
        </div>
        <div className="flex items-center gap-2">
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

      <section className="mx-auto max-w-[1120px] px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#F3F4F6] bg-white px-4 py-1.5 text-[13px] font-medium text-[#6B7280] shadow-sm">
            <Zap className="h-3.5 w-3.5 text-[#2563EB]" />
            Your money, beautifully organized
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-[-0.03em] text-[#111111] md:text-[72px]">
            Personal Finance
            <br />
            <span className="text-[#9CA3AF]">Operating System</span>
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#6B7280] md:text-xl">
            Stop juggling spreadsheets. FinOS gives you a single, beautiful place
            to track accounts, categorize spending, and understand your money flow.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3 text-[15px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-[#1D4ED8] hover:shadow-md active:scale-[0.98]"
            >
              Start Tracking Free
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-7 py-3 text-[15px] font-medium text-[#111111] shadow-sm transition-all duration-150 hover:bg-[#F9FAFB]"
            >
              I have an account
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-[960px] px-6 pb-24">
        <div className="overflow-hidden rounded-[24px] border border-[#F3F4F6] bg-white p-[6px] shadow-[0_2px_24px_rgba(0,0,0,0.06)]">
          <div className="rounded-[20px] bg-[#F3F4F6] p-6 sm:p-8">
            <div className="mb-5 grid grid-cols-3 gap-3">
              <div className="rounded-[14px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="mb-1 text-[11px] font-medium text-[#9CA3AF]">Total Balance</p>
                <p className="text-[18px] font-semibold tracking-tight text-[#111111] sm:text-[22px]">$24,563</p>
                <p className="mt-1 text-[11px] font-medium text-[#16A34A]">+12.5% this month</p>
              </div>
              <div className="rounded-[14px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="mb-1 text-[11px] font-medium text-[#9CA3AF]">Income</p>
                <p className="text-[18px] font-semibold tracking-tight text-[#16A34A] sm:text-[22px]">$8,450</p>
                <p className="mt-1 text-[11px] font-medium text-[#9CA3AF]">This month</p>
              </div>
              <div className="rounded-[14px] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <p className="mb-1 text-[11px] font-medium text-[#9CA3AF]">Expenses</p>
                <p className="text-[18px] font-semibold tracking-tight text-[#DC2626] sm:text-[22px]">$3,241</p>
                <p className="mt-1 text-[11px] font-medium text-[#9CA3AF]">This month</p>
              </div>
            </div>
            <div className="flex h-[72px] gap-[6px] sm:h-[90px] sm:gap-2">
              {[65, 45, 80, 35, 55, 70, 40, 90, 60, 75, 50, 85].map((h, i) => (
                <div key={i} className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-[3px] bg-[#2563EB] opacity-60 transition-opacity hover:opacity-100 sm:rounded-[4px]"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#F3F4F6] bg-white py-20 md:py-24">
        <div className="mx-auto max-w-[1120px] px-6">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-[#111111] md:text-[40px]">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-lg text-[#6B7280]">
              Clean, fast, and simple. Just like your finances should be.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="rounded-[20px] bg-[#F8F8F6] p-7 transition-all duration-200 hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] md:p-8"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[12px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <feature.icon className="h-5 w-5 text-[#2563EB]" />
                </div>
                <h3 className="mb-2 text-[17px] font-semibold text-[#111111]">{feature.title}</h3>
                <p className="text-[15px] leading-relaxed text-[#6B7280]">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#F3F4F6] py-8">
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
