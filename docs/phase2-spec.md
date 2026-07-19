# Phase 2 — Database Schema & API Contracts

## Current Schema (Phase 1)

```prisma
model User {
  id, name, email, emailVerified, password, image
  accounts Account[]
  categories Category[]
  transactions Transaction[]
  createdAt, updatedAt
}

model Account {
  id, name, type, balance, currency, color, icon
  userId → User
  transactions Transaction[]
  createdAt, updatedAt
}

model Category {
  id, name, type, icon, color
  userId → User
  transactions Transaction[]
  @@unique([name, userId, type])
  createdAt, updatedAt
}

model Transaction {
  id, amount, description, date, type
  accountId → Account
  categoryId? → Category
  userId → User
  createdAt, updatedAt
}
```

---

## New Models

### 1. Budget Management

**Budget** — A monthly budget plan.

```prisma
model Budget {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String                              // "January 2026" or custom
  month       Int                                 // 1-12
  year        Int                                 // 2026
  items       BudgetItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([userId, month, year])
}
```

**BudgetItem** — Per-category spending limit within a budget.

```prisma
model BudgetItem {
  id          String   @id @default(cuid())
  budgetId    String
  budget      Budget   @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  amount      Float                                // budget limit
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([budgetId, categoryId])
}
```

**Query patterns:**
- Get current month budget: `WHERE userId = ? AND month = ? AND year = ?`
- Get budget with items + spent: Join BudgetItem → Category → Transaction (sum by category in date range)
- Check exceeded budgets: Sum transactions per category > BudgetItem.amount

---

### 2. Savings Goals

**Goal** — A savings target.

```prisma
model Goal {
  id              String             @id @default(cuid())
  userId          String
  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  name            String                                   // "Emergency Fund"
  targetAmount    Float
  currentSaved    Float               @default(0)
  deadline        DateTime?
  monthlyTarget   Float?                                    // desired monthly contribution
  notes           String?
  icon            String             @default("🎯")
  color           String             @default("#2563EB")
  status          String             @default("active")    // active | completed | paused
  contributions   GoalContribution[]
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
}
```

**GoalContribution** — Individual contribution to a goal.

```prisma
model GoalContribution {
  id        String   @id @default(cuid())
  goalId    String
  goal      Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  amount    Float
  date      DateTime @default(now())
  notes     String?
  createdAt DateTime @default(now())
}
```

**Query patterns:**
- Get all active goals: `WHERE userId = ? AND status = 'active'`
- Get goal with contributions: `include: { contributions: { orderBy: { date: 'desc' } } }`
- Calculate estimated completion: `currentSaved / monthlyTarget` months remaining
- Goal reached: `currentSaved >= targetAmount` → update status to "completed"

---

### 3. Recurring Transactions

**RecurringRule** — Defines a repeating transaction.

```prisma
model RecurringRule {
  id              String        @id @default(cuid())
  userId          String
  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId       String
  account         Account       @relation(fields: [accountId], references: [id], onDelete: Cascade)
  categoryId      String?
  category        Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  amount          Float
  description     String
  type            String        @default("expense")   // income | expense
  frequency       String                               // daily | weekly | monthly | yearly
  interval        Int           @default(1)            // every N periods
  startDate       DateTime
  endDate         DateTime?
  nextRunDate     DateTime
  lastRunDate     DateTime?
  isActive        Boolean       @default(true)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}
```

**Transaction** — Add optional link to recurring rule:

```prisma
model Transaction {
  // ... existing fields ...
  recurringRuleId  String?
  recurringRule    RecurringRule? @relation(fields: [recurringRuleId], references: [id], onDelete: SetNull)
}
```

**Query patterns:**
- Get due rules: `WHERE isActive = true AND nextRunDate <= now()`
- After creating transaction from rule: Update `lastRunDate`, calculate `nextRunDate`
- Next run calculation: Add interval to current based on frequency

---

### 4. Statement Import

**ImportJob** — Represents one import session.

```prisma
model ImportJob {
  id            String        @id @default(cuid())
  userId        String
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  accountId     String
  account       Account       @relation(fields: [accountId], references: [id], onDelete: Cascade)
  fileName      String
  fileType      String                               // csv | pdf
  status        String        @default("pending")    // pending | parsing | preview | completed | failed
  totalRows     Int           @default(0)
  importedRows  Int           @default(0)
  skippedRows   Int           @default(0)
  duplicateRows Int           @default(0)
  errorMessage  String?
  rows          ImportRow[]
  createdAt     DateTime      @default(now())
  completedAt   DateTime?
}
```

