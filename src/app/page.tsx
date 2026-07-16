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
    <div className="min-h-screen bg-[#F8F8F6] overflow-x-hidden">
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
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

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-[#6B7280] shadow-sm border border-[#F3F4F6] mb-8">
            <Zap className="h-3.5 w-3.5 text-[#2563EB]" />
            Your money, beautifully organized
          </div>

          <h1 className="text-5xl md:text-[72px] font-bold tracking-[-0.03em] leading-[1.05] mb-6 text-[#111111]">
            Personal Finance
            <br />
            <span className="text-[#9CA3AF]">Operating System</span>
          </h1>

          <p className="text-lg md:text-xl text-[#6B7280] max-w-xl mx-auto mb-10 leading-relaxed">
            Stop juggling spreadsheets. FinOS gives you a single, beautiful place
            to track accounts, categorize spending, and understand your money flow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-7 py-3 text-[15px] font-medium text-white bg-[#2563EB] rounded-full hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Start Tracking Free
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-7 py-3 text-[15px] font-medium text-[#111111] bg-white border border-[#E5E7EB] rounded-full hover:bg-[#F9FAFB] transition-all duration-150 shadow-sm"
            >
              I have an account
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
        >
          <div className="rounded-[24px] bg-white p-2 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-[#F3F4F6] overflow-hidden">
            <div className="rounded-[20px] bg-[#F8F8F6] p-6 md:p-8 overflow-hidden">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
                <div className="rounded-[16px] bg-white p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <p className="text-[12px] text-[#9CA3AF] font-medium mb-1">Total Balance</p>
                  <p className="text-[20px] md:text-[22px] font-semibold text-[#111111]">$24,563</p>
                  <p className="text-[12px] text-[#16A34A] font-medium mt-1">+12.5% this month</p>
                </div>
                <div className="rounded-[16px] bg-white p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <p className="text-[12px] text-[#9CA3AF] font-medium mb-1">Income</p>
                  <p className="text-[20px] md:text-[22px] font-semibold text-[#16A34A]">$8,450</p>
                  <p className="text-[12px] text-[#9CA3AF] font-medium mt-1">This month</p>
                </div>
                <div className="rounded-[16px] bg-white p-4 md:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                  <p className="text-[12px] text-[#9CA3AF] font-medium mb-1">Expenses</p>
                  <p className="text-[20px] md:text-[22px] font-semibold text-[#DC2626]">$3,241</p>
                  <p className="text-[12px] text-[#9CA3AF] font-medium mt-1">This month</p>
                </div>
              </div>
              <div className="flex gap-1.5 md:gap-2 h-[80px] md:h-[100px]">
                {[65, 45, 80, 35, 55, 70, 40, 90, 60, 75, 50, 85].map((h, i) => (
                  <div key={i} className="flex-1 flex items-end">
                    <div
                      className="w-full rounded-[4px] bg-[#2563EB] opacity-70 hover:opacity-100 transition-opacity"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="bg-white border-t border-[#F3F4F6] py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-[40px] font-bold text-[#111111] tracking-tight mb-4">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-[#6B7280] text-lg">
              Clean, fast, and simple. Just like your finances should be.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.3 }}
                className="rounded-[20px] bg-[#F8F8F6] p-7 md:p-8 hover:bg-white hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-5">
                  <feature.icon className="h-5 w-5 text-[#2563EB]" />
                </div>
                <h3 className="text-[17px] font-semibold text-[#111111] mb-2">{feature.title}</h3>
                <p className="text-[15px] text-[#6B7280] leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#F3F4F6] py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
            Built with <Heart className="h-3.5 w-3.5 text-[#DC2626] fill-[#DC2626]" /> by FinOS
          </div>
          <p className="text-[13px] text-[#D1D5DB]">
            Phase 1 — Your Personal Finance OS
          </p>
        </div>
      </footer>
    </div>
  )
}
