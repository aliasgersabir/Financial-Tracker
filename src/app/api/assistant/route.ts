import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GoogleGenerativeAI } from "@google/generative-ai"

const GEMINI_KEY = process.env.GEMINI_API_KEY || ""
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5-coder:7b"

async function buildFinancialContext(userId: string, now: Date) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  const [transactions, accounts, categories, goals, budgets, subscriptions, recurringRules] =
    await Promise.all([
      prisma.transaction.findMany({
        where: { userId, date: { gte: threeMonthsAgo } },
        include: { category: true, account: true },
        orderBy: { date: "desc" },
      }).catch(() => []),
      prisma.account.findMany({ where: { userId } }).catch(() => []),
      prisma.category.findMany({ where: { userId } }).catch(() => []),
      prisma.goal.findMany({ where: { userId } }).catch(() => []),
      prisma.budget.findMany({
        where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
        include: { items: { include: { category: true } } },
      }).catch(() => []),
      prisma.subscription.findMany({ where: { userId, isActive: true } }).catch(() => []),
      prisma.recurringRule.findMany({ where: { userId, isActive: true } }).catch(() => []),
    ])

  const monthStart2 = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthTx = transactions.filter(t => t.date >= monthStart2)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthTx = transactions.filter(t => t.date >= lastMonthStart && t.date < monthStart2)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const monthlyIncome = currentMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const monthlyExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const lastMonthExpenses = lastMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  const spendingByCategory: Record<string, number> = {}
  currentMonthTx.filter(t => t.type === "expense").forEach(t => {
    const name = t.category?.name || "Uncategorized"
    spendingByCategory[name] = (spendingByCategory[name] || 0) + t.amount
  })

  const lastMonthByCategory: Record<string, number> = {}
  lastMonthTx.filter(t => t.type === "expense").forEach(t => {
    const name = t.category?.name || "Uncategorized"
    lastMonthByCategory[name] = (lastMonthByCategory[name] || 0) + t.amount
  })

  const topExpenses = [...currentMonthTx]
    .filter(t => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)
    .map(t => ({
      date: t.date.toISOString().split("T")[0],
      description: t.description,
      amount: t.amount,
      category: t.category?.name || "Uncategorized",
    }))

  const recentTx = transactions.slice(0, 20).map(t => ({
    date: t.date.toISOString().split("T")[0],
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category?.name || "Uncategorized",
  }))

  const subMonthly = subscriptions.reduce((s, sub) => {
    if (sub.frequency === "yearly") return s + sub.amount / 12
    if (sub.frequency === "weekly") return s + sub.amount * 4
    return s + sub.amount
  }, 0)

  const goalsSummary = goals.map(g => ({
    name: g.name,
    target: g.targetAmount,
    saved: g.currentSaved,
    deadline: g.deadline?.toISOString().split("T")[0] || null,
    percentage: g.targetAmount > 0 ? Math.round((g.currentSaved / g.targetAmount) * 100) : 0,
  }))

  const budgetSummary = budgets.map(b => ({
    name: b.name,
    month: b.month,
    year: b.year,
    items: b.items.map((i: any) => ({
      category: i.category?.name || "Unknown",
      budgeted: i.amount,
    })),
  }))

  return {
    summary: {
      totalBalance,
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      savingsRate: monthlyIncome > 0 ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100) : 0,
      lastMonthExpenses,
      monthOverMonthChange: lastMonthExpenses > 0 ? Math.round(((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100) : null,
      subscriptionCost: subMonthly,
    },
    accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance })),
    spendingByCategory: Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => {
        const lastMonth = lastMonthByCategory[name] || 0
        return { name, amount, lastMonth, change: lastMonth > 0 ? Math.round(((amount - lastMonth) / lastMonth) * 100) : null }
      }),
    topExpenses,
    recentTransactions: recentTx,
    goals: goalsSummary,
    budgets: budgetSummary,
    subscriptions: subscriptions.map(s => ({ name: s.name, amount: s.amount, frequency: s.frequency })),
    recurringRules: recurringRules.map(r => ({ description: r.description, amount: r.amount, type: r.type, frequency: r.frequency })),
  }
}

const SYSTEM_PROMPT = `You are FinOS AI, a smart personal financial advisor. You have the user's COMPLETE financial data.

IMPORTANT RULES:
- Analyze their actual numbers — don't give generic advice
- Use bullet points and bold for readability
- Be specific: "You spent ₹X on Y" not "You spent money"
- Compare months when relevant (month-over-month changes)
- Calculate savings rates, projections, and percentages from their data
- Flag concerning patterns clearly
- Be encouraging but honest
- Keep responses focused: 2-4 paragraphs max unless asked for detail
- Match the user's language (if they write in Hindi/Hinglish, respond in that style)
- Use their currency symbols from the data
- For budget questions, reference their actual budgets
- For goal questions, calculate timeline based on current savings rate
- For subscription questions, calculate annual cost and suggest cuts`