**ImportRow** — Individual parsed row from uploaded file.

```prisma
model ImportRow {
  id                  String      @id @default(cuid())
  jobId               String
  job                 ImportJob   @relation(fields: [jobId], references: [id], onDelete: Cascade)
  date                DateTime
  description         String
  amount              Float
  type                String                        // debit | credit
  balance             Float?
  merchantName        String?
  suggestedCategoryId String?
  status              String      @default("new")  // new | duplicate | skipped | imported
  createdAt           DateTime    @default(now())
}
```

**Query patterns:**
- Get preview rows: `WHERE jobId = ? AND status != 'skipped'`
- Detect duplicates: Check Transaction table for matching (amount, date, accountId, description similarity)
- After import: Set status to "completed", update ImportJob counts, optionally delete ImportRows

---

### 5. Calendar Events

**CalendarEvent** — A financial event on the calendar.

```prisma
model CalendarEvent {
  id                  String   @id @default(cuid())
  userId              String
  user                User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title               String                              // "Rent Payment"
  description         String?
  amount              Float?
  accountId           String?
  account             Account? @relation(fields: [accountId], references: [id], onDelete: SetNull)
  categoryId          String?
  category            Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  date                DateTime                            // event date
  endDate             DateTime?                           // for multi-day events
  type                String     @default("custom")       // bill | income | goal_deadline | subscription | custom
  recurrence          String     @default("none")         // none | daily | weekly | monthly | yearly
  recurrenceInterval  Int        @default(1)
  reminderBefore      Int?                                 // minutes before reminder
  isCompleted         Boolean    @default(false)
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt
}
```

**Query patterns:**
- Get events for month: `WHERE userId = ? AND date >= startOfMonth AND date <= endOfMonth`
- Get upcoming events: `WHERE userId = ? AND date >= now() AND isCompleted = false ORDER BY date`
- Get bills only: `WHERE type IN ('bill', 'subscription')`

---

### 6. Notifications

**Notification** — User notification.

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String
  message   String
  type      String                              // bill | goal | budget | report | import | security | system
  isRead    Boolean  @default(false)
  link      String?                             // "/dashboard/budgets" or "/dashboard/goals/abc123"
  metadata  String?                             // JSON string for extra data
  createdAt DateTime @default(now())
}
```

**Query patterns:**
- Get unread count: `WHERE userId = ? AND isRead = false` → `COUNT`
- Get notifications: `WHERE userId = ? ORDER BY createdAt DESC` with pagination
- Mark as read: `UPDATE SET isRead = true WHERE id = ? AND userId = ?`
- Mark all as read: `UPDATE SET isRead = true WHERE userId = ? AND isRead = false`

---

### 7. Reports

**Report** — A generated financial report (cached).

```prisma
model Report {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String                              // "January 2026 Report"
  period    String                              // monthly | quarterly | yearly | custom
  startDate DateTime
  endDate   DateTime
  data      String                              // JSON string with report data
  createdAt DateTime @default(now())
}
```

**Report data structure (JSON):**
```json
{
  "income": 8450,
  "expenses": 3241,
  "savings": 5209,
  "savingsRate": 0.616,
  "topCategory": { "name": "Food", "amount": 1200, "icon": "🍔" },
  "largestExpense": { "description": "Rent", "amount": 1500 },
  "categoryBreakdown": [
    { "name": "Food", "amount": 1200, "percentage": 0.37 },
    { "name": "Transport", "amount": 800, "percentage": 0.25 }
  ],
  "dailyTrend": [
    { "date": "2026-01-01", "income": 0, "expenses": 45 }
  ],
  "budgetPerformance": [
    { "category": "Food", "budgeted": 1500, "spent": 1200, "percentage": 0.8 }
  ],
  "goalProgress": [
    { "name": "Emergency Fund", "target": 10000, "current": 4500 }
  ]
}
```

**Query patterns:**
- Get reports: `WHERE userId = ? AND period = ? ORDER BY startDate DESC`
- Get report by period: `WHERE userId = ? AND startDate = ? AND endDate = ?`
- Generate: Compute from transactions, cache in Report table

---

### 8. Tags (Future-Proofing)

**Tag** — Flexible transaction tagging.

```prisma
model Tag {
  id           String           @id @default(cuid())
  userId       String
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  color        String           @default("#6B7280")
  transactions TransactionTag[]
  createdAt    DateTime         @default(now())

  @@unique([name, userId])
}
```

**TransactionTag** — Many-to-many junction.

```prisma
model TransactionTag {
  transactionId String
  transaction   Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  tagId         String
  tag           Tag         @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([transactionId, tagId])
}
```

**Transaction** — Add tag relation:

```prisma
model Transaction {
  // ... existing fields ...
  tags TransactionTag[]
}
```

---

### 9. User Model Updates

```prisma
model User {
  // ... existing fields ...
  budgets            Budget[]
  goals              Goal[]
  recurringRules     RecurringRule[]
  importJobs         ImportJob[]
  calendarEvents     CalendarEvent[]
  notifications      Notification[]
  reports            Report[]
  tags               Tag[]
}
```

### 10. Account Model Updates

```prisma
model Account {
  // ... existing fields ...
  calendarEvents CalendarEvent[]
  importJobs     ImportJob[]
  recurringRules RecurringRule[]
}
```

### 11. Category Model Updates

```prisma
model Category {
  // ... existing fields ...
  budgetItems     BudgetItem[]
  calendarEvents  CalendarEvent[]
  recurringRules  RecurringRule[]
}
```

---

## API Contracts

### Feature 1: Budget Management

```
GET    /api/budgets
       Query: ?month=1&year=2026
       Response: Budget[] with items, each item includes:
         { id, category: { id, name, icon, color }, amount, spent, remaining, percentage }

