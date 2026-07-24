import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.cashFlowProjection.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: "Projection not found" }, { status: 404 })
  }

  const body = await req.json()
  const { date, type, description, amount, category, isRecurring, isConfirmed } = body

  const projection = await prisma.cashFlowProjection.update({
    where: { id },
    data: {
      ...(date && { date: new Date(date) }),
      ...(type && { type }),
      ...(description !== undefined && { description }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(category !== undefined && { category }),
      ...(isRecurring !== undefined && { isRecurring }),
      ...(isConfirmed !== undefined && { isConfirmed }),
    },
  })

  return NextResponse.json(projection)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.cashFlowProjection.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: "Projection not found" }, { status: 404 })
  }

  await prisma.cashFlowProjection.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
