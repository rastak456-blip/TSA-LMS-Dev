/* =============================================
   AGENCY PORTAL
   ============================================= */
/* =============================================
   AGENCY PORTAL (Redesigned & Spec v1.1 Compliant)
   ============================================= */
let dbInitialized = false;
function initAgencyStudentDB() {
  if (dbInitialized) return;
  MOCK_STUDENTS.forEach(s => {
    if (!s.passportNum) s.passportNum = 'M' + Math.floor(10000000 + Math.random() * 90000000);
    if (!s.passportExpiry) s.passportExpiry = '2030-12-31';
    if (!s.startDate) s.startDate = '2026-06-01'; // Default Monday start
    if (!s.phone) s.phone = '010-1234-5678';
    if (!s.arrivalDate) s.arrivalDate = '2026-05-31';
    if (!s.dormIn) s.dormIn = '2026-05-31';
    if (!s.dormOut) {
      let date = new Date(s.startDate);
      date.setDate(date.getDate() + (s.duration * 7) - 2); // default saturday checkout
      s.dormOut = date.toISOString().split('T')[0];
    }
    if (!s.remittanceStatus) s.remittanceStatus = (s.status === 'current' || s.status === 'completed') ? 'paid' : 'unpaid';
    if (!s.changeRequests) s.changeRequests = [];
    if (!s.requiredFiles) {
      s.requiredFiles = {
        passport: 'passport_' + s.id + '.pdf',
        ticket: 'ticket_' + s.id + '.pdf',
        photo: 'photo_' + s.id + '.png',
        insurance: 'insurance_' + s.id + '.pdf'
      };
    }
  });
  dbInitialized = true;
}

// 6-KPI metrics calculation
function calculatePrices(s) {
  const coursePrices = {
    '일반 코스': 800,
    'IELTS 전문 코스': 950,
    '주니어 패키지': 880,
    '가디언 코스': 700
  };

  const dormPrices = {
    '1인실 (Premium A)': 800,
    '2인실 (Standard B)': 600,
    '4인실 (Dormitory C)': 400,
    '1인실': 800,
    '2인실': 600,
    '4인실': 400
  };

  let matchedCoursePrice = 800;
  for (const [name, price] of Object.entries(coursePrices)) {
    if (s.course && s.course.includes(name)) {
      matchedCoursePrice = price;
      break;
    }
  }

  let matchedDormPrice = 600;
  for (const [name, price] of Object.entries(dormPrices)) {
    if (s.dorm && s.dorm.includes(name)) {
      matchedDormPrice = price;
      break;
    }
  }

  const duration = parseInt(s.duration) || 4;

  // Dynamic pricing parameters from inputs if available
  const generalCourseInput = document.getElementById('fee-course-general');
  const generalPrice = generalCourseInput ? parseFloat(generalCourseInput.value) : matchedCoursePrice;
  
  const coursePricesMap = {
    '일반 코스': generalPrice,
    'IELTS 전문 코스': generalPrice + 150,
    '주니어 패키지': generalPrice + 80,
    '가디언 코스': generalPrice - 100
  };
  
  let finalCoursePrice = generalPrice;
  for (const [name, price] of Object.entries(coursePricesMap)) {
    if (s.course && s.course.includes(name)) {
      finalCoursePrice = price;
      break;
    }
  }
  
  const dorm2Input = document.getElementById('fee-dorm-2');
  const dorm2Price = dorm2Input ? parseFloat(dorm2Input.value) : matchedDormPrice;
  
  const dormPricesMap = {
    '1인실 (Premium A)': dorm2Price + 200,
    '2인실 (Standard B)': dorm2Price,
    '4인실 (Dormitory C)': dorm2Price - 200,
    '1인실': dorm2Price + 200,
    '2인실': dorm2Price,
    '4인실': dorm2Price - 200
  };
  
  let finalDormPrice = dorm2Price;
  for (const [name, price] of Object.entries(dormPricesMap)) {
    if (s.dorm && s.dorm.includes(name)) {
      finalDormPrice = price;
      break;
    }
  }
  
  const regFeeInput = document.getElementById('fee-register');
  const regFee = regFeeInput ? parseFloat(regFeeInput.value) : 100;

  // Short term surcharge
  let surchargeRate = 1.0;
  const r1wInput = document.getElementById('rate-1w');
  const r2wInput = document.getElementById('rate-2w');
  const r3wInput = document.getElementById('rate-3w');
  
  if (APP.pricingMode === 'A') {
    if (duration === 1) surchargeRate = r1wInput ? parseFloat(r1wInput.value) / 100 : 2.0;
    else if (duration === 2) surchargeRate = r2wInput ? parseFloat(r2wInput.value) / 100 : 1.5;
    else if (duration === 3) surchargeRate = r3wInput ? parseFloat(r3wInput.value) / 100 : 1.25;
  } else {
    if (duration === 1) surchargeRate = r1wInput ? 1 + (parseFloat(r1wInput.value) / 100) : 1.4;
    else if (duration === 2) surchargeRate = r2wInput ? 1 + (parseFloat(r2wInput.value) / 100) : 1.6;
    else if (duration === 3) surchargeRate = r3wInput ? 1 + (parseFloat(r3wInput.value) / 100) : 1.85;
  }

  const weeklyTuition = (finalCoursePrice / 4) * surchargeRate;
  const weeklyDorm = (finalDormPrice / 4);

  let tuitionFee = Math.round(weeklyTuition * duration);
  let dormFee = Math.round(weeklyDorm * duration);
  
  // Apply promotions if configured
  const promoRateInput = document.getElementById('fee-promo-rate');
  const promoDiscountPercent = promoRateInput ? parseFloat(promoRateInput.value) : 10;
  if (promoDiscountPercent > 0) {
    tuitionFee = Math.round(tuitionFee * (1 - promoDiscountPercent / 100));
    dormFee = Math.round(dormFee * (1 - promoDiscountPercent / 100));
  }
  
  const grossTotal = tuitionFee + dormFee + regFee;

  let commRate = 0.20; // Default 20%
  if (s.agency === '서울 유학원') commRate = 0.15;
  else if (s.agency === 'Tokyo Language') commRate = 0.20;
  else if (s.agency === 'Beijing Partner') commRate = 0.25;

  const commission = Math.round((tuitionFee + dormFee) * commRate);
  const remitFee = 30; // Oversea transfer fee paid by agent
  const netTotal = grossTotal - commission + remitFee;

  return {
    tuition: tuitionFee,
    dorm: dormFee,
    registration: regFee,
    gross: grossTotal,
    commission: commission,
    remitFee: remitFee,
    net: netTotal
  };
}

function initAgencyKPIs() {
  updateAgencyKPIs();
}
function initAgencyKPIs_legacy() {
  const activeCountEl = document.getElementById('kpi-active-students');
  const newCountEl = document.getElementById('kpi-new-students');
  const unpaidEl = document.getElementById('kpi-unpaid-invoices');
  const visaEl = document.getElementById('kpi-visa-expiring');
  const dormEl = document.getElementById('kpi-dorm-beds');
  const commEl = document.getElementById('kpi-commission');

  if (!activeCountEl) return;

  let students = MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을');
  if (APP.user === 'agency_branch') {
    students = students.filter(s => {
      const agencyStd = MOCK_AGENCY_STUDENTS.find(a => a.name.includes(s.name) || a.name.includes(s.nick));
      return agencyStd && agencyStd.branch === '강남지사';
    });
  }

  const activeCount = students.filter(s => s.status === 'current' || s.status === 'new' || s.remittanceStatus === 'paid').length;
  activeCountEl.textContent = `${activeCount}명`;

  const newCount = students.filter(s => s.status === 'new').length;
  newCountEl.textContent = `${newCount}건`;

  const unpaidStudents = students.filter(s => s.remittanceStatus === 'unpaid');
  let unpaidSum = 0;
  unpaidStudents.forEach(s => {
    const prices = calculatePrices(s);
    unpaidSum += prices.net;
  });
  unpaidEl.textContent = `${unpaidStudents.length}건 ($${unpaidSum.toLocaleString()})`;

  const today = new Date();
  const visaExpCount = students.filter(s => {
    if (!s.visaExpiry || s.visaExpiry === '면제') return false;
    const expDate = new Date(s.visaExpiry);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  }).length;
  visaEl.textContent = `${visaExpCount}명`;

  // 미납 송금 건수 (대기 학생 제외)
  const unpaidRemitCount = students.filter(s => s.status !== '대기' && s.remittanceStatus === 'unpaid').length;
  if (dormEl) dormEl.textContent = `${unpaidRemitCount}건`;

  let commSum = 0;
  students.filter(s => s.remittanceStatus === 'paid').forEach(s => {
    const prices = calculatePrices(s);
    commSum += prices.commission;
  });
  commEl.textContent = `$${commSum.toLocaleString()}`;
}

let MOCK_AGENCY_NOTIFICATIONS = [
  { id: 'N-01', text: '[송금 완료 승인] Kevin 학생의 B2B 송금이 확인되어 등록이 확정(Active)되었습니다.', type: 'success', date: '2026-06-09 10:00' },
  { id: 'N-02', text: '[신규 등록 접수] 신입생 James 학생의 대기 등록이 접수되었습니다.', type: 'info', date: '2026-06-09 09:30' },
  { id: 'N-03', text: '[여권 만료 경고] Yuki 학생의 여권 잔여기간이 수강 종료일 이전입니다. 재발급을 확인하십시오.', type: 'warning', date: '2026-06-09 09:00' },
  { id: 'N-04', text: '[비자 만료 임박] Sophie 학생의 비자 만료일이 7일 남았습니다. 연장 신청이 필요합니다.', type: 'danger', date: '2026-06-08 17:00' },
  { id: 'N-05', text: '[기숙사 배정 변경] Leo 학생의 방이 Room 102/Bed C로 최종 확정되었습니다.', type: 'info', date: '2026-06-08 16:30' },
  { id: 'N-06', text: '[강사 배정 확정] Kevin 학생의 일대일 강사로 Sarah 강사가 매칭 완료되었습니다.', type: 'success', date: '2026-06-08 15:00' },
  { id: 'N-07', text: '[출결 긴급 통보] James 학생의 오늘 3교시 결석이 감지되었습니다.', type: 'danger', date: '2026-06-08 14:00' }
];

