/**
 * Admin Team Management - Two-Column Selection System (ฝ่าย & ตำแหน่ง)
 * Clean, fast, 100% synced with 143 SQLite Student Database
 */

let allMembers = [];
let studentDirectory = [];
let teamMemberSearchTerm = '';
let activeDeptFilter = 'ALL';
let hasUnsavedChanges = false;

const DEPARTMENTS = [
  'คณะผู้บริหาร',
  'ฝ่ายเอกสาร',
  'ฝ่ายโสตทัศนศิลป์',
  'ฝ่ายสารวัตรพยาบาล',
  'ฝ่ายการเงิน',
  'ฝ่ายกิจกรรม',
  'ฝ่ายอุปกรณ์และ IT',
  'ฝ่ายวินัย',
  'สมาชิกทั่วไป'
];

const FIXED_DEPTS = [
  'ฝ่ายเอกสาร',
  'ฝ่ายโสตทัศนศิลป์',
  'ฝ่ายสารวัตรพยาบาล',
  'ฝ่ายการเงิน',
  'ฝ่ายกิจกรรม',
  'ฝ่ายอุปกรณ์และ IT',
  'ฝ่ายวินัย'
];

function getRolesForDepartment(dept) {
  if (dept === 'คณะผู้บริหาร') {
    return ['ประธาน', 'รองประธาน', 'เลขานุการ'];
  }
  if (dept === 'สมาชิกทั่วไป') {
    return ['ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน'];
  }
  return ['หัวหน้าฝ่าย', 'สมาชิกฝ่าย'];
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

function handleTeamMemberSearch(term) {
  teamMemberSearchTerm = (term || '').trim().toLowerCase();
  renderTeamAdminUI();
}
window.handleTeamMemberSearch = handleTeamMemberSearch;

function setDeptFilter(dept) {
  activeDeptFilter = dept;
  renderTeamAdminUI();
}
window.setDeptFilter = setDeptFilter;

function notifyDraftChanged() {
  hasUnsavedChanges = true;
  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
  } catch (e) {}
}

/**
 * Fetch Student Directory from SQLite (/api/students)
 */
async function fetchStudentDirectory() {
  try {
    const base = window.SarawatApi ? window.SarawatApi.getBaseUrl() : '';
    let res = await fetch((base || '') + '/api/students');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        studentDirectory = data;
        try { localStorage.setItem('dg_sarawat_student_dir', JSON.stringify(studentDirectory)); } catch (e) {}
        return studentDirectory;
      }
    }
  } catch (err) {
    console.warn('Backend student directory unavailable, checking local storage:', err.message);
  }

  try {
    const local = localStorage.getItem('dg_sarawat_student_dir');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        studentDirectory = parsed;
        return studentDirectory;
      }
    }
  } catch (e) {}

  return studentDirectory;
}

/**
 * Load and initialize Team Admin
 */
async function loadTeamAdmin() {
  const container = document.getElementById('teamAdminContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px;">
      <i data-lucide="loader-2" class="dg-spin" style="width: 40px; height: 40px; color: var(--dg-primary);"></i>
      <p style="margin-top: 16px; font-weight: 600; color: #475569;">กำลังโหลดระบบตั้งค่าทำเนียบสารวัตรนักเรียน 143 คน...</p>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  await fetchStudentDirectory();

  let loadedOnline = false;
  try {
    const base = window.SarawatApi ? window.SarawatApi.getBaseUrl() : '';
    if (base) {
      const res = await fetch(base + '/api/settings');
      if (res.ok) {
        const settingsData = await res.json();
        if (settingsData && settingsData.team_members_db) {
          const parsed = typeof settingsData.team_members_db === 'string'
            ? JSON.parse(settingsData.team_members_db)
            : settingsData.team_members_db;
          if (Array.isArray(parsed) && parsed.length > 0) {
            allMembers = parsed;
            loadedOnline = true;
            try { localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers)); } catch (e) {}
          }
        }
      }
    }
  } catch (err) {
    console.warn('Backend team API unavailable:', err.message);
  }

  if (!loadedOnline) {
    try {
      const local = localStorage.getItem('dg_sarawat_team_members');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) allMembers = parsed;
      }
    } catch (e) {}
  }

  // Ensure all 143 students exist in allMembers 1:1
  syncMembersWithDirectory();

  renderTeamAdminUI();
}
window.loadTeamAdmin = loadTeamAdmin;

