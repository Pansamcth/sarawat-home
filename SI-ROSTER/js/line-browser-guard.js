/**
 * SI-ROSTER - LINE In-App Browser Blocker & Guide
 * ========================================================
 * ปฏิเสธการเข้าถึงผ่านเบราว์เซอร์ภายในแอป LINE พร้อมแสดงคำแนะนำและวิธีแก้ไข
 * สำหรับผู้ใช้งานทั้งระบบ iOS (Safari) และ Android (Chrome)
 */
(function () {
  'use strict';

  function isLineBrowser() {
    var ua = navigator.userAgent || navigator.vendor || window.opera || '';
    // ตรวจจับ User Agent ของ LINE บนทั้ง iOS และ Android
    var isLine = /Line\//i.test(ua) || /LineApp/i.test(ua);
    // รองรับการทดสอบผ่าน Query parameter เช่น ?test_line=1
    var isTest = window.location.search.indexOf('test_line=1') !== -1;
    return isLine || isTest;
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || '');
  }

  function isIos() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  }

  function getCleanBrowserUrl() {
    var u = new URL(window.location.href);
    u.searchParams.delete('test_line');
    return u.toString();
  }

  function tryAutoEscapeLineOnAndroid() {
    // บน Android LINE รองรับพารามิเตอร์ ?openExternalBrowser=1 เพื่อเด้งเปิด Chrome ภายนอกทันที
    if (isAndroid() && !window.location.search.includes('openExternalBrowser=1')) {
      try {
        var cleanUrl = getCleanBrowserUrl();
        var sep = cleanUrl.includes('?') ? '&' : '?';
        var externalUrl = cleanUrl + sep + 'openExternalBrowser=1';
        window.location.replace(externalUrl);
      } catch (e) { }
    }
  }

  function injectLineBlockerModal() {
    // หากมี modal แสดงอยู่แล้วไม่ต้องสร้างซ้ำ
    if (document.getElementById('siLineBrowserBlockerModal')) return;

    var cleanUrl = getCleanBrowserUrl();

    // สร้าง Element Container ครอบทั้งหน้าจอ (Fixed Fullscreen Overlay)
    var overlay = document.createElement('div');
    overlay.id = 'siLineBrowserBlockerModal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 2147483647',
      'background: rgba(11, 15, 25, 0.96)',
      'backdrop-filter: blur(16px)',
      '-webkit-backdrop-filter: blur(16px)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 18px',
      'overflow-y: auto',
      'font-family: "Kanit", "Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'color: #ffffff',
      'box-sizing: border-box'
    ].join(';') + ';';

    var modalHtml = [
      '<div style="background: #141a29; border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 24px; max-width: 520px; width: 100%; padding: 28px 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.5); text-align: center; box-sizing: border-box; margin: auto;">',
      
      '  <!-- Top Indicator Icon -->',
      '  <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">',
      '    <div style="position: relative; width: 72px; height: 72px; border-radius: 20px; background: rgba(239, 68, 68, 0.12); border: 2px solid rgba(239, 68, 68, 0.3); display: flex; align-items: center; justify-content: center;">',
      '      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <circle cx="12" cy="12" r="10"></circle>',
      '        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>',
      '      </svg>',
      '      <span style="position: absolute; bottom: -6px; right: -6px; background: #06c755; color: #ffffff; font-size: 11px; font-weight: 800; padding: 2px 7px; border-radius: 10px; border: 2px solid #141a29; letter-spacing: 0.5px;">LINE</span>',
      '    </div>',
      '  </div>',

      '  <!-- Badge -->',
      '  <div style="display: inline-block; padding: 5px 14px; border-radius: 30px; background: rgba(239, 68, 68, 0.18); color: #fca5a5; font-size: 0.82rem; font-weight: 600; margin-bottom: 12px; border: 1px solid rgba(239, 68, 68, 0.3);">',
      '    ⚠️ เบราว์เซอร์ไม่รองรับ (Unsupported In-App Browser)',
      '  </div>',

      '  <!-- Heading -->',
      '  <h2 style="font-size: 1.45rem; font-weight: 700; margin: 0 0 10px 0; color: #ffffff; line-height: 1.35;">',
      '    ไม่สามารถเข้าใช้งานผ่านแอป LINE ได้',
      '  </h2>',

      '  <!-- Explanation -->',
      '  <p style="font-size: 0.92rem; color: #cbd5e1; line-height: 1.6; margin: 0 0 22px 0;">',
      '    ระบบลงหน้าที่สารวัตรนักเรียน (<strong style="color: #ffffff;">SI-ROSTER</strong>) จำเป็นบันทึกข้อมูลแบบปลอดภัย ซึ่ง<strong style="color: #f87171;">เบราว์เซอร์ภายในแอป LINE ไม่รองรับ</strong>การทำงานเหล่านี้',
      '  </p>',

      '  <!-- Instruction Box -->',
      '  <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 18px; padding: 18px; text-align: left; margin-bottom: 22px;">',
      '    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-weight: 700; font-size: 0.95rem; color: #38bdf8;">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <circle cx="12" cy="12" r="10"></circle>',
      '        <line x1="12" y1="16" x2="12" y2="12"></line>',
      '        <line x1="12" y1="8" x2="12.01" y2="8"></line>',
      '      </svg>',
      '      <span>วิธีแก้ไขเพื่อเข้าใช้งาน (ทำเพียงครั้งเดียว):</span>',
      '    </div>',

      '    <!-- iOS Steps -->',
      '    <div style="margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px dashed rgba(255,255,255,0.1);">',
      '      <div style="font-size: 0.88rem; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">',
      '        <span>📱 สำหรับผู้ใช้ iPhone / iPad (iOS):</span>',
      '      </div>',
      '      <ol style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #94a3b8; line-height: 1.6;">',
      '        <li>แตะที่ไอคอน <strong style="color: #ffffff;">จุด 3 จุด (•••)</strong> หรือ <strong style="color: #ffffff;">ไอคอนแชร์</strong> ที่มุมล่างขวา (หรือมุมบนขวา)</li>',
      '        <li>แตะเลือก <strong style="color: #38bdf8;">"เปิดด้วยเบราว์เซอร์เริ่มต้น"</strong> หรือ <strong style="color: #38bdf8;">"เปิดใน Safari"</strong></li>',
      '      </ol>',
      '    </div>',

      '    <!-- Android Steps -->',
      '    <div>',
      '      <div style="font-size: 0.88rem; font-weight: 600; color: #f1f5f9; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">',
      '        <span>🤖 สำหรับผู้ใช้โทรศัพท์ Android (Samsung, OPPO, Vivo ฯลฯ):</span>',
      '      </div>',
      '      <ol style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #94a3b8; line-height: 1.6;">',
      '        <li>แตะที่ไอคอน <strong style="color: #ffffff;">จุด 3 จุด (⋮)</strong> ที่มุมบนขวาของหน้าจอ LINE</li>',
      '        <li>แตะเลือก <strong style="color: #38bdf8;">"เปิดด้วยเบราว์เซอร์อื่น"</strong> หรือ <strong style="color: #38bdf8;">"เปิดใน Chrome"</strong></li>',
      '      </ol>',
      '    </div>',
      '  </div>',

      '  <!-- Actions -->',
      '  <div style="display: flex; flex-direction: column; gap: 10px;">',
      '    <button type="button" id="siLineCopyBtn" style="width: 100%; padding: 13px 20px; border-radius: 14px; background: #3b82f6; color: #ffffff; font-weight: 700; font-size: 0.95rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s ease; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>',
      '        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
      '      </svg>',
      '      <span>คัดลอกลิงก์ (Copy Link) ไปเปิดใน Safari / Chrome</span>',
      '    </button>',

      '    <a href="' + cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1" id="siLineOpenExtBtn" target="_blank" rel="noopener noreferrer" style="width: 100%; padding: 12px 20px; border-radius: 14px; background: rgba(255, 255, 255, 0.08); color: #e2e8f0; font-weight: 600; font-size: 0.9rem; border: 1px solid rgba(255, 255, 255, 0.16); display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; box-sizing: border-box;">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>',
      '        <polyline points="15 3 21 3 21 9"></polyline>',
      '        <line x1="10" y1="14" x2="21" y2="3"></line>',
      '      </svg>',
      '      <span>พยายามเปิดด้วยเบราว์เซอร์ภายนอกอัตโนมัติ</span>',
      '    </a>',
      '  </div>',

      '  <!-- Footer Note -->',
      '  <div style="margin-top: 18px; font-size: 0.78rem; color: #64748b;">',
      '    สารวัตรนักเรียน โรงเรียนเดชะปัตตนยานุกูล (Truant Patrol)',
      '  </div>',
      '</div>'
    ].join('\n');

    overlay.innerHTML = modalHtml;

    // ล็อกหน้าจอไม่ให้เลื่อนหรือแตะปุ่มในหน้าเดิม
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    document.body.appendChild(overlay);

    // ผูก Event คัดลอกลิงก์
    var copyBtn = document.getElementById('siLineCopyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var urlToCopy = cleanUrl;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(urlToCopy).then(showCopiedSuccess).catch(fallbackCopy);
        } else {
          fallbackCopy();
        }

        function fallbackCopy() {
          try {
            var tempInput = document.createElement('input');
            tempInput.value = urlToCopy;
            tempInput.style.position = 'fixed';
            tempInput.style.opacity = '0';
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
            showCopiedSuccess();
          } catch (err) {
            alert('กรุณาคัดลอกลิงก์นี้: ' + urlToCopy);
          }
        }

        function showCopiedSuccess() {
          copyBtn.style.background = '#10b981';
          copyBtn.innerHTML = [
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
            '  <polyline points="20 6 9 17 4 12"></polyline>',
            '</svg>',
            '<span>คัดลอกลิงก์สำเร็จ! นำไปวางใน Chrome/Safari ได้เลย</span>'
          ].join('');

          setTimeout(function () {
            copyBtn.style.background = '#3b82f6';
            copyBtn.innerHTML = [
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
              '  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>',
              '  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
              '</svg>',
              '<span>คัดลอกลิงก์อีกครั้ง</span>'
            ].join('');
          }, 4000);
        }
      });
    }

    // ผูก Event ปุ่มเปิดด้วยเบราว์เซอร์ภายนอก
    var extBtn = document.getElementById('siLineOpenExtBtn');
    if (extBtn) {
      extBtn.addEventListener('click', function (e) {
        if (isAndroid()) {
          // บน Android พยายามส่ง intent เปิด Chrome
          try {
            var intentUrl = 'intent://' + window.location.host + window.location.pathname + window.location.search + '#Intent;scheme=' + window.location.protocol.replace(':', '') + ';package=com.android.chrome;end';
            window.location.href = intentUrl;
          } catch (err) { }
        }
      });
    }
  }

  // เริ่มทำงานทันที
  if (isLineBrowser()) {
    // 1. บน Android พยายามดีดออกไปยังเบราว์เซอร์ภายนอกทันทีก่อน
    tryAutoEscapeLineOnAndroid();

    // 2. แสดง UI หน้าต่างบล็อกพร้อมวิธีแก้ไข
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectLineBlockerModal);
    } else {
      injectLineBlockerModal();
    }
  }

  // ส่งออกฟังก์ชันสู่ Global เผื่อเรียกใช้เพิ่มเติม
  window.checkLineInAppBrowser = isLineBrowser;
  window.showLineBrowserBlocker = injectLineBlockerModal;
})();
