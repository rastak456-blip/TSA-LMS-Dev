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
  { id: 1, name: '한국 영어마을', country: '한국', flag: '🇰🇷', contact: '김지훈', phone: '+82-10-1234-5678', email: 'korea@talkstn.com', accountId: 'agency_head', commissionRate: 10, status: 'active', createdAt: '2025-01-15', note: '메인 파트너 / 카카오톡 채널 한국영어마을', address: '서울특별시 강남구 테헤란로 123', lat: 37.5006, lng: 127.0364 },
  { id: 7, name: '서울 유학원', country: '한국', flag: '🇰🇷', contact: '최영희', phone: '+82-10-9876-5432', email: 'seoul@talkstn.com', accountId: 'agency_seoul', commissionRate: 10, status: 'active', createdAt: '2025-08-12', note: '카카오톡 채널 서울유학원', address: '서울특별시 종로구 종로 50', lat: 37.5704, lng: 126.9831 },
  { id: 2, name: 'Tokyo Language', country: '일본', flag: '🇯🇵', contact: 'Tanaka Kenji', phone: '+81-90-1234-5678', email: 'tokyo@talkstn.com', accountId: 'agency_tokyo', commissionRate: 8, status: 'active', createdAt: '2025-03-01', note: '라인 ID @tokyo_lang', address: '東京都新宿区西新宿2-8-1', lat: 35.6896, lng: 139.6921 },
  { id: 8, name: 'Osaka Study', country: '일본', flag: '🇯🇵', contact: 'Yamamoto Yui', phone: '+81-90-9876-5432', email: 'osaka@talkstn.com', accountId: 'agency_osaka', commissionRate: 8, status: 'active', createdAt: '2025-09-05', note: '라인 ID @osaka_study', address: '大阪府大阪市北区梅田3-1-1', lat: 34.7024, lng: 135.4959 },
  { id: 3, name: 'Beijing Partner', country: '중국', flag: '🇨🇳', contact: 'Wang Fang', phone: '+86-10-1234-5678', email: 'beijing@talkstn.com', accountId: 'agency_beijing', commissionRate: 9, status: 'active', createdAt: '2025-04-10', note: '위챗 ID BJ_Partner01', address: '北京市朝阳区建国路88号', lat: 39.9087, lng: 116.4322 },
  { id: 4, name: 'VN Academy', country: '베트남', flag: '🇻🇳', contact: 'Nguyen Lan', phone: '+84-90-1234-5678', email: 'vn@talkstn.com', accountId: 'agency_vn', commissionRate: 7, status: 'inactive', createdAt: '2025-06-01', note: '일시 정지', address: 'Quận 1, Hồ Chí Minh, Việt Nam', lat: 10.7769, lng: 106.7009 },
  { id: 9, name: '직접 등록', country: '한국', flag: '🏢', contact: 'TSA 본사', phone: '-', email: '-', accountId: '-', commissionRate: 0, status: 'active', createdAt: '2025-01-01', note: '에이전시를 거치지 않고 자사가 직접 등록한 학생', address: '', lat: null, lng: null },
];
let _agencyNextId = 10;

