import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PUT() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  })

  return Response.json({ success: true })
}

export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.notification.deleteMany({
    where: { userId: session.user.id, isRead: true },
  })

  return Response.json({ success: true })
}
