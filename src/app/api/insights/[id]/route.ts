import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { isRead, isDismissed } = await req.json()

  const insight = await prisma.aIInsight.findUnique({ where: { id } })

  if (!insight || insight.userId !== session.user.id) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 })
  }

  const updated = await prisma.aIInsight.update({
    where: { id },
    data: {
      ...(isRead !== undefined && { isRead }),
      ...(isDismissed !== undefined && { isDismissed }),
    },
  })

  if (isDismissed) {
    await prisma.insightHistory.create({
      data: {
        userId: session.user.id,
        insightType: updated.type,
        insightTitle: updated.title,
        action: "dismissed",
      },
    })
  } else if (isRead) {
    await prisma.insightHistory.create({
      data: {
        userId: session.user.id,
        insightType: updated.type,
        insightTitle: updated.title,
        action: "read",
      },
    })
  }

  return NextResponse.json(updated)
}
