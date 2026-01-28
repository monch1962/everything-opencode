#!/usr/bin/env node
/**
 * Parameter Handler Module for PineOptimizer
 *
 * Parameter handling methods: parseParameterSpace, generateGridCombinations, generateRandomParameters, createParameterizedStrategy
 */

const fs = require('fs');
const path = require('path');

class ParameterHandler {
  constructor() {
    // No initialization needed
  }

  /**
   * Parse parameter space specification
   */
  parseParameterSpace(paramSpec) {
    const paramSpace = {};

    if (!paramSpec) {
      return paramSpace;
    }

    // Format: "param1:min-max-step,param2:min-max-step"
    const params = paramSpec.split(',');

    for (const param of params) {
      const [name, rangeSpec] = param.split(':');
      if (!rangeSpec) continue;

      const rangeParts = rangeSpec.split('-');
      if (rangeParts.length < 2) continue;

      const min = parseFloat(rangeParts[0]);
      const max = parseFloat(rangeParts[1]);
      const step = rangeParts.length > 2 ? parseFloat(rangeParts[2]) : 1;

      if (isNaN(min) || isNaN(max) || isNaN(step)) {
        console.warn(`Invalid parameter range for ${name}: ${rangeSpec}`);
        continue;
      }

      paramSpace[name.trim()] = { min, max, step };
    }

    return paramSpace;
  }

  /**
   * Generate grid combinations for parameter space
   */
  generateGridCombinations(paramSpace, maxCombinations = 1000) {
    const paramNames = Object.keys(paramSpace);
    if (paramNames.length === 0) {
      return [];
    }

    // Calculate total combinations
    let totalCombinations = 1;
    const paramValues = {};

    for (const param of paramNames) {
      const { min, max, step } = paramSpace[param];
      const values = [];

      for (let value = min; value <= max; value += step) {
        values.push(Number(value.toFixed(6)));
      }

      paramValues[param] = values;
      totalCombinations *= values.length;
    }

    console.log(`📊 Total possible combinations: ${totalCombinations}`);

    // If too many combinations, sample the space
    if (totalCombinations > maxCombinations) {
      console.log(
        `⚠️ Too many combinations (${totalCombinations}), sampling ${maxCombinations} points`
      );
      return this.sampleParameterSpace(paramSpace, maxCombinations);
    }

    // Generate all combinations
    const combinations = [];
    const generate = (current, index) => {
      if (index === paramNames.length) {
        combinations.push({ ...current });
        return;
      }

      const param = paramNames[index];
      for (const value of paramValues[param]) {
        current[param] = value;
        generate(current, index + 1);
      }
    };

    generate({}, 0);
    return combinations;
  }

  /**
   * Sample parameter space (for large spaces)
   */
  sampleParameterSpace(paramSpace, sampleCount) {
    const samples = [];
    const paramNames = Object.keys(paramSpace);

    for (let i = 0; i < sampleCount; i++) {
      const sample = {};
      for (const param of paramNames) {
        const { min, max, step } = paramSpace[param];
        const steps = Math.floor((max - min) / step) + 1;
        const randomStep = Math.floor(Math.random() * steps);
        sample[param] = Number((min + randomStep * step).toFixed(6));
      }
      samples.push(sample);
    }

    return samples;
  }

  /**
   * Generate random parameters from parameter space
   */
  generateRandomParameters(paramSpace) {
    const params = {};

    for (const [param, { min, max, step }] of Object.entries(paramSpace)) {
      const steps = Math.floor((max - min) / step) + 1;
      const randomStep = Math.floor(Math.random() * steps);
      params[param] = Number((min + randomStep * step).toFixed(6));
    }

    return params;
  }

  /**
   * Create parameterized strategy file
   */
  createParameterizedStrategy(originalFile, params) {
    try {
      const content = fs.readFileSync(originalFile, 'utf8');
      let modified = content;

      // Replace parameter values in the code
      for (const [param, value] of Object.entries(params)) {
        // Look for input declarations
        const inputRegex = new RegExp(
          `(${param}\\s*=\\s*input\\.\\w+\\([^)]+)defval\\s*=\\s*[^,)]+`,
          'g'
        );
        modified = modified.replace(inputRegex, `$1defval = ${value}`);

        // Also replace simple assignments
        const assignRegex = new RegExp(`(${param}\\s*=\\s*)[^\\s,;]+`, 'g');
        modified = modified.replace(assignRegex, `$1${value}`);
      }

      // Create temporary file
      const tempDir = path.join(path.dirname(originalFile), '.optimization');
      fs.mkdirSync(tempDir, { recursive: true });

      const tempFile = path.join(
        tempDir,
        `${path.basename(originalFile, '.pine')}_${Date.now()}.pine`
      );

      fs.writeFileSync(tempFile, modified);
      return tempFile;
    } catch (error) {
      console.error(`Failed to create parameterized strategy: ${error.message}`);
      return originalFile;
    }
  }

  /**
   * Calculate parameter space size
   */
  calculateParameterSpaceSize(paramSpace) {
    let totalCombinations = 1;

    for (const { min, max, step } of Object.values(paramSpace)) {
      const steps = Math.floor((max - min) / step) + 1;
      totalCombinations *= steps;
    }

    return totalCombinations;
  }

  /**
   * Get parameter statistics
   */
  getParameterStatistics(paramSpace) {
    const stats = {
      totalParams: Object.keys(paramSpace).length,
      paramDetails: {},
      totalCombinations: this.calculateParameterSpaceSize(paramSpace),
    };

    for (const [param, { min, max, step }] of Object.entries(paramSpace)) {
      const steps = Math.floor((max - min) / step) + 1;
      stats.paramDetails[param] = {
        min,
        max,
        step,
        steps,
        range: max - min,
      };
    }

    return stats;
  }

  /**
   * Validate parameter space
   */
  validateParameterSpace(paramSpace) {
    const errors = [];

    for (const [param, { min, max, step }] of Object.entries(paramSpace)) {
      if (isNaN(min) || isNaN(max) || isNaN(step)) {
        errors.push(`Invalid numeric values for parameter ${param}`);
        continue;
      }

      if (min > max) {
        errors.push(`Parameter ${param}: min (${min}) > max (${max})`);
      }

      if (step <= 0) {
        errors.push(`Parameter ${param}: step (${step}) must be positive`);
      }

      if (step > max - min) {
        errors.push(`Parameter ${param}: step (${step}) larger than range (${max - min})`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format parameter space for display
   */
  formatParameterSpace(paramSpace) {
    const lines = [];
    for (const [param, { min, max, step }] of Object.entries(paramSpace)) {
      const steps = Math.floor((max - min) / step) + 1;
      lines.push(`  ${param}: ${min} to ${max} (step: ${step}, values: ${steps})`);
    }
    return lines.join('\n');
  }
}

module.exports = ParameterHandler;
