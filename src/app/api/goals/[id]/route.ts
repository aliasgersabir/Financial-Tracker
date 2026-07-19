import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const goal = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
    include: { contributions: { orderBy: { date: "desc" } } },
  })

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 })
  }

  return NextResponse.json(goal)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 })
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.targetAmount !== undefined && { targetAmount: parseFloat(body.targetAmount) }),
      ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
      ...(body.monthlyTarget !== undefined && { monthlyTarget: body.monthlyTarget ? parseFloat(body.monthlyTarget) : null }),
      ...(body.notes !== undefined && { notes: body.notes || null }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.color !== undefined && { color: body.color }),
      ...(body.status !== undefined && { status: body.status }),
    },
  })

  return NextResponse.json(goal)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.goal.findFirst({ where: { id, userId: session.user.id } })
  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 })
  }

  await prisma.goal.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
