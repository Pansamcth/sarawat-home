
  // Safe HTML Escaper
  function escapeHtml(text) {
    if (text === undefined || text === null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
/**
 * Admin Recruitment Management (ระบบรับสมัครสารวัตรนักเรียน ปี 2570)
 * ===================================================================
 * ควบคุมแดชบอร์ด, ตารางรายชื่อ, ตรวจใบสมัคร, จัดการชุมนุม/สังกัด, และส่งออกข้อมูล
 */

(function () {
  // ==========================================================
  // SAFEGUARD POLYFILL / BRIDGE
  // ป้องกันกรณีเบราว์เซอร์แคชไฟล์ api-config.js รุ่นเก่า
  // ==========================================================
  window.SarawatApi = window.SarawatApi || {};
  window.SarawatAPI = window.SarawatApi;

  const apiBridge = window.SarawatApi;
  if (!apiBridge.getBaseUrl) {
    apiBridge.getBaseUrl = function () {
      if (typeof window.SARAWAT_API_BASE === 'string') return window.SARAWAT_API_BASE;
      const hostname = window.location.hostname || '';
      if (hostname.endsWith('sarawatdc.site') || hostname.endsWith('.vercel.app') || hostname.endsWith('.trycloudflare.com')) {
        return '';
      }
      if (window.CLOUDFLARE_TUNNEL_URL) return window.CLOUDFLARE_TUNNEL_URL;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        return 'http://localhost:5000';
      }
      return '';
    };
  }
  if (!apiBridge.adminGetRecruitmentStats) {
    apiBridge.adminGetRecruitmentStats = async function () {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/stats`);
      return await res.json();
    };
  }
  if (!apiBridge.adminGetRecruitmentSettings) {
    apiBridge.adminGetRecruitmentSettings = async function () {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/settings`);
      return await res.json();
    };
  }
  if (!apiBridge.adminGetApplicants) {
    apiBridge.adminGetApplicants = async function (params = {}) {
      const base = this.getBaseUrl();
      const q = new URLSearchParams(params);
      const res = await fetch(`${base}/api/recruitment/applicants?${q.toString()}`);
      return await res.json();
    };
  }
  if (!apiBridge.adminGetApplicantDetail) {
    apiBridge.adminGetApplicantDetail = async function (id) {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/applicant/${id}`);
      return await res.json();
    };
  }
  if (!apiBridge.adminUpdateApplicantStatus) {
    apiBridge.adminUpdateApplicantStatus = async function (id, data) {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/applicant/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    };
  }
  if (!apiBridge.adminUpdateRecruitmentSettings) {
    apiBridge.adminUpdateRecruitmentSettings = async function (settings) {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return await res.json();
    };
  }
  if (!apiBridge.adminGetRecruitmentClubs) {
    apiBridge.adminGetRecruitmentClubs = async function () {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/admin-clubs`);
      return await res.json();
    };
  }
  if (!apiBridge.adminCreateRecruitmentClub) {
    apiBridge.adminCreateRecruitmentClub = async function (data) {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/admin-clubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    };
  }
  if (!apiBridge.adminDeleteRecruitmentClub) {
    apiBridge.adminDeleteRecruitmentClub = async function (id) {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/admin-clubs/${id}`, { method: 'DELETE' });
      return await res.json();
    };
  }
  if (!apiBridge.getRecruitmentExportUrl) {
    apiBridge.getRecruitmentExportUrl = function (format = 'xlsx', status = 'all', grade = 'all') {
      const base = this.getBaseUrl();
      const q = new URLSearchParams({ format, status, grade });
      return `${base}/api/recruitment/export?${q.toString()}`;
    };
  }
  if (!apiBridge.adminGetRecruitmentLogs) {
    apiBridge.adminGetRecruitmentLogs = async function () {
      const base = this.getBaseUrl();
      const res = await fetch(`${base}/api/recruitment/logs`);
      return await res.json();
    };
  }
  if (!apiBridge.adminDeleteApplicant) {
    apiBridge.adminDeleteApplicant = async function (id, admin = 'Admin') {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Offline)');
      const res = await fetch(`${base}/api/recruitment/applicant/${id}?admin=${encodeURIComponent(admin)}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders ? this.getAuthHeaders() : {}
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ลบใบสมัครไม่สำเร็จ');
      return data;
    };
  }
  if (!apiBridge.adminClearAllApplicants) {
    apiBridge.adminClearAllApplicants = async function (admin = 'Admin') {
      const base = this.getBaseUrl();
      if (!base) throw new Error('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ (Offline)');
      const res = await fetch(`${base}/api/recruitment/applicants/clear`, {
        method: 'POST',
        headers: this.getAuthHeaders ? this.getAuthHeaders({ 'Content-Type': 'application/json' }) : { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'ล้างข้อมูลผู้สมัครไม่สำเร็จ');
      return data;
    };
  }

  // Ensure window.SarawatAPI matches
  window.SarawatAPI = window.SarawatApi;

  function getApi() {
    return window.SarawatAPI || window.SarawatApi;
  }

  let currentPage = 1;
  const pageLimit = 15;
  let totalApplicants = 0;
  let currentViewingApplicantId = null;
  let recruitmentSettingsCache = null;

  const STATUS_LABELS = {
    pending: 'รอการตรวจสอบ',
    reviewing: 'กำลังตรวจสอบ',
    approved: 'ผ่านการคัดเลือก',
    rejected: 'ไม่ผ่านการคัดเลือก',
    correction_needed: 'รอแก้ไขข้อมูล',
    withdrawn: 'ถอนตัว/ยกเลิก'
  };

    let isTrashModeActive = false;
  const selectedApplicantIds = new Set();

  function syncBulkSelectionBar() {
    const bar = document.getElementById('barBulkApplicantActions');
    const txtCount = document.getElementById('txtBulkSelectedCount');
    const chkAll = document.getElementById('chkSelectAllApplicants');

    const count = selectedApplicantIds.size;
    if (txtCount) txtCount.textContent = count;

    if (bar) {
      bar.style.display = count > 0 ? 'flex' : 'none';
    }

    if (chkAll) {
      const visibleCheckboxes = document.querySelectorAll('.chk-applicant-row');
      if (visibleCheckboxes.length > 0) {
        const allChecked = Array.from(visibleCheckboxes).every(cb => cb.checked);
        chkAll.checked = allChecked;
      } else {
        chkAll.checked = false;
      }
    }
  }
  let adminQuestionsCache = [];

  function getActiveAdminRole() {
    try {
      if (window.currentAdminUser && window.currentAdminUser.role) return window.currentAdminUser.role;
      const role = localStorage.getItem('dg_sarawat_admin_role');
      if (role) return role;
    } catch (e) {}
    return 'Admin';
  }

  function isSuperAdmin() {
    return getActiveAdminRole() === 'Super Admin';
  }

  // Helper: Get logged-in admin name
  function getActiveAdminName() {
    try {
      const user = localStorage.getItem('dg_sarawat_admin_user');
      if (user) return user;
    } catch (e) {}
    return 'Admin';
  }

  // ==========================================================
  // 1. MAIN ENTRY POINT: loadRecruitmentAdmin()
  // ==========================================================
  window.loadRecruitmentAdmin = async function () {
    try {
      await Promise.all([
        refreshRecruitmentStats(),
        refreshRecruitmentSettings(),
        loadApplicantsTable(1)
      ]);
    } catch (err) {
      console.error('[Recruitment Admin] Error loading dashboard:', err);
    }
  };

  // ==========================================================
  // 2. REFRESH STATS & SETTINGS PILL
  // ==========================================================
  async function refreshRecruitmentStats() {
    try {
      const stats = await getApi().adminGetRecruitmentStats();
      if (stats && stats.success) {
        const total = stats.total || 0;
        const pending = stats.byStatus?.pending || 0;
        const reviewing = stats.byStatus?.reviewing || 0;
        const approved = stats.byStatus?.approved || 0;
        const correction = stats.byStatus?.correction_needed || 0;
        const rejected = stats.byStatus?.rejected || 0;
        const withdrawn = stats.withdrawn || stats.byStatus?.withdrawn || 0;
        const maxCap = stats.maxApplicants || 100;
        const targetQ = stats.targetQuota || 30;
        const trash = stats.trashCount || 0;

        const setTxt = (id, val) => {
          const el = document.getElementById(id);
          if (el) el.textContent = val;
        };

        setTxt('statTotalApplicants', total);
        setTxt('statPendingApplicants', pending);
        setTxt('statReviewingApplicants', reviewing);
        setTxt('statApprovedApplicants', approved);
        setTxt('statCorrectionApplicants', correction);
        setTxt('statRejectedApplicants', rejected);
        setTxt('statWithdrawnApplicants', withdrawn);
        setTxt('statTrashCount', trash);

        const elQuota = document.getElementById('statQuotaSummary');
        if (elQuota) {
          elQuota.innerHTML = `<span style="color:#047857;">${approved}</span>/${targetQ} ผ่าน • <span style="color:#1e3a8a;">${total}</span>/${maxCap} สมัคร`;
        }

        // Update sidebar badge
        const badge = document.getElementById('recruitmentCounterBadge');
        if (badge) {
          const pendingCount = pending + reviewing;
          if (pendingCount > 0) {
            badge.textContent = pendingCount;
            badge.style.display = 'inline-block';
          } else {
            badge.style.display = 'none';
          }
        }
      }
    } catch (err) {
      console.warn('Error refreshing recruitment stats:', err);
    }
  }

  async function refreshRecruitmentSettings() {
    try {
      const res = await getApi().adminGetRecruitmentSettings();
      if (res && res.success && res.settings) {
        recruitmentSettingsCache = res.settings;
        const s = res.settings;
        const isManualOpen = Number(s.is_open) === 1;

        const pill = document.getElementById('adminRecruitStatusPill');
        const txtStatus = document.getElementById('txtAdminRecruitStatus');
        const btnToggle = document.getElementById('txtBtnToggleRecruit');

        if (!isManualOpen) {
          if (pill) pill.className = 'schedule-badge-status closed';
          if (txtStatus) txtStatus.textContent = 'ปิดรับสมัคร (ปิดชั่วคราว)';
          if (btnToggle) btnToggle.textContent = 'เปิดรับสมัครทันที';
        } else if (s.isBeforeStart) {
          if (pill) pill.className = 'schedule-badge-status reviewing';
          if (txtStatus) txtStatus.textContent = 'รอเปิดรับสมัครตามกำหนดเวลา';
          if (btnToggle) btnToggle.textContent = 'ปิดรับสมัครทันที';
        } else if (s.isAfterEnd) {
          if (pill) pill.className = 'schedule-badge-status closed';
          if (txtStatus) txtStatus.textContent = 'หมดเวลารับสมัครแล้ว';
          if (btnToggle) btnToggle.textContent = 'เปิดรับสมัครทันที';
        } else {
          if (pill) pill.className = 'schedule-badge-status open';
          if (txtStatus) txtStatus.textContent = 'เปิดรับสมัคร (ตามกำหนดเวลา)';
          if (btnToggle) btnToggle.textContent = 'ปิดรับสมัครทันที';
        }
      }
    } catch (err) {
      console.warn('Error refreshing recruitment settings:', err);
    }
  }

  // ==========================================================
  // 3. LOAD APPLICANTS TABLE
  // ==========================================================
  async function loadApplicantsTable(page = 1) {
    currentPage = page;
    const tbody = document.getElementById('adminApplicantsTableBody');
    if (!tbody) return;

    if (window.DgSkeletons) {
      tbody.innerHTML = window.DgSkeletons.tableRows(10, 6);
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="padding: 30px; text-align: center; color: #94a3b8;">
            <div style="display: inline-flex; align-items: center; gap: 8px;">
              <i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px;"></i>
              <span>กำลังโหลดข้อมูลใบสมัคร...</span>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
    }

    const search = (document.getElementById('adminApplicantSearch')?.value || '').trim();
    const status = document.getElementById('adminFilterStatus')?.value || 'all';
    const grade = document.getElementById('adminFilterGrade')?.value || 'all';

    try {
      const res = await getApi().adminGetApplicants({
        search,
        status,
        grade,
        trash: isTrashModeActive ? 1 : 0,
        page,
        limit: pageLimit
      });

      if (!res.success || !res.applicants || res.applicants.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="10" style="padding: 48px 20px; text-align: center; color: #94a3b8;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #f8fafc; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; color: ${isTrashModeActive ? '#ef4444' : '#cbd5e1'};">
                <i data-lucide="${isTrashModeActive ? 'trash-2' : 'inbox'}" style="width: 24px; height: 24px;"></i>
              </div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #64748b;">${isTrashModeActive ? 'ไม่มีรายการในถังขยะ' : 'ไม่พบรายการใบสมัคร'}</div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">${isTrashModeActive ? 'ยังไม่มีใบสมัครที่ถูกย้ายลงถังขยะ' : 'ลองเปลี่ยนคำค้นหาหรือตัวกรองด้านบน'}</div>
            </td>
          </tr>
        `;
        document.getElementById('adminApplicantPaginationMeta').textContent = 'แสดง 0 รายการ';
        document.getElementById('btnPrevPageApplicant').disabled = true;
        document.getElementById('btnNextPageApplicant').disabled = true;
        if (window.lucide) lucide.createIcons();
        return;
      }

      totalApplicants = res.total;
      const totalPages = res.totalPages || 1;

      // Render rows
      tbody.innerHTML = res.applicants.map((a, index) => {
        const rowSeq = (page - 1) * pageLimit + index + 1;
        const photoSrc = a.photo_url
          ? (a.photo_url.startsWith('http') ? a.photo_url : (getApi().getBaseUrl() + a.photo_url))
          : 'assets/icons/sarawat-logo.png';

        const isLowGpax = Number(a.gpax) < (recruitmentSettingsCache?.min_gpax || 2.50);
        const evalScoreBadge = (a.evaluation_score !== null && a.evaluation_score !== undefined)
          ? `<span style="display:inline-block; margin-left:4px; padding:2px 7px; background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:9999px; font-size:0.72rem; font-weight:750;">${Number(a.evaluation_score).toFixed(1)} คะแนน</span>`
          : '';

        const isChecked = selectedApplicantIds.has(String(a.id));
        return `
          <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease; ${a.is_deleted ? 'background:#fff7f7;' : ''}" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='${a.is_deleted ? '#fff7f7' : 'transparent'}'">
            <td style="padding: 12px 12px; text-align: center;">
              ${a.is_deleted ? `
                <span title="อยู่ในถังขยะ" style="color: #ef4444; font-size: 0.85rem;"><i data-lucide="trash-2" style="width: 16px; height: 16px; display:inline-block; vertical-align:middle; color:#ef4444;"></i></span>
              ` : `
                <input type="checkbox" class="chk-applicant-row" data-id="${a.id}" ${isChecked ? 'checked' : ''} style="width: 17px; height: 17px; cursor: pointer; accent-color: #0f172a; border-radius: 4px;" />
              `}
            </td>
            <td style="padding: 12px 16px; font-weight: 800; color: #0f172a; white-space: nowrap;">
              ${a.application_code}
              ${evalScoreBadge}
            </td>
            <td style="padding: 12px 16px;">
              <img src="${photoSrc}" alt="${a.first_name}" style="width: 38px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; background: #e2e8f0; display: block;" onerror="this.src='assets/icons/sarawat-logo.png'" />
            </td>
            <td style="padding: 12px 16px; font-family: var(--dg-font-sans); font-weight: 700; color: #334155;">
              ${a.student_id}
            </td>
            <td style="padding: 12px 16px; font-weight: 750; color: #0f172a;">
              ${a.prefix}${a.first_name} ${a.last_name}
              ${a.is_deleted ? `<div style="font-size:0.72rem; color:#dc2626; font-weight:600;">(ลบเมื่อ ${a.deleted_at ? new Date(a.deleted_at).toLocaleDateString('th-TH') : '-'} โดย ${a.deleted_by || '-'})</div>` : ''}
            </td>
            <td style="padding: 12px 16px; color: #475569; white-space: nowrap;">
              ${a.grade_level}/${a.classroom}
            </td>
            <td style="padding: 12px 16px; font-weight: 750; color: #0f172a; white-space: nowrap;">
              <span>${Number(a.gpax).toFixed(2)}</span>
              ${isLowGpax ? `
                <span title="ต่ำกว่าเกณฑ์ขั้นต่ำ (${(recruitmentSettingsCache?.min_gpax || 2.50).toFixed(2)})" style="display: inline-block; margin-left: 4px; padding: 1px 6px; font-size: 0.7rem; font-weight: 800; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; border-radius: 9999px;">
                  ⚠️ ต่ำกว่าเกณฑ์
                </span>
              ` : ''}
            </td>
            <td style="padding: 12px 16px; font-size: 0.86rem; color: #1e293b; font-weight: 700; max-width: 240px;">
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.club}</div>
            </td>
            <td style="padding: 12px 16px; white-space: nowrap;">
              ${a.is_deleted ? `
                <span class="status-badge" style="background:#fee2e2; color:#991b1b; border:1px solid #fecaca; font-size:0.75rem; padding:3px 10px;">
                  ถังขยะ (Deleted)
                </span>
              ` : `
                <span class="status-badge ${a.status}" style="font-size: 0.78rem; padding: 3px 10px;">
                  ${a.statusLabel || a.status}
                </span>
              `}
            </td>
            <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
              <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
                <button type="button" class="photo-btn-select btn-view-applicant" data-id="${a.id}" style="padding: 6px 14px; font-size: 0.8rem;">
                  <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                  <span>${a.is_deleted ? 'ดูข้อมูล/กู้คืน' : 'ตรวจใบสมัคร'}</span>
                </button>
                ${a.is_deleted ? `
                  <button type="button" class="btn-step-prev btn-restore-single-applicant" data-id="${a.id}" data-name="${a.first_name} ${a.last_name}" data-code="${a.application_code}" title="กู้คืนใบสมัครกลับสู่ระบบ" style="padding: 6px 10px; font-size: 0.8rem; color: #059669; border-color: #a7f3d0; background: #ecfdf5;">
                    <i data-lucide="rotate-ccw" style="width: 14px; height: 14px; color: #059669;"></i>
                  </button>
                  <button type="button" class="btn-step-prev btn-perm-delete-single" data-id="${a.id}" data-name="${a.first_name} ${a.last_name}" data-code="${a.application_code}" title="ลบถาวร (Super Admin)" style="padding: 6px 10px; font-size: 0.8rem; color: #dc2626; border-color: #fca5a5; background: #fff1f2;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #dc2626;"></i>
                  </button>
                ` : `
                  <button type="button" class="btn-step-prev btn-delete-single-applicant" data-id="${a.id}" data-code="${a.application_code}" data-name="${a.prefix}${a.first_name} ${a.last_name}" title="ย้ายใบสมัครไปยังถังขยะ" style="padding: 6px 10px; font-size: 0.8rem; color: #ef4444; border-color: #fecaca; background: #fff1f2; transition: all 0.15s ease;">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #ef4444;"></i>
                  </button>
                `}
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach row checkbox listeners
      document.querySelectorAll('.chk-applicant-row').forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.getAttribute('data-id');
          if (cb.checked) {
            if (id) selectedApplicantIds.add(String(id));
          } else {
            if (id) selectedApplicantIds.delete(String(id));
          }
          syncBulkSelectionBar();
        });
      });
      syncBulkSelectionBar();

      // Attach row click listeners
      document.querySelectorAll('.btn-view-applicant').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openApplicantReviewModal(id);
        });
      });

      document.querySelectorAll('.btn-restore-single-applicant').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const code = btn.getAttribute('data-code');
          const name = btn.getAttribute('data-name');
          confirmAndRestoreApplicant(id, name, code);
        });
      });

      document.querySelectorAll('.btn-perm-delete-single').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const code = btn.getAttribute('data-code');
          const name = btn.getAttribute('data-name');
          confirmAndPermanentDeleteApplicant(id, name, code);
        });
      });

      document.querySelectorAll('.btn-delete-single-applicant').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = btn.getAttribute('data-id');
          const code = btn.getAttribute('data-code');
          const name = btn.getAttribute('data-name');
          confirmAndDeleteApplicant(id, name, code);
        });
      });

      // Update Pagination Meta
      const startCount = (page - 1) * pageLimit + 1;
      const endCount = Math.min(page * pageLimit, totalApplicants);
      document.getElementById('adminApplicantPaginationMeta').textContent = `แสดง ${startCount} - ${endCount} จากทั้งหมด ${totalApplicants} รายการ (หน้า ${page}/${totalPages})`;

      document.getElementById('btnPrevPageApplicant').disabled = page <= 1;
      document.getElementById('btnNextPageApplicant').disabled = page >= totalPages;

      if (window.lucide) lucide.createIcons();
    } catch (err) {
      console.warn('Error loading applicants from backend API:', err);
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="padding: 40px 20px; text-align: center; color: #64748b;">
            <div style="font-weight: 700; color: #b45309; margin-bottom: 6px;">ระบบฐานข้อมูลรับสมัครออฟไลน์ (Offline Mode)</div>
            <div style="font-size: 0.85rem; color: #94a3b8;">ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์รับสมัครได้ในขณะนี้ กรุณาเปิดระบบเซิร์ฟเวอร์หรือ Cloudflare Tunnel</div>
          </td>
        </tr>
      `;
      const meta = document.getElementById('adminApplicantPaginationMeta');
      if (meta) meta.textContent = 'โหมดออฟไลน์';
      const prev = document.getElementById('btnPrevPageApplicant');
      if (prev) prev.disabled = true;
      const next = document.getElementById('btnNextPageApplicant');
      if (next) next.disabled = true;
    }
  }

  // ==========================================================
  // MODAL DISPLAY HELPERS
  // ==========================================================
  function showModalSafely(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
    modal.style.zIndex = '9500';
    document.body.style.overflow = 'hidden';
  }

  function hideModalSafely(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.opacity = '';
    modal.style.visibility = '';
    modal.style.pointerEvents = '';
    document.body.style.overflow = '';
  }

  // ==========================================================
  // APPLICANT DELETION HELPERS (SINGLE & BULK)
  // ==========================================================
  async function confirmAndDeleteApplicant(id, name, code) {
    if (!id) return;
    const displayName = name ? ` (${name})` : '';
    const displayCode = code || `ID #${id}`;

    let confirmed = false;
    if (typeof Swal !== 'undefined') {
      const res = await Swal.fire({
        title: 'ย้ายใบสมัครไปยังถังขยะ?',
        html: `คุณต้องการย้ายใบสมัคร <b>${escapeHtml(displayCode)}${escapeHtml(displayName)}</b> ไปยังถังขยะหรือไม่?<br><br><span style="color:#64748b; font-size:0.88rem;">ใบสมัครจะถูกย้ายไปยังถังขยะ และสามารถกู้คืนกลับสู่ระบบได้ทุกเมื่อ</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ใช่, ย้ายไปถังขยะ',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      confirmed = res.isConfirmed;
    } else {
      confirmed = confirm(`ยืนยันการลบใบสมัคร ${displayCode}${displayName} หรือไม่?\n\nการลบนี้จะลบข้อมูลผู้สมัคร, ประวัติการพิจารณา และรูปถ่ายออกจากระบบอย่างถาวร (ไม่สามารถกู้คืนได้)`);
    }
    if (!confirmed) return;

    try {
      const res = await getApi().adminDeleteApplicant(id, getActiveAdminName());
      if (window.showToast) window.showToast(res.message || 'ลบใบสมัครเรียบร้อยแล้ว', 'success');
      else alert(res.message || 'ลบใบสมัครเรียบร้อยแล้ว');

      const modalReview = document.getElementById('adminApplicantReviewModal');
      if (modalReview) hideModalSafely(modalReview);

      await refreshRecruitmentStats();
      await loadApplicantsTable(currentPage);
    } catch (err) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาดในการลบใบสมัคร',
          text: err.message,
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
        });
      } else {
        alert('เกิดข้อผิดพลาดในการลบใบสมัคร: ' + err.message);
      }
    }
  }
  window.confirmAndDeleteApplicant = confirmAndDeleteApplicant;

  async function confirmAndClearAllApplicants() {
    if (typeof Swal !== 'undefined') {
      const step1 = await Swal.fire({
        title: '⚠️ ล้างข้อมูลใบสมัครทั้งหมด?',
        html: 'คำเตือนสำคัญสูงสุด! คุณกำลังจะลบฐานข้อมูลผู้สมัครทั้งหมดออกจากระบบ:<br><br><ul style="text-align:left; font-size:0.85rem; color:#64748b; line-height: 1.6;"><li>ลบข้อมูลผู้สมัครทุกคน</li><li>ลบประวัติการพิจารณา/เปลี่ยนสถานะทั้งหมด</li><li>ลบรูปถ่ายที่อัปโหลดทั้งหมด</li></ul><div style="margin-top:8px; font-weight:700; color:#dc2626;">การดำเนินการนี้ "ไม่สามารถย้อนกลับได้"</div>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ดำเนินการต่อ (พิมพ์ยืนยัน)',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      if (!step1.isConfirmed) return;

      const step2 = await Swal.fire({
        title: 'พิมพ์ "ยืนยัน" เพื่อล้างข้อมูล',
        text: 'เพื่อความปลอดภัยสูงสุด โปรดพิมพ์คำว่า "ยืนยัน" เพื่อล้างฐานข้อมูลผู้สมัครทั้งหมด:',
        input: 'text',
        inputPlaceholder: 'พิมพ์คำว่า ยืนยัน ที่นี่...',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ล้างข้อมูลทั้งหมดถาวร',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' },
        inputValidator: (val) => {
          if ((val || '').trim() !== 'ยืนยัน') {
            return 'คุณต้องพิมพ์คำว่า "ยืนยัน" ให้ถูกต้อง!';
          }
        }
      });
      if (!step2.isConfirmed) return;
    } else {
      const step1 = confirm('⚠️ คำเตือนสำคัญสูงสุด! ยืนยันลบฐานข้อมูลผู้สมัครทั้งหมดหรือไม่?');
      if (!step1) return;
      const input = prompt('พิมพ์ "ยืนยัน" เพื่อล้างข้อมูล:');
      if (input !== 'ยืนยัน') return;
    }

    const btnWipe = document.getElementById('btnWipeAllApplicants');
    const originalHtml = btnWipe ? btnWipe.innerHTML : '';
    if (btnWipe) {
      btnWipe.disabled = true;
      btnWipe.innerHTML = '<i data-lucide="loader-2" class="spin" style="width: 15px; height: 15px;"></i><span>กำลังล้างข้อมูล...</span>';
      if (window.lucide) lucide.createIcons();
    }

    try {
      const res = await getApi().adminClearAllApplicants(getActiveAdminName());
      if (window.showToast) window.showToast(res.message || 'ล้างฐานข้อมูลผู้สมัครทั้งหมดเรียบร้อยแล้ว', 'success');
      else alert(res.message || 'ล้างฐานข้อมูลเรียบร้อย');
      await refreshRecruitmentStats();
      await loadApplicantsTable(1);
    } catch (err) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาดในการล้างฐานข้อมูล',
          text: err.message,
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
        });
      } else {
        alert('เกิดข้อผิดพลาดในการล้างฐานข้อมูล: ' + err.message);
      }
    } finally {
      if (btnWipe) {
        btnWipe.disabled = false;
        btnWipe.innerHTML = originalHtml || '<i data-lucide="trash-2" style="width: 15px; height: 15px; color: #ef4444;"></i><span>ล้างข้อมูลทั้งหมด</span>';
        if (window.lucide) lucide.createIcons();
      }
    }
  }
  window.confirmAndClearAllApplicants = confirmAndClearAllApplicants;

  // ==========================================================
  // 4. APPLICANT REVIEW MODAL LOGIC
  // ==========================================================
  window.openApplicantReviewModal = async function (id) {
    currentViewingApplicantId = id;
    const modal = document.getElementById('adminApplicantReviewModal');
    if (!modal) return;

    showModalSafely(modal);

    try {
      const res = await getApi().adminGetApplicantDetail(id);
      if (!res.success || !res.applicant) {
        alert('ไม่สามารถโหลดข้อมูลใบสมัครได้');
        hideModalSafely(modal);
        return;
      }

      const a = res.applicant;
      document.getElementById('mdlAppCode').textContent = a.application_code;
      document.getElementById('mdlAppName').textContent = `${a.prefix}${a.first_name} ${a.last_name}`;
      document.getElementById('mdlAppStudentId').textContent = a.student_id;
      document.getElementById('mdlAppGradeRoom').textContent = `${a.grade_level}/${a.classroom}`;
      document.getElementById('mdlAppPhone').textContent = a.phone;
      const elPhoneLink = document.getElementById('mdlAppPhoneLink');
      if (elPhoneLink) elPhoneLink.href = `tel:${a.phone}`;
      const mdlGpaxEl = document.getElementById('mdlAppGpax');
      if (mdlGpaxEl) {
        const minG = (recruitmentSettingsCache?.min_gpax || 2.50);
        const isLow = Number(a.gpax) < minG;
        if (isLow) {
          mdlGpaxEl.innerHTML = `
            <span style="font-weight: 800; color: #b45309;">${Number(a.gpax).toFixed(2)}</span>
            <span style="display: inline-block; margin-left: 6px; padding: 2px 8px; font-size: 0.76rem; font-weight: 700; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; border-radius: 9999px;">
              ⚠️ ต่ำกว่าเกณฑ์ (${minG.toFixed(2)}) - กำลังพิจารณา
            </span>
          `;
        } else {
          mdlGpaxEl.textContent = Number(a.gpax).toFixed(2);
        }
      }
      document.getElementById('mdlAppClub').textContent = a.club;

      const formattedDate = a.created_at ? new Date(a.created_at).toLocaleString('th-TH') : '-';
      const elSubmittedAt = document.getElementById('mdlAppSubmittedAt');
      if (elSubmittedAt) elSubmittedAt.textContent = formattedDate;
      const elCreated = document.getElementById('mdlAppCreated');
      if (elCreated) elCreated.textContent = formattedDate;

      const elHeaderBadge = document.getElementById('mdlAppHeaderStatusBadge');
      if (elHeaderBadge) {
        elHeaderBadge.className = `status-badge ${a.status}`;
        elHeaderBadge.textContent = a.statusLabel;
      }

      const fullAddr = [
        `บ้านเลขที่ ${a.house_no}`,
        a.village_no ? `หมู่ ${a.village_no}` : '',
        a.building ? a.building : '',
        a.soi ? `ซอย ${a.soi}` : '',
        a.road ? `ถนน ${a.road}` : '',
        `ตำบล${a.subdistrict}`,
        `อำเภอ${a.district}`,
        `จังหวัด${a.province}`,
        a.postal_code
      ].filter(Boolean).join(' ');
      document.getElementById('mdlAppAddress').textContent = fullAddr;

      const photoImg = document.getElementById('mdlAppPhoto');
      const photoLink = document.getElementById('mdlAppPhotoLink');
      const photoSrc = a.photo_url ? (a.photo_url.startsWith('http') ? a.photo_url : (getApi().getBaseUrl() + a.photo_url)) : 'assets/icons/sarawat-logo.png';
      photoImg.src = photoSrc;
      if (photoLink) photoLink.href = photoSrc;

      // Status selector
      const selStatus = document.getElementById('mdlSelectStatus');
      selStatus.value = a.status;

      document.getElementById('mdlAdminNotes').value = a.admin_notes || '';
      const inpEvalScore = document.getElementById('mdlEvaluationScore');
      if (inpEvalScore) {
        inpEvalScore.value = (a.evaluation_score !== null && a.evaluation_score !== undefined) ? a.evaluation_score : '';
      }

      // Populate Attitude & Motivation Answers List
      const answersList = document.getElementById('mdlAttitudeAnswersList');
      const countBadge = document.getElementById('mdlAnswersCountBadge');
      if (answersList) {
        if (!a.answers || a.answers.length === 0) {
          if (countBadge) countBadge.textContent = '0 ข้อ';
          answersList.innerHTML = '<div style="color: #94a3b8; font-size: 0.85rem; text-align: center; padding: 14px; font-style: italic;">ผู้สมัครรายนี้ไม่ได้ระบุคำตอบทัศนคติ หรือยื่นสมัครก่อนมีระบบคำถาม</div>';
        } else {
          if (countBadge) countBadge.textContent = `${a.answers.length} ข้อ`;
          answersList.innerHTML = a.answers.map((ans, idx) => {
            const qNum = ans.order_index || (idx + 1);
            const qText = escapeHtml(ans.question_text || `คำถามข้อที่ ${qNum}`);
            const aText = ans.answer_text ? escapeHtml(ans.answer_text) : '';
            const charCount = (ans.answer_text || '').length;

            return `
              <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.02);">
                <div style="background: #f8fafc; padding: 12px 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                  <div style="display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: center;">
                    <div style="font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif; font-size: 1.35rem; font-weight: 900; line-height: 1; color: #0f172a; min-width: 20px;">
                      ${qNum}
                    </div>
                    <div style="font-size: 0.90rem; font-weight: 750; color: #0f172a; line-height: 1.45;">
                      ${qText}
                    </div>
                  </div>
                  <span style="font-size: 0.72rem; font-weight: 600; color: #64748b; background: #ffffff; border: 1px solid #cbd5e1; padding: 2px 8px; border-radius: 6px; flex-shrink: 0;">
                    ${charCount} ตัวอักษร
                  </span>
                </div>
                <div style="font-size: 0.92rem; color: #1e293b; line-height: 1.65; white-space: pre-wrap; word-break: break-word; background: #ffffff; padding: 14px 16px; border-left: 4px solid #3b82f6;">
                  ${aText ? aText : '<span style="color:#94a3b8; font-style:italic;">(ผู้สมัครไม่ได้ระบุข้อความคำตอบ)</span>'}
                </div>
              </div>
            `;
          }).join('')
        }
      }

      // Configure Modal Footer Buttons for Trash Mode vs Normal Mode
      const btnDelCurrent = document.getElementById('btnDeleteCurrentApplicant');
      const boxTrashActions = document.getElementById('boxTrashActionsInModal');
      const btnSaveDec = document.getElementById('btnSaveApplicantDecision');

      if (a.is_deleted || isTrashModeActive) {
        if (btnDelCurrent) btnDelCurrent.style.display = 'none';
        if (boxTrashActions) boxTrashActions.style.display = 'flex';
        if (btnSaveDec) btnSaveDec.style.display = 'none';
      } else {
        if (btnDelCurrent) btnDelCurrent.style.display = 'inline-flex';
        if (boxTrashActions) boxTrashActions.style.display = 'none';
        if (btnSaveDec) btnSaveDec.style.display = 'inline-flex';
      }
      document.getElementById('mdlCorrectionNote').value = a.correction_note || '';

      const corrGroup = document.getElementById('mdlCorrectionNoteGroup');
      corrGroup.style.display = a.status === 'correction_needed' ? 'block' : 'none';

      const boxEditLink = document.getElementById('boxCorrectionEditLink');
      const inpDirectLink = document.getElementById('inpCorrectionDirectLink');
      const btnOpenPage = document.getElementById('btnOpenCorrectionPage');
      const btnCopyLink = document.getElementById('btnCopyCorrectionLink');

      const updateCorrectionLinkUI = () => {
        if (boxEditLink && inpDirectLink && btnOpenPage) {
          if (a.student_id && (selStatus.value === 'correction_needed' || a.status === 'correction_needed')) {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const base = isLocal ? window.location.origin : 'https://admission.sarawatdc.site';
            const fullLink = `${base}/?edit=${a.student_id}`;
            inpDirectLink.value = fullLink;
            btnOpenPage.href = fullLink;
            boxEditLink.style.display = 'block';

            if (btnCopyLink && !btnCopyLink.dataset.bound) {
              btnCopyLink.dataset.bound = 'true';
              btnCopyLink.onclick = () => {
                navigator.clipboard.writeText(fullLink).then(() => {
                  btnCopyLink.textContent = 'คัดลอกแล้ว!';
                  setTimeout(() => btnCopyLink.textContent = 'คัดลอก', 2000);
                }).catch(() => {
                  inpDirectLink.select();
                  document.execCommand('copy');
                  btnCopyLink.textContent = 'คัดลอกแล้ว!';
                  setTimeout(() => btnCopyLink.textContent = 'คัดลอก', 2000);
                });
              };
            }
          } else if (boxEditLink) {
            boxEditLink.style.display = 'none';
          }
        }
      };
      updateCorrectionLinkUI();

      selStatus.onchange = () => {
        corrGroup.style.display = selStatus.value === 'correction_needed' ? 'block' : 'none';
        updateCorrectionLinkUI();
        if (elHeaderBadge) {
          elHeaderBadge.className = `status-badge ${selStatus.value}`;
          const optText = selStatus.options[selStatus.selectedIndex]?.text.split('(')[0].replace(/^[^\s]+\s+/, '').trim();
          elHeaderBadge.textContent = optText;
        }
      };

      // Status History with beautiful modern timeline
      const histBox = document.getElementById('mdlStatusHistoryTimeline');
      if (res.history && res.history.length > 0) {
        histBox.innerHTML = `
          <div class="app-timeline-list">
            ${res.history.map(h => `
              <div class="app-timeline-item">
                <div class="app-timeline-dot"></div>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; box-shadow: 0 2px 6px rgba(15,23,42,0.02);">
                  <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="status-badge ${h.new_status}" style="font-size: 0.74rem; padding: 2px 9px;">${h.newLabel}</span>
                      <span style="font-size: 0.82rem; color: #475569;">โดย: <strong style="color: #0f172a;">${h.changed_by}</strong></span>
                    </div>
                    <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">
                      ${new Date(h.created_at).toLocaleString('th-TH')}
                    </div>
                  </div>
                  ${h.note ? `<div style="font-size: 0.8rem; color: #475569; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border-left: 3px solid #cbd5e1; margin-top: 6px;">${h.note}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        histBox.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 16px; font-size: 0.85rem;"><i data-lucide="check-circle" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; margin-right: 6px;"></i>ยังไม่มีประวัติการเปลี่ยนสถานะ</div>';
      }

      if (window.lucide) lucide.createIcons();
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
      hideModalSafely(modal);
    }
  };

  window.closeApplicantReviewModal = function () {
    const modal = document.getElementById('adminApplicantReviewModal');
    hideModalSafely(modal);
  };

  // ==========================================================
  // 5. EVENT LISTENERS INITIALIZATION
  // ==========================================================
  function setupRecruitmentEventListeners() {
    // Toggle Trash Mode
    const btnToggleTrash = document.getElementById('btnToggleTrashView');
    const bannerTrash = document.getElementById('bannerTrashMode');
    const btnExitTrash = document.getElementById('btnExitTrashMode');

    function setTrashMode(active) {
      isTrashModeActive = active;
      if (bannerTrash) bannerTrash.style.display = isTrashModeActive ? 'flex' : 'none';
      if (btnToggleTrash) {
        btnToggleTrash.style.background = isTrashModeActive ? '#fee2e2' : '#ffffff';
        btnToggleTrash.style.borderColor = isTrashModeActive ? '#fca5a5' : '#cbd5e1';
      }
      selectedApplicantIds.clear();
      syncBulkSelectionBar();
      loadApplicantsTable(1);
    }

    if (btnToggleTrash) {
      btnToggleTrash.addEventListener('click', () => {
        setTrashMode(!isTrashModeActive);
      });
    }

    if (btnExitTrash) {
      btnExitTrash.addEventListener('click', () => {
        setTrashMode(false);
      });
    }

    // Bulk Selection & Status Update
    const chkSelectAll = document.getElementById('chkSelectAllApplicants');
    if (chkSelectAll) {
      chkSelectAll.addEventListener('change', () => {
        const isChecked = chkSelectAll.checked;
        document.querySelectorAll('.chk-applicant-row').forEach(cb => {
          cb.checked = isChecked;
          const id = cb.getAttribute('data-id');
          if (isChecked) {
            if (id) selectedApplicantIds.add(String(id));
          } else {
            if (id) selectedApplicantIds.delete(String(id));
          }
        });
        syncBulkSelectionBar();
      });
    }

    const btnClearBulk = document.getElementById('btnClearBulkSelection');
    if (btnClearBulk) {
      btnClearBulk.addEventListener('click', () => {
        selectedApplicantIds.clear();
        document.querySelectorAll('.chk-applicant-row').forEach(cb => { cb.checked = false; });
        if (chkSelectAll) chkSelectAll.checked = false;
        syncBulkSelectionBar();
      });
    }

    const btnApplyBulk = document.getElementById('btnApplyBulkStatus');
    if (btnApplyBulk) {
      btnApplyBulk.addEventListener('click', async () => {
        if (selectedApplicantIds.size === 0) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'info',
              title: 'ยังไม่ได้เลือกรายการ',
              text: 'กรุณาติ๊กเลือกผู้สมัครที่ต้องการเปลี่ยนสถานะอย่างน้อย 1 คน',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
          }
          return;
        }

        const targetStatus = document.getElementById('selBulkTargetStatus')?.value || 'reviewing';
        const adminNotes = (document.getElementById('txtBulkAdminNotes')?.value || '').trim();
        const count = selectedApplicantIds.size;

        const statusMap = {
          pending: { label: 'รอการตรวจสอบ (Pending)', color: '#d97706', bg: '#fef3c7' },
          reviewing: { label: 'กำลังตรวจสอบ (Reviewing)', color: '#2563eb', bg: '#eff6ff' },
          approved: { label: 'ผ่านการคัดเลือก (Approved)', color: '#16a34a', bg: '#f0fdf4' },
          rejected: { label: 'ไม่ผ่านการคัดเลือก (Rejected)', color: '#dc2626', bg: '#fef2f2' },
          correction_needed: { label: 'ขอให้แก้ไขข้อมูล (Correction Needed)', color: '#9333ea', bg: '#faf5ff' }
        };
        const sInfo = statusMap[targetStatus] || { label: targetStatus, color: '#475569', bg: '#f1f5f9' };

        // Confirmation Modal in SI-ROSTER Style
        const confirmRes = await Swal.fire({
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
              <div style="width: 76px; height: 76px; border-radius: 50%; background: #EFF6FF; border: 2px solid #BFDBFE; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(37, 99, 235, 0.22);">
                <i data-lucide="users" style="width: 32px; height: 32px; color: #2563EB;"></i>
              </div>
              <h2 style="color: #0F172A; font-weight: 800; font-size: 1.45rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">ยืนยันการปรับสถานะแบบกลุ่ม</h2>
              <div style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 16px; width: 100%; background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 14px 18px; border-radius: 14px; box-sizing: border-box; text-align: left;">
                <div style="font-size: 0.88rem; color: #64748B; margin-bottom: 4px;">จำนวนผู้สมัครที่เลือก:</div>
                <div style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin-bottom: 8px;">${count} คน</div>
                <div style="font-size: 0.88rem; color: #64748B; margin-bottom: 4px;">ปรับเปลี่ยนสถานะเป็น:</div>
                <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 800; font-size: 0.88rem; background: ${sInfo.bg}; color: ${sInfo.color}; border: 1px solid ${sInfo.color}30;">
                  ${sInfo.label}
                </div>
                ${adminNotes ? `
                  <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #CBD5E1; font-size: 0.82rem; color: #475569;">
                    <strong>บันทึกของกรรมการ:</strong> "${adminNotes}"
                  </div>
                ` : ''}
              </div>
              <div style="font-size: 0.85rem; color: #64748b; line-height: 1.45;">
                ระบบจะอัปเดตสถานะ บันทึกประวัติ และส่งการแจ้งเตือนไปยัง Discord ทันที
              </div>
            </div>
          `,
          showConfirmButton: true,
          showCancelButton: true,
          confirmButtonColor: '#2563EB',
          cancelButtonColor: '#F1F5F9',
          confirmButtonText: 'ยืนยันการเปลี่ยนสถานะ',
          cancelButtonText: '<span style="color: #64748B;">ยกเลิก</span>',
          reverseButtons: true,
          customClass: {
            popup: 'custom-swal-popup',
            confirmButton: 'custom-swal-btn',
            cancelButton: 'custom-swal-btn'
          }
        });

        if (!confirmRes.isConfirmed) return;

        // SI-ROSTER Loading
        Swal.fire({
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
              <div style="width: 76px; height: 76px; border-radius: 50%; background: #EFF6FF; border: 2px solid #BFDBFE; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(37, 99, 235, 0.25);">
                <i data-lucide="loader-2" class="animate-spin" style="width: 36px; height: 36px; color: #2563EB;"></i>
              </div>
              <h2 style="color: #0F172A; font-weight: 800; font-size: 1.45rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">กำลังอัปเดตสถานะ</h2>
              <div style="color: #64748B; font-size: 0.95rem; line-height: 1.5;">
                กำลังบันทึกและส่งข้อมูลแจ้งเตือนสำหรับผู้สมัคร ${count} คน...
              </div>
            </div>
          `,
          showConfirmButton: false,
          allowOutsideClick: false,
          customClass: { popup: 'custom-swal-popup' }
        });

        try {
          const res = await getApi().adminBulkUpdateApplicantStatus(
            Array.from(selectedApplicantIds),
            targetStatus,
            adminNotes
          );

          if (res && res.success) {
            if (window.RosterAudio && typeof window.RosterAudio.playSuccess === 'function') {
              window.RosterAudio.playSuccess();
            }

            Swal.fire({
              html: `
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                  <div style="width: 76px; height: 76px; border-radius: 50%; background: #ECFDF5; border: 2px solid #A7F3D0; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);">
                    <i data-lucide="check-circle-2" style="width: 38px; height: 38px; color: #10B981;"></i>
                  </div>
                  <h2 style="color: #0F172A; font-weight: 800; font-size: 1.45rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">อัปเดตสถานะสำเร็จ</h2>
                  <div style="color: #64748B; font-size: 0.95rem; line-height: 1.5;">
                    ปรับปรุงสถานะผู้สมัครเรียบร้อยแล้วทั้งหมด <strong>${res.updatedCount || count}</strong> คน
                  </div>
                </div>
              `,
              timer: 2200,
              showConfirmButton: false,
              customClass: { popup: 'custom-swal-popup' }
            });

            selectedApplicantIds.clear();
            const inpNotes = document.getElementById('txtBulkAdminNotes');
            if (inpNotes) inpNotes.value = '';
            syncBulkSelectionBar();
            loadApplicantsTable(currentPage);
            loadRecruitmentOverview();
          } else {
            throw new Error(res.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
          }
        } catch (err) {
          if (window.RosterAudio && typeof window.RosterAudio.playError === 'function') {
            window.RosterAudio.playError();
          }
          Swal.fire({
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <div style="width: 76px; height: 76px; border-radius: 50%; background: #FEF2F2; border: 2px solid #FECACA; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.25);">
                  <i data-lucide="alert-triangle" style="width: 34px; height: 34px; color: #EF4444;"></i>
                </div>
                <h2 style="color: #0F172A; font-weight: 800; font-size: 1.45rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">ไม่สามารถอัปเดตสถานะได้</h2>
                <div style="color: #991B1B; font-size: 0.92rem; line-height: 1.5; background: #FEF2F2; border: 1.5px solid #FCA5A5; padding: 12px 16px; border-radius: 12px; margin-top: 10px; width: 100%; box-sizing: border-box;">
                  ${err.message || 'เกิดข้อผิดพลาดในการดำเนินการ'}
                </div>
              </div>
            `,
            confirmButtonColor: '#0F172A',
            confirmButtonText: 'ตกลง',
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
          });
        }
      });
    }

    // 5.1 Filters & Search
    const inpSearch = document.getElementById('adminApplicantSearch');
    if (inpSearch) {
      let debounceTimer;
      inpSearch.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => loadApplicantsTable(1), 350);
      });
    }

    const selFilterStatus = document.getElementById('adminFilterStatus');
    if (selFilterStatus) {
      selFilterStatus.addEventListener('change', () => loadApplicantsTable(1));
    }

    const selFilterGrade = document.getElementById('adminFilterGrade');
    if (selFilterGrade) {
      selFilterGrade.addEventListener('change', () => loadApplicantsTable(1));
    }

    const btnResetFilters = document.getElementById('btnResetApplicantFilters');
    if (btnResetFilters) {
      btnResetFilters.addEventListener('click', () => {
        if (inpSearch) inpSearch.value = '';
        if (selFilterStatus) selFilterStatus.value = 'all';
        if (selFilterGrade) selFilterGrade.value = 'all';
        loadApplicantsTable(1);
      });
    }

    // 5.2 Pagination
    const btnPrev = document.getElementById('btnPrevPageApplicant');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (currentPage > 1) loadApplicantsTable(currentPage - 1);
      });
    }
    const btnNext = document.getElementById('btnNextPageApplicant');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        loadApplicantsTable(currentPage + 1);
      });
    }

    // 5.3 Close Applicant Review Modal
    const btnCloseReview = document.getElementById('btnCloseApplicantReview');
    const modalReview = document.getElementById('adminApplicantReviewModal');
    if (btnCloseReview && modalReview) {
      btnCloseReview.addEventListener('click', () => hideModalSafely(modalReview));
    }

    // 5.4 Save Status Decision
    const btnSaveDecision = document.getElementById('btnSaveApplicantDecision');
    if (btnSaveDecision) {
      btnSaveDecision.addEventListener('click', async () => {
        if (!currentViewingApplicantId) return;

        const status = document.getElementById('mdlSelectStatus').value;
        const adminNotes = document.getElementById('mdlAdminNotes').value.trim();
        const correctionNote = document.getElementById('mdlCorrectionNote').value.trim();

        if (status === 'correction_needed' && !correctionNote) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'warning',
              title: 'ข้อมูลไม่ครบถ้วน',
              text: 'กรุณากรอกข้อความแจ้งจุดที่ต้องการให้นักเรียนแก้ไข',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
          } else {
            alert('กรุณากรอกข้อความแจ้งจุดที่ต้องการให้นักเรียนแก้ไข');
          }
          document.getElementById('mdlCorrectionNote')?.focus();
          return;
        }

        btnSaveDecision.disabled = true;
        btnSaveDecision.innerHTML = '<span>กำลังบันทึก...</span>';

        try {
          const res = await getApi().adminUpdateApplicantStatus(currentViewingApplicantId, {
            status,
            admin_notes: adminNotes,
            correction_note: correctionNote,
            changed_by: getActiveAdminName()
          });

          if (res.success) {
            if (window.showToast) window.showToast(res.message || 'บันทึกผลการพิจารณาเรียบร้อยแล้ว', 'success');
            else alert(res.message || 'บันทึกผลการพิจารณาเรียบร้อยแล้ว');
            hideModalSafely(modalReview);
            await refreshRecruitmentStats();
            await loadApplicantsTable(currentPage);
          }
        } catch (err) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาดในการบันทึก',
              text: err.message,
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
          } else {
            alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
          }
        } finally {
          btnSaveDecision.disabled = false;
          btnSaveDecision.innerHTML = '<i data-lucide="check" style="width: 16px; height: 16px;"></i><span>บันทึกผลการพิจารณา</span>';
          if (window.lucide) lucide.createIcons();
        }
      });
    }

    // ==========================================
  // RESTORE & PERMANENT DELETE HANDLERS
  // ==========================================
  async function confirmAndRestoreApplicant(id, name, code) {
    if (!id) return;
    const displayName = name ? ` (${name})` : '';
    const displayCode = code || `ID #${id}`;

    let confirmed = false;
    if (typeof Swal !== 'undefined') {
      const res = await Swal.fire({
        title: 'ยืนยันการกู้คืนใบสมัคร?',
        html: `ต้องการกู้คืนใบสมัคร <b>${escapeHtml(displayCode)}${escapeHtml(displayName)}</b> กลับสู่ระบบรับสมัครตามปกติหรือไม่?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'กู้คืนใบสมัคร',
        cancelButtonText: 'ยกเลิก'
      });
      confirmed = res.isConfirmed;
    } else {
      confirmed = confirm(`ต้องการกู้คืนใบสมัคร ${displayCode}${displayName} กลับสู่ระบบรับสมัครตามปกติหรือไม่?`);
    }
    if (!confirmed) return;

    try {
      const res = await getApi().adminRestoreApplicant(id, getActiveAdminName());
      if (window.showToast) window.showToast(res.message || 'กู้คืนใบสมัครเรียบร้อยแล้ว', 'success');
      else alert(res.message || 'กู้คืนใบสมัครเรียบร้อยแล้ว');

      const modalReview = document.getElementById('adminApplicantReviewModal');
      if (modalReview) hideModalSafely(modalReview);

      await refreshRecruitmentStats();
      await loadApplicantsTable(currentPage);
    } catch (err) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: err.message });
      } else {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    }
  }
  window.confirmAndRestoreApplicant = confirmAndRestoreApplicant;

  async function confirmAndPermanentDeleteApplicant(id, name, code) {
    if (!id) return;
    if (!isSuperAdmin()) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'ไม่มีสิทธิ์ดำเนินการ',
          text: 'เฉพาะ Super Admin เท่านั้นที่สามารถลบข้อมูลผู้สมัครถาวรออกจากฐานข้อมูลได้'
        });
      } else {
        alert('เฉพาะ Super Admin เท่านั้นที่สามารถลบข้อมูลผู้สมัครถาวรออกจากฐานข้อมูลได้');
      }
      return;
    }

    const displayName = name ? ` (${name})` : '';
    const displayCode = code || `ID #${id}`;

    let confirmed = false;
    if (typeof Swal !== 'undefined') {
      const res = await Swal.fire({
        title: '⚠️ ยืนยันการลบถาวร (Super Admin)',
        html: `คุณแน่ใจหรือไม่ว่าต้องการลบใบสมัคร <b>${escapeHtml(displayCode)}${escapeHtml(displayName)}</b> ออกจากฐานข้อมูลอย่างถาวร?<br><br><span style="color:#dc2626; font-size:0.85rem;">คำเตือน: ข้อมูลผู้สมัคร รูปถ่าย และคำตอบประเมินทั้งหมดจะถูกลบทิ้งอย่างถาวร ไม่สามารถกู้คืนได้อีกต่อไป</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ลบถาวรทันที',
        cancelButtonText: 'ยกเลิก'
      });
      confirmed = res.isConfirmed;
    } else {
      confirmed = confirm(`⚠️ ยืนยันการลบถาวร: ต้องการลบใบสมัคร ${displayCode}${displayName} ออกจากฐานข้อมูลอย่างถาวรหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`);
    }
    if (!confirmed) return;

    try {
      const res = await getApi().adminPermanentDeleteApplicant(id, getActiveAdminName(), getActiveAdminRole());
      if (window.showToast) window.showToast(res.message || 'ลบใบสมัครถาวรเรียบร้อยแล้ว', 'success');
      else alert(res.message || 'ลบใบสมัครถาวรเรียบร้อยแล้ว');

      const modalReview = document.getElementById('adminApplicantReviewModal');
      if (modalReview) hideModalSafely(modalReview);

      await refreshRecruitmentStats();
      await loadApplicantsTable(currentPage);
    } catch (err) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาดในการลบถาวร', text: err.message });
      } else {
        alert('เกิดข้อผิดพลาดในการลบถาวร: ' + err.message);
      }
    }
  }
  window.confirmAndPermanentDeleteApplicant = confirmAndPermanentDeleteApplicant;

  // 5.4.1 Delete Single Applicant from Review Modal
    const btnDeleteCurrent = document.getElementById('btnDeleteCurrentApplicant');
    if (btnDeleteCurrent) {
      const btnRestoreCurrent = document.getElementById('btnRestoreCurrentApplicant');
    if (btnRestoreCurrent) {
      btnRestoreCurrent.addEventListener('click', () => {
        if (!currentViewingApplicantId) return;
        confirmAndRestoreApplicant(currentViewingApplicantId, document.getElementById('mdlAppName')?.textContent, document.getElementById('mdlAppCode')?.textContent);
      });
    }

    const btnPermDeleteCurrent = document.getElementById('btnPermanentDeleteCurrentApplicant');
    if (btnPermDeleteCurrent) {
      btnPermDeleteCurrent.addEventListener('click', () => {
        if (!currentViewingApplicantId) return;
        confirmAndPermanentDeleteApplicant(currentViewingApplicantId, document.getElementById('mdlAppName')?.textContent, document.getElementById('mdlAppCode')?.textContent);
      });
    }

    btnDeleteCurrent.addEventListener('click', () => {
        if (!currentViewingApplicantId) return;
        const code = document.getElementById('mdlAppCode')?.textContent?.trim() || '';
        const name = document.getElementById('mdlAppName')?.textContent?.trim() || '';
        confirmAndDeleteApplicant(currentViewingApplicantId, name, code);
      });
    }

    // 5.4.2 Wipe All Applicants (Bulk Delete)
    const btnWipeAll = document.getElementById('btnWipeAllApplicants');
    if (btnWipeAll) {
      btnWipeAll.addEventListener('click', confirmAndClearAllApplicants);
    }

    // 5.5 Fast Toggle Open/Closed
    const btnToggleOpen = document.getElementById('btnToggleRecruitmentOpen');
    if (btnToggleOpen) {
      btnToggleOpen.addEventListener('click', async () => {
        if (!recruitmentSettingsCache) {
          await refreshRecruitmentSettings();
        }
        const currentIsOpen = recruitmentSettingsCache ? (Number(recruitmentSettingsCache.is_open) === 1) : false;
        const newIsOpen = currentIsOpen ? 0 : 1;
        const actionLabel = newIsOpen ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร';

        let confirmed = false;
        if (typeof Swal !== 'undefined') {
          const res = await Swal.fire({
            title: `ยืนยันการ${actionLabel}?`,
            text: `คุณต้องการ${actionLabel}สารวัตรนักเรียนทันทีหรือไม่?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#64748b',
            confirmButtonText: `ใช่, ${actionLabel}`,
            cancelButtonText: 'ยกเลิก',
            customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
          });
          confirmed = res.isConfirmed;
        } else {
          confirmed = confirm(`ยืนยันการ${actionLabel}สารวัตรนักเรียนหรือไม่?`);
        }
        if (!confirmed) return;

        try {
          await getApi().adminUpdateRecruitmentSettings({
            is_open: newIsOpen,
            updated_by: getActiveAdminName()
          });
          await refreshRecruitmentSettings();
          if (window.showToast) window.showToast(`${actionLabel}เรียบร้อยแล้ว`, 'success');
        } catch (err) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: err.message,
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
          } else {
            alert('เกิดข้อผิดพลาด: ' + err.message);
          }
        }
      });
    }

    // 5.6 Export XLSX & CSV
    const btnExportXlsx = document.getElementById('btnExportRecruitXlsx');
    if (btnExportXlsx) {
      btnExportXlsx.addEventListener('click', () => {
        const status = document.getElementById('adminFilterStatus')?.value || 'all';
        const grade = document.getElementById('adminFilterGrade')?.value || 'all';
        const url = getApi().getRecruitmentExportUrl('xlsx', status, grade);
        window.open(url, '_blank');
      });
    }

    const btnExportCsv = document.getElementById('btnExportRecruitCsv');
    if (btnExportCsv) {
      btnExportCsv.addEventListener('click', () => {
        const status = document.getElementById('adminFilterStatus')?.value || 'all';
        const grade = document.getElementById('adminFilterGrade')?.value || 'all';
        const url = getApi().getRecruitmentExportUrl('csv', status, grade);
        window.open(url, '_blank');
      });
    }

    // 5.7 Settings & Clubs Modal
    const btnOpenSettings = document.getElementById('btnOpenRecruitSettings');
    const btnCloseSettings = document.getElementById('btnCloseRecruitSettings');

    if (btnOpenSettings) {
      btnOpenSettings.onclick = (e) => {
        e.preventDefault();
        window.openRecruitSettingsModal();
      };
    }
    if (btnCloseSettings) {
      btnCloseSettings.onclick = (e) => {
        e.preventDefault();
        window.closeRecruitSettingsModal();
      };
    }

    window.closeApplicantReviewModal = function () {
      const modal = document.getElementById('adminApplicantReviewModal');
      hideModalSafely(modal);
    };

    const tabSetGen = document.getElementById('tabBtnSetGeneral');
    const tabSetClubs = document.getElementById('tabBtnSetClubs');
    const tabSetQuestions = document.getElementById('tabBtnSetQuestions');
    const tabSetLogs = document.getElementById('tabBtnSetLogs');
    if (tabSetGen) tabSetGen.onclick = () => window.switchRecruitSettingsTab('gen');
    if (tabSetClubs) tabSetClubs.onclick = () => window.switchRecruitSettingsTab('clubs');
    if (tabSetQuestions) tabSetQuestions.onclick = () => window.switchRecruitSettingsTab('questions');
    if (tabSetLogs) tabSetLogs.onclick = () => window.switchRecruitSettingsTab('logs');

    // Save General Settings
    const btnSaveGen = document.getElementById('btnSaveGeneralSettings');
    if (btnSaveGen) {
      btnSaveGen.addEventListener('click', async () => {
        try {
          const allowedGradesStr = document.getElementById('cfgAllowedGrades').value.trim();
          if (!allowedGradesStr) {
            if (typeof Swal !== 'undefined') {
              Swal.fire({
                icon: 'warning',
                title: 'กรุณาเลือกระดับชั้น',
                text: 'กรุณาเลือกระดับชั้นที่เปิดรับสมัครอย่างน้อย 1 ระดับชั้น (ม.1 - ม.6)',
                customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
              });
            } else {
              alert('กรุณาเลือกระดับชั้นที่เปิดรับสมัครอย่างน้อย 1 ระดับชั้น (ม.1 - ม.6)');
            }
            return;
          }

          const payload = {
            academic_year: document.getElementById('cfgAcademicYear').value.trim(),
            min_gpax: parseFloat(document.getElementById('cfgMinGpax').value),
            allowed_grades: document.getElementById('cfgAllowedGrades').value.trim(),
            max_applicants: parseInt(document.getElementById('cfgMaxApplicants')?.value || '100', 10),
            target_quota: parseInt(document.getElementById('cfgTargetQuota')?.value || '30', 10),
            allow_withdrawal: document.getElementById('cfgAllowWithdrawal')?.checked ? 1 : 0,
            is_open: document.getElementById('cfgIsOpen')?.value === '0' ? 0 : 1,
            start_datetime: document.getElementById('cfgStartDatetime').value || null,
            end_datetime: document.getElementById('cfgEndDatetime').value || null,
            announcement_text: document.getElementById('cfgAnnouncementText').value.trim(),
            pdpa_content: document.getElementById('cfgPdpaContent').value.trim(),
            updated_by: getActiveAdminName()
          };

          await getApi().adminUpdateRecruitmentSettings(payload);
          if (window.showToast) window.showToast('บันทึกการตั้งค่ารับสมัครเรียบร้อยแล้ว', 'success');
          else alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
          await refreshRecruitmentSettings();
        } catch (err) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: err.message,
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
          } else {
            alert('เกิดข้อผิดพลาด: ' + err.message);
          }
        }
      });
    }

    // Add Club Form handlers
    const btnAddNewClub = document.getElementById('btnAddNewClubRow');
    const boxAddClub = document.getElementById('boxAddClubForm');
    const btnCancelAddClub = document.getElementById('btnCancelAddClub');
    const btnSaveNewClub = document.getElementById('btnSaveNewClub');

    if (btnAddNewClub && boxAddClub) {
      btnAddNewClub.addEventListener('click', () => { boxAddClub.style.display = 'block'; });
    }
    if (btnCancelAddClub && boxAddClub) {
      btnCancelAddClub.addEventListener('click', () => { boxAddClub.style.display = 'none'; });
    }
    
    // Attitude Question Form handlers
    const btnOpenAddQ = document.getElementById('btnOpenAddQuestionModal');
    const btnCancelQForm = document.getElementById('btnCancelQuestionForm');
    const btnCancelQEdit = document.getElementById('btnCancelQuestionEdit');
    const btnSaveQ = document.getElementById('btnSaveQuestion');

    if (btnOpenAddQ && !btnOpenAddQ._bound) {
      btnOpenAddQ._bound = true;
      btnOpenAddQ.addEventListener('click', () => openQuestionForm(null));
    }
    if (btnCancelQForm && !btnCancelQForm._bound) {
      btnCancelQForm._bound = true;
      btnCancelQForm.addEventListener('click', closeQuestionForm);
    }
    if (btnCancelQEdit && !btnCancelQEdit._bound) {
      btnCancelQEdit._bound = true;
      btnCancelQEdit.addEventListener('click', closeQuestionForm);
    }
    if (btnSaveQ && !btnSaveQ._bound) {
      btnSaveQ._bound = true;
      btnSaveQ.addEventListener('click', saveQuestionFromForm);
    }

    if (btnSaveNewClub) {
      btnSaveNewClub.addEventListener('click', async () => {
        const type = document.getElementById('inpNewClubType')?.value || 'club';
        const name = document.getElementById('inpNewClubName').value.trim();
        const quota = parseInt(document.getElementById('inpNewClubQuota').value) || 0;

        if (!name) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'warning',
              title: 'กรุณากรอกชื่อ',
              text: 'กรุณากรอกชื่อชุมนุมหรือสังกัด',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
          } else {
            alert('กรุณากรอกชื่อ');
          }
          return;
        }

        try {
          await getApi().adminCreateRecruitmentClub({ type, name, quota, admin: getActiveAdminName() });
          document.getElementById('inpNewClubName').value = '';
          boxAddClub.style.display = 'none';
          if (window.showToast) window.showToast('เพิ่มชุมนุม/สังกัดเรียบร้อยแล้ว', 'success');
          loadClubsTable();
        } catch (err) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'error',
              title: 'เกิดข้อผิดพลาด',
              text: err.message,
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
          } else {
            alert('เกิดข้อผิดพลาด: ' + err.message);
          }
        }
      });
    }
  }

  // ==========================================================
  // 6. GLOBAL SETTINGS MODAL & CLUBS MANAGER
  // ==========================================================
  async function loadSettingsForm() {
    try {
      const res = await getApi().adminGetRecruitmentSettings();
      if (res && res.settings) {
        const s = res.settings;
        const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setVal('cfgAcademicYear', s.academic_year || '2570');
        setVal('cfgMinGpax', s.min_gpax || '2.50');
        const allowedGradesVal = s.allowed_grades || 'ม.4,ม.5';
        setVal('cfgAllowedGrades', allowedGradesVal);
        syncGradeCheckboxesFromValue(allowedGradesVal);
        setVal('cfgMaxApplicants', s.max_applicants || '100');
        setVal('cfgTargetQuota', s.target_quota || '30');
        if (document.getElementById('cfgAllowWithdrawal')) {
          document.getElementById('cfgAllowWithdrawal').checked = Number(s.allow_withdrawal) !== 0;
        }
        setVal('cfgAnnouncementText', s.announcement_text || '');
        setVal('cfgPdpaContent', s.pdpa_content || '');
        setVal('cfgIsOpen', String(s.is_open !== undefined ? s.is_open : 1));
        if (typeof window.syncMasterRecruitmentSwitchUI === 'function') {
          window.syncMasterRecruitmentSwitchUI(s.is_open !== undefined ? s.is_open : 1);
        }
        if (s.start_datetime) setVal('cfgStartDatetime', s.start_datetime.replace(' ', 'T').slice(0, 16));
        else setVal('cfgStartDatetime', '');
        if (s.end_datetime) setVal('cfgEndDatetime', s.end_datetime.replace(' ', 'T').slice(0, 16));
        else setVal('cfgEndDatetime', '');
      }
    } catch (e) {
      console.warn('Error loading recruitment settings form:', e);
    }
  }

  async function loadClubsTable() {
    const tbody = document.getElementById('tblAdminClubsBody');
    if (!tbody) return;

    try {
      const res = await getApi().adminGetRecruitmentClubs();
      if (!res.clubs || res.clubs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #94a3b8;">ยังไม่มีข้อมูล</td></tr>';
        return;
      }

      tbody.innerHTML = res.clubs.map(c => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 10px 14px;">
            <span class="schedule-badge-status ${c.type === 'club' ? 'open' : 'reviewing'}" style="font-size: 0.72rem; padding: 2px 8px;">
              ${c.type === 'club' ? 'ชุมนุม' : 'สังกัด'}
            </span>
          </td>
          <td style="padding: 10px 14px; font-weight: 750; color: #0f172a;">${c.name}</td>
          <td style="padding: 10px 14px;">${c.quota > 0 ? c.quota + ' คน' : 'ไม่จำกัด'}</td>
          <td style="padding: 10px 14px; font-weight: 700;">${c.applicant_count || 0} คน</td>
          <td style="padding: 10px 14px; text-align: right;">
            <button type="button" class="btn-step-prev btn-del-club" data-id="${c.id}" style="padding: 4px 10px; font-size: 0.75rem; color: #ef4444;">
              ลบ
            </button>
          </td>
        </tr>
      `).join('');

      document.querySelectorAll('.btn-del-club').forEach(btn => {
        btn.addEventListener('click', async () => {
          let confirmed = false;
          if (typeof Swal !== 'undefined') {
            const res = await Swal.fire({
              title: 'ยืนยันลบรายการ?',
              text: 'คุณแน่ใจหรือไม่ว่าต้องการลบรายการนี้?',
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#dc2626',
              cancelButtonColor: '#64748b',
              confirmButtonText: 'ใช่, ลบ',
              cancelButtonText: 'ยกเลิก',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
            });
            confirmed = res.isConfirmed;
          } else {
            confirmed = confirm('ยืนยันลบรายการนี้หรือไม่?');
          }
          if (!confirmed) return;

          const id = btn.getAttribute('data-id');
          await getApi().adminDeleteRecruitmentClub(id);
          if (window.showToast) window.showToast('ลบรายการเรียบร้อยแล้ว', 'success');
          loadClubsTable();
        });
      });
    } catch (e) {
      console.warn('Error loading clubs table:', e);
    }
  }

  async function loadAuditLogsTable() {
    const tbody = document.getElementById('tblAdminLogsBody');
    if (!tbody) return;

    try {
      const res = await getApi().adminGetRecruitmentLogs();
      if (!res.logs || res.logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding: 20px; text-align: center; color: #94a3b8;">ยังไม่มีประวัติ Log</td></tr>';
        return;
      }

      tbody.innerHTML = res.logs.map(l => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 8px 12px; font-size: 0.78rem; color: #64748b; white-space: nowrap;">${l.created_at}</td>
          <td style="padding: 8px 12px; font-weight: 700; color: #0f172a;">${l.actor}</td>
          <td style="padding: 8px 12px; font-family: var(--dg-font-sans); color: #2563eb; font-weight: 700;">${l.action}</td>
          <td style="padding: 8px 12px; font-size: 0.8rem; color: #475569;">${l.target_id || '-'}</td>
          <td style="padding: 8px 12px; font-size: 0.78rem; color: #64748b; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${l.details || '-'}</td>
        </tr>
      `).join('');
    } catch (e) {
      console.warn('Error loading audit logs:', e);
    }
  }

    // ==========================================
  // MULTI-SELECT GRADE HELPERS
  // ==========================================
  function syncGradeCheckboxesFromValue(valStr) {
    const grades = (valStr || '').split(',').map(g => g.trim()).filter(Boolean);
    document.querySelectorAll('.chk-grade-option').forEach(chk => {
      const isChecked = grades.includes(chk.value);
      chk.checked = isChecked;
      const parentLabel = chk.closest('.grade-pill-option');
      if (parentLabel) parentLabel.classList.toggle('is-selected', isChecked);
    });
    const summaryEl = document.getElementById('lblAllowedGradesSummary');
    if (summaryEl) {
      summaryEl.textContent = grades.length > 0 ? grades.join(', ') : '(ยังไม่ได้เลือก - กรุณาเลือกอย่างน้อย 1 ระดับชั้น)';
      summaryEl.style.color = grades.length > 0 ? '#0f172a' : '#dc2626';
    }
  }
  window.syncGradeCheckboxesFromValue = syncGradeCheckboxesFromValue;

  function syncSelectedGrades() {
    const checked = Array.from(document.querySelectorAll('.chk-grade-option:checked')).map(c => c.value);
    const order = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];
    checked.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const valStr = checked.join(',');
    const hiddenInput = document.getElementById('cfgAllowedGrades');
    if (hiddenInput) hiddenInput.value = valStr;

    document.querySelectorAll('.chk-grade-option').forEach(chk => {
      const parentLabel = chk.closest('.grade-pill-option');
      if (parentLabel) parentLabel.classList.toggle('is-selected', chk.checked);
    });

    const summaryEl = document.getElementById('lblAllowedGradesSummary');
    if (summaryEl) {
      summaryEl.textContent = checked.length > 0 ? checked.join(', ') : '(ยังไม่ได้เลือก - กรุณาเลือกอย่างน้อย 1 ระดับชั้น)';
      summaryEl.style.color = checked.length > 0 ? '#0f172a' : '#dc2626';
    }
  }
  window.syncSelectedGrades = syncSelectedGrades;

  window.selectAllGrades = function (selectAll) {
    document.querySelectorAll('.chk-grade-option').forEach(chk => {
      chk.checked = Boolean(selectAll);
    });
    syncSelectedGrades();
  };

  window.selectHighSchoolGrades = function () {
    document.querySelectorAll('.chk-grade-option').forEach(chk => {
      chk.checked = ['ม.4', 'ม.5', 'ม.6'].includes(chk.value);
    });
    syncSelectedGrades();
  };

  function switchRecruitSettingsTab(tab) {
    const tabSetGen = document.getElementById('tabBtnSetGeneral');
    const tabSetClubs = document.getElementById('tabBtnSetClubs');
    const tabSetQuestions = document.getElementById('tabBtnSetQuestions');
    const tabSetLogs = document.getElementById('tabBtnSetLogs');
    const paneSetGen = document.getElementById('setPaneGeneral');
    const paneSetClubs = document.getElementById('setPaneClubs');
    const paneSetQuestions = document.getElementById('setPaneQuestions');
    const paneSetLogs = document.getElementById('setPaneLogs');

    [tabSetGen, tabSetClubs, tabSetQuestions, tabSetLogs].forEach(b => b?.classList.remove('active'));
    [paneSetGen, paneSetClubs, paneSetQuestions, paneSetLogs].forEach(p => { if (p) p.style.display = 'none'; });

    if (tab === 'gen') {
      tabSetGen?.classList.add('active');
      if (paneSetGen) paneSetGen.style.display = 'block';
    } else if (tab === 'clubs') {
      tabSetClubs?.classList.add('active');
      if (paneSetClubs) paneSetClubs.style.display = 'block';
      loadClubsTable();
    } else if (tab === 'questions') {
      tabSetQuestions?.classList.add('active');
      if (paneSetQuestions) paneSetQuestions.style.display = 'block';
      loadAdminQuestions();
    } else if (tab === 'logs') {
      tabSetLogs?.classList.add('active');
      if (paneSetLogs) paneSetLogs.style.display = 'block';
      loadAuditLogsTable();
    }
    if (window.lucide) lucide.createIcons();
  }
  window.switchRecruitSettingsTab = switchRecruitSettingsTab;

  window.openRecruitSettingsModal = async function () {
    const modal = document.getElementById('adminRecruitSettingsModal');
    if (!modal) return;
    showModalSafely(modal);
    switchRecruitSettingsTab('gen');
    await loadSettingsForm();
    await loadClubsTable();
    if (window.lucide) lucide.createIcons();
  };

  window.closeRecruitSettingsModal = function () {
    const modal = document.getElementById('adminRecruitSettingsModal');
    hideModalSafely(modal);
  };

  // Attach event listeners immediately or on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupRecruitmentEventListeners);
  } else {
    setupRecruitmentEventListeners();
  }



  // ==========================================================
  // 6. ATTITUDE QUESTIONS MANAGER
  // ==========================================================
  async function loadAdminQuestions() {
    const tbody = document.getElementById('tblAdminQuestionsBody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" style="padding: 24px; text-align: center; color: #94a3b8;"><i data-lucide="loader-2" class="spin" style="width: 18px; height: 18px; display:inline-block; vertical-align:middle; margin-right:6px;"></i>กำลังโหลดคำถาม...</td></tr>';
    if (window.lucide) lucide.createIcons();

    try {
      const api = getApi();
      if (!api) {
        throw new Error('API Client ไม่พร้อมใช้งาน');
      }
      let res = null;
      if (typeof api.adminGetRecruitmentQuestions === 'function') {
        res = await api.adminGetRecruitmentQuestions().catch(err => {
          console.warn('adminGetRecruitmentQuestions error, trying public questions:', err);
          return null;
        });
      }
      if (!res || !res.success) {
        if (typeof api.getRecruitmentQuestions === 'function') {
          res = await api.getRecruitmentQuestions().catch(err => {
            console.warn('getRecruitmentQuestions fallback failed:', err);
            return null;
          });
        }
      }
      if (res && res.success && Array.isArray(res.questions)) {
        adminQuestionsCache = res.questions;
        if (adminQuestionsCache.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="padding: 32px; text-align: center; color: #94a3b8;">ยังไม่มีชุดคำถามประเมินทัศนคติในระบบ กดปุ่ม "เพิ่มคำถามใหม่" ด้านบนเพื่อเริ่มต้น</td></tr>';
          return;
        }

        tbody.innerHTML = adminQuestionsCache.map((q, idx) => `
          <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='transparent'">
            <td style="padding: 12px 14px; text-align: center; font-weight: 800; color: #64748b;">${q.order_index || q.display_order || (idx + 1)}</td>
            <td style="padding: 12px 14px;">
              <div style="font-weight: 700; color: #0f172a; margin-bottom: 3px;">${escapeHtml(q.question_text)}</div>
              ${(q.question_desc || q.help_text) ? `<div style="font-size: 0.78rem; color: #64748b;">💡 ${escapeHtml(q.question_desc || q.help_text)}</div>` : ''}
            </td>
            <td style="padding: 12px 14px; text-align: center; font-size: 0.82rem; color: #475569;">
              ${q.min_length || 0} - ${q.max_length || 1000} ตัวอักษร
            </td>
            <td style="padding: 12px 14px; text-align: center;">
              ${q.is_required ? '<span style="color:#dc2626; font-weight:700; font-size:0.78rem;">จำเป็น</span>' : '<span style="color:#64748b; font-size:0.78rem;">ไม่บังคับ</span>'}
            </td>
            <td style="padding: 12px 14px; text-align: center;">
              ${q.is_active ? '<span class="status-badge approved" style="font-size:0.72rem; padding:2px 8px;">เปิดใช้</span>' : '<span class="status-badge" style="background:#f1f5f9; color:#94a3b8; font-size:0.72rem; padding:2px 8px;">ปิด</span>'}
            </td>
            <td style="padding: 12px 14px; text-align: right; white-space: nowrap;">
              <button type="button" class="btn-step-prev btn-edit-question" data-id="${q.id}" style="padding: 4px 10px; font-size: 0.78rem; margin-right: 4px;">
                <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i>
                <span>แก้ไข</span>
              </button>
              <button type="button" class="btn-step-prev btn-delete-question" data-id="${q.id}" data-text="${escapeHtml(q.question_text)}" style="padding: 4px 8px; font-size: 0.78rem; color: #ef4444; border-color: #fecaca; background: #fff1f2;">
                <i data-lucide="trash-2" style="width: 12px; height: 12px; color: #ef4444;"></i>
              </button>
            </td>
          </tr>
        `).join('');

        // Attach edit & delete events
        document.querySelectorAll('.btn-edit-question').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            const q = adminQuestionsCache.find(x => x.id === id);
            if (q) openQuestionForm(q);
          });
        });

        document.querySelectorAll('.btn-delete-question').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = parseInt(btn.getAttribute('data-id'), 10);
            const text = btn.getAttribute('data-text');
            confirmAndDeleteQuestion(id, text);
          });
        });

        if (window.lucide) lucide.createIcons();
      } else {
        const errMsg = (res && res.error) ? res.error : 'ไม่สามารถโหลดคำถามได้';
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #ef4444;">${escapeHtml(errMsg)}</td></tr>`;
      }
    } catch (err) {
      console.warn('Error loading admin questions:', err);
      tbody.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #ef4444;">ไม่สามารถโหลดคำถามได้ (${escapeHtml(err.message)})</td></tr>`;
    }
  }
  window.loadAdminQuestions = loadAdminQuestions;

  function openQuestionForm(q = null) {
    const box = document.getElementById('boxQuestionForm');
    if (!box) return;

    document.getElementById('txtQuestionFormTitle').textContent = q ? 'แก้ไขคำถามประเมินทัศนคติ' : 'เพิ่มคำถามประเมินทัศนคติใหม่';
    document.getElementById('inpQuestionId').value = q ? q.id : '';
    document.getElementById('inpQuestionText').value = q ? q.question_text : '';
    document.getElementById('inpQuestionHelp').value = q ? (q.question_desc || q.help_text || '') : '';
    document.getElementById('inpQuestionMinLen').value = q ? (q.min_length || 0) : 30;
    document.getElementById('inpQuestionMaxLen').value = q ? (q.max_length || 1000) : 1000;
    document.getElementById('inpQuestionOrder').value = q ? (q.order_index || q.display_order || 1) : (adminQuestionsCache.length + 1);
    document.getElementById('selQuestionRequired').value = q ? (q.is_required ? '1' : '0') : '1';
    document.getElementById('selQuestionActive').value = q ? (q.is_active ? '1' : '0') : '1';

    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    document.getElementById('inpQuestionText')?.focus();
  }
  window.openQuestionForm = openQuestionForm;

  function closeQuestionForm() {
    const box = document.getElementById('boxQuestionForm');
    if (box) box.style.display = 'none';
  }
  window.closeQuestionForm = closeQuestionForm;

  async function saveQuestionFromForm() {
    const id = document.getElementById('inpQuestionId')?.value;
    const text = document.getElementById('inpQuestionText')?.value.trim();
    const help = document.getElementById('inpQuestionHelp')?.value.trim();
    const minLen = parseInt(document.getElementById('inpQuestionMinLen')?.value || '0', 10);
    const maxLen = parseInt(document.getElementById('inpQuestionMaxLen')?.value || '1000', 10);
    const order = parseInt(document.getElementById('inpQuestionOrder')?.value || '1', 10);
    const isRequired = document.getElementById('selQuestionRequired')?.value === '1';
    const isActive = document.getElementById('selQuestionActive')?.value === '1';

    if (!text) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'warning',
          title: 'กรุณากรอกข้อความ',
          text: 'กรุณากรอกข้อความคำถามประเมินทัศนคติ',
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
        });
      } else {
        alert('กรุณากรอกข้อความคำถาม');
      }
      document.getElementById('inpQuestionText')?.focus();
      return;
    }

    const payload = {
      academic_year: document.getElementById('cfgAcademicYear')?.value.trim() || '2570',
      question_text: text,
      question_desc: help,
      help_text: help,
      min_length: minLen,
      max_length: maxLen,
      order_index: order,
      display_order: order,
      is_required: isRequired ? 1 : 0,
      is_active: isActive ? 1 : 0,
      admin: getActiveAdminName()
    };

    try {
      if (id) {
        await getApi().adminUpdateRecruitmentQuestion(id, payload);
        if (window.showToast) window.showToast('แก้ไขคำถามเรียบร้อยแล้ว', 'success');
        else alert('แก้ไขคำถามเรียบร้อยแล้ว');
      } else {
        await getApi().adminCreateRecruitmentQuestion(payload);
        if (window.showToast) window.showToast('เพิ่มคำถามใหม่เรียบร้อยแล้ว', 'success');
        else alert('เพิ่มคำถามใหม่เรียบร้อยแล้ว');
      }
      closeQuestionForm();
      await loadAdminQuestions();
    } catch (err) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'เกิดข้อผิดพลาดในการบันทึกคำถาม: ' + err.message,
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
        });
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกคำถาม: ' + err.message);
      }
    }
  }
  window.saveQuestionFromForm = saveQuestionFromForm;

  async function confirmAndDeleteQuestion(id, text) {
    if (!id) return;
    let confirmed = false;
    if (typeof Swal !== 'undefined') {
      const res = await Swal.fire({
        title: 'ยืนยันการลบคำถาม?',
        html: `ต้องการลบคำถาม: <b>"${escapeHtml(text)}"</b> หรือไม่?<br><span style="color:#ef4444; font-size:0.82rem;">คำถามนี้จะไม่แสดงให้ผู้สมัครตอบอีกต่อไป</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ใช่, ลบคำถาม',
        cancelButtonText: 'ยกเลิก',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      confirmed = res.isConfirmed;
    } else {
      confirmed = confirm(`ต้องการลบคำถาม: "${text}" หรือไม่?\n\nคำถามนี้จะไม่แสดงให้ผู้สมัครตอบอีกต่อไป`);
    }
    if (!confirmed) return;

    try {
      await getApi().adminDeleteRecruitmentQuestion(id);
      if (window.showToast) window.showToast('ลบคำถามเรียบร้อยแล้ว', 'success');
      else alert('ลบคำถามเรียบร้อยแล้ว');
      await loadAdminQuestions();
    } catch (err) {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'เกิดข้อผิดพลาดในการลบคำถาม: ' + err.message,
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
        });
      } else {
        alert('เกิดข้อผิดพลาดในการลบคำถาม: ' + err.message);
      }
    }
  }
  window.confirmAndDeleteQuestion = confirmAndDeleteQuestion;

})();
