/* =============================================
   NAVIGATION
   ============================================= */
const VIEW_MAP = {
  dashboard: { el: 'view-dashboard', menu: 'menu-dashboard', label: '대시보드', sec: '개요' },
  timetable: { el: 'view-timetable', menu: 'menu-timetable', label: '시간표 배정', sec: '학사 관리' },
  'student-class-assign': { el: 'view-student-class-assign', menu: 'menu-student-class-assign', label: '주간 수업 배정', sec: '학사 관리' },
  'student-timetable': { el: 'view-student-timetable', menu: 'menu-student-timetable', label: '학생 시간표 배정', sec: '학사 관리' },
  'class-schedule': { el: 'view-class-schedule', menu: 'menu-class-schedule', label: '1:1 수업 관리', sec: '학사 관리' },
  'classroom-manage': { el: 'view-classroom-manage', menu: 'menu-classroom-manage', label: '강의실 관리', sec: '학사 관리' },
  'timetable-status': { el: 'view-timetable-status', menu: 'menu-timetable-status', label: '시간표 현황', sec: '학사 관리' },
  'weekly-timetable': { el: 'view-weekly-timetable', menu: 'menu-weekly-timetable', label: '주간 시간표', sec: '학사 관리' },
  students: { el: 'view-students', menu: 'menu-students', parent: 'menu-student-manage-parent', label: '학생 정보 관리', sec: '학생 관리' },
  'student-requests': { el: 'view-student-requests', menu: 'menu-student-requests', parent: 'menu-student-manage-parent', label: '학생 요청 관리', sec: '학생 관리' },
  'admin-student-detail': { el: 'view-agency-student-detail', menu: 'menu-students', label: '학생 상세 정보', sec: '학사 관리' },
  'pickup-managers': { el: 'view-pickup-managers', menu: 'menu-pickup-managers', parent: 'menu-pickup-parent', label: '픽업 담당자 관리', sec: '픽업 관리' },
  'pickup-assign': { el: 'view-pickup-assign', menu: 'menu-pickup-assign', parent: 'menu-pickup-parent', label: '픽업 배정', sec: '픽업 관리' },
  teachers: { el: 'view-teachers', menu: 'menu-teachers', parent: 'menu-teacher-manage-parent', label: '강사 정보 관리', sec: '강사 관리' },
  'teacher-tags': { el: 'view-teachers', menu: 'menu-teacher-tags', parent: 'menu-teacher-manage-parent', label: '배정 태그 설정 관리', sec: '강사 관리' },
  'classroom-status': { el: 'view-classroom-status', menu: 'menu-classroom-status', label: '강의실 관리', sec: '학사 관리' },
  'passport-access-log': { el: 'view-passport-access-log', menu: 'menu-passport-access-log', label: '여권번호 조회 기록', sec: '관리' },
  'agency-manage': { el: 'view-agency-manage', menu: 'menu-agency-manage', label: '에이전시 관리', sec: '관리' },
  'agency-visits': { el: 'view-agency-visits', menu: 'menu-agency-visits', label: '에이전시 방문일정 캘린더', sec: '관리' },
  'agency-map': { el: 'view-agency-map', menu: 'menu-agency-map', label: '에이전시 맵', sec: '관리' },
  'partnership-inquiries': { el: 'view-partnership-inquiries', menu: 'menu-partnership-inquiries', label: '에이전시 제휴 문의', sec: '관리' },
  'agency-home': { el: 'view-agency-home', menu: 'menu-agency-home', label: '에이전시 홈', sec: '에이전시' },
  'agency-students': { el: 'view-agency-students', menu: 'menu-agency-students', label: '학생 관리', sec: '에이전시' },
  'agency-student-detail': { el: 'view-agency-student-detail', menu: 'menu-agency-students', label: '학생 상세', sec: '에이전시' },
  'agency-dorm': { el: 'view-agency-dorm', menu: 'menu-agency-dorm', label: '기숙사 공실 조회', sec: '에이전시' },
  'agency-invoice': { el: 'view-agency-invoice', menu: 'menu-agency-invoice', label: '월별 정산 통계', sec: '에이전시' },
  'dorm-erp': { el: 'view-dorm-erp', menu: 'menu-dorm-erp', label: '기숙사 배정 관리', sec: '운영' },
  'meal-plan': { el: 'view-meal-plan', menu: 'menu-meal-plan', label: '식단 관리', sec: '운영' },
  'course-pricing': { el: 'view-course-pricing', menu: 'menu-course-pricing', parent: 'menu-course-settings-parent', label: '수강 과정 관리', sec: '커리큘럼 관리' },
  'course-master': { el: 'view-course-pricing', menu: 'menu-course-master', parent: 'menu-course-settings-parent', label: '수업 기준 관리', sec: '커리큘럼 관리' },
  'course-period': { el: 'view-course-pricing', menu: 'menu-course-period', parent: 'menu-course-settings-parent', label: '수업 시간 설정', sec: '커리큘럼 관리' },
  'tuition-config': { el: 'view-tuition-config', menu: 'menu-tuition-config', parent: 'menu-tuition-parent', label: '과정별 수강료', sec: '비용 관리' },
  'tuition-dorm': { el: 'view-tuition-config', menu: 'menu-tuition-dorm', parent: 'menu-tuition-parent', label: '기숙사 요금', sec: '비용 관리' },
  'tuition-registration': { el: 'view-tuition-config', menu: 'menu-tuition-registration', parent: 'menu-tuition-parent', label: '등록금', sec: '비용 관리' },
  'tuition-local': { el: 'view-tuition-config', menu: 'menu-tuition-local', parent: 'menu-tuition-parent', label: '기타 비용', sec: '비용 관리' },
  'teacher-dashboard': { el: 'view-teacher-dashboard', menu: 'menu-teacher-dashboard', label: '강사 대시보드', sec: '수업 관리' },
  'teacher-timetable': { el: 'view-teacher-timetable', menu: 'menu-teacher-timetable', label: '주간 시간표', sec: '수업 관리' },
  'student-dashboard': { el: 'view-student-dashboard', menu: 'menu-student-dashboard', label: '학생 대시보드', sec: '학생 서비스' },
  'student-timetable-change': { el: 'view-student-timetable-change', menu: 'menu-student-timetable-change', label: '강사 변경 신청', sec: '학생 서비스' },
  'student-dorm': { el: 'view-student-dorm', menu: 'menu-student-dorm', label: '기숙사 현황', sec: '학생 서비스' },
  'student-feedback': { el: 'view-student-feedback', menu: 'menu-student-feedback', label: '강사 평점 입력', sec: '학생 서비스' },
  'student-meal': { el: 'view-student-meal', menu: 'menu-student-meal', label: '점심 식단 신청', sec: '학생 서비스' },
};

