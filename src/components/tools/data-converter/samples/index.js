// Import sample data directly as text from external files
import sampleJson from './sample.json?raw';
import sampleYaml from './sample.yaml?raw';
import sampleToml from './sample.toml?raw';

// Cache for loaded samples
let samplesCache = null;

/**
 * Load sample data from external files
 */
export function loadSampleData() {
  if (samplesCache) {
    return samplesCache;
  }

  const samples = {
    json: sampleJson,
    yaml: sampleYaml,
    toml: sampleToml
  };

  samplesCache = samples;
  return samples;
}

/**
 * Clear the samples cache (useful for development)
 */
export function clearSamplesCache() {
  samplesCache = null;
} 