POST   /api/budgets
       Body: { name, month, year, items: [{ categoryId, amount }] }
       Response: Budget (with items)

PUT    /api/budgets/:id
       Body: { name?, month?, year? }
       Response: Budget

DELETE /api/budgets/:id
       Response: { message: "Deleted" }

POST   /api/budgets/:id/items
       Body: { categoryId, amount }
       Response: BudgetItem

PUT    /api/budgets/:id/items/:itemId
       Body: { amount }
       Response: BudgetItem

DELETE /api/budgets/:id/items/:itemId
       Response: { message: "Deleted" }

GET    /api/budgets/overview
       Query: ?month=1&year=2026
       Response: {
         totalBudgeted: number,
         totalSpent: number,
         totalRemaining: number,
         items: [{ category, budgeted, spent, percentage, status }]
       }
```

---

### Feature 2: Savings Goals

```
GET    /api/goals
       Response: Goal[]

POST   /api/goals
       Body: { name, targetAmount, deadline?, monthlyTarget?, notes?, icon?, color? }
       Response: Goal

GET    /api/goals/:id
       Response: Goal (with contributions)

PUT    /api/goals/:id
       Body: { name?, targetAmount?, deadline?, monthlyTarget?, notes?, icon?, color?, status? }
       Response: Goal

DELETE /api/goals/:id
       Response: { message: "Deleted" }

POST   /api/goals/:id/contributions
       Body: { amount, date?, notes? }
       Response: GoalContribution
       Side effect: Updates Goal.currentSaved

DELETE /api/goals/:id/contributions/:contributionId
       Response: { message: "Deleted" }
       Side effect: Updates Goal.currentSaved

GET    /api/goals/overview
       Response: {
         totalSaved: number,
         totalTarget: number,
         activeGoals: number,
         completedGoals: number,
         goals: [{ id, name, target, current, percentage, estimatedCompletion }]
       }
```

---

### Feature 3: Recurring Transactions

```
GET    /api/recurring
       Response: RecurringRule[]

POST   /api/recurring
       Body: { accountId, categoryId?, amount, description, type, frequency, interval, startDate, endDate? }
       Response: RecurringRule

PUT    /api/recurring/:id
       Body: { amount?, description?, frequency?, interval?, isActive?, endDate? }
       Response: RecurringRule

DELETE /api/recurring/:id
       Response: { message: "Deleted" }

POST   /api/recurring/:id/run
       Response: Transaction (creates transaction from rule)

GET    /api/recurring/upcoming
       Query: ?days=30
       Response: [{ rule, nextRunDate, estimatedAmount }]
```

---

### Feature 4: Statement Import

```
POST   /api/imports
       Body: FormData { file: File, accountId: string }
       Response: ImportJob
       Side effect: Parses file, creates ImportRows with status "new" or "duplicate"

GET    /api/imports/:id
       Response: ImportJob (with rows)

GET    /api/imports/:id/rows
       Query: ?status=new|duplicate|all
       Response: ImportRow[]