function navigate(view) {
  const cfg = VIEW_MAP[view];
  if (!cfg) return;

  // Hide all views
  document.querySelectorAll('.tsa-view').forEach(v => v.classList.remove('active'));
  const el = document.getElementById(cfg.el);
  if (el) el.classList.add('active');

  // Update menu active state
  document.querySelectorAll('.tsa-nav-item, .tsa-nav-sub-item').forEach(m => m.classList.remove('active'));
  const isAgencyUser = APP.user && APP.user.includes('agency');
  const menuId = (view === 'agency-invoice' && !isAgencyUser) ? 'menu-admin-invoice' : cfg.menu;
  const menuEl = document.getElementById(menuId);
  if (menuEl) menuEl.classList.add('active');
  if (cfg.parent) document.getElementById(cfg.parent)?.classList.add('active');

  // Highlight parent menu for timetable sub-items and expand/collapse submenu accordingly
  const parentMenu = document.getElementById('menu-timetable-parent');
  const submenu = document.getElementById('timetable-submenu');
  const arrow = document.getElementById('timetable-submenu-arrow');
  if (parentMenu) {
    if (view === 'timetable' || view === 'weekly-timetable') {
      parentMenu.classList.add('active');
      if (submenu) {
        submenu.style.display = 'flex';
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      }
    } else {
      parentMenu.classList.remove('active');
      if (submenu) {
        submenu.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      }
    }
  }

  // Breadcrumb
  document.getElementById('breadcrumb-section').textContent = cfg.sec;
  document.getElementById('breadcrumb-current').textContent = cfg.label;

  // Refresh dynamic contents
  if (view === 'timetable') {
    renderTimetable(APP.conflictMode);
    renderUnassignedQueue();
    clearAssignWorkspace();
  } else if (view === 'weekly-timetable') {
    renderWeeklyTimetable();
  } else if (view === 'dashboard') {
    updateAdminKPIs();
    currentCalendarFilter = null;
    renderUnifiedCalendar('admin-calendar-grid', 'admin-calendar-month-year', 'admin-calendar-events-list', null);
    // 오늘 날짜 이벤트 기본 표시
    setTimeout(() => selectCalendarDate('2026-06-17', 'admin-calendar-events-list', null), 50);
    if (typeof initAdminInbox === 'function') initAdminInbox();
  } else if (view === 'agency-home') {
    updateAgencyKPIs();
    currentCalendarFilter = null;
    renderUnifiedCalendar('agency-calendar-grid', 'agency-calendar-month-year', 'agency-calendar-events-list', '한국 영어마을');
    // 오늘 날짜 이벤트 기본 표시
    setTimeout(() => selectCalendarDate('2026-06-17', 'agency-calendar-events-list', '한국 영어마을'), 50);
    if (typeof initAgencyStudentList === 'function') initAgencyStudentList();
    if (typeof initAgencyRequestInbox === 'function') initAgencyRequestInbox();
  } else if (view === 'agency-students') {
    if (typeof initAgencyStudentList === 'function') initAgencyStudentList();
  } else if (view === 'agency-dorm') {
    if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();
    searchAgencyDormVacancy();
    if (typeof renderAgencyDormBookHistory === 'function') renderAgencyDormBookHistory();
  } else if (view === 'agency-invoice') {
    renderMonthlyInvoiceStats();
  } else if (view === 'passport-access-log') {
    if (typeof initPassportAccessLogView === 'function') initPassportAccessLogView();
  } else if (view === 'student-class-assign') {
    if (typeof renderStudentClassAssignView === 'function') renderStudentClassAssignView();
  } else if (view === 'student-timetable') {
    if (typeof openStudentTimetableView === 'function') openStudentTimetableView();
    else if (typeof renderStudentTimetableView === 'function') renderStudentTimetableView();
  } else if (view === 'class-schedule') {
    initClassSchedule();
  } else if (view === 'classroom-manage') {
    if (typeof renderCsRooms === 'function') renderCsRooms();
  } else if (view === 'timetable-status') {
    if (typeof setFinalTimetableView === 'function') setFinalTimetableView('all', document.getElementById('ft-tab-all'));
  } else if (view === 'students') {
    applyStudentFilters();
  } else if (view === 'student-requests') {
    if (typeof initStudentRequestListPage === 'function') initStudentRequestListPage();
  } else if (view === 'pickup-managers') {
    if (typeof initPickupManagerView === 'function') initPickupManagerView();
  } else if (view === 'pickup-assign') {
    if (typeof initPickupAssignView === 'function') initPickupAssignView();
  } else if (view === 'teachers') {
    if (typeof initTeacherList === 'function') initTeacherList();
    if (typeof switchTeacherManageTab === 'function') switchTeacherManageTab('list');
  } else if (view === 'teacher-tags') {
    if (typeof switchTeacherManageTab === 'function') switchTeacherManageTab('tags');
  } else if (view === 'dorm-erp') {
    if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();
    renderDormErpGrid();
  } else if (view === 'classroom-status') {
    renderClassroomManage();
  } else if (view === 'course-pricing') {
    initCoursePricing();
    if (typeof switchCoursePricingTab === 'function') switchCoursePricingTab('curriculum');
  } else if (view === 'course-master') {
    if (typeof switchCoursePricingTab === 'function') switchCoursePricingTab('master');
  } else if (view === 'course-period') {
    if (typeof switchCoursePricingTab === 'function') switchCoursePricingTab('period');
  } else if (view === 'tuition-config') {
    if (typeof initTuitionConfig === 'function') initTuitionConfig();
    if (typeof switchTuitionConfigTab === 'function') switchTuitionConfigTab('course');
  } else if (view === 'tuition-dorm') {
    if (typeof initTuitionConfig === 'function') initTuitionConfig();
    if (typeof switchTuitionConfigTab === 'function') switchTuitionConfigTab('dorm');
  } else if (view === 'tuition-registration') {
    if (typeof initTuitionConfig === 'function') initTuitionConfig();
    if (typeof switchTuitionConfigTab === 'function') switchTuitionConfigTab('registration');
  } else if (view === 'tuition-local') {
    if (typeof initTuitionConfig === 'function') initTuitionConfig();
    if (typeof switchTuitionConfigTab === 'function') switchTuitionConfigTab('local');
  } else if (view === 'agency-manage') {
    renderAgencyManage();
  } else if (view === 'agency-visits') {
    if (typeof renderAgencyVisitView === 'function') renderAgencyVisitView();
  } else if (view === 'meal-plan') {
    if (typeof renderMealAdminView === 'function') renderMealAdminView();
  } else if (view === 'student-meal') {
    if (typeof initStudentMealView === 'function') initStudentMealView();
  } else if (view === 'agency-map') {
    if (typeof renderAgencyMap === 'function') renderAgencyMap();
  } else if (view === 'partnership-inquiries') {
    if (typeof renderPartnershipInquiries === 'function') renderPartnershipInquiries();
  } else if (view === 'teacher-dashboard') {
    if (typeof initTeacherPortal === 'function') initTeacherPortal();
  } else if (view === 'teacher-timetable') {
    if (typeof setupTeacherTimetable === 'function') setupTeacherTimetable();
  } else if (view === 'student-dashboard') {
    if (typeof initStudentPortal === 'function') initStudentPortal();
  } else if (view === 'student-dorm') {
    if (typeof renderStudentDormStatus === 'function') renderStudentDormStatus();
  }
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 300);
  closeMobileSidebar();
}

