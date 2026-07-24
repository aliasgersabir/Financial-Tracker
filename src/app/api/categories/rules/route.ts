import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rules = await prisma.learningCategoryRule.findMany({
    where: { userId: session.user.id },
    include: { category: true },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(rules)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pattern, categoryId, matchType, priority } = await req.json()

  if (!pattern || !categoryId) {
    return NextResponse.json({ error: "Pattern and categoryId are required" }, { status: 400 })
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } })
  if (!category || category.userId !== session.user.id) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const validMatchTypes = ["contains", "starts_with", "exact"]
  if (matchType && !validMatchTypes.includes(matchType)) {
    return NextResponse.json({ error: `matchType must be one of: ${validMatchTypes.join(", ")}` }, { status: 400 })
  }

  const rule = await prisma.learningCategoryRule.create({
    data: {
      pattern,
      categoryId,
      matchType: matchType || "contains",
      priority: priority || 0,
      userId: session.user.id,
    },
    include: { category: true },
  })

  return NextResponse.json(rule, { status: 201 })
}