PUT    /api/imports/:id/rows/:rowId
       Body: { categoryId?, merchantName?, amount?, status? }
       Response: ImportRow

DELETE /api/imports/:id/rows/:rowId
       Response: { message: "Deleted" }

POST   /api/imports/:id/confirm
       Response: { imported: number, skipped: number, duplicates: number }
       Side effect: Creates Transactions from ImportRows with status "new"

DELETE /api/imports/:id
       Response: { message: "Deleted" }
       Side effect: Cleans up ImportRows

GET    /api/imports
       Response: ImportJob[] (import history)
```

---

### Feature 5: Calendar Events

```
GET    /api/events
       Query: ?start=2026-01-01&end=2026-01-31&type=bill|income|custom
       Response: CalendarEvent[]

POST   /api/events
       Body: { title, description?, amount?, accountId?, categoryId?, date, endDate?, type, recurrence?, recurrenceInterval?, reminderBefore? }
       Response: CalendarEvent

PUT    /api/events/:id
       Body: { title?, amount?, date?, isCompleted?, ... }
       Response: CalendarEvent

DELETE /api/events/:id
       Response: { message: "Deleted" }

POST   /api/events/:id/complete
       Response: CalendarEvent (isCompleted: true)

GET    /api/events/upcoming
       Query: ?days=30
       Response: CalendarEvent[]
```

---

### Feature 6: Notifications

```
GET    /api/notifications
       Query: ?unread=true&page=1&limit=20
       Response: {
         notifications: Notification[],
         unreadCount: number,
         total: number
       }

PUT    /api/notifications/:id/read
       Response: Notification (isRead: true)

PUT    /api/notifications/read-all
       Response: { message: "All marked as read" }

DELETE /api/notifications/:id
       Response: { message: "Deleted" }

DELETE /api/notifications/read-all
       Response: { message: "All read notifications deleted" }
```

---

### Feature 7: Reports

```
GET    /api/reports
       Query: ?period=monthly|quarterly|yearly
       Response: Report[]

POST   /api/reports/generate
       Body: { period, startDate, endDate }
       Response: Report (with computed data)

GET    /api/reports/:id
       Response: Report (with data JSON)

GET    /api/reports/summary
       Query: ?period=monthly&month=1&year=2026
       Response: {
         income, expenses, savings, savingsRate,
         topCategory, largestExpense,
         categoryBreakdown[], dailyTrend[]
       }
```

---

### Feature 8: Tags

```
GET    /api/tags
       Response: Tag[]

POST   /api/tags
       Body: { name, color? }
       Response: Tag

PUT    /api/tags/:id
       Body: { name?, color? }
       Response: Tag

DELETE /api/tags/:id
       Response: { message: "Deleted" }

POST   /api/transactions/:id/tags
       Body: { tagIds: string[] }
       Response: Transaction (with tags)

DELETE /api/transactions/:id/tags/:tagId
       Response: { message: "Deleted" }
```

---

### Feature 9: Global Search

```
GET    /api/search
       Query: ?q=starbucks&type=transaction|account|budget|goal|category|tag&limit=20
       Response: {
         results: [
           { type: "transaction", id, title, subtitle, amount, date, link },
           { type: "account", id, title, subtitle, link },
           ...
         ],
         counts: { transactions: 5, accounts: 2, budgets: 1 }
       }
```

---

### Feature 10: Enhanced Stats

```
GET    /api/stats (updated)
       Response: {
         // existing fields...
         totalBalance, monthlyIncome, monthlyExpenses,
         categoryData, monthlyTrend, recentTransactions,
         accountCount, transactionCount,

         // new fields
         savingsRate: number,
         netWorth: number,
         budgetOverview: { total, spent, percentage } | null,
         goalProgress: { total, current, percentage } | null,
         upcomingBills: CalendarEvent[],
         unreadNotifications: number,
         financialHealthScore: number  // computed 0-100
       }
