import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const key = process.env.GEMINI_API_KEY || ""

  let testResult: any = "key not set on server"
  if (key) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
        { method: "GET" }
      )
      const data = await res.json().catch(() => null)
      testResult = {
        status: res.status,
        models: data?.models?.slice(0, 5).map((m: any) => m.name) || data || "no body",
      }
    } catch (e: any) {
      testResult = "fetch failed: " + e.message
    }
  }

  return NextResponse.json({
    geminiKeySet: key.length > 0,
    geminiKeyLength: key.length,
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    testResult,
  })
}
