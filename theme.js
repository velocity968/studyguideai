/* Apply saved theme before first paint; light is the concept default. */
(function () {
  'use strict';
  const key = 'studyguideai-theme';
  let theme = 'light';
  try { if (localStorage.getItem(key) === 'dark') theme = 'dark'; } catch (_) {}
  function apply() {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#101a2b' : '#f3f7fc';
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.setAttribute('aria-pressed', String(theme === 'dark'));
    button.setAttribute('aria-label', theme === 'dark' ? 'Lichte modus inschakelen' : 'Donkere modus inschakelen');
    button.querySelector('[data-theme-label]').textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
  }
  apply();
  document.addEventListener('DOMContentLoaded', function () {
    apply();
    document.getElementById('theme-toggle').addEventListener('click', function () {
      theme = theme === 'dark' ? 'light' : 'dark';
      apply();
      try { localStorage.setItem(key, theme); } catch (_) {}
    });
  });
})();
