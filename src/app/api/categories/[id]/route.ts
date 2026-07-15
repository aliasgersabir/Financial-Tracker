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
  const category = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!category) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(category)
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
  const { name, type, icon, color } = await req.json()

  const category = await prisma.category.updateMany({
    where: { id, userId: session.user.id },
    data: { name, type, icon, color },
  })

  return NextResponse.json(category)
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
  await prisma.category.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ message: "Deleted" })
}
