import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  // Total balance across all accounts
  const accounts = await prisma.account.findMany({
    where: { userId },
  })
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

  // Current month transactions
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const monthlyTransactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    include: {
      category: true,
    },
  })

  const monthlyIncome = monthlyTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = monthlyTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  // Spending by category (current month)
  const categorySpending = monthlyTransactions
    .filter((t) => t.type === "expense" && t.category)
    .reduce(
      (acc, t) => {
        const catName = t.category?.name || "Uncategorized"
        acc[catName] = (acc[catName] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>
    )

  const categoryData = Object.entries(categorySpending)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  // Monthly trend (last 6 months)
  const monthlyTrend = []
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

    const monthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: monthStart, lte: monthEnd },
      },
    })

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    monthlyTrend.push({
      month: monthStart.toLocaleString("default", { month: "short" }),
      income,
      expenses,
    })
  }

  // Recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: "desc" },
    take: 5,
  })

  // Transaction count
  const transactionCount = await prisma.transaction.count({
    where: { userId },
  })

  return NextResponse.json({
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    categoryData,
    monthlyTrend,
    recentTransactions,
    accountCount: accounts.length,
    transactionCount,
  })
}
