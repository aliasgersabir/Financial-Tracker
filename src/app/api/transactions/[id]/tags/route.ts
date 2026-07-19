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

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const tags = await prisma.transactionTag.findMany({
    where: { transactionId: id },
    include: { tag: true },
  })

  return NextResponse.json(tags.map((tt) => tt.tag))
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { tagIds } = await req.json()

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.transactionTag.deleteMany({
    where: { transactionId: id },
  })

  if (tagIds && tagIds.length > 0) {
    await prisma.transactionTag.createMany({
      data: tagIds.map((tagId: string) => ({
        transactionId: id,
        tagId,
      })),
    })
  }

  const tags = await prisma.transactionTag.findMany({
    where: { transactionId: id },
    include: { tag: true },
  })

  return NextResponse.json(tags.map((tt) => tt.tag))
}
