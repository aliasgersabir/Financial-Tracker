import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function parseCSV(text: string) {
  const lines = text.trim().split("\n")
  const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""))
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = line.split(",").map(v => v.trim().replace(/"/g, ""))
    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || "" })
    rows.push(row)
  }
  return { headers, rows }
}

function findColumn(headers: string[], candidates: string[]): string | null {
  for (const c of candidates) {
    if (headers.includes(c)) return c
  }
  return null
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^0-9.\-]/g, "")
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

function parseDate(value: string): Date | null {
  const cleaned = value.replace(/"/g, "").trim()
  const d = new Date(cleaned)
  if (!isNaN(d.getTime())) return d
  const parts = cleaned.split(/[\/\-\.]/)
  if (parts.length === 3) {
    const m = parseInt(parts[0]) - 1
    const day = parseInt(parts[1])
    const y = parseInt(parts[2])
    if (y > 99 && !isNaN(m) && !isNaN(day)) {
      const date = new Date(y, m, day)
      if (!isNaN(date.getTime())) return date
    }
  }
  return null
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const jobs = await prisma.importJob.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { account: { select: { name: true } } },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  const accountId = formData.get("accountId") as string | null

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 })
  }
  if (!accountId) {
    return NextResponse.json({ error: "Account is required" }, { status: 400 })
  }

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: session.user.id },
  })
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  const text = await file.text()
  const { headers, rows: csvRows } = parseCSV(text)

  const dateCol = findColumn(headers, ["date", "transaction date", "posted date", "trans date"])
  const descCol = findColumn(headers, ["description", "desc", "memo", "payee", "name", "merchant"])
  const amountCol = findColumn(headers, ["amount"])
  const debitCol = findColumn(headers, ["debit", "withdrawal", "outflow"])
  const creditCol = findColumn(headers, ["credit", "deposit", "inflow"])
  const balanceCol = findColumn(headers, ["balance", "running balance", "ending balance"])

  if (!dateCol && !descCol && !amountCol && !debitCol && !creditCol) {
    return NextResponse.json(
      { error: "Could not detect valid CSV columns. Expected: date, description, amount/debit/credit" },
      { status: 400 }
    )
  }

  const job = await prisma.importJob.create({
    data: {
      userId: session.user.id,
      accountId,
      fileName: file.name,
      fileType: file.type || "text/csv",
      status: "preview",
      totalRows: csvRows.length,
    },
  })

  const existingTransactions = await prisma.transaction.findMany({
    where: { userId: session.user.id, accountId },
    select: { amount: true, date: true, description: true },
  })

  const importRows: Array<{
    jobId: string
    date: Date
    description: string
    amount: number
    type: string
    balance: number | null
    merchantName: string | null
    suggestedCategoryId: string | null
    status: string
  }> = []

  let duplicates = 0
  let newCount = 0

  for (const csvRow of csvRows) {
    const rowDate = dateCol ? parseDate(csvRow[dateCol]) : null
    if (!rowDate) continue

    const description = descCol ? csvRow[descCol] : "Unknown"
    if (!description || description === "Unknown") continue

    let amount = 0
    if (amountCol) {
      amount = parseAmount(csvRow[amountCol])
    } else {
      const debit = debitCol ? parseAmount(csvRow[debitCol]) : 0
      const credit = creditCol ? parseAmount(csvRow[creditCol]) : 0
      if (debit > 0) amount = -debit
      else if (credit > 0) amount = credit
    }

    if (amount === 0) continue

    const type = amount < 0 ? "debit" : "credit"
    const rowDay = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate())

    const isDuplicate = existingTransactions.some(t => {
      const tDay = new Date(t.date.getFullYear(), t.date.getMonth(), t.date.getDate())
      const sameDay = tDay.getTime() === rowDay.getTime()
      const sameAmount = Math.abs(t.amount - amount) < 0.01
      const descMatch = t.description.toLowerCase().includes(description.toLowerCase().slice(0, 10)) ||
        description.toLowerCase().includes(t.description.toLowerCase().slice(0, 10))
      return sameDay && sameAmount && descMatch
    })

    const balance = balanceCol ? parseAmount(csvRow[balanceCol]) : null

    importRows.push({
      jobId: job.id,
      date: rowDate,
      description,
      amount: Math.abs(amount),
      type,
      balance: isNaN(balance as number) ? null : balance,
      merchantName: description,
      suggestedCategoryId: null,
      status: isDuplicate ? "duplicate" : "new",
    })

    if (isDuplicate) duplicates++
    else newCount++
  }

  if (importRows.length > 0) {
    await prisma.importRow.createMany({ data: importRows })
  }

  const updatedJob = await prisma.importJob.update({
    where: { id: job.id },
    data: {
      totalRows: importRows.length,
      duplicateRows: duplicates,
      skippedRows: csvRows.length - importRows.length,
    },
  })

  return NextResponse.json({ ...updatedJob, newCount, duplicates })
}
