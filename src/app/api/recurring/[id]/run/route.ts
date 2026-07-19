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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { id } = await params
  const rule = await prisma.recurringRule.findFirst({
    where: { id, userId },
  })
  if (!rule) return Response.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const nextRun = getNextRunDate(now, rule.frequency, rule.interval)

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        amount: rule.amount,
        description: rule.description,
        type: rule.type,
        date: now,
        accountId: rule.accountId,
        categoryId: rule.categoryId,
        userId,
        recurringRuleId: rule.id,
      },
    })

    const balanceChange = rule.type === "income" ? rule.amount : -rule.amount
    await tx.account.update({
      where: { id: rule.accountId },
      data: { balance: { increment: balanceChange } },
    })

    const updatedRule = await tx.recurringRule.update({
      where: { id: rule.id },
      data: {
        lastRunDate: now,
        nextRunDate: rule.endDate && nextRun > rule.endDate ? rule.nextRunDate : nextRun,
        isActive: rule.endDate && nextRun > rule.endDate ? false : rule.isActive,
      },
    })

    return { transaction, rule: updatedRule }
  })

  return Response.json(result)
}
