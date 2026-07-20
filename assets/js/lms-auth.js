/* =============================================
   LOGIN
   ============================================= */
function switchLoginTab(tab) {
  document.getElementById('ltab-admin').classList.toggle('active', tab === 'admin');
  document.getElementById('ltab-agency').classList.toggle('active', tab === 'agency');
  document.getElementById('lform-admin').style.display = tab === 'admin' ? 'block' : 'none';
  document.getElementById('lform-agency').style.display = tab === 'agency' ? 'block' : 'none';
}

function handleLogin(type) {
  const dataEnhancersReady = typeof enhanceMockStudents === 'function'
    && typeof enhanceMockTeachers === 'function';

  if (document.readyState === 'loading' || !dataEnhancersReady) {
    if (document.readyState === 'loading') {
      if (!window.__tsaLoginRetryPending) {
        window.__tsaLoginRetryPending = true;
        window.addEventListener('load', () => {
          window.__tsaLoginRetryPending = false;
          handleLogin(type);
        }, { once: true });
      }
      return;
    }

    const message = '필수 데이터 스크립트를 불러오지 못했습니다. 페이지를 새로고침한 뒤 다시 시도해주세요.';
    console.error(message, {
      enhanceMockStudents: typeof enhanceMockStudents,
      enhanceMockTeachers: typeof enhanceMockTeachers
    });
    if (typeof showToast === 'function') showToast(message, 'danger');
    else alert(message);
    return;
  }

  let role;
  if (type === 'admin') {
    role = document.getElementById('login-role').value;
    APP.branch = document.getElementById('login-branch').value;
  } else {
    role = document.getElementById('login-agency-type').value;
  }

  APP.user = role;
  const cfg = ROLE_CONFIG[role];

  // Initialize v0.3 data enhancements
  enhanceMockStudents();
  enhanceMockTeachers();

  // Apply user info and menu visibility
  applyRoleUI();

  // Agency badge
  if (type === 'agency') {
    const agencyType = document.getElementById('login-agency-type').value;
    document.getElementById('agency-login-badge').textContent =
      agencyType === 'agency_head' ? '🏢 한국 영어마을 본사' : '🏬 한국 영어마을 강남지사';
  }

  // Show app
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-layout').style.display = 'block';

  // Navigate to appropriate default and initialize portal data
  if (role === 'teacher') {
    initTeacherPortal();
    navigate('teacher-dashboard');
  } else if (role === 'student') {
    initStudentPortal();
    navigate('student-dashboard');
  } else if (cfg.menus.includes('agency')) {
    navigate('agency-home');
  } else {
    if (role === 'super_admin') {
      initGlobalDashboard();
    }
    navigate('dashboard');
  }

  // Init all widgets
  initClockTick();
  initTimetableGrid();
  initStudentList();
  initTeacherList();
  initAgencyStudentList();
  initCoursePricing();
  initDormGantt();
  if (typeof initCalculators === 'function') initCalculators();
}

function applyRoleUI() {
  const role = APP.user;
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return;

  // Apply user info
  const avatarEl = document.getElementById('user-avatar');
  if (avatarEl) {
    if (role === 'teacher') {
      avatarEl.innerHTML = `<img src="assets/images/teacher_female.png" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt=""/>`;
      avatarEl.style.background = 'none';
    } else if (role === 'student') {
      avatarEl.innerHTML = `<img src="assets/images/student_female.png" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt=""/>`;
      avatarEl.style.background = 'none';
    } else {
      avatarEl.textContent = cfg.avatar;
      avatarEl.style.background = cfg.bg;
    }
  }

  const nameEl = document.getElementById('user-display-name');
  if (nameEl) nameEl.textContent = cfg.label;

  const roleEl = document.getElementById('user-display-role');
  if (roleEl) roleEl.textContent = cfg.label.toUpperCase();

  const badgeEl = document.getElementById('role-badge');
  if (badgeEl) badgeEl.textContent = cfg.label;

  const breadEl = document.getElementById('breadcrumb-section');
  if (breadEl) breadEl.textContent = cfg.breadSec;

  // Branch
  const bCfg = BRANCH_CONFIG[APP.branch] || BRANCH_CONFIG['ph-cebu'];
  const branchEl = document.getElementById('sidebar-branch-label');
  if (branchEl) branchEl.textContent = bCfg.country;

  // Show / Hide sidebar menus
  applyMenuVisibility(cfg.menus);
}

function applyMenuVisibility(menus) {
  const role = APP.user;

  // Generic role categories
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = (menus && menus.includes('admin')) ? '' : 'none';
  });
  document.querySelectorAll('.staff-only').forEach(el => {
    el.style.display = (menus && (menus.includes('staff') || menus.includes('admin'))) ? '' : 'none';
  });
  document.querySelectorAll('.agency-only').forEach(el => {
    el.style.display = (menus && menus.includes('agency')) ? '' : 'none';
  });

  // Specific role menus
  document.querySelectorAll('.teacher-only').forEach(el => {
    el.style.display = (role === 'teacher') ? '' : 'none';
  });
  document.querySelectorAll('.student-only').forEach(el => {
    el.style.display = (role === 'student') ? '' : 'none';
  });
  document.querySelectorAll('.super-admin-only').forEach(el => {
    el.style.display = (role === 'super_admin') ? '' : 'none';
  });

  // Hide general sections for teacher or student completely
  if (role === 'teacher' || role === 'student') {
    document.querySelectorAll('.admin-only, .staff-only, .agency-only').forEach(el => el.style.display = 'none');
  }
}

function handleLogout() {
  APP.user = null;
  // Restore normal Overview menu label
  document.getElementById('menu-dashboard').innerHTML = '<i data-lucide="layout-dashboard"></i> 대시보드';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-layout').style.display = 'none';
}

