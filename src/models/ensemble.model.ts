/**
 * Ensemble Model for Stock Prediction
 * Combines multiple models (Neural Network, Time Series, Regression)
 * Uses weighted average for more accurate predictions
 */

import type { PredictionResult, TechnicalIndicators } from '@/types';
import { predictWithNeuralNetwork } from './neural-network.model';
import { predictWithTimeSeries } from './time-series.model';
import { predictWithRegression } from './regression.model';

/**
 * Ensemble prediction combining multiple models
 * Weights: Neural Network (50%), Time Series (30%), Regression (20%)
 */
export async function predictWithEnsemble(
  prices: number[],
  volumes: number[],
  currentPrice: number,
  indicators: TechnicalIndicators
): Promise<PredictionResult> {
  const results: Array<{ result: PredictionResult; weight: number }> = [];
  
  // Run all models in parallel for speed
  const modelPromises = [
    // Neural Network: best for complex patterns, highest weight
    predictWithNeuralNetwork(prices, volumes, currentPrice, indicators)
      .then(result => ({ result, weight: 0.5 }))
      .catch(() => null),
    
    // Time Series: good for trends, medium weight
    predictWithTimeSeries(prices, volumes, currentPrice, indicators)
      .then(result => ({ result, weight: 0.3 }))
      .catch(() => null),
    
    // Regression: simple and interpretable, lower weight
    predictWithRegression(prices, volumes, currentPrice, indicators)
      .then(result => ({ result, weight: 0.2 }))
      .catch(() => null),
  ];
  
  // Wait for all models (or use fallbacks if they fail)
  const modelResults = await Promise.all(modelPromises);
  const validResults = modelResults.filter(r => r !== null) as Array<{ result: PredictionResult; weight: number }>;
  
  // If no models succeeded, throw error
  if (validResults.length === 0) {
    throw new Error('All ensemble models failed');
  }
  
  // Normalize weights (in case some models failed)
  const totalWeight = validResults.reduce((sum, r) => sum + r.weight, 0);
  validResults.forEach(r => r.weight = r.weight / totalWeight);
  
  // Weighted average of probabilities
  const weightedProbability = validResults.reduce((sum, r) => {
    return sum + (r.result.probability * r.weight);
  }, 0);
  
  // Weighted average of expected returns
  const weightedExpectedReturn = validResults.reduce((sum, r) => {
    return sum + (r.result.expectedReturn * r.weight);
  }, 0);
  
  // Average model accuracy
  const avgAccuracy = validResults.reduce((sum, r) => {
    return sum + (r.result.modelAccuracy * r.weight);
  }, 0);
  
  // Calculate next day price
  const nextDayPrice = currentPrice * (1 + weightedExpectedReturn / 100);
  
  // Determine direction and confidence
  const direction: 'up' | 'down' = weightedProbability > 50 ? 'up' : 'down';
  const confidence: 'high' | 'medium' | 'low' = 
    weightedProbability > 75 || weightedProbability < 25 ? 'high' :
    weightedProbability > 65 || weightedProbability < 35 ? 'medium' : 'low';
  
  return {
    direction,
    probability: Math.round(weightedProbability),
    expectedReturn: parseFloat(weightedExpectedReturn.toFixed(2)),
    confidence,
    modelAccuracy: Math.round(avgAccuracy),
    nextDayPrice: parseFloat(nextDayPrice.toFixed(2)),
  };
}

