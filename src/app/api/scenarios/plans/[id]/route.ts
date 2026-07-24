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

  const plan = await prisma.scenarioPlan.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!plan) {
    return NextResponse.json({ error: "Scenario plan not found" }, { status: 404 })
  }

  return NextResponse.json(plan)
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

  const existing = await prisma.scenarioPlan.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Scenario plan not found" }, { status: 404 })
  }

  const plan = await prisma.scenarioPlan.update({
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
      ...(body.projections !== undefined && {
        projections:
          typeof body.projections === "string"
            ? body.projections
            : JSON.stringify(body.projections),
      }),
      ...(body.isFavorite !== undefined && { isFavorite: body.isFavorite }),
    },
  })

  return NextResponse.json(plan)
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

  const existing = await prisma.scenarioPlan.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Scenario plan not found" }, { status: 404 })
  }

  await prisma.scenarioPlan.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
