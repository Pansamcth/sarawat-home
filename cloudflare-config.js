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

  /**
   * Helper function to get an asset URL from the API backend
   * Example: getSarawatAssetUrl('icons/sarawat-logo.png') -> 'https://api.sarawatdc.site/assets/icons/sarawat-logo.png'
   */
  root.getSarawatAssetUrl = function (subPath) {
    const base = (typeof root.SARAWAT_API_BASE === 'string' && root.SARAWAT_API_BASE)
      ? root.SARAWAT_API_BASE
      : (root.CLOUDFLARE_TUNNEL_URL || 'https://api.sarawatdc.site');
    const clean = String(subPath || '').replace(/^[\\/]+/, '').replace(/^assets[\\/]+/i, '');
    return `${base.replace(/\/+$/, '')}/assets/${clean}`;
  };

  // Smart Logo & Asset Loader (Auto-enhancer with Fallback)
  if (typeof document !== 'undefined') {
    const applyApiAssets = function () {
      try {
        const logoImgs = document.querySelectorAll('img[src*="sarawat-logo.png"], img[src*="school-logo.png"]');
        logoImgs.forEach(img => {
          if (img.dataset.apiAssetEnhanced) return;
          img.dataset.apiAssetEnhanced = 'true';
          const originalSrc = img.getAttribute('src');
          if (originalSrc && !originalSrc.startsWith('http') && !originalSrc.startsWith('data:')) {
            const apiSrc = root.getSarawatAssetUrl(originalSrc);
            img.onerror = function () {
              this.onerror = null;
              this.src = originalSrc;
            };
            img.src = apiSrc;
          }
        });
      } catch (e) {}
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyApiAssets);
    } else {
      applyApiAssets();
    }
  }
})();

