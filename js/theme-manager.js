/**
 * Diego Theme Manager — Minimalist Neutral Dark Mode System
 * Manages Light/Dark theme switching, localStorage persistence,
 * cross-tab synchronization, and Segmented Switch UI components.
 */

(function () {
  'use strict';

  var THEME_KEY = 'dg_theme';

  function getStoredTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function getSystemPreference() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {}
    return 'light';
  }

  function getActiveTheme() {
    var stored = getStoredTheme();
    if (stored === 'dark') {
      return 'dark';
    }
    return 'light'; // Default: Light theme only
  }

  function applyTheme(theme, save) {
    var target = (theme === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', target);
    document.documentElement.style.colorScheme = target;

    if (document.body) {
      if (target === 'dark') {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    if (save) {
      try {
        localStorage.setItem(THEME_KEY, target);
      } catch (e) {}
    }

    updateToggleButtons(target);

    // Notify listeners if any
    try {
      window.dispatchEvent(new CustomEvent('dgThemeChange', { detail: { theme: target } }));
    } catch (e) {}
  }

  function updateToggleButtons(activeTheme) {
    var groups = document.querySelectorAll('.dg-theme-switch-group');
    groups.forEach(function (group) {
      var buttons = group.querySelectorAll('.dg-theme-switch-btn');
      buttons.forEach(function (btn) {
        var btnTheme = btn.getAttribute('data-theme-set');
        if (btnTheme === activeTheme) {
          btn.classList.add('active');
          btn.setAttribute('aria-pressed', 'true');
        } else {
          btn.classList.remove('active');
          btn.setAttribute('aria-pressed', 'false');
        }
      });
    });

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try { window.lucide.createIcons(); } catch (e) {}
    }
  }

  function initThemeUI() {
    var current = getActiveTheme();
    applyTheme(current, false);

    // Bind click events on all theme switch buttons (using event delegation)
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.dg-theme-switch-btn');
      if (!btn) return;
      var targetTheme = btn.getAttribute('data-theme-set');
      if (targetTheme === 'dark' || targetTheme === 'light') {
        e.preventDefault();
        applyTheme(targetTheme, true);
      }
    });

    // Default is strictly Light only unless explicitly toggled by user

    // Cross-tab synchronization
    window.addEventListener('storage', function (e) {
      if (e.key === THEME_KEY) {
        var updated = e.newValue === 'dark' ? 'dark' : 'light';
        applyTheme(updated, false);
      }
    });
  }

  // Public API
  
  // Global Modal Helpers & Admission Footer Click Handler (Shows recruitClosedModal if closed/maintenance)
  if (typeof window.openModal !== 'function') {
    window.openModal = function (id) {
      var modal = document.getElementById(id);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
          try { window.lucide.createIcons(); } catch (err) {}
        }
      }
    };
  }

  if (typeof window.closeModal !== 'function') {
    window.closeModal = function (id) {
      var modal = document.getElementById(id);
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    };
  }

  window.handleAdmissionFooterClick = function (e) {
    var card = document.getElementById('cardOpsRecruit');
    // If card exists and is open, navigate to /admission
    if (card && !card.classList.contains('is-closed')) {
      window.location.href = '/admission';
      return;
    }
    // If closed or default on all pages:
    if (e) e.preventDefault();
    var modal = document.getElementById('recruitClosedModal');
    if (modal) {
      if (typeof window.openModal === 'function') {
        window.openModal('recruitClosedModal');
      } else {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        try { window.lucide.createIcons(); } catch (err) {}
      }
    } else {
      window.location.href = '/admission';
    }
  };

  window.closeRecruitClosedModal = function () {
    var modal = document.getElementById('recruitClosedModal');
    if (modal) {
      if (typeof window.closeModal === 'function') {
        window.closeModal('recruitClosedModal');
      } else {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  };

  window.DgTheme = {
    get: getActiveTheme,
    set: function (theme) { applyTheme(theme, true); },
    toggle: function () {
      var next = (getActiveTheme() === 'dark') ? 'light' : 'dark';
      applyTheme(next, true);
      return next;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThemeUI);
  } else {
    initThemeUI();
  }
})();
