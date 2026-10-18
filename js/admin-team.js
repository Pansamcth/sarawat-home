/**
 * Admin Team Management (Full DB, with Card Layout + Members Table)
 */

let allMembers = [];
let teamMemberSearchTerm = '';

function handleTeamMemberSearch(term) {
  teamMemberSearchTerm = (term || '').trim().toLowerCase();
  renderTeamAdminUI();
}
window.handleTeamMemberSearch = handleTeamMemberSearch;

async function loadTeamAdmin() {
  const container = document.getElementById('teamAdminContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px;">
      <i data-lucide="loader-2" class="dg-spin" style="width: 40px; height: 40px; color: var(--dg-primary);"></i>
      <p style="margin-top: 16px;">กำลังโหลดข้อมูลคณะกรรมการ...</p>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

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

  renderTeamAdminUI();
}
window.loadTeamAdmin = loadTeamAdmin;

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
  let members = filtered.filter(m => m.role === 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน' || (!['ประธาน','รองประธาน','เลขานุการ','หัวหน้าฝ่าย'].includes(m.role)));

  let html = `
    <style>
      .team-edit-card { background: #fff; border: 1px solid var(--dg-border); border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 10px rgba(0,0,0,0.02); }
      .team-edit-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--dg-border); padding-bottom: 16px; margin-bottom: 20px; }
      .team-edit-title { font-weight: 700; font-size: 1.1rem; color: var(--dg-primary); margin: 0; }
      .team-grid { display: grid; grid-template-columns: 120px 1fr; gap: 24px; align-items: start; }
      .team-img-col { text-align: center; }
      .team-preview-img { width: 120px; height: 120px; border-radius: 8px; object-fit: cover; background: var(--dg-bg-subtle); border: 1px dashed var(--dg-border); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; overflow: hidden; }
      .team-preview-img img { width: 100%; height: 100%; object-fit: cover; }
      .team-preview-img i { color: #cbd5e1; width: 40px; height: 40px; }
      
      .team-table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .team-table th, .team-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--dg-border); }
      .team-table th { background: #f8fafc; font-weight: 600; color: #475569; font-size: 0.9rem; }
      .team-table tr:hover { background: #f1f5f9; }
    </style>
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

  // --- President ---
  if (presidents.length > 0) {
    html += buildEditorCard(presidents[0], 'ประธานคณะกรรมการสารวัตรนักเรียน', 'ประธาน', false, true);
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
      html += buildEditorCard(vp, 'รองประธานคนที่ ' + (idx+1), 'รองประธาน', true);
    });
    if(vps.length === 0) html += `<p style="text-align:center; color: #64748b; font-size: 0.9rem;">ยังไม่มีรองประธาน</p>`;
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
    if(secs.length === 0) {
      html += `<p style="text-align:center; color: #64748b; font-size: 0.9rem;">ยังไม่มีเลขานุการ</p>`;
    }
    html += `</div></div>`;
  }

  // --- Department Heads ---
  const fixedDepts = ['ฝ่ายเอกสาร', 'ฝ่ายโสตทัศนศิลป์', 'ฝ่ายสารวัตรพยาบาล', 'ฝ่ายการเงิน', 'ฝ่ายกิจกรรม', 'ฝ่ายอุปกรณ์และ IT', 'ฝ่ายวินัย'];
  const matchedDepts = fixedDepts.filter(dept => {
    if (!teamMemberSearchTerm) return true;
    return filtered.some(m => m.role === 'หัวหน้าฝ่าย' && m.department === dept);
  });

  if (matchedDepts.length > 0) {
    html += `
      <div class="team-edit-card" style="background: #f8fafc; border: none;">
        <div class="team-edit-header" style="border-bottom-color: rgba(0,0,0,0.05);">
          <h3 class="team-edit-title">หัวหน้าฝ่ายต่าง ๆ</h3>
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
        html += buildEditorCard(h, displayTitle, h.role, false, true);
      });
    });
    html += `</div></div>`;
  }

  // --- General Members Table ---
  html += `
    <div class="team-edit-card">
      <div class="team-edit-header">
        <h3 class="team-edit-title">สมาชิกทั่วไป (${members.length} คน)</h3>
        <button class="dg-btn-black" onclick="openMemberModal()">
          <i data-lucide="plus"></i> <span>เพิ่มสมาชิกใหม่</span>
        </button>
      </div>
      <table class="team-table">
        <thead>
          <tr>
            <th>ชื่อ-นามสกุล</th>
            <th>สังกัดฝ่าย</th>
            <th style="width: 150px; text-align: center;">จัดการ</th>
          </tr>
        </thead>
        <tbody>
  `;
  members.forEach(m => {
    html += `
      <tr>
        <td style="font-weight: 500;">${m.name}</td>
        <td>${m.department || '-'}</td>
        <td style="text-align: center;">
          <button class="dg-btn-white" style="padding: 6px 10px; font-size: 0.8rem;" onclick="openMemberModal('${m.id}')">แก้ไข</button>
          <button class="dg-btn-white" style="padding: 6px 10px; font-size: 0.8rem; color: #ef4444;" onclick="deleteMember('${m.id}')">ลบ</button>
        </td>
      </tr>
    `;
  });
  if(members.length === 0) html += `<tr><td colspan="3" style="text-align:center; padding:20px; color:#64748b;">ไม่มีข้อมูลสมาชิก</td></tr>`;
  html += `
        </tbody>
      </table>
    </div>

    <!-- MAIN SAVE BUTTON -->
    <div style="text-align: center; margin-top: 40px; margin-bottom: 40px;">
      <button class="dg-btn-black" onclick="saveTeamSettings()" style="font-size: 1.1rem; padding: 14px 40px; border-radius: 50px; box-shadow: 0 4px 14px rgba(0,0,0,0.15);">
        <i data-lucide="save" style="margin-right: 8px;"></i>
        <span>บันทึกข้อมูลทั้งหมด</span>
      </button>
    </div>

    <!-- Modal for Members (Bento & Frosted Glass) -->
    <div class="modal-overlay" id="memberModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(15, 23, 42, 0.62); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 9500; display: none; align-items: center; justify-content: center; padding: 16px;">
      <div class="dg-modal-box" style="width: 100%; max-width: 440px; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(15,23,42,0.25);">
        <!-- Header -->
        <div class="dg-modal-header" style="padding: 18px 22px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div class="dg-modal-header-icon" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); width: 36px; height: 36px;">
              <i data-lucide="user" style="width: 18px; height: 18px;"></i>
            </div>
            <div>
              <h3 id="modalTitle" style="margin: 0; font-size: 1.12rem; font-weight: 700; color: #0f172a;">สมาชิก</h3>
              <div style="font-size: 0.78rem; color: #64748b; margin-top: 2px;">จัดการข้อมูลและตำแหน่งหน้าที่</div>
            </div>
          </div>
          <button type="button" class="dg-modal-close" onclick="document.getElementById('memberModal').style.display='none'" title="ปิดหน้าต่าง">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>

        <div style="padding: 22px;">
          <input type="hidden" id="modalMemberId" />
          
          <div class="dg-form-group" style="margin-bottom: 14px;">
            <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">ชื่อ-นามสกุล <span style="color: #ef4444;">*</span></label>
            <input type="text" class="recruit-input" id="modalName" placeholder="เช่น นายสมชาย ใจดี" />
          </div>

          <div class="dg-form-group" style="margin-bottom: 14px;">
            <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">กลุ่มตำแหน่ง</label>
            <select class="recruit-select" id="modalRole">
              <option value="ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน">สมาชิกทั่วไป</option>
              <option value="หัวหน้าฝ่าย">หัวหน้าฝ่าย (จะแสดงในส่วนการ์ด)</option>
              <option value="รองประธาน">รองประธาน (จะแสดงในส่วนการ์ด)</option>
              <option value="เลขานุการ">เลขานุการ (จะแสดงในส่วนการ์ด)</option>
              <option value="ประธาน">ประธาน</option>
            </select>
          </div>

          <div class="dg-form-group" style="margin-bottom: 6px;">
            <label style="font-weight: 600; font-size: 0.86rem; color: #334155; margin-bottom: 6px; display: block;">สังกัดฝ่าย (Department)</label>
            <input type="text" class="recruit-input" id="modalDept" placeholder="เช่น ฝ่ายเอกสาร, ฝ่ายสารวัตรกลาง" />
          </div>
        </div>

        <div class="dg-modal-actions" style="padding: 14px 22px;">
          <button type="button" class="btn-step-prev" style="padding: 10px 18px; border-radius: 10px; font-size: 0.88rem;" onclick="document.getElementById('memberModal').style.display='none'">ยกเลิก</button>
          <button type="button" class="dg-btn-black" style="padding: 10px 24px; border-radius: 10px; font-size: 0.88rem; display: inline-flex; align-items: center; gap: 6px;" onclick="saveMemberModal()">
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

function buildEditorCard(data, title, expectedRole, canDelete = false, isFixed = false) {
  if(!data.id) data.id = 'new_' + Date.now() + Math.random();
  const id = data.id;

  const imgContent = data.imageUrl ? 
    `<img src="${window.resolveImageUrl ? window.resolveImageUrl(data.imageUrl) : data.imageUrl}" id="img_preview_${id}" />` : 
    `<i data-lucide="user" id="img_icon_${id}"></i><img id="img_preview_${id}" style="display:none;" />`;

  const deleteBtn = canDelete ? 
    `<button class="dg-btn-white" style="color: #ef4444; border-color: #fecaca; padding: 6px 12px; font-size: 0.85rem;" onclick="deleteMember('${id}')"><i data-lucide="trash-2" style="width: 14px; height: 14px; margin-right: 4px;"></i>ลบ</button>` : '';

  return `
    <div class="team-edit-card" style="background: #fff;">
      <div class="team-edit-header">
        <h4 style="margin:0; font-weight: 600; font-size: 1rem;">${title}</h4>
        ${deleteBtn}
      </div>
      <div class="team-grid">
        <div class="team-img-col">
          <div class="team-preview-img">
            ${imgContent}
          </div>
          <input type="file" id="file_${id}" accept="image/*" style="display: none;" onchange="handleImageSelect('${id}')" />
          <button class="dg-btn-white" style="width: 100%; padding: 6px; font-size: 0.85rem;" onclick="document.getElementById('file_${id}').click()">เปลี่ยนรูป</button>
          ${data.imageUrl ? `<button class="dg-btn-white" style="width: 100%; padding: 6px; font-size: 0.85rem; margin-top: 6px; color: #ef4444;" onclick="removeImage('${id}')">ลบรูป</button>` : ''}
        </div>
        <div>
          <div class="dg-form-group">
            <label>ชื่อ - นามสกุล ${!data.name ? '<span style="color:#f59e0b; font-size:0.8rem; font-weight:normal; margin-left: 8px;">(ยังไม่มีข้อมูล)</span>' : ''}</label>
            <input type="text" class="dg-input" id="name_${id}" value="${data.name || ''}" placeholder="ระบุชื่อ-นามสกุล..." onchange="updateMemberData('${id}', 'name')" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div class="dg-form-group" style="margin-bottom: 0;">
              <label>กลุ่มตำแหน่ง</label>
              ${isFixed ? 
                `<input type="text" class="dg-input" value="${data.role}" disabled style="background: #f1f5f9; color: #64748b;" />` : 
                `<select class="dg-input" id="role_${id}" onchange="updateMemberData('${id}', 'role')">
                  <option value="ประธาน" ${data.role === 'ประธาน' ? 'selected' : ''}>ประธาน</option>
                  <option value="รองประธาน" ${data.role === 'รองประธาน' ? 'selected' : ''}>รองประธาน</option>
                  
                  <option value="หัวหน้าฝ่าย" ${data.role === 'หัวหน้าฝ่าย' ? 'selected' : ''}>หัวหน้าฝ่าย</option>
                  <option value="ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน" ${data.role === 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน' ? 'selected' : ''}>ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน (ย้ายไปตาราง)</option>
                </select>`
              }
            </div>
            <div class="dg-form-group" style="margin-bottom: 0;">
              <label>สังกัดฝ่าย (ถ้ามี)</label>
              ${isFixed ?
                `<input type="text" class="dg-input" value="${data.department || ''}" disabled style="background: #f1f5f9; color: #64748b;" />` :
                `<input type="text" class="dg-input" id="dept_${id}" value="${data.department || ''}" placeholder="เช่น ฝ่ายเอกสาร" onchange="updateMemberData('${id}', 'department')" />`
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function updateMemberData(id, field) {
  let val = document.getElementById(field === 'department' ? 'dept_' + id : field + '_' + id).value;
  let m = allMembers.find(x => x.id === id);
  if(!m) {
    m = { id, name: '', role: 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน', department: '', imageUrl: '' };
    allMembers.push(m);
  }
  m[field] = val;
  
  if(field === 'role') {
    renderTeamAdminUI(); // re-render if role changes to move card
  }
}

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

async function deleteMember(id) {
  let m = allMembers.find(x => x.id === id);
  const name = m && m.name ? m.name : 'สมาชิกท่านนี้';
  
  if (typeof Swal !== 'undefined') {
    const result = await Swal.fire({
      title: 'ยืนยันการลบสมาชิก?',
      text: `คุณต้องการลบ "${name}" ออกจากรายชื่อคณะบริหารใช่หรือไม่?`,
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

async function handleImageSelect(id) {
  const fileInput = document.getElementById('file_' + id);
  if (!fileInput.files || fileInput.files.length === 0) return;
  const file = fileInput.files[0];

  try {
    const previewImg = document.getElementById('img_preview_' + id);
    const icon = document.getElementById('img_icon_' + id);
    if(icon) icon.style.display = 'none';
    previewImg.style.display = 'block';
    previewImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 12a9 9 0 1 1-6.219-8.56'/%3E%3C/svg%3E";
    previewImg.classList.add('dg-spin');

    const res = await window.SarawatApi.uploadImage(file);
    if (res && res.url) {
      let m = allMembers.find(x => x.id === id);
      if(!m) {
        m = { id, name: '', role: 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน', department: '', imageUrl: '' };
        allMembers.push(m);
      }
      m.imageUrl = res.url;
      try {
        localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
      } catch (e) {}
      renderTeamAdminUI();
      if(window.showToast) window.showToast('อัปโหลดรูปภาพสำเร็จ', 'success');
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

function removeImage(id) {
  let m = allMembers.find(x => x.id === id);
  if(m) {
    m.imageUrl = '';
    try {
      localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
    } catch (e) {}
    renderTeamAdminUI();
  }
}

// Modal Logic
function openMemberModal(id = null) {
  const modal = document.getElementById('memberModal');
  const title = document.getElementById('modalTitle');
  if (id) {
    const m = allMembers.find(x => x.id === id);
    if(m) {
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

function saveMemberModal() {
  const id = document.getElementById('modalMemberId').value || 'm_' + Date.now();
  const name = document.getElementById('modalName').value.trim();
  const role = document.getElementById('modalRole').value;
  const dept = document.getElementById('modalDept').value.trim();
  
  if(!name) {
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

  const existingIdx = allMembers.findIndex(x => x.id === id);
  if (existingIdx >= 0) {
    allMembers[existingIdx].name = name;
    allMembers[existingIdx].role = role;
    allMembers[existingIdx].department = dept;
  } else {
    allMembers.push({ id, name, role, department: dept, imageUrl: '' });
  }
  
  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(allMembers));
  } catch (e) {}

  document.getElementById('memberModal').style.display = 'none';
  renderTeamAdminUI();
  if (window.showToast) window.showToast('บันทึกข้อมูลสมาชิกแล้ว', 'success');
}

async function saveTeamSettings() {
  const validMembers = allMembers.filter(m => m.name && m.name.trim() !== '');
  try {
    localStorage.setItem('dg_sarawat_team_members', JSON.stringify(validMembers));
  } catch (e) {}

  let savedOnline = false;
  try {
    const payload = {
      team_members_db: JSON.stringify(validMembers)
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
