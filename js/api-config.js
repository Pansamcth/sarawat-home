/**
 * Sarawat Portfolio - Central API & Server Configuration
 * ========================================================
 * จัดการการเชื่อมต่อระหว่างหน้าเว็บกับระบบหลังบ้าน (Node.js + SQLite + Cloudflare Tunnel)
 */

(function () {
  // =========================================================================
  // ⚙️ กำหนด URL ของ Cloudflare Tunnel (หรือโดเมนหลังบ้านของคุณ)
  // หากคุณเปิด Cloudflare Tunnel แล้วได้ลิงก์ เช่น https://xxxx.trycloudflare.com
  // สามารถนำมาวางในเครื่องหมายคำพูดด้านล่างนี้ เพื่อให้ผู้ใช้ภายนอก/มือถือทุกคนเชื่อมต่อได้ทันที
  // =========================================================================
  const HARDCODED_TUNNEL_URL = 'https://justify-clearing-changelog-reserved.trycloudflare.com'; // <-- ลิงก์ Cloudflare ที่กำลังออนไลน์อยู่ขณะนี้

  function getActiveApiBase() {
    const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');

    // 1. อ่านจากค่าที่ผู้ดูแลระบบตั้งไว้ในหน้า Admin Settings (LocalStorage)
    const saved = localStorage.getItem('dg_sarawat_api_url');
    if (saved && saved.trim().length > 0) {
      const cleanSaved = saved.trim().replace(/\/+$/, '');
      // หากอยู่ในเครื่องตนเอง แต่ URL ที่บันทึกไว้เป็น Tunnel ภายนอกที่อาจปิดไปแล้ว 
      // ให้ลองใช้ แต่ถ้าล้มเหลวระบบจะมี fallback ไป localhost:5000 อัตโนมัติ
      return cleanSaved;
    }

    // 2. หากรันบนเครื่องตนเอง (Localhost หรือเปิดไฟล์ HTML โดยตรง) ให้ชี้ไปที่พอร์ต 5000 ของ Node.js อัตโนมัติ
    if (isLocal) {
      return 'http://localhost:5000';
    }

    // 3. หากมีกำหนด Hardcoded Cloudflare URL ไว้ (สำหรับผู้ใช้งานจากมือถือ / Vercel)
    if (HARDCODED_TUNNEL_URL && HARDCODED_TUNNEL_URL.trim().length > 0) {
      return HARDCODED_TUNNEL_URL.trim().replace(/\/+$/, '');
    }

    return '';
  }

  window.SARAWAT_API_BASE = getActiveApiBase();

  // =========================================================================
  // 🖼️ ภาพกิจกรรมเริ่มต้น (Default Activity Fallback Image)
  // หากกิจกรรมไม่ได้ระบุรูปภาพ หรือรูปภาพไม่สามารถแสดงผล/Preview ได้
  // =========================================================================
  window.DEFAULT_ACTIVITY_IMAGE = 'https://cdn.discordapp.com/attachments/1479543947729572056/1557028658848469082/Your_paragraph_text.png?backend=b2&ex=6ac64f70&is=6ac4fdf0&hm=810cd2a997d892b5ab2fc596108867ffd95742c92c2244df4aeae31d4da944c5&';
  window.LOCAL_ACTIVITY_IMAGE_FALLBACK = 'assets/images/default-activity.png';

  /**
   * จัดการเมื่อรูปภาพกิจกรรมโหลดไม่สำเร็จ (onerror)
   * 1. สลับไปใช้ DEFAULT_ACTIVITY_IMAGE ตามที่ผู้ใช้กำหนด
   * 2. หากยังโหลดไม่ได้อีก (เช่น Discord ลิงก์หมดอายุ) สลับเป็น Local PNG สำรอง
   */
  window.handleActivityImageError = function (img) {
    if (!img) return;
    const primaryFallback = window.DEFAULT_ACTIVITY_IMAGE;
    const localFallback = window.LOCAL_ACTIVITY_IMAGE_FALLBACK || 'assets/images/default-activity.png';

    if (img.src !== primaryFallback && !img.dataset.hasFailedDiscordFallback) {
      img.dataset.hasFailedDiscordFallback = 'true';
      img.src = primaryFallback;
    } else {
      img.src = localFallback;
      img.onerror = null;
    }
  };

  /**
   * แปลงที่อยู่รูปภาพให้สมบูรณ์
   * - หากไม่มีรูปภาพ ให้ใช้ DEFAULT_ACTIVITY_IMAGE
   * - หากเป็น /uploads/... และมี API Server จะต่อ URL เซิร์ฟเวอร์ให้
   * - หากเป็น https:// หรือ data: จะใช้ตามปกติ
   */
  window.resolveImageUrl = function (imgUrl) {
    if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
      return window.DEFAULT_ACTIVITY_IMAGE;
    }
    const cleanUrl = imgUrl.trim();

    // กรองและถอดภาพ AI ทั้งระบบออก แล้วแทนที่ด้วยภาพกิจกรรมเริ่มต้น
    const AI_IMAGE_NAMES = [
      'activity-ceremony',
      'activity-inspection',
      'activity-volunteer',
      'activity-training',
      'activity-teamwork',
      'hero-assembly'
    ];
    if (AI_IMAGE_NAMES.some(aiName => cleanUrl.toLowerCase().includes(aiName))) {
      return window.DEFAULT_ACTIVITY_IMAGE;
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
      return cleanUrl;
    }
    if (cleanUrl.startsWith('/uploads/')) {
      const base = window.SARAWAT_API_BASE || getActiveApiBase();
      if (base) return base + cleanUrl;
    }
    return cleanUrl;
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

    // ตรวจสอบสถานะการทำงานของระบบฐานข้อมูล
    checkHealth: async function () {
      const base = this.getBaseUrl();
      if (!base) return { online: false, reason: 'ไม่ได้ระบุระบบฐานข้อมูล' };
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
        return { online: false, reason: err.message || 'ไม่สามารถเชื่อมต่อระบบฐานข้อมูลได้' };
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
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูล');
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
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูล');
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

    // ดึงตารางกิจกรรมปฏิทินโรงเรียน
    getEvents: async function (options = {}) {
      const base = this.getBaseUrl();
      let rawEvents = null;

      if (base) {
        try {
          const res = await fetch(`${base}/api/events`);
          if (res.ok) {
            rawEvents = await res.json();
            if (Array.isArray(rawEvents)) {
              try {
                localStorage.setItem('dg_sarawat_events_items', JSON.stringify(rawEvents));
              } catch (e) {}
            }
          }
        } catch (err) {
          console.warn('[SarawatApi] Fetch events failed, trying local fallback:', err.message);
        }
      }

      if (!Array.isArray(rawEvents)) {
        try {
          const stored = localStorage.getItem('dg_sarawat_events_items');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) rawEvents = parsed;
          }
        } catch (e) {}
      }

      if (!Array.isArray(rawEvents)) {
        rawEvents = [];
      }

      // Helper function to convert ISO date or Thai date to timestamp
      const getEventTimestamp = (evt) => {
        if (!evt) return 0;
        if (evt.dateStart) {
          const ts = new Date(evt.dateStart + 'T00:00:00Z').getTime();
          if (!isNaN(ts)) return ts;
        }
        if (evt.dateIso) {
          const ts = new Date(evt.dateIso + 'T00:00:00Z').getTime();
          if (!isNaN(ts)) return ts;
        }
        const dateStr = (evt.day || '') + ' ' + (evt.month || '');
        const numMatch = dateStr.match(/\d+/g);
        if (numMatch) {
          const d = parseInt(numMatch[0], 10) || 1;
          return Date.UTC(2026, 9, d, 0, 0, 0);
        }
        return 0;
      };

      // Current local date YYYY-MM-DD
      const now = new Date();
      const todayIso = now.toLocaleDateString('en-CA'); // YYYY-MM-DD

      let processed = rawEvents.slice();

      // Filter by category if requested
      if (options.category && options.category !== 'all') {
        processed = processed.filter(e => (e.category === options.category || e.categoryLabel === options.category));
      }

      // Filter by search query
      if (options.q && options.q.trim()) {
        const q = options.q.trim().toLowerCase();
        processed = processed.filter(e =>
          (e.title && e.title.toLowerCase().includes(q)) ||
          (e.desc && e.desc.toLowerCase().includes(q)) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.audience && e.audience.toLowerCase().includes(q)) ||
          (e.categoryLabel && e.categoryLabel.toLowerCase().includes(q))
        );
      }

      // Filter upcoming if requested
      if (options.upcoming) {
        processed = processed.filter(e => {
          const end = (e.dateEnd || '').trim();
          const start = (e.dateStart || e.dateIso || '').trim();
          const effectiveEnd = end || start;
          if (effectiveEnd) {
            return effectiveEnd >= todayIso;
          }
          // If no ISO date, check timestamp against today
          const ts = getEventTimestamp(e);
          const todayTs = new Date(todayIso + 'T00:00:00Z').getTime();
          return ts >= todayTs;
        });

        // Sort upcoming: Closest date to today comes first (Ascending)
        processed.sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
      } else {
        // Default calendar view: Chronological order (Earliest to latest)
        processed.sort((a, b) => getEventTimestamp(a) - getEventTimestamp(b));
      }

      // Limit results if requested
      if (options.limit && Number(options.limit) > 0) {
        processed = processed.slice(0, Number(options.limit));
      }

      return processed;
    },

    // บันทึก/อัปเดตกิจกรรมปฏิทิน
    saveEvent: async function (item) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูลหลัก');

      // Normalize fields
      const payload = {
        id: item.id || ('evt-' + Date.now()),
        title: item.title || '',
        day: item.day || '',
        month: item.month || '',
        weekday: item.weekday || '',
        category: item.category || 'general',
        categoryLabel: item.categoryLabel || '',
        time: item.time || 'เต็มวัน',
        location: item.location || '',
        audience: item.audience || item.target || '',
        desc: item.desc || item.note || '',
        dateStart: item.dateStart || item.date_start || '',
        dateEnd: item.dateEnd || item.date_end || ''
      };

      const res = await fetch(`${base}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการบันทึกกิจกรรม (HTTP ${res.status})`);
      const data = await res.json();

      // Update local cache
      try {
        let events = [];
        const stored = localStorage.getItem('dg_sarawat_events_items');
        if (stored) events = JSON.parse(stored) || [];
        const idx = events.findIndex(e => String(e.id) === String(payload.id));
        if (idx >= 0) {
          events[idx] = payload;
        } else {
          events.push(payload);
        }
        localStorage.setItem('dg_sarawat_events_items', JSON.stringify(events));
      } catch (e) {}

      return data;
    },

    // ลบกิจกรรมปฏิทิน
    deleteEvent: async function (id) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูลหลัก');

      const res = await fetch(`${base}/api/events/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการลบกิจกรรม (HTTP ${res.status})`);
      const data = await res.json();

      // Remove from local cache
      try {
        let events = [];
        const stored = localStorage.getItem('dg_sarawat_events_items');
        if (stored) events = JSON.parse(stored) || [];
        events = events.filter(e => String(e.id) !== String(id));
        localStorage.setItem('dg_sarawat_events_items', JSON.stringify(events));
      } catch (e) {}

      return data;
    },

    // ดึงหมวดหมู่กิจกรรม
    getCategories: function () {
      return [
        { key: 'general', label: 'กิจกรรมทั่วไป', desc: 'กิจกรรมทั่วไปของโรงเรียน', color: 'cat-general' },
        { key: 'affairs', label: 'งานกิจการนักเรียน', desc: 'กิจกรรมที่เกี่ยวข้องกับฝ่าย/กลุ่มงานกิจการนักเรียน', color: 'cat-affairs' },
        { key: 'academic', label: 'งานวิชาการ', desc: 'กิจกรรมด้านการเรียน การสอบ การแข่งขัน หรือภารกิจทางวิชาการ', color: 'cat-academic' },
        { key: 'prefect', label: 'ภารกิจสารวัตร', desc: 'กิจกรรมหรือภารกิจที่เกี่ยวข้องกับสารวัตรนักเรียน', color: 'cat-prefect' }
      ];
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
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูล');
      const res = await fetch(`${base}/api/featured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!res.ok) throw new Error(`เกิดข้อผิดพลาดในการบันทึกกิจกรรมเด่น (HTTP ${res.status})`);
      return await res.json();
    },

    // ==========================================
    // 🔐 ADMIN AUTH & MANAGEMENT APIS
    // ==========================================
    getSetupStatus: async function () {
      const base = this.getBaseUrl();
      if (!base) return { needsSetup: false, offline: true };
      try {
        const res = await fetch(`${base}/api/admins/setup-status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
        if (isLocal && base !== 'http://localhost:5000') {
          try {
            const retryRes = await fetch('http://localhost:5000/api/admins/setup-status');
            if (retryRes.ok) {
              this.setBaseUrl('http://localhost:5000');
              return await retryRes.json();
            }
          } catch (retryErr) {
            // ignore
          }
        }
        console.warn('[SarawatApi] getSetupStatus failed:', err.message);
        return { needsSetup: false, offline: true };
      }
    },

    setupSuperAdmin: async function (username, password) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/admins/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'สร้างบัญชี Super Admin ไม่สำเร็จ');
      }
      return data;
    },

    login: async function (username, password) {
      let base = this.getBaseUrl();
      if (!base) {
        const err = new Error('⚠️ ไม่พบการเชื่อมต่อระบบฐานข้อมูล');
        err.isNetworkError = true;
        throw err;
      }

      const doLoginFetch = async (targetBase) => {
        const res = await fetch(`${targetBase}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          const err = new Error(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
          err.isAuthError = true;
          throw err;
        }
        return data;
      };

      try {
        return await doLoginFetch(base);
      } catch (err) {
        if (err.isAuthError) throw err;

        // หากกำลังเปิดบนเครื่องตนเอง และ URL ปัจจุบันไม่ใช่ localhost:5000 ให้ลอง fallback ไปยัง localhost:5000
        const isLocal = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:');
        if (isLocal && base !== 'http://localhost:5000') {
          try {
            console.warn('[SarawatApi] Primary URL connection failed, falling back to http://localhost:5000...');
            const retryData = await doLoginFetch('http://localhost:5000');
            this.setBaseUrl('http://localhost:5000');
            return retryData;
          } catch (retryErr) {
            if (retryErr.isAuthError) throw retryErr;
          }
        }

        const netErr = new Error('⚠️ ไม่สามารถเชื่อมต่อระบบฐานข้อมูลได้');
        netErr.isNetworkError = true;
        throw netErr;
      }
    },

    getAdmins: async function () {
      const base = this.getBaseUrl();
      if (!base) return null;
      try {
        const res = await fetch(`${base}/api/admins`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('[SarawatApi] getAdmins failed:', err.message);
        return null;
      }
    },

    createAdmin: async function (username, password, role) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เพิ่มผู้ดูแลระบบไม่สำเร็จ');
      }
      return data;
    },

    deleteAdmin: async function (id) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/admins/${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'ลบผู้ดูแลระบบไม่สำเร็จ');
      }
      return data;
    },

    resetAdminPassword: async function (id, newPassword) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/admins/${encodeURIComponent(id)}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
      }
      return data;
    },

    changePassword: async function (username, currentPassword, newPassword) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อเซิร์ฟเวอร์หลังบ้าน');
      const res = await fetch(`${base}/api/admins/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
      return data;
    }
  };
})();
