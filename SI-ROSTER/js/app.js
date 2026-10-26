/**
 * ========================================================
 * SI-ROSTER - APPLICATION CLIENT LOGIC
 * ========================================================
 */

// --- Block 1: Editors & Browser Compatibility ---
    let dashEditor, actEditor;
    document.addEventListener("DOMContentLoaded", function () {
      dashEditor = new toastui.Editor({
        el: document.querySelector('#editor-dashActDesc'),
        height: '300px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        hideModeSwitch: true, // Optional: hide the markdown switch
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'link']
        ]
      });

      actEditor = new toastui.Editor({
        el: document.querySelector('#editor-actDesc'),
        height: '300px',
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        hideModeSwitch: true,
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'task', 'indent', 'outdent'],
          ['table', 'link']
        ]
      });
      var ua = navigator.userAgent;
      var vendor = navigator.vendor || '';

      // Check for in-app browsers first
      var isInApp = /Line|FBAN|FBAV|Instagram|Twitter|TikTok/i.test(ua);

      var isChrome = /Chrome/.test(ua) && /Google Inc/.test(vendor);
      var isSafari = /Safari/.test(ua) && /Apple Computer/.test(vendor);
      var isEdge = /Edg/.test(ua) || /Edge/.test(ua);
      var isChromeIOS = /CriOS/.test(ua);
      var isSafariIOS = /iP(ad|hone|od).+Version\/[\d\.]+.*Safari/i.test(ua);

      // Allow Chrome, Safari, and Edge, but explicitly REJECT in-app browsers
      var isSupported = !isInApp;

      if (!isSupported) {
        var overlay = document.getElementById('browser-not-supported-overlay');
        if (overlay) {
          overlay.style.display = 'flex';
          document.body.style.overflow = 'hidden';

          var children = document.body.children;
          for (var i = 0; i < children.length; i++) {
            if (children[i].id !== 'browser-not-supported-overlay' && children[i].tagName !== 'SCRIPT') {
              children[i].style.display = 'none';
            }
          }
        }
      }
    });

