/* =============================================
   GLOBAL HEADQUARTERS DASHBOARD LOGIC
   ============================================= */
function initGlobalDashboard() {
  setupGlobalDashboard();
}

function setupGlobalDashboard() {
  // Render multi-tenant stats Cebu vs Malta
  document.getElementById('global-total-unpaid').textContent = '$12,450';
  document.getElementById('global-pending-cr').textContent = '3 건 대기 중';
}


/* =============================================
   V0.3 FUNCTIONS & HELPERS
   ============================================= */

// Enhance MOCK_STUDENTS with v0.3 fields and transition status
function enhanceMockStudents() {
  const todayStr = '2026-06-15';
  const today = new Date(todayStr);

  MOCK_STUDENTS.forEach(s => {
    // 1. Email & Emergency Contact
    if (!s.email) {
      s.email = `${s.nick.toLowerCase()}@naver.com`;
    }
    if (!s.emergencyContact) {
      s.emergencyContact = `010-9988-1234 (부)`;
    }

    // 2. Arrival Date (도착 등록일)
    if (!s.arrivalDate) {
      s.arrivalDate = s.startDate || '2026-06-15';
    }

    // 3. End Date (수강 종료일)
    if (!s.endDate) {
      if (s.startDate && s.duration) {
        const start = new Date(s.startDate);
        start.setDate(start.getDate() + s.duration * 7);
        s.endDate = start.toISOString().split('T')[0];
      } else {
        s.endDate = '2026-07-13';
      }
    }

    // 4. 희망 기숙사 타입 — Room 번호로 MOCK_DORM_ROOMS 조회, 구버전값 교정
    if (s.dorm && s.dorm !== '미배정' && (!s.dormAccomType || s.dormAccomType === '기숙사' || s.dormAccomType === '콘도')) {
      const roomMatch = s.dorm.match(/Room\s*(\d+)/i);
      if (roomMatch && typeof MOCK_DORM_ROOMS !== 'undefined') {
        const roomData = MOCK_DORM_ROOMS.find(r => r.roomNo === roomMatch[1]);
        if (roomData) {
          s.dormAccomType = roomData.accomType;
          if (!s.dormType) {
            const capMatch = roomData.type && roomData.type.match(/(\d+인실)/);
            if (capMatch) s.dormType = capMatch[1];
          }
        }
      }
      if (!s.dormAccomType || s.dormAccomType === '기숙사' || s.dormAccomType === '콘도') {
        s.dormAccomType = '가든 호텔';
      }
    }
    // 미배정 학생도 구버전 dormAccomType 값 교정
    if (s.dormAccomType === '기숙사') s.dormAccomType = '가든 호텔';
    if (s.dormAccomType === '콘도')   s.dormAccomType = 'IT Park 콘도';

    // 5. 기숙사 입실/퇴실 기간 자동 설정 — dorm 배정된 학생이 dormIn 없으면 startDate-1일, endDate+1일
    if (!s.dormIn && s.dorm && s.dorm !== '미배정' && s.startDate) {
      const inDate = new Date(s.startDate);
      inDate.setDate(inDate.getDate() - 1);
      s.dormIn = inDate.toISOString().split('T')[0];
    }
    if (!s.dormOut && s.dorm && s.dorm !== '미배정' && s.endDate) {
      const outDate = new Date(s.endDate);
      outDate.setDate(outDate.getDate() + 1);
      s.dormOut = outDate.toISOString().split('T')[0];
    }

    // 6. 납부 확인일 — paid인데 날짜 없으면 시작일 기준 1~5일 전으로 자동 설정
    if (s.remittanceStatus === 'paid' && !s.remittanceDate && s.startDate) {
      const start = new Date(s.startDate);
      const offset = ((s.id || 1) % 5) + 1;
      start.setDate(start.getDate() - offset);
      s.remittanceDate = start.toISOString().split('T')[0];
    }

    // 5. Passport & Flight default if not present
    if (!s.passportNum) {
      s.passportNum = 'M' + (s.id ? (10000000 + s.id) : Math.floor(10000000 + Math.random() * 90000000));
    }
    if (!s.passportExpiry) {
      s.passportExpiry = '2030-12-31';
    }
    if (!s.passportStatus) s.passportStatus = '보관 중';
    if (!s.flightInfo) s.flightInfo = '-';
    if (!s.flightOutInfo) s.flightOutInfo = '-';

    // 6. Auto transition based on arrivalDate and endDate (only if not resigned/extended)
    if (s.status !== 'resigned' && s.status !== 'extended') {
      const arrDate = new Date(s.arrivalDate);
      const endDate = new Date(s.endDate);
      if (today < arrDate) {
        s.status = 'waiting'; // 입학 대기
      } else if (today >= arrDate && today <= endDate) {
        s.status = 'current'; // 재학
      } else if (today > endDate) {
        s.status = 'completed'; // 졸업
      }
    }
  });
}

function enhanceMockTeachers() {
  MOCK_TEACHERS.forEach(t => {
    if (!t.preferredCourses) {
      if (t.type.includes('IELTS')) {
        t.preferredCourses = ['IELTS 리딩', 'IELTS 스피킹', 'IELTS 라이팅'];
        t.basicCourses = ['일반 영어 리딩', '문법'];
        t.prohibitedCourses = ['주니어 영어'];
        t.classType = 'both';
      } else if (t.type.includes('주니어')) {
        t.preferredCourses = ['주니어 스피킹', '단어 놀이'];
        t.basicCourses = ['일반 영어 회화'];
        t.prohibitedCourses = ['IELTS 라이팅'];
        t.classType = '1on1';
      } else if (t.type.includes('그룹')) {
        t.preferredCourses = ['그룹 토론', '디스커션'];
        t.basicCourses = ['일반 영어 회화'];
        t.prohibitedCourses = ['IELTS 전문'];
        t.classType = 'group';
      } else {
        t.preferredCourses = ['일반 영어 스피킹', '리스닝'];
        t.basicCourses = ['문법', '리딩'];
        t.prohibitedCourses = ['IELTS 전문'];
        t.classType = '1on1';
      }
    }
    if (!t.workHours) {
      t.workHours = { start: '08:00', end: '17:00' };
    }
    if (!t.assignedRoom) {
      t.assignedRoom = t.room || 'A-101';
    }
  });
}

function generateDormRooms() {
  if (APP.dormRoomsGenerated) return;
  MOCK_DORM_TEMPLATES.forEach(t => {
    generateRoomsFromTemplate(t.capacity, t.condition, t.count, t.cost);
  });
  APP.dormRoomsGenerated = true;
}

// 특정 기간 내 호실별 공실 침대 수 계산
function checkRoomVacancy(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const typeVacancy = {};
  MOCK_DORM_TEMPLATES.forEach(t => {
    const key = `${t.capacity}인실 (${t.condition})`;
    typeVacancy[key] = {
      templateId: t.id,
      capacity: t.capacity,
      condition: t.condition,
      cost: t.cost,
      totalRooms: t.count,
      vacantRooms: 0,
      rooms: []
    };
  });

  MOCK_DORM_ROOMS.forEach(room => {
    const typeLabel = room.type; // e.g. "2인실 (이코노미)" or "2인실"
    // Match type vacancies keys
    let matchedKey = Object.keys(typeVacancy).find(k => k.startsWith(room.type) || room.type.startsWith(k.split(' ')[0]));
    if (!matchedKey) return;

    let activeAllocations = 0;
    if (room.beds) {
      room.beds.forEach(bed => {
        if (!bed.student || !bed.start || !bed.end) return;
        const bStart = new Date(`2026-${bed.start}`);
        const bEnd = new Date(`2026-${bed.end}`);
        const overlap = (start <= bEnd && end >= bStart);
        if (overlap) {
          activeAllocations++;
        }
      });
    }

    const capacity = room.beds ? room.beds.length : room.capacity;
    if (activeAllocations < capacity) {
      typeVacancy[matchedKey].vacantRooms++;
      typeVacancy[matchedKey].rooms.push({
        roomNo: room.roomNo,
        availableBeds: capacity - activeAllocations
      });
    }
  });

  return Object.values(typeVacancy);
}

function getAvailableRoomsForPeriod(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  const available = [];
  MOCK_DORM_ROOMS.forEach(room => {
    const bedsAvailability = room.beds.map(bed => {
      if (!bed.student || !bed.start || !bed.end) {
        return { bedId: bed.id, isAvailable: true };
      }
      
      const bStart = new Date(`2026-${bed.start}`);
      const bEnd = new Date(`2026-${bed.end}`);
      const overlap = (start <= bEnd && end >= bStart);
      return { bedId: bed.id, isAvailable: !overlap };
    });

    const freeBeds = bedsAvailability.filter(b => b.isAvailable);
    if (freeBeds.length > 0) {
      available.push({
        roomNo: room.roomNo,
        type: room.type,
        genderRestriction: room.genderRestriction || '무관',
        freeBeds: freeBeds.map(b => b.bedId),
        roomObj: room
      });
    }
  });

  return available;
}

function addDormTemplate(accomType, capacity, condition, count, cost, costDay = 0, costWeek = 0) {
  const newId = MOCK_DORM_TEMPLATES.length + 1;
  MOCK_DORM_TEMPLATES.push({ id: newId, accomType, capacity, condition, count, costDay, costWeek, cost });
  generateRoomsFromTemplate(accomType, capacity, condition, count);
  initDormGantt();
}

function generateRoomsFromTemplate(accomType, capacity, condition, count) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < count; i++) {
    const beds = [];
    for (let b = 0; b < capacity; b++) {
      beds.push({ id: alphabet[b], student: null, start: null, end: null });
    }
    MOCK_DORM_ROOMS.push({
      roomNo: null,
      accomType,
      type: `${capacity}인실 (${condition})`,
      capacity,
      genderRestriction: '무관',
      beds
    });
  }
}

function deleteDormTemplate(id) {
  MOCK_DORM_TEMPLATES = MOCK_DORM_TEMPLATES.filter(t => t.id !== id);
  showToast('템플릿이 삭제되었습니다.', 'success');
  renderAdminDormTemplates();
}

function saveAdminDormTemplate() {
  const accomType = document.getElementById('tpl-accom-type').value;
  const capacity = parseInt(document.getElementById('tpl-capacity').value);
  const condition = document.getElementById('tpl-condition').value;
  const count = parseInt(document.getElementById('tpl-count').value) || 0;
  const costDay  = parseInt(document.getElementById('tpl-cost-day').value)  || 0;
  const costWeek = parseInt(document.getElementById('tpl-cost-week').value) || 0;
  const cost     = parseInt(document.getElementById('tpl-cost').value)      || 0;

  if (cost <= 0) {
    showToast('올바른 4주 요금을 입력하세요.', 'warning');
    return;
  }

  addDormTemplate(accomType, capacity, condition, count, cost, costDay, costWeek);
  showToast(`✓ ${capacity}인실 (${condition}) 템플릿이 저장되었습니다.`, 'success');
  renderAdminDormTemplates();
}

function switchAdminDormTab(tab) {
  const tabs = ['gantt', 'assign', 'template'];
  tabs.forEach(t => {
    const btn = document.getElementById(`admin-dorm-tab-${t}`);
    const panel = document.getElementById(`admin-dorm-panel-${t}`);
    if (btn) {
      btn.style.color = t === tab ? '#5E5CE6' : '#9CA3AF';
      btn.style.borderBottomColor = t === tab ? '#5E5CE6' : 'transparent';
      btn.style.fontWeight = t === tab ? '700' : '600';
    }
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });

  if (tab === 'template') {
    renderAdminDormTemplates();
  } else if (tab === 'gantt') {
    renderDormAssignPending();
    renderAdminDormRoomsTable();
  } else if (tab === 'assign') {
    renderAdminDormAssign();
  }
}



function initAdminDormRoomsView() {
  const select = document.getElementById('dorm-assign-student');
  if (select) {
    select.innerHTML = MOCK_STUDENTS.map(s => `<option value="${s.id}">${s.nick} (${s.name}) - ${s.gender}성</option>`).join('');
  }
  renderAdminDormRoomsTable();
}

function renderDormAssignPending() {
  const tbody = document.getElementById('dorm-assign-pending-tbody');
  const countEl = document.getElementById('dorm-assign-pending-count');
  if (!tbody) return;

  const pending = MOCK_STUDENTS.filter(s =>
    (s.status === 'waiting' || s.status === 'current') && s.dorm === '미배정' && s.dormType
  );

  if (countEl) countEl.textContent = `대기 ${pending.length}명`;

  if (pending.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#9CA3AF">배정 대기 학생이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = pending.map(s => {
    const statusLabel = s.status === 'waiting'
      ? `<span style="font-size:11px;font-weight:700;color:#D97706;background:#FEF3C7;padding:2px 8px;border-radius:10px">입학대기</span>`
      : `<span style="font-size:11px;font-weight:700;color:#5E5CE6;background:#EEF2FF;padding:2px 8px;border-radius:10px">재학</span>`;
    const period = `${s.startDate || '-'} ~ ${s.departureDate || '-'}`;
    return `<tr>
      <td><strong>${s.nick}</strong><br><span style="font-size:10.5px;color:#6B7280">${s.name}</span></td>
      <td style="font-size:11.5px">${s.agency || '-'}</td>
      <td>${s.flag || ''} ${s.nationality}</td>
      <td><strong>${s.dormType}</strong></td>
      <td style="font-size:11.5px;color:#6B7280">${s.dormGrade || '-'}</td>
      <td style="font-size:11px;color:#6B7280">${period}</td>
      <td style="font-size:11.5px">${s.gender === '남' ? '남성' : '여성'}</td>
      <td style="text-align:center">${statusLabel}</td>
      <td style="text-align:center">
        <button class="tsa-btn tsa-btn-xs" style="background:#5E5CE6;border:none;color:white;font-size:11px;padding:4px 10px"
          onclick="openStudentDetail(${s.id})">배정하기</button>
      </td>
    </tr>`;
  }).join('');
}

let _expandedDormCardIdx = null;

// 배정 관리 필터 상태
let _dormAssignFilters = {
  startDate: '', endDate: '', gender: 'all',
  accomType: 'all', capacity: 'all', grade: 'all',
  activeRowIdx: null
};

