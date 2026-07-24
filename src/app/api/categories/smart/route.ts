import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function matchesPattern(description: string, pattern: string, matchType: string): boolean {
  const desc = description.toLowerCase()
  const pat = pattern.toLowerCase()
  switch (matchType) {
    case "exact":
      return desc === pat
    case "starts_with":
      return desc.startsWith(pat)
    case "contains":
    default:
      return desc.includes(pat)
  }
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  const uncategorized = await prisma.transaction.findMany({
    where: { userId, categoryId: null, type: "expense" },
  })

  if (uncategorized.length === 0) {
    return NextResponse.json({ categorized: 0, transactions: [] })
  }

  const rules = await prisma.learningCategoryRule.findMany({
    where: { userId, isActive: true },
    include: { category: true },
    orderBy: [{ priority: "desc" }],
  })

  let categorizedCount = 0
  const categorizedTransactions: { id: string; description: string; categoryId: string; categoryName: string }[] = []

  for (const tx of uncategorized) {
    for (const rule of rules) {
      if (matchesPattern(tx.description, rule.pattern, rule.matchType)) {
        await prisma.transaction.update({
          where: { id: tx.id },
          data: { categoryId: rule.categoryId },
        })
        await prisma.learningCategoryRule.update({
          where: { id: rule.id },
          data: { timesApplied: { increment: 1 } },
        })
        categorizedCount++
        categorizedTransactions.push({
          id: tx.id,
          description: tx.description,
          categoryId: rule.categoryId,
          categoryName: rule.category.name,
        })
        break
      }
    }
  }

  return NextResponse.json({ categorized: categorizedCount, transactions: categorizedTransactions })
}
