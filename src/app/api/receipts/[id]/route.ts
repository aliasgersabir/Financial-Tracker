import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
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

  return NextResponse.json(receipt)
}

export async function DELETE(
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
  })

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
  }

  await prisma.receipt.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
