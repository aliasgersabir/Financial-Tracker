import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, itemId } = await params
  const budget = await prisma.budget.findUnique({ where: { id } })
  if (!budget || budget.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { amount } = await req.json()

  const item = await prisma.budgetItem.update({
    where: { id: itemId },
    data: { amount },
    include: { category: true },
  })

  return NextResponse.json(item)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, itemId } = await params
  const budget = await prisma.budget.findUnique({ where: { id } })
  if (!budget || budget.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.budgetItem.delete({ where: { id: itemId } })
  return NextResponse.json({ success: true })
}
