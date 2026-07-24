-- FinOS Phase 2 Database Migration for Turso
-- Run this in the Turso dashboard SQL editor: https://console.turso.org
-- Or via: turso db shell <database-name>

-- Budget table
CREATE TABLE IF NOT EXISTS "Budget" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "month" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Budget_userId_month_year_key" ON "Budget"("userId", "month", "year");

-- BudgetItem table
CREATE TABLE IF NOT EXISTS "BudgetItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "budgetId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE,
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "BudgetItem_budgetId_categoryId_key" ON "BudgetItem"("budgetId", "categoryId");

-- Goal table
CREATE TABLE IF NOT EXISTS "Goal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "targetAmount" REAL NOT NULL,
  "currentSaved" REAL NOT NULL DEFAULT 0,
  "deadline" DATETIME,
  "monthlyTarget" REAL,
  "notes" TEXT,
  "icon" TEXT NOT NULL DEFAULT 'target',
  "color" TEXT NOT NULL DEFAULT '#2563EB',
  "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- GoalContribution table
CREATE TABLE IF NOT EXISTS "GoalContribution" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "goalId" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE
);

-- RecurringRule table
CREATE TABLE IF NOT EXISTS "RecurringRule" (
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
);

-- ImportJob table
CREATE TABLE IF NOT EXISTS "ImportJob" (
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
);

-- ImportRow table
CREATE TABLE IF NOT EXISTS "ImportRow" (
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
);

-- CalendarEvent table
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
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
);

-- Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
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
);

-- Report table
CREATE TABLE IF NOT EXISTS "Report" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "data" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Tag table
CREATE TABLE IF NOT EXISTS "Tag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6B7280',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_name_userId_key" ON "Tag"("name", "userId");

-- TransactionTag junction table
CREATE TABLE IF NOT EXISTS "TransactionTag" (
  "transactionId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("transactionId", "tagId"),
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE,
  FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE
);

-- Add recurringRuleId column to Transaction table if it doesn't exist
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- If this fails with "duplicate column name", that's fine — the column already exists
-- ALTER TABLE "Transaction" ADD COLUMN "recurringRuleId" TEXT DEFAULT NULL;

-- ============================================================
-- Phase 3 Tables
-- ============================================================

-- Receipt table
CREATE TABLE IF NOT EXISTS "Receipt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileUrl" TEXT,
  "merchantName" TEXT,
  "totalAmount" REAL,
  "taxAmount" REAL,
  "date" DATETIME,
  "rawText" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "transactionId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- OCRExtraction table
CREATE TABLE IF NOT EXISTS "OCRExtraction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "receiptId" TEXT NOT NULL,
  "merchant" TEXT,
  "date" DATETIME,
  "subtotal" REAL,
  "tax" REAL,
  "total" REAL,
  "items" TEXT,
  "confidence" REAL,
  "rawResponse" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE CASCADE
);

-- Subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "amount" REAL NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "frequency" TEXT NOT NULL DEFAULT 'monthly',
  "categoryId" TEXT,
  "nextRenewal" DATETIME,
  "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endDate" DATETIME,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "isTrial" BOOLEAN NOT NULL DEFAULT 0,
  "website" TEXT,
  "notes" TEXT,
  "autoDetected" BOOLEAN NOT NULL DEFAULT 0,
  "paymentMethod" TEXT,
  "color" TEXT NOT NULL DEFAULT '#6B7280',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL
);

-- Forecast table
CREATE TABLE IF NOT EXISTS "Forecast" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "period" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME NOT NULL,
  "data" TEXT NOT NULL,
  "accuracy" REAL,
  "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- AIInsight table
CREATE TABLE IF NOT EXISTS "AIInsight" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "action" TEXT,
  "category" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "confidence" REAL,
  "isRead" BOOLEAN NOT NULL DEFAULT 0,
  "isDismissed" BOOLEAN NOT NULL DEFAULT 0,
  "metadata" TEXT,
  "expiresAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- InsightHistory table
CREATE TABLE IF NOT EXISTS "InsightHistory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "insightType" TEXT NOT NULL,
  "insightTitle" TEXT NOT NULL,
  "action" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- FinancialHealthSnapshot table
CREATE TABLE IF NOT EXISTS "FinancialHealthSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "savingsRate" REAL,
  "budgetDiscipline" REAL,
  "goalProgress" REAL,
  "emergencyFund" REAL,
  "spendingConsistency" REAL,
  "debtRatio" REAL,
  "breakdown" TEXT,
  "snapshotDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- ScenarioAnalysis table
CREATE TABLE IF NOT EXISTS "ScenarioAnalysis" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "assumptions" TEXT NOT NULL,
  "results" TEXT,
  "isFavorite" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- CashFlowProjection table
CREATE TABLE IF NOT EXISTS "CashFlowProjection" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "type" TEXT NOT NULL,
  "description" TEXT,
  "amount" REAL NOT NULL,
  "category" TEXT,
  "isRecurring" BOOLEAN NOT NULL DEFAULT 0,
  "isConfirmed" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- LearningCategoryRule table
CREATE TABLE IF NOT EXISTS "LearningCategoryRule" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "pattern" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "matchType" TEXT NOT NULL DEFAULT 'contains',
  "priority" INTEGER NOT NULL DEFAULT 0,
  "timesApplied" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE
);

-- ScenarioPlan table
CREATE TABLE IF NOT EXISTS "ScenarioPlan" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "assumptions" TEXT NOT NULL,
  "projections" TEXT,
  "isFavorite" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Add subscriptionId column to Transaction table
-- ALTER TABLE "Transaction" ADD COLUMN "subscriptionId" TEXT DEFAULT NULL;
