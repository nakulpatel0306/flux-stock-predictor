/**
 * Training samples, time-ordered train/holdout split and shared model math
 * Every model trains on the same rows so their outputs can be blended and scored together
 */

import type { HoldoutMetrics } from '@/types';
import { normalizeFeatures } from '@/features/feature-engineering';
import { calculateTechnicalIndicators } from '@/features/technical-indicators';

// Days of history before the first sample, so indicators like SMA20 and RSI14 are warmed up
const WARMUP_DAYS = 20;
export const RETURN_WINDOW = 10;
// Most recent share of samples held out for evaluation
const HOLDOUT_FRACTION = 0.2;
// Below this many held-out days, accuracy is too noisy to show
export const MIN_HOLDOUT_SAMPLES = 20;

export interface Sample {
  // The 8 indicator features as of the day's close
  features: number[];
  // The last RETURN_WINDOW daily returns up to and including the day
  recentReturns: number[];
  // Return from this close to the next; NaN for the latest day, which has no next close yet
  nextReturn: number;
}

/** A trained model's probability that the next close is higher, for each sample */
export interface DirectionModel {
  predictUp(samples: Sample[]): Promise<number[]>;
  dispose(): void;
}

function sampleAt(prices: number[], volumes: number[], returns: number[], i: number): Sample {
  // Indicators only see prices up to day i, so features never peek at the label
  const indicators = calculateTechnicalIndicators(prices.slice(0, i + 1), volumes.slice(0, i + 1));
  return {
    features: normalizeFeatures(indicators, prices[i]),
    recentReturns: returns.slice(i - RETURN_WINDOW, i),
    nextReturn: i + 1 < prices.length ? returns[i] : NaN,
  };
}

/**
 * Build labelled samples for every day with a known next close, plus the latest day to forecast.
 * returns[k] is the move from prices[k] to prices[k + 1].
 */
export function buildSamples(prices: number[], volumes: number[]): { labelled: Sample[]; latest: Sample } {
  const returns = prices.slice(1).map((price, k) => (price - prices[k]) / prices[k]);
  const labelled: Sample[] = [];
  for (let i = WARMUP_DAYS; i < prices.length - 1; i++) {
    labelled.push(sampleAt(prices, volumes, returns, i));
  }
  return { labelled, latest: sampleAt(prices, volumes, returns, prices.length - 1) };
}

/** Time-ordered split: the most recent samples are held out, nothing is shuffled across the boundary */
export function splitHoldout(samples: Sample[]): { train: Sample[]; holdout: Sample[] } {
  const holdoutSize = Math.round(samples.length * HOLDOUT_FRACTION);
  const cut = samples.length - holdoutSize;
  return { train: samples.slice(0, cut), holdout: samples.slice(cut) };
}

export function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function std(values: number[]): number {
  const m = mean(values);
  return Math.sqrt(values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length) || 1;
}

/** Per-feature z-scores fitted on training rows only, so holdout statistics don't leak in */
export function fitScaler(rows: number[][]): (row: number[]) => number[] {
  const columns = rows[0].map((_, j) => rows.map(row => row[j]));
  const means = columns.map(mean);
  const stds = columns.map(std);
  return row => row.map((v, j) => (v - means[j]) / stds[j]);
}

/** Standard normal CDF (Abramowitz and Stegun 7.1.26) */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const erf = 1 - poly * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

/**
 * Turn a predicted return into P(up), treating the model's training residuals as normal noise.
 * A forecast that is small next to the model's usual error lands near 50%.
 */
export function returnToUpProbability(predictedReturn: number, residualStd: number): number {
  return normalCdf(predictedReturn / residualStd);
}

/**
 * Expected next-day return from P(up) and the stock's recent average up and down day sizes,
 * so the magnitude comes from moves the stock actually makes rather than a model's raw output
 */
export function expectedReturnFromProbability(upProbability: number, prices: number[], lookback: number = 60): number {
  const recent = prices.slice(-(lookback + 1));
  const returns = recent.slice(1).map((price, k) => (price - recent[k]) / recent[k]);
  const ups = returns.filter(r => r > 0);
  const downs = returns.filter(r => r < 0).map(r => -r);
  const avgUp = ups.length ? mean(ups) : 0;
  const avgDown = downs.length ? mean(downs) : 0;
  return upProbability * avgUp - (1 - upProbability) * avgDown;
}

/** Directional scores of P(up) predictions against what actually happened, "up" as the positive class */
export function scoreDirection(upProbabilities: number[], samples: Sample[], trainSamples: number): HoldoutMetrics {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  samples.forEach((sample, k) => {
    const predictedUp = upProbabilities[k] > 0.5;
    const actualUp = sample.nextReturn > 0;
    if (predictedUp && actualUp) tp++;
    else if (predictedUp) fp++;
    else if (actualUp) fn++;
    else tn++;
  });
  const n = samples.length;
  const pct = (value: number) => Math.round(value * 1000) / 10;
  return {
    samples: n,
    trainSamples,
    accuracy: pct((tp + tn) / n),
    precision: tp + fp > 0 ? pct(tp / (tp + fp)) : null,
    recall: tp + fn > 0 ? pct(tp / (tp + fn)) : null,
    baselineAccuracy: pct((tp + fn) / n),
  };
}