function renderAgencyNotifications() {
  const feed = document.getElementById('agency-notification-feed');
  const badge = document.getElementById('notification-count');
  if (!feed) return;

  badge.textContent = `${MOCK_AGENCY_NOTIFICATIONS.length}개`;
  feed.innerHTML = MOCK_AGENCY_NOTIFICATIONS.map(n => {
    let icon = 'ki-info';
    let color = '#5E5CE6';
    if (n.type === 'success') { icon = 'ki-check'; color = '#10B981'; }
    else if (n.type === 'warning') { icon = 'ki-warning'; color = '#F59E0B'; }
    else if (n.type === 'danger') { icon = 'ki-information-2'; color = '#EF4444'; }

    return `
      <div style="display:flex;gap:10px;padding:8px 12px;background:#F8F9FC;border-radius:8px;border-left:4px solid ${color};font-size:12px;align-items:start">
        <i class="ki-filled ${icon}" style="color:${color};font-size:14px;margin-top:2px"></i>
        <div style="flex:1">
          <div style="font-weight:600;color:#1F2937">${n.text}</div>
          <div style="font-size:10.5px;color:#9CA3AF;margin-top:2px">${n.date}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ── 업무 요청함 목업 데이터 ──────────────────────────────────
const MOCK_REMIT_REQUESTS = [
  { id:1, studentId:1,  studentName:'HONG GILDONG (Kevin)',  course:'IELTS 전문 코스', net:2080, remitDate:'2026-05-10', submittedAt:'2026-05-10', receipt:'영수증_Kevin.pdf',  status:'approved', note:'송금 확인 완료. 등록 확정 처리.', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:2, studentId:2,  studentName:'LEE YOUNGEOH (James)',  course:'일반 코스',        net:1138, remitDate:'2026-06-08', submittedAt:'2026-06-08', receipt:'영수증_James.pdf',  status:'approved', note:'송금 확인 완료. 등록 확정 처리.', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:3, studentId:9,  studentName:'KIM MINJUN (Minjun)',   course:'IELTS 전문 코스', net:2240, remitDate:'2026-06-12', submittedAt:'2026-06-12', receipt:'영수증_Minjun_임시.pdf', status:'pending', note:'환율 변동으로 금액 재확인 중 — 이체 예정일 6/20', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'' },
  { id:4, studentId:12, studentName:'NGUYEN THI LAN (Lan)',  course:'가디언 코스',      net:1600, remitDate:'2026-05-28', submittedAt:'2026-05-28', receipt:'영수증_Lan.pdf',    status:'approved', note:'에이전시 선납 확인 완료.', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:5, studentId:13, studentName:'PHAM MINH DUC (Duc)',   course:'IELTS 전문 코스', net:3360, remitDate:'2026-06-14', submittedAt:'2026-06-14', receipt:'영수증_Duc.pdf',    status:'pending',  note:'', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'' },
  { id:6, studentId:25, studentName:'SHIN EUNSOO (Erin)',    course:'주니어 패키지',    net:2261, remitDate:'2026-05-25', submittedAt:'2026-05-25', receipt:'영수증_Erin_1차.pdf', status:'approved', note:'1차 송금 확인 완료. 등록 확정 처리.', bank:'국민은행', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:7, studentId:25, studentName:'SHIN EUNSOO (Erin)',    course:'주니어 패키지',    net:150,  remitDate:'2026-06-01', submittedAt:'2026-06-01', receipt:'영수증_Erin_보증금.pdf', status:'approved', note:'보증금 입금 확인 완료.', bank:'신한은행', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
];
let MOCK_DORM_BOOK_REQUESTS = [];

const MOCK_CHANGE_REQUESTS = [
  { id:1, studentName:'이수빈 (James)',  field:'항공편 (입국)', oldVal:'PR502 | 2026-06-15', newVal:'PR734 | 2026-06-20', reason:'항공편 변경됨',     reqDate:'2026-05-20', status:'approved' },
  { id:2, studentName:'박민준 (Minjun)', field:'수강 기간',     oldVal:'8주',               newVal:'12주',              reason:'학생 요청으로 연장', reqDate:'2026-06-02', status:'pending'  },
  { id:3, studentName:'김수빈 (Subin)',  field:'비자 만료일',   oldVal:'2026-08-01',         newVal:'2026-10-01',        reason:'비자 갱신 완료',     reqDate:'2026-06-05', status:'rejected' },
];

function switchReqTab(tab) {
  ['remit', 'change'].forEach(t => {
    const panel = document.getElementById(`req-panel-${t}`);
    const btn   = document.getElementById(`req-tab-${t}`);
    if (panel) panel.style.display = t === tab ? '' : 'none';
    if (btn) {
      btn.style.borderBottomColor = t === tab ? '#D97706' : 'transparent';
      btn.style.color             = t === tab ? '#D97706' : '#6B7280';
    }
  });
}

function initAgencyRequestInbox() {
  const pending  = [...MOCK_REMIT_REQUESTS, ...MOCK_CHANGE_REQUESTS].filter(r => r.status === 'pending').length;
  const approved = [...MOCK_REMIT_REQUESTS, ...MOCK_CHANGE_REQUESTS].filter(r => r.status === 'approved').length;
  const rejected = [...MOCK_REMIT_REQUESTS, ...MOCK_CHANGE_REQUESTS].filter(r => r.status === 'rejected').length;
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('req-pending-count',  `대기중 ${pending}건`);
  setEl('req-approved-count', `승인 ${approved}건`);
  setEl('req-rejected-count', `반려 ${rejected}건`);

  // 기숙사 부킹 요청 탭 배지
  const dormPending = MOCK_DORM_BOOK_REQUESTS.filter(r => r.status === 'pending').length;
  const dormBadge   = document.getElementById('req-dorm-pending-badge');
  if (dormBadge) {
    if (dormPending > 0) {
      dormBadge.textContent = `${dormPending}건 대기`;
      dormBadge.style.display = 'inline';
    } else {
      dormBadge.style.display = 'none';
    }
  }

  const remitBody = document.getElementById('req-remit-body');
  if (remitBody) {
    remitBody.innerHTML = MOCK_REMIT_REQUESTS.map(r => {
      const [cls, label] = r.status === 'approved' ? ['tsa-badge-success','승인됨']
                         : r.status === 'rejected'  ? ['tsa-badge-danger', '반려됨']
                         :                            ['tsa-badge-warning','대기중'];
      return `<tr>
        <td style="font-weight:600">${r.studentName}</td>
        <td>${r.course}</td>
        <td style="text-align:right;font-weight:700;color:#5E5CE6">$${r.net.toLocaleString()}</td>
        <td>${r.remitDate}</td>
        <td><span style="color:#5E5CE6;font-size:11px;cursor:pointer"><i data-lucide="file-text"></i> ${r.receipt}</span></td>
        <td style="text-align:center"><span class="tsa-badge ${cls}">${label}</span></td>
        <td style="font-size:11px;color:#6B7280;max-width:160px">${r.note || '-'}</td>
      </tr>`;
    }).join('');
  }

  const changeBody = document.getElementById('req-change-body');
  if (changeBody) {
    changeBody.innerHTML = MOCK_CHANGE_REQUESTS.map(r => {
      const [cls, label] = r.status === 'approved' ? ['tsa-badge-success','승인됨']
                         : r.status === 'rejected'  ? ['tsa-badge-danger', '반려됨']
                         :                            ['tsa-badge-warning','대기중'];
      return `<tr>
        <td style="font-weight:600">${r.studentName}</td>
        <td><span class="tsa-badge tsa-badge-gray" style="font-size:10px">${r.field}</span></td>
        <td style="color:#6B7280;font-size:11px">${r.oldVal}</td>
        <td style="font-weight:600;color:#374151">${r.newVal}</td>
        <td style="font-size:11px;color:#6B7280">${r.reason}</td>
        <td style="font-size:11px;color:#9CA3AF">${r.reqDate}</td>
        <td style="text-align:center"><span class="tsa-badge ${cls}">${label}</span></td>
      </tr>`;
    }).join('');
  }
}

function openRemitRequestModal()  { alert('입금 확인서 제출 모달 (추후 구현 예정)'); }
function openChangeRequestModal() { alert('학생 정보 변경 요청 모달 (추후 구현 예정)'); }

let agencySelectedStudentIds = [];

// 탭 전환
function switchRemitTab(tab) {
  const panelWait    = document.getElementById('remit-panel-wait');
  const panelHistory = document.getElementById('remit-panel-history');
  const tabWait      = document.getElementById('remit-tab-wait');
  const tabHistory   = document.getElementById('remit-tab-history');
  if (!panelWait) return;

  if (tab === 'wait') {
    panelWait.style.display    = '';
    panelHistory.style.display = 'none';
    tabWait.style.color        = '#EA580C';
    tabWait.style.borderBottomColor = '#EA580C';
    tabHistory.style.color     = '#9CA3AF';
    tabHistory.style.borderBottomColor = 'transparent';
  } else {
    panelWait.style.display    = 'none';
    panelHistory.style.display = '';
    tabHistory.style.color     = '#16A34A';
    tabHistory.style.borderBottomColor = '#16A34A';
    tabWait.style.color        = '#9CA3AF';
    tabWait.style.borderBottomColor = 'transparent';
  }
  if (typeof refreshIcons === 'function') refreshIcons();
}

// 이력 필터 상태
let _remitHistoryFilter = 'all';
function filterRemitHistory(f) {
  _remitHistoryFilter = f;
  ['all','pending','approved','rejected'].forEach(k => {
    const btn = document.getElementById('rhf-' + k);
    if (!btn) return;
    if (k === f) {
      btn.style.background = '#374151'; btn.style.color = '#fff'; btn.style.borderColor = '#374151';
    } else {
      const cfg = { all: ['#F9FAFB','#374151','#E5E7EB'], pending: ['#EFF6FF','#1D4ED8','#BFDBFE'], approved: ['#F0FDF4','#15803D','#BBF7D0'], rejected: ['#FEF2F2','#DC2626','#FCA5A5'] };
      const [bg, clr, bc] = cfg[k] || ['#F9FAFB','#374151','#E5E7EB'];
      btn.style.background = bg; btn.style.color = clr; btn.style.borderColor = bc;
    }
  });
  _renderRemitHistoryRows();
}

let _remitHistoryAll = [];

function _renderRemitHistoryRows() {
  const tbody = document.getElementById('remit-history-tbody');
  if (!tbody) return;

  const list = _remitHistoryFilter === 'all'
    ? _remitHistoryAll
    : _remitHistoryAll.filter(r => {
        if (_remitHistoryFilter === 'approved') return r.status === 'approved' || r.status === 'paid';
        if (_remitHistoryFilter === 'pending')  return r.status === 'submitted' || r.status === 'pending';
        if (_remitHistoryFilter === 'rejected') return r.status === 'rejected';
        return true;
      });

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:28px;color:#9CA3AF">해당 상태의 이력이 없습니다</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map((r, idx) => {
    let statusBadge, rowBg;
    if (r.status === 'approved' || r.status === 'paid') {
      statusBadge = `<span class="tsa-badge tsa-badge-success" style="font-size:10px">✓ 승인 완료</span>`;
      rowBg = 'background:#F0FDF4';
    } else if (r.status === 'rejected') {
      statusBadge = `<span class="tsa-badge tsa-badge-danger" style="font-size:10px">✕ 반려</span>`;
      rowBg = 'background:#FEF2F2';
    } else {
      statusBadge = `<span class="tsa-badge tsa-badge-primary" style="font-size:10px">⏳ 검토 중</span>`;
      rowBg = '';
    }

    const adminNote = r.note
      ? `<span style="font-size:11px;color:${r.status === 'rejected' ? '#DC2626' : '#374151'}">${r.note}</span>`
      : `<span style="color:#D1D5DB;font-size:11px">-</span>`;

    const receiptEl = r.receipt && r.receipt !== '-'
      ? `<div style="display:flex;align-items:center;gap:5px">
           <i data-lucide="file-text" style="font-size:12px;color:#6B7280"></i>
           <span style="font-size:11px;color:#4F46E5;text-decoration:underline;cursor:pointer">${r.receipt}</span>
         </div>`
      : `<span style="color:#D1D5DB;font-size:11px">-</span>`;

    const memoEl = r.memo
      ? `<span style="font-size:11px;color:#374151;background:#F3F4F6;padding:2px 7px;border-radius:6px">${r.memo}</span>`
      : `<span style="color:#D1D5DB;font-size:11px">-</span>`;

    // 반려 시 재제출 버튼
    const resubmitBtn = r.status === 'rejected' && r.studentId
      ? `<button onclick="selectRemitStudent(${r.studentId})" style="margin-top:5px;padding:3px 9px;font-size:10.5px;font-weight:600;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:6px;color:#DC2626;cursor:pointer;display:block">
           <i data-lucide="refresh-cw" style="font-size:10px"></i> 재제출
         </button>` : '';

    return `
      <tr style="${rowBg}">
        <td style="text-align:center;color:#9CA3AF;font-size:11px">${idx + 1}</td>
        <td style="font-weight:700;font-size:12.5px;color:#111827">${r.studentName}</td>
        <td style="font-size:12px;color:#6B7280">${r.course}</td>
        <td style="font-size:13px;font-weight:800;color:#1E1B4B">$${r.net.toLocaleString()}</td>
        <td style="font-size:12px;color:#6B7280">${fmtDate(r.remitDate)}</td>
        <td>${receiptEl}</td>
        <td>${memoEl}</td>
        <td>${statusBadge}${resubmitBtn}</td>
        <td>${adminNote}</td>
      </tr>
    `;
  }).join('');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function getStatusBadgeHtml(status) {
  let label = '입학 대기';
  let badgeClass = 'tsa-badge-warning';
  if (status === 'current') {
    label = '재학';
    badgeClass = 'tsa-badge-success';
  } else if (status === 'completed') {
    label = '졸업';
    badgeClass = 'tsa-badge-gray';
  } else if (status === 'resigned') {
    label = '퇴원';
    badgeClass = 'tsa-badge-danger';
  } else if (status === 'extended') {
    label = '연장';
    badgeClass = 'tsa-badge-primary';
  }
  return `<span class="tsa-badge ${badgeClass}" style="font-size:10px">${label}</span>`;
}

function initAgencyDormRemit() {
  const tbody = document.getElementById('remit-wait-tbody');
  if (!tbody) return;

  initAgencyStudentDB();
  const agencyStudents = MOCK_STUDENTS.filter(s => s.agency && s.status !== 'completed' && s.status !== 'resigned');
  const pendingList = agencyStudents.filter(s => s.remittanceStatus !== 'paid');
  const sortedList = [...pendingList].sort((a, b) => {
    // 수강 시작일 내림차순 (최근 시작일 → 상단)
    const dateA = a.startDate || '';
    const dateB = b.startDate || '';
    if (dateB > dateA) return 1;
    if (dateB < dateA) return -1;
    return 0;
  });

  let totalNet = 0, unpaidCount = 0, draftCount = 0;

  if (sortedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:#16A34A;font-weight:600">✓ 모든 학생 송금이 완료되었습니다</td></tr>`;
  } else {
    tbody.innerHTML = sortedList.map((s, idx) => {
      const prices = calculatePrices(s);
      const net = prices.net;
      const isWaiting  = s.status === 'waiting';
      const isSubmitted = s.remittanceStatus === 'paid';
      const hasDraft   = !isSubmitted && (s.remittanceMemo || s.remittanceReceipt);

      totalNet += net;
      unpaidCount++;
      if (hasDraft) draftCount++;

      // 등록 상태 배지
      const stateBadge = getStatusBadgeHtml(s.status);

      // Net 금액
      const netDisplay = `<div style="font-size:14px;font-weight:800;color:#1E1B4B">$${net.toLocaleString()}</div>`;

      // 영수증/메모 상태 셀
      let draftCell = '';
      if (isSubmitted) {
        draftCell = `<div style="font-size:10.5px;color:#5E5CE6;font-weight:600">
          <i data-lucide="clock" style="font-size:11px"></i> 제출 완료 · 검토 중
        </div>`;
      } else if (hasDraft) {
        const filePart = s.remittanceReceipt
          ? `<div style="display:flex;align-items:center;gap:4px;margin-bottom:3px">
               <i data-lucide="file-check" style="font-size:11px;color:#2563EB"></i>
               <span style="font-size:10.5px;color:#2563EB;font-weight:600">${s.remittanceReceipt}</span>
             </div>` : '';
        const memoPart = s.remittanceMemo
          ? `<div style="font-size:10px;color:#6B7280;background:#F3F4F6;padding:2px 6px;border-radius:5px;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.remittanceMemo}</div>` : '';
        draftCell = `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:7px;padding:5px 8px">
          <div style="font-size:9.5px;color:#1D4ED8;font-weight:700;margin-bottom:3px">📎 임시저장됨</div>
          ${filePart}${memoPart}
        </div>`;
      } else {
        draftCell = `<span style="font-size:10.5px;color:#EF4444">미첨부</span>`;
      }

      // 액션 버튼
      let actionBtn = '';
      if (isSubmitted) {
        actionBtn = `<span class="tsa-badge tsa-badge-primary" style="font-size:10px;padding:5px 10px">어드민 검토 중</span>`;
      } else {
        const btnLabel = hasDraft ? '수정 후 제출' : '영수증 제출';
        const btnStyle = hasDraft
          ? 'background:#EFF6FF;border:1.5px solid #93C5FD;color:#1D4ED8'
          : 'background:#5E5CE6;color:#fff;border:none';
        actionBtn = `<button style="padding:6px 12px;border-radius:8px;font-size:11.5px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px;${btnStyle}"
             onclick="selectRemitStudent(${s.id})">
           <i data-lucide="${hasDraft ? 'edit-3' : 'upload'}" style="font-size:12px"></i> ${btnLabel}
         </button>`;
      }

      const rowBg = hasDraft ? 'background:#F0F7FF' : '';

      return `
        <tr style="${rowBg}">
          <td style="text-align:center;color:#9CA3AF;font-size:11px">${sortedList.length - idx}</td>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <img src="${s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png'}"
                   style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid ${isWaiting ? '#E5E7EB' : hasDraft ? '#93C5FD' : '#E5E7EB'};flex-shrink:0" alt=""/>
              <div>
                <div style="font-weight:700;font-size:12.5px;color:#111827">${s.name}</div>
                <div style="font-size:10px;color:#9CA3AF">Nick: ${s.nick} · ${s.nationality}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size:12px;font-weight:600;color:#374151">${s.course}</div>
            <div style="font-size:10px;color:#9CA3AF">${s.duration}주</div>
          </td>
          <td>${stateBadge}</td>
          <td>${netDisplay}</td>
          <td style="font-size:12px;color:#6B7280">${fmtDate(s.startDate) || '-'}</td>
          <td>${draftCell}</td>
          <td style="text-align:center">${actionBtn}</td>
        </tr>
      `;
    }).join('');
  }

  // 요약 바 업데이트
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('remit-wait-badge',    `${unpaidCount}건`);
  setEl('remit-summary-count', `${unpaidCount}건`);
  setEl('remit-total-badge',   `$${totalNet.toLocaleString()}`);
  setEl('remit-draft-badge',   `${draftCount}건`);

  // 홈 KPI
  const kpiEl = document.getElementById('kpi-dorm-beds');
  if (kpiEl) kpiEl.textContent = `${unpaidCount}건`;

  // 이력 렌더링
  renderRemitHistory(agencyStudents);

  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderRemitHistory(agencyStudents) {
  const badge = document.getElementById('remit-history-badge');

  const mockHistory = typeof MOCK_REMIT_REQUESTS !== 'undefined' ? [...MOCK_REMIT_REQUESTS] : [];

  // 실제 제출된 학생도 병합
  agencyStudents
    .filter(s => s.remittanceStatus === 'paid')
    .forEach(s => {
      const already = mockHistory.find(r => r.studentName && r.studentName.includes(s.nick));
      if (!already) {
        const prices = calculatePrices(s);
        mockHistory.unshift({
          id: 9000 + s.id,
          studentId: s.id,
          studentName: `${s.name} (${s.nick})`,
          course: s.course,
          net: prices.net,
          remitDate: s.remittanceDate ? s.remittanceDate.substring(0, 10) : '-',
          receipt: s.remittanceReceipt || '-',
          memo: s.remittanceMemo || '',
          status: s.remittanceStatus,
          note: ''
        });
      }
    });

  // MOCK_REMIT_REQUESTS에 studentId, memo 보완
  mockHistory.forEach(r => {
    if (!r.studentId) {
      const match = MOCK_STUDENTS.find(s => r.studentName && r.studentName.includes(s.nick));
      if (match) r.studentId = match.id;
    }
    if (!r.memo) r.memo = '';
  });

  _remitHistoryAll = mockHistory.sort((a, b) => b.id - a.id);
  if (badge) badge.textContent = `총 ${_remitHistoryAll.length}건`;

  _renderRemitHistoryRows();
}

let remitModalStudentId = null;
let remitModalFile = null;

function selectRemitStudent(id) {
  const s = MOCK_STUDENTS.find(std => std.id == id);
  if (!s) return;

  remitModalStudentId = id;
  remitModalFile = null;

  // 학생 정보 영역
  const avatarSrc = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';
  const infoEl = document.getElementById('remit-modal-student-info');
  if (infoEl) {
    infoEl.innerHTML = `
      <img src="${avatarSrc}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;border:2px solid #C7D2FE;flex-shrink:0" alt=""/>
      <div>
        <div style="font-size:15px;font-weight:700;color:#111827">${s.name}</div>
        <div style="font-size:11.5px;color:#6B7280;margin-top:2px">Nick: ${s.nick} &nbsp;·&nbsp; ${s.nationality} &nbsp;·&nbsp; ${s.course} (${s.duration}주)</div>
        <div style="font-size:11px;color:#9CA3AF;margin-top:2px">수강 시작: ${fmtDate(s.startDate)} &nbsp;·&nbsp; 기숙사: ${s.dorm}</div>
      </div>
    `;
  }

  // 금액 정산 내역
  const prices = calculatePrices(s);
  const calcEl = document.getElementById('remit-modal-calc');
  if (calcEl) {
    calcEl.innerHTML = `
      <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:10px">💰 B2B Net 학비 정산 내역</div>
      <div style="display:flex;flex-direction:column;gap:5px;font-size:12px">
        <div style="display:flex;justify-content:space-between"><span style="color:#6B7280">Gross 합계 (수강+기숙사+등록비)</span><span style="font-weight:600">$${prices.gross.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#4F46E5">에이전시 커미션 차감 (20%)</span><span style="font-weight:600;color:#4F46E5">- $${prices.commission.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#059669">해외 이체 수수료 (본인 부담)</span><span style="font-weight:600;color:#059669">+ $${prices.remitFee}</span></div>
        <div style="display:flex;justify-content:space-between;border-top:1.5px dashed #818CF8;padding-top:7px;margin-top:3px">
          <span style="font-size:13px;font-weight:700;color:#1E1B4B">최종 순 송금액 (Net)</span>
          <span style="font-size:15px;font-weight:800;color:#5E5CE6">$${prices.net.toLocaleString()}</span>
        </div>
      </div>
    `;
  }

  // 파일 초기화
  const fileBadge = document.getElementById('badge-remit-modal-file');
  const fileInput = document.getElementById('remit-modal-file-input');
  if (fileBadge) { fileBadge.textContent = '파일 미선택'; fileBadge.className = 'tsa-badge tsa-badge-gray'; }
  if (fileInput) fileInput.value = '';

  // 메모 초기화
  const memoEl = document.getElementById('remit-modal-memo');
  const memoBadge = document.getElementById('badge-remit-memo-saved');
  if (memoEl) memoEl.value = s.remittanceMemo || '';
  if (memoBadge) memoBadge.style.display = s.remittanceMemo ? 'inline' : 'none';

  openModal('modal-remit-submit');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function saveRemitModalMemo() {
  if (!remitModalStudentId) return;
  const s = MOCK_STUDENTS.find(std => std.id == remitModalStudentId);
  if (!s) return;
  const memoEl = document.getElementById('remit-modal-memo');
  const memoBadge = document.getElementById('badge-remit-memo-saved');
  s.remittanceMemo = memoEl ? memoEl.value.trim() : '';
  if (memoBadge) memoBadge.style.display = 'inline';
  showToast('✓ 비고 메모가 저장되었습니다.', 'success');
}

function handleRemitModalFileSelected() {
  const input = document.getElementById('remit-modal-file-input');
  const badge = document.getElementById('badge-remit-modal-file');
  if (input.files && input.files.length > 0) {
    remitModalFile = input.files[0].name;
    badge.textContent = `✓ ${remitModalFile}`;
    badge.className = 'tsa-badge tsa-badge-success';
  } else {
    remitModalFile = null;
    badge.textContent = '파일 미선택';
    badge.className = 'tsa-badge tsa-badge-gray';
  }
}

function submitAgencyRemittanceModal() {
  if (!remitModalStudentId) return;
  const s = MOCK_STUDENTS.find(std => std.id == remitModalStudentId);
  if (!s) return;

  if (!remitModalFile) {
    showToast('⚠ 입금 확인서 파일을 첨부해 주세요.', 'danger');
    return;
  }

  const memoEl = document.getElementById('remit-modal-memo');
  s.remittanceStatus = 'paid';
  s.remittanceReceipt = remitModalFile;
  s.remittanceDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
  s.remittanceMemo = memoEl ? memoEl.value.trim() : (s.remittanceMemo || '');

  closeModal('modal-remit-submit');
  showToast(`✓ ${s.name} 학생의 입금 확인서가 제출되어 완납 처리되었습니다.`, 'success');

  initAgencyDormRemit();
  initAgencyStudentList();
  if (typeof initAdminInbox === 'function') initAdminInbox();
}

function initAgencyInvoice() {
  const tbody = document.getElementById('invoice-table-body');
  const tfoot = document.getElementById('invoice-table-foot');
  if (!tbody) return;

  const statusFilter = document.getElementById('inv-filter-status')?.value || 'all';

  let students = MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을');
  if (statusFilter !== 'all') {
    students = students.filter(s => {
      const st = s.remittanceStatus || 'unpaid';
      return st === statusFilter;
    });
  }

  let totalGross = 0, totalPaid = 0, totalUnpaid = 0, totalCommission = 0;

  tbody.innerHTML = students.map(s => {
    const p = calculatePrices(s);
    totalGross += p.gross;
    totalCommission += p.commission;
    if (s.remittanceStatus === 'paid') totalPaid += p.net;
    else totalUnpaid += p.net;

    let paidLabel = '미납', paidClass = 'tsa-badge-danger';
    if (s.remittanceStatus === 'paid') { paidLabel = '완납'; paidClass = 'tsa-badge-success'; }

    let statusLabel = '입학 대기', statusClass = 'tsa-badge-warning';
    if (s.status === 'current') { statusLabel = '재학'; statusClass = 'tsa-badge-success'; }
    else if (s.status === 'completed') { statusLabel = '졸업'; statusClass = 'tsa-badge-gray'; }
    else if (s.status === 'resigned') { statusLabel = '퇴원'; statusClass = 'tsa-badge-danger'; }
    else if (s.status === 'extended') { statusLabel = '연장'; statusClass = 'tsa-badge-primary'; }

    const avatarSrc = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';

    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <img src="${avatarSrc}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB"/>
            <div>
              <div style="font-weight:600;font-size:12px">${s.name}</div>
              <div style="font-size:10px;color:#6B7280">Nick: ${s.nick}</div>
            </div>
          </div>
        </td>
        <td>${s.course}</td>
        <td style="text-align:center">${s.duration}주</td>
        <td style="text-align:right">$${p.tuition.toLocaleString()}</td>
        <td style="text-align:right">$${p.dorm.toLocaleString()}</td>
        <td style="text-align:right">$${p.registration.toLocaleString()}</td>
        <td style="text-align:right;font-weight:700;color:#5E5CE6">$${p.gross.toLocaleString()}</td>
        <td style="text-align:right;color:#F59E0B">-$${p.commission.toLocaleString()} <span style="font-size:10px">(20%)</span></td>
        <td style="text-align:right;font-weight:700;color:#10B981">$${p.net.toLocaleString()}</td>
        <td style="text-align:center">
          <span class="tsa-badge ${statusClass}" style="font-size:10px">${statusLabel}</span>
        </td>
        <td style="text-align:center">
          <span class="tsa-badge ${paidClass}" style="font-size:10px">${paidLabel}</span>
        </td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openAgencyStudentDetailModal(${s.id});setTimeout(()=>switchAdetailTab('settle'),300)">
            <i data-lucide="file-text"></i> 보기
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Footer 합계
  tfoot.innerHTML = `
    <tr style="background:#F8F9FC;font-weight:700;font-size:12px">
      <td colspan="6" style="padding:10px 14px;color:#374151">합계 (${students.length}명)</td>
      <td style="text-align:right;color:#5E5CE6;padding:10px 14px">$${totalGross.toLocaleString()}</td>
      <td style="text-align:right;color:#F59E0B;padding:10px 14px">-$${totalCommission.toLocaleString()}</td>
      <td style="text-align:right;color:#10B981;padding:10px 14px">$${(totalGross - totalCommission).toLocaleString()}</td>
      <td colspan="3" style="padding:10px 14px"></td>
    </tr>
  `;

  // KPI 업데이트
  const grossAll = MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을').reduce((sum, s) => sum + calculatePrices(s).gross, 0);
  const commAll  = MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을').reduce((sum, s) => sum + calculatePrices(s).commission, 0);
  const paidAll  = MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을' && s.remittanceStatus === 'paid').reduce((sum, s) => sum + calculatePrices(s).net, 0);
  const unpaidAll= MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을' && s.remittanceStatus !== 'paid').reduce((sum, s) => sum + calculatePrices(s).net, 0);

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('inv-kpi-gross',      `$${grossAll.toLocaleString()}`);
  setEl('inv-kpi-paid',       `$${paidAll.toLocaleString()}`);
  setEl('inv-kpi-unpaid',     `$${unpaidAll.toLocaleString()}`);
  setEl('inv-kpi-commission', `$${commAll.toLocaleString()}`);
}

function initAgencyStudentList() {
  initAgencyStudentDB();
  if (!APP._agencyStatusFilter) APP._agencyStatusFilter = 'all';
  renderAgencyStatusCards();

  const tbody = document.getElementById('agency-student-history-body');
  if (!tbody) return;

  let list = MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을');

  if (APP.user === 'agency_branch') {
    list = list.filter(s => {
      const agencyStd = MOCK_AGENCY_STUDENTS.find(a => a.name.includes(s.name) || a.name.includes(s.nick));
      return agencyStd && agencyStd.branch === '강남지사';
    });
  }

  const query = document.getElementById('filter-agency-query').value.toLowerCase().trim();
  if (query) {
    list = list.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.nick.toLowerCase().includes(query) || 
      (s.passportNum && s.passportNum.toLowerCase().includes(query)) ||
      (s.flightInfo && s.flightInfo.toLowerCase().includes(query))
    );
  }

  const courseFilter = document.getElementById('filter-agency-course').value;
  if (courseFilter !== 'all') {
    list = list.filter(s => s.course && s.course.includes(courseFilter));
  }

  const visaFilter = document.getElementById('filter-agency-visa').value;
  if (visaFilter !== 'all') {
    const today = new Date();
    list = list.filter(s => {
      if (!s.visaExpiry || s.visaExpiry === '면제') return false;
      const exp = new Date(s.visaExpiry);
      const diff = Math.ceil((exp - today) / (1000*60*60*24));
      if (visaFilter === 'expired') return diff < 0;
      return diff >= 0 && diff <= parseInt(visaFilter);
    });
  }

  const sspFilter = document.getElementById('filter-agency-ssp').value;
  if (sspFilter !== 'all') {
    const today = new Date();
    list = list.filter(s => {
      if (!s.sspExpiry || s.sspExpiry === '면제') return false;
      const exp = new Date(s.sspExpiry);
      const diff = Math.ceil((exp - today) / (1000*60*60*24));
      if (sspFilter === 'expired') return diff < 0;
      return diff >= 0 && diff <= parseInt(sspFilter);
    });
  }

  const invoiceFilter = document.getElementById('filter-agency-invoice').value;
  if (invoiceFilter !== 'all') {
    list = list.filter(s => {
      const hasInvoice = s.remittanceStatus === 'paid';
      return invoiceFilter === 'issued' ? hasInvoice : !hasInvoice;
    });
  }

  const startFrom = document.getElementById('filter-agency-start-from').value;
  const startTo = document.getElementById('filter-agency-start-to').value;
  if (startFrom) list = list.filter(s => s.startDate >= startFrom);
  if (startTo) list = list.filter(s => s.startDate <= startTo);

  const arrivalFrom = document.getElementById('filter-agency-arrival-from').value;
  const arrivalTo = document.getElementById('filter-agency-arrival-to').value;
  if (arrivalFrom) list = list.filter(s => s.arrivalDate >= arrivalFrom);
  if (arrivalTo) list = list.filter(s => s.arrivalDate <= arrivalTo);

  // 상태 카드 필터 (체크박스 대신 APP._agencyStatusFilter 사용)
  const activeStatus = APP._agencyStatusFilter || 'all';
  if (activeStatus === 'current') {
    list = list.filter(s => s.status === 'current' || s.status === 'extended');
  } else if (activeStatus !== 'all') {
    list = list.filter(s => s.status === activeStatus);
  }

  const checkedPaid = Array.from(document.querySelectorAll('.filter-agency-paid-cb:checked')).map(cb => cb.value);
  list = list.filter(s => {
    const state = s.remittanceStatus === 'paid' ? 'paid' : 'unpaid';
    return checkedPaid.includes(state);
  });

  const sortedList = [...list].sort((a, b) => b.id - a.id);
  const totalList = sortedList.length;

  tbody.innerHTML = sortedList.map((s, idx) => {
    const rowNum = totalList - idx;
    const isChecked = agencySelectedStudentIds.includes(s.id) ? 'checked' : '';
    const prices = calculatePrices(s);

    let state = '입학 대기';
    let badgeClass = 'tsa-badge-warning';
    if (s.status === 'completed') { state = '졸업'; badgeClass = 'tsa-badge-gray'; }
    else if (s.status === 'resigned') { state = '퇴원'; badgeClass = 'tsa-badge-danger'; }
    else if (s.status === 'current') { state = '재학'; badgeClass = 'tsa-badge-success'; }
    else if (s.status === 'extended') { state = '연장'; badgeClass = 'tsa-badge-primary'; }

    let paidLabel = '미납';
    let paidClass = 'tsa-badge-danger';
    if (s.remittanceStatus === 'paid') { paidLabel = '완납'; paidClass = 'tsa-badge-success'; }

    const avatarSrc = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';

    let teacherName = '미배정';
    const tMatch = MOCK_TIMETABLE.find(t => t.slots.some(slot => slot.student === s.nick));
    if (tMatch) teacherName = tMatch.teacher;

    return `
      <tr>
        <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${rowNum}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${avatarSrc}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;" alt=""/>
            <div>
              <div style="font-weight:600;font-size:13px">${s.name}</div>
              <div style="font-size:10.5px;color:#6B7280">Nick: ${s.nick} &nbsp;·&nbsp; ${s.gender}성 ${s.age}세</div>
              <div style="font-size:10.5px;color:#9CA3AF">${s.passportNum || '-'}</div>
            </div>
          </div>
        </td>
        <td>${s.nationality}</td>
        <td>${s.course}</td>
        <td><span class="tsa-badge ${badgeClass}">${state}</span></td>
        <td><span class="tsa-badge ${paidClass}">${paidLabel}</span></td>
        <td class="col-commission">${s.remittanceStatus !== 'paid'
          ? `<span style="color:#9CA3AF;font-size:11px">~$${prices.commission.toLocaleString()}</span><br><span style="font-size:9.5px;color:#D1D5DB;font-style:italic">정산 예정</span>`
          : `$${prices.commission.toLocaleString()} (20%)`}</td>
        <td>${s.remittanceStatus !== 'paid'
          ? `<span style="color:#9CA3AF;font-size:11px">~$${prices.gross.toLocaleString()}</span><br><span style="font-size:9.5px;color:#D1D5DB;font-style:italic">정산 예정</span>`
          : `$${prices.gross.toLocaleString()}`}</td>
        <td style="font-size:11.5px;white-space:nowrap">
          <div>${fmtDate(s.startDate) || '-'}</div>
          <div style="color:#9CA3AF;font-size:10.5px">~ ${fmtDate(s.endDate) || `(${s.duration}주)`}</div>
        </td>
        <td class="col-flight" style="font-size:11px;line-height:1.8">
          <div><span style="color:#6B7280;font-size:10px">입국</span> ${fmtFlightStr(s.flightInfo) || '-'}</div>
          <div><span style="color:#6B7280;font-size:10px">출국</span> ${fmtFlightStr(s.flightOutInfo) || fmtDate(s.departureDate) || '-'}</div>
        </td>
        <td class="col-visa">${fmtDate(s.visaExpiry)}</td>
        <td class="col-ssp">${fmtDate(s.sspExpiry)}</td>
        <td class="col-dorm">${(() => {
          const req = MOCK_DORM_BOOK_REQUESTS.find(r => r.studentId === s.id || r.studentName === s.name || r.studentName === s.nick);
          if (req) return `<span style="font-size:12px;font-weight:600;color:#374151">${req.roomType}</span>${req.genderPref && req.genderPref !== '전체' ? `<br><span style="font-size:10px;color:#9CA3AF">${req.genderPref} 희망</span>` : ''}`;
          if (s.dormAccomType || s.dormType) {
            const parts = [s.dormAccomType, s.dormType, s.dormGrade].filter(Boolean);
            return `<span style="font-size:12px;font-weight:600;color:#374151">${parts.join(' · ')}</span>`;
          }
          return `<span style="color:#D1D5DB;font-size:12px">-</span>`;
        })()}</td>
        <td style="text-align:center">
          <div style="display:flex;gap:6px;justify-content:center">
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" style="color:#5E5CE6;border-color:#5E5CE6" onclick="openAgencyStudentDetailModal(${s.id})">상세/수정</button>
            ${s.status === 'waiting'
              ? `<button class="tsa-btn tsa-btn-xs" disabled style="background:#F3F4F6;color:#D1D5DB;border:1px solid #E5E7EB;cursor:not-allowed" title="입학 대기 상태에서는 서류 출력 불가">서류출력</button>`
              : `<button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openAgencyDocumentsInline(${s.id})">서류출력</button>`}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const select = document.getElementById('remit-student-select');
  if (select) {
    // 입학 대기, 재학, 연장 상태의 미납 학생을 송금 대상으로 노출
    const remitList = list.filter(s => s.remittanceStatus !== 'paid' && (s.status === 'waiting' || s.status === 'current' || s.status === 'extended'));
    select.innerHTML = '<option value="">학생 선택...</option>' +
      remitList.map(s => `<option value="${s.id}">${s.name} (Nick: ${s.nick})</option>`).join('');
  }

  initAgencyKPIs();
  renderAgencyNotifications();
  if (typeof handleColumnToggle === 'function') handleColumnToggle();
}

function resetAgencyFilters() {
  document.getElementById('filter-agency-course').value = 'all';
  document.getElementById('filter-agency-visa').value = 'all';
  document.getElementById('filter-agency-ssp').value = 'all';
  document.getElementById('filter-agency-invoice').value = 'all';
  document.getElementById('filter-agency-start-from').value = '';
  document.getElementById('filter-agency-start-to').value = '';
  document.getElementById('filter-agency-arrival-from').value = '';
  document.getElementById('filter-agency-arrival-to').value = '';
  document.getElementById('filter-agency-query').value = '';
  document.querySelectorAll('.filter-agency-paid-cb').forEach(cb => { cb.checked = true; });
  APP._agencyStatusFilter = 'all';
  renderAgencyStatusCards();
  initAgencyStudentList();
}

// 상태 카드 클릭 — 단일 선택, 카드 하이라이트 + 목록 필터
function setAgencyStatusCard(status) {
  APP._agencyStatusFilter = status;
  renderAgencyStatusCards();
  initAgencyStudentList();
}

// 상태 카드 카운트 업데이트 + 활성 카드 강조
function renderAgencyStatusCards() {
  const agency = '한국 영어마을';
  const students = MOCK_STUDENTS.filter(s => s.agency === agency);
  const counts = {
    all:       students.length,
    current:   students.filter(s => s.status === 'current' || s.status === 'extended').length,
    waiting:   students.filter(s => s.status === 'waiting').length,
    completed: students.filter(s => s.status === 'completed').length,
    resigned:  students.filter(s => s.status === 'resigned').length,
  };
  const colors = { all: '#374151', current: '#5E5CE6', waiting: '#D97706', completed: '#6B7280', resigned: '#EF4444' };
  const active = APP._agencyStatusFilter || 'all';

  ['all','current','waiting','completed','resigned'].forEach(s => {
    const card = document.getElementById(`asc-${s}`);
    const countEl = document.getElementById(`asc-count-${s}`);
    if (countEl) countEl.textContent = counts[s];
    if (card) {
      card.style.borderColor = (s === active) ? colors[s] : 'transparent';
      card.style.background  = (s === active) ? colors[s] + '12' : '';
    }
  });
}

function filterAgencyStudentListByKpi(type) {
  navigate('agency-students');
  setTimeout(() => {
    resetAgencyFilters();
    if (type === 'active')   { APP._agencyStatusFilter = 'current'; }
    else if (type === 'waiting' || type === 'new') { APP._agencyStatusFilter = 'waiting'; }
    else if (type === 'unpaid') {
      document.querySelectorAll('.filter-agency-paid-cb').forEach(cb => { cb.checked = (cb.value === 'unpaid'); });
    } else if (type === 'visa') {
      document.getElementById('filter-agency-visa').value = '30';
    }
    renderAgencyStatusCards();
    filterAgencyStudentList();
  }, 150);
}

/* ─── 에이전시 기숙사 필터 ─── */
let _agencyDormAccomFilter = '전체';
let _agencyDormCapFilter   = '전체';
let _agencyDormGradeFilter = '전체';

function setAgencyDormAccomFilter(btn, value) {
  _agencyDormAccomFilter = value;
  document.querySelectorAll('[id^="dorm-accom-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAgencyDormList();
}

function setAgencyDormCapFilter(btn, value) {
  _agencyDormCapFilter = value;
  document.querySelectorAll('[id^="dorm-cap-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAgencyDormList();
}

function setAgencyDormGradeFilter(btn, value) {
  _agencyDormGradeFilter = value;
  document.querySelectorAll('[id^="dorm-grade-"]').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderAgencyDormList();
}

function renderAgencyDormList() {
  const tbody = document.getElementById('agency-dorm-type-list');
  if (!tbody) return;

  // 템플릿 기준으로 집계 (MOCK_DORM_TEMPLATES가 source of truth)
  let rows = MOCK_DORM_TEMPLATES.map(tpl => {
    const typeStr = `${tpl.capacity}인실 (${tpl.condition})`;
    const capStr  = `${tpl.capacity}인실`;
    const totalBeds = tpl.count * tpl.capacity;

    // 실제 점유 침대 수 (MOCK_DORM_ROOMS 기준)
    let occupied = 0;
    MOCK_DORM_ROOMS.filter(r => r.accomType === tpl.accomType && r.type === typeStr)
      .forEach(room => room.beds.forEach(bed => { if (bed.student) occupied++; }));

    // 예약 대기 학생 수 (미배정 + 완납 학생만)
    const reserved = MOCK_STUDENTS.filter(s =>
      s.dorm === '미배정' &&
      s.remittanceStatus === 'paid' &&
      s.dormAccomType === tpl.accomType &&
      s.dormType === capStr &&
      s.dormGrade === tpl.condition
    ).length;

    const vacant = Math.max(0, totalBeds - occupied - reserved);
    return { accomType: tpl.accomType, cap: capStr, grade: tpl.condition, total: totalBeds, occupied, reserved, vacant };
  });

  if (_agencyDormAccomFilter !== '전체') rows = rows.filter(r => r.accomType === _agencyDormAccomFilter);
  if (_agencyDormCapFilter !== '전체')   rows = rows.filter(r => r.cap   === _agencyDormCapFilter);
  if (_agencyDormGradeFilter !== '전체') rows = rows.filter(r => r.grade === _agencyDormGradeFilter);
  if (_dormFilterGender !== '전체') rows = rows.filter(r => (r.gender || '전체') === _dormFilterGender || (r.gender || '전체') === '전체');

  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#9CA3AF">조건에 맞는 룸 타입이 없습니다.</td></tr>';
    return;
  }

  tbody.innerHTML = rows.map((r, idx) => {
    const vacant = r.total - r.occupied - r.reserved;
    const statusColor = vacant > 0 ? '#10B981' : '#EF4444';
    const statusLabel = vacant > 0 ? `공실 ${vacant}석` : '만실';
    const accomBadgeColor = r.accomType === 'IT Park 콘도' ? '#8B5CF6' : '#5E5CE6';
    const rowKey = `${r.accomType}__${r.cap}__${r.grade}`;

    // 해당 타입 대기 학생 목록
    const waitingStudents = MOCK_STUDENTS.filter(s =>
      s.dorm === '미배정' &&
      s.remittanceStatus === 'paid' &&
      s.dormAccomType === r.accomType &&
      s.dormType === r.cap &&
      s.dormGrade === r.grade
    );

    const studentRows = waitingStudents.length > 0
      ? waitingStudents.map(s => `
          <tr style="background:#F8FAFF">
            <td style="padding:8px 14px">
              <strong style="font-size:12px">${s.nick}</strong>
              <span style="font-size:10.5px;color:#6B7280;margin-left:6px">${s.name}</span>
            </td>
            <td style="font-size:11.5px;color:#374151">${s.flag || ''} ${s.nationality}</td>
            <td style="font-size:11.5px">${s.gender === '남' ? '남성' : '여성'}</td>
            <td style="font-size:11px;color:#6B7280">${s.startDate || '-'} ~ ${s.departureDate || '-'}</td>
            <td style="font-size:11.5px;color:#6B7280">${s.agency || '-'}</td>
            <td colspan="4" style="text-align:right;padding-right:14px">
              <span style="font-size:11px;color:#D97706;font-weight:700;background:#FEF3C7;padding:2px 10px;border-radius:10px">배정 대기</span>
            </td>
          </tr>`).join('')
      : `<tr style="background:#F8FAFF"><td colspan="9" style="text-align:center;padding:12px;color:#9CA3AF;font-size:12px">이 타입의 배정 대기 학생이 없습니다.</td></tr>`;

    return `
    <tr style="cursor:pointer;transition:background 0.15s" id="dorm-row-${idx}"
        onclick="filterDormWaitingList('${r.accomType}','${r.cap}','${r.grade}', ${idx})"
        onmouseenter="this.style.background='#F5F3FF'" onmouseleave="if(!this.dataset.active) this.style.background=''">
      <td><span style="font-size:11px;font-weight:700;color:${accomBadgeColor};background:${accomBadgeColor}15;padding:2px 8px;border-radius:10px">${r.accomType}</span></td>
      <td><strong>${r.cap} ${r.grade}</strong></td>
      <td>${r.grade}</td>
      <td>${r.cap}</td>
      <td style="text-align:center">${r.total}</td>
      <td style="text-align:center;color:#374151">${r.occupied}</td>
      <td style="text-align:center;color:#D97706;font-weight:${r.reserved > 0 ? '700' : '400'}">${r.reserved > 0 ? r.reserved : '-'}</td>
      <td style="text-align:center;font-weight:700;color:${statusColor}">${vacant}</td>
      <td style="text-align:center">
        <span style="font-size:11px;font-weight:700;color:${statusColor};background:${statusColor}18;padding:3px 10px;border-radius:12px">${statusLabel}</span>
        <i data-lucide="chevron-right" style="width:13px;height:13px;color:#9CA3AF;margin-left:4px;vertical-align:middle" id="chevron-${idx}"></i>
      </td>
    </tr>`;
  }).join('');

  const summaryEl = document.getElementById('agency-dorm-result-summary');
  if (summaryEl) {
    const totalVacant = rows.reduce((s, r) => s + Math.max(0, r.total - r.occupied - r.reserved), 0);
    summaryEl.textContent = `총 ${rows.length}개 타입 · 공실 ${totalVacant}석`;
  }
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);

  // 하단 배정 대기 리스트 전체 표시
  renderDormWaitingList(null);

  // 호실 카드 뷰 렌더
  renderAgencyDormRoomGrid();
}

function renderAgencyDormRoomGrid() {
  const grid = document.getElementById('agency-dorm-room-grid');
  if (!grid) return;

  const startVal = document.getElementById('agency-dorm-start-date')?.value;
  const endVal   = document.getElementById('agency-dorm-end-date')?.value;
  const searchStart = startVal ? new Date(startVal) : null;
  const searchEnd   = endVal   ? new Date(endVal)   : null;

  // 날짜 겹침 판단: 기존 입실~퇴실과 검색 기간이 하나라도 겹치면 사용 중
  function isOverlap(bedStart, bedEnd) {
    if (!searchStart || !searchEnd) return !!bedStart; // 날짜 미입력 시 현재 점유 여부만
    if (!bedStart) return false;
    const bs = new Date(`2026-${bedStart}`);
    const be = bedEnd ? new Date(`2026-${bedEnd}`) : new Date('2026-12-31');
    return bs <= searchEnd && be >= searchStart;
  }

  let rooms = [...MOCK_DORM_ROOMS].filter(r => r.roomNo);

  // 필터 적용
  if (_agencyDormAccomFilter !== '전체') rooms = rooms.filter(r => r.accomType === _agencyDormAccomFilter);
  if (_agencyDormCapFilter   !== '전체') rooms = rooms.filter(r => r.capacity === parseInt(_agencyDormCapFilter));
  if (_dormFilterGender      !== '전체') rooms = rooms.filter(r => r.genderRestriction === '무관' || r.genderRestriction === _dormFilterGender);

  // 등급 필터
  if (_agencyDormGradeFilter !== '전체') {
    rooms = rooms.filter(r => r.type && r.type.includes(_agencyDormGradeFilter));
  }

  if (rooms.length === 0) {
    grid.innerHTML = `<div style="text-align:center;padding:60px;color:#9CA3AF;font-size:13px">조건에 맞는 호실이 없습니다.</div>`;
    return;
  }

  // 유형별 그룹
  const groups = {};
  rooms.forEach(r => {
    const key = `${r.accomType} · ${r.type}`;
    if (!groups[key]) groups[key] = { accomType: r.accomType, type: r.type, capacity: r.capacity, rooms: [] };
    groups[key].rooms.push(r);
  });

  const accomColor = { '가든 호텔': '#5E5CE6', 'IT Park 콘도': '#8B5CF6' };
  const genderIcon = { '남성': '♂', '여성': '♀', '무관': '⚥' };
  const genderColor = { '남성': '#0EA5E9', '여성': '#EC4899', '무관': '#6B7280' };

  grid.innerHTML = Object.values(groups).map(g => {
    const color = accomColor[g.accomType] || '#5E5CE6';

    // 그룹 집계
    let totalBeds = 0, vacantBeds = 0, occupiedBeds = 0, incomingBeds = 0;
    g.rooms.forEach(r => {
      (r.beds || []).forEach(b => {
        totalBeds++;
        if (isOverlap(b.start, b.end)) occupiedBeds++;
        else if (b.incoming) incomingBeds++;
        else vacantBeds++;
      });
    });

    const roomCards = g.rooms.map(r => {
      const gr = r.genderRestriction || '무관';
      const beds = (r.beds || []).map(b => {
        const occupied = isOverlap(b.start, b.end);
        const hasIncoming = !occupied && b.incoming;

        let bedBg, bedBorder, bedLabel, bedSub;
        if (occupied) {
          bedBg = '#F3F4F6'; bedBorder = '#D1D5DB';
          bedLabel = `<span style="font-size:11px;font-weight:600;color:#374151">사용 중</span>`;
          bedSub = '';
        } else if (hasIncoming) {
          bedBg = '#FEF3C7'; bedBorder = '#FCD34D';
          bedLabel = `<span style="font-size:11px;font-weight:600;color:#D97706">입실 예정</span>`;
          bedSub = `<div style="font-size:10px;color:#D97706">${b.incoming.date}</div>`;
        } else {
          bedBg = '#F0FDF4'; bedBorder = '#6EE7B7';
          bedLabel = `<span style="font-size:11px;font-weight:700;color:#10B981">공실</span>`;
          bedSub = '';
        }

        return `<div style="border:1.5px solid ${bedBorder};border-radius:8px;background:${bedBg};padding:8px 10px;min-width:80px;flex:1">
          <div style="font-size:10px;color:#6B7280;margin-bottom:3px">침대 ${b.id}</div>
          ${bedLabel}${bedSub}
        </div>`;
      }).join('');

      return `<div style="background:#fff;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:13px;font-weight:800;color:#111827">${r.roomNo}호</span>
          <span style="font-size:11px;color:${genderColor[gr]};font-weight:600">${genderIcon[gr]} ${gr}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">${beds}</div>
      </div>`;
    }).join('');

    const statusColor = vacantBeds > 0 ? '#10B981' : '#EF4444';
    const statusLabel = vacantBeds > 0 ? `공실 ${vacantBeds}개` : '만실';

    return `<div style="border-radius:12px;border:1px solid #E5E7EB;overflow:hidden">
      <!-- 그룹 헤더 -->
      <div style="background:#F8F9FF;border-bottom:1px solid #E5E7EB;padding:12px 18px;display:flex;align-items:center;gap:10px">
        <span style="font-size:11px;font-weight:700;color:${color};background:${color}15;padding:2px 10px;border-radius:10px">${g.accomType}</span>
        <span style="font-size:13px;font-weight:700;color:#111827">${g.type}</span>
        <div style="margin-left:auto;display:flex;gap:16px;align-items:center">
          <span style="font-size:11.5px;color:#6B7280">총 ${totalBeds}침대</span>
          <span style="font-size:11.5px;color:#374151">사용 중 <b>${occupiedBeds}</b></span>
          ${incomingBeds > 0 ? `<span style="font-size:11.5px;color:#D97706">입실예정 <b>${incomingBeds}</b></span>` : ''}
          <span style="font-size:12px;font-weight:700;color:${statusColor};background:${statusColor}15;padding:3px 12px;border-radius:10px">${statusLabel}</span>
        </div>
      </div>
      <!-- 호실 카드 그리드 -->
      <div style="padding:14px 16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px">
        ${roomCards}
      </div>
    </div>`;
  }).join('');
}

let _dormWaitingActiveIdx = null;

function filterDormWaitingList(accomType, cap, grade, rowIdx) {
  // 이미 선택된 행 클릭 시 → 전체 보기로 복귀
  if (_dormWaitingActiveIdx === rowIdx) {
    resetDormWaitingFilter();
    return;
  }
  // 이전 활성 행 스타일 초기화
  if (_dormWaitingActiveIdx !== null) {
    const prev = document.getElementById(`dorm-row-${_dormWaitingActiveIdx}`);
    if (prev) { prev.style.background = ''; delete prev.dataset.active; }
    const prevChev = document.getElementById(`chevron-${_dormWaitingActiveIdx}`);
    if (prevChev) prevChev.setAttribute('data-lucide', 'chevron-right');
  }
  _dormWaitingActiveIdx = rowIdx;
  const row = document.getElementById(`dorm-row-${rowIdx}`);
  if (row) { row.style.background = '#F5F3FF'; row.dataset.active = '1'; }
  const chev = document.getElementById(`chevron-${rowIdx}`);
  if (chev) chev.setAttribute('data-lucide', 'chevron-down');
  if (typeof refreshIcons === 'function') refreshIcons();

  renderDormWaitingList({ accomType, cap, grade });
  // 하단 섹션으로 부드럽게 스크롤
  const section = document.getElementById('dorm-waiting-section');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetDormWaitingFilter() {
  if (_dormWaitingActiveIdx !== null) {
    const prev = document.getElementById(`dorm-row-${_dormWaitingActiveIdx}`);
    if (prev) { prev.style.background = ''; delete prev.dataset.active; }
    const prevChev = document.getElementById(`chevron-${_dormWaitingActiveIdx}`);
    if (prevChev) prevChev.setAttribute('data-lucide', 'chevron-right');
  }
  _dormWaitingActiveIdx = null;
  if (typeof refreshIcons === 'function') refreshIcons();
  renderDormWaitingList(null);
}

function renderDormWaitingList(filter) {
  const tbody = document.getElementById('dorm-waiting-list-tbody');
  if (typeof APP !== 'undefined' && APP.user && APP.user.startsWith('agency')) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:#9CA3AF;font-size:12px">접근 권한이 없습니다.</td></tr>`;
    return;
  }
  const labelEl = document.getElementById('dorm-waiting-filter-label');
  const resetBtn = document.getElementById('dorm-waiting-reset-btn');
  if (!tbody) return;

  let students = MOCK_STUDENTS.filter(s => s.dorm === '미배정' && s.dormAccomType && s.remittanceStatus === 'paid');
  if (filter) {
    students = students.filter(s =>
      s.dormAccomType === filter.accomType &&
      s.dormType === filter.cap &&
      s.dormGrade === filter.grade
    );
    if (labelEl) labelEl.textContent = `${filter.accomType} ${filter.cap} ${filter.grade}`;
    if (resetBtn) resetBtn.style.display = 'block';
  } else {
    if (labelEl) labelEl.textContent = `전체 ${students.length}명`;
    if (resetBtn) resetBtn.style.display = 'none';
  }

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:#9CA3AF;font-size:12px">
      ${filter ? '해당 유형의 배정 대기 학생이 없습니다.' : '배정 대기 학생이 없습니다.'}
    </td></tr>`;
    return;
  }

  tbody.innerHTML = students.map(s => {
    const genderLabel = s.gender === '남' ? '남성' : '여성';
    const accomColor = s.dormAccomType === 'IT Park 콘도' ? '#8B5CF6' : '#5E5CE6';
    return `
      <tr style="transition:background 0.12s" onmouseenter="this.style.background='#F9FAFB'" onmouseleave="this.style.background=''">
        <td>
          <strong style="font-size:12.5px">${s.nick}</strong>
          <span style="font-size:10.5px;color:#9CA3AF;margin-left:5px">${s.name}</span>
        </td>
        <td style="font-size:12px">${s.flag || ''} ${s.nationality}</td>
        <td style="font-size:12px">${genderLabel}</td>
        <td><span style="font-size:11px;font-weight:700;color:${accomColor};background:${accomColor}15;padding:2px 7px;border-radius:8px">${s.dormAccomType}</span></td>
        <td style="font-size:12px;color:#374151">${s.dormGrade || '-'}</td>
        <td style="font-size:12px;color:#374151">${s.dormType || '-'}</td>
        <td style="font-size:11.5px;color:#6B7280">${s.startDate || '-'} ~ ${s.departureDate || '-'}</td>
        <td style="font-size:12px;color:#6B7280">${s.agency || '-'}</td>
        <td style="text-align:center">
          <span style="font-size:11px;font-weight:700;background:#FEF3C7;color:#B45309;padding:2px 10px;border-radius:10px">배정 대기</span>
        </td>
      </tr>`;
  }).join('');
}


function toggleSelectAgencyStudent(id) {
  const idx = agencySelectedStudentIds.indexOf(id);
  if (idx > -1) agencySelectedStudentIds.splice(idx, 1);
  else agencySelectedStudentIds.push(id);
}

function toggleSelectAllAgencyStudents() {
  const selectAll = document.getElementById('agency-select-all-cb');
  const cbs = document.querySelectorAll('.agency-student-cb');
  agencySelectedStudentIds = [];
  cbs.forEach(cb => {
    cb.checked = selectAll.checked;
    if (selectAll.checked) {
      agencySelectedStudentIds.push(parseInt(cb.getAttribute('data-id')));
    }
  });
}

function filterAgencyStudentList() {
  initAgencyStudentList();
}

function requestBulkCourseChange() {
  if (agencySelectedStudentIds.length === 0) {
    showToast('⚠ 일괄 코스 변경을 신청할 학생을 1명 이상 선택해 주세요.', 'danger');
    return;
  }

  const newCourse = prompt("변경을 요청할 신규 과정을 입력하세요:\n(일반 코스, IELTS 전문 코스, 주니어 패키지, 가디언 코스 중 택 1)");
  if (!newCourse) return;

  const validCourses = ["일반 코스", "IELTS 전문 코스", "주니어 패키지", "가디언 코스"];
  if (!validCourses.includes(newCourse)) {
    showToast("⚠ 유효하지 않은 과정명입니다.", "danger");
    return;
  }

  const reason = prompt("일괄 변경 요청 사유를 기입하세요:");
  if (!reason) return;

  let successCount = 0;
  agencySelectedStudentIds.forEach(id => {
    const s = MOCK_STUDENTS.find(std => std.id === id);
    if (s) {
      if (!s.changeRequests) s.changeRequests = [];
      s.changeRequests.push({
        id: Date.now() + Math.random(),
        field: 'course',
        from: s.course,
        to: newCourse,
        reason: reason,
        status: 'pending',
        requestDate: new Date().toISOString().substring(0, 10)
      });
      successCount++;
    }
  });

  showToast(`✓ 선택된 ${successCount}명의 학생에 대해 일괄 코스 변경 요청을 송신했습니다.`, 'success');
  agencySelectedStudentIds = [];
  document.getElementById('agency-select-all-cb').checked = false;
  initAgencyStudentList();
  if (typeof initAdminInbox === 'function') initAdminInbox();
}

let aregFiles = { passport: null, ticket: null, photo: null, insurance: null };
function openAgencyStudentRegisterModal() {
  aregFiles = { passport: null, ticket: null, photo: null, insurance: null };
  document.getElementById('areg-badge-passport').textContent = '없음';
  document.getElementById('areg-badge-passport').className = 'tsa-badge tsa-badge-gray';
  document.getElementById('areg-badge-ticket').textContent = '없음';
  document.getElementById('areg-badge-ticket').className = 'tsa-badge tsa-badge-gray';
  document.getElementById('areg-badge-photo').textContent = '없음';
  document.getElementById('areg-badge-photo').className = 'tsa-badge tsa-badge-gray';
  document.getElementById('areg-badge-insurance').textContent = '없음';
  document.getElementById('areg-badge-insurance').className = 'tsa-badge tsa-badge-gray';
  
  document.getElementById('areg-name').value = '';
  document.getElementById('areg-nickname').value = '';
  document.getElementById('areg-age').value = '';
  document.getElementById('areg-phone').value = '';
  document.getElementById('areg-special').value = '';
  const aregDiet = document.getElementById('areg-diet');
  if (aregDiet) aregDiet.value = '일반식';
  document.getElementById('areg-passport-num').value = '';
  document.getElementById('areg-passport-expiry').value = '';
  document.getElementById('areg-visa-expiry').value = '';
  document.getElementById('areg-ssp-expiry').value = '면제';
  document.getElementById('areg-start-date').value = '';
  if (document.getElementById('areg-arrival-date')) document.getElementById('areg-arrival-date').value = '';
  const aregAccom = document.getElementById('areg-dormAccomType'); if (aregAccom) aregAccom.value = '';
  const aregCap = document.getElementById('areg-dormCapacity'); if (aregCap) aregCap.innerHTML = '<option value="">— 유형 먼저 —</option>';
  const aregGrade = document.getElementById('areg-dormGrade'); if (aregGrade) aregGrade.innerHTML = '<option value="">— 인실 먼저 —</option>';
  document.getElementById('areg-dorm-in').value = '';
  document.getElementById('areg-dorm-out').value = '';
  document.getElementById('areg-flight-num').value = '';
  document.getElementById('areg-flight-date').value = '';
  document.getElementById('areg-flight-time').value = '';
  document.getElementById('areg-flight-out-num').value = '';
  document.getElementById('areg-flight-out-date').value = '';
  document.getElementById('areg-flight-out-time').value = '';
  if (document.getElementById('areg-dob')) document.getElementById('areg-dob').value = '';
  if (document.getElementById('areg-age-preview')) document.getElementById('areg-age-preview').textContent = '';
  const familyBox = document.getElementById('areg-family-cert-box');
  if (familyBox) familyBox.style.display = 'none';
  aregFiles.family = null;
  document.getElementById('areg-badge-family').textContent = '없음';
  document.getElementById('areg-badge-family').className = 'tsa-badge tsa-badge-gray';
  
  document.getElementById('register-warning-banner').style.display = 'none';
  document.getElementById('areg-calc-summary').innerHTML = '수강 시작일과 코스를 지정해 주십시오.';

  openModal('agency-student-register-modal');
}

function handleAregFileSelected(type) {
  const input = document.getElementById(`areg-file-${type}`);
  const badge = document.getElementById(`areg-badge-${type}`);
  if (!input || !badge) return;

  if (input.files && input.files.length > 0) {
    const name = input.files[0].name;
    aregFiles[type] = name;
    badge.textContent = `✓ ${name}`;
    badge.className = 'tsa-badge tsa-badge-success';
  } else {
    aregFiles[type] = null;
    badge.textContent = '없음';
    badge.className = 'tsa-badge tsa-badge-gray';
  }
}

function checkAregNationality() {
  const nat = document.getElementById('areg-nationality').value;
  const sspEl = document.getElementById('areg-ssp-expiry');
  if (nat === '중국' || nat === '베트남' || nat === '몽골') {
    sspEl.value = '필리핀 SSP 발급 필요';
  } else {
    sspEl.value = '면제';
  }
}

function calculateAregDates() {
  const startVal = document.getElementById('areg-start-date').value;
  const durVal = parseInt(document.getElementById('areg-duration').value) || 4;
  if (!startVal) return;

  const startDate = new Date(startVal);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + (durVal * 7) - 1);
  
  const checkinDate = new Date(startDate);
  checkinDate.setDate(startDate.getDate() - 1);

  const checkoutDate = new Date(startDate);
  checkoutDate.setDate(startDate.getDate() + (durVal * 7) - 2);

  document.getElementById('areg-arrival-date').value = checkinDate.toISOString().split('T')[0];
  document.getElementById('areg-dorm-in').value = checkinDate.toISOString().split('T')[0];
  document.getElementById('areg-dorm-out').value = checkoutDate.toISOString().split('T')[0];

  const endEl = document.getElementById('areg-end-date');
  if (endEl) {
    const sd = new Date(startVal);
    sd.setDate(sd.getDate() + durVal * 7);
    endEl.value = sd.toISOString().split('T')[0];
  }

  calculateAregExpectedFees();
}

function calculateAregExpectedFees() {
  const startVal = document.getElementById('areg-start-date').value;
  if (!startVal) return;

  const course = document.getElementById('areg-course').value;
  const dormAccomType = (document.getElementById('areg-dormAccomType') || {}).value || '';
  const dormCapacity  = (document.getElementById('areg-dormCapacity')  || {}).value || '';
  const dormGrade     = (document.getElementById('areg-dormGrade')     || {}).value || '';
  const dorm = dormAccomType && dormCapacity && dormGrade ? `${dormCapacity} (${dormGrade})` : '미배정';
  const duration = parseInt(document.getElementById('areg-duration').value) || 4;

  const tempStd = { course, dorm, duration, agency: '한국 영어마을' };
  const prices = calculatePrices(tempStd);

  const container = document.getElementById('areg-calc-summary');
  container.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">💰 실시간 연수비 예상 정산서</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
      <div>학생 청구 Gross 학비: <strong>$${prices.tuition.toLocaleString()}</strong></div>
      <div>학생 청구 Gross 기숙사비: <strong>$${prices.dorm.toLocaleString()}</strong></div>
      <div>입학금: <strong>$${prices.registration}</strong></div>
      <div style="border-top:1px solid #C7D2FE;grid-column:span 2;padding-top:4px"><strong>학생용 Gross 총 인보이스액: $${prices.gross.toLocaleString()}</strong></div>
      <div style="color:#4F46E5">에이전시 B2B 커미션 (20%): <strong>-$${prices.commission.toLocaleString()}</strong></div>
      <div style="color:#059669">송금수수료: <strong>+$${prices.remitFee}</strong></div>
      <div style="border-top:1.5px dashed #818CF8;grid-column:span 2;padding-top:4px;font-size:12.5px;color:#1E1B4B"><strong>최종 어학원 Net 송금액: $${prices.net.toLocaleString()}</strong></div>
    </div>
  `;
}

function submitAgencyStudentRegistration() {
  const name = document.getElementById('areg-name').value.trim();
  const nick = document.getElementById('areg-nickname').value.trim();
  const gender = document.getElementById('areg-gender').value;
  const age = parseInt(document.getElementById('areg-age').value);
  const nationality = document.getElementById('areg-nationality').value;
  const phone = document.getElementById('areg-phone').value.trim();
  const special = document.getElementById('areg-special').value.trim();
  const diet = document.getElementById('areg-diet')?.value || '일반식';
  const passportNum = document.getElementById('areg-passport-num').value.trim();
  const passportExpiry = document.getElementById('areg-passport-expiry').value;
  const visaExpiry = document.getElementById('areg-visa-expiry').value;
  const sspExpiry = document.getElementById('areg-ssp-expiry').value;
  const course = document.getElementById('areg-course').value;
  const duration = parseInt(document.getElementById('areg-duration').value);
  const startDateVal = document.getElementById('areg-start-date').value;
  const endDateVal = (document.getElementById('areg-end-date') || {}).value || '';
  const level = (document.getElementById('areg-level') || {}).value || '';
  const dormAccomType = (document.getElementById('areg-dormAccomType') || {}).value || '';
  const dormCapacity  = (document.getElementById('areg-dormCapacity')  || {}).value || '';
  const dormGrade     = (document.getElementById('areg-dormGrade')     || {}).value || '';
  const dorm = '미배정';
  const arrivalDate = document.getElementById('areg-arrival-date').value;
  const dormIn = document.getElementById('areg-dorm-in').value;
  const dormOut = document.getElementById('areg-dorm-out').value;
  const flightNum = document.getElementById('areg-flight-num').value.trim();
  const flightDate = document.getElementById('areg-flight-date').value;
  const flightTime = document.getElementById('areg-flight-time').value;
  const flight = [flightNum, flightDate, flightTime].filter(Boolean).join(' | ');

  const flightOutNum = document.getElementById('areg-flight-out-num').value.trim();
  const flightOutDate = document.getElementById('areg-flight-out-date').value;
  const flightOutTime = document.getElementById('areg-flight-out-time').value;
  const flightOut = [flightOutNum, flightOutDate, flightOutTime].filter(Boolean).join(' | ');

  const warningBanner = document.getElementById('register-warning-banner');
  warningBanner.style.display = 'none';
  warningBanner.innerHTML = '';

  if (!name || !nick || !phone || !passportNum || !passportExpiry || !startDateVal || !dormIn || !dormOut) {
    showToast('⚠ 필수 필드(*)를 모두 입력해 주세요.', 'danger');
    return;
  }

  if (isNaN(age)) {
    showToast('생년월일을 입력하여 주십시오.', 'danger');
    return;
  }

  if (age < 15 && !aregFiles.family) {
    warningBanner.style.display = 'block';
    warningBanner.innerHTML = `<div><strong>등록 반려:</strong> 만 15세 미만 주니어 학생은 필수 서류인 [가족관계증명서]가 누락되었습니다.</div>`;
    showToast('주니어 필수 서류 누락', 'danger');
    return;
  }

  const startDay = new Date(startDateVal).getDay();
  if (startDay !== 1) {
    warningBanner.style.display = 'block';
    warningBanner.innerHTML = `<div><strong>등록 반려:</strong> 수강 시작일은 반드시 월요일이어야 합니다. 선택된 일자는 월요일이 아닙니다.</div>`;
    showToast('수강 시작일 월요일 유효성 검사 실패', 'danger');
    return;
  }

  const dupPassport = MOCK_STUDENTS.find(s => s.passportNum && s.passportNum.toLowerCase() === passportNum.toLowerCase());
  if (dupPassport) {
    warningBanner.style.display = 'block';
    warningBanner.innerHTML = `<div><strong>등록 반려:</strong> 입력한 여권번호(${passportNum})는 이미 등록되어 있는 번호입니다. 중복 등록이 차단됩니다.</div>`;
    showToast('여권번호 중복 검사 실패', 'danger');
    return;
  }

  if (!aregFiles.passport || !aregFiles.ticket || !aregFiles.photo || !aregFiles.insurance) {
    warningBanner.style.display = 'block';
    warningBanner.innerHTML = `<div><strong>등록 반려:</strong> 4대 서류(여권사본, E-티켓, 증명사진, 여행자보험) 파일 업로드는 모두 필수입니다. 누락된 서류가 있습니다.</div>`;
    showToast('4대 필수 서류 누락', 'danger');
    return;
  }

  const email = document.getElementById('areg-email')?.value.trim() || '';
  const emergencyContact = document.getElementById('areg-emergency')?.value.trim() || '';
  const enrollDate = document.getElementById('areg-enroll-date')?.value || '';

  if (!enrollDate) {
    showToast('수강 등록일을 입력해 주세요.', 'danger');
    return;
  }

  const warnings = [];
  const endStudyDate = new Date(startDateVal);
  endStudyDate.setDate(endStudyDate.getDate() + (duration * 7));
  if (new Date(passportExpiry) < endStudyDate) {
    warnings.push(`⚠ 여권 만료일(${passportExpiry})이 수강 종료 예정일(${endStudyDate.toISOString().split('T')[0]}) 이전입니다. 출국 전 여권을 재발급 받도록 권장하십시오.`);
  }

  const diffIn = Math.ceil(Math.abs(new Date(dormIn) - new Date(startDateVal)) / (1000*60*60*24));
  if (diffIn > 3) {
    warnings.push(`⚠ 기숙사 입실일(${dormIn})이 수강 시작일(${startDateVal})보다 3일 이상 차이납니다.`);
  }
  const diffOut = Math.ceil(Math.abs(new Date(dormOut) - endStudyDate) / (1000*60*60*24));
  if (diffOut > 3) {
    warnings.push(`⚠ 기숙사 퇴실일(${dormOut})이 수강 종료일(${endStudyDate.toISOString().split('T')[0]})보다 3일 이상 차이납니다.`);
  }

  if (warnings.length > 0) {
    const confirmProceed = confirm("다음 경고 사항들이 존재합니다. 진행하시겠습니까?\n\n" + warnings.join("\n"));
    if (!confirmProceed) {
      warningBanner.style.display = 'block';
      warningBanner.innerHTML = warnings.map(w => `<div>${w}</div>`).join('');
      return;
    }
  }

  const newStudentId = Math.max(...MOCK_STUDENTS.map(s => s.id), 0) + 1;
  const newStdObj = {
    id: newStudentId,
    name: name,
    nick: nick,
    email: email,
    emergencyContact: emergencyContact,
    gender: gender,
    age: age,
    nationality: nationality,
    flag: nationality === '한국' ? '🇰🇷' : nationality === '일본' ? '🇯🇵' : nationality === '중국' ? '🇨🇳' : nationality === '베트남' ? '🇻🇳' : '🇲🇳',
    course: course,
    duration: duration,
    level: level,
    dorm: '미배정',
    dormAccomType: dormAccomType || null,
    dormType: dormCapacity || null,
    dormGrade: dormGrade || null,
    visaExpiry: visaExpiry || '면제',
    sspExpiry: sspExpiry || '면제',
    arrivalDate: arrivalDate,
    dormIn: dormIn,
    dormOut: dormOut,
    startDate: startDateVal,
    endDate: endDateVal,
    departureDate: dormOut,
    attendance: 100,
    status: 'waiting',
    enrollDate: enrollDate,
    agency: '한국 영어마을',
    warning: 0,
    quiz: [90],
    passportNum: passportNum,
    passportExpiry: passportExpiry,
    passportStatus: '미제출',
    flightInfo: flight || '',
    flightOutInfo: flightOut || '',
    dietType: diet,
    healthNotes: special || '특이사항 없음',
    grades: { speaking: [80], listening: [80], reading: [80], writing: [80] },
    fees: [
      { id: newStudentId * 100 + 1, item: '입학금 (Registration Fee)', amount: 100, paid: false },
      { id: newStudentId * 100 + 2, item: 'SSP 로컬 발급 대행피', amount: 120, paid: false }
    ],
    remittanceStatus: 'unpaid',
    remittanceReceipt: null,
    remittanceDate: null,
    changeRequests: [],
    requiredFiles: {
      passport: aregFiles.passport,
      ticket: aregFiles.ticket,
      photo: aregFiles.photo,
      insurance: aregFiles.insurance
    }
  };

  MOCK_STUDENTS.push(newStdObj);

  MOCK_AGENCY_STUDENTS.push({
    name: `${name} (${nick})`,
    course: course.split(' ')[0],
    dorm: dorm.split(' ')[0],
    duration: `${duration}주`,
    status: 'current',
    total: `$${calculatePrices(newStdObj).gross.toLocaleString()}`,
    branch: APP.user === 'agency_branch' ? '강남지사' : '본사',
    agencyStatus: 'waiting'
  });

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[신규 등록 접수] 신입생 ${name} (${nick}) 학생의 대기 등록이 접수되었습니다.`,
    type: 'info',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ ${name} 학생이 성공적으로 등록되었습니다. (승인 대기)`, 'success');
  closeModal('agency-student-register-modal');
  enhanceMockStudents();
  updateAdminKPIs();
  updateAgencyKPIs();
  initAgencyStudentList();
  if (typeof initAdminInbox === 'function') initAdminInbox();
}

let remitSelectedFile = null;
function updateAgencyRemittanceDetails() {
  const sId = document.getElementById('remit-student-select').value;
  const calcBox = document.getElementById('remit-calc-box');
  const fileGroup = document.getElementById('remit-file-group');

  if (!sId) {
    calcBox.style.display = 'none';
    fileGroup.style.display = 'none';
    return;
  }

  const s = MOCK_STUDENTS.find(std => std.id == sId);
  if (!s) return;

  const prices = calculatePrices(s);

  calcBox.style.display = 'block';
  fileGroup.style.display = 'block';

  calcBox.innerHTML = `
    <div style="font-weight:700;margin-bottom:6px">💰 B2B Net 학비 정산 금액서</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
      <div>수강 과정: <strong>${s.course}</strong></div>
      <div>기숙사: <strong>${s.dorm}</strong></div>
      <div>수강 주차: <strong>${s.duration}주</strong></div>
      <div>Gross 합계: <strong>$${prices.gross.toLocaleString()}</strong></div>
      <div style="color:#4F46E5;border-top:1px solid #E9EDF4;grid-column:span 2;padding-top:4px">에이전시 마진 커미션 (20%): <strong>-$${prices.commission.toLocaleString()}</strong></div>
      <div style="color:#059669">해외 이체 수수료 (본인부담): <strong>+$${prices.remitFee}</strong></div>
      <div style="border-top:1.5px dashed #818CF8;grid-column:span 2;padding-top:4px;font-size:12.5px;color:#1E1B4B"><strong>어학원 최종 순 송금액 (Net): $${prices.net.toLocaleString()}</strong></div>
    </div>
  `;

  remitSelectedFile = null;
  document.getElementById('badge-remit-file').textContent = '파일 없음';
  document.getElementById('badge-remit-file').className = 'tsa-badge tsa-badge-gray';
}

function handleRemitFileSelected() {
  const input = document.getElementById('remit-file-input');
  const badge = document.getElementById('badge-remit-file');
  if (input.files && input.files.length > 0) {
    remitSelectedFile = input.files[0].name;
    badge.textContent = `✓ ${remitSelectedFile}`;
    badge.className = 'tsa-badge tsa-badge-success';
  } else {
    remitSelectedFile = null;
    badge.textContent = '파일 없음';
    badge.className = 'tsa-badge tsa-badge-gray';
  }
}

function submitAgencyRemittance() {
  const sId = document.getElementById('remit-student-select').value;
  if (!sId) return;

  const s = MOCK_STUDENTS.find(std => std.id == sId);
  if (!s) return;

  if (!remitSelectedFile) {
    showToast('⚠ 해외 송금 확인을 위한 입금 확인서 파일을 첨부해 주세요.', 'danger');
    return;
  }

  s.remittanceStatus = 'paid';
  s.remittanceReceipt = remitSelectedFile;
  s.remittanceDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

  showToast(`✓ ${s.name} 학생의 순 송금액(Net) 입금 확인서가 제출되어 완납 처리되었습니다.`, 'success');

  document.getElementById('remit-student-select').value = '';
  updateAgencyRemittanceDetails();
  initAgencyStudentList();
  if (typeof initAdminInbox === 'function') initAdminInbox();
}

let currentAdetailStudentId = null;
let currentAdetailTab = 'basic';
let adetailUploadedFiles = { passport: null, ticket: null, photo: null, insurance: null };

function openAgencyStudentDetailModal(id) {
  currentAdetailStudentId = id;
  currentAdetailTab = 'basic';
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  adetailUploadedFiles = { 
    passport: s.requiredFiles ? s.requiredFiles.passport : null, 
    ticket: s.requiredFiles ? s.requiredFiles.ticket : null, 
    photo: s.requiredFiles ? s.requiredFiles.photo : null, 
    insurance: s.requiredFiles ? s.requiredFiles.insurance : null 
  };

  document.getElementById('adetail-title-name').textContent = `${s.name} (Nick: ${s.nick})`;
  
  let stateStr = '입학 대기 (Waiting)';
  if (s.status === 'current') stateStr = '재학 (Current)';
  else if (s.status === 'completed') stateStr = '졸업 (Completed)';
  else if (s.status === 'resigned') stateStr = '퇴원 (Resigned)';
  else if (s.status === 'extended') stateStr = '연장 (Extended)';

  document.getElementById('adetail-title-subtitle').textContent = `등록 상태: ${stateStr} · ${s.agency || '한국 영어마을'}`;
  
  const avatar = document.getElementById('adetail-avatar');
  avatar.src = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';

  switchAdetailTab('basic');

  // 재학생이면 에이전시 포탈에서 저장 버튼 비활성화
  const saveBtn = document.getElementById('adetail-save-btn');
  const isAgencyUser = APP.user === 'agency_head' || APP.user === 'agency_branch';
  if (saveBtn) {
    if (isAgencyUser && s.status !== 'waiting') {
      saveBtn.disabled = true;
      saveBtn.style.cssText = 'background:#E5E7EB;color:#9CA3AF;cursor:not-allowed;border:none;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:600';
      saveBtn.title = '재학 중인 학생 정보는 어드민만 수정할 수 있습니다.';
    } else {
      saveBtn.disabled = false;
      saveBtn.style.cssText = '';
      saveBtn.title = '';
    }
  }

  openModal('agency-student-detail-modal');
}

function switchAdetailTab(tab, containerId = 'adetail-tab-content', studentId = null) {
  currentAdetailTab = tab;
  
  const isAdminModal = (containerId === 'student-modal-tab-content');
  const tabsList = isAdminModal 
    ? ['basic', 'flight', 'docs', 'class', 'settle', 'visa', 'dorm', 'fees']
    : ['basic', 'flight', 'docs', 'class', 'settle', 'visa', 'dorm', 'changelog'];
  
  tabsList.forEach(t => {
    if (!isAdminModal) {
      const el = document.getElementById(`adetail-tab-${t}`);
      if (el) el.classList.toggle('active', t === tab);
    }
  });

  const targetId = studentId || currentAdetailStudentId;
  const s = MOCK_STUDENTS.find(std => std.id === targetId);
  const container = document.getElementById(containerId);
  if (!s || !container) return;

  const isAgency = (APP.user === 'agency_head' || APP.user === 'agency_branch') && !isAdminModal;
  // 재학생(current/extended/completed/resigned)이면 에이전시 포탈에서 수정 불가
  const isLocked = isAgency && (s.status !== 'waiting');
  const lockAttr = isLocked ? 'disabled style="background:#F3F4F6;color:#9CA3AF;cursor:not-allowed"' : '';
  const changeBtn = () => ''; // 변경 요청 승인 플로우 제거

  let html = '';

  if (tab === 'basic') {
    // 생년월일 → 나이 자동 계산
    const dobVal = s.dob || '';
    const ageDisplay = s.age ? `${s.age}세` : (dobVal ? (() => {
      const diff = new Date('2026-06-15') - new Date(dobVal);
      return Math.floor(diff / (365.25 * 86400000)) + '세';
    })() : '-');

    html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px">
        <div class="tsa-form-group">
          <label class="tsa-label">영문 성명 (여권명) ${changeBtn('name', '영문 성명')}</label>
          <input id="ad-name" type="text" class="tsa-input" value="${s.name}" ${lockAttr}/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">영문 닉네임 (호칭) ${changeBtn('nick', '영문 닉네임')}</label>
          <input id="ad-nickname" type="text" class="tsa-input" value="${s.nick}" ${lockAttr}/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">성별</label>
          <select id="ad-gender" class="tsa-input" ${lockAttr}>
            <option value="남" ${s.gender === '남' ? 'selected' : ''}>남성</option>
            <option value="여" ${s.gender === '여' ? 'selected' : ''}>여성</option>
          </select>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">생년월일 <span style="color:#6B7280;font-weight:400;font-size:11px">(만 ${ageDisplay})</span></label>
          <input id="ad-dob" type="date" class="tsa-input" value="${dobVal}" ${lockAttr}
            onchange="(function(){const d=new Date('2026-06-15')-new Date(this.value);document.getElementById('ad-age-display').textContent='만 '+Math.floor(d/(365.25*86400000))+'세'}).call(this)"/>
          <div id="ad-age-display" style="font-size:10.5px;color:#5E5CE6;margin-top:3px;font-weight:600">${dobVal ? '만 ' + ageDisplay : ''}</div>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">국적</label>
          <select id="ad-nationality" class="tsa-input" ${lockAttr}>
            <option value="한국" ${s.nationality === '한국' ? 'selected' : ''}>한국 🇰🇷</option>
            <option value="일본" ${s.nationality === '일본' ? 'selected' : ''}>일본 🇯🇵</option>
            <option value="중국" ${s.nationality === '중국' ? 'selected' : ''}>중국 🇨🇳</option>
            <option value="베트남" ${s.nationality === '베트남' ? 'selected' : ''}>베트남 🇻🇳</option>
            <option value="몽골" ${s.nationality === '몽골' ? 'selected' : ''}>몽골 🇲🇳</option>
          </select>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">연락처 (직접 수정가능)</label>
          <input id="ad-phone" type="text" class="tsa-input" value="${s.phone || '010-1234-5678'}"/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">이메일 주소</label>
          <input id="ad-email" type="email" class="tsa-input" value="${s.email || ''}" placeholder="student@example.com"/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">비상 연락처</label>
          <input id="ad-emergency" type="text" class="tsa-input" value="${s.emergencyContact || ''}" placeholder="010-5678-1234 (부모)"/>
        </div>
        ${(() => {
          const isAgency = APP.user === 'agency_head' || APP.user === 'agency_branch';
          const dietLabel = { '일반식': '일반식 (Regular)', '채식': '채식 (Vegetarian)', '할랄': '할랄 (Halal)', '글루텐 프리': '글루텐 프리 (Gluten-Free)', '기타': '기타 특별 식단' };
          const dietBadgeColor = s.dietType && s.dietType !== '일반식' ? '#D97706' : '#6B7280';
          const dietBg = s.dietType && s.dietType !== '일반식' ? '#FEF3C7' : '#F3F4F6';
          const hasHealthAlert = s.healthNotes && s.healthNotes !== '특이사항 없음.' && s.healthNotes !== '특이사항 없음';

          if (isAgency) {
            return `
              <div style="grid-column:span 2;background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:10px;padding:14px 16px">
                <div style="font-size:11px;font-weight:700;color:#92400E;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                  <i data-lucide="heart-pulse" style="width:13px;height:13px;color:#D97706"></i> 건강 관리 및 식단 특이사항 설정
                </div>
                <div style="display:grid;grid-template-columns:1fr 2fr;gap:10px;align-items:end">
                  <div class="tsa-form-group" style="margin:0">
                    <label class="tsa-label" style="color:#92400E;font-size:11px">식단 구분</label>
                    <select id="ad-diet" class="tsa-input" style="border-color:#FDE68A;font-size:12px" ${lockAttr}>
                      <option value="일반식" ${s.dietType === '일반식' ? 'selected' : ''}>일반식 (General)</option>
                      <option value="채식" ${s.dietType === '채식' ? 'selected' : ''}>채식 (Vegetarian)</option>
                      <option value="할랄" ${s.dietType === '할랄' ? 'selected' : ''}>할랄 (Halal)</option>
                      <option value="글루텐 프리" ${s.dietType === '글루텐 프리' ? 'selected' : ''}>글루텐 프리 (Gluten-Free)</option>
                      <option value="기타" ${s.dietType === '기타' ? 'selected' : ''}>기타 특별 식단</option>
                    </select>
                  </div>
                  <div style="display:flex;gap:8px;align-items:flex-end">
                    <div class="tsa-form-group" style="margin:0;flex:1">
                      <label class="tsa-label" style="color:#92400E;font-size:11px">건강 정보 및 복약/알레르기 메모</label>
                      <input id="ad-special" type="text" class="tsa-input" style="border-color:#FDE68A;font-size:12px"
                        value="${s.healthNotes || ''}" placeholder="복약 시간대, 알레르기 유무 및 세부 정보를 입력하세요" ${lockAttr}/>
                    </div>
                    ${!isLocked ? `<button onclick="saveAgencyHealthInfo(${s.id})" style="white-space:nowrap;padding:7px 14px;background:#D97706;border:none;border-radius:7px;font-size:12px;font-weight:700;color:#fff;cursor:pointer">특이사항 저장</button>` : ''}
                  </div>
                </div>
              </div>
            `;
          } else {
            return `
              <div class="tsa-form-group" style="grid-column:span 2">
                <label class="tsa-label">건강 및 특이사항 메모</label>
                <input id="ad-special" type="text" class="tsa-input" value="${s.healthNotes || '특이사항 없음'}"/>
              </div>
              <div class="tsa-form-group">
                <label class="tsa-label">복약 정보 및 시간대</label>
                <input id="ad-medicine" type="text" class="tsa-input" value="${s.medicine || '복약 정보 없음'}" placeholder="예: 아침 식후 감기약 1정"/>
              </div>
              <div class="tsa-form-group">
                <label class="tsa-label">알레르기</label>
                <input id="ad-allergy" type="text" class="tsa-input" value="${s.allergy || '알레르기 없음'}" placeholder="예: 땅콩 알레르기"/>
              </div>
              <div class="tsa-form-group" style="grid-column:span 2">
                <label class="tsa-label">식단 구분 (식이 지원)</label>
                <select id="ad-diet" class="tsa-input">
                  <option value="일반식" ${s.dietType === '일반식' ? 'selected' : ''}>일반식 (Regular)</option>
                  <option value="채식" ${s.dietType === '채식' ? 'selected' : ''}>채식 (Vegetarian)</option>
                  <option value="할랄" ${s.dietType === '할랄' ? 'selected' : ''}>할랄 (Halal)</option>
                  <option value="기타" ${s.dietType === '기타' ? 'selected' : ''}>기타 특별 식단 (Special diet)</option>
                </select>
              </div>
            `;
          }
        })()}
      </div>

      ${(() => {
        const isAgency = APP.user === 'agency_head' || APP.user === 'agency_branch';
        if (!isAgency) return '';
        return `
        <!-- ── 항공 & 입출국 ── -->
        <div style="margin-top:16px;padding:0 10px">
          <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:12px">✈️ 항공 & 입출국 일정</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div style="background:#F8F9FC;border:1px solid #E9EDF4;border-radius:10px;padding:12px">
              <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px">🛂 여권 정보</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">여권 번호</label><input id="ad-passport-num" type="text" class="tsa-input" value="${s.passportNum||''}" placeholder="M12345678" ${lockAttr}/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">여권 만료일</label><input id="ad-passport-expiry" type="date" class="tsa-input" value="${s.passportExpiry||''}" ${lockAttr}/></div>
              </div>
            </div>
            <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px">
              <div style="font-size:11px;font-weight:700;color:#15803D;margin-bottom:8px">입국 항공편</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">편명</label><input id="ad-flight-num" type="text" class="tsa-input" value="${s.flightNum||''}" placeholder="KE631" ${lockAttr}/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">입국일</label><input id="ad-arrival-date" type="date" class="tsa-input" value="${s.arrivalDate||''}" ${lockAttr}/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">도착 시간</label><input id="ad-flight-time" type="time" class="tsa-input" value="${s.flightTime||''}"/></div>
              </div>
            </div>
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px">
              <div style="font-size:11px;font-weight:700;color:#1D4ED8;margin-bottom:8px">출국 항공편</div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">편명</label><input id="ad-flight-out-num" type="text" class="tsa-input" value="${s.flightOutNum||''}" placeholder="KE632" ${lockAttr}/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">출국일</label><input id="ad-departure-date" type="date" class="tsa-input" value="${s.departureDate||''}" ${lockAttr}/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label" style="font-size:10.5px">출발 시간</label><input id="ad-flight-out-time" type="time" class="tsa-input" value="${s.flightOutTime||''}"/></div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 서류 관리 ── -->
        <div style="margin-top:16px;padding:0 10px">
          <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:12px">📄 서류 관리</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
            ${renderFileCards(s, 'agency')}
          </div>
        </div>

        <!-- ── 비자 & SSP ── -->
        <div style="margin-top:16px;padding:0 10px">
          <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:12px">🪪 비자 & SSP</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="tsa-form-group"><label class="tsa-label">비자 만료 예정일</label><input id="ad-visa-expiry" type="date" class="tsa-input" value="${s.visaExpiry!=='면제'?s.visaExpiry:''}"/></div>
            <div class="tsa-form-group"><label class="tsa-label">SSP 카드 만료 예정일 (또는 면제)</label><input id="ad-ssp-expiry" type="text" class="tsa-input" value="${s.sspExpiry||'면제'}"/></div>
          </div>
        </div>`;
      })()}
    `;
  } else if (tab === 'flight') {
    html = `
      <div style="display:flex;flex-direction:column;gap:14px;padding:10px">

        <!-- 여권 정보 -->
        <div style="background:#F8F9FC;border:1px solid #E9EDF4;border-radius:12px;padding:14px">
          <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:10px">🛂 여권 정보</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label">여권 번호 ${changeBtn('passportNum', '여권 번호')}</label>
              <input id="ad-passport-num" type="text" class="tsa-input" value="${s.passportNum || ''}" placeholder="M12345678" ${lockAttr}/>
            </div>
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label">여권 만료일 ${changeBtn('passportExpiry', '여권 만료일')}</label>
              <input id="ad-passport-expiry" type="date" class="tsa-input" value="${s.passportExpiry || ''}" ${lockAttr}/>
            </div>
          </div>
        </div>

        <!-- 입국 항공편 -->
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:14px">
          <div style="font-size:11.5px;font-weight:700;color:#15803D;margin-bottom:10px">✈ 입국 항공편 <span style="font-size:10px;font-weight:400;color:#6B7280">픽업 스태프 공유 — 변경 시 24시간 전 필수 갱신</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">편명 ${changeBtn('flightNum', '입국 편명')}</label>
              <input id="ad-flight-num" type="text" class="tsa-input" value="${s.flightNum || ''}" placeholder="KE631" ${lockAttr}/>
            </div>
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">입국 날짜 ${changeBtn('arrivalDate', '입국일')}</label>
              <input id="ad-arrival-date" type="date" class="tsa-input" value="${s.arrivalDate || ''}" ${lockAttr}/>
            </div>
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">도착 시간 (픽업)</label>
              <input id="ad-flight-time" type="time" class="tsa-input" value="${s.flightTime || ''}"/>
            </div>
          </div>
        </div>

        <!-- 출국 항공편 -->
        <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:14px">
          <div style="font-size:11.5px;font-weight:700;color:#1D4ED8;margin-bottom:10px">✈ 출국 항공편 <span style="font-size:10px;font-weight:400;color:#6B7280">공항 배웅 서비스 해당 시 필수 기재</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">편명 ${changeBtn('flightOutNum', '출국 편명')}</label>
              <input id="ad-flight-out-num" type="text" class="tsa-input" value="${s.flightOutNum || ''}" placeholder="KE632" ${lockAttr}/>
            </div>
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">출국 날짜 ${changeBtn('departureDate', '출국일')}</label>
              <input id="ad-departure-date" type="date" class="tsa-input" value="${s.departureDate || ''}" ${lockAttr}/>
            </div>
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">출발 시간</label>
              <input id="ad-flight-out-time" type="time" class="tsa-input" value="${s.flightOutTime || ''}"/>
            </div>
          </div>
        </div>

        <!-- 기숙사 입·퇴실 -->
        <div style="background:#FAF5FF;border:1px solid #DDD6FE;border-radius:12px;padding:14px">
          <div style="font-size:11.5px;font-weight:700;color:#6D28D9;margin-bottom:10px">🏠 기숙사 입·퇴실 일정</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">기숙사 입실일 ${changeBtn('dormIn', '기숙사 입실일')}</label>
              <input id="ad-dorm-in" type="date" class="tsa-input" value="${s.dormIn || s.startDate || ''}" ${lockAttr}/>
            </div>
            <div class="tsa-form-group" style="margin:0">
              <label class="tsa-label" style="font-size:10.5px">기숙사 퇴실일 ${changeBtn('dormOut', '기숙사 퇴실일')}</label>
              <input id="ad-dorm-out" type="date" class="tsa-input" value="${s.dormOut || s.departureDate || ''}" ${lockAttr}/>
            </div>
          </div>
        </div>

      </div>
    `;
  } else if (tab === 'docs') {
    const passportFile = s.requiredFiles ? s.requiredFiles.passport : null;
    const ticketFile = s.requiredFiles ? s.requiredFiles.ticket : null;
    const photoFile = s.requiredFiles ? s.requiredFiles.photo : null;
    const insuranceFile = s.requiredFiles ? s.requiredFiles.insurance : null;

    html = `
      <div style="padding:10px">
        <div style="font-weight:700;font-size:12.5px;margin-bottom:12px;color:#374151">📄 제출 서류 원본 및 재업로드</div>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:12px">
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:12px;background:#F8F9FC;text-align:center">
            <div style="font-size:11.5px;font-weight:600">여권 사본</div>
            <span class="tsa-badge ${passportFile ? 'tsa-badge-success' : 'tsa-badge-gray'}" id="ad-badge-passport" style="font-size:10px;margin:8px 0">${passportFile ? '제출완료' : '누락'}</span>
            <div><button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="document.getElementById('ad-file-passport').click()">파일선택</button></div>
            <input id="ad-file-passport" type="file" style="display:none" onchange="handleAdetailFileSelected('passport')"/>
          </div>
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:12px;background:#F8F9FC;text-align:center">
            <div style="font-size:11.5px;font-weight:600">E-티켓 사본</div>
            <span class="tsa-badge ${ticketFile ? 'tsa-badge-success' : 'tsa-badge-gray'}" id="ad-badge-ticket" style="font-size:10px;margin:8px 0">${ticketFile ? '제출완료' : '누락'}</span>
            <div><button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="document.getElementById('ad-file-ticket').click()">파일선택</button></div>
            <input id="ad-file-ticket" type="file" style="display:none" onchange="handleAdetailFileSelected('ticket')"/>
          </div>
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:12px;background:#F8F9FC;text-align:center">
            <div style="font-size:11.5px;font-weight:600">증명사진</div>
            <span class="tsa-badge ${photoFile ? 'tsa-badge-success' : 'tsa-badge-gray'}" id="ad-badge-photo" style="font-size:10px;margin:8px 0">${photoFile ? '제출완료' : '누락'}</span>
            <div><button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="document.getElementById('ad-file-photo').click()">파일선택</button></div>
            <input id="ad-file-photo" type="file" style="display:none" onchange="handleAdetailFileSelected('photo')"/>
          </div>
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:12px;background:#F8F9FC;text-align:center">
            <div style="font-size:11.5px;font-weight:600">여행자 보험증서</div>
            <span class="tsa-badge ${insuranceFile ? 'tsa-badge-success' : 'tsa-badge-gray'}" id="ad-badge-insurance" style="font-size:10px;margin:8px 0">${insuranceFile ? '제출완료' : '누락'}</span>
            <div><button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="document.getElementById('ad-file-insurance').click()">파일선택</button></div>
            <input id="ad-file-insurance" type="file" style="display:none" onchange="handleAdetailFileSelected('insurance')"/>
          </div>
        </div>
      </div>
    `;
  } else if (tab === 'class') {
    let teacherName = '미배정';
    const tMatch = MOCK_TIMETABLE.find(t => t.slots.some(slot => slot.student === s.nick));
    if (tMatch) teacherName = tMatch.teacher;

    html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px">
        <div class="tsa-form-group">
          <label class="tsa-label">수강 코스 ${changeBtn('course', '수강 코스')}</label>
          <select id="ad-course" class="tsa-input" ${lockAttr}>
            <option value="일반 코스" ${s.course.includes('일반 코스') ? 'selected' : ''}>일반 코스</option>
            <option value="IELTS 전문 코스" ${s.course.includes('IELTS 전문 코스') ? 'selected' : ''}>IELTS 전문 코스</option>
            <option value="주니어 패키지" ${s.course.includes('주니어 패키지') ? 'selected' : ''}>주니어 패키지</option>
            <option value="가디언 코스" ${s.course.includes('가디언 코스') ? 'selected' : ''}>가디언 코스</option>
          </select>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">수강 기간 (주차) ${changeBtn('duration', '수강 기간')}</label>
          <input id="ad-duration" type="number" class="tsa-input" value="${s.duration}" ${lockAttr}/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">수강 시작일 ${changeBtn('startDate', '수강 시작일')}</label>
          <input id="ad-start-date" type="date" class="tsa-input" value="${s.startDate || '2026-06-01'}" ${lockAttr}/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">수강 종료일</label>
          <input class="tsa-input" type="date" value="${s.endDate || ''}" style="background:#F9FAFB" readonly/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">레벨 <span style="font-size:10px;color:#9CA3AF;font-weight:400">(현지 테스트 후 어학원 기입)</span></label>
          <input class="tsa-input" type="text" value="${s.level || '미정'}" style="background:#F9FAFB" readonly/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label" style="display:flex;align-items:center;gap:6px">
            수강 등록일
            ${s.adminApprovedAt
              ? `<span style="font-size:10px;background:#D1FAE5;color:#059669;padding:1px 7px;border-radius:10px;font-weight:700">✅ 승인완료 (${s.adminApprovedAt})</span>`
              : `<span style="font-size:10px;background:#FEF3C7;color:#D97706;padding:1px 7px;border-radius:10px;font-weight:700">⏳ 승인 대기</span>`}
          </label>
          <input id="ad-enroll-date" type="date" class="tsa-input" value="${s.enrollDate || ''}" ${lockAttr}/>
          <div style="font-size:10.5px;color:#6B7280;margin-top:3px">등록일 + 어학원 어드민 승인 시 → <strong style="color:#059669">재학생</strong> 전환</div>
        </div>
        ${!isAgency ? `
        <div style="border-top:1px solid #E5E7EB;grid-column:span 2;padding-top:12px;display:flex;justify-content:space-between;align-items:center">
          <div>담당 메인 강사: <strong>${teacherName} 강사</strong></div>
          <div>누적 출석률: <strong style="color:#5E5CE6">${s.attendance || 100}%</strong> ${s.attendance && s.attendance < 80 ? '<span class="tsa-badge tsa-badge-danger" style="margin-left:8px">⚠️ 차주 1:1 수업 1교시 강제 감축 대상</span>' : ''}</div>
        </div>
        <div style="border-top:1px solid #E5E7EB;grid-column:span 2;padding-top:12px;">
          <h4 style="font-size:12px;font-weight:700;color:#374151;margin-bottom:8px">📝 학습 평가 및 모의고사 성적 (Grades)</h4>
          <div style="display:grid;grid-template-columns:repeat(5, 1fr);gap:10px;margin-bottom:8px">
            <div class="tsa-form-group">
              <label class="tsa-label" style="font-size:10.5px">Speaking</label>
              <input type="number" id="ad-grade-speaking" class="tsa-input" style="padding:4px;font-size:11.5px" value="${s.grades && s.grades.speaking ? s.grades.speaking[s.grades.speaking.length-1] : 80}"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label" style="font-size:10.5px">Listening</label>
              <input type="number" id="ad-grade-listening" class="tsa-input" style="padding:4px;font-size:11.5px" value="${s.grades && s.grades.listening ? s.grades.listening[s.grades.listening.length-1] : 80}"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label" style="font-size:10.5px">Reading</label>
              <input type="number" id="ad-grade-reading" class="tsa-input" style="padding:4px;font-size:11.5px" value="${s.grades && s.grades.reading ? s.grades.reading[s.grades.reading.length-1] : 80}"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label" style="font-size:10.5px">Writing</label>
              <input type="number" id="ad-grade-writing" class="tsa-input" style="padding:4px;font-size:11.5px" value="${s.grades && s.grades.writing ? s.grades.writing[s.grades.writing.length-1] : 80}"/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label" style="font-size:10.5px">단어 퀴즈</label>
              <input type="number" id="ad-grade-quiz" class="tsa-input" style="padding:4px;font-size:11.5px" value="${s.quiz ? s.quiz[s.quiz.length-1] : 90}"/>
            </div>
          </div>
          <small style="color:#6B7280;font-size:10.5px">※ 성적 입력은 어드민 권한에서 저장 시 성적 히스토리와 꺾은선 차트에 연동 반영됩니다.</small>
        </div>` : ''}
      </div>
    `;
  } else if (tab === 'settle') {
    const prices = calculatePrices(s);

    const crHistoryHtml = '';

    const localFeesHtml = '';

    html = `
      <div style="padding:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:14px;background:#FAFAFA">
            <div style="font-weight:700;font-size:12.5px;color:#1E3A8A;margin-bottom:8px">B2B Net 정산 내역서 (에이전시 마진 차감)</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11.5px">
              <div>학비 원가(Gross):</div><div style="text-align:right">$${prices.tuition.toLocaleString()}</div>
              <div>기숙사(Gross):</div><div style="text-align:right">$${prices.dorm.toLocaleString()}</div>
              <div>등록금(Registration):</div><div style="text-align:right">$${prices.registration}</div>
              <div style="border-top:1px solid #E5E7EB;grid-column:span 2;padding-top:4px"><strong>학생 Gross 청구 총액:</strong> <strong style="float:right">$${prices.gross.toLocaleString()}</strong></div>
              <div style="color:#4F46E5">에이전시 커미션 마진 (20%):</div><div style="text-align:right;color:#4F46E5">-$${prices.commission.toLocaleString()}</div>
              <div style="color:#059669">해외 이체 수수료 (가산):</div><div style="text-align:right;color:#059669">+$${prices.remitFee}</div>
              <div style="border-top:1.5px dashed #818CF8;grid-column:span 2;padding-top:4px;font-size:12px;color:#1E1B4B"><strong>최종 어학원 Net 송금액:</strong> <strong style="float:right">$${prices.net.toLocaleString()}</strong></div>
            </div>
            <div style="font-size:10.5px;color:#6B7280;margin-top:10px;background:#EFF6FF;padding:8px;border-radius:6px">
              ※ 송금 이체 후, 송금 제출 메뉴에서 은행 영수증을 업로드하여 승인을 획득해 주십시오.
            </div>
          </div>

          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:14px;background:#FAFAFA">
            <div style="font-weight:700;font-size:12.5px;color:#1E3A8A;margin-bottom:8px">📄 서류 출력 (자가 PDF 인쇄)</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <button class="tsa-btn tsa-btn-outline" style="justify-content:center" onclick="openAgencyDocumentsInline(${s.id}, 'invoice')">
                <i data-lucide="printer"></i> 학생용 Gross 인보이스 출력 (마진 비공개)
              </button>
              <button class="tsa-btn ${s.remittanceStatus === 'paid' ? 'tsa-btn-primary' : 'tsa-btn-outline'}" style="justify-content:center" ${s.remittanceStatus === 'paid' ? '' : 'disabled'} onclick="openAgencyDocumentsInline(${s.id}, 'loa')">
                <i data-lucide="check-circle"></i> 입학 허가서 (LOA) 인쇄 ${s.remittanceStatus === 'paid' ? '✓' : '(🔒 완납 시 해제)'}
              </button>
              <button class="tsa-btn ${s.remittanceStatus === 'paid' ? 'tsa-btn-success' : 'tsa-btn-outline'}" style="justify-content:center;background:${s.remittanceStatus === 'paid' ? '#10B981':''};border:none" ${s.remittanceStatus === 'paid' ? '' : 'disabled'} onclick="openAgencyDocumentsInline(${s.id}, 'pickup')">
                <i data-lucide="plane"></i> 공항 픽업 확인서 인쇄 ${s.remittanceStatus === 'paid' ? '✓' : '(🔒 완납 시 해제)'}
              </button>
            </div>
          </div>
          ${localFeesHtml}

          <!-- 입금 확인서 제출 섹션 (어드민은 미표시, 에이전시만 노출) -->
          ${isAgency ? `
          <div style="border:1px solid #C7D2FE;border-radius:10px;padding:16px;background:#F8F9FF;grid-column:span 2;margin-top:4px">
            <div style="font-weight:700;font-size:12.5px;color:#3730A3;margin-bottom:12px">💸 입금 확인서 제출</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">송금 일자</label>
                <input id="remit-receipt-date" type="date" class="tsa-input" style="font-size:12px"/>
              </div>
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">송금 금액 (USD)</label>
                <input id="remit-receipt-amount" type="number" class="tsa-input" placeholder="예: 1066" style="font-size:12px"/>
              </div>
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">송금 은행명</label>
                <input id="remit-receipt-bank" type="text" class="tsa-input" placeholder="예: 국민은행" style="font-size:12px"/>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end;margin-bottom:10px">
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">영수증 파일 첨부</label>
                <div style="display:flex;align-items:center;gap:8px">
                  <label style="display:inline-flex;align-items:center;gap:6px;padding:7px 12px;border:1.5px dashed #818CF8;border-radius:7px;background:#EEF2FF;cursor:pointer;font-size:11.5px;color:#4F46E5;font-weight:600">
                    <i data-lucide="upload" style="font-size:13px"></i> 파일 선택
                    <input type="file" id="remit-receipt-file" accept="image/*,.pdf" style="display:none" onchange="document.getElementById('remit-receipt-file-name').textContent=this.files[0]?this.files[0].name:'선택 없음'"/>
                  </label>
                  <span id="remit-receipt-file-name" style="font-size:11px;color:#9CA3AF">선택 없음</span>
                </div>
              </div>
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">메모</label>
                <input id="remit-receipt-memo" type="text" class="tsa-input" placeholder="예: 1차 송금, 분할 납부 등" style="font-size:12px"/>
              </div>
            </div>
            <div style="display:flex;justify-content:flex-end">
              <button class="tsa-btn tsa-btn-primary" onclick="submitRemittanceReceipt(${s.id})">
                <i data-lucide="send"></i> 제출
              </button>
            </div>
          </div>
          ` : ''}

          <!-- 입금 확인서 제출 이력 -->
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:16px;background:#FAFAFA;grid-column:span 2;margin-top:4px">
            <div style="font-weight:700;font-size:12.5px;color:#1E3A8A;margin-bottom:10px">📋 B2B 학비 입금 확인서 제출 이력 (B2B Net 정산)</div>
            ${(() => {
              // MOCK_REMIT_REQUESTS(대시보드)와 s.remittanceHistory(직접 제출) 통합
              const fromDashboard = (typeof MOCK_REMIT_REQUESTS !== 'undefined'
                ? MOCK_REMIT_REQUESTS.filter(r => r.studentId === s.id || r.studentName.includes(s.nick) || r.studentName.includes(s.name))
                : []).map(r => ({
                  submittedAt: r.submittedAt || r.remitDate || '-',
                  remitDate: r.remitDate || '-',
                  amount: r.net || 0,
                  bank: '-',
                  fileName: r.receipt || null,
                  status: r.status === 'approved' ? 'approved' : r.status === 'rejected' ? 'rejected' : 'pending',
                  note: r.note || '',
                  agency: r.agency || s.agency || '에이전시',
                  submittedBy: r.submittedBy || '에이전시 담당자',
                  approvedBy: r.approvedBy || (r.status === 'approved' ? '본사 슈퍼어드민' : '-')
                }));
              const fromLocal = (s.remittanceHistory || []).map(r => ({
                submittedAt: r.submittedAt || '-',
                remitDate: r.remitDate || '-',
                amount: r.amount || 0,
                bank: r.bank || '-',
                fileName: r.fileName || null,
                status: r.status || 'pending',
                note: r.memo || '',
                agency: s.agency || '직접 등록',
                submittedBy: r.submittedBy || '에이전시 담당자',
                approvedBy: r.approvedBy || (r.status === 'approved' ? '본사 슈퍼어드민' : '-')
              }));
              const history = [...fromDashboard, ...fromLocal];

              if (history.length === 0) {
                return `<div style="text-align:center;padding:18px;color:#9CA3AF;font-size:12px">제출된 B2B 입금 확인서가 없습니다.</div>`;
              }
              return `<table class="tsa-table" style="font-size:11.5px">
                <thead>
                  <tr>
                    <th>제출 에이전시</th>
                    <th>제출일</th>
                    <th>제출 관리자</th>
                    <th>송금 일자</th>
                    <th style="text-align:right">송금 금액</th>
                    <th>송금 은행</th>
                    <th>첨부 파일</th>
                    <th>메모</th>
                    <th style="text-align:center">승인 상태</th>
                    <th>승인자</th>
                    <th style="text-align:center">동작</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.map((r, i) => {
                    const badge = r.status === 'approved'
                      ? `<span class="tsa-badge tsa-badge-success">✅ 승인</span>`
                      : r.status === 'rejected'
                      ? `<span class="tsa-badge tsa-badge-danger">❌ 반려</span>`
                      : `<span class="tsa-badge tsa-badge-warning">⏳ 검토중</span>`;
                    const isLocal = i >= fromDashboard.length;
                    const localIdx = i - fromDashboard.length;

                    // 동작 컬럼 분기 (어드민: 즉시 승인/반려, 에이전시: 대기중일 때만 편집 버튼)
                    let actionCell = '<span style="font-size:10px;color:#9CA3AF">-</span>';
                    if (r.status === 'pending') {
                      if (!isAgency) {
                        actionCell = `
                          <div style="display:flex;gap:4px;justify-content:center">
                            <button class="tsa-btn tsa-btn-success tsa-btn-xs" style="background:#10B981;border:none;padding:2px 6px" onclick="confirmAdminRemittance(${s.id})">승인</button>
                            <button class="tsa-btn tsa-btn-danger tsa-btn-xs" style="padding:2px 6px" onclick="rejectAdminRemittance(${s.id})">반려</button>
                          </div>`;
                      } else if (isLocal) {
                        actionCell = `<button class="tsa-btn tsa-btn-outline tsa-btn-xs" style="color:#5E5CE6;border-color:#5E5CE6;padding:2px 6px" onclick="editRemittanceReceipt(${s.id}, ${localIdx})"><i data-lucide="pencil" style="font-size:10px"></i> 편집</button>`;
                      }
                    }

                    return `<tr>
                      <td><strong>${r.agency}</strong></td>
                      <td>${r.submittedAt || '-'}</td>
                      <td>${r.submittedBy || '-'}</td>
                      <td>${r.remitDate || '-'}</td>
                      <td style="text-align:right;font-weight:700;color:#059669">$${(r.amount||0).toLocaleString()}</td>
                      <td>${r.bank || '-'}</td>
                      <td style="color:#5E5CE6;font-size:11px">${r.fileName ? `📎 ${r.fileName}` : '-'}</td>
                      <td style="font-size:11px;color:#6B7280">${r.note || '-'}</td>
                      <td style="text-align:center">${badge}</td>
                      <td>${r.approvedBy || '-'}</td>
                      <td style="text-align:center">${actionCell}</td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>`;
            })()}
          </div>
        </div>
        ${crHistoryHtml}
      </div>
    `;
  } else if (tab === 'changelog') {
    const logs = (s.changeRequests || []).slice().reverse();
    const canEdit = !isLocked;
    const sid = s.id;

    // 변경 항목 → 메뉴(탭) 위치 매핑
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
      ? `<tr><td colspan="9" style="text-align:center;padding:40px;color:#9CA3AF;font-size:12px">변경 이력이 없습니다.</td></tr>`
      : logs.map((cr, i) => {
          const realIdx = (s.changeRequests || []).indexOf(cr);
          const menuId = `cl-menu-${sid}-${realIdx}`;
          const actionMenu = canEdit ? `
            <div style="position:relative;display:inline-block">
              <button onclick="toggleChangelogMenu('${menuId}')"
                style="background:none;border:1px solid #E5E7EB;border-radius:6px;padding:3px 8px;cursor:pointer;color:#6B7280;font-size:12px;display:flex;align-items:center;gap:3px">
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
            </div>` : '';

          const menuName = fieldMenuMap[cr.field] || cr.menu || '기타';
          const mc = menuColors[menuName] || menuColors['기타'];
          const menuBadge = `<span style="font-size:11px;font-weight:600;background:${mc.bg};color:${mc.color};padding:2px 8px;border-radius:8px;white-space:nowrap">${menuName}</span>`;

          const actionTd = canEdit ? `<td style="text-align:center;width:44px">${actionMenu}</td>` : '';

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
            ${actionTd}
          </tr>`;
        }).join('');

    html = `
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
        ${isLocked ? `<div style="font-size:11.5px;color:#B45309;background:#FEF3C7;padding:8px 12px;border-radius:6px;margin-bottom:12px">⚠️ 재학 중인 학생 정보는 어드민만 수정할 수 있습니다.</div>` : ''}
        <table class="tsa-table" style="font-size:12px">
          <thead>
            <tr>
              <th>변경일</th><th>메뉴</th><th>변경 항목</th><th>변경 내용 (전 → 후)</th><th>사유</th>
              <th style="border-left:2px solid #E5E7EB;padding-left:12px">변경 계정</th>
              ${canEdit ? '<th style="width:44px"></th>' : ''}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } else if (tab === 'visa') {
    html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px">
        <div class="tsa-form-group">
          <label class="tsa-label">비자 만료 예정일</label>
          <input id="ad-visa-expiry" type="date" class="tsa-input" value="${s.visaExpiry !== '면제' ? s.visaExpiry : ''}"/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">SSP 카드 만료 예정일 (또는 면제)</label>
          <input id="ad-ssp-expiry" type="text" class="tsa-input" value="${s.sspExpiry || '면제'}"/>
        </div>
      </div>
    `;
  } else if (tab === 'dorm') {
    // 현재 배정 침대 찾기
    let assignedRoom = null, assignedBed = null;
    MOCK_DORM_ROOMS.forEach(r => {
      if (r.beds) r.beds.forEach(b => {
        if (b.studentId === s.id) { assignedRoom = r; assignedBed = b; }
      });
    });
    if (!assignedRoom && s.dorm && s.dorm !== '미배정') {
      const m = s.dorm.match(/Room\s+(\S+)\s*\/\s*Bed\s+(\S+)/i);
      if (m) {
        MOCK_DORM_ROOMS.forEach(r => {
          if (String(r.roomNo) === String(m[1]) && r.beds) {
            const b = r.beds.find(b => b.id === m[2]);
            if (b) { assignedRoom = r; assignedBed = b; }
          }
        });
      }
    }
    // 과거 이력
    const dormHistory = [];
    MOCK_DORM_ROOMS.forEach(r => {
      if (r.beds) r.beds.forEach(b => {
        (b.history || []).forEach(h => {
          if (h.studentId === s.id) dormHistory.push({ room: r, bed: b, record: h });
        });
      });
    });

    const currentStatus = assignedRoom ? `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 16px;background:#EEF2FF;border-radius:12px;border-left:4px solid #5E5CE6;margin-bottom:4px">
        <div style="font-size:24px">🏠</div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:800;color:#1A1D23">Room ${assignedRoom.roomNo} · Bed ${assignedBed.id}</div>
          <div style="font-size:11px;color:#5E5CE6;margin-top:2px">${assignedRoom.accomType} · ${assignedRoom.type} · ${assignedRoom.genderRestriction || '무관'}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:3px">체크인 <strong>${assignedBed.start}</strong> → 체크아웃 <strong>${assignedBed.end}</strong></div>
        </div>
        <span class="tsa-badge" style="background:#DCFCE7;color:#16A34A">입실중</span>
      </div>` : `
      <div style="padding:16px;background:#F9FAFB;border-radius:10px;border:1px dashed #D1D5DB;text-align:center;color:#9CA3AF;font-size:12px">
        🏠 현재 배정된 기숙사가 없습니다.
      </div>`;

    const historyRows = dormHistory.length > 0 ? dormHistory.map(({ room, bed, record }) => `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:#F9FAFB;border-radius:8px;border-left:3px solid #D1D5DB">
        <div style="flex:1">
          <div style="font-size:12px;font-weight:600;color:#374151">Room ${room.roomNo} · Bed ${bed.id}</div>
          <div style="font-size:11px;color:#9CA3AF;margin-top:1px">${room.accomType} · ${room.type} &nbsp;|&nbsp; ${record.start} ~ ${record.end}</div>
        </div>
        <span class="tsa-badge" style="background:#F3F4F6;color:#9CA3AF;font-size:10px">퇴실</span>
      </div>`).join('') : `<div style="font-size:11px;color:#9CA3AF;padding:8px 0">이용 이력이 없습니다.</div>`;

    html = `
      <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0">
        <div>
          <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:10px">희망 숙소 <span style="color:#EF4444">*</span></div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
            <div class="tsa-form-group">
              <label class="tsa-label">숙소 유형</label>
              <select id="ad-dorm-accom" class="tsa-input" ${lockAttr} onchange="onDormAccomChange(this.value)">
                <option value="">— 선택 —</option>
                ${[...new Set(MOCK_DORM_TEMPLATES.map(t=>t.accomType))].map(v=>`<option value="${v}" ${s.dormAccomType===v?'selected':''}>${v}</option>`).join('')}
              </select>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">인실 기준</label>
              <select id="ad-dorm-cap" class="tsa-input" ${lockAttr} onchange="onDormCapChange(this.value)">
                <option value="">— 유형 먼저 —</option>
                ${s.dormAccomType ? [...new Set(MOCK_DORM_TEMPLATES.filter(t=>t.accomType===s.dormAccomType).map(t=>t.capacity+'인실'))].map(v=>`<option value="${v}" ${s.dormType===v?'selected':''}>${v}</option>`).join('') : ''}
              </select>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">등급</label>
              <select id="ad-dorm-grade" class="tsa-input" ${lockAttr}>
                <option value="">— 인실 먼저 —</option>
                ${s.dormAccomType && s.dormType ? [...new Set(MOCK_DORM_TEMPLATES.filter(t=>t.accomType===s.dormAccomType&&t.capacity===parseInt(s.dormType)).map(t=>t.condition))].map(v=>`<option value="${v}" ${s.dormGrade===v?'selected':''}>${v}</option>`).join('') : ''}
              </select>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="tsa-form-group">
              <label class="tsa-label">입실 희망일</label>
              <input id="ad-dorm-in" type="date" class="tsa-input" value="${s.dormIn || s.startDate || ''}" ${lockAttr}/>
            </div>
            <div class="tsa-form-group">
              <label class="tsa-label">퇴실 희망일</label>
              <input id="ad-dorm-out" type="date" class="tsa-input" value="${s.dormOut || s.departureDate || ''}" ${lockAttr}/>
            </div>
          </div>
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.04em;margin-bottom:8px">현재 배정 숙소</div>
          ${currentStatus}
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.04em;margin-bottom:8px">배정 이력</div>
          <div style="display:flex;flex-direction:column;gap:6px">${historyRows}</div>
        </div>
      </div>`;
  }

  container.innerHTML = html;
}

function submitRemittanceReceipt(studentId, editIdx) {
  const remitDate = document.getElementById('remit-receipt-date')?.value;
  const amount = parseFloat(document.getElementById('remit-receipt-amount')?.value || 0);
  const bank = document.getElementById('remit-receipt-bank')?.value?.trim();
  const memo = document.getElementById('remit-receipt-memo')?.value?.trim() || '';
  const fileInput = document.getElementById('remit-receipt-file');
  const fileName = fileInput?.files?.[0]?.name || null;

  if (!remitDate) { showToast('송금 일자를 입력해 주세요.', 'warning'); return; }
  if (!amount || amount <= 0) { showToast('송금 금액을 입력해 주세요.', 'warning'); return; }
  if (!bank) { showToast('송금 은행명을 입력해 주세요.', 'warning'); return; }

  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;

  if (!s.remittanceHistory) s.remittanceHistory = [];

  if (editIdx !== undefined && editIdx !== null) {
    // 편집 모드 — 기존 항목 업데이트
    const entry = s.remittanceHistory[editIdx];
    if (entry) {
      entry.remitDate = remitDate;
      entry.amount = amount;
      entry.bank = bank;
      entry.memo = memo;
      if (fileName) entry.fileName = fileName;
      entry.status = 'approved';
    }
    showToast('✅ 입금 확인서가 수정되었습니다.', 'success');
  } else {
    s.remittanceHistory.unshift({
      submittedAt: new Date().toISOString().slice(0, 10),
      remitDate,
      amount,
      bank,
      memo,
      fileName,
      status: 'approved'
    });
    s.remittanceStatus = 'paid';
    showToast('✅ 입금 확인서가 제출되어 완납 처리되었습니다.', 'success');
  }

  switchAdetailTab('settle');
}

function editRemittanceReceipt(studentId, localIdx) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s || !s.remittanceHistory) return;
  const r = s.remittanceHistory[localIdx];
  if (!r) return;

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('remit-receipt-date', r.remitDate);
  setVal('remit-receipt-amount', r.amount);
  setVal('remit-receipt-bank', r.bank);
  setVal('remit-receipt-memo', r.memo || '');
  document.getElementById('remit-receipt-file-name').textContent = r.fileName || '선택 없음';

  // 제출 버튼을 편집 모드로 전환
  const btn = document.querySelector(`button[onclick="submitRemittanceReceipt(${studentId})"]`);
  if (btn) {
    btn.setAttribute('onclick', `submitRemittanceReceipt(${studentId}, ${localIdx})`);
    btn.innerHTML = '<i data-lucide="save"></i> 수정 저장';
    if (window.lucide) lucide.createIcons();
  }
  document.getElementById('remit-receipt-date')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function handleAdetailFileSelected(type) {
  const input = document.getElementById(`ad-file-${type}`);
  const badge = document.getElementById(`ad-badge-${type}`);
  if (input.files && input.files.length > 0) {
    const name = input.files[0].name;
    adetailUploadedFiles[type] = name;
    badge.textContent = `✓ 제출완료`;
    badge.className = 'tsa-badge tsa-badge-success';
    showToast(`${type === 'passport' ? '여권 사본' : type === 'ticket' ? 'E-티켓' : type === 'photo' ? '증명사진' : '보험증서'}이 새로 첨부되었습니다.`, 'success');
  }
}

function openAgencyChangeRequestModal(field, label) {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;

  document.getElementById('cr-student-name').textContent = s.name;
  document.getElementById('cr-field').value = field;
  document.getElementById('cr-current-val').value = s[field] || '';
  document.getElementById('cr-new-val').value = '';
  document.getElementById('cr-reason').value = '';

  const statusEl = document.getElementById('cr-student-status');
  if (statusEl) {
    const labels = { waiting: '입학 대기', current: '재학', completed: '졸업', resigned: '퇴원', extended: '연장' };
    const text = labels[s.status] || s.status;
    statusEl.textContent = text;
    statusEl.className = 'tsa-badge';
    if (s.status === 'waiting') statusEl.classList.add('tsa-badge-warning');
    else if (s.status === 'current') statusEl.classList.add('tsa-badge-success');
    else if (s.status === 'completed') statusEl.classList.add('tsa-badge-gray');
    else if (s.status === 'resigned') statusEl.classList.add('tsa-badge-danger');
    else if (s.status === 'extended') statusEl.classList.add('tsa-badge-info');
  }

  onCrFieldChanged();
  openModal('agency-change-request-modal');
}

function onCrFieldChanged() {
  const field = document.getElementById('cr-field').value;
  const currentVal = document.getElementById('cr-current-val');
  const container = document.getElementById('cr-new-val-container');
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);

  if (!s) return;
  currentVal.value = s[field] || '';

  if (field === 'startDate' || field === 'passportExpiry' || field === 'dormIn' || field === 'dormOut') {
    container.innerHTML = `
      <label class="tsa-label">변경 요청 값</label>
      <input id="cr-new-val" type="date" class="tsa-input"/>
    `;
  } else if (field === 'course') {
    container.innerHTML = `
      <label class="tsa-label">변경 요청 값</label>
      <select id="cr-new-val" class="tsa-input">
        <option value="일반 코스">일반 코스</option>
        <option value="IELTS 전문 코스">IELTS 전문 코스</option>
        <option value="주니어 패키지">주니어 패키지</option>
        <option value="가디언 코스">가디언 코스</option>
      </select>
    `;
  } else if (field === 'dorm') {
    container.innerHTML = `
      <label class="tsa-label">변경 요청 값</label>
      <select id="cr-new-val" class="tsa-input">
        <option value="1인실 (Premium A)">1인실 (Premium A)</option>
        <option value="2인실 (Standard B)">2인실 (Standard B)</option>
        <option value="4인실 (Dormitory C)">4인실 (Dormitory C)</option>
      </select>
    `;
  } else {
    container.innerHTML = `
      <label class="tsa-label">변경 요청 값</label>
      <input id="cr-new-val" type="text" class="tsa-input" placeholder="새로운 값을 입력하세요..."/>
    `;
  }
}