function toggleSidebarGroup(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const shouldOpen = group.style.display === 'none';
  group.style.display = shouldOpen ? 'flex' : 'none';
  const trigger = document.querySelector(`[aria-controls="${groupId}"]`);
  if (trigger) {
    trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    const arrow = trigger.querySelector('[data-lucide="chevron-down"]');
    if (arrow) arrow.style.transform = shouldOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

function isMobileSidebarMode() {
  return window.matchMedia('(max-width: 1100px)').matches;
}

function toggleMobileSidebar(forceOpen) {
  if (!isMobileSidebarMode()) return;
  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : !document.body.classList.contains('tsa-sidebar-open');
  document.body.classList.toggle('tsa-sidebar-open', shouldOpen);
  const button = document.getElementById('tsa-mobile-menu-btn');
  if (button) button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
}

function closeMobileSidebar() {
  document.body.classList.remove('tsa-sidebar-open');
  const button = document.getElementById('tsa-mobile-menu-btn');
  if (button) button.setAttribute('aria-expanded', 'false');
}

window.addEventListener('resize', () => {
  if (!isMobileSidebarMode()) closeMobileSidebar();
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('tsa-sidebar-open')) {
    closeMobileSidebar();
  }
});

/* =============================================
   CLOCK
   ============================================= */
function initClockTick() {
  function tick() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const el = document.getElementById('current-time');
    if (el) {
      el.textContent = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    }
  }
  tick();
  setInterval(tick, 30000);
}

