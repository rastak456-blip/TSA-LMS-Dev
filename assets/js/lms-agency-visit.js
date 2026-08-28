/* =============================================
   AGENCY COMMUNICATION & VISIT SCHEDULING
   - 에이전시별 소통 메모(어학원 담당자 ↔ 에이전시)
   - 에이전시 방문 일정 예약 및 방문일정 캘린더
   ============================================= */

const AGENCY_VISIT_TODAY = '2026-06-17';

/* 방문 구분 : 에이전시가 캠퍼스로 오는 경우 / 담당자가 에이전시로 가는 경우 */
const AGENCY_VISIT_TYPES = {
  inbound:  { label: '에이전시 캠퍼스 방문', short: '내방', icon: '🏫', color: '#5E5CE6' },
  outbound: { label: '담당자 에이전시 출장', short: '출장', icon: '✈️', color: '#0EA5E9' },
};

const AGENCY_VISIT_STATUS = {
  scheduled: { label: '예정',  color: '#5E5CE6', bg: '#EEF2FF' },
  done:      { label: '완료',  color: '#10B981', bg: '#D1FAE5' },
  canceled:  { label: '취소',  color: '#9CA3AF', bg: '#F3F4F6' },
};

const AGENCY_VISIT_PURPOSES = [
  '정기 미팅', '신규 제휴 상담', '계약·정산 협의', '캠퍼스 투어',
  '학생 인솔 동행', '설명회·세미나', '클레임 처리', '기타',
];

const AGENCY_NOTE_CHANNELS = ['미팅', '전화', '이메일', '카카오톡', '라인', '위챗', '줌 미팅', '기타'];

/* 에이전시 소통 메모 (어학원 담당자가 남기는 커뮤니케이션 로그) */
let MOCK_AGENCY_NOTES = [
  { id: 1, agencyId: 1, date: '2026-06-16', author: '김민지', channel: '카카오톡', content: '7월 입학 예정 학생 4명 서류 준비 상황 확인. 여권 사본 2건 미제출 상태로 재요청함.', important: true },
  { id: 2, agencyId: 1, date: '2026-06-10', author: '김민지', channel: '줌 미팅', content: '하반기 프로모션 할인율 협의. 8주 이상 등록 건에 한해 등록금 면제 방안 검토 요청 받음.', important: false },
  { id: 3, agencyId: 1, date: '2026-05-28', author: '김민지', channel: '이메일', content: '5월 정산서 송부. 커미션 계산 이견 없음 회신 받음.', important: false },
  { id: 4, agencyId: 7, date: '2026-06-15', author: '박서준', channel: '전화', content: '신규 지사 오픈 예정(부산). 지사 계정 추가 발급 요청 접수.', important: true },
  { id: 5, agencyId: 7, date: '2026-06-02', author: '박서준', channel: '이메일', content: '기숙사 2인실 공실 문의. 7월 셋째 주 기준 잔여 4베드 안내 완료.', important: false },
  { id: 6, agencyId: 2, date: '2026-06-12', author: '이하늘', channel: '라인', content: '일본 여름방학 단기(4주) 패키지 문의. 요금표 v3 송부 예정.', important: false },
  { id: 7, agencyId: 2, date: '2026-05-30', author: '이하늘', channel: '미팅', content: '도쿄 유학 박람회 부스 공동 운영 제안. 본사 승인 필요.', important: true },
  { id: 8, agencyId: 8, date: '2026-06-09', author: '이하늘', channel: '이메일', content: '오사카 지사 첫 송금 완료 확인. 학생 2명 Active 전환 처리함.', important: false },
  { id: 9, agencyId: 3, date: '2026-06-14', author: '최우진', channel: '위챗', content: '중국 국경절 연휴 기간 단기 연수 문의. 강사 배정 가능 여부 확인 요청.', important: false },
  { id: 10, agencyId: 4, date: '2026-04-20', author: '최우진', channel: '전화', content: '송금 지연 건으로 계정 일시 정지 안내. 재개 조건 협의 예정.', important: true },
];
let _agencyNoteNextId = 11;

