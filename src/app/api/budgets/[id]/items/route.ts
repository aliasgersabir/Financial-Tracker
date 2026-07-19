import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const budget = await prisma.budget.findUnique({ where: { id } })
  if (!budget || budget.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { categoryId, amount } = await req.json()

  if (!categoryId || amount === undefined) {
    return NextResponse.json({ error: "categoryId and amount are required" }, { status: 400 })
  }

  const existing = await prisma.budgetItem.findUnique({
    where: { budgetId_categoryId: { budgetId: id, categoryId } },
  })
  if (existing) {
    return NextResponse.json({ error: "Budget item already exists for this category" }, { status: 409 })
  }

  const item = await prisma.budgetItem.create({
    data: {
      budgetId: id,
      categoryId,
      amount,
    },
    include: { category: true },
  })

  return NextResponse.json(item, { status: 201 })
}