/* =============================================
   BRANCH SWITCHER
   ============================================= */
function handleBranchSwitch() {
  const branchVal = document.getElementById('branch-switcher').value;
  APP.branch = branchVal;
  const bCfg = BRANCH_CONFIG[branchVal] || BRANCH_CONFIG['ph-cebu'];
  document.getElementById('sidebar-branch-label').textContent = bCfg.country;
  showToast(`캠퍼스 전환: ${bCfg.country}`, 'info');
}

/* =============================================
   MODAL HELPERS
   ============================================= */
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'flex';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// 등록 팝업 창 안에서는 모달을 숨기는 대신 팝업 창 자체를 닫는다 (뒤에 남을 빈 화면이 없도록)
function closeModalOrRegisterPopup(id) {
  if (typeof APP !== 'undefined' && APP.isRegisterPopup) {
    window.close();
    return;
  }
  closeModal(id);
}

function closeModalOrTeacherPopup(id) {
  if (typeof APP !== 'undefined' && APP.isTeacherDetailPopup) {
    if (typeof syncTeacherPopupChangesToOpener === 'function') syncTeacherPopupChangesToOpener();
    window.close();
    return;
  }
  closeModal(id);
}

/* =============================================
   TOAST NOTIFICATIONS
   ============================================= */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');

  const colors = {
    success: { bg: '#F0FDF4', border: '#86EFAC', icon: '#16A34A', iconClass: 'ki-check-circle' },
    danger:  { bg: '#FEF2F2', border: '#FCA5A5', icon: '#EF4444', iconClass: 'ki-cross-circle' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', icon: '#D97706', iconClass: 'ki-information-2' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', icon: '#3B82F6', iconClass: 'ki-information' },
  };

  const c = colors[type] || colors.info;

  toast.style.cssText = `
    display:flex;align-items:center;gap:10px;
    padding:12px 16px;
    background:${c.bg};
    border:1px solid ${c.border};
    border-radius:10px;
    box-shadow:0 4px 16px rgba(0,0,0,0.1);
    font-size:13px;font-weight:500;
    color:#1A1D23;
    max-width:380px;
    animation:slideIn 0.2s ease;
    cursor:pointer;
  `;

  toast.innerHTML = `
    <i class="ki-filled ${c.iconClass}" style="color:${c.icon};font-size:17px;flex-shrink:0"></i>
    <span style="flex:1">${message}</span>
    <i data-lucide="x" style="color:#9CA3AF;font-size:12px;flex-shrink:0"></i>
  `;

  toast.onclick = () => toast.remove();
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* =============================================
   UTILITY HELPERS
   ============================================= */
function infoItem(label, value) {
  return `<div class="tsa-info-item">
    <div class="tsa-info-label">${label}</div>
    <div class="tsa-info-value">${value}</div>
  </div>`;
}

function isVisaUrgent(dateStr) {
  if (!dateStr || dateStr === '면제') return false;
  const diff = (new Date(dateStr) - new Date()) / (1000*60*60*24);
  return diff <= 14;
}

// YY.MM.DD 포맷 변환 헬퍼
function fmtDate(str) {
  if (!str || str === '미설정' || str === '-') return str;
  // YYYY-MM-DD → YY.MM.DD
  const m1 = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return m1[1].slice(2) + '.' + m1[2] + '.' + m1[3];
  // MM-DD → 26.MM.DD (프로토타입 기본 연도 2026)
  const m2 = str.match(/^(\d{2})-(\d{2})$/);
  if (m2) return '26.' + m2[1] + '.' + m2[2];
  return str;
}

// 여권번호는 조회 화면에서 앞 2자리와 뒤 2자리만 노출한다.
// 실제 값은 중복 검사와 수정 저장을 위해 데이터에 그대로 유지한다.
function maskPassportNumber(value, emptyText = '-') {
  if (!value) return emptyText;

  const passportNumber = String(value);
  if (passportNumber.length <= 4) return '*'.repeat(passportNumber.length);

  return passportNumber.slice(0, 2)
    + '*'.repeat(passportNumber.length - 4)
    + passportNumber.slice(-2);
}

// 항공편 문자열 안의 날짜를 YY.MM.DD 로 변환 (예: "KE631 | 06-01 입국" → "KE631 | 26.06.01 입국")
function fmtFlightStr(str) {
  if (!str || str === '-') return str;
  // YYYY-MM-DD 포함된 경우
  str = str.replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, y, m, d) => y.slice(2) + '.' + m + '.' + d);
  // MM-DD 포함된 경우 (파이프 뒤 날짜만 대상)
  str = str.replace(/\|\s*(\d{2})-(\d{2})/g, (_, m, d) => '| 26.' + m + '.' + d);
  return str;
}

