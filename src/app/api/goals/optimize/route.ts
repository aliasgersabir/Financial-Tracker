import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id, status: "active" },
    include: { contributions: true },
  })

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { category: true },
  })

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const monthlyExpenses = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return (
        t.type === "expense" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      )
    })
    .reduce((s, t) => s + t.amount, 0)

  const monthlyIncome = transactions
    .filter((t) => {
      const d = new Date(t.date)
      return (
        t.type === "income" &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      )
    })
    .reduce((s, t) => s + t.amount, 0)

  const categoryExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce(
      (acc, t) => {
        const cat = t.category?.name || "Uncategorized"
        acc[cat] = (acc[cat] || 0) + t.amount
        return acc
      },
      {} as Record<string, number>
    )

  const totalMonthlyExpensesByCategory = Object.entries(categoryExpenses)
    .sort(([, a], [, b]) => b - a)

  const averageCategorySpend =
    totalMonthlyExpensesByCategory.length > 0
      ? totalMonthlyExpensesByCategory.reduce((s, [, v]) => s + v, 0) /
        totalMonthlyExpensesByCategory.length
      : 0

  const recommendations: Array<{
    type: string
    goalId?: string
    goalName?: string
    message: string
    potentialSaving?: number
    monthsSaved?: number
    priority: string
  }> = []

  let totalGoalContributions = 0

  for (const goal of goals) {
    const goalContributions = goal.contributions
    const totalContributed = goalContributions.reduce((s, c) => s + c.amount, 0)

    const remaining = goal.targetAmount - goal.currentSaved
    if (remaining <= 0) {
      recommendations.push({
        type: "goal_completed",
        goalId: goal.id,
        goalName: goal.name,
        message: `Goal "${goal.name}" is complete! Consider redirecting its surplus to other goals.`,
        priority: "info",
      })
      continue
    }

    let monthlyContribution = 0
    if (goalContributions.length > 0) {
      const sortedContributions = [...goalContributions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      const firstContribution = new Date(sortedContributions[0].date)
      const lastContribution = new Date(
        sortedContributions[sortedContributions.length - 1].date
      )
      const monthsElapsed = Math.max(
        1,
        (lastContribution.getFullYear() - firstContribution.getFullYear()) * 12 +
          (lastContribution.getMonth() - firstContribution.getMonth()) +
          1
      )
      monthlyContribution = totalContributed / monthsElapsed
    } else if (goal.monthlyTarget) {
      monthlyContribution = goal.monthlyTarget
    } else {
      monthlyContribution = currentSavingsEstimate(goals, monthlyIncome, monthlyExpenses)
    }

    totalGoalContributions += monthlyContribution

    const monthsToCompletion =
      monthlyContribution > 0
        ? Math.ceil(remaining / monthlyContribution)
        : Infinity

    const currentPace =
      goal.targetAmount > 0 ? (goal.currentSaved / goal.targetAmount) * 100 : 0

    const goalAnalysis: Record<string, unknown> = {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount: goal.targetAmount,
      currentSaved: goal.currentSaved,
      remaining,
      currentPace: Math.round(currentPace * 100) / 100,
      monthlyContribution: Math.round(monthlyContribution * 100) / 100,
      monthsToCompletion:
        monthsToCompletion === Infinity ? null : monthsToCompletion,
      deadline: goal.deadline,
    }

    if (goal.deadline) {
      const deadlineDate = new Date(goal.deadline)
      const monthsUntilDeadline =
        (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
        (deadlineDate.getMonth() - now.getMonth())

      if (monthsUntilDeadline <= 0) {
        recommendations.push({
          type: "deadline_missed",
          goalId: goal.id,
          goalName: goal.name,
          message: `"${goal.name}" has passed its deadline with ₹${remaining.toFixed(0)} remaining. Consider extending the deadline or increasing contributions.`,
          priority: "high",
        })
      } else if (monthsToCompletion > monthsUntilDeadline) {
        const neededMonthly = remaining / monthsUntilDeadline
        const increase = neededMonthly - monthlyContribution
        recommendations.push({
          type: "increase_contribution",
          goalId: goal.id,
          goalName: goal.name,
          message: `Increase monthly contribution by ₹${increase.toFixed(0)} (to ₹${neededMonthly.toFixed(0)}/month) to meet the deadline for "${goal.name}".`,
          potentialSaving: increase,
          monthsSaved: monthsToCompletion - monthsUntilDeadline,
          priority: "high",
        })
      } else {
        const surplusMonths = monthsUntilDeadline - monthsToCompletion
        goalAnalysis.surplusMonths = surplusMonths
        recommendations.push({
          type: "on_track",
          goalId: goal.id,
          goalName: goal.name,
          message: `"${goal.name}" is on track! You'll reach it ${surplusMonths} month(s) before the deadline.`,
          priority: "low",
        })
      }
    } else {
      if (monthsToCompletion > 60) {
        const neededMonthly = remaining / 60
        const increase = neededMonthly - monthlyContribution
        recommendations.push({
          type: "long_timeline",
          goalId: goal.id,
          goalName: goal.name,
          message: `"${goal.name}" will take ${monthsToCompletion} months at current pace. Increasing contribution by ₹${increase.toFixed(0)}/month would cut it to 5 years.`,
          potentialSaving: increase,
          monthsSaved: monthsToCompletion - 60,
          priority: "medium",
        })
      }
    }

    goalAnalysis.status = monthsToCompletion <= (goal.deadline ? monthsUntilDeadline(goal.deadline, now) : 60) ? "on_track" : "needs_attention"
    ;(goalAnalysis as Record<string, unknown>).status = goal.deadline && monthsToCompletion > monthsUntilDeadlineCalc(goal.deadline, now) ? "needs_attention" : "on_track"
  }

  for (const [category, amount] of totalMonthlyExpensesByCategory.slice(0, 3)) {
    if (amount > averageCategorySpend * 1.5) {
      const reduction10 = amount * 0.1
      const matchingGoal = goals.find(
        (g) => g.targetAmount - g.currentSaved > 0
      )
      if (matchingGoal) {
        recommendations.push({
          type: "reduce_category",
          goalId: matchingGoal.id,
          goalName: matchingGoal.name,
          message: `Reduce ${category} spending by 10% (save ₹${reduction10.toFixed(0)}/month) and redirect to "${matchingGoal.name}" to reach it faster.`,
          potentialSaving: reduction10,
          priority: "medium",
        })
      }
    }
  }

  const completedGoals = await prisma.goal.findMany({
    where: { userId: session.user.id, status: { in: ["completed", "paused"] } },
  })

  for (const goal of completedGoals) {
    const incompleteGoal = goals.find(
      (g) => g.targetAmount - g.currentSaved > 0
    )
    if (incompleteGoal && goal.monthlyTarget) {
      recommendations.push({
        type: "redirect_surplus",
        goalId: incompleteGoal.id,
        goalName: incompleteGoal.name,
        message: `Redirect ₹${goal.monthlyTarget.toFixed(0)}/month from completed/paused goal "${goal.name}" to "${incompleteGoal.name}".`,
        potentialSaving: goal.monthlyTarget,
        priority: "medium",
      })
    }
  }

  return NextResponse.json({
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentSaved: g.currentSaved,
      remaining: g.targetAmount - g.currentSaved,
      deadline: g.deadline,
      status: g.status,
    })),
    currentSnapshot: {
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
      totalGoalContributions,
      surplusAfterGoals: monthlyIncome - monthlyExpenses - totalGoalContributions,
    },
    recommendations,
    summary: generateSummary(recommendations),
  })
}

