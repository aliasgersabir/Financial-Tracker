import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { name, color } = await req.json()

  const tag = await prisma.tag.updateMany({
    where: { id, userId: session.user.id },
    data: { name, color },
  })

  return NextResponse.json(tag)
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
  await prisma.tag.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ message: "Deleted" })
}
