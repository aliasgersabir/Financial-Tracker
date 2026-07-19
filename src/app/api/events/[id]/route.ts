import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const event = await prisma.calendarEvent.findFirst({
    where: { id, userId: session.user.id },
    include: { account: true, category: true },
  })

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(event)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { title, description, amount, accountId, categoryId, date, endDate, type, recurrence, recurrenceInterval, reminderBefore, isCompleted } = body

  const data: Record<string, unknown> = {}
  if (title !== undefined) data.title = title
  if (description !== undefined) data.description = description || null
  if (amount !== undefined) data.amount = amount ? parseFloat(amount) : null
  if (accountId !== undefined) data.accountId = accountId || null
  if (categoryId !== undefined) data.categoryId = categoryId || null
  if (date !== undefined) data.date = new Date(date)
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
  if (type !== undefined) data.type = type
  if (recurrence !== undefined) data.recurrence = recurrence
  if (recurrenceInterval !== undefined) data.recurrenceInterval = parseInt(recurrenceInterval)
  if (reminderBefore !== undefined) data.reminderBefore = reminderBefore ? parseInt(reminderBefore) : null
  if (isCompleted !== undefined) data.isCompleted = isCompleted

  const event = await prisma.calendarEvent.updateMany({
    where: { id, userId: session.user.id },
    data,
  })

  return NextResponse.json(event)
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
  await prisma.calendarEvent.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ message: "Deleted" })
}
