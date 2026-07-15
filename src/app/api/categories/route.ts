import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, type, icon, color } = await req.json()

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  const category = await prisma.category.create({
    data: {
      name,
      type: type || "expense",
      icon: icon || "📦",
      color: color || "#6366f1",
      userId: session.user.id,
    },
  })

  return NextResponse.json(category, { status: 201 })
}
