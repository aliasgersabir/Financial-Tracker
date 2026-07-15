import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get("accountId")
  const categoryId = searchParams.get("categoryId")
  const type = searchParams.get("type")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const where: Record<string, unknown> = { userId: session.user.id }

  if (accountId) where.accountId = accountId
  if (categoryId) where.categoryId = categoryId
  if (type) where.type = type
  if (startDate || endDate) {
    where.date = {}
    if (startDate) (where.date as Record<string, Date>).gte = new Date(startDate)
    if (endDate) (where.date as Record<string, Date>).lte = new Date(endDate)
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: {
      account: true,
      category: true,
    },
    orderBy: { date: "desc" },
    take: 100,
  })

  return NextResponse.json(transactions)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { amount, description, date, type, accountId, categoryId } = await req.json()

  if (!amount || !description || !accountId) {
    return NextResponse.json(
      { error: "Amount, description, and account are required" },
      { status: 400 }
    )
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      description,
      date: date ? new Date(date) : new Date(),
      type: type || "expense",
      accountId,
      categoryId: categoryId || null,
      userId: session.user.id,
    },
    include: {
      account: true,
      category: true,
    },
  })

  // Update account balance
  const balanceChange = type === "income" ? parseFloat(amount) : -parseFloat(amount)
  await prisma.account.update({
    where: { id: accountId },
    data: {
      balance: {
        increment: balanceChange,
      },
    },
  })

  return NextResponse.json(transaction, { status: 201 })
}
