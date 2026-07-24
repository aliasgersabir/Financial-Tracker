import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
      include: {
        account: true,
        category: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Transaction GET error:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { amount, description, date, type, accountId, categoryId } = await req.json()

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const oldBalanceChange = existing.type === "income" ? -existing.amount : existing.amount
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: oldBalanceChange } },
    })

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        amount: parseFloat(amount),
        description,
        date: date ? new Date(date) : undefined,
        type,
        accountId,
        categoryId: categoryId || null,
      },
      include: {
        account: true,
        category: true,
      },
    })

    const newBalanceChange = type === "income" ? parseFloat(amount) : -parseFloat(amount)
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: newBalanceChange } },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error("Transaction PUT error:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.transaction.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const balanceChange = existing.type === "income" ? -existing.amount : existing.amount
    await prisma.account.update({
      where: { id: existing.accountId },
      data: { balance: { increment: balanceChange } },
    })

    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    console.error("Transaction DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
