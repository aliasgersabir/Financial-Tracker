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

  const now = new Date()
  const thirtyDaysFromNow = new Date(now)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const recurringRules = await prisma.recurringRule.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      nextRunDate: { lte: thirtyDaysFromNow },
    },
    include: { account: true, category: true },
  })

  const recurringProjections = recurringRules.map((rule) => ({
    date: rule.nextRunDate,
    type: rule.type,
    description: rule.description,
    amount: rule.amount,
    category: rule.category?.name || null,
    isRecurring: true,
    source: "recurring",
    recurringRuleId: rule.id,
  }))

  const subscriptions = await prisma.subscription.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      nextRenewal: { not: null, lte: thirtyDaysFromNow },
    },
    include: { category: true },
  })

  const subscriptionProjections = subscriptions.map((sub) => ({
    date: sub.nextRenewal!,
    type: "expense",
    description: `${sub.name} subscription renewal`,
    amount: sub.amount,
    category: sub.category?.name || null,
    isRecurring: true,
    source: "subscription",
    subscriptionId: sub.id,
  }))

  const calendarEvents = await prisma.calendarEvent.findMany({
    where: {
      userId: session.user.id,
      date: { gte: now, lte: thirtyDaysFromNow },
      amount: { not: null },
      isCompleted: false,
    },
    include: { category: true },
  })

  const eventProjections = calendarEvents.map((event) => ({
    date: event.date,
    type: event.type === "income" ? "income" : "expense",
    description: event.title,
    amount: event.amount!,
    category: event.category?.name || event.description || null,
    isRecurring: false,
    source: "calendar",
    eventId: event.id,
  }))

  const manualProjections = await prisma.cashFlowProjection.findMany({
    where: {
      userId: session.user.id,
      date: { gte: now, lte: thirtyDaysFromNow },
    },
    orderBy: { date: "asc" },
  })

  const manualProjectionEntries = manualProjections.map((p) => ({
    date: p.date,
    type: p.type,
    description: p.description,
    amount: p.amount,
    category: p.category,
    isRecurring: p.isRecurring,
    isConfirmed: p.isConfirmed,
    source: "manual",
    id: p.id,
  }))

  const allProjections = [
    ...recurringProjections,
    ...subscriptionProjections,
    ...eventProjections,
    ...manualProjectionEntries,
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  let runningBalance = 0
  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
  })
  runningBalance = accounts.reduce((sum, a) => sum + a.balance, 0)

  const projectionsWithBalance = allProjections.map((p) => {
    if (p.type === "income") {
      runningBalance += p.amount
    } else {
      runningBalance -= p.amount
    }
    return { ...p, runningBalance: Math.round(runningBalance * 100) / 100 }
  })

  const totalIncome = allProjections
    .filter((p) => p.type === "income")
    .reduce((s, p) => s + p.amount, 0)

  const totalExpenses = allProjections
    .filter((p) => p.type === "expense")
    .reduce((s, p) => s + p.amount, 0)

  return NextResponse.json({
    projections: projectionsWithBalance,
    summary: {
      totalIncome,
      totalExpenses,
      netCashFlow: totalIncome - totalExpenses,
      currentBalance: accounts.reduce((sum, a) => sum + a.balance, 0),
      projectedBalance: runningBalance,
    },
    periodStart: now.toISOString(),
    periodEnd: thirtyDaysFromNow.toISOString(),
  })
  } catch (error) {
    console.error("Cash flow API error:", error)
    return NextResponse.json({
      projections: [],
      summary: { totalIncome: 0, totalExpenses: 0, netCashFlow: 0, currentBalance: 0, projectedBalance: 0 },
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
    })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { date, type, description, amount, category, isRecurring } = body

  if (!date || !type || !amount) {
    return NextResponse.json(
      { error: "Date, type, and amount are required" },
      { status: 400 }
    )
  }

  const projection = await prisma.cashFlowProjection.create({
    data: {
      userId: session.user.id,
      date: new Date(date),
      type,
      description: description || null,
      amount: parseFloat(amount),
      category: category || null,
      isRecurring: isRecurring || false,
    },
  })

  return NextResponse.json(projection, { status: 201 })
}