// --- Block 2: Main State & Operations ---
    let currentDate = new Date();
    let currentActivities = [];
    let selectedDateInfo = null;
    let studentNamesList = [];
    let systemDuties = [];
    let isAdmin = false;
    let adminInfo = null;
    let currentFeedView = 'list';
    let currentCalendarMonth = new Date().getMonth();
    let currentCalendarYear = new Date().getFullYear();
    const monthNamesThai = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];

    function formatThaiDateRange(startDateStr, endDateStr) {
      if (!startDateStr) return '-';
      let display = startDateStr;
      const sParts = startDateStr.split('-');
      if (sParts.length === 3) {
        const sYear = parseInt(sParts[0]) > 2500 ? parseInt(sParts[0]) : parseInt(sParts[0]) + 543;
        const sMonth = monthNamesThai[parseInt(sParts[1]) - 1];
        const sDay = parseInt(sParts[2]);

        if (endDateStr && endDateStr !== startDateStr) {
          const eParts = endDateStr.split('-');
          if (eParts.length === 3) {
            const eYear = parseInt(eParts[0]) > 2500 ? parseInt(eParts[0]) : parseInt(eParts[0]) + 543;
            const eMonth = monthNamesThai[parseInt(eParts[1]) - 1];
            const eDay = parseInt(eParts[2]);

            if (sMonth === eMonth && sYear === eYear) {
              display = `${sDay} - ${eDay} ${sMonth} ${sYear}`;
            } else {
              display = `${sDay} ${sMonth} ${sYear} - ${eDay} ${eMonth} ${eYear}`;
            }
          } else {
            display = `${sDay} ${sMonth} ${sYear}`;
          }
        } else {
          display = `${sDay} ${sMonth} ${sYear}`;
        }
      }
      return display;
    }

    // --- Init ---
    window.onload = function () {
      const authCookie = getLoginCookie();
      if (authCookie) {
        loginSuccess(authCookie.user, authCookie.name, authCookie.role, true);
      }
      loadInitialData();
      setTimeout(function () {
        if (typeof updateViewToggleIndicator === 'function') {
          updateViewToggleIndicator(currentFeedView);
        }
      }, 50);
    };

    window.addEventListener('resize', function () {
      if (typeof updateViewToggleIndicator === 'function') {
        updateViewToggleIndicator(currentFeedView);
      }
    }, { passive: true });

    // Close autocomplete dropdowns when clicking outside
    document.addEventListener('pointerdown', function (e) {
      const centralInput = document.getElementById('centralNameInput');
      const centralDropdown = document.getElementById('centralAutocomplete');
      if (centralDropdown && centralInput && centralDropdown.style.display !== 'none') {
        if (!centralInput.contains(e.target) && !centralDropdown.contains(e.target)) {
          centralDropdown.style.display = 'none';
        }
      }
      const statusInput = document.getElementById('statusSearchInput');
      const statusDropdown = document.getElementById('statusAutocomplete');
      if (statusDropdown && statusInput && statusDropdown.style.display !== 'none') {
        if (!statusInput.contains(e.target) && !statusDropdown.contains(e.target)) {
          statusDropdown.style.display = 'none';
        }
      }
    });

    function loadInitialData() {
      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (data) {
            studentNamesList = data.students || [];
            systemDuties = data.duties || [];
            populateStudentDatalist();
            document.getElementById('dbStatusIndicator').innerHTML = '<span class="pulse-dot success"></span> <span style="font-weight: 500; color: #10B981;">SQL: Active</span>';
            loadUpcomingActivities();
          })
          .withFailureHandler(function (error) {
            console.error('Error loading init data:', error);
            document.getElementById('dbStatusIndicator').innerHTML = '<span class="pulse-dot danger"></span> <span style="font-weight: 500; color: #EF4444;">SQL: Offline</span>';
            loadUpcomingActivities();
          })
          .getAppInitData();
      } else {
        // Local mock testing
        studentNamesList = ["Mock Student 1", "Mock Student 2"];
        systemDuties = ["ประตู 1", "อาคาร 3", "ห้องสมุด"];
        populateStudentDatalist();
        document.getElementById('dbStatusIndicator').innerHTML = '<span class="pulse-dot warning"></span> <span style="font-weight: 500; color: #F59E0B;">SQL: Mock</span>';
        loadUpcomingActivities();
      }
    }

    function populateStudentDatalist() {
      const datalist = document.getElementById('studentList');
      if (!datalist) return;
      datalist.innerHTML = '';
      studentNamesList.forEach(s => {
        const option = document.createElement('option');
        option.value = s.name + (s.grade ? ' ' + s.grade : '');
        datalist.appendChild(option);
      });
    }

    // --- Dashboard: Duties ---
    function renderDashDuties() {
      const tbody = document.getElementById('dutiesTableBody');
      tbody.innerHTML = '';
      systemDuties.forEach((d, index) => {
        const tr = document.createElement('tr');

        let moveBtns = '';
        if (index > 0) moveBtns += `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="moveDuty(${index}, -1)" title="ย้ายขึ้น"><i class="fa-solid fa-arrow-up"></i></button>`;
        if (index < systemDuties.length - 1) moveBtns += `<button class="btn btn-outline" style="padding:4px 8px; font-size:0.8rem; margin-right:5px;" onclick="moveDuty(${index}, 1)" title="ย้ายลง"><i class="fa-solid fa-arrow-down"></i></button>`;

        tr.innerHTML = `
          <td>${d}</td>
          <td style="text-align: center;">
            ${moveBtns}
            <button class="btn btn-outline" style="padding: 6px 12px; border-color: var(--accent); color: var(--accent); font-size: 0.9rem; margin-right: 5px;" onclick="editDutyDash('${d}')">
              <i class="fa-solid fa-pen"></i> แก้ไข
            </button>
            <button class="btn btn-outline" style="padding: 6px 12px; border-color: var(--danger); color: var(--danger); font-size: 0.9rem;" onclick="deleteDutyConfirm('${d}')">
              <i class="fa-solid fa-trash-can"></i> ลบ
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    function moveDuty(index, direction) {
      if (index + direction < 0 || index + direction >= systemDuties.length) return;

      const temp = systemDuties[index];
      systemDuties[index] = systemDuties[index + direction];
      systemDuties[index + direction] = temp;

      renderDashDuties();
      saveDutyOrder();
    }

    function saveDutyOrder() {
      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(res => {
            showToast('บันทึกลำดับหน้าที่เรียบร้อย');
          })
          .withFailureHandler(error => {
            showToast('บันทึกลำดับไม่สำเร็จ', 'error');
          })
          .reorderDuties(systemDuties);
      }
    }

    function addDutyFromDash() {
      const input = document.getElementById('newDutyName');
      const btn = document.getElementById('btnAddDuty');
      const val = input.value.trim();
      if (!val) return;
      btn.innerHTML = '...'; btn.disabled = true;
      if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(res => {
          systemDuties.push(val);
          input.value = '';
          btn.innerHTML = 'เพิ่มหน้าที่ที่รับผิดชอบ'; btn.disabled = false;
          renderDashDuties();
          showToast(res.message);
        }).withFailureHandler(err => {
          btn.innerHTML = 'เพิ่มหน้าที่ที่รับผิดชอบ'; btn.disabled = false;
          showToast(err.message, 'error');
        }).addDuty(val);
      }
    }

    // --- Status Search ---
    function openStatusSearchModal() {
      document.getElementById('statusSearchInput').value = '';
      document.getElementById('statusResultContainer').style.display = 'none';

      const adminBtn = document.getElementById('btnAdminViewAllStatus');
      if (adminBtn) adminBtn.style.display = isAdmin ? 'block' : 'none';

      document.getElementById('statusSearchModal').classList.add('active');
    }

    function selectStatusStudent(fullName) {
      const inputEl = document.getElementById('statusSearchInput');
      const dropdown = document.getElementById('statusAutocomplete');
      if (inputEl) {
        inputEl.value = fullName;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
      }
    }

    function filterStatusStudents() {
      const inputEl = document.getElementById('statusSearchInput');
      const dropdown = document.getElementById('statusAutocomplete');
      if (!inputEl || !dropdown) return;
      const val = inputEl.value.toLowerCase().trim();
      dropdown.innerHTML = '';

      const filtered = studentNamesList.filter(s => (s.name + (s.grade ? ' ' + s.grade : '')).toLowerCase().includes(val));

      if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      const resultsToShow = filtered.slice(0, 50);
      resultsToShow.forEach(s => {
        const fullName = s.name + (s.grade ? ' ' + s.grade : '');
        const div = document.createElement('div');
        div.textContent = fullName;
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');

        div.onmousedown = function (e) {
          e.preventDefault();
          selectStatusStudent(fullName);
        };

        let touchStartY = 0;
        let touchStartX = 0;
        let isTouchScroll = false;

        div.addEventListener('touchstart', function (e) {
          if (e.touches && e.touches.length > 0) {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            isTouchScroll = false;
          }
        }, { passive: true });

        div.addEventListener('touchmove', function (e) {
          if (e.touches && e.touches.length > 0) {
            const dy = Math.abs(e.touches[0].clientY - touchStartY);
            const dx = Math.abs(e.touches[0].clientX - touchStartX);
            if (dy > 8 || dx > 8) {
              isTouchScroll = true;
            }
          }
        }, { passive: true });

        div.addEventListener('touchend', function (e) {
          if (!isTouchScroll) {
            e.preventDefault();
            selectStatusStudent(fullName);
          }
        });

        div.onclick = function (e) {
          selectStatusStudent(fullName);
        };

        dropdown.appendChild(div);
      });

      dropdown.style.display = 'block';
    }

    function checkMyStatus() {
      const inputEl = document.getElementById('statusSearchInput');
      let name = inputEl ? inputEl.value.trim() : '';
      const btn = document.getElementById('btnStatusSearch');
      const container = document.getElementById('statusResultContainer');

      if (!name) {
        showToast('กรุณากรอกชื่อของคุณ', 'error');
        return;
      }

      const studentObj = studentNamesList.find(s => (s.name + (s.grade ? ' ' + s.grade : '')) === name) ||
                         studentNamesList.find(s => s.name.trim() === name);
      if (studentObj && inputEl) {
        const resolved = studentObj.name + (studentObj.grade ? ' ' + studentObj.grade : '');
        inputEl.value = resolved;
        name = resolved;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';
      container.style.display = 'none';

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (results) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-search"></i> ตรวจสอบสถานะ';

            if (results.length === 0) {
              container.innerHTML = '<div class="empty-state" style="padding: 20px;"><i class="fa-solid fa-circle-info" style="font-size: 2rem;"></i><p>ไม่พบสถานะการลงชื่อปฏิบัติหน้าที่ของคุณในระบบ</p></div>';
            } else {
              let html = '<h3 style="margin-bottom: 15px; font-size: 1.15rem; font-weight: 700; color: var(--primary); text-align: center;">สถานะการปฏิบัติหน้าที่ของคุณ</h3>';

              // Group results by activityTitle + date
              const grouped = {};
              results.forEach(r => {
                const key = r.activityTitle + '|' + r.date;
                if (!grouped[key]) {
                  grouped[key] = {
                    title: r.activityTitle,
                    date: r.date,
                    endDateStr: r.endDateStr,
                    duties: []
                  };
                }
                grouped[key].duties.push(r.duty);
              });

              // Current date string in YYYY-MM-DD format (local time approximation)
              const today = new Date();
              const offset = today.getTimezoneOffset() * 60000;
              const nowStr = (new Date(today.getTime() - offset)).toISOString().split('T')[0];

              for (let key in grouped) {
                const act = grouped[key];
                let dateDisplay = formatThaiDateRange(act.date, act.endDateStr);
                let endDate = act.endDateStr && act.endDateStr !== act.date ? act.endDateStr : act.date;

                let statusBadge = '';
                let borderStyle = '';

                if (nowStr > endDate) {
                  // Past
                  borderStyle = '2px solid var(--danger)';
                  statusBadge = '<span style="background: rgba(244, 63, 94, 0.1); color: var(--danger); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;"><i class="fa-solid fa-clock-rotate-left"></i> กิจกรรมผ่านไปแล้ว</span>';
                } else if (nowStr >= act.date && nowStr <= endDate) {
                  // Ongoing (Today or within date range)
                  borderStyle = '2px solid var(--success)';
                  statusBadge = '<span style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;"><i class="fa-solid fa-spinner fa-spin-pulse"></i> กำลังดำเนินกิจกรรมอยู่</span>';
                } else {
                  // Upcoming (nowStr < act.date)
                  borderStyle = '2px solid var(--success)';
                  statusBadge = '<span style="background: rgba(16, 185, 129, 0.1); color: var(--success); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; white-space: nowrap;"><i class="fa-solid fa-clock"></i> กำลังจะมาถึง</span>';
                }

                html += `
                  <div style="background: var(--card-bg); border: ${borderStyle}; border-radius: 16px; padding: 20px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 8px;">
                      <div style="font-weight: 700; font-size: 1.1rem; color: var(--text-main);">${act.title}</div>
                      ${statusBadge}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px; display: flex; align-items: center; gap: 6px;">
                      <i class="fa-regular fa-calendar" style="color: var(--primary);"></i> ${dateDisplay}
                    </div>
                    <div style="background: rgba(15, 23, 42, 0.02); border-radius: 10px; padding: 12px 15px;">
                      <div style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 10px; font-weight: 600;">หน้าที่ความรับผิดชอบ:</div>
                      <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${act.duties.map(duty => `
                          <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <i class="fa-solid fa-thumbtack" style="color: var(--accent); margin-top: 3px; font-size: 0.9rem;"></i>
                            <span style="color: var(--primary); font-weight: 600; font-size: 1rem;">${duty}</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                `;
              }
              container.innerHTML = html;
            }
            container.style.display = 'block';
          })
          .withFailureHandler(function (error) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-search"></i> ตรวจสอบสถานะ';
            showToast('ตรวจสอบไม่สำเร็จ: ' + error.message, 'error');
          })
          .checkStudentStatus(name);
      } else {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-search"></i> ตรวจสอบสถานะ';
          container.innerHTML = '<div class="empty-state" style="padding: 20px;"><i class="fa-solid fa-circle-info" style="font-size: 2rem;"></i><p>Mock Data: ไม่พบสถานะ</p></div>';
          container.style.display = 'block';
        }, 1000);
      }
    }

    function viewAllStatusAdmin() {
      const btn = document.getElementById('btnAdminViewAllStatus');
      const container = document.getElementById('statusResultContainer');

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังดึงข้อมูล...';
      container.style.display = 'none';

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (results) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-users-viewfinder"></i> ดูรายชื่อทั้งหมด (Admin)';

            if (results.length === 0) {
              container.innerHTML = '<div class="empty-state" style="padding: 20px;"><i class="fa-solid fa-circle-info" style="font-size: 2rem;"></i><p>ยังไม่มีผู้ลงทะเบียนในกิจกรรมที่กำลังจะมาถึง</p></div>';
            } else {
              let html = '<h3 style="margin-bottom: 15px; font-size: 1.1rem; color: var(--primary);">รายชื่อผู้ลงทะเบียนทั้งหมด:</h3>';

              const grouped = {};
              results.forEach(r => {
                if (!grouped[r.activityTitle]) grouped[r.activityTitle] = { date: r.date, users: [] };
                grouped[r.activityTitle].users.push(r);
              });

              for (let title in grouped) {
                const act = grouped[title];
                const dateDisplay = formatThaiDateRange(act.date, act.date);

                html += `<div style="background: rgba(15, 23, 42, 0.03); border-radius: 12px; padding: 15px; margin-bottom: 15px; border-left: 4px solid var(--accent);">`;
                html += `<div style="font-weight: 700; color: var(--text-main); margin-bottom: 5px;">${title}</div>`;
                html += `<div style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 10px;"><i class="fa-regular fa-calendar"></i> ${dateDisplay}</div>`;

                act.users.forEach(u => {
                  html += `<div style="display:flex; justify-content:space-between; padding: 8px 0; border-bottom: 1px dashed rgba(0,0,0,0.1);">
                      <div style="color: var(--text-main); font-size: 0.95rem;"><i class="fa-solid fa-user" style="color:var(--primary); font-size: 0.85rem; margin-right:5px;"></i> ${u.name}</div>
                      <div style="color: var(--accent); font-size: 0.9rem;">${u.duty}</div>
                    </div>`;
                });
                html += `</div>`;
              }

              container.innerHTML = html;
            }
            container.style.display = 'block';
          })
          .withFailureHandler(function (error) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-users-viewfinder"></i> ดูรายชื่อทั้งหมด (Admin)';
            showToast('ดึงข้อมูลไม่สำเร็จ: ' + error.message, 'error');
          })
          .getAllUpcomingSignups();
      } else {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-users-viewfinder"></i> ดูรายชื่อทั้งหมด (Admin)';
          container.innerHTML = '<div class="empty-state" style="padding: 20px;"><i class="fa-solid fa-circle-info" style="font-size: 2rem;"></i><p>Mock Data: แสดงรายชื่อทั้งหมด</p></div>';
          container.style.display = 'block';
        }, 1000);
      }
    }

    let countdownIntervals = {};

    function updateDutySummary() {
      const summaryTextEl = document.getElementById('dashDutySummaryText');
      if (!summaryTextEl) return;

      let selectedDuties = [];
      let totalCount = 0;

      const listContainer = document.getElementById('dynamicDutyList');
      if (listContainer) {
        const rows = listContainer.querySelectorAll('.dynamic-duty-row');
        rows.forEach(row => {
          const select = row.querySelector('.duty-select');
          const input = row.querySelector('.duty-quota');
          if (select && input) {
            const duty = select.value;
            const v = parseInt(input.value) || 0;
            if (duty && v > 0) {
              selectedDuties.push(`${duty} (${v})`);
              totalCount += v;
            }
          }
        });
      }

      if (selectedDuties.length > 0) {
        summaryTextEl.innerHTML = selectedDuties.join(', ') + `<br><strong style="color:var(--primary); display:inline-block; margin-top:5px;">รวมทั้งหมด: ${totalCount} คน</strong>`;
      } else {
        summaryTextEl.innerHTML = 'ยังไม่ได้เลือกหน้าที่ (ใส่โควต้า > 0 เพื่อเลือก)';
      }
    }

    function setupAdminDutyGrid() {
      const container = document.getElementById('dynamicDutyList');
      if (container) {
        container.innerHTML = '';
      }
      updateDutySummary();
    }

    let dragSrcEl = null;

    function handleDragStart(e) {
      dragSrcEl = this;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
      this.style.opacity = '0.4';
    }

    function handleDragOver(e) {
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.dataTransfer.dropEffect = 'move';
      return false;
    }

    function handleDragEnter(e) {
      this.classList.add('over');
    }

    function handleDragLeave(e) {
      this.classList.remove('over');
    }

    function handleDrop(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      if (dragSrcEl !== this) {
        // Swap values manually instead of HTML because inputs lose state
        const srcSelect = dragSrcEl.querySelector('.duty-select');
        const srcInput = dragSrcEl.querySelector('.duty-quota');
        const tgtSelect = this.querySelector('.duty-select');
        const tgtInput = this.querySelector('.duty-quota');

        const tempSelectVal = srcSelect.value;
        const tempInputVal = srcInput.value;

        srcSelect.value = tgtSelect.value;
        srcInput.value = tgtInput.value;

        tgtSelect.value = tempSelectVal;
        tgtInput.value = tempInputVal;

        updateDutySummary();
      }
      return false;
    }

    function handleDragEnd(e) {
      this.style.opacity = '1';
      const rows = document.querySelectorAll('.dynamic-duty-row');
      rows.forEach(function (row) {
        row.classList.remove('over');
      });
    }

    function addDynamicDutyRow(dutyName = '', quota = 0) {
      const container = document.getElementById('dynamicDutyList');
      if (!container) return;

      const div = document.createElement('div');
      div.className = 'dynamic-duty-row';
      div.setAttribute('draggable', 'true');
      div.style.display = 'flex';
      div.style.gap = '10px';
      div.style.alignItems = 'center';
      div.style.background = 'var(--bg)';
      div.style.padding = '10px';
      div.style.borderRadius = '8px';
      div.style.border = '1px solid var(--border-light)';
      div.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
      div.style.transition = 'all 0.2s';

      // Drag events
      div.addEventListener('dragstart', handleDragStart, false);
      div.addEventListener('dragenter', handleDragEnter, false);
      div.addEventListener('dragover', handleDragOver, false);
      div.addEventListener('dragleave', handleDragLeave, false);
      div.addEventListener('drop', handleDrop, false);
      div.addEventListener('dragend', handleDragEnd, false);

      div.innerHTML = `
        <div style="cursor: grab; color: var(--text-dim); padding: 0 5px;" title="จับลากเพื่อเรียงลำดับ">
          <i class="fa-solid fa-grip-vertical"></i>
        </div>
        <div class="duty-custom-select">
          <input type="text" class="input-control duty-select" placeholder="ค้นหาหรือเพิ่มหน้าที่..." value="${dutyName}" style="width: 100%; margin: 0; padding: 8px;" 
                 onfocus="showDutyDropdown(this)" oninput="handleDutySearch(this)">
          <div class="duty-dropdown-list"></div>
        </div>
        <input type="number" inputmode="numeric" pattern="[0-9]*" class="input-control duty-quota" value="${quota}" min="0" style="width: 80px; text-align: center; margin:0; padding:8px;" oninput="updateDutySummary()">
        <button type="button" class="btn btn-icon" style="color: var(--danger); background: rgba(239,68,68,0.1); border:none;" onclick="this.closest('.dynamic-duty-row').remove(); updateDutySummary();" title="ลบ">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      container.appendChild(div);
      updateDutySummary();
    }

    function showDutyDropdown(inputEl) {
      const listEl = inputEl.nextElementSibling;
      // Close other dropdowns
      document.querySelectorAll('.duty-dropdown-list').forEach(el => {
        if (el !== listEl) el.style.display = 'none';
      });
      listEl.style.display = 'block';
      handleDutySearch(inputEl); // populate immediately
    }

    function hideDutyDropdowns() {
      document.querySelectorAll('.duty-dropdown-list').forEach(el => {
        el.style.display = 'none';
      });
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.duty-custom-select')) {
        hideDutyDropdowns();
      }
    });

    function handleDutySearch(inputEl) {
      const listEl = inputEl.nextElementSibling;
      const term = inputEl.value.trim().toLowerCase();
      let html = '';
      let foundExact = false;

      const filtered = systemDuties.filter(d => {
        const match = d.toLowerCase().includes(term);
        if (d.toLowerCase() === term) foundExact = true;
        return match;
      });

      if (filtered.length > 0) {
        filtered.forEach(d => {
          // Escape quotes just in case
          const safeVal = d.replace(/"/g, '&quot;');
          html += `<div class="duty-dropdown-item" onclick="selectDutyOption(this, '${safeVal}', false)">${d}</div>`;
        });
      }

      if (term && !foundExact) {
        const safeTerm = inputEl.value.trim().replace(/"/g, '&quot;');
        html += `<div class="duty-dropdown-item create-new" onclick="selectDutyOption(this, '${safeTerm}', true)">
                   <i class="fa-solid fa-plus-circle"></i> สร้างหน้าที่ "${inputEl.value.trim()}"
                 </div>`;
      }

      if (!html) {
        html = '<div class="duty-dropdown-item" style="color:var(--text-muted); cursor:default;">ไม่พบข้อมูล</div>';
      }

      listEl.innerHTML = html;
      listEl.style.display = 'block';

      // Update summary since input value changed
      updateDutySummary();
    }

    function selectDutyOption(itemEl, value, isNew) {
      const wrapper = itemEl.closest('.duty-custom-select');
      const inputEl = wrapper.querySelector('.duty-select');
      inputEl.value = value;
      wrapper.querySelector('.duty-dropdown-list').style.display = 'none';

      if (isNew) {
        // Add to local systemDuties so it shows up in future searches
        if (!systemDuties.includes(value)) {
          systemDuties.push(value);
        }
        // Optionally save to backend immediately
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.addDuty(value);
        }
      }
      updateDutySummary();
    }

    let feedRealtimeInterval = null;

    function startFeedRealtimeSync() {
      if (feedRealtimeInterval) {
        clearInterval(feedRealtimeInterval);
      }
      feedRealtimeInterval = setInterval(() => {
        // Only fetch if the user is actually looking at the page
        if (!document.hidden) {
          fetchFeedRealtimeData();
        }
      }, 5000); // Poll every 5 seconds
    }

    function stopFeedRealtimeSync() {
      if (feedRealtimeInterval) {
        clearInterval(feedRealtimeInterval);
        feedRealtimeInterval = null;
      }
    }

    function fetchFeedRealtimeData() {
      if (typeof google !== 'undefined' && google.script) {
        let runner = google.script.run
          .withSuccessHandler(function (activities) {
            try {
              const newActivities = activities || [];
              const oldSheetNames = currentActivities.map(a => a.sheetName);
              // Only update DOM if the data has actually changed
              if (JSON.stringify(currentActivities) !== JSON.stringify(newActivities)) {
                currentActivities = newActivities;

                window.newActivitySheetNames = currentActivities
                  .map(a => a.sheetName)
                  .filter(sn => !oldSheetNames.includes(sn));

                if (currentFeedView === 'calendar') {
                  buildCalendar();
                } else {
                  buildFeed(currentActivities);
                }

                window.newActivitySheetNames = null;
              }
            } catch (err) {
              console.error('Error parsing realtime feed data:', err);
            }
          })
          .withFailureHandler(function (error) {
            console.error('Realtime feed poll failed:', error);
          });

        if (isAdmin) {
          runner.getAllActivities();
        } else {
          runner.getUpcomingActivities();
        }
      }
    }

    function loadUpcomingActivities() {
      setupAdminDutyGrid();
      renderActivityFeed();
      startFeedRealtimeSync();
    }

    function renderActivityFeed() {
      const feed = document.getElementById('feedContent');
      feed.innerHTML = '';

      const feedLoading = document.getElementById('feedLoading');
      if (feedLoading.innerHTML.indexOf('skeletonContainer') === -1) {
        // Re-inject skeleton if it was overwritten by error message
        feedLoading.innerHTML = `
          <div id="skeletonContainer" class="${currentFeedView === 'list' ? 'list-view' : ''}" style="${currentFeedView === 'list' ? 'display: flex; flex-direction: column;' : 'display: grid;'}">
            <div class="activity-card skeleton-card" style="border: 1px solid var(--border-light); pointer-events: none; background: var(--card-bg);">
              <div class="card-left" style="width: 100%;">
                <div class="skeleton" style="width: 120px; height: 26px; border-radius: 8px; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 70%; height: 32px; border-radius: 8px; margin-bottom: 16px;"></div>
                <div class="skeleton" style="width: 90%; height: 20px; border-radius: 6px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 60%; height: 20px; border-radius: 6px;"></div>
              </div>
              <div class="card-right">
                <div class="skeleton" style="width: 100px; height: 32px; border-radius: 20px; align-self: flex-end; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 100%; height: 50px; border-radius: 12px; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 100%; height: 48px; border-radius: 12px;"></div>
              </div>
            </div>
            <div class="activity-card skeleton-card" style="border: 1px solid var(--border-light); pointer-events: none; background: var(--card-bg);">
              <div class="card-left" style="width: 100%;">
                <div class="skeleton" style="width: 120px; height: 26px; border-radius: 8px; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 50%; height: 32px; border-radius: 8px; margin-bottom: 16px;"></div>
                <div class="skeleton" style="width: 80%; height: 20px; border-radius: 6px; margin-bottom: 8px;"></div>
                <div class="skeleton" style="width: 40%; height: 20px; border-radius: 6px;"></div>
              </div>
              <div class="card-right">
                <div class="skeleton" style="width: 100px; height: 32px; border-radius: 20px; align-self: flex-end; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 100%; height: 50px; border-radius: 12px; margin-bottom: 12px;"></div>
                <div class="skeleton" style="width: 100%; height: 48px; border-radius: 12px;"></div>
              </div>
            </div>
          </div>
        `;
      }

      document.getElementById('feedLoading').style.display = 'block';

      if (typeof google !== 'undefined' && google.script) {
        let runner = google.script.run
          .withSuccessHandler(function (activities) {
            try {
              currentActivities = activities || [];
              if (currentFeedView === 'calendar') {
                buildCalendar();
                document.getElementById('feedContent').style.display = 'none';
                document.getElementById('calendarContent').style.display = 'block';
              } else {
                buildFeed(currentActivities);
              }
              document.getElementById('feedLoading').style.display = 'none';
              const rBtn = document.getElementById('btnRefreshData');
              if (rBtn) {
                rBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> รีเฟรชข้อมูล';
                rBtn.disabled = false;
              }
            } catch (err) {
              console.error(err);
              document.getElementById('feedLoading').innerHTML = '<div style="color:red">พบปัญหาการเรนเดอร์ข้อมูล: ' + err.message.replace(/^Error:\s*/, '') + '<br>' + err.stack + '</div>';
            }
          })
          .withFailureHandler(function (error) {
            let safeMsg = error.message.replace(/^Error:\s*/, '');
            showToast(safeMsg, 'error');
            document.getElementById('feedLoading').innerHTML = '<div style="color:red; padding: 20px; text-align: center; font-weight: 600;">' + safeMsg + '</div>';
            const rBtn = document.getElementById('btnRefreshData');
            if (rBtn) {
              rBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> รีเฟรชข้อมูล';
              rBtn.disabled = false;
            }
          });

        if (isAdmin) {
          runner.getAllActivities();
        } else {
          runner.getUpcomingActivities();
        }
      } else {
        // Mock data
        currentActivities = [
          {
            date: new Date().toISOString().split('T')[0],
            title: 'ตรวจแถวเช้า',
            description: 'ดูแลความเรียบร้อยหน้าเสาธง',
            duties: [{ duty: "ประตู 1", quota: 2 }, { duty: "อาคาร 3", quota: 1 }],
            sheetName: 'mock_sheet_123',
            deadline: new Date().getTime() + 50000 // 50 seconds from now
          }
        ];
        setTimeout(() => {
          if (currentFeedView === 'calendar') {
            buildCalendar();
            document.getElementById('feedContent').style.display = 'none';
            document.getElementById('calendarContent').style.display = 'block';
          } else {
            buildFeed(currentActivities);
          }
          document.getElementById('feedLoading').style.display = 'none';
        }, 500);
      }
    }

    function updateViewToggleIndicator(view) {
      const container = document.getElementById('feedViewToggle') || document.querySelector('.view-toggle');
      const indicator = document.getElementById('viewToggleIndicator');
      if (!container || !indicator) return;

      let btnId = 'btnViewList';
      if (view === 'grid') btnId = 'btnViewGrid';
      else if (view === 'calendar') btnId = 'btnViewCalendar';

      const targetBtn = document.getElementById(btnId);
      if (!targetBtn || targetBtn.offsetParent === null) {
        const active = container.querySelector('.view-btn.active');
        if (active && active.offsetParent !== null) {
          indicator.style.transform = 'translateX(' + active.offsetLeft + 'px)';
          indicator.style.width = active.offsetWidth + 'px';
          indicator.style.opacity = '1';
        }
        return;
      }

      indicator.style.transform = 'translateX(' + targetBtn.offsetLeft + 'px)';
      indicator.style.width = targetBtn.offsetWidth + 'px';
      indicator.style.opacity = '1';
    }

    function changeFeedView(view) {
      currentFeedView = view;
      const btnGrid = document.getElementById('btnViewGrid');
      const btnList = document.getElementById('btnViewList');
      const btnCal = document.getElementById('btnViewCalendar');

      if (btnGrid) { btnGrid.classList.remove('active'); btnGrid.setAttribute('aria-selected', 'false'); }
      if (btnList) { btnList.classList.remove('active'); btnList.setAttribute('aria-selected', 'false'); }
      if (btnCal) { btnCal.classList.remove('active'); btnCal.setAttribute('aria-selected', 'false'); }

      const feedContent = document.getElementById('feedContent');
      const calendarContent = document.getElementById('calendarContent');
      const skeletonContainer = document.getElementById('skeletonContainer');

      if (view === 'grid') {
        if (btnGrid) { btnGrid.classList.add('active'); btnGrid.setAttribute('aria-selected', 'true'); }
        feedContent.className = '';
        feedContent.style.display = 'grid';
        if (skeletonContainer) {
          skeletonContainer.className = '';
          skeletonContainer.style.display = 'grid';
        }
        calendarContent.style.display = 'none';
        buildFeed(currentActivities);
        feedContent.classList.remove('view-transition-in');
        void feedContent.offsetWidth;
        feedContent.classList.add('view-transition-in');
      } else if (view === 'list') {
        if (btnList) { btnList.classList.add('active'); btnList.setAttribute('aria-selected', 'true'); }
        feedContent.className = 'list-view';
        feedContent.style.display = 'flex';
        if (skeletonContainer) {
          skeletonContainer.className = 'list-view';
          skeletonContainer.style.display = 'flex';
        }
        calendarContent.style.display = 'none';
        buildFeed(currentActivities);
        feedContent.classList.remove('view-transition-in');
        void feedContent.offsetWidth;
        feedContent.classList.add('view-transition-in');
      } else if (view === 'calendar') {
        if (btnCal) { btnCal.classList.add('active'); btnCal.setAttribute('aria-selected', 'true'); }
        feedContent.style.display = 'none';
        calendarContent.style.display = 'block';
        buildCalendar();
        calendarContent.classList.remove('view-transition-in');
        void calendarContent.offsetWidth;
        calendarContent.classList.add('view-transition-in');
      }

      updateViewToggleIndicator(view);
    }

    function changeMonth(offset) {
      currentCalendarMonth += offset;
      if (currentCalendarMonth > 11) {
        currentCalendarMonth = 0;
        currentCalendarYear++;
      } else if (currentCalendarMonth < 0) {
        currentCalendarMonth = 11;
        currentCalendarYear--;
      }
      buildCalendar();
    }

    function buildCalendar() {
      const calendarContent = document.getElementById('calendarContent');

      const firstDay = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay();
      const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();

      let html = `
        <div class="calendar-container">
          <div class="calendar-header">
            <button class="calendar-nav-btn" onclick="changeMonth(-1)"><i class="fa-solid fa-chevron-left"></i></button>
            <div class="calendar-month-title">${monthNamesThai[currentCalendarMonth]} ${currentCalendarYear + 543}</div>
            <button class="calendar-nav-btn" onclick="changeMonth(1)"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-day-header">อา.</div>
            <div class="calendar-day-header">จ.</div>
            <div class="calendar-day-header">อ.</div>
            <div class="calendar-day-header">พ.</div>
            <div class="calendar-day-header">พฤ.</div>
            <div class="calendar-day-header">ศ.</div>
            <div class="calendar-day-header">ส.</div>
      `;

      for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
      }

      // SLOT ALLOCATION ALGORITHM
      let daySlots = {};
      for (let i = 1; i <= daysInMonth; i++) daySlots[i] = [];

      let activitiesInMonth = [];
      const colors = ['cal-color-0', 'cal-color-1', 'cal-color-2', 'cal-color-3', 'cal-color-4'];

      currentActivities.forEach(act => {
        if (!act.date) return;
        const dParts = act.date.split('-');
        let sd = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2]));
        let ed = sd;
        if (act.endDateStr) {
          const eParts = act.endDateStr.split('-');
          if (eParts.length === 3) {
            ed = new Date(parseInt(eParts[0]), parseInt(eParts[1]) - 1, parseInt(eParts[2]));
          }
        }

        let mStart = new Date(currentCalendarYear, currentCalendarMonth, 1);
        let mEnd = new Date(currentCalendarYear, currentCalendarMonth, daysInMonth, 23, 59, 59);

        if (ed < mStart || sd > mEnd) return;

        let sDay = 1;
        let eDay = daysInMonth;
        if (sd >= mStart) sDay = sd.getDate();
        if (ed <= mEnd) eDay = ed.getDate();

        let hash = 0;
        for (let i = 0; i < act.title.length; i++) hash = act.title.charCodeAt(i) + ((hash << 5) - hash);
        let colorClass = colors[Math.abs(hash) % colors.length];

        activitiesInMonth.push({ act, sDay, eDay, originalStart: sd, originalEnd: ed, colorClass });
      });

      activitiesInMonth.sort((a, b) => {
        if (a.sDay !== b.sDay) return a.sDay - b.sDay;
        return (b.eDay - b.sDay) - (a.eDay - a.sDay);
      });

      activitiesInMonth.forEach(item => {
        let slot = 0;
        let found = false;
        while (!found) {
          let conflict = false;
          for (let d = item.sDay; d <= item.eDay; d++) {
            if (daySlots[d][slot]) {
              conflict = true;
              break;
            }
          }
          if (conflict) {
            slot++;
          } else {
            found = true;
            for (let d = item.sDay; d <= item.eDay; d++) {
              daySlots[d][slot] = item;
            }
          }
        }
      });

      const today = new Date();

      for (let i = 1; i <= daysInMonth; i++) {
        const isToday = today.getDate() === i && today.getMonth() === currentCalendarMonth && today.getFullYear() === currentCalendarYear;
        const todayClass = isToday ? 'today' : '';

        let chipsHtml = '';
        let slotsForDay = daySlots[i];
        let maxSlot = slotsForDay.length > 0 ? slotsForDay.length - 1 : -1;

        for (let s = 0; s <= maxSlot; s++) {
          let item = slotsForDay[s];
          if (!item) {
            chipsHtml += `<div class="calendar-activity-chip" style="visibility: hidden; opacity: 0; pointer-events: none;"></div>`;
            continue;
          }

          let act = item.act;
          let now = new Date().getTime();
          let isExpired = act.deadline && (act.deadline - now < 0);

          let currentDayObj = new Date(currentCalendarYear, currentCalendarMonth, i);
          let currentDayOfWeek = currentDayObj.getDay();

          let isStart = currentDayObj.getTime() === item.originalStart.getTime();
          let isEnd = currentDayObj.getTime() === item.originalEnd.getTime();

          let connectLeft = !isStart && currentDayOfWeek !== 0 && i !== 1;
          let connectRight = !isEnd && currentDayOfWeek !== 6 && i !== daysInMonth;

          let spanClass = '';
          if (connectLeft && connectRight) spanClass = ' middle';
          else if (connectLeft && !connectRight) spanClass = ' end';
          else if (!connectLeft && connectRight) spanClass = ' start';

          let colorClass = isExpired ? 'cal-color-expired' : item.colorClass;
          let titleHtml = (!connectLeft) ? act.title : `<span>${act.title}</span>`;

          chipsHtml += `<div class="calendar-activity-chip ${colorClass}${spanClass}" onclick='openModalWithSheetName("${act.sheetName}")' title="${act.title}">${titleHtml}</div>`;
        }

        html += `
          <div class="calendar-day ${todayClass}">
            <div class="calendar-date-num">${i}</div>
            ${chipsHtml}
          </div>
        `;
      }

      let totalCells = firstDay + daysInMonth;
      let remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
      for (let i = 0; i < remainingCells; i++) {
        html += `<div class="calendar-day empty"></div>`;
      }

      html += `</div></div>`;
      calendarContent.innerHTML = html;
    }

    function openModalWithSheetName(sheetName) {
      if (window.RosterAudio && typeof window.RosterAudio.isRecentDrag === 'function' && window.RosterAudio.isRecentDrag()) {
        return;
      }
      const act = currentActivities.find(a => a.sheetName === sheetName);
      if (act) {
        openModal(act);
      }
    }

    function startCountdown(elementId, deadlineTs, badgeId, cardId, onExpire, isWaitingToOpen = false) {
      if (countdownIntervals[elementId]) clearInterval(countdownIntervals[elementId]);

      const updateTimer = () => {
        const now = new Date().getTime();
        const distance = deadlineTs - now;
        const el = document.getElementById(elementId);
        const badgeEl = badgeId ? document.getElementById(badgeId) : document.getElementById('badge-' + elementId);
        const cardEl = cardId ? document.getElementById(cardId) : null;
        if (!el) {
          clearInterval(countdownIntervals[elementId]);
          return;
        }

        if (distance < 0) {
          clearInterval(countdownIntervals[elementId]);
          el.innerHTML = "หมดเวลา";
          if (badgeEl) {
            badgeEl.style.backgroundColor = '#ffffff';
            badgeEl.style.color = 'var(--danger)';
          }
          if (cardEl) cardEl.className = 'activity-card card-status-closed';
          if (onExpire) onExpire();
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        let display = "";
        if (days > 0) display += days + "วัน ";
        display += String(hours).padStart(2, '0') + ":" + String(minutes).padStart(2, '0') + ":" + String(seconds).padStart(2, '0');
        el.innerHTML = display;

        if (badgeEl) {
          if (isWaitingToOpen) {
            badgeEl.style.backgroundColor = '#ffffff';
            badgeEl.style.color = 'var(--accent)';
            if (cardEl) cardEl.className = 'activity-card card-status-waiting';
          } else {
            const hoursLeft = Math.floor(distance / (1000 * 60 * 60));
            if (hoursLeft < 1) {
              badgeEl.style.backgroundColor = '#ffffff';
              badgeEl.style.color = 'var(--warning)';
              if (cardEl) cardEl.className = 'activity-card card-status-warning';
            } else {
              badgeEl.style.backgroundColor = '#ffffff';
              badgeEl.style.color = 'var(--success)';
              if (cardEl) cardEl.className = 'activity-card card-status-open';
            }
          }
        }
      };

      updateTimer();
      countdownIntervals[elementId] = setInterval(updateTimer, 1000);
    }

    function buildFeed(activities) {
      // Clear all existing card timers to prevent interval leaks
      for (let key in countdownIntervals) {
        if (key.startsWith('card-timer-')) {
          clearInterval(countdownIntervals[key]);
          delete countdownIntervals[key];
        }
      }

      const feed = document.getElementById('feedContent');
      feed.innerHTML = '';

      const nowObj = new Date();
      nowObj.setHours(0, 0, 0, 0);
      const todayMs = nowObj.getTime();
      const currentMs = new Date().getTime();

      const searchInput = document.getElementById('activitySearchInput');
      const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

      const feedActivities = [];
      const pastAdminActs = [];

      activities.forEach(act => {
        let evtDate = 0;
        if (act.date) {
          const dParts = act.date.split('-');
          evtDate = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2])).getTime();
        }
        if (act.endDateStr) {
          const eParts = act.endDateStr.split('-');
          if (eParts.length === 3) {
            evtDate = new Date(parseInt(eParts[0]), parseInt(eParts[1]) - 1, parseInt(eParts[2])).getTime();
          }
        }

        let isFutureDeadline = act.deadline && (act.deadline >= currentMs);
        let isPast = (evtDate < todayMs) && !isFutureDeadline;

        // Search filter
        if (searchQuery !== '') {
          const actTitle = act.title ? act.title.toLowerCase() : '';
          const actDesc = act.description ? act.description.toLowerCase() : '';
          if (!actTitle.includes(searchQuery) && !actDesc.includes(searchQuery)) {
            return;
          }
        }

        if (isPast) {
          if (isAdmin) {
            pastAdminActs.push(act);
          }
        } else {
          feedActivities.push(act);
        }
      });

      feedActivities.sort((a, b) => {
        let tA = new Date(a.date).getTime();
        let tB = new Date(b.date).getTime();
        if (tA !== tB) return tA - tB;
        let timeA = a.startTime ? a.startTime : 0;
        let timeB = b.startTime ? b.startTime : 0;
        return timeA - timeB;
      });

      pastAdminActs.sort((a, b) => {
        let tA = new Date(a.date).getTime();
        let tB = new Date(b.date).getTime();
        if (tA !== tB) return tB - tA; // Sort past activities descending
        let timeA = a.startTime ? a.startTime : 0;
        let timeB = b.startTime ? b.startTime : 0;
        return timeB - timeA;
      });

      let activeActs = [];
      let inactiveActs = [];

      feedActivities.forEach(act => {
        let isExpired = false;
        if (act.isFull) {
          isExpired = true;
        } else if (act.deadline && (act.deadline - currentMs < 0)) {
          isExpired = true;
        }
        if (isExpired) {
          inactiveActs.push(act);
        } else {
          activeActs.push(act);
        }
      });

      const finalFeedActivities = activeActs.concat(inactiveActs).concat(pastAdminActs);

      if (finalFeedActivities.length === 0) {
        feed.innerHTML = `
          <div class="empty-state">
            <i class="fa-regular fa-calendar-xmark"></i>
            <h3>ไม่พบกิจกรรม</h3>
            <p>โปรดกลับมาตรวจสอบใหม่ภายหลัง หรือเปลี่ยนคำค้นหา</p>
          </div>
        `;
        return;
      }

      let renderedInactiveDivider = false;
      let renderedPastDivider = false;

      finalFeedActivities.forEach((act, index) => {
        let isExpired = false;
        if (act.isFull) {
          isExpired = true;
        } else if (act.deadline && (act.deadline - currentMs < 0)) {
          isExpired = true;
        }

        let evtDate = 0;
        if (act.date) {
          const dParts = act.date.split('-');
          evtDate = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2])).getTime();
        }
        if (act.endDateStr) {
          const eParts = act.endDateStr.split('-');
          if (eParts.length === 3) {
            evtDate = new Date(parseInt(eParts[0]), parseInt(eParts[1]) - 1, parseInt(eParts[2])).getTime();
          }
        }
        let isPast = (evtDate < todayMs) && !(act.deadline && act.deadline >= currentMs);

        if (isPast && isAdmin && !renderedPastDivider) {
          const divider = document.createElement('div');
          divider.className = 'group-divider';
          divider.innerHTML = `<span><i class="fa-solid fa-clock-rotate-left"></i> กิจกรรมที่ผ่านไปแล้ว (Admin only)</span>`;
          feed.appendChild(divider);
          renderedPastDivider = true;
        } else if (isExpired && !isPast && !renderedInactiveDivider && activeActs.length > 0) {
          const divider = document.createElement('div');
          divider.className = 'group-divider';
          divider.innerHTML = `<span><i class="fa-solid fa-box-archive"></i> ปิดรับลงชื่อแล้ว</span>`;
          feed.appendChild(divider);
          renderedInactiveDivider = true;
        }

        const card = document.createElement('div');
        const cardId = 'activity-card-' + index;
        card.id = cardId;
        card.className = 'activity-card';

        if (window.newActivitySheetNames) {
          if (window.newActivitySheetNames.includes(act.sheetName)) {
            card.style.animationDelay = `${index * 0.08}s`;
          } else {
            card.style.animation = 'none';
          }
        } else {
          card.style.animationDelay = `${index * 0.08}s`;
        }

        card.onclick = () => {
          if (window.RosterAudio && typeof window.RosterAudio.isRecentDrag === 'function' && window.RosterAudio.isRecentDrag()) return;
          openModal(act);
        };

        let dateDisplay = formatThaiDateRange(act.date, act.endDateStr);

        let timerHtml = '';
        let timerId = 'card-timer-' + index;
        isExpired = false;
        let isNotStarted = false;
        let now = new Date().getTime();

        if (act.startTime) {
          const distStart = act.startTime - now;
          isNotStarted = distStart > 0;
        }

        let statusHtml = '';

        if (act.isFull) {
          isExpired = true;
          const badgeStyle = "color: #ffffff; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); width: fit-content;";
          statusHtml = `<span class="status-badge" style="background-color: var(--danger); ${badgeStyle}"><i class="fa-solid fa-lock"></i> ปิดรับแล้ว</span>`;
          card.className = 'activity-card card-status-closed';
          timerHtml = `
            <div class="countdown-badge expired" id="badge-${timerId}">
              <i class="fa-solid fa-users-slash"></i>
              <span id="${timerId}">คนลงชื่อเต็มแล้ว</span>
            </div>
          `;
        } else if (act.deadline) {
          const distance = act.deadline - now;
          isExpired = distance < 0;

          const badgeStyle = "color: #ffffff; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); width: fit-content;";
          if (isNotStarted) {
            statusHtml = `<span class="status-badge" style="background-color: var(--waiting); ${badgeStyle}"><i class="fa-regular fa-clock"></i> รอเปิด</span>`;
            card.className = 'activity-card card-status-waiting';
          } else if (isExpired) {
            statusHtml = `<span class="status-badge" style="background-color: var(--danger); ${badgeStyle}"><i class="fa-solid fa-lock"></i> ปิดรับแล้ว</span>`;
            card.className = 'activity-card card-status-closed';
          } else {
            const hoursLeft = Math.floor(distance / (1000 * 60 * 60));
            if (hoursLeft < 1) {
              statusHtml = `<span class="status-badge" style="background-color: var(--warning); ${badgeStyle}"><i class="fa-solid fa-hourglass-half"></i> ใกล้หมดเวลา</span>`;
              card.className = 'activity-card card-status-warning';
            } else {
              statusHtml = `<span class="status-badge" style="background-color: var(--success); ${badgeStyle}"><i class="fa-solid fa-door-open"></i> เปิดรับ</span>`;
              card.className = 'activity-card card-status-open';
            }
          }

          timerHtml = `
            <div class="countdown-badge ${isExpired ? 'expired' : ''}" id="badge-${timerId}">
              <i class="fa-solid fa-clock"></i>
              <span id="${timerId}">${isExpired ? 'หมดเวลาลงชื่อ' : (isNotStarted ? 'รอเปิดลงชื่อ...' : 'กำลังคำนวณ...')}</span>
            </div>
          `;
        } else if (isNotStarted) {
          timerHtml = `
            <div class="countdown-badge" id="badge-${timerId}">
              <i class="fa-solid fa-clock"></i>
              <span id="${timerId}">รอเปิดลงชื่อ...</span>
            </div>
          `;
        }

        let eventStartDateMs = 0;
        if (act.date) {
          const dParts = act.date.split('-');
          eventStartDateMs = new Date(parseInt(dParts[0]), parseInt(dParts[1]) - 1, parseInt(dParts[2])).getTime();
        }
        let eventRefTime = eventStartDateMs; // Count down to the activity date, not sign-up time
        let diffMsTime = eventRefTime - now;
        let isFutureTime = diffMsTime >= 0;
        let absDiffMsTime = Math.abs(diffMsTime);
        let diffHoursTime = Math.floor(absDiffMsTime / (1000 * 60 * 60));
        let diffDaysTime = Math.floor(diffHoursTime / 24);

        let timeRemainingText = '';
        if (diffHoursTime >= 24) {
          timeRemainingText = (isFutureTime ? 'อีก ' : 'ผ่านไปแล้ว ') + diffDaysTime + ' วัน';
        } else {
          let displayHours = diffHoursTime === 0 ? 1 : diffHoursTime;
          timeRemainingText = (isFutureTime ? 'อีก ' : 'ผ่านไปแล้ว ') + displayHours + ' ชั่วโมง';
        }
        let timeRemainingBadge = `<div style="font-size: 0.85rem; background: ${isFutureTime ? '#ffffff' : '#F1F5F9'}; color: ${isFutureTime ? '#000000' : '#64748B'}; padding: 5px 12px; border-radius: 8px; font-weight: 800; border: 1px solid ${isFutureTime ? 'rgba(0,0,0,0.1)' : '#E2E8F0'}; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><i class="fa-solid ${isFutureTime ? 'fa-clock' : 'fa-clock-rotate-left'}"></i> ${timeRemainingText}</div>`;

        card.innerHTML = `
          <div class="card-left">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <div class="card-date"><i class="fa-regular fa-calendar-check"></i> ${dateDisplay}</div>
              ${timeRemainingBadge}
            </div>
            <div class="card-title">${act.title}</div>
            <div class="card-desc toastui-editor-contents" style="margin-bottom: 5px;">${act.description ? marked.parse(act.description) : ''}</div>
            ${(() => {
            if (!act.creatorName) return '';
            const parts = act.creatorName.split('|');
            const creator = parts[0];
            const editor = parts.length > 1 ? parts[parts.length - 1] : null;
            let html = `<div class="card-creator" style="font-size: 0.9rem; color: #000000; font-weight: 700; margin-top: 8px;"><i class="fa-solid fa-user-pen"></i> สร้างโดย: ${creator}</div>`;
            if (editor && editor !== creator) {
              html += `<div class="card-editor" style="font-size: 0.9rem; color: #000000; font-weight: 700; margin-top: 4px;"><i class="fa-solid fa-user-edit"></i> แก้ไขล่าสุดโดย: ${editor}</div>`;
            }
            return html;
          })()}
          </div>
          <div class="card-right">
            ${statusHtml}
            ${timerHtml}
            <button class="action-btn ${isExpired ? 'disabled' : ''}">
              ${isExpired ? 'ดูรายละเอียด' : 'ลงชื่อปฏิบัติหน้าที่'} <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        `;

        feed.appendChild(card);

        if (isNotStarted && act.startTime) {
          startCountdown(timerId, act.startTime, 'badge-' + timerId, cardId, () => {
            loadUpcomingActivities(); // reload feed when start time is reached
          }, true);
        } else if (act.deadline && !isExpired) {
          startCountdown(timerId, act.deadline, 'badge-' + timerId, cardId, () => {
            const badgeEl = document.getElementById('badge-' + timerId);
            if (badgeEl) badgeEl.classList.add('expired');
            const btn = card.querySelector('.action-btn');
            if (btn) {
              btn.classList.add('disabled');
              btn.innerHTML = 'ดูรายละเอียด <i class="fa-solid fa-arrow-right"></i>';
            }
          });
        }
      });
    }

    // --- Detail Modal ---
    function openModal(activity) {
      if (window.RosterAudio && typeof window.RosterAudio.isRecentDrag === 'function' && window.RosterAudio.isRecentDrag()) {
        return;
      }
      if (countdownIntervals['modalTimerValue']) {
        clearInterval(countdownIntervals['modalTimerValue']);
      }

      selectedDateInfo = { activity, signups: [] };
      let dateDisplay = formatThaiDateRange(activity.date, activity.endDateStr);

      document.getElementById('modalDate').querySelector('span').textContent = dateDisplay;
      document.getElementById('modalTitle').textContent = activity.title;
      if (activity.description && activity.description.trim() !== '') {
        document.getElementById('modalDescTitle').style.display = 'block';
        document.getElementById('modalDesc').style.display = 'block';
        document.getElementById('modalDesc').innerHTML = marked.parse(activity.description);
      } else {
        document.getElementById('modalDescTitle').style.display = 'none';
        document.getElementById('modalDesc').style.display = 'none';
      }

      // removed creatorName display in modal

      const timerContainer = document.getElementById('modalTimerContainer');
      const timerValue = document.getElementById('modalTimerValue');
      const timerText = document.getElementById('modalTimerText');

      timerContainer.classList.remove('expired');

      let now = new Date().getTime();
      let isNotStarted = activity.startTime && (activity.startTime > now);

      if (activity.isFull) {
        timerContainer.style.display = 'flex';
        timerContainer.classList.add('expired');
        timerText.innerHTML = '<i class="fa-solid fa-users-slash"></i> สถานะ:';
        timerValue.textContent = 'คนลงชื่อเต็มแล้ว';
      } else if (isNotStarted) {
        timerContainer.style.display = 'flex';
        timerText.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> เปิดลงชื่ออีก:';
        startCountdown('modalTimerValue', activity.startTime, null, null, () => {
          openModal(activity); // Reload when open
        });
      } else if (activity.deadline) {
        timerContainer.style.display = 'flex';
        const distance = activity.deadline - now;
        if (distance < 0) {
          timerContainer.classList.add('expired');
          timerText.innerHTML = '<i class="fa-solid fa-clock"></i> สถานะ:';
          timerValue.textContent = 'หมดเวลาลงชื่อ';
        } else {
          timerText.innerHTML = '<i class="fa-solid fa-hourglass-half"></i> หมดเวลาลงชื่อในอีก:';
          startCountdown('modalTimerValue', activity.deadline, null, null, () => {
            timerContainer.classList.add('expired');
            timerText.innerHTML = '<i class="fa-solid fa-clock"></i> สถานะ:';
            timerValue.textContent = 'หมดเวลาลงชื่อ';
            loadSignups(activity.sheetName, activity.duties); // reload to disable buttons
          });
        }
      } else {
        timerContainer.style.display = 'none';
      }

      document.getElementById('adminEditBtnContainer').style.display = isAdmin ? 'block' : 'none';
      document.getElementById('detailModal').classList.add('active');
      loadSignups(activity.sheetName, activity.duties);
    }

    function closeModal(modalId) {
      document.getElementById(modalId).classList.remove('active');
      if (modalId === 'detailModal') { stopRealtimeSync(); }
    }

    // --- Custom Modal Utilities ---
    let customConfirmCallback = null;
    function showCustomConfirm(message, onConfirm) {
      document.getElementById('customConfirmMessage').innerText = message;
      customConfirmCallback = onConfirm;
      document.getElementById('customConfirmModal').classList.add('active');
    }
    document.getElementById('btnCustomConfirmOk')?.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeModal('customConfirmModal');
      if (customConfirmCallback) {
        customConfirmCallback();
        customConfirmCallback = null;
      }
    });

    let customPromptCallback = null;
    function showCustomPrompt(title, label, defaultValue, onSubmit) {
      document.getElementById('customPromptTitle').innerHTML = '<i class="fa-solid fa-pen-to-square" style="margin-right:10px; color:var(--accent);"></i> ' + title;
      document.getElementById('customPromptLabel').innerText = label;
      const input = document.getElementById('customPromptInput');
      input.value = defaultValue || '';
      customPromptCallback = onSubmit;
      document.getElementById('customPromptModal').classList.add('active');
      setTimeout(() => input.focus(), 100);
    }
    document.getElementById('btnCustomPromptSubmit')?.addEventListener('click', function () {
      const val = document.getElementById('customPromptInput').value;
      closeModal('customPromptModal');
      if (customPromptCallback) customPromptCallback(val);
    });

    let editStudentCallback = null;
    function showEditStudentModal(oldName, oldGrade, onSubmit) {
      document.getElementById('editStudentNameInput').value = oldName || '';
      document.getElementById('editStudentGradeInput').value = oldGrade || '';
      editStudentCallback = onSubmit;
      document.getElementById('editStudentModal').classList.add('active');
    }
    document.getElementById('btnEditStudentSubmit')?.addEventListener('click', function () {
      const newName = document.getElementById('editStudentNameInput').value.trim();
      const newGrade = document.getElementById('editStudentGradeInput').value.trim();
      closeModal('editStudentModal');
      if (editStudentCallback) editStudentCallback(newName, newGrade);
    });

    function loadSignups(sheetName, duties) {
      const container = document.getElementById('dutiesContainer');
      container.innerHTML = '';
      document.getElementById('btnBulkDelete').style.display = 'none';
      document.getElementById('modalLoading').style.display = 'flex';

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (signups) {
            selectedDateInfo.signups = signups; // Save for frontend validation
            renderDuties(duties, signups);
            document.getElementById('modalLoading').style.display = 'none';
          })
          .withFailureHandler(function (error) {
            showToast('เกิดข้อผิดพลาดในการโหลดรายชื่อ', 'error');
            document.getElementById('modalLoading').style.display = 'none';
          })
          .getSignupsForActivity(sheetName);
      } else {
        setTimeout(() => {
          let mockSignups = [{ duty: 'ประตู 1', name: 'นายสมชาย ใจดี', row: 2 }];
          selectedDateInfo.signups = mockSignups;
          renderDuties(duties, mockSignups);
          document.getElementById('modalLoading').style.display = 'none';
        }, 500);
      }
    }

    
    function isStudentHighlighted(s, dutyName) {
      if (!window.lastRegisteredInfo) return false;
      if (window.lastRegisteredInfo.duty !== dutyName) return false;
      if (Date.now() - window.lastRegisteredInfo.timestamp > 300000) return false;

      const targetName = (window.lastRegisteredInfo.name || '').trim().toLowerCase();
      const signupName = (s.name || '').trim().toLowerCase();

      if (targetName === signupName) return true;
      if (signupName.startsWith(targetName) || targetName.startsWith(signupName)) return true;

      const cleanTarget = targetName.replace(/^(นาย|นางสาว|ด\.ช\.|ด\.ญ\.)\s*/, '').trim();
      const cleanSignup = signupName.replace(/^(นาย|นางสาว|ด\.ช\.|ด\.ญ\.)\s*/, '').trim();
      if (cleanTarget && cleanSignup && (cleanTarget === cleanSignup || cleanSignup.startsWith(cleanTarget))) return true;

      return false;
    }

    function renderDuties(dutiesList, signups) {
      const container = document.getElementById('dutiesContainer');
      document.getElementById('adminEditBtnContainer').style.display = isAdmin ? 'block' : 'none';

      // Filter only active duties (quota > 0)
      const activeDuties = dutiesList.filter(d => parseInt(d.quota) > 0);

      if (!activeDuties || activeDuties.length === 0) {
        container.innerHTML = '<p class="empty-signups">ไม่มีกำหนดหน้าที่สำหรับวันนี้</p>';
        return;
      }

      let isExpired = false;
      let isNotStarted = false;
      if (selectedDateInfo.activity) {
        let now = new Date().getTime();
        if (selectedDateInfo.activity.deadline) {
          isExpired = now > selectedDateInfo.activity.deadline;
        }
        if (selectedDateInfo.activity.isFull) {
          isExpired = true;
        }
        if (selectedDateInfo.activity.startTime) {
          isNotStarted = now < selectedDateInfo.activity.startTime;
        }
      }

      // 1. Build Central Signup Form
      let centralFormHtml = '';
      if ((!isExpired && !isNotStarted) || isAdmin) { // Show form for admins or if active
        let optionsHtml = '<option value="">-- เลือกหน้าที่ --</option>';
        let hasAvailable = false;
        activeDuties.forEach(d => {
          const dutySignups = signups.filter(s => s.duty === d.duty);
          const isFull = dutySignups.length >= d.quota;
          if (!isFull) {
            optionsHtml += `<option value="${d.duty}">${d.duty} (ว่าง ${d.quota - dutySignups.length})</option>`;
            hasAvailable = true;
          }
        });

        if (hasAvailable) {
          const isMulti = selectedDateInfo.activity && selectedDateInfo.activity.allowMultipleDuties !== false;
          const formTitleText = isMulti ? 'แบบฟอร์มลงชื่อ (เลือกลงได้หลายหน้าที่)' : 'แบบฟอร์มลงชื่อ (เลือกลงได้ 1 หน้าที่/คน)';
          centralFormHtml = `
              <div class="signup-form" style="display:flex; flex-direction:column; gap:10px; margin-bottom: 25px; padding: 20px; background: rgba(59, 130, 246, 0.05); border-radius: 8px;">
                  <div style="font-weight:700; color:var(--primary); margin-bottom: 5px;">${formTitleText}</div>
                  <select id="centralDutySelect" class="input-control" onchange="clearCentralDutyError()">
                      ${optionsHtml}
                  </select>
                  <div id="centralDutyError" class="field-error-msg">
                      <i class="fa-solid fa-circle-exclamation"></i> <span>กรุณาเลือกหน้าที่ที่ต้องการลงชื่อ</span>
                  </div>
                  <div style="position: relative;">
                      <input type="text" id="centralNameInput" class="input-control" placeholder="ค้นหาชื่อ-นามสกุลของคุณ" autocomplete="off" oninput="filterCentralStudents(); clearCentralNameError();" onfocus="filterCentralStudents()" onkeydown="if(event.key === 'Enter') { event.preventDefault(); submitCentralSignup(); }" onblur="setTimeout(() => { let d = document.getElementById('centralAutocomplete'); if(d) d.style.display='none'; }, 350)">
                      <div id="centralAutocomplete" class="autocomplete-dropdown" style="display:none; width:100%;"></div>
                  </div>
                  <div id="centralNameError" class="field-error-msg">
                      <i class="fa-solid fa-circle-exclamation"></i> <span id="centralNameErrorText">กรุณาพิมพ์หรือเลือกชื่อของคุณ</span>
                  </div>
                  <button class="btn btn-primary btn-block" id="btnCentralSubmit" onclick="submitCentralSignup()">
                      <i class="fa-solid fa-pen-to-square"></i> ${isAdmin ? 'เพิ่มรายชื่อ (Admin)' : 'ลงชื่อปฏิบัติหน้าที่'}
                  </button>
              </div>
            `;
        } else {
          centralFormHtml = `
            <div style="background: rgba(244, 63, 94, 0.05); border: 1px solid rgba(244, 63, 94, 0.15); padding: 24px; border-radius: 16px; text-align: center; margin-bottom: 24px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
              <div style="width: 54px; height: 54px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.15);">
                <i class="fa-solid fa-lock" style="font-size: 1.4rem; color: var(--danger);"></i>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <span style="font-weight: 700; font-size: 1.15rem; color: var(--danger);">หน้าที่เต็มหมดแล้ว</span>
                <span style="font-size: 0.95rem; color: var(--text-muted);">ขออภัย ไม่สามารถลงชื่อเพิ่มเติมได้ในขณะนี้</span>
              </div>
            </div>
          `;
        }
      }

      // 2. Render Duty Cards
      let cardsHtml = '';
      activeDuties.forEach((item, index) => {
        const dutyName = item.duty;
        const quota = parseInt(item.quota);
        const dutySignups = signups.filter(s => s.duty === dutyName);
        const currentCount = dutySignups.length;
        const isFull = currentCount >= quota;

        let signupHtml = '';

        let currentViewMode = (selectedDateInfo.activity && selectedDateInfo.activity.viewMode) ? selectedDateInfo.activity.viewMode : 'counts';
        // CHECK VIEW MODE
        if (currentViewMode === 'counts' && !isAdmin) {
          // Show only counts, no names
        } else {
          if (currentCount > 0) {
            signupHtml = '<ul class="signup-list" style="margin-bottom:0; margin-top: 15px;">';
            dutySignups.forEach(s => {
              let deleteBtnHtml = isAdmin ? `<button class="delete-btn" style="background-color: white; border: 1px solid var(--danger); color: var(--danger); min-width: 70px; padding: 10px;" onclick="event.preventDefault(); event.stopPropagation(); deleteSignup(${s.row}, '${s.name}', '${dutyName}')"><i class="fa-solid fa-trash-can"></i> ลบ</button>` : '';
              let moveBtnHtml = isAdmin ? `<button class="delete-btn" style="background-color: white; border: 1px solid var(--warning); color: var(--warning); margin-right: 15px; min-width: 70px; padding: 10px;" onclick="event.preventDefault(); event.stopPropagation(); openMoveModal(${s.row}, '${s.name}', '${dutyName}')"><i class="fa-solid fa-arrow-right-arrow-left"></i> ย้าย</button>` : '';

              let timeHtml = '';
              if (s.timestamp) {
                const date = new Date(parseInt(s.timestamp));
                const d = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const yy = String(date.getFullYear() + 543).slice(-2);
                const h = String(date.getHours()).padStart(2, '0');
                const m = String(date.getMinutes()).padStart(2, '0');
                const sec = String(date.getSeconds()).padStart(2, '0');
                const ms = String(date.getMilliseconds()).padStart(3, '0');
                timeHtml = `<span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 8px; font-weight: 400;">${d}/${month}/${yy} ${h}:${m}:${sec}:${ms}</span>`;
              }

              let checkboxHtml = isAdmin ? `<input type="checkbox" class="bulk-delete-cb" data-row="${s.row}" data-name="${s.name}" data-duty="${dutyName}" style="margin-right: 10px; width: 18px; height: 18px; cursor: pointer; accent-color: var(--danger);" onchange="toggleBulkDeleteBtn()">` : '';

              const isHighlighted = isStudentHighlighted(s, dutyName);
              const highlightClass = isHighlighted ? ' just-registered-highlight' : '';
              const highlightIdAttr = isHighlighted ? ' id="justRegisteredItem"' : '';
              const highlightBadge = isHighlighted ? '<span class="badge-just-registered"><i class="fa-solid fa-check"></i> เพิ่งลงชื่อสำเร็จ</span>' : '';

              signupHtml += `<li class="${highlightClass}"${highlightIdAttr}>
                  <div class="signup-name-container" style="flex-wrap: wrap; align-items: center; display: flex;">${checkboxHtml}<i class="fa-solid fa-circle-check"></i> <span>${s.name}</span>${highlightBadge}${timeHtml}</div>
                  <div style="display:flex; margin-left: auto; padding-left: 10px;">${moveBtnHtml}${deleteBtnHtml}</div>
                </li>`;
            });
            signupHtml += '</ul>';
          } else {
            signupHtml = '<p class="empty-signups" style="margin-bottom:0; margin-top: 15px;">ยังไม่มีผู้ลงชื่อในหน้าที่นี้</p>';
          }
        }

        const quotaBadgeClass = isFull ? 'duty-quota full' : 'duty-quota';
        const quotaText = isFull ? 'เต็มแล้ว' : `ว่าง ${quota - currentCount}/${quota}`;

        let singleRandomBtn = isAdmin ? `<button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem; border-color: rgba(197,165,90,0.3); color: var(--accent); margin-right: 10px;" onclick="randomizeSingleDutyBtn('${dutyName}', this)" ${isFull ? 'disabled' : ''}><i class="fa-solid fa-shuffle"></i> สุ่ม</button>` : '';

        cardsHtml += `
          <div class="duty-card" style="padding: 15px 20px; margin-bottom: 12px;">
            <div class="duty-header" style="${(currentViewMode === 'counts' && !isAdmin) ? 'margin-bottom:0;' : 'margin-bottom: 0;'}">
              <div class="duty-title" style="font-size: 1.1rem;"><i class="fa-solid fa-clipboard-user"></i> ${dutyName}</div>
              <div style="display: flex; align-items: center;">
                ${singleRandomBtn}
                <div class="${quotaBadgeClass}">${quotaText}</div>
              </div>
            </div>
            ${signupHtml}
          </div>
        `;
      });

      container.innerHTML = centralFormHtml + `<div id="dutyCardsWrapper">${cardsHtml}</div>`;
      if (typeof startUserRealtimeSync === 'function') startUserRealtimeSync(selectedDateInfo.activity.sheetName, activeDuties);
      setTimeout(() => {
        const highlightEl = document.getElementById('justRegisteredItem');
        if (highlightEl) {
          highlightEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 250);
    }


    function updateDutiesLive(dutiesList, signups) {
      const activeDuties = dutiesList.filter(d => parseInt(d.quota) > 0);
      if (!activeDuties || activeDuties.length === 0) return;

      let isExpired = false;
      let isNotStarted = false;
      if (selectedDateInfo.activity) {
        let now = new Date().getTime();
        if (selectedDateInfo.activity.deadline) isExpired = now > selectedDateInfo.activity.deadline;
        if (selectedDateInfo.activity.isFull) isExpired = true;
        if (selectedDateInfo.activity.startTime) isNotStarted = now < selectedDateInfo.activity.startTime;
      }

      // Update Central Form Options
      const centralDutySelect = document.getElementById('centralDutySelect');
      if (centralDutySelect && ((!isExpired && !isNotStarted) || isAdmin)) {
        const currentVal = centralDutySelect.value;
        let optionsHtml = '<option value="">-- ' + (isAdmin ? 'เลือกหน้าที่ (Admin)' : 'เลือกหน้าที่') + ' --</option>';
        activeDuties.forEach(d => {
          const dutySignups = signups.filter(s => s.duty === d.duty);
          const isFull = dutySignups.length >= d.quota;
          if (!isFull) {
            optionsHtml += `<option value="${d.duty}">${d.duty} (ว่าง ${d.quota - dutySignups.length})</option>`;
          }
        });
        centralDutySelect.innerHTML = optionsHtml;
        if (Array.from(centralDutySelect.options).some(opt => opt.value === currentVal)) {
          centralDutySelect.value = currentVal;
        }
      }

      let cardsHtml = '';
      activeDuties.forEach((item) => {
        const dutyName = item.duty;
        const quota = parseInt(item.quota);
        const dutySignups = signups.filter(s => s.duty === dutyName);
        const currentCount = dutySignups.length;
        const isFull = currentCount >= quota;

        let signupHtml = '';
        let currentViewMode = (selectedDateInfo.activity && selectedDateInfo.activity.viewMode) ? selectedDateInfo.activity.viewMode : 'counts';

        if (currentViewMode === 'counts' && !isAdmin) {
          // Show only counts
        } else {
          if (currentCount > 0) {
            signupHtml = '<ul class="signup-list" style="margin-bottom:0; margin-top: 15px;">';
            dutySignups.forEach(s => {
              let deleteBtnHtml = isAdmin ? `<button class="delete-btn" style="background-color: white; border: 1px solid var(--danger); color: var(--danger); min-width: 70px; padding: 10px;" onclick="event.preventDefault(); event.stopPropagation(); deleteSignup(${s.row}, '${s.name}', '${dutyName}')"><i class="fa-solid fa-trash-can"></i> ลบ</button>` : '';
              let moveBtnHtml = isAdmin ? `<button class="delete-btn" style="background-color: white; border: 1px solid var(--warning); color: var(--warning); margin-right: 15px; min-width: 70px; padding: 10px;" onclick="event.preventDefault(); event.stopPropagation(); openMoveModal(${s.row}, '${s.name}', '${dutyName}')"><i class="fa-solid fa-arrow-right-arrow-left"></i> ย้าย</button>` : '';

              let timeHtml = '';
              if (s.timestamp) {
                const date = new Date(parseInt(s.timestamp));
                const d = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const yy = String(date.getFullYear() + 543).slice(-2);
                const h = String(date.getHours()).padStart(2, '0');
                const m = String(date.getMinutes()).padStart(2, '0');
                const sec = String(date.getSeconds()).padStart(2, '0');
                const ms = String(date.getMilliseconds()).padStart(3, '0');
                timeHtml = `<span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 8px; font-weight: 400;">${d}/${month}/${yy} ${h}:${m}:${sec}:${ms}</span>`;
              }
              const isHighlighted = isStudentHighlighted(s, dutyName);
              const highlightClass = isHighlighted ? ' just-registered-highlight' : '';
              const highlightIdAttr = isHighlighted ? ' id="justRegisteredItem"' : '';
              const highlightBadge = isHighlighted ? '<span class="badge-just-registered"><i class="fa-solid fa-check"></i> เพิ่งลงชื่อสำเร็จ</span>' : '';

              signupHtml += `<li class="${highlightClass}"${highlightIdAttr}>
                  <div class="signup-name-container" style="flex-wrap: wrap;"><i class="fa-solid fa-circle-check"></i> <span>${s.name}</span>${highlightBadge}${timeHtml}</div>
                  <div style="display:flex; margin-left: auto; padding-left: 10px;">${moveBtnHtml}${deleteBtnHtml}</div>
                </li>`;
            });
            signupHtml += '</ul>';
          } else {
            signupHtml = '<p class="empty-signups" style="margin-bottom:0; margin-top: 15px;">ยังไม่มีผู้ลงชื่อในหน้าที่นี้</p>';
          }
        }

        const quotaBadgeClass = isFull ? 'duty-quota full' : 'duty-quota';
        const quotaText = isFull ? 'เต็มแล้ว' : `ว่าง ${quota - currentCount}/${quota}`;
        let singleRandomBtn = isAdmin ? `<button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem; border-color: rgba(197,165,90,0.3); color: var(--accent); margin-right: 10px;" onclick="randomizeSingleDutyBtn('${dutyName}', this)" ${isFull ? 'disabled' : ''}><i class="fa-solid fa-shuffle"></i> สุ่ม</button>` : '';

        cardsHtml += `
          <div class="duty-card" style="padding: 15px 20px; margin-bottom: 12px;">
            <div class="duty-header" style="${(currentViewMode === 'counts' && !isAdmin) ? 'margin-bottom:0;' : 'margin-bottom: 0;'}">
              <div class="duty-title" style="font-size: 1.1rem;"><i class="fa-solid fa-clipboard-user"></i> ${dutyName}</div>
              <div style="display: flex; align-items: center;">
                ${singleRandomBtn}
                <div class="${quotaBadgeClass}">${quotaText}</div>
              </div>
            </div>
            ${signupHtml}
          </div>
        `;
      });

      const wrapper = document.getElementById('dutyCardsWrapper');
      if (wrapper) wrapper.innerHTML = cardsHtml;
    }

    function selectCentralStudent(fullName) {
      clearCentralNameError();
      const inputEl = document.getElementById('centralNameInput');
      const dropdown = document.getElementById('centralAutocomplete');
      if (inputEl) {
        inputEl.value = fullName;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      }
      if (dropdown) {
        dropdown.style.display = 'none';
        dropdown.innerHTML = '';
      }
    }

    function filterCentralStudents() {
      const inputEl = document.getElementById('centralNameInput');
      const dropdown = document.getElementById('centralAutocomplete');
      if (!inputEl || !dropdown) return;
      const val = inputEl.value.toLowerCase().trim();
      dropdown.innerHTML = '';

      const filtered = studentNamesList.filter(s => (s.name + (s.grade ? ' ' + s.grade : '')).toLowerCase().includes(val));

      if (filtered.length === 0) {
        dropdown.style.display = 'none';
        return;
      }

      const resultsToShow = filtered.slice(0, 50);
      resultsToShow.forEach(s => {
        const fullName = s.name + (s.grade ? ' ' + s.grade : '');
        const div = document.createElement('div');
        div.textContent = fullName;
        div.setAttribute('role', 'button');
        div.setAttribute('tabindex', '0');

        div.onmousedown = function (e) {
          e.preventDefault();
          selectCentralStudent(fullName);
        };

        let touchStartY = 0;
        let touchStartX = 0;
        let isTouchScroll = false;

        div.addEventListener('touchstart', function (e) {
          if (e.touches && e.touches.length > 0) {
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
            isTouchScroll = false;
          }
        }, { passive: true });

        div.addEventListener('touchmove', function (e) {
          if (e.touches && e.touches.length > 0) {
            const dy = Math.abs(e.touches[0].clientY - touchStartY);
            const dx = Math.abs(e.touches[0].clientX - touchStartX);
            if (dy > 8 || dx > 8) {
              isTouchScroll = true;
            }
          }
        }, { passive: true });

        div.addEventListener('touchend', function (e) {
          if (!isTouchScroll) {
            e.preventDefault();
            selectCentralStudent(fullName);
          }
        });

        div.onclick = function (e) {
          selectCentralStudent(fullName);
        };

        dropdown.appendChild(div);
      });

      dropdown.style.display = 'block';
    }

        // --- Centralized Modal Alert Popups (Full screen blocking with blurred backdrop) ---
    function showDuplicateSignupPopup(studentName, dutyName, isMulti) {
      if (window.RosterAudio) window.RosterAudio.playError();
      const duplicateHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
          <div style="width: 76px; height: 76px; border-radius: 50%; background: #FEF2F2; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.18);">
            <i class="fa-solid fa-triangle-exclamation" style="font-size: 38px; color: #EF4444;"></i>
          </div>
          <h2 style="color: #0F172A; font-weight: 800; font-size: 1.35rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">มีรายชื่อในกิจกรรมนี้แล้ว</h2>
          <div style="color: #334155; font-size: 0.95rem; line-height: 1.6; margin-bottom: 14px; background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 14px 18px; border-radius: 14px; width: 100%; box-sizing: border-box; text-align: left;">
            <div style="margin-bottom: 6px;"><strong>นักเรียน:</strong> <span style="color: #0F172A; font-weight: 600;">${studentName}</span></div>
            <div style="margin-bottom: 6px;"><strong>หน้าที่เดิม:</strong> <span style="color: #EF4444; font-weight: 600;">${dutyName}</span></div>
            <div style="font-size: 0.86rem; color: #64748B; border-top: 1px dashed #CBD5E1; padding-top: 6px; margin-top: 6px;">
              ${isMulti ? 'คุณได้ลงชื่อในหน้าที่นี้ของกิจกรรมไปเรียบร้อยแล้ว ไม่สามารถลงชื่อหน้าที่เดิมซ้ำได้' : 'กิจกรรมนี้กำหนดให้ลงชื่อได้ 1 หน้าที่/คน และมีชื่อของคุณลงทะเบียนไว้แล้ว'}
            </div>
          </div>
          <p style="color: #64748B; font-size: 0.85rem; margin: 0; line-height: 1.5;">
            หากต้องการเปลี่ยนแปลงหน้าที่ กรุณาติดต่อสารวัตรนักเรียนหรือผู้ดูแลระบบ
          </p>
        </div>
      `;

      Swal.fire({
        html: duplicateHtml,
        showConfirmButton: true,
        confirmButtonColor: '#0F172A',
        confirmButtonText: '<i class="fa-solid fa-check" style="margin-right: 6px;"></i> รับทราบ',
        customClass: {
          popup: 'custom-swal-popup custom-swal-duplicate-popup',
          confirmButton: 'custom-swal-btn'
        },
        buttonsStyling: true,
        allowOutsideClick: false
      });
    }

    function showSignupErrorPopup(errorMessage) {
      if (window.RosterAudio) window.RosterAudio.playError();
      const errorText = errorMessage || 'เกิดข้อผิดพลาดในการลงชื่อ กรุณาลองใหม่อีกครั้ง';
      const isDuplicate = errorText.includes('ซ้ำ') || errorText.includes('มีรายชื่อ') || errorText.includes('already');

      const errorHtml = `
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
          <div style="width: 76px; height: 76px; border-radius: 50%; background: #FEF2F2; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(239, 68, 68, 0.18);">
            <i class="fa-solid ${isDuplicate ? 'fa-triangle-exclamation' : 'fa-circle-xmark'}" style="font-size: 38px; color: #EF4444;"></i>
          </div>
          <h2 style="color: #0F172A; font-weight: 800; font-size: 1.35rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">
            ${isDuplicate ? 'มีรายชื่อในกิจกรรมนี้แล้ว' : 'บันทึกการลงชื่อไม่สำเร็จ'}
          </h2>
          <div style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 14px; background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 14px 18px; border-radius: 14px; width: 100%; box-sizing: border-box; text-align: center;">
            <span style="color: #DC2626; font-weight: 600;">${errorText}</span>
          </div>
          <p style="color: #64748B; font-size: 0.85rem; margin: 0; line-height: 1.5;">
            กรุณาตรวจสอบข้อมูลหรือติดต่อผู้ดูแลระบบหากยังพบปัญหา
          </p>
        </div>
      `;

      Swal.fire({
        html: errorHtml,
        showConfirmButton: true,
        confirmButtonColor: '#0F172A',
        confirmButtonText: '<i class="fa-solid fa-check" style="margin-right: 6px;"></i> รับทราบ',
        customClass: {
          popup: 'custom-swal-popup custom-swal-error-popup',
          confirmButton: 'custom-swal-btn'
        },
        buttonsStyling: true,
        allowOutsideClick: false
      });
    }

    function clearCentralDutyError() {
      const selectEl = document.getElementById('centralDutySelect');
      const errEl = document.getElementById('centralDutyError');
      if (selectEl) selectEl.classList.remove('input-error');
      if (errEl) errEl.classList.remove('visible');
    }

    function clearCentralNameError() {
      const inputEl = document.getElementById('centralNameInput');
      const errEl = document.getElementById('centralNameError');
      if (inputEl) inputEl.classList.remove('input-error');
      if (errEl) errEl.classList.remove('visible');
    }

    function showCentralDutyError(msg) {
      const selectEl = document.getElementById('centralDutySelect');
      const errEl = document.getElementById('centralDutyError');
      if (selectEl) {
        selectEl.classList.add('input-error');
        selectEl.focus();
      }
      if (errEl) {
        if (msg) {
          const t = errEl.querySelector('span');
          if (t) t.textContent = msg;
        }
        errEl.classList.add('visible');
      }
      if (window.RosterAudio) window.RosterAudio.playError();
    }

    function showCentralNameError(msg) {
      const inputEl = document.getElementById('centralNameInput');
      const errEl = document.getElementById('centralNameError');
      if (inputEl) {
        inputEl.classList.add('input-error');
        inputEl.focus();
      }
      if (errEl) {
        if (msg) {
          const t = errEl.querySelector('span') || document.getElementById('centralNameErrorText');
          if (t) t.textContent = msg;
        }
        errEl.classList.add('visible');
      }
      if (window.RosterAudio) window.RosterAudio.playError();
    }

    function submitCentralSignup() {
      const duty = document.getElementById('centralDutySelect') ? document.getElementById('centralDutySelect').value : '';
      const inputEl = document.getElementById('centralNameInput');
      let name = inputEl ? inputEl.value.trim() : '';
      const btnEl = document.getElementById('btnCentralSubmit');

      clearCentralDutyError();
      clearCentralNameError();

      // 🛡️ Anti-Rapid Submit & Double-Click Guard (5-second client debounce)
      const lastSignupTime = Number(sessionStorage.getItem('dg_last_signup_ts') || 0);
      const nowTs = Date.now();
      if (nowTs - lastSignupTime < 5000) {
        const remainingSec = Math.ceil((5000 - (nowTs - lastSignupTime)) / 1000);
        showCentralNameError(`กรุณารออีก ${remainingSec} วินาทีก่อนทำรายการลงชื่ออีกครั้ง (ป้องกันการส่งข้อมูลซ้ำ)`);
        if (window.RosterAudio) window.RosterAudio.playError();
        return;
      }

      if (!duty) {
        showCentralDutyError('กรุณาเลือกหน้าที่ที่ต้องการลงชื่อ');
        return;
      }
      if (!name) {
        showCentralNameError('กรุณาพิมพ์หรือเลือกชื่อของคุณ');
        return;
      }

      let studentObj = studentNamesList.find(s => (s.name + (s.grade ? ' ' + s.grade : '')) === name);
      if (!studentObj) {
        // Fallback 1: match exact name without grade
        studentObj = studentNamesList.find(s => s.name.trim() === name);
      }
      if (!studentObj) {
        // Fallback 2: if dropdown is visible and has only 1 matching student
        const dropdown = document.getElementById('centralAutocomplete');
        if (dropdown && dropdown.style.display !== 'none' && dropdown.children.length === 1) {
          const autoName = dropdown.children[0].textContent;
          studentObj = studentNamesList.find(s => (s.name + (s.grade ? ' ' + s.grade : '')) === autoName);
        }
      }
      if (!studentObj) {
        showCentralNameError('ไม่อนุญาตให้พิมพ์ชื่อเอง กรุณาเลือกรายชื่อที่มีในระบบเท่านั้น');
        return;
      }

      const resolvedFullName = studentObj.name + (studentObj.grade ? ' ' + studentObj.grade : '');
      inputEl.value = resolvedFullName;
      name = resolvedFullName;

      const sendName = studentObj.name;
      const sendGrade = studentObj.grade || '';

      if (selectedDateInfo.signups) {
        const isMulti = selectedDateInfo.activity && selectedDateInfo.activity.allowMultipleDuties !== false;
        if (isMulti) {
          const alreadySignedUp = selectedDateInfo.signups.find(s => s.name === name && s.duty === duty);
          if (alreadySignedUp) {
            showDuplicateSignupPopup(sendName, alreadySignedUp.duty, true);
            return;
          }
        } else {
          const alreadySignedUp = selectedDateInfo.signups.find(s => s.name === name);
          if (alreadySignedUp) {
            showDuplicateSignupPopup(sendName, alreadySignedUp.duty, false);
            return;
          }
        }
      }

      Swal.fire({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="width: 76px; height: 76px; border-radius: 50%; background: #EFF6FF; border: 2px solid #DBEAFE; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(59, 130, 246, 0.22);">
              <i class="fa-solid fa-clipboard-check" style="font-size: 36px; color: #3B82F6;"></i>
            </div>
            <h2 style="color: #0F172A; font-weight: 800; font-size: 1.45rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">ยืนยันการลงชื่อ</h2>
            <div style="color: #64748B; font-size: 0.95rem; line-height: 1.5; margin-bottom: 16px; width: 100%; background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 14px 18px; border-radius: 14px; box-sizing: border-box; text-align: left;">
              <div style="margin-bottom: 4px; font-size: 0.85rem; color: #64748B;">ระบบกำลังจะบันทึกการลงชื่อของ</div>
              <div style="font-size: 1.25rem; font-weight: 800; color: #0F172A; margin-bottom: 6px; line-height: 1.2;">${sendName}</div>
              <div style="font-size: 0.95rem; color: #334155;">ในหน้าที่ <strong style="color: #2563EB; font-weight: 700;">${duty}</strong></div>
              <div style="font-size: 0.82rem; color: #94A3B8; border-top: 1px dashed #CBD5E1; padding-top: 6px; margin-top: 6px;">
                กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนกดยืนยัน
              </div>
            </div>
          </div>
        `,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonColor: '#0F172A',
        cancelButtonColor: '#F1F5F9',
        confirmButtonText: 'ยืนยันการลงชื่อ',
        cancelButtonText: '<span style="color: #64748B;">ยกเลิก</span>',
        reverseButtons: true,
        customClass: {
          popup: 'custom-swal-popup',
          confirmButton: 'custom-swal-btn',
          cancelButton: 'custom-swal-btn'
        },
        buttonsStyling: true

      }).then((result) => {
        if (result.isConfirmed) {
          sessionStorage.setItem('dg_last_signup_ts', String(Date.now()));
          btnEl.disabled = true;
          btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

          // 1. Show Loading Popup
          Swal.fire({
            html: `
              <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                <div style="width: 76px; height: 76px; border-radius: 50%; background: #FEFCE8; border: 2px solid #FEF08A; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(234, 179, 8, 0.25);">
                  <i class="fa-solid fa-spinner fa-spin" style="font-size: 36px; color: #EAB308;"></i>
                </div>
                <h2 style="color: #0F172A; font-weight: 800; font-size: 1.45rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">กำลังบันทึกข้อมูล</h2>
                <div style="color: #64748B; font-size: 0.95rem; line-height: 1.5; margin-bottom: 6px;">
                  ระบบกำลังคีย์ข้อมูลของคุณ<br>กรุณารอสักครู่...
                </div>
              </div>
            `,
            showConfirmButton: false,
            allowOutsideClick: false,
            customClass: { popup: 'custom-swal-popup' }
          });

          const sheetName = selectedDateInfo.activity.sheetName;

          const handleSuccess = function (res) {
            if (window.RosterAudio) window.RosterAudio.playSuccess();
            const currentTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            Swal.fire({
              html: `
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
                  <div style="width: 76px; height: 76px; border-radius: 50%; background: #ECFDF5; border: 2px solid #A7F3D0; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.25);">
                    <i class="fa-solid fa-circle-check" style="font-size: 38px; color: #10B981;"></i>
                  </div>
                  <h2 style="color: #0F172A; font-weight: 800; font-size: 1.45rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">บันทึกข้อมูลเรียบร้อยแล้ว</h2>
                  <div style="color: #64748B; font-size: 0.9rem; line-height: 1.6; text-align: left; background: #F8FAFC; border: 1.5px solid #E2E8F0; padding: 14px 18px; border-radius: 14px; width: 100%; box-sizing: border-box; margin-bottom: 10px;">
                    <div style="margin-bottom: 4px;"><strong>ชื่อ:</strong> <span style="color: #1E293B; font-weight: 600;">${sendName}</span></div>
                    <div style="margin-bottom: 4px;"><strong>กิจกรรม:</strong> <span style="color: #1E293B; font-weight: 600;">${selectedDateInfo.activity.title}</span></div>
                    <div style="margin-bottom: 4px;"><strong>หน้าที่:</strong> <span style="color: #10B981; font-weight: 700;">${duty}</span></div>
                    <div><strong>เวลาลงชื่อ:</strong> <span style="color: #10B981; font-weight: 700;">${currentTime} น.</span></div>
                  </div>
                  <div style="color: #EF4444; font-size: 0.85rem; margin-top: 5px; font-weight: 500;">
                    <i class="fa-solid fa-camera" style="margin-right: 5px;"></i> หมายเหตุ: กรุณาแคปหน้าจอนี้ไว้เพื่อเป็นหลักฐาน
                  </div>
                </div>
              `,
              showConfirmButton: true,
              confirmButtonColor: '#0F172A',
              confirmButtonText: 'ตกลง',
              customClass: { popup: 'custom-swal-popup', confirmButton: 'custom-swal-btn' },
              buttonsStyling: true
            }).then(() => {
              // Stay inside this activity detail view (do NOT close activityModal)
              loadSignups(sheetName, selectedDateInfo.activity.duties);

              // Reset form inputs
              const nameInp = document.getElementById('centralNameInput');
              if (nameInp) nameInp.value = '';
              const dutySel = document.getElementById('centralDutySelect');
              if (dutySel) dutySel.value = '';

              btnEl.disabled = false;
              btnEl.innerHTML = isAdmin ? '<i class="fa-solid fa-pen-to-square"></i> เพิ่มรายชื่อ (Admin)' : '<i class="fa-solid fa-pen-to-square"></i> ลงชื่อปฏิบัติหน้าที่';
            });
          };

          const handleFailure = function (error) {
            showSignupErrorPopup(error.message || error);
            btnEl.disabled = false;
            btnEl.innerHTML = isAdmin ? '<i class="fa-solid fa-pen-to-square"></i> เพิ่มรายชื่อ (Admin)' : '<i class="fa-solid fa-pen-to-square"></i> ลงชื่อปฏิบัติหน้าที่';
          };

          if (typeof google !== 'undefined' && google.script) {
            if (isAdmin) {
              google.script.run
                .withSuccessHandler(handleSuccess)
                .withFailureHandler(handleFailure)
                .adminAddSignup(selectedDateInfo.activity.date, sheetName, duty, sendName, sendGrade, typeof adminInfo !== 'undefined' && adminInfo ? adminInfo.name : null);
            } else {
              google.script.run
                .withSuccessHandler(handleSuccess)
                .withFailureHandler(handleFailure)
                .saveSignup(selectedDateInfo.activity.date, sheetName, duty, sendName, sendGrade);
            }
          } else {
            setTimeout(() => {
              handleSuccess({ message: 'Mock Success' });
            }, 1500);
          }
        }
      });
    }

    // --- Admin Move Modal Logic ---
    let currentMoveData = null;
    function openMoveModal(row, studentName, oldDuty) {
      currentMoveData = { row: row, studentName: studentName, oldDuty: oldDuty };
      let optionsHtml = '<option value="">-- เลือกหน้าที่ใหม่ --</option>';
      const activeDuties = selectedDateInfo.activity.duties.filter(d => parseInt(d.quota) > 0);

      activeDuties.forEach(d => {
        if (d.duty !== oldDuty) {
          const dutySignups = selectedDateInfo.signups.filter(s => s.duty === d.duty);
          const isFull = dutySignups.length >= d.quota;
          let label = isFull ? `${d.duty} (เต็ม ${d.quota}/${d.quota})` : `${d.duty} (ว่าง ${d.quota - dutySignups.length})`;
          optionsHtml += `<option value="${d.duty}" ${isFull ? 'disabled' : ''}>${label}</option>`;
        }
      });

      let modalHtml = document.getElementById('moveDutyModal');
      if (!modalHtml) {
        const div = document.createElement('div');
        div.id = 'moveDutyModal';
        div.className = 'modal-overlay';
        div.innerHTML = `
          <div class="modal-content small" style="max-width: 400px; padding: 20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
              <h3 style="margin:0; color:var(--text-main); font-size:1.2rem;">ย้ายหน้าที่</h3>
              <i class="fa-solid fa-xmark" style="cursor:pointer; font-size:1.2rem; color:var(--text-muted);" onclick="closeModal('moveDutyModal')"></i>
            </div>
            <div style="margin-bottom: 15px;">
              <p style="margin-bottom: 5px; color:var(--text-muted);">รายชื่อ: <strong style="color:var(--text-main)" id="moveStudentName"></strong></p>
              <p style="margin-bottom: 10px; color:var(--text-muted);">หน้าที่เดิม: <strong style="color:var(--text-main)" id="moveOldDuty"></strong></p>
              <select id="newDutySelect" class="input-control" style="width: 100%;">
                <!-- options -->
              </select>
            </div>
            <button class="btn btn-primary btn-block" id="btnSubmitMove" onclick="submitMoveSignup()"><i class="fa-solid fa-floppy-disk"></i> บันทึกการย้าย</button>
          </div>
        `;
        document.body.appendChild(div);
      }

      document.getElementById('moveStudentName').textContent = studentName;
      document.getElementById('moveOldDuty').textContent = oldDuty;
      document.getElementById('newDutySelect').innerHTML = optionsHtml;

      document.getElementById('moveDutyModal').classList.add('active');
    }

    function submitMoveSignup() {
      const newDuty = document.getElementById('newDutySelect').value;
      if (!newDuty) {
        showToast('กรุณาเลือกหน้าที่ใหม่', 'error');
        return;
      }

      const btnEl = document.getElementById('btnSubmitMove');
      btnEl.disabled = true;
      btnEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

      const sheetName = selectedDateInfo.activity.sheetName;

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (res) {
            showToast(res.message || 'ย้ายหน้าที่สำเร็จ!');
            closeModal('moveDutyModal');
            loadSignups(sheetName, selectedDateInfo.activity.duties);
            btnEl.disabled = false;
            btnEl.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกการย้าย';
          })
          .withFailureHandler(function (error) {
            showToast('ย้ายไม่สำเร็จ: ' + error.message, 'error');
            btnEl.disabled = false;
            btnEl.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกการย้าย';
          })
          .adminMoveSignup(selectedDateInfo.activity.date, sheetName, currentMoveData.row, newDuty, currentMoveData.studentName, typeof adminInfo !== 'undefined' && adminInfo ? adminInfo.name : null);
      } else {
        setTimeout(function () {
          showToast('ย้ายหน้าที่สำเร็จ (Mock)!');
          closeModal('moveDutyModal');
          loadSignups(sheetName, selectedDateInfo.activity.duties);
          btnEl.disabled = false;
          btnEl.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกการย้าย';
        }, 1000);
      }
    }

    // --- Admin System ---
    function openAdminMenu() {
      if (isAdmin) {
        openDashboard();
      } else {
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('loginUser').value = '';
        document.getElementById('loginPass').value = '';
        document.getElementById('loginUser').focus();
      }
    }

    // --- Cookie Logic ---
    function setLoginCookie(user, name, role) {
      const data = JSON.stringify({ user: user, name: name, role: role });
      const encoded = btoa(encodeURIComponent(data));
      const expires = new Date().getTime() + (7 * 24 * 60 * 60 * 1000); // 7 days
      localStorage.setItem('adminAuth', JSON.stringify({ data: encoded, expires: expires }));
    }

    function getLoginCookie() {
      const stored = localStorage.getItem('adminAuth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.expires && new Date().getTime() > parsed.expires) {
            localStorage.removeItem('adminAuth');
            return null;
          }
          const decoded = decodeURIComponent(atob(parsed.data));
          return JSON.parse(decoded);
        } catch (e) { return null; }
      }
      return null;
    }

    function clearLoginCookie() {
      localStorage.removeItem('adminAuth');
    }

    function submitLogin() {
      const user = document.getElementById('loginUser').value;
      const pass = document.getElementById('loginPass').value;
      const btn = document.getElementById('btnLoginSubmit');

      if (!user || !pass) {
        showToast('กรุณากรอก Username และ Password', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังตรวจสอบ...';

      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => executeLogin(user, pass, data.ip, btn))
        .catch(err => executeLogin(user, pass, 'Unknown', btn));
    }

    function executeLogin(user, pass, ip, btn) {
      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (res) {
            loginSuccess(res.user, res.name, res.role);
            btn.disabled = false;
            btn.innerHTML = 'เข้าสู่ระบบ';
          })
          .withFailureHandler(function (error) {
            showToast(error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = 'เข้าสู่ระบบ';
          })
          .verifyAdmin(user, pass, ip);
      } else {
        setTimeout(() => { showToast('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้', 'error'); btn.disabled = false; btn.innerHTML = 'เข้าสู่ระบบ'; }, 500);
      }
    }

    function loginSuccess(user, name, role, fromCookie = false) {
      isAdmin = true;
      adminInfo = { user: user, name: name, role: role || 'Superadmin' };

      if (!fromCookie) {
        setLoginCookie(user, name, role);
      }

      closeModal('loginModal');
      if (document.getElementById('adminLoginBtn')) document.getElementById('adminLoginBtn').classList.add('logged-in');
      if (document.getElementById('adminIcon')) document.getElementById('adminIcon').className = 'fa-solid fa-user-gear';
      if (document.getElementById('adminLoginText')) {
        document.getElementById('adminLoginText').innerHTML = `Admin: <span style="font-weight: bold; color: #111827;">${name}</span>`;
      }
      if (document.getElementById('calendarWrapper')) document.getElementById('calendarWrapper').classList.add('admin-mode');
      if (document.getElementById('currentAdminNameLabel')) document.getElementById('currentAdminNameLabel').textContent = name;

      loadUpcomingActivities();

      if (!fromCookie) {
        showToast('เข้าสู่ระบบสำเร็จ! ยินดีต้อนรับ ' + name);
        openDashboard();
      }
    }

    function adminLogout() {
      clearLoginCookie();
      isAdmin = false;
      adminInfo = null;
      if (document.getElementById('adminLoginBtn')) document.getElementById('adminLoginBtn').classList.remove('logged-in');
      if (document.getElementById('adminIcon')) document.getElementById('adminIcon').className = 'fa-solid fa-door-open';
      if (document.getElementById('adminLoginText')) {
        document.getElementById('adminLoginText').textContent = 'Admin Login';
      }
      if (document.getElementById('calendarWrapper')) document.getElementById('calendarWrapper').classList.remove('admin-mode');

      closeDashboard();
      showToast('ออกจากระบบ Admin แล้ว');
      loadUpcomingActivities();
    }

    // --- Dashboard Logic ---
    let dashAdmins = [];

    function openDashboard() {
      document.getElementById('adminDashboard').classList.add('active');
      document.getElementById('dashAdminName').innerText = adminInfo.name;
      if (adminInfo.role !== 'Superadmin') {
        document.getElementById('adminMenuAdmins').style.display = 'none';
        document.getElementById('adminMenuAdvisors').style.display = 'none';
      } else {
        document.getElementById('adminMenuAdmins').style.display = 'block';
        document.getElementById('adminMenuAdvisors').style.display = 'block';
      }

      if (adminInfo.role === 'Superadmin' || adminInfo.role === "superadmin57'0tf^wfh") {
        document.getElementById('adminMenuLogs').style.display = 'block';
      } else {
        document.getElementById('adminMenuLogs').style.display = 'none';
      }
      switchDashTab('activities');
    }

    function closeDashboard() {
      document.getElementById('adminDashboard').classList.remove('active');
      loadUpcomingActivities(); // Refresh data to reflect any changes
    }

    function toggleMobileSidebar() {
      const sidebar = document.getElementById('dashboardSidebar');
      const backdrop = document.querySelector('.sidebar-backdrop');
      if (sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        backdrop.classList.remove('active');
        setTimeout(() => backdrop.style.display = 'none', 300);
      } else {
        sidebar.classList.add('mobile-open');
        backdrop.style.display = 'block';
        setTimeout(() => backdrop.classList.add('active'), 10);
      }
    }

    let currentLogsData = [];
    function loadAdminLogsTab() {
      document.getElementById('adminLogsTableBody').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">กำลังโหลดข้อมูล... <i class="fa-solid fa-spinner fa-spin"></i></td></tr>';
      google.script.run
        .withSuccessHandler(function (logs) {
          currentLogsData = logs || [];
          let html = '';
          if (!logs || logs.length === 0) {
            html = '<tr><td colspan="6" style="text-align:center; padding:20px;">ไม่มีประวัติการแก้ไข</td></tr>';
          } else {
            logs.forEach(log => {
              let badgeColor = '#64748b';
              if (log.action_type.includes('CREATE') || log.action_type.includes('ADD')) badgeColor = 'var(--success)';
              else if (log.action_type.includes('UPDATE') || log.action_type.includes('MOVE')) badgeColor = '#f59e0b';
              else if (log.action_type.includes('DELETE')) badgeColor = 'var(--danger)';
              const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleString('th-TH') : '-';

              let detailsHtml = log.details || '-';
              if (log.old_data || log.new_data) {
                detailsHtml += `<br><button onclick="showLogDiff(${log.id})" style="margin-top: 5px; padding: 4px 10px; font-size: 0.8rem; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer; transition: 0.2s;"><i class="fa-solid fa-code-compare"></i> ดูรายละเอียด</button>`;
              }

              const ipBadge = log.ip_address 
                ? `<span style="background: #eff6ff; color: #2563eb; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe; font-family: monospace; font-size: 0.82rem;">${log.ip_address}</span>`
                : `<span style="color: #94a3b8; font-size: 0.82rem;">-</span>`;

              html += `
                <tr style="transition: background-color 0.2s;">
                  <td style="white-space: nowrap;">${timeStr}</td>
                  <td style="font-weight: bold;">${log.admin_name}</td>
                  <td>${ipBadge}</td>
                  <td><span style="background-color: ${badgeColor}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${log.action_type}</span></td>
                  <td>${log.activity_name}</td>
                  <td style="color: #475569; line-height: 1.4;">${detailsHtml}</td>
                </tr>`;
            });
          }
          document.getElementById('adminLogsTableBody').innerHTML = html;
        })
        .withFailureHandler(function (error) {
          document.getElementById('adminLogsTableBody').innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:red;">เกิดข้อผิดพลาด: ${error.message}</td></tr>`;
        })
        .getActivityLogs();
    }

    function switchDashTab(tabId) {
      const titles = {
        'activities': 'จัดการกิจกรรม',
        'students': 'จัดการนักเรียน',
        'duties': 'จัดการหน้าที่รับผิดชอบ',
        'admins': 'จัดการแอดมิน',
        'logs': 'ประวัติการแก้ไขกิจกรรม',
        'realtime': 'รายงานสรุป (แบบสด)'
      };
      const titleEl = document.getElementById('dashTitle');
      if (titleEl && titles[tabId]) titleEl.textContent = titles[tabId];
      if (window.innerWidth <= 1400) {
        const sidebar = document.getElementById('dashboardSidebar');
        if (sidebar && sidebar.classList.contains('mobile-open')) {
          toggleMobileSidebar();
        }
      }
      document.querySelectorAll('.dash-tab').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');

      const items = document.querySelectorAll('.sidebar-item');
      if (tabId === 'activities') items[1].classList.add('active');
      if (tabId === 'students') items[2].classList.add('active');
      if (tabId === 'duties') items[3].classList.add('active');
      if (tabId === 'admins') items[4].classList.add('active');
      if (tabId === 'logs') items[6].classList.add('active'); // assuming logs is 6th
      if (tabId === 'realtime') items[5].classList.add('active');

      if (tabId === 'overview') loadDashStats();
      if (tabId === 'activities') loadDashActivities();
      if (tabId === 'students') renderDashStudents();
      if (tabId === 'duties') renderDashDuties();
      if (tabId === 'admins') loadDashAdmins();
      if (tabId === 'logs') loadAdminLogsTab();
      if (tabId === 'realtime') initDashRealtime();
      if (tabId !== 'realtime' && typeof stopDashRealtimeSync === 'function') stopDashRealtimeSync();
    }


    function initAdminReports() {
      const select = document.getElementById('reportActivitySelect');
      const container = document.getElementById('reportsContainer');
      if (select) {
        select.innerHTML = '<option value="">-- กำลังโหลดรายการกิจกรรม... --</option>';
        select.disabled = true;
      }
      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (activities) {
            if (select) {
              let opts = '<option value="">-- เลือกกิจกรรมเพื่อดูรายงาน --</option>';
              currentActivities = activities; // Update the global state
              activities.forEach(a => {
                const displayDate = formatThaiDateRange(a.dateStr, a.endDateStr) || a.dateStr;
                opts += `<option value="${a.sheetName}">${displayDate} - ${a.title}</option>`;
              });
              select.innerHTML = opts;
              select.disabled = false;
            }
            if (container) container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);">กรุณาเลือกกิจกรรมจากรายการด้านบนเพื่อดูรายงานสรุปแบบละเอียด</div>`;
          })
          .withFailureHandler(function (e) {
            if (select) select.innerHTML = '<option value="">-- เกิดข้อผิดพลาด --</option>';
          })
          .getAllActivities();
      }
    }

    function loadSingleReport() {
      const sheetName = document.getElementById('reportActivitySelect').value;
      const container = document.getElementById('reportsContainer');
      if (!container) return;

      if (!sheetName) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);">กรุณาเลือกกิจกรรมจากรายการด้านบนเพื่อดูรายงานสรุปแบบละเอียด</div>`;
        return;
      }
      container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i><br>กำลังโหลดข้อมูลรายงานแบบละเอียด... อาจใช้เวลาสักครู่</div>`;

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (data) {
            renderReports(data ? [data] : []);
          })
          .withFailureHandler(function (error) {
            container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</div>`;
          })
          .getSingleActivitySummary(sheetName);
      }
    }

    function renderReports(reports) {
      const container = document.getElementById('reportsContainer');
      if (!reports || reports.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);">ไม่พบข้อมูลกิจกรรม</div>`;
        return;
      }

      let html = '';
      reports.forEach(r => {
        let dutiesHtml = '';
        let vacantHtmlList = '';
        let vacantIndex = 1;

        let dateDisplay = formatThaiDateRange(r.dateStr, r.endDateStr);

        let copyText = `รายชื่อนักเรียนที่ลงทะเบียนใน ${r.title}\n`;
        copyText += `ในวันที่ ${dateDisplay}\n\n`;

        const getClassNum = (name) => {
          const parts = name.trim().split(' ');
          const cls = parts[parts.length - 1];
          if (cls && cls.includes('/')) {
            const cleanCls = cls.replace(/^ม\./, '');
            const cParts = cleanCls.split('/');
            return parseInt(cParts[0]) * 100 + parseInt(cParts[1]);
          }
          return 9999;
        };

        // Sort duties according to systemDuties
        r.duties.sort((a, b) => {
          let iA = systemDuties.indexOf(a.duty);
          let iB = systemDuties.indexOf(b.duty);
          if (iA === -1) iA = 9999;
          if (iB === -1) iB = 9999;
          return iA - iB;
        });

        r.duties.forEach(d => {
          // Check vacancies
          if (d.quota > 0) {
            let remaining = d.quota - d.currentCount;
            if (remaining > 0) {
              vacantHtmlList += `<div style="padding: 4px 0; font-size: 0.95em;">${vacantIndex}. ${d.duty} ว่าง <strong style="color: var(--accent); font-size: 1.1em;">${remaining}</strong> ที่</div>`;
              vacantIndex++;
            }
          }

          let signupsList = '';
          if (d.signups && d.signups.length > 0) {
            d.signups.sort((a, b) => getClassNum(a) - getClassNum(b));

            signupsList = '<ul style="margin: 5px 0 0 15px; padding: 0; font-size: 0.9em; color: var(--text-muted);">';

            copyText += `${d.duty}\n`;
            d.signups.forEach((name, i) => {
              signupsList += `<li>- ${name}</li>`;
              copyText += `${i + 1}. ${name}\n`;
            });
            signupsList += '</ul>';
            copyText += '\n';
          } else {
            signupsList = '<div style="margin-left: 15px; font-size: 0.85em; color: var(--text-dim);">ไม่มีผู้ลงชื่อ</div>';
          }
          let quotaText = d.quota > 0 ? ` / ${d.quota}` : '';
          dutiesHtml += `
            <div style="margin-bottom: 10px; background: rgba(0,0,0,0.02); padding: 10px; border-radius: 8px;">
              <div style="font-weight: 600; display:flex; justify-content:space-between;">
                <span><i class="fa-solid fa-clipboard-check" style="color:var(--primary)"></i> ${d.duty}</span>
                <span style="color:var(--accent)">${d.currentCount}${quotaText}</span>
              </div>
              ${signupsList}
            </div>
          `;
        });

        copyText += `สรุป\n`;
        r.duties.forEach(d => {
          if (d.currentCount > 0) {
            copyText += `ในหน้าที่ ${d.duty} มี ${d.currentCount} คน\n`;
          }
        });
        copyText += `ยอดรวมทั้งหมด ${r.totalSignups} คน`;

        let hasVacant = false;
        let vacantOut = `หน้าที่ที่ยังว่างในกิจกรรม ${r.title}\n`;
        let vIndex = 1;
        r.duties.forEach(d => {
          if (d.quota > 0) {
            let remain = d.quota - d.currentCount;
            if (remain > 0) {
              vacantOut += `${vIndex}. ${d.duty} ว่าง ${remain} ที่\n`;
              vIndex++;
              hasVacant = true;
            }
          }
        });

        let signedUpNames = new Set();
        r.duties.forEach(d => {
          if (d.signups && d.signups.length > 0) {
            d.signups.forEach(name => signedUpNames.add(name));
          }
        });

        let notSignedUp = [];
        if (typeof studentNamesList !== 'undefined') {
          studentNamesList.forEach(s => {
            let fullName = s.name + (s.grade ? ' ' + s.grade : '');
            if (!signedUpNames.has(fullName)) {
              notSignedUp.push(fullName);
            }
          });
        }

        notSignedUp.sort((a, b) => getClassNum(a) - getClassNum(b));

        let notSignedUpText = `รายชื่อนักเรียนที่ไม่ได้ลงชื่อปฏิบัติหน้าที่ใน ${r.title}\n`;
        let notSignedUpHtmlList = '';
        if (notSignedUp.length > 0) {
          notSignedUp.forEach((name, i) => {
            notSignedUpText += `${i + 1}. ${name}\n`;
            notSignedUpHtmlList += `<div style="padding: 4px 0; font-size: 0.95em; color: var(--text-main);">- ${name}</div>`;
          });
        } else {
          notSignedUpText += `ไม่มีนักเรียนที่ตกค้าง (ลงชื่อครบทุกคนแล้ว)\n`;
          notSignedUpHtmlList += `<div style="color:var(--text-dim); font-style: italic;">ไม่มีนักเรียนที่ตกค้าง (ลงชื่อครบทุกคนแล้ว)</div>`;
        }

        html += `
          <div style="background: var(--card-bg); border-radius: 12px; margin-bottom: 20px; border: 1px solid var(--border-light); box-shadow: 0 4px 6px rgba(0,0,0,0.02); overflow:hidden;">
            <div style="background: linear-gradient(135deg, var(--primary), var(--primary-hover)); padding: 15px 20px; color: white;">
              <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 5px;"><i class="fa-regular fa-calendar"></i> ${r.dateStr || '-'}</div>
              <h3 style="margin: 0; font-size: 1.25rem;">${r.title}</h3>
            </div>
            <div style="padding: 20px;">
              <h4 style="margin: 0 0 10px 0; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;"><i class="fa-solid fa-copy"></i> ข้อความสรุป (สำหรับคัดลอก)</h4>
              <div style="position: relative; margin-bottom: 20px;">
                <textarea class="input-control" style="height: 150px; font-family: monospace; font-size: 0.9em; resize: vertical;" readonly id="copy_${r.sheetName}">${copyText}</textarea>
                <button class="btn btn-primary" style="position: absolute; top: 10px; right: 20px; padding: 5px 12px; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2);" onclick="copyTextToClipboard('copy_${r.sheetName}')"><i class="fa-solid fa-copy"></i> คัดลอก</button>
              </div>

              ${hasVacant ? `
              <h4 style="margin: 0 0 10px 0; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;"><i class="fa-solid fa-chair"></i> สรุปหน้าที่ที่ยังว่าง (สำหรับคัดลอก)</h4>
              <div style="position: relative; margin-bottom: 20px;">
                <textarea class="input-control" style="height: 120px; font-family: monospace; font-size: 0.9em; resize: vertical; border-color: rgba(251, 191, 36, 0.4);" readonly id="copy_vacant_${r.sheetName}">${vacantOut}</textarea>
                <button class="btn btn-warning" style="position: absolute; top: 10px; right: 20px; padding: 5px 12px; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2); background-color: var(--warning); color: white; border-color: var(--warning);" onclick="copyTextToClipboard('copy_vacant_${r.sheetName}')"><i class="fa-solid fa-copy"></i> คัดลอก</button>
              </div>
              ` : ''}

              <h4 style="margin: 0 0 10px 0; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;"><i class="fa-solid fa-user-xmark"></i> รายชื่อคนที่ไม่ได้ลงชื่อ (สำหรับคัดลอก)</h4>
              <div style="position: relative; margin-bottom: 20px;">
                <textarea class="input-control" style="height: 120px; font-family: monospace; font-size: 0.9em; resize: vertical; border-color: rgba(244, 63, 94, 0.4);" readonly id="copy_not_signed_up_${r.sheetName}">${notSignedUpText}</textarea>
                <button class="btn btn-danger" style="position: absolute; top: 10px; right: 20px; padding: 5px 12px; font-size: 0.85rem; box-shadow: 0 2px 4px rgba(0,0,0,0.2); background-color: var(--danger); color: white; border-color: var(--danger);" onclick="copyTextToClipboard('copy_not_signed_up_${r.sheetName}')"><i class="fa-solid fa-copy"></i> คัดลอก</button>
              </div>

              <div style="margin-bottom: 20px; display:flex; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                ${r.description && r.description.trim() !== '' ? `
                <div style="flex:1; min-width:200px;">
                  <strong style="color:var(--text-main)">รายละเอียด:</strong>
                  <div style="color:var(--text-muted); margin: 5px 0 0 0; font-size: 0.95rem;" class="toastui-editor-contents">${marked.parse(r.description)}</div>
                </div>
                ` : '<div style="flex:1; min-width:200px;"></div>'}
                <div style="background:rgba(52,211,153,0.1); color:var(--success); padding: 10px 15px; border-radius: 8px; text-align:center; min-width: 120px;">
                  <div style="font-size:0.8rem; font-weight:600; text-transform:uppercase;">รวมคนลงชื่อ</div>
                  <div style="font-size:1.5rem; font-weight:700;">${r.totalSignups}</div>
                </div>
              </div>

              <div style="background: rgba(251, 191, 36, 0.08); border-left: 4px solid var(--warning); padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #b45309;"><i class="fa-solid fa-chair"></i> หน้าที่ที่ยังว่าง ในกิจกรรม ${r.title}</h4>
                <div style="color: var(--text-main);">
                  ${vacantHtmlList || '<div style="color:var(--text-dim); font-style: italic;">ไม่มีหน้าที่ว่าง (เต็มโควต้าแล้ว หรือไม่ได้จำกัดจำนวนรับ)</div>'}
                </div>
              </div>

              <div style="background: rgba(244, 63, 94, 0.08); border-left: 4px solid var(--danger); padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
                <h4 style="margin: 0 0 10px 0; color: #be123c;"><i class="fa-solid fa-user-xmark"></i> รายชื่อคนที่ไม่ได้ลงชื่อทำหน้าที่</h4>
                <div style="color: var(--text-main);">
                  ${notSignedUpHtmlList}
                </div>
              </div>

              <h4 style="margin: 20px 0 10px 0; border-bottom: 1px dashed var(--border-light); padding-bottom: 8px;"><i class="fa-solid fa-users"></i> ลายละเอียดหน้าที่และรายชื่อ</h4>
              ${dutiesHtml || '<div style="color:var(--text-dim); text-align:center;">ไม่มีข้อมูลหน้าที่</div>'}
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }

    function showMultiActivitySelector() {
      const container = document.getElementById('reportsContainer');
      const rtContainer = document.getElementById('dashRealtimeContainer');
      if (rtContainer) rtContainer.style.display = 'none';
      const rtSummary = document.getElementById('dashRealtimeSummarySection');
      if (rtSummary) rtSummary.style.display = 'none';
      const select = document.getElementById('dashRealtimeActivitySelect');
      if (select) select.value = '';
      if (!container) return;

      container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i><br>กำลังโหลดรายการกิจกรรม...</div>`;

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (activities) {
            currentActivities = activities;
            if (!currentActivities || currentActivities.length === 0) {
              container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);">ไม่พบข้อมูลกิจกรรม</div>`;
              return;
            }

            let html = `
              <div class="report-card" style="margin-top:20px; animation: fadeInUp 0.4s ease forwards;">
                <h3 style="margin-top:0; border-bottom: 2px solid var(--primary-light); padding-bottom: 10px;">เลือกกิจกรรมที่ต้องการสรุปเปรียบเทียบ</h3>
                <div style="max-height: 400px; overflow-y: auto; padding: 15px 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
            `;

            currentActivities.forEach(a => {
              const displayDate = formatThaiDateRange(a.dateStr, a.endDateStr) || a.dateStr;
              html += `
                <label style="display: flex; align-items: center; gap: 10px; padding: 10px; border: 1px solid var(--border-light); border-radius: 8px; cursor: pointer; background: var(--bg);">
                  <input type="checkbox" class="multi-activity-cb" value="${a.sheetName}" style="width: 20px; height: 20px;">
                  <span style="font-size: 0.95rem; font-weight: 500;">${displayDate} - ${a.title}</span>
                </label>
              `;
            });

            html += `
                </div>
                <div style="margin-top: 20px; text-align: center;">
                  <button class="btn btn-primary" onclick="calculateMultiActivitySummary()"><i class="fa-solid fa-calculator"></i> คำนวณสรุปข้ามกิจกรรม</button>
                </div>
              </div>
            `;

            container.innerHTML = html;
          })
          .withFailureHandler(function (error) {
            container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> โหลดรายการกิจกรรมล้มเหลว: ${error.message}</div>`;
          })
          .getAllActivities();
      }
    }

    function calculateMultiActivitySummary() {
      const checkboxes = document.querySelectorAll('.multi-activity-cb:checked');
      if (checkboxes.length === 0) {
        showToast('กรุณาเลือกอย่างน้อย 1 กิจกรรม', 'error');
        return;
      }

      const sheetNames = Array.from(checkboxes).map(cb => cb.value);

      const container = document.getElementById('reportsContainer');
      container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);"><i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i><br>กำลังประมวลผลข้อมูล...</div>`;

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (data) {
            renderMultiActivitySummary(data);
          })
          .withFailureHandler(function (error) {
            container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--danger);"><i class="fa-solid fa-circle-exclamation"></i> เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}</div>`;
          })
          .getMultiActivitySummary(sheetNames);
      }
    }

    function renderMultiActivitySummary(data) {
      const container = document.getElementById('reportsContainer');
      if (!data || (!data.noDuties.length && !data.hasDuties.length)) {
        container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);">ไม่พบข้อมูลจากกิจกรรมที่เลือก</div>`;
        return;
      }

      let activitiesHtml = data.activities.map(a => `<span class="duty-badge" style="background: var(--primary-light); color: var(--primary);">${a}</span>`).join(' ');

      let noDutiesHtml = data.noDuties.map((name, i) => `<div style="padding: 6px 12px; border-bottom: 1px solid var(--border-light); ${i % 2 === 0 ? 'background: rgba(0,0,0,0.01);' : ''}">${i + 1}. ${name}</div>`).join('');
      if (!noDutiesHtml) noDutiesHtml = '<div style="padding: 10px; color: var(--text-dim);">ไม่มีนักเรียนที่ไม่มีหน้าที่</div>';

      let hasDutiesHtml = data.hasDuties.map((student, i) => {
        let dutyDetails = '';
        for (const act in student.duties) {
          dutyDetails += `<div style="font-size: 0.85rem; margin-top: 4px;"><span style="font-weight:600; color:var(--text-muted);">${act}:</span> ${student.duties[act].join(', ')}</div>`;
        }
        return `
          <div style="padding: 12px; border: 1px solid var(--border-light); border-radius: 8px; margin-bottom: 10px; background: var(--bg);">
            <div style="font-weight: 600; color: var(--text-main); margin-bottom: 5px;">${i + 1}. ${student.fullName}</div>
            <div style="padding-left: 10px; border-left: 3px solid var(--primary-light);">${dutyDetails}</div>
          </div>
        `;
      }).join('');
      if (!hasDutiesHtml) hasDutiesHtml = '<div style="padding: 10px; color: var(--text-dim);">ไม่มีนักเรียนที่มีหน้าที่</div>';

      container.innerHTML = `
        <div class="report-card" style="margin-top:20px; animation: fadeInUp 0.4s ease forwards;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary-light); padding-bottom: 10px; margin-bottom: 15px;">
            <h3 style="margin:0;">รายงานสรุปข้ามกิจกรรม</h3>
            <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.85rem;" onclick="showMultiActivitySelector()"><i class="fa-solid fa-arrow-left"></i> กลับ</button>
          </div>
          
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 600; margin-bottom: 5px; color: var(--text-muted);">กิจกรรมที่นำมาเปรียบเทียบ:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">${activitiesHtml}</div>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="background: rgba(244, 63, 94, 0.05); border: 1px solid rgba(244, 63, 94, 0.1); border-radius: 12px; padding: 15px;">
              <h4 style="color: var(--danger); margin-top: 0; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between;">
                <span><i class="fa-solid fa-user-xmark"></i> นักเรียนที่ยังไม่มีหน้าที่เลย</span>
                <span class="duty-badge" style="background: var(--danger); color: white;">${data.noDuties.length} คน</span>
              </h4>
              <div style="max-height: 500px; overflow-y: auto; background: white; border-radius: 8px; border: 1px solid var(--border-light);">
                ${noDutiesHtml}
              </div>
            </div>
            
            <div style="background: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.1); border-radius: 12px; padding: 15px;">
              <h4 style="color: var(--success); margin-top: 0; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between;">
                <span><i class="fa-solid fa-user-check"></i> นักเรียนที่มีหน้าที่แล้ว</span>
                <span class="duty-badge" style="background: var(--success); color: white;">${data.hasDuties.length} คน</span>
              </h4>
              <div style="max-height: 500px; overflow-y: auto; padding-right: 5px;">
                ${hasDutiesHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    function copyTextToClipboard(elementId) {
      const el = document.getElementById(elementId);
      if (el) {
        el.select();
        document.execCommand('copy');
        showToast('คัดลอกข้อความเรียบร้อยแล้ว');
      }
    }

    function copyToClipboard(elementId, btn) {
      const el = document.getElementById(elementId);
      if (el) {
        el.select();
        document.execCommand('copy');
        showToast('คัดลอกข้อความเรียบร้อยแล้ว');
        if (btn) {
          const originalHTML = btn.innerHTML;
          btn.innerHTML = '<i class="fa-solid fa-check"></i> คัดลอกแล้ว';
          setTimeout(() => {
            btn.innerHTML = originalHTML;
          }, 2000);
        }
      }
    }

    function loadDashStats() {
      if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(res => {
          document.getElementById('stat-students').innerText = res.students;
          document.getElementById('stat-activities').innerText = res.activities;
          document.getElementById('stat-duties').innerText = res.duties;
          document.getElementById('stat-admins').innerText = res.admins;
          document.getElementById('stat-signups').innerText = res.signups;
          document.getElementById('stat-active-activities').innerText = res.activeActivities;
          window.dbSheetUrl = res.sheetUrl;
        }).getDashboardStats();
      }
    }

    function openDatabaseSheet() {
      if (window.dbSheetUrl) window.open(window.dbSheetUrl, '_blank');
      else showToast('กำลังโหลดข้อมูล...', 'error');
    }

    // --- Dashboard: Activities (Split Layout) ---
    let dashAllActivities = [];
    let selectedDashActivityStr = null;

    function loadDashActivities() {
      const list = document.getElementById('dashActivitiesList');
      list.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-dim);">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i><br>
        กำลังโหลดกิจกรรม...
      </div>`;
      if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(res => {
          dashAllActivities = res;
          renderDashActivities();
        }).withFailureHandler(err => {
          list.innerHTML = `<div style="text-align:center; color:red; padding: 20px;">${err.message}</div>`;
        }).getAllActivities();
      }
    }

    function renderDashActivities() {
      const list = document.getElementById('dashActivitiesList');
      list.innerHTML = '';
      if (dashAllActivities.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding: 40px; color:var(--text-dim); border: 2px dashed var(--border-light); border-radius: 16px;">ยังไม่มีกิจกรรมในระบบ</div>';
        return;
      }
      dashAllActivities.forEach(act => {
        // Date formatting: act.dateStr is YYYY-MM-DD
        let dateDisplay = formatThaiDateRange(act.dateStr, act.endDateStr);

        const isActive = selectedDashActivityStr === act.sheetName ? 'active' : '';
        const actDutiesStr = encodeURIComponent(JSON.stringify(act.duties || []));

        const card = document.createElement('div');
        card.className = `list-item-card ${isActive}`;
        card.onclick = () => selectActivityInDash(act.sheetName);
        card.innerHTML = `
          <div class="list-item-info">
            <h4>${act.title}</h4>
            <p><i class="fa-regular fa-calendar"></i> ${dateDisplay} ${act.deadline ? '<span style="color:var(--danger); margin-left:10px;"><i class="fa-solid fa-clock"></i> มีกำหนดเวลา</span>' : ''}</p>
          </div>
          <div>
            <button class="btn btn-secondary" style="color:#38bdf8; border:none; background:transparent; padding: 10px;" onclick="event.stopPropagation(); exportToPDFDash('${act.sheetName}', '${act.title}', '${dateDisplay}', '${actDutiesStr}')" title="ส่งออกข้อมูลเป็น PDF"><i class="fa-solid fa-file-pdf" style="font-size: 1.2rem;"></i></button>
            <i class="fa-solid fa-chevron-right" style="color:var(--text-dim); margin-left: 10px;"></i>
          </div>
        `;
        list.appendChild(card);
      });
    }

    function clearActivityEditor() {
      selectedDashActivityStr = null;
      renderDashActivities(); // update active state

      document.getElementById('editorTitle').innerHTML = '<i class="fa-solid fa-square-plus"></i> สร้างกิจกรรมใหม่';

      // Auto-set to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('dashActDate').value = tomorrow.toISOString().split('T')[0];
      document.getElementById('dashActDate').disabled = false;
      document.getElementById('dashActDate').style.background = '';

      if (document.getElementById('dashActEndDate')) {
        document.getElementById('dashActEndDate').value = '';
        document.getElementById('dashActEndDate').disabled = false;
        document.getElementById('dashActEndDate').style.background = '';
      }

      document.getElementById('dashActTitle').value = '';
      document.getElementById('dashActStartTime').value = '';
      document.getElementById('dashActDeadline').value = '';
      dashEditor.setMarkdown(''); document.getElementById('dashActDesc').value = '';
      document.getElementById('dashActViewMode').value = 'counts';
      if (document.getElementById('dashActAllowMultipleDuties')) document.getElementById('dashActAllowMultipleDuties').checked = false;

      // Re-render quotas
      setupAdminDutyGrid();

      document.getElementById('btnSaveActivityDash').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> สร้างกิจกรรมใหม่';
      document.getElementById('btnDeleteActivityDash').style.display = 'none';
      document.getElementById('dashActivityEditorModal').classList.add('active');
    }

    function selectActivityInDash(sheetName) {
      selectedDashActivityStr = sheetName;
      renderDashActivities(); // update active state

      const act = dashAllActivities.find(a => a.sheetName === sheetName);
      if (!act) return;
      window.originalCreatorForDash = act.creatorName || '';

      document.getElementById('editorTitle').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> แก้ไขกิจกรรม';

      document.getElementById('dashActDate').value = act.dateStr;
      document.getElementById('dashActDate').disabled = false;
      document.getElementById('dashActDate').style.background = '';

      if (document.getElementById('dashActEndDate')) {
        document.getElementById('dashActEndDate').value = act.endDateStr || '';
        document.getElementById('dashActEndDate').disabled = false;
        document.getElementById('dashActEndDate').style.background = '';
      }

      document.getElementById('dashActTitle').value = act.title;
      dashEditor.setMarkdown(act.description || ''); document.getElementById('dashActDesc').value = act.description || '';
      document.getElementById('dashActViewMode').value = act.viewMode || 'counts';
      if (document.getElementById('dashActAllowMultipleDuties')) document.getElementById('dashActAllowMultipleDuties').checked = act.allowMultipleDuties !== false;

      if (act.startTime) {
        const d = new Date(act.startTime);
        const tzoffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, 16);
        document.getElementById('dashActStartTime').value = localISOTime;
      } else {
        document.getElementById('dashActStartTime').value = '';
      }

      if (act.deadline) {
        const d = new Date(act.deadline);
        const tzoffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, 16);
        document.getElementById('dashActDeadline').value = localISOTime;
      } else {
        document.getElementById('dashActDeadline').value = '';
      }

      // Re-render quotas with loaded data
      setupAdminDutyGrid();
      if (act.duties && act.duties.length > 0) {
        act.duties.forEach(d => {
          addDynamicDutyRow(d.duty, d.quota);
        });
      }
      updateDutySummary();

      document.getElementById('btnSaveActivityDash').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกการเปลี่ยนแปลง';
      document.getElementById('btnDeleteActivityDash').style.display = 'block';
      document.getElementById('dashActivityEditorModal').classList.add('active');
    }

    function submitActivityFromEditor() {
      const dateVal = document.getElementById('dashActDate').value;
      const endDateVal = document.getElementById('dashActEndDate') ? document.getElementById('dashActEndDate').value : '';
      const title = document.getElementById('dashActTitle').value.trim();
      const desc = dashEditor.getMarkdown().trim();
      const startTimeVal = document.getElementById('dashActStartTime').value;
      const deadlineVal = document.getElementById('dashActDeadline').value;
      const viewMode = document.getElementById('dashActViewMode').value;
      const allowMultiple = document.getElementById('dashActAllowMultipleDuties') ? document.getElementById('dashActAllowMultipleDuties').checked : false;
      const btn = document.getElementById('btnSaveActivityDash');

      if (!dateVal) { showToast('กรุณาระบุวันที่จัดกิจกรรม', 'error'); return; }
      if (!title) { showToast('กรุณากรอกชื่อกิจกรรม', 'error'); return; }

      let startTimeStr = '';
      if (startTimeVal) {
        startTimeStr = new Date(startTimeVal).toISOString();
      }

      let deadlineStr = '';
      if (deadlineVal) {
        deadlineStr = new Date(deadlineVal).toISOString();
      }

      let selectedDuties = [];
      const listContainer = document.getElementById('dynamicDutyList');
      if (listContainer) {
        const rows = listContainer.querySelectorAll('.dynamic-duty-row');
        rows.forEach(row => {
          const select = row.querySelector('.duty-select');
          const input = row.querySelector('.duty-quota');
          if (select && input) {
            const duty = select.value;
            const q = parseInt(input.value) || 0;
            if (duty && q > 0) {
              selectedDuties.push({ duty: duty, quota: q });
            }
          }
        });
      }

      const uniqueDuties = new Set();
      let hasDuplicates = false;
      selectedDuties.forEach(d => {
        if (uniqueDuties.has(d.duty)) hasDuplicates = true;
        uniqueDuties.add(d.duty);
      });
      if (hasDuplicates) {
        showToast('ไม่สามารถระบุหน้าที่ซ้ำกันได้ กรุณาตรวจสอบอีกครั้ง', 'error');
        return;
      }

      if (selectedDuties.length === 0) {
        showToast('กรุณากำหนดโควต้าคนอย่างน้อย 1 หน้าที่', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

      const dutiesJson = JSON.stringify(selectedDuties);

      let startDate = new Date(dateVal);
      let endDate = endDateVal ? new Date(endDateVal) : null;
      if (endDate && endDate < startDate) {
        showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น', 'error');
        btn.disabled = false;
        btn.innerHTML = selectedDashActivityStr ? '<i class="fa-solid fa-floppy-disk"></i> บันทึกการเปลี่ยนแปลง' : '<i class="fa-solid fa-floppy-disk"></i> สร้างกิจกรรมใหม่';
        return;
      }

      const dateStr = `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()} 12:00:00`;
      const endDateStr = endDate ? `${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()} 12:00:00` : '';

      let finalCreatorStr = adminInfo ? adminInfo.name : 'แอดมิน';
      if (selectedDashActivityStr && window.originalCreatorForDash) {
        const origCreator = window.originalCreatorForDash.split('|')[0];
        finalCreatorStr = origCreator + '|' + finalCreatorStr;
      }

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (res) {
            showToast('บันทึกกิจกรรมสำเร็จ!');
            btn.disabled = false;
            if (selectedDashActivityStr) {
              btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกการเปลี่ยนแปลง';
            } else {
              btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> สร้างกิจกรรมใหม่';
              clearActivityEditor();
            }
            loadDashActivities(); // Refresh dash list
            loadDashStats(); // Refresh count
            loadUpcomingActivities(); // Refresh feed
            closeModal('dashActivityEditorModal');
          })
          .withFailureHandler(function (error) {
            showToast('บันทึกไม่สำเร็จ: ' + error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = selectedDashActivityStr ? '<i class="fa-solid fa-floppy-disk"></i> บันทึกการเปลี่ยนแปลง' : '<i class="fa-solid fa-floppy-disk"></i> สร้างกิจกรรมใหม่';
          })
          .saveActivity(selectedDashActivityStr, dateStr, title, desc, dutiesJson, startTimeStr, deadlineStr, viewMode, endDateStr, allowMultiple, finalCreatorStr, adminInfo ? adminInfo.name : 'Unknown');
      }
    }

    function deleteActivityFromEditor() {
      if (!selectedDashActivityStr) return;
      showCustomConfirm('ยืนยันการลบกิจกรรมนี้? (ข้อมูลใน Sheet รายวันจะไม่ถูกลบ แต่หน้ากิจกรรมจะหายไป)', function () {
        const btn = document.getElementById('btnDeleteActivityDash');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังลบ...';

        if (typeof google !== 'undefined' && google.script) {
          google.script.run
            .withSuccessHandler(function (res) {
              showToast('ลบกิจกรรมออกจากระบบแล้ว');
              btn.disabled = false;
              clearActivityEditor();
              loadDashActivities();
              loadDashStats();
              loadUpcomingActivities();
              closeModal('dashActivityEditorModal');
            })
            .withFailureHandler(function (error) {
              showToast('ลบไม่สำเร็จ: ' + error.message, 'error');
              btn.disabled = false;
              btn.innerHTML = '<i class="fa-solid fa-trash-can"></i> ลบกิจกรรมนี้';
            })
            .deleteActivity(selectedDashActivityStr, adminInfo ? adminInfo.name : 'Unknown');
        }
      });
    }

    // Export Activity to PDF
    function _exportToPDFDash(sheetName, title, dateDisplay, dutiesStr) {
      if (!sheetName) return;
      showToast('กำลังเตรียมข้อมูลสำหรับสร้าง PDF...', 'success');

      let customOrderedDuties = [];
      if (dutiesStr) {
        try {
          const actDuties = JSON.parse(decodeURIComponent(dutiesStr));
          customOrderedDuties = actDuties.map(d => d.duty);
        } catch (e) { }
      }

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (signups) {
            generatePdfPrintView(signups, title, dateDisplay, customOrderedDuties);
          })
          .withFailureHandler(function (err) {
            showToast('ไม่สามารถดึงข้อมูลได้: ' + err.message, 'error');
          })
          .getSignupsForActivity(sheetName);
      } else {
        const mockSignups = [
          { duty: "ประตู 1", name: "นางสาวสมหญิง น่ารัก 4/1" },
          { duty: "ประตู 1", name: "นายสมชาย ใจดี 5/2" },
          { duty: "อาคาร 3", name: "เด็กหญิงเก่ง ดี 4/1" },
        ];
        generatePdfPrintView(mockSignups, title, dateDisplay, customOrderedDuties);
      }
    }

    function _exportCurrentActivityPDF() {
      if (!selectedDateInfo || !selectedDateInfo.activity) return;

      const act = selectedDateInfo.activity;
      const d = new Date(act.date || selectedDateInfo.dateObj);
      let dateDisplay = formatThaiDateRange(act.date, act.endDateStr);

      showToast('กำลังเตรียมข้อมูลสำหรับสร้าง PDF...', 'success');

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (signups) {
            const actDutiesNames = act.duties ? act.duties.map(d => d.duty) : [];
            generatePdfPrintView(signups, act.title, dateDisplay, actDutiesNames);
          })
          .withFailureHandler(function (err) {
            showToast('ไม่สามารถดึงข้อมูลได้: ' + err.message, 'error');
          })
          .getSignupsForActivity(act.sheetName);
      } else {
        const actDutiesNames = act.duties ? act.duties.map(d => d.duty) : [];
        generatePdfPrintView(selectedDateInfo.signups || [], act.title, dateDisplay, actDutiesNames);
      }
    }

    function generatePdfPrintView(signups, title, dateDisplay, customOrderedDuties) {
      const grouped = {};
      signups.forEach(s => {
        if (!grouped[s.duty]) grouped[s.duty] = [];
        grouped[s.duty].push(s.name);
      });

      const getClassNum = (name) => {
        const parts = name.trim().split(' ');
        const cls = parts[parts.length - 1];
        if (cls && cls.includes('/')) {
          const cleanCls = cls.replace(/^ม\./, '');
          const cParts = cleanCls.split('/');
          return parseInt(cParts[0]) * 100 + parseInt(cParts[1]);
        }
        return 9999;
      };

      let orderedDuties = [];
      if (customOrderedDuties && customOrderedDuties.length > 0) {
        orderedDuties = customOrderedDuties;
      } else {
        systemDuties.forEach(d => {
          if (grouped[d]) orderedDuties.push(d);
        });
        for (let d in grouped) {
          if (!systemDuties.includes(d)) {
            orderedDuties.push(d);
          }
        }
      }

      for (let d in grouped) {
        grouped[d].sort((a, b) => getClassNum(a) - getClassNum(b));
      }

      Swal.close();
      let html = `
        <div style="font-family: 'Sarabun', sans-serif; padding: 0; color: #000; margin: 0;">
          <table style="width: 100%; margin-bottom: 15px; border: none; border-collapse: collapse;">
            <tr>
              <td style="width: 90px; border: none; vertical-align: middle; text-align: left; padding: 0;">
                <img src="https://raw.githubusercontent.com/Pansamcth/Pansamcth.github.io/main/si-roster/assets/icons/logo.png" alt="Logo" style="width: 75px; height: 75px; object-fit: contain;">
              </td>
              <td style="border: none; vertical-align: middle; text-align: left; padding: 0;">
                <div style="margin: 2px 0; line-height: 1.25; font-size: 16px; font-weight: bold;">งานสารวัตรนักเรียน</div>
                <div style="margin: 2px 0; line-height: 1.25; font-size: 14px; font-weight: bold;">โรงเรียนเดชะปัตตนยานุกูล จ.ปัตตานี</div>
                <div style="margin: 2px 0; line-height: 1.25; font-size: 14px; font-weight: bold;">การปฏิบัติหน้าที่ : ${title}</div>
                <div style="margin: 2px 0; line-height: 1.25; font-size: 14px; font-weight: bold;">วันที่จัดกิจกรรม : ${dateDisplay}</div>
                <div style="margin: 2px 0; line-height: 1.25; font-size: 12px; font-weight: normal;">ระบบเลือกหน้าที่อิเล็กทรอนิกส์</div>
              </td>
            </tr>
          </table>
      `;

      if (Object.keys(grouped).length === 0) {
        html += `<p style="text-align:center; font-size: 15px; margin: 20px 0;">-- ไม่มีผู้ลงชื่อในกิจกรรมนี้ --</p>`;
      } else {
        orderedDuties.forEach(d => {
          if (!grouped[d]) return;
          html += `<div style="margin-bottom: 20px; page-break-inside: avoid;">
             <div style="font-size: 15px; font-weight: bold; margin-bottom: 6px; text-decoration: underline;">หน้าที่ที่รับผิดชอบ: ${d}</div>
             <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
               <thead>
                 <tr>
                   <th style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center; font-weight: bold; width: 6%;">ลำดับ</th>
                   <th style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center; font-weight: bold; width: 6%;"></th>
                   <th style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center; font-weight: bold; width: 48%;">ชื่อ - นามสกุล</th>
                   <th style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center; font-weight: bold; width: 15%;">ชั้น</th>
                   <th style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center; font-weight: bold; width: 25%;">หมายเหตุ</th>
                 </tr>
               </thead>
               <tbody>
           `;
          grouped[d].forEach((fullName, idx) => {
            const parts = fullName.trim().split(' ');
            let className = '';
            let justName = fullName;
            const lastPart = parts[parts.length - 1];
            if (lastPart && lastPart.includes('/')) {
              className = parts.pop();
              justName = parts.join(' ');
            }

            html += `<tr>
              <td style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center;">${idx + 1}</td>
              <td style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center;"><div style="width: 13px; height: 13px; border: 1px solid #000; display: inline-block; vertical-align: middle;"></div></td>
              <td style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: left;">${justName}</td>
              <td style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center;">${className}</td>
              <td style="border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; text-align: center;"></td>
            </tr>`;
          });
          html += `</tbody></table></div>`;
        });
      }

      let advisorsHtml = '';
      if (typeof exportOptions !== 'undefined' && exportOptions && exportOptions.selectedAdvisors && exportOptions.selectedAdvisors.length > 0) {
        const advs = exportOptions.selectedAdvisors;
        const useSig = exportOptions.sigType === 'digital';

        let gridHtml = '<table style="width: 100%; margin-top: 25px; page-break-inside: avoid; border: none; border-collapse: collapse;">';
        let rowOpen = false;

        advs.forEach((adv, index) => {
          let sigImgHtml = '';
          if (useSig && adv.signatureBase64) {
            sigImgHtml = `<img src="${adv.signatureBase64}" style="max-height: 50px; display: block; margin: 0 auto; margin-bottom: -25px; position: relative; z-index: 1;">`;
          }

          let lineHtml = '';
          if (useSig) {
            lineHtml = `ลงชื่อ ......................................................`;
          } else {
            lineHtml = `ลงชื่อ <span style="display:inline-block; width:180px; border-bottom:1px solid #000;"></span>`;
          }

          const cellHtml = `
            <td style="width: ${advs.length > 1 ? '50%' : '100%'}; text-align: center; vertical-align: bottom; padding-bottom: 15px; border: none;">
              ${sigImgHtml}
              <div style="font-size: 13px; line-height: 1.6; margin-top: ${useSig && adv.signatureBase64 ? '0' : '10px'}; position: relative; z-index: 2;">
                ${lineHtml}<br>
                ( ${adv.name} )<br>
                ${adv.position}
              </div>
            </td>
          `;

          if (advs.length === 1) {
            gridHtml += `<tr>${cellHtml}</tr>`;
          } else {
            if (index % 2 === 0) {
              gridHtml += `<tr>${cellHtml}`;
              rowOpen = true;
            } else {
              gridHtml += `${cellHtml}</tr>`;
              rowOpen = false;
            }
          }
        });

        if (rowOpen) {
          gridHtml += `<td style="width: 50%; border: none;"></td></tr>`;
        }

        gridHtml += '</table>';
        advisorsHtml = gridHtml;
      }

      html += advisorsHtml;
      html += `</div>`;

      const printWin = window.open('', '_blank');
      if (!printWin) {
        Swal.fire('แจ้งเตือน', 'เบราว์เซอร์ของคุณบล็อกการเปิดหน้าต่างใหม่ (Pop-up) กรุณาอนุญาตแล้วลองอีกครั้ง', 'warning');
        return;
      }

      printWin.document.open();
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Export PDF - ${title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page { size: A4; margin: 10mm; }
            body { font-family: 'Sarabun', sans-serif; padding: 0; color: #000; margin: 0; background: white; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
            th, td { border: 1px solid #000; padding: 3px 4px; font-size: 13px; line-height: 1.2; color: #000; }
            th { text-align: center; font-weight: bold; background: transparent; }
            td { text-align: center; font-weight: normal; background: transparent; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `);
      printWin.document.close();

      const executePrint = () => {
        printWin.focus();
        printWin.print();
      };

      const runPrint = () => {
        if (printWin.document.fonts && printWin.document.fonts.ready) {
          printWin.document.fonts.ready.then(() => setTimeout(executePrint, 300));
        } else {
          setTimeout(executePrint, 1000);
        }
      };

      const img = printWin.document.querySelector('img');
      if (img) {
        if (img.complete) {
          runPrint();
        } else {
          img.onload = img.onerror = runPrint;
          setTimeout(runPrint, 2000); // fallback
        }
      } else {
        runPrint();
      }
    }

    function deleteActivityDash(dateStr) {
      showCustomConfirm('ยืนยันลบกิจกรรมในวันที่: ' + dateStr + ' ?\n(ข้อมูลใน Sheet รายวันจะไม่ถูกลบ แต่รายการกิจกรรมจะหายไป)', function () {
        document.getElementById('activitiesTableBody').innerHTML = '<tr><td colspan="4" style="text-align:center">กำลังลบ...</td></tr>';
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            showToast('ลบกิจกรรมเรียบร้อย');
            loadDashActivities();
          }).withFailureHandler(err => {
            showToast('ลบไม่สำเร็จ: ' + err.message, 'error');
            loadDashActivities();
          }).deleteActivity(dateStr + 'T12:00:00', adminInfo ? adminInfo.name : 'Unknown'); // Ensure it passes as valid parsable string
        }
      });
    }

    // Create new activity from Dashboard
    function openActivityModalForAddDash() {
      selectedDateInfo = { dateObj: new Date() };

      // Update modal HTML to show date picker
      document.getElementById('activityModalDate').innerHTML = `
        <div style="display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label style="font-weight:bold; font-size: 14px; display:block; margin-bottom:5px; color:var(--text-main);">เลือกวันที่จัดกิจกรรม (เริ่มต้น):</label>
            <input type="date" id="actDateInput" class="input-control" value="${selectedDateInfo.dateObj.toISOString().split('T')[0]}" style="width: 100%; margin-bottom: 15px;">
          </div>
          <div style="flex: 1;">
            <label style="font-weight:bold; font-size: 14px; display:block; margin-bottom:5px; color:var(--text-main);">ถึงวันที่ (ไม่จำเป็น):</label>
            <input type="date" id="actEndDateInput" class="input-control" value="" style="width: 100%; margin-bottom: 15px;">
          </div>
        </div>
      `;

      document.getElementById('actTitle').value = '';
      actEditor.setMarkdown(''); document.getElementById('actDesc').value = '';
      document.getElementById('actDeadline').value = '';

      systemDuties.forEach((duty, i) => {
        document.getElementById(`quota-${i}`).value = '0';
      });

      document.getElementById('activityModal').classList.add('active');
    }

    // Edit existing activity from Dashboard
    function editActivityDash(dateStr) {
      const act = dashAllActivities.find(a => a.dateStr === dateStr);
      if (!act) return;

      selectedDateInfo = { dateObj: new Date(dateStr), activity: act };

      document.getElementById('activityModalDate').innerHTML = `
        <label style="font-weight:bold; font-size: 14px; display:block; margin-bottom:5px; color:var(--text-main);">วันที่จัดกิจกรรม (ไม่สามารถแก้ไขวันที่ได้):</label>
        <input type="date" id="actDateInput" class="input-control" value="${dateStr}" disabled style="width: 100%; margin-bottom: 15px; background: rgba(15,23,42,0.6);">
      `;

      document.getElementById('actTitle').value = act.title;
      actEditor.setMarkdown(act.description || ''); document.getElementById('actDesc').value = act.description || '';

      if (act.deadline) {
        const d = new Date(act.deadline);
        const tzoffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, 16);
        document.getElementById('actDeadline').value = localISOTime;
      } else {
        document.getElementById('actDeadline').value = '';
      }

      systemDuties.forEach((duty, i) => {
        const found = act.duties.find(d => d.duty === duty);
        document.getElementById(`quota-${i}`).value = found ? found.quota : '0';
      });

      document.getElementById('activityModal').classList.add('active');
    }

    function renderDashStudents() {
      const tbody = document.getElementById('studentsTableBody');
      tbody.innerHTML = '';
      if (studentNamesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:var(--text-dim);">ไม่มีนักเรียนในระบบ</td></tr>';
      }
      studentNamesList.forEach(s => {
        tbody.innerHTML += `<tr>
          <td>${s.name}</td>
          <td>${s.grade || ''}</td>
          <td style="text-align:center; white-space:nowrap;">
            <div style="display: flex; justify-content: center; gap: 5px;">
              <button class="btn btn-secondary" style="color:var(--warning); border:1px solid rgba(250,204,21,0.3); background:transparent; padding: 5px 10px;" onclick="editStudentDash('${s.name}', '${s.grade || ''}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-secondary" style="color:var(--danger); border:1px solid rgba(248,113,113,0.3); background:transparent; padding: 5px 10px;" onclick="deleteStudentDash('${s.name}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
      });
    }

    function editStudentDash(oldName, oldGrade) {
      showEditStudentModal(oldName, oldGrade, function (newName, newGrade) {
        if (!newName || newName.trim() === '') return;
        if (newName === oldName && newGrade === oldGrade) return;

        document.getElementById('studentsTableBody').innerHTML = '<tr><td colspan="3" style="text-align:center">กำลังแก้ไข...</td></tr>';
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            const idx = studentNamesList.findIndex(s => s.name === oldName);
            if (idx !== -1) {
              studentNamesList[idx].name = newName.trim();
              studentNamesList[idx].grade = newGrade.trim();
            }
            populateStudentDatalist();
            renderDashStudents();
            showToast(res.message);
          }).editStudent(oldName, oldGrade, newName.trim(), newGrade.trim());
        }
      });
    }

    function addStudentFromDash() {
      const inputName = document.getElementById('newStudentName');
      const inputGrade = document.getElementById('newStudentGrade');
      const btn = document.getElementById('btnAddStudent');
      const valName = inputName.value.trim();
      const valGrade = inputGrade.value.trim();
      if (!valName) return;
      btn.innerHTML = '...'; btn.disabled = true;
      if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(res => {
          studentNamesList.push({ name: valName, grade: valGrade });
          populateStudentDatalist();
          inputName.value = '';
          inputGrade.value = '';
          btn.innerHTML = '<i class="fa-solid fa-plus"></i> เพิ่ม'; btn.disabled = false;
          renderDashStudents();
          showToast(res.message);
        }).withFailureHandler(err => {
          btn.innerHTML = '<i class="fa-solid fa-plus"></i> เพิ่ม'; btn.disabled = false;
          showToast(err.message, 'error');
        }).addStudent(valName, valGrade);
      }
    }

    function deleteStudentDash(name) {
      showCustomConfirm('ยืนยันลบนักเรียน: ' + name + ' ?', function () {
        document.getElementById('studentsTableBody').innerHTML = '<tr><td colspan="3" style="text-align:center">กำลังลบ...</td></tr>';
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            studentNamesList = studentNamesList.filter(s => s.name !== name);
            populateStudentDatalist();
            renderDashStudents();
            showToast(res.message);
          }).deleteStudent(name);
        }
      });
    }

    function renderDashDuties() {
      const tbody = document.getElementById('dutiesTableBody');
      tbody.innerHTML = '';
      if (systemDuties.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; color:var(--text-dim);">ยังไม่มีหน้าที่ที่รับผิดชอบในระบบ</td></tr>';
      }
      systemDuties.forEach(duty => {
        tbody.innerHTML += `<tr>
          <td>${duty}</td>
          <td style="text-align:center; white-space:nowrap;">
            <div style="display: flex; justify-content: center; gap: 5px;">
              <button class="btn btn-secondary" style="color:var(--warning); border:1px solid rgba(250,204,21,0.3); background:transparent; padding: 5px 10px;" onclick="editDutyDash('${duty}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-secondary" style="color:var(--danger); border:1px solid rgba(248,113,113,0.3); background:transparent; padding: 5px 10px;" onclick="deleteDutyDash('${duty}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          </td>
        </tr>`;
      });
    }

    function editDutyDash(oldName) {
      showCustomPrompt('แก้ไขชื่อสถานที่ (Duty)', 'ชื่อสถานที่:', oldName, function (newName) {
        if (!newName || newName.trim() === '' || newName === oldName) return;
        document.getElementById('dutiesTableBody').innerHTML = '<tr><td colspan="2" style="text-align:center">กำลังแก้ไข...</td></tr>';
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            const idx = systemDuties.indexOf(oldName);
            if (idx !== -1) systemDuties[idx] = newName.trim();
            renderDashDuties();
            showToast(res.message);
          }).editDuty(oldName, newName.trim());
        }
      });
    }

    function addDutyFromDash() {
      const input = document.getElementById('newDutyName');
      const btn = document.getElementById('btnAddDuty');
      const val = input.value.trim();
      if (!val) return;
      btn.innerHTML = '...'; btn.disabled = true;
      if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(res => {
          systemDuties.push(val);
          input.value = '';
          btn.innerHTML = 'เพิ่มหน้าที่ที่รับผิดชอบ'; btn.disabled = false;
          renderDashDuties();
          showToast(res.message);
        }).withFailureHandler(err => {
          btn.innerHTML = 'เพิ่มหน้าที่ที่รับผิดชอบ'; btn.disabled = false;
          showToast(err.message, 'error');
        }).addDuty(val);
      }
    }

    function deleteDutyDash(name) {
      showCustomConfirm('ยืนยันลบหน้าที่ที่รับผิดชอบ: ' + name + ' ?\n(หน้าที่ที่รับผิดชอบเดิมในกิจกรรมเก่าจะยังคงอยู่ แต่จะเลือกใหม่ไม่ได้)', function () {
        document.getElementById('dutiesTableBody').innerHTML = '<tr><td colspan="2" style="text-align:center">กำลังลบ...</td></tr>';
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            systemDuties = systemDuties.filter(n => n !== name);
            renderDashDuties();
            showToast(res.message);
          }).deleteDuty(name);
        }
      });
    }

    function loadDashAdmins() {
      const tbody = document.getElementById('dashAdminsTableBody');
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">กำลังโหลด...</td></tr>';
      if (typeof google !== 'undefined' && google.script) {
        google.script.run.withSuccessHandler(res => {
          dashAdmins = res;
          renderDashAdminsList();
        }).getAdmins();
      }
    }

    function renderDashAdminsList() {
      const tbody = document.getElementById('dashAdminsTableBody');
      tbody.innerHTML = '';
      dashAdmins.forEach(a => {
        let actionsHtml = '';
        if (a.user !== adminInfo.user) {
          actionsHtml = `
            <div style="display: flex; justify-content: center; gap: 5px;">
              <button class="btn btn-secondary" style="color:var(--warning); border:1px solid rgba(250,204,21,0.3); background:transparent; padding: 5px 10px;" onclick="editAdminDash('${a.user}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-secondary" style="color:var(--danger); border:1px solid rgba(248,113,113,0.3); background:transparent; padding: 5px 10px;" onclick="deleteAdminDash('${a.user}')"><i class="fa-solid fa-trash"></i></button>
            </div>
          `;
        } else {
          actionsHtml = '<span style="color:var(--success); font-weight:bold;">(คุณ)</span>';
        }
        tbody.innerHTML += `<tr>
          <td>${a.user}</td>
          <td>${a.name}</td>
          <td>${a.role || 'Superadmin'}</td>
          <td style="text-align:center; white-space:nowrap;">${actionsHtml}</td>
        </tr>`;
      });
    }

    function addAdminFromDash() {
      const oldUser = document.getElementById('dashAdminEditOldUser').value;
      const u = document.getElementById('dashAdminUser').value.trim();
      const p = document.getElementById('dashAdminPass').value.trim();
      const n = document.getElementById('dashAdminNameInput').value.trim();
      const r = document.getElementById('dashAdminRole').value;
      const btn = document.getElementById('btnAddAdminDash');

      if (!u || !n) { showToast('กรุณากรอกข้อมูลที่จำเป็นให้ครบ', 'error'); return; }
      if (!oldUser && !p) { showToast('กรุณากรอกรหัสผ่านสำหรับการสร้างใหม่', 'error'); return; }

      btn.innerHTML = '...'; btn.disabled = true;
      if (typeof google !== 'undefined' && google.script) {
        const onSuccess = res => {
          cancelAdminEdit();
          showToast(oldUser ? 'แก้ไขแอดมินสำเร็จ' : 'เพิ่มแอดมินสำเร็จ');
          loadDashAdmins();
        };
        const onFailure = err => {
          btn.innerHTML = oldUser ? '<i class="fa-solid fa-save"></i> บันทึก' : '<i class="fa-solid fa-user-plus"></i> เพิ่มแอดมิน';
          btn.disabled = false;
          showToast(err.message, 'error');
        };

        if (oldUser) {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onFailure).editAdmin(oldUser, u, p, n, r);
        } else {
          google.script.run.withSuccessHandler(onSuccess).withFailureHandler(onFailure).saveAdmin(u, p, n, r);
        }
      }
    }

    function editAdminDash(user) {
      const admin = dashAdmins.find(a => a.user === user);
      if (!admin) return;
      document.getElementById('dashAdminEditOldUser').value = admin.user;
      document.getElementById('dashAdminUser').value = admin.user;
      document.getElementById('dashAdminPass').value = '';
      document.getElementById('dashAdminNameInput').value = admin.name;
      document.getElementById('dashAdminRole').value = admin.role || 'Superadmin';

      document.getElementById('dashAdminFormTitle').textContent = 'แก้ไขข้อมูลผู้ดูแล: ' + admin.user;
      const btnAdd = document.getElementById('btnAddAdminDash');
      btnAdd.innerHTML = '<i class="fa-solid fa-save"></i> บันทึก';
      btnAdd.style.background = 'var(--warning)';
      document.getElementById('btnCancelAdminEdit').style.display = 'block';
    }

    function cancelAdminEdit() {
      document.getElementById('dashAdminEditOldUser').value = '';
      document.getElementById('dashAdminUser').value = '';
      document.getElementById('dashAdminPass').value = '';
      document.getElementById('dashAdminNameInput').value = '';
      document.getElementById('dashAdminRole').value = 'Superadmin';

      document.getElementById('dashAdminFormTitle').textContent = '+ เพิ่มผู้ดูแลระบบใหม่';
      const btnAdd = document.getElementById('btnAddAdminDash');
      btnAdd.innerHTML = '<i class="fa-solid fa-user-plus"></i> เพิ่มแอดมิน';
      btnAdd.style.background = '';
      btnAdd.disabled = false;
      document.getElementById('btnCancelAdminEdit').style.display = 'none';
    }

    function deleteAdminDash(user) {
      showCustomConfirm('ยืนยันลบแอดมิน: ' + user + '?', function () {
        if (typeof google !== 'undefined' && google.script) {
          google.script.run.withSuccessHandler(res => {
            showToast('ลบแอดมินสำเร็จ');
            loadDashAdmins();
          }).withFailureHandler(err => {
            showToast(err.message, 'error');
          }).deleteAdmin(user, adminInfo.user);
        }
      });
    }

    // Old redundant admin methods removed

    // --- Admin: Manage Activities ---
    function openActivityModal(dateObj) {
      selectedDateInfo = { dateObj };
      const localISODate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      document.getElementById('activityModalDate').innerHTML = `
        <div style="display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label style="font-weight:bold; font-size: 14px; display:block; margin-bottom:5px; color:var(--text-main);">เลือกวันที่จัดกิจกรรม (เริ่มต้น):</label>
            <input type="date" id="actDateInput" class="input-control" value="${localISODate}" style="width: 100%; margin-bottom: 15px;">
          </div>
          <div style="flex: 1;">
            <label style="font-weight:bold; font-size: 14px; display:block; margin-bottom:5px; color:var(--text-main);">ถึงวันที่ (ไม่จำเป็น):</label>
            <input type="date" id="actEndDateInput" class="input-control" value="" style="width: 100%; margin-bottom: 15px;">
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="font-size: 14px; display:flex; align-items:center; gap: 8px; color:var(--text-main); cursor:pointer;">
            <input type="checkbox" id="actAllowMultipleDuties">
            อนุญาตให้ 1 คนลงชื่อได้หลายหน้าที่ในกิจกรรมนี้
          </label>
        </div>
      `;

      document.getElementById('actTitle').value = '';
      actEditor.setMarkdown(''); document.getElementById('actDesc').value = '';
      document.getElementById('actStartTime').value = '';
      document.getElementById('actDeadline').value = '';

      // Reset Quota Inputs to 0
      systemDuties.forEach((duty, i) => {
        document.getElementById(`quota-${i}`).value = '0';
      });

      document.getElementById('activityModal').classList.add('active');
    }

    function openActivityModalForEdit() {
      closeModal('detailModal');
      const dateObj = selectedDateInfo.dateObj || new Date(selectedDateInfo.activity.date);
      const act = selectedDateInfo.activity;
      const isMulti = act.allowMultipleDuties !== false;

      document.getElementById('activityModalDate').innerHTML = `
        <div style="display: flex; gap: 10px;">
          <div style="flex: 1;">
            <label style="font-weight:bold; font-size: 14px; display:block; margin-bottom:5px; color:var(--text-main);">เลือกวันที่จัดกิจกรรม (เริ่มต้น):</label>
            <input type="date" id="actDateInput" class="input-control" value="${act.date || ''}" style="width: 100%; margin-bottom: 15px;">
          </div>
          <div style="flex: 1;">
            <label style="font-weight:bold; font-size: 14px; display:block; margin-bottom:5px; color:var(--text-main);">ถึงวันที่ (ไม่จำเป็น):</label>
            <input type="date" id="actEndDateInput" class="input-control" value="${act.endDateStr || ''}" style="width: 100%; margin-bottom: 15px;">
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <label style="font-size: 14px; display:flex; align-items:center; gap: 8px; color:var(--text-main); cursor:pointer;">
            <input type="checkbox" id="actAllowMultipleDuties" ${isMulti ? 'checked' : ''}>
            อนุญาตให้ 1 คนลงชื่อได้หลายหน้าที่ในกิจกรรมนี้
          </label>
        </div>
      `;

      window.originalCreator = act.creatorName || '';
      document.getElementById('actTitle').value = act.title;
      actEditor.setMarkdown(act.description || ''); document.getElementById('actDesc').value = act.description || '';

      if (act.startTime) {
        const d = new Date(act.startTime);
        const tzoffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, 16);
        document.getElementById('actStartTime').value = localISOTime;
      } else {
        document.getElementById('actStartTime').value = '';
      }

      if (act.deadline) {
        const d = new Date(act.deadline);
        const tzoffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d - tzoffset)).toISOString().slice(0, 16);
        document.getElementById('actDeadline').value = localISOTime;
      } else {
        document.getElementById('actDeadline').value = '';
      }

      // Load Quotas
      systemDuties.forEach((duty, i) => {
        const found = act.duties.find(d => d.duty === duty);
        document.getElementById(`quota-${i}`).value = found ? found.quota : '0';
      });

      document.getElementById('activityModal').classList.add('active');
    }

    function submitActivity() {
      const title = document.getElementById('actTitle').value.trim();
      const desc = actEditor.getMarkdown().trim();
      const startTimeVal = document.getElementById('actStartTime').value;
      const deadlineVal = document.getElementById('actDeadline').value;
      const allowMultiple = document.getElementById('actAllowMultipleDuties') ? document.getElementById('actAllowMultipleDuties').checked : false;
      const btn = document.getElementById('btnSaveActivity');

      if (!title) {
        showToast('กรุณากรอกชื่อกิจกรรม', 'error');
        return;
      }

      let startTimeStr = '';
      if (startTimeVal) {
        startTimeStr = new Date(startTimeVal).toISOString();
      }

      let deadlineStr = '';
      if (deadlineVal) {
        deadlineStr = new Date(deadlineVal).toISOString();
      }

      // Collect Duties
      let selectedDuties = [];
      systemDuties.forEach((duty, i) => {
        const q = parseInt(document.getElementById(`quota-${i}`).value) || 0;
        if (q > 0) {
          selectedDuties.push({ duty: duty, quota: q });
        }
      });

      if (selectedDuties.length === 0) {
        showToast('กรุณากำหนดโควต้าคนอย่างน้อย 1 หน้าที่', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

      let currentSheetNameId = null;
      if (selectedDateInfo.activity && selectedDateInfo.activity.sheetName) {
        currentSheetNameId = selectedDateInfo.activity.sheetName;
      }

      let d = selectedDateInfo.dateObj;
      if (!d && selectedDateInfo.activity) d = new Date(selectedDateInfo.activity.date);

      const dateInput = document.getElementById('actDateInput');
      const endDateInput = document.getElementById('actEndDateInput');

      let dateStr = '';
      let endDateStr = '';

      if (dateInput) {
        if (!dateInput.value) {
          showToast('กรุณาระบุวันที่จัดกิจกรรม', 'error');
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกกิจกรรม';
          return;
        }
        let startDate = new Date(dateInput.value);
        let endDate = endDateInput && endDateInput.value ? new Date(endDateInput.value) : null;

        if (endDate && endDate < startDate) {
          showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น', 'error');
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกกิจกรรม';
          return;
        }

        dateStr = `${startDate.getFullYear()}/${startDate.getMonth() + 1}/${startDate.getDate()} 12:00:00`;
        if (endDate) {
          endDateStr = `${endDate.getFullYear()}/${endDate.getMonth() + 1}/${endDate.getDate()} 12:00:00`;
        }
      } else {
        if (!d) d = new Date();
        dateStr = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} 12:00:00`;
      }

      const dutiesJson = JSON.stringify(selectedDuties);

      if (typeof google !== 'undefined' && google.script) {
        let finalCreatorStr2 = adminInfo ? adminInfo.name : 'แอดมิน';
        if (currentSheetNameId && window.originalCreator) {
          const origCreator2 = window.originalCreator.split('|')[0];
          finalCreatorStr2 = origCreator2 + '|' + finalCreatorStr2;
        }

        google.script.run
          .withSuccessHandler(function (res) {
            showToast('บันทึกกิจกรรมและเตรียม Sheet สำเร็จ!');
            closeModal('activityModal');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกกิจกรรม';
            loadUpcomingActivities();
            if (document.getElementById('adminDashboard') && document.getElementById('adminDashboard').classList.contains('active')) {
              loadDashActivities(); // Refresh dash list
              loadDashStats(); // Refresh count
            }
          })
          .withFailureHandler(function (error) {
            showToast('บันทึกไม่สำเร็จ: ' + error.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกกิจกรรม';
          })
          .saveActivity(currentSheetNameId, dateStr, title, desc, dutiesJson, startTimeStr, deadlineStr, 'counts', endDateStr, allowMultiple, finalCreatorStr2, adminInfo ? adminInfo.name : 'Unknown');
      }
    }

    function deleteCurrentActivity() {
      showCustomConfirm('ยืนยันการลบกิจกรรมนี้ออกจากปฏิทิน? (ข้อมูลใน Sheet รายวันจะไม่ถูกลบ แต่หน้ากิจกรรมจะหายไป)', function () {
        const act = selectedDateInfo.activity;
        if (!act || !act.sheetName) {
          showToast('ลบไม่สำเร็จ: ไม่พบรหัสกิจกรรม', 'error');
          return;
        }

        if (typeof google !== 'undefined' && google.script) {
          google.script.run
            .withSuccessHandler(function (res) {
              showToast('ลบกิจกรรมออกจากปฏิทินแล้ว');
              closeModal('detailModal');
              loadUpcomingActivities();
              if (document.getElementById('adminDashboard') && document.getElementById('adminDashboard').classList.contains('active')) {
                loadDashActivities(); // Refresh dash list
              }
            })
            .withFailureHandler(function (error) {
              showToast('ลบไม่สำเร็จ: ' + error.message, 'error');
            })
            .deleteActivity(act.sheetName, adminInfo ? adminInfo.name : 'Unknown');
        }
      });
    }



    // --- Admin: Bulk Delete Signups ---
    function toggleBulkDeleteBtn() {
      const checkboxes = document.querySelectorAll('.bulk-delete-cb:checked');
      const btn = document.getElementById('btnBulkDelete');
      const countSpan = document.getElementById('bulkDeleteCount');
      if (checkboxes.length > 0) {
        btn.style.display = 'block';
        countSpan.textContent = checkboxes.length;
      } else {
        btn.style.display = 'none';
      }
    }

    function bulkDeleteSignups() {
      const checkboxes = document.querySelectorAll('.bulk-delete-cb:checked');
      if (checkboxes.length === 0) return;

      const rowsToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.row));

      showCustomConfirm(`คุณต้องการลบรายชื่อที่เลือกทั้งหมด ${checkboxes.length} รายการใช่หรือไม่?`, function () {
        const sheetName = selectedDateInfo.activity.sheetName;

        if (typeof google !== 'undefined' && google.script) {
          document.getElementById('modalLoading').style.display = 'flex';
          document.getElementById('dutiesContainer').innerHTML = '';

          google.script.run
            .withSuccessHandler(function (res) {
              showToast(res && res.message ? res.message : 'ลบรายชื่อที่เลือกเรียบร้อยแล้ว');
              loadSignups(sheetName, selectedDateInfo.activity.duties);
              document.getElementById('btnBulkDelete').style.display = 'none';
            })
            .withFailureHandler(function (error) {
              showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
              loadSignups(sheetName, selectedDateInfo.activity.duties);
              document.getElementById('btnBulkDelete').style.display = 'none';
            })
            .bulkDeleteSignups(sheetName, rowsToDelete, typeof adminInfo !== 'undefined' && adminInfo ? adminInfo.name : null);
        } else {
          showToast(`จำลองการลบรายชื่อ ${checkboxes.length} รายการแล้ว (Mock)`);
          loadSignups(sheetName, selectedDateInfo.activity.duties);
          document.getElementById('btnBulkDelete').style.display = 'none';
        }
      });
    }

    // --- Admin: Delete Signup ---
    function deleteSignup(row, name, dutyName) {
      showCustomConfirm(`ยืนยันการลบชื่อ "${name}" ออกจากหน้าที่ ${dutyName} หรือไม่?`, function () {
        const sheetName = selectedDateInfo.activity.sheetName;

        if (typeof google !== 'undefined' && google.script) {
          document.getElementById('modalLoading').style.display = 'flex';
          document.getElementById('dutiesContainer').innerHTML = '';

          google.script.run
            .withSuccessHandler(function (res) {
              showToast('ลบรายชื่อสำเร็จ');
              loadSignups(sheetName, selectedDateInfo.activity.duties);
            })
            .withFailureHandler(function (error) {
              showToast('ลบไม่สำเร็จ: ' + error.message, 'error');
              loadSignups(sheetName, selectedDateInfo.activity.duties);
            })
            .deleteSignup(sheetName, row, typeof adminInfo !== 'undefined' && adminInfo ? adminInfo.name : null);
        } else {
          showToast(`ลบ ${name} สำเร็จ (Mock)`);
          loadSignups(sheetName, selectedDateInfo.activity.duties);
        }
      });
    }

    // --- Utils ---
    function showToast(message, type = 'success') {
      if (window.RosterAudio && type === 'error') { window.RosterAudio.playError(); }
      const container = document.getElementById('toastContainer');
      const toast = document.createElement('div');
      toast.className = `toast ${type === 'error' ? 'error' : ''}`;

      const icon = type === 'error' ? '<i class="fa-solid fa-circle-exclamation"></i>' : '<i class="fa-solid fa-circle-check"></i>';
      toast.innerHTML = `${icon} <span>${message}</span>`;

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }

    function showCalendarLoading(show) {
      const el = document.getElementById('calendarLoading');
      if (show) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }

    function promptRandomizeCondition(act, onConfirm) {
      const options = currentActivities
        .filter(a => a.sheetName !== act.sheetName)
        .map(a => `<option value="${a.sheetName}">${a.title} (${a.date})</option>`)
        .join('');

      Swal.fire({
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
            <div style="font-size: 64px; color: #3B82F6; margin-bottom: 10px; line-height: 1;">
              <i class="fa-solid fa-shuffle"></i>
            </div>
            <h2 style="color: #0F172A; font-weight: 700; font-size: 1.5rem; margin: 0 0 10px 0; letter-spacing: -0.3px;">ยืนยันการสุ่มรายชื่อ</h2>
            <div style="color: #64748B; font-size: 0.95rem; line-height: 1.4; margin-bottom: 15px; width: 100%; text-align: left;">
              <div style="margin-bottom: 12px; font-weight: 500; color: var(--text-main); text-align: center;">เลือกรูปแบบการสุ่มที่คุณต้องการ:</div>
              <div style="margin-bottom: 10px; background: rgba(15, 23, 42, 0.02); padding: 12px; border-radius: 8px; border: 1px solid var(--border-light);">
                <input type="radio" id="rand_normal" name="rand_type" value="normal" checked>
                <label for="rand_normal" style="font-weight: 500; color: var(--text-main); cursor: pointer;"> สุ่มปกติ <span style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-left: 20px;">(ตัดเฉพาะคนที่ลงในอีเวนต์นี้แล้ว)</span></label>
              </div>
              <div style="margin-bottom: 10px; background: rgba(15, 23, 42, 0.02); padding: 12px; border-radius: 8px; border: 1px solid var(--border-light);">
                <input type="radio" id="rand_cond" name="rand_type" value="conditional">
                <label for="rand_cond" style="font-weight: 500; color: var(--text-main); cursor: pointer;"> สุ่มแบบเงื่อนไข <span style="font-size: 0.85rem; color: var(--text-muted); display: block; margin-left: 20px;">(ดึงรายชื่อจากอีเวนต์อื่นมาตัดสิทธิ์)</span></label>
              </div>
              <div id="cond_options" style="display: none; padding: 12px 12px 0 12px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 500; color: var(--text-main);">เลือกอีเวนต์ที่ต้องการนำมาตัดรายชื่อออก:</label>
                <select id="cond_sheet_name" class="input-control" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border-light); font-size: 0.95rem;">
                  ${options || '<option value="">ไม่มีอีเวนต์อื่นให้เลือก</option>'}
                </select>
              </div>
            </div>
          </div>
        `,
        showConfirmButton: true,
        showCancelButton: true,
        confirmButtonColor: '#0F172A',
        cancelButtonColor: '#F1F5F9',
        confirmButtonText: 'ยืนยันการสุ่ม',
        cancelButtonText: '<span style="color: #64748B;">ยกเลิก</span>',
        reverseButtons: true,
        customClass: {
          popup: 'custom-swal-popup',
          confirmButton: 'custom-swal-btn',
          cancelButton: 'custom-swal-btn'
        },
        buttonsStyling: true,
        didOpen: () => {
          const radioNormal = document.getElementById('rand_normal');
          const radioCond = document.getElementById('rand_cond');
          const condOptions = document.getElementById('cond_options');
          radioNormal.addEventListener('change', () => { condOptions.style.display = 'none'; });
          radioCond.addEventListener('change', () => { condOptions.style.display = 'block'; });
        },
        preConfirm: () => {
          const isCond = document.getElementById('rand_cond').checked;
          const excludeSheet = isCond ? document.getElementById('cond_sheet_name').value : null;
          if (isCond && !excludeSheet) {
            Swal.showValidationMessage('กรุณาเลือกอีเวนต์ หรือเลือกสุ่มปกติหากไม่มีอีเวนต์');
            return false;
          }
          return { isCond, excludeSheet };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          onConfirm(result.value.excludeSheet);
        }
      });
    }

    function randomizeSingleDutyBtn(dutyName, btn) {
      if (!selectedDateInfo || !selectedDateInfo.activity) return;
      const act = selectedDateInfo.activity;

      promptRandomizeCondition(act, function (excludeSheetName) {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        btn.disabled = true;

        const dateStr = act.date;

        if (typeof google !== 'undefined' && google.script) {
          google.script.run
            .withSuccessHandler(function (res) {
              showToast(res.message, 'success');
              loadSignups(act.sheetName, act.duties);
              btn.innerHTML = originalText;
              btn.disabled = false;
            })
            .withFailureHandler(function (error) {
              showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
              btn.innerHTML = originalText;
              btn.disabled = false;
            })
            .randomizeSignups(dateStr, act.sheetName, dutyName, excludeSheetName);
        } else {
          setTimeout(() => {
            showToast(`สุ่ม ${dutyName} สำเร็จ (Mock)`, 'success');
            btn.innerHTML = originalText;
            btn.disabled = false;
          }, 1000);
        }
      });
    }

    function randomizeSignupsBtn() {
      if (!selectedDateInfo || !selectedDateInfo.activity) return;
      const currentEventTarget = event.currentTarget;

      const act = selectedDateInfo.activity;
      let dateStr = act.date || selectedDateInfo.dateObj.toISOString();
      if (!dateStr.includes('T')) dateStr += 'T12:00:00';

      promptRandomizeCondition(act, function (excludeSheetName) {
        const btn = currentEventTarget;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังสุ่ม...';
        btn.disabled = true;

        if (typeof google !== 'undefined' && google.script) {
          google.script.run
            .withSuccessHandler(function (res) {
              showToast(res.message, 'success');
              btn.innerHTML = originalText;
              btn.disabled = false;
              loadSignups(act.sheetName, act.duties);
            })
            .withFailureHandler(function (error) {
              showToast('เกิดข้อผิดพลาด: ' + error.message, 'error');
              btn.innerHTML = originalText;
              btn.disabled = false;
            })
            .randomizeSignups(dateStr, act.sheetName, null, excludeSheetName);
        } else {
          setTimeout(() => {
            showToast('สุ่มรายชื่อสำเร็จ (Mock)', 'success');
            btn.innerHTML = originalText;
            btn.disabled = false;
            loadSignups(act.sheetName, act.duties);
          }, 1000);
        }
      });
    }

    let ntpTimeOffset = 0;
    function initNtpClock() {
      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (res) {
            if (res && res.success && res.timestamp) {
              ntpTimeOffset = res.timestamp - Date.now();
            }
            startNtpClock();
          })
          .withFailureHandler(function () {
            startNtpClock();
          })
          .getNtpTime();
      } else {
        startNtpClock();
      }
    }

    function startNtpClock() {
      setInterval(() => {
        const d = new Date(Date.now() + ntpTimeOffset);
        const day = String(d.getDate()).padStart(2, '0');
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const yy = String(d.getFullYear() + 543).slice(-2);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        const s = String(d.getSeconds()).padStart(2, '0');
        const ms = String(d.getMilliseconds()).padStart(3, '0');
        const display = document.getElementById('ntpClockDisplay');
        if (display) {
          display.textContent = `${day}/${mo}/${yy} ${h}:${m}:${s}:${ms}`;
        }
      }, 47);
    }

    document.addEventListener('DOMContentLoaded', initNtpClock);

