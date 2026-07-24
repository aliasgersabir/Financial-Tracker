import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const now = new Date()

  const threeMonthsAgo = new Date(now)
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: threeMonthsAgo } },
    include: { category: true },
    orderBy: { date: "desc" },
  })

  const monthlyStats: Record<string, { income: number; expenses: number }> = {}
  for (let i = 0; i < 3; i++) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    monthlyStats[key] = { income: 0, expenses: 0 }
  }

  for (const t of transactions) {
    const d = new Date(t.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!monthlyStats[key]) continue
    if (t.type === "income") monthlyStats[key].income += t.amount
    else monthlyStats[key].expenses += t.amount
  }

  const totalIncome = Object.values(monthlyStats).reduce((s, m) => s + m.income, 0)
  const totalExpenses = Object.values(monthlyStats).reduce((s, m) => s + m.expenses, 0)
  const avgMonthlyExpenses = totalExpenses / 3

  // 1. Savings Rate (0-25 points)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
  let savingsScore = 0
  if (savingsRate > 20) savingsScore = 25
  else if (savingsRate > 10) savingsScore = 20
  else if (savingsRate > 5) savingsScore = 15
  else if (savingsRate > 0) savingsScore = 10

  // 2. Budget Discipline (0-20 points)
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const budgets = await prisma.budget.findMany({
    where: { userId, month: currentMonth, year: currentYear },
    include: { items: { include: { category: true } } },
  })

  let totalBudgetItems = 0
  let withinBudgetCount = 0

  for (const budget of budgets) {
    for (const item of budget.items) {
      totalBudgetItems++
      const catId = item.categoryId
      const spent = transactions
        .filter((t) => t.type === "expense" && t.categoryId === catId)
        .reduce((s, t) => s + t.amount, 0)
      if (spent <= item.amount) withinBudgetCount++
    }
  }

  const budgetDiscipline = totalBudgetItems > 0 ? (withinBudgetCount / totalBudgetItems) * 100 : 100
  const budgetScore = Math.round((budgetDiscipline / 100) * 20)

  // 3. Goal Progress (0-20 points)
  const activeGoals = await prisma.goal.findMany({
    where: { userId, status: "active" },
  })

  let goalProgress = 0
  if (activeGoals.length > 0) {
    const onTrackCount = activeGoals.filter((g) => {
      const pct = (g.currentSaved / g.targetAmount) * 100
      if (!g.deadline) return pct > 0
      const daysTotal = (new Date(g.deadline).getTime() - g.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const daysElapsed = (now.getTime() - g.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      const timeProgress = daysTotal > 0 ? (daysElapsed / daysTotal) * 100 : 100
      return pct >= timeProgress * 0.8
    }).length
    goalProgress = (onTrackCount / activeGoals.length) * 100
  }
  const goalScore = Math.round((goalProgress / 100) * 20)

  // 4. Emergency Fund (0-15 points)
  const savingsAccounts = await prisma.account.findMany({
    where: { userId, type: "savings" },
  })
  const totalSavings = savingsAccounts.reduce((s, a) => s + a.balance, 0)
  const emergencyMonths = avgMonthlyExpenses > 0 ? totalSavings / avgMonthlyExpenses : 0
  let emergencyScore = 0
  if (emergencyMonths >= 6) emergencyScore = 15
  else if (emergencyMonths >= 3) emergencyScore = 12
  else if (emergencyMonths >= 1) emergencyScore = 8
  else if (emergencyMonths > 0) emergencyScore = 4

  // 5. Spending Consistency (0-10 points)
  const monthlyExpenses = Object.values(monthlyStats).map((m) => m.expenses)
  const avgMonthly = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length
  const variance = monthlyExpenses.reduce((s, e) => s + Math.pow(e - avgMonthly, 2), 0) / monthlyExpenses.length
  const stdDev = Math.sqrt(variance)
  const consistencyRatio = avgMonthly > 0 ? stdDev / avgMonthly : 0
  let consistencyScore = 0
  if (consistencyRatio < 0.1) consistencyScore = 10
  else if (consistencyRatio < 0.2) consistencyScore = 7
  else if (consistencyRatio < 0.3) consistencyScore = 4

  // 6. Debt Ratio (0-10 points)
  const totalDebt = transactions
    .filter((t) => t.type === "expense" && t.description.toLowerCase().includes("loan") || t.description.toLowerCase().includes("debt") || t.description.toLowerCase().includes("credit"))
    .reduce((s, t) => s + t.amount, 0)
  const monthlyIncome = totalIncome / 3
  const debtRatio = monthlyIncome > 0 ? (totalDebt / 3) / monthlyIncome : 0
  let debtScore = 0
  if (debtRatio === 0) debtScore = 10
  else if (debtRatio < 0.1) debtScore = 8
  else if (debtRatio < 0.2) debtScore = 5
  else if (debtRatio < 0.36) debtScore = 3

  const totalScore = savingsScore + budgetScore + goalScore + emergencyScore + consistencyScore + debtScore

  const breakdown = {
    savings: { score: savingsScore, max: 25, rate: Math.round(savingsRate * 10) / 10 },
    budget: { score: budgetScore, max: 20, discipline: Math.round(budgetDiscipline) },
    goals: { score: goalScore, max: 20, progress: Math.round(goalProgress) },
    emergency: { score: emergencyScore, max: 15, months: Math.round(emergencyMonths * 10) / 10 },
    consistency: { score: consistencyScore, max: 10, ratio: Math.round(consistencyRatio * 100) / 100 },
    debt: { score: debtScore, max: 10, ratio: Math.round(debtRatio * 100) / 100 },
  }

  const snapshot = await prisma.financialHealthSnapshot.create({
    data: {
      userId,
      score: totalScore,
      savingsRate: Math.round(savingsRate * 10) / 10,
      budgetDiscipline: Math.round(budgetDiscipline * 10) / 10,
      goalProgress: Math.round(goalProgress * 10) / 10,
      emergencyFund: Math.round(emergencyMonths * 10) / 10,
      spendingConsistency: Math.round(consistencyRatio * 100) / 100,
      debtRatio: Math.round(debtRatio * 100) / 100,
      breakdown: JSON.stringify(breakdown),
    },
  })

  return NextResponse.json({
    score: totalScore,
    breakdown,
    snapshot: {
      id: snapshot.id,
      snapshotDate: snapshot.snapshotDate,
    },
  })
}
