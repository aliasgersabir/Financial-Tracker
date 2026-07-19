import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") || "30")

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  const rules = await prisma.recurringRule.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      nextRunDate: { gte: now, lte: future },
    },
    include: { account: true, category: true },
    orderBy: { nextRunDate: "asc" },
  })

  return Response.json(rules)
}
