import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

interface TransactionGroup {
  normalizedDesc: string
  amounts: number[]
  transactions: { id: string; amount: number; description: string; date: Date }[]
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function detectFrequency(dates: Date[]): string {
  if (dates.length < 2) return "monthly"
  const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    gaps.push((sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24))
  }
  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length
  if (avgGap < 10) return "weekly"
  if (avgGap < 20) return "biweekly"
  if (avgGap < 40) return "monthly"
  if (avgGap < 100) return "quarterly"
  return "yearly"
}

function calculateConfidence(count: number, dateSpanDays: number, amounts: number[]): number {
  let score = 0
  if (count >= 3) score += 0.3
  else if (count >= 2) score += 0.15

  if (dateSpanDays > 60) score += 0.2
  else if (dateSpanDays > 30) score += 0.1

  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
  const variance = amounts.reduce((s, a) => s + Math.pow(a - avg, 2), 0) / amounts.length
  const stdDev = Math.sqrt(variance)
  if (avg > 0 && stdDev / avg < 0.05) score += 0.3
  else if (avg > 0 && stdDev / avg < 0.1) score += 0.2
  else if (avg > 0 && stdDev / avg < 0.2) score += 0.1

  score += Math.min(count * 0.05, 0.2)

  return Math.min(Math.round(score * 100) / 100, 1)
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      type: "expense",
      date: { gte: sixMonthsAgo },
    },
    orderBy: { date: "desc" },
  })

  const existingSubscriptions = await prisma.subscription.findMany({
    where: { userId: session.user.id },
  })
  const existingSubNames = new Set(existingSubscriptions.map((s) => s.name.toLowerCase()))

  const groups: Record<string, TransactionGroup> = {}
  for (const t of transactions) {
    const normalized = normalizeDescription(t.description)
    const key = `${normalized}__${Math.round(t.amount * 100)}`
    if (!groups[key]) {
      groups[key] = { normalizedDesc: normalized, amounts: [], transactions: [] }
    }
    groups[key].amounts.push(t.amount)
    groups[key].transactions.push({ id: t.id, amount: t.amount, description: t.description, date: new Date(t.date) })
  }

  const detected: {
    name: string
    amount: number
    frequency: string
    confidence: number
    occurrences: number
    transactionIds: string[]
    averageAmount: number
    dateRange: { first: Date; last: Date }
    alreadySubscribed: boolean
  }[] = []

  for (const group of Object.values(groups)) {
    if (group.transactions.length < 2) continue

    const dates = group.transactions.map((t) => t.date)
    const dateSpan = (Math.max(...dates.map((d) => d.getTime())) - Math.min(...dates.map((d) => d.getTime()))) / (1000 * 60 * 60 * 24)
    const avgAmount = group.amounts.reduce((a, b) => a + b, 0) / group.amounts.length
    const confidence = calculateConfidence(group.transactions.length, dateSpan, group.amounts)

    if (confidence < 0.3) continue

    const frequency = detectFrequency(dates)
    const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())

    const words = group.normalizedDesc.split(" ").filter((w) => w.length > 2)
    const name = words.slice(0, 3).join(" ").replace(/\b\w/g, (c) => c.toUpperCase()) || group.normalizedDesc

    detected.push({
      name: name.substring(0, 50),
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      confidence,
      occurrences: group.transactions.length,
      transactionIds: group.transactions.map((t) => t.id),
      averageAmount: Math.round(avgAmount * 100) / 100,
      dateRange: { first: sortedDates[0], last: sortedDates[sortedDates.length - 1] },
      alreadySubscribed: existingSubNames.has(name.toLowerCase()),
    })
  }

  detected.sort((a, b) => b.confidence - a.confidence)

  return NextResponse.json(detected.slice(0, 20))
}