function renderAdminDormAssign() {
  const container = document.getElementById('admin-dorm-assign-container');
  if (!container) return;
  const f = _dormAssignFilters;

  // ── 날짜 범위 기반 점유 계산 헬퍼 ──
  // 날짜가 선택된 경우: 해당 기간과 겹치는 침대를 "사용 중"으로 계산
  // 날짜 미선택: 현재 입실자 기준
  const hasDateFilter = !!(f.startDate || f.endDate);
  const fStart = f.startDate || null;
  const fEnd   = f.endDate   || null;

  // 특정 침대가 조회 기간과 겹치는지 판단
  const isBedOccupiedInRange = (bed) => {
    if (!bed.student) return false;
    if (!hasDateFilter) return true; // 날짜 없으면 현재 입실자 = 사용 중
    const bStart = bed.start ? `2026-${bed.start}` : null;
    const bEnd   = bed.end   ? `2026-${bed.end}`   : null;
    if (!bStart || !bEnd) return true;
    // fStart만 있으면 bEnd >= fStart, fEnd만 있으면 bStart <= fEnd
    if (fStart && fEnd) return bStart <= fEnd && bEnd >= fStart;
    if (fStart) return bEnd >= fStart;
    return bStart <= fEnd;
  };

  // ── 공실 요약 카드 계산 ──
  const pill = (color, text) => {
    const colors = { m: 'background:#E6F1FB;color:#0C447C', f: 'background:#FBEAF0;color:#72243E', u: 'background:#F1EFE8;color:#5F5E5A' };
    return `<span style="font-size:11px;font-weight:500;padding:2px 8px;border-radius:20px;white-space:nowrap;${colors[color] || colors.u}">${text}</span>`;
  };
  const metric = (num, label, color) =>
    `<div style="display:flex;flex-direction:column;gap:2px">
      <span style="font-size:22px;font-weight:500;line-height:1;color:${color || 'var(--color-text-primary, #111827)'}">${num}</span>
      <span style="font-size:11px;color:#9CA3AF">${label}</span>
    </div>`;
  const metricPair = (n1, l1, n2, l2, color) =>
    `<div style="display:flex;gap:12px;align-items:flex-end">
      ${metric(n1, l1, color)}
      <span style="font-size:16px;color:#E5E7EB;padding-bottom:3px">·</span>
      ${metric(n2, l2, color)}
    </div>`;

  let totalVacant = 0;
  const summaryCards = MOCK_DORM_TEMPLATES.map((tpl, tplIdx) => {
    const typeStr = `${tpl.capacity}인실 (${tpl.condition})`;
    const capStr  = `${tpl.capacity}인실`;
    const rooms   = MOCK_DORM_ROOMS.filter(r => r.accomType === tpl.accomType && r.type === typeStr && r.roomNo);

    // 필터 매칭
    const matchType = f.accomType === 'all' || f.accomType === tpl.accomType;
    const matchCap  = f.capacity === 'all'  || f.capacity === capStr;
    const matchGrade= f.grade === 'all'     || f.grade === tpl.condition;
    if (!matchType || !matchCap || !matchGrade) return null;

    const totalRooms = rooms.length;
    const totalBeds  = rooms.reduce((a, r) => a + (r.beds || []).length, 0);

    // 사용 중인 방 (occupied beds 1개 이상)
    const occupiedRooms = rooms.filter(r => (r.beds || []).some(b => isBedOccupiedInRange(b)));
    const occupiedRoomCount = occupiedRooms.length;
    const occupiedBedCount  = occupiedRooms.reduce((a, r) => a + (r.beds || []).filter(b => isBedOccupiedInRange(b)).length, 0);
    const occupiedBedM = occupiedRooms.filter(r => r.genderRestriction === '남성').reduce((a, r) => a + (r.beds || []).filter(b => isBedOccupiedInRange(b)).length, 0);
    const occupiedBedF = occupiedRooms.filter(r => r.genderRestriction === '여성').reduce((a, r) => a + (r.beds || []).filter(b => isBedOccupiedInRange(b)).length, 0);

    // 사용 중인 방의 남는 침대
    const partialVacantRooms = occupiedRooms.filter(r => (r.beds || []).some(b => !isBedOccupiedInRange(b)));
    const partialVacantRoomCount = partialVacantRooms.length;
    const partialVacantBedCount  = partialVacantRooms.reduce((a, r) => a + (r.beds || []).filter(b => !isBedOccupiedInRange(b)).length, 0);
    const partialVacantBedM = partialVacantRooms.filter(r => r.genderRestriction === '남성').reduce((a, r) => a + (r.beds || []).filter(b => !isBedOccupiedInRange(b)).length, 0);
    const partialVacantBedF = partialVacantRooms.filter(r => r.genderRestriction === '여성').reduce((a, r) => a + (r.beds || []).filter(b => !isBedOccupiedInRange(b)).length, 0);

    // 완전 공실 방
    const emptyRooms = rooms.filter(r => !(r.beds || []).some(b => isBedOccupiedInRange(b)));
    const emptyRoomCount = emptyRooms.length;
    const emptyBedCount  = emptyRooms.reduce((a, r) => a + (r.beds || []).length, 0);
    const emptyBedM = emptyRooms.filter(r => r.genderRestriction === '남성').reduce((a, r) => a + (r.beds || []).length, 0);
    const emptyBedF = emptyRooms.filter(r => r.genderRestriction === '여성').reduce((a, r) => a + (r.beds || []).length, 0);
    const emptyBedU = emptyRooms.filter(r => !r.genderRestriction).reduce((a, r) => a + (r.beds || []).length, 0);

    totalVacant += partialVacantBedCount + emptyBedCount;

    // 배정 대기 (완납 학생만)
    const waitStudents = MOCK_STUDENTS.filter(s => {
      if (s.dorm !== '미배정') return false;
      if (s.remittanceStatus !== 'paid') return false;
      if (s.dormAccomType !== tpl.accomType || s.dormType !== capStr || s.dormGrade !== tpl.condition) return false;
      if (!hasDateFilter) return true;
      const sS = s.startDate || null, sE = s.departureDate || null;
      if (!sS || !sE) return true;
      return sS <= fEnd && sE >= fStart;
    });
    const waitCount = waitStudents.length;
    const waitM = waitStudents.filter(s => s.gender === '남').length;
    const waitF = waitStudents.filter(s => s.gender === '여').length;

    const accomColor = tpl.accomType === '콘도' ? '#D97706' : '#4F46E5';
    const accomBg    = tpl.accomType === '콘도' ? '#FFFBEB' : '#EEF2FF';

    return `
    <div style="background:#fff;border:0.5px solid #E5E7EB;border-radius:12px;padding:14px 18px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <span style="font-size:11px;font-weight:600;padding:2px 9px;border-radius:6px;background:${accomBg};color:${accomColor}">${tpl.accomType}</span>
        <span style="font-size:13px;font-weight:500;color:#111827">${capStr} · ${tpl.condition}</span>
        <button onclick="jumpToDormRoomsTab('${tpl.accomType}','${tpl.capacity}인실','${tpl.condition}')" style="font-size:11px;color:#5E5CE6;background:#EEF2FF;border:none;border-radius:6px;padding:3px 10px;cursor:pointer;white-space:nowrap">기숙사 현황 보기 →</button>
        <span style="font-size:11px;color:#9CA3AF;margin-left:auto">총 ${totalRooms}방 · ${totalBeds}침대</span>
      </div>
      <div style="display:flex;align-items:stretch">

        <!-- 사용 중 -->
        <div style="flex:1">
          <div style="font-size:11px;color:#9CA3AF;font-weight:500;margin-bottom:8px">사용 중</div>
          ${metricPair(occupiedRoomCount, '방', occupiedBedCount, '침대', '#111827')}
          <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">
            ${occupiedBedM > 0 ? pill('m', `♂ 방${occupiedRooms.filter(r=>r.genderRestriction==='남성').length}·침대${occupiedBedM}`) : ''}
            ${occupiedBedF > 0 ? pill('f', `♀ 방${occupiedRooms.filter(r=>r.genderRestriction==='여성').length}·침대${occupiedBedF}`) : ''}
            ${occupiedBedM === 0 && occupiedBedF === 0 ? `<span style="font-size:11px;color:#D1D5DB">-</span>` : ''}
          </div>
        </div>

        <div style="width:0.5px;background:#F3F4F6;align-self:stretch;margin:0 18px"></div>

        <!-- 공실 (두 서브박스) -->
        <div style="flex:2">
          <div style="font-size:11px;color:#9CA3AF;font-weight:500;margin-bottom:8px">공실</div>
          <div style="display:flex;gap:8px">
            <!-- 사용 중인 방·즉시 배정 -->
            <div style="flex:1;background:#F0FDF4;border-radius:8px;padding:10px 12px">
              <div style="font-size:10px;color:#059669;font-weight:600;margin-bottom:7px">● 사용 중인 방·즉시 배정</div>
              <div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:7px">
                ${metric(partialVacantRoomCount, '방', '#059669')}
                <span style="font-size:14px;color:#D1D5DB;padding-bottom:2px">·</span>
                ${metric(partialVacantBedCount, '침대', '#059669')}
              </div>
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                ${partialVacantBedM > 0 ? pill('m', `♂ 방${partialVacantRooms.filter(r=>r.genderRestriction==='남성').length}·침대${partialVacantBedM}`) : ''}
                ${partialVacantBedF > 0 ? pill('f', `♀ 방${partialVacantRooms.filter(r=>r.genderRestriction==='여성').length}·침대${partialVacantBedF}`) : ''}
                ${partialVacantBedCount === 0 ? `<span style="font-size:11px;color:#D1D5DB">없음</span>` : ''}
              </div>
            </div>
            <!-- 빈 방 -->
            <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:10px 12px">
              <div style="font-size:10px;color:#6B7280;font-weight:600;margin-bottom:7px">빈 방</div>
              <div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:7px">
                ${metric(emptyRoomCount, '방', '#374151')}
                <span style="font-size:14px;color:#D1D5DB;padding-bottom:2px">·</span>
                ${metric(emptyBedCount, '침대', '#374151')}
              </div>
              <div style="display:flex;gap:5px;flex-wrap:wrap">
                ${emptyBedM > 0 ? pill('m', `♂ 방${emptyRooms.filter(r=>r.genderRestriction==='남성').length}·침대${emptyBedM}`) : ''}
                ${emptyBedF > 0 ? pill('f', `♀ 방${emptyRooms.filter(r=>r.genderRestriction==='여성').length}·침대${emptyBedF}`) : ''}
                ${emptyBedU > 0 ? pill('u', `미지정 방${emptyRooms.filter(r=>!r.genderRestriction).length}·침대${emptyBedU}`) : ''}
                ${emptyBedCount === 0 ? `<span style="font-size:11px;color:#D1D5DB">없음</span>` : ''}
              </div>
            </div>
          </div>
        </div>

        <div style="width:0.5px;background:#F3F4F6;align-self:stretch;margin:0 18px"></div>

        <!-- 배정 대기 -->
        <div style="flex:0.6">
          <div style="font-size:11px;color:#9CA3AF;font-weight:500;margin-bottom:8px">배정 대기</div>
          ${metric(waitCount, '학생', waitCount > 0 ? '#D97706' : '#9CA3AF')}
          <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap;margin-bottom:10px">
            ${waitM > 0 ? pill('m', `♂ ${waitM}`) : ''}
            ${waitF > 0 ? pill('f', `♀ ${waitF}`) : ''}
            ${waitCount === 0 ? `<span style="font-size:11px;color:#D1D5DB">-</span>` : ''}
          </div>
          ${waitCount > 0 ? `
          <button onclick="toggleDormCardWaitList(${tplIdx})" style="font-size:13px;font-weight:700;background:#5E5CE6;color:#fff;border:none;border-radius:10px;padding:8px 16px;cursor:pointer;display:flex;align-items:center;gap:6px;white-space:nowrap;width:100%;justify-content:center;margin-top:4px">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            배정하기 ${_expandedDormCardIdx === tplIdx ? '▴' : '▾'}
          </button>` : ''}
        </div>

      </div>

      ${_expandedDormCardIdx === tplIdx ? (() => {
        const cardWaitStudents = MOCK_STUDENTS.filter(s =>
          s.dorm === '미배정' && s.dormAccomType === tpl.accomType &&
          s.dormType === `${tpl.capacity}인실` && s.dormGrade === tpl.condition
        );
        if (!cardWaitStudents.length) return '';
        const rows = cardWaitStudents.map(s => {
          const gColor = s.gender === '남' ? 'background:#E6F1FB;color:#0C447C' : 'background:#FBEAF0;color:#72243E';
          const gLabel = s.gender === '남' ? '♂ 남성' : '♀ 여성';
          const initBg = s.gender === '남' ? 'background:#EEF2FF;color:#4F46E5' : 'background:#FDF2F8;color:#9D174D';
          const natMap = { '한국':'KR','중국':'CN','일본':'JP','베트남':'VN','태국':'TH','대만':'TW','필리핀':'PH' };
          const natCode = natMap[s.nationality] || s.nationality || '';
          return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:0.5px solid #F3F4F6">
            <div onclick="openStudentDetail(${s.id})" style="width:38px;height:38px;border-radius:50%;${initBg};display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0;cursor:pointer" title="학생 상세 보기">${(s.nick||'?')[0]}</div>
            <div style="flex:1;min-width:0;cursor:pointer" onclick="openStudentDetail(${s.id})">
              <div style="font-size:13px;font-weight:600;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.nick} <span style="font-size:11px;color:#9CA3AF;font-weight:400">${s.name}</span></div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:3px;flex-wrap:wrap">
                <span style="font-size:11px;font-weight:500;padding:1px 7px;border-radius:20px;white-space:nowrap;${gColor}">${gLabel}</span>
                <span style="font-size:11px;color:#D1D5DB">·</span>
                <span style="font-size:10.5px;color:#6B7280;font-weight:600;border:1px solid #E5E7EB;padding:0px 5px;border-radius:4px">${natCode}</span>
                <span style="font-size:11px;color:#6B7280">${s.nationality || '-'}</span>
                <span style="font-size:11px;color:#D1D5DB">·</span>
                <span style="font-size:11px;color:#6B7280">${s.age ? s.age + '세' : '-'}</span>
                <span style="font-size:11px;color:#D1D5DB">·</span>
                <span style="font-size:11px;color:#6B7280">여권 ${s.passportNum || '-'}</span>
                <span style="font-size:11px;color:#D1D5DB">·</span>
                <span style="font-size:11px;color:#9CA3AF">${s.startDate || '-'} ~ ${s.departureDate || '-'}</span>
              </div>
            </div>
            <button onclick="openDormAssignModal(${s.id})" style="font-size:11.5px;font-weight:600;background:#5E5CE6;color:#fff;border:none;border-radius:7px;padding:6px 14px;cursor:pointer;flex-shrink:0">배정</button>
          </div>`;
        }).join('');
        return `<div style="background:#F9FAFB;border-radius:8px;padding:10px 14px;margin-top:12px;border:0.5px solid #F3F4F6">
          <div style="font-size:11.5px;font-weight:500;color:#6B7280;margin-bottom:4px">이 타입 배정 대기 학생</div>
          ${rows}
        </div>`;
      })() : ''}

    </div>`;
  }).filter(Boolean);

  // ── 배정 대기 학생 필터 ──
  let waitingStudents = MOCK_STUDENTS.filter(s => s.dorm === '미배정' && s.dormAccomType && s.remittanceStatus === 'paid');
  if (f.gender !== 'all') waitingStudents = waitingStudents.filter(s => (f.gender === '남성' ? s.gender === '남' : s.gender === '여'));
  if (f.accomType !== 'all') waitingStudents = waitingStudents.filter(s => s.dormAccomType === f.accomType);
  if (f.capacity !== 'all') waitingStudents = waitingStudents.filter(s => s.dormType === f.capacity);
  if (f.grade !== 'all')    waitingStudents = waitingStudents.filter(s => s.dormGrade === f.grade);
  if (f.activeRowIdx !== null) {
    const tpl = MOCK_DORM_TEMPLATES[f.activeRowIdx];
    if (tpl) waitingStudents = waitingStudents.filter(s =>
      s.dormAccomType === tpl.accomType && s.dormType === `${tpl.capacity}인실` && s.dormGrade === tpl.condition
    );
  }

  const waitingRows = waitingStudents.map((s, idx) => {
    const genderLabel = s.gender === '남' ? '남성' : '여성';
    const capStr = s.dormType || '-';
    const accomColor = s.dormAccomType === '콘도' ? '#8B5CF6' : '#5E5CE6';
    const natMap = { '한국': 'KR', '중국': 'CN', '일본': 'JP', '베트남': 'VN', '태국': 'TH', '대만': 'TW' };
    const natCode = natMap[s.nationality] || '';

    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:28px;height:28px;border-radius:50%;background:#EEF2FF;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#4F46E5;flex-shrink:0">${(s.nick||'?')[0]}</div>
          <div>
            <div style="font-weight:700;color:#111827;font-size:12.5px">${s.nick} <span style="font-size:10.5px;color:#9CA3AF;font-weight:400">${s.name}</span></div>
          </div>
        </div>
      </td>
      <td style="font-size:11.5px;color:#374151">${natCode ? `<span style="font-size:10px;color:#6B7280;font-weight:600;border:1px solid #E5E7EB;padding:1px 5px;border-radius:4px;margin-right:3px">${natCode}</span>` : ''}${s.nationality || '-'}</td>
      <td style="font-size:11.5px;color:#374151">${genderLabel}</td>
      <td><span style="font-size:11px;font-weight:600;color:${accomColor};background:${accomColor}18;padding:2px 8px;border-radius:6px">${s.dormAccomType || '-'}</span></td>
      <td style="font-size:11.5px;color:#6B7280">${s.dormGrade || '-'}</td>
      <td style="font-size:11.5px;color:#374151">${capStr}</td>
      <td style="font-size:11px;color:#6B7280;white-space:nowrap">${s.startDate || '-'} ~ ${s.departureDate || '-'}</td>
      <td style="font-size:11.5px;color:#374151">${s.agency || '-'}</td>
      <td><span style="font-size:11px;font-weight:600;color:#D97706;background:#FEF3C7;padding:2px 9px;border-radius:8px">배정 대기</span></td>
      <td style="text-align:center">
        <button onclick="openDormAssignModal(${s.id})" style="font-size:11.5px;font-weight:600;background:#5E5CE6;color:#fff;border:none;border-radius:7px;padding:6px 16px;cursor:pointer;white-space:nowrap">
          배정
        </button>
      </td>
    </tr>`;
  }).join('');

  // ── 필터 버튼 렌더 헬퍼 ──
  const chipBtn = (label, key, val) => {
    const active = f[key] === val;
    return `<button onclick="_setDormAssignFilter('${key}','${val}')" style="font-size:11.5px;padding:4px 13px;border-radius:20px;border:1.5px solid ${active ? '#5E5CE6' : '#E5E7EB'};background:${active ? '#EEF2FF' : '#fff'};color:${active ? '#4F46E5' : '#6B7280'};font-weight:${active ? '700' : '500'};cursor:pointer">${label}</button>`;
  };
  const genderBtn = (label, val) => {
    const active = f.gender === val;
    return `<button onclick="_setDormAssignFilter('gender','${val}')" style="font-size:11.5px;padding:5px 14px;border-radius:20px;border:1.5px solid ${active ? '#5E5CE6' : '#E5E7EB'};background:${active ? '#EEF2FF' : '#fff'};color:${active ? '#4F46E5' : '#6B7280'};font-weight:${active ? '700' : '500'};cursor:pointer">${label}</button>`;
  };

  const filterLabel = f.activeRowIdx !== null
    ? (() => { const t = MOCK_DORM_TEMPLATES[f.activeRowIdx]; return t ? `<span style="font-size:11px;color:#4F46E5;background:#EEF2FF;padding:2px 8px;border-radius:6px;margin-left:6px">${t.accomType} ${t.capacity}인실 ${t.condition} 필터 적용 중</span>` : ''; })()
    : `<span style="font-size:11.5px;color:#9CA3AF">전체 ${waitingStudents.length}명</span>`;

  container.innerHTML = `
    <div style="padding:0">

      <!-- 유형 / 인실 / 등급 필터 + 요약 -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11.5px;font-weight:600;color:#374151">유형:</span>
            ${chipBtn('전체','accomType','all')}${chipBtn('기숙사','accomType','기숙사')}${chipBtn('콘도','accomType','콘도')}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11.5px;font-weight:600;color:#374151">인실 기준:</span>
            ${chipBtn('전체','capacity','all')}${chipBtn('1인실','capacity','1인실')}${chipBtn('2인실','capacity','2인실')}${chipBtn('4인실','capacity','4인실')}
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:11.5px;font-weight:600;color:#374151">등급:</span>
            ${chipBtn('전체','grade','all')}${chipBtn('스탠다드','grade','스탠다드')}${chipBtn('이코노미','grade','이코노미')}${chipBtn('디럭스','grade','디럭스')}
          </div>
        </div>
        <div style="font-size:11.5px;color:#6B7280">총 ${MOCK_DORM_TEMPLATES.length}개 타입 · <strong style="color:#374151">공실 ${totalVacant}석</strong></div>
      </div>

      <!-- 공실 요약 카드 -->
      <div style="margin-bottom:20px">
        ${summaryCards.length ? summaryCards.join('') : '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:12px;background:#fff;border:0.5px solid #E5E7EB;border-radius:12px">해당 조건의 타입이 없습니다.</div>'}
      </div>

      <!-- 배정 대기 학생 섹션 -->
      <div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:13px;font-weight:700;color:#111827">배정 대기 학생</span>
          ${filterLabel}
          ${f.activeRowIdx !== null ? `<button onclick="_setDormAssignFilter('activeRowIdx',null)" style="font-size:11px;color:#6B7280;background:#F3F4F6;border:none;border-radius:6px;padding:2px 9px;cursor:pointer">전체 보기</button>` : ''}
        </div>
        <div style="background:#fff;border:1.5px solid #E5E7EB;border-radius:12px;overflow:hidden">
          <table class="tsa-table" style="font-size:12px;margin:0">
            <thead>
              <tr style="background:#F9FAFB">
                <th style="font-size:11.5px;color:#6B7280;font-weight:600;padding:10px 16px">학생</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">국적</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">성별</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">신청 유형</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">등급</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">인실</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">수강 기간</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">에이전시</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600">상태</th>
                <th style="font-size:11.5px;color:#6B7280;font-weight:600;text-align:center">배정</th>
              </tr>
            </thead>
            <tbody>${waitingRows || '<tr><td colspan="10" style="text-align:center;padding:40px;color:#9CA3AF;font-size:12px">배정 대기 학생이 없습니다.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>`;

  if (typeof refreshIcons === 'function') refreshIcons();
}

