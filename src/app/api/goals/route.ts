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
    include: { _count: { select: { contributions: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(goals)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, targetAmount, deadline, monthlyTarget, notes, icon, color } = await req.json()

  if (!name || !targetAmount) {
    return NextResponse.json({ error: "Name and target amount are required" }, { status: 400 })
  }

  const goal = await prisma.goal.create({
    data: {
      name,
      targetAmount: parseFloat(targetAmount),
      deadline: deadline ? new Date(deadline) : null,
      monthlyTarget: monthlyTarget ? parseFloat(monthlyTarget) : null,
      notes: notes || null,
      icon: icon || "🎯",
      color: color || "#2563EB",
      userId: session.user.id,
    },
  })

  return NextResponse.json(goal, { status: 201 })
}
