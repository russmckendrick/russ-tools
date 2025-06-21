// Centralized PrismJS loader to avoid duplication across components
import Prism from 'prismjs';

// Track loaded languages to avoid duplicates
const loadedLanguages = new Set();

/**
 * Dynamically load PrismJS language components
 * @param {string|string[]} languages - Language(s) to load
 * @returns {Promise} Promise that resolves when languages are loaded
 */
export const loadPrismLanguages = async (languages) => {
  const languageArray = Array.isArray(languages) ? languages : [languages];
  const languagesToLoad = languageArray.filter(lang => !loadedLanguages.has(lang));
  
  if (languagesToLoad.length === 0) {
    return Promise.resolve();
  }

  const loadPromises = languagesToLoad.map(async (language) => {
    try {
      switch (language) {
        case 'json':
          await import('prismjs/components/prism-json');
          break;
        case 'yaml':
          await import('prismjs/components/prism-yaml');
          break;
        case 'toml':
          await import('prismjs/components/prism-toml');
          break;
        case 'hcl':
          await import('prismjs/components/prism-hcl');
          break;
        case 'kql':
          // KQL is custom, load from our custom definition
          await import('./prism-kql');
          break;
        default:
          console.warn(`Unknown language: ${language}`);
          return;
      }
      loadedLanguages.add(language);
    } catch (error) {
      console.error(`Failed to load PrismJS language: ${language}`, error);
    }
  });

  return Promise.all(loadPromises);
};

/**
 * Highlight code with PrismJS
 * @param {string} code - Code to highlight
 * @param {string} language - Language for highlighting
 * @returns {string} Highlighted HTML
 */
export const highlightCode = (code, language) => {
  if (!code || !language) return code;
  
  try {
    const grammar = Prism.languages[language];
    if (!grammar) {
      console.warn(`PrismJS grammar not found for language: ${language}`);
      return code;
    }
    
    return Prism.highlight(code, grammar, language);
  } catch (error) {
    console.error(`Failed to highlight code with language ${language}:`, error);
    return code;
  }
};

/**
 * Check if a language is loaded
 * @param {string} language - Language to check
 * @returns {boolean} True if language is loaded
 */
export const isLanguageLoaded = (language) => {
  return loadedLanguages.has(language);
};

export default Prism; 