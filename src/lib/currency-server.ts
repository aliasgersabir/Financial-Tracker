const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹", USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", AUD: "A$", AED: "د.إ"
}

export function formatCurrencyServer(amount: number, currency: string = "INR"): string {
  const symbol = CURRENCY_SYMBOLS[currency] || "₹"
  if (currency === "INR") {
    return `${symbol}${Math.round(amount).toLocaleString("en-IN")}`
  }
  return `${symbol}${amount.toFixed(2)}`
}
