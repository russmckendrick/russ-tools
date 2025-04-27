/**
 * Returns a Mantine theme-aware background color for a subnet segment.
 * Uses a lighter or darker shade depending on colorScheme (light/dark).
 *
 * @param {object} colorObj - { name: string, index: number } (Mantine color object)
 * @param {object} theme - Mantine theme object
 * @param {string} colorScheme - 'dark' or 'light'
 * @returns {string} HEX color string
 */
export function getSubnetBgColorHex(colorObj, theme, colorScheme) {
  if (!colorObj || typeof colorObj !== 'object' || !colorObj.name) {
    // Fallback to standard gray if color object is invalid or missing name
    if (colorObj && typeof colorObj === 'object' && !colorObj.name) {
      console.warn('Color object missing name for background, falling back to gray bg:', colorObj);
    }
    return colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[1];
  }
  // Use index 1 for light mode background, index 7 for dark mode background
  const lightBgIndex = 1;
  const darkBgIndex = 7;
  const bgIndex = colorScheme === 'dark' ? darkBgIndex : lightBgIndex;

  const bgHex = theme.colors[colorObj.name]?.[bgIndex];

  if (!bgHex) {
    console.warn(`Theme background color lookup failed for ${colorObj.name}[${bgIndex}] in getSubnetBgColorHex (${colorScheme} mode), falling back to default gray bg.`);
    return colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[1];
  }
  return bgHex;
}