/* 에이전시 방문 일정 */
let MOCK_AGENCY_VISITS = [
  { id: 1, agencyId: 1, date: '2026-06-18', start: '10:00', end: '12:00', type: 'inbound', purpose: '정기 미팅',
    staff: '김민지', place: '세부 캠퍼스 3F 상담실', attendees: '김지훈 부장, 이수민 대리', status: 'scheduled',
    agenda: '7월 입학 예정 학생 진행 상황 점검 및 하반기 모객 계획 공유.', result: '' },
  { id: 2, agencyId: 1, date: '2026-07-06', start: '14:00', end: '16:30', type: 'inbound', purpose: '캠퍼스 투어',
    staff: '김민지', place: '세부 캠퍼스 정문 로비 집합', attendees: '김지훈 부장 외 학부모 6명', status: 'scheduled',
    agenda: '학부모 동반 캠퍼스 투어. 기숙사 2인실·강의실·식당 동선 안내 필요.', result: '' },
  { id: 3, agencyId: 7, date: '2026-06-19', start: '15:00', end: '16:00', type: 'inbound', purpose: '신규 제휴 상담',
    staff: '박서준', place: '세부 캠퍼스 1F 회의실', attendees: '최영희 대표', status: 'scheduled',
    agenda: '부산 지사 오픈에 따른 지사 계정 및 커미션 조건 협의.', result: '' },
  { id: 4, agencyId: 2, date: '2026-06-24', start: '11:00', end: '13:00', type: 'outbound', purpose: '설명회·세미나',
    staff: '이하늘', place: '도쿄 신주쿠 Tokyo Language 본사', attendees: 'Tanaka Kenji', status: 'scheduled',
    agenda: '여름방학 단기 패키지 공동 설명회 준비 미팅.', result: '' },
  { id: 5, agencyId: 8, date: '2026-06-25', start: '10:30', end: '12:00', type: 'outbound', purpose: '정기 미팅',
    staff: '이하늘', place: '오사카 우메다 Osaka Study 사무실', attendees: 'Yamamoto Yui', status: 'scheduled',
    agenda: '도쿄 출장 연계 방문. 오사카 지사 초기 운영 현황 점검.', result: '' },
  { id: 6, agencyId: 3, date: '2026-06-30', start: '13:00', end: '15:00', type: 'inbound', purpose: '계약·정산 협의',
    staff: '최우진', place: '세부 캠퍼스 3F 상담실', attendees: 'Wang Fang', status: 'scheduled',
    agenda: '상반기 정산 마감 및 커미션 요율 재협의.', result: '' },
  { id: 7, agencyId: 1, date: '2026-06-04', start: '10:00', end: '11:30', type: 'inbound', purpose: '정기 미팅',
    staff: '김민지', place: '세부 캠퍼스 3F 상담실', attendees: '김지훈 부장', status: 'done',
    agenda: '6월 입학생 오리엔테이션 일정 공유.', result: '오리엔테이션 6/8 진행 확정. 픽업 차량 2대 배차 요청 접수.' },
  { id: 8, agencyId: 3, date: '2026-06-11', start: '16:00', end: '17:00', type: 'inbound', purpose: '클레임 처리',
    staff: '최우진', place: '세부 캠퍼스 1F 회의실', attendees: 'Wang Fang', status: 'done',
    agenda: '기숙사 룸메이트 변경 요청 관련 협의.', result: '해당 학생 6/15자 룸 변경 처리 완료로 종결.' },
  { id: 9, agencyId: 4, date: '2026-06-05', start: '14:00', end: '15:00', type: 'outbound', purpose: '기타',
    staff: '최우진', place: '호치민 1군 VN Academy 사무실', attendees: 'Nguyen Lan', status: 'canceled',
    agenda: '송금 지연 건 대면 협의.', result: '에이전시 사정으로 취소. 7월 중 재조율 예정.' },
];
let _agencyVisitNextId = 10;

/* 화면 상태 */
let agencyVisitCalendarDate = new Date('2026-06-01T00:00:00');
let agencyVisitSelectedDate = AGENCY_VISIT_TODAY;
let agencyVisitFilters = { agencyId: 'all', staff: 'all', type: 'all', status: 'all' };
let agencyNotesTargetId = null;

/* ── 공통 유틸 ───────────────────────────────── */
function getAgencyById(id) {
  if (typeof MOCK_AGENCIES === 'undefined') return null;
  return MOCK_AGENCIES.find(a => String(a.id) === String(id)) || null;
}

function getVisitableAgencies() {
  if (typeof MOCK_AGENCIES === 'undefined') return [];
  return MOCK_AGENCIES.filter(a => a.name !== '직접 등록');
}

