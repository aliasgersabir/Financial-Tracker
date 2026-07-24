import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { name, price, paymentMethod, purchaseDate } = body

  if (!name || !price) {
    return NextResponse.json({ error: "Name and price are required" }, { status: 400 })
  }

  const purchaseAmount = parseFloat(price)
  const userId = session.user.id
  const now = new Date()

  const accounts = await prisma.account.findMany({
    where: { userId },
  })
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const remainingBalance = totalBalance - purchaseAmount

  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: threeMonthsAgo },
    },
    orderBy: { date: "desc" },
  })

  const monthlyData: Record<string, { income: number; expenses: number }> = {}
  for (const t of recentTransactions) {
    const key = `${t.date.getFullYear()}-${t.date.getMonth()}`
    if (!monthlyData[key]) monthlyData[key] = { income: 0, expenses: 0 }
    if (t.type === "income") {
      monthlyData[key].income += t.amount
    } else {
      monthlyData[key].expenses += t.amount
    }
  }

  const months = Object.values(monthlyData)
  const avgMonthlyIncome = months.length > 0 ? months.reduce((s, m) => s + m.income, 0) / months.length : 0
  const avgMonthlyExpenses = months.length > 0 ? months.reduce((s, m) => s + m.expenses, 0) / months.length : 0
  const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpenses

  const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`
  const currentMonthData = monthlyData[currentMonthKey] || { income: 0, expenses: 0 }

  const emergencyFundMonths = avgMonthlyExpenses > 0 ? totalBalance / avgMonthlyExpenses : 0

  const activeGoals = await prisma.goal.findMany({
    where: { userId, status: "active" },
  })

  const goalImpacts = activeGoals.map((goal) => {
    const remaining = goal.targetAmount - goal.currentSaved
    const monthlyNeeded = goal.monthlyTarget || 0
    const monthsToComplete = monthlyNeeded > 0 ? remaining / monthlyNeeded : Infinity
    const delayedMonths = monthlyNeeded > 0 ? purchaseAmount / monthlyNeeded : 0

    return {
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentSaved: goal.currentSaved,
      remaining,
      monthlyTarget: monthlyNeeded,
      monthsToComplete: Math.ceil(monthsToComplete),
      purchaseDelayMonths: Math.ceil(delayedMonths),
    }
  })

  const budget = await prisma.budget.findFirst({
    where: {
      userId,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
    include: { items: { include: { category: true } } },
  })

  let budgetImpact = null
  if (budget) {
    const budgetTotal = budget.items.reduce((sum, item) => sum + item.amount, 0)
    const spentInBudget = recentTransactions
      .filter(
        (t) =>
          t.type === "expense" &&
          t.date.getMonth() === now.getMonth() &&
          t.date.getFullYear() === now.getFullYear()
      )
      .reduce((sum, t) => sum + t.amount, 0)

    budgetImpact = {
      totalBudget: budgetTotal,
      spentSoFar: spentInBudget,
      remaining: budgetTotal - spentInBudget,
      afterPurchase: budgetTotal - spentInBudget - purchaseAmount,
      overBudget: spentInBudget + purchaseAmount > budgetTotal,
    }
  }

  const cashFlow = avgMonthlyIncome - avgMonthlyExpenses - purchaseAmount

  const recommendations: string[] = []

  if (remainingBalance < 0) {
    recommendations.push(
      `This purchase would overdraft your accounts by $${Math.abs(remainingBalance).toFixed(2)}. Consider postponing or finding a cheaper alternative.`
    )
  }

  if (emergencyFundMonths < 3 && purchaseAmount > totalBalance * 0.1) {
    recommendations.push(
      `Your emergency fund covers only ${emergencyFundMonths.toFixed(1)} months of expenses. This purchase reduces your safety net significantly.`
    )
  }

  if (purchaseAmount > avgMonthlySavings && avgMonthlySavings > 0) {
    recommendations.push(
      `This costs more than your average monthly savings ($${avgMonthlySavings.toFixed(2)}). It would take more than a month of savings to recover.`
    )
  }

  if (budgetImpact && budgetImpact.overBudget) {
    recommendations.push(
      `This purchase puts you $${(budgetImpact.spentSoFar + purchaseAmount - budgetImpact.totalBudget).toFixed(2)} over your monthly budget.`
    )
  }

  for (const impact of goalImpacts) {
    if (impact.purchaseDelayMonths > 0) {
      recommendations.push(
        `This purchase delays your "${impact.name}" goal by approximately ${impact.purchaseDelayMonths} month(s).`
      )
    }
  }

  if (cashFlow < 0) {
    recommendations.push(
      `Your projected cash flow after this purchase is negative ($${cashFlow.toFixed(2)}). You'd be spending more than you earn this month.`
    )
  }

  if (recommendations.length === 0) {
    recommendations.push(
      `This purchase looks affordable. It represents ${((purchaseAmount / (avgMonthlyIncome || 1)) * 100).toFixed(1)}% of your average monthly income.`
    )
  }

  return NextResponse.json({
    purchase: {
      name,
      price: purchaseAmount,
      paymentMethod: paymentMethod || "default",
      date: purchaseDate || now.toISOString(),
    },
    financialSummary: {
      totalBalance,
      remainingBalance,
      avgMonthlyIncome,
      avgMonthlyExpenses,
      avgMonthlySavings,
      emergencyFundMonths: Math.round(emergencyFundMonths * 10) / 10,
    },
    currentMonth: {
      income: currentMonthData.income,
      expenses: currentMonthData.expenses,
      remaining: currentMonthData.income - currentMonthData.expenses,
    },
    goalImpacts,
    budgetImpact,
    cashFlow: {
      surplus: cashFlow >= 0,
      amount: cashFlow,
    },
    recommendations,
  })
}
