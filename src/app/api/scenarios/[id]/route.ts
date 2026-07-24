import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const scenario = await prisma.scenarioAnalysis.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 })
  }

  return NextResponse.json(scenario)
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()

  const existing = await prisma.scenarioAnalysis.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 })
  }

  const scenario = await prisma.scenarioAnalysis.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.assumptions !== undefined && {
        assumptions:
          typeof body.assumptions === "string"
            ? body.assumptions
            : JSON.stringify(body.assumptions),
      }),
      ...(body.results !== undefined && {
        results:
          typeof body.results === "string"
            ? body.results
            : JSON.stringify(body.results),
      }),
      ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
    },
  })

  return NextResponse.json(scenario)
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.scenarioAnalysis.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Scenario not found" }, { status: 404 })
  }

  await prisma.scenarioAnalysis.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