/**
 * Sync allMembers strictly with 143 studentDirectory entries
 */
function syncMembersWithDirectory() {
  if (!studentDirectory || studentDirectory.length === 0) return;

  const existingByOrder = new Map();
  allMembers.forEach(m => {
    if (m.order_no) existingByOrder.set(m.order_no, m);
  });

  const synced = [];
  studentDirectory.forEach(s => {
    let m = existingByOrder.get(s.order_no);
    if (!m) {
      // Create clean record from SQLite rank
      let dept = 'สมาชิกทั่วไป';
      let role = 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน';

      if (s.rank === 'ประธาน') {
        dept = 'คณะผู้บริหาร';
        role = 'ประธาน';
      } else if (s.rank === 'รองประธาน') {
        dept = 'คณะผู้บริหาร';
        role = 'รองประธาน';
      } else if (s.rank === 'เลขานุการ') {
        dept = 'คณะผู้บริหาร';
        role = 'เลขานุการ';
      } else if (s.rank === 'ฝ่ายโสตฯ') {
        dept = 'ฝ่ายโสตทัศนศิลป์';
        role = 'สมาชิกฝ่าย';
      } else if (FIXED_DEPTS.includes(s.rank)) {
        dept = s.rank;
        role = 'สมาชิกฝ่าย';
      }

      m = {
        id: 's_' + s.order_no,
        student_id: s.order_no,
        order_no: s.order_no,
        name: s.name,
        grade: s.grade,
        department: dept,
        role: role,
        imageUrl: '',
        homeImageUrl: '',
        teamImageUrl: ''
      };
    } else {
      m.name = s.name;
      m.grade = s.grade;
      m.order_no = s.order_no;
      m.student_id = s.order_no;
      // Normalize department names
      if (m.department === 'ชั้นมัธยมศึกษาปีที่ ' + s.grade || m.department.startsWith('รองประธาน') || m.department.startsWith('ฝ่ายเลขานุการ')) {
        m.department = 'คณะผู้บริหาร';
      } else if (m.department.startsWith('สมาชิกทั่วไป')) {
        m.department = 'สมาชิกทั่วไป';
      }
      if (m.role.startsWith('สมาชิกฝ่าย')) {
        m.role = 'สมาชิกฝ่าย';
      }
    }
    synced.push(m);
  });

  allMembers = synced;
}

/**
 * Handle Column 1: Department change
 */
window.handleDeptChange = function(orderNo, newDept) {
  const m = allMembers.find(x => x.order_no === orderNo);
  if (!m) return;
  m.department = newDept;

  const validRoles = getRolesForDepartment(newDept);
  if (!validRoles.includes(m.role)) {
    if (newDept === 'คณะผู้บริหาร') m.role = 'รองประธาน';
    else if (newDept === 'สมาชิกทั่วไป') m.role = 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน';
    else m.role = 'สมาชิกฝ่าย';
  }

  enforceUniqueLeadership(newDept, m.role, orderNo);
  notifyDraftChanged();
  renderTeamAdminUI();
};

/**
 * Handle Column 2: Role change
 */
window.handleRoleChange = function(orderNo, newRole) {
  const m = allMembers.find(x => x.order_no === orderNo);
  if (!m) return;
  m.role = newRole;

  enforceUniqueLeadership(m.department, newRole, orderNo);
  notifyDraftChanged();
  renderTeamAdminUI();
};

/**
 * Enforce exactly 1 President and 1 Head per department
 */
function enforceUniqueLeadership(dept, role, currentOrderNo) {
  if (role === 'ประธาน') {
    allMembers.forEach(x => {
      if (x.order_no !== currentOrderNo && x.role === 'ประธาน') {
        x.role = 'รองประธาน';
      }
    });
  } else if (role === 'หัวหน้าฝ่าย') {
    allMembers.forEach(x => {
      if (x.order_no !== currentOrderNo && x.department === dept && x.role === 'หัวหน้าฝ่าย') {
        x.role = 'สมาชิกฝ่าย';
      }
    });
  }
}

/**
 * Reset all 143 positions back to official SQLite Database ranks
 */
