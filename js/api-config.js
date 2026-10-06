/**
 * Sarawat Portfolio - Central API & Server Configuration
 * ========================================================
 * จัดการการเชื่อมต่อระหว่างหน้าเว็บกับระบบหลังบ้าน (Node.js + MySQL + Cloudflare Tunnel)
 */

(function () {
  // =========================================================================
  // ⚙️ กำหนด URL ของ Cloudflare Tunnel (หรือโดเมนหลังบ้านของคุณ)
  // หากคุณเปิด Cloudflare Tunnel แล้วได้ลิงก์ เช่น https://xxxx.trycloudflare.com
  // สามารถนำมาวางในเครื่องหมายคำพูดด้านล่างนี้ เพื่อให้ผู้ใช้ภายนอก/มือถือทุกคนเชื่อมต่อได้ทันที
  // =========================================================================
  const HARDCODED_TUNNEL_URL = 'https://sponsor-output-dietary-feat.trycloudflare.com'; // <-- วางลิงก์ Cloudflare ที่นี่ได้ (ถ้ามี)

  function getActiveApiBase() {
    // 1. อ่านจากค่าที่ผู้ดูแลระบบตั้งไว้ในหน้า Admin Settings (LocalStorage)
    const saved = localStorage.getItem('dg_sarawat_api_url');
    if (saved && saved.trim().length > 0) {
      return saved.trim().replace(/\/+$/, '');
    }

    // 2. หากรันบนเครื่องตนเอง (Localhost) ให้ชี้ไปที่พอร์ต 5000 ของ Node.js อัตโนมัติ
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // 3. หากมีกำหนด Hardcoded Cloudflare URL ไว้
    if (HARDCODED_TUNNEL_URL && HARDCODED_TUNNEL_URL.trim().length > 0) {
      return HARDCODED_TUNNEL_URL.trim().replace(/\/+$/, '');
    }

    return '';
  }

  window.SARAWAT_API_BASE = getActiveApiBase();

  /**
   * แปลงที่อยู่รูปภาพให้สมบูรณ์
   * - หากเป็น /uploads/... และมี API Server จะต่อ URL เซิร์ฟเวอร์ให้
   * - หากเป็น https:// หรือ assets/... จะใช้ตามปกติ
   */
  window.resolveImageUrl = function (imgUrl) {
    if (!imgUrl) return 'assets/images/hero-assembly.jpg';
    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('data:')) {
      return imgUrl;
    }
    if (imgUrl.startsWith('/uploads/')) {
      const base = window.SARAWAT_API_BASE || getActiveApiBase();
      if (base) return base + imgUrl;
    }
    return imgUrl;
  };

  /**
   * รวม Service Functions สำหรับเรียกใช้ Backend API
   */
  window.SarawatApi = {
    getBaseUrl: function () {
      return window.SARAWAT_API_BASE || getActiveApiBase();
    },

    setBaseUrl: function (url) {
      const clean = (url || '').trim().replace(/\/+$/, '');
      if (clean) {
        localStorage.setItem('dg_sarawat_api_url', clean);
      } else {
        localStorage.removeItem('dg_sarawat_api_url');
      }
      window.SARAWAT_API_BASE = clean || getActiveApiBase();
      return window.SARAWAT_API_BASE;
    },

    // ตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์
    checkHealth: async function () {
      const base = this.getBaseUrl();
      if (!base) return { online: false, reason: 'ไม่ได้ระบุ Server URL' };
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${base}/api/health`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          return { online: true, data: data, baseUrl: base };
        }
        return { online: false, status: res.status, reason: `HTTP ${res.status}` };
      } catch (err) {
        return { online: false, reason: err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' };
      }
    },

    // ดึงรายการข่าวสารทั้งหมด
    getNews: async function () {
      const base = this.getBaseUrl();
      if (!base) return null;
      try {
        const res = await fetch(`${base}/api/news`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('[SarawatApi] Fetch news failed, using local fallback:', err.message);
        return null;
      }
    },

    // บันทึก/อัปเดตข่าวสาร
    saveNews: async function (item) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการบันทึกข่าว (HTTP ${res.status})`);
      return await res.json();
    },

    // ลบข่าวสาร
    deleteNews: async function (id) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/news/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการลบข่าว (HTTP ${res.status})`);
      return await res.json();
    },

    // อัปโหลดไฟล์รูปภาพ (บันทึกลงโฟลเดอร์ uploads ของเซิร์ฟเวอร์จริง ไม่เปลือง Quota localStorage)
    uploadImage: async function (file) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('เซิร์ฟเวอร์ยังไม่ได้เชื่อมต่อ ไม่สามารถอัปโหลดไฟล์ได้');
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${base}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `อัปโหลดไม่สำเร็จ (HTTP ${res.status})`);
      }
      return await res.json(); // { success: true, url: '/uploads/activity_xxx.jpg', ... }
    },

    // ดึงตารางกิจกรรมปฏิทิน
    getEvents: async function () {
      const base = this.getBaseUrl();
      if (!base) return null;
      try {
        const res = await fetch(`${base}/api/events`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('[SarawatApi] Fetch events failed, using local fallback:', err.message);
        return null;
      }
    },

    // บันทึกกิจกรรมปฏิทิน
    saveEvent: async function (item) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการบันทึกกิจกรรม (HTTP ${res.status})`);
      return await res.json();
    },

    // ลบกิจกรรมปฏิทิน
    deleteEvent: async function (id) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/events/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการลบกิจกรรม (HTTP ${res.status})`);
      return await res.json();
    },

    // ดึงกิจกรรมเด่น
    getFeatured: async function () {
      const base = this.getBaseUrl();
      if (!base) return null;
      try {
        const res = await fetch(`${base}/api/featured`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('[SarawatApi] Fetch featured event failed:', err.message);
        return null;
      }
    },

    // บันทึกกิจกรรมเด่น
    saveFeatured: async function (item) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการบันทึกกิจกรรมเด่น (HTTP ${res.status})`);
      return await res.json();
    }
  };
})();
