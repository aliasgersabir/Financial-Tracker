"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sparkles, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password")
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F6] p-6">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-2.5 mb-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#111111]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[17px] font-semibold text-[#111111] tracking-tight">
            FinOS
          </span>
        </div>

        <h1 className="text-[32px] font-bold text-[#111111] tracking-tight mb-2">
          Welcome back
        </h1>
        <p className="text-[15px] text-[#6B7280] mb-8">
          Sign in to your account to continue
        </p>

        {error && (
          <div className="mb-6 rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-3.5 text-[13px] text-[#DC2626] font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 text-[14px] text-[#111111] transition-all duration-150 placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#111111] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 pr-11 text-[14px] text-[#111111] transition-all duration-150 placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9CA3AF] hover:text-[#6B7280] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-full bg-[#2563EB] text-white text-[14px] font-medium hover:bg-[#1D4ED8] transition-all duration-150 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6B7280] mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
