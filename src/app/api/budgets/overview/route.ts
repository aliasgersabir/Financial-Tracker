import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1))
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()))

  const budget = await prisma.budget.findUnique({
    where: { userId_month_year: { userId: session.user.id, month, year } },
    include: {
      items: { include: { category: true } },
    },
  })

  if (!budget) {
    return NextResponse.json({
      totalBudgeted: 0,
      totalSpent: 0,
      totalRemaining: 0,
      items: [],
    })
  }

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59)

  const spentData = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId: session.user.id,
      type: "expense",
      date: { gte: monthStart, lte: monthEnd },
      categoryId: { in: budget.items.map((i) => i.categoryId) },
    },
    _sum: { amount: true },
  })

  const spentMap = new Map<string, number>()
  for (const row of spentData) {
    if (row.categoryId) {
      spentMap.set(row.categoryId, row._sum.amount || 0)
    }
  }

  let totalBudgeted = 0
  let totalSpent = 0

  const items = budget.items.map((item) => {
    const spent = spentMap.get(item.categoryId) || 0
    const percentage = item.amount > 0 ? Math.round((spent / item.amount) * 100) : 0
    const remaining = item.amount - spent

    let status: "normal" | "warning" | "exceeded" = "normal"
    if (percentage > 100) status = "exceeded"
    else if (percentage >= 80) status = "warning"

    totalBudgeted += item.amount
    totalSpent += spent

    return {
      id: item.id,
      category: item.category,
      budgeted: item.amount,
      spent,
      remaining,
      percentage,
      status,
    }
  })

  return NextResponse.json({
    totalBudgeted,
    totalSpent,
    totalRemaining: totalBudgeted - totalSpent,
    items,
  })
}
