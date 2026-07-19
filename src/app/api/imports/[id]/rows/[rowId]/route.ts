import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; rowId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, rowId } = await params

  const job = await prisma.importJob.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!job) {
    return NextResponse.json({ error: "Import job not found" }, { status: 404 })
  }

  const row = await prisma.importRow.findFirst({
    where: { id: rowId, jobId: id },
  })
  if (!row) {
    return NextResponse.json({ error: "Import row not found" }, { status: 404 })
  }

  const body = await req.json()
  const updateData: Record<string, unknown> = {}

  if (body.categoryId !== undefined) updateData.suggestedCategoryId = body.categoryId
  if (body.merchantName !== undefined) updateData.merchantName = body.merchantName
  if (body.amount !== undefined) updateData.amount = body.amount
  if (body.status !== undefined) updateData.status = body.status

  const updated = await prisma.importRow.update({
    where: { id: rowId },
    data: updateData,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; rowId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, rowId } = await params

  const job = await prisma.importJob.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!job) {
    return NextResponse.json({ error: "Import job not found" }, { status: 404 })
  }

  const row = await prisma.importRow.findFirst({
    where: { id: rowId, jobId: id },
  })
  if (!row) {
    return NextResponse.json({ error: "Import row not found" }, { status: 404 })
  }

  await prisma.importRow.delete({ where: { id: rowId } })

  return NextResponse.json({ success: true })
}