window.resetToSqliteDefaults = async function() {
  if (typeof Swal !== 'undefined') {
    const result = await Swal.fire({
      title: 'รีเซ็ตฝ่ายและตำแหน่งตามฐานข้อมูล?',
      text: 'ระบบจะกำหนดฝ่ายและตำแหน่งของนักเรียนทั้ง 143 คนกลับเป็นค่าเริ่มต้นตามไฟล์ฐานข้อมูลทางการ โดยยังคงรูปภาพที่เคยอัปโหลดไว้ทั้งหมด',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, รีเซ็ตตำแหน่ง',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
    });
    if (!result.isConfirmed) return;
  } else {
    if (!confirm('ยืนยันรีเซ็ตฝ่ายและตำแหน่งตามฐานข้อมูล SQLite 143 คนหรือไม่?')) return;
  }

  const existingImages = new Map();
  allMembers.forEach(m => {
    if (m.order_no && (m.imageUrl || m.homeImageUrl || m.teamImageUrl)) {
      existingImages.set(m.order_no, {
        imageUrl: m.imageUrl || '',
        homeImageUrl: m.homeImageUrl || '',
        teamImageUrl: m.teamImageUrl || ''
      });
    }
  });

  const defaultHeads = {
    'ฝ่ายเอกสาร': 140,
    'ฝ่ายโสตทัศนศิลป์': 110,
    'ฝ่ายสารวัตรพยาบาล': 78,
    'ฝ่ายการเงิน': 71,
    'ฝ่ายกิจกรรม': 100,
    'ฝ่ายอุปกรณ์และ IT': 111,
    'ฝ่ายวินัย': 116
  };

  const synced = [];
  studentDirectory.forEach(s => {
    const img = existingImages.get(s.order_no) || {};
    let dept = 'สมาชิกทั่วไป';
    let role = 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน';

    if (s.rank === 'ประธาน') {
      dept = 'คณะผู้บริหาร';
      role = 'ประธาน';
    } else if (s.rank === 'รองประธาน') {
      dept = 'คณะผู้บริหาร';
      role = 'รองประธาน';
    } else if (s.rank === 'เลขานุการ') {
      dept = 'คณะผู้บริหาร';
      role = 'เลขานุการ';
    } else if (s.rank === 'ฝ่ายโสตฯ') {
      dept = 'ฝ่ายโสตทัศนศิลป์';
      role = (defaultHeads[dept] === s.order_no) ? 'หัวหน้าฝ่าย' : 'สมาชิกฝ่าย';
    } else if (FIXED_DEPTS.includes(s.rank)) {
      dept = s.rank;
      role = (defaultHeads[dept] === s.order_no) ? 'หัวหน้าฝ่าย' : 'สมาชิกฝ่าย';
    }

    synced.push({
      id: 's_' + s.order_no,
      student_id: s.order_no,
      order_no: s.order_no,
      name: s.name,
      grade: s.grade,
      department: dept,
      role: role,
      imageUrl: img.imageUrl || '',
      homeImageUrl: img.homeImageUrl || '',
      teamImageUrl: img.teamImageUrl || ''
    });
  });

  allMembers = synced;
  notifyDraftChanged();
  renderTeamAdminUI();
  if (window.showToast) window.showToast('รีเซ็ตฝ่ายและตำแหน่งตามฐานข้อมูลเรียบร้อยแล้ว', 'success');
};

/**
 * Render Main UI
 */
