import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const period = url.searchParams.get("period")

  const where: Record<string, unknown> = { userId: session.user.id }
  if (period) where.period = period

  const reports = await prisma.report.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return Response.json(reports)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json()
  const { period, startDate, endDate } = body

  if (!period || !startDate || !endDate) {
    return Response.json({ error: "period, startDate, and endDate are required" }, { status: 400 })
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      date: { gte: start, lte: end },
    },
    include: { category: true },
  })

  let totalIncome = 0
  let totalExpenses = 0
  let largestExpense = null
  const categoryMap: Record<string, { name: string; color: string; amount: number; icon: string }> = {}
  const dailyMap: Record<string, { income: number; expenses: number }> = {}

  for (const t of transactions) {
    const dayKey = t.date.toISOString().split("T")[0]
    if (!dailyMap[dayKey]) dailyMap[dayKey] = { income: 0, expenses: 0 }

    if (t.type === "income") {
      totalIncome += t.amount
      dailyMap[dayKey].income += t.amount
    } else {
      totalExpenses += t.amount
      dailyMap[dayKey].expenses += t.amount

      if (!largestExpense || t.amount > largestExpense.amount) {
        largestExpense = {
          id: t.id,
          description: t.description,
          amount: t.amount,
          date: t.date.toISOString(),
          category: t.category?.name || "Uncategorized",
        }
      }

      const catId = t.categoryId || "uncategorized"
      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          name: t.category?.name || "Uncategorized",
          color: t.category?.color || "#6B7280",
          amount: 0,
          icon: t.category?.icon || "📦",
        }
      }
      categoryMap[catId].amount += t.amount
    }
  }

  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100 * 100) / 100 : 0

  const categoryBreakdown = Object.values(categoryMap)
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({
      ...c,
      percentage: totalExpenses > 0 ? Math.round((c.amount / totalExpenses) * 100 * 100) / 100 : 0,
    }))

  const topCategory = categoryBreakdown[0] || null

  const dailyTrend = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  const periodLabel = period.charAt(0).toUpperCase() + period.slice(1)
  const title = `${periodLabel} Report · ${start.toLocaleDateString("en-US", { month: "short", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`

  const reportData = {
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    savings: Math.round(savings * 100) / 100,
    savingsRate,
    topCategory,
    largestExpense,
    categoryBreakdown,
    dailyTrend,
    transactionCount: transactions.length,
  }

  const report = await prisma.report.create({
    data: {
      userId,
      title,
      period,
      startDate: start,
      endDate: end,
      data: JSON.stringify(reportData),
    },
  })

  return Response.json({ ...report, parsedData: reportData })
}