function getDepartureDDay(dateStr) {
  if (!dateStr || dateStr === '미설정') return '출국일 미정';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays > 0) {
    return `출국 D-${diffDays}`;
  } else if (diffDays === 0) {
    return '오늘 출국 ✈️';
  } else {
    return `출국 완료 (D+${Math.abs(diffDays)})`;
  }
}

function clearRegistrationForm() {
  document.getElementById('reg-passport-name').value = '';
  document.getElementById('reg-nickname').value = '';
  document.getElementById('reg-gender').selectedIndex = 0;
  document.getElementById('reg-nationality').selectedIndex = 0;
  document.getElementById('reg-course').selectedIndex = 0;
  document.getElementById('reg-duration').value = '4';
  document.getElementById('reg-dorm').selectedIndex = 1;
  document.getElementById('reg-flight').value = '';
  document.getElementById('reg-departure').value = '';
  document.getElementById('reg-special').value = '';
  
  // Reset file inputs
  document.getElementById('reg-file-passport').value = '';
  document.getElementById('reg-file-eticket').value = '';
  document.getElementById('reg-file-photo').value = '';

  // Reset file badges
  const bPassport = document.getElementById('badge-file-passport');
  if (bPassport) {
    bPassport.textContent = '파일 없음';
    bPassport.className = 'tsa-badge tsa-badge-gray';
  }
  const bEticket = document.getElementById('badge-file-eticket');
  if (bEticket) {
    bEticket.textContent = '파일 없음';
    bEticket.className = 'tsa-badge tsa-badge-gray';
  }
  const bPhoto = document.getElementById('badge-file-photo');
  if (bPhoto) {
    bPhoto.textContent = '파일 없음';
    bPhoto.className = 'tsa-badge tsa-badge-gray';
  }
}

function handleFileSelected(type) {
  const input = document.getElementById(`reg-file-${type}`);
  const badge = document.getElementById(`badge-file-${type}`);
  if (!input || !badge) return;

  if (input.files && input.files.length > 0) {
    const fileName = input.files[0].name;
    badge.textContent = `✓ ${fileName}`;
    badge.className = 'tsa-badge tsa-badge-success';
  } else {
    badge.textContent = '파일 없음';
    badge.className = 'tsa-badge tsa-badge-gray';
  }
}

function avatarColor(id) {
  const colors = [
    'linear-gradient(135deg,#5E5CE6,#818CF8)',
    'linear-gradient(135deg,#0EA5E9,#38BDF8)',
    'linear-gradient(135deg,#16A34A,#4ADE80)',
    'linear-gradient(135deg,#D97706,#FCD34D)',
    'linear-gradient(135deg,#EF4444,#FCA5A5)',
    'linear-gradient(135deg,#7C3AED,#A78BFA)',
    'linear-gradient(135deg,#0891B2,#67E8F9)',
    'linear-gradient(135deg,#BE185D,#F472B6)',
  ];
  return colors[(id - 1) % colors.length];
}

function teacherAvatarColor(id) {
  return avatarColor(id + 3);
}

/* =============================================
   STYLE INJECTION (Toast animation)
   ============================================= */
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { opacity:0; transform:translateX(20px); }
    to { opacity:1; transform:translateX(0); }
  }
