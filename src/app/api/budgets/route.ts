import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")
  const year = searchParams.get("year")

  const where: any = { userId: session.user.id }
  if (month && year) {
    where.month = parseInt(month)
    where.year = parseInt(year)
  }

  const budgets = await prisma.budget.findMany({
    where,
    include: {
      items: {
        include: { category: true },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
  })

  return NextResponse.json(budgets)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, month, year, items } = await req.json()

  if (!name || !month || !year) {
    return NextResponse.json({ error: "Name, month, and year are required" }, { status: 400 })
  }

  const existing = await prisma.budget.findUnique({
    where: { userId_month_year: { userId: session.user.id, month: parseInt(month), year: parseInt(year) } },
  })
  if (existing) {
    return NextResponse.json({ error: "A budget already exists for this month" }, { status: 409 })
  }

  const budget = await prisma.budget.create({
    data: {
      name,
      month: parseInt(month),
      year: parseInt(year),
      userId: session.user.id,
      items: items?.length
        ? {
            create: items.map((item: any) => ({
              categoryId: item.categoryId,
              amount: item.amount,
            })),
          }
        : undefined,
    },
    include: {
      items: {
        include: { category: true },
      },
    },
  })

  return NextResponse.json(budget, { status: 201 })
}
