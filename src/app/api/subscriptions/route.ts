import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function annualCost(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":
      return amount * 52
    case "biweekly":
      return amount * 26
    case "monthly":
      return amount * 12
    case "quarterly":
      return amount * 4
    case "yearly":
      return amount
    default:
      return amount * 12
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
    include: { category: true, transactions: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  const enriched = subscriptions.map((sub) => {
    const monthlyCost =
      sub.frequency === "weekly"
        ? sub.amount * 4.33
        : sub.frequency === "biweekly"
          ? sub.amount * 2.17
          : sub.frequency === "quarterly"
            ? sub.amount / 3
            : sub.frequency === "yearly"
              ? sub.amount / 12
              : sub.amount

    const daysUntilRenewal = sub.nextRenewal
      ? daysBetween(now, new Date(sub.nextRenewal))
      : null

    return {
      ...sub,
      monthlyCost: Math.round(monthlyCost * 100) / 100,
      annualCost: Math.round(annualCost(sub.amount, sub.frequency) * 100) / 100,
      daysUntilRenewal,
    }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, amount, frequency, categoryId, nextRenewal, startDate, endDate, website, notes, isTrial, paymentMethod, color } = await req.json()

  if (!name || !amount) {
    return NextResponse.json({ error: "Name and amount are required" }, { status: 400 })
  }

  const subscription = await prisma.subscription.create({
    data: {
      name,
      amount: parseFloat(amount),
      frequency: frequency || "monthly",
      categoryId: categoryId || null,
      nextRenewal: nextRenewal ? new Date(nextRenewal) : null,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : null,
      website: website || null,
      notes: notes || null,
      isTrial: isTrial || false,
      paymentMethod: paymentMethod || null,
      color: color || "#6B7280",
      userId: session.user.id,
    },
    include: { category: true },
  })

  return NextResponse.json(subscription, { status: 201 })
}
