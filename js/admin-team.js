/**
 * Admin Team Management (Full DB, with Card Layout + Members Table)
 */

let allMembers = [];

async function loadTeamAdmin() {
  const container = document.getElementById('teamAdminContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px;">
      <i data-lucide="loader-2" class="dg-spin" style="width: 40px; height: 40px; color: var(--dg-primary);"></i>
      <p style="margin-top: 16px;">กำลังโหลดข้อมูลจากฐานข้อมูล...</p>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  try {
    const base = window.SarawatApi ? window.SarawatApi.getBaseUrl() : '';
    const res = await fetch(base + '/api/settings');
    const settingsData = await res.json();
    
    if (settingsData.team_members_db) {
      allMembers = JSON.parse(settingsData.team_members_db);
    } else {
      allMembers = [];
    }

    renderTeamAdminUI();
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div style="text-align: center; padding: 60px; color: #ef4444;">
        <i data-lucide="alert-triangle" style="width: 40px; height: 40px; margin-bottom: 16px;"></i>
        <p>เกิดข้อผิดพลาดในการโหลดข้อมูล: ${err.message}</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function renderTeamAdminUI() {
  const container = document.getElementById('teamAdminContainer');
  
  let presidents = allMembers.filter(m => m.role === 'ประธาน');
  if(presidents.length === 0) presidents.push({ id: 'new_p', name: '', role: 'ประธาน', department: '', imageUrl: '' });

  let vps = allMembers.filter(m => m.role === 'รองประธาน');
  let secs = allMembers.filter(m => m.role === 'เลขานุการ');
  let heads = allMembers.filter(m => m.role === 'หัวหน้าฝ่าย');
  let members = allMembers.filter(m => m.role === 'ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน' || (!['ประธาน','รองประธาน','เลขานุการ','หัวหน้าฝ่าย'].includes(m.role)));

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

  // --- President ---
  html += buildEditorCard(presidents[0], 'ประธานคณะกรรมการสารวัตรนักเรียน', 'ประธาน', false, true);

  // --- Vice Presidents ---
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

  
  // --- Secretaries ---
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

  // --- Department Heads ---
  html += `
    <div class="team-edit-card" style="background: #f8fafc; border: none;">
      <div class="team-edit-header" style="border-bottom-color: rgba(0,0,0,0.05);">
        <h3 class="team-edit-title">หัวหน้าฝ่ายต่าง ๆ</h3>
      </div>
      <div>
  `;
  const fixedDepts = ['ฝ่ายเอกสาร', 'ฝ่ายโสตทัศนศิลป์', 'ฝ่ายสารวัตรพยาบาล', 'ฝ่ายการเงิน', 'ฝ่ายกิจกรรม', 'ฝ่ายอุปกรณ์และ IT', 'ฝ่ายวินัย'];
  fixedDepts.forEach(dept => {
    let deptHeads = [];
    deptHeads = allMembers.filter(m => m.role === 'หัวหน้าฝ่าย' && m.department === dept);
    
    if (deptHeads.length === 0) {
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

    <!-- Modal for Members -->
    <div class="modal-overlay" id="memberModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; display: none; align-items: center; justify-content: center;">
      <div class="modal-content" style="background: #fff; border-radius: 12px; width: 100%; max-width: 400px; padding: 24px;">
        <h3 id="modalTitle" style="margin-top: 0; margin-bottom: 20px; font-weight: 700;">สมาชิก</h3>
        <input type="hidden" id="modalMemberId" />
        <div class="dg-form-group">
          <label>ชื่อ-นามสกุล *</label>
          <input type="text" class="dg-input" id="modalName" />
        </div>
        <div class="dg-form-group">
          <label>กลุ่มตำแหน่ง</label>
          <select class="dg-input" id="modalRole">
            <option value="ผู้ปฏิบัติหน้าที่สารวัตรนักเรียน">สมาชิกทั่วไป</option>
            
            <option value="หัวหน้าฝ่าย">หัวหน้าฝ่าย (จะแสดงในส่วนการ์ด)</option>
            <option value="รองประธาน">รองประธาน (จะแสดงในส่วนการ์ด)</option>
            <option value="เลขานุการ">เลขานุการ (จะแสดงในส่วนการ์ด)</option>
            <option value="ประธาน">ประธาน</option>
          </select>
        </div>
        <div class="dg-form-group">
          <label>สังกัดฝ่าย (Department)</label>
          <input type="text" class="dg-input" id="modalDept" placeholder="เช่น ฝ่ายเอกสาร" />
        </div>
        <div style="display: flex; gap: 12px; margin-top: 30px;">
          <button class="dg-btn-white" style="flex: 1;" onclick="document.getElementById('memberModal').style.display='none'">ยกเลิก</button>
          <button class="dg-btn-black" style="flex: 1;" onclick="saveMemberModal()">บันทึก</button>
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

function deleteMember(id) {
  if (confirm('ต้องการลบสมาชิกท่านนี้ใช่หรือไม่?')) {
    allMembers = allMembers.filter(x => x.id !== id);
    renderTeamAdminUI();
  }
}

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
      renderTeamAdminUI();
      if(window.showToast) window.showToast('อัปโหลดรูปภาพสำเร็จ');
    }
  } catch (err) {
    alert('อัปโหลดไม่สำเร็จ: ' + err.message);
    renderTeamAdminUI();
  }
}

function removeImage(id) {
  let m = allMembers.find(x => x.id === id);
  if(m) {
    m.imageUrl = '';
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
  
  if(!name) return alert('กรุณาระบุชื่อ-นามสกุล');

  const existingIdx = allMembers.findIndex(x => x.id === id);
  if (existingIdx >= 0) {
    allMembers[existingIdx].name = name;
    allMembers[existingIdx].role = role;
    allMembers[existingIdx].department = dept;
  } else {
    allMembers.push({ id, name, role, department: dept, imageUrl: '' });
  }
  
  document.getElementById('memberModal').style.display = 'none';
  renderTeamAdminUI();
}

async function saveTeamSettings() {
  try {
    const payload = {
      team_members_db: JSON.stringify(allMembers.filter(m => m.name.trim() !== ''))
    };
    
    if (window.SarawatApi && typeof window.SarawatApi.saveSettings === 'function') {
      await window.SarawatApi.saveSettings(payload);
    } else {
      const base = window.SarawatApi ? window.SarawatApi.getBaseUrl() : '';
      const headers = window.SarawatApi && typeof window.SarawatApi.getAuthHeaders === 'function'
        ? window.SarawatApi.getAuthHeaders({ 'Content-Type': 'application/json' })
        : { 'Content-Type': 'application/json' };
      const res = await fetch(base + '/api/settings', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
    }

    if(window.showToast) window.showToast('บันทึกข้อมูลคณะทำงานสำเร็จ!');
    else alert('บันทึกข้อมูลสำเร็จ!');
  } catch (err) {
    alert('บันทึกไม่สำเร็จ: ' + err.message);
  }
}

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
