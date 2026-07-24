import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const scenarios = await prisma.scenarioAnalysis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(scenarios)
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

  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonthTxns = transactions.filter((t) => {
    const d = new Date(t.date)
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear
  })

  const totalIncome = thisMonthTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)

  const totalExpenses = thisMonthTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)

  const lastMonthIncome = lastMonthTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0)

  const lastMonthExpenses = lastMonthTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0)

  const currentSavings = totalIncome - totalExpenses
  const monthlySavingsRate = totalIncome > 0 ? currentSavings / totalIncome : 0

  let results: Record<string, unknown> = {}

  switch (assumptionsObj.type) {
    case "salary_raise": {
      const raisePercent = assumptionsObj.raisePercent || 0
      const newMonthlyIncome = totalIncome * (1 + raisePercent / 100)
      const additionalIncome = newMonthlyIncome - totalIncome
      const newMonthlySavings = newMonthlyIncome - totalExpenses
      const annualIncrease = additionalIncome * 12

      results = {
        type: "salary_raise",
        raisePercent,
        currentMonthlyIncome: totalIncome,
        projectedMonthlyIncome: newMonthlyIncome,
        additionalMonthlyIncome: additionalIncome,
        annualIncomeIncrease: annualIncrease,
        currentMonthlySavings: currentSavings,
        projectedMonthlySavings: newMonthlySavings,
        savingsImprovement:
          currentSavings > 0
            ? ((newMonthlySavings - currentSavings) / currentSavings) * 100
            : 0,
        monthlySavingsRate: monthlySavingsRate,
        projectedSavingsRate:
          newMonthlyIncome > 0 ? newMonthlySavings / newMonthlyIncome : 0,
        summary: `A ${raisePercent}% raise would increase your monthly income by ₹${additionalIncome.toFixed(0)}, boosting monthly savings from ₹${currentSavings.toFixed(0)} to ₹${newMonthlySavings.toFixed(0)}.`,
      }
      break
    }
    case "new_expense": {
      const expenseAmount = assumptionsObj.amount || 0
      const expenseCategory = assumptionsObj.category || "New Expense"
      const newTotalExpenses = totalExpenses + expenseAmount
      const newSavings = totalIncome - newTotalExpenses
      const impactOnSavings = currentSavings - newSavings

      const categoryBreakdown = thisMonthTxns
        .filter((t) => t.type === "expense")
        .reduce(
          (acc, t) => {
            const cat = t.category?.name || "Uncategorized"
            acc[cat] = (acc[cat] || 0) + t.amount
            return acc
          },
          {} as Record<string, number>
        )

      const topCategories = Object.entries(categoryBreakdown)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)

      results = {
        type: "new_expense",
        expenseCategory,
        expenseAmount,
        currentMonthlyExpenses: totalExpenses,
        projectedMonthlyExpenses: newTotalExpenses,
        currentMonthlySavings: currentSavings,
        projectedMonthlySavings: newSavings,
        monthlyImpact: impactOnSavings,
        annualImpact: impactOnSavings * 12,
        wouldGoNegative: newSavings < 0,
        currentCategories: topCategories.map(([name, amount]) => ({
          name,
          amount,
        })),
        summary: `Adding a ${expenseCategory} expense of ₹${expenseAmount.toFixed(0)}/month would reduce your savings from ₹${currentSavings.toFixed(0)} to ₹${newSavings.toFixed(0)}/month.${newSavings < 0 ? " This would put you in a deficit!" : ""}`,
      }
      break
    }
    case "investment": {
      const investAmount = assumptionsObj.amount || 0
      const expectedReturn = assumptionsObj.expectedReturn || 8
      const monthlyReturn = expectedReturn / 100 / 12

      const projections: Array<{
        year: number
        totalInvested: number
        estimatedValue: number
        totalReturns: number
      }> = []
      for (let year = 1; year <= 10; year++) {
        const totalInvested = investAmount * 12 * year
        let futureValue = 0
        for (let m = 0; m < 12 * year; m++) {
          futureValue = (futureValue + investAmount) * (1 + monthlyReturn)
        }
        projections.push({
          year,
          totalInvested,
          estimatedValue: Math.round(futureValue),
          totalReturns: Math.round(futureValue - totalInvested),
        })
      }

      results = {
        type: "investment",
        monthlyInvestment: investAmount,
        expectedReturnPercent: expectedReturn,
        projections,
        fiveYearValue:
          projections.find((p) => p.year === 5)?.estimatedValue || 0,
        tenYearValue:
          projections.find((p) => p.year === 10)?.estimatedValue || 0,
        canAfford: currentSavings >= investAmount,
        surplusAfterInvestment: currentSavings - investAmount,
        summary: `Investing ₹${investAmount.toFixed(0)}/month at ${expectedReturn}% expected return would grow to approximately ₹${projections[4]?.estimatedValue?.toLocaleString() || 0} in 5 years and ₹${projections[9]?.estimatedValue?.toLocaleString() || 0} in 10 years.`,
      }
      break
    }
    default:
      results = {
        type: "unknown",
        currentSnapshot: { totalIncome, totalExpenses, currentSavings },
        summary: "Unable to calculate results for this assumption type.",
      }
  }

  const scenario = await prisma.scenarioAnalysis.create({
    data: {
      name,
      description: description || null,
      assumptions: JSON.stringify(assumptionsObj),
      results: JSON.stringify(results),
      userId: session.user.id,
    },
  })

  return NextResponse.json(scenario, { status: 201 })
}