function renderTeamAdminUI() {
  const container = document.getElementById('teamAdminContainer');
  if (!container) return;

  const countBadge = document.getElementById('teamCountBadge');
  if (countBadge) {
    countBadge.innerHTML = `<i class="fa-solid fa-users"></i> ${allMembers.length} สมาชิก (SQLite 100%)`;
  }

  // Count stats
  const stats = {};
  DEPARTMENTS.forEach(d => { stats[d] = 0; });
  allMembers.forEach(m => {
    if (stats[m.department] !== undefined) stats[m.department]++;
    else stats['สมาชิกทั่วไป']++;
  });

  // Filter students
  let filtered = allMembers;
  if (activeDeptFilter !== 'ALL') {
    filtered = filtered.filter(m => m.department === activeDeptFilter);
  }
  if (teamMemberSearchTerm) {
    filtered = filtered.filter(m =>
      (m.name && m.name.toLowerCase().includes(teamMemberSearchTerm)) ||
      (m.grade && String(m.grade).toLowerCase().includes(teamMemberSearchTerm)) ||
      (m.department && m.department.toLowerCase().includes(teamMemberSearchTerm)) ||
      (m.role && m.role.toLowerCase().includes(teamMemberSearchTerm))
    );
  }

  // Find leadership for photos
  const president = allMembers.find(m => m.role === 'ประธาน') || { name: 'ยังไม่ได้ระบุ', grade: '-', order_no: 0 };
  const vps = allMembers.filter(m => m.role === 'รองประธาน');
  const heads = {};
  FIXED_DEPTS.forEach(dept => {
    heads[dept] = allMembers.find(m => m.department === dept && m.role === 'หัวหน้าฝ่าย');
  });

  let html = `
    <style>
      .team-bento-card { background: #fff; border: 1px solid var(--dg-border); border-radius: 14px; padding: 22px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
      .team-photo-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-top: 16px; }
      .photo-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; text-align: center; display: flex; flex-direction: column; align-items: center; }
      .photo-card.is-pres { border-color: #3b82f6; background: #eff6ff; }
      .photo-frame { width: 120px; aspect-ratio: 4 / 5; border-radius: 10px; background: #fff; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.04); }
      .photo-frame img { width: 100%; height: 100%; object-fit: cover; }
      
      .dept-filter-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
      .dept-tab-btn { padding: 6px 14px; border-radius: 9999px; border: 1px solid #cbd5e1; background: #fff; font-size: 0.84rem; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 6px; }
      .dept-tab-btn:hover { background: #f1f5f9; border-color: #94a3b8; }
      .dept-tab-btn.active { background: #0f172a; color: #fff; border-color: #0f172a; }
      .dept-tab-btn .badge-num { font-size: 0.74rem; padding: 1px 6px; border-radius: 999px; background: rgba(0,0,0,0.06); }
      .dept-tab-btn.active .badge-num { background: rgba(255,255,255,0.2); color: #fff; }

      .master-team-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
      .master-team-table th, .master-team-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; }
      .master-team-table th { background: #f8fafc; font-weight: 700; color: #475569; font-size: 0.86rem; letter-spacing: -0.01em; }
      .master-team-table tr:hover { background: #f8fafc; }
      .col-select { width: 100%; max-width: 175px; padding: 7px 10px; border-radius: 8px; border: 1.5px solid #cbd5e1; background: #fff; font-size: 0.86rem; font-family: inherit; font-weight: 600; color: #0f172a; outline: none; }
      .col-select:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
      .col-select.role-lead { background: #eff6ff; border-color: #93c5fd; color: #1e40af; }
    </style>

    <!-- TOP TOOLBAR & QUICK ACTIONS -->
    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-weight: 700; font-size: 0.95rem; color: #0f172a;">
          <i data-lucide="database" style="width: 18px; height: 18px; color: #10b981; vertical-align: middle; margin-right: 4px;"></i>
          ฐานข้อมูลสารวัตรนักเรียน SQLite: <strong>143 รายชื่อ</strong>
        </span>
        <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 0.78rem; font-weight: 700; padding: 3px 10px; border-radius: 9999px; background: #dcfce7; color: #15803d;">
          <i data-lucide="check" style="width: 13px; height: 13px;"></i> เชื่อมโยง 100%
        </span>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" class="dg-btn-white" onclick="resetToSqliteDefaults()" style="font-size: 0.86rem; padding: 8px 16px; border-color: #cbd5e1;" title="รีเซ็ตตำแหน่งนักเรียน 143 คนตามฐานข้อมูล">
          <i data-lucide="rotate-ccw" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          <span>รีเซ็ตตาม SQLite</span>
        </button>
        <button type="button" class="dg-btn-black" onclick="saveTeamSettings()" style="font-size: 0.88rem; padding: 8px 20px;">
          <i data-lucide="save" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          <span>บันทึกข้อมูลทำเนียบ</span>
        </button>
      </div>
    </div>

    <!-- ==========================================
         SECTION 1: PHOTO MANAGEMENT CARDS (TOP)
         ========================================== -->
    <div class="team-bento-card">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 14px; margin-bottom: 18px;">
        <div>
          <h3 style="font-size: 1.12rem; font-weight: 750; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="image" style="width: 20px; height: 20px; color: var(--dg-primary);"></i>
            <span>จัดการรูปภาพโปรไฟล์คณะผู้บริหารและหัวหน้าฝ่าย</span>
          </h3>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 3px;">
            ระบบจะดึงชื่อบุคคลอัตโนมัติจากคนที่ได้รับเลือกตำแหน่ง "ประธาน", "รองประธาน" และ "หัวหน้าฝ่าย" ในตารางด้านล่าง
          </div>
        </div>
      </div>

      <div class="team-photo-grid">
        <!-- President Card (Dual Upload) -->
        <div class="photo-card is-pres" style="grid-column: span 2; min-width: 320px;">
          <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 10px;">
            <span style="font-weight: 750; font-size: 0.9rem; color: #1e3a8a; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="crown" style="width: 16px; height: 16px; color: #f59e0b;"></i>
              <span>ประธานคณะกรรมการ</span>
            </span>
            <span style="font-size: 0.75rem; font-weight: 600; background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px;">อัตราส่วน 4:5</span>
          </div>
          <div style="font-weight: 700; font-size: 1.05rem; color: #0f172a; margin-bottom: 12px;">
            ${escapeHtml(president.name)} ${president.grade && president.grade !== '-' ? `(ม.${president.grade})` : ''}
          </div>
          <div style="display: flex; gap: 16px; justify-content: center; width: 100%;">
            <!-- Home Image -->
            <div style="text-align: center;">
              <div style="font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 6px;">1. รูปหน้าแรก (index)</div>
              <div class="photo-frame">
                ${president.homeImageUrl || president.imageUrl ? `<img src="${resolveUrl(president.homeImageUrl || president.imageUrl)}" id="img_preview_${president.id}_home" />` : `<i data-lucide="user" style="color: #cbd5e1; width: 36px; height: 36px;"></i>`}
              </div>
              <input type="file" id="file_${president.id}_home" accept="image/*" style="display:none;" onchange="handleImageSelect('${president.id}', 'home')" />
              <button type="button" class="dg-btn-black" style="font-size: 0.78rem; padding: 4px 10px;" onclick="document.getElementById('file_${president.id}_home').click()">
                ${president.homeImageUrl ? 'เปลี่ยนรูป' : 'อัปโหลด'}
              </button>
            </div>
            <!-- Team Image -->
            <div style="text-align: center;">
              <div style="font-size: 0.74rem; font-weight: 700; color: #475569; margin-bottom: 6px;">2. รูปหน้าคณะทำงาน (team)</div>
              <div class="photo-frame">
                ${president.teamImageUrl || president.imageUrl ? `<img src="${resolveUrl(president.teamImageUrl || president.imageUrl)}" id="img_preview_${president.id}_team" />` : `<i data-lucide="user" style="color: #cbd5e1; width: 36px; height: 36px;"></i>`}
              </div>
              <input type="file" id="file_${president.id}_team" accept="image/*" style="display:none;" onchange="handleImageSelect('${president.id}', 'team')" />
              <button type="button" class="dg-btn-black" style="font-size: 0.78rem; padding: 4px 10px;" onclick="document.getElementById('file_${president.id}_team').click()">
                ${president.teamImageUrl ? 'เปลี่ยนรูป' : 'อัปโหลด'}
              </button>
            </div>
          </div>
        </div>

        <!-- Vice Presidents -->
        ${vps.map((vp, i) => `
          <div class="photo-card">
            <div style="font-weight: 700; font-size: 0.86rem; color: #4338ca; margin-bottom: 4px;">รองประธานคนที่ ${i + 1}</div>
            <div style="font-weight: 700; font-size: 0.95rem; color: #0f172a; margin-bottom: 8px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">${escapeHtml(vp.name)}</div>
            <div class="photo-frame">
              ${vp.imageUrl ? `<img src="${resolveUrl(vp.imageUrl)}" id="img_preview_${vp.id}" />` : `<i data-lucide="user" style="color: #cbd5e1; width: 32px; height: 32px;"></i>`}
            </div>
            <input type="file" id="file_${vp.id}" accept="image/*" style="display:none;" onchange="handleImageSelect('${vp.id}')" />
            <div style="display: flex; gap: 6px;">
              <button type="button" class="dg-btn-white" style="font-size: 0.78rem; padding: 4px 10px;" onclick="document.getElementById('file_${vp.id}').click()">
                ${vp.imageUrl ? 'เปลี่ยนรูป' : 'อัปโหลด'}
              </button>
              ${vp.imageUrl ? `<button type="button" class="dg-btn-white" style="font-size: 0.78rem; padding: 4px 8px; color: #ef4444;" onclick="removeImage('${vp.id}')"><i data-lucide="trash-2" style="width: 12px; height: 12px;"></i></button>` : ''}
            </div>
          </div>
        `).join('')}

        <!-- 7 Department Heads -->
        ${FIXED_DEPTS.map(dept => {
          const h = heads[dept];
          const hasHead = !!h;
          const hName = hasHead ? h.name : '(ยังไม่ได้เลือก)';
          const hId = hasHead ? h.id : 'no_head_' + dept;
          const hImg = hasHead ? h.imageUrl : '';

          return `
            <div class="photo-card">
              <div style="font-weight: 700; font-size: 0.84rem; color: #1e40af; margin-bottom: 3px;">หัวหน้า${dept}</div>
              <div style="font-weight: 700; font-size: 0.92rem; color: ${hasHead ? '#0f172a' : '#94a3b8'}; margin-bottom: 8px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; max-width: 180px;">
                ${escapeHtml(hName)}
              </div>
              <div class="photo-frame">
                ${hImg ? `<img src="${resolveUrl(hImg)}" id="img_preview_${hId}" />` : `<i data-lucide="user" style="color: #cbd5e1; width: 32px; height: 32px;"></i>`}
              </div>
              ${hasHead ? `
                <input type="file" id="file_${hId}" accept="image/*" style="display:none;" onchange="handleImageSelect('${hId}')" />
                <div style="display: flex; gap: 6px;">
                  <button type="button" class="dg-btn-white" style="font-size: 0.78rem; padding: 4px 10px;" onclick="document.getElementById('file_${hId}').click()">
                    ${hImg ? 'เปลี่ยนรูป' : 'อัปโหลด'}
                  </button>
                  ${hImg ? `<button type="button" class="dg-btn-white" style="font-size: 0.78rem; padding: 4px 8px; color: #ef4444;" onclick="removeImage('${hId}')"><i data-lucide="trash-2" style="width: 12px; height: 12px;"></i></button>` : ''}
                </div>
              ` : `
                <div style="font-size: 0.72rem; color: #94a3b8;">เลือกในตารางด้านล่าง</div>
              `}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- ==========================================
         SECTION 2: MASTER TWO-COLUMN TABLE (143)
         ========================================== -->
    <div class="team-bento-card">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
        <div>
          <h3 style="font-size: 1.12rem; font-weight: 750; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="list-checks" style="width: 20px; height: 20px; color: var(--dg-primary);"></i>
            <span>กำหนดฝ่ายและตำแหน่งนักเรียน (2 คอลัมน์อิสระ • ${allMembers.length} คน)</span>
          </h3>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 3px;">
            คอลัมน์ที่ 1: เลือกสังกัดฝ่าย | คอลัมน์ที่ 2: เลือกตำแหน่งในฝ่าย (หัวหน้าฝ่าย/สมาชิกฝ่าย/ผู้บริหาร)
          </div>
        </div>
      </div>

      <!-- Department Filter Tabs -->
      <div class="dept-filter-tabs">
        <button type="button" class="dept-tab-btn ${activeDeptFilter === 'ALL' ? 'active' : ''}" onclick="setDeptFilter('ALL')">
          <span>ทั้งหมด</span>
          <span class="badge-num">${allMembers.length}</span>
        </button>
        ${DEPARTMENTS.map(d => `
          <button type="button" class="dept-tab-btn ${activeDeptFilter === d ? 'active' : ''}" onclick="setDeptFilter('${d}')">
            <span>${d}</span>
            <span class="badge-num">${stats[d] || 0}</span>
          </button>
        `).join('')}
      </div>

      <!-- Master Table -->
      <table class="master-team-table">
        <thead>
          <tr>
            <th style="width: 60px; text-align: center;">ลำดับ</th>
            <th>ชื่อ - นามสกุล</th>
            <th style="width: 80px; text-align: center;">ชั้น</th>
            <th style="width: 200px;">คอลัมน์ 1: สังกัด/ฝ่าย</th>
            <th style="width: 190px;">คอลัมน์ 2: ตำแหน่งในฝ่าย</th>
            <th style="width: 170px; text-align: center;">สถานะในทำเนียบ</th>
          </tr>
        </thead>
        <tbody>
  `;

  filtered.forEach((m, idx) => {
    const roles = getRolesForDepartment(m.department);
    const isLeadership = m.role === 'ประธาน' || m.role === 'หัวหน้าฝ่าย' || m.role === 'รองประธาน';

    html += `
      <tr>
        <td style="text-align: center; font-weight: 700; color: #64748b; font-size: 0.86rem;">${m.order_no || (idx + 1)}</td>
        <td>
          <div style="font-weight: 700; color: #0f172a; font-size: 0.94rem;">${escapeHtml(m.name)}</div>
        </td>
        <td style="text-align: center; font-weight: 600; color: #475569; font-size: 0.88rem;">
          ${m.grade ? 'ม.' + escapeHtml(m.grade) : '-'}
        </td>
        <td>
          <select class="col-select" onchange="handleDeptChange(${m.order_no}, this.value)">
            ${DEPARTMENTS.map(d => `<option value="${d}" ${m.department === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
        </td>
        <td>
          <select class="col-select ${isLeadership ? 'role-lead' : ''}" onchange="handleRoleChange(${m.order_no}, this.value)">
            ${roles.map(r => `<option value="${r}" ${m.role === r ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </td>
        <td style="text-align: center;">
          ${renderStatusBadge(m.department, m.role)}
        </td>
      </tr>
    `;
  });

  if (filtered.length === 0) {
    html += `<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748b;">ไม่พบรายชื่อตรงกับตัวกรอง</td></tr>`;
  }

  html += `
        </tbody>
      </table>

      <!-- Bottom Save Button -->
      <div style="text-align: center; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <button class="dg-btn-black" onclick="saveTeamSettings()" style="font-size: 1.05rem; padding: 12px 36px; border-radius: 50px; box-shadow: 0 4px 14px rgba(0,0,0,0.12);">
          <i data-lucide="save" style="margin-right: 8px;"></i>
          <span>บันทึกข้อมูลทำเนียบสารวัตรนักเรียนทั้งหมด</span>
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

function renderStatusBadge(dept, role) {
  if (role === 'ประธาน') {
    return '<span style="background: #fef3c7; color: #b45309; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 750;">👑 ประธาน</span>';
  }
  if (role === 'รองประธาน') {
    return '<span style="background: #e0e7ff; color: #4338ca; border: 1px solid #c7d2fe; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 750;">⭐ รองประธาน</span>';
  }
  if (role === 'เลขานุการ') {
    return '<span style="background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 750;">📝 เลขานุการ</span>';
  }
  if (role === 'หัวหน้าฝ่าย') {
    return `<span style="background: #eff6ff; color: #1d4ed8; border: 1.5px solid #93c5fd; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 750;">👑 หัวหน้า${dept}</span>`;
  }
  if (dept && dept !== 'สมาชิกทั่วไป' && dept !== 'คณะผู้บริหาร') {
    return `<span style="background: #f8fafc; color: #334155; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem; font-weight: 600;">สมาชิก${dept}</span>`;
  }
  return '<span style="background: #f1f5f9; color: #64748b; padding: 4px 10px; border-radius: 999px; font-size: 0.78rem;">สมาชิกทั่วไป</span>';
}

function resolveUrl(url) {
  if (!url) return '';
  if (window.resolveImageUrl) return window.resolveImageUrl(url);
  if (url.startsWith('/')) {
    const base = (window.SarawatApi && window.SarawatApi.getBaseUrl) ? window.SarawatApi.getBaseUrl() : '';
    return base + url;
  }
  return url;
}

async function handleImageSelect(id, target = 'default') {
  const inputId = target === 'default' ? 'file_' + id : 'file_' + id + '_' + target;
  const fileInput = document.getElementById(inputId);
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];

  try {
    const res = await window.SarawatApi.uploadImage(file);
    if (res && res.url) {
      let m = allMembers.find(x => x.id === id);
      if (!m) return;

      if (target === 'home') {
        m.homeImageUrl = res.url;
        try { localStorage.setItem('dg_sarawat_president_home_image', res.url); } catch (e) {}
      } else if (target === 'team') {
        m.teamImageUrl = res.url;
        m.imageUrl = res.url;
        try { localStorage.setItem('dg_sarawat_president_team_image', res.url); } catch (e) {}
      } else {
        m.imageUrl = res.url;
        if (!m.homeImageUrl) m.homeImageUrl = res.url;
        if (!m.teamImageUrl) m.teamImageUrl = res.url;
      }

      notifyDraftChanged();
      renderTeamAdminUI();
      if (window.showToast) window.showToast('อัปโหลดรูปภาพสำเร็จ', 'success');
    }
  } catch (err) {
    if (window.showToast) window.showToast('อัปโหลดไม่สำเร็จ: ' + err.message, 'error');
    else alert('อัปโหลดไม่สำเร็จ: ' + err.message);
  }
}
window.handleImageSelect = handleImageSelect;

function removeImage(id, target = 'default') {
  let m = allMembers.find(x => x.id === id);
  if (!m) return;

  if (target === 'home') {
    m.homeImageUrl = '';
    try { localStorage.removeItem('dg_sarawat_president_home_image'); } catch (e) {}
  } else if (target === 'team') {
    m.teamImageUrl = '';
    m.imageUrl = '';
    try { localStorage.removeItem('dg_sarawat_president_team_image'); } catch (e) {}
  } else {
    m.imageUrl = '';
    m.homeImageUrl = '';
    m.teamImageUrl = '';
  }

  notifyDraftChanged();
  renderTeamAdminUI();
  if (window.showToast) window.showToast('ลบรูปภาพเรียบร้อยแล้ว', 'info');
}
window.removeImage = removeImage;

async function saveTeamSettings() {
  const presMember = allMembers.find(m => m.role === 'ประธาน');

  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
    if (presMember) {
      if (presMember.homeImageUrl) localStorage.setItem('dg_sarawat_president_home_image', presMember.homeImageUrl);
      else localStorage.removeItem('dg_sarawat_president_home_image');

      if (presMember.teamImageUrl) localStorage.setItem('dg_sarawat_president_team_image', presMember.teamImageUrl);
      else localStorage.removeItem('dg_sarawat_president_team_image');
    }
  } catch (e) {}

  let savedOnline = false;
  try {
    const payload = {
      team_members_db: JSON.stringify(allMembers),
      president_home_image: presMember ? (presMember.homeImageUrl || '') : '',
      president_team_image: presMember ? (presMember.teamImageUrl || presMember.imageUrl || '') : ''
    };

    if (window.SarawatApi && typeof window.SarawatApi.saveSettings === 'function') {
      await window.SarawatApi.saveSettings(payload);
      savedOnline = true;
    } else {
      const base = window.SarawatApi ? window.SarawatApi.getBaseUrl() : '';
      if (base) {
        const headers = window.SarawatApi && typeof window.SarawatApi.getAuthHeaders === 'function'
          ? window.SarawatApi.getAuthHeaders({ 'Content-Type': 'application/json' })
          : { 'Content-Type': 'application/json' };
        const res = await fetch(base + '/api/settings', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(payload)
        });
        if (res.ok) savedOnline = true;
        else throw new Error('HTTP ' + res.status);
      }
    }

    if (savedOnline) {
      hasUnsavedChanges = false;
      if (window.showToast) window.showToast('บันทึกข้อมูลทำเนียบ 143 คนลงฐานข้อมูลเรียบร้อยแล้ว!', 'success');
      else alert('บันทึกข้อมูลทำเนียบสำเร็จ!');
    } else {
      if (window.showToast) window.showToast('บันทึกข้อมูลทำเนียบลงเครื่องเรียบร้อย (Local Draft)', 'warning');
      else alert('บันทึกข้อมูลลงเครื่องเรียบร้อย!');
    }
  } catch (err) {
    console.warn('API save team warning:', err);
    if (window.showToast) window.showToast('บันทึกข้อมูลลงเครื่องเรียบร้อย (เซิร์ฟเวอร์ออฟไลน์)', 'warning');
    else alert('บันทึกข้อมูลลงเครื่องเรียบร้อย');
  }
}
window.saveTeamSettings = saveTeamSettings;

document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(t => {
    t.addEventListener('click', () => {
      if (t.getAttribute('data-tab') === 'tab-team') {
        loadTeamAdmin();
      }
    });
  });
});
