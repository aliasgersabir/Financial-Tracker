import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const { id } = await params

  const job = await prisma.importJob.findFirst({
    where: { id, userId },
    include: { rows: true },
  })

  if (!job) {
    return NextResponse.json({ error: "Import job not found" }, { status: 404 })
  }

  if (job.status !== "preview") {
    return NextResponse.json({ error: "Import job is not in preview state" }, { status: 400 })
  }

  const newRows = job.rows.filter(r => r.status === "new")

  let imported = 0
  let balanceAdjustment = 0

  if (newRows.length > 0) {
    const transactions = newRows.map(row => ({
      amount: row.type === "debit" ? -Math.abs(row.amount) : Math.abs(row.amount),
      description: row.description,
      date: row.date,
      type: row.type === "debit" ? "expense" : "income",
      accountId: job.accountId,
      categoryId: row.suggestedCategoryId,
      userId,
    }))

    await prisma.$transaction(async (tx) => {
      for (const t of transactions) {
        await tx.transaction.create({ data: t })
        balanceAdjustment += t.amount
      }

      await tx.account.update({
        where: { id: job.accountId },
        data: { balance: { increment: balanceAdjustment } },
      })

      await tx.importJob.update({
        where: { id: job.id },
        data: {
          status: "completed",
          importedRows: newRows.length,
          completedAt: new Date(),
        },
      })

      for (const row of newRows) {
        await tx.importRow.update({
          where: { id: row.id },
          data: { status: "imported" },
        })
      }
    })
  } else {
    await prisma.importJob.update({
      where: { id: job.id },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    })
  }

  const skipped = job.rows.filter(r => r.status === "skipped").length
  const duplicates = job.duplicateRows

  return NextResponse.json({ imported, skipped, duplicates })
}