```

---

## Data Flow Diagrams

### Budget Flow
```
User creates budget → Budget + BudgetItem records
User adds transaction → Transaction record
Dashboard queries: BudgetItem.amount vs SUM(Transaction.amount) WHERE categoryId = ? AND date IN month
Progress bar: percentage = spent / amount
Status: green (<80%), yellow (80-100%), red (>100%)
```

### Goal Flow
```
User creates goal → Goal record (currentSaved = 0)
User adds contribution → GoalContribution record + Goal.currentSaved += amount
Dashboard: Progress ring = currentSaved / targetAmount
Estimated completion: currentSaved / monthlyTarget = months remaining
Goal reached: currentSaved >= targetAmount → status = "completed"
```

### Import Flow
```
User uploads CSV → ImportJob (status: pending)
System parses → ImportRow records (status: new or duplicate)
Duplicate detection: Match (amount, date, accountId, description) against existing Transactions
User previews → Can edit categories, merchants, amounts, skip rows
User confirms → Create Transaction records from ImportRows, update counts
Cleanup → Optionally delete ImportRows after import
```

### Recurring Transaction Flow
```
User creates rule → RecurringRule (nextRunDate = startDate)
Cron job runs daily → Find rules WHERE isActive AND nextRunDate <= now()
For each rule:
  1. Create Transaction record
  2. Update RecurringRule.lastRunDate = now()
  3. Calculate nextRunDate based on frequency + interval
  4. If nextRunDate > endDate → set isActive = false
```

### Report Generation Flow
```
User requests report → Check if cached Report exists
If not cached → Compute from Transactions:
  - Sum income/expense by period
  - Group by category
  - Daily trend
  - Budget performance (if budgets exist)
  - Goal progress (if goals exist)
Save to Report table → Return to user
```

### Notification Generation Flow
```
Events that trigger notifications:
1. Budget exceeded → Create Notification (type: budget)
2. Goal reached → Create Notification (type: goal)
3. Bill due tomorrow → Create Notification (type: bill)
4. Monthly report ready → Create Notification (type: report)
5. Import completed → Create Notification (type: import)

Notifications are created by background jobs or during relevant API calls.
```

---

## Migration Strategy

### Order of Implementation

1. **Tags** (simplest, no dependencies)
   - Add Tag + TransactionTag models
   - Add tag relations to Transaction
   - Simple CRUD API

2. **Recurring Rules** (no dependencies)
   - Add RecurringRule model
   - Add recurringRuleId to Transaction
   - CRUD + cron processing

3. **Budgets** (depends on existing Category + Transaction)
   - Add Budget + BudgetItem models
   - CRUD + overview endpoint
   - Budget status calculation

4. **Goals** (depends on nothing new)
   - Add Goal + GoalContribution models
   - CRUD + contributions + overview

5. **Calendar Events** (depends on Account + Category)
   - Add CalendarEvent model
   - CRUD + upcoming endpoint

6. **Statement Import** (depends on Account + Category)
   - Add ImportJob + ImportRow models
   - CSV parsing, duplicate detection, import

7. **Notifications** (depends on all above features)
   - Add Notification model
   - CRUD + background generation

8. **Reports** (depends on all above features)
   - Add Report model
   - Generation + caching

9. **Global Search** (depends on all models)
   - Cross-model search endpoint

10. **Dashboard Improvements** (depends on all above)
    - Enhanced stats endpoint
    - New dashboard widgets

### Prisma Migration Steps

```bash
# 1. Update schema.prisma with all new models
# 2. Generate migration
npx prisma migrate dev --name phase2
# 3. Generate client
npx prisma generate
# 4. Push to Turso (production)
npx prisma db push
```

---

## Future-Proofing Notes

### Easy to Add Later (No Schema Changes)
- **AI Insights**: Compute from existing data (transactions, budgets, goals)
- **Investment Tracking**: Add Investment model + InvestmentTransaction (similar to Transaction)
- **Bank Integrations**: ImportJob already supports CSV; add Plaid/Mint adapter that feeds into same ImportJob flow
- **Multi-currency**: Add Currency model, link to Account, convert in reports
- **Shared budgets**: Add BudgetMember junction table
- **Export**: Use Report data or compute fresh from Transactions

### Schema Extensions (Minimal Impact)
- **Attachments**: Add Attachment model linked to Transaction (receipts, invoices)
- **Notes**: Add Note model linked to any entity (polymorphic via entityType + entityId)
- **Custom fields**: Add CustomField model (entityType, entityId, key, value)
- **Audit log**: Add AuditLog model (userId, action, entityType, entityId, changes JSON)

### Architecture Decisions
- **JSON fields for computed data**: Report.data uses JSON string for flexibility
- **No foreign keys for computed fields**: Budget spent amount is computed, not stored
- **Soft deletes not used**: Keep consistent with Phase 1 (hard deletes)
- **No pagination in Phase 2**: Add later with cursor-based pagination
- **SQLite compatible**: All models use types supported by SQLite via Prisma
