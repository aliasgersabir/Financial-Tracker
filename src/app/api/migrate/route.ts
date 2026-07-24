import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST() {
  try {
    await prisma.$queryRaw`SELECT 1 as test`
  } catch {
    return NextResponse.json({ error: "Database not connected" }, { status: 500 })
  }

  const migrations = [
    `CREATE TABLE IF NOT EXISTS "Budget" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "month" INTEGER NOT NULL,
      "year" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Budget_userId_month_year_key" ON "Budget"("userId", "month", "year")`,
    `CREATE TABLE IF NOT EXISTS "BudgetItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "budgetId" TEXT NOT NULL,
      "categoryId" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE,
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "BudgetItem_budgetId_categoryId_key" ON "BudgetItem"("budgetId", "categoryId")`,
    `CREATE TABLE IF NOT EXISTS "Goal" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "targetAmount" REAL NOT NULL,
      "currentSaved" REAL NOT NULL DEFAULT 0,
      "deadline" DATETIME,
      "monthlyTarget" REAL,
      "notes" TEXT,
      "icon" TEXT NOT NULL DEFAULT '🎯',
      "color" TEXT NOT NULL DEFAULT '#2563EB',
      "status" TEXT NOT NULL DEFAULT 'active',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "GoalContribution" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "goalId" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "RecurringRule" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "categoryId" TEXT,
      "amount" REAL NOT NULL,
      "description" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'expense',
      "frequency" TEXT NOT NULL,
      "interval" INTEGER NOT NULL DEFAULT 1,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME,
      "nextRunDate" DATETIME NOT NULL,
      "lastRunDate" DATETIME,
      "isActive" BOOLEAN NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE,
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "ImportJob" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "accountId" TEXT NOT NULL,
      "fileName" TEXT NOT NULL,
      "fileType" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "totalRows" INTEGER NOT NULL DEFAULT 0,
      "importedRows" INTEGER NOT NULL DEFAULT 0,
      "skippedRows" INTEGER NOT NULL DEFAULT 0,
      "duplicateRows" INTEGER NOT NULL DEFAULT 0,
      "errorMessage" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completedAt" DATETIME,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "ImportRow" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "jobId" TEXT NOT NULL,
      "date" DATETIME NOT NULL,
      "description" TEXT NOT NULL,
      "amount" REAL NOT NULL,
      "type" TEXT NOT NULL,
      "balance" REAL,
      "merchantName" TEXT,
      "suggestedCategoryId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'new',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "CalendarEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "amount" REAL,
      "accountId" TEXT,
      "categoryId" TEXT,
      "date" DATETIME NOT NULL,
      "endDate" DATETIME,
      "type" TEXT NOT NULL DEFAULT 'custom',
      "recurrence" TEXT NOT NULL DEFAULT 'none',
      "recurrenceInterval" INTEGER NOT NULL DEFAULT 1,
      "reminderBefore" INTEGER,
      "isCompleted" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE SET NULL,
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "isRead" BOOLEAN NOT NULL DEFAULT 0,
      "link" TEXT,
      "metadata" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Report" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "period" TEXT NOT NULL,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "data" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Tag" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "color" TEXT NOT NULL DEFAULT '#6B7280',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_userId_key" ON "Tag"("name", "userId")`,
    `CREATE TABLE IF NOT EXISTS "TransactionTag" (
      "transactionId" TEXT NOT NULL,
      "tagId" TEXT NOT NULL,
      PRIMARY KEY ("transactionId", "tagId"),
      FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE,
      FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE
    )`,
  ]

  let success = 0
  let skipped = 0
  const errors: string[] = []

  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql)
      success++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes("already exists")) {
        skipped++
      } else {
        errors.push(msg)
      }
    }
  }

  try {
    const cols = await prisma.$queryRawUnsafe<{ name: string }[]>(
      `PRAGMA table_info("Transaction")`
    )
    const hasRecurringCol = cols.some(c => c.name === "recurringRuleId")
    if (!hasRecurringCol) {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Transaction" ADD COLUMN "recurringRuleId" TEXT DEFAULT NULL`)
      success++
    } else {
      skipped++
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (!msg.includes("already exists")) {
      errors.push(msg)
    } else {
      skipped++
    }
  }

  return NextResponse.json({ success, skipped, errors })
}
