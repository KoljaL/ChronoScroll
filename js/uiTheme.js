(function() {
  'use strict';

  const storageKey = 'cronoscroll_ui_theme';
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let override = null;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === 'light' || saved === 'dark') override = saved;
    else if (saved !== null) console.warn('Ungültige gespeicherte Oberflächendarstellung:', saved);
  } catch (error) {
    console.warn('Oberflächendarstellung konnte nicht geladen werden:', error);
  }

  function applyTheme() {
    const dark = override ? override === 'dark' : systemTheme.matches;
    document.documentElement.dataset.uiTheme = dark ? 'dark' : 'light';
    const button = document.getElementById('theme-toggle');
    if (button) {
      button.classList.toggle('is-dark', dark);
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren';
    }
  }

  applyTheme();
  systemTheme.addEventListener('change', () => {
    if (!override) applyTheme();
  });

  window.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('theme-toggle');
    applyTheme();
    button.addEventListener('click', () => {
      override = document.documentElement.dataset.uiTheme === 'dark' ? 'light' : 'dark';
      applyTheme();
      try {
        localStorage.setItem(storageKey, override);
      } catch (error) {
        console.error('Oberflächendarstellung konnte nicht gespeichert werden:', error);
        window.alert('Die Darstellung konnte nicht gespeichert werden. Sie gilt nur für diese Sitzung.');
      }
    });
  });
})();
