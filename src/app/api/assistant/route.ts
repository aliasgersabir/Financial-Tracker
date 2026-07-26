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
  const cur = "₹"

  const fmt = (n: number) => {
    if (n >= 10000000) return `${cur}${(n / 10000000).toFixed(2)} Cr`
    if (n >= 100000) return `${cur}${(n / 100000).toFixed(2)} L`
    return `${cur}${Math.round(n).toLocaleString("en-IN")}`
  }

  if (q.includes("salary") || q.includes("afford") || q.includes("rent") || q.includes("emi")) {
    const nums = question.match(/\d[\d,\.]*/g)
    let rent = 0
    if (nums && nums.length > 0) {
      rent = parseInt(nums[0].replace(/,/g, ""))
      if (q.includes("lakh") || q.includes("lac")) rent *= 100000
      else if (q.includes("k")) rent *= 1000
    }
    if (rent > 0) {
      const ideal = rent * 3
      const max = rent * 4
      let out = `**To afford ${fmt(rent)} rent:**\n\n`
      out += `- **Ideal salary:** ${fmt(ideal)}/month (${fmt(ideal * 12)}/year)\n`
      out += `- **Maximum safe:** ${fmt(max)}/month (${fmt(max * 12)}/year)\n`
      out += `- Rule: Rent should be max 30% of take-home\n\n`
      out += `**Your situation:**\n`
      out += `- Balance: ${fmt(s.totalBalance)}\n`
      out += `- Income: ${fmt(s.monthlyIncome)}/mo\n`
      out += `- Expenses: ${fmt(s.monthlyExpenses)}/mo\n`
      if (s.monthlyIncome > 0) {
        if (rent <= s.monthlyIncome * 0.3)
          out += `\n✅ At ${fmt(s.monthlyIncome)}/month income, ${fmt(rent)} rent is **affordable** (${Math.round(rent / s.monthlyIncome * 100)}%).`
        else
          out += `\n⚠️ At ${fmt(s.monthlyIncome)}/month income, ${fmt(rent)} rent is **${Math.round(rent / s.monthlyIncome * 100)}%** — too high (should be <30%).`
      }
      return out
    }
    return `**Salary needed for rent:**\n\nRule: Monthly salary should be **3x the rent** (rent = 30% of income).\n\nExamples:\n- ₹10,000 rent → ₹30,000 salary needed\n- ₹25,000 rent → ₹75,000 salary needed\n- ₹50,000 rent → ₹1,50,000 salary needed\n\nAdd a number to your question for a personalized calculation!`
  }

  if (q.includes("save") || q.includes("saving") || q.includes("invest")) {
    const savings = s.monthlyIncome - s.monthlyExpenses
    const topCats = data.spendingByCategory.slice(0, 5)
    let out = `**Savings Analysis:**\n\n`
    out += `- Savings: **${fmt(savings)}**/month (${s.savingsRate}%)\n`
    out += `- Target (20%): **${fmt(s.monthlyIncome * 0.2)}**/month\n`
    if (savings < s.monthlyIncome * 0.2) {
      out += `- Gap: **${fmt(s.monthlyIncome * 0.2 - savings)}** short\n\n`
      out += `**Ways to save more:**\n`
      topCats.forEach((c: any) => out += `- Cut ${c.name} 10% → save **${fmt(c.amount * 0.1)}**/mo\n`)
    } else {
      out += `\n✅ You're above the 20% target! Consider investing the surplus.`
    }
    return out
  }

  if (q.includes("spent") || q.includes("expense") || q.includes("spend") || q.includes("where") || q.includes("category") || q.includes("most") || q.includes("food") || q.includes("travel") || q.includes("shop")) {
    const topCats = data.spendingByCategory.slice(0, 8)
    let out = `**Spending (${fmt(s.monthlyExpenses)} this month):**\n\n`
    topCats.forEach((c: any, i: number) => {
      const pct = s.monthlyExpenses > 0 ? Math.round(c.amount / s.monthlyExpenses * 100) : 0
      out += `${i + 1}. **${c.name}**: ${fmt(c.amount)} (${pct}%)\n`
      if (c.change !== null) out += `   ${c.change > 0 ? `↑${c.change}%` : `↓${Math.abs(c.change)}%`} vs last month\n`
    })
    if (s.monthOverMonthChange !== null) {
      out += `\n**vs Last Month:** ${s.monthOverMonthChange > 0 ? `↑${s.monthOverMonthChange}%` : `↓${Math.abs(s.monthOverMonthChange)}%`}`
    }
    return out
  }

  if (q.includes("goal") || q.includes("target") || q.includes("reach") || q.includes("dream")) {
    if (data.goals.length === 0) return "No savings goals yet. Create one in **Goals** to start tracking!\n\nTip: Set specific targets with deadlines."
    let out = `**Savings Goals:**\n\n`
    const ms = s.monthlyIncome - s.monthlyExpenses
    data.goals.forEach((g: any) => {
      const rem = g.target - g.saved
      const mo = ms > 0 ? Math.ceil(rem / ms) : "∞"
      out += `**${g.name}** — ${g.percentage}% complete\n`
      out += `  ${fmt(g.saved)} / ${fmt(g.target)} (need ${fmt(rem)} more)\n`
      out += `  ETA: ${mo === "∞" ? "can't reach at current pace" : mo + " months"}\n\n`
    })
    return out
  }

  if (q.includes("budget")) {
    if (data.budgets.length === 0) return "No budgets set. Create one in **Budgets** to control spending!"
    let out = `**Budget Status:**\n\n`
    data.budgets.forEach((b: any) => {
      out += `**${b.name}**\n`
      b.items.forEach((i: any) => {
        const cat = data.spendingByCategory.find((c: any) => c.name === i.category)
        const spent = cat ? cat.amount : 0
        const pct = i.budgeted > 0 ? Math.round(spent / i.budgeted * 100) : 0
        const icon = pct >= 100 ? "🔴" : pct >= 80 ? "🟡" : "🟢"
        out += `  ${icon} ${i.category}: ${fmt(spent)} / ${fmt(i.budgeted)} (${pct}%)\n`
      })
      out += "\n"
    })
    return out
  }

  if (q.includes("subscri") || q.includes("cancel") || q.includes("recurring")) {
    if (data.subscriptions.length === 0 && data.recurringRules.length === 0) return "No active subscriptions or recurring payments."
    let out = ""
    if (data.subscriptions.length > 0) {
      out += `**Subscriptions (${data.subscriptions.length}):**\n\n`
      data.subscriptions.forEach((sub: any) => {
        const mc = sub.frequency === "yearly" ? sub.amount / 12 : sub.amount
        out += `- **${sub.name}**: ${fmt(mc)}/mo (${sub.frequency})\n`
      })
      out += `\nTotal: **${fmt(s.subscriptionCost)}/mo** → **${fmt(s.subscriptionCost * 12)}/year**`
    }
    if (data.recurringRules.length > 0) {
      if (out) out += "\n\n"
      out += `**Recurring:**\n`
      data.recurringRules.forEach((r: any) => out += `- ${r.description}: ${fmt(r.amount)} ${r.type} (${r.frequency})\n`)
    }
    return out
  }

  if (q.includes("income") || q.includes("earn")) {
    let out = `**Income:**\n\n`
    out += `- This month: **${fmt(s.monthlyIncome)}**\n`
    out += `- Expenses: **${fmt(s.monthlyExpenses)}**\n`
    out += `- Net: **${fmt(s.monthlyIncome - s.monthlyExpenses)}**\n`
    if (s.monthlyIncome > 0)
      out += `\nKeeping **${s.savingsRate}%** of income. ${s.savingsRate >= 20 ? "Solid!" : "Try to save 20%."}`
    return out
  }

  if (q.includes("biggest") || q.includes("largest") || q.includes("expensive")) {
    if (data.topExpenses.length === 0) return "No expenses this month."
    let out = `**Top Expenses:**\n\n`
    data.topExpenses.slice(0, 5).forEach((e: any, i: number) => {
      out += `${i + 1}. **${e.description}** — ${fmt(e.amount)}\n   ${e.date} • ${e.category}\n`
    })
    return out
  }

  if (q.includes("balance") || q.includes("net worth") || q.includes("account")) {
    let out = `**Accounts:**\n\n`
    data.accounts.forEach((a: any) => out += `- **${a.name}** (${a.type}): ${fmt(a.balance)}\n`)
    out += `\n**Total: ${fmt(s.totalBalance)}**`
    return out
  }

  // Default: full overview
  let out = `**Financial Overview**\n\n`
  out += `💰 Balance: **${fmt(s.totalBalance)}**\n`
  out += `📈 Income: **${fmt(s.monthlyIncome)}**/mo\n`
  out += `📉 Expenses: **${fmt(s.monthlyExpenses)}**/mo\n`
  out += `💎 Savings: **${fmt(s.monthlyIncome - s.monthlyExpenses)}** (${s.savingsRate}%)\n`
  if (data.spendingByCategory.length > 0) {
    out += `\n**Top spending:**\n`
    data.spendingByCategory.slice(0, 3).forEach((c: any) => out += `- ${c.name}: ${fmt(c.amount)}\n`)
  }
  if (data.goals.length > 0) {
    out += `\n**Goals:** ${data.goals.map((g: any) => `${g.name} ${g.percentage}%`).join(", ")}\n`
  }
  out += `\n💬 Ask about: spending, savings, goals, budget, subscriptions, salary, rent, or any question!`
  return out
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
