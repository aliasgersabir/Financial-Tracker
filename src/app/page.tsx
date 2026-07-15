"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Sparkles,
  ArrowRight,
  Wallet,
  BarChart3,
  Tags,
  Shield,
  Zap,
  Heart,
} from "lucide-react"

const features = [
  {
    icon: Wallet,
    title: "Track Accounts",
    desc: "All your bank accounts, wallets, and cards in one place.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Visual Insights",
    desc: "Beautiful charts that make your spending patterns clear.",
    color: "from-violet-500 to-purple-500",
  },
  {
    icon: Tags,
    title: "Smart Categories",
    desc: "Organize transactions with custom categories and icons.",
    color: "from-amber-500 to-orange-500",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            FinOS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-xl hover:bg-gray-100"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-medium text-indigo-700 mb-6">
            <Zap className="h-4 w-4" />
            Your money, beautifully organized
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
              Personal Finance
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Operating System
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Stop juggling spreadsheets. FinOS gives you a single, beautiful place
            to track accounts, categorize spending, and understand your money flow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:shadow-2xl hover:-translate-y-0.5"
            >
              Start Tracking Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-gray-600 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-300 hover:bg-gray-50 transition-all"
            >
              I have an account
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur-3xl opacity-20" />
          <div className="relative rounded-3xl border-2 border-gray-100 bg-white p-2 shadow-2xl">
            <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">$24,563</p>
                  <p className="text-xs text-emerald-600 mt-1">+12.5% this month</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Income</p>
                  <p className="text-2xl font-bold text-emerald-600">$8,450</p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Expenses</p>
                  <p className="text-2xl font-bold text-red-500">$3,241</p>
                  <p className="text-xs text-gray-500 mt-1">This month</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[65, 45, 80, 35, 55, 70, 40, 90, 60, 75, 50, 85].map((h, i) => (
                  <div key={i} className="flex-1 flex items-end">
                    <div
                      className="w-full rounded-lg bg-gradient-to-t from-indigo-500 to-purple-400 transition-all hover:from-indigo-600 hover:to-purple-500"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="bg-white border-t-2 border-gray-100 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need, nothing you don&apos;t
            </h2>
            <p className="text-gray-500 text-lg">
              Clean, fast, and fun to use. Just like your finances should be.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border-2 border-gray-100 p-8 hover:border-indigo-100 hover:shadow-lg transition-all duration-300"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t-2 border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            Built with <Heart className="h-4 w-4 text-red-400 fill-red-400" /> by FinOS
          </div>
          <p className="text-sm text-gray-400">
            Phase 1 — Your Personal Finance OS
          </p>
        </div>
      </footer>
    </div>
  )
}
