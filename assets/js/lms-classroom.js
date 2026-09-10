/* =============================================
   TIMETABLE & ASSIGNMENT
   ============================================= */
function initTimetableGrid() {
  renderTimetable(false);
  renderUnassignedQueue();
  clearAssignWorkspace();
}

function switchTimetableDay(day) {
  APP.selectedDay = day;
  document.querySelectorAll('.tsa-day-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-day') === day);
  });
  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();
  clearAssignWorkspace();
}

/* ── 주간 날짜 유틸 ─────────────────────────── */
function getWeekDates(weekOffset) {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1) + weekOffset * 7);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;
  const dayNames = ['일','월','화','수','목','금','토'];
  const label = `${monday.getFullYear()}년 ${monday.getMonth()+1}월 ${monday.getDate()}일(${dayNames[monday.getDay()]}) ~ ${saturday.getMonth()+1}월 ${saturday.getDate()}일(${dayNames[saturday.getDay()]})`;
  const badge = weekOffset === 0 ? '이번 주' : weekOffset === -1 ? '지난 주' : weekOffset === 1 ? '다음 주' : `${weekOffset > 0 ? '+' : ''}${weekOffset}주`;
  return { monday, saturday, label, badge };
}

function findSlot(tData, period, day) {
  if (!tData) return null;
  return tData.slots.find(sl => Number(sl.p) === Number(period) && sl.day === day) || null;
}

/* 슬롯 타입 판별 */
function isGroupSlot(slot) {
  return !!(slot?.type && (slot.type.includes('Group') || slot.type.includes('그룹')));
}
function isGroupTeacher(teacher) {
  // 강사 전문분야가 그룹이거나, 실제 시간표 슬롯에 그룹 수업이 하나라도 있으면 그룹 탭에 포함
  if (teacher.type.includes('그룹')) return true;
  const entry = MOCK_TIMETABLE.find(t => t.teacher === teacher.nick);
  return !!(entry && entry.slots.some(s => isGroupSlot(s)));
}

// ── 에이전시 관리 ────────────────────────────────────
let MOCK_AGENCIES = [
  { id: 1, name: '한국 영어마을', country: '한국', flag: '🇰🇷', contact: '김지훈', phone: '+82-10-1234-5678', email: 'korea@talkstn.com', accountId: 'agency_head', commissionRate: 10, status: 'active', createdAt: '2025-01-15', note: '메인 파트너 / 카카오톡 채널 한국영어마을', address: '서울특별시 강남구 테헤란로 123', website: 'https://koreaenglishvillage.co.kr', officialSns: 'Instagram @koreaenglishvillage', bankName: 'Sample Bank', accountName: 'Korea English Village', accountNumber: '000-0000-0000', swiftCode: 'SAMPLEKRSE', bankAddress: 'Seoul, Republic of Korea', lat: 37.5006, lng: 127.0364, manager: '김민지' },
  { id: 7, name: '서울 유학원', country: '한국', flag: '🇰🇷', contact: '최영희', phone: '+82-10-9876-5432', email: 'seoul@talkstn.com', accountId: 'agency_seoul', commissionRate: 10, status: 'active', createdAt: '2025-08-12', note: '카카오톡 채널 서울유학원', address: '서울특별시 종로구 종로 50', website: 'https://seouledu.co.kr', officialSns: '카카오톡 채널 @서울유학원', lat: 37.5704, lng: 126.9831, manager: '박서준' },
  { id: 2, name: 'Tokyo Language', country: '일본', flag: '🇯🇵', contact: 'Tanaka Kenji', phone: '+81-90-1234-5678', email: 'tokyo@talkstn.com', accountId: 'agency_tokyo', commissionRate: 8, status: 'active', createdAt: '2025-03-01', note: '라인 ID @tokyo_lang', address: '東京都新宿区西新宿2-8-1', website: 'https://tokyolanguage.jp', officialSns: 'LINE @tokyo_lang', lat: 35.6896, lng: 139.6921, manager: '이하늘' },
  { id: 8, name: 'Osaka Study', country: '일본', flag: '🇯🇵', contact: 'Yamamoto Yui', phone: '+81-90-9876-5432', email: 'osaka@talkstn.com', accountId: 'agency_osaka', commissionRate: 8, status: 'active', createdAt: '2025-09-05', note: '라인 ID @osaka_study', address: '大阪府大阪市北区梅田3-1-1', website: 'https://osakastudy.jp', officialSns: 'LINE @osaka_study', lat: 34.7024, lng: 135.4959, manager: '이하늘' },
  { id: 3, name: 'Beijing Partner', country: '중국', flag: '🇨🇳', contact: 'Wang Fang', phone: '+86-10-1234-5678', email: 'beijing@talkstn.com', accountId: 'agency_beijing', commissionRate: 9, status: 'active', createdAt: '2025-04-10', note: '위챗 ID BJ_Partner01', address: '北京市朝阳区建国路88号', website: 'https://beijingpartner.cn', officialSns: 'WeChat BJ_Partner01', lat: 39.9087, lng: 116.4322, manager: '최우진' },
  { id: 4, name: 'VN Academy', country: '베트남', flag: '🇻🇳', contact: 'Nguyen Lan', phone: '+84-90-1234-5678', email: 'vn@talkstn.com', accountId: 'agency_vn', commissionRate: 7, status: 'inactive', createdAt: '2025-06-01', note: '일시 정지', address: 'Quận 1, Hồ Chí Minh, Việt Nam', website: 'https://vnacademy.vn', officialSns: 'Zalo @vnacademy', lat: 10.7769, lng: 106.7009, manager: '최우진' },
  { id: 9, name: '직접 등록', country: '한국', flag: '🏢', contact: 'TSA 본사', phone: '-', email: '-', accountId: '-', commissionRate: 0, status: 'active', createdAt: '2025-01-01', note: '에이전시를 거치지 않고 자사가 직접 등록한 학생', address: '', lat: null, lng: null, manager: '-' },
];
let _agencyNextId = 10;

const AGENCY_COMMISSION_ITEMS = [
  { key: 'registration', label: '등록금', defaultType: 'rate', defaultValue: 10 },
  { key: 'education', label: '수강료', defaultType: 'rate', defaultValue: 10 },
  { key: 'dorm', label: '기숙사비', defaultType: 'rate', defaultValue: 10 },
  { key: 'local', label: '기타 비용', defaultType: 'rate', defaultValue: 10 },
];

function normalizeAgencyCommissionPolicies(a) {
  if (a?.name === '직접 등록') {
    return Object.fromEntries(AGENCY_COMMISSION_ITEMS.map(item => [item.key, { type: 'none', value: 0 }]));
  }
  const legacyType = a?.commissionType === 'fixed' ? 'fixed' : 'rate';
  const legacyValue = legacyType === 'fixed'
    ? Number(a?.commissionAmount ?? a?.commissionRate ?? 0)
    : Number(a?.commissionRate ?? 0);
  const safeLegacyValue = Number.isFinite(legacyValue) ? legacyValue : 0;
  const source = a?.commissionPolicies || {};
  return Object.fromEntries(AGENCY_COMMISSION_ITEMS.map(item => {
    const saved = source[item.key] || {};
    const fallbackType = (item.key === 'education' || item.key === 'dorm')
      ? legacyType
      : item.defaultType;
    const fallbackValue = (item.key === 'education' || item.key === 'dorm')
      ? safeLegacyValue
      : item.defaultValue;
    const type = ['none', 'rate', 'fixed'].includes(saved.type) ? saved.type : fallbackType;
    const value = Number(saved.value ?? fallbackValue);
    return [item.key, {
      type,
      value: Number.isFinite(value) ? value : 0,
    }];
  }));
}

function renderAgencyCommissionPolicyCell(a, key) {
  const policies = normalizeAgencyCommissionPolicies(a);
  const policy = policies[key] || { type: 'none', value: 0 };
  const value = Number(policy.value || 0);
  if (policy.type === 'none' || value <= 0) {
    return `<span style="font-size:11px;color:#9CA3AF">-</span>`;
  }
  const label = policy.type === 'fixed'
    ? `$${value.toLocaleString()}`
    : `${value}%`;
  const subLabel = policy.type === 'fixed' ? '정액' : '정률';
  return `
    <div style="display:flex;flex-direction:column;align-items:center;gap:2px">
      <span style="font-size:12px;font-weight:800;color:#5E5CE6;white-space:nowrap">${label}</span>
      <span style="font-size:10px;color:#9CA3AF">${subLabel}</span>
    </div>
  `;
}

function renderAgencyManage() {
  const tbody = document.getElementById('agency-manage-tbody');
  if (!tbody) return;

  // 같은 상위 에이전시명(name)을 공유하는 지사가 여러 개일 경우, 학생 수는
  // 첫 번째(대표) 지사에서만 집계하여 중복 카운트를 방지한다.
  const seenAgencyName = {};
  tbody.innerHTML = MOCK_AGENCIES.map((a, idx) => {
    const isPrimaryForName = !seenAgencyName[a.name];
    seenAgencyName[a.name] = true;

    const studentCount = isPrimaryForName ? MOCK_STUDENTS.filter(s => s.agency === a.name).length : null;
    const activeCount  = isPrimaryForName ? MOCK_STUDENTS.filter(s => s.agency === a.name && (s.status === 'current' || s.status === 'extended')).length : null;
    const statusBadge = a.name === '직접 등록'
      ? (a.status === 'active'
          ? `<span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;background:#D1FAE5;color:#065F46">활성</span>`
          : `<span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;background:#F3F4F6;color:#6B7280">비활성</span>`)
      : (a.status === 'active'
          ? `<button onclick="toggleAgencyStatus(${a.id})" title="클릭하여 비활성화" style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;background:#D1FAE5;color:#065F46;border:none;cursor:pointer">활성</button>`
          : `<button onclick="toggleAgencyStatus(${a.id})" title="클릭하여 활성화" style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;background:#F3F4F6;color:#6B7280;border:none;cursor:pointer">비활성</button>`);

    const displayName = a.branch ? `${a.name} <span style="font-weight:600;color:#5E5CE6">· ${a.branch}</span>` : a.name;
    const studentCell = isPrimaryForName
      ? `<div style="font-size:14px;font-weight:800;color:#111827">${studentCount}명</div><div style="font-size:10.5px;color:#10B981">재학 ${activeCount}명</div>`
      : `<div style="font-size:11px;color:#9CA3AF">본사 통합 집계</div>`;
    const managerStaff = typeof MOCK_HQ_STAFF === 'undefined'
      ? null
      : MOCK_HQ_STAFF.find(st => st.name === a.manager);
    const managerCell = a.manager && a.manager !== '-'
      ? `<div style="font-size:12px;font-weight:700;color:#374151">${a.manager}</div>
         <div style="font-size:10.5px;color:#9CA3AF;margin-top:2px">${managerStaff ? managerStaff.dept : ''}</div>`
      : '<span style="font-size:11px;color:#9CA3AF">미지정</span>';

    const contacts = Array.isArray(a.contacts) && a.contacts.length
      ? a.contacts
      : (a.contact ? [{ name: a.contact, phone: a.contactPhone || a.phone, email: a.contactEmail || a.email }] : []);
    const primaryContact = contacts[0];
    const extraContactCount = Math.max(0, contacts.length - 1);
    const contactCell = primaryContact
      ? `<div style="font-size:11px;color:#6B7280;margin-top:2px">${a.country || '-'} · 담당: ${primaryContact.name || '-'}${extraContactCount > 0 ? ` <span style="color:#5E5CE6;font-weight:700">외 ${extraContactCount}명</span>` : ''}</div>
         <div style="font-size:11px;color:#9CA3AF">대표 연락처 ${a.phone || '-'}</div>`
      : `<div style="font-size:11px;color:#6B7280;margin-top:2px">${a.country || '-'} · 담당자 미등록</div>
         <div style="font-size:11px;color:#9CA3AF">대표 연락처 ${a.phone || '-'}</div>`;
    const websiteCell = a.website
      ? `<a href="${a.website}" target="_blank" style="color:#5E5CE6;text-decoration:none;font-size:11.5px;word-break:break-all">${a.website}</a>`
      : `<span style="font-size:11px;color:#D1D5DB">-</span>`;
    const snsCell = a.officialSns
      ? `<span style="font-size:11.5px;color:#374151">${a.officialSns}</span>`
      : `<span style="font-size:11px;color:#D1D5DB">-</span>`;

    return `<tr>
      <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${idx + 1}</td>
      <td>
        <div style="font-size:13px;font-weight:700;color:#111827">${a.flag} ${displayName}</div>
        ${contactCell}
      </td>
      <td style="max-width:160px">${websiteCell}</td>
      <td style="max-width:150px">${snsCell}</td>
      <td style="font-size:12px;color:#374151">${a.email}</td>
      <td style="text-align:center">${managerCell}</td>
      <td style="text-align:center">${typeof renderAgencyCommunicationCell === 'function' ? renderAgencyCommunicationCell(a) : '-'}</td>
      <td style="text-align:center">
        ${studentCell}
      </td>
      <td style="text-align:center">${renderAgencyCommissionPolicyCell(a, 'registration')}</td>
      <td style="text-align:center">${renderAgencyCommissionPolicyCell(a, 'education')}</td>
      <td style="text-align:center">${renderAgencyCommissionPolicyCell(a, 'dorm')}</td>
      <td style="text-align:center">${renderAgencyCommissionPolicyCell(a, 'local')}</td>
      <td style="text-align:center">${statusBadge}</td>
      <td>
        ${a.name === '직접 등록' ? '' : `
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
          <button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="viewAsAgency('${a.accountId}')">포털 보기</button>
          <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openAgencyEditModal(${a.id})">수정</button>
          <button class="tsa-btn tsa-btn-xs tsa-btn-outline" style="border-color:#5E5CE6;color:#5E5CE6" onclick="openAgencyNotesModal(${a.id})">소통 메모</button>
          <button class="tsa-btn tsa-btn-xs tsa-btn-outline" style="border-color:#0EA5E9;color:#0EA5E9" onclick="openAgencyVisitFromManage(${a.id})">방문 예약</button>
        </div>`}
      </td>
    </tr>`;
  }).join('');

  // KPI
  const total    = MOCK_AGENCIES.length;
  const active   = MOCK_AGENCIES.filter(a => a.status === 'active').length;
  const students = MOCK_STUDENTS.filter(s => MOCK_AGENCIES.some(a => a.name === s.agency)).length;
  document.getElementById('agm-kpi-total')    && (document.getElementById('agm-kpi-total').textContent    = total + '개');
  document.getElementById('agm-kpi-active')   && (document.getElementById('agm-kpi-active').textContent   = active + '개');
  document.getElementById('agm-kpi-students') && (document.getElementById('agm-kpi-students').textContent = students + '명');

  // 국가별 색상 매핑 (국기 라벨에 국가명 포함하여 범례에 표시)
  const countryColors = { '한국': '#5E5CE6', '일본': '#EF4444', '중국': '#F59E0B', '베트남': '#10B981', '몽골': '#8B5CF6' };
  const flagOf = country => { const s = MOCK_AGENCIES.find(a => (a.country || '미지정') === country); return s ? s.flag : '🏳️'; };

  // 국가별 에이전시 수 — 도넛 차트
  const countryStatsEl = document.getElementById('agm-country-stats');
  if (countryStatsEl && typeof buildDonutChartHtml === 'function') {
    const counts = {};
    MOCK_AGENCIES.forEach(a => {
      const key = a.country || '미지정';
      counts[key] = (counts[key] || 0) + 1;
    });
    const entries = Object.entries(counts).map(([country, cnt]) => [`${flagOf(country)} ${country}`, cnt]);
    const colorMapWithFlag = {};
    Object.keys(counts).forEach(country => { colorMapWithFlag[`${flagOf(country)} ${country}`] = countryColors[country] || null; });
    countryStatsEl.innerHTML = buildDonutChartHtml(entries, colorMapWithFlag, `${total}개`, '에이전시');
  }

  // 국가별 소속 학생 수 — 도넛 차트 (같은 이름의 지사가 여러 개여도 학생은 한 번만 집계)
  const studentChartEl = document.getElementById('agm-country-student-chart');
  if (studentChartEl && typeof buildDonutChartHtml === 'function') {
    const studentCounts = {};
    const countedAgencyName = {};
    MOCK_AGENCIES.forEach(a => {
      if (countedAgencyName[a.name]) return;
      countedAgencyName[a.name] = true;
      const key = a.country || '미지정';
      const cnt = MOCK_STUDENTS.filter(s => s.agency === a.name).length;
      studentCounts[key] = (studentCounts[key] || 0) + cnt;
    });
    const entries = Object.entries(studentCounts).filter(([, cnt]) => cnt > 0).map(([country, cnt]) => [`${flagOf(country)} ${country}`, cnt]);
    const colorMapWithFlag = {};
    Object.keys(studentCounts).forEach(country => { colorMapWithFlag[`${flagOf(country)} ${country}`] = countryColors[country] || null; });
    studentChartEl.innerHTML = buildDonutChartHtml(entries, colorMapWithFlag, `${students}명`, '소속 학생');
  }

  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function viewAsAgency(accountId) {
  // 어드민이 에이전시 화면으로 전환
  APP.user = 'agency_head';
  APP.prevAdminUser = 'super_admin';
  applyRoleUI();
  navigate('agency-home');
  showToast(`에이전시 포털 뷰로 전환됩니다. 돌아오려면 로그아웃 후 재로그인하세요.`, 'info');
}

function toggleAgencyStatus(id) {
  const a = MOCK_AGENCIES.find(x => x.id === id);
  if (!a) return;
  a.status = a.status === 'active' ? 'inactive' : 'active';
  showToast(`${a.name} 에이전시가 ${a.status === 'active' ? '활성화' : '비활성화'}되었습니다.`, 'success');
  renderAgencyManage();
}

function populateAgmManagerSelect(selectedId) {
  const sel = document.getElementById('agm-manager');
  if (!sel || typeof MOCK_HQ_STAFF === 'undefined') return;
  sel.innerHTML = '<option value="">— 선택 —</option>' +
    MOCK_HQ_STAFF.map(st => `<option value="${st.name}">${st.name} (${st.dept})</option>`).join('');
  if (selectedId) sel.value = selectedId;
}

let editingAgencyContacts = [];

function readAgencyContactRows() {
  return editingAgencyContacts.map((contact, index) => ({
    name: document.getElementById(`agm-contact-name-${index}`)?.value.trim() || '',
    gender: document.getElementById(`agm-contact-gender-${index}`)?.value || '',
    phone: document.getElementById(`agm-contact-phone-${index}`)?.value.trim() || '',
    email: document.getElementById(`agm-contact-email-${index}`)?.value.trim() || '',
    sns: document.getElementById(`agm-contact-sns-${index}`)?.value.trim() || '',
  }));
}

function renderAgencyContactRows() {
  const target = document.getElementById('agm-contact-list');
  if (!target) return;
  target.innerHTML = editingAgencyContacts.map((contact, index) => `
    <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F9FAFB">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><b style="font-size:12px;color:#374151">담당자 ${index + 1}</b><button type="button" class="tsa-btn tsa-btn-outline tsa-btn-xs" style="color:#EF4444" onclick="removeAgencyContactRow(${index})">삭제</button></div>
      <div style="display:grid;grid-template-columns:1fr 150px 1fr;gap:10px">
        <div><label class="tsa-label">이름</label><input id="agm-contact-name-${index}" class="tsa-input" value="${contact.name || ''}" placeholder="담당자 이름"/></div>
        <div><label class="tsa-label">성별</label><select id="agm-contact-gender-${index}" class="tsa-input"><option value="">선택</option><option value="male" ${contact.gender === 'male' ? 'selected' : ''}>남성</option><option value="female" ${contact.gender === 'female' ? 'selected' : ''}>여성</option><option value="other" ${contact.gender === 'other' ? 'selected' : ''}>기타</option></select></div>
        <div><label class="tsa-label">연락처</label><input id="agm-contact-phone-${index}" class="tsa-input" value="${contact.phone || ''}" placeholder="+82-10-0000-0000"/></div>
        <div><label class="tsa-label">이메일</label><input id="agm-contact-email-${index}" class="tsa-input" type="email" value="${contact.email || ''}" placeholder="contact@example.com"/></div>
        <div style="grid-column:span 2"><label class="tsa-label">SNS(기타)</label><input id="agm-contact-sns-${index}" class="tsa-input" value="${contact.sns || ''}" placeholder="카카오톡·위챗·라인 등 서비스명과 ID"/></div>
      </div>
    </div>
  `).join('') || `<div style="padding:14px;text-align:center;color:#9CA3AF;font-size:11.5px;border:1px dashed #D1D5DB;border-radius:10px">등록된 담당자가 없습니다. 담당자 추가 버튼을 눌러 등록해 주세요.</div>`;
}

function addAgencyContactRow() {
  editingAgencyContacts = readAgencyContactRows();
  editingAgencyContacts.push({ name: '', gender: '', phone: '', email: '', sns: '' });
  renderAgencyContactRows();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function removeAgencyContactRow(index) {
  editingAgencyContacts = readAgencyContactRows();
  editingAgencyContacts.splice(index, 1);
  renderAgencyContactRows();
}

function openAgencyRegisterModal() {
  document.getElementById('agm-modal-title').textContent = '에이전시 등록';
  document.getElementById('agm-modal-id').value = '';
  ['agm-name','agm-country','agm-phone','agm-email','agm-address','agm-website','agm-official-sns','agm-password','agm-note','agm-legal-name','agm-registration-number','agm-bank-name','agm-bank-account-name','agm-bank-account-number','agm-bank-swift','agm-bank-address'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const documentInput = document.getElementById('agm-documents');
  if (documentInput) documentInput.value = '';
  const documentSummary = document.getElementById('agm-document-summary');
  if (documentSummary) documentSummary.textContent = '등록된 서류가 없습니다.';
  setAgencyCommissionPolicyInputs(normalizeAgencyCommissionPolicies({ commissionRate: 10 }));
  editingAgencyContacts = [{ name: '', gender: '', phone: '', email: '', sns: '' }];
  renderAgencyContactRows();
  populateAgmManagerSelect('');
  document.getElementById('agency-manage-modal').style.display = 'block';
  document.getElementById('agency-manage-backdrop').style.display = 'block';
  updateAgmMapPreview();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function openAgencyEditModal(id) {
  const a = MOCK_AGENCIES.find(x => x.id === id);
  if (!a) return;
  document.getElementById('agm-modal-title').textContent = '에이전시 수정';
  document.getElementById('agm-modal-id').value = id;
  document.getElementById('agm-name').value       = a.name;
  document.getElementById('agm-country').value    = a.country;
  document.getElementById('agm-phone').value      = a.phone;
  document.getElementById('agm-email').value      = a.email;
  document.getElementById('agm-address').value    = a.address || '';
  document.getElementById('agm-website').value    = a.website || '';
  document.getElementById('agm-official-sns').value = a.officialSns || '';
  document.getElementById('agm-password').value   = '';
  document.getElementById('agm-legal-name').value = a.legalName || '';
  document.getElementById('agm-registration-number').value = a.registrationNumber || '';
  document.getElementById('agm-bank-name').value = a.bankName || '';
  document.getElementById('agm-bank-account-name').value = a.accountName || '';
  document.getElementById('agm-bank-account-number').value = a.accountNumber || '';
  document.getElementById('agm-bank-swift').value = a.swiftCode || '';
  document.getElementById('agm-bank-address').value = a.bankAddress || '';
  const documentInput = document.getElementById('agm-documents');
  if (documentInput) documentInput.value = '';
  const documentSummary = document.getElementById('agm-document-summary');
  if (documentSummary) documentSummary.textContent = a.documents?.length ? `등록 서류: ${a.documents.join(', ')}` : '등록된 서류가 없습니다.';
  setAgencyCommissionPolicyInputs(normalizeAgencyCommissionPolicies(a));
  editingAgencyContacts = Array.isArray(a.contacts) && a.contacts.length
    ? a.contacts.map(contact => ({ ...contact }))
    : [{ name: a.contact || '', gender: '', phone: a.contactPhone || a.phone || '', email: a.contactEmail || a.email || '', sns: a.contactSns || '' }];
  renderAgencyContactRows();
  document.getElementById('agm-note').value        = a.note || '';
  populateAgmManagerSelect(a.manager || '');
  document.getElementById('agency-manage-modal').style.display = 'block';
  document.getElementById('agency-manage-backdrop').style.display = 'block';
  updateAgmMapPreview();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function updateAgmMapPreview() {
  const addr = (document.getElementById('agm-address') || {}).value || '';
  const wrap = document.getElementById('agm-map-preview-wrap');
  const frame = document.getElementById('agm-map-preview');
  if (!wrap || !frame) return;
  if (!addr.trim()) { wrap.style.display = 'none'; frame.src = ''; return; }
  frame.src = `https://maps.google.com/maps?q=${encodeURIComponent(addr)}&output=embed`;
  wrap.style.display = 'block';
}

function closeAgencyManageModal() {
  document.getElementById('agency-manage-modal').style.display = 'none';
  document.getElementById('agency-manage-backdrop').style.display = 'none';
}

function updateAgencyDocumentSummary() {
  const input = document.getElementById('agm-documents');
  const summary = document.getElementById('agm-document-summary');
  if (!summary) return;
  const names = input?.files ? Array.from(input.files).map(file => file.name) : [];
  summary.textContent = names.length ? `선택 서류 ${names.length}개: ${names.join(', ')}` : '등록된 서류가 없습니다.';
}

function setAgencyCommissionPolicyInputs(policies) {
  AGENCY_COMMISSION_ITEMS.forEach(item => {
    const typeEl = document.getElementById(`agm-commission-type-${item.key}`);
    const valueEl = document.getElementById(`agm-commission-${item.key}`);
    const policy = policies[item.key] || { type: item.defaultType, value: item.defaultValue };
    if (typeEl) typeEl.value = policy.type;
    document.querySelectorAll(`input[name="agm-commission-type-${item.key}-radio"]`).forEach(radio => {
      radio.checked = radio.value === policy.type;
    });
    if (valueEl) valueEl.value = Number(policy.value || 0);
  });
  updateAgencyCommissionInputLabels();
}

function setAgencyCommissionType(key, type) {
  const input = document.getElementById(`agm-commission-type-${key}`);
  if (input) input.value = type;
  updateAgencyCommissionInputLabels();
}

function readAgencyCommissionPolicyInputs() {
  return Object.fromEntries(AGENCY_COMMISSION_ITEMS.map(item => {
    const type = (document.getElementById(`agm-commission-type-${item.key}`) || {}).value || item.defaultType;
    const value = Math.max(parseFloat((document.getElementById(`agm-commission-${item.key}`) || {}).value) || 0, 0);
    return [item.key, {
      type: ['none', 'rate', 'fixed'].includes(type) ? type : item.defaultType,
      value,
    }];
  }));
}

function updateAgencyCommissionInputLabels() {
  const help = document.getElementById('agm-commission-help');
  AGENCY_COMMISSION_ITEMS.forEach(item => {
    const type = (document.getElementById(`agm-commission-type-${item.key}`) || {}).value || item.defaultType;
    const input = document.getElementById(`agm-commission-${item.key}`);
    if (!input) return;
    input.disabled = type === 'none';
    input.placeholder = type === 'fixed' ? '예: 200' : type === 'rate' ? '예: 10' : '0';
    input.max = type === 'rate' ? '100' : '';
    input.step = type === 'fixed' ? '1' : '0.1';
    if (type === 'none') input.value = '0';
  });
  if (help) {
    help.textContent = '정률은 해당 항목 금액의 비율로, 정액은 해당 항목에서 고정 금액으로 커미션을 계산합니다.';
  }
}

function saveAgencyManage() {
  const name    = document.getElementById('agm-name').value.trim();
  const country = document.getElementById('agm-country').value.trim();
  const email   = document.getElementById('agm-email').value.trim();
  const accountId = email;
  const legalName = document.getElementById('agm-legal-name').value.trim();
  const bankName = document.getElementById('agm-bank-name').value.trim();
  const bankAccountName = document.getElementById('agm-bank-account-name').value.trim();
  const bankAccountNumber = document.getElementById('agm-bank-account-number').value.trim();
  const contacts = readAgencyContactRows().filter(contact => contact.name || contact.phone || contact.email || contact.sns);
  const primaryContact = contacts[0] || { name: '', phone: '', email: '', sns: '' };
  const commissionPolicies = readAgencyCommissionPolicyInputs();
  const manager = document.getElementById('agm-manager').value;
  if (!name || !email) { showToast('에이전시명과 공식 이메일을 입력해 주세요.', 'danger'); return; }
  if (!manager) { showToast('담당 어학원 직원을 선택해 주세요.', 'danger'); return; }

  const id = document.getElementById('agm-modal-id').value;
  const existingAgency = id ? MOCK_AGENCIES.find(a => a.id === parseInt(id)) : null;
  const selectedDocuments = Array.from(document.getElementById('agm-documents')?.files || []).map(file => file.name);
  const data = {
    name, country, contact: primaryContact.name,
    phone: document.getElementById('agm-phone').value.trim(),
    email, accountId,
    website: document.getElementById('agm-website').value.trim(),
    officialSns: document.getElementById('agm-official-sns').value.trim(),
    contacts,
    contactPhone: primaryContact.phone,
    contactEmail: primaryContact.email,
    contactSns: primaryContact.sns,
    commissionPolicies,
    commissionType: 'itemized',
    commissionRate: Number(commissionPolicies.education?.type === 'rate' ? commissionPolicies.education.value : 0),
    commissionAmount: 0,
    manager,
    address: document.getElementById('agm-address').value.trim(),
    legalName,
    registrationNumber: document.getElementById('agm-registration-number').value.trim(),
    bankName,
    accountName: bankAccountName,
    accountNumber: bankAccountNumber,
    swiftCode: document.getElementById('agm-bank-swift').value.trim(),
    bankAddress: document.getElementById('agm-bank-address').value.trim(),
    documents: selectedDocuments.length ? selectedDocuments : (existingAgency?.documents || []),
    note: document.getElementById('agm-note').value.trim(),
    flag: '🏢',
  };

  if (id) {
    const idx = MOCK_AGENCIES.findIndex(a => a.id === parseInt(id));
    if (idx >= 0) MOCK_AGENCIES[idx] = { ...MOCK_AGENCIES[idx], ...data };
    showToast(`✓ ${name} 에이전시 정보가 수정되었습니다.`, 'success');
  } else {
    MOCK_AGENCIES.push({ id: _agencyNextId++, ...data, status: 'active', createdAt: '2026-06-23' });
    showToast(`✓ ${name} 에이전시가 등록되었습니다.`, 'success');
  }
  closeAgencyManageModal();
  renderAgencyManage();
}
let _agmMap = null;
let _agmMarkers = {};

function ensureAgmMap() {
  const el = document.getElementById('agmap-leaflet');
  if (!el || typeof L === 'undefined') return null;
  if (_agmMap) {
    setTimeout(() => _agmMap.invalidateSize(), 50);
    return _agmMap;
  }
  _agmMap = L.map('agmap-leaflet').setView([25, 122], 3);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(_agmMap);
  return _agmMap;
}

let _agmapFilter = 'all';

function setAgencyMapFilter(filter) {
  _agmapFilter = filter;
  ['all','active','inactive'].forEach(f => {
    const btn = document.getElementById(`agmap-filter-${f}`);
    if (!btn) return;
    btn.classList.toggle('tsa-btn-primary', f === filter);
    btn.classList.toggle('tsa-btn-outline', f !== filter);
    if (f !== filter) {
      const colors = { active: '#10B981', inactive: '#9CA3AF' };
      btn.style.borderColor = colors[f] || '';
      btn.style.color = colors[f] || '';
    } else {
      btn.style.borderColor = '';
      btn.style.color = '';
    }
  });
  renderAgencyMap();
}

function renderAgencyMap() {
  const groupsEl = document.getElementById('agmap-country-groups');
  if (!groupsEl) return;

  const map = ensureAgmMap();

  const filteredAgencies = MOCK_AGENCIES.filter(a => {
    if (_agmapFilter === 'active') return a.status === 'active';
    if (_agmapFilter === 'inactive') return a.status !== 'active';
    return true;
  });

  const byCountry = {};
  filteredAgencies.forEach(a => {
    const key = a.country || '미지정';
    if (!byCountry[key]) byCountry[key] = [];
    byCountry[key].push(a);
  });

  groupsEl.innerHTML = Object.entries(byCountry).map(([country, list]) => `
    <div style="margin-bottom:16px">
      <div onclick="zoomAgmCountry('${country}')" style="cursor:pointer;font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;display:flex;align-items:center;gap:4px;padding:4px 6px;border-radius:6px" onmouseover="this.style.background='#F8F9FF'" onmouseout="this.style.background='transparent'">
        <i data-lucide="globe" style="width:13px;height:13px;color:#5E5CE6"></i>
        ${list[0].flag} ${country} <span style="color:#9CA3AF;font-weight:500">(${list.length}개)</span>
        <span style="margin-left:auto;font-size:10px;color:#5E5CE6;font-weight:600">전체 보기 →</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${list.map(a => `
          <div onclick="selectAgmPin(${a.id})" style="cursor:pointer;border:1px solid #E5E7EB;border-radius:8px;padding:10px 12px;display:flex;align-items:center;gap:10px;transition:background .15s" onmouseover="this.style.background='#F8F9FF'" onmouseout="this.style.background='#fff'">
            <i data-lucide="map-pin" style="color:#EF4444;width:16px;height:16px;flex-shrink:0"></i>
            <div style="flex:1;min-width:0">
              <div style="font-size:12.5px;font-weight:700;color:#111827">${a.name}${a.branch ? ` · ${a.branch}` : ''}</div>
              <div style="font-size:11px;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.address || '주소 미등록'}</div>
            </div>
            <span style="font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:10px;background:${a.status === 'active' ? '#D1FAE5' : '#F3F4F6'};color:${a.status === 'active' ? '#065F46' : '#6B7280'}">${a.status === 'active' ? '활성' : '비활성'}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // 지도 마커 갱신
  if (map) {
    Object.values(_agmMarkers).forEach(m => map.removeLayer(m));
    _agmMarkers = {};
    filteredAgencies.forEach(a => {
      if (typeof a.lat !== 'number' || typeof a.lng !== 'number') return;
      const marker = L.marker([a.lat, a.lng]).addTo(map);
      marker.bindPopup(`<strong>${a.flag} ${a.name}${a.branch ? ` · ${a.branch}` : ''}</strong><br>${a.address || ''}`);
      marker.on('click', () => selectAgmPin(a.id, false));
      _agmMarkers[a.id] = marker;
    });
  }

  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function zoomAgmCountry(country) {
  const map = ensureAgmMap();
  if (!map) return;
  const infoEl = document.getElementById('agmap-selected-info');
  const list = MOCK_AGENCIES.filter(a => {
    if (_agmapFilter === 'active' && a.status !== 'active') return false;
    if (_agmapFilter === 'inactive' && a.status === 'active') return false;
    return (a.country || '미지정') === country && typeof a.lat === 'number';
  });
  if (list.length === 0) {
    if (infoEl) infoEl.innerHTML = `<strong>${country}</strong> — 등록된 위치 정보가 없습니다.`;
    return;
  }
  if (infoEl) infoEl.innerHTML = `<strong>${list[0].flag} ${country}</strong> 전체 지사 ${list.length}곳을 지도에 표시 중입니다.`;
  if (list.length === 1) {
    map.setView([list[0].lat, list[0].lng], 12);
  } else {
    const bounds = L.latLngBounds(list.map(a => [a.lat, a.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function selectAgmPin(id, openPopup) {
  if (openPopup === undefined) openPopup = true;
  const a = MOCK_AGENCIES.find(x => x.id === id);
  if (!a) return;
  const infoEl = document.getElementById('agmap-selected-info');
  if (infoEl) infoEl.innerHTML = `<strong>${a.flag} ${a.name}${a.branch ? ` · ${a.branch}` : ''}</strong> · ${a.country} &nbsp;·&nbsp; ${a.address || '주소 미등록'}`;
  const map = ensureAgmMap();
  if (map && typeof a.lat === 'number' && typeof a.lng === 'number') {
    map.setView([a.lat, a.lng], 15);
    const marker = _agmMarkers[a.id];
    if (marker && openPopup) marker.openPopup();
  }
}
// ── 에이전시 관리 끝 ──────────────────────────────────

let MOCK_CLASSROOMS = [
  // 호실은 실제 건물 기준(M = 1:1, G = 그룹).
  // 동·층은 두지 않는다 — 모든 강의실이 같은 건물 한 층에 있어 구분할 값이 없다.
  { id: 1, room: 'M01', capacity: 2, type: '1:1', status: 'active', memo: '' },
  { id: 2, room: 'M02', capacity: 2, type: '1:1', status: 'active', memo: '' },
  { id: 3, room: 'M03', capacity: 2, type: '1:1', status: 'active', memo: '' },
  { id: 4, room: 'M04', capacity: 2, type: '1:1', status: 'active', memo: '파트타임 전용' },
  { id: 5, room: 'G01', capacity: 4, type: '그룹', status: 'active', memo: '소그룹(1:4)' },
  { id: 6, room: 'G02', capacity: 4, type: '그룹', status: 'maintenance', memo: '에어컨 점검 중' },
  { id: 7, room: 'G06', capacity: 8, type: '멀티', status: 'active', memo: '대그룹(1:8) · 주니어 전용' },
];
let _crNextId = 8;

function switchClassroomTab(tab, el) {
  if (el) {
    el.parentNode.querySelectorAll('.tsa-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  document.querySelectorAll('.classroom-tab-content').forEach(c => c.style.display = 'none');
  if (tab === 'oneone') {
    document.getElementById('classroom-tab-oneone').style.display = 'block';
  } else if (tab === 'group') {
    document.getElementById('classroom-tab-group').style.display = 'block';
  }
  renderClassroomManage();
}

function renderClassroomManage() {
  const oneoneTbody = document.getElementById('classroom-oneone-tbody');
  const groupTbody = document.getElementById('classroom-group-tbody');
  if (!oneoneTbody || !groupTbody) return;

  const statusLabel = { active: '운영 중', maintenance: '점검 중', closed: '사용 불가' };
  const statusColor = { active: '#16A34A', maintenance: '#D97706', closed: '#EF4444' };

  // 1:1 강의실 렌더링
  const oneoneRooms = MOCK_CLASSROOMS.filter(c => c.type === '1:1' || c.type === '1:1 전용');
  const assignedTeacherNicks = new Set();
  const roomRows = oneoneRooms.map(c => {
    const teacher = MOCK_TEACHERS.find(t => t.room === c.room && t.status !== 'resigned');
    if (teacher) assignedTeacherNicks.add(teacher.nick);
    const teacherHtml = teacher 
      ? `<span style="font-weight:600">${teacher.nick}</span> <span style="font-size:11px;color:#6B7280">${teacher.name}</span>` 
      : '<span style="color:#D1D5DB;font-size:12px">미배정</span>';
    return `<tr>
      <td style="font-weight:700">${c.room}</td>
      <td style="text-align:center">${c.capacity}명</td>
      <td><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#EEF2FF;color:#5E5CE6;font-weight:600">${c.type}</span></td>
      <td>${teacherHtml}</td>
      <td><span style="font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;background:${statusColor[c.status]}18;color:${statusColor[c.status]}">${statusLabel[c.status]}</span></td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openEditClassroomModal(${c.id})">수정</button>
          <button class="tsa-btn tsa-btn-xs" style="background:#FEE2E2;color:#EF4444;border:none" onclick="deleteClassroom(${c.id})">삭제</button>
        </div>
      </td>
    </tr>`;
  }).join('');
  const unassignedTeachers = MOCK_TEACHERS.filter(t => t.status !== 'resigned' && !assignedTeacherNicks.has(t.nick));
  const unassignedRows = unassignedTeachers.map(teacher => `
    <tr style="background:#FFFBEB">
      <td><span style="font-size:10.5px;font-weight:800;color:#B45309">강의실 배정 필요</span></td>
      <td style="text-align:center;color:#9CA3AF">-</td>
      <td><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#EEF2FF;color:#5E5CE6;font-weight:600">1:1</span></td>
      <td><span style="font-weight:700">${teacher.nick}</span> <span style="font-size:11px;color:#6B7280">${teacher.name}</span></td>
      <td><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#FEF3C7;color:#B45309;font-weight:700">미배정</span></td>
      <td><button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="openAssignTeacherClassroom('${teacher.nick}')">담당 강의실 배정</button></td>
    </tr>
  `).join('');
  oneoneTbody.innerHTML = roomRows + unassignedRows;

  // 그룹 강의실 렌더링
  const groupRooms = MOCK_CLASSROOMS.filter(c => c.type === '그룹' || c.type === '그룹 강의실' || c.type === '멀티');
  groupTbody.innerHTML = groupRooms.map(c => {
    // 임의의 모의 그룹 수업 배정
    let assignedClass = '미배정';
    if (c.room === 'G01') assignedClass = '<span style="color:#5E5CE6;font-weight:700">IELTS A반 (Sarah)</span>';
    else if (c.room === 'G02') assignedClass = '<span style="color:#D97706;font-weight:700">비즈니스 중급반 (David)</span>';
    
    return `<tr>
      <td style="font-weight:700">${c.room}</td>
      <td style="text-align:center">${c.capacity}명</td>
      <td><span style="font-size:11px;padding:2px 8px;border-radius:10px;background:#ECFDF5;color:#10B981;font-weight:600">${c.type}</span></td>
      <td>${assignedClass}</td>
      <td><span style="font-size:11px;padding:2px 8px;border-radius:10px;font-weight:600;background:${statusColor[c.status]}18;color:${statusColor[c.status]}">${statusLabel[c.status]}</span></td>
      <td>
        <div style="display:flex;gap:4px">
          <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openEditClassroomModal(${c.id})">수정</button>
          <button class="tsa-btn tsa-btn-xs" style="background:#FEE2E2;color:#EF4444;border:none" onclick="deleteClassroom(${c.id})">삭제</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function _fillClassroomTeacherSelect(selectedNick) {
  const sel = document.getElementById('cr-modal-teacher');
  if (!sel) return;
  const active = MOCK_TEACHERS.filter(t => t.status !== 'resigned');
  sel.innerHTML = '<option value="">— 미배정 —</option>' +
    active.map(t => `<option value="${t.nick}" ${t.nick === selectedNick ? 'selected' : ''}>${t.nick} (${t.name}) · ${t.type}</option>`).join('');
}

function openAssignTeacherClassroom(teacherNick) {
  const emptyRoom = MOCK_CLASSROOMS.find(room => {
    if (!(room.type === '1:1' || room.type === '1:1 전용')) return false;
    return !MOCK_TEACHERS.some(teacher => teacher.status !== 'resigned' && teacher.room === room.room);
  });
  if (emptyRoom) {
    openEditClassroomModal(emptyRoom.id);
  } else {
    openAddClassroomModal('1:1');
  }
  const teacherSelect = document.getElementById('cr-modal-teacher');
  if (teacherSelect) teacherSelect.value = teacherNick;
}

function openAddClassroomModal(defaultType) {
  document.getElementById('classroom-modal-title').textContent = '강의실 추가';
  document.getElementById('cr-modal-id').value = '';
  document.getElementById('cr-modal-room').value = '';
  
  const typeVal = (defaultType === '그룹 강의실') ? '그룹' : '1:1';
  const capVal = (defaultType === '그룹 강의실') ? '8' : '2';

  document.getElementById('cr-modal-capacity').value = capVal;
  document.getElementById('cr-modal-type').value = typeVal;
  document.getElementById('cr-modal-status').value = 'active';
  document.getElementById('cr-modal-memo').value = '';
  _fillClassroomTeacherSelect('');
  document.getElementById('classroom-modal').style.display = 'block';
  document.getElementById('classroom-modal-backdrop').style.display = 'block';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function openEditClassroomModal(id) {
  const c = MOCK_CLASSROOMS.find(x => x.id === id);
  if (!c) return;
  // 현재 이 강의실에 배정된 강사 찾기
  const assignedTeacher = MOCK_TEACHERS.find(t => t.room === c.room && t.status !== 'resigned');
  document.getElementById('classroom-modal-title').textContent = '강의실 수정';
  document.getElementById('cr-modal-id').value = id;
  document.getElementById('cr-modal-room').value = c.room;
  document.getElementById('cr-modal-capacity').value = c.capacity;
  document.getElementById('cr-modal-type').value = c.type;
  document.getElementById('cr-modal-status').value = c.status;
  document.getElementById('cr-modal-memo').value = c.memo || '';
  _fillClassroomTeacherSelect(assignedTeacher ? assignedTeacher.nick : '');
  document.getElementById('classroom-modal').style.display = 'block';
  document.getElementById('classroom-modal-backdrop').style.display = 'block';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function closeClassroomModal() {
  document.getElementById('classroom-modal').style.display = 'none';
  document.getElementById('classroom-modal-backdrop').style.display = 'none';
}

function saveClassroom() {
  const room = document.getElementById('cr-modal-room').value.trim();
  if (!room) { showToast('강의실 호실을 입력하세요.', 'danger'); return; }
  const id = document.getElementById('cr-modal-id').value;
  const data = {
    room,
    capacity: parseInt(document.getElementById('cr-modal-capacity').value) || 0,
    type: document.getElementById('cr-modal-type').value,
    status: document.getElementById('cr-modal-status').value,
    memo: document.getElementById('cr-modal-memo').value.trim(),
  };
  const selectedTeacherNick = document.getElementById('cr-modal-teacher')?.value || '';
  // 기존 강사 room 초기화 후 새 강사에 배정
  if (id) {
    const existing = MOCK_CLASSROOMS.find(c => c.id === parseInt(id));
    if (existing) {
      const oldTeacher = MOCK_TEACHERS.find(t => t.room === existing.room);
      if (oldTeacher) oldTeacher.room = '';
    }
  }
  if (selectedTeacherNick) {
    // 이미 다른 강의실에 배정된 강사면 해제 후 재배정
    MOCK_TEACHERS.forEach(t => { if (t.nick === selectedTeacherNick) t.room = room; });
  }
  if (id) {
    const idx = MOCK_CLASSROOMS.findIndex(c => c.id === parseInt(id));
    if (idx >= 0) MOCK_CLASSROOMS[idx] = { ...MOCK_CLASSROOMS[idx], ...data };
    showToast(`✓ ${room} 강의실이 수정되었습니다.`, 'success');
  } else {
    MOCK_CLASSROOMS.push({ id: _crNextId++, ...data });
    showToast(`✓ ${room} 강의실이 추가되었습니다.`, 'success');
  }
  closeClassroomModal();
  renderClassroomManage();
}

function deleteClassroom(id) {
  const c = MOCK_CLASSROOMS.find(x => x.id === id);
  if (!c) return;
  if (!confirm(`'${c.room}' 강의실을 삭제하시겠습니까?`)) return;
  MOCK_CLASSROOMS = MOCK_CLASSROOMS.filter(x => x.id !== id);
  showToast(`${c.room} 강의실이 삭제되었습니다.`, 'success');
  renderClassroomManage();
}

function renderFileCards(s, prefix) {
  const labels = { passport:'여권 사본', ticket:'E-티켓 사본', photo:'증명사진', insurance:'여행자 보험증서' };
  const icons  = { passport:'🛂', ticket:'✈️', photo:'🖼️', insurance:'🛡️' };
  return ['passport','ticket','photo','insurance'].map(function(k) {
    var files = s.requiredFiles
      ? (Array.isArray(s.requiredFiles[k]) ? s.requiredFiles[k] : (s.requiredFiles[k] ? [s.requiredFiles[k]] : []))
      : [];
    var fileRows = files.length > 0
      ? files.map(function(f, i) {
          var name = typeof f === 'string' ? f : (f.name || '파일 ' + (i+1));
          return '<div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;margin-top:4px">'
            + '<span style="font-size:11px;color:#5E5CE6">📎</span>'
            + '<span style="font-size:11px;color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + name + '</span>'
            + '<button onclick="removeStudentFile(' + s.id + ',\'' + k + '\',' + i + ')" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:12px;padding:0;line-height:1">✕</button>'
            + '</div>';
        }).join('')
      : '<div style="font-size:11px;color:#9CA3AF;padding:6px 0">파일 없음</div>';
    var badgeClass = files.length > 0 ? 'tsa-badge-success' : 'tsa-badge-gray';
    var badgeText  = files.length > 0 ? files.length + '개 제출' : '누락';
    return '<div style="border:1px solid #E9EDF4;border-radius:10px;padding:14px;background:#F8F9FC">'
      + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'
      + '<div style="font-size:12px;font-weight:700;color:#374151">' + icons[k] + ' ' + labels[k] + '</div>'
      + '<span class="tsa-badge ' + badgeClass + '" style="font-size:10px">' + badgeText + '</span>'
      + '</div>'
      + '<div id="file-list-' + k + '-' + s.id + '">' + fileRows + '</div>'
      + '<button onclick="document.getElementById(\'' + prefix + '-file-' + k + '\').click()" style="margin-top:8px;width:100%;padding:5px;border:1.5px dashed #D1D5DB;border-radius:6px;background:#fff;font-size:11.5px;color:#6B7280;cursor:pointer">＋ 파일 추가</button>'
      + '<input id="' + prefix + '-file-' + k + '" type="file" style="display:none" multiple onchange="addStudentFiles(' + s.id + ',\'' + k + '\',this)"/>'
      + '</div>';
  }).join('');
}

function addStudentFiles(studentId, key, input) {
  const s = MOCK_STUDENTS.find(x => x.id === studentId);
  if (!s) return;
  if (!s.requiredFiles) s.requiredFiles = {};
  const existing = Array.isArray(s.requiredFiles[key]) ? s.requiredFiles[key] : (s.requiredFiles[key] ? [s.requiredFiles[key]] : []);
  const newFiles = Array.from(input.files).map(f => f.name);
  s.requiredFiles[key] = [...existing, ...newFiles];
  input.value = '';
  // 목록 갱신
  const listEl = document.getElementById(`file-list-${key}-${studentId}`);
  if (listEl) {
    const files = s.requiredFiles[key];
    listEl.innerHTML = files.map((f, i) => `
      <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;margin-top:4px">
        <span style="font-size:11px;color:#5E5CE6">📎</span>
        <span style="font-size:11px;color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f}</span>
        <button onclick="removeStudentFile(${studentId},'${key}',${i})" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:12px;padding:0;line-height:1">✕</button>
      </div>`).join('');
  }
  showToast(`✓ ${newFiles.length}개 파일이 추가됐습니다.`, 'success');
}

function removeStudentFile(studentId, key, idx) {
  const s = MOCK_STUDENTS.find(x => x.id === studentId);
  if (!s || !s.requiredFiles || !s.requiredFiles[key]) return;
  const files = Array.isArray(s.requiredFiles[key]) ? s.requiredFiles[key] : [s.requiredFiles[key]];
  files.splice(idx, 1);
  s.requiredFiles[key] = files.length > 0 ? files : null;
  const listEl = document.getElementById(`file-list-${key}-${studentId}`);
  if (listEl) {
    listEl.innerHTML = files.length > 0
      ? files.map((f, i) => `
          <div style="display:flex;align-items:center;gap:6px;padding:5px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:6px;margin-top:4px">
            <span style="font-size:11px;color:#5E5CE6">📎</span>
            <span style="font-size:11px;color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f}</span>
            <button onclick="removeStudentFile(${studentId},'${key}',${i})" style="background:none;border:none;cursor:pointer;color:#EF4444;font-size:12px;padding:0;line-height:1">✕</button>
          </div>`).join('')
      : `<div style="font-size:11px;color:#9CA3AF;padding:6px 0">파일 없음</div>`;
  }
  showToast('파일이 삭제됐습니다.', 'success');
}

// ── 수업 배정 관리 ────────────────────────────────────
// 실제 건물 기준 — M01~M63이 1:1(맨투맨) 강의실, G01~G09가 그룹 강의실.
// 그룹 강의실은 번호로 규모를 알 수 없어 type으로 나눈다 — G01~G05 소그룹(1:4), G06~G09 대그룹(1:8).
let MOCK_CLASS_ROOMS = [
  { id: 1, roomNo: 'M01', type: '1:1', capacity: 1, teacherNick: 'Sarah', status: 'active' },
  { id: 2, roomNo: 'M02', type: '1:1', capacity: 1, teacherNick: 'Mike', status: 'active' },
  { id: 3, roomNo: 'M03', type: '1:1', capacity: 1, teacherNick: 'David', status: 'active' },
  { id: 4, roomNo: 'M04', type: '1:1', capacity: 1, teacherNick: 'Karen', status: 'active' },
  { id: 5, roomNo: 'M05', type: '1:1', capacity: 1, teacherNick: 'Lisa', status: 'active' },
  { id: 6, roomNo: 'M06', type: '1:1', capacity: 1, teacherNick: 'Sophia', status: 'active' },
  { id: 7, roomNo: 'M07', type: '1:1', capacity: 1, teacherNick: 'Daniel', status: 'active' },
  { id: 8, roomNo: 'M08', type: '1:1', capacity: 1, teacherNick: 'Ella', status: 'active' },
  { id: 9, roomNo: 'M09', type: '1:1', capacity: 1, teacherNick: 'Olivia', status: 'active' },
  { id: 10, roomNo: 'M10', type: '1:1', capacity: 1, teacherNick: 'Ethan', status: 'active' },
  { id: 11, roomNo: 'M11', type: '1:1', capacity: 1, teacherNick: 'Noah', status: 'active' },
  { id: 12, roomNo: 'M12', type: '1:1', capacity: 1, teacherNick: 'Ava', status: 'active' },
  { id: 13, roomNo: 'M13', type: '1:1', capacity: 1, teacherNick: 'Liam', status: 'active' },
  { id: 14, roomNo: 'M14', type: '1:1', capacity: 1, teacherNick: 'Mia', status: 'active' },
  { id: 15, roomNo: 'M15', type: '1:1', capacity: 1, teacherNick: 'Lucas', status: 'active' },
  { id: 16, roomNo: 'M16', type: '1:1', capacity: 1, teacherNick: 'Zoe', status: 'active' },
  { id: 17, roomNo: 'M17', type: '1:1', capacity: 1, teacherNick: 'Ryan', status: 'active' },
  { id: 18, roomNo: 'M18', type: '1:1', capacity: 1, teacherNick: 'Chloe', status: 'active' },
  { id: 19, roomNo: 'M19', type: '1:1', capacity: 1, teacherNick: 'Adam', status: 'active' },
  { id: 20, roomNo: 'M20', type: '1:1', capacity: 1, teacherNick: 'Nora', status: 'active' },
  { id: 21, roomNo: 'M21', type: '1:1', capacity: 1, teacherNick: 'Owen', status: 'active' },
  { id: 22, roomNo: 'M22', type: '1:1', capacity: 1, teacherNick: 'Ivy', status: 'active' },
  { id: 23, roomNo: 'M23', type: '1:1', capacity: 1, teacherNick: 'Caleb', status: 'active' },
  { id: 24, roomNo: 'M24', type: '1:1', capacity: 1, teacherNick: 'Ruby', status: 'active' },
  { id: 25, roomNo: 'M25', type: '1:1', capacity: 1, teacherNick: 'Aiden', status: 'active' },
  { id: 26, roomNo: 'M26', type: '1:1', capacity: 1, teacherNick: 'Stella', status: 'active' },
  { id: 27, roomNo: 'M27', type: '1:1', capacity: 1, teacherNick: 'Miles', status: 'active' },
  // 아직 담당 강사가 정해지지 않은 1:1 강의실.
  { id: 28, roomNo: 'M28', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 29, roomNo: 'M29', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 30, roomNo: 'M30', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 31, roomNo: 'M31', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 32, roomNo: 'M32', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 33, roomNo: 'M33', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 34, roomNo: 'M34', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 35, roomNo: 'M35', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 36, roomNo: 'M36', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 37, roomNo: 'M37', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 38, roomNo: 'M38', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 39, roomNo: 'M39', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 40, roomNo: 'M40', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 41, roomNo: 'M41', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 42, roomNo: 'M42', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 43, roomNo: 'M43', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 44, roomNo: 'M44', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 45, roomNo: 'M45', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 46, roomNo: 'M46', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 47, roomNo: 'M47', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 48, roomNo: 'M48', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 49, roomNo: 'M49', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 50, roomNo: 'M50', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 51, roomNo: 'M51', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 52, roomNo: 'M52', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 53, roomNo: 'M53', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 54, roomNo: 'M54', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 55, roomNo: 'M55', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 56, roomNo: 'M56', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 57, roomNo: 'M57', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 58, roomNo: 'M58', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 59, roomNo: 'M59', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 60, roomNo: 'M60', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 61, roomNo: 'M61', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 62, roomNo: 'M62', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 63, roomNo: 'M63', type: '1:1', capacity: 1, teacherNick: '', status: 'active' },
  { id: 64, roomNo: 'G01', type: '1:4', capacity: 4, teacherNick: '', status: 'active' },
  { id: 65, roomNo: 'G02', type: '1:4', capacity: 4, teacherNick: '', status: 'active' },
  { id: 66, roomNo: 'G03', type: '1:4', capacity: 4, teacherNick: '', status: 'active' },
  { id: 67, roomNo: 'G04', type: '1:4', capacity: 4, teacherNick: '', status: 'active' },
  { id: 68, roomNo: 'G05', type: '1:4', capacity: 4, teacherNick: '', status: 'active' },
  { id: 69, roomNo: 'G06', type: '1:8', capacity: 8, teacherNick: '', status: 'active' },
  { id: 70, roomNo: 'G07', type: '1:8', capacity: 8, teacherNick: '', status: 'active' },
  { id: 71, roomNo: 'G08', type: '1:8', capacity: 8, teacherNick: '', status: 'active' },
  { id: 72, roomNo: 'G09', type: '1:8', capacity: 8, teacherNick: '', status: 'active' },
];
let _csRoomNextId = 73;
let _csRoomTypeFilter = '전체';

// 강사 목록과 1:1 자동 배정은 강의실 관리의 1:1 담당 강사 설정을 단일 원천으로 사용한다.
function syncTeacherRoomsFromClassroomSettings() {
  MOCK_TEACHERS.forEach(teacher => { teacher.room = ''; });
  MOCK_CLASS_ROOMS
    .filter(room => room.type === '1:1' && room.status === 'active' && room.roomNo && room.teacherNick)
    .forEach(room => {
      const teacher = MOCK_TEACHERS.find(item => item.nick === room.teacherNick && item.status !== 'resigned');
      if (teacher) teacher.room = room.roomNo;
    });
}
syncTeacherRoomsFromClassroomSettings();

function setCsRoomTypeFilter(type, btn) {
  _csRoomTypeFilter = type;
  document.querySelectorAll('[id^="cs-rtype-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCsRooms();
}

// 강의실 관리에서는 1:4·1:8 필터를 선택했을 때만 해당 유형의 주간 강의실 스케줄을 보여준다.
function renderCsGroupRoomSchedule() {
  const container = document.getElementById('cs-group-room-schedule');
  if (!container) return;
  if (!['1:4', '1:8'].includes(_csRoomTypeFilter)) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  const rooms = MOCK_CLASS_ROOMS
    .filter(room => room.type === _csRoomTypeFilter && room.status === 'active' && room.roomNo)
    .sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true, sensitivity: 'base' }));
  const periods = getPeriodList();
  const days = [...LESSON_DAYS];
  const scheduleCards = rooms.map(room => {
    const cells = periods.map(period => {
      const dayCells = days.map(day => {
        const group = MOCK_GROUP_CLASSES.find(item =>
          item.status === 'active' && item.classType === room.type && item.roomId === room.id &&
          Array.isArray(item.periods) && item.periods.includes(period.order) &&
          Array.isArray(item.dayOfWeek) && item.dayOfWeek.includes(day)
        );
        if (!group) return '<div style="min-height:58px;padding:8px;background:#F9FAFB;color:#D1D5DB;text-align:center">-</div>';
        const teacher = group.teacherId != null ? MOCK_TEACHERS.find(item => item.id === group.teacherId) : null;
        return `<button type="button" onclick="openGroupEditBrowserPopup(${group.id})" style="width:100%;min-height:58px;padding:7px 8px;border:1px solid ${room.type === '1:4' ? '#FCD34D' : '#A7F3D0'};border-radius:7px;background:${room.type === '1:4' ? '#FFFBEB' : '#ECFDF5'};color:#111827;text-align:left;cursor:pointer;white-space:normal;line-height:1.35">
          <b style="display:block;font-size:10.5px">${lessonEsc(getGroupDisplayName(group))}</b>
          <span style="display:block;margin-top:3px;font-size:9.5px;color:#6B7280">${lessonEsc(teacher?.nick || '강사 미배정')} · ${group.studentIds.length}/${getGroupCapacityFor(group)}명</span>
        </button>`;
      }).join('');
      return `<div style="display:contents"><div style="padding:8px;background:#F3F4F6;font-size:10.5px;font-weight:800;color:#374151"><span style="display:block">${period.order}교시</span><small style="font-size:8.5px;color:#9CA3AF">${period.startTime}-${period.endTime}</small></div>${dayCells}</div>`;
    }).join('');
    return `<div class="tsa-card" style="overflow:hidden;margin-bottom:14px">
      <div class="tsa-card-header" style="display:flex;align-items:center;justify-content:space-between">
        <div><b style="font-size:13px">${lessonEsc(room.roomNo)}</b><span style="margin-left:7px;padding:2px 8px;border-radius:999px;background:${room.type === '1:4' ? '#FEF3C7' : '#D1FAE5'};color:${room.type === '1:4' ? '#92400E' : '#065F46'};font-size:10px;font-weight:800">${room.type} 그룹</span></div>
        <span style="font-size:10.5px;color:#6B7280">월~금 주간 스케줄</span>
      </div>
      <div style="overflow-x:auto"><div style="display:grid;grid-template-columns:82px repeat(5,minmax(132px,1fr));gap:1px;min-width:780px;background:#E5E7EB">
        <div style="padding:9px;background:#F9FAFB;font-size:10px;font-weight:800;color:#6B7280">교시</div>${days.map(day => `<div style="padding:9px;background:#F9FAFB;text-align:center;font-size:10.5px;font-weight:800">${day}요일</div>`).join('')}
        ${cells}
      </div></div>
    </div>`;
  }).join('');

  container.style.display = 'block';
  container.innerHTML = `<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:10px"><div><h3 style="margin:0;font-size:14px">강의실 스케줄</h3><p style="margin:4px 0 0;font-size:10.5px;color:#6B7280">${_csRoomTypeFilter} 그룹 강의실의 월~금 교시별 사용 현황이야. 배정된 수업을 누르면 그룹 설정을 확인할 수 있어.</p></div></div>${scheduleCards || '<div class="tsa-card" style="padding:30px;text-align:center;color:#9CA3AF">운영 중인 해당 유형의 그룹 강의실이 없어.</div>'}`;
}

function buildCsRoomScheduleGrid(room) {
  const periods = getPeriodList();
  const days = [...LESSON_DAYS];
  const cells = periods.map(period => {
    const dayCells = days.map(day => {
      const group = MOCK_GROUP_CLASSES.find(item =>
        item.status === 'active' && item.classType === room.type && item.roomId === room.id &&
        Array.isArray(item.periods) && item.periods.includes(period.order) &&
        Array.isArray(item.dayOfWeek) && item.dayOfWeek.includes(day)
      );
      if (!group) return '<div style="min-height:58px;padding:8px;background:#F9FAFB;color:#D1D5DB;text-align:center">-</div>';
      const teacher = group.teacherId != null ? MOCK_TEACHERS.find(item => item.id === group.teacherId) : null;
      return `<button type="button" onclick="openGroupEditBrowserPopup(${group.id})" style="width:100%;min-height:58px;padding:7px 8px;border:1px solid ${room.type === '1:4' ? '#FCD34D' : '#A7F3D0'};border-radius:7px;background:${room.type === '1:4' ? '#FFFBEB' : '#ECFDF5'};color:#111827;text-align:left;cursor:pointer;white-space:normal;line-height:1.35">
        <b style="display:block;font-size:10.5px">${lessonEsc(getGroupDisplayName(group))}</b>
        <span style="display:block;margin-top:3px;font-size:9.5px;color:#6B7280">${lessonEsc(teacher?.nick || '강사 미배정')} · ${group.studentIds.length}/${getGroupCapacityFor(group)}명</span>
      </button>`;
    }).join('');
    return `<div style="display:contents"><div style="padding:8px;background:#F3F4F6;font-size:10.5px;font-weight:800;color:#374151"><span style="display:block">${period.order}교시</span><small style="font-size:8.5px;color:#9CA3AF">${period.startTime}-${period.endTime}</small></div>${dayCells}</div>`;
  }).join('');

  return `<div style="overflow-x:auto"><div style="display:grid;grid-template-columns:82px repeat(5,minmax(132px,1fr));gap:1px;min-width:780px;background:#E5E7EB">
    <div style="padding:9px;background:#F9FAFB;font-size:10px;font-weight:800;color:#6B7280">교시</div>
    ${days.map(day => `<div style="padding:9px;background:#F9FAFB;text-align:center;font-size:10.5px;font-weight:800">${day}요일</div>`).join('')}
    ${cells}
  </div></div>`;
}

function openCsRoomSchedulePopup(roomId) {
  const room = MOCK_CLASS_ROOMS.find(item => item.id === roomId && ['1:4', '1:8'].includes(item.type));
  if (!room) return;
  let modal = document.getElementById('cs-room-schedule-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'cs-room-schedule-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="tsa-modal-backdrop" onclick="closeCsRoomSchedulePopup()">
      <div class="tsa-modal" style="max-width:1100px" onclick="event.stopPropagation()">
        <div class="tsa-modal-header">
          <div>
            <h3 class="tsa-modal-title">${lessonEsc(room.roomNo)} 강의실 스케줄</h3>
            <p class="tsa-modal-subtitle">월~금 교시별 ${room.type} 그룹 수업 배정 현황입니다. 배정된 수업을 누르면 그룹 설정을 확인할 수 있습니다.</p>
          </div>
          <button class="tsa-modal-close" onclick="closeCsRoomSchedulePopup()"><i data-lucide="x"></i></button>
        </div>
        <div class="tsa-modal-body" style="max-height:72vh;overflow:auto;padding:18px">
          ${buildCsRoomScheduleGrid(room)}
        </div>
        <div class="tsa-modal-footer">
          <button class="tsa-btn tsa-btn-outline" onclick="closeCsRoomSchedulePopup()">닫기</button>
        </div>
      </div>
    </div>`;
  modal.style.display = '';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function closeCsRoomSchedulePopup() {
  const modal = document.getElementById('cs-room-schedule-modal');
  if (modal) modal.style.display = 'none';
}

// 주간 수업 세션: { id, roomId, day, periods:[], studentIds:[], course, level, weekOf }
let MOCK_CLASS_SESSIONS = [
  { id: 1, roomId: 1, day: '월', periods: [1, 3], studentIds: [1], course: 'IELTS Intensive', level: 'Band 5.5', weekOf: '2026-06-22' },
  { id: 2, roomId: 1, day: '월', periods: [5], studentIds: [5], course: 'IELTS Intensive', level: 'Band 5.5', weekOf: '2026-06-22' },
  { id: 3, roomId: 1, day: '화', periods: [1, 3], studentIds: [1], course: 'IELTS Intensive', level: 'Band 5.5', weekOf: '2026-06-22' },
  { id: 4, roomId: 1, day: '수', periods: [5], studentIds: [5], course: 'IELTS Intensive', level: 'Band 5.5', weekOf: '2026-06-22' },
  
  { id: 5, roomId: 2, day: '월', periods: [3, 4], studentIds: [4], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 6, roomId: 2, day: '화', periods: [3], studentIds: [4], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 7, roomId: 2, day: '수', periods: [3, 4], studentIds: [2], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 8, roomId: 3, day: '월', periods: [1, 2], studentIds: [6], course: 'Special English(TOEIC, Business)', level: 'Advanced', weekOf: '2026-06-22' },
  { id: 9, roomId: 3, day: '수', periods: [1], studentIds: [6], course: 'Special English(TOEIC, Business)', level: 'Advanced', weekOf: '2026-06-22' },
  { id: 10, roomId: 3, day: '금', periods: [3], studentIds: [4], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 11, roomId: 64, day: '월', periods: [5, 6], studentIds: [1, 2, 4], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 12, roomId: 64, day: '수', periods: [5, 6], studentIds: [1, 2, 4], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 13, roomId: 69, day: '월', periods: [2], studentIds: [14, 15, 16], course: 'Junior ESL', level: 'Beginner', weekOf: '2026-06-22' },
  { id: 14, roomId: 69, day: '화', periods: [2], studentIds: [14, 15, 16], course: 'Junior ESL', level: 'Beginner', weekOf: '2026-06-22' },
  { id: 15, roomId: 69, day: '수', periods: [2], studentIds: [14, 15, 16], course: 'Junior ESL', level: 'Beginner', weekOf: '2026-06-22' },
  
  { id: 16, roomId: 4, day: '월', periods: [3, 4], studentIds: [12], course: '가디언 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 17, roomId: 4, day: '목', periods: [3, 4], studentIds: [12], course: '가디언 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 18, roomId: 65, day: '화', periods: [4, 5], studentIds: [5, 10], course: 'IELTS Intensive', level: 'Band 6.5', weekOf: '2026-06-22' },
  { id: 19, roomId: 65, day: '목', periods: [4, 5], studentIds: [5, 10], course: 'IELTS Intensive', level: 'Band 6.5', weekOf: '2026-06-22' },
  
  { id: 20, roomId: 5, day: '월', periods: [2, 3], studentIds: [13], course: 'IELTS Intensive', level: 'Band 5.0', weekOf: '2026-06-22' },
  { id: 21, roomId: 5, day: '수', periods: [2, 3], studentIds: [13], course: 'IELTS Intensive', level: 'Band 5.0', weekOf: '2026-06-22' },
];
let _csSessionNextId = 22;
let _csCurrentWeek = '2026-06-22';
let _csCurrentDay  = '월';
let _csAssignTarget = null; // { roomId }
let _csViewMode = 'room';
let _csFilterSelect = 'all';
let _csFilterSearch = '';

function bellTimeToMinutes(timeStr) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeStr || '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

function bellMinutesToTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function buildBellSchedule(settings) {
  const config = settings || APP.bellSystem || {};
  const duration = Number(config.duration) || 50;
  const breakDuration = Number(config.break) || 10;
  const total = Math.min(15, Math.max(1, Number(config.total) || 12));
  let current = bellTimeToMinutes(config.start || '08:00');
  if (current == null) current = 8 * 60;
  const lunchStart = bellTimeToMinutes(config.lunchStart || '12:05');
  const lunchDuration = Math.max(0, Number(config.lunchDuration) || 60);
  const lunchEnd = lunchStart == null ? null : lunchStart + lunchDuration;
  let lunchInserted = lunchStart == null || lunchDuration === 0;
  const rows = [];

  for (let period = 1; period <= total; period++) {
    const proposedEnd = current + duration;
    if (!lunchInserted && (current >= lunchStart || proposedEnd > lunchStart)) {
      rows.push({ p: 'lunch', start: bellMinutesToTime(lunchStart), end: bellMinutesToTime(lunchEnd) });
      current = Math.max(current, lunchEnd);
      lunchInserted = true;
    }
    const end = current + duration;
    rows.push({ p: period, start: bellMinutesToTime(current), end: bellMinutesToTime(end) });
    current = end + breakDuration;
  }
  return rows;
}

function getBellPeriodMap() {
  return Object.fromEntries(buildBellSchedule(APP.bellSystem).filter(row => row.p !== 'lunch').map(row => [row.p, row.start]));
}

let CS_PERIODS = getBellPeriodMap();

function syncCsPeriodsFromBellSystem() {
  CS_PERIODS = getBellPeriodMap();
}
const CS_TYPE_COLOR = { '1:1':'#EEF2FF|#3730A3', '1:4':'#FEF3C7|#92400E', '1:8':'#D1FAE5|#065F46' };

/* =============================================
   수업 편성(Scheduling) — 그룹 수업 관리 (PRD 06)
   그룹(GroupClass)은 과목+레벨군+형태로 정의하고 학생을 매칭한다.
   과정은 해당 학생이 과목을 수강할 수 있는지 확인하는 자격 정보로만 사용한다.
   시간·강사·강의실은 이후 '주간 수업 편성' 탭에서 별도로 배정한다.
   ============================================= */
// 2026-07-31: 각 그룹의 course/subjectId/classType이 그 과정의 시간표 템플릿(교육 과정 및 과목 레벨 설정)에
// 실제로 존재하는 조합인지 재검증해 맞춰놓음(예: IELTS Intensive·가디언 코스는 커리큘럼상 그룹 수업이 전혀 없어 다른 과정으로 재배정,
// 문법/토론은 애초에 반대 수업 유형으로 잘못 들어가 있어 바로잡음). 요일·교시·담당강사·강의실도 신규 그룹 생성 화면과
// 동일한 필수 항목이라 비어 있던 값을 실제 강사·강의실 후보와 충돌 없이 채워넣음. 교시는 과정 템플릿 기준 1시간짜리라
// 그룹당 실제 교시도 1개만 갖는다(요일마다 같은 1교시에 반복해서 만남).
let MOCK_GROUP_CLASSES = [
  { id: 1, name: '일상회화 G4', course: 'Regular', subjectId: 'SUB_08', levelGroup: 4, levelGroups: [4], classType: '1:4',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [5], teacherId: 3, roomId: 64,
    studentIds: [], manualLockIds: [], progressRate: 68, status: 'active', createdAt: '2026-06-01' },
  { id: 2, name: '리딩 G3', course: 'Regular', subjectId: 'SUB_03', levelGroup: 3, levelGroups: [3], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [7], teacherId: 9, roomId: 69,
    studentIds: [], manualLockIds: [], progressRate: 72, status: 'active', createdAt: '2026-06-01' },
  { id: 5, name: '일반 문법 G3', course: 'Regular', subjectId: 'SUB_02', levelGroup: 3, levelGroups: [3], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [8], teacherId: 8, roomId: 69,
    studentIds: [], manualLockIds: [], progressRate: 64, status: 'active', createdAt: '2026-06-02' },
  { id: 9, name: '주니어 리딩 G1', course: 'Junior ESL', subjectId: 'SUB_03', levelGroup: 1, levelGroups: [1], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [7], teacherId: 5, roomId: 70,
    studentIds: [], manualLockIds: [], progressRate: 55, status: 'active', createdAt: '2026-06-02' },
  { id: 10, name: '일상회화 G3', course: 'Regular', subjectId: 'SUB_08', levelGroup: 3, levelGroups: [3], classType: '1:4',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [5], teacherId: 9, roomId: 66,
    studentIds: [], manualLockIds: [], progressRate: 70, status: 'active', createdAt: '2026-06-02' },
  { id: 11, name: '리딩 G4', course: 'Regular', subjectId: 'SUB_03', levelGroup: 4, levelGroups: [4], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [7], teacherId: 1, roomId: 71,
    studentIds: [], manualLockIds: [], progressRate: 76, status: 'active', createdAt: '2026-06-02' },
  { id: 12, name: '비즈니스 토론 G5', course: 'Special English(TOEIC, Business)', subjectId: 'SUB_10', levelGroup: 5, levelGroups: [5], classType: '1:4',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [6], teacherId: 2, roomId: 65,
    studentIds: [], manualLockIds: [], progressRate: 48, status: 'active', createdAt: '2026-06-02' },
  // 같은 레벨·과목에 운영 그룹이 2개인 예시: 리딩 G3의 두 번째 운영 그룹.
  { id: 13, name: '리딩 G3-B', course: 'Regular', subjectId: 'SUB_03', levelGroup: 3, levelGroups: [3], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [6], teacherId: 5, roomId: 70,
    studentIds: [], manualLockIds: [], progressRate: 61, status: 'active', createdAt: '2026-06-03' },
  // Low-Inter와 Intermediate가 정원 하나를 함께 사용하는 통합 레벨 그룹 예시.
  { id: 14, name: '일상회화 통합 G2-3', course: 'Regular', subjectId: 'SUB_08', levelGroup: 2, levelGroups: [2, 3], classType: '1:4',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [4], teacherId: 3, roomId: 67,
    studentIds: [], manualLockIds: [], progressRate: 66, status: 'active', createdAt: '2026-06-03' },
];
let _csGroupNextId = 15;
let _csSelectedGroupId = null;

function getGroupClassTypeByCode(classType) {
  return MOCK_MASTER_CLASS_TYPES.find(t => t.code === classType);
}

// 초과 허용 상한(하드캡). 이 인원을 넘는 배정은 불가.
function getGroupClassCapacity(classType) {
  const ct = getGroupClassTypeByCode(classType);
  return ct ? ct.maxStudents : (classType === '1:8' ? 8 : 4);
}

// 기준 정원(1:4→4명). 기준 초과~상한 이내 배정은 경고와 함께 허용된다.
function getGroupBaseCapacity(classType) {
  const parsed = Number(String(classType || '').split(':')[1]);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return getGroupClassCapacity(classType);
}

// 반마다 정원을 따로 정할 수 있다 — 「1:4 반에 5명」 같은 예외를 반에 기록해 두기 위한 값이다.
// 안 정해두면 예전처럼 수업 형태에서 계산한 값을 쓴다.
function getGroupCapacityFor(group) {
  const override = Number(group?.capacity);
  if (Number.isFinite(override) && override > 0) return override;
  return getGroupClassCapacity(group?.classType);
}

function getGroupBaseCapacityFor(group) {
  const override = Number(group?.capacity);
  if (Number.isFinite(override) && override > 0) return override;
  return getGroupBaseCapacity(group?.classType);
}

// 커리큘럼(과목+교시 묶음)의 동일성 비교 키. 순서와 무관하게 같은 구성이면 같은 키가 된다.
function getCurriculumKey(refs) {
  return [...(refs || [])]
    .map(ref => `${ref.id}:${ref.hours || 1}`)
    .sort()
    .join('|');
}

function getGroupCurriculumKey(group) {
  return getCurriculumKey(getGroupCurriculumRefs(group));
}

// 그룹의 현재 배정 인원 기준 실제 비율 표시 (예: 기준 4명 그룹에 5명이면 "1:5")
function getGroupLiveRatioLabel(group) {
  const count = (group.studentIds || []).length;
  const base = getGroupBaseCapacityFor(group);
  return `1:${Math.max(count, base)}`;
}

function getGroupNationalityCap(classType) {
  // PRD 11번 문서 제안값(1:4→2명, 1:8→3명)에 맞춘 비율 공식 — 운영 확정 전 제안값
  const cap = getGroupClassCapacity(classType);
  return Math.max(2, Math.round(cap * 0.4));
}

// 그룹에 수동으로 지정된 동일 국적 최대 인원이 있으면 그 값을, 없으면 제안 공식값을 사용한다.
function getEffectiveNationalityCap(group) {
  if (group && group.nationalityCap != null && !Number.isNaN(group.nationalityCap)) return group.nationalityCap;
  return getGroupNationalityCap(group ? group.classType : null);
}

// 그룹 생성/수정 시 선택한 요일·교시에 실제로 가능한 담당 강사 후보. 다른 운영 그룹과 요일·교시가 겹치면 제외한다.
function getGroupTeacherCandidates(classType, days, periods, excludeGroupId) {
  if (!classType || !Array.isArray(days) || !days.length || !Array.isArray(periods) || !periods.length) return [];
  return MOCK_TEACHERS.filter(teacher => {
    if (teacher.status === 'resigned') return false;
    if (!(teacher.classTypes || []).includes(classType)) return false;
    const availableAllSlots = days.every(day => periods.every(period => lessonTeacherAvailableAt(teacher, day, period)));
    if (!availableAllSlots) return false;
    return !MOCK_GROUP_CLASSES.some(g =>
      g.id !== excludeGroupId && g.status === 'active' && g.teacherId === teacher.id &&
      Array.isArray(g.dayOfWeek) && Array.isArray(g.periods) &&
      g.dayOfWeek.some(d => days.includes(d)) && g.periods.some(p => periods.includes(p))
    );
  });
}

// 그룹 생성/수정 시 선택한 요일·교시·유형·정원에 맞는 강의실 후보.
// 다른 운영 그룹뿐 아니라 강의실 배정의 주간 세션(1:1 수업)이 쓰고 있는 방도 제외한다 —
// 그룹은 주 5회라 요일 하루만 겹쳐도 그 방을 쓸 수 없다.
function getGroupRoomCandidates(classType, days, periods, capacityNeeded, excludeGroupId) {
  if (!classType || !Array.isArray(days) || !days.length || !Array.isArray(periods) || !periods.length) return [];
  const allowedTypes = classType === '1:8' ? ['1:8'] : classType === '1:4' ? ['1:4', '1:8'] : ['1:1', '1:4', '1:8'];
  return MOCK_CLASS_ROOMS.filter(room => {
    if (room.status !== 'active' || !allowedTypes.includes(room.type)) return false;
    if (room.capacity < (capacityNeeded || 1)) return false;
    const usedByGroup = MOCK_GROUP_CLASSES.some(g =>
      g.id !== excludeGroupId && g.status === 'active' && g.roomId === room.id &&
      Array.isArray(g.dayOfWeek) && Array.isArray(g.periods) &&
      g.dayOfWeek.some(d => days.includes(d)) && g.periods.some(p => periods.includes(p))
    );
    if (usedByGroup) return false;
    const usedBySession = MOCK_CLASS_SESSIONS.some(session =>
      session.roomId === room.id && days.includes(session.day) &&
      Array.isArray(session.periods) && session.periods.map(Number).some(period => periods.map(Number).includes(period))
    );
    return !usedBySession;
  }).sort((a, b) => (a.type === classType ? 0 : 1) - (b.type === classType ? 0 : 1) || a.capacity - b.capacity);
}

const LESSON_DAYS = ['월', '화', '수', '목', '금'];

function lessonTeacherAvailableAt(teacher, day, period) {
  if (!teacher?.availability) return true;
  const dailyAvailability = Array.isArray(teacher.availability)
    ? teacher.availability
    : teacher.availability[day];
  return Array.isArray(dailyAvailability) && dailyAvailability[period - 1] !== false;
}

// 강사 가용성은 원래 3단계다 — 'open'(가용) / 'gray'(화상수업) / 'black'(블랙타임).
// 그런데 저장할 때 `availability[d][p-1] = state !== 'black'` 로 참/거짓으로 눌러 담겨서
// 배정 쪽에는 3단계가 닿지 않았다. 여기서 원본 상태를 그대로 읽는다.
function lessonTeacherAvailState(teacher, day, period) {
  if (typeof getAvailState === 'function') return getAvailState(teacher, day, period);
  return lessonTeacherAvailableAt(teacher, day, period) ? 'open' : 'black';
}

// 그룹 수업은 월~금 같은 교시로 도니 5일을 다 봐야 한다 — 하루라도 막히면 그 요일 수업이 빈다.
// 한 요일이라도 블랙타임이면 블랙타임으로 본다(더 강한 사유가 이긴다).
function getTeacherWeeklyAvailState(teacher, period) {
  const states = LESSON_DAYS.map(day => lessonTeacherAvailState(teacher, day, period));
  if (states.every(state => state === 'open')) return 'open';
  return states.some(state => state === 'black') ? 'black' : 'gray';
}

const TEACHER_AVAIL_LABEL = { black: '블랙타임', gray: '화상수업' };

function lessonEsc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// v3.0은 주 5회(월~금) 고정 빈도만 지원한다(PRD §3.2 비목표). 배정된 요일 배열을 표시용으로 축약한다.
function lessonFormatDays(days) {
  const list = Array.isArray(days) ? days : days ? [days] : [];
  if (!list.length) return '-';
  return LESSON_DAYS.every(day => list.includes(day)) ? '월~금' : list.join(',');
}

// ── 학생 수업 배정 (PRD v3.0 §8~9, §12) ──────────────────────
// 과정의 교시 템플릿을 학생별로 순서대로 복제해, 각 항목이 그룹/1:1로 실제 배정됐는지 매번 파생 계산한다(별도 저장 없음).
function getStudentLessonRequirements(student) {
  if (!student) return [];
  const course = MOCK_COURSES.find(c => c.name === student.course);
  if (!course || typeof getCourseTimetableTemplate !== 'function') return [];
  const template = getCourseTimetableTemplate(course);
  // 같은 과목이 주 2회 이상(hours>=2)이면 템플릿에 같은 subjectId가 여러 번 나온다.
  // 배정은 templateSequence(교시)로 매칭하는 게 원칙이고, templateSequence가 없는 옛 데이터만
  // 과목별 등장 순서대로 하나씩 꺼내 쓴다. 교시가 지정된 배정까지 과목으로 넘겨받으면
  // 예를 들어 1교시를 해제했을 때 2교시 배정이 1교시 자리에 잘못 나타난다.
  const legacyBySubject = {};
  (student.oneToOneSchedule || []).forEach(o => {
    if (o.templateSequence == null) (legacyBySubject[o.subjectId] = legacyBySubject[o.subjectId] || []).push(o);
  });
  return template.map((item, index) => {
    const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === item.subjectId);
    const subjectName = subject?.name || item.subjectId || '과목 미선택';
    if (item.classType === '1:1') {
      const legacyPool = legacyBySubject[item.subjectId];
      const schedule = (student.oneToOneSchedule || []).find(entry => Number(entry.templateSequence) === index + 1)
        || (legacyPool && legacyPool.length ? legacyPool.shift() : undefined);
      return {
        sequence: index + 1, classType: '1:1', subjectId: item.subjectId, subjectName,
        status: schedule ? 'ASSIGNED' : 'UNASSIGNED',
        teacherId: schedule?.teacherId ?? null, dayOfWeek: schedule?.dayOfWeek ?? null, period: schedule?.period ?? null
      };
    }
    // 그룹은 특정 교시에 열려야만 배정된 걸로 치지 않는다 — 과목·유형만 맞으면 실제로 몇 교시에
    // 열려 있는지와 무관하게 그 그룹에 들어간 것으로 인정한다(회의 결정: 교시 고정 매칭 폐지).
    const group = MOCK_GROUP_CLASSES.find(g =>
      g.status === 'active' && g.classType === item.classType &&
      getGroupSubjectId(g) === item.subjectId &&
      g.studentIds.includes(student.id)
    );
    return {
      sequence: index + 1, classType: item.classType, subjectId: item.subjectId, subjectName,
      status: group ? 'ASSIGNED' : 'UNASSIGNED', groupId: group ? group.id : null
    };
  });
}

function getStudentAssignmentSummary(student) {
  const requirements = getStudentLessonRequirements(student);
  return {
    total: requirements.length,
    assigned: requirements.filter(r => r.status === 'ASSIGNED').length,
    unassigned: requirements.filter(r => r.status !== 'ASSIGNED')
  };
}

// 학생이 이미 확정한 다른 수업들(1:1 + 다른 그룹)이 차지하고 있는 교시 집합.
// 교시 고정 매칭을 없앤 뒤로는 이 검사가 "같은 시간에 두 수업이 겹치지 않는다"를 보장하는 유일한 장치다.
function getStudentBusyPeriods(student, excludeGroupId) {
  const periods = new Set();
  (student.oneToOneSchedule || []).forEach(o => { if (o.period != null) periods.add(Number(o.period)); });
  MOCK_GROUP_CLASSES.forEach(g => {
    if (g.id === excludeGroupId) return;
    if (g.status === 'active' && Array.isArray(g.periods) && g.studentIds.includes(student.id)) {
      g.periods.forEach(p => periods.add(Number(p)));
    }
  });
  return periods;
}

function getCandidateGroupsForStudentRequirement(student, requirement) {
  const level = getLevelGroupForStudent(student);
  const busyPeriods = getStudentBusyPeriods(student);
  return MOCK_GROUP_CLASSES.filter(g =>
    g.status === 'active' && g.classType === requirement.classType &&
    getGroupSubjectId(g) === requirement.subjectId &&
    level != null && getGroupLevelSet(g).includes(level) &&
    g.studentIds.length < getGroupCapacityFor(g) &&
    !g.studentIds.includes(student.id) &&
    Array.isArray(g.periods) && !g.periods.some(p => busyPeriods.has(Number(p)))
  );
}

function planStudentOneToOneSchedule(student, teacher, requirements) {
  const oneToOneReqs = (requirements || getStudentLessonRequirements(student)).filter(r => r.classType === '1:1');
  if (!teacher || teacher.status === 'resigned' || !(teacher.classTypes || []).includes('1:1')) {
    return { ok: false, message: '1:1 수업이 가능한 재직 강사가 아니야.' };
  }
  if (!teacher.room) {
    return { ok: false, message: '담당 1:1 강의실이 없어.' };
  }
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  const planned = [];
  for (const requirement of oneToOneReqs) {
    const period = Number(requirement.sequence);
    if (!Number.isFinite(period) || period < 1 || period > totalPeriods) {
      return { ok: false, message: `${requirement.subjectName}의 템플릿 교시가 유효하지 않아.` };
    }
    if (!LESSON_DAYS.every(day => lessonTeacherAvailableAt(teacher, day, period))) {
      return { ok: false, message: `${period}교시 ${requirement.subjectName} 수업에 강사가 매일 근무하지 않아.` };
    }
    const teacherBusyOneToOne = MOCK_STUDENTS.some(s =>
      s.id !== student.id && (s.oneToOneSchedule || []).some(o => o.teacherId === teacher.id && o.period === period)
    );
    const teacherBusyGroup = MOCK_GROUP_CLASSES.some(g =>
      g.status === 'active' && g.teacherId === teacher.id &&
      Array.isArray(g.dayOfWeek) && g.dayOfWeek.length &&
      Array.isArray(g.periods) && g.periods.includes(period)
    );
    const studentBusyGroup = MOCK_GROUP_CLASSES.some(g =>
      g.status === 'active' && g.studentIds.includes(student.id) &&
      Array.isArray(g.dayOfWeek) && g.dayOfWeek.length &&
      Array.isArray(g.periods) && g.periods.includes(period)
    );
    if (teacherBusyOneToOne || teacherBusyGroup || studentBusyGroup || planned.some(o => o.period === period)) {
      return { ok: false, message: `${period}교시 ${requirement.subjectName} 템플릿 시간에 충돌이 있어.` };
    }
    planned.push({
      subjectId: requirement.subjectId,
      templateSequence: requirement.sequence,
      teacherId: teacher.id,
      dayOfWeek: [...LESSON_DAYS],
      period
    });
  }
  return { ok: true, schedule: planned };
}

function renderCsStudentAssignmentList() {
  renderStudentAssignmentTable('cs-student-assign-body', 'oneToOne');
  renderStudentAssignmentTable('gm-student-assign-body', 'group');
  if (typeof renderStudentClassAssignList === 'function') renderStudentClassAssignList();
}

// 과정·교시 템플릿 목록(renderCourseList)과 같은 2톤 캡슐 배지. compact 태그들이 이 모양을 공유해.
// period가 null/undefined면 실제 시간이 아직 정해지지 않았다는 뜻이므로 "N교시" 배지를 생략한다
// (그룹은 배정 전까지도, 배정 후에도 학생마다 고정된 순서 교시가 아니라 실제로 열린 그룹의 교시를 따른다).
function buildCompactPeriodPill(period, classType, subjectName, extra, assigned) {
  const color = assigned ? { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' } : { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
  const periodBadge = period != null && period !== ''
    ? `<strong style="align-self:stretch;display:inline-flex;align-items:center;padding:4px 6px;background:${color.bg};color:${color.color};font-size:9.5px">${period}교시</strong>`
    : '';
  return `
    <span style="display:inline-flex;align-items:center;overflow:hidden;border:1px solid ${color.border};background:#fff;border-radius:7px;white-space:nowrap;margin:1px">
      ${periodBadge}
      <span style="padding:4px 6px;font-size:9.5px;color:${assigned ? '#374151' : '#9CA3AF'}">
        <strong style="color:${color.color}">${lessonEsc(classType)}</strong>
        · ${lessonEsc(subjectName)}${extra ? ` ${lessonEsc(extra)}` : ''}${assigned ? '' : ' 미배정'}
      </span>
    </span>
  `;
}

// 전체 과정 중 교시 수가 가장 많은 과정 기준으로 그리드 폭을 잡아. 나중에 더 긴 과정이 추가돼도 자동으로 늘어나.
function getMaxCoursePeriodCount() {
  return MOCK_COURSES.reduce((max, c) => Math.max(max, getCourseTimetableTemplate(c).length), 0) || 8;
}

const LESSON_TYPE_GRID_COLORS = {
  '1:1': { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
  '1:4': { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  '1:8': { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
};

// "수업 리스트" 헤더. 예전엔 1교시·2교시... 숫자를 그리드로 채웠지만, 그룹 칸은 더 이상
// 특정 교시를 가리키지 않으므로(교시 고정 매칭 폐지) 숫자 라벨을 없애고 고정 텍스트만 둔다.
// 실제 교시는 각 칩 안에 텍스트로 표시된다.
function renderScaLessonsHeader() {
  const th = document.getElementById('sca-lessons-header');
  if (!th) return;
  th.textContent = '수업 리스트';
}

// 학생별 수업 배정 리스트 전용: 1:1과 그룹 모두 같은 폭의 고정 칸 그리드에 그려서 두 행의 리듬을 맞춘다.
// - 1:1(packed=false): 칸 위치 = 실제(예정) 교시. sequence가 곧 배정될 교시라 위치가 의미 있다.
// 1:1·그룹 모두 이제 "N번째 요구사항 = N교시"가 아니므로(교시 고정 매칭 폐지), 칸 위치는 항상
// 배열 순서일 뿐이고 실제 교시는 배정된 뒤에만 칩 안 텍스트로 보여준다. 두 번째 인자(packed)는
// 예전 호환용으로 남겨뒀지만 이제 무시한다 — 1:1·그룹이 같은 규칙을 쓰도록 통일했다.
function buildLessonRequirementPeriodGrid(student, requirements) {
  const maxPeriods = getMaxCoursePeriodCount();
  const ordered = requirements.slice().sort((a, b) => a.sequence - b.sequence);
  const gridColumns = `repeat(${maxPeriods},minmax(36px,1fr))`;
  const cells = [];
  for (let i = 1; i <= maxPeriods; i++) {
    const req = ordered[i - 1];
    if (!req) {
      cells.push('<div style="min-height:32px"></div>');
      continue;
    }
    const assigned = req.status === 'ASSIGNED';
    const color = LESSON_TYPE_GRID_COLORS[req.classType] || { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
    let teacherLabel = '';
    let periodLabel = '';
    if (req.classType === '1:1') {
      if (assigned) {
        const teacher = req.teacherId != null ? MOCK_TEACHERS.find(t => t.id === req.teacherId) : null;
        teacherLabel = teacher ? (teacher.nick || teacher.name) : '';
        periodLabel = req.period != null ? `${req.period}교시` : '';
      }
    } else if (assigned) {
      const group = req.groupId != null ? MOCK_GROUP_CLASSES.find(g => g.id === req.groupId) : null;
      const groupTeacher = group && group.teacherId != null ? MOCK_TEACHERS.find(t => t.id === group.teacherId) : null;
      teacherLabel = groupTeacher ? (groupTeacher.nick || groupTeacher.name) : '';
      periodLabel = group && Array.isArray(group.periods) && group.periods.length ? `${group.periods.join(',')}교시` : '';
    }
    const metaLine = [periodLabel, teacherLabel].filter(Boolean).join(' · ');
    const title = `${req.classType} · ${req.subjectName}${metaLine ? ' · ' + metaLine : ''}${assigned ? '' : ' · 미배정'}`;
    cells.push(`
      <div title="${lessonEsc(title)}" style="min-height:32px;display:flex;flex-direction:column;justify-content:center;gap:1px;text-align:center;border-radius:6px;padding:3px 2px;border:1px solid ${assigned ? color.border : '#E5E7EB'};background:${assigned ? color.bg : '#fff'}">
        <span style="font-size:8.5px;font-weight:700;color:${assigned ? color.color : '#D1D5DB'}">${lessonEsc(req.classType)}</span>
        <span style="font-size:9px;color:${assigned ? '#374151' : '#9CA3AF'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lessonEsc(req.subjectName)}${assigned ? '' : ' (미배정)'}</span>
        ${metaLine ? `<span style="font-size:8.5px;font-weight:700;color:${assigned ? color.color : '#9CA3AF'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${lessonEsc(metaLine)}</span>` : ''}
      </div>
    `);
  }
  return `<div style="display:grid;grid-template-columns:${gridColumns};gap:3px;min-width:${maxPeriods * 40}px">${cells.join('')}</div>`;
}

// compact=true면 그룹 교시도 레벨·그룹 규모 없이 1:1과 같은 한 줄짜리 배지로 보여줘.
function buildLessonRequirementTags(student, requirements, compact) {
  const oneLine = 'font-size:9.5px;margin:1px;white-space:nowrap';
  return requirements.slice().sort((a, b) => a.sequence - b.sequence).map(req => {
    if (req.status === 'ASSIGNED') {
      let detail = '';
      if (req.classType === '1:1') {
        const teacher = req.teacherId != null ? MOCK_TEACHERS.find(t => t.id === req.teacherId) : null;
        if (compact) {
          // 교시를 앞에 붙이고 요일(월~금 고정)은 생략해서 미배정 배지와 같은 한 줄 길이로 맞춰.
          const teacherLabel = teacher ? `(${lessonEsc(teacher.nick || teacher.name)})` : '';
          return buildCompactPeriodPill(req.period || req.sequence, req.classType, req.subjectName, teacherLabel, true);
        }
        detail = teacher ? `${lessonEsc(teacher.nick || teacher.name)} · ${lessonEsc(lessonFormatDays(req.dayOfWeek))} ${req.period || ''}교시` : '';
      } else if (compact) {
        // 그룹에 강사까지 배정됐으면 1:1과 같은 형식으로 강사명을 붙여줘.
        const group = req.groupId != null ? MOCK_GROUP_CLASSES.find(g => g.id === req.groupId) : null;
        const groupTeacher = group && group.teacherId != null ? MOCK_TEACHERS.find(t => t.id === group.teacherId) : null;
        const teacherLabel = groupTeacher ? `(${lessonEsc(groupTeacher.nick || groupTeacher.name)})` : '';
        const groupPeriodLabel = group && Array.isArray(group.periods) && group.periods.length ? group.periods.join(',') : null;
        return buildCompactPeriodPill(groupPeriodLabel, req.classType, req.subjectName, teacherLabel, true);
      } else {
        const group = req.groupId != null ? MOCK_GROUP_CLASSES.find(g => g.id === req.groupId) : null;
        const levelLabel = group ? getGroupLevelSet(group).map(getLevelGroupName).join(', ') : student.level;
        return `<span class="tsa-badge tsa-badge-success" style="display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;font-size:9.5px;line-height:1.35;margin:2px;padding:5px 8px"><span>${lessonEsc(req.classType)} · ${lessonEsc(req.subjectName)}</span><span style="font-weight:700">${lessonEsc(levelLabel)} · ${lessonEsc(getGroupSizeShortLabel(req.classType))}</span></span>`;
      }
      return `<span class="tsa-badge tsa-badge-success" style="${oneLine}">${lessonEsc(req.classType)}·${lessonEsc(req.subjectName)}${detail ? ` (${detail})` : ''}</span>`;
    }
    if (req.classType !== '1:1' && !compact) {
      return `<span class="tsa-badge tsa-badge-gray" style="display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;font-size:9.5px;line-height:1.35;margin:2px;padding:5px 8px"><span>${lessonEsc(req.classType)} · ${lessonEsc(req.subjectName)}</span><span style="font-weight:700">${lessonEsc(student.level)} · ${lessonEsc(getGroupSizeShortLabel(req.classType))} · 미배정</span></span>`;
    }
    if (compact) return buildCompactPeriodPill(req.classType === '1:1' ? req.sequence : null, req.classType, req.subjectName, '', false);
    return `<span class="tsa-badge tsa-badge-gray" style="${oneLine}">${req.sequence}교시 · ${lessonEsc(req.classType)}·${lessonEsc(req.subjectName)} 미배정</span>`;
  }).join('') || '<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px">배정 대상 없음</span>';
}

const LESSON_ASSIGNMENT_BUTTON_LABELS = { '1:1': '1:1 수업 배정', '1:4': '소그룹 수업 배정', '1:8': '중그룹 수업 배정' };

function buildLessonAssignmentButtons(student, requirements, allowedTypes) {
  return allowedTypes.map(classType => {
    const typeReqs = requirements.filter(req => req.classType === classType);
    const isRequired = typeReqs.length > 0;
    const canAssign = typeReqs.some(req => req.status !== 'ASSIGNED');
    const canEdit = isRequired && !canAssign;
    const buttonColor = classType === '1:1' ? '#5E5CE6' : classType === '1:4' ? '#2563EB' : '#0F766E';
    const style = canAssign
      ? `background:${buttonColor};color:#fff;border-color:${buttonColor}`
      : canEdit
        ? `background:#fff;color:${buttonColor};border:1px solid ${buttonColor}`
        : 'background:#F3F4F6;color:#9CA3AF;border-color:#E5E7EB;cursor:default';
    const label = canEdit ? LESSON_ASSIGNMENT_BUTTON_LABELS[classType].replace('수업 배정', '배정 수정') : LESSON_ASSIGNMENT_BUTTON_LABELS[classType];
    const interactive = canAssign || canEdit;
    return `<button class="tsa-btn tsa-btn-xs" style="${style};min-width:82px;height:25px;padding:3px 7px;font-size:9.5px;line-height:1;white-space:nowrap" ${interactive ? `onclick="openStudentLessonAssignment(${student.id},null,'${classType}')"` : 'disabled'}>${label}</button>`;
  }).join('');
}

function getLessonAssignableStudentsSorted() {
  return MOCK_STUDENTS.filter(s => ['current', 'waiting', 'extended'].includes(s.status))
    .sort((a, b) => {
      const startDateDiff = String(b.startDate || '').localeCompare(String(a.startDate || ''));
      if (startDateDiff !== 0) return startDateDiff;
      return Number(b.id || 0) - Number(a.id || 0);
    });
}

function renderStudentAssignmentTable(bodyId, mode) {
  const body = document.getElementById(bodyId);
  if (!body) return;
  const allowedTypes = mode === 'oneToOne' ? ['1:1'] : ['1:4', '1:8'];
  const rows = getLessonAssignableStudentsSorted().map(student => {
    const requirements = getStudentLessonRequirements(student).filter(req => allowedTypes.includes(req.classType));
    return {
      student,
      requirements,
      summary: {
        total: requirements.length,
        assigned: requirements.filter(req => req.status === 'ASSIGNED').length
      }
    };
  }).filter(row => row.summary.total > 0);
  body.innerHTML = rows.map(({ student, requirements, summary }, idx) => {
    const period = [student.startDate, student.departureDate].filter(Boolean).join(' ~ ') || '-';
    const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
    const tags = buildLessonRequirementTags(student, requirements);
    const assignmentButtons = buildLessonAssignmentButtons(student, requirements, allowedTypes);
    return `<tr>
      <td style="text-align:center;color:#9CA3AF;font-size:11px">${rows.length - idx}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="openStudentDetail(${student.id})" title="학생 상세 보기">
          <img class="tsa-avatar" src="${avatarSrc}" style="width:30px;height:30px;object-fit:cover;border-radius:50%;border:1px solid #E5E7EB;flex-shrink:0" alt="${lessonEsc(student.nick || student.name || '')}"/>
          <div>
            <b>${lessonEsc(student.nick || student.name)}</b><div style="font-size:10px;color:#9CA3AF">${lessonEsc(student.name || '')}</div>
            <div style="font-size:10px;color:#6B7280">${lessonEsc(student.flag || '')} ${lessonEsc(student.nationality || '-')} · ${lessonEsc(student.gender || '-')} ${student.age != null ? student.age + '세' : ''}</div>
          </div>
        </div>
      </td>
      <td style="font-size:11px;color:#4B5563">${lessonEsc(student.course || '-')}<div style="font-size:10px;color:#9CA3AF">${lessonEsc(period)}</div></td>
      <td style="font-size:11px">${lessonEsc(student.level || '-')}</td>
      <td style="font-size:11px;font-weight:700;color:${summary.assigned === summary.total ? '#059669' : '#B45309'}">${summary.assigned}/${summary.total}${mode === 'oneToOne' ? '교시' : '개'}</td>
      <td>${tags}</td>
      <td style="text-align:center"><div style="display:flex;justify-content:center;gap:4px;flex-wrap:nowrap">${assignmentButtons}</div></td>
    </tr>`;
  }).join('') || `<tr><td colspan="7" style="padding:30px;text-align:center;color:#9CA3AF">배정할 ${mode === 'oneToOne' ? '1:1' : '그룹'} 수업 요구사항이 있는 학생이 없어.</td></tr>`;
}

let _studentClassAssignTab = 'students';

function switchStudentClassAssignTab(tab) {
  _studentClassAssignTab = tab === 'groups' ? 'groups' : 'students';
  renderStudentClassAssignView();
}

// 사이드바 하위 메뉴에서 진입한다. 화면 안 탭이 아니라 메뉴가 두 화면을 가르므로,
// 상태를 먼저 정하고 navigate()가 renderStudentClassAssignView()를 한 번만 부르게 한다.
// ═════════════════════════════════════════════════════════════
// 주간 수업 배정 — 주(週) 단위 계획
//
// 수업은 일주일 단위로 넣고 뺀다. 그래서 "주 하나 = 종이 한 장"으로 본다.
// 새 주는 빈 종이로 시작하고, 「지난주 그대로 가져오기」로 지난주를 복사해서 고친다.
// 지난주 종이는 절대 덮이지 않는다 — 출결·진도·정산이 그 기록을 본다.
//
// 지금 화면들은 전부 MOCK_GROUP_CLASSES 하나를 보고 그린다. 그걸 다 고치는 대신
// MOCK_GROUP_CLASSES를 "지금 보고 있는 주"로 두고, 주를 옮길 때 통째로 갈아끼운다.
// 그래서 기존 화면은 손대지 않아도 주 단위로 동작한다.
// ═════════════════════════════════════════════════════════════

let _scaWeek = null;                 // 지금 보고 있는 주(그 주 월요일 날짜)
// { '2026-08-24': { groups: { groupId: {studentIds, periods, teacherId, roomId} },
//                    oneToOne: { studentId: [ {subjectId, templateSequence, teacherId, dayOfWeek, period} ] } } }
// 1:1도 여기 같이 담는다. 안 담으면 학생한테 그냥 붙어 있어서 몇 주를 넘겨도 따라온다.
let MOCK_WEEK_PLANS = {};

// 아무 날짜나 주면 그 주 월요일을 돌려준다.
function getMondayOfWeek(dateStr) {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const dow = date.getDay();
  date.setDate(date.getDate() - (dow === 0 ? 6 : dow - 1));
  return toWeekKey(date);
}

function toWeekKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftWeekKey(weekOf, deltaWeeks) {
  const date = new Date(`${weekOf}T00:00:00`);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return toWeekKey(date);
}

// 그 주의 금요일. 재원 여부를 따질 때 주의 끝으로 쓴다.
function getWeekEndKey(weekOf) {
  return shiftWeekKey(weekOf, 0) === weekOf ? addDays(weekOf, 4) : addDays(weekOf, 4);
}

function addDays(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toWeekKey(date);
}

function formatWeekRangeLabel(weekOf) {
  const start = new Date(`${weekOf}T00:00:00`);
  const end = new Date(`${getWeekEndKey(weekOf)}T00:00:00`);
  return `${start.getMonth() + 1}월 ${start.getDate()}일 ~ ${end.getMonth() + 1}월 ${end.getDate()}일`;
}

// 오늘이 속한 주. 데이터가 2026년 기준이라 오늘이 그 앞이면 데이터 주를 쓴다.
function getDefaultScaWeek() {
  return getMondayOfWeek(typeof _csCurrentWeek === 'string' ? _csCurrentWeek : '2026-06-22');
}

function getScaWeek() {
  if (!_scaWeek) {
    _scaWeek = getDefaultScaWeek();
    // 지금 들어 있는 배정을 이번 주 계획으로 삼는다(처음 한 번).
    if (!MOCK_WEEK_PLANS[_scaWeek]) captureWeekPlan(_scaWeek);
  }
  return _scaWeek;
}

// 지금 화면에 올라와 있는 배정을 그 주 계획으로 저장한다.
function captureWeekPlan(weekOf) {
  const groups = {};
  MOCK_GROUP_CLASSES.forEach(group => {
    groups[group.id] = {
      studentIds: [...(group.studentIds || [])],
      periods: [...(group.periods || [])],
      teacherId: group.teacherId ?? null,
      roomId: group.roomId ?? null
    };
  });
  const oneToOne = {};
  MOCK_STUDENTS.forEach(student => {
    if (!Array.isArray(student.oneToOneSchedule) || !student.oneToOneSchedule.length) return;
    oneToOne[student.id] = student.oneToOneSchedule.map(item => ({ ...item, dayOfWeek: [...(item.dayOfWeek || [])] }));
  });
  MOCK_WEEK_PLANS[weekOf] = { groups, oneToOne };
}

function hasWeekPlan(weekOf) {
  return Object.prototype.hasOwnProperty.call(MOCK_WEEK_PLANS, weekOf);
}

// 그 주 계획을 화면 데이터에 올린다. 계획이 없으면 빈 종이 — 명단도 시간도 비운다.
function applyWeekPlan(weekOf) {
  const plan = MOCK_WEEK_PLANS[weekOf] || null;
  const groups = plan ? (plan.groups || {}) : null;
  MOCK_GROUP_CLASSES.forEach(group => {
    const saved = groups ? groups[group.id] : null;
    group.studentIds = saved ? [...saved.studentIds] : [];
    group.periods = saved ? [...saved.periods] : [];
    group.teacherId = saved ? saved.teacherId : null;
    group.roomId = saved ? saved.roomId : null;
  });
  // 1:1도 같이 갈아끼운다. 계획이 없는 주는 0건에서 시작한다.
  const oneToOne = plan ? (plan.oneToOne || {}) : null;
  MOCK_STUDENTS.forEach(student => {
    const saved = oneToOne ? oneToOne[student.id] : null;
    student.oneToOneSchedule = saved
      ? saved.map(item => ({ ...item, dayOfWeek: [...(item.dayOfWeek || [])] }))
      : [];
  });
}

function setScaWeek(weekOf) {
  const current = getScaWeek();
  captureWeekPlan(current);
  _scaWeek = weekOf;
  applyWeekPlan(weekOf);
  renderStudentClassAssignView();
}

function moveScaWeek(delta) {
  setScaWeek(shiftWeekKey(getScaWeek(), delta));
}

// 지난주를 이번 주로 복사한다. 매주 처음부터 짜지 않게 하는 장치.
function copyPreviousWeekPlan() {
  const week = getScaWeek();
  const previous = shiftWeekKey(week, -1);
  if (!hasWeekPlan(previous)) {
    showToast('지난주에 저장된 배정이 없어.', 'warning');
    return;
  }
  const already = MOCK_GROUP_CLASSES.some(g => (g.studentIds || []).length || (g.periods || []).length)
    || MOCK_STUDENTS.some(s => (s.oneToOneSchedule || []).length);
  if (already && !window.confirm('이번 주에 이미 짜둔 배정이 있어. 지난주 것으로 덮어쓸까?')) return;
  MOCK_WEEK_PLANS[week] = JSON.parse(JSON.stringify(MOCK_WEEK_PLANS[previous]));
  applyWeekPlan(week);
  showToast('✓ 지난주 배정을 이번 주로 가져왔어. 달라진 학생만 손보면 돼.', 'success');
  renderStudentClassAssignView();
}

// 이번 주만 지난주 상태로 되돌린다. 지난주 종이는 건드리지 않는다.
function resetScaWeekToPrevious() {
  const week = getScaWeek();
  if (!window.confirm(`${formatWeekRangeLabel(week)} 배정을 지난주 상태로 되돌릴까?\n이번 주에 한 작업만 없어지고 지난주는 그대로 남아.`)) return;
  copyPreviousWeekPlan();
}

// ── 그 주에 학원에 있는 학생인지 ───────────────────────────
function isStudentEnrolledInWeek(student, weekOf) {
  if (!student) return false;
  const weekStart = weekOf;
  const weekEnd = getWeekEndKey(weekOf);
  const start = student.startDate || null;
  const end = student.departureDate || null;
  if (start && start > weekEnd) return false;
  if (end && end < weekStart) return false;
  return true;
}

function getScaWeekStudents() {
  const week = getScaWeek();
  return MOCK_STUDENTS.filter(student => isStudentEnrolledInWeek(student, week));
}

// 이번 주에 새로 들어온 학생 / 지난주에 나간 학생
function getScaWeekArrivals() {
  const week = getScaWeek();
  const previous = shiftWeekKey(week, -1);
  return MOCK_STUDENTS.filter(s => isStudentEnrolledInWeek(s, week) && !isStudentEnrolledInWeek(s, previous));
}

function getScaWeekDepartures() {
  const week = getScaWeek();
  const previous = shiftWeekKey(week, -1);
  return MOCK_STUDENTS.filter(s => !isStudentEnrolledInWeek(s, week) && isStudentEnrolledInWeek(s, previous));
}

// ── 단계별 남은 일 ────────────────────────────────────────
// 1단계: 이번 주 재원 학생 중 아직 반이 안 정해진 그룹 수업 칸
// 2단계: 학생이 있는데 교시가 없는 반
// 3단계: 아직 시간이 안 잡힌 1:1 수업
function getScaStepProgress() {
  const students = getScaWeekStudents();
  let groupNeeded = 0;
  let groupMissing = 0;
  let oneNeeded = 0;
  let oneMissing = 0;
  const missingStudents = [];
  students.forEach(student => {
    const requirements = getStudentLessonRequirements(student);
    let missedHere = 0;
    requirements.forEach(req => {
      if (req.classType === '1:1') {
        oneNeeded += 1;
        if (req.status !== 'ASSIGNED') oneMissing += 1;
      } else {
        groupNeeded += 1;
        if (req.status !== 'ASSIGNED') { groupMissing += 1; missedHere += 1; }
      }
    });
    if (missedHere) missingStudents.push(student);
  });

  const liveGroups = MOCK_GROUP_CLASSES.filter(g => g.status === 'active' && (g.studentIds || []).length);
  const unplaced = liveGroups.filter(g => !Array.isArray(g.periods) || !g.periods.length);

  return {
    students: students.length,
    step1: { total: groupNeeded, missing: groupMissing, students: missingStudents },
    step2: { total: liveGroups.length, missing: unplaced.length, groups: unplaced },
    step3: { total: oneNeeded, missing: oneMissing }
  };
}

// ── 화면 맨 위 두 줄 ──────────────────────────────────────
let _scaStep = 1;
// 1단계 학생 목록에서 「배정 완료」 묶음을 펼쳤는지. 기본은 접힘 — 손댈 학생만 보이게.
let _scaDoneOpen = false;
function toggleScaDoneRows() {
  _scaDoneOpen = !_scaDoneOpen;
  renderScaStep1Board();
}
function setScaStep(step) {
  const next = Number(step);
  // 2단계(그룹 시간표)는 없앴다 — 하던 일이 1단계 아래 「그룹 수업 목록」으로 들어왔다.
  // 예전 화면으로 보내던 호출이 여기저기 남아 있어서, 들어오는 지점에서 한 번에 1단계로 돌린다.
  _scaStep = next === 2 ? 1 : next;
  // 사이드 메뉴 강조가 이 값을 보고 있어서 같이 맞춰둔다.
  _studentClassAssignTab = _scaStep === 2 ? 'groups' : 'students';
  renderStudentClassAssignView();
}

function renderScaWeekHeader() {
  const host = document.getElementById('sca-week-header');
  if (!host) return;
  const week = getScaWeek();
  const previous = shiftWeekKey(week, -1);
  const progress = getScaStepProgress();
  const arrivals = getScaWeekArrivals();
  const departures = getScaWeekDepartures();
  const isDefaultWeek = week === getDefaultScaWeek();
  const planned = hasWeekPlan(week) && MOCK_GROUP_CLASSES.some(g => (g.studentIds || []).length);

  // no 는 내부 단계 번호, shown 은 화면에 찍히는 번호다. 2단계를 없애면서 3단계가 화면에서는
  // 2번이 됐는데, 내부 번호까지 당기면 setScaStep 을 부르는 자리를 전부 손봐야 해서 표시만 나눈다.
  const stepCard = (no, shown, label, doneText, missing, hint, empty) => {
    if (empty) {
      const on = _scaStep === no;
      return `<button onclick="setScaStep(${no})" style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px;padding:12px 14px;border:0;border-right:1px solid #F1F3F7;background:${on ? '#EEF2FF' : '#fff'};cursor:pointer;text-align:left;position:relative">
        <span style="display:inline-grid;place-items:center;width:24px;height:24px;flex:0 0 24px;border-radius:50%;background:#F3F4F6;color:#9CA3AF;font-size:11px;font-weight:800">${shown}</span>
        <span style="min-width:0"><b style="display:block;font-size:12px;font-weight:700;color:${on ? '#4F46E5' : '#6B7280'}">${shown} · ${label}</b><span style="display:block;font-size:10.5px;margin-top:2px;color:#9CA3AF">${empty}</span></span>
        ${on ? '<span style="position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#5E5CE6"></span>' : ''}
      </button>`;
    }
    const state = missing === 0 ? 'done' : (_scaStep === no ? 'now' : 'todo');
    const bg = state === 'now' ? '#EEF2FF' : '#fff';
    const numBg = state === 'done' ? '#047857' : state === 'now' ? '#5E5CE6' : '#F3F4F6';
    const numColor = state === 'todo' ? '#9CA3AF' : '#fff';
    const subColor = state === 'done' ? '#047857' : state === 'now' ? '#4F46E5' : '#9CA3AF';
    return `<button onclick="setScaStep(${no})" style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px;padding:12px 14px;border:0;border-right:1px solid #F1F3F7;background:${bg};cursor:pointer;text-align:left;position:relative">
      <span style="display:inline-grid;place-items:center;width:24px;height:24px;flex:0 0 24px;border-radius:50%;background:${numBg};color:${numColor};font-size:11px;font-weight:800">${missing === 0 ? '✓' : shown}</span>
      <span style="min-width:0">
        <b style="display:block;font-size:12px;font-weight:700;color:${state === 'now' ? '#4F46E5' : '#6B7280'}">${shown} · ${label}</b>
        <span style="display:block;font-size:10.5px;margin-top:2px;font-weight:${missing === 0 ? 700 : 600};color:${subColor}">${missing === 0 ? doneText : hint}</span>
      </span>
      ${_scaStep === no ? '<span style="position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#5E5CE6"></span>' : ''}
    </button>`;
  };

  const todoLine = (() => {
    if (!planned) {
      return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#EEF2FF;border-bottom:1px solid #F1F3F7;font-size:11.5px;color:#4338CA">
        <b>${formatWeekRangeLabel(week)} 주는 아직 비어 있어.</b> 지난주 배정을 가져와서 시작해.
        ${hasWeekPlan(previous) ? `<button onclick="copyPreviousWeekPlan()" style="margin-left:auto;border:0;border-radius:8px;padding:6px 13px;background:#5E5CE6;color:#fff;font-size:10.5px;font-weight:700;cursor:pointer">지난주 그대로 가져오기</button>` : '<span style="margin-left:auto;color:#6B7280">지난주에도 저장된 배정이 없어.</span>'}
      </div>`;
    }
    if (progress.step1.missing) {
      if (_scaStep === 1) return '';
      const names = progress.step1.students.slice(0, 4).map(s => lessonEsc(s.nick || s.name)).join(' · ');
      return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#FEF3C7;border-bottom:1px solid #F1F3F7;font-size:11.5px;color:#4B5563">
        지금 할 일 — <b style="color:#B45309">학생 ${progress.step1.students.length}명</b>이 아직 반이 없어. ${lessonEsc(names)}${progress.step1.students.length > 4 ? ` 외 ${progress.step1.students.length - 4}명` : ''}.
        <button onclick="setScaStep(1)" style="margin-left:auto;border:0;border-radius:8px;padding:6px 13px;background:#5E5CE6;color:#fff;font-size:10.5px;font-weight:700;cursor:pointer">1단계로 가기</button>
      </div>`;
    }
    if (progress.step2.missing) {
      if (_scaStep === 1) return '';
      const names = progress.step2.groups.slice(0, 3).map(g => lessonEsc(getGroupDisplayName(g))).join(' · ');
      return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#FEF3C7;border-bottom:1px solid #F1F3F7;font-size:11.5px;color:#4B5563">
        지금 할 일 — <b style="color:#B45309">${progress.step2.missing}개 반</b>이 아직 강사·시간이 없어. ${names}.
        <button onclick="setScaStep(1)" style="margin-left:auto;border:0;border-radius:8px;padding:6px 13px;background:#5E5CE6;color:#fff;font-size:10.5px;font-weight:700;cursor:pointer">그룹 수업 목록으로</button>
      </div>`;
    }
    if (progress.step3.missing) {
      if (_scaStep === 3) return '';
      return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#FEF3C7;border-bottom:1px solid #F1F3F7;font-size:11.5px;color:#4B5563">
        지금 할 일 — 1:1 수업 <b style="color:#B45309">${progress.step3.missing}건</b>이 남았어. 그룹이 다 앉았으니 남은 자리에 끼우면 돼.
        <button onclick="setScaStep(3)" style="margin-left:auto;border:0;border-radius:8px;padding:6px 13px;background:#5E5CE6;color:#fff;font-size:10.5px;font-weight:700;cursor:pointer">2단계로 가기</button>
      </div>`;
    }
    return `<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#ECFDF5;border-bottom:1px solid #F1F3F7;font-size:11.5px;color:#047857">
      <b>${formatWeekRangeLabel(week)} 배정이 다 끝났어.</b> 다음 주로 넘어가서 미리 짜둘 수도 있어.
    </div>`;
  })();

  host.innerHTML = `<div style="border:1px solid #E5E7EB;border-radius:13px;background:#fff;overflow:hidden;margin-bottom:16px;box-shadow:0 1px 2px rgba(15,23,42,.04)">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 13px;border-bottom:1px solid #F1F3F7">
      <button onclick="moveScaWeek(-1)" title="지난주" style="width:25px;height:25px;border-radius:7px;border:1px solid #E5E7EB;background:#fff;color:#6B7280;font-size:10px;cursor:pointer">◀</button>
      <b style="font-size:13.5px;color:#111827">${formatWeekRangeLabel(week)}</b>
      ${isDefaultWeek ? '<span style="font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:999px;background:#5E5CE6;color:#fff">이번 주</span>' : ''}
      <button onclick="moveScaWeek(1)" title="다음 주" style="width:25px;height:25px;border-radius:7px;border:1px solid #E5E7EB;background:#fff;color:#6B7280;font-size:10px;cursor:pointer">▶</button>
      <span style="font-size:10.5px;color:#6B7280">재원 <b style="color:#111827">${progress.students}명</b>${arrivals.length ? ` · 신규 <b style="color:#047857">${arrivals.length}명</b>` : ''}${departures.length ? ` · 퇴소 <b style="color:#B45309">${departures.length}명</b>` : ''}</span>
      <span style="margin-left:auto;display:flex;gap:6px">
        ${planned && hasWeekPlan(previous) ? `<button onclick="resetScaWeekToPrevious()" style="border:1px solid #E5E7EB;border-radius:8px;padding:6px 12px;background:#fff;color:#6B7280;font-size:10.5px;font-weight:700;cursor:pointer">이번 주 되돌리기</button>` : ''}
      </span>
    </div>
    <div style="display:flex;align-items:stretch;flex-wrap:wrap;border-bottom:1px solid #E5E7EB">
      ${stepCard(1, 1, '그룹 수업 배정', `학생 ${progress.students}명 · ${progress.step2.total}개 반 전부 끝`, progress.step1.missing + progress.step2.missing,
        [progress.step1.missing ? `학생 ${progress.step1.students.length}명 반 없음` : '', progress.step2.missing ? `${progress.step2.missing}개 반 강사 미정` : ''].filter(Boolean).join(' · '))}
      ${stepCard(3, 2, '1:1 배정', `${progress.step3.total}건 전부 배정`, progress.step3.missing, `${progress.step3.total - progress.step3.missing}/${progress.step3.total}건 배정 · ${progress.step3.missing}건 남음`)}
      <button onclick="setScaStep(4)" title="이번 주에 짜인 수업을 한눈에 본다" style="flex:0 0 auto;display:flex;align-items:center;gap:9px;padding:12px 16px;border:0;background:${_scaStep === 4 ? '#EEF2FF' : '#F8FAFC'};cursor:pointer;text-align:left;position:relative">
        <span style="display:inline-grid;place-items:center;width:24px;height:24px;flex:0 0 24px;border-radius:7px;border:1.5px dashed ${_scaStep === 4 ? '#5E5CE6' : '#D1D5DB'};color:${_scaStep === 4 ? '#4F46E5' : '#9CA3AF'};font-size:11px">▦</span>
        <span><b style="display:block;font-size:12px;font-weight:700;color:${_scaStep === 4 ? '#4F46E5' : '#6B7280'}">전체 시간표</b><span style="display:block;font-size:10.5px;margin-top:2px;color:#9CA3AF">보기 전용</span></span>
        ${_scaStep === 4 ? '<span style="position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#5E5CE6"></span>' : ''}
      </button>
    </div>
    ${todoLine}
  </div>`;
}
// ═════════════════════════════════════════════════════════════
// 1단계 — 그룹 편성 (학생 × 과목)
//
// 학생 한 명은 반 하나에 들어가는 게 아니라 과목마다 반 하나씩 들어간다.
// 그래서 반 쪽에서 보면 하나를 빠뜨려도 "자리가 하나 빈 것"으로만 보인다.
// 학생을 세로로 놓아야 빠진 칸이 보인다 — 줄에 빈 칸이 없으면 그 학생은 끝이다.
//
// 이 단계에서 막을 수 있는 이유는 셋뿐이다: 자리 없음 · 레벨 안 맞음 · 이미 잡힌 그룹 시간과 겹침.
// 1:1은 이유가 될 수 없다. 1:1은 3단계에서 그룹을 피해 배치되니까, 여기서 1:1을 이유로 막으면 순서가 거꾸로다.
// ═════════════════════════════════════════════════════════════

// 이 학생이 "다른 그룹 수업"으로 이미 차지하고 있는 교시. 1:1은 일부러 빼고 센다.
function getStudentGroupBusyPeriods(student, excludeGroupId) {
  const periods = new Set();
  MOCK_GROUP_CLASSES.forEach(group => {
    if (group.id === excludeGroupId) return;
    if (group.status !== 'active') return;
    if (!Array.isArray(group.periods) || !group.periods.length) return;
    if (!group.studentIds.includes(student.id)) return;
    group.periods.forEach(period => periods.add(Number(period)));
  });
  return periods;
}

// 이 학생·이 과목에 넣을 수 있는 반 목록. 못 넣는 반도 이유를 붙여서 같이 돌려준다.
function getScaStep1GroupOptions(student, requirement) {
  const level = getLevelGroupForStudent(student);
  const busy = getStudentGroupBusyPeriods(student, null);
  return MOCK_GROUP_CLASSES
    .filter(group => group.status === 'active'
      && group.classType === requirement.classType
      && getGroupSubjectId(group) === requirement.subjectId)
    .map(group => {
      const cap = getGroupCapacityFor(group);
      const count = group.studentIds.length;
      const periods = Array.isArray(group.periods) ? group.periods.map(Number) : [];
      const when = periods.length ? `${periods.join(', ')}교시` : '시간 미정';
      if (group.studentIds.includes(student.id)) return { group, when, ok: false, reason: '이미 이 반이야' };
      if (level == null || !getGroupLevelSet(group).includes(level)) return { group, when, ok: false, reason: '레벨이 안 맞아' };
      if (count >= cap) return { group, when, ok: false, reason: `${count}/${cap}명 · 자리 없음` };
      const clash = periods.filter(period => busy.has(period));
      if (clash.length) return { group, when, ok: false, reason: `${clash.join('·')}교시에 다른 그룹 수업이 있어` };
      if (isGroupNationalityLimitExceeded(group, student)) return { group, when, ok: false, reason: '동일 국적 제한 초과' };
      return { group, when, ok: true, reason: `${count}/${cap}명 · 자리 ${cap - count}석` };
    })
    .sort((a, b) => (a.ok ? 0 : 1) - (b.ok ? 0 : 1));
}

// 그 반 교시와 겹치는 1:1을 놓아준다. 3단계에서 그룹을 피해 다시 잡는다.
function releaseOneToOneClashingWithGroup(student, group) {
  const periods = Array.isArray(group.periods) ? group.periods.map(Number) : [];
  if (!periods.length || !Array.isArray(student.oneToOneSchedule)) return [];
  const released = student.oneToOneSchedule.filter(item => periods.includes(Number(item.period)));
  if (!released.length) return [];
  student.oneToOneSchedule = student.oneToOneSchedule.filter(item => !periods.includes(Number(item.period)));
  return released;
}

// 그룹이 이 강사의 이 교시를 가져가면, 같은 자리에 있던 1:1은 놓아준다. 3단계에서 다시 잡는다.
function releaseTeacherOneToOneAtPeriod(teacherId, period) {
  const target = Number(period);
  const owner = Number(teacherId);
  const released = [];
  MOCK_STUDENTS.forEach(student => {
    if (!Array.isArray(student.oneToOneSchedule)) return;
    const hit = student.oneToOneSchedule.filter(item =>
      Number(item.teacherId) === owner && Number(item.period) === target);
    if (!hit.length) return;
    student.oneToOneSchedule = student.oneToOneSchedule.filter(item =>
      !(Number(item.teacherId) === owner && Number(item.period) === target));
    hit.forEach(item => released.push({ student, entry: item }));
  });
  return released;
}

function assignScaStep1(studentId, groupId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(groupId));
  if (!student || !group) return { ok: false, message: '학생 또는 반 정보를 찾을 수 없어.' };
  if (group.studentIds.includes(student.id)) return { ok: false, message: '이미 이 반이야.' };
  const cap = getGroupCapacityFor(group);
  if (group.studentIds.length >= cap) return { ok: false, message: `자리가 없어 (${cap}명).` };
  const level = getLevelGroupForStudent(student);
  if (level == null || !getGroupLevelSet(group).includes(level)) return { ok: false, message: '레벨이 안 맞아.' };
  const busy = getStudentGroupBusyPeriods(student, group.id);
  const clash = (Array.isArray(group.periods) ? group.periods.map(Number) : []).filter(period => busy.has(period));
  if (clash.length) return { ok: false, message: `${clash.join('·')}교시에 다른 그룹 수업이 있어.` };
  if (isGroupNationalityLimitExceeded(group, student)) return { ok: false, message: '동일 국적 제한을 넘어.' };
  const released = releaseOneToOneClashingWithGroup(student, group);
  group.studentIds.push(student.id);
  return {
    ok: true,
    released: released.length,
    message: `${student.nick || student.name} 학생을 ${getGroupDisplayName(group)}에 넣었어.${released.length ? ` 겹치던 1:1 ${released.length}건은 2단계에서 다시 잡아줘.` : ''}`
  };
}

function unassignScaStep1(studentId, groupId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(groupId));
  if (!student || !group) return;
  if (!window.confirm(`${student.nick || student.name} 학생을 ${getGroupDisplayName(group)}에서 뺄까?`)) return;
  group.studentIds = group.studentIds.filter(id => id !== student.id);
  showToast(`${student.nick || student.name} 학생을 ${getGroupDisplayName(group)}에서 뺐어.`, 'success');
  renderStudentClassAssignView();
}

// 자리 많이 남은 반부터 채운다. 한 반에 몰리지 않게 하려는 것.
function runScaStep1AutoAssign() {
  const students = getScaWeekStudents();
  let filled = 0;
  const blocked = [];
  students.forEach(student => {
    getStudentLessonRequirements(student).forEach(requirement => {
      if (requirement.classType === '1:1' || requirement.status === 'ASSIGNED') return;
      const options = getScaStep1GroupOptions(student, requirement).filter(option => option.ok);
      if (!options.length) {
        blocked.push(`${student.nick || student.name} · ${requirement.subjectName}`);
        return;
      }
      const best = options.sort((a, b) =>
        (getGroupClassCapacity(b.group.classType) - b.group.studentIds.length)
        - (getGroupClassCapacity(a.group.classType) - a.group.studentIds.length))[0];
      const result = assignScaStep1(student.id, best.group.id);
      if (result.ok) filled += 1;
      else blocked.push(`${student.nick || student.name} · ${requirement.subjectName}`);
    });
  });
  if (!filled && !blocked.length) showToast('이미 다 채워져 있어. 손댈 게 없어.', 'info');
  else if (!blocked.length) showToast(`✓ ${filled}칸을 채웠어. 빈 칸이 없어졌어.`, 'success');
  else showToast(`${filled}칸을 채웠어. ${blocked.length}칸은 못 채웠어 — 빨간 칸을 눌러서 확인해줘.`, 'warning');
  renderStudentClassAssignView();
}

// ── 반 고르기 팝업 ────────────────────────────────────────
let _scaPick = null;

function openScaStep1Picker(studentId, sequence) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  if (!student) return;
  const requirement = getStudentLessonRequirements(student).find(item => item.sequence === Number(sequence));
  if (!requirement) return;
  _scaPick = { studentId: student.id, sequence: Number(sequence) };
  const modal = document.createElement('div');
  modal.id = 'sca-step1-picker';
  modal.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(17,24,39,.52);display:flex;align-items:center;justify-content:center;padding:20px';
  modal.onclick = event => { if (event.target === modal) closeScaStep1Picker(); };
  document.body.appendChild(modal);
  renderScaStep1Picker();
}

function closeScaStep1Picker() {
  const modal = document.getElementById('sca-step1-picker');
  if (modal) modal.remove();
  _scaPick = null;
}

function renderScaStep1Picker() {
  const modal = document.getElementById('sca-step1-picker');
  if (!modal || !_scaPick) return;
  const student = MOCK_STUDENTS.find(item => item.id === _scaPick.studentId);
  const requirement = getStudentLessonRequirements(student).find(item => item.sequence === _scaPick.sequence);
  if (!student || !requirement) { closeScaStep1Picker(); return; }
  const options = getScaStep1GroupOptions(student, requirement);
  const levelName = getLevelGroupName(getLevelGroupForStudent(student));

  // 이미 반이 있는 칩으로도 이 팝업이 열린다(회색 칩 = 반 바꾸기). 그럴 땐 지금 반을 맨 위에 세우고
  // 빼는 길을 열어둔다 — 빼지 않고는 다른 반을 고를 수 없어서(같은 과목을 두 반 들 수는 없다).
  const currentGroup = requirement.groupId != null
    ? MOCK_GROUP_CLASSES.find(item => item.id === Number(requirement.groupId))
    : null;
  const currentHtml = currentGroup ? `<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 11px;margin-bottom:12px;border:1px solid #E5E7EB;border-radius:9px;background:#F9FAFB">
    <span style="font-size:10px;font-weight:800;color:#6B7280">지금 이 반</span>
    <b style="font-size:11.5px;color:#111827">${lessonEsc(getGroupDisplayName(currentGroup))}</b>
    <span style="font-size:10.5px;color:#6B7280">${lessonEsc(isGroupScheduled(currentGroup)
      ? `${currentGroup.periods.map(Number).sort((a, b) => a - b).join('·')}교시`
      : '시간 미정')}</span>
    <button onclick="unassignScaStep1FromPicker(${currentGroup.id})" style="margin-left:auto;border:1px solid #FCA5A5;border-radius:7px;padding:4px 10px;background:#fff;color:#DC2626;font-size:10px;font-weight:700;cursor:pointer">이 반에서 빼기</button>
  </div>` : '';

  const rows = options.map(option => `<button ${option.ok ? `onclick="pickScaStep1Group(${option.group.id})"` : 'disabled'} style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;padding:9px 11px;margin-bottom:5px;border:1px solid #E5E7EB;border-radius:9px;background:#fff;cursor:${option.ok ? 'pointer' : 'not-allowed'};opacity:${option.ok ? 1 : .5}">
    <span style="font-size:11.5px;font-weight:700;color:#111827">${lessonEsc(getGroupDisplayName(option.group))} <span style="font-weight:400;color:#6B7280">· ${lessonEsc(option.when)}</span></span>
    <span style="flex:0 0 auto;font-size:10px;font-weight:700;color:${option.ok ? '#047857' : '#9CA3AF'}">${option.ok ? '✓ ' : ''}${lessonEsc(option.reason)}</span>
  </button>`).join('') || '<div style="font-size:11px;color:#9CA3AF;padding:6px 0">이 과목·레벨로 열린 반이 아직 없어.</div>';

  modal.innerHTML = `<div style="width:min(520px,96vw);max-height:90vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden">
    <div style="padding:16px 20px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:10px">
      <h3 style="font-size:15px;margin:0;color:#111827">${lessonEsc(student.nick || student.name)} · ${lessonEsc(requirement.subjectName)} · ${lessonEsc(levelName)}</h3>
      <span style="font-size:10px;font-weight:700;color:#6B7280;background:#F3F4F6;border-radius:5px;padding:2px 7px">${lessonEsc(requirement.classType)}</span>
      <button onclick="closeScaStep1Picker()" style="margin-left:auto;border:0;background:none;font-size:20px;color:#6B7280;cursor:pointer">×</button>
    </div>
    <div style="padding:16px 20px;overflow:auto">
      ${currentHtml}
      <div style="font-size:10.5px;font-weight:800;color:#6B7280;margin-bottom:8px">${currentGroup ? '옮길 수 있는 반' : '갈 수 있는 반'} <span style="font-weight:400;color:#9CA3AF">— 여기서는 정원 · 레벨 · 이미 잡힌 그룹 시간만 본다</span></div>
      ${rows}
      <div style="display:flex;align-items:center;gap:9px;margin:11px 0;color:#9CA3AF;font-size:9.5px"><span style="flex:1;height:1px;background:#E5E7EB"></span>또는<span style="flex:1;height:1px;background:#E5E7EB"></span></div>
      <button onclick="createGroupFromScaStep1()" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;padding:10px 11px;border:1px solid #5E5CE6;border-radius:9px;background:#EEF2FF;cursor:pointer">
        <span style="font-size:11.5px;font-weight:700;color:#4F46E5">＋ 새 반 만들기</span>
        <span style="font-size:10px;color:#6B7280">${lessonEsc(requirement.subjectName)} · ${lessonEsc(levelName)} · ${lessonEsc(requirement.classType)}로 미리 채워짐</span>
      </button>
      <div style="margin-top:10px;font-size:10px;color:#9CA3AF;line-height:1.7">새로 만든 반은 <b>시간 미정</b>으로 생겨. 교시 · 담당 선생님 · 강의실은 아래 <b>그룹 수업 목록</b>에서 「강사 배정」으로 정해.</div>
    </div>
  </div>`;
}

function pickScaStep1Group(groupId) {
  if (!_scaPick) return;
  const student = MOCK_STUDENTS.find(item => item.id === _scaPick.studentId);
  const requirement = student
    ? getStudentLessonRequirements(student).find(item => item.sequence === _scaPick.sequence)
    : null;
  // 이미 반이 있는 칩에서 다른 반을 고르면 「옮기는」 것이다. 지금 반에서 먼저 빼야 한다 —
  // 안 그러면 같은 과목을 두 반 듣게 되고, 지금 반 교시가 겹침 판정에 그대로 남아 옮길 수도 없다.
  const previous = requirement && requirement.groupId != null && Number(requirement.groupId) !== Number(groupId)
    ? MOCK_GROUP_CLASSES.find(item => item.id === Number(requirement.groupId))
    : null;
  if (previous) previous.studentIds = previous.studentIds.filter(id => id !== student.id);

  const result = assignScaStep1(_scaPick.studentId, groupId);
  // 새 반이 막히면 원래 반으로 되돌린다. 고르다 만 학생이 어느 반에도 없는 상태로 남으면 안 된다.
  if (!result.ok && previous && !previous.studentIds.includes(student.id)) previous.studentIds.push(student.id);

  showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
  if (!result.ok) { renderScaStep1Picker(); return; }
  closeScaStep1Picker();
  renderStudentClassAssignView();
}

function unassignScaStep1FromPicker(groupId) {
  if (!_scaPick) return;
  const studentId = _scaPick.studentId;
  closeScaStep1Picker();
  unassignScaStep1(studentId, groupId);
}

function createGroupFromScaStep1() {
  if (!_scaPick) return;
  const student = MOCK_STUDENTS.find(item => item.id === _scaPick.studentId);
  const requirement = getStudentLessonRequirements(student).find(item => item.sequence === _scaPick.sequence);
  if (!requirement) return;
  const level = getLevelGroupForStudent(student);
  closeScaStep1Picker();
  openGroupCreateBrowserPopup([{ id: requirement.subjectId, hours: 1 }], requirement.classType, level);
}

// ── 표 ────────────────────────────────────────────────────
function getScaStep1Columns(students) {
  const seen = new Map();
  students.forEach(student => {
    getStudentLessonRequirements(student).forEach(requirement => {
      if (requirement.classType === '1:1') return;
      if (!seen.has(requirement.subjectId)) seen.set(requirement.subjectId, requirement.subjectName);
    });
  });
  return [...seen.entries()]
    .map(([subjectId, name]) => ({ subjectId, name, order: MOCK_MASTER_SUBJECTS.find(s => s.id === subjectId)?.order ?? 999 }))
    .sort((a, b) => a.order - b.order);
}

// 1단계 맨 위 — 이번 주에 그룹 수업을 듣는 학생 전원.
//
// 배정이 끝난 학생을 목록에서 지우지 않는다. 지워버리면 방금 어느 반에 넣었는지 확인할 길이 없고,
// 「반은 정해졌는데 그 반에 강사가 없는」 중간 상태가 어느 화면에도 나오지 않는다.
// 대신 칩이 세 가지 상태를 갖는다 — 반 없음 / 반은 있고 시간 미정 / 확정.
//
// 그룹 수업이 아예 없는 학생(1:1만 듣는 과정)만 뺀다. 손댈 게 없는 줄이라 스무 명 중 아홉 줄이
// 빈 줄이 된다. 몇 명을 뺐는지는 목록 끝에 한 줄로 적어둔다.
function getScaStep1Rows() {
  const arrivals = new Set(getScaWeekArrivals().map(student => student.id));
  return getScaWeekStudents().map(student => {
    const requirements = getStudentLessonRequirements(student).filter(item => item.classType !== '1:1');
    if (!requirements.length) return null;
    const chips = requirements.map(requirement => {
      const group = requirement.groupId != null
        ? MOCK_GROUP_CLASSES.find(item => item.id === Number(requirement.groupId))
        : null;
      const periods = group && Array.isArray(group.periods) ? group.periods.map(Number).sort((a, b) => a - b) : [];
      const state = !group ? 'none' : (isGroupScheduled(group) ? 'placed' : 'pending');
      // 확정된 칩은 교시 순으로 세운다 — 그러면 줄 하나가 그대로 그 학생의 하루가 된다.
      // 아직 손대야 하는 칩은 세울 교시가 없으니 맨 앞에 모아 할 일이 왼쪽에 붙게 한다.
      const rank = state === 'none' ? -2 : (state === 'pending' ? -1 : periods[0]);
      return { requirement, group, periods, state, rank };
    }).sort((a, b) => a.rank - b.rank);
    const placed = chips.filter(chip => chip.state !== 'none').length;
    return {
      student,
      chips,
      total: requirements.length,
      placed,
      missing: requirements.length - placed,
      isNew: arrivals.has(student.id)
    };
  }).filter(Boolean);
}

// 그룹 수업이 없어 목록에 세우지 않은 학생 수. 「20명인데 왜 11줄이지」에 답하는 숫자다.
function getScaStep1NoGroupCount() {
  return getScaWeekStudents().filter(student =>
    !getStudentLessonRequirements(student).some(item => item.classType !== '1:1')
  ).length;
}

// 학생 사진. 등록된 사진이 없으면 성별 기본 이미지로 떨어진다.
function getStudentPhotoSrc(student) {
  if (!student) return 'assets/images/student_male.png';
  return student.profilePhoto
    || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
}

// 수강 기간. 종료일이 따로 없으면 출국일을 끝으로 본다 — 다른 화면과 같은 규칙이다.
function getStudentPeriodText(student) {
  const start = student?.startDate || '';
  const end = student?.endDate || student?.departureDate || '';
  if (!start || !end) return '';
  const fmt = date => date.replace(/^20/, '').replace(/-/g, '.');
  const weeks = Math.max(1, Math.round((new Date(end) - new Date(start)) / (7 * 86400000)));
  return `${fmt(start)} ~ ${fmt(end)} (${weeks}주)`;
}

// 국적 · 나이. 값이 없는 항목은 빼서 구분점만 남지 않게 한다.
function getStudentOriginMetaText(student) {
  return [
    `${lessonEsc(student?.flag || '')} ${lessonEsc(student?.nationality || '-')}`.trim(),
    student?.age != null ? `${lessonEsc(String(student.age))}세` : ''
  ].filter(Boolean).join(' · ');
}

// 칩 하나 = 그 학생이 들어야 할 그룹 수업 한 과목. 세 상태를 색으로 가른다.
//   빨강(점선) 반 없음        → 갈 수 있는 반 고르기
//   노랑        반은 있고 시간 미정 → 그 반의 강사 배정 팝업으로 (할 일이 학생이 아니라 반 쪽에 있다)
//   회색        확정           → 누르면 반을 바꾼다
function renderScaStudentChip(chip, studentId) {
  const requirement = chip.requirement;
  const base = 'display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap';

  if (chip.state === 'none') {
    return `<button class="sca-chip" onclick="openScaStep1Picker(${studentId},${requirement.sequence})" title="갈 수 있는 반 고르기" style="${base};border:1px dashed #DC2626;background:#FEE2E2;color:#DC2626">
      <span style="font-weight:800;font-size:11px;line-height:1">＋</span>${lessonEsc(requirement.subjectName)}<span style="font-weight:400;font-size:9px;opacity:.75">${lessonEsc(getGroupSizeShortLabel(requirement.classType))} (${lessonEsc(requirement.classType)})</span>
    </button>`;
  }

  if (chip.state === 'pending') {
    return `<button class="sca-chip" onclick="openTeacherAssignModal(${chip.group.id})" title="${lessonEsc(getGroupDisplayName(chip.group))} — 이 반의 교시·강사·강의실이 아직 없어" style="${base};border:1px solid #F59E0B;background:#FEF3C7;color:#B45309">
      ${lessonEsc(requirement.subjectName)}<span style="font-weight:400;font-size:9px">· 시간 미정</span>
    </button>`;
  }

  const teacher = MOCK_TEACHERS.find(item => item.id === Number(chip.group.teacherId));
  const room = MOCK_CLASS_ROOMS.find(item => item.id === Number(chip.group.roomId));
  const title = `${getGroupDisplayName(chip.group)} · ${room?.roomNo || '-'} — 누르면 반을 바꿔`;
  return `<button class="sca-chip" onclick="openScaStep1Picker(${studentId},${requirement.sequence})" title="${lessonEsc(title)}" style="${base};border:1px solid #E5E7EB;background:#F9FAFB;color:#6B7280;font-weight:400">
    ${lessonEsc(requirement.subjectName)} <b style="color:#111827">${chip.periods.join('·')}교시</b> ${lessonEsc(teacher?.nick || teacher?.name || '강사 미정')}
  </button>`;
}

// 위 구역. 이번 주에 그룹 수업을 듣는 학생 전원이 대상이지만,
// 배정이 끝난 학생은 접어서 요약 한 줄로 두고 — 손댈 학생만 펼쳐 보인다.
// 카운터는 줄 맨 앞에 세운다. 예전엔 오른쪽 끝에 붙여서 칩과 카운터 사이가 넓게 비었다.
// 칩 뒤로 남는 폭은 그냥 여백으로 둔다.
function scaStudentBoardRow(row, done) {
  const meta = getStudentOriginMetaText(row.student);
  const badge = `<span style="display:inline-block;font-size:9.5px;font-weight:800;border-radius:999px;padding:2px 7px;white-space:nowrap;${done ? 'color:#047857;background:#ECFDF5' : 'color:#DC2626;background:#FEE2E2'}">${row.placed}/${row.total}</span>`;
  // 이름 옆에 붙이면 이름 길이에 따라 레벨 시작 위치가 들쭉날쭉해진다.
  // 레벨은 줄끼리 비교하며 읽는 값이라 폭이 고정된 제 열에 세워 세로로 맞춘다.
  return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 13px;border-bottom:1px solid #F3F4F6;background:#fff;${done ? 'opacity:.6' : ''}">
    <span style="flex:0 0 38px;padding-top:3px">${badge}</span>
    <span style="flex:0 0 150px;min-width:0;display:flex;align-items:center;gap:8px">
      <img src="${lessonEsc(getStudentPhotoSrc(row.student))}" alt="${lessonEsc(row.student.nick || row.student.name)}" style="flex:0 0 auto;width:30px;height:30px;border-radius:50%;object-fit:cover;background:#F3F4F6;border:1px solid #E5E7EB"/>
      <span style="min-width:0">
        <span style="display:flex;align-items:center;gap:5px;min-width:0">
          <b style="font-size:11.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(row.student.nick || row.student.name)}</b>
          ${row.isNew ? '<span style="flex:0 0 auto;font-weight:800;font-size:8.5px;padding:1px 5px;border-radius:999px;background:#ECFDF5;color:#047857">신규</span>' : ''}
        </span>
        <span style="display:block;font-size:9.5px;color:#8A90A2;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${meta}</span>
      </span>
    </span>
    <span style="flex:0 0 30px;padding-top:3px"><button onclick="cycleStudentTimetable(${row.student.id})" title="시간표 — 누르면 다음 조로 바꿔" style="border:0;background:none;padding:0;cursor:pointer">${timetableCodeChip(getTimetableById(row.student.timetableId))}</button></span>
    <span style="flex:0 0 92px;min-width:0;padding-top:3px">${row.student.level
      ? `<span style="display:inline-block;max-width:100%;font-size:10.5px;font-weight:700;color:#4F46E5;background:#EEF2FF;border-radius:5px;padding:1px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle">${lessonEsc(row.student.level)}</span>`
      : '<span style="font-size:10px;color:#C4C9D4">레벨 없음</span>'}</span>
    <span style="flex:0 0 128px;min-width:0;padding-top:4px;font-size:9.5px;color:#8A90A2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="수강 기간">${getStudentPeriodText(row.student) || '<span style="color:#C4C9D4">기간 미등록</span>'}</span>
    <span style="flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding-top:1px">${row.chips.map(chip => renderScaStudentChip(chip, row.student.id)).join('')}</span>
  </div>`;
}

function renderScaStudentBoard() {
  const rows = getScaStep1Rows();
  const noGroupCount = getScaStep1NoGroupCount();
  const footer = noGroupCount
    ? `<div style="padding:8px 13px;border-top:1px solid #F3F4F6;font-size:9.5px;color:#9CA3AF">그룹 수업이 없는 학생 ${noGroupCount}명은 이 목록에 없어 — 1:1만 듣는 과정이야.</div>`
    : '';

  if (!rows.length) {
    return `<div style="border:1px solid #E5E7EB;border-radius:11px;background:#fff;overflow:hidden;margin-bottom:14px">
      <div style="padding:14px 13px;font-size:11.5px;color:#6B7280">이번 주에 그룹 수업을 듣는 학생이 없어.</div>${footer}
    </div>`;
  }

  // 남은 과목 수로는 정렬하지 않는다. 그러면 한 과목 배정할 때마다 그 학생이 아래로 미끄러져서
  // 방금 누른 줄을 눈으로 다시 찾아야 한다. 줄은 제자리를 지키다가, 네 과목이 다 채워졌을 때만
  // 아래 「배정 완료」 묶음으로 내려간다.
  // 신규가 먼저 — 이번 주에 처음 오는 학생이라 시간표가 통째로 비어 있다.
  const sorted = [...rows].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)
    || a.student.id - b.student.id);
  const todo = sorted.filter(row => row.missing > 0);
  const doneRows = sorted.filter(row => row.missing === 0);

  const todoBlock = todo.length
    ? todo.map(row => scaStudentBoardRow(row, false)).join('')
    : '<div style="padding:13px;font-size:11px;font-weight:700;color:#047857;background:#F0FDF4">이번 주 학생 전원이 반에 들어갔어.</div>';

  const doneNames = doneRows.map(row => lessonEsc(row.student.nick || row.student.name)).join(' · ');
  const doneBlock = doneRows.length
    ? `<div style="border-bottom:1px solid #F3F4F6;background:#FCFCFD">
        <button onclick="toggleScaDoneRows()" style="width:100%;display:flex;align-items:center;gap:8px;padding:9px 13px;border:0;background:none;cursor:pointer;text-align:left">
          <span style="flex:0 0 auto;font-size:9.5px;font-weight:800;border-radius:999px;padding:2px 7px;color:#047857;background:#ECFDF5">✓ ${doneRows.length}</span>
          <b style="flex:0 0 auto;font-size:11px;color:#047857">배정 완료</b>
          <span style="flex:1 1 auto;min-width:0;font-size:9.5px;color:#9CA3AF;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${doneNames}</span>
          <span style="flex:0 0 auto;font-size:10px;font-weight:700;color:#6B7280">${_scaDoneOpen ? '접기 ▲' : '펼치기 ▼'}</span>
        </button>
        ${_scaDoneOpen ? doneRows.map(row => scaStudentBoardRow(row, true)).join('') : ''}
      </div>`
    : '';

  return `<div style="border:1px solid #E5E7EB;border-radius:11px;background:#fff;overflow:hidden;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 12px;border-bottom:1px solid #E5E7EB;background:#F9FAFB">
      <b style="font-size:11.5px;color:#111827">그룹 수업 배정</b>
      ${todo.length
        ? `<span style="font-size:10.5px;font-weight:700;color:#B45309">${rows.length}명 중 ${todo.length}명 남음</span>`
        : `<span style="font-size:10.5px;font-weight:700;color:#047857">${rows.length}명 전부 반에 들어갔어</span>`}
      <span style="margin-left:auto;display:inline-flex;align-items:center;gap:9px;font-size:9.5px;color:#8A90A2;flex-wrap:wrap">
        <span><b style="color:#DC2626">빨강</b> 반 없음</span>
        <span><b style="color:#B45309">노랑</b> 반은 있고 시간 미정</span>
        <span><b style="color:#6B7280">회색</b> 확정 — 누르면 반 변경</span>
      </span>
    </div>
    ${todoBlock}${doneBlock}${footer}
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// 그룹 수업 목록 — 레벨로 끊고, 레벨마다 「아직 없는 반」을 위에, 「있는 반」을 아래에 둔다.
//
// 규칙 하나: 반 하나 = 줄 하나. 어디에도 두 번 나오지 않는다.
// 통합 레벨 반은 두 레벨에 걸쳐 있어서 레벨 섹션에 넣으면 같은 반의 버튼이 화면에 두 개 생긴다.
// 그래서 맨 아래 「통합 레벨」 섹션에 한 번만 세우고, 레벨 머리에는 「통합 N개 공유」만 적는다.
//
// 예전엔 이 목록과 「레벨별 수요」 표가 따로 있었다. 수요표는 학생 수요로 줄을 만들기 때문에
// 학생이 아직 없는 반은 표에서 통째로 사라졌다 — 반부터 먼저 여는 흐름과 정면으로 부딪혔다.
// 그래서 수요표가 하던 일(생성 필요 +N)만 이 목록 안으로 들어왔다.
// ─────────────────────────────────────────────────────────────
function isGroupScheduled(group) {
  return Boolean(group.teacherId != null && group.roomId != null
    && Array.isArray(group.periods) && group.periods.length);
}

function getGroupFirstPeriod(group) {
  const periods = Array.isArray(group.periods) ? group.periods.map(Number) : [];
  return periods.length ? Math.min(...periods) : 99;
}

// 미정인 반이 위로, 그다음 교시 순. 섹션 안에서 손댈 줄이 먼저 눈에 들어오게.
function sortScaGroupRows(groups) {
  return [...groups].sort((a, b) => (isGroupScheduled(a) ? 1 : 0) - (isGroupScheduled(b) ? 1 : 0)
    || getGroupFirstPeriod(a) - getGroupFirstPeriod(b)
    || getGroupTypeRank(a.classType) - getGroupTypeRank(b.classType)
    || a.id - b.id);
}

const SCA_LIST_CELL = 'padding:9px 11px;border-bottom:1px solid #F3F4F6;font-size:11.5px;color:#4B5563;vertical-align:top';

// 유형 열을 없애고 과목 옆 태그로 옮겼다. 이 화면의 유형 표기는 여기 하나로만 만든다 —
// 「소그룹 (1:4)」. 이름만 쓰면 정원이 안 보이고, 코드만 쓰면 소/중이 안 갈려서 둘을 같이 적는다.
// 예전엔 반 줄은 「소그룹」, 아직 없는 반 줄은 「1:8」로 자리마다 표기가 달랐다.
function scaTypeTagHtml(classType) {
  const { bg, ink } = getGroupTypeTagColors(classType);
  const label = `${getGroupSizeShortLabel(classType)} (${classType})`;
  return `<span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:5px;background:${bg};color:${ink};font-size:9.5px;font-weight:700;vertical-align:1px;white-space:nowrap">${lessonEsc(label)}</span>`;
}

function renderScaLevelHeaderRow(title, meta, urgent) {
  return `<tr><td colspan="4" style="padding:8px 14px;background:${urgent ? '#FFFBEB' : '#F3F4F6'};border-top:1px solid #E5E7EB;border-bottom:1px solid #E5E7EB">
    <b style="font-size:11.5px;color:#111827">${lessonEsc(title)}</b>
    <span style="margin-left:8px;font-size:10.5px;color:${urgent ? '#B45309' : '#8A90A2'};font-weight:${urgent ? 700 : 400}">${meta.map(lessonEsc).join(' · ')}</span>
  </td></tr>`;
}

// 아직 열지 않은 반. 대기 인원이 있는데 자리가 모자란 만큼만 나온다.
function renderScaNeedRow(row) {
  return `<tr style="background:#FFFDF7">
    <td style="${SCA_LIST_CELL}"><b style="font-size:12px;color:#B45309">＋ ${lessonEsc(row.subjectName)}</b>${scaTypeTagHtml(row.classType)}<div style="font-size:10px;color:#C08A2E;margin-top:2px">아직 없는 반${row.additionalGroups > 1 ? ` · ${row.additionalGroups}개 필요` : ''}</div></td>
    <td style="${SCA_LIST_CELL};white-space:nowrap;color:#B45309;font-weight:700">대기 ${row.waitingCount}명</td>
    <td style="${SCA_LIST_CELL}"><span style="display:inline-block;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;background:#FEF3C7;color:#B45309">반 없음</span></td>
    <td style="${SCA_LIST_CELL};text-align:right;white-space:nowrap">
      <button class="tsa-btn tsa-btn-xs tsa-btn-primary" style="white-space:nowrap" onclick="createGroupForDemand('${lessonEsc(row.subjectId)}','${lessonEsc(row.classType)}',${row.levelGroup})">만들기</button>
    </td>
  </tr>`;
}

// 같은 과목에 반이 둘 이상일 때만 얹는 머리줄. 합계와 「반 추가」가 여기 산다.
// 반이 하나뿐인 과목은 머리줄 없이 예전처럼 한 줄이다 — 대부분의 과목이 그래서,
// 무조건 머리줄을 세우면 스물한 줄이 마흔한 줄이 된다.
function renderScaSubjectHeadRow(items) {
  const first = items[0];
  const seats = items.reduce((sum, group) => sum + (group.studentIds || []).length, 0);
  const caps = items.reduce((sum, group) => sum + getGroupBaseCapacityFor(group), 0);
  const subjectId = getGroupSubjectId(first);
  const level = getGroupLevelSet(first)[0];
  return `<tr><td colspan="4" style="padding:9px 11px 4px;border-bottom:0">
    <span style="display:inline-flex;align-items:center;gap:9px;flex-wrap:wrap">
      <b style="font-size:12px;color:#111827">${lessonEsc(getGroupSubjectNamesLabel(first))}</b>${scaTypeTagHtml(first.classType)}
      <span style="font-size:10.5px;font-weight:700;color:#B45309">반 ${items.length}개 · ${seats}/${caps}명</span>
      <button onclick="createGroupForDemand('${lessonEsc(subjectId)}','${lessonEsc(first.classType)}',${level})" style="border:0;background:none;padding:0;font-size:10px;font-weight:700;color:#5E5CE6;cursor:pointer">＋ 반 추가</button>
    </span>
  </td></tr>`;
}

// showLevel: 통합 레벨 섹션에서만 켠다(반 이름에 레벨 구간이 필요한 자리).
// slot: 같은 과목에 반이 여러 개일 때 붙는 A반·B반. 없으면 과목 이름이 그 자리에 온다.
function renderScaGroupRow(group, showLevel, slot, isLast) {
  const count = (group.studentIds || []).length;
  const capacity = getGroupBaseCapacityFor(group);
  const teacher = MOCK_TEACHERS.find(item => item.id === Number(group.teacherId));
  const room = MOCK_CLASS_ROOMS.find(item => item.id === Number(group.roomId));
  const placed = isGroupScheduled(group)
    ? `<b style="color:#111827">${group.periods.map(Number).sort((a, b) => a - b).join('·')}교시</b> · ${lessonEsc(teacher?.nick || teacher?.name || '-')} · ${lessonEsc(room?.roomNo || '-')}`
    : '<span style="display:inline-block;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;background:#FFFBEB;color:#B45309">미정</span>';

  // 반 이름과 인원이 그룹 상세(소속 학생) 팝업의 입구다.
  const openDetail = `onclick="openActiveGroupDetail(${group.id})" title="이 반 학생 보기"`;
  const nameCell = slot
    ? `<span style="display:inline-block;padding-left:15px;border-left:2px solid #E5E7EB;margin-left:3px">
        <button ${openDetail} style="border:0;background:none;padding:0;font-size:11.5px;font-weight:800;color:#4B5563;cursor:pointer">${lessonEsc(slot)}</button>
      </span>`
    // 과정(Regular · Junior ESL …)은 여기서 뺐다. 레벨 섹션 안에서는 대개 같은 값이라
    // 줄마다 반복되기만 하고, 반의 과정은 「수정」 팝업과 반 상세에서 볼 수 있다.
    //
    // 통합 레벨 줄은 이름 앞에 레벨 구간이 필요하다. getGroupDisplayName 은 끝에 「소그룹」을
    // 덧붙여서 그대로 쓰면 유형이 두 번 나오니, 이름만 직접 짓고 유형은 아래 태그 하나로 통일한다.
    : `<button ${openDetail} style="border:0;background:none;padding:0;text-align:left;cursor:pointer">
        <b style="font-size:12px;color:#111827">${lessonEsc(showLevel
          ? `${getGroupLevelSetLabel(group)} · ${getGroupSubjectNamesLabel(group)}`
          : getGroupSubjectNamesLabel(group))}</b>
      </button>${scaTypeTagHtml(group.classType)}`;

  return `<tr>
    <td style="${SCA_LIST_CELL}${isLast === false ? ';border-bottom-color:transparent' : ''}">${nameCell}</td>
    <td style="${SCA_LIST_CELL}${isLast === false ? ';border-bottom-color:transparent' : ''};white-space:nowrap">
      <button ${openDetail} style="border:0;border-bottom:1px dashed #C4C9D4;background:none;padding:0 0 1px;font-size:11.5px;font-weight:${count > capacity ? 700 : 400};color:${count > capacity ? '#B45309' : '#4B5563'};cursor:pointer">${count}/${capacity}명</button>
    </td>
    <td style="${SCA_LIST_CELL}${isLast === false ? ';border-bottom-color:transparent' : ''}">${placed}</td>
    <td style="${SCA_LIST_CELL}${isLast === false ? ';border-bottom-color:transparent' : ''};text-align:right;white-space:nowrap">
      <button class="tsa-btn tsa-btn-xs ${isGroupScheduled(group) ? 'tsa-btn-outline' : 'tsa-btn-primary'}" style="white-space:nowrap" onclick="openTeacherAssignModal(${group.id}${_scaPeriodFocus != null && !isGroupScheduled(group) ? `,${_scaPeriodFocus}` : ''})">${isGroupScheduled(group) ? '강사 변경' : '강사 배정'}</button>
      <button class="tsa-btn tsa-btn-xs tsa-btn-outline" style="white-space:nowrap;margin-left:4px" onclick="openGroupEditBrowserPopup(${group.id})">수정</button>
    </td>
  </tr>`;
}

// 레벨 안에서 과목·유형으로 묶는다. 묶인 줄 자체가 「여기 반이 여러 개」라는 신호다.
function buildScaSubjectBuckets(groups) {
  const buckets = [];
  sortScaGroupRows(groups).forEach(group => {
    const key = `${getGroupSubjectId(group)}|${group.classType}`;
    const found = buckets.find(bucket => bucket.key === key);
    if (found) found.items.push(group);
    else buckets.push({ key, items: [group] });
  });
  return buckets;
}

const SCA_SLOT_LETTERS = 'ABCDEFGH';

function renderScaSubjectBuckets(groups, showLevel) {
  return buildScaSubjectBuckets(groups).map(bucket => {
    if (bucket.items.length === 1) return renderScaGroupRow(bucket.items[0], showLevel, '', true);
    return renderScaSubjectHeadRow(bucket.items)
      + bucket.items.map((group, index) => renderScaGroupRow(
        group, showLevel, `${SCA_SLOT_LETTERS[index] || index + 1}반`, index === bucket.items.length - 1
      )).join('');
  }).join('');
}

function renderScaGroupClassList() {
  const focus = _scaPeriodFocus;
  // 교시를 고르면 그 교시에 걸린 반과, 아직 시간이 없어 그 자리에 넣을 수 있는 반만 남긴다.
  // 다른 교시에 이미 앉은 반은 지금 할 일이 아니다.
  const active = MOCK_GROUP_CLASSES.filter(group => group.status === 'active'
    && (focus == null || !isGroupScheduled(group) || (group.periods || []).map(Number).includes(focus)));
  const mergedGroups = active.filter(isMergedLevelGroup);
  const mergedIds = new Set(mergedGroups.map(group => group.id));
  const needs = buildCsGroupDemandRows().filter(row => row.additionalGroups > 0);
  const levels = [...MOCK_MASTER_LEVELS].filter(level => level.visible !== false).sort((a, b) => a.order - b.order);
  const newCount = needs.reduce((sum, row) => sum + row.additionalGroups, 0);
  const pending = active.filter(group => !isGroupScheduled(group)).length;

  const emptyRow = '<tr><td colspan="4" style="padding:11px 14px;font-size:10.5px;color:#C4C9D4">이 레벨은 반도 대기도 없어.</td></tr>';

  const sections = levels.map(level => {
    const groups = active.filter(group => !mergedIds.has(group.id) && getGroupLevelSet(group).includes(level.order));
    const levelNeeds = needs.filter(row => row.levelGroup === level.order);
    const shared = mergedGroups.filter(group => getGroupLevelSet(group).includes(level.order)).length;
    const waiting = levelNeeds.reduce((sum, row) => sum + row.waitingCount, 0);
    const extra = levelNeeds.reduce((sum, row) => sum + row.additionalGroups, 0);
    const meta = [
      `반 ${groups.length}개`,
      shared ? `통합 ${shared}개 공유` : '',
      waiting ? `대기 ${waiting}명` : '',
      extra ? `필요 +${extra}` : ''
    ].filter(Boolean);
    const body = levelNeeds.map(renderScaNeedRow).join('') + renderScaSubjectBuckets(groups, false);
    return renderScaLevelHeaderRow(getLevelGroupName(level.order), meta, Boolean(extra)) + (body || emptyRow);
  }).join('');

  // 통합 레벨은 맨 아래 한 섹션. 여기서만 반 이름에 레벨 구간을 함께 적는다.
  const mergedSection = mergedGroups.length
    ? renderScaLevelHeaderRow('통합 레벨', [`반 ${mergedGroups.length}개`, '레벨 두 개가 함께 쓰는 반'], false)
      + renderScaSubjectBuckets(mergedGroups, true)
    : '';

  const head = ['과목 · 반', '인원', '교시 · 강사 · 강의실', '동작'].map((label, index) =>
    `<th style="text-align:${index === 3 ? 'right' : 'left'};padding:7px 11px;font-size:10px;color:#9CA3AF;font-weight:800;border-bottom:1px solid #E5E7EB">${label}</th>`
  ).join('');

  return `<div style="border:1px solid #E5E7EB;border-radius:12px;background:#fff;overflow:hidden">
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:11px 13px;border-bottom:1px solid #E5E7EB;background:#F9FAFB">
      ${focus != null
        ? `<b style="font-size:11.5px;color:#4338CA">${focus}교시</b>
           <span style="font-size:10.5px;color:#6B7280">이 교시 반과 시간 미정인 반 ${active.length}개</span>
           <button onclick="setScaPeriodFocus(${focus})" style="border:1px solid #D1D5DB;border-radius:7px;padding:3px 9px;background:#fff;color:#4B5563;font-size:10px;font-weight:700;cursor:pointer">전체 보기</button>`
        : `<b style="font-size:11.5px;color:#111827">그룹 수업 ${active.length}개</b>`}
      ${newCount ? `<span style="font-size:10.5px;font-weight:700;color:#B45309">새로 열 반 ${newCount}개</span>` : ''}
      ${pending ? `<span style="font-size:10.5px;font-weight:700;color:#B45309">배정 미정 ${pending}개</span>` : '<span style="font-size:10.5px;font-weight:700;color:#047857">전부 배정 완료</span>'}
      <span style="font-size:9.5px;color:#9CA3AF">반 이름이나 인원을 누르면 소속 학생이 나와</span>
      <button onclick="openGroupCreateFromScaList()" style="margin-left:auto;border:0;border-radius:8px;padding:6px 13px;background:#5E5CE6;color:#fff;font-size:10.5px;font-weight:700;cursor:pointer">＋ 그룹 수업 만들기</button>
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:660px;table-layout:fixed">
        <colgroup><col style="width:32%"><col style="width:13%"><col style="width:29%"><col style="width:26%"></colgroup>
        <thead><tr>${head}</tr></thead>
        <tbody>${sections}${mergedSection}</tbody>
      </table>
    </div>
  </div>`;
}

// 학생과 무관하게 빈 반부터 만드는 입구. 학생 쪽 팝업의 「＋ 새 반 만들기」와 같은 팝업을 연다 —
// 저쪽은 그 학생의 과목·레벨·유형이 채워진 채로, 이쪽은 빈 채로 열릴 뿐이다.
function openGroupCreateFromScaList() {
  openGroupCreateBrowserPopup([], '1:4', null);
}

// 「아직 없는 반」 줄의 만들기. 그 줄이 이미 과목·유형·레벨을 들고 있으니 그대로 채워 연다.
function createGroupForDemand(subjectId, classType, levelGroup) {
  openGroupCreateBrowserPopup([{ id: subjectId, hours: 1 }], classType, Number(levelGroup));
}

// 1단계 = 위쪽 학생 목록 + 아래쪽 그룹 수업 목록. 둘로 끝난다.
// ─────────────────────────────────────────────────────────────
// 교시별 현황 — 1단계 맨 위.
//
// 그룹 강의실은 아홉 개뿐이다(소그룹 다섯, 중그룹 넷). 강사는 어느 교시든 스물넷 넘게 비어
// 있어서 병목이 아니고, 자리를 좌우하는 건 늘 강의실이다. 그런데 어느 교시가 꽉 찼는지는
// 배정 팝업을 열어봐야 알 수 있었다 — 「빈 강의실이 없어」를 보고 나서야.
// 그래서 교시마다 몇 개가 돌아가고 몇 칸이 남았는지를 먼저 세워둔다.
// ─────────────────────────────────────────────────────────────
let _scaPeriodFocus = null; // 눌러서 고른 교시. 아래 그룹 수업 목록이 이 교시로 좁혀진다.

function getScaGroupRooms() {
  return MOCK_CLASS_ROOMS.filter(room => room.roomNo && room.status === 'active' && ['1:4', '1:8'].includes(room.type));
}

// 한 교시의 그림. 강의실은 「이 방이 이 교시에 잡혀 있나」로 세고, 1:1 주간 세션이 잡아둔
// 방도 쓴 것으로 친다 — 그룹을 넣으려 하면 똑같이 막히는 자리라서.
function getScaPeriodStatus(period) {
  const groups = MOCK_GROUP_CLASSES.filter(group => group.status === 'active'
    && (group.periods || []).map(Number).includes(period));
  const rooms = getScaGroupRooms();
  const busy = new Set(groups.map(group => Number(group.roomId)).filter(Number.isFinite));
  const count = type => {
    const list = rooms.filter(room => room.type === type);
    const used = list.filter(room => busy.has(room.id)
      || getRoomSessionBusyDays(room.id, period).length).length;
    return { used, total: list.length, free: list.length - used };
  };
  return {
    period,
    groups,
    small: count('1:4'),
    large: count('1:8'),
    seats: groups.reduce((sum, group) => sum + (group.studentIds || []).length, 0),
    capacity: groups.reduce((sum, group) => sum + getGroupBaseCapacityFor(group), 0)
  };
}

function setScaPeriodFocus(period) {
  const next = Number(period);
  _scaPeriodFocus = _scaPeriodFocus === next ? null : next;
  renderScaStep1Board();
}

// 남은 칸을 네모로 그린다. 숫자만 적으면 「1/5」와 「4/5」가 훑을 때 안 갈린다.
function scaRoomPips(stat, tone) {
  if (!stat.total) return '<span style="font-size:9.5px;color:#C4C9D4">—</span>';
  const pip = on => `<span style="display:inline-block;width:7px;height:7px;border-radius:2px;margin-right:2px;background:${on ? tone : '#E5E7EB'}"></span>`;
  return Array.from({ length: stat.total }, (unused, index) => pip(index < stat.used)).join('');
}

function renderScaPeriodBoard() {
  const total = getScaTotalPeriods();
  const stats = [];
  for (let period = 1; period <= total; period += 1) stats.push(getScaPeriodStatus(period));
  const running = stats.reduce((sum, stat) => sum + stat.groups.length, 0);
  const active = MOCK_GROUP_CLASSES.filter(group => group.status === 'active');
  const unplaced = active.filter(group => !isGroupScheduled(group)).length;
  // 수업이 아예 없고 앞으로도 볼 일 없는 교시가 뒤에 길게 남는다. 쓰는 구간만 세우되
  // 양옆 한 칸씩은 남겨둔다 — 옆 교시로 밀 수 있는지 보이게.
  const used = stats.filter(stat => stat.groups.length).map(stat => stat.period);
  const from = used.length ? Math.max(1, Math.min(...used) - 1) : 1;
  const to = used.length ? Math.min(total, Math.max(...used) + 1) : total;
  const shown = stats.filter(stat => stat.period >= from && stat.period <= to);

  const cells = shown.map(stat => {
    const on = _scaPeriodFocus === stat.period;
    const tight = (stat.small.free === 0 && stat.small.total) || (stat.large.free === 0 && stat.large.total)
      ? false // 아예 없는 건 아래 warn 에서 따로 본다
      : (stat.small.free <= 1 || stat.large.free <= 1);
    const fullSmall = stat.small.total && !stat.small.free;
    const fullLarge = stat.large.total && !stat.large.free;
    const warn = tight || fullSmall || fullLarge;
    const bell = (typeof getBellPeriods === 'function' ? getBellPeriods() : []).find(item => Number(item.period) === stat.period);
    return `<button onclick="setScaPeriodFocus(${stat.period})" title="${lessonEsc(bell ? `${bell.start} ~ ${bell.end}` : '')}" style="flex:1 1 82px;min-width:82px;text-align:left;border:1px solid ${on ? '#5E5CE6' : '#E5E7EB'};border-radius:10px;background:${on ? '#F5F3FF' : (stat.groups.length ? '#fff' : '#FCFCFD')};padding:8px 9px;cursor:pointer">
      <span style="display:flex;align-items:baseline;gap:5px">
        <b style="font-size:11.5px;color:${on ? '#4338CA' : '#111827'}">${stat.period}교시</b>
        <span style="font-size:9.5px;color:#9CA3AF">${stat.groups.length ? `${stat.groups.length}개` : '없음'}</span>
      </span>
      <span style="display:block;margin-top:6px;line-height:1">${scaRoomPips(stat.small, '#4F46E5')}</span>
      <span style="display:block;margin-top:3px;line-height:1">${scaRoomPips(stat.large, '#059669')}</span>
      <span style="display:block;margin-top:6px;font-size:9px;font-weight:700;color:${warn ? '#B45309' : '#9CA3AF'}">${
        stat.small.total || stat.large.total
          ? `소 ${stat.small.free} · 중 ${stat.large.free} 남음`
          : '강의실 없음'
      }</span>
    </button>`;
  }).join('');

  return `<div style="border:1px solid #E5E7EB;border-radius:11px;background:#fff;overflow:hidden;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 12px;border-bottom:1px solid #E5E7EB;background:#F9FAFB">
      <b style="font-size:11.5px;color:#111827">교시별 현황</b>
      <span style="font-size:10.5px;color:#6B7280">진행 중 <b style="color:#111827">${running}개</b></span>
      ${unplaced ? `<span style="font-size:10.5px;font-weight:700;color:#B45309">시간 미정 ${unplaced}개</span>` : ''}
      <span style="margin-left:auto;display:inline-flex;align-items:center;gap:10px;font-size:9.5px;color:#8A90A2">
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#4F46E5;margin-right:3px"></span>소그룹실 ${getScaGroupRooms().filter(room => room.type === '1:4').length}개</span>
        <span><span style="display:inline-block;width:7px;height:7px;border-radius:2px;background:#059669;margin-right:3px"></span>중그룹실 ${getScaGroupRooms().filter(room => room.type === '1:8').length}개</span>
        <span>칸을 누르면 아래 목록이 그 교시로 좁혀져</span>
      </span>
    </div>
    <div style="display:flex;gap:7px;flex-wrap:wrap;padding:11px 12px">${cells}</div>
  </div>`;
}

// ─────────────────────────────────────────────────────────────
// 시간표 배정 — 학생을 A조·B조에 넣는 자리.
//
// 반 배정보다 먼저다. 조가 정해져야 그 학생의 5교시가 몇 시인지 정해지고,
// 그래야 어느 반에 넣을 수 있는지도 정해진다. 그래서 1단계 맨 위에 둔다.
// ─────────────────────────────────────────────────────────────
function getScaWeekTimetableRows() {
  const students = typeof getScaWeekStudents === 'function' ? getScaWeekStudents() : [];
  const arrivals = new Set((typeof getScaWeekArrivals === 'function' ? getScaWeekArrivals() : []).map(student => student.id));
  return students.map(student => ({
    student,
    timetable: getTimetableById(student.timetableId),
    isNew: arrivals.has(student.id)
  }));
}

// 과정이 기본 조를 들고 있으면 그걸 쓰고, 없으면 기본 시간표로 간다.
function getStudentDefaultTimetableId(student) {
  const course = MOCK_COURSES.find(item => item.name === student?.course);
  if (course?.defaultTimetableId && getTimetableById(course.defaultTimetableId)) return course.defaultTimetableId;
  return getDefaultTimetable()?.id || null;
}

function assignStudentTimetable(studentId, timetableId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  const timetable = getTimetableById(timetableId);
  if (!student || !timetable) return;
  student.timetableId = timetable.id;
  showToast(`✓ ${student.nick || student.name} 학생을 ${timetable.name}에 넣었어.`, 'success');
  renderStudentClassAssignView();
}

// 배정된 칩을 누르면 다음 시간표로 넘어간다. 조가 둘뿐이라 A ↔ B가 한 번에 바뀐다.
function cycleStudentTimetable(studentId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  if (!student) return;
  const list = getTimetables().filter(item => item.active !== false);
  if (!list.length) return;
  const index = list.findIndex(item => item.id === student.timetableId);
  assignStudentTimetable(student.id, list[(index + 1) % list.length].id);
}

function assignAllWaitingTimetable(timetableId) {
  const timetable = getTimetableById(timetableId);
  if (!timetable) return;
  const waiting = getScaWeekTimetableRows().filter(row => !row.timetable);
  if (!waiting.length) return;
  if (!window.confirm(`대기 ${waiting.length}명을 전부 ${timetable.name}에 넣을까?`)) return;
  waiting.forEach(row => { row.student.timetableId = timetable.id; });
  showToast(`✓ ${waiting.length}명을 ${timetable.name}에 넣었어.`, 'success');
  renderStudentClassAssignView();
}

function timetableCodeChip(timetable, extra) {
  if (!timetable) return `<span style="display:inline-block;font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:6px;background:#FEE2E2;color:#DC2626;${extra || ''}">대기</span>`;
  return `<span title="${lessonEsc(timetable.name)}" style="display:inline-block;font-size:9.5px;font-weight:800;padding:2px 7px;border-radius:6px;background:#EEF2FF;color:#4338CA;${extra || ''}">${lessonEsc(timetable.code || timetable.name)}</span>`;
}

function renderScaTimetableBoard() {
  ensureStudentTimetableSeed();
  const rows = getScaWeekTimetableRows();
  const list = getTimetables().filter(item => item.active !== false);
  if (!list.length || !rows.length) return '';
  const waiting = rows.filter(row => !row.timetable);

  const counts = list.map(timetable => {
    const count = rows.filter(row => row.timetable?.id === timetable.id).length;
    const periods = timetable.periods || [];
    const noon = periods.find(row => Number(row.order) === 5);
    return `<span style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid #E5E7EB;border-radius:9px;background:#fff">
      ${timetableCodeChip(timetable)}
      <b style="font-size:11px;color:#111827">${count}명</b>
      <span style="font-size:9.5px;color:#9CA3AF">점심 ${lessonEsc(timetable.lunch?.start || '-')}${noon ? ` · 5교시 ${lessonEsc(noon.start)}` : ''}</span>
    </span>`;
  }).join('');

  // 대기 학생만 줄로 세운다. 이미 조가 있는 학생은 아래 「그룹 수업 배정」 줄의 칩에서 바꾼다 —
  // 여기까지 전원을 늘어놓으면 같은 명단이 화면에 두 번 나온다.
  const waitingHtml = waiting.length
    ? `<div style="display:flex;flex-wrap:wrap;gap:6px;padding:10px 12px">
        ${waiting.map(row => `<span style="display:inline-flex;align-items:center;gap:6px;padding:4px 5px 4px 9px;border:1px dashed #FCA5A5;border-radius:999px;background:#FEF2F2">
          <b style="font-size:10.5px;color:#B91C1C">${lessonEsc(row.student.nick || row.student.name)}</b>
          ${row.isNew ? '<span style="font-size:8.5px;font-weight:800;padding:1px 5px;border-radius:999px;background:#ECFDF5;color:#047857">신규</span>' : ''}
          <span style="font-size:9.5px;color:#9CA3AF">${lessonEsc(row.student.course || '-')}</span>
          ${list.map(timetable => `<button onclick="assignStudentTimetable(${row.student.id},'${lessonEsc(timetable.id)}')" title="${lessonEsc(timetable.name)}로 배정" style="border:0;border-radius:6px;padding:2px 7px;background:#4338CA;color:#fff;font-size:9.5px;font-weight:800;cursor:pointer">${lessonEsc(timetable.code || timetable.name)}</button>`).join('')}
        </span>`).join('')}
      </div>`
    : '<div style="padding:10px 12px;font-size:11px;font-weight:700;color:#047857;background:#F0FDF4">이번 주 학생 전원이 시간표를 받았어.</div>';

  return `<div style="border:1px solid #E5E7EB;border-radius:11px;background:#fff;overflow:hidden;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 12px;border-bottom:1px solid #E5E7EB;background:#F9FAFB">
      <b style="font-size:11.5px;color:#111827">시간표 배정</b>
      ${waiting.length
        ? `<span style="font-size:10.5px;font-weight:700;color:#DC2626">대기 ${waiting.length}명</span>`
        : '<span style="font-size:10.5px;font-weight:700;color:#047857">전원 배정</span>'}
      <span style="display:inline-flex;gap:6px;flex-wrap:wrap;margin-left:6px">${counts}</span>
      ${waiting.length ? `<span style="margin-left:auto;display:inline-flex;gap:5px">${list.map(timetable =>
        `<button onclick="assignAllWaitingTimetable('${lessonEsc(timetable.id)}')" style="border:1px solid #D1D5DB;border-radius:7px;padding:4px 10px;background:#fff;color:#4B5563;font-size:10px;font-weight:700;cursor:pointer">대기 전부 ${lessonEsc(timetable.code || timetable.name)}조</button>`).join('')}</span>` : ''}
    </div>
    ${waitingHtml}
  </div>`;
}

// 데모 시드: 과정으로 조를 나누되, 이번 주 신규 학생은 아직 조가 없는 상태로 둔다.
// 실제로도 도착 직후에 정해지는 값이라 「대기」가 어떻게 보이는지 화면에 남는다.
// 데모 시드: 다니고 있는 학생은 과정으로 조를 나누고, 아직 입학 대기인 학생은 조를 비워둔다.
// 실제로도 조는 도착해서 정해지는 값이라, 그 학생이 등록되는 주로 넘기면 「대기」로 올라온다.
function ensureStudentTimetableSeed() {
  if (window.__tsaTimetableSeeded) return;
  if (typeof MOCK_STUDENTS === 'undefined' || typeof MOCK_TIMETABLES === 'undefined') return;
  window.__tsaTimetableSeeded = true;
  MOCK_STUDENTS.forEach(student => {
    if (student.timetableId) return;
    if (student.status === 'waiting') { student.timetableId = null; return; }
    student.timetableId = student.course === 'Junior ESL' ? 'TT_B' : getDefaultTimetable()?.id || null;
  });
}

function renderScaStep1Board() {
  const panel = document.getElementById('sca-panel-step1');
  if (!panel) return;
  panel.innerHTML = renderScaTimetableBoard() + renderScaPeriodBoard()
    + renderScaStudentBoard() + renderScaGroupClassList();
}
let _scaOnePick = null; // { studentId, sequence, subjectId } — 지금 고른 1:1 수업

function getScaOneToOnePending() {
  const pending = [];
  getScaWeekStudents().forEach(student => {
    getStudentLessonRequirements(student).forEach(requirement => {
      if (requirement.classType !== '1:1' || requirement.status === 'ASSIGNED') return;
      pending.push({ student, requirement });
    });
  });
  return pending;
}

// 1:1을 맡을 수 있는 강사. 담당 강의실이 없으면 배정 자체가 안 되니 빼둔다.
function getScaOneToOneTeachers() {
  // 1:1을 받을 수 있는 강사(담당 강의실이 있어야 배정된다)와, 그룹을 맡고 있는 강사를 함께 세운다.
  // 그룹만 맡는 강사도 줄이 있어야 이 표 하나로 강사별 주간 시간표가 된다.
  const groupTeacherIds = new Set(MOCK_GROUP_CLASSES
    .filter(group => group.status === 'active' && group.teacherId != null && Array.isArray(group.periods) && group.periods.length)
    .map(group => group.teacherId));
  return MOCK_TEACHERS.filter(teacher => {
    if (teacher.status === 'resigned') return false;
    const canTakeOneToOne = (teacher.classTypes || []).includes('1:1') && teacher.room;
    return canTakeOneToOne || groupTeacherIds.has(teacher.id);
  });
}

// 1:1을 받을 수 있는 강사인지. 방이 없으면 배정 자체가 막힌다.
function canTeacherTakeOneToOne(teacher) {
  return Boolean(teacher && (teacher.classTypes || []).includes('1:1') && teacher.room);
}

// 그 강사가 그 교시에 이미 맡고 있는 1:1
function findOneToOneAt(teacherId, period) {
  const target = Number(period);
  for (const student of MOCK_STUDENTS) {
    const entry = (student.oneToOneSchedule || []).find(item =>
      Number(item.teacherId) === Number(teacherId) && Number(item.period) === target
    );
    if (entry) return { student, entry };
  }
  return null;
}

// 칸 하나의 상태. 왜 못 놓는지까지 같이 돌려준다 — 이유가 보여야 다음에 뭘 할지 정해진다.
function getScaOneToOneCellState(teacher, period, pick) {
  const taken = findOneToOneAt(teacher.id, period);
  if (taken) return { kind: 'taken', taken };
  if (!LESSON_DAYS.every(day => lessonTeacherAvailableAt(teacher, day, period))) {
    return { kind: 'locked', reason: '근무 아님' };
  }
  const groupClass = MOCK_GROUP_CLASSES.find(group =>
    group.status === 'active' && group.teacherId === teacher.id &&
    Array.isArray(group.periods) && group.periods.map(Number).includes(Number(period))
  );
  if (groupClass) return { kind: 'group', group: groupClass };
  if (!canTeacherTakeOneToOne(teacher)) return { kind: 'locked', reason: '1:1 담당 아님' };
  if (!pick) return { kind: 'free' };
  const student = MOCK_STUDENTS.find(item => item.id === pick.studentId);
  if (!student) return { kind: 'free' };
  if (!isStudentFreeAtPeriod(student, period, pick.sequence)) {
    return { kind: 'blocked', reason: '학생이 이 교시에 다른 수업' };
  }
  return { kind: 'open' };
}

function pickScaOneToOne(studentId, sequence) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  if (!student) return;
  const requirement = getStudentLessonRequirements(student).find(item => item.sequence === Number(sequence));
  if (!requirement) return;
  const same = _scaOnePick && _scaOnePick.studentId === student.id && _scaOnePick.sequence === Number(sequence);
  _scaOnePick = same ? null : { studentId: student.id, sequence: Number(sequence), subjectId: requirement.subjectId };
  renderScaStep3Board();
}

function assignScaOneToOne(teacherId, period) {
  if (!_scaOnePick) {
    showToast('위에서 배정할 1:1 수업을 먼저 골라줘.', 'warning');
    return;
  }
  const result = saveStudentOneToOneSchedule(_scaOnePick.studentId, _scaOnePick.subjectId, teacherId, period, _scaOnePick.sequence);
  showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
  if (result.ok) _scaOnePick = null;
  renderStudentClassAssignView();
}

function unassignScaOneToOne(studentId, sequence, subjectId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  if (!student) return;
  if (!window.confirm(`${student.nick || student.name} 학생의 1:1 배정을 취소할까?\n수업은 없어지지 않고 위 「아직 못 붙인 1:1」로 돌아가.`)) return;
  unassignStudentOneToOne(student.id, subjectId, sequence);
  showToast(`${student.nick || student.name} 학생의 1:1 배정을 취소했어.`, 'success');
  renderStudentClassAssignView();
}

// 3단계 자동 배정 — 남은 1:1을 빈 자리에 알아서 끼운다.
//
// 그룹이 이미 앉아 있으니 여기서는 "그 교시에 비는 강사"만 찾으면 된다.
// 한 강사는 여러 학생을 맡을 수 있다. 한 사람에게 하루를 통째로 몰아주면
// 그 강사가 다른 학생을 못 받으니, 수업이 적은 강사부터 채워 골고루 퍼뜨린다.
function runScaStep3AutoAssign() {
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  const pending = getScaOneToOnePending();
  if (!pending.length) {
    showToast('아직 못 붙인 1:1이 없어. 다 배정돼 있어.', 'info');
    return;
  }

  const teacherLoad = teacher => MOCK_STUDENTS.reduce((sum, student) =>
    sum + (student.oneToOneSchedule || []).filter(item => Number(item.teacherId) === teacher.id).length, 0);

  let placed = 0;
  const failed = [];

  pending.forEach(({ student, requirement }) => {
    let done = false;
    for (let period = 1; period <= totalPeriods && !done; period += 1) {
      if (!isStudentFreeAtPeriod(student, period, requirement.sequence)) continue;
      const free = getScaOneToOneTeachers().filter(teacher =>
        canTeacherTakeOneToOne(teacher) && getScaOneToOneCellState(teacher, period, null).kind === 'free'
      );
      if (!free.length) continue;
      free.sort((a, b) => teacherLoad(a) - teacherLoad(b) || a.id - b.id);
      const result = saveStudentOneToOneSchedule(student.id, requirement.subjectId, free[0].id, period, requirement.sequence);
      if (result.ok) { placed += 1; done = true; }
    }
    if (!done) failed.push(`${student.nick || student.name} · ${requirement.subjectName}`);
  });

  const parts = [`1:1 ${placed}건을 배정했어`];
  if (failed.length) parts.push(`${failed.length}건은 빈 자리가 없어 못 붙였어 — ${failed.slice(0, 2).join(' / ')}`);
  showToast(`${placed ? '✓ ' : ''}${parts.join('. ')}.`, failed.length ? 'warning' : 'success');
  _scaOnePick = null;
  renderStudentClassAssignView();
}
// ═════════════════════════════════════════════════════════════
// 전체 시간표 — 다 짜고 나서 확인하는 화면. 여기서는 배정하지 않는다.
//
// 강사별은 만들지 않는다. 3단계 표가 이미 강사 × 교시라 그 일을 겸한다.
// 여기서는 축이 다른 세 가지를 본다 —
// 학생별(시간표 뽑기), 강사별(누가 몇 교시 뛰는지), 강의실별(빈 방 찾기).
// ═════════════════════════════════════════════════════════════

let _scaScheduleView = 'student';

function setScaScheduleView(view) {
  _scaScheduleView = ['room', 'teacher'].includes(view) ? view : 'student';
  renderStudentClassAssignView();
}

// 이번 주에 실제로 열리는 수업을 교시 단위로 모두 편다.
// 그룹은 반 하나가 한 줄, 1:1은 학생 한 명이 한 줄이다.
function getScaWeekLessons() {
  const lessons = [];
  MOCK_GROUP_CLASSES.forEach(group => {
    if (group.status !== 'active') return;
    if (!Array.isArray(group.periods) || !group.periods.length) return;
    const teacher = group.teacherId != null ? MOCK_TEACHERS.find(item => item.id === group.teacherId) : null;
    const room = group.roomId != null ? MOCK_CLASS_ROOMS.find(item => item.id === group.roomId) : null;
    group.periods.map(Number).forEach(period => lessons.push({
      kind: 'group',
      period,
      groupId: group.id,
      title: getGroupDisplayName(group),
      teacherId: teacher ? teacher.id : null,
      teacherName: teacher ? (teacher.nick || teacher.name) : '강사 미정',
      roomNo: room ? room.roomNo : null,
      studentIds: [...(group.studentIds || [])],
      capacity: getGroupCapacityFor(group),
      merged: isMergedLevelGroup(group)
    }));
  });
  getScaWeekStudents().forEach(student => {
    (student.oneToOneSchedule || []).forEach(item => {
      if (item.period == null) return;
      const teacher = MOCK_TEACHERS.find(row => row.id === Number(item.teacherId));
      const subject = MOCK_MASTER_SUBJECTS.find(row => row.id === item.subjectId);
      lessons.push({
        kind: 'one',
        period: Number(item.period),
        title: `${student.nick || student.name} · ${subject?.name || item.subjectId}`,
        studentName: student.nick || student.name,
        subjectName: subject?.name || item.subjectId,
        teacherId: teacher ? teacher.id : null,
        teacherName: teacher ? (teacher.nick || teacher.name) : '강사 미정',
        roomNo: teacher?.room || null,
        studentIds: [student.id]
      });
    });
  });
  return lessons;
}

// 같은 시간에 두 번 잡힌 것. 다 짜고 난 뒤 마지막으로 훑는 용도다.
function getScaScheduleConflicts(lessons) {
  const conflicts = [];
  const bump = (map, key, lesson) => {
    if (key == null) return;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(lesson);
  };
  const teachers = new Map();
  const rooms = new Map();
  const students = new Map();
  lessons.forEach(lesson => {
    bump(teachers, lesson.teacherId != null ? `${lesson.teacherId}|${lesson.period}` : null, lesson);
    bump(rooms, lesson.roomNo ? `${lesson.roomNo}|${lesson.period}` : null, lesson);
    lesson.studentIds.forEach(id => bump(students, `${id}|${lesson.period}`, lesson));
  });
  const collect = (map, label, nameOf) => {
    map.forEach((list, key) => {
      if (list.length < 2) return;
      const period = key.split('|')[1];
      conflicts.push(`${label} ${nameOf(key, list)} — ${period}교시에 ${list.length}개`);
    });
  };
  collect(teachers, '강사', (key, list) => list[0].teacherName);
  collect(rooms, '강의실', key => key.split('|')[0]);
  collect(students, '학생', key => {
    const student = MOCK_STUDENTS.find(item => item.id === Number(key.split('|')[0]));
    return student ? (student.nick || student.name) : '?';
  });
  return conflicts;
}

function renderScaScheduleBoard() {
  const panel = document.getElementById('sca-panel-schedule');
  if (!panel) return;
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  const periods = Array.from({ length: totalPeriods }, (_, i) => i + 1);
  const lessons = getScaWeekLessons();
  const conflicts = getScaScheduleConflicts(lessons);
  const isRoom = _scaScheduleView === 'room';
  const isTeacher = _scaScheduleView === 'teacher';

  const tab = (view, label) => {
    const on = _scaScheduleView === view;
    return `<button onclick="setScaScheduleView('${view}')" style="border:1px solid ${on ? '#5E5CE6' : '#E5E7EB'};background:${on ? '#5E5CE6' : '#fff'};color:${on ? '#fff' : '#6B7280'};border-radius:8px;padding:6px 14px;font-size:11.5px;font-weight:700;cursor:pointer">${label}</button>`;
  };

  // 강사별·강의실별은 "여기 이 교시에 누가 있는가"가 핵심이라 인원 수만 세어주면 부족하다.
  // 학생마다 국적·나이·레벨을 붙여, 그 자리의 반 구성이 칸 안에서 바로 읽히게 한다.
  // 통합 레벨 그룹은 학생마다 레벨이 다를 수 있어 여기서 특히 필요하다.
  // 학생별 화면에서는 그 줄이 곧 그 학생이라 넣지 않는다.
  const studentLines = lesson => (lesson.studentIds || [])
    .map(id => MOCK_STUDENTS.find(student => student.id === id))
    .filter(Boolean)
    .map(student => {
      const meta = [getStudentOriginMetaText(student), lessonEsc(student.level || '')].filter(Boolean).join(' · ');
      // 1:1은 칸 제목이 이미 "학생 · 과목"이라 이름을 또 적지 않는다.
      const name = lesson.kind === 'one' ? '' : `<b style="color:#374151">${lessonEsc(student.nick || student.name)}</b> `;
      return `<div style="font-size:8.5px;color:#9CA3AF;margin-top:2px;white-space:normal">${name}${meta}</div>`;
    }).join('');

  // 그룹은 8명까지 들어가 다 펼쳐두면 칸이 표를 밀어낸다. 기본은 접고 눌렀을 때만 편다.
  // 1:1은 학생이 한 명뿐이라 접을 것이 없어 그대로 보여준다.
  const studentBlock = lesson => {
    const lines = studentLines(lesson);
    if (!lines || lesson.kind === 'one') return lines;
    return `<details style="margin-top:3px">
      <summary style="cursor:pointer;font-size:8.5px;font-weight:700;color:#5E5CE6;outline:none">학생 명단</summary>${lines}
    </details>`;
  };

  const chip = (lesson, mode, hideTeacher) => {
    const one = lesson.kind === 'one';
    const color = one ? '#5E5CE6' : '#059669';
    // 줄 머리에 이미 있는 값은 칸에서 뺀다 — 강사별이면 강사, 강의실별이면 그 방 담당 강사.
    const main = mode === 'student' && one
      ? `1:1 ${lessonEsc(lesson.subjectName)}`
      : lessonEsc(lesson.title);
    let sub;
    if (mode === 'room') {
      sub = (hideTeacher ? '' : lessonEsc(lesson.teacherName)) + (one ? '' : `${hideTeacher ? '' : ' · '}${lesson.studentIds.length}/${lesson.capacity}명`);
    } else if (mode === 'teacher') {
      sub = `${lesson.roomNo ? lessonEsc(lesson.roomNo) : '강의실 미정'}${one ? '' : ` · ${lesson.studentIds.length}/${lesson.capacity}명`}`;
    } else {
      sub = `${lessonEsc(lesson.teacherName)}${lesson.roomNo ? ` · ${lessonEsc(lesson.roomNo)}` : ''}`;
    }
    return `<div style="border:1px ${lesson.merged ? 'dashed' : 'solid'} #E5E7EB;border-left:3px ${lesson.merged ? 'dashed' : 'solid'} ${color};border-radius:7px;padding:5px 7px;margin-bottom:3px;background:#fff;line-height:1.35">
      <b style="display:block;font-size:9.5px;color:#111827">${main}</b>
      <span style="font-size:8.5px;color:#9CA3AF">${sub}</span>
      ${mode === 'student' ? '' : studentBlock(lesson)}
    </div>`;
  };

  let rows = '';
  let headLabel = '';

  if (isRoom) {
    headLabel = '강의실';
    const used = new Set(lessons.map(lesson => lesson.roomNo).filter(Boolean));
    const roomList = MOCK_CLASS_ROOMS.filter(room => room.roomNo && (['1:4', '1:8'].includes(room.type) || used.has(room.roomNo)));
    rows = roomList.map(room => {
      // 1:1 강의실은 담당 강사가 고정이라 방 이름만으로는 누구 방인지 알 수 없다. 이름을 같이 건다.
      const owner = MOCK_TEACHERS.find(teacher => teacher.status !== 'resigned' && teacher.room === room.roomNo);
      const cells = periods.map(period => {
        const here = lessons.filter(lesson => lesson.roomNo === room.roomNo && lesson.period === period);
        // 강사 이름이 줄 머리에 있으면 칸마다 또 쓰지 않는다.
        const hideTeacher = Boolean(owner) && here.every(lesson => lesson.teacherId === owner.id);
        return `<td style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;vertical-align:top">${here.map(lesson => chip(lesson, 'room', hideTeacher)).join('') || '<div style="text-align:center;color:#E5E7EB;font-size:9px;padding:7px 0">·</div>'}</td>`;
      }).join('');
      const busy = periods.filter(period => lessons.some(lesson => lesson.roomNo === room.roomNo && lesson.period === period)).length;
      return `<tr>
        <td style="padding:8px 11px;border-top:1px solid #F3F4F6;background:#F8FAFC;white-space:nowrap;vertical-align:middle">
          <b style="display:block;font-size:11px;color:#111827">${lessonEsc(room.roomNo)}${owner ? `<span style="font-weight:600;color:#5E5CE6;margin-left:5px">${lessonEsc(owner.nick || owner.name)}</span>` : ''}</b>
          <span style="display:block;font-size:9px;color:#9CA3AF;margin-top:1px">${lessonEsc(room.type)} · 빈 교시 ${totalPeriods - busy}</span>
        </td>${cells}
      </tr>`;
    }).join('');
  } else if (isTeacher) {
    headLabel = '강사';
    // 수업이 있는 강사를 위로 올린다. 아래쪽 빈 줄은 이번 주에 안 뛰는 강사 — 그것도 봐야 할 정보다.
    const countOf = teacher => periods.filter(period =>
      lessons.some(lesson => lesson.teacherId === teacher.id && lesson.period === period)).length;
    const teacherList = MOCK_TEACHERS
      .filter(teacher => teacher.status !== 'resigned')
      .map(teacher => ({ teacher, busy: countOf(teacher) }))
      .sort((a, b) => b.busy - a.busy || String(a.teacher.nick || a.teacher.name).localeCompare(String(b.teacher.nick || b.teacher.name)));
    rows = teacherList.map(({ teacher, busy }) => {
      // 블랙타임은 강사가 정해져야 판정되는 값이라 교시 칸(열)에는 칠할 수 없다. 강사별 보기의
      // 그 강사 줄에서만 칠한다. 넘겨서 배정한 자리는 검은 바탕 위에 수업이 얹혀 나중에 눈에 띈다.
      let blackCount = 0;
      const cells = periods.map(period => {
        const here = lessons.filter(lesson => lesson.teacherId === teacher.id && lesson.period === period);
        const availState = getTeacherWeeklyAvailState(teacher, period);
        if (availState === 'black') blackCount += 1;
        const shade = availState === 'black' ? '#374151' : availState === 'gray' ? '#F3F4F6' : '';
        const bg = shade ? `background:${shade};` : '';
        const empty = availState === 'black'
          ? '<div style="text-align:center;color:#9CA3AF;font-size:8.5px;padding:7px 0">블랙</div>'
          : availState === 'gray'
            ? '<div style="text-align:center;color:#9CA3AF;font-size:8.5px;padding:7px 0">화상</div>'
            : '<div style="text-align:center;color:#E5E7EB;font-size:9px;padding:7px 0">·</div>';
        return `<td style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;vertical-align:top;${bg}">${here.map(lesson => chip(lesson, 'teacher')).join('') || empty}</td>`;
      }).join('');
      return `<tr>
        <td style="padding:8px 11px;border-top:1px solid #F3F4F6;background:#F8FAFC;white-space:nowrap;vertical-align:middle">
          <b style="display:block;font-size:11px;color:${busy ? '#111827' : '#9CA3AF'}">${lessonEsc(teacher.nick || teacher.name)}</b>
          <span style="display:block;font-size:9px;color:#9CA3AF;margin-top:1px">${teacher.room ? lessonEsc(teacher.room) : '그룹만 담당'} · ${busy ? `${busy}교시` : '수업 없음'}${blackCount ? ` · <span style="color:#6B7280;font-weight:700">블랙 ${blackCount}교시</span>` : ''}</span>
        </td>${cells}
      </tr>`;
    }).join('');
  } else {
    headLabel = '학생';
    const students = getScaWeekStudents();
    rows = students.map(student => {
      const cells = periods.map(period => {
        const here = lessons.filter(lesson => lesson.period === period && lesson.studentIds.includes(student.id));
        return `<td style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;vertical-align:top">${here.map(lesson => chip(lesson, 'student')).join('') || '<div style="text-align:center;color:#E5E7EB;font-size:9px;padding:7px 0">·</div>'}</td>`;
      }).join('');
      const count = periods.filter(period => lessons.some(lesson => lesson.period === period && lesson.studentIds.includes(student.id))).length;
      return `<tr>
        <td style="padding:8px 11px;border-top:1px solid #F3F4F6;background:#F8FAFC;white-space:nowrap;vertical-align:middle">
          <b style="display:block;font-size:11px;color:#111827">${lessonEsc(student.nick || student.name)}</b>
          <span style="display:block;font-size:9px;color:#8A90A2;margin-top:1px">${getStudentOriginMetaText(student) || '-'}</span>
          <span style="display:block;font-size:9px;color:#9CA3AF;margin-top:1px">${lessonEsc(student.level || '-')} · ${count}교시</span>
        </td>${cells}
      </tr>`;
    }).join('');
  }

  const conflictBar = conflicts.length
    ? `<div style="padding:9px 12px;border:1.5px solid #DC2626;border-radius:10px;background:#FEE2E2;margin-bottom:11px;font-size:11px;color:#B91C1C;line-height:1.7">
        <b>같은 시간에 두 번 잡힌 게 ${conflicts.length}건 있어.</b><br>${conflicts.slice(0, 5).map(lessonEsc).join('<br>')}${conflicts.length > 5 ? `<br>외 ${conflicts.length - 5}건` : ''}
      </div>`
    : `<div style="padding:9px 12px;border:1.5px solid #047857;border-radius:10px;background:#ECFDF5;margin-bottom:11px;font-size:11px;color:#047857;font-weight:700">겹치는 수업이 없어. 강사 · 강의실 · 학생 모두 깨끗해.</div>`;

  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:11px">
      <span style="font-size:10.5px;color:#6B7280">보기</span>
      ${tab('student', '학생별')}
      ${tab('teacher', '강사별')}
      ${tab('room', '강의실별')}
      <span style="margin-left:auto;font-size:10.5px;color:#9CA3AF">이 화면에서는 배정하지 않아. 고치려면 1~2단계로 가.</span>
    </div>
    ${conflictBar}
    <div style="overflow-x:auto;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
      <table style="border-collapse:collapse;width:100%;font-size:10.5px">
        <thead><tr>
          <th style="padding:8px 11px;font-size:10px;font-weight:700;color:#9CA3AF;background:#F8FAFC;border-bottom:1px solid #E5E7EB;text-align:left;width:120px">${headLabel}</th>
          ${periods.map(period => `<th style="padding:8px 6px;font-size:10px;font-weight:700;color:#6B7280;background:#F8FAFC;border-bottom:1px solid #E5E7EB;border-left:1px solid #F3F4F6;text-align:center;min-width:${isTeacher || isRoom ? 166 : 100}px">${period}교시</th>`).join('')}
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="${periods.length + 1}" style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">이번 주에 열리는 수업이 없어.</td></tr>`}</tbody>
      </table>
      <div style="display:flex;gap:16px;flex-wrap:wrap;padding:9px 13px;border-top:1px solid #F3F4F6;font-size:10.5px;color:#9CA3AF">
        <span><i style="display:inline-block;width:3px;height:10px;border-radius:2px;background:#059669;vertical-align:-1px;margin-right:5px"></i>그룹 수업</span>
        <span><i style="display:inline-block;width:3px;height:10px;border-radius:2px;background:#5E5CE6;vertical-align:-1px;margin-right:5px"></i>1:1 수업</span>
        <span>점선 — 통합 레벨 그룹</span>
        <span>모든 수업은 주 5회(월~금) 같은 교시야.</span>
      </div>
    </div>`;
}
function renderScaStep3Board() {
  const panel = document.getElementById('sca-panel-step3');
  if (!panel) return;
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  const periods = Array.from({ length: totalPeriods }, (_, i) => i + 1);
  const teachers = getScaOneToOneTeachers();
  const pending = getScaOneToOnePending();
  const pick = _scaOnePick;

  const byStudent = new Map();
  pending.forEach(item => {
    if (!byStudent.has(item.student.id)) byStudent.set(item.student.id, { student: item.student, items: [] });
    byStudent.get(item.student.id).items.push(item.requirement);
  });
  // 1단계 미배정 목록과 줄 구조·CSS를 똑같이 맞춘다.
  // 사진 32px, 이름 위 · 국적·나이 아래(158px), 레벨은 제 열(104px), 칩, 맨 끝에 배정 건수.
  // 여기만 다른 건 학생이 13명까지 늘어서 목록에 스크롤 상한을 둔다는 것뿐이다.
  const chips = pending.length
    ? `<div style="width:100%;max-height:250px;overflow:auto">
      ${[...byStudent.values()].map(entry => {
        const oneToOneTotal = getStudentLessonRequirements(entry.student).filter(item => item.classType === '1:1').length;
        return `<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:7px 12px;border-bottom:1px solid #FDF0CE;background:#fff">
        <span style="flex:0 0 158px;min-width:0;display:flex;align-items:center;gap:8px">
          <img src="${lessonEsc(getStudentPhotoSrc(entry.student))}" alt="${lessonEsc(entry.student.nick || entry.student.name)}" style="flex:0 0 auto;width:32px;height:32px;border-radius:50%;object-fit:cover;background:#F3F4F6;border:1px solid #F3D89B"/>
          <span style="min-width:0">
            <span style="display:flex;align-items:center;gap:5px;min-width:0">
              <b style="font-size:11.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(entry.student.nick || entry.student.name)}</b>
            </span>
            <span style="display:block;font-size:9.5px;color:#8A90A2;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${getStudentOriginMetaText(entry.student)}</span>
          </span>
        </span>
        <span style="flex:0 0 104px;min-width:0">${entry.student.level
          ? `<span style="display:inline-block;max-width:100%;font-size:11px;font-weight:700;color:#4F46E5;background:#EEF2FF;border-radius:5px;padding:1px 6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle">${lessonEsc(entry.student.level)}</span>`
          : '<span style="font-size:10px;color:#C4C9D4">레벨 없음</span>'}</span>
        <span style="flex:0 0 150px;min-width:0;font-size:9.5px;color:#8A90A2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="수강 기간">${getStudentPeriodText(entry.student) || '<span style="color:#C4C9D4">기간 미등록</span>'}</span>
        ${entry.items.map(requirement => {
          const on = pick && pick.studentId === entry.student.id && pick.sequence === requirement.sequence;
          return `<button onclick="pickScaOneToOne(${entry.student.id},${requirement.sequence})" style="padding:3px 10px;border-radius:999px;border:1px solid ${on ? '#5E5CE6' : '#E5E7EB'};background:${on ? '#5E5CE6' : '#fff'};color:${on ? '#fff' : '#4B5563'};font-size:9.5px;font-weight:600;cursor:pointer">${lessonEsc(requirement.subjectName)}</button>`;
        }).join('')}
        <span style="margin-left:auto;font-size:9.5px;font-weight:800;color:#DC2626;background:#FEE2E2;border-radius:999px;padding:2px 8px;white-space:nowrap">${oneToOneTotal - entry.items.length}/${oneToOneTotal}</span>
      </div>`;
      }).join('')}
    </div>`
    : '';  // 다 배정된 상태의 안내는 아래 머리줄이 맡는다. 여기에 두면 패딩 없이 테두리에 붙는다.

  const rows = teachers.map(teacher => {
    const cells = periods.map(period => {
      const state = getScaOneToOneCellState(teacher, period, pick);
      if (state.kind === 'taken') {
        const { student, entry } = state.taken;
        const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === entry.subjectId);
        return `<td style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;vertical-align:top">
          <div style="border:1px solid #E5E7EB;border-left:3px solid #5E5CE6;border-radius:7px;background:#fff;overflow:hidden">
            <div style="padding:5px 7px;line-height:1.35">
              <b style="display:block;font-size:9.5px;color:#111827">${lessonEsc(student.nick || student.name)}</b>
              <span style="font-size:8.5px;color:#9CA3AF">${lessonEsc(subject?.name || entry.subjectId)} · ${lessonEsc(teacher.room)}</span>
            </div>
            <button onclick="unassignScaOneToOne(${student.id},${entry.templateSequence},'${lessonEsc(entry.subjectId)}')" title="배정 취소" style="width:100%;border:0;border-top:1px dashed #F3F4F6;background:#fff;color:#C4C9D4;font-size:8.5px;font-weight:700;padding:2px 0;cursor:pointer">✕ 취소</button>
          </div>
        </td>`;
      }
      if (state.kind === 'group') {
        const group = state.group;
        const cap = getGroupCapacityFor(group);
        const room = group.roomId != null ? MOCK_CLASS_ROOMS.find(item => item.id === group.roomId) : null;
        const merged = isMergedLevelGroup(group);
        return `<td style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;vertical-align:top">
          <button onclick="openActiveGroupDetail(${group.id})" title="${lessonEsc(getGroupDisplayName(group))}" style="width:100%;text-align:left;border:1px ${merged ? 'dashed' : 'solid'} #E5E7EB;border-left:3px ${merged ? 'dashed' : 'solid'} #059669;border-radius:7px;background:#fff;padding:5px 7px;cursor:pointer;line-height:1.35">
            <b style="display:block;font-size:9.5px;color:#111827">${lessonEsc(getGroupDisplayName(group))}</b>
            <span style="font-size:8.5px;color:#9CA3AF">${group.studentIds.length}/${cap}명${room ? ` · ${lessonEsc(room.roomNo)}` : ''}</span>
          </button>
        </td>`;
      }
      if (state.kind === 'locked' || state.kind === 'blocked') {
        if (state.reason === '1:1 담당 아님') {
          return `<td title="이 강사는 1:1을 맡지 않아" style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;background:#FCFCFD"></td>`;
        }
        return `<td style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;vertical-align:top">
          <div style="border-radius:7px;background:#F8FAFC;color:#B6BBC9;font-size:8.5px;text-align:center;padding:9px 2px;line-height:1.3">${lessonEsc(state.reason)}</div>
        </td>`;
      }
      const lit = state.kind === 'open';
      return `<td style="padding:4px;border-top:1px solid #F3F4F6;border-left:1px solid #F3F4F6;vertical-align:top">
        <button onclick="assignScaOneToOne(${teacher.id},${period})" style="width:100%;border:1.5px ${lit ? 'solid #5E5CE6' : 'dashed #E5E7EB'};border-radius:7px;background:${lit ? '#EEF2FF' : '#fff'};color:${lit ? '#4F46E5' : '#D1D5DB'};font-size:9.5px;font-weight:700;padding:8px 0;cursor:pointer">+ 배정</button>
      </td>`;
    }).join('');
    return `<tr>
      <td style="padding:8px 11px;border-top:1px solid #F3F4F6;background:#F8FAFC;white-space:nowrap;vertical-align:middle">
        <b style="display:block;font-size:11px;color:#111827">${lessonEsc(teacher.nick || teacher.name)}</b>
        <span style="display:block;font-size:9px;color:#9CA3AF;margin-top:1px">${teacher.room ? lessonEsc(teacher.room) : '그룹만 담당'}</span>
      </td>
      ${cells}
    </tr>`;
  }).join('');

  panel.innerHTML = `
    <div style="border:1.5px solid ${pending.length ? '#B45309' : '#047857'};border-radius:11px;background:${pending.length ? '#FEF3C7' : '#ECFDF5'};overflow:hidden;margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 12px;${pending.length ? 'border-bottom:1px solid #F3D89B' : ''}">
        <b style="font-size:11.5px;color:${pending.length ? '#B45309' : '#047857'}">${pending.length ? `아직 못 붙인 1:1 ${pending.length}건${byStudent.size ? ` · 학생 ${byStudent.size}명` : ''}` : '1:1 수업이 전부 배정됐어'}</b>
        ${pending.length
          ? '<span style="font-size:10.5px;color:#8A90A2">과목 칩을 누르면 놓을 수 있는 자리가 떠.</span><button onclick="runScaStep3AutoAssign()" title="남은 1:1을 빈 자리에 알아서 끼운다" style="margin-left:auto;border:0;border-radius:8px;background:#5E5CE6;color:#fff;font-size:10.5px;font-weight:700;padding:6px 13px;cursor:pointer">⚡ 자동 배정</button>'
          : '<span style="font-size:10.5px;color:#8A90A2">남은 1:1이 없어. 아래 표에서 배정을 바꿀 수 있어.</span>'}
      </div>
      ${chips}
    </div>
    <div style="overflow-x:auto;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
      <table style="border-collapse:collapse;width:100%;font-size:10.5px">
        <thead><tr>
          <th style="padding:8px 11px;font-size:10px;font-weight:700;color:#9CA3AF;background:#F8FAFC;border-bottom:1px solid #E5E7EB;text-align:left;width:120px">강사</th>
          ${periods.map(period => `<th style="padding:8px 6px;font-size:10px;font-weight:700;color:#6B7280;background:#F8FAFC;border-bottom:1px solid #E5E7EB;border-left:1px solid #F3F4F6;text-align:center;min-width:86px">${period}교시</th>`).join('')}
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="${periods.length + 1}" style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">표에 세울 강사가 없어. 강사에게 담당 강의실을 먼저 배정해줘.</td></tr>`}</tbody>
      </table>
      <div style="display:flex;gap:16px;flex-wrap:wrap;padding:9px 13px;border-top:1px solid #F3F4F6;font-size:10.5px;color:#9CA3AF">
        <span><i style="display:inline-block;width:3px;height:10px;border-radius:2px;background:#5E5CE6;vertical-align:-1px;margin-right:5px"></i>1:1 수업</span>
        <span><i style="display:inline-block;width:3px;height:10px;border-radius:2px;background:#059669;vertical-align:-1px;margin-right:5px"></i>그룹 수업 — 눌러서 반 상세 보기</span>
        <span>회색 칸 — 근무 시간이 아니거나 1:1 담당이 아니야</span>
        <span>그룹도 1:1도 <b>주 5회(월~금)</b> 같은 교시야. 요일은 고를 게 없어.</span>
      </div>
    </div>`;
}
function navigateStudentClassAssign(tab) {
  // 예전 링크(students/groups)로 들어오면 그에 맞는 단계로 보낸다.
  if (tab === 'groups') { _studentClassAssignTab = 'groups'; _scaStep = 2; }
  else if (tab === 'students') { _studentClassAssignTab = 'students'; _scaStep = 1; }
  navigate('student-class-assign');
}

const SCA_PAGE_META = {
  students: { title: '🗓️ 주간 수업 배정', subtitle: '1단계 — 학생을 반에 넣고, 반마다 강사·교시·강의실을 정합니다.' },
  groups: { title: '🗓️ 주간 수업 배정', subtitle: '1단계 — 학생을 반에 넣고, 반마다 강사·교시·강의실을 정합니다.' },
  one: { title: '🗓️ 주간 수업 배정', subtitle: '2단계 — 그룹이 앉고 남은 자리에 1:1 수업을 끼웁니다. 1:1도 주 5회 월~금 같은 교시입니다.' },
  schedule: { title: '🗓️ 주간 수업 배정', subtitle: '전체 시간표 — 이번 주에 짜인 수업을 학생별·강의실별로 확인합니다. 여기서는 배정하지 않습니다.' }
};

function renderStudentClassAssignView() {
  const step = _scaStep;
  const meta = SCA_PAGE_META[step === 2 ? 'groups' : step === 3 ? 'one' : step === 4 ? 'schedule' : 'students'];
  const titleEl = document.getElementById('sca-page-title');
  const subtitleEl = document.getElementById('sca-page-subtitle');
  const breadcrumbEl = document.getElementById('breadcrumb-current');
  if (titleEl) titleEl.textContent = meta.title;
  if (subtitleEl) subtitleEl.textContent = meta.subtitle;
  if (breadcrumbEl) breadcrumbEl.textContent = meta.title.replace(/^\S+\s/, '');
  const studentsPanel = document.getElementById('sca-panel-students');
  const groupsPanel = document.getElementById('sca-panel-groups');
  // 1단계는 학생 × 과목 표가 대신한다. 예전 학생별 표는 자리에 그대로 두되 감춰둔다.
  const step1Panel = document.getElementById('sca-panel-step1');
  const step3Panel = document.getElementById('sca-panel-step3');
  const schedulePanel = document.getElementById('sca-panel-schedule');
  if (step1Panel) step1Panel.style.display = step === 1 ? 'block' : 'none';
  if (step3Panel) step3Panel.style.display = step === 3 ? 'block' : 'none';
  if (schedulePanel) schedulePanel.style.display = step === 4 ? 'block' : 'none';
  if (studentsPanel) studentsPanel.style.display = 'none';
  if (groupsPanel) groupsPanel.style.display = step === 2 ? 'block' : 'none';
  renderScaWeekHeader();
  if (step === 2) renderStudentClassAssignGroupPanel();
  else if (step === 3) renderScaStep3Board();
  else if (step === 4) renderScaScheduleBoard();
  else renderScaStep1Board();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function renderStudentClassAssignGroupPanel() {
  const panel = document.getElementById('sca-panel-groups');
  if (!panel) return;
  renderGroupManagementActive(panel);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function renderStudentClassAssignList() {
  const body = document.getElementById('sca-student-assign-body');
  if (!body) return;
  renderScaLessonsHeader();
  const oneToOneTypes = ['1:1'];
  const groupTypes = ['1:4', '1:8'];
  const searchInput = document.getElementById('sca-student-search');
  const query = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const rows = getLessonAssignableStudentsSorted().map(student => {
    const requirements = getStudentLessonRequirements(student);
    const oneToOneReqs = requirements.filter(req => oneToOneTypes.includes(req.classType));
    const groupReqs = requirements.filter(req => groupTypes.includes(req.classType));
    return { student, oneToOneReqs, groupReqs };
  }).filter(row => row.oneToOneReqs.length > 0 || row.groupReqs.length > 0)
    .filter(({ student }) => {
      if (!query) return true;
      const haystack = [student.name, student.nick, student.nationality].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(query);
    });

  body.innerHTML = rows.map(({ student, oneToOneReqs, groupReqs }, idx) => {
    const period = [student.startDate, student.departureDate].filter(Boolean).join(' ~ ') || '-';
    const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
    const studentInfoCell = `
      <td rowspan="2" style="text-align:center;color:#9CA3AF;font-size:11px;vertical-align:middle">${rows.length - idx}</td>
      <td rowspan="2" class="sca-student-cell" style="vertical-align:middle">
        <div style="display:flex;align-items:center;gap:8px;cursor:pointer" onclick="openStudentDetail(${student.id})" title="학생 상세 보기">
          <img class="tsa-avatar" src="${avatarSrc}" style="width:30px;height:30px;object-fit:cover;border-radius:50%;border:1px solid #E5E7EB;flex-shrink:0" alt="${lessonEsc(student.nick || student.name || '')}"/>
          <div class="sca-student-copy">
            <b>${lessonEsc(student.nick || student.name)}</b><div style="font-size:10px;color:#9CA3AF">${lessonEsc(student.name || '')}</div>
            <div style="font-size:10px;color:#6B7280">${lessonEsc(student.flag || '')} ${lessonEsc(student.nationality || '-')} · ${lessonEsc(student.gender || '-')} ${student.age != null ? student.age + '세' : ''}</div>
          </div>
        </div>
      </td>
      <td rowspan="2" class="sca-course-cell" style="font-size:11px;color:#4B5563;vertical-align:middle">${lessonEsc(student.course || '-')}<div class="sca-course-period" style="font-size:10px;color:#9CA3AF">${lessonEsc(period)}</div></td>
      <td rowspan="2" style="font-size:11px;vertical-align:middle">${lessonEsc(student.level || '-')}</td>
      <td rowspan="2" style="text-align:center;vertical-align:middle;padding-left:6px;padding-right:6px">
        <button class="tsa-btn tsa-btn-xs tsa-btn-outline" style="white-space:nowrap;height:25px;padding:3px 9px;font-size:9.5px" onclick="openStudentSchedulePopup(${student.id})"><i data-lucide="calendar-days" style="width:12px;height:12px"></i> 스케줄</button>
      </td>`;

    const buildTypeRow = (label, badgeColor, requirements, allowedTypes, includeStudentCells, packed) => {
      const total = requirements.length;
      const assigned = requirements.filter(req => req.status === 'ASSIGNED').length;
      const unit = packed ? '개' : '교시'; // 그룹은 더 이상 교시(시간) 단위가 아니라 과목 개수 단위로 센다
      const statusHtml = total > 0
        ? `<span style="font-weight:700;color:${assigned === total ? '#059669' : '#B45309'}">${assigned}/${total}${unit}</span>`
        : '<span style="color:#9CA3AF">해당 없음</span>';
      const tags = total > 0 ? buildLessonRequirementPeriodGrid(student, requirements) : '<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px">배정 대상 없음</span>';
      // "1:1 수업 배정"·"소그룹 수업 배정"·"중그룹 수업 배정" 세 버튼을 시간표 통합 배정 화면 하나로 대체.
      const buttons = `<button class="tsa-btn tsa-btn-xs tsa-btn-primary" style="white-space:nowrap" onclick="openStudentScheduleAssignment(${student.id})">시간표로 배정</button>`;
      return `<tr style="${includeStudentCells ? '' : 'border-top:none'}">
        ${includeStudentCells ? studentInfoCell : ''}
        <td style="text-align:center"><span class="tsa-badge" style="background:${badgeColor}1A;color:${badgeColor};font-size:9.5px;white-space:nowrap">${label}</span></td>
        <td style="font-size:11px;white-space:nowrap">${statusHtml}</td>
        <td class="sca-lessons-cell">${tags}</td>
        <td class="sca-actions-cell" style="text-align:center;padding-left:8px;padding-right:8px"><div style="display:flex;justify-content:center;gap:4px;flex-wrap:wrap">${buttons}</div></td>
      </tr>`;
    };

    return buildTypeRow('1:1', '#5E5CE6', oneToOneReqs, oneToOneTypes, true, false) +
      buildTypeRow('그룹', '#0F766E', groupReqs, groupTypes, false, true);
  }).join('') || `<tr><td colspan="9" style="padding:30px;text-align:center;color:#9CA3AF">${query ? '검색 결과가 없어.' : '배정할 수업 요구사항이 있는 학생이 없어.'}</td></tr>`;
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

// 특정 1:1 교시 하나에 배정 가능한 강사 목록. saveStudentOneToOneSchedule과 같은 규칙으로 판정해서
// 저장 단계에서야 거절당하는 일이 없게 하고, 불가한 강사는 사유를 함께 돌려준다.
// periodOverride를 주면 requirement.sequence 대신 그 교시 기준으로 판정한다(통합 시간표에서 "이 교시에 이 과목을 넣을 수 있나" 조회용).
function getOneToOneTeacherCandidates(student, requirement, periodOverride) {
  const period = periodOverride != null ? Number(periodOverride) : Number(requirement.sequence);
  return MOCK_TEACHERS
    .filter(teacher => teacher.status !== 'resigned' && (teacher.classTypes || []).includes('1:1'))
    .map(teacher => {
      let reason = '';
      if (!teacher.room) {
        reason = '담당 1:1 강의실 없음';
      } else if (!LESSON_DAYS.every(day => lessonTeacherAvailableAt(teacher, day, period))) {
        reason = `${period}교시 미근무`;
      } else if (MOCK_STUDENTS.some(other =>
        other.id !== student.id && (other.oneToOneSchedule || []).some(o => o.teacherId === teacher.id && o.period === period)
      )) {
        reason = `${period}교시 1:1 수업 중`;
      } else if (MOCK_GROUP_CLASSES.some(group =>
        group.status === 'active' && group.teacherId === teacher.id &&
        Array.isArray(group.dayOfWeek) && group.dayOfWeek.length &&
        Array.isArray(group.periods) && group.periods.includes(period)
      )) {
        reason = `${period}교시 그룹 수업 중`;
      }
      return { teacher, available: !reason, reason };
    })
    .sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));
}

// 학생의 하루(1~maxPeriods)를 교시 슬롯 단위로 반환한다. 채워진 슬롯은 실제 배정(1:1 또는 그룹)의
// 진짜 교시를 그대로 반영하고, 빈 슬롯은 그 자리에 뭘 넣을지 아직 정해지지 않았다는 뜻이다
// (교시 고정 매칭 폐지 이후에는 "몇 번째 요구사항"과 "몇 교시"가 더 이상 같은 값이 아니다).
function getStudentScheduleSlots(student) {
  const requirements = getStudentLessonRequirements(student);
  const maxPeriods = getMaxCoursePeriodCount();
  const slots = [];
  for (let period = 1; period <= maxPeriods; period += 1) {
    const oneToOne = requirements.find(req => req.classType === '1:1' && req.status === 'ASSIGNED' && Number(req.period) === period);
    if (oneToOne) {
      const teacher = oneToOne.teacherId != null ? MOCK_TEACHERS.find(t => t.id === oneToOne.teacherId) : null;
      slots.push({ period, filled: true, kind: '1:1', typeLabel: '1:1', subjectName: oneToOne.subjectName, who: teacher ? (teacher.nick || teacher.name) : '' });
      continue;
    }
    const group = MOCK_GROUP_CLASSES.find(g => g.status === 'active' && Array.isArray(g.periods) && g.periods.includes(period) && g.studentIds.includes(student.id));
    if (group) {
      const teacher = group.teacherId != null ? MOCK_TEACHERS.find(t => t.id === group.teacherId) : null;
      const capacity = getGroupCapacityFor(group);
      slots.push({
        period, filled: true, kind: 'group', typeLabel: `${group.classType} 그룹`, subjectName: getGroupSubjectNamesLabel(group),
        who: `${teacher ? (teacher.nick || teacher.name) : '강사 미배정'} · ${group.studentIds.length}/${capacity}명`
      });
      continue;
    }
    slots.push({ period, filled: false });
  }
  return slots;
}

// 특정 교시 하나를 클릭했을 때 거기 채워 넣을 수 있는 그룹 후보 + 1:1 후보를 함께 찾는다.
// 그룹은 기존 매칭 로직에 이 교시 필터만 더하고, 1:1은 강사 후보 조회에 이 교시를 직접 넘긴다.
function getScheduleSlotCandidates(student, period) {
  const requirements = getStudentLessonRequirements(student);
  const groupReqs = requirements.filter(req => req.classType !== '1:1' && req.status !== 'ASSIGNED');
  const oneToOneReqs = requirements.filter(req => req.classType === '1:1' && req.status !== 'ASSIGNED');

  const seenGroupIds = new Set();
  const groupCandidates = [];
  groupReqs.forEach(req => {
    getCandidateGroupsForStudentRequirement(student, req).forEach(group => {
      if (!Array.isArray(group.periods) || !group.periods.includes(period)) return;
      if (seenGroupIds.has(group.id)) return;
      seenGroupIds.add(group.id);
      const teacher = group.teacherId != null ? MOCK_TEACHERS.find(t => t.id === group.teacherId) : null;
      const room = group.roomId != null ? MOCK_CLASS_ROOMS.find(r => r.id === group.roomId) : null;
      const capacity = getGroupCapacityFor(group);
      groupCandidates.push({
        groupId: group.id, classType: group.classType, subjectName: getGroupSubjectNamesLabel(group),
        teacherLabel: teacher ? (teacher.nick || teacher.name) : '강사 미배정',
        roomLabel: room ? room.roomNo : '-',
        fillLabel: `${group.studentIds.length}/${capacity}명`
      });
    });
  });

  const seenSubjectTeacher = new Set();
  const oneToOneCandidates = [];
  oneToOneReqs.forEach(req => {
    getOneToOneTeacherCandidates(student, req, period).filter(c => c.available).forEach(c => {
      const key = req.subjectId + '|' + c.teacher.id;
      if (seenSubjectTeacher.has(key)) return;
      seenSubjectTeacher.add(key);
      oneToOneCandidates.push({
        subjectId: req.subjectId, subjectName: req.subjectName, sequence: req.sequence,
        teacherId: c.teacher.id, teacherLabel: c.teacher.nick || c.teacher.name
      });
    });
  });

  return { groupCandidates, oneToOneCandidates };
}

// 학생 1명의 하루 시간표를 통째로 보여주고, 빈 교시를 클릭하면 그룹·1:1 후보를 함께 보여주는 통합 배정 화면.
// 기존의 "1:1 수업 배정"·"소그룹 수업 배정"·"중그룹 수업 배정" 버튼 세 개를 이 화면 하나로 대체한다.
function openStudentScheduleAssignment(studentId, popupTarget, selectedPeriod) {
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('student-schedule');
    popupUrl.searchParams.set('student', studentId);
    const openedPopup = window.open(popupUrl.href, `tsa-student-schedule-${studentId}`, 'popup=yes,width=900,height=760,resizable=yes,scrollbars=yes');
    if (!openedPopup) {
      showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
    }
    return;
  }
  const popup = popupTarget;
  try { popup.stop(); } catch (error) {}
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!student) { popup.close(); return; }
  const requirements = getStudentLessonRequirements(student);
  const totalCount = requirements.length;
  const assignedCount = requirements.filter(r => r.status === 'ASSIGNED').length;
  const slots = getStudentScheduleSlots(student);
  const period = selectedPeriod != null && Number.isFinite(Number(selectedPeriod)) ? Number(selectedPeriod) : null;
  const candidates = period != null ? getScheduleSlotCandidates(student, period) : null;
  const studentAvatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');

  const slotsHtml = slots.map(slot => {
    if (slot.filled) {
      const cls = slot.kind === 'group' ? 'grp' : 'on1';
      return `<div class="slot filled ${cls}"><span class="pnum">${slot.period}교시</span><span class="type">${esc(slot.typeLabel)}</span><span class="subj">${esc(slot.subjectName)}</span><span class="who">${esc(slot.who)}</span></div>`;
    }
    const active = slot.period === period ? ' active' : '';
    return `<button type="button" class="slot empty${active}" onclick="selectSlot(${slot.period})"><span class="plus">+</span></button>`;
  }).join('');

  const groupCandHtml = candidates ? candidates.groupCandidates.map(c => `
    <div class="cand-row grp">
      <span class="icon">${esc(c.classType)}</span>
      <div class="info"><b>${esc(c.subjectName)} · ${esc(getGroupSizeShortLabel(c.classType))}</b><span>${esc(c.teacherLabel)} · ${esc(c.roomLabel)} · ${esc(c.fillLabel)}</span></div>
      <button class="cand-btn" onclick="pickGroup(${c.groupId})">이 그룹 배정</button>
    </div>`).join('') : '';
  const oneOneCandHtml = candidates ? candidates.oneToOneCandidates.map(c => `
    <div class="cand-row on1">
      <span class="icon">1:1</span>
      <div class="info"><b>${esc(c.subjectName)} · ${esc(c.teacherLabel)}</b><span>이 학생과 시간 안 겹침</span></div>
      <button class="cand-btn" onclick="pickOneToOne('${esc(c.subjectId)}',${c.teacherId},${c.sequence})">이 강사 배정</button>
    </div>`).join('') : '';
  const panelHtml = period == null ? '' : `
    <div class="panel">
      <div class="panel-title"><span class="pbadge">${period}교시</span>이 교시에 배정 가능한 수업</div>
      ${groupCandHtml ? `<div class="cand-group"><div class="cand-label">그룹 후보</div>${groupCandHtml}</div>` : ''}
      ${oneOneCandHtml ? `<div class="cand-group"><div class="cand-label">1:1 후보</div>${oneOneCandHtml}</div>` : ''}
      ${!groupCandHtml && !oneOneCandHtml ? '<div class="empty-hint">이 교시에 배정할 수 있는 미배정 수업이 없어.</div>' : ''}
    </div>`;

  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>${esc(student.nick || student.name)} · 수업 배정</title>
    <style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:16px 20px;background:#fff;border-bottom:1px solid #E5E7EB}
      .avatar{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#EEF2FF;flex-shrink:0}
      h1{font-size:15px;margin:0}.meta{font-size:10.5px;color:#6B7280;margin-top:2px}
      .progress{margin-left:auto;text-align:right}.progress b{display:block;font-size:16px;color:#5E5CE6}.progress span{font-size:9.5px;color:#9CA3AF}
      .back{border:0;background:none;font-size:20px;cursor:pointer;color:#6B7280}
      main{padding:18px 20px 90px}
      .day-strip{display:grid;grid-template-columns:repeat(8,1fr);gap:8px}
      .slot{border-radius:10px;min-height:88px;padding:8px;display:flex;flex-direction:column;gap:4px}
      .slot .pnum{font-size:9px;font-weight:800;color:#9CA3AF}
      .slot.filled{border:1px solid}
      .slot.filled.grp{background:#FFF1E8;border-color:#C2410C}.slot.filled.grp .pnum,.slot.filled.grp .type{color:#C2410C}
      .slot.filled.on1{background:#ECFDF5;border-color:#059669}.slot.filled.on1 .pnum,.slot.filled.on1 .type{color:#059669}
      .slot .type{font-size:9px;font-weight:800}.slot .subj{font-size:11px;font-weight:700;color:#111827;line-height:1.25}
      .slot .who{font-size:9px;color:#4B5563;margin-top:auto}
      .slot.empty{border:1.5px dashed #D1D5DB;display:flex;align-items:center;justify-content:center;cursor:pointer;background:#fff}
      .slot.empty .plus{font-size:18px;color:#9CA3AF;font-weight:300}
      .slot.empty.active{border-color:#5E5CE6;background:#EEF2FF}.slot.empty.active .plus{color:#5E5CE6}
      .panel{margin-top:16px;border-top:1px solid #E5E7EB;padding-top:14px}
      .panel-title{font-size:12px;font-weight:800;color:#111827;margin-bottom:10px;display:flex;align-items:center;gap:8px}
      .pbadge{font-family:monospace;font-size:10.5px;font-weight:700;color:#5E5CE6;background:#EEF2FF;padding:2px 8px;border-radius:999px}
      .cand-group{margin-bottom:12px}.cand-group:last-child{margin-bottom:0}
      .cand-label{font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:.03em;margin-bottom:6px}
      .cand-row{display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid #E5E7EB;border-radius:9px;background:#fff;margin-bottom:6px}
      .cand-row .icon{width:26px;height:26px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
      .cand-row.grp .icon{background:#FFF1E8;color:#C2410C}.cand-row.on1 .icon{background:#ECFDF5;color:#059669}
      .cand-row .info{flex:1}.cand-row .info b{font-size:11.5px;color:#111827}.cand-row .info span{display:block;font-size:9.5px;color:#9CA3AF;margin-top:1px}
      .cand-btn{font-size:10.5px;font-weight:700;padding:6px 12px;border-radius:8px;border:1px solid #5E5CE6;background:#5E5CE6;color:#fff;cursor:pointer;white-space:nowrap}
      .empty-hint{font-size:11px;color:#9CA3AF}
      footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;background:#fff;border-top:1px solid #E5E7EB}
      .btn{padding:9px 13px;border:1px solid #D1D5DB;border-radius:8px;background:#fff;cursor:pointer;font-size:12px}
    </style></head><body>
    <header>
      <img class="avatar" src="${esc(studentAvatarSrc)}"/>
      <div><h1>${esc(student.nick || student.name)} · 수업 배정</h1><div class="meta">${esc(student.course || '-')} · ${esc(student.level || '-')}</div></div>
      <div class="progress"><b>${assignedCount}/${totalCount}</b><span>배정 완료</span></div>
      <button class="back" onclick="goBack()">×</button>
    </header>
    <main>
      <div class="day-strip">${slotsHtml}</div>
      ${panelHtml}
    </main>
    <footer><button class="btn" onclick="goBack()">닫기</button></footer>
    <script>
      function goBack(){window.close();}
      function notifyOpener(payload){
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return false;}
        window.opener.postMessage(Object.assign({channel:'tsa-group-popup'},payload),'*');
        return true;
      }
      function selectSlot(period){
        window.openStudentScheduleAssignment(${student.id}, window, period);
      }
      function pickGroup(groupId){
        if(!notifyOpener({action:'assign-student-to-group',studentId:${student.id},groupId:groupId})) return;
        var result=window.assignStudentToGroupFromBrowserPopup(${student.id}, groupId);
        if(!result.ok){window.alert(result.message);return;}
        window.openStudentScheduleAssignment(${student.id}, window, null);
      }
      function pickOneToOne(subjectId,teacherId,sequence){
        var period=${period != null ? period : 'null'};
        if(!notifyOpener({action:'save-one-to-one-schedule',studentId:${student.id},subjectId:subjectId,teacherId:teacherId,period:period,templateSequence:sequence})) return;
        var result=window.saveStudentOneToOneSchedule(${student.id},subjectId,teacherId,period,sequence);
        if(!result.ok){window.alert(result.message);return;}
        window.openStudentScheduleAssignment(${student.id}, window, null);
      }
    <\/script>
    </body></html>`);
  popup.document.close();
  popup.focus();
}

function openStudentLessonAssignment(studentId, popupTarget, focusClassType) {
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('student-assign');
    popupUrl.searchParams.set('student', studentId);
    if (focusClassType) popupUrl.searchParams.set('type', focusClassType);
    const openedPopup = window.open(popupUrl.href, `tsa-student-assign-${studentId}`, 'popup=yes,width=820,height=800,resizable=yes,scrollbars=yes');
    if (!openedPopup) {
      showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
    }
    return;
  }
  const popup = popupTarget;
  try { popup.stop(); } catch (error) {}
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!student) { popup.close(); return; }
  const recentGroupId = Number.parseInt(new URLSearchParams(popup.location.search).get('createdGroup'), 10);
  const studentAvatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
  const requirements = getStudentLessonRequirements(student);
  const groupReqs = requirements.filter(r => r.classType !== '1:1' && (!focusClassType || r.classType === focusClassType));
  const pendingGroupReqs = groupReqs.filter(r => r.status !== 'ASSIGNED');
  const oneToOneReqs = requirements.filter(r => r.classType === '1:1' && (!focusClassType || focusClassType === '1:1'));
  const level = getLevelGroupForStudent(student);
  const primaryTeacher = student.primaryTeacherId != null ? MOCK_TEACHERS.find(t => t.id === student.primaryTeacherId) : null;
  const headerRequirements = focusClassType === '1:1'
    ? oneToOneReqs
    : focusClassType
      ? groupReqs
      : requirements;
  const studentTimeLabel = headerRequirements
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map(req => req.classType === '1:1' ? `${req.sequence}교시 ${esc(req.subjectName)}` : `${req.classType} ${esc(req.subjectName)}`)
    .join(' · ') || '배정 대상 수업 없음';
  const inlineGroupCreateRows = groupReqs.map(req => ({
    sequence: req.sequence,
    subjectId: req.subjectId,
    subjectName: req.subjectName,
    classType: req.classType
  }));

  const groupRows = groupReqs.map((req, reqIndex) => {
    if (req.status === 'ASSIGNED') {
      const group = MOCK_GROUP_CLASSES.find(g => g.id === req.groupId);
      const alternatives = getCandidateGroupsForStudentRequirement(student, req).filter(candidate => candidate.id !== req.groupId);
      return `<div class="req-card done">
        <div class="req-head"><b>${req.classType} · ${esc(req.subjectName)}</b><span class="badge ok">배정 완료</span></div>
        <div class="req-sub">${group ? esc(getGroupDisplayName(group)) : '-'}</div>
        ${alternatives.length ? `<div class="candidates"><div class="empty-hint">다른 그룹으로 변경</div>${alternatives.map(candidate => {
          const teacher = candidate.teacherId != null ? MOCK_TEACHERS.find(t => t.id === candidate.teacherId) : null;
          const room = candidate.roomId != null ? MOCK_CLASS_ROOMS.find(r => r.id === candidate.roomId) : null;
          return `<div class="candidate-row"><div class="candidate-info"><b>${esc(getGroupDisplayName(candidate))}</b><div class="candidate-meta">${esc((candidate.dayOfWeek || []).join(','))} ${esc((candidate.periods || []).join(','))}교시 · ${esc(teacher?.nick || '-')} · ${esc(room?.roomNo || '-')}</div></div><button class="btn primary xs" onclick="changeAssignedGroup(${req.groupId},${candidate.id})">이 그룹으로 변경</button></div>`;
        }).join('')}</div>` : '<div class="empty-hint" style="margin-top:7px">현재 변경 가능한 다른 그룹이 없어.</div>'}
      </div>`;
    }
    const candidates = getCandidateGroupsForStudentRequirement(student, req);
    return `<div class="req-card pending" data-group-requirement="${reqIndex}">
      <div class="req-head"><b>${req.classType} · ${esc(req.subjectName)}</b><span class="badge warn">미배정</span></div>
      <div class="candidates">
        ${candidates.length ? candidates.map(g => {
          const cap = getGroupCapacityFor(g);
          const teacher = g.teacherId != null ? MOCK_TEACHERS.find(t => t.id === g.teacherId) : null;
          const room = g.roomId != null ? MOCK_CLASS_ROOMS.find(r => r.id === g.roomId) : null;
          const isRecent = Number.isFinite(recentGroupId) && g.id === recentGroupId;
          return `<div class="candidate-row${isRecent ? ' recent' : ''}">
            <div class="candidate-info"><b>${esc(getGroupDisplayName(g))}${isRecent ? '<span class="new-group-badge">방금 생성 · 아직 미배정</span>' : ''}</b><div class="candidate-meta">${esc((g.dayOfWeek || []).join(','))} ${esc((g.periods || []).join(','))}교시 · ${esc(teacher?.nick || '-')} · ${esc(room?.roomNo || '-')} · ${g.studentIds.length}/${cap}명</div></div>
            <button class="btn outline xs group-select-btn" onclick="selectGroupForRequirement(${reqIndex},${g.id},this)">선택하기</button>
          </div>`;
        }).join('') : '<div class="empty-hint">배정 가능한 그룹이 없어. 위의 [+ 새 그룹 만들기]로 만들어줘.</div>'}
      </div>
    </div>`;
  }).join('') || '<div class="empty-hint">그룹 수업 요구사항이 없어.</div>';

  const oneToOneAssigned = oneToOneReqs.filter(r => r.status === 'ASSIGNED');
  const teacherCandidates = MOCK_TEACHERS
    .filter(t => t.status !== 'resigned' && (t.classTypes || []).includes('1:1') && t.id !== primaryTeacher?.id)
    .map(teacher => ({ teacher, plan: planStudentOneToOneSchedule(student, teacher, oneToOneReqs) }));

  // 일괄 배정과 교시별 배정이 같은 강사 목록 UI를 쓰도록 카드 마크업을 공용 함수로 뽑았다.
  const renderTeacherOption = (teacher, fitHtml, actionHtml) => {
    const teacherName = teacher.nick || teacher.name;
    const searchText = `${teacherName} ${teacher.name || ''} ${teacher.fullName || ''} ${teacher.room || ''}`.toLowerCase();
    const grade = String(teacher.grade4ms || '').charAt(0).toUpperCase();
    const avatarSrc = teacher.photoUrl || (teacher.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png');
    const capableSubjectNames = (typeof getTeacherCapableSubjectIds === 'function' ? getTeacherCapableSubjectIds(teacher) : [])
      .map(id => MOCK_MASTER_SUBJECTS.find(s => s.id === id)).filter(Boolean).map(s => s.name);
    const capableLevelNames = (typeof getTeacherCapableLevelIds === 'function' ? getTeacherCapableLevelIds(teacher) : [])
      .map(id => MOCK_MASTER_LEVELS.find(l => l.id === id)).filter(Boolean).map(l => l.name);
    const tags = [
      ...(teacher.preferredCourses || []).map(tag => `<span class="teacher-tag pref">${esc(tag)}</span>`),
      ...capableSubjectNames.map(name => `<span class="teacher-tag cap">${esc(name)}</span>`),
      ...capableLevelNames.map(name => `<span class="teacher-tag level">${esc(name)}</span>`)
    ].join('');
    return `<div class="teacher-option" data-teacher-id="${teacher.id}" data-teacher-name="${esc(teacherName)}" data-room="${esc(teacher.room || '담당 강의실 없음')}" data-search="${esc(searchText)}" data-type="${esc((teacher.classTypes || []).join(','))}" data-grade="${esc(grade)}">
      <img class="teacher-avatar-img" src="${esc(avatarSrc)}" alt="${esc(teacherName)}"/>
      <span class="teacher-copy"><b>${esc(teacherName)} <small>(${teacher.gender === '여' ? 'F' : 'M'})</small></b><small>${esc(teacher.room || '담당 강의실 없음')} · ${esc(teacher.type || '일반')}</small>${tags ? `<span class="teacher-tags">${tags}</span>` : ''}</span>
      ${fitHtml}
      ${actionHtml}
    </div>`;
  };

  const pickerFilters = (searchId, typeId, gradeId, onEvent) => `
    <div class="picker-filters">
      <input id="${searchId}" class="teacher-search" type="search" placeholder="이름 또는 강의실 검색" oninput="${onEvent}">
      <select id="${typeId}" onchange="${onEvent}">
        <option value="">수업 유형 전체</option>
        <option value="1:1">1:1</option>
      </select>
      <select id="${gradeId}" onchange="${onEvent}">
        <option value="">등급 전체</option>
        <option value="A">A</option>
        <option value="B">B</option>
        <option value="C">C</option>
      </select>
    </div>`;

  // 교시별 배정: 교시를 누르면 그 자리에서 펼쳐지고, 일괄 배정과 같은 검색·강사 현황을 보여준 뒤 배정한다.
  const openSequence = Number(popup.__otoOpenSeq);
  const perPeriodRows = oneToOneReqs
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map(req => {
      const assignedTeacher = req.status === 'ASSIGNED' && req.teacherId != null
        ? MOCK_TEACHERS.find(t => t.id === req.teacherId)
        : null;
      const studentBusy = isStudentBusyAtPeriod(student, req.sequence, req.subjectId);
      const candidates = getOneToOneTeacherCandidates(student, req);
      const availableCount = candidates.filter(c => c.available).length;
      const isOpen = openSequence === req.sequence;
      const teacherCards = candidates.map(({ teacher, available, reason }) => {
        const isCurrent = assignedTeacher && assignedTeacher.id === teacher.id;
        const fitHtml = `<span class="teacher-fit ${available ? 'ok' : 'no'}">${available ? `${req.sequence}교시 배정 가능` : esc(reason)}</span>`;
        const actionHtml = isCurrent
          ? '<span class="badge ok">배정됨</span>'
          : `<button class="btn primary xs" type="button" ${available && !studentBusy ? '' : 'disabled'} onclick="assignOneToOnePeriod(this,'${esc(req.subjectId)}',${req.sequence})">선택 및 배정</button>`;
        return renderTeacherOption(teacher, fitHtml, actionHtml);
      }).join('') || '<div class="empty-hint">1:1 수업이 가능한 강사가 없어.</div>';
      const note = studentBusy
        ? '<div class="empty-hint">이 교시에 학생의 다른 수업이 이미 있어서 배정할 수 없어.</div>'
        : !availableCount
          ? '<div class="empty-hint">이 교시에 배정 가능한 강사가 없어. 아래 목록에서 사유를 확인해줘.</div>'
          : '';
      return `<div class="period-item ${assignedTeacher ? 'done' : 'pending'} ${isOpen ? 'open' : ''}" id="oto-item-${req.sequence}">
        <button type="button" class="period-head" onclick="toggleOneToOnePeriod(${req.sequence})">
          <span class="period-info">
            <b>${req.sequence}교시 · ${esc(req.subjectName)}</b>
            <span class="candidate-meta">${assignedTeacher ? `${esc(assignedTeacher.nick || assignedTeacher.name)} · ${esc(assignedTeacher.room || '-')}` : '강사 미배정'}</span>
          </span>
          <span class="badge ${assignedTeacher ? 'ok' : 'warn'}">${assignedTeacher ? '배정 완료' : '미배정'}</span>
          <span class="period-caret">${isOpen ? '▲' : '▼'}</span>
        </button>
        <div class="period-body" id="oto-body-${req.sequence}" style="display:${isOpen ? 'block' : 'none'}">
          ${note}
          ${pickerFilters(`oto-search-${req.sequence}`, `oto-type-${req.sequence}`, `oto-grade-${req.sequence}`, `filterPeriodTeachers(${req.sequence})`)}
          <div id="oto-list-${req.sequence}" class="teacher-list">
            ${teacherCards}
            <div id="oto-empty-${req.sequence}" class="empty-hint" style="display:none">검색 조건에 맞는 강사가 없어.</div>
          </div>
          <div class="period-actions">
            ${assignedTeacher ? `<button class="btn outline xs" onclick="unassignOneToOne('${esc(req.subjectId)}',${req.sequence})">배정 해제</button>` : ''}
            <button class="btn outline xs" onclick="toggleOneToOnePeriod(${req.sequence})">완료</button>
          </div>
        </div>
      </div>`;
    }).join('') || '<div class="empty-hint">1:1 수업 요구사항이 없어.</div>';

  const perPeriodSection = `
    <div class="req-card">
      <div class="req-head"><b>교시별 강사 배정</b><span class="candidate-meta">${oneToOneAssigned.length}/${oneToOneReqs.length}교시 배정됨</span></div>
      <div class="stack" style="margin-top:9px">${perPeriodRows}</div>
      <div class="hint">교시를 누르면 그 교시에 배정할 수 있는 강사 현황이 펼쳐져. 근무하지 않거나 다른 수업이 있는 강사는 사유가 표시되고 선택할 수 없어.</div>
    </div>`;

  const oneToOneSection = `
    <div class="req-card">
      <div class="req-head"><b>담당 1:1 강사</b>${primaryTeacher ? `<span class="primary-teacher-name">${esc(primaryTeacher.nick || primaryTeacher.name)}</span>` : ''}</div>
      <div class="inline-teacher-picker">
        ${pickerFilters('sla-teacher-search', 'sla-teacher-type', 'sla-teacher-grade', 'filterTeachers()')}
        <div id="sla-teacher-list" class="teacher-list">
        ${primaryTeacher ? renderTeacherOption(
          primaryTeacher,
          `<span class="teacher-fit ok">현재 담당 · ${oneToOneReqs.length}교시</span>`,
          '<span class="badge ok">현재 배정됨</span>'
        ) : ''}
        ${teacherCandidates.filter(({ plan }) => plan.ok).map(({ teacher }) => renderTeacherOption(
          teacher,
          `<span class="teacher-fit ok">자동 배치 가능 · ${oneToOneReqs.length}교시</span>`,
          `<button class="btn primary xs" type="button" onclick="assignPrimaryTeacher(this)">${primaryTeacher ? '변경' : '선택 및 자동 배정'}</button>`
        )).join('') || (primaryTeacher ? '' : '<div class="empty-hint">배정 가능한 1:1 강사가 없어.</div>')}
          <div id="sla-teacher-empty" class="empty-hint" style="display:none">검색 조건에 맞는 담당 가능 강사가 없어.</div>
        </div>
      </div>
      <div class="hint">강사를 선택하면 가용 시간과 학생·강사·그룹 수업 중복을 확인한 뒤 모든 1:1 수업을 바로 자동 배치해.</div>
    </div>
    ${oneToOneReqs.length && !oneToOneAssigned.length ? `<div class="req-card pending"><b>자동 배치 대기</b><div class="req-sub">${oneToOneReqs.map(req => `${req.sequence}교시 · ${esc(req.subjectName)}`).join(' / ')}</div></div>` : ''}
    ${oneToOneAssigned.length ? `<div class="stack">
      ${oneToOneAssigned.map(req => {
        const teacher = req.teacherId != null ? MOCK_TEACHERS.find(t => t.id === req.teacherId) : null;
        const room = teacher?.room || '-';
        return `<div class="req-card done row">
          <div class="candidate-info"><b>${req.sequence}교시 · ${esc(req.subjectName)}</b><div class="candidate-meta">${esc(lessonFormatDays(req.dayOfWeek))} ${req.period || ''}교시 · ${esc(teacher?.nick || '-')} · ${esc(room)}</div></div>
          <button class="btn outline xs" onclick="unassignOneToOne('${req.subjectId}',${req.sequence})">해제</button>
        </div>`;
      }).join('')}
    </div>` : ''}
  `;

  // 팝업이 자기 자신을 다시 그릴 때(교시별 배정 후) 보고 있던 모드를 유지한다.
  const oneToOneMode = popup.__otoMode === 'period' ? 'period' : 'bulk';
  const oneToOneBody = `
    <div class="mode-tabs">
      <button type="button" class="mode-tab ${oneToOneMode === 'bulk' ? 'on' : ''}" onclick="switchOneToOneMode('bulk')">강사 일괄 배정</button>
      <button type="button" class="mode-tab ${oneToOneMode === 'period' ? 'on' : ''}" onclick="switchOneToOneMode('period')">교시별 강사 배정</button>
    </div>
    <div id="oto-mode-bulk" style="display:${oneToOneMode === 'bulk' ? 'block' : 'none'}">${oneToOneSection}</div>
    <div id="oto-mode-period" style="display:${oneToOneMode === 'period' ? 'block' : 'none'}">${perPeriodSection}</div>`;

  popup.document.open();
  const assignmentTitle = focusClassType ? `${focusClassType} 수업 배정` : '수업 배정';
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>${esc(student.nick || student.name)} ${assignmentTitle}</title>
    <style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{padding:18px 20px;background:#fff;border-bottom:1px solid #E5E7EB}.student-header{display:flex;align-items:center;gap:12px}.student-header-avatar{width:48px;height:48px;flex:0 0 48px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;background:#F3F4F6}.student-header-copy{min-width:0;flex:1}h1{font-size:16px;margin:0}.meta{font-size:11px;color:#6B7280;margin-top:4px}.student-time{display:flex;align-items:flex-start;gap:6px;margin-top:9px;padding:7px 9px;border-radius:8px;background:#F5F3FF;color:#4338CA;line-height:1.5}.student-time b{white-space:nowrap}
      main{padding:16px 20px 30px}h2{font-size:12px;margin:0 0 8px}
      .section-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}.section-head h2{margin:0}
      .mode-tabs{display:flex;gap:2px;margin-bottom:10px;border-bottom:1px solid #E5E7EB}
      .mode-tab{padding:7px 13px;border:0;background:none;font-size:11px;font-weight:800;color:#6B7280;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
      .mode-tab.on{color:#5E5CE6;border-bottom-color:#5E5CE6}
      .period-item{border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;background:#fff}
      .period-item.done{border-color:#D1FAE5}.period-item.pending{border-color:#FED7AA}
      .period-item.open{border-color:#5E5CE6;box-shadow:0 0 0 2px rgba(94,92,230,.12)}
      .period-head{display:flex;align-items:center;gap:8px;width:100%;padding:10px 11px;border:0;background:#fff;cursor:pointer;text-align:left}
      .period-item.done .period-head{background:#ECFDF5}.period-item.pending .period-head{background:#FFF7ED}
      .period-info{flex:1;min-width:0;font-size:11px;display:flex;flex-direction:column;gap:2px}
      .period-caret{font-size:9px;color:#6B7280}
      .period-body{padding:11px;border-top:1px solid #E5E7EB;background:#F8FAFC}
      .period-body .teacher-list{background:#fff;max-height:300px}
      .period-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:9px}
      .teacher-option button[disabled]{opacity:.45;cursor:not-allowed}
      .req-card{padding:11px;border:1px solid #E5E7EB;background:#fff;border-radius:10px;margin-bottom:8px}
      .req-card.pending{border-color:#FED7AA;background:#FFF7ED}.req-card.done{border-color:#D1FAE5;background:#ECFDF5}
      .req-card.row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
      .req-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:11.5px}
      .req-sub{font-size:10.5px;color:#4B5563;margin-top:5px}
      .req-title{font-size:11px;flex:1;min-width:110px}
      .badge{border-radius:6px;padding:2px 7px;font-size:9.5px;font-weight:800}.badge.ok{background:#D1FAE5;color:#047857}.badge.warn{background:#FED7AA;color:#C2410C}
      .candidates{display:flex;flex-direction:column;gap:6px;margin-top:8px}
      .candidate-row{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px;background:#fff;border:1px solid #E5E7EB;border-radius:8px}
      .candidate-row.selected{border-color:#6366F1;background:#EEF2FF;box-shadow:0 0 0 2px rgba(99,102,241,.1)}
      .candidate-row.recent{border-color:#818CF8;background:#F5F3FF;box-shadow:0 0 0 2px rgba(99,102,241,.1)}.new-group-badge{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:999px;background:#E0E7FF;color:#4338CA;font-size:9px;vertical-align:1px}
      .candidate-info{font-size:10.5px}.candidate-meta{color:#6B7280;margin-top:2px}
      .empty-hint{font-size:10.5px;color:#9CA3AF}
      .inline-create{display:none;margin-bottom:10px;padding:12px;border:1px solid #C7D2FE;border-radius:10px;background:#F8FAFF}.inline-create.open{display:block}.inline-create-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.inline-create-head b{font-size:12px}.inline-create-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:9px}.inline-create label.title{display:block;margin-bottom:5px;font-size:10px;font-weight:800;color:#4B5563}.day-picks{display:flex;gap:5px;flex-wrap:wrap}.day-pick{display:flex;align-items:center;gap:4px;height:32px;padding:0 8px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;font-size:10.5px}.inline-create-actions{display:flex;justify-content:flex-end;gap:6px;margin-top:10px}.inline-summary{margin-top:8px;padding:8px 9px;border-radius:7px;background:#EEF2FF;color:#4338CA;font-size:10.5px}
      .entity-toggle{position:relative;width:100%;height:38px;padding:0 34px 0 10px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;text-align:left;cursor:pointer;font-size:11px;color:#111827}.entity-toggle.placeholder{color:#9CA3AF}.entity-toggle:after{content:'▼';position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:8px;color:#6B7280}.entity-toggle[aria-expanded="true"]:after{content:'▲'}
      .entity-panel{margin-top:7px;border:1px solid #C7D2FE;border-radius:8px;background:#fff;padding:9px}
      .entity-search{width:100%;height:30px;padding:0 8px;border:1px solid #D1D5DB;border-radius:6px;margin-bottom:6px;font-size:11px}
      .entity-options{max-height:220px;overflow-y:auto;border-top:1px solid #E5E7EB}
      .entity-option{padding:10px 8px;border-bottom:1px solid #E5E7EB;font-size:11px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:9px}.entity-option:last-child{border-bottom:0}.entity-option:hover{background:#F8FAFC}.entity-option.selected{background:#EEF2FF;color:#4338CA;font-weight:700}.entity-main{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.entity-main small{font-size:9.5px;color:#6B7280;font-weight:400}.entity-status{flex:0 0 auto;color:#047857;font-size:9.5px;font-weight:800}.entity-avatar{width:32px;height:32px;flex:0 0 32px;border-radius:50%;object-fit:cover;background:#F3F4F6}.teacher-capabilities{display:flex;flex-direction:column;gap:3px;margin-top:3px}.capability-line{display:flex;align-items:flex-start;gap:4px;flex-wrap:wrap}.capability-title{min-width:44px;padding-top:2px;color:#6B7280;font-size:8.5px;font-weight:700}.capability-tag{padding:2px 6px;border-radius:999px;font-size:8.5px;font-weight:700;line-height:1.2}.capability-tag.course{background:#D1FAE5;color:#047857}.capability-tag.subject{background:#E0F2FE;color:#0369A1}.capability-tag.level{background:#F3E8FF;color:#7E22CE}.capability-empty{padding-top:2px;color:#9CA3AF;font-size:8.5px}
      .resource-grid{display:flex;flex-direction:column;gap:9px}.resource-box{min-width:0;padding:10px;border:1px solid #E5E7EB;border-radius:9px;background:#F8FAFC}.resource-box.open{border-color:#6366F1;background:#F5F3FF;box-shadow:0 0 0 2px rgba(99,102,241,.08)}.resource-label{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;font-size:10.5px;font-weight:800}.selected-resource{color:#4F46E5;font-size:9.5px;font-weight:700}
      .entity-empty{padding:8px 9px;font-size:10.5px;color:#9CA3AF}
      .primary-teacher-name{font-size:11px;color:#4338CA;font-weight:800}
      select,input{height:34px;border:1px solid #D1D5DB;border-radius:7px;padding:0 8px;font-size:11px}
      .inline-teacher-picker{margin-top:9px}.teacher-search{width:100%}
      .picker-filters{display:grid;grid-template-columns:minmax(220px,1fr) 150px 130px;gap:8px;margin-bottom:8px}
      .teacher-list{display:flex;flex-direction:column;gap:0;min-height:150px;max-height:360px;overflow:auto;border:1px solid #E5E7EB;border-radius:9px}
      .teacher-option{display:flex;align-items:center;gap:8px;padding:9px;border:1px solid #E5E7EB;border-radius:8px;background:#fff;cursor:pointer}
      .teacher-list .teacher-option{border:0;border-bottom:1px solid #E5E7EB;border-radius:0;padding:13px 15px}.teacher-list .teacher-option:last-of-type{border-bottom:0}
      .teacher-avatar{display:flex;align-items:center;justify-content:center;width:34px;height:34px;flex:0 0 34px;border-radius:50%;background:#EEF2FF;color:#4F46E5;font-weight:900}
      .teacher-avatar-img{width:34px;height:34px;flex:0 0 34px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB}
      .teacher-tags{display:flex;flex-wrap:wrap;gap:3px;margin-top:3px}
      .teacher-tag{font-size:9px;padding:1px 6px;border-radius:7px;font-weight:600}
      .teacher-tag.pref{background:#D1FAE5;color:#065F46}
      .teacher-tag.cap{background:#E0F2FE;color:#0369A1}
      .teacher-tag.level{background:#F3E8FF;color:#7E22CE}
      .teacher-copy{display:flex;flex-direction:column;flex:1;font-size:11px}.teacher-copy small{color:#6B7280;margin-top:2px}
      .teacher-fit{font-size:9.5px;font-weight:800}.teacher-fit.ok{color:#047857}.teacher-fit.no{color:#B45309}
      .hint{font-size:9.5px;color:#6B7280;margin-top:5px}
      .stack{margin-top:10px;display:flex;flex-direction:column;gap:8px}
      .btn{padding:7px 11px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;cursor:pointer;font-size:11px}
      .btn.primary{background:#5E5CE6;color:#fff;border-color:#5E5CE6}.btn.outline{background:#fff}.btn.xs{padding:6px 9px;font-size:10.5px}
      footer{position:sticky;bottom:0;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:14px 20px;background:#fff;border-top:1px solid #E5E7EB}.selection-count{margin-right:auto;font-size:11px;color:#6B7280}.btn[disabled]{opacity:.45;cursor:not-allowed}
      @media(max-width:700px){.picker-filters,.inline-create-grid{grid-template-columns:1fr}.teacher-option{flex-wrap:wrap}.teacher-fit{margin-left:42px}}
    </style></head><body>
    <header><div class="student-header"><img class="student-header-avatar" src="${esc(studentAvatarSrc)}" alt="${esc(student.nick || student.name)}"><div class="student-header-copy"><h1>${esc(student.nick || student.name)} ${assignmentTitle}</h1><div class="meta">${esc(student.name || '')} · ${esc(student.course || '-')} · ${esc(student.level || '-')}</div><div class="meta">${esc(student.flag || '')} ${esc(student.nationality || '-')} · ${esc(student.gender || '-')}성 · ${student.age != null ? `${student.age}세` : '나이 미등록'}</div></div></div><div class="meta student-time"><b>학생 수업 시간</b><span>${studentTimeLabel}</span></div></header>
    <main>
      ${focusClassType !== '1:1' ? `${Number.isFinite(recentGroupId) ? `<div style="padding:10px 12px;margin-bottom:10px;border:1px solid #C7D2FE;border-radius:9px;background:#EEF2FF;color:#4338CA;font-size:11px;font-weight:700">그룹만 생성했어. ${esc(student.nick || student.name)} 학생은 아직 미배정 상태야. 아래의 방금 만든 그룹을 확인하고 직접 배정해줘.</div>` : ''}<div class="section-head"><h2>${focusClassType || '그룹'} 수업</h2><button class="btn outline xs" onclick="toggleInlineGroupCreate(true)">+ 새 그룹 만들기</button></div>
      <div id="inline-group-create" class="inline-create">
        <div class="inline-create-head"><b>새 그룹 만들기</b><button class="btn outline xs" onclick="toggleInlineGroupCreate(false)">접기</button></div>
        <div class="inline-create-grid">
          <div><label class="title">수업 유형 · 과목</label><select id="inline-group-row" style="width:100%" onchange="renderInlineGroupSummary();renderInlineGroupResources()">${inlineGroupCreateRows.map((row, index) => `<option value="${index}">${esc(row.classType)} · ${esc(row.subjectName)}</option>`).join('')}</select></div>
          <div><label class="title">레벨</label><input style="width:100%;background:#F3F4F6" value="${esc(getLevelGroupName(level))}" disabled></div>
        </div>
        <div style="margin-top:9px"><label class="title">운영 요일</label><div class="day-picks">${LESSON_DAYS.map(day => `<label class="day-pick"><input type="checkbox" class="inline-group-day" value="${day}" checked onchange="renderInlineGroupSummary();renderInlineGroupResources()">${day}</label>`).join('')}</div></div>
        <div style="margin-top:9px"><label class="title">강사·강의실 배정</label><div class="resource-grid">
          <div id="inline-teacher-box" class="resource-box"><div class="resource-label"><span>담당 강사</span><span id="inline-teacher-selected" class="selected-resource">미선택</span></div><button type="button" id="inline-teacher-toggle" class="entity-toggle placeholder" aria-expanded="false" onclick="toggleInlineTeacherPanel()">강사 검색하기</button><div id="inline-teacher-panel" class="entity-panel" style="display:none"><input id="inline-teacher-search" class="entity-search" placeholder="이름 또는 담당 강의실 검색" oninput="filterInlineTeacherPanel()"><div id="inline-teacher-options" class="entity-options"></div></div></div>
          <div id="inline-room-box" class="resource-box"><div class="resource-label"><span>강의실</span><span id="inline-room-selected" class="selected-resource">미선택</span></div><button type="button" id="inline-room-toggle" class="entity-toggle placeholder" aria-expanded="false" onclick="toggleInlineRoomPanel()">강의실 검색하기</button><div id="inline-room-panel" class="entity-panel" style="display:none"><input id="inline-room-search" class="entity-search" placeholder="강의실명 검색" oninput="filterInlineRoomPanel()"><div id="inline-room-options" class="entity-options"></div></div></div>
        </div><div id="inline-group-resource-hint" class="hint" style="margin-top:6px"></div></div>
        <div id="inline-group-summary" class="inline-summary"></div>
        <div class="inline-create-actions"><button class="btn outline xs" onclick="toggleInlineGroupCreate(false)">취소</button><button id="inline-group-save" class="btn primary xs" onclick="saveInlineGroup()">그룹 만들기</button></div>
      </div>${groupRows}` : ''}
      ${!focusClassType || focusClassType === '1:1' ? `<h2${focusClassType ? '' : ' style="margin-top:14px"'}>1:1 수업</h2>${oneToOneReqs.length ? oneToOneBody : '<div class="empty-hint">1:1 수업 요구사항이 없어.</div>'}` : ''}
    </main>
    <footer>${pendingGroupReqs.length ? `<span id="group-selection-count" class="selection-count">0/${pendingGroupReqs.length}개 선택</span>` : ''}<button class="btn outline" onclick="window.close()">닫기</button>${pendingGroupReqs.length ? '<button id="confirm-group-assignments" class="btn primary" disabled onclick="confirmGroupAssignments()">선택한 수업 배정하기</button>' : ''}</footer>
    <script>
      var inlineGroupRows=${JSON.stringify(inlineGroupCreateRows).replace(/</g, '\u003c')};
      var inlineTeacherId=null;
      var inlineRoomId=null;
      var inlineTeacherOptionsList=[];
      var inlineRoomOptionsList=[];
      var requiredGroupSelectionCount=${pendingGroupReqs.length};
      var selectedGroupAssignments={};
      function notifyOpener(payload){
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return false;}
        window.opener.postMessage(Object.assign({channel:'tsa-group-popup'},payload),'*');
        return true;
      }
      function toggleInlineGroupCreate(show){
        var panel=document.getElementById('inline-group-create');
        if(!panel)return;
        panel.classList.toggle('open',show===true);
        if(show){renderInlineGroupSummary();renderInlineGroupResources();}
      }
      function getInlineGroupRow(){
        var select=document.getElementById('inline-group-row');
        return inlineGroupRows[Number(select&&select.value)||0];
      }
      function renderInlineGroupResources(){
        var row=getInlineGroupRow();
        var days=Array.from(document.querySelectorAll('.inline-group-day:checked')).map(function(input){return input.value});
        var ready=!!(row&&days.length);
        var capacity=row?getGroupClassCapacity(row.classType):1;
        inlineTeacherOptionsList=ready?getGroupTeacherCandidates(row.classType,days,[row.sequence],null):[];
        inlineRoomOptionsList=ready?getGroupRoomCandidates(row.classType,days,[row.sequence],capacity,null):[];
        if(inlineTeacherId!=null&&!inlineTeacherOptionsList.some(function(t){return t.id===inlineTeacherId}))inlineTeacherId=null;
        if(inlineRoomId!=null&&!inlineRoomOptionsList.some(function(r){return r.id===inlineRoomId}))inlineRoomId=null;
        updateInlineResourceLabels();
        var teacherPanel=document.getElementById('inline-teacher-panel');
        var roomPanel=document.getElementById('inline-room-panel');
        if(teacherPanel&&teacherPanel.style.display!=='none')renderInlineTeacherOptions(document.getElementById('inline-teacher-search').value);
        if(roomPanel&&roomPanel.style.display!=='none')renderInlineRoomOptions(document.getElementById('inline-room-search').value);
        var hint=document.getElementById('inline-group-resource-hint');
        if(hint){
          if(!ready)hint.textContent='운영 요일을 선택하면 배정 가능한 강사·강의실을 보여줘.';
          else if(!inlineTeacherOptionsList.length)hint.textContent='선택한 요일·교시에 가능한 강사가 없어.';
          else if(!inlineRoomOptionsList.length)hint.textContent='선택한 요일·교시에 가능한 강의실이 없어.';
          else hint.textContent='';
        }
      }
      function updateInlineResourceLabels(){
        var teacher=inlineTeacherId!=null?inlineTeacherOptionsList.find(function(t){return t.id===inlineTeacherId}):null;
        var room=inlineRoomId!=null?inlineRoomOptionsList.find(function(r){return r.id===inlineRoomId}):null;
        var teacherToggle=document.getElementById('inline-teacher-toggle');
        var roomToggle=document.getElementById('inline-room-toggle');
        if(teacherToggle){teacherToggle.textContent=teacher?(teacher.nick||teacher.name):'강사 검색하기';teacherToggle.classList.toggle('placeholder',!teacher);}
        if(roomToggle){roomToggle.textContent=room?(room.roomNo+' ('+room.type+', 최대 '+room.capacity+'명)'):'강의실 검색하기';roomToggle.classList.toggle('placeholder',!room);}
        var teacherLabel=document.getElementById('inline-teacher-selected');
        var roomLabel=document.getElementById('inline-room-selected');
        if(teacherLabel)teacherLabel.textContent=teacher?(teacher.nick||teacher.name):'미선택';
        if(roomLabel)roomLabel.textContent=room?room.roomNo:'미선택';
      }
      function toggleInlineTeacherPanel(){
        var panel=document.getElementById('inline-teacher-panel');
        if(!panel)return;
        var willOpen=panel.style.display==='none';
        var roomPanel=document.getElementById('inline-room-panel');
        if(roomPanel){roomPanel.style.display='none';document.getElementById('inline-room-toggle').setAttribute('aria-expanded','false');document.getElementById('inline-room-box').classList.remove('open');}
        panel.style.display=willOpen?'block':'none';
        document.getElementById('inline-teacher-toggle').setAttribute('aria-expanded',willOpen?'true':'false');
        document.getElementById('inline-teacher-box').classList.toggle('open',willOpen);
        if(willOpen){document.getElementById('inline-teacher-search').value='';renderInlineTeacherOptions('');document.getElementById('inline-teacher-search').focus();}
      }
      function toggleInlineRoomPanel(){
        var panel=document.getElementById('inline-room-panel');
        if(!panel)return;
        var willOpen=panel.style.display==='none';
        var teacherPanel=document.getElementById('inline-teacher-panel');
        if(teacherPanel){teacherPanel.style.display='none';document.getElementById('inline-teacher-toggle').setAttribute('aria-expanded','false');document.getElementById('inline-teacher-box').classList.remove('open');}
        panel.style.display=willOpen?'block':'none';
        document.getElementById('inline-room-toggle').setAttribute('aria-expanded',willOpen?'true':'false');
        document.getElementById('inline-room-box').classList.toggle('open',willOpen);
        if(willOpen){document.getElementById('inline-room-search').value='';renderInlineRoomOptions('');document.getElementById('inline-room-search').focus();}
      }
      function filterInlineTeacherPanel(){renderInlineTeacherOptions(document.getElementById('inline-teacher-search').value);}
      function renderInlineTeacherOptions(query){
        query=(query||'').trim().toLowerCase();
        var box=document.getElementById('inline-teacher-options');
        if(!box)return;
        var matches=inlineTeacherOptionsList.filter(function(t){
          var name=(t.nick||t.name||'').toLowerCase();
          var room=(t.room||'').toLowerCase();
          return !query||name.indexOf(query)>-1||room.indexOf(query)>-1;
        });
        box.innerHTML=matches.length?matches.map(function(t){
          var selected=t.id===inlineTeacherId;
          var avatar=t.photoUrl||('assets/images/'+(t.gender==='남'?'teacher_male.png':'teacher_female.png'));
          var typeText=(t.type||'일반')+' · '+((t.classTypes||[]).join(', ')||'그룹 수업');
          var subjects=(typeof getTeacherCapableSubjectIds==='function'?getTeacherCapableSubjectIds(t):[]).map(function(id){var item=MOCK_MASTER_SUBJECTS.find(function(subject){return subject.id===id});return item?item.name:id});
          var levels=(typeof getTeacherCapableLevelIds==='function'?getTeacherCapableLevelIds(t):[]).map(function(id){var item=MOCK_MASTER_LEVELS.find(function(level){return level.id===id});return item?item.name:id});
          function capabilityLine(title,items,type){return '<span class="capability-line"><span class="capability-title">'+title+'</span>'+(items.length?items.map(function(item){return '<span class="capability-tag '+type+'">'+item+'</span>'}).join(''):'<span class="capability-empty">등록 없음</span>')+'</span>'}
          var capabilities='<span class="teacher-capabilities">'+capabilityLine('가능 과목',subjects,'subject')+capabilityLine('가능 레벨',levels,'level')+'</span>';
          return '<div class="entity-option'+(selected?' selected':'')+'" onmousedown="selectInlineTeacherOption('+t.id+')"><img class="entity-avatar" src="'+avatar+'"><span class="entity-main"><b>'+(t.nick||t.name)+' '+(t.gender==='여'?'(F)':'(M)')+'</b><small>'+(t.room||'담당 강의실 없음')+' · '+typeText+'</small>'+capabilities+'</span><span class="entity-status">배정 가능</span></div>';
        }).join(''):'<div class="entity-empty">배정 가능한 강사가 없어.</div>';
      }
      function selectInlineTeacherOption(id){
        inlineTeacherId=id;
        var panel=document.getElementById('inline-teacher-panel');
        if(panel)panel.style.display='none';
        document.getElementById('inline-teacher-toggle').setAttribute('aria-expanded','false');
        document.getElementById('inline-teacher-box').classList.remove('open');
        updateInlineResourceLabels();
        if(inlineRoomId==null)toggleInlineRoomPanel();
      }
      function filterInlineRoomPanel(){renderInlineRoomOptions(document.getElementById('inline-room-search').value);}
      function renderInlineRoomOptions(query){
        query=(query||'').trim().toLowerCase();
        var box=document.getElementById('inline-room-options');
        if(!box)return;
        var matches=inlineRoomOptionsList.filter(function(r){return !query||(r.roomNo||'').toLowerCase().indexOf(query)>-1||(r.type||'').toLowerCase().indexOf(query)>-1;});
        box.innerHTML=matches.length?matches.map(function(r){
          var selected=r.id===inlineRoomId;
          return '<div class="entity-option'+(selected?' selected':'')+'" onmousedown="selectInlineRoomOption('+r.id+')"><span class="entity-main"><b>'+r.roomNo+'</b><small>'+r.type+' · 최대 '+r.capacity+'명</small></span><span class="entity-status">배정 가능</span></div>';
        }).join(''):'<div class="entity-empty">배정 가능한 강의실이 없어.</div>';
      }
      function selectInlineRoomOption(id){
        inlineRoomId=id;
        var panel=document.getElementById('inline-room-panel');
        if(panel)panel.style.display='none';
        document.getElementById('inline-room-toggle').setAttribute('aria-expanded','false');
        document.getElementById('inline-room-box').classList.remove('open');
        updateInlineResourceLabels();
      }
      document.addEventListener('mousedown',function(e){
        var teacherPanel=document.getElementById('inline-teacher-panel');
        var roomPanel=document.getElementById('inline-room-panel');
        if(teacherPanel&&teacherPanel.style.display!=='none'&&!teacherPanel.contains(e.target)&&e.target!==document.getElementById('inline-teacher-toggle')){
          teacherPanel.style.display='none';
          document.getElementById('inline-teacher-toggle').setAttribute('aria-expanded','false');
          document.getElementById('inline-teacher-box').classList.remove('open');
        }
        if(roomPanel&&roomPanel.style.display!=='none'&&!roomPanel.contains(e.target)&&e.target!==document.getElementById('inline-room-toggle')){
          roomPanel.style.display='none';
          document.getElementById('inline-room-toggle').setAttribute('aria-expanded','false');
          document.getElementById('inline-room-box').classList.remove('open');
        }
      });
      function renderInlineGroupSummary(){
        var row=getInlineGroupRow();
        var days=Array.from(document.querySelectorAll('.inline-group-day:checked')).map(function(input){return input.value});
        var summary=document.getElementById('inline-group-summary');
        if(summary)summary.textContent=row?(row.sequence+'교시 · '+row.classType+' · '+row.subjectName+' · '+(days.length?days.join(',')+'요일':'요일을 선택해')):'생성할 수업을 선택해.';
      }
      function saveInlineGroup(){
        var row=getInlineGroupRow();
        var days=Array.from(document.querySelectorAll('.inline-group-day:checked')).map(function(input){return input.value});
        if(!row){window.alert('생성할 수업을 선택해.');return;}
        if(!days.length){window.alert('운영 요일을 1개 이상 선택해.');return;}
        var button=document.getElementById('inline-group-save');
        if(button){button.disabled=true;button.textContent='생성 중...';}
        notifyOpener({action:'save-group',groupId:null,payload:{curriculum:[{id:row.subjectId,hours:1}],course:${JSON.stringify(student.course || '')},levelGroups:[${level}],classType:row.classType,nationalityCap:null,startDate:${JSON.stringify(student.startDate || '2026-06-22')},endDate:${JSON.stringify(student.departureDate || '')},weeklyFrequency:days.length,periods:[row.sequence],dayOfWeek:days,teacherId:inlineTeacherId,roomId:inlineRoomId,seedStudentId:${student.id},assignSeedStudent:false},returnToStudentAssignment:{studentId:${student.id},classType:row.classType}});
      }
      window.addEventListener('message',function(event){
        var message=event.data;
        if(!message||message.channel!=='tsa-group-popup')return;
        if(message.action==='save-group-result'){
          if(!message.result||!message.result.ok){var button=document.getElementById('inline-group-save');if(button){button.disabled=false;button.textContent='그룹 만들기';}window.alert(message.result&&message.result.message?message.result.message:'그룹을 저장하지 못했어.');return;}
          var url=new URL(window.location.href);
          url.searchParams.set('createdGroup',String(message.result.createdGroupId));
          window.location.replace(url.href);
          return;
        }
        if(message.action==='assign-student-group-selections-result'){
          var confirmButton=document.getElementById('confirm-group-assignments');
          if(!message.result||!message.result.ok){if(confirmButton){confirmButton.disabled=false;confirmButton.textContent='선택한 수업 배정하기';}window.alert(message.result&&message.result.message?message.result.message:'학생을 배정하지 못했어.');return;}
          var refreshedUrl=new URL(window.location.href);
          refreshedUrl.searchParams.delete('createdGroup');
          window.location.replace(refreshedUrl.href);
        }
      });
      function selectGroupForRequirement(requirementIndex,groupId,button){
        var card=button.closest('[data-group-requirement]');
        if(!card)return;
        card.querySelectorAll('.candidate-row').forEach(function(row){row.classList.remove('selected')});
        card.querySelectorAll('.group-select-btn').forEach(function(item){item.classList.remove('primary');item.classList.add('outline');item.textContent='선택하기'});
        button.closest('.candidate-row').classList.add('selected');
        button.classList.remove('outline');button.classList.add('primary');button.textContent='선택됨';
        selectedGroupAssignments[requirementIndex]={requirementIndex:requirementIndex,groupId:groupId};
        updateGroupSelectionState();
      }
      function updateGroupSelectionState(){
        var count=Object.keys(selectedGroupAssignments).length;
        var label=document.getElementById('group-selection-count');
        var button=document.getElementById('confirm-group-assignments');
        if(label)label.textContent=count+'/'+requiredGroupSelectionCount+'개 선택';
        if(button)button.disabled=count!==requiredGroupSelectionCount;
      }
      function confirmGroupAssignments(){
        if(Object.keys(selectedGroupAssignments).length!==requiredGroupSelectionCount){window.alert('각 수업마다 배정할 그룹을 하나씩 선택해.');return;}
        var button=document.getElementById('confirm-group-assignments');
        if(button){button.disabled=true;button.textContent='배정 중...';}
        if(!notifyOpener({action:'assign-student-group-selections',studentId:${student.id},assignments:Object.values(selectedGroupAssignments)})&&button){button.disabled=false;button.textContent='선택한 수업 배정하기';}
      }
      function changeAssignedGroup(fromGroupId,toGroupId){
        if(notifyOpener({action:'change-student-group',studentId:${student.id},fromGroupId:fromGroupId,toGroupId:toGroupId})) window.close();
      }
      function assignPrimaryTeacher(button){
        var option=button.closest('.teacher-option');
        var teacherId=Number(option.dataset.teacherId);
        var teacherName=option.dataset.teacherName;
        var currentName=${JSON.stringify(primaryTeacher ? (primaryTeacher.nick || primaryTeacher.name) : null)};
        if(currentName && !window.confirm(currentName+' → '+teacherName+'(으)로 담당 강사를 변경할까? 배정된 모든 1:1 수업이 새 강사로 다시 배치돼.')) return;
        if(notifyOpener({action:'save-primary-teacher',studentId:${student.id},teacherId:teacherId})) window.close();
      }
      function filterTeacherList(searchId,typeId,gradeId,listId,emptyId){
        var searchEl=document.getElementById(searchId);
        var listEl=document.getElementById(listId);
        if(!searchEl||!listEl) return;
        var query=(searchEl.value||'').trim().toLowerCase();
        var type=document.getElementById(typeId).value;
        var grade=document.getElementById(gradeId).value;
        var visible=0;
        listEl.querySelectorAll('.teacher-option').forEach(function(row){
          var matches=(!query||row.dataset.search.indexOf(query)>-1)&&(!type||row.dataset.type.split(',').indexOf(type)>-1)&&(!grade||row.dataset.grade===grade);
          row.style.display=matches?'flex':'none';
          if(matches) visible++;
        });
        var emptyEl=document.getElementById(emptyId);
        if(emptyEl) emptyEl.style.display=visible?'none':'block';
      }
      function filterTeachers(){
        filterTeacherList('sla-teacher-search','sla-teacher-type','sla-teacher-grade','sla-teacher-list','sla-teacher-empty');
      }
      function filterPeriodTeachers(sequence){
        filterTeacherList('oto-search-'+sequence,'oto-type-'+sequence,'oto-grade-'+sequence,'oto-list-'+sequence,'oto-empty-'+sequence);
      }
      // 한 번에 한 교시만 펼친다. 펼친 교시는 다시 그릴 때도 유지된다.
      function toggleOneToOnePeriod(sequence){
        var body=document.getElementById('oto-body-'+sequence);
        if(!body) return;
        var willOpen=body.style.display==='none';
        document.querySelectorAll('.period-body').forEach(function(el){el.style.display='none';});
        document.querySelectorAll('.period-item').forEach(function(el){el.classList.remove('open');});
        document.querySelectorAll('.period-caret').forEach(function(el){el.textContent='▼';});
        window.__otoOpenSeq=willOpen?sequence:null;
        if(!willOpen) return;
        body.style.display='block';
        var item=document.getElementById('oto-item-'+sequence);
        if(item){item.classList.add('open');var caret=item.querySelector('.period-caret');if(caret)caret.textContent='▲';}
        var search=document.getElementById('oto-search-'+sequence);
        if(search) search.focus();
      }
      function switchOneToOneMode(mode){
        window.__otoMode=mode;
        document.getElementById('oto-mode-bulk').style.display=mode==='bulk'?'block':'none';
        document.getElementById('oto-mode-period').style.display=mode==='period'?'block':'none';
        document.querySelectorAll('.mode-tab').forEach(function(tab,index){
          tab.classList.toggle('on',(index===0)===(mode==='bulk'));
        });
      }
      // 교시별 배정은 여러 번 반복하는 작업이라 창을 닫지 않고, 부모 창과 이 창의 데이터를 같이 갱신한 뒤 다시 그린다.
      function redrawStudentAssignment(){
        window.openStudentLessonAssignment(${student.id},window,'${focusClassType || ''}');
      }
      function assignOneToOnePeriod(button,subjectId,sequence){
        var option=button.closest('.teacher-option');
        var teacherId=Number(option&&option.dataset.teacherId);
        if(!teacherId){window.alert('배정할 강사를 선택해줘.');return;}
        if(!notifyOpener({action:'save-one-to-one-schedule',studentId:${student.id},subjectId:subjectId,teacherId:teacherId,period:sequence,templateSequence:sequence})) return;
        var result=window.saveStudentOneToOneSchedule(${student.id},subjectId,teacherId,sequence,sequence);
        if(!result.ok){window.alert(result.message);return;}
        window.__otoMode='period';
        // 배정이 끝난 교시는 접어서 다음 교시로 바로 넘어가게 한다.
        window.__otoOpenSeq=null;
        redrawStudentAssignment();
      }
      function unassignOneToOne(subjectId,sequence){
        if(!notifyOpener({action:'unassign-one-to-one',studentId:${student.id},subjectId:subjectId,templateSequence:sequence})) return;
        if(window.__otoMode==='period'){
          window.unassignStudentOneToOne(${student.id},subjectId,sequence);
          redrawStudentAssignment();
          return;
        }
        window.close();
      }
    <\/script>
    </body></html>`);
  popup.document.close();
  popup.focus();
}

function saveStudentPrimaryTeacher(studentId, teacherId) {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!student) return { ok: false, message: '학생 정보를 찾을 수 없어.' };
  const teacher = MOCK_TEACHERS.find(t => t.id === Number(teacherId));
  if (!teacher) return { ok: false, message: '강사 정보를 찾을 수 없어.' };
  const plan = planStudentOneToOneSchedule(student, teacher);
  if (!plan.ok) return plan;
  student.primaryTeacherId = teacher.id;
  student.oneToOneSchedule = plan.schedule;
  return { ok: true, message: `담당 강사를 지정하고 1:1 수업 ${plan.schedule.length}교시를 자동 배치했어.` };
}

// 그룹 배정이 바뀌면 해당 학생의 1:1 수업을 현재 과정 템플릿과 새 그룹 시간표를 기준으로 다시 배치한다.
// 실패 시 호출부가 그룹 변경을 되돌릴 수 있도록 기존 시간표는 그대로 복구한다.
function replanStudentOneToOneAfterGroupChange(student) {
  if (!student || student.primaryTeacherId == null || !(student.oneToOneSchedule || []).length) return { ok: true };
  const teacher = MOCK_TEACHERS.find(item => item.id === Number(student.primaryTeacherId));
  if (!teacher) return { ok: false, message: '담당 1:1 강사 정보를 찾을 수 없어.' };
  const previousSchedule = (student.oneToOneSchedule || []).map(item => ({ ...item }));
  student.oneToOneSchedule = [];
  const requirements = getStudentLessonRequirements(student).filter(item => item.classType === '1:1');
  const plan = planStudentOneToOneSchedule(student, teacher, requirements);
  if (!plan.ok) {
    student.oneToOneSchedule = previousSchedule;
    return plan;
  }
  student.oneToOneSchedule = plan.schedule;
  return { ok: true };
}

// 강사·강의실·학생의 요일·교시 충돌을 저장 전에 차단한다.
// 회의 결정(교시 고정 매칭 폐지)에 따라 1:1도 "N번째 요구사항 = N교시"를 강제하지 않는다 — 어느 교시든
// 강사가 비어있고 학생과 안 겹치면 배정할 수 있다. templateSequence는 어떤 요구사항(과목의 몇 번째 시수)을
// 채우는지 식별하는 용도로만 쓰고, 없으면 그 과목의 미배정 요구사항 중 첫 번째를 채운다(기존 호출 호환).
function saveStudentOneToOneSchedule(studentId, subjectId, teacherId, period, templateSequence) {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  const teacher = MOCK_TEACHERS.find(t => t.id === Number(teacherId));
  if (!student || !teacher) return { ok: false, message: '학생 또는 강사 정보를 찾을 수 없어.' };
  if (!period) return { ok: false, message: '교시를 선택해.' };
  const numericPeriod = Number(period);
  const numericSequence = templateSequence != null ? Number(templateSequence) : null;
  const requirement = getStudentLessonRequirements(student).find(req =>
    req.classType === '1:1' && req.subjectId === subjectId &&
    (numericSequence != null ? req.sequence === numericSequence : req.status !== 'ASSIGNED')
  );
  if (!requirement) return { ok: false, message: '해당 1:1 수업 요구사항을 찾을 수 없어.' };
  // v3.0은 주 5회(월~금) 고정이라 이 교시가 담당 강사에게 매일 가능한지부터 확인한다(PRD §3.2).
  if (!LESSON_DAYS.every(day => lessonTeacherAvailableAt(teacher, day, numericPeriod))) return { ok: false, message: '선택한 강사가 이 교시에 매일 근무하지 않아.' };
  if (!teacher.room) return { ok: false, message: '이 강사는 담당 1:1 강의실이 없어. 강의실 관리에서 먼저 배정해줘.' };

  const teacherBusyOneToOne = MOCK_STUDENTS.some(s =>
    s.id !== studentId && (s.oneToOneSchedule || []).some(o => o.teacherId === teacher.id && o.period === numericPeriod)
  );
  const teacherBusyGroup = MOCK_GROUP_CLASSES.some(g =>
    g.status === 'active' && g.teacherId === teacher.id &&
    Array.isArray(g.dayOfWeek) && g.dayOfWeek.length && Array.isArray(g.periods) && g.periods.includes(numericPeriod)
  );
  if (teacherBusyOneToOne || teacherBusyGroup) return { ok: false, message: '선택한 강사가 같은 교시에 이미 다른 수업이 있어.' };

  if (!isStudentFreeAtPeriod(student, numericPeriod, requirement.sequence)) return { ok: false, message: '이 학생은 같은 교시에 이미 다른 수업이 있어.' };

  if (!Array.isArray(student.oneToOneSchedule)) student.oneToOneSchedule = [];
  const existing = student.oneToOneSchedule.find(o => Number(o.templateSequence) === requirement.sequence)
    || student.oneToOneSchedule.find(o => o.subjectId === subjectId && o.templateSequence == null);
  if (existing) Object.assign(existing, { subjectId, templateSequence: requirement.sequence, teacherId: teacher.id, dayOfWeek: [...LESSON_DAYS], period: numericPeriod });
  else student.oneToOneSchedule.push({ subjectId, templateSequence: requirement.sequence, teacherId: teacher.id, dayOfWeek: [...LESSON_DAYS], period: numericPeriod });
  return { ok: true, message: '1:1 수업을 배정했어.' };
}

// templateSequence를 주면 그 교시 하나만 해제한다.
// IELTS Intensive처럼 같은 과목이 여러 교시에 배치되는 과정에서는 과목으로만 지우면 다른 교시까지 함께 풀려버린다.
function unassignStudentOneToOne(studentId, subjectId, templateSequence) {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!student || !Array.isArray(student.oneToOneSchedule)) return;
  const sequence = Number(templateSequence);
  if (Number.isFinite(sequence)) {
    student.oneToOneSchedule = student.oneToOneSchedule.filter(o => Number(o.templateSequence) !== sequence);
    return;
  }
  student.oneToOneSchedule = student.oneToOneSchedule.filter(o => o.subjectId !== subjectId);
}

// 이 학생이 그 교시에 비어 있는지. 자기 자신(같은 요구사항)만 빼고 전부 본다.
// 과목으로 빼면 같은 과목을 두 번 듣는 학생이 한 교시에 두 수업을 받게 된다.
function isStudentFreeAtPeriod(student, period, ignoreSequence) {
  const target = Number(period);
  const busyOneToOne = (student.oneToOneSchedule || []).some(item =>
    Number(item.period) === target && Number(item.templateSequence) !== Number(ignoreSequence)
  );
  if (busyOneToOne) return false;
  return !MOCK_GROUP_CLASSES.some(group =>
    group.status === 'active' && Array.isArray(group.periods) &&
    group.periods.map(Number).includes(target) && group.studentIds.includes(student.id)
  );
}

// 이 학생이 해당 교시에 다른 수업(1:1 또는 그룹)이 이미 있는지 확인한다.
// excludeSubjectId를 주면 그 과목 자신의 기존 배정은 충돌로 치지 않는다(같은 과목을 다른 교시로 옮길 때 사용).
function isStudentBusyAtPeriod(student, period, excludeSubjectId) {
  const numericPeriod = Number(period);
  const busyOneToOne = (student.oneToOneSchedule || []).some(o => o.subjectId !== excludeSubjectId && o.period === numericPeriod);
  const busyGroup = MOCK_GROUP_CLASSES.some(g =>
    g.status === 'active' && g.studentIds.includes(student.id) &&
    Array.isArray(g.dayOfWeek) && g.dayOfWeek.length && Array.isArray(g.periods) && g.periods.includes(numericPeriod)
  );
  return busyOneToOne || busyGroup;
}

// ── 1:1 수업 관리 · 강사별 배정 탭 (담당 1:1 강의실이 있는 강사를 카드로 한 번에 보여주고 빈 교시에 학생을 꽂는 화면) ──
let _oto1to1SlotTeacherId = null;
let _oto1to1SlotPeriod = null;
let _oneToOneManageTab = 'students';

function switchOneToOneManageTab(tab) {
  _oneToOneManageTab = ['students', 'teacher-assign'].includes(tab) ? tab : 'students';
  const studentsBtn = document.getElementById('cs-tab-students');
  const teacherBtn = document.getElementById('cs-tab-teacher-assign');
  const studentsPanel = document.getElementById('cs-panel-students');
  const teacherPanel = document.getElementById('cs-panel-teacher-assign');
  const selected = _oneToOneManageTab;
  if (studentsBtn) { studentsBtn.style.color = selected === 'students' ? '#5E5CE6' : '#6B7280'; studentsBtn.style.borderBottomColor = selected === 'students' ? '#5E5CE6' : 'transparent'; }
  if (teacherBtn) { teacherBtn.style.color = selected === 'teacher-assign' ? '#5E5CE6' : '#6B7280'; teacherBtn.style.borderBottomColor = selected === 'teacher-assign' ? '#5E5CE6' : 'transparent'; }
  if (studentsPanel) studentsPanel.style.display = selected === 'students' ? '' : 'none';
  if (teacherPanel) teacherPanel.style.display = selected === 'teacher-assign' ? '' : 'none';
  if (selected === 'teacher-assign') renderOneToOneTeacherCards();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

// 담당 1:1 강의실이 있는 강사를 전부 카드로 한 번에 렌더한다(강의실 관리의 카드 그리드와 같은 형태).
// 1:1은 항상 월~금 고정이라 요일 구분 없이 교시 1개당 한 줄이면 된다.
function renderOneToOneTeacherCards() {
  const grid = document.getElementById('oto-teacher-cards-grid');
  if (!grid) return;
  const query = (document.getElementById('oto-teacher-search')?.value || '').trim().toLowerCase();
  const teachers = MOCK_TEACHERS.filter(t => t.status !== 'resigned' && (t.classTypes || []).includes('1:1') && t.room);
  const matches = query
    ? teachers.filter(t => `${t.nick || ''} ${t.name || ''} ${t.room || ''}`.toLowerCase().includes(query))
    : teachers;

  if (!matches.length) {
    grid.innerHTML = '<div style="color:#9CA3AF;font-size:13px;padding:20px;text-align:center;grid-column:1/-1">해당하는 강사가 없어.</div>';
    return;
  }

  const periods = getPeriodList();
  grid.innerHTML = matches.map(teacher => {
    const bySlotPeriod = new Map();
    MOCK_STUDENTS.forEach(student => {
      (student.oneToOneSchedule || []).forEach(o => {
        if (o.teacherId === teacher.id) bySlotPeriod.set(o.period, { student, schedule: o });
      });
    });

    const slots = periods.map(p => {
      const occ = bySlotPeriod.get(p.order);
      if (occ) {
        const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === occ.schedule.subjectId);
        return `<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;background:#EEF2FF;margin-bottom:5px">
          <div style="font-size:11px;color:#5E5CE6;width:36px;flex-shrink:0">${p.order}교시</div>
          <div style="flex:1;font-size:11.5px;color:#111827;min-width:0"><b>${lessonEsc(occ.student.nick || occ.student.name)}</b> <span style="color:#6B7280">· ${lessonEsc(subject?.name || occ.schedule.subjectId)}</span></div>
          <button onclick="removeOneToOneSlot(${occ.student.id},'${occ.schedule.subjectId}')" style="font-size:10px;padding:3px 7px;border:none;background:#FEE2E2;color:#991B1B;border-radius:4px;cursor:pointer;flex-shrink:0">해제</button>
        </div>`;
      }
      return `<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;background:#F9FAFB;margin-bottom:5px">
        <div style="font-size:11px;color:#9CA3AF;width:36px;flex-shrink:0">${p.order}교시</div>
        <button onclick="openOneToOneSlotAssignModal(${teacher.id},${p.order})" style="flex:1;text-align:left;font-size:11.5px;color:#5E5CE6;cursor:pointer;padding:3px 8px;border:0.5px dashed #5E5CE6;border-radius:5px;background:none">+ 배정하기</button>
      </div>`;
    }).join('');

    return `<div class="tsa-card" style="overflow:hidden">
      <div class="tsa-card-header">
        <div>
          <span style="font-size:13px;font-weight:700;color:#111827">${lessonEsc(teacher.room)}</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:8px;margin-left:6px;background:#EEF2FF;color:#3730A3">1:1</span>
        </div>
        <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openOneToOneBulkAssignModal(${teacher.id})">일괄 배정</button>
      </div>
      <div style="padding:8px 14px;border-bottom:1px solid #F1F4F9;display:flex;flex-direction:column;gap:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <img src="${lessonEsc(teacher.photoUrl || (teacher.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png'))}" alt="${lessonEsc(teacher.nick || teacher.name || '')}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0"/>
          <div style="font-size:12px;color:#374151;font-weight:700">${lessonEsc(teacher.nick || teacher.name)}</div>
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          <span style="font-size:9.5px;color:#9CA3AF;flex-shrink:0">장점 과정</span>
          ${(teacher.preferredCourses || []).length
            ? (teacher.preferredCourses || []).map(tag => `<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#D1FAE5;color:#065F46;font-weight:600">${lessonEsc(tag)}</span>`).join('')
            : '<span style="font-size:10.5px;color:#D1D5DB">미등록</span>'}
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          <span style="font-size:9.5px;color:#9CA3AF;flex-shrink:0">담당 과목</span>
          ${(() => {
            const subjects = (typeof getTeacherCapableSubjectIds === 'function' ? getTeacherCapableSubjectIds(teacher) : [])
              .map(id => MOCK_MASTER_SUBJECTS.find(s => s.id === id))
              .filter(Boolean);
            return subjects.length
              ? subjects.map(subject => `<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#E0F2FE;color:#0369A1;font-weight:600">${lessonEsc(subject.name)}</span>`).join('')
              : '<span style="font-size:10.5px;color:#D1D5DB">미등록</span>';
          })()}
        </div>
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
          <span style="font-size:9.5px;color:#9CA3AF;flex-shrink:0">담당 레벨</span>
          ${(() => {
            const levels = (typeof getTeacherCapableLevelIds === 'function' ? getTeacherCapableLevelIds(teacher) : [])
              .map(id => MOCK_MASTER_LEVELS.find(l => l.id === id))
              .filter(Boolean);
            return levels.length
              ? levels.map(level => `<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#F3E8FF;color:#7E22CE;font-weight:600">${lessonEsc(level.name)}</span>`).join('')
              : '<span style="font-size:10.5px;color:#D1D5DB">미등록</span>';
          })()}
        </div>
      </div>
      <div style="padding:10px 14px;max-height:420px;overflow-y:auto">${slots}</div>
    </div>`;
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

// 강사 카드의 "일괄 배정": 학생을 고르면 그 학생의 과정별 1:1 요구사항 전체를
// 이 강사에게 한 번에 배치한다(담당 강사 지정 = 기존 학생별 자동배치 엔진 재사용).
let _oto1to1BulkTeacherId = null;

function openOneToOneBulkAssignModal(teacherId) {
  _oto1to1BulkTeacherId = teacherId;
  renderOneToOneBulkCandidates();
  const modal = document.getElementById('oto-bulk-assign-modal');
  if (modal) modal.style.display = 'flex';
}

function closeOneToOneBulkAssignModal() {
  const modal = document.getElementById('oto-bulk-assign-modal');
  if (modal) modal.style.display = 'none';
  _oto1to1BulkTeacherId = null;
}

// isReassign: 이미 다른 강사가 담당 중인 학생 카드는 옅게 표시하고, 버튼 문구도 "재배정"으로 바꿔서
// 눌렀을 때 기존 배정이 통째로 대체된다는 걸 명확히 알 수 있게 한다.
function renderOneToOneBulkCandidateRow(student, teacher, isReassign) {
  const plan = planStudentOneToOneSchedule(student, teacher);
  const preview = plan.ok
    ? plan.schedule
      .slice()
      .sort((a, b) => a.period - b.period)
      .map(slot => {
        const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === slot.subjectId);
        return `<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#EEF2FF;color:#3730A3;margin:2px;display:inline-block">${slot.period}교시 · ${lessonEsc(subject?.name || slot.subjectId)}</span>`;
      }).join('')
    : `<span style="font-size:10.5px;color:#B45309">${lessonEsc(plan.message)}</span>`;
  const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
  const period = [student.startDate, student.departureDate].filter(Boolean).join(' ~ ') || '-';
  const currentTeacher = isReassign && student.primaryTeacherId != null ? MOCK_TEACHERS.find(t => t.id === student.primaryTeacherId) : null;
  return `<div style="padding:8px 10px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:6px;${isReassign ? 'background:#F9FAFB' : ''}">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;gap:8px">
      <div style="display:flex;align-items:center;gap:8px;min-width:0;${isReassign ? 'opacity:0.7' : ''}">
        <img src="${lessonEsc(avatarSrc)}" style="width:30px;height:30px;object-fit:cover;border-radius:50%;border:1px solid #E5E7EB;flex-shrink:0" alt="${lessonEsc(student.nick || student.name || '')}"/>
        <div style="min-width:0">
          <div style="font-size:12px"><b>${lessonEsc(student.nick || student.name)}</b> <span style="color:#6B7280">· ${lessonEsc(student.course || '-')}${student.level ? ` · ${lessonEsc(student.level)}` : ''}</span></div>
          <div style="font-size:10.5px;color:#6B7280">${lessonEsc(student.flag || '')} ${lessonEsc(student.nationality || '-')} · ${lessonEsc(student.gender || '-')} ${student.age != null ? student.age + '세' : ''} · ${lessonEsc(period)}</div>
        </div>
      </div>
      ${plan.ok
        ? `<button class="tsa-btn tsa-btn-xs ${isReassign ? 'tsa-btn-outline' : 'tsa-btn-primary'}" style="flex-shrink:0" onclick="confirmOneToOneBulkAssign(${student.id})">${isReassign ? '재배정' : '일괄 배정'}</button>`
        : `<span style="flex-shrink:0;font-size:10.5px;color:#9CA3AF;padding:3px 8px;border:1px solid #E5E7EB;border-radius:6px;background:#F3F4F6">배치 불가</span>`}
    </div>
    ${isReassign ? `<div style="font-size:10px;color:#B45309;margin-bottom:4px">현재 ${lessonEsc(currentTeacher?.nick || currentTeacher?.name || '-')} 강사 담당 중 · 재배정하면 기존 배정이 전부 대체돼</div>` : ''}
    <div>${preview}</div>
  </div>`;
}

function renderOneToOneBulkCandidates() {
  const box = document.getElementById('oto-bulk-candidates');
  const titleEl = document.getElementById('oto-bulk-modal-title');
  const teacher = MOCK_TEACHERS.find(t => t.id === _oto1to1BulkTeacherId);
  if (!box || !teacher) return;
  if (titleEl) titleEl.textContent = `${teacher.nick || teacher.name} · ${teacher.room} · 일괄 배정`;

  const rows = MOCK_STUDENTS
    .filter(s => ['current', 'waiting', 'extended'].includes(s.status) && s.primaryTeacherId !== teacher.id)
    .map(student => ({ student, requirements: getStudentLessonRequirements(student).filter(r => r.classType === '1:1') }))
    .filter(row => row.requirements.length > 0);

  const unassigned = rows.filter(row => row.student.primaryTeacherId == null);
  const reassign = rows.filter(row => row.student.primaryTeacherId != null);

  const sections = [];
  if (unassigned.length) {
    sections.push(`<div style="font-size:11px;font-weight:700;color:#4B5563;margin-bottom:6px">미배정 학생 (${unassigned.length})</div>`);
    sections.push(unassigned.map(row => renderOneToOneBulkCandidateRow(row.student, teacher, false)).join(''));
  }
  if (reassign.length) {
    sections.push(`<div style="font-size:11px;font-weight:700;color:#9CA3AF;margin:${unassigned.length ? '14px' : '0'} 0 6px;${unassigned.length ? 'border-top:1px dashed #E5E7EB;padding-top:10px' : ''}">이미 다른 강사 배정됨 · 재배정 시 기존 배정이 대체돼 (${reassign.length})</div>`);
    sections.push(reassign.map(row => renderOneToOneBulkCandidateRow(row.student, teacher, true)).join(''));
  }

  box.innerHTML = sections.length ? sections.join('') : '<div style="padding:20px;text-align:center;color:#9CA3AF;font-size:12px">배정 대상 학생이 없어.</div>';
}

function confirmOneToOneBulkAssign(studentId) {
  const teacher = MOCK_TEACHERS.find(t => t.id === _oto1to1BulkTeacherId);
  if (!teacher) return;
  const result = saveStudentPrimaryTeacher(studentId, teacher.id);
  showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
  if (result.ok) {
    renderOneToOneTeacherCards();
    if (typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
  }
  renderOneToOneBulkCandidates();
}

// 이 교시에 배정 가능한(1:1 미배정 과목이 있고, 이 교시에 다른 수업이 없는) 학생 목록.
function getOneToOneSlotCandidates(period) {
  const numericPeriod = Number(period);
  return MOCK_STUDENTS
    .filter(s => ['current', 'waiting', 'extended'].includes(s.status))
    .map(student => ({
      student,
      unassigned: getStudentLessonRequirements(student).filter(req =>
        req.classType === '1:1' && req.status !== 'ASSIGNED' && req.sequence === numericPeriod
      )
    }))
    .filter(row => row.unassigned.length > 0 && !isStudentBusyAtPeriod(row.student, numericPeriod));
}

function openOneToOneSlotAssignModal(teacherId, period) {
  _oto1to1SlotTeacherId = teacherId;
  _oto1to1SlotPeriod = Number(period);
  renderOneToOneSlotCandidates();
  const modal = document.getElementById('oto-slot-assign-modal');
  if (modal) modal.style.display = 'flex';
}

function closeOneToOneSlotAssignModal() {
  const modal = document.getElementById('oto-slot-assign-modal');
  if (modal) modal.style.display = 'none';
  _oto1to1SlotTeacherId = null;
  _oto1to1SlotPeriod = null;
}

function renderOneToOneSlotCandidates() {
  const box = document.getElementById('oto-slot-candidates');
  const titleEl = document.getElementById('oto-slot-modal-title');
  if (!box || _oto1to1SlotPeriod == null) return;
  const teacher = MOCK_TEACHERS.find(t => t.id === _oto1to1SlotTeacherId);
  if (titleEl) titleEl.textContent = `${teacher ? `${teacher.nick || teacher.name} · ${teacher.room}` : ''} · ${_oto1to1SlotPeriod}교시 배정`;

  const candidates = getOneToOneSlotCandidates(_oto1to1SlotPeriod);
  box.innerHTML = candidates.length
    ? candidates.map(({ student, unassigned }) => {
      if (unassigned.length === 1) {
        const req = unassigned[0];
        return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:6px">
          <div style="font-size:12px"><b>${lessonEsc(student.nick || student.name)}</b> <span style="color:#6B7280">· ${lessonEsc(req.subjectName)}</span></div>
          <button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="assignOneToOneSlot(${student.id},'${req.subjectId}',${req.sequence})">배정</button>
        </div>`;
      }
      return `<div style="padding:8px 10px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:6px">
        <div style="font-size:12px;margin-bottom:6px"><b>${lessonEsc(student.nick || student.name)}</b> <span style="color:#6B7280">· 과목을 골라줘</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${unassigned.map(req => `<button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="assignOneToOneSlot(${student.id},'${req.subjectId}',${req.sequence})">${lessonEsc(req.subjectName)}</button>`).join('')}
        </div>
      </div>`;
    }).join('')
    : '<div style="padding:20px;text-align:center;color:#9CA3AF;font-size:12px">이 교시에 배정 가능한 학생이 없어.</div>';
}

function assignOneToOneSlot(studentId, subjectId, templateSequence) {
  const teacher = MOCK_TEACHERS.find(t => t.id === _oto1to1SlotTeacherId);
  if (!teacher || _oto1to1SlotPeriod == null) return;
  const result = saveStudentOneToOneSchedule(studentId, subjectId, teacher.id, _oto1to1SlotPeriod, templateSequence);
  showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
  if (result.ok) {
    closeOneToOneSlotAssignModal();
    renderOneToOneTeacherCards();
    if (typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
  } else {
    renderOneToOneSlotCandidates();
  }
}

function removeOneToOneSlot(studentId, subjectId) {
  unassignStudentOneToOne(studentId, subjectId);
  showToast('배정을 해제했어.', 'success');
  renderOneToOneTeacherCards();
  if (typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
}

// ── 최종 시간표 및 현황 (PRD v3.0 §13) ──────────────────────
// 그룹/1:1 배정이 저장되는 즉시 반영되는 시간표 — 별도 확정 단계나 주차 인스턴스 없이 매번 현재 배정 상태에서 파생한다.
// "2026-06-01" -> "26.06.01" (좁은 시간표 칸에 넣을 수 있게 축약)
function formatShortEnrollDate(value) {
  if (!value) return '';
  const parts = String(value).split('-');
  return parts.length === 3 ? `${parts[0].slice(-2)}.${parts[1]}.${parts[2]}` : String(value);
}

function getStudentEnrollPeriodLabel(student) {
  const start = formatShortEnrollDate(student?.startDate);
  const end = formatShortEnrollDate(student?.departureDate);
  return start && end ? `${start}~${end}` : start || end || '';
}

function buildFinalTimetableEntries() {
  const entries = [];
  MOCK_GROUP_CLASSES.filter(g => g.status === 'active' && Array.isArray(g.dayOfWeek) && g.dayOfWeek.length && Array.isArray(g.periods) && g.periods.length).forEach(group => {
    const subjectId = getGroupSubjectId(group);
    const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === subjectId);
    const teacher = group.teacherId != null ? MOCK_TEACHERS.find(t => t.id === group.teacherId) : null;
    const room = group.roomId != null ? MOCK_CLASS_ROOMS.find(r => r.id === group.roomId) : null;
    const studentPeriods = group.studentIds.map(id => {
      const student = MOCK_STUDENTS.find(s => s.id === id);
      return { name: student?.nick || student?.name || '-', period: getStudentEnrollPeriodLabel(student) };
    });
    group.dayOfWeek.forEach(day => {
      group.periods.forEach(period => {
        entries.push({
          id: `group-${group.id}-${day}-${period}`, kind: 'GROUP', groupId: group.id,
          subjectId, subjectName: subject?.name || subjectId || '-', classType: group.classType,
          dayOfWeek: day, period,
          teacherId: group.teacherId, teacherName: teacher?.nick || teacher?.name || '미배정',
          roomId: group.roomId, roomLabel: room?.roomNo || '미배정',
          studentIds: group.studentIds, studentLabel: `${getGroupDisplayName(group)} (${group.studentIds.length}명)`,
          studentPeriods
        });
      });
    });
  });
  MOCK_STUDENTS.forEach(student => {
    (student.oneToOneSchedule || []).forEach(sched => {
      const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === sched.subjectId);
      const teacher = sched.teacherId != null ? MOCK_TEACHERS.find(t => t.id === sched.teacherId) : null;
      const days = Array.isArray(sched.dayOfWeek) ? sched.dayOfWeek : sched.dayOfWeek ? [sched.dayOfWeek] : [];
      days.forEach(day => {
        entries.push({
          id: `1on1-${student.id}-${sched.subjectId}-${day}`, kind: 'ONE_TO_ONE', groupId: null,
          subjectId: sched.subjectId, subjectName: subject?.name || sched.subjectId || '-', classType: '1:1',
          dayOfWeek: day, period: sched.period,
          teacherId: sched.teacherId, teacherName: teacher?.nick || teacher?.name || '미배정',
          roomId: null, roomLabel: teacher?.room || '미배정',
          studentIds: [student.id], studentLabel: student.nick || student.name || '-',
          studentPeriods: [{ name: student.nick || student.name || '-', period: getStudentEnrollPeriodLabel(student) }]
        });
      });
    });
  });
  return entries.sort((a, b) => {
    const dayDiff = LESSON_DAYS.indexOf(a.dayOfWeek) - LESSON_DAYS.indexOf(b.dayOfWeek);
    return dayDiff !== 0 ? dayDiff : (a.period || 0) - (b.period || 0);
  });
}

// 학생 개인 주간 스케줄(월~금 × 교시). 최종 시간표와 같은 소스에서 뽑아 쓰므로
// 1:1·그룹 배정이 바뀌면 별도 갱신 없이 항상 현재 상태를 보여준다.
// 학생 상세 팝업의 "스케줄" 탭과 수업 배정 관리의 "스케줄" 버튼이 함께 쓴다.
function studentScheduleIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function studentScheduleDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

// 학생별 스케줄 조회 주간(월요일이 아니어도 되는 "기준일") 저장/이동 — 학생·수강 구간별로 따로 기억한다.
function studentScheduleWeekAnchorKey(studentId) {
  const enrollmentKey = typeof currentAdetailEnrollmentId !== 'undefined' ? currentAdetailEnrollmentId : 'current';
  return `${studentId}:${enrollmentKey}`;
}

// 목업 데이터의 기준 "오늘" — 수업 현황(MOCK_CLASS_LOG)이 이 날짜를 기준으로 만들어져 있어 스케줄 병합 시에도 같은 기준을 쓴다.
const SCHEDULE_TODAY_STR = '2026-06-16';

const SCHEDULE_STATUS_META = {
  present: { label: '출석', color: '#16A34A', bg: '#DCFCE7', icon: '✓' },
  absent: { label: '결석', color: '#EF4444', bg: '#FEE2E2', icon: '✗' },
  late: { label: '지각', color: '#D97706', bg: '#FEF3C7', icon: '◔' },
  early_leave: { label: '조퇴', color: '#8B5CF6', bg: '#EDE9FE', icon: '↩' },
};

// 스케줄 셀 하단에 붙는 출결 배지. logged(실제 기록) / upcoming(예정) / unrecorded(기록 누락) 세 상태를 구분해서 보여준다.
function renderScheduleCellStatusBadge(cellState, logEntry) {
  if (cellState === 'logged' && logEntry) {
    const sm = SCHEDULE_STATUS_META[logEntry.status] || SCHEDULE_STATUS_META.present;
    return `<span style="font-size:9px;font-weight:700;color:${sm.color};background:${sm.bg};padding:2px 6px;border-radius:20px;display:inline-block">${sm.icon} ${sm.label}</span>`;
  }
  if (cellState === 'upcoming') {
    return '<span style="font-size:9px;font-weight:700;color:#9CA3AF;background:#F3F4F6;padding:2px 6px;border-radius:20px;display:inline-block">예정</span>';
  }
  if (cellState === 'unrecorded') {
    return '<span style="font-size:9px;font-weight:700;color:#B45309;background:#FFFBEB;padding:2px 6px;border-radius:20px;display:inline-block">미기록</span>';
  }
  return '';
}

// 학생의 특정 주(월~금 × 교시) 셀 데이터를 계산한다. 렌더링(buildStudentWeeklyScheduleHtml)과 분리해둬서
// "이 슬롯이 무슨 상태인가"(템플릿 유무 + 실제 출결 기록 유무 + 미래/과거 여부) 판단 로직을 한 곳에 모은다.
function buildStudentScheduleWeekCells(student) {
  const entries = buildFinalTimetableEntries().filter(entry => (entry.studentIds || []).includes(student.id));
  const periods = typeof getBellPeriods === 'function'
    ? getBellPeriods()
    : Array.from({ length: (APP && APP.bellSystem && APP.bellSystem.total) || 8 }, (_, i) => ({ period: i + 1, start: '', end: '' }));
  const bySlot = new Map();
  entries.forEach(entry => bySlot.set(`${entry.dayOfWeek}|${entry.period}`, entry));

  const selectedEnrollment = typeof getSelectedStudentEnrollment === 'function'
    ? getSelectedStudentEnrollment(student)
    : student;
  const enrollmentStart = selectedEnrollment.startDate || student.startDate || studentScheduleIsoDate(new Date());
  // student.endDate가 없는 학생(직접 등록이 아닌 경우 등)은 departureDate(출국일)를 수강 종료일로 대신 쓴다.
  const enrollmentEnd = selectedEnrollment.endDate || student.endDate || student.departureDate || enrollmentStart;

  APP.studentScheduleWeekAnchor = APP.studentScheduleWeekAnchor || {};
  const anchorKey = studentScheduleWeekAnchorKey(student.id);
  const anchorDate = studentScheduleDate(APP.studentScheduleWeekAnchor[anchorKey]) || studentScheduleDate(enrollmentStart) || new Date();
  const monday = new Date(anchorDate);
  monday.setDate(anchorDate.getDate() - ((anchorDate.getDay() + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const weekDates = LESSON_DAYS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { day, date, iso: studentScheduleIsoDate(date) };
  });

  const studentLogs = MOCK_CLASS_LOG.filter(l => l.studentId === student.id);
  const cellsBySlotKey = new Map();
  weekDates.forEach(({ day, iso }) => {
    periods.forEach(slot => {
      const inRange = iso >= enrollmentStart && iso <= enrollmentEnd;
      const templateEntry = bySlot.get(`${day}|${slot.period}`) || null;
      const logEntry = studentLogs.find(l => l.date === iso && l.period === slot.period) || null;
      let cellState;
      if (!inRange) cellState = 'out-of-range';
      else if (!templateEntry) cellState = 'no-class';
      else if (logEntry) cellState = 'logged';
      else if (iso > SCHEDULE_TODAY_STR) cellState = 'upcoming';
      else cellState = 'unrecorded';
      cellsBySlotKey.set(`${iso}|${slot.period}`, { iso, day, period: slot.period, inRange, templateEntry, logEntry, cellState });
    });
  });

  // 이전/다음 주 전체가 수강 기간을 완전히 벗어나면 더 이동할 필요가 없으니 버튼을 막는다.
  const prevFriday = new Date(monday);
  prevFriday.setDate(monday.getDate() - 3);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const prevDisabled = studentScheduleIsoDate(prevFriday) < enrollmentStart;
  const nextDisabled = studentScheduleIsoDate(nextMonday) > enrollmentEnd;

  // 1:1은 월~금 5일이 한 교시로 묶이므로 요일 수가 아니라 교시 수로 센다.
  const uniquePeriods = new Set(entries.map(entry => `${entry.classType}|${entry.subjectId}|${entry.period}`));
  const oneToOneCount = new Set(entries.filter(e => e.classType === '1:1').map(e => `${e.subjectId}|${e.period}`)).size;
  const groupCount = new Set(entries.filter(e => e.classType !== '1:1').map(e => `${e.groupId}|${e.period}`)).size;

  const weekLabel = `${monday.getFullYear()}.${String(monday.getMonth() + 1).padStart(2, '0')}.${String(monday.getDate()).padStart(2, '0')} ~ ${friday.getFullYear()}.${String(friday.getMonth() + 1).padStart(2, '0')}.${String(friday.getDate()).padStart(2, '0')}`;

  return {
    weekDates, periods, monday, friday, enrollmentStart, enrollmentEnd,
    prevDisabled, nextDisabled, weekLabel, cellsBySlotKey,
    oneToOneCount, groupCount, uniquePeriods,
  };
}

// 학생의 전체 출결 누적 요약(출석/결석/지각/조퇴 + 1:1 패널티 여부). 주간 이동과 무관하게 항상 동일한 값을 보여준다.
function getStudentClassLogSummary(studentId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  const logs = MOCK_CLASS_LOG.filter(l => l.studentId === Number(studentId));
  const total = logs.length;
  const present = logs.filter(l => l.status === 'present').length;
  const absent = logs.filter(l => l.status === 'absent').length;
  const late = logs.filter(l => l.status === 'late').length;
  const early = logs.filter(l => l.status === 'early_leave').length;
  const attRate = total > 0 ? Math.round((present + late + early) / total * 100) : 0;
  const penalty = Boolean(student?.penaltyActive) || attRate < 80;
  return { present, absent, late, early, attRate, penalty };
}

// 스케줄 탭(주간 그리드 + 출결 편집)의 단일 재렌더 진입점. 이동/편집/저장이 전부 이 함수로 모인다.
function renderStudentScheduleTab(studentId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  const container = document.getElementById('adetail-page-enrollment-content');
  if (!student || !container) return;
  container.innerHTML = buildStudentWeeklyScheduleHtml(student);
}

function shiftStudentScheduleWeek(studentId, direction) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  if (!student) return;
  const selectedEnrollment = typeof getSelectedStudentEnrollment === 'function' ? getSelectedStudentEnrollment(student) : student;
  const enrollmentStart = selectedEnrollment.startDate || student.startDate || studentScheduleIsoDate(new Date());
  APP.studentScheduleWeekAnchor = APP.studentScheduleWeekAnchor || {};
  const key = studentScheduleWeekAnchorKey(student.id);
  const anchorDate = studentScheduleDate(APP.studentScheduleWeekAnchor[key]) || studentScheduleDate(enrollmentStart) || new Date();
  anchorDate.setDate(anchorDate.getDate() + direction * 7);
  APP.studentScheduleWeekAnchor[key] = studentScheduleIsoDate(anchorDate);
  renderStudentScheduleTab(student.id);
}

function pickStudentScheduleWeek(studentId, isoValue) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  if (!student || !isoValue) return;
  APP.studentScheduleWeekAnchor = APP.studentScheduleWeekAnchor || {};
  APP.studentScheduleWeekAnchor[studentScheduleWeekAnchorKey(student.id)] = isoValue;
  renderStudentScheduleTab(student.id);
}

// 출결 편집 대상(단일 슬롯). 그리드 전체에서 한 번에 하나의 (날짜, 교시) 셀만 편집 모드가 될 수 있다.
let _classLogEditTarget = null; // { studentId, date, period }

// 수업 유형/강사/과목/출석 상태/메모를 고치는 인라인 편집 패널. 클릭한 교시 행 바로 아래, 표 전체 너비로 펼쳐진다.
function renderClassLogEditPanel(studentId, date, period, log) {
  const subjects = ['Speaking', 'Grammar', 'Writing', 'Listening', 'Reading', 'Pronunciation', 'Vocabulary', 'Conversation'];
  const teachers = [...new Set(MOCK_CLASS_LOG.map(l => l.teacherName).filter(Boolean))];
  const cur = log || { type: '1:1', teacherName: '', subject: '', status: 'present', material: '', note: '' };
  return `
    <div id="classlog-edit-${period}" style="margin:0;padding:14px 16px;background:#EEF2FF;border:1.5px solid #C7D2FE;border-radius:8px;display:flex;flex-direction:column;gap:10px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <div>
          <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">수업 유형</label>
          <select id="cle-type-${period}" class="tsa-input" style="font-size:12px;padding:5px 8px">
            ${['1:1', '1:4', '1:6'].map(t => `<option ${cur.type === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">담당 강사</label>
          <input id="cle-teacher-${period}" class="tsa-input" style="font-size:12px;padding:5px 8px" value="${cur.teacherName || ''}" placeholder="강사명" list="cle-teacher-list"/>
          <datalist id="cle-teacher-list">${teachers.map(t => `<option value="${t}">`).join('')}</datalist>
        </div>
        <div>
          <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">수업 과목</label>
          <input id="cle-subject-${period}" class="tsa-input" style="font-size:12px;padding:5px 8px" value="${cur.subject || ''}" placeholder="과목명" list="cle-subject-list"/>
          <datalist id="cle-subject-list">${subjects.map(s => `<option value="${s}">`).join('')}</datalist>
        </div>
      </div>
      <div>
        <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">출석 상태</label>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${[['present', '출석', '#16A34A', '#DCFCE7'], ['absent', '결석', '#EF4444', '#FEE2E2'], ['late', '지각', '#D97706', '#FEF3C7'], ['early_leave', '조퇴', '#8B5CF6', '#EDE9FE']].map(([v, lbl, c, bg]) =>
            `<label style="display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1.5px solid ${cur.status === v ? c : '#E5E7EB'};background:${cur.status === v ? bg : 'white'};cursor:pointer;font-size:11px;font-weight:600;color:${cur.status === v ? c : '#6B7280'}">
              <input type="radio" name="cle-status-${period}" value="${v}" ${cur.status === v ? 'checked' : ''} style="display:none" onchange="refreshStatusBadges(${period})"> ${lbl}
            </label>`
          ).join('')}
        </div>
      </div>
      <div>
        <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">교재 정보</label>
        <input id="cle-material-${period}" class="tsa-input" style="font-size:12px;padding:5px 8px" value="${cur.material || ''}" placeholder="예: Side by Side Book 2 Ch.4 Page 42-45"/>
      </div>
      <div>
        <label style="font-size:10px;font-weight:700;color:#4B5563;display:block;margin-bottom:4px">수업 피드백 코멘트</label>
        <textarea id="cle-note-${period}" class="tsa-input" style="font-size:12px;padding:6px 8px;resize:vertical;min-height:52px" placeholder="수업 진행 내용, 특이사항 등을 기록하세요">${cur.note || ''}</textarea>
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button onclick="toggleClassLogEdit(null,null,null)" style="padding:5px 14px;background:none;border:1px solid #E5E7EB;border-radius:6px;font-size:12px;color:#6B7280;cursor:pointer">취소</button>
        <button onclick="saveClassLogEntry(${studentId},'${date}',${period})" style="padding:5px 16px;background:#5E5CE6;border:none;border-radius:6px;font-size:12px;color:white;font-weight:700;cursor:pointer">저장</button>
      </div>
    </div>`;
}

function toggleClassLogEdit(studentId, date, period) {
  // 취소(studentId=null)일 때도 어느 학생 화면을 다시 그려야 하는지 알아야 하므로, 초기화 전에 현재 대상을 먼저 챙겨둔다.
  const renderTargetId = studentId || _classLogEditTarget?.studentId;
  if (!studentId) {
    _classLogEditTarget = null;
  } else if (_classLogEditTarget?.studentId === studentId && _classLogEditTarget?.date === date && _classLogEditTarget?.period === period) {
    _classLogEditTarget = null;
  } else {
    _classLogEditTarget = { studentId, date, period };
  }
  if (renderTargetId) renderStudentScheduleTab(renderTargetId);
}

function refreshStatusBadges(period) {
  // 라디오 선택 시 레이블 스타일 즉시 갱신
  const radios = document.querySelectorAll(`input[name="cle-status-${period}"]`);
  const colorMap = { present: ['#16A34A', '#DCFCE7'], absent: ['#EF4444', '#FEE2E2'], late: ['#D97706', '#FEF3C7'], early_leave: ['#8B5CF6', '#EDE9FE'] };
  radios.forEach(r => {
    const lbl = r.closest('label');
    if (!lbl) return;
    const [c, bg] = colorMap[r.value] || ['#6B7280', 'white'];
    lbl.style.borderColor = r.checked ? c : '#E5E7EB';
    lbl.style.background = r.checked ? bg : 'white';
    lbl.style.color = r.checked ? c : '#6B7280';
  });
}

function saveClassLogEntry(studentId, date, period) {
  const type = document.getElementById(`cle-type-${period}`)?.value || '1:1';
  const teacher = document.getElementById(`cle-teacher-${period}`)?.value || '';
  const subject = document.getElementById(`cle-subject-${period}`)?.value || '';
  const material = document.getElementById(`cle-material-${period}`)?.value || '';
  const note = document.getElementById(`cle-note-${period}`)?.value || '';
  const statusEl = document.querySelector(`input[name="cle-status-${period}"]:checked`);
  const status = statusEl?.value || 'present';

  const idx = MOCK_CLASS_LOG.findIndex(l => l.studentId === studentId && l.date === date && l.period === period);
  const entry = { studentId, date, period, type, teacherName: teacher, subject, material, status, note };
  if (idx >= 0) MOCK_CLASS_LOG[idx] = entry;
  else MOCK_CLASS_LOG.push(entry);

  // 학생 출석률 재계산
  const stu = MOCK_STUDENTS.find(s => s.id === studentId);
  if (stu) {
    const logs = MOCK_CLASS_LOG.filter(l => l.studentId === studentId);
    const tot = logs.length;
    const att = logs.filter(l => l.status !== 'absent').length;
    stu.attendance = tot > 0 ? Math.round(att / tot * 100 * 10) / 10 : 0;
  }

  _classLogEditTarget = null;
  showToast('✓ 수업 기록이 저장되었습니다.', 'success');
  renderStudentScheduleTab(studentId);
}

function toggleStudentPenalty(studentId) {
  const stu = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!stu) return;
  stu.penaltyActive = !stu.penaltyActive;
  showToast(stu.penaltyActive ? '⚠ 1:1 수업 패널티가 적용되었습니다.' : '✓ 패널티가 해제되었습니다.', stu.penaltyActive ? 'warning' : 'success');
  renderStudentScheduleTab(studentId);
}

function buildStudentWeeklyScheduleHtml(student) {
  if (!student) return '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">학생 정보를 찾을 수 없어.</div>';

  const typeStyle = classType => classType === '1:1'
    ? { bg: '#EEF2FF', border: '#C7D2FE', color: '#4338CA' }
    : classType === '1:4'
      ? { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' }
      : { bg: '#D1FAE5', border: '#A7F3D0', color: '#047857' };

  const week = buildStudentScheduleWeekCells(student);
  const { weekDates, periods, monday, enrollmentStart, enrollmentEnd, prevDisabled, nextDisabled, weekLabel, cellsBySlotKey, oneToOneCount, groupCount, uniquePeriods } = week;

  const headerCells = weekDates.map(({ day, date }) =>
    `<th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;text-align:center">${day}<div style="font-size:9px;color:#9CA3AF;margin-top:2px">${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}</div></th>`
  ).join('');

  const bodyRows = periods.flatMap(slot => {
    const cells = weekDates.map(({ iso }) => {
      const cell = cellsBySlotKey.get(`${iso}|${slot.period}`);
      if (!cell || cell.cellState === 'out-of-range') {
        return '<td style="border:1px solid #E5E7EB;padding:6px;height:56px;background:#F9FAFB;text-align:center;color:#E5E7EB;font-size:10.5px">-</td>';
      }
      if (cell.cellState === 'no-class') {
        return '<td style="border:1px solid #E5E7EB;padding:6px;height:56px;background:#FCFCFD;text-align:center;color:#D1D5DB;font-size:10.5px">-</td>';
      }
      const entry = cell.templateEntry;
      const style = typeStyle(entry.classType);
      const badge = renderScheduleCellStatusBadge(cell.cellState, cell.logEntry);
      const isEditing = _classLogEditTarget?.studentId === student.id && _classLogEditTarget?.date === iso && _classLogEditTarget?.period === slot.period;
      return `<td onclick="toggleClassLogEdit(${student.id}, '${iso}', ${slot.period})" style="border:1px solid #E5E7EB;padding:5px;height:56px;background:${style.bg};vertical-align:top;cursor:pointer;${isEditing ? 'outline:2px solid #5E5CE6;outline-offset:-2px' : ''}">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
          <span style="font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;background:#fff;border:1px solid ${style.border};color:${style.color}">${lessonEsc(entry.classType)}</span>
          <b style="font-size:10.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(entry.subjectName)}</b>
        </div>
        <div style="font-size:9.5px;color:#4B5563;line-height:1.4">${lessonEsc(entry.teacherName)}<br>${lessonEsc(entry.roomLabel)}</div>
        ${cell.logEntry && cell.logEntry.material ? `<div style="font-size:9px;color:#6B7280;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${lessonEsc(cell.logEntry.material)}">📘 ${lessonEsc(cell.logEntry.material)}</div>` : ''}
        <div style="margin-top:4px">${badge}</div>
      </td>`;
    }).join('');
    const rowTr = `<tr>
      <th style="border:1px solid #E5E7EB;background:#F8F9FC;padding:6px;text-align:center;white-space:nowrap">
        <div style="font-size:11px;font-weight:800;color:#374151">${slot.period}교시</div>
        ${slot.start ? `<div style="font-size:9px;color:#9CA3AF">${slot.start}~${slot.end}</div>` : ''}
      </th>
      ${cells}
    </tr>`;

    const isEditingThisRow = _classLogEditTarget?.studentId === student.id
      && _classLogEditTarget?.period === slot.period
      && weekDates.some(wd => wd.iso === _classLogEditTarget.date);
    if (!isEditingThisRow) return [rowTr];
    const log = MOCK_CLASS_LOG.find(l => l.studentId === student.id && l.date === _classLogEditTarget.date && l.period === _classLogEditTarget.period);
    const editTr = `<tr><td colspan="6" style="padding:6px;border:1px solid #E5E7EB;background:#F8F9FC">${renderClassLogEditPanel(student.id, _classLogEditTarget.date, _classLogEditTarget.period, log)}</td></tr>`;
    return [rowTr, editTr];
  }).join('');

  const summary = getStudentClassLogSummary(student.id);

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div style="font-size:12px;font-weight:800;color:#111827">📅 주간 스케줄 <span style="font-size:10.5px;font-weight:600;color:#6B7280">월~금 · 현재 배정 기준</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span class="tsa-badge tsa-badge-primary" style="font-size:10px">1:1 ${oneToOneCount}교시</span>
        <span class="tsa-badge tsa-badge-success" style="font-size:10px">그룹 ${groupCount}교시</span>
        <span class="tsa-badge tsa-badge-gray" style="font-size:10px">합계 ${uniquePeriods.size}교시</span>
        <span style="width:1px;height:14px;background:#E5E7EB;display:inline-block"></span>
        <span style="font-size:10px;font-weight:700;color:#16A34A">출석 ${summary.present}</span>
        <span style="font-size:10px;font-weight:700;color:#EF4444">결석 ${summary.absent}</span>
        <span style="font-size:10px;font-weight:700;color:#D97706">지각 ${summary.late}</span>
        <span style="font-size:10px;font-weight:700;color:#8B5CF6">조퇴 ${summary.early}</span>
        <button type="button" onclick="toggleStudentPenalty(${student.id})" style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;border:1px solid ${summary.penalty ? '#FCA5A5' : '#A7F3D0'};background:${summary.penalty ? '#FEE2E2' : '#D1FAE5'};color:${summary.penalty ? '#DC2626' : '#047857'};cursor:pointer">${summary.penalty ? '⚠ 1:1 패널티' : '✓ 정상'}</button>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;margin-bottom:10px;border:1px solid #E5E7EB;border-radius:9px;background:#F8F9FC">
      <button type="button" onclick="shiftStudentScheduleWeek(${student.id},-1)" ${prevDisabled ? 'disabled' : ''} title="전주" style="width:30px;height:30px;flex-shrink:0;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:${prevDisabled ? '#D1D5DB' : '#374151'};font-size:14px;font-weight:700;cursor:${prevDisabled ? 'not-allowed' : 'pointer'}">‹</button>
      <div style="position:relative;flex:1;min-width:180px">
        <button type="button" onclick="var i=document.getElementById('student-schedule-week-picker');if(i.showPicker){try{i.showPicker();}catch(e){i.focus();}}else{i.focus();i.click();}" style="width:100%;height:34px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:#111827;font-size:11.5px;font-weight:700;cursor:pointer">${weekLabel}</button>
        <input type="date" id="student-schedule-week-picker" value="${studentScheduleIsoDate(monday)}" min="${enrollmentStart}" max="${enrollmentEnd}" onchange="pickStudentScheduleWeek(${student.id}, this.value)" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;border:0;padding:0">
      </div>
      <button type="button" onclick="shiftStudentScheduleWeek(${student.id},1)" ${nextDisabled ? 'disabled' : ''} title="차주" style="width:30px;height:30px;flex-shrink:0;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:${nextDisabled ? '#D1D5DB' : '#374151'};font-size:14px;font-weight:700;cursor:${nextDisabled ? 'not-allowed' : 'pointer'}">›</button>
      <span style="font-size:10px;color:#6B7280;white-space:nowrap">주간을 클릭해 날짜를 선택하면 해당 주로 이동해. 수업 칸을 클릭하면 출결을 기록/수정할 수 있어.</span>
    </div>
    ${uniquePeriods.size ? '' : '<div style="padding:10px;margin-bottom:10px;border-radius:8px;background:#FFF7ED;color:#B45309;font-size:11px">아직 배정된 수업이 없어. 수업 배정 관리에서 배정해줘.</div>'}
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:620px">
        <thead><tr><th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;width:72px">교시</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
}

// 강사별 스케줄 조회 주간(월요일 기준) 이동/저장 — 강사별로 따로 기억한다. 학생 쪽과 달리 재직 기간으로 막을
// 필요가 없어서 이전/다음 주 이동에 제한을 두지 않는다.
function teacherScheduleWeekAnchorKey(teacherId) {
  return String(teacherId);
}

function renderTeacherScheduleTab(teacherId) {
  const teacher = MOCK_TEACHERS.find(item => item.id === Number(teacherId));
  const container = document.getElementById('teacher-modal-tab-content');
  if (!teacher || !container) return;
  container.innerHTML = buildTeacherWeeklyScheduleHtml(teacher);
}

function shiftTeacherScheduleWeek(teacherId, direction) {
  const teacher = MOCK_TEACHERS.find(item => item.id === Number(teacherId));
  if (!teacher) return;
  APP.teacherScheduleWeekAnchor = APP.teacherScheduleWeekAnchor || {};
  const key = teacherScheduleWeekAnchorKey(teacher.id);
  const anchorDate = studentScheduleDate(APP.teacherScheduleWeekAnchor[key]) || studentScheduleDate(SCHEDULE_TODAY_STR) || new Date();
  anchorDate.setDate(anchorDate.getDate() + direction * 7);
  APP.teacherScheduleWeekAnchor[key] = studentScheduleIsoDate(anchorDate);
  renderTeacherScheduleTab(teacher.id);
}

function pickTeacherScheduleWeek(teacherId, isoValue) {
  const teacher = MOCK_TEACHERS.find(item => item.id === Number(teacherId));
  if (!teacher || !isoValue) return;
  APP.teacherScheduleWeekAnchor = APP.teacherScheduleWeekAnchor || {};
  APP.teacherScheduleWeekAnchor[teacherScheduleWeekAnchorKey(teacher.id)] = isoValue;
  renderTeacherScheduleTab(teacher.id);
}

// 강사 개인 주간 스케줄. 학생 스케줄과 동일한 현재 배정 원천을 사용해
// 1:1 및 그룹 배정 변경이 강사 상세에도 즉시 반영되게 한다. 빈 교시에는 "교시별 가능 여부"
// 탭에서 설정한 가용성(가용/화상/차단)을 그대로 노출해 별도 탭을 오가지 않아도 배정 가능 시간을 알 수 있게 한다.
function buildTeacherWeeklyScheduleHtml(teacher) {
  if (!teacher) return '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">강사 정보를 찾을 수 없어.</div>';
  const allEntries = buildFinalTimetableEntries().filter(entry => entry.teacherId === teacher.id);
  const periods = typeof getBellPeriods === 'function'
    ? getBellPeriods()
    : Array.from({ length: (APP && APP.bellSystem && APP.bellSystem.total) || 8 }, (_, i) => ({ period: i + 1, start: '', end: '' }));
  const bySlot = new Map();
  allEntries.forEach(entry => {
    const key = `${entry.dayOfWeek}|${entry.period}`;
    if (!bySlot.has(key)) bySlot.set(key, []);
    bySlot.get(key).push(entry);
  });

  // 외부 화상수업 LMS(talkstation.co.kr) 연동을 흉내낸 목업. 어학원 수업은 50분 교시 단위지만
  // 화상수업은 30분 단위로 교시 개념이 없어서, 억지로 같은 교시 칸에 합치면 시간이 왜곡돼 보인다.
  // 그래서 아래에 실제 시계 시간 기준의 별도 타임라인 그리드로 분리해서 보여준다.
  const onlineEntries = (typeof MOCK_ONLINE_CLASSES !== 'undefined' ? MOCK_ONLINE_CLASSES : []).filter(entry => entry.teacherId === teacher.id);
  const onlineStatusStyle = {
    regular: { label: 'Regular Class', color: '#0891B2' },
    reservation: { label: 'Reservation', color: '#7C3AED' },
    makeup: { label: 'Make-up', color: '#EA580C' },
  };

  APP.teacherScheduleWeekAnchor = APP.teacherScheduleWeekAnchor || {};
  const anchorKey = teacherScheduleWeekAnchorKey(teacher.id);
  const anchorDate = studentScheduleDate(APP.teacherScheduleWeekAnchor[anchorKey]) || studentScheduleDate(SCHEDULE_TODAY_STR) || new Date();
  const monday = new Date(anchorDate);
  monday.setDate(anchorDate.getDate() - ((anchorDate.getDay() + 6) % 7));
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const weekDates = LESSON_DAYS.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { day, date, iso: studentScheduleIsoDate(date) };
  });
  const weekLabel = `${monday.getFullYear()}.${String(monday.getMonth() + 1).padStart(2, '0')}.${String(monday.getDate()).padStart(2, '0')} ~ ${friday.getFullYear()}.${String(friday.getMonth() + 1).padStart(2, '0')}.${String(friday.getDate()).padStart(2, '0')}`;

  const typeStyle = classType => classType === '1:1'
    ? { bg: '#EEF2FF', border: '#C7D2FE', color: '#4338CA' }
    : classType === '1:4'
      ? { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' }
      : { bg: '#D1FAE5', border: '#A7F3D0', color: '#047857' };
  const availStyle = {
    open:  { bg: '#EEF2FF', border: '#C7D2FE', color: '#5E5CE6', text: '가용' },
    gray:  { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309', text: '화상' },
    black: { bg: '#F3F4F6', border: '#D1D5DB', color: '#9CA3AF', text: '차단' },
  };
  const headerCells = weekDates.map(({ day, date }) =>
    `<th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;text-align:center">${day}<div style="font-size:9px;color:#9CA3AF;margin-top:2px">${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}</div></th>`
  ).join('');
  const bodyRows = periods.map(slot => {
    const cells = weekDates.map(({ day }) => {
      const slotEntries = bySlot.get(`${day}|${slot.period}`) || [];
      if (!slotEntries.length) {
        const state = getAvailState(teacher, day, slot.period);
        const s = availStyle[state] || availStyle.open;
        return `<td style="border:1px solid #E5E7EB;padding:6px;height:68px;background:#FCFCFD;text-align:center;vertical-align:middle">
          <span style="display:inline-block;padding:3px 9px;border-radius:20px;background:${s.bg};color:${s.color};border:1px solid ${s.border};font-size:10px;font-weight:700">${s.text}</span>
        </td>`;
      }
      const cards = slotEntries.map(entry => {
        const style = typeStyle(entry.classType);
        return `<div style="padding:5px 6px;border:1px solid ${style.border};border-left:3px solid #4338CA;border-radius:7px;background:${style.bg};text-align:left;margin-bottom:3px;overflow:hidden">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
            <span style="font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;background:#fff;border:1px solid ${style.border};color:${style.color};white-space:nowrap">🏫 ${lessonEsc(entry.classType)}</span>
            <b style="font-size:10.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(entry.subjectName)}</b>
          </div>
          <div style="font-size:10px;font-weight:700;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(entry.studentLabel)}</div>
          <div style="font-size:9.5px;color:#6B7280;margin-top:2px">${lessonEsc(entry.roomLabel)}</div>
        </div>`;
      }).join('');
      return `<td style="border:1px solid #E5E7EB;padding:4px;height:68px;vertical-align:top">${cards}</td>`;
    }).join('');
    return `<tr>
      <th style="border:1px solid #E5E7EB;background:#F8F9FC;padding:6px;text-align:center;white-space:nowrap">
        <div style="font-size:11px;font-weight:800;color:#374151">${slot.period}교시</div>
        ${slot.start ? `<div style="font-size:9px;color:#9CA3AF">${slot.start}~${slot.end}</div>` : ''}
      </th>${cells}
    </tr>`;
  }).join('');

  const weekEntries = allEntries.filter(entry => weekDates.some(wd => wd.day === entry.dayOfWeek));
  const uniqueLessons = new Set(weekEntries.map(entry => `${entry.classType}|${entry.subjectId}|${entry.period}`));
  const oneToOneCount = new Set(weekEntries.filter(e => e.classType === '1:1').map(e => `${e.subjectId}|${e.period}|${e.studentIds.join(',')}`)).size;
  const groupCount = new Set(weekEntries.filter(e => e.classType !== '1:1').map(e => `${e.groupId}|${e.period}`)).size;
  const weekOnlineEntries = onlineEntries.filter(entry => weekDates.some(wd => wd.day === entry.dayOfWeek));
  const onlineCount = weekOnlineEntries.length;

  // 화상수업 전용 타임라인: 30분 단위 실제 시계 시간을 그대로 써서, 50분 교시 그리드에 억지로
  // 맞추지 않고 어학원 스케줄 표 아래에 별도 섹션으로 분리해 보여준다.
  const toMinutes = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
  const toHm = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
  const onlineTimeSlots = [];
  if (weekOnlineEntries.length) {
    const rangeStart = Math.floor(Math.min(...weekOnlineEntries.map(e => toMinutes(e.startTime))) / 30) * 30;
    const rangeEnd = Math.ceil(Math.max(...weekOnlineEntries.map(e => toMinutes(e.endTime))) / 30) * 30;
    for (let m = rangeStart; m < rangeEnd; m += 30) onlineTimeSlots.push({ start: toHm(m), end: toHm(m + 30) });
  }
  const onlineByDayTime = new Map();
  weekOnlineEntries.forEach(entry => onlineByDayTime.set(`${entry.dayOfWeek}|${entry.startTime}`, entry));
  const onlineRows = onlineTimeSlots.map(ts => {
    const cells = weekDates.map(({ day }) => {
      const entry = onlineByDayTime.get(`${day}|${ts.start}`);
      if (!entry) return '<td style="border:1px solid #E5E7EB;padding:6px;height:44px;background:#FCFCFD;text-align:center;color:#D1D5DB;font-size:10.5px">-</td>';
      const st = onlineStatusStyle[entry.status] || onlineStatusStyle.regular;
      return `<td style="border:1px solid #E5E7EB;padding:4px;height:44px;vertical-align:top">
        <div style="padding:4px 6px;border:1px solid #A5F3FC;border-left:3px solid #0EA5E9;border-radius:6px;background:#ECFEFF;text-align:left;overflow:hidden">
          <div style="display:flex;align-items:center;gap:4px">
            <span style="font-size:8.5px;font-weight:800;color:${st.color};white-space:nowrap">💻 ${lessonEsc(st.label)}</span>
          </div>
          <div style="font-size:10px;font-weight:700;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(entry.studentLabel)}</div>
        </div>
      </td>`;
    }).join('');
    return `<tr>
      <th style="border:1px solid #E5E7EB;background:#ECFEFF;padding:5px 6px;text-align:center;white-space:nowrap;font-size:10px;font-weight:800;color:#0E7490">${ts.start}~${ts.end}</th>
      ${cells}
    </tr>`;
  }).join('');

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div style="font-size:12px;font-weight:800;color:#111827">📅 주간 스케줄 <span style="font-size:10.5px;font-weight:600;color:#6B7280">월~금 · 현재 배정 기준</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        <span class="tsa-badge" style="font-size:10px;background:#EEF2FF;color:#4338CA">🏫 어학원 ${uniqueLessons.size}교시</span>
        <span class="tsa-badge" style="font-size:10px;background:#ECFEFF;color:#0891B2">💻 화상 ${onlineCount}건</span>
        <span style="width:1px;height:14px;background:#E5E7EB;display:inline-block"></span>
        <span class="tsa-badge tsa-badge-primary" style="font-size:10px">1:1 ${oneToOneCount}교시</span>
        <span class="tsa-badge tsa-badge-success" style="font-size:10px">그룹 ${groupCount}교시</span>
        <span style="width:1px;height:14px;background:#E5E7EB;display:inline-block"></span>
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${availStyle.open.bg};color:${availStyle.open.color};border:1px solid ${availStyle.open.border}">가용</span>
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${availStyle.gray.bg};color:${availStyle.gray.color};border:1px solid ${availStyle.gray.border}">화상</span>
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${availStyle.black.bg};color:${availStyle.black.color};border:1px solid ${availStyle.black.border}">차단</span>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;padding:10px 12px;margin-bottom:10px;border:1px solid #E5E7EB;border-radius:9px;background:#F8F9FC">
      <button type="button" onclick="shiftTeacherScheduleWeek(${teacher.id},-1)" title="전주" style="width:30px;height:30px;flex-shrink:0;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:#374151;font-size:14px;font-weight:700;cursor:pointer">‹</button>
      <div style="position:relative;flex:1;min-width:180px">
        <button type="button" onclick="var i=document.getElementById('teacher-schedule-week-picker');if(i.showPicker){try{i.showPicker();}catch(e){i.focus();}}else{i.focus();i.click();}" style="width:100%;height:34px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:#111827;font-size:11.5px;font-weight:700;cursor:pointer">${weekLabel}</button>
        <input type="date" id="teacher-schedule-week-picker" value="${studentScheduleIsoDate(monday)}" onchange="pickTeacherScheduleWeek(${teacher.id}, this.value)" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;border:0;padding:0">
      </div>
      <button type="button" onclick="shiftTeacherScheduleWeek(${teacher.id},1)" title="차주" style="width:30px;height:30px;flex-shrink:0;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:#374151;font-size:14px;font-weight:700;cursor:pointer">›</button>
      <span style="font-size:10px;color:#6B7280;white-space:nowrap">주간을 클릭해 날짜를 선택하면 해당 주로 이동해.</span>
    </div>
    ${uniqueLessons.size ? '' : '<div style="padding:10px;margin-bottom:10px;border-radius:8px;background:#FFF7ED;color:#B45309;font-size:11px">이번 주에 배정된 수업이 없어. 수업 배정 관리에서 배정해줘.</div>'}
    <div style="font-size:11px;font-weight:800;color:#374151;margin-bottom:6px">🏫 어학원 수업 (교시 단위)</div>
    <div style="overflow-x:auto;margin-bottom:16px">
      <table style="width:100%;border-collapse:collapse;min-width:620px;table-layout:fixed">
        <thead><tr><th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;width:72px">교시</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
    ${onlineTimeSlots.length ? `
    <div style="font-size:11px;font-weight:800;color:#0E7490;margin-bottom:6px">💻 화상 수업 (30분 단위 · talkstation.co.kr 연동 예시)</div>
    <div style="padding:8px 12px;margin-bottom:8px;border-radius:8px;background:#ECFEFF;color:#0E7490;font-size:10.5px;border:1px solid #A5F3FC">외부 화상수업 LMS 데이터를 예시로 표시한 목업입니다 — 실 연동 전까지는 실제 값과 다를 수 있습니다. 어학원 수업과 교시 단위가 달라 표를 분리했습니다.</div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:620px;table-layout:fixed">
        <thead><tr><th style="padding:7px 6px;font-size:11px;font-weight:800;color:#0E7490;background:#ECFEFF;border:1px solid #E5E7EB;width:72px">시간</th>${headerCells}</tr></thead>
        <tbody>${onlineRows}</tbody>
      </table>
    </div>` : ''}`;
}

// 수업 배정 관리 목록의 "스케줄" 버튼 → 학생 상세 팝업을 '수강 현황 > 스케줄' 탭으로 바로 연다.
function openStudentSchedulePopup(studentId) {
  if (typeof openStudentDetailPopup !== 'function') return;
  openStudentDetailPopup(Number(studentId), 'admin', 'schedule');
}

let _finalTimetableView = 'all';
let _ftEntityOptions = [];

function setFinalTimetableView(mode, btn) {
  _finalTimetableView = mode;
  ['all', 'student', 'teacher', 'room'].forEach(m => {
    const b = document.getElementById('ft-tab-' + m);
    if (!b) return;
    b.classList.toggle('tsa-btn-primary', m === mode);
    b.classList.toggle('tsa-btn-outline', m !== mode);
  });
  const picker = document.getElementById('ft-entity-picker');
  const search = document.getElementById('ft-entity-search');
  const valueInput = document.getElementById('ft-entity-value');
  if (picker) {
    if (mode === 'all') {
      picker.style.display = 'none';
      _ftEntityOptions = [];
    } else {
      picker.style.display = '';
      if (mode === 'student') _ftEntityOptions = MOCK_STUDENTS.filter(s => getStudentLessonRequirements(s).length).map(s => ({ value: s.id, label: s.nick || s.name }));
      if (mode === 'teacher') _ftEntityOptions = MOCK_TEACHERS.filter(t => t.status !== 'resigned').map(t => ({ value: t.id, label: t.nick || t.name }));
      if (mode === 'room') _ftEntityOptions = MOCK_CLASS_ROOMS.filter(r => r.status === 'active').map(r => ({ value: r.id, label: r.roomNo }));
      if (search) search.value = '';
      if (valueInput) valueInput.value = '';
      hideFtEntityOptions();
    }
  }
  renderFinalTimetableView();
}

// 학생/강사/강의실 검색창: 입력할 때마다 후보 목록을 필터링해서 드롭다운으로 보여준다(select 대신 검색형 선택).
function filterFtEntityOptions() {
  const box = document.getElementById('ft-entity-options');
  const search = document.getElementById('ft-entity-search');
  if (!box || !search) return;
  const query = search.value.trim().toLowerCase();
  const matches = query ? _ftEntityOptions.filter(o => String(o.label).toLowerCase().includes(query)) : _ftEntityOptions;
  box.innerHTML = matches.length
    ? matches.map(o => `<div class="ft-entity-option" data-value="${o.value}" data-label="${lessonEsc(o.label)}" onmousedown="selectFtEntity(this)" style="padding:7px 10px;font-size:11.5px;cursor:pointer" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='#fff'">${lessonEsc(o.label)}</div>`).join('')
    : '<div style="padding:7px 10px;font-size:11.5px;color:#9CA3AF">검색 결과가 없어.</div>';
  box.style.display = 'block';
}

function hideFtEntityOptions() {
  const box = document.getElementById('ft-entity-options');
  if (box) box.style.display = 'none';
}

function onFtEntitySearchInput() {
  const search = document.getElementById('ft-entity-search');
  const valueInput = document.getElementById('ft-entity-value');
  if (valueInput && search && !search.value.trim()) valueInput.value = '';
  filterFtEntityOptions();
  renderFinalTimetableView();
}

function selectFtEntity(optionEl) {
  const search = document.getElementById('ft-entity-search');
  const valueInput = document.getElementById('ft-entity-value');
  if (search) search.value = optionEl.dataset.label;
  if (valueInput) valueInput.value = optionEl.dataset.value;
  hideFtEntityOptions();
  renderFinalTimetableView();
}

function renderFinalTimetableView() {
  const body = document.getElementById('cs-final-timetable-body');
  if (!body) return;
  const entries = buildFinalTimetableEntries();
  const entityId = document.getElementById('ft-entity-value')?.value;
  let filtered = entries;
  if (_finalTimetableView === 'student' && entityId) filtered = entries.filter(e => e.studentIds.includes(Number(entityId)));
  if (_finalTimetableView === 'teacher' && entityId) filtered = entries.filter(e => e.teacherId === Number(entityId));
  if (_finalTimetableView === 'room' && entityId) {
    const targetRoom = MOCK_CLASS_ROOMS.find(r => r.id === Number(entityId));
    filtered = entries.filter(e => e.kind === 'GROUP' ? e.roomId === Number(entityId) : (targetRoom && e.roomLabel === targetRoom.roomNo));
  }
  if (!filtered.length) {
    body.innerHTML = '<div style="padding:40px;text-align:center;color:#9CA3AF;border:1px dashed #D1D5DB;border-radius:10px">표시할 시간표 항목이 없어.</div>';
    return;
  }
  const typeColor = { '1:1': { bg: '#ECFDF5', color: '#047857' }, '1:4': { bg: '#FFF7ED', color: '#C2410C' }, '1:8': { bg: '#EEF2FF', color: '#4338CA' } };
  const periods = getPeriodList();
  const cellKey = (day, period) => `${day}__${period}`;
  const byCell = new Map();
  filtered.forEach(e => {
    const key = cellKey(e.dayOfWeek, e.period);
    if (!byCell.has(key)) byCell.set(key, []);
    byCell.get(key).push(e);
  });

  const dayCols = LESSON_DAYS.map(day => `<th style="padding:8px;text-align:center;background:#F3F4F6;min-width:150px">${lessonEsc(day)}</th>`).join('');

  const rows = periods.map(p => {
    const cells = LESSON_DAYS.map(day => {
      const entries = byCell.get(cellKey(day, p.order)) || [];
      if (!entries.length) return `<td style="border:1px solid #F0F1F3;vertical-align:top;padding:4px"></td>`;
      const cellHtml = entries.map(e => {
        const color = typeColor[e.classType] || { bg: '#F3F4F6', color: '#4B5563' };
        return `
        <div style="padding:6px 7px;border-radius:7px;background:${color.bg};margin-bottom:3px">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
            <b style="font-size:10.5px;color:${color.color}">${lessonEsc(e.subjectName)}</b>
            <span style="font-size:8.5px;font-weight:800;color:${color.color}">${e.classType}</span>
          </div>
          <div style="font-size:9.5px;color:#4B5563;margin-top:2px">${lessonEsc(e.studentLabel)}</div>
          <div style="font-size:9px;color:#9CA3AF;margin-top:1px">${lessonEsc(e.teacherName)} · ${lessonEsc(e.roomLabel)}</div>
          <div style="font-size:8.5px;color:#9CA3AF;margin-top:2px;display:flex;flex-wrap:wrap;gap:3px 6px">${(e.studentPeriods || []).filter(sp => sp.period).map(sp => e.kind === 'GROUP' ? `<span>${lessonEsc(sp.name)} ${lessonEsc(sp.period)}</span>` : `<span>수강 ${lessonEsc(sp.period)}</span>`).join('')}</div>
        </div>`;
      }).join('');
      return `<td style="border:1px solid #F0F1F3;vertical-align:top;padding:4px">${cellHtml}</td>`;
    }).join('');
    return `
    <tr>
      <td style="border:1px solid #F0F1F3;padding:8px;text-align:center;background:#FAFAFB;white-space:nowrap">
        <div style="font-size:11px;font-weight:800;color:#111827">${p.order}교시</div>
        <div style="font-size:9px;color:#9CA3AF;margin-top:2px">${p.startTime}-${p.endTime}</div>
      </td>
      ${cells}
    </tr>`;
  }).join('');

  body.innerHTML = `
  <div style="overflow-x:auto">
    <table class="tsa-table" style="width:100%;border-collapse:collapse">
      <thead><tr><th style="padding:8px;text-align:center;background:#F3F4F6;min-width:80px">교시</th>${dayCols}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

// 그룹이 매칭 대상으로 지정한 레벨군 목록(체크박스 다중 선택)을 반환한다.
// 예전 데이터(단일 levelGroup 또는 levelGroupMin~Max 범위)와도 호환된다.
function getGroupLevelSet(g) {
  if (Array.isArray(g.levelGroups) && g.levelGroups.length) return [...g.levelGroups].sort((a, b) => a - b);
  const min = g.levelGroupMin != null ? g.levelGroupMin : g.levelGroup;
  const max = g.levelGroupMax != null ? g.levelGroupMax : g.levelGroup;
  const list = [];
  for (let i = min; i <= max; i++) list.push(i);
  return list;
}

function getGroupLevelSetLabel(g) {
  const levels = getGroupLevelSet(g);
  if (!levels.length) return '-';
  // 연속된 구간이면 "A ~ B"로, 아니면 콤마로 나열
  const isContiguous = levels.every((v, i) => i === 0 || v === levels[i - 1] + 1);
  if (isContiguous && levels.length > 1) return `${getLevelGroupName(levels[0])} ~ ${getLevelGroupName(levels[levels.length - 1])}`;
  return levels.map(getLevelGroupName).join(', ');
}

// 그룹이 매칭 대상으로 지정한 과정 목록(체크박스 다중 선택)을 반환한다. 예전 단일 course 필드와도 호환된다.
function getGroupCourses(g) {
  if (Array.isArray(g.courses) && g.courses.length) return g.courses;
  return g.course ? [g.course] : [];
}

function getGroupCoursesLabel(g) {
  const courses = getGroupCourses(g);
  return courses.length ? courses.join(', ') : '-';
}

function getGroupSubjectId(group) {
  return group?.subjectId || group?.subjectIds?.[0] || group?.curriculum?.[0]?.id || null;
}

function getGroupSubjectName(group) {
  const subjectId = getGroupSubjectId(group);
  return MOCK_MASTER_SUBJECTS.find(subject => subject.id === subjectId)?.name || subjectId || '-';
}

function getStudentGroupSubjectRefs(student, classType) {
  const course = MOCK_COURSES.find(item => item.name === student?.course && item.active !== false);
  return course?.subjectsByType?.[classType] || [];
}

function studentCanTakeGroupSubject(student, subjectId, classType) {
  return getStudentGroupSubjectRefs(student, classType).some(ref => ref.id === subjectId);
}

// 그룹 목록 화면 분류용 — 정원 6명까지는 소그룹, 7명 이상은 중그룹으로 묶어서 보여준다
function getGroupSizeCategory(classType) {
  const cap = getGroupClassCapacity(classType);
  return cap > 6 ? 'large' : 'medium';
}

// row.curriculum(과목+교시 배열)을 HTML onclick 속성 안에 안전하게 심을 수 있는 JS 배열 리터럴 문자열로 변환한다.
// (JSON.stringify를 쓰면 큰따옴표가 onclick="..." 속성을 깨뜨리므로 작은따옴표만 사용)
function curriculumJsLiteral(curriculum) {
  return '[' + (curriculum || []).map(ref => `{id:'${ref.id}',hours:${Math.max(1, Number(ref.hours) || 1)}}`).join(',') + ']';
}

function getGroupSizeShortLabel(classType) {
  return getGroupSizeCategory(classType) === 'large' ? '중그룹' : '소그룹';
}

// 정원이 작은 유형부터(소그룹 1:4 → 중그룹 1:8). 목록은 이 순서로 묶어 보여준다.
function getGroupTypeRank(classType) {
  const index = MOCK_MASTER_CLASS_TYPES
    .filter(type => type.classMode === 'group' && type.visible !== false)
    .sort((a, b) => a.maxStudents - b.maxStudents)
    .findIndex(type => type.code === classType);
  return index < 0 ? 99 : index;
}

// 그룹 수업 유형 태그. 이름만으로는 표를 훑을 때 소/중이 잘 안 갈려서 색으로도 나눈다 — 소그룹 파랑, 중그룹 초록.
const GROUP_TYPE_TAG_COLORS = {
  small: { bg: '#DBEAFE', ink: '#1D4ED8' },
  large: { bg: '#D1FAE5', ink: '#047857' }
};

function getGroupTypeTagColors(classType) {
  return getGroupSizeCategory(classType) === 'large' ? GROUP_TYPE_TAG_COLORS.large : GROUP_TYPE_TAG_COLORS.small;
}

function getGroupTypeTagHtml(classType, options) {
  const { bg, ink } = getGroupTypeTagColors(classType);
  const label = `${getGroupSizeShortLabel(classType)}${options?.hideCode ? '' : ` (${classType})`}`;
  return `<span style="display:inline-block;padding:2px 8px;border-radius:5px;background:${bg};color:${ink};font-size:10px;font-weight:700;white-space:nowrap">${lessonEsc(label)}</span>`;
}

function getGroupDisplayName(group) {
  const refs = getGroupCurriculumRefs(group);
  const names = [...refs]
    .sort((a, b) => (MOCK_MASTER_SUBJECTS.find(s => s.id === a.id)?.order ?? 999) - (MOCK_MASTER_SUBJECTS.find(s => s.id === b.id)?.order ?? 999))
    .map(ref => MOCK_MASTER_SUBJECTS.find(s => s.id === ref.id)?.name || ref.id)
    .join('·');
  return `${getGroupLevelSetLabel(group)} · ${names || '-'} · ${getGroupSizeShortLabel(group.classType)}`;
}

function getGroupCurriculumRefs(group) {
  if (Array.isArray(group.curriculum) && group.curriculum.length) return group.curriculum;
  const subjectId = getGroupSubjectId(group);
  if (subjectId) return [{ id: subjectId, hours: group.subjectHours || 1 }];
  const course = MOCK_COURSES.find(item => getGroupCourses(group).includes(item.name));
  return course?.subjectsByType?.[group.classType] || [];
}

function isGroupNationalityLimitExceeded(group, student) {
  const cap = getEffectiveNationalityCap(group);
  const count = group.studentIds.filter(id => {
    const s = MOCK_STUDENTS.find(x => x.id === id);
    return s && s.nationality === student.nationality;
  }).length;
  return count >= cap;
}

function getGroupAssignmentNationalityViolation(group, studentIds) {
  const cap = getEffectiveNationalityCap(group);
  const nationalityCounts = new Map();
  group.studentIds.forEach(studentId => {
    const student = MOCK_STUDENTS.find(item => item.id === studentId);
    if (!student?.nationality) return;
    nationalityCounts.set(student.nationality, (nationalityCounts.get(student.nationality) || 0) + 1);
  });
  for (const studentId of studentIds) {
    const student = MOCK_STUDENTS.find(item => item.id === studentId);
    if (!student?.nationality) continue;
    const nextCount = (nationalityCounts.get(student.nationality) || 0) + 1;
    if (nextCount > cap) return { nationality: student.nationality, cap };
    nationalityCounts.set(student.nationality, nextCount);
  }
  return null;
}

// 학생이 그 교시에 이미 무엇을 듣고 있는지 이름으로 돌려준다.
// 배정 후보에서 그냥 숨겨버리면 "왜 이 학생이 목록에 없지"로 되돌아오기 때문에, 막힌 이유를 그대로 적는다.
function getStudentPeriodOccupantLabel(student, period, excludeGroupId) {
  const target = Number(period);
  const oneToOne = (student.oneToOneSchedule || []).find(item => Number(item.period) === target);
  if (oneToOne) {
    const subjectName = MOCK_MASTER_SUBJECTS.find(subject => subject.id === oneToOne.subjectId)?.name || '';
    return subjectName ? `1:1(${subjectName})` : '1:1 수업';
  }
  const other = MOCK_GROUP_CLASSES.find(g =>
    g.id !== excludeGroupId && g.status === 'active' &&
    Array.isArray(g.periods) && g.periods.map(Number).includes(target) &&
    g.studentIds.includes(student.id)
  );
  return other ? `${getGroupSubjectName(other)} 그룹` : '다른 수업';
}

// 그 학생이 이 그룹의 교시와 겹치는지, 겹치면 몇 교시인지 돌려준다.
function getGroupTimeConflictPeriods(group, student) {
  const groupPeriods = Array.isArray(group?.periods) ? group.periods.map(Number).filter(Number.isFinite) : [];
  if (!groupPeriods.length) return [];
  const busyPeriods = getStudentBusyPeriods(student, group.id);
  return groupPeriods.filter(period => busyPeriods.has(period));
}

// options.includeTimeConflict=true면 교시가 겹치는 학생도 목록에 남긴다(이유를 붙여 보여주기 위해).
// 자동 매칭처럼 실제로 배정까지 하는 쪽은 기본값(제외)을 그대로 쓴다.
function getGroupCandidateStudents(group, options) {
  if (!group) return [];
  const includeTimeConflict = options?.includeTimeConflict === true;
  const subjectId = getGroupSubjectId(group);
  const levels = getGroupLevelSet(group);
  return MOCK_STUDENTS.filter(s => {
    const lvl = getLevelGroupForStudent(s);
    const alreadyAssignedToSameSubject = MOCK_GROUP_CLASSES.some(item =>
      item.id !== group.id &&
      item.status === 'active' &&
      item.classType === group.classType &&
      getGroupSubjectId(item) === subjectId &&
      item.studentIds.includes(s.id)
    );
    const busyPeriods = getStudentBusyPeriods(s, group.id);
    const hasTimeConflict = Array.isArray(group.periods) && group.periods.some(p => busyPeriods.has(Number(p)));
    return studentCanTakeGroupSubject(s, subjectId, group.classType) &&
      lvl != null && levels.includes(lvl) &&
      !group.studentIds.includes(s.id) &&
      !alreadyAssignedToSameSubject &&
      (includeTimeConflict || !hasTimeConflict) &&
      isStudentEnrolledInWeek(s, getScaWeek()) &&
      ['current', 'waiting', 'extended'].includes(s.status);
  });
}

// "+배정" 모달과 "상세" 팝업이 함께 쓰는 배정 후보 산출 로직: 정원 마감·동일 국적 제한 초과 여부를 학생별로 표시한다.
function buildGroupAssignCandidateRows(group) {
  if (!group) return [];
  const cap = getGroupCapacityFor(group);
  const remaining = Math.max(0, cap - group.studentIds.length);
  return getGroupCandidateStudents(group, { includeTimeConflict: true }).map(s => {
    const conflictPeriods = getGroupTimeConflictPeriods(group, s);
    const nationalityBlocked = isGroupNationalityLimitExceeded(group, s);
    const blocked = conflictPeriods.length > 0 || remaining <= 0 || nationalityBlocked;
    // 교시 충돌이 가장 구체적인 이유라 정원·국적보다 먼저 보여준다.
    const reason = conflictPeriods.length
      ? `${conflictPeriods.join('·')}교시 ${getStudentPeriodOccupantLabel(s, conflictPeriods[0], group.id)}과 겹침`
      : remaining <= 0 ? '정원 마감' : (nationalityBlocked ? '동일 국적 제한 초과' : '');
    return {
      id: s.id,
      name: s.nick || s.name || '',
      sub: s.name || '',
      photo: s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png'),
      flag: s.flag || '',
      nationality: s.nationality || '-',
      gender: s.gender || '-',
      age: s.age || '-',
      level: s.level || '-',
      course: s.course || '-',
      startDate: s.startDate || '',
      endDate: s.departureDate || '',
      duration: s.duration || '',
      blocked,
      reason
    };
  });
}

function renderCsGroupPanel() {
  renderGroupManagement();
}

function buildCsGroupDemandRows() {
  const week = typeof getScaWeek === 'function' ? getScaWeek() : null;
  const students = MOCK_STUDENTS.filter(student =>
    ['current', 'waiting', 'extended'].includes(student.status) &&
    MOCK_COURSES.some(course => course.name === student.course && course.active !== false) &&
    (!week || isStudentEnrolledInWeek(student, week))
  );
  const buckets = new Map();

  // 기획 결정(2026-07-30 미팅 확정): 그룹 = 과목 단위 개별 클래스. 4과목을 하나로 묶지 않는다.
  // 학생 등록 후 레벨 확인 시점에 필요한 만큼만 점진적으로 생성한다.
  students.forEach(student => {
    const course = MOCK_COURSES.find(item => item.name === student.course);
    const levelGroup = getLevelGroupForStudent(student);
    if (!course || levelGroup == null) return;

    // 같은 과목·레벨·유형이면 과정 템플릿 안에서 몇 번째로 나오는지(sequence)와 무관하게 하나의 수요로 묶는다
    // (회의 결정: 그룹은 특정 교시에 고정되지 않고 레벨·과목만 맞으면 어느 교시에 열려도 배정 가능).
    ['1:4', '1:8'].forEach(classType => {
      const template = getCourseTimetableTemplate(course);
      const subjectIds = new Set(template.filter(item => item.classType === classType).map(item => item.subjectId));
      subjectIds.forEach(subjectId => {
        const key = [subjectId, levelGroup, classType].join('|');
        if (!buckets.has(key)) {
          buckets.set(key, {
            key,
            subjectId,
            subjectName: MOCK_MASTER_SUBJECTS.find(subject => subject.id === subjectId)?.name || subjectId,
            levelGroup,
            classType,
            curriculum: [{ id: subjectId, hours: 1 }],
            studentIds: [],
            courseNames: []
          });
        }
        const bucket = buckets.get(key);
        if (!bucket.studentIds.includes(student.id)) bucket.studentIds.push(student.id);
        if (!bucket.courseNames.includes(course.name)) bucket.courseNames.push(course.name);
      });
    });
  });

  return [...buckets.values()].map(bucket => {
    const capacity = getGroupClassCapacity(bucket.classType);
    const baseCapacity = getGroupBaseCapacity(bucket.classType);
    const matchingGroups = MOCK_GROUP_CLASSES.filter(group =>
      group.status === 'active' &&
      group.classType === bucket.classType &&
      getGroupSubjectId(group) === bucket.subjectId &&
      getGroupLevelSet(group).includes(bucket.levelGroup)
    );
    const assignedIds = new Set(matchingGroups.flatMap(group => group.studentIds));
    const waitingCount = bucket.studentIds.filter(id => !assignedIds.has(id)).length;
    const totalStudents = bucket.studentIds.length;
    const requiredGroups = Math.ceil(totalStudents / baseCapacity);
    const existingGroups = matchingGroups.length;
    const additionalGroups = Math.max(0, requiredGroups - existingGroups);
    const openSeats = matchingGroups.reduce((sum, group) =>
      sum + Math.max(0, capacity - group.studentIds.length), 0
    );
    return {
      ...bucket, capacity, baseCapacity, totalStudents, waitingCount, requiredGroups,
      existingGroups, additionalGroups, openSeats
    };
  }).sort((a, b) =>
    b.additionalGroups - a.additionalGroups ||
    b.waitingCount - a.waitingCount ||
    a.subjectName.localeCompare(b.subjectName, 'ko') ||
    a.levelGroup - b.levelGroup
  );
}

// 레벨별 학생 지표. 수요 목록의 레벨 소계 헤더에 한 번만 얹는다(과목 행마다 반복하지 않는다).
// 그룹 수업이 0개인 과정(IELTS Intensive, Power Speaking 8, 6Hrs Power Speaking, 가디언 코스) 수강생은
// 대상에서 제외한다 — 등록하자마자 "완료"로 잡혀 완료율을 부풀리기 때문. 대상 합계가 전체 재원생 수와
// 다른 이유가 이것이다.
function buildGroupLevelSummaries() {
  const summaries = new Map();
  MOCK_STUDENTS.filter(student =>
    ['current', 'waiting', 'extended'].includes(student.status) &&
    MOCK_COURSES.some(course => course.name === student.course && course.active !== false)
  ).forEach(student => {
    const levelGroup = getLevelGroupForStudent(student);
    if (levelGroup == null) return;
    const groupLessons = getStudentLessonRequirements(student).filter(item => item.classType !== '1:1');
    if (!groupLessons.length) return;
    if (!summaries.has(levelGroup)) {
      summaries.set(levelGroup, {
        levelGroup, targetStudents: 0, doneStudents: 0, waitingStudents: 0,
        assignedLessons: 0, unassignedLessons: 0
      });
    }
    const summary = summaries.get(levelGroup);
    const assigned = groupLessons.filter(item => item.status === 'ASSIGNED').length;
    summary.targetStudents += 1;
    summary.assignedLessons += assigned;
    summary.unassignedLessons += groupLessons.length - assigned;
    // 과정의 그룹 수업을 전부 받았을 때만 배정 완료. 하나라도 남으면 배정 대기.
    if (assigned === groupLessons.length) summary.doneStudents += 1;
    else summary.waitingStudents += 1;
  });
  return summaries;
}

const GROUP_FULL_WEEK = ['월', '화', '수', '목', '금'];

// 요일은 예외만 적는다 — 주5회(월~금)면 빈 문자열을 돌려주고, 그 외에만 칩을 붙인다.
// 대부분이 주5회라 요일 탭을 달면 다섯 탭이 전부 똑같이 보이고 클릭만 늘어난다.
function getGroupDayExceptionLabel(group) {
  const days = Array.isArray(group.dayOfWeek) ? group.dayOfWeek : [];
  if (!days.length || days.length >= GROUP_FULL_WEEK.length) return '';
  return GROUP_FULL_WEEK.filter(day => days.includes(day)).join('·');
}

function getGroupPeriodLabel(group) {
  return Array.isArray(group.periods) && group.periods.length
    ? group.periods.join('·') + '교시'
    : '교시 미정';
}

function getGroupDayPeriodHtml(group) {
  const dayLabel = getGroupDayExceptionLabel(group);
  const chip = dayLabel
    ? `<span style="display:inline-block;padding:0 6px;margin-right:5px;border-radius:4px;background:#FEF3C7;color:#92400E;font-size:10px;font-weight:700">${lessonEsc(dayLabel)}</span>`
    : '';
  return chip + lessonEsc(getGroupPeriodLabel(group));
}

// 스케줄표 칸은 이미 그 교시라서 교시는 다시 적지 않고, 주5회가 아닐 때만 요일 칩을 붙인다.
function getGroupDayPeriodChip(group) {
  const dayLabel = getGroupDayExceptionLabel(group);
  return dayLabel
    ? `<span style="display:inline-block;padding:0 5px;border-radius:4px;background:#FEF3C7;color:#92400E;font-size:9.5px;font-weight:700">${lessonEsc(dayLabel)}</span>`
    : '';
}

function isMergedLevelGroup(group) {
  return getGroupLevelSet(group).length > 1;
}

// 기획 결정(2026-08-26): 통합 그룹은 붙어 있는 레벨 2개까지만.
// 교재가 레벨마다 달라 한 칸 이상 벌어지면 수업이 성립하지 않고,
// 조합이 인접 쌍으로 고정돼야 통합 레벨의 조합별 표가 모든 경우를 빠짐없이 덮는다.
const GROUP_MAX_LEVELS = 2;

// 레벨 순서 목록. 하드코딩하지 않고 레벨 마스터에서 뽑아, 레벨이 늘거나 이름이 바뀌어도 따라간다.
function getVisibleLevelOrders() {
  return MOCK_MASTER_LEVELS
    .filter(level => level.visible !== false)
    .sort((a, b) => a.order - b.order)
    .map(level => level.order);
}

// 붙어 있는 레벨 쌍(1-2, 2-3, ...). 통합 레벨의 표 하나가 이 쌍 하나에 대응한다.
function getAdjacentLevelPairs() {
  const orders = getVisibleLevelOrders();
  return orders.slice(0, -1).map((order, index) => [order, orders[index + 1]]);
}

// 고른 레벨 조합이 규칙에 맞는지. 문제가 없으면 빈 문자열을 돌려준다.
function getGroupLevelSelectionError(levelOrders, isCreate) {
  const levels = [...new Set((levelOrders || []).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
  if (!levels.length) return '레벨을 1개 이상 선택해.';
  // 새로 만드는 반은 통합 레벨을 못 쓴다. 비기너 학생이 로우인터 반에도 잡히면서 같은 학생을 위해
  // 반이 하나 더 생기는 부작용이 있었다. 이미 운영 중인 통합 반은 건드리지 않는다 —
  // 학기 중에 쪼개면 그 반 학생들의 시간표가 통째로 다시 흔들린다.
  if (isCreate && levels.length > 1) {
    return '새로 만드는 반은 레벨 하나만 고를 수 있어. 이미 운영 중인 통합 레벨 반은 그대로 둬도 돼.';
  }
  if (levels.length > GROUP_MAX_LEVELS) return `레벨은 최대 ${GROUP_MAX_LEVELS}개까지만 묶을 수 있어.`;
  if (levels.length === GROUP_MAX_LEVELS) {
    const orders = getVisibleLevelOrders();
    const first = orders.indexOf(levels[0]);
    const second = orders.indexOf(levels[1]);
    if (first < 0 || second < 0 || second - first !== 1) {
      return '붙어 있는 레벨끼리만 묶을 수 있어. 한 칸 이상 떨어진 레벨은 교재가 달라 함께 수업할 수 없어.';
    }
  }
  return '';
}

function getGroupRoomLabel(group) {
  return group.roomId != null
    ? (MOCK_CLASS_ROOMS.find(room => room.id === group.roomId)?.roomNo || '강의실 미배정')
    : '강의실 미배정';
}

function getGroupTeacherLabel(group) {
  return group.teacherId != null
    ? (MOCK_TEACHERS.find(teacher => teacher.id === group.teacherId)?.nick || '-')
    : '강사 미배정';
}

function renderGroupManagement() {
  // 그룹 편성 표는 이제 주간 수업 배정 화면(1단계 아래쪽, 2단계 표)에만 붙는다.
  // 예전 「그룹 수업 관리」 화면이 있던 자리라 이름은 그대로 두고, 하는 일만 그쪽 갱신으로 남겼다.
  const scaView = document.getElementById('view-student-class-assign');
  if (scaView && scaView.classList.contains('active')) renderStudentClassAssignView();
}

function getGroupManagementSubjectLabel(curriculum) {
  return [...(curriculum || [])].sort((a, b) => {
    const aOrder = MOCK_MASTER_SUBJECTS.find(item => item.id === a.id)?.order ?? 999;
    const bOrder = MOCK_MASTER_SUBJECTS.find(item => item.id === b.id)?.order ?? 999;
    return aOrder - bOrder;
  }).map(ref => {
    const subject = MOCK_MASTER_SUBJECTS.find(item => item.id === ref.id);
    return `${subject?.name || ref.id} ${ref.hours || 1}교시`;
  }).join(' · ') || '-';
}

let _gmCourseFilter = 'all';
let _gmLevelFilter = 'all';
let _gmTypeFilter = 'all';
let _gmLevelScope = 'single'; // 그룹 편성 안에서 'single'(개별) | 'merged'(통합)

// 예전 코드가 부르던 자리. 이제 보는 화면은 단계 줄이 정한다.
function setGroupManagementBoardView(view) {
  setScaStep(view === 'schedule' ? 2 : 1);
}

function setGroupManagementLevelScope(scope) {
  _gmLevelScope = scope === 'merged' ? 'merged' : 'single';
  renderGroupManagement();
}

function getGroupManagementRowGroups(row) {
  if (Array.isArray(row.displayGroupIds)) {
    return MOCK_GROUP_CLASSES.filter(group => row.displayGroupIds.includes(group.id));
  }
  return MOCK_GROUP_CLASSES.filter(group =>
    group.status === 'active' &&
    group.classType === row.classType &&
    getGroupSubjectId(group) === row.subjectId &&
    getGroupLevelSet(group).includes(row.levelGroup)
  );
}

function buildGroupManagementDisplayRows() {
  return buildCsGroupDemandRows();
}

function setGroupManagementListFilter(kind, value) {
  if (kind === 'subject') _gmCourseFilter = value;
  if (kind === 'level') _gmLevelFilter = value;
  if (kind === 'type') _gmTypeFilter = value;
  renderGroupManagement();
}

function getGroupManagementDisplayLabel(group, groups) {
  const index = groups.findIndex(item => item.id === group.id);
  const suffix = String.fromCharCode(65 + Math.max(0, index));
  return `${getGroupDisplayName(group)} · ${suffix}반`;
}

// 그룹별 탭: "그룹 생성 대상"이 하던 갭 분석(KPI/필터)을 그대로 가져오고, 표 대신 카드로 보여준다.
// 조건(과목·레벨·유형)에 이미 그룹이 있으면 그 그룹 카드(정원 그리드)에 조건·상태를 함께 표시하고,
// 아직 부족한 만큼은 "+ 그룹 생성" 카드로 같은 그리드에 나란히 놓는다.
function renderGroupManagementActive(content) {
  const sourceRows = buildGroupManagementDisplayRows();
  const rows = sourceRows.filter(row =>
    (_gmCourseFilter === 'all' || (row.curriculum || []).some(ref => ref.id === _gmCourseFilter)) &&
    (_gmLevelFilter === 'all' || (row.levelGroups || [row.levelGroup]).map(String).includes(_gmLevelFilter)) &&
    (_gmTypeFilter === 'all' || row.classType === _gmTypeFilter)
  );
  const subjectIds = [...new Set(sourceRows.flatMap(row => (row.curriculum || []).map(ref => ref.id)))];
  const toolbarHtml = _scaStep === 2
    ? renderGroupScheduleSubjectBar(subjectIds)
    : renderGroupLevelToolbar(subjectIds);

  content.innerHTML = renderGroupManagementBoard(rows, toolbarHtml);
}

function renderGroupLevelToolbar(subjectIds) {
  return `
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
        <select class="tsa-input" style="width:160px;height:34px;font-size:11px" onchange="setGroupManagementListFilter('subject',this.value)">
          <option value="all">포함 과목 전체</option>
          ${subjectIds.map(subjectId => {
            const name = MOCK_MASTER_SUBJECTS.find(subject => subject.id === subjectId)?.name || subjectId;
            return `<option value="${lessonEsc(subjectId)}" ${_gmCourseFilter === subjectId ? 'selected' : ''}>${lessonEsc(name)}</option>`;
          }).join('')}
        </select>
        <select class="tsa-input" style="width:130px;height:34px;font-size:11px" onchange="setGroupManagementListFilter('level',this.value)">
          <option value="all">레벨 전체</option>
          ${[...MOCK_MASTER_LEVELS].filter(level => level.visible !== false).sort((a,b) => a.order-b.order).map(level => `<option value="${level.order}" ${_gmLevelFilter === String(level.order) ? 'selected' : ''}>${lessonEsc(level.name)}</option>`).join('')}
        </select>
        <select class="tsa-input" style="width:168px;height:34px;font-size:11px" onchange="setGroupManagementListFilter('type',this.value)">
          <option value="all">그룹 수업 유형 전체</option>
          ${[...MOCK_MASTER_CLASS_TYPES].filter(type => type.classMode === 'group' && type.visible !== false).map(type => `<option value="${type.code}" ${_gmTypeFilter === type.code ? 'selected' : ''}>${lessonEsc(getGroupSizeShortLabel(type.code))}(${type.code})</option>`).join('')}
        </select>
      </div>`;
}

// 스케줄표는 셀렉트 대신 과목 버튼으로 추린다. 표를 보면서 과목을 갈아끼우는 동작이라
// 열고-고르고-닫는 셀렉트보다 한 번에 눌리는 버튼이 맞다.
function renderGroupScheduleSubjectBar(subjectIds) {
  const buttons = [['all', '전체 과목'], ...subjectIds.map(subjectId =>
    [subjectId, MOCK_MASTER_SUBJECTS.find(subject => subject.id === subjectId)?.name || subjectId]
  )];
  return `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
    ${buttons.map(item => {
      const on = _gmCourseFilter === item[0];
      return `<button onclick="setGroupManagementListFilter('subject','${lessonEsc(item[0])}')" style="padding:6px 13px;border-radius:999px;border:1px solid ${on ? '#5E5CE6' : '#E5E7EB'};background:${on ? '#5E5CE6' : '#fff'};color:${on ? '#fff' : '#6B7280'};font-size:11.5px;font-weight:700;cursor:pointer">${lessonEsc(item[1])}</button>`;
    }).join('')}
  </div>`;
}

// 그룹 수업 편성 보드. 탭 한 줄로 세 화면을 가른다 —
//   그룹 편성: 무엇이 얼마나 부족한가 (수요 목록)
//   통합 레벨:   여러 레벨이 한 그룹을 나눠 쓰는 경우
//   스케줄 배정: 그게 몇 교시 어디에 놓여 있는가 (교시 × 레벨 표)
// KPI 카드 4장을 대신한다 — 카드는 단위가 뒤섞여 있었고(생성해야 할 그룹 수 vs 이미 있는 그룹 수),
// 배정 완료는 자리가 한 칸이라도 남으면 배정 필요로 넘어가 개강 초기엔 거의 항상 0이었다.
function renderGroupManagementBoard(rows, toolbarHtml) {
  const summaries = buildGroupLevelSummaries();
  // 레벨 안에서 소그룹(1:4) → 중그룹(1:8) 순으로 묶는다. 통합 레벨과 같은 순서다.
  const levelRows = [...rows].sort((a, b) => {
    return a.levelGroup - b.levelGroup
      || getGroupTypeRank(a.classType) - getGroupTypeRank(b.classType)
      || a.subjectName.localeCompare(b.subjectName, 'ko');
  });

  // 그룹 편성 안에서 개별/통합을 가르는 버튼. 통합 그룹은 정원을 조합 전체가 공유해서
  // 개별 레벨 표에 섞으면 자리 수가 두 배로 읽힌다 — 그래서 표를 아예 갈라놓는다.
  const scopes = [['single', '개별 레벨'], ['merged', '통합 레벨']];
  const scopeHtml = `<div style="display:flex;gap:6px">
    ${scopes.map(scope => {
      const on = _gmLevelScope === scope[0];
      return `<button onclick="setGroupManagementLevelScope('${scope[0]}')" style="padding:7px 14px;border-radius:8px;border:1px solid ${on ? '#5E5CE6' : '#E5E7EB'};background:${on ? '#5E5CE6' : '#fff'};color:${on ? '#fff' : '#6B7280'};font-size:11.5px;font-weight:700;cursor:pointer">${scope[1]}</button>`;
    }).join('')}
  </div>`;

  // 표 위 한 줄에 컨트롤을 모은다 — 왼쪽은 무엇을 볼지(개별/통합), 오른쪽은 어떻게 추릴지(필터·정렬).
  const isSchedule = _scaStep === 2;
  const controlsHtml = `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:14px 0">
    ${isSchedule ? toolbarHtml : scopeHtml}
    ${isSchedule ? '' : toolbarHtml}
  </div>`;

  const isMerged = !isSchedule && _gmLevelScope === 'merged';
  const body = isSchedule
    ? renderGroupManagementMatrix()
    : (isMerged
      ? renderGroupMergedLevelSections()
      : renderGroupDemandSingleTable(levelRows, summaries));

  // 세 화면 모두 표/카드가 자체 테두리를 갖고 있다. 한 번 더 흰 상자로 감싸면
  // 카드 사이 여백까지 흰색이 돼서 빈 줄이 하나 끼어 있는 것처럼 보인다.
  return controlsHtml + body;
}

const GM_DEMAND_HEAD = `<thead><tr>
  ${['과목', '그룹 수업 유형', '운영 그룹', '대기'].map((label, index) =>
    `<th style="padding:9px 13px;font-size:10.5px;font-weight:700;color:#9CA3AF;text-align:${index >= 3 ? 'right' : 'left'};border-bottom:1px solid #E5E7EB;white-space:nowrap">${label}</th>`
  ).join('')}
</tr></thead>`;

function renderGroupDemandSingleTable(rows, summaries) {
  if (!rows.length) return '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">조건에 맞는 수요가 없어.</div>';
  const rowsByLevel = new Map();
  rows.forEach(row => {
    if (!rowsByLevel.has(row.levelGroup)) rowsByLevel.set(row.levelGroup, []);
    rowsByLevel.get(row.levelGroup).push(row);
  });

  const levelTables = [...rowsByLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([levelGroup, levelRows]) => {
      const summary = summaries.get(levelGroup);
      const levelId = `group-level-table-${levelGroup}`;
      return `<section style="margin-bottom:14px;border:1px solid #E5E7EB;border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.03)">
        <button type="button" aria-controls="${levelId}" aria-expanded="true" onclick="toggleGroupLevelTable(${levelGroup},this)" style="width:100%;border:0;background:#F8FAFC;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;text-align:left">
          <span style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <b style="font-size:13px;color:#111827">${lessonEsc(getLevelGroupName(levelGroup))}</b>
            ${summary ? `<span style="font-size:11px;color:#94A3B8">대상 <b style="color:#475569">${summary.targetStudents}명</b></span>
              <span style="font-size:11px;color:#94A3B8">배정 <b style="color:#047857">${summary.assignedLessons}건</b></span>
              <span style="font-size:11px;color:#94A3B8">미배정 <b style="color:#B45309">${summary.unassignedLessons}건</b></span>` : ''}
          </span>
          <span data-level-caret style="font-size:12px;color:#94A3B8;transition:transform .15s">▲</span>
        </button>
        <div id="${levelId}" style="display:block;overflow-x:auto">
          <table style="width:100%;min-width:900px;table-layout:fixed;border-collapse:collapse;font-variant-numeric:tabular-nums">
            <colgroup><col style="width:20%"><col style="width:13%"><col style="width:59%"><col style="width:8%"></colgroup>
            ${GM_DEMAND_HEAD}<tbody>${levelRows.map(row => renderGroupDemandRow(row, false)).join('')}</tbody>
          </table>
        </div>
      </section>`;
    }).join('');

  return `${levelTables}
  <div style="padding:2px 4px 11px;display:flex;flex-direction:column;gap:4px;font-size:11px;color:#9CA3AF">
    <span>· 과목별 운영 그룹의 강사·강의실·교시·배정 인원을 한 행에서 확인해. 운영 그룹이 여러 개일 때만 A/B로 구분해.</span>
    <span>· <b style="color:#DC2626">생성 필요 +N</b>은 기존 그룹의 남은 자리로 대기 인원을 감당할 수 없어 추가로 열어야 할 그룹 수야.</span>
    <span>· 요일은 예외만 적어 — 표시가 없으면 <b>주 5회(월~금)</b>야. <b style="color:#5E5CE6">통합</b>으로 표시된 반은 옆 레벨과 함께 쓰는 반이라, 이 레벨의 필요 반 수에는 세지 않아.</span>
  </div>`;
}

function toggleGroupLevelTable(levelGroup, trigger) {
  const panel = document.getElementById(`group-level-table-${levelGroup}`);
  if (!panel) return;
  const shouldOpen = panel.style.display === 'none';
  panel.style.display = shouldOpen ? 'block' : 'none';
  if (trigger) {
    trigger.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    const caret = trigger.querySelector('[data-level-caret]');
    if (caret) caret.textContent = shouldOpen ? '▲' : '▼';
  }
}

// 한 줄 = 반 하나. 반마다 상세 버튼이 오른쪽 끝에 붙는다.
// 줄 높이를 고정해야 반이 여러 개인 행도 줄 간격이 고르게 보인다.
const GM_ROW_LINE_HEIGHT = 30;

function renderGroupDemandRow(row, showLevelPrefix) {
  const allGroups = getGroupManagementRowGroups(row);
  const ownGroups = allGroups.filter(group => !isMergedLevelGroup(group));
  const mergedGroups = allGroups.filter(group => isMergedLevelGroup(group));
  const capacity = getGroupClassCapacity(row.classType);
  const cell = (html, extra) => `<td style="padding:8px 13px;font-size:12.5px;color:#6B7280;border-top:1px solid #F3F4F6;vertical-align:top;${extra || ''}">${html}</td>`;
  // 한 줄은 절대 두 줄로 넘기지 않는다. 넘칠 땐 말줄임으로 자른다.
  const line = html => `<div style="min-height:${GM_ROW_LINE_HEIGHT}px;display:flex;align-items:center;gap:7px;white-space:nowrap">${html}</div>`;

  // 개별 반 먼저, 그 아래 통합 반. 통합은 이 레벨과 옆 레벨이 함께 쓰는 반이라 따로 표시한다.
  const lines = [
    ...ownGroups.map((group, index) => ({ group, code: `${String.fromCharCode(65 + index)}반`, merged: false })),
    ...mergedGroups.map(group => ({ group, code: '통합', merged: true }))
  ];

  const groupLine = item => {
    const group = item.group;
    const count = group.studentIds.length;
    const placed = Array.isArray(group.periods) && group.periods.length;
    return line(`
      <span style="display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:20px;padding:0 6px;border-radius:6px;background:${item.merged ? '#EEF2FF' : '#E0E7FF'};color:#4F46E5;font-size:10px;font-weight:800">${item.code}</span>
      <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.merged ? `<span style="color:#8A90A2;font-size:10.5px">${lessonEsc(getGroupLevelSetLabel(group))}</span>
      ` : ''}${placed
        ? `<b style="color:#111827">${lessonEsc(getGroupTeacherLabel(group))}</b>
           <span style="color:#CBD5E1;margin:0 3px">·</span><span>${lessonEsc(getGroupRoomLabel(group))}</span>
           <span style="color:#CBD5E1;margin:0 3px">·</span><span>${getGroupDayPeriodHtml(group)}</span>`
        : `<span style="padding:2px 7px;border-radius:999px;background:#FEF3C7;color:#B45309;font-size:9.5px;font-weight:800">시간 미정</span>`}
      <span style="color:#CBD5E1;margin:0 3px">·</span><b style="color:#475569">${count}/${capacity}명</b></span>
      <button type="button" onclick="event.stopPropagation();openActiveGroupDetail(${group.id})" title="${lessonEsc(getGroupDisplayName(group))} 상세" style="margin-left:auto;border:1px solid #D8DCE6;background:#fff;color:#475569;border-radius:7px;padding:3px 10px;font-size:10.5px;font-weight:700;cursor:pointer" onmouseover="this.style.borderColor='#5E5CE6';this.style.color='#5E5CE6'" onmouseout="this.style.borderColor='#D8DCE6';this.style.color='#475569'">상세</button>`);
  };

  const needBadge = row.additionalGroups > 0
    ? line(`<span style="display:inline-block;padding:3px 8px;border-radius:999px;background:#FEE2E2;color:#DC2626;font-size:10px;font-weight:700">${lines.length ? '추가 생성 필요' : '운영 그룹 없음 · 생성 필요'} +${row.additionalGroups}</span>`)
    : (!lines.length ? line('<span style="color:#94A3B8;font-size:11px">운영 그룹 없음</span>') : '');

  const createButton = line(`<button type="button" onclick="event.stopPropagation();openGroupCreateBrowserPopup(${curriculumJsLiteral(row.curriculum)},'${row.classType}',${row.levelGroup})" style="border:1px dashed #A5B4FC;background:#fff;color:#5E5CE6;border-radius:7px;padding:4px 11px;font-size:10.5px;font-weight:700;cursor:pointer" onmouseover="this.style.background='#EEF2FF'" onmouseout="this.style.background='#fff'">+ 그룹 만들기</button>`);

  return `<tr>
    <td style="padding:8px 13px 8px 22px;font-size:12.5px;font-weight:700;color:#111827;white-space:nowrap;border-top:1px solid #F3F4F6;vertical-align:top">
      <div style="min-height:${GM_ROW_LINE_HEIGHT}px;display:flex;align-items:center">
        ${showLevelPrefix ? `<span style="font-weight:400;color:#9CA3AF;margin-right:6px">${lessonEsc(getLevelGroupName(row.levelGroup))}</span>` : ''}
        ${lessonEsc(row.subjectName)}
      </div>
    </td>
    ${cell(`<div style="min-height:${GM_ROW_LINE_HEIGHT}px;display:flex;align-items:center">${getGroupTypeTagHtml(row.classType)}</div>`)}
    ${cell(`${lines.map(groupLine).join('')}${needBadge}${createButton}`)}
    ${cell(`<div style="min-height:${GM_ROW_LINE_HEIGHT}px;display:flex;align-items:center;justify-content:flex-end"><b style="font-size:13.5px;color:${row.waitingCount ? '#B45309' : '#9CA3AF'}">${row.waitingCount}명</b></div>`, 'text-align:right;white-space:nowrap')}
  </tr>`;
}

// 통합 레벨. 붙어 있는 레벨 쌍마다 표를 하나씩 만든다(개별 레벨이 레벨마다 표를 두는 것과 같은 구조).
// 정원을 조합 전체가 공유하므로 레벨마다 따로 세면 안 되고, 그래서 개별 탭에서 빼내 여기 모아둔다
// (개별 탭에는 "통합 그룹 N개 운영" 안내만 남는다).
//
// 표 하나에는 세 가지가 같이 들어간다.
//   1) 그 조합으로 이미 운영 중인 통합 그룹
//   2) 양쪽 레벨이 함께 필요로 하고 그룹 수업 유형까지 같은 과목 — 통합으로 열 수 있는 후보
//   3) 못 묶는 과목과 그 이유 — 안 적으면 "왜 여긴 버튼이 없지"로 되돌아온다
function buildMergedLevelPairSections() {
  const demandRows = buildCsGroupDemandRows();
  // 레벨 → (subjectId → classType → row)
  const byLevel = new Map();
  demandRows.forEach(row => {
    if (!byLevel.has(row.levelGroup)) byLevel.set(row.levelGroup, new Map());
    const bySubject = byLevel.get(row.levelGroup);
    if (!bySubject.has(row.subjectId)) bySubject.set(row.subjectId, new Map());
    bySubject.get(row.subjectId).set(row.classType, row);
  });

  const subjectOrder = subjectId => MOCK_MASTER_SUBJECTS.find(subject => subject.id === subjectId)?.order ?? 999;
  const subjectName = subjectId => MOCK_MASTER_SUBJECTS.find(subject => subject.id === subjectId)?.name || subjectId;

  return getAdjacentLevelPairs().map(([lowLevel, highLevel]) => {
    const lowSubjects = byLevel.get(lowLevel) || new Map();
    const highSubjects = byLevel.get(highLevel) || new Map();
    const pairGroups = MOCK_GROUP_CLASSES.filter(group => {
      if (group.status !== 'active') return false;
      const levels = getGroupLevelSet(group);
      return levels.length === 2 && levels[0] === lowLevel && levels[1] === highLevel;
    });

    const subjectIds = [...new Set([...lowSubjects.keys(), ...highSubjects.keys()])]
      .sort((a, b) => subjectOrder(a) - subjectOrder(b) || subjectName(a).localeCompare(subjectName(b), 'ko'));

    const rows = [];
    subjectIds.forEach(subjectId => {
      const lowTypes = lowSubjects.get(subjectId) || new Map();
      const highTypes = highSubjects.get(subjectId) || new Map();
      const sharedTypes = [...lowTypes.keys()].filter(classType => highTypes.has(classType));

      if (sharedTypes.length) {
        sharedTypes.forEach(classType => {
          const lowRow = lowTypes.get(classType);
          const highRow = highTypes.get(classType);
          const group = pairGroups.find(item =>
            item.classType === classType && getGroupSubjectId(item) === subjectId
          ) || null;
          rows.push({
            kind: 'mergeable', subjectId, subjectName: subjectName(subjectId), classType,
            lowLevel, highLevel, lowWaiting: lowRow.waitingCount, highWaiting: highRow.waitingCount,
            curriculum: lowRow.curriculum, group
          });
        });
        return;
      }

      // 과목은 양쪽에 다 있는데 유형이 갈리는 경우 — 정원이 4명과 8명으로 달라 한 반에 담을 수 없다.
      if (lowTypes.size && highTypes.size) {
        rows.push({
          kind: 'type-mismatch', subjectId, subjectName: subjectName(subjectId), lowLevel, highLevel,
          lowTypes: [...lowTypes.keys()], highTypes: [...highTypes.keys()],
          lowWaiting: [...lowTypes.values()].reduce((sum, row) => sum + row.waitingCount, 0),
          highWaiting: [...highTypes.values()].reduce((sum, row) => sum + row.waitingCount, 0)
        });
        return;
      }

      const onlyLevel = lowTypes.size ? lowLevel : highLevel;
      const missingLevel = lowTypes.size ? highLevel : lowLevel;
      const onlyTypes = lowTypes.size ? [...lowTypes.keys()] : [...highTypes.keys()];
      rows.push({
        kind: 'one-side', subjectId, subjectName: subjectName(subjectId), lowLevel, highLevel,
        onlyLevel, missingLevel, classType: onlyTypes[0] || '',
        lowWaiting: lowTypes.size ? [...lowTypes.values()].reduce((sum, row) => sum + row.waitingCount, 0) : 0,
        highWaiting: highTypes.size ? [...highTypes.values()].reduce((sum, row) => sum + row.waitingCount, 0) : 0
      });
    });

    // 소그룹(1:4) → 중그룹(1:8) 순으로 묶어 보여준다. 못 묶는 과목은 회색이라 맨 아래로 내린다.
    rows.sort((a, b) =>
      (a.kind === 'mergeable' ? 0 : 1) - (b.kind === 'mergeable' ? 0 : 1) ||
      getGroupTypeRank(a.classType) - getGroupTypeRank(b.classType) ||
      subjectOrder(a.subjectId) - subjectOrder(b.subjectId) ||
      a.subjectName.localeCompare(b.subjectName, 'ko')
    );

    return { lowLevel, highLevel, groups: pairGroups, rows };
  });
}

function renderGroupMergedLevelSections() {
  // 레벨 필터는 "그 레벨이 들어간 조합"만 남기는 뜻으로 쓴다.
  const sections = buildMergedLevelPairSections().filter(section =>
    _gmLevelFilter === 'all' || [section.lowLevel, section.highLevel].map(String).includes(_gmLevelFilter)
  ).map(section => {
    // 개별 레벨 표와 같은 필터(과목·유형)를 그대로 적용한다.
    const rows = section.rows.filter(row =>
      (_gmCourseFilter === 'all' || row.subjectId === _gmCourseFilter) &&
      (_gmTypeFilter === 'all' || row.classType === _gmTypeFilter || row.kind === 'type-mismatch')
    );
    return { ...section, rows };
  });

  if (!sections.length) {
    return '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px;border:1px solid #E5E7EB;border-radius:12px;background:#fff">조건에 맞는 레벨 조합이 없어.</div>';
  }

  const cards = sections.map(section => {
    const pairLabel = `${getLevelGroupName(section.lowLevel)} ~ ${getLevelGroupName(section.highLevel)}`;
    const mergeableRows = section.rows.filter(row => row.kind === 'mergeable');
    const blockedCount = section.rows.length - mergeableRows.length;
    const live = section.groups.length > 0;

    const body = section.rows.length
      ? `<div style="overflow-x:auto"><table style="width:100%;min-width:900px;table-layout:fixed;border-collapse:collapse;font-variant-numeric:tabular-nums">
          <colgroup><col style="width:20%"><col style="width:13%"><col style="width:25%"><col style="width:30%"><col style="width:12%"></colgroup>
          <thead><tr>${['과목', '그룹 수업 유형', '대기 인원', '상태', ''].map((label, index) =>
            `<th style="padding:8px 13px;font-size:10.5px;font-weight:700;color:#9CA3AF;text-align:${index === 4 ? 'right' : 'left'};border-bottom:1px solid #E5E7EB;white-space:nowrap">${label}</th>`
          ).join('')}</tr></thead>
          <tbody>${section.rows.map(row => renderMergedLevelRow(row)).join('')}</tbody>
        </table></div>`
      : `<div style="padding:22px;text-align:center;color:#9CA3AF;font-size:11.5px">조건에 맞는 과목이 없어.</div>`;

    return `<section style="margin-bottom:12px;border:1px solid ${live ? '#C7D2FE' : '#E5E7EB'};border-radius:12px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(15,23,42,.03)">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:11px 14px;background:#F8FAFC;border-bottom:1px solid #F3F4F6">
        <b style="font-size:13px;color:${live ? '#4F46E5' : '#111827'}">${lessonEsc(pairLabel)}</b>
        <span style="font-size:11px;color:#94A3B8">운영 통합 그룹 <b style="color:${live ? '#4F46E5' : '#475569'}">${section.groups.length}개</b></span>
        <span style="font-size:11px;color:#94A3B8">묶을 수 있는 과목 <b style="color:#4F46E5">${mergeableRows.length}개</b>${blockedCount ? ` <span style="color:#CBD5E1">/ 못 묶는 과목 ${blockedCount}개</span>` : ''}</span>
      </div>
      ${body}
    </section>`;
  }).join('');

  return `${cards}
  <div style="padding:2px 4px 11px;display:flex;flex-direction:column;gap:4px;font-size:11px;color:#9CA3AF">
    <span>· 통합 그룹은 <b style="color:#4F46E5">붙어 있는 레벨 ${GROUP_MAX_LEVELS}개</b>까지만 묶을 수 있어. 그래서 표가 이 ${getAdjacentLevelPairs().length}개로 모든 조합을 덮는다.</span>
    <span>· <b>묶을 수 있는 과목</b> = 양쪽 레벨이 모두 필요로 하고 <b>그룹 수업 유형까지 같은</b> 과목이야. 회색 줄은 왜 못 묶는지 이유를 적어뒀어.</span>
    <span>· <b>정원은 조합 전체가 공유해.</b> 레벨마다 정원이 따로 있는 게 아니라 한 그룹의 자리를 나눠 쓰는 거야.</span>
    <span>· 여기 학생들은 <b>개별 레벨 탭의 배정 건수에 이미 포함</b>돼 있어. 두 탭의 건수를 더하면 중복이야.</span>
  </div>`;
}

function renderMergedLevelRow(row) {
  const cell = (html, extra) => `<td style="padding:9px 13px;font-size:12.5px;color:#6B7280;border-top:1px solid #F3F4F6;vertical-align:middle;${extra || ''}">${html}</td>`;
  const typePill = classType => getGroupTypeTagHtml(classType);
  const levelChip = (level, count, dim) => `<span style="display:inline-block;padding:1px 7px;border-radius:5px;background:#F8FAFC;border:1px solid #E5E7EB;font-size:10px;font-weight:700;color:${dim ? '#CBD5E1' : '#475569'};white-space:nowrap">${lessonEsc(getLevelGroupName(level))} ${count}</span>`;

  if (row.kind === 'mergeable') {
    const total = row.lowWaiting + row.highWaiting;
    const waitingHtml = `<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:11.5px">
      ${levelChip(row.lowLevel, row.lowWaiting)}<span style="color:#CBD5E1">+</span>${levelChip(row.highLevel, row.highWaiting)}
      <b style="color:${total ? '#B45309' : '#9CA3AF'}">= ${total}명</b></span>`;

    const group = row.group;
    const capacity = group ? getGroupCapacityFor(group) : 0;
    const seatsLeft = group ? Math.max(0, capacity - group.studentIds.length) : 0;
    const statusHtml = group
      ? `<button type="button" onclick="event.stopPropagation();openActiveGroupDetail(${group.id})" style="border:0;background:none;padding:0;display:flex;align-items:center;gap:6px;font-size:11.5px;color:#475569;cursor:pointer">
          <b style="color:#111827">${lessonEsc(getGroupTeacherLabel(group))}</b><span style="color:#CBD5E1">·</span><span>${lessonEsc(getGroupRoomLabel(group))}</span>
          <span style="color:#CBD5E1">·</span><span>${getGroupDayPeriodHtml(group)}</span>
          <span style="color:#CBD5E1">·</span><b style="color:#475569">${group.studentIds.length}/${capacity}명</b>
        </button>`
      : `<span style="display:inline-block;padding:3px 8px;border-radius:999px;background:#FEE2E2;color:#DC2626;font-size:10px;font-weight:700">통합 그룹 없음</span>`;

    const levelsArg = `[${row.lowLevel},${row.highLevel}]`;
    const actionHtml = group
      ? (seatsLeft && total
        ? `<button type="button" onclick="event.stopPropagation();openGroupAssignmentBrowserPopup(${group.id})" style="padding:5px 11px;border-radius:8px;border:1px solid #5E5CE6;background:#EEF2FF;color:#4F46E5;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">대기 ${Math.min(seatsLeft, total)}명 배정</button>`
        : `<span style="font-size:10.5px;color:#CBD5E1">${!total ? '대기 없음' : '자리 없음'}</span>`)
      : `<button type="button" onclick="event.stopPropagation();openGroupCreateBrowserPopup(${curriculumJsLiteral(row.curriculum)},'${row.classType}',${row.lowLevel},undefined,undefined,undefined,{levels:${levelsArg},assignAfterCreate:true})" style="padding:5px 11px;border-radius:8px;border:1px solid #5E5CE6;background:#EEF2FF;color:#4F46E5;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap">그룹 만들기</button>`;

    return `<tr>
      <td style="padding:9px 13px;font-size:12.5px;font-weight:700;color:#111827;white-space:nowrap;border-top:1px solid #F3F4F6">${lessonEsc(row.subjectName)}</td>
      ${cell(typePill(row.classType))}
      ${cell(waitingHtml)}
      ${cell(statusHtml)}
      ${cell(actionHtml, 'text-align:right')}
    </tr>`;
  }

  const dimName = `<td style="padding:9px 13px;font-size:12.5px;font-weight:500;color:#B6BBC9;white-space:nowrap;border-top:1px solid #F3F4F6">${lessonEsc(row.subjectName)}</td>`;

  if (row.kind === 'type-mismatch') {
    const typesHtml = `<span style="display:inline-flex;gap:6px;flex-wrap:wrap;font-size:10.5px;color:#9CA3AF">
      <span>${lessonEsc(getLevelGroupName(row.lowLevel))} ${lessonEsc(getGroupSizeShortLabel(row.lowTypes[0]))}</span>
      <span>${lessonEsc(getLevelGroupName(row.highLevel))} ${lessonEsc(getGroupSizeShortLabel(row.highTypes[0]))}</span></span>`;
    const waitingHtml = `<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">${levelChip(row.lowLevel, row.lowWaiting, true)}<span style="color:#E5E7EB">+</span>${levelChip(row.highLevel, row.highWaiting, true)}</span>`;
    return `<tr>${dimName}${cell(typesHtml)}${cell(waitingHtml)}
      <td colspan="2" style="padding:9px 13px;font-size:11px;color:#B6BBC9;border-top:1px solid #F3F4F6">✕ <b style="color:#9CA3AF">그룹 수업 유형이 달라</b> 한 그룹으로 못 묶어 — 정원이 서로 다르다</td>
    </tr>`;
  }

  const waitingHtml = `<span style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">${levelChip(row.lowLevel, row.lowWaiting, row.onlyLevel !== row.lowLevel)}<span style="color:#E5E7EB">+</span>${levelChip(row.highLevel, row.highWaiting, row.onlyLevel !== row.highLevel)}</span>`;
  return `<tr>${dimName}${cell(row.classType ? `<span style="font-size:10.5px;color:#9CA3AF">${lessonEsc(getGroupSizeShortLabel(row.classType))}</span>` : '')}${cell(waitingHtml)}
    <td colspan="2" style="padding:9px 13px;font-size:11px;color:#B6BBC9;border-top:1px solid #F3F4F6">✕ <b style="color:#9CA3AF">${lessonEsc(getLevelGroupName(row.missingLevel))} 과정에 없는 과목</b> — ${lessonEsc(getLevelGroupName(row.onlyLevel))} 단독으로만 열 수 있다</td>
  </tr>`;
}

// 시간 기준 뷰: 세로축 = 교시, 가로축 = 레벨: 세로축 = 교시, 가로축 = 레벨. 같은 칸에 그룹이 여럿이면 세로로 쌓인다.
// ─────────────────────────────────────────────────────────────
// 스케줄 배정 — 배치 공통
// 그룹 수업은 주 5회(월~금) 고정이고 요일마다 교시가 같다. 그래서 "몇 교시"만 정하면
// 요일은 따질 게 없다 — 강사도 강의실도 한 교시에 반 하나다.
// ─────────────────────────────────────────────────────────────

// 교시가 아직 안 잡힌 그룹. 그룹 편성에서 반과 학생만 먼저 만든 상태다.
function isUnscheduledGroup(group) {
  return Boolean(group) && group.status === 'active' && (!Array.isArray(group.periods) || !group.periods.length);
}

function getUnscheduledGroups(levelOrder) {
  return MOCK_GROUP_CLASSES.filter(group =>
    isUnscheduledGroup(group) &&
    (levelOrder == null || getGroupLevelSet(group).includes(Number(levelOrder)))
  );
}

// 강의실 주간 세션(1:1 등)이 그 교시를 쓰고 있는 요일. 주 5회 그룹은 요일 하나만 걸려도 그 방을 못 쓴다.
function getRoomSessionBusyDays(roomId, period) {
  const target = Number(period);
  return [...new Set(MOCK_CLASS_SESSIONS
    .filter(session => session.roomId === roomId && Array.isArray(session.periods) && session.periods.map(Number).includes(target))
    .map(session => session.day))];
}

// 다른 운영 그룹이 그 교시에 이 강사/강의실을 이미 쓰고 있으면 그 그룹을 돌려준다.
function findGroupOccupyingPeriod(period, matcher, excludeGroupId) {
  const target = Number(period);
  return MOCK_GROUP_CLASSES.find(group =>
    group.id !== excludeGroupId && group.status === 'active' &&
    Array.isArray(group.periods) && group.periods.map(Number).includes(target) &&
    matcher(group)
  ) || null;
}

// 배치 팝업용 강사 목록. 못 고르는 사람도 같이 보여주되 이유를 붙인다 —
// 목록에서 아예 지워버리면 "왜 이 사람이 없지?"를 표에서 되짚어야 한다.
// group 을 같이 넘기면 제외 과정까지 걸러내고 적합도(fit)를 붙여서 돌려준다.
// 안 넘기면 예전 그대로 — 유형 · 근무 · 충돌만 본다.
function getGroupPlacementTeacherOptions(classType, period, excludeGroupId, group) {
  return MOCK_TEACHERS
    .filter(teacher => teacher.status !== 'resigned')
    .map(teacher => {
      if (!(teacher.classTypes || []).includes(classType)) {
        return { teacher, ok: false, reason: `${classType} 수업 담당이 아니야` };
      }
      if (group && matchesCourseTag(teacher.excludedCourses, group.course)) {
        return { teacher, ok: false, reason: `${group.course} 과정 제외 강사야` };
      }
      // 블랙타임·화상수업은 「그래도 배정」으로 넘길 수 있는 사유라 따로 표시해 둔다(overridable).
      // 다른 수업과의 충돌처럼 물리적으로 불가능한 것과는 성격이 다르다.
      const availState = getTeacherWeeklyAvailState(teacher, period);
      if (availState !== 'open') {
        const offDays = LESSON_DAYS.filter(day => lessonTeacherAvailState(teacher, day, period) !== 'open');
        return { teacher, ok: false, overridable: true, availState,
          reason: `${offDays.join('·')}요일 ${period}교시 ${TEACHER_AVAIL_LABEL[availState]}` };
      }
      const clash = findGroupOccupyingPeriod(period, group => group.teacherId === teacher.id, excludeGroupId);
      if (clash) {
        return { teacher, ok: false, reason: `${period}교시에 ${getGroupDisplayName(clash)} 담당 중` };
      }
      // 1:1도 한 교시에 한 명이다. 여기를 안 보면 같은 강사에게 그룹과 1:1이 겹쳐 잡힌다.
      const oneToOne = findOneToOneAt(teacher.id, period);
      if (oneToOne) {
        const who = oneToOne.student.nick || oneToOne.student.name;
        return { teacher, ok: false, busyOneToOne: true, reason: `${period}교시에 ${who} 1:1 수업 중` };
      }
      return { teacher, ok: true, reason: `${period}교시 비어 있음` };
    })
    .map(option => (group ? { ...option, fit: getTeacherGroupFit(option.teacher, group) } : option))
    .sort((a, b) => (a.ok ? 0 : 1) - (b.ok ? 0 : 1)
      || (a.busyOneToOne ? 0 : 1) - (b.busyOneToOne ? 0 : 1)
      // 잘 맞는 강사가 위로. group 을 안 넘겼으면 fit 이 없어서 이 줄은 그냥 0이 된다.
      || ((b.fit?.score || 0) - (a.fit?.score || 0)));
}

// ═════════════════════════════════════════════════════════════
// 강사 적합도 — 이 반에 이 강사가 얼마나 맞는가.
//
// 여기서 읽는 값은 전부 강사 팝업 「운영정보」 탭에서 이미 받고 있던 것이다. 그런데 배정은
// 여태 그중 아무것도 보지 않았다 — 수업 유형 · 그 교시 근무 여부 · 그 교시 충돌, 이 셋뿐이었다.
// 가능 과목 / 가능 레벨 / 선호 과정 / 제외 과정 / 하루 한도를 배정에 연결하는 게 이 함수다.
//
// 점수는 순위를 매기려는 것이지 합격선이 아니다. 못 맡는 사유는 점수가 아니라
// getGroupPlacementTeacherOptions 의 reason 으로 따로 나가고, 넘길 수 있는 사유는 warnings 로 나간다.
// ═════════════════════════════════════════════════════════════
const TEACHER_FIT_SCORE = { subject: 40, level: 25, course: 15, quota: 10, load: 10 };

// 반의 레벨은 order 번호(1..5)인데 강사 설정은 레벨 id(LV_01..)를 쓴다. 그 사이를 옮긴다.
function getGroupLevelIds(group) {
  const orders = getGroupLevelSet(group);
  return MOCK_MASTER_LEVELS.filter(level => orders.includes(level.order)).map(level => level.id);
}

// 이 강사가 맡고 있는 그룹 수업 수. 그룹은 월~금 같은 교시로 도니 반 하나가 곧 하루 한 교시다.
function countTeacherGroupLessons(teacher, classType, excludeGroupId) {
  return MOCK_GROUP_CLASSES.filter(group =>
    group.status === 'active' && group.id !== excludeGroupId &&
    Number(group.teacherId) === Number(teacher.id) &&
    Array.isArray(group.periods) && group.periods.length &&
    (!classType || group.classType === classType)
  ).length;
}

function countTeacherOneToOneLessons(teacher) {
  return MOCK_STUDENTS.reduce((sum, student) =>
    sum + (student.oneToOneSchedule || []).filter(item => Number(item.teacherId) === Number(teacher.id)).length, 0);
}

// 과정 이름은 강사 쪽 태그와 표기가 달라서(「IELTS 전문」 ↔ 「IELTS Intensive」) 부분 일치까지 본다.
function matchesCourseTag(tags, courseName) {
  if (!courseName) return false;
  return (tags || []).some(tag => tag && (tag === courseName || courseName.includes(tag) || tag.includes(courseName)));
}

function getTeacherGroupFit(teacher, group) {
  const badges = [];
  const warnings = [];
  let score = 0;
  if (!teacher || !group) return { score, badges, warnings };

  const subjectId = getGroupSubjectId(group);
  const capableSubjects = typeof getTeacherCapableSubjectIds === 'function' ? getTeacherCapableSubjectIds(teacher) : [];
  if (subjectId && capableSubjects.includes(subjectId)) {
    score += TEACHER_FIT_SCORE.subject;
    badges.push({ tone: 'ok', text: '과목 담당' });
  } else if (capableSubjects.length) {
    badges.push({ tone: 'warn', text: '다른 과목 담당' });
  } else {
    badges.push({ tone: 'mute', text: '가능 과목 미지정' });
  }

  const levelIds = getGroupLevelIds(group);
  const capableLevels = typeof getTeacherCapableLevelIds === 'function' ? getTeacherCapableLevelIds(teacher) : [];
  if (levelIds.length && levelIds.every(id => capableLevels.includes(id))) {
    score += TEACHER_FIT_SCORE.level;
    badges.push({ tone: 'ok', text: '레벨 가능' });
  } else if (levelIds.some(id => capableLevels.includes(id))) {
    // 통합 레벨 반은 묶인 레벨을 다 맡을 수 있어야 한다. 절반만 되는 건 경고로 남긴다.
    score += Math.round(TEACHER_FIT_SCORE.level / 2);
    badges.push({ tone: 'warn', text: '일부 레벨만 가능' });
  } else {
    badges.push({ tone: 'warn', text: '레벨이 안 맞아' });
  }

  if (matchesCourseTag(teacher.preferredCourses, group.course)) {
    score += TEACHER_FIT_SCORE.course;
    badges.push({ tone: 'ok', text: '선호 과정' });
  }

  // 하루 유형별 한도. 넘겼다고 목록에서 빼지 않는다 — 학생이 넘치면 넘겨서라도 넣어야 한다.
  const typeLimit = Number(teacher.dailyTypeLimits?.[group.classType]);
  const typeCount = countTeacherGroupLessons(teacher, group.classType, group.id);
  if (Number.isFinite(typeLimit) && typeLimit > 0) {
    if (typeCount >= typeLimit) {
      warnings.push(`${group.classType} 하루 한도 초과 (${typeCount}/${typeLimit})`);
    } else {
      score += Math.round(TEACHER_FIT_SCORE.quota * (1 - typeCount / typeLimit));
    }
  }
  const dailyMax = Number(teacher.dailyMaxLessons);
  const groupCount = countTeacherGroupLessons(teacher, null, group.id);
  const totalCount = groupCount + countTeacherOneToOneLessons(teacher);
  if (Number.isFinite(dailyMax) && dailyMax > 0 && totalCount >= dailyMax) {
    warnings.push(`하루 전체 한도 초과 (${totalCount}/${dailyMax})`);
  }

  // 수업이 적은 강사부터 채워서 한 사람에게 몰리지 않게 한다 — 자동 배치가 쓰던 기준 그대로.
  score += Math.max(0, TEACHER_FIT_SCORE.load - groupCount);
  badges.push({ tone: 'mute', text: `그룹 ${groupCount}개 담당` });

  return { score, badges, warnings };
}

// 배치 팝업용 강의실 목록. 다른 그룹뿐 아니라 강의실 배정(1:1 주간 세션)까지 같이 본다.
function getGroupPlacementRoomOptions(classType, period, capacityNeeded, excludeGroupId) {
  const allowedTypes = classType === '1:8' ? ['1:8'] : ['1:4', '1:8'];
  return MOCK_CLASS_ROOMS
    .filter(room => room.roomNo && room.status === 'active' && ['1:4', '1:8'].includes(room.type))
    .map(room => {
      if (!allowedTypes.includes(room.type)) {
        return { room, ok: false, reason: `${classType} 수업에는 못 쓰는 강의실이야` };
      }
      if (room.capacity < (capacityNeeded || 1)) {
        return { room, ok: false, reason: `${room.capacity}석 — ${capacityNeeded}명이 안 들어가` };
      }
      const clash = findGroupOccupyingPeriod(period, group => group.roomId === room.id, excludeGroupId);
      if (clash) {
        return { room, ok: false, reason: `${period}교시에 ${getGroupDisplayName(clash)} 사용 중` };
      }
      const sessionDays = getRoomSessionBusyDays(room.id, period);
      if (sessionDays.length) {
        return { room, ok: false, reason: `${sessionDays.join('·')}요일 ${period}교시 1:1 수업 사용 중` };
      }
      return { room, ok: true, reason: `${period}교시 비어 있음` };
    })
    .sort((a, b) => (a.ok ? 0 : 1) - (b.ok ? 0 : 1)
      || (a.room.type === classType ? 0 : 1) - (b.room.type === classType ? 0 : 1)
      || a.room.capacity - b.room.capacity);
}

// 그 교시에 이미 다른 수업이 있는 학생. 그룹을 먼저 배정하고 1:1을 나중에 붙이는 순서라
// 여기서 걸리는 건 대부분 그 학생의 다른 그룹 수업이다.
function getGroupStudentsBusyAtPeriod(group, period) {
  const target = Number(period);
  return (group.studentIds || [])
    .map(id => MOCK_STUDENTS.find(student => student.id === id))
    .filter(student => student && getStudentBusyPeriods(student, group.id).has(target));
}

// ─────────────────────────────────────────────────────────────
// 배치 팝업
// 표의 빈 칸을 누르면 열린다. 교시·레벨은 칸이 이미 정하고 들어오므로
// 반 → 담당 강사 → 강의실 셋만 고르면 끝이다(요일은 월~금 고정이라 묻지 않는다).
// ─────────────────────────────────────────────────────────────
let _gpPlacement = null;

function openGroupPlacementModal(period, levelOrder) {
  const candidates = getUnscheduledGroups(levelOrder);
  _gpPlacement = { period: Number(period), levelOrder: Number(levelOrder), groupId: candidates[0]?.id ?? null, teacherId: null, roomId: null };
  const modal = document.createElement('div');
  modal.id = 'group-placement-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(17,24,39,.52);display:flex;align-items:center;justify-content:center;padding:20px';
  modal.onclick = event => { if (event.target === modal) closeGroupPlacementModal(); };
  document.body.appendChild(modal);
  renderGroupPlacementModal();
}

function closeGroupPlacementModal() {
  const modal = document.getElementById('group-placement-modal');
  if (modal) modal.remove();
  _gpPlacement = null;
}

function setGroupPlacementGroup(groupId) {
  if (!_gpPlacement) return;
  _gpPlacement.groupId = Number(groupId);
  // 반이 바뀌면 정원과 수업 형태가 달라져서 고를 수 있는 강사·강의실도 달라진다. 선택을 비운다.
  _gpPlacement.teacherId = null;
  _gpPlacement.roomId = null;
  renderGroupPlacementModal();
}

function setGroupPlacementTeacher(teacherId) {
  if (!_gpPlacement) return;
  _gpPlacement.teacherId = _gpPlacement.teacherId === Number(teacherId) ? null : Number(teacherId);
  renderGroupPlacementModal();
}

function setGroupPlacementRoom(roomId) {
  if (!_gpPlacement) return;
  _gpPlacement.roomId = _gpPlacement.roomId === Number(roomId) ? null : Number(roomId);
  renderGroupPlacementModal();
}

function renderGroupPlacementModal() {
  const modal = document.getElementById('group-placement-modal');
  if (!modal || !_gpPlacement) return;
  const { period, levelOrder } = _gpPlacement;
  const candidates = getUnscheduledGroups(levelOrder);
  if (!candidates.length) {
    modal.innerHTML = `<div style="width:min(460px,96vw);background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.25);overflow:hidden">
      <div style="padding:16px 20px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:10px">
        <h3 style="font-size:15px;margin:0;color:#111827">${period}교시 · ${lessonEsc(getLevelGroupName(levelOrder))}</h3>
        <button onclick="closeGroupPlacementModal()" style="margin-left:auto;border:0;background:none;font-size:20px;color:#6B7280;cursor:pointer">×</button>
      </div>
      <div style="padding:20px;font-size:12px;color:#4B5563;line-height:1.7">
        <b style="color:#111827">여기에 놓을 반이 없어.</b><br>
        ${lessonEsc(getLevelGroupName(levelOrder))} 레벨에 <b>시간이 안 정해진 반</b>이 하나도 없어.<br>
        스케줄 배정은 <b>이미 만들어둔 반을 놓기만</b> 해. 반은 <b>그룹 편성</b>에서 만들어.
      </div>
      <div style="padding:13px 20px;border-top:1px solid #E5E7EB;background:#F9FAFB;display:flex;justify-content:flex-end;gap:8px">
        <button class="tsa-btn tsa-btn-outline" onclick="closeGroupPlacementModal()">닫기</button>
        <button class="tsa-btn tsa-btn-primary" onclick="goToGroupComposition(${levelOrder})">그룹 편성으로 가기</button>
      </div>
    </div>`;
    return;
  }
  const group = candidates.find(item => item.id === _gpPlacement.groupId) || candidates[0];
  _gpPlacement.groupId = group.id;
  const capacity = getGroupCapacityFor(group);
  const teacherOptions = getGroupPlacementTeacherOptions(group.classType, period, group.id);
  const roomOptions = getGroupPlacementRoomOptions(group.classType, period, Math.max(1, group.studentIds.length), group.id);
  const teacher = MOCK_TEACHERS.find(item => item.id === _gpPlacement.teacherId) || null;
  const room = MOCK_CLASS_ROOMS.find(item => item.id === _gpPlacement.roomId) || null;
  const ready = Boolean(teacher && room);

  const stepHead = (no, title, hint) => `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:7px">
    <span style="width:19px;height:19px;border-radius:50%;background:#EEF2FF;color:#4F46E5;display:inline-flex;align-items:center;justify-content:center;font-size:9.5px;font-weight:900">${no}</span>
    <b style="font-size:12px;color:#111827">${title}</b>
    ${hint ? `<span style="font-size:10.5px;color:#9CA3AF">${hint}</span>` : ''}
  </div>`;

  const optionRow = (selected, disabled, onclick, main, why, whyColor) => `<button ${disabled ? 'disabled' : `onclick="${onclick}"`} style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;padding:9px 11px;margin-bottom:5px;border:1px solid ${selected ? '#5E5CE6' : '#E5E7EB'};border-radius:9px;background:${selected ? '#F5F3FF' : '#fff'};cursor:${disabled ? 'not-allowed' : 'pointer'};opacity:${disabled ? .5 : 1}">
    <span style="font-size:11.5px;font-weight:700;color:#111827">${main}</span>
    ${why ? `<span style="flex:0 0 auto;font-size:10px;font-weight:700;color:${whyColor || '#9CA3AF'}">${why}</span>` : ''}
  </button>`;

  const groupRows = candidates.map(item => {
    const busy = getGroupStudentsBusyAtPeriod(item, period);
    const names = busy.map(student => lessonEsc(student.nick || student.name)).join(', ');
    return optionRow(
      item.id === group.id,
      false,
      `setGroupPlacementGroup(${item.id})`,
      `${lessonEsc(getGroupDisplayName(item))} <span style="font-weight:400;color:#6B7280">· ${lessonEsc(item.classType)} · 학생 ${item.studentIds.length}명</span>`,
      busy.length ? `⚠ ${names} 다른 수업과 겹침` : '',
      '#B45309'
    );
  }).join('');

  const teacherRows = teacherOptions.map(option => optionRow(
    option.teacher.id === _gpPlacement.teacherId,
    !option.ok,
    `setGroupPlacementTeacher(${option.teacher.id})`,
    lessonEsc(option.teacher.nick || option.teacher.name),
    (option.ok ? '✓ ' : '') + lessonEsc(option.reason),
    option.ok ? '#047857' : '#9CA3AF'
  )).join('');

  const roomRows = roomOptions.map(option => optionRow(
    option.room.id === _gpPlacement.roomId,
    !option.ok,
    `setGroupPlacementRoom(${option.room.id})`,
    `${lessonEsc(option.room.roomNo)} <span style="font-weight:400;color:#6B7280">· ${lessonEsc(option.room.type)} · ${option.room.capacity}석</span>`,
    (option.ok ? '✓ ' : '') + lessonEsc(option.reason),
    option.ok ? '#047857' : '#9CA3AF'
  )).join('');

  modal.innerHTML = `<div style="width:min(560px,96vw);max-height:90vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden">
    <div style="padding:16px 20px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:10px">
      <h3 style="font-size:15px;margin:0;color:#111827">${period}교시 · ${lessonEsc(getLevelGroupName(levelOrder))}</h3>
      <span style="font-size:10px;font-weight:700;color:#6B7280;background:#F3F4F6;border-radius:5px;padding:2px 7px">월~금 · 주 5회</span>
      <button onclick="closeGroupPlacementModal()" style="margin-left:auto;border:0;background:none;font-size:20px;color:#6B7280;cursor:pointer">×</button>
    </div>
    <div style="padding:16px 20px;overflow:auto;display:flex;flex-direction:column;gap:16px">
      <div>${stepHead(1, '여기에 놓을 반', '시간이 안 정해진 반만 나와')}${groupRows}</div>
      <div>${stepHead(2, '담당 선생님', `${period}교시에 비는 사람 ${teacherOptions.filter(option => option.ok).length}명`)}<div style="max-height:212px;overflow:auto;padding-right:2px">${teacherRows || '<div style="font-size:11px;color:#9CA3AF">고를 수 있는 강사가 없어.</div>'}</div></div>
      <div>${stepHead(3, '강의실', group.studentIds.length ? `학생 ${group.studentIds.length}명이 들어갈 방` : '정원에 맞는 방')}<div style="max-height:212px;overflow:auto;padding-right:2px">${roomRows || '<div style="font-size:11px;color:#9CA3AF">고를 수 있는 강의실이 없어.</div>'}</div></div>
    </div>
    <div style="padding:13px 20px;border-top:1px solid #E5E7EB;background:#F9FAFB;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
      <span style="font-size:11px;color:#6B7280">${lessonEsc(getGroupDisplayName(group))} · 월~금 <b>${period}교시</b> · <b>${teacher ? lessonEsc(teacher.nick || teacher.name) : '선생님 미선택'}</b> · <b>${room ? lessonEsc(room.roomNo) : '강의실 미선택'}</b>${ready ? '' : '<br><span style="font-size:10px;color:#9CA3AF">선생님과 강의실을 골라야 배치할 수 있어</span>'}</span>
      <button ${ready ? 'onclick="confirmGroupPlacement()"' : 'disabled'} class="tsa-btn tsa-btn-primary" style="${ready ? '' : 'opacity:.45;cursor:not-allowed'}">배치하기</button>
    </div>
  </div>`;
  void capacity;
}

// 놓을 반이 없을 때 반을 만들러 가는 길. 그 레벨만 걸러진 상태로 그룹 편성을 연다.
function goToGroupComposition(levelOrder) {
  closeGroupPlacementModal();
  if (levelOrder != null) _gmLevelFilter = String(levelOrder);
  _gmLevelScope = 'single';
  setGroupManagementBoardView('levels');
}

function confirmGroupPlacement() {
  if (!_gpPlacement) return;
  const { period, teacherId, roomId, groupId } = _gpPlacement;
  const group = MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!group) { closeGroupPlacementModal(); return; }
  // 선생님 미정은 허용하지 않는다 — 셋이 다 있어야 배치다.
  if (teacherId == null || roomId == null) {
    showToast('담당 선생님과 강의실을 모두 골라야 배치할 수 있어.', 'warning');
    return;
  }
  const busy = getGroupStudentsBusyAtPeriod(group, period);
  if (busy.length) {
    const names = busy.map(student => student.nick || student.name).join(', ');
    if (!window.confirm(`${names} 학생이 ${period}교시에 다른 수업이 있어. 그래도 배치할까?`)) return;
  }
  group.periods = [Number(period)];
  group.dayOfWeek = [...LESSON_DAYS];
  group.weeklyFrequency = LESSON_DAYS.length;
  group.teacherId = Number(teacherId);
  group.roomId = Number(roomId);
  const teacher = MOCK_TEACHERS.find(item => item.id === group.teacherId);
  const room = MOCK_CLASS_ROOMS.find(item => item.id === group.roomId);
  closeGroupPlacementModal();
  showToast(`✓ ${getGroupDisplayName(group)} — ${period}교시 · ${teacher?.nick || teacher?.name || '-'} · ${room?.roomNo || '-'}에 배치했어.`, 'success');
  renderCsGroupPanel();
}

// 배치 취소. 옮기는 건 끌어다 놓기가 아니라 "취소하고 다시 놓기"다.
// 학생은 그대로 두고 교시·강사·강의실 셋만 비운다.
function unplaceGroupSchedule(groupId) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(groupId));
  if (!group) return;
  if (!window.confirm(`${getGroupDisplayName(group)}의 배치를 취소할까?\n학생은 그대로 남고 교시·담당 선생님·강의실만 비워져 "시간 미정"으로 돌아가.`)) return;
  group.periods = [];
  group.teacherId = null;
  group.roomId = null;
  showToast(`${getGroupDisplayName(group)} 배치를 취소했어. 시간 미정으로 돌아갔어.`, 'success');
  renderCsGroupPanel();
}

// 시간 미정 배지를 누르면 놓을 수 있는 칸이 밝아진다.
let _gmHighlightUnscheduled = false;
function toggleUnscheduledHighlight() {
  _gmHighlightUnscheduled = !_gmHighlightUnscheduled;
  _gmPickedUnscheduledGroupId = null;
  renderCsGroupPanel();
}

// 시간 미정 목록에서 반 하나를 고르면 그 반을 놓을 수 있는 칸만 켜진다.
// 전체 하이라이트가 "이 레벨에 안 놓인 반이 있다"까지만 알려주는 걸 반 단위로 좁힌 것.
let _gmPickedUnscheduledGroupId = null;

function pickUnscheduledGroup(groupId) {
  const id = Number(groupId);
  _gmPickedUnscheduledGroupId = _gmPickedUnscheduledGroupId === id ? null : id;
  _gmHighlightUnscheduled = false;
  renderCsGroupPanel();
}

// 이 반을 이 교시에 놓을 수 있나.
// 자동 배치가 쓰는 판정과 같은 순서·같은 조건이다(학생 겹침 -> 담당 강사 -> 강의실).
function canPlaceGroupAtPeriod(group, period) {
  if (!group) return false;
  if (getGroupStudentsClashingAtPeriod(group, period).length) return false;
  const teacherOptions = getGroupPlacementTeacherOptions(group.classType, period, group.id, group);
  if (!teacherOptions.some(option => option.ok || option.busyOneToOne)) return false;
  const need = Math.max(1, (group.studentIds || []).length);
  return getGroupPlacementRoomOptions(group.classType, period, need, group.id).some(option => option.ok);
}

// 시간 미정 반 한 줄에 붙일 상태. 학생이 없으면 자동 배치가 건너뛰니 그것부터 구분한다.
function getUnscheduledGroupStatus(group, totalPeriods) {
  if (!(group.studentIds || []).length) {
    return { tone: 'empty', text: '학생 없음', hint: '학생이 없어 자동 배치는 건너뛴다. 직접 놓거나 반을 지워줘.' };
  }
  for (let period = 1; period <= totalPeriods; period += 1) {
    if (canPlaceGroupAtPeriod(group, period)) {
      return { tone: 'ok', text: '놓을 수 있어', hint: '눌러서 놓을 수 있는 칸 보기' };
    }
  }
  return { tone: 'blocked', text: explainPlacementFailure(group, totalPeriods), hint: '지금은 놓을 자리가 없어' };
}

// ─────────────────────────────────────────────────────────────
// 스케줄 배정 표 (세로 교시 × 가로 레벨)
// 통합 그룹은 묶인 레벨 칸을 가로로 하나로 합쳐서 "한 반이 한 번만" 보이게 한다.
// 통합은 붙어 있는 레벨 2개까지라 합칠 칸이 항상 옆칸이고, 그래서 이 방식이 성립한다.
// 통합 그룹이 있는 교시에만 아랫단 줄을 덧붙이고, 서로 안 겹치는 통합끼리는 같은 줄에 묶는다.
// ─────────────────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════
// 2단계 자동 배치 — 시간 미정 반을 빈 교시에 알아서 놓는다.
//
// 한 반을 놓으려면 세 가지가 동시에 맞아야 한다.
//   ① 그 반 학생들이 그 교시에 다른 그룹 수업이 없어야 하고
//   ② 그 교시에 비는 담당 강사가 있어야 하고
//   ③ 그 교시에 비는 강의실이 있어야 한다.
// 셋 중 하나라도 없으면 그 교시는 후보가 아니다. 하나씩 눌러 확인하던 걸 대신 돌려준다.
// ═════════════════════════════════════════════════════════════

// 그 반 학생 중 그 교시에 이미 다른 그룹 수업이 있는 사람
function getGroupStudentsClashingAtPeriod(group, period) {
  return (group.studentIds || [])
    .map(id => MOCK_STUDENTS.find(student => student.id === id))
    .filter(student => student && getStudentGroupBusyPeriods(student, group.id).has(Number(period)));
}

// 그 교시에 걸리는 1:1 건수. 그룹이 먼저라 1:1은 비켜주지만, 적게 건드리는 쪽을 고른다.
function countOneToOneClashesAtPeriod(group, period) {
  const target = Number(period);
  return (group.studentIds || [])
    .map(id => MOCK_STUDENTS.find(student => student.id === id))
    .filter(Boolean)
    .reduce((sum, student) => sum + (student.oneToOneSchedule || []).filter(item => Number(item.period) === target).length, 0);
}

// 이 반을 놓을 수 있는 교시 중 가장 나은 곳.
// 1:1을 적게 건드리는 쪽 → 앞 교시부터. 뒤쪽 빈 교시로 밀지 않는다.
function findBestPlacementForGroup(group, totalPeriods) {
  const need = Math.max(1, (group.studentIds || []).length);
  const candidates = [];
  for (let period = 1; period <= totalPeriods; period += 1) {
    if (getGroupStudentsClashingAtPeriod(group, period).length) continue;
    const options = getGroupPlacementTeacherOptions(group.classType, period, group.id, group);
    // 1:1이 없는 강사가 먼저다. 아무도 없을 때만 1:1 중인 강사를 쓰고, 그 1:1은 3단계로 되돌린다.
    let teachers = options.filter(option => option.ok);
    let teacherReleases = 0;
    if (!teachers.length) {
      teachers = options.filter(option => option.busyOneToOne);
      teacherReleases = 1;
    }
    if (!teachers.length) continue;
    const rooms = getGroupPlacementRoomOptions(group.classType, period, need, group.id).filter(option => option.ok);
    if (!rooms.length) continue;
    const load = MOCK_GROUP_CLASSES.filter(other =>
      other.id !== group.id && other.status === 'active' &&
      Array.isArray(other.periods) && other.periods.map(Number).includes(period)
    ).length;
    candidates.push({ period, teachers, rooms, teacherReleases, load,
      releases: countOneToOneClashesAtPeriod(group, period) + teacherReleases });
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => a.releases - b.releases || a.period - b.period);
  const best = candidates[0];
  // 이 반에 제일 잘 맞는 강사부터. 적합도 안에 「수업이 적은 강사부터」가 이미 들어 있어서
  // 예전의 담당 수 정렬을 따로 두지 않는다 — 팝업이 보여주는 순서와 같은 근거를 쓰게 된다.
  const bestTeacher = [...best.teachers].sort((a, b) => (b.fit?.score || 0) - (a.fit?.score || 0))[0];
  return { period: best.period, teacher: bestTeacher.teacher, fit: bestTeacher.fit,
    room: best.rooms[0].room, releases: best.releases };
}

// 왜 못 놓았는지 한 줄로 설명한다. "안 됨"만 말하면 다음에 뭘 할지 알 수 없다.
function explainPlacementFailure(group, totalPeriods) {
  const need = Math.max(1, (group.studentIds || []).length);
  let studentBlocked = 0;
  let noTeacher = 0;
  let noRoom = 0;
  for (let period = 1; period <= totalPeriods; period += 1) {
    if (getGroupStudentsClashingAtPeriod(group, period).length) { studentBlocked += 1; continue; }
    if (!getGroupPlacementTeacherOptions(group.classType, period, group.id, group).some(option => option.ok || option.busyOneToOne)) { noTeacher += 1; continue; }
    if (!getGroupPlacementRoomOptions(group.classType, period, need, group.id).some(option => option.ok)) { noRoom += 1; }
  }
  if (noRoom >= noTeacher && noRoom >= studentBlocked) return '빈 강의실이 없어';
  if (noTeacher >= studentBlocked) return '가능한 강사가 없어';
  return '학생들이 다 다른 수업 중이야';
}

// ═════════════════════════════════════════════════════════════
// 강사 배정 팝업 — 하단 그룹 수업 목록에서 연다.
//
// 강사 → 교시 → 강의실 순으로 좁힌다. 강사를 먼저 고르는 건 그게 제일 구하기 어려운 자원이라서다.
// 교시가 정해지면 강의실은 거의 저절로 하나 남는다.
//
// 못 고르는 강사도 목록에서 지우지 않는다 — 사라지면 "왜 이 사람이 없지?"를 다른 화면에서
// 되짚어야 한다. 대신 이유를 붙여 아래로 내린다.
// ═════════════════════════════════════════════════════════════
let _teacherAssign = null;

function getScaTotalPeriods() {
  return (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
}

// 이 반 학생이 전원 비어 있는 교시. 여기서 벗어난 교시는 강사가 아무리 남아도 후보가 아니다.
function getGroupStudentFreePeriods(group) {
  const periods = [];
  for (let period = 1; period <= getScaTotalPeriods(); period += 1) {
    if (!getGroupStudentsClashingAtPeriod(group, period).length) periods.push(period);
  }
  return periods;
}

// 교시 후보. 순서를 교시 → 강의실 → 강사로 잡은 이유는 셋의 희소성이 다르기 때문이다 —
// 어느 교시든 배정 가능한 강사는 스물넷을 넘지만, 그룹 강의실은 전부 아홉 개고
// 붐비는 교시엔 한 칸까지 줄어든다. 흔한 것을 먼저 고르게 하면 공들여 강사를 정한 뒤에
// 방이 없다는 걸 알게 된다.
function getTeacherAssignPeriodRows(group) {
  const need = Math.max(1, (group.studentIds || []).length);
  const total = getScaTotalPeriods();
  const rows = [];
  for (let period = 1; period <= total; period += 1) {
    const clash = getGroupStudentsClashingAtPeriod(group, period);
    if (clash.length) {
      const names = clash.slice(0, 2).map(student => student.nick || student.name).join('·');
      rows.push({
        period, ok: false, rooms: 0, teachers: 0,
        reason: `${names}${clash.length > 2 ? ` 외 ${clash.length - 2}명` : ''} 다른 수업 중`
      });
      continue;
    }
    const rooms = getGroupPlacementRoomOptions(group.classType, period, need, group.id).filter(option => option.ok).length;
    const teachers = getGroupPlacementTeacherOptions(group.classType, period, group.id, group).filter(option => option.ok).length;
    if (!rooms) { rows.push({ period, ok: false, rooms: 0, teachers, reason: '빈 강의실이 없어' }); continue; }
    if (!teachers) { rows.push({ period, ok: false, rooms, teachers: 0, reason: '가능한 강사가 없어' }); continue; }
    rows.push({ period, ok: true, rooms, teachers });
  }
  return rows;
}

// 고른 교시의 강사 목록. 적합도 순으로 세우고, 못 고르는 사람도 이유를 붙여 남긴다.
function getTeacherAssignRowsForPeriod(group, period) {
  return getGroupPlacementTeacherOptions(group.classType, period, group.id, group).map(option => {
    const warnings = option.fit?.warnings || [];
    let tier = 'blocked';
    if (option.ok) tier = warnings.length ? 'warn' : 'ok';
    else if (option.overridable) tier = 'warn';
    return { teacher: option.teacher, fit: option.fit, warnings, tier, ok: option.ok, reason: option.reason };
  });
}

function openTeacherAssignModal(groupId, presetPeriod) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(groupId));
  if (!group) return;
  _teacherAssign = { groupId: group.id, teacherId: null, period: null, roomId: null };
  // 이미 배정된 반은 지금 값에서 시작한다 — 「변경」도 같은 팝업을 쓴다.
  if (group.teacherId != null && Array.isArray(group.periods) && group.periods.length) {
    _teacherAssign.teacherId = Number(group.teacherId);
    _teacherAssign.period = Number(group.periods[0]);
    _teacherAssign.roomId = group.roomId != null ? Number(group.roomId) : null;
  } else if (Number.isFinite(Number(presetPeriod))) {
    // 교시별 현황에서 칸을 누르고 들어온 경우. 고른 교시를 그대로 물려받는다.
    _teacherAssign.period = Number(presetPeriod);
  }
  let host = document.getElementById('teacher-assign-modal');
  if (!host) {
    host = document.createElement('div');
    host.id = 'teacher-assign-modal';
    document.body.appendChild(host);
  }
  host.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(17,24,39,.52);display:flex;align-items:center;justify-content:center;padding:20px';
  host.onclick = event => { if (event.target === host) closeTeacherAssignModal(); };
  renderTeacherAssignModal();
}

function closeTeacherAssignModal() {
  const host = document.getElementById('teacher-assign-modal');
  if (host) host.remove();
  _teacherAssign = null;
}

function pickTeacherAssignPeriod(period) {
  if (!_teacherAssign) return;
  const next = Number(period);
  _teacherAssign.period = _teacherAssign.period === next ? null : next;
  // 교시가 바뀌면 그 시간에 비는 방도, 가능한 강사도 달라진다. 아래 두 칸을 비운다.
  _teacherAssign.roomId = null;
  _teacherAssign.teacherId = null;
  renderTeacherAssignModal();
}

function pickTeacherAssignRoom(roomId) {
  if (!_teacherAssign) return;
  const next = Number(roomId);
  _teacherAssign.roomId = _teacherAssign.roomId === next ? null : next;
  renderTeacherAssignModal();
}

function pickTeacherAssign(teacherId) {
  if (!_teacherAssign) return;
  const next = Number(teacherId);
  _teacherAssign.teacherId = _teacherAssign.teacherId === next ? null : next;
  renderTeacherAssignModal();
}

const TEACHER_ASSIGN_TONE = {
  ok: { bg: '#ECFDF5', fg: '#047857' },
  warn: { bg: '#FFFBEB', fg: '#B45309' },
  mute: { bg: '#F3F4F6', fg: '#6B7280' }
};

function teacherAssignBadge(tone, text) {
  const color = TEACHER_ASSIGN_TONE[tone] || TEACHER_ASSIGN_TONE.mute;
  return `<span style="display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;margin:1px 3px 1px 0;background:${color.bg};color:${color.fg};white-space:nowrap">${lessonEsc(text)}</span>`;
}

function renderTeacherAssignModal() {
  const host = document.getElementById('teacher-assign-modal');
  if (!host || !_teacherAssign) return;
  const group = MOCK_GROUP_CLASSES.find(item => item.id === _teacherAssign.groupId);
  if (!group) { closeTeacherAssignModal(); return; }

  const studentCount = (group.studentIds || []).length;
  const need = Math.max(1, studentCount);
  const recommended = findBestPlacementForGroup(group, getScaTotalPeriods());
  const period = _teacherAssign.period;

  const sectionHead = (index, title, hint) => `<div style="display:flex;align-items:baseline;gap:8px;margin:0 0 7px">
    <span style="flex:0 0 auto;display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;background:#EEF2FF;color:#4338CA;font-size:9.5px;font-weight:800">${index}</span>
    <b style="font-size:11px;font-weight:800;color:#6B7280;letter-spacing:.3px">${title}</b>
    ${hint ? `<span style="font-size:10px;color:#9CA3AF">${hint}</span>` : ''}
  </div>`;

  // ── 1 · 교시 ────────────────────────────────────────────
  const periodRows = getTeacherAssignPeriodRows(group);
  const periodChips = periodRows.map(row => {
    const on = period === row.period;
    const star = recommended && recommended.period === row.period;
    const tint = row.ok ? (row.rooms <= 1 ? '#B45309' : '#6B7280') : '#C4C9D4';
    return `<button ${row.ok ? `onclick="pickTeacherAssignPeriod(${row.period})"` : 'disabled'} title="${lessonEsc(row.reason || '')}" style="flex:0 0 auto;text-align:left;border:1px solid ${on ? '#5E5CE6' : (row.ok ? '#D1D5DB' : '#F3F4F6')};border-radius:9px;padding:6px 10px;margin:0 5px 5px 0;background:${on ? '#5E5CE6' : (row.ok ? '#fff' : '#FAFAFB')};cursor:${row.ok ? 'pointer' : 'not-allowed'}">
      <span style="display:block;font-size:11px;font-weight:700;color:${on ? '#fff' : (row.ok ? '#111827' : '#C4C9D4')}">${star ? '★ ' : ''}${row.period}교시</span>
      <span style="display:block;margin-top:1px;font-size:9px;font-weight:700;color:${on ? 'rgba(255,255,255,.85)' : tint}">${row.ok ? `방 ${row.rooms} · 강사 ${row.teachers}` : lessonEsc(row.reason)}</span>
    </button>`;
  }).join('');

  // ── 2 · 강의실 ──────────────────────────────────────────
  let roomHtml = '<div style="font-size:11px;color:#9CA3AF">교시를 고르면 그 시간에 비는 방만 남아.</div>';
  if (period != null) {
    const rooms = getGroupPlacementRoomOptions(group.classType, period, need, group.id);
    const okRooms = rooms.filter(option => option.ok);
    const blocked = rooms.filter(option => !option.ok);
    const chips = okRooms.map(option => {
      const on = _teacherAssign.roomId === option.room.id;
      const star = recommended && recommended.period === period && recommended.room.id === option.room.id;
      // 1:4 반이 8석 방을 쓰면 중그룹실 한 칸이 줄어든다. 붐빌 땐 이게 다음 반을 막는다.
      const oversize = group.classType === '1:4' && option.room.type === '1:8';
      return `<button onclick="pickTeacherAssignRoom(${option.room.id})" style="border:1px solid ${on ? '#5E5CE6' : (oversize ? '#FCD34D' : '#D1D5DB')};border-radius:8px;padding:6px 12px;margin:0 5px 5px 0;background:${on ? '#5E5CE6' : (oversize ? '#FFFBEB' : '#fff')};color:${on ? '#fff' : (oversize ? '#B45309' : '#111827')};font-size:11px;font-weight:700;cursor:pointer">${star ? '★ ' : ''}${lessonEsc(option.room.roomNo)} · ${option.room.capacity}석${oversize ? ' · 중그룹실' : ''}</button>`;
    }).join('');
    // 「이 유형에는 못 쓰는 방」은 교시와 상관없는 사실이라 여기 적으면 매번 같은 다섯 줄이 깔린다.
    // 이 자리에 필요한 건 「쓸 수 있는 방인데 지금 누가 차지하고 있다」뿐이다.
    const taken = blocked.filter(option => !/못 쓰는 강의실/.test(option.reason || ''));
    const blockedHtml = taken.length
      ? `<div style="margin-top:5px;font-size:9.5px;color:#9CA3AF;line-height:1.7">${taken.slice(0, 4).map(option => `${lessonEsc(option.room.roomNo)} — ${lessonEsc(option.reason)}`).join('<br>')}${taken.length > 4 ? `<br>외 ${taken.length - 4}개` : ''}</div>`
      : '';
    roomHtml = (chips || `<span style="font-size:11px;color:#B45309">${period}교시에 ${need}명이 들어갈 빈 강의실이 없어.</span>`) + blockedHtml;
  }

  // ── 3 · 강사 ────────────────────────────────────────────
  const teacherRow = row => {
    const selected = row.teacher.id === _teacherAssign.teacherId;
    const blocked = row.tier === 'blocked';
    const star = recommended && recommended.period === period && recommended.teacher.id === row.teacher.id;
    const why = blocked
      ? `<span style="font-size:10.5px;color:#9CA3AF">${lessonEsc(row.reason || '배정할 수 없어')}</span>`
      : `${(row.fit?.badges || []).map(badge => teacherAssignBadge(badge.tone, badge.text)).join('')}${row.warnings.map(text => teacherAssignBadge('warn', text)).join('')}${row.ok ? '' : teacherAssignBadge('warn', row.reason || '넘기고 배정')}`;
    return `<button ${blocked ? 'disabled' : `onclick="pickTeacherAssign(${row.teacher.id})"`} style="width:100%;display:flex;align-items:flex-start;gap:10px;text-align:left;padding:9px 11px;margin-bottom:5px;border:1px solid ${selected ? '#5E5CE6' : '#E5E7EB'};border-radius:9px;background:${selected ? '#F5F3FF' : '#fff'};cursor:${blocked ? 'not-allowed' : 'pointer'};opacity:${blocked ? .55 : 1}">
      <span style="flex:1;min-width:0">
        <span style="display:block;font-size:11.5px;font-weight:700;color:#111827">${star ? '<span style="color:#5E5CE6;font-weight:900">★ </span>' : ''}${lessonEsc(row.teacher.nick || row.teacher.name)}<span style="font-weight:400;color:#9CA3AF"> · ${lessonEsc((row.teacher.classTypes || []).join('·') || '-')}</span></span>
        <span style="display:block;margin-top:3px">${why}</span>
      </span>
    </button>`;
  };

  let teacherHtml = '<div style="font-size:11px;color:#9CA3AF">교시를 고르면 그 시간에 가능한 강사만 남아.</div>';
  if (period != null) {
    const rows = getTeacherAssignRowsForPeriod(group, period);
    const byTier = tier => rows.filter(row => row.tier === tier);
    teacherHtml = [
      byTier('ok').length ? sectionHead('·', '배정 가능', '이 반에 잘 맞는 순서') + byTier('ok').map(teacherRow).join('') : '',
      byTier('warn').length ? sectionHead('·', '조건부', '넘기고 배정할 수 있어') + byTier('warn').map(teacherRow).join('') : '',
      byTier('blocked').length ? sectionHead('·', '배정 불가') + byTier('blocked').map(teacherRow).join('') : ''
    ].join('') || '<div style="font-size:11px;color:#9CA3AF">이 교시에 고를 수 있는 강사가 없어.</div>';
  }

  const ready = Boolean(_teacherAssign.teacherId && period != null && _teacherAssign.roomId != null);
  const pickedTeacher = period != null && _teacherAssign.teacherId != null
    ? getTeacherAssignRowsForPeriod(group, period).find(row => row.teacher.id === _teacherAssign.teacherId)
    : null;
  const overrideNeeded = Boolean(pickedTeacher && !pickedTeacher.ok);

  const panel = body => `<div style="padding:11px 13px;border:1px solid #E5E7EB;border-radius:11px;background:#F9FAFB;margin-bottom:8px">${body}</div>`;

  host.innerHTML = `<div style="width:min(760px,96vw);max-height:92vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden">
    <div style="padding:15px 20px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:10px">
      <div style="flex:1;min-width:0">
        <h3 style="font-size:15px;margin:0;color:#111827">수업 배정 — ${lessonEsc(getGroupDisplayName(group))}</h3>
        <div style="font-size:10.5px;color:#6B7280;margin-top:3px">${lessonEsc(group.course || '-')} · ${lessonEsc(group.classType)} · 학생 ${studentCount}명 · 월~금</div>
      </div>
      <button onclick="closeTeacherAssignModal()" style="border:0;background:none;font-size:20px;color:#6B7280;cursor:pointer">×</button>
    </div>
    <div style="padding:14px 20px;overflow:auto;flex:1">
      ${studentCount === 0 ? '<div style="padding:10px 12px;border-radius:9px;background:#FFFBEB;border:1px solid #FDE68A;color:#92400E;font-size:11px;line-height:1.7;margin-bottom:10px"><b>이 반에는 아직 학생이 없어.</b><br>인원이 정해져야 들어갈 강의실을 고를 수 있어서, 지금 배정하면 강의실 추천은 근거가 없어. 위쪽 <b>그룹 수업 배정</b>에서 학생을 먼저 넣어줘.</div>' : ''}
      ${panel(sectionHead(1, '교시', '학생 전원이 비는 시간 · 방과 강사가 몇 개 남았는지 같이 보여') + `<div style="display:flex;flex-wrap:wrap">${periodChips}</div>`)}
      ${panel(sectionHead(2, '강의실', studentCount ? `${studentCount}명이 들어가고 그 교시에 비는 방` : '그 교시에 비는 방') + roomHtml)}
      <div style="padding:11px 13px;border:1px solid #E5E7EB;border-radius:11px;background:#fff">
        ${sectionHead(3, '강사', period != null ? `${period}교시에 수업할 수 있는 사람` : '')}
        ${teacherHtml}
      </div>
    </div>
    <div style="padding:12px 20px;border-top:1px solid #E5E7EB;background:#F9FAFB;display:flex;align-items:center;gap:8px">
      <span style="flex:1;font-size:10.5px;color:${overrideNeeded ? '#B45309' : '#9CA3AF'}">${overrideNeeded ? '⚠ 넘기고 배정하는 강사야. 확정하면 그대로 들어가.' : (ready ? '교시 · 강의실 · 강사가 다 정해졌어.' : '교시 → 강의실 → 강사 순으로 골라줘.')}</span>
      <button class="tsa-btn tsa-btn-outline" onclick="closeTeacherAssignModal()">취소</button>
      <button class="tsa-btn tsa-btn-primary" ${ready ? '' : 'disabled style="opacity:.45;cursor:not-allowed"'} onclick="confirmTeacherAssign()">배정 확정</button>
    </div>
  </div>`;
}

function confirmTeacherAssign() {
  if (!_teacherAssign) return;
  const { groupId, teacherId, period, roomId } = _teacherAssign;
  const group = MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!group) { closeTeacherAssignModal(); return; }
  if (teacherId == null || period == null || roomId == null) {
    showToast('강사 · 교시 · 강의실을 모두 골라야 배정할 수 있어.', 'warning');
    return;
  }
  group.periods = [Number(period)];
  group.dayOfWeek = [...LESSON_DAYS];
  group.weeklyFrequency = LESSON_DAYS.length;
  group.teacherId = Number(teacherId);
  group.roomId = Number(roomId);
  const teacher = MOCK_TEACHERS.find(item => item.id === group.teacherId);
  const room = MOCK_CLASS_ROOMS.find(item => item.id === group.roomId);
  closeTeacherAssignModal();
  showToast(`✓ ${getGroupDisplayName(group)} — ${period}교시 · ${teacher?.nick || teacher?.name || '-'} · ${room?.roomNo || '-'}에 배정했어.`, 'success');
  renderStudentClassAssignView();
}

function runScaStep2AutoPlace() {
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  // 자리 맞추기 어려운 반부터 놓는다 — 중그룹(강의실이 적다)과 인원 많은 반이 먼저.
  const pending = MOCK_GROUP_CLASSES
    .filter(group => group.status === 'active' && (group.studentIds || []).length && (!Array.isArray(group.periods) || !group.periods.length))
    .sort((a, b) => (a.classType === '1:8' ? 0 : 1) - (b.classType === '1:8' ? 0 : 1) || b.studentIds.length - a.studentIds.length);

  if (!pending.length) {
    showToast('시간 미정인 반이 없어. 다 배치돼 있어.', 'info');
    return;
  }

  let placed = 0;
  let released = 0;
  const failed = [];
  pending.forEach(group => {
    const best = findBestPlacementForGroup(group, totalPeriods);
    if (!best) {
      failed.push(`${getGroupDisplayName(group)} — ${explainPlacementFailure(group, totalPeriods)}`);
      return;
    }
    group.periods = [best.period];
    group.dayOfWeek = [...LESSON_DAYS];
    group.weeklyFrequency = LESSON_DAYS.length;
    group.teacherId = best.teacher.id;
    group.roomId = best.room.id;
    // 그룹이 앉은 자리와 겹치는 1:1은 놓아준다. 3단계에서 남은 자리에 다시 잡는다.
    released += releaseTeacherOneToOneAtPeriod(best.teacher.id, best.period).length;
    (group.studentIds || []).forEach(id => {
      const student = MOCK_STUDENTS.find(item => item.id === id);
      if (student) released += releaseOneToOneClashingWithGroup(student, group).length;
    });
    placed += 1;
  });

  const parts = [`${placed}개 반을 배치했어`];
  if (released) parts.push(`겹치던 1:1 ${released}건은 2단계에서 다시 잡아줘`);
  if (failed.length) parts.push(`${failed.length}개 반은 못 놓았어 — ${failed.slice(0, 2).join(' / ')}`);
  showToast(`${placed ? '✓ ' : ''}${parts.join('. ')}.`, failed.length ? 'warning' : 'success');
  renderStudentClassAssignView();
}
function renderGroupManagementMatrix() {
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  const levels = [...MOCK_MASTER_LEVELS].filter(level => level.visible !== false).sort((a, b) => a.order - b.order)
    .filter(level => _gmLevelFilter === 'all' || _gmLevelFilter === String(level.order));
  if (!levels.length) return '<div style="padding:30px;text-align:center;color:#9CA3AF">표시할 레벨이 없어.</div>';

  const inScope = group =>
    (_gmTypeFilter === 'all' || group.classType === _gmTypeFilter) &&
    (_gmCourseFilter === 'all' || getGroupCurriculumRefs(group).some(ref => ref.id === _gmCourseFilter));
  const groupsInScope = MOCK_GROUP_CLASSES.filter(group => group.status === 'active' && inScope(group));
  const unscheduled = MOCK_GROUP_CLASSES.filter(group => isUnscheduledGroup(group) && inScope(group));
  const levelHasUnscheduled = new Set();
  unscheduled.forEach(group => getGroupLevelSet(group).forEach(order => levelHasUnscheduled.add(order)));
  // 고른 반이 배치되거나 필터 밖으로 나가면 선택은 스스로 풀린다.
  const pickedGroup = _gmPickedUnscheduledGroupId != null
    ? unscheduled.find(group => group.id === _gmPickedUnscheduledGroupId) || null
    : null;

  const columnIndex = new Map(levels.map((level, index) => [level.order, index]));

  // 눌러도 아무 일이 없는 버튼은 고장 난 것처럼 보인다. 항상 눌리게 두고,
  // 놓을 반이 없을 때는 팝업이 이유와 다음 행동(그룹 편성으로 가기)을 알려준다.
  const placeButton = (period, level) => {
    const has = levelHasUnscheduled.has(level.order);
    // 반을 하나 골랐으면 그 반이 실제로 들어갈 수 있는 칸만 켠다. 아니면 예전대로 레벨 단위로 켠다.
    const lit = pickedGroup
      ? getGroupLevelSet(pickedGroup).includes(level.order) && canPlaceGroupAtPeriod(pickedGroup, period)
      : has && _gmHighlightUnscheduled;
    const border = lit ? 'solid #5E5CE6' : has ? 'dashed #D8DCEA' : 'dashed #EEF0F5';
    const color = lit ? '#4F46E5' : has ? '#9CA3AF' : '#D1D5DB';
    return `<button onclick="event.stopPropagation();openGroupPlacementModal(${period},${level.order})" title="${has ? '이 칸에 놓을 반 고르기' : '이 레벨에는 시간 미정인 반이 없어'}" style="width:100%;padding:5px 0;border:1.5px ${border};border-radius:8px;background:${lit ? '#EEF2FF' : '#fff'};color:${color};font-size:10.5px;font-weight:700;cursor:pointer">+ 배치</button>`;
  };

  const groupTile = (group, spanLabel) => {
    const capacity = getGroupCapacityFor(group);
    const count = group.studentIds.length;
    const isFull = count >= capacity;
    const merged = Boolean(spanLabel);
    const barColor = merged ? '#5E5CE6' : (isFull ? '#9CA3AF' : '#059669');
    return `<div style="border:1px ${merged ? 'dashed' : 'solid'} #E5E7EB;border-left:3px ${merged ? 'dashed' : 'solid'} ${barColor};border-radius:8px;margin-bottom:4px;background:#fff;overflow:hidden">
      <button onclick="openActiveGroupDetail(${group.id})" style="width:100%;text-align:left;border:0;background:none;padding:6px 8px;font-size:10px;color:#6B7280;cursor:pointer">
        <b style="display:block;font-size:10.5px;color:#111827">${lessonEsc(getGroupDisplayName(group))}</b>
        <span><b style="font-size:11px;color:${isFull ? '#9CA3AF' : '#059669'}">${count}</b>/${capacity}명 · ${lessonEsc(getGroupTeacherLabel(group))}${group.roomId != null ? ` · ${lessonEsc(MOCK_CLASS_ROOMS.find(room => room.id === group.roomId)?.roomNo || '')}` : ''}</span>
        ${merged ? `<span style="display:block;margin-top:2px;font-size:9.5px;font-weight:700;color:#5E5CE6">통합 ${spanLabel}</span>` : ''}
      </button>
      <button onclick="event.stopPropagation();unplaceGroupSchedule(${group.id})" title="배치를 취소하고 시간 미정으로 되돌린다" style="width:100%;border:0;border-top:1px dashed #F3F4F6;background:#fff;color:#C4C9D4;font-size:9.5px;font-weight:700;padding:3px 0;cursor:pointer" onmouseover="this.style.color='#DC2626';this.style.background='#FEF2F2'" onmouseout="this.style.color='#C4C9D4';this.style.background='#fff'">✕ 배치 취소</button>
    </div>`;
  };

  const headerCells = levels.map(level => `<th style="padding:8px;font-size:11px;color:#6B7280;text-align:center;background:#F8FAFC;border-bottom:1px solid #E5E7EB;border-left:1px solid #E5E7EB">${lessonEsc(level.name)}</th>`).join('');

  const bodyRows = Array.from({ length: totalPeriods }, (_, i) => i + 1).map(period => {
    const atPeriod = groupsInScope.filter(group => Array.isArray(group.periods) && group.periods.map(Number).includes(period));

    // 통합 그룹(레벨 2개)은 아랫단에 가로로 합쳐서 한 번만 그린다.
    const bandItems = [];
    atPeriod.filter(group => isMergedLevelGroup(group)).forEach(group => {
      const visible = getGroupLevelSet(group).map(order => columnIndex.get(order)).filter(index => index != null).sort((a, b) => a - b);
      if (!visible.length) return;
      const span = visible.length === 2 && visible[1] - visible[0] === 1 ? 2 : 1;
      const label = getGroupLevelSet(group).map(getLevelGroupName).map(lessonEsc).join(' ~ ');
      if (span === 2) bandItems.push({ group, start: visible[0], span: 2, label });
      else visible.forEach(index => bandItems.push({ group, start: index, span: 1, label }));
    });

    // 서로 겹치지 않는 통합끼리는 같은 줄에 눕힌다 — 줄 수를 최소로 줄인다.
    const bands = [];
    bandItems.sort((a, b) => a.start - b.start).forEach(item => {
      let row = bands.find(existing => existing.every(other => item.start >= other.start + other.span || other.start >= item.start + item.span));
      if (!row) { row = []; bands.push(row); }
      row.push(item);
    });

    const mainCells = levels.map(level => {
      const singles = atPeriod.filter(group => !isMergedLevelGroup(group) && getGroupLevelSet(group).includes(level.order));
      return `<td style="padding:6px;vertical-align:top;border-bottom:${bands.length ? '0' : '1px solid #E5E7EB'};border-left:1px solid #E5E7EB;min-width:150px">${singles.map(group => groupTile(group, null)).join('')}${placeButton(period, level)}</td>`;
    }).join('');

    const bandRows = bands.map((row, rowIndex) => {
      const sorted = [...row].sort((a, b) => a.start - b.start);
      const cells = [];
      let column = 0;
      const isLast = rowIndex === bands.length - 1;
      const borderBottom = isLast ? '1px solid #E5E7EB' : '0';
      sorted.forEach(item => {
        while (column < item.start) {
          cells.push(`<td style="padding:6px;border-bottom:${borderBottom};border-left:1px solid #E5E7EB"></td>`);
          column += 1;
        }
        cells.push(`<td colspan="${item.span}" style="padding:6px;vertical-align:top;border-bottom:${borderBottom};border-left:1px solid #E5E7EB">${groupTile(item.group, item.label)}</td>`);
        column += item.span;
      });
      while (column < levels.length) {
        cells.push(`<td style="padding:6px;border-bottom:${borderBottom};border-left:1px solid #E5E7EB"></td>`);
        column += 1;
      }
      return `<tr>${cells.join('')}</tr>`;
    }).join('');

    return `<tr><th rowspan="${1 + bands.length}" style="padding:8px 12px;font-size:11.5px;font-weight:700;color:#111827;text-align:left;vertical-align:top;white-space:nowrap;background:#F8FAFC;border-bottom:1px solid #E5E7EB">${period}교시</th>${mainCells}</tr>${bandRows}`;
  }).join('');

  // 1단계·3단계와 같이 목록 머리에 둔다.
  const autoButton = unscheduled.length
    ? `<button onclick="event.stopPropagation();runScaStep2AutoPlace()" title="시간 미정인 반을 빈 교시에 알아서 놓는다" style="margin-left:auto;border:0;border-radius:8px;background:#5E5CE6;color:#fff;font-size:10.5px;font-weight:700;padding:6px 13px;cursor:pointer">⚡ 자동 배치</button>`
    : '';

  // 시간 미정 목록. 1단계·3단계처럼 "남은 일"을 이름으로 세워두고, 왜 못 놓는지까지 붙인다.
  // 순서는 자동 배치와 같다 — 자리 맞추기 어려운 중그룹·인원 많은 반 먼저, 학생 없는 반은 맨 뒤.
  const toneStyle = {
    ok: 'color:#047857;background:#ECFDF5;border-color:#A7F3D0',
    blocked: 'color:#B45309;background:#FFFBEB;border-color:#FCD34D',
    empty: 'color:#8A90A2;background:#F8FAFC;border-color:#E5E7EB'
  };
  const undecidedBadge = unscheduled.length
    ? (() => {
        const items = unscheduled
          .map(group => ({ group, status: getUnscheduledGroupStatus(group, totalPeriods) }))
          .sort((a, b) =>
            (a.status.tone === 'empty' ? 1 : 0) - (b.status.tone === 'empty' ? 1 : 0) ||
            (a.group.classType === '1:8' ? 0 : 1) - (b.group.classType === '1:8' ? 0 : 1) ||
            b.group.studentIds.length - a.group.studentIds.length
          );
        const rows = items.map(({ group, status }) => {
          const on = pickedGroup && pickedGroup.id === group.id;
          const capacity = getGroupCapacityFor(group);
          const count = group.studentIds.length;
          return `<button onclick="pickUnscheduledGroup(${group.id})" title="${lessonEsc(status.hint)}" style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;width:100%;text-align:left;padding:7px 12px;border:0;border-bottom:1px solid #FDF0CE;background:${on ? '#EEF2FF' : '#fff'};cursor:pointer">
            <b style="flex:1;min-width:0;font-size:11.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(getGroupDisplayName(group))}</b>
            ${isMergedLevelGroup(group) ? '<span style="flex:0 0 auto;font-size:11px;font-weight:700;color:#4F46E5;background:#EEF2FF;border-radius:5px;padding:1px 6px">통합</span>' : ''}
            <span style="flex:0 0 56px;font-size:10.5px;color:#6B7280;text-align:right;white-space:nowrap"><b style="color:${count >= capacity ? '#9CA3AF' : '#059669'}">${count}</b>/${capacity}명</span>
            <span style="flex:0 0 148px;display:flex;justify-content:flex-end"><span style="max-width:100%;font-size:9.5px;font-weight:800;border:1px solid;border-radius:999px;padding:2px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;${toneStyle[status.tone]}">${lessonEsc(status.text)}</span></span>
          </button>`;
        }).join('');
        return `<div style="border:1.5px solid #B45309;border-radius:11px;background:#FEF3C7;overflow:hidden;margin-bottom:14px">
          <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 12px;border-bottom:1px solid #F3D89B">
            <b style="font-size:11.5px;color:#B45309">아직 시간을 못 정한 반 ${unscheduled.length}개</b>
            <span style="font-size:10.5px;color:#8A90A2">${pickedGroup ? '켜진 칸이 이 반을 놓을 수 있는 자리야. 다시 누르면 꺼져.' : '반을 누르면 놓을 수 있는 칸이 켜져.'}</span>
            ${autoButton}
          </div>
          <div style="max-height:250px;overflow:auto">${rows}</div>
        </div>`;
      })()
    : `<div style="border:1.5px solid #047857;border-radius:11px;background:#ECFDF5;overflow:hidden;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:9px 12px">
          <b style="font-size:11.5px;color:#047857">시간 미정인 반이 없어</b>
          <span style="font-size:10.5px;color:#8A90A2">지금 있는 반은 모두 배치됐어. 새 반은 <b>그룹 편성</b>에서 만들어.</span>
        </div>
      </div>`;

  const legend = `<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;padding:9px 13px;border-top:1px solid #F3F4F6;font-size:10.5px;color:#9CA3AF">
    <span><i style="display:inline-block;width:3px;height:11px;border-radius:2px;background:#059669;vertical-align:-1px;margin-right:5px"></i>자리 있음</span>
    <span><i style="display:inline-block;width:3px;height:11px;border-radius:2px;background:#9CA3AF;vertical-align:-1px;margin-right:5px"></i>마감</span>
    <span><i style="display:inline-block;width:3px;height:11px;border-radius:2px;background:#5E5CE6;vertical-align:-1px;margin-right:5px"></i>통합 레벨 그룹(점선) — <b>묶인 레벨 칸을 합쳐서 한 번만</b> 보인다</span>
    <span>모든 그룹 수업은 <b>주 5회(월~금)</b>, 요일마다 같은 교시다.</span>
  </div>`;

  return `${undecidedBadge}
  <div style="overflow-x:auto;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
    <table style="border-collapse:collapse;width:100%">
      <thead><tr><th style="padding:8px 12px;font-size:11px;color:#9CA3AF;text-align:left;background:#F8FAFC;border-bottom:1px solid #E5E7EB">교시 \\ 레벨</th>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
    ${legend}
  </div>`;
}
function getGroupSubjectNamesLabel(group) {
  const refs = getGroupCurriculumRefs(group);
  return refs.map(ref => MOCK_MASTER_SUBJECTS.find(s => s.id === ref.id)?.name || ref.id).join('·') || '-';
}

// 운영 그룹 행에서 해당 과목·레벨·유형·교시에 대응하는 기존 그룹 상세 팝업을 연다.
function openActiveGroupDetail(groupId) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(groupId));
  if (!group) {
    showToast('그룹 정보를 찾을 수 없어.', 'warning');
    return;
  }
  const subjectId = getGroupSubjectId(group);
  const levels = getGroupLevelSet(group);
  const rows = buildGroupManagementDisplayRows();
  // 수요 줄을 못 찾아도 연다. 수요 줄은 「학생이 필요로 하는 과목·레벨」로 만들어져서,
  // 학생을 받기 전에 미리 연 반은 어느 줄에도 붙지 않는다 — 그런 반일수록 학생을 넣으러
  // 들어오는 화면이라 여기서 막으면 갈 데가 없다. 못 찾으면 반 자체로 줄을 지어 쓴다.
  const rowIndex = rows.findIndex(row =>
    row.subjectId === subjectId &&
    row.classType === group.classType &&
    levels.includes(row.levelGroup)
  );
  openGroupManagementBrowserPopup(rowIndex, undefined, group.id);
}

// 수요 줄이 없는 반을 위해 반 하나짜리 줄을 지어준다. 상세 팝업이 기대하는 모양 그대로다.
function buildGroupFallbackDisplayRow(group) {
  const subjectId = getGroupSubjectId(group);
  const levels = getGroupLevelSet(group);
  const studentIds = [...(group.studentIds || [])];
  const capacity = getGroupCapacityFor(group);
  return {
    key: `group-${group.id}`,
    subjectId,
    subjectName: MOCK_MASTER_SUBJECTS.find(item => item.id === subjectId)?.name || subjectId,
    levelGroup: levels[0],
    levelGroups: levels,
    classType: group.classType,
    curriculum: getGroupCurriculumRefs(group),
    studentIds,
    courseNames: getGroupCourses(group),
    displayGroupIds: [group.id],
    capacity,
    baseCapacity: getGroupBaseCapacityFor(group),
    totalStudents: studentIds.length,
    waitingCount: 0,
    requiredGroups: 1,
    existingGroups: 1,
    additionalGroups: 0,
    openSeats: Math.max(0, capacity - studentIds.length)
  };
}

function renderGroupPopupWindow(popup, render) {
  let rendered = false;
  const run = () => {
    if (rendered || !popup || popup.closed) return;
    rendered = true;
    render();
  };
  popup.addEventListener('load', run, { once: true });
  // 로컬 file:// 화면은 매우 빨리 열려 load 이벤트 등록 전에 완료될 수 있어 보조 실행을 둔다.
  window.setTimeout(run, 180);
}

function createGroupPopupUrl(mode) {
  const popupUrl = new URL('group-popup.html', window.location.href);
  popupUrl.searchParams.set('v', '0.8.74');
  popupUrl.searchParams.set('view', mode);
  popupUrl.searchParams.set('week', getScaWeek());
  return popupUrl;
}

function initializeGroupPopupMessageBridge() {
  if (window.__tsaGroupPopupMessageBridgeInitialized) return;
  window.__tsaGroupPopupMessageBridgeInitialized = true;
  window.addEventListener('message', event => {
    const message = event.data;
    if (!message || message.channel !== 'tsa-group-popup') return;

    if (message.action === 'ready') {
      event.source?.postMessage({
        channel: 'tsa-group-popup',
        action: 'initialize',
        payload: {
          students: MOCK_STUDENTS,
          groups: MOCK_GROUP_CLASSES,
          teachers: MOCK_TEACHERS,
          rooms: MOCK_CLASS_ROOMS
        }
      }, '*');
      return;
    }

    if (message.action === 'save-group') {
      const result = saveGroupFromBrowserPopup(message.groupId ?? null, message.payload || {});
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage({
          channel: 'tsa-group-popup',
          action: 'save-group-result',
          result,
          returnToStudentAssignment: message.returnToStudentAssignment || null
        }, '*');
      }
      return;
    }

    if (message.action === 'remove-student-from-group') {
      const result = removeStudentFromGroupFromBrowserPopup(message.studentId, message.groupId);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage({
          channel: 'tsa-group-popup',
          action: 'remove-student-from-group-result',
          result,
          studentId: Number(message.studentId),
          groupId: Number(message.groupId)
        }, '*');
      }
      return;
    }

    if (message.action === 'delete-group') {
      const result = deleteGroupFromBrowserPopup(message.groupId);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      return;
    }

    if (message.action === 'assign-students') {
      const result = assignGroupStudentsFromBrowserPopup(message.groupId, message.studentIds || []);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
    }

    if (message.action === 'assign-student-to-group') {
      const result = assignStudentToGroupFromBrowserPopup(message.studentId, message.groupId);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      if (result.ok && typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage({ channel: 'tsa-group-popup', action: 'assign-student-to-group-result', result }, '*');
      }
      return;
    }

    if (message.action === 'assign-student-group-selections') {
      const result = assignStudentGroupSelectionsFromBrowserPopup(message.studentId, message.assignments || []);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      if (result.ok && typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage({ channel: 'tsa-group-popup', action: 'assign-student-group-selections-result', result }, '*');
      }
      return;
    }

    if (message.action === 'change-student-group') {
      const result = changeStudentAssignedGroup(message.studentId, message.fromGroupId, message.toGroupId);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      if (result.ok && typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
    }

    if (message.action === 'assign-students-additive') {
      const result = assignStudentsToGroupFromBrowserPopup(message.studentIds || [], message.groupId);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
    }

    if (message.action === 'save-primary-teacher') {
      const result = saveStudentPrimaryTeacher(message.studentId, message.teacherId);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      if (result.ok && typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
    }

    if (message.action === 'save-one-to-one-schedule') {
      const result = saveStudentOneToOneSchedule(message.studentId, message.subjectId, message.teacherId, message.period, message.templateSequence);
      showToast(`${result.ok ? '✓ ' : ''}${result.message}`, result.ok ? 'success' : 'warning');
      if (result.ok && typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
    }

    if (message.action === 'unassign-one-to-one') {
      unassignStudentOneToOne(message.studentId, message.subjectId, message.templateSequence);
      showToast('1:1 수업 배정을 해제했어.', 'success');
      if (typeof renderCsStudentAssignmentList === 'function') renderCsStudentAssignmentList();
    }

    // "운영 그룹 전체 보기" 팝업(로컬 스크립트 없이 열림)은 직접 함수를 호출할 수 없어(파일 오리진이 서로 달라 차단됨),
    // 메시지로 요청하면 메인 창(자기 자신 컨텍스트)에서 대신 열어준다.
    if (message.action === 'open-student-editor') {
      openGroupManagementStudentEditor(message.groupId);
    }

    if (message.action === 'open-group-edit') {
      openGroupEditBrowserPopup(message.groupId);
    }

    if (message.action === 'open-group-create') {
      openGroupCreateBrowserPopup(message.curriculum || [], message.classType, message.levelGroup, undefined, undefined, message.sequence);
    }
  });
}

initializeGroupPopupMessageBridge();

function openGroupManagementBrowserPopup(rowIndex, popupTarget, selectedGroupId) {
  // 행 순서는 '추가 생성 필요 수 -> 대기 인원'으로 정렬돼서, 학생을 반에 넣거나 뺄 때마다 바뀐다.
  // 그래서 URL에 박아둔 순번은 그 다음 새로고침이면 이미 다른 행을 가리킨다.
  // 반 번호는 안 바뀌니, 번호가 있으면 그 반이 실제로 들어 있는 행을 먼저 찾고 순번은 대비책으로만 쓴다.
  const displayRows = buildGroupManagementDisplayRows();
  const selectedGroupRow = selectedGroupId != null
    ? (() => {
        const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(selectedGroupId));
        if (!group) return null;
        const subjectId = getGroupSubjectId(group);
        const levels = getGroupLevelSet(group);
        return displayRows.find(item =>
          item.subjectId === subjectId &&
          item.classType === group.classType &&
          levels.includes(item.levelGroup)
        ) || null;
      })()
    : null;
  const fallbackGroup = selectedGroupId != null
    ? MOCK_GROUP_CLASSES.find(item => item.id === Number(selectedGroupId))
    : null;
  const row = selectedGroupRow || displayRows[rowIndex]
    || (fallbackGroup ? buildGroupFallbackDisplayRow(fallbackGroup) : null);
  if (!row) return;
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('detail');
    popupUrl.searchParams.set('row', rowIndex);
    if (selectedGroupId != null) popupUrl.searchParams.set('groupId', selectedGroupId);
    const openedPopup = window.open(popupUrl.href, `tsa-group-detail-${rowIndex}`, 'popup=yes,width=1120,height=780,resizable=yes,scrollbars=yes');
    if (!openedPopup) {
      showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
      return;
    }
    return;
  }
  const rowGroups = getGroupManagementRowGroups(row);
  const selectedGroup = selectedGroupId != null ? rowGroups.find(group => group.id === Number(selectedGroupId)) : null;
  const groups = selectedGroup ? [selectedGroup] : rowGroups;
  const assignedIds = new Set(rowGroups.flatMap(group => group.studentIds));
  const students = row.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
  const waitingStudents = students.filter(student => !assignedIds.has(student.id));
  const levelLabel = (row.levelGroups || [row.levelGroup]).map(getLevelGroupName).join(' ~ ');
  const popup = popupTarget;
  try { popup.stop(); } catch (error) {}
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  const groupsData = groups.map(group => ({
    id: group.id,
    hardCap: getGroupCapacityFor(group),
    baseCap: getGroupBaseCapacityFor(group),
    count: group.studentIds.length
  }));
  const candidatesByGroup = {};
  groups.forEach(group => { candidatesByGroup[group.id] = buildGroupAssignCandidateRows(group); });
  // 조건 전체 숫자(대상 학생·배정 대기·추가 필요 그룹)는 그룹 편성 목록에서 이미 보인다.
  // 반 하나를 보러 들어온 화면에 그걸 두면 "이 반 숫자가 아니야"라는 설명이 두 줄 따라붙는다.
  const heroHtml = selectedGroup ? (() => {
    const placed = Array.isArray(selectedGroup.periods) && selectedGroup.periods.length;
    const teacherRow = selectedGroup.teacherId != null ? MOCK_TEACHERS.find(t => t.id === selectedGroup.teacherId) : null;
    const roomRow = selectedGroup.roomId != null ? MOCK_CLASS_ROOMS.find(r => r.id === selectedGroup.roomId) : null;
    const hardCap = getGroupClassCapacity(selectedGroup.classType);
    const baseCap = getGroupBaseCapacity(selectedGroup.classType);
    const count = selectedGroup.studentIds.length;
    const remaining = Math.max(0, hardCap - count);
    const seatLabel = !remaining ? '상한 마감' : count > baseCap ? '초과 배정' : `남은 자리 ${remaining}석`;
    return `<section class="hero">
      <div class="hero-top">
        <b>${esc(getGroupDisplayName(selectedGroup))}</b>
        ${placed ? '<span class="hero-badge ok">배치됨</span>' : '<span class="hero-badge wait">시간 미정</span>'}
        <button class="hero-btn" onclick="openGroupEdit(${selectedGroup.id})">그룹 설정</button>
        <button class="hero-btn danger" onclick="deleteGroup(${selectedGroup.id},${selectedGroup.studentIds.length})">반 삭제</button>
      </div>
      <div class="hero-line">
        <span>교시 <b>${placed ? `월~금 ${esc(selectedGroup.periods.join(', '))}교시` : '—'}</b></span>
        <span>담당 선생님 <b>${esc(teacherRow ? (teacherRow.nick || teacherRow.name) : '—')}</b></span>
        <span>강의실 <b>${esc(roomRow ? roomRow.roomNo : '—')}</b></span>
        <span>인원 <b>${count}/${baseCap}명</b> · ${seatLabel}</span>
      </div>
      ${placed ? '' : '<div class="hero-hint">아직 시간이 안 잡힌 반이야. <b>스케줄 배정</b> 탭의 표에서 교시·담당 선생님·강의실을 정해줘.</div>'}
    </section>`;
  })() : '';

  const groupCards = groups.map((group, index) => {
    const hardCap = getGroupCapacityFor(group);
    const baseCap = getGroupBaseCapacityFor(group);
    const groupStudents = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
    const remaining = Math.max(0, hardCap - groupStudents.length);
    const over = groupStudents.length > baseCap;
    const scheduleLabel = `${Array.isArray(group.dayOfWeek) && group.dayOfWeek.length ? `${esc(group.dayOfWeek.join(','))} ` : ''}${Array.isArray(group.periods) && group.periods.length ? esc(group.periods.join(', ')) + '교시' : ''}${group.teacherId != null ? ` · ${esc(MOCK_TEACHERS.find(t => t.id === group.teacherId)?.nick || '')}` : ''}${group.roomId != null ? ` · ${esc(MOCK_CLASS_ROOMS.find(r => r.id === group.roomId)?.roomNo || '')}` : ''}`;
    const studentCardsHtml = groupStudents.map(student => {
      const displayName = student.nick || student.name || '-';
      const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
      const period = [student.startDate, student.departureDate].filter(Boolean).join(' ~ ') || '-';
      return `<article class="student-card">
        <button class="remove-student" onclick="event.stopPropagation();removeStudent(${group.id},${student.id})" title="이 반에서 빼기" aria-label="이 반에서 빼기">✕</button>
        <img class="student-avatar-img" src="${esc(avatarSrc)}" alt="${esc(displayName)}">
        <div class="student-main">
          <div class="student-name"><b>${esc(displayName)}</b><span>${esc(student.name || '')}</span></div>
          <div class="student-tags"><span>${esc(student.level || '-')}</span><span>${esc(student.course || '-')}</span></div>
          <dl>
            <div><dt>국적 · 성별 · 나이</dt><dd>${esc(student.flag || '')} ${esc(student.nationality || '-')} · ${esc(student.gender || '-')}성 · ${esc(student.age || '-')}세</dd></div>
            <div><dt>담당 에이전시</dt><dd>${esc(student.agency || '-')}</dd></div>
            <div><dt>수강 기간</dt><dd>${esc(period)}</dd></div>
          </dl>
        </div>
      </article>`;
    }).join('') || '<div class="empty-students">현재 배정된 학생이 없어.</div>';
    // 반 하나를 골라 들어왔으면 이름·시간·인원은 위 요약이 이미 말했다. 여기서는 학생만 남긴다.
    if (selectedGroup) {
      return `<div class="group-card selected expanded" data-group-id="${group.id}" style="cursor:default">
        <div class="group-details" style="display:block;margin:0;padding-top:0;border-top:0">
          <div class="detail-title"><b>소속 학생 ${groupStudents.length}명</b><span>카드 오른쪽 위 <b>✕</b>를 누르면 이 반에서 뺄 수 있어.</span></div>
          <div class="student-grid">${studentCardsHtml}</div>
        </div>
      </div>`;
    }
    return `<div class="group-card${selectedGroup ? ' selected expanded' : ''}" data-group-id="${group.id}" role="button" tabindex="0" aria-expanded="${selectedGroup ? 'true' : 'false'}" onclick="selectGroup(${group.id})" onkeydown="handleGroupCardKey(event,${group.id})">
      <div class="group-head"><b>${esc(selectedGroup ? scheduleLabel : getGroupManagementDisplayLabel(group, groups))}</b><div class="group-head-right"><span class="${!remaining ? 'full' : over ? 'over' : 'open'}">${!remaining ? '상한 마감' : over ? `초과 배정 · ${esc(getGroupLiveRatioLabel(group))} 운영` : `남은 자리 ${remaining}석`}</span>${selectedGroup ? '' : '<span class="expand-label">학생 정보 보기 <span class="chevron">⌄</span></span>'}</div></div>
      <div class="count">${groupStudents.length}/${baseCap}명${selectedGroup ? '' : ` · ${scheduleLabel}`}</div>
      <div class="chips">${groupStudents.map(student => `<span>${esc(student.nick || student.name)}</span>`).join('') || '<em>배정 학생 없음</em>'}</div>
      <div class="group-details" onclick="event.stopPropagation()">
        <div class="detail-title"><b>소속 학생 ${groupStudents.length}명</b><span>학생의 기본 수강 정보를 확인할 수 있어.</span></div>
        <div class="student-grid">${studentCardsHtml}</div>
      </div>
      <div class="actions">
        <button onclick="event.stopPropagation();openGroupEdit(${group.id})">그룹 설정</button>
      </div>
    </div>`;
  }).join('');
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>그룹 상세</title>
    <style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{position:sticky;top:0;z-index:2;padding:18px 24px;background:#fff;border-bottom:1px solid #E5E7EB}h1{font-size:19px;margin:0}.sub{font-size:10px;color:#9CA3AF;margin-top:3px}
      main{padding:18px 24px 82px}.summary{padding:14px;border:1px solid #E5E7EB;border-radius:12px;background:#fff}.subjects{font-size:12px;color:#4B5563;margin-top:6px}
      .numbers{display:flex;gap:26px;flex-wrap:wrap;margin-top:12px;font-size:11px}.numbers b{margin-left:4px}.warn{color:#B45309}.danger{color:#DC2626}.ok{color:#047857}
      .panel{padding:14px;border:1px solid #E5E7EB;border-radius:12px;background:#fff;margin-top:14px}.panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}h2{font-size:13px;margin:0}
      table{width:100%;border-collapse:collapse}th,td{padding:9px 8px;border-bottom:1px solid #E5E7EB;text-align:left;font-size:11px}th{color:#6B7280;background:#F9FAFB}
      .group-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px;align-items:start}.group-card{min-width:0;padding:12px;border:1.5px solid #E5E7EB;border-radius:10px;cursor:pointer;transition:border-color .2s,background .2s,box-shadow .2s}.group-card:hover{border-color:#A5B4FC;box-shadow:0 5px 14px rgba(79,70,229,.08)}.group-card:focus-visible{outline:3px solid rgba(99,102,241,.2);outline-offset:2px}.group-card.selected{border-color:#5E5CE6;background:#F5F3FF}.group-card.expanded{grid-column:1/-1;cursor:default}.group-head{display:flex;justify-content:space-between;gap:8px;font-size:11px}.group-head-right{display:flex;align-items:flex-end;gap:5px;flex-direction:column}.expand-label{color:#6366F1;font-size:9px;font-weight:700;white-space:nowrap}.chevron{display:inline-block;margin-left:2px;font-size:12px;transition:transform .2s}.group-card.expanded .chevron{transform:rotate(180deg)}.group-card.expanded .expand-label{color:#4338CA}.open{color:#047857}.over{color:#B45309}.full{color:#DC2626}.count{margin-top:5px;color:#4F46E5;font-size:11px;font-weight:800}
      .chips{display:flex;gap:4px;flex-wrap:wrap;margin-top:7px}.chips span{padding:3px 6px;border-radius:999px;background:#F3F4F6;font-size:9px}.chips em{font-size:9px;color:#9CA3AF}.actions{display:flex;gap:5px;margin-top:9px}
      .group-details{display:none;margin:14px -2px 2px;padding-top:14px;border-top:1px solid #DDD6FE}.group-card.expanded .group-details{display:block;animation:detailOpen .18s ease-out}.detail-title{display:flex;align-items:baseline;gap:8px;margin-bottom:10px}.detail-title b{font-size:12px}.detail-title span{font-size:9.5px;color:#6B7280}.student-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:8px}.student-card{display:flex;gap:10px;padding:11px;border:1px solid #E5E7EB;border-radius:9px;background:#fff}.student-avatar-img{width:44px;height:44px;flex:0 0 44px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;background:#F3F4F6}.student-main{min-width:0;flex:1}.student-name{display:flex;align-items:baseline;gap:5px}.student-name b{font-size:11.5px}.student-name span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#9CA3AF;font-size:9px}.student-tags{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}.student-tags span{padding:3px 6px;border-radius:5px;background:#F3F4F6;color:#4B5563;font-size:8.5px}.student-card dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px 12px;margin:10px 0 0}.student-card dl div{min-width:0}.student-card dt{color:#9CA3AF;font-size:8px}.student-card dd{overflow:hidden;margin:2px 0 0;text-overflow:ellipsis;white-space:nowrap;color:#374151;font-size:9px}.empty-students{padding:20px;border:1px dashed #D1D5DB;border-radius:9px;text-align:center;color:#9CA3AF;font-size:10px}@keyframes detailOpen{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}@media(max-width:640px){.student-grid{grid-template-columns:1fr}.student-card dl{grid-template-columns:1fr}.detail-title{align-items:flex-start;flex-direction:column;gap:3px}}
      .student-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #E5E7EB;border-radius:10px;margin-bottom:8px;cursor:pointer}.student-row:has(input:checked){border-color:#6366F1;background:#F5F3FF}.student-row input{width:17px;height:17px;accent-color:#5E5CE6}.student-row b{font-size:12px}.student-row b span{font-weight:400;color:#9CA3AF}.student-row p{margin:3px 0 0;font-size:10.5px;color:#6B7280}.student-row .student-period{color:#8B8FA3}.student-row .student-period strong{color:#7C3AED;font-weight:700;margin-right:4px}
      button{padding:7px 10px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;cursor:pointer;font-size:10px}button.primary{background:#5E5CE6;color:#fff;border-color:#5E5CE6}
      .hero{padding:14px 16px;border:1.5px solid #5E5CE6;border-radius:12px;background:#F5F3FF}.hero-top{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.hero-top b{font-size:14px;color:#111827}.hero-badge{font-size:10px;font-weight:800;padding:3px 9px;border-radius:999px}.hero-badge.wait{background:#FEE2E2;color:#DC2626}.hero-badge.ok{background:#DCFCE7;color:#047857}.hero-btn{margin-left:auto}.hero-btn.danger{margin-left:0;border-color:#FCA5A5;background:#FEE2E2;color:#DC2626}
      .hero-line{display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;font-size:11.5px;color:#4B5563}.hero-line b{color:#4F46E5}.hero-hint{margin-top:8px;font-size:10.5px;color:#6B7280;line-height:1.6}.hero-hint b{color:#4338CA}
      .student-card{position:relative}.remove-student{position:absolute;top:7px;right:7px;width:20px;height:20px;padding:0;display:grid;place-items:center;font-size:10px;font-weight:800;line-height:1;color:#9CA3AF;background:transparent;border:1px solid #E5E7EB;border-radius:50%;cursor:pointer}.remove-student:hover{background:#FEE2E2;color:#DC2626;border-color:#FCA5A5}
      .row-avatar{width:34px;height:34px;flex:0 0 34px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;background:#F3F4F6}
      footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 24px;background:#fff;border-top:1px solid #E5E7EB}
    </style></head><body>
    <header><h1>그룹 상세</h1><div class="sub">${esc(selectedGroup ? getGroupDisplayName(selectedGroup) : `${levelLabel} · ${row.subjectName} · ${getGroupSizeShortLabel(row.classType)}(${row.classType})`)}</div></header>
    <main>
      ${selectedGroup ? heroHtml : `<section class="summary"><b>과목 구성</b><div class="subjects">${esc(getGroupManagementSubjectLabel(row.curriculum))}</div><div class="numbers"><span>대상 학생 <b>${row.totalStudents}명</b></span><span>배정 대기 <b class="${waitingStudents.length ? 'warn' : 'ok'}">${waitingStudents.length}명</b></span><span>추가 필요 그룹 <b class="${row.additionalGroups ? 'danger' : 'ok'}">${row.additionalGroups}개</b></span><span>운영 그룹 <b>${groups.length}개</b></span></div></section>`}
      <section class="panel">
        <div class="panel-head"><h2>${selectedGroup ? '운영 그룹 정보 및 소속 학생' : `운영 그룹 ${groups.length}개`}</h2>${selectedGroup ? '' : '<button class="primary" onclick="createGroupInOpener()">+ 그룹 추가</button>'}</div>
        <div class="group-list">${groupCards || '<div class="sub">운영 그룹이 없어. 그룹을 추가해줘.</div>'}</div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>배정 대상 학생 <span id="assignGroupLabel" class="sub"></span></h2></div>
        <div id="assignStudents"><div class="sub">${selectedGroup ? '배정 대기 학생을 불러오는 중이야.' : '위에서 그룹을 먼저 선택해줘.'}</div></div>
        <div id="assignFooter" style="display:none;justify-content:flex-end;margin-top:8px"><button class="primary" onclick="saveAssign()">선택 학생 배정</button></div>
      </section>
    </main>
    <footer><button onclick="window.close()">닫기</button></footer>
    <script>
      var groupsData=${JSON.stringify(groupsData).replace(/</g, '\\u003c')};
      var candidatesByGroup=${JSON.stringify(candidatesByGroup).replace(/</g, '\\u003c')};
      var selectedGroupId=${selectedGroup ? selectedGroup.id : 'null'};
      function selectGroup(id){
        var clickedCard=document.querySelector('.group-card[data-group-id="'+id+'"]');
        var shouldExpand=clickedCard&&!clickedCard.classList.contains('expanded');
        selectedGroupId=id;
        document.querySelectorAll('.group-card').forEach(function(el){
          var isSelected=Number(el.dataset.groupId)===id;
          el.classList.toggle('selected',isSelected);
          el.classList.toggle('expanded',isSelected&&shouldExpand);
          el.setAttribute('aria-expanded',String(isSelected&&shouldExpand));
        });
        renderAssignSection();
      }
      function handleGroupCardKey(event,id){
        if(event.key==='Enter'||event.key===' '){event.preventDefault();selectGroup(id);}
      }
      function renderAssignSection(){
        var group=groupsData.find(function(g){return g.id===selectedGroupId});
        var label=document.getElementById('assignGroupLabel');
        var footer=document.getElementById('assignFooter');
        if(!group){
          label.textContent='';
          footer.style.display='none';
          document.getElementById('assignStudents').innerHTML='<div class="sub">위에서 그룹을 먼저 선택해줘.</div>';
          return;
        }
        var remaining=Math.max(0,group.hardCap-group.count);
        label.textContent='· 남은 자리 '+remaining+'석 (기준 '+group.baseCap+'명 / 상한 '+group.hardCap+'명)';
        var candidates=candidatesByGroup[String(selectedGroupId)]||[];
        footer.style.display=candidates.length?'flex':'none';
        document.getElementById('assignStudents').innerHTML=candidates.length?candidates.map(function(s){
          var start=formatStudentDate(s.startDate);
          var end=formatStudentDate(s.endDate);
          var dateText=start&&end?start+' ~ '+end:start||end||'수강 기간 미등록';
          var durationText=s.duration?' ('+s.duration+'주)':'';
          var disabledAttr=s.blocked?' disabled':'';
          var rowStyle=s.blocked?' style="opacity:.5;cursor:default"':'';
          var reasonTag=s.reason?'<span style="margin-left:auto;font-size:10px;color:#EF4444;font-weight:700">'+s.reason+'</span>':'';
          return '<label class="student-row"'+rowStyle+'><input type="checkbox" value="'+s.id+'"'+disabledAttr+'><img class="row-avatar" src="'+s.photo+'" alt=""><div style="flex:1"><b>'+s.name+' <span>('+s.sub+')</span></b><p>'+s.course+' · '+s.level+' · '+(s.flag?s.flag+' ':'')+s.nationality+' · '+s.gender+'성 · '+s.age+'세</p><p class="student-period"><strong>▦</strong>'+dateText+durationText+'</p></div>'+reasonTag+'</label>';
        }).join(''):'<div class="sub">동일 과목·레벨군의 미배정 학생이 없어.</div>';
      }
      function formatStudentDate(value){
        if(!value)return '';
        var parts=String(value).split('-');
        return parts.length===3?parts[0].slice(-2)+'.'+parts[1]+'.'+parts[2]:String(value);
      }
      function saveAssign(){
        if(!selectedGroupId){window.alert('그룹을 먼저 선택해.');return;}
        var ids=Array.from(document.querySelectorAll('#assignStudents input:checked:not(:disabled)')).map(function(input){return Number(input.value)});
        if(!ids.length){window.alert('배정할 학생을 선택해.');return;}
        var candidates=candidatesByGroup[String(selectedGroupId)]||[];
        var selectedNames=candidates.filter(function(student){return ids.indexOf(student.id)>-1;}).map(function(student){return student.name;});
        var confirmMessage='선택한 '+ids.length+'명의 학생을 이 그룹에 배정할까?\\n\\n'+selectedNames.join(', ')+'\\n\\n배정 후에도 그룹 상세에서 학생 정보를 확인할 수 있어.';
        if(!window.confirm(confirmMessage))return;
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'assign-students-additive',studentIds:ids,groupId:selectedGroupId},'*');
        window.close();
      }
      // 학생 빼기. 한 번 물어보고, 빼도 학생은 없어지지 않고 배정 대기로 돌아간다.
      function removeStudent(groupId,studentId){
        var card=document.querySelector('.student-card [onclick*="removeStudent('+groupId+','+studentId+')"]');
        var name=card?card.parentNode.querySelector('.student-name b').textContent:'이';
        if(!window.confirm(name+' 학생을 이 반에서 뺄까?\\n\\n학생은 없어지지 않고 배정 대기로 돌아가. 아래 목록에서 다시 넣을 수 있어.'))return;
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'remove-student-from-group',studentId:studentId,groupId:groupId},'*');
      }
      window.addEventListener('message',function(event){
        var message=event.data;
        if(!message||message.channel!=='tsa-group-popup'||message.action!=='remove-student-from-group-result')return;
        if(!message.result||!message.result.ok){window.alert(message.result&&message.result.message?message.result.message:'학생을 빼지 못했어.');return;}
        try{
          var target=MOCK_GROUP_CLASSES.find(function(item){return item.id===message.groupId});
          if(target)target.studentIds=target.studentIds.filter(function(id){return id!==message.studentId});
          window.openGroupManagementBrowserPopup(${rowIndex},window,message.groupId);
        }catch(error){window.location.reload();}
      });
      function openGroupEdit(id){
        window.openGroupEditBrowserPopup(id,${rowIndex},window);
      }
      function deleteGroup(id,count){
        var message=count
          ? '이 반을 삭제할까?\\n\\n배정된 학생 '+count+'명은 없어지지 않고 「반 없음」으로 돌아가. 1단계에서 다른 반에 넣어주면 돼.'
          : '이 반을 삭제할까?\\n\\n배정된 학생이 없어서 바로 지워져.';
        if(!window.confirm(message))return;
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'delete-group',groupId:id},'*');
        window.close();
      }
      function createGroupInOpener(){
        window.openGroupCreateBrowserPopup(${curriculumJsLiteral(row.curriculum)},'${row.classType}',${row.levelGroup},window,undefined,${row.sequence ?? 'undefined'});
      }
      if(selectedGroupId!=null) renderAssignSection();
    <\/script>
    </body></html>`);
  popup.document.close();
  popup.focus();
}

// 그룹 상세에서 학생 한 명을 이 반에서 뺀다. 학생 자체는 지우지 않고 배정 대기로 되돌린다.
function removeStudentFromGroupFromBrowserPopup(studentId, groupId) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(groupId));
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  if (!group || !student) return { ok: false, message: '그룹 또는 학생 정보를 찾을 수 없어.' };
  if (!group.studentIds.includes(student.id)) return { ok: false, message: '이 반에 배정된 학생이 아니야.' };
  group.studentIds = group.studentIds.filter(id => id !== student.id);
  if (Array.isArray(group.manualLockIds)) group.manualLockIds = group.manualLockIds.filter(id => id !== student.id);
  // 그룹에서 빠지면 그 교시가 비므로 1:1 수업을 다시 배치해 준다.
  const replanned = replanStudentOneToOneAfterGroupChange(student);
  renderCsGroupPanel();
  const name = student.nick || student.name;
  return replanned.ok
    ? { ok: true, message: `${name} 학생을 ${getGroupDisplayName(group)}에서 뺐어. 배정 대기로 돌아갔어.` }
    : { ok: true, message: `${name} 학생을 뺐어. 다만 1:1 수업 재배치는 확인이 필요해: ${replanned.message}` };
}

// 반 삭제. 학생 기록은 건드리지 않는다 — 반이 없어지면 그 학생은 「반 없음」으로 돌아간다.
function deleteGroupFromBrowserPopup(groupId) {
  const index = MOCK_GROUP_CLASSES.findIndex(item => item.id === Number(groupId));
  if (index < 0) return { ok: false, message: '반을 찾을 수 없어.' };
  const group = MOCK_GROUP_CLASSES[index];
  const name = getGroupDisplayName(group);
  const count = group.studentIds.length;
  MOCK_GROUP_CLASSES.splice(index, 1);
  renderCsGroupPanel();
  return { ok: true, message: `${name} 반을 삭제했어.${count ? ` 학생 ${count}명은 1단계에서 다시 넣어줘.` : ''}` };
}

function assignGroupStudentsFromBrowserPopup(groupId, studentIds) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!group) return { ok: false, message: '그룹을 찾을 수 없어.' };
  const selectedIds = [...new Set((studentIds || []).map(Number).filter(Number.isFinite))];
  const capacity = getGroupCapacityFor(group);
  if (selectedIds.length > capacity) return { ok: false, message: `정원 ${capacity}명까지만 선택할 수 있어.` };
  const levels = getGroupLevelSet(group);
  const groupSubjectId = getGroupSubjectId(group);
  const validIds = selectedIds.filter(id => {
    const student = MOCK_STUDENTS.find(item => item.id === id);
    const level = student ? getLevelGroupForStudent(student) : null;
    const busyPeriods = student ? getStudentBusyPeriods(student, group.id) : new Set();
    const hasTimeConflict = Array.isArray(group.periods) && group.periods.some(p => busyPeriods.has(Number(p)));
    return student &&
      level != null &&
      levels.includes(level) &&
      !hasTimeConflict &&
      studentCanTakeGroupSubject(student, groupSubjectId, group.classType);
  });
  if (validIds.length !== selectedIds.length) {
    return { ok: false, message: '과목·레벨·수업 형태가 맞지 않거나 다른 확정 수업과 시간이 겹치는 학생이 포함되어 있어.' };
  }
  const nationalityViolation = getGroupAssignmentNationalityViolation(
    { ...group, studentIds: [] },
    validIds
  );
  if (nationalityViolation) {
    return {
      ok: false,
      message: `${nationalityViolation.nationality} 학생은 한 그룹에 최대 ${nationalityViolation.cap}명까지만 배정할 수 있어.`
    };
  }
  const previousIds = [...group.studentIds];
  const previousSchedules = new Map(validIds.map(id => {
    const student = MOCK_STUDENTS.find(item => item.id === id);
    return [id, (student?.oneToOneSchedule || []).map(item => ({ ...item }))];
  }));
  group.studentIds.splice(0, group.studentIds.length, ...validIds);
  for (const id of validIds) {
    const student = MOCK_STUDENTS.find(item => item.id === id);
    const replanned = replanStudentOneToOneAfterGroupChange(student);
    if (!replanned.ok) {
      group.studentIds.splice(0, group.studentIds.length, ...previousIds);
      previousSchedules.forEach((schedule, studentId) => {
        const target = MOCK_STUDENTS.find(item => item.id === studentId);
        if (target) target.oneToOneSchedule = schedule;
      });
      return { ok: false, message: `${student?.nick || student?.name || '학생'}의 1:1 수업을 다시 배치할 수 없어: ${replanned.message}` };
    }
  }
  renderCsGroupPanel();
  return { ok: true, message: `${validIds.length}명을 배정했어.` };
}

// 학생 1명을 특정 그룹에 추가 배정한다(규모 단위 배정 팝업에서 사용).
// 그룹은 과목 단위 개별 클래스: 학생 코스에 이 그룹의 과목이 포함되어 있어야 배정 가능.
function assignStudentToGroupFromBrowserPopup(studentId, groupId) {
  const student = MOCK_STUDENTS.find(item => item.id === studentId);
  const group = MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!student || !group) return { ok: false, message: '학생 또는 그룹 정보를 찾을 수 없어.' };
  if (group.studentIds.includes(studentId)) return { ok: false, message: '이미 배정된 학생이야.' };
  const hardCap = getGroupCapacityFor(group);
  const baseCap = getGroupBaseCapacityFor(group);
  if (group.studentIds.length >= hardCap) return { ok: false, message: `초과 허용 상한(${hardCap}명)까지 가득 찼어.` };
  const level = getLevelGroupForStudent(student);
  if (level == null || !getGroupLevelSet(group).includes(level)) {
    return { ok: false, message: '이 그룹의 레벨 범위 대상이 아니야.' };
  }
  const groupSubjectId = getGroupSubjectId(group);
  if (!studentCanTakeGroupSubject(student, groupSubjectId, group.classType)) {
    return { ok: false, message: '학생 과정에 이 과목·수업 형태가 없어 배정할 수 없어.' };
  }
  const duplicated = MOCK_GROUP_CLASSES.some(item =>
    item.id !== group.id && item.status === 'active' &&
    item.classType === group.classType && getGroupSubjectId(item) === groupSubjectId &&
    Array.isArray(item.periods) && Array.isArray(group.periods) && item.periods.some(period => group.periods.includes(period)) &&
    item.studentIds.includes(studentId)
  );
  if (duplicated) return { ok: false, message: `이미 같은 과목의 다른 ${getGroupSizeShortLabel(group.classType)}에 배정된 학생이야.` };
  const busyPeriods = getStudentBusyPeriods(student, group.id);
  const hasTimeConflict = Array.isArray(group.periods) && group.periods.some(p => busyPeriods.has(Number(p)));
  if (hasTimeConflict) return { ok: false, message: '학생의 다른 확정 수업과 시간이 겹쳐서 배정할 수 없어.' };
  const nationalityViolation = getGroupAssignmentNationalityViolation(group, [studentId]);
  if (nationalityViolation) {
    return { ok: false, message: `${nationalityViolation.nationality} 학생은 한 그룹에 최대 ${nationalityViolation.cap}명까지만 배정할 수 있어.` };
  }
  group.studentIds.push(studentId);
  const replanned = replanStudentOneToOneAfterGroupChange(student);
  if (!replanned.ok) {
    group.studentIds = group.studentIds.filter(id => id !== studentId);
    return { ok: false, message: `그룹 배정 후 1:1 수업을 다시 배치할 수 없어: ${replanned.message}` };
  }
  renderCsGroupPanel();
  const over = group.studentIds.length > baseCap;
  return { ok: true, message: `${student.nick || student.name} 학생을 배정했어.${over ? ` (기준 정원 초과 · ${getGroupLiveRatioLabel(group)} 운영)` : ''}` };
}

// 여러 수업의 그룹을 먼저 고른 뒤 한 번에 확정한다. 하나라도 실패하면 전체 선택을 되돌린다.
function assignStudentGroupSelectionsFromBrowserPopup(studentId, assignments) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  const selections = Array.isArray(assignments) ? assignments : [];
  if (!student) return { ok: false, message: '학생 정보를 찾을 수 없어.' };
  if (!selections.length) return { ok: false, message: '배정할 그룹을 선택해.' };

  const groupSnapshots = MOCK_GROUP_CLASSES.map(group => ({ group, studentIds: [...group.studentIds] }));
  const scheduleSnapshot = (student.oneToOneSchedule || []).map(item => ({ ...item }));
  for (const selection of selections) {
    const result = assignStudentToGroupFromBrowserPopup(student.id, Number(selection.groupId));
    if (!result.ok) {
      groupSnapshots.forEach(snapshot => {
        snapshot.group.studentIds.splice(0, snapshot.group.studentIds.length, ...snapshot.studentIds);
      });
      student.oneToOneSchedule = scheduleSnapshot;
      renderCsGroupPanel();
      return { ok: false, message: `선택한 수업을 함께 배정하지 못했어. ${result.message}` };
    }
  }
  renderCsGroupPanel();
  return { ok: true, message: `${student.nick || student.name} 학생의 ${selections.length}개 수업을 배정했어.` };
}

// 배정 완료 학생을 같은 과정 템플릿 조건의 다른 운영 그룹으로 안전하게 이동한다.
function changeStudentAssignedGroup(studentId, fromGroupId, toGroupId) {
  const student = MOCK_STUDENTS.find(item => item.id === Number(studentId));
  const fromGroup = MOCK_GROUP_CLASSES.find(item => item.id === Number(fromGroupId));
  const toGroup = MOCK_GROUP_CLASSES.find(item => item.id === Number(toGroupId));
  if (!student || !fromGroup || !toGroup) return { ok: false, message: '학생 또는 그룹 정보를 찾을 수 없어.' };
  if (!fromGroup.studentIds.includes(student.id)) return { ok: false, message: '현재 그룹 배정 정보를 다시 확인해줘.' };
  if (fromGroup.id === toGroup.id) return { ok: false, message: '현재 배정된 그룹과 같은 그룹이야.' };
  const previousSchedule = (student.oneToOneSchedule || []).map(item => ({ ...item }));
  fromGroup.studentIds = fromGroup.studentIds.filter(id => id !== student.id);
  const result = assignStudentToGroupFromBrowserPopup(student.id, toGroup.id);
  if (!result.ok) {
    if (!fromGroup.studentIds.includes(student.id)) fromGroup.studentIds.push(student.id);
    student.oneToOneSchedule = previousSchedule;
    return result;
  }
  renderCsGroupPanel();
  return { ok: true, message: `${student.nick || student.name} 학생의 그룹 배정을 변경했어.` };
}

// 여러 학생을 한 그룹에 순차 추가 배정한다(기존 배정 인원은 유지, 실패한 학생만 건너뜀).
function assignStudentsToGroupFromBrowserPopup(studentIds, groupId) {
  const ids = [...new Set((studentIds || []).map(Number).filter(Number.isFinite))];
  if (!ids.length) return { ok: false, message: '배정할 학생을 선택해.' };
  const results = ids.map(id => assignStudentToGroupFromBrowserPopup(id, groupId));
  const okCount = results.filter(r => r.ok).length;
  const failMessages = results.filter(r => !r.ok).map(r => r.message);
  if (!okCount) return { ok: false, message: failMessages[0] || '배정할 수 없어.' };
  return { ok: true, message: `${okCount}명 배정했어.${failMessages.length ? ` (${failMessages.length}명 실패 · ${failMessages[0]})` : ''}` };
}

function openGroupAssignmentBrowserPopup(groupId, detailRowIndex, popupTarget) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!group) return;
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('assignment');
    popupUrl.searchParams.set('groupId', groupId);
    if (detailRowIndex != null) popupUrl.searchParams.set('row', detailRowIndex);
    const openedPopup = window.open(popupUrl.href, `tsa-group-assignment-${groupId}`, 'popup=yes,width=820,height=780,resizable=yes,scrollbars=yes');
    if (!openedPopup) {
      showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
      return;
    }
    return;
  }
  const popup = popupTarget;
  try { popup.stop(); } catch (error) {}
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  const capacity = getGroupCapacityFor(group);
  const selectedIds = new Set(group.studentIds);
  // 후보: 코스 무관, 레벨이 범위 안이고 학생 코스에 이 그룹의 과목이 포함된 학생
  const groupSubjectId = getGroupSubjectId(group);
  const candidates = MOCK_STUDENTS.filter(student => {
    const level = getLevelGroupForStudent(student);
    const assignedElsewhere = MOCK_GROUP_CLASSES.some(item =>
      item.id !== group.id &&
      item.status === 'active' &&
      item.classType === group.classType &&
      getGroupSubjectId(item) === groupSubjectId &&
      item.studentIds.includes(student.id)
    );
    const busyPeriods = getStudentBusyPeriods(student, group.id);
    const hasTimeConflict = Array.isArray(group.periods) && group.periods.some(p => busyPeriods.has(Number(p)));
    return level != null &&
      getGroupLevelSet(group).includes(level) &&
      studentCanTakeGroupSubject(student, groupSubjectId, group.classType) &&
      (!assignedElsewhere || selectedIds.has(student.id)) &&
      (!hasTimeConflict || selectedIds.has(student.id)) &&
      ['current', 'waiting', 'extended'].includes(student.status);
  });
  const candidateCards = candidates.map(student => {
    const checked = selectedIds.has(student.id);
    return `<label class="student-card">
      <input type="checkbox" value="${student.id}" ${checked ? 'checked' : ''} onchange="updateCount()">
      <div><b>${esc(student.nick || student.name)} <span>${esc(student.name || '')}</span></b>
        <p>${esc(student.course || '-')} · ${esc(student.level || '-')} · ${esc(student.nationality || '-')} · ${student.gender || '-'}성 · ${student.age || '-'}세</p>
        <small>📅 ${esc(student.startDate || '-')} ~ ${esc(student.endDate || '-')}</small>
      </div>
    </label>`;
  }).join('');
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>학생 배정</title>
    <style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:18px 22px;background:#fff;border-bottom:1px solid #E5E7EB}
      h1{font-size:18px;margin:0}.meta{font-size:11px;color:#6B7280;margin-top:4px}.back{border:0;background:none;font-size:22px;cursor:pointer}
      main{padding:18px 22px 86px}.notice{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:10px;background:#EEF2FF;color:#4338CA;font-size:11px;font-weight:700}
      .students{display:flex;flex-direction:column;gap:8px;margin-top:12px}.student-card{display:flex;align-items:center;gap:10px;padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#fff;cursor:pointer}
      .student-card:has(input:checked){border-color:#6366F1;background:#F5F3FF}.student-card input{width:17px;height:17px;accent-color:#5E5CE6}.student-card b{font-size:12px}.student-card b span{font-weight:400;color:#9CA3AF}
      .student-card p{margin:4px 0 0;font-size:10.5px;color:#6B7280}.student-card small{display:block;margin-top:4px;color:#9CA3AF}
      footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;background:#fff;border-top:1px solid #E5E7EB}
      button{padding:9px 13px;border:1px solid #D1D5DB;border-radius:8px;background:#fff;cursor:pointer}.primary{background:#5E5CE6;color:#fff;border-color:#5E5CE6}
    </style></head><body>
    <header><div style="flex:1"><h1>${esc(getGroupDisplayName(group))} 학생 관리</h1><div class="meta">정원 ${capacity}명 · 동일 국적 최대 ${getEffectiveNationalityCap(group)}명</div></div><button class="back" onclick="goBack()">×</button></header>
    <main><div class="notice"><span>배정할 학생을 선택해.</span><span id="selectedCount">${selectedIds.size}/${capacity}명 선택</span></div>
      <div class="students">${candidateCards || '<div style="padding:30px;text-align:center;color:#9CA3AF">배정 가능한 학생이 없어.</div>'}</div>
    </main>
    <footer><button onclick="goBack()">취소</button><button class="primary" onclick="save()">선택 학생 배정</button></footer>
    <script>
      function getIds(){return Array.from(document.querySelectorAll('input[type=checkbox]:checked')).map(function(input){return Number(input.value)});}
      function updateCount(){document.getElementById('selectedCount').textContent=getIds().length+'/${capacity}명 선택';}
      function goBack(){window.close();}
      function save(){
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'assign-students',groupId:${group.id},studentIds:getIds()},'*');
        window.close();
      }
    <\/script></body></html>`);
  popup.document.close();
  popup.focus();
}

function saveGroupFromBrowserPopup(groupId, payload) {
  const isCreate = groupId == null;
  const group = isCreate ? null : MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!isCreate && !group) return { ok: false, message: '그룹을 찾을 수 없어.' };
  const levelGroups = Array.isArray(payload?.levelGroups) ? payload.levelGroups.map(Number).filter(Number.isFinite).sort((a, b) => a - b) : [];
  const classType = payload?.classType;
  const startDate = payload?.startDate;
  const weeklyFrequency = Math.max(1, Number(payload?.weeklyFrequency) || 5);
  const nationalityCap = payload?.nationalityCap === '' || payload?.nationalityCap == null ? null : Math.max(1, Number(payload.nationalityCap) || 1);
  // 비워두면 null 로 저장한다 — 「기본값을 쓴다」와 「1명으로 정했다」는 다른 뜻이라 0을 흘리면 안 된다.
  const capacityOverride = payload?.capacity === '' || payload?.capacity == null ? null : Math.max(1, Number(payload.capacity) || 1);
  const periods = Array.isArray(payload?.periods) ? payload.periods.map(Number).filter(Number.isFinite).sort((a, b) => a - b) : [];
  const dayOfWeek = Array.isArray(payload?.dayOfWeek) ? payload.dayOfWeek.filter(day => LESSON_DAYS.includes(day)) : [];
  const endDate = payload?.endDate || null;
  const teacherId = payload?.teacherId === '' || payload?.teacherId == null ? null : Number(payload.teacherId);
  const roomId = payload?.roomId === '' || payload?.roomId == null ? null : Number(payload.roomId);
  // 기획 결정(2026-07-30): 그룹은 과목 단위 개별 클래스. 과목 1개만 선택한다(다중 선택 금지).
  const rawCurriculum = Array.isArray(payload?.curriculum) && payload.curriculum.length
    ? [payload.curriculum[0]]
    : payload?.subjectId ? [{ id: payload.subjectId, hours: 1 }] : [];
  const curriculum = rawCurriculum
    .map(ref => ({ id: ref.id, hours: Math.max(1, Number(ref.hours) || 1) }))
    .filter(ref => MOCK_MASTER_SUBJECTS.some(subject => subject.id === ref.id));
  if (!curriculum.length) return { ok: false, message: '과목을 선택해.' };
  const levelSelectionError = getGroupLevelSelectionError(levelGroups, isCreate);
  if (levelSelectionError) return { ok: false, message: levelSelectionError };
  if (!classType || !startDate) return { ok: false, message: '수업 형태와 운영 시작일을 확인해.' };
  if (!dayOfWeek.length) return { ok: false, message: '요일을 1개 이상 선택해.' };
  // 교시가 비어 있으면 아직 시간이 안 잡힌 그룹이다(그룹 편성에서 반만 먼저 만든 상태).
  // 교시·담당 강사·강의실은 스케줄 배정 탭에서 한꺼번에 정하므로, 여기서는 셋 다 비워둔 채로 저장한다.
  const unscheduled = !periods.length;
  // 이 팝업은 더 이상 교시·강사·강의실을 고르지 않는다(강사 배정 팝업이 맡는다). 그래서 기존 반을
  // 고칠 때는 이미 잡혀 있는 배정을 그대로 들고 갈 뿐이고, 여기서 다시 검증하지 않는다.
  //
  // 검증을 남겨두면 「지금 이 반이 쓰고 있는 강의실」이 후보에서 빠지는 경우(예: 같은 방·같은 교시에
  // 1:1 주간 세션이 걸려 있는 반) 과목이나 정원만 고치려 해도 저장이 막히는데,
  // 그 자리에서 배정을 바꿀 수단이 이 팝업에 이제 없다 — 빠져나갈 길이 없는 막다른 길이 된다.
  const validateSchedule = isCreate && !unscheduled;
  const capacity = getGroupClassCapacity(classType);
  const availableTeachers = validateSchedule ? getGroupTeacherCandidates(classType, dayOfWeek, periods, null) : [];
  const availableRooms = validateSchedule ? getGroupRoomCandidates(classType, dayOfWeek, periods, capacity, null) : [];
  if (validateSchedule && teacherId != null && !availableTeachers.some(teacher => teacher.id === teacherId)) {
    return { ok: false, message: '선택한 강사는 해당 요일·교시에 배정할 수 없어. 다시 검색해줘.' };
  }
  if (validateSchedule && roomId != null && !availableRooms.some(room => room.id === roomId)) {
    return { ok: false, message: '선택한 강의실은 해당 요일·교시에 배정할 수 없어. 다시 검색해줘.' };
  }
  if (!isCreate && group.studentIds.length > capacity) return { ok: false, message: `현재 배정 인원 ${group.studentIds.length}명이 변경할 상한 ${capacity}명을 초과해.` };
  const subjectId = curriculum[0].id;
  if (!isCreate) {
    const incompatibleStudents = (group.studentIds || []).map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(student => {
      if (!student) return true;
      const level = getLevelGroupForStudent(student);
      const busyPeriods = getStudentBusyPeriods(student, group.id);
      const hasTimeConflict = periods.some(p => busyPeriods.has(Number(p)));
      return level == null || !levelGroups.includes(level) || !studentCanTakeGroupSubject(student, subjectId, classType) || hasTimeConflict;
    });
    if (incompatibleStudents.length) {
      const names = incompatibleStudents.map(student => student?.nick || student?.name || '알 수 없는 학생').join(', ');
      return { ok: false, message: `과정 템플릿의 과목·수업 유형·레벨과 맞지 않거나 변경할 시간과 겹치는 기존 학생이 있어 수정할 수 없어: ${names}` };
    }
  }
  const subjectNames = [...curriculum]
    .sort((a, b) => (MOCK_MASTER_SUBJECTS.find(s => s.id === a.id)?.order ?? 999) - (MOCK_MASTER_SUBJECTS.find(s => s.id === b.id)?.order ?? 999))
    .map(ref => MOCK_MASTER_SUBJECTS.find(s => s.id === ref.id)?.name || ref.id);
  const name = `${subjectNames.join('·')} · ${levelGroups.map(getLevelGroupName).join(', ')} · ${getGroupSizeShortLabel(classType)}`;
  const groupData = {
    name, groupMode: 'subject', course: payload?.course || group?.course || '', courses: [], status: 'active',
    subjectId, subjectIds: curriculum.map(ref => ref.id), curriculum,
    levelGroup: levelGroups[0], levelGroups, classType, startDate, endDate, weeklyFrequency, nationalityCap,
    capacity: capacityOverride, periods, dayOfWeek,
    teacherId: unscheduled ? null : teacherId, roomId: unscheduled ? null : roomId
  };
  let seedStudent = null;
  let createdGroupId = null;
  if (isCreate) {
    const seedStudentId = payload?.seedStudentId != null ? Number(payload.seedStudentId) : null;
    const candidate = seedStudentId != null ? MOCK_STUDENTS.find(item => item.id === seedStudentId) : null;
    const candidateLevel = candidate ? getLevelGroupForStudent(candidate) : null;
    const seedBusyPeriods = candidate ? getStudentBusyPeriods(candidate) : new Set();
    const seedValid = candidate &&
      candidateLevel != null && levelGroups.includes(candidateLevel) &&
      studentCanTakeGroupSubject(candidate, subjectId, classType) &&
      !periods.some(p => seedBusyPeriods.has(Number(p)));
    if (payload?.assignSeedStudent === true && seedValid) seedStudent = candidate;
    createdGroupId = _csGroupNextId++;
    MOCK_GROUP_CLASSES.push({
      id: createdGroupId,
      ...groupData,
      studentIds: seedStudent ? [seedStudent.id] : [],
      progressRate: 0,
      createdAt: new Date().toISOString()
    });
  } else {
    Object.assign(group, groupData);
    delete group.levelGroupMin;
    delete group.levelGroupMax;
  }
  renderCsGroupPanel();
  const createMessage = seedStudent
    ? `그룹을 만들고 ${seedStudent.nick || seedStudent.name} 학생을 배정했어.`
    : '그룹을 만들었어.';
  return { ok: true, message: isCreate ? createMessage : '그룹 정보를 수정했어.', createdGroupId };
}

function openGroupEditBrowserPopup(groupId, detailRowIndex, popupTarget, createDefaults) {
  const isCreate = groupId == null;
  const group = isCreate ? {
    id: null,
    groupMode: 'subject',
    subjectId: createDefaults?.subjectId || '',
    classType: createDefaults?.type || '1:4',
    levelGroup: Number(createDefaults?.level) || 1,
    levelGroups: Array.isArray(createDefaults?.levels) && createDefaults.levels.length
      ? createDefaults.levels.map(Number)
      : [Number(createDefaults?.level) || 1],
    startDate: '2026-06-22',
    weeklyFrequency: 5,
    nationalityCap: null,
    studentIds: []
  } : MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!group) return;
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('edit');
    popupUrl.searchParams.set('groupId', groupId);
    if (detailRowIndex != null) popupUrl.searchParams.set('row', detailRowIndex);
    const openedPopup = window.open(popupUrl.href, `tsa-group-edit-${groupId}`, 'popup=yes,width=820,height=820,resizable=yes,scrollbars=yes');
    if (!openedPopup) {
      showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
      return;
    }
    return;
  }
  const popup = popupTarget;
  try { popup.stop(); } catch (error) {}
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  const selectedLevels = getGroupLevelSet(group);
  const prefillCurriculum = isCreate
    ? (Array.isArray(createDefaults?.curriculum) && createDefaults.curriculum.length
      ? createDefaults.curriculum.slice(0, 1)
      : createDefaults?.subjectId
      ? [{ id: createDefaults.subjectId, hours: 1 }]
      : [])
    : getGroupCurriculumRefs(group);
  const subjectData = MOCK_MASTER_SUBJECTS.filter(subject => subject.visible !== false).map(subject => ({
    id: subject.id,
    name: subject.name,
    types: ['1:4', '1:8'].filter(type => MOCK_COURSES.some(course => (course.subjectsByType?.[type] || []).some(ref => ref.id === subject.id)))
  }));
  const classTypes = MOCK_MASTER_CLASS_TYPES.filter(type => type.classMode === 'group' && type.visible !== false).sort((a, b) => a.maxStudents - b.maxStudents);
  // 사전 지정된 과목이 없으면 유형·과목을 관리자가 직접 고르게 한다.
  // 학생 배정 팝업의 "+ 새 그룹 만들기"도 과목을 미리 매칭하지 않고 이 방식으로 들어온다.
  const useTemplatePicker = isCreate && prefillCurriculum.length === 0;
  const groupClassTypeCodes = new Set(classTypes.map(type => type.code));
  // 과정 선택 없이 바로 고를 수 있도록, 전체 과정의 시간표 템플릿에서 그룹 수업(1:4, 1:8) 유형·과목 조합을
  // 전부 모아 중복 없이 한 목록으로 펼쳐 보여준다. 교시는 과정마다 달라 특정 값으로 잠글 수 없으므로 직접 선택하게 둔다.
  const templateRows = [];
  if (useTemplatePicker) {
    const seen = new Set();
    MOCK_COURSES.filter(course => course.active !== false).forEach(course => {
      getCourseTimetableTemplate(course).forEach(item => {
        if (!groupClassTypeCodes.has(item.classType)) return;
        const key = item.classType + '|' + item.subjectId;
        if (seen.has(key)) return;
        seen.add(key);
        const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === item.subjectId);
        templateRows.push({ classType: item.classType, subjectId: item.subjectId, subjectName: subject?.name || item.subjectId });
      });
    });
    const typeOrder = Object.fromEntries(classTypes.map((type, idx) => [type.code, idx]));
    templateRows.sort((a, b) => (typeOrder[a.classType] - typeOrder[b.classType])
      || ((MOCK_MASTER_SUBJECTS.find(s => s.id === a.subjectId)?.order ?? 999) - (MOCK_MASTER_SUBJECTS.find(s => s.id === b.subjectId)?.order ?? 999)));
  }
  // 학생 요구사항("+ 새 그룹 만들기")에서 들어온 경우, 과정 템플릿에서 몇 번째 항목인지(sequence)를
  // 교시 선택의 기본값으로만 미리 채워준다 — 더 이상 실제 교시를 고정하지 않으며 관리자가 자유롭게 바꿀 수 있다.
  const prefillSequence = isCreate && !useTemplatePicker && createDefaults?.sequence != null ? Number(createDefaults.sequence) : null;
  // 그룹 만들기는 '누가 어느 반인지'까지만 정한다. 교시·담당 강사·강의실은 스케줄 배정 탭이 맡는다.
  const lockPeriodToSequence = !isCreate && prefillSequence != null;
  // 교시 · 담당 강사 · 강의실은 이제 「그룹 수업 목록」의 강사 배정 팝업에서만 정한다.
  // 두 군데서 같은 값을 정하면 어느 쪽이 최신인지 알 수 없어서, 만들 때뿐 아니라 고칠 때도 감춘다.
  // (요소는 남겨둔다 — 숨은 입력이 지금 값을 그대로 들고 있다가 저장 때 되돌려준다.)
  const hideSchedule = ' style="display:none"';
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  const selectedPeriods = isCreate
    ? []
    : (Array.isArray(group.periods) ? group.periods.map(Number).filter(Number.isFinite) : []);
  // 요일은 항상 월~금 고정 운영으로 둔다(변경 불가).
  const selectedDays = [...LESSON_DAYS];
  const currentTeacherId = group.teacherId != null ? Number(group.teacherId) : null;
  const currentRoomId = group.roomId != null ? Number(group.roomId) : null;
  const seedStudentId = isCreate && createDefaults?.seedStudentId != null ? Number(createDefaults.seedStudentId) : null;
  // 배정은 다른 팝업에서 하지만, 지금 어떻게 잡혀 있는지는 여기서도 보여야 한다.
  const scheduleSummary = (() => {
    if (isCreate || !selectedPeriods.length) return '시간 미정';
    const teacherName = MOCK_TEACHERS.find(item => item.id === currentTeacherId)?.nick
      || MOCK_TEACHERS.find(item => item.id === currentTeacherId)?.name || '강사 미정';
    const roomNo = MOCK_CLASS_ROOMS.find(item => item.id === currentRoomId)?.roomNo || '강의실 미정';
    return `${selectedPeriods.join('·')}교시 · ${esc(teacherName)} · ${esc(roomNo)}`;
  })();
  const seedStudent = seedStudentId != null ? MOCK_STUDENTS.find(item => item.id === seedStudentId) : null;
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>${isCreate ? '그룹 만들기' : '그룹 설정'}</title>
    <style>
      *{box-sizing:border-box}html,body{height:100%;overflow:hidden}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:18px 22px;background:#fff;border-bottom:1px solid #E5E7EB}.back{border:0;background:none;font-size:22px;cursor:pointer}h1{font-size:18px;margin:0}.meta{font-size:11px;color:#6B7280;margin-top:4px}
      main{height:calc(100vh - 137px);overflow-y:auto;overscroll-behavior:contain;padding:18px 22px 28px}.section{padding:15px;border:1px solid #E5E7EB;border-radius:12px;background:#fff;margin-bottom:11px}.section h2{font-size:12px;margin:0 0 10px}label.title{display:block;font-size:11px;font-weight:700;margin:0 0 6px}
      select,input{width:100%;height:38px;padding:0 10px;border:1px solid #D1D5DB;border-radius:8px;background:#fff}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.choices{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
      .choice{display:flex;align-items:center;gap:7px;padding:9px;border:1px solid #E5E7EB;border-radius:8px;font-size:11px}.choice:has(input:checked){border-color:#6366F1;background:#F5F3FF}.choice input{width:15px;height:15px;accent-color:#5E5CE6}.choice:has(input:disabled){opacity:.42;border-style:dashed;background:#F8FAFC}
      .periods{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}.period-btn{padding:8px 0;border:1px solid #D1D5DB;border-radius:8px;background:#fff;font-size:11px;cursor:pointer;text-align:center}.period-btn.selected{border-color:#5E5CE6;background:#5E5CE6;color:#fff;font-weight:700}
      .preview{padding:11px;border-radius:9px;background:#F5F3FF;color:#4F46E5;font-size:11px;line-height:1.6}.hint{font-size:9.5px;color:#6B7280;margin-top:6px}
      .entity-toggle{position:relative;width:100%;height:42px;padding:0 38px 0 12px;border:1px solid #D1D5DB;border-radius:8px;background:#fff;text-align:left;cursor:pointer;font-size:12px;color:#111827}.entity-toggle.placeholder{color:#9CA3AF}.entity-toggle:after{content:'▼';position:absolute;right:13px;top:50%;transform:translateY(-50%);font-size:9px;color:#6B7280}.entity-toggle[aria-expanded="true"]:after{content:'▲'}
      .entity-panel{margin-top:8px;border:1px solid #C7D2FE;border-radius:9px;background:#fff;padding:10px}
      .entity-search{width:100%;height:32px;padding:0 8px;border:1px solid #D1D5DB;border-radius:7px;margin-bottom:6px;font-size:11.5px}
      .entity-filter-row{display:grid;grid-template-columns:minmax(0,1fr) 110px;gap:6px}.entity-filter-row select{height:32px;font-size:10.5px}
      .entity-options{max-height:250px;overflow-y:auto;border-top:1px solid #E5E7EB}
      .entity-option{padding:11px 9px;border-bottom:1px solid #E5E7EB;font-size:11.5px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:10px}.entity-option:last-child{border-bottom:0}.entity-option:hover{background:#F8FAFC}.entity-option.selected{background:#EEF2FF;color:#4338CA;font-weight:700}.entity-main{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1}.entity-main small{font-size:9.5px;color:#6B7280;font-weight:400}.entity-status{flex:0 0 auto;color:#047857;font-size:10px;font-weight:800}.entity-avatar{width:36px;height:36px;flex:0 0 36px;border-radius:50%;object-fit:cover;background:#F3F4F6}.teacher-capabilities{display:flex;flex-direction:column;gap:3px;margin-top:3px}.capability-line{display:flex;align-items:flex-start;gap:4px;flex-wrap:wrap}.capability-title{min-width:48px;padding-top:2px;color:#6B7280;font-size:8.5px;font-weight:700}.capability-tag{padding:2px 6px;border-radius:999px;font-size:8.5px;font-weight:700;line-height:1.2}.capability-tag.course{background:#D1FAE5;color:#047857}.capability-tag.subject{background:#E0F2FE;color:#0369A1}.capability-tag.level{background:#F3E8FF;color:#7E22CE}.capability-empty{padding-top:2px;color:#9CA3AF;font-size:8.5px}.resource-grid{display:flex;flex-direction:column;gap:10px}.resource-box{min-width:0;padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC}.resource-box.open{border-color:#6366F1;background:#F5F3FF;box-shadow:0 0 0 2px rgba(99,102,241,.08)}.resource-label{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px;font-size:11px;font-weight:800}.selected-resource{color:#4F46E5;font-size:9.5px;font-weight:700}
      .entity-empty{padding:8px 9px;font-size:11px;color:#9CA3AF}
      footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;background:#fff;border-top:1px solid #E5E7EB}button{padding:9px 13px;border:1px solid #D1D5DB;border-radius:8px;background:#fff;cursor:pointer}.primary{background:#5E5CE6;color:#fff;border-color:#5E5CE6}@media(max-width:700px){.resource-grid{grid-template-columns:1fr}}
    </style></head><body>
    <header><div style="flex:1"><h1>${isCreate ? '그룹 만들기' : '그룹 설정'}</h1><div class="meta">${isCreate ? (useTemplatePicker ? '유형·과목과 레벨만 고르면 돼. 시간은 스케줄 배정에서 정해.' : (seedStudent ? `${esc(seedStudent.nick || seedStudent.name)} 학생을 위한 그룹을 만들어. 레벨을 확인해줘.` : '레벨·수업 형태를 확인해줘.')) : esc(getGroupDisplayName(group))}</div></div><button class="back" onclick="goBack()">×</button></header>
    <main>
      ${seedStudent ? `<div class="section" style="background:#F5F3FF;border-color:#C7D2FE;color:#4338CA;font-size:11px;font-weight:700">그룹만 생성돼. 생성 후 ${esc(seedStudent.nick || seedStudent.name)} 수업 배정 화면으로 자동 복귀하며, 학생 배정은 그 화면에서 직접 확정해.</div>` : ''}
      <div class="section" style="background:#EEF2FF;border-color:#C7D2FE;color:#4338CA;font-size:11px;line-height:1.7">${isCreate
        ? '<b>여기서는 반만 만들어.</b><br>교시 · 담당 강사 · 강의실은 <b>주간 수업 배정</b>의 그룹 수업 목록에서 「강사 배정」으로 정해. 만든 반은 그때까지 <b>시간 미정</b>으로 남아 있어.'
        : `<b>여기서 정하는 건 「이 반이 무엇인가」야.</b><br>교시 · 담당 강사 · 강의실은 그룹 수업 목록의 「강사 배정」에서 바꿔. 지금은 <b>${scheduleSummary}</b>.`}</div>
      ${useTemplatePicker ? `
      <section class="section"><h2>유형 · 과목</h2><select id="templateRow" onchange="onTemplateRowChange()"><option value="">선택해</option>${templateRows.map((r, i) => `<option value="${i}">${esc(r.classType)} · ${esc(r.subjectName)}</option>`).join('')}</select><div class="hint" id="templateHint">전체 과정의 그룹 수업(소그룹 1:4, 중그룹 1:8) 항목을 모아 보여줘.</div><input type="hidden" id="classType" value=""></section>
      ` : `
      <section class="section"><h2>과목</h2><div id="subjects" class="choices"></div><div class="hint">그룹은 과목 1개당 개별 클래스로 만들어. 같은 과목이면 코스가 달라도 합반 후보가 될 수 있어.</div></section>
      `}
      <section class="section"><h2>레벨 선택 <span style="font-weight:400;color:#6B7280;font-size:10.5px">— ${isCreate ? '새 반은 하나만' : `최대 ${GROUP_MAX_LEVELS}개, 붙어 있는 레벨끼리만`}</span></h2><div class="choices">${MOCK_MASTER_LEVELS.filter(level => level.visible !== false).sort((a,b)=>a.order-b.order).map(level => `<label class="choice"><input type="checkbox" class="level" value="${level.order}" ${selectedLevels.includes(level.order) ? 'checked' : ''} onchange="onLevelChange()">${esc(level.name)}</label>`).join('')}</div><div class="hint" id="levelHint">교재가 레벨마다 달라 단일 레벨을 권장해. 여러 레벨을 묶는 건 운영 편의를 위한 예외 옵션이야.</div></section>
      ${useTemplatePicker ? `
      <section class="section"><div class="grid"><div><label class="title">정원 (명)</label><input id="capacity" type="number" min="1" value="${group.capacity ?? ''}" placeholder="수업 형태 기본값"><div class="hint">비워두면 수업 형태 기본값을 써. 정원 4명 반에 5명을 받아야 하면 여기에 5를 적어.</div></div><div><label class="title">동일 국적 최대 인원 (명)</label><input id="nationalityCap" type="number" min="1" value="${group.nationalityCap ?? ''}" placeholder="교시 템플릿 선택 후 자동"><div class="hint" id="nationalityCapHint">비워두면 수업 형태별 기본값을 사용해.</div></div></div></section>
      ` : `
      <section class="section"><div class="grid"><div><label class="title">수업 형태</label><select id="classType" onchange="renderSubjects();updateNationalityCapHint()">${classTypes.map(type => `<option value="${type.code}" ${type.code === group.classType ? 'selected' : ''}>${esc(type.code)} ${esc(type.name)}</option>`).join('')}</select></div><div><label class="title">정원 (명)</label><input id="capacity" type="number" min="1" value="${group.capacity ?? ''}" placeholder="${getGroupClassCapacity(group.classType)}명"><div class="hint">비워두면 기본값 ${getGroupClassCapacity(group.classType)}명. 정원을 넘겨 받아야 하면 여기서 올려.</div></div><div><label class="title">동일 국적 최대 인원 (명)</label><input id="nationalityCap" type="number" min="1" value="${group.nationalityCap ?? ''}" placeholder="${getGroupNationalityCap(group.classType)}명"><div class="hint" id="nationalityCapHint">비워두면 기본값 ${getGroupNationalityCap(group.classType)}명을 사용해.</div></div></div></section>
      `}
      <section class="section"${hideSchedule}><h2>요일</h2><div id="days" class="periods" style="grid-template-columns:repeat(5,1fr)"></div><div class="hint" id="daysSelectedHint">선택됨: 요일 미지정</div></section>
      <section class="section"${hideSchedule}><h2>교시 선택</h2><div id="periods" class="periods"></div><div class="hint" id="periodsSelectedHint">선택됨: 교시 미지정</div></section>
      <input type="hidden" id="teacherId" value="${currentTeacherId != null ? currentTeacherId : ''}">
      <input type="hidden" id="roomId" value="${currentRoomId != null ? currentRoomId : ''}">
      <section class="section"${hideSchedule}><h2>강사·강의실 배정</h2><div class="hint" style="margin:-4px 0 10px">선택한 요일과 교시에 실제 배정 가능한 강사와 강의실만 보여줘.</div><div class="resource-grid">
        <div id="teacherResourceBox" class="resource-box"><div class="resource-label"><span>1. 담당 강사 선택</span><span id="teacherSelectedLabel" class="selected-resource">미선택</span></div><button type="button" id="teacherToggle" class="entity-toggle placeholder" aria-expanded="false" onclick="toggleTeacherPanel()">강사 검색하기</button><div id="teacherPanel" class="entity-panel" style="display:none"><div class="entity-filter-row"><input id="teacherSearch" class="entity-search" placeholder="이름 또는 담당 강의실 검색" oninput="filterTeacherPanel()"><select id="teacherGrade" onchange="filterTeacherPanel()"><option value="">등급 전체</option><option value="A">A등급</option><option value="B">B등급</option><option value="C">C등급</option></select></div><div id="teacherOptions" class="entity-options"></div></div></div>
        <div id="roomResourceBox" class="resource-box"><div class="resource-label"><span>2. 강의실 선택</span><span id="roomSelectedLabel" class="selected-resource">미선택</span></div><button type="button" id="roomToggle" class="entity-toggle placeholder" aria-expanded="false" onclick="toggleRoomPanel()">강의실 검색하기</button><div id="roomPanel" class="entity-panel" style="display:none"><input id="roomSearch" class="entity-search" placeholder="강의실명 검색" oninput="filterRoomPanel()"><div id="roomOptions" class="entity-options"></div></div></div>
      </div><div id="candidateHint" class="hint"></div></section>
      <section class="section"${hideSchedule}><div id="preview" class="preview"></div></section>
      <input type="hidden" id="startDate" value="${esc(group.startDate || '2026-06-22')}">
      <input type="hidden" id="endDate" value="${esc(group.endDate || '')}">
      <input type="hidden" id="weeklyFrequency" value="${group.weeklyFrequency || 5}">
    </main>
    <footer><button onclick="goBack()">취소</button><button class="primary" onclick="save()">${isCreate ? '그룹 만들기' : '저장'}</button></footer>
    <script>
      var subjectData=${JSON.stringify(subjectData).replace(/</g, '\\u003c')};
      var prefill=${JSON.stringify(prefillCurriculum).replace(/</g, '\\u003c')};
      var useTemplatePicker=${useTemplatePicker ? 'true' : 'false'};
      var lockPeriodToSequence=${lockPeriodToSequence ? 'true' : 'false'};
      var templateRows=${JSON.stringify(templateRows).replace(/</g, '\\u003c')};
      var NATIONALITY_CAP_BY_TYPE=${JSON.stringify(Object.fromEntries(classTypes.map(type => [type.code, getGroupNationalityCap(type.code)])))};
      var selectedTemplateSubject=null;
      var totalPeriods=${totalPeriods};
      var selectedPeriods=${JSON.stringify(selectedPeriods)};
      var LESSON_DAYS_LOCAL=['월','화','수','목','금'];
      var selectedDays=${JSON.stringify(selectedDays)};
      var isCreateMode=${isCreate ? 'true' : 'false'};
      var currentTeacherId=${currentTeacherId != null ? currentTeacherId : 'null'};
      var currentRoomId=${currentRoomId != null ? currentRoomId : 'null'};
      function renderPeriods(){
        var container=document.getElementById('periods');
        var html='';
        for(var i=1;i<=totalPeriods;i++){
          var selected=selectedPeriods.indexOf(i)>-1;
          html+=('<button type="button" class="period-btn'+(selected?' selected':'')+'" data-period="'+i+'" onclick="togglePeriod('+i+')">'+i+'</button>');
        }
        container.innerHTML=html;
        document.getElementById('periodsSelectedHint').textContent=lockPeriodToSequence
          ? '빈자리 있는 교시로 미리 채웠어(교시 고정 아님, 자유롭게 바꿀 수 있어). 선택됨: '+(selectedPeriods.length?selectedPeriods.join(', ')+'교시':'교시 미지정')
          : '선택됨: '+(selectedPeriods.length?selectedPeriods.join(', ')+'교시':'교시 미지정');
      }
      function togglePeriod(period){
        // 그룹 하나는 하루 1교시만 만난다 — 교시는 단일 선택.
        selectedPeriods = selectedPeriods.length === 1 && selectedPeriods[0] === period ? [] : [period];
        renderPeriods();
        renderCandidates();
        renderPreview();
      }
      function renderDays(){
        // 운영 요일은 항상 월~금 고정이라 클릭해도 바뀌지 않는다.
        var container=document.getElementById('days');
        container.innerHTML=LESSON_DAYS_LOCAL.map(function(day){
          return '<button type="button" class="period-btn selected" disabled style="cursor:default">'+day+'</button>';
        }).join('');
        document.getElementById('daysSelectedHint').textContent='고정: 월~금 (변경 불가)';
        document.getElementById('weeklyFrequency').value=selectedDays.length||5;
      }
      function toggleDay(day){
        var idx=selectedDays.indexOf(day);
        if(idx>-1)selectedDays.splice(idx,1);
        else selectedDays.push(day);
        renderDays();
        renderCandidates();
        renderPreview();
      }
      var teacherOptionsList=[];
      var roomOptionsList=[];
      function renderCandidates(){
        var classType=document.getElementById('classType').value;
        var capacity=getGroupClassCapacity(classType);
        var ready=selectedDays.length&&selectedPeriods.length;
        teacherOptionsList=ready?getGroupTeacherCandidates(classType,selectedDays,selectedPeriods,${isCreate ? 'null' : group.id}):[];
        roomOptionsList=ready?getGroupRoomCandidates(classType,selectedDays,selectedPeriods,capacity,${isCreate ? 'null' : group.id}):[];
        var teacherIdInput=document.getElementById('teacherId');
        var roomIdInput=document.getElementById('roomId');
        var prevTeacher=teacherIdInput.value;
        var prevRoom=roomIdInput.value;
        if(!teacherOptionsList.some(function(t){return String(t.id)===prevTeacher})){
          teacherIdInput.value=(currentTeacherId!=null&&teacherOptionsList.some(function(t){return t.id===currentTeacherId}))?String(currentTeacherId):'';
        }
        if(!roomOptionsList.some(function(r){return String(r.id)===prevRoom})){
          roomIdInput.value=(currentRoomId!=null&&roomOptionsList.some(function(r){return r.id===currentRoomId}))?String(currentRoomId):'';
        }
        var selectedTeacher=teacherOptionsList.find(function(t){return String(t.id)===teacherIdInput.value});
        var teacherToggle=document.getElementById('teacherToggle');
        teacherToggle.textContent=selectedTeacher?(selectedTeacher.nick||selectedTeacher.name):'강사 검색하기';
        teacherToggle.classList.toggle('placeholder',!selectedTeacher);
        var selectedRoom=roomOptionsList.find(function(r){return String(r.id)===roomIdInput.value});
        var roomToggle=document.getElementById('roomToggle');
        roomToggle.textContent=selectedRoom?(selectedRoom.roomNo+' ('+selectedRoom.type+', 최대 '+selectedRoom.capacity+'명)'):'강의실 검색하기';
        roomToggle.classList.toggle('placeholder',!selectedRoom);
        document.getElementById('teacherSelectedLabel').textContent=selectedTeacher?(selectedTeacher.nick||selectedTeacher.name):'미선택';
        document.getElementById('roomSelectedLabel').textContent=selectedRoom?selectedRoom.roomNo:'미선택';
        if(document.getElementById('teacherPanel').style.display!=='none') renderTeacherOptions(document.getElementById('teacherSearch').value);
        if(document.getElementById('roomPanel').style.display!=='none') renderRoomOptions();
        var hint=document.getElementById('candidateHint');
        if(!ready) hint.textContent='요일과 교시를 먼저 선택하면 가능한 강사·강의실만 보여줘.';
        else if(!teacherOptionsList.length) hint.textContent='선택한 요일·교시에 가능한 강사가 없어. 다른 시간을 선택해줘.';
        else if(!roomOptionsList.length) hint.textContent='선택한 요일·교시에 가능한 강의실이 없어. 다른 시간을 선택해줘.';
        else hint.textContent='';
      }
      function toggleTeacherPanel(){
        var panel=document.getElementById('teacherPanel');
        var willOpen=panel.style.display==='none';
        document.getElementById('roomPanel').style.display='none';
        document.getElementById('roomToggle').setAttribute('aria-expanded','false');
        document.getElementById('roomResourceBox').classList.remove('open');
        panel.style.display=willOpen?'block':'none';
        document.getElementById('teacherToggle').setAttribute('aria-expanded',willOpen?'true':'false');
        document.getElementById('teacherResourceBox').classList.toggle('open',willOpen);
        if(willOpen){
          document.getElementById('teacherSearch').value='';
          document.getElementById('teacherGrade').value='';
          renderTeacherOptions('');
          document.getElementById('teacherSearch').focus();
        }
      }
      function toggleRoomPanel(){
        var panel=document.getElementById('roomPanel');
        var willOpen=panel.style.display==='none';
        document.getElementById('teacherPanel').style.display='none';
        document.getElementById('teacherToggle').setAttribute('aria-expanded','false');
        document.getElementById('teacherResourceBox').classList.remove('open');
        panel.style.display=willOpen?'block':'none';
        document.getElementById('roomToggle').setAttribute('aria-expanded',willOpen?'true':'false');
        document.getElementById('roomResourceBox').classList.toggle('open',willOpen);
        if(willOpen){document.getElementById('roomSearch').value='';renderRoomOptions('');document.getElementById('roomSearch').focus();}
      }
      function filterTeacherPanel(){
        renderTeacherOptions(document.getElementById('teacherSearch').value);
      }
      function renderTeacherOptions(query){
        query=(query||'').trim().toLowerCase();
        var grade=document.getElementById('teacherGrade').value;
        var current=document.getElementById('teacherId').value;
        var matches=teacherOptionsList.filter(function(t){
          var name=(t.nick||t.name||'').toLowerCase();
          var room=(t.room||'').toLowerCase();
          var teacherGrade=String(t.grade4ms||'').charAt(0).toUpperCase();
          return (!query||name.indexOf(query)>-1||room.indexOf(query)>-1)&&(!grade||teacherGrade===grade);
        });
        var box=document.getElementById('teacherOptions');
        box.innerHTML=matches.length?matches.map(function(t){
          var selected=String(t.id)===current;
          var avatar=t.photoUrl||('assets/images/'+(t.gender==='남'?'teacher_male.png':'teacher_female.png'));
          var typeText=(t.type||'일반')+' · '+((t.classTypes||[]).join(', ')||'그룹 수업');
          var courses=(t.preferredCourses||[]);
          var subjects=(typeof getTeacherCapableSubjectIds==='function'?getTeacherCapableSubjectIds(t):[]).map(function(id){var item=MOCK_MASTER_SUBJECTS.find(function(subject){return subject.id===id});return item?item.name:id});
          var levels=(typeof getTeacherCapableLevelIds==='function'?getTeacherCapableLevelIds(t):[]).map(function(id){var item=MOCK_MASTER_LEVELS.find(function(level){return level.id===id});return item?item.name:id});
          function capabilityLine(title,items,type){return '<span class="capability-line"><span class="capability-title">'+title+'</span>'+(items.length?items.map(function(item){return '<span class="capability-tag '+type+'">'+item+'</span>'}).join(''):'<span class="capability-empty">등록 없음</span>')+'</span>'}
          var capabilities='<span class="teacher-capabilities">'+capabilityLine('담당 과정',courses,'course')+capabilityLine('가능 과목',subjects,'subject')+capabilityLine('가능 레벨',levels,'level')+'</span>';
          return '<div class="entity-option'+(selected?' selected':'')+'" onmousedown="selectTeacherOption('+t.id+')"><img class="entity-avatar" src="'+avatar+'"><span class="entity-main"><b>'+(t.nick||t.name)+' '+(t.gender==='여'?'(F)':'(M)')+'</b><small>'+(t.room||'담당 강의실 없음')+' · '+typeText+'</small>'+capabilities+'</span><span class="entity-status">배정 가능</span></div>';
        }).join(''):'<div class="entity-empty">검색 결과가 없어.</div>';
      }
      function filterRoomPanel(){renderRoomOptions(document.getElementById('roomSearch').value);}
      function renderRoomOptions(query){
        query=(query||'').trim().toLowerCase();
        var current=document.getElementById('roomId').value;
        var box=document.getElementById('roomOptions');
        var matches=roomOptionsList.filter(function(r){return !query||(r.roomNo||'').toLowerCase().indexOf(query)>-1||(r.type||'').toLowerCase().indexOf(query)>-1;});
        box.innerHTML=matches.length?matches.map(function(r){
          var selected=String(r.id)===current;
          return '<div class="entity-option'+(selected?' selected':'')+'" onmousedown="selectRoomOption('+r.id+')"><span class="entity-main"><b>'+r.roomNo+'</b><small>'+r.type+' · 최대 '+r.capacity+'명</small></span><span class="entity-status">배정 가능</span></div>';
        }).join(''):'<div class="entity-empty">검색 조건에 맞는 배정 가능 강의실이 없어.</div>';
      }
      function selectTeacherOption(id){
        var teacher=teacherOptionsList.find(function(t){return t.id===id});
        document.getElementById('teacherId').value=id;
        var toggle=document.getElementById('teacherToggle');
        toggle.textContent=teacher?(teacher.nick||teacher.name):'선택';
        toggle.classList.remove('placeholder');
        document.getElementById('teacherSelectedLabel').textContent=teacher?(teacher.nick||teacher.name):'미선택';
        document.getElementById('teacherPanel').style.display='none';
        toggle.setAttribute('aria-expanded','false');
        document.getElementById('teacherResourceBox').classList.remove('open');
        renderPreview();
        if(!document.getElementById('roomId').value)toggleRoomPanel();
      }
      function selectRoomOption(id){
        var room=roomOptionsList.find(function(r){return r.id===id});
        document.getElementById('roomId').value=id;
        var toggle=document.getElementById('roomToggle');
        toggle.textContent=room?(room.roomNo+' ('+room.type+', 최대 '+room.capacity+'명)'):'선택';
        toggle.classList.remove('placeholder');
        document.getElementById('roomSelectedLabel').textContent=room?room.roomNo:'미선택';
        document.getElementById('roomPanel').style.display='none';
        toggle.setAttribute('aria-expanded','false');
        document.getElementById('roomResourceBox').classList.remove('open');
        renderPreview();
      }
      document.addEventListener('mousedown',function(e){
        var teacherPanel=document.getElementById('teacherPanel');
        var roomPanel=document.getElementById('roomPanel');
        if(teacherPanel&&teacherPanel.style.display!=='none'&&!teacherPanel.contains(e.target)&&e.target!==document.getElementById('teacherToggle')){
          teacherPanel.style.display='none';
          document.getElementById('teacherToggle').setAttribute('aria-expanded','false');
          document.getElementById('teacherResourceBox').classList.remove('open');
        }
        if(roomPanel&&roomPanel.style.display!=='none'&&!roomPanel.contains(e.target)&&e.target!==document.getElementById('roomToggle')){
          roomPanel.style.display='none';
          document.getElementById('roomToggle').setAttribute('aria-expanded','false');
          document.getElementById('roomResourceBox').classList.remove('open');
        }
      });
      function onTemplateRowChange(){
        var idx=document.getElementById('templateRow').value;
        var row=templateRows[idx];
        selectedTemplateSubject=row?{id:row.subjectId,hours:1}:null;
        document.getElementById('classType').value=row?row.classType:'';
        updateNationalityCapHint();
        renderCandidates();
        renderPreview();
      }
      // 동일 국적 최대 인원은 퍼센트가 아니라 명수로 안내한다. 수업 형태가 정해져야 기본값을 알 수 있다.
      function updateNationalityCapHint(){
        var input=document.getElementById('nationalityCap');
        var hint=document.getElementById('nationalityCapHint');
        if(!input) return;
        var type=document.getElementById('classType').value;
        var cap=NATIONALITY_CAP_BY_TYPE[type];
        if(cap){
          input.placeholder=cap+'명';
          if(hint) hint.textContent='비워두면 기본값 '+cap+'명을 사용해.';
        }else{
          input.placeholder='교시 템플릿 선택 후 자동';
          if(hint) hint.textContent='비워두면 수업 형태별 기본값을 사용해.';
        }
      }
      function selectedCurriculum(){
        if(useTemplatePicker) return selectedTemplateSubject?[selectedTemplateSubject]:[];
        var input=document.querySelector('.subject:checked');
        if(!input)return [];
        var hoursInput=document.querySelector('.hours[data-subject="'+input.value+'"]');
        return [{id:input.value,hours:Math.max(1,Number(hoursInput&&hoursInput.value)||1)}];
      }
      function renderSubjects(){
        var type=document.getElementById('classType').value;
        var current=selectedCurriculum();
        if(!current.length)current=prefill.slice(0,1);
        document.getElementById('subjects').innerHTML=subjectData.map(function(subject){
          var supported=subject.types.includes(type);
          var ref=current.find(function(item){return item.id===subject.id});
          var checked=supported&&Boolean(ref);
          var hours=ref?ref.hours:1;
          return '<label class="choice" style="opacity:'+(supported?1:.45)+'"><input class="subject" type="radio" name="subject" value="'+subject.id+'" '+(checked?'checked':'')+' '+(supported?'':'disabled')+' onchange="renderPreview()"><span style="flex:1">'+subject.name+'</span><input class="hours" data-subject="'+subject.id+'" type="number" min="1" max="12" value="'+hours+'" style="width:52px;height:30px;text-align:center;padding:2px" oninput="renderPreview()"><span style="font-size:9.5px;color:#6B7280">교시</span></label>';
        }).join('');
        renderCandidates();
        renderPreview();
      }
      function renderPreview(){
        var refs=selectedCurriculum();
        var names=refs.map(function(ref){var subject=subjectData.find(function(item){return item.id===ref.id});return (subject?subject.name:ref.id)+' '+ref.hours+'교시'});
        var dayText=selectedDays.length?selectedDays.join(', ')+'요일':'요일 미지정';
        var periodText=selectedPeriods.length?selectedPeriods.join(', ')+'교시':'교시 미지정';
        var selectedTeacher=teacherOptionsList.find(function(t){return String(t.id)===document.getElementById('teacherId').value});
        var selectedRoom=roomOptionsList.find(function(r){return String(r.id)===document.getElementById('roomId').value});
        var teacherText=selectedTeacher?(selectedTeacher.nick||selectedTeacher.name):'강사 미지정';
        var roomText=selectedRoom?(selectedRoom.roomNo+' ('+selectedRoom.type+', 최대 '+selectedRoom.capacity+'명)'):'강의실 미지정';
        document.getElementById('preview').innerHTML='<b>그룹 기준</b><br>'+(refs.length?names.join(' · ')+' · '+document.getElementById('classType').value:'과목을 선택해.')+'<br>'+dayText+' · '+periodText+'<br>'+teacherText+' · '+roomText;
      }
      // 레벨은 최대 2개, 붙어 있는 것끼리만. 저장 후에 튕기지 않도록 세 번째 체크가 아예 눌리지 않게 잠근다.
      var LEVEL_ORDERS=${JSON.stringify(getVisibleLevelOrders())};
      // 새 반은 레벨 하나만. 고칠 때는 기존 통합 반을 유지해야 해서 예전 상한을 그대로 둔다.
      var MAX_LEVELS=${isCreate ? 1 : 2};
      var assignAfterCreate=${isCreate && createDefaults?.assignAfterCreate === true ? 'true' : 'false'};
      function pickedLevels(){
        return Array.prototype.slice.call(document.querySelectorAll('.level:checked')).map(function(input){return Number(input.value)}).sort(function(a,b){return a-b});
      }
      function onLevelChange(){
        var picked=pickedLevels();
        Array.prototype.slice.call(document.querySelectorAll('.level')).forEach(function(box){
          if(box.checked){box.disabled=false;return;}
          if(picked.length>=MAX_LEVELS){box.disabled=true;return;}
          if(!picked.length){box.disabled=false;return;}
          var gap=Math.abs(LEVEL_ORDERS.indexOf(Number(box.value))-LEVEL_ORDERS.indexOf(picked[0]));
          box.disabled=gap!==1;
        });
        var hint=document.getElementById('levelHint');
        if(hint){
          hint.textContent=picked.length>=MAX_LEVELS
            ? (MAX_LEVELS===1 ? '새로 만드는 반은 레벨 하나만 골라. 통합 레벨은 이미 운영 중인 반에서만 유지돼.' : '레벨 '+MAX_LEVELS+'개를 골랐어. 다른 조합으로 바꾸려면 하나를 해제해.')
            : picked.length===1
            ? '통합 그룹으로 묶으려면 바로 옆 레벨 하나만 더 고를 수 있어. 교재가 달라 한 칸 이상 떨어진 레벨은 잠겨 있어.'
            : '교재가 레벨마다 달라 단일 레벨을 권장해. 통합은 붙어 있는 레벨 '+MAX_LEVELS+'개까지야.';
        }
      }
      function goBack(){window.close();}
      function save(){
        if(useTemplatePicker&&!selectedTemplateSubject){window.alert('유형·과목을 선택해.');return;}
        if(!isCreateMode&&useTemplatePicker&&!selectedPeriods.length){window.alert('교시를 선택해.');return;}
        if(!pickedLevels().length){window.alert('레벨을 1개 이상 선택해.');return;}
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        var payload={curriculum:selectedCurriculum(),course:'',levelGroups:Array.from(document.querySelectorAll('.level:checked')).map(function(input){return Number(input.value)}),classType:document.getElementById('classType').value,capacity:document.getElementById('capacity').value,nationalityCap:document.getElementById('nationalityCap').value,startDate:document.getElementById('startDate').value,endDate:document.getElementById('endDate').value,weeklyFrequency:document.getElementById('weeklyFrequency').value,periods:selectedPeriods,dayOfWeek:selectedDays,teacherId:isCreateMode?'':document.getElementById('teacherId').value,roomId:isCreateMode?'':document.getElementById('roomId').value,seedStudentId:${seedStudentId != null ? seedStudentId : 'null'},assignSeedStudent:false};
        window.opener.postMessage({channel:'tsa-group-popup',action:'save-group',groupId:${isCreate ? 'null' : group.id},payload:payload,returnToStudentAssignment:${isCreate && seedStudentId != null ? `{studentId:${seedStudentId},classType:'${group.classType}'}` : 'null'}},'*');
      }
      window.addEventListener('message',function(event){
        var message=event.data;
        if(!message||message.channel!=='tsa-group-popup'||message.action!=='save-group-result')return;
        if(!message.result||!message.result.ok){window.alert(message.result&&message.result.message?message.result.message:'그룹을 저장하지 못했어.');return;}
        var back=message.returnToStudentAssignment;
        // 통합 레벨에서 들어온 생성이면 만든 그룹의 학생 배정 화면으로 바로 이어 붙인다.
        if(assignAfterCreate&&message.result.createdGroupId){
          var assignUrl=new URL(window.location.href);
          assignUrl.search='';
          assignUrl.searchParams.set('view','assignment');
          assignUrl.searchParams.set('groupId',String(message.result.createdGroupId));
          window.location.replace(assignUrl.href);
          return;
        }
        if(back&&message.result.createdGroupId){
          var url=new URL(window.location.href);
          url.search='';
          url.searchParams.set('v','0.8.66');
          url.searchParams.set('view','student-assign');
          url.searchParams.set('student',String(back.studentId));
          url.searchParams.set('type',back.classType||'1:4');
          url.searchParams.set('createdGroup',String(message.result.createdGroupId));
          window.location.replace(url.href);
        }else{window.close();}
      });
      renderPeriods();
      renderDays();
      updateNationalityCapHint();
      if(useTemplatePicker){ renderCandidates(); renderPreview(); } else { renderSubjects(); }
      onLevelChange();
    <\/script></body></html>`);
  popup.document.close();
  popup.focus();
}

// prefillCurriculum: 커리큘럼 배열([{id,hours}]) 또는 (구버전 호환) 단일 subjectId 문자열.
// extra: { levels: [2,3], assignAfterCreate: true }
// levels는 통합 레벨에서 조합 전체를 미리 채워 넣을 때 쓴다(단일 레벨이면 그대로 비워둔다).
// assignAfterCreate는 생성 직후 학생 배정 화면으로 이어 붙여, 만들고 배정하는 데 창을 두 번 열지 않게 한다.
function openGroupCreateBrowserPopup(prefillCurriculum, prefillClassType, prefillLevelGroup, popupTarget, seedStudentId, prefillSequence, extra) {
  const safeSeedStudentId = Number.isFinite(Number(seedStudentId)) ? Number(seedStudentId) : null;
  const safeSequence = Number.isFinite(Number(prefillSequence)) ? Number(prefillSequence) : null;
  const normalizedCurriculum = Array.isArray(prefillCurriculum)
    ? prefillCurriculum.map(ref => ({ id: ref.id, hours: Math.max(1, Number(ref.hours) || 1) }))
    : (prefillCurriculum ? [{ id: prefillCurriculum, hours: 1 }] : []);
  const requestedLevels = Array.isArray(extra?.levels)
    ? [...new Set(extra.levels.map(Number).filter(Number.isFinite))].sort((a, b) => a - b)
    : [];
  const levels = getGroupLevelSelectionError(requestedLevels, true) ? [] : requestedLevels;
  const defaults = {
    curriculum: normalizedCurriculum,
    subjectId: normalizedCurriculum[0]?.id || '',
    type: prefillClassType || '1:4',
    level: levels[0] || Number(prefillLevelGroup) || 1,
    levels,
    assignAfterCreate: extra?.assignAfterCreate === true,
    seedStudentId: safeSeedStudentId,
    sequence: safeSequence
  };
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('create');
    if (normalizedCurriculum.length) popupUrl.searchParams.set('curriculum', JSON.stringify(normalizedCurriculum));
    popupUrl.searchParams.set('type', defaults.type);
    popupUrl.searchParams.set('level', defaults.level);
    if (levels.length > 1) popupUrl.searchParams.set('levels', levels.join(','));
    if (defaults.assignAfterCreate) popupUrl.searchParams.set('assign', '1');
    if (safeSeedStudentId != null) popupUrl.searchParams.set('student', safeSeedStudentId);
    if (safeSequence != null) popupUrl.searchParams.set('sequence', safeSequence);
    const openedPopup = window.open(popupUrl.href, 'tsa-group-create', 'popup=yes,width=820,height=820,resizable=yes,scrollbars=yes');
    if (!openedPopup) {
      showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
      return;
    }
    return;
  }
  openGroupEditBrowserPopup(null, null, popupTarget, defaults);
}

function initializeGroupPopupMode() {
  if (window.__tsaGroupPopupInitialized) return;
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('groupPopup');
  if (!mode) return;
  window.__tsaGroupPopupInitialized = true;

  // file:// 팝업에서는 부모 창의 함수를 직접 실행하면 로컬 파일 보안 경계로 초기화가 중단될 수 있다.
  // 화면 렌더링은 팝업 자신의 스크립트로 처리하고, 저장할 때만 opener에 결과를 반영한다.
  const source = window;
  const rowIndex = Number.parseInt(params.get('row'), 10);
  const groupId = Number.parseInt(params.get('groupId'), 10);
  const safeRowIndex = Number.isFinite(rowIndex) ? rowIndex : null;
  const safeGroupId = Number.isFinite(groupId) ? groupId : null;

  if (mode === 'detail' && safeRowIndex != null) {
    source.openGroupManagementBrowserPopup(safeRowIndex, window);
    return;
  }
  if (mode === 'assignment' && safeGroupId != null) {
    source.openGroupAssignmentBrowserPopup(safeGroupId, safeRowIndex, window);
    return;
  }
  if (mode === 'edit' && safeGroupId != null) {
    source.openGroupEditBrowserPopup(safeGroupId, safeRowIndex, window);
    return;
  }
  if (mode === 'create') {
    let curriculumParam = [];
    try { curriculumParam = JSON.parse(params.get('curriculum') || '[]'); } catch (error) { curriculumParam = []; }
    source.openGroupCreateBrowserPopup(
      curriculumParam,
      params.get('type') || '1:4',
      Number.parseInt(params.get('level'), 10) || 1,
      window
    );
  }
}
function openGroupManagementStudentEditor(groupId) {
  const modal = document.getElementById('group-assign-popup-modal');
  if (modal && modal.parentElement !== document.body) document.body.appendChild(modal);
  openGroupAssignPopup(groupId);
}

// 그룹 카드의 "+ 배정하기" 클릭 시 뜨는 팝업: 매칭 대상 학생을 바로 골라 배정할 수 있게 한다.
// 이 모달은 마크업상 "1:1 수업 관리"(view-class-schedule) 안에 위치해 있어서, 다른 화면(그룹 관리 등)이
// 활성 상태일 때는 조상 .tsa-view가 display:none이라 그대로 열면 화면에 보이지 않는다.
// document.body로 옮겨서 어느 화면에서 호출해도 항상 보이게 한다.
function openGroupAssignPopup(groupId) {
  const modal = document.getElementById('group-assign-popup-modal');
  if (modal && modal.parentElement !== document.body) document.body.appendChild(modal);
  _csSelectedGroupId = groupId;
  renderGroupAssignPopupCandidates();
  openModal('group-assign-popup-modal');
}

function closeGroupAssignPopup() {
  closeModal('group-assign-popup-modal');
}

function renderGroupAssignPopupCandidates() {
  const group = MOCK_GROUP_CLASSES.find(g => g.id === _csSelectedGroupId);
  const titleEl = document.getElementById('gap-title');
  const metaEl = document.getElementById('gap-meta');
  const wrap = document.getElementById('gap-candidates');
  if (!wrap) return;
  if (!group) { wrap.innerHTML = ''; return; }

  const cap = getGroupCapacityFor(group);
  const remaining = Math.max(0, cap - group.studentIds.length);
  if (titleEl) titleEl.textContent = `${getGroupDisplayName(group)} 학생 배정`;
  if (metaEl) metaEl.textContent = `${getGroupCoursesLabel(group)} · ${getGroupLevelSetLabel(group)} · 남은 자리 ${remaining}석`;

  const candidates = buildGroupAssignCandidateRows(group);
  if (!candidates.length) {
    wrap.innerHTML = `<div style="padding:16px;text-align:center;color:#9CA3AF;font-size:12px">동일 과목·레벨군의 미배정 학생이 없습니다.</div>`;
    return;
  }
  wrap.innerHTML = candidates.map(s => {
    const fmt = d => d ? d.replace('2026-', '26.').replace(/-/g, '.') : '-';
    const weeks = (s.startDate && s.endDate) ? Math.max(1, Math.round((new Date(s.endDate) - new Date(s.startDate)) / (7 * 86400000))) : null;
    const period = (s.startDate && s.endDate) ? `${fmt(s.startDate)} ~ ${fmt(s.endDate)}${weeks ? ` (${weeks}주)` : ''}` : '수강 기간 미등록';
    return `
      <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:6px;${s.blocked ? 'opacity:.5' : 'cursor:pointer'}">
        <input type="checkbox" class="gap-candidate-cb" value="${s.id}" ${s.blocked ? 'disabled' : ''}/>
        <div style="flex:1;font-size:11.5px">
          <div style="font-weight:700;color:#111827">${s.name} <span style="font-weight:400;color:#6B7280">(${s.sub})</span></div>
          <div style="color:#6B7280;margin-top:1px">${s.course || '-'} · ${s.level || '-'} · ${s.nationality || '-'} · ${s.gender}성 · ${s.age || '-'}세</div>
          <div style="color:#9CA3AF;margin-top:1px;font-size:10.5px">📅 ${period}</div>
        </div>
        ${s.reason ? `<span style="font-size:10px;color:#EF4444;font-weight:700">${s.reason}</span>` : ''}
      </label>
    `;
  }).join('');
}

function assignFromGroupAssignPopup() {
  const group = MOCK_GROUP_CLASSES.find(g => g.id === _csSelectedGroupId);
  if (!group) { showToast('그룹을 찾을 수 없습니다.', 'warning'); return; }
  const checked = [...document.querySelectorAll('.gap-candidate-cb:checked')].map(cb => parseInt(cb.value, 10));
  if (!checked.length) { showToast('배정할 학생을 선택하세요.', 'warning'); return; }
  const cap = getGroupCapacityFor(group);
  const availableSeats = Math.max(0, cap - group.studentIds.length);
  const validStudentIds = checked.filter(studentId =>
    MOCK_STUDENTS.some(student => student.id === studentId) &&
    !group.studentIds.includes(studentId)
  );
  if (validStudentIds.length > availableSeats) {
    showToast(`남은 자리 ${availableSeats}석까지만 배정할 수 있어.`, 'warning');
    return;
  }
  const nationalityViolation = getGroupAssignmentNationalityViolation(group, validStudentIds);
  if (nationalityViolation) {
    window.alert(`${nationalityViolation.nationality} 학생은 한 그룹에 최대 ${nationalityViolation.cap}명까지만 배정할 수 있어.\n선택한 학생은 배정되지 않았어.`);
    return;
  }
  group.studentIds.push(...validStudentIds);
  const assignedCount = validStudentIds.length;
  showToast(`✓ ${assignedCount}명을 ${getGroupDisplayName(group)}에 배정했습니다.`, 'success');
  closeGroupAssignPopup();
  renderCsGroupPanel();
}
function deleteCsGroup(id) {
  const groupIndex = MOCK_GROUP_CLASSES.findIndex(g => g.id === id);
  if (groupIndex < 0) return;

  const group = MOCK_GROUP_CLASSES[groupIndex];
  const studentCount = group.studentIds.length;
  const impactMessage = studentCount ? `\n\n삭제 시 배정 학생 ${studentCount}명도 함께 미배정 상태로 돌아가.` : '';

  if (!window.confirm(`'${getGroupDisplayName(group)}' 그룹을 삭제할까?${impactMessage}`)) return;

  MOCK_GROUP_CLASSES.splice(groupIndex, 1);
  if (_csSelectedGroupId === id) {
    _csSelectedGroupId = MOCK_GROUP_CLASSES[0]?.id || null;
  }

  renderCsGroupPanel();
  showToast(`✓ ${getGroupDisplayName(group)} 그룹을 삭제했어.`, 'success');
}
function getStudentMissingGroupRows(studentId) {
  return buildCsGroupDemandRows().filter(row => {
    if (!row.studentIds.includes(studentId)) return false;
    const matchingGroups = getGroupManagementRowGroups(row);
    return !matchingGroups.some(group => group.studentIds.includes(studentId));
  }).sort((a, b) => {
    const aTypeOrder = MOCK_MASTER_CLASS_TYPES.find(type => type.code === a.classType)?.order ?? 999;
    const bTypeOrder = MOCK_MASTER_CLASS_TYPES.find(type => type.code === b.classType)?.order ?? 999;
    if (aTypeOrder !== bTypeOrder) return aTypeOrder - bTypeOrder;
    const aSubjectOrder = Math.min(...(a.curriculum || []).map(ref =>
      MOCK_MASTER_SUBJECTS.find(subject => subject.id === ref.id)?.order ?? 999
    ));
    const bSubjectOrder = Math.min(...(b.curriculum || []).map(ref =>
      MOCK_MASTER_SUBJECTS.find(subject => subject.id === ref.id)?.order ?? 999
    ));
    return aSubjectOrder - bSubjectOrder;
  });
}

// 학생이 과정상 들어가야 할 1:4/1:8 그룹 가운데 하나라도 배정되지 않은 경우 미배정으로 본다.
function getUnmatchedGroupCandidateStudents() {
  return MOCK_STUDENTS.filter(student =>
    ['current', 'waiting', 'extended'].includes(student.status) &&
    getStudentMissingGroupRows(student.id).length > 0
  );
}
function closeAutoMatchAllGroupsModal() {
  document.getElementById('group-auto-match-conditions-modal')?.remove();
}

function openAutoMatchAllGroupsModal() {
  closeAutoMatchAllGroupsModal();
  const activeGroups = MOCK_GROUP_CLASSES.filter(group => group.status === 'active');
  const unmatchedStudents = getUnmatchedGroupCandidateStudents();
  const remainingSeats = activeGroups.reduce((sum, group) =>
    sum + Math.max(0, getGroupCapacityFor(group) - group.studentIds.length), 0
  );
  const lockedStudents = activeGroups.reduce((sum, group) => sum + (group.manualLockIds || []).length, 0);
  const conditions = [
    ['기존 배정 보호', '현재 그룹에 배정된 학생과 수동 고정 학생은 유지하고, 미배정 학생만 추가 매칭'],
    ['과목 수강 대상', '학생의 등록 과정에 그룹 과목과 수업 형태가 포함되어 있어야 함'],
    ['레벨 일치', '학생 레벨이 그룹에 설정된 매칭 레벨 범위에 포함되어야 함'],
    ['정원 제한', '1:4는 최대 4명, 1:8은 최대 8명까지 배정하며 남은 좌석을 초과하지 않음'],
    ['국적 분산', '그룹별 동일 국적 최대 인원을 초과하는 학생은 해당 그룹에서 제외'],
    ['처리 순서', '먼저 생성된 그룹부터 빈자리를 채우고, 학생은 등록 순서가 빠른 대상부터 검토'],
    ['미매칭 처리', '조건을 만족하는 그룹이 없거나 정원·국적 제한에 걸린 학생은 미매칭 목록에 유지'],
    ['점수 갱신', '매칭 완료 후 과목·레벨·정원·국적 분산 기준으로 그룹별 매칭 점수를 다시 계산']
  ];

  const modal = document.createElement('div');
  modal.id = 'group-auto-match-conditions-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(17,24,39,.52);display:flex;align-items:center;justify-content:center;padding:20px';
  modal.onclick = event => { if (event.target === modal) closeAutoMatchAllGroupsModal(); };
  modal.innerHTML = `<div style="width:min(760px,96vw);max-height:90vh;background:#fff;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden">
    <div style="padding:19px 22px;border-bottom:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
      <div><h3 style="font-size:17px;margin:0;color:#111827">전체 자동 매칭 조건 확인</h3><p style="font-size:11.5px;color:#6B7280;margin:6px 0 0">기존 배정은 유지하고 조건에 맞는 미배정 학생만 그룹의 남은 자리에 추가해.</p></div>
      <button onclick="closeAutoMatchAllGroupsModal()" style="border:0;background:none;font-size:21px;color:#6B7280;cursor:pointer">×</button>
    </div>
    <div style="padding:18px 22px;overflow:auto">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:16px">
        ${[
          ['운영 그룹', `${activeGroups.length}개`, '#4F46E5', '#EEF2FF'],
          ['미배정 학생', `${unmatchedStudents.length}명`, '#B45309', '#FFF7ED'],
          ['남은 좌석', `${remainingSeats}석`, '#047857', '#ECFDF5'],
          ['수동 고정', `${lockedStudents}명`, '#6D28D9', '#F5F3FF']
        ].map(([label, value, color, bg]) => `<div style="padding:12px;border-radius:10px;background:${bg}"><span style="display:block;font-size:10px;color:#6B7280">${label}</span><b style="display:block;font-size:19px;color:${color};margin-top:3px">${value}</b></div>`).join('')}
      </div>
      <b style="display:block;font-size:12px;color:#374151;margin-bottom:8px">자동 매칭 조건</b>
      <div style="display:flex;flex-direction:column;gap:7px">
        ${conditions.map(([title, description], index) => `<div style="display:grid;grid-template-columns:24px 92px 1fr;gap:8px;align-items:start;padding:10px;border:1px solid #E5E7EB;border-radius:9px"><span style="width:20px;height:20px;border-radius:50%;background:#EEF2FF;color:#4F46E5;display:inline-flex;align-items:center;justify-content:center;font-size:9px;font-weight:900">${index + 1}</span><b style="font-size:10.5px;color:#4F46E5;padding-top:2px">${title}</b><span style="font-size:10.5px;color:#4B5563;line-height:1.5">${description}</span></div>`).join('')}
      </div>
      <div style="margin-top:12px;padding:10px 12px;border:1px solid #FCD34D;border-radius:9px;background:#FFFBEB;color:#92400E;font-size:10.5px;line-height:1.5">자동 매칭은 기존 학생을 다른 그룹으로 이동시키지 않아. 전체 재편성이 필요하면 기존 배정을 먼저 해제해야 해.</div>
    </div>
    <div style="padding:13px 22px;border-top:1px solid #E5E7EB;background:#F9FAFB;display:flex;justify-content:flex-end;gap:8px">
      <button class="tsa-btn tsa-btn-outline" onclick="closeAutoMatchAllGroupsModal()">취소</button>
      <button class="tsa-btn tsa-btn-primary" onclick="closeAutoMatchAllGroupsModal();autoMatchAllGroups()">조건 확인 후 전체 자동 매칭</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

function autoMatchAllGroups() {
  // D-04: 생성일(등록 순서) 빠른 그룹부터 순차 충원
  const sortedGroups = [...MOCK_GROUP_CLASSES].sort((a, b) => a.id - b.id);
  let totalAssigned = 0;
  sortedGroups.forEach(group => {
    // 자동 매칭은 기준 정원까지만 채운다. 초과 배정(상한 이내)은 관리자 수동 판단으로만 허용.
    const cap = getGroupBaseCapacityFor(group);
    const candidates = getGroupCandidateStudents(group).sort((a, b) => a.id - b.id);
    candidates.forEach(s => {
      if (group.studentIds.length >= cap) return;
      if (isGroupNationalityLimitExceeded(group, s)) return;
      group.studentIds.push(s.id);
      totalAssigned++;
    });
  });
  showToast(`✓ 전체 자동 매칭 완료 — ${totalAssigned}명 배정.`, 'success');
  renderCsGroupPanel();
}
function initClassSchedule() {
  _csCurrentWeek = '2026-06-22';
  _csCurrentDay  = '월';
  renderCsStudentAssignmentList();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function renderCsRooms() {
  // 유형별 섹션 테이블
  const tbody = document.getElementById('cs-rooms-tbody');
  if (!tbody) return;
  const typeStyle = t => { const [bg,c] = (CS_TYPE_COLOR[t]||'#F3F4F6|#6B7280').split('|'); return `background:${bg};color:${c}`; };
  const typeLabel = { '1:1':'1:1 강의실', '1:4':'1:4 그룹 강의실', '1:8':'1:8 그룹 강의실', '기타':'기타' };
  const typeAccent = { '1:1':'#5E5CE6', '1:4':'#B45309', '1:8':'#065F46', '기타':'#6B7280' };

  const renderRow = r => {
    const statusBg = r.roomNo ? '#D1FAE5' : '#F3F4F6';
    const statusColor = r.roomNo ? '#065F46' : '#6B7280';
    const statusLabel = r.roomNo ? '운영 중' : '호실 미정';
    const assignedTeacher = r.type === '1:1'
      ? MOCK_TEACHERS.find(teacher => teacher.status !== 'resigned' && teacher.nick === r.teacherNick)
      : null;
    const teacherHtml = r.type === '1:1'
      ? (assignedTeacher
          ? `<strong>${assignedTeacher.nick}</strong> <span style="font-size:10.5px;color:#6B7280">${assignedTeacher.name}</span>`
          : '<span style="font-size:10.5px;color:#B45309;font-weight:700">강사 미배정</span>')
      : '<span style="color:#D1D5DB">-</span>';
    return `<tr>
      <td style="font-weight:700">${r.roomNo || '<span style="color:#9CA3AF;font-style:italic">미배정</span>'}</td>
      <td style="font-size:12px;color:#6B7280">최대 ${r.capacity}명</td>
      <td>${teacherHtml}</td>
      <td><span style="font-size:11px;padding:2px 10px;border-radius:10px;font-weight:600;background:${statusBg};color:${statusColor}">${statusLabel}</span></td>
      <td>
        ${['1:4', '1:8'].includes(r.type) && r.roomNo ? `<button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openCsRoomSchedulePopup(${r.id})"><i data-lucide="calendar-days" style="width:12px;height:12px"></i> 스케줄</button>` : ''}
        <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openCsEditRoomModal(${r.id})">수정</button>
        ${!r.roomNo ? `<button class="tsa-btn tsa-btn-xs" style="background:#EEF2FF;color:#5E5CE6;border:none;margin-left:4px" onclick="openCsAddRoomModal(${r.id})">호실 배정</button>` : ''}
      </td>
    </tr>`;
  };

  const types = ['1:1','1:4','1:8','기타'];
  tbody.innerHTML = types.map(type => {
    if (_csRoomTypeFilter !== '전체' && _csRoomTypeFilter !== type) return '';
    const rooms = MOCK_CLASS_ROOMS
      .filter(r => r.type === type)
      .sort((a, b) => {
        if (!a.roomNo && !b.roomNo) return 0;
        if (!a.roomNo) return 1;
        if (!b.roomNo) return -1;
        return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true, sensitivity: 'base' });
      });
    if (rooms.length === 0) return '';
    return `<tr><td colspan="5" style="padding:8px 14px 4px;background:#F9FAFB;border-top:1.5px solid ${typeAccent[type]}30">
      <span style="font-size:12px;font-weight:700;color:${typeAccent[type]}">${typeLabel[type]}</span>
      <span style="font-size:11px;color:#9CA3AF;margin-left:8px">${rooms.filter(r=>r.roomNo).length}개 운영</span>
    </td></tr>` + rooms.map(renderRow).join('') + (type === '1:1' ? renderCsUnassignedTeachers() : '');
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function openCsAddRoomModal(id) {
  document.getElementById('cs-room-modal-title').textContent = id ? '호실 수정' : '호실 추가';
  document.getElementById('cs-room-modal-id').value = id || '';
  const r = id ? MOCK_CLASS_ROOMS.find(x => x.id === id) : null;
  document.getElementById('cs-room-no').value    = r?.roomNo || '';
  document.getElementById('cs-room-type').value  = r?.type || '1:1';
  document.getElementById('cs-room-cap').value   = r?.capacity || '';
  fillCsRoomTeacherSelect(r?.teacherNick || '');
  const qtyInput = document.getElementById('cs-room-qty');
  if (qtyInput) qtyInput.value = '1';

  toggleCsRoomQtyRow();

  document.getElementById('cs-room-modal').style.display = 'block';
  document.getElementById('cs-room-backdrop').style.display = 'block';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}
function openCsEditRoomModal(id) { openCsAddRoomModal(id); }

function closeCsAddRoomModal() {
  document.getElementById('cs-room-modal').style.display = 'none';
  document.getElementById('cs-room-backdrop').style.display = 'none';
}

function toggleCsRoomQtyRow() {
  const id = document.getElementById('cs-room-modal-id').value;
  const type = document.getElementById('cs-room-type').value;
  const qtyRow = document.getElementById('cs-room-qty-row');
  if (qtyRow) {
    if (!id && type === '1:1') {
      qtyRow.style.display = 'block';
    } else {
      qtyRow.style.display = 'none';
      const qtyInput = document.getElementById('cs-room-qty');
      if (qtyInput) qtyInput.value = '1';
    }
  }
  const teacherRow = document.getElementById('cs-room-teacher-row');
  if (teacherRow) teacherRow.style.display = type === '1:1' ? 'block' : 'none';
}

function generateNextRoomNos(baseRoomNo, count) {
  if (count <= 1) return [baseRoomNo];
  const match = baseRoomNo.match(/^(.*?)(\d+)$/);
  if (!match) {
    const result = [baseRoomNo];
    for (let i = 2; i <= count; i++) {
      result.push(`${baseRoomNo}-${i}`);
    }
    return result;
  }
  const prefix = match[1];
  const numStr = match[2];
  const numLen = numStr.length;
  const startNum = parseInt(numStr, 10);
  const result = [];
  for (let i = 0; i < count; i++) {
    const nextNum = startNum + i;
    const paddedNum = String(nextNum).padStart(numLen, '0');
    result.push(prefix + paddedNum);
  }
  return result;
}

function saveCsRoom() {
  const id = document.getElementById('cs-room-modal-id').value;
  const roomNo = document.getElementById('cs-room-no').value.trim();
  if (!roomNo) { showToast('호실 번호를 입력하세요.', 'danger'); return; }
  const type = document.getElementById('cs-room-type').value;
  const capacity = parseInt(document.getElementById('cs-room-cap').value) || (type === '1:1' ? 1 : (type === '1:4' ? 4 : (type === '1:8' ? 8 : 1)));
  const teacherNick = type === '1:1' ? (document.getElementById('cs-room-teacher')?.value || '') : '';
  if (teacherNick) {
    MOCK_CLASS_ROOMS.forEach(room => {
      if (room.type === '1:1' && room.teacherNick === teacherNick && String(room.id) !== String(id)) room.teacherNick = '';
    });
  }

  if (id) {
    const idx = MOCK_CLASS_ROOMS.findIndex(r => r.id === parseInt(id));
    if (idx >= 0) {
      Object.assign(MOCK_CLASS_ROOMS[idx], { roomNo, type, capacity, teacherNick, status: 'active' });
    }
    showToast(`✓ ${roomNo} 호실이 수정되었습니다.`, 'success');
  } else {
    const qtyInput = document.getElementById('cs-room-qty');
    const qty = (type === '1:1' && qtyInput) ? parseInt(qtyInput.value) || 1 : 1;

    if (qty > 1) {
      const generatedRoomNos = generateNextRoomNos(roomNo, qty);
      const duplicates = generatedRoomNos.filter(no => MOCK_CLASS_ROOMS.some(r => r.roomNo === no));
      if (duplicates.length > 0) {
        showToast(`오류: 이미 존재하는 호실이 포함되어 있습니다 (${duplicates.join(', ')}).`, 'danger');
        return;
      }
      generatedRoomNos.forEach((no, index) => {
        MOCK_CLASS_ROOMS.push({
          id: _csRoomNextId++,
          roomNo: no,
          type,
          capacity,
          teacherNick: index === 0 ? teacherNick : '',
          status: 'active'
        });
      });
      showToast(`✓ ${qty}개 호실이 일괄 추가되었습니다. (${generatedRoomNos[0]} ~ ${generatedRoomNos[qty-1]})`, 'success');
    } else {
      if (MOCK_CLASS_ROOMS.some(r => r.roomNo === roomNo)) {
        showToast(`오류: 이미 존재하는 호실 번호입니다 (${roomNo}).`, 'danger');
        return;
      }
      MOCK_CLASS_ROOMS.push({
        id: _csRoomNextId++,
        roomNo,
        type,
        capacity,
        teacherNick,
        status: 'active'
      });
      showToast(`✓ ${roomNo} 호실이 추가되었습니다.`, 'success');
    }
  }
  syncTeacherRoomsFromClassroomSettings();
  closeCsAddRoomModal();
  renderCsRooms();
}

// ── 기숙사 ERP (신규) ─────────────────────────────────
function openDormTemplateModal() {}
function openDormRoomModal() {}

function saveDormRoomIndividual() {
  const accom     = document.getElementById('tpl-accom')?.value;
  const capacity  = parseInt(document.getElementById('tpl-capacity')?.value);
  const condition = document.getElementById('tpl-condition')?.value;
  const roomNoInput = document.getElementById('tpl-roomno');
  const roomNo = (roomNoInput?.value || '').trim();

  if (roomNo && MOCK_DORM_ROOMS.some(r => r.roomNo === roomNo)) {
    showToast(`이미 등록된 호실 번호입니다. (${roomNo}호)`, 'warning');
    return;
  }

  const typeStr = `${capacity}인실 (${condition})`;
  MOCK_DORM_ROOMS.push({
    roomNo: roomNo || null,
    accomType: accom,
    type: typeStr,
    capacity: capacity,
    genderRestriction: '무관',
    beds: Array.from({ length: capacity }, (_, i) => ({
      id: String.fromCharCode(65 + i), // A, B, C, D
      student: null,
      studentId: null,
      start: null,
      end: null
    }))
  });

  // 템플릿 정보와 동기화
  if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();

  if (roomNoInput) roomNoInput.value = '';
  showToast(roomNo
    ? `✓ ${roomNo}호(${condition} · ${capacity}인실)가 등록되었습니다.`
    : `✓ ${condition} · ${capacity}인실 유형이 등록되었습니다. 호실 번호는 나중에 배정할 수 있습니다.`, 'success');
  renderAdminDormTemplates();
  if (typeof renderDormErpGrid === 'function') renderDormErpGrid();
}

let _editingDormRoomIdx = null;

function openEditDormRoomModal(idx) {
  _editingDormRoomIdx = idx;
  const room = MOCK_DORM_ROOMS[idx];
  if (!room) return;

  document.getElementById('edit-room-idx').value = idx;
  document.getElementById('edit-room-no').value = room.roomNo || '';
  document.getElementById('edit-room-accom').value = room.accomType || '기숙사';
  
  const conditionMatch = room.type ? room.type.match(/\(([^)]+)\)/) : null;
  const condition = conditionMatch ? conditionMatch[1] : '스탠다드';
  
  document.getElementById('edit-room-capacity').value = room.capacity || room.beds.length;
  document.getElementById('edit-room-condition').value = condition;

  openModal('dorm-room-edit-modal');
}

function saveDormRoomEdit() {
  const idx = parseInt(document.getElementById('edit-room-idx').value);
  const room = MOCK_DORM_ROOMS[idx];
  if (!room) return;

  const newCapacity = parseInt(document.getElementById('edit-room-capacity').value);
  const newCondition = document.getElementById('edit-room-condition').value;

  const oldCapacity = room.capacity || room.beds.length;
  if (newCapacity < oldCapacity) {
    for (let i = newCapacity; i < oldCapacity; i++) {
      const bed = room.beds[i];
      if (bed && (bed.student || bed.incoming)) {
        showToast(`수정 실패: 축소하려는 침대(${bed.id})에 배정된 학생이 있습니다.`, 'danger');
        return;
      }
    }
  }

  if (newCapacity < oldCapacity) {
    room.beds = room.beds.slice(0, newCapacity);
  } else if (newCapacity > oldCapacity) {
    for (let i = oldCapacity; i < newCapacity; i++) {
      room.beds.push({
        id: String.fromCharCode(65 + i),
        student: null,
        studentId: null,
        start: null,
        end: null
      });
    }
  }

  room.capacity = newCapacity;
  room.type = `${newCapacity}인실 (${newCondition})`;

  if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();
  closeModal('dorm-room-edit-modal');
  showToast('호실 정보가 수정되었습니다.', 'success');
  renderAdminDormTemplates();
  if (typeof renderDormErpGrid === 'function') renderDormErpGrid();
}

function deleteDormRoom(idx) {
  const room = MOCK_DORM_ROOMS[idx];
  if (!room) return;

  const occupied = room.beds && room.beds.some(b => b.student || b.incoming);
  if (occupied) {
    showToast('해당 호실에 배정된 학생이 있어 삭제할 수 없습니다.', 'danger');
    return;
  }

  const roomLabel = room.roomNo ? `${room.roomNo}호` : `미배정 ${room.capacity || room.beds?.length || 1}인실`;
  if (!confirm(`[${roomLabel}]을 삭제하시겠습니까?`)) return;

  MOCK_DORM_ROOMS.splice(idx, 1);
  if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();
  showToast('호실이 삭제되었습니다.', 'success');
  renderAdminDormTemplates();
  if (typeof renderDormErpGrid === 'function') renderDormErpGrid();
}

function assignDormRoomNumber(idx) {
  const room = MOCK_DORM_ROOMS[idx];
  if (!room) return;

  const input = prompt('배정할 호실 번호를 입력하세요.', room.roomNo || '');
  if (input === null) return;

  const roomNo = input.trim();
  if (!roomNo) {
    showToast('호실 번호를 입력하세요.', 'danger');
    return;
  }

  const duplicate = MOCK_DORM_ROOMS.some((item, itemIdx) => itemIdx !== idx && item.roomNo === roomNo);
  if (duplicate) {
    showToast(`이미 등록된 호실 번호입니다. (${roomNo}호)`, 'warning');
    return;
  }

  room.roomNo = roomNo;
  if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();
  showToast(`✓ ${roomNo}호가 배정되었습니다.`, 'success');
  renderAdminDormTemplates();
  if (typeof renderDormErpGrid === 'function') renderDormErpGrid();
}

function renderAdminDormTemplates() {
  const tbody = document.getElementById('admin-dorm-template-tbody');
  if (!tbody) return;

  tbody.innerHTML = [...MOCK_DORM_ROOMS].sort(compareDormRoomOrder).map((r) => {
    const originalIdx = MOCK_DORM_ROOMS.indexOf(r);
    const conditionMatch = r.type ? r.type.match(/\(([^)]+)\)/) : null;
    const condition = conditionMatch ? conditionMatch[1] : '스탠다드';
    const capacity = r.capacity || (r.beds ? r.beds.length : 1);

    const accomBadge = r.accomType === 'IT Park 콘도'
      ? `<span style="background:#FEF3C7;color:#D97706;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600">IT Park 콘도</span>`
      : `<span style="background:#EEF2FF;color:#5E5CE6;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600">가든 호텔</span>`;

    return `
      <tr>
        <td>${accomBadge}</td>
        <td>${capacity}인실</td>
        <td>${condition}</td>
        <td>${r.roomNo
          ? `<strong>${r.roomNo}호</strong>`
          : `<span style="background:#F3F4F6;color:#6B7280;padding:3px 8px;border-radius:5px;font-size:11px;font-weight:600">미배정</span>`}</td>
        <td style="text-align:center">
          <div style="display:flex;gap:5px;justify-content:center">
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openEditDormRoomModal(${originalIdx})">수정</button>
            <button class="tsa-btn tsa-btn-danger tsa-btn-xs" style="background:#EF4444;border:none;color:white;" onclick="deleteDormRoom(${originalIdx})">삭제</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function switchDormErpTab(tab) {
  document.getElementById('dorm-erp-panel-assign').style.display   = tab === 'assign'   ? '' : 'none';
  document.getElementById('dorm-erp-panel-gantt').style.display    = tab === 'gantt'    ? '' : 'none';
  document.getElementById('dorm-erp-panel-settings').style.display = tab === 'settings' ? '' : 'none';
  document.getElementById('dorm-erp-panel-master').style.display   = tab === 'master'   ? '' : 'none';
  document.getElementById('dorm-erp-panel-exposure').style.display = tab === 'exposure' ? '' : 'none';
  ['assign','gantt','settings','master','exposure'].forEach(t => {
    const btn = document.getElementById(`dorm-erp-tab-${t}`);
    if (!btn) return;
    btn.style.color = t === tab ? '#5E5CE6' : '#6B7280';
    btn.style.borderBottomColor = t === tab ? '#5E5CE6' : 'transparent';
  });
  if (tab === 'gantt') {
    renderDormErpAnnualGantt();
  } else if (tab === 'settings') {
    renderAdminDormTemplates();
    renderAdminDormRoomsTable();
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  } else if (tab === 'master') {
    renderDormMasterLists();
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  } else if (tab === 'exposure') {
    if (typeof renderDormAgencyVisibilitySettings === 'function') renderDormAgencyVisibilitySettings();
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }
}

/* =============================================
   기숙사 유형·인실·등급 마스터 풀 관리
   ============================================= */
let MOCK_DORM_MASTER_ACCOM_TYPES = [
  { name: '가든 호텔',    order: 1, visible: true },
  { name: 'IT Park 콘도', order: 2, visible: true },
];
let MOCK_DORM_MASTER_GRADES = [
  { name: '스탠다드', order: 1, visible: true },
  { name: '프리미엄', order: 2, visible: true },
  { name: '스위트', order: 3, visible: true },
];
let MOCK_DORM_MASTER_CAPACITIES = [1, 2, 3, 4].map((n, i) => ({ name: `${n}인실`, order: i + 1, visible: true }));

const _dormMasterDragSrc = { accom: null, grade: null, capacity: null };

// 배정 리스트 정렬 기준 통일: 숙소유형 → 등급 → 인실 → 호수
// 숙소유형/등급 순서는 '유형·인실·등급 설정'에서 관리자가 지정한 order를 그대로 따른다.
function getDormRoomGrade(room) {
  if (room.condition) return room.condition;
  const m = room.type ? room.type.match(/\(([^)]+)\)/) : null;
  return m ? m[1] : '스탠다드';
}

function compareDormRoomOrder(a, b) {
  const accomOrder = name => MOCK_DORM_MASTER_ACCOM_TYPES.find(i => i.name === name)?.order ?? 999;
  const gradeOrder = name => MOCK_DORM_MASTER_GRADES.find(i => i.name === name)?.order ?? 999;

  const accomCmp = accomOrder(a.accomType) - accomOrder(b.accomType);
  if (accomCmp !== 0) return accomCmp;

  const gradeCmp = gradeOrder(getDormRoomGrade(a)) - gradeOrder(getDormRoomGrade(b));
  if (gradeCmp !== 0) return gradeCmp;

  const capA = Number(a.capacity || (a.beds ? a.beds.length : 0));
  const capB = Number(b.capacity || (b.beds ? b.beds.length : 0));
  if (capA !== capB) return capA - capB;

  const na = parseInt(a.roomNo, 10), nb = parseInt(b.roomNo, 10);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb;
  return String(a.roomNo || '').localeCompare(String(b.roomNo || ''));
}

function _renderDormMasterTable(list, bodyId, key, labelFn) {
  const el = document.getElementById(bodyId);
  if (!el) return;
  list.sort((a, b) => a.order - b.order);
  el.innerHTML = list.map((item, idx) => {
    const visibleBadge = item.visible !== false
      ? `<span class="tsa-badge tsa-badge-success" style="cursor:pointer" onclick="toggleDormMasterVisibility('${key}', ${idx})">노출</span>`
      : `<span class="tsa-badge tsa-badge-danger" style="cursor:pointer" onclick="toggleDormMasterVisibility('${key}', ${idx})">비노출</span>`;
    return `
      <tr draggable="true"
          ondragstart="onDormMasterDragStart(event, '${key}', ${idx})"
          ondragover="onDormMasterDragOver(event)"
          ondrop="onDormMasterDrop(event, '${key}', ${idx})"
          ondragend="onDormMasterDragEnd(event)"
          style="cursor:grab">
        <td style="text-align:center;color:#9CA3AF"><i data-lucide="grip-vertical" style="width:14px;height:14px"></i></td>
        <td style="font-weight:700;color:#4B5563;font-size:12px">${item.order}</td>
        <td style="font-weight:600;font-size:12.5px">${labelFn(item)}</td>
        <td style="text-align:center">${visibleBadge}</td>
        <td style="text-align:center;color:#D1D5DB;font-size:11px">-</td>
      </tr>`;
  }).join('') || `<tr><td colspan="5" style="text-align:center;color:#9CA3AF;padding:14px;font-size:12px">등록된 항목이 없습니다.</td></tr>`;
}

const _dormMasterListMap = {
  accom:    () => MOCK_DORM_MASTER_ACCOM_TYPES,
  grade:    () => MOCK_DORM_MASTER_GRADES,
  capacity: () => MOCK_DORM_MASTER_CAPACITIES,
};

function renderDormMasterLists() {
  _renderDormMasterTable(MOCK_DORM_MASTER_ACCOM_TYPES,   'dorm-master-accom-list',    'accom',    i => i.name);
  _renderDormMasterTable(MOCK_DORM_MASTER_GRADES,        'dorm-master-grade-list',    'grade',    i => i.name);
  _renderDormMasterTable(MOCK_DORM_MASTER_CAPACITIES,    'dorm-master-capacity-list', 'capacity', i => i.name);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  refreshDormRegistrationSelects();
}

function toggleDormMasterVisibility(key, idx) {
  const list = _dormMasterListMap[key]();
  const item = list[idx];
  if (!item) return;
  item.visible = item.visible === false ? true : false;
  renderDormMasterLists();
  showToast(`✓ '${item.name}' 항목이 ${item.visible ? '노출' : '비노출'} 처리되었습니다.`, 'success');
}

function onDormMasterDragStart(ev, key, idx) {
  _dormMasterDragSrc[key] = idx;
  ev.dataTransfer.effectAllowed = 'move';
  ev.currentTarget.style.opacity = '0.4';
}
function onDormMasterDragOver(ev) {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
}
function onDormMasterDrop(ev, key, targetIdx) {
  ev.preventDefault();
  const srcIdx = _dormMasterDragSrc[key];
  if (srcIdx === null || srcIdx === targetIdx) return;
  const list = _dormMasterListMap[key]();
  const [moved] = list.splice(srcIdx, 1);
  list.splice(targetIdx, 0, moved);
  list.forEach((item, i) => { item.order = i + 1; });
  _dormMasterDragSrc[key] = null;
  renderDormMasterLists();
  showToast('✓ 우선순위가 변경되었습니다.', 'success');
}
function onDormMasterDragEnd(ev) {
  ev.currentTarget.style.opacity = '';
}

function refreshDormRegistrationSelects() {
  const accomSel = document.getElementById('tpl-accom');
  if (accomSel) {
    const cur = accomSel.value;
    accomSel.innerHTML = MOCK_DORM_MASTER_ACCOM_TYPES.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
    if (MOCK_DORM_MASTER_ACCOM_TYPES.some(i => i.name === cur)) accomSel.value = cur;
  }
  const gradeSel = document.getElementById('tpl-condition');
  if (gradeSel) {
    const cur = gradeSel.value;
    gradeSel.innerHTML = MOCK_DORM_MASTER_GRADES.map(i => `<option value="${i.name}">${i.name}</option>`).join('');
    if (MOCK_DORM_MASTER_GRADES.some(i => i.name === cur)) gradeSel.value = cur;
  }
  const capSel = document.getElementById('tpl-capacity');
  if (capSel) {
    const cur = capSel.value;
    capSel.innerHTML = MOCK_DORM_MASTER_CAPACITIES.map(i => {
      const num = parseInt(i.name);
      return `<option value="${num}">${i.name}</option>`;
    }).join('');
    capSel.value = cur;
  }
}

function addDormMasterAccomType() {
  const input = document.getElementById('dorm-master-accom-input');
  const val = input.value.trim();
  if (!val) return;
  if (MOCK_DORM_MASTER_ACCOM_TYPES.some(i => i.name === val)) { showToast('이미 등록된 유형입니다.', 'warning'); return; }
  MOCK_DORM_MASTER_ACCOM_TYPES.push({ name: val, order: MOCK_DORM_MASTER_ACCOM_TYPES.length + 1, visible: true });
  input.value = '';
  renderDormMasterLists();
  showToast(`✓ 숙소 유형 '${val}' 추가되었습니다.`, 'success');
}

function addDormMasterGrade() {
  const input = document.getElementById('dorm-master-grade-input');
  const val = input.value.trim();
  if (!val) return;
  if (MOCK_DORM_MASTER_GRADES.some(i => i.name === val)) { showToast('이미 등록된 등급입니다.', 'warning'); return; }
  MOCK_DORM_MASTER_GRADES.push({ name: val, order: MOCK_DORM_MASTER_GRADES.length + 1, visible: true });
  input.value = '';
  renderDormMasterLists();
  showToast(`✓ 등급 '${val}' 추가되었습니다.`, 'success');
}

function addDormMasterCapacity() {
  const input = document.getElementById('dorm-master-capacity-input');
  const val = parseInt(input.value);
  if (!val || val < 1) return;
  const label = `${val}인실`;
  if (MOCK_DORM_MASTER_CAPACITIES.some(i => i.name === label)) { showToast('이미 등록된 인실 기준입니다.', 'warning'); return; }
  MOCK_DORM_MASTER_CAPACITIES.push({ name: label, order: MOCK_DORM_MASTER_CAPACITIES.length + 1, visible: true });
  input.value = '';
  renderDormMasterLists();
  showToast(`✓ ${label} 기준이 추가되었습니다.`, 'success');
}
let _erpGenderFilter = '전체';
let _erpAccomFilter  = '전체';
let _erpCapFilter    = '전체';
let _erpAssignTarget = null; // { roomNo, bedId }

function shiftDormErpGanttPeriod(delta) {
  const yearInput = document.getElementById('erp-gantt-year');
  const monthSel = document.getElementById('erp-gantt-month');
  if (!yearInput) return;
  let year = parseInt(yearInput.value, 10) || 2026;
  let m = (parseInt(monthSel?.value, 10) || 1) + delta;
  if (m < 1) { m = 12; year = Math.max(2020, year - 1); }
  else if (m > 12) { m = 1; year = Math.min(2035, year + 1); }
  yearInput.value = year;
  if (monthSel) monthSel.value = m;
  renderDormErpAnnualGantt();
}

function getDormErpFilteredRooms() {
  let rooms = [...MOCK_DORM_ROOMS];
  if (_erpAccomFilter !== '전체') rooms = rooms.filter(r => r.accomType === _erpAccomFilter);
  if (_erpCapFilter !== '전체') rooms = rooms.filter(r => (r.capacity || r.beds?.length) === parseInt(_erpCapFilter));
  if (_erpGenderFilter !== '전체') rooms = rooms.filter(r => r.genderRestriction === '무관' || r.genderRestriction === _erpGenderFilter);
  return rooms.filter(r => r.roomNo).sort(compareDormRoomOrder);
}

function getDormErpAnnualFilteredRooms() {
  const accom = document.getElementById('erp-gantt-accom')?.value || '전체';
  const cap = document.getElementById('erp-gantt-cap')?.value || '전체';
  const gender = document.getElementById('erp-gantt-gender')?.value || '전체';
  return MOCK_DORM_ROOMS.filter(room => {
    if (!room.roomNo) return false;
    if (accom !== '전체' && room.accomType !== accom) return false;
    if (cap !== '전체' && (room.capacity || room.beds?.length) !== parseInt(cap, 10)) return false;
    if (gender !== '전체' && room.genderRestriction !== '무관' && room.genderRestriction !== gender) return false;
    return true;
  }).sort(compareDormRoomOrder);
}

function renderDormErpAnnualGantt() {
  const year = Math.max(2020, Math.min(2035, parseInt(document.getElementById('erp-gantt-year')?.value, 10) || 2026));
  const input = document.getElementById('erp-gantt-year');
  if (input) input.value = year;

  const monthVal = parseInt(document.getElementById('erp-gantt-month')?.value, 10) || 1;

  // 선택한 달의 전월 1일 ~ 익월 말일까지 3개월 고정 조회
  const rangeStart = new Date(year, monthVal - 2, 1);
  const rangeEnd = new Date(year, monthVal + 1, 0);
  const pad = n => String(n).padStart(2, '0');
  const startVal = `${rangeStart.getFullYear()}-${pad(rangeStart.getMonth() + 1)}-${pad(rangeStart.getDate())}`;
  const endVal = `${rangeEnd.getFullYear()}-${pad(rangeEnd.getMonth() + 1)}-${pad(rangeEnd.getDate())}`;

  renderDormErpGantt(getDormErpAnnualFilteredRooms(), startVal, endVal);
}

function renderDormErpGantt(rooms, startVal, endVal) {
  const wrap = document.getElementById('erp-dorm-gantt-wrap');
  if (!wrap) return;
  const start = new Date(`${startVal}T00:00:00`);
  const end = new Date(`${endVal}T00:00:00`);
  if (!startVal || !endVal || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    wrap.innerHTML = '<div class="tsa-card" style="padding:36px;text-align:center;color:#EF4444;font-size:12px">올바른 조회 시작일과 종료일을 선택해줘.</div>';
    return;
  }

  const dayMs = 86400000;
  const totalDays = Math.round((end - start) / dayMs) + 1;
  const dayWidth = totalDays > 300 ? 8 : totalDays > 100 ? 14 : totalDays > 62 ? 32 : 40;
  const trackWidth = Math.max(900, totalDays * dayWidth);
  const dateFromMd = (md) => {
    if (!md) return null;
    let d = new Date(`${start.getFullYear()}-${md}T00:00:00`);
    if (end.getFullYear() !== start.getFullYear() && d < start) {
      d = new Date(`${end.getFullYear()}-${md}T00:00:00`);
    }
    return d;
  };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const offset = date => Math.round((date - start) / dayMs);
  const genderPalette = {
    male: { active: '#0EA5E9', muted: '#DCE6F0', text: '#0369A1', border: '#7DD3FC' },
    female: { active: '#EC4899', muted: '#EADDE5', text: '#BE185D', border: '#F9A8D4' },
    neutral: { active: '#5E5CE6', muted: '#E2E8F0', text: '#64748B', border: '#CBD5E1' },
  };

  const weekdayLabels = ['일','월','화','수','목','금','토'];
  const dateItems = Array.from({ length: totalDays }, (_, idx) => {
    const d = new Date(start); d.setDate(start.getDate() + idx);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const showDay = totalDays <= 100 || d.getDate() === 1 || d.getDay() === 1;
    const showWeekday = dayWidth >= 24 && showDay;
    return `<div style="width:${dayWidth}px;min-width:${dayWidth}px;text-align:center;padding:5px 0;background:${weekend ? '#F8FAFC' : '#fff'};border-right:1px solid #F1F5F9">
      <div style="font-size:9px;font-weight:700;color:${weekend ? '#EF4444' : '#64748B'}">${showDay ? d.getDate() : ''}</div>
      ${showWeekday ? `<div style="font-size:8px;color:${weekend ? '#EF4444' : '#94A3B8'};margin-top:1px">${weekdayLabels[d.getDay()]}</div>` : ''}
    </div>`;
  }).join('');

  const monthCells = [];
  {
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    let monthIdx = 0;
    while (cursor <= end) {
      const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
      const visibleStart = monthStart < start ? start : monthStart;
      const visibleEnd = monthEnd > end ? end : monthEnd;
      const days = Math.round((visibleEnd - visibleStart) / dayMs) + 1;
      monthCells.push(`<div style="width:${days * dayWidth}px;min-width:${days * dayWidth}px;padding:6px 0;text-align:center;background:${monthIdx % 2 ? '#F8FAFC' : '#EEF2FF'};border-right:1px solid #CBD5E1;font-size:10.5px;font-weight:800;color:#475569">${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월</div>`);
      cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      monthIdx++;
    }
  }
  const months = monthCells.join('');

  const today = new Date('2026-07-13T00:00:00');
  const todayLine = today >= start && today <= end
    ? `<div class="erp-gantt-today" style="left:${offset(today) * dayWidth + dayWidth / 2}px" title="오늘"></div>` : '';

  // 주말(토/일) 컬럼 배경을 헤더뿐 아니라 각 침대 행 트랙 전체 높이에도 반복해서 표시
  const weekendBands = Array.from({ length: totalDays }, (_, idx) => {
    const d = new Date(start); d.setDate(start.getDate() + idx);
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    if (!weekend) return '';
    return `<div style="position:absolute;top:0;bottom:0;left:${idx * dayWidth}px;width:${dayWidth}px;background:#F8FAFC;z-index:0;pointer-events:none"></div>`;
  }).join('');

  const sortedRooms = [...rooms].sort(compareDormRoomOrder);

  const roomColWidth = 90;
  const bedColWidth = 120;

  const rows = sortedRooms.map((room, ridx) => {
    const bandBg = ridx % 2 ? '#FAFBFF' : '#fff';
    const beds = room.beds || [];
    const roomIdx = MOCK_DORM_ROOMS.indexOf(room);

    const bedRows = beds.map(bed => {
      const assignments = [];
      if (bed.student && bed.start && bed.end) assignments.push({ student: bed.student, start: bed.start, end: bed.end, status: 'occupied' });
      (bed.reservations || []).forEach(rv => assignments.push({ ...rv, status: 'reserved' }));
      (bed.history || []).forEach(h => assignments.push({ ...h, status: 'history' }));

      // 같은 침대에서 기간이 겹치면 확정 배정/이력 우선, 중복 예약은 간트에서 제외한다.
      const priority = { occupied: 0, history: 1, reserved: 2 };
      const candidates = assignments.map(item => {
        const itemStart = dateFromMd(item.start);
        const itemEnd = dateFromMd(item.end);
        if (!itemStart || !itemEnd || itemEnd < start || itemStart > end) return null;
        const leftDays = clamp(offset(itemStart), 0, totalDays - 1);
        const rightDays = clamp(offset(itemEnd), 0, totalDays - 1);
        return { item, leftDays, rightDays };
      }).filter(Boolean).sort((a, b) => (priority[a.item.status] ?? 9) - (priority[b.item.status] ?? 9));

      const resolved = [];
      candidates.forEach(candidate => {
        const overlapsAccepted = resolved.some(accepted =>
          candidate.leftDays <= accepted.rightDays && candidate.rightDays >= accepted.leftDays
        );
        if (!overlapsAccepted) resolved.push(candidate);
      });
      resolved.sort((a, b) => a.leftDays - b.leftDays);

      const bars = resolved.map(({ item, leftDays, rightDays }) => {
        const left = leftDays * dayWidth + 2;
        const width = Math.max(dayWidth - 4, (rightDays - leftDays + 1) * dayWidth - 4);
        const assignedStudent = MOCK_STUDENTS.find(student =>
          (item.studentId && student.id === item.studentId) ||
          String(item.student || '').includes(student.nick) ||
          String(item.student || '').includes(student.name)
        );
        const genderValue = assignedStudent?.gender || room.genderRestriction || '';
        const genderKey = /^(남|남성|male)$/i.test(genderValue) ? 'male' : /^(여|여성|female)$/i.test(genderValue) ? 'female' : 'neutral';
        const palette = genderPalette[genderKey];
        const color = item.status === 'occupied' ? palette.active : palette.muted;
        // 닉네임 (여권이름) · 국적 · 성별 · 나이까지 표시 — 학생 레코드를 못 찾으면 기존 문자열 그대로
        const studentProfile = assignedStudent
          ? `${assignedStudent.nick} (${assignedStudent.name}) · ${assignedStudent.nationality || '-'} · ${/^남/.test(assignedStudent.gender || '') ? '남성' : '여성'} · ${assignedStudent.age ? assignedStudent.age + '세' : '-'}`
          : String(item.student || '배정');
        const label = String(item.student || '배정').split(' ')[0];
        const barText = assignedStudent
          ? `${assignedStudent.nick} (${assignedStudent.name}) · ${assignedStudent.nationality || '-'} · ${/^남/.test(assignedStudent.gender || '') ? '남' : '여'} · ${assignedStudent.age ? assignedStudent.age + '세' : '-'}`
          : label;
        const extraStyle = item.status === 'reserved' ? `border:2px dashed ${palette.border};background:${palette.muted};color:${palette.text};`
          : item.status === 'history' ? `background:${palette.muted};color:${palette.text};opacity:.9;`
          : '';
        const tooltip = item.status === 'history'
          ? `${studentProfile} · ${start.getFullYear()}-${item.start} ~ ${start.getFullYear()}-${item.end} (퇴소: ${item.reason || '-'})`
          : `${studentProfile} · ${start.getFullYear()}-${item.start} ~ ${start.getFullYear()}-${item.end}`;
        return `<div class="erp-gantt-bar" style="left:${left}px;width:${width}px;background:${color};${extraStyle}cursor:pointer" title="${tooltip}" onclick="openRoomDetailModal(${roomIdx})">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.status === 'reserved' ? '예약' : barText}</span><span style="font-size:9px;opacity:.85;flex-shrink:0">${item.start}~${item.end}</span>
        </div>`;
      }).join('');

      return `<div class="erp-gantt-row" style="background:${bandBg}">
        <div style="position:sticky;left:${roomColWidth}px;z-index:2;width:${bedColWidth}px;min-width:${bedColWidth}px;padding:6px 10px;background:${bandBg};border-right:1px solid #E5E7EB;display:flex;align-items:center;justify-content:space-between;gap:4px">
          <div style="min-width:0">
            <div style="font-size:11px;font-weight:700;color:#475569">침대 ${bed.id}</div>
            <div style="font-size:9.5px;color:#94A3B8;margin-top:1px">${bed.student ? String(bed.student).split(' ')[0] : '공실'}</div>
          </div>
          <button onclick="openErpAssignModal('${room.roomNo}','${bed.id}','${room.accomType}','${room.type}','${room.genderRestriction || '무관'}')" title="배정/예약 추가" style="flex-shrink:0;width:20px;height:20px;border:1px solid #10B981;border-radius:5px;background:#D1FAE5;color:#059669;font-size:13px;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center;padding:0">+</button>
        </div>
        <div class="erp-gantt-track" style="width:${trackWidth}px;min-width:${trackWidth}px;background-size:${dayWidth}px 100%">${weekendBands}${todayLine}${bars}</div>
      </div>`;
    }).join('');

    return `<div style="display:flex;border-top:2px solid #E2E8F0;min-height:${Math.max(1, beds.length) * 38}px">
      <div style="position:sticky;left:0;z-index:3;width:${roomColWidth}px;min-width:${roomColWidth}px;max-width:${roomColWidth}px;background:${bandBg};border-right:1px solid #E5E7EB;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px;overflow:hidden">
        <div style="width:100%;min-width:0;overflow:hidden" title="${room.roomNo}호 · ${room.accomType} · ${room.genderRestriction || '무관'}">
          <div style="font-size:12px;font-weight:800;color:#111827">${room.roomNo}호</div>
          <div style="font-size:8.5px;color:#64748B;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${room.accomType} · ${room.genderRestriction || '무관'}</div>
        </div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column">
        ${bedRows}
      </div>
    </div>`;
  }).join('');

  wrap.innerHTML = `<div class="erp-gantt-shell">
    <div style="padding:12px 16px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <strong style="font-size:13px;color:#111827">침대별 배정 일정</strong>
      <span style="font-size:11px;color:#64748B">${startVal} ~ ${endVal} · ${rooms.length}개 호실 · ${rows ? '침대별 일정' : '배정 없음'}</span>
      <div style="margin-left:auto;display:flex;gap:10px;font-size:10.5px;color:#64748B;flex-wrap:wrap">
        <span style="color:#0369A1">● 남성 입실</span><span style="color:#647F99">◆ 남성 예약·이력</span>
        <span style="color:#BE185D">● 여성 입실</span><span style="color:#A56A87">◆ 여성 예약·이력</span>
        <span style="color:#EF4444">│ 오늘</span>
      </div>
    </div>
    <div class="erp-gantt-scroll">
      <div style="display:flex;position:sticky;top:0;z-index:4;border-bottom:1px solid #E5E7EB">
        <div class="erp-gantt-room-cell" style="z-index:5;background:#F8FAFC;font-size:11px;font-weight:800;color:#475569">객실 / 침대</div>
        <div style="width:${trackWidth}px;min-width:${trackWidth}px"><div style="display:flex">${months}</div><div style="display:flex">${dateItems}</div></div>
      </div>
      ${rows || '<div style="padding:50px;text-align:center;color:#94A3B8;font-size:12px">조건에 맞는 배정 데이터가 없어.</div>'}
    </div>
  </div>`;
}

function setErpGenderFilter(btn, val) {
  _erpGenderFilter = val;
  document.querySelectorAll('[id^="erp-gf-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDormErpGrid();
}
function setErpAccomFilter(btn, val) {
  _erpAccomFilter = val;
  document.querySelectorAll('[id^="erp-accom-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDormErpGrid();
}
function setErpCapFilter(btn, val) {
  _erpCapFilter = val;
  document.querySelectorAll('[id^="erp-cap-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDormErpGrid();
}
function renderDormErpGrid() {
  const grid = document.getElementById('erp-dorm-room-grid');
  if (!grid) return;

  const startVal = document.getElementById('erp-dorm-start')?.value;
  const endVal   = document.getElementById('erp-dorm-end')?.value;
  const searchStart = startVal ? new Date(startVal) : null;
  const searchEnd   = endVal   ? new Date(endVal)   : null;

  function isOverlap(bedStart, bedEnd) {
    if (!searchStart || !searchEnd) return !!bedStart;
    if (!bedStart) return false;
    const bs = new Date(`2026-${bedStart}`);
    const be = bedEnd ? new Date(`2026-${bedEnd}`) : new Date('2026-12-31');
    return bs <= searchEnd && be >= searchStart;
  }

  let rooms = getDormErpFilteredRooms();


  // KPI 계산
  let kpiTotal = 0, kpiOccupied = 0, kpiVacant = 0;
  rooms.forEach(r => (r.beds||[]).forEach(b => {
    kpiTotal++;
    if (isOverlap(b.start, b.end)) kpiOccupied++; else kpiVacant++;
  }));
  const kpiWaiting = MOCK_STUDENTS.filter(s => s.dorm === '미배정' && s.remittanceStatus === 'paid' && s.dormAccomType).length;
  document.getElementById('erp-kpi-total')    && (document.getElementById('erp-kpi-total').textContent    = kpiTotal);
  document.getElementById('erp-kpi-occupied') && (document.getElementById('erp-kpi-occupied').textContent = kpiOccupied);
  document.getElementById('erp-kpi-vacant')   && (document.getElementById('erp-kpi-vacant').textContent   = kpiVacant);
  document.getElementById('erp-kpi-waiting')  && (document.getElementById('erp-kpi-waiting').textContent  = kpiWaiting + '명');

  const summaryEl = document.getElementById('erp-dorm-summary');
  if (summaryEl) summaryEl.textContent = `총 ${rooms.length}개 호실 · 공실 ${kpiVacant}침대`;


  // 유형별 그룹
  const groups = {};
  rooms.forEach(r => {
    const key = `${r.accomType}__${r.type}`;
    if (!groups[key]) groups[key] = { accomType: r.accomType, type: r.type, capacity: r.capacity, rooms: [] };
    groups[key].rooms.push(r);
  });

  const accomColor = { '기숙사': '#5E5CE6', '콘도': '#8B5CF6' };
  const genderIcon  = { '남성': '♂', '여성': '♀', '무관': '⚥' };
  const genderColor = { '남성': '#0EA5E9', '여성': '#EC4899', '무관': '#6B7280' };

  if (Object.keys(groups).length === 0) {
    grid.innerHTML = `<div style="text-align:center;padding:60px;color:#9CA3AF;font-size:13px">조건에 맞는 호실이 없습니다.</div>`;
    renderErpWaitingList();
    return;
  }

  grid.innerHTML = Object.values(groups).map(g => {
    const color = accomColor[g.accomType] || '#5E5CE6';
    let gTotal = 0, gVacant = 0, gOccupied = 0, gIncoming = 0;
    g.rooms.forEach(r => (r.beds||[]).forEach(b => {
      gTotal++;
      if (isOverlap(b.start, b.end)) gOccupied++;
      else if (b.incoming) gIncoming++;
      else gVacant++;
    }));

    const roomCards = g.rooms.map(r => {
      const gr = r.genderRestriction || '무관';
      const beds = (r.beds||[]).map(b => {
        const occupied = isOverlap(b.start, b.end);
        const hasIncoming = !occupied && b.incoming;
        let bedBg, bedBorder, bedContent, clickHandler;

        if (occupied) {
          bedBg = '#F3F4F6'; bedBorder = '#D1D5DB';
          const studentName = b.student ? b.student.split(' ')[0] : '사용 중';
          bedContent = `
            <div style="font-size:11px;font-weight:600;color:#374151">${studentName}</div>
            <div style="font-size:9.5px;color:#6B7280;margin-top:2px;line-height:1.35">
              <div><span style="color:#9CA3AF">입실</span> ${b.start || '-'}</div>
              <div><span style="color:#9CA3AF">퇴실</span> ${b.end || '-'}</div>
            </div>
            <button onclick="openErpReleaseModal('${r.roomNo}','${b.id}')" style="margin-top:4px;font-size:10px;padding:2px 6px;border:1px solid #EF4444;border-radius:4px;background:#FEF2F2;color:#EF4444;cursor:pointer;width:100%">해제</button>`;
          clickHandler = '';
        } else if (hasIncoming) {
          bedBg = '#FEF3C7'; bedBorder = '#FCD34D';
          bedContent = `
            <div style="font-size:11px;font-weight:600;color:#D97706">입실 예정</div>
            <div style="font-size:10px;color:#D97706">${b.incoming.date}</div>
            <div style="font-size:10px;color:#9CA3AF">${b.incoming.student ? b.incoming.student.split(' ')[0] : ''}</div>`;
          clickHandler = '';
        } else {
          bedBg = '#F0FDF4'; bedBorder = '#6EE7B7';
          bedContent = `
            <div style="font-size:11px;font-weight:700;color:#10B981">공 실</div>
            <button onclick="openErpAssignModal('${r.roomNo}','${b.id}','${r.accomType}','${r.type}','${gr}')" style="margin-top:4px;font-size:10px;padding:2px 6px;border:1px solid #10B981;border-radius:4px;background:#D1FAE5;color:#059669;cursor:pointer;width:100%">배정하기</button>`;
          clickHandler = '';
        }

        return `<div style="border:1.5px solid ${bedBorder};border-radius:8px;background:${bedBg};padding:8px 10px;min-width:85px;flex:1;text-align:center">
          <div style="font-size:10px;color:#6B7280;margin-bottom:4px">침대 ${b.id}</div>
          ${bedContent}
        </div>`;
      }).join('');

      const roomIdx = MOCK_DORM_ROOMS.indexOf(r);
      if (!r.roomNo) {
        return `<div style="background:#F9FAFB;border:1.5px dashed #D1D5DB;border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-height:100px">
          <div style="font-size:12px;color:#9CA3AF">${g.type} · 미배정 호실</div>
          <button onclick="openAssignRoomNumber(${roomIdx})" style="font-size:12px;font-weight:600;padding:6px 16px;border:1.5px solid #5E5CE6;border-radius:8px;background:#EEF2FF;color:#5E5CE6;cursor:pointer">🏠 호실 번호 배정</button>
        </div>`;
      }
      return `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:13px;font-weight:800;color:#111827">${r.roomNo}호</span>
            <span style="font-size:11px;color:${genderColor[gr]};font-weight:600">${genderIcon[gr]} ${gr}</span>
          </div>
          <button onclick="openRoomDetailModal(${roomIdx})" style="font-size:11px;padding:3px 10px;border:1px solid #D1D5DB;border-radius:6px;background:#F9FAFB;color:#374151;cursor:pointer;white-space:nowrap">상세보기</button>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${beds}</div>
      </div>`;
    }).join('');

    const statusColor = gVacant > 0 ? '#10B981' : '#EF4444';
    const statusLabel = gVacant > 0 ? `공실 ${gVacant}` : '만실';

    return `<div style="border-radius:12px;border:1px solid #E5E7EB;overflow:hidden">
      <div style="background:#F8F9FF;border-bottom:1px solid #E5E7EB;padding:12px 18px;display:flex;align-items:center;gap:10px">
        <span style="font-size:11px;font-weight:700;color:${color};background:${color}15;padding:2px 10px;border-radius:10px">${g.accomType}</span>
        <span style="font-size:13px;font-weight:700;color:#111827">${g.type}</span>
        <div style="margin-left:auto;display:flex;gap:16px;align-items:center">
          <span style="font-size:11.5px;color:#6B7280">총 ${gTotal}침대</span>
          <span style="font-size:11.5px;color:#374151">사용 중 <b>${gOccupied}</b></span>
          ${gIncoming > 0 ? `<span style="font-size:11.5px;color:#D97706">입실예정 <b>${gIncoming}</b></span>` : ''}
          <span style="font-size:12px;font-weight:700;color:${statusColor};background:${statusColor}15;padding:3px 12px;border-radius:10px">${statusLabel}</span>
        </div>
      </div>
      <div style="padding:14px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px">
        ${roomCards}
      </div>
    </div>`;
  }).join('');

  renderErpWaitingList();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function renderErpWaitingList() {
  const tbody = document.getElementById('erp-waiting-tbody');
  const countEl = document.getElementById('erp-waiting-count');
  if (!tbody) return;
  const waiting = MOCK_STUDENTS.filter(s => s.dorm === '미배정' && s.remittanceStatus === 'paid' && s.dormAccomType);
  if (countEl) countEl.textContent = `전체 ${waiting.length}명`;
  if (waiting.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:#9CA3AF">배정 대기 학생이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = waiting.map(s => `<tr>
    <td><strong>${s.nick}</strong> <span style="font-size:11px;color:#6B7280">${s.name}</span></td>
    <td>${s.flag || ''} ${s.nationality}</td>
    <td style="color:${s.gender==='남'?'#0EA5E9':'#EC4899'}">${s.gender === '남' ? '♂ 남성' : '♀ 여성'}</td>
    <td style="font-size:11.5px">${[s.dormAccomType, s.dormType, s.dormGrade].filter(Boolean).join(' · ')}</td>
    <td style="font-size:11.5px;color:#6B7280">${s.dormIn || '-'}</td>
    <td style="font-size:11.5px;color:#6B7280">${s.agency || '-'}</td>
    <td><button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="openErpAssignModalForStudent(${s.id})">배정</button></td>
  </tr>`).join('');
}

let _erpAssignWaitingList = [];

function openErpAssignModal(roomNo, bedId, accomType, roomType, gender) {
  _erpAssignTarget = { roomNo, bedId };
  const infoEl = document.getElementById('erp-assign-bed-info');
  if (infoEl) infoEl.innerHTML = `<b>${roomNo}호</b> · 침대 ${bedId} &nbsp;|&nbsp; ${accomType} ${roomType} &nbsp;|&nbsp; ${gender}`;
  document.getElementById('erp-assign-modal-title').textContent = `${roomNo}호 침대 ${bedId} 배정`;
  // 조건 맞는 대기 학생 필터
  _erpAssignWaitingList = MOCK_STUDENTS.filter(s => s.dorm === '미배정' && s.remittanceStatus === 'paid' && s.dormAccomType === accomType);
  const searchEl = document.getElementById('erp-assign-student-search');
  if (searchEl) searchEl.value = '';
  renderErpAssignStudentList(_erpAssignWaitingList);
  // 날짜 기본값: 필터 날짜
  const dateIn  = document.getElementById('erp-assign-date-in');
  const dateOut = document.getElementById('erp-assign-date-out');
  if (dateIn)  dateIn.value  = document.getElementById('erp-dorm-start')?.value || '';
  if (dateOut) dateOut.value = document.getElementById('erp-dorm-end')?.value   || '';
  document.getElementById('erp-assign-modal').style.display = 'block';
  document.getElementById('erp-assign-backdrop').style.display = 'block';
}

function renderErpAssignStudentList(list) {
  const listEl = document.getElementById('erp-assign-student-list');
  if (!listEl) return;
  if (list.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:20px;color:#9CA3AF;font-size:12px">배정 가능한 대기 학생이 없습니다.</div>`;
    return;
  }
  listEl.innerHTML = list.map(s => {
    const avatarSrc = (s.gender === '남' || s.gender === '남성') ? 'assets/images/student_male.png' : 'assets/images/student_female.png';
    const preferredDormIn = s.dormIn || s.startDate || '';
    const preferredDormOut = s.dormOut || s.endDate || '';
    return `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid #E5E7EB;border-radius:8px;cursor:pointer;transition:border-color 0.15s" onmouseover="this.style.borderColor='#5E5CE6'" onmouseout="this.style.borderColor='#E5E7EB'">
      <input type="radio" name="erp-assign-student" value="${s.id}" style="accent-color:#5E5CE6" onchange="onErpAssignStudentSelected(${s.id})"/>
      <img src="${avatarSrc}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0" alt=""/>
      <div style="flex:1">
        <div style="font-size:12.5px;font-weight:600;color:#111827">${s.nick} <span style="font-size:11px;color:#6B7280">${s.name}</span></div>
        <div style="font-size:11px;color:#6B7280">${s.flag||''} ${s.nationality} · ${s.gender==='남'?'남성':'여성'} · ${[s.dormType, s.dormGrade].filter(Boolean).join(' ')}</div>
        <div style="font-size:10.5px;color:#5E5CE6;margin-top:3px;font-weight:600">📅 희망 입실일 ${preferredDormIn || '미입력'} ~ 퇴실일 ${preferredDormOut || '미입력'}</div>
      </div>
      <span style="font-size:11px;color:#D97706;background:#FEF3C7;padding:2px 8px;border-radius:8px">대기</span>
    </label>`;
  }).join('');
}

function filterErpAssignStudentList() {
  const term = (document.getElementById('erp-assign-student-search')?.value || '').trim().toLowerCase();
  const filtered = term
    ? _erpAssignWaitingList.filter(s => (s.name && s.name.toLowerCase().includes(term)) || (s.nick && s.nick.toLowerCase().includes(term)))
    : _erpAssignWaitingList;
  renderErpAssignStudentList(filtered);
}

function onErpAssignStudentSelected(studentId) {
  const s = MOCK_STUDENTS.find(x => x.id === studentId);
  if (!s) return;
  const dateIn  = document.getElementById('erp-assign-date-in');
  const dateOut = document.getElementById('erp-assign-date-out');
  if (dateIn  && (s.dormIn || s.startDate)) dateIn.value  = s.dormIn || s.startDate;
  if (dateOut && (s.dormOut || s.endDate))  dateOut.value = s.dormOut || s.endDate;
}

function openErpAssignModalForStudent(studentId) {
  const s = MOCK_STUDENTS.find(x => x.id === studentId);
  if (!s || !s.dormAccomType) return;
  // 조건 맞는 공실 침대 찾기
  const startVal = document.getElementById('erp-dorm-start')?.value;
  const endVal   = document.getElementById('erp-dorm-end')?.value;
  const ss = startVal ? new Date(startVal) : null;
  const se = endVal   ? new Date(endVal)   : null;
  function isOverlap(bs, be) {
    if (!ss || !se || !bs) return !!bs;
    const bss = new Date(`2026-${bs}`);
    const bee = be ? new Date(`2026-${be}`) : new Date('2026-12-31');
    return bss <= se && bee >= ss;
  }
  let found = null;
  for (const r of MOCK_DORM_ROOMS) {
    if (!r.roomNo || r.accomType !== s.dormAccomType) continue;
    for (const b of (r.beds||[])) {
      if (!isOverlap(b.start, b.end) && !b.incoming) { found = { r, b }; break; }
    }
    if (found) break;
  }
  if (!found) { showToast('조건에 맞는 공실이 없습니다.', 'warning'); return; }
  openErpAssignModal(found.r.roomNo, found.b.id, found.r.accomType, found.r.type, found.r.genderRestriction);
  // 해당 학생 자동 선택
  setTimeout(() => {
    const radio = document.querySelector(`input[name="erp-assign-student"][value="${studentId}"]`);
    if (radio) {
      radio.checked = true;
      onErpAssignStudentSelected(studentId);
    }
  }, 50);
}

function closeErpAssignModal() {
  document.getElementById('erp-assign-modal').style.display = 'none';
  document.getElementById('erp-assign-backdrop').style.display = 'none';
  _erpAssignTarget = null;
}

function confirmErpAssign() {
  const radio = document.querySelector('input[name="erp-assign-student"]:checked');
  if (!radio) { showToast('학생을 선택하세요.', 'warning'); return; }
  if (!_erpAssignTarget) return;
  const startFull = document.getElementById('erp-assign-date-in')?.value || '';
  const endFull   = document.getElementById('erp-assign-date-out')?.value || '';
  if (!startFull || !endFull) { showToast('입실일과 퇴실일을 입력하세요.', 'danger'); return; }
  const studentId = parseInt(radio.value);
  const s = MOCK_STUDENTS.find(x => x.id === studentId);
  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === _erpAssignTarget.roomNo);
  const bed  = room?.beds?.find(b => b.id === _erpAssignTarget.bedId);
  if (!s || !room || !bed) return;
  const startVal = startFull.replace('2026-','');
  const endVal   = endFull.replace('2026-','');
  if (!bed.history) bed.history = [];

  if (bed.student) {
    // 이미 배정된 침대 — 기존 배정을 덮어쓰지 않고 예약으로 추가
    if (!bed.reservations) bed.reservations = [];
    bed.reservations.push({ student: `${s.nick} (${s.name})`, start: startVal, end: endVal });
    showToast(`✓ ${s.nick} → ${room.roomNo}호 침대${bed.id} 예약 완료 (${startVal}~${endVal})`, 'success');
  } else {
    bed.student   = `${s.nick} (${s.name})`;
    bed.studentId = s.id;
    bed.start     = startVal;
    bed.end       = endVal;
    bed.color     = '#5E5CE6';
    s.dorm = `${room.roomNo}호 침대${bed.id}`;
    // 8-5: 배정 시 호실 성별 제한 자동 갱신
    if (s.gender === '남' || s.gender === '남성') room.genderRestriction = '남성';
    else if (s.gender === '여' || s.gender === '여성') room.genderRestriction = '여성';
    showToast(`✓ ${s.nick} → ${room.roomNo}호 침대${bed.id} 배정 완료`, 'success');
  }
  closeErpAssignModal();
  renderDormErpGrid();
  if (typeof renderDormErpAnnualGantt === 'function') renderDormErpAnnualGantt();
}

function openErpReleaseModal(roomNo, bedId) {
  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  const bed  = room?.beds?.find(b => b.id === bedId);
  if (!bed) return;
  const s = MOCK_STUDENTS.find(x => x.id === bed.studentId);
  if (s) s.dorm = '미배정';
  if (bed.history && bed.student) {
    bed.history.push({ student: bed.student, start: bed.start, end: bed.end, reason: '배정 해제' });
  }
  bed.student = null; bed.studentId = null; bed.start = null; bed.end = null; bed.color = null;
  showToast('배정이 해제되었습니다.', 'success');
  renderDormErpGrid();
  if (typeof renderDormErpAnnualGantt === 'function') renderDormErpAnnualGantt();
}

function closeErpReleaseModal() {
  document.getElementById('erp-release-modal').style.display = 'none';
  document.getElementById('erp-release-backdrop').style.display = 'none';
  _erpAssignTarget = null;
}

function confirmErpRelease() {
  // 사용되지 않음
}
// ── 기숙사 ERP 끝 ──────────────────────────────────────

function renderClassroomStatus() {
  const grid = document.getElementById('classroom-status-grid');
  if (!grid) return;

  const timeEl = document.getElementById('classroom-status-time');
  if (timeEl) timeEl.textContent = `마지막 업데이트: ${new Date().toLocaleTimeString('ko-KR', {hour:'2-digit',minute:'2-digit'})}`;

  const PERIOD_TIMES = ['','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00'];
  const now = new Date();
  const currentHour = now.getHours();
  const currentPeriod = PERIOD_TIMES.findIndex((t, i) => {
    if (i === 0) return false;
    const h = parseInt(t.split(':')[0]);
    return currentHour >= h && currentHour < h + 1;
  });

  const activeTeachers = MOCK_TEACHERS.filter(t => t.status !== 'resigned');

  grid.innerHTML = activeTeachers.map(teacher => {
    const tData = MOCK_TIMETABLE.find(m => m.teacher === teacher.nick);
    const isOnLeave = teacher.status === 'leave';
    const color = tData?.color || '#6B7280';
    const bg = tData?.bg || '#F3F4F6';

    // 현재 교시 수업
    const currentSlot = (tData && currentPeriod > 0) ? tData.slots.find(s => s.p === currentPeriod) : null;
    const isInClass = !isOnLeave && currentSlot?.student;

    // 오늘 전체 슬롯
    const totalSlots = tData ? tData.slots.length : 0;
    const filledSlots = tData ? tData.slots.filter(s => s.student).length : 0;

    // 상태 배지
    let statusBadge, statusColor;
    if (isOnLeave) {
      statusBadge = '휴가 중'; statusColor = '#6B7280';
    } else if (isInClass) {
      statusBadge = '수업 중'; statusColor = '#16A34A';
    } else {
      statusBadge = '대기 중'; statusColor = '#D97706';
    }

    // 슬롯 바
    const slotBars = tData ? tData.slots.map(s => {
      const isCurrent = s.p === currentPeriod;
      const hasClass = !!s.student;
      const barColor = isCurrent && hasClass ? color : hasClass ? color + '99' : '#E5E7EB';
      return `<div title="${PERIOD_TIMES[s.p] || ''} ${s.student || '공강'}" style="flex:1;height:8px;border-radius:2px;background:${barColor};${isCurrent ? 'outline:2px solid ' + color + ';outline-offset:1px' : ''}"></div>`;
    }).join('') : '';

    return `
    <div class="tsa-card" style="border-top:3px solid ${color};position:relative">
      <div class="tsa-card-body" style="padding:16px">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
          <div>
            <div style="font-size:13px;font-weight:700;color:#111827">${teacher.room}</div>
            <div style="font-size:12px;color:#6B7280;margin-top:2px">${teacher.type}</div>
          </div>
          <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;background:${statusColor}18;color:${statusColor}">${statusBadge}</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="width:40px;height:40px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:${color}">
            ${teacher.nick.charAt(0)}
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#111827">${teacher.nick}</div>
            <div style="font-size:11px;color:#6B7280">${teacher.name}</div>
          </div>
        </div>
        ${isInClass ? `
        <div style="background:${bg};border-radius:8px;padding:8px 12px;margin-bottom:12px">
          <div style="font-size:11px;color:#6B7280;margin-bottom:2px">${PERIOD_TIMES[currentPeriod]} 현재 수업</div>
          <div style="font-size:12px;font-weight:700;color:${color}">${currentSlot.student}</div>
          ${currentSlot.type ? `<div style="font-size:11px;color:#6B7280">${currentSlot.type}${currentSlot.subject ? ' · ' + currentSlot.subject : ''}</div>` : ''}
        </div>` : isOnLeave ? `
        <div style="background:#F3F4F6;border-radius:8px;padding:8px 12px;margin-bottom:12px;text-align:center">
          <div style="font-size:12px;color:#6B7280">오늘 휴가</div>
        </div>` : `
        <div style="background:#F9FAFB;border-radius:8px;padding:8px 12px;margin-bottom:12px;text-align:center">
          <div style="font-size:12px;color:#9CA3AF">현재 공강</div>
        </div>`}
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:11px;color:#6B7280">오늘 수업</span>
            <span style="font-size:11px;font-weight:700;color:#374151">${filledSlots} / ${totalSlots} 교시</span>
          </div>
          <div style="display:flex;gap:2px">${slotBars}</div>
        </div>
      </div>
    </div>`;
  }).join('');

  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function renderTimetable(conflictMode) {
  const container = document.getElementById('timetable-grid-container');
  if (!container) return;

  const activeTeachers = MOCK_TEACHERS.filter(t => t.status !== 'resigned');

  // 슬롯 기준으로 판별 — 1:1 슬롯이 하나라도 있으면 1:1 탭에, 그룹 슬롯이 하나라도 있으면 그룹 탭에 표시
  function has1on1Slot(teacher) {
    const entry = MOCK_TIMETABLE.find(t => t.teacher === teacher.nick);
    if (!entry) return !isGroupTeacher(teacher); // 슬롯 없으면 전문분야로 판단
    return entry.slots.some(s => s.student && !isGroupSlot(s));
  }
  function hasGroupSlot(teacher) {
    const entry = MOCK_TIMETABLE.find(t => t.teacher === teacher.nick);
    if (!entry) return isGroupTeacher(teacher);
    return entry.slots.some(s => isGroupSlot(s));
  }

  const solo1on1Teachers = activeTeachers.filter(t => has1on1Slot(t));
  const groupTeachers    = activeTeachers.filter(t => hasGroupSlot(t));

  const day  = APP.selectedDay || '월';
  const days = ['월', '화', '수', '목', '금', '토'];
  const week = getWeekDates(APP.selectedWeek || 0);

  const periods = buildBellSchedule(APP.bellSystem);
  const realPeriods = periods.filter(p => p.p !== 'lunch');

  function typeTagStyle(type) {
    if (type.includes('IELTS'))   return 'background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE';
    if (type.includes('일반'))    return 'background:#E0F2FE;color:#0284C7;border:1px solid #BAE6FD';
    if (type.includes('그룹'))    return 'background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0';
    if (type.includes('주니어'))  return 'background:#FEF3C7;color:#D97706;border:1px solid #FDE68A';
    if (type.includes('비즈니스'))return 'background:#FDF2F8;color:#DB2777;border:1px solid #FBCFE8';
    return 'background:#F3F4F6;color:#4B5563;border:1px solid #E5E7EB';
  }

  // ── 주간 피커 ──────────────────────────────────────────
  const weekPickerHtml = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px 14px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px">
      <button onclick="shiftTimetableWeek(-1)" style="background:white;border:1px solid #D1D5DB;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:13px;color:#374151">‹ 이전</button>
      <div style="flex:1;text-align:center">
        <span style="font-size:13px;font-weight:700;color:#111827">${week.label}</span>
        <span style="margin-left:8px;font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;${APP.selectedWeek===0?'background:#DBEAFE;color:#1D4ED8':'background:#F3F4F6;color:#6B7280'}">${week.badge}</span>
      </div>
      <button onclick="shiftTimetableWeek(1)" style="background:white;border:1px solid #D1D5DB;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:13px;color:#374151">다음 ›</button>
      ${APP.selectedWeek!==0?`<button onclick="shiftTimetableWeek(${-APP.selectedWeek})" style="background:#DBEAFE;border:1px solid #BFDBFE;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:11px;font-weight:700;color:#1D4ED8">이번 주로</button>`:''}
    </div>`;

  // ── 요일 탭 ────────────────────────────────────────────
  const dayTabsHtml = `<div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">${
    days.map(d=>`<button class="tsa-day-tab ${d===day?'active':''}" onclick="selectTimetableDay('${d}')">${d}요일</button>`).join('')
  }</div>`;

  // ── 강사 헤더 빌더 ─────────────────────────────────────
  function buildHeader(teachers, tableType) {
    return teachers.map(t => {
      const tData = MOCK_TIMETABLE.find(td=>td.teacher===t.nick);
      const color = tData?.color || '#5E5CE6';
      const avatarSrc = t.gender==='남'?'assets/images/teacher_male.png':'assets/images/teacher_female.png';
      const availPeriods = realPeriods.filter(rp=>{ const a=t.availability?.[day]; return a?a[rp.p-1]!==false:true; });
      const totalSlots   = availPeriods.length;
      const filledSlots  = availPeriods.filter(rp=>findSlot(tData,rp.p,day)?.student).length;
      const pct = totalSlots>0?Math.round(filledSlots/totalSlots*100):0;
      const barColor = pct>=80?'#16A34A':pct>=50?'#D97706':'#5E5CE6';
      return `<th data-table-type="${tableType}" data-teacher="${t.nick}" style="border-top:3px solid ${color};min-width:130px;padding:10px 8px;vertical-align:top">
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
          <img src="${avatarSrc}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:2px solid ${color}">
          <span class="tsa-tt-teacher" style="color:${color}">${t.nick}</span>
          <span style="font-size:9px;color:#9CA3AF">Room ${t.room}</span>
          <span style="font-size:9px;padding:2px 7px;border-radius:10px;font-weight:600;${typeTagStyle(t.type)}">${t.type}</span>
          <div style="width:100%;margin-top:2px">
            <div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px">
              <span style="color:${barColor};font-weight:700">${filledSlots}/${totalSlots}</span>
              <span style="color:#9CA3AF">${pct}%</span>
            </div>
            <div style="background:#E5E7EB;border-radius:4px;height:4px;overflow:hidden">
              <div style="background:${barColor};height:4px;width:${pct}%;border-radius:4px;transition:width 0.3s"></div>
            </div>
          </div>
        </div>
      </th>`;
    }).join('');
  }

  // ── 테이블 행 빌더 ─────────────────────────────────────
  // tableType: '1on1' | 'group'
  function buildRows(teachers, tableType) {
    return periods.map(per => {
      if (per.p==='lunch') {
        return `<tr>
          <td class="tsa-tt-row-header" style="background:#FFFBEB">
            <div style="font-size:9px;color:#92400E;font-weight:700">🍱점심</div>
            <div style="font-size:9px;color:#B45309">${per.start}</div>
          </td>
          <td colspan="${teachers.length}" class="tsa-tt-lunch">Lunch Break &nbsp;${per.start} ~ ${per.end}</td>
        </tr>`;
      }
      const cells = teachers.map(t => {
        const tData = MOCK_TIMETABLE.find(td=>td.teacher===t.nick);
        const color = tData?.color||'#5E5CE6';
        const bg    = tData?.bg   ||'#EEF2FF';
        const avail = t.availability?.[day];
        const isAvail = avail?avail[per.p-1]!==false:true;
        const slot  = findSlot(tData,per.p,day);
        const attrs = `data-teacher="${t.nick}" data-period="${per.p}" data-table-type="${tableType}"`;

        if (!isAvail) {
          return `<td style="background:#F3F4F6;text-align:center;color:#CBD5E1;font-size:13px;padding:10px">✗</td>`;
        }

        // ── 교차 차단: 이 테이블 유형과 다른 수업이 배정된 경우 ──
        if (slot?.student) {
          const slotIsGroup = isGroupSlot(slot);
          if (tableType==='1on1' && slotIsGroup) {
            return `<td style="background:#F0FDF4;text-align:center;padding:8px;cursor:not-allowed;border:1px dashed #86EFAC">
              <div style="font-size:10px;color:#16A34A;font-weight:700">그룹 수업</div>
              <div style="font-size:9px;color:#15803D;margin-top:2px">${slot.student}</div>
              <div style="font-size:8px;color:#9CA3AF;margin-top:1px">🚫 1:1 배정 불가</div>
            </td>`;
          }
          if (tableType==='group' && !slotIsGroup) {
            return `<td style="background:#EFF6FF;text-align:center;padding:8px;cursor:not-allowed;border:1px dashed #93C5FD">
              <div style="font-size:10px;color:#3B82F6;font-weight:700">1:1 수업</div>
              <div style="font-size:9px;color:#1D4ED8;margin-top:2px">${slot.student}</div>
              <div style="font-size:8px;color:#9CA3AF;margin-top:1px">🚫 그룹 배정 불가</div>
            </td>`;
          }
        }

        // ── 빈 슬롯 ──
        if (!slot?.student) {
          return `<td class="tsa-tt-empty" ${attrs}
            ondragover="handleDragOver(event)"
            ondragenter="handleDragEnter(event)"
            ondragleave="handleDragLeave(event)"
            ondrop="handleDrop(event,'${t.nick}',${per.p})">
            <span style="color:#D1D5DB;font-size:20px;line-height:1;pointer-events:none">+</span>
          </td>`;
        }

        // ── 정상 배정 슬롯 ──
        const isConflict = conflictMode && t.nick==='Sarah' && per.p===3;
        const lockBtn = slot.locked
          ?`<span style="font-size:11px;cursor:pointer;display:block;margin-bottom:2px" onclick="toggleSlotLock('${t.nick}',${per.p},event)">🔒</span>`
          :`<span style="font-size:11px;cursor:pointer;opacity:0.25;display:block;margin-bottom:2px" onclick="toggleSlotLock('${t.nick}',${per.p},event)">🔓</span>`;

        const isGroup = slot.type && (slot.type.includes('그룹') || slot.type.includes('Group'));
        let studentHtml = '';
        if (isGroup) {
          studentHtml = `
            <div class="tsa-tt-student" style="color:${color};font-weight:bold">${slot.student}</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;justify-content:center">
              ${(slot.students || []).map(stNick => {
                const st = MOCK_STUDENTS.find(std => std.nick === stNick);
                const levelBadge = st ? `<span style="font-size:8px;opacity:0.7;margin-left:2px">(${st.level || '-'})</span>` : '';
                return `
                  <span class="tsa-badge" draggable="true" 
                        ondragstart="event.stopPropagation(); handleCellDragStart(event,'${t.nick}',${per.p},'${stNick}')"
                        ondragend="handleDragEnd(event)"
                        style="background:white;border:1px solid ${color};color:${color};cursor:grab;padding:1px 4px;font-size:9.5px;border-radius:3px;display:inline-flex;align-items:center">
                    ${stNick}${levelBadge}
                  </span>
                `;
              }).join('')}
            </div>
          `;
        } else {
          studentHtml = `<div class="tsa-tt-student" style="color:${color}">${slot.student}</div>`;
        }

        return `<td class="tsa-tt-cell ${isConflict?'tsa-tt-conflict':''}" ${attrs}
          draggable="${isGroup ? 'false' : 'true'}"
          ondragstart="handleCellDragStart(event,'${t.nick}',${per.p},'${slot.student}')"
          ondragend="handleDragEnd(event)"
          ondragover="handleDragOver(event)"
          ondragenter="handleDragEnter(event)"
          ondragleave="handleDragLeave(event)"
          ondrop="handleDrop(event,'${t.nick}',${per.p})"
          onclick="openSubstituteModal('${t.nick}',${per.p})"
          style="${isConflict?'background:#FEE2E2':`background:${bg}`};position:relative;padding:8px 6px">
          ${lockBtn}
          <button class="tsa-cell-delete-btn" onclick="unassignSlot('${t.nick}',${per.p},event)" style="position:absolute;top:3px;right:3px;background:none;border:none;cursor:pointer;opacity:0;font-size:13px;color:#EF4444;padding:0;line-height:1;transition:opacity 0.15s">×</button>
          ${studentHtml}
          <div class="tsa-tt-type" style="color:${color}">${slot.type||''}</div>
        </td>`;
      }).join('');

      return `<tr>
        <td class="tsa-tt-row-header">
          <div style="font-size:10px;font-weight:700;color:#374151">${per.p}교시</div>
          <div style="font-size:9px;color:#9CA3AF">${per.start}</div>
        </td>
        ${cells}
      </tr>`;
    }).join('');
  }

  // ── 섹션 헤더 ─────────────────────────────────────────
  function sectionHeader(label, count, accent, icon) {
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:${accent}22;border:1px solid ${accent}44;border-radius:10px;margin-bottom:12px">
      <span style="font-size:18px">${icon}</span>
      <div>
        <div style="font-size:13px;font-weight:800;color:${accent}">${label}</div>
        <div style="font-size:11px;color:#6B7280">강사 ${count}명</div>
      </div>
    </div>`;
  }

  // ── 수업 유형 탭 ───────────────────────────────────────
  const tab = APP.timetableTab || '1on1';
  const classTabsHtml = `
    <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:2px solid #E5E7EB">
      <button onclick="selectClassTab('1on1')" style="padding:8px 20px;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:3px solid ${tab==='1on1'?'#3B82F6':'transparent'};color:${tab==='1on1'?'#1D4ED8':'#6B7280'};margin-bottom:-2px">
        👤 1:1 수업 <span style="font-size:11px;background:${tab==='1on1'?'#DBEAFE':'#F3F4F6'};color:${tab==='1on1'?'#1D4ED8':'#9CA3AF'};padding:1px 7px;border-radius:10px;margin-left:4px">${solo1on1Teachers.length}명</span>
      </button>
      <button onclick="selectClassTab('group')" style="padding:8px 20px;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:3px solid ${tab==='group'?'#16A34A':'transparent'};color:${tab==='group'?'#15803D':'#6B7280'};margin-bottom:-2px">
        👥 그룹 수업 <span style="font-size:11px;background:${tab==='group'?'#DCFCE7':'#F3F4F6'};color:${tab==='group'?'#15803D':'#9CA3AF'};padding:1px 7px;border-radius:10px;margin-left:4px">${groupTeachers.length}명</span>
      </button>
    </div>`;

  // ── 현재 탭에 해당하는 테이블만 렌더 ─────────────────
  const visibleTeachers = tab === '1on1' ? solo1on1Teachers : groupTeachers;
  const visibleType     = tab === '1on1' ? '1on1' : 'group';

  const tableSection = visibleTeachers.length === 0
    ? `<div style="text-align:center;padding:40px;color:#9CA3AF;font-size:13px">해당 유형의 강사가 없습니다.</div>`
    : `<div style="overflow-x:auto">
        <table class="tsa-tt-grid">
          <thead><tr>
            <th style="width:68px;min-width:68px">교시</th>
            ${buildHeader(visibleTeachers, visibleType)}
          </tr></thead>
          <tbody>${buildRows(visibleTeachers, visibleType)}</tbody>
        </table>
      </div>`;

  container.innerHTML = weekPickerHtml + classTabsHtml + dayTabsHtml + tableSection;
}

function selectTimetableDay(day) {
  APP.selectedDay = day;
  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();
}

function selectClassTab(tab) {
  APP.timetableTab = tab;
  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();
}

function shiftTimetableWeek(delta) {
  APP.selectedWeek = (APP.selectedWeek || 0) + delta;
  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();
}

/* =============================================
   WEEKLY VIEW — READ-ONLY CARD RENDER
   ============================================= */
function renderWeeklyTimetable() {
  const container = document.getElementById('weekly-timetable-cards');
  if (!container) return;

  const activeTeachers = MOCK_TEACHERS.filter(t => t.status !== 'resigned');
  const days = ['월', '화', '수', '목', '금', '토'];
  const dayEn = { '월': 'Mon', '화': 'Tue', '수': 'Wed', '목': 'Thu', '금': 'Fri', '토': 'Sat' };

  const periods = buildBellSchedule(APP.bellSystem);

  function typeStyle(type) {
    if (type.includes('IELTS')) return 'background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;';
    if (type.includes('일반')) return 'background:#E0F2FE;color:#0284C7;border:1px solid #BAE6FD;';
    if (type.includes('그룹')) return 'background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0;';
    if (type.includes('주니어')) return 'background:#FEF3C7;color:#D97706;border:1px solid #FDE68A;';
    if (type.includes('비즈니스')) return 'background:#FDF2F8;color:#DB2777;border:1px solid #FBCFE8;';
    return 'background:#F3F4F6;color:#4B5563;border:1px solid #E5E7EB;';
  }

  const week = getWeekDates(APP.selectedWeek || 0);
  const weekPickerHtml = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;padding:12px 20px;background:#ffffff;border:1px solid #E4E7EB;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.03);">
      <button onclick="shiftWeeklyTimetableWeek(-1)" style="background:white;border:1px solid #D1D5DB;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:500;color:#4B5563;transition:all 0.2s;display:inline-flex;align-items:center;gap:4px;" onmouseover="this.style.background='#F3F4F6';this.style.borderColor='#9CA3AF';" onmouseout="this.style.background='white';this.style.borderColor='#D1D5DB';">
        <i data-lucide="chevron-left" style="font-size:14px;line-height:1"></i> 이전 주
      </button>
      
      <div style="flex:1;text-align:center;display:flex;align-items:center;justify-content:center;gap:10px;">
        <span style="font-size:15px;font-weight:700;color:#1A1D23;letter-spacing:-0.3px;">${week.label}</span>
        <span style="font-size:11px;font-weight:700;padding:3px 10px;border-radius:9999px;${APP.selectedWeek === 0 ? 'background:#EEF2FF;color:#4F46E5;border:1px solid #C7D2FE;' : 'background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB;'}">${week.badge}</span>
      </div>
      
      <button onclick="shiftWeeklyTimetableWeek(1)" style="background:white;border:1px solid #D1D5DB;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:13px;font-weight:500;color:#4B5563;transition:all 0.2s;display:inline-flex;align-items:center;gap:4px;" onmouseover="this.style.background='#F3F4F6';this.style.borderColor='#9CA3AF';" onmouseout="this.style.background='white';this.style.borderColor='#D1D5DB';">
        다음 주 <i data-lucide="chevron-right" style="font-size:14px;line-height:1"></i>
      </button>
      
      ${APP.selectedWeek !== 0 ? `
      <button onclick="shiftWeeklyTimetableWeek(${-APP.selectedWeek})" style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:6px 14px;cursor:pointer;font-size:12px;font-weight:700;color:#4F46E5;transition:all 0.2s;display:inline-flex;align-items:center;gap:4px;" onmouseover="this.style.background='#E0E7FF';" onmouseout="this.style.background='#EEF2FF';">
        <i data-lucide="refresh-cw" style="font-size:13px"></i> 이번 주로
      </button>` : ''}
    </div>`;

  const cardsHtml = activeTeachers.map(teacher => {
    const tData = MOCK_TIMETABLE.find(t => t.teacher === teacher.nick);
    const color = tData?.color || '#5E5CE6';
    const bg = tData?.bg || '#EEF2FF';
    const avatarSrc = teacher.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png';

    // 전체 주간 배정된 슬롯 카운트 (모든 요일 합산)
    const totalWeekSlots = days.reduce((acc, d) => {
      const available = periods.filter(p => p.p !== 'lunch' && (teacher.availability?.[d] ? teacher.availability[d][p.p - 1] !== false : true)).length;
      return acc + available;
    }, 0);
    const filledWeekSlots = days.reduce((acc, d) => {
      return acc + periods.filter(p => p.p !== 'lunch' && findSlot(tData, p.p, d)?.student).length;
    }, 0);
    const weekPct = totalWeekSlots > 0 ? Math.round(filledWeekSlots / totalWeekSlots * 100) : 0;
    const barColor = weekPct >= 80 ? '#16A34A' : weekPct >= 50 ? '#D97706' : '#5E5CE6';

    const gridRows = periods.map(per => {
      if (per.p === 'lunch') {
        return `<tr>
          <td class="tsa-wk-period-header" style="background:#FFFBEB">
            <div style="font-size:8.5px;color:#92400E;font-weight:700">🍱점심</div>
            <div class="tsa-wk-period-time">${per.start}</div>
          </td>
          <td colspan="${days.length}" style="background:#FFFBEB;text-align:center;font-size:10px;font-weight:600;color:#92400E;padding:5px 0">Lunch Break</td>
        </tr>`;
      }

      const dayCells = days.map(day => {
        const avail = teacher.availability?.[day];
        const isAvailable = avail ? avail[per.p - 1] !== false : true;
        const slot = findSlot(tData, per.p, day);

        if (!isAvailable) {
          return `<td class="tsa-wk-cell tsa-wk-unavail"><span style="font-size:11px;color:#CBD5E1">✗</span></td>`;
        }
        if (!slot?.student) {
          return `<td class="tsa-wk-cell tsa-wk-empty" data-teacher="${teacher.nick}" data-period="${per.p}" data-day="${day}"
            ondragover="handleDragOver(event)"
            ondragenter="handleWkDragEnter(event)"
            ondragleave="handleDragLeave(event)"
            ondrop="handleWkDrop(event,'${teacher.nick}',${per.p},'${day}')">
            <span class="tsa-wk-plus">+</span>
          </td>`;
        }
        const lockBtn = slot.locked
          ? `<span class="tsa-wk-lock" onclick="handleWkLock('${teacher.nick}',${per.p},'${day}',event)">🔒</span>`
          : `<span class="tsa-wk-lock" style="opacity:0.25;" onclick="handleWkLock('${teacher.nick}',${per.p},'${day}',event)">🔓</span>`;

        const isGroup = slot.type && (slot.type.includes('그룹') || slot.type.includes('Group'));
        let studentHtml = '';
        if (isGroup) {
          studentHtml = `
            <div class="tsa-wk-student-name" style="color:${color};font-weight:bold">${slot.student}</div>
            <div style="display:flex;flex-wrap:wrap;gap:2px;margin-top:2px;justify-content:center">
              ${(slot.students || []).map(stNick => {
                const st = MOCK_STUDENTS.find(std => std.nick === stNick);
                const levelBadge = st ? `<span style="font-size:8px;opacity:0.7;margin-left:2px">(${st.level || '-'})</span>` : '';
                return `
                  <span class="tsa-badge" draggable="true" 
                        ondragstart="event.stopPropagation(); handleWkCellDragStart(event,'${teacher.nick}',${per.p},'${stNick}','${day}')"
                        ondragend="handleDragEnd(event)"
                        style="background:white;border:1px solid ${color};color:${color};cursor:grab;padding:1px 3px;font-size:9px;border-radius:3px;display:inline-flex;align-items:center">
                    ${stNick}${levelBadge}
                  </span>
                `;
              }).join('')}
            </div>
          `;
        } else {
          studentHtml = `<div class="tsa-wk-student-name" style="color:${color}">${slot.student}</div>`;
        }

        return `<td class="tsa-wk-cell tsa-wk-filled" data-teacher="${teacher.nick}" data-period="${per.p}" data-day="${day}"
          draggable="${isGroup ? 'false' : 'true'}"
          ondragstart="handleWkCellDragStart(event,'${teacher.nick}',${per.p},'${slot.student}','${day}')"
          ondragend="handleDragEnd(event)"
          ondragover="handleDragOver(event)"
          ondragenter="handleWkDragEnter(event)"
          ondragleave="handleDragLeave(event)"
          ondrop="handleWkDrop(event,'${teacher.nick}',${per.p},'${day}')"
          onclick="handleWkCellClick('${teacher.nick}',${per.p},'${day}')"
          style="background:${bg};position:relative;padding:6px 4px">
          ${lockBtn}
          <button class="tsa-wk-unassign-btn" onclick="handleWkUnassign('${teacher.nick}',${per.p},'${day}',event)" style="position:absolute;top:2px;left:2px;background:none;border:none;cursor:pointer;opacity:0;font-size:11px;color:#EF4444;padding:0;line-height:1;transition:opacity 0.15s">×</button>
          ${studentHtml}
          <div class="tsa-wk-type" style="color:${color}">${slot.type || ''}</div>
        </td>`;
      }).join('');

      return `<tr>
        <td class="tsa-wk-period-header">
          <div class="tsa-wk-period-num">${per.p}교시</div>
          <div class="tsa-wk-period-time">${per.start}</div>
        </td>
        ${dayCells}
      </tr>`;
    }).join('');

    return `<div class="tsa-teacher-week-card" style="border-top:3px solid ${color}">
      <div class="tsa-twc-header">
        <img src="${avatarSrc}" class="tsa-twc-avatar" alt="${teacher.nick}"/>
        <div style="flex:1;min-width:0">
          <div class="tsa-twc-name">${teacher.nick}</div>
          <div class="tsa-twc-meta">Room ${teacher.room}</div>
          <span class="tsa-badge" style="font-size:9px;padding:2px 6px;margin-top:2px;display:inline-block;${typeStyle(teacher.type)}">${teacher.type}</span>
        </div>
        <div style="text-align:right;min-width:72px">
          <div style="font-size:11px;font-weight:700;color:${barColor}">${filledWeekSlots}/${totalWeekSlots} 슬롯</div>
          <div style="font-size:9px;color:#9CA3AF;margin-bottom:3px">${weekPct}% 배정</div>
          <div style="background:#E5E7EB;border-radius:4px;height:5px;overflow:hidden">
            <div style="background:${barColor};height:5px;width:${weekPct}%;border-radius:4px"></div>
          </div>
        </div>
      </div>
      <div style="overflow-x:auto">
        <table class="tsa-wk-grid">
          <thead>
            <tr>
              <th class="tsa-wk-th-period">교시</th>
              ${days.map(d => `<th>${d}<span style="font-size:8px;display:block;color:#9CA3AF;font-weight:500">${dayEn[d]}</span></th>`).join('')}
            </tr>
          </thead>
          <tbody>${gridRows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  const pickerContainer = document.getElementById('weekly-timetable-picker-container');
  if (pickerContainer) {
    pickerContainer.innerHTML = weekPickerHtml;
  }
  container.innerHTML = cardsHtml;
}

function shiftWeeklyTimetableWeek(delta) {
  APP.selectedWeek = (APP.selectedWeek || 0) + delta;
  renderWeeklyTimetable();
}

/* =============================================
   WEEKLY CARD VIEW — DAY-AWARE WRAPPERS
   ============================================= */
function handleWkDrop(event, teacherName, period, day) {
  APP.selectedDay = day;
  handleDrop(event, teacherName, period);
}

function handleWkCellDragStart(event, teacherName, period, studentNick, day) {
  APP.selectedDay = day;
  handleCellDragStart(event, teacherName, period, studentNick);
  if (APP.dragSource) APP.dragSource.day = day;
}

function handleWkUnassign(teacherName, period, day, event) {
  APP.selectedDay = day;
  unassignSlot(teacherName, period, event);
}

function handleWkLock(teacherName, period, day, event) {
  APP.selectedDay = day;
  toggleSlotLock(teacherName, period, event);
}

function handleWkCellClick(teacherName, period, day) {
  APP.selectedDay = day;
  openSubstituteModal(teacherName, period);
}

function handleWkDragEnter(event) {
  event.preventDefault();
  const cell = event.currentTarget;
  const teacher = cell.getAttribute('data-teacher');
  const period = parseInt(cell.getAttribute('data-period'));
  const day = cell.getAttribute('data-day');
  if (!teacher || !period || !day || !APP.draggedStudentId) return;
  APP.selectedDay = day;
  cell.classList.add('tsa-wk-drag-hover');
}

// Render Unassigned & Assigned Queue based on current timetable state
function renderUnassignedQueue() {
  const container = document.getElementById('unassigned-students-queue');
  const assignedDoneContainer = document.getElementById('assigned-done-students-queue');
  if (!container) return;

  const tab = APP.timetableTab || '1on1';
  const isGroupTab = tab === 'group';
  const day = APP.selectedDay || '월';

  const activeStudents = MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'extended');

  // 코스별 요구량 조회
  function getCourseReqLocal(courseName) {
    const c = MOCK_COURSES.find(c => c.name === courseName) || MOCK_COURSES.find(c => courseName && courseName.includes(c.name));
    return c ? { oneone: c.oneone, group: c.group } : { oneone: 4, group: 0 };
  }

  // 탭에 해당하는 학생만 필터 (그룹탭: group>0인 코스 학생만, 1:1탭: oneone>0인 코스 학생)
  const tabStudents = activeStudents.filter(s => {
    const req = getCourseReqLocal(s.course);
    return isGroupTab ? req.group > 0 : req.oneone > 0;
  });

  const queue = [];
  const assignedDoneQueue = [];

  tabStudents.forEach(s => {
    const req = getCourseReqLocal(s.course);
    const required = isGroupTab ? req.group : req.oneone;

    // 해당 탭 유형의 배정 수만 카운트 (선택 요일 기준)
    let assigned = 0;
    MOCK_TIMETABLE.forEach(t => {
      t.slots.forEach(slot => {
        if (slot.day !== day) return;
        const slotIsGroup = !!(slot.type && (slot.type.includes('그룹') || slot.type.includes('Group')));
        if (isGroupTab) {
          if (slotIsGroup && slot.students && slot.students.includes(s.nick)) assigned++;
        } else {
          if (!slotIsGroup && slot.student === s.nick) assigned++;
        }
      });
    });

    const remaining = required - assigned;
    if (remaining > 0) {
      queue.push({ student: s, remaining, assigned, total: required });
    } else {
      assignedDoneQueue.push({ student: s, remaining, assigned, total: required });
    }
  });

  // 패널 헤더 레이블 업데이트
  const waitTitle = document.getElementById('queue-wait-title');
  const doneTitle = document.getElementById('queue-done-title');
  const typeLabel = isGroupTab ? '그룹' : '1:1';
  const waitColor = isGroupTab ? '#15803D' : '#5E5CE6';
  const doneColor = isGroupTab ? '#15803D' : '#16A34A';
  if (waitTitle) waitTitle.textContent = `${typeLabel} 배정 대기`;
  if (doneTitle) doneTitle.textContent = `${typeLabel} 배정 완료`;

  // 배정 대기 렌더
  const waitBadgeEl = document.getElementById('unassigned-count');
  if (waitBadgeEl) waitBadgeEl.textContent = `${queue.length}명`;

  if (queue.length === 0) {
    container.innerHTML = `<div style="text-align:center;font-size:12px;color:#9CA3AF;padding:20px 0">${typeLabel} 배정 대기 중인 수강생이 없습니다 ✓</div>`;
  } else {
    container.innerHTML = queue.map(q => {
      const pct = Math.round(q.assigned / q.total * 100);
      return `
        <div draggable="true"
          ondragstart="handleDragStart(event,'${q.student.id}')"
          ondragend="handleDragEnd(event)"
          style="padding:10px 12px;background:white;border:1.5px solid #E9EDF4;border-radius:9px;cursor:grab;transition:box-shadow 0.15s"
          onmouseover="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.08)'" onmouseout="this.style.boxShadow='none'"
          title="드래그하여 슬롯에 배치">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:7px">
            <div style="display:flex;align-items:center;gap:8px">
              <img src="${q.student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png'}"
                style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1.5px solid #E5E7EB;flex-shrink:0" alt=""/>
              <div>
                <div style="font-weight:700;font-size:12.5px;color:#1A1D23">
                  ${q.student.nick}
                  <span style="background:#EEF2FF;color:#6366F1;border:1px solid #C7D2FE;font-size:9px;padding:1px 4px;margin-left:4px;border-radius:3px">${q.student.level || '-'}</span>
                </div>
                <div style="font-size:10px;color:#9CA3AF">${q.student.course}</div>
              </div>
            </div>
            <span style="background:#FEF3C7;color:#D97706;border:1px solid #FDE68A;font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;flex-shrink:0">
              ${q.assigned}/${q.total}회
            </span>
          </div>
          <!-- 진행률 바 -->
          <div style="background:#F3F4F6;border-radius:4px;height:4px;overflow:hidden">
            <div style="background:${waitColor};height:4px;width:${pct}%;border-radius:4px;transition:width 0.3s"></div>
          </div>
          <div style="font-size:9.5px;color:#9CA3AF;margin-top:3px;text-align:right">${typeLabel} ${pct}% 배정</div>
        </div>`;
    }).join('');
  }

  // 배정 완료 렌더
  if (assignedDoneContainer) {
    const doneBadgeEl = document.getElementById('assigned-done-count');
    if (doneBadgeEl) doneBadgeEl.textContent = `${assignedDoneQueue.length}명`;

    if (assignedDoneQueue.length === 0) {
      assignedDoneContainer.innerHTML = `<div style="text-align:center;font-size:12px;color:#9CA3AF;padding:20px 0">${typeLabel} 배정 완료된 수강생이 없습니다</div>`;
    } else {
      assignedDoneContainer.innerHTML = assignedDoneQueue.map(q => `
        <div style="padding:10px 12px;background:#F0FDF4;border:1px solid #DCFCE7;border-radius:9px;display:flex;justify-content:space-between;align-items:center;gap:8px">
          <div style="display:flex;align-items:center;gap:8px">
            <img src="${q.student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png'}"
              style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1.5px solid #BBF7D0;flex-shrink:0" alt=""/>
            <div>
              <div style="font-weight:700;font-size:12.5px;color:#14532D">
                ${q.student.nick}
                <span style="background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0;font-size:9px;padding:1px 4px;margin-left:4px;border-radius:3px">${q.student.level || '-'}</span>
              </div>
              <div style="font-size:10px;color:#15803D">${q.student.course}</div>
            </div>
          </div>
          <span style="background:#DCFCE7;color:#15803D;border:1px solid #BBF7D0;font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;flex-shrink:0">
            ✓ ${q.assigned}/${q.total}회
          </span>
        </div>`).join('');
    }
  }

  // Populate Student Dropdown in Workspace
  const select = document.getElementById('assign-student-select');
  if (select) {
    if (queue.length === 0) {
      select.innerHTML = `<option value="">대기 학생 없음</option>`;
    } else {
      select.innerHTML = queue.map(q => `<option value="${q.student.id}">${q.student.nick} (${q.student.name})</option>`).join('');
    }
    updateAssignCourseType();
  }
}

function renderStudentWeeklyStatus(activeStudents) {
  const container = document.getElementById('student-weekly-status');
  if (!container) return;

  const DAYS = ['월', '화', '수', '목', '금'];

  // 코스별 주간 요구량 조회
  function getCourseReq(courseName) {
    const c = MOCK_COURSES.find(c => c.name === courseName)
           || MOCK_COURSES.find(c => courseName && courseName.includes(c.name));
    return c ? { oneone: c.oneone, group: c.group } : { oneone: 4, group: 0 };
  }

  // 학생별 요일별 1:1/그룹 배정 수 집계
  function countAssigned(nick, day, isGroup) {
    let cnt = 0;
    MOCK_TIMETABLE.forEach(t => {
      t.slots.forEach(slot => {
        if (slot.day !== day) return;
        if (isGroup) {
          if (slot.students && slot.students.includes(nick)) cnt++;
        } else {
          if (slot.student === nick) cnt++;
        }
      });
    });
    return cnt;
  }

  if (activeStudents.length === 0) {
    container.innerHTML = '';
    return;
  }

  const rows = activeStudents.map(s => {
    const req = getCourseReq(s.course);

    // 요일별 집계
    const dayData = DAYS.map(day => ({
      day,
      oneone: countAssigned(s.nick, day, false),
      group:  countAssigned(s.nick, day, true),
    }));

    const totalOneone = dayData.reduce((a, d) => a + d.oneone, 0);
    const totalGroup  = dayData.reduce((a, d) => a + d.group,  0);

    const allDone = totalOneone >= req.oneone && totalGroup >= req.group;

    // 요일 셀 렌더
    const dayCells = dayData.map(d => {
      const oo = d.oneone;
      const gr = d.group;
      const ooOk = oo > 0;
      const grOk = req.group === 0 || gr > 0;
      const cellOk = ooOk && grOk;

      return `
        <td style="text-align:center;padding:5px 3px;vertical-align:middle">
          <div style="display:flex;flex-direction:column;gap:2px;align-items:center">
            <!-- 1:1 -->
            <div style="font-size:10px;font-weight:700;
              background:${ooOk ? '#DBEAFE' : '#FEE2E2'};
              color:${ooOk ? '#1D4ED8' : '#DC2626'};
              border-radius:4px;padding:1px 5px;min-width:28px;text-align:center">
              1:1 ${oo}
            </div>
            <!-- 그룹 (코스에 그룹이 있는 경우만) -->
            ${req.group > 0 ? `
            <div style="font-size:10px;font-weight:700;
              background:${grOk ? '#DCFCE7' : '#FEE2E2'};
              color:${grOk ? '#15803D' : '#DC2626'};
              border-radius:4px;padding:1px 5px;min-width:28px;text-align:center">
              그룹 ${gr}
            </div>` : ''}
          </div>
        </td>`;
    }).join('');

    const totalCell = `
      <td style="text-align:center;padding:5px 6px;vertical-align:middle;border-left:2px solid #E5E7EB">
        <div style="display:flex;flex-direction:column;gap:2px;align-items:center">
          <div style="font-size:10px;font-weight:800;
            background:${totalOneone >= req.oneone ? '#DBEAFE' : '#FEE2E2'};
            color:${totalOneone >= req.oneone ? '#1D4ED8' : '#DC2626'};
            border-radius:4px;padding:1px 6px">
            1:1 ${totalOneone}/${req.oneone}
          </div>
          ${req.group > 0 ? `
          <div style="font-size:10px;font-weight:800;
            background:${totalGroup >= req.group ? '#DCFCE7' : '#FEE2E2'};
            color:${totalGroup >= req.group ? '#15803D' : '#DC2626'};
            border-radius:4px;padding:1px 6px">
            그룹 ${totalGroup}/${req.group}
          </div>` : ''}
        </div>
      </td>`;

    return `
      <tr style="border-bottom:1px solid #F3F4F6;${allDone ? 'background:#F0FDF4' : ''}">
        <td style="padding:6px 8px;min-width:90px;vertical-align:middle">
          <div style="display:flex;align-items:center;gap:6px">
            <img src="${s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png'}"
              style="width:24px;height:24px;border-radius:50%;object-fit:cover;border:1.5px solid ${allDone ? '#86EFAC' : '#E5E7EB'};flex-shrink:0" alt=""/>
            <div>
              <div style="font-size:11px;font-weight:700;color:#111827">${s.nick}</div>
              <div style="font-size:9.5px;color:#9CA3AF">${s.course.replace(' 코스','').replace(' 전문','')}</div>
            </div>
          </div>
        </td>
        ${dayCells}
        ${totalCell}
      </tr>`;
  }).join('');

  container.innerHTML = `
    <div style="margin-top:16px;background:#fff;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden">
      <div style="padding:10px 12px;background:#F8FAFC;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;gap:6px">
        <i data-lucide="calendar-check" style="font-size:13px;color:#5E5CE6"></i>
        <span style="font-size:11.5px;font-weight:700;color:#374151">학생별 주간 배정 현황</span>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <thead>
            <tr style="background:#F9FAFB;border-bottom:1px solid #E5E7EB">
              <th style="padding:6px 8px;text-align:left;font-size:10px;color:#9CA3AF;font-weight:600">학생</th>
              ${DAYS.map(d => `<th style="padding:6px 3px;text-align:center;font-size:10px;color:#9CA3AF;font-weight:600">${d}</th>`).join('')}
              <th style="padding:6px 6px;text-align:center;font-size:10px;color:#9CA3AF;font-weight:600;border-left:2px solid #E5E7EB">합계</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;

  if (typeof refreshIcons === 'function') refreshIcons();
}

function selectSlotForAssign(teacher, period) {
  APP.assignTarget = { teacherName: teacher, period: period };
  const tEl = document.getElementById('assign-teacher');
  if (tEl) tEl.value = teacher;
  const pEl = document.getElementById('assign-period');
  if (pEl) pEl.value = `${period}교시`;
  
  // Highlight selection card border
  const card = document.getElementById('manual-assign-card');
  if (card) card.style.borderColor = '#5E5CE6';
  updateAssignCourseType();
}

function updateAssignCourseType() {
  const select = document.getElementById('assign-student-select');
  const typeInput = document.getElementById('assign-course-type');
  const photoWrapper = document.getElementById('assign-student-photo-wrapper');
  const photoImg = document.getElementById('assign-student-photo');
  if (!select || !typeInput) return;

  const studentId = select.value;
  if (!studentId) {
    typeInput.value = '';
    if (photoWrapper) photoWrapper.style.display = 'none';
    return;
  }

  const s = MOCK_STUDENTS.find(std => std.id == studentId);
  const t = MOCK_TEACHERS.find(tch => tch.nick === APP.assignTarget.teacherName);
  if (!s) {
    if (photoWrapper) photoWrapper.style.display = 'none';
    return;
  }

  if (photoWrapper && photoImg) {
    photoImg.src = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';
    photoWrapper.style.display = 'block';
  }

  if (!t) return;
  // Auto assign type label
  if (t.type.includes('그룹')) {
    typeInput.value = 'Group';
  } else if (s.course.includes('IELTS')) {
    typeInput.value = 'IELTS 1:1';
  } else if (s.course.includes('주니어')) {
    typeInput.value = '주니어 1:1';
  } else {
    typeInput.value = '1:1 General';
  }
}

function clearAssignWorkspace() {
  APP.assignTarget = { teacherName: '', period: 0 };
  const tEl = document.getElementById('assign-teacher');
  if (tEl) tEl.value = '';
  const pEl = document.getElementById('assign-period');
  if (pEl) pEl.value = '';
  const card = document.getElementById('manual-assign-card');
  if (card) card.style.borderColor = '#C7D2FE';
  const select = document.getElementById('assign-student-select');
  if (select) select.selectedIndex = 0;
  const photoWrapper = document.getElementById('assign-student-photo-wrapper');
  if (photoWrapper) photoWrapper.style.display = 'none';
  updateAssignCourseType();
}

function confirmManualAssignment(optStudentId) {
  if (!APP.assignTarget.teacherName || !APP.assignTarget.period) {
    showToast('배정할 시간표 슬롯을 먼저 클릭하여 선택하세요.', 'warning');
    return false;
  }

  const selectEl = document.getElementById('assign-student-select');
  const studentId = optStudentId || (selectEl ? selectEl.value : null);
  if (!studentId) {
    showToast('배정 대기 수강생이 없습니다.', 'warning');
    return false;
  }

  const s = MOCK_STUDENTS.find(std => std.id == studentId);
  const t = MOCK_TEACHERS.find(tch => tch.nick === APP.assignTarget.teacherName);
  
  if (!s || !t) return false;

  // Auto assign type label
  let type = '';
  if (t.type.includes('그룹')) {
    type = 'Group';
  } else if (s.course.includes('IELTS')) {
    type = 'IELTS 1:1';
  } else if (s.course.includes('주니어')) {
    type = '주니어 1:1';
  } else {
    type = '1:1 General';
  }

  const day = APP.selectedDay || '월';

  // H-09. Waiting 상태 학생 정규 수업 배정 금지
  if (s.status === 'waiting' || s.remittanceStatus === 'unpaid' || s.remittanceStatus === 'submitted') {
    alert(`❌ 수업 배정 차단 (H-09)!\n\n학생 ${s.name}은(는) 입학 대기(Waiting) 상태이거나 학비가 완납되지 않아 수업을 배정할 수 없습니다.`);
    return false;
  }

  // H-02. 동일 교시 학생 중복 배정 금지
  let studentOverlap = false;
  MOCK_TIMETABLE.forEach(time => {
    const conflictSlot = time.slots.find(slot => 
      Number(slot.p) === Number(APP.assignTarget.period) && 
      slot.day === day && 
      (slot.student === s.nick || (slot.students && slot.students.includes(s.nick)))
    );
    if (conflictSlot) {
      const isSourceSlot = APP.dragSource && 
                           APP.dragSource.teacherName === time.teacher && 
                           Number(APP.dragSource.period) === Number(APP.assignTarget.period) &&
                           (APP.dragSource.day || APP.selectedDay || '월') === day;
      if (!isSourceSlot) {
        studentOverlap = true;
      }
    }
  });

  if (studentOverlap) {
    alert(`❌ 중복 배정 차단!\n\n해당 학생(${s.nick})은 ${day}요일 ${APP.assignTarget.period}교시에 이미 다른 수업이 배정되어 있어 이중 배정이 불가능합니다.`);
    return false;
  }

  // H-10. 동일 강의실 수업 중복 배정 금지
  let classroomOverlap = false;
  let overlappingTeacher = '';
  MOCK_TIMETABLE.forEach(time => {
    if (time.teacher !== t.nick) {
      const otherT = MOCK_TEACHERS.find(tch => tch.nick === time.teacher);
      if (otherT && otherT.room === t.room) {
        const slot = time.slots.find(slot => Number(slot.p) === Number(APP.assignTarget.period) && slot.student && slot.day === day);
        if (slot) {
          classroomOverlap = true;
          overlappingTeacher = otherT.nick;
        }
      }
    }
  });

  if (classroomOverlap) {
    alert(`❌ 동일 강의실 수업 중복 배정 차단 (H-10)!\n\n${t.nick} 강사의 강의실(Room ${t.room})은 현재 ${day}요일 ${APP.assignTarget.period}교시에 ${overlappingTeacher} 강사가 사용 중입니다.`);
    return false;
  }

  // 80% 출석률 제재에 따른 1일 7교시 감축 적용
  if (s.attendance && s.attendance < 80) {
    let dailySlotsCount = 0;
    MOCK_TIMETABLE.forEach(time => {
      time.slots.forEach(slot => {
        if (slot.student === s.nick && slot.day === day) dailySlotsCount++;
      });
    });
    if (dailySlotsCount >= 7) {
      alert(`❌ 출석률 제재에 따른 배정 차단!\n\n학생 ${s.nick}은(는) 출석률 80% 미만(${s.attendance}%)으로 인해 하루 최대 7교시까지만 배정될 수 있습니다.`);
      return false;
    }
  }

  // S-01. 강사 코스 불일치 경고
  if (t.type.includes('IELTS') && !s.course.includes('IELTS')) {
    if (!confirm(`⚠ 강사 코스 불일치 경고 (S-01)\n\nSarah 강사는 [IELTS 전문] 강사이나, 배정 대상 학생(${s.nick})은 [${s.course}] 코스입니다.\n\n강제 매칭을 진행하시겠습니까?`)) {
      return false;
    }
  }

  // S-02. 강사 주간 40교시 초과 경고
  const tTimetable = MOCK_TIMETABLE.find(time => time.teacher === t.nick);
  let totalWeeklyPeriods = 0;
  if (tTimetable) {
    tTimetable.slots.forEach(slot => {
      if (slot.student) totalWeeklyPeriods++;
    });
  }
  if (totalWeeklyPeriods >= 40) {
    if (!confirm(`⚠ 강사 주간 총 수업 시수 권고치 초과 (S-02)\n\n${t.nick} 강사의 주간 총 수업 배정 횟수(${totalWeeklyPeriods}교시)가 권고치(40교시)를 초과합니다.\n\n계속 진행하시겠습니까?`)) {
      return false;
    }
  }

  // S-03. 동일 학생 동일 과목 주 5회 초과 경고
  let studentWeeklySubjectCount = 0;
  MOCK_TIMETABLE.forEach(time => {
    time.slots.forEach(slot => {
      if (slot.student === s.nick && slot.type === type) {
        studentWeeklySubjectCount++;
      }
    });
  });
  if (studentWeeklySubjectCount >= 5) {
    if (!confirm(`⚠ 동일 학생 동일 과목 주 5회 초과 경고 (S-03)\n\n학생 ${s.nick}은(는) 이번 주에 [${type}] 과목을 이미 ${studentWeeklySubjectCount}회 배정받았습니다.\n\n계속 진행하시겠습니까?`)) {
      return false;
    }
  }

  // S-04. 식사 시간 수업 오버랩 경고
  const bellSchedule = buildBellSchedule(APP.bellSystem);
  const targetRange = bellSchedule.find(item => item.p === APP.assignTarget.period);
  const lunchRange = bellSchedule.find(item => item.p === 'lunch');
  if (targetRange && lunchRange) {
    if (targetRange.start < lunchRange.end && targetRange.end > lunchRange.start) {
      if (!confirm(`⚠ 식사 시간 수업 배정 경고 (S-04)\n\n배정하려는 ${APP.assignTarget.period}교시(${targetRange.start}~${targetRange.end})가 식사 시간(${lunchRange.start}~${lunchRange.end})과 겹칩니다.\n\n계속 진행하시겠습니까?`)) {
        return false;
      }
    }
  }

  // H-04. 1:1 수업 동일 강사 일일 1클래스 원칙
  let alreadyHasClass = false;
  if (tTimetable) {
    const existing = tTimetable.slots.find(slot => slot.student === s.nick && slot.day === day);
    if (existing) {
      alreadyHasClass = true;
    }
  }

  if (alreadyHasClass && type !== 'Group') {
    if (!confirm(`⚠ 1:1 수업 일일 중복 경고 (H-04)\n\n학생 ${s.nick}은(는) 오늘(${day}요일) 이미 ${t.nick} 강사와 1:1 수업이 배정되어 있습니다. (원칙: 하루 최대 1클래스)\n\n헤드티처 권한으로 강제 승인(Overrule)하시겠습니까?`)) {
      return false;
    }
  }

  // H-05. 그룹 수업 필수 필드 (Subject, Level) 강제화
  let subject = '';
  let level = '';
  if (type === 'Group' || type.includes('그룹')) {
    subject = prompt("그룹 수업의 주제(Subject)를 입력하세요:", "Conversation Practice");
    if (!subject) {
      alert("❌ 그룹 수업 주제는 필수 입력 항목입니다. 배정이 취소되었습니다.");
      return false;
    }
    level = prompt("그룹 수업의 권장 레벨(Level)을 입력하세요:", "Level 3");
    if (!level) {
      alert("❌ 그룹 수업 레벨은 필수 입력 항목입니다. 배정이 취소되었습니다.");
      return false;
    }
  }

  // 시간표 상태가 Published인 경우 변경 사유 필수 및 잠금 체크
  let publishedReason = '';
  if (APP.timetableStatus === 'Published') {
    if (tTimetable) {
      const slot = tTimetable.slots.find(slot => Number(slot.p) === Number(APP.assignTarget.period) && slot.day === day);
      if (slot && slot.locked) {
        alert("❌ 시간표 잠김!\n\n이 교시는 이미 잠금(Locked) 처리되었거나 수업이 시작되어 수정할 수 없습니다.");
        return false;
      }
    }
    publishedReason = prompt("🚨 시간표가 확정(Published)된 상태입니다. 변경 감사 사유를 입력하십시오:");
    if (!publishedReason) {
      alert("❌ 시간표 확정 상태에서 변경 시 사유 입력은 필수입니다. 배정이 취소되었습니다.");
      return false;
    }
  }

  // Apply to mock database
  if (tTimetable) {
    const slot = findSlot(tTimetable, APP.assignTarget.period, day);
    if (slot) {
      const isGroup = slot.type && (slot.type.includes('그룹') || slot.type.includes('Group'));
      if (isGroup) {
        if (!slot.students) slot.students = [];
        if (!slot.students.includes(s.nick)) {
          slot.students.push(s.nick);
        }
        if (!slot.student) slot.student = '그룹 A';
        if (subject) slot.subject = subject;
        if (level) slot.level = level;
      } else {
        if (slot.student) {
          showToast(`❌ 이미 ${slot.student} 학생이 배정된 슬롯입니다. 기존 배정을 먼저 해제해 주세요.`, 'error');
          return false;
        }
        slot.student = s.nick;
        slot.type = type;
        slot.locked = false;
        if (subject) slot.subject = subject;
        if (level) slot.level = level;
      }
    } else {
      const isGroup = type && (type.includes('그룹') || type.includes('Group'));
      tTimetable.slots.push({
        p: Number(APP.assignTarget.period),
        day: day,
        student: isGroup ? '그룹 A' : s.nick,
        students: isGroup ? [s.nick] : [],
        type: type,
        locked: false,
        subject: subject || undefined,
        level: level || undefined
      });
    }
  }

  // Audit trail log add
  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().slice(0,10),
    time: new Date().toTimeString().slice(0,5),
    actor: APP.user === 'agency_head' ? '에이전시' : 'Head Teacher (Kim)',
    change: `${t.nick} 강사 ${day}요일 ${APP.assignTarget.period}교시 ${s.nick} 배정 완료`,
    reason: publishedReason || '수동 시간표 최적화 배정',
    type: 'ok'
  });

  showToast(`✓ ${s.nick} 학생이 ${t.nick} 강사 ${APP.assignTarget.period}교시에 성공적으로 수동 배정되었습니다.`, 'success');
  
  // Refresh Views
  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();
  clearAssignWorkspace();

  return true;
}

function isSlotAssignable(studentId, teacherNick, period) {
  const s = MOCK_STUDENTS.find(std => std.id == studentId);
  if (!s) return false;

  const teacher = MOCK_TEACHERS.find(t => t.nick === teacherNick);
  if (!teacher) return false;

  const day = APP.selectedDay || '월';

  // 1. Teacher availability check
  const isAvailable = teacher.availability && 
    (teacher.availability[day] ? teacher.availability[day][Number(period) - 1] : teacher.availability[Number(period) - 1]) !== false;
  if (!isAvailable) return false;

  // 2. Already assigned check (slot must be empty or group capacity < 4)
  const tTimetable = MOCK_TIMETABLE.find(t => t.teacher === teacher.nick);
  const slot = tTimetable ? tTimetable.slots.find(sl => Number(sl.p) === Number(period) && sl.day === day) : null;
  if (slot && slot.student) {
    const isGroupSlot = slot.type && (slot.type.includes('그룹') || slot.type.includes('Group'));
    const isGroupStudent = s.course && (s.course.includes('그룹') || s.course.includes('Group'));
    if (isGroupSlot && isGroupStudent) {
      const alreadyInSlot = slot.students && slot.students.includes(s.nick);
      const count = slot.students ? slot.students.length : 0;
      if (alreadyInSlot || count >= 4) {
        return false;
      }
    } else {
      return false;
    }
  }

  // 3. Student double booking check (must not have class in this period)
  let studentOverlap = false;
  MOCK_TIMETABLE.forEach(time => {
    const conflictSlot = time.slots.find(sl => 
      Number(sl.p) === Number(period) && 
      sl.day === day && 
      (sl.student === s.nick || (sl.students && sl.students.includes(s.nick)))
    );
    if (conflictSlot) {
      const isSourceSlot = APP.dragSource && 
                           APP.dragSource.teacherName === time.teacher && 
                           Number(APP.dragSource.period) === Number(period) &&
                           (APP.dragSource.day || APP.selectedDay || '월') === day;
      if (!isSourceSlot) {
        studentOverlap = true;
      }
    }
  });
  if (studentOverlap) return false;

  return true;
}

function handleDragStart(event, studentId) {
  APP.draggedStudentId = studentId;
  event.dataTransfer.setData("text/plain", studentId);

  const s = MOCK_STUDENTS.find(st => st.id == studentId);
  if (!s) return;
  const isGroupStudent = s.course && (s.course.includes('그룹') || s.course.includes('Group'));

  // Highlight Daily cells
  document.querySelectorAll('.tsa-tt-cell, .tsa-tt-empty').forEach(cell => {
    const teacher   = cell.getAttribute('data-teacher');
    const period    = parseInt(cell.getAttribute('data-period'));
    const tableType = cell.getAttribute('data-table-type'); // '1on1' | 'group'
    if (!teacher || !period) return;

    const typeMismatch = (isGroupStudent && tableType === '1on1') || (!isGroupStudent && tableType === 'group');
    if (typeMismatch) {
      cell.classList.add('tsa-drag-unassignable');
    } else if (isSlotAssignable(studentId, teacher, period)) {
      cell.classList.add('tsa-drag-assignable');
    } else {
      cell.classList.add('tsa-drag-unassignable');
    }
  });

  // Highlight Weekly cells
  document.querySelectorAll('.tsa-wk-cell').forEach(cell => {
    const teacher = cell.getAttribute('data-teacher');
    const periodNum = parseInt(cell.getAttribute('data-period'));
    const day = cell.getAttribute('data-day');
    if (!teacher || !periodNum || !day) return;

    const origDay = APP.selectedDay;
    APP.selectedDay = day;
    const assignable = isSlotAssignable(studentId, teacher, periodNum);
    APP.selectedDay = origDay;

    if (assignable) {
      cell.classList.add('tsa-wk-drag-ok');
    } else {
      cell.classList.add('tsa-wk-drag-no');
    }
  });
}

function handleDragEnd(event) {
  document.querySelectorAll('.tsa-tt-cell, .tsa-tt-empty').forEach(cell => {
    cell.classList.remove('tsa-drag-assignable', 'tsa-drag-unassignable', 'tsa-drag-hover-assignable', 'tsa-drag-hover-unassignable');
  });
  document.querySelectorAll('.tsa-wk-cell').forEach(cell => {
    cell.classList.remove('tsa-wk-drag-ok', 'tsa-wk-drag-no');
  });
  APP.draggedStudentId = null;
}

function handleDragOver(event) {
  event.preventDefault();
}

function handleDragEnter(event) {
  event.preventDefault();
  const cell = event.currentTarget;
  const teacher = cell.getAttribute('data-teacher');
  const period = parseInt(cell.getAttribute('data-period'));
  if (!teacher || !period || !APP.draggedStudentId) return;

  if (isSlotAssignable(APP.draggedStudentId, teacher, period)) {
    cell.classList.add('tsa-drag-hover-assignable');
  } else {
    cell.classList.add('tsa-drag-hover-unassignable');
  }
}

function handleDragLeave(event) {
  const cell = event.currentTarget;
  cell.classList.remove('tsa-drag-hover-assignable', 'tsa-drag-hover-unassignable');
}

function handleDrop(event, teacherName, period) {
  event.preventDefault();

  document.querySelectorAll('.tsa-tt-cell, .tsa-tt-empty').forEach(cell => {
    cell.classList.remove('tsa-drag-assignable', 'tsa-drag-unassignable', 'tsa-drag-hover-assignable', 'tsa-drag-hover-unassignable');
  });
  document.querySelectorAll('.tsa-wk-cell').forEach(cell => {
    cell.classList.remove('tsa-wk-drag-ok', 'tsa-wk-drag-no');
  });

  const studentId = event.dataTransfer.getData("text/plain");
  APP.draggedStudentId = null;
  if (!studentId) return;

  // 교차 배정 차단
  const dropCell = event.currentTarget;
  const tableType = dropCell?.getAttribute('data-table-type');
  if (tableType) {
    const s = MOCK_STUDENTS.find(st => st.id == studentId);
    const isGroupStudent = s && (s.course.includes('그룹') || s.course.includes('Group'));
    if (tableType === '1on1' && isGroupStudent) {
      showToast('그룹 수업 수강생은 1:1 수업 슬롯에 배정할 수 없습니다.', 'danger');
      APP.dragSource = null;
      return;
    }
    if (tableType === 'group' && !isGroupStudent) {
      showToast('1:1 수강생은 그룹 수업 슬롯에 배정할 수 없습니다.', 'danger');
      APP.dragSource = null;
      return;
    }
  }

  const source = APP.dragSource;
  APP.dragSource = null;

  const target = { teacherName: teacherName, period: period };
  APP.assignTarget = target;

  if (source) {
    executeMoveAssignment(studentId, source, target);
  } else {
    confirmManualAssignment(studentId);
  }
}

function handleCellDragStart(event, teacherName, period, studentNick) {
  const s = MOCK_STUDENTS.find(std => std.nick === studentNick);
  if (!s) return;

  APP.draggedStudentId = s.id;
  event.dataTransfer.setData("text/plain", s.id);
  APP.dragSource = { teacherName: teacherName, period: period, day: APP.selectedDay || '월' };

  const isGroupStudent = s.course && (s.course.includes('그룹') || s.course.includes('Group'));

  // Highlight Daily cells
  document.querySelectorAll('.tsa-tt-cell, .tsa-tt-empty').forEach(cell => {
    const teacher   = cell.getAttribute('data-teacher');
    const periodNum = parseInt(cell.getAttribute('data-period'));
    const tableType = cell.getAttribute('data-table-type');
    if (!teacher || !periodNum) return;

    const typeMismatch = (isGroupStudent && tableType === '1on1') || (!isGroupStudent && tableType === 'group');
    if (typeMismatch) {
      cell.classList.add('tsa-drag-unassignable');
    } else if (isSlotAssignable(s.id, teacher, periodNum)) {
      cell.classList.add('tsa-drag-assignable');
    } else {
      cell.classList.add('tsa-drag-unassignable');
    }
  });

  // Highlight Weekly cells
  document.querySelectorAll('.tsa-wk-cell').forEach(cell => {
    const teacher = cell.getAttribute('data-teacher');
    const periodNum = parseInt(cell.getAttribute('data-period'));
    const day = cell.getAttribute('data-day');
    if (!teacher || !periodNum || !day) return;

    const origDay = APP.selectedDay;
    APP.selectedDay = day;
    const assignable = isSlotAssignable(s.id, teacher, periodNum);
    APP.selectedDay = origDay;

    if (assignable) {
      cell.classList.add('tsa-wk-drag-ok');
    } else {
      cell.classList.add('tsa-wk-drag-no');
    }
  });
}

function handleSidebarDrop(event) {
  event.preventDefault();
  const studentId = event.dataTransfer.getData("text/plain");
  APP.draggedStudentId = null;
  const source = APP.dragSource;
  APP.dragSource = null;

  if (!studentId || !source) return;

  if (source.day) APP.selectedDay = source.day;
  unassignSlot(source.teacherName, source.period);
}

function executeMoveAssignment(studentId, source, target) {
  const s = MOCK_STUDENTS.find(std => std.id == studentId);
  const tSource = MOCK_TIMETABLE.find(time => time.teacher === source.teacherName);
  if (!s || !tSource) return;

  const day = source.day || APP.selectedDay || '월';
  const oldSlot = tSource.slots.find(slot => slot.p === source.period && slot.day === day);
  if (!oldSlot) return;

  const isGroupSource = oldSlot.type && (oldSlot.type.includes('그룹') || oldSlot.type.includes('Group'));
  const origStudent = oldSlot.student;
  const origStudents = oldSlot.students ? [...oldSlot.students] : [];
  const origType = oldSlot.type;
  const origLocked = oldSlot.locked;
  const origSubject = oldSlot.subject;
  const origLevel = oldSlot.level;

  if (isGroupSource) {
    oldSlot.students = oldSlot.students.filter(st => st !== s.nick);
  } else {
    oldSlot.student = null;
    oldSlot.type = null;
    oldSlot.locked = false;
    oldSlot.subject = undefined;
    oldSlot.level = undefined;
  }

  const success = confirmManualAssignment(studentId);
  if (!success) {
    // Rollback
    if (isGroupSource) {
      oldSlot.students = origStudents;
    } else {
      oldSlot.student = origStudent;
      oldSlot.type = origType;
      oldSlot.locked = origLocked;
      oldSlot.subject = origSubject;
      oldSlot.level = origLevel;
    }

    renderTimetable(APP.conflictMode);
    renderUnassignedQueue();
  } else {
    MOCK_TIMETABLE_HISTORY.unshift({
      date: new Date().toISOString().slice(0,10),
      time: new Date().toTimeString().slice(0,5),
      actor: APP.user === 'agency_head' ? '에이전시' : 'Head Teacher (Kim)',
      change: `수업 이동: ${s.nick} 학생 (${source.teacherName} 강사 ${source.period}교시 -> ${target.teacherName} 강사 ${target.period}교시) 시간 변경`,
      reason: '드래그앤드롭 시간 임의 이동',
      type: 'info'
    });
    showToast(`✓ ${s.nick} 학생의 수업 시간이 성공적으로 변경되었습니다.`, 'success');
  }
}

function unassignSlot(teacherName, period, event) {
  if (event) event.stopPropagation();

  const tData = MOCK_TIMETABLE.find(t => t.teacher === teacherName);
  if (!tData) return;
  const day = APP.selectedDay || '월';
  const slot = tData.slots.find(s => s.p === period && s.day === day);
  if (!slot || !slot.student) return;

  const isGroup = slot.type && (slot.type.includes('그룹') || slot.type.includes('Group'));
  let targetNick = slot.student;

  if (isGroup) {
    const draggedStudent = APP.draggedStudentId ? MOCK_STUDENTS.find(std => std.id == APP.draggedStudentId) : null;
    if (draggedStudent) {
      targetNick = draggedStudent.nick;
    } else {
      const studentList = slot.students ? slot.students.join(', ') : '';
      if (!studentList) {
        targetNick = null;
      } else {
        const input = prompt(`그룹 수업(${slot.student})에서 제외할 학생의 닉네임을 입력하세요.\n현재 학생: ${studentList}`, slot.students ? slot.students[0] : '');
        if (!input) return; // cancel
        const trimmed = input.trim();
        if (slot.students && slot.students.includes(trimmed)) {
          targetNick = trimmed;
        } else {
          alert(`❌ 입력한 학생(${trimmed})은 이 그룹 수업에 배정되어 있지 않습니다.`);
          return;
        }
      }
    }
  }

  let publishedReason = '';
  if (APP.timetableStatus === 'Published') {
    if (slot.locked) {
      alert("❌ 시간표 잠김!\n\n이 교시는 잠금 처리되어 배정을 취소할 수 없습니다.");
      return;
    }
    publishedReason = prompt("🚨 시간표가 확정(Published)된 상태입니다. 배정 취소 사유를 입력하십시오:");
    if (!publishedReason) {
      alert("❌ 시간표 확정 상태에서 취소 시 사유 입력은 필수입니다. 취소가 무산되었습니다.");
      return;
    }
  }

  if (isGroup && targetNick) {
    slot.students = slot.students.filter(st => st !== targetNick);
  } else {
    slot.student = null;
    slot.students = [];
    slot.type = null;
    slot.locked = false;
    slot.subject = undefined;
    slot.level = undefined;
  }

  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().slice(0,10),
    time: new Date().toTimeString().slice(0,5),
    actor: APP.user === 'agency_head' ? '에이전시' : 'Head Teacher (Kim)',
    change: isGroup && targetNick 
      ? `그룹 제외: ${teacherName} 강사 ${day}요일 ${period}교시 그룹 수업에서 ${targetNick} 학생 제외`
      : `배정 취소: ${teacherName} 강사 ${day}요일 ${period}교시 ${targetNick} 학생 배정 소거`,
    reason: publishedReason || '수동 배정 취소',
    type: 'cancel'
  });

  showToast(isGroup && targetNick 
    ? `✓ ${targetNick} 학생이 그룹 수업에서 제외되었습니다.`
    : `✓ ${targetNick} 학생의 배정이 취소되었습니다.`, 'info');
  
  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();
}

function unassignFromModal() {
  if (!currentSubTarget.teacherName || !currentSubTarget.period) return;
  closeModal('timetable-substitute-modal');
  unassignSlot(currentSubTarget.teacherName, currentSubTarget.period);
}

function recalculateBellSystem() {
  // 벨 설정은 '교시 및 벨 설정' 페이지에서 관리합니다 (applyBellSettings 참조)
  renderTimetable(APP.conflictMode);
}

/* =============================================
   수업 편성(Scheduling) — 공통 교시(Period) 리스트 파생
   APP.bellSystem(교시 및 벨 설정)이 곧 PRD의 Period 개념이므로
   별도 마스터 데이터 없이 여기서 매 교시 시작/종료 시각을 계산해 반환한다.
   ============================================= */
function getPeriodList() {
  return buildBellSchedule(APP.bellSystem)
    .filter(row => row.p !== 'lunch')
    .map(row => ({ id: `P${row.p}`, order: row.p, startTime: row.start, endTime: row.end, active: true }));
}

function renderCsUnassignedTeachers() {
  const assignedNicks = new Set(
    MOCK_CLASS_ROOMS.filter(room => room.type === '1:1' && room.teacherNick).map(room => room.teacherNick)
  );
  return MOCK_TEACHERS
    .filter(teacher => teacher.status !== 'resigned' && !assignedNicks.has(teacher.nick))
    .map(teacher => `
      <tr style="background:#FFFBEB">
        <td><span style="font-size:10.5px;color:#B45309;font-weight:800">담당 강의실 필요</span></td>
        <td style="color:#9CA3AF">최대 1명</td>
        <td><strong>${teacher.nick}</strong> <span style="font-size:10.5px;color:#6B7280">${teacher.name}</span></td>
        <td><span style="font-size:10.5px;padding:3px 8px;border-radius:8px;background:#FEF3C7;color:#B45309;font-weight:700">미배정</span></td>
        <td><button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="openCsAssignTeacherRoom('${teacher.nick}')">강의실 배정</button></td>
      </tr>
    `).join('');
}

function fillCsRoomTeacherSelect(selectedNick) {
  const select = document.getElementById('cs-room-teacher');
  if (!select) return;
  const assignedElsewhere = new Map(
    MOCK_CLASS_ROOMS.filter(room => room.type === '1:1' && room.teacherNick).map(room => [room.teacherNick, room.roomNo])
  );
  select.innerHTML = '<option value="">담당 강사 미배정</option>' + MOCK_TEACHERS
    .filter(teacher => teacher.status !== 'resigned')
    .map(teacher => {
      const roomNo = assignedElsewhere.get(teacher.nick);
      const suffix = roomNo && teacher.nick !== selectedNick ? ` · ${roomNo} 배정 중` : '';
      return `<option value="${teacher.nick}" ${teacher.nick === selectedNick ? 'selected' : ''}>${teacher.nick} (${teacher.name})${suffix}</option>`;
    }).join('');
}

function openCsAssignTeacherRoom(teacherNick) {
  const emptyRoom = MOCK_CLASS_ROOMS.find(room => room.type === '1:1' && !room.teacherNick);
  openCsAddRoomModal(emptyRoom?.id);
  fillCsRoomTeacherSelect(teacherNick);
  const select = document.getElementById('cs-room-teacher');
  if (select) select.value = teacherNick;
}

function changeTimetableStatus() {
  const status = document.getElementById('timetable-status-select').value;
  APP.timetableStatus = status;
  showToast(`✓ 시간표 상태가 [${status === 'Draft' ? '초안 (Draft)' : '확정 (Published)'}] 상태로 변경되었습니다.`, 'success');
}

let MOCK_AUTO_CLOSED_ATTENDANCE = [];

function simulateMidnightAutoClose() {
  let closedCount = 0;
  const day = APP.selectedDay || '월';
  
  MOCK_TIMETABLE.forEach(t => {
    t.slots.forEach(s => {
      if (s.day === day && s.student) {
        const exists = MOCK_AUTO_CLOSED_ATTENDANCE.some(a => a.teacher === t.teacher && a.student === s.student && a.day === day && a.p === s.p);
        if (!exists) {
          MOCK_AUTO_CLOSED_ATTENDANCE.unshift({
            id: Date.now() + Math.floor(Math.random() * 1000),
            teacher: t.teacher,
            student: s.student,
            day: day,
            p: s.p,
            originalStatus: '미입력',
            currentStatus: '출석 (자동마감)',
            correctedStatus: '출석',
            closedTime: new Date().toISOString().replace('T', ' ').substring(0, 16)
          });
          closedCount++;
        }
      }
    });
  });
  
  if (closedCount > 0) {
    showToast(`✓ 자정 자동 마감 시뮬레이션 완료! ${closedCount}건의 강사 누락 수업이 '출석'으로 자동 마감 처리되어 관리자 대기함에 등록되었습니다.`, 'success');
    initAdminAttendanceInbox();
  } else {
    showToast(`이미 모든 수업이 자동 마감 대기함에 적재되어 있습니다.`, 'info');
  }
}

function initAdminAttendanceInbox() {
  const body = document.getElementById('admin-auto-attendance-body');
  const countEl = document.getElementById('admin-auto-attendance-count');
  if (!body) return;
  
  countEl.textContent = `누락 마감: ${MOCK_AUTO_CLOSED_ATTENDANCE.length}건`;
  
  if (MOCK_AUTO_CLOSED_ATTENDANCE.length === 0) {
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#9CA3AF">자동 마감된 출결 정보가 없습니다. [자정 자동 마감 시뮬]을 작동시켜 테스트해 보십시오.</td></tr>`;
  } else {
    body.innerHTML = MOCK_AUTO_CLOSED_ATTENDANCE.map(a => {
      return `
        <tr>
          <td><strong>${a.teacher}</strong></td>
          <td>${a.student}</td>
          <td>${a.day}요일 ${a.p}교시</td>
          <td><span class="tsa-badge tsa-badge-warning">${a.originalStatus}</span></td>
          <td><span class="tsa-badge tsa-badge-gray">${a.currentStatus}</span></td>
          <td>
            <select id="correct-select-${a.id}" class="tsa-input" style="width:80px;padding:3px;font-size:11.5px;">
              <option value="출석" ${a.correctedStatus === '출석' ? 'selected' : ''}>출석</option>
              <option value="지각" ${a.correctedStatus === '지각' ? 'selected' : ''}>지각</option>
              <option value="결석" ${a.correctedStatus === '결석' ? 'selected' : ''}>결석</option>
            </select>
          </td>
          <td style="text-align:center">
            <button class="tsa-btn tsa-btn-success tsa-btn-xs" style="background:#10B981;border:none" onclick="correctAutoClosedAttendance(${a.id})">정정 승인</button>
          </td>
        </tr>
      `;
    }).join('');
  }
}

function correctAutoClosedAttendance(id) {
  const select = document.getElementById(`correct-select-${id}`);
  if (!select) return;
  const newStatus = select.value;
  
  const entryIndex = MOCK_AUTO_CLOSED_ATTENDANCE.findIndex(a => a.id === id);
  if (entryIndex === -1) return;
  const entry = MOCK_AUTO_CLOSED_ATTENDANCE[entryIndex];
  
  const reason = prompt(`[출결 정정] 자동 마감된 출결 값을 [${newStatus}]으로 정정하시겠습니까? 정정 사유를 입력하십시오:`);
  if (reason === null) return;
  if (!reason.trim()) {
    alert("❌ 정정 사유는 필수 입력 사항입니다. 정정이 취소되었습니다.");
    return;
  }
  
  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().slice(0,10),
    time: new Date().toTimeString().slice(0,5),
    actor: 'Head Teacher (Kim)',
    change: `${entry.teacher} 강사 ${entry.day}요일 ${entry.p}교시 ${entry.student} 출결 정정 (${entry.currentStatus} ➔ ${newStatus})`,
    reason: reason,
    type: 'ok'
  });
  
  MOCK_AUTO_CLOSED_ATTENDANCE.splice(entryIndex, 1);
  showToast(`✓ 출결이 성공적으로 정정 승인되었습니다. 감사 로그에 기록 완료.`, 'success');
  
  initAdminAttendanceInbox();
}

function toggleConflictDemo() {
  APP.conflictMode = !APP.conflictMode;
  renderTimetable(APP.conflictMode);
  const indicator = document.getElementById('conflict-running-indicator');
  if (indicator) indicator.style.display = APP.conflictMode ? 'flex' : 'none';
  if (APP.conflictMode) {
    showToast('⚠️ 중복 배정 충돌 감지 작동 중 — Sarah 3교시 오류 표시', 'warning');
  } else {
    showToast('충돌 감지 해제', 'info');
  }
}

function toggleSlotLock(teacherName, period, event) {
  if (event) event.stopPropagation();
  const tData = MOCK_TIMETABLE.find(t => t.teacher === teacherName);
  if (!tData) return;
  const day = APP.selectedDay || '월';
  const slot = tData.slots.find(s => s.p === period && s.day === day);
  if (!slot) return;
  
  slot.locked = !slot.locked;
  renderTimetable(APP.conflictMode);
  showToast(`스케줄 잠금 ${slot.locked ? '설정🔒' : '해제🔓'}: ${teacherName} 강사 ${day}요일 ${period}교시`, 'info');
}

// 관리자가 개별 해제한 학생 닉네임 Set
const attRestrictUnlocked = new Set();

function openAutoAssignModal() {
  const day = APP.selectedDay || '월';
  const el = document.getElementById('ai-assign-scope');
  if (el) el.textContent = `${day}요일`;
  openModal('ai-assign-modal');
  renderAttendanceRestrictList();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderAttendanceRestrictList() {
  const container = document.getElementById('att-restrict-list');
  if (!container) return;

  const enabled   = document.getElementById('rule-att-restrict')?.checked ?? true;
  const threshold = parseInt(document.getElementById('att-threshold')?.value ?? '85', 10);

  if (!enabled) {
    container.innerHTML = `<div style="font-size:11px;color:#9CA3AF;padding:4px 0">규칙 비활성화 — 모든 학생 제한 없이 배정됩니다.</div>`;
    return;
  }

  const restricted = MOCK_STUDENTS.filter(s =>
    (s.status === 'current' || s.status === 'extended') &&
    typeof s.attendance === 'number' &&
    s.attendance < threshold
  );

  if (!restricted.length) {
    container.innerHTML = `<div style="font-size:11px;color:#16A34A;padding:4px 0">✓ 기준(${threshold}%) 미달 학생 없음 — 전원 배정 가능합니다.</div>`;
    return;
  }

  container.innerHTML = restricted.map(s => {
    const unlocked = attRestrictUnlocked.has(s.nick);
    const attColor = s.attendance >= 70 ? '#D97706' : '#EF4444';
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:8px;background:${unlocked ? '#F0FDF4' : '#FFF5F5'};border:1px solid ${unlocked ? '#BBF7D0' : '#FECACA'}">
        <div style="display:flex;align-items:center;gap:8px">
          <img src="assets/images/student_${s.gender === '남' ? 'male' : 'female'}.png"
               style="width:22px;height:22px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB"/>
          <div>
            <span style="font-size:12px;font-weight:700;color:#374151">${s.name} (${s.nick})</span>
            <span style="font-size:11px;color:${attColor};font-weight:700;margin-left:6px">${s.attendance}%</span>
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;font-size:11px;color:${unlocked ? '#16A34A' : '#EF4444'};font-weight:600">
          <input type="checkbox" ${unlocked ? 'checked' : ''}
            onchange="toggleAttUnlock('${s.nick}', this.checked)"
            style="accent-color:#16A34A"/>
          ${unlocked ? '제한 해제됨' : '제한 중'}
        </label>
      </div>`;
  }).join('');
}

function toggleAttUnlock(nick, unlocked) {
  if (unlocked) attRestrictUnlocked.add(nick);
  else attRestrictUnlocked.delete(nick);
  renderAttendanceRestrictList();
}

function resetTimetableSlots() {
  const day = APP.selectedDay || '월';
  const scope = `${day}요일`;

  if (!confirm(`${scope} 배정된 슬롯을 모두 초기화하시겠습니까?\n잠금(Lock)된 슬롯은 유지됩니다.`)) return;

  let cleared = 0;
  MOCK_TIMETABLE.forEach(entry => {
    entry.slots.forEach(slot => {
      if (slot.day !== day) return;
      if (slot.locked) return;
      if (!slot.student) return;
      slot.student = null;
      slot.type    = null;
      cleared++;
    });
  });

  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();
  if (typeof refreshIcons === 'function') refreshIcons();
  showToast(`${scope} 배정 초기화 완료 (${cleared}개 슬롯 초기화, 잠금 슬롯 유지)`, 'success');
}

function runAutoAssign() {
  const rules = {
    courseMatch:   document.getElementById('rule-course-match')?.checked  ?? true,
    groupFirst:    document.getElementById('rule-group-first')?.checked   ?? false,
    maxHours:      document.getElementById('rule-max-hours')?.checked     ?? true,
    loadBalance:   document.getElementById('rule-load-balance')?.checked  ?? true,
    keepLocked:    document.getElementById('rule-keep-locked')?.checked   ?? true,
    noDuplicate:   document.getElementById('rule-no-duplicate')?.checked  ?? true,
    attRestrict:   document.getElementById('rule-att-restrict')?.checked  ?? true,
    attThreshold:  parseInt(document.getElementById('att-threshold')?.value ?? '85', 10),
  };

  closeModal('ai-assign-modal');
  showToast('AI 자동 배정 알고리즘 구동 중...', 'info');

  setTimeout(() => {
    const day = APP.selectedDay || '월';
    const activeStudents = MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'extended');
    let assignCount = 0;
    let skipCount = 0;

    // 1단계: 메모리 내 기존 중복 슬롯 노드 제거 (Deduplication)
    MOCK_TIMETABLE.forEach(entry => {
      const seen = {}; // key: `${day}-${Number(p)}` -> slot object
      const uniqueSlots = [];
      entry.slots.forEach(slot => {
        const key = `${slot.day}-${Number(slot.p)}`;
        if (!seen[key]) {
          seen[key] = slot;
          uniqueSlots.push(slot);
        } else {
          const existing = seen[key];
          if (!existing.locked && slot.locked) {
            const idx = uniqueSlots.indexOf(existing);
            if (idx !== -1) uniqueSlots[idx] = slot;
            seen[key] = slot;
          } else if (!existing.locked && !slot.locked && !existing.student && slot.student) {
            const idx = uniqueSlots.indexOf(existing);
            if (idx !== -1) uniqueSlots[idx] = slot;
            seen[key] = slot;
          }
        }
      });
      entry.slots = uniqueSlots;
    });

    // 2단계: 자동 배정 실행일의 기존 비잠금 1:1 배정 초기화 (Clean Slate)
    MOCK_TIMETABLE.forEach(entry => {
      entry.slots.forEach(slot => {
        if (slot.day === day && !slot.locked && !isGroupSlot(slot)) {
          slot.student = null;
          slot.type = null;
        }
      });
    });

    // key: `${teacher}-${period}` → 강사+교시 단위로 점유 추적 (1:1은 한 슬롯에 한 명만)
    const slotOccupied = {}; // key: `${teacherNick}-${p}` → studentNick
    // key: `${studentNick}` → Set of period numbers (학생이 같은 교시에 중복 배정 방지)
    const studentPeriods = {};
    MOCK_TIMETABLE.forEach(entry => {
      entry.slots.forEach(slot => {
        if (!slot.student || isGroupSlot(slot) || slot.day !== day) return;
        slotOccupied[`${entry.teacher}-${Number(slot.p)}`] = slot.student;
        if (!studentPeriods[slot.student]) studentPeriods[slot.student] = new Set();
        studentPeriods[slot.student].add(Number(slot.p));
      });
    });

    // 학생별 현재 배정 수 계산 (선택 요일 기준)
    function getStudentSlotCount(nick) {
      let c = 0;
      MOCK_TIMETABLE.forEach(e => e.slots.forEach(s => {
        if (s.day === day && s.student === nick && !isGroupSlot(s)) c++;
      }));
      return c;
    }

    // 강사별 현재 배정 수 계산 (선택 요일만 — 실시간 반영)
    function getTeacherSlotCount(teacherNick) {
      const entry = MOCK_TIMETABLE.find(e => e.teacher === teacherNick);
      if (!entry) return 0;
      return entry.slots.filter(s => s.day === day && s.student).length;
    }

    // 점수: courseMatch는 hard 필터(canAssign)에서 처리, 여기선 loadBalance만
    // → IELTS 보너스 제거. 모든 적격 강사 중 배정 수 적은 강사 우선.
    function matchScore(teacher, student) {
      let score = 0;
      if (rules.loadBalance) {
        score -= getTeacherSlotCount(teacher.nick);
      }
      return score;
    }

    // 강사 목록을 matchScore 내림차순으로 정렬해서 최적 강사 선택
    function findBestTeacherForStudent(student, period) {
      const candidates = MOCK_TIMETABLE
        .filter(entry => {
          const slot = entry.slots.find(s => Number(s.p) === Number(period));
          if (!slot || slot.student) return false;          // 이미 찼거나 없음
          if (rules.keepLocked && slot.locked) return false; // 잠금 슬롯 제외
          if (isGroupSlot(slot)) return false;               // 그룹 슬롯 제외
          return true;
        })
        .map(entry => {
          const teacher = MOCK_TEACHERS.find(t => t.nick === entry.teacher);
          return { entry, teacher, score: teacher ? matchScore(teacher, student) : -99 };
        })
        .sort((a, b) => b.score - a.score);
      return candidates[0] || null;
    }

    // 빈 슬롯 수집 (그룹 제외, 선택 요일만, 그룹 전담 강사 제외)
    // seenKeys로 teacher+period 중복 슬롯 원천 차단 (초기화 중복 실행 방어)
    const emptySlots = [];
    const seenSlotKeys = new Set();
    MOCK_TIMETABLE.forEach(entry => {
      const teacher = MOCK_TEACHERS.find(t => t.nick === entry.teacher);
      if (!teacher) return;
      if (isGroupTeacher(teacher)) return;
      entry.slots.forEach(slot => {
        if (slot.day !== day) return;
        if (slot.student) return; // 이미 배정된 슬롯 제외
        if (rules.keepLocked && slot.locked) return; // 잠금 슬롯 보존
        if (isGroupSlot(slot)) return;

        // Verify teacher availability for this slot
        const avail = teacher.availability?.[day];
        const isAvail = avail ? avail[Number(slot.p) - 1] !== false : true;
        if (!isAvail) return;

        const key = `${entry.teacher}-${Number(slot.p)}`;
        if (seenSlotKeys.has(key)) return; // 중복 슬롯 제거
        seenSlotKeys.add(key);
        emptySlots.push({ entry, slot });
      });
    });
    // 교시 순으로 정렬 (같은 교시 내에서는 강사 이름 순)
    emptySlots.sort((a, b) => Number(a.slot.p) - Number(b.slot.p) || a.entry.teacher.localeCompare(b.entry.teacher));

    // 학생별 최대 수업시간
    // (IELTS 5시간, 그 외 4시간 제한 유지)
    function maxHoursFor(student) {
      return student.course?.includes('IELTS') ? 5 : 4;
    }

    // 학생이 이 슬롯에 배정 가능한지 체크. 불가 이유 반환, null이면 가능
    // (여기서 동일 학생 동시 배정 방지 로직 적용)
    function canAssign(student, entry, slot, teacher) {
      const limit = rules.maxHours ? maxHoursFor(student) : 99;
      if (getStudentSlotCount(student.nick) >= limit) return 'limit';

      if (rules.attRestrict) {
        const att = typeof student.attendance === 'number' ? student.attendance : 100;
        if (att < rules.attThreshold && !attRestrictUnlocked.has(student.nick)) return 'att';
      }

      // 1:1 수업은 같은 교시에 한 학생이 두 강사에게 동시 배정되면 안 됨 — 항상 강제
      if (studentPeriods[student.nick]?.has(Number(slot.p))) return 'dup';

      if (rules.courseMatch) {
        const isJunior = student.course?.includes('주니어');
        const isIELTS  = student.course?.includes('IELTS');
        if (isJunior && !teacher.type.includes('주니어') && !teacher.type.includes('일반')) return 'course';
        if (isIELTS  && teacher.type.includes('주니어')) return 'course';
      }

      return null;
    }

    // 슬롯 우선 배정: 각 빈 슬롯에 가장 적합한 학생을 찾아 배정
    // → 강사별 집중 현상 방지 (학생 우선 방식은 먼저 처리된 학생이 특정 강사를 독점함)
    for (const { entry, slot } of emptySlots) {
      if (slot.student) continue;
      const slotKey = `${entry.teacher}-${Number(slot.p)}`;
      if (slotOccupied[slotKey]) continue;

      const teacher = MOCK_TEACHERS.find(t => t.nick === entry.teacher);
      if (!teacher) continue;

      // 이 슬롯에 배정 가능한 학생 중 matchScore 최고인 학생 선택
      let bestStudent = null;
      let bestScore   = -Infinity;

      for (const student of activeStudents) {
        if (canAssign(student, entry, slot, teacher) !== null) continue;
        const score = matchScore(teacher, student);
        if (score > bestScore) {
          bestScore   = score;
          bestStudent = student;
        }
      }

      if (!bestStudent) continue;

      // 배정 실행
      const isIELTS = bestStudent.course?.includes('IELTS');
      slot.student = bestStudent.nick;
      slot.type    = isIELTS ? 'IELTS 1:1' : teacher.type.includes('비즈니스') ? 'Biz 1:1' : '1:1 General';
      slot.locked  = false;

      slotOccupied[slotKey] = bestStudent.nick;
      if (!studentPeriods[bestStudent.nick]) studentPeriods[bestStudent.nick] = new Set();
      studentPeriods[bestStudent.nick].add(Number(slot.p));
      assignCount++;
    }

    renderTimetable(APP.conflictMode);
    renderUnassignedQueue();
    if (typeof refreshIcons === 'function') refreshIcons();

    const restrictedCount = rules.attRestrict
      ? MOCK_STUDENTS.filter(s =>
          (s.status === 'current' || s.status === 'extended') &&
          typeof s.attendance === 'number' &&
          s.attendance < rules.attThreshold &&
          !attRestrictUnlocked.has(s.nick)
        ).length
      : 0;

    const ruleNames = [
      rules.courseMatch   ? '코스 매칭' : null,
      rules.preferSame    ? '연속성 유지' : null,
      rules.maxHours      ? '최대시간 준수' : null,
      rules.loadBalance   ? '부하 균등' : null,
      rules.keepLocked    ? '잠금 보존' : null,
      rules.noDuplicate   ? '중복 방지' : null,
      rules.attRestrict   ? `출석률 제한(${rules.attThreshold}%↑, 해제 ${attRestrictUnlocked.size}명)` : null,
    ].filter(Boolean).join(' · ');

    const restrictMsg = restrictedCount > 0 ? ` · 출석 미달 ${restrictedCount}명 제외됨` : '';
    showToast(`✓ AI 자동 배정 완료 — ${assignCount}개 슬롯 배정${restrictMsg} (규칙: ${ruleNames})`, 'success');
  }, 800);
}

// 구버전 호환 (직접 호출 시)
function runAutoMatch() { openAutoAssignModal(); }

// Substitute Management
let currentSubTarget = { teacherName: '', period: 0, studentName: '', courseName: '' };

function openSubstituteModal(teacherName, period) {
  const tData = MOCK_TIMETABLE.find(t => t.teacher === teacherName);
  if (!tData) return;
  const day = APP.selectedDay || '월';
  const slot = tData.slots.find(s => s.p === period && s.day === day);
  if (!slot || !slot.student) return;

  currentSubTarget = {
    teacherName: teacherName,
    period: period,
    studentName: slot.student,
    courseName: slot.type
  };

  const teacher = MOCK_TEACHERS.find(t => t.nick === teacherName);
  const student = MOCK_STUDENTS.find(s => s.nick === slot.student);

  const tPhoto = teacher ? (teacher.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png') : 'assets/images/teacher_male.png';
  const sPhoto = student ? (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png') : 'assets/images/student_male.png';

  // Modify the container to show photos:
  const infoContainer = document.querySelector('#timetable-substitute-modal .tsa-modal-body > div');
  if (infoContainer) {
    infoContainer.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${tPhoto}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;"/>
        <div>대상 강사: <strong id="sub-teacher-name">${teacherName}</strong></div>
      </div>
      <div>수업 교시: <strong id="sub-period-num">${period}교시</strong></div>
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="${sPhoto}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;"/>
        <div>배정 학생: <strong id="sub-student-name">${slot.student}</strong></div>
      </div>
      <div>수강 코스: <strong id="sub-course-name">${slot.type || '1:1'}</strong></div>
    `;
  }

  // Substitute recommend list
  const listEl = document.getElementById('substitute-teacher-list');
  listEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="assets/images/teacher_male.png" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;"/>
        <div>
          <div style="font-size:12.5px;font-weight:700;color:#15803D">Mike (Cruz Johnson)</div>
          <div style="font-size:10px;color:#16A34A">가용 대체 강사 · 전문분야 매치 (1:1)</div>
        </div>
      </div>
      <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="background:#16A34A" onclick="executeSubstitute('Mike')">배정</button>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:10px">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="assets/images/teacher_female.png" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;"/>
        <div>
          <div style="font-size:12.5px;font-weight:700;color:#991B1B">Emily (Santos Cruz)</div>
          <div style="font-size:10px;color:#C53030">가용 강사 · ⚠ 전문분야 불일치 (주니어 전담)</div>
        </div>
      </div>
      <button class="tsa-btn tsa-btn-danger tsa-btn-sm" onclick="executeSubstitute('Emily')">강제배정</button>
    </div>
  `;

  openModal('timetable-substitute-modal');
}

function changeTeacherStatus(status) {
  showToast(`근태 처리: ${currentSubTarget.teacherName} 강사 [${status}] 상태 전환`, 'success');
  if (status === '결근') {
    const tData = MOCK_TIMETABLE.find(t => t.teacher === currentSubTarget.teacherName);
    if (tData) {
      const day = APP.selectedDay || '월';
      const slot = tData.slots.find(s => s.p === currentSubTarget.period && s.day === day);
      if (slot) {
        slot.student = null;
        slot.type = null;
      }
    }
    closeModal('timetable-substitute-modal');
    renderTimetable(APP.conflictMode);
    renderUnassignedQueue();
    showToast(`⚠ ${currentSubTarget.teacherName} 강사 결근에 따라 스케줄이 비워졌습니다. 대체 강사를 투입하십시오.`, 'warning');
  }
}

function executeSubstitute(subTeacherName) {
  const isMismatch = subTeacherName === 'Emily';

  if (isMismatch) {
    if (confirm(`⚠ 레벨/코스 불일치 경고\n\n대체 투입할 ${subTeacherName} 강사는 주니어 전담이나, 학생 수강 코스는 ${currentSubTarget.courseName}입니다.\n\n강제 배정(Overrule)하시겠습니까?`)) {
      applySubstitute(subTeacherName);
    }
  } else {
    applySubstitute(subTeacherName);
  }
}

function applySubstitute(subTeacherName) {
  const originalStudent = currentSubTarget.studentName;
  const originalCourse = currentSubTarget.courseName;
  const day = APP.selectedDay || '월';

  // Update timetable
  const originalTeacherData = MOCK_TIMETABLE.find(t => t.teacher === currentSubTarget.teacherName);
  if (originalTeacherData) {
    const slot = originalTeacherData.slots.find(s => Number(s.p) === Number(currentSubTarget.period) && s.day === day);
    if (slot) {
      slot.student = null;
      slot.type = null;
    }
  }

  const newTeacherData = MOCK_TIMETABLE.find(t => t.teacher === subTeacherName);
  if (newTeacherData) {
    const slot = newTeacherData.slots.find(s => Number(s.p) === Number(currentSubTarget.period) && s.day === day);
    if (slot) {
      slot.student = originalStudent;
      slot.type = originalCourse;
      slot.locked = false;
    } else {
      newTeacherData.slots.push({
        p: Number(currentSubTarget.period),
        day: day,
        student: originalStudent,
        type: originalCourse,
        locked: false
      });
    }
  }

  // Audit trail log
  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().slice(0,10),
    time: new Date().toTimeString().slice(0,5),
    actor: 'Head Teacher (Kim)',
    change: `${currentSubTarget.teacherName} → ${subTeacherName} 대체 지정`,
    reason: `대체 투입 (${originalStudent} 수강생)`,
    type: 'info'
  });

  if (typeof MOCK_SUBSTITUTE_LOGS !== 'undefined') {
    MOCK_SUBSTITUTE_LOGS.unshift({
      date: new Date().toISOString().slice(0,10),
      originalTeacher: currentSubTarget.teacherName,
      subTeacher: subTeacherName,
      subject: originalCourse || '1:1 Class',
      reason: `${currentSubTarget.teacherName} 결근으로 대체 투입 (${originalStudent} 수강생)`
    });
  }

  closeModal('timetable-substitute-modal');
  renderTimetable(APP.conflictMode);
  renderUnassignedQueue();

  showToast(`✓ 대체 강사 배정 완료: ${subTeacherName} 강사 투입`, 'success');
  alert(`📢 [실시간 진도 전송 완료]\n\n대체 투입된 ${subTeacherName} 강사의 모바일 웹으로 진도 인수인계 데이터가 전송되었습니다.\n\n- 대상 학생: ${originalStudent}\n- 진도 정보: Side by Side - Book 2 / Ch.3 / P.45`);
}

function openTimetableHistory() {
  const content = document.getElementById('timetable-history-content');
  content.innerHTML = `
    <table class="tsa-table">
      <thead>
        <tr>
          <th>날짜 / 시간</th>
          <th>처리 담당자</th>
          <th>변경 내용</th>
          <th>변경 사유</th>
          <th>유형</th>
        </tr>
      </thead>
      <tbody>
        ${MOCK_TIMETABLE_HISTORY.map(h => `
          <tr>
            <td style="white-space:nowrap">
              <div style="font-weight:600;font-size:12px">${h.date}</div>
              <div style="color:#9CA3AF;font-size:11px">${h.time}</div>
            </td>
            <td style="font-size:12px">${h.actor}</td>
            <td style="font-size:12px;font-weight:600">${h.change}</td>
            <td style="font-size:12px;color:#6B7280">${h.reason}</td>
            <td>${h.type === 'warn'
              ? '<span class="tsa-badge tsa-badge-warning">주의</span>'
              : h.type === 'ok'
              ? '<span class="tsa-badge tsa-badge-success">정상</span>'
              : '<span class="tsa-badge tsa-badge-info">정보</span>'
            }</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  openModal('timetable-history-modal');
}

/* =============================================
   수업 시간표 — 목록과 편집
   ============================================= */

function getTimetables() {
  return typeof MOCK_TIMETABLES !== 'undefined' ? MOCK_TIMETABLES : [];
}

function getTimetableById(id) {
  return getTimetables().find(item => item.id === id) || null;
}

function getDefaultTimetable() {
  const list = getTimetables();
  return list.find(item => item.isDefault && item.active !== false)
    || list.find(item => item.active !== false)
    || list[0]
    || null;
}

// 그 날짜에 살아 있는 시간표. 기간이 비어 있으면 열려 있는 것으로 본다.
function isTimetableEffectiveOn(timetable, dateStr) {
  if (!timetable || timetable.active === false) return false;
  if (!dateStr) return true;
  if (timetable.validFrom && dateStr < timetable.validFrom) return false;
  if (timetable.validTo && dateStr > timetable.validTo) return false;
  return true;
}

function getEffectiveTimetables(dateStr) {
  return getTimetables().filter(item => isTimetableEffectiveOn(item, dateStr));
}

// 교시 하나가 차지하는 시각 구간(분). 시간표가 여럿이면 「5교시」만으로는 자리를 알 수 없어서,
// 충돌을 볼 때는 번호가 아니라 이 구간이 겹치는지를 봐야 한다.
function getTimetablePeriodRange(timetable, period) {
  const row = (timetable?.periods || []).find(item => Number(item.order) === Number(period));
  if (!row) return null;
  const start = bellTimeToMinutes(row.start);
  const end = bellTimeToMinutes(row.end);
  if (start == null || end == null) return null;
  return { start, end };
}

function getTimetablePeriodLabel(timetable, period) {
  const row = (timetable?.periods || []).find(item => Number(item.order) === Number(period));
  return row ? `${row.start} - ${row.end}` : '';
}

function getTimetableTotalPeriods(timetable) {
  return (timetable?.periods || []).length;
}

// 교시가 서로 겹치거나 순서가 뒤집힌 곳. 시각을 직접 넣게 되면서 생길 수 있는 실수라
// 목록과 편집 화면 양쪽에서 같은 함수로 잡는다.
function getTimetableIssues(timetable) {
  const issues = [];
  const rows = [...(timetable?.periods || [])].sort((a, b) => a.order - b.order);
  rows.forEach(row => {
    const start = bellTimeToMinutes(row.start);
    const end = bellTimeToMinutes(row.end);
    if (start == null || end == null) { issues.push(`${row.order}교시 시각이 비었어`); return; }
    if (end <= start) issues.push(`${row.order}교시 종료가 시작보다 빨라`);
  });
  for (let i = 1; i < rows.length; i += 1) {
    const prevEnd = bellTimeToMinutes(rows[i - 1].end);
    const start = bellTimeToMinutes(rows[i].start);
    if (prevEnd != null && start != null && start < prevEnd) {
      issues.push(`${rows[i - 1].order}교시와 ${rows[i].order}교시가 겹쳐`);
    }
  }
  return issues;
}

function getTimetableRangeLabel(timetable) {
  if (!timetable.validFrom && !timetable.validTo) return '기간 없음';
  const fmt = value => (value || '').replace(/^20/, '').replace(/-/g, '.');
  return `${fmt(timetable.validFrom) || '~'} ~ ${fmt(timetable.validTo) || '계속'}`;
}

// 이 시간표를 쓰는 학생 수. 아직 아무 시간표도 못 받은 학생은 대기로 따로 센다.
function countStudentsOnTimetable(timetableId) {
  return MOCK_STUDENTS.filter(student =>
    ['current', 'waiting', 'extended'].includes(student.status)
    && student.timetableId === timetableId).length;
}

function getTimetableWaitingStudents() {
  const ids = new Set(getTimetables().map(item => item.id));
  return MOCK_STUDENTS.filter(student =>
    ['current', 'waiting', 'extended'].includes(student.status)
    && !ids.has(student.timetableId));
}

// ── 목록 ────────────────────────────────────────────────
let _timetableEditId = null;

function renderCoursePeriodTab() {
  const host = document.getElementById('course-pricing-tab-period');
  if (!host) return;
  host.innerHTML = _timetableEditId ? renderTimetableEditor() : renderTimetableList();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function renderTimetableList() {
  const list = getTimetables();
  const waiting = getTimetableWaitingStudents().length;
  const today = new Date().toISOString().slice(0, 10);

  const rows = list.map(timetable => {
    const issues = getTimetableIssues(timetable);
    const live = isTimetableEffectiveOn(timetable, today);
    const students = countStudentsOnTimetable(timetable.id);
    const periods = timetable.periods || [];
    const first = periods[0];
    const last = periods[periods.length - 1];
    return `<tr style="cursor:pointer" onclick="openTimetableEditor('${lessonEsc(timetable.id)}')">
      <td style="padding:11px 12px;border-bottom:1px solid #F3F4F6">
        <span style="display:inline-flex;align-items:center;gap:7px">
          <span style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:7px;background:#EEF2FF;color:#4338CA;font-size:11px;font-weight:800">${lessonEsc(timetable.code || '-')}</span>
          <b style="font-size:12.5px;color:#111827">${lessonEsc(timetable.name)}</b>
          ${timetable.isDefault ? '<span style="font-size:9px;font-weight:800;padding:1px 6px;border-radius:5px;background:#F3F4F6;color:#6B7280">기본</span>' : ''}
        </span>
        ${timetable.note ? `<div style="font-size:10px;color:#9CA3AF;margin-top:3px">${lessonEsc(timetable.note)}</div>` : ''}
      </td>
      <td style="padding:11px 12px;border-bottom:1px solid #F3F4F6;font-size:11.5px;color:#4B5563;white-space:nowrap">${periods.length}교시<div style="font-size:10px;color:#9CA3AF;margin-top:2px">${first ? lessonEsc(first.start) : '-'} ~ ${last ? lessonEsc(last.end) : '-'}</div></td>
      <td style="padding:11px 12px;border-bottom:1px solid #F3F4F6;font-size:11.5px;color:#4B5563;white-space:nowrap">${lessonEsc(timetable.lunch?.start || '-')} ~ ${lessonEsc(timetable.lunch?.end || '-')}</td>
      <td style="padding:11px 12px;border-bottom:1px solid #F3F4F6;font-size:11.5px;color:#4B5563;white-space:nowrap">${lessonEsc(getTimetableRangeLabel(timetable))}</td>
      <td style="padding:11px 12px;border-bottom:1px solid #F3F4F6;font-size:11.5px;color:#4B5563;white-space:nowrap">${students}명</td>
      <td style="padding:11px 12px;border-bottom:1px solid #F3F4F6;white-space:nowrap">
        ${timetable.active === false
          ? '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;background:#F3F4F6;color:#9CA3AF">사용 안 함</span>'
          : (live
            ? '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;background:#ECFDF5;color:#047857">사용 중</span>'
            : '<span style="font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;background:#FFFBEB;color:#B45309">기간 밖</span>')}
        ${issues.length ? `<span title="${lessonEsc(issues.join(' · '))}" style="margin-left:5px;font-size:10px;font-weight:800;padding:2px 8px;border-radius:8px;background:#FEE2E2;color:#DC2626">교시 ${issues.length}건 확인</span>` : ''}
      </td>
    </tr>`;
  }).join('');

  return `<div class="tsa-card">
    <div class="tsa-card-header">
      <h3 class="tsa-card-title"><i data-lucide="clock" style="color:#5E5CE6"></i> 수업 시간표</h3>
      <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="createTimetable()"><i data-lucide="plus-square"></i> 시간표 추가</button>
    </div>
    <div style="padding:11px 14px;border-bottom:1px solid #E5E7EB;background:#F9FAFB;font-size:11px;color:#6B7280;line-height:1.75">
      교시마다 시작·종료 시각을 직접 넣어. 타입이 여럿인 건 <b>같은 날 함께 돌기</b> 때문이야 — 점심을 나눠 먹으면 같은 5교시라도 조마다 시각이 달라져.
      ${waiting ? `<br><b style="color:#B45309">아직 시간표를 못 받은 학생이 ${waiting}명</b> 있어. 주간 수업 배정 화면에서 배정해줘.` : ''}
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:760px">
        <thead><tr>
          ${['시간표', '교시', '점심', '적용 기간', '소속 학생', '상태'].map(label =>
            `<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:800;color:#9CA3AF;border-bottom:1px solid #E5E7EB;white-space:nowrap">${label}</th>`).join('')}
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="6" style="padding:22px;text-align:center;font-size:11.5px;color:#9CA3AF">시간표가 없어. 오른쪽 위에서 만들어줘.</td></tr>'}</tbody>
      </table>
    </div>
  </div>`;
}

function openTimetableEditor(id) {
  _timetableEditId = id;
  renderCoursePeriodTab();
}

function closeTimetableEditor() {
  _timetableEditId = null;
  renderCoursePeriodTab();
}

function createTimetable() {
  const base = getDefaultTimetable();
  const code = String.fromCharCode(65 + getTimetables().length);
  const timetable = {
    id: `TT_${Date.now()}`,
    code,
    name: `${code}조`,
    note: '',
    validFrom: '',
    validTo: '',
    active: true,
    isDefault: false,
    lunch: { ...(base?.lunch || { start: '12:05', end: '13:05' }) },
    // 빈 칸부터 채우게 하면 열두 줄을 손으로 다 넣어야 한다. 기본 시간표를 베껴 시작한다.
    periods: (base?.periods || []).map(row => ({ ...row }))
  };
  MOCK_TIMETABLES.push(timetable);
  showToast(`✓ ${timetable.name} 시간표를 만들었어. 교시 시각을 확인해줘.`, 'success');
  openTimetableEditor(timetable.id);
}

// ── 편집 ────────────────────────────────────────────────
function renderTimetableEditor() {
  const timetable = getTimetableById(_timetableEditId);
  if (!timetable) return renderTimetableList();
  const issues = getTimetableIssues(timetable);
  const lunchStart = bellTimeToMinutes(timetable.lunch?.start);
  const lunchEnd = bellTimeToMinutes(timetable.lunch?.end);

  const field = (label, html) => `<div style="display:flex;flex-direction:column;gap:5px">
    <label style="font-size:10.5px;font-weight:800;color:#6B7280">${label}</label>${html}
  </div>`;
  const input = 'class="tsa-input" style="height:34px;font-size:12px"';

  const rows = [...(timetable.periods || [])].sort((a, b) => a.order - b.order).map((row, index, list) => {
    const start = bellTimeToMinutes(row.start);
    const end = bellTimeToMinutes(row.end);
    const minutes = start != null && end != null ? end - start : null;
    const prev = index ? list[index - 1] : null;
    const gap = prev && bellTimeToMinutes(prev.end) != null && start != null ? start - bellTimeToMinutes(prev.end) : null;
    const bad = minutes != null && minutes <= 0;
    const overlap = gap != null && gap < 0;
    // 점심이 이 교시 앞에 놓이면 줄을 하나 끼워 보여준다 — 표만 보고 하루가 읽히게.
    const lunchRow = lunchStart != null && start != null && prev && bellTimeToMinutes(prev.end) <= lunchStart && start >= lunchEnd
      ? `<tr style="background:#FFFBEB"><td style="padding:7px 12px;font-size:11px;font-weight:700;color:#B45309" colspan="4">🍱 점심 ${lessonEsc(timetable.lunch.start)} - ${lessonEsc(timetable.lunch.end)}</td></tr>`
      : '';
    return `${lunchRow}<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:11.5px;font-weight:700;color:#111827;white-space:nowrap">${row.order}교시</td>
      <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6"><input type="time" value="${lessonEsc(row.start)}" ${input} style="height:31px;font-size:11.5px;width:118px" onchange="updateTimetablePeriod('${lessonEsc(timetable.id)}',${row.order},'start',this.value)"/></td>
      <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6"><input type="time" value="${lessonEsc(row.end)}" ${input} style="height:31px;font-size:11.5px;width:118px" onchange="updateTimetablePeriod('${lessonEsc(timetable.id)}',${row.order},'end',this.value)"/></td>
      <td style="padding:6px 12px;border-bottom:1px solid #F3F4F6;font-size:10.5px;white-space:nowrap;color:${bad || overlap ? '#DC2626' : '#9CA3AF'}">
        ${minutes != null ? `${minutes}분` : '-'}${overlap ? ' · 앞 교시와 겹침' : (gap != null && gap > 0 ? ` · 쉬는 시간 ${gap}분` : '')}
      </td>
    </tr>`;
  }).join('');

  return `<div style="display:flex;flex-direction:column;gap:14px">
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="closeTimetableEditor()">← 목록</button>
      <b style="font-size:14px;color:#111827">${lessonEsc(timetable.name)}</b>
      <span style="font-size:11px;color:#9CA3AF">${lessonEsc(getTimetableRangeLabel(timetable))} · 소속 학생 ${countStudentsOnTimetable(timetable.id)}명</span>
      <button class="tsa-btn tsa-btn-outline tsa-btn-sm" style="margin-left:auto" onclick="deleteTimetable('${lessonEsc(timetable.id)}')">시간표 삭제</button>
    </div>

    ${issues.length ? `<div style="padding:10px 13px;border:1px solid #FCA5A5;border-radius:10px;background:#FEF2F2;font-size:11.5px;color:#B91C1C;line-height:1.7"><b>확인할 교시가 ${issues.length}건 있어.</b><br>${issues.map(lessonEsc).join('<br>')}</div>` : ''}

    <div style="display:grid;grid-template-columns:minmax(260px,1fr) minmax(340px,1.4fr);gap:16px;align-items:start">
      <div class="tsa-card"><div class="tsa-card-header"><h3 class="tsa-card-title" style="font-size:12.5px">기본 정보</h3></div>
        <div class="tsa-card-body" style="padding:16px;display:flex;flex-direction:column;gap:13px">
          ${field('이름', `<input type="text" value="${lessonEsc(timetable.name)}" ${input} onchange="updateTimetableField('${lessonEsc(timetable.id)}','name',this.value)"/>`)}
          ${field('코드 <span style="font-weight:400;color:#9CA3AF">— 화면에 A · B로 붙는 글자</span>', `<input type="text" maxlength="2" value="${lessonEsc(timetable.code || '')}" ${input} style="height:34px;font-size:12px;width:80px" onchange="updateTimetableField('${lessonEsc(timetable.id)}','code',this.value)"/>`)}
          ${field('설명', `<input type="text" value="${lessonEsc(timetable.note || '')}" ${input} placeholder="예: 점심 2부" onchange="updateTimetableField('${lessonEsc(timetable.id)}','note',this.value)"/>`)}
          ${field('적용 시작', `<input type="date" value="${lessonEsc(timetable.validFrom || '')}" ${input} onchange="updateTimetableField('${lessonEsc(timetable.id)}','validFrom',this.value)"/>`)}
          ${field('적용 종료 <span style="font-weight:400;color:#9CA3AF">— 비우면 계속</span>', `<input type="date" value="${lessonEsc(timetable.validTo || '')}" ${input} onchange="updateTimetableField('${lessonEsc(timetable.id)}','validTo',this.value)"/>`)}
          <div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:2px">
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:#4B5563;cursor:pointer"><input type="checkbox" ${timetable.active !== false ? 'checked' : ''} onchange="updateTimetableField('${lessonEsc(timetable.id)}','active',this.checked)"/> 사용</label>
            <label style="display:inline-flex;align-items:center;gap:6px;font-size:11.5px;color:#4B5563;cursor:pointer"><input type="checkbox" ${timetable.isDefault ? 'checked' : ''} onchange="updateTimetableField('${lessonEsc(timetable.id)}','isDefault',this.checked)"/> 기본 시간표</label>
          </div>
          <div style="display:flex;gap:10px">
            ${field('점심 시작', `<input type="time" value="${lessonEsc(timetable.lunch?.start || '')}" ${input} style="height:34px;font-size:12px;width:118px" onchange="updateTimetableLunch('${lessonEsc(timetable.id)}','start',this.value)"/>`)}
            ${field('점심 종료', `<input type="time" value="${lessonEsc(timetable.lunch?.end || '')}" ${input} style="height:34px;font-size:12px;width:118px" onchange="updateTimetableLunch('${lessonEsc(timetable.id)}','end',this.value)"/>`)}
          </div>
        </div>
      </div>

      <div class="tsa-card"><div class="tsa-card-header">
          <h3 class="tsa-card-title" style="font-size:12.5px">교시별 시간</h3>
          <span style="display:inline-flex;gap:6px">
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="addTimetablePeriod('${lessonEsc(timetable.id)}')">＋ 교시 추가</button>
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="removeTimetablePeriod('${lessonEsc(timetable.id)}')">마지막 교시 삭제</button>
          </span>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;min-width:430px">
            <thead><tr>${['교시', '시작', '종료', ''].map(label =>
              `<th style="text-align:left;padding:7px 12px;font-size:10px;font-weight:800;color:#9CA3AF;border-bottom:1px solid #E5E7EB">${label}</th>`).join('')}</tr></thead>
            <tbody>${rows || '<tr><td colspan="4" style="padding:18px;text-align:center;font-size:11px;color:#9CA3AF">교시가 없어.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>
  </div>`;
}

function updateTimetableField(id, key, value) {
  const timetable = getTimetableById(id);
  if (!timetable) return;
  if (key === 'isDefault' && value) getTimetables().forEach(item => { item.isDefault = false; });
  timetable[key] = value;
  renderCoursePeriodTab();
}

function updateTimetableLunch(id, key, value) {
  const timetable = getTimetableById(id);
  if (!timetable) return;
  timetable.lunch = { ...(timetable.lunch || {}), [key]: value };
  renderCoursePeriodTab();
}

function updateTimetablePeriod(id, order, key, value) {
  const timetable = getTimetableById(id);
  if (!timetable) return;
  const row = (timetable.periods || []).find(item => Number(item.order) === Number(order));
  if (!row) return;
  row[key] = value;
  syncCsPeriodsFromBellSystem();
  renderCoursePeriodTab();
}

function addTimetablePeriod(id) {
  const timetable = getTimetableById(id);
  if (!timetable) return;
  const rows = timetable.periods || (timetable.periods = []);
  const last = rows[rows.length - 1];
  const lastEnd = last ? bellTimeToMinutes(last.end) : 8 * 60;
  const start = lastEnd == null ? 8 * 60 : lastEnd + 10;
  rows.push({ order: (last?.order || 0) + 1, start: bellMinutesToTime(start), end: bellMinutesToTime(start + 50) });
  renderCoursePeriodTab();
}

function removeTimetablePeriod(id) {
  const timetable = getTimetableById(id);
  if (!timetable || !(timetable.periods || []).length) return;
  const last = timetable.periods[timetable.periods.length - 1];
  const used = MOCK_GROUP_CLASSES.some(group => group.status === 'active'
    && (group.periods || []).map(Number).includes(Number(last.order)));
  if (used && !window.confirm(`${last.order}교시에 이미 수업이 있어. 그래도 지울까?`)) return;
  timetable.periods.pop();
  renderCoursePeriodTab();
}

function deleteTimetable(id) {
  const timetable = getTimetableById(id);
  if (!timetable) return;
  const students = countStudentsOnTimetable(id);
  const message = students
    ? `${timetable.name}을 지우면 소속 학생 ${students}명이 시간표 없는 상태로 돌아가. 지울까?`
    : `${timetable.name}을 지울까?`;
  if (!window.confirm(message)) return;
  MOCK_STUDENTS.forEach(student => { if (student.timetableId === id) student.timetableId = null; });
  const index = MOCK_TIMETABLES.indexOf(timetable);
  if (index >= 0) MOCK_TIMETABLES.splice(index, 1);
  showToast(`${timetable.name} 시간표를 지웠어.`, 'success');
  closeTimetableEditor();
}

/* =============================================
   BELL & PERIOD SETTINGS PAGE
   ============================================= */
function initBellSettingsView() {
  const settings = APP.bellSystem || { duration: 50, break: 10, start: '08:00', total: 12, lunchStart: '12:05', lunchDuration: 60 };
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('bell-settings-duration', settings.duration);
  setVal('bell-settings-break', settings.break);
  setVal('bell-settings-start', settings.start || '08:00');
  setVal('bell-settings-total-periods', settings.total || 12);
  setVal('bell-settings-lunch-start', settings.lunchStart || '12:05');
  setVal('bell-settings-lunch-duration', settings.lunchDuration || 60);
  if (document.getElementById('bell-settings-duration')) previewBellSettings();
}

function previewBellSettings() {
  const dur = parseInt(document.getElementById('bell-settings-duration').value);
  const brk = parseInt(document.getElementById('bell-settings-break').value);
  const start = document.getElementById('bell-settings-start').value || '08:00';
  const total = parseInt(document.getElementById('bell-settings-total-periods').value);
  const lunchStart = document.getElementById('bell-settings-lunch-start').value || '12:05';
  const lunchDur = parseInt(document.getElementById('bell-settings-lunch-duration').value);

  const previewBody = document.getElementById('bell-settings-preview-body');
  if (!previewBody) return;

  const schedule = buildBellSchedule({ duration: dur, break: brk, start, total, lunchStart, lunchDuration: lunchDur });
  const rowsHtml = schedule.map(row => {
    if (row.p === 'lunch') {
      return `
        <tr style="background:#FFFBEB;color:#B45309;font-weight:700;">
          <td style="padding:10px;text-align:center;">🍱 점심</td>
          <td style="padding:10px;text-align:center;">${row.start} - ${row.end}</td>
          <td style="padding:10px;text-align:center;">식사 및 휴식 (${lunchDur}분)</td>
        </tr>
      `;
    }
    return `
      <tr>
        <td style="padding:10px;text-align:center;font-weight:700;">${row.p}교시</td>
        <td style="padding:10px;text-align:center;">${row.start} - ${row.end}</td>
        <td style="padding:10px;text-align:center;"><span class="tsa-badge tsa-badge-success">${dur}분 수업</span></td>
      </tr>
    `;
  }).join('');
  previewBody.innerHTML = rowsHtml;
}

function applyBellSettings() {
  const dur = parseInt(document.getElementById('bell-settings-duration').value);
  const brk = parseInt(document.getElementById('bell-settings-break').value);
  const start = document.getElementById('bell-settings-start').value || '08:00';
  const total = parseInt(document.getElementById('bell-settings-total-periods').value);
  const lunchStart = document.getElementById('bell-settings-lunch-start').value || '12:05';
  const lunchDur = parseInt(document.getElementById('bell-settings-lunch-duration').value);

  // Time format regex check (HH:MM)
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start)) {
    alert("❌ 시작 시간 형식이 유효하지 않습니다. (예: 08:00 형식으로 입력)");
    return;
  }
  if (!/^([0-1]\d|2[0-3]):[0-5]\d$/.test(lunchStart)) {
    alert("❌ 점심 시작 시간 형식이 유효하지 않습니다. (예: 12:05)");
    return;
  }
  if (total < 1 || total > 15) {
    alert("❌ 하루 총 교시 수는 1교시부터 15교시까지 설정할 수 있습니다.");
    return;
  }

  let applyOption = "1";
  if (APP.timetableStatus === 'Published') {
    // 확정 상태일 때만 선택 모달 표시
    const choice = window._bellApplyChoice;
    if (!choice) {
      // 인라인 확인 UI 표시
      const confirmEl = document.getElementById('bell-apply-confirm-bar');
      if (confirmEl) {
        confirmEl.style.display = '';
        confirmEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }
    applyOption = choice;
    window._bellApplyChoice = null;
    const confirmEl = document.getElementById('bell-apply-confirm-bar');
    if (confirmEl) confirmEl.style.display = 'none';
  }
  // Draft 상태는 바로 적용 (confirm 다이얼로그 없음)

  // Update global state
  APP.bellSystem = {
    duration: dur,
    break: brk,
    start: start,
    total: total,
    lunchStart: lunchStart,
    lunchDuration: lunchDur
  };
  syncCsPeriodsFromBellSystem();

  if (applyOption === "1") {
    showToast(`✓ 교시 설정 변경: 총 ${total}교시 / 점심 ${lunchStart}부터 ${lunchDur}분이 즉시 적용되었습니다.`, 'success');
  } else {
    showToast(`✓ 교시 설정 예약: 총 ${total}교시 / 점심 ${lunchStart}부터 ${lunchDur}분이 차주 월요일 적용 예약되었습니다.`, 'success');
  }

  // Log to Audit History
  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().slice(0,10),
    time: new Date().toTimeString().slice(0,5),
    actor: 'Head Teacher (Kim)',
    change: `벨 시스템 변경: ${dur}분 수업 / ${brk}분 휴식 / 총 ${total}교시 / 점심 ${lunchStart}~${bellMinutesToTime(bellTimeToMinutes(lunchStart) + lunchDur)}`,
    reason: applyOption === "1" ? '벨 설정 즉시 적용' : '벨 설정 차주 예약 적용',
    type: 'info'
  });

  // 현재 설정 화면은 유지하고, 연결된 시간표 화면 데이터만 갱신한다.
  previewBellSettings();
  renderTimetable(APP.conflictMode);
  if (document.getElementById('cs-panel-view')?.style.display !== 'none') renderFinalTimetableView();
}

// ── 데모용 시드: "학생 수업 배정" 목록의 약 1/4을 미리 배정 완료 상태로 채워둔다.
// 실제 배정 함수(그룹 배정/1:1 담당강사/1:1 스케줄)를 그대로 사용해서 정원·시간 충돌 없이 만든다.
// 요일·교시 조합을 넓게 시도해 가능한 한 "전부 배정 완료"까지 만들고, 그래도 안 되는 학생은 건너뛴다.
(function seedDemoLessonAssignments() {
  if (window.__tsaDemoAssignmentsSeeded) return;
  window.__tsaDemoAssignmentsSeeded = true;
  if (typeof getStudentLessonRequirements !== 'function') return;

  const ALL_DAYS = ['월', '화', '수', '목', '금'];
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;

  // 실제로 손으로 채운 시드 그룹들과 같은 모양(주 5회 · 요일 전체)이 되도록 월~금 풀타임 조합을 먼저 시도하고,
  // 그래도 강사·강의실이 안 나면 2일짜리 조합으로 좁혀서 재시도한다.
  function tryFillGroupRequirement(student, req) {
    let groupId = getCandidateGroupsForStudentRequirement(student, req)[0]?.id;
    if (groupId) return groupId;
    const level = getLevelGroupForStudent(student);
    // 그룹은 과정 템플릿 기준 1시간짜리 수업이라 교시도 1개만 쓴다(2교시 연속 배정 금지).
    const dayCombos = [ALL_DAYS, ...ALL_DAYS.slice(0, -1).map((day, i) => [day, ALL_DAYS[i + 1]])];
    const templatePeriod = Number(req.sequence);
    if (!Number.isFinite(templatePeriod) || templatePeriod < 1 || templatePeriod > totalPeriods) return null;
    for (const days of dayCombos) {
      if (!groupId) {
        const periods = [templatePeriod];
        const teacherCands = getGroupTeacherCandidates(req.classType, days, periods, null);
        const roomCands = getGroupRoomCandidates(req.classType, days, periods, getGroupClassCapacity(req.classType), null);
        if (teacherCands.length && roomCands.length) {
          const result = saveGroupFromBrowserPopup(null, {
            curriculum: [{ id: req.subjectId, hours: 1 }],
            course: student.course || '',
            levelGroups: [level],
            classType: req.classType,
            startDate: student.startDate || '2026-06-01',
            periods, dayOfWeek: days,
            teacherId: teacherCands[0].id, roomId: roomCands[0].id
          });
          if (result.ok) groupId = MOCK_GROUP_CLASSES[MOCK_GROUP_CLASSES.length - 1].id;
        }
      }
      if (groupId) break;
    }
    return groupId;
  }

  function tryFullyAssign(student) {
    const requirements = getStudentLessonRequirements(student);
    let ok = true;

    requirements.filter(r => r.classType !== '1:1').forEach(req => {
      const groupId = tryFillGroupRequirement(student, req);
      if (groupId) {
        const result = assignStudentToGroupFromBrowserPopup(student.id, groupId);
        if (!result.ok) ok = false;
      } else {
        ok = false;
      }
    });

    const oneToOneReqs = requirements.filter(r => r.classType === '1:1');
    if (oneToOneReqs.length) {
      const teacherCandidates = MOCK_TEACHERS.filter(t => t.status !== 'resigned' && (t.classTypes || []).includes('1:1') && t.room);
      let assignedAllOneToOne = false;
      for (const teacher of teacherCandidates) {
        const result = saveStudentPrimaryTeacher(student.id, teacher.id);
        if (result.ok) {
          assignedAllOneToOne = true;
          break;
        }
      }
      if (!assignedAllOneToOne) ok = false;
    }
    return ok;
  }

  const eligible = MOCK_STUDENTS.filter(s =>
    ['current', 'waiting', 'extended'].includes(s.status) && getStudentLessonRequirements(s).length > 0
  );
  const targetCount = Math.max(1, Math.round(eligible.length / 4));
  let filled = 0;
  for (const student of eligible) {
    if (filled >= targetCount) break;
    if (tryFullyAssign(student)) filled++;
  }
})();
