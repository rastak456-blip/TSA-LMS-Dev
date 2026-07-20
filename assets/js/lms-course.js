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
      s.requiredFiles = {};
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

  const commission = calculateAgencyItemCommissionTotal(s, {
    registration: regFee,
    education: tuitionFee,
    dorm: dormFee,
    local: 0,
  });
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

function openRemitRequestModal()  { alert('송금 명세서 제출 모달 (추후 구현 예정)'); }
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
  const avatarSrc = s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
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
      <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:10px">💰 어학원 송금 금액 내역</div>
      <div style="display:flex;flex-direction:column;gap:5px;font-size:12px">
        <div style="display:flex;justify-content:space-between"><span style="color:#6B7280">청구 금액 합계</span><span style="font-weight:600">$${prices.gross.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#4F46E5">에이전시 커미션 차감 (20%)</span><span style="font-weight:600;color:#4F46E5">- $${prices.commission.toLocaleString()}</span></div>
        <div style="display:flex;justify-content:space-between"><span style="color:#059669">해외 이체 수수료 (본인 부담)</span><span style="font-weight:600;color:#059669">+ $${prices.remitFee}</span></div>
        <div style="display:flex;justify-content:space-between;border-top:1.5px dashed #818CF8;padding-top:7px;margin-top:3px">
          <span style="font-size:13px;font-weight:700;color:#1E1B4B">어학원 송금액</span>
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
    showToast('⚠ 송금 명세서 파일을 첨부해 주세요.', 'danger');
    return;
  }

  const memoEl = document.getElementById('remit-modal-memo');
  s.remittanceStatus = 'paid';
  s.remittanceReceipt = remitModalFile;
  s.remittanceDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
  s.remittanceMemo = memoEl ? memoEl.value.trim() : (s.remittanceMemo || '');

  closeModal('modal-remit-submit');
  showToast(`✓ ${s.name} 학생의 송금 명세서가 제출되어 완납 처리되었습니다.`, 'success');

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

    const avatarSrc = s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
    const latestEnrollment = Array.isArray(s.enrollments) && s.enrollments.length ? s.enrollments[0] : null;
    const remittanceRoute = s.remittanceRoute || latestEnrollment?.remittanceRoute || 'agency';
    const remittanceRouteLabel = getRemittanceRouteLabel(remittanceRoute);

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
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openStudentDetailPopup(${s.id},'agency')">
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

function getRemittanceRouteLabel(route) {
  return {
    agency: '에이전시',
    direct: '직접 송금',
    onsite: '현장 결제',
  }[route] || '에이전시';
}

function renderRemittanceRouteOptions(route = 'agency') {
  const current = route || 'agency';
  return [
    ['agency', '에이전시'],
    ['direct', '직접 송금'],
    ['onsite', '현장 결제'],
  ].map(([value, label]) => `<option value="${value}" ${current === value ? 'selected' : ''}>${label}</option>`).join('');
}

function updateStudentRemittanceRoute(studentId, route, source = '상세') {
  const student = MOCK_STUDENTS.find(row => row.id === Number(studentId));
  if (!student || !['agency', 'direct', 'onsite'].includes(route)) return;

  const previousRoute = student.remittanceRoute || student.enrollments?.[0]?.remittanceRoute || 'agency';
  student.remittanceRoute = route;

  if (source === '상세' && typeof getSelectedStudentEnrollment === 'function') {
    const enrollment = getSelectedStudentEnrollment(student);
    if (enrollment) enrollment.remittanceRoute = route;
  } else if (Array.isArray(student.enrollments) && student.enrollments[0]) {
    student.enrollments[0].remittanceRoute = route;
  }

  if (previousRoute !== route) {
    if (!student.changeRequests) student.changeRequests = [];
    student.changeRequests.push({
      id: Date.now() + Math.random(),
      field: '송금 경로',
      from: getRemittanceRouteLabel(previousRoute),
      to: getRemittanceRouteLabel(route),
      reason: `${source}에서 직접 변경`,
      changedBy: APP.user === 'agency_head' ? '에이전시 본사' : APP.user === 'agency_branch' ? '에이전시 지사' : '관리자',
      requestDate: new Date().toISOString().substring(0, 10),
    });
    showToast(`송금 경로가 '${getRemittanceRouteLabel(route)}'(으)로 변경되었습니다.`, 'success');
  }

  initAgencyStudentList();
}

