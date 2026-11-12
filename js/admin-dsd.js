/**
 * Admin DSD Management - Digital Systems Development Division
 * Full CRUD, Image Upload, Order Sorting, Multi-Social Media & Skills Logo Manager
 */

(function () {
  let dsdMembersList = [];
  let dsdSearchTerm = '';
  let dsdActiveFilter = 'ALL'; // ALL, active, hidden
  let currentEditingMemberId = null;
  let currentSelectedSkills = [];

  // ==========================================================
  // COMPREHENSIVE BRAND & SKILL LOGOS CATALOG
  // ดึงโลโก้แท้จาก Local SVGs และ SimpleIcons / Devicon CDN
  // ==========================================================
  const TECH_CATALOG = [
    // Web & Core Languages
    { name: 'JavaScript', slug: 'javascript', icon: 'assets/tech/javascript.svg', category: 'Language' },
    { name: 'TypeScript', slug: 'typescript', icon: 'https://cdn.simpleicons.org/typescript', category: 'Language' },
    { name: 'HTML5', slug: 'html5', icon: 'assets/tech/html5.svg', category: 'Frontend' },
    { name: 'CSS3', slug: 'css3', icon: 'assets/tech/css3.svg', category: 'Frontend' },
    { name: 'Python', slug: 'python', icon: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1280px-Python-logo-notext.svg.png?utm_source=en.wikipedia.org&utm_campaign=index&utm_content=thumbnail', category: 'Language' },
    { name: 'PHP', slug: 'php', icon: 'https://cdn.simpleicons.org/php', category: 'Language' },
    { name: 'Dart', slug: 'dart', icon: 'https://cdn.simpleicons.org/dart', category: 'Language' },
    { name: 'Go', slug: 'go', icon: 'https://cdn.simpleicons.org/go', category: 'Language' },
    { name: 'Rust', slug: 'rust', icon: 'https://cdn.simpleicons.org/rust', category: 'Language' },
    { name: 'C++', slug: 'cplusplus', icon: 'https://cdn.simpleicons.org/cplusplus', category: 'Language' },
    { name: 'Java', slug: 'openjdk', icon: 'https://cdn.simpleicons.org/openjdk', category: 'Language' },

    // Frontend Frameworks & Libraries
    { name: 'React', slug: 'react', icon: 'https://cdn.simpleicons.org/react', category: 'Frontend' },
    { name: 'Next.js', slug: 'nextdotjs', icon: 'https://cdn.simpleicons.org/nextdotjs', category: 'Frontend' },
    { name: 'Vue.js', slug: 'vuedotjs', icon: 'https://cdn.simpleicons.org/vuedotjs', category: 'Frontend' },
    { name: 'Nuxt.js', slug: 'nuxtdotjs', icon: 'https://cdn.simpleicons.org/nuxtdotjs', category: 'Frontend' },
    { name: 'Tailwind CSS', slug: 'tailwindcss', icon: 'https://cdn.simpleicons.org/tailwindcss', category: 'Frontend' },
    { name: 'Bootstrap', slug: 'bootstrap', icon: 'https://cdn.simpleicons.org/bootstrap', category: 'Frontend' },
    { name: 'Flutter', slug: 'flutter', icon: 'https://cdn.simpleicons.org/flutter', category: 'Mobile' },
    { name: 'Vite', slug: 'vite', icon: 'https://cdn.simpleicons.org/vite', category: 'Tools' },

    // Backend & APIs
    { name: 'Node.js', slug: 'nodejs', icon: 'assets/tech/nodejs.svg', category: 'Backend' },
    { name: 'Express.js', slug: 'express', icon: 'assets/tech/express.svg', category: 'Backend' },
    { name: 'FastAPI', slug: 'fastapi', icon: 'https://cdn.simpleicons.org/fastapi', category: 'Backend' },
    { name: 'Django', slug: 'django', icon: 'https://cdn.simpleicons.org/django', category: 'Backend' },
    { name: 'Laravel', slug: 'laravel', icon: 'https://cdn.simpleicons.org/laravel', category: 'Backend' },
    { name: 'Postman', slug: 'postman', icon: 'assets/tech/postman.svg', category: 'Tools' },
    { name: 'GraphQL', slug: 'graphql', icon: 'https://cdn.simpleicons.org/graphql', category: 'Backend' },

    // Databases
    { name: 'SQLite', slug: 'sqlite', icon: 'assets/tech/sqlite.svg', category: 'Database' },
    { name: 'PostgreSQL', slug: 'postgresql', icon: 'https://cdn.simpleicons.org/postgresql', category: 'Database' },
    { name: 'MySQL', slug: 'mysql', icon: 'https://cdn.simpleicons.org/mysql', category: 'Database' },
    { name: 'MongoDB', slug: 'mongodb', icon: 'https://cdn.simpleicons.org/mongodb', category: 'Database' },
    { name: 'Redis', slug: 'redis', icon: 'https://cdn.simpleicons.org/redis', category: 'Database' },
    { name: 'Firebase', slug: 'firebase', icon: 'https://cdn.simpleicons.org/firebase', category: 'Cloud' },
    { name: 'Supabase', slug: 'supabase', icon: 'https://cdn.simpleicons.org/supabase', category: 'Cloud' },

    // Cloud, Infra & DevOps
    { name: 'Vercel', slug: 'vercel', icon: 'assets/tech/vercel.svg', category: 'Cloud' },
    { name: 'Cloudflare', slug: 'cloudflare', icon: 'assets/tech/cloudflare.svg', category: 'Cloud' },
    { name: 'Docker', slug: 'docker', icon: 'https://cdn.simpleicons.org/docker', category: 'DevOps' },
    { name: 'Git', slug: 'git', icon: 'assets/tech/git.svg', category: 'DevOps' },
    { name: 'GitHub', slug: 'github', icon: 'assets/tech/github.svg', category: 'DevOps' },
    { name: 'Linux', slug: 'linux', icon: 'https://cdn.simpleicons.org/linux', category: 'OS' },
    { name: 'Ubuntu', slug: 'ubuntu', icon: 'https://cdn.simpleicons.org/ubuntu', category: 'OS' },
    { name: 'Nginx', slug: 'nginx', icon: 'https://cdn.simpleicons.org/nginx', category: 'DevOps' },

    // Design & Creative
    { name: 'Figma', slug: 'figma', icon: 'assets/tech/figma.svg', category: 'Design' },
    { name: 'Adobe Photoshop', slug: 'photoshop', icon: 'assets/tech/photoshop.svg', category: 'Design' },
    { name: 'Adobe Illustrator', slug: 'adobeillustrator', icon: 'https://cdn.simpleicons.org/adobeillustrator', category: 'Design' },
    { name: 'Canva', slug: 'canva', icon: 'https://logo-teka.com/wp-content/uploads/2025/09/canva-icon-logo.svg', category: 'Design' },
    { name: 'Adobe Premiere Pro', slug: 'adobepremierepro', icon: 'https://cdn.simpleicons.org/adobepremierepro', category: 'Design' },
    { name: 'Adobe After Effects', slug: 'adobeaftereffects', icon: 'https://cdn.simpleicons.org/adobeaftereffects', category: 'Design' },
    { name: 'Blender', slug: 'blender', icon: 'https://cdn.simpleicons.org/blender', category: '3D' },
    { name: 'VS Code', slug: 'vscode', icon: 'assets/tech/vscode.svg', category: 'Editor' },
    { name: 'Notion', slug: 'notion', icon: 'https://cdn.simpleicons.org/notion', category: 'Productivity' }
  ];

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

  // ==========================================================
  // SOCIAL INPUT NORMALIZATION & CLIPBOARD PASTE
  // ==========================================================
  window.normalizeSocialUrl = function (type, val) {
    if (!val) return '';
    val = val.trim();
    if (!val) return '';
    if (val.startsWith('http://') || val.startsWith('https://')) return val;

    if (type === 'github') {
      const clean = val.replace(/^@/, '').replace(/^github\.com\//i, '');
      return 'https://github.com/' + clean;
    }
    if (type === 'instagram') {
      const clean = val.replace(/^@/, '').replace(/^instagram\.com\//i, '');
      return 'https://www.instagram.com/' + clean;
    }
    if (type === 'facebook') {
      const clean = val.replace(/^@/, '').replace(/^facebook\.com\//i, '');
      return 'https://www.facebook.com/' + clean;
    }
    if (type === 'website') {
      return 'https://' + val;
    }
    return 'https://' + val;
  };

  window.normalizeSocialInput = function (input, type) {
    if (!input || !input.value) return;
    input.value = window.normalizeSocialUrl(type, input.value);
  };

  window.pasteToSocialInput = async function (inputId, type) {
    const input = document.getElementById(inputId);
    if (!input) return;

    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          input.value = text.trim();
          window.normalizeSocialInput(input, type);
          input.focus();
          return;
        }
      }
    } catch (e) {
      console.warn('Clipboard read error, prompting fallback:', e);
    }

    const manual = prompt('กรุณาวางลิงก์หรือข้อความที่ต้องการ:', input.value || '');
    if (manual !== null) {
      input.value = manual.trim();
      window.normalizeSocialInput(input, type);
      input.focus();
    }
  };

  // ==========================================================
  // SKILLS & BRAND LOGO MANAGEMENT
  // ==========================================================
  window.renderSelectedSkillsChips = function () {
    const container = document.getElementById('dsdSelectedSkillsContainer');
    const badge = document.getElementById('dsdSkillsCountBadge');
    if (!container) return;

    if (badge) {
      badge.textContent = `${currentSelectedSkills.length} สกิล`;
    }

    if (currentSelectedSkills.length === 0) {
      container.innerHTML = '<span style="font-size: 0.8rem; color: #94a3b8; font-style: italic;">ยังไม่ได้เลือกสกิล (คลิกสกิลยอดนิยมด้านล่างหรือค้นหาเพื่อเพิ่ม)</span>';
      return;
    }

    let html = '';
    currentSelectedSkills.forEach((s, idx) => {
      const iconUrl = s.icon || `https://cdn.simpleicons.org/${s.slug || s.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      html += `
        <span style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; color: #1e293b; user-select: none;">
          <img src="${iconUrl}" alt="${escapeHtml(s.name)}" style="width: 16px; height: 16px; object-fit: contain;" onerror="this.onerror=null; this.src='https://cdn.simpleicons.org/${s.slug || 'code'}';" />
          <span>${escapeHtml(s.name)}</span>
          <button type="button" onclick="removeSkillFromSelected(${idx})" style="background: none; border: none; padding: 0; cursor: pointer; color: #94a3b8; display: flex; align-items: center; line-height: 1;" title="ลบออก">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </span>
      `;
    });

    container.innerHTML = html;
  };

  window.renderPopularSkillsTags = function () {
    const tagsContainer = document.getElementById('dsdPopularSkillsTags');
    if (!tagsContainer) return;

    const popularSample = [
      'JavaScript', 'TypeScript', 'Node.js', 'Express.js', 'HTML5', 'CSS3',
      'SQLite', 'PostgreSQL', 'Python', 'React', 'Next.js', 'Tailwind CSS',
      'Figma', 'Adobe Photoshop', 'Canva', 'Vercel', 'Cloudflare', 'Git', 'GitHub', 'Docker'
    ];

    let html = '';
    popularSample.forEach(name => {
      const item = TECH_CATALOG.find(t => t.name.toLowerCase() === name.toLowerCase()) || {
        name,
        slug: name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        icon: `https://cdn.simpleicons.org/${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`
      };

      const isSelected = currentSelectedSkills.some(s => s.name.toLowerCase() === item.name.toLowerCase());
      const activeStyle = isSelected
        ? 'background: #0f172a; color: #ffffff; border-color: #0f172a;'
        : 'background: #ffffff; color: #334155; border-color: #cbd5e1;';

      html += `
        <button type="button" onclick="togglePopularSkill('${escapeHtml(item.name)}')" style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border: 1px solid; border-radius: 6px; font-size: 0.74rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; ${activeStyle}">
          <img src="${item.icon}" alt="${escapeHtml(item.name)}" style="width: 13px; height: 13px; object-fit: contain;" onerror="this.style.display='none';" />
          <span>${escapeHtml(item.name)}</span>
        </button>
      `;
    });

    tagsContainer.innerHTML = html;
  };

  window.togglePopularSkill = function (skillName) {
    const existsIdx = currentSelectedSkills.findIndex(s => s.name.toLowerCase() === skillName.toLowerCase());
    if (existsIdx !== -1) {
      currentSelectedSkills.splice(existsIdx, 1);
    } else {
      const match = TECH_CATALOG.find(t => t.name.toLowerCase() === skillName.toLowerCase());
      if (match) {
        currentSelectedSkills.push({ name: match.name, slug: match.slug, icon: match.icon });
      } else {
        const slug = skillName.toLowerCase().replace(/[^a-z0-9]/g, '');
        currentSelectedSkills.push({
          name: skillName,
          slug,
          icon: `https://cdn.simpleicons.org/${slug}`
        });
      }
    }
    window.renderSelectedSkillsChips();
    window.renderPopularSkillsTags();
  };

  window.addSkillToSelected = function (skillObj) {
    if (!skillObj || !skillObj.name) return;
    const exists = currentSelectedSkills.some(s => s.name.toLowerCase() === skillObj.name.toLowerCase());
    if (!exists) {
      currentSelectedSkills.push(skillObj);
      window.renderSelectedSkillsChips();
      window.renderPopularSkillsTags();
    }
    const dropdown = document.getElementById('dsdSkillSuggestionsDropdown');
    if (dropdown) dropdown.style.display = 'none';
    const input = document.getElementById('dsdSkillSearchInput');
    if (input) input.value = '';
  };

  window.removeSkillFromSelected = function (idx) {
    if (idx >= 0 && idx < currentSelectedSkills.length) {
      currentSelectedSkills.splice(idx, 1);
      window.renderSelectedSkillsChips();
      window.renderPopularSkillsTags();
    }
  };

  window.handleDsdSkillSearchInput = function (query) {
    const dropdown = document.getElementById('dsdSkillSuggestionsDropdown');
    if (!dropdown) return;

    const q = (query || '').trim().toLowerCase();
    if (!q) {
      dropdown.style.display = 'none';
      return;
    }

    const matches = TECH_CATALOG.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.slug && t.slug.toLowerCase().includes(q)) ||
      (t.category && t.category.toLowerCase().includes(q))
    ).slice(0, 8);

    const safeSlug = q.replace(/[^a-z0-9]/g, '');
    const simpleIconsUrl = `https://cdn.simpleicons.org/${safeSlug}`;

    let html = '';
    if (matches.length > 0) {
      matches.forEach(m => {
        const isAdded = currentSelectedSkills.some(s => s.name.toLowerCase() === m.name.toLowerCase());
        html += `
          <div onclick="addSkillToSelected({ name: '${escapeHtml(m.name)}', slug: '${escapeHtml(m.slug)}', icon: '${escapeHtml(m.icon)}' })" style="display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; ${isAdded ? 'background: #f8fafc; opacity: 0.6;' : 'hover:background: #f1f5f9;'}">
            <div style="display: flex; align-items: center; gap: 8px;">
              <img src="${m.icon}" alt="${escapeHtml(m.name)}" style="width: 18px; height: 18px; object-fit: contain;" onerror="this.src='https://cdn.simpleicons.org/${m.slug}';" />
              <div>
                <strong style="font-size: 0.84rem; color: #0f172a;">${escapeHtml(m.name)}</strong>
                <span style="font-size: 0.72rem; color: #64748b; margin-left: 6px;">${m.category || ''}</span>
              </div>
            </div>
            <span style="font-size: 0.74rem; font-weight: 700; color: ${isAdded ? '#10b981' : '#2563eb'};">${isAdded ? '✓ เพิ่มแล้ว' : '+ เลือก'}</span>
          </div>
        `;
      });
    }

    // Dynamic Option: Pull from SimpleIcons API
    html += `
      <div onclick="addSkillToSelected({ name: '${escapeHtml(query.trim())}', slug: '${safeSlug}', icon: '${simpleIconsUrl}' })" style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; margin-top: 4px; border-top: 1px dashed #e2e8f0; border-radius: 6px; cursor: pointer; background: #f0fdf4;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${simpleIconsUrl}" alt="${escapeHtml(query)}" style="width: 18px; height: 18px; object-fit: contain;" onerror="this.onerror=null; this.src='assets/tech/vscode.svg';" />
          <div>
            <div style="font-size: 0.82rem; font-weight: 700; color: #15803d;">ดึงโลโก้แบรนด์จาก SimpleIcons API: <strong>"${escapeHtml(query)}"</strong></div>
            <div style="font-size: 0.7rem; color: #166534;">${simpleIconsUrl}</div>
          </div>
        </div>
        <span style="font-size: 0.74rem; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 4px;">+ ดึงโลโก้นี้</span>
      </div>
    `;

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
  };

  window.addCustomSkillFromInput = function () {
    const input = document.getElementById('dsdSkillSearchInput');
    if (!input || !input.value.trim()) return;
    const name = input.value.trim();
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const matched = TECH_CATALOG.find(t => t.name.toLowerCase() === name.toLowerCase());

    if (matched) {
      window.addSkillToSelected(matched);
    } else {
      window.addSkillToSelected({
        name,
        slug,
        icon: `https://cdn.simpleicons.org/${slug}`
      });
    }
  };

  // Close suggestions when clicking outside
  document.addEventListener('click', function (e) {
    const dropdown = document.getElementById('dsdSkillSuggestionsDropdown');
    const input = document.getElementById('dsdSkillSearchInput');
    if (dropdown && input && !dropdown.contains(e.target) && e.target !== input) {
      dropdown.style.display = 'none';
    }
  });

  // ==========================================================
  // DATA FETCHER & ADMIN TABLE RENDERER
  // ==========================================================
  async function loadDsdAdmin() {
    const tableBody = document.getElementById('dsdMembersTableBody');
    const countBadge = document.getElementById('dsdCountBadge');
    if (tableBody) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--dg-text-muted);"><i data-lucide="loader" class="dg-spin" style="width: 24px; height: 24px; margin-bottom: 8px;"></i><div>กำลังโหลดข้อมูลสมาชิก DSD...</div></td></tr>';
      if (window.lucide) lucide.createIcons();
    }

    const token = getAuthToken();
    try {
      const res = await fetch(getApiBase() + '/api/dsd/admin/members', {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        dsdMembersList = json.data;
      } else {
        dsdMembersList = [];
      }
    } catch (err) {
      console.warn('Admin API fetch failed, trying public fallback:', err.message);
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

  function renderDsdAdminUI() {
    const tableBody = document.getElementById('dsdMembersTableBody');
    const countBadge = document.getElementById('dsdCountBadge');
    const headBadge = document.getElementById('dsdCurrentHeadBadge');
    if (!tableBody) return;

    let filtered = dsdMembersList.slice();

    if (dsdSearchTerm) {
      const term = dsdSearchTerm.toLowerCase();
      filtered = filtered.filter(m =>
        (m.name || '').toLowerCase().includes(term) ||
        (m.nickname || '').toLowerCase().includes(term) ||
        (m.role || '').toLowerCase().includes(term)
      );
    }

    if (dsdActiveFilter !== 'ALL') {
      filtered = filtered.filter(m => m.status === dsdActiveFilter);
    }

    if (countBadge) {
      countBadge.innerHTML = `<i data-lucide="users" style="width: 13px; height: 13px;"></i> สมาชิกทั้งหมด ${dsdMembersList.length} คน`;
    }

    const currentHead = dsdMembersList.find(m => Number(m.is_head) === 1);
    if (headBadge) {
      if (currentHead) {
        headBadge.innerHTML = `<i data-lucide="shield-check" style="width: 13px; height: 13px; color: #10b981;"></i> หัวหน้าฝ่าย: <strong>${escapeHtml(currentHead.name)}</strong>`;
      } else {
        headBadge.innerHTML = '<i data-lucide="alert-circle" style="width: 13px; height: 13px; color: #f59e0b;"></i> ยังไม่ระบุหัวหน้าฝ่าย';
      }
    }

    if (filtered.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 48px 20px; color: var(--dg-text-muted);"><i data-lucide="users" style="width: 36px; height: 36px; margin-bottom: 10px; color: var(--dg-border);"></i><div style="font-weight: 700; font-size: 1rem; color: var(--dg-text-primary); margin-bottom: 4px;">ไม่พบข้อมูลสมาชิก</div><div style="font-size: 0.85rem;">คลิกปุ่ม "+ เพิ่มสมาชิก DSD" เพื่อเพิ่มข้อมูลสมาชิกใหม่เข้าสู่ระบบ</div></td></tr>';
      if (window.lucide) lucide.createIcons();
      return;
    }

    let html = '';
    filtered.forEach((m, idx) => {
      const isHead = Number(m.is_head) === 1;
      const nickStr = m.nickname ? ` <span style="color: var(--dg-text-muted); font-weight: 400;">(${escapeHtml(m.nickname)})</span>` : '';
      const headBadgeHtml = isHead ? '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: var(--dg-radius-pill); background: var(--dg-text-primary); color: var(--dg-bg); font-size: 0.68rem; font-weight: 800; text-transform: uppercase;"><i data-lucide="shield-check" style="width: 11px; height: 11px;"></i> HEAD</span>' : '';

      const statusHtml = m.status === 'active'
        ? '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: var(--dg-radius-pill); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 0.72rem; font-weight: 700;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span> แสดงผล</span>'
        : '<span style="display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: var(--dg-radius-pill); background: rgba(100, 116, 139, 0.12); color: #64748b; font-size: 0.72rem; font-weight: 700;"><span style="width: 6px; height: 6px; border-radius: 50%; background: #64748b;"></span> ซ่อน</span>';

      let imgHtml = '';
      if (m.image_url) {
        let fullImg = m.image_url;
        if (fullImg.startsWith('/')) fullImg = getApiBase() + fullImg;
        imgHtml = `<img src="${fullImg}" alt="${escapeHtml(m.name)}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover;" onerror="this.onerror=null; this.src='assets/icons/sarawat-logo.png';" />`;
      } else {
        imgHtml = '<div style="width: 44px; height: 44px; border-radius: 8px; background: var(--dg-bg-subtle); border: 1px solid var(--dg-border); display: flex; align-items: center; justify-content: center; color: var(--dg-text-muted);"><i data-lucide="user" style="width: 20px; height: 20px;"></i></div>';
      }

      // Parse member skills for table preview
      let skillsArr = [];
      try { skillsArr = JSON.parse(m.skills || '[]'); } catch (e) { skillsArr = []; }
      let skillsLogosPreview = '';
      if (Array.isArray(skillsArr) && skillsArr.length > 0) {
        skillsLogosPreview = '<div style="display: flex; gap: 4px; align-items: center; margin-top: 4px;">';
        skillsArr.slice(0, 5).forEach(s => {
          const sIcon = s.icon || `https://cdn.simpleicons.org/${s.slug || 'code'}`;
          skillsLogosPreview += `<img src="${sIcon}" alt="${escapeHtml(s.name)}" title="${escapeHtml(s.name)}" style="width: 14px; height: 14px; object-fit: contain;" />`;
        });
        if (skillsArr.length > 5) {
          skillsLogosPreview += `<span style="font-size: 0.7rem; color: #94a3b8; font-weight: 700;">+${skillsArr.length - 5}</span>`;
        }
        skillsLogosPreview += '</div>';
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
            ${skillsLogosPreview}
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
              <button type="button" class="dg-btn-outline" style="padding: 6px 12px; font-size: 0.82rem; border-radius: 6px;" onclick="openEditDsdMemberModal(${m.id})">
                <i data-lucide="edit-3"></i> <span>แก้ไข</span>
              </button>
              <button type="button" class="dg-btn-outline" style="padding: 6px 10px; font-size: 0.82rem; border-radius: 6px; color: #ef4444; border-color: #fca5a5;" onclick="deleteDsdMember(${m.id}, '${escapeHtml(m.name)}')" title="ลบข้อมูล">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }

  // ==========================================================
  // MODAL MANAGEMENT: ADD / EDIT
  // ==========================================================
  window.openAddDsdMemberModal = function () {
    currentEditingMemberId = null;
    currentSelectedSkills = [];

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

    window.renderSelectedSkillsChips();
    window.renderPopularSkillsTags();

    const modal = document.getElementById('adminDsdMemberModal');
    if (modal) {
      modal.classList.add('active');
      modal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      if (window.lucide) lucide.createIcons();
    }
  };

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

    // Parse member skills
    try {
      const parsed = JSON.parse(member.skills || '[]');
      if (Array.isArray(parsed)) {
        currentSelectedSkills = parsed.map(item => {
          if (typeof item === 'string') {
            const found = TECH_CATALOG.find(t => t.name.toLowerCase() === item.toLowerCase());
            return found || { name: item, slug: item.toLowerCase().replace(/[^a-z0-9]/g, ''), icon: `https://cdn.simpleicons.org/${item.toLowerCase().replace(/[^a-z0-9]/g, '')}` };
          }
          return item;
        });
      } else {
        currentSelectedSkills = [];
      }
    } catch (e) {
      currentSelectedSkills = [];
    }

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

    window.renderSelectedSkillsChips();
    window.renderPopularSkillsTags();

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

  // ==========================================================
  // PHOTO UPLOAD HANDLER
  // ==========================================================
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
      if (res.ok && json.success && json.imageUrl) {
        document.getElementById('dsdMemberImageUrl').value = json.imageUrl;
        let fullUrl = json.imageUrl;
        if (fullUrl.startsWith('/')) fullUrl = getApiBase() + fullUrl;
        const preview = document.getElementById('dsdMemberImagePreview');
        if (preview) {
          preview.src = fullUrl;
          preview.style.display = 'block';
        }
        const placeholder = document.getElementById('dsdMemberImagePlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        if (uploadStatus) uploadStatus.textContent = '✓ อัปโหลดสำเร็จ!';
      } else {
        alert(json.error || 'อัปโหลดรูปภาพล้มเหลว');
        if (uploadStatus) uploadStatus.textContent = '❌ อัปโหลดล้มเหลว';
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ' + err.message);
      if (uploadStatus) uploadStatus.textContent = '❌ อัปโหลดล้มเหลว';
    }
  };

  // ==========================================================
  // SAVE MEMBER FORM (CREATE / UPDATE)
  // ==========================================================
  window.saveDsdMemberForm = async function () {
    const saveBtn = document.querySelector('#adminDsdMemberModal .dg-btn-black');
    const origBtnHtml = saveBtn ? saveBtn.innerHTML : '';

    const name = (document.getElementById('dsdMemberName').value || '').trim();
    const nickname = (document.getElementById('dsdMemberNickname').value || '').trim();
    const role = (document.getElementById('dsdMemberRole').value || '').trim();
    const isHead = document.getElementById('dsdMemberIsHead').checked ? 1 : 0;
    const grade = (document.getElementById('dsdMemberGrade').value || '').trim();
    const imageUrl = (document.getElementById('dsdMemberImageUrl').value || '').trim();
    const bio = (document.getElementById('dsdMemberBio').value || '').trim();

    // Auto-normalize social links
    const githubInput = document.getElementById('dsdMemberGithub');
    const instagramInput = document.getElementById('dsdMemberInstagram');
    const facebookInput = document.getElementById('dsdMemberFacebook');
    const websiteInput = document.getElementById('dsdMemberWebsite');

    const githubUrl = window.normalizeSocialUrl('github', githubInput ? githubInput.value : '');
    const instagramUrl = window.normalizeSocialUrl('instagram', instagramInput ? instagramInput.value : '');
    const facebookUrl = window.normalizeSocialUrl('facebook', facebookInput ? facebookInput.value : '');
    const websiteUrl = window.normalizeSocialUrl('website', websiteInput ? websiteInput.value : '');

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
      skills: currentSelectedSkills,
      order_index: orderIndex,
      status
    };

    const token = getAuthToken();
    const isEditing = currentEditingMemberId !== null;
    const url = isEditing
      ? `${getApiBase()}/api/dsd/members/${currentEditingMemberId}`
      : `${getApiBase()}/api/dsd/members`;
    const method = isEditing ? 'PUT' : 'POST';

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i data-lucide="loader" class="dg-spin" style="width: 14px; height: 14px;"></i> <span>กำลังบันทึกข้อมูล...</span>';
      if (window.lucide) lucide.createIcons();
    }

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
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = origBtnHtml;
        if (window.lucide) lucide.createIcons();
      }
    }
  };

  // ==========================================================
  // DELETE & REORDER
  // ==========================================================
  window.deleteDsdMember = async function (memberId, memberName) {
    if (!confirm(`คุณต้องการลบข้อมูล "${memberName}" ออกจากฝ่าย DSD ใช่หรือไม่?`)) {
      return;
    }

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
            title: 'ลบข้อมูลสำเร็จ',
            text: 'นำสมาชิกออกจากระบบเรียบร้อยแล้ว',
            timer: 1500,
            showConfirmButton: false
          });
        }
        loadDsdAdmin();
      } else {
        alert(json.error || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    } catch (err) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์: ' + err.message);
    }
  };

  window.moveDsdMemberOrder = async function (memberId, direction) {
    const idx = dsdMembersList.findIndex(m => m.id === memberId);
    if (idx === -1) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= dsdMembersList.length) return;

    // Swap order
    const temp = dsdMembersList[idx];
    dsdMembersList[idx] = dsdMembersList[targetIdx];
    dsdMembersList[targetIdx] = temp;

    const items = dsdMembersList.map((m, i) => ({
      id: m.id,
      order_index: i + 1
    }));

    renderDsdAdminUI();

    const token = getAuthToken();
    try {
      await fetch(getApiBase() + '/api/dsd/members/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ items })
      });
    } catch (err) {
      console.warn('Reorder API sync failed:', err);
    }
  };

  // ==========================================================
  // SEARCH & FILTER LISTENERS
  // ==========================================================
  window.handleDsdSearch = function (val) {
    dsdSearchTerm = (val || '').trim();
    renderDsdAdminUI();
  };

  window.handleDsdFilter = function (status) {
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

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('dsdSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', e => window.handleDsdSearch(e.target.value));
    }
  });

})();
