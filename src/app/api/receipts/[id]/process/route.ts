import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SAMPLE_MERCHANTS = [
  "Amazon", "Walmart", "Target", "Costco", "Whole Foods",
  "Starbucks", "McDonald's", "Uber", "Shell", "Best Buy",
]

const SAMPLE_ITEMS = [
  { name: "Grocery items", price: 45.99 },
  { name: "Electronics", price: 129.99 },
  { name: "Coffee & snacks", price: 12.50 },
  { name: "Gas fill-up", price: 55.00 },
  { name: "Household supplies", price: 34.99 },
]

function simulateOCR(fileType: string) {
  const merchant = SAMPLE_MERCHANTS[Math.floor(Math.random() * SAMPLE_MERCHANTS.length)]
  const numItems = Math.floor(Math.random() * 3) + 1
  const items = SAMPLE_ITEMS.slice(0, numItems).map((item) => ({
    ...item,
    price: Math.round((item.price + (Math.random() - 0.5) * 20) * 100) / 100,
  }))

  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const taxRate = 0.08 + Math.random() * 0.04
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100

  const now = new Date()
  const receiptDate = new Date(now)
  receiptDate.setDate(receiptDate.getDate() - Math.floor(Math.random() * 7))

  const rawText = `${merchant}\n${receiptDate.toLocaleDateString()}\n${items.map((i) => `${i.name}: $${i.price.toFixed(2)}`).join("\n")}\nSubtotal: $${subtotal.toFixed(2)}\nTax: $${tax.toFixed(2)}\nTotal: $${total.toFixed(2)}`

  const confidence = 0.75 + Math.random() * 0.2

  return {
    merchant,
    date: receiptDate,
    subtotal,
    tax,
    total,
    items: JSON.stringify(items),
    rawText,
    confidence: Math.round(confidence * 100) / 100,
    rawResponse: JSON.stringify({
      source: "simulated_ocr",
      fileType,
      timestamp: now.toISOString(),
    }),
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const receipt = await prisma.receipt.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 })
  }

  if (receipt.status === "processed") {
    return NextResponse.json({ error: "Receipt already processed" }, { status: 400 })
  }

  const ocrResult = simulateOCR(receipt.fileType)

  const extraction = await prisma.oCRExtraction.create({
    data: {
      receiptId: receipt.id,
      merchant: ocrResult.merchant,
      date: ocrResult.date,
      subtotal: ocrResult.subtotal,
      tax: ocrResult.tax,
      total: ocrResult.total,
      items: ocrResult.items,
      confidence: ocrResult.confidence,
      rawResponse: ocrResult.rawResponse,
    },
  })

  await prisma.receipt.update({
    where: { id },
    data: {
      status: "processed",
      merchantName: ocrResult.merchant,
      totalAmount: ocrResult.total,
      taxAmount: ocrResult.tax,
      date: ocrResult.date,
      rawText: ocrResult.rawText,
    },
  })

  return NextResponse.json({
    extraction,
    receipt: {
      id: receipt.id,
      status: "processed",
      merchantName: ocrResult.merchant,
      totalAmount: ocrResult.total,
    },
  })
}
