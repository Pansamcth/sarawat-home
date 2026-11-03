/**
 * In-App Browser Resolver
 * =========================================================================
 * ตรวจจับและจัดการการเข้าชมเว็บผ่าน In-App Browser (LINE, Facebook, Instagram,
 * Messenger, Twitter/X, TikTok, WeChat และ WebViews):
 * - Android: เด้งเปิดเบราว์เซอร์หลักของระบบ (Default Browser) ทันทีอัตโนมัติ
 *   ผ่าน Android Intent URL Scheme
 * - iOS: หากเป็นแอป LINE จะเด้งเปิด Safari ผ่าน openExternalBrowser=1 ทันที
 *   ส่วนแอปอื่นๆ บน iOS (FB, IG ฯลฯ) ที่ระบบปฏิบัติการไม่อนุญาตให้สั่งเด้งภายนอก
 *   จะอนุญาตให้เข้าใช้งานเว็บได้ตามปกติ โดยไม่บล็อกและไม่ขึ้นกล่องแจ้งเตือนใดๆ
 * =========================================================================
 */
(function () {
  'use strict';

  if (typeof window === 'undefined' || !window.location || !navigator) return;

  // ป้องกันการทำงานซ้ำซ้อนหากโหลดหลายสคริปต์
  if (window.__DG_INAPP_RESOLVER_LOADED__) return;
  window.__DG_INAPP_RESOLVER_LOADED__ = true;

  function getDetectionInfo() {
    var ua = navigator.userAgent || navigator.vendor || window.opera || '';
    var search = window.location.search || '';

    var isAndroid = /Android/i.test(ua) || search.indexOf('test_android=1') !== -1;
    var isIOS = /iPhone|iPad|iPod/i.test(ua) || search.indexOf('test_ios=1') !== -1;

    var isLine = /Line\//i.test(ua) || /LineApp/i.test(ua) || /LineClient/i.test(ua) || search.indexOf('test_line=1') !== -1;
    var isFacebook = /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua) || search.indexOf('test_fb=1') !== -1;
    var isInstagram = /Instagram/i.test(ua) || search.indexOf('test_ig=1') !== -1;
    var isMessenger = /Messenger/i.test(ua) || /FB_IAB\/MESSENGER/i.test(ua) || /FBAN\/MessengerLite/i.test(ua) || /FBAN\/Orca/i.test(ua) || search.indexOf('test_messenger=1') !== -1;
    var isTwitter = /Twitter|X\//i.test(ua) || search.indexOf('test_twitter=1') !== -1;
    var isTikTok = /musical_ly|ByteLocale|TikTok/i.test(ua) || search.indexOf('test_tiktok=1') !== -1;
    var isMicroMessenger = /MicroMessenger/i.test(ua);
    var isGenericWebView = (isAndroid && (/wv/i.test(ua) || /Version\/[0-9.]+\s+Chrome/i.test(ua) || /Build\/.+;\s+wv\)/i.test(ua))) || search.indexOf('test_inapp=1') !== -1;

    var isInApp = isLine || isFacebook || isInstagram || isMessenger || isTwitter || isTikTok || isMicroMessenger || isGenericWebView;

    return {
      isInApp: isInApp,
      isAndroid: isAndroid,
      isIOS: isIOS,
      isLine: isLine,
      isFacebook: isFacebook,
      isInstagram: isInstagram,
      isMessenger: isMessenger,
      isTwitter: isTwitter,
      isTikTok: isTikTok,
      isGenericWebView: isGenericWebView
    };
  }

  function resolveInAppNavigation() {
    var info = getDetectionInfo();
    if (!info.isInApp) return;

    // ป้องกัน Redirect Loop ด้วย sessionStorage (debounce 15 วินาที)
    try {
      var lastRedir = sessionStorage.getItem('dg_inapp_redir_ts');
      if (lastRedir && (Date.now() - Number(lastRedir)) < 15000) {
        return;
      }
    } catch (e) {}

    var currentHref = window.location.href;

    // 1. LINE (ทั้งบน iOS และ Android รองรับ openExternalBrowser=1 อย่างเป็นทางการ)
    if (info.isLine) {
      if (!/[?&]openExternalBrowser=1\b/i.test(window.location.search)) {
        try {
          sessionStorage.setItem('dg_inapp_redir_ts', String(Date.now()));
        } catch (e) {}

        var sep = currentHref.indexOf('?') !== -1 ? '&' : '?';
        window.location.replace(currentHref + sep + 'openExternalBrowser=1');
        return;
      }
      return;
    }

    // 2. Android: เด้งเปิดเบราว์เซอร์หลักของเครื่อง (Default Browser) ทันทีผ่าน Intent
    if (info.isAndroid) {
      try {
        sessionStorage.setItem('dg_inapp_redir_ts', String(Date.now()));
      } catch (e) {}

      var rawTarget = window.location.host + window.location.pathname + window.location.search + window.location.hash;
      var scheme = (window.location.protocol || 'https:').replace(':', '') || 'https';
      var intentUrl = 'intent://' + rawTarget + '#Intent;scheme=' + scheme + ';action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end;';

      window.location.replace(intentUrl);
      return;
    }

    // 3. iOS สำหรับแอปอื่นๆ (เช่น Facebook, Instagram, Twitter, TikTok):
    // ไม่บล็อก ไม่ขึ้นแจ้งเตือน ปล่อยให้ใช้งานภายใน In-App Browser ได้ตามปกติ
  }

  // เรียกทำงานทันทีเพื่อความรวดเร็วก่อนที่ DOM จะเรนเดอร์
  resolveInAppNavigation();

  // Export functions สำหรับใช้งานเพิ่มเติมหรือตรวจสอบย้อนหลัง
  window.dgInAppInfo = getDetectionInfo;
  window.checkInAppBrowser = function () {
    var info = getDetectionInfo();
    return { detected: info.isInApp, info: info };
  };
  window.checkLineInAppBrowser = function () {
    return getDetectionInfo().isLine;
  };
  window.showLineBrowserBlocker = function () {};
  window.showInAppBrowserBlocker = function () {};
})();
