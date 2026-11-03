/**
 * In-App Browser Resolver
 * =========================================================================
 * - iPhone / iPad (iOS): ไม่บังคับไปเบราว์เซอร์เริ่มต้น อนุญาตให้เปิดใช้งาน
 *   ภายใน In-App Browser ได้ตามปกติโดยสมบูรณ์ ไม่บล็อก ไม่ขึ้นแจ้งเตือนใดๆ
 * - Android: บังคับเด้งเปิดเบราว์เซอร์หลักของเครื่อง (Default Browser) ทันที
 *   ผ่าน Intent (หรือ openExternalBrowser=1 สำหรับ LINE)
 * - ระบบลงหน้าที่ (SI-ROSTER): ข้ามการทำงานของไฟล์นี้ เพื่อให้ใช้ระบบเด้งแบบเดิม
 *   (SI-ROSTER/js/line-browser-guard.js) จัดการตามรูปแบบเฉพาะของระบบลงเวลา
 * =========================================================================
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || !window.location || !navigator) return;

  // ป้องกันการทำงานซ้ำซ้อน
  if (window.__DG_INAPP_RESOLVER_LOADED__) return;
  window.__DG_INAPP_RESOLVER_LOADED__ = true;

  function resolveInAppNavigation() {
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

    // ตระกูล iPhone / iPad: ไม่บังคับไปเบราว์เซอร์เริ่มต้นแล้ว ให้ใช้งานในแอปได้ตามปกติ
    if (isIOS) {
      return;
    }

    // เฉพาะ Android: บังคับเปิดเบราว์เซอร์หลักของเครื่อง
    if (!isAndroid) {
      return;
    }

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

    // ป้องกัน Redirect Loop ด้วย sessionStorage (debounce 15 วินาที)
    try {
      var lastRedir = sessionStorage.getItem('dg_inapp_redir_ts');
      if (lastRedir && (Date.now() - Number(lastRedir)) < 15000) {
        return;
      }
    } catch (e) {}

    var currentHref = window.location.href;

    // 1. Android LINE: ส่งคำสั่งเปิดเบราว์เซอร์หลักผ่าน openExternalBrowser=1
    if (isLine) {
      if (!/[?&]openExternalBrowser=1\b/i.test(window.location.search)) {
        try {
          sessionStorage.setItem('dg_inapp_redir_ts', String(Date.now()));
        } catch (e) {}

        var sep = currentHref.indexOf('?') !== -1 ? '&' : '?';
        window.location.replace(currentHref + sep + 'openExternalBrowser=1');
        return;
      }
    }

    // 2. Android In-App อื่นๆ (Facebook, Instagram, TikTok, WebViews ฯลฯ): เด้งเปิด Default Browser ทันทีผ่าน Intent
    try {
      sessionStorage.setItem('dg_inapp_redir_ts', String(Date.now()));
    } catch (e) {}

    var rawTarget = window.location.host + window.location.pathname + window.location.search + window.location.hash;
    var scheme = (window.location.protocol || 'https:').replace(':', '') || 'https';
    var intentUrl = 'intent://' + rawTarget + '#Intent;scheme=' + scheme + ';action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end;';

    window.location.replace(intentUrl);
  }

  // รันตรวจสอบทันที
  resolveInAppNavigation();
})();