function monthlySavingsEstimate(
  goals: Array<{ targetAmount: number; currentSaved: number }>,
  income: number,
  expenses: number
): number {
  const totalRemaining = goals.reduce(
    (s, g) => s + Math.max(0, g.targetAmount - g.currentSaved),
    0
  )
  const surplus = income - expenses
  return totalRemaining > 0 ? surplus / goals.length : 0
}

function currentSavingsEstimate(
  goals: Array<{ targetAmount: number; currentSaved: number }>,
  income: number,
  expenses: number
): number {
  return income - expenses
}

function monthsUntilDeadline(deadline: Date, now: Date): number {
  return (
    (deadline.getFullYear() - now.getFullYear()) * 12 +
    (deadline.getMonth() - now.getMonth())
  )
}

function monthsUntilDeadlineCalc(deadline: Date | string | null, now: Date): number {
  if (!deadline) return Infinity
  const d = typeof deadline === "string" ? new Date(deadline) : deadline
  return monthsUntilDeadline(d, now)
}

function generateSummary(
  recommendations: Array<{ priority: string; type: string }>
): string {
  const high = recommendations.filter((r) => r.priority === "high").length
  const medium = recommendations.filter((r) => r.priority === "medium").length

  if (high === 0 && medium === 0) {
    return "Your financial goals are well-managed. Keep up the good work!"
  }

  const parts: string[] = []
  if (high > 0) parts.push(`${high} high-priority action(s) needed`)
  if (medium > 0) parts.push(`${medium} medium-priority suggestion(s)`)
  return parts.join(". ") + ". Review the recommendations for details."
}
