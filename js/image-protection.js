/**
 * Image Protection & Anti-Copy Protection System
 * ป้องกันการคัดลอก ดาวน์โหลด และบันทึกรูปภาพ/ตราสัญลักษณ์จากเว็บไซต์
 * รองรับทั้ง Desktop (คลิกขวา, ลากรูป) และ Mobile (กดค้างบันทึกภาพ)
 */

(function () {
  'use strict';

  let toastTimeout = null;

  // 1. Create floating toast notification if not present
  function getOrCreateToast() {
    let toast = document.getElementById('dgProtectToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'dgProtectToast';
      toast.className = 'dg-protect-toast';
      toast.setAttribute('role', 'alert');
      toast.setAttribute('aria-live', 'assertive');
      toast.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>ไม่อนุญาตให้บันทึกหรือคัดลอกรูปภาพจากเว็บไซต์</span>
      `;
      document.body.appendChild(toast);
    }
    return toast;
  }

  function showProtectToast(msg) {
    const toast = getOrCreateToast();
    if (msg) {
      const span = toast.querySelector('span');
      if (span) span.textContent = msg;
    }
    toast.classList.add('active');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 2200);
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
      showProtectToast('ไม่อนุญาตให้คลิกขวาเพื่อบันทึกรูปภาพหรือตราสัญลักษณ์');
      return false;
    }
  }, true);

  // 4. Prevent Dragging Images (Drag to Desktop / Folders)
  document.addEventListener('dragstart', function (e) {
    if (isProtectedImage(e.target)) {
      e.preventDefault();
      e.stopPropagation();
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
        showProtectToast('ไม่อนุญาตให้กดค้างเพื่อบันทึกรูปภาพ');
      }, 500);
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
      showProtectToast('ระบบปิดการบันทึกหน้าเว็บและรูปภาพ');
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
