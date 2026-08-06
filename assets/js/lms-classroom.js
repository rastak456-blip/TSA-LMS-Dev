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
  { id: 1, room: 'A-101', building: 'A동', floor: '1층', capacity: 2, type: '1:1', status: 'active', memo: '' },
  { id: 2, room: 'A-102', building: 'A동', floor: '1층', capacity: 2, type: '1:1', status: 'active', memo: '' },
  { id: 3, room: 'A-103', building: 'A동', floor: '1층', capacity: 2, type: '1:1', status: 'active', memo: '' },
  { id: 4, room: 'A-104', building: 'A동', floor: '1층', capacity: 2, type: '1:1', status: 'active', memo: '파트타임 전용' },
  { id: 5, room: 'B-201', building: 'B동', floor: '2층', capacity: 8, type: '그룹', status: 'active', memo: '' },
  { id: 6, room: 'B-202', building: 'B동', floor: '2층', capacity: 8, type: '그룹', status: 'maintenance', memo: '에어컨 점검 중' },
  { id: 7, room: 'C-301', building: 'C동', floor: '3층', capacity: 6, type: '멀티', status: 'active', memo: '주니어 전용' },
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
      <td style="color:#6B7280">${c.building} ${c.floor}</td>
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
      <td style="color:#9CA3AF">-</td>
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
    if (c.room === 'B-201') assignedClass = '<span style="color:#5E5CE6;font-weight:700">IELTS A반 (Sarah)</span>';
    else if (c.room === 'B-202') assignedClass = '<span style="color:#D97706;font-weight:700">비즈니스 중급반 (David)</span>';
    
    return `<tr>
      <td style="font-weight:700">${c.room}</td>
      <td style="color:#6B7280">${c.building} ${c.floor}</td>
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
  document.getElementById('cr-modal-building').value = '';
  document.getElementById('cr-modal-floor').value = '';
  
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
  document.getElementById('cr-modal-building').value = c.building;
  document.getElementById('cr-modal-floor').value = c.floor;
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
    building: document.getElementById('cr-modal-building').value.trim(),
    floor: document.getElementById('cr-modal-floor').value.trim(),
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
let MOCK_CLASS_ROOMS = [
  { id: 1, roomNo: 'A-101', type: '1:1', capacity: 1, teacherNick: 'Sarah', status: 'active' },
  { id: 2, roomNo: 'A-102', type: '1:1', capacity: 1, teacherNick: 'Mike',  status: 'active' },
  { id: 3, roomNo: 'A-103', type: '1:1', capacity: 1, teacherNick: 'David', status: 'active' },
  { id: 4, roomNo: 'B-201', type: '1:4', capacity: 4, teacherNick: '',      status: 'active' },
  { id: 5, roomNo: 'C-301', type: '1:8', capacity: 8, teacherNick: '',      status: 'active' },
  { id: 6, roomNo: 'A-105', type: '1:1', capacity: 1, teacherNick: 'Karen', status: 'active' },
  { id: 7, roomNo: 'B-203', type: '1:4', capacity: 4, teacherNick: '',      status: 'active' },
  { id: 8, roomNo: 'A-106', type: '1:1', capacity: 1, teacherNick: 'Lisa',  status: 'active' },
  { id: 9, roomNo: 'B-202', type: '1:4', capacity: 4, teacherNick: '',      status: 'active' },
  { id: 10, roomNo: 'A-104', type: '1:1', capacity: 1, teacherNick: 'Sophia', status: 'active' },
  { id: 11, roomNo: 'C-302', type: '1:8', capacity: 8, teacherNick: '',     status: 'active' },
  { id: 12, roomNo: 'C-303', type: '1:8', capacity: 8, teacherNick: '',     status: 'active' },
  { id: 13, roomNo: 'A-107', type: '1:1', capacity: 1, teacherNick: 'Daniel', status: 'active' },
  { id: 14, roomNo: 'A-108', type: '1:1', capacity: 1, teacherNick: 'Ella',   status: 'active' },
  { id: 15, roomNo: 'B-204', type: '1:4', capacity: 4, teacherNick: '',       status: 'active' },
  // 2026-08-03: 1:1 학생 수만큼 전담 강사를 채운 것과 짝을 맞춘 1:1 강의실.
  { id: 16, roomNo: 'A-109', type: '1:1', capacity: 1, teacherNick: 'Olivia', status: 'active' },
  { id: 17, roomNo: 'A-110', type: '1:1', capacity: 1, teacherNick: 'Ethan',  status: 'active' },
  { id: 18, roomNo: 'A-111', type: '1:1', capacity: 1, teacherNick: 'Noah',   status: 'active' },
  { id: 19, roomNo: 'A-112', type: '1:1', capacity: 1, teacherNick: 'Ava',    status: 'active' },
  { id: 20, roomNo: 'A-113', type: '1:1', capacity: 1, teacherNick: 'Liam',   status: 'active' },
  { id: 21, roomNo: 'A-114', type: '1:1', capacity: 1, teacherNick: 'Mia',    status: 'active' },
  { id: 22, roomNo: 'A-115', type: '1:1', capacity: 1, teacherNick: 'Lucas',  status: 'active' },
  { id: 23, roomNo: 'A-116', type: '1:1', capacity: 1, teacherNick: 'Zoe',    status: 'active' },
  { id: 24, roomNo: 'A-117', type: '1:1', capacity: 1, teacherNick: 'Ryan',   status: 'active' },
  { id: 25, roomNo: 'A-118', type: '1:1', capacity: 1, teacherNick: 'Chloe',  status: 'active' },
  { id: 26, roomNo: 'A-119', type: '1:1', capacity: 1, teacherNick: 'Adam',   status: 'active' },
  { id: 27, roomNo: 'A-120', type: '1:1', capacity: 1, teacherNick: 'Nora',   status: 'active' },
  { id: 28, roomNo: 'A-121', type: '1:1', capacity: 1, teacherNick: 'Owen',   status: 'active' },
  { id: 29, roomNo: 'A-122', type: '1:1', capacity: 1, teacherNick: 'Ivy',    status: 'active' },
  { id: 30, roomNo: 'A-123', type: '1:1', capacity: 1, teacherNick: 'Caleb',  status: 'active' },
  { id: 31, roomNo: 'A-124', type: '1:1', capacity: 1, teacherNick: 'Ruby',   status: 'active' },
  { id: 32, roomNo: 'A-125', type: '1:1', capacity: 1, teacherNick: 'Aiden',  status: 'active' },
  { id: 33, roomNo: 'A-126', type: '1:1', capacity: 1, teacherNick: 'Stella', status: 'active' },
  { id: 34, roomNo: 'A-127', type: '1:1', capacity: 1, teacherNick: 'Miles',  status: 'active' },
];
let _csRoomNextId = 35;
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
          <span style="display:block;margin-top:3px;font-size:9.5px;color:#6B7280">${lessonEsc(teacher?.nick || '강사 미배정')} · ${group.studentIds.length}/${getGroupClassCapacity(group.classType)}명</span>
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
        <span style="display:block;margin-top:3px;font-size:9.5px;color:#6B7280">${lessonEsc(teacher?.nick || '강사 미배정')} · ${group.studentIds.length}/${getGroupClassCapacity(group.classType)}명</span>
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
  
  { id: 11, roomId: 4, day: '월', periods: [5, 6], studentIds: [1, 2, 4], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 12, roomId: 4, day: '수', periods: [5, 6], studentIds: [1, 2, 4], course: 'Regular', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 13, roomId: 5, day: '월', periods: [2], studentIds: [14, 15, 16], course: 'Junior ESL', level: 'Beginner', weekOf: '2026-06-22' },
  { id: 14, roomId: 5, day: '화', periods: [2], studentIds: [14, 15, 16], course: 'Junior ESL', level: 'Beginner', weekOf: '2026-06-22' },
  { id: 15, roomId: 5, day: '수', periods: [2], studentIds: [14, 15, 16], course: 'Junior ESL', level: 'Beginner', weekOf: '2026-06-22' },
  
  { id: 16, roomId: 6, day: '월', periods: [3, 4], studentIds: [12], course: '가디언 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 17, roomId: 6, day: '목', periods: [3, 4], studentIds: [12], course: '가디언 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 18, roomId: 7, day: '화', periods: [4, 5], studentIds: [5, 10], course: 'IELTS Intensive', level: 'Band 6.5', weekOf: '2026-06-22' },
  { id: 19, roomId: 7, day: '목', periods: [4, 5], studentIds: [5, 10], course: 'IELTS Intensive', level: 'Band 6.5', weekOf: '2026-06-22' },
  
  { id: 20, roomId: 8, day: '월', periods: [2, 3], studentIds: [13], course: 'IELTS Intensive', level: 'Band 5.0', weekOf: '2026-06-22' },
  { id: 21, roomId: 8, day: '수', periods: [2, 3], studentIds: [13], course: 'IELTS Intensive', level: 'Band 5.0', weekOf: '2026-06-22' },
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
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [5], teacherId: 3, roomId: 4,
    studentIds: [], manualLockIds: [], status: 'active', createdAt: '2026-06-01' },
  { id: 2, name: '리딩 G3', course: 'Regular', subjectId: 'SUB_03', levelGroup: 3, levelGroups: [3], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [7], teacherId: 9, roomId: 5,
    studentIds: [], manualLockIds: [], status: 'active', createdAt: '2026-06-01' },
  { id: 5, name: '일반 문법 G3', course: 'Regular', subjectId: 'SUB_02', levelGroup: 3, levelGroups: [3], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [8], teacherId: 8, roomId: 5,
    studentIds: [], manualLockIds: [], status: 'active', createdAt: '2026-06-02' },
  { id: 9, name: '주니어 리딩 G1', course: 'Junior ESL', subjectId: 'SUB_03', levelGroup: 1, levelGroups: [1], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [7], teacherId: 5, roomId: 11,
    studentIds: [], manualLockIds: [], status: 'active', createdAt: '2026-06-02' },
  { id: 10, name: '일상회화 G3', course: 'Regular', subjectId: 'SUB_08', levelGroup: 3, levelGroups: [3], classType: '1:4',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [5], teacherId: 9, roomId: 9,
    studentIds: [], manualLockIds: [], status: 'active', createdAt: '2026-06-02' },
  { id: 11, name: '리딩 G4', course: 'Regular', subjectId: 'SUB_03', levelGroup: 4, levelGroups: [4], classType: '1:8',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [7], teacherId: 1, roomId: 12,
    studentIds: [], manualLockIds: [], status: 'active', createdAt: '2026-06-02' },
  { id: 12, name: '비즈니스 토론 G5', course: 'Special English(TOEIC, Business)', subjectId: 'SUB_10', levelGroup: 5, levelGroups: [5], classType: '1:4',
    weeklyFrequency: 5, startDate: '2026-06-22', dayOfWeek: ['월', '화', '수', '목', '금'], periods: [6], teacherId: 2, roomId: 7,
    studentIds: [], manualLockIds: [], status: 'active', createdAt: '2026-06-02' },
];
let _csGroupNextId = 14;
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
  const base = getGroupBaseCapacity(group.classType);
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

// 그룹 생성/수정 시 선택한 요일·교시·유형·정원에 맞는 강의실 후보. 다른 운영 그룹과 요일·교시가 겹치면 제외한다.
function getGroupRoomCandidates(classType, days, periods, capacityNeeded, excludeGroupId) {
  if (!classType || !Array.isArray(days) || !days.length || !Array.isArray(periods) || !periods.length) return [];
  const allowedTypes = classType === '1:8' ? ['1:8'] : classType === '1:4' ? ['1:4', '1:8'] : ['1:1', '1:4', '1:8'];
  return MOCK_CLASS_ROOMS.filter(room => {
    if (room.status !== 'active' || !allowedTypes.includes(room.type)) return false;
    if (room.capacity < (capacityNeeded || 1)) return false;
    return !MOCK_GROUP_CLASSES.some(g =>
      g.id !== excludeGroupId && g.status === 'active' && g.roomId === room.id &&
      Array.isArray(g.dayOfWeek) && Array.isArray(g.periods) &&
      g.dayOfWeek.some(d => days.includes(d)) && g.periods.some(p => periods.includes(p))
    );
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
    const group = MOCK_GROUP_CLASSES.find(g =>
      g.status === 'active' && g.classType === item.classType &&
      getGroupSubjectId(g) === item.subjectId &&
      Array.isArray(g.periods) && g.periods.includes(index + 1) &&
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

function getCandidateGroupsForStudentRequirement(student, requirement) {
  const level = getLevelGroupForStudent(student);
  return MOCK_GROUP_CLASSES.filter(g =>
    g.status === 'active' && g.classType === requirement.classType &&
    getGroupSubjectId(g) === requirement.subjectId &&
    Array.isArray(g.periods) && g.periods.includes(requirement.sequence) &&
    level != null && getGroupLevelSet(g).includes(level) &&
    g.studentIds.length < getGroupClassCapacity(g.classType) &&
    !g.studentIds.includes(student.id)
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
          const teacherLabel = teacher ? ` (${lessonEsc(teacher.nick || teacher.name)})` : '';
          return `<span class="tsa-badge tsa-badge-success" style="${oneLine}">${req.period || req.sequence}교시 · ${lessonEsc(req.classType)}·${lessonEsc(req.subjectName)}${teacherLabel}</span>`;
        }
        detail = teacher ? `${lessonEsc(teacher.nick || teacher.name)} · ${lessonEsc(lessonFormatDays(req.dayOfWeek))} ${req.period || ''}교시` : '';
      } else if (compact) {
        // 그룹에 강사까지 배정됐으면 1:1과 같은 형식으로 강사명을 붙여줘.
        const group = req.groupId != null ? MOCK_GROUP_CLASSES.find(g => g.id === req.groupId) : null;
        const groupTeacher = group && group.teacherId != null ? MOCK_TEACHERS.find(t => t.id === group.teacherId) : null;
        const teacherLabel = groupTeacher ? ` (${lessonEsc(groupTeacher.nick || groupTeacher.name)})` : '';
        return `<span class="tsa-badge tsa-badge-success" style="${oneLine}">${req.sequence}교시 · ${lessonEsc(req.classType)}·${lessonEsc(req.subjectName)}${teacherLabel}</span>`;
      } else {
        const group = req.groupId != null ? MOCK_GROUP_CLASSES.find(g => g.id === req.groupId) : null;
        const levelLabel = group ? getGroupLevelSet(group).map(getLevelGroupName).join(', ') : student.level;
        return `<span class="tsa-badge tsa-badge-success" style="display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;font-size:9.5px;line-height:1.35;margin:2px;padding:5px 8px"><span>${req.sequence}교시 · ${lessonEsc(req.classType)} · ${lessonEsc(req.subjectName)}</span><span style="font-weight:700">${lessonEsc(levelLabel)} · ${lessonEsc(getGroupSizeShortLabel(req.classType))}</span></span>`;
      }
      return `<span class="tsa-badge tsa-badge-success" style="${oneLine}">${lessonEsc(req.classType)}·${lessonEsc(req.subjectName)}${detail ? ` (${detail})` : ''}</span>`;
    }
    if (req.classType !== '1:1' && !compact) {
      return `<span class="tsa-badge tsa-badge-gray" style="display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;font-size:9.5px;line-height:1.35;margin:2px;padding:5px 8px"><span>${req.sequence}교시 · ${lessonEsc(req.classType)} · ${lessonEsc(req.subjectName)}</span><span style="font-weight:700">${lessonEsc(student.level)} · ${lessonEsc(getGroupSizeShortLabel(req.classType))} · 미배정</span></span>`;
    }
    return `<span class="tsa-badge tsa-badge-gray" style="${oneLine}">${req.sequence}교시 · ${lessonEsc(req.classType)}·${lessonEsc(req.subjectName)} 미배정</span>`;
  }).join('') || '<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px">배정 대상 없음</span>';
}

const LESSON_ASSIGNMENT_BUTTON_LABELS = { '1:1': '1:1 수업 배정', '1:4': '중그룹 수업 배정', '1:8': '대그룹 수업 배정' };

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
        <div style="display:flex;align-items:center;gap:8px">
          <img class="tsa-avatar" src="${avatarSrc}" style="width:30px;height:30px;object-fit:cover;border-radius:50%;border:1px solid #E5E7EB;flex-shrink:0" alt="${lessonEsc(student.nick || student.name || '')}"/>
          <div>
            <b>${lessonEsc(student.nick || student.name)}</b><div style="font-size:10px;color:#9CA3AF">${lessonEsc(student.name || '')}</div>
            <div style="font-size:10px;color:#6B7280">${lessonEsc(student.flag || '')} ${lessonEsc(student.nationality || '-')} · ${lessonEsc(student.gender || '-')} ${student.age != null ? student.age + '세' : ''}</div>
          </div>
        </div>
      </td>
      <td style="font-size:11px;color:#4B5563">${lessonEsc(student.course || '-')}<div style="font-size:10px;color:#9CA3AF">${lessonEsc(period)}</div></td>
      <td style="font-size:11px">${lessonEsc(student.level || '-')}</td>
      <td style="font-size:11px;font-weight:700;color:${summary.assigned === summary.total ? '#059669' : '#B45309'}">${summary.assigned}/${summary.total}교시</td>
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

function renderStudentClassAssignView() {
  const showGroups = _studentClassAssignTab === 'groups';
  ['students', 'groups'].forEach(tab => {
    const button = document.getElementById(`sca-tab-${tab}`);
    if (!button) return;
    const selected = (tab === 'groups') === showGroups;
    button.style.color = selected ? '#5E5CE6' : '#6B7280';
    button.style.borderBottomColor = selected ? '#5E5CE6' : 'transparent';
  });
  const studentsPanel = document.getElementById('sca-panel-students');
  const groupsPanel = document.getElementById('sca-panel-groups');
  // 그룹 생성·자동 매칭 버튼은 그룹 편성 탭에서만 의미가 있어.
  const groupActions = document.getElementById('sca-group-actions');
  if (studentsPanel) studentsPanel.style.display = showGroups ? 'none' : 'block';
  if (groupsPanel) groupsPanel.style.display = showGroups ? 'block' : 'none';
  if (groupActions) groupActions.style.display = showGroups ? 'flex' : 'none';
  if (showGroups) renderStudentClassAssignGroupPanel();
  else renderStudentClassAssignList();
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
  const oneToOneTypes = ['1:1'];
  const groupTypes = ['1:4', '1:8'];
  const rows = getLessonAssignableStudentsSorted().map(student => {
    const requirements = getStudentLessonRequirements(student);
    const oneToOneReqs = requirements.filter(req => oneToOneTypes.includes(req.classType));
    const groupReqs = requirements.filter(req => groupTypes.includes(req.classType));
    return { student, oneToOneReqs, groupReqs };
  }).filter(row => row.oneToOneReqs.length > 0 || row.groupReqs.length > 0);

  body.innerHTML = rows.map(({ student, oneToOneReqs, groupReqs }, idx) => {
    const period = [student.startDate, student.departureDate].filter(Boolean).join(' ~ ') || '-';
    const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
    const studentInfoCell = `
      <td rowspan="2" style="text-align:center;color:#9CA3AF;font-size:11px;vertical-align:middle">${rows.length - idx}</td>
      <td rowspan="2" class="sca-student-cell" style="vertical-align:middle">
        <div style="display:flex;align-items:center;gap:8px">
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

    const buildTypeRow = (label, badgeColor, requirements, allowedTypes, includeStudentCells) => {
      const total = requirements.length;
      const assigned = requirements.filter(req => req.status === 'ASSIGNED').length;
      const statusHtml = total > 0
        ? `<span style="font-weight:700;color:${assigned === total ? '#059669' : '#B45309'}">${assigned}/${total}교시</span>`
        : '<span style="color:#9CA3AF">해당 없음</span>';
      const tags = total > 0 ? buildLessonRequirementTags(student, requirements, true) : '<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px">배정 대상 없음</span>';
      const buttons = buildLessonAssignmentButtons(student, requirements, allowedTypes);
      return `<tr style="${includeStudentCells ? '' : 'border-top:none'}">
        ${includeStudentCells ? studentInfoCell : ''}
        <td style="text-align:center"><span class="tsa-badge" style="background:${badgeColor}1A;color:${badgeColor};font-size:9.5px;white-space:nowrap">${label}</span></td>
        <td style="font-size:11px;white-space:nowrap">${statusHtml}</td>
        <td class="sca-lessons-cell">${tags}</td>
        <td class="sca-actions-cell" style="text-align:center;padding-left:8px;padding-right:8px"><div style="display:flex;justify-content:center;gap:4px;flex-wrap:wrap">${buttons}</div></td>
      </tr>`;
    };

    return buildTypeRow('1:1', '#5E5CE6', oneToOneReqs, oneToOneTypes, true) +
      buildTypeRow('그룹', '#0F766E', groupReqs, groupTypes, false);
  }).join('') || `<tr><td colspan="9" style="padding:30px;text-align:center;color:#9CA3AF">배정할 수업 요구사항이 있는 학생이 없어.</td></tr>`;
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