function initAgencyStudentList() {
  initAgencyStudentDB();
  if (!APP._agencyStatusFilter) APP._agencyStatusFilter = 'all';
  renderAgencyStatusCards();

  const tbody = document.getElementById('agency-student-history-body');
  if (!tbody) return;

  let list = MOCK_STUDENTS.filter(s => s.agency === '한국 영어마을');

  const natSel = document.getElementById('filter-agency-nationality');
  if (natSel && natSel.options.length <= 1) {
    const nats = [...new Set(list.map(s => s.nationality).filter(Boolean))].sort();
    nats.forEach(n => {
      const opt = document.createElement('option');
      opt.value = n; opt.textContent = n;
      natSel.appendChild(opt);
    });
  }

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

  const nationalityFilter = document.getElementById('filter-agency-nationality').value;
  if (nationalityFilter !== 'all') {
    list = list.filter(s => s.nationality === nationalityFilter);
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
    const billingBreakdown = getStudentBillingBreakdown(s);
    const billingMap = Object.fromEntries(billingBreakdown.items.map(item => [item.key, item]));

    let state = '입학 대기';
    let badgeClass = 'tsa-badge-warning';
    if (s.status === 'completed') { state = '졸업'; badgeClass = 'tsa-badge-gray'; }
    else if (s.status === 'resigned') { state = '퇴원'; badgeClass = 'tsa-badge-danger'; }
    else if (s.status === 'current') { state = '재학'; badgeClass = 'tsa-badge-success'; }
    else if (s.status === 'extended') { state = '연장'; badgeClass = 'tsa-badge-primary'; }

    const avatarSrc = s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
    const latestEnrollment = Array.isArray(s.enrollments) && s.enrollments.length ? s.enrollments[0] : null;
    const remittanceRoute = s.remittanceRoute || latestEnrollment?.remittanceRoute || 'agency';
    const courseWeeks = (s.startDate && s.endDate)
      ? Math.max(1, Math.round((new Date(s.endDate) - new Date(s.startDate)) / (7 * 86400000)))
      : (s.duration || null);

    let teacherName = '미배정';
    const tMatch = MOCK_TIMETABLE.find(t => t.slots.some(slot => slot.student === s.nick));
    if (tMatch) teacherName = tMatch.teacher;

    return `
      <tr>
        <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${rowNum}</td>
        <td>
          <div style="display:flex;align-items:center;gap:7px">
            <img src="${avatarSrc}" style="width:30px;height:30px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;" alt=""/>
            <div>
              <div style="font-weight:600;font-size:13px">${s.name}</div>
              <div style="font-size:10.5px;color:#6B7280">Nick: ${s.nick} &nbsp;·&nbsp; ${s.gender}성 ${s.age}세 &nbsp;·&nbsp; ${s.nationality || '-'}</div>
              <div style="font-size:10.5px;color:#9CA3AF">${maskPassportNumber(s.passportNum)}</div>
            </div>
          </div>
        </td>
        <td style="font-size:11.5px;line-height:1.55;white-space:nowrap">
          <div style="font-weight:700;color:#374151">${s.course}</div>
          <div style="color:#6B7280;margin-top:3px">${fmtDate(s.startDate) || '-'} ~ ${fmtDate(s.endDate) || '-'}${courseWeeks ? ` <span style="color:#9CA3AF">(${courseWeeks}주)</span>` : ''}</div>
        </td>
        <td style="font-size:11px;white-space:nowrap;min-width:112px">
          <select class="tsa-input" aria-label="${s.name} 송금 경로" style="height:32px;min-width:100px;padding:4px 28px 4px 9px;background:#fff;font-size:11px;font-weight:700;color:#4338CA" onchange="updateStudentRemittanceRoute(${s.id}, this.value, '학생 관리')">
            ${renderRemittanceRouteOptions(remittanceRoute)}
          </select>
        </td>
        <td class="col-dorm" style="font-size:11.5px;line-height:1.55">${(() => {
          const req = MOCK_DORM_BOOK_REQUESTS.find(r => r.studentId === s.id || r.studentName === s.name || r.studentName === s.nick);
          const dormIn = s.dormIn || s.startDate || '';
          const dormOut = s.dormOut || s.endDate || '';
          const periodHtml = dormIn || dormOut
            ? `<div style="color:#6B7280;margin-top:3px">${fmtDate(dormIn) || '-'} ~ ${fmtDate(dormOut) || '-'}</div>`
            : `<div style="color:#D1D5DB;margin-top:3px">기간 미정</div>`;
          if (req) return `<div style="font-weight:700;color:#374151">${req.roomType}</div>${req.genderPref && req.genderPref !== '전체' ? `<div style="font-size:10.5px;color:#9CA3AF">${req.genderPref} 희망</div>` : ''}${periodHtml}`;
          if (s.dormAccomType || s.dormType) {
            const parts = [s.dormAccomType, s.dormType, s.dormGrade].filter(Boolean);
            return `<div style="font-weight:700;color:#374151">${parts.join(' · ')}</div>${periodHtml}`;
          }
          return `<div style="color:#D1D5DB">-</div>${periodHtml}`;
        })()}</td>
        <td>${renderAgencyBillingCompactCell(billingMap.registration)}</td>
        <td>${renderAgencyBillingCompactCell(billingMap.education)}</td>
        <td>${renderAgencyBillingCompactCell(billingMap.dorm)}</td>
        <td>${renderAgencyBillingCompactCell(billingMap.local)}</td>
        <td style="min-width:160px;padding:8px 12px">
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;color:#6B7280"><span>어학원 송금</span><strong style="color:#059669">$${billingBreakdown.net.toLocaleString()}</strong></div>
          <div style="display:flex;justify-content:space-between;gap:12px;font-size:10.5px;color:#6B7280;margin-top:4px"><span>커미션</span><strong style="color:#4F46E5">$${billingBreakdown.commission.toLocaleString()}</strong></div>
          <div style="display:flex;justify-content:space-between;gap:12px;border-top:1px solid #E5E7EB;margin-top:5px;padding-top:5px;font-size:11px"><span style="font-weight:700;color:#374151">합산 청구액</span><strong style="font-size:12px;color:#111827">$${billingBreakdown.gross.toLocaleString()}</strong></div>
        </td>
        <td class="col-flight" style="font-size:11px;line-height:1.8">
          <div><span style="color:#6B7280;font-size:10px">입국</span> ${fmtFlightStr(s.flightInfo) || '-'}</div>
          <div><span style="color:#6B7280;font-size:10px">출국</span> ${fmtFlightStr(s.flightOutInfo) || fmtDate(s.departureDate) || '-'}</div>
        </td>
        <td><span class="tsa-badge ${badgeClass}">${state}</span></td>
        <td style="text-align:center">
          <div class="agency-student-actions">
            <button class="tsa-btn tsa-btn-primary tsa-btn-xs" onclick="openStudentCourseRegistration(${s.id})">등록</button>
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" style="color:#5E5CE6;border-color:#5E5CE6" onclick="openStudentDetailPopup(${s.id},'agency')">상세</button>
            ${s.status === 'waiting'
              ? `<button class="tsa-btn tsa-btn-xs" disabled style="background:#F3F4F6;color:#D1D5DB;border:1px solid #E5E7EB;cursor:not-allowed" title="입학 대기 상태에서는 서류 출력 불가">서류</button>`
              : `<button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openAgencyDocumentsInline(${s.id})">서류</button>`}
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

const COURSE_REG_PERIODS = [1, 2, 3, 4, 8, 12, 16, 20, 24];

function formatCourseRegMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function getCourseRegPeriodFee(baseAmount, policy, weeks) {
  const base = Number(baseAmount || 0);
  if (typeof calculateManagedTuitionFee === 'function') return calculateManagedTuitionFee(base, weeks);
  if (weeks === 4) return Math.round(base / 10) * 10;
  const key = `fee${weeks}`;
  return Number(policy?.[key] || Math.round((base * (weeks / 4)) / 10) * 10);
}

function getCourseRegSelectedCourse() {
  const courseName = document.getElementById('course-reg-course')?.value || '';
  return (typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES : []).find(c => c.name === courseName) || null;
}

function getCourseRegActiveCourses() {
  const courses = typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES : [];
  return courses
    .map((course, index) => ({ course, index }))
    .filter(row => row.course.active !== false);
}

function getCourseRegRecommendedLevels(course) {
  if (!course || typeof MOCK_MASTER_LEVELS === 'undefined') return [];
  return (course.levels || [])
    .map(levelId => MOCK_MASTER_LEVELS.find(level => level.id === levelId && level.visible !== false))
    .filter(Boolean);
}

function renderCourseRegRecommendedLevels(course) {
  const target = document.getElementById('course-reg-recommended-levels');
  if (!target) return;
  const levels = getCourseRegRecommendedLevels(course);
  target.innerHTML = levels.length
    ? levels.map(level => `<span class="tsa-badge tsa-badge-gray" style="font-size:11px;padding:5px 8px">${level.name}</span>`).join('')
    : `<span style="font-size:11.5px;color:#9CA3AF">추천 레벨이 설정되지 않았습니다.</span>`;
}

function calculateCourseRegSegmentEndDate(startDate, weeks) {
  if (!startDate) return '';
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(weeks || 0) * 7 - 1);
  return date.toISOString().split('T')[0];
}

function updateCourseRegSegmentEndPreview() {
  const startDate = document.getElementById('course-reg-start')?.value || '';
  const duration = parseInt(document.getElementById('course-reg-duration')?.value, 10) || 0;
  const endEl = document.getElementById('course-reg-end');
  if (!endEl) return;
  endEl.value = startDate && COURSE_REG_PERIODS.includes(duration)
    ? calculateCourseRegSegmentEndDate(startDate, duration)
    : '';
}

function getCourseRegMode() {
  return document.getElementById('course-reg-mode')?.value || '';
}

function updateCourseRegModeUI() {
  const mode = getCourseRegMode();
  const flow = document.getElementById('course-reg-flow-content');
  const action = document.getElementById('course-reg-segment-action');
  const help = document.getElementById('course-reg-mode-help');
  if (flow) flow.style.display = mode ? 'grid' : 'none';
  if (action) action.style.display = mode === 'multi' ? 'flex' : 'none';
  if (help) help.textContent = mode === 'single'
    ? '요금표에서 과정과 기간을 선택하면 단일 수강 구간으로 즉시 적용돼.'
    : mode === 'multi'
    ? '요금표에서 과정과 기간을 선택한 뒤 구간을 추가해 여러 코스를 연속 등록해.'
    : '수강 형태를 먼저 선택해줘.';

  ['single', 'multi'].forEach(value => {
    const button = document.getElementById(`course-reg-mode-${value}`);
    if (!button) return;
    const active = mode === value;
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.style.borderColor = active ? '#4F46E5' : '#DDE3EC';
    button.style.background = active ? '#EEF2FF' : '#fff';
    button.style.boxShadow = active ? '0 0 0 2px rgba(79,70,229,.12)' : 'none';
  });
}

function resetCourseRegCourseSelection() {
  APP.courseRegSegments = [];
  const courseEl = document.getElementById('course-reg-course');
  const durationEl = document.getElementById('course-reg-duration');
  const startEl = document.getElementById('course-reg-start');
  const endEl = document.getElementById('course-reg-end');
  if (courseEl) courseEl.value = '';
  if (durationEl) durationEl.value = '';
  if (startEl) startEl.value = '';
  if (endEl) endEl.value = '';
  renderCourseRegSegments();
}

function setCourseRegMode(mode) {
  if (!['single', 'multi'].includes(mode)) return;
  const modeEl = document.getElementById('course-reg-mode');
  const currentMode = modeEl?.value || '';
  const hasSelection = getCourseRegSegments().length > 0
    || Boolean(document.getElementById('course-reg-course')?.value)
    || Boolean(document.getElementById('course-reg-start')?.value);
  if (currentMode && currentMode !== mode && hasSelection
    && !window.confirm('수강 형태를 변경하면 현재 선택한 수강 구간이 초기화돼. 변경할까?')) return;
  if (currentMode !== mode) resetCourseRegCourseSelection();
  if (modeEl) modeEl.value = mode;
  updateCourseRegModeUI();
  updateStudentCourseRegistrationPreview();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function applySingleCourseRegSegment() {
  if (getCourseRegMode() !== 'single') return;
  const course = getCourseRegSelectedCourse();
  const duration = parseInt(document.getElementById('course-reg-duration')?.value, 10) || 0;
  const startDate = document.getElementById('course-reg-start')?.value || '';
  if (!course || !startDate || !COURSE_REG_PERIODS.includes(duration)) {
    APP.courseRegSegments = [];
    renderCourseRegSegments();
    return;
  }
  APP.courseRegSegments = [{
    id: Date.now(),
    order: 1,
    course: course.name,
    courseType: course.type || '',
    recommendedLevels: getCourseRegRecommendedLevels(course).map(level => level.name),
    duration,
    startDate,
    endDate: calculateCourseRegSegmentEndDate(startDate, duration),
    tuitionAmount: getCourseRegPeriodFee(course.fee, course.tuitionPolicy, duration),
  }];
  renderCourseRegSegments();
}

function handleCourseRegStartChange() {
  updateCourseRegSegmentEndPreview();
  applySingleCourseRegSegment();
  updateCourseRegDormDatesFromStart();
  updateStudentCourseRegistrationPreview();
}

function getNextCourseRegSegmentStart(endDate) {
  if (!endDate) return '';
  const date = new Date(`${endDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().split('T')[0];
}

function getCourseRegSegments() {
  return Array.isArray(APP.courseRegSegments) ? APP.courseRegSegments : [];
}

function renderCourseRegSegments() {
  const target = document.getElementById('course-reg-segment-list');
  const totalEl = document.getElementById('course-reg-segment-total');
  const segments = getCourseRegSegments();
  const totalWeeks = segments.reduce((sum, segment) => sum + Number(segment.duration || 0), 0);
  const totalAmount = segments.reduce((sum, segment) => sum + Number(segment.tuitionAmount || 0), 0);
  if (totalEl) totalEl.textContent = `${segments.length}개 구간 · 총 ${totalWeeks}주 · ${formatCourseRegMoney(totalAmount)}`;
  if (!target) return;
  if (!segments.length) {
    target.innerHTML = `<div style="padding:16px;text-align:center;color:#9CA3AF;font-size:11.5px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:10px">과정과 기간을 선택한 뒤 수강 구간을 추가해줘.</div>`;
    return;
  }
  target.innerHTML = segments.map((segment, index) => `
    <div style="display:grid;grid-template-columns:34px minmax(0,1fr) 110px 150px 88px;gap:10px;align-items:center;padding:10px 12px;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
      <div style="width:26px;height:26px;border-radius:50%;background:#EEF2FF;color:#4338CA;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900">${index + 1}</div>
      <div>
        <div style="font-size:12.5px;font-weight:800;color:#111827">${segment.course}</div>
        <div style="font-size:10px;color:#6B7280;margin-top:3px">추천 레벨: ${segment.recommendedLevels.length ? segment.recommendedLevels.join(', ') : '-'}</div>
      </div>
      <div style="font-size:11.5px;font-weight:800;color:#374151">${segment.duration}주</div>
      <div style="font-size:10.5px;color:#6B7280">${fmtDate(segment.startDate)} ~ ${fmtDate(segment.endDate)}</div>
      <div style="text-align:right">
        <div style="font-size:12.5px;font-weight:900;color:#111827">${formatCourseRegMoney(segment.tuitionAmount)}</div>
        <button type="button" onclick="removeCourseRegSegment(${index})" style="margin-top:3px;border:0;background:none;color:#EF4444;font-size:10px;cursor:pointer">삭제</button>
      </div>
    </div>
  `).join('');
}

function addCourseRegSegment() {
  if (getCourseRegMode() !== 'multi') {
    showToast('멀티 코스 진행에서만 수강 구간을 추가할 수 있어.', 'warning');
    return;
  }
  const course = getCourseRegSelectedCourse();
  const duration = parseInt(document.getElementById('course-reg-duration')?.value, 10) || 0;
  const startDate = document.getElementById('course-reg-start')?.value || '';
  if (!course || !startDate || !COURSE_REG_PERIODS.includes(duration)) {
    showToast('위 금액표에서 과정과 수강 기간을 선택하고 구간 시작일을 확인해줘.', 'warning');
    return;
  }
  const existingSegments = getCourseRegSegments();
  const previousSegment = existingSegments[existingSegments.length - 1];
  if (previousSegment && startDate <= previousSegment.endDate) {
    showToast('다음 수강 구간은 이전 구간 종료일 이후에 시작해야 해.', 'warning');
    return;
  }
  const recommendedLevels = getCourseRegRecommendedLevels(course).map(level => level.name);
  const endDate = calculateCourseRegSegmentEndDate(startDate, duration);
  if (!Array.isArray(APP.courseRegSegments)) APP.courseRegSegments = [];
  APP.courseRegSegments.push({
    id: Date.now(),
    order: APP.courseRegSegments.length + 1,
    course: course.name,
    courseType: course.type || '',
    recommendedLevels,
    duration,
    startDate,
    endDate,
    tuitionAmount: getCourseRegPeriodFee(course.fee, course.tuitionPolicy, duration),
  });
  const nextStart = getNextCourseRegSegmentStart(endDate);
  const startEl = document.getElementById('course-reg-start');
  if (startEl) startEl.value = nextStart;
  const courseEl = document.getElementById('course-reg-course');
  const durationEl = document.getElementById('course-reg-duration');
  if (courseEl) courseEl.value = '';
  if (durationEl) durationEl.value = '';
  updateCourseRegSegmentEndPreview();
  const totalWeeks = APP.courseRegSegments.reduce((sum, segment) => sum + Number(segment.duration || 0), 0);
  const dormDurationEl = document.getElementById('course-reg-dorm-duration');
  if (dormDurationEl) dormDurationEl.value = String(totalWeeks);
  updateCourseRegDormDatesFromStart(true);
  renderCourseRegSegments();
  updateStudentCourseRegistrationPreview();
  showToast('수강 구간을 추가했어. 다음 시작일 기준으로 다른 과정과 기간을 비교해 선택할 수 있어.', 'success');
}

function removeCourseRegSegment(index) {
  if (!Array.isArray(APP.courseRegSegments)) return;
  APP.courseRegSegments.splice(index, 1);
  if (getCourseRegMode() === 'single') {
    const courseEl = document.getElementById('course-reg-course');
    const durationEl = document.getElementById('course-reg-duration');
    const endEl = document.getElementById('course-reg-end');
    if (courseEl) courseEl.value = '';
    if (durationEl) durationEl.value = '';
    if (endEl) endEl.value = '';
    renderCourseRegSegments();
    updateStudentCourseRegistrationPreview();
    return;
  }
  APP.courseRegSegments.forEach((segment, segmentIndex) => { segment.order = segmentIndex + 1; });
  const totalWeeks = APP.courseRegSegments.reduce((sum, segment) => sum + Number(segment.duration || 0), 0);
  const dormDurationEl = document.getElementById('course-reg-dorm-duration');
  if (dormDurationEl && totalWeeks) dormDurationEl.value = String(totalWeeks);
  const lastSegment = APP.courseRegSegments[APP.courseRegSegments.length - 1];
  const startEl = document.getElementById('course-reg-start');
  if (startEl && lastSegment) startEl.value = getNextCourseRegSegmentStart(lastSegment.endDate);
  updateCourseRegSegmentEndPreview();
  renderCourseRegSegments();
  updateStudentCourseRegistrationPreview();
}

function selectCourseRegOption(courseIndex, weeks) {
  const startDate = document.getElementById('course-reg-start')?.value || '';
  if (!startDate) {
    showToast('수강 시작일을 먼저 선택해줘.', 'warning');
    document.getElementById('course-reg-start')?.focus();
    return;
  }
  const course = typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES[courseIndex] : null;
  if (!course || course.active === false || !COURSE_REG_PERIODS.includes(Number(weeks))) return;

  const courseEl = document.getElementById('course-reg-course');
  const durationEl = document.getElementById('course-reg-duration');
  if (courseEl) courseEl.value = course.name;
  if (durationEl) durationEl.value = String(weeks);

  updateCourseRegSegmentEndPreview();
  applySingleCourseRegSegment();
  syncCourseRegDormDuration();
  updateCourseRegDormDatesFromStart(true);
  updateStudentCourseRegistrationPreview();
}

function renderCourseRegCourseComparison() {
  const target = document.getElementById('course-reg-course-compare-table');
  if (!target) return;

  const rows = getCourseRegActiveCourses();
  const selectedCourse = getCourseRegSelectedCourse();
  const selectedWeeks = parseInt(document.getElementById('course-reg-duration')?.value, 10) || 0;
  const hasStartDate = Boolean(document.getElementById('course-reg-start')?.value);
  const summary = document.getElementById('course-reg-selection-summary');

  if (!rows.length) {
    target.innerHTML = `<div style="padding:18px;text-align:center;color:#9CA3AF;font-size:12px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:10px">현재 등록 가능한 과정이 없습니다.</div>`;
    if (summary) summary.textContent = '등록 가능 과정 없음';
    return;
  }

  const selectedAmount = selectedCourse && selectedWeeks
    ? getCourseRegPeriodFee(selectedCourse.fee, selectedCourse.tuitionPolicy, selectedWeeks)
    : 0;
  if (summary) {
    summary.textContent = !hasStartDate
      ? '시작일 먼저 선택'
      : selectedCourse && selectedWeeks
      ? `${selectedCourse.name} · ${selectedWeeks}주 · ${formatCourseRegMoney(selectedAmount)}`
      : '과정과 기간을 선택해줘';
  }

  target.innerHTML = `
    <div style="min-width:1080px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden">
      <div style="display:grid;grid-template-columns:180px repeat(${COURSE_REG_PERIODS.length},minmax(96px,1fr));background:#F8FAFC;border-bottom:1px solid #E5E7EB">
        <div style="padding:9px 12px;font-size:11px;font-weight:800;color:#4B5563">과정명</div>
        ${COURSE_REG_PERIODS.map(weeks => `
          <div style="padding:9px 6px;text-align:center;font-size:11px;font-weight:800;color:${selectedWeeks && weeks === selectedWeeks ? '#4338CA' : '#4B5563'};background:${selectedWeeks && weeks === selectedWeeks ? '#EEF2FF' : 'transparent'}">${weeks}주</div>
        `).join('')}
      </div>
      ${rows.map(({ course, index }, rowIndex) => `
        <div style="display:grid;grid-template-columns:180px repeat(${COURSE_REG_PERIODS.length},minmax(96px,1fr));border-bottom:${rowIndex === rows.length - 1 ? '0' : '1px solid #EEF0F4'};background:#fff">
          <div style="padding:10px 12px;display:flex;flex-direction:column;justify-content:center;background:${selectedCourse?.name === course.name ? '#F8FAFF' : '#fff'}">
            <b style="font-size:12px;color:#111827">${course.name}</b>
            <span style="font-size:10px;color:#9CA3AF;margin-top:2px">${course.type || '과정'}</span>
          </div>
          ${COURSE_REG_PERIODS.map(weeks => {
            const active = hasStartDate && selectedCourse?.name === course.name && weeks === selectedWeeks;
            const amount = getCourseRegPeriodFee(course.fee, course.tuitionPolicy, weeks);
            return `
              <button type="button" onclick="selectCourseRegOption(${index}, ${weeks})" aria-pressed="${active}" ${hasStartDate ? '' : 'disabled'} style="min-height:54px;padding:7px 5px;border:0;border-left:1px solid #EEF0F4;background:${active ? '#4F46E5' : hasStartDate ? '#fff' : '#F9FAFB'};color:${active ? '#fff' : hasStartDate ? '#111827' : '#9CA3AF'};cursor:${hasStartDate ? 'pointer' : 'not-allowed'};font-family:inherit;opacity:${hasStartDate ? '1' : '.72'}">
                <span style="display:block;font-size:12px;font-weight:900">${formatCourseRegMoney(amount)}</span>
                <span style="display:block;font-size:9.5px;font-weight:700;margin-top:2px;color:${active ? '#E0E7FF' : '#9CA3AF'}">${active ? '선택됨' : hasStartDate ? '선택' : '시작일 먼저'}</span>
              </button>
            `;
          }).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function getCourseRegSelectedDormTemplate() {
  const raw = document.getElementById('course-reg-dorm-template')?.value;
  const idx = parseInt(raw, 10);
  const templates = typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES : [];
  return Number.isInteger(idx) && templates[idx] ? { template: templates[idx], idx } : null;
}

function getCourseRegActiveDormTemplates() {
  const templates = typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES : [];
  const activeRows = templates
    .map((template, index) => ({ template, index }))
    .filter(row => row.template.active !== false);
  const typeOrder = new Map();
  activeRows.forEach(row => {
    const type = row.template.accomType || '';
    if (!typeOrder.has(type)) typeOrder.set(type, typeOrder.size);
  });
  return activeRows.sort((a, b) => {
    const typeDiff = (typeOrder.get(a.template.accomType || '') || 0) - (typeOrder.get(b.template.accomType || '') || 0);
    if (typeDiff !== 0) return typeDiff;
    const capacityDiff = Number(a.template.capacity || 0) - Number(b.template.capacity || 0);
    if (capacityDiff !== 0) return capacityDiff;
    return String(a.template.condition || '').localeCompare(String(b.template.condition || ''), 'ko');
  });
}

function selectCourseRegDormOption(templateIndex, weeks) {
  const dormIn = document.getElementById('course-reg-dorm-in')?.value || '';
  if (!dormIn) {
    showToast('기숙사 입실일을 먼저 선택해줘.', 'warning');
    document.getElementById('course-reg-dorm-in')?.focus();
    return;
  }
  const template = typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES[templateIndex] : null;
  if (!template || template.active === false || !COURSE_REG_PERIODS.includes(Number(weeks))) return;
  const templateEl = document.getElementById('course-reg-dorm-template');
  const durationEl = document.getElementById('course-reg-dorm-duration');
  if (templateEl) templateEl.value = String(templateIndex);
  if (durationEl) durationEl.value = String(weeks);
  updateCourseRegDormCheckout();
  updateStudentCourseRegistrationPreview();
}

function renderCourseRegDormComparison() {
  const target = document.getElementById('course-reg-dorm-compare-table');
  if (!target) return;
  const rows = getCourseRegActiveDormTemplates();
  const selected = getCourseRegSelectedDormTemplate();
  const selectedWeeks = parseInt(document.getElementById('course-reg-dorm-duration')?.value, 10) || 0;
  const hasDormIn = Boolean(document.getElementById('course-reg-dorm-in')?.value);
  const summary = document.getElementById('course-reg-dorm-selection-summary');

  if (!rows.length) {
    target.innerHTML = `<div style="padding:18px;text-align:center;color:#9CA3AF;font-size:12px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:10px">현재 등록 가능한 기숙사 요금이 없습니다.</div>`;
    if (summary) summary.textContent = '등록 가능 기숙사 없음';
    return;
  }

  if (summary) {
    const t = selected?.template;
    const amount = t ? getCourseRegPeriodFee(t.cost, t.tuitionPolicy, selectedWeeks) : 0;
    summary.textContent = !hasDormIn
      ? '입실일을 먼저 선택해줘'
      : t && selectedWeeks
      ? `${t.accomType || '-'} · ${t.capacity || '-'}인실 · ${t.condition || '-'} · ${selectedWeeks}주 · ${formatCourseRegMoney(amount)}`
      : '희망 기숙사와 기간을 선택해줘';
  }

  target.innerHTML = `
    <div style="min-width:1120px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden">
      <div style="display:grid;grid-template-columns:220px repeat(${COURSE_REG_PERIODS.length},minmax(96px,1fr));background:#F8FAFC;border-bottom:1px solid #E5E7EB">
        <div style="padding:9px 12px;font-size:11px;font-weight:800;color:#4B5563">숙소 유형 · 인실 · 등급</div>
        ${COURSE_REG_PERIODS.map(weeks => `<div style="padding:9px 6px;text-align:center;font-size:11px;font-weight:800;color:${hasDormIn && selected && weeks === selectedWeeks ? '#047857' : '#4B5563'};background:${hasDormIn && selected && weeks === selectedWeeks ? '#ECFDF5' : 'transparent'}">${weeks}주</div>`).join('')}
      </div>
      ${rows.map(({ template, index }, rowIndex) => `
        <div style="display:grid;grid-template-columns:220px repeat(${COURSE_REG_PERIODS.length},minmax(96px,1fr));border-bottom:${rowIndex === rows.length - 1 ? '0' : '1px solid #EEF0F4'};background:#fff">
          <div style="padding:10px 12px;display:flex;flex-direction:column;justify-content:center;background:${selected?.idx === index ? '#F0FDFA' : '#fff'}">
            <b style="font-size:12px;color:#111827">${template.accomType || '-'}</b>
            <span style="font-size:10px;color:#6B7280;margin-top:2px">${template.capacity || '-'}인실 · ${template.condition || '-'}</span>
          </div>
          ${COURSE_REG_PERIODS.map(weeks => {
            const active = hasDormIn && selected?.idx === index && weeks === selectedWeeks;
            const amount = getCourseRegPeriodFee(template.cost, template.tuitionPolicy, weeks);
            return `<button type="button" onclick="selectCourseRegDormOption(${index}, ${weeks})" aria-pressed="${active}" ${hasDormIn ? '' : 'disabled'} style="min-height:54px;padding:7px 5px;border:0;border-left:1px solid #EEF0F4;background:${active ? '#059669' : hasDormIn ? '#fff' : '#F9FAFB'};color:${active ? '#fff' : hasDormIn ? '#111827' : '#9CA3AF'};cursor:${hasDormIn ? 'pointer' : 'not-allowed'};font-family:inherit;opacity:${hasDormIn ? '1' : '.72'}"><span style="display:block;font-size:12px;font-weight:900">${formatCourseRegMoney(amount)}</span><span style="display:block;font-size:9.5px;font-weight:700;margin-top:2px;color:${active ? '#D1FAE5' : '#9CA3AF'}">${active ? '선택됨' : hasDormIn ? '선택' : '입실일 먼저'}</span></button>`;
          }).join('')}
        </div>
      `).join('')}
    </div>`;
}

function renderCourseRegFeeCompare(targetId, rows, selectedWeeks, activeColor) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">
      ${rows.map(row => {
        const active = row.weeks === selectedWeeks;
        return `
          <div style="padding:8px 6px;border-radius:9px;border:1px solid ${active ? activeColor.border : '#E5E7EB'};background:${active ? activeColor.bg : '#fff'};text-align:center">
            <div style="font-size:10.5px;font-weight:800;color:${active ? activeColor.text : '#6B7280'}">${row.weeks}주</div>
            <div style="font-size:12px;font-weight:900;color:#111827;margin-top:2px">${formatCourseRegMoney(row.amount)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getCourseRegExtraItems() {
  if (typeof getTuitionLocalFeeItems === 'function') {
    return getTuitionLocalFeeItems();
  }
  return [];
}

function renderCourseRegistrationExtras(selectedNames = []) {
  const wrap = document.getElementById('course-reg-extra-items');
  const registrationWrap = document.getElementById('course-reg-registration-fee');
  if (!wrap || !registrationWrap) return;
  const items = getCourseRegExtraItems();
  if (!items.length) {
    registrationWrap.innerHTML = `<div style="color:#9CA3AF;font-size:12px">등록금 설정 정보가 없습니다.</div>`;
    wrap.innerHTML = `<div style="grid-column:span 2;color:#9CA3AF;font-size:12px">등록된 기타 항목이 없습니다.</div>`;
    return;
  }
  const indexedItems = items.map((item, idx) => ({ item, idx }));
  const registrationItems = indexedItems.filter(({ item }) => /등록금|Registration/i.test(item.name || ''));
  const otherItems = indexedItems.filter(({ item }) => !/등록금|Registration/i.test(item.name || ''));
  registrationWrap.innerHTML = registrationItems.length ? registrationItems.map(({ item }) => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:1px solid #C7D2FE;border-radius:10px;background:#F8FAFF">
      <span>
        <span style="display:flex;align-items:center;gap:6px"><b style="font-size:13px;color:#111827">${item.name}</b><span class="tsa-badge tsa-badge-primary" style="font-size:9px">고정 필수</span></span>
        <span style="display:block;font-size:10.5px;color:#6366F1;margin-top:3px">체크 없이 모든 수강 등록에 자동 포함됩니다.</span>
      </span>
      <b style="font-size:14px;color:#4338CA">${formatCourseRegMoney(item.amount)}</b>
    </div>
  `).join('') : `<div style="color:#9CA3AF;font-size:12px">등록금 설정 정보가 없습니다.</div>`;
  const otherItemsHtml = otherItems.map(({ item, idx }) => {
    const isRequired = item.type === 'required';
    const checked = isRequired || selectedNames.includes(item.name) ? 'checked' : '';
    return `
      <label style="display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid ${isRequired ? '#FCA5A5' : '#E5E7EB'};border-radius:10px;background:${isRequired ? '#FFF7F7' : '#fff'};cursor:${isRequired ? 'default' : 'pointer'}">
        <input class="course-reg-extra-checkbox" type="checkbox" data-extra-index="${idx}" ${checked} ${isRequired ? 'disabled' : ''} onchange="updateStudentCourseRegistrationPreview()" style="margin-top:2px"/>
        <span style="flex:1">
          <span style="display:flex;justify-content:space-between;gap:8px">
            <b style="font-size:12.5px;color:#111827">${item.name} <span class="tsa-badge ${isRequired ? 'tsa-badge-danger' : 'tsa-badge-gray'}" style="font-size:9px;margin-left:4px">${isRequired ? '필수' : '옵션'}</span></b>
            <b style="font-size:12.5px;color:#4F46E5">${formatCourseRegMoney(item.amount)}</b>
          </span>
          <span style="display:block;font-size:10.5px;color:#9CA3AF;margin-top:2px">${item.applicationMemo || item.condition || '적용 메모 없음'}</span>
        </span>
      </label>
    `;
  }).join('');
  wrap.innerHTML = otherItemsHtml || `<div style="grid-column:span 2;color:#9CA3AF;font-size:12px">선택 가능한 기타 항목이 없습니다.</div>`;
}

function getSelectedCourseRegExtras() {
  const items = getCourseRegExtraItems();
  const fixedRegistrationItems = items
    .filter(item => /등록금|Registration/i.test(item.name || ''))
    .map(item => ({ name: item.name, amount: Number(item.amount || 0), type: 'required', commissionEnabled: item.commissionEnabled !== false, applicationMemo: item.applicationMemo || item.condition || '' }));
  const selectedOptionalItems = Array.from(document.querySelectorAll('.course-reg-extra-checkbox:checked')).map(cb => {
    const item = items[parseInt(cb.dataset.extraIndex, 10)];
    return item ? { name: item.name, amount: Number(item.amount || 0), type: item.type || 'optional', commissionEnabled: item.commissionEnabled !== false, applicationMemo: item.applicationMemo || item.condition || '' } : null;
  }).filter(Boolean);
  return [...fixedRegistrationItems, ...selectedOptionalItems];
}

function syncCourseRegDormDuration() {
  const segments = getCourseRegSegments();
  const segmentWeeks = segments.reduce((sum, segment) => sum + Number(segment.duration || 0), 0);
  const duration = segmentWeeks || document.getElementById('course-reg-duration')?.value || '4';
  const dormDuration = document.getElementById('course-reg-dorm-duration');
  if (dormDuration) dormDuration.value = duration;
}

function toggleCourseRegDormSection() {
  const enabled = !document.getElementById('course-reg-dorm-enabled')?.checked;
  const section = document.getElementById('course-reg-dorm-section');
  const note = document.getElementById('course-reg-dorm-disabled-note');
  if (section) section.style.display = enabled ? 'grid' : 'none';
  if (note) note.style.display = enabled ? 'none' : 'block';
}

function updateCourseRegDormCheckout() {
  const dormIn = document.getElementById('course-reg-dorm-in');
  const dormOut = document.getElementById('course-reg-dorm-out');
  const duration = parseInt(document.getElementById('course-reg-dorm-duration')?.value, 10) || 0;
  const dormSelection = getCourseRegSelectedDormTemplate();
  if (!dormIn || !dormOut) return;
  const startDate = dormIn.value || '';
  if (!startDate || !duration || !dormSelection) {
    dormOut.value = '';
    return;
  }
  const out = new Date(`${startDate}T00:00:00Z`);
  out.setUTCDate(out.getUTCDate() + duration * 7);
  dormOut.value = out.toISOString().split('T')[0];
}

function handleCourseRegDormInChange() {
  const dormIn = document.getElementById('course-reg-dorm-in')?.value || '';
  if (!dormIn) {
    const templateEl = document.getElementById('course-reg-dorm-template');
    const durationEl = document.getElementById('course-reg-dorm-duration');
    if (templateEl) templateEl.value = '';
    if (durationEl) durationEl.value = '';
  }
  updateCourseRegDormCheckout();
  updateStudentCourseRegistrationPreview();
}

function updateCourseRegDormDatesFromStart() {
  updateCourseRegDormCheckout();
}

function updateStudentCourseRegistrationPreview() {
  const course = getCourseRegSelectedCourse();
  const duration = parseInt(document.getElementById('course-reg-duration')?.value, 10) || 0;
  const segments = getCourseRegSegments();
  const dormEnabled = !document.getElementById('course-reg-dorm-enabled')?.checked;
  const dormDuration = parseInt(document.getElementById('course-reg-dorm-duration')?.value, 10) || 0;
  const dormSelection = getCourseRegSelectedDormTemplate();
  const dormIn = document.getElementById('course-reg-dorm-in')?.value || '';
  const dormOut = document.getElementById('course-reg-dorm-out')?.value || '';
  const extras = getSelectedCourseRegExtras();

  renderCourseRegCourseComparison();
  renderCourseRegRecommendedLevels(course);
  renderCourseRegDormComparison();
  renderCourseRegSegments();

  const tuitionAmount = segments.reduce((sum, segment) => sum + Number(segment.tuitionAmount || 0), 0);
  const dormAmount = dormEnabled && dormIn && dormSelection && dormDuration ? getCourseRegPeriodFee(dormSelection.template.cost, dormSelection.template.tuitionPolicy, dormDuration) : 0;
  const extrasTotal = extras.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const total = tuitionAmount + dormAmount + extrasTotal;

  const preview = document.getElementById('course-reg-fee-preview');
  if (!preview) return;
  const dormLabel = dormEnabled && dormIn && dormSelection
    ? `${dormSelection.template.accomType || '-'} · ${dormSelection.template.capacity || '-'}인실 · ${dormSelection.template.condition || '-'}`
    : dormEnabled ? '미선택' : '미사용';

  preview.innerHTML = `
    <div style="padding:12px;border:1px solid #E5E7EB;background:#fff;border-radius:10px">
      <div style="font-size:11px;color:#6B7280;font-weight:700;margin-bottom:7px">수강료</div>
      ${segments.length ? segments.map((segment, index) => `
        <div style="display:flex;justify-content:space-between;gap:10px;margin-top:${index ? '8px' : '0'};padding:${index ? '8px 0 0' : '0'};border-top:${index ? '1px solid #EEF0F4' : '0'}">
          <div style="min-width:0">
            <div style="font-size:11.5px;color:#111827;font-weight:800">${index + 1}. ${segment.course} / ${segment.duration}주</div>
            <div style="font-size:10px;color:#6B7280;margin-top:3px">${fmtDate(segment.startDate)} ~ ${fmtDate(segment.endDate)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:12.5px;font-weight:900;color:#111827">${formatCourseRegMoney(segment.tuitionAmount)}</div>
            <button type="button" onclick="removeCourseRegSegment(${index})" style="margin-top:3px;border:0;background:none;color:#EF4444;font-size:10px;cursor:pointer">삭제</button>
          </div>
        </div>
      `).join('') : `<div style="font-size:12px;color:#9CA3AF">추가된 수강 구간 없음</div>`}
      <div style="display:flex;justify-content:space-between;border-top:1px dashed #D1D5DB;margin-top:8px;padding-top:8px;font-size:12px"><b>수강료 소계</b><b>${formatCourseRegMoney(tuitionAmount)}</b></div>
    </div>
    <div style="padding:12px;border:1px solid #E5E7EB;background:#fff;border-radius:10px">
      <div style="display:flex;justify-content:space-between;gap:10px">
        <div>
          <div style="font-size:11px;color:#6B7280;font-weight:700">희망 기숙사</div>
          <div style="font-size:12px;color:#111827;font-weight:800;margin-top:2px">${dormLabel}${dormEnabled && dormIn && dormSelection && dormDuration ? ` / ${dormDuration}주` : ''}</div>
          ${dormEnabled ? `<div style="font-size:10.5px;color:${dormIn && dormOut ? '#6B7280' : '#DC2626'};margin-top:4px">${dormIn && dormOut ? `입실 ${fmtDate(dormIn)} · 퇴실 ${fmtDate(dormOut)}` : '입실일을 선택해줘'}</div>` : ''}
        </div>
        <div style="font-size:15px;font-weight:900;color:#111827">${formatCourseRegMoney(dormAmount)}</div>
      </div>
    </div>
    <div style="padding:12px;border:1px solid #E5E7EB;background:#fff;border-radius:10px">
      <div style="font-size:11px;color:#6B7280;font-weight:700;margin-bottom:8px">기타 항목</div>
      ${extras.length ? extras.map(item => `
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:5px">
          <span style="color:#374151">${item.name}</span>
          <b>${formatCourseRegMoney(item.amount)}</b>
        </div>
      `).join('') : `<div style="font-size:12px;color:#9CA3AF">선택된 기타 항목 없음</div>`}
      <div style="display:flex;justify-content:space-between;border-top:1px dashed #D1D5DB;margin-top:8px;padding-top:8px;font-size:12px">
        <b>소계</b><b>${formatCourseRegMoney(extrasTotal)}</b>
      </div>
    </div>
    <div style="padding:14px;border-radius:12px;background:#4F46E5;color:#fff;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div style="font-size:11px;font-weight:700;opacity:.85">학생 최종 청구 금액</div>
        <div style="font-size:12px;font-weight:700;opacity:.9">학생 납부 기준</div>
      </div>
      <div style="font-size:24px;font-weight:900">${formatCourseRegMoney(total)}</div>
    </div>
  `;
}

function handleCourseRegFileUpload(type, input) {
  APP.courseRegUploadedFiles = APP.courseRegUploadedFiles || {};
  const fileName = input?.files?.[0]?.name || null;
  APP.courseRegUploadedFiles[type] = fileName;
  const label = document.getElementById(`course-reg-file-${type}`);
  if (label) {
    label.textContent = fileName || '파일 선택';
    label.style.color = fileName ? '#047857' : '#9CA3AF';
  }
}

function openStudentCourseRegistration(studentId) {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!student) return;
  APP.currentCourseRegistrationStudent = student;
  APP.courseRegSegments = [];
  APP.courseRegUploadedFiles = { ...(student.requiredFiles || {}) };
  const modeEl = document.getElementById('course-reg-mode');
  if (modeEl) modeEl.value = '';

  const activeCourses = getCourseRegActiveCourses().map(row => row.course);
  const courseEl = document.getElementById('course-reg-course');
  if (courseEl) {
    courseEl.innerHTML = `<option value="">과정 미선택</option>${activeCourses.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}`;
    courseEl.value = '';
  }

  const title = document.getElementById('course-reg-title');
  if (title) title.textContent = `${student.name} 수강 등록`;
  const subtitle = document.getElementById('course-reg-subtitle');
  if (subtitle) subtitle.textContent = '과정별 수강료를 비교한 뒤 기숙사와 기타 비용을 포함한 최종 금액을 확인합니다.';
  const summary = document.getElementById('course-reg-student-summary');
  if (summary) summary.textContent = `${student.name} (Nick: ${student.nick}) · ${student.nationality || '-'} · 현재 ${student.course || '미등록'}`;

  const startEl = document.getElementById('course-reg-start');
  if (startEl) startEl.value = '';
  const endEl = document.getElementById('course-reg-end');
  if (endEl) endEl.value = '';
  const durationEl = document.getElementById('course-reg-duration');
  if (durationEl) durationEl.value = '';
  const remittanceRouteEl = document.getElementById('course-reg-remittance-route');
  if (remittanceRouteEl) remittanceRouteEl.value = student.remittanceRoute || 'agency';
  const memoEl = document.getElementById('course-reg-memo');
  if (memoEl) memoEl.value = '';

  const optionalValues = {
    'course-reg-flight-num': student.flightNum || '',
    'course-reg-arrival-date': student.arrivalDate || '',
    'course-reg-flight-time': student.flightTime || '',
    'course-reg-flight-out-num': student.flightOutNum || '',
    'course-reg-departure-date': student.departureDate || '',
    'course-reg-flight-out-time': student.flightOutTime || '',
  };
  Object.entries(optionalValues).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  ['passport','ticket','photo','insurance'].forEach(type => {
    const label = document.getElementById(`course-reg-file-${type}`);
    const fileName = APP.courseRegUploadedFiles[type];
    if (label) {
      label.textContent = fileName || '파일 선택';
      label.style.color = fileName ? '#047857' : '#9CA3AF';
    }
  });

  const dormEnabledEl = document.getElementById('course-reg-dorm-enabled');
  if (dormEnabledEl) dormEnabledEl.checked = false;
  const dormEl = document.getElementById('course-reg-dorm-template');
  const templates = typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES : [];
  if (dormEl) {
    const visibleTemplates = templates
      .map((template, idx) => ({ template, idx }))
      .filter(row => row.template.active !== false);
    dormEl.innerHTML = `<option value="">기숙사 미선택</option>${visibleTemplates.map(row => {
      const t = row.template;
      const label = `${t.accomType || '-'} · ${t.capacity || '-'}인실 · ${t.condition || '-'} · 4주 ${formatCourseRegMoney(t.cost)}`;
      return `<option value="${row.idx}">${label}</option>`;
    }).join('')}`;
    dormEl.value = '';
  }

  const dormInEl = document.getElementById('course-reg-dorm-in');
  if (dormInEl) dormInEl.value = '';
  const dormOutEl = document.getElementById('course-reg-dorm-out');
  if (dormOutEl) dormOutEl.value = '';
  const dormDurationEl = document.getElementById('course-reg-dorm-duration');
  if (dormDurationEl) dormDurationEl.value = '';

  renderCourseRegistrationExtras([]);
  renderCourseRegSegments();
  updateCourseRegModeUI();
  toggleCourseRegDormSection();
  updateCourseRegDormDatesFromStart();
  updateStudentCourseRegistrationPreview();

  openModal('student-course-registration-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function saveStudentCourseRegistration() {
  const student = APP.currentCourseRegistrationStudent;
  if (!student) return;

  const segments = getCourseRegSegments().map((segment, index) => ({ ...segment, order: index + 1 }));
  const course = segments.map(segment => segment.course).join(' → ');
  const recommendedLevels = [...new Set(segments.flatMap(segment => segment.recommendedLevels || []))];
  const level = student.level || '';
  const startDate = segments[0]?.startDate || '';
  const duration = segments.reduce((sum, segment) => sum + Number(segment.duration || 0), 0);
  const endDate = segments[segments.length - 1]?.endDate || '';
  const status = student.status || 'waiting';
  const payment = 'unpaid';
  const remittanceRoute = document.getElementById('course-reg-remittance-route')?.value || 'agency';
  const memo = document.getElementById('course-reg-memo')?.value.trim() || '';
  const dormEnabled = !document.getElementById('course-reg-dorm-enabled')?.checked;
  const dormDuration = parseInt(document.getElementById('course-reg-dorm-duration')?.value, 10) || duration;
  const dormSelection = getCourseRegSelectedDormTemplate();
  const dormIn = document.getElementById('course-reg-dorm-in')?.value || '';
  const dormOut = document.getElementById('course-reg-dorm-out')?.value || '';
  const extraItems = getSelectedCourseRegExtras();
  const getOptionalValue = id => document.getElementById(id)?.value.trim() || '';

  const courseMode = getCourseRegMode();
  if (!courseMode) {
    showToast('단일 코스 진행 또는 멀티 코스 진행을 먼저 선택해줘.', 'warning');
    return;
  }

  if (!segments.length || !course || !startDate) {
    showToast('등록할 수강 구간을 1개 이상 추가해줘.', 'warning');
    return;
  }

  if (dormEnabled && !dormSelection) {
    showToast('희망 기숙사와 이용 기간을 선택해줘.', 'warning');
    return;
  }

  if (dormEnabled && (!dormIn || !dormOut)) {
    showToast('기숙사 입실일을 선택해줘. 퇴실일은 이용 기간에 맞춰 자동 계산돼.', 'warning');
    document.getElementById('course-reg-dorm-in')?.focus();
    return;
  }

  const tuitionAmount = segments.reduce((sum, segment) => sum + Number(segment.tuitionAmount || 0), 0);
  const dormAmount = dormEnabled && dormIn && dormSelection && dormDuration ? getCourseRegPeriodFee(dormSelection.template.cost, dormSelection.template.tuitionPolicy, dormDuration) : 0;
  const extrasTotal = extraItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const registrationAmount = extraItems
    .filter(item => /등록금|Registration/i.test(item.name || ''))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const otherExtrasTotal = Math.max(0, extrasTotal - registrationAmount);
  const totalGross = tuitionAmount + dormAmount + extrasTotal;
  const dormLabel = dormEnabled && dormIn && dormSelection
    ? `${dormSelection.template.accomType || '-'} · ${dormSelection.template.capacity || '-'}인실 · ${dormSelection.template.condition || '-'}`
    : dormEnabled ? '미선택' : '미사용';

  if (!student.enrollments) student.enrollments = [];
  student.enrollments.unshift({
    id: Date.now(),
    course,
    level,
    recommendedLevels,
    segments,
    startDate,
    endDate,
    duration,
    tuitionAmount,
    dorm: dormLabel,
    dormEnabled,
    dormDuration: dormEnabled ? dormDuration : 0,
    dormIn: dormEnabled ? dormIn : '',
    dormOut: dormEnabled ? dormOut : '',
    dormAccomType: dormEnabled && dormSelection ? dormSelection.template.accomType || null : null,
    dormType: dormEnabled && dormSelection ? dormSelection.template.capacity || null : null,
    dormGrade: dormEnabled && dormSelection ? dormSelection.template.condition || null : null,
    dormAmount,
    extraItems,
    extrasTotal,
    totalGross,
    status,
    paymentStatus: payment,
    courseMode,
    remittanceRoute,
    memo,
    flightInfo: {
      arrivalFlight: getOptionalValue('course-reg-flight-num'),
      arrivalDate: getOptionalValue('course-reg-arrival-date'),
      arrivalTime: getOptionalValue('course-reg-flight-time'),
      departureFlight: getOptionalValue('course-reg-flight-out-num'),
      departureDate: getOptionalValue('course-reg-departure-date'),
      departureTime: getOptionalValue('course-reg-flight-out-time'),
    },
    requiredFiles: { ...(student.requiredFiles || {}), ...(APP.courseRegUploadedFiles || {}) },
    createdAt: new Date().toISOString().split('T')[0],
  });

  student.course = course;
  student.courseMode = courseMode;
  student.courseSegments = segments;
  student.startDate = startDate;
  student.duration = duration;
  student.endDate = endDate;
  student.remittanceStatus = 'unpaid';
  student.remittanceRoute = remittanceRoute;
  student.dorm = dormLabel;
  if (dormEnabled && dormSelection) {
    student.dormAccomType = dormSelection.template.accomType || null;
    student.dormType = dormSelection.template.capacity || null;
    student.dormGrade = dormSelection.template.condition || null;
    student.dormIn = dormIn;
    student.dormOut = dormOut;
  } else {
    student.dormAccomType = null;
    student.dormType = null;
    student.dormGrade = null;
    student.dormIn = '';
    student.dormOut = '';
  }
  student.totalGross = totalGross;
  student.flightNum = getOptionalValue('course-reg-flight-num');
  student.arrivalDate = getOptionalValue('course-reg-arrival-date');
  student.flightTime = getOptionalValue('course-reg-flight-time');
  student.flightOutNum = getOptionalValue('course-reg-flight-out-num');
  student.departureDate = getOptionalValue('course-reg-departure-date');
  student.flightOutTime = getOptionalValue('course-reg-flight-out-time');
  student.requiredFiles = { ...(student.requiredFiles || {}), ...(APP.courseRegUploadedFiles || {}) };
  student.extraItems = extraItems;
  student.pickupRequired = extraItems.some(item => /공항\s*픽업|Airport\s*Pickup/i.test(item.name || ''));
  student.courseRegistrationFees = {
    registration: registrationAmount,
    tuition: tuitionAmount,
    dorm: dormAmount,
    extras: otherExtrasTotal,
    total: totalGross,
    extraItems,
  };
  student.billingItemStatuses = {
    registration: payment === 'paid' ? 'paid' : 'unpaid',
    education: payment === 'paid' ? 'paid' : 'unpaid',
    dorm: payment === 'paid' ? 'paid' : 'unpaid',
    local: payment === 'paid' ? 'paid' : 'unpaid',
  };

  const agencyRow = typeof MOCK_AGENCY_STUDENTS !== 'undefined'
    ? MOCK_AGENCY_STUDENTS.find(a => a.name.includes(student.name) || a.name.includes(student.nick))
    : null;
  const agencyPayload = {
    name: `${student.name} (${student.nick})`,
    course,
    dorm: dormEnabled && dormSelection ? `${dormSelection.template.capacity || '-'}인실` : '미사용',
    duration: `${duration}주`,
    status,
    total: formatCourseRegMoney(totalGross),
    branch: agencyRow?.branch || (APP.user === 'agency_branch' ? '강남지사' : '본사'),
    agencyStatus: status,
  };
  if (agencyRow) {
    Object.assign(agencyRow, agencyPayload);
  } else if (typeof MOCK_AGENCY_STUDENTS !== 'undefined') {
    MOCK_AGENCY_STUDENTS.push(agencyPayload);
  }

  if (!student.changeRequests) student.changeRequests = [];
  student.changeRequests.push({
    id: Date.now() + 1,
    field: '코스 등록',
    from: '-',
    to: `${course} · ${duration}주 · ${formatCourseRegMoney(totalGross)}`,
    reason: memo || '학생 리스트에서 코스 등록 및 비용 확정',
    changedBy: APP.user === 'agency_head' ? '에이전시 본사' : APP.user === 'agency_branch' ? '에이전시 지사' : '관리자',
    requestDate: new Date().toISOString().split('T')[0],
  });

  closeModal('student-course-registration-modal');
  initAgencyStudentList();
  showToast(`${student.name} 학생의 코스가 등록되었습니다. 최종 금액: ${formatCourseRegMoney(totalGross)}`, 'success');
}

function resetAgencyFilters() {
  document.getElementById('filter-agency-course').value = 'all';
  document.getElementById('filter-agency-nationality').value = 'all';
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

// 실제 침대 재고와 분리된 에이전시용 마케팅 노출 정책
const MOCK_DORM_AGENCY_VISIBILITY = {};

function getDormAgencyVisibilityPolicy(accomType, capacity, grade) {
  const key = `${accomType}__${capacity}__${grade}`;
  if (!MOCK_DORM_AGENCY_VISIBILITY[key]) {
    MOCK_DORM_AGENCY_VISIBILITY[key] = { mode: 'status', marketingQty: 2 };
  }
  return MOCK_DORM_AGENCY_VISIBILITY[key];
}

function updateDormAgencyVisibilityPolicy(key, field, value) {
  if (!MOCK_DORM_AGENCY_VISIBILITY[key]) MOCK_DORM_AGENCY_VISIBILITY[key] = { mode: 'status', marketingQty: 2 };
  MOCK_DORM_AGENCY_VISIBILITY[key][field] = field === 'marketingQty'
    ? Math.max(1, Math.min(9, parseInt(value, 10) || 1))
    : value;
  renderDormAgencyVisibilitySettings();
  renderAgencyDormList();
}

function renderDormAgencyVisibilitySettings() {
  const tbody = document.getElementById('dorm-agency-visibility-tbody');
  if (!tbody || typeof MOCK_DORM_TEMPLATES === 'undefined') return;
  tbody.innerHTML = MOCK_DORM_TEMPLATES.map(tpl => {
    const key = `${tpl.accomType}__${tpl.capacity}__${tpl.condition}`;
    const policy = getDormAgencyVisibilityPolicy(tpl.accomType, tpl.capacity, tpl.condition);
    const preview = policy.mode === 'count' ? `잔여 ${policy.marketingQty}자리` : policy.mode === 'hidden' ? '상담 필요' : '예약 가능/불가';
    return `<tr>
      <td><strong>${tpl.accomType}</strong></td>
      <td>${tpl.capacity}인실 (${tpl.condition})</td>
      <td><select class="tsa-input" style="width:150px;font-size:11.5px" onchange="updateDormAgencyVisibilityPolicy('${key}','mode',this.value)">
        <option value="status" ${policy.mode === 'status' ? 'selected' : ''}>가능 여부만</option>
        <option value="count" ${policy.mode === 'count' ? 'selected' : ''}>마케팅 잔여 수</option>
        <option value="hidden" ${policy.mode === 'hidden' ? 'selected' : ''}>상담 필요</option>
      </select></td>
      <td><input type="number" min="1" max="9" value="${policy.marketingQty}" ${policy.mode === 'count' ? '' : 'disabled'} class="tsa-input" style="width:82px;text-align:center" onchange="updateDormAgencyVisibilityPolicy('${key}','marketingQty',this.value)"/></td>
      <td><span style="font-size:11px;font-weight:700;color:#5E5CE6;background:#EEF2FF;padding:3px 9px;border-radius:8px">${preview}</span></td>
    </tr>`;
  }).join('');
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

  // 에이전시에는 실제 호실/침대/정확한 재고를 노출하지 않고 타입 단위 정책값만 표시한다.
  let marketingTypes = MOCK_DORM_TEMPLATES.map(tpl => {
    const type = `${tpl.capacity}인실 (${tpl.condition})`;
    const matchingRooms = MOCK_DORM_ROOMS.filter(r => r.roomNo && r.accomType === tpl.accomType && r.type === type);
    let actualVacant = 0;
    matchingRooms.forEach(room => (room.beds || []).forEach(bed => {
      if (!isOverlap(bed.start, bed.end) && !bed.incoming) actualVacant++;
    }));
    return { tpl, type, actualVacant, policy: getDormAgencyVisibilityPolicy(tpl.accomType, tpl.capacity, tpl.condition) };
  });
  if (_agencyDormAccomFilter !== '전체') marketingTypes = marketingTypes.filter(x => x.tpl.accomType === _agencyDormAccomFilter);
  if (_agencyDormCapFilter !== '전체') marketingTypes = marketingTypes.filter(x => `${x.tpl.capacity}인실` === _agencyDormCapFilter);
  if (_agencyDormGradeFilter !== '전체') marketingTypes = marketingTypes.filter(x => x.tpl.condition === _agencyDormGradeFilter);

  grid.innerHTML = marketingTypes.map(({ tpl, type, actualVacant, policy }) => {
    const available = actualVacant > 0 && policy.mode !== 'hidden';
    const displayQty = Math.min(actualVacant, policy.marketingQty || 1);
    const statusText = policy.mode === 'hidden' ? '상담 필요'
      : !available ? '예약 불가'
      : policy.mode === 'count' ? `잔여 ${displayQty}자리`
      : actualVacant <= 2 ? '마감 임박' : '예약 가능';
    const statusColor = policy.mode === 'hidden' ? '#64748B' : available ? (statusText === '마감 임박' ? '#D97706' : '#059669') : '#DC2626';
    const statusBg = policy.mode === 'hidden' ? '#F1F5F9' : available ? (statusText === '마감 임박' ? '#FFFBEB' : '#ECFDF5') : '#FEF2F2';
    return `<div style="border:1px solid #E5E7EB;border-radius:12px;background:#fff;padding:18px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
      <div style="width:42px;height:42px;border-radius:11px;background:#EEF2FF;color:#5E5CE6;display:flex;align-items:center;justify-content:center;font-size:20px">🏢</div>
      <div style="flex:1;min-width:190px"><div style="font-size:11px;color:#7C3AED;font-weight:700">${tpl.accomType}</div><div style="font-size:14px;font-weight:800;color:#111827;margin-top:3px">${type}</div><div style="font-size:10.5px;color:#94A3B8;margin-top:3px">실제 호실 및 침대 정보는 배정 확정 후 안내</div></div>
      <span style="font-size:12px;font-weight:800;color:${statusColor};background:${statusBg};padding:7px 13px;border-radius:10px">${statusText}</span>
    </div>`;
  }).join('') || `<div style="text-align:center;padding:60px;color:#9CA3AF;font-size:13px">조건에 맞는 룸 타입이 없습니다.</div>`;

  const summary = document.getElementById('agency-dorm-result-summary');
  if (summary) summary.textContent = `조회 가능 ${marketingTypes.length}개 타입 · 실제 재고 비공개`;
  return;

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
let aregProfilePhotoData = null;
function openAgencyStudentRegisterModal() {
  aregFiles = { passport: null, ticket: null, photo: null, insurance: null };
  aregProfilePhotoData = null;
  const profilePhotoInput = document.getElementById('areg-profile-photo');
  if (profilePhotoInput) profilePhotoInput.value = '';
  const profilePhotoName = document.getElementById('areg-profile-photo-name');
  if (profilePhotoName) profilePhotoName.textContent = '등록된 사진 없음';
  const profilePhotoPreview = document.getElementById('areg-profile-photo-preview');
  if (profilePhotoPreview) profilePhotoPreview.innerHTML = '<img src="assets/images/student_male.png" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>';
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

function previewAgencyStudentProfilePhoto(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 등록할 수 있습니다.', 'warning');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = event => {
    aregProfilePhotoData = event.target.result;
    aregFiles.photo = file.name;
    const preview = document.getElementById('areg-profile-photo-preview');
    const name = document.getElementById('areg-profile-photo-name');
    if (preview) preview.innerHTML = `<img src="${aregProfilePhotoData}" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>`;
    if (name) name.textContent = `✓ ${file.name}`;
  };
  reader.readAsDataURL(file);
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
      <div>학생 청구 수강료: <strong>$${prices.tuition.toLocaleString()}</strong></div>
      <div>학생 청구 기숙사비: <strong>$${prices.dorm.toLocaleString()}</strong></div>
      <div>입학금: <strong>$${prices.registration}</strong></div>
      <div style="border-top:1px solid #C7D2FE;grid-column:span 2;padding-top:4px"><strong>청구 금액 합계: $${prices.gross.toLocaleString()}</strong></div>
      <div style="color:#4F46E5">에이전시 B2B 커미션 (20%): <strong>-$${prices.commission.toLocaleString()}</strong></div>
      <div style="color:#059669">송금수수료: <strong>+$${prices.remitFee}</strong></div>
      <div style="border-top:1.5px dashed #818CF8;grid-column:span 2;padding-top:4px;font-size:12.5px;color:#1E1B4B"><strong>어학원 송금액: $${prices.net.toLocaleString()}</strong></div>
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
  {
  const basicEmail = document.getElementById('areg-email')?.value.trim() || '';
  const basicEmergencyContact = document.getElementById('areg-emergency')?.value.trim() || '';
  const basicWarningBanner = document.getElementById('register-warning-banner');
  if (basicWarningBanner) {
    basicWarningBanner.style.display = 'none';
    basicWarningBanner.innerHTML = '';
  }

  if (!name || !nick || !gender || !nationality || !phone || !basicEmail || !basicEmergencyContact || !diet) {
    showToast('⚠ 기본 인적 사항의 필수 항목을 모두 입력해 주세요.', 'danger');
    return;
  }

  if (isNaN(age)) {
    showToast('생년월일을 입력해 주세요.', 'danger');
    return;
  }

  const newStudentId = Math.max(...MOCK_STUDENTS.map(s => s.id), 0) + 1;
  const newStdObj = {
    id: newStudentId,
    name: name,
    nick: nick,
    profilePhoto: aregProfilePhotoData,
    email: basicEmail,
    emergencyContact: basicEmergencyContact,
    gender: gender,
    age: age,
    nationality: nationality,
    flag: nationality === '한국' ? '🇰🇷' : nationality === '일본' ? '🇯🇵' : nationality === '중국' ? '🇨🇳' : nationality === '베트남' ? '🇻🇳' : '🇲🇳',
    course: '미등록',
    duration: 0,
    level: '',
    dorm: '미배정',
    dormAccomType: null,
    dormType: null,
    dormGrade: null,
    visaExpiry: '',
    sspExpiry: '면제',
    arrivalDate: '',
    dormIn: '',
    dormOut: '',
    startDate: '',
    endDate: '',
    departureDate: '',
    attendance: 0,
    status: 'waiting',
    enrollDate: '',
    agency: '한국 영어마을',
    warning: 0,
    quiz: [],
    passportNum: '',
    passportExpiry: '',
    passportStatus: '미등록',
    flightInfo: '',
    flightOutInfo: '',
    dietType: diet,
    healthNotes: special || '특이사항 없음',
    grades: { speaking: [], listening: [], reading: [], writing: [] },
    fees: [],
    remittanceStatus: 'unpaid',
    remittanceReceipt: null,
    remittanceDate: null,
    changeRequests: [],
    requiredFiles: {
      passport: null,
      ticket: null,
      photo: aregFiles.photo,
      insurance: null
    }
  };

  MOCK_STUDENTS.push(newStdObj);

  MOCK_AGENCY_STUDENTS.push({
    name: `${name} (${nick})`,
    course: '미등록',
    dorm: '미배정',
    duration: '-',
    status: 'waiting',
    total: '-',
    branch: APP.user === 'agency_branch' ? '강남지사' : '본사',
    agencyStatus: 'waiting'
  });

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[기본정보 등록] 신입생 ${name} (${nick}) 학생의 기본 인적 사항이 등록되었습니다. 코스 등록을 진행해 주세요.`,
    type: 'info',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ ${name} 학생 기본정보가 등록되었습니다. 학생 리스트에서 코스 등록을 진행해 주세요.`, 'success');
  closeModal('agency-student-register-modal');
  enhanceMockStudents();
  updateAdminKPIs();
  updateAgencyKPIs();
  initAgencyStudentList();
  if (typeof initAdminInbox === 'function') initAdminInbox();
  return;
  }

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
    <div style="font-weight:700;margin-bottom:6px">💰 어학원 송금 금액서</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
      <div>수강 과정: <strong>${s.course}</strong></div>
      <div>기숙사: <strong>${s.dorm}</strong></div>
      <div>수강 주차: <strong>${s.duration}주</strong></div>
      <div>청구 금액 합계: <strong>$${prices.gross.toLocaleString()}</strong></div>
      <div style="color:#4F46E5;border-top:1px solid #E9EDF4;grid-column:span 2;padding-top:4px">에이전시 마진 커미션 (20%): <strong>-$${prices.commission.toLocaleString()}</strong></div>
      <div style="color:#059669">해외 이체 수수료 (본인부담): <strong>+$${prices.remitFee}</strong></div>
      <div style="border-top:1.5px dashed #818CF8;grid-column:span 2;padding-top:4px;font-size:12.5px;color:#1E1B4B"><strong>어학원 송금액: $${prices.net.toLocaleString()}</strong></div>
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
    showToast('⚠ 해외 송금 확인을 위한 송금 명세서 파일을 첨부해 주세요.', 'danger');
    return;
  }

  s.remittanceStatus = 'paid';
  s.remittanceReceipt = remitSelectedFile;
  s.remittanceDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

  showToast(`✓ ${s.name} 학생의 순 송금액(Net) 송금 명세서가 제출되어 완납 처리되었습니다.`, 'success');

  document.getElementById('remit-student-select').value = '';
  updateAgencyRemittanceDetails();
  initAgencyStudentList();
  if (typeof initAdminInbox === 'function') initAdminInbox();
}

let currentAdetailStudentId = null;
let currentAdetailTab = 'basic';
let currentAdetailPortal = 'agency';
let currentAdetailEnrollmentId = 'current';
let adetailUploadedFiles = { passport: null, ticket: null, photo: null, insurance: null, visa: null, ssp: null };
let adpProfilePhotoData = null;

function previewAdetailStudentPhoto(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) {
    showToast('이미지 파일만 등록할 수 있습니다.', 'warning');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = event => {
    adpProfilePhotoData = event.target.result;
    const preview = document.getElementById('adp-profile-photo-preview');
    const name = document.getElementById('adp-profile-photo-name');
    if (preview) preview.innerHTML = `<img src="${adpProfilePhotoData}" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>`;
    if (name) name.textContent = `✓ ${file.name}`;
    const headerAvatar = document.getElementById('adetail-page-avatar');
    if (headerAvatar) headerAvatar.src = adpProfilePhotoData;
  };
  reader.readAsDataURL(file);
}

function openAgencyStudentDetailModal(id) {
  currentAdetailStudentId = id;
  currentAdetailTab = 'basic';
  currentAdetailEnrollmentId = 'current';
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  adetailUploadedFiles = { 
    passport: s.requiredFiles ? s.requiredFiles.passport : null, 
    ticket: s.requiredFiles ? s.requiredFiles.ticket : null, 
    photo: s.requiredFiles ? s.requiredFiles.photo : null, 
    insurance: s.requiredFiles ? s.requiredFiles.insurance : null,
    visa: s.requiredFiles ? s.requiredFiles.visa : null,
    ssp: s.requiredFiles ? s.requiredFiles.ssp : null
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

function openAgencyStudentDetailPage(id, portal) {
  currentAdetailStudentId = id;
  currentAdetailTab = 'basic';
  currentAdetailEnrollmentId = 'current';
  currentAdetailPortal = portal === 'admin' ? 'admin' : 'agency';
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  adetailUploadedFiles = {
    passport: s.requiredFiles ? s.requiredFiles.passport : null,
    ticket: s.requiredFiles ? s.requiredFiles.ticket : null,
    photo: s.requiredFiles ? s.requiredFiles.photo : null,
    insurance: s.requiredFiles ? s.requiredFiles.insurance : null,
    visa: s.requiredFiles ? s.requiredFiles.visa : null,
    ssp: s.requiredFiles ? s.requiredFiles.ssp : null
  };

  renderAgencyStudentDetailPageHeader(s);
  navigate(currentAdetailPortal === 'admin' ? 'admin-student-detail' : 'agency-student-detail');
  switchAgencyStudentDetailPageTab('basic');
}

function closeStudentDetailPage() {
  if (new URLSearchParams(window.location.search).has('studentPopup')) {
    window.close();
    return;
  }
  navigate(currentAdetailPortal === 'admin' ? 'students' : 'agency-students');
}

function renderAgencyStudentDetailPageHeader(s) {
  const nameEl = document.getElementById('adetail-page-title-name');
  if (nameEl) nameEl.textContent = `${s.name} (Nick: ${s.nick})`;

  let stateStr = '입학 대기 (Waiting)';
  if (s.status === 'current') stateStr = '재학 (Current)';
  else if (s.status === 'completed') stateStr = '졸업 (Completed)';
  else if (s.status === 'resigned') stateStr = '퇴원 (Resigned)';
  else if (s.status === 'extended') stateStr = '연장 (Extended)';

  const subEl = document.getElementById('adetail-page-title-subtitle');
  if (subEl) subEl.textContent = `등록 상태: ${stateStr} · ${s.agency || '한국 영어마을'} · ${currentAdetailPortal === 'admin' ? '어드민 학생 상세 정보' : '학생 상세 페이지'}`;

  const avatar = document.getElementById('adetail-page-avatar');
  if (avatar) avatar.src = s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');

  const saveBtn = document.getElementById('adetail-page-save-btn');
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
}

function switchAgencyStudentDetailPageTab(tab) {
  const basicTab = document.getElementById('adetail-page-tab-basic');
  const enrollmentTab = document.getElementById('adetail-page-tab-enrollment');
  const saveBtn = document.getElementById('adetail-page-save-btn');
  if (basicTab) basicTab.classList.toggle('active', tab === 'basic');
  if (enrollmentTab) enrollmentTab.classList.toggle('active', tab === 'enrollment');
  if (saveBtn) saveBtn.style.display = tab === 'basic' ? '' : 'none';

  if (tab === 'basic') {
    switchAdetailTab('basic', 'adetail-page-tab-content', currentAdetailStudentId);
  } else if (tab === 'enrollment') {
    renderAgencyStudentEnrollmentHub();
  }
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function renderAgencyStudentEnrollmentHub() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  const container = document.getElementById('adetail-page-tab-content');
  if (!s || !container) return;

  const enrollments = getStudentEnrollmentSnapshots(s);
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:280px 1fr;gap:18px">
      <div style="border:1px solid #E5E7EB;border-radius:12px;background:#F8FAFC;padding:14px">
        <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:10px">수강 목록</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${enrollments.map((e, idx) => {
            const selected = String(e.id) === String(currentAdetailEnrollmentId);
            return `
            <button type="button" onclick="selectAgencyStudentEnrollment('${e.id}')" style="width:100%;padding:12px;border-radius:10px;border:1px solid ${selected ? '#C7D2FE' : '#E5E7EB'};background:${selected ? '#EEF2FF' : '#fff'};text-align:left;cursor:pointer;font-family:inherit">
              <div style="font-size:12.5px;font-weight:800;color:#111827">${e.course}</div>
              <div style="font-size:10.5px;color:#6B7280;margin-top:4px">${fmtDate(e.startDate)} ~ ${fmtDate(e.endDate)} · ${e.duration}주</div>
              <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">
                <span class="tsa-badge ${e.status === 'current' ? 'tsa-badge-success' : e.status === 'completed' ? 'tsa-badge-gray' : 'tsa-badge-warning'}">${getEnrollmentStatusLabel(e.status)}</span>
                ${selected ? '<span class="tsa-badge tsa-badge-primary">현재 선택</span>' : ''}
              </div>
            </button>`;
          }).join('')}
        </div>
        <div style="margin-top:12px;font-size:11px;color:#6B7280;line-height:1.5">
          코스 등록은 학생 리스트의 <b>코스 등록</b> 버튼에서 진행합니다.
        </div>
      </div>

      <div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="class" onclick="switchAgencyEnrollmentHubTab('class')">수강정보</button>
          ${currentAdetailPortal === 'admin' ? '<button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="classlog" onclick="switchAgencyEnrollmentHubTab(\'classlog\')">수업 현황</button>' : ''}
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="flightdocs" onclick="switchAgencyEnrollmentHubTab('flightdocs')">항공편 & 서류 관리</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="dorm" onclick="switchAgencyEnrollmentHubTab('dorm')">기숙사</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="settle" onclick="switchAgencyEnrollmentHubTab('settle')">정산</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="consultation" onclick="switchAgencyEnrollmentHubTab('consultation')">학생 활동 히스토리</button>
        </div>
        <div id="adetail-page-enrollment-content" style="border:1px solid #E5E7EB;border-radius:12px;padding:14px;background:#fff;min-height:420px"></div>
      </div>
    </div>
  `;

  const availableTabs = ['class', 'classlog', 'flightdocs', 'dorm', 'settle', 'consultation'];
  switchAgencyEnrollmentHubTab(availableTabs.includes(currentAdetailTab) ? currentAdetailTab : 'class');
}

function getStudentEnrollmentSnapshots(s) {
  const current = {
    id: 'current',
    course: s.course || '코스 미등록',
    level: s.level || '-',
    startDate: s.startDate || '',
    endDate: s.endDate || '',
    duration: getStudentPopupWeeks(s),
    status: s.status || 'waiting',
    paymentStatus: s.remittanceStatus || 'unpaid',
    segments: Array.isArray(s.courseSegments) ? s.courseSegments : [],
    dorm: s.dorm,
    dormEnabled: !isStudentWalkIn(s),
    dormDuration: s.dormDuration || s.duration || 0,
    dormIn: s.dormIn || '',
    dormOut: s.dormOut || '',
    dormAccomType: s.dormAccomType,
    dormType: s.dormType,
    dormGrade: s.dormGrade,
  };
  const saved = Array.isArray(s.enrollments) ? s.enrollments.map(enrollment => {
    const dormParts = String(enrollment.dorm || '').split(' · ');
    return {
      ...enrollment,
      duration: getStudentPopupWeeks(enrollment),
      segments: Array.isArray(enrollment.segments) ? enrollment.segments : [],
      dormAccomType: enrollment.dormAccomType || dormParts[0] || '',
      dormType: enrollment.dormType || parseInt(dormParts[1], 10) || null,
      dormGrade: enrollment.dormGrade || dormParts[2] || '',
    };
  }) : [];
  const history = saved.filter(e => !(e.course === current.course && e.startDate === current.startDate));
  return [current, ...history].slice(0, 4);
}

function getSelectedStudentEnrollment(s) {
  const enrollments = getStudentEnrollmentSnapshots(s);
  return enrollments.find(e => String(e.id) === String(currentAdetailEnrollmentId)) || enrollments[0];
}

function selectAgencyStudentEnrollment(enrollmentId) {
  currentAdetailEnrollmentId = String(enrollmentId);
  renderAgencyStudentEnrollmentHub();
}

function getEnrollmentStatusLabel(status) {
  if (status === 'current') return '재학';
  if (status === 'completed') return '졸업';
  if (status === 'resigned') return '퇴원';
  if (status === 'extended') return '연장';
  return '입학 대기';
}

function switchAgencyEnrollmentHubTab(tab) {
  currentAdetailTab = tab;
  document.querySelectorAll('.enrollment-hub-tab').forEach(btn => {
    const isActive = btn.dataset.hubTab === tab;
    btn.classList.toggle('tsa-btn-primary', isActive);
    btn.classList.toggle('tsa-btn-outline', !isActive);
  });

  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  const container = document.getElementById('adetail-page-enrollment-content');
  if (!s || !container) return;

  if (tab === 'classlog' && currentAdetailPortal === 'admin') {
    APP.currentStudent = s;
    APP._classLogContainerId = 'adetail-page-enrollment-content';
    APP._classLogDate = APP._classLogDate || '2026-06-16';
    renderStudentClassLogTab();
  } else if (tab === 'flightdocs') {
    renderAgencyEnrollmentFlightDocs(s, container);
  } else if (tab === 'consultation') {
    renderStudentConsultationTab(s, container);
  } else {
    switchAdetailTab(tab, 'adetail-page-enrollment-content', currentAdetailStudentId);
  }
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function renderAgencyEnrollmentFlightDocs(s, container) {
  const visaStatus = s.visaStatus || (s.visaExpiry === '면제' ? 'exempt' : (s.visaExpiry && s.visaExpiry !== '미설정' ? 'issued' : 'not_started'));
  const sspStatus = s.sspStatus || (s.sspExpiry === '면제' ? 'exempt' : (s.sspExpiry && s.sspExpiry !== '미취득' ? 'issued' : 'not_started'));
  const documentStatusOptions = [
    ['not_started', '미신청'],
    ['preparing', '서류 준비'],
    ['applied', '신청 완료'],
    ['issued', '발급 완료'],
    ['exempt', '면제']
  ];
  const renderStatusOptions = selected => documentStatusOptions
    .map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`)
    .join('');
  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div style="font-size:14px;font-weight:800;color:#111827">항공편 & 서류 관리</div>
        <div style="font-size:11px;color:#6B7280;margin-top:3px">선택한 수강 건 기준으로 입출국 일정과 필수 서류를 관리합니다.</div>
      </div>
      <span class="tsa-badge tsa-badge-primary">수강별 관리 영역</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div style="border:1px solid #BBF7D0;background:#F0FDF4;border-radius:12px;padding:14px">
        <div style="font-size:12.5px;font-weight:800;color:#047857;margin-bottom:10px">입국 항공편</div>
        <div class="tsa-form-group"><label class="tsa-label">편명</label><input id="ad-flight-num" class="tsa-input" value="${s.flightNum || fmtFlightStr(s.flightInfo) || ''}" placeholder="KE631"/></div>
        <div class="tsa-form-group"><label class="tsa-label">입국일</label><input id="ad-arrival-date" type="date" class="tsa-input" value="${s.arrivalDate || s.startDate || ''}"/></div>
        <div class="tsa-form-group"><label class="tsa-label">도착 시간</label><input id="ad-flight-time" type="time" class="tsa-input" value="${s.flightTime || ''}"/></div>
      </div>
      <div style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:12px;padding:14px">
        <div style="font-size:12.5px;font-weight:800;color:#1D4ED8;margin-bottom:10px">출국 항공편</div>
        <div class="tsa-form-group"><label class="tsa-label">편명</label><input id="ad-flight-out-num" class="tsa-input" value="${s.flightOutNum || fmtFlightStr(s.flightOutInfo) || ''}" placeholder="KE632"/></div>
        <div class="tsa-form-group"><label class="tsa-label">출국일</label><input id="ad-departure-date" type="date" class="tsa-input" value="${s.departureDate || s.endDate || ''}"/></div>
        <div class="tsa-form-group"><label class="tsa-label">출발 시간</label><input id="ad-flight-out-time" type="time" class="tsa-input" value="${s.flightOutTime || ''}"/></div>
      </div>
    </div>
    <div style="margin-top:14px;border:1px solid #E5E7EB;border-radius:12px;padding:14px;background:#F8FAFC">
      <div style="font-size:12.5px;font-weight:800;color:#374151;margin-bottom:10px">필수 서류</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;padding:12px;background:#fff;border:1px solid #E5E7EB;border-radius:10px">
        <div class="tsa-form-group" style="margin:0">
          <label class="tsa-label">등록된 여권번호</label>
          <input id="ad-passport-number-masked" class="tsa-input" value="${maskPassportNumber(s.passportNum, '미등록')}" readonly style="background:#F9FAFB;color:#6B7280"/>
        </div>
        <div class="tsa-form-group" style="margin:0">
          <label class="tsa-label">여권번호 입력/변경</label>
          <input id="ad-passport-number-new" class="tsa-input" type="password" autocomplete="new-password" placeholder="새 여권번호를 입력하세요"/>
          <div style="font-size:10px;color:#6B7280;margin-top:5px">저장 후에는 보안을 위해 마스킹되어 표시됩니다.</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
        ${['passport','ticket','photo','insurance'].map(type => {
          const labels = { passport: '여권 사본', ticket: 'E-티켓', photo: '증명 사진', insurance: '보험증서' };
          const uploaded = adetailUploadedFiles[type];
          const isPdf = uploaded && /\.pdf$/i.test(uploaded);
          const previewLabel = isPdf ? 'PDF 미리보기' : '미리보기';
          return `
            <div style="background:#fff;border:1px dashed #D1D5DB;border-radius:10px;padding:12px;text-align:center;min-height:118px;display:flex;flex-direction:column;justify-content:space-between">
              <div>
              <div style="font-size:11.5px;font-weight:700;color:#374151;margin-bottom:7px">${labels[type]}</div>
              <span class="tsa-badge ${uploaded ? 'tsa-badge-success' : 'tsa-badge-gray'}">${uploaded ? '등록됨' : '없음'}</span>
              <div style="font-size:10px;color:#9CA3AF;margin-top:6px">${uploaded || '수강 건별 업로드 예정'}</div>
              </div>
              <div style="display:flex;gap:5px;margin-top:10px;justify-content:center">
                <label class="tsa-btn tsa-btn-primary tsa-btn-xs" style="cursor:pointer;justify-content:center">
                  <i data-lucide="upload" style="width:12px;height:12px"></i> ${uploaded ? '교체' : '등록'}
                  <input type="file" accept="${type === 'photo' ? 'image/*' : '.pdf,image/*'}" hidden onchange="handleAdetailRequiredFileUpload('${type}',this)"/>
                </label>
                <button class="tsa-btn tsa-btn-outline tsa-btn-xs"
                  style="justify-content:center;${uploaded ? '' : 'opacity:.45;cursor:not-allowed'}"
                  ${uploaded ? `onclick="openAgencyRequiredFilePreview('${type}', '${encodeURIComponent(uploaded)}')"` : 'disabled'}>
                  <i data-lucide="${isPdf ? 'file-search' : 'image'}" style="width:12px;height:12px"></i> ${previewLabel}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div style="margin-top:14px;border:1px solid #DDD6FE;border-radius:12px;padding:14px;background:#FAF5FF">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px">
        <div>
          <div style="font-size:12.5px;font-weight:800;color:#5B21B6">비자 · SSP 서류 관리</div>
          <div style="font-size:10.5px;color:#7C3AED;margin-top:3px">신청 진행 상태와 발급 정보를 기록하고 증빙 서류를 관리합니다.</div>
        </div>
        <span class="tsa-badge tsa-badge-primary">학생별 진행 관리</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${[
          {
            type: 'visa', title: '비자 서류', color: '#1D4ED8', bg: '#EFF6FF', border: '#BFDBFE',
            status: visaStatus, appliedDate: s.visaAppliedDate || '', number: s.visaNumber || '',
            expiry: s.visaExpiry !== '면제' && s.visaExpiry !== '미설정' ? s.visaExpiry || '' : '',
            numberLabel: '비자 번호', numberPlaceholder: '예: VISA-2026-001'
          },
          {
            type: 'ssp', title: 'SSP 서류', color: '#047857', bg: '#ECFDF5', border: '#A7F3D0',
            status: sspStatus, appliedDate: s.sspAppliedDate || '', number: s.sspNumber || '',
            expiry: s.sspExpiry !== '면제' && s.sspExpiry !== '미취득' ? s.sspExpiry || '' : '',
            numberLabel: 'SSP 번호', numberPlaceholder: '예: SSP-2026-001'
          }
        ].map(doc => {
          const uploaded = adetailUploadedFiles[doc.type];
          const isPdf = uploaded && /\.pdf$/i.test(uploaded);
          return `
            <div style="border:1px solid ${doc.border};background:${doc.bg};border-radius:11px;padding:13px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:11px">
                <div style="font-size:12.5px;font-weight:800;color:${doc.color}">${doc.title}</div>
                <span class="tsa-badge ${uploaded ? 'tsa-badge-success' : 'tsa-badge-gray'}">${uploaded ? '서류 등록됨' : '서류 없음'}</span>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label">진행 상태</label><select id="ad-${doc.type}-status" class="tsa-input">${renderStatusOptions(doc.status)}</select></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label">신청일</label><input id="ad-${doc.type}-applied-date" type="date" class="tsa-input" value="${doc.appliedDate}"/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label">${doc.numberLabel}</label><input id="ad-${doc.type}-number" class="tsa-input" value="${doc.number}" placeholder="${doc.numberPlaceholder}"/></div>
                <div class="tsa-form-group" style="margin:0"><label class="tsa-label">만료 예정일</label><input id="ad-${doc.type}-expiry" type="date" class="tsa-input" value="${doc.expiry}"/></div>
              </div>
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:11px;padding-top:10px;border-top:1px solid ${doc.border}">
                <div style="font-size:10px;color:#6B7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${uploaded || 'PDF 또는 이미지 파일을 등록하세요.'}</div>
                <div style="display:flex;gap:5px;flex-shrink:0">
                  <label class="tsa-btn tsa-btn-primary tsa-btn-xs" style="cursor:pointer"><i data-lucide="upload" style="width:12px;height:12px"></i> ${uploaded ? '교체' : '등록'}<input type="file" accept=".pdf,image/*" hidden onchange="handleAdetailRequiredFileUpload('${doc.type}',this)"/></label>
                  <button class="tsa-btn tsa-btn-outline tsa-btn-xs" ${uploaded ? `onclick="openAgencyRequiredFilePreview('${doc.type}', '${encodeURIComponent(uploaded)}')"` : 'disabled'} style="${uploaded ? '' : 'opacity:.45;cursor:not-allowed'}"><i data-lucide="${isPdf ? 'file-search' : 'image'}" style="width:12px;height:12px"></i> 미리보기</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-top:14px">
      <button class="tsa-btn tsa-btn-primary" onclick="saveAgencyEnrollmentFlightDocs()"><i data-lucide="check"></i> 항공편·서류 전체 저장</button>
    </div>
  `;
}

function handleAdetailRequiredFileUpload(type, input) {
  const fileName = input?.files?.[0]?.name || null;
  if (!fileName) return;
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;
  s.flightNum = document.getElementById('ad-flight-num')?.value.trim() || s.flightNum || '';
  s.arrivalDate = document.getElementById('ad-arrival-date')?.value || s.arrivalDate || '';
  s.flightTime = document.getElementById('ad-flight-time')?.value || s.flightTime || '';
  s.flightOutNum = document.getElementById('ad-flight-out-num')?.value.trim() || s.flightOutNum || '';
  s.departureDate = document.getElementById('ad-departure-date')?.value || s.departureDate || '';
  s.flightOutTime = document.getElementById('ad-flight-out-time')?.value || s.flightOutTime || '';
  captureAgencyPassportNumber(s);
  captureAgencyVisaSspFields(s);
  adetailUploadedFiles[type] = fileName;
  renderAgencyEnrollmentFlightDocs(
    s,
    document.getElementById('adetail-page-enrollment-content')
  );
  showToast(`${fileName} 파일이 선택되었습니다. 저장 버튼을 눌러주세요.`, 'success');
}

function captureAgencyPassportNumber(s) {
  if (!s) return false;
  const input = document.getElementById('ad-passport-number-new');
  const passportNumber = input?.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') || '';
  if (!passportNumber) return false;

  s.passportNum = passportNumber;
  return true;
}

function captureAgencyVisaSspFields(s) {
  if (!s) return;
  const getValue = id => document.getElementById(id)?.value.trim() || '';
  s.visaStatus = getValue('ad-visa-status') || s.visaStatus || 'not_started';
  s.visaAppliedDate = getValue('ad-visa-applied-date');
  s.visaNumber = getValue('ad-visa-number');
  s.visaExpiry = s.visaStatus === 'exempt' ? '면제' : getValue('ad-visa-expiry');
  s.sspStatus = getValue('ad-ssp-status') || s.sspStatus || 'not_started';
  s.sspAppliedDate = getValue('ad-ssp-applied-date');
  s.sspNumber = getValue('ad-ssp-number');
  s.sspExpiry = s.sspStatus === 'exempt' ? '면제' : getValue('ad-ssp-expiry');
}

function saveAgencyEnrollmentFlightDocs() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;
  const getVal = (id, fallback) => document.getElementById(id)?.value.trim() || fallback || '';
  s.flightNum = getVal('ad-flight-num', s.flightNum);
  s.arrivalDate = getVal('ad-arrival-date', s.arrivalDate);
  s.flightTime = getVal('ad-flight-time', s.flightTime);
  s.flightOutNum = getVal('ad-flight-out-num', s.flightOutNum);
  s.departureDate = getVal('ad-departure-date', s.departureDate);
  s.flightOutTime = getVal('ad-flight-out-time', s.flightOutTime);
  captureAgencyPassportNumber(s);
  captureAgencyVisaSspFields(s);
  s.requiredFiles = { ...(s.requiredFiles || {}), ...adetailUploadedFiles };
  renderAgencyEnrollmentFlightDocs(
    s,
    document.getElementById('adetail-page-enrollment-content')
  );
  if (typeof refreshIcons === 'function') refreshIcons();
  showToast('여권번호와 항공편, 비자·SSP를 포함한 서류 정보가 저장되었습니다.', 'success');
}

function openAgencyRequiredFilePreview(type, encodedFileName) {
  const fileName = decodeURIComponent(encodedFileName || '');
  if (!fileName) {
    showToast('미리 볼 파일이 없습니다.', 'warning');
    return;
  }

  const labels = { passport: '여권 사본', ticket: 'E-티켓', photo: '증명 사진', insurance: '보험증서', visa: '비자 서류', ssp: 'SSP 서류' };
  const label = labels[type] || '서류';
  const isPdf = /\.pdf$/i.test(fileName);
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(fileName);
  const modalId = 'agency-required-file-preview-modal';
  let modal = document.getElementById(modalId);

  if (!modal) {
    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'tsa-modal-backdrop';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div class="tsa-modal tsa-modal-lg" style="max-width:980px" onclick="event.stopPropagation()">
        <div class="tsa-modal-header">
          <div>
            <h3 class="tsa-modal-title" id="agency-file-preview-title">서류 미리보기</h3>
            <p class="tsa-modal-subtitle" id="agency-file-preview-subtitle"></p>
          </div>
          <button class="tsa-modal-close" onclick="closeAgencyRequiredFilePreview()"><i data-lucide="x"></i></button>
        </div>
        <div class="tsa-modal-body" id="agency-file-preview-body" style="background:#F3F4F6;padding:18px;max-height:72vh;overflow:auto"></div>
        <div class="tsa-modal-footer">
          <button class="tsa-btn tsa-btn-outline" onclick="closeAgencyRequiredFilePreview()">닫기</button>
        </div>
      </div>
    `;
    modal.addEventListener('click', closeAgencyRequiredFilePreview);
    document.body.appendChild(modal);
  }

  const titleEl = document.getElementById('agency-file-preview-title');
  const subEl = document.getElementById('agency-file-preview-subtitle');
  const bodyEl = document.getElementById('agency-file-preview-body');

  if (titleEl) titleEl.innerHTML = `<i data-lucide="${isPdf ? 'file-text' : 'image'}"></i> ${label} 미리보기`;
  if (subEl) subEl.textContent = fileName;
  if (bodyEl) {
    bodyEl.innerHTML = isImage ? `
      <div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-radius:14px;padding:24px;text-align:center;box-shadow:0 10px 30px rgba(15,23,42,.08)">
        <div style="height:420px;border:1px dashed #CBD5E1;border-radius:12px;background:linear-gradient(135deg,#EFF6FF,#F8FAFC);display:flex;align-items:center;justify-content:center;flex-direction:column;color:#64748B">
          <i data-lucide="image" style="width:54px;height:54px;margin-bottom:12px"></i>
          <div style="font-size:18px;font-weight:900;color:#334155">${label}</div>
          <div style="font-size:12px;margin-top:8px">${fileName}</div>
        </div>
        <div style="font-size:11px;color:#94A3B8;margin-top:12px">실제 파일 URL이 연결되면 이 영역에 이미지가 직접 표시됩니다.</div>
      </div>
    ` : `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:#111827;color:#fff;border-radius:12px 12px 0 0;padding:10px 14px;max-width:760px;margin:0 auto">
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800"><i data-lucide="file-text" style="width:16px;height:16px"></i> ${fileName}</div>
        <div style="font-size:11px;color:#CBD5E1">PDF 미리보기 · 1 / 1</div>
      </div>
      <div style="max-width:760px;min-height:620px;margin:0 auto;background:#fff;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;box-shadow:0 18px 40px rgba(15,23,42,.12);padding:42px 54px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111827;padding-bottom:18px;margin-bottom:34px">
          <div>
            <div style="font-size:22px;font-weight:900;color:#111827">${label}</div>
            <div style="font-size:12px;color:#64748B;margin-top:6px">Student Required Document Preview</div>
          </div>
          <div style="font-size:11px;color:#64748B;text-align:right">
            TSA LMS<br/>${new Date().toISOString().slice(0, 10)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:130px 1fr;gap:12px;font-size:13px;line-height:1.8">
          <div style="font-weight:800;color:#475569">문서 유형</div><div>${label}</div>
          <div style="font-weight:800;color:#475569">파일명</div><div>${fileName}</div>
          <div style="font-weight:800;color:#475569">상태</div><div><span class="tsa-badge tsa-badge-success">등록됨</span></div>
          <div style="font-weight:800;color:#475569">확인 메모</div><div>업로드된 PDF를 화면에서 바로 확인할 수 있는 영역입니다.</div>
        </div>
        <div style="height:280px;margin-top:38px;border:1px dashed #CBD5E1;border-radius:12px;background:#F8FAFC;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#64748B">
          <i data-lucide="file-search" style="width:58px;height:58px;margin-bottom:12px"></i>
          <div style="font-size:15px;font-weight:900;color:#334155">PDF 페이지 미리보기</div>
          <div style="font-size:11px;margin-top:7px">실제 파일 URL이 연결되면 이 영역은 PDF iframe으로 교체됩니다.</div>
        </div>
      </div>
    `;
  }

  modal.style.display = 'flex';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeAgencyRequiredFilePreview() {
  const modal = document.getElementById('agency-required-file-preview-modal');
  if (modal) modal.style.display = 'none';
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
  const baseStudent = MOCK_STUDENTS.find(std => std.id === targetId);
  const container = document.getElementById(containerId);
  if (!baseStudent || !container) return;
  const selectedEnrollment = containerId === 'adetail-page-enrollment-content'
    ? getSelectedStudentEnrollment(baseStudent)
    : null;
  const s = selectedEnrollment
    ? { ...baseStudent, ...selectedEnrollment, id: baseStudent.id }
    : baseStudent;

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

    adpProfilePhotoData = null;
    html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px">
        <div style="grid-column:span 2;display:flex;align-items:center;gap:14px;padding:12px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:10px">
          <div id="adp-profile-photo-preview" style="width:76px;height:88px;border-radius:10px;overflow:hidden;border:1px solid #DDE3EC;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <img src="${s.profilePhoto || (s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png')}" style="width:100%;height:100%;object-fit:cover" alt="학생 사진 미리보기"/>
          </div>
          <div style="flex:1">
            <div style="font-size:11.5px;font-weight:800;color:#374151;margin-bottom:4px">학생 증명사진</div>
            <div id="adp-profile-photo-name" style="font-size:10px;color:#9CA3AF;margin-bottom:8px">${s.profilePhoto ? '등록된 사진 있음' : '등록된 사진 없음'}</div>
            <button type="button" class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="document.getElementById('adp-profile-photo').click()"><i data-lucide="image-plus"></i> 사진 선택</button>
            <input id="adp-profile-photo" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" onchange="previewAdetailStudentPhoto(this)"/>
            <div style="font-size:9.5px;color:#9CA3AF;margin-top:6px">JPG, PNG, WEBP 이미지 등록 가능</div>
          </div>
        </div>
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
    const courseSegments = Array.isArray(s.segments) && s.segments.length
      ? s.segments
      : [{
          course: s.course || '코스 미등록',
          duration: Number(s.duration || 0),
          startDate: s.startDate || '',
          endDate: s.endDate || '',
          recommendedLevels: s.level && s.level !== '-' ? [s.level] : [],
          tuitionAmount: Number(s.tuitionAmount || 0),
        }];
    const totalWeeks = courseSegments.reduce((sum, segment) => sum + Number(segment.duration || 0), 0);
    const totalTuition = courseSegments.reduce((sum, segment) => sum + Number(segment.tuitionAmount || 0), 0);

    html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px">
        <div style="grid-column:span 2;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px">
          <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <div style="font-size:10.5px;color:#6B7280;font-weight:700">전체 수강 기간</div>
            <div style="font-size:12px;color:#111827;font-weight:800;margin-top:5px">${fmtDate(s.startDate)} ~ ${fmtDate(s.endDate)}</div>
          </div>
          <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <div style="font-size:10.5px;color:#6B7280;font-weight:700">수강 구성</div>
            <div style="font-size:12px;color:#111827;font-weight:800;margin-top:5px">총 ${totalWeeks}주 · ${courseSegments.length}개 구간</div>
          </div>
          <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <div style="font-size:10.5px;color:#6B7280;font-weight:700">등록 상태</div>
            <div style="margin-top:5px"><span class="tsa-badge ${s.status === 'current' ? 'tsa-badge-success' : s.status === 'completed' ? 'tsa-badge-gray' : 'tsa-badge-warning'}">${getEnrollmentStatusLabel(s.status)}</span></div>
          </div>
          <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <div style="font-size:10.5px;color:#6B7280;font-weight:700">수강료</div>
            <div style="font-size:12px;color:#111827;font-weight:900;margin-top:5px">${totalTuition ? formatCourseRegMoney(totalTuition) : '-'}</div>
          </div>
        </div>
        <div class="tsa-form-group" style="grid-column:span 2;padding:12px 14px;border:1px solid #C7D2FE;border-radius:10px;background:#F8F9FF">
          <label class="tsa-label" style="color:#3730A3">송금 경로</label>
          <select id="ad-remittance-route" class="tsa-input" style="max-width:260px;background:#fff" onchange="updateStudentRemittanceRoute(${baseStudent.id}, this.value, '상세')">
            ${renderRemittanceRouteOptions(s.remittanceRoute || baseStudent.remittanceRoute)}
          </select>
          <div style="font-size:10.5px;color:#6B7280;margin-top:5px">에이전시 / 직접 송금 / 현장 결제를 구분해 커미션 및 정산 오류를 방지합니다.</div>
        </div>
        <div style="grid-column:span 2;border:1px solid #E5E7EB;border-radius:12px;padding:14px;background:#fff">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-size:13px;font-weight:800;color:#111827">수강 구간</div>
            <span style="font-size:10.5px;color:#6B7280">등록 당시 선택한 과정과 기간</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${courseSegments.map((segment, index) => `
              <div style="display:grid;grid-template-columns:32px minmax(0,1fr) 90px 120px;gap:10px;align-items:center;padding:10px 12px;border-top:${index ? '1px solid #EEF0F4' : '0'}">
                <div style="width:26px;height:26px;border-radius:50%;background:#EEF2FF;color:#4338CA;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900">${index + 1}</div>
                <div>
                  <div style="font-size:12.5px;font-weight:800;color:#111827">${segment.course || '-'}</div>
                  <div style="font-size:10.5px;color:#6B7280;margin-top:3px">${fmtDate(segment.startDate)} ~ ${fmtDate(segment.endDate)} · 추천 레벨 ${(segment.recommendedLevels || []).join(', ') || '-'}</div>
                </div>
                <div style="font-size:11.5px;font-weight:800;color:#374151">${segment.duration || 0}주</div>
                <div style="text-align:right;font-size:12px;font-weight:900;color:#111827">${segment.tuitionAmount ? formatCourseRegMoney(segment.tuitionAmount) : '-'}</div>
              </div>
            `).join('')}
          </div>
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
      </div>
    `;
  } else if (tab === 'settle') {
    const prices = calculatePrices(s);
    const billingBreakdown = getStudentBillingBreakdown(s);

    const crHistoryHtml = '';

    const localFeesHtml = '';

    html = `
      <div style="padding:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:14px;background:#FAFAFA">
            <div style="font-weight:700;font-size:12.5px;color:#1E3A8A;margin-bottom:8px">항목별 청구 금액 · 납부 여부 · 커미션 지급 여부</div>
            <div style="display:grid;grid-template-columns:1fr;gap:8px;font-size:11.5px;margin-bottom:10px">
              ${billingBreakdown.items.map(item => `
                <div style="display:grid;grid-template-columns:96px 1fr 76px 150px 80px;gap:10px;align-items:center;background:#fff;border:1px solid #E5E7EB;border-radius:8px;padding:9px 10px">
                  <div>
                    <div style="font-weight:800;color:#374151">${item.label}</div>
                    <div style="font-size:10px;color:#9CA3AF">${item.key === 'registration' ? '학생 등록 시 1회' : item.key === 'education' ? '수강 과정 기준' : item.key === 'dorm' ? '기숙사 배정 기준' : '기타 현지 비용'}</div>
                  </div>
                  <div style="text-align:right;font-weight:900;color:#111827">$${item.amount.toLocaleString()}</div>
                  <div style="text-align:right">${renderAgencyPaidBadge(item.paymentStatus)}</div>
                  <div style="text-align:right;color:${item.commission > 0 ? '#4F46E5' : '#9CA3AF'};font-weight:800">
                    ${item.commissionType === 'none' ? '커미션 없음' : item.commissionType === 'fixed' ? '정액' : `${Math.round(item.commissionRate * 100)}%`} · $${item.commission.toLocaleString()}
                  </div>
                  <div style="text-align:right">${item.commission > 0 ? renderAgencyCommissionBadge(item.commissionStatus) : '<span style="font-size:10px;color:#9CA3AF">-</span>'}</div>
                </div>
              `).join('')}
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11.5px">
              <div style="border-top:1px solid #E5E7EB;grid-column:span 2;padding-top:6px;font-size:12px;color:#1E1B4B"><strong>어학원 송금액 합계:</strong> <strong style="float:right">$${billingBreakdown.net.toLocaleString()}</strong></div>
              <div style="color:#4F46E5">커미션 합계:</div><div style="text-align:right;color:#4F46E5">$${billingBreakdown.commission.toLocaleString()}</div>
              <div style="border-top:1.5px dashed #818CF8;grid-column:span 2;padding-top:6px"><strong>청구 금액 합계:</strong> <strong style="float:right">$${billingBreakdown.gross.toLocaleString()}</strong></div>
            </div>
            <div style="font-size:10.5px;color:#6B7280;margin-top:10px;background:#EFF6FF;padding:8px;border-radius:6px">
              ※ 커미션은 에이전시 관리에서 등록금·수강료·기숙사비·기타 비용별로 설정한 기준을 적용합니다.
            </div>
          </div>

          <div style="border-left:1px solid #CBD5E1;padding:0 0 0 18px;min-width:0">
            <div style="display:flex;gap:4px;border-bottom:1px solid #E5E7EB;margin-bottom:12px;overflow-x:auto" id="agency-inline-doc-tabs">
              <button type="button" data-inline-doc-tab="invoice" onclick="renderAgencyInlineDocument(${s.id}, 'invoice')" style="border:0;background:none;padding:8px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer">공식 인보이스 (Invoice)</button>
              <button type="button" data-inline-doc-tab="loa" onclick="renderAgencyInlineDocument(${s.id}, 'loa')" style="border:0;background:none;padding:8px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer">입학 허가서 (LOA)</button>
              <button type="button" data-inline-doc-tab="invitation" onclick="renderAgencyInlineDocument(${s.id}, 'invitation')" style="border:0;background:none;padding:8px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer">초청장 (Invitation)</button>
              <button type="button" data-inline-doc-tab="pickup" onclick="renderAgencyInlineDocument(${s.id}, 'pickup')" style="border:0;background:none;padding:8px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer">공항 픽업 확인서</button>
            </div>
            <div style="height:520px;overflow:auto;border:1px solid #E9EDF4;border-radius:10px;background:#FAFAFA">
              <div id="agency-inline-doc-content" style="zoom:.68;padding:20px;min-height:700px;position:relative;overflow:hidden"></div>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
              <button class="tsa-btn tsa-btn-outline tsa-btn-sm" type="button" onclick="openAgencyDocumentsInline(${s.id}, APP.selectedInvoiceTab || 'invoice')">크게 보기</button>
              <button class="tsa-btn tsa-btn-primary tsa-btn-sm" type="button" onclick="printAgencyInlineDocument()"><i data-lucide="printer"></i> 인쇄하기 (Print)</button>
            </div>
          </div>
          ${localFeesHtml}

          <!-- 송금 명세서 제출 섹션 (어드민은 미표시, 에이전시만 노출) -->
          ${isAgency ? `
          <div style="border:1px solid #C7D2FE;border-radius:10px;padding:16px;background:#F8F9FF;grid-column:span 2;margin-top:4px">
            <div style="font-weight:700;font-size:12.5px;color:#3730A3;margin-bottom:12px">💸 납부 내역 등록</div>
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

          <!-- 납부 내역 관리 -->
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:16px;background:#FAFAFA;grid-column:span 2;margin-top:4px">
            <div style="font-weight:700;font-size:12.5px;color:#1E3A8A;margin-bottom:10px">📋 납부 내역 관리</div>
            ${renderAgencyPaymentSummary(s, billingBreakdown)}
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
                return `<div style="text-align:center;padding:18px;color:#9CA3AF;font-size:12px">제출된 B2B 송금 명세서가 없습니다.</div>`;
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
                    <th style="text-align:center">납부 상태</th>
                    <th>확인 담당자</th>
                    <th style="text-align:center">동작</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.map((r, i) => {
                    const badge = r.status === 'approved'
                      ? renderAgencyPaidBadge('paid')
                      : renderAgencyPaidBadge('unpaid');
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
    const isCurrentEnrollment = !selectedEnrollment || String(selectedEnrollment.id) === 'current';
    if (isCurrentEnrollment) {
      MOCK_DORM_ROOMS.forEach(r => {
        if (r.beds) r.beds.forEach(b => {
          if (b.studentId === s.id) { assignedRoom = r; assignedBed = b; }
        });
      });
    }
    if (isCurrentEnrollment && !assignedRoom && s.dorm && s.dorm !== '미배정') {
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
      <div style="padding:18px;background:#FFFBEB;border-radius:10px;border:1px dashed #F59E0B;text-align:center;color:#92400E;font-size:12px">
        <div style="font-size:22px;margin-bottom:6px">⏳</div>
        <div style="font-weight:800">어학원 기숙사 배정 대기 중</div>
        <div style="font-size:10.5px;color:#B45309;margin-top:4px">희망 조건을 기준으로 호실과 침대(Bed)가 배정되면 이곳에 표시됩니다.</div>
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
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
          <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <div style="font-size:10.5px;color:#6B7280;font-weight:700">배정 상태</div>
            <div style="font-size:12px;font-weight:800;margin-top:5px;color:${s.dormEnabled === false ? '#D97706' : assignedRoom ? '#047857' : '#D97706'}">${s.dormEnabled === false ? 'Walk-in' : assignedRoom ? '배정 완료' : '배정 대기'}</div>
          </div>
          <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <div style="font-size:10.5px;color:#6B7280;font-weight:700">신청 기간</div>
            <div style="font-size:12px;color:#111827;font-weight:800;margin-top:5px">${s.dormEnabled === false ? '-' : `${fmtDate(s.dormIn)} ~ ${fmtDate(s.dormOut)}`}</div>
          </div>
          <div style="padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <div style="font-size:10.5px;color:#6B7280;font-weight:700">신청 비용</div>
            <div style="font-size:12px;color:#111827;font-weight:900;margin-top:5px">${s.dormEnabled === false ? '-' : s.dormAmount ? formatCourseRegMoney(s.dormAmount) : '금액 확인 중'}</div>
          </div>
        </div>
        ${s.dormEnabled === false ? `
          <div style="padding:28px;background:#F9FAFB;border-radius:10px;border:1px dashed #D1D5DB;text-align:center;color:#6B7280;font-size:12px">
            <strong style="color:#D97706">Walk-in</strong><br/><span style="font-size:10.5px">이 수강 등록 건에는 기숙사 이용이 포함되지 않았습니다.</span>
          </div>
        ` : `
        <div style="padding:14px;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="font-size:12px;font-weight:800;color:#374151">기숙사 신청 정보</div><span class="tsa-badge" style="background:#EEF2FF;color:#4F46E5">희망 조건</span></div>
          ${isLocked ? `
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
            <div style="padding:10px 12px;background:#F8FAFC;border-radius:8px"><div style="font-size:9.5px;color:#9CA3AF">숙소 유형</div><div style="font-size:12px;font-weight:800;color:#374151;margin-top:4px">${s.dormAccomType || '미선택'}</div></div>
            <div style="padding:10px 12px;background:#F8FAFC;border-radius:8px"><div style="font-size:9.5px;color:#9CA3AF">인실 기준</div><div style="font-size:12px;font-weight:800;color:#374151;margin-top:4px">${s.dormType || '미선택'}</div></div>
            <div style="padding:10px 12px;background:#F8FAFC;border-radius:8px"><div style="font-size:9.5px;color:#9CA3AF">등급</div><div style="font-size:12px;font-weight:800;color:#374151;margin-top:4px">${s.dormGrade || '미선택'}</div></div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="padding:10px 12px;background:#F8FAFC;border-radius:8px"><div style="font-size:9.5px;color:#9CA3AF">입실 희망일</div><div style="font-size:12px;font-weight:700;color:#374151;margin-top:4px">${fmtDate(s.dormIn || s.startDate) || '-'}</div></div>
            <div style="padding:10px 12px;background:#F8FAFC;border-radius:8px"><div style="font-size:9.5px;color:#9CA3AF">퇴실 희망일</div><div style="font-size:12px;font-weight:700;color:#374151;margin-top:4px">${fmtDate(s.dormOut || s.departureDate) || '-'}</div></div>
          </div>
          <div style="font-size:10px;color:#9CA3AF;margin-top:9px">※ 신청 정보이며 실제 호실·침대 배정 정보와 다를 수 있습니다.</div>
          ` : `
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
                ${s.dormAccomType ? [...new Set(MOCK_DORM_TEMPLATES.filter(t=>t.accomType===s.dormAccomType).map(t=>t.capacity+'인실'))].map(v=>`<option value="${v}" ${parseInt(s.dormType, 10)===parseInt(v, 10)?'selected':''}>${v}</option>`).join('') : ''}
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
          `}
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.04em;margin-bottom:8px">실제 배정 숙소</div>
          ${currentStatus}
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:#6B7280;letter-spacing:0.04em;margin-bottom:8px">배정 이력</div>
          <div style="display:flex;flex-direction:column;gap:6px">${historyRows}</div>
        </div>
        `}
      </div>`;
  }

  container.innerHTML = html;
  if (tab === 'settle') {
    setTimeout(() => renderAgencyInlineDocument(s.id, 'invoice'), 0);
  }
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
    showToast('✅ 송금 명세서가 수정되었습니다.', 'success');
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
    showToast('✅ 송금 명세서가 제출되어 완납 처리되었습니다.', 'success');
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
  if (adpProfilePhotoData) s.profilePhoto = adpProfilePhotoData;

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
  const detailModal = document.getElementById('agency-student-detail-modal');
  if (detailModal && detailModal.style.display !== 'none') {
    closeModal('agency-student-detail-modal');
  } else if (document.getElementById('view-agency-student-detail')?.classList.contains('active')) {
    renderAgencyStudentDetailPageHeader(s);
    switchAgencyStudentDetailPageTab(currentAdetailTab === 'basic' ? 'basic' : 'enrollment');
  }
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

function setSelectedInvoiceStudent(id) {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return null;
  APP.selectedInvoiceStudent = {
    name: `${s.name} (${s.nick})`,
    course: s.course.split(' ')[0],
    dorm: s.dorm.split(' ')[0],
    duration: `${s.duration}주`,
    status: s.status,
    total: s.fees.reduce((sum, fee) => sum + fee.amount, 0),
    branch: s.branch || '강남지사'
  };
  return s;
}

function renderAgencyInlineDocument(id, tab = 'invoice') {
  if (!setSelectedInvoiceStudent(id)) return;
  switchInvoiceTab(tab);

  const source = document.getElementById('invoice-modal-content');
  const target = document.getElementById('agency-inline-doc-content');
  if (!source || !target) return;

  target.innerHTML = source.innerHTML;
  target.style.position = 'relative';
  target.style.overflow = 'hidden';
  document.querySelectorAll('[data-inline-doc-tab]').forEach(button => {
    const active = button.dataset.inlineDocTab === tab;
    button.style.color = active ? '#4F46E5' : '#6B7280';
    button.style.borderBottom = active ? '2px solid #5E5CE6' : '2px solid transparent';
  });
  APP.selectedInvoiceTab = tab;
  if (typeof refreshIcons === 'function') refreshIcons();
}

function printAgencyInlineDocument() {
  const content = document.getElementById('agency-inline-doc-content');
  if (!content) return;
  const printWindow = window.open('', '_blank', 'width=960,height=900');
  if (!printWindow) {
    showToast('인쇄 창을 열 수 없어. 브라우저 팝업 허용을 확인해줘.', 'warning');
    return;
  }
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>TalkStation Academy Document</title><style>body{margin:0;padding:24px;font-family:Pretendard,Arial,sans-serif;color:#111827;background:#fff}*{box-sizing:border-box}@media print{body{padding:0}}</style></head><body>${content.innerHTML}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 200);
}

const MOCK_PICKUP_MANAGERS = [
  { id: 1, name: 'Juan Dela Cruz', phone: '+63 917 123 4567', gender: '남', age: 38, messenger: 'WhatsApp: +63 917 123 4567', photo: 'assets/images/teacher_male.png', visible: true },
  { id: 2, name: 'Maria Santos', phone: '+63 922 456 7890', gender: '여', age: 34, messenger: 'KakaoTalk: tsa_pickup02', photo: 'assets/images/teacher_female.png', visible: true },
];

const MOCK_PICKUP_VEHICLES = [
  { id: 1, model: 'Toyota Innova', plate: 'ABC 1234', capacity: 6, memo: 'Silver', active: true },
  { id: 2, model: 'Hyundai Staria', plate: 'XYZ 9087', capacity: 9, memo: 'White', active: true },
];

const PICKUP_DATE_ASSIGNMENTS = {};
const PICKUP_DISPATCH_GROUPS = {};
let pickupSelectedStudentIds = [];

function getPickupDispatchGroups(dateKey) {
  return PICKUP_DISPATCH_GROUPS[dateKey] || [];
}

function getPickupManagerIdsForDate(dateKey) {
  return [...new Set((PICKUP_DATE_ASSIGNMENTS[dateKey] || []).map(Number).filter(Boolean))];
}

function getPickupManagersForDate(dateKey) {
  const ids = getPickupManagerIdsForDate(dateKey);
  return ids.map(id => MOCK_PICKUP_MANAGERS.find(manager => manager.id === id && manager.visible !== false)).filter(Boolean);
}

function getPickupManagersForStudent(student) {
  if (!student) return [];
  const dateKey = student.arrivalDate || student.startDate;
  const dispatchManagers = getPickupDispatchGroups(dateKey)
    .filter(group => group.studentIds.includes(student.id) && group.managerId)
    .map(group => MOCK_PICKUP_MANAGERS.find(manager => manager.id === Number(group.managerId)))
    .filter(Boolean);
  if (dispatchManagers.length) return [...new Map(dispatchManagers.map(manager => [manager.id, manager])).values()];
  return getPickupManagersForDate(student.arrivalDate || student.startDate);
}

function initPickupManagerView() {
  renderPickupManagerCards();
  if (!APP.pickupDateAssignmentsInitialized) {
    getPickupStudents().forEach(student => {
      const dateKey = student.arrivalDate || student.startDate;
      if (student.pickupManagerId) {
        const currentIds = PICKUP_DATE_ASSIGNMENTS[dateKey] || [];
        PICKUP_DATE_ASSIGNMENTS[dateKey] = [...new Set([...currentIds, Number(student.pickupManagerId)])];
      }
    });
    APP.pickupDateAssignmentsInitialized = true;
  }
  if (!APP.pickupCalendarMonth) {
    const today = new Date();
    APP.pickupCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    APP.pickupSelectedDate = toPickupDateKey(today);
  }
  renderPickupCalendar();
}

function renderPickupManagerCards() {
  const target = document.getElementById('pickup-manager-cards');
  if (!target) return;
  target.innerHTML = MOCK_PICKUP_MANAGERS.map(manager => `
    <div class="tsa-card" style="padding:16px;display:flex;gap:14px;align-items:center">
      <img src="${manager.photo || 'assets/images/teacher_male.png'}" style="width:66px;height:76px;border-radius:10px;object-fit:cover;border:1px solid #E5E7EB" alt=""/>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:7px"><b style="font-size:14px;color:#111827">${manager.name}</b><span class="tsa-badge tsa-badge-success" style="font-size:9.5px">확인서 자동 노출</span></div>
        <div style="font-size:11px;color:#4B5563;margin-top:6px">${manager.phone}</div>
        <div style="font-size:10.5px;color:#6B7280;margin-top:3px">${manager.gender || '-'}성 · ${manager.age ? manager.age + '세' : '나이 미등록'}</div>
        <div style="font-size:10px;color:#9CA3AF;margin-top:3px">${manager.messenger || '-'}</div>
      </div>
      <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openPickupManagerModal(${manager.id})">수정</button>
    </div>
  `).join('');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function toPickupDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPickupStudents() {
  return MOCK_STUDENTS.filter(student =>
    ['waiting', 'current', 'extended'].includes(student.status) && (student.arrivalDate || student.startDate)
  );
}

function renderPickupCalendar() {
  const grid = document.getElementById('pickup-calendar-grid');
  const weekdays = document.getElementById('pickup-calendar-weekdays');
  const title = document.getElementById('pickup-calendar-title');
  if (!grid || !weekdays || !title) return;
  const month = APP.pickupCalendarMonth;
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  title.textContent = `${year}년 ${monthIndex + 1}월`;
  weekdays.innerHTML = ['일', '월', '화', '수', '목', '금', '토'].map((day, index) =>
    `<div style="padding:10px;text-align:center;font-size:10.5px;font-weight:800;color:${index === 0 ? '#EF4444' : index === 6 ? '#3B82F6' : '#6B7280'}">${day}</div>`
  ).join('');

  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();
  const totalCells = 42;
  const students = getPickupStudents();
  const todayKey = toPickupDateKey(new Date());
  const cells = [];
  for (let cell = 0; cell < totalCells; cell += 1) {
    const dayOffset = cell - firstDay + 1;
    let cellDate;
    let muted = false;
    if (dayOffset < 1) {
      cellDate = new Date(year, monthIndex - 1, previousMonthDays + dayOffset);
      muted = true;
    } else if (dayOffset > daysInMonth) {
      cellDate = new Date(year, monthIndex + 1, dayOffset - daysInMonth);
      muted = true;
    } else {
      cellDate = new Date(year, monthIndex, dayOffset);
    }
    const key = toPickupDateKey(cellDate);
    const arrivals = students.filter(student => (student.arrivalDate || student.startDate) === key);
    const groups = getPickupDispatchGroups(key);
    const assignedStudentIds = new Set(groups.flatMap(group => group.studentIds));
    const managerCount = groups.filter(group => group.managerId).length;
    const pickupArrivals = arrivals.filter(isPickupRequired);
    const noPickupArrivals = arrivals.filter(student => !isPickupRequired(student));
    const unassigned = pickupArrivals.filter(student => !assignedStudentIds.has(student.id)).length;
    const pendingDispatches = groups.filter(group => group.status !== 'dispatched').length;
    const selected = APP.pickupSelectedDate === key;
    const isToday = todayKey === key;
    cells.push(`
      <button type="button" onclick="selectPickupCalendarDate('${key}')" style="appearance:none;text-align:left;min-height:82px;padding:8px;border:0;border-right:1px solid #EEF0F4;border-bottom:1px solid #EEF0F4;background:${selected ? '#EEF2FF' : '#fff'};cursor:pointer;opacity:${muted ? '.42' : '1'};box-shadow:${selected ? 'inset 0 0 0 2px #6366F1' : 'none'}">
        <span style="display:inline-flex;width:24px;height:24px;align-items:center;justify-content:center;border-radius:50%;font-size:11px;font-weight:800;background:${isToday ? '#5E5CE6' : 'transparent'};color:${isToday ? '#fff' : '#374151'}">${cellDate.getDate()}</span>
        ${arrivals.length ? `<div style="margin-top:5px;padding:5px 6px;border-radius:6px;background:${unassigned || pendingDispatches ? '#FFF7ED' : '#ECFDF5'};color:${unassigned || pendingDispatches ? '#C2410C' : '#047857'};font-size:9.5px;font-weight:800">입국 ${arrivals.length}명 · 픽업 ${pickupArrivals.length}명${noPickupArrivals.length ? ` · 불필요 ${noPickupArrivals.length}` : ''}${unassigned ? ` · 미편성 ${unassigned}` : pendingDispatches ? ` · 배차 확인 ${pendingDispatches}` : pickupArrivals.length ? ' · 배차 완료' : ''}</div>` : ''}
      </button>`);
  }
  grid.innerHTML = cells.join('');
  renderPickupDateAssignments();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderPickupDateAssignments() {
  const panel = document.getElementById('pickup-date-assignment-panel');
  if (!panel) return;
  const selectedDate = APP.pickupSelectedDate;
  const students = getPickupStudents().filter(student => (student.arrivalDate || student.startDate) === selectedDate);
  const dateLabel = selectedDate ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) : '날짜 선택';
  const groups = getPickupDispatchGroups(selectedDate);
  const assignedIds = new Set(groups.flatMap(group => group.studentIds));
  const pickupStudents = students.filter(isPickupRequired);
  const noPickupStudents = students.filter(student => !isPickupRequired(student));
  pickupSelectedStudentIds = pickupSelectedStudentIds.filter(id => pickupStudents.some(student => student.id === id) && !assignedIds.has(id));
  const unassigned = pickupStudents.filter(student => !assignedIds.has(student.id));
  const pendingGroups = groups.filter(group => group.status !== 'dispatched');
  panel.innerHTML = `
    <div style="padding:15px 16px;border-bottom:1px solid #E5E7EB;display:flex;justify-content:space-between;align-items:center;gap:12px">
      <div><b style="font-size:13px;color:#111827">${dateLabel}</b><div style="font-size:10px;color:#9CA3AF;margin-top:3px">입국 ${students.length}명 · 픽업 필요 ${pickupStudents.length}명 · 픽업 불필요 ${noPickupStudents.length}명 · 미편성 ${unassigned.length}명</div></div>
      ${students.length ? `<span class="tsa-badge ${unassigned.length || pendingGroups.length ? 'tsa-badge-warning' : 'tsa-badge-success'}">${unassigned.length ? '편성 필요' : pendingGroups.length ? '배차 정보 필요' : pickupStudents.length ? '배차 완료' : '픽업 불필요'}</span>` : ''}
    </div>
    ${students.length ? `<div style="padding:12px 16px;background:#F8FAFC;border-bottom:1px solid #E5E7EB">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="font-size:11px;color:#374151">픽업 인원 선택</b><button class="tsa-btn tsa-btn-primary tsa-btn-xs" onclick="openPickupDispatchModal('${selectedDate}')" ${pickupSelectedStudentIds.length ? '' : 'disabled'}><i data-lucide="car-front"></i> 선택 인원 배차</button></div>
      <div style="display:flex;flex-direction:column;gap:6px">${unassigned.length ? unassigned.map(student => renderPickupPassengerOption(student)).join('') : '<div style="padding:12px;text-align:center;font-size:10.5px;color:#9CA3AF">픽업이 필요한 모든 학생이 배차 그룹에 편성되었습니다.</div>'}</div>
      ${noPickupStudents.length ? `<div style="margin-top:12px;padding-top:10px;border-top:1px dashed #D1D5DB"><div style="display:flex;align-items:center;gap:6px;margin-bottom:7px"><b style="font-size:11px;color:#6B7280">픽업 불필요</b><span class="tsa-badge" style="background:#F3F4F6;color:#6B7280">옵션 미선택 ${noPickupStudents.length}명</span></div><div style="display:flex;flex-direction:column;gap:6px">${noPickupStudents.map(student => renderPickupPassengerOption(student, false)).join('')}</div></div>` : ''}
    </div>
    ${groups.length ? `<div style="padding:12px 16px"><div style="font-size:11px;font-weight:800;color:#374151;margin-bottom:8px">배차 현황</div><div style="display:grid;gap:7px">${groups.map((group, index) => renderPickupDispatchSummary(selectedDate, group, index)).join('')}</div></div>` : ''}` : `<div style="padding:90px 20px;text-align:center;color:#9CA3AF"><i data-lucide="calendar-x" style="width:28px;height:28px;margin-bottom:10px"></i><div style="font-size:12px;font-weight:700">이 날짜에 입국 예정인 학생이 없습니다.</div></div>`}`;
  if (typeof refreshIcons === 'function') refreshIcons();
}

function isPickupRequired(student) {
  if (!student) return false;
  if (typeof student.pickupRequired === 'boolean') return student.pickupRequired;
  const enrollmentExtras = Array.isArray(student.enrollments) && student.enrollments.length
    ? student.enrollments[0]?.extraItems
    : null;
  const extraItems = Array.isArray(student.extraItems) ? student.extraItems : enrollmentExtras;
  if (Array.isArray(extraItems)) {
    return extraItems.some(item => /공항\s*픽업|Airport\s*Pickup/i.test(typeof item === 'string' ? item : item?.name || ''));
  }
  return true;
}

function renderPickupPassengerOption(student, selectable = true) {
  const checked = pickupSelectedStudentIds.includes(student.id);
  const time = student.flightTime || '시간 미정';
  const avatar = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
  const agency = typeof MOCK_AGENCIES !== 'undefined' ? MOCK_AGENCIES.find(item => item.name === student.agency) : null;
  return `<label style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:${selectable ? (checked ? '#F5F3FF' : '#fff') : '#F9FAFB'};border:1px solid ${selectable && checked ? '#818CF8' : '#E5E7EB'};border-radius:9px;cursor:${selectable ? 'pointer' : 'default'};opacity:${selectable ? '1' : '.82'}">
    ${selectable ? `<input type="checkbox" style="margin-top:13px" ${checked ? 'checked' : ''} onchange="togglePickupPassenger(${student.id}, this.checked)"/>` : '<span style="margin-top:8px;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#E5E7EB;color:#6B7280;font-size:11px;font-weight:900;flex-shrink:0">−</span>'}
    <img src="${avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0" alt=""/>
    <div style="flex:1;min-width:0">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><div style="display:flex;align-items:center;gap:6px"><b style="font-size:11px;color:#111827">${student.name}</b>${selectable ? '' : '<span class="tsa-badge" style="background:#F3F4F6;color:#6B7280;font-size:8.5px">픽업 불필요</span>'}</div><span style="font-size:9px;color:#6B7280">${student.nationality || '-'} · ${student.gender || '-'}성 · ${student.age || '-'}세</span></div>
      <div style="font-size:9.5px;color:#9CA3AF;margin-top:2px">Nick: ${student.nick || '-'} · ${student.phone || '연락처 미등록'} · ${student.email || '이메일 미등록'}</div>
      <div style="margin-top:6px;padding:6px 7px;background:#F8FAFC;border-radius:6px;display:grid;grid-template-columns:1fr 1fr;gap:3px 8px;font-size:9.2px;color:#6B7280">
        <div><b style="color:#4B5563">에이전시</b> ${student.agency || '-'}</div>
        <div><b style="color:#4B5563">담당자</b> ${agency?.contact || '-'}</div>
        <div><b style="color:#4B5563">컨택</b> ${agency?.phone || '-'}</div>
        <div><b style="color:#4B5563">이메일</b> ${agency?.email || '-'}</div>
      </div>
      <div style="font-size:9.5px;color:#4F46E5;margin-top:6px"><i data-lucide="plane" style="width:11px;height:11px;vertical-align:-2px;margin-right:3px"></i>${student.flightInfo || '항공편 미등록'} · 입국 ${time}</div>
    </div>
  </label>`;
}

function togglePickupPassenger(studentId, checked) {
  const student = MOCK_STUDENTS.find(item => item.id === studentId);
  if (!isPickupRequired(student)) return;
  if (checked) pickupSelectedStudentIds = [...new Set([...pickupSelectedStudentIds, studentId])];
  else pickupSelectedStudentIds = pickupSelectedStudentIds.filter(id => id !== studentId);
  renderPickupDateAssignments();
}

function renderPickupDispatchSummary(dateKey, group, index) {
  const students = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
  const manager = MOCK_PICKUP_MANAGERS.find(item => item.id === Number(group.managerId));
  const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === Number(group.vehicleId));
  return `<div style="display:flex;align-items:center;gap:9px;padding:9px 10px;border:1px solid ${group.status === 'dispatched' ? '#A7F3D0' : '#FDE68A'};background:${group.status === 'dispatched' ? '#F0FDF4' : '#FFFBEB'};border-radius:9px">
    <div style="flex:1;min-width:0"><div style="font-size:10.5px;font-weight:800;color:#111827">배차 ${index + 1} · 탑승 ${students.length}명</div><div style="font-size:9.5px;color:#6B7280;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${students.map(student => student.name).join(', ')} · ${manager?.name || '담당자 미지정'} · ${vehicle ? `${vehicle.model} / ${vehicle.plate}` : '차량 미지정'}</div></div>
    <span class="tsa-badge ${group.status === 'dispatched' ? 'tsa-badge-success' : 'tsa-badge-warning'}">${group.status === 'dispatched' ? '배차 완료' : '배차 필요'}</span>
    <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openPickupDispatchModal('${dateKey}', ${group.id})">보기/수정</button>
  </div>`;
}

function openPickupDispatchModal(dateKey, groupId) {
  const group = groupId ? getPickupDispatchGroups(dateKey).find(item => item.id === Number(groupId)) : null;
  const studentIds = group ? [...group.studentIds] : [...pickupSelectedStudentIds];
  if (!studentIds.length) return;
  const students = studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
  document.getElementById('pickup-dispatch-date').value = dateKey;
  document.getElementById('pickup-dispatch-group-id').value = group?.id || '';
  document.getElementById('pickup-dispatch-student-ids').value = studentIds.join(',');
  document.getElementById('pickup-dispatch-modal-title').textContent = group ? `배차 ${getPickupDispatchGroups(dateKey).indexOf(group) + 1} 정보 수정` : `선택 인원 배차 · ${students.length}명`;
  document.getElementById('pickup-dispatch-selected-students').innerHTML = students.map(student => renderPickupDispatchStudentInfo(student)).join('');
  document.getElementById('pickup-dispatch-modal-manager').innerHTML = `<option value="">담당자 선택</option>${MOCK_PICKUP_MANAGERS.map(manager => `<option value="${manager.id}" ${Number(group?.managerId) === manager.id ? 'selected' : ''}>${manager.name} · ${manager.phone}</option>`).join('')}`;
  document.getElementById('pickup-dispatch-modal-vehicle').innerHTML = `<option value="">등록 차량 선택</option>${MOCK_PICKUP_VEHICLES.filter(vehicle => vehicle.active !== false).map(vehicle => `<option value="${vehicle.id}" ${Number(group?.vehicleId) === vehicle.id ? 'selected' : ''} ${Number(vehicle.capacity) < students.length ? 'disabled' : ''}>${vehicle.model} · ${vehicle.plate} · ${vehicle.capacity}인승${Number(vehicle.capacity) < students.length ? ' (정원 부족)' : ''}</option>`).join('')}`;
  document.getElementById('pickup-dispatch-delete-btn').style.display = group ? '' : 'none';
  updatePickupDispatchModalVehicleInfo();
  openModal('pickup-dispatch-modal');
  if (typeof refreshIcons === 'function') refreshIcons();
}

function updatePickupDispatchModalVehicleInfo() {
  const vehicleId = Number(document.getElementById('pickup-dispatch-modal-vehicle')?.value || 0);
  const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === vehicleId);
  const info = document.getElementById('pickup-dispatch-modal-vehicle-info');
  if (info) info.innerHTML = vehicle ? `<b>${vehicle.model}</b> · ${vehicle.plate} · ${vehicle.capacity}인승${vehicle.memo ? ` · ${vehicle.memo}` : ''}` : '차량 관리에서 사전 등록한 차량을 선택해줘.';
}

function savePickupDispatchModal() {
  const dateKey = document.getElementById('pickup-dispatch-date').value;
  const groupId = Number(document.getElementById('pickup-dispatch-group-id').value || 0);
  const studentIds = document.getElementById('pickup-dispatch-student-ids').value.split(',').map(Number).filter(Boolean);
  const managerId = Number(document.getElementById('pickup-dispatch-modal-manager').value || 0);
  const vehicleId = Number(document.getElementById('pickup-dispatch-modal-vehicle').value || 0);
  const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === vehicleId && item.active !== false);
  if (!managerId || !vehicle) return showToast('픽업 담당자와 등록 차량을 선택해줘.', 'warning');
  if (Number(vehicle.capacity) < studentIds.length) return showToast(`탑승 ${studentIds.length}명보다 큰 정원의 차량을 선택해줘.`, 'warning');
  const groups = getPickupDispatchGroups(dateKey);
  let group = groupId ? groups.find(item => item.id === groupId) : null;
  if (!group) {
    group = { id: Date.now(), studentIds };
    groups.push(group);
    PICKUP_DISPATCH_GROUPS[dateKey] = groups;
  }
  Object.assign(group, { studentIds, managerId, vehicleId, vehicleCapacity: Number(vehicle.capacity), vehicleModel: vehicle.model, vehiclePlate: vehicle.plate, status: 'dispatched' });
  pickupSelectedStudentIds = pickupSelectedStudentIds.filter(id => !studentIds.includes(id));
  closeModal('pickup-dispatch-modal');
  renderPickupCalendar();
  showToast(groupId ? '배차 정보가 수정되었습니다.' : `${studentIds.length}명 차량 배차가 등록되었습니다.`, 'success');
}

function deletePickupDispatchFromModal() {
  const dateKey = document.getElementById('pickup-dispatch-date').value;
  const groupId = Number(document.getElementById('pickup-dispatch-group-id').value || 0);
  if (!groupId) return;
  closeModal('pickup-dispatch-modal');
  removePickupDispatchGroup(dateKey, groupId);
}

function renderPickupDispatchCard(dateKey, group, index) {
  const students = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
  const capacityWarning = Number(group.vehicleCapacity) < students.length;
  const selectedVehicle = MOCK_PICKUP_VEHICLES.find(vehicle => vehicle.id === Number(group.vehicleId))
    || MOCK_PICKUP_VEHICLES.find(vehicle => group.vehiclePlate && vehicle.plate.toLowerCase() === String(group.vehiclePlate).toLowerCase());
  if (selectedVehicle && !group.vehicleId) group.vehicleId = selectedVehicle.id;
  const vehicleOptions = MOCK_PICKUP_VEHICLES.filter(vehicle => vehicle.active !== false).map(vehicle => {
    const insufficient = Number(vehicle.capacity) < students.length;
    return `<option value="${vehicle.id}" ${Number(group.vehicleId) === vehicle.id ? 'selected' : ''} ${insufficient ? 'disabled' : ''}>${vehicle.model} · ${vehicle.plate} · ${vehicle.capacity}인승${insufficient ? ' (정원 부족)' : ''}</option>`;
  }).join('');
  return `<div style="border:1px solid ${capacityWarning ? '#FCA5A5' : group.status === 'dispatched' ? '#86EFAC' : '#DDE3EC'};border-radius:10px;padding:12px;margin-bottom:10px;background:#fff">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div><b style="font-size:11px;color:#111827">배차 ${index + 1} · 탑승 ${students.length}명</b>${group.status === 'dispatched' ? '<span class="tsa-badge tsa-badge-success" style="margin-left:6px">등록 완료</span>' : ''}</div><button class="tsa-btn tsa-btn-outline tsa-btn-xs" style="color:#EF4444" onclick="removePickupDispatchGroup('${dateKey}', ${group.id})"><i data-lucide="trash-2"></i></button></div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:11px">${students.map(student => renderPickupDispatchStudentInfo(student)).join('')}</div>
    <div style="display:grid;grid-template-columns:1fr 1.35fr;gap:8px;margin-bottom:8px">
      <div><label class="tsa-label" style="font-size:9.5px">픽업 담당자</label><select id="pickup-dispatch-manager-${group.id}" class="tsa-input" style="height:36px;font-size:10.5px"><option value="">담당자 선택</option>${MOCK_PICKUP_MANAGERS.map(manager => `<option value="${manager.id}" ${Number(group.managerId) === manager.id ? 'selected' : ''}>${manager.name}</option>`).join('')}</select></div>
      <div><label class="tsa-label" style="font-size:9.5px">등록 차량 선택</label><select id="pickup-dispatch-vehicle-${group.id}" class="tsa-input" style="height:36px;font-size:10.5px"><option value="">차량 선택</option>${vehicleOptions}</select></div>
    </div>
    <div style="padding:8px 10px;margin-bottom:9px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:7px;font-size:9.5px;color:#6B7280">${selectedVehicle ? `<b style="color:#374151">${selectedVehicle.model}</b> · ${selectedVehicle.plate} · ${selectedVehicle.capacity}인승${selectedVehicle.memo ? ` · ${selectedVehicle.memo}` : ''}` : '차량 관리에서 사전 등록한 차량을 선택해줘.'}</div>
    ${capacityWarning ? '<div style="font-size:9.5px;color:#DC2626;margin-bottom:7px">탑승 인원보다 큰 차량을 선택해줘.</div>' : ''}
    <div style="display:flex;justify-content:flex-end"><button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="savePickupDispatch('${dateKey}', ${group.id})"><i data-lucide="car-front"></i> ${group.status === 'dispatched' ? '배차 정보 수정' : '차량 배차 등록'}</button></div>
  </div>`;
}

function renderPickupDispatchStudentInfo(student) {
  const avatar = student.profilePhoto || (student.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
  const agency = typeof MOCK_AGENCIES !== 'undefined' ? MOCK_AGENCIES.find(item => item.name === student.agency) : null;
  const time = student.flightTime || '시간 미정';
  return `<div style="display:flex;align-items:flex-start;gap:9px;padding:9px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px">
    <img src="${avatar}" style="width:38px;height:38px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0" alt=""/>
    <div style="flex:1;min-width:0">
      <div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:10.5px;color:#111827">${student.name}</b><span style="font-size:9px;color:#6B7280">${student.nationality || '-'} · ${student.gender || '-'}성 · ${student.age || '-'}세</span></div>
      <div style="font-size:9.2px;color:#9CA3AF;margin-top:2px">Nick: ${student.nick || '-'} · ${student.phone || '연락처 미등록'} · ${student.email || '이메일 미등록'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;margin-top:5px;font-size:9px;color:#6B7280">
        <div><b style="color:#4B5563">에이전시</b> ${student.agency || '-'}</div><div><b style="color:#4B5563">담당자</b> ${agency?.contact || '-'}</div>
        <div><b style="color:#4B5563">컨택</b> ${agency?.phone || '-'}</div><div><b style="color:#4B5563">이메일</b> ${agency?.email || '-'}</div>
      </div>
      <div style="font-size:9.2px;color:#4F46E5;margin-top:5px"><i data-lucide="plane" style="width:10px;height:10px;vertical-align:-2px;margin-right:3px"></i>${student.flightInfo || '항공편 미등록'} · 입국 ${time}</div>
    </div>
  </div>`;
}

function savePickupDispatch(dateKey, groupId) {
  const group = getPickupDispatchGroups(dateKey).find(item => item.id === groupId);
  if (!group) return;
  const managerId = Number(document.getElementById(`pickup-dispatch-manager-${groupId}`)?.value || 0);
  const vehicleId = Number(document.getElementById(`pickup-dispatch-vehicle-${groupId}`)?.value || 0);
  const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === vehicleId && item.active !== false);
  if (!managerId || !vehicle) {
    showToast('픽업 담당자와 등록 차량을 선택해줘.', 'warning');
    return;
  }
  if (Number(vehicle.capacity) < group.studentIds.length) {
    showToast(`탑승 ${group.studentIds.length}명보다 큰 정원의 차량을 선택해줘.`, 'warning');
    return;
  }
  Object.assign(group, { managerId, vehicleId, vehicleCapacity: Number(vehicle.capacity), vehicleModel: vehicle.model, vehiclePlate: vehicle.plate, status: 'dispatched' });
  renderPickupCalendar();
  showToast('차량 배차가 등록되었습니다.', 'success');
}

function openPickupVehicleModal() {
  document.getElementById('pickup-vehicle-id').value = '';
  document.getElementById('pickup-vehicle-model').value = '';
  document.getElementById('pickup-vehicle-plate').value = '';
  document.getElementById('pickup-vehicle-capacity').value = '5';
  document.getElementById('pickup-vehicle-memo').value = '';
  renderPickupVehicleList();
  openModal('pickup-vehicle-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function renderPickupVehicleList() {
  const target = document.getElementById('pickup-vehicle-list');
  if (!target) return;
  target.innerHTML = MOCK_PICKUP_VEHICLES.length ? MOCK_PICKUP_VEHICLES.map(vehicle => `
    <div style="display:grid;grid-template-columns:1fr 100px 76px 44px;gap:8px;align-items:center;padding:9px 10px;border:1px solid #E5E7EB;border-radius:8px;background:#fff">
      <div><b style="font-size:11px;color:#111827">${vehicle.model}</b><div style="font-size:9.5px;color:#6B7280;margin-top:2px">${vehicle.plate}${vehicle.memo ? ` · ${vehicle.memo}` : ''}</div></div>
      <span style="font-size:10.5px;color:#374151">${vehicle.capacity}인승</span>
      <button type="button" class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="editPickupVehicle(${vehicle.id})">수정</button>
      <button type="button" class="tsa-btn tsa-btn-outline tsa-btn-xs" title="삭제" style="color:#EF4444;border-color:#FCA5A5;display:flex;align-items:center;justify-content:center;padding:0;width:32px;height:28px" onclick="removePickupVehicle(${vehicle.id})"><i data-lucide="trash-2" style="width:15px;height:15px"></i></button>
    </div>`).join('') : '<div style="padding:18px;text-align:center;border:1px dashed #CBD5E1;border-radius:8px;color:#9CA3AF;font-size:10.5px">등록된 차량이 없습니다.</div>';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function editPickupVehicle(vehicleId) {
  const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === vehicleId);
  if (!vehicle) return;
  document.getElementById('pickup-vehicle-id').value = String(vehicle.id);
  document.getElementById('pickup-vehicle-model').value = vehicle.model;
  document.getElementById('pickup-vehicle-plate').value = vehicle.plate;
  document.getElementById('pickup-vehicle-capacity').value = String(vehicle.capacity);
  document.getElementById('pickup-vehicle-memo').value = vehicle.memo || '';
}

function savePickupVehicle() {
  const id = Number(document.getElementById('pickup-vehicle-id')?.value || 0);
  const model = document.getElementById('pickup-vehicle-model')?.value.trim() || '';
  const plate = document.getElementById('pickup-vehicle-plate')?.value.trim() || '';
  const capacity = Number(document.getElementById('pickup-vehicle-capacity')?.value || 0);
  const memo = document.getElementById('pickup-vehicle-memo')?.value.trim() || '';
  if (!model || !plate || capacity < 1) {
    showToast('차량 모델, 차량번호, 정원을 모두 입력해줘.', 'warning');
    return;
  }
  const duplicate = MOCK_PICKUP_VEHICLES.some(vehicle => vehicle.plate.toLowerCase() === plate.toLowerCase() && vehicle.id !== id);
  if (duplicate) {
    showToast('이미 등록된 차량번호야.', 'warning');
    return;
  }
  if (id) {
    const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === id);
    if (vehicle) Object.assign(vehicle, { model, plate, capacity, memo });
  } else {
    MOCK_PICKUP_VEHICLES.push({ id: Date.now(), model, plate, capacity, memo, active: true });
  }
  document.getElementById('pickup-vehicle-id').value = '';
  document.getElementById('pickup-vehicle-model').value = '';
  document.getElementById('pickup-vehicle-plate').value = '';
  document.getElementById('pickup-vehicle-capacity').value = '5';
  document.getElementById('pickup-vehicle-memo').value = '';
  renderPickupVehicleList();
  renderPickupDateAssignments();
  showToast('차량 정보가 저장되었습니다.', 'success');
}

function removePickupVehicle(vehicleId) {
  const inUse = Object.values(PICKUP_DISPATCH_GROUPS).flat().some(group => Number(group.vehicleId) === vehicleId);
  if (inUse) {
    showToast('배차에 사용 중인 차량은 삭제할 수 없어.', 'warning');
    return;
  }
  const index = MOCK_PICKUP_VEHICLES.findIndex(vehicle => vehicle.id === vehicleId);
  if (index >= 0) MOCK_PICKUP_VEHICLES.splice(index, 1);
  renderPickupVehicleList();
  renderPickupDateAssignments();
  showToast('차량이 삭제되었습니다.', 'success');
}

function updatePickupDispatch(dateKey, groupId, field, value) {
  const group = getPickupDispatchGroups(dateKey).find(item => item.id === groupId);
  if (!group) return;
  group[field] = field === 'managerId' || field === 'vehicleCapacity' ? Number(value) || null : value.trim();
  group.status = group.managerId && group.vehiclePlate && Number(group.vehicleCapacity) >= group.studentIds.length ? 'dispatched' : 'pending';
  renderPickupCalendar();
}

function removePickupDispatchGroup(dateKey, groupId) {
  PICKUP_DISPATCH_GROUPS[dateKey] = getPickupDispatchGroups(dateKey).filter(group => group.id !== groupId);
  renderPickupCalendar();
  showToast('배차 그룹이 삭제되었습니다.', 'success');
}

function selectPickupCalendarDate(dateKey) {
  APP.pickupSelectedDate = dateKey;
  const selected = new Date(`${dateKey}T00:00:00`);
  if (selected.getFullYear() !== APP.pickupCalendarMonth.getFullYear() || selected.getMonth() !== APP.pickupCalendarMonth.getMonth()) {
    APP.pickupCalendarMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  }
  renderPickupCalendar();
}

function changePickupCalendarMonth(offset) {
  const month = APP.pickupCalendarMonth;
  APP.pickupCalendarMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
  APP.pickupSelectedDate = toPickupDateKey(APP.pickupCalendarMonth);
  renderPickupCalendar();
}

function goPickupCalendarToday() {
  const today = new Date();
  APP.pickupCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  APP.pickupSelectedDate = toPickupDateKey(today);
  renderPickupCalendar();
}

function openPickupManagerModal(managerId = null) {
  const manager = MOCK_PICKUP_MANAGERS.find(item => item.id === Number(managerId));
  APP.pickupManagerPhotoData = manager?.photo || 'assets/images/teacher_male.png';
  document.getElementById('pickup-manager-modal-title').textContent = manager ? '픽업 담당자 수정' : '픽업 담당자 등록';
  document.getElementById('pickup-manager-id').value = manager?.id || '';
  document.getElementById('pickup-manager-name').value = manager?.name || '';
  document.getElementById('pickup-manager-phone').value = manager?.phone || '';
  document.getElementById('pickup-manager-gender').value = manager?.gender || '남';
  document.getElementById('pickup-manager-age').value = manager?.age || '';
  document.getElementById('pickup-manager-messenger').value = manager?.messenger || '';
  document.getElementById('pickup-manager-photo').value = '';
  document.getElementById('pickup-manager-photo-preview').innerHTML = `<img src="${APP.pickupManagerPhotoData}" style="width:100%;height:100%;object-fit:cover" alt=""/>`;
  openModal('pickup-manager-modal');
}

function previewPickupManagerPhoto(input) {
  const file = input?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    APP.pickupManagerPhotoData = event.target.result;
    document.getElementById('pickup-manager-photo-preview').innerHTML = `<img src="${APP.pickupManagerPhotoData}" style="width:100%;height:100%;object-fit:cover" alt=""/>`;
  };
  reader.readAsDataURL(file);
}

function savePickupManager() {
  const id = Number(document.getElementById('pickup-manager-id').value) || null;
  const name = document.getElementById('pickup-manager-name').value.trim();
  const phone = document.getElementById('pickup-manager-phone').value.trim();
  const gender = document.getElementById('pickup-manager-gender').value;
  const age = Number(document.getElementById('pickup-manager-age').value);
  if (!name || !phone || !gender || !age) {
    showToast('담당자 이름, 연락처, 성별, 나이를 모두 입력해줘.', 'warning');
    return;
  }
  const payload = {
    id: id || Math.max(0, ...MOCK_PICKUP_MANAGERS.map(item => item.id)) + 1,
    name,
    phone,
    gender,
    age,
    messenger: document.getElementById('pickup-manager-messenger').value.trim(),
    photo: APP.pickupManagerPhotoData || 'assets/images/teacher_male.png',
    visible: true,
  };
  const existing = MOCK_PICKUP_MANAGERS.find(item => item.id === id);
  if (existing) Object.assign(existing, payload);
  else MOCK_PICKUP_MANAGERS.push(payload);
  closeModal('pickup-manager-modal');
  initPickupManagerView();
  showToast('픽업 담당자 프로필이 저장되었습니다.', 'success');
}

function renderRecommendedStudentInvoice(std) {
  const billing = getStudentBillingBreakdown(std);
  const savedFees = std.courseRegistrationFees || {};
  const extraItems = Array.isArray(savedFees.extraItems) ? savedFees.extraItems : [];
  const route = std.remittanceRoute || std.enrollments?.[0]?.remittanceRoute || 'agency';
  const routeLabel = getRemittanceRouteLabel(route);
  const paidAmount = billing.items.filter(item => item.paymentStatus === 'paid').reduce((sum, item) => sum + item.amount, 0);
  const balance = Math.max(0, billing.gross - paidAmount);
  const issueDate = new Date().toISOString().substring(0, 10);
  const dueDate = std.paymentDueDate || std.startDate || issueDate;
  const invoiceNo = `TSA-${std.id}-${(std.startDate || issueDate).replace(/-/g, '')}`;
  const statusLabel = balance <= 0 ? 'PAID · 완납' : paidAmount > 0 ? 'PARTIAL · 부분납' : 'UNPAID · 미납';
  const statusColor = balance <= 0 ? '#047857' : paidAmount > 0 ? '#B45309' : '#DC2626';
  const statusBg = balance <= 0 ? '#D1FAE5' : paidAmount > 0 ? '#FEF3C7' : '#FEE2E2';
  const paymentGuide = route === 'direct'
    ? `<strong>어학원 직접 송금</strong><br>Bank: BDO Cebu Branch · Account Name: TalkStation Academy<br>Account No: 0000-0000-0000 · SWIFT: BNORPHMM<br>송금 메모에 학생 영문명과 인보이스 번호를 입력해줘.`
    : route === 'onsite'
      ? `<strong>어학원 현장 결제</strong><br>세부 캠퍼스 Admin Office에서 입학 첫날 결제해줘.<br>현장 결제 가능 통화와 결제 수단은 방문 전 확인이 필요해.`
      : `<strong>에이전시 납부</strong><br>담당 에이전시를 통해 청구 금액을 납부해줘.<br>납부 확인 및 영수증은 담당 에이전시에 요청할 수 있어.`;
  const chargeRows = billing.items.map(item => `
    <tr>
      <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB">${item.label}</td>
      <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB">${item.key === 'education' ? `${std.course} · ${std.duration}주` : item.key === 'dorm' ? (std.dorm || '기숙사') : '-'}</td>
      <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB;text-align:center"><span style="font-size:10px;font-weight:800;color:${item.paymentStatus === 'paid' ? '#047857' : '#DC2626'}">${item.paymentStatus === 'paid' ? '완납' : '미납'}</span></td>
      <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:800">$${Number(item.amount).toLocaleString()}</td>
    </tr>`).join('');
  const localRows = extraItems.length
    ? extraItems.map(item => `<tr><td style="padding:7px 9px;border-bottom:1px solid #E5E7EB">${item.name || item.label || '기타 비용'}</td><td style="padding:7px 9px;border-bottom:1px solid #E5E7EB;text-align:right">${item.currency === 'PHP' ? '₱' : '$'}${Number(item.amount || 0).toLocaleString()}</td><td style="padding:7px 9px;border-bottom:1px solid #E5E7EB;color:#6B7280">${item.paymentLocation || '등록 시 선택한 경로'}</td></tr>`).join('')
    : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#9CA3AF">별도로 등록된 현지 납부 항목이 없습니다.</td></tr>`;

  return `
    <div style="max-width:920px;margin:0 auto;background:#fff;border:1px solid #DDE3EC;color:#1F2937;font-family:Arial, sans-serif">
      <div style="padding:24px 28px;background:#172554;color:#fff;display:flex;justify-content:space-between;align-items:start">
        <div><div style="font-size:22px;font-weight:900;letter-spacing:1px">TALKSTATION ACADEMY</div><div style="font-size:11px;color:#BFDBFE;margin-top:5px">Cebu Campus · Official Student Invoice</div></div>
        <div style="text-align:right"><div style="font-size:24px;font-weight:300;letter-spacing:2px">INVOICE</div><div style="font-size:11px;color:#BFDBFE;margin-top:5px">${invoiceNo}</div></div>
      </div>
      <div style="padding:24px 28px">
        <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px;margin-bottom:20px">
          <div><div style="font-size:10px;font-weight:800;color:#64748B;margin-bottom:7px">STUDENT INFORMATION</div><div style="font-size:16px;font-weight:900">${std.name}</div><div style="font-size:11.5px;line-height:1.7;color:#475569;margin-top:5px">Nick: ${std.nick} · ${std.nationality || '-'}<br>Passport: ${std.passportNum || 'N/A'}<br>Agency: ${std.agency || 'Direct Student'}</div></div>
          <div style="font-size:11.5px;line-height:1.8"><div style="display:flex;justify-content:space-between"><span style="color:#64748B">Issue Date</span><strong>${issueDate}</strong></div><div style="display:flex;justify-content:space-between"><span style="color:#64748B">Payment Due</span><strong>${dueDate}</strong></div><div style="display:flex;justify-content:space-between"><span style="color:#64748B">Payment Route</span><strong>${routeLabel}</strong></div><div style="margin-top:8px;text-align:right"><span style="display:inline-block;padding:5px 10px;border-radius:999px;background:${statusBg};color:${statusColor};font-weight:900">${statusLabel}</span></div></div>
        </div>
        <div style="padding:13px 15px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:18px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:11px"><div><span style="color:#64748B">Course</span><br><strong>${std.course}</strong></div><div><span style="color:#64748B">Study Period</span><br><strong>${std.startDate || '-'} ~ ${std.endDate || '-'}</strong></div><div><span style="color:#64748B">Accommodation</span><br><strong>${std.dorm || '-'}</strong></div><div><span style="color:#64748B">Dorm Period</span><br><strong>${std.dormIn || '-'} ~ ${std.dormOut || '-'}</strong></div></div>
        <div style="font-size:12px;font-weight:900;color:#172554;margin:0 0 8px">USD BILLING DETAILS</div>
        <table style="width:100%;border-collapse:collapse;font-size:11.5px"><thead><tr style="background:#E0E7FF;color:#312E81"><th style="padding:9px 10px;text-align:left">항목</th><th style="padding:9px 10px;text-align:left">상세</th><th style="padding:9px 10px;text-align:center">납부 상태</th><th style="padding:9px 10px;text-align:right">금액 (USD)</th></tr></thead><tbody>${chargeRows}</tbody></table>
        <div style="display:flex;justify-content:flex-end;margin:12px 0 22px"><div style="width:300px;font-size:12px"><div style="display:flex;justify-content:space-between;padding:5px 0"><span>총 청구액</span><strong>$${billing.gross.toLocaleString()}</strong></div><div style="display:flex;justify-content:space-between;padding:5px 0;color:#047857"><span>납부 완료</span><strong>-$${paidAmount.toLocaleString()}</strong></div><div style="display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #172554;font-size:15px;color:#172554"><strong>남은 금액</strong><strong>$${balance.toLocaleString()}</strong></div></div></div>
        <div style="font-size:12px;font-weight:900;color:#172554;margin:0 0 8px">LOCAL / ADDITIONAL PAYMENT</div>
        <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:20px"><thead><tr style="background:#F1F5F9"><th style="padding:8px 9px;text-align:left">현지 비용 항목</th><th style="padding:8px 9px;text-align:right">금액</th><th style="padding:8px 9px;text-align:left">납부 안내</th></tr></thead><tbody>${localRows}</tbody></table>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px"><div style="padding:13px 15px;border:1px solid #C7D2FE;background:#EEF2FF;border-radius:8px;font-size:11px;line-height:1.7;color:#3730A3"><div style="font-weight:900;margin-bottom:5px">PAYMENT INSTRUCTIONS</div>${paymentGuide}</div><div style="padding:13px 15px;border:1px solid #D1FAE5;background:#ECFDF5;border-radius:8px;font-size:11px;line-height:1.7;color:#065F46"><div style="font-weight:900;margin-bottom:5px">INCLUDED SERVICES</div>수강료, 등록된 기숙사 이용료 및 등록금이 포함됩니다.<br>식사 제공 여부와 포함 범위는 등록 과정 정책을 따릅니다.</div></div>
        <div style="padding:13px 15px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;font-size:10.5px;line-height:1.7;color:#475569"><strong>IMPORTANT TERMS</strong><br>1. SSP, 비자 연장, ACR I-Card 등 정부 관련 비용은 현지 통화로 별도 청구될 수 있으며 고지 없이 변경될 수 있습니다.<br>2. 기숙사 체크인·체크아웃 시간 외 입퇴실에는 추가 숙박비가 발생할 수 있습니다.<br>3. 취소 및 환불은 어학원 공식 환불 정책과 과정별 조건을 따릅니다.<br>4. 해외 송금 수수료와 중개은행 수수료의 부담 주체는 결제 안내를 확인해줘.</div>
        <div style="display:flex;justify-content:space-between;align-items:end;margin-top:28px"><div style="font-size:10.5px;line-height:1.6;color:#64748B">TalkStation Academy · Cebu Campus<br>Official Student Billing Document</div><div style="width:190px;text-align:center;font-size:10.5px"><div style="height:30px;border-bottom:1px solid #334155;margin-bottom:6px"></div><strong>Authorized Signature / Seal</strong></div></div>
      </div>
    </div>`;
}

function switchInvoiceTab(tab) {
  APP.selectedInvoiceTab = tab;
  
  const tabIds = { 'invoice': 'itab-invoice', 'loa': 'itab-loa', 'invitation': 'itab-invitation', 'pickup': 'itab-pickup' };
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
  const avatarSrc = std.profilePhoto || (std.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');
  const invoiceRemittanceRoute = std.remittanceRoute || std.enrollments?.[0]?.remittanceRoute || 'agency';
  const invoiceRemittanceLabel = ({ agency: 'Agency Payment', direct: 'Direct Bank Transfer', onsite: 'On-site Payment' })[invoiceRemittanceRoute] || 'Agency Payment';
  const invoiceAgency = typeof MOCK_AGENCIES !== 'undefined' ? MOCK_AGENCIES.find(agency => agency.name === std.agency) : null;
  const invoiceAgencyBankDetails = invoiceAgency && invoiceAgency.bankName
    ? `<br><strong>Bank Name:</strong> ${invoiceAgency.bankName}<br><strong>Account Name:</strong> ${invoiceAgency.accountName || '-'}<br><strong>Account Number:</strong> ${invoiceAgency.accountNumber || '-'}<br><strong>SWIFT Code:</strong> ${invoiceAgency.swiftCode || '-'}<br><strong>Bank Address:</strong> ${invoiceAgency.bankAddress || '-'}<br><strong>Agency Contact:</strong> ${invoiceAgency.contact || '-'} · ${invoiceAgency.phone || '-'} · ${invoiceAgency.email || '-'}`
    : `<br><strong>Agency:</strong> ${std.agency || '-'}<br>Please contact the agency for its official bank account details before making payment.`;
  const invoicePaymentGuide = invoiceRemittanceRoute === 'direct'
    ? 'Please transfer the invoiced amount directly to the academy-designated bank account. Enter the student’s full English name and invoice number in the transfer reference. All remittance and intermediary bank charges are borne by the sender.'
    : invoiceRemittanceRoute === 'onsite'
      ? 'Please make payment at the Cebu Campus Administration Office. Confirm the accepted currency and available cash or card payment methods with the academy before arrival.'
      : `Please pay the invoiced amount to the designated agency account. Verify the account holder and account number with the agency before making payment.${invoiceAgencyBankDetails}`;

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

      <div style="font-size:11px;color:#3730A3;background:#EEF2FF;padding:12px;border-radius:8px;border:1px solid #C7D2FE;line-height:1.65;margin-bottom:10px">
        <strong>Payment Instructions</strong><br>
        <span style="display:inline-block;margin:5px 0 3px;padding:3px 8px;border-radius:999px;background:#fff;border:1px solid #C7D2FE;font-weight:800">${invoiceRemittanceLabel}</span><br>
        ${invoicePaymentGuide}
      </div>

      <div style="font-size:11px;color:#6B7280;background:#F9FAFB;padding:12px;border-radius:8px;border:1px solid #E5E7EB;line-height:1.65">
        <strong>Important Notices</strong><br>
        1. <strong>Refunds:</strong> All cancellations and refunds are subject to the academy’s official refund policy and the applicable enrollment conditions for the selected program.<br>
        2. <strong>Government and Local Fees:</strong> SSP, visa extension fees, ACR I-Card, electricity charges, deposits, and other local fees may not be included in the invoice total and may be collected separately in local currency. Government fees and exchange-rate-based charges are subject to change without prior notice.<br>
        3. <strong>Accommodation:</strong> Students must follow the designated dormitory check-in and check-out times. Early check-in or late check-out may incur an additional nightly charge. Accommodation changes and cancellations are subject to the academy’s separate dormitory policy.
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
            <div><strong>Passport No:</strong> ${maskPassportNumber(std.passportNum, 'N/A')}</div>
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
  } else if (tab === 'invitation') {
    const invitationIssueDate = new Date().toISOString().substring(0, 10);
    const invitationBirthDate = std.birthDate || std.birthday || std.dateOfBirth || 'N/A';
    const invitationEndDate = std.endDate || calculateCourseRegSegmentEndDate(std.startDate, std.duration) || 'N/A';
    const invitationNo = `TSA-${String(std.id).padStart(5, '0')}`;
    content.style.position = 'relative';
    content.innerHTML = `
      <div style="max-width:760px;margin:0 auto;background:#fff;padding:38px 48px;color:#1F2937;font-family:Arial, sans-serif;border:1px solid #E5E7EB;position:relative">
        <div style="text-align:center;border-bottom:3px solid #1E3A5F;padding-bottom:18px;margin-bottom:30px">
          <div style="font-size:24px;font-weight:900;letter-spacing:1.5px;color:#1E3A5F">TALKSTATION ACADEMY</div>
          <div style="font-size:11px;color:#64748B;margin-top:6px">Cebu Campus · Student Admissions Office</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:24px">
          <h2 style="font-size:28px;letter-spacing:3px;color:#111827;margin:0">INVITATION</h2>
          <div style="text-align:right;font-size:11.5px;line-height:1.7;color:#475569"><strong>Issue Date</strong><br>${invitationIssueDate}<br><strong>No.</strong> ${invitationNo}</div>
        </div>
        <p style="font-size:13px;line-height:1.9;margin:0 0 22px">TALKSTATION ACADEMY warmly welcomes the following student who has been officially enrolled in our English program. The enrollment details are as follows:</p>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;margin:0 0 24px">
          <tbody>
            <tr><th style="width:34%;text-align:left;padding:10px 12px;background:#F1F5F9;border:1px solid #CBD5E1">Name</th><td style="padding:10px 12px;border:1px solid #CBD5E1;font-weight:700">${std.name}</td></tr>
            <tr><th style="text-align:left;padding:10px 12px;background:#F1F5F9;border:1px solid #CBD5E1">Gender</th><td style="padding:10px 12px;border:1px solid #CBD5E1">${std.gender === '남' ? 'Male' : std.gender === '여' ? 'Female' : std.gender || 'N/A'}</td></tr>
            <tr><th style="text-align:left;padding:10px 12px;background:#F1F5F9;border:1px solid #CBD5E1">Date of Birth</th><td style="padding:10px 12px;border:1px solid #CBD5E1">${invitationBirthDate}</td></tr>
            <tr><th style="text-align:left;padding:10px 12px;background:#F1F5F9;border:1px solid #CBD5E1">Passport Number</th><td style="padding:10px 12px;border:1px solid #CBD5E1">${std.passportNum || 'N/A'}</td></tr>
            <tr><th style="text-align:left;padding:10px 12px;background:#F1F5F9;border:1px solid #CBD5E1">Course Program</th><td style="padding:10px 12px;border:1px solid #CBD5E1">${std.course}</td></tr>
            <tr><th style="text-align:left;padding:10px 12px;background:#F1F5F9;border:1px solid #CBD5E1">Study Period</th><td style="padding:10px 12px;border:1px solid #CBD5E1">${std.startDate || 'N/A'} to ${invitationEndDate}</td></tr>
          </tbody>
        </table>
        <p style="font-size:12.5px;line-height:1.9">Our academy is located in Cebu, Philippines. We look forward to welcoming the student and supporting their studies during the stated enrollment period.</p>
        <div style="margin-top:46px;display:flex;justify-content:space-between;align-items:end">
          <div style="font-size:11px;line-height:1.7;color:#64748B"><strong style="color:#334155">School Address</strong><br>TalkStation Academy, Cebu Campus<br>Cebu, Philippines</div>
          <div style="width:220px;text-align:center;font-size:11.5px"><div style="height:38px;border-bottom:1px solid #334155;margin-bottom:7px"></div><strong>Director of Admissions</strong><br><span style="color:#64748B">Authorized Signature</span></div>
        </div>
      </div>`;
  } else if (tab === 'pickup') {
    const pickupManagers = getPickupManagersForStudent(std);
    const pickupDispatch = getPickupDispatchGroups(std.arrivalDate || std.startDate).find(group => group.studentIds.includes(std.id));

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
            <div><strong>Estimated Arrival:</strong> ${std.arrivalDate || std.startDate || 'TBD'}</div>
            <div><strong>Beds Assign:</strong> Room ${std.dorm.includes('/') ? std.dorm.split('/')[0].trim() : std.dorm}</div>
          </div>
        </div>

        ${pickupManagers.length ? `
          <div style="margin:0 0 16px;padding:14px;border:1px solid #7DD3FC;background:#F0F9FF;border-radius:10px">
            <div style="font-size:10.5px;font-weight:800;color:#0369A1;margin-bottom:10px">YOUR AIRPORT PICKUP MANAGERS · 픽업 담당자 ${pickupManagers.length}명</div>
            <div style="display:grid;grid-template-columns:${pickupManagers.length > 1 ? 'repeat(2,minmax(0,1fr))' : '1fr'};gap:10px">
              ${pickupManagers.map(pickupManager => `<div style="display:flex;align-items:center;gap:12px;padding:10px;background:#fff;border:1px solid #BAE6FD;border-radius:8px">
                <img src="${pickupManager.photo || 'assets/images/teacher_male.png'}" style="width:52px;height:62px;border-radius:8px;object-fit:cover;border:1px solid #38BDF8" alt=""/>
                <div style="flex:1"><div style="font-size:13px;font-weight:900;color:#111827">${pickupManager.name}</div><div style="font-size:10.5px;color:#374151;margin-top:3px">${pickupManager.phone}</div><div style="font-size:10px;color:#6B7280;margin-top:2px">${pickupManager.gender || '-'} · ${pickupManager.age ? pickupManager.age + ' years' : ''}${pickupManager.messenger ? ` · ${pickupManager.messenger}` : ''}</div></div>
              </div>`).join('')}
            </div>
            ${pickupDispatch ? `<div style="margin-top:10px;padding:8px 10px;background:#E0F2FE;border-radius:7px;font-size:10.5px;color:#075985"><strong>Vehicle:</strong> ${pickupDispatch.vehicleModel || 'Model TBD'} · ${pickupDispatch.vehicleCapacity || '-'} seats · ${pickupDispatch.vehiclePlate || 'Plate TBD'}</div>` : ''}
          </div>
        ` : `<div style="margin:0 0 16px;padding:12px;border:1px dashed #CBD5E1;background:#F8FAFC;border-radius:10px;font-size:11px;color:#64748B">픽업 담당자가 아직 배정되지 않았습니다.</div>`}

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
    remitBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#9CA3AF">승인 대기 중인 송금 명세서가 없습니다.</td></tr>`;
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

function initCoursePricing() {
  renderCourseList();
}

function renderCourseList() {
  const tbody = document.getElementById('course-list-body');
  if (!tbody) return;

  tbody.innerHTML = MOCK_COURSES.map((c, idx) => {
    const subjectIds = getCourseSubjectIds(c);
    const subjectsBadge = subjectIds.map(id => {
      const sub = MOCK_MASTER_SUBJECTS.find(m => m.id === id);
      return `<span class="tsa-badge tsa-badge-outline" style="font-size:10px;margin:1px">${sub ? sub.name : id}</span>`;
    }).join('') || '<span style="color:#D1D5DB">과목 미설정</span>';
    const classHours = getCourseClassHours(c);
    const classHoursBadge = [...MOCK_MASTER_CLASS_TYPES]
      .filter(t => t.visible !== false)
      .sort((a, b) => a.order - b.order)
      .map(t => `<span style="white-space:nowrap">${t.code} ${classHours[t.code] || 0}시간</span>`)
      .join(' · ');

    // 추천 레벨 배지
    const levelsBadge = (c.levels || [])
      .map(lvId => MOCK_MASTER_LEVELS.find(m => m.id === lvId))
      .filter(Boolean)
      .map(lv => `<span class="tsa-badge tsa-badge-gray" style="font-size:10px;margin:1px">${lv.name}</span>`)
      .join('') || '<span style="color:#D1D5DB">-</span>';

    return `
      <tr${c.active === false ? ' style="opacity:0.55"' : ''}>
        <td>
          <div style="font-weight:700;font-size:13px;color:#1A1D23">${c.name}</div>
          ${c.active === false ? '<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px;margin-top:2px">비활성</span>' : ''}
        </td>
        <td>${levelsBadge}</td>
        <td style="font-size:11.5px">${subjectsBadge}</td>
        <td style="font-size:11.5px;color:#6B7280">${classHoursBadge}</td>
        <td style="text-align:center">
          <button type="button"
            onclick="toggleCourseVisibility(${idx})"
            aria-pressed="${c.active !== false}"
            style="min-width:58px;padding:4px 10px;border:0;border-radius:999px;cursor:pointer;font-size:11px;font-weight:700;background:${c.active !== false ? '#D1FAE5' : '#F3F4F6'};color:${c.active !== false ? '#065F46' : '#6B7280'}">
            ${c.active !== false ? '노출' : '숨김'}
          </button>
        </td>
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

  renderCourseLevelCheckboxes([]);
  renderCourseClassTypeSections({ subjects: [], classHours: {} });
  openModal('course-add-modal');
}

function openEditCourseModal(idx) {
  _editingCourseIdx = idx;
  const c = MOCK_COURSES[idx];
  if (!c) return;

  document.getElementById('course-modal-title').textContent = '과정 및 커리큘럼 정보 수정';
  document.getElementById('add-course-name').value = c.name;

  renderCourseLevelCheckboxes(c.levels || []);
  renderCourseClassTypeSections(c);
  openModal('course-add-modal');
}

function renderCourseLevelCheckboxes(selectedLevels) {
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

function getCourseSubjectIds(course) {
  const ids = new Set();
  (course.subjects || []).forEach(subject => {
    const id = typeof subject === 'string' ? subject : subject.id;
    if (id) ids.add(id);
  });
  Object.values(course.subjectsByType || {}).flat().forEach(subject => {
    if (subject && subject.id) ids.add(subject.id);
  });
  return [...ids];
}

function getCourseClassHours(course) {
  return {
    '1:1': Number(course.classHours?.['1:1'] ?? course.oneone) || 0,
    '1:4': Number(course.classHours?.['1:4'] ?? course.group1on4) || 0,
    '1:8': Number(course.classHours?.['1:8'] ?? course.group) || 0,
  };
}

function getAgencyCommissionPolicyItems(s) {
  const agencyName = s?.agency || '';
  if (agencyName === '직접 등록') {
    const noCommission = { type: 'none', value: 0, rate: 0 };
    return { registration: noCommission, education: noCommission, dorm: noCommission, local: noCommission };
  }
  const agencies = typeof MOCK_AGENCIES !== 'undefined' ? MOCK_AGENCIES : [];
  const agency = agencies.find(a => a.name === agencyName);
  const legacyRate = agencyName === '서울 유학원' ? 15 : agencyName === 'Beijing Partner' ? 25 : 20;
  const legacyType = agency?.commissionType === 'fixed' ? 'fixed' : 'rate';
  const legacyValue = agency
    ? (legacyType === 'fixed' ? Number(agency.commissionAmount || 0) : Number(agency.commissionRate || legacyRate))
    : legacyRate;
  const source = agency?.commissionPolicies || {};
  const makePolicy = (key, fallbackType, fallbackValue) => {
    const saved = source[key] || {};
    const type = ['none', 'rate', 'fixed'].includes(saved.type) ? saved.type : fallbackType;
    const value = Number(saved.value ?? fallbackValue);
    return {
      type,
      value: Number.isFinite(value) ? value : 0,
      rate: type === 'rate' && Number.isFinite(value) ? value / 100 : 0,
    };
  };
  return {
    registration: makePolicy('registration', 'rate', 10),
    education: makePolicy('education', legacyType, legacyValue),
    dorm: makePolicy('dorm', legacyType, legacyValue),
    local: makePolicy('local', 'rate', 10),
  };
}

function calculateAgencyItemCommission(item, policy) {
  const amount = Number(item?.amount || item || 0);
  if (!policy || policy.type === 'none') return 0;
  if (policy.type === 'fixed') return Math.min(Math.round(Number(policy.value || 0)), amount);
  return Math.round(amount * Number(policy.rate || 0));
}

function calculateAgencyItemCommissionTotal(s, amounts) {
  const policies = getAgencyCommissionPolicyItems(s);
  return ['registration', 'education', 'dorm', 'local'].reduce((sum, key) => {
    return sum + calculateAgencyItemCommission(Number(amounts?.[key] || 0), policies[key]);
  }, 0);
}

function getAgencyCommissionRate(s) {
  return getAgencyCommissionPolicyItems(s).education.rate;
}

function getStudentBillingBreakdown(s) {
  const prices = calculatePrices(s);
  const commissionPolicies = getAgencyCommissionPolicyItems(s);
  const savedFees = s.courseRegistrationFees || {};
  const registrationFromFees = Array.isArray(s.fees)
    ? s.fees.filter(f => /등록|Registration/i.test(f.item || '')).reduce((sum, f) => sum + Number(f.amount || 0), 0)
    : 0;
  const localFromFees = Array.isArray(s.fees)
    ? s.fees.filter(f => !/등록|Registration/i.test(f.item || '')).reduce((sum, f) => sum + Number(f.amount || 0), 0)
    : 0;

  const registration = Number(savedFees.registration || registrationFromFees || prices.registration || 0);
  const education = Number(savedFees.tuition || prices.tuition || 0);
  const dorm = isStudentWalkIn(s) ? 0 : Number(savedFees.dorm || prices.dorm || 0);
  const local = Number(savedFees.extras || localFromFees || 0);
  const savedExtraItems = Array.isArray(savedFees.extraItems) ? savedFees.extraItems : [];
  const localCommissionBase = savedExtraItems.length
    ? savedExtraItems
        .filter(item => !/등록금|Registration/i.test(item.name || item.label || '') && item.commissionEnabled !== false)
        .reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : local;

  const itemStatuses = s.billingItemStatuses || {};
  const defaultPaidStatus = s.remittanceStatus === 'paid' ? 'paid' : 'unpaid';
  const normalizePaidStatus = status => status === 'paid' ? 'paid' : 'unpaid';
  const commissionStatuses = s.commissionItemStatuses || {};
  const defaultCommissionStatus = s.commissionStatus === 'paid' || s.commissionPaid ? 'paid' : 'unpaid';
  const items = [
    { key: 'registration', label: '등록금', amount: registration },
    { key: 'education', label: '수강료', amount: education },
    { key: 'dorm', label: '기숙사비', amount: dorm },
    { key: 'local', label: '기타 비용', amount: local, commissionBase: localCommissionBase },
  ].map(baseItem => {
    const policy = commissionPolicies[baseItem.key] || { type: 'none', value: 0, rate: 0 };
    const commission = calculateAgencyItemCommission(baseItem.commissionBase ?? baseItem.amount, policy);
    return {
    ...baseItem,
    commissionRate: policy.rate || 0,
    commission,
    commissionType: policy.type,
    commissionValue: policy.value || 0,
    paymentStatus: normalizePaidStatus(itemStatuses[baseItem.key] || defaultPaidStatus),
    commissionStatus: commission > 0
      ? normalizePaidStatus(commissionStatuses[baseItem.key] || defaultCommissionStatus)
      : 'none',
    };
  });
  const gross = items.reduce((sum, item) => sum + item.amount, 0);
  const commission = items.reduce((sum, item) => sum + item.commission, 0);
  return {
    items,
    gross,
    commission,
    net: gross - commission,
    rate: commissionPolicies.education?.rate || 0,
    commissionPolicies,
  };
}

function renderAgencyPaidBadge(status) {
  const paid = status === 'paid';
  return `<span class="tsa-badge ${paid ? 'tsa-badge-success' : 'tsa-badge-danger'}" style="font-size:10px">${paid ? '완납' : '미납'}</span>`;
}

function renderAgencyCommissionBadge(status) {
  const paid = status === 'paid';
  return `<span class="tsa-badge ${paid ? 'tsa-badge-success' : 'tsa-badge-danger'}" style="font-size:10px">${paid ? '지급' : '미지급'}</span>`;
}

function renderAgencyBillingCompactCell(item) {
  const amount = Number(item.amount || 0);
  const commission = Number(item.commission || 0);
  const commissionText = commission > 0
    ? `$${commission.toLocaleString()}`
    : '$0';
  const commissionMeta = commission > 0
    ? (item.commissionType === 'fixed' ? '정액' : `${Math.round(item.commissionRate * 100)}%`)
    : '커미션 없음';
  return `
    <div style="min-width:96px;text-align:right;line-height:1.35">
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:5px;white-space:nowrap">
        <strong style="font-size:12px;color:#111827">$${amount.toLocaleString()}</strong>
        ${renderAgencyPaidBadge(item.paymentStatus)}
      </div>
      <div style="display:flex;justify-content:flex-end;align-items:center;gap:5px;white-space:nowrap;margin-top:3px">
        <span style="font-size:10.5px;font-weight:800;color:${commission > 0 ? '#4F46E5' : '#9CA3AF'}">${commissionText}</span>
        <span style="font-size:10px;color:#9CA3AF">${commissionMeta}</span>
        ${commission > 0 ? renderAgencyCommissionBadge(item.commissionStatus) : ''}
      </div>
    </div>
  `;
}

function renderAgencyBillingAmountCell(item) {
  return `
    <div style="min-width:112px;text-align:right;line-height:1.5">
      <div style="font-weight:900;color:#111827">$${Number(item.amount || 0).toLocaleString()}</div>
      <div style="margin-top:3px">${renderAgencyPaidBadge(item.paymentStatus)}</div>
    </div>
  `;
}

function renderAgencyCommissionItemCell(item) {
  const commission = Number(item.commission || 0);
  if (commission <= 0) {
    return `
      <div style="min-width:112px;text-align:right;line-height:1.5;color:#9CA3AF">
        <div style="font-weight:800">$0</div>
        <div style="font-size:10.5px">커미션 없음</div>
      </div>
    `;
  }
  return `
    <div style="min-width:112px;text-align:right;line-height:1.5">
      <div style="font-weight:900;color:#4F46E5">$${commission.toLocaleString()}</div>
      <div style="font-size:10.5px;color:#6B7280">${item.commissionType === 'fixed' ? '정액' : `${Math.round(item.commissionRate * 100)}%`}</div>
      <div style="margin-top:3px">${renderAgencyCommissionBadge(item.commissionStatus)}</div>
    </div>
  `;
}

function getAgencyPaymentHistoryRows(s) {
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
      approvedBy: r.approvedBy || (r.status === 'approved' ? '본사 슈퍼어드민' : '-'),
      source: 'dashboard'
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
    approvedBy: r.approvedBy || (r.status === 'approved' ? '본사 슈퍼어드민' : '-'),
    source: 'local'
  }));
  return { fromDashboard, fromLocal, history: [...fromDashboard, ...fromLocal] };
}

function renderAgencyPaymentSummary(s, breakdown) {
  const { history } = getAgencyPaymentHistoryRows(s);
  const approvedPaid = history
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const pendingPaid = history
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const balance = Math.max(Number(breakdown.net || 0) - approvedPaid, 0);
  const cards = [
    { label: '청구 금액 합계', value: breakdown.gross, color: '#111827', bg: '#F8FAFC' },
    { label: '커미션 합계', value: breakdown.commission, color: '#4F46E5', bg: '#EEF2FF' },
    { label: '어학원 송금액 합계', value: breakdown.net, color: '#0F766E', bg: '#F0FDFA' },
    { label: '납부 완료액', value: approvedPaid, color: '#059669', bg: '#ECFDF5' },
  ];
  return `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px">
      ${cards.map(card => `
        <div style="background:${card.bg};border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px">
          <div style="font-size:10.5px;color:#6B7280;font-weight:800">${card.label}</div>
          <div style="font-size:16px;font-weight:900;color:${card.color};margin-top:4px">${card.value < 0 ? '-' : ''}$${Math.abs(card.value).toLocaleString()}</div>
        </div>
      `).join('')}
    </div>
    <div style="font-size:11px;color:${balance > 0 ? '#DC2626' : '#059669'};background:${balance > 0 ? '#FEF2F2' : '#ECFDF5'};border:1px solid ${balance > 0 ? '#FECACA' : '#BBF7D0'};border-radius:8px;padding:8px 10px;margin-bottom:10px">
      현재 납부 상태: ${balance > 0 ? '미납' : '완납'} · 남은 어학원 송금액 $${balance.toLocaleString()}
    </div>
  `;
}

function renderCourseClassTypeSections(course) {
  const container = document.getElementById('course-classtype-sections');
  if (!container) return;

  const selectedSubjectIds = getCourseSubjectIds(course);
  const classHours = getCourseClassHours(course);
  const types = [...MOCK_MASTER_CLASS_TYPES].filter(t => t.visible !== false).sort((a, b) => a.order - b.order);
  const subjectCheckboxes = MOCK_MASTER_SUBJECTS.filter(s => s.visible !== false).map(s => `
    <label style="display:flex;align-items:center;gap:7px;font-size:12.5px;cursor:pointer;margin:0">
      <input type="checkbox" name="course-subjects-cb" value="${s.id}" ${selectedSubjectIds.includes(s.id) ? 'checked' : ''}/>
      <span>${s.name}</span>
    </label>
  `).join('');
  const classHourInputs = types.map(t => `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:12px 14px;border:1px solid #E5E7EB;border-radius:9px;background:#FAFAFA">
      <label class="tsa-label" style="margin:0">${t.name}</label>
      <div style="display:flex;align-items:center;gap:6px">
        <input type="number" class="tsa-input course-class-hours" data-code="${t.code}" value="${classHours[t.code] || 0}" min="0" max="12" step="1" style="width:82px;text-align:center"/>
        <span style="font-size:12px;color:#6B7280">시간/일</span>
      </div>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="tsa-form-group">
      <label class="tsa-label">과목 설정</label>
      <div style="border:1px solid #E5E7EB;border-radius:8px;padding:12px;display:grid;grid-template-columns:1fr 1fr;gap:9px;background:#F9FAFB;max-height:180px;overflow-y:auto">
        ${subjectCheckboxes || '<div style="color:#9CA3AF;font-size:12px">등록된 과목이 없습니다.</div>'}
      </div>
    </div>
    <div class="tsa-form-group">
      <label class="tsa-label">수업별 일일 시수</label>
      <div style="display:flex;flex-direction:column;gap:8px">${classHourInputs}</div>
    </div>
  `;
}

function saveCourse() {
  const name = document.getElementById('add-course-name').value.trim();

  if (!name) {
    showToast('과정명을 입력해주세요.', 'warning');
    return;
  }

  const levels = [];
  document.querySelectorAll('input[name="course-levels-cb"]:checked').forEach(cb => {
    levels.push(cb.value);
  });

  const subjects = [...document.querySelectorAll('input[name="course-subjects-cb"]:checked')]
    .map(cb => ({ id: cb.value }));
  const classHours = {};
  document.querySelectorAll('.course-class-hours').forEach(input => {
    classHours[input.dataset.code] = Math.max(0, parseInt(input.value, 10) || 0);
  });

  const existingCourse = _editingCourseIdx !== null ? MOCK_COURSES[_editingCourseIdx] : null;
  const type = existingCourse ? existingCourse.type : '일반 영어';
  const fee = existingCourse ? existingCourse.fee : 0;
  const active = existingCourse ? existingCourse.active !== false : true;

  const courseData = {
    name, type, fee,
    active, subjects, subjectsByType: null, classHours, levels,
    oneone: classHours['1:1'] || 0,
    group1on4: classHours['1:4'] || 0,
    group: classHours['1:8'] || 0,
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

function toggleCourseVisibility(idx) {
  const course = MOCK_COURSES[idx];
  if (!course) return;
  course.active = course.active === false;
  showToast(`${course.name} 과정이 ${course.active ? '노출' : '숨김'} 처리되었습니다.`, 'success');
  renderCourseList();
}

// --- 과목 및 레벨 설정 CRUD 로직 ---
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
        <td style="text-align:center">${visibleBadge}</td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openEditLevelModal(${idx})">수정</button>
        </td>
      </tr>
    `;
    }).join('');
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
  }

  MOCK_MASTER_CLASS_TYPES.forEach(c => {
    c.minStudents = 1;
    if (!c.classMode) c.classMode = Number(c.maxStudents || 1) === 1 ? 'individual' : 'group';
  });
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
        <td style="font-weight:600;font-size:12.5px">${c.name}</td>
        <td style="text-align:center"><span class="tsa-badge ${c.classMode === 'individual' ? 'tsa-badge-primary' : 'tsa-badge-warning'}">${c.classMode === 'individual' ? '개인' : '그룹'}</span></td>
        <td style="text-align:center;font-size:12px">1명</td>
        <td style="text-align:center;font-size:12px">${c.maxStudents}명</td>
        <td style="font-size:12px;color:#374151">${getClassTypeDisplayName(c)}</td>
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

function getClassTypeDisplayName(classType) {
  const name = classType?.name || '수업';
  const maxStudents = Math.max(1, Number(classType?.maxStudents || 1));
  return classType?.classMode === 'individual' || maxStudents === 1
    ? `1:1 ${name}`
    : `최대 ${maxStudents}명 ${name}`;
}

function updateClassTypePreview() {
  const name = document.getElementById('classtype-modal-name')?.value.trim() || '수업 유형명';
  const classMode = document.getElementById('classtype-modal-mode')?.value || 'group';
  const maxInput = document.getElementById('classtype-modal-max');
  let maxStudents = Math.max(1, parseInt(maxInput?.value, 10) || 1);
  if (classMode === 'individual') {
    maxStudents = 1;
    if (maxInput) maxInput.value = '1';
  }
  const preview = document.getElementById('classtype-modal-preview');
  if (preview) preview.textContent = getClassTypeDisplayName({ name, classMode, maxStudents });
}

function openClassTypeModal() {
  _editingClassTypeIdx = null;
  document.getElementById('classtype-modal-title').textContent = '수업 유형 추가';
  document.getElementById('classtype-modal-id').value = '';
  document.getElementById('classtype-modal-name').value = '';
  document.getElementById('classtype-modal-mode').value = 'group';
  document.getElementById('classtype-modal-max').value = '4';
  updateClassTypePreview();
  openModal('classtype-modal');
}

function openEditClassTypeModal(idx) {
  _editingClassTypeIdx = idx;
  const c = MOCK_MASTER_CLASS_TYPES[idx];
  if (!c) return;
  document.getElementById('classtype-modal-title').textContent = '수업 유형 수정';
  document.getElementById('classtype-modal-id').value = c.id;
  document.getElementById('classtype-modal-name').value = c.name;
  document.getElementById('classtype-modal-mode').value = c.classMode || (Number(c.maxStudents) === 1 ? 'individual' : 'group');
  document.getElementById('classtype-modal-max').value = c.maxStudents;
  updateClassTypePreview();
  openModal('classtype-modal');
}

function saveMasterClassType() {
  const name = document.getElementById('classtype-modal-name').value.trim();
  const classMode = document.getElementById('classtype-modal-mode').value || 'group';
  const maxStudents = parseInt(document.getElementById('classtype-modal-max').value) || 1;

  if (!name) {
    showToast('수업 유형명을 입력하세요.', 'warning');
    return;
  }
  if (classMode === 'individual' && maxStudents !== 1) {
    showToast('개인 수업의 최대 인원은 1명으로 설정해줘.', 'warning');
    return;
  }

  if (_editingClassTypeIdx !== null) {
    const c = MOCK_MASTER_CLASS_TYPES[_editingClassTypeIdx];
    c.name = name;
    c.classMode = classMode;
    c.minStudents = 1;
    c.maxStudents = maxStudents;
    showToast('수업 유형 정보가 수정되었습니다.', 'success');
  } else {
    const newId = 'CT_' + String(MOCK_MASTER_CLASS_TYPES.length + 1).padStart(2, '0');
    MOCK_MASTER_CLASS_TYPES.push({ id: newId, code: newId, name, classMode, minStudents: 1, maxStudents, order: MOCK_MASTER_CLASS_TYPES.length + 1, visible: true });
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
  document.getElementById('subject-modal-title').textContent = '과목 추가';
  document.getElementById('subject-modal-id').value = '';
  document.getElementById('subject-modal-name').value = '';
  openModal('subject-modal');
}

function openEditSubjectModal(idx) {
  _editingSubjectIdx = idx;
  const s = MOCK_MASTER_SUBJECTS[idx];
  if (!s) return;

  document.getElementById('subject-modal-title').textContent = '과목 수정';
  document.getElementById('subject-modal-id').value = s.id;
  document.getElementById('subject-modal-name').value = s.name;
  openModal('subject-modal');
}

function saveMasterSubject() {
  const name = document.getElementById('subject-modal-name').value.trim();

  if (!name) {
    showToast('과목명을 입력하세요.', 'warning');
    return;
  }

  if (_editingSubjectIdx !== null) {
    const s = MOCK_MASTER_SUBJECTS[_editingSubjectIdx];
    s.name = name;
    showToast('과목 정보가 수정되었습니다.', 'success');
  } else {
    const newId = 'SUB_' + String(MOCK_MASTER_SUBJECTS.length + 1).padStart(2, '0');
    MOCK_MASTER_SUBJECTS.push({ id: newId, name, order: MOCK_MASTER_SUBJECTS.length + 1, visible: true });
    showToast('신규 과목이 추가되었습니다.', 'success');
  }

  closeModal('subject-modal');
  renderMasterSettings();
}

function deleteMasterSubject(idx) {
  const s = MOCK_MASTER_SUBJECTS[idx];
  if (!confirm(`과목 [${s.name}]을 삭제하시겠습니까? 이 과목이 할당된 기존 과정에서도 해제될 수 있습니다.`)) return;
  MOCK_MASTER_SUBJECTS.splice(idx, 1);
  showToast('과목이 삭제되었습니다.', 'success');
  renderMasterSettings();
}

function openLevelModal() {
  _editingLevelIdx = null;
  document.getElementById('level-modal-title').textContent = '레벨 추가';
  document.getElementById('level-modal-id').value = '';
  document.getElementById('level-modal-name').value = '';
  document.getElementById('level-modal-order').value = MOCK_MASTER_LEVELS.length + 1;
  openModal('level-modal');
}

function openEditLevelModal(idx) {
  _editingLevelIdx = idx;
  const l = MOCK_MASTER_LEVELS[idx];
  if (!l) return;

  document.getElementById('level-modal-title').textContent = '레벨 수정';
  document.getElementById('level-modal-id').value = l.id;
  document.getElementById('level-modal-name').value = l.name;
  document.getElementById('level-modal-order').value = l.order;
  openModal('level-modal');
}

function saveMasterLevel() {
  const name = document.getElementById('level-modal-name').value.trim();
  const order = parseInt(document.getElementById('level-modal-order').value, 10) || 1;

  if (!name) {
    showToast('레벨명을 입력하세요.', 'warning');
    return;
  }

  if (_editingLevelIdx !== null) {
    const l = MOCK_MASTER_LEVELS[_editingLevelIdx];
    l.name = name;
    l.order = order;
    showToast('레벨 정보가 수정되었습니다.', 'success');
  } else {
    const newId = 'LV_' + String(MOCK_MASTER_LEVELS.length + 1).padStart(2, '0');
    MOCK_MASTER_LEVELS.push({ id: newId, name, order, visible: true });
    showToast('신규 레벨이 추가되었습니다.', 'success');
  }

  closeModal('level-modal');
  renderMasterSettings();
}

function deleteMasterLevel(idx) {
  const l = MOCK_MASTER_LEVELS[idx];
  if (!confirm(`레벨 [${l.name}]을 삭제하시겠습니까?`)) return;
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