function _setDormAssignFilter(key, val) {
  if (key === 'activeRowIdx') {
    _dormAssignFilters.activeRowIdx = val === null ? null : Number(val);
  } else {
    _dormAssignFilters[key] = val;
  }
  renderAdminDormAssign();
}

function toggleDormCardWaitList(tplIdx) {
  _expandedDormCardIdx = _expandedDormCardIdx === tplIdx ? null : tplIdx;
  renderAdminDormAssign();
}

// ── 배정 팝업 모달 ──
let _damStudentId = null;
let _damSelectedBed = null; // { roomNo, bedId }

function openDormAssignModal(studentId) {
  const s = MOCK_STUDENTS.find(st => st.id === studentId);
  if (!s) return;
  _damStudentId = studentId;
  _damSelectedBed = null;

  // 학생 메타
  const metaEl = document.getElementById('dam-student-meta');
  if (metaEl) {
    const natMap = { '한국': 'KR', '중국': 'CN', '일본': 'JP', '베트남': 'VN', '태국': 'TH', '대만': 'TW' };
    const nat = natMap[s.nationality] || '';
    metaEl.innerHTML = `<strong style="color:#111827">${s.nick}</strong> · ${nat ? `<span style="font-size:10px;border:1px solid #E5E7EB;padding:1px 5px;border-radius:3px">${nat}</span> ` : ''}${s.nationality || ''} · ${s.gender === '남' ? '남성' : '여성'} · ${s.agency || '-'}`;
  }

  // 셀렉트 초기값
  const accomEl = document.getElementById('dam-accomType');
  const capEl   = document.getElementById('dam-capacity');
  const gradeEl = document.getElementById('dam-grade');
  const inEl    = document.getElementById('dam-checkin');
  const outEl   = document.getElementById('dam-checkout');
  if (accomEl) accomEl.value = s.dormAccomType || '기숙사';
  if (capEl)   capEl.value   = s.dormType ? s.dormType.replace('인실','') : '2';
  if (gradeEl) gradeEl.value = s.dormGrade || '이코노미';
  if (inEl)    inEl.value    = s.startDate || '';
  if (outEl)   outEl.value   = s.departureDate || '';

  // 확정 버튼 리셋
  const btn = document.getElementById('dam-confirm-btn');
  if (btn) { btn.disabled = true; btn.style.background = '#E5E7EB'; btn.style.color = '#9CA3AF'; btn.style.cursor = 'not-allowed'; }
  const info = document.getElementById('dam-selected-info');
  if (info) info.textContent = '';

  document.getElementById('dorm-assign-modal').style.display = 'block';
  renderAssignRoomList();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderAssignRoomList() {
  const listEl = document.getElementById('dam-room-list');
  if (!listEl) return;

  const accomType = (document.getElementById('dam-accomType') || {}).value || '기숙사';
  const capacity  = parseInt((document.getElementById('dam-capacity') || {}).value || '2');
  const grade     = (document.getElementById('dam-grade') || {}).value || '이코노미';
  const typeStr   = `${capacity}인실 (${grade})`;

  const s = MOCK_STUDENTS.find(st => st.id === _damStudentId);
  const studentGender = s ? (s.gender === '남' ? '남성' : '여성') : null;

  const matchRooms = MOCK_DORM_ROOMS.filter(r => r.accomType === accomType && r.type === typeStr && r.roomNo);

  if (matchRooms.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:12px;background:#F9FAFB;border-radius:10px;border:1.5px dashed #E5E7EB">해당 조건의 호실이 없습니다.</div>`;
    return;
  }

  listEl.innerHTML = matchRooms.map(room => {
    const totalBeds   = (room.beds || []).length;
    const occupiedBeds= (room.beds || []).filter(b => b.student).length;
    const vacantBeds  = totalBeds - occupiedBeds;
    const genderMismatch = studentGender && room.genderRestriction && room.genderRestriction !== studentGender;
    const isFull = vacantBeds === 0;
    const canAssign = !genderMismatch && !isFull;

    const accomColor = accomType === '콘도' ? '#8B5CF6' : '#5E5CE6';
    const headerBg = genderMismatch ? '#FEF2F2' : isFull ? '#F9FAFB' : '#F0FDF4';
    const headerBorder = genderMismatch ? '#FECACA' : isFull ? '#E5E7EB' : '#BBF7D0';

    let badge = '';
    if (genderMismatch) badge = `<span style="font-size:10.5px;font-weight:600;background:#FEE2E2;color:#DC2626;padding:2px 8px;border-radius:6px">성별 불일치</span>`;
    else if (isFull)    badge = `<span style="font-size:10.5px;font-weight:600;background:#F3F4F6;color:#6B7280;padding:2px 8px;border-radius:6px">만실</span>`;
    else                badge = `<span style="font-size:10.5px;font-weight:600;background:#D1FAE5;color:#059669;padding:2px 8px;border-radius:6px">공실 ${vacantBeds}개</span>`;

    const assignBtn = canAssign
      ? `<button onclick="selectDormRoomBed('${room.roomNo}')" style="font-size:12px;font-weight:600;background:#5E5CE6;color:#fff;border:none;border-radius:7px;padding:5px 14px;cursor:pointer;white-space:nowrap">배정</button>`
      : `<button disabled style="font-size:12px;font-weight:600;background:#E5E7EB;color:#9CA3AF;border:none;border-radius:7px;padding:5px 14px;cursor:not-allowed;white-space:nowrap">배정</button>`;

    const roomIdx = `dam-room-${room.roomNo}`;

    // 침대 상세 행
    const bedRows = (room.beds || []).map(b => {
      const isVacant = !b.student;
      const isSelected = _damSelectedBed && _damSelectedBed.roomNo === room.roomNo && _damSelectedBed.bedId === b.id;
      const rowBg = isSelected ? '#EEF2FF' : isVacant ? '#F0FDF4' : '#fff';
      return `<tr style="background:${rowBg}">
        <td style="font-size:12px;font-weight:600;color:#374151;width:60px;padding:8px 12px">침대 ${b.id}</td>
        <td style="padding:8px 12px">
          ${isVacant
            ? `<span style="font-size:11.5px;color:#059669;font-weight:600">공실</span>`
            : `<span style="font-size:12px;font-weight:600;color:#111827">${b.student}</span><span style="font-size:10.5px;color:#9CA3AF;margin-left:8px">${b.start || ''} ~ ${b.end || ''}</span>`
          }
        </td>
        <td style="text-align:right;padding:8px 12px;width:80px">
          ${isVacant && canAssign
            ? (isSelected
                ? `<span style="font-size:11px;font-weight:600;color:#5E5CE6;background:#EEF2FF;border-radius:6px;padding:3px 10px;white-space:nowrap">✓ 선택됨</span>`
                : `<button onclick="selectDormRoomBed('${room.roomNo}','${b.id}')" style="font-size:11px;font-weight:600;background:#EEF2FF;color:#4F46E5;border:none;border-radius:6px;padding:3px 10px;cursor:pointer;white-space:nowrap">선택</button>`
              )
            : ''
          }
        </td>
      </tr>`;
    }).join('');

    return `<div style="border:1.5px solid ${headerBorder};border-radius:10px;overflow:hidden;margin-bottom:10px">
      <div style="background:${headerBg};padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid ${headerBorder}">
        <span style="font-size:13px;font-weight:700;color:#111827">Room ${room.roomNo}</span>
        <span style="font-size:11px;color:${accomColor};background:${accomColor}18;padding:2px 8px;border-radius:6px;font-weight:600">${accomType}</span>
        <span style="font-size:11.5px;color:#6B7280">${capacity}인실 ${grade}</span>
        ${room.genderRestriction ? `<span style="font-size:11px;color:#374151;background:#F3F4F6;padding:2px 7px;border-radius:6px">${room.genderRestriction}</span>` : ''}
        <span style="font-size:11.5px;color:#6B7280;margin-left:2px">${occupiedBeds}/${totalBeds} 사용 중</span>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
          ${badge}
          <button onclick="toggleDamRoomDetail('${roomIdx}')" style="font-size:11px;color:#6B7280;background:#fff;border:1.5px solid #E5E7EB;border-radius:6px;padding:4px 10px;cursor:pointer" id="${roomIdx}-toggle">접기</button>
        </div>
      </div>
      <div id="${roomIdx}-detail" style="display:block">
        <table style="width:100%;border-collapse:collapse;background:#fff">
          <tbody>${bedRows}</tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  if (typeof refreshIcons === 'function') refreshIcons();
}

function toggleDamRoomDetail(roomIdx) {
  const detail = document.getElementById(`${roomIdx}-detail`);
  const btn    = document.getElementById(`${roomIdx}-toggle`);
  if (!detail) return;
  const isOpen = detail.style.display !== 'none';
  detail.style.display = isOpen ? 'none' : 'block';
  if (btn) btn.textContent = isOpen ? '펼치기' : '접기';
}

function selectDormRoomBed(roomNo, bedId) {
  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (!room) return;

  // bedId 없이 호실 [배정] 클릭 시 → 첫 공실 침대 자동 선택
  if (!bedId) {
    const firstVacant = (room.beds || []).find(b => !b.student);
    if (!firstVacant) return;
    bedId = firstVacant.id;
  }

  _damSelectedBed = { roomNo, bedId };

  // 선택된 호실 자동 펼치기
  const roomIdx = `dam-room-${roomNo}`;
  const detail  = document.getElementById(`${roomIdx}-detail`);
  const btn     = document.getElementById(`${roomIdx}-toggle`);
  if (detail && detail.style.display === 'none') {
    detail.style.display = 'block';
    if (btn) btn.textContent = '접기';
  }

  // 확정 버튼 활성화
  const confirmBtn = document.getElementById('dam-confirm-btn');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.style.background = '#5E5CE6';
    confirmBtn.style.color = '#fff';
    confirmBtn.style.cursor = 'pointer';
  }
  const info = document.getElementById('dam-selected-info');
  if (info) info.innerHTML = `<span style="font-size:12px;color:#4F46E5;font-weight:600">✓ Room ${roomNo} · 침대 ${bedId} 선택됨</span>`;

  // 목록 재렌더 (선택 상태 반영)
  renderAssignRoomList();

  // 선택된 호실 다시 펼치기 (재렌더 후)
  setTimeout(() => {
    const d2 = document.getElementById(`${roomIdx}-detail`);
    const b2 = document.getElementById(`${roomIdx}-toggle`);
    if (d2) { d2.style.display = 'block'; if (b2) b2.textContent = '접기'; }
    if (typeof refreshIcons === 'function') refreshIcons();
  }, 0);
}

function confirmDormAssignFromModal() {
  if (!_damStudentId || !_damSelectedBed) return;
  const { roomNo, bedId } = _damSelectedBed;
  const student = MOCK_STUDENTS.find(s => s.id === _damStudentId);
  const room    = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (!student || !room) return;
  const bed = (room.beds || []).find(b => b.id === bedId);
  if (!bed) return;
  if (bed.student) { showToast('이미 배정된 침대입니다.', 'danger'); return; }

  // 학생 숙소 정보 업데이트 (셀렉트 값으로)
  const accomType = (document.getElementById('dam-accomType') || {}).value;
  const capacity  = (document.getElementById('dam-capacity') || {}).value;
  const grade     = (document.getElementById('dam-grade') || {}).value;
  const checkin   = (document.getElementById('dam-checkin') || {}).value;
  const checkout  = (document.getElementById('dam-checkout') || {}).value;

  bed.student   = `${student.nick} (${student.name})`;
  bed.start     = checkin || student.startDate;
  bed.end       = checkout || student.departureDate;
  bed.studentId = student.id;
  student.dorm           = `Room ${roomNo} / 침대 ${bedId}`;
  student.dormAccomType  = accomType;
  student.dormType       = `${capacity}인실`;
  student.dormGrade      = grade;
  if (checkin)  student.startDate      = checkin;
  if (checkout) student.departureDate  = checkout;

  // 변경 이력 자동 기록
  if (!student.changeRequests) student.changeRequests = [];
  student.changeRequests.push({
    id: Date.now(), field: '기숙사 배정', menu: '기숙사',
    from: '미배정', to: `Room ${roomNo} / 침대 ${bedId}`,
    reason: '어드민 직접 배정', changedBy: '슈퍼 어드민',
    requestDate: new Date().toISOString().slice(0,10)
  });

  closeModal('dorm-assign-modal');
  showToast(`✓ ${student.nick} → Room ${roomNo} / 침대 ${bedId} 배정 완료`, 'success');
  renderAdminDormAssign();
  renderAdminDormRoomsTable();
}

function confirmDormAssign(studentId) {
  const sel = document.getElementById(`assign-room-sel-${studentId}`);
  if (!sel || !sel.value) { showToast('호실과 침대를 선택하세요.', 'warning'); return; }

  const [roomNo, bedId] = sel.value.split('|');
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  const room    = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (!student || !room) return;

  const bed = room.beds.find(b => b.id === bedId);
  if (!bed) return;
  if (bed.student) { showToast('이미 배정된 침대입니다.', 'danger'); return; }

  bed.student   = `${student.nick} (${student.name})`;
  bed.start     = student.startDate;
  bed.end       = student.departureDate;
  bed.studentId = student.id;
  student.dorm  = `Room ${roomNo} / Bed ${bedId}`;

  showToast(`✓ ${student.nick} → Room ${roomNo} / Bed ${bedId} 배정 완료`, 'success');
  renderAdminDormAssign();
  renderDormAssignPending();
  renderAdminDormRoomsTable();
}

function renderAdminDormRoomsTable() {
  const tbody = document.getElementById('admin-dorm-rooms-tbody');
  if (!tbody) return;

  const filteredRooms = (typeof getFilteredDormRooms === 'function') ? getFilteredDormRooms() : MOCK_DORM_ROOMS;
  tbody.innerHTML = filteredRooms.map((r, roomIdx) => {
    // 원본 인덱스 (패널 열기 등에 사용)
    roomIdx = MOCK_DORM_ROOMS.indexOf(r);
    const capacity = r.beds ? r.beds.length : r.capacity;
    const occupiedCount = r.beds ? r.beds.filter(b => b.student).length : 0;
    const isUnassigned = !r.roomNo;

    // 방 유형: "N인실·등급" 형태 (type = "2인실 (이코노미)" → "2인실·이코노미")
    const roomTypeLabel = r.type ? r.type.replace(/\s*\(([^)]+)\)/, '·$1') : '-';

    const accomBadge = (r.accomType === '콘도')
      ? `<span style="background:#FEF3C7;color:#D97706;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600">콘도</span>`
      : `<span style="background:#EEF2FF;color:#5E5CE6;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:600">기숙사</span>`;

    const roomNoCell = isUnassigned
      ? `<span style="background:#F3F4F6;color:#9CA3AF;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">미배정</span>`
      : `<strong>Room ${r.roomNo}</strong>`;

    // 상태 배지
    let statusBadge = '';
    if (isUnassigned) {
      statusBadge = `<span style="font-size:11px;color:#9CA3AF;background:#F3F4F6;padding:3px 9px;border-radius:10px">미배정</span>`;
    } else if (occupiedCount > 0) {
      statusBadge = `<span style="font-size:11px;font-weight:700;color:#059669;background:#D1FAE5;padding:3px 9px;border-radius:10px">확정 ${occupiedCount}명</span>`;
    } else {
      statusBadge = `<span style="font-size:11px;font-weight:700;color:#B45309;background:#FEF3C7;padding:3px 9px;border-radius:10px">공실 (배정 필요)</span>`;
    }

    // 침대별 상세 — 각 침대 클릭 시 이력 패널 오픈
    let bedsHtml = '';
    if (isUnassigned) {
      bedsHtml = `<span style="color:#9CA3AF;font-size:11px">호실 번호 배정 후 사용 가능</span>`;
    } else if (r.beds) {
      bedsHtml = r.beds.map(b => {
        if (b.student) {
          return `<div onclick="event.stopPropagation();openBedDetailPanel(${roomIdx},'${b.id}')"
            style="font-size:11.5px;color:#1E3A8A;margin-bottom:3px;cursor:pointer;padding:2px 5px;border-radius:4px;display:inline-block;hover:background:#EEF2FF">
            <strong>${b.id}:</strong> ${b.student} <span style="color:#6B7280">(${b.start}~${b.end})</span>
          </div>`;
        } else if (b.incoming) {
          return `<div onclick="event.stopPropagation();openBedDetailPanel(${roomIdx},'${b.id}')"
            style="font-size:11.5px;margin-bottom:3px;cursor:pointer;background:#FFFBEB;border:1px solid #FDE68A;border-radius:5px;padding:3px 7px;display:inline-block">
            <strong style="color:#92400E">${b.id}:</strong>
            <span style="color:#92400E">공실 → ${b.incoming.date} 입실예정</span>
            <span style="color:#B45309">(${b.incoming.student})</span>
          </div>`;
        } else {
          const lastInfo = b.lastCheckout
            ? `<span style="color:#9CA3AF">·최근 퇴실 ${b.lastCheckout}</span>`
            : '';
          return `<div onclick="event.stopPropagation();openBedDetailPanel(${roomIdx},'${b.id}')"
            style="font-size:11.5px;color:#9CA3AF;margin-bottom:3px;cursor:pointer;padding:2px 5px;border-radius:4px;display:inline-block">
            <strong>${b.id}:</strong> 공실 ${lastInfo}
          </div>`;
        }
      }).map(h => `<div>${h}</div>`).join('');
    }

    const actionBtns = isUnassigned
      ? `<button class="tsa-btn tsa-btn-xs" style="background:#5E5CE6;border:none;color:white;width:64px" onclick="openAssignRoomNumber(${roomIdx})">번호배정</button>`
      : `<button class="tsa-btn tsa-btn-danger tsa-btn-xs" style="background:#EF4444;border:none;color:white;width:64px;margin-bottom:4px" onclick="clearRoomReservations('${r.roomNo}')">비우기</button><button class="tsa-btn tsa-btn-xs" style="background:#6B7280;border:none;color:white;width:64px" onclick="openAssignRoomNumber(${roomIdx})">번호수정</button>`;

    return `
      <tr style="${isUnassigned ? 'background:#FAFAFA;' : ''}cursor:pointer" onclick="openRoomDetailModal(${roomIdx})" title="클릭하여 호실 상세 보기">
        <td style="padding-left:12px">${accomBadge}</td>
        <td>${roomNoCell}</td>
        <td style="font-size:12px;font-weight:600">${roomTypeLabel}</td>
        <td style="font-size:12px;color:#374151">${r.genderRestriction || '무관'}</td>
        <td style="font-size:12px">${isUnassigned ? '-' : `${occupiedCount} / ${capacity}명`}</td>
        <td>${statusBadge}</td>
        <td style="line-height:1.6">${bedsHtml}</td>
        <td style="text-align:center" onclick="event.stopPropagation()">
          <div style="display:flex;flex-direction:column;gap:4px;align-items:center">${actionBtns}</div>
        </td>
      </tr>
    `;
  }).join('');

  if (typeof refreshIcons === 'function') refreshIcons();
}

/* ─── 번호 배정 모달 ─── */
function openAssignRoomNumber(roomIdx) {
  const room = MOCK_DORM_ROOMS[roomIdx];
  if (!room) return;

  const current = room.roomNo || '';
  const newNo = window.prompt(
    `호실 번호를 입력하세요.\n유형: ${room.type || '-'} · ${room.accomType || ''}\n현재: ${current || '미배정'}`,
    current
  );
  if (newNo === null) return; // 취소
  const trimmed = newNo.trim();
  if (!trimmed) { showToast('호실 번호를 입력해주세요.', 'warning'); return; }

  // 중복 체크
  const dup = MOCK_DORM_ROOMS.find((r, i) => i !== roomIdx && r.roomNo === trimmed);
  if (dup) { showToast(`Room ${trimmed}은 이미 다른 호실에 배정되어 있습니다.`, 'danger'); return; }

  room.roomNo = trimmed;
  showToast(`Room ${trimmed} 호실 번호 배정 완료`, 'success');
  renderAdminDormRoomsTable();
}

/* ─── 호실 상세 모달 (클릭) ─── */
function openRoomDetailModal(roomIdx) {
  const room = MOCK_DORM_ROOMS[roomIdx];
  if (!room || !room.roomNo) return; // 미배정 방은 클릭 무시

  const typeLabel = room.type ? room.type.replace(/\s*\(([^)]+)\)/, '·$1') : '-';
  const beds = room.beds || [];
  const occupiedCount = beds.filter(b => b.student).length;

  const bedRows = beds.map(b => {
    if (b.student) {
      return `<tr>
        <td style="font-size:12px;font-weight:600;padding:8px 14px;width:60px">침대 ${b.id}</td>
        <td style="padding:8px 14px"><span style="font-weight:600;color:#111827">${b.student}</span></td>
        <td style="font-size:11.5px;color:#6B7280;white-space:nowrap;padding:8px 14px">${b.start || ''} ~ ${b.end || ''}</td>
        <td style="padding:8px 14px"><span style="font-size:11px;background:#D1FAE5;color:#059669;padding:2px 8px;border-radius:6px;font-weight:600">입실 중</span></td>
      </tr>`;
    } else if (b.incoming) {
      return `<tr>
        <td style="font-size:12px;font-weight:600;padding:8px 14px">침대 ${b.id}</td>
        <td style="padding:8px 14px"><span style="color:#92400E">${b.incoming.student}</span></td>
        <td style="font-size:11.5px;color:#6B7280;padding:8px 14px">${b.incoming.date} 입실 예정</td>
        <td style="padding:8px 14px"><span style="font-size:11px;background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:6px;font-weight:600">입실예정</span></td>
      </tr>`;
    } else {
      return `<tr>
        <td style="font-size:12px;font-weight:600;padding:8px 14px">침대 ${b.id}</td>
        <td colspan="2" style="font-size:11.5px;color:#9CA3AF;padding:8px 14px">공실</td>
        <td style="padding:8px 14px"><span style="font-size:11px;background:#F3F4F6;color:#6B7280;padding:2px 8px;border-radius:6px">공실</span></td>
      </tr>`;
    }
  }).join('');

  // 간단한 모달로 표시
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:2000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:14px;min-width:520px;max-width:600px;box-shadow:0 20px 60px rgba(0,0,0,0.2);overflow:hidden" onclick="event.stopPropagation()">
      <div style="padding:16px 20px;border-bottom:1px solid #F3F4F6;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:15px;font-weight:800;color:#111827">Room ${room.roomNo}</div>
          <div style="font-size:12px;color:#6B7280;margin-top:2px">${typeLabel} · ${room.accomType} · ${room.genderRestriction || '무관'} · ${occupiedCount}/${beds.length} 사용 중</div>
        </div>
        <button id="_room-detail-close" style="background:none;border:none;cursor:pointer;font-size:18px;color:#9CA3AF">✕</button>
      </div>
      <div style="padding:0">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead>
            <tr style="background:#F9FAFB">
              <th style="padding:10px 14px;text-align:left;font-size:11.5px;color:#6B7280;font-weight:600;width:70px">침대</th>
              <th style="padding:10px 14px;text-align:left;font-size:11.5px;color:#6B7280;font-weight:600">학생</th>
              <th style="padding:10px 14px;text-align:left;font-size:11.5px;color:#6B7280;font-weight:600">기간</th>
              <th style="padding:10px 14px;text-align:left;font-size:11.5px;color:#6B7280;font-weight:600">상태</th>
            </tr>
          </thead>
          <tbody>${bedRows}</tbody>
        </table>
      </div>
      <div style="padding:12px 20px;border-top:1px solid #F3F4F6;text-align:right">
        <button id="_room-detail-close2" style="font-size:13px;font-weight:600;padding:7px 18px;border:1.5px solid #E5E7EB;border-radius:8px;background:#fff;color:#374151;cursor:pointer">닫기</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', () => overlay.remove());
  overlay.querySelector('#_room-detail-close').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#_room-detail-close2').addEventListener('click', () => overlay.remove());
}

/* ─── 침대 이력 슬라이드 패널 ─── */
function openBedDetailPanel(roomIdx, bedId) {
  const room = MOCK_DORM_ROOMS[roomIdx];
  if (!room) return;
  const bed = (room.beds || []).find(b => b.id === bedId);
  if (!bed) return;

  // 헤더
  const typeLabel = room.type ? room.type.replace(/\s*\(([^)]+)\)/, '·$1') : room.type;
  document.getElementById('bdp-title').textContent = `Room ${room.roomNo} · Bed ${bed.id}`;
  document.getElementById('bdp-subtitle').textContent = `${typeLabel} · ${room.genderRestriction || '무관'}`;

  // 현재 상태
  const statusEl = document.getElementById('bdp-current-status');
  if (bed.student) {
    const stu = MOCK_STUDENTS.find(x => x.id === bed.studentId) || {};
    const birthYear = stu.birth ? parseInt(stu.birth.slice(0,4)) : null;
    const age = birthYear ? (new Date().getFullYear() - birthYear) : null;
    const ageStr = age ? `만 ${age}세` : '';
    const flagStr = stu.flag || '';
    const natStr = stu.nationality || '';
    statusEl.style.cssText = 'background:#D1FAE5;border:1px solid #6EE7B7;border-radius:8px;padding:12px 14px;margin-bottom:16px';
    statusEl.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:#065F46">입실 중</div>
      <div style="font-size:13px;font-weight:700;color:#064E3B;margin-top:6px">${bed.student}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:4px;flex-wrap:wrap">
        ${natStr ? `<span style="font-size:11.5px;color:#047857">${flagStr} ${natStr}</span>` : ''}
        ${ageStr ? `<span style="font-size:11px;color:#6B7280">·</span><span style="font-size:11.5px;color:#047857">${ageStr}</span>` : ''}
      </div>
      <div style="font-size:11px;color:#6B7280;margin-top:4px">${bed.start} ~ ${bed.end}</div>`;
  } else if (bed.incoming) {
    statusEl.style.cssText = 'background:#FFFBEB;border:1px solid #FDE68A;border-radius:8px;padding:12px 14px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between';
    statusEl.innerHTML = `
      <div>
        <div style="font-size:12px;color:#92400E;font-weight:700">공실 → 입실예정</div>
        <div style="font-size:12px;color:#78350F;margin-top:4px">${bed.incoming.student} · ${bed.incoming.date} 입실</div>
      </div>
      <i data-lucide="calendar" style="color:#D97706;width:20px;height:20px;flex-shrink:0"></i>`;
  } else {
    const info = bed.lastCheckout ? `최근 퇴실 · ${bed.lastCheckout}` : '현재 거주자 없음';
    statusEl.style.cssText = 'background:#F3F4F6;border:1px solid #E5E7EB;border-radius:8px;padding:12px 14px;margin-bottom:16px';
    statusEl.innerHTML = `
      <div style="font-size:12px;font-weight:700;color:#6B7280">공실</div>
      <div style="font-size:11.5px;color:#9CA3AF;margin-top:4px">${info}</div>`;
  }

  // 거주 이력
  const history = (bed.history || []).slice().reverse(); // 최신 순
  const listEl = document.getElementById('bdp-history-list');
  const moreEl = document.getElementById('bdp-history-more');
  const SHOW_COUNT = 3;

  const reasonColors = {
    '졸업':    { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
    '호실이동': { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    '중도퇴소': { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
  };

  const renderHistory = (items) => items.map(h => {
    const rc = reasonColors[h.reason] || { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
    const reasonBadge = h.reason
      ? `<span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:8px;background:${rc.bg};color:${rc.color};border:1px solid ${rc.border};white-space:nowrap">${h.reason}</span>`
      : '';
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F3F4F6">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:6px;height:6px;border-radius:50%;background:#D1D5DB;flex-shrink:0;display:inline-block"></span>
          <div>
            <div style="font-size:12.5px;font-weight:600;color:#111827">${h.student}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:1px">${h.start} ~ ${h.end}</div>
          </div>
        </div>
        ${reasonBadge}
      </div>`;
  }).join('');

  if (history.length === 0) {
    listEl.innerHTML = `<div style="font-size:12px;color:#9CA3AF;padding:12px 0">이력 없음</div>`;
    moreEl.style.display = 'none';
  } else if (history.length <= SHOW_COUNT) {
    listEl.innerHTML = renderHistory(history);
    moreEl.style.display = 'none';
  } else {
    listEl.innerHTML = renderHistory(history.slice(0, SHOW_COUNT));
    moreEl.style.display = 'block';
    moreEl.textContent = `전체 이력 더보기 (${history.length}건)`;
    moreEl.onclick = () => {
      listEl.innerHTML = renderHistory(history);
      moreEl.style.display = 'none';
    };
  }

  document.getElementById('bed-detail-overlay').style.display = 'block';
  document.getElementById('bed-detail-panel').style.display = 'block';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeBedDetailPanel() {
  document.getElementById('bed-detail-overlay').style.display = 'none';
  document.getElementById('bed-detail-panel').style.display = 'none';
}

let _editingRoomIdx = null;

function openAssignRoomNumber(idx) {
  _editingRoomIdx = idx;
  const room = MOCK_DORM_ROOMS[idx];
  const input = document.getElementById('room-assign-number-input');
  const genderSel = document.getElementById('room-assign-gender-select');
  const label = document.getElementById('room-assign-form-label');
  if (!input) return;
  input.value = room.roomNo || '';
  if (genderSel) genderSel.value = room.genderRestriction || '무관';
  if (label) label.textContent = `[${room.accomType}] ${room.type} — 호실 번호 ${room.roomNo ? '수정' : '배정'}`;
  document.getElementById('room-assign-form-wrap').style.display = 'block';
  const bd = document.getElementById('room-assign-backdrop');
  if (bd) bd.style.display = 'block';
  input.focus();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function saveRoomNumber() {
  if (_editingRoomIdx === null) return;
  const input = document.getElementById('room-assign-number-input');
  const genderSel = document.getElementById('room-assign-gender-select');
  const newNo = (input.value || '').trim();
  if (!newNo) { showToast('호실 번호를 입력하세요.', 'warning'); return; }
  const conflict = MOCK_DORM_ROOMS.find((r, i) => i !== _editingRoomIdx && r.roomNo === newNo);
  if (conflict) { showToast('이미 사용 중인 호실 번호입니다.', 'warning'); return; }
  const room = MOCK_DORM_ROOMS[_editingRoomIdx];
  const oldNo = room.roomNo;
  room.roomNo = newNo;
  if (genderSel) room.genderRestriction = genderSel.value;
  showToast(`✓ ${oldNo ? `Room ${oldNo} → ` : ''}Room ${newNo} 번호가 ${oldNo ? '수정' : '배정'}되었습니다.`, 'success');
  _editingRoomIdx = null;
  document.getElementById('room-assign-form-wrap').style.display = 'none';
  const bd = document.getElementById('room-assign-backdrop');
  if (bd) bd.style.display = 'none';
  renderAdminDormRoomsTable();
  if (typeof renderDormErpGrid === 'function') renderDormErpGrid();
  if (typeof initDormGantt === 'function') initDormGantt();
}

function cancelAssignRoomNumber() {
  _editingRoomIdx = null;
  document.getElementById('room-assign-form-wrap').style.display = 'none';
  const bd = document.getElementById('room-assign-backdrop');
  if (bd) bd.style.display = 'none';
}

function clearRoomReservations(roomNo) {
  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (room && room.beds) {
    room.beds.forEach(b => { b.student = null; b.start = null; b.end = null; b.studentId = null; });
    showToast(`✓ Room ${roomNo}의 모든 예약이 취소되었습니다.`, 'success');
    renderAdminDormRoomsTable();
    initDormGantt();
  }
}

/* ─── Room 상세 모달 ─── */
let _currentRoomIdx = null;

function openRoomDetailModal(idx) {
  const room = MOCK_DORM_ROOMS[idx];
  if (!room) return;
  _currentRoomIdx = idx;

  const displayNo = room.roomNo || '미배정';
  document.getElementById('rdm-title').innerHTML = `<i data-lucide="home"></i> Room ${displayNo}`;
  document.getElementById('rdm-subtitle').textContent = `${room.accomType || ''} · ${room.type} · ${room.genderRestriction || '무관'}`;
  document.getElementById('rdm-roomno').value = room.roomNo || '';
  document.getElementById('rdm-accomtype').value = room.accomType || '가든 호텔';
  document.getElementById('rdm-type').value = room.type || '';
  document.getElementById('rdm-gender').value = room.genderRestriction || '무관';

  // 호실 번호가 이미 배정된 방은 유형/성별 변경 불가
  const isAssigned = !!room.roomNo;
  const lockStyle = isAssigned ? 'opacity:0.5;pointer-events:none;background:#F3F4F6' : '';
  ['rdm-accomtype','rdm-type','rdm-gender'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = isAssigned; el.style.cssText = lockStyle; }
  });
  const lockNote = document.getElementById('rdm-lock-note');
  if (lockNote) lockNote.style.display = isAssigned ? 'block' : 'none';

  // 침대 현황
  const bedsList = document.getElementById('rdm-beds-list');
  bedsList.innerHTML = (room.beds || []).map(b => {
    const occupied = b.student;
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:${occupied ? '#EEF2FF' : '#F9FAFB'};border-radius:7px;border:1px solid ${occupied ? '#C7D2FE' : '#E5E7EB'}">
      <span style="font-size:11px;font-weight:700;color:#6B7280;width:50px">Bed ${b.id}</span>
      ${occupied
        ? `<span style="font-size:12px;font-weight:600;color:#1E3A8A;flex:1">${b.student}</span><span style="font-size:10px;color:#6B7280">${b.start} ~ ${b.end}</span>`
        : `<span style="font-size:12px;color:#9CA3AF;flex:1">공실</span><button style="font-size:11px;padding:3px 10px;background:#5E5CE6;color:white;border:none;border-radius:5px;cursor:pointer" onclick="closeModal('room-detail-modal');openBedAssignModal(${idx},'${b.id}')">배정</button>`}
    </div>`;
  }).join('');

  document.getElementById('room-detail-modal').style.display = 'block';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function saveRoomDetailInfo() {
  const room = MOCK_DORM_ROOMS[_currentRoomIdx];
  if (!room) return;
  const newNo = document.getElementById('rdm-roomno').value.trim();
  if (!newNo) { showToast('호실 번호를 입력하세요.', 'warning'); return; }
  const conflict = MOCK_DORM_ROOMS.find((r, i) => r.roomNo === newNo && i !== _currentRoomIdx);
  if (conflict) { showToast('이미 사용 중인 호실 번호입니다.', 'warning'); return; }
  room.roomNo = newNo;
  room.accomType = document.getElementById('rdm-accomtype').value;
  room.type = document.getElementById('rdm-type').value;
  room.genderRestriction = document.getElementById('rdm-gender').value;
  showToast(`✓ Room ${newNo} 정보가 저장되었습니다.`, 'success');
  closeModal('room-detail-modal');
  renderAdminDormRoomsTable();
  initDormGantt();
}

function calcRoomElec() {
  const room = MOCK_DORM_ROOMS[_currentRoomIdx];
  if (!room) return;
  const total = parseFloat(document.getElementById('rdm-elec-total').value) || 0;
  const occupiedCnt = (room.beds || []).filter(b => b.student).length;
  const box = document.getElementById('rdm-elec-result');
  if (!total || occupiedCnt === 0) { box.innerHTML = '<span style="color:#9CA3AF">요금과 입실 인원을 확인하세요.</span>'; return; }
  const perPerson = Math.round(total / occupiedCnt);
  box.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>총 전기 요금</span><strong>₱${total.toLocaleString()}</strong></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>현재 체류 인원</span><strong>${occupiedCnt}명</strong></div>
    <div style="display:flex;justify-content:space-between;color:#D97706;font-weight:700;font-size:13px"><span>1인당 부담금</span><strong>₱${perPerson.toLocaleString()}</strong></div>`;
}

function calcRoomLaundry() {
  const weight = parseFloat(document.getElementById('rdm-laundry-weight').value) || 0;
  const RATE = 70;
  const box = document.getElementById('rdm-laundry-result');
  if (!weight) { box.innerHTML = ''; return; }
  const charge = Math.round(weight * RATE);
  box.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>실측 무게</span><strong>${weight} kg</strong></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span>kg당 단가</span><strong>₱${RATE}</strong></div>
    <div style="display:flex;justify-content:space-between;color:#0EA5E9;font-weight:700;font-size:13px"><span>총 과금액</span><strong>₱${charge.toLocaleString()}</strong></div>`;
}

/* ─── 공실 배정 모달 ─── */
let _assignTarget = { roomIdx: null, bedId: null };

function openBedAssignModal(idx, bedId, afterDate) {
  _assignTarget = { roomIdx: idx, bedId, isPrebook: !!afterDate };
  const room = MOCK_DORM_ROOMS[idx];
  const displayNo = room && room.roomNo ? room.roomNo : '미배정';
  const isPrebook = !!afterDate;

  const subtitle = isPrebook
    ? `Room ${displayNo} · Bed ${bedId} · 사전 예약`
    : `Room ${displayNo} · ${room ? room.type : ''} · Bed ${bedId}`;
  document.getElementById('bam-subtitle').textContent = subtitle;

  const accomBadge = room && room.accomType === 'IT Park 콘도' ? 'IT Park 콘도' : '가든 호텔';
  document.getElementById('bam-room-info').innerHTML =
    `<strong>${accomBadge}</strong> · ${room ? room.type : ''} · ${room ? (room.genderRestriction || '무관') : ''} · <strong>Bed ${bedId}</strong>`
    + (isPrebook ? ` · <span style="color:#7C3AED;font-weight:700">📋 사전 예약</span>` : '');

  // 사전 예약이면 체크인을 퇴실일 다음날로 자동 세팅
  if (isPrebook && afterDate) {
    const nextDay = new Date(`${_ganttYear}-${afterDate}`);
    nextDay.setDate(nextDay.getDate() + 1);
    const fmt = d => d.toISOString().slice(0, 10);
    document.getElementById('bam-checkin').value  = fmt(nextDay);
    const defaultOut = new Date(nextDay);
    defaultOut.setDate(defaultOut.getDate() + 28);
    document.getElementById('bam-checkout').value = fmt(defaultOut);
  } else {
    document.getElementById('bam-checkin').value  = '';
    document.getElementById('bam-checkout').value = '';
  }

  document.getElementById('bam-search').value = '';
  document.getElementById('bam-results').innerHTML = '<div style="padding:12px;font-size:12px;color:#9CA3AF;text-align:center">학생 이름 또는 여권번호를 입력하세요</div>';
  document.getElementById('bam-selected-student').style.display = 'none';
  document.getElementById('bam-selected-student').dataset.studentId = '';
  document.getElementById('bed-assign-modal').style.display = 'block';
  if (typeof refreshIcons === 'function') refreshIcons();
  setTimeout(() => document.getElementById('bam-search').focus(), 100);
}

function searchBamStudents() {
  const q = (document.getElementById('bam-search').value || '').toLowerCase().trim();
  const box = document.getElementById('bam-results');
  if (!q) { box.innerHTML = '<div style="padding:12px;font-size:12px;color:#9CA3AF;text-align:center">검색어를 입력하세요</div>'; return; }
  const matched = MOCK_STUDENTS.filter(s =>
    s.name.toLowerCase().includes(q) || s.nick.toLowerCase().includes(q) || (s.passportNum || '').toLowerCase().includes(q)
  );
  if (!matched.length) { box.innerHTML = '<div style="padding:12px;font-size:12px;color:#9CA3AF;text-align:center">검색 결과가 없습니다</div>'; return; }

  const assignedStudentIds = new Set();
  MOCK_DORM_ROOMS.forEach(r => r.beds && r.beds.forEach(b => { if (b.studentId) assignedStudentIds.add(b.studentId); }));

  box.innerHTML = matched.map(s => {
    const alreadyAssigned = assignedStudentIds.has(s.id);
    const assignedRoom = alreadyAssigned ? MOCK_DORM_ROOMS.find(r => r.beds && r.beds.some(b => b.studentId === s.id)) : null;
    const assignedInfo = assignedRoom ? `Room ${assignedRoom.roomNo} 배정중` : '';
    return `<div onclick="${alreadyAssigned ? '' : `selectBamStudent(${s.id})`}"
      style="padding:10px 14px;border-bottom:1px solid #F3F4F6;cursor:${alreadyAssigned ? 'default' : 'pointer'};display:flex;align-items:center;gap:10px;background:${alreadyAssigned ? '#F9FAFB' : 'white'}"
      onmouseover="${alreadyAssigned ? '' : "this.style.background='#F0F9FF'"}" onmouseout="${alreadyAssigned ? '' : "this.style.background='white'"}">
      <div style="width:30px;height:30px;border-radius:50%;background:${alreadyAssigned ? '#E5E7EB' : '#EEF2FF'};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:${alreadyAssigned ? '#9CA3AF' : '#5E5CE6'};flex-shrink:0">${s.nick[0] || '?'}</div>
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:${alreadyAssigned ? '#9CA3AF' : '#1A1D23'}">${s.nick} (${s.name})</div>
        <div style="font-size:10px;color:#9CA3AF">${s.gender}성 · ${s.passportNum || '여권번호 없음'}${assignedInfo ? ' · <span style="color:#F59E0B">' + assignedInfo + '</span>' : ''}</div>
      </div>
      ${alreadyAssigned ? '' : '<span style="font-size:10px;color:#5E5CE6;font-weight:600">선택</span>'}
    </div>`;
  }).join('');
}

function selectBamStudent(studentId) {
  const s = MOCK_STUDENTS.find(st => st.id === studentId);
  if (!s) return;
  const el = document.getElementById('bam-selected-student');
  el.style.display = 'block';
  el.dataset.studentId = studentId;
  el.innerHTML = `✓ 선택된 학생: <strong>${s.nick} (${s.name})</strong> · ${s.gender}성`;
  document.getElementById('bam-search').value = s.nick + ' (' + s.name + ')';
  document.getElementById('bam-results').innerHTML = '';
}

function confirmBedAssign() {
  const el = document.getElementById('bam-selected-student');
  const studentId = parseInt(el.dataset.studentId);
  const checkin  = document.getElementById('bam-checkin').value;
  const checkout = document.getElementById('bam-checkout').value;
  if (!studentId) { showToast('배정할 학생을 선택하세요.', 'warning'); return; }
  if (!checkin || !checkout) { showToast('체크인/체크아웃 날짜를 입력하세요.', 'warning'); return; }
  if (checkin >= checkout) { showToast('체크아웃은 체크인보다 이후여야 합니다.', 'warning'); return; }

  const s = MOCK_STUDENTS.find(st => st.id === studentId);
  const room = MOCK_DORM_ROOMS[_assignTarget.roomIdx];
  const bed  = room && room.beds && room.beds.find(b => b.id === _assignTarget.bedId);
  if (!bed) { showToast('침대 정보를 찾을 수 없습니다.', 'error'); return; }

  const checkinMD  = checkin.slice(5);
  const checkoutMD = checkout.slice(5);
  const displayNo  = room.roomNo || '미배정';

  if (_assignTarget.isPrebook) {
    if (!bed.reservations) bed.reservations = [];
    const overlap = bed.reservations.some(rv => !(checkoutMD <= rv.start || checkinMD >= rv.end));
    if (overlap) { showToast('선택한 기간에 이미 사전 예약이 있습니다.', 'warning'); return; }
    bed.reservations.push({ student: `${s.nick} (${s.name})`, studentId: s.id, start: checkinMD, end: checkoutMD });
    showToast(`✓ Room ${displayNo} Bed ${_assignTarget.bedId}에 ${s.nick} 사전 예약 완료`, 'success');
  } else {
    bed.student   = `${s.nick} (${s.name})`;
    bed.studentId = s.id;
    bed.start     = checkinMD;
    bed.end       = checkoutMD;
    // 8-5: 배정 시 호실 성별 제한 자동 갱신
    if (s.gender === '남' || s.gender === '남성') room.genderRestriction = '남성';
    else if (s.gender === '여' || s.gender === '여성') room.genderRestriction = '여성';
    showToast(`✓ Room ${displayNo} Bed ${_assignTarget.bedId}에 ${s.nick} 배정 완료`, 'success');
  }
  closeModal('bed-assign-modal');
  renderAdminDormRoomsTable();
  initDormGantt();
}

function searchDormVacancyForAssign() {
  const startVal = document.getElementById('dorm-assign-start').value;
  const endVal = document.getElementById('dorm-assign-end').value;

  if (!startVal || !endVal) {
    showToast('시작일과 종료일을 입력하세요.', 'warning');
    return;
  }

  const available = getAvailableRoomsForPeriod(startVal, endVal);
  const select = document.getElementById('dorm-assign-room');
  if (select) {
    if (available.length === 0) {
      select.innerHTML = `<option value="">해당 기간에 사용 가능한 방이 없습니다</option>`;
      return;
    }
    
    select.innerHTML = available.map(r => {
      return `<option value="${r.roomNo}|${r.freeBeds[0]}">Room ${r.roomNo} (${r.type}) - 침대 ${r.freeBeds[0]} 가능</option>`;
    }).join('');
  }
  showToast('✓ 배정 가능한 호실을 검색하여 반영했습니다.', 'success');
}

function confirmDormAssign() {
  const studentId = parseInt(document.getElementById('dorm-assign-student').value);
  const startVal = document.getElementById('dorm-assign-start').value;
  const endVal = document.getElementById('dorm-assign-end').value;
  const roomBedVal = document.getElementById('dorm-assign-room').value;

  if (!roomBedVal || roomBedVal.includes('검색') || roomBedVal === "") {
    showToast('배정할 방을 먼저 검색 및 선택하세요.', 'warning');
    return;
  }

  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  const parts = roomBedVal.split('|');
  const roomNo = parts[0];
  const bedId = parts[1];

  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (room && s) {
    const startM = startVal.substring(5);
    const endM = endVal.substring(5);
    
    const bed = room.beds.find(b => b.id === bedId);
    if (bed) {
      bed.student = `${s.nick} (${s.name})`;
      bed.start = startM;
      bed.end = endM;
      bed.color = s.gender === '남' ? '#5E5CE6' : '#EF4444';
      bed.studentId = s.id;
      
      s.dorm = `Room ${roomNo} / Bed ${bedId}`;
      s.arrivalDate = startVal;
      s.endDate = endVal;
      
      showToast(`✓ Room ${roomNo}의 Bed ${bedId}에 ${s.nick} 학생이 배정 확정되었습니다.`, 'success');
      renderAdminDormRoomsTable();
      initDormGantt();
      initStudentList();
    }
  }
}

// Unified Calendar Engine
let currentCalendarDate = new Date('2026-06-15');
let currentCalendarFilter = null; // 'start', 'departure', 'arrival', 'end', 'resigned', 'visa', 'ssp' 또는 null (전체)

function toggleCalendarFilter(type) {
  if (currentCalendarFilter === type) {
    currentCalendarFilter = null;
  } else {
    currentCalendarFilter = type;
  }

  const isAdminView = !!document.getElementById('view-dashboard')?.classList.contains('active');
  if (isAdminView) {
    renderUnifiedCalendar('admin-calendar-grid', 'admin-calendar-month-year', 'admin-calendar-events-list', null);
    const labelEl = document.getElementById('admin-selected-date-label');
    if (labelEl && labelEl.textContent) {
      selectCalendarDate(labelEl.textContent, 'admin-calendar-events-list', null);
    }
  } else {
    renderUnifiedCalendar('agency-calendar-grid', 'agency-calendar-month-year', 'agency-calendar-events-list', '한국 영어마을');
    const labelEl = document.getElementById('agency-selected-date-label');
    if (labelEl && labelEl.textContent) {
      selectCalendarDate(labelEl.textContent, 'agency-calendar-events-list', '한국 영어마을');
    }
  }
}

function renderUnifiedCalendar(gridId, labelId, listId, agencyFilter = null) {
  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const labelEl = document.getElementById(labelId);
  if (labelEl) labelEl.textContent = `${year}년 ${month + 1}월`;

  const gridEl = document.getElementById(gridId);
  if (!gridEl) return;
  gridEl.innerHTML = '';

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  // 1. 해당 월(1일~말일)의 범례별 발생 총 합계 인원 집계
  const stats = {
    start: 0,
    departure: 0,
    arrival: 0,
    end: 0,
    resigned: 0,
    visa: 0,
    ssp: 0
  };
  for (let d = 1; d <= totalDays; d++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const evts = getEventsForDate(dStr, agencyFilter);
    evts.forEach(evt => {
      if (stats[evt.type] !== undefined) {
        stats[evt.type]++;
      }
    });
  }

  // 2. 범례 HTML 동적 생성
  const legendId = (agencyFilter) ? 'agency-calendar-legend' : 'admin-calendar-legend';
  const legendEl = document.getElementById(legendId);
  if (legendEl) {
    const legendItems = [
      { type: 'start',     label: '신규 등록', color: '#3B82F6' },
      { type: 'departure', label: '현지 출발', color: '#6366F1' },
      { type: 'arrival',   label: '입국(도착)', color: '#10B981' },
      { type: 'end',       label: '졸업 예정', color: '#6B7280' },
      { type: 'resigned',  label: '퇴원 예정', color: '#EF4444' },
      { type: 'visa',      label: '비자 만료', color: '#F59E0B' },
      { type: 'ssp',       label: 'SSP 만료',  color: '#8B5CF6' }
    ];

    legendEl.innerHTML = legendItems.map(item => {
      const count = stats[item.type] || 0;
      const isFilterActive = currentCalendarFilter === item.type;
      const isAnyFilterActive = currentCalendarFilter !== null;

      let opacity = '1';
      let border = '1px solid transparent';
      let bg = 'transparent';

      if (isAnyFilterActive) {
        if (isFilterActive) {
          border = `1.5px solid ${item.color}`;
          bg = `${item.color}12`;
        } else {
          opacity = '0.4';
        }
      }

      return `
        <div onclick="toggleCalendarFilter('${item.type}')" 
          style="display:flex;align-items:center;justify-content:space-between;padding:5px 8px;border-radius:6px;
            border:${border};background:${bg};opacity:${opacity};cursor:pointer;transition:all 0.15s ease;"
          onmouseenter="this.style.background='rgba(0,0,0,0.03)'" 
          onmouseleave="this.style.background='${bg}'"
          title="${item.label} 필터링 (클릭 시 토글)">
          <div style="display:flex;align-items:center;gap:6px">
            <span style="width:8px;height:8px;border-radius:50%;background:${item.color};display:inline-block"></span>
            <span style="font-weight:700">${item.label}</span>
          </div>
          <strong style="color:${item.color};font-size:11.5px">${count}명</strong>
        </div>
      `;
    }).join('');

    const clearBtnId = (agencyFilter) ? 'btn-clear-calendar-filter' : 'btn-clear-admin-calendar-filter';
    const clearBtn = document.getElementById(clearBtnId);
    if (clearBtn) {
      clearBtn.style.display = (currentCalendarFilter) ? 'block' : 'none';
    }
  }

  // 캘린더 상단 월별 통계 버튼 (범례 대체) — 에이전시·어드민 공통
  const statsElId = agencyFilter ? 'agency-calendar-month-stats' : 'admin-calendar-month-stats';
  {
    const monthStatsEl = document.getElementById(statsElId);
    if (monthStatsEl) {
      const legendItems = [
        { type: 'start',     label: '신규 등록', color: '#3B82F6' },
        { type: 'arrival',   label: '입국',      color: '#10B981' },
        { type: 'departure', label: '현지 출발', color: '#6366F1' },
        { type: 'end',       label: '졸업 예정', color: '#6B7280' },
        { type: 'resigned',  label: '퇴원',      color: '#EF4444' },
        { type: 'visa',      label: '비자만료',  color: '#F59E0B' },
        { type: 'ssp',       label: 'SSP만료',   color: '#8B5CF6' },
      ];
      monthStatsEl.innerHTML = legendItems.map(item => {
        const count = stats[item.type] || 0;
        const isActive = currentCalendarFilter === item.type;
        const isEmpty = count === 0;
        return `<button onclick="${isEmpty ? '' : `toggleCalendarFilter('${item.type}')`}" style="
          display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;border:none;cursor:${isEmpty ? 'default' : 'pointer'};font-size:11px;font-weight:700;
          background:${isActive ? item.color : isEmpty ? '#F3F4F6' : item.color + '18'};
          color:${isActive ? '#fff' : isEmpty ? '#D1D5DB' : item.color};transition:all 0.15s;opacity:${isEmpty ? '0.6' : '1'}">
          <span style="width:6px;height:6px;border-radius:50%;background:${isActive ? '#fff' : isEmpty ? '#D1D5DB' : item.color};display:inline-block"></span>
          ${item.label} <strong>${count}</strong>
        </button>`;
      }).join('');
    }
  }

  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthTotalDays - i, month: month === 0 ? 11 : month - 1, year: month === 0 ? year - 1 : year, currentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) {
    cells.push({ day: i, month: month, year: year, currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    cells.push({ day: i, month: month === 11 ? 0 : month + 1, year: month === 11 ? year + 1 : year, currentMonth: false });
  }

  // 이번 달 최대 이벤트 타입 수 계산 → 행 높이 동적 설정
  let maxEventTypes = 0;
  cells.forEach(cell => {
    const ds = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    let evts = getEventsForDate(ds, agencyFilter);
    if (currentCalendarFilter) evts = evts.filter(e => e.type === currentCalendarFilter);
    const grouped = {};
    evts.forEach(e => { grouped[e.type] = true; });
    maxEventTypes = Math.max(maxEventTypes, Object.keys(grouped).length);
  });
  // 날짜 라벨 16px + 이벤트 행 18px each + 상하 패딩 8px, 최소 72px
  const rowH = Math.max(72, 16 + maxEventTypes * 18 + 12);
  gridEl.style.gridAutoRows = `${rowH}px`;

  cells.forEach(cell => {
    const cellDateStr = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    const isToday = cellDateStr === '2026-06-15';

    let events = getEventsForDate(cellDateStr, agencyFilter);
    if (currentCalendarFilter) {
      events = events.filter(evt => evt.type === currentCalendarFilter);
    }

    const cellEl = document.createElement('div');
    cellEl.style.border = '1px solid #E9EDF4';
    cellEl.style.borderRadius = '6px';
    cellEl.style.padding = '4px 6px';
    cellEl.style.cursor = 'pointer';
    cellEl.style.display = 'flex';
    cellEl.style.flexDirection = 'column';
    cellEl.style.background = cell.currentMonth ? '#ffffff' : '#F9FAFB';
    if (!cell.currentMonth) cellEl.style.color = '#9CA3AF';
    if (isToday) {
      cellEl.style.borderColor = '#5E5CE6';
      cellEl.style.background = '#EEF2FF';
    }

    cellEl.onclick = () => {
      gridEl.querySelectorAll('div').forEach(c => {
        c.style.boxShadow = 'none';
      });
      cellEl.style.boxShadow = '0 0 0 2px #5E5CE6';
      selectCalendarDate(cellDateStr, listId, agencyFilter);
    };

    const dateLabel = document.createElement('div');
    dateLabel.style.fontSize = '10.5px';
    dateLabel.style.fontWeight = '700';
    dateLabel.textContent = cell.day;
    cellEl.appendChild(dateLabel);

    const dotsContainer = document.createElement('div');
    dotsContainer.style.display = 'flex';
    dotsContainer.style.flexDirection = 'column';
    dotsContainer.style.gap = '2px';
    dotsContainer.style.marginTop = '3px';

    const grouped = {};
    events.forEach(evt => {
      if (!grouped[evt.type]) grouped[evt.type] = { label: evt.typeLabel, students: [] };
      grouped[evt.type].students.push(evt.studentNick);
    });

    Object.entries(grouped).forEach(([type, info]) => {
      const color = getEventColor(type);
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '3px';
      row.title = `${info.label}: ${info.students.join(', ')}`;

      const dot = document.createElement('span');
      dot.style.width = '5px';
      dot.style.height = '5px';
      dot.style.borderRadius = '50%';
      dot.style.background = color;
      dot.style.flexShrink = '0';

      const label = document.createElement('span');
      label.style.fontSize = '8.5px';
      label.style.fontWeight = '600';
      label.style.color = color;
      label.style.whiteSpace = 'nowrap';
      label.style.overflow = 'hidden';
      label.style.textOverflow = 'ellipsis';
      label.style.maxWidth = '72px';
      label.textContent = `${info.label} ${info.students.length}명`;

      row.appendChild(dot);
      row.appendChild(label);
      dotsContainer.appendChild(row);
    });

    cellEl.appendChild(dotsContainer);
    gridEl.appendChild(cellEl);
  });
}

function selectCalendarDate(dateStr, listId, agencyFilter = null) {
  const listEl = document.getElementById(listId);
  const labelEl = document.getElementById(listId === 'agency-calendar-events-list' ? 'agency-selected-date-label' : 'admin-selected-date-label');
  if (labelEl) labelEl.textContent = dateStr;

  if (!listEl) return;
  listEl.innerHTML = '';

  let events = getEventsForDate(dateStr, agencyFilter);
  if (currentCalendarFilter) {
    events = events.filter(evt => evt.type === currentCalendarFilter);
  }

  if (events.length === 0) {
    listEl.innerHTML = `<div style="text-align:center;padding:40px;color:#9CA3AF">이날은 이벤트 일정이 없습니다.</div>`;
    return;
  }

  events.forEach(evt => {
    const card = document.createElement('div');
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.justifyContent = 'space-between';
    card.style.padding = '10px 12px';
    card.style.background = '#F8F9FC';
    card.style.border = '1px solid #E9EDF4';
    card.style.borderRadius = '8px';

    const color = getEventColor(evt.type);
    const detailFn = listId === 'agency-calendar-events-list' ? 'openAgencyStudentDetailModal' : 'openStudentDetail';

    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px">
        <span style="width:8px;height:8px;border-radius:50%;background:${color};display:inline-block"></span>
        <div>
          <div style="font-weight:700;font-size:12px;color:#374151">${evt.studentNick} (${evt.studentName})</div>
          <div style="font-size:10.5px;color:#6B7280">${evt.typeLabel}</div>
        </div>
      </div>
      <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="${detailFn}(${evt.studentId})">
        보기
      </button>
    `;
    listEl.appendChild(card);
  });
}

function getEventsForDate(dateStr, agencyFilter = null) {
  const events = [];
  
  MOCK_STUDENTS.forEach(s => {
    if (agencyFilter && s.agency !== agencyFilter) return;

    if (s.startDate === dateStr) {
      events.push({ type: 'start', typeLabel: '신규 수업 시작', studentId: s.id, studentName: s.name, studentNick: s.nick });
    }
    if (s.departureDate && s.departureDate === dateStr && s.status !== 'completed' && s.status !== 'resigned') {
      events.push({ type: 'departure', typeLabel: '현지 출발일', studentId: s.id, studentName: s.name, studentNick: s.nick });
    }
    if (s.arrivalDate && s.arrivalDate === dateStr) {
      events.push({ type: 'arrival', typeLabel: '입국(도착)일', studentId: s.id, studentName: s.name, studentNick: s.nick });
    }
    if (s.endDate === dateStr) {
      events.push({ type: 'end', typeLabel: '졸업 예정일', studentId: s.id, studentName: s.name, studentNick: s.nick });
    }
    if (s.status === 'resigned' && (s.resignedDate === dateStr || s.departureDate === dateStr)) {
      events.push({ type: 'resigned', typeLabel: '퇴원일', studentId: s.id, studentName: s.name, studentNick: s.nick });
    }
    if (s.visaExpiry && s.visaExpiry === dateStr && s.visaExpiry !== '면제') {
      events.push({ type: 'visa', typeLabel: '비자 만료일', studentId: s.id, studentName: s.name, studentNick: s.nick });
    }
    if (s.sspExpiry && s.sspExpiry === dateStr && s.sspExpiry !== '면제') {
      events.push({ type: 'ssp', typeLabel: 'SSP 만료일', studentId: s.id, studentName: s.name, studentNick: s.nick });
    }
  });

  return events;
}

function getEventColor(type) {
  switch (type) {
    case 'start': return '#3B82F6';
    case 'departure': return '#6366F1';
    case 'arrival': return '#10B981';
    case 'end': return '#6B7280';
    case 'resigned': return '#EF4444';
    case 'visa': return '#F59E0B';
    case 'ssp': return '#8B5CF6';
    default: return '#D1D5DB';
  }
}

// Calendar Switch Month Helpers
function prevAgencyCalendarMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderUnifiedCalendar('agency-calendar-grid', 'agency-calendar-month-year', 'agency-calendar-events-list', '한국 영어마을');
}

function nextAgencyCalendarMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderUnifiedCalendar('agency-calendar-grid', 'agency-calendar-month-year', 'agency-calendar-events-list', '한국 영어마을');
}

function prevAdminCalendarMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderUnifiedCalendar('admin-calendar-grid', 'admin-calendar-month-year', 'admin-calendar-events-list', null);
}

function nextAdminCalendarMonth() {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderUnifiedCalendar('admin-calendar-grid', 'admin-calendar-month-year', 'admin-calendar-events-list', null);
}

// KPI Updaters
function updateAgencyKPIs() {
  const agency = '한국 영어마을';
  const students = MOCK_STUDENTS.filter(s => s.agency === agency);

  enhanceMockStudents();

  const activeCount = students.filter(s => s.status === 'current' || s.status === 'extended').length;
  const waitingCount = students.filter(s => s.status === 'waiting').length;
  
  const vacancies = checkRoomVacancy('2026-06-15', '2026-06-15');
  const totalVacantBeds = vacancies.reduce((sum, v) => sum + v.rooms.reduce((sSum, r) => sSum + r.availableBeds, 0), 0);
  
  const juneCommissions = students.filter(s => s.arrivalDate && s.arrivalDate.startsWith('2026-06'))
                                  .reduce((sum, s) => sum + calculatePrices(s).commission, 0);

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('kpi-agency-active-students', `${activeCount}명`);
  setEl('kpi-agency-waiting-students', `${waitingCount}명`);
  setEl('kpi-agency-dorm-vacancies', `${totalVacantBeds}석`);
  setEl('kpi-agency-june-commission', `$${juneCommissions.toLocaleString()}`);
}

function updateAdminKPIs() {
  enhanceMockStudents();
  
  const todayStr = '2026-06-15';
  const today = new Date(todayStr);

  const activeCount = MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'extended').length;
  const waitingCount = MOCK_STUDENTS.filter(s => s.status === 'waiting').length;
  const todayArrivals = MOCK_STUDENTS.filter(s => s.arrivalDate === todayStr).length;
  
  const visaExpiring = MOCK_STUDENTS.filter(s => {
    if (!s.visaExpiry || s.visaExpiry === '면제') return false;
    const exp = new Date(s.visaExpiry);
    const diff = Math.ceil((exp - today) / (1000*60*60*24));
    return diff >= 0 && diff <= 30;
  }).length;

  const vacancies = checkRoomVacancy(todayStr, todayStr);
  const totalBeds = MOCK_DORM_ROOMS.reduce((sum, r) => sum + (r.beds ? r.beds.length : r.capacity), 0);
  const vacantBeds = vacancies.reduce((sum, v) => sum + v.rooms.reduce((sSum, r) => sSum + r.availableBeds, 0), 0);
  const occupiedBeds = totalBeds - vacantBeds;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  const vacancyRate = 100 - occupancyRate;

  const thisWeekNew = MOCK_STUDENTS.filter(s => {
    if (!s.startDate) return false;
    const start = new Date(s.startDate);
    const diff = Math.ceil((start - today) / (1000*60*60*24));
    return diff >= 0 && diff < 7;
  }).length;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('kpi-admin-active', `${activeCount}명`);
  setEl('kpi-admin-waiting', `${waitingCount}명`);
  setEl('kpi-admin-arrivals', `${todayArrivals}명`);
  setEl('kpi-admin-visa', `${visaExpiring}명`);
  setEl('kpi-admin-dorm', `${vacancyRate}% (잔여 ${vacantBeds}석)`);
  setEl('kpi-admin-new-week', `${thisWeekNew}명`);

  renderAdminNationalityChart();
}

function renderAdminNationalityChart() {
  const container = document.getElementById('admin-nationality-chart');
  if (!container) return;

  const counts = {};
  let total = 0;
  MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'extended').forEach(s => {
    counts[s.nationality] = (counts[s.nationality] || 0) + 1;
    total++;
  });

  const colors = { '한국': '#5E5CE6', '일본': '#EF4444', '중국': '#F59E0B', '베트남': '#10B981', '몽골': '#8B5CF6' };
  const entries = Object.entries(counts);

  // 도넛 SVG (소형)
  const R = 40, CX = 50, CY = 50, innerR = 24;
  let startAngle = -Math.PI / 2;
  let slices = '';
  entries.forEach(([nat, cnt]) => {
    const angle = (cnt / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle), y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle),   y2 = CY + R * Math.sin(endAngle);
    const xi1 = CX + innerR * Math.cos(startAngle), yi1 = CY + innerR * Math.sin(startAngle);
    const xi2 = CX + innerR * Math.cos(endAngle),   yi2 = CY + innerR * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const color = colors[nat] || '#6B7280';
    slices += `<path d="M${xi1},${yi1} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${innerR},${innerR} 0 ${large},0 ${xi1},${yi1}" fill="${color}">
      <title>${nat}: ${cnt}명 (${Math.round(cnt/total*100)}%)</title></path>`;
    startAngle = endAngle;
  });
  const svgHtml = `<svg viewBox="0 0 100 100" width="110" height="110" style="flex-shrink:0">
    ${slices}
    <text x="50" y="48" text-anchor="middle" font-size="13" font-weight="700" fill="#374151">${total}명</text>
    <text x="50" y="62" text-anchor="middle" font-size="8" fill="#9CA3AF">재학생</text>
  </svg>`;

  const labelsHtml = entries.map(([nat, cnt]) => {
    const pct = Math.round(cnt / total * 100);
    const color = colors[nat] || '#6B7280';
    return `<div style="display:flex;align-items:center;gap:6px">
      <span style="width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0"></span>
      <span style="font-size:12px;font-weight:600;color:#374151;min-width:36px">${nat}</span>
      <span style="font-size:11.5px;color:#6B7280">${cnt}명</span>
      <span style="font-size:11px;color:#9CA3AF">(${pct}%)</span>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:16px;padding:4px 0">
      ${svgHtml}
      <div style="display:flex;flex-direction:column;gap:8px">${labelsHtml}</div>
    </div>
  `;
}

/* ─── 범용 도넛 차트 생성기 ─── */
function buildDonutChartHtml(entries, colorMap, centerLabel, centerSub, size) {
  size = size || 110;
  const total = entries.reduce((sum, [, cnt]) => sum + cnt, 0);
  if (total === 0) {
    return `<div style="font-size:12px;color:#9CA3AF;padding:10px 0">데이터가 없습니다.</div>`;
  }
  const fallbackColors = ['#5E5CE6','#EF4444','#F59E0B','#10B981','#8B5CF6','#0EA5E9','#EC4899','#6B7280'];
  const R = 40, CX = 50, CY = 50, innerR = 24;
  let startAngle = -Math.PI / 2;
  let slices = '';
  entries.forEach(([key, cnt], idx) => {
    const angle = (cnt / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const x1 = CX + R * Math.cos(startAngle), y1 = CY + R * Math.sin(startAngle);
    const x2 = CX + R * Math.cos(endAngle),   y2 = CY + R * Math.sin(endAngle);
    const xi1 = CX + innerR * Math.cos(startAngle), yi1 = CY + innerR * Math.sin(startAngle);
    const xi2 = CX + innerR * Math.cos(endAngle),   yi2 = CY + innerR * Math.sin(endAngle);
    const large = angle > Math.PI ? 1 : 0;
    const color = (colorMap && colorMap[key]) || fallbackColors[idx % fallbackColors.length];
    slices += `<path d="M${xi1},${yi1} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${innerR},${innerR} 0 ${large},0 ${xi1},${yi1}" fill="${color}">
      <title>${key}: ${cnt} (${Math.round(cnt/total*100)}%)</title></path>`;
    startAngle = endAngle;
  });
  const svgHtml = `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="flex-shrink:0">
    ${slices}
    <text x="50" y="48" text-anchor="middle" font-size="13" font-weight="700" fill="#374151">${centerLabel}</text>
    <text x="50" y="62" text-anchor="middle" font-size="8" fill="#9CA3AF">${centerSub}</text>
  </svg>`;

  const labelsHtml = entries.map(([key, cnt], idx) => {
    const pct = Math.round(cnt / total * 100);
    const color = (colorMap && colorMap[key]) || fallbackColors[idx % fallbackColors.length];
    return `<div style="display:flex;align-items:center;gap:6px">
      <span style="width:9px;height:9px;border-radius:50%;background:${color};flex-shrink:0"></span>
      <span style="font-size:12px;font-weight:600;color:#374151;min-width:36px">${key}</span>
      <span style="font-size:11.5px;color:#6B7280">${cnt}</span>
      <span style="font-size:11px;color:#9CA3AF">(${pct}%)</span>
    </div>`;
  }).join('');

  return `<div style="display:flex;align-items:center;gap:14px">
    ${svgHtml}
    <div style="display:flex;flex-direction:column;gap:6px">${labelsHtml}</div>
  </div>`;
}


/* ─── 에이전시 기숙사 공실 조회 (룸 타입별) ─── */
let _dormFilterGender = '전체';
let _drawerAccomType  = null;
let _drawerRoomType   = null;
let _drawerGenderPref = '전체';

function setDormFilterGender(btn, value) {
  _dormFilterGender = value;
  document.querySelectorAll('#dorm-gf-all,#dorm-gf-male,#dorm-gf-female').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  searchAgencyDormVacancy();
}

function searchAgencyDormVacancy() {
  renderDormTypeSummary();
  renderAgencyDormList();
}

// 침대 단위 상태 계산 (어드민 ERP Gantt 용): 'occupied' | 'pending' | 'free'
function getBedState(room, bed, start, end) {
  if (bed.student && bed.start && bed.end) {
    const bStart = new Date(`2026-${bed.start}`);
    const bEnd   = new Date(`2026-${bed.end}`);
    if (start <= bEnd && end >= bStart) return 'occupied';
  }
  const hasPending = MOCK_DORM_BOOK_REQUESTS.some(r =>
    r.assignedRoomNo === room.roomNo &&
    r.assignedBedId  === bed.id &&
    r.status === 'pending'
  );
  if (hasPending) return 'pending';
  return 'free';
}

// 타입별 공실 수 계산 (기간 기준)
function calcTypeVacancy(accomType, roomType, start, end, genderPref) {
  return MOCK_DORM_ROOMS.filter(r => {
    if (r.accomType !== accomType) return false;
    if (!r.type.startsWith(roomType)) return false;
    if (genderPref !== '전체' && r.genderRestriction !== genderPref && r.genderRestriction !== '무관') return false;
    return true;
  }).reduce((total, room) => {
    const freeBeds = room.beds.filter(bed => {
      if (bed.student && bed.start && bed.end) {
        const bStart = new Date(`2026-${bed.start}`);
        const bEnd   = new Date(`2026-${bed.end}`);
        if (start <= bEnd && end >= bStart) return false;
      }
      return true;
    });
    return total + freeBeds.length;
  }, 0);
}

function renderDormTypeSummary() {
  const startVal  = document.getElementById('agency-dorm-start-date') ? document.getElementById('agency-dorm-start-date').value : '';
  const endVal    = document.getElementById('agency-dorm-end-date')   ? document.getElementById('agency-dorm-end-date').value   : '';
  const grid      = document.getElementById('agency-dorm-type-grid');
  const summaryEl = document.getElementById('agency-dorm-result-summary');
  if (!grid) return;

  if (!startVal || !endVal || startVal >= endVal) {
    if (summaryEl) summaryEl.textContent = '';
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#9CA3AF;font-size:13px">수강 기간을 선택하면 룸 타입별 공실이 표시됩니다.</div>`;
    return;
  }

  const start = new Date(startVal);
  const end   = new Date(endVal);

  const TYPES = [
    { accomType: '기숙사', key: '1인실', label: '기숙사 1인실', icon: '🛏',   cost: 800,  desc: '기숙사 독립 공간 · 1인 전용' },
    { accomType: '기숙사', key: '2인실', label: '기숙사 2인실', icon: '🛏🛏', cost: 600,  desc: '기숙사 2인 셰어 룸' },
    { accomType: '기숙사', key: '4인실', label: '기숙사 4인실', icon: '🏨',   cost: 500,  desc: '기숙사 4인 셰어 룸' },
    { accomType: '콘도',   key: '1인실', label: '콘도 디럭스 1인실', icon: '🏢', cost: 1200, desc: '콘도형 최고급 독립 공간' }
  ];

  const typeStats = TYPES.map(t => {
    const vacant = calcTypeVacancy(t.accomType, t.key, start, end, _dormFilterGender);
    const pendingReqs = MOCK_DORM_BOOK_REQUESTS.filter(r => r.accomType === t.accomType && r.roomType === t.key && r.status === 'pending').length;
    return { ...t, vacant, pendingReqs };
  }).filter(t => {
    // 해당 타입 룸이 존재하는 경우만 accomType 과 type 둘 다 매칭 검사
    return MOCK_DORM_ROOMS.some(r => r.accomType === t.accomType && r.type.startsWith(t.key));
  });

  const totalVacant = typeStats.reduce((s, t) => s + t.vacant, 0);

  if (summaryEl) {
    if (totalVacant === 0) {
      summaryEl.innerHTML = `<span style="color:#EF4444;font-weight:600">⚠ 해당 기간에 이용 가능한 공실이 없습니다.</span>`;
    } else {
      summaryEl.innerHTML =
        `<span style="font-weight:700;color:#374151">${startVal} ~ ${endVal}</span> 기준&nbsp;` +
        `<span style="color:#10B981;font-weight:700">총 ${totalVacant}개 침대</span> 이용 가능`;
    }
  }

  grid.innerHTML = typeStats.map(t => {
    const hasVacant  = t.vacant > 0;
    const cardBg     = hasVacant ? '#F0FDF4' : '#F9FAFB';
    const cardBorder = hasVacant ? '#BBF7D0' : '#E5E7EB';
    const vacantColor = hasVacant ? '#059669' : '#9CA3AF';

    // 프로그레스: 공실 / 전체 침대 (accomType 과 type 조합 필터)
    const totalBeds = MOCK_DORM_ROOMS.filter(r => r.accomType === t.accomType && r.type.startsWith(t.key)).reduce((s, r) => s + r.beds.length, 0);
    const occPct    = totalBeds > 0 ? Math.round((totalBeds - t.vacant) / totalBeds * 100) : 0;

    return `
      <div style="border:1.5px solid ${cardBorder};border-radius:16px;padding:20px;background:${cardBg};
        ${hasVacant ? 'cursor:pointer;transition:box-shadow 0.15s,transform 0.1s' : 'opacity:0.7'}"
        ${hasVacant ? `onclick="openDormRequestDrawer('${t.accomType}','${t.key}','${t.cost}')" onmouseenter="this.style.boxShadow='0 4px 18px rgba(16,185,129,0.15)';this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='';this.style.transform=''"` : ''}>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">
          <div>
            <div style="font-size:22px;margin-bottom:4px">${t.icon}</div>
            <div style="font-size:17px;font-weight:800;color:#1E3A8A">${t.label}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">${t.desc}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:28px;font-weight:900;color:${vacantColor};line-height:1">${t.vacant}</div>
            <div style="font-size:10px;color:#9CA3AF;font-weight:600">공실</div>
          </div>
        </div>
        <!-- 점유율 바 -->
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:10.5px;color:#9CA3AF;margin-bottom:4px">
            <span>점유율</span><span>${occPct}%</span>
          </div>
          <div style="height:5px;background:#E9EDF4;border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${occPct}%;background:${occPct >= 90 ? '#EF4444' : occPct >= 60 ? '#F59E0B' : '#10B981'};border-radius:3px"></div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(0,0,0,0.06);padding-top:10px;margin-top:4px">
          <span style="font-size:11px;color:#6B7280">4주 <strong style="color:#374151">$${t.cost}</strong></span>
          ${t.pendingReqs > 0 ? `<span style="font-size:10px;background:#FEF3C7;color:#D97706;padding:2px 8px;border-radius:20px;font-weight:700">검토 중 ${t.pendingReqs}건</span>` : ''}
          ${hasVacant ? `<span style="font-size:11px;color:#5E5CE6;font-weight:700">배정 요청 →</span>` : `<span style="font-size:11px;color:#9CA3AF">공실 없음</span>`}
        </div>
      </div>`;
  }).join('');
}

/* ─── 기숙사 배정 요청 드로어 ─── */
function openDormRequestDrawer(accomType, roomType, cost) {
  _drawerAccomType  = accomType;
  _drawerRoomType   = roomType;
  _drawerGenderPref = '전체';

  const startVal = document.getElementById('agency-dorm-start-date').value;
  const endVal   = document.getElementById('agency-dorm-end-date').value;

  document.getElementById('drawer-room-title').textContent = `[${accomType}] ${roomType} 배정 요청`;
  const vacant = calcTypeVacancy(accomType, roomType, new Date(startVal), new Date(endVal), '전체');
  document.getElementById('drawer-room-meta').textContent  = `공실 ${vacant}개 이용 가능 · 4주 $${cost}`;

  document.getElementById('drawer-checkin').value  = startVal;
  document.getElementById('drawer-checkout').value = endVal;
  document.getElementById('drawer-memo').value     = '';

  // 성별 버튼 리셋
  document.querySelectorAll('#drawer-gender-all,#drawer-gender-male,#drawer-gender-female').forEach(b => b.classList.remove('active'));
  document.getElementById('drawer-gender-all').classList.add('active');

  // 소속 학생 드롭다운
  const agencyStudents = MOCK_STUDENTS.filter(s => s.status === 'current');
  const sel = document.getElementById('drawer-student-select');
  sel.innerHTML = '<option value="">— 학생을 선택하세요 —</option>' +
    agencyStudents.map(s =>
      `<option value="${s.id}">${s.name} (${s.nick}) · ${s.gender}성</option>`
    ).join('');
  sel.onchange = function() {
    const s = MOCK_STUDENTS.find(st => st.id === parseInt(this.value));
    const info = document.getElementById('drawer-student-info');
    if (s) {
      const gIcon = s.gender === '남' || s.gender === '남성' ? '♂' : '♀';
      info.innerHTML = `<span style="color:#5E5CE6">${gIcon} ${s.gender}성</span> · 국적: ${s.nationality || '-'} · 코스: ${s.duration || '-'}주`;
    } else { info.textContent = ''; }
  };

  document.getElementById('dorm-booking-overlay').style.display = 'block';
  document.getElementById('dorm-booking-drawer').classList.add('open');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function selectDrawerGender(value, btn) {
  _drawerGenderPref = value;
  document.querySelectorAll('#drawer-gender-all,#drawer-gender-male,#drawer-gender-female').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function closeDormBookingDrawer() {
  document.getElementById('dorm-booking-drawer').classList.remove('open');
  document.getElementById('dorm-booking-overlay').style.display = 'none';
  _drawerAccomType  = null;
  _drawerRoomType   = null;
  _drawerGenderPref = '전체';
}

function submitDormBooking() {
  const studentId = parseInt(document.getElementById('drawer-student-select').value);
  const checkin   = document.getElementById('drawer-checkin').value;
  const checkout  = document.getElementById('drawer-checkout').value;
  const memo      = document.getElementById('drawer-memo').value.trim();

  if (!_drawerRoomType) {
    showToast('룸 타입 정보가 없습니다.', 'warning'); return;
  }
  if (!studentId) {
    showToast('배정할 학생을 선택해주세요.', 'warning'); return;
  }
  if (!checkin || !checkout || checkin >= checkout) {
    showToast('입실·퇴실 날짜를 확인해주세요.', 'warning'); return;
  }

  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  const newReq = {
    id:             MOCK_DORM_BOOK_REQUESTS.length + 1,
    agency:         student.agency || '에이전시',
    studentName:    `${student.name} (${student.nick})`,
    studentId,
    accomType:      _drawerAccomType,
    roomType:       _drawerRoomType,
    genderPref:     _drawerGenderPref,
    checkin,
    checkout,
    memo,
    status:         'pending',
    requestedAt:    new Date().toISOString().slice(0, 10),
    assignedRoomNo: null,
    assignedBedId:  null,
  };
  MOCK_DORM_BOOK_REQUESTS.push(newReq);

  closeDormBookingDrawer();
  showToast(`[${_drawerAccomType}] ${_drawerRoomType} 배정 요청이 어드민에게 전달됐습니다.`, 'success');
  if (typeof initAdminInbox === 'function') initAdminInbox();
  if (typeof initAgencyRequestInbox === 'function') initAgencyRequestInbox();
  renderAgencyDormBookHistory();
  renderDormTypeSummary();
}

function _buildDormBookRows(requests) {
  if (requests.length === 0) return null;
  const statusMap = {
    pending:  { cls: 'tsa-badge-warning', label: '⏳ 검토 중', bg: '' },
    approved: { cls: 'tsa-badge-success', label: '✅ 승인됨',  bg: '#F0FDF4' },
    rejected: { cls: 'tsa-badge-danger',  label: '❌ 반려됨',  bg: '#FFF1F2' },
  };
  return [...requests].reverse().map(r => {
    const st = statusMap[r.status] || statusMap.pending;
    const assignedInfo = r.status === 'approved' && r.assignedRoomNo
      ? `<div style="font-size:10px;color:#059669;margin-top:3px;font-weight:700">Room ${r.assignedRoomNo} · 침대 ${r.assignedBedId}</div>` : '';
    const rejectNote = r.status === 'rejected' && r.rejectReason
      ? `<div style="font-size:10px;color:#EF4444;margin-top:3px">사유: ${r.rejectReason}</div>` : '';
    return `<tr style="background:${st.bg}">
      <td style="font-weight:700;color:#1E3A8A">${r.accomType ? `[${r.accomType}] ` : ''}${r.roomType || '-'}</td>
      <td>${r.studentName}</td>
      <td style="font-size:11px">${r.checkin}</td>
      <td style="font-size:11px">${r.checkout}</td>
      <td style="font-size:11px;color:#9CA3AF">${r.requestedAt}</td>
      <td style="font-size:11px;color:#6B7280;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.memo || '-'}</td>
      <td style="text-align:center">
        <span class="tsa-badge ${st.cls}" style="font-size:11px">${st.label}</span>
        ${assignedInfo}${rejectNote}
      </td>
    </tr>`;
  }).join('');
}

function renderAgencyDormBookHistory() {
  const tbody   = document.getElementById('agency-dorm-book-history');
  const counter = document.getElementById('agency-dorm-book-count');
  if (!tbody) return;
  if (counter) counter.textContent = `${MOCK_DORM_BOOK_REQUESTS.length}건`;
  const rows = _buildDormBookRows(MOCK_DORM_BOOK_REQUESTS);
  tbody.innerHTML = rows || `<tr><td colspan="7" style="text-align:center;padding:24px;color:#9CA3AF">아직 제출한 배정 요청이 없습니다.</td></tr>`;
}

function renderReqDormPanel() {
  const tbody = document.getElementById('req-dorm-body');
  if (!tbody) return;
  const rows = _buildDormBookRows(MOCK_DORM_BOOK_REQUESTS);
  tbody.innerHTML = rows || `<tr><td colspan="7" style="text-align:center;padding:24px;color:#9CA3AF">아직 제출한 배정 요청이 없습니다.</td></tr>`;
}

// Monthly Invoice Stats
function shiftInvoiceMonth(delta) {
  const sel = document.getElementById('monthly-stats-month');
  if (!sel) return;
  const idx = sel.selectedIndex + delta;
  if (idx < 0 || idx >= sel.options.length) return;
  sel.selectedIndex = idx;
  renderMonthlyInvoiceStats();
}

let _monthStatsFilter = 'all';

function setMonthStatsFilter(filter) {
  _monthStatsFilter = filter;
  ['all','paid','unpaid'].forEach(f => {
    const btn = document.getElementById(`ms-filter-${f}`);
    if (!btn) return;
    btn.classList.toggle('tsa-btn-primary', f === filter);
    btn.classList.toggle('tsa-btn-outline', f !== filter);
    if (f !== filter) {
      const colors = { paid: '#10B981', unpaid: '#EF4444' };
      btn.style.borderColor = colors[f] || '';
      btn.style.color = colors[f] || '';
    } else {
      btn.style.borderColor = '';
      btn.style.color = '';
    }
  });
  renderMonthlyInvoiceStats();
}

function renderMonthlyInvoiceStats() {
  const selectedMonth = document.getElementById('monthly-stats-month').value;
  const isAgency = APP.user.includes('agency');
  const agencyName = isAgency ? '한국 영어마을' : null;

  let students = MOCK_STUDENTS;
  if (agencyName) students = students.filter(s => s.agency === agencyName);

  let monthStudents = students.filter(s => {
    const dateStr = s.arrivalDate || s.startDate;
    return dateStr && dateStr.startsWith(selectedMonth);
  });

  if (_monthStatsFilter === 'paid') monthStudents = monthStudents.filter(s => s.remittanceStatus === 'paid');
  else if (_monthStatsFilter === 'unpaid') monthStudents = monthStudents.filter(s => s.remittanceStatus !== 'paid');

  // KPI 카드 업데이트 — 전체 학생 기준 (필터 전)
  const allMonthStudents = students.filter(s => {
    const dateStr = s.arrivalDate || s.startDate;
    return dateStr && dateStr.startsWith(selectedMonth);
  });
  let paidNet = 0, unpaidNet = 0, totalComm = 0;
  let paidCnt = 0, unpaidCnt = 0;
  allMonthStudents.forEach(s => {
    const p = calculatePrices(s);
    totalComm += p.commission;
    if (s.remittanceStatus === 'paid') { paidNet += p.net; paidCnt++; }
    else { unpaidNet += p.net; unpaidCnt++; }
  });
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('month-stat-new-count',         `${allMonthStudents.length}건`);
  setEl('month-stat-paid-amount',       `$${paidNet.toLocaleString()}`);
  setEl('month-stat-paid-count',        `${paidCnt}`);
  setEl('month-stat-unpaid-amount',     `$${unpaidNet.toLocaleString()}`);
  setEl('month-stat-unpaid-count',      `${unpaidCnt}`);
  setEl('month-stat-commission-amount', `$${totalComm.toLocaleString()}`);

  const tbody = document.getElementById('month-stats-tbody');
  const tfoot = document.getElementById('month-stats-tfoot');
  if (!tbody) return;

  // 어드민 화면에서는 에이전시 컬럼 표시
  const theadRow = document.getElementById('month-stats-thead-row');
  if (theadRow) {
    let agencyTh = document.getElementById('month-stats-th-agency');
    if (!isAgency && !agencyTh) {
      agencyTh = document.createElement('th');
      agencyTh.id = 'month-stats-th-agency';
      agencyTh.textContent = '에이전시';
      theadRow.children[0].insertAdjacentElement('afterend', agencyTh);
    } else if (isAgency && agencyTh) {
      agencyTh.remove();
    }
  }

  const colCount = isAgency ? 12 : 13;
  if (monthStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colCount}" style="text-align:center;padding:30px;color:#9CA3AF">해당 월에 등록된 학생이 없습니다.</td></tr>`;
    if (tfoot) tfoot.innerHTML = '';
    return;
  }

  // 상태 배지 헬퍼
  const statusBadge = (s) => {
    const map = {
      waiting:   ['tsa-badge-warning', '입학 대기'],
      current:   ['tsa-badge-success', '재학'],
      completed: ['tsa-badge-gray',    '졸업'],
      resigned:  ['tsa-badge-danger',  '퇴원'],
      extended:  ['tsa-badge-primary', '연장'],
      canceled:  ['tsa-badge-danger',  '취원'],
    };
    const [cls, label] = map[s.status] || ['tsa-badge-gray', s.status || '-'];
    return `<span class="tsa-badge ${cls}">${label}</span>`;
  };

  const remitBadge = (s) => {
    if (s.remittanceStatus === 'paid') return `<span class="tsa-badge tsa-badge-success">완납</span>`;
    return `<span class="tsa-badge tsa-badge-danger">미납</span>`;
  };


  // 합계 집계
  let sumTuition = 0, sumDorm = 0, sumReg = 0, sumGross = 0, sumComm = 0, sumNet = 0;
  let paidCount = 0, unpaidCount = 0;

  const totalRows = monthStudents.length;
  tbody.innerHTML = monthStudents.map((s, idx) => {
    const rowNum = totalRows - idx;
    const p = calculatePrices(s);
    sumTuition += p.tuition;
    sumDorm    += p.dorm;
    sumReg     += p.registration;
    sumGross   += p.gross;
    sumComm    += p.commission;
    sumNet     += p.net;
    if (s.remittanceStatus === 'paid') paidCount++; else unpaidCount++;

    const commRate = Math.round(p.commission / (p.tuition + p.dorm) * 100) || 20;

    const avatarSrc = (s.gender === '남' || s.gender === '남성')
      ? 'assets/images/student_male.png'
      : 'assets/images/student_female.png';

    return `<tr>
      <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${rowNum}</td>
      ${!isAgency ? `<td style="font-size:12px;color:#374151">${s.agency || '-'}</td>` : ''}
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${avatarSrc}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #E9EDF4;flex-shrink:0" alt=""/>
          <div>
            <div style="font-weight:700;font-size:12.5px">${s.name}</div>
            <div style="font-size:10.5px;color:#6B7280">Nick: ${s.nick}</div>
            <div style="font-size:10.5px;color:#9CA3AF">${s.passportNum || '-'}</div>
          </div>
        </div>
      </td>
      <td style="font-size:12px">${s.course}</td>
      <td style="text-align:center;font-weight:600">${s.duration}주</td>
      <td style="text-align:right;font-weight:600">$${p.tuition.toLocaleString()}</td>
      <td style="text-align:right;font-weight:600">$${p.dorm.toLocaleString()}</td>
      <td style="text-align:right;font-weight:600">$${p.registration.toLocaleString()}</td>
      <td style="text-align:right;font-weight:800;color:#5E5CE6">$${p.gross.toLocaleString()}</td>
      <td style="text-align:right;color:#D97706;font-weight:700">-$${p.commission.toLocaleString()} <span style="font-size:10px;opacity:0.8">(${commRate}%)</span></td>
      <td style="text-align:right;font-weight:800;color:#059669">$${p.net.toLocaleString()}</td>
      <td style="text-align:center">${statusBadge(s)}</td>
      <td style="text-align:center">${remitBadge(s)}</td>
      <td style="text-align:center;font-size:11px;color:#6B7280">${s.remittanceStatus === 'paid' && s.remittanceDate ? s.remittanceDate.substring(0,10) : '-'}</td>
    </tr>`;
  }).join('');

  // 합계 행
  if (tfoot) {
    tfoot.innerHTML = `
      <tr style="background:#F0F4FF;font-weight:800;border-top:2px solid #C7D2FE">
        <td style="padding:10px 8px;text-align:center;color:#9CA3AF;font-size:11px"></td>
        ${!isAgency ? '<td></td>' : ''}
        <td colspan="3" style="padding:10px 12px;font-size:12px;color:#1E3A8A">
          합계 · 총 ${monthStudents.length}명
          <span style="font-size:10.5px;font-weight:600;color:#059669;margin-left:6px">완납 ${paidCount}명</span>
          <span style="font-size:10.5px;font-weight:600;color:#EF4444;margin-left:4px">미납 ${unpaidCount}명</span>
        </td>
        <td style="text-align:right;color:#374151;padding:10px 8px">$${sumTuition.toLocaleString()}</td>
        <td style="text-align:right;color:#374151;padding:10px 8px">$${sumDorm.toLocaleString()}</td>
        <td style="text-align:right;color:#374151;padding:10px 8px">$${sumReg.toLocaleString()}</td>
        <td style="text-align:right;font-weight:900;color:#5E5CE6;padding:10px 8px">$${sumGross.toLocaleString()}</td>
        <td style="text-align:right;color:#D97706;padding:10px 8px">-$${sumComm.toLocaleString()}</td>
        <td style="text-align:right;font-weight:900;color:#059669;padding:10px 8px">$${sumNet.toLocaleString()}</td>
        <td colspan="3" style="padding:10px 8px"></td>
      </tr>`;
  }

  if (typeof refreshIcons === 'function') refreshIcons();
}

// Tag Settings Saving
function saveTeacherTags(id) {
  const prefChecked = Array.from(document.querySelectorAll('input[name="pref-tag"]:checked')).map(el => el.value);
  const exclChecked = Array.from(document.querySelectorAll('input[name="excl-tag"]:checked')).map(el => el.value);
  const classType = document.getElementById('tag-class-type').value;
  const room = document.getElementById('tag-room').value.trim();
  const workStart = document.getElementById('tag-work-start').value;
  const workEnd = document.getElementById('tag-work-end').value;

  const t = MOCK_TEACHERS.find(teacher => teacher.id === id);
  if (t) {
    t.preferredCourses = prefChecked;
    t.prohibitedCourses = exclChecked;
    const allTags = (typeof MOCK_ASSIGNMENT_TAGS !== 'undefined') ? MOCK_ASSIGNMENT_TAGS.map(tag => tag.name) : [];
    t.basicCourses = allTags.filter(name => !prefChecked.includes(name) && !exclChecked.includes(name));

    t.classType = classType;
    t.assignedRoom = room;
    t.room = room;
    t.workHours = { start: workStart, end: workEnd };

    showToast(`✓ ${t.nick} 강사의 역량 태그 및 배정 제약 설정이 저장되었습니다.`, 'success');
    switchTeacherTab('profile', null);
    initTeacherList();
  }
}

// Assignment Tag Master Pool Mock Data defined at top

function handleTeacherTagCheckChange() {
  const prefChecked = Array.from(document.querySelectorAll('input[name="pref-tag"]:checked')).map(el => el.value);
  const exclChecked = Array.from(document.querySelectorAll('input[name="excl-tag"]:checked')).map(el => el.value);

  document.querySelectorAll('input[name="pref-tag"]').forEach(el => {
    el.disabled = exclChecked.includes(el.value);
    if (el.disabled) {
      el.parentNode.style.opacity = '0.5';
    } else {
      el.parentNode.style.opacity = '1';
    }
  });
  document.querySelectorAll('input[name="excl-tag"]').forEach(el => {
    el.disabled = prefChecked.includes(el.value);
    if (el.disabled) {
      el.parentNode.style.opacity = '0.5';
    } else {
      el.parentNode.style.opacity = '1';
    }
  });
}

function renderAssignmentTags() {
  const tbody = document.getElementById('tag-master-list-tbody');
  if (!tbody) return;

  MOCK_ASSIGNMENT_TAGS.sort((a, b) => a.priority - b.priority);

  tbody.innerHTML = MOCK_ASSIGNMENT_TAGS.map((tag, idx) => {
    const visibleBadge = tag.visible 
      ? `<span class="tsa-badge tsa-badge-success" style="cursor:pointer" onclick="toggleTagVisibility('${tag.id}')">노출</span>`
      : `<span class="tsa-badge tsa-badge-danger" style="cursor:pointer" onclick="toggleTagVisibility('${tag.id}')">비노출</span>`;
    
    return `
      <tr>
        <td style="font-weight:700">${tag.name}</td>
        <td style="text-align:center">${visibleBadge}</td>
        <td style="text-align:center;font-weight:600">${tag.priority}순위</td>
        <td style="text-align:center">
          <div style="display:flex;justify-content:center;gap:4px">
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="changeTagPriority('${tag.id}', 'up')" ${idx === 0 ? 'disabled' : ''}>▲</button>
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="changeTagPriority('${tag.id}', 'down')" ${idx === MOCK_ASSIGNMENT_TAGS.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
        </td>
        <td style="text-align:center">
          <div style="display:flex;justify-content:center;gap:6px">
            <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="editAssignmentTag('${tag.id}')">수정</button>
            <button class="tsa-btn tsa-btn-xs tsa-btn-outline-danger" onclick="deleteAssignmentTag('${tag.id}')">삭제</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  if (typeof refreshIcons === 'function') refreshIcons();
}

function saveAssignmentTag() {
  const idEl = document.getElementById('tag-manage-id');
  const nameEl = document.getElementById('tag-manage-name');
  const visibleEl = document.getElementById('tag-manage-visible');
  const priorityEl = document.getElementById('tag-manage-priority');

  const id = idEl.value;
  const name = nameEl.value.trim();
  const visible = visibleEl.value === 'true';
  const priority = parseInt(priorityEl.value, 10);

  if (!name) return;

  if (id) {
    const tag = MOCK_ASSIGNMENT_TAGS.find(t => t.id === id);
    if (tag) {
      tag.name = name;
      tag.visible = visible;
      tag.priority = priority;
      showToast('배정 태그가 수정되었습니다.', 'success');
    }
  } else {
    const newId = 'TAG-' + String(MOCK_ASSIGNMENT_TAGS.length + 1).padStart(2, '0');
    MOCK_ASSIGNMENT_TAGS.push({
      id: newId,
      name: name,
      visible: visible,
      priority: priority
    });
    showToast('신규 배정 태그가 추가되었습니다.', 'success');
  }

  resetTagForm();
  renderAssignmentTags();
}

function editAssignmentTag(id) {
  const tag = MOCK_ASSIGNMENT_TAGS.find(t => t.id === id);
  if (!tag) return;

  document.getElementById('tag-manage-id').value = tag.id;
  document.getElementById('tag-manage-name').value = tag.name;
  document.getElementById('tag-manage-visible').value = String(tag.visible);
  document.getElementById('tag-manage-priority').value = tag.priority;
  document.getElementById('tag-form-title').innerHTML = `<i data-lucide="edit-3" style="color:#F59E0B"></i> 배정 태그 수정`;
  if (typeof refreshIcons === 'function') refreshIcons();
}

function deleteAssignmentTag(id) {
  if (!confirm('정말 이 배정 태그를 삭제하시겠습니까?')) return;
  MOCK_ASSIGNMENT_TAGS = MOCK_ASSIGNMENT_TAGS.filter(t => t.id !== id);
  showToast('배정 태그가 삭제되었습니다.', 'success');
  renderAssignmentTags();
}

function toggleTagVisibility(id) {
  const tag = MOCK_ASSIGNMENT_TAGS.find(t => t.id === id);
  if (tag) {
    tag.visible = !tag.visible;
    renderAssignmentTags();
  }
}

function changeTagPriority(id, direction) {
  const idx = MOCK_ASSIGNMENT_TAGS.findIndex(t => t.id === id);
  if (idx === -1) return;

  if (direction === 'up' && idx > 0) {
    const temp = MOCK_ASSIGNMENT_TAGS[idx].priority;
    MOCK_ASSIGNMENT_TAGS[idx].priority = MOCK_ASSIGNMENT_TAGS[idx - 1].priority;
    MOCK_ASSIGNMENT_TAGS[idx - 1].priority = temp;
  } else if (direction === 'down' && idx < MOCK_ASSIGNMENT_TAGS.length - 1) {
    const temp = MOCK_ASSIGNMENT_TAGS[idx].priority;
    MOCK_ASSIGNMENT_TAGS[idx].priority = MOCK_ASSIGNMENT_TAGS[idx + 1].priority;
    MOCK_ASSIGNMENT_TAGS[idx + 1].priority = temp;
  }
  renderAssignmentTags();
}

function resetTagForm() {
  document.getElementById('tag-manage-id').value = '';
  document.getElementById('tag-manage-name').value = '';
  document.getElementById('tag-manage-visible').value = 'true';
  document.getElementById('tag-manage-priority').value = String(MOCK_ASSIGNMENT_TAGS.length + 1);
  document.getElementById('tag-form-title').innerHTML = `<i data-lucide="plus-circle" style="color:#5E5CE6"></i> 배정 태그 등록/수정`;
  if (typeof refreshIcons === 'function') refreshIcons();
}

// Course Saving defined elsewhere

function submitInvoiceForApproval(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (s) {
    s.remittanceStatus = 'paid';
    showToast('✓ 입금 확인서가 제출되어 완납 처리되었습니다.', 'success');
    refreshInvoiceViews(studentId);
  }
}

function approveInvoice(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (s) {
    s.remittanceStatus = 'paid';
    showToast('✓ 완납 처리되었습니다.', 'success');
    refreshInvoiceViews(studentId);
  }
}

function rejectInvoice(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (s) {
    const reason = prompt('미납 처리 사유를 입력하세요:', '금액 불일치');
    if (reason === null) return;
    s.remittanceStatus = 'unpaid';
    showToast('✓ 미납 처리되었습니다.', 'warning');
    refreshInvoiceViews(studentId);
  }
}

function refreshInvoiceViews(studentId) {
  enhanceMockStudents();
  updateAdminKPIs();
  updateAgencyKPIs();
  if (typeof initStudentList === 'function') initStudentList();
  if (typeof initAgencyInvoice === 'function') initAgencyInvoice();
  if (typeof renderMonthlyInvoiceStats === 'function') renderMonthlyInvoiceStats();
  
  // 어드민 상세 모달이 열려 있다면 즉시 정산 탭 리로드
  const admModal = document.getElementById('student-detail-modal');
  if (admModal && admModal.style.display !== 'none') {
    switchStudentTab('settle', null);
  }
  // 에이전시 상세 모달이 열려 있다면 즉시 정산 탭 리로드
  const agcModal = document.getElementById('agency-student-detail-modal');
  if (agcModal && agcModal.style.display !== 'none') {
    switchAdetailTab('settle');
  }
}

function setStudentStatusManually(studentId, newStatus) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (s) {
    s.status = newStatus;
    const labels = { waiting: '입학 대기', current: '재학', completed: '졸업', resigned: '퇴원', extended: '연장' };
    showToast(`✓ 학생 상태가 수동으로 [${labels[newStatus] || newStatus}] 처리되었습니다.`, 'success');
    
    // Refresh student views
    enhanceMockStudents();
    updateAdminKPIs();
    updateAgencyKPIs();
    initStudentList();
    initAgencyStudentList();
  }
}

function openStudentSettleDetail(studentId) {
  const isAdmin = (APP.user === 'admin');
  if (isAdmin) {
    openStudentDetail(studentId);
    setTimeout(() => {
      switchStudentTab('settle', null);
    }, 150);
  } else {
    openAgencyStudentDetailModal(studentId);
    setTimeout(() => {
      switchAdetailTab('settle');
    }, 150);
  }
}

/* =============================================
   AUTO-INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  console.log('TSA LMS v2.5 ready — 로그인 화면에서 시작');
});
