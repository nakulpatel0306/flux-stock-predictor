/**
 * ML Models Index
 * Exports the ensemble entry point and the individual model trainers
 */

import type { PredictionResult } from '@/types';
import { predictWithEnsemble } from './ensemble.model';

/**
 * Main ML prediction function. The ensemble already tolerates individual models failing to train.
 */
export async function makeMLPrediction(
  prices: number[],
  volumes: number[] = [],
  currentPrice: number
): Promise<PredictionResult> {
  // Ensure minimum data requirements
  if (prices.length < 50) {
    throw new Error('Insufficient data for ML prediction (need at least 50 data points)');
  }

  return predictWithEnsemble(prices, volumes, currentPrice);
}

export { trainNeuralNetwork } from './neural-network.model';
export { trainTimeSeries } from './time-series.model';
export { trainRegression } from './regression.model';
export { predictWithEnsemble } from './ensemble.model';
export { MIN_HOLDOUT_SAMPLES } from './dataset';
