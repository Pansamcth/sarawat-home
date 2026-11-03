/**
 * =========================================================================
 * 📱 IN-APP BROWSER RESOLVER (ตรวจจับและจัดการเบราว์เซอร์ในแอปอัตโนมัติ)
 * =========================================================================
 * - iPhone / iPad (iOS): ไม่บังคับไปเบราว์เซอร์เริ่มต้น ให้ใช้งานตามปกติได้เลย
 * - Android: บังคับเด้งเปิดเบราว์เซอร์เริ่มต้นของเครื่อง (Default Browser) ทันที
 * - ระบบลงหน้าที่ (SI-ROSTER): ข้ามไฟล์นี้ เพื่อใช้ระบบเด้งแบบเดิมของ SI-ROSTER
 */
(function () {
  'use strict';
  if (typeof window === 'undefined' || !window.location || !navigator) return;
  if (window.__DG_INAPP_RESOLVER_LOADED__) return;
  window.__DG_INAPP_RESOLVER_LOADED__ = true;

  try {
    var path = (window.location.pathname || '').toLowerCase();
    var host = (window.location.hostname || '').toLowerCase();

    // ระบบลงหน้าที่ (SI-ROSTER) ใช้ระบบเด้งแบบเดิม (line-browser-guard.js)
    if (path.includes('/si-roster') || path.includes('/roster') || host.startsWith('roster.') || host.startsWith('rosters.')) {
      return;
    }

    var ua = navigator.userAgent || navigator.vendor || window.opera || '';
    var search = window.location.search || '';

    var isAndroid = /Android/i.test(ua) || search.indexOf('test_android=1') !== -1;
    var isIOS = /iPhone|iPad|iPod/i.test(ua) || search.indexOf('test_ios=1') !== -1;

    // ตระกูล iPhone / iPad: ไม่บังคับไปเบราว์เซอร์เริ่มต้นแล้ว ให้รันในแอปได้ตามปกติ
    if (isIOS) return;

    // แอนดรอยด์: บังคับเปิดเบราว์เซอร์เริ่มต้นของเครื่อง
    if (!isAndroid) return;

    var isLine = /Line\//i.test(ua) || /LineApp/i.test(ua) || /LineClient/i.test(ua) || search.indexOf('test_line=1') !== -1;
    var isFacebook = /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua) || search.indexOf('test_fb=1') !== -1;
    var isInstagram = /Instagram/i.test(ua) || search.indexOf('test_ig=1') !== -1;
    var isMessenger = /Messenger/i.test(ua) || /FB_IAB\/MESSENGER/i.test(ua) || /FBAN\/MessengerLite/i.test(ua) || /FBAN\/Orca/i.test(ua) || search.indexOf('test_messenger=1') !== -1;
    var isTwitter = /Twitter|X\//i.test(ua) || search.indexOf('test_twitter=1') !== -1;
    var isTikTok = /musical_ly|ByteLocale|TikTok/i.test(ua) || search.indexOf('test_tiktok=1') !== -1;
    var isMicroMessenger = /MicroMessenger/i.test(ua);
    var isGenericWebView = /wv/i.test(ua) || /Version\/[0-9.]+\s+Chrome/i.test(ua) || /Build\/.+;\s+wv\)/i.test(ua) || search.indexOf('test_inapp=1') !== -1;

    var isInApp = isLine || isFacebook || isInstagram || isMessenger || isTwitter || isTikTok || isMicroMessenger || isGenericWebView;
    if (!isInApp) return;

    var lastRedir = sessionStorage.getItem('dg_inapp_redir_ts');
    if (lastRedir && (Date.now() - Number(lastRedir)) < 15000) return;

    var currentHref = window.location.href;

    // 1. Android LINE: ส่งคำสั่งเปิดเบราว์เซอร์หลักผ่าน openExternalBrowser=1
    if (isLine) {
      if (!/[?&]openExternalBrowser=1\b/i.test(window.location.search)) {
        sessionStorage.setItem('dg_inapp_redir_ts', String(Date.now()));
        var sep = currentHref.indexOf('?') !== -1 ? '&' : '?';
        window.location.replace(currentHref + sep + 'openExternalBrowser=1');
      }
      return;
    }

    // 2. Android: เด้งเปิด Default Browser ทันทีผ่าน Intent
    sessionStorage.setItem('dg_inapp_redir_ts', String(Date.now()));
    var rawTarget = window.location.host + window.location.pathname + window.location.search + window.location.hash;
    var scheme = (window.location.protocol || 'https:').replace(':', '') || 'https';
    var intentUrl = 'intent://' + rawTarget + '#Intent;scheme=' + scheme + ';action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end;';
    window.location.replace(intentUrl);
  } catch (e) {}
})();

