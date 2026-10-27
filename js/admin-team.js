/**
 * Admin Team Management (Full DB, with Card Layout + Members Table + Unified SQLite Student Directory)
 */

let allMembers = [];
let studentDirectory = [];
let teamMemberSearchTerm = '';

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

/**
 * Fetch Student Directory from SQLite (/api/students or /api/roster/getStudents)
 */
async function fetchStudentDirectory() {
  try {
    const base = window.SarawatApi ? window.SarawatApi.getBaseUrl() : '';
    // 1. Try /api/students
    let res = await fetch((base || '') + '/api/students');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        studentDirectory = data;
        try { localStorage.setItem('dg_sarawat_student_dir', JSON.stringify(studentDirectory)); } catch (e) {}
        return studentDirectory;
      }
    }
    // 2. Try /api/roster/getStudents
    res = await fetch((base || '') + '/api/roster/getStudents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ args: [] })
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data && Array.isArray(data.result) ? data.result : []);
      if (list.length > 0) {
        studentDirectory = list;
        try { localStorage.setItem('dg_sarawat_student_dir', JSON.stringify(studentDirectory)); } catch (e) {}
        return studentDirectory;
      }
    }
  } catch (err) {
    console.warn('Backend student directory unavailable, checking local storage:', err.message);
  }

  // 3. Fallback to localStorage
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

async function loadTeamAdmin() {
  const container = document.getElementById('teamAdminContainer');
  if (!container) return;

  if (window.DgSkeletons) {
    container.innerHTML = window.DgSkeletons.adminTeamEditorCards(3);
  } else {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px;">
        <i data-lucide="loader-2" class="dg-spin" style="width: 40px; height: 40px; color: var(--dg-primary);"></i>
        <p style="margin-top: 16px;">กำลังโหลดข้อมูลคณะกรรมการและฐานข้อมูลนักเรียน...</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // Load student directory first
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
            try {
              localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
            } catch (e) {}
          }
        }
      }
    }
  } catch (err) {
    console.warn('Backend team API unavailable, using local backup:', err.message);
  }

  if (!loadedOnline) {
    try {
      const local = localStorage.getItem('dg_sarawat_team_members');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) allMembers = parsed;
      }
    } catch (e) {
      allMembers = [];
    }
  }

  // Ensure president has default data seeded if missing
  let p = allMembers.find(m => m.role === 'ประธาน');
  if (!p) {
    const defaultPres = studentDirectory.find(s => s.rank === 'ประธาน') || { name: 'นายอะห์นัฟ สหสันติวรกุล', grade: '5/1', order_no: 67 };
    p = {
      id: 'pres_main',
      order_no: defaultPres.order_no || 67,
      student_id: defaultPres.order_no || 67,
      name: defaultPres.name,
      role: 'ประธาน',
      department: 'ชั้นมัธยมศึกษาปีที่ ' + defaultPres.grade,
      imageUrl: '',
      homeImageUrl: '',
      teamImageUrl: ''
    };
    allMembers.unshift(p);
  } else {
    if (p.imageUrl === 'assets/images/president.jpg') p.imageUrl = '';
    if (!p.homeImageUrl) p.homeImageUrl = p.imageUrl || '';
    if (!p.teamImageUrl) p.teamImageUrl = p.imageUrl || '';
  }

  renderTeamAdminUI();
}
window.loadTeamAdmin = loadTeamAdmin;

/**
 * Generate Student Dropdown Options for selecting who holds which position
 */
function buildStudentSelectOptions(selectedName, selectedOrderNo) {
  let html = `<option value="">-- เลือกจากฐานข้อมูล (${studentDirectory.length} คน) --</option>`;
  studentDirectory.forEach(s => {
    const cleanSName = s.name.replace(/\s+/g, '');
    const cleanCurName = (selectedName || '').replace(/\s+/g, '');
    const isSelected = (selectedOrderNo && String(s.order_no) === String(selectedOrderNo)) || (cleanCurName && cleanSName === cleanCurName);
    const rankLabel = s.rank ? ` • ${s.rank}` : '';
    html += `<option value="${s.order_no}" ${isSelected ? 'selected' : ''} data-name="${escapeHtml(s.name)}" data-grade="${escapeHtml(s.grade)}" data-rank="${escapeHtml(s.rank || '')}">#${s.order_no} | ${escapeHtml(s.name)} (ม.${escapeHtml(s.grade)})${escapeHtml(rankLabel)}</option>`;
  });
  return html;
}

/**
 * Handle student selection from dropdown
 */
function selectStudentForPosition(id, orderNoStr) {
  if (!orderNoStr) return;
  const orderNo = parseInt(orderNoStr, 10);
  const student = studentDirectory.find(s => s.order_no === orderNo);
  if (!student) return;

  let m = allMembers.find(x => x.id === id);
  if (!m) {
    m = { id, name: '', role: '', department: '', imageUrl: '' };
    allMembers.push(m);
  }

  m.name = student.name;
  m.order_no = student.order_no;
  m.student_id = student.order_no;

  // Set appropriate department/grade description
  if (m.role === 'ประธาน') {
    m.department = 'ชั้นมัธยมศึกษาปีที่ ' + student.grade;
  } else if (m.role === 'รองประธาน') {
    m.department = 'รองประธาน (ม.' + student.grade + ')';
  } else if (m.role === 'เลขานุการ') {
    m.department = 'ฝ่ายเลขานุการ (ม.' + student.grade + ')';
  } else if (m.role === 'หัวหน้าฝ่าย') {
    // Keep fixed department name
  } else {
    if (!m.department || m.department === 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน') {
      m.department = 'สมาชิกทั่วไป (ม.' + student.grade + ')';
    }
  }

  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
  } catch (e) {}

  renderTeamAdminUI();
  if (window.showToast) window.showToast(`เลือก "${student.name}" (ม.${student.grade}) เรียบร้อยแล้ว`, 'success');
}
window.selectStudentForPosition = selectStudentForPosition;

/**
 * Reset all board positions based on SQLite 143 database defaults
 */