function formatContextForLLM(data: any): string {
  const lines: string[] = []
  lines.push(`=== FINANCIAL SNAPSHOT (as of ${new Date().toISOString().split("T")[0]}) ===`)
  lines.push("")
  lines.push(`BALANCE: ${data.summary.totalBalance}`)
  lines.push(`THIS MONTH: Income ${data.summary.monthlyIncome} | Expenses ${data.summary.monthlyExpenses} | Savings ${data.summary.monthlySavings} (${data.summary.savingsRate}% rate)`)
  if (data.summary.monthOverMonthChange !== null) {
    lines.push(`vs LAST MONTH: Expenses ${data.summary.monthOverMonthChange > 0 ? "UP" : "DOWN"} ${Math.abs(data.summary.monthOverMonthChange)}%`)
  }
  lines.push(`SUBSCRIPTIONS: ${data.summary.subscriptionCost}/month total`)
  lines.push("")
  lines.push("ACCOUNTS:")
  data.accounts.forEach((a: any) => lines.push(`  - ${a.name} (${a.type}): ${a.balance}`))
  lines.push("")
  lines.push("SPENDING BY CATEGORY (this month):")
  data.spendingByCategory.forEach((c: any) => {
    const changeStr = c.change !== null ? ` (was ${c.lastMonth}, ${c.change > 0 ? "+" : ""}${c.change}%)` : " (new)"
    lines.push(`  - ${c.name}: ${c.amount}${changeStr}`)
  })
  lines.push("")
  lines.push("TOP 10 EXPENSES:")
  data.topExpenses.forEach((e: any) => lines.push(`  - ${e.date}: ${e.description} — ${e.amount} [${e.category}]`))
  lines.push("")
  lines.push("RECENT TRANSACTIONS:")
  data.recentTransactions.slice(0, 15).forEach((t: any) => lines.push(`  - ${t.date}: ${t.description} — ${t.amount} (${t.type}, ${t.category})`))
  if (data.goals.length > 0) {
    lines.push("")
    lines.push("SAVINGS GOALS:")
    data.goals.forEach((g: any) => lines.push(`  - ${g.name}: ${g.saved}/${g.target} (${g.percentage}%)${g.deadline ? ` due ${g.deadline}` : ""}`))
  }
  if (data.budgets.length > 0) {
    lines.push("")
    lines.push("BUDGETS:")
    data.budgets.forEach((b: any) => {
      lines.push(`  - ${b.name}:`)
      b.items.forEach((i: any) => lines.push(`    ${i.category}: ${i.budgeted}`))
    })
  }
  if (data.subscriptions.length > 0) {
    lines.push("")
    lines.push("ACTIVE SUBSCRIPTIONS:")
    data.subscriptions.forEach((s: any) => lines.push(`  - ${s.name}: ${s.amount}/${s.frequency}`))
  }
  if (data.recurringRules.length > 0) {
    lines.push("")
    lines.push("RECURRING RULES:")
    data.recurringRules.forEach((r: any) => lines.push(`  - ${r.description}: ${r.amount} ${r.type} (${r.frequency})`))
  }
  return lines.join("\n")
}

async function streamGemini(
  question: string,
  financialContext: string,
  history: { role: string; content: string }[]
): Promise<ReadableStream> {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const chatHistory = history.slice(-10).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history: chatHistory })

  const result = await chat.sendMessage([
    SYSTEM_PROMPT + "\n\nHere is the user's financial data:\n\n" + financialContext,
    question,
  ])

  const response = await result.response
  const text = response.text()

  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      controller.enqueue(encoder.encode(JSON.stringify({ token: text, done: false }) + "\n"))
      controller.enqueue(encoder.encode(JSON.stringify({ done: true, answer: text, suggestions: [] }) + "\n"))
      controller.close()
    },
  })
}

async function streamGeminiRealtime(
  question: string,
  financialContext: string,
  history: { role: string; content: string }[]
): Promise<ReadableStream> {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const chatHistory = history.slice(-10).map(m => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
  })

  const result = await chat.sendMessageStream([
    SYSTEM_PROMPT + "\n\nHere is the user's financial data:\n\n" + financialContext,
    question,
  ])

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullAnswer = ""
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullAnswer += text
            controller.enqueue(encoder.encode(JSON.stringify({ token: text, done: false }) + "\n"))
          }
        }
        controller.enqueue(encoder.encode(JSON.stringify({ done: true, answer: fullAnswer, suggestions: [] }) + "\n"))
      } catch (err) {
        console.error("Gemini stream error:", err)
        controller.enqueue(encoder.encode(JSON.stringify({ done: true, answer: fullAnswer || "Error receiving response.", suggestions: [] }) + "\n"))
      }
      controller.close()
    },
  })
}

