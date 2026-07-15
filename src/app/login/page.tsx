"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Sparkles, Eye, EyeOff } from "lucide-react"

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
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 mx-auto mb-8">
            <Sparkles className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Welcome back</h1>
          <p className="text-lg text-white/80">
            Your financial dashboard is waiting for you.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">FinOS</span>
          </div>

          <h2 className="text-3xl font-bold mb-2">Sign in</h2>
          <p className="text-gray-500 mb-8">
            Enter your credentials to access your account
          </p>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border-2 border-red-100 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 pr-12 text-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
