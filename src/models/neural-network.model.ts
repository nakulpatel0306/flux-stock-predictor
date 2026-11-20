/**
 * Neural Network Model for Stock Prediction
 * Multi-layer perceptron using TensorFlow.js
 * Classifies next-day direction from the 8 indicator features
 */

import * as tf from '@tensorflow/tfjs';
import { fitScaler, type DirectionModel, type Sample } from './dataset';

// Fixed seeds and unshuffled batches make a given price history always train to the same model
const SEED = 42;

/**
 * Create a neural network for binary classification
 * Architecture: Dense layers with dropout for regularization
 */
function createNeuralNetwork(inputSize: number): tf.Sequential {
  const init = (offset: number) => tf.initializers.glorotUniform({ seed: SEED + offset });
  const model = tf.sequential({
    layers: [
      // Input layer: 32 neurons with ReLU activation
      tf.layers.dense({ inputShape: [inputSize], units: 32, activation: 'relu', kernelInitializer: init(0) }),
      tf.layers.dropout({ rate: 0.2, seed: SEED }), // Prevent overfitting

      // Hidden layer 1: 16 neurons
      tf.layers.dense({ units: 16, activation: 'relu', kernelInitializer: init(1) }),
      tf.layers.dropout({ rate: 0.2, seed: SEED + 1 }),

      // Hidden layer 2: 8 neurons
      tf.layers.dense({ units: 8, activation: 'relu', kernelInitializer: init(2) }),

      // Output layer: 1 neuron with sigmoid (probability the next close is higher)
      tf.layers.dense({ units: 1, activation: 'sigmoid', kernelInitializer: init(3) }),
    ],
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'binaryCrossentropy',
  });

  return model;
}

/**
 * Train the classifier on the training samples
 */
export async function trainNeuralNetwork(train: Sample[]): Promise<DirectionModel> {
  if (train.length < 10) {
    throw new Error('Insufficient training data');
  }

  const scale = fitScaler(train.map(s => s.features));
  const model = createNeuralNetwork(train[0].features.length);

  const xs = tf.tensor2d(train.map(s => scale(s.features)));
  const ys = tf.tensor1d(train.map(s => (s.nextReturn > 0 ? 1 : 0)));
  try {
    await model.fit(xs, ys, { epochs: 50, batchSize: 32, shuffle: false, verbose: 0 });
  } finally {
    xs.dispose();
    ys.dispose();
  }

  return {
    async predictUp(samples) {
      const output = tf.tidy(() => model.predict(tf.tensor2d(samples.map(s => scale(s.features)))) as tf.Tensor);
      const values = Array.from(await output.data());
      output.dispose();
      return values;
    },
    dispose: () => model.dispose(),
  };
}
