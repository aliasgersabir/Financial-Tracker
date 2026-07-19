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

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const rules = await prisma.recurringRule.findMany({
    where: { userId: session.user.id },
    include: { account: true, category: true },
    orderBy: { nextRunDate: "asc" },
  })

  return Response.json(rules)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { accountId, categoryId, amount, description, type, frequency, interval, startDate, endDate } = body

  if (!accountId || !amount || !description || !type || !frequency || !startDate) {
    return Response.json({ error: "Missing required fields" }, { status: 400 })
  }

  const start = new Date(startDate)
  const rule = await prisma.recurringRule.create({
    data: {
      userId: session.user.id,
      accountId,
      categoryId: categoryId || null,
      amount: parseFloat(amount),
      description,
      type,
      frequency,
      interval: interval ? parseInt(interval) : 1,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextRunDate: start,
    },
    include: { account: true, category: true },
  })

  return Response.json(rule, { status: 201 })
}
