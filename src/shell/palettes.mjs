export const DEFAULT_PALETTE = 'catppuccin';

export const palettes = [
  { id: 'solarized', name: 'Solarized', dark: 'Dark', light: 'Light' },
  { id: 'catppuccin', name: 'Catppuccin', dark: 'Mocha', light: 'Latte' },
  { id: 'dracula', name: 'Dracula', dark: 'Dracula', light: 'Alucard' },
  { id: 'nord', name: 'Nord', dark: 'Polar Night', light: 'Snow Storm' },
  { id: 'tokyo-night', name: 'Tokyo Night', dark: 'Night', light: 'Day' },
  { id: 'github', name: 'GitHub', dark: 'Dark', light: 'Light' },
];

export const paletteIds = palettes.map(({ id }) => id);
