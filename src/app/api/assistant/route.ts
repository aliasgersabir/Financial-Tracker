import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { question } = await request.json()
  const q = (question || "").toLowerCase()
  const userId = session.user.id
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const yearStart = new Date(now.getFullYear(), 0, 1)

  const [transactions, categories, accounts, goals, budgets, subscriptions] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: threeMonthsAgo } },
      include: { category: true, account: true },
      orderBy: { date: "desc" },
    }).catch(() => []),
    prisma.category.findMany({ where: { userId } }).catch(() => []),
    prisma.account.findMany({ where: { userId } }).catch(() => []),
    prisma.goal.findMany({ where: { userId, status: "active" } }).catch(() => []),
    prisma.budget.findMany({
      where: { userId, month: now.getMonth() + 1, year: now.getFullYear() },
      include: { items: { include: { category: true } } },
    }).catch(() => []),
    prisma.subscription.findMany({ where: { userId, isActive: true } }).catch(() => []),
  ])

  let answer = ""
  let suggestions: string[] = []
  let data: Record<string, unknown> = {}

  const currentMonthTx = transactions.filter(t => t.date >= monthStart)
  const lastMonthTx = transactions.filter(t => t.date >= lastMonthStart && t.date < monthStart)
  const yearTx = transactions.filter(t => t.date >= yearStart)

  const currentIncome = currentMonthTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const currentExpenses = currentMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const lastMonthExpenses = lastMonthTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  const spendingByCategory: Record<string, { name: string; amount: number; categoryId: string }> = {}
  currentMonthTx.filter(t => t.type === "expense").forEach(t => {
    const key = t.categoryId || "uncategorized"
    if (!spendingByCategory[key]) {
      spendingByCategory[key] = { name: t.category?.name || "Uncategorized", amount: 0, categoryId: key }
    }
    spendingByCategory[key].amount += t.amount
  })

  const sortedCategories = Object.values(spendingByCategory).sort((a, b) => b.amount - a.amount)

  if (q.includes("save") || q.includes("saving")) {
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome * 100).toFixed(1) : "0"
    answer = `Your current savings rate is ${savingsRate}%. `
    if (currentExpenses > 0 && sortedCategories.length > 0) {
      const topCat = sortedCategories[0]
      answer += `Your largest expense category is "${topCat.name}" at ${topCat.amount.toFixed(2)}. `
      const suggestedCut = Math.round(topCat.amount * 0.15)
      answer += `Reducing this by 15% (${suggestedCut.toFixed(2)}) would increase your savings rate.`
      suggestions.push(`Reduce ${topCat.name} spending by 15%`)
    }
    if (currentIncome > 0) {
      const target20 = currentIncome * 0.2
      const gap = target20 - (currentIncome - currentExpenses)
      if (gap > 0) {
        suggestions.push(`Cut ${gap.toFixed(2)} more in expenses to reach 20% savings rate`)
      } else {
        suggestions.push("You're already saving more than 20% — consider investing the surplus")
      }
    }
    data = { savingsRate: parseFloat(savingsRate), monthlyIncome: currentIncome, monthlyExpenses: currentExpenses }
  } else if (q.includes("increase") || q.includes("why") || q.includes("cause")) {
    const expDiff = currentExpenses - lastMonthExpenses
    const pctChange = lastMonthExpenses > 0 ? ((expDiff / lastMonthExpenses) * 100).toFixed(1) : "N/A"
    answer = `Your expenses ${expDiff >= 0 ? "increased" : "decreased"} by ${Math.abs(expDiff).toFixed(2)} (${pctChange}%) compared to last month. `
    const lastMonthByCategory: Record<string, number> = {}
    lastMonthTx.filter(t => t.type === "expense").forEach(t => {
      const key = t.categoryId || "uncategorized"
      lastMonthByCategory[key] = (lastMonthByCategory[key] || 0) + t.amount
    })
    const increases: { name: string; diff: number }[] = []
    sortedCategories.forEach(cat => {
      const last = lastMonthByCategory[cat.categoryId] || 0
      if (cat.amount > last) {
        increases.push({ name: cat.name, diff: cat.amount - last })
      }
    })
    increases.sort((a, b) => b.diff - a.diff)
    if (increases.length > 0) {
      answer += `The biggest increases: ${increases.slice(0, 3).map(i => `${i.name} (+${i.diff.toFixed(2)})`).join(", ")}.`
      increases.slice(0, 3).forEach(i => suggestions.push(`Review ${i.name} spending — increased by ${i.diff.toFixed(2)}`))
    }
    data = { currentExpenses, lastMonthExpenses, change: expDiff }
  } else if (q.includes("subscription") || q.includes("cancel")) {
    const subTotal = subscriptions.reduce((s, sub) => s + (sub.frequency === "yearly" ? sub.amount / 12 : sub.amount), 0)
    answer = `You have ${subscriptions.length} active subscriptions totaling ${subTotal.toFixed(2)}/month (${(subTotal * 12).toFixed(2)}/year). `
    const sorted = [...subscriptions].sort((a, b) => {
      const aM = a.frequency === "yearly" ? a.amount / 12 : a.amount
      const bM = b.frequency === "yearly" ? b.amount / 12 : b.amount
      return bM - aM
    })
    answer += `Most expensive: ${sorted.slice(0, 3).map(s => `${s.name} (${s.amount.toFixed(2)}/${s.frequency})`).join(", ")}.`
    sorted.slice(0, 3).forEach(s => suggestions.push(`Consider if "${s.name}" is still needed — ${(s.frequency === "yearly" ? s.amount / 12 : s.amount).toFixed(2)}/month`))
    data = { subscriptions: sorted.map(s => ({ name: s.name, amount: s.amount, frequency: s.frequency })), totalMonthly: subTotal }
  } else if (q.includes("goal") || q.includes("reach")) {
    if (goals.length === 0) {
      answer = "You don't have any active savings goals yet. Consider creating one to track your progress."
      suggestions.push("Create a savings goal to stay motivated")
    } else {
      const monthlySavings = currentIncome - currentExpenses
      answer = `You have ${goals.length} active goals. `
      goals.forEach(g => {
        const remaining = g.targetAmount - g.currentSaved
        const monthsLeft = monthlySavings > 0 ? Math.ceil(remaining / monthlySavings) : Infinity
        const pct = g.targetAmount > 0 ? ((g.currentSaved / g.targetAmount) * 100).toFixed(0) : "0"
        answer += `"${g.name}": ${pct}% complete. `
        if (monthsLeft !== Infinity) {
          answer += `At your current pace, you'll reach it in ${monthsLeft} months. `
          if (g.deadline && new Date(g.deadline) < new Date(now.getTime() + monthsLeft * 30 * 86400000)) {
            answer += `You're behind schedule for the deadline. `
            suggestions.push(`Increase monthly contribution to "${g.name}" to meet your deadline`)
          }
        } else {
          answer += `With current spending, you can't save for this goal. `
          suggestions.push(`Reduce expenses to start contributing to "${g.name}"`)
        }
      })
      data = { goals: goals.map(g => ({ name: g.name, target: g.targetAmount, saved: g.currentSaved })), monthlySavings }
    }
  } else if (q.includes("reduce") || q.includes("cut") || q.includes("category")) {
    answer = "Here are your top spending categories with potential for reduction: "
    sortedCategories.slice(0, 5).forEach(cat => {
      answer += `${cat.name}: ${cat.amount.toFixed(2)}. `
      suggestions.push(`Try to reduce "${cat.name}" by 10% (save ${(cat.amount * 0.1).toFixed(2)}/month)`)
    })
    data = { categories: sortedCategories.slice(0, 5) }
  } else if (q.includes("biggest") || q.includes("largest")) {
    const biggest = [...yearTx].filter(t => t.type === "expense").sort((a, b) => b.amount - a.amount).slice(0, 5)
    answer = `Your biggest expenses this year: `
    biggest.forEach((t, i) => {
      answer += `${i + 1}. ${t.description} — ${t.amount.toFixed(2)} (${t.date.toLocaleDateString()}). `
    })
    data = { biggestExpenses: biggest.map(t => ({ description: t.description, amount: t.amount, date: t.date })) }
  } else {
    answer = `Here's your financial summary:\n\n`
    answer += `Total Balance: ${totalBalance.toFixed(2)}\n`
    answer += `Monthly Income: ${currentIncome.toFixed(2)}\n`
    answer += `Monthly Expenses: ${currentExpenses.toFixed(2)}\n`
    answer += `Monthly Savings: ${(currentIncome - currentExpenses).toFixed(2)}\n`
    answer += `Active Goals: ${goals.length}\n`
    answer += `Active Subscriptions: ${subscriptions.length}\n\n`
    suggestions.push("Ask me about your spending patterns, savings, or how to optimize your finances")
    data = { totalBalance, monthlyIncome: currentIncome, monthlyExpenses: currentExpenses, savings: currentIncome - currentExpenses }
  }

  const references: { type: string; id: string; name: string }[] = []
  if (sortedCategories.length > 0) {
    sortedCategories.slice(0, 3).forEach(c => references.push({ type: "category", id: c.categoryId, name: c.name }))
  }
  goals.slice(0, 2).forEach(g => references.push({ type: "goal", id: g.id, name: g.name }))

  return NextResponse.json({ answer, data, suggestions, references })
  } catch (error) {
    console.error("Assistant API error:", error)
    return NextResponse.json(
      { answer: "I'm having trouble accessing your financial data right now. Please try again in a moment.", suggestions: [], data: {} },
      { status: 200 }
    )
  }
}
