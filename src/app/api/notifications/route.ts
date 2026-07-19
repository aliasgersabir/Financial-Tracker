import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const url = new URL(req.url)
  const unreadOnly = url.searchParams.get("unread") === "true"
  const page = parseInt(url.searchParams.get("page") || "1")
  const limit = parseInt(url.searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { userId }
  if (unreadOnly) where.isRead = false

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])

  return Response.json({ notifications, unreadCount, total })
}