function submitAgencyChangeRequest() {
  const field = document.getElementById('cr-field').value;
  const toVal = document.getElementById('cr-new-val').value;
  const reason = document.getElementById('cr-reason').value.trim();

  if (!toVal || !reason) {
    showToast('⚠ 변경 요청 값과 사유를 입력하십시오.', 'danger');
    return;
  }

  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;

  const requestObj = {
    id: Date.now(),
    field: field,
    from: s[field] || '없음',
    to: toVal,
    reason: reason,
    status: 'pending',
    requestDate: new Date().toISOString().replace('T', ' ').substring(0, 10)
  };

  if (!s.changeRequests) s.changeRequests = [];
  s.changeRequests.push(requestObj);

  showToast(`✓ 어학원 어드민에 [${field}] 변경 심사 요청이 전송되었습니다.`, 'success');
  closeModal('agency-change-request-modal');
  switchAdetailTab('settle');
  
  if (typeof initAdminInbox === 'function') initAdminInbox();
}

function saveAgencyHealthInfo(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;
  const dietEl    = document.getElementById('ad-diet');
  const specialEl = document.getElementById('ad-special');
  const newDiet   = dietEl    ? dietEl.value.trim()    : s.dietType;
  const newHealth = specialEl ? specialEl.value.trim() : s.healthNotes;

  const changedBy = APP.user === 'super_admin' ? '슈퍼 어드민' : APP.user === 'agency_head' ? '에이전시 본사' : '에이전시 지사';
  const today = new Date().toISOString().substring(0, 10);
  if (!s.changeRequests) s.changeRequests = [];

  if (newDiet !== s.dietType) {
    s.changeRequests.push({ id: Date.now(), field: '식단 구분', from: s.dietType, to: newDiet, reason: '직접 수정', changedBy, requestDate: today });
    s.dietType = newDiet;
  }
  if (newHealth !== s.healthNotes) {
    s.changeRequests.push({ id: Date.now() + 1, field: '건강 특이사항', from: s.healthNotes || '-', to: newHealth, reason: '직접 수정', changedBy, requestDate: today });
    s.healthNotes = newHealth;
  }

  showToast('✓ 건강 및 식단 정보가 저장되었습니다.', 'success');
}

