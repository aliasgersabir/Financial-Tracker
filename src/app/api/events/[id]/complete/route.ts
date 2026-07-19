import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const event = await prisma.calendarEvent.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const updated = await prisma.calendarEvent.update({
    where: { id },
    data: { isCompleted: !event.isCompleted },
    include: { account: true, category: true },
  })

  return NextResponse.json(updated)
}