// --- Block 3: Realtime Sync ---
    // --- ADMIN DASHBOARD REALTIME ---
    let dashRealtimeInterval = null;
    let dashRealtimeCurrentSheetName = null;
    let dashRealtimeDuties = [];

    function initDashRealtime() {
      const select = document.getElementById('dashRealtimeActivitySelect');
      select.innerHTML = '<option value="">-- Loading... --</option>';
      select.disabled = true;
      document.getElementById('dashRealtimeContainer').style.display = 'none';
      document.getElementById('dashRealtimeLoading').style.display = 'block';

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (activities) {
            document.getElementById('dashRealtimeLoading').style.display = 'none';
            select.innerHTML = '<option value="">-- เลือกกิจกรรมที่ต้องการดูสด --</option>';
            const sortedActs = activities.sort((a, b) => b.timestamp - a.timestamp);
            sortedActs.forEach(act => {
              const dateStr = formatThaiDateRange(act.dateStr || act.date, act.endDateStr) || (act.dateStr || act.date);
              const title = act.title;
              const sheetName = act.sheetName;
              select.innerHTML += `<option value="${sheetName}" data-duties='${JSON.stringify(act.duties)}'>${dateStr} : ${title}</option>`;
            });
            select.disabled = false;
          })
          .withFailureHandler(function (error) {
            document.getElementById('dashRealtimeLoading').style.display = 'none';
            if (typeof showToast === 'function') if (typeof showToast === 'function') showToast('\u0E42\u0E2B\u0E25\u0E14\u0E01\u0E34\u0E08\u0E01\u0E23\u0E23\u0E21\u0E44\u0E21\u0E48\u0E2A\u0E33\u0E40\u0E23\u0E47\u0E08', 'error');
            select.innerHTML = '<option value="">-- Error --</option>';
          })
          .getAllActivities();
      }
    }

    function loadDashRealtime() {
      const repContainer = document.getElementById('reportsContainer');
      if (repContainer) repContainer.innerHTML = '';
      const select = document.getElementById('dashRealtimeActivitySelect');
      const sheetName = select.value;
      if (!sheetName) {
        document.getElementById('dashRealtimeContainer').style.display = 'none';
        stopDashRealtimeSync();
        return;
      }

      const selectedOption = select.options[select.selectedIndex];
      try {
        dashRealtimeDuties = JSON.parse(selectedOption.getAttribute('data-duties'));
      } catch (e) {
        dashRealtimeDuties = [];
      }

      dashRealtimeCurrentSheetName = sheetName;
      document.getElementById('dashRealtimeLoading').style.display = 'block';
      document.getElementById('dashRealtimeContainer').style.display = 'none';

      fetchDashRealtimeData();
      startDashRealtimeSync();
    }

    function startDashRealtimeSync() {
      stopDashRealtimeSync();
      dashRealtimeInterval = setInterval(() => {
        fetchDashRealtimeData();
      }, 3000);
    }

    function stopDashRealtimeSync() {
      if (dashRealtimeInterval) {
        clearInterval(dashRealtimeInterval);
        dashRealtimeInterval = null;
      }
    }

    function fetchDashRealtimeData() {
      if (!dashRealtimeCurrentSheetName) return;
      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (signups) {
            renderDashRealtimeLive(signups);
          })
          .getSignupsForActivity(dashRealtimeCurrentSheetName);
      }
    }

    function renderDashRealtimeLive(signups) {
      const loading = document.getElementById('dashRealtimeLoading');
      const container = document.getElementById('dashRealtimeContainer');
      if (loading) loading.style.display = 'none';
      if (container) container.style.display = 'flex';

      const select = document.getElementById('dashRealtimeActivitySelect');
      const selectedOption = select.options[select.selectedIndex];
      // extract date and title from option text (format: "YYYY-MM-DD : Title")
      const optionText = selectedOption ? selectedOption.textContent.replace(/^--.*--$/, '') : '';
      const activityTitleText = optionText ? optionText : 'กิจกรรม';

      let dutiesHtml = '';

      const getClassNum = (name) => {
        const parts = name.trim().split(' ');
        const cls = parts[parts.length - 1];
        if (cls && cls.includes('/')) {
          const cleanCls = cls.replace(/^ม\./, '');
          const cParts = cleanCls.split('/');
          return parseInt(cParts[0]) * 100 + parseInt(cParts[1]);
        }
        return 9999;
      };

      let copyText = `รายงานสรุปการปฏิบัติงาน ${activityTitleText}\n\n`;
      let vacantOut = `สรุปหน้าที่ยังว่าง ${activityTitleText}\n`;
      let vIndex = 1;
      let totalSignups = 0;

      dashRealtimeDuties.forEach(d => {
        const dutySignups = signups.filter(s => s.duty === d.duty);
        let listHtml = '';

        // Build HTML Grid
        if (dutySignups.length > 0) {
          listHtml = '<ol style="margin: 12px 0 10px 25px; padding:0; font-size: 0.95rem; color: var(--text-color);">';
          dutySignups.forEach(s => {
            listHtml += `<li style="margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px dashed var(--border-light); padding-left: 5px;">${s.name}</li>`;
          });
          listHtml += '</ol>';
        } else {
          listHtml = '<div style="margin: 15px 0 15px 10px; color: var(--text-dim); font-size: 0.9rem; font-style: italic;">- ยังไม่มีผู้ลงชื่อ -</div>';
        }

        const isFull = dutySignups.length >= parseInt(d.quota);
        const quotaText = isFull ? 'เต็ม' : `${dutySignups.length}/${d.quota}`;
        const quotaBadge = isFull ? `<span class="badge" style="background:var(--danger); color:white; font-size:0.8rem; padding: 4px 10px; border-radius: 12px; box-shadow: 0 2px 4px rgba(231, 76, 60, 0.2);">${quotaText}</span>` : `<span class="badge" style="background:var(--success); color:white; font-size:0.8rem; padding: 4px 10px; border-radius: 12px; box-shadow: 0 2px 4px rgba(46, 204, 113, 0.2);">${quotaText}</span>`;

        dutiesHtml += `
            <div style="background: var(--bg); padding: 18px; border-radius: 10px; border: 1px solid var(--border-light); box-shadow: 0 2px 5px rgba(0,0,0,0.03); display: flex; flex-direction: column;">
                <div style="font-weight: 700; color: var(--primary); display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; font-size: 1.05rem;">
                    <span style="padding-right: 10px; line-height: 1.3;">${d.duty}</span>
                    <span style="flex-shrink: 0;">${quotaBadge}</span>
                </div>
                <div style="flex-grow: 1;">
                    ${listHtml}
                </div>
            </div>`;

        // Build Text Summaries
        let remain = parseInt(d.quota) - dutySignups.length;
        if (remain > 0 && parseInt(d.quota) > 0) {
          vacantOut += `${vIndex}. ${d.duty} ว่าง ${remain} ที่\n`;
          vIndex++;
        }

        copyText += `${d.duty}\n`;
        if (dutySignups.length > 0) {
          dutySignups.sort((a, b) => getClassNum(a.name) - getClassNum(b.name));
          dutySignups.forEach((s, i) => {
            copyText += `${i + 1}. ${s.name}\n`;
          });
          totalSignups += dutySignups.length;
        }
        copyText += '\n';
      });

      const dList = document.getElementById('dashRealtimeDutiesList');
      if (dList) dList.innerHTML = dutiesHtml;

      // Finalize Summary Text
      copyText += `สรุป\n`;
      dashRealtimeDuties.forEach(d => {
        const dutySignups = signups.filter(s => s.duty === d.duty);
        if (dutySignups.length > 0) {
          copyText += `ผู้ลงชื่อ ${d.duty} มี ${dutySignups.length} คน\n`;
        }
      });
      copyText += `รวมผู้ลงชื่อทั้งหมด ${totalSignups} คน`;

      // Generate Remaining Users Text
      let signedUpNames = new Set();
      signups.forEach(s => {
        let nameParts = s.name.trim().split(' ');
        let baseName = nameParts.length > 1 ? nameParts[0] + ' ' + nameParts[1] : nameParts[0];
        signedUpNames.add(baseName);
      });

      let remainingText = `รายชื่อคนที่ไม่ได้ลงชื่อ ${activityTitleText}\n`;
      let rIndex = 1;
      if (typeof studentNamesList !== 'undefined' && studentNamesList.length > 0) {
        studentNamesList.forEach(stu => {
          let stuParts = stu.name.trim().split(' ');
          let sBase = stuParts.length > 1 ? stuParts[0] + ' ' + stuParts[1] : stuParts[0];
          if (!signedUpNames.has(sBase)) {
            remainingText += `${rIndex}. ${stu.name}\n`;
            rIndex++;
          }
        });
        if (rIndex === 1) {
          remainingText += "- ไม่มี (ลงชื่อครบทุกคนแล้ว) -";
        }
      } else {
        remainingText += "(ไม่พบข้อมูลรายชื่อนักเรียนในระบบ)";
      }

      // All Unique Signups for the new block
      let allUniqueSignupsMap = new Map();
      signups.forEach(s => {
        let nameParts = s.name.trim().split(' ');
        let baseName = nameParts.length > 1 ? nameParts[0] + ' ' + nameParts[1] : nameParts[0];
        if (!allUniqueSignupsMap.has(baseName)) {
          allUniqueSignupsMap.set(baseName, s);
        }
      });
      let allUniqueSignups = Array.from(allUniqueSignupsMap.values());
      allUniqueSignups.sort((a, b) => getClassNum(a.name) - getClassNum(b.name));

      let allSignupsText = `รายชื่อผู้ลงชื่อทั้งหมด ${activityTitleText}\n`;
      if (allUniqueSignups.length > 0) {
        allUniqueSignups.forEach((s, i) => {
          allSignupsText += `${i + 1}. ${s.name}\n`;
        });
        allSignupsText += `\nรวม ${allUniqueSignups.length} คน`;
      } else {
        allSignupsText += "- ยังไม่มีผู้ลงชื่อ -";
      }

      // Update UI Text Areas
      const summarySec = document.getElementById('dashRealtimeSummarySection');
      if (summarySec) summarySec.style.display = 'block';

      const taSummary = document.getElementById('dashRealtimeCopySummary');
      if (taSummary) taSummary.value = copyText;

      const taVacant = document.getElementById('dashRealtimeCopyVacant');
      if (taVacant) taVacant.value = vacantOut;

      const taRemaining = document.getElementById('dashRealtimeCopyRemaining');
      if (taRemaining) taRemaining.value = remainingText;

      const taAll = document.getElementById('dashRealtimeCopyAll');
      if (taAll) taAll.value = allSignupsText;
    }

    // --- USER VIEW REALTIME POLLING ---
    let userRealtimeSignupInterval = null;

    function stopUserRealtimeSync() {
      if (userRealtimeSignupInterval) {
        clearInterval(userRealtimeSignupInterval);
        userRealtimeSignupInterval = null;
      }
    }

    function startUserRealtimeSync(sheetName, dutiesList) {
      stopUserRealtimeSync();
      userRealtimeSignupInterval = setInterval(() => {
        if (typeof google !== 'undefined' && google.script) {
          google.script.run
            .withSuccessHandler(function (newSignups) {
              if (typeof selectedDateInfo !== 'undefined' && selectedDateInfo && JSON.stringify(selectedDateInfo.signups) !== JSON.stringify(newSignups)) {
                selectedDateInfo.signups = newSignups;
                if (typeof updateDutiesLive === 'function') updateDutiesLive(dutiesList, newSignups);
              }
            })
            .getSignupsForActivity(sheetName);
        }
      }, 3000);
    }