function saveAgencyStudentDetails() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;

  const isAgencyUser = APP.user === 'agency_head' || APP.user === 'agency_branch';
  // 재학생이면 에이전시는 저장 불가
  if (isAgencyUser && s.status !== 'waiting') {
    showToast('재학 중인 학생 정보는 어드민에게 문의하세요.', 'warning');
    return;
  }

  const isActive = s.remittanceStatus === 'paid';
  const prevValues = { name: s.name, nick: s.nick, phone: s.phone, email: s.email, emergencyContact: s.emergencyContact };

  if (!isActive || !isAgencyUser) {
    const name = document.getElementById('ad-name').value.trim();
    const nick = document.getElementById('ad-nickname').value.trim();
    const gender = document.getElementById('ad-gender').value;
    const age = parseInt(document.getElementById('ad-age').value);
    const nationality = document.getElementById('ad-nationality').value;
    
    if (!name || !nick) {
      showToast('성명과 닉네임은 필수입니다.', 'danger');
      return;
    }

    s.name = name;
    s.nick = nick;
    s.gender = gender;
    s.nationality = nationality;

    // 생년월일 → age 자동 계산
    const dobEl = document.getElementById('ad-dob');
    if (dobEl && dobEl.value) {
      s.dob = dobEl.value;
      s.age = Math.floor((new Date('2026-06-15') - new Date(dobEl.value)) / (365.25 * 86400000));
    }

    const course = document.getElementById('ad-course') ? document.getElementById('ad-course').value : s.course;
    const duration = document.getElementById('ad-duration') ? parseInt(document.getElementById('ad-duration').value) || 4 : s.duration;
    const startDate = document.getElementById('ad-start-date') ? document.getElementById('ad-start-date').value : s.startDate;
    const dorm = document.getElementById('ad-dorm-pref') ? document.getElementById('ad-dorm-pref').value : s.dorm;

    s.course = course;
    s.duration = duration;
    s.startDate = startDate;
    s.dorm = dorm;

    const enrollDateEl = document.getElementById('ad-enroll-date');
    if (enrollDateEl && enrollDateEl.value) s.enrollDate = enrollDateEl.value;
  }

  // 항상 저장 가능한 필드
  const getVal = (id, fallback) => { const el = document.getElementById(id); return el ? el.value.trim() : fallback; };

  s.phone            = getVal('ad-phone', s.phone);
  s.email            = getVal('ad-email', s.email);
  s.emergencyContact = getVal('ad-emergency', s.emergencyContact);

  // 항공 & 입출국
  const newFlightNum = getVal('ad-flight-num', s.flightNum);
  const newArrival   = getVal('ad-arrival-date', s.arrivalDate);
  if ((newFlightNum !== s.flightNum || newArrival !== s.arrivalDate) && s.arrivalDate) {
    const diffHrs = (new Date(s.arrivalDate) - new Date('2026-06-15')) / 3600000;
    if (diffHrs >= 0 && diffHrs <= 24) {
      alert('⚠ 경고: 입국일 24시간 이내의 항공 스케줄 변경입니다. 현지 픽업 스태프 배정에 차질이 있을 수 있습니다.');
    }
  }
  s.flightNum     = newFlightNum;
  s.arrivalDate   = newArrival;
  s.flightTime    = getVal('ad-flight-time', s.flightTime);
  s.flightOutNum  = getVal('ad-flight-out-num', s.flightOutNum);
  s.departureDate = getVal('ad-departure-date', s.departureDate);
  s.flightOutTime = getVal('ad-flight-out-time', s.flightOutTime);
  s.dormIn        = getVal('ad-dorm-in', s.dormIn);
  s.dormOut       = getVal('ad-dorm-out', s.dormOut);

  // 여권
  s.passportNum    = getVal('ad-passport-num', s.passportNum);
  s.passportExpiry = getVal('ad-passport-expiry', s.passportExpiry);

  // 건강
  const specialVal = getVal('ad-special', s.healthNotes);
  s.healthNotes = specialVal;

  if (document.getElementById('ad-visa-expiry')) {
    s.visaExpiry = document.getElementById('ad-visa-expiry').value || '면제';
  }
  if (document.getElementById('ad-ssp-expiry')) {
    s.sspExpiry = document.getElementById('ad-ssp-expiry').value || '면제';
  }

  const isAgency = APP.user === 'agency_head' || APP.user === 'agency_branch';
  if (!isAgency) {
    if (document.getElementById('ad-medicine')) {
      s.medicine = document.getElementById('ad-medicine').value.trim();
    }
    if (document.getElementById('ad-allergy')) {
      s.allergy = document.getElementById('ad-allergy').value.trim();
    }
    if (document.getElementById('ad-grade-speaking')) {
      const spk = parseInt(document.getElementById('ad-grade-speaking').value) || 80;
      const lis = parseInt(document.getElementById('ad-grade-listening').value) || 80;
      const rdg = parseInt(document.getElementById('ad-grade-reading').value) || 80;
      const wrt = parseInt(document.getElementById('ad-grade-writing').value) || 80;
      const qz = parseInt(document.getElementById('ad-grade-quiz').value) || 90;
      
      if (!s.grades) s.grades = { speaking: [80], listening: [80], reading: [80], writing: [80] };
      if (!s.quiz) s.quiz = [90];
      
      s.grades.speaking.push(spk);
      s.grades.listening.push(lis);
      s.grades.reading.push(rdg);
      s.grades.writing.push(wrt);
      s.quiz.push(qz);
    }
  }

  s.requiredFiles = { ...adetailUploadedFiles };

  // 변경된 항목 자동 이력 기록
  if (!s.changeRequests) s.changeRequests = [];
  const changedBy = APP.user === 'super_admin' ? '슈퍼 어드민' : APP.user === 'agency_head' ? '에이전시 본사' : APP.user === 'agency_branch' ? '에이전시 지사' : APP.user;
  const today = new Date().toISOString().substring(0, 10);
  const fieldLabels = { name: '영문 성명', nick: '닉네임', phone: '연락처', email: '이메일', emergencyContact: '비상 연락처' };
  Object.entries(prevValues || {}).forEach(([key, oldVal]) => {
    const newVal = s[key];
    if (oldVal !== newVal && newVal) {
      s.changeRequests.push({ id: Date.now() + Math.random(), field: fieldLabels[key] || key, from: oldVal || '-', to: newVal, reason: '직접 수정', changedBy, requestDate: today });
    }
  });

  showToast(`✓ 학생 정보가 저장되었습니다.`, 'success');
  closeModal('agency-student-detail-modal');
  initAgencyStudentList();
}

