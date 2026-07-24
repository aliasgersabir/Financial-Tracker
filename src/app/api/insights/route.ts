import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()
  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: threeMonthsAgo },
    },
    include: { category: true },
    orderBy: { date: "desc" },
  })

  const monthlyData: Record<string, { income: number; expenses: number; byCategory: Record<string, number> }> = {}
  for (let i = 0; i < 3; i++) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthlyData[key] = { income: 0, expenses: 0, byCategory: {} }
  }

  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!monthlyData[key]) continue
    if (t.type === "income") {
      monthlyData[key].income += t.amount
    } else {
      monthlyData[key].expenses += t.amount
      const cat = t.category?.name || "Uncategorized"
      monthlyData[key].byCategory[cat] = (monthlyData[key].byCategory[cat] || 0) + t.amount
    }
  }

  const insights: {
    type: string
    title: string
    explanation: string
    action: string
    confidence: number
    priority: string
    category?: string
  }[] = []

  const monthKeys = Object.keys(monthlyData).sort()
  if (monthKeys.length >= 2) {
    const current = monthlyData[monthKeys[0]]
    const previous = monthlyData[monthKeys[1]]

    const currentTotal = current.income + current.expenses
    const previousTotal = previous.income + previous.expenses
    if (previousTotal > 0) {
      const change = ((currentTotal - previousTotal) / previousTotal) * 100
      if (Math.abs(change) > 10) {
        insights.push({
          type: "spending_change",
          title: change > 0 ? "Spending increased" : "Spending decreased",
          explanation: `Your total spending ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(1)}% compared to last month.`,
          action: change > 0 ? "Review your recent expenses for areas to cut back." : "Great job reducing spending!",
          confidence: 0.85,
          priority: change > 20 ? "high" : "medium",
        })
      }
    }

    const allCategories = new Set<string>()
    for (const mk of monthKeys) {
      for (const cat of Object.keys(monthlyData[mk].byCategory)) allCategories.add(cat)
    }
    for (const cat of allCategories) {
      const curr = current.byCategory[cat] || 0
      const prev = previous.byCategory[cat] || 0
      if (prev > 0) {
        const catChange = ((curr - prev) / prev) * 100
        if (catChange > 25) {
          insights.push({
            type: "category_increase",
            title: `${cat} spending up ${catChange.toFixed(0)}%`,
            explanation: `Spending on ${cat} increased from $${prev.toFixed(2)} to $${curr.toFixed(2)}.`,
            action: `Consider setting a budget for ${cat} to keep spending in check.`,
            confidence: 0.8,
            priority: catChange > 50 ? "high" : "medium",
            category: cat,
          })
        }
      }
    }
  }

  const totalIncome = Object.values(monthlyData).reduce((s, m) => s + m.income, 0)
  const totalExpenses = Object.values(monthlyData).reduce((s, m) => s + m.expenses, 0)
  if (totalIncome > 0) {
    const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100
    if (savingsRate < 0) {
      insights.push({
        type: "negative_savings",
        title: "You're spending more than you earn",
        explanation: `Your savings rate is ${savingsRate.toFixed(1)}% over the last 3 months.`,
        action: "Review your expenses and identify areas where you can reduce spending.",
        confidence: 0.95,
        priority: "high",
      })
    } else if (savingsRate < 10) {
      insights.push({
        type: "low_savings",
        title: "Low savings rate",
        explanation: `Your savings rate is ${savingsRate.toFixed(1)}%. A rate of 20% or higher is recommended.`,
        action: "Try to increase your savings by reducing non-essential expenses.",
        confidence: 0.9,
        priority: "medium",
      })
    }
  }

  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`
  const currentBudgets = await prisma.budget.findMany({
    where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
    include: { items: { include: { category: true } } },
  })

  for (const budget of currentBudgets) {
    for (const item of budget.items) {
      const spent = monthlyData[currentMonth]?.byCategory[item.category?.name || ""] || 0
      if (spent > item.amount) {
        const overPct = ((spent - item.amount) / item.amount) * 100
        insights.push({
          type: "budget_over",
          title: `Over budget: ${item.category?.name}`,
          explanation: `You've spent $${spent.toFixed(2)} of your $${item.amount.toFixed(2)} budget for ${item.category?.name} (${overPct.toFixed(0)}% over).`,
          action: `Try to limit ${item.category?.name} spending for the rest of the month.`,
          confidence: 0.95,
          priority: overPct > 20 ? "high" : "medium",
          category: item.category?.name || undefined,
        })
      }
    }
  }

  const goals = await prisma.goal.findMany({
    where: { userId, status: "active" },
  })
  for (const goal of goals) {
    const pct = (goal.currentSaved / goal.targetAmount) * 100
    if (goal.deadline) {
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      if (daysLeft < 30 && pct < 80) {
        insights.push({
          type: "goal_behind",
          title: `Goal "${goal.name}" may be missed`,
          explanation: `You've saved $${goal.currentSaved.toFixed(2)} of $${goal.targetAmount.toFixed(2)} (${pct.toFixed(0)}%) with ${daysLeft} days left.`,
          action: `Consider increasing contributions to reach your "${goal.name}" goal on time.`,
          confidence: 0.85,
          priority: "high",
        })
      }
    }
  }

  await prisma.aIInsight.deleteMany({
    where: { userId, isDismissed: false },
  })

  const createdInsights = await Promise.all(
    insights.slice(0, 5).map((insight) =>
      prisma.aIInsight.create({
        data: {
          userId,
          type: insight.type,
          title: insight.title,
          explanation: insight.explanation,
          action: insight.action,
          confidence: insight.confidence,
          priority: insight.priority,
          category: insight.category || null,
          expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      })
    )
  )

  return NextResponse.json(createdInsights)
  } catch (error) {
    console.error("Insights API error:", error)
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { insightId, action } = await req.json()

  if (!insightId || !action) {
    return NextResponse.json({ error: "insightId and action are required" }, { status: 400 })
  }

  if (action === "read") {
    const updated = await prisma.aIInsight.update({
      where: { id: insightId },
      data: { isRead: true },
    })

    await prisma.insightHistory.create({
      data: {
        userId: session.user.id,
        insightType: updated.type,
        insightTitle: updated.title,
        action: "read",
      },
    })

    return NextResponse.json(updated)
  }

  if (action === "dismiss") {
    const updated = await prisma.aIInsight.update({
      where: { id: insightId },
      data: { isDismissed: true },
    })

    await prisma.insightHistory.create({
      data: {
        userId: session.user.id,
        insightType: updated.type,
        insightTitle: updated.title,
        action: "dismissed",
      },
    })

    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Invalid action. Use 'read' or 'dismiss'." }, { status: 400 })
}
