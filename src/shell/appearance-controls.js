/**
 * The theme toggle. Was theme + palette; the six alternate palettes were
 * retired with the Signal redesign, so this is now only the mode cycle.
 *
 * `russ-tools-palette` is deliberately left in localStorage rather than
 * deleted. Nothing reads it any more, so a stored value degrades to the only
 * theme pair there is — and clearing a key we no longer own is not this
 * module's business.
 */
function initAppearanceControls() {
  const modeButton = document.querySelector('[data-theme-toggle]');
  if (!modeButton) return;

  const root = document.documentElement;
  const modes = ['system', 'light', 'dark'];
  const modeLabels = {
    system: 'Theme: follow system. Switch to light.',
    light: 'Theme: light. Switch to dark.',
    dark: 'Theme: dark. Follow the system instead.',
  };
  const media = window.matchMedia('(prefers-color-scheme: light)');

  const readMode = () => {
    try {
      const stored = localStorage.getItem('vite-ui-theme');
      return modes.includes(stored) ? stored : 'system';
    } catch {
      return 'system';
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

  applyMode(readMode());

  modeButton.addEventListener('click', () => {
    const next = modes[(modes.indexOf(readMode()) + 1) % modes.length];
    try {
      localStorage.setItem('vite-ui-theme', next);
    } catch {}
    applyMode(next);
  });

  media.addEventListener('change', () => applyMode(readMode()));
  window.addEventListener('storage', (event) => {
    if (event.key === 'vite-ui-theme') applyMode(readMode());
  });
}

initAppearanceControls();
