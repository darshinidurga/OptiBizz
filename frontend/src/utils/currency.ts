// currency.ts — Global currency configuration and formatting utilities

export interface CurrencyOption {
  code: string
  symbol: string
  label: string
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (CA$) - Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) - Australian Dollar' },
]

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
}

export function getCurrencySymbol(code: string = 'USD'): string {
  return CURRENCY_SYMBOLS[code] || '$'
}

export function formatCurrency(amount: number, currencyCode: string = 'USD', decimals: number = 0): string {
  const sym = getCurrencySymbol(currencyCode)
  const isNegative = amount < 0
  const absAmount = Math.abs(amount)
  
  const formatted = decimals > 0
    ? absAmount.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(absAmount).toLocaleString('en-US')
    
  return isNegative ? `-${sym}${formatted}` : `${sym}${formatted}`
}

