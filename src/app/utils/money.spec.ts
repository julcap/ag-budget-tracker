import { currencySymbol, formatMoney } from './money';

describe('money utils', () => {
  it('formats with the currency symbol and a sign only when asked', () => {
    expect(formatMoney(1234.5, 'USD')).toBe('$1,234.50');
    expect(formatMoney(-12, 'USD')).toBe('-$12.00');
    expect(formatMoney(12, 'EUR', true)).toBe('+€12.00');
    expect(formatMoney(0, 'USD', true)).toBe('$0.00');
  });

  it('exposes the narrow symbol for the amount input prefix', () => {
    expect(currencySymbol('USD')).toBe('$');
    expect(currencySymbol('EUR')).toBe('€');
    expect(currencySymbol('DKK')).toBe('kr');
  });
});
