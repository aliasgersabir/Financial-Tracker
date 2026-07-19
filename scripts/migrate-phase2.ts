/**
 * Phase 2 Migration Script
 * Run: TURSO_AUTH_TOKEN=xxx npx tsx scripts/migrate-phase2.ts
 */
import { createClient } from "@libsql/client"

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN")
  process.exit(1)
}

const db = createClient({ url, authToken })

const migrations = [
  // Budget Management
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

  // Savings Goals
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

  // Recurring Transactions
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

  // Add recurringRuleId to Transaction
  `ALTER TABLE "Transaction" ADD COLUMN "recurringRuleId" TEXT REFERENCES "RecurringRule"("id") ON DELETE SET NULL`,

  // Statement Import
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

  // Calendar Events
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

  // Notifications
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

  // Reports
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

  // Tags
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

async function migrate() {
  console.log("Starting Phase 2 migration...")
  let success = 0
  let skipped = 0

  for (const sql of migrations) {
    try {
      await db.execute(sql)
      success++
    } catch (e: any) {
      if (e.message?.includes("already exists")) {
        skipped++
      } else {
        console.error(`Failed: ${sql.substring(0, 80)}...`)
        console.error(`  Error: ${e.message}`)
      }
    }
  }

  console.log(`Migration complete: ${success} applied, ${skipped} already existed`)
  process.exit(0)
}

migrate()