function formatAgencyVisitDateLabel(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일(${dow})`;
}

function getAgencyNotes(agencyId) {
  return MOCK_AGENCY_NOTES
    .filter(n => String(n.agencyId) === String(agencyId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function getAgencyNoteSummary(agencyId) {
  const notes = getAgencyNotes(agencyId);
  return { count: notes.length, last: notes[0] || null };
}

function getAgencyVisits(agencyId) {
  return MOCK_AGENCY_VISITS
    .filter(v => String(v.agencyId) === String(agencyId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

function getAgencyVisitSummary(agencyId) {
  const visits = getAgencyVisits(agencyId);
  const next = visits
    .filter(v => v.status === 'scheduled' && v.date >= AGENCY_VISIT_TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  const last = visits.find(v => v.status === 'done' && v.date <= AGENCY_VISIT_TODAY) || null;
  return { count: visits.length, next, last };
}

function applyAgencyVisitFilters(list) {
  return list.filter(v => {
    if (agencyVisitFilters.agencyId !== 'all' && String(v.agencyId) !== String(agencyVisitFilters.agencyId)) return false;
    if (agencyVisitFilters.staff !== 'all' && v.staff !== agencyVisitFilters.staff) return false;
    if (agencyVisitFilters.type !== 'all' && v.type !== agencyVisitFilters.type) return false;
    if (agencyVisitFilters.status !== 'all' && v.status !== agencyVisitFilters.status) return false;
    return true;
  });
}

function getVisitsForDate(dateStr) {
  return applyAgencyVisitFilters(MOCK_AGENCY_VISITS.filter(v => v.date === dateStr))
    .sort((a, b) => (a.start || '').localeCompare(b.start || ''));
}

/* ── 뷰 진입점 ───────────────────────────────── */
function renderAgencyVisitView() {
  buildAgencyVisitFilterOptions();
  renderAgencyVisitUpcoming();
  renderAgencyVisitTable();
  selectAgencyVisitDate(agencyVisitSelectedDate);
  if (typeof refreshIcons === 'function') refreshIcons();
}

function buildAgencyVisitFilterOptions() {
  const agencySel = document.getElementById('avc-filter-agency');
  if (agencySel) {
    const cur = agencyVisitFilters.agencyId;
    agencySel.innerHTML = `<option value="all">전체 에이전시</option>` +
      getVisitableAgencies().map(a => `<option value="${a.id}">${a.flag || ''} ${a.name}</option>`).join('');
    agencySel.value = cur;
  }
  const staffSel = document.getElementById('avc-filter-staff');
  if (staffSel) {
    const cur = agencyVisitFilters.staff;
    const staffNames = (typeof MOCK_HQ_STAFF === 'undefined' ? [] : MOCK_HQ_STAFF.map(s => s.name));
    staffSel.innerHTML = `<option value="all">전체 담당자</option>` +
      staffNames.map(n => `<option value="${n}">${n}</option>`).join('');
    staffSel.value = cur;
  }
}

function setAgencyVisitFilter(key, value) {
  agencyVisitFilters[key] = value;
  renderAgencyVisitUpcoming();
  renderAgencyVisitTable();
  selectAgencyVisitDate(agencyVisitSelectedDate);
}

function resetAgencyVisitFilters() {
  agencyVisitFilters = { agencyId: 'all', staff: 'all', type: 'all', status: 'all' };
  buildAgencyVisitFilterOptions();
  const typeSel = document.getElementById('avc-filter-type');
  if (typeSel) typeSel.value = 'all';
  const statusSel = document.getElementById('avc-filter-status');
  if (statusSel) statusSel.value = 'all';
  renderAgencyVisitView();
}

/* ── 캘린더 ─────────────────────────────────── */
function prevAgencyVisitMonth() {
  agencyVisitCalendarDate = new Date(agencyVisitCalendarDate.getFullYear(), agencyVisitCalendarDate.getMonth() - 1, 1);
  renderAgencyVisitCalendar();
}

function nextAgencyVisitMonth() {
  agencyVisitCalendarDate = new Date(agencyVisitCalendarDate.getFullYear(), agencyVisitCalendarDate.getMonth() + 1, 1);
  renderAgencyVisitCalendar();
}

function goAgencyVisitToday() {
  const [y, m] = AGENCY_VISIT_TODAY.split('-').map(Number);
  agencyVisitCalendarDate = new Date(y, m - 1, 1);
  selectAgencyVisitDate(AGENCY_VISIT_TODAY);
}

function renderAgencyVisitCalendar() {
  const gridEl = document.getElementById('avc-calendar-grid');
  if (!gridEl) return;

  const year = agencyVisitCalendarDate.getFullYear();
  const month = agencyVisitCalendarDate.getMonth();

  const labelEl = document.getElementById('avc-calendar-month-year');
  if (labelEl) labelEl.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevTotalDays = new Date(year, month, 0).getDate();

  /* 이번 달 KPI 집계 (필터 반영) */
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthVisits = applyAgencyVisitFilters(MOCK_AGENCY_VISITS.filter(v => v.date.startsWith(monthPrefix)));
  const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setText('avc-kpi-total', `${monthVisits.length}건`);
  setText('avc-kpi-scheduled', `${monthVisits.filter(v => v.status === 'scheduled').length}건`);
  setText('avc-kpi-done', `${monthVisits.filter(v => v.status === 'done').length}건`);
  setText('avc-kpi-agencies', `${new Set(monthVisits.map(v => v.agencyId)).size}개`);

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevTotalDays - i, month: month === 0 ? 11 : month - 1, year: month === 0 ? year - 1 : year, currentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) cells.push({ day: i, month, year, currentMonth: true });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, month: month === 11 ? 0 : month + 1, year: month === 11 ? year + 1 : year, currentMonth: false });
  }

  /* 하루에 표시할 일정 수에 맞춰 행 높이를 동적으로 잡아 레이아웃 흔들림 방지 */
  let maxChips = 0;
  cells.forEach(cell => {
    const ds = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    maxChips = Math.max(maxChips, Math.min(getVisitsForDate(ds).length, 4));
  });
  gridEl.style.gridAutoRows = `${Math.max(78, 20 + maxChips * 18 + 10)}px`;

  gridEl.innerHTML = cells.map(cell => {
    const ds = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    const isToday = ds === AGENCY_VISIT_TODAY;
    const isSelected = ds === agencyVisitSelectedDate;
    const visits = getVisitsForDate(ds);

    let bg = cell.currentMonth ? '#ffffff' : '#F9FAFB';
    let borderColor = '#E9EDF4';
    if (isToday) { bg = '#EEF2FF'; borderColor = '#5E5CE6'; }
    const shadow = isSelected ? 'box-shadow:0 0 0 2px #5E5CE6;' : '';

    const chips = visits.slice(0, 3).map(v => {
      const agency = getAgencyById(v.agencyId);
      const st = AGENCY_VISIT_STATUS[v.status] || AGENCY_VISIT_STATUS.scheduled;
      const tp = AGENCY_VISIT_TYPES[v.type] || AGENCY_VISIT_TYPES.inbound;
      const name = agency ? agency.name : '-';
      const deco = v.status === 'canceled' ? 'text-decoration:line-through;' : '';
      return `<div title="${v.start}~${v.end} ${name} · ${v.purpose} · ${v.staff} · ${st.label}"
        style="display:flex;align-items:center;gap:3px;background:${st.bg};border-radius:4px;padding:1px 4px;${deco}overflow:hidden">
        <span style="font-size:8.5px;flex-shrink:0">${tp.icon}</span>
        <span style="font-size:8.5px;font-weight:700;color:${st.color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.start} ${name}</span>
      </div>`;
    }).join('');
    const more = visits.length > 3 ? `<div style="font-size:8.5px;color:#9CA3AF;font-weight:700">+${visits.length - 3}건 더</div>` : '';

    return `<div onclick="selectAgencyVisitDate('${ds}')" ondblclick="openAgencyVisitModal(null,null,'${ds}')"
      title="클릭: 일정 보기 / 더블클릭: 이 날짜로 예약"
      style="border:1px solid ${borderColor};border-radius:6px;padding:4px 6px;cursor:pointer;display:flex;flex-direction:column;gap:2px;background:${bg};${shadow}${cell.currentMonth ? '' : 'color:#9CA3AF;'}overflow:hidden">
      <div style="font-size:10.5px;font-weight:700;display:flex;align-items:center;justify-content:space-between">
        <span>${cell.day}</span>
        ${visits.length ? `<span style="font-size:8.5px;color:#5E5CE6;font-weight:800">${visits.length}</span>` : ''}
      </div>
      ${chips}${more}
    </div>`;
  }).join('');
}

function selectAgencyVisitDate(dateStr) {
  agencyVisitSelectedDate = dateStr;
  renderAgencyVisitCalendar();

  const labelEl = document.getElementById('avc-selected-date-label');
  if (labelEl) labelEl.textContent = `${dateStr} · ${formatAgencyVisitDateLabel(dateStr)}`;

  const listEl = document.getElementById('avc-day-list');
  if (!listEl) return;

  const visits = getVisitsForDate(dateStr);
  if (!visits.length) {
    listEl.innerHTML = `<div style="padding:24px 12px;text-align:center;color:#9CA3AF;font-size:12px">
      <div style="font-size:22px;margin-bottom:6px">🗓️</div>
      이 날짜에 등록된 방문 일정이 없습니다.<br/>
      <button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="margin-top:10px" onclick="openAgencyVisitModal(null,null,'${dateStr}')">
        <i data-lucide="plus"></i> 이 날짜로 예약
      </button>
    </div>`;
    if (typeof refreshIcons === 'function') refreshIcons();
    return;
  }

  listEl.innerHTML = visits.map(v => {
    const agency = getAgencyById(v.agencyId);
    const st = AGENCY_VISIT_STATUS[v.status] || AGENCY_VISIT_STATUS.scheduled;
    const tp = AGENCY_VISIT_TYPES[v.type] || AGENCY_VISIT_TYPES.inbound;
    return `<div style="border:1px solid #E5E7EB;border-left:3px solid ${st.color};border-radius:8px;padding:10px 12px;margin-bottom:8px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="min-width:0">
          <div style="font-size:12.5px;font-weight:800;color:#111827">${agency ? `${agency.flag || ''} ${agency.name}` : '-'}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:2px">${v.start} ~ ${v.end} · ${tp.icon} ${tp.label}</div>
        </div>
        <span class="tsa-badge" style="background:${st.bg};color:${st.color};flex-shrink:0">${st.label}</span>
      </div>
      <div style="font-size:11.5px;color:#374151;margin-top:8px;display:flex;flex-direction:column;gap:3px">
        <div>🎯 <b>${v.purpose}</b></div>
        <div>📍 ${v.place || '-'}</div>
        <div>👤 담당 ${v.staff || '-'}${v.attendees ? ` · 참석 ${v.attendees}` : ''}</div>
      </div>
      ${v.agenda ? `<div style="font-size:11px;color:#4B5563;background:#F8FAFC;border-radius:6px;padding:7px 9px;margin-top:8px;line-height:1.5">📝 ${v.agenda}</div>` : ''}
      ${v.result ? `<div style="font-size:11px;color:#065F46;background:#ECFDF5;border-radius:6px;padding:7px 9px;margin-top:6px;line-height:1.5">✅ ${v.result}</div>` : ''}
      <div style="display:flex;gap:5px;margin-top:9px;flex-wrap:wrap">
        <button class="tsa-btn tsa-btn-sm tsa-btn-outline" onclick="openAgencyVisitModal(${v.id})">수정</button>
        ${v.status !== 'done' ? `<button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="border-color:#10B981;color:#10B981" onclick="setAgencyVisitStatus(${v.id},'done')">완료 처리</button>` : ''}
        ${v.status !== 'canceled'
          ? `<button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="border-color:#F59E0B;color:#B45309" onclick="setAgencyVisitStatus(${v.id},'canceled')">취소</button>`
          : `<button class="tsa-btn tsa-btn-sm tsa-btn-outline" onclick="setAgencyVisitStatus(${v.id},'scheduled')">예정 복원</button>`}
        <button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="border-color:#5E5CE6;color:#5E5CE6" onclick="openAgencyNotesModal(${v.agencyId})">소통 메모</button>
        <button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="border-color:#FCA5A5;color:#DC2626" onclick="deleteAgencyVisit(${v.id})">삭제</button>
      </div>
    </div>`;
  }).join('');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderAgencyVisitUpcoming() {
  const el = document.getElementById('avc-upcoming-list');
  if (!el) return;
  const upcoming = applyAgencyVisitFilters(MOCK_AGENCY_VISITS)
    .filter(v => v.status === 'scheduled' && v.date >= AGENCY_VISIT_TODAY)
    .sort((a, b) => (a.date === b.date ? (a.start || '').localeCompare(b.start || '') : a.date.localeCompare(b.date)))
    .slice(0, 6);

  if (!upcoming.length) {
    el.innerHTML = `<div style="padding:16px;text-align:center;color:#9CA3AF;font-size:11.5px">예정된 방문 일정이 없습니다.</div>`;
    return;
  }

  el.innerHTML = upcoming.map(v => {
    const agency = getAgencyById(v.agencyId);
    const tp = AGENCY_VISIT_TYPES[v.type] || AGENCY_VISIT_TYPES.inbound;
    const dday = Math.round((new Date(v.date) - new Date(AGENCY_VISIT_TODAY)) / 86400000);
    const ddayLabel = dday === 0 ? 'D-DAY' : `D-${dday}`;
    return `<div onclick="focusAgencyVisit('${v.date}')" style="display:flex;align-items:center;gap:9px;padding:8px 10px;border-bottom:1px solid #F1F4F9;cursor:pointer">
      <div style="flex-shrink:0;width:46px;text-align:center">
        <div style="font-size:10px;font-weight:800;color:${dday <= 3 ? '#EF4444' : '#5E5CE6'}">${ddayLabel}</div>
        <div style="font-size:9.5px;color:#9CA3AF">${v.date.substring(5)}</div>
      </div>
      <div style="min-width:0;flex:1">
        <div style="font-size:11.5px;font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tp.icon} ${agency ? agency.name : '-'}</div>
        <div style="font-size:10.5px;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.start} · ${v.purpose} · ${v.staff}</div>
      </div>
    </div>`;
  }).join('');
}

function focusAgencyVisit(dateStr) {
  if (typeof navigate === 'function' && !document.getElementById('view-agency-visits')?.classList.contains('active')) {
    navigate('agency-visits');
  }
  const [y, m] = dateStr.split('-').map(Number);
  agencyVisitCalendarDate = new Date(y, m - 1, 1);
  selectAgencyVisitDate(dateStr);
}

function renderAgencyVisitTable() {
  const tbody = document.getElementById('avc-table-body');
  if (!tbody) return;
  const rows = applyAgencyVisitFilters(MOCK_AGENCY_VISITS)
    .sort((a, b) => (a.date === b.date ? (a.start || '').localeCompare(b.start || '') : b.date.localeCompare(a.date)));

  const countEl = document.getElementById('avc-table-count');
  if (countEl) countEl.textContent = `총 ${rows.length}건`;

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:26px;color:#9CA3AF;font-size:12px">조건에 맞는 방문 일정이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(v => {
    const agency = getAgencyById(v.agencyId);
    const st = AGENCY_VISIT_STATUS[v.status] || AGENCY_VISIT_STATUS.scheduled;
    const tp = AGENCY_VISIT_TYPES[v.type] || AGENCY_VISIT_TYPES.inbound;
    const noteSummary = getAgencyNoteSummary(v.agencyId);
    return `<tr>
      <td style="font-size:11.5px;color:#374151">
        <div style="font-weight:700;color:#111827">${v.date}</div>
        <div style="font-size:10.5px;color:#9CA3AF">${formatAgencyVisitDateLabel(v.date)} ${v.start}~${v.end}</div>
      </td>
      <td style="font-size:12px;font-weight:700;color:#111827">${agency ? `${agency.flag || ''} ${agency.name}` : '-'}
        <div style="font-size:10.5px;color:#9CA3AF;font-weight:500">${agency ? (agency.country || '') : ''}</div>
      </td>
      <td style="text-align:center"><span class="tsa-badge" style="background:${tp.color}18;color:${tp.color}">${tp.icon} ${tp.short}</span></td>
      <td style="font-size:11.5px;color:#374151">${v.purpose}</td>
      <td style="font-size:11.5px;color:#374151">${v.staff || '-'}</td>
      <td style="font-size:11.5px;color:#6B7280;max-width:190px">${v.place || '-'}</td>
      <td style="text-align:center"><span class="tsa-badge" style="background:${st.bg};color:${st.color}">${st.label}</span></td>
      <td>
        <div style="display:flex;gap:5px;justify-content:center;flex-wrap:wrap">
          <button class="tsa-btn tsa-btn-sm tsa-btn-outline" onclick="focusAgencyVisit('${v.date}')">캘린더</button>
          <button class="tsa-btn tsa-btn-sm tsa-btn-outline" onclick="openAgencyVisitModal(${v.id})">수정</button>
          <button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="border-color:#5E5CE6;color:#5E5CE6" onclick="openAgencyNotesModal(${v.agencyId})">메모 ${noteSummary.count}</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── 방문 예약 모달 ─────────────────────────── */
function openAgencyVisitModal(visitId, presetAgencyId, presetDate) {
  const agencies = getVisitableAgencies();
  if (!agencies.length) {
    if (typeof showToast === 'function') showToast('등록된 에이전시가 없습니다.', 'warning');
    return;
  }

  const agencySel = document.getElementById('avm-agency');
  if (agencySel) {
    agencySel.innerHTML = agencies.map(a => `<option value="${a.id}">${a.flag || ''} ${a.name}${a.country ? ` (${a.country})` : ''}</option>`).join('');
  }
  const staffSel = document.getElementById('avm-staff');
  if (staffSel) {
    const staffNames = (typeof MOCK_HQ_STAFF === 'undefined' ? [] : MOCK_HQ_STAFF.map(s => s.name));
    staffSel.innerHTML = staffNames.map(n => `<option value="${n}">${n}</option>`).join('');
  }
  const purposeSel = document.getElementById('avm-purpose');
  if (purposeSel) {
    purposeSel.innerHTML = AGENCY_VISIT_PURPOSES.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  const v = visitId ? MOCK_AGENCY_VISITS.find(x => x.id === visitId) : null;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

  document.getElementById('avm-id').value = v ? v.id : '';
  document.getElementById('avm-modal-title').textContent = v ? '방문 일정 수정' : '에이전시 방문 일정 예약';

  if (v) {
    setVal('avm-agency', v.agencyId);
    setVal('avm-date', v.date);
    setVal('avm-start', v.start);
    setVal('avm-end', v.end);
    setVal('avm-type', v.type);
    setVal('avm-purpose', v.purpose);
    setVal('avm-staff', v.staff);
    setVal('avm-place', v.place || '');
    setVal('avm-attendees', v.attendees || '');
    setVal('avm-agenda', v.agenda || '');
    setVal('avm-result', v.result || '');
    setVal('avm-status', v.status);
  } else {
    const defaultAgency = presetAgencyId || agencies[0].id;
    const agency = getAgencyById(defaultAgency);
    const staffNames = (typeof MOCK_HQ_STAFF === 'undefined' ? [] : MOCK_HQ_STAFF.map(s => s.name));
    setVal('avm-agency', defaultAgency);
    setVal('avm-date', presetDate || AGENCY_VISIT_TODAY);
    setVal('avm-start', '10:00');
    setVal('avm-end', '11:30');
    setVal('avm-type', 'inbound');
    setVal('avm-purpose', AGENCY_VISIT_PURPOSES[0]);
    setVal('avm-staff', agency && staffNames.includes(agency.manager) ? agency.manager : (staffNames[0] || ''));
    setVal('avm-place', '세부 캠퍼스 3F 상담실');
    setVal('avm-attendees', agency ? (agency.contact || '') : '');
    setVal('avm-agenda', '');
    setVal('avm-result', '');
    setVal('avm-status', 'scheduled');
  }

  syncAgencyVisitModalHints();
  if (typeof openModal === 'function') openModal('modal-agency-visit');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeAgencyVisitModal() {
  if (typeof closeModal === 'function') closeModal('modal-agency-visit');
}

/* 방문 구분/에이전시를 바꾸면 장소 기본값과 담당자 안내를 갱신 */
function syncAgencyVisitModalHints() {
  const agencyId = document.getElementById('avm-agency')?.value;
  const type = document.getElementById('avm-type')?.value;
  const isNew = !document.getElementById('avm-id')?.value;
  const agency = getAgencyById(agencyId);

  const hintEl = document.getElementById('avm-agency-hint');
  if (hintEl && agency) {
    const noteSummary = getAgencyNoteSummary(agency.id);
    const visitSummary = getAgencyVisitSummary(agency.id);
    hintEl.innerHTML = `담당 직원 <b>${agency.manager || '미지정'}</b> · 에이전시 담당자 ${agency.contact || '-'} · ${agency.phone || '-'}
      <br/>소통 메모 <b>${noteSummary.count}건</b>${noteSummary.last ? ` (최근 ${noteSummary.last.date} · ${noteSummary.last.channel})` : ''}
      · ${visitSummary.last ? `최근 방문 ${visitSummary.last.date}` : '방문 이력 없음'}`;
  }

  const placeEl = document.getElementById('avm-place');
  if (placeEl && isNew) {
    if (type === 'outbound') {
      placeEl.value = agency && agency.address ? agency.address : '';
      placeEl.placeholder = '방문할 에이전시 사무실 주소';
    } else {
      placeEl.value = (placeEl.value || '').includes('캠퍼스') ? placeEl.value : '세부 캠퍼스 3F 상담실';
      placeEl.placeholder = '캠퍼스 내 미팅 장소';
    }
  }

  const attendeesEl = document.getElementById('avm-attendees');
  if (attendeesEl && isNew && agency && !attendeesEl.value) attendeesEl.value = agency.contact || '';

  const staffEl = document.getElementById('avm-staff');
  if (staffEl && isNew && agency) {
    const staffNames = (typeof MOCK_HQ_STAFF === 'undefined' ? [] : MOCK_HQ_STAFF.map(s => s.name));
    if (staffNames.includes(agency.manager)) staffEl.value = agency.manager;
  }
}

function saveAgencyVisit() {
  const id = document.getElementById('avm-id').value;
  const agencyId = Number(document.getElementById('avm-agency').value);
  const date = document.getElementById('avm-date').value;
  const start = document.getElementById('avm-start').value;
  const end = document.getElementById('avm-end').value;

  if (!agencyId || !date || !start || !end) {
    if (typeof showToast === 'function') showToast('에이전시, 방문일, 시작·종료 시간은 필수입니다.', 'warning');
    return;
  }
  if (start >= end) {
    if (typeof showToast === 'function') showToast('종료 시간은 시작 시간보다 뒤여야 합니다.', 'warning');
    return;
  }

  const staff = document.getElementById('avm-staff').value;
  const status = document.getElementById('avm-status').value;

  /* 같은 담당자가 같은 날 겹치는 시간대에 다른 방문을 잡지 않도록 확인 */
  if (status !== 'canceled') {
    const overlap = MOCK_AGENCY_VISITS.find(v =>
      String(v.id) !== String(id) &&
      v.date === date && v.staff === staff && v.status !== 'canceled' &&
      start < v.end && end > v.start
    );
    if (overlap) {
      const a = getAgencyById(overlap.agencyId);
      if (typeof showToast === 'function') {
        showToast(`${staff} 담당자는 ${date} ${overlap.start}~${overlap.end}에 이미 ${a ? a.name : ''} 방문 일정이 있습니다.`, 'danger');
      }
      return;
    }
  }

  const payload = {
    agencyId, date, start, end, staff, status,
    type: document.getElementById('avm-type').value,
    purpose: document.getElementById('avm-purpose').value,
    place: document.getElementById('avm-place').value.trim(),
    attendees: document.getElementById('avm-attendees').value.trim(),
    agenda: document.getElementById('avm-agenda').value.trim(),
    result: document.getElementById('avm-result').value.trim(),
  };

  if (id) {
    const idx = MOCK_AGENCY_VISITS.findIndex(v => String(v.id) === String(id));
    if (idx >= 0) MOCK_AGENCY_VISITS[idx] = { ...MOCK_AGENCY_VISITS[idx], ...payload };
    if (typeof showToast === 'function') showToast('✓ 방문 일정이 수정되었습니다.', 'success');
  } else {
    MOCK_AGENCY_VISITS.push({ id: _agencyVisitNextId++, ...payload });
    const a = getAgencyById(agencyId);
    if (typeof showToast === 'function') showToast(`✓ ${a ? a.name : ''} 방문 일정이 ${date} ${start}로 예약되었습니다.`, 'success');
  }

  closeAgencyVisitModal();
  const [y, m] = date.split('-').map(Number);
  agencyVisitCalendarDate = new Date(y, m - 1, 1);
  selectAgencyVisitDate(date);
  renderAgencyVisitUpcoming();
  renderAgencyVisitTable();
  if (typeof renderAgencyManage === 'function' && document.getElementById('view-agency-manage')?.classList.contains('active')) {
    renderAgencyManage();
  }
}

function setAgencyVisitStatus(id, status) {
  const v = MOCK_AGENCY_VISITS.find(x => x.id === id);
  if (!v) return;
  v.status = status;
  const label = (AGENCY_VISIT_STATUS[status] || {}).label || status;
  if (typeof showToast === 'function') showToast(`방문 일정을 '${label}' 상태로 변경했습니다.`, 'info');
  selectAgencyVisitDate(agencyVisitSelectedDate);
  renderAgencyVisitUpcoming();
  renderAgencyVisitTable();
}

function deleteAgencyVisit(id) {
  const v = MOCK_AGENCY_VISITS.find(x => x.id === id);
  if (!v) return;
  const a = getAgencyById(v.agencyId);
  if (!confirm(`${a ? a.name : ''} · ${v.date} ${v.start} 방문 일정을 삭제할까요?`)) return;
  MOCK_AGENCY_VISITS = MOCK_AGENCY_VISITS.filter(x => x.id !== id);
  if (typeof showToast === 'function') showToast('방문 일정이 삭제되었습니다.', 'info');
  selectAgencyVisitDate(agencyVisitSelectedDate);
  renderAgencyVisitUpcoming();
  renderAgencyVisitTable();
  if (typeof renderAgencyManage === 'function' && document.getElementById('view-agency-manage')?.classList.contains('active')) {
    renderAgencyManage();
  }
}

/* ── 에이전시 소통 메모 모달 ─────────────────── */
function openAgencyNotesModal(agencyId) {
  const agency = getAgencyById(agencyId);
  if (!agency) return;
  agencyNotesTargetId = agency.id;

  const titleEl = document.getElementById('anm-agency-name');
  if (titleEl) titleEl.textContent = `${agency.flag || ''} ${agency.name}`;
  const metaEl = document.getElementById('anm-agency-meta');
  if (metaEl) {
    metaEl.innerHTML = `담당 직원 <b>${agency.manager || '미지정'}</b> · 에이전시 담당자 ${agency.contact || '-'} · ${agency.email || '-'} · ${agency.phone || '-'}`;
  }

  const authorSel = document.getElementById('anm-author');
  if (authorSel) {
    const staffNames = (typeof MOCK_HQ_STAFF === 'undefined' ? [] : MOCK_HQ_STAFF.map(s => s.name));
    authorSel.innerHTML = staffNames.map(n => `<option value="${n}">${n}</option>`).join('');
    if (staffNames.includes(agency.manager)) authorSel.value = agency.manager;
  }
  const channelSel = document.getElementById('anm-channel');
  if (channelSel) channelSel.innerHTML = AGENCY_NOTE_CHANNELS.map(c => `<option value="${c}">${c}</option>`).join('');

  const dateEl = document.getElementById('anm-date');
  if (dateEl) dateEl.value = AGENCY_VISIT_TODAY;
  const contentEl = document.getElementById('anm-content');
  if (contentEl) contentEl.value = '';
  const impEl = document.getElementById('anm-important');
  if (impEl) impEl.checked = false;

  renderAgencyNoteList();
  if (typeof openModal === 'function') openModal('modal-agency-notes');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeAgencyNotesModal() {
  if (typeof closeModal === 'function') closeModal('modal-agency-notes');
  agencyNotesTargetId = null;
}

function bookVisitFromNotesModal() {
  if (agencyNotesTargetId === null) return;
  const targetId = agencyNotesTargetId;
  closeAgencyNotesModal();
  openAgencyVisitModal(null, targetId, AGENCY_VISIT_TODAY);
}

function renderAgencyNoteList() {
  const listEl = document.getElementById('anm-note-list');
  if (!listEl || agencyNotesTargetId === null) return;

  const notes = getAgencyNotes(agencyNotesTargetId);
  const countEl = document.getElementById('anm-note-count');
  if (countEl) countEl.textContent = `${notes.length}건`;

  /* 이 에이전시의 방문 일정도 함께 보여줘서 소통 흐름을 한 화면에서 확인 */
  const visitEl = document.getElementById('anm-visit-list');
  if (visitEl) {
    const visits = getAgencyVisits(agencyNotesTargetId).slice(0, 5);
    visitEl.innerHTML = visits.length
      ? visits.map(v => {
          const st = AGENCY_VISIT_STATUS[v.status] || AGENCY_VISIT_STATUS.scheduled;
          const tp = AGENCY_VISIT_TYPES[v.type] || AGENCY_VISIT_TYPES.inbound;
          return `<div style="display:flex;align-items:center;gap:6px;font-size:11px;padding:5px 0;border-bottom:1px dashed #E5E7EB">
            <span style="font-weight:700;color:#374151">${v.date}</span>
            <span style="color:#6B7280">${v.start}</span>
            <span>${tp.icon}</span>
            <span style="color:#4B5563;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${v.purpose}</span>
            <span class="tsa-badge" style="background:${st.bg};color:${st.color};font-size:9.5px;padding:1px 7px">${st.label}</span>
          </div>`;
        }).join('')
      : `<div style="font-size:11px;color:#9CA3AF;padding:6px 0">등록된 방문 일정이 없습니다.</div>`;
  }

  if (!notes.length) {
    listEl.innerHTML = `<div style="padding:22px;text-align:center;color:#9CA3AF;font-size:12px">아직 소통 기록이 없습니다. 첫 메모를 남겨보세요.</div>`;
    return;
  }

  listEl.innerHTML = notes.map(n => `
    <div style="border:1px solid ${n.important ? '#FDE68A' : '#E5E7EB'};background:${n.important ? '#FFFBEB' : '#fff'};border-radius:8px;padding:10px 12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${n.important ? '<span style="font-size:11px">📌</span>' : ''}
          <span style="font-size:11.5px;font-weight:800;color:#111827">${n.author}</span>
          <span class="tsa-badge tsa-badge-gray" style="font-size:9.5px;padding:1px 7px">${n.channel}</span>
          <span style="font-size:10.5px;color:#9CA3AF">${n.date}</span>
        </div>
        <button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="border-color:#FCA5A5;color:#DC2626" onclick="deleteAgencyNote(${n.id})">삭제</button>
      </div>
      <div style="font-size:12px;color:#374151;line-height:1.6;margin-top:7px;white-space:pre-wrap">${n.content}</div>
    </div>`).join('');
}

function addAgencyNote() {
  if (agencyNotesTargetId === null) return;
  const contentEl = document.getElementById('anm-content');
  const content = contentEl.value.trim();
  if (!content) {
    if (typeof showToast === 'function') showToast('메모 내용을 입력해 주세요.', 'warning');
    return;
  }
  MOCK_AGENCY_NOTES.push({
    id: _agencyNoteNextId++,
    agencyId: agencyNotesTargetId,
    date: document.getElementById('anm-date').value || AGENCY_VISIT_TODAY,
    author: document.getElementById('anm-author').value,
    channel: document.getElementById('anm-channel').value,
    content,
    important: document.getElementById('anm-important').checked,
  });
  contentEl.value = '';
  document.getElementById('anm-important').checked = false;
  renderAgencyNoteList();
  if (typeof showToast === 'function') showToast('✓ 소통 메모가 저장되었습니다.', 'success');
  if (typeof renderAgencyManage === 'function' && document.getElementById('view-agency-manage')?.classList.contains('active')) {
    renderAgencyManage();
  }
  if (document.getElementById('view-agency-visits')?.classList.contains('active')) renderAgencyVisitTable();
}

function deleteAgencyNote(id) {
  MOCK_AGENCY_NOTES = MOCK_AGENCY_NOTES.filter(n => n.id !== id);
  renderAgencyNoteList();
  if (typeof renderAgencyManage === 'function' && document.getElementById('view-agency-manage')?.classList.contains('active')) {
    renderAgencyManage();
  }
  if (document.getElementById('view-agency-visits')?.classList.contains('active')) renderAgencyVisitTable();
}

/* 에이전시 관리 목록에서 바로 방문 예약을 열 때 사용 */
function openAgencyVisitFromManage(agencyId) {
  openAgencyVisitModal(null, agencyId, AGENCY_VISIT_TODAY);
}

/* 에이전시 관리 표의 '소통 · 방문' 칸 : 최근 메모와 다음 방문 일정을 요약 */
function renderAgencyCommunicationCell(a) {
  if (!a || a.name === '직접 등록') return `<span style="font-size:11px;color:#D1D5DB">-</span>`;

  const note = getAgencyNoteSummary(a.id);
  const visit = getAgencyVisitSummary(a.id);

  const noteLine = note.count
    ? `<div style="font-size:11px;color:#374151"><b style="color:#5E5CE6">메모 ${note.count}</b> · ${note.last.date}</div>
       <div style="font-size:10px;color:#9CA3AF;max-width:150px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${note.last.channel} · ${note.last.content}</div>`
    : `<div style="font-size:11px;color:#D1D5DB">소통 기록 없음</div>`;

  const visitLine = visit.next
    ? `<div style="font-size:10.5px;color:#0EA5E9;font-weight:700;margin-top:3px">📅 ${visit.next.date} ${visit.next.start} 방문 예정</div>`
    : visit.last
      ? `<div style="font-size:10.5px;color:#9CA3AF;margin-top:3px">최근 방문 ${visit.last.date}</div>`
      : `<div style="font-size:10.5px;color:#D1D5DB;margin-top:3px">방문 일정 없음</div>`;

  return `<div style="display:flex;flex-direction:column;align-items:center;text-align:center">${noteLine}${visitLine}</div>`;
}
