/**
 * SI-ROSTER - In-App Browser Guard & Blocker (White Diego Theme)
 * =========================================================================
 * ปฏิเสธและป้องกันการเข้าถึงผ่าน In-App Browser (LINE, Instagram, Facebook, Messenger/Inbox)
 * ปรับดีไซน์เป็น "ธีมสีขาว (Pure White / Light Theme)" เข้ากับระบบเว็บหลัก Diego Design System
 * พร้อมคำแนะนำและปุ่มเปิดเบราว์เซอร์ภายนอกอัตโนมัติ สำหรับ iOS (Safari) และ Android (Chrome)
 * =========================================================================
 */
(function () {
  'use strict';

  function detectInAppBrowser() {
    var ua = navigator.userAgent || navigator.vendor || window.opera || '';

    // ตรวจจับเบราว์เซอร์ภายในแอปต่างๆ ทั้งบน iOS (iPhone/iPad) และ Android
    var isLine = /Line\//i.test(ua) || /LineApp/i.test(ua) || /LineClient/i.test(ua);
    var isInstagram = /Instagram/i.test(ua);
    var isMessenger = /Messenger/i.test(ua) || /FB_IAB\/MESSENGER/i.test(ua) || /FBAN\/MessengerLite/i.test(ua) || /FBAN\/Orca/i.test(ua);
    var isFb = /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua);
    var isTwitter = /Twitter/i.test(ua);
    var isTikTok = /musical_ly|ByteLocale|TikTok/i.test(ua);

    // รองรับการทดสอบผ่าน URL Query parameter (สำหรับผู้พัฒนา)
    var search = window.location.search || '';
    var isTestLine = search.indexOf('test_line=1') !== -1;
    var isTestIg = search.indexOf('test_ig=1') !== -1;
    var isTestInbox = search.indexOf('test_inbox=1') !== -1 || search.indexOf('test_messenger=1') !== -1;
    var isTestFb = search.indexOf('test_fb=1') !== -1;
    var isTestInApp = search.indexOf('test_inapp=1') !== -1 || search.indexOf('test_browser=1') !== -1;

    if (isLine || isTestLine) {
      return { detected: true, app: 'line', name: 'LINE', color: '#06c755', badgeText: 'LINE' };
    }
    if (isMessenger || isTestInbox) {
      return { detected: true, app: 'messenger', name: 'Messenger (FB Inbox)', color: '#0084ff', badgeText: 'Messenger' };
    }
    if (isInstagram || isTestIg) {
      return { detected: true, app: 'instagram', name: 'Instagram', color: '#e1306c', badgeText: 'Instagram' };
    }
    if (isFb || isTestFb) {
      return { detected: true, app: 'facebook', name: 'Facebook', color: '#1877f2', badgeText: 'Facebook' };
    }
    if (isTestInApp) {
      return { detected: true, app: 'inapp', name: 'In-App Browser', color: '#ef4444', badgeText: 'In-App' };
    }

    return { detected: false, app: '', name: '', color: '', badgeText: '' };
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || '');
  }

  function isIos() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
  }

  function getCleanBrowserUrl() {
    try {
      var u = new URL(window.location.href);
      u.searchParams.delete('test_line');
      u.searchParams.delete('test_ig');
      u.searchParams.delete('test_inbox');
      u.searchParams.delete('test_messenger');
      u.searchParams.delete('test_fb');
      u.searchParams.delete('test_inapp');
      u.searchParams.delete('test_browser');
      return u.toString();
    } catch (e) {
      return window.location.href;
    }
  }

  function tryAutoEscapeOnAndroid(inAppInfo) {
    // บน Android หากเป็น LINE และยังไม่ได้ใส่ openExternalBrowser=1 ให้เติม parameter เพื่อเปิด Chrome ภายนอกทันที
    if (isAndroid() && inAppInfo.app === 'line' && !window.location.search.includes('openExternalBrowser=1')) {
      try {
        var cleanUrl = getCleanBrowserUrl();
        var sep = cleanUrl.includes('?') ? '&' : '?';
        var externalUrl = cleanUrl + sep + 'openExternalBrowser=1';
        window.location.replace(externalUrl);
      } catch (e) {}
    }
  }

  function injectInAppBlockerModal() {
    // ป้องกันการสร้างซ้ำ
    if (document.getElementById('siInAppBrowserBlockerModal')) return;

    var inApp = detectInAppBrowser();
    var appName = inApp.name || 'In-App Browser';
    var badgeColor = inApp.color || '#ef4444';
    var badgeLabel = inApp.badgeText || 'In-App';
    var cleanUrl = getCleanBrowserUrl();

    // เพิ่ม CSS Animation Keyframes ให้หน้าต่างเปิดขึ้นมาอย่างสมูท
    if (!document.getElementById('siInAppBlockerStyles')) {
      var styleEl = document.createElement('style');
      styleEl.id = 'siInAppBlockerStyles';
      styleEl.textContent = [
        '@keyframes siModalFadeIn { from { opacity: 0; } to { opacity: 1; } }',
        '@keyframes siModalSlideUp { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }',
        '.si-inapp-btn:active { transform: scale(0.98); }'
      ].join('\n');
      document.head.appendChild(styleEl);
    }

    // สร้าง Overlay Backdrop สีคลีน โปร่งแสง เบลอฉากหลังสไตล์ Diego
    var overlay = document.createElement('div');
    overlay.id = 'siInAppBrowserBlockerModal';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 2147483647',
      'background: rgba(15, 23, 42, 0.55)',
      'backdrop-filter: blur(14px)',
      '-webkit-backdrop-filter: blur(14px)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 16px',
      'overflow-y: auto',
      'font-family: "Plus Jakarta Sans", "Kanit", "Sarabun", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'color: #0f172a',
      'box-sizing: border-box',
      'animation: siModalFadeIn 0.25s ease-out'
    ].join(';') + ';';

    var modalHtml = [
      '<div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 28px; max-width: 500px; width: 100%; padding: 32px 24px; box-shadow: 0 25px 60px -15px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.04); text-align: center; box-sizing: border-box; margin: auto; animation: siModalSlideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1);">',
      
      '  <!-- Top Indicator Icon & App Badge -->',
      '  <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 18px;">',
      '    <div style="position: relative; width: 72px; height: 72px; border-radius: 22px; background: #fff1f2; border: 2px solid #fecdd3; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px -4px rgba(225, 29, 72, 0.15);">',
      '      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">',
      '        <circle cx="12" cy="12" r="10"></circle>',
      '        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>',
      '      </svg>',
      '      <span style="position: absolute; bottom: -6px; right: -6px; background: ' + badgeColor + '; color: #ffffff; font-size: 10.5px; font-weight: 800; padding: 2px 8px; border-radius: 9999px; border: 2.5px solid #ffffff; letter-spacing: 0.3px; box-shadow: 0 2px 6px rgba(0,0,0,0.18);">' + badgeLabel + '</span>',
      '    </div>',
      '  </div>',

      '  <!-- Warning Pill Badge -->',
      '  <div style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 14px; border-radius: 9999px; background: #fef2f2; color: #dc2626; font-size: 0.82rem; font-weight: 700; margin-bottom: 12px; border: 1px solid #fee2e2;">',
      '    <span>⚠️</span>',
      '    <span>เบราว์เซอร์ไม่รองรับ (Unsupported In-App Browser)</span>',
      '  </div>',

      '  <!-- Heading -->',
      '  <h2 style="font-size: 1.35rem; font-weight: 800; margin: 0 0 8px 0; color: #0f172a; line-height: 1.35; letter-spacing: -0.01em;">',
      '    ไม่สามารถเข้าใช้งานผ่านแอป ' + appName + ' ได้',
      '  </h2>',

      '  <!-- Explanation -->',
      '  <p style="font-size: 0.92rem; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">',
      '    ระบบลงหน้าที่สารวัตรนักเรียน (<strong style="color: #0f172a;">SI-ROSTER</strong>) จำเป็นต้องใช้ฟังก์ชันเว็บมาตรฐานและการบันทึกข้อมูลแบบปลอดภัย ซึ่ง<strong style="color: #dc2626;">เบราว์เซอร์ภายในแอป ' + appName + ' ไม่รองรับ</strong>',
      '  </p>',

      '  <!-- Instruction Box (Light White Theme) -->',
      '  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 18px 16px; text-align: left; margin-bottom: 22px;">',
      '    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; font-weight: 700; font-size: 0.92rem; color: #0284c7;">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">',
      '        <circle cx="12" cy="12" r="10"></circle>',
      '        <line x1="12" y1="16" x2="12" y2="12"></line>',
      '        <line x1="12" y1="8" x2="12.01" y2="8"></line>',
      '      </svg>',
      '      <span>วิธีแก้ไขเพื่อเข้าใช้งาน (ทำเพียงครั้งเดียว):</span>',
      '    </div>',

      '    <!-- iOS Steps -->',
      '    <div style="margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px dashed #cbd5e1;">',
      '      <div style="font-size: 0.88rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">',
      '        <span>🍎 สำหรับผู้ใช้ iPhone / iPad (iOS):</span>',
      '      </div>',
      '      <ol style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #475569; line-height: 1.6;">',
      '        <li>แตะที่ไอคอน <strong style="color: #0f172a;">จุด 3 จุด (•••)</strong> หรือ <strong style="color: #0f172a;">ไอคอนแชร์</strong> ที่มุมจอ</li>',
      '        <li>แตะเลือก <strong style="color: #0284c7;">"เปิดใน Safari"</strong> หรือ <strong style="color: #0284c7;">"เปิดด้วยเบราว์เซอร์เริ่มต้น"</strong></li>',
      '      </ol>',
      '    </div>',

      '    <!-- Android Steps -->',
      '    <div>',
      '      <div style="font-size: 0.88rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">',
      '        <span>🤖 สำหรับผู้ใช้โทรศัพท์ Android:</span>',
      '      </div>',
      '      <ol style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #475569; line-height: 1.6;">',
      '        <li>แตะที่ไอคอน <strong style="color: #0f172a;">จุด 3 จุด (⋮)</strong> ที่มุมบนขวาของหน้าจอ</li>',
      '        <li>แตะเลือก <strong style="color: #0284c7;">"เปิดใน Chrome"</strong> หรือ <strong style="color: #0284c7;">"เปิดด้วยเบราว์เซอร์อื่น"</strong></li>',
      '      </ol>',
      '    </div>',
      '  </div>',

      '  <!-- Actions -->',
      '  <div style="display: flex; flex-direction: column; gap: 10px;">',
      '    <button type="button" id="siInAppCopyBtn" class="si-inapp-btn" style="width: 100%; padding: 13px 20px; border-radius: 14px; background: #0f172a; color: #ffffff; font-weight: 700; font-size: 0.94rem; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 14px rgba(15, 23, 42, 0.18);">',
      '      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>',
      '        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
      '      </svg>',
      '      <span>คัดลอกลิงก์ (Copy Link) ไปเปิดใน Safari / Chrome</span>',
      '    </button>',

      '    <a href="' + cleanUrl + (cleanUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1" id="siInAppOpenExtBtn" class="si-inapp-btn" target="_blank" rel="noopener noreferrer" style="width: 100%; padding: 12px 20px; border-radius: 14px; background: #ffffff; color: #334155; font-weight: 600; font-size: 0.9rem; border: 1px solid #cbd5e1; display: flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; box-sizing: border-box; transition: all 0.2s ease;">',
      '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>',
      '        <polyline points="15 3 21 3 21 9"></polyline>',
      '        <line x1="10" y1="14" x2="21" y2="3"></line>',
      '      </svg>',
      '      <span>แตะเพื่อเปิดด้วยเบราว์เซอร์ภายนอก (สำหรับ Android)</span>',
      '    </a>',
      '  </div>',

      '  <!-- Footer Note -->',
      '  <div style="margin-top: 18px; font-size: 0.78rem; color: #94a3b8; font-weight: 500;">',
      '    คณะสารวัตรนักเรียน โรงเรียนเดชะปัตตนยานุกูล (Truant Patrol)',
      '  </div>',
      '</div>'
    ].join('\n');

    overlay.innerHTML = modalHtml;

    // ล็อกหน้าจอไม่ให้เลื่อนหรือแตะด้านหลัง
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    document.body.appendChild(overlay);

    // ผูก Event คัดลอกลิงก์
    var copyBtn = document.getElementById('siInAppCopyBtn');
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
          copyBtn.style.background = '#059669';
          copyBtn.innerHTML = [
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">',
            '  <polyline points="20 6 9 17 4 12"></polyline>',
            '</svg>',
            '<span>คัดลอกลิงก์สำเร็จ! นำไปวางใน Chrome/Safari ได้เลย</span>'
          ].join('');

          setTimeout(function () {
            copyBtn.style.background = '#0f172a';
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

    // ผูก Event ปุ่มเปิดด้วยเบราว์เซอร์ภายนอกบน Android
    var extBtn = document.getElementById('siInAppOpenExtBtn');
    if (extBtn) {
      extBtn.addEventListener('click', function (e) {
        if (isAndroid()) {
          try {
            // บน Android ส่ง Intent เปิด Google Chrome
            var intentUrl = 'intent://' + window.location.host + window.location.pathname + window.location.search + '#Intent;scheme=' + window.location.protocol.replace(':', '') + ';package=com.android.chrome;end';
            window.location.href = intentUrl;
          } catch (err) {}
        }
      });
    }
  }

  // ประเมินผลและเริ่มทำงานทันที
  var inAppInfo = detectInAppBrowser();
  if (inAppInfo.detected) {
    // ซ่อนเนื้อหาของหน้าเว็บทันทีตั้งแต่ใน Head เพื่อป้องกันไม่ให้เห็นหรือแตะเนื้อหาภายใน LINE/IG/FB
    try {
      var earlyStyle = document.createElement('style');
      earlyStyle.id = 'siInAppEarlyHideStyle';
      earlyStyle.textContent = 'body > *:not(#siInAppBrowserBlockerModal) { display: none !important; }';
      if (document.head) {
        document.head.appendChild(earlyStyle);
      }
    } catch (e) {}

    // 1. บน Android พยายามส่งออกภายนอกหากเป็น LINE
    tryAutoEscapeOnAndroid(inAppInfo);

    // 2. แสดง UI หน้าต่างบล็อกธีมสีขาวสวยงาม
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectInAppBlockerModal);
    } else {
      injectInAppBlockerModal();
    }
  }

  // ส่งออกฟังก์ชันสู่ Global เพื่อความเข้ากันได้ย้อนหลัง
  window.checkLineInAppBrowser = function () { return detectInAppBrowser().detected; };
  window.checkInAppBrowser = detectInAppBrowser;
  window.showLineBrowserBlocker = injectInAppBlockerModal;
  window.showInAppBrowserBlocker = injectInAppBlockerModal;
})();