`;
document.head.appendChild(style);

function payLocalFee(studentId, feeId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;
  const fee = s.fees.find(f => f.id === feeId);
  if (fee) {
    fee.paid = true;
    showToast(`✓ [수납 완료] ${fee.item} 수납 처리가 완료되었습니다.`, 'success');
    switchAdetailTab('settle');
  }
}

// Column Visibility Configuration
function toggleColumnDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('column-toggle-dropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

// Close column dropdown when clicking outside
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('column-toggle-dropdown');
  if (dropdown && dropdown.style.display === 'block') {
    if (!dropdown.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
});

function handleColumnToggle() {
  const checkboxes = document.querySelectorAll('.col-toggle-cb');
  checkboxes.forEach(cb => {
    const colName = cb.getAttribute('data-col');
    const checked = cb.checked;
    const elements = document.querySelectorAll(`.col-${colName}`);
    elements.forEach(el => {
      el.style.display = checked ? '' : 'none';
    });
  });
}

// Age birthdate date selection change
function handleAregDobChange() {
  const dobVal = document.getElementById('areg-dob').value;
  if (!dobVal) return;
  
  const today = new Date();
  const birthDate = new Date(dobVal);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  document.getElementById('areg-age').value = age;
  const preview = document.getElementById('areg-age-preview');
  if (preview) preview.textContent = `(만 ${age}세)`;
  
  const familyBox = document.getElementById('areg-family-cert-box');
  if (familyBox) {
    if (age < 15) {
      familyBox.style.display = 'flex';
      showToast(`👶 만 15세 미만 주니어 확인 (만 ${age}세): 가족관계증명서 필수 제출 대상입니다.`, 'info');
    } else {
      familyBox.style.display = 'none';
      aregFiles.family = null;
      document.getElementById('areg-badge-family').textContent = '없음';
      document.getElementById('areg-badge-family').className = 'tsa-badge tsa-badge-gray';
    }
  }
}

// Room Change Split Billing Implementation
// presetStudentId를 주면(예: Room 상세 모달의 입실 현황에서 특정 학생의 "이동" 버튼) 그 학생을 미리 선택해서 연다.
function openDormRoomChangeModal(presetStudentId) {
  const selectStudent = document.getElementById('rc-student-select');
  const selectNewRoom = document.getElementById('rc-new-room-select');
  if (!selectStudent || !selectNewRoom) return;

  const residentNicks = [];
  MOCK_DORM_ROOMS.forEach(room => {
    room.beds.forEach(bed => {
      if (bed.student) {
        residentNicks.push(bed.student.split(' ')[0]);
      }
    });
  });

  const residentStudents = MOCK_STUDENTS.filter(s => residentNicks.some(nick => s.nick.includes(nick)));
  if (residentStudents.length === 0) {
    selectStudent.innerHTML = `<option value="">방 이동 가능한 학생 없음</option>`;
  } else {
    selectStudent.innerHTML = residentStudents.map(s => `<option value="${s.id}">${s.nick} (${s.name})</option>`).join('');
  }
  if (presetStudentId && residentStudents.some(s => s.id === presetStudentId)) {
    selectStudent.value = String(presetStudentId);
  }

  const emptyBeds = [];
  MOCK_DORM_ROOMS.forEach(room => {
    room.beds.forEach(bed => {
      if (!bed.student) {
        emptyBeds.push({ roomNo: room.roomNo, bedId: bed.id });
      }
    });
  });

  if (emptyBeds.length === 0) {
    selectNewRoom.innerHTML = `<option value="">남은 기숙사 공실 없음</option>`;
  } else {
    selectNewRoom.innerHTML = emptyBeds.map(b => `<option value="${b.roomNo}-${b.bedId}">Room ${b.roomNo} / Bed ${b.bedId}</option>`).join('');
  }

  document.getElementById('rc-change-date').value = new Date().toISOString().split('T')[0];
  onRcStudentChanged();
  openModal('dorm-room-change-modal');
}

function onRcStudentChanged() {
  const studentId = parseInt(document.getElementById('rc-student-select').value);
  if (!studentId) return;

  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;

  let currentRoomBed = '';
  MOCK_DORM_ROOMS.forEach(room => {
    room.beds.forEach(bed => {
      if (bed.student && bed.student.includes(s.nick)) {
        currentRoomBed = `Room ${room.roomNo} / Bed ${bed.id}`;
      }
    });
  });

  document.getElementById('rc-current-room').value = currentRoomBed || s.dorm;
  previewRcSplit();
}

function previewRcSplit() {
  const studentId = parseInt(document.getElementById('rc-student-select').value);
  const newRoomVal = document.getElementById('rc-new-room-select').value;
  const changeDateVal = document.getElementById('rc-change-date').value;
  const elecBill = parseFloat(document.getElementById('rc-elec-bill').value) || 0;
  const preview = document.getElementById('rc-split-preview');

  if (!preview) return;
  if (!studentId || !newRoomVal || !changeDateVal) {
    preview.innerHTML = `<span style="color:#9CA3AF">모든 정보를 입력하세요.</span>`;
    return;
  }

  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;

  const startDate = new Date(s.startDate || '2026-06-01');
  const changeDate = new Date(changeDateVal);
  const durationDays = s.duration ? s.duration * 7 : 28;
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + durationDays);

  if (changeDate < startDate || changeDate > endDate) {
    preview.innerHTML = `<span style="color:#EF4444;font-weight:700">⚠ 경고: 이동일(${changeDateVal})은 수강 기간(${s.startDate} ~ ${endDate.toISOString().split('T')[0]}) 범위 내여야 합니다.</span>`;
    return;
  }

  const days1 = Math.max(0, Math.round((changeDate - startDate) / (1000 * 60 * 60 * 24)));
  const days2 = Math.max(0, durationDays - days1);

  const share1 = Math.round(elecBill * (days1 / durationDays));
  const share2 = Math.round(elecBill * (days2 / durationDays));

  const usd1 = Math.round(share1 / 50);
  const usd2 = Math.round(share2 / 50);

  preview.innerHTML = `
    <div style="font-weight:700;color:#5E5CE6;margin-bottom:8px">📊 전기세 N/1 일수 비례 분할 시뮬레이션 결과</div>
    <div style="line-height:1.6">
      • 총 연수 일수: <strong>${durationDays}일</strong> (${s.startDate} ~ ${endDate.toISOString().split('T')[0]})<br>
      • 이전 방 체류: <strong>${days1}일</strong> (${s.startDate} ~ ${changeDateVal}) ➔ 분담 전기세: <strong>₱${share1.toLocaleString()} (약 $${usd1})</strong><br>
      • 신규 방 체류: <strong>${days2}일</strong> (${changeDateVal} ~ ${endDate.toISOString().split('T')[0]}) ➔ 분담 전기세: <strong>₱${share2.toLocaleString()} (약 $${usd2})</strong><br>
      <div class="tsa-divider" style="margin:8px 0"></div>
      <span style="color:#059669;font-weight:600">✓ 반영 시 학생 로컬피 영장에 이전 방/신규 방 전기세 분할 청구서가 자동 발행됩니다.</span>
    </div>
  `;
}

function executeDormRoomChange() {
  const studentId = parseInt(document.getElementById('rc-student-select').value);
  const newRoomVal = document.getElementById('rc-new-room-select').value;
  const changeDateVal = document.getElementById('rc-change-date').value;
  const elecBill = parseFloat(document.getElementById('rc-elec-bill').value) || 0;

  if (!studentId || !newRoomVal || !changeDateVal) {
    showToast('필수 값을 모두 입력하세요.', 'danger');
    return;
  }

  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;

  const startDate = new Date(s.startDate || '2026-06-01');
  const changeDate = new Date(changeDateVal);
  const durationDays = s.duration ? s.duration * 7 : 28;
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + durationDays);

  if (changeDate < startDate || changeDate > endDate) {
    showToast('이동일자 범위 유효성 검사 실패', 'danger');
    return;
  }

  const [newRoomNo, newBedId] = newRoomVal.split('-');

  let oldRoomNo = '';
  let oldBedId = '';
  MOCK_DORM_ROOMS.forEach(room => {
    room.beds.forEach(bed => {
      if (bed.student && bed.student.includes(s.nick)) {
        oldRoomNo = room.roomNo;
        oldBedId = bed.id;
        bed.student = null;
      }
    });
  });

  const targetRoom = MOCK_DORM_ROOMS.find(r => r.roomNo === newRoomNo);
  if (targetRoom) {
    const targetBed = targetRoom.beds.find(b => b.id === newBedId);
    if (targetBed) {
      targetBed.student = `${s.nick} (${s.name.split(' ')[0]})`;
      targetBed.start = changeDateVal.slice(5);
      targetBed.end = endDate.toISOString().split('T')[0].slice(5);
      targetBed.color = '#7C3AED';
    }
  }

  s.dorm = `Room ${newRoomNo} / Bed ${newBedId}`;

  const days1 = Math.max(0, Math.round((changeDate - startDate) / (1000 * 60 * 60 * 24)));
  const days2 = Math.max(0, durationDays - days1);
  const share1 = Math.round(elecBill * (days1 / durationDays));
  const share2 = Math.round(elecBill * (days2 / durationDays));
  const usd1 = Math.round(share1 / 50);
  const usd2 = Math.round(share2 / 50);

  const prevRoomLabel = oldRoomNo ? `Room ${oldRoomNo}` : '이전 방';
  s.fees.push({
    id: Date.now() + 10,
    item: `전기료 분할 청구 (${prevRoomLabel} - ${days1}일분)`,
    amount: usd1,
    paid: false
  });
  s.fees.push({
    id: Date.now() + 11,
    item: `전기료 분할 청구 (신규 Room ${newRoomNo} - ${days2}일분)`,
    amount: usd2,
    paid: false
  });

  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().slice(0,10),
    time: new Date().toTimeString().slice(0,5),
    actor: 'Super Admin',
    change: `${s.nick} 기숙사 방 이동 (${prevRoomLabel} Bed ${oldBedId || 'A'} ➔ Room ${newRoomNo} Bed ${newBedId})`,
    reason: `이동일 ${changeDateVal} 기준 전기세 비례 분할 청구 ($${usd1} / $${usd2})`,
    type: 'ok'
  });

  showToast(`✓ 룸 체인지 및 전기세 분할 정산 청구 완료!`, 'success');
  closeModal('dorm-room-change-modal');
  initDormGantt();
  initStudentList();
}

/* =============================================
   SUBMENU COLLAPSE
   ============================================= */
function toggleTimetableSubmenu() {
  const submenu = document.getElementById('timetable-submenu');
  const arrow = document.getElementById('timetable-submenu-arrow');
  if (!submenu) return;

  if (submenu.style.display === 'none') {
    submenu.style.display = 'flex';
    if (arrow) arrow.style.transform = 'rotate(180deg)';
  } else {
    submenu.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }
}

/* =============================================
   PASSWORD FIELD VISIBILITY TOGGLE
   ============================================= */
function toggleTsaPasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const showing = input.type === 'text';
  input.type = showing ? 'password' : 'text';
  if (btn) btn.textContent = showing ? '👁' : '🙈';
}

// 비밀번호 변경 필드 묶음(idPrefix-password/idPrefix-password-confirm)을 읽어 검증한다.
// 둘 다 비어있으면 { ok:true, password:null } (기존 비밀번호 유지), 값이 있으면 8자 이상·일치 여부를 확인한다.
function readStudentPasswordFields(idPrefix) {
  const pwEl = document.getElementById(`${idPrefix}-password`);
  const pwConfirmEl = document.getElementById(`${idPrefix}-password-confirm`);
  const password = pwEl ? pwEl.value : '';
  const passwordConfirm = pwConfirmEl ? pwConfirmEl.value : '';
  if (!password && !passwordConfirm) return { ok: true, password: null };
  if (password.length < 8) return { ok: false, message: '비밀번호는 8자 이상이어야 합니다.' };
  if (password !== passwordConfirm) return { ok: false, message: '비밀번호 확인이 일치하지 않습니다.' };
  return { ok: true, password };
}

// 학생 상세/수정 폼에서 재사용하는 "로그인 정보" 하이라이트 박스 (이메일·비밀번호 변경을 한 데 묶어서 강조 — 연락처는 계정과 무관한 일반 정보라 여기 포함하지 않는다)
function renderStudentLoginInfoBoxHtml(idPrefix, s) {
  return `
    <div class="tsa-form-group" style="grid-column:span 2;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px 16px 16px">
      <div style="font-size:12px;font-weight:700;color:#1D4ED8;margin-bottom:12px;display:flex;align-items:center;gap:6px"><span>🔐 로그인 정보</span><span style="font-size:10px;color:#3B82F6;font-weight:400">— 학생은 이 이메일과 비밀번호로 로그인해</span></div>
      <div class="tsa-form-group" style="margin:0 0 12px">
        <label class="tsa-label">이메일 주소</label>
        <input id="${idPrefix}-email" type="email" class="tsa-input" value="${s.email || ''}" placeholder="student@example.com" readonly style="background:#F3F4F6;color:#6B7280;cursor:not-allowed"/>
        <div style="font-size:10px;color:#9CA3AF;margin-top:4px">이메일은 변경할 수 없습니다.</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${renderStudentPasswordFieldsHtml(idPrefix)}
      </div>
    </div>`;
}

// 학생 상세/수정 폼에서 재사용하는 "비밀번호 변경" 필드 묶음 (idPrefix로 ad-password 등 id 충돌 방지)
function renderStudentPasswordFieldsHtml(idPrefix) {
  return `
    <div class="tsa-form-group">
      <label class="tsa-label">비밀번호 변경</label>
      <div style="position:relative">
        <input id="${idPrefix}-password" type="password" class="tsa-input" style="padding-right:36px" placeholder="변경할 때만 입력" autocomplete="new-password"/>
        <button type="button" onclick="toggleTsaPasswordVisibility('${idPrefix}-password', this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);border:none;background:none;cursor:pointer;font-size:13px;line-height:1">👁</button>
      </div>
      <div style="font-size:10px;color:#9CA3AF;margin-top:4px">비워두면 기존 비밀번호가 유지됩니다. (8자 이상)</div>
    </div>
    <div class="tsa-form-group">
      <label class="tsa-label">비밀번호 확인</label>
      <input id="${idPrefix}-password-confirm" type="password" class="tsa-input" placeholder="다시 한 번 입력" autocomplete="new-password"/>
    </div>`;
}