function renderAgencyManage() {
  const tbody = document.getElementById('agency-manage-tbody');
  if (!tbody) return;

  // 같은 상위 에이전시명(name)을 공유하는 지사가 여러 개일 경우, 학생 수는
  // 첫 번째(대표) 지사에서만 집계하여 중복 카운트를 방지한다.
  const seenAgencyName = {};
  tbody.innerHTML = MOCK_AGENCIES.map(a => {
    const isPrimaryForName = !seenAgencyName[a.name];
    seenAgencyName[a.name] = true;

    const studentCount = isPrimaryForName ? MOCK_STUDENTS.filter(s => s.agency === a.name).length : null;
    const activeCount  = isPrimaryForName ? MOCK_STUDENTS.filter(s => s.agency === a.name && (s.status === 'current' || s.status === 'extended')).length : null;
    const statusBadge = a.status === 'active'
      ? `<span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;background:#D1FAE5;color:#065F46">활성</span>`
      : `<span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:10px;background:#F3F4F6;color:#6B7280">비활성</span>`;

    const displayName = a.branch ? `${a.name} <span style="font-weight:600;color:#5E5CE6">· ${a.branch}</span>` : a.name;
    const studentCell = isPrimaryForName
      ? `<div style="font-size:14px;font-weight:800;color:#111827">${studentCount}명</div><div style="font-size:10.5px;color:#10B981">재학 ${activeCount}명</div>`
      : `<div style="font-size:11px;color:#9CA3AF">본사 통합 집계</div>`;

    return `<tr>
      <td>
        <div style="font-size:13px;font-weight:700;color:#111827">${a.flag} ${displayName}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px">${a.country} · 담당: ${a.contact}</div>
        <div style="font-size:11px;color:#9CA3AF">${a.phone}</div>
      </td>
      <td style="font-size:12px;color:#374151">${a.email}</td>
      <td style="font-size:12px;font-weight:600;color:#374151">${a.accountId}</td>
      <td style="text-align:center">
        ${studentCell}
      </td>
      <td style="text-align:center;font-size:13px;font-weight:700;color:#5E5CE6">${a.commissionRate}%</td>
      <td style="text-align:center">${statusBadge}</td>
      <td>
        ${a.name === '직접 등록' ? '' : `
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
          <button class="tsa-btn tsa-btn-xs tsa-btn-primary" onclick="viewAsAgency('${a.accountId}')">포털 보기</button>
          <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openAgencyEditModal(${a.id})">수정</button>
          <button class="tsa-btn tsa-btn-xs" style="background:#FEE2E2;color:#EF4444;border:none" onclick="toggleAgencyStatus(${a.id})">${a.status === 'active' ? '비활성화' : '활성화'}</button>
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

function openAgencyRegisterModal() {
  document.getElementById('agm-modal-title').textContent = '에이전시 등록';
  document.getElementById('agm-modal-id').value = '';
  ['agm-name','agm-country','agm-contact','agm-phone','agm-email','agm-address','agm-account-id','agm-password','agm-commission','agm-note'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('agm-commission').value = '10';
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
  document.getElementById('agm-contact').value    = a.contact;
  document.getElementById('agm-phone').value      = a.phone;
  document.getElementById('agm-email').value      = a.email;
  document.getElementById('agm-address').value    = a.address || '';
  document.getElementById('agm-account-id').value = a.accountId;
  document.getElementById('agm-password').value   = '';
  document.getElementById('agm-commission').value  = a.commissionRate;
  document.getElementById('agm-note').value        = a.note || '';
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

function saveAgencyManage() {
  const name    = document.getElementById('agm-name').value.trim();
  const country = document.getElementById('agm-country').value.trim();
  const contact = document.getElementById('agm-contact').value.trim();
  const email   = document.getElementById('agm-email').value.trim();
  const accountId = document.getElementById('agm-account-id').value.trim();
  const commission = parseFloat(document.getElementById('agm-commission').value) || 0;
  if (!name || !accountId) { showToast('에이전시명과 계정 ID는 필수입니다.', 'danger'); return; }

  const id = document.getElementById('agm-modal-id').value;
  const data = {
    name, country, contact,
    phone: document.getElementById('agm-phone').value.trim(),
    email, accountId, commissionRate: commission,
    address: document.getElementById('agm-address').value.trim(),
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
  oneoneTbody.innerHTML = oneoneRooms.map(c => {
    const teacher = MOCK_TEACHERS.find(t => t.room === c.room && t.status !== 'resigned');
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
  { id: 4, roomNo: 'B-201', type: '1:4', capacity: 4, teacherNick: 'Anna',  status: 'active' },
  { id: 5, roomNo: 'C-301', type: '1:8', capacity: 8, teacherNick: 'Emily', status: 'active' },
  { id: 6, roomNo: 'A-105', type: '1:1', capacity: 1, teacherNick: 'Karen', status: 'active' },
  { id: 7, roomNo: 'B-203', type: '1:4', capacity: 4, teacherNick: 'Mark',  status: 'active' },
  { id: 8, roomNo: 'A-106', type: '1:1', capacity: 1, teacherNick: 'Lisa',  status: 'active' },
  { id: 9, roomNo: 'B-202', type: '1:4', capacity: 4, teacherNick: 'James', status: 'active' },
  { id: 10, roomNo: 'A-104', type: '1:1', capacity: 1, teacherNick: '',     status: 'unassigned' },
];
let _csRoomNextId = 11;
let _csRoomTypeFilter = '전체';
let _csAssignTypeFilter = '전체';

function setCsRoomTypeFilter(type, btn) {
  _csRoomTypeFilter = type;
  document.querySelectorAll('[id^="cs-rtype-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderCsRooms();
}

function setCsAssignTypeFilter(type, btn) {
  _csAssignTypeFilter = type;
  btn.parentNode.querySelectorAll('button').forEach(b => {
    b.className = 'tsa-btn tsa-btn-xs tsa-btn-outline';
  });
  btn.className = 'tsa-btn tsa-btn-xs tsa-btn-primary';
  renderCsAssignGrid();
}

// 주간 수업 세션: { id, roomId, day, periods:[], studentIds:[], course, level, weekOf }
let MOCK_CLASS_SESSIONS = [
  { id: 1, roomId: 1, day: '월', periods: [1, 3], studentIds: [1], course: 'IELTS 전문 코스', level: 'Band 5.5', weekOf: '2026-06-22' },
  { id: 2, roomId: 1, day: '월', periods: [5], studentIds: [5], course: 'IELTS 전문 코스', level: 'Band 5.5', weekOf: '2026-06-22' },
  { id: 3, roomId: 1, day: '화', periods: [1, 3], studentIds: [1], course: 'IELTS 전문 코스', level: 'Band 5.5', weekOf: '2026-06-22' },
  { id: 4, roomId: 1, day: '수', periods: [5], studentIds: [5], course: 'IELTS 전문 코스', level: 'Band 5.5', weekOf: '2026-06-22' },
  
  { id: 5, roomId: 2, day: '월', periods: [3, 4], studentIds: [4], course: '일반 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 6, roomId: 2, day: '화', periods: [3], studentIds: [4], course: '일반 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 7, roomId: 2, day: '수', periods: [3, 4], studentIds: [2], course: '일반 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 8, roomId: 3, day: '월', periods: [1, 2], studentIds: [6], course: '비즈니스 영어', level: 'Advanced', weekOf: '2026-06-22' },
  { id: 9, roomId: 3, day: '수', periods: [1], studentIds: [6], course: '비즈니스 영어', level: 'Advanced', weekOf: '2026-06-22' },
  { id: 10, roomId: 3, day: '금', periods: [3], studentIds: [4], course: '일반 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 11, roomId: 4, day: '월', periods: [5, 6], studentIds: [1, 2, 4], course: '일반 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 12, roomId: 4, day: '수', periods: [5, 6], studentIds: [1, 2, 4], course: '일반 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 13, roomId: 5, day: '월', periods: [2], studentIds: [14, 15, 16], course: '주니어 패키지', level: 'Beginner', weekOf: '2026-06-22' },
  { id: 14, roomId: 5, day: '화', periods: [2], studentIds: [14, 15, 16], course: '주니어 패키지', level: 'Beginner', weekOf: '2026-06-22' },
  { id: 15, roomId: 5, day: '수', periods: [2], studentIds: [14, 15, 16], course: '주니어 패키지', level: 'Beginner', weekOf: '2026-06-22' },
  
  { id: 16, roomId: 6, day: '월', periods: [3, 4], studentIds: [12], course: '가디언 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  { id: 17, roomId: 6, day: '목', periods: [3, 4], studentIds: [12], course: '가디언 코스', level: 'Intermediate', weekOf: '2026-06-22' },
  
  { id: 18, roomId: 7, day: '화', periods: [4, 5], studentIds: [5, 10], course: 'IELTS 전문 코스', level: 'Band 6.5', weekOf: '2026-06-22' },
  { id: 19, roomId: 7, day: '목', periods: [4, 5], studentIds: [5, 10], course: 'IELTS 전문 코스', level: 'Band 6.5', weekOf: '2026-06-22' },
  
  { id: 20, roomId: 8, day: '월', periods: [2, 3], studentIds: [13], course: 'IELTS 전문 코스', level: 'Band 5.0', weekOf: '2026-06-22' },
  { id: 21, roomId: 8, day: '수', periods: [2, 3], studentIds: [13], course: 'IELTS 전문 코스', level: 'Band 5.0', weekOf: '2026-06-22' },
];
let _csSessionNextId = 22;
let _csCurrentWeek = '2026-06-22';
let _csCurrentDay  = '월';
let _csAssignTarget = null; // { roomId }
let _csViewMode = 'room';
let _csFilterSelect = 'all';
let _csFilterSearch = '';

const CS_PERIODS = { 1:'08:00',2:'09:00',3:'10:00',4:'11:00',5:'12:30',6:'13:30',7:'14:30',8:'15:30' };
const CS_TYPE_COLOR = { '1:1':'#EEF2FF|#3730A3', '1:4':'#FEF3C7|#92400E', '1:8':'#D1FAE5|#065F46' };

function initClassSchedule() {
  _csCurrentWeek = '2026-06-22';
  _csCurrentDay  = '월';
  switchClassScheduleTab('rooms');
}

function switchClassScheduleTab(tab) {
  ['rooms','assign','view'].forEach(t => {
    document.getElementById('cs-panel-' + t).style.display = t === tab ? '' : 'none';
    const btn = document.getElementById('cs-tab-' + t);
    if (btn) { btn.style.color = t===tab?'#5E5CE6':'#6B7280'; btn.style.borderBottomColor = t===tab?'#5E5CE6':'transparent'; }
  });
  if (tab === 'rooms')  renderCsRooms();
  if (tab === 'assign') renderCsAssignGrid();
  if (tab === 'view')   renderCsWeekView();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function renderCsRooms() {
  // KPI
  const kpi = document.getElementById('cs-type-kpi');
  if (kpi) {
    const types = ['1:1','1:4','1:8'];
    const colors = {'1:1':'#5E5CE6','1:4':'#B45309','1:8':'#065F46'};
    kpi.innerHTML = types.map(t => {
      const cnt = MOCK_CLASS_ROOMS.filter(r => r.type === t && r.roomNo).length;
      return `<div class="tsa-card" style="padding:16px">
        <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px">${t} 강의실</div>
        <div style="font-size:28px;font-weight:700;color:${colors[t]}">${cnt}</div>
        <div style="font-size:11px;color:#6B7280;margin-top:2px">개 호실 운영 중</div>
      </div>`;
    }).join('');
  }
  // 유형별 섹션 테이블
  const tbody = document.getElementById('cs-rooms-tbody');
  if (!tbody) return;
  const typeStyle = t => { const [bg,c] = (CS_TYPE_COLOR[t]||'#F3F4F6|#6B7280').split('|'); return `background:${bg};color:${c}`; };
  const typeLabel = { '1:1':'1:1 강의실', '1:4':'1:4 그룹 강의실', '1:8':'1:8 그룹 강의실', '기타':'기타' };
  const typeAccent = { '1:1':'#5E5CE6', '1:4':'#B45309', '1:8':'#065F46', '기타':'#6B7280' };

  const renderRow = r => {
    const teacher = MOCK_TEACHERS.find(t => t.nick === r.teacherNick);
    const statusBg = r.roomNo ? (r.teacherNick ? '#D1FAE5' : '#FEF3C7') : '#F3F4F6';
    const statusColor = r.roomNo ? (r.teacherNick ? '#065F46' : '#92400E') : '#6B7280';
    const statusLabel = r.roomNo ? (r.teacherNick ? '운영 중' : '강사 미배정') : '호실 미정';
    return `<tr>
      <td style="font-weight:700">${r.roomNo || '<span style="color:#9CA3AF;font-style:italic">미배정</span>'}</td>
      <td style="font-size:12px;color:#6B7280">최대 ${r.capacity}명</td>
      <td>${teacher ? `<span style="font-size:12px;font-weight:600">${teacher.nick}</span> <span style="font-size:11px;color:#6B7280">${teacher.name}</span>` : '<span style="font-size:12px;color:#9CA3AF">미배정</span>'}</td>
      <td><span style="font-size:11px;padding:2px 10px;border-radius:10px;font-weight:600;background:${statusBg};color:${statusColor}">${statusLabel}</span></td>
      <td>
        <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openCsEditRoomModal(${r.id})">수정</button>
        ${!r.roomNo ? `<button class="tsa-btn tsa-btn-xs" style="background:#EEF2FF;color:#5E5CE6;border:none;margin-left:4px" onclick="openCsAddRoomModal(${r.id})">호실 배정</button>` : ''}
      </td>
    </tr>`;
  };

  const types = ['1:1','1:4','1:8','기타'];
  tbody.innerHTML = types.map(type => {
    if (_csRoomTypeFilter !== '전체' && _csRoomTypeFilter !== type) return '';
    const rooms = MOCK_CLASS_ROOMS.filter(r => r.type === type);
    if (rooms.length === 0) return '';
    return `<tr><td colspan="5" style="padding:8px 14px 4px;background:#F9FAFB;border-top:1.5px solid ${typeAccent[type]}30">
      <span style="font-size:12px;font-weight:700;color:${typeAccent[type]}">${typeLabel[type]}</span>
      <span style="font-size:11px;color:#9CA3AF;margin-left:8px">${rooms.filter(r=>r.roomNo).length}개 운영</span>
    </td></tr>` + rooms.map(renderRow).join('');
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
  const qtyInput = document.getElementById('cs-room-qty');
  if (qtyInput) qtyInput.value = '1';

  const sel = document.getElementById('cs-room-teacher');
  sel.innerHTML = '<option value="">— 미배정 —</option>' +
    MOCK_TEACHERS.filter(t => t.status !== 'resigned').map(t =>
      `<option value="${t.nick}" ${r?.teacherNick === t.nick ? 'selected':''}>${t.nick} (${t.name})</option>`).join('');
  
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
  const teacherNick = document.getElementById('cs-room-teacher').value;
  
  if (id) {
    const idx = MOCK_CLASS_ROOMS.findIndex(r => r.id === parseInt(id));
    if (idx >= 0) {
      Object.assign(MOCK_CLASS_ROOMS[idx], {
        roomNo, type, capacity, teacherNick, status: teacherNick ? 'active' : 'unassigned'
      });
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
      generatedRoomNos.forEach(no => {
        MOCK_CLASS_ROOMS.push({
          id: _csRoomNextId++,
          roomNo: no,
          type,
          capacity,
          teacherNick,
          status: teacherNick ? 'active' : 'unassigned'
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
        status: teacherNick ? 'active' : 'unassigned'
      });
      showToast(`✓ ${roomNo} 호실이 추가되었습니다.`, 'success');
    }
  }
  closeCsAddRoomModal();
  renderCsRooms();
}

function csWeekLabel(w) {
  const d = new Date(w);
  const end = new Date(d); end.setDate(d.getDate() + 4);
  const fmt = x => `${x.getMonth()+1}/${x.getDate()}`;
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 (${fmt(d)} ~ ${fmt(end)})`;
}

function shiftCsWeek(delta) {
  const d = new Date(_csCurrentWeek);
  d.setDate(d.getDate() + delta * 7);
  _csCurrentWeek = d.toISOString().slice(0,10);
  ['cs-week-label','cs-week-label-2'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=csWeekLabel(_csCurrentWeek); });
  const active = document.querySelector('.cs-panel-active');
  if (document.getElementById('cs-panel-assign').style.display !== 'none') renderCsAssignGrid();
  if (document.getElementById('cs-panel-view').style.display !== 'none') renderCsWeekView();
}

function selectCsDay(day, btn) {
  _csCurrentDay = day;
  document.querySelectorAll('.cs-day-btn').forEach(b => b.classList.remove('cs-day-active'));
  btn.classList.add('cs-day-active');
  renderCsAssignGrid();
}

function renderCsAssignGrid() {
  const el = document.getElementById('cs-week-label');
  if (el) el.textContent = csWeekLabel(_csCurrentWeek);
  const grid = document.getElementById('cs-assign-grid');
  if (!grid) return;

  let activeRooms = MOCK_CLASS_ROOMS.filter(r => r.roomNo);
  if (_csAssignTypeFilter !== '전체') {
    activeRooms = activeRooms.filter(r => r.type === _csAssignTypeFilter);
  }

  if (activeRooms.length === 0) {
    grid.innerHTML = '<div style="color:#9CA3AF;font-size:13px;padding:20px;text-align:center">해당 유형의 강의실이 없습니다.</div>';
    return;
  }
  const typeStyle = t => { const [bg,c] = (CS_TYPE_COLOR[t]||'#F3F4F6|#6B7280').split('|'); return `background:${bg};color:${c}`; };

  grid.innerHTML = activeRooms.map(room => {
    const teacher = MOCK_TEACHERS.find(t => t.nick === room.teacherNick);
    const avatarBg = teacher ? '#EEF2FF' : '#F3F4F6';
    const avatarColor = teacher ? '#5E5CE6' : '#9CA3AF';
    const sessions = MOCK_CLASS_SESSIONS.filter(s => s.roomId === room.id && s.day === _csCurrentDay && s.weekOf === _csCurrentWeek);

    // 교시별 배정 현황
    const periodMap = {};
    sessions.forEach(s => s.periods.forEach(p => { periodMap[p] = s; }));

    const slots = Object.keys(CS_PERIODS).map(p => {
      const period = parseInt(p);
      const session = periodMap[period];
      if (session) {
        const students = session.studentIds.map(sid => {
          const st = MOCK_STUDENTS.find(x => x.id === sid);
          return st ? `<span class="cs-chip">${st.nick}</span>` : '';
        }).join('');
        const emptySlots = room.capacity - session.studentIds.length;
        const emptyChips = emptySlots > 0 ? `<span class="cs-chip-empty">+${emptySlots} 자리</span>` : '';
        return `<div class="cs-slot cs-slot-occ">
          <div class="cs-slot-p">${period}교시</div>
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:3px">${students}${emptyChips}</div>
          <button onclick="openCsAssignModal(${room.id},${period})" style="font-size:10px;padding:2px 6px;border:none;background:#C7D2FE;color:#3730A3;border-radius:4px;cursor:pointer">+추가</button>
          <button onclick="removeCsSession(${session.id})" style="font-size:10px;padding:2px 6px;border:none;background:#FEE2E2;color:#991B1B;border-radius:4px;cursor:pointer">해제</button>
        </div>`;
      }
      return `<div class="cs-slot">
        <div class="cs-slot-p">${period}교시</div>
        <button class="cs-slot-add" onclick="openCsAssignModal(${room.id},${period})">+ 배정하기</button>
      </div>`;
    }).join('');

    return `<div class="cs-room-card">
      <div class="cs-room-card-header">
        <div>
          <span style="font-size:13px;font-weight:700;color:#111827">${room.roomNo}</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:8px;margin-left:6px;${typeStyle(room.type)}">${room.type}</span>
        </div>
        <button onclick="openCsBulkAssignModal(${room.id})" style="font-size:11px;padding:4px 10px;border:0.5px solid #5E5CE6;border-radius:6px;background:#EEF2FF;color:#5E5CE6;cursor:pointer;white-space:nowrap">일괄 배정</button>
      </div>
      <div style="padding:8px 14px;border-bottom:0.5px solid #E5E7EB;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div style="width:22px;height:22px;border-radius:50%;background:${avatarBg};color:${avatarColor};font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${teacher ? teacher.nick.charAt(0) : '?'}
        </div>
        <div style="font-size:12px;color:#374151;font-weight:600">${teacher ? teacher.nick : '강사 미배정'}</div>
        ${teacher && (teacher.preferredCourses||[]).length > 0
          ? (teacher.preferredCourses||[]).map(tag => `<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#D1FAE5;color:#065F46;font-weight:600">${tag}</span>`).join('')
          : ''}
      </div>
      <div style="padding:10px 14px">${slots}</div>
    </div>`;
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function openCsBulkAssignModal(roomId) {
  const room = MOCK_CLASS_ROOMS.find(r => r.id === roomId);
  if (!room) return;
  _csAssignTarget = { roomId, period: null };
  document.getElementById('cs-assign-modal-title').textContent = `${room.roomNo} · 일괄 배정`;
  document.getElementById('cs-assign-info').innerHTML = `<b>${room.roomNo}</b> &nbsp;|&nbsp; ${room.type} · 최대 ${room.capacity}명 &nbsp;<span style="color:#6B7280;font-size:12px">교시를 복수 선택해 한 번에 배정합니다</span>`;

  // 모든 교시 체크박스 (미배정 교시만 체크 활성화)
  const sessions = MOCK_CLASS_SESSIONS.filter(s => s.roomId === roomId && s.day === _csCurrentDay && s.weekOf === _csCurrentWeek);
  const occupiedPeriods = new Set(sessions.flatMap(s => s.periods));
  const pWrap = document.getElementById('cs-period-checkboxes');
  pWrap.innerHTML = Object.keys(CS_PERIODS).map(p => {
    const isOccupied = occupiedPeriods.has(parseInt(p));
    return `<label style="display:flex;align-items:center;gap:4px;cursor:${isOccupied?'not-allowed':'pointer'};padding:4px 10px;border-radius:6px;border:0.5px solid ${isOccupied?'#E5E7EB':'#C7D2FE'};font-size:12px;background:${isOccupied?'#F3F4F6':'#fff'};opacity:${isOccupied?'0.5':'1'}">
      <input type="checkbox" name="cs-period" value="${p}" ${isOccupied?'disabled':''} style="accent-color:#5E5CE6"/> ${p}교시
      ${isOccupied ? '<span style="font-size:10px;color:#9CA3AF">배정됨</span>' : ''}
    </label>`;
  }).join('');

  // 학생 목록
  const listEl = document.getElementById('cs-student-list');
  const eligible = MOCK_STUDENTS.filter(s => s.remittanceStatus === 'paid' && (s.status === 'current' || s.status === 'waiting'));
  listEl.innerHTML = eligible.length === 0
    ? '<div style="color:#9CA3AF;font-size:12px">배정 가능한 학생이 없습니다.</div>'
    : eligible.map(s => `<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:0.5px solid #E5E7EB;border-radius:8px;cursor:pointer">
        <input type="${room.capacity === 1 ? 'radio' : 'checkbox'}" name="cs-student" value="${s.id}" style="accent-color:#5E5CE6"/>
        <div style="flex:1">
          <div style="font-size:12.5px;font-weight:600">${s.nick} <span style="font-size:11px;color:#6B7280">${s.name}</span></div>
          <div style="font-size:11px;color:#9CA3AF">${s.flag||''} ${s.nationality} · ${s.course}</div>
        </div>
      </label>`).join('');

  document.getElementById('cs-assign-modal').style.display = 'block';
  document.getElementById('cs-assign-backdrop').style.display = 'block';
}

function openCsAssignModal(roomId, period) {
  const room = MOCK_CLASS_ROOMS.find(r => r.id === roomId);
  if (!room) return;
  _csAssignTarget = { roomId, period };
  document.getElementById('cs-assign-modal-title').textContent = `${room.roomNo} · ${period}교시 배정`;
  document.getElementById('cs-assign-info').innerHTML = `<b>${room.roomNo}</b> · ${period}교시 (${CS_PERIODS[period]}) &nbsp;|&nbsp; ${room.type} · 최대 ${room.capacity}명`;

  // 교시 체크박스
  const pWrap = document.getElementById('cs-period-checkboxes');
  pWrap.innerHTML = Object.keys(CS_PERIODS).map(p => {
    const checked = parseInt(p) === period ? 'checked' : '';
    return `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 10px;border-radius:6px;border:0.5px solid #E5E7EB;font-size:12px">
      <input type="checkbox" name="cs-period" value="${p}" ${checked} style="accent-color:#5E5CE6"/> ${p}교시
    </label>`;
  }).join('');

  // 학생 목록 (완납 학생 중 현재 수업 없는 학생)
  const listEl = document.getElementById('cs-student-list');
  const eligible = MOCK_STUDENTS.filter(s => s.remittanceStatus === 'paid' && (s.status === 'current' || s.status === 'waiting'));
  listEl.innerHTML = eligible.length === 0
    ? '<div style="color:#9CA3AF;font-size:12px">배정 가능한 학생이 없습니다.</div>'
    : eligible.map(s => `<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:0.5px solid #E5E7EB;border-radius:8px;cursor:pointer">
        <input type="${room.capacity === 1 ? 'radio' : 'checkbox'}" name="cs-student" value="${s.id}" style="accent-color:#5E5CE6"/>
        <div style="flex:1">
          <div style="font-size:12.5px;font-weight:600">${s.nick} <span style="font-size:11px;color:#6B7280">${s.name}</span></div>
          <div style="font-size:11px;color:#9CA3AF">${s.flag||''} ${s.nationality} · ${s.course}</div>
        </div>
      </label>`).join('');

  document.getElementById('cs-assign-modal').style.display = 'block';
  document.getElementById('cs-assign-backdrop').style.display = 'block';
}

function closeCsAssignModal() {
  document.getElementById('cs-assign-modal').style.display = 'none';
  document.getElementById('cs-assign-backdrop').style.display = 'none';
  _csAssignTarget = null;
}

function confirmCsAssign() {
  if (!_csAssignTarget) return;
  const { roomId } = _csAssignTarget;
  const room = MOCK_CLASS_ROOMS.find(r => r.id === roomId);
  const selectedPeriods = [...document.querySelectorAll('input[name="cs-period"]:checked')].map(cb => parseInt(cb.value));
  const selectedStudents = [...document.querySelectorAll('input[name="cs-student"]:checked')].map(cb => parseInt(cb.value));
  if (selectedPeriods.length === 0) { showToast('교시를 선택하세요.', 'warning'); return; }
  if (selectedStudents.length === 0) { showToast('학생을 선택하세요.', 'warning'); return; }
  if (selectedStudents.length > room.capacity) { showToast(`정원 초과입니다. 최대 ${room.capacity}명.`, 'danger'); return; }

  // 중복 배정 검사
  for (const sid of selectedStudents) {
    for (const p of selectedPeriods) {
      const conflict = MOCK_CLASS_SESSIONS.find(s => s.day === _csCurrentDay && s.weekOf === _csCurrentWeek && s.periods.includes(p) && s.studentIds.includes(sid) && s.roomId !== roomId);
      if (conflict) {
        const st = MOCK_STUDENTS.find(x => x.id === sid);
        showToast(`⚠ ${st?.nick} 학생이 ${p}교시에 이미 다른 수업에 배정되어 있습니다.`, 'danger');
        return;
      }
    }
  }

  MOCK_CLASS_SESSIONS.push({
    id: _csSessionNextId++, roomId,
    day: _csCurrentDay, periods: selectedPeriods,
    studentIds: selectedStudents,
    course: document.getElementById('cs-assign-course').value,
    level: document.getElementById('cs-assign-level').value,
    weekOf: _csCurrentWeek
  });
  showToast('✓ 수업이 배정되었습니다.', 'success');
  closeCsAssignModal();
  renderCsAssignGrid();
}

function removeCsSession(id) {
  if (!confirm('이 수업 배정을 해제하시겠습니까?')) return;
  MOCK_CLASS_SESSIONS = MOCK_CLASS_SESSIONS.filter(s => s.id !== id);
  showToast('배정이 해제되었습니다.', 'success');
  renderCsAssignGrid();
}

function setCsViewMode(mode, btn) {
  _csViewMode = mode;
  _csFilterSelect = 'all';
  _csFilterSearch = '';
  document.querySelectorAll('#cs-panel-view .tsa-btn').forEach(b => { b.className = 'tsa-btn tsa-btn-xs tsa-btn-outline'; });
  btn.className = 'tsa-btn tsa-btn-xs tsa-btn-primary';
  renderCsWeekView();
}

function renderCsWeekView() {
  const el2 = document.getElementById('cs-week-label-2');
  if (el2) el2.textContent = csWeekLabel(_csCurrentWeek);

  // Render Filter Bar
  const filterBar = document.getElementById('cs-view-filter-bar');
  if (filterBar) {
    let selectHtml = '';
    let label = '';
    
    if (_csViewMode === 'room') {
      label = '강의실 필터';
      const rooms = MOCK_CLASS_ROOMS.filter(r => r.roomNo);
      selectHtml = `<select class="tsa-input" style="width:160px;height:32px;font-size:12px;padding:4px 8px;border-radius:6px" onchange="_csFilterSelect=this.value; renderCsWeekView();">
        <option value="all" ${_csFilterSelect === 'all' ? 'selected' : ''}>전체 강의실</option>
        ${rooms.map(r => `<option value="${r.id}" ${_csFilterSelect == r.id ? 'selected' : ''}>${r.roomNo} (${r.type})</option>`).join('')}
      </select>`;
    } else if (_csViewMode === 'teacher') {
      label = '강사 필터';
      const teachers = MOCK_TEACHERS.filter(t => t.status !== 'resigned');
      selectHtml = `<select class="tsa-input" style="width:160px;height:32px;font-size:12px;padding:4px 8px;border-radius:6px" onchange="_csFilterSelect=this.value; renderCsWeekView();">
        <option value="all" ${_csFilterSelect === 'all' ? 'selected' : ''}>전체 강사</option>
        ${teachers.map(t => `<option value="${t.nick}" ${_csFilterSelect === t.nick ? 'selected' : ''}>${t.nick} (${t.name})</option>`).join('')}
      </select>`;
    } else if (_csViewMode === 'student') {
      label = '학생 필터';
      const students = MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'waiting');
      selectHtml = `<select class="tsa-input" style="width:160px;height:32px;font-size:12px;padding:4px 8px;border-radius:6px" onchange="_csFilterSelect=this.value; renderCsWeekView();">
        <option value="all" ${_csFilterSelect === 'all' ? 'selected' : ''}>전체 학생</option>
        ${students.map(s => `<option value="${s.id}" ${_csFilterSelect == s.id ? 'selected' : ''}>${s.nick} (${s.name})</option>`).join('')}
      </select>`;
    }

    const placeholderText = _csViewMode === 'room' ? '강의실/학생 검색...' : (_csViewMode === 'teacher' ? '강사/학생/강의실 검색...' : '학생/강사/강의실 검색...');

    filterBar.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#F8F9FC;padding:8px 12px;border-radius:8px;border:1px solid #E5E7EB">
        <span style="font-size:12px;font-weight:700;color:#4B5563;display:flex;align-items:center;gap:4px">
          <i data-lucide="filter" style="width:14px;height:14px;color:#5E5CE6"></i> ${label}
        </span>
        ${selectHtml}
        <span style="color:#D1D5DB">|</span>
        <div style="position:relative;display:flex;align-items:center">
          <i data-lucide="search" style="position:absolute;left:8px;width:12px;height:12px;color:#9CA3AF"></i>
          <input type="text" placeholder="${placeholderText}" class="tsa-input" value="${_csFilterSearch}" oninput="_csFilterSearch=this.value.trim(); renderCsWeekView();" style="width:200px;height:32px;font-size:12px;padding:4px 8px;padding-left:26px;padding-right:24px;border-radius:6px" />
          ${_csFilterSearch ? `<button onclick="_csFilterSearch=''; renderCsWeekView();" style="position:absolute;right:8px;background:none;border:none;color:#9CA3AF;cursor:pointer;font-size:12px">✕</button>` : ''}
        </div>
        ${(_csFilterSelect !== 'all' || _csFilterSearch) ? `
          <button onclick="_csFilterSelect='all'; _csFilterSearch=''; renderCsWeekView();" class="tsa-btn tsa-btn-xs" style="background:#F3F4F6;color:#4B5563;border:1px solid #D1D5DB;height:32px;padding:0 10px;display:flex;align-items:center;gap:4px;border-radius:6px">
            <i data-lucide="rotate-ccw" style="width:12px;height:12px"></i> 필터 초기화
          </button>
        ` : ''}
      </div>
    `;
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }

  const wrap = document.getElementById('cs-view-table-wrap');
  if (!wrap) return;
  const days = ['월','화','수','목','금'];
  const periods = Object.keys(CS_PERIODS);

  const typeStyle = t => { const [bg,c] = (CS_TYPE_COLOR[t]||'#F3F4F6|#6B7280').split('|'); return `background:${bg};color:${c}`; };

  let html = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:#F9FAFB">
      <th style="padding:8px 12px;text-align:left;border-bottom:0.5px solid #E5E7EB;color:#6B7280;font-weight:600;white-space:nowrap;width:100px">교시</th>
      ${days.map(d=>`<th style="padding:8px 12px;text-align:center;border-bottom:0.5px solid #E5E7EB;color:#6B7280;font-weight:600">${d}요일</th>`).join('')}
    </tr></thead><tbody>`;

  periods.forEach(p => {
    html += `<tr style="border-bottom:0.5px solid #F3F4F6">
      <td style="padding:8px 12px;color:#4B5563;white-space:nowrap;font-size:11.5px;border-right:1px solid #E5E7EB;vertical-align:middle;text-align:center">
        <strong style="color:#111827">${p}교시</strong><br><span style="font-size:9.5px;color:#9CA3AF">${CS_PERIODS[p]}</span>
      </td>`;
    days.forEach(day => {
      let sessions = MOCK_CLASS_SESSIONS.filter(s => s.weekOf === _csCurrentWeek && s.day === day && s.periods.includes(parseInt(p)));
      
      // Apply filters
      if (_csViewMode === 'room') {
        if (_csFilterSelect !== 'all') {
          sessions = sessions.filter(s => s.roomId == _csFilterSelect);
        }
        if (_csFilterSearch) {
          sessions = sessions.filter(s => {
            const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
            const roomMatch = room?.roomNo && room.roomNo.toLowerCase().includes(_csFilterSearch.toLowerCase());
            const studentMatch = s.studentIds.some(id => {
              const st = MOCK_STUDENTS.find(x => x.id === id);
              return st && (st.nick.toLowerCase().includes(_csFilterSearch.toLowerCase()) || st.name.toLowerCase().includes(_csFilterSearch.toLowerCase()));
            });
            return roomMatch || studentMatch;
          });
        }
      } else if (_csViewMode === 'teacher') {
        if (_csFilterSelect !== 'all') {
          sessions = sessions.filter(s => {
            const r = MOCK_CLASS_ROOMS.find(x => x.id === s.roomId);
            return r?.teacherNick === _csFilterSelect;
          });
        }
        if (_csFilterSearch) {
          sessions = sessions.filter(s => {
            const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
            const roomMatch = room?.roomNo && room.roomNo.toLowerCase().includes(_csFilterSearch.toLowerCase());
            const teacherMatch = room?.teacherNick && (
              room.teacherNick.toLowerCase().includes(_csFilterSearch.toLowerCase()) ||
              (MOCK_TEACHERS.find(t => t.nick === room.teacherNick)?.name || '').toLowerCase().includes(_csFilterSearch.toLowerCase())
            );
            const studentMatch = s.studentIds.some(id => {
              const st = MOCK_STUDENTS.find(x => x.id === id);
              return st && (st.nick.toLowerCase().includes(_csFilterSearch.toLowerCase()) || st.name.toLowerCase().includes(_csFilterSearch.toLowerCase()));
            });
            return roomMatch || teacherMatch || studentMatch;
          });
        }
      } else if (_csViewMode === 'student') {
        if (_csFilterSelect !== 'all') {
          sessions = sessions.filter(s => s.studentIds.includes(parseInt(_csFilterSelect)));
        }
        if (_csFilterSearch) {
          sessions = sessions.filter(s => {
            const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
            const roomMatch = room?.roomNo && room.roomNo.toLowerCase().includes(_csFilterSearch.toLowerCase());
            const teacherMatch = room?.teacherNick && (
              room.teacherNick.toLowerCase().includes(_csFilterSearch.toLowerCase()) ||
              (MOCK_TEACHERS.find(t => t.nick === room.teacherNick)?.name || '').toLowerCase().includes(_csFilterSearch.toLowerCase())
            );
            const studentMatch = s.studentIds.some(id => {
              const st = MOCK_STUDENTS.find(x => x.id === id);
              return st && (st.nick.toLowerCase().includes(_csFilterSearch.toLowerCase()) || st.name.toLowerCase().includes(_csFilterSearch.toLowerCase()));
            });
            return roomMatch || teacherMatch || studentMatch;
          });
        }
      }

      if (sessions.length === 0) {
        html += `<td style="padding:12px 8px;text-align:center;color:#D1D5DB;font-size:11px">-</td>`;
      } else {
        html += `<td style="padding:6px 8px;vertical-align:top">`;
        sessions.forEach(s => {
          const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
          const teacherName = room?.teacherNick ? `${room.teacherNick} (강사)` : '강사 미배정';
          const names = s.studentIds.map(id => MOCK_STUDENTS.find(x=>x.id===id)?.nick||'').filter(Boolean).join(', ');
          
          html += `<div style="border-radius:6px;padding:6px 8px;margin-bottom:4px;border-left:3px solid ${room?.type === '1:1' ? '#5E5CE6' : (room?.type === '1:4' ? '#B45309' : '#065F46')}; ${typeStyle(room?.type||'1:1')}">
            <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:11px">
              <span>${room?.roomNo||'-'} (${room?.type||''})</span>
              <span style="font-size:9.5px;font-weight:normal;opacity:0.8">${teacherName}</span>
            </div>
            <div style="font-size:10.5px;font-weight:600;margin-top:2px">${names}</div>
            <div style="font-size:9px;opacity:0.75;margin-top:1px">${s.course || ''} [${s.level || ''}]</div>
          </div>`;
        });
        html += `</td>`;
      }
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  wrap.innerHTML = html;
}
// ── 수업 배정 관리 끝 ──────────────────────────────────

// ── 기숙사 ERP (신규) ─────────────────────────────────
function openDormTemplateModal() {}
function openDormRoomModal() {}

function saveDormRoomIndividual() {
  const roomNo    = document.getElementById('tpl-room-no')?.value.trim();
  const accom     = document.getElementById('tpl-accom')?.value;
  const capacity  = parseInt(document.getElementById('tpl-capacity')?.value);
  const condition = document.getElementById('tpl-condition')?.value;

  if (!roomNo) { showToast('호실 번호를 입력하세요.', 'danger'); return; }

  // 중복 체크
  const dup = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (dup) { showToast(`이미 등록된 호실 번호입니다. (${roomNo}호)`, 'warning'); return; }

  const typeStr = `${capacity}인실 (${condition})`;
  MOCK_DORM_ROOMS.push({
    roomNo: roomNo,
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

  // 폼 초기화
  document.getElementById('tpl-room-no').value = '';

  // 템플릿 정보와 동기화
  if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();

  showToast(`✓ ${roomNo}호가 성공적으로 등록되었습니다.`, 'success');
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

  if (!confirm(`호실 [${room.roomNo}호]를 삭제하시겠습니까?`)) return;

  MOCK_DORM_ROOMS.splice(idx, 1);
  if (typeof syncDormTemplatesFromRooms === 'function') syncDormTemplatesFromRooms();
  showToast('호실이 삭제되었습니다.', 'success');
  renderAdminDormTemplates();
  if (typeof renderDormErpGrid === 'function') renderDormErpGrid();
}

function renderAdminDormTemplates() {
  const tbody = document.getElementById('admin-dorm-template-tbody');
  if (!tbody) return;

  tbody.innerHTML = MOCK_DORM_ROOMS.filter(r => r.roomNo).map((r, idx) => {
    // MOCK_DORM_ROOMS에서 roomNo가 있는 방들의 진짜 인덱스를 찾아 삭제/수정 버튼에 매핑
    const originalIdx = MOCK_DORM_ROOMS.indexOf(r);
    const conditionMatch = r.type ? r.type.match(/\(([^)]+)\)/) : null;
    const condition = conditionMatch ? conditionMatch[1] : '스탠다드';
    const capacity = r.capacity || (r.beds ? r.beds.length : 1);

    const accomBadge = r.accomType === 'IT Park 콘도'
      ? `<span style="background:#FEF3C7;color:#D97706;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600">IT Park 콘도</span>`
      : `<span style="background:#EEF2FF;color:#5E5CE6;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600">가든 호텔</span>`;

    return `
      <tr>
        <td><strong>${r.roomNo}호</strong></td>
        <td>${accomBadge}</td>
        <td>${capacity}인실</td>
        <td>${condition}</td>
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
  document.getElementById('dorm-erp-panel-settings').style.display = tab === 'settings' ? '' : 'none';
  ['assign','settings'].forEach(t => {
    const btn = document.getElementById(`dorm-erp-tab-${t}`);
    if (!btn) return;
    btn.style.color = t === tab ? '#5E5CE6' : '#6B7280';
    btn.style.borderBottomColor = t === tab ? '#5E5CE6' : 'transparent';
  });
  if (tab === 'settings') {
    renderAdminDormTemplates();
    renderAdminDormRoomsTable();
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }
}
let _erpGenderFilter = '전체';
let _erpAccomFilter  = '전체';
let _erpCapFilter    = '전체';
let _erpAssignTarget = null; // { roomNo, bedId }

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

  let rooms = [...MOCK_DORM_ROOMS];
  if (_erpAccomFilter !== '전체') rooms = rooms.filter(r => r.accomType === _erpAccomFilter);
  if (_erpCapFilter   !== '전체') rooms = rooms.filter(r => r.capacity === parseInt(_erpCapFilter));
  if (_erpGenderFilter !== '전체') rooms = rooms.filter(r => r.genderRestriction === '무관' || r.genderRestriction === _erpGenderFilter);

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
            <div style="font-size:10px;color:#9CA3AF">~ ${b.end || '-'}</div>
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
  listEl.innerHTML = list.map(s => `
    <label style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1.5px solid #E5E7EB;border-radius:8px;cursor:pointer;transition:border-color 0.15s" onmouseover="this.style.borderColor='#5E5CE6'" onmouseout="this.style.borderColor='#E5E7EB'">
      <input type="radio" name="erp-assign-student" value="${s.id}" style="accent-color:#5E5CE6" onchange="onErpAssignStudentSelected(${s.id})"/>
      <div style="flex:1">
        <div style="font-size:12.5px;font-weight:600;color:#111827">${s.nick} <span style="font-size:11px;color:#6B7280">${s.name}</span></div>
        <div style="font-size:11px;color:#6B7280">${s.flag||''} ${s.nationality} · ${s.gender==='남'?'남성':'여성'} · ${[s.dormType, s.dormGrade].filter(Boolean).join(' ')}</div>
      </div>
      <span style="font-size:11px;color:#D97706;background:#FEF3C7;padding:2px 8px;border-radius:8px">대기</span>
    </label>`).join('');
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
  if (dateIn  && s.startDate) dateIn.value  = s.startDate;
  if (dateOut && s.endDate)   dateOut.value = s.endDate;
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
    if (radio) radio.checked = true;
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
  // 기존 배정 이력 추가 후 배정
  if (!bed.history) bed.history = [];
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
  closeErpAssignModal();
  renderDormErpGrid();
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

  const dur         = APP.bellSystem?.duration     || 50;
  const brk         = APP.bellSystem?.break        || 10;
  const startTime   = APP.bellSystem?.start        || '08:00';
  const totalPeriods= APP.bellSystem?.total        || 8;
  const lunchAfter  = APP.bellSystem?.lunchAfter   || 4;
  const lunchDur    = APP.bellSystem?.lunchDuration|| 30;

  function addMins(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    d.setMinutes(d.getMinutes() + mins);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  let ct = startTime;
  const periods = [];
  for (let p = 1; p <= totalPeriods; p++) {
    if (p === lunchAfter + 1) {
      const ls = ct, le = addMins(ct, lunchDur);
      periods.push({ p: 'lunch', start: ls, end: le });
      ct = le;
    }
    const s = ct, e = addMins(ct, dur);
    periods.push({ p, start: s, end: e });
    ct = addMins(e, brk);
  }
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

  const dur = APP.bellSystem?.duration || 50;
  const brk = APP.bellSystem?.break || 10;
  const startTime = APP.bellSystem?.start || '08:00';
  const totalPeriods = APP.bellSystem?.total || 8;
  const lunchAfter = APP.bellSystem?.lunchAfter || 4;
  const lunchDur = APP.bellSystem?.lunchDuration || 30;

  function addMins(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(); d.setHours(h, m, 0, 0);
    d.setMinutes(d.getMinutes() + mins);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }

  let ct = startTime;
  const periods = [];
  for (let p = 1; p <= totalPeriods; p++) {
    if (p === lunchAfter + 1) {
      const ls = ct, le = addMins(ct, lunchDur);
      periods.push({ p: 'lunch', start: ls, end: le });
      ct = le;
    }
    const s = ct, e = addMins(ct, dur);
    periods.push({ p, start: s, end: e });
    ct = addMins(e, brk);
  }

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
  const durVal = APP.bellSystem ? APP.bellSystem.duration : 50;
  const brkVal = APP.bellSystem ? APP.bellSystem.break : 10;
  const startVal = APP.bellSystem ? (APP.bellSystem.start || '08:00') : '08:00';
  const totalVal = APP.bellSystem ? (APP.bellSystem.total || 8) : 8;
  const lunchAfterVal = APP.bellSystem ? (APP.bellSystem.lunchAfter || 4) : 4;
  const lunchDurVal = APP.bellSystem ? (APP.bellSystem.lunchDuration || 30) : 30;
  
  function getPeriodTimeRange(targetP, dur, brk) {
    let curr = startVal;
    function addMins(timeStr, mins) {
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      date.setMinutes(date.getMinutes() + mins);
      return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
    let periodsList = [];
    for (let p = 1; p <= totalVal; p++) {
      if (p === lunchAfterVal + 1) {
        const lunchStart = curr;
        const lunchEnd = addMins(lunchStart, lunchDurVal);
        periodsList.push({ p: 'lunch', start: lunchStart, end: lunchEnd });
        curr = lunchEnd;
      }
      const start = curr;
      const end = addMins(start, dur);
      periodsList.push({ p: p, start, end });
      curr = addMins(end, brk);
    }
    return periodsList.find(item => item.p === targetP);
  }

  function getLunchRange() {
    let curr = startVal;
    function addMins(timeStr, mins) {
      const [h, m] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h, m, 0, 0);
      date.setMinutes(date.getMinutes() + mins);
      return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
    }
    for (let p = 1; p <= lunchAfterVal; p++) {
      const start = curr;
      const end = addMins(start, durVal);
      curr = addMins(end, brkVal);
    }
    const lunchStart = curr;
    const lunchEnd = addMins(lunchStart, lunchDurVal);
    return { start: lunchStart, end: lunchEnd };
  }

  const targetRange = getPeriodTimeRange(APP.assignTarget.period, durVal, brkVal);
  const lunchRange = getLunchRange();
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
  const settings = APP.bellSystem || { duration: 50, break: 10, start: '08:00', total: 8, lunchAfter: 4, lunchDuration: 30 };
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('bell-settings-duration', settings.duration);
  setVal('bell-settings-break', settings.break);
  setVal('bell-settings-start', settings.start || '08:00');
  setVal('bell-settings-total-periods', settings.total || 8);
  setVal('bell-settings-lunch-after', settings.lunchAfter || 4);
  setVal('bell-settings-lunch-duration', settings.lunchDuration || 30);
  if (document.getElementById('bell-settings-duration')) previewBellSettings();
}

function previewBellSettings() {
  const dur = parseInt(document.getElementById('bell-settings-duration').value);
  const brk = parseInt(document.getElementById('bell-settings-break').value);
  const start = document.getElementById('bell-settings-start').value || '08:00';
  const total = parseInt(document.getElementById('bell-settings-total-periods').value);
  const lunchAfter = parseInt(document.getElementById('bell-settings-lunch-after').value);
  const lunchDur = parseInt(document.getElementById('bell-settings-lunch-duration').value);

  const previewBody = document.getElementById('bell-settings-preview-body');
  if (!previewBody) return;

  function addMins(timeStr, mins) {
    const [h, m] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0, 0);
    date.setMinutes(date.getMinutes() + mins);
    return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
  }

  let currentTime = start;
  let rowsHtml = '';

  for (let p = 1; p <= total; p++) {
    // If lunch break matches this slot position
    if (p === lunchAfter + 1) {
      const lunchStart = currentTime;
      const lunchEnd = addMins(lunchStart, lunchDur);
      rowsHtml += `
        <tr style="background:#FFFBEB;color:#B45309;font-weight:700;">
          <td style="padding:10px;text-align:center;">🍱 점심</td>
          <td style="padding:10px;text-align:center;">${lunchStart} - ${lunchEnd}</td>
          <td style="padding:10px;text-align:center;">식사 및 휴식 (${lunchDur}분)</td>
        </tr>
      `;
      currentTime = lunchEnd;
    }

    const classStart = currentTime;
    const classEnd = addMins(classStart, dur);
    rowsHtml += `
      <tr>
        <td style="padding:10px;text-align:center;font-weight:700;">${p}교시</td>
        <td style="padding:10px;text-align:center;">${classStart} - ${classEnd}</td>
        <td style="padding:10px;text-align:center;"><span class="tsa-badge tsa-badge-success">${dur}분 수업</span></td>
      </tr>
    `;
    currentTime = addMins(classEnd, brk);
  }

  previewBody.innerHTML = rowsHtml;
}

function applyBellSettings() {
  const dur = parseInt(document.getElementById('bell-settings-duration').value);
  const brk = parseInt(document.getElementById('bell-settings-break').value);
  const start = document.getElementById('bell-settings-start').value || '08:00';
  const total = parseInt(document.getElementById('bell-settings-total-periods').value);
  const lunchAfter = parseInt(document.getElementById('bell-settings-lunch-after').value);
  const lunchDur = parseInt(document.getElementById('bell-settings-lunch-duration').value);

  // Time format regex check (HH:MM)
  if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(start)) {
    alert("❌ 시작 시간 형식이 유효하지 않습니다. (예: 08:00 형식으로 입력)");
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
    lunchAfter: lunchAfter,
    lunchDuration: lunchDur
  };

  if (applyOption === "1") {
    showToast(`✓ 벨 설정 변경: ${dur}분 수업 / ${brk}분 휴식이 시간표에 즉시 적용되었습니다.`, 'success');
  } else {
    showToast(`✓ 벨 설정 예약: ${dur}분 수업 / ${brk}분 휴식 정책이 차주 월요일부터 적용 예약되었습니다.`, 'success');
  }

  // Log to Audit History
  MOCK_TIMETABLE_HISTORY.unshift({
    date: new Date().toISOString().slice(0,10),
    time: new Date().toTimeString().slice(0,5),
    actor: 'Head Teacher (Kim)',
    change: `벨 시스템 변경: ${dur}분 수업 / ${brk}분 휴식 / 총 ${total}교시 설정`,
    reason: applyOption === "1" ? '벨 설정 즉시 적용' : '벨 설정 차주 예약 적용',
    type: 'info'
  });

  // Re-render timetable and navigate to it so user can see result
  renderTimetable(APP.conflictMode);
  navigate('timetable');
}

