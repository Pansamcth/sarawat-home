/**
 * =========================================================================
 * 🛡️ PAGE ACCESS GUARD & MAINTENANCE CONTROLLER (ระบบควบคุมการเข้าถึงหน้าเว็บ)
 * =========================================================================
 * 
 * ใช้สำหรับตรวจเช็กสถานะการเปิด-ปิดหน้าเว็บแต่ละหน้า
 * หากสถานะถูกปิด (เช่น รอเอกสารภายในโรงเรียน):
 *  - บุคคลทั่วไป: จะแสดงหน้า "ระบบกำลังพัฒนา" (Under Development) พร้อมปุ่มกลับหน้าหลัก
 *  - ผู้ดูแลระบบ (Admin ที่เข้าสู่ระบบอยู่): จะสามารถดูและใช้งานหน้าจริงได้ตามปกติ
 *    พร้อมแสดงแถบแจ้งเตือนลอย "👑 โหมดผู้ดูแลระบบ" ให้รับทราบอย่างชัดเจน
 */

(function () {
  'use strict';

  // 1. ระบุคีย์ของหน้าเว็บปัจจุบัน
  const currentScript = document.currentScript;
  let pageKey = currentScript ? currentScript.getAttribute('data-page') : null;
  if (!pageKey && window.SARAWAT_PAGE_KEY) {
    pageKey = window.SARAWAT_PAGE_KEY;
  }
  if (!pageKey) {
    const pathname = (window.location.pathname || '').toLowerCase();
    if (pathname.includes('admission')) pageKey = 'admission';
    else if (pathname.includes('activities')) pageKey = 'activities';
    else if (pathname.includes('calendar')) pageKey = 'calendar';
    else if (pathname.includes('team')) pageKey = 'team';
  }

  // หากไม่ใช่ 4 หน้าที่ควบคุม ไม่ต้องทำอะไร
  if (!pageKey) return;

  // 2. ตรวจสอบสิทธิ์การเป็น Admin
  function checkIsAdmin() {
    try {
      if (sessionStorage.getItem('sarawat_admin_auth') === 'true') return true;
      if (localStorage.getItem('dg_sarawat_auth_token') || sessionStorage.getItem('dg_sarawat_auth_token')) return true;
      if (typeof window.SarawatApi !== 'undefined' && typeof window.SarawatApi.getAuthToken === 'function' && window.SarawatApi.getAuthToken()) return true;
    } catch (e) {}
    return false;
  }

  const isAdmin = checkIsAdmin();
  const cacheKey = 'dg_page_status_' + pageKey;
  const cachedStatus = localStorage.getItem(cacheKey);

  // 3. ป้องกันหน้าเว็บกะพริบ (Anti-FOUC) หากพบว่าเคยปิดไว้ และผู้ใช้ไม่ใช่ Admin
  let preStyleEl = null;
  if (cachedStatus === '0' && !isAdmin) {
    preStyleEl = document.createElement('style');
    preStyleEl.id = 'page-guard-prehide';
    preStyleEl.textContent = 'body > *:not(#pageGuardUnderDev) { display: none !important; }';
    (document.head || document.documentElement).appendChild(preStyleEl);
  }

  function clearPreHide() {
    if (preStyleEl && preStyleEl.parentNode) {
      preStyleEl.parentNode.removeChild(preStyleEl);
      preStyleEl = null;
    }
  }

  // 4. แสดงหน้าจอ "ระบบกำลังพัฒนา" (สำหรับบุคคลทั่วไป)
  function renderUnderDevelopmentUI() {
    clearPreHide();

    // Ensure Google Fonts (Kanit & Plus Jakarta Sans) if not present
    if (!document.querySelector('link[href*="family=Kanit"]')) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;850;900&display=swap';
      (document.head || document.documentElement).appendChild(fontLink);
    }

    // ซ่อนเนื้อหาเดิมของหน้าเว็บทั้งหมด
    let lockStyle = document.getElementById('page-guard-lock-style');
    if (!lockStyle) {
      lockStyle = document.createElement('style');
      lockStyle.id = 'page-guard-lock-style';
      lockStyle.textContent = `
        body > *:not(#pageGuardUnderDev):not(#adminBypassBanner) { display: none !important; }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100vh !important;
          background: #f8fafc !important;
          color: #0f172a !important;
          overflow-x: hidden !important;
          font-family: 'Plus Jakarta Sans', 'Outfit', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        body.dark-mode {
          background: #090d16 !important;
          color: #f8fafc !important;
        }
        #pageGuardUnderDev, #pageGuardUnderDev * {
          font-family: 'Plus Jakarta Sans', 'Outfit', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        #adminBypassBanner, #adminBypassBanner * {
          font-family: 'Plus Jakarta Sans', 'Outfit', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        @keyframes dgGuardScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `;
      (document.head || document.documentElement).appendChild(lockStyle);
    }

    if (document.getElementById('pageGuardUnderDev')) return;

    const pageTitles = {
      admission: 'ระบบรับสมัครสารวัตรนักเรียน',
      activities: 'กิจกรรมและข่าวสาร',
      calendar: 'ปฏิทินปฏิบัติงาน',
      team: 'ทำเนียบสารวัตรนักเรียน / กรรมการ'
    };
    const currentTitle = pageTitles[pageKey] || 'ระบบนี้';

    const devContainer = document.createElement('div');
    devContainer.id = 'pageGuardUnderDev';
    devContainer.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', 'Outfit', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif;">
        <div style="max-width: 500px; width: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 24px; padding: 44px 32px; text-align: center; box-shadow: 0 12px 40px rgba(0,0,0,0.06); animation: dgGuardScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
          
          <!-- Icon -->
          <div style="width: 80px; height: 80px; margin: 0 auto 22px; border-radius: 22px; background: linear-gradient(135deg, #fef3c7 0%, #fee2e2 100%); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(245,158,11,0.18);">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>

          <!-- Status Pill -->
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 5px 14px; border-radius: 99px; background: #fef3c7; color: #b45309; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 16px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #d97706; display: inline-block;"></span>
            UNDER DEVELOPMENT • อยู่ระหว่างดำเนินการ
          </div>

          <!-- Title -->
          <h1 style="font-size: 1.65rem; font-weight: 800; color: #0f172a; margin: 0 0 6px 0; letter-spacing: -0.5px;">
            ระบบกำลังพัฒนา
          </h1>
          <div style="font-size: 1rem; font-weight: 600; color: #64748b; margin-bottom: 16px;">
            ${currentTitle}
          </div>

          <!-- Description -->
          <p style="font-size: 0.92rem; color: #475569; line-height: 1.65; margin: 0 0 30px 0;">
            ฟังก์ชันและหน้านี้อยู่ระหว่างการพัฒนาและเตรียมความพร้อมด้านเอกสารภายในของโรงเรียน จึงยังไม่เปิดให้บุคคลทั่วไปเข้าชม ขออภัยในความไม่สะดวก
          </p>

          <!-- Buttons -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            <a href="/" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 13px 24px; border-radius: 12px; background: #0f172a; color: #ffffff; text-decoration: none; font-size: 0.94rem; font-weight: 600; box-shadow: 0 4px 14px rgba(15,23,42,0.15); transition: transform 0.2s ease;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>กลับสู่หน้าหลัก</span>
            </a>
            <a href="/admin" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 12px; background: transparent; color: #64748b; text-decoration: none; font-size: 0.85rem; font-weight: 500;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>เข้าสู่ระบบผู้ดูแลระบบ (Admin Login)</span>
            </a>
          </div>

        </div>
      </div>
    `;

    // Apply dark mode styling if document body has dark-mode
    if (document.body && document.body.classList.contains('dark-mode')) {
      const card = devContainer.querySelector('div > div');
      if (card) {
        card.style.background = '#131b2e';
        card.style.borderColor = '#1e293b';
        const h1 = card.querySelector('h1');
        if (h1) h1.style.color = '#f8fafc';
        const p = card.querySelector('p');
        if (p) p.style.color = '#94a3b8';
      }
    }

    if (document.body) {
      document.body.appendChild(devContainer);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(devContainer));
    }
  }

  // 5. แสดงแบนเนอร์แจ้งเตือน Admin Bypass (สำหรับ Admin ที่เข้าสู่ระบบอยู่)
  function renderAdminBypassBadge() {
    if (document.getElementById('adminBypassBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'adminBypassBanner';
    banner.innerHTML = `
      <div style="position: fixed; top: 18px; right: 18px; z-index: 999999; background: #0f172a; color: #ffffff; padding: 9px 18px; border-radius: 99px; box-shadow: 0 10px 32px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 10px; font-family: 'Plus Jakarta Sans', 'Outfit', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.82rem; border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(10px); animation: dgGuardScaleIn 0.3s ease;">
        <span style="display: inline-flex; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 10px #f59e0b; flex-shrink: 0;"></span>
        <span style="font-weight: 700; color: #fbbf24; white-space: nowrap;">👑 โหมดผู้ดูแลระบบ</span>
        <span style="color: #cbd5e1; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 10px; font-size: 0.8rem; display: inline-block;">หน้านี้กำลังปิดสำหรับบุคคลทั่วไป (คุณกำลังเข้าชมในฐานะแอดมิน)</span>
        <a href="/admin" style="color: #38bdf8; text-decoration: none; font-weight: 600; padding: 3px 10px; border-radius: 99px; background: rgba(56,189,248,0.15); margin-left: 4px; white-space: nowrap; font-size: 0.78rem;">ตั้งค่าระบบ</a>
      </div>
    `;

    if (document.body) {
      document.body.appendChild(banner);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(banner));
    }
  }

  // 6. ตรวจสอบสถานะจริงจากฐานข้อมูล (/api/settings)
  async function verifyPageAccess() {
    let base = '';
    if (typeof window.SarawatApi !== 'undefined' && typeof window.SarawatApi.getBaseUrl === 'function') {
      base = window.SarawatApi.getBaseUrl() || '';
    } else if (typeof window.CLOUDFLARE_TUNNEL_URL === 'string') {
      base = window.CLOUDFLARE_TUNNEL_URL.trim().replace(/\/+$/, '');
    }

    let status = '1'; // Default: เปิดใช้งานปกติ
    try {
      const res = await fetch(`${base}/api/settings`, { cache: 'no-store' });
      if (res.ok) {
        const settings = await res.json();
        const key = 'page_status_' + pageKey;
        if (typeof settings[key] !== 'undefined') {
          status = String(settings[key]).trim();
        }
      }
    } catch (err) {
      status = localStorage.getItem(cacheKey) || '1';
    }

    // อัปเดตแคชลงใน LocalStorage
    try {
      localStorage.setItem(cacheKey, status);
    } catch (e) {}

    const currentlyAdmin = checkIsAdmin();

    if (status === '0') {
      // หน้าเว็บถูกปิด (โหมดระบบกำลังพัฒนา)
      if (currentlyAdmin) {
        clearPreHide();
        renderAdminBypassBadge();
      } else {
        renderUnderDevelopmentUI();
      }
    } else {
      // หน้าเว็บเปิดใช้งานปกติ
      clearPreHide();
    }
  }

  // รันการตรวจสอบทันที
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', verifyPageAccess);
  } else {
    verifyPageAccess();
  }
})();
