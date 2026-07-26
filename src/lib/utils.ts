import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
]

export function getCurrency(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("finos_currency") || "INR"
  }
  return "INR"
}

export function setCurrency(code: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("finos_currency", code)
  }
}

export function formatCurrency(amount: number, currency?: string): string {
  const cur = currency || getCurrency()
  const info = CURRENCIES.find((c) => c.code === cur) || CURRENCIES[0]
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: cur,
    minimumFractionDigits: cur === "JPY" ? 0 : 2,
    maximumFractionDigits: cur === "JPY" ? 0 : 2,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
