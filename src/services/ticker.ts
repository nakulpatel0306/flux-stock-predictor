/**
 * Ticker validation and per-source symbol formats
 * Share classes are written BRK.B, BRK-B or BRK/B; non-US listings carry a Yahoo
 * exchange suffix such as SHOP.TO. Nasdaq wants "BRK.B", Yahoo wants "BRK-B" and "SHOP.TO".
 */

// A root of 1-6 letters/digits, optionally followed by one class or exchange suffix
const TICKER_PATTERN = /^[A-Z0-9]{1,6}(?:[.\-/][A-Z0-9]{1,4})?$/;

// Yahoo Finance exchange suffixes; any other suffix is treated as a share class
const EXCHANGE_SUFFIXES = new Set([
  'TO', 'V', 'CN', 'NE', 'L', 'IL', 'AX', 'NZ', 'HK', 'T', 'SS', 'SZ', 'KS', 'KQ', 'TW', 'SI', 'BO', 'NS',
  'DE', 'F', 'PA', 'AS', 'BR', 'MI', 'MC', 'LS', 'SW', 'VI', 'ST', 'OL', 'CO', 'HE', 'IR', 'SA', 'MX',
]);

export const TICKER_HINT = 'Use a symbol like AAPL, BRK.B or SHOP.TO';

/** Uppercased ticker, or null if it can't be a symbol either source serves */
export function normalizeTicker(input: string): string | null {
  const ticker = input.trim().toUpperCase();
  return TICKER_PATTERN.test(ticker) ? ticker : null;
}

function split(ticker: string): { root: string; suffix: string | null; separator: string | null } {
  const match = ticker.match(/^([A-Z0-9]+)(?:([.\-/])([A-Z0-9]+))?$/);
  if (!match) return { root: ticker, suffix: null, separator: null };
  return { root: match[1], suffix: match[3] ?? null, separator: match[2] ?? null };
}

function isExchangeListing(ticker: string): boolean {
  const { suffix, separator } = split(ticker);
  return separator === '.' && suffix !== null && EXCHANGE_SUFFIXES.has(suffix);
}

/** Nasdaq symbol, or null for non-US listings it doesn't carry */
export function nasdaqSymbol(ticker: string): string | null {
  if (isExchangeListing(ticker)) return null;
  const { root, suffix } = split(ticker);
  return suffix ? `${root}.${suffix}` : root;
}

export function yahooSymbol(ticker: string): string {
  if (isExchangeListing(ticker)) return ticker;
  const { root, suffix } = split(ticker);
  return suffix ? `${root}-${suffix}` : root;
}
