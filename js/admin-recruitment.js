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
      if (window.SARAWAT_API_BASE) return window.SARAWAT_API_BASE;
      if (window.CLOUDFLARE_TUNNEL_URL) return window.CLOUDFLARE_TUNNEL_URL;
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
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
        method: 'DELETE'
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
        headers: { 'Content-Type': 'application/json' },
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
    correction_needed: 'รอแก้ไขข้อมูล'
  };

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
        document.getElementById('statTotalApplicants').textContent = stats.total || 0;
        document.getElementById('statPendingApplicants').textContent = stats.byStatus.pending || 0;
        document.getElementById('statReviewingApplicants').textContent = stats.byStatus.reviewing || 0;
        document.getElementById('statApprovedApplicants').textContent = stats.byStatus.approved || 0;
        document.getElementById('statCorrectionApplicants').textContent = stats.byStatus.correction_needed || 0;
        document.getElementById('statRejectedApplicants').textContent = stats.byStatus.rejected || 0;

        // Update sidebar badge
        const badge = document.getElementById('recruitmentCounterBadge');
        if (badge) {
          const pendingCount = (stats.byStatus.pending || 0) + (stats.byStatus.reviewing || 0);
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
      tbody.innerHTML = window.DgSkeletons.tableRows(9, 6);
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="padding: 30px; text-align: center; color: #94a3b8;">
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
        page,
        limit: pageLimit
      });

      if (!res.success || !res.applicants || res.applicants.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="9" style="padding: 48px 20px; text-align: center; color: #94a3b8;">
              <div style="width: 48px; height: 48px; border-radius: 50%; background: #f8fafc; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px; color: #cbd5e1;">
                <i data-lucide="inbox" style="width: 24px; height: 24px;"></i>
              </div>
              <div style="font-size: 0.95rem; font-weight: 700; color: #64748b;">ไม่พบรายการใบสมัคร</div>
              <div style="font-size: 0.8rem; color: #94a3b8; margin-top: 4px;">ลองเปลี่ยนคำค้นหาหรือตัวกรองด้านบน</div>
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

        return `
          <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#fbfcfe'" onmouseout="this.style.background='transparent'">
            <td style="padding: 12px 16px; font-weight: 800; color: #0f172a; white-space: nowrap;">
              ${a.application_code}
            </td>
            <td style="padding: 12px 16px;">
              <img src="${photoSrc}" alt="${a.first_name}" style="width: 38px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #cbd5e1; background: #e2e8f0; display: block;" onerror="this.src='assets/icons/sarawat-logo.png'" />
            </td>
            <td style="padding: 12px 16px; font-family: var(--dg-font-sans); font-weight: 700; color: #334155;">
              ${a.student_id}
            </td>
            <td style="padding: 12px 16px; font-weight: 750; color: #0f172a;">
              ${a.prefix}${a.first_name} ${a.last_name}
            </td>
            <td style="padding: 12px 16px; color: #475569; white-space: nowrap;">
              ${a.grade_level}/${a.classroom}
            </td>
            <td style="padding: 12px 16px; font-weight: 750; color: #0f172a; white-space: nowrap;">
              <span>${Number(a.gpax).toFixed(2)}</span>
              ${Number(a.gpax) < (recruitmentSettingsCache?.min_gpax || 2.50) ? `
                <span title="ต่ำกว่าเกณฑ์ขั้นต่ำ (${(recruitmentSettingsCache?.min_gpax || 2.50).toFixed(2)})" style="display: inline-block; margin-left: 4px; padding: 1px 6px; font-size: 0.7rem; font-weight: 800; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; border-radius: 9999px;">
                  ⚠️ ต่ำกว่าเกณฑ์
                </span>
              ` : ''}
            </td>
            <td style="padding: 12px 16px; font-size: 0.86rem; color: #1e293b; font-weight: 700; max-width: 240px;">
              <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${a.club}</div>
            </td>
            <td style="padding: 12px 16px; white-space: nowrap;">
              <span class="status-badge ${a.status}" style="font-size: 0.78rem; padding: 3px 10px;">
                ${a.statusLabel}
              </span>
            </td>
            <td style="padding: 12px 16px; text-align: right; white-space: nowrap;">
              <div style="display: inline-flex; align-items: center; justify-content: flex-end; gap: 6px;">
                <button type="button" class="photo-btn-select btn-view-applicant" data-id="${a.id}" style="padding: 6px 14px; font-size: 0.8rem;">
                  <i data-lucide="eye" style="width: 14px; height: 14px;"></i>
                  <span>ตรวจใบสมัคร</span>
                </button>
                <button type="button" class="btn-step-prev btn-delete-single-applicant" data-id="${a.id}" data-code="${a.application_code}" data-name="${a.prefix}${a.first_name} ${a.last_name}" title="ลบใบสมัครนี้ออกจากระบบ" style="padding: 6px 10px; font-size: 0.8rem; color: #ef4444; border-color: #fecaca; background: #fff1f2; transition: all 0.15s ease;">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px; color: #ef4444;"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Attach row click listeners
      document.querySelectorAll('.btn-view-applicant').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          openApplicantReviewModal(id);
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
        title: 'ยืนยันการลบใบสมัคร?',
        html: `คุณต้องการลบใบสมัคร <b>${escapeHtml(displayCode)}${escapeHtml(displayName)}</b> หรือไม่?<br><br><span style="color:#dc2626; font-size:0.88rem;">การลบนี้จะลบข้อมูลผู้สมัคร, ประวัติการพิจารณา และรูปถ่ายออกจากระบบอย่างถาวร (ไม่สามารถกู้คืนได้)</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'ใช่, ลบใบสมัคร',
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

    // 5.4.1 Delete Single Applicant from Review Modal
    const btnDeleteCurrent = document.getElementById('btnDeleteCurrentApplicant');
    if (btnDeleteCurrent) {
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
    const tabSetLogs = document.getElementById('tabBtnSetLogs');
    if (tabSetGen) tabSetGen.onclick = () => window.switchRecruitSettingsTab('gen');
    if (tabSetClubs) tabSetClubs.onclick = () => window.switchRecruitSettingsTab('clubs');
    if (tabSetLogs) tabSetLogs.onclick = () => window.switchRecruitSettingsTab('logs');

    // Save General Settings
    const btnSaveGen = document.getElementById('btnSaveGeneralSettings');
    if (btnSaveGen) {
      btnSaveGen.addEventListener('click', async () => {
        try {
          const payload = {
            academic_year: document.getElementById('cfgAcademicYear').value.trim(),
            min_gpax: parseFloat(document.getElementById('cfgMinGpax').value),
            allowed_grades: document.getElementById('cfgAllowedGrades').value.trim(),
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
        setVal('cfgAllowedGrades', s.allowed_grades || 'ม.4,ม.5');
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

  function switchRecruitSettingsTab(tab) {
    const tabSetGen = document.getElementById('tabBtnSetGeneral');
    const tabSetClubs = document.getElementById('tabBtnSetClubs');
    const tabSetLogs = document.getElementById('tabBtnSetLogs');
    const paneSetGen = document.getElementById('setPaneGeneral');
    const paneSetClubs = document.getElementById('setPaneClubs');
    const paneSetLogs = document.getElementById('setPaneLogs');

    [tabSetGen, tabSetClubs, tabSetLogs].forEach(b => b?.classList.remove('active'));
    [paneSetGen, paneSetClubs, paneSetLogs].forEach(p => { if (p) p.style.display = 'none'; });

    if (tab === 'gen') {
      tabSetGen?.classList.add('active');
      if (paneSetGen) paneSetGen.style.display = 'block';
    } else if (tab === 'clubs') {
      tabSetClubs?.classList.add('active');
      if (paneSetClubs) paneSetClubs.style.display = 'block';
      loadClubsTable();
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

})();
