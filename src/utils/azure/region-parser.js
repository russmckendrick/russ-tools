// Azure Region Parser
// Parses the azure-name-regions.tf file to extract region information

// Regular expressions to extract the maps from the Terraform file
const REGIONS_REGEX = /regions\s*=\s*{([^}]+)}/;
const SHORT_NAMES_REGEX = /short_names\s*=\s*{([^}]+)}/;
const CLI_NAMES_REGEX = /cli_names\s*=\s*{([^}]+)}/;

/**
 * Parses a Terraform map string into a JavaScript object
 * @param {string} mapString - The string containing the Terraform map
 * @returns {Object} The parsed map as a JavaScript object
 */
function parseTerraformMap(mapString) {
  const map = {};
  const lines = mapString.split('\n');
  for (let line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) continue;
    // Extract key and value
    const match = line.match(/"?([^"]+)"?\s*=\s*"([^"]+)"/);
    if (match) {
      const [, key, value] = match;
      map[key.trim()] = value.trim();
    }
  }
  return map;
}

/**
 * Loads and parses the Azure regions Terraform file
 * @returns {Promise<Object>} Object containing parsed region data
 */
export async function loadAzureRegionData() {
  try {
    const response = await fetch('/data/azure/azure-name-regions.tf');
    if (!response.ok) throw new Error('Failed to load Azure regions file');
    const content = await response.text();

    // Extract the maps using regex
    const regionsMatch = content.match(REGIONS_REGEX);
    const shortNamesMatch = content.match(SHORT_NAMES_REGEX);
    const cliNamesMatch = content.match(CLI_NAMES_REGEX);

    if (!regionsMatch || !shortNamesMatch || !cliNamesMatch) {
      throw new Error('Failed to parse required region data');
    }

    // Parse each map (no filtering needed)
    const regions = parseTerraformMap(regionsMatch[1]);
    const shortNames = parseTerraformMap(shortNamesMatch[1]);
    const cliNames = parseTerraformMap(cliNamesMatch[1]);

    // Create a lookup map for region abbreviations
    const regionAbbreviations = {};
    Object.entries(cliNames).forEach(([slug, cliName]) => {
      if (shortNames[slug]) {
        regionAbbreviations[cliName] = shortNames[slug];
      }
    });

    return {
      regions,
      shortNames,
      cliNames,
      regionAbbreviations
    };
  } catch (error) {
    console.error('Error loading Azure region data:', error);
    throw error;
  }
}

/**
 * Gets the abbreviation for a region
 * @param {string} region - The Azure region name (e.g., 'eastus')
 * @returns {Promise<string>} The region abbreviation
 */
export async function getRegionAbbreviation(region) {
  const { regionAbbreviations } = await loadAzureRegionData();
  return regionAbbreviations[region] || region;
} 