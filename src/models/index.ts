/**
 * ML Models Index
 * Exports all prediction models and main prediction function
 */

import type { PredictionResult, TechnicalIndicators } from '@/types';
import { predictWithEnsemble } from './ensemble.model';
import { predictWithNeuralNetwork } from './neural-network.model';
import { predictWithTimeSeries } from './time-series.model';
import { predictWithRegression } from './regression.model';

/**
 * Main ML prediction function - uses ensemble by default
 * Falls back to individual models if ensemble fails
 */
export async function makeMLPrediction(
  prices: number[],
  volumes: number[] = [],
  currentPrice: number,
  indicators: TechnicalIndicators,
  useEnsemble: boolean = true
): Promise<PredictionResult> {
  // Ensure minimum data requirements
  if (prices.length < 50) {
    throw new Error('Insufficient data for ML prediction (need at least 50 data points)');
  }
  
  try {
    // Try ensemble first (most accurate)
    if (useEnsemble) {
      return await predictWithEnsemble(prices, volumes, currentPrice, indicators);
    }
    
    // Otherwise use neural network (best single model)
    return await predictWithNeuralNetwork(prices, volumes, currentPrice, indicators);
  } catch (error) {
    console.error('ML prediction error, trying fallback models...', error);
    
    // Fallback to individual models
    try {
      return await predictWithNeuralNetwork(prices, volumes, currentPrice, indicators);
    } catch (nnError) {
      try {
        return await predictWithTimeSeries(prices, volumes, currentPrice, indicators);
      } catch (tsError) {
        return await predictWithRegression(prices, volumes, currentPrice, indicators);
      }
    }
  }
}

// Export individual models for advanced usage
export { predictWithNeuralNetwork } from './neural-network.model';
export { predictWithTimeSeries } from './time-series.model';
export { predictWithRegression } from './regression.model';
export { predictWithEnsemble } from './ensemble.model';

