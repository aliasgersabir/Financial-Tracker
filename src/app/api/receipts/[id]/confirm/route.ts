import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const receipt = await prisma.receipt.findFirst({
    where: { id, userId: session.user.id },
    include: { ocrExtraction: true },
  })

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
  }

  if (receipt.status === "confirmed") {
    return NextResponse.json({ error: "Receipt already confirmed" }, { status: 400 })
  }

  const body = await req.json()
  const { merchant, amount, date, categoryId, accountId } = body

  if (!merchant || !amount || !accountId) {
    return NextResponse.json(
      { error: "Merchant, amount, and accountId are required" },
      { status: 400 }
    )
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(amount),
      description: `Receipt: ${merchant}`,
      date: date ? new Date(date) : receipt.date || new Date(),
      type: "expense",
      accountId,
      categoryId: categoryId || null,
      userId: session.user.id,
    },
    include: { account: true, category: true },
  })

  await prisma.account.update({
    where: { id: accountId },
    data: {
      balance: { decrement: parseFloat(amount) },
    },
  })

  await prisma.receipt.update({
    where: { id },
    data: {
      status: "confirmed",
      transactionId: transaction.id,
      merchantName: merchant,
      totalAmount: parseFloat(amount),
      date: date ? new Date(date) : receipt.date,
    },
  })

  return NextResponse.json({
    transaction,
    receipt: {
      id: receipt.id,
      status: "confirmed",
      transactionId: transaction.id,
    },
  })
}
