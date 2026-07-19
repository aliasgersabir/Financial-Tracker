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

  const job = await prisma.importJob.findFirst({
    where: { id, userId: session.user.id },
    include: { rows: { orderBy: { createdAt: "asc" } } },
  })

  if (!job) {
    return NextResponse.json({ error: "Import job not found" }, { status: 404 })
  }

  return NextResponse.json(job)
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

  const job = await prisma.importJob.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!job) {
    return NextResponse.json({ error: "Import job not found" }, { status: 404 })
  }

  await prisma.importJob.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
