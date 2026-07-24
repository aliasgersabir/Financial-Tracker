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
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [accounts, monthlyTransactions, lastSixMonthsTx, recentTransactions, transactionCount] = await Promise.all([
      prisma.account.findMany({ where: { userId } }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
        include: { category: true },
      }),
      prisma.transaction.findMany({
        where: { userId, date: { gte: sixMonthsAgo, lte: endOfMonth } },
        select: { type: true, amount: true, date: true, description: true, category: true, id: true, accountId: true, categoryId: true, tags: true },
      }),
      prisma.transaction.findMany({
        where: { userId },
        include: { account: true, category: true },
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.transaction.count({ where: { userId } }),
    ])

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const monthlyExpenses = monthlyTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

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

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyTrendMap: Record<string, { month: string; income: number; expenses: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      monthlyTrendMap[key] = { month: monthNames[d.getMonth()], income: 0, expenses: 0 }
    }

    for (const t of lastSixMonthsTx) {
      const d = new Date(t.date)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      if (monthlyTrendMap[key]) {
        if (t.type === "income") monthlyTrendMap[key].income += t.amount
        else monthlyTrendMap[key].expenses += t.amount
      }
    }

    const monthlyTrend = Object.values(monthlyTrendMap)

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
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json({
      totalBalance: 0,
      monthlyIncome: 0,
      monthlyExpenses: 0,
      categoryData: [],
      monthlyTrend: [],
      recentTransactions: [],
      accountCount: 0,
      transactionCount: 0,
    })
  }
}
