import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const result: Record<string, unknown> = {
    tursoUrl: process.env.TURSO_DATABASE_URL ? "SET" : "NOT SET",
    tursoToken: process.env.TURSO_AUTH_TOKEN ? "SET" : "NOT SET",
    databaseUrl: process.env.DATABASE_URL || "NOT SET",
    authSecret: process.env.AUTH_SECRET ? "SET" : "NOT SET",
    authUrl: process.env.AUTH_URL || "NOT SET",
    nextauthUrl: process.env.NEXTAUTH_URL || "NOT SET",
    nodeEnv: process.env.NODE_ENV,
  }

  try {
    await prisma.$queryRaw`SELECT 1 as test`
    result.db = "CONNECTED"
  } catch (e) {
    result.db = "FAILED"
    result.dbError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(result, {
    status: result.db === "CONNECTED" ? 200 : 500,
  })
}
