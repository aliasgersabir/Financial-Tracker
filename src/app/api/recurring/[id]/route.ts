import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

function getNextRunDate(current: Date, frequency: string, interval: number): Date {
  const next = new Date(current)
  switch (frequency) {
    case "daily": next.setDate(next.getDate() + interval); break
    case "weekly": next.setDate(next.getDate() + 7 * interval); break
    case "monthly": next.setMonth(next.getMonth() + interval); break
    case "yearly": next.setFullYear(next.getFullYear() + interval); break
  }
  return next
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId: session.user.id },
    include: {
      account: true,
      category: true,
      transactions: { orderBy: { date: "desc" }, take: 5 },
    },
  })

  if (!rule) return Response.json({ error: "Not found" }, { status: 404 })
  return Response.json(rule)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.recurringRule.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { amount, description, frequency, interval, isActive, endDate } = body

  const updateData: Record<string, unknown> = {}
  if (amount !== undefined) updateData.amount = parseFloat(amount)
  if (description !== undefined) updateData.description = description
  if (isActive !== undefined) updateData.isActive = isActive
  if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null

  const newFrequency = frequency || existing.frequency
  const newInterval = interval !== undefined ? parseInt(interval) : existing.interval

  if (frequency !== undefined || interval !== undefined) {
    updateData.frequency = newFrequency
    updateData.interval = newInterval
    updateData.nextRunDate = getNextRunDate(new Date(), newFrequency, newInterval)
  }

  const rule = await prisma.recurringRule.update({
    where: { id },
    data: updateData,
    include: { account: true, category: true },
  })

  return Response.json(rule)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const existing = await prisma.recurringRule.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return Response.json({ error: "Not found" }, { status: 404 })

  await prisma.recurringRule.delete({ where: { id } })
  return Response.json({ success: true })
}
