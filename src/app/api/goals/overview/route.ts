import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const activeGoals = goals.filter((g) => g.status === "active").length
  const completedGoals = goals.filter((g) => g.status === "completed").length
  const totalSaved = goals.reduce((sum, g) => sum + g.currentSaved, 0)
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0)

  const goalsWithStats = goals.map((g) => {
    const percentage = g.targetAmount > 0 ? Math.min((g.currentSaved / g.targetAmount) * 100, 100) : 0

    let estimatedCompletion: string | null = null
    if (g.status === "active" && g.monthlyTarget && g.monthlyTarget > 0 && g.currentSaved < g.targetAmount) {
      const remaining = g.targetAmount - g.currentSaved
      const monthsLeft = Math.ceil(remaining / g.monthlyTarget)
      const est = new Date()
      est.setMonth(est.getMonth() + monthsLeft)
      estimatedCompletion = est.toISOString()
    } else if (g.status === "completed") {
      estimatedCompletion = "Completed"
    }

    return {
      id: g.id,
      name: g.name,
      target: g.targetAmount,
      current: g.currentSaved,
      percentage,
      estimatedCompletion,
    }
  })

  return NextResponse.json({
    totalSaved,
    totalTarget,
    activeGoals,
    completedGoals,
    goals: goalsWithStats,
  })
}