async function resetToSqliteDefaults() {
  if (typeof Swal !== 'undefined') {
    const result = await Swal.fire({
      title: 'รีเซ็ตตำแหน่งตามฐานข้อมูล?',
      text: 'ระบบจะนำตำแหน่ง (ประธาน, รองประธาน, เลขานุการ, ฝ่ายต่าง ๆ) จากฐานข้อมูล SQLite 143 คนมาตั้งเป็นค่าเริ่มต้นใหม่ โดยยังคงรูปภาพที่เคยอัปโหลดไว้',
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
    if (!confirm('ยืนยันรีเซ็ตตำแหน่งตามฐานข้อมูล SQLite 143 คนหรือไม่?')) return;
  }

  // Preserve existing uploaded images by clean name
  const existingImagesByName = new Map();
  allMembers.forEach(m => {
    if (m.name && (m.imageUrl || m.homeImageUrl || m.teamImageUrl)) {
      existingImagesByName.set(m.name.replace(/\s+/g, ''), {
        imageUrl: m.imageUrl || '',
        homeImageUrl: m.homeImageUrl || '',
        teamImageUrl: m.teamImageUrl || ''
      });
    }
  });

  const students = studentDirectory;
  if (!students || students.length === 0) {
    if (window.showToast) window.showToast('ไม่สามารถดึงข้อมูลนักเรียนได้', 'error');
    return;
  }

  const newMembers = [];

  // President
  const pres = students.find(s => s.rank === 'ประธาน');
  if (pres) {
    const imgs = existingImagesByName.get(pres.name.replace(/\s+/g, '')) || {};
    newMembers.push({
      id: 'pres_' + pres.order_no,
      student_id: pres.order_no,
      order_no: pres.order_no,
      name: pres.name,
      role: 'ประธาน',
      department: 'ชั้นมัธยมศึกษาปีที่ ' + pres.grade,
      imageUrl: imgs.imageUrl || '',
      homeImageUrl: imgs.homeImageUrl || '',
      teamImageUrl: imgs.teamImageUrl || ''
    });
  }

  // Vice Presidents
  const vps = students.filter(s => s.rank === 'รองประธาน');
  vps.forEach((vp, idx) => {
    const imgs = existingImagesByName.get(vp.name.replace(/\s+/g, '')) || {};
    newMembers.push({
      id: 'vp_' + vp.order_no,
      student_id: vp.order_no,
      order_no: vp.order_no,
      name: vp.name,
      role: 'รองประธาน',
      department: 'รองประธานคนที่ ' + (idx + 1) + ' (ม.' + vp.grade + ')',
      imageUrl: imgs.imageUrl || '',
      homeImageUrl: '',
      teamImageUrl: ''
    });
  });

  // Secretaries
  const secs = students.filter(s => s.rank === 'เลขานุการ');
  secs.forEach(sec => {
    const imgs = existingImagesByName.get(sec.name.replace(/\s+/g, '')) || {};
    newMembers.push({
      id: 'sec_' + sec.order_no,
      student_id: sec.order_no,
      order_no: sec.order_no,
      name: sec.name,
      role: 'เลขานุการ',
      department: 'ฝ่ายเลขานุการ (ม.' + sec.grade + ')',
      imageUrl: imgs.imageUrl || '',
      homeImageUrl: '',
      teamImageUrl: ''
    });
  });

  // Fixed Departments
  const deptRankMap = [
    { dept: 'ฝ่ายเอกสาร', rank: 'ฝ่ายเอกสาร' },
    { dept: 'ฝ่ายโสตทัศนศิลป์', rank: 'ฝ่ายโสตฯ' },
    { dept: 'ฝ่ายสารวัตรพยาบาล', rank: 'ฝ่ายสารวัตรพยาบาล' },
    { dept: 'ฝ่ายการเงิน', rank: 'ฝ่ายการเงิน' },
    { dept: 'ฝ่ายกิจกรรม', rank: 'ฝ่ายกิจกรรม' },
    { dept: 'ฝ่ายอุปกรณ์และ IT', rank: 'ฝ่ายอุปกรณ์และ IT' },
    { dept: 'ฝ่ายวินัย', rank: 'ฝ่ายวินัย' }
  ];

  deptRankMap.forEach(({ dept, rank }) => {
    const deptStudents = students.filter(s => s.rank === rank);
    if (deptStudents.length > 0) {
      const head = deptStudents[0];
      const headImgs = existingImagesByName.get(head.name.replace(/\s+/g, '')) || {};
      newMembers.push({
        id: 'head_' + head.order_no,
        student_id: head.order_no,
        order_no: head.order_no,
        name: head.name,
        role: 'หัวหน้าฝ่าย',
        department: dept,
        imageUrl: headImgs.imageUrl || '',
        homeImageUrl: '',
        teamImageUrl: ''
      });

      for (let i = 1; i < deptStudents.length; i++) {
        const m = deptStudents[i];
        const mImgs = existingImagesByName.get(m.name.replace(/\s+/g, '')) || {};
        newMembers.push({
          id: 'dept_mem_' + m.order_no,
          student_id: m.order_no,
          order_no: m.order_no,
          name: m.name,
          role: 'สมาชิก' + dept,
          department: dept,
          imageUrl: mImgs.imageUrl || '',
          homeImageUrl: '',
          teamImageUrl: ''
        });
      }
    }
  });

  // General Members
  const generalMembers = students.filter(s => s.rank === 'สมาชิกทั่วไป');
  generalMembers.forEach(gm => {
    newMembers.push({
      id: 'mem_' + gm.order_no,
      student_id: gm.order_no,
      order_no: gm.order_no,
      name: gm.name,
      role: 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน',
      department: 'สมาชิกทั่วไป (ม.' + gm.grade + ')',
      imageUrl: '',
      homeImageUrl: '',
      teamImageUrl: ''
    });
  });

  allMembers = newMembers;
  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
  } catch (e) {}

  renderTeamAdminUI();
  if (window.showToast) window.showToast('รีเซ็ตรายชื่อตำแหน่งตามฐานข้อมูลเรียบร้อยแล้ว', 'success');
}
window.resetToSqliteDefaults = resetToSqliteDefaults;

function renderTeamAdminUI() {
  const container = document.getElementById('teamAdminContainer');
  if (!container) return;

  const countBadge = document.getElementById('teamCountBadge');
  const activeTotal = allMembers.filter(m => m.name && m.name.trim() !== '').length;
  if (countBadge) {
    countBadge.innerHTML = `<i class="fa-solid fa-users"></i> ${activeTotal} สมาชิก`;
  }

  let filtered = allMembers;
  if (teamMemberSearchTerm) {
    filtered = allMembers.filter(m => 
      (m.name && m.name.toLowerCase().includes(teamMemberSearchTerm)) ||
      (m.role && m.role.toLowerCase().includes(teamMemberSearchTerm)) ||
      (m.department && m.department.toLowerCase().includes(teamMemberSearchTerm))
    );
  }

  let presidents = filtered.filter(m => m.role === 'ประธาน');
  if (presidents.length === 0 && !teamMemberSearchTerm) {
    let p = allMembers.find(m => m.role === 'ประธาน');
    if (!p) {
      p = { id: 'new_p', name: '', role: 'ประธาน', department: '', imageUrl: '' };
      allMembers.push(p);
    }
    presidents.push(p);
  }

  let vps = filtered.filter(m => m.role === 'รองประธาน');
  let secs = filtered.filter(m => m.role === 'เลขานุการ');
  let heads = filtered.filter(m => m.role === 'หัวหน้าฝ่าย');
  let members = filtered.filter(m => m.role === 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน' || (!['ประธาน', 'รองประธาน', 'เลขานุการ', 'หัวหน้าฝ่าย'].includes(m.role) && !m.role.startsWith('สมาชิกฝ่าย')));

  let html = `
    <style>
      .team-edit-card { background: #fff; border: 1px solid var(--dg-border); border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
      .team-edit-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--dg-border); padding-bottom: 16px; margin-bottom: 20px; }
      .team-edit-title { font-weight: 700; font-size: 1.1rem; color: var(--dg-primary); margin: 0; }
      .team-grid { display: grid; grid-template-columns: 140px 1fr; gap: 24px; align-items: start; }
      .team-img-col { text-align: center; }
      .team-preview-img { width: 140px; aspect-ratio: 4 / 5; border-radius: 10px; object-fit: cover; background: var(--dg-bg-subtle); border: 1px dashed var(--dg-border); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; overflow: hidden; }
      .team-preview-img img { width: 100%; height: 100%; object-fit: cover; }
      .team-preview-img i { color: #cbd5e1; width: 44px; height: 44px; }
      
      .team-table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .team-table th, .team-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--dg-border); }
      .team-table th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.9rem; }
      .team-table tr:hover { background: #f1f5f9; }

      .student-picker-wrap { margin-bottom: 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px 14px; }
      .student-picker-label { font-size: 0.84rem; font-weight: 700; color: #166534; display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
      .student-picker-select { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1.5px solid #86efac; background: #ffffff; font-family: inherit; font-size: 0.9rem; color: #0f172a; outline: none; }
      .student-picker-select:focus { border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15); }
      .student-matched-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.76rem; font-weight: 600; padding: 3px 10px; border-radius: 9999px; background: #dcfce7; color: #15803d; }
    </style>

    <!-- TOP TOOLBAR: Quick Sync & Status -->
    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-weight: 700; font-size: 0.95rem; color: #0f172a;">
          <i data-lucide="database" style="width: 18px; height: 18px; color: #10b981; vertical-align: middle; margin-right: 4px;"></i>
          ฐานข้อมูลสารวัตรนักเรียน SQLite: <strong>${studentDirectory.length} รายชื่อ</strong>
        </span>
        <span class="student-matched-badge">
          <i data-lucide="check" style="width: 12px; height: 12px;"></i> เชื่อมต่อ 100%
        </span>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" class="dg-btn-white" onclick="resetToSqliteDefaults()" style="font-size: 0.88rem; padding: 8px 16px; border-color: #cbd5e1;" title="นำตำแหน่ง ยศ จากฐานข้อมูล 143 คนมาตั้งเป็นค่าเริ่มต้น">
          <i data-lucide="rotate-ccw" style="width: 14px; height: 14px; margin-right: 6px;"></i>
          <span>รีเซ็ตตำแหน่งจาก SQLite</span>
        </button>
      </div>
    </div>
  `;

  // --- Search Notice if no results ---
  if (teamMemberSearchTerm && filtered.length === 0) {
    html += `
      <div style="text-align: center; padding: 60px; color: var(--dg-text-muted); background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1; margin-bottom: 24px;">
        <i data-lucide="search-x" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 12px; display: inline-block;"></i>
        <div style="font-weight: 700; font-size: 1rem; color: #475569;">ไม่พบสมาชิกตรงกับคำค้นหา "${escapeHtml(teamMemberSearchTerm)}"</div>
        <div style="font-size: 0.85rem; margin-top: 4px;">ลองค้นหาด้วยชื่ออื่น หรือสังกัดฝ่าย</div>
      </div>
    `;
  }

  // --- President (Dual Customizable Images: Home & Team) ---
  if (presidents.length > 0) {
    html += buildPresidentEditorCard(presidents[0]);
  }

  // --- Vice Presidents ---
  if (!teamMemberSearchTerm || vps.length > 0) {
    html += `
      <div class="team-edit-card" style="background: var(--dg-bg-subtle); border: none;">
        <div class="team-edit-header" style="border-bottom-color: rgba(0,0,0,0.05);">
          <h3 class="team-edit-title">รองประธานคณะกรรมการ</h3>
          <button class="dg-btn-white" onclick="addExecutive('รองประธาน')" style="padding: 6px 16px; font-size: 0.9rem;">+ เพิ่มรองประธาน</button>
        </div>
        <div>
    `;
    vps.forEach((vp, idx) => {
      html += buildEditorCard(vp, 'รองประธานคนที่ ' + (idx + 1), 'รองประธาน', true);
    });
    if (vps.length === 0) html += `<p style="text-align:center; color: #64748b; font-size: 0.9rem;">ยังไม่มีรองประธาน</p>`;
    html += `</div></div>`;
  }

  // --- Secretaries ---
  if (!teamMemberSearchTerm || secs.length > 0) {
    html += `
      <div class="team-edit-card" style="background: var(--dg-bg-subtle); border: none;">
        <div class="team-edit-header" style="border-bottom-color: rgba(0,0,0,0.05);">
          <h3 class="team-edit-title">ฝ่ายเลขานุการ</h3>
          <button class="dg-btn-white" onclick="addExecutive('เลขานุการ')" style="padding: 6px 16px; font-size: 0.9rem;">+ เพิ่มเลขานุการ</button>
        </div>
        <div>
    `;
    secs.forEach(sec => {
      html += buildEditorCard(sec, 'เลขานุการ', 'เลขานุการ', true);
    });
    if (secs.length === 0) {
      html += `<p style="text-align:center; color: #64748b; font-size: 0.9rem;">ยังไม่มีเลขานุการ</p>`;
    }
    html += `</div></div>`;
  }

  // --- Department Heads ---
  const fixedDepts = ['ฝ่ายเอกสาร', 'ฝ่ายโสตทัศนศิลป์', 'ฝ่ายสารวัตรพยาบาล', 'ฝ่ายการเงิน', 'ฝ่ายกิจกรรม', 'ฝ่ายอุปกรณ์และ IT', 'ฝ่ายวินัย'];
  const matchedDepts = fixedDepts.filter(dept => {
    if (!teamMemberSearchTerm) return true;
    return filtered.some(m => (m.role === 'หัวหน้าฝ่าย' || m.department === dept) && m.department === dept);
  });

  if (matchedDepts.length > 0) {
    html += `
      <div class="team-edit-card" style="background: #f8fafc; border: none;">
        <div class="team-edit-header" style="border-bottom-color: rgba(0,0,0,0.05);">
          <div>
            <h3 class="team-edit-title">หัวหน้าฝ่ายและคณะทำงานต่าง ๆ</h3>
            <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">แสดงรูปภาพหัวหน้าฝ่าย 1 คน พร้อมรายชื่อสมาชิกคณะทำงานประจำฝ่าย</div>
          </div>
        </div>
        <div>
    `;
    matchedDepts.forEach(dept => {
      let deptHeads = filtered.filter(m => m.role === 'หัวหน้าฝ่าย' && m.department === dept);

      if (deptHeads.length === 0 && !teamMemberSearchTerm) {
        const h = { id: 'head_' + Date.now() + '_' + Math.random(), name: '', role: 'หัวหน้าฝ่าย', department: dept, imageUrl: '' };
        allMembers.push(h);
        deptHeads.push(h);
      }

      const displayTitle = 'หัวหน้า' + dept;
      deptHeads.forEach(h => {
        html += buildEditorCard(h, displayTitle, h.role, false, true, dept);
      });
    });
    html += `</div></div>`;
  }

  // --- General Members Table ---
  html += `
    <div class="team-edit-card">
      <div class="team-edit-header">
        <div>
          <h3 class="team-edit-title">สมาชิกทั่วไป (${members.length} คน)</h3>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">รายชื่อสมาชิกสารวัตรนักเรียนทั้งหมดในฐานข้อมูล SQLite</div>
        </div>
        <button class="dg-btn-black" onclick="openMemberModal()">
          <i data-lucide="plus"></i> <span>เพิ่มสมาชิกใหม่</span>
        </button>
      </div>
      <table class="team-table">
        <thead>
          <tr>
            <th style="width: 80px; text-align: center;">ลำดับ</th>
            <th>ชื่อ-นามสกุล</th>
            <th>ระดับชั้น / สังกัด</th>
            <th style="width: 150px; text-align: center;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
  `;
  members.forEach((m, idx) => {
    const studentMatch = studentDirectory.find(s => s.name.replace(/\s+/g, '') === (m.name || '').replace(/\s+/g, ''));
    const orderDisplay = m.order_no || (studentMatch ? studentMatch.order_no : idx + 1);
    html += `
      <tr>
        <td style="text-align: center; font-weight: 600; color: #64748b;">#${orderDisplay}</td>
        <td style="font-weight: 600; color: #0f172a;">${escapeHtml(m.name)}</td>
        <td style="color: #475569;">${escapeHtml(m.department || (studentMatch ? 'ม.' + studentMatch.grade : '-'))}</td>
        <td style="text-align: center;">
          <button class="dg-btn-white" style="padding: 6px 10px; font-size: 0.8rem;" onclick="openMemberModal('${m.id}')">แก้ไข</button>
          <button class="dg-btn-white" style="padding: 6px 10px; font-size: 0.8rem; color: #ef4444;" onclick="deleteMember('${m.id}')">ลบ</button>
        </td>
      </tr>
    `;
  });
  if (members.length === 0) html += `<tr><td colspan="4" style="text-align:center; padding:20px; color:#64748b;">ไม่มีข้อมูลสมาชิก</td></tr>`;
  html += `
        </tbody>
      </table>
    </div>

    <!-- MAIN SAVE BUTTON -->
    <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
      <button class="dg-btn-black" onclick="saveTeamSettings()" style="font-size: 1.1rem; padding: 14px 40px; border-radius: 50px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
        <i data-lucide="save" style="margin-right: 8px;"></i>
        <span>บันทึกข้อมูลคณะทำงานทั้งหมด</span>
      </button>
    </div>

    <!-- Modal for Members -->
    <div class="modal-overlay" id="memberModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.62); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 9500; display: none; align-items: center; justify-content: center; padding: 16px;">
      <div class="dg-modal-box" style="width: 100%; max-width: 480px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(15,23,42,0.25); background: #fff;">
        <div class="dg-modal-header" style="padding: 18px 22px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="dg-modal-header-icon" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #fff; width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
              <i data-lucide="user" style="width: 18px; height: 18px;"></i>
            </div>
            <div>
              <h3 id="modalTitle" style="margin: 0; font-size: 1.12rem; font-weight: 700; color: #0f172a;">สมาชิก</h3>
              <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">เลือกรายชื่อจากฐานข้อมูลหรือระบุเอง</div>
            </div>
          </div>
          <button type="button" class="dg-modal-close" onclick="document.getElementById('memberModal').style.display='none'" title="ปิดหน้าต่าง" style="background: none; border: none; cursor: pointer; color: #64748b;">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>

        <div style="padding: 22px;">
          <input type="hidden" id="modalMemberId" />

          <!-- Quick Selector from SQLite -->
          <div class="student-picker-wrap">
            <div class="student-picker-label">
              <i data-lucide="search" style="width: 14px; height: 14px;"></i>
              <span>เลือกจากฐานข้อมูลนักเรียน (${studentDirectory.length} คน)</span>
            </div>
            <select class="student-picker-select" id="modalStudentSelect" onchange="onModalStudentSelect(this.value)">
              ${buildStudentSelectOptions('', '')}
            </select>
          </div>
          
          <div class="dg-form-group" style="margin-bottom: 14px;">
            <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">ชื่อ-นามสกุล <span style="color: #ef4444;">*</span></label>
            <input type="text" class="recruit-input" id="modalName" placeholder="เช่น นายสมชาย ใจดี" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />
          </div>

          <div class="dg-form-group" style="margin-bottom: 14px;">
            <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">กลุ่มตำแหน่ง</label>
            <select class="recruit-select" id="modalRole" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
              <option value="ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน">สมาชิกทั่วไป</option>
              <option value="หัวหน้าฝ่าย">หัวหน้าฝ่าย (จะแสดงในส่วนการ์ด)</option>
              <option value="รองประธาน">รองประธาน (จะแสดงในส่วนการ์ด)</option>
              <option value="เลขานุการ">เลขานุการ (จะแสดงในส่วนการ์ด)</option>
              <option value="ประธาน">ประธาน</option>
            </select>
          </div>

          <div class="dg-form-group" style="margin-bottom: 6px;">
            <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">สังกัดฝ่าย / ระดับชั้น</label>
            <input type="text" class="recruit-input" id="modalDept" placeholder="เช่น ฝ่ายเอกสาร, ชั้นมัธยมศึกษาปีที่ 4/1" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />
          </div>
        </div>

        <div class="dg-modal-actions" style="padding: 14px 22px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="btn-step-prev" style="padding: 10px 18px; border-radius: 8px; font-size: 0.88rem; border: 1px solid #cbd5e1; background: #fff;" onclick="document.getElementById('memberModal').style.display='none'">ยกเลิก</button>
          <button type="button" class="dg-btn-black" style="padding: 10px 24px; border-radius: 8px; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px;" onclick="saveMemberModal()">
            <i data-lucide="check" style="width: 15px; height: 15px;"></i>
            <span>บันทึกข้อมูล</span>
          </button>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
  if (window.lucide) window.lucide.createIcons();
}

function onModalStudentSelect(orderNoStr) {
  if (!orderNoStr) return;
  const orderNo = parseInt(orderNoStr, 10);
  const student = studentDirectory.find(s => s.order_no === orderNo);
  if (!student) return;

  document.getElementById('modalName').value = student.name;
  const deptInput = document.getElementById('modalDept');
  if (deptInput && (!deptInput.value || deptInput.value.startsWith('ม.') || deptInput.value.startsWith('สมาชิก'))) {
    deptInput.value = 'ม.' + student.grade + (student.rank && student.rank !== 'สมาชิกทั่วไป' ? ` (${student.rank})` : '');
  }
}
window.onModalStudentSelect = onModalStudentSelect;

function buildPresidentEditorCard(data) {
  if (!data.id) data.id = 'pres_main';
  const id = data.id;

  const homeImg = data.homeImageUrl || data.imageUrl || '';
  const teamImg = data.teamImageUrl || data.imageUrl || '';

  const resolveUrl = (url) => {
    if (!url) return '';
    if (window.resolveImageUrl) return window.resolveImageUrl(url);
    if (url.startsWith('/')) {
      const base = (window.SarawatApi && window.SarawatApi.getBaseUrl) ? window.SarawatApi.getBaseUrl() : '';
      return base + url;
    }
    return url;
  };

  const homeResolved = resolveUrl(homeImg);
  const teamResolved = resolveUrl(teamImg);

  const homeImgContent = homeResolved ? 
    `<img src="${homeResolved}" id="img_preview_${id}_home" style="width: 100%; height: 100%; object-fit: cover;" />` : 
    `<i data-lucide="user" id="img_icon_${id}_home" style="color: #cbd5e1; width: 44px; height: 44px;"></i><img id="img_preview_${id}_home" style="display:none; width: 100%; height: 100%; object-fit: cover;" />`;

  const teamImgContent = teamResolved ? 
    `<img src="${teamResolved}" id="img_preview_${id}_team" style="width: 100%; height: 100%; object-fit: cover;" />` : 
    `<i data-lucide="user" id="img_icon_${id}_team" style="color: #cbd5e1; width: 44px; height: 44px;"></i><img id="img_preview_${id}_team" style="display:none; width: 100%; height: 100%; object-fit: cover;" />`;

  const studentMatch = studentDirectory.find(s => s.name.replace(/\s+/g, '') === (data.name || '').replace(/\s+/g, ''));
  const matchBadge = studentMatch ? 
    `<span class="student-matched-badge"><i data-lucide="check" style="width:12px; height:12px;"></i> เชื่อมโยง SQLite #ลำดับที่ ${studentMatch.order_no} (ม.${studentMatch.grade})</span>` : '';

  return `
    <div class="team-edit-card" style="background: #fff; border: 1.5px solid #cbd5e1; border-radius: 16px; padding: 26px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 30px;">
      <div class="team-edit-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--dg-border); padding-bottom: 16px; margin-bottom: 22px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="background: #0f172a; color: #fff; width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem;">
            <i data-lucide="crown" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h4 style="margin: 0; font-weight: 700; font-size: 1.15rem; color: #0f172a;">ประธานคณะกรรมการสารวัตรนักเรียน</h4>
              ${matchBadge}
            </div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">ตำแหน่งสูงสุด • เลือกระบุตัวบุคคลจากฐานข้อมูล และตั้งค่ารูปภาพแยก 2 หน้าเว็บ</div>
          </div>
        </div>
        <span style="font-size: 0.76rem; font-weight: 700; background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 9999px;">
          อัตราส่วน 4:5
        </span>
      </div>

      <!-- Quick Student Picker from SQLite Database -->
      <div class="student-picker-wrap">
        <div class="student-picker-label">
          <i data-lucide="user-check" style="width: 15px; height: 15px;"></i>
          <span>เลือกระบุตัวบุคคลผู้ดำรงตำแหน่งประธานจากฐานข้อมูลนักเรียน (ดึงลำดับ, ชื่อ, ชั้น, ตำแหน่งเดิมอัตโนมัติ)</span>
        </div>
        <select class="student-picker-select" onchange="selectStudentForPosition('${id}', this.value)">
          ${buildStudentSelectOptions(data.name, data.order_no)}
        </select>
      </div>

      <!-- General Info: Name, Role, Dept -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; background: #f8fafc; padding: 18px; border-radius: 12px; border: 1px solid #e2e8f0;">
        <div class="dg-form-group" style="margin-bottom: 0;">
          <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">ชื่อ - นามสกุลประธาน <span style="color: #ef4444;">*</span></label>
          <input type="text" class="dg-input" id="name_${id}" value="${escapeHtml(data.name || '')}" placeholder="ระบุชื่อ-นามสกุล..." onchange="updateMemberData('${id}', 'name')" style="background: #fff; width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />
        </div>
        <div class="dg-form-group" style="margin-bottom: 0;">
          <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">กลุ่มตำแหน่ง</label>
          <input type="text" class="dg-input" value="ประธานคณะกรรมการสารวัตรนักเรียน" disabled style="background: #e2e8f0; color: #475569; font-weight: 600; width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />
        </div>
        <div class="dg-form-group" style="margin-bottom: 0;">
          <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">ระดับชั้น / สังกัด</label>
          <input type="text" class="dg-input" id="dept_${id}" value="${escapeHtml(data.department || '')}" placeholder="เช่น ชั้นมัธยมศึกษาปีที่ 5/1" onchange="updateMemberData('${id}', 'department')" style="background: #fff; width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />
        </div>
      </div>

      <!-- Dual Photo Customization Box -->
      <div style="border-top: 1px dashed #cbd5e1; padding-top: 20px;">
        <div style="margin-bottom: 16px;">
          <div style="font-weight: 700; font-size: 0.98rem; color: #0f172a; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="image" style="width: 18px; height: 18px; color: var(--dg-primary);"></i>
            <span>กำหนดรูปภาพประธาน (แยกอิสระ 2 หน้า)</span>
          </div>
          <div style="font-size: 0.82rem; color: #64748b; margin-top: 2px;">
            สามารถอัปโหลดรูปภาพที่เหมาะสมสำหรับแต่ละหน้าได้อย่างอิสระ ทั้งสองรูปจะถูกแสดงผลด้วยอัตราส่วน 4:5 โดยอัตโนมัติ
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
          
          <!-- Box 1: Home Page Photo -->
          <div style="background: #f8fafc; border: 1.5px solid ${homeImg ? '#93c5fd' : '#e2e8f0'}; border-radius: 14px; padding: 18px; text-align: center; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-weight: 700; font-size: 0.88rem; color: #1e3a8a; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="home" style="width: 15px; height: 15px;"></i> 1. รูปภาพหน้าหลัก (index.html)
              </span>
              <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; font-weight: 600;">
                วิสัยทัศน์ประธาน
              </span>
            </div>
            
            <div style="width: 140px; aspect-ratio: 4 / 5; border-radius: 12px; margin: 0 auto 14px; background: #fff; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
              ${homeImgContent}
            </div>

            <input type="file" id="file_${id}_home" accept="image/*" style="display: none;" onchange="handleImageSelect('${id}', 'home')" />
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button type="button" class="dg-btn-black" style="padding: 7px 16px; font-size: 0.84rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px;" onclick="document.getElementById('file_${id}_home').click()">
                <i data-lucide="upload" style="width: 14px; height: 14px;"></i>
                <span>${homeImg ? 'เปลี่ยนรูปหน้าหลัก' : 'อัปโหลดรูปหน้าหลัก'}</span>
              </button>
              ${homeImg ? `
                <button type="button" class="dg-btn-white" style="padding: 7px 12px; font-size: 0.84rem; color: #ef4444; border-color: #fecaca; border-radius: 8px;" onclick="removeImage('${id}', 'home')" title="ลบรูปภาพ">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              ` : ''}
            </div>
            <div style="font-size: 0.76rem; color: #64748b; margin-top: 10px;">
              ใช้แสดงในคอลัมน์รูปภาพส่วน "วิสัยทัศน์ประธาน" บนหน้าแรก
            </div>
          </div>

          <!-- Box 2: Team Page Photo -->
          <div style="background: #f8fafc; border: 1.5px solid ${teamImg ? '#c4b5fd' : '#e2e8f0'}; border-radius: 14px; padding: 18px; text-align: center; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-weight: 700; font-size: 0.88rem; color: #5b21b6; display: flex; align-items: center; gap: 6px;">
                <i data-lucide="users" style="width: 15px; height: 15px;"></i> 2. รูปภาพหน้าคณะทำงาน (team.html)
              </span>
              <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 4px; background: #f3e8ff; color: #7e22ce; font-weight: 600;">
                ทำเนียบคณะบริหาร
              </span>
            </div>
            
            <div style="width: 140px; aspect-ratio: 4 / 5; border-radius: 12px; margin: 0 auto 14px; background: #fff; border: 1px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
              ${teamImgContent}
            </div>

            <input type="file" id="file_${id}_team" accept="image/*" style="display: none;" onchange="handleImageSelect('${id}', 'team')" />
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button type="button" class="dg-btn-black" style="padding: 7px 16px; font-size: 0.84rem; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px;" onclick="document.getElementById('file_${id}_team').click()">
                <i data-lucide="upload" style="width: 14px; height: 14px;"></i>
                <span>${teamImg ? 'เปลี่ยนรูปคณะทำงาน' : 'อัปโหลดรูปคณะทำงาน'}</span>
              </button>
              ${teamImg ? `
                <button type="button" class="dg-btn-white" style="padding: 7px 12px; font-size: 0.84rem; color: #ef4444; border-color: #fecaca; border-radius: 8px;" onclick="removeImage('${id}', 'team')" title="ลบรูปภาพ">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              ` : ''}
            </div>
            <div style="font-size: 0.76rem; color: #64748b; margin-top: 10px;">
              ใช้แสดงเป็นการ์ดทำเนียบประธานขนาดใหญ่สุดในหน้าคณะทำงาน
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

function buildEditorCard(data, title, expectedRole, canDelete = false, isFixed = false, deptName = '') {
  if (!data.id) data.id = 'new_' + Date.now() + Math.random();
  const id = data.id;

  const resolveUrl = (url) => {
    if (!url) return '';
    if (window.resolveImageUrl) return window.resolveImageUrl(url);
    if (url.startsWith('/')) {
      const base = (window.SarawatApi && window.SarawatApi.getBaseUrl) ? window.SarawatApi.getBaseUrl() : '';
      return base + url;
    }
    return url;
  };

  const resolvedImg = resolveUrl(data.imageUrl);

  const imgContent = resolvedImg ? 
    `<img src="${resolvedImg}" id="img_preview_${id}" style="width: 100%; height: 100%; object-fit: cover;" />` : 
    `<i data-lucide="user" id="img_icon_${id}" style="color: #cbd5e1; width: 44px; height: 44px;"></i><img id="img_preview_${id}" style="display:none; width: 100%; height: 100%; object-fit: cover;" />`;

  const deleteBtn = canDelete ? 
    `<button class="dg-btn-white" style="color: #ef4444; border-color: #fecaca; padding: 6px 12px; font-size: 0.85rem;" onclick="deleteMember('${id}')"><i data-lucide="trash-2" style="width: 14px; height: 14px; margin-right: 4px;"></i>ลบ</button>` : '';

  const studentMatch = studentDirectory.find(s => s.name.replace(/\s+/g, '') === (data.name || '').replace(/\s+/g, ''));
  const matchBadge = studentMatch ? 
    `<span class="student-matched-badge"><i data-lucide="check" style="width:12px; height:12px;"></i> SQLite #ลำดับที่ ${studentMatch.order_no} (ม.${studentMatch.grade})</span>` : '';

  // Render department members if this is a Department Head card
  const deptMembersSection = isFixed && deptName ? buildDepartmentMembersSection(deptName) : '';

  return `
    <div class="team-edit-card" style="background: #fff; margin-bottom: 24px;">
      <div class="team-edit-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <h4 style="margin:0; font-weight: 700; font-size: 1.05rem; color: #0f172a;">${title}</h4>
          ${matchBadge}
        </div>
        ${deleteBtn}
      </div>

      <!-- Quick Selector from Database -->
      <div class="student-picker-wrap">
        <div class="student-picker-label">
          <i data-lucide="user-check" style="width: 14px; height: 14px;"></i>
          <span>เลือกผู้ดำรงตำแหน่งจากฐานข้อมูล (แสดง: ลำดับ, ชื่อ, ชั้น, ตำแหน่งเดิม)</span>
        </div>
        <select class="student-picker-select" onchange="selectStudentForPosition('${id}', this.value)">
          ${buildStudentSelectOptions(data.name, data.order_no)}
        </select>
      </div>

      <div class="team-grid">
        <div class="team-img-col">
          <div class="team-preview-img">
            ${imgContent}
          </div>
          <input type="file" id="file_${id}" accept="image/*" style="display: none;" onchange="handleImageSelect('${id}')" />
          <button class="dg-btn-white" style="width: 100%; padding: 6px; font-size: 0.85rem;" onclick="document.getElementById('file_${id}').click()">
            <i data-lucide="upload" style="width: 13px; height: 13px; margin-right: 4px;"></i>
            <span>${resolvedImg ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}</span>
          </button>
          ${resolvedImg ? `<button class="dg-btn-white" style="width: 100%; padding: 6px; font-size: 0.85rem; margin-top: 6px; color: #ef4444;" onclick="removeImage('${id}')">ลบรูป</button>` : ''}
        </div>
        <div>
          <div class="dg-form-group" style="margin-bottom: 12px;">
            <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">ชื่อ - นามสกุล ${!data.name ? '<span style="color:#f59e0b; font-size:0.8rem; font-weight:normal; margin-left: 8px;">(ยังไม่ได้ระบุ)</span>' : ''}</label>
            <input type="text" class="dg-input" id="name_${id}" value="${escapeHtml(data.name || '')}" placeholder="ระบุชื่อ-นามสกุล..." onchange="updateMemberData('${id}', 'name')" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="dg-form-group" style="margin-bottom: 0;">
              <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">กลุ่มตำแหน่ง</label>
              ${isFixed ? 
                `<input type="text" class="dg-input" value="${data.role}" disabled style="background: #f1f5f9; color: #64748b; font-weight: 600; width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />` : 
                `<select class="dg-input" id="role_${id}" onchange="updateMemberData('${id}', 'role')" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;">
                  <option value="ประธาน" ${data.role === 'ประธาน' ? 'selected' : ''}>ประธาน</option>
                  <option value="รองประธาน" ${data.role === 'รองประธาน' ? 'selected' : ''}>รองประธาน</option>
                  <option value="เลขานุการ" ${data.role === 'เลขานุการ' ? 'selected' : ''}>เลขานุการ</option>
                  <option value="หัวหน้าฝ่าย" ${data.role === 'หัวหน้าฝ่าย' ? 'selected' : ''}>หัวหน้าฝ่าย</option>
                  <option value="ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน" ${data.role === 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน' ? 'selected' : ''}>สมาชิกทั่วไป</option>
                </select>`
              }
            </div>
            <div class="dg-form-group" style="margin-bottom: 0;">
              <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">สังกัดฝ่าย / ระดับชั้น</label>
              ${isFixed ?
                `<input type="text" class="dg-input" value="${escapeHtml(data.department || '')}" disabled style="background: #f1f5f9; color: #64748b; font-weight: 600; width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />` :
                `<input type="text" class="dg-input" id="dept_${id}" value="${escapeHtml(data.department || '')}" placeholder="เช่น รองประธานคนที่ 1 (ม.5/2)" onchange="updateMemberData('${id}', 'department')" style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px;" />`
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Department Members Subsection (Option A3) -->
      ${deptMembersSection}
    </div>
  `;
}

/**
 * Render Department Members list under each department
 */
function buildDepartmentMembersSection(dept) {
  const deptMembers = allMembers.filter(m => m.department === dept && m.role !== 'หัวหน้าฝ่าย');
  let html = `
    <div style="margin-top: 18px; border-top: 1px dashed #e2e8f0; padding-top: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <div style="font-weight: 700; font-size: 0.88rem; color: #334155; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="users" style="width: 16px; height: 16px; color: var(--dg-primary);"></i>
          <span>คณะทำงานและสมาชิกประจำ${dept} (${deptMembers.length} คน)</span>
        </div>
        <button type="button" class="dg-btn-white" style="font-size: 0.8rem; padding: 4px 12px; border-radius: 6px;" onclick="openAddDeptMemberModal('${dept}')">
          <i data-lucide="plus" style="width: 12px; height: 12px; margin-right: 4px;"></i>
          <span>เพิ่มสมาชิกเข้าฝ่าย</span>
        </button>
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">
  `;

  if (deptMembers.length === 0) {
    html += `<span style="font-size: 0.82rem; color: #94a3b8; padding: 4px 0;">ยังไม่มีสมาชิกในฝ่ายนี้</span>`;
  } else {
    deptMembers.forEach(dm => {
      const studentMatch = studentDirectory.find(s => s.name.replace(/\s+/g, '') === (dm.name || '').replace(/\s+/g, ''));
      const orderLabel = dm.order_no || (studentMatch ? studentMatch.order_no : '');
      const orderDisplay = orderLabel ? `#${orderLabel} ` : '';
      const gradeDisplay = studentMatch ? ` (ม.${studentMatch.grade})` : '';

      html += `
        <span style="display: inline-flex; align-items: center; gap: 6px; background: #f8fafc; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; font-size: 0.82rem;">
          <span style="font-weight: 700; color: #0f172a;">${orderDisplay}${escapeHtml(dm.name)}${gradeDisplay}</span>
          <button type="button" style="border: none; background: transparent; color: #ef4444; cursor: pointer; padding: 0 2px;" onclick="deleteMember('${dm.id}')" title="นำออกจากฝ่ายนี้">
            <i data-lucide="x" style="width: 12px; height: 12px;"></i>
          </button>
        </span>
      `;
    });
  }

  html += `</div></div>`;
  return html;
}

