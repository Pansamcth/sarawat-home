/**
 * Image Protection & Anti-Copy Protection System
 * ป้องกันการคัดลอก ดาวน์โหลด และบันทึกรูปภาพ/ตราสัญลักษณ์จากเว็บไซต์
 * รองรับทั้ง Desktop (คลิกขวา, ลากรูป) และ Mobile (กดค้างบันทึกภาพ)
 */

(function () {
  'use strict';

  let toastTimeout = null;
  const DEFAULT_WARNING_MSG = 'เว็บไซต์นี้ไม่อนุญาตให้คุณบันทึกภาพ';

  // 1. Create floating toast notification if not present (Red Warning Block)
  function getOrCreateToast() {
    let toast = document.getElementById('dgProtectToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'dgProtectToast';
      toast.className = 'dg-protect-toast';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.innerHTML = `
        <span class="dg-toast-icon" aria-hidden="true">🚧</span>
        <span class="dg-toast-text">${DEFAULT_WARNING_MSG}</span>
      `;
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showProtectToast(msg) {
    const toast = getOrCreateToast();
    const textSpan = toast.querySelector('.dg-toast-text');
    if (textSpan) {
      textSpan.textContent = msg || DEFAULT_WARNING_MSG;
    }
    toast.classList.add('active');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 2400);
  }

  // 2. Helper to check if an element is or contains a protected image
  function isProtectedImage(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'IMG' || tag === 'PICTURE' || tag === 'CANVAS') return true;

    // Check ancestors for image wrappers or logos
    if (el.closest && (
      el.closest('img') ||
      el.closest('.dg-brand') ||
      el.closest('.dg-news-cover-wrap') ||
      el.closest('.dg-act-card-cover') ||
      el.closest('.dg-hero-image-wrap') ||
      el.closest('.dg-chief-photo-wrap') ||
      el.closest('.dg-news-modal-cover') ||
      el.closest('.tp-member-avatar') ||
      el.closest('.tp-hero-bg') ||
      el.closest('[data-protected="true"]')
    )) {
      return true;
    }

    return false;
  }

  // 3. Prevent Context Menu (Right Click) on Images
  document.addEventListener('contextmenu', function (e) {
    if (isProtectedImage(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      showProtectToast(DEFAULT_WARNING_MSG);
      return false;
    }
  }, true);

  // 4. Prevent Dragging Images (Drag to Desktop / Folders)
  document.addEventListener('dragstart', function (e) {
    if (isProtectedImage(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      showProtectToast(DEFAULT_WARNING_MSG);
      return false;
    }
  }, true);

  // 5. Prevent Selection on Images
  document.addEventListener('selectstart', function (e) {
    if (isProtectedImage(e.target)) {
      e.preventDefault();
      return false;
    }
  }, true);

  // 6. Prevent Mobile Long Press (Save image sheet on iOS/Android)
  let touchTimer = null;
  document.addEventListener('touchstart', function (e) {
    if (isProtectedImage(e.target)) {
      touchTimer = setTimeout(function () {
        showProtectToast(DEFAULT_WARNING_MSG);
      }, 450);
    }
  }, { passive: true });

  document.addEventListener('touchend', function () {
    if (touchTimer) clearTimeout(touchTimer);
  }, { passive: true });

  document.addEventListener('touchcancel', function () {
    if (touchTimer) clearTimeout(touchTimer);
  }, { passive: true });

  // 7. Prevent Webpage Save Shortcuts (Ctrl+S / Cmd+S)
  window.addEventListener('keydown', function (e) {
    const isSave = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S');
    if (isSave) {
      e.preventDefault();
      showProtectToast(DEFAULT_WARNING_MSG);
    }
  });

  // 8. Auto-apply draggable=false and oncontextmenu=return false to all current and future images
  function protectAllImages() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.setAttribute('draggable', 'false');
      img.setAttribute('oncontextmenu', 'return false;');
      img.classList.add('dg-protected-img');
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protectAllImages);
  } else {
    protectAllImages();
  }

  // Watch for dynamically rendered images (e.g. carousel cards, news modal, activities grid)
  const observer = new MutationObserver(function (mutations) {
    for (let m of mutations) {
      if (m.addedNodes && m.addedNodes.length > 0) {
        protectAllImages();
        break;
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  // Expose to window
  window.dgProtectToast = showProtectToast;
})();
