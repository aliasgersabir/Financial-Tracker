import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434"
const MODEL = process.env.OLLAMA_MODEL || "gemma4:e4b"

function buildFinancialContext(userId: string, now: Date) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  return Promise.all([
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
}

function formatFinancialData(
  transactions: any[],
  accounts: any[],
  categories: any[],
  goals: any[],
  budgets: any[],
  subscriptions: any[],
  recurringRules: any[],
  now: Date
) {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthTx = transactions.filter(t => t.date >= monthStart)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const monthlyIncome = currentMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const monthlyExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  const spendingByCategory: Record<string, number> = {}
  currentMonthTx.filter(t => t.type === "expense").forEach(t => {
    const name = t.category?.name || "Uncategorized"
    spendingByCategory[name] = (spendingByCategory[name] || 0) + t.amount
  })

  const topExpenses = [...currentMonthTx]
    .filter(t => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  const recentTx = transactions.slice(0, 30).map(t => ({
    date: t.date.toISOString().split("T")[0],
    description: t.description,
    amount: t.amount,
    type: t.type,
    category: t.category?.name || "Uncategorized",
    account: t.account?.name || "Unknown",
  }))

  return {
    summary: {
      totalBalance: totalBalance.toFixed(2),
      monthlyIncome: monthlyIncome.toFixed(2),
      monthlyExpenses: monthlyExpenses.toFixed(2),
      monthlySavings: (monthlyIncome - monthlyExpenses).toFixed(2),
      savingsRate: monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) + "%" : "0%",
    },
    accounts: accounts.map(a => ({ name: a.name, type: a.type, balance: a.balance.toFixed(2) })),
    spendingByCategory: Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount]) => ({ name, amount: amount.toFixed(2) })),
    topExpenses: topExpenses.map(t => ({
      date: t.date.toISOString().split("T")[0],
      description: t.description,
      amount: t.amount.toFixed(2),
      category: t.category?.name || "Uncategorized",
    })),
    recentTransactions: recentTx,
    goals: goals.map(g => ({
      name: g.name,
      target: g.targetAmount.toFixed(2),
      saved: g.currentSaved.toFixed(2),
      deadline: g.deadline?.toISOString().split("T")[0] || null,
      percentage: g.targetAmount > 0 ? ((g.currentSaved / g.targetAmount) * 100).toFixed(0) + "%" : "0%",
    })),
    budgets: budgets.map(b => ({
      name: b.name,
      month: b.month,
      year: b.year,
      totalAmount: b.totalAmount?.toFixed(2) || "0",
      items: b.items.map((i: any) => ({
        category: i.category?.name || "Unknown",
        budgeted: i.amount.toFixed(2),
      })),
    })),
    subscriptions: subscriptions.map(s => ({
      name: s.name,
      amount: s.amount.toFixed(2),
      frequency: s.frequency,
      category: s.category || "General",
    })),
    recurringRules: recurringRules.map(r => ({
      description: r.description,
      amount: r.amount.toFixed(2),
      type: r.type,
      frequency: r.frequency,
      nextRunDate: r.nextRunDate.toISOString().split("T")[0],
    })),
  }
}

const SYSTEM_PROMPT = `You are FinOS AI, a personal financial advisor built into the FinOS app. You have access to the user's complete financial data.

Your role:
- Analyze their spending patterns, income, expenses, savings, goals, budgets, and subscriptions
- Give specific, actionable advice based on THEIR actual numbers
- Be conversational but concise — like a knowledgeable financial friend
- Use the currency from their data (all amounts are already formatted)
- When suggesting savings, calculate exact numbers from their data
- Compare their spending across months when relevant
- Flag any concerning patterns (overspending, missed goals, etc.)
- You can answer ANY question about their finances — no question is too specific
- When they ask about a specific category, date, or transaction, search through the data provided
- Be encouraging but honest — if they're overspending, say so clearly

Rules:
- Always respond in the same language the user writes in
- Keep responses focused and helpful, not overly long
- Use markdown formatting for readability (bold, bullet points, etc.)
- If you don't have enough data to answer, say so honestly
- Never make up financial data — only use what's provided
- You have full context of their recent transactions, accounts, goals, budgets, subscriptions, and recurring rules`

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { question, history } = await request.json()
    if (!question?.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 })
    }

    const userId = session.user.id
    const now = new Date()

    const [transactions, accounts, categories, goals, budgets, subscriptions, recurringRules] =
      await buildFinancialContext(userId, now)

    const financialData = formatFinancialData(
      transactions, accounts, categories, goals, budgets, subscriptions, recurringRules, now
    )

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: `Here is the user's current financial data:\n\n${JSON.stringify(financialData, null, 2)}` },
    ]

    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        messages.push({ role: msg.role, content: msg.content })
      }
    }

    messages.push({ role: "user", content: question })

    const ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          num_predict: 2048,
        },
      }),
    })

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text().catch(() => "Unknown error")
      console.error("Ollama error:", ollamaRes.status, errText)
      return new Response(JSON.stringify({
        answer: "I couldn't connect to the AI model. Make sure Ollama is running (`ollama serve`).",
        suggestions: ["Start Ollama: run `ollama serve` in your terminal"],
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const stream = new ReadableStream({
      async start(controller) {
        let fullAnswer = ""
        try {
          const reader = ollamaRes.body?.getReader()
          if (!reader) {
            controller.enqueue(encoder.encode(JSON.stringify({ done: true, answer: "" })))
            controller.close()
            return
          }

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split("\n").filter(Boolean)

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line)
                if (parsed.message?.content) {
                  fullAnswer += parsed.message.content
                  controller.enqueue(encoder.encode(JSON.stringify({
                    token: parsed.message.content,
                    done: false,
                  }) + "\n"))
                }
                if (parsed.done) {
                  const suggestions = generateSuggestions(fullAnswer, financialData)
                  controller.enqueue(encoder.encode(JSON.stringify({
                    done: true,
                    answer: fullAnswer,
                    suggestions,
                  }) + "\n"))
                }
              } catch {}
            }
          }
        } catch (err) {
          console.error("Stream error:", err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error) {
    console.error("Assistant API error:", error)
    return NextResponse.json(
      { answer: "Something went wrong. Please try again.", suggestions: [] },
      { status: 200 }
    )
  }
}

function generateSuggestions(answer: string, data: any): string[] {
  const suggestions: string[] = []
  const savingsRate = parseFloat(data.summary.savingsRate)
  const monthlyExpenses = parseFloat(data.summary.monthlyExpenses)
  const monthlyIncome = parseFloat(data.summary.monthlyIncome)

  if (savingsRate < 20 && monthlyIncome > 0) {
    suggestions.push("How can I increase my savings rate to 20%?")
  }
  if (data.subscriptions.length > 0) {
    suggestions.push("Which subscriptions should I cancel?")
  }
  if (data.goals.length > 0) {
    suggestions.push("Am I on track to meet my savings goals?")
  }
  if (data.spendingByCategory.length > 0) {
    suggestions.push(`Tell me more about my ${data.spendingByCategory[0].name} spending`)
  }
  if (monthlyExpenses > monthlyIncome) {
    suggestions.push("Help me create a plan to reduce expenses")
  }

  return suggestions.slice(0, 3)
}
