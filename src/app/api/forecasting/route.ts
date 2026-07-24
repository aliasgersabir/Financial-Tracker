import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const period = searchParams.get("period") || "3m"

  const monthsBack = 6
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  })

  const monthlyData: Record<string, { income: number; expenses: number }> = {}
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyData[key] = { income: 0, expenses: 0 }
  }

  for (const t of transactions) {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, "0")}`
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0 }
    if (t.type === "income") {
      monthlyData[key].income += t.amount
    } else {
      monthlyData[key].expenses += t.amount
    }
  }

  const entries = Object.entries(monthlyData)
  const validEntries = entries.filter(([, v]) => v.income > 0 || v.expenses > 0)

  const avgIncome =
    validEntries.length > 0
      ? validEntries.reduce((s, [, v]) => s + v.income, 0) / validEntries.length
      : 0
  const avgExpenses =
    validEntries.length > 0
      ? validEntries.reduce((s, [, v]) => s + v.expenses, 0) / validEntries.length
      : 0
  const avgSavings = avgIncome - avgExpenses

  let trendDirection: "increasing" | "decreasing" | "stable" = "stable"
  if (validEntries.length >= 3) {
    const recentHalf = validEntries.slice(Math.floor(validEntries.length / 2))
    const olderHalf = validEntries.slice(0, Math.floor(validEntries.length / 2))

    const recentAvgExpenses = recentHalf.reduce((s, [, v]) => s + v.expenses, 0) / recentHalf.length
    const olderAvgExpenses = olderHalf.reduce((s, [, v]) => s + v.expenses, 0) / olderHalf.length

    const diff = recentAvgExpenses - olderAvgExpenses
    const threshold = olderAvgExpenses * 0.1

    if (diff > threshold) {
      trendDirection = "increasing"
    } else if (diff < -threshold) {
      trendDirection = "decreasing"
    }
  }

  let trendMultiplier = 1
  if (trendDirection === "increasing") trendMultiplier = 1.05
  if (trendDirection === "decreasing") trendMultiplier = 0.95

  const periodMonths = period === "1m" ? 1 : period === "6m" ? 6 : period === "12m" ? 12 : 3

  const forecastData: Array<{
    month: string
    income: number
    expenses: number
    savings: number
    balance: number
  }> = []

  const lastMonthKey = entries[entries.length - 1]?.[0]
  const lastBalance =
    validEntries.length > 0
      ? validEntries.reduce((s, [, v]) => s + (v.income - v.expenses), 0)
      : 0

  let runningBalance = lastBalance

  for (let i = 1; i <= periodMonths; i++) {
    const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const monthKey = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, "0")}`

    const projectedIncome = avgIncome * Math.pow(trendMultiplier, i)
    const projectedExpenses = avgExpenses * Math.pow(trendMultiplier, i)
    const projectedSavings = projectedIncome - projectedExpenses
    runningBalance += projectedSavings

    forecastData.push({
      month: monthKey,
      income: Math.round(projectedIncome * 100) / 100,
      expenses: Math.round(projectedExpenses * 100) / 100,
      savings: Math.round(projectedSavings * 100) / 100,
      balance: Math.round(runningBalance * 100) / 100,
    })
  }

  const activeGoals = await prisma.goal.findMany({
    where: { userId: session.user.id, status: "active" },
  })

  const goalForecasts = activeGoals.map((goal) => {
    const remaining = goal.targetAmount - goal.currentSaved
    const monthlyNeeded = goal.monthlyTarget || avgSavings * 0.3
    const monthsToComplete = monthlyNeeded > 0 ? Math.ceil(remaining / monthlyNeeded) : Infinity

    const targetDate = new Date(now)
    targetDate.setMonth(targetDate.getMonth() + monthsToComplete)

    return {
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentSaved: goal.currentSaved,
      remaining,
      monthlyTarget: monthlyNeeded,
      estimatedCompletionMonth: targetDate.toISOString().slice(0, 7),
      monthsToComplete,
      willCompleteWithinPeriod: monthsToComplete <= periodMonths,
    }
  })

  const forecastEndDate = new Date(now)
  forecastEndDate.setMonth(forecastEndDate.getMonth() + periodMonths)

  const forecastRecord = await prisma.forecast.create({
    data: {
      userId: session.user.id,
      type: "expense",
      period,
      startDate: now,
      endDate: forecastEndDate,
      data: JSON.stringify({
        forecastData,
        goalForecasts,
        metadata: {
          avgIncome,
          avgExpenses,
          avgSavings,
          trendDirection,
          trendMultiplier,
          historicalMonths: validEntries.length,
        },
      }),
      accuracy: validEntries.length >= 3 ? 0.75 : 0.5,
    },
  })

  return NextResponse.json({
    forecastId: forecastRecord.id,
    period,
    metadata: {
      avgMonthlyIncome: Math.round(avgIncome * 100) / 100,
      avgMonthlyExpenses: Math.round(avgExpenses * 100) / 100,
      avgMonthlySavings: Math.round(avgSavings * 100) / 100,
      trendDirection,
      historicalDataPoints: validEntries.length,
    },
    forecast: forecastData,
    goalForecasts,
  })
}
