export const CURRENCIES = ['USD', 'EUR', 'DKK'] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

function formatter(currency: CurrencyCode) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: 'narrowSymbol' });
}

/** Formats an amount; `signed` adds a leading `+` to positive values (negatives always get `-`). */
export function formatMoney(amount: number, currency: CurrencyCode, signed = false): string {
  const sign = amount < 0 ? '-' : signed && amount > 0 ? '+' : '';
  return sign + formatter(currency).format(Math.abs(amount));
}

export function currencySymbol(currency: CurrencyCode): string {
  return formatter(currency).formatToParts(0).find(part => part.type === 'currency')?.value ?? currency;
}