function openAgencyDocumentsInline(id, tab = 'invoice') {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  APP.selectedInvoiceStudent = {
    name: `${s.name} (${s.nick})`,
    course: s.course.split(' ')[0],
    dorm: s.dorm.split(' ')[0],
    duration: `${s.duration}주`,
    status: s.status,
    total: s.fees.reduce((sum, f) => sum + f.amount, 0),
    branch: s.branch || '강남지사'
  };

  switchInvoiceTab(tab);
  openModal('agency-invoice-modal');
}

function switchInvoiceTab(tab) {
  APP.selectedInvoiceTab = tab;
  
  const tabIds = { 'invoice': 'itab-invoice', 'loa': 'itab-loa', 'pickup': 'itab-pickup' };
  for (const [tKey, id] of Object.entries(tabIds)) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('active', tKey === tab);
  }

  const s = APP.selectedInvoiceStudent;
  const content = document.getElementById('invoice-modal-content');
  if (!s || !content) return;

  const std = MOCK_STUDENTS.find(m => s.name.includes(m.nick) || s.name.includes(m.name));
  if (!std) return;

  const prices = calculatePrices(std);
  const avatarSrc = std.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';

  if (tab === 'invoice') {
    content.style.position = 'relative';
    content.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #1E3A8A;padding-bottom:12px">
        <h2 style="font-size:22px;font-weight:800;color:#1E3A8A;margin:0;letter-spacing:1px">TALKSTATION ACADEMY</h2>
        <p style="font-size:12px;color:#6B7280;margin:4px 0 0 0">Official Invoice & Student Billing Statement</p>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:12px">
        <div>
          <div><strong>Bill To:</strong> ${std.name}</div>
          <div><strong>Nickname:</strong> ${std.nick}</div>
          <div><strong>Nationality:</strong> ${std.nationality}</div>
          <div><strong>Course Program:</strong> ${std.course}</div>
        </div>
        <div style="text-align:right">
          <div><strong>Invoice No:</strong> TSA-${std.id}-${std.startDate ? std.startDate.replace(/-/g, '') : '2026'}</div>
          <div><strong>Issue Date:</strong> ${new Date().toISOString().substring(0, 10)}</div>
          <div><strong>Start Date:</strong> ${std.startDate || '2026-06-01'}</div>
          <div><strong>Study Duration:</strong> ${std.duration} Weeks</div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:12px">
        <thead>
          <tr style="background:#EEF2FF;border-bottom:2px solid #312E81;font-weight:700">
            <th style="padding:8px;text-align:left">Description (수강 청구 항목)</th>
            <th style="padding:8px;text-align:right">Weeks</th>
            <th style="padding:8px;text-align:right">Amount (USD)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #E9EDF4">Tuition Fee (기본 수강료)</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #E9EDF4">${std.duration}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #E9EDF4">$${prices.tuition.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #E9EDF4">Accommodation Fee (${std.dorm} 기숙사 사용료)</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #E9EDF4">${std.duration}</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #E9EDF4">$${prices.dorm.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding:8px;border-bottom:1px solid #E9EDF4">Registration Fee (입학 행정비 - 비환불)</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #E9EDF4">-</td>
            <td style="padding:8px;text-align:right;border-bottom:1px solid #E9EDF4">$${prices.registration}</td>
          </tr>
          <tr style="font-weight:700;background:#F8F9FC;border-top:1.5px solid #312E81">
            <td style="padding:8px" colspan="2">Total Billing (학생 납부 총액)</td>
            <td style="padding:8px;text-align:right;color:#5E5CE6;font-size:14px">$${prices.gross.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size:11px;color:#6B7280;background:#F9FAFB;padding:12px;border-radius:8px;border:1px solid #E5E7EB;line-height:1.6">
        <strong>Important Notices:</strong><br>
        1. Local fees (SSP, visa extensions, utility bills, deposit) are not included above and must be paid in cash at the campus in local currency (PHP/KRW).<br>
        2. Refund policy follows the official rules specified in the academy student guidebook.
      </div>

      <div style="position:absolute;bottom:15px;right:25px;opacity:0.85;transform:rotate(-12deg);pointer-events:none">
        <svg width="110" height="110" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="#EF4444" stroke-width="2"/>
          <circle cx="50" cy="50" r="38" fill="none" stroke="#EF4444" stroke-width="1" stroke-dasharray="2 2"/>
          <path id="seal-text-path" d="M 16 50 A 34 34 0 1 1 84 50" fill="none"/>
          <text fill="#EF4444" font-size="6.5" font-family="Pretendard, sans-serif" font-weight="700">
            <textPath href="#seal-text-path" startOffset="50%" text-anchor="middle">★ TALKSTATION ACADEMY CEBU ★</textPath>
          </text>
          <text fill="#EF4444" font-size="9" font-family="Pretendard, sans-serif" font-weight="bold" x="50" y="48" text-anchor="middle">OFFICIAL</text>
          <text fill="#EF4444" font-size="9" font-family="Pretendard, sans-serif" font-weight="bold" x="50" y="59" text-anchor="middle">ACADEMY</text>
          <text fill="#EF4444" font-size="8" font-family="Pretendard, sans-serif" font-weight="bold" x="50" y="70" text-anchor="middle">SEAL</text>
        </svg>
      </div>
    `;
  } else if (tab === 'loa') {
    if (std.remittanceStatus !== 'paid') {
      content.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:240px;color:#9CA3AF">
          <i data-lucide="lock" style="font-size:48px;margin-bottom:14px;color:#D1D5DB"></i>
          <div style="font-size:14px;font-weight:700;color:#374151">입학 허가서 출력 제한 (🔒)</div>
          <div style="font-size:12px;margin-top:6px">어학원 어드민의 순 송금액(Net) [송금 승인] 처리가 완료된 이후 해제됩니다.</div>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div style="text-align:center;margin-bottom:24px;border-bottom:1px double #9CA3AF;padding-bottom:12px">
        <h2 style="font-size:22px;font-weight:800;font-family:'Pretendard', sans-serif;letter-spacing:1.5px;color:#111827">LETTER OF ACCEPTANCE (LOA)</h2>
        <p style="font-size:12px;color:#4B5563;margin-top:4px">TalkStation Academy Admissions Office</p>
      </div>

      <div style="font-size:12.5px;line-height:1.9;color:#1F2937;font-family:'Pretendard', sans-serif;padding:0 10px">
        <p>To Whom It May Concern,</p>
        <p>We are pleased to certify that the applicant named below has been officially accepted to enroll in the English intensive program at TalkStation Academy, Cebu Campus, Philippines.</p>
        
        <div style="display:flex;gap:20px;align-items:start;margin:20px 0;padding:16px;background:#F9FAFB;border-radius:10px;border:1px solid #E5E7EB;font-family:'Pretendard', sans-serif;">
          <div style="width:85px;height:105px;border-radius:6px;overflow:hidden;border:1px solid #D1D5DB;flex-shrink:0;background:white;padding:2px">
            <img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover" alt=""/>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11.5px">
            <div><strong>Full Name:</strong> ${std.name}</div>
            <div><strong>Passport No:</strong> ${std.passportNum || 'N/A'}</div>
            <div><strong>Date of Birth:</strong> 2002-05-15 (Age: ${std.age})</div>
            <div><strong>Nationality:</strong> ${std.nationality}</div>
            <div><strong>Course Program:</strong> ${std.course}</div>
            <div><strong>Study Period:</strong> ${std.startDate} ~ (${std.duration} Weeks)</div>
            <div><strong>Dorm Accommodation:</strong> ${std.dorm}</div>
            <div><strong>Representative Agency:</strong> ${std.agency}</div>
          </div>
        </div>

        <p>This admission letter is issued to support the student's entry and study permit visa processing in the Philippines. Please facilitate the necessary consular services accordingly.</p>
        
        <div style="margin-top:40px;text-align:right">
          <div style="font-weight:700">TalkStation Academy Cebu Campus</div>
          <div style="font-size:11px;color:#6B7280">Director of Admissions & Registration</div>
        </div>
      </div>
    `;
  } else if (tab === 'pickup') {
    if (std.remittanceStatus !== 'paid') {
      content.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:240px;color:#9CA3AF">
          <i data-lucide="lock" style="font-size:48px;margin-bottom:14px;color:#D1D5DB"></i>
          <div style="font-size:14px;font-weight:700;color:#374151">공항 픽업 확인서 출력 제한 (🔒)</div>
          <div style="font-size:12px;margin-top:6px">어학원 어드민의 순 송금액(Net) [송금 승인] 처리가 완료된 이후 해제됩니다.</div>
        </div>
      `;
      return;
    }

    content.innerHTML = `
      <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #0284C7;padding-bottom:10px">
        <h2 style="font-size:20px;font-weight:800;color:#0284C7;margin:0">AIRPORT PICKUP & ARRIVAL GUIDE</h2>
        <p style="font-size:12px;color:#6B7280;margin:4px 0 0 0">TalkStation Academy Student Service Desk</p>
      </div>

      <div style="font-size:12.5px;line-height:1.8;color:#374151">
        <div style="display:flex;gap:20px;align-items:start;padding:16px;background:#F0F9FF;border-radius:10px;border:1px solid #BAE6FD;margin-bottom:16px">
          <div style="width:64px;height:64px;border-radius:50%;overflow:hidden;border:2px solid #87CEEB;flex-shrink:0;">
            <img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover" alt=""/>
          </div>
          <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:6px">
            <div><strong>Student Name:</strong> ${std.name} (${std.nick})</div>
            <div><strong>Flight Details:</strong> ${std.flightInfo || 'KE631'}</div>
            <div><strong>Estimated Arrival:</strong> ${std.startDate} (Sunday)</div>
            <div><strong>Beds Assign:</strong> Room ${std.dorm.includes('/') ? std.dorm.split('/')[0].trim() : std.dorm}</div>
          </div>
        </div>

        <h4 style="font-size:13px;font-weight:700;margin:0 0 6px 0;color:#0369A1">📢 막탄 세부 국제공항 도착 후 미팅 안내</h4>
        <p style="margin:0 0 12px 0">1. 세부 공항 입국 심사(Immigration) 및 세관을 무사히 통과합니다.<br>
        2. 위탁 수하물 수령 후 청사 외부 게이트(Arrival Gate)로 나오십시오.<br>
        3. 게이트 정면 우측에 마련된 **[TalkStation Academy] 미팅 피켓**을 들고 오렌지색 유니폼을 착용한 공항 스태프와 합류하십시오.</p>

        <div style="font-size:11px;color:#6B7280;background:#FFFBEB;padding:10px;border-radius:8px;border:1px solid #FDE68A">
          ※ 비상 시 현지 오피스 비상 연락망 (+63-917-123-4567) 또는 카카오톡 채널 [TSA_Cebu]로 메시지를 남겨주십시오.
        </div>
      </div>
    `;
  }
}

function printInvoiceDocument() {
  window.print();
}

// 어드민 전용 에이전시 업무 처리 함
function initAdminInbox() {
  const remitBody = document.getElementById('admin-remit-inbox-body');
  const remitCount = document.getElementById('admin-waiting-remits-count');

  if (!remitBody) return;

  const waitingRemits = MOCK_STUDENTS.filter(s => s.remittanceStatus !== 'paid' && (s.remittanceReceipt || s.remittanceMemo));
  remitCount.textContent = `승인 대기: ${waitingRemits.length}건`;

  if (waitingRemits.length === 0) {
    remitBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#9CA3AF">승인 대기 중인 입금 확인서가 없습니다.</td></tr>`;
  } else {
    remitBody.innerHTML = waitingRemits.map(s => {
      const prices = calculatePrices(s);
      return `
        <tr>
          <td>한국 영어마을 (${s.branch || '강남지사'})</td>
          <td><strong>${s.name} (Nick: ${s.nick})</strong></td>
          <td style="font-weight:700;color:#1E3A8A">$${prices.net.toLocaleString()}</td>
          <td><span style="cursor:pointer;color:#5E5CE6;text-decoration:underline" onclick="alert('영수증 파일: ${s.remittanceReceipt}')"><i data-lucide="file"></i> ${s.remittanceReceipt}</span></td>
          <td>${s.remittanceDate}</td>
          <td style="text-align:center">
            <button class="tsa-btn tsa-btn-success tsa-btn-xs" style="background:#10B981;border:none" onclick="confirmAdminRemittance(${s.id})">송금 승인</button>
            <button class="tsa-btn tsa-btn-danger tsa-btn-xs" onclick="rejectAdminRemittance(${s.id})">반려</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  if (typeof initAdminAttendanceInbox === 'function') {
    initAdminAttendanceInbox();
  }
}

function approveDormBooking(id) {
  const req = MOCK_DORM_BOOK_REQUESTS.find(r => r.id === id);
  if (!req) return;

  // 어드민이 실제 호실·침대 지정
  const roomSel = document.getElementById(`admin-dorm-assign-room-${id}`);
  const bedSel  = document.getElementById(`admin-dorm-assign-bed-${id}`);
  const roomNo  = roomSel ? roomSel.value : null;
  const bedId   = bedSel  ? bedSel.value  : null;

  if (!roomNo || !bedId) {
    showToast('호실과 침대를 선택해주세요.', 'warning'); return;
  }

  // MOCK_DORM_ROOMS에 실제 반영
  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === roomNo);
  if (room) {
    const bed = room.beds.find(b => b.id === bedId);
    if (bed) {
      const student = MOCK_STUDENTS.find(s => s.id === req.studentId);
      bed.student   = student ? `${student.nick} (${student.name})` : req.studentName;
      bed.studentId = req.studentId;
      bed.start = req.checkin.slice(5);
      bed.end   = req.checkout.slice(5);
    }
  }

  req.status         = 'approved';
  req.assignedRoomNo = roomNo;
  req.assignedBedId  = bedId;

  showToast(`${req.roomType} → Room ${roomNo}-${bedId} 배정이 승인됐습니다.`, 'success');
  initAdminInbox();
  if (typeof initAgencyRequestInbox === 'function') initAgencyRequestInbox();
  if (typeof renderAgencyDormBookHistory === 'function') renderAgencyDormBookHistory();
  if (typeof renderReqDormPanel === 'function') renderReqDormPanel();
  if (typeof initDormGantt === 'function') initDormGantt();
}

function rejectDormBooking(id) {
  const req = MOCK_DORM_BOOK_REQUESTS.find(r => r.id === id);
  if (!req) return;
  const reason = prompt('반려 사유를 입력하세요 (에이전시에게 전달됩니다):');
  if (reason === null) return;
  req.status = 'rejected';
  req.rejectReason = reason || '사유 없음';
  showToast(`${req.roomType} 배정 요청이 반려됐습니다.`, 'warning');
  initAdminInbox();
  if (typeof initAgencyRequestInbox === 'function') initAgencyRequestInbox();
  if (typeof renderAgencyDormBookHistory === 'function') renderAgencyDormBookHistory();
  if (typeof renderReqDormPanel === 'function') renderReqDormPanel();
}

// 어드민 호실 선택 시 침대 드롭다운 갱신
function updateDormBedOptions(id) {
  const roomSel = document.getElementById(`admin-dorm-assign-room-${id}`);
  const bedSel  = document.getElementById(`admin-dorm-assign-bed-${id}`);
  if (!roomSel || !bedSel) return;
  const req  = MOCK_DORM_BOOK_REQUESTS.find(r => r.id === id);
  const room = MOCK_DORM_ROOMS.find(r => r.roomNo === roomSel.value);
  if (!room) { bedSel.innerHTML = '<option value="">— 침대 선택 —</option>'; return; }
  const start = req ? new Date(req.checkin)  : new Date();
  const end   = req ? new Date(req.checkout) : new Date();
  const freeBeds = room.beds.filter(bed => {
    if (bed.student && bed.start && bed.end) {
      const bS = new Date(`2026-${bed.start}`), bE = new Date(`2026-${bed.end}`);
      if (start <= bE && end >= bS) return false;
    }
    return true;
  });
  bedSel.innerHTML = '<option value="">— 침대 선택 —</option>' +
    freeBeds.map(b => `<option value="${b.id}">침대 ${b.id} (공실)</option>`).join('');
}

function confirmAdminRemittance(id) {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  s.remittanceStatus = 'paid';
  s.passportStatus = '보관 중';
  s.adminApprovedAt = new Date('2026-06-15').toISOString().slice(0, 10);

  // MOCK_REMIT_REQUESTS 내 해당 학생의 대기중인 송금 요청도 승인 처리
  const req = MOCK_REMIT_REQUESTS.find(r => r.studentId === id && r.status === 'pending');
  if (req) {
    req.status = 'approved';
    req.approvedBy = '본사 슈퍼어드민';
  }

  // s.remittanceHistory 내 대기중인 로컬 송금 영수증도 승인 처리
  if (s.remittanceHistory) {
    const localReq = s.remittanceHistory.find(r => r.status === 'pending');
    if (localReq) {
      localReq.status = 'approved';
      localReq.approvedBy = '본사 슈퍼어드민';
    }
  }

  // 상태 전환 로직: 수강 등록일(enrollDate) + 어드민 승인 → 재학생
  // enrollDate가 오늘 이전이면 즉시 재학, 미래면 대기 유지
  const today = new Date('2026-06-15');

  if (s.enrollDate) {
    const enrollD = new Date(s.enrollDate);
    const endStudyDate = s.startDate
      ? new Date(new Date(s.startDate).getTime() + (parseInt(s.duration) || 4) * 7 * 86400000)
      : null;

    if (enrollD > today) {
      // 등록일이 미래 → 아직 입학 전 대기
      s.status = 'waiting';
    } else if (endStudyDate && today > endStudyDate) {
      s.status = 'completed';
    } else {
      // 등록일 도래 + 어드민 승인 → 재학생 전환
      s.status = 'current';
    }
  } else {
    // enrollDate 없으면 기존 arrivalDate 기준 fallback
    const arrDate = s.arrivalDate ? new Date(s.arrivalDate) : today;
    const endDate = s.startDate
      ? new Date(new Date(s.startDate).getTime() + (parseInt(s.duration) || 4) * 7 * 86400000)
      : today;
    s.status = today < arrDate ? 'waiting' : today <= endDate ? 'current' : 'completed';
  }

  const agencyStd = MOCK_AGENCY_STUDENTS.find(a => a.name.includes(s.name) || a.name.includes(s.nick));
  if (agencyStd) agencyStd.agencyStatus = s.status;

  const labels = { waiting: '입학 대기', current: '재학생', completed: '졸업' };
  const statusLabel = labels[s.status] || s.status;
  const enrollInfo = s.enrollDate ? ` (수강 등록일: ${s.enrollDate})` : '';

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[승인 완료] ${s.name} (${s.nick}) 학생의 B2B 송금이 확인되어 등록 상태가 [${statusLabel}]${enrollInfo}으로 전환되었습니다.`,
    type: 'success',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ ${s.name} 학생 승인 완료 → [${statusLabel}] 상태로 전환되었습니다.`, 'success');
  
  enhanceMockStudents();
  updateAdminKPIs();
  updateAgencyKPIs();
  initAdminInbox();
  initAgencyStudentList();
  if (typeof initAgencyRequestInbox === 'function') initAgencyRequestInbox();
  if (typeof initStudentList === 'function') initStudentList();

  // 상세 모달이 켜져있다면 정산 탭 즉시 리로드
  const detailModal = document.getElementById('student-detail-modal');
  if (detailModal && detailModal.classList.contains('active')) {
    switchAdetailTab('settle');
  }
}

function rejectAdminRemittance(id) {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  const reason = prompt("미납 처리 사유를 입력하십시오:");
  if (reason === null) return;

  s.remittanceStatus = 'unpaid';
  s.remittanceReceipt = null;

  // MOCK_REMIT_REQUESTS 내 해당 학생의 대기중인 송금 요청 반려 처리
  const req = MOCK_REMIT_REQUESTS.find(r => r.studentId === id && r.status === 'pending');
  if (req) {
    req.status = 'rejected';
    req.note = reason || '송금 미확인';
  }

  // s.remittanceHistory 내 대기중인 로컬 송금 영수증도 반려 처리
  if (s.remittanceHistory) {
    const localReq = s.remittanceHistory.find(r => r.status === 'pending');
    if (localReq) {
      localReq.status = 'rejected';
      localReq.memo = reason || '송금 미확인';
    }
  }

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[미납 처리] ${s.name} 학생의 입금 확인이 반려되었습니다. 사유: ${reason || '이체 확인 불가'}`,
    type: 'danger',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ ${s.name} 학생의 송금을 반려 처리하였습니다.`, 'warning');
  
  enhanceMockStudents();
  updateAdminKPIs();
  updateAgencyKPIs();
  initAdminInbox();
  initAgencyStudentList();
  if (typeof initAgencyRequestInbox === 'function') initAgencyRequestInbox();

  // 상세 모달이 켜져있다면 정산 탭 즉시 리로드
  const detailModal = document.getElementById('student-detail-modal');
  if (detailModal && detailModal.classList.contains('active')) {
    switchAdetailTab('settle');
  }
}

function confirmAdminChangeRequest(studentId, reqId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;

  const cr = s.changeRequests.find(r => r.id === reqId);
  if (!cr) return;

  cr.status = 'accepted';

  const oldVal = s[cr.field];
  s[cr.field] = cr.to;

  if (cr.field === 'nick') {
    MOCK_TIMETABLE.forEach(t => {
      t.slots.forEach(slot => {
        if (slot.student === oldVal) {
          slot.student = cr.to;
        }
      });
    });
    MOCK_DORM_ROOMS.forEach(room => {
      room.beds.forEach(bed => {
        if (bed.student && bed.student.includes(oldVal)) {
          bed.student = bed.student.replace(oldVal, cr.to);
        }
      });
    });
  }

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-08-' + Date.now(),
    text: `[변경 요청 승인] ${s.name} 학생의 ${cr.field} 항목 변경이 승인되었습니다. (${cr.from} ➔ ${cr.to})`,
    type: 'success',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ 변경 요청을 수락하여 학생 정보 및 연관 데이터가 즉시 갱신되었습니다.`, 'success');
  
  enhanceMockStudents();
  updateAdminKPIs();
  updateAgencyKPIs();
  initAdminInbox();
  initAgencyStudentList();
  if (typeof initStudentList === 'function') initStudentList();
  if (typeof initDormGantt === 'function') initDormGantt();
}

function rejectAdminChangeRequest(studentId, reqId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;

  const cr = s.changeRequests.find(r => r.id === reqId);
  if (!cr) return;

  const reason = prompt("변경 요청 거절 사유를 입력하십시오:");
  if (reason === null) return;

  cr.status = 'rejected';
  cr.rejectReason = reason || '학사 스케줄 조정 불가';

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-09-' + Date.now(),
    text: `[변경 요청 반려] ${s.name} 학생의 변경 요청이 반려되었습니다. 사유: ${cr.rejectReason}`,
    type: 'danger',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ 변경 요청을 반려 처리하였습니다.`, 'warning');
  
  initAdminInbox();
  initAgencyStudentList();
}

/* =============================================
   COURSE & PRICING
   ============================================= */
function initCoursePricing() {
  renderCourseList();
}

function renderCourseList() {
  const tbody = document.getElementById('course-list-body');
  if (!tbody) return;

  tbody.innerHTML = MOCK_COURSES.map((c, idx) => {
    // Map subject IDs back to master names with hours
    const subjectsBadge = (c.subjects || []).map(sObj => {
      const sub = MOCK_MASTER_SUBJECTS.find(m => m.id === sObj.id);
      const subName = sub ? sub.name : sObj.id;
      return `<span class="tsa-badge tsa-badge-outline" style="font-size:10px;margin-right:2px">${subName} (${sObj.hours}h)</span>`;
    }).join('');

    // Map level IDs back to master names
    const levelsBadge = (c.levels || [])
      .map(lvId => MOCK_MASTER_LEVELS.find(m => m.id === lvId))
      .filter(Boolean)
      .map(lv => `<span class="tsa-badge tsa-badge-gray" style="font-size:10px;margin-right:2px">${lv.name}</span>`)
      .join('');
    
    return `
      <tr>
        <td>
          <div style="font-weight:700;font-size:13px;color:#1A1D23">${c.name}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:2px">과목: ${subjectsBadge || '-'}</div>
        </td>
        <td><span class="tsa-badge tsa-badge-primary" style="font-size:10px">${c.type}</span></td>
        <td style="font-size:12px">
          <div>1:1 ${c.oneone}h / 그룹 ${c.group}h</div>
          <div style="font-size:10.5px;color:#9CA3AF;margin-top:2px">레벨: ${levelsBadge || '-'}</div>
        </td>
        <td style="font-weight:700;font-size:13px;color:#374151">$${c.fee.toLocaleString()}</td>
        <td><span class="tsa-badge ${c.active?'tsa-badge-success':'tsa-badge-gray'}">${c.active?'활성':'비활성'}</span></td>
        <td style="text-align:center">
          <div style="display:flex;gap:5px;justify-content:center">
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openEditCourseModal(${idx})">수정</button>
            <button class="tsa-btn tsa-btn-xs" style="background:#FEE2E2;color:#EF4444;border:none" onclick="deleteCourse(${idx})">삭제</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

let _editingCourseIdx = null;

function openCourseModal() {
  _editingCourseIdx = null;
  document.getElementById('course-modal-title').textContent = '신규 과정 및 커리큘럼 추가';
  document.getElementById('add-course-name').value = '';
  document.getElementById('add-course-type').value = '일반 영어';
  document.getElementById('add-course-fee').value = '';
  document.getElementById('add-course-oneone').value = '4';
  document.getElementById('add-course-group1on4').value = '2';
  document.getElementById('add-course-group').value = '1';

  renderCourseCheckboxes([], []);
  openModal('course-add-modal');
}

function openEditCourseModal(idx) {
  _editingCourseIdx = idx;
  const c = MOCK_COURSES[idx];
  if (!c) return;

  document.getElementById('course-modal-title').textContent = '과정 및 커리큘럼 정보 수정';
  document.getElementById('add-course-name').value = c.name;
  document.getElementById('add-course-type').value = c.type;
  document.getElementById('add-course-fee').value = c.fee;
  document.getElementById('add-course-oneone').value = c.oneone || '0';
  document.getElementById('add-course-group1on4').value = c.group1on4 || '0';
  document.getElementById('add-course-group').value = c.group || '0';

  renderCourseCheckboxes(c.subjects || [], c.levels || []);
  openModal('course-add-modal');
}

function renderCourseCheckboxes(selectedSubjects, selectedLevels) {
  const subContainer = document.getElementById('course-subject-checkboxes-container');
  if (subContainer) {
    subContainer.innerHTML = MOCK_MASTER_SUBJECTS.map(s => {
      const selected = selectedSubjects.find(x => x.id === s.id);
      const isChecked = selected ? 'checked' : '';
      const hours = selected ? selected.hours : 1;
      const displayHours = selected ? '' : 'display:none';
      return `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;flex:1;margin:0">
            <input type="checkbox" name="course-subjects-cb" value="${s.id}" ${isChecked} onchange="toggleSubjectHoursInput(this)"/>
            <span>${s.name} <span style="font-size:11px;color:#9CA3AF">(${s.type})</span></span>
          </label>
          <div id="hours-wrap-${s.id}" style="${displayHours};display:flex;align-items:center;gap:4px">
            <input type="number" id="hours-input-${s.id}" value="${hours}" min="1" max="8" style="width:50px;padding:2px 4px;border:1px solid #D1D5DB;border-radius:4px;font-size:12px;text-align:center"/>
            <span style="font-size:11px;color:#6B7280">시간</span>
          </div>
        </div>
      `;
    }).join('');
  }

  const lvContainer = document.getElementById('course-level-checkboxes-container');
  if (lvContainer) {
    lvContainer.innerHTML = MOCK_MASTER_LEVELS.map(l => {
      const isChecked = selectedLevels.includes(l.id) ? 'checked' : '';
      return `
        <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;margin:0">
          <input type="checkbox" name="course-levels-cb" value="${l.id}" ${isChecked}/>
          <span>${l.name}</span>
        </label>
      `;
    }).join('');
  }
}

function toggleSubjectHoursInput(checkbox) {
  const wrap = document.getElementById(`hours-wrap-${checkbox.value}`);
  if (wrap) {
    wrap.style.display = checkbox.checked ? 'flex' : 'none';
  }
}

function saveCourse() {
  const name = document.getElementById('add-course-name').value.trim();
  const type = document.getElementById('add-course-type').value;
  const fee = parseInt(document.getElementById('add-course-fee').value, 10) || 0;
  const oneone = parseInt(document.getElementById('add-course-oneone').value, 10) || 0;
  const group1on4 = parseInt(document.getElementById('add-course-group1on4').value, 10) || 0;
  const group = parseInt(document.getElementById('add-course-group').value, 10) || 0;

  if (!name) {
    showToast('과정명을 입력해주세요.', 'warning');
    return;
  }

  const subjects = [];
  document.querySelectorAll('input[name="course-subjects-cb"]:checked').forEach(cb => {
    const sId = cb.value;
    const hours = parseInt(document.getElementById(`hours-input-${sId}`).value, 10) || 1;
    subjects.push({ id: sId, hours: hours });
  });

  const levels = [];
  document.querySelectorAll('input[name="course-levels-cb"]:checked').forEach(cb => {
    levels.push(cb.value);
  });

  const courseData = {
    name, type, oneone, group1on4, group, fee,
    active: true, subjects, levels
  };

  if (_editingCourseIdx !== null) {
    MOCK_COURSES[_editingCourseIdx] = { ...MOCK_COURSES[_editingCourseIdx], ...courseData };
    showToast('과정 및 커리큘럼 정보가 수정되었습니다.', 'success');
  } else {
    MOCK_COURSES.push(courseData);
    showToast('신규 과정 및 커리큘럼이 추가되었습니다.', 'success');
  }

  closeModal('course-add-modal');
  renderCourseList();
}

function deleteCourse(idx) {
  if (!confirm('정말 이 과정을 삭제하시겠습니까?')) return;
  MOCK_COURSES.splice(idx, 1);
  showToast('과정이 삭제되었습니다.', 'success');
  renderCourseList();
}

// --- 과목 및 레벨 마스터 설정 CRUD 로직 ---
function renderMasterSettings() {
  MOCK_MASTER_SUBJECTS.sort((a, b) => (a.order || 0) - (b.order || 0));
  const subBody = document.getElementById('master-subject-list-body');
  if (subBody) {
    subBody.innerHTML = MOCK_MASTER_SUBJECTS.map((s, idx) => {
      const visibleBadge = s.visible !== false
        ? `<span class="tsa-badge tsa-badge-success" style="cursor:pointer" onclick="toggleMasterSubjectVisibility(${idx})">노출</span>`
        : `<span class="tsa-badge tsa-badge-danger" style="cursor:pointer" onclick="toggleMasterSubjectVisibility(${idx})">비노출</span>`;
      return `
      <tr draggable="true" data-subject-idx="${idx}"
          ondragstart="onSubjectRowDragStart(event, ${idx})"
          ondragover="onSubjectRowDragOver(event)"
          ondrop="onSubjectRowDrop(event, ${idx})"
          ondragend="onSubjectRowDragEnd(event)"
          style="cursor:grab">
        <td style="text-align:center;color:#9CA3AF"><i data-lucide="grip-vertical" style="width:14px;height:14px"></i></td>
        <td style="font-weight:700;color:#4B5563;font-size:12px">${s.order}</td>
        <td style="font-weight:600;font-size:12.5px">${s.name}</td>
        <td style="font-size:11.5px;color:#6B7280">${s.desc || '-'}</td>
        <td style="text-align:center">${visibleBadge}</td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openEditSubjectModal(${idx})">수정</button>
        </td>
      </tr>
    `;
    }).join('');
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  }

  const lvBody = document.getElementById('master-level-list-body');
  if (lvBody) {
    lvBody.innerHTML = MOCK_MASTER_LEVELS.map((l, idx) => {
      const visibleBadge = l.visible !== false
        ? `<span class="tsa-badge tsa-badge-success" style="cursor:pointer" onclick="toggleMasterLevelVisibility(${idx})">노출</span>`
        : `<span class="tsa-badge tsa-badge-danger" style="cursor:pointer" onclick="toggleMasterLevelVisibility(${idx})">비노출</span>`;
      return `
      <tr draggable="true" data-level-idx="${idx}"
          ondragstart="onLevelRowDragStart(event, ${idx})"
          ondragover="onLevelRowDragOver(event)"
          ondrop="onLevelRowDrop(event, ${idx})"
          ondragend="onLevelRowDragEnd(event)"
          style="cursor:grab">
        <td style="text-align:center;color:#9CA3AF"><i data-lucide="grip-vertical" style="width:14px;height:14px"></i></td>
        <td style="font-weight:700;color:#4B5563;font-size:12px">${l.order}</td>
        <td style="font-weight:600;font-size:12.5px">${l.name}</td>
        <td style="font-size:11.5px;color:#6B7280">${l.desc || '-'}</td>
        <td style="text-align:center">${visibleBadge}</td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openEditLevelModal(${idx})">수정</button>
        </td>
      </tr>
    `;
    }).join('');
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  }

  MOCK_MASTER_CLASS_TYPES.sort((a, b) => (a.order || 0) - (b.order || 0));
  const ctBody = document.getElementById('master-classtype-list-body');
  if (ctBody) {
    ctBody.innerHTML = MOCK_MASTER_CLASS_TYPES.map((c, idx) => {
      const visibleBadge = c.visible !== false
        ? `<span class="tsa-badge tsa-badge-success" style="cursor:pointer" onclick="toggleMasterClassTypeVisibility(${idx})">노출</span>`
        : `<span class="tsa-badge tsa-badge-danger" style="cursor:pointer" onclick="toggleMasterClassTypeVisibility(${idx})">비노출</span>`;
      return `
      <tr draggable="true" data-classtype-idx="${idx}"
          ondragstart="onClassTypeRowDragStart(event, ${idx})"
          ondragover="onClassTypeRowDragOver(event)"
          ondrop="onClassTypeRowDrop(event, ${idx})"
          ondragend="onClassTypeRowDragEnd(event)"
          style="cursor:grab">
        <td style="text-align:center;color:#9CA3AF"><i data-lucide="grip-vertical" style="width:14px;height:14px"></i></td>
        <td style="font-weight:700;color:#4B5563;font-size:12px">${c.order}</td>
        <td><span class="tsa-badge tsa-badge-outline" style="font-size:11px">${c.code}</span></td>
        <td style="font-weight:600;font-size:12.5px">${c.name}</td>
        <td style="text-align:center;font-size:12px">${c.maxStudents}명</td>
        <td style="font-size:11.5px;color:#6B7280">${c.desc || '-'}</td>
        <td style="text-align:center">${visibleBadge}</td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openEditClassTypeModal(${idx})">수정</button>
        </td>
      </tr>
    `;
    }).join('');
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  }
}

function toggleMasterClassTypeVisibility(idx) {
  const c = MOCK_MASTER_CLASS_TYPES[idx];
  if (!c) return;
  c.visible = c.visible === false ? true : false;
  renderMasterSettings();
  showToast(`✓ ${c.name} 수업 유형이 ${c.visible ? '노출' : '비노출'} 처리되었습니다.`, 'success');
}

let _classTypeDragSrcIdx = null;

function onClassTypeRowDragStart(ev, idx) {
  _classTypeDragSrcIdx = idx;
  ev.dataTransfer.effectAllowed = 'move';
  ev.currentTarget.style.opacity = '0.4';
}
function onClassTypeRowDragOver(ev) {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
}
function onClassTypeRowDrop(ev, targetIdx) {
  ev.preventDefault();
  if (_classTypeDragSrcIdx === null || _classTypeDragSrcIdx === targetIdx) return;
  const [moved] = MOCK_MASTER_CLASS_TYPES.splice(_classTypeDragSrcIdx, 1);
  MOCK_MASTER_CLASS_TYPES.splice(targetIdx, 0, moved);
  MOCK_MASTER_CLASS_TYPES.forEach((c, i) => { c.order = i + 1; });
  _classTypeDragSrcIdx = null;
  renderMasterSettings();
  showToast('✓ 수업 유형 우선순위가 변경되었습니다.', 'success');
}
function onClassTypeRowDragEnd(ev) {
  ev.currentTarget.style.opacity = '';
  _classTypeDragSrcIdx = null;
}

let _editingClassTypeIdx = null;

function openClassTypeModal() {
  _editingClassTypeIdx = null;
  document.getElementById('classtype-modal-title').textContent = '그룹 수업 유형 추가';
  document.getElementById('classtype-modal-id').value = '';
  document.getElementById('classtype-modal-code').value = '';
  document.getElementById('classtype-modal-name').value = '';
  document.getElementById('classtype-modal-max').value = '';
  document.getElementById('classtype-modal-desc').value = '';
  openModal('classtype-modal');
}

function openEditClassTypeModal(idx) {
  _editingClassTypeIdx = idx;
  const c = MOCK_MASTER_CLASS_TYPES[idx];
  if (!c) return;
  document.getElementById('classtype-modal-title').textContent = '그룹 수업 유형 수정';
  document.getElementById('classtype-modal-id').value = c.id;
  document.getElementById('classtype-modal-code').value = c.code;
  document.getElementById('classtype-modal-name').value = c.name;
  document.getElementById('classtype-modal-max').value = c.maxStudents;
  document.getElementById('classtype-modal-desc').value = c.desc || '';
  openModal('classtype-modal');
}

function saveMasterClassType() {
  const code = document.getElementById('classtype-modal-code').value.trim();
  const name = document.getElementById('classtype-modal-name').value.trim();
  const maxStudents = parseInt(document.getElementById('classtype-modal-max').value) || 1;
  const desc = document.getElementById('classtype-modal-desc').value.trim();

  if (!code || !name) {
    showToast('코드와 수업명을 입력하세요.', 'warning');
    return;
  }

  if (_editingClassTypeIdx !== null) {
    const c = MOCK_MASTER_CLASS_TYPES[_editingClassTypeIdx];
    c.code = code;
    c.name = name;
    c.maxStudents = maxStudents;
    c.desc = desc;
    showToast('수업 유형 정보가 수정되었습니다.', 'success');
  } else {
    const newId = 'CT_' + String(MOCK_MASTER_CLASS_TYPES.length + 1).padStart(2, '0');
    MOCK_MASTER_CLASS_TYPES.push({ id: newId, code, name, maxStudents, desc, order: MOCK_MASTER_CLASS_TYPES.length + 1, visible: true });
    showToast('신규 수업 유형이 추가되었습니다.', 'success');
  }

  closeModal('classtype-modal');
  renderMasterSettings();
}

function toggleMasterSubjectVisibility(idx) {
  const s = MOCK_MASTER_SUBJECTS[idx];
  if (!s) return;
  s.visible = s.visible === false ? true : false;
  renderMasterSettings();
  showToast(`✓ ${s.name} 과목이 ${s.visible ? '노출' : '비노출'} 처리되었습니다.`, 'success');
}

let _subjectDragSrcIdx = null;

function onSubjectRowDragStart(ev, idx) {
  _subjectDragSrcIdx = idx;
  ev.dataTransfer.effectAllowed = 'move';
  ev.currentTarget.style.opacity = '0.4';
}

function onSubjectRowDragOver(ev) {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
}

function onSubjectRowDrop(ev, targetIdx) {
  ev.preventDefault();
  if (_subjectDragSrcIdx === null || _subjectDragSrcIdx === targetIdx) return;
  const [moved] = MOCK_MASTER_SUBJECTS.splice(_subjectDragSrcIdx, 1);
  MOCK_MASTER_SUBJECTS.splice(targetIdx, 0, moved);
  MOCK_MASTER_SUBJECTS.forEach((s, i) => { s.order = i + 1; });
  _subjectDragSrcIdx = null;
  renderMasterSettings();
  showToast('✓ 과목 우선순위가 변경되었습니다.', 'success');
}

function onSubjectRowDragEnd(ev) {
  ev.currentTarget.style.opacity = '';
  _subjectDragSrcIdx = null;
}

function toggleMasterLevelVisibility(idx) {
  const l = MOCK_MASTER_LEVELS[idx];
  if (!l) return;
  l.visible = l.visible === false ? true : false;
  renderMasterSettings();
  showToast(`✓ ${l.name} 레벨이 ${l.visible ? '노출' : '비노출'} 처리되었습니다.`, 'success');
}

let _levelDragSrcIdx = null;

function onLevelRowDragStart(ev, idx) {
  _levelDragSrcIdx = idx;
  ev.dataTransfer.effectAllowed = 'move';
  ev.currentTarget.style.opacity = '0.4';
}

function onLevelRowDragOver(ev) {
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'move';
}

function onLevelRowDrop(ev, targetIdx) {
  ev.preventDefault();
  if (_levelDragSrcIdx === null || _levelDragSrcIdx === targetIdx) return;
  const [moved] = MOCK_MASTER_LEVELS.splice(_levelDragSrcIdx, 1);
  MOCK_MASTER_LEVELS.splice(targetIdx, 0, moved);
  MOCK_MASTER_LEVELS.forEach((l, i) => { l.order = i + 1; });
  _levelDragSrcIdx = null;
  renderMasterSettings();
  showToast('✓ 레벨 우선순위가 변경되었습니다.', 'success');
}

function onLevelRowDragEnd(ev) {
  ev.currentTarget.style.opacity = '';
  _levelDragSrcIdx = null;
}

let _editingSubjectIdx = null;
let _editingLevelIdx = null;

function openSubjectModal() {
  _editingSubjectIdx = null;
  document.getElementById('subject-modal-title').textContent = '마스터 과목 추가';
  document.getElementById('subject-modal-id').value = '';
  document.getElementById('subject-modal-name').value = '';
  document.getElementById('subject-modal-desc').value = '';
  openModal('subject-modal');
}

function openEditSubjectModal(idx) {
  _editingSubjectIdx = idx;
  const s = MOCK_MASTER_SUBJECTS[idx];
  if (!s) return;

  document.getElementById('subject-modal-title').textContent = '마스터 과목 수정';
  document.getElementById('subject-modal-id').value = s.id;
  document.getElementById('subject-modal-name').value = s.name;
  document.getElementById('subject-modal-desc').value = s.desc || '';
  openModal('subject-modal');
}

function saveMasterSubject() {
  const name = document.getElementById('subject-modal-name').value.trim();
  const desc = document.getElementById('subject-modal-desc').value.trim();

  if (!name) {
    showToast('과목명을 입력하세요.', 'warning');
    return;
  }

  if (_editingSubjectIdx !== null) {
    const s = MOCK_MASTER_SUBJECTS[_editingSubjectIdx];
    s.name = name;
    s.desc = desc;
    showToast('과목 정보가 수정되었습니다.', 'success');
  } else {
    const newId = 'SUB_' + String(MOCK_MASTER_SUBJECTS.length + 1).padStart(2, '0');
    MOCK_MASTER_SUBJECTS.push({ id: newId, name, desc, order: MOCK_MASTER_SUBJECTS.length + 1, visible: true });
    showToast('신규 마스터 과목이 추가되었습니다.', 'success');
  }

  closeModal('subject-modal');
  renderMasterSettings();
}

function deleteMasterSubject(idx) {
  const s = MOCK_MASTER_SUBJECTS[idx];
  if (!confirm(`과목 [${s.name}]을 마스터 풀에서 삭제하시겠습니까? 이 과목이 할당된 기존 과정에서도 해제될 수 있습니다.`)) return;
  MOCK_MASTER_SUBJECTS.splice(idx, 1);
  showToast('과목이 삭제되었습니다.', 'success');
  renderMasterSettings();
}

function openLevelModal() {
  _editingLevelIdx = null;
  document.getElementById('level-modal-title').textContent = '마스터 레벨 추가';
  document.getElementById('level-modal-id').value = '';
  document.getElementById('level-modal-name').value = '';
  document.getElementById('level-modal-order').value = MOCK_MASTER_LEVELS.length + 1;
  document.getElementById('level-modal-desc').value = '';
  openModal('level-modal');
}

function openEditLevelModal(idx) {
  _editingLevelIdx = idx;
  const l = MOCK_MASTER_LEVELS[idx];
  if (!l) return;

  document.getElementById('level-modal-title').textContent = '마스터 레벨 수정';
  document.getElementById('level-modal-id').value = l.id;
  document.getElementById('level-modal-name').value = l.name;
  document.getElementById('level-modal-order').value = l.order;
  document.getElementById('level-modal-desc').value = l.desc || '';
  openModal('level-modal');
}

function saveMasterLevel() {
  const name = document.getElementById('level-modal-name').value.trim();
  const order = parseInt(document.getElementById('level-modal-order').value, 10) || 1;
  const desc = document.getElementById('level-modal-desc').value.trim();

  if (!name) {
    showToast('레벨명을 입력하세요.', 'warning');
    return;
  }

  if (_editingLevelIdx !== null) {
    const l = MOCK_MASTER_LEVELS[_editingLevelIdx];
    l.name = name;
    l.order = order;
    l.desc = desc;
    showToast('레벨 정보가 수정되었습니다.', 'success');
  } else {
    const newId = 'LV_' + String(MOCK_MASTER_LEVELS.length + 1).padStart(2, '0');
    MOCK_MASTER_LEVELS.push({ id: newId, name, order, desc });
    showToast('신규 마스터 레벨이 추가되었습니다.', 'success');
  }

  closeModal('level-modal');
  renderMasterSettings();
}

function deleteMasterLevel(idx) {
  const l = MOCK_MASTER_LEVELS[idx];
  if (!confirm(`레벨 [${l.name}]을 마스터 풀에서 삭제하시겠습니까?`)) return;
  MOCK_MASTER_LEVELS.splice(idx, 1);
  showToast('레벨이 삭제되었습니다.', 'success');
  renderMasterSettings();
}

function createNewBranch() {
  const name = document.getElementById('new-branch-name').value.trim();
  const code = document.getElementById('new-branch-code').value.trim();
  const currency = document.getElementById('new-branch-currency').value;

  if (!name || !code) { showToast('지점명과 코드를 모두 입력하세요', 'danger'); return; }

  const log = document.getElementById('branch-creation-log');
  log.style.display = 'block';
  log.innerHTML = `
    ✅ 지점 생성 완료<br>
    · 지점명: <strong>${name}</strong><br>
    · 라우팅 코드: <strong>/${code}/admin/...</strong><br>
    · 기준 통화: <strong>${currency}</strong><br>
    · 어드민 계정, 사이드바 메뉴, 데이터 격리 자동 생성 완료
  `;
  showToast(`신규 지점 "${name}" 생성 완료 — 라우팅: /${code}/admin/`, 'success');
}

