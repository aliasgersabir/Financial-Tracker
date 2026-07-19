import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const report = await prisma.report.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!report) return Response.json({ error: "Not found" }, { status: 404 })

  return Response.json({ ...report, parsedData: JSON.parse(report.data) })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const report = await prisma.report.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!report) return Response.json({ error: "Not found" }, { status: 404 })

  await prisma.report.delete({ where: { id } })

  return Response.json({ success: true })
}
