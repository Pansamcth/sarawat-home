/**
 * Sarawat Portfolio - Central API & Server Configuration
 * ========================================================
 * จัดการการเชื่อมต่อระหว่างหน้าเว็บกับระบบหลังบ้าน (Node.js + SQLite + Cloudflare Tunnel)
 */

(function () {
  // =========================================================================
  // ⚙️ ลิงก์ Cloudflare Tunnel อ่านค่าจาก cloudflare-config.js เป็นหลัก
  // =========================================================================
  const HARDCODED_TUNNEL_URL = (window.CLOUDFLARE_TUNNEL_URL || window.HARDCODED_TUNNEL_URL || '').trim().replace(/\/+$/, '');

  function getActiveApiBase() {
    if (window.SARAWAT_API_BASE && window.SARAWAT_API_BASE.trim().length > 0) {
      return window.SARAWAT_API_BASE.trim().replace(/\/+$/, '');
    }

    const hostname = window.location.hostname || '';
    const port = window.location.port || '';
    const protocol = window.location.protocol || '';

    // 1. ถ้าเข้าผ่านโดเมน Cloudflare โดยตรง
    if (hostname.endsWith('.trycloudflare.com')) {
      return '';
    }

    // 2. ถ้าเข้าผ่านพอร์ต 5000 ของ Node.js
    if (port === '5000') {
      return '';
    }

    // 3. ถ้าอยู่บน Localhost / 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === '' || port === '80' || port === '443') {
        return HARDCODED_TUNNEL_URL || 'http://localhost:5000';
      }
      return 'http://localhost:5000';
    }

    // 4. ถ้าอยู่บนวงแลนเดียวกัน (192.168.x.x)
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
      if (port === '' || port === '80' || port === '443') {
        return HARDCODED_TUNNEL_URL || `${protocol}//${hostname}:5000`;
      }
      return `${protocol}//${hostname}:5000`;
    }

    // 5. ผู้ใช้งานภายนอก (มือถือ, Vercel, sarawatdc.site, file://)
    return HARDCODED_TUNNEL_URL;
  }

  window.SARAWAT_API_BASE = getActiveApiBase();

  // =========================================================================
  // 🖼️ ภาพกิจกรรมเริ่มต้น (Default Activity Fallback Image)
  // หากกิจกรรมไม่ได้ระบุรูปภาพ หรือรูปภาพไม่สามารถแสดงผล/Preview ได้
  // =========================================================================
  window.DEFAULT_ACTIVITY_IMAGE = 'assets/images/activities-cover.jpg';
  window.LOCAL_ACTIVITY_IMAGE_FALLBACK = 'assets/images/activities-cover.jpg';

  /**
   * จัดการเมื่อรูปภาพกิจกรรมโหลดไม่สำเร็จ (onerror)
   * ป้องกันรูปภาพแตกโดยการสลับไปใช้รูปหน้าปกกิจกรรมมาตรฐานของระบบ
   */
  window.handleActivityImageError = function (img) {
    if (!img) return;
    const fallback = window.DEFAULT_ACTIVITY_IMAGE || 'assets/images/activities-cover.jpg';
    if (img.src && !img.src.includes('activities-cover.jpg')) {
      img.src = fallback;
    } else if (!img.src.includes('default-activity.png')) {
      img.src = 'assets/images/default-activity.png';
    } else {
      img.onerror = null;
    }
  };

  /**
   * แปลงที่อยู่รูปภาพให้สมบูรณ์
   * - หากไม่มีรูปภาพ ให้ใช้ DEFAULT_ACTIVITY_IMAGE
   * - หากเป็นลิงก์ Discord เก่าที่หมดอายุ ให้สลับเป็นภาพปกมาตรฐานอัตโนมัติ
   * - หากเป็น /uploads/... จะแปลงให้เป็นลิงก์สมบูรณ์
   * - หากเป็น https:// หรือ data: จะใช้ตามปกติ
   */
  window.resolveImageUrl = function (imgUrl) {
    if (!imgUrl || typeof imgUrl !== 'string' || imgUrl.trim() === '') {
      return window.DEFAULT_ACTIVITY_IMAGE || 'assets/images/activities-cover.jpg';
    }
    const cleanUrl = imgUrl.trim();

    // แทนที่ลิงก์ Discord CDN ที่หมดอายุ (404/403) ด้วยภาพปกมาตรฐาน
    if (cleanUrl.includes('discordapp.com') || cleanUrl.includes('discord.com')) {
      return window.DEFAULT_ACTIVITY_IMAGE || 'assets/images/activities-cover.jpg';
    }

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
      return window.DEFAULT_ACTIVITY_IMAGE || 'assets/images/activities-cover.jpg';
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://') || cleanUrl.startsWith('data:')) {
      return cleanUrl;
    }
    if (cleanUrl.startsWith('/uploads/')) {
      const base = window.SARAWAT_API_BASE || getActiveApiBase();
      if (base) return base + cleanUrl;
      return cleanUrl;
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

    // ==========================================
    // 🔐 AUTH TOKEN & SESSION MANAGEMENT
    // ==========================================
    TOKEN_KEY: 'dg_sarawat_auth_token',
    USER_KEY: 'dg_sarawat_auth_user',

    getAuthToken: function () {
      try {
        return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY) || '';
      } catch (e) {
        return '';
      }
    },

    setAuthToken: function (token, rememberMe = true) {
      if (!token) return;
      try {
        if (rememberMe) {
          localStorage.setItem(this.TOKEN_KEY, token);
        } else {
          sessionStorage.setItem(this.TOKEN_KEY, token);
        }
      } catch (e) {}
    },

    getAuthUser: function () {
      try {
        const stored = localStorage.getItem(this.USER_KEY) || sessionStorage.getItem(this.USER_KEY);
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    },

    setAuthUser: function (user, rememberMe = true) {
      if (!user) return;
      try {
        const str = JSON.stringify(user);
        if (rememberMe) {
          localStorage.setItem(this.USER_KEY, str);
        } else {
          sessionStorage.setItem(this.USER_KEY, str);
        }
      } catch (e) {}
    },

    clearAuth: function () {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        sessionStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        sessionStorage.removeItem(this.USER_KEY);
      } catch (e) {}
    },

    getAuthHeaders: function (customHeaders = {}) {
      const headers = { ...customHeaders };
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }
      return headers;
    },

    verifyAuth: async function () {
      const base = this.getBaseUrl();
      const token = this.getAuthToken();
      if (!base || !token) {
        return { valid: false, reason: 'No token or offline' };
      }
      try {
        const res = await fetch(`${base}/api/auth/verify`, {
          headers: this.getAuthHeaders({ 'Accept': 'application/json' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.valid && data.user) {
            this.setAuthUser(data.user);
            return { valid: true, user: data.user };
          }
        }
        if (res.status === 401) {
          this.clearAuth();
        }
        return { valid: false, status: res.status };
      } catch (err) {
        const user = this.getAuthUser();
        return { valid: !!user, user: user, offline: true, error: err.message };
      }
    },

    logout: async function () {
      const base = this.getBaseUrl();
      const token = this.getAuthToken();
      if (base && token) {
        try {
          await fetch(`${base}/api/logout`, {
            method: 'POST',
            headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ token })
          });
        } catch (e) {}
      }
      this.clearAuth();
      return { success: true };
    },

    getSettings: async function () {
      const base = this.getBaseUrl();
      if (!base) return {};
      try {
        const res = await fetch(`${base}/api/settings`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.warn('[SarawatApi] getSettings failed:', err.message);
        return {};
      }
    },

    saveSettings: async function (settings) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูล');
      const res = await fetch(`${base}/api/settings`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error(`บันทึกการตั้งค่าไม่สำเร็จ (HTTP ${res.status})`);
      return await res.json();
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        method: 'DELETE',
        headers: this.getAuthHeaders()
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
        headers: this.getAuthHeaders(),
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        method: 'DELETE',
        headers: this.getAuthHeaders()
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
        { key: 'prefect', label: 'ภารกิจสารวัตร', desc: 'กิจกรรมหรือภารกิจที่เกี่ยวข้องกับสารวัตรนักเรียน', color: 'cat-prefect' },
        { key: 'holiday', label: 'วันหยุด', desc: 'วันหยุดนักขัตฤกษ์ วันหยุดราชการ หรือวันหยุดพิเศษของโรงเรียน', color: 'cat-holiday' }
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        if (data.token) {
          this.setAuthToken(data.token, true);
        }
        if (data.user) {
          this.setAuthUser({ username: data.user, role: data.role || 'Admin' }, true);
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
        const res = await fetch(`${base}/api/admins`, {
          headers: this.getAuthHeaders()
        });
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        method: 'DELETE',
        headers: this.getAuthHeaders()
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
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
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ username, currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
      return data;
    },

    // ==========================================
    // 📬 FEEDBACK & COMPLAINTS APIS
    // ==========================================
    getFeedbacks: async function (options = {}) {
      const base = this.getBaseUrl();
      let list = null;

      if (base) {
        try {
          const params = new URLSearchParams();
          if (options.type && options.type !== 'all') params.append('type', options.type);
          if (options.status && options.status !== 'all') params.append('status', options.status);
          if (options.q && options.q.trim()) params.append('q', options.q.trim());

          const url = `${base}/api/feedbacks` + (params.toString() ? `?${params.toString()}` : '');
          const res = await fetch(url, { headers: this.getAuthHeaders() });
          if (res.ok) {
            list = await res.json();
            if (Array.isArray(list)) {
              try {
                localStorage.setItem('dg_sarawat_feedbacks_cache', JSON.stringify(list));
              } catch (e) {}
            }
          }
        } catch (err) {
          console.warn('[SarawatApi] getFeedbacks failed, fallback to local cache:', err.message);
        }
      }

      if (!Array.isArray(list)) {
        try {
          const stored = localStorage.getItem('dg_sarawat_feedbacks_cache');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) list = parsed;
          }
        } catch (e) {}
      }

      if (!Array.isArray(list)) list = [];

      // Filter locally if offline
      if (options.type && options.type !== 'all') {
        list = list.filter(item => item.type === options.type);
      }
      if (options.status && options.status !== 'all') {
        list = list.filter(item => item.status === options.status);
      }
      if (options.q && options.q.trim()) {
        const q = options.q.trim().toLowerCase();
        list = list.filter(item =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.detail && item.detail.toLowerCase().includes(q)) ||
          (item.location && item.location.toLowerCase().includes(q)) ||
          (item.senderName && item.senderName.toLowerCase().includes(q))
        );
      }

      return list;
    },

    submitFeedback: async function (item) {
      const base = this.getBaseUrl();
      const payload = {
        id: item.id || ('fb-' + Date.now() + '-' + Math.floor(Math.random() * 1000)),
        type: item.type || 'feedback',
        category: item.category || 'ทั่วไป',
        title: item.title || '',
        location: item.location || '',
        targetPerson: item.targetPerson || item.target_person || '',
        detail: item.detail || '',
        website_hp: item.website_hp || item._hp || '',
        senderName: item.senderName || item.sender_name || 'ไม่ระบุตัวตน (Anonymous)',
        contact: item.contact || '',
        status: item.status || 'pending',
        adminNotes: item.adminNotes || item.admin_notes || '',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      let apiSuccess = false;
      let apiData = null;

      if (base) {
        try {
          const res = await fetch(`${base}/api/feedbacks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            apiData = await res.json();
            apiSuccess = true;
          }
        } catch (err) {
          console.warn('[SarawatApi] submitFeedback fetch failed, saving to local cache only:', err.message);
        }
      }

      // Always save / append to local storage cache so it persists locally as well
      try {
        let cached = [];
        const stored = localStorage.getItem('dg_sarawat_feedbacks_cache');
        if (stored) cached = JSON.parse(stored) || [];
        cached.unshift(payload);
        localStorage.setItem('dg_sarawat_feedbacks_cache', JSON.stringify(cached));
      } catch (e) {}

      return apiData || { success: true, id: payload.id, offline: !apiSuccess };
    },

    updateFeedback: async function (id, updateData) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูล');

      const res = await fetch(`${base}/api/feedbacks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `อัปเดตไม่สำเร็จ (HTTP ${res.status})`);
      }

      // Update local cache
      try {
        let cached = [];
        const stored = localStorage.getItem('dg_sarawat_feedbacks_cache');
        if (stored) cached = JSON.parse(stored) || [];
        const idx = cached.findIndex(item => String(item.id) === String(id));
        if (idx >= 0) {
          cached[idx] = { ...cached[idx], ...updateData };
          localStorage.setItem('dg_sarawat_feedbacks_cache', JSON.stringify(cached));
        }
      } catch (e) {}

      return await res.json();
    },

    deleteFeedback: async function (id) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่พบการเชื่อมต่อระบบฐานข้อมูล');

      const res = await fetch(`${base}/api/feedbacks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `ลบไม่สำเร็จ (HTTP ${res.status})`);
      }

      // Update local cache
      try {
        let cached = [];
        const stored = localStorage.getItem('dg_sarawat_feedbacks_cache');
        if (stored) cached = JSON.parse(stored) || [];
        cached = cached.filter(item => String(item.id) !== String(id));
        localStorage.setItem('dg_sarawat_feedbacks_cache', JSON.stringify(cached));
      } catch (e) {}

      return await res.json();
    },

    // ==========================================
    // 🛡️ RECRUITMENT APIS (ระบบรับสมัครสารวัตรนักเรียน ปีการศึกษา 2570)
    // ==========================================
    getRecruitmentStatus: async function () {
      const base = this.getBaseUrl();
      if (!base) return { isOpen: false, error: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' };
      try {
        const res = await fetch(`${base}/api/recruitment/status`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.error('getRecruitmentStatus error:', err);
        return { isOpen: false, error: err.message };
      }
    },

    getRecruitmentClubs: async function () {
      const base = this.getBaseUrl();
      if (!base) return { clubs: [], affiliations: [] };
      try {
        const res = await fetch(`${base}/api/recruitment/clubs`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.error('getRecruitmentClubs error:', err);
        return { clubs: [], affiliations: [], error: err.message };
      }
    },

    submitRecruitmentApplication: async function (formData) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Backend Offline)');
      const res = await fetch(`${base}/api/recruitment/apply`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาดในการส่งใบสมัคร');
      return data;
    },

    checkApplicantStatus: async function (studentId) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      const res = await fetch(`${base}/api/recruitment/check-status/${encodeURIComponent(studentId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่พบข้อมูลใบสมัคร');
      return data;
    },

    unlockApplicantCorrection: async function (studentId, phone = '') {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      const res = await fetch(`${base}/api/recruitment/unlock-correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, phone: phone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเข้าสู่โหมดแก้ไขข้อมูลได้');
      return data;
    },

    getApplicantForCorrection: async function (studentId) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      const res = await fetch(`${base}/api/recruitment/applicant-correction/${encodeURIComponent(studentId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถดึงข้อมูลสำหรับแก้ไขได้');
      return data;
    },

    submitApplicantCorrection: async function (studentId, formData) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      const res = await fetch(`${base}/api/recruitment/correction/${encodeURIComponent(studentId)}`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'บันทึกข้อมูลแก้ไขไม่สำเร็จ');
      return data;
    },

    // --- Admin Recruitment Methods ---
    adminGetRecruitmentStats: async function () {
      const base = this.getBaseUrl();
      if (!base) return { total: 0, byStatus: {}, byGrade: {} };
      try {
        const res = await fetch(`${base}/api/recruitment/stats`, { headers: this.getAuthHeaders() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } catch (err) {
        console.error('adminGetRecruitmentStats error:', err);
        return { total: 0, byStatus: {}, byGrade: {} };
      }
    },

    adminGetApplicants: async function (params = {}) {
      const base = this.getBaseUrl();
      if (!base) return { success: false, applicants: [], total: 0 };
      const q = new URLSearchParams();
      if (params.search) q.set('search', params.search);
      if (params.status) q.set('status', params.status);
      if (params.grade) q.set('grade', params.grade);
      if (params.club) q.set('club', params.club);
      if (params.page) q.set('page', params.page);
      if (params.limit) q.set('limit', params.limit);

      const res = await fetch(`${base}/api/recruitment/applicants?${q.toString()}`, { headers: this.getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    },

    adminGetApplicantDetail: async function (id) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('Offline');
      const res = await fetch(`${base}/api/recruitment/applicant/${id}`, { headers: this.getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },

    adminUpdateApplicantStatus: async function (id, data) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('Offline');
      const res = await fetch(`${base}/api/recruitment/applicant/${id}/status`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed');
      return resData;
    },

    adminGetRecruitmentSettings: async function () {
      const base = this.getBaseUrl();
      if (!base) throw new Error('Offline');
      const res = await fetch(`${base}/api/recruitment/settings`, { headers: this.getAuthHeaders() });
      return await res.json();
    },

    adminUpdateRecruitmentSettings: async function (settings) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('Offline');
      const res = await fetch(`${base}/api/recruitment/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      return data;
    },

    adminGetRecruitmentClubs: async function () {
      const base = this.getBaseUrl();
      if (!base) return { clubs: [] };
      const res = await fetch(`${base}/api/recruitment/admin-clubs`, { headers: this.getAuthHeaders() });
      return await res.json();
    },

    adminCreateRecruitmentClub: async function (data) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('Offline');
      const res = await fetch(`${base}/api/recruitment/admin-clubs`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    adminUpdateRecruitmentClub: async function (id, data) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('Offline');
      const res = await fetch(`${base}/api/recruitment/admin-clubs/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      });
      return await res.json();
    },

    adminDeleteRecruitmentClub: async function (id) {
      const base = this.getBaseUrl();
      if (!base) throw new Error('Offline');
      const res = await fetch(`${base}/api/recruitment/admin-clubs/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      return await res.json();
    },

    adminDeleteApplicant: async function (id, admin = 'Admin') {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Offline)');
      const res = await fetch(`${base}/api/recruitment/applicant/${id}?admin=${encodeURIComponent(admin)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบใบสมัครไม่สำเร็จ');
      return data;
    },

    adminClearAllApplicants: async function (admin = 'Admin') {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Offline)');
      const res = await fetch(`${base}/api/recruitment/applicants/clear`, {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ admin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ล้างข้อมูลผู้สมัครไม่สำเร็จ');
      return data;
    },

    getRecruitmentExportUrl: function (format = 'xlsx', status = 'all', grade = 'all') {
      const base = this.getBaseUrl();
      const q = new URLSearchParams({ format, status, grade });
      const token = this.getAuthToken();
      if (token) q.set('token', token);
      return `${base}/api/recruitment/export?${q.toString()}`;
    },

    adminGetRecruitmentLogs: async function () {
      const base = this.getBaseUrl();
      if (!base) return { logs: [] };
      const res = await fetch(`${base}/api/recruitment/logs`, { headers: this.getAuthHeaders() });
      return await res.json();
    }
  };

  // Dual exports: support both window.SarawatApi and window.SarawatAPI
  window.SarawatAPI = window.SarawatApi;
})();
