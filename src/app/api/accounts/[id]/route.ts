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
  const account = await prisma.account.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(account)
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
  const { name, type, balance, color } = await req.json()

  const account = await prisma.account.updateMany({
    where: { id, userId: session.user.id },
    data: { name, type, balance, color },
  })

  return NextResponse.json(account)
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
  await prisma.account.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ message: "Deleted" })
}
