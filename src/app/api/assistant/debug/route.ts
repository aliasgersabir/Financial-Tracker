import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const geminiKey = process.env.GEMINI_API_KEY || ""
  const groqKey = process.env.GROQ_API_KEY || ""

  let geminiTest: any = "key not set on server"
  if (geminiKey) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
        { method: "GET" }
      )
      const data = await res.json().catch(() => null)
      geminiTest = {
        status: res.status,
        models: data?.models?.slice(0, 5).map((m: any) => m.name) || data || "no body",
      }
    } catch (e: any) {
      geminiTest = "fetch failed: " + e.message
    }
  }

  let groqTest: any = "key not set on server"
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        method: "GET",
        headers: { "Authorization": `Bearer ${groqKey}` },
      })
      const data = await res.json().catch(() => null)
      groqTest = {
        status: res.status,
        models: data?.data?.slice(0, 10).map((m: any) => m.id) || data || "no body",
      }
    } catch (e: any) {
      groqTest = "fetch failed: " + e.message
    }
  }

  return NextResponse.json({
    geminiKeySet: geminiKey.length > 0,
    geminiKeyLength: geminiKey.length,
    groqKeySet: groqKey.length > 0,
    groqKeyLength: groqKey.length,
    ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    geminiTest,
    groqTest,
  })
}