// 특정 1:1 교시 하나에 배정 가능한 강사 목록. saveStudentOneToOneSchedule과 같은 규칙으로 판정해서
// 저장 단계에서야 거절당하는 일이 없게 하고, 불가한 강사는 사유를 함께 돌려준다.
function getOneToOneTeacherCandidates(student, requirement) {
  const period = Number(requirement.sequence);
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
    .map(req => `${req.sequence}교시 ${esc(req.subjectName)}`)
    .join(' · ') || '배정 대상 교시 없음';
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
        <div class="req-head"><b>${req.sequence}교시 · ${req.classType} · ${esc(req.subjectName)}</b><span class="badge ok">배정 완료</span></div>
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
      <div class="req-head"><b>${req.sequence}교시 · ${req.classType} · ${esc(req.subjectName)}</b><span class="badge warn">미배정</span></div>
      <div class="candidates">
        ${candidates.length ? candidates.map(g => {
          const cap = getGroupClassCapacity(g.classType);
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
    .filter(t => t.status !== 'resigned' && (t.classTypes || []).includes('1:1'))
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
        ${teacherCandidates.filter(({ plan }) => plan.ok).map(({ teacher }) => renderTeacherOption(
          teacher,
          `<span class="teacher-fit ok">자동 배치 가능 · ${oneToOneReqs.length}교시</span>`,
          '<button class="btn primary xs" type="button" onclick="assignPrimaryTeacher(this)">선택 및 자동 배정</button>'
        )).join('') || '<div class="empty-hint">배정 가능한 1:1 강사가 없어.</div>'}
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
          <div><label class="title">교시 · 수업 유형 · 과목</label><select id="inline-group-row" style="width:100%" onchange="renderInlineGroupSummary()">${inlineGroupCreateRows.map((row, index) => `<option value="${index}">${row.sequence}교시 · ${esc(row.classType)} · ${esc(row.subjectName)}</option>`).join('')}</select></div>
          <div><label class="title">레벨</label><input style="width:100%;background:#F3F4F6" value="${esc(getLevelGroupName(level))}" disabled></div>
        </div>
        <div style="margin-top:9px"><label class="title">운영 요일</label><div class="day-picks">${LESSON_DAYS.map(day => `<label class="day-pick"><input type="checkbox" class="inline-group-day" value="${day}" checked onchange="renderInlineGroupSummary()">${day}</label>`).join('')}</div></div>
        <div id="inline-group-summary" class="inline-summary"></div>
        <div class="inline-create-actions"><button class="btn outline xs" onclick="toggleInlineGroupCreate(false)">취소</button><button id="inline-group-save" class="btn primary xs" onclick="saveInlineGroup()">그룹 만들기</button></div>
      </div>${groupRows}` : ''}
      ${!focusClassType || focusClassType === '1:1' ? `<h2${focusClassType ? '' : ' style="margin-top:14px"'}>1:1 수업</h2>${oneToOneReqs.length ? oneToOneBody : '<div class="empty-hint">1:1 수업 요구사항이 없어.</div>'}` : ''}
    </main>
    <footer>${pendingGroupReqs.length ? `<span id="group-selection-count" class="selection-count">0/${pendingGroupReqs.length}개 선택</span>` : ''}<button class="btn outline" onclick="window.close()">닫기</button>${pendingGroupReqs.length ? '<button id="confirm-group-assignments" class="btn primary" disabled onclick="confirmGroupAssignments()">선택한 수업 배정하기</button>' : ''}</footer>
    <script>
      var inlineGroupRows=${JSON.stringify(inlineGroupCreateRows).replace(/</g, '\u003c')};
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
        if(show)renderInlineGroupSummary();
      }
      function getInlineGroupRow(){
        var select=document.getElementById('inline-group-row');
        return inlineGroupRows[Number(select&&select.value)||0];
      }
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
        notifyOpener({action:'save-group',groupId:null,payload:{curriculum:[{id:row.subjectId,hours:1}],course:${JSON.stringify(student.course || '')},levelGroups:[${level}],classType:row.classType,nationalityCap:null,startDate:${JSON.stringify(student.startDate || '2026-06-22')},endDate:${JSON.stringify(student.departureDate || '')},weeklyFrequency:days.length,periods:[row.sequence],dayOfWeek:days,teacherId:null,roomId:null,seedStudentId:${student.id},assignSeedStudent:false},returnToStudentAssignment:{studentId:${student.id},classType:row.classType}});
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
        var teacherId=Number(button.closest('.teacher-option').dataset.teacherId);
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
        if(!notifyOpener({action:'save-one-to-one-schedule',studentId:${student.id},subjectId:subjectId,teacherId:teacherId,period:sequence})) return;
        var result=window.saveStudentOneToOneSchedule(${student.id},subjectId,teacherId,sequence);
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

// 강사·강의실·학생의 요일·교시 충돌을 저장 전에 차단한다(PRD §14).
function saveStudentOneToOneSchedule(studentId, subjectId, teacherId, period, templateSequence) {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  const teacher = MOCK_TEACHERS.find(t => t.id === Number(teacherId));
  if (!student || !teacher) return { ok: false, message: '학생 또는 강사 정보를 찾을 수 없어.' };
  if (!period) return { ok: false, message: '교시를 선택해.' };
  const numericPeriod = Number(period);
  const numericSequence = Number(templateSequence || period);
  const requirement = getStudentLessonRequirements(student).find(req =>
    req.classType === '1:1' && req.subjectId === subjectId && req.sequence === numericSequence
  );
  if (!requirement) return { ok: false, message: '교육 과정 템플릿에서 해당 1:1 수업을 찾을 수 없어.' };
  if (numericPeriod !== requirement.sequence) {
    return { ok: false, message: `${requirement.subjectName} 수업은 템플릿 기준 ${requirement.sequence}교시에만 배정할 수 있어.` };
  }
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

  if (isStudentBusyAtPeriod(student, numericPeriod, subjectId)) return { ok: false, message: '이 학생은 같은 교시에 이미 다른 수업이 있어.' };

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

function applyStudentScheduleDateRange(studentId) {
  const startInput = document.getElementById('student-schedule-start-date');
  const endInput = document.getElementById('student-schedule-end-date');
  const student = (APP.students || []).find(item => Number(item.id) === Number(studentId));
  const container = document.getElementById('adetail-page-enrollment-content');
  if (!startInput || !endInput || !student || !container) return;
  if (!startInput.value || !endInput.value || startInput.value > endInput.value) {
    if (startInput.value && endInput.value) alert('시작일자는 종료일자보다 늦을 수 없어.');
    return;
  }
  APP.studentScheduleDateRanges = APP.studentScheduleDateRanges || {};
  const enrollmentKey = typeof currentAdetailEnrollmentId !== 'undefined' ? currentAdetailEnrollmentId : 'current';
  APP.studentScheduleDateRanges[`${student.id}:${enrollmentKey}`] = {
    startDate: startInput.value,
    endDate: endInput.value,
  };
  container.innerHTML = buildStudentWeeklyScheduleHtml(student);
}

function buildStudentWeeklyScheduleHtml(student) {
  if (!student) return '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">학생 정보를 찾을 수 없어.</div>';
  const entries = buildFinalTimetableEntries().filter(entry => (entry.studentIds || []).includes(student.id));
  const periods = typeof getBellPeriods === 'function'
    ? getBellPeriods()
    : Array.from({ length: (APP && APP.bellSystem && APP.bellSystem.total) || 8 }, (_, i) => ({ period: i + 1, start: '', end: '' }));
  const bySlot = new Map();
  entries.forEach(entry => bySlot.set(`${entry.dayOfWeek}|${entry.period}`, entry));

  const typeStyle = classType => classType === '1:1'
    ? { bg: '#EEF2FF', border: '#C7D2FE', color: '#4338CA' }
    : classType === '1:4'
      ? { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' }
      : { bg: '#D1FAE5', border: '#A7F3D0', color: '#047857' };

  const selectedEnrollment = typeof getSelectedStudentEnrollment === 'function'
    ? getSelectedStudentEnrollment(student)
    : student;
  const enrollmentStart = selectedEnrollment.startDate || student.startDate || studentScheduleIsoDate(new Date());
  const enrollmentEnd = selectedEnrollment.endDate || student.endDate || enrollmentStart;
  APP.studentScheduleDateRanges = APP.studentScheduleDateRanges || {};
  const enrollmentKey = typeof currentAdetailEnrollmentId !== 'undefined' ? currentAdetailEnrollmentId : 'current';
  const rangeKey = `${student.id}:${enrollmentKey}`;
  const savedRange = APP.studentScheduleDateRanges[rangeKey] || {};
  const rangeStartValue = savedRange.startDate || enrollmentStart;
  const rangeEndValue = savedRange.endDate || enrollmentEnd;
  const rangeStart = studentScheduleDate(rangeStartValue);
  const rangeEnd = studentScheduleDate(rangeEndValue);

  const buildWeekTable = monday => {
    const weekDates = LESSON_DAYS.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return { day, date, iso: studentScheduleIsoDate(date) };
    });
    const headerCells = weekDates.map(({ day, date }) =>
      `<th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;text-align:center">${day}<div style="font-size:9px;color:#9CA3AF;margin-top:2px">${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}</div></th>`
    ).join('');
    const bodyRows = periods.map(slot => {
      const cells = weekDates.map(({ day, iso }) => {
      const inRange = iso >= rangeStartValue && iso <= rangeEndValue;
      if (!inRange) {
        return '<td style="border:1px solid #E5E7EB;padding:6px;height:56px;background:#F9FAFB;text-align:center;color:#E5E7EB;font-size:10.5px">-</td>';
      }
      const entry = bySlot.get(`${day}|${slot.period}`);
      if (!entry) {
        return '<td style="border:1px solid #E5E7EB;padding:6px;height:56px;background:#FCFCFD;text-align:center;color:#D1D5DB;font-size:10.5px">-</td>';
      }
      const style = typeStyle(entry.classType);
      return `<td style="border:1px solid #E5E7EB;padding:5px;height:56px;background:${style.bg};vertical-align:top">
        <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
          <span style="font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;background:#fff;border:1px solid ${style.border};color:${style.color}">${lessonEsc(entry.classType)}</span>
          <b style="font-size:10.5px;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lessonEsc(entry.subjectName)}</b>
        </div>
        <div style="font-size:9.5px;color:#4B5563;line-height:1.4">${lessonEsc(entry.teacherName)}<br>${lessonEsc(entry.roomLabel)}</div>
      </td>`;
      }).join('');
      return `<tr>
      <th style="border:1px solid #E5E7EB;background:#F8F9FC;padding:6px;text-align:center;white-space:nowrap">
        <div style="font-size:11px;font-weight:800;color:#374151">${slot.period}교시</div>
        ${slot.start ? `<div style="font-size:9px;color:#9CA3AF">${slot.start}~${slot.end}</div>` : ''}
      </th>
      ${cells}
    </tr>`;
    }).join('');
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return `<div style="margin-top:12px">
      <div style="font-size:11px;font-weight:800;color:#374151;margin-bottom:6px">${monday.getFullYear()}.${String(monday.getMonth() + 1).padStart(2, '0')}.${String(monday.getDate()).padStart(2, '0')} ~ ${friday.getFullYear()}.${String(friday.getMonth() + 1).padStart(2, '0')}.${String(friday.getDate()).padStart(2, '0')}</div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:620px">
          <thead><tr><th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;width:72px">교시</th>${headerCells}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>
    </div>`;
  };

  const weekTables = [];
  if (rangeStart && rangeEnd && rangeStart <= rangeEnd) {
    const firstMonday = new Date(rangeStart);
    firstMonday.setDate(rangeStart.getDate() - ((rangeStart.getDay() + 6) % 7));
    for (const monday = new Date(firstMonday); monday <= rangeEnd; monday.setDate(monday.getDate() + 7)) {
      weekTables.push(buildWeekTable(new Date(monday)));
    }
  }

  // 1:1은 월~금 5일이 한 교시로 묶이므로 요일 수가 아니라 교시 수로 센다.
  const uniquePeriods = new Set(entries.map(entry => `${entry.classType}|${entry.subjectId}|${entry.period}`));
  const oneToOneCount = new Set(entries.filter(e => e.classType === '1:1').map(e => `${e.subjectId}|${e.period}`)).size;
  const groupCount = new Set(entries.filter(e => e.classType !== '1:1').map(e => `${e.groupId}|${e.period}`)).size;

  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div style="font-size:12px;font-weight:800;color:#111827">📅 기간별 스케줄 <span style="font-size:10.5px;font-weight:600;color:#6B7280">월~금 · 현재 배정 기준</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="tsa-badge tsa-badge-primary" style="font-size:10px">1:1 ${oneToOneCount}교시</span>
        <span class="tsa-badge tsa-badge-success" style="font-size:10px">그룹 ${groupCount}교시</span>
        <span class="tsa-badge tsa-badge-gray" style="font-size:10px">합계 ${uniquePeriods.size}교시</span>
      </div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:8px;flex-wrap:wrap;padding:10px 12px;margin-bottom:10px;border:1px solid #E5E7EB;border-radius:9px;background:#F8F9FC">
      <label style="display:flex;flex-direction:column;gap:4px;font-size:10.5px;font-weight:700;color:#4B5563">시작일자
        <input id="student-schedule-start-date" type="date" value="${rangeStartValue}" min="${enrollmentStart}" max="${enrollmentEnd}" onchange="applyStudentScheduleDateRange(${student.id})" style="height:34px;padding:0 10px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:#111827;font-size:11px">
      </label>
      <span style="height:34px;display:flex;align-items:center;color:#9CA3AF">~</span>
      <label style="display:flex;flex-direction:column;gap:4px;font-size:10.5px;font-weight:700;color:#4B5563">종료일자
        <input id="student-schedule-end-date" type="date" value="${rangeEndValue}" min="${enrollmentStart}" max="${enrollmentEnd}" onchange="applyStudentScheduleDateRange(${student.id})" style="height:34px;padding:0 10px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;color:#111827;font-size:11px">
      </label>
      <span style="font-size:10px;color:#6B7280;padding-bottom:9px">선택한 수강 기간 안에서 조회할 수 있어.</span>
    </div>
    ${uniquePeriods.size ? '' : '<div style="padding:10px;margin-bottom:10px;border-radius:8px;background:#FFF7ED;color:#B45309;font-size:11px">아직 배정된 수업이 없어. 수업 배정 관리에서 배정해줘.</div>'}
    ${weekTables.length ? weekTables.join('') : '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:11px">조회할 기간을 선택해줘.</div>'}`;
}

// 강사 개인 주간 스케줄. 학생 스케줄과 동일한 현재 배정 원천을 사용해
// 1:1 및 그룹 배정 변경이 강사 상세에도 즉시 반영되게 한다.
function buildTeacherWeeklyScheduleHtml(teacher) {
  if (!teacher) return '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">강사 정보를 찾을 수 없어.</div>';
  const entries = buildFinalTimetableEntries().filter(entry => entry.teacherId === teacher.id);
  const periods = typeof getBellPeriods === 'function'
    ? getBellPeriods()
    : Array.from({ length: (APP && APP.bellSystem && APP.bellSystem.total) || 8 }, (_, i) => ({ period: i + 1, start: '', end: '' }));
  const bySlot = new Map();
  entries.forEach(entry => {
    const key = `${entry.dayOfWeek}|${entry.period}`;
    if (!bySlot.has(key)) bySlot.set(key, []);
    bySlot.get(key).push(entry);
  });

  const typeStyle = classType => classType === '1:1'
    ? { bg: '#EEF2FF', border: '#C7D2FE', color: '#4338CA' }
    : classType === '1:4'
      ? { bg: '#FEF3C7', border: '#FDE68A', color: '#B45309' }
      : { bg: '#D1FAE5', border: '#A7F3D0', color: '#047857' };
  const headerCells = LESSON_DAYS.map(day =>
    `<th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;text-align:center">${day}</th>`
  ).join('');
  const bodyRows = periods.map(slot => {
    const cells = LESSON_DAYS.map(day => {
      const slotEntries = bySlot.get(`${day}|${slot.period}`) || [];
      if (!slotEntries.length) return '<td style="border:1px solid #E5E7EB;padding:6px;height:68px;background:#FCFCFD;text-align:center;color:#D1D5DB;font-size:10.5px">-</td>';
      const cards = slotEntries.map(entry => {
        const style = typeStyle(entry.classType);
        return `<div style="padding:5px 6px;border:1px solid ${style.border};border-radius:7px;background:${style.bg};text-align:left;margin-bottom:3px;overflow:hidden">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
            <span style="font-size:9px;font-weight:800;padding:1px 5px;border-radius:6px;background:#fff;border:1px solid ${style.border};color:${style.color};white-space:nowrap">${lessonEsc(entry.classType)}</span>
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

  const uniqueLessons = new Set(entries.map(entry => `${entry.classType}|${entry.subjectId}|${entry.period}`));
  const oneToOneCount = new Set(entries.filter(e => e.classType === '1:1').map(e => `${e.subjectId}|${e.period}|${e.studentIds.join(',')}`)).size;
  const groupCount = new Set(entries.filter(e => e.classType !== '1:1').map(e => `${e.groupId}|${e.period}`)).size;
  return `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:10px">
      <div style="font-size:12px;font-weight:800;color:#111827">📅 주간 스케줄 <span style="font-size:10.5px;font-weight:600;color:#6B7280">월~금 · 현재 배정 기준</span></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <span class="tsa-badge tsa-badge-primary" style="font-size:10px">1:1 ${oneToOneCount}교시</span>
        <span class="tsa-badge tsa-badge-success" style="font-size:10px">그룹 ${groupCount}교시</span>
        <span class="tsa-badge tsa-badge-gray" style="font-size:10px">합계 ${uniqueLessons.size}교시</span>
      </div>
    </div>
    ${uniqueLessons.size ? '' : '<div style="padding:10px;margin-bottom:10px;border-radius:8px;background:#FFF7ED;color:#B45309;font-size:11px">현재 배정된 수업이 없어. 수업 배정 관리에서 배정해줘.</div>'}
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;min-width:620px;table-layout:fixed">
        <thead><tr><th style="padding:7px 6px;font-size:11px;font-weight:800;color:#4B5563;background:#F8F9FC;border:1px solid #E5E7EB;width:72px">교시</th>${headerCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>`;
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

// 학생 과정의 교시별 기준 시간표에서 과목·유형·교시가 모두 일치하는지 확인한다.
function studentCanTakeGroupAtTemplatePeriod(student, subjectId, classType, periods) {
  const course = MOCK_COURSES.find(item => item.name === student?.course && item.active !== false);
  const template = course ? getCourseTimetableTemplate(course) : [];
  const groupPeriods = Array.isArray(periods) ? periods.map(Number) : [];
  return template.some((item, index) =>
    item.subjectId === subjectId && item.classType === classType && groupPeriods.includes(index + 1)
  );
}

// 그룹 목록 화면 분류용 — 정원 6명까지는 중그룹, 7명 이상은 대그룹으로 묶어서 보여준다
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
  return getGroupSizeCategory(classType) === 'large' ? '대그룹' : '중그룹';
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

function getGroupCandidateStudents(group) {
  if (!group) return [];
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
    return studentCanTakeGroupAtTemplatePeriod(s, subjectId, group.classType, group.periods) &&
      lvl != null && levels.includes(lvl) &&
      !group.studentIds.includes(s.id) &&
      !alreadyAssignedToSameSubject &&
      ['current', 'waiting', 'extended'].includes(s.status);
  });
}

function renderCsGroupPanel() {
  if (document.getElementById('group-management-content')) renderGroupManagement();
}

function buildCsGroupDemandRows() {
  const students = MOCK_STUDENTS.filter(student =>
    ['current', 'waiting', 'extended'].includes(student.status) &&
    MOCK_COURSES.some(course => course.name === student.course && course.active !== false)
  );
  const buckets = new Map();

  // 기획 결정(2026-07-30 미팅 확정): 그룹 = 과목 단위 개별 클래스. 4과목을 하나로 묶지 않는다.
  // 학생 등록 후 레벨 확인 시점에 필요한 만큼만 점진적으로 생성한다.
  students.forEach(student => {
    const course = MOCK_COURSES.find(item => item.name === student.course);
    const levelGroup = getLevelGroupForStudent(student);
    if (!course || levelGroup == null) return;

    ['1:4', '1:8'].forEach(classType => {
      const template = getCourseTimetableTemplate(course);
      template.forEach((item, templateIndex) => {
        if (item.classType !== classType) return;
        const ref = { id: item.subjectId, hours: 1 };
        const sequence = templateIndex + 1;
        const key = [ref.id, levelGroup, classType, sequence].join('|');
        if (!buckets.has(key)) {
          buckets.set(key, {
            key,
            subjectId: ref.id,
            subjectName: MOCK_MASTER_SUBJECTS.find(subject => subject.id === ref.id)?.name || ref.id,
            levelGroup,
            classType,
            sequence,
            curriculum: [{ id: ref.id, hours: ref.hours || 1 }],
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
    const sequence = bucket.sequence;
    const capacity = getGroupClassCapacity(bucket.classType);
    const baseCapacity = getGroupBaseCapacity(bucket.classType);
    const matchingGroups = MOCK_GROUP_CLASSES.filter(group =>
      group.status === 'active' &&
      group.classType === bucket.classType &&
      getGroupSubjectId(group) === bucket.subjectId &&
      Array.isArray(group.periods) && group.periods.includes(sequence) &&
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
      ...bucket, sequence, capacity, baseCapacity, totalStudents, waitingCount, requiredGroups,
      existingGroups, additionalGroups, openSeats
    };
  }).sort((a, b) =>
    b.additionalGroups - a.additionalGroups ||
    b.waitingCount - a.waitingCount ||
    a.subjectName.localeCompare(b.subjectName, 'ko') ||
    a.levelGroup - b.levelGroup
  );
}
let _groupManagementTab = 'students';

function initGroupManagement() {
  renderGroupManagement();
}

function switchGroupManagementTab(tab) {
  _groupManagementTab = ['students', 'active', 'rooms'].includes(tab) ? tab : 'students';
  renderGroupManagement();
}

function renderGroupManagement() {
  // 그룹 편성 내용은 통합 화면의 '그룹 수업 편성 관리' 탭에도 붙어 있어서 같이 갱신해줘.
  if (_studentClassAssignTab === 'groups') renderStudentClassAssignGroupPanel();
  const content = document.getElementById('group-management-content');
  if (!content) return;

  ['students', 'active', 'rooms'].forEach(tab => {
    const button = document.getElementById(`gm-tab-${tab}`);
    if (!button) return;
    const selected = tab === _groupManagementTab;
    button.style.color = selected ? '#5E5CE6' : '#6B7280';
    button.style.borderBottomColor = selected ? '#5E5CE6' : 'transparent';
  });

  if (_groupManagementTab === 'students') {
    renderGroupManagementStudents(content);
  } else if (_groupManagementTab === 'active') {
    renderGroupManagementActive(content);
  } else if (_groupManagementTab === 'rooms') {
    renderGroupManagementRooms(content);
  }
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function renderGroupManagementStudents(content) {
  content.innerHTML = `
    <div class="tsa-card" style="overflow:hidden">
      <div class="tsa-card-header">
        <h3 class="tsa-card-title">🧑‍🎓 학생별 그룹 배정 현황</h3>
        <div style="font-size:11px;color:#6B7280">과정 템플릿의 그룹 교시를 확인하고 중그룹·대그룹을 배정하거나 변경해.</div>
      </div>
      <div style="overflow-x:auto">
        <table class="tsa-table">
          <thead><tr>
            <th style="text-align:center;width:36px">#</th><th>학생 정보</th><th>과정 및 수강 기간</th><th>레벨</th><th>그룹 배정 현황</th><th>수업 리스트</th><th style="text-align:center">관리</th>
          </tr></thead>
          <tbody id="gm-student-assign-body"></tbody>
        </table>
      </div>
    </div>`;
  renderStudentAssignmentTable('gm-student-assign-body', 'group');
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

let _gmStatusFilter = 'all';
let _gmCourseFilter = 'all';
let _gmLevelFilter = 'all';
let _gmTypeFilter = 'all';

function getGroupManagementRowGroups(row) {
  if (Array.isArray(row.displayGroupIds)) {
    return MOCK_GROUP_CLASSES.filter(group => row.displayGroupIds.includes(group.id));
  }
  return MOCK_GROUP_CLASSES.filter(group =>
    group.status === 'active' &&
    group.classType === row.classType &&
    getGroupSubjectId(group) === row.subjectId &&
    Array.isArray(group.periods) && group.periods.includes(row.sequence) &&
    getGroupLevelSet(group).includes(row.levelGroup)
  );
}

function buildGroupManagementDisplayRows() {
  return buildCsGroupDemandRows();
}

function setGroupManagementStatusFilter(filter) {
  _gmStatusFilter = filter;
  renderGroupManagement();
}

function setGroupManagementListFilter(kind, value) {
  if (kind === 'subject') _gmCourseFilter = value;
  if (kind === 'level') _gmLevelFilter = value;
  if (kind === 'type') _gmTypeFilter = value;
  renderGroupManagement();
}

function getGroupManagementRowStatus(row) {
  if (row.additionalGroups > 0) return { code: 'create', label: '그룹 생성 필요', bg: '#FEE2E2', color: '#DC2626' };
  if (row.waitingCount > 0 && (row.assignableWaitingCount ?? row.openSeats) > 0) return { code: 'assign', label: '학생 배정 필요', bg: '#FEF3C7', color: '#B45309' };
  return { code: 'done', label: '배정 완료', bg: '#D1FAE5', color: '#047857' };
}

function getGroupManagementGroupStatus(group, row) {
  const hasOpenSeat = (group.studentIds || []).length < getGroupClassCapacity(group.classType);
  if (hasOpenSeat && row.waitingCount > 0) {
    return { code: 'assign', label: '학생 배정 필요', bg: '#FEF3C7', color: '#B45309' };
  }
  return { code: 'done', label: '배정 완료', bg: '#D1FAE5', color: '#047857' };
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
  const createCount = sourceRows.filter(row => row.additionalGroups > 0).reduce((sum, row) => sum + row.additionalGroups, 0);
  const sourceGroups = sourceRows.flatMap(row => getGroupManagementRowGroups(row).map(group => ({ group, row })));
  const assignCount = sourceGroups.filter(item => getGroupManagementGroupStatus(item.group, item.row).code === 'assign').length;
  const doneCount = sourceGroups.filter(item => getGroupManagementGroupStatus(item.group, item.row).code === 'done').length;

  const conditionLine = (row, status, countBadge) => `
    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px">
      <span style="padding:2px 7px;border-radius:999px;background:${status.bg};color:${status.color};font-size:9.5px;font-weight:800;white-space:nowrap">${status.label}</span>
      <span style="font-size:10px;color:#9CA3AF">배정 대기 학생 ${row.waitingCount}명 <span style="color:#D1D5DB">/ 전체 ${row.totalStudents}명</span></span>
    </div>
    <div style="display:flex;align-items:center;gap:5px;flex-wrap:nowrap">
      <span style="padding:2px 7px;border-radius:999px;background:#EEF2FF;color:#4F46E5;font-size:10px;font-weight:800;white-space:nowrap">${row.sequence}교시</span>
      <span style="font-size:12.5px;font-weight:700;color:#111827;white-space:nowrap">${lessonEsc(getLevelGroupName(row.levelGroup))} · ${lessonEsc(row.subjectName)} · ${lessonEsc(getGroupSizeShortLabel(row.classType))}</span>
      <span class="tsa-badge ${row.classType === '1:4' ? 'tsa-badge-warning' : 'tsa-badge-primary'}" style="white-space:nowrap">${row.classType}</span>
      ${countBadge ? `<span style="margin-left:auto;font-size:11px;font-weight:700;white-space:nowrap;color:${countBadge.danger ? '#DC2626' : '#6366F1'}">${countBadge.text}</span>` : ''}
    </div>`;

  const groupCard = (group, row, status) => {
    const students = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
    const capacity = getGroupClassCapacity(group.classType);
    const dayLabel = Array.isArray(group.dayOfWeek) && group.dayOfWeek.length ? group.dayOfWeek.join(',') : '-';
    const periodLabel = Array.isArray(group.periods) && group.periods.length ? group.periods.join(', ') + '교시' : '-';
    const teacherLabel = group.teacherId != null ? (MOCK_TEACHERS.find(t => t.id === group.teacherId)?.nick || '-') : '-';
    const roomLabel = group.roomId != null ? (MOCK_CLASS_ROOMS.find(r => r.id === group.roomId)?.roomNo || '-') : '-';
    const countBadge = { text: `${students.length}/${capacity}명`, danger: students.length >= capacity };

    const seatCells = [];
    for (let i = 0; i < capacity; i += 1) {
      const student = students[i];
      if (student) {
        const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
        seatCells.push(`<div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1px solid #E5E7EB;border-radius:8px;background:#F9FAFB;min-height:56px;justify-content:center">
          <img src="${lessonEsc(avatarSrc)}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB"/>
          <span style="font-size:10px;color:#374151;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${lessonEsc(student.nick || student.name)}</span>
        </div>`);
      } else {
        seatCells.push(`<button onclick="openGroupAssignPopup(${group.id})" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:8px 4px;border:1px dashed #C7D2FE;border-radius:8px;background:#fff;color:#5E5CE6;font-size:10px;font-weight:700;cursor:pointer;min-height:56px">+ 배정</button>`);
      }
    }

    return `<div class="tsa-card" style="overflow:hidden;display:flex;flex-direction:column;height:100%">
      <div style="padding:10px 14px">${row ? conditionLine(row, status, countBadge) : ''}</div>
      <div style="padding:8px 14px;border-top:1px solid #F1F4F9;border-bottom:1px solid #F1F4F9;font-size:11px;color:${group.roomId == null ? '#B45309' : '#6B7280'}">
        ${group.roomId == null ? `${lessonEsc(periodLabel)} · 강의실 미배정 · 강의실별 탭에서 배치해줘` : `${lessonEsc(teacherLabel)} · ${lessonEsc(roomLabel)} · ${lessonEsc(dayLabel)} · ${lessonEsc(periodLabel)}`}
      </div>
      <div style="padding:10px 14px;display:grid;grid-template-columns:repeat(4,1fr);gap:6px">${seatCells.join('')}</div>
      <div style="margin-top:auto;padding:8px 14px;border-top:1px solid #F1F4F9;display:flex;gap:6px;justify-content:flex-end">
        <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openActiveGroupDetail(${group.id})">상세</button>
        <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openGroupEditBrowserPopup(${group.id})">수정</button>
        <button class="tsa-btn tsa-btn-xs" style="color:#DC2626;background:#FEE2E2" onclick="deleteCsGroup(${group.id})">삭제</button>
      </div>
    </div>`;
  };

  const createCard = (row, status) => `<div class="tsa-card" style="overflow:hidden;border:1px dashed #C7D2FE;display:flex;flex-direction:column;height:100%">
    <div style="padding:10px 14px">${conditionLine(row, status)}</div>
    <div style="margin-top:auto;padding:20px 14px;display:flex;align-items:center;justify-content:center">
      <button class="tsa-btn tsa-btn-sm tsa-btn-primary" onclick="openGroupCreateBrowserPopup(${curriculumJsLiteral(row.curriculum)},'${row.classType}',${row.levelGroup},undefined,undefined,${row.sequence ?? 'undefined'})">+ 그룹 생성</button>
    </div>
  </div>`;

  const cards = [];
  rows.forEach(row => {
    getGroupManagementRowGroups(row).forEach(group => {
      const status = getGroupManagementGroupStatus(group, row);
      if (_gmStatusFilter === 'all' || _gmStatusFilter === status.code) cards.push(groupCard(group, row, status));
    });
    const createStatus = getGroupManagementRowStatus(row);
    if (_gmStatusFilter === 'all' || _gmStatusFilter === 'create') {
      for (let i = 0; i < row.additionalGroups; i += 1) cards.push(createCard(row, createStatus));
    }
  });

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:14px">
      ${[
        ['그룹 생성 필요', createCount, '#DC2626', '#FEF2F2', "setGroupManagementStatusFilter('create')"],
        ['학생 배정 필요', assignCount, '#B45309', '#FFFBEB', "setGroupManagementStatusFilter('assign')"],
        ['배정 완료', doneCount, '#047857', '#ECFDF5', "setGroupManagementStatusFilter('done')"],
        ['전체', createCount + assignCount + doneCount, '#4F46E5', '#EEF2FF', "setGroupManagementStatusFilter('all')"]
      ].map(item => `<button onclick="${item[4]}" style="text-align:left;padding:15px;border:1px solid #E5E7EB;border-radius:12px;background:${item[3]};cursor:pointer"><div style="font-size:10px;color:#6B7280">${item[0]}</div><b style="display:block;margin-top:5px;font-size:22px;color:${item[2]}">${item[1]}</b></button>`).join('')}
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:14px">
      <div style="display:flex;gap:6px">
        ${[['all','전체'],['create','그룹 생성 필요'],['assign','학생 배정 필요'],['done','배정 완료']].map(filter => `<button class="tsa-btn tsa-btn-xs ${_gmStatusFilter === filter[0] ? 'tsa-btn-primary' : 'tsa-btn-outline'}" onclick="setGroupManagementStatusFilter('${filter[0]}')">${filter[1]}</button>`).join('')}
      </div>
      <div style="display:flex;align-items:center;gap:7px;margin-left:auto">
        <select class="tsa-input" style="width:160px;height:34px;font-size:11px" onchange="setGroupManagementListFilter('subject',this.value)">
          <option value="all">포함 과목 전체</option>
          ${[...new Set(sourceRows.flatMap(row => (row.curriculum || []).map(ref => ref.id)))].map(subjectId => {
            const name = MOCK_MASTER_SUBJECTS.find(subject => subject.id === subjectId)?.name || subjectId;
            return `<option value="${lessonEsc(subjectId)}" ${_gmCourseFilter === subjectId ? 'selected' : ''}>${lessonEsc(name)}</option>`;
          }).join('')}
        </select>
        <select class="tsa-input" style="width:130px;height:34px;font-size:11px" onchange="setGroupManagementListFilter('level',this.value)">
          <option value="all">레벨 전체</option>
          ${[...MOCK_MASTER_LEVELS].filter(level => level.visible !== false).sort((a,b) => a.order-b.order).map(level => `<option value="${level.order}" ${_gmLevelFilter === String(level.order) ? 'selected' : ''}>${lessonEsc(level.name)}</option>`).join('')}
        </select>
        <select class="tsa-input" style="width:140px;height:34px;font-size:11px" onchange="setGroupManagementListFilter('type',this.value)">
          <option value="all">규모 전체</option>
          ${[...MOCK_MASTER_CLASS_TYPES].filter(type => type.classMode === 'group' && type.visible !== false).map(type => `<option value="${type.code}" ${_gmTypeFilter === type.code ? 'selected' : ''}>${lessonEsc(getGroupSizeShortLabel(type.code))}(${type.code})</option>`).join('')}
        </select>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,360px),1fr));gap:14px">
      ${cards.join('') || '<div style="padding:30px;text-align:center;color:#9CA3AF;grid-column:1/-1">조건에 맞는 그룹이 없어.</div>'}
    </div>`;
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
  const period = Array.isArray(group.periods) ? Number(group.periods[0]) : null;
  const rows = buildGroupManagementDisplayRows();
  const rowIndex = rows.findIndex(row =>
    row.subjectId === subjectId &&
    row.classType === group.classType &&
    row.sequence === period &&
    levels.includes(row.levelGroup)
  );
  if (rowIndex < 0) {
    showToast('이 그룹에 연결된 과정 템플릿 상세 정보를 찾을 수 없어.', 'warning');
    return;
  }
  openGroupManagementBrowserPopup(rowIndex, undefined, group.id);
}

let _gmActiveSortDir = 'desc';
function setGroupManagementActiveSort() {
  _gmActiveSortDir = _gmActiveSortDir === 'desc' ? 'asc' : 'desc';
  renderGroupManagement();
}

// 강의실별 탭: 빈 강의실 교시를 먼저 선택하고, 미배정 그룹과 해당 교시에 가능한 강사를 순서대로 배정한다.
function renderGroupManagementRooms(content) {
  const rooms = MOCK_CLASS_ROOMS.filter(r => ['1:4', '1:8'].includes(r.type) && r.roomNo);
  const periods = getPeriodList();

  const cards = rooms.map(room => {
    const rows = periods.map(p => {
      const group = MOCK_GROUP_CLASSES.find(g =>
        g.status === 'active' && g.roomId === room.id &&
        Array.isArray(g.periods) && g.periods.includes(p.order)
      );
      const timeLabel = `<div style="font-size:9.5px;color:#9CA3AF">${p.startTime}-${p.endTime}</div>`;
      if (group) {
        const students = group.studentIds.map(id => MOCK_STUDENTS.find(s => s.id === id)).filter(Boolean);
        const capacity = getGroupClassCapacity(group.classType);
        const teacherLabel = group.teacherId != null ? (MOCK_TEACHERS.find(t => t.id === group.teacherId)?.nick || '-') : '-';
        const hasSeat = students.length < capacity;
        return `<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;background:#EEF2FF;margin-bottom:5px">
          <div style="font-size:11px;color:#5E5CE6;width:36px;flex-shrink:0">${p.order}교시</div>
          <div style="flex:1;font-size:11.5px;color:#111827;min-width:0;cursor:pointer" onclick="openGroupEditBrowserPopup(${group.id})"><b>${lessonEsc(getGroupDisplayName(group))}</b> <span style="color:#6B7280">· ${lessonEsc(teacherLabel)} · ${students.length}/${capacity}명</span></div>
          ${hasSeat ? `<button onclick="openGroupAssignPopup(${group.id})" style="font-size:10px;padding:2px 6px;border:none;background:#C7D2FE;color:#3730A3;border-radius:4px;cursor:pointer;flex-shrink:0">+</button>` : ''}
          <button onclick="unassignGroupFromRoomSlot(${group.id})" style="font-size:9.5px;padding:3px 6px;border:none;background:#FEE2E2;color:#B91C1C;border-radius:4px;cursor:pointer;flex-shrink:0;white-space:nowrap" title="강의실과 담당 강사 배정 해지">해지</button>
        </div>`;
      }
      return `<div style="display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:6px;background:#F9FAFB;margin-bottom:5px">
        <div style="font-size:11px;color:#9CA3AF;width:36px;flex-shrink:0">${p.order}교시</div>
        <button onclick="openGroupSlotPendingPicker(${room.id},${p.order})" style="flex:1;text-align:left;font-size:11.5px;color:#5E5CE6;cursor:pointer;padding:3px 8px;border:0.5px dashed #5E5CE6;border-radius:5px;background:none">+ 그룹 수업 배정</button>
      </div>`;
    }).join('');

    return `<div class="tsa-card" style="overflow:hidden">
      <div class="tsa-card-header">
        <div>
          <span style="font-size:13px;font-weight:700;color:#111827">${lessonEsc(room.roomNo)}</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:8px;margin-left:6px;background:${room.type === '1:4' ? '#FEF3C7' : '#D1FAE5'};color:${room.type === '1:4' ? '#92400E' : '#065F46'}">${room.type}</span>
        </div>
      </div>
      <div style="padding:10px 14px;max-height:420px;overflow-y:auto">${rows}</div>
    </div>`;
  }).join('');

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;margin-bottom:10px">
      ${cards || '<div style="padding:30px;text-align:center;color:#9CA3AF;grid-column:1/-1">등록된 그룹 강의실이 없어.</div>'}
    </div>
    <div style="font-size:10.5px;color:#9CA3AF">※ 빈 교시에서 그룹을 먼저 고른 뒤, 그 시간에 가능한 강사를 선택해 배정해.</div>`;
}

// 강의실별 탭의 빈 교시 클릭: 강의실 유형에 맞는 미배정 그룹을 먼저 보여주고,
// 그룹 선택 뒤 해당 교시에 가능한 강사를 보여준다.
let _gsPendingRoomId = null;
let _gsPendingPeriod = null;
let _gsPendingGroupId = null;

function openGroupSlotPendingPicker(roomId, period) {
  const room = MOCK_CLASS_ROOMS.find(r => r.id === roomId);
  _gsPendingRoomId = roomId;
  _gsPendingPeriod = period;
  _gsPendingGroupId = null;
  renderGroupSlotPendingCandidates();
  const modal = document.getElementById('group-slot-pending-modal');
  if (modal) modal.style.display = 'flex';
}

function closeGroupSlotPendingPicker() {
  const modal = document.getElementById('group-slot-pending-modal');
  if (modal) modal.style.display = 'none';
  _gsPendingRoomId = null;
  _gsPendingPeriod = null;
  _gsPendingGroupId = null;
}

function renderGroupSlotPendingCandidates() {
  const box = document.getElementById('group-slot-pending-candidates');
  const titleEl = document.getElementById('group-slot-pending-title');
  if (!box || _gsPendingRoomId == null) return;
  const room = MOCK_CLASS_ROOMS.find(r => r.id === _gsPendingRoomId);
  if (titleEl) titleEl.textContent = `${room ? room.roomNo : ''} · ${_gsPendingPeriod}교시 그룹 수업 배정`;

  const candidates = MOCK_GROUP_CLASSES.filter(g =>
    g.status === 'active' && g.roomId == null &&
    getGroupClassCapacity(g.classType) <= Number(room?.capacity || 0) &&
    Array.isArray(g.periods) && g.periods.includes(_gsPendingPeriod)
  );
  box.innerHTML = candidates.map(group => {
    const students = group.studentIds.map(id => MOCK_STUDENTS.find(s => s.id === id)).filter(Boolean);
    const capacity = getGroupClassCapacity(group.classType);
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:6px">
      <div style="font-size:12px"><b>${lessonEsc(getGroupDisplayName(group))}</b> <span style="color:#6B7280">· ${students.length}/${capacity}명</span></div>
      <button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="selectGroupForRoomSlot(${group.id})">그룹 선택</button>
    </div>`;
  }).join('') || '<div style="padding:24px;text-align:center;color:#9CA3AF">이 강의실 정원과 템플릿 교시에 맞는 미배정 그룹이 없어.<br>그룹별 탭에서 해당 교시 그룹을 먼저 생성해줘.</div>';
}

function selectGroupForRoomSlot(groupId) {
  _gsPendingGroupId = groupId;
  const box = document.getElementById('group-slot-pending-candidates');
  const titleEl = document.getElementById('group-slot-pending-title');
  const room = MOCK_CLASS_ROOMS.find(r => r.id === _gsPendingRoomId);
  const group = MOCK_GROUP_CLASSES.find(g => g.id === groupId);
  if (!box || !group) return;
  if (titleEl) titleEl.textContent = `${room?.roomNo || ''} · ${_gsPendingPeriod}교시 담당 강사 선택`;
  const teachers = getGroupTeacherCandidates(group.classType, LESSON_DAYS, [_gsPendingPeriod], group.id);
  box.innerHTML = `<div style="padding:10px 12px;margin-bottom:10px;border-radius:8px;background:#F5F3FF;color:#4338CA;font-size:12px"><b>${lessonEsc(getGroupDisplayName(group))}</b><br><span style="font-size:10.5px">${lessonEsc(room?.roomNo || '')} · ${_gsPendingPeriod}교시에 배정할 수 있는 강사야.</span></div>` +
    (teachers.map(teacher => `<button type="button" onclick="assignGroupToRoomSlot(${teacher.id})" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;margin-bottom:6px;border:1px solid #E5E7EB;border-radius:8px;background:#fff;cursor:pointer"><b>${lessonEsc(teacher.nick || teacher.name)}</b><span style="font-size:10px;color:#6B7280">선택</span></button>`).join('') || '<div style="padding:24px;text-align:center;color:#DC2626">이 교시에 가능한 강사가 없어. 다른 빈 교시를 선택해줘.</div>') +
    '<button type="button" class="tsa-btn tsa-btn-outline tsa-btn-sm" style="width:100%;margin-top:6px" onclick="renderGroupSlotPendingCandidates()">← 그룹 다시 선택</button>';
}

function assignGroupToRoomSlot(teacherId) {
  const group = MOCK_GROUP_CLASSES.find(g => g.id === _gsPendingGroupId);
  const room = MOCK_CLASS_ROOMS.find(r => r.id === _gsPendingRoomId);
  if (!group || !room) return;
  if (getGroupClassCapacity(group.classType) > Number(room.capacity || 0)) {
    showToast(`${room.roomNo} 강의실 정원으로는 ${group.classType} 그룹을 배정할 수 없어.`, 'warning');
    renderGroupSlotPendingCandidates();
    return;
  }
  const roomConflict = MOCK_GROUP_CLASSES.some(other =>
    other.id !== group.id && other.status === 'active' && other.roomId === room.id &&
    Array.isArray(other.dayOfWeek) && Array.isArray(other.periods) &&
    other.dayOfWeek.some(day => LESSON_DAYS.includes(day)) && other.periods.includes(_gsPendingPeriod)
  );
  if (roomConflict) {
    showToast('선택한 강의실이 해당 교시에 이미 사용 중이야. 화면을 다시 확인해줘.', 'warning');
    closeGroupSlotPendingPicker();
    renderGroupManagement();
    return;
  }
  const validTeacher = getGroupTeacherCandidates(group.classType, LESSON_DAYS, [_gsPendingPeriod], group.id)
    .some(teacher => teacher.id === Number(teacherId));
  if (!validTeacher) {
    showToast('선택한 강사는 해당 교시에 더 이상 배정할 수 없어. 가능한 강사를 다시 선택해줘.', 'warning');
    selectGroupForRoomSlot(group.id);
    return;
  }
  group.roomId = room.id;
  group.teacherId = Number(teacherId);
  group.dayOfWeek = [...LESSON_DAYS];
  closeGroupSlotPendingPicker();
  renderGroupManagement();
  const teacher = MOCK_TEACHERS.find(t => t.id === Number(teacherId));
  showToast(`${getGroupDisplayName(group)}을(를) ${room.roomNo} ${group.periods[0]}교시에 배정했어. 담당 강사: ${teacher?.nick || teacher?.name || '-'}`, 'success');
}

function unassignGroupFromRoomSlot(groupId) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === Number(groupId));
  if (!group) return;
  const room = group.roomId != null ? MOCK_CLASS_ROOMS.find(item => item.id === group.roomId) : null;
  const periodLabel = Array.isArray(group.periods) && group.periods.length ? `${group.periods.join(', ')}교시` : '교시 미지정';
  if (!window.confirm(`${getGroupDisplayName(group)}의 ${room?.roomNo || '강의실'} · ${periodLabel} 배정을 해지할까?\n그룹과 학생 구성은 유지돼.`)) return;
  group.roomId = null;
  group.teacherId = null;
  renderGroupManagement();
  showToast(`${getGroupDisplayName(group)}의 강의실·담당 강사 배정을 해지했어.`, 'success');
}

function renderGroupManagementUnmatched(content) {
  const students = getUnmatchedGroupCandidateStudents();
  const nationalityCodes = {
    '한국': 'KR', '일본': 'JP', '중국': 'CN', '베트남': 'VN', '필리핀': 'PH',
    '몽골': 'MN', '대만': 'TW', '태국': 'TH', '러시아': 'RU'
  };
  const formatEnrollmentDate = value => value
    ? value.replace(/^20(\d{2})-(\d{2})-(\d{2})$/, '$1.$2.$3')
    : '-';
  content.innerHTML = `
    <div class="tsa-card" style="overflow:hidden">
      <div class="tsa-card-header"><h3 class="tsa-card-title">미배정 학생 <span style="color:#DC2626">${students.length}명</span></h3></div>
      <div style="overflow:auto">
        <table class="tsa-table">
          <thead><tr><th style="width:56px;text-align:center">#</th><th style="min-width:300px">학생 정보</th><th style="min-width:190px">과정 및 수강 기간</th><th>레벨</th><th>미배정 수업</th></tr></thead>
          <tbody>${students.map((student, index) => {
            const missingRows = getStudentMissingGroupRows(student.id);
            const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
            const nationalityCode = nationalityCodes[student.nationality] || '--';
            const maskedPassport = typeof maskPassportNumber === 'function'
              ? maskPassportNumber(student.passportNum)
              : (student.passportNum ? `${student.passportNum.slice(0, 2)}******${student.passportNum.slice(-2)}` : '미등록');
            return `<tr>
              <td style="text-align:center;font-weight:700;color:#6B7280">${students.length - index}</td>
              <td>
                <div style="display:flex;align-items:center;gap:12px;padding:5px 0">
                  <img src="${lessonEsc(avatarSrc)}" alt="${lessonEsc(student.nick || student.name)}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;flex:0 0 auto">
                  <div style="min-width:0">
                    <div style="font-size:13px;font-weight:800;color:#111827">${lessonEsc(student.nick || student.name)} <span style="font-weight:750">(${lessonEsc(student.name || '')})</span></div>
                    <div style="font-size:11px;color:#6B7280;margin-top:3px">${nationalityCode} ${lessonEsc(student.nationality || '-')} · ${lessonEsc(student.gender || '-')}성 ${student.age || '-'}세</div>
                    <div style="font-size:10.5px;color:#9CA3AF;margin-top:2px">여권: ${lessonEsc(maskedPassport || '미등록')}</div>
                  </div>
                </div>
              </td>
              <td>
                <div style="font-weight:700;color:#374151">${lessonEsc(student.course || '-')}</div>
                <div style="font-size:10.5px;color:#9CA3AF;margin-top:3px">${formatEnrollmentDate(student.startDate)} ~ ${formatEnrollmentDate(student.endDate)}</div>
              </td>
              <td>${lessonEsc(student.level || '-')}</td>
              <td>${missingRows.map(row => `<button type="button" onclick="openSizeAssignPopup(${student.id},'${row.subjectId}','${row.classType}')" style="display:inline-flex;flex-direction:column;align-items:flex-start;gap:2px;padding:6px 10px;margin:2px;border:0;border-radius:9px;background:${row.classType === '1:4' ? '#FEF3C7' : '#E0E7FF'};color:${row.classType === '1:4' ? '#92400E' : '#4338CA'};font-size:10.5px;font-weight:800;cursor:pointer;text-align:left"><span>${getGroupSizeShortLabel(row.classType)}(${row.classType}) 배정하기 ↗</span><span style="font-weight:500;opacity:.8;font-size:9px">${lessonEsc(getGroupManagementSubjectLabel(row.curriculum))}</span></button>`).join('') || '-'}</td>
            </tr>`;
          }).join('') || '<tr><td colspan="5" style="padding:30px;text-align:center;color:#9CA3AF">미배정 학생이 없어.</td></tr>'}</tbody>
        </table>
      </div>
    </div>`;
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
      const result = saveStudentOneToOneSchedule(message.studentId, message.subjectId, message.teacherId, message.period);
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
  const row = buildGroupManagementDisplayRows()[rowIndex];
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
    hardCap: getGroupClassCapacity(group.classType),
    baseCap: getGroupBaseCapacity(group.classType),
    count: group.studentIds.length
  }));
  const waitingStudentsData = waitingStudents.map(student => ({
    id: student.id,
    name: student.nick || student.name || '',
    sub: student.name || '',
    nationality: student.nationality || '-',
    gender: student.gender || '-',
    age: student.age || '-',
    level: student.level || '-',
    course: student.course || '-',
    startDate: student.startDate || '',
    endDate: student.departureDate || '',
    duration: student.duration || ''
  }));
  const groupCards = groups.map((group, index) => {
    const hardCap = getGroupClassCapacity(group.classType);
    const baseCap = getGroupBaseCapacity(group.classType);
    const groupStudents = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
    const remaining = Math.max(0, hardCap - groupStudents.length);
    const over = groupStudents.length > baseCap;
    const scheduleLabel = `${Array.isArray(group.dayOfWeek) && group.dayOfWeek.length ? `${esc(group.dayOfWeek.join(','))} ` : ''}${Array.isArray(group.periods) && group.periods.length ? esc(group.periods.join(', ')) + '교시' : ''}${group.teacherId != null ? ` · ${esc(MOCK_TEACHERS.find(t => t.id === group.teacherId)?.nick || '')}` : ''}${group.roomId != null ? ` · ${esc(MOCK_CLASS_ROOMS.find(r => r.id === group.roomId)?.roomNo || '')}` : ''}`;
    return `<div class="group-card${selectedGroup ? ' selected expanded' : ''}" data-group-id="${group.id}" role="button" tabindex="0" aria-expanded="${selectedGroup ? 'true' : 'false'}" onclick="selectGroup(${group.id})" onkeydown="handleGroupCardKey(event,${group.id})">
      <div class="group-head"><b>${esc(selectedGroup ? scheduleLabel : getGroupManagementDisplayLabel(group, groups))}</b><div class="group-head-right"><span class="${!remaining ? 'full' : over ? 'over' : 'open'}">${!remaining ? '상한 마감' : over ? `초과 배정 · ${esc(getGroupLiveRatioLabel(group))} 운영` : `남은 자리 ${remaining}석`}</span>${selectedGroup ? '' : '<span class="expand-label">학생 정보 보기 <span class="chevron">⌄</span></span>'}</div></div>
      <div class="count">${groupStudents.length}/${baseCap}명${selectedGroup ? '' : ` · ${scheduleLabel}`}</div>
      <div class="chips">${groupStudents.map(student => `<span>${esc(student.nick || student.name)}</span>`).join('') || '<em>배정 학생 없음</em>'}</div>
      <div class="group-details" onclick="event.stopPropagation()">
        <div class="detail-title"><b>소속 학생 ${groupStudents.length}명</b><span>학생의 기본 수강 정보를 확인할 수 있어.</span></div>
        <div class="student-grid">${groupStudents.map(student => {
          const displayName = student.nick || student.name || '-';
          const avatarSrc = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
          const period = [student.startDate, student.departureDate].filter(Boolean).join(' ~ ') || '-';
          return `<article class="student-card">
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
        }).join('') || '<div class="empty-students">현재 배정된 학생이 없어.</div>'}</div>
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
      footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 24px;background:#fff;border-top:1px solid #E5E7EB}
    </style></head><body>
    <header><h1>그룹 상세</h1><div class="sub">${esc(selectedGroup ? getGroupDisplayName(selectedGroup) : `${levelLabel} · ${row.subjectName} · ${getGroupSizeShortLabel(row.classType)}(${row.classType})`)}</div></header>
    <main>
      <section class="summary"><b>과목 구성</b><div class="subjects">${esc(getGroupManagementSubjectLabel(row.curriculum))}</div>
        ${selectedGroup ? `<div class="sub" style="margin-top:8px">이 조건(${esc(levelLabel)} · ${esc(row.subjectName)} · ${esc(getGroupSizeShortLabel(row.classType))}) 전체 기준 · 아래는 이 그룹 1개에 대한 정보야.</div><div class="numbers" style="margin-top:6px"><span>대상 학생 <b>${row.totalStudents}명</b></span><span>전체 배정 대기 <b class="${waitingStudents.length ? 'warn' : 'ok'}">${waitingStudents.length}명</b></span><span>추가 필요 그룹 <b class="${row.additionalGroups ? 'danger' : 'ok'}">${row.additionalGroups}개</b></span><span>운영 그룹 <b>${groups.length}개</b></span></div><div class="sub" style="margin-top:6px">이 그룹의 배정 학생·수업 교시·강사·강의실은 아래 그룹 카드에서 확인해줘.</div>` : `<div class="numbers"><span>대상 학생 <b>${row.totalStudents}명</b></span><span>배정 대기 <b class="${waitingStudents.length ? 'warn' : 'ok'}">${waitingStudents.length}명</b></span><span>추가 필요 그룹 <b class="${row.additionalGroups ? 'danger' : 'ok'}">${row.additionalGroups}개</b></span><span>운영 그룹 <b>${groups.length}개</b></span></div>`}
      </section>
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
      var waitingStudentsData=${JSON.stringify(waitingStudentsData).replace(/</g, '\\u003c')};
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
        footer.style.display=waitingStudentsData.length?'flex':'none';
        document.getElementById('assignStudents').innerHTML=waitingStudentsData.length?waitingStudentsData.map(function(s){
          var start=formatStudentDate(s.startDate);
          var end=formatStudentDate(s.endDate);
          var dateText=start&&end?start+' ~ '+end:start||end||'수강 기간 미등록';
          var durationText=s.duration?' ('+s.duration+'주)':'';
          return '<label class="student-row"><input type="checkbox" value="'+s.id+'"><div><b>'+s.name+' <span>('+s.sub+')</span></b><p>'+s.course+' · '+s.level+' · '+s.nationality+' · '+s.gender+'성 · '+s.age+'세</p><p class="student-period"><strong>▦</strong>'+dateText+durationText+'</p></div></label>';
        }).join(''):'<div class="sub">배정 대기 학생이 없어.</div>';
      }
      function formatStudentDate(value){
        if(!value)return '';
        var parts=String(value).split('-');
        return parts.length===3?parts[0].slice(-2)+'.'+parts[1]+'.'+parts[2]:String(value);
      }
      function saveAssign(){
        if(!selectedGroupId){window.alert('그룹을 먼저 선택해.');return;}
        var ids=Array.from(document.querySelectorAll('#assignStudents input:checked')).map(function(input){return Number(input.value)});
        if(!ids.length){window.alert('배정할 학생을 선택해.');return;}
        var selectedNames=waitingStudentsData.filter(function(student){return ids.indexOf(student.id)>-1;}).map(function(student){return student.name;});
        var confirmMessage='선택한 '+ids.length+'명의 학생을 이 그룹에 배정할까?\\n\\n'+selectedNames.join(', ')+'\\n\\n배정 후에도 그룹 상세에서 학생 정보를 확인할 수 있어.';
        if(!window.confirm(confirmMessage))return;
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'assign-students-additive',studentIds:ids,groupId:selectedGroupId},'*');
        window.close();
      }
      function openGroupEdit(id){
        window.openGroupEditBrowserPopup(id,${rowIndex},window);
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

function assignGroupStudentsFromBrowserPopup(groupId, studentIds) {
  const group = MOCK_GROUP_CLASSES.find(item => item.id === groupId);
  if (!group) return { ok: false, message: '그룹을 찾을 수 없어.' };
  const selectedIds = [...new Set((studentIds || []).map(Number).filter(Number.isFinite))];
  const capacity = getGroupClassCapacity(group.classType);
  if (selectedIds.length > capacity) return { ok: false, message: `정원 ${capacity}명까지만 선택할 수 있어.` };
  const levels = getGroupLevelSet(group);
  const groupSubjectId = getGroupSubjectId(group);
  const validIds = selectedIds.filter(id => {
    const student = MOCK_STUDENTS.find(item => item.id === id);
    const level = student ? getLevelGroupForStudent(student) : null;
    return student &&
      level != null &&
      levels.includes(level) &&
      studentCanTakeGroupAtTemplatePeriod(student, groupSubjectId, group.classType, group.periods);
  });
  if (validIds.length !== selectedIds.length) {
    return { ok: false, message: '과목·레벨·수업 형태가 일치하지 않는 학생이 포함되어 있어.' };
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
  const hardCap = getGroupClassCapacity(group.classType);
  const baseCap = getGroupBaseCapacity(group.classType);
  if (group.studentIds.length >= hardCap) return { ok: false, message: `초과 허용 상한(${hardCap}명)까지 가득 찼어.` };
  const level = getLevelGroupForStudent(student);
  if (level == null || !getGroupLevelSet(group).includes(level)) {
    return { ok: false, message: '이 그룹의 레벨 범위 대상이 아니야.' };
  }
  const groupSubjectId = getGroupSubjectId(group);
  if (!studentCanTakeGroupAtTemplatePeriod(student, groupSubjectId, group.classType, group.periods)) {
    return { ok: false, message: '학생 과정의 교시별 시간표와 과목·유형·교시가 일치하지 않아 배정할 수 없어.' };
  }
  const duplicated = MOCK_GROUP_CLASSES.some(item =>
    item.id !== group.id && item.status === 'active' &&
    item.classType === group.classType && getGroupSubjectId(item) === groupSubjectId &&
    Array.isArray(item.periods) && Array.isArray(group.periods) && item.periods.some(period => group.periods.includes(period)) &&
    item.studentIds.includes(studentId)
  );
  if (duplicated) return { ok: false, message: `이미 같은 과목의 다른 ${getGroupSizeShortLabel(group.classType)}에 배정된 학생이야.` };
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

// 미배정 학생 목록의 과목 배지를 눌렀을 때 뜨는 팝업 — 그 학생·과목·수업형태와 일치하는 그룹만 골라 배정한다.
// 미배정 학생의 "중그룹/대그룹 배정하기" 팝업.
// 레벨 범위 포함 + 같은 과목의 그룹 전체를 배정 학생 명단과 함께 보여주고,
// 기준 정원 초과~상한 이내는 경고와 함께 선택 가능, 상한 초과는 마감 처리.
function openSizeAssignPopup(studentId, subjectId, classType, popupTarget) {
  const student = MOCK_STUDENTS.find(item => item.id === studentId);
  if (!student) return;
  const row = buildCsGroupDemandRows().find(item =>
    item.subjectId === subjectId && item.classType === classType && item.studentIds.includes(studentId)
  );
  if (!row) {
    showToast('배정 대상 수업 정보를 찾을 수 없어.', 'warning');
    return;
  }
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('size-assign');
    popupUrl.searchParams.set('student', studentId);
    popupUrl.searchParams.set('subject', subjectId);
    popupUrl.searchParams.set('type', classType);
    const openedPopup = window.open(popupUrl.href, `tsa-size-assign-${studentId}-${subjectId}-${classType}`, 'popup=yes,width=480,height=680,resizable=yes,scrollbars=yes');
    if (!openedPopup) {
      showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
      return;
    }
    return;
  }
  const popup = popupTarget;
  try { popup.stop(); } catch (error) {}
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  const groups = getGroupManagementRowGroups(row);
  const hardCap = getGroupClassCapacity(classType);
  const baseCap = getGroupBaseCapacity(classType);
  const sizeLabel = getGroupSizeShortLabel(classType);
  const levelLabel = getLevelGroupName(row.levelGroup);
  let firstSelectable = true;
  const groupOptions = groups.map(group => {
    const count = group.studentIds.length;
    const full = count >= hardCap;
    const over = !full && count >= baseCap;
    const roster = group.studentIds
      .map(id => MOCK_STUDENTS.find(item => item.id === id))
      .filter(Boolean)
      .map(item => `<span class="chip">${esc(item.nick || item.name)}</span>`)
      .join('') || '<em>배정 학생 없음</em>';
    const statusLabel = full
      ? `상한 마감 (${count}/${hardCap}명)`
      : over
      ? `기준 정원 초과 배정 · 확정 시 1:${count + 1} 운영 (${count}/${baseCap}명)`
      : `배정 가능 (${count}/${baseCap}명)`;
    const checked = !full && firstSelectable;
    if (checked) firstSelectable = false;
    return `<label class="group-option ${full ? 'disabled' : ''}">
      <input type="radio" name="pick-group" value="${group.id}" ${full ? 'disabled' : ''} ${checked ? 'checked' : ''}>
      <div style="flex:1;min-width:0">
        <b>${esc(getGroupManagementDisplayLabel(group, groups))}</b>
        <p class="${full ? 'full' : over ? 'over' : 'ok'}">${statusLabel}</p>
        <div class="roster">${roster}</div>
      </div>
    </label>`;
  }).join('');
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>${sizeLabel} 배정</title>
    <style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{padding:18px 20px;background:#fff;border-bottom:1px solid #E5E7EB}h1{font-size:15px;margin:0}.meta{font-size:11px;color:#6B7280;margin-top:4px}
      main{padding:16px 20px 86px}
      .group-option{display:flex;align-items:flex-start;gap:10px;padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#fff;margin-bottom:8px;cursor:pointer}
      .group-option:has(input:checked){border-color:#6366F1;background:#F5F3FF}
      .group-option.disabled{opacity:.5;cursor:not-allowed}
      .group-option input{width:16px;height:16px;accent-color:#5E5CE6;margin-top:2px}
      .group-option b{font-size:12px}.group-option p{margin:3px 0 0;font-size:10.5px;font-weight:700}
      .ok{color:#047857}.over{color:#B45309}.full{color:#DC2626}
      .roster{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}.chip{padding:2px 7px;border-radius:999px;background:#F3F4F6;font-size:9.5px}.roster em{font-size:9.5px;color:#9CA3AF}
      .empty{padding:16px;text-align:center;color:#9CA3AF;font-size:12px}
      .create{display:block;width:100%;padding:10px;border:1px dashed #A5B4FC;border-radius:8px;background:none;color:#4F46E5;font-size:11.5px;cursor:pointer;margin-top:6px}
      footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;background:#fff;border-top:1px solid #E5E7EB}
      button{padding:9px 13px;border:1px solid #D1D5DB;border-radius:8px;background:#fff;cursor:pointer}.primary{background:#5E5CE6;color:#fff;border-color:#5E5CE6}
    </style></head><body>
    <header><h1>${sizeLabel}(${esc(classType)}) 배정 · ${esc(row.subjectName)}</h1><div class="meta">${esc(student.nick || student.name)} · ${esc(levelLabel)} · 기준 ${baseCap}명 / 상한 ${hardCap}명 · 과목 단위 개별 클래스</div></header>
    <main>
      ${groupOptions || '<div class="empty">레벨·과목이 일치하는 그룹이 없어.</div>'}
      <button class="create" onclick="createGroup()">+ 새 그룹 만들기</button>
    </main>
    <footer><button onclick="window.close()">취소</button><button class="primary" onclick="save()">배정 확정</button></footer>
    <script>
      var baseCap=${baseCap};
      var groupCounts=${JSON.stringify(Object.fromEntries(groups.map(group => [group.id, group.studentIds.length]))).replace(/</g, '\\u003c')};
      function createGroup(){
        window.openGroupCreateBrowserPopup(${curriculumJsLiteral(row.curriculum)},'${classType}',${row.levelGroup},window,${studentId},${row.sequence ?? 'undefined'});
      }
      function save(){
        var picked=document.querySelector('input[name=pick-group]:checked');
        if(!picked){window.alert('배정할 그룹을 선택해.');return;}
        var count=groupCounts[picked.value]||0;
        if(count>=baseCap&&!window.confirm('기준 정원('+baseCap+'명)을 초과해 1:'+(count+1)+'로 운영돼. 배정할까?')){return;}
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'assign-student-to-group',studentId:${studentId},groupId:Number(picked.value)},'*');
        window.close();
      }
    <\/script>
    </body></html>`);
  popup.document.close();
  popup.focus();
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
  const capacity = getGroupClassCapacity(group.classType);
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
    return level != null &&
      getGroupLevelSet(group).includes(level) &&
      studentCanTakeGroupAtTemplatePeriod(student, groupSubjectId, group.classType, group.periods) &&
      (!assignedElsewhere || selectedIds.has(student.id)) &&
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
  if (!levelGroups.length) return { ok: false, message: '레벨을 1개 이상 선택해.' };
  if (!classType || !startDate) return { ok: false, message: '수업 형태와 운영 시작일을 확인해.' };
  if (!periods.length) return { ok: false, message: '실제 교시를 1개 이상 선택해.' };
  if (!dayOfWeek.length) return { ok: false, message: '요일을 1개 이상 선택해.' };
  // 생성 화면에서 선택한 강사·강의실도 저장 직전에 다시 가용성과 중복을 검증한다.
  const capacity = getGroupClassCapacity(classType);
  const availableTeachers = getGroupTeacherCandidates(classType, dayOfWeek, periods, isCreate ? null : group.id);
  const availableRooms = getGroupRoomCandidates(classType, dayOfWeek, periods, capacity, isCreate ? null : group.id);
  if (teacherId != null && !availableTeachers.some(teacher => teacher.id === teacherId)) {
    return { ok: false, message: '선택한 강사는 해당 요일·교시에 배정할 수 없어. 다시 검색해줘.' };
  }
  if (roomId != null && !availableRooms.some(room => room.id === roomId)) {
    return { ok: false, message: '선택한 강의실은 해당 요일·교시에 배정할 수 없어. 다시 검색해줘.' };
  }
  if (!isCreate && group.studentIds.length > capacity) return { ok: false, message: `현재 배정 인원 ${group.studentIds.length}명이 변경할 상한 ${capacity}명을 초과해.` };
  const subjectId = curriculum[0].id;
  if (!isCreate) {
    const incompatibleStudents = (group.studentIds || []).map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(student => {
      const level = getLevelGroupForStudent(student);
      return !student || level == null || !levelGroups.includes(level) || !studentCanTakeGroupAtTemplatePeriod(student, subjectId, classType, periods);
    });
    if (incompatibleStudents.length) {
      const names = incompatibleStudents.map(student => student?.nick || student?.name || '알 수 없는 학생').join(', ');
      return { ok: false, message: `과정 템플릿의 과목·수업 유형·레벨과 맞지 않는 기존 학생이 있어 수정할 수 없어: ${names}` };
    }
  }
  const subjectNames = [...curriculum]
    .sort((a, b) => (MOCK_MASTER_SUBJECTS.find(s => s.id === a.id)?.order ?? 999) - (MOCK_MASTER_SUBJECTS.find(s => s.id === b.id)?.order ?? 999))
    .map(ref => MOCK_MASTER_SUBJECTS.find(s => s.id === ref.id)?.name || ref.id);
  const name = `${subjectNames.join('·')} · ${levelGroups.map(getLevelGroupName).join(', ')} · ${getGroupSizeShortLabel(classType)}`;
  const groupData = {
    name, groupMode: 'subject', course: payload?.course || group?.course || '', courses: [], status: 'active',
    subjectId, subjectIds: curriculum.map(ref => ref.id), curriculum,
    levelGroup: levelGroups[0], levelGroups, classType, startDate, endDate, weeklyFrequency, nationalityCap, periods, dayOfWeek, teacherId, roomId
  };
  let seedStudent = null;
  let createdGroupId = null;
  if (isCreate) {
    const seedStudentId = payload?.seedStudentId != null ? Number(payload.seedStudentId) : null;
    const candidate = seedStudentId != null ? MOCK_STUDENTS.find(item => item.id === seedStudentId) : null;
    const candidateLevel = candidate ? getLevelGroupForStudent(candidate) : null;
    const seedValid = candidate &&
      candidateLevel != null && levelGroups.includes(candidateLevel) &&
      studentCanTakeGroupAtTemplatePeriod(candidate, subjectId, classType, periods);
    if (payload?.assignSeedStudent === true && seedValid) seedStudent = candidate;
    createdGroupId = _csGroupNextId++;
    MOCK_GROUP_CLASSES.push({
      id: createdGroupId,
      ...groupData,
      studentIds: seedStudent ? [seedStudent.id] : [],
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
    levelGroups: [Number(createDefaults?.level) || 1],
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
  // 사전 지정된 과목이 없으면 과정의 시간표 템플릿에서 유형·과목을 관리자가 직접 고르게 한다.
  // 학생 배정 팝업의 "+ 새 그룹 만들기"도 과목을 미리 매칭하지 않고 이 방식으로 들어온다.
  const useTemplatePicker = isCreate && prefillCurriculum.length === 0;
  const groupClassTypeCodes = new Set(classTypes.map(type => type.code));
  const courseTemplates = {};
  if (useTemplatePicker) {
    MOCK_COURSES.filter(course => course.active !== false).forEach(course => {
      const seen = new Set();
      const rows = [];
      // sequence = 과정 전체 시간표(1:1 포함)에서 이 항목이 몇 번째 교시인지 — 그 번호를 그대로 실제 교시로 쓴다.
      getCourseTimetableTemplate(course).forEach((item, index) => {
        if (!groupClassTypeCodes.has(item.classType)) return;
        const key = item.classType + '|' + item.subjectId;
        if (seen.has(key)) return;
        seen.add(key);
        const subject = MOCK_MASTER_SUBJECTS.find(s => s.id === item.subjectId);
        rows.push({ classType: item.classType, subjectId: item.subjectId, subjectName: subject?.name || item.subjectId, sequence: index + 1 });
      });
      courseTemplates[course.name] = rows;
    });
  }
  // 학생 요구사항("+ 새 그룹 만들기")에서 들어온 경우는 이미 그 학생 과정 템플릿의 몇 번째 교시인지(sequence)가 정해져 있다 — 그대로 실제 교시로 잠근다.
  const prefillSequence = isCreate && !useTemplatePicker && createDefaults?.sequence != null ? Number(createDefaults.sequence) : null;
  const lockPeriodToSequence = useTemplatePicker || prefillSequence != null;
  const totalPeriods = (typeof APP !== 'undefined' && APP.bellSystem?.total) || 8;
  const selectedPeriods = isCreate
    ? (prefillSequence != null ? [prefillSequence] : [])
    : (Array.isArray(group.periods) ? group.periods.map(Number).filter(Number.isFinite) : []);
  // 요일은 항상 월~금 고정 운영으로 둔다(변경 불가).
  const selectedDays = [...LESSON_DAYS];
  const currentTeacherId = group.teacherId != null ? Number(group.teacherId) : null;
  const currentRoomId = group.roomId != null ? Number(group.roomId) : null;
  const seedStudentId = isCreate && createDefaults?.seedStudentId != null ? Number(createDefaults.seedStudentId) : null;
  const seedStudent = seedStudentId != null ? MOCK_STUDENTS.find(item => item.id === seedStudentId) : null;
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>${isCreate ? '그룹 만들기' : '그룹 설정'}</title>
    <style>
      *{box-sizing:border-box}html,body{height:100%;overflow:hidden}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:12px;padding:18px 22px;background:#fff;border-bottom:1px solid #E5E7EB}.back{border:0;background:none;font-size:22px;cursor:pointer}h1{font-size:18px;margin:0}.meta{font-size:11px;color:#6B7280;margin-top:4px}
      main{height:calc(100vh - 137px);overflow-y:auto;overscroll-behavior:contain;padding:18px 22px 28px}.section{padding:15px;border:1px solid #E5E7EB;border-radius:12px;background:#fff;margin-bottom:11px}.section h2{font-size:12px;margin:0 0 10px}label.title{display:block;font-size:11px;font-weight:700;margin:0 0 6px}
      select,input{width:100%;height:38px;padding:0 10px;border:1px solid #D1D5DB;border-radius:8px;background:#fff}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.choices{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}
      .choice{display:flex;align-items:center;gap:7px;padding:9px;border:1px solid #E5E7EB;border-radius:8px;font-size:11px}.choice:has(input:checked){border-color:#6366F1;background:#F5F3FF}.choice input{width:15px;height:15px;accent-color:#5E5CE6}
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
    <header><div style="flex:1"><h1>${isCreate ? '그룹 만들기' : '그룹 설정'}</h1><div class="meta">${isCreate ? (useTemplatePicker ? '과정을 선택하면 시간표 템플릿에서 유형·과목이 자동으로 채워져.' : (seedStudent ? `${esc(seedStudent.nick || seedStudent.name)} 학생을 위한 그룹을 만들어. 레벨을 확인해줘.` : '레벨·수업 형태를 확인해줘.')) : esc(getGroupDisplayName(group))}</div></div><button class="back" onclick="goBack()">×</button></header>
    <main>
      ${seedStudent ? `<div class="section" style="background:#F5F3FF;border-color:#C7D2FE;color:#4338CA;font-size:11px;font-weight:700">그룹만 생성돼. 생성 후 ${esc(seedStudent.nick || seedStudent.name)} 수업 배정 화면으로 자동 복귀하며, 학생 배정은 그 화면에서 직접 확정해.</div>` : ''}
      ${useTemplatePicker ? `
      <section class="section"><h2>과정</h2><select id="templateCourse" onchange="onCourseChange()"><option value="">과정을 선택해</option>${MOCK_COURSES.filter(course => course.active !== false).map(course => `<option value="${esc(course.name)}">${esc(course.name)}</option>`).join('')}</select><div class="hint">교육 과정 및 과목 레벨 설정에 등록된 과정 목록이야.</div></section>
      <section class="section"><h2>교시 템플릿 (유형 · 과목)</h2><select id="templateRow" onchange="onTemplateRowChange()" disabled><option value="">먼저 과정을 선택해</option></select><div class="hint" id="templateHint">선택한 과정의 시간표 템플릿에서 그룹 수업(1:4, 1:8) 항목만 보여줘.</div><input type="hidden" id="classType" value=""></section>
      ` : `
      <section class="section"><h2>과목</h2><div id="subjects" class="choices"></div><div class="hint">그룹은 과목 1개당 개별 클래스로 만들어. 같은 과목이면 코스가 달라도 합반 후보가 될 수 있어.</div></section>
      `}
      <section class="section"><h2>레벨 선택</h2><div class="choices">${MOCK_MASTER_LEVELS.filter(level => level.visible !== false).sort((a,b)=>a.order-b.order).map(level => `<label class="choice"><input type="checkbox" class="level" value="${level.order}" ${!isCreate && selectedLevels.includes(level.order) ? 'checked' : ''}>${esc(level.name)}</label>`).join('')}</div><div class="hint">교재가 레벨마다 달라 단일 레벨을 권장해. 여러 레벨을 묶는 건 운영 편의를 위한 예외 옵션이야.</div></section>
      ${useTemplatePicker ? `
      <section class="section"><div class="grid"><div><label class="title">동일 국적 최대 인원 (명)</label><input id="nationalityCap" type="number" min="1" value="${group.nationalityCap ?? ''}" placeholder="교시 템플릿 선택 후 자동"><div class="hint" id="nationalityCapHint">비워두면 수업 형태별 기본값을 사용해.</div></div></div></section>
      ` : `
      <section class="section"><div class="grid"><div><label class="title">수업 형태</label><select id="classType" onchange="renderSubjects();updateNationalityCapHint()">${classTypes.map(type => `<option value="${type.code}" ${type.code === group.classType ? 'selected' : ''}>${esc(type.code)} ${esc(type.name)}</option>`).join('')}</select></div><div><label class="title">동일 국적 최대 인원 (명)</label><input id="nationalityCap" type="number" min="1" value="${group.nationalityCap ?? ''}" placeholder="${getGroupNationalityCap(group.classType)}명"><div class="hint" id="nationalityCapHint">비워두면 기본값 ${getGroupNationalityCap(group.classType)}명을 사용해.</div></div></div></section>
      `}
      <section class="section"><h2>요일</h2><div id="days" class="periods" style="grid-template-columns:repeat(5,1fr)"></div><div class="hint" id="daysSelectedHint">선택됨: 요일 미지정</div></section>
      <section class="section"><h2>교시 선택</h2><div id="periods" class="periods"></div><div class="hint" id="periodsSelectedHint">선택됨: 교시 미지정</div></section>
      <input type="hidden" id="teacherId" value="${currentTeacherId != null ? currentTeacherId : ''}">
      <input type="hidden" id="roomId" value="${currentRoomId != null ? currentRoomId : ''}">
      <section class="section"><h2>강사·강의실 배정</h2><div class="hint" style="margin:-4px 0 10px">선택한 요일과 교시에 실제 배정 가능한 강사와 강의실만 보여줘.</div><div class="resource-grid">
        <div id="teacherResourceBox" class="resource-box"><div class="resource-label"><span>1. 담당 강사 선택</span><span id="teacherSelectedLabel" class="selected-resource">미선택</span></div><button type="button" id="teacherToggle" class="entity-toggle placeholder" aria-expanded="false" onclick="toggleTeacherPanel()">강사 검색하기</button><div id="teacherPanel" class="entity-panel" style="display:none"><div class="entity-filter-row"><input id="teacherSearch" class="entity-search" placeholder="이름 또는 담당 강의실 검색" oninput="filterTeacherPanel()"><select id="teacherGrade" onchange="filterTeacherPanel()"><option value="">등급 전체</option><option value="A">A등급</option><option value="B">B등급</option><option value="C">C등급</option></select></div><div id="teacherOptions" class="entity-options"></div></div></div>
        <div id="roomResourceBox" class="resource-box"><div class="resource-label"><span>2. 강의실 선택</span><span id="roomSelectedLabel" class="selected-resource">미선택</span></div><button type="button" id="roomToggle" class="entity-toggle placeholder" aria-expanded="false" onclick="toggleRoomPanel()">강의실 검색하기</button><div id="roomPanel" class="entity-panel" style="display:none"><input id="roomSearch" class="entity-search" placeholder="강의실명 검색" oninput="filterRoomPanel()"><div id="roomOptions" class="entity-options"></div></div></div>
      </div><div id="candidateHint" class="hint"></div></section>
      <section class="section"><div id="preview" class="preview"></div></section>
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
      var courseTemplates=${JSON.stringify(courseTemplates).replace(/</g, '\\u003c')};
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
          html+=lockPeriodToSequence
            ? ('<button type="button" class="period-btn'+(selected?' selected':'')+'" disabled style="cursor:default;opacity:'+(selected?1:.35)+'">'+i+'</button>')
            : ('<button type="button" class="period-btn'+(selected?' selected':'')+'" data-period="'+i+'" onclick="togglePeriod('+i+')">'+i+'</button>');
        }
        container.innerHTML=html;
        document.getElementById('periodsSelectedHint').textContent=lockPeriodToSequence
          ? '과정 시간표 템플릿 기준 교시라 자동으로 정해져. 선택됨: '+(selectedPeriods.length?selectedPeriods.join(', ')+'교시':'과목을 먼저 선택해')
          : '선택됨: '+(selectedPeriods.length?selectedPeriods.join(', ')+'교시':'교시 미지정');
      }
      function togglePeriod(period){
        if(lockPeriodToSequence) return;
        // 그룹 하나는 하루 1교시만 만난다(과정 시간표 템플릿의 교시 항목당 1시간 기준) — 교시는 단일 선택.
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
      function onCourseChange(){
        var course=document.getElementById('templateCourse').value;
        var rows=courseTemplates[course]||[];
        var rowSel=document.getElementById('templateRow');
        rowSel.disabled=!rows.length;
        rowSel.innerHTML='<option value="">'+(rows.length?'템플릿 선택':'그룹 수업 항목 없음')+'</option>'+rows.map(function(r,i){return '<option value="'+i+'">'+r.sequence+'교시 · '+r.classType+' · '+r.subjectName+'</option>';}).join('');
        document.getElementById('templateHint').textContent=rows.length?'':'이 과정은 전부 1:1 수업이라 그룹 수업 항목이 없어. 다른 과정을 선택해줘.';
        // 레벨은 관리자가 직접 고르게 두고 과정 선택으로 자동 체크하지 않는다.
        document.querySelectorAll('.level').forEach(function(cb){cb.checked=false;});
        selectedTemplateSubject=null;
        document.getElementById('classType').value='';
        onTemplateRowChange();
      }
      function onTemplateRowChange(){
        var course=document.getElementById('templateCourse').value;
        var rows=courseTemplates[course]||[];
        var idx=document.getElementById('templateRow').value;
        var row=rows[idx];
        selectedTemplateSubject=row?{id:row.subjectId,hours:1}:null;
        document.getElementById('classType').value=row?row.classType:'';
        selectedPeriods=row?[row.sequence]:[];
        updateNationalityCapHint();
        renderPeriods();
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
      function goBack(){window.close();}
      function save(){
        if(useTemplatePicker&&!selectedTemplateSubject){window.alert('과정과 교시 템플릿을 선택해.');return;}
        if(!document.querySelectorAll('.level:checked').length){window.alert('레벨을 1개 이상 선택해.');return;}
        if(!document.getElementById('teacherId').value){window.alert('담당 강사를 검색해서 선택해.');return;}
        if(!document.getElementById('roomId').value){window.alert('강의실을 검색해서 선택해.');return;}
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        var courseSel=document.getElementById('templateCourse');
        var payload={curriculum:selectedCurriculum(),course:courseSel?courseSel.value:'',levelGroups:Array.from(document.querySelectorAll('.level:checked')).map(function(input){return Number(input.value)}),classType:document.getElementById('classType').value,nationalityCap:document.getElementById('nationalityCap').value,startDate:document.getElementById('startDate').value,endDate:document.getElementById('endDate').value,weeklyFrequency:document.getElementById('weeklyFrequency').value,periods:selectedPeriods,dayOfWeek:selectedDays,teacherId:document.getElementById('teacherId').value,roomId:document.getElementById('roomId').value,seedStudentId:${seedStudentId != null ? seedStudentId : 'null'},assignSeedStudent:false};
        window.opener.postMessage({channel:'tsa-group-popup',action:'save-group',groupId:${isCreate ? 'null' : group.id},payload:payload,returnToStudentAssignment:${isCreate && seedStudentId != null ? `{studentId:${seedStudentId},classType:'${group.classType}'}` : 'null'}},'*');
      }
      window.addEventListener('message',function(event){
        var message=event.data;
        if(!message||message.channel!=='tsa-group-popup'||message.action!=='save-group-result')return;
        if(!message.result||!message.result.ok){window.alert(message.result&&message.result.message?message.result.message:'그룹을 저장하지 못했어.');return;}
        var back=message.returnToStudentAssignment;
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
    <\/script></body></html>`);
  popup.document.close();
  popup.focus();
}

// prefillCurriculum: 커리큘럼 배열([{id,hours}]) 또는 (구버전 호환) 단일 subjectId 문자열.
function openGroupCreateBrowserPopup(prefillCurriculum, prefillClassType, prefillLevelGroup, popupTarget, seedStudentId, prefillSequence) {
  const safeSeedStudentId = Number.isFinite(Number(seedStudentId)) ? Number(seedStudentId) : null;
  const safeSequence = Number.isFinite(Number(prefillSequence)) ? Number(prefillSequence) : null;
  const normalizedCurriculum = Array.isArray(prefillCurriculum)
    ? prefillCurriculum.map(ref => ({ id: ref.id, hours: Math.max(1, Number(ref.hours) || 1) }))
    : (prefillCurriculum ? [{ id: prefillCurriculum, hours: 1 }] : []);
  const defaults = {
    curriculum: normalizedCurriculum,
    subjectId: normalizedCurriculum[0]?.id || '',
    type: prefillClassType || '1:4',
    level: Number(prefillLevelGroup) || 1,
    seedStudentId: safeSeedStudentId,
    sequence: safeSequence
  };
  if (!popupTarget) {
    const popupUrl = createGroupPopupUrl('create');
    if (normalizedCurriculum.length) popupUrl.searchParams.set('curriculum', JSON.stringify(normalizedCurriculum));
    popupUrl.searchParams.set('type', defaults.type);
    popupUrl.searchParams.set('level', defaults.level);
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
function openGroupManagementDetail(rowIndex) {
  closeGroupManagementDetail();
  const row = buildGroupManagementDisplayRows()[rowIndex];
  if (!row) return;
  const groups = getGroupManagementRowGroups(row);
  const assignedIds = new Set(groups.flatMap(group => group.studentIds));
  const students = row.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
  const waitingStudents = students.filter(student => !assignedIds.has(student.id));
  const levelLabel = (row.levelGroups || [row.levelGroup]).map(getLevelGroupName).join(' ~ ');
  const overlay = document.createElement('div');
  overlay.id = 'group-management-detail-modal';
  overlay.style.display = 'flex';
  overlay.innerHTML = `
    <div class="tsa-modal-backdrop" onclick="closeGroupManagementDetail()">
      <div class="tsa-modal" style="max-width:960px" onclick="event.stopPropagation()">
        <div class="tsa-modal-header">
          <div><h3 class="tsa-modal-title">그룹 상세</h3><div style="font-size:11px;color:#6B7280;margin-top:4px">${lessonEsc(levelLabel)} · ${lessonEsc(row.subjectName)} · ${lessonEsc(getGroupSizeShortLabel(row.classType))}(${row.classType})</div></div>
          <button class="tsa-modal-close" onclick="closeGroupManagementDetail()">×</button>
        </div>
        <div class="tsa-modal-body">
          <div style="padding:12px;border-radius:10px;background:#F9FAFB;margin-bottom:14px">
            <b style="font-size:12px">과목 구성</b>
            <div style="font-size:11px;color:#4B5563;margin-top:5px">${lessonEsc(getGroupManagementSubjectLabel(row.curriculum))}</div>
            <div style="display:flex;gap:22px;flex-wrap:wrap;margin-top:10px;font-size:11px">
              <span>대상 학생 <b>${row.totalStudents}명</b></span>
              <span>배정 대기 <b style="color:${waitingStudents.length ? '#B45309' : '#047857'}">${waitingStudents.length}명</b></span>
              <span>추가 필요 그룹 <b style="color:${row.additionalGroups ? '#DC2626' : '#047857'}">${row.additionalGroups}개</b></span>
              <span>운영 그룹 <b>${groups.length}개</b></span>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:minmax(300px,.85fr) minmax(0,1.35fr);gap:14px">
            <div>
              <h4 style="font-size:12px;margin:0 0 8px">배정 대상 학생</h4>
              <div style="display:flex;flex-direction:column;gap:7px;max-height:390px;overflow:auto">
                ${students.map(student => {
                  const assigned = assignedIds.has(student.id);
                  return `<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px;border:1px solid #E5E7EB;border-radius:9px">
                    <div>
                      <b>${lessonEsc(student.nick || student.name)} <span style="font-size:10px;font-weight:400;color:#9CA3AF">${lessonEsc(student.name || '')}</span></b>
                      <div style="font-size:10px;color:#6B7280;margin-top:3px">${lessonEsc(student.nationality || '-')} · ${student.age || '-'}세 · ${lessonEsc(student.level || '-')}</div>
                    </div>
                    <span style="padding:3px 7px;border-radius:999px;background:${assigned ? '#D1FAE5' : '#FEF3C7'};color:${assigned ? '#047857' : '#B45309'};font-size:9px;font-weight:800">${assigned ? '배정' : '미배정'}</span>
                  </div>`;
                }).join('') || '<div style="padding:20px;text-align:center;color:#9CA3AF">대상 학생이 없어.</div>'}
              </div>
            </div>
            <div>
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                <h4 style="font-size:12px;margin:0">운영 그룹</h4>
                ${groups.length > 3 ? `<button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="closeGroupManagementDetail();openOperatingGroupsPopup(${rowIndex})">전체 보기</button>` : ''}
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;max-height:390px;overflow:auto">
                ${groups.map((group, index) => {
                  const hardCap = getGroupClassCapacity(group.classType);
                  const baseCap = getGroupBaseCapacity(group.classType);
                  const groupStudents = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
                  const remaining = Math.max(0, hardCap - groupStudents.length);
                  const over = groupStudents.length > baseCap;
                  return `<div style="padding:11px;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
                    <div style="display:flex;justify-content:space-between;gap:8px">
                      <b style="font-size:11px">${lessonEsc(getGroupManagementDisplayLabel(group, groups))}</b>
                      <span style="font-size:9.5px;font-weight:800;color:${!remaining ? '#DC2626' : over ? '#B45309' : '#047857'}">${!remaining ? '상한 마감' : over ? `초과 배정 · ${lessonEsc(getGroupLiveRatioLabel(group))} 운영` : `남은 자리 ${remaining}석`}</span>
                    </div>
                    <div style="font-size:10px;color:#6366F1;font-weight:800;margin-top:5px">${groupStudents.length}/${baseCap}명</div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${groupStudents.map(student => `<span style="padding:3px 6px;border-radius:999px;background:#F3F4F6;font-size:9px">${lessonEsc(student.nick || student.name)}</span>`).join('') || '<span style="font-size:9px;color:#9CA3AF">배정 학생 없음</span>'}</div>
                    <div style="display:flex;gap:5px;margin-top:8px">
                      ${remaining ? `<button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="closeGroupManagementDetail();openGroupManagementStudentEditor(${group.id})">학생 배정</button>` : ''}
                      <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="closeGroupManagementDetail();openGroupManagementStudentEditor(${group.id})">학생 수정</button>
                      <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="closeGroupManagementDetail();openGroupEditBrowserPopup(${group.id})">그룹 수정</button>
                    </div>
                  </div>`;
                }).join('') || '<div style="padding:30px;text-align:center;border:1px dashed #D1D5DB;border-radius:10px;color:#9CA3AF">운영 그룹이 없어.</div>'}
              </div>
            </div>
          </div>
        </div>
        <div class="tsa-modal-footer">
          <button class="tsa-btn tsa-btn-outline" onclick="closeGroupManagementDetail()">닫기</button>
          ${row.additionalGroups ? `<button class="tsa-btn tsa-btn-primary" onclick="closeGroupManagementDetail();openGroupCreateBrowserPopup(${curriculumJsLiteral(row.curriculum)},'${row.classType}',${row.levelGroup},undefined,undefined,${row.sequence ?? 'undefined'})"><i data-lucide="plus"></i> 그룹 추가</button>` : ''}
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeGroupManagementDetail() {
  document.getElementById('group-management-detail-modal')?.remove();
}

function openGroupManagementStudentEditor(groupId) {
  const modal = document.getElementById('group-assign-popup-modal');
  if (modal && modal.parentElement !== document.body) document.body.appendChild(modal);
  openGroupAssignPopup(groupId);
}

function openOperatingGroupsPopup(rowIndex) {
  const row = buildGroupManagementDisplayRows()[rowIndex];
  if (!row) return;
  const groups = getGroupManagementRowGroups(row);
  const totalCapacity = groups.reduce((sum, group) => sum + getGroupBaseCapacity(group.classType), 0);
  const totalStudents = groups.reduce((sum, group) => sum + group.studentIds.length, 0);
  const availableCount = groups.filter(group => group.studentIds.length < getGroupClassCapacity(group.classType)).length;
  const popup = window.open('', 'tsaOperatingGroups', 'width=1080,height=760,resizable=yes,scrollbars=yes');
  if (!popup) {
    showToast('팝업이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
    return;
  }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[char]));
  const rowsHtml = groups.map((group, index) => {
    const hardCap = getGroupClassCapacity(group.classType);
    const baseCap = getGroupBaseCapacity(group.classType);
    const students = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
    const remaining = Math.max(0, hardCap - students.length);
    const over = students.length > baseCap;
    return `<tr>
      <td><b>${String.fromCharCode(65 + index)}반</b></td>
      <td><b>${students.length}/${baseCap}명</b>${over ? ` <span class="over">초과 · ${esc(getGroupLiveRatioLabel(group))}</span>` : ''}</td>
      <td>${baseCap}명 (상한 ${hardCap}명)</td>
      <td class="${!remaining ? 'full' : over ? 'over' : 'ok'}">${!remaining ? '0석' : `${remaining}석`}</td>
      <td>${students.map(student => `<span class="chip">${esc(student.nick || student.name)}</span>`).join('') || '-'}</td>
      <td class="actions">
        ${remaining ? `<button class="primary" onclick="openStudentEditor(${group.id})">학생 배정</button>` : '<button disabled>정원 마감</button>'}
        <button onclick="openStudentEditor(${group.id})">학생 수정</button>
        <button onclick="openGroupEdit(${group.id})">그룹 수정</button>
      </td>
    </tr>`;
  }).join('');
  popup.document.open();
  popup.document.write(`<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>운영 그룹 전체 보기</title>
    <style>
      *{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#111827;background:#F8FAFC}
      header{position:sticky;top:0;z-index:2;padding:20px 24px;background:#fff;border-bottom:1px solid #E5E7EB}
      h1{font-size:20px;margin:0}.sub{font-size:12px;color:#6B7280;margin-top:5px}
      main{padding:18px 24px 84px}.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
      .card{padding:14px;border:1px solid #E5E7EB;border-radius:12px;background:#fff}.card span{font-size:11px;color:#6B7280}.card b{display:block;font-size:21px;margin-top:5px;color:#4F46E5}
      .toolbar{display:flex;gap:8px;align-items:center;margin:14px 0}.search{flex:1;padding:10px 12px;border:1px solid #D1D5DB;border-radius:9px}
      .filter{padding:8px 11px;border:1px solid #C7D2FE;border-radius:8px;background:#fff;color:#4F46E5;font-weight:700}
      table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden}
      th,td{padding:11px 10px;border-bottom:1px solid #E5E7EB;text-align:left;font-size:11px}th{background:#F9FAFB;color:#6B7280}
      .chip{display:inline-block;padding:3px 6px;margin:2px;border-radius:999px;background:#F3F4F6}.ok{color:#047857;font-weight:800}.over{color:#B45309;font-weight:800}.full{color:#DC2626;font-weight:800}
      button{padding:7px 9px;border:1px solid #D1D5DB;border-radius:7px;background:#fff;cursor:pointer;font-size:10px}button.primary{background:#5E5CE6;color:#fff;border-color:#5E5CE6}button:disabled{color:#9CA3AF;background:#F3F4F6}.actions{white-space:nowrap}
      footer{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:flex-end;gap:8px;padding:14px 24px;background:#fff;border-top:1px solid #E5E7EB}
    </style></head><body>
    <header><h1>운영 그룹 전체 보기</h1><div class="sub">${esc(row.subjectName)} · ${esc(getLevelGroupName(row.levelGroup))} · ${esc(getGroupSizeShortLabel(row.classType))}(${esc(row.classType)})</div></header>
    <main>
      <div class="summary"><div class="card"><span>운영 그룹</span><b>${groups.length}개</b></div><div class="card"><span>전체 학생</span><b>${totalStudents}/${totalCapacity}명</b></div><div class="card"><span>남은 자리</span><b>${Math.max(0,totalCapacity-totalStudents)}석</b></div></div>
      <div class="toolbar"><input class="search" placeholder="그룹 또는 학생 검색" oninput="filterRows(this.value)"><button class="filter">전체 ${groups.length}</button><button class="filter">배정 가능 ${availableCount}</button><button class="filter">정원 마감 ${groups.length-availableCount}</button></div>
      <table><thead><tr><th>그룹</th><th>학생</th><th>정원</th><th>남은 자리</th><th>학생 목록</th><th>관리</th></tr></thead><tbody id="groupRows">${rowsHtml}</tbody></table>
    </main>
    <footer><button onclick="window.close()">닫기</button><button class="primary" onclick="createGroup()">새 그룹 만들기</button></footer>
    <script>
      function filterRows(q){q=q.toLowerCase();document.querySelectorAll('#groupRows tr').forEach(function(row){row.style.display=row.innerText.toLowerCase().includes(q)?'':'none';});}
      function openStudentEditor(id){
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'open-student-editor',groupId:id},'*');
      }
      function openGroupEdit(id){
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'open-group-edit',groupId:id},'*');
      }
      function createGroup(){
        if(!window.opener||window.opener.closed){window.alert('기존 LMS 화면에서 다시 열어줘.');return;}
        window.opener.postMessage({channel:'tsa-group-popup',action:'open-group-create',curriculum:${curriculumJsLiteral(row.curriculum)},classType:'${row.classType}',levelGroup:${row.levelGroup},sequence:${row.sequence ?? 'null'}},'*');
      }
    <\/script>
    </body></html>`);
  popup.document.close();
  popup.focus();
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

  const cap = getGroupClassCapacity(group.classType);
  const remaining = Math.max(0, cap - group.studentIds.length);
  if (titleEl) titleEl.textContent = `${getGroupDisplayName(group)} 학생 배정`;
  if (metaEl) metaEl.textContent = `${getGroupCoursesLabel(group)} · ${getGroupLevelSetLabel(group)} · 남은 자리 ${remaining}석`;

  const candidates = getGroupCandidateStudents(group);
  if (!candidates.length) {
    wrap.innerHTML = `<div style="padding:16px;text-align:center;color:#9CA3AF;font-size:12px">동일 과목·레벨군의 미배정 학생이 없습니다.</div>`;
    return;
  }
  wrap.innerHTML = candidates.map(s => {
    const nationalityBlocked = isGroupNationalityLimitExceeded(group, s);
    const blocked = remaining <= 0 || nationalityBlocked;
    const reason = remaining <= 0 ? '정원 마감' : (nationalityBlocked ? '동일 국적 제한 초과' : '');
    const fmt = d => d ? d.replace('2026-', '26.').replace(/-/g, '.') : '-';
    const weeks = (s.startDate && s.endDate) ? Math.max(1, Math.round((new Date(s.endDate) - new Date(s.startDate)) / (7 * 86400000))) : null;
    const period = (s.startDate && s.endDate) ? `${fmt(s.startDate)} ~ ${fmt(s.endDate)}${weeks ? ` (${weeks}주)` : ''}` : '수강 기간 미등록';
    return `
      <label style="display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid #E5E7EB;border-radius:8px;margin-bottom:6px;${blocked ? 'opacity:.5' : 'cursor:pointer'}">
        <input type="checkbox" class="gap-candidate-cb" value="${s.id}" ${blocked ? 'disabled' : ''}/>
        <div style="flex:1;font-size:11.5px">
          <div style="font-weight:700;color:#111827">${s.nick} <span style="font-weight:400;color:#6B7280">(${s.name})</span></div>
          <div style="color:#6B7280;margin-top:1px">${s.course || '-'} · ${s.level || '-'} · ${s.nationality || '-'} · ${s.gender}성 · ${s.age || '-'}세</div>
          <div style="color:#9CA3AF;margin-top:1px;font-size:10.5px">📅 ${period}</div>
        </div>
        ${reason ? `<span style="font-size:10px;color:#EF4444;font-weight:700">${reason}</span>` : ''}
      </label>
    `;
  }).join('');
}

function assignFromGroupAssignPopup() {
  const group = MOCK_GROUP_CLASSES.find(g => g.id === _csSelectedGroupId);
  if (!group) { showToast('그룹을 찾을 수 없습니다.', 'warning'); return; }
  const checked = [...document.querySelectorAll('.gap-candidate-cb:checked')].map(cb => parseInt(cb.value, 10));
  if (!checked.length) { showToast('배정할 학생을 선택하세요.', 'warning'); return; }
  const cap = getGroupClassCapacity(group.classType);
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
    sum + Math.max(0, getGroupClassCapacity(group.classType) - group.studentIds.length), 0
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
    const cap = getGroupBaseCapacity(group.classType);
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
];
let MOCK_DORM_MASTER_CAPACITIES = [1, 2, 3, 4, 5, 6].map((n, i) => ({ name: `${n}인실`, order: i + 1, visible: true }));

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
