/**
 * Stock Data Service
 * Fetches daily price history, falling back across sources and transports:
 * each source is tried through the local Vite proxy first, then public CORS proxies
 */

import type { HistoryPeriod, StockDataPoint } from '@/types';
import { PRICE_SOURCES, SymbolNotFoundError, type PriceSource } from './price-sources';

const REQUEST_TIMEOUT_MS = 8000;

type Transport = (source: PriceSource, path: string) => string;

// Served by `npm run dev` and `npm run preview`; on a static host this 404s and we move on
const localProxy: Transport = (source, path) => `${source.proxyPrefix}${path}`;

const PUBLIC_PROXIES: Record<string, Transport> = {
  allorigins: (source, path) => `https://api.allorigins.win/raw?url=${encodeURIComponent(source.origin + path)}`,
  'cors.lol': (source, path) => `https://api.cors.lol/?url=${encodeURIComponent(source.origin + path)}`,
  codetabs: (source, path) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(source.origin + path)}`,
};

export class PriceDataUnavailableError extends Error {}

type Attempt = StockDataPoint[] | 'not-found';

/** Fetch and JSON-parse, ignoring HTTP status: sources report bad tickers in error bodies */
async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`HTTP ${response.status}`);
  }
}

async function attempt(source: PriceSource, path: string, name: string, transport: Transport): Promise<Attempt> {
  try {
    const points = source.parse(await fetchJson(transport(source, path)));
    if (points.length === 0) throw new Error('no price rows');
    return points;
  } catch (error) {
    if (error instanceof SymbolNotFoundError) return 'not-found';
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${source.name} via ${name}: ${reason}`);
  }
}

/** Resolves with the first attempt to succeed; rejects with every failure if none do */
function firstSuccess(attempts: Promise<Attempt>[]): Promise<Attempt> {
  return new Promise((resolve, reject) => {
    const failures: string[] = [];
    for (const pending of attempts) {
      pending.then(resolve, (error: Error) => {
        failures.push(error.message);
        if (failures.length === attempts.length) reject(failures);
      });
    }
  });
}

/** Resolves with price points, or null if every path says the ticker doesn't exist */
async function fetchFromSource(
  source: PriceSource,
  symbol: string,
  period: HistoryPeriod,
  failures: string[]
): Promise<StockDataPoint[] | null> {
  let notFound = true;

  for (const path of source.paths(symbol, period)) {
    let result: Attempt;
    try {
      result = await attempt(source, path, 'local proxy', localProxy);
    } catch (error) {
      failures.push((error as Error).message);
      try {
        // Raced rather than tried in turn so a static host doesn't wait out each dead proxy
        result = await firstSuccess(
          Object.entries(PUBLIC_PROXIES).map(([name, transport]) => attempt(source, path, name, transport))
        );
      } catch (proxyFailures) {
        failures.push(...(proxyFailures as string[]));
        notFound = false;
        continue;
      }
    }
    if (result !== 'not-found') return result;
  }

  return notFound ? null : [];
}

/**
 * Fetch daily price history, oldest first.
 * Throws SymbolNotFoundError if every source rejects the ticker, and
 * PriceDataUnavailableError if no source could be reached.
 */
export async function fetchStockHistory(
  symbol: string,
  period: HistoryPeriod
): Promise<StockDataPoint[]> {
  const ticker = symbol.trim().toUpperCase();
  const failures: string[] = [];
  const rejectedBy: string[] = [];
  const unreachable: string[] = [];

  for (const source of PRICE_SOURCES) {
    const points = await fetchFromSource(source, ticker, period, failures);
    if (points === null) {
      rejectedBy.push(source.name);
    } else if (points.length > 0) {
      return points;
    } else {
      unreachable.push(source.name);
    }
  }

  if (unreachable.length === 0) {
    throw new SymbolNotFoundError(`No price history found for "${ticker}". Check the ticker symbol.`);
  }

  console.warn(`Price history fetch failed for ${ticker}:\n${failures.join('\n')}`);
  const rejected = rejectedBy.length > 0 ? ` ${rejectedBy.join(' and ')} had no data for it, and` : '';
  // On the Vite server the local proxy already ran, so the hint only helps static-host visitors
  const hint = import.meta.env?.PROD
    ? ' Running the app locally (npm run dev) is the most reliable option, since requests go through its built-in proxy.'
    : '';
  throw new PriceDataUnavailableError(
    `Couldn't load price history for ${ticker}.${rejected} ${unreachable.join(' and ')} ` +
      `${unreachable.length > 1 ? 'are' : 'is'} unreachable or rate limiting right now. ` +
      `Wait a minute and try again.${hint}`
  );
}

/**
 * Convert timeframe string to a history period
 */
export function timeframeToPeriod(timeframe: string): HistoryPeriod {
  const mapping: Record<string, HistoryPeriod> = {
    '1M': '1mo',
    '3M': '3mo',
    '6M': '6mo',
    '1Y': '1y',
  };
  return mapping[timeframe] || '1mo';
}
