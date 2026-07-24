import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: { category: true, transactions: { orderBy: { date: "desc" }, take: 12 } },
  })

  if (!subscription || subscription.userId !== session.user.id) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  return NextResponse.json(subscription)
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

  const existing = await prisma.subscription.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  const { name, amount, frequency, categoryId, nextRenewal, startDate, endDate, isActive, website, notes, isTrial, paymentMethod, color } = await req.json()

  const updated = await prisma.subscription.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(frequency !== undefined && { frequency }),
      ...(categoryId !== undefined && { categoryId: categoryId || null }),
      ...(nextRenewal !== undefined && { nextRenewal: nextRenewal ? new Date(nextRenewal) : null }),
      ...(startDate !== undefined && { startDate: new Date(startDate) }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(isActive !== undefined && { isActive }),
      ...(website !== undefined && { website: website || null }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(isTrial !== undefined && { isTrial }),
      ...(paymentMethod !== undefined && { paymentMethod: paymentMethod || null }),
      ...(color !== undefined && { color }),
    },
    include: { category: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.subscription.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
  }

  await prisma.subscription.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
