import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const plans = await prisma.scenarioPlan.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(plans)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, description, assumptions } = await req.json()

  if (!name || !assumptions) {
    return NextResponse.json(
      { error: "Name and assumptions are required" },
      { status: 400 }
    )
  }

  const assumptionsObj =
    typeof assumptions === "string" ? JSON.parse(assumptions) : assumptions

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { category: true },
  })

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const totalIncome = thisMonthTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)

  const totalExpenses = thisMonthTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)

  const currentSavings = totalIncome - totalExpenses

  const subScenarios = assumptionsObj.scenarios || []
  const projections: Array<{
    name: string
    type: string
    monthlyIncome: number
    monthlyExpenses: number
    monthlySavings: number
    annualSavings: number
    fiveYearSavings: number
    details: Record<string, unknown>
  }> = []

  for (const sub of subScenarios) {
    let monthlyIncome = totalIncome
    let monthlyExpenses = totalExpenses
    const details: Record<string, unknown> = {}

    if (sub.raisePercent) {
      const raise = totalIncome * (sub.raisePercent / 100)
      monthlyIncome = totalIncome + raise
      details.raisePercent = sub.raisePercent
      details.additionalIncome = raise
    }

    if (sub.investAmount) {
      const investAmount = sub.investAmount
      const expectedReturn = sub.expectedReturn || 12
      const monthlyReturn = expectedReturn / 100 / 12

      let futureValue5 = 0
      for (let m = 0; m < 60; m++) {
        futureValue5 = (futureValue5 + investAmount) * (1 + monthlyReturn)
      }
      let futureValue10 = 0
      for (let m = 0; m < 120; m++) {
        futureValue10 = (futureValue10 + investAmount) * (1 + monthlyReturn)
      }

      details.investAmount = investAmount
      details.expectedReturn = expectedReturn
      details.fiveYearValue = Math.round(futureValue5)
      details.tenYearValue = Math.round(futureValue10)
    }

    if (sub.expenseAmount) {
      monthlyExpenses += sub.expenseAmount
      details.newExpenseCategory = sub.category || "New Expense"
      details.newExpenseAmount = sub.expenseAmount
    }

    const monthlySavings = monthlyIncome - monthlyExpenses

    projections.push({
      name: sub.name || "Sub-scenario",
      type: sub.raisePercent
        ? "salary_raise"
        : sub.investAmount
          ? "investment"
          : sub.expenseAmount
            ? "new_expense"
            : "combined",
      monthlyIncome,
      monthlyExpenses,
      monthlySavings,
      annualSavings: monthlySavings * 12,
      fiveYearSavings: monthlySavings * 60,
      details,
    })
  }

  const planResults = {
    currentSnapshot: {
      monthlyIncome: totalIncome,
      monthlyExpenses: totalExpenses,
      monthlySavings: currentSavings,
    },
    projections,
    bestProjection: projections.reduce(
      (best, p) => (p.monthlySavings > (best?.monthlySavings ?? -Infinity) ? p : best),
      projections[0] || null
    ),
  }

  const plan = await prisma.scenarioPlan.create({
    data: {
      name,
      description: description || null,
      assumptions: JSON.stringify(assumptionsObj),
      projections: JSON.stringify(planResults),
      userId: session.user.id,
    },
  })

  return NextResponse.json(plan, { status: 201 })
}
