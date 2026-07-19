import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")
  const type = searchParams.get("type")

  const where: Record<string, unknown> = { userId: session.user.id }

  if (start || end) {
    where.date = {}
    if (start) (where.date as Record<string, Date>).gte = new Date(start)
    if (end) (where.date as Record<string, Date>).lte = new Date(end)
  }

  if (type) {
    where.type = type
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    include: { account: true, category: true },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(events)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, description, amount, accountId, categoryId, date, endDate, type, recurrence, recurrenceInterval, reminderBefore } = body

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 })
  }

  const event = await prisma.calendarEvent.create({
    data: {
      title,
      description: description || undefined,
      amount: amount ? parseFloat(amount) : undefined,
      accountId: accountId || undefined,
      categoryId: categoryId || undefined,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : undefined,
      type: type || "custom",
      recurrence: recurrence || "none",
      recurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval) : 1,
      reminderBefore: reminderBefore ? parseInt(reminderBefore) : undefined,
      userId: session.user.id,
    },
    include: { account: true, category: true },
  })

  return NextResponse.json(event, { status: 201 })
}
