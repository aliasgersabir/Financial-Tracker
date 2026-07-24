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

  const existing = await prisma.learningCategoryRule.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 })
  }

  const { pattern, categoryId, matchType, priority, isActive } = await req.json()

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category || category.userId !== session.user.id) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
  }

  if (matchType) {
    const validMatchTypes = ["contains", "starts_with", "exact"]
    if (!validMatchTypes.includes(matchType)) {
      return NextResponse.json({ error: `matchType must be one of: ${validMatchTypes.join(", ")}` }, { status: 400 })
    }
  }

  const updated = await prisma.learningCategoryRule.update({
    where: { id },
    data: {
      ...(pattern !== undefined && { pattern }),
      ...(categoryId !== undefined && { categoryId }),
      ...(matchType !== undefined && { matchType }),
      ...(priority !== undefined && { priority: parseInt(priority) }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { category: true },
  })

  return NextResponse.json(updated)
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

  const existing = await prisma.learningCategoryRule.findUnique({ where: { id } })
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 })
  }

  await prisma.learningCategoryRule.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
