import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { amount, date, notes } = await req.json()

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be positive" }, { status: 400 })
  }

  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 })
  }

  const contribution = await prisma.$transaction([
    prisma.goalContribution.create({
      data: {
        goalId: id,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        notes: notes || null,
      },
    }),
    prisma.goal.update({
      where: { id },
      data: { currentSaved: { increment: parseFloat(amount) } },
    }),
  ])

  return NextResponse.json(contribution[0], { status: 201 })
}