/**
 * Open Modal to add a student to a specific department
 */
let targetDeptForAdd = '';
function openAddDeptMemberModal(dept) {
  targetDeptForAdd = dept;
  const modal = document.getElementById('memberModal');
  const title = document.getElementById('modalTitle');
  title.textContent = `เพิ่มสมาชิกประจำ${dept}`;
  document.getElementById('modalMemberId').value = '';
  document.getElementById('modalName').value = '';
  document.getElementById('modalRole').value = 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน';
  document.getElementById('modalDept').value = dept;
  document.getElementById('modalDept').readOnly = true;
  modal.style.display = 'flex';
}
window.openAddDeptMemberModal = openAddDeptMemberModal;

function updateMemberData(id, field) {
  let inputEl = document.getElementById(field === 'department' ? 'dept_' + id : field + '_' + id);
  if (!inputEl) return;
  let val = inputEl.value;
  let m = allMembers.find(x => x.id === id);
  if (!m) {
    m = { id, name: '', role: 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน', department: '', imageUrl: '' };
    allMembers.push(m);
  }
  m[field] = val;

  // Try matching student in directory to sync order_no
  if (field === 'name') {
    const studentMatch = studentDirectory.find(s => s.name.replace(/\s+/g, '') === val.replace(/\s+/g, ''));
    if (studentMatch) {
      m.order_no = studentMatch.order_no;
      m.student_id = studentMatch.order_no;
    }
  }

  if (field === 'role') {
    renderTeamAdminUI();
  }
}
window.updateMemberData = updateMemberData;

function addExecutive(role) {
  allMembers.unshift({
    id: 'm_' + Date.now(),
    name: '',
    role: role,
    department: '',
    imageUrl: ''
  });
  renderTeamAdminUI();
}
window.addExecutive = addExecutive;

async function deleteMember(id) {
  let m = allMembers.find(x => x.id === id);
  const name = m && m.name ? m.name : 'สมาชิกท่านนี้';

  if (typeof Swal !== 'undefined') {
    const result = await Swal.fire({
      title: 'ยืนยันการลบสมาชิก?',
      text: `คุณต้องการลบ "${name}" ออกจากตำแหน่งนี้ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'ใช่, ลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
    });
    if (!result.isConfirmed) return;
  } else {
    if (!confirm(`ต้องการลบ "${name}" ใช่หรือไม่?`)) return;
  }

  allMembers = allMembers.filter(x => x.id !== id);
  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
  } catch (e) {}
  renderTeamAdminUI();
  if (window.showToast) window.showToast(`ลบ "${name}" เรียบร้อยแล้ว`, 'success');
}
window.deleteMember = deleteMember;

async function handleImageSelect(id, target = 'default') {
  const inputId = target === 'default' ? 'file_' + id : 'file_' + id + '_' + target;
  const fileInput = document.getElementById(inputId);
  if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];

  try {
    const previewId = target === 'default' ? 'img_preview_' + id : 'img_preview_' + id + '_' + target;
    const iconId = target === 'default' ? 'img_icon_' + id : 'img_icon_' + id + '_' + target;
    const previewImg = document.getElementById(previewId);
    const icon = document.getElementById(iconId);
    if (icon) icon.style.display = 'none';
    if (previewImg) {
      previewImg.style.display = 'block';
      previewImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-6.219-8.56'/%3E%3C/svg%3E";
      previewImg.classList.add('dg-spin');
    }

    const res = await window.SarawatApi.uploadImage(file);
    if (res && res.url) {
      let m = allMembers.find(x => x.id === id);
      if (!m) {
        m = { id, name: '', role: 'ประธาน', department: '', imageUrl: '', homeImageUrl: '', teamImageUrl: '' };
        allMembers.push(m);
      }
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

      try {
        localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
      } catch (e) {}

      renderTeamAdminUI();
      if (window.showToast) window.showToast('อัปโหลดรูปภาพสำเร็จ', 'success');
    }
  } catch (err) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'อัปโหลดไม่สำเร็จ',
        text: err.message,
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    } else {
      alert('อัปโหลดไม่สำเร็จ: ' + err.message);
    }
    renderTeamAdminUI();
  }
}
window.handleImageSelect = handleImageSelect;

function removeImage(id, target = 'default') {
  let m = allMembers.find(x => x.id === id);
  if (m) {
    if (target === 'home') {
      m.homeImageUrl = '';
      try { localStorage.removeItem('dg_sarawat_president_home_image'); } catch (e) {}
    } else if (target === 'team') {
      m.teamImageUrl = '';
      try { localStorage.removeItem('dg_sarawat_president_team_image'); } catch (e) {}
    } else {
      m.imageUrl = '';
      m.homeImageUrl = '';
      m.teamImageUrl = '';
    }
    try {
      localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
    } catch (e) {}
    renderTeamAdminUI();
    if (window.showToast) window.showToast('ลบรูปภาพเรียบร้อยแล้ว', 'info');
  }
}
window.removeImage = removeImage;

// Modal Logic
function openMemberModal(id = null) {
  const modal = document.getElementById('memberModal');
  const title = document.getElementById('modalTitle');
  document.getElementById('modalDept').readOnly = false;
  if (id) {
    const m = allMembers.find(x => x.id === id);
    if (m) {
      title.textContent = 'แก้ไขข้อมูลสมาชิก';
      document.getElementById('modalMemberId').value = m.id;
      document.getElementById('modalName').value = m.name || '';
      document.getElementById('modalRole').value = m.role || 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน';
      document.getElementById('modalDept').value = m.department || '';
    }
  } else {
    title.textContent = 'เพิ่มสมาชิกใหม่';
    document.getElementById('modalMemberId').value = '';
    document.getElementById('modalName').value = '';
    document.getElementById('modalRole').value = 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน';
    document.getElementById('modalDept').value = '';
  }
  modal.style.display = 'flex';
}
window.openMemberModal = openMemberModal;

function saveMemberModal() {
  const id = document.getElementById('modalMemberId').value || 'm_' + Date.now();
  const name = document.getElementById('modalName').value.trim();
  const role = document.getElementById('modalRole').value;
  const dept = document.getElementById('modalDept').value.trim();

  if (!name) {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'warning',
        title: 'กรุณาระบุชื่อ-นามสกุล',
        text: 'ชื่อ-นามสกุลไม่สามารถเว้นว่างได้',
        customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' }
      });
    } else {
      alert('กรุณาระบุชื่อ-นามสกุล');
    }
    return;
  }

  // Find match in student directory to extract order_no and student_id
  const studentMatch = studentDirectory.find(s => s.name.replace(/\s+/g, '') === name.replace(/\s+/g, ''));
  const orderNo = studentMatch ? studentMatch.order_no : null;

  const existingIdx = allMembers.findIndex(x => x.id === id);
  if (existingIdx >= 0) {
    allMembers[existingIdx].name = name;
    allMembers[existingIdx].role = role;
    allMembers[existingIdx].department = dept;
    if (orderNo) {
      allMembers[existingIdx].order_no = orderNo;
      allMembers[existingIdx].student_id = orderNo;
    }
  } else {
    allMembers.push({
      id,
      order_no: orderNo,
      student_id: orderNo,
      name,
      role,
      department: dept,
      imageUrl: ''
    });
  }

  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
  } catch (e) {}

  document.getElementById('memberModal').style.display = 'none';
  renderTeamAdminUI();
  if (window.showToast) window.showToast('บันทึกข้อมูลสมาชิกแล้ว', 'success');
}
window.saveMemberModal = saveMemberModal;

async function saveTeamSettings() {
  const validMembers = allMembers.filter(m => m.name && m.name.trim() !== '');
  const presMember = validMembers.find(m => m.role === 'ประธาน');

  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(validMembers));
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
      team_members_db: JSON.stringify(validMembers),
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
      if (window.showToast) window.showToast('บันทึกข้อมูลคณะทำงานลงฐานข้อมูลเรียบร้อยแล้ว!', 'success');
      else alert('บันทึกข้อมูลสำเร็จ!');
    } else {
      if (window.showToast) window.showToast('บันทึกข้อมูลคณะทำงานลงเครื่องเรียบร้อย (Local Draft)', 'warning');
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
