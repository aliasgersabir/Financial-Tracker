import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    include: { ocrExtraction: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(receipts)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { fileName, fileType, fileUrl } = body

  if (!fileName || !fileType) {
    return NextResponse.json(
      { error: "fileName and fileType are required" },
      { status: 400 }
    )
  }

  const receipt = await prisma.receipt.create({
    data: {
      userId: session.user.id,
      fileName,
      fileType,
      fileUrl: fileUrl || null,
      status: "pending",
    },
  })

  return NextResponse.json(receipt, { status: 201 })
}
