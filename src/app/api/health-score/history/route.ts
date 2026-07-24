import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const snapshots = await prisma.financialHealthSnapshot.findMany({
    where: { userId: session.user.id },
    orderBy: { snapshotDate: "desc" },
    take: 12,
  })

  const parsed = snapshots.map((s) => ({
    id: s.id,
    score: s.score,
    savingsRate: s.savingsRate,
    budgetDiscipline: s.budgetDiscipline,
    goalProgress: s.goalProgress,
    emergencyFund: s.emergencyFund,
    spendingConsistency: s.spendingConsistency,
    debtRatio: s.debtRatio,
    breakdown: s.breakdown ? JSON.parse(s.breakdown) : null,
    snapshotDate: s.snapshotDate,
  }))

  return NextResponse.json(parsed)
}
