import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { scenarioIds } = await req.json()

  if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length < 2) {
    return NextResponse.json(
      { error: "At least two scenario IDs are required for comparison" },
      { status: 400 }
    )
  }

  const scenarios = await prisma.scenarioAnalysis.findMany({
    where: {
      id: { in: scenarioIds },
      userId: session.user.id,
    },
  })

  if (scenarios.length < 2) {
    return NextResponse.json(
      { error: "Could not find enough valid scenarios for comparison" },
      { status: 404 }
    )
  }

  const parsed = scenarios.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    assumptions: JSON.parse(s.assumptions),
    results: s.results ? JSON.parse(s.results) : null,
    createdAt: s.createdAt,
  }))

  const assumptionTypes = [...new Set(parsed.map((s) => s.assumptions.type))]

  const comparison: Record<string, unknown> = {
    scenarios: parsed,
    assumptionTypes,
    count: parsed.length,
  }

  const allResults = parsed.filter((s) => s.results)

  if (allResults.length > 0) {
    const typeGroups: Record<string, typeof parsed> = {}
    for (const s of allResults) {
      const t = s.assumptions.type
      if (!typeGroups[t]) typeGroups[t] = []
      typeGroups[t].push(s)
    }

    for (const [type, group] of Object.entries(typeGroups)) {
      if (type === "salary_raise" && group.length > 0) {
        comparison.salaryRaiseComparison = group.map((s) => ({
          name: s.name,
          raisePercent: s.assumptions.raisePercent,
          projectedMonthlyIncome: s.results?.projectedMonthlyIncome,
          additionalMonthlyIncome: s.results?.additionalMonthlyIncome,
          projectedMonthlySavings: s.results?.projectedMonthlySavings,
          projectedSavingsRate: s.results?.projectedSavingsRate,
        }))
      }
      if (type === "new_expense" && group.length > 0) {
        comparison.newExpenseComparison = group.map((s) => ({
          name: s.name,
          expenseCategory: s.assumptions.category,
          expenseAmount: s.assumptions.amount,
          projectedMonthlySavings: s.results?.projectedMonthlySavings,
          monthlyImpact: s.results?.monthlyImpact,
          annualImpact: s.results?.annualImpact,
          wouldGoNegative: s.results?.wouldGoNegative,
        }))
      }
      if (type === "investment" && group.length > 0) {
        comparison.investmentComparison = group.map((s) => ({
          name: s.name,
          monthlyInvestment: s.assumptions.amount,
          expectedReturn: s.assumptions.expectedReturn,
          fiveYearValue: s.results?.fiveYearValue,
          tenYearValue: s.results?.tenYearValue,
          canAfford: s.results?.canAfford,
        }))
      }
    }
  }

  const bestScenario = allResults.reduce(
    (best, s) => {
      const savings = s.results?.projectedMonthlySavings ?? s.results?.projectedMonthlySavings ?? 0
      if (savings > best.savings) {
        return { name: s.name, savings }
      }
      return best
    },
    { name: "", savings: -Infinity }
  )

  if (bestScenario.name) {
    comparison.bestScenario = bestScenario
    comparison.recommendation = `Based on projected monthly savings, "${bestScenario.name}" is the most beneficial scenario at ₹${bestScenario.savings.toFixed(0)}/month.`
  }

  return NextResponse.json(comparison)
}
