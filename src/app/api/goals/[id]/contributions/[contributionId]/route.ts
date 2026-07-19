import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; contributionId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, contributionId } = await params

  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 })
  }

  const contribution = await prisma.goalContribution.findFirst({
    where: { id: contributionId, goalId: id },
  })
  if (!contribution) {
    return NextResponse.json({ error: "Contribution not found" }, { status: 404 })
  }

  await prisma.$transaction([
    prisma.goalContribution.delete({ where: { id: contributionId } }),
    prisma.goal.update({
      where: { id },
      data: { currentSaved: { decrement: contribution.amount } },
    }),
  ])

  return NextResponse.json({ success: true })
}