// --- Block 4: Advisor & PDF Logic ---
    // ==========================================
    // ADVISOR MANAGEMENT & PDF EXPORT LOGIC
    // ==========================================
    let advisorsList = [];
    window.exportOptions = { selectedAdvisors: [], sigType: 'digital' };

    function loadAdvisors(callback) {
      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function (res) {
            try {
              advisorsList = JSON.parse(res || '[]');
            } catch (e) {
              advisorsList = [];
            }
            renderAdvisorsTable();
            if (callback) callback();
          })
          .getConfig('advisors_list', '[]');
      } else {
        advisorsList = JSON.parse(localStorage.getItem('advisors_list') || '[]');
        renderAdvisorsTable();
        if (callback) callback();
      }
    }

    function renderAdvisorsTable() {
      const tbody = document.getElementById('advisorsTableBody');
      if (!tbody) return;

      // Sort by rank ascending
      advisorsList.sort((a, b) => (parseInt(a.rank) || 99) - (parseInt(b.rank) || 99));

      if (advisorsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:20px;">ไม่มีข้อมูลครูที่ปรึกษา</td></tr>';
        return;
      }

      let html = '';
      advisorsList.forEach((adv, index) => {
        let sigHtml = adv.signatureBase64 ? `<img src="${adv.signatureBase64}" style="max-height:40px; border-radius:4px;">` : '-';
        html += `<tr>
      <td style="text-align:center;">${adv.rank || 99}</td>
      <td>${adv.name}</td>
      <td>${adv.position}</td>
      <td style="text-align:center;">${sigHtml}</td>
      <td style="text-align:center;">
        <button class="btn btn-secondary" style="padding:5px 10px; font-size:0.85rem;" onclick="showAdvisorModal(${index})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-secondary" style="padding:5px 10px; font-size:0.85rem; color:var(--danger);" onclick="deleteAdvisor(${index})"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`;
      });
      tbody.innerHTML = html;
    }

    function showAdvisorModal(index = -1) {
      document.getElementById('advisorIndex').value = index;
      document.getElementById('advSigFile').value = '';
      const preview = document.getElementById('advSigPreview');
      const placeholder = document.getElementById('advSigPlaceholder');

      if (index >= 0) {
        const adv = advisorsList[index];
        document.getElementById('advisorModalTitle').textContent = 'แก้ไขรายชื่อครูที่ปรึกษา';
        document.getElementById('advName').value = adv.name || '';
        document.getElementById('advPosition').value = adv.position || '';
        document.getElementById('advRank').value = adv.rank || 99;
        if (adv.signatureBase64) {
          preview.src = adv.signatureBase64;
          preview.style.display = 'block';
          placeholder.style.display = 'none';
          preview.setAttribute('data-base64', adv.signatureBase64);
        } else {
          preview.style.display = 'none';
          placeholder.style.display = 'inline';
          preview.setAttribute('data-base64', '');
        }
      } else {
        document.getElementById('advisorModalTitle').textContent = 'เพิ่มรายชื่อครูที่ปรึกษา';
        document.getElementById('advName').value = '';
        document.getElementById('advPosition').value = '';
        document.getElementById('advRank').value = 99;
        preview.style.display = 'none';
        placeholder.style.display = 'inline';
        preview.setAttribute('data-base64', '');
      }

      document.getElementById('advisorModal').classList.add('active');
    }

    function previewAdvSig(event) {
      const file = event.target.files[0];
      const preview = document.getElementById('advSigPreview');
      const placeholder = document.getElementById('advSigPlaceholder');
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          preview.src = e.target.result;
          preview.style.display = 'block';
          placeholder.style.display = 'none';
          preview.setAttribute('data-base64', e.target.result);
        }
        reader.readAsDataURL(file);
      }
    }

    function saveAdvisor() {
      const index = parseInt(document.getElementById('advisorIndex').value);
      const name = document.getElementById('advName').value.trim();
      const position = document.getElementById('advPosition').value.trim();
      const rank = parseInt(document.getElementById('advRank').value) || 99;
      const signatureBase64 = document.getElementById('advSigPreview').getAttribute('data-base64') || '';

      if (!name || !position) {
        Swal.fire('ข้อผิดพลาด', 'กรุณากรอกชื่อและตำแหน่ง', 'error');
        return;
      }

      const advData = { name, position, rank, signatureBase64 };

      if (index >= 0) {
        advisorsList[index] = advData;
      } else {
        advisorsList.push(advData);
      }

      // Sort again
      advisorsList.sort((a, b) => (parseInt(a.rank) || 99) - (parseInt(b.rank) || 99));

      const dataStr = JSON.stringify(advisorsList);

      const btn = document.getElementById('btnSaveAdvisor');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังบันทึก...';

      if (typeof google !== 'undefined' && google.script) {
        google.script.run
          .withSuccessHandler(function () {
            renderAdvisorsTable();
            closeModal('advisorModal');
            showToast('บันทึกข้อมูลเรียบร้อย', 'success');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูล';
          })
          .withFailureHandler(function (err) {
            Swal.fire('ข้อผิดพลาด', err.message, 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูล';
          })
          .setConfig('advisors_list', dataStr);
      } else {
        localStorage.setItem('advisors_list', dataStr);
        renderAdvisorsTable();
        closeModal('advisorModal');
        showToast('บันทึกข้อมูลเรียบร้อย (Local)', 'success');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกข้อมูล';
      }
    }

    function deleteAdvisor(index) {
      Swal.fire({
        title: 'ยืนยันการลบ?',
        text: "คุณต้องการลบรายชื่อครูที่ปรึกษานี้ใช่หรือไม่?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#F43F5E',
        cancelButtonColor: '#64748B',
        confirmButtonText: 'ลบข้อมูล',
        cancelButtonText: 'ยกเลิก'
      }).then((result) => {
        if (result.isConfirmed) {
          advisorsList.splice(index, 1);
          const dataStr = JSON.stringify(advisorsList);
          if (typeof google !== 'undefined' && google.script) {
            google.script.run
              .withSuccessHandler(function () {
                renderAdvisorsTable();
                showToast('ลบข้อมูลเรียบร้อย', 'success');
              })
              .setConfig('advisors_list', dataStr);
          } else {
            localStorage.setItem('advisors_list', dataStr);
            renderAdvisorsTable();
            showToast('ลบข้อมูลเรียบร้อย (Local)', 'success');
          }
        }
      });
    }

    // Hook into switchDashTab
    const originalSwitchDashTab = window.switchDashTab;
    window.switchDashTab = function (tabId) {
      if (originalSwitchDashTab) originalSwitchDashTab(tabId);
      if (tabId === 'advisors') {
        loadAdvisors();
      }
    };

    // PDF Export Interceptors
    function exportCurrentActivityPDF() {
      openPdfExportModal('current', []);
    }

    function exportToPDFDash(sheetName, title, dateDisplay, dutiesStr) {
      openPdfExportModal('dash', [sheetName, title, dateDisplay, dutiesStr]);
    }

    function openPdfExportModal(targetFnName, argsArray) {
      document.getElementById('pdfExportTarget').value = targetFnName;
      document.getElementById('pdfExportArgs').value = JSON.stringify(argsArray);

      // Load advisors if empty
      if (advisorsList.length === 0) {
        loadAdvisors(renderPdfAdvisorsList);
      } else {
        renderPdfAdvisorsList();
      }

      document.getElementById('pdfExportModal').classList.add('active');
    }

    function renderPdfAdvisorsList() {
      const listContainer = document.getElementById('pdfAdvisorsList');
      if (advisorsList.length === 0) {
        listContainer.innerHTML = '<div style="text-align:center; padding:10px; color:var(--text-muted);">ไม่มีข้อมูลครูที่ปรึกษาในระบบ</div>';
        return;
      }

      let html = '';
      advisorsList.forEach((adv, index) => {
        html += `
      <label style="display:flex; align-items:center; gap:10px; padding:8px; border-bottom:1px solid var(--border-light); cursor:pointer;">
        <input type="checkbox" class="pdf-adv-checkbox" value="${index}" style="width:18px; height:18px; cursor:pointer;">
        <div style="flex:1;">
          <div style="font-weight:500;">${adv.name}</div>
          <div style="font-size:0.8rem; color:var(--text-muted);">${adv.position}</div>
        </div>
      </label>
    `;
      });
      listContainer.innerHTML = html;
    }

    function confirmPdfExport() {
      const target = document.getElementById('pdfExportTarget').value;
      const args = JSON.parse(document.getElementById('pdfExportArgs').value || '[]');

      // Get selected advisors
      const checkboxes = document.querySelectorAll('.pdf-adv-checkbox:checked');
      const selectedAdvisors = [];
      checkboxes.forEach(cb => {
        const idx = parseInt(cb.value);
        if (!isNaN(idx) && advisorsList[idx]) {
          selectedAdvisors.push(advisorsList[idx]);
        }
      });

      window.exportOptions.selectedAdvisors = selectedAdvisors;
      const sigTypeRadio = document.querySelector('input[name="pdfSigType"]:checked');
      window.exportOptions.sigType = sigTypeRadio ? sigTypeRadio.value : 'digital';

      closeModal('pdfExportModal');

      // Call original logic
      if (target === 'current') {
        _exportCurrentActivityPDF();
      } else if (target === 'dash') {
        _exportToPDFDash.apply(this, args);
      }
    }

// --- Block 5: Diff Inspection ---
    function showLogDiff(logId) {
      const log = currentLogsData.find(l => l.id === logId);
      if (!log) return;
      let oldObj = {}, newObj = {};
      try { if (log.old_data) oldObj = JSON.parse(log.old_data); } catch (e) { }
      try { if (log.new_data) newObj = JSON.parse(log.new_data); } catch (e) { }

      const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];

      let html = '<div style="overflow-x:auto;"><table style="width:100%; border-collapse: collapse; font-size: 0.95rem;">';
      html += '<tr style="background:#f1f5f9;"><th style="padding:10px;border:1px solid #e2e8f0; text-align:left;">หัวข้อ (Key)</th><th style="padding:10px;border:1px solid #e2e8f0; text-align:left;">ข้อมูลเดิม (Old)</th><th style="padding:10px;border:1px solid #e2e8f0; text-align:left;">ข้อมูลใหม่ (New)</th></tr>';

      allKeys.forEach(k => {
        let oldRaw = oldObj[k];
        let newRaw = newObj[k];

        let oldVal = oldRaw !== undefined ? JSON.stringify(oldRaw) : '-';
        let newVal = newRaw !== undefined ? JSON.stringify(newRaw) : '-';

        let oldStyle = 'color: #475569;';
        let newStyle = 'color: #475569;';

        if (oldVal !== newVal) {
          if (oldVal !== '-' && newVal === '-') {
            oldStyle = 'background-color: #fee2e2; color: #991b1b; font-weight: bold;'; // Red for deleted
            newStyle = 'color: #cbd5e1;';
          } else if (oldVal === '-' && newVal !== '-') {
            newStyle = 'background-color: #dcfce7; color: #166534; font-weight: bold;'; // Green for added
            oldStyle = 'color: #cbd5e1;';
          } else {
            oldStyle = 'background-color: #fee2e2; color: #991b1b; font-weight: bold; text-decoration: line-through;';
            newStyle = 'background-color: #dcfce7; color: #166534; font-weight: bold;';
          }
        }

        html += `<tr>
          <td style="padding:10px;border:1px solid #e2e8f0; font-weight:600; color: #334155;">${k}</td>
          <td style="padding:10px;border:1px solid #e2e8f0; ${oldStyle}">${oldVal}</td>
          <td style="padding:10px;border:1px solid #e2e8f0; ${newStyle}">${newVal}</td>
        </tr>`;
      });

      html += '</table></div>';

      document.getElementById('diffModalContent').innerHTML = html;
      document.getElementById('diffLogsModal').classList.add('active');
    }
