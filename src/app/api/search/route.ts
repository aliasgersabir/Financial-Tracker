import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrencyServer } from "@/lib/currency-server"

interface ParsedQuery {
  merchant?: string
  category?: string
  dateRange?: { gte: Date; lte: Date }
  amountFilter?: { gte?: number; lte?: number }
  actionType: "show" | "biggest" | "compare" | "howMuch"
}

function parseQuery(q: string): ParsedQuery {
  const lower = q.toLowerCase()
  const parsed: ParsedQuery = { actionType: "show" }

  if (lower.includes("biggest") || lower.includes("largest") || lower.includes("highest")) {
    parsed.actionType = "biggest"
  } else if (lower.includes("compare")) {
    parsed.actionType = "compare"
  } else if (lower.includes("how much") || lower.includes("total")) {
    parsed.actionType = "howMuch"
  }

  const knownCategories = [
    "travel", "food", "dining", "groceries", "entertainment",
    "utilities", "rent", "health", "shopping", "transport",
    "education", "subscriptions", "income", "savings",
  ]
  for (const cat of knownCategories) {
    if (lower.includes(cat)) {
      parsed.category = cat
      break
    }
  }

  const knownMerchants = [
    "amazon", "swiggy", "zomato", "uber", "netflix", "spotify",
    "google", "apple", "flipkart", "ola", "paytm", "phonepe",
  ]
  for (const merchant of knownMerchants) {
    if (lower.includes(merchant)) {
      parsed.merchant = merchant
      break
    }
  }

  const now = new Date()
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  const startOfThisYear = new Date(now.getFullYear(), 0, 1)
  const endOfThisYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
  const startOfThisWeek = new Date(now)
  startOfThisWeek.setDate(now.getDate() - now.getDay())
  startOfThisWeek.setHours(0, 0, 0, 0)
  const endOfThisWeek = new Date(startOfThisWeek)
  endOfThisWeek.setDate(startOfThisWeek.getDate() + 6)
  endOfThisWeek.setHours(23, 59, 59, 999)

  if (lower.includes("this month")) {
    parsed.dateRange = { gte: startOfThisMonth, lte: endOfThisMonth }
  } else if (lower.includes("last month")) {
    parsed.dateRange = { gte: startOfLastMonth, lte: endOfLastMonth }
  } else if (lower.includes("this year")) {
    parsed.dateRange = { gte: startOfThisYear, lte: endOfThisYear }
  } else if (lower.includes("this week")) {
    parsed.dateRange = { gte: startOfThisWeek, lte: endOfThisWeek }
  }

  const amountMatch = lower.match(/above\s+(\d+)/)
  if (amountMatch) {
    parsed.amountFilter = { gte: parseFloat(amountMatch[1]) }
  }

  const overMatch = lower.match(/over\s+(\d+)/)
  if (overMatch) {
    parsed.amountFilter = { gte: parseFloat(overMatch[1]) }
  }

  if (!parsed.merchant && !parsed.category && !parsed.dateRange && !parsed.amountFilter) {
    const stripped = q.replace(
      /how much|show|biggest|compare|total|spent|spend|on|for|in|this|last|month|week|year/g,
      ""
    ).trim()
    if (stripped.length > 1) {
      parsed.merchant = stripped
    }
  }

  return parsed
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
  }

  const parsed = parseQuery(q)

  const where: Record<string, unknown> = { userId: session.user.id }

  if (parsed.merchant) {
    where.description = { contains: parsed.merchant }
  }

  if (parsed.category) {
    const category = await prisma.category.findFirst({
      where: {
        userId: session.user.id,
        name: { contains: parsed.category },
      },
    })
    if (category) {
      where.categoryId = category.id
    }
  }

  if (parsed.dateRange) {
    where.date = {
      gte: parsed.dateRange.gte,
      lte: parsed.dateRange.lte,
    }
  }

  if (parsed.amountFilter) {
    where.amount = parsed.amountFilter
  }

  const orderBy =
    parsed.actionType === "biggest" ? { amount: "desc" as const } : { date: "desc" as const }

  const limit = parsed.actionType === "biggest" ? 1 : 50

  const transactions = await prisma.transaction.findMany({
    where,
    include: { account: true, category: true },
    orderBy,
    take: limit,
  })

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  let summary = ""
  const timeRef = q.toLowerCase().includes("this month")
    ? "this month"
    : q.toLowerCase().includes("last month")
      ? "last month"
      : q.toLowerCase().includes("this week")
        ? "this week"
        : q.toLowerCase().includes("this year")
          ? "this year"
          : ""

  switch (parsed.actionType) {
    case "biggest":
      if (transactions.length > 0) {
        summary = `Your biggest expense${timeRef ? ` ${timeRef}` : ""} is "${transactions[0].description}" for ${formatCurrencyServer(transactions[0].amount)}`
      } else {
        summary = `No transactions found${timeRef ? ` ${timeRef}` : ""}`
      }
      break
    case "howMuch":
      summary = `Total ${parsed.merchant || parsed.category || "spending"}${timeRef ? ` ${timeRef}` : ""}: ${formatCurrencyServer(total)} across ${transactions.length} transaction(s)`
      break
    case "compare":
      summary = `Found ${transactions.length} transaction(s) totaling ${formatCurrencyServer(total)}${timeRef ? ` ${timeRef}` : ""}`
      break
    default:
      summary = `Found ${transactions.length} transaction(s)${parsed.merchant ? ` matching "${parsed.merchant}"` : ""}${parsed.category ? ` in ${parsed.category}` : ""}${timeRef ? ` ${timeRef}` : ""} totaling ${formatCurrencyServer(total)}`
  }

  return NextResponse.json({
    query: q,
    parsed,
    transactions,
    total,
    count: transactions.length,
    summary,
  })
}
