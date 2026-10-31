/**
 * =========================================================================
 * 🛡️ PAGE ACCESS GUARD & MAINTENANCE CONTROLLER (ระบบควบคุมการเข้าถึงหน้าเว็บ)
 * =========================================================================
 * 
 * ใช้สำหรับตรวจเช็กสถานะการเปิด-ปิดหน้าเว็บแต่ละหน้า และสถานะปิดปรับปรุงทั้งระบบ
 * หากสถานะถูกปิด (เช่น ปิดปรับปรุง หรืออยู่ระหว่างการพัฒนา):
 *  - บุคคลทั่วไป: แสดงหน้าต่างการ์ด "ระบบกำลังพัฒนา" ดีไซน์โมเดิร์นตามแบบที่กำหนด
 *  - ผู้ดูแลระบบ (Admin ที่เข้าสู่ระบบอยู่): ดูและใช้งานหน้าจริงได้ตามปกติ
 *    พร้อมแสดงแถบแจ้งเตือนลอย "👑 โหมดผู้ดูแลระบบ" ด้านบนขวา
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
    else if (pathname.includes('roster') || pathname.includes('si-roster')) pageKey = 'roster';
    else if (pathname === '/' || pathname.endsWith('index.html') || pathname === '') pageKey = 'home';
  }

  // หากอยู่ในหน้าแอดมิน หรือไม่สามารถระบุได้ ไม่ต้องทำอะไร
  if (!pageKey || pageKey === 'admin') return;

  // 2. ตรวจสอบสิทธิ์การเป็น Admin
  function checkIsAdmin() {
    try {
      if (sessionStorage.getItem('sarawat_admin_auth') === 'true') return true;
      if (localStorage.getItem('dg_sarawat_auth_token') || sessionStorage.getItem('dg_sarawat_auth_token')) return true;
      if (typeof window.SarawatApi !== 'undefined' && typeof window.SarawatApi.getAuthToken === 'function' && window.SarawatApi.getAuthToken()) return true;
      // SI-ROSTER admin session check
      const storedRosterAuth = localStorage.getItem('adminAuth');
      if (storedRosterAuth) {
        const parsed = JSON.parse(storedRosterAuth);
        if (parsed && parsed.expires && new Date().getTime() <= parsed.expires) return true;
      }
    } catch (e) {}
    return false;
  }

  const isAdmin = checkIsAdmin();
  const cacheKey = 'dg_page_status_' + pageKey;
  const siteMaintenanceCacheKey = 'dg_site_maintenance_mode';
  const cachedStatus = localStorage.getItem(cacheKey);
  const cachedSiteMaintenance = localStorage.getItem(siteMaintenanceCacheKey);

  // 3. ป้องกันหน้าเว็บกะพริบ (Anti-FOUC) หากพบว่าเคยปิดไว้ และผู้ใช้ไม่ใช่ Admin
  let preStyleEl = null;
  if ((cachedSiteMaintenance === '1' || cachedStatus === '0') && !isAdmin) {
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

  // 4. แสดงหน้าจอ "ระบบกำลังพัฒนา" (สำหรับบุคคลทั่วไป) ตรงตามดีไซน์ต้นฉบับ 100%
  function renderUnderDevelopmentUI(isMasterMaintenance) {
    clearPreHide();

    // Ensure Google Fonts if not present
    if (!document.querySelector('link[href*="family=Kanit"]') && !document.querySelector('link[href*="family=Plus+Jakarta+Sans"]')) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
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
          font-family: 'Plus Jakarta Sans', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        [data-theme="dark"] html, [data-theme="dark"] body, body.dark-mode {
          background: #090d16 !important;
          color: #f8fafc !important;
        }
        #pageGuardUnderDev, #pageGuardUnderDev * {
          font-family: 'Plus Jakarta Sans', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif !important;
          box-sizing: border-box;
        }
        @keyframes dgGuardScaleIn {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `;
      (document.head || document.documentElement).appendChild(lockStyle);
    }

    if (document.getElementById('pageGuardUnderDev')) return;

    const pageSystemNames = {
      home: 'หน้าหลักสารวัตรนักเรียน',
      roster: 'ลงหน้าที่สารวัตรนักเรียน',
      admission: 'รับสมัครสารวัตรนักเรียน',
      activities: 'กิจกรรมและข่าวสาร',
      calendar: 'ปฏิทินกิจกรรมโรงเรียน',
      team: 'ทำเนียบคณะทำงาน'
    };

    const systemName = isMasterMaintenance ? 'สารวัตรนักเรียน (ทุกระบบ)' : (pageSystemNames[pageKey] || 'ระบบนี้');
    const isHome = (pageKey === 'home');

    const devContainer = document.createElement('div');
    devContainer.id = 'pageGuardUnderDev';
    devContainer.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 32px 18px;">
        <div style="max-width: 460px; width: 100%; background: #ffffff; border: 1.5px solid #edf2f7; border-radius: 28px; padding: 48px 36px 42px; text-align: center; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.03); animation: dgGuardScaleIn 0.32s cubic-bezier(0.16, 1, 0.3, 1);">
          
          <!-- Yellow Circle with Wrench Icon -->
          <div style="width: 76px; height: 76px; border-radius: 50%; background: #fef3c7; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12);">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
          </div>

          <!-- Main Title -->
          <h1 style="font-size: 1.7rem; font-weight: 800; color: #0f172a; margin: 0 0 14px 0; letter-spacing: -0.02em; line-height: 1.3;">
            ระบบกำลังพัฒนา
          </h1>

          <!-- Subtitle / Message (Exactly matching uploaded design) -->
          <p style="font-size: 0.95rem; font-weight: 500; color: #475569; line-height: 1.65; margin: 0 0 32px 0;">
            ระบบ${systemName}อยู่ระหว่างการพัฒนา<br>โปรดติดตามการอัปเดตในภายหลัง
          </p>

          <!-- Pill Button (Black Rounded Button) -->
          <div style="display: flex; justify-content: center;">
            ${isHome ? `
              <button type="button" onclick="window.location.reload()" style="border: none; outline: none; border-radius: 9999px; background: #000000; color: #ffffff; padding: 13px 34px; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); transition: transform 0.15s ease, background 0.15s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                  <path d="M3 3v5h5"></path>
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                  <path d="M16 21h5v-5"></path>
                </svg>
                <span>รีเฟรชเพื่อลองใหม่</span>
              </button>
            ` : `
              <a href="/" style="border-radius: 9999px; background: #000000; color: #ffffff; padding: 13px 34px; font-size: 0.95rem; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12); transition: transform 0.15s ease, background 0.15s ease;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 12H5"></path>
                  <path d="m12 19-7-7 7-7"></path>
                </svg>
                <span>กลับสู่หน้าหลัก</span>
              </a>
            `}
          </div>

          <!-- Discreet Admin Portal Link -->
          <div style="margin-top: 20px;">
            <a href="/admin" style="font-size: 0.78rem; color: #94a3b8; text-decoration: none; transition: color 0.15s ease;">เข้าสู่ระบบผู้ดูแลระบบ (Admin)</a>
          </div>

        </div>
      </div>
    `;

    // Apply dark mode styling if needed
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark' || (document.body && document.body.classList.contains('dark-mode'));
    if (isDarkMode) {
      const card = devContainer.querySelector('div > div');
      if (card) {
        card.style.background = '#111827';
        card.style.borderColor = '#1f2937';
        card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
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
  function renderAdminBypassBadge(isMasterMaintenance) {
    if (document.getElementById('adminBypassBanner')) return;

    const banner = document.createElement('div');
    banner.id = 'adminBypassBanner';
    banner.innerHTML = `
      <div style="position: fixed; top: 18px; right: 18px; z-index: 999999; background: #0f172a; color: #ffffff; padding: 9px 18px; border-radius: 99px; box-shadow: 0 10px 32px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 10px; font-family: 'Plus Jakarta Sans', 'Kanit', -apple-system, BlinkMacSystemFont, sans-serif; font-size: 0.82rem; border: 1px solid rgba(255,255,255,0.18); backdrop-filter: blur(10px); animation: dgGuardScaleIn 0.3s ease;">
        <span style="display: inline-flex; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; box-shadow: 0 0 10px #f59e0b; flex-shrink: 0;"></span>
        <span style="font-weight: 700; color: #fbbf24; white-space: nowrap;">👑 โหมดผู้ดูแลระบบ</span>
        <span style="color: #cbd5e1; border-left: 1px solid rgba(255,255,255,0.2); padding-left: 10px; font-size: 0.8rem; display: inline-block;">
          ${isMasterMaintenance ? 'เว็บไซต์กำลังปิดปรับปรุงทั้งระบบ (คุณกำลังเข้าชมในฐานะแอดมิน)' : 'หน้านี้กำลังปิดสำหรับบุคคลทั่วไป (คุณกำลังเข้าชมในฐานะแอดมิน)'}
        </span>
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

    let isMasterClosed = false;
    let isCurrentPageClosed = false;

    try {
      const res = await fetch(`${base}/api/settings`, { cache: 'no-store' });
      if (res.ok) {
        const settings = await res.json();
        if (settings['site_maintenance_mode'] === '1') {
          isMasterClosed = true;
        }
        const key = 'page_status_' + pageKey;
        if (typeof settings[key] !== 'undefined' && String(settings[key]).trim() === '0') {
          isCurrentPageClosed = true;
        }
        // Cache settings in LocalStorage
        try {
          localStorage.setItem(siteMaintenanceCacheKey, settings['site_maintenance_mode'] || '0');
          if (typeof settings[key] !== 'undefined') {
            localStorage.setItem(cacheKey, settings[key]);
          }
        } catch (e) {}
      }
    } catch (err) {
      if (localStorage.getItem(siteMaintenanceCacheKey) === '1') isMasterClosed = true;
      if (localStorage.getItem(cacheKey) === '0') isCurrentPageClosed = true;
    }

    const currentlyAdmin = checkIsAdmin();
    const shouldBlock = isMasterClosed || isCurrentPageClosed;

    if (shouldBlock) {
      if (currentlyAdmin) {
        clearPreHide();
        renderAdminBypassBadge(isMasterClosed);
      } else {
        renderUnderDevelopmentUI(isMasterClosed);
      }
    } else {
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
