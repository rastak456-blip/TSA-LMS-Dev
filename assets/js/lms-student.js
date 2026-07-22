/* =============================================
   STUDENT MANAGEMENT
   ============================================= */
function updateStudentFilterCounts() {
  const pills = document.getElementById('student-filter-pills');
  if (!pills) return;
  const all = MOCK_STUDENTS.length;
  const waiting = MOCK_STUDENTS.filter(s => s.status === 'waiting').length;
  const current = MOCK_STUDENTS.filter(s => s.status === 'current').length;
  const completed = MOCK_STUDENTS.filter(s => s.status === 'completed').length;
  const resigned = MOCK_STUDENTS.filter(s => s.status === 'resigned').length;
  const extended = MOCK_STUDENTS.filter(s => s.status === 'extended').length;

  pills.children[0].textContent = `전체 (${all})`;
  pills.children[1].textContent = `입학 대기 (${waiting})`;
  pills.children[2].textContent = `재학 (${current})`;
  pills.children[3].textContent = `졸업 (${completed})`;
  pills.children[4].textContent = `퇴원 (${resigned})`;
  pills.children[5].textContent = `연장 (${extended})`;
}

function initStudentList() {
  enhanceMockStudents();
  updateStudentFilterCounts();
  populateStudentFilterOptions();
  filterStudentList(APP.activeStudentFilter || 'all');
}

function populateStudentFilterOptions() {
  const natSel = document.getElementById('sf-nationality');
  if (natSel && natSel.options.length <= 1) {
    const nats = [...new Set(MOCK_STUDENTS.map(s => s.nationality).filter(Boolean))].sort();
    nats.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n; opt.textContent = n;
      natSel.appendChild(opt);
    });
  }
  const agencySel = document.getElementById('sf-agency');
  if (agencySel && agencySel.options.length <= 1) {
    const agencies = [...new Set(MOCK_STUDENTS.map(s => s.agency).filter(Boolean))].sort();
    agencies.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a; opt.textContent = a;
      agencySel.appendChild(opt);
    });
  }
}

function getStudentPaymentSummary(s) {
  const latestEnrollment = Array.isArray(s.enrollments) && s.enrollments.length ? s.enrollments[0] : null;
  const savedFees = s.courseRegistrationFees || {};
  const fallbackTotal = typeof calculatePrices === 'function' ? calculatePrices(s).gross : 0;
  const total = Number(savedFees.total || s.totalGross || latestEnrollment?.totalGross || fallbackTotal || 0);
  const itemStatuses = s.billingItemStatuses || {};

  let paid = 0;
  if (s.remittanceStatus === 'paid' || latestEnrollment?.paymentStatus === 'paid') {
    paid = total;
  } else if (Object.keys(itemStatuses).length && Object.keys(savedFees).length) {
    const feeByStatusKey = {
      registration: Number(savedFees.registration || 0),
      education: Number(savedFees.tuition || 0),
      dorm: Number(savedFees.dorm || 0),
      local: Number(savedFees.extras || 0),
    };
    paid = Object.entries(feeByStatusKey).reduce((sum, [key, amount]) => {
      return sum + (itemStatuses[key] === 'paid' ? amount : 0);
    }, 0);
  }

  const status = total > 0 && paid >= total ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
  return { total, paid, status };
}