/**
 * =========================================================================
 * 🌐 CLOUDFLARE TUNNEL CONFIGURATION (ไฟล์ตั้งค่าลิงก์เซิร์ฟเวอร์หลักจุดเดียว)
 * =========================================================================
 * 
 * 📌 คำแนะนำสำหรับผู้ดูแลระบบ:
 * เมื่อเครื่องเซิร์ฟเวอร์ดับ / เปิดเครื่องใหม่ หรือรัน Cloudflare Tunnel ใหม่
 * แล้วได้ลิงก์โดเมนใหม่ (เช่น https://xxxx-xxxx-xxxx.trycloudflare.com)
 * 
 * 👉 ให้นำลิงก์ใหม่มาวางแทนที่ในตัวแปร CLOUDFLARE_TUNNEL_URL ด้านล่างนี้เพียง "จุดเดียว":
 */

var _global = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);
_global.CLOUDFLARE_TUNNEL_URL = 'https://api.sarawatdc.site';

/**
 * =========================================================================
 * ⚙️ ระบบกระจายการเชื่อมต่ออัตโนมัติ (ห้ามแก้ไขโค้ดด้านล่างนี้)
 * =========================================================================
 * โค้ดส่วนนี้จะส่งค่าลิงก์ไปยังทุกหน้าของเว็บไซต์ (หน้าหลัก, ข่าวสาร, กิจกรรม, 
 * ตารางงาน, ปฏิทิน, สมัครสารวัตร, และ SI-ROSTER) พร้อมกันโดยอัตโนมัติทันที
 */
(function () {
  const root = typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this);

  // 1. ล้างค่าตกค้างใน LocalStorage เพื่อป้องกันเบราว์เซอร์จำ URL เก่าที่ปิดไปแล้ว
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('dg_sarawat_api_url');
    }
  } catch (e) {}

  function resolveApiBase() {
    const rawTunnel = (root.CLOUDFLARE_TUNNEL_URL || '').trim().replace(/\/+$/, '');
    const loc = typeof window !== 'undefined' && window.location ? window.location : { hostname: '', port: '', protocol: '' };
    const hostname = loc.hostname || '';
    const port = loc.port || '';
    const protocol = loc.protocol || '';

    // 1. ถ้าเปิดดูผ่านโดเมนเว็บไซต์จริง (sarawatdc.site หรือ vercel.app) หรือโดเมน Cloudflare
    // ให้เชื่อมต่อไปยังโดเมน API Backend หลัก (api.sarawatdc.site) โดยตรง
    if (
      hostname.endsWith('sarawatdc.site') ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.trycloudflare.com')
    ) {
      return rawTunnel || 'https://api.sarawatdc.site';
    }

    // 2. ถ้าเข้าผ่านพอร์ต 5000 ของ Express Backend โดยตรง
    if (port === '5000') {
      return '';
    }

    // 3. ถ้าทดสอบบน localhost หรือ 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === '' || port === '80' || port === '443') {
        return rawTunnel || 'http://localhost:5000';
      }
      return 'http://localhost:5000';
    }

    // 4. ถ้าเข้าผ่าน IP วงแลนเดียวกัน (Wi-Fi ภายใน เช่น 192.168.x.x, 10.x.x.x)
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
      if (port === '' || port === '80' || port === '443') {
        return rawTunnel || `${protocol}//${hostname}:5000`;
      }
      return `${protocol}//${hostname}:5000`;
    }

    // 5. ถ้าเปิดตรงจากไฟล์ (file://) หรือโฮสต์ภายนอกอื่นๆ
    return rawTunnel;
  }

  const activeBase = resolveApiBase();
  root.SARAWAT_API_BASE = activeBase;
  root.HARDCODED_TUNNEL_URL = (root.CLOUDFLARE_TUNNEL_URL || '').trim().replace(/\/+$/, '');
  root.getRosterApiBase = function () {
    return typeof root.SARAWAT_API_BASE === 'string' ? root.SARAWAT_API_BASE : resolveApiBase();
  };
})();
