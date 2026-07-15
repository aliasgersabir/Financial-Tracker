import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Create default categories
    const defaultCategories = [
      { name: "Food & Dining", type: "expense", icon: "🍔", color: "#f97316" },
      { name: "Transportation", type: "expense", icon: "🚗", color: "#3b82f6" },
      { name: "Shopping", type: "expense", icon: "🛍️", color: "#ec4899" },
      { name: "Entertainment", type: "expense", icon: "🎬", color: "#8b5cf6" },
      { name: "Bills & Utilities", type: "expense", icon: "💡", color: "#f59e0b" },
      { name: "Health", type: "expense", icon: "🏥", color: "#10b981" },
      { name: "Education", type: "expense", icon: "📚", color: "#06b6d4" },
      { name: "Other", type: "expense", icon: "📦", color: "#6b7280" },
      { name: "Salary", type: "income", icon: "💰", color: "#10b981" },
      { name: "Freelance", type: "income", icon: "💻", color: "#3b82f6" },
      { name: "Investment", type: "income", icon: "📈", color: "#8b5cf6" },
      { name: "Other Income", type: "income", icon: "💵", color: "#f59e0b" },
    ]

    await prisma.category.createMany({
      data: defaultCategories.map((cat) => ({
        ...cat,
        userId: user.id,
      })),
    })

    // Create a default account
    await prisma.account.create({
      data: {
        name: "Main Account",
        type: "checking",
        balance: 0,
        color: "#6366f1",
        userId: user.id,
      },
    })

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