function renderStudentList(list) {
  const tbody = document.getElementById('student-list-body');
  if (!tbody) return;

  const sorted = [...list].sort((a, b) => b.id - a.id);
  const total = sorted.length;

  tbody.innerHTML = sorted.map((s, idx) => {
    const rowNum = total - idx;
    const statusDropdown = `
      <select onchange="setStudentStatusManually(${s.id}, this.value)" class="tsa-input" style="width:95px;padding:3px 6px;font-size:11.5px;font-weight:600;height:auto;display:inline-block">
        <option value="waiting" ${s.status === 'waiting' ? 'selected' : ''}>입학 대기</option>
        <option value="current" ${s.status === 'current' ? 'selected' : ''}>재학</option>
        <option value="completed" ${s.status === 'completed' ? 'selected' : ''}>졸업</option>
        <option value="resigned" ${s.status === 'resigned' ? 'selected' : ''}>퇴원</option>
        <option value="extended" ${s.status === 'extended' ? 'selected' : ''}>연장</option>
      </select>
    `;

    let statusLabel = '입학 대기';
    let statusBadgeClass = 'tsa-badge-warning';
    if (s.status === 'completed') { statusLabel = '졸업'; statusBadgeClass = 'tsa-badge-gray'; }
    else if (s.status === 'resigned') { statusLabel = '퇴원'; statusBadgeClass = 'tsa-badge-danger'; }
    else if (s.status === 'current') { statusLabel = '재학'; statusBadgeClass = 'tsa-badge-success'; }
    else if (s.status === 'extended') { statusLabel = '연장'; statusBadgeClass = 'tsa-badge-primary'; }

    const statusPill = `<span class="tsa-badge ${statusBadgeClass}" style="font-size:10.5px;margin-top:4px;display:inline-block">${statusLabel}</span>`;

    const attColor = s.attendance >= 90 ? '#16A34A' : s.attendance >= 85 ? '#D97706' : '#EF4444';
    const avatarSrc = s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');

    const agencyInfo = (typeof MOCK_AGENCIES !== 'undefined') ? MOCK_AGENCIES.find(a => a.name === s.agency) : null;
    const latestEnrollment = Array.isArray(s.enrollments) && s.enrollments.length ? s.enrollments[0] : null;
    const remittanceRoute = s.remittanceRoute || latestEnrollment?.remittanceRoute || (s.agency ? 'agency' : 'direct');
    const remittanceRouteLabel = typeof getRemittanceRouteLabel === 'function'
      ? getRemittanceRouteLabel(remittanceRoute)
      : ({ agency: '에이전시', direct: '직접 송금', onsite: '현장 결제' }[remittanceRoute] || '-');
    const payment = getStudentPaymentSummary(s);
    const billingItems = getStudentPopupBilling(s);
    const billingByKey = Object.fromEntries(billingItems.map(item => [item.key, item]));
    const renderBillingCell = key => {
      const item = billingByKey[key] || { amount: 0, status: 'unpaid' };
      const isPaid = item.status === 'paid';
      return `
        <td style="white-space:nowrap;text-align:right">
          <div style="font-size:12px;font-weight:800;color:#111827">$${Number(item.amount || 0).toLocaleString()}</div>
          <span style="display:inline-flex;align-items:center;margin-top:3px;padding:2px 7px;border-radius:999px;font-size:9.5px;font-weight:700;color:${isPaid ? '#047857' : '#DC2626'};background:${isPaid ? '#D1FAE5' : '#FEE2E2'}">${isPaid ? '완납' : '미납'}</span>
        </td>`;
    };

    let mentorName = '미배정';
    const mentorMatch = (typeof MOCK_TIMETABLE !== 'undefined') ? MOCK_TIMETABLE.find(t => t.slots.some(slot => slot.student === s.nick)) : null;
    if (mentorMatch) mentorName = mentorMatch.teacher;

    return `<tr>
      <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${rowNum}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <img class="tsa-avatar" src="${avatarSrc}" style="width:34px;height:34px;object-fit:cover;border-radius:50%;border:1px solid #E5E7EB;" alt="${s.nick}"/>
          <div>
            <div style="font-weight:700;font-size:13px;color:#1A1D23">${s.nick} (${s.name})</div>
            <div style="font-size:11px;color:#6B7280">${s.flag} ${s.nationality} · ${s.gender}성 ${s.age}세</div>
            <div style="font-size:10.5px;color:#9CA3AF;margin-top:1px">여권: ${maskPassportNumber(s.passportNum)}</div>
          </div>
        </div>
      </td>
      <td style="font-size:11.5px;white-space:nowrap">
        <div style="font-weight:600;color:#374151">${s.agency || '-'}</div>
        ${agencyInfo ? `<div style="color:#9CA3AF;font-size:10.5px;margin-top:1px">${agencyInfo.contact} · ${agencyInfo.phone}</div>` : ''}
      </td>
      <td style="font-size:11.5px;font-weight:600;color:#374151">${mentorName}</td>
      <td><span style="color:#5E5CE6;font-weight:600;font-size:11.5px">${s.level || '-'}</span></td>
      <td style="font-size:11.5px;white-space:nowrap">
        <div style="font-size:12px;font-weight:600;color:#374151">${s.course}</div>
        <div style="color:#9CA3AF;font-size:10.5px">${s.startDate ? s.startDate.replace('2026-','26.').replace(/-/g,'.') : '-'} ~ ${s.endDate ? s.endDate.replace('2026-','26.').replace(/-/g,'.') : '-'}${(() => {
          const weeks = (s.startDate && s.endDate) ? Math.max(1, Math.round((new Date(s.endDate) - new Date(s.startDate)) / (7 * 86400000))) : (s.duration || null);
          return weeks ? ` (${weeks}주)` : '';
        })()}</div>
      </td>
      <td style="font-size:11.5px;white-space:nowrap">
        ${isStudentWalkIn(s)
          ? `<div style="font-weight:600;color:#D97706">Walk-in</div>`
          : `<div style="font-weight:600;color:#374151">${s.dorm || '미배정'}</div>
             ${s.dormIn ? `<div style="color:#9CA3AF;font-size:10.5px;margin-top:2px">${s.dormIn.replace('2026-','26.').replace(/-/g,'.')} ~ ${s.dormOut ? s.dormOut.replace('2026-','26.').replace(/-/g,'.') : '-'}</div>` : ''}`}
      </td>
      <td>
        <div style="font-weight:700;color:${attColor};font-size:13px">${s.attendance}%</div>
        <div class="tsa-progress" style="width:80px">
          <div class="tsa-progress-bar" style="width:${s.attendance}%;background:${attColor}"></div>
        </div>
        ${s.warning > 0 ? `<div style="font-size:10px;color:#EF4444;margin-top:2px">경고 ${s.warning}회</div>` : ''}
      </td>
      <td style="font-size:11.5px;white-space:nowrap">
        <span style="display:inline-flex;align-items:center;padding:4px 9px;border-radius:999px;font-weight:700;color:#4338CA;background:#EEF2FF">${remittanceRouteLabel}</span>
      </td>
      ${renderBillingCell('registration')}
      ${renderBillingCell('education')}
      ${renderBillingCell('dorm')}
      ${renderBillingCell('local')}
      <td>
        ${statusPill}
      </td>
      <td style="text-align:center">
        <div style="display:flex;gap:6px;justify-content:center;align-items:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openStudentDetail(${s.id})" style="border-color:#5E5CE6;color:#5E5CE6">
            <i data-lucide="pencil" style="font-size:11px"></i> 상세/수정
          </button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openStudentCourseRegistration(${s.id})" style="border-color:#16A34A;color:#16A34A">
            <i data-lucide="plus-square" style="font-size:11px"></i> 코스 등록
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
  if (typeof refreshIcons === 'function') {
    setTimeout(refreshIcons, 30);
    setTimeout(refreshIcons, 200);
  }
}

function filterStudentList(filter) {
  APP.activeStudentFilter = filter;
  applyStudentFilters();
}

function applyStudentFilters() {
  renderAdminStatusCards();
  const g = id => (document.getElementById(id)?.value || '');

  const q           = g('student-search').toLowerCase();
  const sfCourse    = g('sf-course');
  const sfNationality = g('sf-nationality');
  const sfAgency    = g('sf-agency');
  const sfDorm      = g('sf-dorm');
  const sfStartFrom = g('sf-start-from');
  const sfStartTo   = g('sf-start-to');
  const sfArrFrom   = g('sf-arrival-from');
  const sfArrTo     = g('sf-arrival-to');

  // 납부 현황 체크박스
  const checkedPaid = [...document.querySelectorAll('.sf-paid-cb:checked')].map(el => el.value);

  let list = [...MOCK_STUDENTS];

  // 등록 상태 — 카드 탭 기준
  const activeStatus = APP._adminStatusFilter || 'all';
  if (activeStatus !== 'all') {
    if (activeStatus === 'current') {
      list = list.filter(s => s.status === 'current' || s.status === 'extended');
    } else {
      list = list.filter(s => s.status === activeStatus);
    }
  }

  // 납부 현황 (체크박스)
  const normPaid = s => s.remittanceStatus || 'unpaid';
  if (checkedPaid.length > 0 && checkedPaid.length < 2) {
    list = list.filter(s => checkedPaid.includes(normPaid(s)));
  }

  // 키워드 검색
  if (q) list = list.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.nick.toLowerCase().includes(q) ||
    s.nationality.toLowerCase().includes(q) ||
    s.agency.toLowerCase().includes(q) ||
    (s.passportNum || '').toLowerCase().includes(q) ||
    (s.dorm || '').toLowerCase().includes(q) ||
    (s.flightInfo || '').toLowerCase().includes(q)
  );

  // 코스 유형
  if (sfCourse) list = list.filter(s => s.course === sfCourse);

  // 국적
  if (sfNationality) list = list.filter(s => s.nationality === sfNationality);

  // 에이전시
  if (sfAgency) list = list.filter(s => s.agency === sfAgency);

  // 기숙사 배정
  if (sfDorm === 'assigned')   list = list.filter(s => s.dorm && s.dorm !== '미배정');
  else if (sfDorm === 'unassigned') list = list.filter(s => !s.dorm || s.dorm === '미배정');

  // 수강 시작일 범위
  if (sfStartFrom || sfStartTo) {
    list = list.filter(s => {
      if (!s.startDate) return false;
      const sd = new Date(s.startDate);
      if (sfStartFrom && sd < new Date(sfStartFrom)) return false;
      if (sfStartTo   && sd > new Date(sfStartTo))   return false;
      return true;
    });
  }

  // 입국일 범위
  if (sfArrFrom || sfArrTo) {
    list = list.filter(s => {
      if (!s.arrivalDate) return false;
      const ad = new Date(s.arrivalDate);
      if (sfArrFrom && ad < new Date(sfArrFrom)) return false;
      if (sfArrTo   && ad > new Date(sfArrTo))   return false;
      return true;
    });
  }

  renderStudentList(list);
}

// KPI 카드 클릭 시 해당 필터 적용 후 학생 목록으로 이동
function navigateStudentsKpi(type) {
  navigate('students');
  setTimeout(() => {
    resetStudentFilters();
    const todayStr = '2026-06-17';
    const today = new Date(todayStr);

    if (type === 'active') {
      setAdminStatusCard(null, 'current');

    } else if (type === 'waiting') {
      setAdminStatusCard(null, 'waiting');

    } else if (type === 'arrivals') {
      setAdminStatusCard(null, 'all');
      document.getElementById('sf-arrival-from').value = todayStr;
      document.getElementById('sf-arrival-to').value = todayStr;

    } else if (type === 'newweek') {
      setAdminStatusCard(null, 'all');
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const fmt = d => d.toISOString().slice(0, 10);
      document.getElementById('sf-start-from').value = fmt(monday);
      document.getElementById('sf-start-to').value = fmt(sunday);
    }

    applyStudentFilters();
  }, 200);
}

function resetStudentFilters() {
  ['sf-course','sf-nationality','sf-agency','sf-dorm',
   'sf-start-from','sf-start-to','sf-arrival-from','sf-arrival-to','student-search'
  ].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });

  document.querySelectorAll('.sf-paid-cb').forEach(cb => { cb.checked = true; });

  setAdminStatusCard(null, 'all');
}

function setAdminStatusCard(elOrStatus, status) {
  // HTML에서 setAdminStatusCard('all') 형태로 호출될 때를 처리
  if (status === undefined) { status = elOrStatus; }
  APP._adminStatusFilter = status;
  const colors = { all:'#374151', current:'#5E5CE6', waiting:'#D97706', completed:'#6B7280', resigned:'#EF4444', extended:'#8B5CF6' };
  ['all','current','waiting','completed','resigned','extended'].forEach(s => {
    const card = document.getElementById(`adsc-${s}`);
    if (!card) return;
    card.style.borderColor = s === status ? (colors[s] || '#5E5CE6') : 'transparent';
  });
  applyStudentFilters();
}

function renderAdminStatusCards() {
  const counts = {
    all: MOCK_STUDENTS.length,
    current:   MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'extended').length,
    waiting:   MOCK_STUDENTS.filter(s => s.status === 'waiting').length,
    completed: MOCK_STUDENTS.filter(s => s.status === 'completed').length,
    resigned:  MOCK_STUDENTS.filter(s => s.status === 'resigned').length,
    extended:  MOCK_STUDENTS.filter(s => s.status === 'extended').length,
  };
  ['all','current','waiting','completed','resigned','extended'].forEach(s => {
    const el = document.getElementById(`adsc-count-${s}`);
    if (el) el.textContent = counts[s];
  });
}

function openStudentDetail(id) {
  APP.currentStudent = MOCK_STUDENTS.find(s => s.id === id);
  if (!APP.currentStudent) return;
  openStudentDetailPopup(id, 'admin');
}

function escapeStudentPopupHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getStudentPopupWeeks(student) {
  const start = student.startDate ? new Date(student.startDate) : null;
  const endValue = student.endDate || student.courseEndDate || '';
  const end = endValue ? new Date(endValue) : null;
  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end > start) {
    return Math.max(1, Math.round((end.getTime() - start.getTime()) / (7 * 86400000)));
  }
  return Math.max(1, parseInt(student.duration, 10) || 1);
}

function isStudentWalkIn(student) {
  const dorm = String(student.dorm || '').trim().toLowerCase();
  return student.dormRequested === false || !dorm || ['미사용', '미신청', 'walk-in', 'walk in'].includes(dorm);
}

function getStudentPopupBilling(student) {
  let items = [];
  if (typeof getStudentBillingBreakdown === 'function') {
    items = getStudentBillingBreakdown(student).items.map(item => ({
      key: item.key,
      label: item.label,
      amount: Number(item.amount || 0),
      status: item.paymentStatus || 'unpaid',
    }));
  } else {
    const prices = typeof calculatePrices === 'function'
      ? calculatePrices(student)
      : { registration: 0, tuition: 0, dorm: 0 };
    const fees = Array.isArray(student.fees) ? student.fees : [];
    const registration = fees.filter(f => /등록|Registration/i.test(f.item || '')).reduce((sum, f) => sum + Number(f.amount || 0), 0);
    const other = fees.filter(f => !/등록|Registration/i.test(f.item || '')).reduce((sum, f) => sum + Number(f.amount || 0), 0);
    items = [
      { key: 'registration', label: '등록금', amount: registration || Number(prices.registration || 0), status: student.remittanceStatus || 'unpaid' },
      { key: 'education', label: '수강료', amount: Number(prices.tuition || 0), status: student.remittanceStatus || 'unpaid' },
      { key: 'dorm', label: '기숙사비', amount: Number(prices.dorm || 0), status: student.remittanceStatus || 'unpaid' },
      { key: 'local', label: '기타 비용', amount: other, status: student.remittanceStatus || 'unpaid' },
    ];
  }
  if (isStudentWalkIn(student)) {
    items = items.map(item => item.key === 'dorm' ? { ...item, amount: 0 } : item);
  }
  return items;
}

function getStudentConsultationNotes(student) {
  const key = `tsa_student_consultation_notes_${student.id}`;
  let saved = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(parsed)) saved = parsed;
  } catch (error) {
    saved = [];
  }
  const sourceNotes = saved.length ? saved : (Array.isArray(student.consultationNotes) ? student.consultationNotes : []);
  const notes = sourceNotes.map((note, index) => ({
    ...note,
    id: note.id ?? `legacy-${student.id}-${index}`,
  }));
  student.consultationNotes = notes;
  return notes;
}

function getStudentPopupCounselorName() {
  const names = {
    admin: '슈퍼 어드민',
    super_admin: '슈퍼 어드민',
    agency_head: '에이전시 본사',
    agency_branch: '에이전시 지사',
  };
  return names[APP.user] || '상담 담당자';
}

function addStudentConsultationNote(studentId, popupWindow) {
  const student = MOCK_STUDENTS.find(item => item.id === studentId);
  const doc = popupWindow?.document;
  if (!student || !doc) return;
  const counselor = doc.getElementById('student-consult-counselor')?.value.trim() || '';
  const consultedAt = doc.getElementById('student-consult-datetime')?.value || '';
  const content = doc.getElementById('student-consult-content')?.value.trim() || '';
  if (!counselor || !consultedAt || !content) {
    popupWindow.alert('상담자, 상담 일시, 상담 내용을 모두 입력해줘.');
    return;
  }
  const notes = getStudentConsultationNotes(student);
  notes.unshift({ id: Date.now(), counselor, consultedAt, content });
  student.consultationNotes = notes;
  localStorage.setItem(`tsa_student_consultation_notes_${student.id}`, JSON.stringify(notes));
  const consultationContainer = doc.getElementById('adetail-page-enrollment-content');
  if (consultationContainer) {
    renderStudentConsultationTab(student, consultationContainer);
  } else {
    renderStudentDetailPopup(student, popupWindow.__tsaPortal || 'admin', popupWindow);
  }
  if (typeof showToast === 'function') showToast('상담 노트가 저장되었습니다.', 'success');
}

function parseStudentActivityTimestamp(value) {
  const normalized = String(value || '').trim().replace(' ', 'T');
  const timestamp = new Date(normalized).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatStudentActivityDate(value) {
  const text = String(value || '').trim();
  return text ? text.replace('T', ' ') : '-';
}

function getStudentActivityItems(student) {
  const consultationItems = getStudentConsultationNotes(student).map(note => ({
    type: 'consultation',
    timestamp: note.consultedAt || '',
    note,
  }));
  const changeItems = (Array.isArray(student.changeRequests) ? student.changeRequests : []).map((change, sourceIndex) => ({
    type: 'change',
    timestamp: change.requestDate || change.changedAt || change.updatedAt || '',
    change,
    sourceIndex,
  }));
  return [...consultationItems, ...changeItems]
    .sort((a, b) => parseStudentActivityTimestamp(b.timestamp) - parseStudentActivityTimestamp(a.timestamp));
}

function setStudentActivityFilter(studentId, filter) {
  const student = MOCK_STUDENTS.find(item => item.id === studentId);
  if (!student) return;
  student._activityFilter = ['all', 'consultation', 'change'].includes(filter) ? filter : 'all';
  const container = document.getElementById('adetail-page-enrollment-content');
  if (container) renderStudentConsultationTab(student, container);
}

function openStudentDetailPopup(id, portal) {
  const student = MOCK_STUDENTS.find(item => item.id === id);
  if (!student) return;
  APP.currentStudent = student;
  const popupUrl = new URL(window.location.href);
  popupUrl.search = '';
  popupUrl.hash = '';
  popupUrl.searchParams.set('studentPopup', String(id));
  popupUrl.searchParams.set('portal', portal || ((APP.user === 'agency_head' || APP.user === 'agency_branch') ? 'agency' : 'admin'));
  const popup = window.open(popupUrl.toString(), `tsa-student-${id}`, 'popup=yes,width=1420,height=960,resizable=yes,scrollbars=yes');
  if (!popup) {
    if (typeof showToast === 'function') showToast('팝업이 차단되었습니다. 브라우저에서 팝업을 허용해줘.', 'warning');
    return;
  }
  popup.focus();
}

function renderStudentConsultationTab(student, container) {
  if (!student || !container) return;
  const esc = escapeStudentPopupHtml;
  const notes = getStudentConsultationNotes(student);
  const changes = Array.isArray(student.changeRequests) ? student.changeRequests : [];
  const activities = getStudentActivityItems(student);
  const activeFilter = ['all', 'consultation', 'change'].includes(student._activityFilter) ? student._activityFilter : 'all';
  const filteredActivities = activeFilter === 'all' ? activities : activities.filter(item => item.type === activeFilter);
  const filterOptions = [
    { key: 'all', label: '전체', count: activities.length },
    { key: 'consultation', label: '상담', count: notes.length },
    { key: 'change', label: '정보 변경', count: changes.length },
  ];
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="border:1px solid #C7D2FE;background:#F8F9FF;border-radius:12px;padding:16px">
        <div style="font-size:13px;font-weight:800;color:#312E81;margin-bottom:4px">상담 노트 등록</div>
        <div style="font-size:10.5px;color:#6B7280;margin-bottom:13px">상담자, 상담 일시, 상담 내용과 후속 조치 사항을 기록합니다.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div><label class="tsa-label">상담자</label><input id="student-consult-counselor" class="tsa-input" value="${esc(getStudentPopupCounselorName())}"/></div>
          <div><label class="tsa-label">상담 일시</label><input id="student-consult-datetime" type="datetime-local" class="tsa-input" value="${now}"/></div>
        </div>
        <div style="margin-top:10px"><label class="tsa-label">상담 내용</label><textarea id="student-consult-content" class="tsa-input" rows="4" placeholder="상담 내용과 후속 조치 사항을 입력해 주세요."></textarea></div>
        <div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="tsa-btn tsa-btn-primary" onclick="addStudentConsultationNote(${student.id},window)"><i data-lucide="save"></i> 상담 노트 저장</button></div>
      </div>
      <div style="border:1px solid #E5E7EB;border-radius:12px;padding:16px;background:#fff">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">
          <div><div style="font-size:13px;font-weight:800;color:#111827">상담 노트</div><div style="font-size:10.5px;color:#6B7280;margin-top:4px">상담 기록과 시스템 정보 변경 기록을 시간순으로 확인합니다.</div></div>
          <span class="tsa-badge tsa-badge-primary">${filteredActivities.length}건</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${filterOptions.map(option => {
            const selected = option.key === activeFilter;
            return `<button type="button" onclick="setStudentActivityFilter(${student.id},'${option.key}')" style="border:1px solid ${selected ? '#6366F1' : '#E5E7EB'};background:${selected ? '#EEF2FF' : '#fff'};color:${selected ? '#4F46E5' : '#6B7280'};border-radius:999px;padding:6px 10px;font:inherit;font-size:10.5px;font-weight:800;cursor:pointer">${option.label} ${option.count}</button>`;
          }).join('')}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${filteredActivities.length ? filteredActivities.map(item => {
            if (item.type === 'consultation') {
              const note = item.note;
              return `
                <div style="border-left:3px solid #818CF8;background:#F8FAFC;border-radius:8px;padding:12px 14px">
                  <div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div style="display:flex;align-items:center;gap:7px"><span style="display:inline-flex;align-items:center;border-radius:999px;background:#EEF2FF;color:#4F46E5;padding:3px 7px;font-size:9.5px;font-weight:800">상담</span><strong style="font-size:12px;color:#1F2937">${esc(note.counselor)}</strong></div><span style="font-size:10.5px;color:#9CA3AF">${esc(formatStudentActivityDate(note.consultedAt))}</span></div>
                  <div style="font-size:12px;color:#374151;line-height:1.65;margin-top:7px;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(note.content)}</div>
                  <div style="display:flex;justify-content:flex-end;margin-top:9px"><button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openStudentConsultationNoteDetail(${student.id},'${esc(note.id)}')"><i data-lucide="expand"></i> 자세히 보기</button></div>
                </div>`;
            }
            const change = item.change;
            return `
              <div style="border-left:3px solid #F59E0B;background:#FFFBEB;border-radius:8px;padding:12px 14px">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:12px"><div style="display:flex;align-items:center;gap:7px"><span style="display:inline-flex;align-items:center;border-radius:999px;background:#FEF3C7;color:#B45309;padding:3px 7px;font-size:9.5px;font-weight:800">정보 변경</span><strong style="font-size:12px;color:#1F2937">${esc(change.changedBy || '시스템')}</strong></div><span style="font-size:10.5px;color:#9CA3AF">${esc(formatStudentActivityDate(item.timestamp))}</span></div>
                <div style="font-size:12px;font-weight:800;color:#374151;line-height:1.6;margin-top:7px;overflow-wrap:anywhere">${esc(change.field || '학생 정보')} : ${esc(change.from || '-')} → ${esc(change.to || '-')}</div>
                ${change.reason ? `<div style="font-size:11px;color:#6B7280;line-height:1.6;margin-top:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(change.reason)}</div>` : ''}
                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px"><span style="font-size:9.5px;color:#9CA3AF">시스템 기록 · 수정/삭제 불가</span><button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openStudentChangeHistoryDetail(${student.id},${item.sourceIndex})"><i data-lucide="expand"></i> 자세히 보기</button></div>
              </div>`;
          }).join('') : `<div style="padding:30px;text-align:center;border:1px dashed #D1D5DB;border-radius:10px;color:#9CA3AF;font-size:12px">${activeFilter === 'consultation' ? '등록된 상담 기록이 없습니다.' : activeFilter === 'change' ? '등록된 정보 변경 기록이 없습니다.' : '등록된 활동 기록이 없습니다.'}</div>`}
        </div>
      </div>
    </div>`;
  if (typeof refreshIcons === 'function') refreshIcons();
}

function openStudentConsultationNoteDetail(studentId, noteId) {
  const student = MOCK_STUDENTS.find(item => item.id === studentId);
  if (!student) return;
  const note = getStudentConsultationNotes(student).find(item => String(item.id) === String(noteId));
  if (!note) {
    if (typeof showToast === 'function') showToast('상담 기록을 찾을 수 없습니다.', 'warning');
    return;
  }
  const esc = escapeStudentPopupHtml;
  let modal = document.getElementById('student-consultation-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-consultation-detail-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2500;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:24px';
    modal.addEventListener('click', event => {
      if (event.target === modal) closeStudentConsultationNoteDetail();
    });
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="width:min(760px,100%);max-height:88vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden" onclick="event.stopPropagation()">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid #E5E7EB">
        <div><div style="font-size:16px;font-weight:900;color:#111827">상담 내용 상세</div><div style="font-size:11px;color:#6B7280;margin-top:5px">${esc(student.name)} · Nick: ${esc(student.nick || '-')}</div></div>
        <button class="tsa-modal-close" onclick="closeStudentConsultationNoteDetail()"><i data-lucide="x"></i></button>
      </div>
      <div style="padding:18px 22px;overflow-y:auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="padding:11px 12px;background:#F8FAFC;border-radius:9px"><div style="font-size:10px;color:#9CA3AF">상담자</div><div style="font-size:12.5px;font-weight:800;color:#1F2937;margin-top:4px">${esc(note.counselor || '-')}</div></div>
          <div style="padding:11px 12px;background:#F8FAFC;border-radius:9px"><div style="font-size:10px;color:#9CA3AF">상담 일시</div><div style="font-size:12.5px;font-weight:800;color:#1F2937;margin-top:4px">${esc(String(note.consultedAt || '-').replace('T',' '))}</div></div>
        </div>
        <div style="font-size:11px;font-weight:800;color:#374151;margin-bottom:7px">전체 상담 내용</div>
        <div style="min-height:220px;padding:16px;border:1px solid #E5E7EB;border-radius:11px;background:#FCFCFD;font-size:13px;color:#1F2937;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere">${esc(note.content || '')}</div>
      </div>
      <div style="display:flex;justify-content:flex-end;padding:14px 22px;border-top:1px solid #E5E7EB;background:#F8FAFC"><button class="tsa-btn tsa-btn-primary" onclick="closeStudentConsultationNoteDetail()">확인</button></div>
    </div>`;
  modal.style.display = 'flex';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeStudentConsultationNoteDetail() {
  const modal = document.getElementById('student-consultation-detail-modal');
  if (modal) modal.style.display = 'none';
}

function openStudentChangeHistoryDetail(studentId, changeIndex) {
  const student = MOCK_STUDENTS.find(item => item.id === studentId);
  const change = student && Array.isArray(student.changeRequests) ? student.changeRequests[changeIndex] : null;
  if (!student || !change) {
    if (typeof showToast === 'function') showToast('정보 변경 기록을 찾을 수 없습니다.', 'warning');
    return;
  }
  const esc = escapeStudentPopupHtml;
  const changedAt = change.requestDate || change.changedAt || change.updatedAt || '-';
  let modal = document.getElementById('student-change-detail-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-change-detail-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2500;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:24px';
    modal.addEventListener('click', event => {
      if (event.target === modal) closeStudentChangeHistoryDetail();
    });
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div style="width:min(760px,100%);max-height:88vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden" onclick="event.stopPropagation()">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid #E5E7EB">
        <div><div style="font-size:16px;font-weight:900;color:#111827">정보 변경 기록 상세</div><div style="font-size:11px;color:#6B7280;margin-top:5px">${esc(student.name)} · 시스템 자동 기록</div></div>
        <button class="tsa-modal-close" onclick="closeStudentChangeHistoryDetail()"><i data-lucide="x"></i></button>
      </div>
      <div style="padding:18px 22px;overflow-y:auto">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
          <div style="padding:11px 12px;background:#F8FAFC;border-radius:9px"><div style="font-size:10px;color:#9CA3AF">변경 항목</div><div style="font-size:12.5px;font-weight:800;color:#1F2937;margin-top:4px">${esc(change.field || '-')}</div></div>
          <div style="padding:11px 12px;background:#F8FAFC;border-radius:9px"><div style="font-size:10px;color:#9CA3AF">변경 일시</div><div style="font-size:12.5px;font-weight:800;color:#1F2937;margin-top:4px">${esc(formatStudentActivityDate(changedAt))}</div></div>
          <div style="padding:11px 12px;background:#FFF7ED;border-radius:9px"><div style="font-size:10px;color:#9CA3AF">변경 전</div><div style="font-size:12.5px;font-weight:800;color:#9A3412;margin-top:4px;overflow-wrap:anywhere">${esc(change.from || '-')}</div></div>
          <div style="padding:11px 12px;background:#ECFDF5;border-radius:9px"><div style="font-size:10px;color:#9CA3AF">변경 후</div><div style="font-size:12.5px;font-weight:800;color:#047857;margin-top:4px;overflow-wrap:anywhere">${esc(change.to || '-')}</div></div>
        </div>
        <div style="font-size:11px;font-weight:800;color:#374151;margin-bottom:7px">변경 사유</div>
        <div style="min-height:120px;padding:16px;border:1px solid #E5E7EB;border-radius:11px;background:#FCFCFD;font-size:13px;color:#1F2937;line-height:1.8;white-space:pre-wrap;overflow-wrap:anywhere">${esc(change.reason || '기록된 변경 사유가 없습니다.')}</div>
        <div style="margin-top:12px;padding:10px 12px;border-radius:9px;background:#FFFBEB;color:#92400E;font-size:10.5px;line-height:1.6">변경자: <b>${esc(change.changedBy || '시스템')}</b> · 이 기록은 시스템 감사 이력으로 수정하거나 삭제할 수 없습니다.</div>
      </div>
      <div style="display:flex;justify-content:flex-end;padding:14px 22px;border-top:1px solid #E5E7EB;background:#F8FAFC"><button class="tsa-btn tsa-btn-primary" onclick="closeStudentChangeHistoryDetail()">확인</button></div>
    </div>`;
  modal.style.display = 'flex';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeStudentChangeHistoryDetail() {
  const modal = document.getElementById('student-change-detail-modal');
  if (modal) modal.style.display = 'none';
}

function renderStudentDetailPopup(student, portal, popup) {
  if (!popup || popup.closed) return;
  const esc = escapeStudentPopupHtml;
  const weeks = getStudentPopupWeeks(student);
  const walkIn = isStudentWalkIn(student);
  const billingItems = getStudentPopupBilling(student);
  const total = billingItems.reduce((sum, item) => sum + item.amount, 0);
  const notes = getStudentConsultationNotes(student);
  const avatarUrl = new URL(student.gender === '여' ? 'assets/images/student_female.png' : 'assets/images/student_male.png', window.location.href).href;
  const now = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const courseEnd = student.endDate || student.courseEndDate || '-';
  const statusLabels = { current: '재학', waiting: '입학 대기', completed: '졸업', resigned: '퇴원', extended: '연장' };
  const feeColors = {
    registration: ['#EEF2FF', '#4F46E5'],
    education: ['#ECFDF5', '#047857'],
    dorm: ['#FFF7ED', '#C2410C'],
    local: ['#F5F3FF', '#7C3AED'],
  };

  popup.document.open();
  popup.document.write(`<!doctype html>
  <html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(student.name)} 학생 정보</title>
  <style>
    *{box-sizing:border-box}body{margin:0;background:#F5F7FB;color:#111827;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif}.header{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #E5E7EB;padding:16px 24px;display:flex;align-items:center;justify-content:space-between}.wrap{max-width:1180px;margin:0 auto;padding:22px}.card{background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:18px;box-shadow:0 3px 12px rgba(15,23,42,.04)}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px}.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.label{font-size:11px;color:#64748B;margin-bottom:5px}.value{font-size:13px;font-weight:750;color:#1F2937}.badge{display:inline-flex;padding:4px 9px;border-radius:999px;background:#EEF2FF;color:#4F46E5;font-size:11px;font-weight:800}.fees{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.fee{border-radius:12px;padding:15px;border:1px solid transparent}.fee-name{font-size:11px;font-weight:800}.fee-amount{font-size:22px;font-weight:900;margin-top:8px}.input{width:100%;border:1px solid #D7DCE5;border-radius:8px;padding:10px 11px;font:inherit;font-size:12px;background:#fff}.btn{border:0;border-radius:8px;padding:10px 15px;font-weight:800;cursor:pointer}.btn-primary{background:#5E5CE6;color:#fff}.btn-light{background:#F3F4F6;color:#374151}.note{border-left:3px solid #818CF8;background:#F8FAFC;border-radius:8px;padding:12px 14px}.section-title{font-size:15px;font-weight:900;margin-bottom:13px}.muted{font-size:11px;color:#6B7280}.profile{display:flex;gap:16px;align-items:center}@media(max-width:850px){.grid2,.fees,.info-grid{grid-template-columns:1fr 1fr}}@media(max-width:560px){.grid2,.fees,.info-grid{grid-template-columns:1fr}.wrap{padding:12px}}
  </style></head><body>
    <header class="header">
      <div><div style="font-size:19px;font-weight:900">학생 정보</div><div class="muted" style="margin-top:4px">사이드 메뉴 없는 독립 팝업 · 다른 학생 정보와 동시에 열람 가능</div></div>
      <div style="display:flex;gap:8px"><button class="btn btn-light" onclick="window.print()">인쇄</button><button class="btn btn-light" onclick="window.close()">닫기</button></div>
    </header>
    <main class="wrap">
      <section class="card profile">
        <img src="${avatarUrl}" alt="학생 사진" style="width:78px;height:78px;border-radius:14px;object-fit:cover;border:1px solid #E5E7EB">
        <div style="flex:1"><div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><h1 style="font-size:21px;margin:0">${esc(student.name)}</h1><span class="badge">${esc(statusLabels[student.status] || student.status || '-')}</span></div><div style="font-size:13px;color:#4F46E5;font-weight:800;margin-top:5px">Nick: ${esc(student.nick || '-')}</div><div class="muted" style="margin-top:7px">${esc(student.nationality || '-')} · ${esc(student.gender || '-')} · ${esc(student.age ? `${student.age}세` : '-')} · ${esc(student.agency || '직접 등록')}</div></div>
      </section>

      <div class="grid2" style="margin-top:14px">
        <section class="card"><div class="section-title">기본 정보</div><div class="info-grid"><div><div class="label">연락처</div><div class="value">${esc(student.phone || '-')}</div></div><div><div class="label">이메일</div><div class="value">${esc(student.email || '-')}</div></div><div><div class="label">여권번호</div><div class="value">***</div></div><div><div class="label">비상 연락처</div><div class="value">${esc(student.emergencyContact || '-')}</div></div><div><div class="label">입국 항공편</div><div class="value">${esc(student.flightNum || student.flightInfo || '-')}</div></div><div><div class="label">입국 예정일</div><div class="value">${esc(student.arrivalDate || '-')} ${esc(student.flightTime || '')}</div></div></div></section>
        <section class="card"><div class="section-title">수강 및 기숙사 정보</div><div class="info-grid"><div><div class="label">수강 과정</div><div class="value">${esc(student.course || '-')}</div></div><div><div class="label">수강 기간</div><div class="value" style="color:#4F46E5">${weeks}주</div></div><div><div class="label">수강 일정</div><div class="value">${esc(student.startDate || '-')} ~ ${esc(courseEnd)}</div></div><div><div class="label">추천 레벨</div><div class="value">${esc(student.level || '-')}</div></div><div style="grid-column:span 2"><div class="label">기숙사</div><div class="value" style="color:${walkIn ? '#D97706' : '#047857'}">${walkIn ? 'Walk-in' : esc(student.dorm || '미배정')}</div></div></div></section>
      </div>

      <section class="card" style="margin-top:14px"><div style="display:flex;justify-content:space-between;align-items:end;margin-bottom:13px"><div><div class="section-title" style="margin:0">금액 정보</div><div class="muted" style="margin-top:4px">등록금·수강료·기숙사비·기타 비용을 구분하여 표시합니다.</div></div><div style="font-size:13px;font-weight:800">총 청구액 <span style="font-size:21px;color:#4F46E5;margin-left:8px">$${total.toLocaleString()}</span></div></div><div class="fees">${billingItems.map(item => { const color = feeColors[item.key] || ['#F8FAFC','#334155']; return `<div class="fee" style="background:${color[0]};border-color:${color[1]}22"><div class="fee-name" style="color:${color[1]}">${esc(item.label)}</div><div class="fee-amount" style="color:${color[1]}">$${item.amount.toLocaleString()}</div><div class="muted" style="margin-top:5px">${item.status === 'paid' ? '완납' : '미납'}</div></div>`; }).join('')}</div></section>

      <section class="card" style="margin-top:14px"><div class="section-title">상담 노트 등록</div><div class="grid2"><div><div class="label">상담자</div><input id="student-consult-counselor" class="input" value="${esc(getStudentPopupCounselorName())}"></div><div><div class="label">상담 일시</div><input id="student-consult-datetime" type="datetime-local" class="input" value="${now}"></div></div><div style="margin-top:10px"><div class="label">상담 내용</div><textarea id="student-consult-content" class="input" rows="4" placeholder="상담 내용과 후속 조치 사항을 기록해줘."></textarea></div><div style="text-align:right;margin-top:10px"><button class="btn btn-primary" onclick="window.opener.addStudentConsultationNote(${student.id},window)">상담 노트 저장</button></div></section>

      <section class="card" style="margin:14px 0 30px"><div style="display:flex;align-items:center;justify-content:space-between"><div class="section-title" style="margin:0">상담 히스토리</div><span class="badge">${notes.length}건</span></div><div style="display:flex;flex-direction:column;gap:9px;margin-top:13px">${notes.length ? notes.map(note => `<article class="note"><div style="display:flex;justify-content:space-between;gap:12px"><strong style="font-size:12px">${esc(note.counselor)}</strong><span class="muted">${esc(String(note.consultedAt || '').replace('T',' '))}</span></div><div style="font-size:12.5px;line-height:1.65;margin-top:7px;white-space:pre-wrap">${esc(note.content)}</div></article>`).join('') : '<div style="padding:24px;text-align:center;border:1px dashed #D1D5DB;border-radius:10px;color:#9CA3AF;font-size:12px">등록된 상담 기록이 없습니다.</div>'}</div></section>
    </main>
  </body></html>`);
  popup.document.close();
}

function switchStudentTab(tab, el) {
  if (el) {
    document.querySelectorAll('#student-detail-modal .tsa-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  const s = APP.currentStudent;
  const container = document.getElementById('student-modal-tab-content');
  if (!s || !container) return;

  switch (tab) {
    case 'basic': {
      const dobVal = s.dob || '';
      const ageDisplay = s.age ? `${s.age}세` : '-';
      const currentAvatarSrc = s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
      adProfilePhotoData = null;
      container.innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;padding:12px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px;margin-bottom:16px">
          <div id="ad-profile-photo-preview" style="width:76px;height:88px;border-radius:10px;overflow:hidden;border:1px solid #DDE3EC;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <img src="${currentAvatarSrc}" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>
          </div>
          <div style="flex:1">
            <div style="font-size:11.5px;font-weight:800;color:#374151;margin-bottom:4px">학생 증명사진</div>
            <div id="ad-profile-photo-name" style="font-size:10px;color:#9CA3AF;margin-bottom:8px">${s.profilePhoto ? '등록된 사진 있음' : '등록된 사진 없음'}</div>
            <button type="button" class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="document.getElementById('ad-profile-photo').click()"><i data-lucide="image-plus"></i> 사진 선택</button>
            <input id="ad-profile-photo" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="previewAdminStudentDetailPhoto(this)"/>
            <div style="font-size:9.5px;color:#9CA3AF;margin-top:6px">JPG, PNG, WEBP 이미지 등록 가능</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
            <div class="tsa-form-group">
              <label class="tsa-label">영문 성명 (여권명)</label>
              <input id="ad-name" type="text" class="tsa-input" value="${s.name}"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">영문 닉네임 (호칭)</label>
              <input id="ad-nickname" type="text" class="tsa-input" value="${s.nick}"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">성별</label>
              <select id="ad-gender" class="tsa-input">
                <option value="남" ${s.gender === '남' ? 'selected' : ''}>남성</option>
                <option value="여" ${s.gender === '여' ? 'selected' : ''}>여성</option>
              </select>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">생년월일 <span style="color:#6B7280;font-weight:400;font-size:11px">(만 ${ageDisplay})</span></label>
              <input id="ad-dob" type="date" class="tsa-input" value="${dobVal}"
                onchange="(function(){const d=new Date('2026-06-15')-new Date(this.value);document.getElementById('ad-age-display').textContent='만 '+Math.floor(d/(365.25*86400000))+'세'}).call(this)"/>
              <div id="ad-age-display" style="font-size:10.5px;color:#5E5CE6;margin-top:3px;font-weight:600">${dobVal ? '만 '+ageDisplay : ''}</div>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">국적</label>
              <select id="ad-nationality" class="tsa-input">
                <option value="한국" ${s.nationality==='한국'?'selected':''}>한국 🇰🇷</option>
                <option value="일본" ${s.nationality==='일본'?'selected':''}>일본 🇯🇵</option>
                <option value="중국" ${s.nationality==='중국'?'selected':''}>중국 🇨🇳</option>
                <option value="베트남" ${s.nationality==='베트남'?'selected':''}>베트남 🇻🇳</option>
                <option value="몽골" ${s.nationality==='몽골'?'selected':''}>몽골 🇲🇳</option>
              </select>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">연락처</label>
              <input id="ad-phone" type="text" class="tsa-input" value="${s.phone || ''}"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">이메일 주소</label>
              <input id="ad-email" type="email" class="tsa-input" value="${s.email || ''}" placeholder="student@example.com"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">비상 연락처</label>
              <input id="ad-emergency" type="text" class="tsa-input" value="${s.emergencyContact || ''}" placeholder="010-5678-1234 (부모)"/>
            </div>
          </div>
        </div>
        <div class="tsa-divider"></div>
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:16px">
          <div style="font-size:12.5px;font-weight:700;color:#92400E;margin-bottom:12px;display:flex;align-items:center;gap:6px">
            <i data-lucide="heart" style="font-size:16px;color:#D97706"></i> 건강 관리 및 식단 특이사항
          </div>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;align-items:start">
            <div>
              <label class="tsa-label" style="color:#92400E">식단 구분</label>
              <select id="ad-diet" class="tsa-input" style="border-color:#FDE68A">
                <option value="일반식" ${s.dietType==='일반식'?'selected':''}>일반식 (General)</option>
                <option value="채식" ${s.dietType==='채식'?'selected':''}>채식 (Vegetarian)</option>
                <option value="할랄" ${s.dietType==='할랄'?'selected':''}>할랄 (Halal)</option>
                <option value="글루텐 프리" ${s.dietType==='글루텐 프리'?'selected':''}>글루텐 프리 (Gluten-Free)</option>
              </select>
            </div>
            <div>
              <label class="tsa-label" style="color:#92400E">건강 정보 및 복약/알레르기 메모</label>
              <input id="ad-health-notes" type="text" class="tsa-input" style="border-color:#FDE68A" value="${s.healthNotes || ''}" placeholder="복약 시간대, 알레르기 유무 및 세부 정보를 입력하세요"/>
            </div>
          </div>
        </div>

        <!-- ── 항공 & 입출국 ── -->
        <div style="margin-top:16px">
          <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:12px;display:flex;align-items:center;gap:6px">✈️ 항공 & 입출국 일정</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px">
              <div style="font-size:11px;font-weight:700;color:#15803D;margin-bottom:8px">입국 항공편</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">편명</label><input id="ad-flight-num" type="text" class="tsa-input" value="${s.flightNum || ''}" placeholder="KE631"/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">입국일</label><input id="ad-arrival-date" type="date" class="tsa-input" value="${s.arrivalDate || ''}"/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">도착 시간</label><input id="ad-flight-time" type="time" class="tsa-input" value="${s.flightTime || ''}"/></div>
              </div>
            </div>
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px">
              <div style="font-size:11px;font-weight:700;color:#1D4ED8;margin-bottom:8px">출국 항공편</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">편명</label><input id="ad-flight-out-num" type="text" class="tsa-input" value="${s.flightOutNum || ''}" placeholder="KE632"/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">출국일</label><input id="ad-departure-date" type="date" class="tsa-input" value="${s.departureDate || ''}"/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">출발 시간</label><input id="ad-flight-out-time" type="time" class="tsa-input" value="${s.flightOutTime || ''}"/></div>
              </div>
            </div>
            <div style="background:#F8F9FC;border:1px solid #E9EDF4;border-radius:10px;padding:12px">
              <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px">🛂 여권 정보</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">여권 번호</label><input id="ad-passport-num" type="text" class="tsa-input" value="${s.passportNum || ''}" placeholder="M12345678"/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">여권 만료일</label><input id="ad-passport-expiry" type="date" class="tsa-input" value="${s.passportExpiry || ''}"/></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 서류 관리 ── -->
        <div style="margin-top:16px">
          <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:12px">📄 서류 관리</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
            ${renderFileCards(s, 'admin')}
          </div>
        </div>

        <!-- ── 비자 & SSP ── -->
        <div style="margin-top:16px">
          <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:12px">🪪 비자 & SSP</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="tsa-form-group"><label class="tsa-label">비자 만료 예정일</label><input id="ad-visa-expiry" type="date" class="tsa-input" value="${s.visaExpiry !== '면제' ? s.visaExpiry : ''}"/></div>
            <div class="tsa-form-group"><label class="tsa-label">SSP 카드 만료 예정일 (또는 면제)</label><input id="ad-ssp-expiry" type="text" class="tsa-input" value="${s.sspExpiry || '면제'}"/></div>
          </div>
        </div>
      `;
      break;
    }

    case 'flight':
    case 'docs':
    case 'visa':
      switchStudentTab('basic', null);
      break;

    case 'class':
    case 'settle':
      switchAdetailTab(tab, 'student-modal-tab-content', s.id);
      break;

    case 'dorm':
      renderStudentDormTab();
      break;

    case 'classlog':
      APP._classLogContainerId = 'student-modal-tab-content';
      APP._classLogDate = APP._classLogDate || '2026-06-16';
      renderStudentClassLogTab();
      break;

    case 'fees':
      renderFeesTab();
      break;

    case 'changelog':
      renderChangelogTab();
      break;
  }
}

/* ─── 변경 이력 메뉴 함수 ─── */
function toggleChangelogMenu(menuId) {
  // 다른 열린 메뉴 닫기
  document.querySelectorAll('[id^="cl-menu-"]').forEach(el => {
    if (el.id !== menuId) el.style.display = 'none';
  });
  const menu = document.getElementById(menuId);
  if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

// 메뉴 외부 클릭 시 닫기
document.addEventListener('click', function(e) {
  if (!e.target.closest('[id^="cl-menu-"]') && !e.target.closest('button[onclick^="toggleChangelogMenu"]')) {
    document.querySelectorAll('[id^="cl-menu-"]').forEach(el => el.style.display = 'none');
  }
});

function addChangelogEntry(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;
  _changelogEditTarget = { studentId, idx: null };
  _openChangelogModal({ field: '', from: '', to: '', reason: '' });
}

function editChangelogEntry(studentId, idx) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s || !s.changeRequests[idx]) return;
  document.querySelectorAll('[id^="cl-menu-"]').forEach(el => el.style.display = 'none');
  _changelogEditTarget = { studentId, idx };
  _openChangelogModal(s.changeRequests[idx]);
}

function deleteChangelogEntry(studentId, idx) {
  document.querySelectorAll('[id^="cl-menu-"]').forEach(el => el.style.display = 'none');
  if (!confirm('이 변경 이력을 삭제하시겠습니까?')) return;
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s || !s.changeRequests) return;
  s.changeRequests.splice(idx, 1);
  showToast('변경 이력이 삭제되었습니다.', 'success');
  switchAdetailTab('changelog');
}

let _changelogEditTarget = null;

function _openChangelogModal(entry) {
  // 인라인 모달 생성
  const existing = document.getElementById('changelog-edit-modal');
  if (existing) existing.remove();

  const isNew = _changelogEditTarget && _changelogEditTarget.idx === null;
  const modal = document.createElement('div');
  modal.id = 'changelog-edit-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4)';
  modal.innerHTML = `
    <div style="background:#fff;border-radius:12px;padding:24px;width:480px;box-shadow:0 8px 32px rgba(0,0,0,0.15)" onclick="event.stopPropagation()">
      <div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:16px">${isNew ? '변경 이력 추가' : '변경 이력 수정'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <label style="font-size:11.5px;font-weight:600;color:#374151;display:block;margin-bottom:4px">변경 항목</label>
          <input id="cle-field" class="tsa-input" style="font-size:12px" value="${entry.field || ''}" placeholder="예: 수강 기간"/>
        </div>
        <div>
          <label style="font-size:11.5px;font-weight:600;color:#374151;display:block;margin-bottom:4px">변경일</label>
          <input id="cle-date" type="date" class="tsa-input" style="font-size:12px" value="${entry.requestDate || new Date().toISOString().substring(0,10)}"/>
        </div>
        <div>
          <label style="font-size:11.5px;font-weight:600;color:#374151;display:block;margin-bottom:4px">변경 전</label>
          <input id="cle-from" class="tsa-input" style="font-size:12px" value="${entry.from || ''}"/>
        </div>
        <div>
          <label style="font-size:11.5px;font-weight:600;color:#374151;display:block;margin-bottom:4px">변경 후</label>
          <input id="cle-to" class="tsa-input" style="font-size:12px" value="${entry.to || ''}"/>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:11.5px;font-weight:600;color:#374151;display:block;margin-bottom:4px">사유</label>
        <input id="cle-reason" class="tsa-input" style="font-size:12px" value="${entry.reason || ''}" placeholder="변경 사유를 입력하세요"/>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button onclick="document.getElementById('changelog-edit-modal').remove()" style="padding:7px 16px;background:none;border:1px solid #E5E7EB;border-radius:7px;font-size:12px;color:#6B7280;cursor:pointer">취소</button>
        <button onclick="_saveChangelogEntry()" style="padding:7px 16px;background:#5E5CE6;border:none;border-radius:7px;font-size:12px;font-weight:700;color:#fff;cursor:pointer">${isNew ? '추가' : '저장'}</button>
      </div>
    </div>`;
  modal.addEventListener('click', () => modal.remove());
  document.body.appendChild(modal);
  document.getElementById('cle-field').focus();
}

function _saveChangelogEntry() {
  if (!_changelogEditTarget) return;
  const { studentId, idx } = _changelogEditTarget;
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;

  const field   = document.getElementById('cle-field').value.trim();
  const from    = document.getElementById('cle-from').value.trim();
  const to      = document.getElementById('cle-to').value.trim();
  const reason  = document.getElementById('cle-reason').value.trim();
  const date    = document.getElementById('cle-date').value;

  if (!field) { showToast('변경 항목을 입력하세요.', 'warning'); return; }

  const changedBy = APP.user === 'super_admin' ? '슈퍼 어드민' : APP.user === 'agency_head' ? '에이전시 본사' : APP.user === 'agency_branch' ? '에이전시 지사' : APP.user;

  if (idx === null) {
    if (!s.changeRequests) s.changeRequests = [];
    s.changeRequests.push({ id: Date.now(), field, from, to, reason, changedBy, requestDate: date });
    showToast('변경 이력이 추가되었습니다.', 'success');
  } else {
    Object.assign(s.changeRequests[idx], { field, from, to, reason, requestDate: date });
    showToast('변경 이력이 수정되었습니다.', 'success');
  }

  document.getElementById('changelog-edit-modal').remove();
  _changelogEditTarget = null;
  switchAdetailTab('changelog');
}

function renderChangelogTab() {
  const s = APP.currentStudent;
  const el = document.getElementById('student-modal-tab-content');
  if (!el || !s) return;

  const logs = (s.changeRequests || []).slice().reverse();
  const sid = s.id;

  const fieldMenuMap = {
    '영문 성명': '기본 정보', '닉네임': '기본 정보', '성별': '기본 정보', '국적': '기본 정보',
    '연락처': '기본 정보', '이메일': '기본 정보', '비상 연락처': '기본 정보', '생년월일': '기본 정보',
    '식단 구분': '기본 정보', '건강 특이사항': '기본 정보',
    '항공편 (입국)': '항공 & 입출국', '항공편 (출국)': '항공 & 입출국', '입국일': '항공 & 입출국', '출국일': '항공 & 입출국',
    '입실일': '항공 & 입출국', '퇴실일': '항공 & 입출국',
    '여권 번호': '서류 관리', '여권 만료일': '서류 관리',
    '수강 기간': '수강 현황', '코스 유형': '수강 현황', '수강 시작일': '수강 현황', '레벨': '수강 현황',
    '비자 만료일': '비자 & SSP', 'SSP 만료일': '비자 & SSP',
  };
  const menuColors = {
    '기본 정보':    { bg: '#F0FDF4', color: '#15803D' },
    '항공 & 입출국': { bg: '#EFF6FF', color: '#1D4ED8' },
    '서류 관리':    { bg: '#FDF4FF', color: '#7E22CE' },
    '수강 현황':    { bg: '#FFF7ED', color: '#C2410C' },
    '비자 & SSP':  { bg: '#F0F9FF', color: '#0369A1' },
    '기타':         { bg: '#F3F4F6', color: '#6B7280' },
  };

  const rows = logs.length === 0
    ? `<tr><td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;font-size:12px">변경 이력이 없습니다.</td></tr>`
    : logs.map(cr => {
        const realIdx = (s.changeRequests || []).indexOf(cr);
        const menuName = fieldMenuMap[cr.field] || cr.menu || '기타';
        const mc = menuColors[menuName] || menuColors['기타'];
        const menuBadge = `<span style="font-size:11px;font-weight:600;background:${mc.bg};color:${mc.color};padding:2px 8px;border-radius:8px;white-space:nowrap">${menuName}</span>`;
        const menuId = `cl-menu-admin-${sid}-${realIdx}`;
        const actionMenu = `
          <div style="position:relative;display:inline-block">
            <button onclick="toggleChangelogMenu('${menuId}')" style="background:none;border:1px solid #E5E7EB;border-radius:6px;padding:3px 8px;cursor:pointer;color:#6B7280;display:flex;align-items:center">
              <i data-lucide="more-horizontal" style="width:14px;height:14px"></i>
            </button>
            <div id="${menuId}" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);z-index:200;min-width:110px;overflow:hidden">
              <div onclick="editChangelogEntry(${sid},${realIdx})" style="padding:8px 14px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:8px;color:#374151" onmouseenter="this.style.background='#F3F4F6'" onmouseleave="this.style.background=''">
                <i data-lucide="pencil" style="width:13px;height:13px;color:#5E5CE6"></i> 수정
              </div>
              <div style="height:1px;background:#F3F4F6"></div>
              <div onclick="deleteChangelogEntry(${sid},${realIdx})" style="padding:8px 14px;font-size:12px;cursor:pointer;display:flex;align-items:center;gap:8px;color:#EF4444" onmouseenter="this.style.background='#FEF2F2'" onmouseleave="this.style.background=''">
                <i data-lucide="trash-2" style="width:13px;height:13px"></i> 삭제
              </div>
            </div>
          </div>`;

        return `
        <tr>
          <td style="font-size:12px;color:#6B7280;white-space:nowrap">${cr.requestDate || '-'}</td>
          <td>${menuBadge}</td>
          <td><span style="font-size:11.5px;font-weight:700;background:#EEF2FF;color:#4338CA;padding:2px 8px;border-radius:6px">${cr.field}</span></td>
          <td style="font-size:12px">
            <span style="color:#9CA3AF;text-decoration:line-through">${cr.from || '-'}</span>
            <span style="color:#D1D5DB;margin:0 5px">→</span>
            <span style="font-weight:600;color:#111827">${cr.to || '-'}</span>
          </td>
          <td style="font-size:11.5px;color:#6B7280">${cr.reason || '-'}</td>
          <td style="font-size:11.5px;white-space:nowrap;border-left:2px solid #F3F4F6;padding-left:12px">
            <div style="font-weight:600;color:#374151">${cr.changedBy || '-'}</div>
            <div style="font-size:10.5px;color:#9CA3AF;margin-top:1px">${cr.requestDate || ''}</div>
          </td>
          <td style="text-align:center;width:44px">${actionMenu}</td>
        </tr>`;
      }).join('');

  // 어드민 모달에서 저장 시 switchStudentTab 재호출하도록 editChangelogEntry 오버라이드
  window._changelogAdminMode = true;

  el.innerHTML = `
    <div style="padding:16px 0">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <div>
          <span style="font-size:13px;font-weight:700;color:#111827">변경 이력</span>
          <span style="font-size:11.5px;color:#9CA3AF;margin-left:8px">총 ${logs.length}건</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="font-size:11px;color:#6B7280;background:#F3F4F6;padding:4px 10px;border-radius:6px">에이전시 · 어드민 직접 수정 포함</div>
        </div>
      </div>
      <table class="tsa-table" style="font-size:12px">
        <thead>
          <tr>
            <th>변경일</th><th>메뉴</th><th>변경 항목</th><th>변경 내용 (전 → 후)</th><th>사유</th>
            <th style="border-left:2px solid #E5E7EB;padding-left:12px">변경 계정</th>
            <th style="width:44px"></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;

  if (typeof refreshIcons === 'function') refreshIcons();
}

/* ════════════════════════════════════════════
   수업 현황 탭
   ════════════════════════════════════════════ */

function getBellPeriods() {
  const bs = APP.bellSystem || { duration:50, break:10, start:'08:00', total:8, lunchAfter:4, lunchDuration:30 };
  const addMins = (t, m) => {
    const [h, mn] = t.split(':').map(Number);
    const d = new Date(2000,0,1,h,mn+m);
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  };
  const periods = [];
  let cur = bs.start;
  for (let i = 1; i <= bs.total; i++) {
    const end = addMins(cur, bs.duration);
    periods.push({ period: i, start: cur, end });
    if (i === bs.lunchAfter) cur = addMins(end, bs.lunchDuration);
    else cur = addMins(end, bs.break);
  }
  return periods;
}

let _classLogEditTarget = null; // { studentId, date, period }

function renderStudentClassLogTab() {
  const s = APP.currentStudent;
  const container = document.getElementById(APP._classLogContainerId || 'student-modal-tab-content');
  if (!s || !container) return;

  const allLogs  = MOCK_CLASS_LOG.filter(l => l.studentId === s.id);
  const today    = new Date('2026-06-16');
  const todayStr = '2026-06-16';

  // 현재 달력 월
  if (!APP._classLogYear)  APP._classLogYear  = 2026;
  if (!APP._classLogMonth) APP._classLogMonth = 6;
  const calYear  = APP._classLogYear;
  const calMonth = APP._classLogMonth;

  // 선택된 날짜
  const selDate = APP._classLogDate || todayStr;
  const dayLogs = allLogs.filter(l => l.date === selDate);
  const periods = getBellPeriods();

  // KPI — 현재 달력 월 기준
  const monthPrefix = `${calYear}-${String(calMonth).padStart(2,'0')}`;
  const monthLogs   = allLogs.filter(l => l.date.startsWith(monthPrefix));
  const mPresent = monthLogs.filter(l => l.status === 'present').length;
  const mAbsent  = monthLogs.filter(l => l.status === 'absent').length;
  const mLate    = monthLogs.filter(l => l.status === 'late').length;
  const mEarly   = monthLogs.filter(l => l.status === 'early_leave').length;

  // 패널티 판단은 전체 누적 기준
  const totalAll   = allLogs.length;
  const presentAll = allLogs.filter(l => l.status === 'present').length;
  const lateAll    = allLogs.filter(l => l.status === 'late').length;
  const earlyAll   = allLogs.filter(l => l.status === 'early_leave').length;
  const attRate    = totalAll > 0 ? Math.round((presentAll + lateAll + earlyAll) / totalAll * 100) : 0;
  const penalty    = s.penaltyActive || attRate < 80;

  // ── 월간 캘린더 생성
  const dayHeaders = ['일','월','화','수','목','금','토'];
  const firstDay = new Date(calYear, calMonth - 1, 1);
  const lastDay  = new Date(calYear, calMonth, 0);
  // 일요일을 왼쪽, 토요일을 오른쪽에 배치 (0=일 ... 6=토)
  const startDow = firstDay.getDay();
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7;

  const calCells = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startDow + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) { calCells.push(null); continue; }
    const dateStr = `${calYear}-${String(calMonth).padStart(2,'0')}-${String(dayNum).padStart(2,'0')}`;
    const dow = (firstDay.getDay() + dayNum - 1) % 7; // 0=일
    calCells.push({ dateStr, dayNum, dow });
  }

  const calRows = [];
  for (let r = 0; r < calCells.length / 7; r++) {
    calRows.push(calCells.slice(r*7, r*7+7));
  }

  const calHtml = `
    <div style="background:white;border-radius:12px;border:1px solid #E5E7EB;overflow:hidden">
      <!-- 달력 헤더 -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #F3F4F6">
        <button onclick="shiftClassLogMonth(-1)" style="background:none;border:1px solid #E5E7EB;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:14px;color:#374151">&#8249;</button>
        <span style="font-size:13px;font-weight:800;color:#1A1D23">${calYear}년 ${calMonth}월</span>
        <button onclick="shiftClassLogMonth(1)" style="background:none;border:1px solid #E5E7EB;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:14px;color:#374151">&#8250;</button>
      </div>
      <!-- 요일 헤더 -->
      <div style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #F3F4F6">
        ${dayHeaders.map((d,i) => `<div style="text-align:center;padding:6px 0;font-size:10px;font-weight:700;color:${i===0?'#EF4444':i===6?'#3B82F6':'#6B7280'}">${d}</div>`).join('')}
      </div>
      <!-- 날짜 셀 -->
      ${calRows.map(row => `
        <div style="display:grid;grid-template-columns:repeat(7,1fr);border-bottom:1px solid #F9FAFB">
          ${row.map((cell, ci) => {
            if (!cell) return `<div style="padding:8px 4px;min-height:52px;background:#FAFAFA"></div>`;
            const { dateStr, dayNum, dow } = cell;
            const dLogs  = allLogs.filter(l => l.date === dateStr);
            const tot    = dLogs.length;
            const absN   = dLogs.filter(l => l.status==='absent').length;
            const lateN  = dLogs.filter(l => l.status==='late').length;
            const earlyN = dLogs.filter(l => l.status==='early_leave').length;
            const presN  = dLogs.filter(l => l.status==='present').length;
            const isToday = dateStr === todayStr;
            const isSel   = dateStr === selDate;
            const isSun   = dow === 0;
            const isSat   = dow === 6;

            const numColor = isSun ? '#EF4444' : isSat ? '#3B82F6' : '#1A1D23';
            const cellBg   = isSel ? '#5E5CE6' : isToday ? '#EEF2FF' : 'white';
            const numTc    = isSel ? 'white' : numColor;
            const tagTc    = isSel ? 'rgba(255,255,255,0.9)' : null;

            // 출석 현황 텍스트 태그
            const tags = [];
            if (presN  > 0) tags.push(`<span style="font-size:9px;font-weight:700;color:${tagTc||'#16A34A'}">출석 ${presN}</span>`);
            if (absN   > 0) tags.push(`<span style="font-size:9px;font-weight:700;color:${tagTc||'#EF4444'}">결석 ${absN}</span>`);
            if (lateN  > 0) tags.push(`<span style="font-size:9px;font-weight:700;color:${tagTc||'#D97706'}">지각 ${lateN}</span>`);
            if (earlyN > 0) tags.push(`<span style="font-size:9px;font-weight:700;color:${tagTc||'#8B5CF6'}">조퇴 ${earlyN}</span>`);
            const summaryHtml = tags.length > 0
              ? `<div style="display:flex;flex-direction:column;gap:1px;margin-top:3px;align-items:center">${tags.join('')}</div>`
              : '';

            return `<div onclick="selectClassLogDate('${dateStr}')" style="padding:6px 4px;min-height:64px;cursor:pointer;background:${cellBg};border-right:1px solid #F3F4F6;transition:background 0.1s;display:flex;flex-direction:column;align-items:center" onmouseover="if('${dateStr}'!=='${selDate}')this.style.background='#F5F3FF'" onmouseout="if('${dateStr}'!=='${selDate}')this.style.background='${isToday?'#EEF2FF':'white'}'">
              <div style="width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;${isToday&&!isSel?'border:2px solid #5E5CE6':''}">
                <span style="font-size:12px;font-weight:${isToday||isSel?'800':'500'};color:${numTc}">${dayNum}</span>
              </div>
              ${summaryHtml}
            </div>`;
          }).join('')}
        </div>`).join('')}
      <!-- 범례 -->
      <div style="display:flex;gap:14px;padding:10px 16px;background:#F9FAFB;border-top:1px solid #F3F4F6;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#6B7280"><span style="width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block"></span>출석</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#6B7280"><span style="width:7px;height:7px;border-radius:50%;background:#D97706;display:inline-block"></span>지각</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#6B7280"><span style="width:7px;height:7px;border-radius:50%;background:#8B5CF6;display:inline-block"></span>조퇴</div>
        <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#6B7280"><span style="width:7px;height:7px;border-radius:50%;background:#EF4444;display:inline-block"></span>결석</div>
      </div>
    </div>`;

  // ── 선택 날짜 교시 타임라인
  const dayNames  = ['일','월','화','수','목','금','토'];
  const statusMeta = {
    present:     { label:'출석', color:'#16A34A', bg:'#DCFCE7', icon:'✓' },
    absent:      { label:'결석', color:'#EF4444', bg:'#FEE2E2', icon:'✗' },
    late:        { label:'지각', color:'#D97706', bg:'#FEF3C7', icon:'◔' },
    early_leave: { label:'조퇴', color:'#8B5CF6', bg:'#EDE9FE', icon:'↩' },
    none:        { label:'미기록', color:'#9CA3AF', bg:'#F3F4F6', icon:'–' },
  };
  const typeBadge = { '1:1':'#5E5CE6', '1:4':'#10B981', '1:6':'#F59E0B' };

  const periodRows = periods.map(({ period, start, end }) => {
    const log = dayLogs.find(l => l.period === period);
    const sm  = log ? statusMeta[log.status] : statusMeta.none;
    const isEditing = _classLogEditTarget?.studentId === s.id &&
                      _classLogEditTarget?.date === selDate &&
                      _classLogEditTarget?.period === period;
    return `
      <div style="display:flex;align-items:stretch;border-radius:10px;border:1.5px solid ${isEditing?'#5E5CE6':'#F3F4F6'};overflow:hidden;background:${isEditing?'#F5F3FF':'white'};margin-bottom:6px">
        <div style="width:64px;flex-shrink:0;padding:10px 8px;background:#F9FAFB;border-right:1px solid #F3F4F6;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div style="font-size:10px;font-weight:800;color:#5E5CE6">${period}교시</div>
          <div style="font-size:9.5px;color:#9CA3AF;margin-top:2px">${start}</div>
          <div style="font-size:9px;color:#D1D5DB">~${end}</div>
        </div>
        <div style="flex:1;padding:10px 12px;display:flex;align-items:center;gap:10px;min-width:0">
          ${log ? `
            <span style="font-size:10px;font-weight:700;color:${typeBadge[log.type]||'#6B7280'};background:${typeBadge[log.type]||'#6B7280'}18;padding:2px 7px;border-radius:4px;flex-shrink:0">${log.type}</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:12px;font-weight:700;color:#1A1D23;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${log.subject || '–'}</div>
              <div style="font-size:10.5px;color:#9CA3AF;margin-top:1px">${log.teacherName || '–'} 강사</div>
              ${log.note ? `<div style="font-size:10px;color:#6B7280;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">💬 ${log.note}</div>` : ''}
            </div>
          ` : `<span style="font-size:11px;color:#D1D5DB">수업 없음</span>`}
        </div>
        <div style="display:flex;align-items:center;gap:6px;padding:0 12px;flex-shrink:0">
          <span style="font-size:11px;font-weight:700;color:${sm.color};background:${sm.bg};padding:3px 9px;border-radius:20px">${sm.icon} ${sm.label}</span>
          <button onclick="toggleClassLogEdit(${s.id},'${selDate}',${period})" style="background:none;border:1px solid ${isEditing?'#5E5CE6':'#E5E7EB'};border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;color:${isEditing?'#5E5CE6':'#6B7280'}">
            ${isEditing ? '접기' : '편집'}
          </button>
        </div>
      </div>
      ${isEditing ? renderClassLogEditPanel(s.id, selDate, period, log) : ''}`;
  }).join('');

  const selDateObj   = new Date(selDate);
  const selDateLabel = `${selDateObj.getMonth()+1}월 ${selDateObj.getDate()}일 (${dayNames[selDateObj.getDay()]})`;
  const selPresent   = dayLogs.filter(l=>l.status==='present').length;
  const selAbsent    = dayLogs.filter(l=>l.status==='absent').length;
  const selLate      = dayLogs.filter(l=>l.status==='late').length;
  const selEarly     = dayLogs.filter(l=>l.status==='early_leave').length;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;padding:2px 0">

      <!-- KPI 바 (월별) -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
        <div style="padding:10px 12px;background:#F0FDF4;border-radius:10px;text-align:center;border:1px solid #D1FAE5">
          <div style="font-size:22px;font-weight:800;color:#16A34A">${mPresent}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:2px">출석</div>
        </div>
        <div style="padding:10px 12px;background:#FEF2F2;border-radius:10px;text-align:center;border:1px solid #FECACA">
          <div style="font-size:22px;font-weight:800;color:#EF4444">${mAbsent}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:2px">결석</div>
        </div>
        <div style="padding:10px 12px;background:#FFFBEB;border-radius:10px;text-align:center;border:1px solid #FDE68A">
          <div style="font-size:22px;font-weight:800;color:#D97706">${mLate}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:2px">지각</div>
        </div>
        <div style="padding:10px 12px;background:#F5F3FF;border-radius:10px;text-align:center;border:1px solid #DDD6FE">
          <div style="font-size:22px;font-weight:800;color:#8B5CF6">${mEarly}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:2px">조퇴</div>
        </div>
        <div style="padding:10px 12px;background:${penalty?'#FEF2F2':'#F0FDF4'};border-radius:10px;text-align:center;border:1px solid ${penalty?'#FECACA':'#D1FAE5'};cursor:pointer" onclick="toggleStudentPenalty(${s.id})" title="관리자 패널티 전환 (누적 출석률 ${attRate}%)">
          <div style="font-size:12px;font-weight:800;color:${penalty?'#EF4444':'#16A34A'}">${penalty?'🔒 적용중':'✓ 정상'}</div>
          <div style="font-size:10px;color:#6B7280;margin-top:2px">1:1 패널티</div>
        </div>
      </div>

      <!-- 월간 캘린더 -->
      ${calHtml}

      <!-- 선택 날짜 상세 -->
      <div style="border-top:2px solid #5E5CE6;padding-top:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:13px;font-weight:800;color:#1A1D23">${selDateLabel} 수업 현황</div>
          <div style="display:flex;gap:6px;font-size:10.5px">
            ${selPresent ? `<span style="background:#DCFCE7;color:#16A34A;padding:2px 8px;border-radius:10px;font-weight:700">출석 ${selPresent}</span>` : ''}
            ${selAbsent  ? `<span style="background:#FEE2E2;color:#EF4444;padding:2px 8px;border-radius:10px;font-weight:700">결석 ${selAbsent}</span>` : ''}
            ${selLate    ? `<span style="background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:10px;font-weight:700">지각 ${selLate}</span>` : ''}
            ${selEarly   ? `<span style="background:#EDE9FE;color:#8B5CF6;padding:2px 8px;border-radius:10px;font-weight:700">조퇴 ${selEarly}</span>` : ''}
          </div>
        </div>
        <div>${periodRows}</div>
      </div>
    </div>`;

  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderClassLogEditPanel(studentId, date, period, log) {
  const subjects = ['Speaking','Grammar','Writing','Listening','Reading','Pronunciation','Vocabulary','Conversation'];
  const teachers = [...new Set(MOCK_CLASS_LOG.map(l => l.teacherName).filter(Boolean))];
  const cur = log || { type:'1:1', teacherName:'', subject:'', status:'present', note:'' };
  return `
    <div id="classlog-edit-${period}" style="margin:-6px 0 6px 0;padding:14px 16px;background:#EEF2FF;border:1.5px solid #C7D2FE;border-radius:0 0 10px 10px;display:flex;flex-direction:column;gap:10px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div>
          <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">수업 유형</label>
          <select id="cle-type-${period}" class="tsa-input" style="font-size:12px;padding:5px 8px">
            ${['1:1','1:4','1:6'].map(t => `<option ${cur.type===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">담당 강사</label>
          <input id="cle-teacher-${period}" class="tsa-input" style="font-size:12px;padding:5px 8px" value="${cur.teacherName||''}" placeholder="강사명" list="cle-teacher-list"/>
          <datalist id="cle-teacher-list">${teachers.map(t=>`<option value="${t}">`).join('')}</datalist>
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">수업 과목</label>
          <input id="cle-subject-${period}" class="tsa-input" style="font-size:12px;padding:5px 8px" value="${cur.subject||''}" placeholder="과목명" list="cle-subject-list"/>
          <datalist id="cle-subject-list">${subjects.map(s=>`<option value="${s}">`).join('')}</datalist>
        </div>
      </div>
      <div>
        <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">출석 상태</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${[['present','출석','#16A34A','#DCFCE7'],['absent','결석','#EF4444','#FEE2E2'],['late','지각','#D97706','#FEF3C7'],['early_leave','조퇴','#8B5CF6','#EDE9FE']].map(([v,lbl,c,bg]) =>
            `<label style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1.5px solid ${cur.status===v?c:'#E5E7EB'};background:${cur.status===v?bg:'white'};cursor:pointer;font-size:11px;font-weight:600;color:${cur.status===v?c:'#6B7280'}">
              <input type="radio" name="cle-status-${period}" value="${v}" ${cur.status===v?'checked':''} style="display:none" onchange="refreshStatusBadges(${period})"> ${lbl}
            </label>`
          ).join('')}
        </div>
      </div>
      <div>
        <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">강사 메모</label>
        <textarea id="cle-note-${period}" class="tsa-input" style="font-size:12px;padding:6px 8px;resize:vertical;min-height:52px" placeholder="수업 진행 내용, 특이사항 등을 기록하세요">${cur.note||''}</textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button onclick="toggleClassLogEdit(null,null,null)" style="padding:5px 14px;background:none;border:1px solid #E5E7EB;border-radius:6px;font-size:12px;color:#6B7280;cursor:pointer">취소</button>
        <button onclick="saveClassLogEntry(${studentId},'${date}',${period})" style="padding:5px 16px;background:#5E5CE6;border:none;border-radius:6px;font-size:12px;color:white;font-weight:700;cursor:pointer">저장</button>
      </div>
    </div>`;
}

function selectClassLogDate(date) {
  APP._classLogDate = date;
  _classLogEditTarget = null;
  // 달력 월도 선택된 날짜에 맞춤
  const d = new Date(date);
  APP._classLogYear  = d.getFullYear();
  APP._classLogMonth = d.getMonth() + 1;
  renderStudentClassLogTab();
}

function shiftClassLogMonth(delta) {
  APP._classLogMonth = (APP._classLogMonth || 6) + delta;
  if (APP._classLogMonth < 1)  { APP._classLogMonth = 12; APP._classLogYear--; }
  if (APP._classLogMonth > 12) { APP._classLogMonth = 1;  APP._classLogYear++; }
  renderStudentClassLogTab();
}

function toggleClassLogEdit(studentId, date, period) {
  if (!studentId) {
    _classLogEditTarget = null;
  } else if (_classLogEditTarget?.studentId === studentId && _classLogEditTarget?.date === date && _classLogEditTarget?.period === period) {
    _classLogEditTarget = null;
  } else {
    _classLogEditTarget = { studentId, date, period };
  }
  renderStudentClassLogTab();
}

function refreshStatusBadges(period) {
  // 라디오 선택 시 레이블 스타일 즉시 갱신
  const radios = document.querySelectorAll(`input[name="cle-status-${period}"]`);
  const colorMap = { present:['#16A34A','#DCFCE7'], absent:['#EF4444','#FEE2E2'], late:['#D97706','#FEF3C7'], early_leave:['#8B5CF6','#EDE9FE'] };
  radios.forEach(r => {
    const lbl = r.closest('label');
    if (!lbl) return;
    const [c, bg] = colorMap[r.value] || ['#6B7280','white'];
    lbl.style.borderColor  = r.checked ? c : '#E5E7EB';
    lbl.style.background   = r.checked ? bg : 'white';
    lbl.style.color        = r.checked ? c : '#6B7280';
  });
}

function saveClassLogEntry(studentId, date, period) {
  const type    = document.getElementById(`cle-type-${period}`)?.value || '1:1';
  const teacher = document.getElementById(`cle-teacher-${period}`)?.value || '';
  const subject = document.getElementById(`cle-subject-${period}`)?.value || '';
  const note    = document.getElementById(`cle-note-${period}`)?.value || '';
  const statusEl= document.querySelector(`input[name="cle-status-${period}"]:checked`);
  const status  = statusEl?.value || 'present';

  const idx = MOCK_CLASS_LOG.findIndex(l => l.studentId===studentId && l.date===date && l.period===period);
  const entry = { studentId, date, period, type, teacherName:teacher, subject, status, note };
  if (idx >= 0) MOCK_CLASS_LOG[idx] = entry;
  else MOCK_CLASS_LOG.push(entry);

  // 학생 출석률 재계산
  const stu = MOCK_STUDENTS.find(s => s.id === studentId);
  if (stu) {
    const logs = MOCK_CLASS_LOG.filter(l => l.studentId === studentId);
    const tot  = logs.length;
    const att  = logs.filter(l => l.status !== 'absent').length;
    stu.attendance = tot > 0 ? Math.round(att/tot*100*10)/10 : 0;
  }

  _classLogEditTarget = null;
  showToast('✓ 수업 기록이 저장되었습니다.', 'success');
  renderStudentClassLogTab();
}

function toggleStudentPenalty(studentId) {
  const stu = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!stu) return;
  stu.penaltyActive = !stu.penaltyActive;
  showToast(stu.penaltyActive ? '⚠ 1:1 수업 패널티가 적용되었습니다.' : '✓ 패널티가 해제되었습니다.', stu.penaltyActive ? 'warning' : 'success');
  renderStudentClassLogTab();
}

function onDormAccomChange(accomType) {
  const types = [...new Set(MOCK_DORM_TEMPLATES.filter(t => t.accomType === accomType).map(t => t.capacity + '인실'))];
  const cap = document.getElementById('ad-dorm-cap');
  if (cap) cap.innerHTML = '<option value="">— 선택 —</option>' + types.map(v => `<option value="${v}">${v}</option>`).join('');
  const grade = document.getElementById('ad-dorm-grade');
  if (grade) grade.innerHTML = '<option value="">— 인실 먼저 —</option>';
}

function onDormCapChange(capStr) {
  const accom = document.getElementById('ad-dorm-accom')?.value;
  const cap = parseInt(capStr);
  const grades = [...new Set(MOCK_DORM_TEMPLATES.filter(t => t.accomType === accom && t.capacity === cap).map(t => t.condition))];
  const el = document.getElementById('ad-dorm-grade');
  if (el) el.innerHTML = '<option value="">— 선택 —</option>' + grades.map(v => `<option value="${v}">${v}</option>`).join('');
}

function renderStudentDormTab() {
  const s = APP.currentStudent;
  const container = document.getElementById('student-modal-tab-content');
  if (!container || !s) return;

  // 학생이 배정된 침대 찾기 (studentId로 먼저, 없으면 s.dorm 문자열로)
  let assignedRoom = null, assignedBed = null;
  MOCK_DORM_ROOMS.forEach(r => {
    if (r.beds) r.beds.forEach(b => {
      if (b.studentId === s.id) { assignedRoom = r; assignedBed = b; }
    });
  });

  // MOCK_DORM_ROOMS에 studentId가 없는 경우 s.dorm 문자열로 매핑
  if (!assignedRoom && s.dorm && s.dorm !== '미배정') {
    // "Room 105 / Bed A" 형태 파싱
    const m = s.dorm.match(/Room\s+(\S+)\s*\/\s*Bed\s+(\S+)/i);
    if (m) {
      const roomNo = m[1], bedId = m[2];
      MOCK_DORM_ROOMS.forEach(r => {
        if (String(r.roomNo) === String(roomNo) && r.beds) {
          const b = r.beds.find(b => b.id === bedId);
          if (b) { assignedRoom = r; assignedBed = b; }
        }
      });
    }
    // MOCK_DORM_ROOMS에 없는 경우 s.dorm 텍스트로 표시용 임시 객체 생성
    if (!assignedRoom) {
      assignedRoom = { roomNo: s.dorm.split('/')[0].replace('Room','').trim(), accomType: '-', type: '-', genderRestriction: '-', _fromDormStr: true };
      assignedBed  = { id: (s.dorm.split('Bed')[1] || '').trim(), start: s.startDate ? s.startDate.slice(5) : '-', end: s.departureDate ? s.departureDate.slice(5) : '-' };
    }
  }

  // 학생의 과거 기숙사 이력 찾기 (studentId 또는 이름 포함 매칭)
  const historyList = [];
  MOCK_DORM_ROOMS.forEach(r => {
    if (r.beds) r.beds.forEach(b => {
      (b.history || []).forEach(h => {
        const byId   = h.studentId && h.studentId === s.id;
        const byName = !h.studentId && h.student && (h.student.includes(s.nick) || h.student.includes(s.name));
        if (byId || byName) historyList.push({ room: r, bed: b, record: h });
      });
    });
  });

  // 사전 예약 찾기
  const prebookList = [];
  MOCK_DORM_ROOMS.forEach(r => {
    if (r.beds) r.beds.forEach(b => {
      (b.reservations || []).forEach(rv => {
        if (rv.studentId === s.id) prebookList.push({ room: r, bed: b, rv });
      });
    });
  });

  // ── 현재 배정 카드
  const currentHtml = assignedRoom ? (() => {
    const roomLabel = assignedRoom.roomNo ? `Room ${assignedRoom.roomNo}` : '미배정 호실';
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:16px 18px;background:#EEF2FF;border-radius:12px;border-left:4px solid #5E5CE6">
        <div style="font-size:28px">🏠</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:800;color:#1A1D23">${roomLabel} · Bed ${assignedBed.id}</div>
          <div style="font-size:11px;color:#5E5CE6;margin-top:2px">${assignedRoom.accomType} · ${assignedRoom.type} · ${assignedRoom.genderRestriction || '무관'}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:4px">
            체크인 <strong>${assignedBed.start}</strong> → 체크아웃 <strong>${assignedBed.end}</strong>
          </div>
        </div>
        <div style="text-align:right">
          <span class="tsa-badge" style="background:#DCFCE7;color:#16A34A;font-size:11px">입실중</span>
        </div>
      </div>`;
  })() : `
    <div style="padding:20px 18px;background:#F9FAFB;border-radius:12px;border:1px dashed #D1D5DB;text-align:center;color:#9CA3AF;font-size:12px">
      🏠 현재 배정된 기숙사가 없습니다.
      <div style="margin-top:8px">
        <button class="tsa-btn tsa-btn-primary" style="font-size:11px;padding:5px 14px" onclick="closeModal('student-detail-modal');setTimeout(()=>{ document.querySelector('[onclick*=showAdminSection][onclick*=dorm]') && document.querySelector('[onclick*=showAdminSection][onclick*=dorm]').click(); },200)">기숙사 ERP에서 배정하기</button>
      </div>
    </div>`;

  // ── 사전 예약 카드
  const prebookHtml = prebookList.length > 0 ? `
    <div>
      <div style="font-size:11px;font-weight:700;color:#7C3AED;letter-spacing:0.05em;margin-bottom:8px">📋 사전 예약</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${prebookList.map(({ room, bed, rv }) => `
          <div style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:#F5F3FF;border-radius:10px;border-left:3px solid #7C3AED">
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:#1A1D23">${room.roomNo ? `Room ${room.roomNo}` : '미배정 호실'} · Bed ${bed.id}</div>
              <div style="font-size:11px;color:#6B7280;margin-top:2px">${room.accomType} · ${room.type}</div>
              <div style="font-size:11px;color:#7C3AED;margin-top:3px">예약 기간: <strong>${rv.start}</strong> ~ <strong>${rv.end}</strong></div>
            </div>
            <span class="tsa-badge" style="background:#EDE9FE;color:#7C3AED;font-size:11px">사전예약</span>
          </div>
        `).join('')}
      </div>
    </div>` : '';

  // ── 과거 이력
  const historyRows = historyList.length > 0
    ? historyList.map(({ room, bed, record }) => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:#F9FAFB;border-radius:10px;border-left:3px solid #D1D5DB">
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;color:#374151">${room.roomNo ? `Room ${room.roomNo}` : '미배정'} · Bed ${bed.id}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:2px">${room.accomType} · ${room.type}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:2px">${record.start} ~ ${record.end}</div>
          </div>
          <span class="tsa-badge" style="background:#F3F4F6;color:#9CA3AF;font-size:11px">졸업/퇴실</span>
        </div>`).join('')
    : `<div style="font-size:11px;color:#9CA3AF;padding:8px 0">배정 이력이 없습니다.</div>`;
  const historyHtml = `
    <div>
      <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.05em;margin-bottom:8px">📁 배정 이력</div>
      <div style="display:flex;flex-direction:column;gap:6px">${historyRows}</div>
    </div>`;

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px;padding:4px 0">
      <div>
        <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:10px">희망 숙소 <span style="color:#EF4444">*</span></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
          <div class="tsa-form-group">
            <label class="tsa-label">숙소 유형</label>
            <select id="ad-dorm-accom" class="tsa-input" onchange="onDormAccomChange(this.value)">
              <option value="">— 선택 —</option>
              ${[...new Set(MOCK_DORM_TEMPLATES.map(t=>t.accomType))].map(v=>`<option value="${v}" ${s.dormAccomType===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">인실 기준</label>
            <select id="ad-dorm-cap" class="tsa-input" onchange="onDormCapChange(this.value)">
              <option value="">— 유형 먼저 —</option>
              ${s.dormAccomType ? [...new Set(MOCK_DORM_TEMPLATES.filter(t=>t.accomType===s.dormAccomType).map(t=>t.capacity+'인실'))].map(v=>`<option value="${v}" ${s.dormType===v?'selected':''}>${v}</option>`).join('') : ''}
            </select>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">등급</label>
            <select id="ad-dorm-grade" class="tsa-input">
              <option value="">— 인실 먼저 —</option>
              ${s.dormAccomType && s.dormType ? [...new Set(MOCK_DORM_TEMPLATES.filter(t=>t.accomType===s.dormAccomType&&t.capacity===parseInt(s.dormType)).map(t=>t.condition))].map(v=>`<option value="${v}" ${s.dormGrade===v?'selected':''}>${v}</option>`).join('') : ''}
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px">
          <div class="tsa-form-group">
            <label class="tsa-label">입실 희망일</label>
            <input id="ad-dorm-in" type="date" class="tsa-input" value="${s.dormIn || s.startDate || ''}"/>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">퇴실 희망일</label>
            <input id="ad-dorm-out" type="date" class="tsa-input" value="${s.dormOut || s.departureDate || ''}"/>
          </div>
        </div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.05em;margin-bottom:8px">현재 숙소</div>
        ${currentHtml}
      </div>
      ${prebookHtml}
      ${historyHtml}
    </div>`;
}

function saveStudentHealth(id) {
  const diet = document.getElementById('edit-student-diet')?.value;
  const notes = document.getElementById('edit-student-health-notes')?.value.trim();
  const student = MOCK_STUDENTS.find(s => s.id === id);
  if (student) {
    if (diet) student.dietType = diet;
    student.healthNotes = notes || '특이사항 없음.';
    APP.currentStudent = student;
    showToast(`✓ ${student.nick} 학생의 건강 및 식단 정보가 저장되었습니다.`, 'success');
    switchStudentTab('basic', null);
  }
}

function saveAdminStudentBasic() {
  const s = APP.currentStudent;
  if (!s) return;

  const getVal = (id, fallback) => { const el = document.getElementById(id); return el ? el.value.trim() : fallback; };

  const name = getVal('ad-name', s.name);
  const nick = getVal('ad-nickname', s.nick);
  if (!name || !nick) { showToast('성명과 닉네임은 필수입니다.', 'danger'); return; }

  // 변경 이력 추적
  if (!s.changeRequests) s.changeRequests = [];
  const today = new Date().toISOString().slice(0, 10);
  const fieldLabels = { name:'영문 성명', nick:'닉네임', gender:'성별', nationality:'국적', phone:'연락처', email:'이메일', emergencyContact:'비상 연락처', dietType:'식단 구분', healthNotes:'건강 메모' };
  const newVals = {
    name, nick,
    gender:           getVal('ad-gender', s.gender),
    nationality:      getVal('ad-nationality', s.nationality),
    phone:            getVal('ad-phone', s.phone),
    email:            getVal('ad-email', s.email),
    emergencyContact: getVal('ad-emergency', s.emergencyContact),
    dietType:         getVal('ad-diet', s.dietType),
    healthNotes:      getVal('ad-health-notes', s.healthNotes),
  };
  Object.keys(newVals).forEach(key => {
    const oldVal = String(s[key] || '');
    const newVal = String(newVals[key] || '');
    if (oldVal !== newVal && newVal) {
      s.changeRequests.push({
        id: Date.now() + Math.random(),
        field: fieldLabels[key] || key,
        from: oldVal || '-',
        to: newVal,
        reason: '어드민 직접 수정',
        changedBy: '어드민',
        requestDate: today,
        status: 'approved'
      });
    }
  });

  // 값 저장
  Object.assign(s, newVals);
  if (adProfilePhotoData) s.profilePhoto = adProfilePhotoData;
  const dobEl = document.getElementById('ad-dob');
  if (dobEl && dobEl.value) {
    s.dob = dobEl.value;
    s.age = Math.floor((new Date('2026-06-15') - new Date(dobEl.value)) / (365.25 * 86400000));
  }

  // 모달 헤더 갱신
  document.getElementById('modal-student-name').textContent = `${s.nick} (${s.name})`;
  document.getElementById('modal-student-meta').textContent = `${s.flag} ${s.nationality} · ${s.gender}성 ${s.age}세 · ${s.course}`;
  if (s.profilePhoto) { const avatarEl = document.getElementById('modal-student-avatar'); if (avatarEl) avatarEl.src = s.profilePhoto; }

  showToast(`✓ ${s.nick} 학생 정보가 저장되었습니다.`, 'success');
}

function renderGradesTab() {
  const s = APP.currentStudent;
  const container = document.getElementById('student-modal-tab-content');
  if (!s) return;

  if (!s.grades) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:#9CA3AF">
      <i data-lucide="book-open" style="font-size:40px;display:block;margin:0 auto 12px"></i>
      <div style="font-size:14px;font-weight:600">아직 성적 데이터가 없습니다</div>
      <div style="font-size:12px;margin-top:6px">수강 시작 후 성적이 등록됩니다.</div>
    </div>`;
    if (typeof refreshIcons === 'function') refreshIcons();
    return;
  }

  const currentSpeaking = s.grades.speaking[s.grades.speaking.length - 1] || 0;
  const currentListening = s.grades.listening[s.grades.listening.length - 1] || 0;
  const currentReading = s.grades.reading[s.grades.reading.length - 1] || 0;
  const currentWriting = s.grades.writing[s.grades.writing.length - 1] || 0;

  container.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
      <!-- Grade Form -->
      <div class="tsa-card" style="padding:16px;">
        <h4 style="font-size:13px;margin-bottom:12px;color:#5E5CE6;"><i data-lucide="pencil"></i> 성적 등록 및 업데이트 (과목별)</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="tsa-form-group">
            <label class="tsa-label">Speaking</label>
            <input type="number" id="grade-sp" class="tsa-input" value="${currentSpeaking}" max="100"/>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">Listening</label>
            <input type="number" id="grade-li" class="tsa-input" value="${currentListening}" max="100"/>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">Reading</label>
            <input type="number" id="grade-re" class="tsa-input" value="${currentReading}" max="100"/>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">Writing</label>
            <input type="number" id="grade-wr" class="tsa-input" value="${currentWriting}" max="100"/>
          </div>
        </div>
        <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="width:100%;justify-content:center;margin-top:10px" onclick="saveStudentGrades(${s.id})">
          성적 기록 반영
        </button>
      </div>

      <!-- Live Grade Chart -->
      <div class="tsa-card" style="padding:16px;">
        <h4 style="font-size:13px;margin-bottom:12px;color:#111827;"><i data-lucide="trending-up"></i> 학업 성취도 추이 (최근 4개 평가)</h4>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${renderChartBar('Speaking', s.grades.speaking)}
          ${renderChartBar('Listening', s.grades.listening)}
          ${renderChartBar('Reading', s.grades.reading)}
          ${renderChartBar('Writing', s.grades.writing)}
        </div>
      </div>
    </div>
  `;
}

function renderChartBar(subject, scores) {
  const lastScore = scores[scores.length - 1] || 0;
  const diff = scores.length > 1 ? lastScore - scores[scores.length - 2] : 0;
  const color = subject === 'Speaking' ? '#5E5CE6' : subject === 'Listening' ? '#0EA5E9' : subject === 'Reading' ? '#16A34A' : '#D97706';

  return `
    <div>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;font-weight:600;margin-bottom:4px;">
        <span>${subject}</span>
        <span>
          <strong style="color:${color}">${lastScore}점</strong> 
          ${diff > 0 ? `<span style="color:#16A34A;font-size:10px;">(+${diff})</span>` : diff < 0 ? `<span style="color:#EF4444;font-size:10px;">(${diff})</span>` : ''}
        </span>
      </div>
      <div class="tsa-progress" style="height:8px;">
        <div class="tsa-progress-bar" style="width:${lastScore}%;background:${color}"></div>
      </div>
    </div>
  `;
}

function saveStudentGrades(id) {
  const sp = parseInt(document.getElementById('grade-sp').value) || 0;
  const li = parseInt(document.getElementById('grade-li').value) || 0;
  const re = parseInt(document.getElementById('grade-re').value) || 0;
  const wr = parseInt(document.getElementById('grade-wr').value) || 0;

  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (s) {
    s.grades.speaking.push(sp);
    s.grades.listening.push(li);
    s.grades.reading.push(re);
    s.grades.writing.push(wr);

    showToast('✓ 학생 성적 레코드가 기록되었으며 차트에 실시간 반영되었습니다.', 'success');
    renderGradesTab();
  }
}

function renderFeesTab() {
  const s = APP.currentStudent;
  const container = document.getElementById('student-modal-tab-content');
  if (!s) return;

  const unpaid = s.fees.filter(f => !f.paid).reduce((sum, f) => sum + f.amount, 0);

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;background:#FFF5F5;border:1px solid #FEE2E2;border-radius:10px;padding:12px;margin-bottom:14px;">
      <span style="font-size:12px;font-weight:700;color:#DC2626">현지 미납 금액 (전체 N분의1 전기세/세탁 초과금 포함)</span>
      <span style="font-size:16px;font-weight:800;color:#DC2626">$${unpaid.toLocaleString()}</span>
    </div>
    <table class="tsa-table">
      <thead>
        <tr>
          <th>청구 항목명</th>
          <th>청구 비용</th>
          <th>수납 여부</th>
          <th style="text-align:center">수납 처리</th>
        </tr>
      </thead>
      <tbody>
        ${s.fees.map(f => `
          <tr>
            <td style="font-weight:600;font-size:12.5px">${f.item}</td>
            <td style="font-weight:700;color:#374151">$${f.amount}</td>
            <td>
              <span class="tsa-badge ${f.paid ? 'tsa-badge-success' : 'tsa-badge-danger'}">
                ${f.paid ? '수납 완료' : '미납'}
              </span>
            </td>
            <td style="text-align:center">
              <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="toggleFeePaid(${s.id}, ${f.id})">
                ${f.paid ? '수납 취소' : '수납 확인'}
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function toggleFeePaid(studentId, feeId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (s) {
    const fee = s.fees.find(f => f.id === feeId);
    if (fee) {
      fee.paid = !fee.paid;
      showToast(`✓ [수납 상태 변동] ${fee.item} 수납 처리가 변경되었습니다.`, 'success');
      renderFeesTab();
    }
  }
}

function printDiploma() {
  const s = APP.currentStudent;
  if (!s) return;
  if (s.attendance < 85) {
    showToast(`졸업장 발급 불가: 출석률 ${s.attendance}% — 최소 85% 필요`, 'danger');
    return;
  }
  showToast(`🎓 졸업장 발급 승인 — ${s.nick} (${s.name}) · 출석률 ${s.attendance}%`, 'success');
}

/* =============================================
   STUDENT REGISTER & EDIT FORM HANDLERS
   ============================================= */
function getNationalityFlag(nat) {
  const flags = {
    '한국': '🇰🇷',
    '일본': '🇯🇵',
    '중국': '🇨🇳',
    '베트남': '🇻🇳',
    '대만': '🇹🇼',
    '사우디': '🇸🇦'
  };
  return flags[nat] || '🏳️';
}

let sfFiles = { passport: null, ticket: null, photo: null, insurance: null };
let sfProfilePhotoData = null;
let adProfilePhotoData = null;

function previewAdminStudentDetailPhoto(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 등록할 수 있습니다.', 'warning');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = event => {
    adProfilePhotoData = event.target.result;
    const preview = document.getElementById('ad-profile-photo-preview');
    const name = document.getElementById('ad-profile-photo-name');
    if (preview) preview.innerHTML = `<img src="${adProfilePhotoData}" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>`;
    if (name) name.textContent = `✓ ${file.name}`;
    const headerAvatar = document.getElementById('modal-student-avatar');
    if (headerAvatar) headerAvatar.src = adProfilePhotoData;
  };
  reader.readAsDataURL(file);
}

function handleSfDobChange() {
  const dobVal = document.getElementById('sf-dob').value;
  if (!dobVal) return;

  const today = new Date();
  const birthDate = new Date(dobVal);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  document.getElementById('sf-age').value = age;
  const preview = document.getElementById('sf-age-preview');
  if (preview) preview.textContent = `(만 ${age}세)`;
}

function previewStudentFormProfilePhoto(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 등록할 수 있습니다.', 'warning');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = event => {
    sfProfilePhotoData = event.target.result;
    const preview = document.getElementById('sf-profile-photo-preview');
    const name = document.getElementById('sf-profile-photo-name');
    if (preview) preview.innerHTML = `<img src="${sfProfilePhotoData}" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>`;
    if (name) name.textContent = `✓ ${file.name}`;
  };
  reader.readAsDataURL(file);
}

function handleSfFileSelected(key) {
  const input = document.getElementById('sf-file-' + key);
  const badge = document.getElementById('sf-badge-' + key);
  if (input && input.files[0]) {
    sfFiles[key] = input.files[0].name;
    if (badge) { badge.textContent = '제출완료'; badge.className = 'tsa-badge tsa-badge-success'; badge.style.fontSize = '9px'; }
  }
}

// 등록 에이전시 select를 MOCK_AGENCIES 기준으로 채운다 ('직접 등록' 포함, 활성 에이전시만)
function populateSfRegAgencyOptions(selected) {
  const sel = document.getElementById('sf-reg-agency');
  if (!sel) return;
  const agencies = (typeof MOCK_AGENCIES !== 'undefined')
    ? MOCK_AGENCIES.filter(a => a.status === 'active' && a.name !== '직접 등록')
    : [];
  sel.innerHTML = `<option value="직접 등록">🏢 직접 등록 (에이전시 미경유)</option>`
    + agencies.map(a => `<option value="${a.name}">${a.flag || ''} ${a.name} · ${a.contact}</option>`).join('');
  sel.value = selected && [...sel.options].some(o => o.value === selected) ? selected : '직접 등록';
}

function openStudentRegisterModal() {
  sfFiles = { passport: null, ticket: null, photo: null, insurance: null };
  sfProfilePhotoData = null;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  // 에이전시 포탈과 동일한 레이아웃 — 신규 등록은 기본 인적사항 카드 1개만 단일 컬럼으로 보여주고
  // 여권·항공·비자(B), 수강·기숙사(C), 서류업로드(D)는 '상세/수정'에서 나중에 입력한다.
  const titleEl = document.getElementById('student-form-title');
  if (titleEl) titleEl.textContent = '👤 신규 학생 등록';
  const subtitleEl = document.getElementById('student-form-subtitle');
  if (subtitleEl) subtitleEl.textContent = '학생 기본 인적 사항만 먼저 등록합니다. 나머지 정보는 등록 후 상세/수정에서 입력합니다.';
  const sectionB = document.getElementById('sf-section-b');
  if (sectionB) sectionB.style.display = 'none';
  const sectionCD = document.getElementById('sf-section-cd');
  if (sectionCD) sectionCD.style.display = 'none';
  const outerGrid = document.getElementById('sf-outer-grid');
  if (outerGrid) outerGrid.style.gridTemplateColumns = '1fr';
  const modalBox = document.getElementById('student-form-modal-box');
  if (modalBox) modalBox.style.maxWidth = '760px';
  const submitLabel = document.getElementById('student-form-submit-label');
  if (submitLabel) submitLabel.textContent = '기본정보 등록';
  const photoPreview = document.getElementById('sf-profile-photo-preview');
  if (photoPreview) photoPreview.innerHTML = `<img src="assets/images/student_male.png" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>`;
  const photoName = document.getElementById('sf-profile-photo-name');
  if (photoName) photoName.textContent = '등록된 사진 없음';
  const agePreview = document.getElementById('sf-age-preview');
  if (agePreview) agePreview.textContent = '';
  const resetBadge = key => {
    const b = document.getElementById('sf-badge-' + key);
    if (b) { b.textContent = '없음'; b.className = 'tsa-badge tsa-badge-gray'; b.style.fontSize = '9px'; }
    const f = document.getElementById('sf-file-' + key);
    if (f) f.value = '';
  };

  setVal('sf-id', '');
  setVal('sf-name', '');
  setVal('sf-nick', '');
  setVal('sf-gender', '남');
  setVal('sf-dob', '');
  setVal('sf-age', '');
  setVal('sf-reg-nationality', '한국');
  setVal('sf-phone', '');
  setVal('sf-email', '');
  setVal('sf-emergency', '');
  setVal('sf-diet', '일반식');
  setVal('sf-health', '');
  setVal('sf-passportNum', '');
  setVal('sf-passportExpiry', '');
  setVal('sf-flight-num', '');
  setVal('sf-flight-date', '');
  setVal('sf-flight-time', '');
  setVal('sf-flight-out-num', '');
  setVal('sf-departure', '');
  setVal('sf-flight-out-time', '');
  setVal('sf-visa', '');
  setVal('sf-ssp', '면제');
  setVal('sf-reg-course', '일반 코스');
  setVal('sf-duration', '4');
  setVal('sf-startDate', '');
  setVal('sf-endDate', '');
  setVal('sf-level', '');
  populateSfRegAgencyOptions('직접 등록');
  setVal('sf-status', 'waiting');
  setVal('sf-dormAccomType', '');
  setVal('sf-dorm-in', '');
  setVal('sf-dorm-out', '');
  ['passport','ticket','photo','insurance'].forEach(resetBadge);

  openModal('student-form-modal');
}

function openStudentEditModal(id) {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  document.getElementById('student-form-title').textContent = `👤 학생 정보 수정 - ${s.nick}`;
  document.getElementById('student-form-subtitle').textContent = "선택한 학생의 등록 세부 정보를 업데이트합니다.";
  const sectionBEl = document.getElementById('sf-section-b');
  if (sectionBEl) sectionBEl.style.display = '';
  const sectionCDEl = document.getElementById('sf-section-cd');
  if (sectionCDEl) sectionCDEl.style.display = '';
  const outerGridEl = document.getElementById('sf-outer-grid');
  if (outerGridEl) outerGridEl.style.gridTemplateColumns = '1fr 1fr';
  const modalBoxEl = document.getElementById('student-form-modal-box');
  if (modalBoxEl) modalBoxEl.style.maxWidth = '';
  const submitLabelEl = document.getElementById('student-form-submit-label');
  if (submitLabelEl) submitLabelEl.textContent = '저장 완료';
  const photoPreviewEl = document.getElementById('sf-profile-photo-preview');
  if (photoPreviewEl) photoPreviewEl.innerHTML = `<img src="${s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png')}" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>`;
  const photoNameEl = document.getElementById('sf-profile-photo-name');
  if (photoNameEl) photoNameEl.textContent = s.profilePhoto ? '등록된 사진 있음' : '등록된 사진 없음';
  sfProfilePhotoData = s.profilePhoto || null;

  // Populate form
  document.getElementById('sf-id').value = s.id;
  document.getElementById('sf-passportNum').value = s.passportNum || "";
  document.getElementById('sf-startDate').value = s.startDate || "";
  document.getElementById('sf-name').value = s.name || "";
  document.getElementById('sf-nick').value = s.nick || "";
  document.getElementById('sf-gender').value = s.gender || "남";
  document.getElementById('sf-age').value = s.age || "";
  document.getElementById('sf-reg-nationality').value = s.nationality || "한국";
  document.getElementById('sf-reg-course').value = s.course || "일반 코스";
  document.getElementById('sf-duration').value = s.duration || "4";
  document.getElementById('sf-endDate').value = s.endDate || "";
  document.getElementById('sf-level').value = s.level || "";
  document.getElementById('sf-dorm').value = s.dorm || "";
  populateSfRegAgencyOptions(s.agency || "직접 등록");
  document.getElementById('sf-visa').value = s.visaExpiry || "";
  document.getElementById('sf-ssp').value = s.sspExpiry || "면제";
  document.getElementById('sf-passport').value = s.passportStatus || "보관 중";
  document.getElementById('sf-flight').value = s.flightInfo || "";
  document.getElementById('sf-departure').value = s.departureDate || "";
  document.getElementById('sf-diet').value = s.dietType || "일반식";
  document.getElementById('sf-status').value = s.status || "waiting";
  document.getElementById('sf-health').value = s.healthNotes || "";

  // Close details modal if open
  closeModal('student-detail-modal');
  openModal('student-form-modal');
}

function updateSfEndDate() {
  const startEl = document.getElementById('sf-startDate');
  const durEl = document.getElementById('sf-duration');
  const endEl = document.getElementById('sf-endDate');
  if (!startEl || !durEl || !endEl || !startEl.value) { if (endEl) endEl.value = ''; return; }
  const start = new Date(startEl.value);
  start.setDate(start.getDate() + parseInt(durEl.value) * 7);
  endEl.value = start.toISOString().split('T')[0];
}

function saveStudentForm() {
  const idVal = document.getElementById('sf-id').value;
  const passportNum = document.getElementById('sf-passportNum').value.trim();
  const startDate = document.getElementById('sf-startDate').value;
  const name = document.getElementById('sf-name').value.trim();
  const nick = document.getElementById('sf-nick').value.trim();
  const gender = document.getElementById('sf-gender').value;
  const age = parseInt(document.getElementById('sf-age').value);
  const phone = document.getElementById('sf-phone')?.value.trim() || '';
  const email = document.getElementById('sf-email')?.value.trim() || '';
  const emergencyContact = document.getElementById('sf-emergency')?.value.trim() || '';

  // 신규 등록 시에는 에이전시 포탈과 동일하게 기본 인적사항만 검증 (여권·수강 정보는 상세/수정에서 나중에 입력)
  if (!idVal) {
    if (!name || !nick || !gender || !document.getElementById('sf-reg-nationality').value || !phone || !email || !emergencyContact) {
      showToast('⚠ 기본 인적 사항의 필수 항목을 모두 입력해 주세요.', 'danger');
      return;
    }
    if (isNaN(age)) {
      showToast('생년월일을 입력해 주세요.', 'danger');
      return;
    }
    if (passportNum) {
      const dupPassport = MOCK_STUDENTS.find(s => s.passportNum && s.passportNum.toUpperCase() === passportNum.toUpperCase());
      if (dupPassport) {
        showToast(`중복된 여권번호입니다 — 이미 등록된 학생: ${dupPassport.nick} (${dupPassport.name})`, 'danger');
        return;
      }
    }
  }
  const nationality = document.getElementById('sf-reg-nationality').value;
  const course = document.getElementById('sf-reg-course').value;
  const duration = parseInt(document.getElementById('sf-duration').value);
  const dormAccomType = (document.getElementById('sf-dormAccomType') || {}).value || '';
  const dormCapacity  = (document.getElementById('sf-dormCapacity')  || {}).value || '';
  const dormGrade     = (document.getElementById('sf-dormGrade')     || {}).value || '';
  const dorm = '미배정';
  const agency = (document.getElementById('sf-reg-agency')?.value || '직접 등록').trim();
  const visaExpiry = document.getElementById('sf-visa').value;
  const sspExpiry = document.getElementById('sf-ssp').value.trim();
  const passportStatus = document.getElementById('sf-passport').value;
  const flightInfo = document.getElementById('sf-flight').value.trim();
  const departureDate = document.getElementById('sf-departure').value;
  const dietType = document.getElementById('sf-diet').value;
  const status = document.getElementById('sf-status').value;
  const healthNotes = document.getElementById('sf-health').value.trim();
  const level = (document.getElementById('sf-level') || {}).value || '';

  const flag = getNationalityFlag(nationality);

  if (idVal) {
    // Edit
    const s = MOCK_STUDENTS.find(std => std.id == idVal);
    if (s) {
      const oldNick = s.nick;
      s.name = name;
      s.nick = nick;
      s.gender = gender;
      s.age = age;
      s.nationality = nationality;
      s.flag = flag;
      s.phone = phone;
      s.email = email;
      s.emergencyContact = emergencyContact;
      if (sfProfilePhotoData) s.profilePhoto = sfProfilePhotoData;
      s.course = course;
      s.duration = duration;
      if (dormAccomType) { s.dormAccomType = dormAccomType; s.dormType = dormCapacity; s.dormGrade = dormGrade; }
      s.agency = agency;
      s.passportNum = passportNum ? passportNum.toUpperCase() : s.passportNum;
      s.visaExpiry = visaExpiry;
      s.sspExpiry = sspExpiry;
      s.passportStatus = passportStatus;
      s.flightInfo = flightInfo;
      s.departureDate = departureDate || "";
      s.dietType = dietType;
      s.status = status;
      s.healthNotes = healthNotes || "특이사항 없음.";
      s.level = level;

      if (startDate) {
        s.startDate = startDate;
        s.arrivalDate = startDate;
        const start = new Date(startDate);
        start.setDate(start.getDate() + duration * 7);
        s.endDate = start.toISOString().split('T')[0];
      }

      // Update student nickname in MOCK_TIMETABLE slots too!
      MOCK_TIMETABLE.forEach(t => {
        t.slots.forEach(slot => {
          if (slot.student === oldNick) {
            slot.student = nick;
          }
        });
      });

      showToast(`✓ [학생 수정 완료] ${s.nick} 학생의 상세 정보가 성공적으로 반영되었습니다.`, 'success');
    }
  } else {
    // Register new student — 에이전시 포탈과 동일하게 기본 인적사항만으로 등록, 나머지는 '상세/수정'에서 나중에 입력
    const newId = Math.max(...MOCK_STUDENTS.map(std => std.id), 0) + 1;

    const newStudent = {
      id: newId,
      passportNum: '',
      startDate: '',
      arrivalDate: '',
      endDate: '',
      name: name,
      nick: nick,
      gender: gender,
      age: age,
      nationality: nationality,
      flag: flag,
      phone: phone,
      email: email,
      emergencyContact: emergencyContact,
      profilePhoto: sfProfilePhotoData,
      agency: agency,
      remittanceRoute: agency === '직접 등록' ? 'direct' : 'agency',
      course: '미등록',
      duration: 0,
      level: '',
      dorm: '미배정',
      dormAccomType: null,
      dormType: null,
      dormGrade: null,
      visaExpiry: '',
      sspExpiry: '면제',
      passportStatus: '미등록',
      flightInfo: '',
      departureDate: '',
      dietType: dietType,
      status: 'waiting',
      healthNotes: healthNotes || "특이사항 없음.",
      attendance: 0,
      warning: 0,
      quiz: [],
      grades: { speaking: [], listening: [], reading: [], writing: [] },
      fees: [],
      remittanceStatus: 'unpaid',
    };
    MOCK_STUDENTS.push(newStudent);
    showToast(`✓ [학생 등록 완료] 신규 입학생 ${nick} (${name})이 성공적으로 등록되었습니다. 수강·기숙사 정보는 상세/수정에서 이어서 입력해줘.`, 'success');
  }

  closeModal('student-form-modal');
  enhanceMockStudents();
  updateAdminKPIs();
  updateAgencyKPIs();
  filterStudentList(APP.activeStudentFilter || 'all');
  renderUnassignedQueue();
  renderTimetable(APP.conflictMode);
}

/* =============================================
   DORMITORY & ERP
   ============================================= */
let _ganttYear = 2026;
let _ganttMonth = 6;
let _dormFilters = { accom: '', capacity: '', condition: '', gender: '', occ: '', assigned: '', dateFrom: '', dateTo: '' };
let _checkoutWeekFilter = false;

function toggleCheckoutWeekFilter() {
  _checkoutWeekFilter = !_checkoutWeekFilter;
  const card = document.getElementById('dorm-kpi-checkout-card');
  if (card) {
    card.style.background = _checkoutWeekFilter ? '#FEF2F2' : '';
    card.style.cursor = 'pointer';
    const badge = document.getElementById('dorm-kpi-checkout-badge');
    if (badge) badge.style.display = _checkoutWeekFilter ? 'inline-block' : 'none';
  }
  initDormGantt();
}

function applyDormFilters() {
  const g = id => (document.getElementById(id) || {}).value || '';
  _dormFilters.accom        = g('dorm-filter-accom');
  _dormFilters.capacity     = g('dorm-filter-capacity');
  _dormFilters.condition    = g('dorm-filter-condition');
  _dormFilters.gender       = g('dorm-filter-gender');
  _dormFilters.occ          = g('dorm-filter-occ');
  _dormFilters.assigned     = g('dorm-filter-assigned');
  _dormFilters.dateFrom = g('dorm-filter-date-from');
  _dormFilters.dateTo   = g('dorm-filter-date-to');

  // 기간 시작일이 있으면 Gantt를 해당 월로 이동
  if (_dormFilters.dateFrom) {
    const d = new Date(_dormFilters.dateFrom);
    _ganttYear  = d.getFullYear();
    _ganttMonth = d.getMonth() + 1;
    const label = document.getElementById('gantt-month-label');
    if (label) label.textContent = _ganttYear + '년 ' + _ganttMonth + '월 현황';
  }

  renderDormAssignPending();
  renderAdminDormRoomsTable();
}

function jumpToDormRoomsTab(accom, capacity, condition) {
  const capVal = String(capacity).replace('인실', '');
  _dormFilters.accom     = accom;
  _dormFilters.capacity  = capVal;
  _dormFilters.condition = condition;
  _dormFilters.gender = ''; _dormFilters.occ = ''; _dormFilters.assigned = '';
  _dormFilters.dateFrom = ''; _dormFilters.dateTo = '';
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('dorm-filter-accom', accom);
  setVal('dorm-filter-capacity', capVal);
  setVal('dorm-filter-condition', condition);
  setVal('dorm-filter-gender', '');
  setVal('dorm-filter-occ', '');
  setVal('dorm-filter-assigned', '');
  setVal('dorm-filter-date-from', '');
  setVal('dorm-filter-date-to', '');
  switchAdminDormTab('gantt');
}

function resetDormFilters() {
  _dormFilters = { accom: '', capacity: '', condition: '', gender: '', occ: '', assigned: '', dateFrom: '', dateTo: '' };
  ['dorm-filter-accom','dorm-filter-capacity','dorm-filter-condition','dorm-filter-gender','dorm-filter-occ',
   'dorm-filter-assigned','dorm-filter-date-from','dorm-filter-date-to']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  // Gantt 월도 현재 날짜 기준으로 복원
  const now = new Date('2026-06-16');
  _ganttYear  = now.getFullYear();
  _ganttMonth = now.getMonth() + 1;
  renderDormAssignPending();
  renderAdminDormRoomsTable();
}

function getFilteredDormRooms() {
  const today = new Date('2026-06-16');
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 6);

  return MOCK_DORM_ROOMS.filter(r => {
    if (!r.roomNo) return false;
    if (_dormFilters.accom && r.accomType !== _dormFilters.accom) return false;
    if (_dormFilters.capacity) {
      const cap = parseInt(_dormFilters.capacity);
      if (r.beds && r.beds.length !== cap) return false;
    }
    if (_dormFilters.condition && r.type && !r.type.includes(_dormFilters.condition)) return false;
    if (_dormFilters.gender && r.genderRestriction !== _dormFilters.gender) return false;
    if (_dormFilters.assigned) {
      if (_dormFilters.assigned === 'assigned'   && !r.roomNo) return false;
      if (_dormFilters.assigned === 'unassigned' &&  r.roomNo) return false;
    }
    if (_dormFilters.occ) {
      const occupiedCount = r.beds ? r.beds.filter(b => b.student).length : 0;
      const totalBeds = r.beds ? r.beds.length : 0;
      if (_dormFilters.occ === 'occupied' && occupiedCount === 0) return false;
      if (_dormFilters.occ === 'full'     && occupiedCount < totalBeds) return false;
      if (_dormFilters.occ === 'vacant'   && (occupiedCount > 0 || r.roomNo === null)) return false;
    }
    if (_checkoutWeekFilter) {
      const hasCheckoutThisWeek = r.beds && r.beds.some(b =>
        b.student && b.end && (() => { const d = new Date(`2026-${b.end}`); return d >= today && d <= weekEnd; })()
      );
      if (!hasCheckoutThisWeek) return false;
    }
    // 기간 필터: 선택 기간과 학생 숙박 기간이 겹치는 호실만 표시
    // 미배정 방(roomNo: null)은 기간 필터와 무관하게 항상 포함
    if ((_dormFilters.dateFrom || _dormFilters.dateTo) && r.roomNo !== null) {
      const from = _dormFilters.dateFrom ? new Date(_dormFilters.dateFrom) : null;
      const to   = _dormFilters.dateTo   ? new Date(_dormFilters.dateTo)   : null;
      const match = r.beds && r.beds.some(b => {
        if (!b.student || !b.start || !b.end) return false;
        const bStart = new Date(`${_ganttYear}-${b.start}`);
        const bEnd   = new Date(`${_ganttYear}-${b.end}`);
        if (from && bEnd < from) return false;
        if (to   && bStart > to) return false;
        return true;
      });
      if (!match) return false;
    }
    return true;
  });
}

function shiftGanttMonth(delta) {
  _ganttMonth += delta;
  if (_ganttMonth < 1) { _ganttMonth = 12; _ganttYear--; }
  if (_ganttMonth > 12) { _ganttMonth = 1; _ganttYear++; }
  const label = document.getElementById('gantt-month-label');
  if (label) label.textContent = _ganttYear + '년 ' + _ganttMonth + '월 현황';
  initDormGantt();
}

function initDormGantt() {
  const container = document.getElementById('dorm-gantt-container');
  if (!container) return;

  // ── 날짜 범위 설정 (해당 월 1일 ~ 말일) ──
  const RANGE_START = new Date(_ganttYear, _ganttMonth - 1, 1);
  const RANGE_END   = new Date(_ganttYear, _ganttMonth, 0); // 말일
  const TOTAL_DAYS  = (RANGE_END - RANGE_START) / 86400000 + 1;
  const today       = new Date('2026-06-15');

  function dayOffset(d) { return Math.max(0, Math.min(TOTAL_DAYS - 1, (d - RANGE_START) / 86400000)); }
  function pct(d)       { return (dayOffset(d) / TOTAL_DAYS * 100).toFixed(3) + '%'; }
  function widthPct(s, e) {
    const clamped = Math.max(0, Math.min(TOTAL_DAYS, (new Date(e) - Math.max(new Date(s), RANGE_START)) / 86400000 + 1));
    return (clamped / TOTAL_DAYS * 100).toFixed(3) + '%';
  }

  // ── KPI 계산 ──
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 6);

  const assignedRooms   = MOCK_DORM_ROOMS.filter(r => r.roomNo);
  const unassignedRooms = MOCK_DORM_ROOMS.filter(r => !r.roomNo);

  // 배정 호실 기준 침대 집계
  let activeBeds = 0, occupiedBeds = 0, vacantBeds = 0;
  let thisWeekCheckout = 0;
  const checkoutNames = [];
  assignedRooms.forEach(room => {
    room.beds.forEach(bed => {
      activeBeds++;
      if (bed.student && bed.end) {
        const bedEnd = new Date(`2026-${bed.end}`);
        if (bedEnd >= today) {
          occupiedBeds++;
          if (bedEnd <= weekEnd) { thisWeekCheckout++; checkoutNames.push(bed.student.split(' ')[0]); }
        } else {
          vacantBeds++;
        }
      } else {
        vacantBeds++;
      }
    });
  });
  const occRate = activeBeds > 0 ? Math.round(occupiedBeds / activeBeds * 100) : 0;

  // 숙소 유형별 호실 수
  const roomsByAccom = {};
  assignedRooms.forEach(r => {
    const k = r.accomType || '기타';
    roomsByAccom[k] = (roomsByAccom[k] || 0) + 1;
  });
  const roomsDetailHtml = Object.entries(roomsByAccom)
    .map(([k,v]) => `<span style="display:inline-block;margin-right:8px;font-size:10.5px"><span style="font-weight:700;color:${k==='콘도'?'#D97706':'#5E5CE6'}">${k}</span> <span style="color:#374151">${v}호실</span></span>`)
    .join('');

  // 공실 유형별
  const vacantByType = {};
  assignedRooms.forEach(room => {
    room.beds.forEach(bed => {
      if (!bed.student || (bed.end && new Date(`2026-${bed.end}`) < today)) {
        const k = room.type.split(' ')[0];
        vacantByType[k] = (vacantByType[k] || 0) + 1;
      }
    });
  });
  const vacantDetailHtml = Object.entries(vacantByType)
    .map(([k,v]) => `<span style="display:inline-block;margin-right:8px;font-size:10.5px;color:#374151">${k} <b>${v}</b>개</span>`)
    .join('');

  // KPI DOM 업데이트
  const el = id => document.getElementById(id);
  if (el('dorm-kpi-rooms-assigned')) el('dorm-kpi-rooms-assigned').textContent = assignedRooms.length + '호실 운영 중';
  if (el('dorm-kpi-rooms-total'))    el('dorm-kpi-rooms-total').textContent    = MOCK_DORM_ROOMS.length;
  if (el('dorm-kpi-rooms-detail'))   el('dorm-kpi-rooms-detail').innerHTML     =
    `${roomsDetailHtml}<span style="font-size:10.5px;color:#9CA3AF">미배정 ${unassignedRooms.length}호실</span>`;
  if (el('dorm-kpi-occ'))            el('dorm-kpi-occ').textContent            = occRate + '%';
  if (el('dorm-kpi-occ-detail'))     el('dorm-kpi-occ-detail').textContent     = `${occupiedBeds}/${activeBeds} 침대`;
  if (el('dorm-kpi-occ-bar'))        el('dorm-kpi-occ-bar').style.width        = occRate + '%';
  if (el('dorm-kpi-vacant'))         el('dorm-kpi-vacant').textContent         = vacantBeds + '개';
  if (el('dorm-kpi-vacant-detail'))  el('dorm-kpi-vacant-detail').innerHTML    = vacantDetailHtml || '<span style="font-size:10.5px;color:#9CA3AF">공실 없음</span>';
  if (el('dorm-kpi-checkout'))       el('dorm-kpi-checkout').textContent       = thisWeekCheckout + '명';
  if (el('dorm-kpi-checkout-names')) el('dorm-kpi-checkout-names').textContent = checkoutNames.length > 0 ? checkoutNames.slice(0,3).join(', ') + (checkoutNames.length > 3 ? ' 외' : '') : '없음';

  // ── 날짜 헤더 틱마크 (매주 월요일 기준 7일 간격) ──
  const tickHtml = (() => {
    let html = `<div style="position:relative;height:30px;margin-left:160px;margin-bottom:2px;border-bottom:1px solid #E9EDF4">`;
    for (let i = 0; i <= TOTAL_DAYS; i += 7) {
      const d = new Date(RANGE_START); d.setDate(d.getDate() + i);
      const label = `${d.getMonth()+1}/${d.getDate()}`;
      const left  = (i / TOTAL_DAYS * 100).toFixed(2) + '%';
      html += `<div style="position:absolute;left:${left};top:0;transform:translateX(-50%);font-size:9.5px;color:#9CA3AF;white-space:nowrap;font-weight:600">${label}</div>`;
    }
    html += '</div>';
    return html;
  })();

  // ── Today 라인 위치 ──
  const todayLeft = pct(today);

  // ── 바 색상 팔레트 ──
  const BAR_COLORS = ['#5E5CE6','#10B981','#F59E0B','#EF4444','#8B5CF6','#06B6D4','#EC4899','#84CC16'];
  let colorIdx = 0;
  const studentColorMap = {};
  function getStudentColor(name) {
    if (!studentColorMap[name]) { studentColorMap[name] = BAR_COLORS[colorIdx++ % BAR_COLORS.length]; }
    return studentColorMap[name];
  }

  // ── 방 카드 렌더 (필터 적용) ──
  const filteredRooms = getFilteredDormRooms();
  const roomCards = filteredRooms.map(room => {
    const roomIdx = MOCK_DORM_ROOMS.indexOf(room);
    const occupiedCount = room.beds.filter(b => b.student && b.end && new Date(`2026-${b.end}`) >= today).length;
    const totalBedCount = room.beds.length;
    const occPct = Math.round(occupiedCount / totalBedCount * 100);

    const bedRows = room.beds.map(bed => {
      // 과거 이력 바
      const historyBars = (bed.history || []).map(h => {
        const hStart = new Date(`2026-${h.start}`);
        const hEnd   = new Date(`2026-${h.end}`);
        if (hEnd < RANGE_START || hStart > RANGE_END) return '';
        const hLeft  = pct(hStart);
        const hWidth = widthPct(`2026-${h.start}`, `2026-${h.end}`);
        return `<div class="dorm-gantt-bar-abs" style="left:${hLeft};width:${hWidth};background:#9CA3AF;opacity:0.65;display:flex;align-items:center;gap:4px;overflow:hidden;white-space:nowrap" title="졸업: ${h.student} (${_ganttYear}-${h.start}~${_ganttYear}-${h.end})">
          <span style="font-weight:600;font-size:10px">${h.student.split(' ')[0]}</span>
          <span style="font-size:9px;opacity:0.9">${_ganttYear}-${h.start}~${_ganttYear}-${h.end}</span>
        </div>`;
      }).join('');

      let barHtml = '';
      if (bed.student && bed.start && bed.end) {
        const color = getStudentColor(bed.student.split(' ')[0]);
        const barLeft  = pct(new Date(`${_ganttYear}-${bed.start}`));
        const barWidth = widthPct(`${_ganttYear}-${bed.start}`, `${_ganttYear}-${bed.end}`);
        barHtml = `<div class="dorm-gantt-bar-abs" style="left:${barLeft};width:${barWidth};background:${color};display:flex;align-items:center;gap:5px;overflow:hidden;white-space:nowrap">
          <span style="font-weight:700;font-size:11px">${bed.student.split(' ')[0]}</span>
          <span style="font-size:9.5px;opacity:0.85">${_ganttYear}-${bed.start} ~ ${_ganttYear}-${bed.end}</span>
        </div>`;
        // 퇴실 후 빈 구간 → 사전 예약 가능
        const checkoutD = new Date(`${_ganttYear}-${bed.end}`);
        if (checkoutD < RANGE_END) {
          const vLeft  = pct(checkoutD);
          const rangeEndStr = `${_ganttYear}-${String(RANGE_END.getMonth()+1).padStart(2,'0')}-${String(RANGE_END.getDate()).padStart(2,'0')}`;
          const vWidth = widthPct(`${_ganttYear}-${bed.end}`, rangeEndStr);
          barHtml += `<div class="dorm-gantt-vacant" style="position:absolute;left:${vLeft};width:${vWidth};cursor:pointer" onclick="openBedAssignModal(${roomIdx},'${bed.id}','${bed.end}')" title="퇴실 후 사전 예약 가능"></div>`;
        }
      } else {
        barHtml = `<div class="dorm-gantt-vacant" style="cursor:pointer;width:100%" onclick="openBedAssignModal(${roomIdx},'${bed.id}','')" title="클릭하여 학생 배정"></div>`;
      }

      // 사전 예약 바 (보라색 점선)
      const reservationBars = (bed.reservations || []).map(rv => {
        const rvStart = new Date(`${_ganttYear}-${rv.start}`);
        const rvEnd   = new Date(`${_ganttYear}-${rv.end}`);
        if (rvEnd < RANGE_START || rvStart > RANGE_END) return '';
        const rvLeft  = pct(rvStart);
        const rvWidth = widthPct(`${_ganttYear}-${rv.start}`, `${_ganttYear}-${rv.end}`);
        return `<div class="dorm-gantt-bar-abs" style="left:${rvLeft};width:${rvWidth};background:#EDE9FE;border:2px dashed #7C3AED;display:flex;align-items:center;gap:4px;overflow:hidden;white-space:nowrap" title="사전예약: ${rv.student}">
          <span style="font-weight:700;font-size:10px;color:#7C3AED">📋 ${rv.student.split(' ')[0]}</span>
          <span style="font-size:9px;color:#7C3AED">${_ganttYear}-${rv.start}~${_ganttYear}-${rv.end}</span>
        </div>`;
      }).join('');

      barHtml = historyBars + barHtml + reservationBars;
      // 대기 중인 부킹 요청
      const pendingReqs = MOCK_DORM_BOOK_REQUESTS.filter(r => r.roomNo === room.roomNo && r.bedId === bed.id && r.status === 'pending');
      const pendingBars = pendingReqs.map(r => {
        const pLeft  = pct(new Date(r.startDate));
        const pWidth = widthPct(r.startDate, r.endDate);
        return `<div class="dorm-gantt-bar-abs" style="left:${pLeft};width:${pWidth};background:#F59E0B;opacity:0.85">[대기] ${r.studentName}</div>`;
      }).join('');

      return `
        <div class="dorm-gantt-bed-row" style="display:flex;align-items:center;min-height:36px;border-top:1px solid #F3F4F6">
          <div class="dorm-gantt-bed-label" style="width:160px;flex-shrink:0;font-size:10px;font-weight:700;color:#9CA3AF;padding:0 12px">Bed ${bed.id}${bed.student ? ' · ' + bed.student.split(' ')[0] : ' · 공실'}</div>
          <div class="dorm-gantt-bed-track" style="position:relative;flex:1;height:36px;overflow:hidden">${barHtml}${pendingBars}</div>
        </div>`;
    }).join('');

    const roomColor = occPct >= 100 ? '#EF4444' : occPct >= 60 ? '#F59E0B' : '#10B981';

    return `
      <div class="dorm-gantt-room-card" style="border:1.5px solid #E9EDF4;border-radius:12px;overflow:hidden;margin-bottom:10px">
        <div class="dorm-gantt-room-header" style="background:#F8F9FC;padding:9px 12px;display:flex;align-items:center;gap:12px;position:relative;border-bottom:1px solid #E9EDF4;cursor:pointer" onclick="openRoomDetailModal(${roomIdx})" title="방 상세 보기">
          <div style="width:300px;flex-shrink:0;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            ${room.accomType === '콘도'
              ? `<span style="font-size:10px;background:#FEF3C7;color:#D97706;padding:1px 7px;border-radius:10px;font-weight:700">콘도</span>`
              : `<span style="font-size:10px;background:#EEF2FF;color:#5E5CE6;padding:1px 7px;border-radius:10px;font-weight:700">기숙사</span>`}
            <span style="font-size:12.5px;font-weight:800;color:#1A1D23">Room ${room.roomNo || '미배정'}</span>
            <span style="font-size:10px;background:#F3F4F6;color:#6B7280;padding:1px 7px;border-radius:10px;font-weight:700">${room.type.split(' ')[0]}</span>
            ${(() => {
              const condMatch = room.type.match(/\((.+)\)/);
              const cond = condMatch ? condMatch[1] : '';
              const condColors = { '스탠다드': ['#F0FDF4','#16A34A'], '이코노미': ['#FFF7ED','#D97706'], '디럭스': ['#FAF5FF','#7C3AED'] };
              const [bg, color] = condColors[cond] || ['#F3F4F6','#6B7280'];
              return cond ? `<span style="font-size:10px;background:${bg};color:${color};padding:1px 7px;border-radius:10px;font-weight:700">${cond}</span>` : '';
            })()}
          </div>
          <div style="flex:1;position:relative">
            <!-- 오른쪽: 점유율 미니 바 -->
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;height:6px;background:#E9EDF4;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${occPct}%;background:${roomColor};border-radius:3px;transition:width 0.4s"></div>
              </div>
              <span style="font-size:10px;font-weight:700;color:${roomColor};width:30px;text-align:right">${occPct}%</span>
              <span style="font-size:10px;color:#9CA3AF">${occupiedCount}/${totalBedCount}석</span>
            </div>
          </div>
        </div>
        <div style="position:relative">
          ${bedRows}
          <!-- Today 라인 -->
          <div class="dorm-gantt-today-line" style="left:calc(160px + (100% - 160px) * ${(dayOffset(today) / TOTAL_DAYS).toFixed(4)})"></div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px;gap:8px">
      <div style="display:flex;align-items:center;gap:14px;flex:1">
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;border-radius:3px;background:#5E5CE6"></div><span style="font-size:10.5px;color:#6B7280">입실 중</span></div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;border-radius:3px;background:repeating-linear-gradient(45deg,#F0FDF4,#F0FDF4 3px,#DCFCE7 3px,#DCFCE7 6px);border:1px solid #BBF7D0"></div><span style="font-size:10.5px;color:#6B7280">공실</span></div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;border-radius:3px;background:#F59E0B"></div><span style="font-size:10.5px;color:#6B7280">대기 중</span></div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:14px;height:14px;border-radius:3px;background:#9CA3AF;opacity:0.65"></div><span style="font-size:10.5px;color:#6B7280">졸업(이력)</span></div>
        <div style="display:flex;align-items:center;gap:5px"><div style="width:2px;height:14px;background:#EF4444"></div><span style="font-size:10.5px;color:#6B7280">오늘</span></div>
      </div>
      <button class="tsa-btn tsa-btn-outline tsa-btn-sm" style="border-color:#10B981;color:#10B981" onclick="openDormRoomChangeModal()">🔄 룸 체인지</button>
      <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="openDormAssignModal()">＋ 호실 배정</button>
    </div>
    ${tickHtml}
    ${roomCards}
  `;
}

function openDormAssignModal() {
  const select = document.getElementById('dorm-student-select');
  if (!select) return;

  // Filter students who are not assigned to a bed in MOCK_DORM_ROOMS yet
  const assignedNames = [];
  MOCK_DORM_ROOMS.forEach(room => {
    room.beds.forEach(bed => { if (bed.student) assignedNames.push(bed.student.split(' ')[0]); });
  });

  const unassigned = MOCK_STUDENTS.filter(s => !assignedNames.some(name => s.nick.includes(name)));
  
  if (unassigned.length === 0) {
    select.innerHTML = `<option value="">모든 학생 기숙사 배정 완료</option>`;
  } else {
    select.innerHTML = unassigned.map(s => `<option value="${s.id}">${s.nick} (${s.name} - ${s.gender}성)</option>`).join('');
  }

  runDormRecommendation();
  openModal('dorm-assign-modal');
}

function runDormRecommendation() {
  const studentId = document.getElementById('dorm-student-select').value;
  const listEl = document.getElementById('dorm-recommend-list');
  const photoWrapper = document.getElementById('dorm-student-photo-wrapper');
  const photoImg = document.getElementById('dorm-student-photo');
  if (!listEl) return;
  if (!studentId) {
    if (photoWrapper) photoWrapper.style.display = 'none';
    listEl.innerHTML = `<div style="text-align:center;font-size:12px;color:#9CA3AF">배정할 학생을 먼저 선택하세요.</div>`;
    return;
  }

  const s = MOCK_STUDENTS.find(std => std.id == studentId);
  if (!s) {
    if (photoWrapper) photoWrapper.style.display = 'none';
    return;
  }

  if (photoWrapper && photoImg) {
    photoImg.src = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';
    photoWrapper.style.display = 'block';
  }

  // Rule: Recommend rooms whose genderRestriction matches student gender
  const matches = MOCK_DORM_ROOMS.filter(r => r.genderRestriction.includes(s.gender));
  
  if (matches.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;font-size:12px;color:#EF4444;font-weight:700">⚠ 학생의 성별(${s.gender}성)에 맞는 남은 공실 기숙사가 존재하지 않습니다.</div>`;
  } else {
    listEl.innerHTML = matches.map(room => {
      // Find first empty bed
      const emptyBed = room.beds.find(b => !b.student);
      if (!emptyBed) return '';

      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px">
          <div>
            <div style="font-size:13px;font-weight:700;color:#15803D">Room ${room.roomNo} - Bed ${emptyBed.id}</div>
            <div style="font-size:10.5px;color:#16A34A">${room.type} (성별 제한: ${room.genderRestriction} ✓)</div>
          </div>
          <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="background:#16A34A" onclick="assignStudentToDorm(${s.id}, '${room.roomNo}', '${emptyBed.id}')">즉시 배정</button>
        </div>
      `;
    }).join('') || `<div style="text-align:center;font-size:12px;color:#9CA3AF">만실입니다.</div>`;
  }
}

function assignStudentToDorm(studentId, roomNo, bedId) {
  const s = MOCK_STUDENTS.find(std => std.id == studentId);
  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (s && room) {
    const bed = room.beds.find(b => b.id === bedId);
    if (bed) {
      bed.student = `${s.nick} (${s.name.split(' ')[0]})`;
      bed.color = avatarColor(s.id);
      bed.start = '06-08';
      bed.end = '07-06';
      
      // Update student dorm string
      s.dorm = `Room ${roomNo} / Bed ${bedId}`;

      showToast(`✓ 기숙사 배정 완료: ${s.nick} 학생이 Room ${roomNo} / Bed ${bedId}에 입실 처리되었습니다.`, 'success');
      closeModal('dorm-assign-modal');
      initDormGantt();
      initStudentList(); // Refresh student table
    }
  }
}

function executeBatchProxyInput() {
  const e101 = parseFloat(document.getElementById('batch-elec-101').value) || 0;
  const e102 = parseFloat(document.getElementById('batch-elec-102').value) || 0;
  const e201 = parseFloat(document.getElementById('batch-elec-201').value) || 0;

  const wKevin = parseFloat(document.getElementById('batch-laundry-kevin').value) || 0;
  const wAmy = parseFloat(document.getElementById('batch-laundry-amy').value) || 0;
  const wSophie = parseFloat(document.getElementById('batch-laundry-sophie').value) || 0;

  // Append electricity bill & laundry excess bill dynamically to MOCK_STUDENTS fees list
  // Kevin (id: 1)
  const kevin = MOCK_STUDENTS.find(s => s.id === 1);
  if (kevin) {
    const share = Math.round(e101 / 2); // Room 101 has 2 occupants
    kevin.fees.push({ id: Date.now() + 1, item: `전기료 6월분 (Room 101 N/1 분담: ${share}페소)`, amount: Math.round(share / 50), paid: false }); // approx $
    if (wKevin > 3.0) {
      const excess = Math.max(0, wKevin - 3.0);
      kevin.fees.push({ id: Date.now() + 2, item: `세탁 초과 과금 (${wKevin}kg - 초과 ${excess.toFixed(1)}kg)`, amount: Math.round(excess * 2), paid: false });
    }
  }

  // Amy (id: 3)
  const amy = MOCK_STUDENTS.find(s => s.id === 3);
  if (amy) {
    const share = Math.round(e102 / 2); // Room 102 has 2 occupants
    amy.fees.push({ id: Date.now() + 3, item: `전기료 6월분 (Room 102 N/1 분담: ${share}페소)`, amount: Math.round(share / 50), paid: false });
    if (wAmy > 3.0) {
      const excess = Math.max(0, wAmy - 3.0);
      amy.fees.push({ id: Date.now() + 4, item: `세탁 초과 과금 (${wAmy}kg)`, amount: Math.round(excess * 2), paid: false });
    }
  }

  // Sophie (id: 5)
  const sophie = MOCK_STUDENTS.find(s => s.id === 5);
  if (sophie) {
    const share = e201; // Room 201 is 1-person private
    sophie.fees.push({ id: Date.now() + 5, item: `전기료 6월분 (Room 201 독채: ${share}페소)`, amount: Math.round(share / 50), paid: false });
    if (wSophie > 3.0) {
      const excess = Math.max(0, wSophie - 3.0);
      sophie.fees.push({ id: Date.now() + 6, item: `세탁 초과 과금 (${wSophie}kg)`, amount: Math.round(excess * 2), paid: false });
    }
  }

  showToast(`✓ 어드민 일괄 대리 입력 데이터 반영 완료! (각 학생 로컬피 원장에 청구서 자동 가산되었습니다.)`, 'success');
}

function calculateElectricity() {
  const inputEl = document.getElementById('elec-total-charge');
  if (!inputEl) return;
  const total = parseFloat(inputEl.value) || 0;
  const occupants = 2; 
  const perPerson = Math.round(total / occupants);
  const el = document.getElementById('elec-result-box');
  if (!el) return;
  el.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:#92400E;margin-bottom:6px">N분의1 자동 산출 결과</div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span>총 전기 요금</span><span style="font-weight:700">₱${total.toLocaleString()}</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span>현재 체류 인원</span><span style="font-weight:700">${occupants}명</span>
    </div>
    <hr style="border:none;border-top:1px solid #FDE68A;margin:6px 0"/>
    <div style="display:flex;justify-content:space-between">
      <span style="font-weight:700">1인당 부담금</span>
      <span style="font-weight:800;font-size:15px;color:#D97706">₱${perPerson.toLocaleString()}</span>
    </div>
  `;
}

function calculateLaundry() {
  const inputEl = document.getElementById('laundry-weight');
  if (!inputEl) return;
  const weight = parseFloat(inputEl.value) || 0;
  const freeKg = 3;
  const ratePerKg = 25;
  const excess = Math.max(0, weight - freeKg);
  const charge = Math.round(excess * ratePerKg);
  const el = document.getElementById('laundry-result-box');
  if (!el) return;
  el.innerHTML = `
    <div style="font-size:11px;font-weight:700;color:#0369A1;margin-bottom:6px">세탁물 과금 산출</div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span>실측 무게</span><span style="font-weight:700">${weight}kg</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span>기본 무료 제공</span><span style="font-weight:700">${freeKg}kg</span>
    </div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px">
      <span>초과 무게</span><span style="font-weight:700;color:${excess>0?'#EF4444':'#16A34A'}">${excess.toFixed(1)}kg</span>
    </div>
    <hr style="border:none;border-top:1px solid #BFDBFE;margin:6px 0"/>
    <div style="display:flex;justify-content:space-between">
      <span style="font-weight:700">추가 과금액</span>
      <span style="font-weight:800;font-size:15px;color:${charge>0?'#EF4444':'#16A34A'}">₱${charge > 0 ? charge : '없음'}</span>
    </div>
  `;
}

function executeGuardianTransfer() {
  showToast('가디언 수업 양도 완료: 김엄마 → 김딸 (2시수 양도 처리)', 'success');
}

function initCalculators() {
  calculateElectricity();
  calculateLaundry();
}

/* =============================================
   STUDENT PORTAL LOGIC
   ============================================= */
let studentPortalDay = 'Wed'; // Simulated weekday for Wed/Thu check request limit

function initStudentPortal() {
  setupStudentDashboard();
  setupStudentTimetableChange();
  setupStudentDorm();
  setupStudentFeedback();
}

function setupStudentDashboard() {
  const s = MOCK_STUDENTS.find(std => std.nick === 'Minjun');
  if (!s) return;

  document.getElementById('student-welcome-name').textContent = s.name;
  
  // Set avatar photo
  const avatarEl = document.getElementById('student-portal-avatar');
  if (avatarEl) {
    avatarEl.src = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';
  }

  // Render Attendance Stats
  simulateStudentAttendanceChange(s.attendance);

  // Render Today's Classes
  const tbody = document.getElementById('student-today-classes-body');
  if (tbody) {
    const dayMapEnToKo = { 'Mon': '월', 'Tue': '화', 'Wed': '수', 'Thu': '목', 'Fri': '금', 'Sat': '토', 'Sun': '일' };
    const queryDay = dayMapEnToKo[studentPortalDay] || APP.selectedDay || '월';

    const durVal = APP.bellSystem ? APP.bellSystem.duration : 50;
    const brkVal = APP.bellSystem ? APP.bellSystem.break : 10;
    const startVal = APP.bellSystem ? (APP.bellSystem.start || '08:00') : '08:00';
    const totalVal = APP.bellSystem ? (APP.bellSystem.total || 8) : 8;
    const lunchAfterVal = APP.bellSystem ? (APP.bellSystem.lunchAfter || 4) : 4;
    const lunchDurVal = APP.bellSystem ? (APP.bellSystem.lunchDuration || 30) : 30;

    function addMins(timeStr, mins) {
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      date.setMinutes(date.getMinutes() + mins);
      return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }

    let curr = startVal;
    const periodTimes = {};
    for (let p = 1; p <= totalVal; p++) {
      if (p === lunchAfterVal + 1) {
        curr = addMins(curr, lunchDurVal); // Skip lunch
      }
      const start = curr;
      const end = addMins(start, durVal);
      periodTimes[p] = `${start} - ${end}`;
      curr = addMins(end, brkVal);
    }

    // Gather Minjun's classes on queryDay
    const minjunClasses = [];
    MOCK_TIMETABLE.forEach(t => {
      t.slots.forEach(slot => {
        if (slot.day === queryDay) {
          const isMinjun = slot.student === 'Minjun' || (slot.students && slot.students.includes('Minjun'));
          if (isMinjun) {
            minjunClasses.push({
              teacher: t.teacher,
              room: t.room,
              period: slot.p,
              type: slot.type || (slot.type === 'Group' ? '그룹 수업' : '1:1 수업'),
              subject: slot.subject,
              level: slot.level,
              slot: slot
            });
          }
        }
      });
    });

    // Sort by period
    minjunClasses.sort((a, b) => a.period - b.period);

    let html = '';
    if (minjunClasses.length === 0) {
      html = `<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:20px 0;">오늘 배정된 수업이 없습니다.</td></tr>`;
    } else {
      html = minjunClasses.map(c => {
        const timeStr = periodTimes[c.period] || '';
        const teacherObj = MOCK_TEACHERS.find(t => t.nick === c.teacher);
        const avatarSrc = (teacherObj && teacherObj.gender === '남') ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png';
        return `
          <tr>
            <td style="font-weight:700">${c.period}교시</td>
            <td>${timeStr}</td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <img src="${avatarSrc}" style="width:20px;height:20px;border-radius:50%;object-fit:cover" alt=""/>
                <strong>${c.teacher}</strong> (Room ${c.room})
              </div>
            </td>
            <td><span class="tsa-badge tsa-badge-primary">${c.type || '1:1 General'}</span></td>
            <td><span class="tsa-badge tsa-badge-gray">수업 예정</span></td>
          </tr>
        `;
      }).join('');
    }
    tbody.innerHTML = html;
  }

  // Dorm electricity allowance
  document.getElementById('student-elec-usage').textContent = `₱820 / ₱1,000 (기본공제)`;
  document.getElementById('student-elec-bar').style.width = `82%`;
}

function simulateStudentAttendanceChange(val) {
  const pct = parseFloat(val);
  document.getElementById('student-attendance-pct').textContent = `${pct}%`;
  document.getElementById('student-attendance-bar').style.width = `${pct}%`;

  const banner = document.getElementById('student-penalty-banner');
  const text = document.getElementById('student-penalty-text');

  if (pct < 80.0) {
    banner.style.display = 'flex';
    text.innerHTML = `<strong>⚠️ [출석률 80% 미만 제재 경고]</strong> 현재 누적 출석률이 <strong>${pct}%</strong>로 제재 기준치(80%) 미만입니다. 다음 주 1:1 수업이 <strong>1교시 강제 감축 배정</strong>되며 졸업증명서 및 수료증 출력이 전면 차단됩니다.`;
    document.getElementById('student-attendance-bar').style.background = '#EF4444';
    document.getElementById('student-attendance-pct').style.color = '#EF4444';
  } else if (pct < 85.0) {
    banner.style.display = 'flex';
    text.innerHTML = `<strong>⚠️ [출석률 85% 미만 졸업 차단]</strong> 현재 누적 출석률이 <strong>${pct}%</strong>로 졸업 요건(85%) 미달입니다. 졸업증명서 출력이 비활성화되며, 출석률이 80% 이하로 추가 하락 시 수업 감축 제재가 적용됩니다.`;
    document.getElementById('student-attendance-bar').style.background = '#F59E0B';
    document.getElementById('student-attendance-pct').style.color = '#F59E0B';
  } else {
    banner.style.display = 'none';
    document.getElementById('student-attendance-bar').style.background = '#10B981';
    document.getElementById('student-attendance-pct').style.color = '#10B981';
  }
}

function setupStudentTimetableChange() {
  const select = document.getElementById('student-change-current-teacher');
  if (!select) return;

  select.innerHTML = `
    <option value="Sarah">5교시: Sarah Johnson 강사 (IELTS 1:1)</option>
    <option value="Mike">2교시: Michael Cruz 강사 (1:1 General)</option>
  `;

  // Control active day form visibility (Wed/Thu)
  const simulatedDay = studentPortalDay;
  const isActiveDay = (simulatedDay === 'Wed' || simulatedDay === 'Thu');

  document.getElementById('form-timetable-change-active').style.display = isActiveDay ? 'block' : 'none';
  document.getElementById('form-timetable-change-inactive').style.display = isActiveDay ? 'none' : 'block';
}

function onSimulatedDayChange(val) {
  studentPortalDay = val;
  setupStudentTimetableChange();
  showToast(`📅 시뮬레이터 요일이 "${val === 'Wed' || val === 'Thu' ? val + '요일(신청 가능)' : val + '요일(신청 불가)'}"로 전환되었습니다.`, 'info');
}

function submitStudentTeacherChange() {
  const teacher = document.getElementById('student-change-current-teacher').value;
  const reason = document.getElementById('student-change-reason').options[document.getElementById('student-change-reason').selectedIndex].text;
  const details = document.getElementById('student-change-details').value.trim();

  // Create audit log
  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    actor: 'Student (Minjun)',
    change: `${teacher} 강사 변경 요청 제출`,
    reason: `[사유: ${reason}] ${details}`,
    type: 'warn'
  });

  showToast(`✓ [신청 접수] ${teacher} 강사 변경 요청이 정상 제출되었습니다. (어드민 검증대장 반영)`, 'success');
  document.getElementById('student-change-details').value = '';
}

function setupStudentDorm() {
  // Roommate profiles list and cleanup calendar are static HTML
}

function signLaundryRelease() {
  const sign = confirm('📝 세탁 불출 수령 서명\n\n품목을 정상 수령하였으며, 누적 과금 ₱30 금액 청구서 반영에 동의하십니까?');
  if (sign) {
    showToast('✓ 세탁 수령 서약 완료. 전기/런드리 수납 완료 처리되었습니다.', 'success');
  }
}

function setupStudentFeedback() {
  const select = document.getElementById('feedback-teacher-select');
  if (!select) return;

  select.innerHTML = `
    <option value="1">Sarah Johnson (IELTS 1:1)</option>
    <option value="2">Michael Cruz (1:1 General)</option>
  `;

  // Reset stars
  document.querySelectorAll('.star-rating').forEach(container => {
    container.querySelectorAll('span').forEach(s => {
      s.style.color = '#D1D5DB';
    });
    container.dataset.rating = "0";
  });
}

function setStarRating(element, rating) {
  const container = element.parentElement;
  container.dataset.rating = rating;

  const stars = container.querySelectorAll('span');
  for (let i = 0; i < stars.length; i++) {
    stars[i].style.color = i < rating ? '#F59E0B' : '#D1D5DB';
  }
}

function submitStudentFeedback() {
  const teacherId = parseInt(document.getElementById('feedback-teacher-select').value);
  const comment = document.getElementById('feedback-comments').value.trim();

  // Get ratings
  const accent = parseInt(document.querySelector('.star-rating[data-category="accent"]').dataset.rating || 0);
  const prep = parseInt(document.querySelector('.star-rating[data-category="prep"]').dataset.rating || 0);
  const punc = parseInt(document.querySelector('.star-rating[data-category="punc"]').dataset.rating || 0);

  if (accent === 0 || prep === 0 || punc === 0) {
    showToast('평가 별점을 모두 선택해 주세요.', 'danger');
    return;
  }

  const avg = (accent + prep + punc) / 3;
  const teacher = MOCK_TEACHERS.find(t => t.id === teacherId);
  
  if (teacher) {
    // Sync rating to database
    teacher.rating = Math.round(((teacher.rating * 9) + avg) / 10 * 10) / 10;
    showToast(`✓ [평점 반영 완료] ${teacher.name} 강사의 평점이 ${teacher.rating}점으로 업데이트되었습니다.`, 'success');
  }

  document.getElementById('feedback-comments').value = '';
  setupStudentFeedback();
}

/* =============================================
   DORM FORM HELPERS
   ============================================= */
function updateAregDormCapOptions() {
  const accomType = (document.getElementById('areg-dormAccomType') || {}).value;
  const capSel    = document.getElementById('areg-dormCapacity');
  const gradeSel  = document.getElementById('areg-dormGrade');
  if (!capSel) return;
  if (!accomType) {
    capSel.innerHTML  = '<option value="">— 유형 먼저 —</option>';
    gradeSel.innerHTML = '<option value="">— 인실 먼저 —</option>';
    return;
  }
  const caps = [...new Set(
    MOCK_DORM_TEMPLATES.filter(t => t.accomType === accomType).map(t => t.capacity)
  )].sort((a, b) => a - b);
  capSel.innerHTML = '<option value="">— 인실 선택 —</option>' +
    caps.map(c => `<option value="${c}인실">${c}인실</option>`).join('');
  gradeSel.innerHTML = '<option value="">— 인실 먼저 —</option>';
}

function updateAregDormGradeOptions() {
  const accomType = (document.getElementById('areg-dormAccomType') || {}).value;
  const capStr    = (document.getElementById('areg-dormCapacity')  || {}).value;
  const gradeSel  = document.getElementById('areg-dormGrade');
  if (!gradeSel) return;
  if (!accomType || !capStr) {
    gradeSel.innerHTML = '<option value="">— 인실 먼저 —</option>';
    return;
  }
  const cap = parseInt(capStr);
  const grades = MOCK_DORM_TEMPLATES
    .filter(t => t.accomType === accomType && t.capacity === cap)
    .map(t => t.condition);
  gradeSel.innerHTML = '<option value="">— 등급 선택 —</option>' +
    grades.map(g => `<option value="${g}">${g}</option>`).join('');
  calculateAregExpectedFees();
}

function updateDormCapacityOptions() {
  const accomType = (document.getElementById('sf-dormAccomType') || {}).value;
  const capSel    = document.getElementById('sf-dormCapacity');
  const gradeSel  = document.getElementById('sf-dormGrade');
  if (!capSel) return;

  if (!accomType) {
    capSel.innerHTML  = '<option value="">— 유형 먼저 —</option>';
    gradeSel.innerHTML = '<option value="">— 인실 먼저 —</option>';
    return;
  }

  const caps = [...new Set(
    MOCK_DORM_TEMPLATES.filter(t => t.accomType === accomType).map(t => t.capacity)
  )].sort((a, b) => a - b);

  capSel.innerHTML = '<option value="">— 인실 선택 —</option>' +
    caps.map(c => `<option value="${c}인실">${c}인실</option>`).join('');
  gradeSel.innerHTML = '<option value="">— 인실 먼저 —</option>';
}

function updateDormGradeOptions() {
  const accomType = (document.getElementById('sf-dormAccomType') || {}).value;
  const capStr    = (document.getElementById('sf-dormCapacity')  || {}).value;
  const gradeSel  = document.getElementById('sf-dormGrade');
  if (!gradeSel) return;

  if (!accomType || !capStr) {
    gradeSel.innerHTML = '<option value="">— 인실 먼저 —</option>';
    return;
  }

  const cap = parseInt(capStr);
  const grades = MOCK_DORM_TEMPLATES
    .filter(t => t.accomType === accomType && t.capacity === cap)
    .map(t => t.condition);

  gradeSel.innerHTML = '<option value="">— 등급 선택 —</option>' +
    grades.map(g => `<option value="${g}">${g}</option>`).join('');
}

