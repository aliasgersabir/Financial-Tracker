import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tags = await prisma.tag.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tags)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, color } = await req.json()

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      color: color || "#6B7280",
      userId: session.user.id,
    },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  })

  return NextResponse.json(tag, { status: 201 })
}
