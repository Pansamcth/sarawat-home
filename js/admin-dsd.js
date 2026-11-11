/**
 * Admin DSD Management - Digital Systems Development Division
 * Full CRUD, Image Upload, Order Sorting & Head Assignment
 */

(function () {
  let dsdMembersList = [];
  let dsdSearchTerm = '';
  let dsdActiveFilter = 'ALL'; // ALL, active, hidden
  let currentEditingMemberId = null;

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

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Load DSD Members for Admin
   */
  async function loadDsdAdmin() {
    const tableBody = document.getElementById('dsdMembersTableBody');
    const countBadge = document.getElementById('dsdCountBadge');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--dg-text-muted);"><i data-lucide="loader" class="dg-spin" style="width: 24px; height: 24px; margin-bottom: 8px;"></i><div>กำลังโหลดข้อมูลสมาชิก DSD...</div></td></tr>`;
      if (window.lucide) lucide.createIcons();
    }

    const token = getAuthToken();
    try {
      const res = await fetch(getApiBase() + '/api/dsd/admin/members', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }

      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        dsdMembersList = json.data;
      } else {
        dsdMembersList = [];
      }
    } catch (err) {
      console.warn('Cannot fetch /api/dsd/admin/members:', err.message);
      // Fallback: try public endpoint or cache
      try {
        const pubRes = await fetch(getApiBase() + '/api/dsd/members');
        const pubJson = await pubRes.json();
        if (pubJson && pubJson.success && Array.isArray(pubJson.data)) {
          dsdMembersList = pubJson.data;
        }
      } catch (e) {
        dsdMembersList = [];
      }
    }

    renderDsdAdminUI();
  }
  window.loadDsdAdmin = loadDsdAdmin;

  /**
   * Filter and Render Members Table
   */
  function renderDsdAdminUI() {
    const tableBody = document.getElementById('dsdMembersTableBody');
    const countBadge = document.getElementById('dsdCountBadge');
    const headBadge = document.getElementById('dsdCurrentHeadBadge');
    if (!tableBody) return;

    let filtered = dsdMembersList.slice();

    // 1. Search term
    if (dsdSearchTerm) {
      const term = dsdSearchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.nickname || '').toLowerCase().includes(term) ||
        (m.role || '').toLowerCase().includes(term) ||
        (m.grade || '').toLowerCase().includes(term)
      );
    }

    // 2. Status filter
    if (dsdActiveFilter !== 'ALL') {
      filtered = filtered.filter(m => m.status === dsdActiveFilter);
    }

    // Update Counter
    if (countBadge) {
      countBadge.innerHTML = `<i data-lucide="users" style="width: 13px; height: 13px;"></i> สมาชิกทั้งหมด ${dsdMembersList.length} คน`;
    }

    // Identify current head
    const currentHead = dsdMembersList.find(m => Number(m.is_head) === 1);
    if (headBadge) {
      if (currentHead) {
        headBadge.innerHTML = `<i data-lucide="shield-check" style="width: 13px; height: 13px; color: #10b981;"></i> หัวหน้าฝ่าย: <strong>${escapeHtml(currentHead.name)}</strong>`;
      } else {
        headBadge.innerHTML = `<i data-lucide="alert-circle" style="width: 13px; height: 13px; color: #f59e0b;"></i> ยังไม่ระบุหัวหน้าฝ่าย`;
      }
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--dg-text-muted);">
            <i data-lucide="users" style="width: 36px; height: 36px; margin-bottom: 10px; color: var(--dg-border);"></i>
            <div style="font-weight: 700; font-size: 1rem; color: var(--dg-text-primary); margin-bottom: 4px;">ไม่พบข้อมูลสมาชิก</div>
            <div style="font-size: 0.85rem;">คลิกปุ่ม "+ เพิ่มสมาชิก DSD" เพื่อเพิ่มข้อมูลสมาชิกใหม่เข้าสู่ระบบ</div>
          </td>
        </tr>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    filtered.forEach((m, idx) => {
      const isHead = Number(m.is_head) === 1;
      const nickStr = m.nickname ? ` <span style="color: var(--dg-text-muted); font-weight: 400;">(${escapeHtml(m.nickname)})</span>` : '';
      const headBadgeHtml = isHead ? `
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--dg-radius-pill); background: var(--dg-text-primary); color: var(--dg-bg); font-size: 0.68rem; font-weight: 800; text-transform: uppercase;">
          <i data-lucide="shield-check" style="width: 11px; height: 11px;"></i> HEAD
        </span>
      ` : '';

      const statusHtml = m.status === 'active' ? `
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: var(--dg-radius-pill); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 0.72rem; font-weight: 700;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> กำลังแสดงผล
        </span>
      ` : `
        <span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: var(--dg-radius-pill); background: rgba(107, 114, 128, 0.12); color: #6b7280; font-size: 0.72rem; font-weight: 700;">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #6b7280;"></span> ซ่อนอยู่
        </span>
      `;

      let imgHtml = '';
      if (m.image_url) {
        let fullImg = m.image_url;
        if (fullImg.startsWith('/')) fullImg = getApiBase() + fullImg;
        imgHtml = `<img src="${escapeHtml(fullImg)}" alt="${escapeHtml(m.name)}" style="width: 44px; height: 44px; object-fit: cover; border-radius: var(--dg-radius-sm); border: 1px solid var(--dg-border);" onerror="this.onerror=null; this.src='assets/icons/sarawat-logo.png';" />`;
      } else {
        imgHtml = `<div style="width: 44px; height: 44px; border-radius: var(--dg-radius-sm); background: var(--dg-bg-subtle); border: 1px solid var(--dg-border); display: flex; align-items: center; justify-content: center; color: var(--dg-text-muted);"><i data-lucide="user" style="width: 20px; height: 20px;"></i></div>`;
      }

      html += `
        <tr>
          <td style="width: 70px; text-align: center;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--dg-text-muted);">${m.order_index || (idx + 1)}</span>
              <div style="display: flex; gap: 2px;">
                <button type="button" class="dg-btn-outline" style="padding: 2px 4px; border-radius: 3px;" onclick="moveDsdMemberOrder(${m.id}, -1)" title="เลื่อนขึ้น">
                  <i data-lucide="chevron-up" style="width: 12px; height: 12px;"></i>
                </button>
                <button type="button" class="dg-btn-outline" style="padding: 2px 4px; border-radius: 3px;" onclick="moveDsdMemberOrder(${m.id}, 1)" title="เลื่อนลง">
                  <i data-lucide="chevron-down" style="width: 12px; height: 12px;"></i>
                </button>
              </div>
            </div>
          </td>
          <td style="width: 60px;">${imgHtml}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="font-size: 0.95rem; color: var(--dg-text-primary);">${escapeHtml(m.name)}</strong>
              ${nickStr}
            </div>
            ${m.grade ? `<div style="font-size: 0.78rem; color: var(--dg-text-muted); margin-top: 2px;">ชั้น: ${escapeHtml(m.grade)}</div>` : ''}
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--dg-text-secondary);">${escapeHtml(m.role)}</span>
              ${headBadgeHtml}
            </div>
            <div style="display: flex; gap: 6px; margin-top: 4px;">
              ${m.github_url ? `<a href="${escapeHtml(m.github_url)}" target="_blank" title="GitHub" style="color: var(--dg-text-secondary);"><i data-lucide="github" style="width: 12px; height: 12px;"></i></a>` : ''}
              ${m.instagram_url ? `<a href="${escapeHtml(m.instagram_url)}" target="_blank" title="Instagram" style="color: #e1306c;"><i data-lucide="instagram" style="width: 12px; height: 12px;"></i></a>` : ''}
              ${m.facebook_url ? `<a href="${escapeHtml(m.facebook_url)}" target="_blank" title="Facebook" style="color: #1877f2;"><i data-lucide="facebook" style="width: 12px; height: 12px;"></i></a>` : ''}
              ${m.website_url ? `<a href="${escapeHtml(m.website_url)}" target="_blank" title="Website" style="color: #10b981;"><i data-lucide="globe" style="width: 12px; height: 12px;"></i></a>` : ''}
            </div>
          </td>
          <td>${statusHtml}</td>
          <td style="text-align: right; width: 170px;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              ${!isHead ? `
                <button type="button" class="dg-btn-outline" style="padding: 5px 9px; font-size: 0.74rem;" onclick="setDsdMemberAsHead(${m.id})" title="ตั้งเป็นหัวหน้าฝ่าย">
                  <i data-lucide="shield" style="width: 12px; height: 12px;"></i>
                </button>
              ` : ''}
              <button type="button" class="dg-btn-outline" style="padding: 5px 9px; font-size: 0.74rem;" onclick="openEditDsdMemberModal(${m.id})" title="แก้ไขข้อมูล">
                <i data-lucide="edit-2" style="width: 12px; height: 12px;"></i>
              </button>
              <button type="button" class="dg-btn-outline" style="padding: 5px 9px; font-size: 0.74rem; color: #ef4444; border-color: rgba(239, 68, 68, 0.3);" onclick="deleteDsdMember(${m.id}, '${escapeHtml(m.name)}')" title="ลบสมาชิก">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  window.handleDsdSearch = function (term) {
    dsdSearchTerm = (term || '').trim();
    renderDsdAdminUI();
  };

  window.setDsdStatusFilter = function (status) {
    dsdActiveFilter = status;
    document.querySelectorAll('.dsd-filter-btn').forEach(b => {
      if (b.dataset.filter === status) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
    renderDsdAdminUI();
  };

  /**
   * Modal Management: Open Add Modal
   */
  window.openAddDsdMemberModal = function () {
    currentEditingMemberId = null;
    const modalTitle = document.getElementById('dsdMemberModalTitle');
    if (modalTitle) modalTitle.textContent = 'เพิ่มสมาชิกฝ่ายพัฒนาระบบดิจิทัล (DSD)';

    document.getElementById('dsdMemberName').value = '';
    document.getElementById('dsdMemberNickname').value = '';
    document.getElementById('dsdMemberRole').value = 'สมาชิกฝ่ายพัฒนาระบบดิจิทัล';
    document.getElementById('dsdMemberIsHead').checked = false;
    document.getElementById('dsdMemberGrade').value = '';
    document.getElementById('dsdMemberImageUrl').value = '';
    document.getElementById('dsdMemberBio').value = '';
    document.getElementById('dsdMemberGithub').value = '';
    document.getElementById('dsdMemberInstagram').value = '';
    document.getElementById('dsdMemberFacebook').value = '';
    document.getElementById('dsdMemberWebsite').value = '';
    document.getElementById('dsdMemberOrder').value = (dsdMembersList.length + 1);
    document.getElementById('dsdMemberStatus').value = 'active';

    const preview = document.getElementById('dsdMemberImagePreview');
    if (preview) {
      preview.src = '';
      preview.style.display = 'none';
    }
    const placeholder = document.getElementById('dsdMemberImagePlaceholder');
    if (placeholder) placeholder.style.display = 'flex';

    const modal = document.getElementById('adminDsdMemberModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (window.lucide) lucide.createIcons();
    }
  };

  /**
   * Modal Management: Open Edit Modal
   */
  window.openEditDsdMemberModal = function (memberId) {
    const member = dsdMembersList.find(m => m.id === memberId);
    if (!member) return;

    currentEditingMemberId = memberId;
    const modalTitle = document.getElementById('dsdMemberModalTitle');
    if (modalTitle) modalTitle.textContent = 'แก้ไขข้อมูลสมาชิก DSD';

    document.getElementById('dsdMemberName').value = member.name || '';
    document.getElementById('dsdMemberNickname').value = member.nickname || '';
    document.getElementById('dsdMemberRole').value = member.role || '';
    document.getElementById('dsdMemberIsHead').checked = Number(member.is_head) === 1;
    document.getElementById('dsdMemberGrade').value = member.grade || '';
    document.getElementById('dsdMemberImageUrl').value = member.image_url || '';
    document.getElementById('dsdMemberBio').value = member.bio || '';
    document.getElementById('dsdMemberGithub').value = member.github_url || '';
    document.getElementById('dsdMemberInstagram').value = member.instagram_url || '';
    document.getElementById('dsdMemberFacebook').value = member.facebook_url || '';
    document.getElementById('dsdMemberWebsite').value = member.website_url || '';
    document.getElementById('dsdMemberOrder').value = member.order_index || 1;
    document.getElementById('dsdMemberStatus').value = member.status || 'active';

    const preview = document.getElementById('dsdMemberImagePreview');
    const placeholder = document.getElementById('dsdMemberImagePlaceholder');
    if (member.image_url) {
      let fullUrl = member.image_url;
      if (fullUrl.startsWith('/')) fullUrl = getApiBase() + fullUrl;
      if (preview) {
        preview.src = fullUrl;
        preview.style.display = 'block';
      }
      if (placeholder) placeholder.style.display = 'none';
    } else {
      if (preview) preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    }

    const modal = document.getElementById('adminDsdMemberModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (window.lucide) lucide.createIcons();
    }
  };

  window.closeDsdMemberModal = function () {
    const modal = document.getElementById('adminDsdMemberModal');
    if (modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  /**
   * Handle Photo Upload via POST /api/upload
   */
  window.handleDsdPhotoUpload = async function (fileInput) {
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];
    const token = getAuthToken();

    const formData = new FormData();
    formData.append('image', file);

    const uploadStatus = document.getElementById('dsdUploadStatusText');
    if (uploadStatus) uploadStatus.textContent = 'กำลังอัปโหลดรูปภาพ...';

    try {
      const res = await fetch(getApiBase() + '/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        body: formData
      });

      const json = await res.json();
      if (res.ok && json.success && json.url) {
        document.getElementById('dsdMemberImageUrl').value = json.url;
        let fullUrl = json.url;
        if (fullUrl.startsWith('/')) fullUrl = getApiBase() + fullUrl;

        const preview = document.getElementById('dsdMemberImagePreview');
        const placeholder = document.getElementById('dsdMemberImagePlaceholder');
        if (preview) {
          preview.src = fullUrl;
          preview.style.display = 'block';
        }
        if (placeholder) placeholder.style.display = 'none';
        if (uploadStatus) uploadStatus.textContent = '✅ อัปโหลดสำเร็จ';
      } else {
        alert(json.error || 'อัปโหลดรูปภาพไม่สำเร็จ');
        if (uploadStatus) uploadStatus.textContent = '❌ อัปโหลดล้มเหลว';
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message);
      if (uploadStatus) uploadStatus.textContent = '❌ อัปโหลดล้มเหลว';
    }
  };

  /**
   * Save Member Form (Create / Update)
   */
  window.saveDsdMemberForm = async function () {
    const name = (document.getElementById('dsdMemberName').value || '').trim();
    const nickname = (document.getElementById('dsdMemberNickname').value || '').trim();
    const role = (document.getElementById('dsdMemberRole').value || '').trim();
    const isHead = document.getElementById('dsdMemberIsHead').checked ? 1 : 0;
    const grade = (document.getElementById('dsdMemberGrade').value || '').trim();
    const imageUrl = (document.getElementById('dsdMemberImageUrl').value || '').trim();
    const bio = (document.getElementById('dsdMemberBio').value || '').trim();
    const githubUrl = (document.getElementById('dsdMemberGithub').value || '').trim();
    const instagramUrl = (document.getElementById('dsdMemberInstagram').value || '').trim();
    const facebookUrl = (document.getElementById('dsdMemberFacebook').value || '').trim();
    const websiteUrl = (document.getElementById('dsdMemberWebsite').value || '').trim();
    const orderIndex = Number(document.getElementById('dsdMemberOrder').value) || 1;
    const status = document.getElementById('dsdMemberStatus').value || 'active';

    if (!name) {
      alert('กรุณากรอกชื่อ-นามสกุลสมาชิก');
      document.getElementById('dsdMemberName').focus();
      return;
    }
    if (!role) {
      alert('กรุณาระบุตำแหน่งภายในฝ่าย');
      document.getElementById('dsdMemberRole').focus();
      return;
    }

    const payload = {
      name,
      nickname,
      role,
      is_head: isHead,
      grade,
      image_url: imageUrl,
      bio,
      github_url: githubUrl,
      instagram_url: instagramUrl,
      facebook_url: facebookUrl,
      website_url: websiteUrl,
      order_index: orderIndex,
      status
    };

    const token = getAuthToken();
    const isEditing = currentEditingMemberId !== null;
    const url = isEditing
      ? `${getApiBase()}/api/dsd/members/${currentEditingMemberId}`
      : `${getApiBase()}/api/dsd/members`;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            icon: 'success',
            title: isEditing ? 'แก้ไขข้อมูลสำเร็จ' : 'เพิ่มสมาชิกสำเร็จ',
            text: `บันทึกข้อมูล ${name} เรียบร้อยแล้ว`,
            timer: 1800,
            showConfirmButton: false
          });
        } else {
          alert('บันทึกข้อมูลสำเร็จ!');
        }
        closeDsdMemberModal();
        loadDsdAdmin();
      } else {
        alert(json.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ' + err.message);
    }
  };

  /**
   * Delete Member
   */
  window.deleteDsdMember = async function (memberId, memberName) {
    const doDelete = async () => {
      const token = getAuthToken();
      try {
        const res = await fetch(`${getApiBase()}/api/dsd/members/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': 'Bearer ' + token
          }
        });
        const json = await res.json();
        if (res.ok && json.success) {
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'success',
              title: 'ลบสมาชิกเรียบร้อย',
              text: `ลบ ${memberName} ออกจากฝ่าย DSD แล้ว`,
              timer: 1600,
              showConfirmButton: false
            });
          }
          loadDsdAdmin();
        } else {
          alert(json.error || 'ไม่สามารถลบสมาชิกได้');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ' + err.message);
      }
    };

    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: 'ยืนยันการลบสมาชิก?',
        text: `คุณต้องการลบ "${memberName}" ออกจากฝ่าย DSD หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'ลบสมาชิก',
        cancelButtonText: 'ยกเลิก'
      }).then(result => {
        if (result.isConfirmed) doDelete();
      });
    } else {
      if (confirm(`คุณต้องการลบ "${memberName}" ออกจากฝ่าย DSD หรือไม่?`)) {
        doDelete();
      }
    }
  };

  /**
   * Set Member as Head
   */
  window.setDsdMemberAsHead = async function (memberId) {
    const token = getAuthToken();
    try {
      const res = await fetch(`${getApiBase()}/api/dsd/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ is_head: 1 })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        loadDsdAdmin();
      } else {
        alert(json.error || 'ไม่สามารถตั้งเป็นหัวหน้าฝ่ายได้');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  /**
   * Move Order Up or Down
   */
  window.moveDsdMemberOrder = async function (memberId, direction) {
    const idx = dsdMembersList.findIndex(m => m.id === memberId);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= dsdMembersList.length) return;

    // Swap order indices
    const currentOrder = dsdMembersList[idx].order_index || (idx + 1);
    const targetOrder = dsdMembersList[targetIdx].order_index || (targetIdx + 1);

    const items = [
      { id: dsdMembersList[idx].id, order_index: targetOrder },
      { id: dsdMembersList[targetIdx].id, order_index: currentOrder }
    ];

    const token = getAuthToken();
    try {
      const res = await fetch(getApiBase() + '/api/dsd/members/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ items })
      });
      if (res.ok) {
        loadDsdAdmin();
      }
    } catch (err) {
      console.warn('Reorder failed:', err);
    }
  };
})();
