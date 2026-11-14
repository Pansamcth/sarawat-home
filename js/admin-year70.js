/**
 * Year 70 Committee Points & Scoring Management Frontend
 * ========================================================
 * ระบบสะสมแต้มคณะทำงานสารวัตรนักเรียน ปีการศึกษา 2570
 * รองรับ: บันทึกแต้ม, ตรวจสอบประวัติ Log, จัดอันดับ Leaderboard,
 * อัปโหลดรูปโปรไฟล์, โน้ตสำหรับแอดมิน, ย้ายฝ่าย, ลบ, Export CSV & Print
 */

(function () {
  'use strict';

  // Constants
  const VALID_POSITIONS = [
    'ประธาน',
    'รองประธาน',
    'ฝ่ายเลขานุการ',
    'ฝ่ายเอกสาร',
    'ฝ่ายกิจกรรม',
    'ฝ่ายโสตทัศนศิลป์',
    'ฝ่ายการเงิน',
    'ฝ่ายวินัย',
    'ฝ่ายอุปกรณ์',
    'ฝ่ายสารวัตรพยาบาล'
  ];

  const POSITION_ICONS = {
    'ALL': 'trophy',
    'ประธาน': 'crown',
    'รองประธาน': 'shield-check',
    'ฝ่ายเลขานุการ': 'clipboard-list',
    'ฝ่ายเอกสาร': 'file-text',
    'ฝ่ายกิจกรรม': 'sparkles',
    'ฝ่ายโสตทัศนศิลป์': 'camera',
    'ฝ่ายการเงิน': 'wallet',
    'ฝ่ายวินัย': 'shield-alert',
    'ฝ่ายอุปกรณ์': 'wrench',
    'ฝ่ายสารวัตรพยาบาล': 'heart-pulse'
  };

  // State
  let year70Positions = [];
  let year70Candidates = [];
  let currentPositionFilter = 'ALL';
  let currentSearchQuery = '';
  let allStudentsRoster = []; // 143 students
  let selectedStudentForAdd = null;
  let currentActiveCandidateForPoints = null;
  let currentActiveCandidateForLogs = null;
  let currentActiveCandidateForMove = null;
  let currentActiveCandidateForEdit = null;

  // Helpers
  function getApiBase() {
    return (window.SarawatApi && typeof window.SarawatApi.getBaseUrl === 'function')
      ? window.SarawatApi.getBaseUrl()
      : (window.SARAWAT_API_BASE || '');
  }

  function getAuthToken() {
    if (window.SarawatApi && typeof window.SarawatApi.getAuthToken === 'function') {
      const t = window.SarawatApi.getAuthToken();
      if (t) return t;
    }
    return localStorage.getItem('dg_sarawat_admin_token') || '';
  }

  function isSuperAdmin() {
    try {
      if (typeof isCurrentSuperAdmin === 'function') return isCurrentSuperAdmin();
      if (window.currentAdminUser && window.currentAdminUser.role === 'Super Admin') return true;
      const apiUser = (window.SarawatApi && typeof window.SarawatApi.getAuthUser === 'function') ? window.SarawatApi.getAuthUser() : null;
      if (apiUser && apiUser.role === 'Super Admin') return true;
      const storedRole = localStorage.getItem('dg_sarawat_admin_role');
      if (storedRole === 'Super Admin') return true;
    } catch (e) {}
    return false;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatThaiDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  function formatThaiShortDateTime(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr.replace(' ', 'T'));
      if (isNaN(d.getTime())) return dateStr;

      const now = new Date();
      const diffMs = now - d;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'เมื่อสักครู่';
      if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
      if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`;
      if (diffDays === 1) return 'เมื่อวานนี้';
      if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

      return d.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  }

  // View Mode: 'blocks' (default) or 'table'
  let currentYear70ViewMode = localStorage.getItem('dg_year70_view_mode') || 'blocks';

  window.setYear70ViewMode = function (mode) {
    currentYear70ViewMode = mode;
    localStorage.setItem('dg_year70_view_mode', mode);
    updateYear70ViewModeUI();
  };

  function updateYear70ViewModeUI() {
    const blocksContainer = document.getElementById('year70DepartmentsContainer');
    const tableWrapper = document.getElementById('year70TableWrapper');
    const btnBlocks = document.getElementById('year70ViewBtnBlocks');
    const btnTable = document.getElementById('year70ViewBtnTable');

    if (currentYear70ViewMode === 'table') {
      if (blocksContainer) blocksContainer.style.display = 'none';
      if (tableWrapper) tableWrapper.style.display = 'block';
      if (btnBlocks) {
        btnBlocks.style.background = 'transparent';
        btnBlocks.style.color = '#64748b';
      }
      if (btnTable) {
        btnTable.style.background = '#0f172a';
        btnTable.style.color = '#ffffff';
      }
    } else {
      if (blocksContainer) blocksContainer.style.display = 'block';
      if (tableWrapper) tableWrapper.style.display = 'none';
      if (btnBlocks) {
        btnBlocks.style.background = '#0f172a';
        btnBlocks.style.color = '#ffffff';
      }
      if (btnTable) {
        btnTable.style.background = 'transparent';
        btnTable.style.color = '#64748b';
      }
    }
    if (window.lucide) lucide.createIcons();
  }


  // ==========================================================
  // MODAL UTILITIES (FROSTED BLUR & ACCESSIBILITY)
  // ==========================================================
  function showYear70Modal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
      console.error(`Year 70 Modal #${modalId} not found in DOM!`);
      return;
    }
    modal.classList.add('active');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    modal.style.pointerEvents = 'auto';
    document.body.style.overflow = 'hidden';
    if (window.lucide) lucide.createIcons();
  }

  function hideYear70Modal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';
    modal.style.opacity = '';
    modal.style.visibility = '';
    modal.style.pointerEvents = '';
    document.body.style.overflow = '';
  }

  // ==========================================================
  // 1. DATA LOADING
  // ==========================================================
  window.loadYear70Admin = async function () {
    const tableBody = document.getElementById('year70CandidatesTableBody');
    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px; color: #64748b;">
            <i data-lucide="loader" class="dg-spin" style="width: 28px; height: 28px; margin-bottom: 10px; color: #f59e0b;"></i>
            <div style="font-size: 0.95rem; font-weight: 600;">กำลังโหลดข้อมูลระบบสะสมแต้ม ปี 70...</div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
    }

    const token = getAuthToken();
    try {
      // 1. Load Positions & Stats
      const posRes = await fetch(`${getApiBase()}/api/year70/positions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (posRes.ok) {
        const posData = await posRes.json();
        if (posData && posData.success && Array.isArray(posData.positions)) {
          year70Positions = posData.positions;
        }
      }

      // 2. Load Candidates
      let candUrl = `${getApiBase()}/api/year70/candidates?position=${encodeURIComponent(currentPositionFilter)}`;
      if (currentSearchQuery.trim()) {
        candUrl += `&search=${encodeURIComponent(currentSearchQuery.trim())}`;
      }
      const candRes = await fetch(candUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (candRes.ok) {
        const candData = await candRes.json();
        if (candData && candData.success && Array.isArray(candData.data)) {
          year70Candidates = candData.data;
        } else {
          year70Candidates = [];
        }
      }

      // Update badge in sidebar
      const badge = document.getElementById('year70CounterBadge');
      if (badge) {
        const totalCandidates = year70Positions.reduce((acc, p) => acc + (p.count || 0), 0);
        badge.textContent = totalCandidates;
        badge.style.display = totalCandidates > 0 ? 'inline-block' : 'none';
      }

      // Render all sections
      renderTabs();
      renderPodium();
      renderDepartmentBlocks();
      renderCandidatesTable();
      updateSummaryCounts();
      updateYear70ViewModeUI();
    } catch (err) {
      console.error('Failed to load Year 70 points data:', err);
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; padding: 40px; color: #ef4444;">
              <i data-lucide="alert-circle" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
              <div>เกิดข้อผิดพลาดในการโหลดข้อมูล: ${escapeHtml(err.message)}</div>
              <button type="button" class="dg-btn-outline" onclick="loadYear70Admin()" style="margin-top: 12px; font-size: 0.85rem;">
                ลองใหม่อีกครั้ง
              </button>
            </td>
          </tr>
        `;
        if (window.lucide) lucide.createIcons();
      }
    }
  };

  // ==========================================================
  // 2. RENDER DEPARTMENT TABS
  // ==========================================================
  function renderTabs() {
    const container = document.getElementById('year70TabsContainer');
    if (!container) return;

    const totalCount = year70Positions.reduce((acc, p) => acc + (p.count || 0), 0);
    const totalPoints = year70Positions.reduce((acc, p) => acc + (p.total_points || 0), 0);

    const tabs = [
      { name: 'ALL', label: 'ภาพรวม (Leaderboard)', icon: 'trophy', count: totalCount, points: totalPoints },
      ...VALID_POSITIONS.map(pos => {
        const pInfo = year70Positions.find(p => p.name === pos) || { count: 0, total_points: 0 };
        return {
          name: pos,
          label: pos,
          icon: POSITION_ICONS[pos] || 'award',
          count: pInfo.count,
          points: pInfo.total_points
        };
      })
    ];

    let html = '';
    tabs.forEach(tab => {
      const isActive = currentPositionFilter === tab.name;
      const activeStyle = isActive
        ? 'background: #0f172a; color: #ffffff; border-color: #0f172a; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);'
        : 'background: #ffffff; color: #475569; border-color: #e2e8f0;';

      const badgeStyle = isActive
        ? 'background: rgba(255, 255, 255, 0.2); color: #ffffff;'
        : 'background: #f1f5f9; color: #475569;';

      html += `
        <button type="button" class="year70-tab-pill" onclick="switchYear70Position('${escapeHtml(tab.name)}')" style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 9999px; font-size: 0.84rem; font-weight: 600; cursor: pointer; border: 1px solid; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); white-space: nowrap; ${activeStyle}">
          <i data-lucide="${tab.icon}" style="width: 15px; height: 15px;"></i>
          <span>${escapeHtml(tab.label)}</span>
          <span style="font-size: 0.72rem; padding: 1px 7px; border-radius: 9999px; font-weight: 700; ${badgeStyle}">${tab.count}</span>
        </button>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  window.switchYear70Position = function (pos) {
    currentPositionFilter = pos;
    window.loadYear70Admin();
  };

  // ==========================================================
  // 3. RENDER TOP 3 PODIUM
  // ==========================================================
  // ==========================================================
  // 3. RENDER TOP 3 PODIUM (Liquid Glass Full-Bleed Photo Style)
  // ==========================================================
  function renderPodium() {
    const container = document.getElementById('year70PodiumContainer');
    if (!container) return;

    // เฉพาะผู้ที่มีคะแนนมากกว่า 0 เท่านั้นที่มีสิทธิ์ขึ้นโพเดียม (ถ้าคะแนนเป็น 0 ไม่แสดง)
    const topScorers = (year70Candidates || []).filter(c => (Number(c.total_points) || 0) > 0);

    if (topScorers.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'grid';

    const top3 = topScorers.slice(0, 3);
    const podiumStyles = [
      {
        rank: 1,
        medal: '🥇',
        rankClass: 'rank-1',
        rankLabel: 'อันดับ 1 (GOLD)',
        border: 'border: 2px solid #f59e0b;',
        bg: 'background: linear-gradient(135deg, #fffdf5 0%, #fef3c7 50%, #fde68a 100%);',
        badgeBg: 'background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);',
        glow: 'box-shadow: 0 10px 28px -6px rgba(245, 158, 11, 0.28), 0 2px 10px rgba(0, 0, 0, 0.04);'
      },
      {
        rank: 2,
        medal: '🥈',
        rankClass: 'rank-2',
        rankLabel: 'อันดับ 2 (SILVER)',
        border: 'border: 1.5px solid #94a3b8;',
        bg: 'background: linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%);',
        badgeBg: 'background: linear-gradient(135deg, #64748b, #475569); color: #ffffff; box-shadow: 0 2px 8px rgba(100, 116, 139, 0.3);',
        glow: 'box-shadow: 0 8px 24px -6px rgba(100, 116, 139, 0.2), 0 2px 8px rgba(0, 0, 0, 0.04);'
      },
      {
        rank: 3,
        medal: '🥉',
        rankClass: 'rank-3',
        rankLabel: 'อันดับ 3 (BRONZE)',
        border: 'border: 1.5px solid #d97706;',
        bg: 'background: linear-gradient(135deg, #fffaf5 0%, #ffedd5 50%, #fed7aa 100%);',
        badgeBg: 'background: linear-gradient(135deg, #d97706, #b45309); color: #ffffff; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.3);',
        glow: 'box-shadow: 0 8px 24px -6px rgba(217, 119, 6, 0.2), 0 2px 8px rgba(0, 0, 0, 0.04);'
      }
    ];

    let html = '';
    top3.forEach((cand, idx) => {
      const style = podiumStyles[idx];
      const photoUrl = cand.image_url ? (cand.image_url.startsWith('/') ? getApiBase() + cand.image_url : cand.image_url) : '';
      let photoHtml = '';
      if (photoUrl) {
        photoHtml = `
          <img src="${photoUrl}" alt="${escapeHtml(cand.student_name)}" style="width: 100%; height: 100%; object-fit: cover; object-position: center 20%; transition: transform 0.35s ease;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\\'width:100%;height:100%;background:linear-gradient(135deg,#0f172a,#334155);color:#fff;font-weight:800;font-size:2.2rem;display:flex;align-items:center;justify-content:center;\\\'>${cand.student_name ? cand.student_name.trim().charAt(0) : '?'}</div>';" />
        `;
      } else {
        photoHtml = `
          <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: #ffffff; font-weight: 800; font-size: 2.2rem; display: flex; align-items: center; justify-content: center; user-select: none;">
            ${cand.student_name ? cand.student_name.trim().charAt(0) : '?'}
          </div>
        `;
      }

      html += `
        <!-- Podium Card (รูปอยู่ข้างๆ + ไม่มีปุ่มเพิ่มแต้ม สไตล์บล็อกบุคคล สวยคมชัด) -->
        <div class="year70-podium-card ${style.rankClass}" style="border-radius: 20px; padding: 16px; position: relative; overflow: hidden; display: flex; align-items: center; gap: 16px; transition: transform 0.25s ease, box-shadow 0.25s ease; ${style.border} ${style.bg} ${style.glow}">
          
          <!-- Watermark Medal (เหรียญรางวัลโปร่งแสงมุมบนขวา) -->
          <div style="position: absolute; right: 12px; top: 10px; font-size: 3.2rem; opacity: 0.18; user-select: none; pointer-events: none; line-height: 1;">
            ${style.medal}
          </div>

          <!-- Left Side: Dedicated Photo Frame (เอารูปไว้ข้างๆ) -->
          <div class="year70-podium-photo-wrap" style="width: 108px; height: 135px; border-radius: 14px; overflow: hidden; flex-shrink: 0; position: relative; border: 2px solid #ffffff; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12); background: #0f172a;">
            ${photoHtml}
          </div>

          <!-- Right Side: Candidate Info & Scoring Details -->
          <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 8px; z-index: 1;">
            
            <!-- Top Row: Rank Pill + Target Position -->
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <span style="font-size: 0.76rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; padding: 3px 10px; border-radius: 9999px; display: inline-flex; align-items: center; gap: 4px; ${style.badgeBg}">
                ${style.rankLabel}
              </span>
              <span style="font-size: 0.82rem; font-weight: 700; color: #475569; display: inline-flex; align-items: center; gap: 4px;">
                <i data-lucide="${POSITION_ICONS[cand.target_position] || 'award'}" style="width: 13px; height: 13px;"></i>
                ${escapeHtml(cand.target_position)}
              </span>
            </div>

            <!-- Candidate Identity (Full Name & Grade) -->
            <div>
              <h4 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #0f172a; line-height: 1.35; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${escapeHtml(cand.student_name)}">
                ${escapeHtml(cand.student_name)}
              </h4>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                ระดับชั้น: <strong style="color: #334155; font-weight: 700;">${escapeHtml(cand.grade)}</strong>
              </div>
              ${cand.notes ? `
                <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.74rem; color: #475569; background: rgba(255, 255, 255, 0.75); border: 1px solid rgba(0, 0, 0, 0.06); padding: 2px 7px; border-radius: 5px; margin-top: 4px; max-width: 220px;" title="Admin Note: ${escapeHtml(cand.notes)}">
                  <i data-lucide="file-text" style="width: 10px; height: 10px; color: #64748b; flex-shrink: 0;"></i>
                  <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(cand.notes)}</span>
                </div>
              ` : ''}
            </div>

            <!-- Bottom Row: Points + Actions (ไม่มีปุ่มเพิ่มแต้ม) -->
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px dashed rgba(0, 0, 0, 0.09);">
              <div style="display: flex; align-items: baseline; gap: 4px;">
                <span style="font-size: 1.6rem; font-weight: 800; color: #0f172a; line-height: 1;">${cand.total_points}</span>
                <span style="font-size: 0.85rem; font-weight: 700; color: #f59e0b;">แต้ม ⭐</span>
              </div>

              <!-- Only History & Edit (ไม่มีปุ่มเพิ่มแต้ม) -->
              <div style="display: flex; gap: 6px;">
                <button type="button" class="dg-btn-outline" onclick="openPointLogsModal(${cand.id})" style="padding: 5px 10px; font-size: 0.78rem; font-weight: 600; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; color: #334155; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" title="ดูประวัติแต้ม">
                  <i data-lucide="history" style="width: 13px; height: 13px; color: #64748b;"></i> <span>ประวัติ</span>
                </button>
                <button type="button" class="dg-btn-outline" onclick="openEditYear70CandidateModal(${cand.id})" style="padding: 5px 8px; font-size: 0.78rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; color: #334155; box-shadow: 0 1px 3px rgba(0,0,0,0.05);" title="แก้ไขรูปโปรไฟล์ / โน้ต">
                  <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i>
                </button>
              </div>
            </div>

          </div>

        </div>
      `;
    });

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }


  // ==========================================================
  // 3.5 RENDER DEPARTMENT SQUARE BLOCKS (บล็อกสี่เหลี่ยมแยกฝ่าย)
  // ==========================================================
  function renderDepartmentBlocks() {
    const container = document.getElementById('year70DepartmentsContainer');
    if (!container) return;

    if (!year70Candidates) year70Candidates = [];

    // Positions to display
    let positionsToDisplay = [];
    if (currentPositionFilter === 'ALL') {
      positionsToDisplay = VALID_POSITIONS.slice();
    } else if (VALID_POSITIONS.includes(currentPositionFilter)) {
      positionsToDisplay = [currentPositionFilter];
    } else {
      positionsToDisplay = VALID_POSITIONS.slice();
    }

    const titleEl = document.getElementById('year70CurrentViewTitle');
    if (titleEl) {
      if (currentPositionFilter === 'ALL') {
        titleEl.textContent = `รายชื่อผู้สมัครแยกตามฝ่าย (${positionsToDisplay.length} ฝ่าย)`;
      } else {
        titleEl.textContent = `รายชื่อผู้สมัคร: ${currentPositionFilter}`;
      }
    }

    const searchTerm = currentSearchQuery.trim().toLowerCase();
    let html = '';

    positionsToDisplay.forEach(deptName => {
      let deptCandidates = year70Candidates.filter(c => c.target_position === deptName);

      if (searchTerm) {
        deptCandidates = deptCandidates.filter(c =>
          (c.student_name || '').toLowerCase().includes(searchTerm) ||
          (c.grade || '').toLowerCase().includes(searchTerm) ||
          (c.notes || '').toLowerCase().includes(searchTerm)
        );
      }

      if (searchTerm && deptCandidates.length === 0) {
        return;
      }

      const icon = POSITION_ICONS[deptName] || 'award';
      const deptTotalPoints = deptCandidates.reduce((sum, c) => sum + (c.total_points || 0), 0);

      html += `
        <div class="year70-dept-section" style="margin-bottom: 28px;">
          <!-- Department Section Header (หัวข้อฝ่าย) -->
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.02); flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #0f172a;">
                <i data-lucide="${icon}" style="width: 20px; height: 20px;"></i>
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <h3 style="margin: 0; font-size: 1.08rem; font-weight: 800; color: #0f172a; letter-spacing: -0.01em;">${escapeHtml(deptName)}</h3>
                  <span style="font-size: 0.76rem; font-weight: 700; padding: 2px 8px; border-radius: 9999px; background: #f1f5f9; color: #475569;">${deptCandidates.length} คน</span>
                </div>
                <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
                  คะแนนสะสมรวม: <strong style="color: #f59e0b;">${deptTotalPoints} แต้ม ⭐</strong>
                </div>
              </div>
            </div>
            <div>
              <button type="button" class="dg-btn-outline" onclick="openAddYear70CandidateModal('${escapeHtml(deptName)}')" style="padding: 6px 12px; font-size: 0.78rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; background: #ffffff;" title="เพิ่มผู้สมัครใน${deptName}">
                <i data-lucide="plus" style="width: 14px; height: 14px;"></i> <span>+ เพิ่มผู้สมัคร</span>
              </button>
            </div>
          </div>
      `;

      if (deptCandidates.length === 0) {
        html += `
          <!-- Empty State (ถ้าไม่มีข้อมูลให้เขียนว่าไม่มีข้อมูล) -->
          <div style="padding: 30px 16px; text-align: center; background: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 14px; margin-bottom: 22px;">
            <i data-lucide="inbox" style="width: 30px; height: 30px; margin-bottom: 6px; color: #cbd5e1;"></i>
            <div style="font-size: 0.92rem; font-weight: 700; color: #64748b;">ไม่มีข้อมูล</div>
            <div style="font-size: 0.78rem; color: #94a3b8; margin-top: 2px;">ยังไม่มีผู้สมัครลงทะเบียนในตำแหน่ง "${escapeHtml(deptName)}"</div>
          </div>
        </div>
        `;
      } else {
        html += `
          <!-- Candidate Square Blocks Grid (บล็อกสี่เหลี่ยม) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 14px; margin-bottom: 24px;">
        `;

        let deptRankCounter = 0;
        deptCandidates.forEach((cand) => {
          const points = Number(cand.total_points) || 0;
          const hasPoints = points > 0;
          let rankPillHtml = '';

          // ถ้าแต้ม > 0 ถึงจะแสดงลำดับ (ถ้าแต้มเป็น 0 ไม่ต้องขึ้นลำดับ)
          if (hasPoints) {
            deptRankCounter += 1;
            const rank = deptRankCounter;
            let rankLabel = `#${rank}`;
            let rankGlassStyle = 'background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(255, 255, 255, 0.22); color: #ffffff;';
            if (rank === 1) {
              rankLabel = '🥇 อันดับ 1';
              rankGlassStyle = 'background: rgba(245, 158, 11, 0.35); border: 1px solid rgba(245, 158, 11, 0.65); color: #fef08a; box-shadow: 0 4px 16px rgba(245, 158, 11, 0.35);';
            } else if (rank === 2) {
              rankLabel = '🥈 อันดับ 2';
              rankGlassStyle = 'background: rgba(148, 163, 184, 0.3); border: 1px solid rgba(255, 255, 255, 0.35); color: #f8fafc;';
            } else if (rank === 3) {
              rankLabel = '🥉 อันดับ 3';
              rankGlassStyle = 'background: rgba(217, 119, 6, 0.35); border: 1px solid rgba(251, 146, 60, 0.5); color: #ffedd5;';
            }

            rankPillHtml = `
              <div style="backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-radius: 9999px; padding: 4px 10px; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25); text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5); ${rankGlassStyle}">
                ${rankLabel}
              </div>
            `;
          }

          // Full Bleed Photo Background (รูปเต็มบล็อก)
          const photoUrl = cand.image_url ? (cand.image_url.startsWith('/') ? getApiBase() + cand.image_url : cand.image_url) : '';
          let bgImageHtml = '';
          if (photoUrl) {
            bgImageHtml = `
              <img src="${photoUrl}" alt="${escapeHtml(cand.student_name)}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center 20%; z-index: 0; transition: transform 0.4s ease;" onerror="this.onerror=null; this.parentElement.querySelector('.year70-bg-fallback').style.display='flex'; this.style.display='none';" />
              <div class="year70-bg-fallback" style="display: none; position: absolute; inset: 0; background: radial-gradient(circle at 75% 20%, #4338ca 0%, #1e1b4b 55%, #0f172a 100%); z-index: 0; align-items: center; justify-content: center; color: rgba(255,255,255,0.18); font-size: 5.5rem; font-weight: 800;">
                ${cand.student_name ? cand.student_name.trim().charAt(0) : '?'}
              </div>
            `;
          } else {
            bgImageHtml = `
              <div style="position: absolute; inset: 0; background: radial-gradient(circle at 75% 20%, #3b82f6 0%, #1e1b4b 55%, #0f172a 100%); z-index: 0; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.18); font-size: 5.5rem; font-weight: 800; user-select: none;">
                ${cand.student_name ? cand.student_name.trim().charAt(0) : '?'}
              </div>
            `;
          }

          html += `
            <!-- Candidate Card: Full Bleed Photo + Ethereal Frosted Glass (แสดงชื่อเต็ม ไร้บล็อกทึบ) -->
            <div class="year70-candidate-block" style="position: relative; border-radius: 20px; overflow: hidden; min-height: 350px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 14px 34px -10px rgba(15, 23, 42, 0.35); background: #0f172a; transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);">
              <!-- Background Image (รูปเต็มบล็อก) -->
              ${bgImageHtml}

              <!-- Gentle Vignette (คุมความสว่างให้โปร่งตา) -->
              <div style="position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15, 23, 42, 0.35) 0%, rgba(15, 23, 42, 0) 35%, rgba(15, 23, 42, 0.2) 60%, rgba(15, 23, 42, 0.75) 100%); z-index: 1; pointer-events: none;"></div>

              <!-- Top Floating Frosted Pills -->
              <div style="position: relative; z-index: 2; padding: 12px 12px 0; display: flex; align-items: center; justify-content: ${rankPillHtml ? 'space-between' : 'flex-end'}; gap: 8px;">
                <!-- Rank Pill (Liquid Frosted Glass - แสดงเฉพาะเมื่อมีคะแนน > 0) -->
                ${rankPillHtml}

                <!-- Points Pill (Liquid Amber Frosted Glass) -->
                <div style="background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(245, 158, 11, 0.45); border-radius: 9999px; padding: 4px 12px; font-size: 0.82rem; font-weight: 800; color: #fbbf24; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.25);">
                  <span>${cand.total_points}</span>
                  <span style="font-size: 0.74rem; color: #fde68a;">แต้ม ⭐</span>
                </div>
              </div>

              <!-- Bottom Frosted Text Overlay (เบลอเนียนบนรูป ไร้บล็อกทึบ แสดงชื่อเต็ม) -->
              <div style="position: relative; z-index: 2; width: 100%; padding: 26px 14px 14px; background: linear-gradient(180deg, rgba(15, 23, 42, 0) 0%, rgba(15, 23, 42, 0.42) 28%, rgba(15, 23, 42, 0.85) 100%); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;">
                
                <!-- Grade Tag & Full Candidate Name -->
                <div>
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 5px;">
                    <span style="background: rgba(255, 255, 255, 0.16); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); border: 1px solid rgba(255, 255, 255, 0.28); border-radius: 6px; padding: 2px 8px; font-size: 0.72rem; font-weight: 700; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">
                      ชั้น ${escapeHtml(cand.grade)}
                    </span>
                  </div>
                  <!-- แสดงชื่อเต็มชัดเจน ไม่ตัดคำ -->
                  <h4 style="margin: 0; font-size: 1.05rem; font-weight: 800; color: #ffffff; letter-spacing: -0.01em; line-height: 1.38; text-shadow: 0 2px 6px rgba(0, 0, 0, 0.85); white-space: normal; word-break: break-word;">
                    ${escapeHtml(cand.student_name)}
                  </h4>
                </div>

                <!-- Glassmorphic Action Buttons -->
                <div style="display: flex; gap: 6px; width: 100%; margin-top: 2px; align-items: center;">
                  <button type="button" onclick="openAdjustPointsModal(${cand.id})" style="flex: 1; padding: 8px 12px; font-size: 0.8rem; font-weight: 700; border-radius: 10px; background: rgba(16, 185, 129, 0.88); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35); display: inline-flex; align-items: center; justify-content: center; gap: 5px; cursor: pointer; transition: all 0.18s ease;" title="บันทึกแต้ม / ตัดแต้ม">
                    <i data-lucide="plus-circle" style="width: 14px; height: 14px; color: #fff;"></i> <span>ปรับแต้ม</span>
                  </button>
                  <button type="button" onclick="openPointLogsModal(${cand.id})" style="padding: 8px 11px; border-radius: 10px; background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.28); color: #ffffff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease;" title="ดูประวัติแต้ม">
                    <i data-lucide="history" style="width: 14px; height: 14px;"></i>
                  </button>
                  <button type="button" onclick="openEditYear70CandidateModal(${cand.id})" style="padding: 8px 11px; border-radius: 10px; background: rgba(255, 255, 255, 0.18); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.28); color: #c7d2fe; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s ease;" title="แก้ไขรูปโปรไฟล์ / โน้ต">
                    <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                  </button>
                </div>

              </div>

            </div>
          `;
        });

        html += `
          </div>
        </div>
        `;
      }
    });

    if (positionsToDisplay.length === 0 || (searchTerm && html.trim() === '')) {
      html = `
        <div style="text-align: center; padding: 48px 20px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; color: #94a3b8;">
          <i data-lucide="search-x" style="width: 36px; height: 36px; margin-bottom: 8px; color: #cbd5e1;"></i>
          <div style="font-weight: 700; color: #475569; font-size: 1rem;">ไม่พบข้อมูลผู้สมัครที่ค้นหา</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">ลองเปลี่ยนคำค้นหา หรือรีเซ็ตการค้นหา</div>
        </div>
      `;
    }

    container.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  // ==========================================================
  // 4. RENDER CANDIDATES TABLE
  // ==========================================================
  function renderCandidatesTable() {
    const tableBody = document.getElementById('year70CandidatesTableBody');
    if (!tableBody) return;

    if (!year70Candidates || year70Candidates.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 60px 20px; color: #94a3b8;">
            <i data-lucide="users" style="width: 44px; height: 44px; margin-bottom: 12px; color: #cbd5e1;"></i>
            <h4 style="margin: 0 0 6px 0; font-size: 1.05rem; font-weight: 700; color: #334155;">ยังไม่มีผู้สมัครในฝ่ายนี้</h4>
            <p style="margin: 0 0 16px 0; font-size: 0.85rem; color: #64748b;">กดปุ่ม "+ เพิ่มผู้สมัครปี 70" เพื่อเริ่มบันทึกรายชื่อและสะสมแต้ม</p>
            <button type="button" class="dg-btn-black" onclick="openAddYear70CandidateModal()" style="font-size: 0.85rem; padding: 8px 16px;">
              <i data-lucide="user-plus"></i> <span>+ เพิ่มผู้สมัคร</span>
            </button>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    const isSuper = isSuperAdmin();

    let tableRankCounter = 0;
    let html = '';
    year70Candidates.forEach((cand) => {
      const points = Number(cand.total_points) || 0;
      let rankBadge = `<span style="color: #cbd5e1; font-weight: 600;">-</span>`;

      // ถ้าแต้ม > 0 ถึงจะมีลำดับ (ถ้าแต้มเป็น 0 ไม่ต้องขึ้นลำดับ แสดงเป็น -)
      if (points > 0) {
        tableRankCounter += 1;
        const rank = tableRankCounter;
        if (rank === 1) rankBadge = `<span style="font-size: 1.25rem;" title="อันดับ 1">🥇</span>`;
        else if (rank === 2) rankBadge = `<span style="font-size: 1.25rem;" title="อันดับ 2">🥈</span>`;
        else if (rank === 3) rankBadge = `<span style="font-size: 1.25rem;" title="อันดับ 3">🥉</span>`;
        else rankBadge = `<span style="font-weight: 700; color: #64748b;">${rank}</span>`;
      }

      const pointsColor = cand.total_points > 0 ? '#f59e0b' : (cand.total_points < 0 ? '#ef4444' : '#64748b');

      // Candidate Avatar
      const photoUrl = cand.image_url ? (cand.image_url.startsWith('/') ? getApiBase() + cand.image_url : cand.image_url) : '';
      let avatarHtml = '';
      if (photoUrl) {
        avatarHtml = `<img src="${photoUrl}" alt="${escapeHtml(cand.student_name)}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover; border: 1.5px solid #e2e8f0; flex-shrink: 0;" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\\\'width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#0f172a,#334155);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;\\\'>${cand.student_name ? cand.student_name.trim().charAt(0) : '?'}</div>';" />`;
      } else {
        avatarHtml = `<div style="width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #0f172a 0%, #334155 100%); color: #fff; font-weight: 700; font-size: 0.95rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);">${cand.student_name ? cand.student_name.trim().charAt(0) : '?'}</div>`;
      }

      html += `
        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <!-- Rank -->
          <td style="padding: 14px 16px; text-align: center;">
            ${rankBadge}
          </td>

          <!-- Candidate Info -->
          <td style="padding: 14px 16px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${avatarHtml}
              <div>
                <div style="font-weight: 700; color: #0f172a; font-size: 0.94rem;">
                  ${escapeHtml(cand.student_name)}
                </div>
                ${cand.notes ? `
                  <div style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.76rem; color: #475569; background: #f1f5f9; padding: 2px 8px; border-radius: 6px; margin-top: 3px; max-width: 280px;" title="Admin Note: ${escapeHtml(cand.notes)}">
                    <i data-lucide="file-text" style="width: 11px; height: 11px; color: #64748b; flex-shrink: 0;"></i>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(cand.notes)}</span>
                  </div>
                ` : ''}
              </div>
            </div>
          </td>

          <!-- Grade -->
          <td style="padding: 14px 16px;">
            <span style="display: inline-block; padding: 3px 9px; border-radius: 6px; font-size: 0.82rem; font-weight: 600; background: #f1f5f9; color: #334155;">
              ${escapeHtml(cand.grade)}
            </span>
          </td>

          <!-- Target Position -->
          <td style="padding: 14px 16px;">
            <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 9999px; font-size: 0.82rem; font-weight: 600; background: #eef2ff; color: #4338ca; border: 1px solid #e0e7ff;">
              <i data-lucide="${POSITION_ICONS[cand.target_position] || 'award'}" style="width: 13px; height: 13px;"></i>
              ${escapeHtml(cand.target_position)}
            </span>
          </td>

          <!-- Total Points -->
          <td style="padding: 14px 16px; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 4px; padding: 5px 12px; border-radius: 9999px; background: #fffbeb; border: 1px solid #fde68a; box-shadow: 0 1px 3px rgba(245, 158, 11, 0.1);">
              <span style="font-size: 1.05rem; font-weight: 800; color: ${pointsColor};">${cand.total_points}</span>
              <span style="font-size: 0.78rem; color: #f59e0b;">⭐</span>
            </div>
          </td>

          <!-- Quick Points Buttons -->
          <td style="padding: 14px 16px; text-align: center;">
            <div style="display: inline-flex; align-items: center; gap: 4px;">
              <button type="button" class="year70-quick-btn" onclick="openAdjustPointsModal(${cand.id}, 1, 'ปฏิบัติหน้าที่เรียบร้อย')" title="+1 แต้ม (เปิดระบุเหตุผล/แนบหลักฐาน)" style="padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; cursor: pointer; transition: transform 0.1s ease;">+1</button>
              <button type="button" class="year70-quick-btn" onclick="openAdjustPointsModal(${cand.id}, 3, 'เข้าเวรตรงเวลา / ปฏิบัติหน้าที่เรียบร้อย')" title="+3 แต้ม (เปิดระบุเหตุผล/แนบหลักฐาน)" style="padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; cursor: pointer; transition: transform 0.1s ease;">+3</button>
              <button type="button" class="year70-quick-btn" onclick="openAdjustPointsModal(${cand.id}, 5, 'ช่วยเหลืองานกิจกรรมโรงเรียน / เสียสละเวลา')" title="+5 แต้ม (เปิดระบุเหตุผล/แนบหลักฐาน)" style="padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; cursor: pointer; transition: transform 0.1s ease;">+5</button>
              <button type="button" class="year70-quick-btn" onclick="openAdjustPointsModal(${cand.id}, 10, 'ทุ่มเทและรับผิดชอบงานเป็นพิเศษ / ภาวะผู้นำยอดเยี่ยม')" title="+10 แต้ม (เปิดระบุเหตุผล/แนบหลักฐาน)" style="padding: 4px 8px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; background: #fef3c7; color: #b45309; border: 1px solid #fde68a; cursor: pointer; transition: transform 0.1s ease;">+10</button>
              <button type="button" class="year70-quick-btn" onclick="openAdjustPointsModal(${cand.id})" title="กำหนดแต้ม เหตุผล และแนบหลักฐาน" style="padding: 4px 7px; border-radius: 6px; font-size: 0.78rem; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; cursor: pointer;">
                <i data-lucide="plus-circle" style="width: 13px; height: 13px; color: #10b981;"></i>
              </button>
            </div>
          </td>

          <!-- Actions -->
          <td style="padding: 14px 16px; text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              <button type="button" class="dg-btn-outline" onclick="openEditYear70CandidateModal(${cand.id})" style="padding: 6px 10px; font-size: 0.78rem; border-radius: 6px;" title="แก้ไขรูปโปรไฟล์ / เพิ่มโน้ตแอดมิน">
                <i data-lucide="edit-3" style="width: 13px; height: 13px; color: #6366f1;"></i> <span>แก้ไข/โน้ต</span>
              </button>
              <button type="button" class="dg-btn-outline" onclick="openPointLogsModal(${cand.id})" style="padding: 6px 9px; font-size: 0.78rem; border-radius: 6px;" title="ดูประวัติแต้มทั้งหมด">
                <i data-lucide="history" style="width: 13px; height: 13px;"></i> <span>ประวัติ</span>
              </button>

              ${isSuper ? `
                <button type="button" class="dg-btn-outline" onclick="openMovePositionModal(${cand.id})" style="padding: 6px 8px; font-size: 0.78rem; border-radius: 6px;" title="ย้ายฝ่าย (เฉพาะ Super Admin)">
                  <i data-lucide="arrow-right-left" style="width: 13px; height: 13px; color: #3b82f6;"></i>
                </button>
                <button type="button" class="dg-btn-outline" onclick="deleteYear70Candidate(${cand.id}, '${escapeHtml(cand.student_name)}')" style="padding: 6px 8px; font-size: 0.78rem; border-radius: 6px; border-color: #fca5a5; color: #dc2626;" title="ลบผู้สมัคร (เฉพาะ Super Admin)">
                  <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  function updateSummaryCounts() {
    const totalCountText = document.getElementById('year70TotalCountText');
    const totalPointsText = document.getElementById('year70TotalPointsSumText');

    if (totalCountText) totalCountText.textContent = year70Candidates.length;
    if (totalPointsText) {
      const sum = year70Candidates.reduce((acc, c) => acc + (c.total_points || 0), 0);
      totalPointsText.textContent = sum;
    }
  }

  // Search debounce
  let searchTimer = null;
  window.handleYear70Search = function (val) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearchQuery = val || '';
      window.loadYear70Admin();
    }, 280);
  };

  // ==========================================================
  // 5. QUICK GIVE POINTS
  // ==========================================================
  window.quickGivePoints = async function (candidateId, points, defaultReason) {
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/candidates/${candidateId}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          points: points,
          reason: defaultReason
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'บันทึกแต้มไม่สำเร็จ');
      }

      if (typeof showToast === 'function') {
        showToast(json.message, 'success');
      }

      // Reload data
      window.loadYear70Admin();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'บันทึกแต้มล้มเหลว',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 6. PHOTO UPLOAD HELPER (ADD & EDIT)
  // ==========================================================
  window.handleYear70PhotoUpload = async function (fileInput, mode) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const token = getAuthToken();

    const isEdit = mode === 'edit';
    const statusEl = document.getElementById(isEdit ? 'year70EditUploadStatus' : 'year70AddUploadStatus');
    const previewEl = document.getElementById(isEdit ? 'year70EditImagePreview' : 'year70AddImagePreview');
    const iconEl = document.getElementById(isEdit ? 'year70EditPhotoIcon' : 'year70AddPhotoIcon');
    const urlInput = document.getElementById(isEdit ? 'year70EditImageUrl' : 'year70AddImageUrl');

    if (statusEl) statusEl.innerHTML = '<span style="color: #64748b;">⏳ กำลังอัปโหลดและประมวลผลรูปภาพ...</span>';

    const formData = new FormData();
    formData.append('category', 'year70-candidates');
    formData.append('image', file);

    try {
      const res = await fetch(`${getApiBase()}/api/upload?category=year70-candidates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Upload-Category': 'year70-candidates'
        },
        body: formData
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'อัปโหลดรูปภาพล้มเหลว');
      }

      const uploadedUrl = json.url || json.imageUrl;
      if (urlInput) urlInput.value = uploadedUrl;

      let fullUrl = uploadedUrl;
      if (fullUrl.startsWith('/')) fullUrl = getApiBase() + fullUrl;

      if (previewEl) {
        previewEl.src = fullUrl;
        previewEl.style.display = 'block';
      }
      if (iconEl) iconEl.style.display = 'none';

      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #16a34a; font-weight: 700;">✓ อัปโหลดรูปภาพสำเร็จ</span>';
      }
    } catch (err) {
      if (statusEl) {
        statusEl.innerHTML = `<span style="color: #dc2626; font-weight: 600;">❌ ${escapeHtml(err.message)}</span>`;
      }
    }
  };

  // ==========================================================
  // 7. MODAL: ADD CANDIDATE FROM ROSTER (143 Students)
  // ==========================================================
  window.openAddYear70CandidateModal = async function (targetPosition) {
    selectedStudentForAdd = null;

    // Reset inputs
    const searchInput = document.getElementById('year70StudentSearchInput');
    const selectedBadge = document.getElementById('year70SelectedStudentBadge');
    const posSelect = document.getElementById('year70AddPositionSelect');
    const notesInput = document.getElementById('year70AddNotesInput');
    const dropdown = document.getElementById('year70StudentSuggestionsDropdown');
    const previewEl = document.getElementById('year70AddImagePreview');
    const iconEl = document.getElementById('year70AddPhotoIcon');
    const urlInput = document.getElementById('year70AddImageUrl');
    const statusEl = document.getElementById('year70AddUploadStatus');
    const fileInput = document.getElementById('year70AddPhotoInput');

    if (searchInput) searchInput.value = '';
    if (notesInput) notesInput.value = '';
    if (urlInput) urlInput.value = '';
    if (fileInput) fileInput.value = '';
    if (previewEl) {
      previewEl.src = '';
      previewEl.style.display = 'none';
    }
    if (iconEl) iconEl.style.display = 'block';
    if (statusEl) statusEl.innerHTML = '<span style="color: #64748b;">รองรับ JPG, PNG, WebP (บีบอัดอัตโนมัติ)</span>';

    if (selectedBadge) {
      selectedBadge.style.display = 'none';
      selectedBadge.innerHTML = '';
    }
    if (dropdown) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
    }

    // Set position select default
    if (posSelect) {
      if (targetPosition && VALID_POSITIONS.includes(targetPosition)) {
        posSelect.value = targetPosition;
      } else if (currentPositionFilter !== 'ALL' && VALID_POSITIONS.includes(currentPositionFilter)) {
        posSelect.value = currentPositionFilter;
      } else {
        posSelect.value = VALID_POSITIONS[0];
      }
    }

    // Load 143 students from /api/students if not cached
    if (allStudentsRoster.length === 0) {
      try {
        const res = await fetch(`${getApiBase()}/api/students`);
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list)) allStudentsRoster = list;
        }
      } catch (e) {
        console.warn('Could not load students roster:', e);
      }
    }

    showYear70Modal('adminYear70AddModal');
    if (searchInput) setTimeout(() => searchInput.focus(), 120);
  };

  window.closeAddYear70CandidateModal = function () {
    hideYear70Modal('adminYear70AddModal');
  };

  // Handle student autocomplete input
  window.handleYear70StudentSearchInput = function (query) {
    const dropdown = document.getElementById('year70StudentSuggestionsDropdown');
    if (!dropdown) return;

    const term = (query || '').trim().toLowerCase();
    if (!term) {
      dropdown.style.display = 'none';
      dropdown.innerHTML = '';
      return;
    }

    const matches = allStudentsRoster.filter(s => {
      const name = (s.name || '').toLowerCase();
      const grade = (s.grade || '').toLowerCase();
      const orderNo = String(s.order_no || '');
      return name.includes(term) || grade.includes(term) || orderNo === term;
    }).slice(0, 8);

    if (matches.length === 0) {
      dropdown.innerHTML = '<div style="padding: 12px; color: #94a3b8; font-size: 0.85rem; text-align: center;">ไม่พบนักเรียนที่ตรงกับคำค้นหาใน 143 คน</div>';
      dropdown.style.display = 'block';
      return;
    }

    let html = '';
    matches.forEach(s => {
      html += `
        <div onclick="selectYear70Student(${s.order_no || s.id})" style="padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; transition: background 0.15s ease;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'">
          <div>
            <div style="font-weight: 700; color: #0f172a; font-size: 0.9rem;">
              <span style="color: #64748b; font-size: 0.8rem; margin-right: 6px;">#${s.order_no}</span>
              ${escapeHtml(s.name)}
            </div>
            <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">
              ${escapeHtml(s.grade)} • ${escapeHtml(s.rank || 'สารวัตรนักเรียน')}
            </div>
          </div>
          <span style="font-size: 0.75rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 6px; font-weight: 600;">เลือก</span>
        </div>
      `;
    });

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
  };

  window.selectYear70Student = function (studentId) {
    const student = allStudentsRoster.find(s => (s.order_no === studentId || s.id === studentId));
    if (!student) return;

    selectedStudentForAdd = student;

    const dropdown = document.getElementById('year70StudentSuggestionsDropdown');
    const searchInput = document.getElementById('year70StudentSearchInput');
    const selectedBadge = document.getElementById('year70SelectedStudentBadge');

    if (dropdown) dropdown.style.display = 'none';
    if (searchInput) searchInput.value = '';

    if (selectedBadge) {
      selectedBadge.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 10px; padding: 10px 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: #16a34a; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700;">
              ✓
            </div>
            <div>
              <div style="font-weight: 700; color: #166534; font-size: 0.92rem;">
                ${escapeHtml(student.name)}
              </div>
              <div style="font-size: 0.78rem; color: #15803d;">
                #${student.order_no} • ระดับชั้น: ${escapeHtml(student.grade)} • ${escapeHtml(student.rank || 'สารวัตร')}
              </div>
            </div>
          </div>
          <button type="button" onclick="clearSelectedYear70Student()" style="background: transparent; border: none; color: #dc2626; cursor: pointer; padding: 4px;" title="ยกเลิกการเลือก">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
      `;
      selectedBadge.style.display = 'block';
      if (window.lucide) lucide.createIcons();
    }
  };

  window.clearSelectedYear70Student = function () {
    selectedStudentForAdd = null;
    const selectedBadge = document.getElementById('year70SelectedStudentBadge');
    if (selectedBadge) {
      selectedBadge.style.display = 'none';
      selectedBadge.innerHTML = '';
    }
  };

  window.submitAddYear70Candidate = async function () {
    if (!selectedStudentForAdd) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาเลือกนักเรียน',
        text: 'กรุณาพิมพ์ค้นหาและเลือกนักเรียนจากฐานข้อมูล 143 คน',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      return;
    }

    const posSelect = document.getElementById('year70AddPositionSelect');
    const notesInput = document.getElementById('year70AddNotesInput');
    const imageUrlInput = document.getElementById('year70AddImageUrl');

    const targetPosition = posSelect ? posSelect.value : '';
    const notes = notesInput ? notesInput.value.trim() : '';
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';

    if (!targetPosition || !VALID_POSITIONS.includes(targetPosition)) {
      Swal.fire({
        icon: 'warning',
        title: 'ตำแหน่งไม่ถูกต้อง',
        text: 'กรุณาเลือกตำแหน่งที่ต้องการสะสมแต้ม',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      return;
    }

    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/candidates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: selectedStudentForAdd.order_no || selectedStudentForAdd.id,
          target_position: targetPosition,
          notes: notes,
          image_url: imageUrl
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'เพิ่มผู้สมัครไม่สำเร็จ');
      }

      window.closeAddYear70CandidateModal();
      if (typeof showToast === 'function') {
        showToast(json.message, 'success');
      } else {
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ',
          text: json.message,
          customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
        });
      }

      window.loadYear70Admin();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'เพิ่มผู้สมัครไม่สำเร็จ',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 8. MODAL: EDIT CANDIDATE PROFILE & ADMIN NOTES
  // ==========================================================
  window.openEditYear70CandidateModal = function (candidateId) {
    const cand = year70Candidates.find(c => c.id === candidateId);
    if (!cand) return;

    currentActiveCandidateForEdit = cand;

    const nameEl = document.getElementById('year70EditCandidateName');
    const metaEl = document.getElementById('year70EditCandidateMeta');
    const totalEl = document.getElementById('year70EditCandidateTotal');
    const notesInput = document.getElementById('year70EditNotesInput');
    const imageUrlInput = document.getElementById('year70EditImageUrl');
    const previewEl = document.getElementById('year70EditImagePreview');
    const iconEl = document.getElementById('year70EditPhotoIcon');
    const statusEl = document.getElementById('year70EditUploadStatus');
    const fileInput = document.getElementById('year70EditPhotoInput');

    if (nameEl) nameEl.textContent = cand.student_name;
    if (metaEl) metaEl.textContent = `${cand.grade} • ${cand.target_position}`;
    if (totalEl) totalEl.textContent = `${cand.total_points} แต้ม ⭐`;
    if (notesInput) notesInput.value = cand.notes || '';
    if (imageUrlInput) imageUrlInput.value = cand.image_url || '';
    if (fileInput) fileInput.value = '';
    if (statusEl) statusEl.innerHTML = '<span style="color: #64748b;">รูปภาพจะถูกปรับขนาดและบีบอัดอัตโนมัติ</span>';

    if (cand.image_url) {
      let fullUrl = cand.image_url;
      if (fullUrl.startsWith('/')) fullUrl = getApiBase() + fullUrl;
      if (previewEl) {
        previewEl.src = fullUrl;
        previewEl.style.display = 'block';
      }
      if (iconEl) iconEl.style.display = 'none';
    } else {
      if (previewEl) {
        previewEl.src = '';
        previewEl.style.display = 'none';
      }
      if (iconEl) iconEl.style.display = 'block';
    }

    showYear70Modal('adminYear70EditModal');
    if (notesInput) setTimeout(() => notesInput.focus(), 120);
  };

  window.closeEditYear70CandidateModal = function () {
    hideYear70Modal('adminYear70EditModal');
  };

  window.removeYear70EditPhoto = function () {
    const imageUrlInput = document.getElementById('year70EditImageUrl');
    const previewEl = document.getElementById('year70EditImagePreview');
    const iconEl = document.getElementById('year70EditPhotoIcon');
    const statusEl = document.getElementById('year70EditUploadStatus');

    if (imageUrlInput) imageUrlInput.value = '';
    if (previewEl) {
      previewEl.src = '';
      previewEl.style.display = 'none';
    }
    if (iconEl) iconEl.style.display = 'block';
    if (statusEl) statusEl.innerHTML = '<span style="color: #dc2626; font-weight: 600;">ลบรูปแล้ว (กดบันทึกเพื่อยืนยัน)</span>';
  };

  window.submitEditYear70Candidate = async function () {
    if (!currentActiveCandidateForEdit) return;

    const notesInput = document.getElementById('year70EditNotesInput');
    const imageUrlInput = document.getElementById('year70EditImageUrl');

    const notes = notesInput ? notesInput.value.trim() : '';
    const imageUrl = imageUrlInput ? imageUrlInput.value.trim() : '';

    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/candidates/${currentActiveCandidateForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          notes: notes,
          image_url: imageUrl
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'บันทึกการแก้ไขไม่สำเร็จ');
      }

      window.closeEditYear70CandidateModal();
      if (typeof showToast === 'function') {
        showToast(json.message, 'success');
      }

      window.loadYear70Admin();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 8.1 EVIDENCE UPLOAD & PREVIEW HELPERS (POINTS LOGS)
  // ==========================================================
  window.handleYear70EvidenceUpload = async function (fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const token = getAuthToken();

    const statusEl = document.getElementById('year70PointsEvidenceStatus');
    const previewWrap = document.getElementById('year70PointsEvidencePreviewWrap');
    const previewImg = document.getElementById('year70PointsEvidencePreview');
    const filenameEl = document.getElementById('year70PointsEvidenceFilename');
    const urlInput = document.getElementById('year70PointsEvidenceUrl');

    if (statusEl) statusEl.innerHTML = '<span style="color: #64748b;">⏳ กำลังอัปโหลดหลักฐาน...</span>';

    const formData = new FormData();
    formData.append('category', 'year70-evidence');
    formData.append('image', file);

    try {
      const res = await fetch(`${getApiBase()}/api/upload?category=year70-evidence`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Upload-Category': 'year70-evidence'
        },
        body: formData
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'อัปโหลดหลักฐานล้มเหลว');
      }

      const uploadedUrl = json.url || json.imageUrl;
      if (urlInput) urlInput.value = uploadedUrl;

      let fullUrl = uploadedUrl;
      if (fullUrl.startsWith('/')) fullUrl = getApiBase() + fullUrl;

      if (previewImg) previewImg.src = fullUrl;
      if (filenameEl) filenameEl.textContent = file.name || 'หลักฐานแนบ';
      if (previewWrap) previewWrap.style.display = 'flex';
      if (statusEl) statusEl.innerHTML = '<span style="color: #16a34a; font-weight: 700;">✓ แนบหลักฐานเรียบร้อย</span>';
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      if (statusEl) statusEl.innerHTML = `<span style="color: #dc2626; font-weight: 600;">❌ ${escapeHtml(err.message)}</span>`;
    }
  };

  window.clearYear70Evidence = function () {
    const fileInput = document.getElementById('year70PointsEvidenceFile');
    const urlInput = document.getElementById('year70PointsEvidenceUrl');
    const previewWrap = document.getElementById('year70PointsEvidencePreviewWrap');
    const previewImg = document.getElementById('year70PointsEvidencePreview');
    const statusEl = document.getElementById('year70PointsEvidenceStatus');

    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewWrap) previewWrap.style.display = 'none';
    if (statusEl) statusEl.innerHTML = '<span style="color: #64748b;">รองรับ JPG, PNG, WebP</span>';
  };

  window.previewYear70Evidence = function (rawUrl) {
    if (!rawUrl) return;
    let fullUrl = rawUrl;
    if (fullUrl.startsWith('/')) fullUrl = getApiBase() + fullUrl;

    if (fullUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) || fullUrl.startsWith('data:image/')) {
      Swal.fire({
        title: 'หลักฐานการปฏิบัติหน้าที่ / การประเมิน',
        imageUrl: fullUrl,
        imageAlt: 'หลักฐานแนบ',
        showCloseButton: true,
        confirmButtonText: '🔗 เปิดภาพขนาดเต็มในแท็บใหม่',
        confirmButtonColor: '#0f172a',
        showCancelButton: true,
        cancelButtonText: 'ปิด',
        customClass: { popup: 'custom-swal-popup' }
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(fullUrl, '_blank');
        }
      });
    } else {
      window.open(fullUrl, '_blank');
    }
  };

  // ==========================================================
  // 9. MODAL: ADJUST POINTS & REASON
  // ==========================================================
  window.openAdjustPointsModal = function (candidateId, defaultDelta, defaultReason) {
    const cand = year70Candidates.find(c => c.id === candidateId);
    if (!cand) return;

    currentActiveCandidateForPoints = cand;

    // Set Candidate Details in Modal Header
    const nameEl = document.getElementById('year70PointsCandidateName');
    const metaEl = document.getElementById('year70PointsCandidateMeta');
    const totalEl = document.getElementById('year70PointsCurrentTotal');
    const scoreInput = document.getElementById('year70PointsDeltaInput');
    const reasonInput = document.getElementById('year70PointsReasonInput');

    if (nameEl) nameEl.textContent = cand.student_name;
    if (metaEl) metaEl.textContent = `${cand.grade} • ${cand.target_position}`;
    if (totalEl) totalEl.textContent = `${cand.total_points} แต้ม ⭐`;
    if (scoreInput) scoreInput.value = (defaultDelta !== undefined && defaultDelta !== null) ? defaultDelta : '3';
    if (reasonInput) reasonInput.value = defaultReason || '';

    // Clear previous evidence
    window.clearYear70Evidence();

    showYear70Modal('adminYear70PointsModal');
    if (scoreInput) {
      setTimeout(() => {
        if (defaultReason && reasonInput) {
          reasonInput.focus();
        } else {
          scoreInput.focus();
        }
      }, 120);
    }
  };

  window.closeAdjustPointsModal = function () {
    hideYear70Modal('adminYear70PointsModal');
  };

  window.setAdjustPointsDelta = function (delta) {
    const scoreInput = document.getElementById('year70PointsDeltaInput');
    if (scoreInput) scoreInput.value = delta;
  };

  window.setAdjustPointsReasonPreset = function (reason, delta) {
    const scoreInput = document.getElementById('year70PointsDeltaInput');
    const reasonInput = document.getElementById('year70PointsReasonInput');

    if (reasonInput) reasonInput.value = reason;
    if (scoreInput && delta !== undefined) scoreInput.value = delta;
  };

  window.submitAdjustPoints = async function () {
    if (!currentActiveCandidateForPoints) return;

    const scoreInput = document.getElementById('year70PointsDeltaInput');
    const reasonInput = document.getElementById('year70PointsReasonInput');
    const evidenceInput = document.getElementById('year70PointsEvidenceUrl');

    const points = parseInt(scoreInput ? scoreInput.value : 0, 10);
    const reason = (reasonInput ? reasonInput.value : '').trim();
    const evidenceUrl = (evidenceInput ? evidenceInput.value : '').trim();

    if (isNaN(points) || points === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'ระบุคะแนนไม่ถูกต้อง',
        text: 'กรุณาระบุจำนวนแต้มที่เป็นตัวเลข (ไม่เท่ากับ 0 เช่น +3, +5 หรือ -3)',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      return;
    }

    if (!reason) {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุเหตุผลหรือการกระทำ',
        text: 'จำเป็นต้องระบุเหตุผลหรือการกระทำ/ภารกิจที่ปฏิบัติ เพื่อความโปร่งใสในการให้แต้ม',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      if (reasonInput) reasonInput.focus();
      return;
    }

    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/candidates/${currentActiveCandidateForPoints.id}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          points: points,
          reason: reason,
          evidence_url: evidenceUrl
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'บันทึกแต้มไม่สำเร็จ');
      }

      window.closeAdjustPointsModal();
      if (typeof showToast === 'function') {
        showToast(json.message, 'success');
      }

      window.loadYear70Admin();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'บันทึกแต้มล้มเหลว',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 10. MODAL: POINT LOGS TIMELINE
  // ==========================================================
  window.openPointLogsModal = async function (candidateId) {
    const cand = year70Candidates.find(c => c.id === candidateId);
    currentActiveCandidateForLogs = cand;

    const nameEl = document.getElementById('year70LogsCandidateName');
    const metaEl = document.getElementById('year70LogsCandidateMeta');
    const totalEl = document.getElementById('year70LogsCurrentTotal');
    const timelineEl = document.getElementById('year70LogsTimelineContainer');

    if (cand) {
      if (nameEl) nameEl.textContent = cand.student_name;
      if (metaEl) metaEl.textContent = `${cand.grade} • ${cand.target_position}`;
      if (totalEl) totalEl.textContent = `${cand.total_points} แต้ม ⭐`;
    }

    if (timelineEl) {
      timelineEl.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <i data-lucide="loader" class="dg-spin" style="width: 24px; height: 24px; margin-bottom: 8px; color: #f59e0b;"></i>
          <div>กำลังโหลดประวัติคะแนน...</div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }

    showYear70Modal('adminYear70LogsModal');

    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/candidates/${candidateId}/logs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();

      if (!json || !json.success || !Array.isArray(json.logs)) {
        throw new Error('ไม่สามารถดึงประวัติได้');
      }

      const isSuper = isSuperAdmin();

      if (json.candidate) {
        if (totalEl) totalEl.textContent = `${json.candidate.total_points} แต้ม ⭐`;
      }

      if (json.logs.length === 0) {
        timelineEl.innerHTML = `
          <div style="text-align: center; padding: 48px 20px; color: #94a3b8;">
            <i data-lucide="inbox" style="width: 36px; height: 36px; margin-bottom: 8px; color: #cbd5e1;"></i>
            <div style="font-weight: 600; color: #475569;">ยังไม่มีประวัติการให้หรือตัดแต้ม</div>
            <div style="font-size: 0.82rem; margin-top: 4px;">แต้มเริ่มต้นของผู้สมัครคือ 0 แต้ม</div>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';
      json.logs.forEach(log => {
        const isPositive = log.points > 0;
        const ptsSign = isPositive ? `+${log.points}` : `${log.points}`;
        const ptsColor = isPositive ? '#059669' : '#dc2626';
        const ptsBg = isPositive ? '#ecfdf5' : '#fef2f2';
        const ptsBorder = isPositive ? '#a7f3d0' : '#fecaca';

        let evidenceHtml = '';
        if (log.evidence_url) {
          evidenceHtml = `
            <div style="margin-top: 6px;">
              <button type="button" onclick="previewYear70Evidence('${escapeHtml(log.evidence_url)}')" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; font-size: 0.78rem; font-weight: 600; color: #16a34a; cursor: pointer; transition: all 0.15s ease;" onmouseover="this.style.background='#dcfce7'" onmouseout="this.style.background='#f0fdf4'" title="คลิกเพื่อดูรูปภาพหลักฐาน">
                <i data-lucide="image" style="width: 13px; height: 13px;"></i>
                <span>📷 ดูรูปหลักฐานแนบ</span>
              </button>
            </div>
          `;
        }

        html += `
          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); transition: border-color 0.15s ease;" onmouseover="this.style.borderColor='#cbd5e1'" onmouseout="this.style.borderColor='#e2e8f0'">
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <div style="padding: 6px 12px; border-radius: 8px; font-weight: 800; font-size: 1.05rem; background: ${ptsBg}; color: ${ptsColor}; border: 1px solid ${ptsBorder}; flex-shrink: 0; min-width: 52px; text-align: center;">
                ${ptsSign}
              </div>
              <div>
                <div style="font-weight: 600; color: #0f172a; font-size: 0.92rem; line-height: 1.4;">
                  ${escapeHtml(log.reason)}
                </div>
                ${evidenceHtml}
                <div style="font-size: 0.78rem; color: #64748b; margin-top: 4px; display: flex; align-items: center; gap: 8px;">
                  <span><i data-lucide="user" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle;"></i> บันทึกโดย: <strong>${escapeHtml(log.admin_username)}</strong></span>
                  <span style="color: #cbd5e1;">•</span>
                  <span><i data-lucide="clock" style="width: 12px; height: 12px; display: inline-block; vertical-align: middle;"></i> ${formatThaiDateTime(log.created_at)}</span>
                </div>
              </div>
            </div>

            ${isSuper ? `
              <button type="button" onclick="deletePointLogEntry(${log.id}, ${candidateId})" style="background: transparent; border: none; color: #ef4444; padding: 4px; cursor: pointer; border-radius: 6px; flex-shrink: 0;" title="ลบรายการนี้และคืนค่าแต้ม (Super Admin Only)">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            ` : ''}
          </div>
        `;
      });
      html += '</div>';

      timelineEl.innerHTML = html;
      if (window.lucide) lucide.createIcons();
    } catch (err) {
      timelineEl.innerHTML = `
        <div style="text-align: center; padding: 32px; color: #ef4444;">
          <i data-lucide="alert-circle" style="width: 28px; height: 28px; margin-bottom: 6px;"></i>
          <div>โหลดประวัติล้มเหลว: ${escapeHtml(err.message)}</div>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
    }
  };

  window.closePointLogsModal = function () {
    hideYear70Modal('adminYear70LogsModal');
  };

  // Delete point log entry (Super Admin Only)
  window.deletePointLogEntry = async function (logId, candidateId) {
    if (!isSuperAdmin()) {
      showToast('เฉพาะ Super Admin เท่านั้นที่สามารถลบประวัติแต้มได้', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: 'ยกเลิกรายการแต้มนี้?',
      text: 'เมื่อลบรายการนี้ คะแนนรวมของผู้สมัครจะถูกคำนวณใหม่และคืนค่าโดยอัตโนมัติ',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันลบรายการ',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn', cancelButton: 'custom-swal-btn' }
    });

    if (!confirm.isConfirmed) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/logs/${logId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ลบรายการแต้มไม่สำเร็จ');
      }

      if (typeof showToast === 'function') {
        showToast('ยกเลิกรายการคะแนนและคืนค่าแต้มรวมเรียบร้อยแล้ว', 'success');
      }

      // Refresh modal timeline and main table
      window.openPointLogsModal(candidateId);
      window.loadYear70Admin();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ลบรายการแต้มล้มเหลว',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 11. MODAL: MOVE POSITION (Super Admin Only)
  // ==========================================================
  window.openMovePositionModal = function (candidateId) {
    if (!isSuperAdmin()) {
      showToast('เฉพาะ Super Admin เท่านั้นที่สามารถย้ายตำแหน่งผู้สมัครได้', 'error');
      return;
    }

    const cand = year70Candidates.find(c => c.id === candidateId);
    if (!cand) return;

    currentActiveCandidateForMove = cand;

    const nameEl = document.getElementById('year70MoveCandidateName');
    const oldPosEl = document.getElementById('year70MoveOldPosition');
    const newPosSelect = document.getElementById('year70MoveNewPositionSelect');

    if (nameEl) nameEl.textContent = cand.student_name;
    if (oldPosEl) oldPosEl.textContent = cand.target_position;

    if (newPosSelect) {
      newPosSelect.innerHTML = VALID_POSITIONS.map(p => `
        <option value="${p}" ${p === cand.target_position ? 'selected disabled' : ''}>
          ${p} ${p === cand.target_position ? '(ตำแหน่งปัจจุบัน)' : ''}
        </option>
      `).join('');
    }

    showYear70Modal('adminYear70MoveModal');
  };

  window.closeMovePositionModal = function () {
    hideYear70Modal('adminYear70MoveModal');
  };

  window.submitMovePosition = async function () {
    if (!currentActiveCandidateForMove) return;

    const newPosSelect = document.getElementById('year70MoveNewPositionSelect');
    const newPos = newPosSelect ? newPosSelect.value : '';

    if (!newPos || !VALID_POSITIONS.includes(newPos)) {
      Swal.fire({
        icon: 'warning',
        title: 'ตำแหน่งไม่ถูกต้อง',
        text: 'กรุณาเลือกตำแหน่งเป้าหมายใหม่',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      return;
    }

    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/candidates/${currentActiveCandidateForMove.id}/position`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ target_position: newPos })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ย้ายฝ่ายไม่สำเร็จ');
      }

      window.closeMovePositionModal();
      if (typeof showToast === 'function') {
        showToast(json.message, 'success');
      }

      window.loadYear70Admin();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ย้ายฝ่ายล้มเหลว',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 12. DELETE CANDIDATE (Super Admin Only)
  // ==========================================================
  window.deleteYear70Candidate = async function (candidateId, name) {
    if (!isSuperAdmin()) {
      showToast('เฉพาะ Super Admin เท่านั้นที่สามารถลบผู้สมัครออกจากระบบได้', 'error');
      return;
    }

    const confirm = await Swal.fire({
      title: `ยืนยันลบ "${name}"?`,
      html: `คุณกำลังจะลบผู้สมัครคนนี้ออกจากระบบสะสมแต้มปี 70<br><span style="color: #dc2626; font-size: 0.85rem;">ประวัติแต้มทั้งหมดของบุคคลนี้จะถูกลบไปด้วยและไม่สามารถกู้คืนได้</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ยืนยันลบผู้สมัคร',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn', cancelButton: 'custom-swal-btn' }
    });

    if (!confirm.isConfirmed) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/year70/candidates/${candidateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'ลบผู้สมัครไม่สำเร็จ');
      }

      if (typeof showToast === 'function') {
        showToast(json.message, 'success');
      }

      window.loadYear70Admin();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ลบผู้สมัครล้มเหลว',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 13. EXPORT CSV
  // ==========================================================
  window.exportYear70Csv = async function () {
    const token = getAuthToken();
    const pos = currentPositionFilter;
    const url = `${getApiBase()}/api/year70/export?position=${encodeURIComponent(pos)}`;

    try {
      if (typeof showToast === 'function') {
        showToast('กำลังสร้างและดาวน์โหลดไฟล์ CSV...', 'info');
      }

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `sarawat_year70_points_${pos}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      if (typeof showToast === 'function') {
        showToast('ดาวน์โหลดไฟล์ CSV เรียบร้อยแล้ว', 'success');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ส่งออก CSV ล้มเหลว',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    }
  };

  // ==========================================================
  // 14. PRINT SUMMARY REPORT
  // ==========================================================
  window.printYear70Summary = function () {
    if (!year70Candidates || year70Candidates.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'ไม่มีข้อมูล',
        text: 'ยังไม่มีข้อมูลผู้สมัครสำหรับพิมพ์รายงาน',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
      return;
    }

    const printWin = window.open('', '_blank');
    if (!printWin) {
      alert('กรุณาอนุญาตป๊อปอัปเพื่อเปิดหน้าต่างพิมพ์รายงาน');
      return;
    }

    const posTitle = currentPositionFilter === 'ALL' ? 'ทุกฝ่าย (ภาพรวม Leaderboard)' : currentPositionFilter;
    const nowStr = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let rowsHtml = '';
    year70Candidates.forEach((c, idx) => {
      rowsHtml += `
        <tr>
          <td style="text-align: center; padding: 8px; border: 1px solid #cbd5e1;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-weight: 600;">${escapeHtml(c.student_name)}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(c.grade)}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1;">${escapeHtml(c.target_position)}</td>
          <td style="text-align: center; padding: 8px; border: 1px solid #cbd5e1; font-weight: bold; font-size: 1.1rem; color: #b45309;">${c.total_points}</td>
          <td style="padding: 8px; border: 1px solid #cbd5e1; font-size: 0.85rem; color: #64748b;">${escapeHtml(c.notes || '-')}</td>
        </tr>
      `;
    });

    const docContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>รายงานสรุปคะแนนสะสมคณะทำงานสารวัตรนักเรียน ปี 2570</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Sarabun', sans-serif;
            margin: 25px;
            color: #0f172a;
          }
          .header {
            text-align: center;
            margin-bottom: 24px;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 16px;
          }
          h1 { margin: 0 0 6px 0; font-size: 1.5rem; }
          .meta { font-size: 0.9rem; color: #475569; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
            font-size: 0.92rem;
          }
          th {
            background: #f1f5f9;
            padding: 10px 8px;
            border: 1px solid #94a3b8;
            font-weight: 700;
          }
          .footer {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
          }
          @media print {
            body { margin: 15mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>สรุปผลคะแนนสะสมคณะทำงานสารวัตรนักเรียน ประจำปีการศึกษา 2570</h1>
          <div class="meta">
            ฝ่ายที่เลือก: <strong>${posTitle}</strong> | ข้อมูล ณ วันที่: ${nowStr}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">อันดับ</th>
              <th>ชื่อ-นามสกุล</th>
              <th style="width: 80px;">ชั้น</th>
              <th style="width: 160px;">ตำแหน่งเป้าหมาย</th>
              <th style="width: 100px;">คะแนนสะสม</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>ผู้พิมพ์รายงาน: _____________________</div>
          <div>ผู้รับรองผลการประเมิน: _____________________</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWin.document.open();
    printWin.document.write(docContent);
    printWin.document.close();
  };

})();