async function streamOllama(
  question: string,
  financialContext: string,
  history: { role: string; content: string }[]
): Promise<ReadableStream> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT + "\n\nHere is the user's financial data:\n\n" + financialContext },
    ...history.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: question },
  ]

  const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: true, options: { temperature: 0.7, num_predict: 2048 } }),
  })

  if (!ollamaRes.ok) throw new Error("Ollama not available")

  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      let fullAnswer = ""
      const reader = ollamaRes.body?.getReader()
      if (!reader) { controller.close(); return }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          for (const line of chunk.split("\n").filter(Boolean)) {
            try {
              const parsed = JSON.parse(line)
              if (parsed.message?.content) {
                fullAnswer += parsed.message.content
                controller.enqueue(encoder.encode(JSON.stringify({ token: parsed.message.content, done: false }) + "\n"))
              }
            } catch {}
          }
        }
        controller.enqueue(encoder.encode(JSON.stringify({ done: true, answer: fullAnswer, suggestions: [] }) + "\n"))
      } catch (err) {
        console.error("Ollama stream error:", err)
      }
      controller.close()
    },
  })
}

function basicAnalysis(data: any, question: string): string {
  const q = question.toLowerCase()
  const s = data.summary

  if (q.includes("save") || q.includes("savings")) {
    return `Your savings rate is **${s.savingsRate}%** this month.\n\nIncome: **${s.monthlyIncome}**\nExpenses: **${s.monthlyExpenses}**\nNet Savings: **${s.monthlySavings}**\n\n${s.savingsRate >= 20 ? "Great job — you're saving above the recommended 20%!" : `To reach the recommended 20% savings rate, try to reduce expenses by **${Math.round(s.monthlyIncome * 0.2 - s.monthlySavings)}**.`}`
  }

  if (q.includes("spent") || q.includes("expense") || q.includes("spending")) {
    const top3 = data.spendingByCategory.slice(0, 3)
    return `**This Month's Spending: ${s.monthlyExpenses}**\n\nTop categories:\n${top3.map((c: any) => `- ${c.name}: **${c.amount}**`).join("\n")}\n\nYour biggest expense is **${top3[0]?.name || "N/A"}** at **${top3[0]?.amount || 0}**.`
  }

  if (q.includes("goal")) {
    if (data.goals.length === 0) return "You don't have any savings goals yet. Create one in the Goals section!"
    return data.goals.map((g: any) => `- **${g.name}**: ${g.saved} of ${g.target} (${g.percentage}%)${g.deadline ? ` — due ${g.deadline}` : ""}`).join("\n\n")
  }

  if (q.includes("subscription")) {
    if (data.subscriptions.length === 0) return "You have no active subscriptions."
    return `**Active Subscriptions (${data.subscriptions.length}):**\n\n${data.subscriptions.map((s: any) => `- ${s.name}: **${s.amount}/${s.frequency}**`).join("\n")}\n\nTotal monthly cost: **${s.subscriptionCost}**\nAnnual cost: **${Math.round(s.subscriptionCost * 12)}**`
  }

  return `**Financial Summary**\n\nBalance: **${s.totalBalance}**\nIncome: **${s.monthlyIncome}**\nExpenses: **${s.monthlyExpenses}**\nSavings: **${s.monthlySavings}** (${s.savingsRate}%)\nSubscriptions: **${s.subscriptionCost}/mo**\n\nAsk me about spending, savings, goals, subscriptions, or any specific financial question!`
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { question, history } = await request.json()
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question required" }, { status: 400 })
    }

    const financialData = await buildFinancialContext(session.user.id, new Date())
    const financialContext = formatContextForLLM(financialData)

    // Try Gemini first (works on Vercel, mobile, everywhere)
    if (GEMINI_KEY) {
      try {
        const stream = await streamGeminiRealtime(question.trim(), financialContext, history || [])
        return new Response(stream, {
          headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
        })
      } catch (err) {
        console.error("Gemini failed, trying fallback:", err)
        // Try non-streaming Gemini as fallback
        try {
          const stream = await streamGemini(question.trim(), financialContext, history || [])
          return new Response(stream, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
          })
        } catch (err2) {
          console.error("Gemini non-streaming also failed:", err2)
        }
      }
    }

    // Try Ollama (local development)
    try {
      const stream = await streamOllama(question.trim(), financialContext, history || [])
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
      })
    } catch (err) {
      console.error("Ollama not available:", err)
    }

    // Fallback: basic analysis (always works)
    const answer = basicAnalysis(financialData, question.trim())
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        controller.enqueue(encoder.encode(JSON.stringify({ token: answer, done: false }) + "\n"))
        controller.enqueue(encoder.encode(JSON.stringify({ done: true, answer, suggestions: [] }) + "\n"))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
    })
  } catch (error) {
    console.error("Assistant API error:", error)
    return NextResponse.json(
      { answer: "Something went wrong. Please try again.", suggestions: [] },
      { status: 200 }
    )
  }
}
