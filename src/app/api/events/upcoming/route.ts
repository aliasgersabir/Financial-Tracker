import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const days = parseInt(searchParams.get("days") || "30")

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  const events = await prisma.calendarEvent.findMany({
    where: {
      userId: session.user.id,
      isCompleted: false,
      date: {
        gte: now,
        lte: future,
      },
    },
    include: { account: true, category: true },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(events)
}
