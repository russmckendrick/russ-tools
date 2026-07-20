function initAppearanceControls() {
  const modeButton = document.querySelector('[data-theme-toggle]');
  const paletteButton = document.querySelector('[data-palette-toggle]');
  const paletteMenu = document.querySelector('[data-palette-menu]');
  const palettePicker = document.querySelector('.rt-palette-picker');
  const paletteOptions = [...document.querySelectorAll('[data-palette-option]')];
  const paletteCurrent = document.querySelector('[data-palette-current]');
  if (!modeButton || !paletteButton || !paletteMenu || !palettePicker || !paletteCurrent) return;

  const root = document.documentElement;
  const modes = ['system', 'light', 'dark'];
  const modeLabels = {
    system: 'Theme: follow system. Switch to light.',
    light: 'Theme: light. Switch to dark.',
    dark: 'Theme: dark. Follow the system instead.',
  };
  const media = window.matchMedia('(prefers-color-scheme: light)');
  const paletteIds = root.dataset.paletteOptions.split(' ');
  const defaultPalette = root.dataset.defaultPalette;
  const paletteNames = Object.fromEntries(
    paletteOptions.map((option) => [option.dataset.paletteValue, option.dataset.paletteName])
  );

  const readMode = () => {
    try {
      const stored = localStorage.getItem('vite-ui-theme');
      return modes.includes(stored) ? stored : 'system';
    } catch {
      return 'system';
    }
  };

  const readPalette = () => {
    try {
      const stored = localStorage.getItem('russ-tools-palette');
      return paletteIds.includes(stored) ? stored : defaultPalette;
    } catch {
      return defaultPalette;
    }
  };

  const applyMode = (mode) => {
    const light = mode === 'light' || (mode === 'system' && media.matches);
    root.classList.toggle('light', light);
    root.classList.toggle('dark', !light);
    root.dataset.themePref = mode;
    modeButton.setAttribute('aria-label', modeLabels[mode]);
    modeButton.setAttribute('title', modeLabels[mode]);
  };

  const applyPalette = (palette) => {
    const next = paletteIds.includes(palette) ? palette : defaultPalette;
    const name = paletteNames[next];
    root.dataset.palette = next;
    paletteCurrent.textContent = name;
    paletteButton.setAttribute('aria-label', `Palette: ${name}. Open palette menu.`);
    paletteButton.setAttribute('title', `Palette: ${name}`);
    for (const option of paletteOptions) {
      const selected = option.dataset.paletteValue === next;
      option.setAttribute('aria-checked', String(selected));
      option.tabIndex = selected ? 0 : -1;
    }
  };

  const closePaletteMenu = (restoreFocus = false) => {
    paletteMenu.hidden = true;
    paletteButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) paletteButton.focus();
  };

  const openPaletteMenu = () => {
    paletteMenu.hidden = false;
    paletteButton.setAttribute('aria-expanded', 'true');
    const selected = paletteOptions.find((option) => option.getAttribute('aria-checked') === 'true');
    requestAnimationFrame(() => selected?.focus());
  };

  applyMode(readMode());
  applyPalette(readPalette());

  modeButton.addEventListener('click', () => {
    const next = modes[(modes.indexOf(readMode()) + 1) % modes.length];
    try {
      localStorage.setItem('vite-ui-theme', next);
    } catch {}
    applyMode(next);
  });

  paletteButton.addEventListener('click', () => {
    if (paletteMenu.hidden) openPaletteMenu();
    else closePaletteMenu(true);
  });

  for (const option of paletteOptions) {
    option.addEventListener('click', () => {
      const next = option.dataset.paletteValue;
      try {
        localStorage.setItem('russ-tools-palette', next);
      } catch {}
      applyPalette(next);
      closePaletteMenu(true);
    });
  }

  paletteMenu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePaletteMenu(true);
      return;
    }

    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const current = paletteOptions.indexOf(document.activeElement);
    let next = current;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = paletteOptions.length - 1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      next = (current + 1) % paletteOptions.length;
    } else {
      next = (current - 1 + paletteOptions.length) % paletteOptions.length;
    }
    paletteOptions[next].focus();
  });

  document.addEventListener('pointerdown', (event) => {
    if (!paletteMenu.hidden && !palettePicker.contains(event.target)) closePaletteMenu();
  });

  media.addEventListener('change', () => applyMode(readMode()));
  window.addEventListener('storage', (event) => {
    if (event.key === 'vite-ui-theme') applyMode(readMode());
    if (event.key === 'russ-tools-palette') applyPalette(readPalette());
  });
}

initAppearanceControls();
