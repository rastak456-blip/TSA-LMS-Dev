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
    'Regular +': 800,
    'Regular': 700,
    'Intensive': 850,
    'Power Speaking 6': 900,
    'Power Speaking 8': 980,
    '6Hrs Regular': 600,
    '6Hrs Intensive': 650,
    '6Hrs Power Speaking': 700,
    'IELTS Intensive': 950,
    'Special English(TOEIC, Business)': 900,
    'Junior ESL': 880,
    'Junior Camp': 650,
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
    'Regular +': generalPrice,
    'Regular': generalPrice - 100,
    'Intensive': generalPrice + 50,
    'Power Speaking 6': generalPrice + 100,
    'Power Speaking 8': generalPrice + 180,
    '6Hrs Regular': generalPrice - 200,
    '6Hrs Intensive': generalPrice - 150,
    '6Hrs Power Speaking': generalPrice - 100,
    'IELTS Intensive': generalPrice + 150,
    'Special English(TOEIC, Business)': generalPrice + 100,
    'Junior ESL': generalPrice + 80,
    'Junior Camp': generalPrice - 150,
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

// 코스 변경(업그레이드) 요청의 예상 차액 — MOCK_COURSES의 주당 요금(fee) 차이 × 잔여 수강 주수.
// 실제 청구/인보이스 반영은 승인 후 별도 처리(코스 변경 승인 시 수정 인보이스 발행 등)로 분리한다.
function computeCoursePriceDiff(fromCourseName, toCourseName, weeks) {
  if (typeof MOCK_COURSES === 'undefined') return 0;
  const from = MOCK_COURSES.find(c => c.name === fromCourseName);
  const to = MOCK_COURSES.find(c => c.name === toCourseName);
  const fromFee = from ? Number(from.fee || 0) : 0;
  const toFee = to ? Number(to.fee || 0) : 0;
  return Math.max(0, Math.round((toFee - fromFee) * Number(weeks || 0)));
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
  { id:1, studentId:1,  studentName:'HONG GILDONG (Kevin)',  course:'IELTS Intensive', net:2080, remitDate:'2026-05-10', submittedAt:'2026-05-10', receipt:'영수증_Kevin.pdf',  status:'approved', note:'송금 확인 완료. 등록 확정 처리.', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:2, studentId:2,  studentName:'LEE YOUNGEOH (James)',  course:'Regular',        net:1138, remitDate:'2026-06-08', submittedAt:'2026-06-08', receipt:'영수증_James.pdf',  status:'approved', note:'송금 확인 완료. 등록 확정 처리.', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:3, studentId:9,  studentName:'KIM MINJUN (Minjun)',   course:'IELTS Intensive', net:2240, remitDate:'2026-06-12', submittedAt:'2026-06-12', receipt:'영수증_Minjun_임시.pdf', status:'pending', note:'환율 변동으로 금액 재확인 중 — 이체 예정일 6/20', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'' },
  { id:4, studentId:12, studentName:'NGUYEN THI LAN (Lan)',  course:'가디언 코스',      net:1600, remitDate:'2026-05-28', submittedAt:'2026-05-28', receipt:'영수증_Lan.pdf',    status:'approved', note:'에이전시 선납 확인 완료.', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:5, studentId:13, studentName:'PHAM MINH DUC (Duc)',   course:'IELTS Intensive', net:3360, remitDate:'2026-06-14', submittedAt:'2026-06-14', receipt:'영수증_Duc.pdf',    status:'pending',  note:'', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'' },
  { id:6, studentId:25, studentName:'SHIN EUNSOO (Erin)',    course:'Junior ESL',    net:2261, remitDate:'2026-05-25', submittedAt:'2026-05-25', receipt:'영수증_Erin_1차.pdf', status:'approved', note:'1차 송금 확인 완료. 등록 확정 처리.', bank:'국민은행', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
  { id:7, studentId:25, studentName:'SHIN EUNSOO (Erin)',    course:'Junior ESL',    net:150,  remitDate:'2026-06-01', submittedAt:'2026-06-01', receipt:'영수증_Erin_보증금.pdf', status:'approved', note:'보증금 입금 확인 완료.', bank:'신한은행', agency:'한국 영어마을', submittedBy:'김에이전트', approvedBy:'본사 슈퍼어드민' },
];
let MOCK_DORM_BOOK_REQUESTS = [];

const MOCK_CHANGE_REQUESTS = [
  { id:1, studentName:'이수빈 (James)',  field:'항공편 (입국)', oldVal:'PR502 | 2026-06-15', newVal:'PR734 | 2026-06-20', reason:'항공편 변경됨',     reqDate:'2026-05-20', status:'approved' },
  { id:2, studentName:'박민준 (Minjun)', field:'수강 기간',     oldVal:'8주',               newVal:'12주',              reason:'학생 요청으로 연장', reqDate:'2026-06-02', status:'pending'  },
  { id:3, studentName:'김수빈 (Subin)',  field:'비자 만료일',   oldVal:'2026-08-01',         newVal:'2026-10-01',        reason:'비자 갱신 완료',     reqDate:'2026-06-05', status:'rejected' },
];

// ===== 학생 요청(외출증/외박/여행/선생님변경/코스변경/룸변경) 온라인화 =====
// 요청은 학생별 배열이 아니라 전역 큐에 studentId로 저장한다 (MOCK_CHANGE_REQUESTS/MOCK_DORM_BOOK_REQUESTS와 동일 관례).
// 관리자 리스트 화면에서 날짜별로 한번에 훑어보고, 학생 상세의 '학생 요청' 탭에서는 studentId로 필터링해 보여준다.
let MOCK_STUDENT_REQUESTS = [
  { id: 9001, studentId: 1, studentName: 'HONG GILDONG (Kevin)', type: 'outpass', submittedAt: '2026-08-13 09:20', submittedBy: '학생', status: 'pending', reviewedBy: null, reviewedAt: null, reviewNote: null,
    payload: { reason: '은행 업무', destination: 'BDO Cebu 지점', returnTime: '18:00' } },
  { id: 9002, studentId: 5, studentName: 'PARK SOYEON (Sophie)', type: 'overnight', submittedAt: '2026-08-13 11:05', submittedBy: '학생', status: 'pending', reviewedBy: null, reviewedAt: null, reviewNote: null,
    payload: { location: '친구 자취방 (IT Park 인근)', emergencyContact: '카카오톡 ID: soyeon_p' } },
  { id: 9003, studentId: 9, studentName: 'KIM MINJUN', type: 'teacher_change', submittedAt: '2026-08-12 15:40', submittedBy: '학생', status: 'approved', reviewedBy: '슈퍼 어드민', reviewedAt: '2026-08-12 17:00', reviewNote: '수·목 접수건 확인, 차주 월요일 시간표 반영 예정',
    payload: { currentTeacher: 'Mike', requestedTeacher: 'Sarah', reason: 'IELTS 집중 대비를 위해 전문 강사로 변경 희망' } },
  { id: 9004, studentId: 13, studentName: 'PHAM MINH DUC', type: 'course_change', submittedAt: '2026-08-11 10:00', submittedBy: '학생', status: 'rejected', reviewedBy: '슈퍼 어드민', reviewedAt: '2026-08-11 14:20', reviewNote: '잔여 수강 기간 부족으로 반려, 다음 차수에 재신청 안내',
    payload: { fromCourse: 'Regular', toCourse: 'Intensive', direction: 'upgrade', priceDiff: 420 } },
];

function getStudentRequestTypeLabel(type) {
  return ({ outpass: '외출증', overnight: '외박', trip: '여행(1박+)', teacher_change: '선생님 변경', course_change: '코스 변경', room_change: '룸 변경' })[type] || type;
}

function getStudentRequestTypeColor(type) {
  return ({
    outpass: { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
    overnight: { bg: '#FDF4FF', color: '#7E22CE', border: '#E9D5FF' },
    trip: { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
    teacher_change: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
    course_change: { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
    room_change: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  })[type] || { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' };
}

function renderStudentRequestStatusBadge(status) {
  if (status === 'approved') return '<span class="tsa-badge tsa-badge-success">승인</span>';
  if (status === 'rejected') return '<span class="tsa-badge tsa-badge-danger">반려</span>';
  return '<span class="tsa-badge tsa-badge-warning">대기중</span>';
}

// 요청 payload를 리스트/상세 화면에서 한 줄로 요약해서 보여준다.
function summarizeStudentRequestPayload(request) {
  const p = request.payload || {};
  switch (request.type) {
    case 'outpass': return `${p.destination || '-'} · 귀환 예정 ${p.returnTime || '-'}`;
    case 'overnight': return `${p.location || '-'} · 비상연락처 ${p.emergencyContact || '-'}`;
    case 'trip': return `${p.destination || '-'} · ${p.hotel || '숙소 미정'} · ${p.companion || '동행 정보 없음'}`;
    case 'teacher_change': return `${p.currentTeacher || '-'} → ${p.requestedTeacher || '-'}`;
    case 'course_change': return `${p.fromCourse || '-'} → ${p.toCourse || '-'} (${p.direction === 'upgrade' ? `업그레이드 · 차액 $${p.priceDiff || 0}` : '다운그레이드 · 환불 없음'})`;
    case 'room_change': return `${p.fromRoom || '-'} → ${p.toRoom || '-'} (${p.changeKind || '일반'})`;
    default: return '-';
  }
}

// 유형별 신청서 제목 — 서류(인쇄/열람)용 공식 문서 명칭.
function getStudentRequestDocumentTitle(type) {
  return ({
    outpass: '외출증 신청서', overnight: '외박 신청서', trip: '여행 신청서 (1박 이상)',
    teacher_change: '선생님 변경 신청서', course_change: '코스 변경 신청서', room_change: '룸 변경 신청서',
  })[type] || '학생 요청 신청서';
}

// 요청 payload를 신청서 양식의 항목-값 목록으로 변환한다. renderStudentRequestDocumentHTML에서 표로 렌더링.
function getStudentRequestDocumentFields(request) {
  const p = request.payload || {};
  switch (request.type) {
    case 'outpass':
      return [
        { label: '외출 사유', value: p.reason || '-' },
        { label: '목적지', value: p.destination || '-' },
        { label: '귀환 예정 시각', value: p.returnTime || '-' },
      ];
    case 'overnight':
      return [
        { label: '숙박 장소', value: p.location || '-' },
        { label: '비상 연락처', value: p.emergencyContact || '-' },
      ];
    case 'trip':
      return [
        { label: '목적지', value: p.destination || '-' },
        { label: '숙박 호텔', value: p.hotel || '숙소 미정' },
        { label: '동행 여부', value: p.companion || '동행 정보 없음' },
      ];
    case 'teacher_change':
      return [
        { label: '현재 담당 교사', value: p.currentTeacher || '-' },
        { label: '변경 희망 교사', value: p.requestedTeacher || '-' },
        { label: '변경 사유', value: p.reason || '-' },
        { label: '접수 마감 정책', value: '매주 수·목요일 이전 접수건에 한해 검토, 승인 시 차주 월요일 시간표부터 적용' },
      ];
    case 'course_change':
      return [
        { label: '현재 코스', value: p.fromCourse || '-' },
        { label: '변경 희망 코스', value: p.toCourse || '-' },
        { label: '변경 구분', value: p.direction === 'upgrade' ? '업그레이드 (차액 추가 결제)' : '다운그레이드 (환불 없음)' },
        { label: '예상 차액', value: p.direction === 'upgrade' ? `$${Number(p.priceDiff || 0).toLocaleString()}` : '$0' },
        { label: '접수 마감 정책', value: '매주 수·목요일 이전 접수건에 한해 검토, 승인 시 차주 월요일부터 적용' },
      ];
    case 'room_change':
      return [
        { label: '현재 룸', value: p.fromRoom || '-' },
        { label: '변경 희망 룸', value: p.toRoom || '-' },
        { label: '변경 구분', value: p.changeKind || '일반' },
        { label: '예상 차액', value: p.changeKind === '업그레이드' ? `$${Number(p.priceDiff || 0).toLocaleString()}` : '$0' },
      ];
    default:
      return [];
  }
}

// 학생 요청 1건을 공식 서류 양식(레터헤드 + 학생정보 + 항목표 + 승인란)으로 렌더링한다.
// 인보이스 문서(renderInvoiceDocumentSnapshot)와 동일한 톤앤매너를 사용해 나중에 뽑아서(인쇄) 확인할 수 있게 한다.
function renderStudentRequestDocumentHTML(request, student) {
  const esc = (typeof escapeStudentPopupHtml === 'function') ? escapeStudentPopupHtml : (v => v);
  const fields = getStudentRequestDocumentFields(request);
  const statusLabel = { pending: '검토 대기중', approved: '승인', rejected: '반려' }[request.status] || request.status;
  const statusColor = request.status === 'approved' ? '#047857' : request.status === 'rejected' ? '#B91C1C' : '#B45309';
  const reviewRows = request.status !== 'pending' ? `
    <div style="display:flex;justify-content:space-between"><span style="color:#64748B">검토자</span><strong>${esc(request.reviewedBy || '-')}</strong></div>
    <div style="display:flex;justify-content:space-between"><span style="color:#64748B">검토 일시</span><strong>${esc(request.reviewedAt || '-')}</strong></div>
    ${request.reviewNote ? `<div style="margin-top:6px;color:#475569">검토 의견: ${esc(request.reviewNote)}</div>` : ''}
  ` : '';

  return `
    <div class="sr-doc-print" style="max-width:820px;margin:0 auto;background:#fff;border:1px solid #DDE3EC;color:#1F2937;font-family:Arial, sans-serif">
      <div style="padding:22px 26px;background:#172554;color:#fff;display:flex;justify-content:space-between;align-items:start">
        <div><div style="font-size:20px;font-weight:900;letter-spacing:1px">TALKSTATION ACADEMY</div><div style="font-size:11px;color:#BFDBFE;margin-top:5px">Cebu Campus · Student Request Form</div></div>
        <div style="text-align:right"><div style="font-size:20px;font-weight:300;letter-spacing:1px">${esc(getStudentRequestDocumentTitle(request.type))}</div><div style="font-size:11px;color:#BFDBFE;margin-top:5px">No. SR-${request.id} · ${esc(request.submittedAt)}</div></div>
      </div>
      <div style="padding:22px 26px">
        <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px;margin-bottom:18px">
          <div><div style="font-size:10px;font-weight:800;color:#64748B;margin-bottom:7px">STUDENT INFORMATION</div><div style="font-size:15px;font-weight:900">${esc(request.studentName)}</div><div style="font-size:11.5px;line-height:1.7;color:#475569;margin-top:5px">Nick: ${esc(student?.nick || '-')} · ${esc(student?.nationality || '-')}<br>Course: ${esc(student?.course || '-')}</div></div>
          <div style="font-size:11.5px;line-height:1.8">
            <div style="display:flex;justify-content:space-between"><span style="color:#64748B">Submitted By</span><strong>${esc(request.submittedBy || '학생')}</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#64748B">Status</span><strong style="color:${statusColor}">${statusLabel}</strong></div>
            ${reviewRows}
          </div>
        </div>
        <div style="font-size:12px;font-weight:900;color:#172554;margin:0 0 8px">REQUEST DETAILS</div>
        <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:24px">
          <tbody>
            ${fields.map(f => `
              <tr>
                <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB;background:#F8FAFC;width:170px;font-weight:700;color:#475569">${esc(f.label)}</td>
                <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB">${esc(String(f.value))}</td>
              </tr>`).join('')}
          </tbody>
        </table>
        <div style="display:flex;justify-content:space-between;align-items:end;margin-top:10px"><div style="font-size:10.5px;line-height:1.6;color:#64748B">TalkStation Academy · Cebu Campus<br>Official Student Request Document</div><div style="width:190px;text-align:center;font-size:10.5px"><div style="height:30px;border-bottom:1px solid #334155;margin-bottom:6px"></div><strong>Authorized Signature / Seal</strong></div></div>
      </div>
    </div>`;
}

// 서류 열람 모달 — 학생 요청 리스트/상세 탭 어디서든 호출해서 인쇄용 양식을 확인한다.
function openStudentRequestDocument(requestId) {
  const request = MOCK_STUDENT_REQUESTS.find(r => r.id === requestId);
  if (!request) return;
  const student = MOCK_STUDENTS.find(s => s.id === request.studentId);
  let modal = document.getElementById('student-request-doc-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'student-request-doc-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:2500;background:rgba(15,23,42,.48);display:flex;align-items:center;justify-content:center;padding:24px';
    modal.addEventListener('click', event => { if (event.target === modal) closeStudentRequestDocument(); });
    document.body.appendChild(modal);
  }
  modal.dataset.requestId = String(requestId);
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div style="width:min(880px,100%);max-height:90vh;background:#F1F5F9;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.25);display:flex;flex-direction:column;overflow:hidden" onclick="event.stopPropagation()">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 20px;border-bottom:1px solid #E5E7EB;background:#fff">
        <div style="font-size:14px;font-weight:900;color:#111827">${getStudentRequestDocumentTitle(request.type)} 서류 보기</div>
        <div style="display:flex;gap:8px">
          <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="printStudentRequestDocument()"><i data-lucide="printer"></i> 인쇄 / PDF 저장</button>
          <button class="tsa-modal-close" onclick="closeStudentRequestDocument()"><i data-lucide="x"></i></button>
        </div>
      </div>
      <div style="padding:22px;overflow-y:auto">${renderStudentRequestDocumentHTML(request, student)}</div>
    </div>`;
  if (typeof refreshIcons === 'function') refreshIcons();
}

function closeStudentRequestDocument() {
  const modal = document.getElementById('student-request-doc-modal');
  if (modal) {
    modal.innerHTML = '';
    modal.style.display = 'none';
  }
}

// 모달 내용을 새 창으로 열어 인쇄(=서류로 뽑기)한다. 인보이스 문서 인쇄(printAgencyInlineDocument)와 동일한 패턴.
function printStudentRequestDocument() {
  const modal = document.getElementById('student-request-doc-modal');
  const requestId = Number(modal?.dataset.requestId);
  const request = MOCK_STUDENT_REQUESTS.find(r => r.id === requestId);
  if (!request) return;
  const student = MOCK_STUDENTS.find(s => s.id === request.studentId);
  const printHtml = renderStudentRequestDocumentHTML(request, student);
  const printWindow = window.open('', '_blank', 'width=960,height=900');
  if (!printWindow) {
    showToast('인쇄 창을 열 수 없어. 브라우저 팝업 허용을 확인해줘.', 'warning');
    return;
  }
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${getStudentRequestDocumentTitle(request.type)} · ${request.studentName}</title><style>body{margin:0;padding:24px;font-family:Pretendard,Arial,sans-serif;color:#111827;background:#fff}*{box-sizing:border-box}@media print{body{padding:0}}</style></head><body>${printHtml}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 200);
}

// 선생님/코스 변경은 수·목요일 접수분만 검토 대상 — Focus_TimeTable.md 정책과 동일하게, 학생 포탈의
// studentPortalDay 시뮬레이터를 그대로 참조해 마감 배지를 계산한다 (실제 요일 판정 로직 통일).
function isWithinTeacherCourseChangeDeadline() {
  const day = (typeof studentPortalDay !== 'undefined') ? studentPortalDay : 'Wed';
  return day === 'Wed' || day === 'Thu';
}

// 관리자 '학생 요청 관리' 리스트 화면. 날짜(제출일) / 유형 / 상태로 필터링해서 전체 학생의 요청을 한번에 훑어본다.
let _studentRequestFilters = { date: '', type: 'all', status: 'all' };

function initStudentRequestListPage() {
  const dateEl = document.getElementById('sr-filter-date');
  if (dateEl) dateEl.value = _studentRequestFilters.date;
  renderStudentRequestListFilters();
  renderStudentRequestListTable();
}

function renderStudentRequestListFilters() {
  document.querySelectorAll('[data-sr-type]').forEach(btn => {
    const active = btn.dataset.srType === _studentRequestFilters.type;
    btn.style.borderColor = active ? '#6366F1' : '#E5E7EB';
    btn.style.background = active ? '#EEF2FF' : '#fff';
    btn.style.color = active ? '#4F46E5' : '#6B7280';
  });
  document.querySelectorAll('[data-sr-status]').forEach(btn => {
    const active = btn.dataset.srStatus === _studentRequestFilters.status;
    btn.style.borderColor = active ? '#6366F1' : '#E5E7EB';
    btn.style.background = active ? '#EEF2FF' : '#fff';
    btn.style.color = active ? '#4F46E5' : '#6B7280';
  });
}

function setStudentRequestDateFilter(value) {
  _studentRequestFilters.date = value || '';
  renderStudentRequestListTable();
}

function setStudentRequestTypeFilter(type) {
  _studentRequestFilters.type = type;
  renderStudentRequestListFilters();
  renderStudentRequestListTable();
}

function setStudentRequestStatusFilter(status) {
  _studentRequestFilters.status = status;
  renderStudentRequestListFilters();
  renderStudentRequestListTable();
}

function getFilteredStudentRequests() {
  return MOCK_STUDENT_REQUESTS.filter(r => {
    if (_studentRequestFilters.date && !r.submittedAt.startsWith(_studentRequestFilters.date)) return false;
    if (_studentRequestFilters.type !== 'all' && r.type !== _studentRequestFilters.type) return false;
    if (_studentRequestFilters.status !== 'all' && r.status !== _studentRequestFilters.status) return false;
    return true;
  }).slice().sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

function renderStudentRequestListTable() {
  const body = document.getElementById('sr-list-body');
  const countEl = document.getElementById('sr-list-count');
  if (!body) return;
  const list = getFilteredStudentRequests();
  if (countEl) countEl.textContent = `${list.length}건`;

  body.innerHTML = list.length ? list.map(r => {
    const typeColor = getStudentRequestTypeColor(r.type);
    const deadlineNote = (r.type === 'teacher_change' || r.type === 'course_change') && r.status === 'pending'
      ? `<div style="font-size:9.5px;color:${isWithinTeacherCourseChangeDeadline() ? '#059669' : '#DC2626'};margin-top:3px">${isWithinTeacherCourseChangeDeadline() ? '수·목 접수 가능일' : '수·목 마감 — 차차주 반영 대상'}</div>`
      : '';
    return `
      <tr>
        <td style="font-weight:700">${r.studentName}</td>
        <td><span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${typeColor.bg};color:${typeColor.color};border:1px solid ${typeColor.border};font-size:10.5px;font-weight:800">${getStudentRequestTypeLabel(r.type)}</span></td>
        <td style="font-size:11px;color:#6B7280;white-space:nowrap">${r.submittedAt}${deadlineNote}</td>
        <td style="font-size:11.5px;color:#374151">${summarizeStudentRequestPayload(r)}</td>
        <td style="text-align:center">${renderStudentRequestStatusBadge(r.status)}</td>
        <td style="text-align:center;white-space:nowrap">
          ${r.status === 'pending' ? `
            <button class="tsa-btn tsa-btn-success tsa-btn-xs" style="background:#10B981;border:none" onclick="approveStudentRequest(${r.id})">승인</button>
            <button class="tsa-btn tsa-btn-danger tsa-btn-xs" onclick="rejectStudentRequest(${r.id})">반려</button>
          ` : ''}
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openStudentRequestDocument(${r.id})"><i data-lucide="file-text"></i> 서류 보기</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openStudentDetail(${r.studentId}, 'request')">학생 상세</button>
        </td>
      </tr>`;
  }).join('') : `<tr><td colspan="6" style="text-align:center;padding:30px;color:#9CA3AF;font-size:12px">해당 조건의 요청이 없습니다.</td></tr>`;
  if (typeof refreshIcons === 'function') refreshIcons();
}

function approveStudentRequest(id) {
  const r = MOCK_STUDENT_REQUESTS.find(item => item.id === id);
  if (!r) return;
  r.status = 'approved';
  r.reviewedBy = stayCurrentActor();
  r.reviewedAt = stayNowStamp();
  showToast(`✓ [${getStudentRequestTypeLabel(r.type)}] ${r.studentName} 요청을 승인했습니다.`, 'success');
  renderStudentRequestListTable();
  if (typeof refreshStudentRequestTabIfOpen === 'function') refreshStudentRequestTabIfOpen(r.studentId);
}

function rejectStudentRequest(id) {
  const r = MOCK_STUDENT_REQUESTS.find(item => item.id === id);
  if (!r) return;
  const note = prompt('반려 사유를 입력하십시오:');
  if (note === null) return;
  r.status = 'rejected';
  r.reviewedBy = stayCurrentActor();
  r.reviewedAt = stayNowStamp();
  r.reviewNote = note.trim() || '사유 미입력';
  showToast(`🗑️ [${getStudentRequestTypeLabel(r.type)}] ${r.studentName} 요청을 반려했습니다.`, 'success');
  renderStudentRequestListTable();
  if (typeof refreshStudentRequestTabIfOpen === 'function') refreshStudentRequestTabIfOpen(r.studentId);
}

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
      field: '학생 정산 방식',
      from: getRemittanceRouteLabel(previousRoute),
      to: getRemittanceRouteLabel(route),
      reason: `${source}에서 직접 변경`,
      changedBy: APP.user === 'agency_head' ? '에이전시 본사' : APP.user === 'agency_branch' ? '에이전시 지사' : '관리자',
      requestDate: new Date().toISOString().substring(0, 10),
    });
    showToast(`학생 정산 방식가 '${getRemittanceRouteLabel(route)}'(으)로 변경되었습니다.`, 'success');
  }

  initAgencyStudentList();
}

function updateStudentLevel(studentId, level, source = '상세') {
  const student = MOCK_STUDENTS.find(row => row.id === Number(studentId));
  if (!student) return;

  const previousLevel = student.level || '미정';
  student.level = level;

  if (previousLevel !== (level || '미정')) {
    if (!student.changeRequests) student.changeRequests = [];
    student.changeRequests.push({
      id: Date.now() + Math.random(),
      field: '레벨',
      from: previousLevel,
      to: level || '미정',
      reason: `${source}에서 직접 변경`,
      changedBy: APP.user === 'agency_head' ? '에이전시 본사' : APP.user === 'agency_branch' ? '에이전시 지사' : '관리자',
      requestDate: new Date().toISOString().substring(0, 10),
    });
    showToast(`레벨이 '${level || '미정'}'(으)로 변경되었습니다.`, 'success');
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
        <td style="font-size:10.5px;white-space:nowrap">
          <select class="tsa-input" aria-label="${s.name} 학생 정산 방식" style="width:100%;height:30px;padding:3px 22px 3px 6px;background:#fff;font-size:10.5px;font-weight:700;color:#4338CA" onchange="updateStudentRemittanceRoute(${s.id}, this.value, '학생 관리')">
            ${renderRemittanceRouteOptions(remittanceRoute)}
          </select>
        </td>
        <td>${renderAgencyBillingCompactCell(billingMap.registration)}</td>
        <td>${renderAgencyBillingCompactCell(billingMap.education)}</td>
        <td>${renderAgencyBillingCompactCell(billingMap.dorm)}</td>
        <td>${renderAgencyBillingCompactCell(billingMap.local)}</td>
        <td style="padding:6px 4px">
          <div style="display:grid;grid-template-columns:auto auto;justify-content:center;column-gap:6px;row-gap:3px;font-size:9px;line-height:1.25;white-space:nowrap">
            <span style="color:#6B7280">어학원 송금</span><strong style="text-align:right;color:#059669">$${billingBreakdown.net.toLocaleString()}</strong>
            <span style="color:#6B7280">커미션</span><strong style="text-align:right;color:#4F46E5">$${billingBreakdown.commission.toLocaleString()}</strong>
            <span style="font-weight:700;color:#374151;border-top:1px solid #E5E7EB;padding-top:3px">총 청구 금액</span><strong style="text-align:right;font-size:10.5px;color:#111827;border-top:1px solid #E5E7EB;padding-top:3px">$${billingBreakdown.gross.toLocaleString()}</strong>
          </div>
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

const COURSE_REG_PERIODS_BASE = [1, 2, 3, 4, 8, 12, 16, 20, 24];
// 비용 관리 화면의 "기간 옵션 관리"에서 추가한 장기 옵션(예: 36주, 48주)이 있으면 등록 기간 선택지에도 반영한다.
function getCourseRegPeriods() {
  const extra = typeof TUITION_RATE_TABLE_EXTRA_WEEKS !== 'undefined' && Array.isArray(TUITION_RATE_TABLE_EXTRA_WEEKS) ? TUITION_RATE_TABLE_EXTRA_WEEKS : [];
  return [...COURSE_REG_PERIODS_BASE, ...extra].sort((a, b) => a - b);
}

function formatCourseRegMoney(value) {
  return `$${Number(value || 0).toLocaleString()}`;
}

function getCourseRegPeriodFee(baseAmount, policy, weeks) {
  const base = Number(baseAmount || 0);
  // 과정(또는 기숙사 템플릿)에 전용 할증·할인 공식이 설정돼 있으면 그걸 우선 사용한다.
  if (policy?.useCustomFormula && policy?.weeklyRules && typeof computeTuitionRuleAmount === 'function') {
    return computeTuitionRuleAmount(base, weeks, policy.weeklyRules);
  }
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
  endEl.value = startDate && getCourseRegPeriods().includes(duration)
    ? calculateCourseRegSegmentEndDate(startDate, duration)
    : '';
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

// 시간표는 매주 월요일 기준으로 재작성되므로, 수강 시작일도 월요일로만 강제한다.
// 다른 요일을 고르면 같은 주의 월요일로 스냅해서 항상 유효한 값만 남긴다.
function snapToCourseRegMonday(dateStr) {
  if (!dateStr) return dateStr;
  const date = new Date(`${dateStr}T00:00:00Z`);
  const day = date.getUTCDay();
  if (day === 1) return dateStr;
  const offset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().split('T')[0];
}

function handleCourseRegStartChange() {
  const startEl = document.getElementById('course-reg-start');
  if (startEl && startEl.value) {
    const snapped = snapToCourseRegMonday(startEl.value);
    if (snapped !== startEl.value) {
      startEl.value = snapped;
      showToast('수강 시작일은 월요일만 선택할 수 있어 같은 주 월요일로 자동 변경했어.', 'warning');
    }
  }
  updateCourseRegSegmentEndPreview();
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
  const course = getCourseRegSelectedCourse();
  const duration = parseInt(document.getElementById('course-reg-duration')?.value, 10) || 0;
  const startDate = document.getElementById('course-reg-start')?.value || '';
  if (!course || !startDate || !getCourseRegPeriods().includes(duration)) {
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
  if (!course || course.active === false || !getCourseRegPeriods().includes(Number(weeks))) return;

  const courseEl = document.getElementById('course-reg-course');
  const durationEl = document.getElementById('course-reg-duration');
  if (courseEl) courseEl.value = course.name;
  if (durationEl) durationEl.value = String(weeks);

  updateCourseRegSegmentEndPreview();
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
      <div style="display:grid;grid-template-columns:180px repeat(${getCourseRegPeriods().length},minmax(96px,1fr));background:#F8FAFC;border-bottom:1px solid #E5E7EB">
        <div style="padding:9px 12px;font-size:11px;font-weight:800;color:#4B5563">과정명</div>
        ${getCourseRegPeriods().map(weeks => `
          <div style="padding:9px 6px;text-align:center;font-size:11px;font-weight:800;color:${selectedWeeks && weeks === selectedWeeks ? '#4338CA' : '#4B5563'};background:${selectedWeeks && weeks === selectedWeeks ? '#EEF2FF' : 'transparent'}">${weeks}주</div>
        `).join('')}
      </div>
      ${rows.map(({ course, index }, rowIndex) => `
        <div style="display:grid;grid-template-columns:180px repeat(${getCourseRegPeriods().length},minmax(96px,1fr));border-bottom:${rowIndex === rows.length - 1 ? '0' : '1px solid #EEF0F4'};background:#fff">
          <div style="padding:10px 12px;display:flex;flex-direction:column;justify-content:center;background:${selectedCourse?.name === course.name ? '#F8FAFF' : '#fff'}">
            <b style="font-size:12px;color:#111827">${course.name}</b>
            <span style="font-size:10px;color:#9CA3AF;margin-top:2px">${course.type || '과정'}</span>
          </div>
          ${getCourseRegPeriods().map(weeks => {
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
  if (!template || template.active === false || !getCourseRegPeriods().includes(Number(weeks))) return;
  const templateEl = document.getElementById('course-reg-dorm-template');
  const durationEl = document.getElementById('course-reg-dorm-duration');
  if (templateEl) templateEl.value = String(templateIndex);
  if (durationEl) durationEl.value = String(weeks);
  updateCourseRegDormCheckout();
  updateStudentCourseRegistrationPreview();
}

// 기숙사도 수강 구간처럼 여러 건을 쌓아 등록할 수 있게 하는 다중 구간 로직.
function getCourseRegDormSegments() {
  return Array.isArray(APP.courseRegDormSegments) ? APP.courseRegDormSegments : [];
}

function calculateCourseRegDormEndDate(startDate, weeks) {
  if (!startDate) return '';
  const date = new Date(`${startDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(weeks || 0) * 7);
  return date.toISOString().split('T')[0];
}

function addCourseRegDormSegment() {
  const dormIn = document.getElementById('course-reg-dorm-in')?.value || '';
  const duration = parseInt(document.getElementById('course-reg-dorm-duration')?.value, 10) || 0;
  const selection = getCourseRegSelectedDormTemplate();
  if (!dormIn || !duration || !selection) {
    showToast('희망 기숙사와 이용 기간을 먼저 선택해줘.', 'warning');
    return;
  }
  const existingSegments = getCourseRegDormSegments();
  const previousSegment = existingSegments[existingSegments.length - 1];
  if (previousSegment && dormIn < previousSegment.endDate) {
    showToast('다음 기숙사 구간은 이전 구간 퇴실일 이후에 시작해야 해.', 'warning');
    return;
  }
  const endDate = calculateCourseRegDormEndDate(dormIn, duration);
  const t = selection.template;
  if (!Array.isArray(APP.courseRegDormSegments)) APP.courseRegDormSegments = [];
  APP.courseRegDormSegments.push({
    id: Date.now(),
    templateIdx: selection.idx,
    accomType: t.accomType || '-',
    capacity: t.capacity || '-',
    condition: t.condition || '-',
    duration,
    startDate: dormIn,
    endDate,
    cost: getCourseRegPeriodFee(t.cost, t.tuitionPolicy, duration),
  });

  const dormInEl = document.getElementById('course-reg-dorm-in');
  const templateEl = document.getElementById('course-reg-dorm-template');
  const durationEl = document.getElementById('course-reg-dorm-duration');
  const dormOutEl = document.getElementById('course-reg-dorm-out');
  if (dormInEl) dormInEl.value = endDate;
  if (templateEl) templateEl.value = '';
  if (durationEl) durationEl.value = '';
  if (dormOutEl) dormOutEl.value = '';

  renderCourseRegDormSegments();
  renderCourseRegDormComparison();
  updateStudentCourseRegistrationPreview();
  showToast('기숙사 구간을 추가했어. 이어서 다음 구간도 선택할 수 있어.', 'success');
}

function removeCourseRegDormSegment(index) {
  if (!Array.isArray(APP.courseRegDormSegments)) return;
  APP.courseRegDormSegments.splice(index, 1);
  renderCourseRegDormSegments();
  updateStudentCourseRegistrationPreview();
}

function renderCourseRegDormSegments() {
  const target = document.getElementById('course-reg-dorm-segment-list');
  if (!target) return;
  const segments = getCourseRegDormSegments();
  if (!segments.length) {
    target.innerHTML = `<div style="padding:16px;text-align:center;color:#9CA3AF;font-size:11.5px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:10px">기숙사와 기간을 선택한 뒤 기숙사 구간을 추가해줘.</div>`;
    return;
  }
  target.innerHTML = segments.map((segment, index) => `
    <div style="display:grid;grid-template-columns:34px minmax(0,1fr) 90px 150px 88px;gap:10px;align-items:center;padding:10px 12px;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
      <div style="width:26px;height:26px;border-radius:50%;background:#ECFDF5;color:#047857;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900">${index + 1}</div>
      <div>
        <div style="font-size:12.5px;font-weight:800;color:#111827">${segment.accomType} · ${segment.capacity}인실 · ${segment.condition}</div>
      </div>
      <div style="font-size:11.5px;font-weight:800;color:#374151">${segment.duration}주</div>
      <div style="font-size:10.5px;color:#6B7280">${fmtDate(segment.startDate)} ~ ${fmtDate(segment.endDate)}</div>
      <div style="text-align:right">
        <div style="font-size:12.5px;font-weight:900;color:#111827">${formatCourseRegMoney(segment.cost)}</div>
        <button type="button" onclick="removeCourseRegDormSegment(${index})" style="margin-top:3px;border:0;background:none;color:#EF4444;font-size:10px;cursor:pointer">삭제</button>
      </div>
    </div>
  `).join('');
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
      <div style="display:grid;grid-template-columns:220px repeat(${getCourseRegPeriods().length},minmax(96px,1fr));background:#F8FAFC;border-bottom:1px solid #E5E7EB">
        <div style="padding:9px 12px;font-size:11px;font-weight:800;color:#4B5563">숙소 유형 · 인실 · 등급</div>
        ${getCourseRegPeriods().map(weeks => `<div style="padding:9px 6px;text-align:center;font-size:11px;font-weight:800;color:${hasDormIn && selected && weeks === selectedWeeks ? '#047857' : '#4B5563'};background:${hasDormIn && selected && weeks === selectedWeeks ? '#ECFDF5' : 'transparent'}">${weeks}주</div>`).join('')}
      </div>
      ${rows.map(({ template, index }, rowIndex) => `
        <div style="display:grid;grid-template-columns:220px repeat(${getCourseRegPeriods().length},minmax(96px,1fr));border-bottom:${rowIndex === rows.length - 1 ? '0' : '1px solid #EEF0F4'};background:#fff">
          <div style="padding:10px 12px;display:flex;flex-direction:column;justify-content:center;background:${selected?.idx === index ? '#F0FDFA' : '#fff'}">
            <b style="font-size:12px;color:#111827">${template.accomType || '-'}</b>
            <span style="font-size:10px;color:#6B7280;margin-top:2px">${template.capacity || '-'}인실 · ${template.condition || '-'}</span>
          </div>
          ${getCourseRegPeriods().map(weeks => {
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
  const dormSegments = getCourseRegDormSegments();
  const extras = getSelectedCourseRegExtras();

  renderCourseRegCourseComparison();
  renderCourseRegRecommendedLevels(course);
  renderCourseRegDormComparison();
  renderCourseRegDormSegments();
  renderCourseRegSegments();

  const tuitionAmount = segments.reduce((sum, segment) => sum + Number(segment.tuitionAmount || 0), 0);
  const dormAmount = dormEnabled ? dormSegments.reduce((sum, segment) => sum + Number(segment.cost || 0), 0) : 0;
  const extrasTotal = extras.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const total = tuitionAmount + dormAmount + extrasTotal;

  const preview = document.getElementById('course-reg-fee-preview');
  if (!preview) return;

  const registrationItems = extras.filter(item => item.type === 'required');
  const optionalExtras = extras.filter(item => item.type !== 'required');
  const registrationTotal = registrationItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  preview.innerHTML = `
    ${registrationItems.length ? `
    <div style="padding:12px;border:1px solid #C7D2FE;background:#EEF2FF;border-radius:10px">
      <div style="font-size:11px;color:#3730A3;font-weight:700;margin-bottom:7px">등록금</div>
      ${registrationItems.map(item => `
        <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:800;color:#111827">
          <span>${item.name}</span><span>${formatCourseRegMoney(item.amount)}</span>
        </div>
      `).join('')}
    </div>` : ''}
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
      <div style="font-size:11px;color:#6B7280;font-weight:700;margin-bottom:7px">희망 기숙사</div>
      ${!dormEnabled ? `<div style="font-size:12px;color:#9CA3AF">미사용</div>` : dormSegments.length ? dormSegments.map((segment, index) => `
        <div style="display:flex;justify-content:space-between;gap:10px;margin-top:${index ? '8px' : '0'};padding:${index ? '8px 0 0' : '0'};border-top:${index ? '1px solid #EEF0F4' : '0'}">
          <div style="min-width:0">
            <div style="font-size:11.5px;color:#111827;font-weight:800">${index + 1}. ${segment.accomType} · ${segment.capacity}인실 · ${segment.condition} / ${segment.duration}주</div>
            <div style="font-size:10px;color:#6B7280;margin-top:3px">${fmtDate(segment.startDate)} ~ ${fmtDate(segment.endDate)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:12.5px;font-weight:900;color:#111827">${formatCourseRegMoney(segment.cost)}</div>
            <button type="button" onclick="removeCourseRegDormSegment(${index})" style="margin-top:3px;border:0;background:none;color:#EF4444;font-size:10px;cursor:pointer">삭제</button>
          </div>
        </div>
      `).join('') : `<div style="font-size:12px;color:#9CA3AF">추가된 기숙사 구간 없음</div>`}
      <div style="display:flex;justify-content:space-between;border-top:1px dashed #D1D5DB;margin-top:8px;padding-top:8px;font-size:12px"><b>기숙사 소계</b><b>${formatCourseRegMoney(dormAmount)}</b></div>
    </div>
    <div style="padding:12px;border:1px solid #E5E7EB;background:#fff;border-radius:10px">
      <div style="font-size:11px;color:#6B7280;font-weight:700;margin-bottom:8px">기타 항목</div>
      ${optionalExtras.length ? optionalExtras.map(item => `
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:5px">
          <span style="color:#374151">${item.name}</span>
          <b>${formatCourseRegMoney(item.amount)}</b>
        </div>
      `).join('') : `<div style="font-size:12px;color:#9CA3AF">선택된 기타 항목 없음</div>`}
      <div style="display:flex;justify-content:space-between;border-top:1px dashed #D1D5DB;margin-top:8px;padding-top:8px;font-size:12px">
        <b>소계</b><b>${formatCourseRegMoney(extrasTotal - registrationTotal)}</b>
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
    label.textContent = fileName || '파일 선택 안 함';
    label.style.color = fileName ? '#047857' : '#9CA3AF';
  }
}

function openStudentCourseRegistration(studentId) {
  const student = MOCK_STUDENTS.find(s => s.id === studentId);
  if (!student) return;
  APP.currentCourseRegistrationStudent = student;
  APP.courseRegSegments = [];
  APP.courseRegDormSegments = [];
  APP.courseRegUploadedFiles = { ...(student.requiredFiles || {}) };

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

  // 이미 등록된 항공 일정(입출국·비자 관리와 같은 소스)이 있으면 그 값을 그대로 불러온다.
  ensureStudentStayData(student);
  const firstEntry = student.flightSchedules.find(item => item.kind === 'first_entry' && item.status !== 'cancelled') || {};
  const finalExit = student.flightSchedules.find(item => item.kind === 'final_exit' && item.status !== 'cancelled') || {};

  const arrivalFromEl = document.getElementById('course-reg-arrival-from-country');
  if (arrivalFromEl) arrivalFromEl.innerHTML = stayCountryOptionsHtml(firstEntry.fromCountry || student.nationality || '');
  const arrivalToEl = document.getElementById('course-reg-arrival-to-country');
  if (arrivalToEl) arrivalToEl.innerHTML = stayCountryOptionsHtml(firstEntry.toCountry || '필리핀');
  const departureFromEl = document.getElementById('course-reg-departure-from-country');
  if (departureFromEl) departureFromEl.innerHTML = stayCountryOptionsHtml(finalExit.fromCountry || '필리핀');
  const departureToEl = document.getElementById('course-reg-departure-to-country');
  if (departureToEl) departureToEl.innerHTML = stayCountryOptionsHtml(finalExit.toCountry || student.nationality || '');

  const optionalValues = {
    'course-reg-flight-num': firstEntry.flightNo || '',
    'course-reg-arrival-date': firstEntry.arriveDate || '',
    'course-reg-flight-time': firstEntry.arriveTime || '',
    'course-reg-flight-out-num': finalExit.flightNo || '',
    'course-reg-departure-date': finalExit.departDate || '',
    'course-reg-flight-out-time': finalExit.departTime || '',
  };
  Object.entries(optionalValues).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  });
  APP.courseRegUploadedFiles.ticketArrival = firstEntry.ticketFile || '';
  APP.courseRegUploadedFiles.ticketDeparture = finalExit.ticketFile || '';
  ['ticketArrival','ticketDeparture'].forEach(type => {
    const label = document.getElementById(`course-reg-file-${type}`);
    const fileName = APP.courseRegUploadedFiles[type];
    if (label) {
      label.textContent = fileName || '파일 선택 안 함';
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
  // 미수강 학생이 처음 수강 등록을 마치면 입학 대기로 전환한다(이미 재학·연장 등으로 진행된 학생은 유지).
  const status = (!student.status || student.status === 'no_course') ? 'waiting' : student.status;
  const payment = 'unpaid';
  const remittanceRoute = document.getElementById('course-reg-remittance-route')?.value || 'agency';
  const memo = document.getElementById('course-reg-memo')?.value.trim() || '';
  const dormEnabled = !document.getElementById('course-reg-dorm-enabled')?.checked;
  const dormSegments = getCourseRegDormSegments().map((segment, index) => ({ ...segment, order: index + 1 }));
  const firstDorm = dormSegments[0] || null;
  const lastDorm = dormSegments[dormSegments.length - 1] || null;
  const extraItems = getSelectedCourseRegExtras();
  const getOptionalValue = id => document.getElementById(id)?.value.trim() || '';

  if (!segments.length || !course || !startDate) {
    showToast('등록할 수강 구간을 1개 이상 추가해줘.', 'warning');
    return;
  }

  if (dormEnabled && !dormSegments.length) {
    showToast('희망 기숙사 구간을 1개 이상 추가해줘.', 'warning');
    return;
  }

  const tuitionAmount = segments.reduce((sum, segment) => sum + Number(segment.tuitionAmount || 0), 0);
  const dormAmount = dormEnabled ? dormSegments.reduce((sum, segment) => sum + Number(segment.cost || 0), 0) : 0;
  const dormDuration = dormEnabled ? dormSegments.reduce((sum, segment) => sum + Number(segment.duration || 0), 0) : 0;
  const extrasTotal = extraItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const registrationAmount = extraItems
    .filter(item => /등록금|Registration/i.test(item.name || ''))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const otherExtrasTotal = Math.max(0, extrasTotal - registrationAmount);
  const totalGross = tuitionAmount + dormAmount + extrasTotal;
  const dormLabel = dormEnabled && dormSegments.length
    ? dormSegments.map(segment => `${segment.accomType} · ${segment.capacity}인실 · ${segment.condition}`).join(' → ')
    : dormEnabled ? '미선택' : '미사용';

  if (!student.enrollments) student.enrollments = [];
  student.enrollments.unshift({
    id: Date.now(),
    course,
    level,
    recommendedLevels,
    // 정산은 이 차수를 자기 단위로 쓴다 — 등록금과 납부 상태를 여기에 담아,
    // 다음 차수를 등록해도 이전 차수의 청구·완납이 지워지지 않게 한다.
    registrationAmount,
    billingItemStatuses: {},
    commissionItemStatuses: {},
    segments,
    startDate,
    endDate,
    duration,
    tuitionAmount,
    dorm: dormLabel,
    dormEnabled,
    dormSegments,
    dormDuration: dormEnabled ? dormDuration : 0,
    dormIn: dormEnabled && firstDorm ? firstDorm.startDate : '',
    dormOut: dormEnabled && lastDorm ? lastDorm.endDate : '',
    dormAccomType: dormEnabled && firstDorm ? firstDorm.accomType || null : null,
    dormType: dormEnabled && firstDorm ? firstDorm.capacity || null : null,
    dormGrade: dormEnabled && firstDorm ? firstDorm.condition || null : null,
    dormAmount,
    extraItems,
    extrasTotal,
    totalGross,
    status,
    paymentStatus: payment,
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
  student.status = status;
  student.courseSegments = segments;
  student.startDate = startDate;
  student.duration = duration;
  student.endDate = endDate;
  student.remittanceStatus = 'unpaid';
  student.remittanceRoute = remittanceRoute;
  student.dorm = dormLabel;
  student.dormSegments = dormSegments;
  if (dormEnabled && firstDorm) {
    student.dormAccomType = firstDorm.accomType || null;
    student.dormType = firstDorm.capacity || null;
    student.dormGrade = firstDorm.condition || null;
    student.dormIn = firstDorm.startDate;
    student.dormOut = lastDorm.endDate;
  } else {
    student.dormAccomType = null;
    student.dormType = null;
    student.dormGrade = null;
    student.dormIn = '';
    student.dormOut = '';
  }
  student.totalGross = totalGross;
  student.requiredFiles = { ...(student.requiredFiles || {}), ...(APP.courseRegUploadedFiles || {}) };
  // 여기서 입력한 입/출국 정보는 학생 상세 → 수강 현황 → 입출국·비자 관리가 읽는
  // flightSchedules 목록에도 함께 반영해야 그 화면에서 바로 보인다(§5/§6과 동일 소스).
  syncCourseRegFlightSchedules(
    student,
    {
      flightNo: getOptionalValue('course-reg-flight-num'), date: getOptionalValue('course-reg-arrival-date'), time: getOptionalValue('course-reg-flight-time'),
      fromCountry: getOptionalValue('course-reg-arrival-from-country'), toCountry: getOptionalValue('course-reg-arrival-to-country')
    },
    {
      flightNo: getOptionalValue('course-reg-flight-out-num'), date: getOptionalValue('course-reg-departure-date'), time: getOptionalValue('course-reg-flight-out-time'),
      fromCountry: getOptionalValue('course-reg-departure-from-country'), toCountry: getOptionalValue('course-reg-departure-to-country')
    },
    APP.courseRegUploadedFiles.ticketArrival,
    APP.courseRegUploadedFiles.ticketDeparture
  );
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
  // 납부 상태는 학생이 아니라 차수가 갖는다. 여기서 학생 단위 값을 다시 쓰면
  // 이미 완납된 이전 차수까지 미납으로 되돌아간다 — 받은 돈이 화면에서 사라지던 원인이다.
  const savedEnrollment = student.enrollments[0];
  if (payment === 'paid') {
    getEnrollmentBillingRows(student, { ...savedEnrollment, sessionNumber: student.enrollments.length })
      .forEach(row => { savedEnrollment.billingItemStatuses[row.key] = 'paid'; });
  }

  const agencyRow = typeof MOCK_AGENCY_STUDENTS !== 'undefined'
    ? MOCK_AGENCY_STUDENTS.find(a => a.name.includes(student.name) || a.name.includes(student.nick))
    : null;
  const agencyPayload = {
    name: `${student.name} (${student.nick})`,
    course,
    dorm: dormEnabled && firstDorm ? `${firstDorm.capacity || '-'}인실` : '미사용',
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

  const newCourse = prompt("변경을 요청할 신규 과정을 입력하세요:\n(Regular, Regular +, Intensive, Power Speaking 6, Power Speaking 8, 6Hrs Regular, 6Hrs Intensive, 6Hrs Power Speaking, IELTS Intensive, Special English(TOEIC, Business), Junior ESL, Junior Camp, 가디언 코스 중 택 1)");
  if (!newCourse) return;

  const validCourses = ["Regular", "Regular +", "Intensive", "Power Speaking 6", "Power Speaking 8", "6Hrs Regular", "6Hrs Intensive", "6Hrs Power Speaking", "IELTS Intensive", "Special English(TOEIC, Business)", "Junior ESL", "Junior Camp", "가디언 코스"];
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

  if (APP.isRegisterPopup) {
    finishStudentRegisterPopup(newStdObj, 'agency');
    return;
  }

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
let currentAdetailTopTab = 'basic'; // 기본 정보 / 수강 현황 / 상담 노트 / 학생 요청 최상위 탭 추적
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
  currentAdetailTopTab = tab;
  const basicTab = document.getElementById('adetail-page-tab-basic');
  const enrollmentTab = document.getElementById('adetail-page-tab-enrollment');
  const consultationTab = document.getElementById('adetail-page-tab-consultation');
  const requestTab = document.getElementById('adetail-page-tab-request');
  const saveBtn = document.getElementById('adetail-page-save-btn');
  if (basicTab) basicTab.classList.toggle('active', tab === 'basic');
  if (enrollmentTab) enrollmentTab.classList.toggle('active', tab === 'enrollment');
  if (consultationTab) consultationTab.classList.toggle('active', tab === 'consultation');
  if (requestTab) requestTab.classList.toggle('active', tab === 'request');
  if (saveBtn) saveBtn.style.display = tab === 'basic' ? '' : 'none';

  if (tab === 'basic') {
    switchAdetailTab('basic', 'adetail-page-tab-content', currentAdetailStudentId);
  } else if (tab === 'enrollment') {
    renderAgencyStudentEnrollmentHub();
  } else if (tab === 'consultation') {
    renderAgencyStudentConsultationPage();
  } else if (tab === 'request') {
    renderAgencyStudentRequestPage();
  }
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

// 상담 현황을 '수강 현황' 하위 탭에서 분리해 최상위 탭으로 독립시킨 뷰
function renderAgencyStudentConsultationPage() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  const container = document.getElementById('adetail-page-tab-content');
  if (!s || !container) return;
  renderStudentConsultationTab(s, container);
}

// '학생 요청' 최상위 탭 — 관리자 리스트에서 넘어오거나 직접 클릭했을 때 해당 학생의 요청만 필터링해 보여준다.
function renderAgencyStudentRequestPage() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  const container = document.getElementById('adetail-page-tab-content');
  if (!s || !container || typeof renderStudentRequestTab !== 'function') return;
  renderStudentRequestTab(s, container);
}

// 관리자 리스트에서 승인/반려한 직후, 그 학생의 상세 페이지가 이미 열려있다면 '학생 요청' 탭을 다시 그린다.
function refreshStudentRequestTabIfOpen(studentId) {
  if (currentAdetailStudentId === studentId && currentAdetailTopTab === 'request') {
    renderAgencyStudentRequestPage();
  }
}

function renderAgencyStudentEnrollmentHub() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  const container = document.getElementById('adetail-page-tab-content');
  if (!s || !container) return;

  const enrollments = getStudentEnrollmentSnapshots(s);
  container.innerHTML = `
    <div class="enrollment-hub-layout" style="display:grid;grid-template-columns:280px 1fr;gap:18px">
      <div style="border:1px solid #E5E7EB;border-radius:12px;background:#F8FAFC;padding:14px">
        <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:10px">수강 목록</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${!enrollments.length ? `<div style="text-align:center;padding:20px 10px;color:#9CA3AF;font-size:11.5px">등록된 수강 정보가 없습니다.</div>` : enrollments.map((e, idx) => {
            const selected = String(e.id) === String(currentAdetailEnrollmentId);
            // 아직 확정되지 않은 '입학 대기' 상태의 등록만 삭제를 허용한다 (Active 이후 등록은 변경 요청 흐름으로 처리).
            const deletable = e.status === 'waiting';
            return `
            <div onclick="selectAgencyStudentEnrollment('${e.id}')" style="width:100%;padding:12px;border-radius:10px;border:1px solid ${selected ? '#C7D2FE' : '#E5E7EB'};background:${selected ? '#EEF2FF' : '#fff'};text-align:left;cursor:pointer;font-family:inherit">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:9.5px;font-weight:800;color:#5E5CE6;background:#EEF2FF;border-radius:999px;padding:1px 7px;white-space:nowrap">${e.sessionNumber}차 수강</span>
                <div style="font-size:12.5px;font-weight:800;color:#111827;flex:1">${e.course}</div>
                <div style="font-size:12.5px;font-weight:900;color:#111827;white-space:nowrap">${formatCourseRegMoney(getEnrollmentAmounts(s, e).total)}</div>
                ${deletable ? `<button type="button" title="이 등록 삭제" onclick="event.stopPropagation(); deleteAgencyStudentEnrollment('${e.id}')" style="border:none;background:none;padding:2px;cursor:pointer;color:#9CA3AF;line-height:0"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button>` : ''}
              </div>
              <div style="font-size:10.5px;color:#6B7280;margin-top:4px">${fmtDate(e.startDate)} ~ ${fmtDate(e.endDate)} · ${e.duration}주${e.segments && e.segments.length > 1 ? ` · ${e.segments.length}개 구간` : ''}</div>
              <div style="display:flex;gap:5px;margin-top:8px;flex-wrap:wrap">
                <span class="tsa-badge ${e.paymentStatus === 'paid' ? 'tsa-badge-success' : 'tsa-badge-warning'}">${e.paymentStatus === 'paid' ? '완납' : '미납'}</span>
                <span class="tsa-badge" style="background:#EEF2FF;color:#4338CA">${getRemittanceRouteLabel(e.remittanceRoute || s.remittanceRoute)}</span>
                <span class="tsa-badge ${e.status === 'current' ? 'tsa-badge-success' : e.status === 'completed' ? 'tsa-badge-gray' : 'tsa-badge-warning'}">${getEnrollmentStatusLabel(e.status)}</span>
                ${selected ? '<span class="tsa-badge tsa-badge-primary">현재 선택</span>' : ''}
              </div>
            </div>`;
          }).join('')}
        </div>
        <div style="margin-top:12px;font-size:11px;color:#6B7280;line-height:1.5">
          코스 등록은 학생 리스트의 <b>코스 등록</b> 버튼에서 진행합니다. 등록 화면에서 <b>선택 구간 추가</b>로 넣은 코스는 같은 차수로 묶이고, <b>코스 등록</b> 버튼을 다시 눌러 저장할 때마다 새로운 차수가 생성됩니다.
        </div>
      </div>

      <div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="class" onclick="switchAgencyEnrollmentHubTab('class')">수강정보</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="dorm" onclick="switchAgencyEnrollmentHubTab('dorm')">기숙사</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="flightdocs" onclick="switchAgencyEnrollmentHubTab('flightdocs')">입출국·비자 관리</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="settle" onclick="switchAgencyEnrollmentHubTab('settle')">정산</button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="admdocs" onclick="switchAgencyEnrollmentHubTab('admdocs')">입학서류관리</button>
          ${currentAdetailPortal === 'admin' ? '<button class="tsa-btn tsa-btn-outline tsa-btn-sm enrollment-hub-tab" data-hub-tab="schedule" onclick="switchAgencyEnrollmentHubTab(\'schedule\')">스케줄</button>' : ''}
        </div>
        <div id="adetail-page-enrollment-content" style="border:1px solid #E5E7EB;border-radius:12px;padding:14px;background:#fff;min-height:420px"></div>
      </div>
    </div>
  `;

  const availableTabs = ['class', 'schedule', 'flightdocs', 'dorm', 'settle', 'admdocs'];
  switchAgencyEnrollmentHubTab(availableTabs.includes(currentAdetailTab) ? currentAdetailTab : 'class');
}

// 수강 구간과 등록금·기타 항목을 합친 청구 금액. 수강정보 화면과 수강 목록이 같은 값을 쓴다.
// 기숙사비와 에이전시 커미션은 여기 들어가지 않는다 — 각각 기숙사 탭과 에이전시 관리에서 다룬다.
const ENROLL_REGISTRATION_PATTERN = /등록금|입학금|registration/i;

function getEnrollmentCourseSegments(view) {
  return Array.isArray(view.segments) && view.segments.length
    ? view.segments
    : [{
        course: view.course || '코스 미등록',
        duration: Number(view.duration || 0),
        startDate: view.startDate || '',
        endDate: view.endDate || '',
        recommendedLevels: getFallbackRecommendedLevels(view.course, view.level),
        tuitionAmount: Number(view.tuitionAmount || 0),
      }];
}

function getEnrollmentFeeItems(student) {
  return (Array.isArray(student?.fees) ? student.fees : []).map(fee => ({
    name: fee.item || '-',
    amount: Number(fee.amount || 0),
    kind: ENROLL_REGISTRATION_PATTERN.test(fee.item || '') ? 'registration' : 'extra',
  }));
}

function getEnrollmentAmounts(student, view) {
  const rawSegments = getEnrollmentCourseSegments(view);
  const fees = getEnrollmentFeeItems(student);
  const stored = rawSegments.reduce((sum, segment) => sum + Number(segment.tuitionAmount || 0), 0);
  // 구간에 금액이 저장돼 있지 않은 등록도 있다. 그럴 때는 요금표에서 계산한 수강료를 쓴다.
  const fallback = stored ? 0 : Number((typeof calculatePrices === 'function' ? calculatePrices(student).tuition : 0) || 0);
  const segments = stored || !fallback
    ? rawSegments
    : rawSegments.map((segment, index) => ({
        ...segment,
        tuitionAmount: index === 0 ? fallback : 0,
      }));
  const tuition = stored || fallback;
  const feeTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
  return { segments, fees, tuition, feeTotal, total: tuition + feeTotal };
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
  // enrollments[]는 학생 리스트의 "코스 등록" 버튼을 누를 때마다(unshift로) 새로 생기는 별도의 수강 등록
  // 세션이다 — 한 번의 등록 안에서 "선택 구간 추가"로 넣은 코스들만 같은 세션의 segments로 묶인다.
  // 오래된 순으로 1차·2차·3차… 번호를 매겨 직원이 "등록 버튼 = 새 세션"임을 화면에서 바로 알 수 있게 한다.
  const saved = Array.isArray(s.enrollments) ? s.enrollments.map((enrollment, idx, arr) => {
    const dormParts = String(enrollment.dorm || '').split(' · ');
    return {
      ...enrollment,
      duration: getStudentPopupWeeks(enrollment),
      segments: Array.isArray(enrollment.segments) ? enrollment.segments : [],
      dormAccomType: enrollment.dormAccomType || dormParts[0] || '',
      dormType: enrollment.dormType || parseInt(dormParts[1], 10) || null,
      dormGrade: enrollment.dormGrade || dormParts[2] || '',
      sessionNumber: arr.length - idx,
    };
  }) : [];
  current.sessionNumber = saved.length || 1;
  const history = saved.filter(e => !(e.course === current.course && e.startDate === current.startDate));
  // 등록된 코스가 하나도 없는(no_course) 학생은 대표 카드를 만들지 않고 목록을 완전히 비운다.
  if (s.status === 'no_course') return history.slice(0, 4);
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

// '입학 대기' 상태의 등록만 삭제 가능하다 — Active 이후 등록은 인보이스·기숙사 배정 등과 얽혀 있어
// 변경 요청(Change Request) 흐름으로만 수정하도록 잠근다는 기존 Lock Policy와 일관되게 처리한다.
function deleteAgencyStudentEnrollment(enrollmentId) {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;
  const target = getStudentEnrollmentSnapshots(s).find(e => String(e.id) === String(enrollmentId));
  if (!target || target.status !== 'waiting') return;

  if (!confirm(`"${target.course}" (${target.sessionNumber}차 수강) 등록을 삭제할까요? 되돌릴 수 없습니다.`)) return;

  if (Array.isArray(s.enrollments)) {
    const idx = enrollmentId === 'current'
      ? s.enrollments.findIndex(e => e.course === s.course && e.startDate === s.startDate)
      : s.enrollments.findIndex(e => String(e.id) === String(enrollmentId));
    if (idx >= 0) s.enrollments.splice(idx, 1);
  }

  if (enrollmentId === 'current') {
    const next = Array.isArray(s.enrollments) && s.enrollments.length ? s.enrollments[0] : null;
    if (next) applyEnrollmentAsCurrentStudentState(s, next);
    else resetStudentToNoCourseState(s);
  }

  currentAdetailEnrollmentId = 'current';
  showToast('수강 등록이 삭제되었습니다.', 'success');
  renderAgencyStudentEnrollmentHub();
}

// 삭제된 최신 등록 대신, 남아있던 이전 등록 이력을 학생의 현재 등록 정보로 되살린다.
function applyEnrollmentAsCurrentStudentState(s, enrollment) {
  const extraItems = Array.isArray(enrollment.extraItems) ? enrollment.extraItems : [];
  const registrationAmount = extraItems
    .filter(item => /등록금|Registration/i.test(item.name || ''))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const otherExtrasTotal = Math.max(0, Number(enrollment.extrasTotal || 0) - registrationAmount);

  s.course = enrollment.course;
  s.level = enrollment.level || '';
  s.courseSegments = Array.isArray(enrollment.segments) ? enrollment.segments : [];
  s.startDate = enrollment.startDate || '';
  s.endDate = enrollment.endDate || '';
  s.duration = Number(enrollment.duration || 0);
  s.status = enrollment.status || 'waiting';
  s.remittanceStatus = enrollment.paymentStatus || 'unpaid';
  s.remittanceRoute = enrollment.remittanceRoute || s.remittanceRoute;
  s.dorm = enrollment.dorm || '미사용';
  s.dormSegments = Array.isArray(enrollment.dormSegments) ? enrollment.dormSegments : [];
  s.dormAccomType = enrollment.dormAccomType || null;
  s.dormType = enrollment.dormType || null;
  s.dormGrade = enrollment.dormGrade || null;
  s.dormIn = enrollment.dormIn || '';
  s.dormOut = enrollment.dormOut || '';
  s.totalGross = Number(enrollment.totalGross || 0);
  s.extraItems = extraItems;
  s.courseRegistrationFees = {
    registration: registrationAmount,
    tuition: Number(enrollment.tuitionAmount || 0),
    dorm: Number(enrollment.dormAmount || 0),
    extras: otherExtrasTotal,
    total: Number(enrollment.totalGross || 0),
    extraItems,
  };
  s.billingItemStatuses = { registration: 'unpaid', education: 'unpaid', dorm: 'unpaid', local: 'unpaid' };
}

// 남은 등록 이력이 없을 때 학생을 '미수강' 상태로 초기화한다.
function resetStudentToNoCourseState(s) {
  s.course = '코스 미등록';
  s.level = '';
  s.courseSegments = [];
  s.startDate = '';
  s.endDate = '';
  s.duration = 0;
  s.status = 'no_course';
  s.remittanceStatus = 'unpaid';
  s.dorm = '미사용';
  s.dormSegments = [];
  s.dormAccomType = null;
  s.dormType = null;
  s.dormGrade = null;
  s.dormIn = '';
  s.dormOut = '';
  s.totalGross = 0;
  s.extraItems = [];
  s.courseRegistrationFees = { registration: 0, tuition: 0, dorm: 0, extras: 0, total: 0, extraItems: [] };
  s.billingItemStatuses = { registration: 'unpaid', education: 'unpaid', dorm: 'unpaid', local: 'unpaid' };
}

// 과정 자체에 설정된 추천 레벨(복수 가능)을 우선 사용하고, 과정을 못 찾을 때만 학생 개인의 단일 level 값으로 폴백
function getFallbackRecommendedLevels(courseName, fallbackLevel) {
  const course = (typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES : []).find(c => c.name === courseName);
  const courseLevels = course && typeof getCourseRegRecommendedLevels === 'function'
    ? getCourseRegRecommendedLevels(course).map(level => level.name)
    : [];
  if (courseLevels.length) return courseLevels;
  return fallbackLevel && fallbackLevel !== '-' ? [fallbackLevel] : [];
}

// 현재 선택된 수강 구간(enrollment)에 대응하는, 실제로 수정 가능한 원본 segments 배열을 찾는다.
// currentAdetailEnrollmentId === 'current'면 학생의 진행중 등록(courseSegments), 아니면 과거 enrollments 항목의 segments.
function getEditableSegmentsArray(baseStudent) {
  if (currentAdetailEnrollmentId === 'current' || !Array.isArray(baseStudent.enrollments)) {
    if (!Array.isArray(baseStudent.courseSegments) || !baseStudent.courseSegments.length) {
      baseStudent.courseSegments = [{
        course: baseStudent.course || '코스 미등록',
        duration: Number(baseStudent.duration || 0),
        startDate: baseStudent.startDate || '',
        endDate: baseStudent.endDate || '',
        recommendedLevels: getFallbackRecommendedLevels(baseStudent.course, baseStudent.level),
        tuitionAmount: Number(baseStudent.tuitionAmount || 0),
      }];
    }
    return baseStudent.courseSegments;
  }
  const enrollment = baseStudent.enrollments.find(e => String(e.id) === String(currentAdetailEnrollmentId));
  if (!enrollment) {
    if (!Array.isArray(baseStudent.courseSegments) || !baseStudent.courseSegments.length) {
      baseStudent.courseSegments = [{
        course: baseStudent.course || '코스 미등록',
        duration: Number(baseStudent.duration || 0),
        startDate: baseStudent.startDate || '',
        endDate: baseStudent.endDate || '',
        recommendedLevels: getFallbackRecommendedLevels(baseStudent.course, baseStudent.level),
        tuitionAmount: Number(baseStudent.tuitionAmount || 0),
      }];
    }
    return baseStudent.courseSegments;
  }
  if (!Array.isArray(enrollment.segments) || !enrollment.segments.length) {
    enrollment.segments = [{
      course: enrollment.course || '코스 미등록',
      duration: Number(enrollment.duration || 0),
      startDate: enrollment.startDate || '',
      endDate: enrollment.endDate || '',
      recommendedLevels: [],
      tuitionAmount: 0,
    }];
  }
  return enrollment.segments;
}

// 현재 진행중 등록(courseSegments)을 수정/삭제한 뒤, 학생 최상위 필드(course/startDate/endDate/duration)를 세그먼트 합계로 재동기화
function syncStudentTopLevelFromSegments(baseStudent) {
  if (currentAdetailEnrollmentId !== 'current') return;
  const segments = baseStudent.courseSegments;
  if (!Array.isArray(segments) || !segments.length) return;
  baseStudent.course = segments.map(seg => seg.course).join(' → ');
  baseStudent.startDate = segments[0].startDate;
  baseStudent.endDate = segments[segments.length - 1].endDate;
  baseStudent.duration = segments.reduce((sum, seg) => sum + Number(seg.duration || 0), 0);
}

function refreshCourseSegmentTab() {
  if (document.getElementById('adetail-page-enrollment-content') && typeof switchAgencyEnrollmentHubTab === 'function') {
    switchAgencyEnrollmentHubTab('class');
  } else if (typeof switchAdetailTab === 'function') {
    switchAdetailTab('class');
  }
}

function refreshDormRequestTab() {
  if (document.getElementById('adetail-page-enrollment-content') && typeof switchAgencyEnrollmentHubTab === 'function') {
    switchAgencyEnrollmentHubTab('dorm');
  } else if (typeof switchAdetailTab === 'function') {
    switchAdetailTab('dorm');
  }
}

function openCourseSegmentEditModal(studentId, index) {
  const baseStudent = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!baseStudent) return;
  const segments = getEditableSegmentsArray(baseStudent);
  const segment = segments[index];
  if (!segment) return;

  // 수정은 같은 과정의 기간만 바꾸는 용도라, 비교표에는 지금 구간의 과정만 보여준다(다른 과정으로
  // 바꾸고 싶으면 삭제 후 "구간 추가"로 새로 넣는다).
  APP._segmentEditTarget = { studentId, index, isNew: false, lockedCourse: segment.course || '' };
  const titleEl = document.getElementById('course-segment-edit-title');
  if (titleEl) titleEl.textContent = '수강 구간 수정';

  const courseEl = document.getElementById('seg-edit-course');
  if (courseEl) courseEl.value = segment.course || '';
  const startEl = document.getElementById('seg-edit-start');
  if (startEl) startEl.value = segment.startDate || '';
  const durationEl = document.getElementById('seg-edit-duration');
  if (durationEl) durationEl.value = String(segment.duration || 4);

  renderSegmentEditCourseComparison();
  renderSegmentEditRecommendedLevels();
  previewCourseSegmentEdit();
  document.getElementById('course-segment-edit-modal').style.display = 'flex';
  document.getElementById('course-segment-edit-backdrop').style.display = 'block';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

// 이미 저장된 등록(같은 차수) 안에서 체류를 이어가며 다른 과정으로 바꾸거나, 같은 과정을 다시 이어서
// 듣는 경우를 위한 "구간 추가". 마지막 구간 종료일 다음날을 기본 시작일로 채워, 공백 없이 이어지는 게
// 기본값이 되게 하되(같은 체류 안에서 코스만 바뀌는 것이므로) 직원이 원하면 날짜를 바꿀 수 있다.
function openCourseSegmentAddModal(studentId) {
  const baseStudent = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!baseStudent) return;
  const segments = getEditableSegmentsArray(baseStudent);
  const lastSegment = segments[segments.length - 1];

  // 이미 이 등록(차수)에 들어있는 과정은 비교표에서 비활성화한다 — 같은 과정을 다시 쓰고 싶으면
  // 새 구간을 추가하는 게 아니라 그 구간을 "수정"해서 기간을 늘리는 게 맞기 때문.
  const usedCourses = segments.map(seg => seg.course).filter(Boolean);
  APP._segmentEditTarget = { studentId, index: segments.length, isNew: true, usedCourses };
  const titleEl = document.getElementById('course-segment-edit-title');
  if (titleEl) titleEl.textContent = '수강 구간 추가';

  let defaultStart = '';
  if (lastSegment && lastSegment.endDate) {
    const d = new Date(lastSegment.endDate);
    d.setDate(d.getDate() + 1);
    defaultStart = d.toISOString().split('T')[0];
  }

  const courseEl = document.getElementById('seg-edit-course');
  if (courseEl) courseEl.value = '';
  const startEl = document.getElementById('seg-edit-start');
  if (startEl) startEl.value = defaultStart;
  const durationEl = document.getElementById('seg-edit-duration');
  if (durationEl) durationEl.value = '';

  renderSegmentEditCourseComparison();
  renderSegmentEditRecommendedLevels();
  previewCourseSegmentEdit();
  document.getElementById('course-segment-edit-modal').style.display = 'flex';
  document.getElementById('course-segment-edit-backdrop').style.display = 'block';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function closeCourseSegmentEditModal() {
  document.getElementById('course-segment-edit-modal').style.display = 'none';
  document.getElementById('course-segment-edit-backdrop').style.display = 'none';
  APP._segmentEditTarget = null;
}

// 수강 등록 팝업의 "과정별 수강료 비교표"와 동일한 방식(getCourseRegActiveCourses/getCourseRegPeriodFee 재사용) —
// 다만 등록 모달의 selectCourseRegOption과는 독립적으로, 이 수정 모달의 hidden 필드만 갱신한다.
function renderSegmentEditCourseComparison() {
  const target = document.getElementById('seg-edit-compare-table');
  if (!target) return;
  const summary = document.getElementById('seg-edit-selection-summary');
  let rows = typeof getCourseRegActiveCourses === 'function' ? getCourseRegActiveCourses() : [];
  // 수정 모드(같은 구간의 기간만 바꾸는 것)는 지금 구간의 과정 한 줄만 보여준다. 다른 과정으로 바꾸려면
  // 삭제 후 "구간 추가"로 새로 넣는다 — 그 락 대상 과정이 목록에서 사라진 경우(비활성화 등)에는 전체를 보여준다.
  const lockedCourse = APP._segmentEditTarget && !APP._segmentEditTarget.isNew ? APP._segmentEditTarget.lockedCourse : '';
  if (lockedCourse) {
    const lockedRows = rows.filter(row => row.course.name === lockedCourse);
    if (lockedRows.length) rows = lockedRows;
  }
  // 구간 추가 모드에서는 이미 이 등록에 쓰인 과정을 비활성화한다(같은 과정을 더 듣고 싶으면 그 구간을 "수정"해서 기간을 늘리면 된다).
  const usedCourses = APP._segmentEditTarget && APP._segmentEditTarget.isNew ? (APP._segmentEditTarget.usedCourses || []) : [];
  const selectedCourseName = document.getElementById('seg-edit-course')?.value || '';
  const selectedWeeks = parseInt(document.getElementById('seg-edit-duration')?.value, 10) || 0;
  const hasStartDate = Boolean(document.getElementById('seg-edit-start')?.value);

  if (!rows.length) {
    target.innerHTML = `<div style="padding:18px;text-align:center;color:#9CA3AF;font-size:12px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:10px">현재 등록 가능한 과정이 없습니다.</div>`;
    return;
  }

  if (summary) {
    summary.textContent = !hasStartDate ? '(시작일 먼저 선택)' : selectedCourseName ? `현재 선택: ${selectedCourseName} · ${selectedWeeks}주` : '';
  }

  target.innerHTML = `
    <div style="min-width:680px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden">
      <div style="display:grid;grid-template-columns:150px repeat(${getCourseRegPeriods().length},minmax(72px,1fr));background:#F8FAFC;border-bottom:1px solid #E5E7EB">
        <div style="padding:8px 10px;font-size:10.5px;font-weight:800;color:#4B5563">과정명</div>
        ${getCourseRegPeriods().map(weeks => `
          <div style="padding:8px 5px;text-align:center;font-size:10.5px;font-weight:800;color:${selectedWeeks && weeks === selectedWeeks ? '#4338CA' : '#4B5563'};background:${selectedWeeks && weeks === selectedWeeks ? '#EEF2FF' : 'transparent'}">${weeks}주</div>
        `).join('')}
      </div>
      ${rows.map(({ course, index }, rowIndex) => {
        const isUsed = usedCourses.includes(course.name);
        return `
        <div style="display:grid;grid-template-columns:150px repeat(${getCourseRegPeriods().length},minmax(72px,1fr));border-bottom:${rowIndex === rows.length - 1 ? '0' : '1px solid #EEF0F4'};background:${isUsed ? '#F9FAFB' : '#fff'}">
          <div style="padding:8px 10px;display:flex;flex-direction:column;justify-content:center;background:${isUsed ? '#F9FAFB' : selectedCourseName === course.name ? '#F8FAFF' : '#fff'}">
            <b style="font-size:11px;color:${isUsed ? '#9CA3AF' : '#111827'}">${course.name}</b>
            ${isUsed ? '<span style="font-size:9.5px;color:#9CA3AF;margin-top:2px">이미 등록됨 · 기간은 수정에서 변경</span>' : ''}
          </div>
          ${getCourseRegPeriods().map(weeks => {
            const active = hasStartDate && !isUsed && selectedCourseName === course.name && weeks === selectedWeeks;
            const clickable = hasStartDate && !isUsed;
            const amount = getCourseRegPeriodFee(course.fee, course.tuitionPolicy, weeks);
            return `
              <button type="button" onclick="selectSegmentEditOption(${index}, ${weeks})" aria-pressed="${active}" ${clickable ? '' : 'disabled'} style="min-height:44px;padding:5px;border:0;border-left:1px solid #EEF0F4;background:${active ? '#4F46E5' : clickable ? '#fff' : '#F9FAFB'};color:${active ? '#fff' : clickable ? '#111827' : '#D1D5DB'};cursor:${clickable ? 'pointer' : 'not-allowed'};font-family:inherit">
                <span style="display:block;font-size:11px;font-weight:900">${formatCourseRegMoney(amount)}</span>
              </button>
            `;
          }).join('')}
        </div>
      `;
      }).join('')}
    </div>
  `;
}

function selectSegmentEditOption(courseIndex, weeks) {
  const startVal = document.getElementById('seg-edit-start')?.value || '';
  if (!startVal) {
    showToast('시작일을 먼저 선택해줘.', 'warning');
    return;
  }
  const course = typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES[courseIndex] : null;
  if (!course) return;
  const courseEl = document.getElementById('seg-edit-course');
  if (courseEl) courseEl.value = course.name;
  const durationEl = document.getElementById('seg-edit-duration');
  if (durationEl) durationEl.value = String(weeks);
  renderSegmentEditCourseComparison();
  renderSegmentEditRecommendedLevels();
  previewCourseSegmentEdit();
}

// 등록 모달의 renderCourseRegRecommendedLevels와 동일한 로직 — 선택된 과정에 설정된 추천 레벨을 뱃지로 보여주기만 함(선택 불가)
function renderSegmentEditRecommendedLevels() {
  const target = document.getElementById('seg-edit-recommended-levels');
  if (!target) return;
  const courseName = document.getElementById('seg-edit-course')?.value || '';
  const courses = typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES : [];
  const course = courses.find(c => c.name === courseName);
  const levels = typeof getCourseRegRecommendedLevels === 'function' ? getCourseRegRecommendedLevels(course) : [];
  target.innerHTML = levels.length
    ? levels.map(level => `<span class="tsa-badge tsa-badge-gray" style="font-size:11px;padding:5px 8px">${level.name}</span>`).join('')
    : `<span style="font-size:11.5px;color:#9CA3AF">${courseName ? '추천 레벨이 설정되지 않았습니다.' : '과정을 선택하면 추천 레벨이 표시됩니다.'}</span>`;
}

function previewCourseSegmentEdit() {
  const preview = document.getElementById('seg-edit-preview');
  const endEl = document.getElementById('seg-edit-end');
  if (!preview) return;
  const courseName = document.getElementById('seg-edit-course')?.value || '';
  const startVal = document.getElementById('seg-edit-start')?.value || '';
  const weeks = parseInt(document.getElementById('seg-edit-duration')?.value, 10) || 4;
  const courses = typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES : [];
  const course = courses.find(c => c.name === courseName);
  const tuition = course ? getCourseRegPeriodFee(course.fee, course.tuitionPolicy, weeks) : 0;
  let endDate = '';
  if (startVal) {
    const d = new Date(startVal);
    d.setDate(d.getDate() + weeks * 7);
    endDate = d.toISOString().split('T')[0];
  }
  if (endEl) endEl.value = endDate;
  preview.innerHTML = startVal && courseName
    ? `${courseName} · 종료일 <strong>${endDate}</strong> · 수강료 <strong>${formatCourseRegMoney(tuition)}</strong>`
    : '시작일과 위 표에서 과정·기간을 선택하면 종료일과 수강료가 자동 계산됩니다.';
}

function saveCourseSegmentEdit() {
  const target = APP._segmentEditTarget;
  if (!target) return;
  const baseStudent = MOCK_STUDENTS.find(std => std.id === target.studentId);
  if (!baseStudent) return;
  const segments = getEditableSegmentsArray(baseStudent);
  const isNew = Boolean(target.isNew);
  const segment = isNew ? {} : segments[target.index];
  if (!segment) return;

  const courseName = document.getElementById('seg-edit-course')?.value || '';
  const startVal = document.getElementById('seg-edit-start')?.value || '';
  const weeks = parseInt(document.getElementById('seg-edit-duration')?.value, 10) || 4;

  if (!courseName || !startVal) {
    showToast('과정과 시작일을 입력해줘.', 'danger');
    return;
  }

  // 새 구간을 추가하는 경우, 같은 등록(체류) 안에서 이어지는 것이므로 직전 구간 종료일 이후여야 한다.
  if (isNew) {
    const previousSegment = segments[segments.length - 1];
    if (previousSegment && previousSegment.endDate && startVal < previousSegment.endDate) {
      showToast('새 구간은 이전 구간 종료일 이후에 시작해야 해.', 'warning');
      return;
    }
  }

  const courses = typeof MOCK_COURSES !== 'undefined' ? MOCK_COURSES : [];
  const course = courses.find(c => c.name === courseName);
  const start = new Date(startVal);
  start.setDate(start.getDate() + weeks * 7);
  const endDate = start.toISOString().split('T')[0];
  const recommendedLevels = (typeof getCourseRegRecommendedLevels === 'function' ? getCourseRegRecommendedLevels(course) : []).map(level => level.name);

  segment.course = courseName;
  segment.startDate = startVal;
  segment.endDate = endDate;
  segment.duration = weeks;
  segment.recommendedLevels = recommendedLevels;
  segment.tuitionAmount = course ? getCourseRegPeriodFee(course.fee, course.tuitionPolicy, weeks) : segment.tuitionAmount;

  if (isNew) segments.push(segment);

  syncStudentTopLevelFromSegments(baseStudent);
  closeCourseSegmentEditModal();
  showToast(isNew ? '수강 구간이 추가되었습니다.' : '수강 구간이 수정되었습니다.', 'success');
  refreshCourseSegmentTab();
}

function deleteCourseSegment(studentId, index) {
  const baseStudent = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!baseStudent) return;
  const segments = getEditableSegmentsArray(baseStudent);
  if (segments.length <= 1) {
    showToast('최소 1개의 수강 구간은 남아있어야 합니다.', 'warning');
    return;
  }
  if (!window.confirm('이 수강 구간을 삭제할까요?')) return;
  segments.splice(index, 1);
  syncStudentTopLevelFromSegments(baseStudent);
  showToast('수강 구간이 삭제되었습니다.', 'success');
  refreshCourseSegmentTab();
}

function openDormRequestEditModal(studentId) {
  const student = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!student) return;
  APP._dormEditTarget = { studentId };

  const accomEl = document.getElementById('dre-accom');
  if (accomEl) accomEl.value = student.dormAccomType || '';
  const capEl = document.getElementById('dre-cap');
  if (capEl) capEl.value = student.dormType ? String(parseInt(student.dormType, 10)) : '';
  const gradeEl = document.getElementById('dre-grade');
  if (gradeEl) gradeEl.value = student.dormGrade || '';
  const weeksEl = document.getElementById('dre-weeks');
  if (weeksEl) {
    const presetWeeks = student.dormIn && student.dormOut
      ? Math.max(1, Math.round((new Date(student.dormOut) - new Date(student.dormIn)) / (7 * 86400000)))
      : 0;
    weeksEl.value = presetWeeks ? String(presetWeeks) : '';
  }

  const inEl = document.getElementById('dre-in');
  if (inEl) inEl.value = student.dormIn || student.startDate || '';

  renderDormRequestCompareTable();
  previewDormRequestEdit();
  document.getElementById('dorm-request-edit-modal').style.display = 'flex';
  document.getElementById('dorm-request-edit-backdrop').style.display = 'block';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function closeDormRequestEditModal() {
  document.getElementById('dorm-request-edit-modal').style.display = 'none';
  document.getElementById('dorm-request-edit-backdrop').style.display = 'none';
  APP._dormEditTarget = null;
}

function getDreSelectedTemplate() {
  const accom = document.getElementById('dre-accom')?.value || '';
  const cap = parseInt(document.getElementById('dre-cap')?.value, 10);
  const grade = document.getElementById('dre-grade')?.value || '';
  return MOCK_DORM_TEMPLATES.find(t => t.accomType === accom && t.capacity === cap && t.condition === grade) || null;
}

// 수강 구간 수정 모달의 과정별 비교표와 동일한 패턴 — 숙소 마스터 템플릿(MOCK_DORM_TEMPLATES) × 기간(getCourseRegPeriods())으로 비용 비교
function renderDormRequestCompareTable() {
  const target = document.getElementById('dre-compare-table');
  if (!target) return;
  const summary = document.getElementById('dre-selection-summary');
  const rows = (typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES : []).filter(t => t.active !== false);
  const selectedAccom = document.getElementById('dre-accom')?.value || '';
  const selectedCap = parseInt(document.getElementById('dre-cap')?.value, 10) || 0;
  const selectedGrade = document.getElementById('dre-grade')?.value || '';
  const selectedWeeks = parseInt(document.getElementById('dre-weeks')?.value, 10) || 0;
  const hasStartDate = Boolean(document.getElementById('dre-in')?.value);

  if (!rows.length) {
    target.innerHTML = `<div style="padding:18px;text-align:center;color:#9CA3AF;font-size:12px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:10px">등록된 숙소 유형이 없습니다.</div>`;
    return;
  }

  if (summary) {
    summary.textContent = !hasStartDate ? '(입실일 먼저 선택)' : selectedAccom ? `현재 선택: ${selectedAccom} · ${selectedCap}인실 · ${selectedGrade} · ${selectedWeeks}주` : '';
  }

  target.innerHTML = `
    <div style="min-width:680px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden">
      <div style="display:grid;grid-template-columns:190px repeat(${getCourseRegPeriods().length},minmax(72px,1fr));background:#F8FAFC;border-bottom:1px solid #E5E7EB">
        <div style="padding:8px 10px;font-size:10.5px;font-weight:800;color:#4B5563">숙소</div>
        ${getCourseRegPeriods().map(weeks => `
          <div style="padding:8px 5px;text-align:center;font-size:10.5px;font-weight:800;color:${selectedWeeks && weeks === selectedWeeks ? '#4338CA' : '#4B5563'};background:${selectedWeeks && weeks === selectedWeeks ? '#EEF2FF' : 'transparent'}">${weeks}주</div>
        `).join('')}
      </div>
      ${rows.map((template, rowIndex) => {
        const isSelectedRow = selectedAccom === template.accomType && selectedCap === template.capacity && selectedGrade === template.condition;
        return `
        <div style="display:grid;grid-template-columns:190px repeat(${getCourseRegPeriods().length},minmax(72px,1fr));border-bottom:${rowIndex === rows.length - 1 ? '0' : '1px solid #EEF0F4'};background:#fff">
          <div style="padding:8px 10px;display:flex;flex-direction:column;justify-content:center;background:${isSelectedRow ? '#F8FAFF' : '#fff'}">
            <b style="font-size:11px;color:#111827">${template.accomType}</b>
            <span style="font-size:9.5px;color:#9CA3AF;margin-top:2px">${template.capacity}인실 · ${template.condition}</span>
          </div>
          ${getCourseRegPeriods().map(weeks => {
            const active = hasStartDate && isSelectedRow && weeks === selectedWeeks;
            const amount = getCourseRegPeriodFee(template.cost, template.tuitionPolicy, weeks);
            return `
              <button type="button" onclick="selectDormRequestOption(${rowIndex}, ${weeks})" aria-pressed="${active}" ${hasStartDate ? '' : 'disabled'} style="min-height:44px;padding:5px;border:0;border-left:1px solid #EEF0F4;background:${active ? '#4F46E5' : hasStartDate ? '#fff' : '#F9FAFB'};color:${active ? '#fff' : hasStartDate ? '#111827' : '#9CA3AF'};cursor:${hasStartDate ? 'pointer' : 'not-allowed'};font-family:inherit">
                <span style="display:block;font-size:11px;font-weight:900">${formatCourseRegMoney(amount)}</span>
              </button>
            `;
          }).join('')}
        </div>`;
      }).join('')}
    </div>
  `;
}

function selectDormRequestOption(templateIndex, weeks) {
  const inVal = document.getElementById('dre-in')?.value || '';
  if (!inVal) {
    showToast('입실 희망일을 먼저 선택해줘.', 'warning');
    return;
  }
  const rows = (typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES : []).filter(t => t.active !== false);
  const template = rows[templateIndex];
  if (!template) return;

  const accomEl = document.getElementById('dre-accom');
  if (accomEl) accomEl.value = template.accomType;
  const capEl = document.getElementById('dre-cap');
  if (capEl) capEl.value = String(template.capacity);
  const gradeEl = document.getElementById('dre-grade');
  if (gradeEl) gradeEl.value = template.condition;
  const weeksEl = document.getElementById('dre-weeks');
  if (weeksEl) weeksEl.value = String(weeks);

  renderDormRequestCompareTable();
  previewDormRequestEdit();
}

function previewDormRequestEdit() {
  const preview = document.getElementById('dre-preview');
  const outEl = document.getElementById('dre-out');
  if (!preview) return;
  const template = getDreSelectedTemplate();
  const inVal = document.getElementById('dre-in')?.value || '';
  const weeks = parseInt(document.getElementById('dre-weeks')?.value, 10) || 0;

  let outVal = '';
  if (inVal && weeks) {
    const d = new Date(inVal);
    d.setDate(d.getDate() + weeks * 7);
    outVal = d.toISOString().split('T')[0];
  }
  if (outEl) outEl.value = outVal;

  if (!template || !inVal || !weeks) {
    preview.innerHTML = '입실일과 위 표에서 숙소·기간을 선택하면 퇴실일과 예상 비용이 자동 계산됩니다.';
    return;
  }
  const amount = getCourseRegPeriodFee(template.cost, template.tuitionPolicy, weeks);
  preview.innerHTML = `${template.accomType} · ${template.capacity}인실 · ${template.condition} · 퇴실일 <strong>${outVal}</strong> · 예상 비용 <strong>${formatCourseRegMoney(amount)}</strong>`;
}

function saveDormRequestEdit() {
  const target = APP._dormEditTarget;
  if (!target) return;
  const student = MOCK_STUDENTS.find(std => std.id === target.studentId);
  if (!student) return;

  const accom = document.getElementById('dre-accom')?.value || '';
  const cap = document.getElementById('dre-cap')?.value || '';
  const grade = document.getElementById('dre-grade')?.value || '';
  const inVal = document.getElementById('dre-in')?.value || '';
  const outVal = document.getElementById('dre-out')?.value || '';

  if (!accom || !cap || !grade || !inVal || !outVal) {
    showToast('입실일과 위 표에서 숙소·기간을 선택해줘.', 'danger');
    return;
  }

  student.dormAccomType = accom;
  student.dormType = parseInt(cap, 10);
  student.dormGrade = grade;
  student.dormIn = inVal;
  student.dormOut = outVal;

  const template = getDreSelectedTemplate();
  if (template) {
    const weeks = parseInt(document.getElementById('dre-weeks')?.value, 10) || Math.max(1, Math.round((new Date(outVal) - new Date(inVal)) / (7 * 86400000)));
    student.dormAmount = getCourseRegPeriodFee(template.cost, template.tuitionPolicy, weeks);
  }

  closeDormRequestEditModal();
  showToast('기숙사 신청 정보가 수정되었습니다.', 'success');
  refreshDormRequestTab();
}

function getEnrollmentStatusLabel(status) {
  if (status === 'current') return '재학';
  if (status === 'completed') return '졸업';
  if (status === 'resigned') return '퇴원';
  if (status === 'extended') return '연장';
  if (status === 'no_course') return '미수강';
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

  if (tab === 'schedule' && currentAdetailPortal === 'admin') {
    if (typeof renderStudentScheduleTab === 'function') renderStudentScheduleTab(s.id);
    else container.innerHTML = '<div style="padding:30px;text-align:center;color:#9CA3AF;font-size:12px">스케줄을 불러올 수 없어.</div>';
  } else if (tab === 'flightdocs') {
    renderAgencyEnrollmentFlightDocs(s, container);
  } else if (tab === 'consultation') {
    renderStudentConsultationTab(s, container);
  } else {
    switchAdetailTab(tab, 'adetail-page-enrollment-content', currentAdetailStudentId);
  }
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

/* =============================================
   출입국 및 체류 관리 — 데이터 모델
   원본 파일(여권 사본·E-티켓·보험증서 등)은 LMS에 저장하지 않고
   확인 상태·확인일·확인 담당자만 기록한다.
   ============================================= */
const STAY_FLIGHT_KINDS = [
  ['first_entry', '최초 입국'],
  ['temp_exit', '일시 출국'],
  ['re_entry', '재입국'],
  ['final_exit', '최종 출국'],
  ['other', '기타 이동']
];
const STAY_COUNTRY_AIRPORTS = {
  '한국': [['ICN', '인천국제공항'], ['GMP', '김포국제공항'], ['PUS', '김해국제공항'], ['CJU', '제주국제공항']],
  '일본': [['NRT', '나리타국제공항'], ['HND', '하네다공항'], ['KIX', '간사이국제공항'], ['FUK', '후쿠오카공항'], ['NGO', '주부국제공항']],
  '중국': [['PEK', '베이징 서우두국제공항'], ['PKX', '베이징 다싱국제공항'], ['PVG', '상하이 푸둥국제공항'], ['CAN', '광저우 바이윈국제공항']],
  '베트남': [['HAN', '노이바이국제공항'], ['SGN', '떤선녓국제공항'], ['DAD', '다낭국제공항']],
  '몽골': [['UBN', '칭기즈 칸 국제공항']],
  '필리핀': [['CEB', '막탄 세부 국제공항'], ['MNL', '니노이 아키노 국제공항'], ['CRK', '클라크국제공항'], ['DVO', '다바오국제공항']],
  '대만': [['TPE', '타오위안국제공항'], ['TSA', '타이베이 쑹산공항']],
  '태국': [['BKK', '수완나품공항'], ['DMK', '돈므앙국제공항'], ['HKT', '푸껫국제공항']]
};

function stayCountryOptionsHtml(selected) {
  const countries = Object.keys(STAY_COUNTRY_AIRPORTS);
  const extra = selected && !countries.includes(selected) ? [selected] : [];
  return '<option value="">국가 선택</option>' + [...countries, ...extra].map(country => `<option value="${country}" ${country === selected ? 'selected' : ''}>${country}</option>`).join('');
}

function stayAirportOptionsHtml(country, selected) {
  const airports = STAY_COUNTRY_AIRPORTS[country] || [];
  const hasSelected = airports.some(([code]) => code === selected);
  const extra = selected && !hasSelected ? [[selected, '기존 등록 공항']] : [];
  return '<option value="">공항 선택</option>' + [...airports, ...extra].map(([code, name]) => `<option value="${code}" ${code === selected ? 'selected' : ''}>${code} · ${name}</option>`).join('');
}
const STAY_FLIGHT_STATUSES = [
  ['planned', '예정'],
  ['confirmed', '확정'],
  ['changed', '변경'],
  ['cancelled', '취소']
];
const STAY_CHECK_STATUSES = [
  ['unchecked', '미확인'],
  ['checked', '확인 완료'],
  ['recheck', '재확인 필요']
];
const STAY_ETICKET_STATUSES = [
  ['unchecked', '미확인'],
  ['checked', '확인 완료'],
  ['recheck', '변경 확인 필요']
];
const STAY_VISA_STATUSES = [
  ['not_started', '미신청'],
  ['preparing', '서류 준비'],
  ['applied', '신청 완료'],
  ['issued', '발급 완료'],
  ['exempt', '면제']
];
function stayLabelOf(list, value) {
  const found = list.find(([code]) => code === value);
  return found ? found[1] : (list[0] ? list[0][1] : '-');
}

function stayOptionsHtml(list, selected) {
  return list.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('');
}

// 개인정보 번호(비자·SSP·증권번호)는 목록과 기본 화면에서 마스킹한다.
function maskStayNumber(value, emptyText = '미등록') {
  const raw = String(value || '').trim();
  if (!raw) return emptyText;
  if (raw.length <= 4) return raw[0] + '•'.repeat(Math.max(1, raw.length - 1));
  return raw.slice(0, 2) + '•'.repeat(raw.length - 4) + raw.slice(-2);
}

function stayNowStamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function stayCurrentActor() {
  const roleNames = { super_admin: '슈퍼 어드민', head_teacher: '티칭 헤드', accounting: '회계 담당자', ss_staff: 'SS 스탭', agency_head: '에이전시', agency_branch: '에이전시' };
  return roleNames[APP && APP.user] || '어드민';
}

// 기존 단일 입/출국 필드를 항공 일정 목록으로 옮긴다. arrivalDate·departureDate는
// 달력·픽업·정산 등 다른 화면이 그대로 참조하므로 목록에서 다시 채워 동기화한다.
function ensureStudentStayData(s) {
  if (!s) return null;
  if (!Array.isArray(s.flightSchedules)) {
    // 옛 flightInfo는 "KE631 | 26.06.01 입국"처럼 표시용 문자열이라 편명만 잘라 쓴다.
    const flightCodeOf = (num, info) => {
      const code = String(num || fmtFlightStr(info) || '').split('|')[0].trim();
      return code === '-' ? '' : code;
    };
    const schedules = [];
    if (s.arrivalDate) {
      schedules.push({
        id: 1, kind: 'first_entry', status: 'confirmed',
        departDate: '', departTime: '', arriveDate: s.arrivalDate, arriveTime: s.flightTime || '',
        fromCountry: s.nationality || '', fromAirport: '', toCountry: '필리핀', toAirport: 'CEB',
        flightNo: flightCodeOf(s.flightNum, s.flightInfo), terminal: '',
        pickupNeeded: true, note: '', eticketCheck: 'unchecked', eticketCheckedAt: '', eticketCheckedBy: ''
      });
    }
    if (s.departureDate) {
      schedules.push({
        id: 2, kind: 'final_exit', status: 'confirmed',
        departDate: s.departureDate, departTime: s.flightOutTime || '', arriveDate: '', arriveTime: '',
        fromCountry: '필리핀', fromAirport: 'CEB', toCountry: s.nationality || '', toAirport: '',
        flightNo: flightCodeOf(s.flightOutNum, s.flightOutInfo), terminal: '',
        pickupNeeded: true, note: '', eticketCheck: 'unchecked', eticketCheckedAt: '', eticketCheckedBy: ''
      });
    }
    s.flightSchedules = schedules;
  }
  if (!s.passportInfo) {
    s.passportInfo = { expiry: s.passportExpiry || '' };
  }
  if (!Array.isArray(s.passportAccessLogs)) s.passportAccessLogs = [];
  if (!s.visaInfo) {
    const legacyStatus = s.visaStatus || (s.visaExpiry === '면제' ? 'exempt' : (s.visaExpiry && s.visaExpiry !== '미설정' ? 'issued' : 'not_started'));
    s.visaInfo = {
      status: legacyStatus, type: '', appliedDate: s.visaAppliedDate || '', issuedDate: '',
      number: s.visaNumber || '', expiry: (s.visaExpiry && s.visaExpiry !== '면제' && s.visaExpiry !== '미설정') ? s.visaExpiry : '',
      originCheck: 'unchecked', checkedAt: '', checkedBy: '', note: ''
    };
  }
  if (!s.sspInfo) {
    const legacyStatus = s.sspStatus || (s.sspExpiry === '면제' ? 'exempt' : (s.sspExpiry && s.sspExpiry !== '미취득' ? 'issued' : 'not_started'));
    s.sspInfo = {
      status: legacyStatus, appliedDate: s.sspAppliedDate || '', issuedDate: '',
      number: s.sspNumber || '', expiry: (s.sspExpiry && s.sspExpiry !== '면제' && s.sspExpiry !== '미취득') ? s.sspExpiry : '',
      exemptReason: '', originCheck: 'unchecked', checkedAt: '', checkedBy: '', note: ''
    };
  }
  if (!Array.isArray(s.stayChangeLog)) s.stayChangeLog = [];
  return s;
}

// 항공 일정 목록이 바뀌면 다른 화면이 쓰는 대표 입·출국 필드를 다시 계산한다.
function syncStudentFlightSummary(s) {
  if (!s || !Array.isArray(s.flightSchedules)) return;
  const live = s.flightSchedules.filter(item => item.status !== 'cancelled');
  const entries = live.filter(item => item.kind === 'first_entry' || item.kind === 're_entry')
    .filter(item => item.arriveDate).sort((a, b) => a.arriveDate.localeCompare(b.arriveDate));
  const exits = live.filter(item => item.kind === 'final_exit' || item.kind === 'temp_exit')
    .filter(item => item.departDate).sort((a, b) => a.departDate.localeCompare(b.departDate));
  const firstEntry = live.find(item => item.kind === 'first_entry' && item.arriveDate) || entries[0];
  const finalExit = live.slice().reverse().find(item => item.kind === 'final_exit' && item.departDate) || exits[exits.length - 1];
  if (firstEntry) {
    s.arrivalDate = firstEntry.arriveDate;
    s.flightTime = firstEntry.arriveTime || '';
    s.flightNum = firstEntry.flightNo || '';
  }
  if (finalExit) {
    s.departureDate = finalExit.departDate;
    s.flightOutTime = finalExit.departTime || '';
    s.flightOutNum = finalExit.flightNo || '';
  }
}

// 수강 등록 팝업(§5 항공편)에서 입력한 입/출국 정보를 flightSchedules 목록에 upsert한다.
// 이미 취소되지 않은 first_entry/final_exit이 있으면 그 항목을 갱신하고, 없으면 새로 만든다.
function syncCourseRegFlightSchedules(student, arrival, departure, arrivalTicketFileName, departureTicketFileName) {
  if (!student) return;
  ensureStudentStayData(student);

  const nextId = () => student.flightSchedules.reduce((max, item) => Math.max(max, item.id || 0), 0) + 1;

  const hasArrivalInfo = !!(arrival && (arrival.flightNo || arrival.date || arrival.time));
  if (hasArrivalInfo) {
    let entry = student.flightSchedules.find(item => item.kind === 'first_entry' && item.status !== 'cancelled');
    if (!entry) {
      entry = {
        id: nextId(), kind: 'first_entry', status: 'confirmed',
        departDate: '', departTime: '', arriveDate: '', arriveTime: '',
        fromCountry: student.nationality || '', fromAirport: '', toCountry: '필리핀', toAirport: 'CEB',
        flightNo: '', terminal: '', pickupNeeded: true, note: '',
        eticketCheck: 'unchecked', eticketCheckedAt: '', eticketCheckedBy: ''
      };
      student.flightSchedules.push(entry);
    }
    if (arrival.date) entry.arriveDate = arrival.date;
    if (arrival.time) entry.arriveTime = arrival.time;
    if (arrival.flightNo) entry.flightNo = arrival.flightNo;
    if (arrival.fromCountry) entry.fromCountry = arrival.fromCountry;
    if (arrival.toCountry) entry.toCountry = arrival.toCountry;
    if (arrivalTicketFileName) entry.ticketFile = arrivalTicketFileName;
  }

  const hasDepartureInfo = !!(departure && (departure.flightNo || departure.date || departure.time));
  if (hasDepartureInfo) {
    let entry = student.flightSchedules.find(item => item.kind === 'final_exit' && item.status !== 'cancelled');
    if (!entry) {
      entry = {
        id: nextId(), kind: 'final_exit', status: 'confirmed',
        departDate: '', departTime: '', arriveDate: '', arriveTime: '',
        fromCountry: '필리핀', fromAirport: 'CEB', toCountry: student.nationality || '', toAirport: '',
        flightNo: '', terminal: '', pickupNeeded: true, note: '',
        eticketCheck: 'unchecked', eticketCheckedAt: '', eticketCheckedBy: ''
      };
      student.flightSchedules.push(entry);
    }
    if (departure.date) entry.departDate = departure.date;
    if (departure.time) entry.departTime = departure.time;
    if (departure.flightNo) entry.flightNo = departure.flightNo;
    if (departure.fromCountry) entry.fromCountry = departure.fromCountry;
    if (departure.toCountry) entry.toCountry = departure.toCountry;
    if (departureTicketFileName) entry.ticketFile = departureTicketFileName;
  }

  syncStudentFlightSummary(student);
}

// §10 이력: 신규 등록·수정·상태 변경·번호 변경·일정 취소·확인 처리
function addStayChangeLog(s, category, field, before, after, reason) {
  if (!s) return;
  if (!Array.isArray(s.stayChangeLog)) s.stayChangeLog = [];
  if (!Array.isArray(s.changeRequests)) s.changeRequests = [];
  const logId = Date.now() + Math.floor(Math.random() * 1000);
  const changedAt = stayNowStamp();
  const changedBy = stayCurrentActor();
  s.stayChangeLog.unshift({
    id: logId,
    at: changedAt, by: changedBy,
    category, field, before: before || '-', after: after || '-', reason: reason || ''
  });
  // 출입국·여권·비자·SSP 변경 이력도 학생 상담 노트의 '정보 변경' 목록에서 함께 확인한다.
  s.changeRequests.unshift({
    id: `stay-${logId}`,
    field: `${category} · ${field}`,
    from: before || '-',
    to: after || '-',
    reason: reason || '',
    changedBy,
    requestDate: changedAt,
    status: 'logged',
    source: 'stay',
    stayLogId: logId
  });
}

function renderAgencyEnrollmentFlightDocs(s, container) {
  ensureStudentStayData(s);
  // 화면을 다시 그리면 여권번호 노출 타이머가 사라진 DOM을 가리키므로 정리한다.
  if (_stayPassportRevealTimer) { clearInterval(_stayPassportRevealTimer); _stayPassportRevealTimer = null; }
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  container.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">
      <div>
        <div style="font-size:14px;font-weight:800;color:#111827">입출국·비자 관리</div>
        <div style="font-size:11px;color:#6B7280;margin-top:3px">학생의 출입국 일정과 여권·비자·SSP 정보 및 첨부 파일을 관리합니다.</div>
      </div>
    </div>
    ${renderStayFlightSection(s, esc)}
    ${renderStayPassportSection(s, esc)}
    ${renderStayVisaSspSection(s, esc)}
    <div style="margin-top:14px;padding:10px 12px;border-radius:9px;background:#F8FAFC;border:1px solid #E5E7EB;font-size:10.5px;color:#6B7280">
      원본 서류는 사내 보관 정책에 따라 별도 관리합니다.
    </div>
  `;
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

// 저장 결과를 해당 영역 안에서만 알려 다른 영역의 미저장 입력에 영향을 주지 않는다(§11).
function showStaySectionSaved(sectionId, message) {
  const box = document.getElementById(sectionId);
  if (!box) return;
  box.textContent = `✓ ${message} (${stayNowStamp()})`;
  box.style.display = '';
}

/* ── 항공 일정 (§5, §6) ───────────────────────────── */
function renderStayFlightSection(s, esc) {
  const today = new Date().toISOString().slice(0, 10);
  const pickupRequested = typeof isPickupRequired === 'function' ? isPickupRequired(s) : s.pickupRequired === true;
  const sorted = [...s.flightSchedules].sort((a, b) => {
    const ka = `${a.departDate || a.arriveDate || ''} ${a.departTime || ''}`;
    const kb = `${b.departDate || b.arriveDate || ''} ${b.departTime || ''}`;
    return ka.localeCompare(kb);
  });
  const rows = sorted.map(item => {
    const baseDate = item.departDate || item.arriveDate || '';
    const isPast = baseDate && baseDate < today;
    const cancelled = item.status === 'cancelled';
    const route = `${esc(item.fromCountry || '-')} → ${esc(item.toCountry || '-')}`;
    const ticketFileName = typeof item.ticketFile === 'string' ? item.ticketFile : (item.ticketFile?.name || '');
    const ticketHtml = ticketFileName
      ? `<button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openAgencyRequiredFilePreview('ticket','${encodeURIComponent(ticketFileName)}')"><i data-lucide="paperclip" style="width:11px;height:11px"></i> 파일 보기</button>`
      : '<span style="font-size:10px;color:#9CA3AF">미첨부</span>';
    return `<tr style="${cancelled ? 'opacity:.55' : ''}${isPast && !cancelled ? 'background:#FCFCFD' : ''}">
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;white-space:nowrap">
        <span class="tsa-badge tsa-badge-primary" style="font-size:9.5px">${stayLabelOf(STAY_FLIGHT_KINDS, item.kind)}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;font-size:11px;white-space:nowrap">${esc(item.departDate || '-')}<div style="font-size:9.5px;color:#9CA3AF">${esc(item.departTime || '')}</div></td>
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;font-size:11px;white-space:nowrap">${esc(item.arriveDate || '-')}<div style="font-size:9.5px;color:#9CA3AF">${esc(item.arriveTime || '')}</div></td>
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;font-size:11px;white-space:nowrap">${esc(item.flightNo || '-')}${item.terminal ? `<div style="font-size:9.5px;color:#9CA3AF">T${esc(item.terminal)}</div>` : ''}</td>
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;font-size:11px;white-space:nowrap">${route}</td>
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;white-space:nowrap">
        <span style="display:inline-flex;padding:2px 8px;border-radius:999px;font-size:9.5px;font-weight:800;background:${pickupRequested ? '#ECFDF5' : '#F3F4F6'};color:${pickupRequested ? '#047857' : '#6B7280'}">${pickupRequested ? '신청' : '미신청'}</span>
      </td>
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;white-space:nowrap">${ticketHtml}</td>
      <td style="padding:8px;border-bottom:1px solid #F1F4F9;text-align:center;white-space:nowrap">
        <button class="tsa-btn tsa-btn-xs tsa-btn-outline" onclick="openStayFlightEditor(${item.id})">수정</button>
        ${cancelled ? '' : `<button class="tsa-btn tsa-btn-xs" style="color:#DC2626;background:#FEE2E2;margin-left:4px" onclick="cancelStayFlight(${item.id})">취소</button>`}
      </td>
    </tr>`;
  }).join('');

  return `
    <div style="border:1px solid #E5E7EB;border-radius:12px;padding:14px;background:#fff">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <div>
          <div style="font-size:12.5px;font-weight:800;color:#374151">항공 일정</div>
          <div style="font-size:10.5px;color:#6B7280;margin-top:2px">일시 귀국·재입국을 포함해 여러 건을 등록할 수 있으며, 수강 등록 때 첨부한 E-티켓을 확인할 수 있습니다.</div>
        </div>
        <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="openStayFlightEditor(null)"><i data-lucide="plus" style="width:13px;height:13px"></i> 일정 추가</button>
      </div>
      <div style="overflow-x:auto" class="stay-flight-scroll">
        <table style="width:100%;border-collapse:collapse;min-width:720px">
          <thead><tr style="background:#F8F9FC">
            ${['구분', '출발일시', '도착일시', '항공편명', '이동 경로', '픽업 신청', 'E-티켓', '관리'].map(h => `<th style="padding:8px;text-align:${h === '관리' ? 'center' : 'left'};font-size:10.5px;font-weight:800;color:#4B5563;border-bottom:1px solid #E5E7EB;white-space:nowrap">${h}</th>`).join('')}
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="8" style="padding:24px;text-align:center;color:#9CA3AF;font-size:11px">등록된 항공 일정이 없습니다. [일정 추가]로 등록해주세요.</td></tr>'}</tbody>
        </table>
      </div>
      <div id="stay-flight-saved" style="display:none;margin-top:9px;font-size:10.5px;color:#047857;font-weight:700"></div>
    </div>
  `;
}

/* ── 여권 정보 (§4) ───────────────────────────────── */
function renderStayPassportSection(s, esc) {
  const info = s.passportInfo;
  const hasNumber = !!s.passportNum;
  return `
    <div style="margin-top:14px;border:1px solid #E5E7EB;border-radius:12px;padding:14px;background:#F8FAFC">
      <div style="font-size:12.5px;font-weight:800;color:#374151;margin-bottom:3px">여권 정보</div>
      <div style="font-size:10.5px;color:#6B7280;margin-bottom:10px">여권번호는 기본적으로 마스킹하며, 수정한 내용과 처리자는 상담 노트의 정보 변경 이력에 기록됩니다.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="tsa-form-group" style="margin:0">
          <label class="tsa-label">등록된 여권번호</label>
          <div style="display:flex;gap:6px">
            <input id="stay-passport-display" class="tsa-input" value="${esc(maskPassportNumber(s.passportNum, '미등록'))}" readonly style="flex:1;background:#F3F4F6;color:#6B7280;letter-spacing:.5px"/>
            <button class="tsa-btn tsa-btn-outline tsa-btn-sm" style="flex-shrink:0" onclick="openStayPassportAccessLog()"><i data-lucide="list" style="width:13px;height:13px"></i> 조회 리스트</button>
            <button id="stay-passport-edit" class="tsa-btn tsa-btn-outline tsa-btn-sm" style="flex-shrink:0" onclick="enableStayPassportInlineEdit()"><i data-lucide="pencil" style="width:13px;height:13px"></i> 수정</button>
          </div>
          <div id="stay-passport-edit-hint" style="font-size:10px;color:#9CA3AF;margin-top:5px">수정 버튼을 누르면 화면에서 직접 변경할 수 있습니다.</div>
          <div id="stay-passport-edit-panel" style="display:none;margin-top:8px;padding:10px;border:1px solid #C7D2FE;border-radius:9px;background:#F8F9FF">
            <label class="tsa-label">새 여권번호</label>
            <input id="stay-passport-edit-input" class="tsa-input" value="" placeholder="새 여권번호를 입력하세요" autocomplete="off"/>
          </div>
        </div>
        <div class="tsa-form-group" style="margin:0">
          <label class="tsa-label">여권 만료일</label>
          <div style="display:flex;gap:6px">
            <input id="stay-passport-expiry" type="date" class="tsa-input" style="flex:1" value="${esc(info.expiry || '')}"/>
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:11px">
        <div id="stay-passport-saved" style="display:none;font-size:10.5px;color:#047857;font-weight:700"></div>
        <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="margin-left:auto" onclick="saveStayPassport()"><i data-lucide="check" style="width:13px;height:13px"></i> 여권 정보 저장</button>
      </div>
    </div>`;
}

/* ── 비자 · SSP 진행 정보 (§7) ────────────────────── */
function renderStayVisaSspSection(s, esc) {
  const visa = s.visaInfo;
  const ssp = s.sspInfo;
  const sspExempt = ssp.status === 'exempt';
  const field = (label, inner) => `<div class="tsa-form-group" style="margin:0"><label class="tsa-label">${label}</label>${inner}</div>`;
  return `
    <div style="margin-top:14px;border:1px solid #DDD6FE;border-radius:12px;padding:14px;background:#FAF5FF">
      <div style="font-size:12.5px;font-weight:800;color:#5B21B6;margin-bottom:3px">비자 · SSP 진행 정보</div>
      <div style="font-size:10.5px;color:#7C3AED;margin-bottom:11px">진행 상태와 발급 정보만 기록합니다. 원본 서류는 LMS에 저장하지 않습니다.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px" class="stay-visa-grid">
        <div style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:11px;padding:13px">
          <div style="font-size:12.5px;font-weight:800;color:#1D4ED8;margin-bottom:10px">비자</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
            ${field('진행 상태', `<select id="stay-visa-status" class="tsa-input">${stayOptionsHtml(STAY_VISA_STATUSES, visa.status)}</select>`)}
            ${field('비자 유형', `<input id="stay-visa-type" class="tsa-input" value="${esc(visa.type || '')}" placeholder="예: 9(a) 관광"/>`)}
            ${field('신청일', `<input id="stay-visa-applied" type="date" class="tsa-input" value="${esc(visa.appliedDate || '')}"/>`)}
            ${field('발급일', `<input id="stay-visa-issued" type="date" class="tsa-input" value="${esc(visa.issuedDate || '')}"/>`)}
            ${field('비자번호', `<input id="stay-visa-number" class="tsa-input" value="${esc(visa.number || '')}" placeholder="예: VISA-2026-001"/>`)}
            ${field('만료일', `<input id="stay-visa-expiry" type="date" class="tsa-input" value="${esc(visa.expiry || '')}"/>`)}
          </div>
          <div style="font-size:10px;color:#6B7280;margin-top:8px">목록·출력물에는 ${esc(maskStayNumber(visa.number))} 형태로 표시됩니다.</div>
        </div>
        <div style="border:1px solid #A7F3D0;background:#ECFDF5;border-radius:11px;padding:13px">
          <div style="font-size:12.5px;font-weight:800;color:#047857;margin-bottom:10px">SSP</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:9px">
            ${field('진행 상태', `<select id="stay-ssp-status" class="tsa-input" onchange="onStaySspStatusChange()">${stayOptionsHtml(STAY_VISA_STATUSES, ssp.status)}</select>`)}
            ${field('면제 사유', `<input id="stay-ssp-exempt-reason" class="tsa-input" value="${esc(ssp.exemptReason || '')}" placeholder="${sspExempt ? '면제 사유를 입력하세요 (필수)' : '면제 선택 시 입력'}" ${sspExempt ? '' : 'disabled'}/>`)}
            ${field('신청일', `<input id="stay-ssp-applied" type="date" class="tsa-input" value="${esc(ssp.appliedDate || '')}" ${sspExempt ? 'disabled' : ''}/>`)}
            ${field('발급일', `<input id="stay-ssp-issued" type="date" class="tsa-input" value="${esc(ssp.issuedDate || '')}" ${sspExempt ? 'disabled' : ''}/>`)}
            ${field('SSP 번호', `<input id="stay-ssp-number" class="tsa-input" value="${esc(ssp.number || '')}" placeholder="예: SSP-2026-001" ${sspExempt ? 'disabled' : ''}/>`)}
            ${field('만료일', `<input id="stay-ssp-expiry" type="date" class="tsa-input" value="${esc(ssp.expiry || '')}" ${sspExempt ? 'disabled' : ''}/>`)}
          </div>
          <div style="font-size:10px;color:#6B7280;margin-top:8px">목록·출력물에는 ${esc(maskStayNumber(ssp.number))} 형태로 표시됩니다.</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:11px">
        <div id="stay-visa-saved" style="display:none;font-size:10.5px;color:#047857;font-weight:700"></div>
        <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="margin-left:auto" onclick="saveStayVisaSsp()"><i data-lucide="check" style="width:13px;height:13px"></i> 비자·SSP 정보 저장</button>
      </div>
    </div>`;
}

function handleAdetailRequiredFileUpload(type, input) {
  const fileName = input?.files?.[0]?.name || null;
  if (!fileName) return;
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;
  captureAgencyPassportNumber(s);
  captureAgencyVisaSspFields(s);
  adetailUploadedFiles[type] = fileName;
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

/* =============================================
   출입국 및 체류 관리 — 영역별 저장 (§11)
   ============================================= */
function currentStayStudent() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  return s ? ensureStudentStayData(s) : null;
}

function rerenderStaySection() {
  const s = currentStayStudent();
  const container = document.getElementById('adetail-page-enrollment-content');
  if (s && container) renderAgencyEnrollmentFlightDocs(s, container);
}

const stayVal = id => document.getElementById(id)?.value.trim() || '';

function saveStayPassport() {
  const s = currentStayStudent();
  if (!s) return;
  const info = s.passportInfo;
  const passportEditPanel = document.getElementById('stay-passport-edit-panel');
  const passportEditInput = document.getElementById('stay-passport-edit-input');
  if (passportEditPanel?.dataset.editing === 'yes') {
    const nextNumber = passportEditInput?.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') || '';
    if (!nextNumber) {
      showToast('여권번호를 입력해주세요.', 'warning');
      return;
    }
    if (nextNumber !== s.passportNum) {
      addStayChangeLog(s, '여권', '여권번호', maskPassportNumber(s.passportNum, '미등록'), maskPassportNumber(nextNumber), '화면에서 직접 수정');
      s.passportNum = nextNumber;
    }
  }
  const expiry = stayVal('stay-passport-expiry');
  if (expiry !== info.expiry) addStayChangeLog(s, '여권', '만료일', info.expiry, expiry);
  info.expiry = expiry;
  s.passportExpiry = expiry || s.passportExpiry;
  rerenderStaySection();
  showStaySectionSaved('stay-passport-saved', '여권 정보를 저장했습니다.');
}

function enableStayPassportInlineEdit() {
  const s = currentStayStudent();
  const panel = document.getElementById('stay-passport-edit-panel');
  const input = document.getElementById('stay-passport-edit-input');
  const button = document.getElementById('stay-passport-edit');
  const hint = document.getElementById('stay-passport-edit-hint');
  if (!s || !panel || !input) return;
  if (panel.dataset.editing === 'yes') {
    panel.style.display = 'none';
    panel.dataset.editing = 'no';
    input.value = '';
    if (button) button.innerHTML = '<i data-lucide="pencil" style="width:13px;height:13px"></i> 수정';
    if (hint) hint.textContent = '수정 버튼을 누르면 화면에서 직접 변경할 수 있습니다.';
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
    return;
  }
  panel.style.display = 'block';
  panel.dataset.editing = 'yes';
  input.value = '';
  input.focus();
  if (button) button.innerHTML = '<i data-lucide="chevron-up" style="width:13px;height:13px"></i> 접기';
  if (hint) hint.textContent = '번호를 수정한 뒤 [여권 정보 저장]을 눌러주세요.';
  s.passportAccessLogs.unshift({
    id: Date.now(),
    identifier: `${stayCurrentActor()} (${APP?.user || 'admin'})`,
    accessedAt: stayNowStamp(),
    ipAddress: '192.168.10.24',
    task: '학생 여권번호 수정 화면 열람'
  });
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

// 전체 여권번호는 [조회]를 누른 사람에게만, 15초 동안만 보여준다.
// 백엔드가 없어 실제 접근 차단은 아니고, 최소한 누가 언제 봤는지는 이력으로 남긴다.
let _stayPassportRevealTimer = null;

function revealStayPassportNumber() {
  const s = currentStayStudent();
  if (!s || !s.passportNum) return;
  const display = document.getElementById('stay-passport-display');
  const button = document.getElementById('stay-passport-reveal');
  const hint = document.getElementById('stay-passport-reveal-hint');
  if (!display) return;
  if (_stayPassportRevealTimer) {
    clearInterval(_stayPassportRevealTimer);
    _stayPassportRevealTimer = null;
  }
  // 이미 열려 있으면 즉시 다시 가린다.
  if (button && button.dataset.revealed === 'yes') {
    maskStayPassportDisplay();
    return;
  }
  display.value = s.passportNum;
  display.style.color = '#111827';
  display.style.background = '#FEF3C7';
  if (button) {
    button.dataset.revealed = 'yes';
    button.innerHTML = '<i data-lucide="eye-off" style="width:13px;height:13px"></i> 가리기';
  }
  addStayChangeLog(s, '여권', '여권번호 조회', '-', maskPassportNumber(s.passportNum), '전체 번호 확인');
  s.passportAccessLogs.unshift({
    id: Date.now(),
    identifier: `${stayCurrentActor()} (${APP?.user || 'admin'})`,
    accessedAt: stayNowStamp(),
    ipAddress: '192.168.10.24',
    task: '학생 여권번호 원문 조회'
  });
  let remain = 15;
  if (hint) hint.textContent = `${remain}초 후 자동으로 가려집니다. 조회 기록이 남았습니다.`;
  _stayPassportRevealTimer = setInterval(() => {
    remain -= 1;
    if (remain <= 0) { maskStayPassportDisplay(); return; }
    if (hint) hint.textContent = `${remain}초 후 자동으로 가려집니다. 조회 기록이 남았습니다.`;
  }, 1000);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function openStayPassportAccessLog() {
  const s = currentStayStudent();
  if (!s) return;
  // 조회 기록은 사이드바의 '여권번호 조회 기록' 메뉴에서 본다.
  // 학생 상세는 팝업이라 사이드바가 없으므로, 학생 파라미터를 달아 새 탭으로 연다.
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  url.searchParams.set('passportLog', String(s.id));
  const opened = window.open(url.toString(), '_blank');
  if (!opened) {
    showToast('새 탭이 차단됐어. 브라우저에서 팝업을 허용해줘.', 'warning');
    return;
  }
  opened.focus();
}

/* =============================================
   여권번호 조회 기록 (사이드바 메뉴)
   ============================================= */
let _palStudentFilter = 'all';
let _palSeeded = false;

// 화면 확인용 임시 데이터. 실제 개인정보를 쓰지 않도록 전부 가상값이며,
// 운영 전환 시 이 함수와 호출부를 지우면 된다(§12).
function seedPassportAccessLogSamples() {
  if (_palSeeded) return;
  _palSeeded = true;
  const samples = [
    { nick: 'Amy', email: 'amy.test@example.test', logs: [
      { by: '슈퍼 어드민 (super_admin)', at: '2026-08-05 14:22', ip: '192.168.10.24', task: '학생 여권번호 원문 조회' },
      { by: 'SS 스탭 (ss_staff)', at: '2026-08-04 11:05', ip: '192.168.10.51', task: '학생 여권번호 수정 화면 열람' }
    ] },
    { nick: 'James', email: 'james.test@example.test', logs: [
      { by: 'SS 스탭 (ss_staff)', at: '2026-08-05 09:47', ip: '192.168.10.51', task: '학생 여권번호 원문 조회' }
    ] },
    { nick: 'Kevin', email: 'kevin.test@example.test', logs: [
      { by: '슈퍼 어드민 (super_admin)', at: '2026-08-03 16:30', ip: '192.168.10.24', task: '학생 여권번호 원문 조회' },
      { by: '회계 담당자 (accounting)', at: '2026-08-01 10:12', ip: '192.168.10.77', task: '학생 여권번호 수정 화면 열람' }
    ] },
    { nick: 'Yuki', email: 'yuki.test@example.test', logs: [
      { by: '티칭 헤드 (head_teacher)', at: '2026-07-30 13:58', ip: '192.168.10.35', task: '학생 여권번호 원문 조회' }
    ] }
  ];
  samples.forEach((sample, index) => {
    const student = MOCK_STUDENTS.find(s => s.nick === sample.nick);
    if (!student) return;
    ensureStudentStayData(student);
    if (!student.email) student.email = sample.email;
    if (student.passportAccessLogs.length) return;
    student.passportAccessLogs = sample.logs.map((log, i) => ({
      id: 900000 + index * 10 + i,
      identifier: log.by, accessedAt: log.at, ipAddress: log.ip, task: log.task
    }));
  });
}

function initPassportAccessLogView(studentId) {
  if (!document.getElementById('pal-tbody')) return;
  seedPassportAccessLogSamples();
  _palStudentFilter = studentId != null ? String(studentId) : 'all';
  const search = document.getElementById('pal-search');
  if (search && studentId != null) search.value = '';
  renderPassportAccessLogView();
}

function getPalStudentLabel(studentId) {
  const s = MOCK_STUDENTS.find(item => String(item.id) === String(studentId));
  return s ? (s.nick || s.name) : '알 수 없는 학생';
}

function resetPassportAccessLogFilter() {
  _palStudentFilter = 'all';
  const search = document.getElementById('pal-search');
  if (search) search.value = '';
  renderPassportAccessLogView();
}

function renderPassportAccessLogView() {
  const tbody = document.getElementById('pal-tbody');
  if (!tbody) return;
  const query = (document.getElementById('pal-search')?.value || '').trim().toLowerCase();

  const chip = document.getElementById('pal-student-chip');
  const chipLabel = document.getElementById('pal-student-chip-label');
  if (chip) {
    chip.style.display = _palStudentFilter === 'all' ? 'none' : 'flex';
    if (chipLabel && _palStudentFilter !== 'all') chipLabel.textContent = `${getPalStudentLabel(_palStudentFilter)} 학생만 보는 중`;
  }

  const entries = [];
  MOCK_STUDENTS.forEach(s => {
    if (!Array.isArray(s.passportAccessLogs)) return;
    if (_palStudentFilter !== 'all' && String(s.id) !== _palStudentFilter) return;
    s.passportAccessLogs.forEach(log => entries.push({ student: s, log }));
  });
  // 검색은 학생 기준(이름·닉네임·이메일)으로만 건다.
  const filtered = entries.filter(({ student }) => !query ||
    `${student.name || ''} ${student.nick || ''} ${student.email || ''}`.toLowerCase().includes(query)
  ).sort((a, b) => String(b.log.accessedAt || '').localeCompare(String(a.log.accessedAt || '')));

  const countEl = document.getElementById('pal-count');
  if (countEl) countEl.textContent = `${filtered.length}건${_palStudentFilter !== 'all' ? ` · ${getPalStudentLabel(_palStudentFilter)}` : ''}`;

  tbody.innerHTML = filtered.map(({ student, log }) => `<tr>
    <td style="font-size:11px">
      <b>${lessonEsc(student.nick || student.name)}</b>
      <div style="font-size:10px;color:#9CA3AF">${lessonEsc(student.name || '')} · ${lessonEsc(maskPassportNumber(student.passportNum, '미등록'))}</div>
      <div style="font-size:10px;color:#9CA3AF">${lessonEsc(student.email || '이메일 미등록')}</div>
    </td>
    <td style="font-size:11px;font-weight:700;color:#374151">${lessonEsc(log.identifier)}</td>
    <td style="font-size:11px;white-space:nowrap">${lessonEsc(log.accessedAt)}</td>
    <td style="font-size:11px;font-family:monospace">${lessonEsc(log.ipAddress || log.locationInfo || '-')}</td>
    <td style="font-size:11px">${lessonEsc(log.task)}</td>
  </tr>`).join('') || '<tr><td colspan="5" style="padding:30px;text-align:center;color:#9CA3AF;font-size:11px">조회 기록이 없습니다.</td></tr>';
}

function maskStayPassportDisplay() {
  if (_stayPassportRevealTimer) {
    clearInterval(_stayPassportRevealTimer);
    _stayPassportRevealTimer = null;
  }
  const s = currentStayStudent();
  const display = document.getElementById('stay-passport-display');
  const button = document.getElementById('stay-passport-reveal');
  const hint = document.getElementById('stay-passport-reveal-hint');
  if (display) {
    display.value = maskPassportNumber(s && s.passportNum, '미등록');
    display.style.color = '#6B7280';
    display.style.background = '#F3F4F6';
  }
  if (button) {
    button.dataset.revealed = 'no';
    button.innerHTML = '<i data-lucide="eye" style="width:13px;height:13px"></i> 조회';
  }
  if (hint) hint.textContent = '조회하면 15초 후 자동으로 다시 가려집니다.';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function onStaySspStatusChange() {
  const exempt = stayVal('stay-ssp-status') === 'exempt';
  ['stay-ssp-applied', 'stay-ssp-issued', 'stay-ssp-number', 'stay-ssp-expiry'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.disabled = exempt; if (exempt) el.value = ''; }
  });
  const reason = document.getElementById('stay-ssp-exempt-reason');
  if (reason) {
    reason.disabled = !exempt;
    reason.placeholder = exempt ? '면제 사유를 입력하세요 (필수)' : '면제 선택 시 입력';
  }
}

function saveStayVisaSsp() {
  const s = currentStayStudent();
  if (!s) return;
  const sspStatus = stayVal('stay-ssp-status') || 'not_started';
  const sspExemptReason = stayVal('stay-ssp-exempt-reason');
  if (sspStatus === 'exempt' && !sspExemptReason) {
    showToast('SSP 면제 사유는 필수입니다.', 'warning');
    document.getElementById('stay-ssp-exempt-reason')?.focus();
    return;
  }
  const visa = s.visaInfo;
  const nextVisa = {
    status: stayVal('stay-visa-status') || 'not_started', type: stayVal('stay-visa-type'),
    appliedDate: stayVal('stay-visa-applied'), issuedDate: stayVal('stay-visa-issued'),
    number: stayVal('stay-visa-number'), expiry: stayVal('stay-visa-expiry')
  };
  if (nextVisa.status !== visa.status) addStayChangeLog(s, '비자', '진행 상태', stayLabelOf(STAY_VISA_STATUSES, visa.status), stayLabelOf(STAY_VISA_STATUSES, nextVisa.status));
  if (nextVisa.number !== visa.number) addStayChangeLog(s, '비자', '비자번호', maskStayNumber(visa.number), maskStayNumber(nextVisa.number));
  Object.assign(visa, nextVisa);

  const ssp = s.sspInfo;
  const nextSsp = {
    status: sspStatus, exemptReason: sspStatus === 'exempt' ? sspExemptReason : '',
    appliedDate: sspStatus === 'exempt' ? '' : stayVal('stay-ssp-applied'),
    issuedDate: sspStatus === 'exempt' ? '' : stayVal('stay-ssp-issued'),
    number: sspStatus === 'exempt' ? '' : stayVal('stay-ssp-number'),
    expiry: sspStatus === 'exempt' ? '' : stayVal('stay-ssp-expiry')
  };
  if (nextSsp.status !== ssp.status) addStayChangeLog(s, 'SSP', '진행 상태', stayLabelOf(STAY_VISA_STATUSES, ssp.status), stayLabelOf(STAY_VISA_STATUSES, nextSsp.status), nextSsp.exemptReason);
  if (nextSsp.number !== ssp.number) addStayChangeLog(s, 'SSP', 'SSP 번호', maskStayNumber(ssp.number), maskStayNumber(nextSsp.number));
  Object.assign(ssp, nextSsp);

  // 목록·달력이 참조하는 기존 요약 필드도 함께 맞춰준다.
  s.visaStatus = visa.status;
  s.visaNumber = visa.number;
  s.visaAppliedDate = visa.appliedDate;
  s.visaExpiry = visa.status === 'exempt' ? '면제' : (visa.expiry || '미설정');
  s.sspStatus = ssp.status;
  s.sspNumber = ssp.number;
  s.sspAppliedDate = ssp.appliedDate;
  s.sspExpiry = ssp.status === 'exempt' ? '면제' : (ssp.expiry || '미취득');
  showStaySectionSaved('stay-visa-saved', '비자·SSP 정보를 저장했습니다.');
}

/* ── 항공 일정 편집 (§5) ──────────────────────────── */
let _stayEditingFlightId = null;
let _stayLastFlightPreset = null;

function openStayFlightEditor(flightId) {
  const s = currentStayStudent();
  if (!s) return;
  _stayEditingFlightId = flightId;
  const item = flightId != null ? s.flightSchedules.find(f => f.id === flightId) : null;
  const f = item || {
    kind: 'first_entry', status: 'planned', departDate: '', departTime: '', arriveDate: '', arriveTime: '',
    fromCountry: '', fromAirport: '', toCountry: '', toAirport: '', flightNo: '', terminal: '',
    pickupNeeded: false, note: '', eticketCheck: 'unchecked', eticketCheckedAt: '', eticketCheckedBy: ''
  };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  const field = (label, inner) => `<div class="tsa-form-group" style="margin:0"><label class="tsa-label">${label}</label>${inner}</div>`;
  let modal = document.getElementById('stay-flight-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stay-flight-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="tsa-modal-backdrop" onclick="closeStayFlightEditor()">
      <div class="tsa-modal" style="max-width:720px" onclick="event.stopPropagation()">
        <div class="tsa-modal-header">
          <div>
            <h3 class="tsa-modal-title">${item ? '항공 일정 수정' : '항공 일정 추가'}</h3>
            <p class="tsa-modal-subtitle">출발·도착 일정과 항공편 정보를 입력합니다.</p>
          </div>
          <button class="tsa-modal-close" onclick="closeStayFlightEditor()"><i data-lucide="x"></i></button>
        </div>
        <div class="tsa-modal-body" style="max-height:68vh;overflow-y:auto">
          <div style="display:grid;grid-template-columns:1fr;gap:10px" class="stay-flight-form">
            ${field('일정 구분', `<select id="sf-kind" class="tsa-input" onchange="applyStayFlightKindDefaults(true)">${stayOptionsHtml(STAY_FLIGHT_KINDS, f.kind)}</select>`)}
          </div>
          <div id="sf-kind-hint" style="margin-top:7px;padding:7px 10px;border-radius:8px;background:#EEF2FF;color:#4338CA;font-size:10.5px"></div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px" class="stay-flight-form">
            <div style="border:1px solid #BBF7D0;background:#F0FDF4;border-radius:10px;padding:11px">
              <div style="font-size:11.5px;font-weight:800;color:#047857;margin-bottom:8px">출발</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div style="grid-column:span 2">${field('국가', `<select id="sf-from-country" class="tsa-input">${stayCountryOptionsHtml(f.fromCountry)}</select>`)}</div>
                ${field('날짜', `<input id="sf-depart-date" type="date" class="tsa-input" value="${esc(f.departDate)}"/>`)}
                ${field('시간', `<input id="sf-depart-time" type="time" class="tsa-input" value="${esc(f.departTime)}"/>`)}
              </div>
            </div>
            <div style="border:1px solid #BFDBFE;background:#EFF6FF;border-radius:10px;padding:11px">
              <div style="font-size:11.5px;font-weight:800;color:#1D4ED8;margin-bottom:8px">도착</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
                <div style="grid-column:span 2">${field('국가', `<select id="sf-to-country" class="tsa-input">${stayCountryOptionsHtml(f.toCountry)}</select>`)}</div>
                ${field('날짜', `<input id="sf-arrive-date" type="date" class="tsa-input" value="${esc(f.arriveDate)}"/>`)}
                ${field('시간', `<input id="sf-arrive-time" type="time" class="tsa-input" value="${esc(f.arriveTime)}"/>`)}
              </div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px" class="stay-flight-form">
            ${field('항공편명', `<input id="sf-flightno" class="tsa-input" value="${esc(f.flightNo)}" placeholder="예: KE631"/>`)}
            ${field('터미널', `<input id="sf-terminal" class="tsa-input" value="${esc(f.terminal)}" placeholder="예: 2"/>`)}
          </div>
          <div style="margin-top:12px;padding:11px;border:1px solid #E5E7EB;border-radius:10px;background:#F8FAFC">
            <label class="tsa-label">E-티켓 첨부</label>
            <div style="display:flex;align-items:center;gap:8px">
              <label class="tsa-btn tsa-btn-outline tsa-btn-sm" style="cursor:pointer;flex-shrink:0"><i data-lucide="paperclip" style="width:13px;height:13px"></i> 파일 선택<input id="sf-ticket-file" type="file" accept=".pdf,image/*" hidden onchange="handleStayFlightTicketSelected(this)"/></label>
              <span id="sf-ticket-file-name" style="font-size:10.5px;color:${f.ticketFile ? '#374151' : '#9CA3AF'};overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(f.ticketFile || '첨부된 파일 없음')}</span>
            </div>
          </div>

          <div id="sf-warnings" style="display:none;margin-top:11px;padding:10px 12px;border-radius:9px;background:#FFF7ED;border:1px solid #FED7AA">
            <div style="font-size:11px;font-weight:800;color:#C2410C;margin-bottom:6px">확인이 필요한 항목</div>
            <ul id="sf-warning-list" style="margin:0;padding-left:18px;font-size:10.5px;color:#9A3412;line-height:1.6"></ul>
            <div class="tsa-form-group" style="margin:9px 0 0">
              <label class="tsa-label">그래도 저장하려면 사유를 입력하세요</label>
              <input id="sf-override-reason" class="tsa-input" placeholder="예: 학생 요청으로 예외 처리"/>
            </div>
          </div>
        </div>
        <div class="tsa-modal-footer">
          <button class="tsa-btn tsa-btn-outline" onclick="closeStayFlightEditor()">취소</button>
          <button class="tsa-btn tsa-btn-primary" onclick="saveStayFlight()"><i data-lucide="check"></i> 저장</button>
        </div>
      </div>
    </div>`;
  modal.style.display = '';
  // 새 일정은 구분에 맞춰 노선을 미리 채워주고, 수정은 입력값을 건드리지 않는다.
  _stayLastFlightPreset = null;
  applyStayFlightKindDefaults(!item);
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function toggleStayFlightMore() {
  const box = document.getElementById('sf-more');
  const caret = document.getElementById('sf-more-caret');
  if (!box) return;
  const open = box.style.display === 'none';
  box.style.display = open ? 'block' : 'none';
  if (caret) caret.textContent = open ? '▼' : '▶';
}

function handleStayFlightTicketSelected(input) {
  const label = document.getElementById('sf-ticket-file-name');
  const fileName = input?.files?.[0]?.name || '';
  if (label) {
    label.textContent = fileName || '첨부된 파일 없음';
    label.style.color = fileName ? '#374151' : '#9CA3AF';
  }
}

function onStayFlightCountryChange(side) {
  const country = document.getElementById(`sf-${side}-country`)?.value || '';
  const airport = document.getElementById(`sf-${side}-airport`);
  if (airport) airport.innerHTML = stayAirportOptionsHtml(country, '');
}

// 구분만 고르면 나머지 노선 정보를 대신 채워준다.
// 세부 캠퍼스 기준이라 국내 구간은 학생 국적, 현지 구간은 필리핀(CEB)으로 둔다.
function applyStayFlightKindDefaults(fillValues) {
  const s = currentStayStudent();
  const kind = document.getElementById('sf-kind')?.value;
  if (!kind) return;
  const home = (s && s.nationality) || '';
  const presets = {
    first_entry: { from: home, fromAir: '', to: '필리핀', toAir: 'CEB', pickup: 'yes', hint: '한국 등 본국에서 세부로 처음 입국하는 일정입니다. 픽업이 필요한 경우가 많습니다.' },
    temp_exit: { from: '필리핀', fromAir: 'CEB', to: home, toAir: '', pickup: 'yes', hint: '수강 중 잠시 출국하는 일정입니다. 이후 재입국 일정도 함께 등록해주세요.' },
    re_entry: { from: home, fromAir: '', to: '필리핀', toAir: 'CEB', pickup: 'yes', hint: '일시 출국 후 다시 들어오는 일정입니다.' },
    final_exit: { from: '필리핀', fromAir: 'CEB', to: home, toAir: '', pickup: 'yes', hint: '수강을 마치고 귀국하는 일정입니다. 샌딩이 필요한 경우가 많습니다.' },
    other: { from: '', fromAir: '', to: '', toAir: '', pickup: 'no', hint: '국내 이동 등 위 구분에 해당하지 않는 일정입니다.' }
  };
  const preset = presets[kind] || presets.other;
  const hint = document.getElementById('sf-kind-hint');
  if (hint) hint.textContent = preset.hint;
  if (!fillValues) { _stayLastFlightPreset = null; return; }
  // 비어 있거나 직전 프리셋이 넣어둔 값이면 새 프리셋으로 바꾸고, 사용자가 직접 적은 값은 그대로 둔다.
  const prev = _stayLastFlightPreset;
  const setSmart = (id, value, prevValue) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!el.value || (prevValue && el.value === prevValue)) el.value = value;
  };
  const currentFromAirport = document.getElementById('sf-from-airport')?.value || '';
  const currentToAirport = document.getElementById('sf-to-airport')?.value || '';
  setSmart('sf-from-country', preset.from, prev && prev.from);
  setSmart('sf-to-country', preset.to, prev && prev.to);
  const fromAirport = document.getElementById('sf-from-airport');
  const toAirport = document.getElementById('sf-to-airport');
  if (fromAirport) fromAirport.innerHTML = stayAirportOptionsHtml(document.getElementById('sf-from-country')?.value || '', currentFromAirport);
  if (toAirport) toAirport.innerHTML = stayAirportOptionsHtml(document.getElementById('sf-to-country')?.value || '', currentToAirport);
  setSmart('sf-from-airport', preset.fromAir, prev && prev.fromAir);
  setSmart('sf-to-airport', preset.toAir, prev && prev.toAir);
  _stayLastFlightPreset = preset;
}

function closeStayFlightEditor() {
  const modal = document.getElementById('stay-flight-modal');
  if (modal) modal.style.display = 'none';
  _stayEditingFlightId = null;
}

// §6 저장 전 검증. 업무상 예외가 있을 수 있어 사유를 적으면 저장할 수 있게 한다.
function validateStayFlight(s, draft, editingId) {
  const warnings = [];
  const others = s.flightSchedules.filter(f => f.id !== editingId && f.status !== 'cancelled');
  const departStamp = draft.departDate ? `${draft.departDate} ${draft.departTime || '00:00'}` : '';
  const arriveStamp = draft.arriveDate ? `${draft.arriveDate} ${draft.arriveTime || '00:00'}` : '';
  if (departStamp && arriveStamp && arriveStamp < departStamp) {
    warnings.push('도착일시가 출발일시보다 빠릅니다.');
  }
  if (departStamp && others.some(f => f.departDate && `${f.departDate} ${f.departTime || '00:00'}` === departStamp)) {
    warnings.push('같은 출발일시에 등록된 다른 항공 일정이 있습니다.');
  }
  const firstEntry = others.find(f => f.kind === 'first_entry' && f.arriveDate);
  if (draft.kind === 're_entry' && firstEntry && draft.arriveDate && draft.arriveDate < firstEntry.arriveDate) {
    warnings.push('최초 입국일보다 앞선 재입국 일정입니다.');
  }
  if (draft.kind === 'temp_exit') {
    const hasReturn = others.some(f => f.kind === 're_entry' && f.arriveDate && (!draft.departDate || f.arriveDate >= draft.departDate));
    if (!hasReturn) warnings.push('일시 출국 이후의 재입국 일정이 없습니다.');
  }
  const finalExit = others.find(f => f.kind === 'final_exit' && f.departDate);
  if (finalExit && draft.kind !== 'final_exit') {
    const base = draft.departDate || draft.arriveDate;
    if (base && base > finalExit.departDate) warnings.push('최종 출국 이후에 추가되는 일정입니다.');
  }
  const courseStart = s.startDate;
  const courseEnd = s.endDate || s.departureDate;
  const gapDays = (a, b) => Math.abs((new Date(a) - new Date(b)) / 86400000);
  if (draft.kind === 'first_entry' && draft.arriveDate && courseStart && gapDays(draft.arriveDate, courseStart) > 14) {
    warnings.push('수강 시작일과 입국일 차이가 14일을 넘습니다.');
  }
  if (draft.kind === 'final_exit' && draft.departDate && courseEnd && gapDays(draft.departDate, courseEnd) > 14) {
    warnings.push('수강 종료일과 출국일 차이가 14일을 넘습니다.');
  }
  return warnings;
}

function saveStayFlight() {
  const s = currentStayStudent();
  if (!s) return;
  const existing = _stayEditingFlightId != null ? s.flightSchedules.find(f => f.id === _stayEditingFlightId) : null;
  const selectedTicketFile = document.getElementById('sf-ticket-file')?.files?.[0]?.name || '';
  const draft = {
    kind: stayVal('sf-kind') || 'other', status: existing?.status || 'planned',
    departDate: stayVal('sf-depart-date'), departTime: stayVal('sf-depart-time'),
    arriveDate: stayVal('sf-arrive-date'), arriveTime: stayVal('sf-arrive-time'),
    fromCountry: stayVal('sf-from-country'), fromAirport: existing?.fromAirport || '',
    toCountry: stayVal('sf-to-country'), toAirport: existing?.toAirport || '',
    flightNo: stayVal('sf-flightno'), terminal: stayVal('sf-terminal'),
    ticketFile: selectedTicketFile || existing?.ticketFile || '',
    pickupNeeded: existing?.pickupNeeded || false, note: existing?.note || '',
    eticketCheck: existing?.eticketCheck || 'unchecked', eticketCheckedAt: existing?.eticketCheckedAt || '',
    eticketCheckedBy: existing?.eticketCheckedBy || ''
  };
  if (!draft.departDate && !draft.arriveDate) {
    showToast('출발일 또는 도착일 중 하나는 입력해야 합니다.', 'warning');
    return;
  }
  const warnings = validateStayFlight(s, draft, _stayEditingFlightId);
  const overrideReason = stayVal('sf-override-reason');
  if (warnings.length && !overrideReason) {
    const box = document.getElementById('sf-warnings');
    const list = document.getElementById('sf-warning-list');
    if (list) list.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
    if (box) box.style.display = '';
    showToast('확인이 필요한 항목이 있습니다. 사유를 입력하면 저장할 수 있습니다.', 'warning');
    return;
  }

  if (existing) {
    if (existing.departDate !== draft.departDate || existing.arriveDate !== draft.arriveDate) {
      addStayChangeLog(s, '항공 일정', `${stayLabelOf(STAY_FLIGHT_KINDS, existing.kind)} 일자`, `${existing.departDate || '-'} → ${existing.arriveDate || '-'}`, `${draft.departDate || '-'} → ${draft.arriveDate || '-'}`, overrideReason);
    }
    if (existing.eticketCheck !== draft.eticketCheck) addStayChangeLog(s, '항공 일정', 'E-티켓 확인', stayLabelOf(STAY_ETICKET_STATUSES, existing.eticketCheck), stayLabelOf(STAY_ETICKET_STATUSES, draft.eticketCheck));
    if ((existing.ticketFile || '') !== draft.ticketFile) addStayChangeLog(s, '항공 일정', 'E-티켓 첨부', existing.ticketFile || '미첨부', draft.ticketFile || '미첨부', '항공 일정에서 첨부');
    Object.assign(existing, draft);
  } else {
    const nextId = s.flightSchedules.reduce((max, f) => Math.max(max, f.id || 0), 0) + 1;
    s.flightSchedules.push({ id: nextId, ...draft });
    addStayChangeLog(s, '항공 일정', `${stayLabelOf(STAY_FLIGHT_KINDS, draft.kind)} 등록`, '-', `${draft.departDate || draft.arriveDate} ${draft.flightNo || ''}`.trim(), overrideReason);
  }
  syncStudentFlightSummary(s);
  closeStayFlightEditor();
  rerenderStaySection();
  showStaySectionSaved('stay-flight-saved', existing ? '항공 일정을 수정했습니다.' : '항공 일정을 추가했습니다.');
  showToast(existing ? '항공 일정을 수정했습니다.' : '항공 일정을 추가했습니다.', 'success');
}

// 취소된 일정은 지우지 않고 상태만 바꿔 남긴다(§5).
function cancelStayFlight(flightId) {
  const s = currentStayStudent();
  if (!s) return;
  const item = s.flightSchedules.find(f => f.id === flightId);
  if (!item) return;
  const reason = window.prompt('일정 취소 사유를 입력하세요.', '');
  if (reason === null) return;
  const before = stayLabelOf(STAY_FLIGHT_STATUSES, item.status);
  item.status = 'cancelled';
  addStayChangeLog(s, '항공 일정', `${stayLabelOf(STAY_FLIGHT_KINDS, item.kind)} 취소`, before, '취소', reason.trim());
  syncStudentFlightSummary(s);
  rerenderStaySection();
  showStaySectionSaved('stay-flight-saved', '항공 일정을 취소 처리했습니다.');
}

/* ── 변경 이력 (§10) ──────────────────────────────── */
function openStayChangeLog() {
  const s = currentStayStudent();
  if (!s) return;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  const rows = (s.stayChangeLog || []).map(log => `<tr>
    <td style="padding:7px;border-bottom:1px solid #F1F4F9;font-size:10.5px;white-space:nowrap">${esc(log.at)}</td>
    <td style="padding:7px;border-bottom:1px solid #F1F4F9;font-size:10.5px;white-space:nowrap">${esc(log.category)}</td>
    <td style="padding:7px;border-bottom:1px solid #F1F4F9;font-size:10.5px">${esc(log.field)}</td>
    <td style="padding:7px;border-bottom:1px solid #F1F4F9;font-size:10.5px;color:#9CA3AF">${esc(log.before)}</td>
    <td style="padding:7px;border-bottom:1px solid #F1F4F9;font-size:10.5px;font-weight:700">${esc(log.after)}</td>
    <td style="padding:7px;border-bottom:1px solid #F1F4F9;font-size:10.5px;white-space:nowrap">${esc(log.by)}</td>
    <td style="padding:7px;border-bottom:1px solid #F1F4F9;font-size:10.5px;color:#6B7280">${esc(log.reason || '-')}</td>
  </tr>`).join('');
  let modal = document.getElementById('stay-log-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'stay-log-modal';
    document.body.appendChild(modal);
  }
  modal.innerHTML = `
    <div class="tsa-modal-backdrop" onclick="closeStayChangeLog()">
      <div class="tsa-modal" style="max-width:900px" onclick="event.stopPropagation()">
        <div class="tsa-modal-header">
          <div>
            <h3 class="tsa-modal-title">${esc(s.nick || s.name)} 출입국·체류 변경 이력</h3>
            <p class="tsa-modal-subtitle">번호 항목은 마스킹된 값으로 기록됩니다.</p>
          </div>
          <button class="tsa-modal-close" onclick="closeStayChangeLog()"><i data-lucide="x"></i></button>
        </div>
        <div class="tsa-modal-body" style="max-height:66vh;overflow:auto">
          <table style="width:100%;border-collapse:collapse;min-width:660px">
            <thead><tr style="background:#F8F9FC">
              ${['처리일시', '정보 종류', '항목', '변경 전', '변경 후', '처리자', '사유'].map(h => `<th style="padding:7px;text-align:left;font-size:10.5px;font-weight:800;color:#4B5563;border-bottom:1px solid #E5E7EB;white-space:nowrap">${h}</th>`).join('')}
            </tr></thead>
            <tbody>${rows || '<tr><td colspan="7" style="padding:26px;text-align:center;color:#9CA3AF;font-size:11px">기록된 변경 이력이 없습니다.</td></tr>'}</tbody>
          </table>
        </div>
        <div class="tsa-modal-footer"><button class="tsa-btn tsa-btn-outline" onclick="closeStayChangeLog()">닫기</button></div>
      </div>
    </div>`;
  modal.style.display = '';
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 20);
}

function closeStayChangeLog() {
  const modal = document.getElementById('stay-log-modal');
  if (modal) modal.style.display = 'none';
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
        ${renderStudentLoginInfoBoxHtml('ad', s)}
        <div class="tsa-form-group">
          <label class="tsa-label" style="display:block">영문 성명 (여권명) ${changeBtn('name', '영문 성명')}</label>
          <div style="font-size:10px;color:#9CA3AF;margin-bottom:4px">Surname Given Name 순, 미들네임은 Given Name에 붙여서 입력</div>
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
          <label class="tsa-label">연락처</label>
          <input id="ad-phone" type="text" class="tsa-input" value="${s.phone || ''}"/>
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
        ${(() => {
          const agencyOptions = (typeof MOCK_AGENCIES !== 'undefined') ? MOCK_AGENCIES.filter(a => a.status === 'active' && a.name !== '직접 등록') : [];
          const currentAgencyName = s.agency || '직접 등록';
          return `
            <div style="grid-column:span 2;background:#EEF2FF;border:1.5px solid #C7D2FE;border-radius:10px;padding:14px 16px">
              <div style="font-size:11px;font-weight:700;color:#3730A3;margin-bottom:10px;display:flex;align-items:center;gap:6px">
                <i data-lucide="building-2" style="width:13px;height:13px;color:#5E5CE6"></i> 등록 에이전시 정보
              </div>
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">등록 에이전시</label>
                <select id="ad-agency" class="tsa-input" ${lockAttr} onchange="updateAdAgencyPreview()">
                  <option value="직접 등록" ${currentAgencyName === '직접 등록' ? 'selected' : ''}>🏢 직접 등록 (에이전시 미경유)</option>
                  ${agencyOptions.map(a => `<option value="${a.name}" ${currentAgencyName === a.name ? 'selected' : ''}>${a.flag || ''} ${a.name} · ${a.contact}</option>`).join('')}
                </select>
              </div>
              <div id="ad-agency-preview" style="margin-top:10px"></div>
            </div>
          `;
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
    // 실제 운영 화면과 같은 구성이다. 등록할 때 저장한 값을 그대로 보여주기만 하고,
    // 고치는 일은 수강 등록 화면 한 곳에서만 한다 — 두 곳에서 고치면 값이 갈라진다.
    const amounts = getEnrollmentAmounts(baseStudent, s);
    const paid = (s.paymentStatus || baseStudent.remittanceStatus) === 'paid';
    const registrationFees = amounts.fees.filter(fee => fee.kind === 'registration');
    const extraFees = amounts.fees.filter(fee => fee.kind !== 'registration');
    const enrolledAt = s.enrollDate || baseStudent.enrollDate || baseStudent.remittanceSubmittedDate || '-';
    const memo = (s.enrollMemo || baseStudent.enrollMemo || '').trim();

    const summaryCard = (label, value, color) => `<div style="padding:14px 16px;border:1px solid #E5E7EB;border-radius:11px;background:#fff">
      <div style="font-size:11px;color:#6B7280">${label}</div>
      <div style="font-size:14px;font-weight:800;color:${color || '#111827'};margin-top:7px">${value}</div>
    </div>`;

    const sectionCard = (title, total, rows) => `<div style="border:1px solid #E5E7EB;border-radius:11px;background:#fff;padding:15px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
        <b style="font-size:12.5px;color:#111827">${title}</b>
        <b style="font-size:13px;color:#111827">${formatCourseRegMoney(total)}</b>
      </div>
      <div style="margin-top:11px">${rows}</div>
    </div>`;

    const segmentRows = amounts.segments.map((segment, index) => `
      <div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-top:${index ? '1px solid #F3F4F6' : '0'}">
        <span style="width:26px;height:26px;flex:0 0 26px;border-radius:50%;background:#EEF2FF;color:#4338CA;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800">${index + 1}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:12.5px;font-weight:800;color:#111827">${segment.course || '-'} · ${segment.duration || 0}주</div>
          <div style="font-size:11px;color:#6B7280;margin-top:3px">${fmtDate(segment.startDate)} ~ ${fmtDate(segment.endDate)}</div>
        </div>
        <b style="font-size:12.5px;color:#111827;white-space:nowrap">${segment.tuitionAmount ? formatCourseRegMoney(segment.tuitionAmount) : '-'}</b>
      </div>`).join('');

    const feeRow = (fee, index) => `
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-top:${index ? '1px solid #F3F4F6' : '0'}">
        <span class="tsa-badge" style="background:${fee.kind === 'registration' ? '#DBEAFE' : '#F3F4F6'};color:${fee.kind === 'registration' ? '#1D4ED8' : '#6B7280'};flex:0 0 auto">${fee.kind === 'registration' ? '등록금' : '기타'}</span>
        <b style="font-size:12px;color:#111827;flex:1;min-width:0">${fee.name}</b>
        <b style="font-size:12.5px;color:#111827;white-space:nowrap">${formatCourseRegMoney(fee.amount)}</b>
      </div>`;
    const feeRows = [...registrationFees, ...extraFees].map(feeRow).join('')
      || '<div style="padding:10px 0;font-size:11.5px;color:#9CA3AF">등록금·기타 항목이 없습니다.</div>';

    const infoCell = (label, value) => `<div><div style="font-size:11px;color:#6B7280">${label}</div><div style="margin-top:6px">${value}</div></div>`;

    html = `
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
          ${summaryCard('결제 상태', paid ? '완납' : '미납')}
          ${summaryCard('수강 기간', `${fmtDate(s.startDate)} ~ ${fmtDate(s.endDate)}`)}
          ${summaryCard('총 금액', formatCourseRegMoney(amounts.total), '#2563EB')}
        </div>

        <div style="border:1px solid #E5E7EB;border-radius:12px;background:#F8FAFC;padding:16px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px">
            <div>
              <b style="font-size:13px;color:#111827">수강 등록 내용</b>
              <div style="font-size:11px;color:#6B7280;margin-top:4px">등록할 때 저장된 값입니다. 수정은 수강 등록 화면에서 합니다.</div>
            </div>
            <button type="button" class="tsa-btn tsa-btn-outline tsa-btn-sm" style="white-space:nowrap" onclick="openStudentCourseRegistration(${baseStudent.id})"><i data-lucide="pencil" style="width:12px;height:12px"></i> 등록 내용 수정</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:12px">
            ${sectionCard('수강 구간', amounts.tuition, segmentRows)}
            ${sectionCard('등록금 · 기타 항목', amounts.feeTotal, feeRows)}
            <div style="border:1px solid #E5E7EB;border-radius:11px;background:#fff;padding:15px 16px">
              <b style="font-size:12.5px;color:#111827">등록 정보</b>
              <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:12px">
                ${infoCell('정산 방식', `<span class="tsa-badge" style="background:#DBEAFE;color:#1D4ED8">${getRemittanceRouteLabel(s.remittanceRoute || baseStudent.remittanceRoute)}</span>`)}
                ${infoCell('통화', '<b style="font-size:12.5px;color:#111827">USD</b>')}
                ${infoCell('등록일', `<b style="font-size:12.5px;color:#111827">${enrolledAt}</b>`)}
              </div>
              <div style="margin-top:14px">
                <div style="font-size:11px;color:#6B7280">메모</div>
                <div style="font-size:12px;color:${memo ? '#111827' : '#9CA3AF'};margin-top:6px">${memo || '남긴 메모가 없습니다.'}</div>
              </div>
            </div>
          </div>
        </div>

        <div style="font-size:11px;color:#6B7280;line-height:1.6">학생에게 청구되는 최종 금액입니다. 에이전시 커미션은 포함하지 않으며 에이전시 관리 메뉴에서 별도로 적용합니다.</div>
      </div>
    `;
  } else if (tab === 'settle') {
    const prices = calculatePrices(s);
    // 항목마다 발행 시점이 다르다 — 등록금은 등록 즉시, 수강료·기숙사비는 입학 확정 후.
    // 그래서 발행 여부는 인보이스가 아니라 항목이 갖는다. 미발행 항목만 체크해서 추가 발행한다.
    const issueSummary = getInvoiceIssueSummary(s);
    const billingBreakdown = issueSummary.breakdown;

    const crHistoryHtml = '';

    const localFeesHtml = '';

    html = `
      <div style="padding:10px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div style="border:1px solid #E9EDF4;border-radius:10px;padding:14px;background:#FAFAFA">
            <div style="font-weight:700;font-size:12.5px;color:#1E3A8A;margin-bottom:8px">${issueSummary.enrollment.sessionNumber}차 수강 · 항목별 청구 금액 · 발행 상태 · 납부 여부 · 커미션 지급 여부</div>
            <div style="display:grid;grid-template-columns:1fr;gap:8px;font-size:11.5px;margin-bottom:10px">
              ${issueSummary.rows.map(item => `
                ${renderBillingGroupHeading(issueSummary.rows, item)}
                <div style="display:grid;grid-template-columns:20px 96px 1fr 128px 76px 150px 80px;gap:10px;align-items:center;background:${item.issued || !item.billable ? '#FAFAFA' : '#fff'};border:1px solid #E5E7EB;${item.extension ? 'border-left:3px solid #5E5CE6;' : ''}border-radius:8px;padding:9px 10px${isBillingSegmentRow(issueSummary.rows, item) ? ';margin-left:14px' : ''}">
                  ${item.billable && !item.issued
                    ? `<input type="checkbox" id="inv-check-${item.key}" checked style="accent-color:#5E5CE6;width:15px;height:15px"/>`
                    : '<span style="display:inline-block;width:15px;height:15px;border:1.5px solid #E5E7EB;border-radius:4px;background:#F9FAFB"></span>'}
                  <div>
                    <div style="font-weight:800;color:#374151">${item.label}${item.extension ? ' <span style="font-size:9.5px;color:#5E5CE6;font-weight:800">연장</span>' : ''}</div>
                    <div style="font-size:10px;color:#9CA3AF">${item.sub || ''}</div>
                  </div>
                  <div style="text-align:right;font-weight:900;color:${item.billable ? '#111827' : '#9CA3AF'}">$${item.amount.toLocaleString()}</div>
                  <div style="text-align:right">${
                    !item.billable ? '<span style="font-size:10px;color:#C4C9D4;border:1px dashed #E5E7EB;border-radius:999px;padding:3px 9px">청구 없음</span>'
                    : item.issued ? `<span class="tsa-badge" style="background:#EEF2FF;color:#4338CA;border:1px solid #C7D2FE;font-size:10px" title="${item.invoice.issueDate} 발행">발행됨 · ${item.invoice.invoiceNo}</span>`
                    : '<span class="tsa-badge" style="background:#F3F4F6;color:#6B7280;border:1px solid #E5E7EB;font-size:10px">미발행</span>'}</div>
                  <div style="text-align:right">${item.billable && item.issued ? renderAgencyPaidBadge(item.paymentStatus) : '<span style="font-size:10px;color:#C4C9D4">-</span>'}</div>
                  <div style="text-align:right;color:${item.commission > 0 ? '#4F46E5' : '#9CA3AF'};font-weight:800">
                    ${item.commissionType === 'none' ? '커미션 없음' : item.commissionType === 'fixed' ? '정액' : `${Math.round(item.commissionRate * 100)}%`} · $${item.commission.toLocaleString()}
                  </div>
                  <div style="text-align:right">${item.commission > 0 ? renderAgencyCommissionBadge(item.commissionStatus) : '<span style="font-size:10px;color:#9CA3AF">-</span>'}</div>
                </div>
              `).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
              <div style="border:1px solid #E5E7EB;border-radius:9px;background:#fff;padding:9px 11px">
                <div style="font-size:10.5px;color:#6B7280;font-weight:700">발행 완료</div>
                <div style="font-size:16px;font-weight:900;margin-top:2px">$${issueSummary.issuedTotal.toLocaleString()}</div>
              </div>
              <div style="border:1px solid #C7D2FE;border-radius:9px;background:#F8F9FF;padding:9px 11px">
                <div style="font-size:10.5px;color:#6B7280;font-weight:700">미발행${issueSummary.issuable.length ? ' (이번 발행 대상)' : ''}</div>
                <div style="font-size:16px;font-weight:900;margin-top:2px;color:#4338CA">$${issueSummary.unissuedTotal.toLocaleString()}</div>
              </div>
              <div style="border:1px solid #E5E7EB;border-radius:9px;background:#fff;padding:9px 11px">
                <div style="font-size:10.5px;color:#6B7280;font-weight:700">${issueSummary.enrollment.sessionNumber}차 청구 합계</div>
                <div style="font-size:16px;font-weight:900;margin-top:2px">$${issueSummary.grossTotal.toLocaleString()}</div>
              </div>
            </div>
            ${issueSummary.enrollments.length > 1 ? `
            <div style="border:1px solid #C7D2FE;border-radius:9px;background:#F8F9FF;padding:10px 12px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
              <span style="font-size:11.5px;font-weight:800;color:#4338CA">학생 전체 $${issueSummary.studentTotal.toLocaleString()}</span>
              <span style="font-size:10.5px;color:#6B7280">${issueSummary.enrollments.map(item => `${item.enrollment.sessionNumber}차 $${item.gross.toLocaleString()}${item.unissuedTotal ? ' (일부 미발행)' : ''}`).join(' · ')}</span>
            </div>` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11.5px">
              <div style="border-top:1px solid #E5E7EB;grid-column:span 2;padding-top:6px;font-size:12px;color:#1E1B4B"><strong>어학원 송금액 합계:</strong> <strong style="float:right">$${billingBreakdown.net.toLocaleString()}</strong></div>
              <div style="color:#4F46E5">커미션 합계:</div><div style="text-align:right;color:#4F46E5">$${billingBreakdown.commission.toLocaleString()}</div>
            </div>
            <div style="font-size:10.5px;color:#6B7280;margin-top:10px;background:#EFF6FF;padding:8px;border-radius:6px">
              ※ 커미션은 에이전시 관리에서 등록금·수강료·기숙사비·기타 비용별로 설정한 기준을 적용합니다.
            </div>
            ${renderInvoiceActionPanel(s)}
          </div>

          <div style="border-left:1px solid #CBD5E1;padding:0 0 0 18px;min-width:0">
            ${renderInvoiceDocumentPanel(s)}
          </div>

          <div style="grid-column:span 2">
            ${renderInvoiceHistoryPanel(s)}
          </div>
          ${localFeesHtml}

          <!-- 납부 등록 섹션 (어드민은 미표시, 에이전시만 노출) -->
          ${isAgency ? `
          <div style="border:1px solid #C7D2FE;border-radius:10px;padding:16px;background:#F8F9FF;grid-column:span 2;margin-top:4px">
            <div style="font-weight:700;font-size:12.5px;color:#3730A3;margin-bottom:12px">💸 납부 등록</div>
            <div class="tsa-form-group" style="margin:0 0 10px;max-width:220px">
              <label class="tsa-label" style="font-size:11px">학생 정산 방식 <span style="color:#EF4444">*</span></label>
              <select id="remit-route" class="tsa-input" style="font-size:12px" onchange="updateStudentRemittanceRoute(${s.id}, this.value, '납부 등록')">
                ${renderRemittanceRouteOptions(s.remittanceRoute || 'agency')}
              </select>
            </div>
            <div style="margin-bottom:10px">
              <label class="tsa-label" style="font-size:11px;margin-bottom:6px;display:block">결제 항목 <span style="color:#EF4444">*</span> <span style="font-weight:400;color:#9CA3AF">(여러 항목 동시 결제 가능)</span></label>
              <div id="remit-item-checklist" style="display:flex;flex-direction:column;gap:6px"></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:10px">
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">송금 일자</label>
                <input id="remit-receipt-date" type="date" class="tsa-input" style="font-size:12px"/>
              </div>
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">송금 은행명</label>
                <input id="remit-receipt-bank" type="text" class="tsa-input" placeholder="예: 국민은행" style="font-size:12px"/>
              </div>
              <div class="tsa-form-group" style="margin:0">
                <label class="tsa-label" style="font-size:11px">송금 금액 (USD)</label>
                <input id="remit-receipt-amount" type="number" class="tsa-input" placeholder="예: 1066" style="font-size:12px"/>
                <div id="remit-amount-hint" style="font-size:9.5px;color:#9CA3AF;margin-top:3px"></div>
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
                <i data-lucide="send"></i> 등록하기
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
        <div style="border:1px solid #E5E7EB;border-radius:12px;padding:14px;background:#fff">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <div style="font-size:13px;font-weight:800;color:#111827">기숙사 신청 정보</div>
            <span class="tsa-badge" style="background:#EEF2FF;color:#4F46E5">희망 조건</span>
          </div>
          <div style="display:grid;grid-template-columns:32px minmax(0,1fr) 150px 110px;gap:10px;align-items:center;padding:10px 12px">
            <div style="width:26px;height:26px;border-radius:50%;background:#EEF2FF;color:#4338CA;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900">1</div>
            <div>
              <div style="font-size:12.5px;font-weight:800;color:#111827">${s.dormAccomType || '미선택'} · ${s.dormType ? `${s.dormType}${String(s.dormType).includes('인실') ? '' : '인실'}` : '미선택'}${s.dormGrade ? ` · ${s.dormGrade}` : ''}</div>
              <div style="font-size:10.5px;color:#6B7280;margin-top:3px">입실 ${fmtDate(s.dormIn || s.startDate) || '-'} ~ 퇴실 ${fmtDate(s.dormOut || s.departureDate) || '-'}</div>
            </div>
            <div style="text-align:right;font-size:12px;font-weight:900;color:#111827">${s.dormAmount ? formatCourseRegMoney(s.dormAmount) : '금액 확인 중'}</div>
            <div style="display:flex;justify-content:flex-end">
              ${isLocked ? '' : `<button type="button" class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openDormRequestEditModal(${s.id})">수정</button>`}
            </div>
          </div>
          ${isLocked ? `<div style="font-size:10px;color:#9CA3AF;padding:0 12px 4px">※ 신청 정보이며 실제 호실·침대 배정 정보와 다를 수 있습니다.</div>` : ''}
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
  } else if (tab === 'admdocs') {
    html = `
      <div style="padding:8px 0">
        <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:4px">입학서류관리</div>
        <div style="font-size:11px;color:#6B7280;margin-bottom:12px">입학 허가서·초청장·공항 픽업 확인서를 확인하고 인쇄합니다. 공식 송금 인보이스는 정산 탭에서 확인합니다.</div>
        <div style="display:flex;gap:4px;border-bottom:1px solid #E5E7EB;margin-bottom:12px;overflow-x:auto" id="agency-inline-doc-tabs">
          <button type="button" data-inline-doc-tab="loa" onclick="renderAgencyInlineDocument(${s.id}, 'loa')" style="border:0;background:none;padding:8px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer">입학 허가서 (LOA)</button>
          <button type="button" data-inline-doc-tab="invitation" onclick="renderAgencyInlineDocument(${s.id}, 'invitation')" style="border:0;background:none;padding:8px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer">초청장 (Invitation)</button>
          <button type="button" data-inline-doc-tab="pickup" onclick="renderAgencyInlineDocument(${s.id}, 'pickup')" style="border:0;background:none;padding:8px 10px;font-size:10px;font-weight:800;white-space:nowrap;cursor:pointer">공항 픽업 확인서</button>
        </div>
        <div style="height:560px;overflow:auto;border:1px solid #E9EDF4;border-radius:10px;background:#FAFAFA">
          <div id="agency-inline-doc-content" style="zoom:.68;padding:20px;min-height:700px;position:relative;overflow:hidden"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm" type="button" onclick="openAgencyDocumentsInline(${s.id}, APP.selectedInvoiceTab && APP.selectedInvoiceTab !== 'invoice' ? APP.selectedInvoiceTab : 'loa')">크게 보기</button>
          <button class="tsa-btn tsa-btn-primary tsa-btn-sm" type="button" onclick="printAgencyInlineDocument()"><i data-lucide="printer"></i> 인쇄하기 (Print)</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;
  if (tab === 'basic') {
    setTimeout(updateAdAgencyPreview, 0);
  }
  if (tab === 'settle') {
    setTimeout(() => renderAgencyInlineDocument(s.id, 'invoice'), 0);
    setTimeout(() => { if (typeof renderRemitItemChecklist === 'function') renderRemitItemChecklist(s.id); }, 0);
  }
  if (tab === 'admdocs') {
    setTimeout(() => renderAgencyInlineDocument(s.id, 'loa'), 0);
  }
}

function updateAdAgencyPreview() {
  const sel = document.getElementById('ad-agency');
  const preview = document.getElementById('ad-agency-preview');
  if (!sel || !preview) return;
  const agencyName = sel.value;
  if (agencyName === '직접 등록') {
    preview.innerHTML = `<div style="font-size:12px;color:#6B7280">직접 등록 (에이전시 미경유)</div>`;
    return;
  }
  const agencyInfo = (typeof MOCK_AGENCIES !== 'undefined') ? MOCK_AGENCIES.find(a => a.name === agencyName) : null;
  preview.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px">
      <div><div style="font-size:10px;color:#6B7280;margin-bottom:3px">에이전시명</div><div style="font-weight:700;color:#111827">${agencyName}</div></div>
      <div><div style="font-size:10px;color:#6B7280;margin-bottom:3px">담당자</div><div style="font-weight:600;color:#374151">${agencyInfo?.contact || '-'}</div></div>
      <div><div style="font-size:10px;color:#6B7280;margin-bottom:3px">연락처</div><div style="font-weight:600;color:#374151">${agencyInfo?.phone || '-'}</div></div>
      ${agencyInfo?.email ? `<div style="grid-column:span 3"><div style="font-size:10px;color:#6B7280;margin-bottom:3px">이메일</div><div style="font-weight:600;color:#374151">${agencyInfo.email}</div></div>` : ''}
    </div>
  `;
}

// 결제 항목(등록금/수강료/기숙사비/기타)별로 지금까지 승인된 납부 합계
function getBillingItemPaidAmount(s, itemKey) {
  return (s.remittanceHistory || [])
    .filter(r => r.item === itemKey && r.status !== 'rejected')
    .reduce((sum, r) => sum + Number(r.appliedAmount ?? r.amount ?? 0), 0);
}

// 결제 항목 체크리스트 — 항목별 청구/기납부/남은 금액과 개별 적용 금액 입력을 렌더링
function renderRemitItemChecklist(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  const listEl = document.getElementById('remit-item-checklist');
  if (!s || !listEl) return;

  // 납부도 청구와 같은 단위여야 한다 — 선택한 차수의 항목(구간 포함)을 그대로 쓴다.
  const rows = getInvoiceIssueSummary(s).rows;
  listEl.innerHTML = rows.map(item => {
    const paid = getBillingItemPaidAmount(s, item.key);
    const remaining = Math.max(0, item.amount - paid);
    const disabled = remaining <= 0;
    return `
      <div style="display:grid;grid-template-columns:20px 100px 90px 90px 90px 120px;gap:10px;align-items:center;padding:8px 10px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;${disabled ? 'opacity:.55' : ''}">
        <input type="checkbox" id="remit-check-${item.key}" ${disabled ? 'disabled' : ''} onchange="onRemitItemCheckChange('${item.key}')" style="accent-color:#5E5CE6;width:15px;height:15px"/>
        <div style="font-weight:800;color:#374151;font-size:12px">${item.label}</div>
        <div style="text-align:right"><div style="font-size:8.5px;color:#9CA3AF">청구</div><div style="font-size:11.5px;font-weight:800;color:#111827">$${item.amount.toLocaleString()}</div></div>
        <div style="text-align:right"><div style="font-size:8.5px;color:#9CA3AF">기납부</div><div style="font-size:11.5px;font-weight:800;color:#059669">$${paid.toLocaleString()}</div></div>
        <div style="text-align:right"><div style="font-size:8.5px;color:#9CA3AF">남은</div><div style="font-size:11.5px;font-weight:800;color:${remaining > 0 ? '#DC2626' : '#059669'}">$${remaining.toLocaleString()}</div></div>
        <input type="number" id="remit-applied-${item.key}" min="0" max="${remaining}" value="${remaining || ''}" placeholder="적용 금액" class="tsa-input" style="font-size:11px;padding:5px 8px" disabled onchange="recomputeRemitTotalAmount()"/>
      </div>
    `;
  }).join('');
  recomputeRemitTotalAmount();
}

function onRemitItemCheckChange(itemKey) {
  const checked = document.getElementById(`remit-check-${itemKey}`)?.checked;
  const appliedEl = document.getElementById(`remit-applied-${itemKey}`);
  if (appliedEl) appliedEl.disabled = !checked;
  recomputeRemitTotalAmount();
}

// 체크된 항목들의 적용 금액 합계를 송금 금액(USD) 칸에 자동 반영
function recomputeRemitTotalAmount() {
  // 항목이 구간마다 생겨 개수가 고정이 아니다 — 그려진 체크박스를 그대로 훑는다.
  let total = 0;
  document.querySelectorAll('#remit-item-checklist input[id^="remit-check-"]').forEach(box => {
    if (!box.checked) return;
    const key = box.id.replace('remit-check-', '');
    total += parseFloat(document.getElementById(`remit-applied-${key}`)?.value || 0);
  });
  const amountEl = document.getElementById('remit-receipt-amount');
  if (amountEl) amountEl.value = total || '';
  const hintEl = document.getElementById('remit-amount-hint');
  if (hintEl) hintEl.textContent = total ? `(선택 항목 적용 금액 합계: $${total.toLocaleString()})` : '';
}

function submitRemittanceReceipt(studentId, editIdx) {
  const remitDate = document.getElementById('remit-receipt-date')?.value;
  const amount = parseFloat(document.getElementById('remit-receipt-amount')?.value || 0);
  const bank = document.getElementById('remit-receipt-bank')?.value?.trim();
  const memo = document.getElementById('remit-receipt-memo')?.value?.trim() || '';
  const fileInput = document.getElementById('remit-receipt-file');
  const fileName = fileInput?.files?.[0]?.name || null;
  const route = document.getElementById('remit-route')?.value || '';

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
    const breakdownKeys = ['registration', 'education', 'dorm', 'local'];
    const checkedItems = breakdownKeys
      .filter(key => document.getElementById(`remit-check-${key}`)?.checked)
      .map(key => ({ key, appliedAmount: parseFloat(document.getElementById(`remit-applied-${key}`)?.value || 0) }))
      .filter(entry => entry.appliedAmount > 0);

    if (!checkedItems.length) { showToast('결제할 항목을 하나 이상 선택하고 적용 금액을 입력해 주세요.', 'warning'); return; }

    // 납부 상태는 차수에 기록한다. 학생에 하나만 두면 새 코스를 등록하는 순간
    // 이전 차수의 완납이 통째로 지워진다 — 받은 돈이 화면에서 사라지는 원인이었다.
    const summary = getInvoiceIssueSummary(s);
    const billedRows = summary.rows;
    const enrollment = getBillingEnrollmentRecord(s, summary.enrollment.id);
    if (!enrollment.billingItemStatuses) enrollment.billingItemStatuses = {};

    checkedItems.forEach(({ key, appliedAmount }) => {
      s.remittanceHistory.unshift({
        submittedAt: new Date().toISOString().slice(0, 10),
        remitDate,
        amount: appliedAmount,
        bank,
        memo,
        fileName,
        route,
        item: key,
        appliedAmount,
        status: 'approved'
      });

      // 이 결제 항목의 잔액이 0이 되면 해당 항목만 완납 처리 (전체 학생을 일괄 완납 처리하지 않음)
      const billedItem = billedRows.find(i => i.key === key);
      const paidForItem = getBillingItemPaidAmount(s, key);
      enrollment.billingItemStatuses[key] = billedItem && paidForItem >= billedItem.amount ? 'paid' : 'unpaid';
    });

    // 학생 전체가 완납인지는 모든 차수를 합쳐서 본다.
    const allItemsPaid = getBillingEnrollments(s)
      .flatMap(item => getEnrollmentBillingRows(s, item))
      .every(row => row.amount <= 0 || row.paymentStatus === 'paid');
    s.remittanceStatus = allItemsPaid ? 'paid' : 'unpaid';

    const itemLabels = checkedItems.map(({ key }) => billedRows.find(i => i.key === key)?.label || key).join(', ');
    showToast(`✅ ${itemLabels} 납부 $${amount.toLocaleString()}이(가) 등록되었습니다.`, 'success');
  }

  if (document.getElementById('adetail-page-enrollment-content')) {
    switchAgencyEnrollmentHubTab('settle');
  } else {
    switchAdetailTab('settle');
  }
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
    const labels = { no_course: '미수강', waiting: '입학 대기', current: '재학', completed: '졸업', resigned: '퇴원', extended: '연장' };
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
        <option value="Regular">Regular</option>
        <option value="Regular +">Regular +</option>
        <option value="Intensive">Intensive</option>
        <option value="Power Speaking 6">Power Speaking 6</option>
        <option value="Power Speaking 8">Power Speaking 8</option>
        <option value="6Hrs Regular">6Hrs Regular</option>
        <option value="6Hrs Intensive">6Hrs Intensive</option>
        <option value="6Hrs Power Speaking">6Hrs Power Speaking</option>
        <option value="IELTS Intensive">IELTS Intensive</option>
        <option value="Special English(TOEIC, Business)">Special English(TOEIC, Business)</option>
        <option value="Junior ESL">Junior ESL</option>
        <option value="Junior Camp">Junior Camp</option>
        <option value="가디언 코스">가디언 코스</option>
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

  const passwordResult = readStudentPasswordFields('ad');
  if (!passwordResult.ok) { showToast(passwordResult.message, 'danger'); return; }

  const isActive = s.remittanceStatus === 'paid';
  const prevValues = { name: s.name, nick: s.nick, phone: s.phone, emergencyContact: s.emergencyContact };

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

    const agencyEl = document.getElementById('ad-agency');
    if (agencyEl) s.agency = agencyEl.value;

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
  // 이메일은 로그인 계정으로 쓰여서 여기서는 읽기전용이고 저장 대상에서 제외한다.
  s.emergencyContact = getVal('ad-emergency', s.emergencyContact);
  if (passwordResult.password) s.password = passwordResult.password;
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
  const fieldLabels = { name: '영문 성명', nick: '닉네임', phone: '연락처', emergencyContact: '비상 연락처' };
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
  APP._invoiceDocStudentId = id;

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
  APP._invoiceDocStudentId = id;
  return s;
}

// LOA·초청장처럼 여권번호 원문이 들어가는 서류를 인쇄할 때 호출한다.
// 화면 미리보기는 항상 마스킹 상태를 유지하고, 인쇄 시점에만 원문을 노출하면서
// 누가 언제 열람했는지 학생의 여권번호 조회 기록에 남긴다.
function logPassportDocumentPrint(studentId, docLabel) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;
  if (!Array.isArray(s.passportAccessLogs)) s.passportAccessLogs = [];
  s.passportAccessLogs.unshift({
    id: Date.now(),
    identifier: `${stayCurrentActor()} (${APP?.user || 'admin'})`,
    accessedAt: stayNowStamp(),
    ipAddress: '192.168.10.24',
    task: `${docLabel} 인쇄 - 여권번호 원문 노출`
  });
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
  const tab = APP.selectedInvoiceTab;
  const studentId = APP._invoiceDocStudentId;
  const needsReveal = (tab === 'loa' || tab === 'invitation') && studentId != null;
  let printHtml = content.innerHTML;
  if (needsReveal) {
    APP._invoiceRevealPassport = true;
    switchInvoiceTab(tab);
    const revealedSource = document.getElementById('invoice-modal-content');
    if (revealedSource) {
      printHtml = revealedSource.innerHTML;
      content.innerHTML = revealedSource.innerHTML;
    }
    APP._invoiceRevealPassport = false;
    switchInvoiceTab(tab);
    const maskedSource = document.getElementById('invoice-modal-content');
    if (maskedSource) content.innerHTML = maskedSource.innerHTML;
    logPassportDocumentPrint(studentId, tab === 'loa' ? '입학 허가서(LOA)' : '초청장(Invitation)');
  }
  const printWindow = window.open('', '_blank', 'width=960,height=900');
  if (!printWindow) {
    showToast('인쇄 창을 열 수 없어. 브라우저 팝업 허용을 확인해줘.', 'warning');
    return;
  }
  printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>TalkStation Academy Document</title><style>body{margin:0;padding:24px;font-family:Pretendard,Arial,sans-serif;color:#111827;background:#fff}*{box-sizing:border-box}@media print{body{padding:0}}</style></head><body>${printHtml}</body></html>`);
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

// 픽업 배정의 단위는 '배차 그룹' 하나뿐이다 — 어떤 학생들을, 누가, 어떤 차로, 몇 시에.
// 예전에 있던 '그날 나갈 담당자만 찍어두는' PICKUP_DATE_ASSIGNMENTS 는 쓰는 화면이 없어 걷어냈다.
const PICKUP_DISPATCH_GROUPS = {};
let pickupSelectedStudentIds = [];

function getPickupDispatchGroups(dateKey) {
  return PICKUP_DISPATCH_GROUPS[dateKey] || [];
}

// 공항 픽업 확인서에 찍을 담당자. 그 학생이 실제로 탄 배차 그룹의 담당자가 곧 답이다.
function getPickupManagersForStudent(student) {
  if (!student) return [];
  const dateKey = student.arrivalDate || student.startDate;
  const managers = getPickupDispatchGroups(dateKey)
    .filter(group => group.studentIds.includes(student.id) && group.managerId)
    .map(group => MOCK_PICKUP_MANAGERS.find(manager => manager.id === Number(group.managerId)))
    .filter(Boolean);
  return [...new Map(managers.map(manager => [manager.id, manager])).values()];
}

// 픽업 화면의 '오늘'은 실제 운영 화면과 같이 시스템 날짜를 쓴다.
const PICKUP_TODAY = toPickupDateKey(new Date());
function getPickupToday() { return new Date(PICKUP_TODAY + 'T00:00:00'); }

// 픽업은 화면 두 개다 — 픽업 담당자 관리와 픽업 배정 현황.
// 픽업 차량은 담당자 화면의 [차량 관리] 버튼으로 여는 별도 창이다.
// 운영 중인 실제 화면과 같은 구성이라, 프로토타입과 제품이 같은 그림을 보여준다.

function initPickupManagerView() {
  renderPickupManagerTable();
}

// 픽업 배정 현황 — 처음에는 날짜를 고르지 않은 상태로 연다.
function initPickupAssignView() {
  if (!APP.pickupCalendarMonth) {
    const today = getPickupToday();
    APP.pickupCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  }
  APP.pickupAssignTab = APP.pickupAssignTab || 'pending';
  renderPickupCalendar();
}

// 픽업 차량 창. 실제 화면은 별도 브라우저 창이지만, 프로토타입은 같은 구성의 창으로 띄운다.
function openPickupVehicleWindow() {
  resetPickupVehicleForm();
  renderPickupVehicleTable();
  openModal('pickup-vehicle-window');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 30);
}

function resetPickupVehicleForm() {
  const title = document.getElementById('pickup-vehicle-form-title');
  if (title) title.textContent = '차량 등록';
  const cancel = document.getElementById('pickup-vehicle-cancel');
  if (cancel) cancel.style.display = 'none';
  ['pickup-vehicle-id', 'pickup-vehicle-model', 'pickup-vehicle-plate', 'pickup-vehicle-memo'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.value = '';
  });
  const capacity = document.getElementById('pickup-vehicle-capacity');
  if (capacity) capacity.value = '0';
}

// 그 담당자가 물고 있는 배차. 지울 수 있는 사람인지 판단하는 값이자, 목록에 그대로 보여주는 값이다.
function getPickupManagerDispatchStats(managerId) {
  const todayKey = PICKUP_TODAY;
  const stats = { total: 0, upcoming: 0, nextDate: '' };
  Object.entries(PICKUP_DISPATCH_GROUPS).forEach(([dateKey, groups]) => {
    groups.filter(group => Number(group.managerId) === Number(managerId)).forEach(() => {
      stats.total += 1;
      if (dateKey >= todayKey) {
        stats.upcoming += 1;
        if (!stats.nextDate || dateKey < stats.nextDate) stats.nextDate = dateKey;
      }
    });
  });
  return stats;
}

function renderPickupManagerTable() {
  const body = document.getElementById('pickup-manager-tbody');
  const countEl = document.getElementById('pickup-manager-count');
  if (countEl) countEl.textContent = `${MOCK_PICKUP_MANAGERS.length}명`;
  const chip = document.getElementById('pickup-vehicle-count-chip');
  if (chip) chip.textContent = `${MOCK_PICKUP_VEHICLES.length}대`;
  if (!body) return;

  body.innerHTML = MOCK_PICKUP_MANAGERS.length ? MOCK_PICKUP_MANAGERS.map(manager => `<tr>
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <img src="${manager.photo || 'assets/images/teacher_male.png'}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;flex-shrink:0" alt=""/>
        <b style="font-size:12.5px;color:#111827">${manager.name}</b>
      </div>
    </td>
    <td style="color:#374151">${manager.gender === '여' ? '여성' : manager.gender === '남' ? '남성' : '-'}</td>
    <td style="color:#374151">${manager.age ? `${manager.age}세` : '-'}</td>
    <td style="color:#374151;font-variant-numeric:tabular-nums">${manager.phone || '<span style="color:#DC2626">미등록</span>'}</td>
    <td style="color:#374151">${manager.messenger || '-'}</td>
    <td style="text-align:right;white-space:nowrap">
      <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openPickupManagerModal(${manager.id})">수정</button>
      <button class="tsa-btn tsa-btn-xs" style="margin-left:5px;background:#EF4444;border-color:#EF4444;color:#fff" onclick="removePickupManager(${manager.id})">삭제</button>
    </td>
  </tr>`).join('') : '<tr><td colspan="6" style="padding:30px;text-align:center;color:#9CA3AF;font-size:11.5px">등록된 픽업 담당자가 없습니다. 오른쪽 위 [담당자 등록]으로 추가하세요.</td></tr>';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function removePickupManager(managerId) {
  const manager = MOCK_PICKUP_MANAGERS.find(item => item.id === Number(managerId));
  if (!manager) return;
  if (getPickupManagerDispatchStats(managerId).total) {
    showToast('배차에 물려 있는 담당자는 삭제할 수 없어. 확인서 노출만 끄거나 배차를 먼저 옮겨줘.', 'warning');
    return;
  }
  if (!confirm(`${manager.name} 담당자를 삭제할까요? 되돌릴 수 없습니다.`)) return;
  MOCK_PICKUP_MANAGERS.splice(MOCK_PICKUP_MANAGERS.findIndex(item => item.id === Number(managerId)), 1);
  renderPickupManagerTable();
  showToast('픽업 담당자가 삭제되었습니다.', 'success');
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
    `<div style="padding:11px;text-align:center;font-size:11.5px;font-weight:700;color:${index === 0 ? '#EF4444' : index === 6 ? '#3B82F6' : '#374151'}">${day}</div>`
  ).join('');

  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const previousMonthDays = new Date(year, monthIndex, 0).getDate();
  const students = getPickupStudents();
  const todayKey = PICKUP_TODAY;
  const cells = [];
  for (let cell = 0; cell < 42; cell += 1) {
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
    const pickupArrivals = arrivals.filter(isPickupRequired);
    const unassigned = pickupArrivals.filter(student => !assignedStudentIds.has(student.id)).length;
    const pendingDispatches = groups.filter(group => group.status !== 'dispatched').length;
    const selected = APP.pickupSelectedDate === key;
    const isToday = todayKey === key;
    const warn = unassigned || pendingDispatches;
    const row = (label, value, color) =>
      `<div style="display:flex;justify-content:space-between;gap:6px;white-space:nowrap"><span>${label}</span><span style="font-weight:800;color:${color}">${value}</span></div>`;
    cells.push(`
      <button type="button" onclick="selectPickupCalendarDate('${key}')" style="appearance:none;text-align:left;min-height:96px;padding:9px;border:0;border-right:1px solid #F1F3F7;border-bottom:1px solid #F1F3F7;background:${selected ? '#EEF2FF' : '#fff'};cursor:pointer;opacity:${muted ? '.45' : '1'};box-shadow:${selected ? 'inset 0 0 0 2px #6366F1' : 'none'}">
        <span style="display:inline-flex;min-width:22px;height:22px;padding:0 6px;align-items:center;justify-content:center;border-radius:999px;font-size:12px;font-weight:700;background:${isToday ? '#2563EB' : 'transparent'};color:${isToday ? '#fff' : '#111827'}">${cellDate.getDate()}</span>
        ${arrivals.length ? `<div style="margin-top:6px;padding:6px 7px;border-radius:6px;background:${warn ? '#FEF9C3' : '#ECFDF5'};font-size:9.5px;color:#6B7280;line-height:1.6">
          ${row('입국', `${arrivals.length}명`, '#111827')}
          ${row('픽업 대기', `${unassigned}명`, unassigned ? '#C2410C' : '#047857')}
          ${row('편성 완료', `${pickupArrivals.length - unassigned}명`, '#047857')}
        </div>` : ''}
      </button>`);
  }
  grid.innerHTML = cells.join('');
  renderPickupDateAssignments();
  if (typeof refreshIcons === 'function') refreshIcons();
}

// 오른쪽 패널은 실제 화면과 같이 「배정」과 「완료」 두 탭이다.
// 날짜를 고르기 전에는 아무것도 세우지 않고 안내 문구만 둔다.
function setPickupAssignTab(tab) {
  APP.pickupAssignTab = tab === 'done' ? 'done' : 'pending';
  renderPickupDateAssignments();
}

function renderPickupDateAssignments() {
  const panel = document.getElementById('pickup-date-assignment-panel');
  if (!panel) return;
  const selectedDate = APP.pickupSelectedDate;
  const activeTab = APP.pickupAssignTab === 'done' ? 'done' : 'pending';
  const tabButton = (key, label) => {
    const on = activeTab === key;
    return `<button type="button" onclick="setPickupAssignTab('${key}')" style="flex:0 0 auto;padding:12px 16px;border:0;background:none;font-size:12.5px;font-weight:${on ? '800' : '600'};color:${on ? '#2563EB' : '#6B7280'};border-bottom:2px solid ${on ? '#2563EB' : 'transparent'};cursor:pointer">${label}</button>`;
  };
  const header = `<div style="display:flex;border-bottom:1px solid #E5E7EB;padding:0 8px">${tabButton('pending', '배정')}${tabButton('done', '완료')}</div>`;

  if (!selectedDate) {
    panel.innerHTML = header + `<div style="padding:150px 20px;text-align:center;color:#9CA3AF">
      <i data-lucide="calendar-days" style="width:30px;height:30px;margin-bottom:12px"></i>
      <div style="font-size:12.5px">달력에서 날짜를 선택해 주세요.</div>
    </div>`;
    if (typeof refreshIcons === 'function') refreshIcons();
    renderPickupManagerTimetable();
    return;
  }

  const students = getPickupStudents().filter(student => (student.arrivalDate || student.startDate) === selectedDate);
  const groups = getPickupDispatchGroups(selectedDate);
  const assignedIds = new Set(groups.flatMap(group => group.studentIds));
  const pickupStudents = students.filter(isPickupRequired);
  const noPickupStudents = students.filter(student => !isPickupRequired(student));
  pickupSelectedStudentIds = pickupSelectedStudentIds.filter(id => pickupStudents.some(student => student.id === id) && !assignedIds.has(id));
  const unassigned = pickupStudents.filter(student => !assignedIds.has(student.id));
  const doneGroups = groups.filter(group => group.status === 'dispatched');
  const pendingGroups = groups.filter(group => group.status !== 'dispatched');
  const dateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  const dateBar = `<div style="padding:13px 16px;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;justify-content:space-between;gap:10px">
    <b style="font-size:13px;color:#111827">${dateLabel}</b>
    <span style="font-size:10.5px;color:#6B7280">입국 ${students.length}명 · 픽업 ${pickupStudents.length}명</span>
  </div>`;

  let body;
  if (activeTab === 'done') {
    body = doneGroups.length
      ? `<div style="padding:14px 16px;display:grid;gap:8px">${doneGroups.map((group, index) => renderPickupDispatchSummary(selectedDate, group, index)).join('')}</div>`
      : '<div style="padding:70px 20px;text-align:center;font-size:11.5px;color:#9CA3AF">아직 배차를 마친 건이 없습니다.</div>';
  } else if (!students.length) {
    body = '<div style="padding:70px 20px;text-align:center;font-size:11.5px;color:#9CA3AF">이 날짜에 입국 예정인 학생이 없습니다.</div>';
  } else {
    const allSelected = unassigned.length > 0 && unassigned.every(student => pickupSelectedStudentIds.includes(student.id));
    const selectedCount = pickupSelectedStudentIds.length;
    body = `<div style="padding:13px 16px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:9px">
        <div style="display:flex;align-items:center;gap:6px">
          <b style="font-size:11.5px;color:#374151">픽업 인원 선택</b>
          <span class="tsa-badge" style="background:${unassigned.length ? '#FEF9C3' : '#ECFDF5'};color:${unassigned.length ? '#C2410C' : '#047857'}">대기 ${unassigned.length}명</span>
        </div>
        ${unassigned.length ? `<label style="display:flex;align-items:center;gap:5px;font-size:10.5px;color:#6B7280;cursor:pointer"><input type="checkbox" ${allSelected ? 'checked' : ''} onchange="toggleAllPickupPassengers(this.checked)"/> 전체 선택</label>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;max-height:320px;overflow:auto">${unassigned.length
        ? unassigned.map(student => renderPickupPassengerOption(student)).join('')
        : '<div style="padding:16px;text-align:center;font-size:10.5px;color:#9CA3AF;border:1px dashed #D1D5DB;border-radius:9px">픽업이 필요한 학생이 모두 편성되었습니다.</div>'}</div>
      ${unassigned.length ? `<div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center;gap:8px;padding:9px 11px;border-radius:9px;border:1px solid ${selectedCount ? '#C7D2FE' : '#E5E7EB'};background:${selectedCount ? '#EEF2FF' : '#fff'}">
        <span style="font-size:10.5px;font-weight:700;color:${selectedCount ? '#4338CA' : '#9CA3AF'}">${selectedCount ? `${selectedCount}명 선택됨` : '배차할 학생을 먼저 선택하세요'}</span>
        <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="openPickupDispatchModal('${selectedDate}')" ${selectedCount ? '' : 'disabled'}><i data-lucide="car-front"></i> 선택 인원 배차</button>
      </div>` : ''}
      ${pendingGroups.length ? `<div style="margin-top:14px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px"><b style="font-size:11.5px;color:#374151">배차 정보 미완</b><span class="tsa-badge tsa-badge-warning">${pendingGroups.length}건</span></div>
        <div style="display:grid;gap:7px">${pendingGroups.map((group, index) => renderPickupDispatchSummary(selectedDate, group, index)).join('')}</div>
      </div>` : ''}
      ${noPickupStudents.length ? `<div style="margin-top:14px;padding-top:11px;border-top:1px dashed #D1D5DB">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px">
          <b style="font-size:11px;color:#6B7280">픽업 불필요</b>
          <span class="tsa-badge" style="background:#F3F4F6;color:#6B7280">옵션 미선택 ${noPickupStudents.length}명</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">${noPickupStudents.map(student => renderPickupPassengerOption(student, false)).join('')}</div>
      </div>` : ''}
    </div>`;
  }

  panel.innerHTML = header + dateBar + body;
  if (typeof refreshIcons === 'function') refreshIcons();
  renderPickupManagerTimetable();
}

// 대기 인원을 한 번에 담는다. 이미 배차된 학생과 픽업 불필요 학생은 애초에 목록에 없다.
function toggleAllPickupPassengers(checked) {
  const dateKey = APP.pickupSelectedDate;
  const assignedIds = new Set(getPickupDispatchGroups(dateKey).flatMap(group => group.studentIds));
  const selectable = getPickupStudents()
    .filter(student => (student.arrivalDate || student.startDate) === dateKey && isPickupRequired(student) && !assignedIds.has(student.id))
    .map(student => student.id);
  pickupSelectedStudentIds = checked ? selectable : [];
  renderPickupDateAssignments();
}

// 배차 그룹 자체에는 시간이 저장돼 있지 않다. 그룹에 속한 학생들의 flightTime(+PICKUP_SLOT_MINUTES)을 모아
// 최소 시작~최대 종료 구간을 그 배차 건의 점유 시간으로 계산한다.

function openPickupTimetableModal(managerId) {
  APP.pickupTimetableManagerId = managerId != null ? Number(managerId) : null;
  if (!APP.pickupSelectedDate) APP.pickupSelectedDate = PICKUP_TODAY;
  if (!APP.pickupCalendarMonth) {
    const base = getPickupToday();
    APP.pickupCalendarMonth = new Date(base.getFullYear(), base.getMonth(), 1);
  }
  const dateInput = document.getElementById('pickup-timetable-date');
  if (dateInput) dateInput.value = APP.pickupSelectedDate;
  renderPickupManagerTimetable(APP.pickupTimetableManagerId);
  openModal('pickup-timetable-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function changePickupTimetableDate(dateKey) {
  if (!dateKey) return;
  APP.pickupSelectedDate = dateKey;
  const selected = new Date(`${dateKey}T00:00:00`);
  // 담당자 관리 화면에서 배차표만 열어본 경우엔 달력이 아직 없다.
  if (!APP.pickupCalendarMonth
    || selected.getFullYear() !== APP.pickupCalendarMonth.getFullYear()
    || selected.getMonth() !== APP.pickupCalendarMonth.getMonth()) {
    APP.pickupCalendarMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
  }
  renderPickupCalendar();
  renderPickupManagerTimetable(APP.pickupTimetableManagerId);
}

// 배차표는 「그 시간에 누가 비어 있나」와 「누가 겹쳤나」를 보러 오는 표다.
// 예전 rowspan 표는 시작 슬롯이 같은 배차를 통째로 버려서, 정작 봐야 할 겹침이 안 보였다.
// 이제 담당자 칸 안에서 겹치는 배차를 레인으로 나눠 나란히 세우고, 그 묶음을 노랗게 표시한다.
const PICKUP_TIMETABLE_PX_PER_MIN = 1.15;   // 10분 ≈ 11.5px
const PICKUP_TIMETABLE_PAD_MIN = 30;        // 표 위아래 여유
const PICKUP_TIMETABLE_HEAD_PX = 44;

function formatPickupMinutes(min) {
  const norm = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, '0')}:${String(norm % 60).padStart(2, '0')}`;
}

// 겹치는 배차끼리 한 묶음으로 보고 레인 번호를 매긴다. lanes 는 그 묶음이 필요로 하는 칸 수다.
function assignPickupTimetableLanes(blocks) {
  const sorted = [...blocks].sort((a, b) => a.start - b.start || a.end - b.end);
  let cluster = [];
  let clusterEnd = -Infinity;
  const laneEnds = [];
  const flush = () => {
    if (!cluster.length) return;
    const laneCount = Math.max(...cluster.map(item => item.lane)) + 1;
    cluster.forEach(item => { item.lanes = laneCount; item.conflict = laneCount > 1; });
    cluster = [];
    laneEnds.length = 0;
  };
  sorted.forEach(block => {
    if (block.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex(end => end <= block.start);
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = block.end;
    block.lane = lane;
    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, block.end);
  });
  flush();
  return sorted;
}

function renderPickupTimetableBlock(block, dayStart, isUnassigned) {
  const top = (block.start - dayStart) * PICKUP_TIMETABLE_PX_PER_MIN;
  const height = Math.max(24, (block.end - block.start) * PICKUP_TIMETABLE_PX_PER_MIN - 2);
  const width = 100 / (block.lanes || 1);
  const left = width * (block.lane || 0);
  const overCapacity = block.capacity > 0 && block.seats > block.capacity;
  const tone = isUnassigned
    ? { border: '#FCA5A5', bg: '#FEF2F2', text: '#B91C1C' }
    : block.conflict
      ? { border: '#FBBF24', bg: '#FFFBEB', text: '#B45309' }
      : { border: '#C7D2FE', bg: '#EEF2FF', text: '#3730A3' };
  const timeLabel = `${formatPickupMinutes(block.start)}~${formatPickupMinutes(block.end)}`;
  const detail = [block.vehicle, block.seats ? `${block.seats}명` : '', block.capacity ? `정원 ${block.capacity}` : '']
    .filter(Boolean).join(' · ');
  return `<div title="${timeLabel} · ${block.label}${detail ? ` · ${detail}` : ''}"
    style="position:absolute;top:${top}px;height:${height}px;left:calc(${left}% + 2px);width:calc(${width}% - 4px);
    border:1px solid ${tone.border};background:${tone.bg};border-radius:6px;padding:3px 5px;overflow:hidden;box-sizing:border-box">
    <div style="font-size:9px;font-weight:800;color:${tone.text};font-variant-numeric:tabular-nums">${timeLabel}</div>
    <div style="font-size:10px;font-weight:700;color:#111827;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${block.label}</div>
    ${detail ? `<div style="font-size:8.5px;color:${overCapacity ? '#DC2626' : '#6B7280'};margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${overCapacity ? '정원 초과 · ' : ''}${detail}</div>` : ''}
  </div>`;
}

function renderPickupManagerTimetable(managerId) {
  const container = document.getElementById('pickup-manager-timetable');
  if (!container) return;
  const dateKey = APP.pickupSelectedDate;
  const titleEl = document.getElementById('pickup-timetable-title');
  const subtitleEl = document.getElementById('pickup-timetable-subtitle');
  const focusedManager = managerId != null ? MOCK_PICKUP_MANAGERS.find(m => m.id === Number(managerId)) : null;
  const groups = getPickupDispatchGroups(dateKey);

  // 숨긴 담당자라도 그날 배차가 잡혀 있으면 칸을 내준다 — 안 그러면 남의 배차가 미배정으로 잘못 보인다.
  const dispatchedManagerIds = new Set(groups.map(g => Number(g.managerId)).filter(Boolean));
  const managers = focusedManager
    ? [focusedManager]
    : MOCK_PICKUP_MANAGERS.filter(m => m.visible !== false || dispatchedManagerIds.has(m.id));

  const dateLabel = dateKey
    ? new Date(`${dateKey}T00:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
    : '날짜 선택';
  if (titleEl) titleEl.innerHTML = `<i data-lucide="clock" style="color:#5E5CE6"></i> ${focusedManager ? `${focusedManager.name} 배차표` : '담당자별 시간 단위 배차표'}`;

  const columns = managers.map(m => ({ id: m.id, name: m.name, blocks: [] }));
  const unassignedColumn = { id: 'unassigned', name: '미배정', blocks: [] };

  groups.forEach(group => {
    const timeWindow = getPickupGroupTimeWindowMinutes(group);
    if (!timeWindow) return;
    const column = columns.find(col => Number(col.id) === Number(group.managerId));
    if (!column && focusedManager) return;   // 한 명만 볼 땐 남의 배차를 끌어오지 않는다
    const students = group.studentIds.map(id => MOCK_STUDENTS.find(s => s.id === id)).filter(Boolean);
    (column || unassignedColumn).blocks.push({
      start: timeWindow.start,
      end: timeWindow.end,
      label: students.map(s => s.nick || s.name).join(', ') || '탑승자 미정',
      seats: students.length,
      vehicle: group.vehiclePlate || group.vehicleModel || '',
      capacity: Number(group.vehicleCapacity) || 0,
    });
  });

  if (!focusedManager) {
    const assignedIds = new Set(groups.flatMap(g => g.studentIds));
    getPickupStudents()
      .filter(s => (s.arrivalDate || s.startDate) === dateKey && isPickupRequired(s) && !assignedIds.has(s.id))
      .forEach(student => {
        const timeWindow = getPickupTimeWindowMinutes(student);
        if (!timeWindow) return;
        unassignedColumn.blocks.push({
          start: timeWindow.start,
          end: timeWindow.end,
          label: student.nick || student.name,
          seats: 1,
          vehicle: '배차 미정',
          capacity: 0,
        });
      });
  }

  const allColumns = focusedManager ? columns : [...columns, unassignedColumn];
  const allBlocks = allColumns.flatMap(col => col.blocks);
  const totalConflicts = allColumns
    .reduce((sum, col) => sum + assignPickupTimetableLanes(col.blocks).filter(b => b.conflict).length, 0);

  if (subtitleEl) {
    const seatTotal = allBlocks.reduce((sum, b) => sum + b.seats, 0);
    subtitleEl.innerHTML = `${dateLabel} 기준 · 배차 ${groups.length}건 · 승객 ${seatTotal}명`
      + (totalConflicts ? ` · <b style="color:#B45309">시간 겹침 ${totalConflicts}건</b>` : '');
  }

  if (!allBlocks.length) {
    container.innerHTML = `<div style="padding:52px 20px;text-align:center;color:#9CA3AF">
      <i data-lucide="calendar-x" style="width:26px;height:26px;margin-bottom:8px"></i>
      <div style="font-size:12px;font-weight:700">이 날짜에 표시할 픽업 일정이 없습니다.</div></div>`;
    if (typeof refreshIcons === 'function') refreshIcons();
    return;
  }

  // 표 범위를 그날 실제 일정에 맞춘다. 06시 고정이던 예전 표는 새벽 도착을 06시로 밀어 붙여 놨었다.
  const dayStart = Math.max(0, Math.floor((Math.min(...allBlocks.map(b => b.start)) - PICKUP_TIMETABLE_PAD_MIN) / 60) * 60);
  const dayEnd = Math.ceil((Math.max(...allBlocks.map(b => b.end)) + PICKUP_TIMETABLE_PAD_MIN) / 60) * 60;
  const totalMinutes = Math.max(120, dayEnd - dayStart);
  const bodyHeight = totalMinutes * PICKUP_TIMETABLE_PX_PER_MIN;

  let gutterHtml = '';
  let gridLinesHtml = '';
  for (let minute = dayStart; minute <= dayStart + totalMinutes; minute += 30) {
    const top = (minute - dayStart) * PICKUP_TIMETABLE_PX_PER_MIN;
    const isHour = minute % 60 === 0;
    if (isHour) {
      // 맨 위·맨 아래 눈금은 반만 걸쳐 놓으면 잘린다. 그 둘만 안쪽으로 붙인다.
      const shift = minute === dayStart ? '0' : minute >= dayStart + totalMinutes ? '-100%' : '-50%';
      gutterHtml += `<div style="position:absolute;top:${top}px;right:8px;transform:translateY(${shift});font-size:10px;font-weight:800;color:#374151;white-space:nowrap;font-variant-numeric:tabular-nums">${formatPickupMinutes(minute)}${minute >= 1440 ? '<span style="color:#DC2626;font-size:8px">+1</span>' : ''}</div>`;
    }
    gridLinesHtml += `<div style="position:absolute;left:0;right:0;top:${top}px;border-top:1px ${isHour ? 'solid #E5E7EB' : 'dashed #F1F5F9'}"></div>`;
  }

  const columnsHtml = allColumns.map(col => {
    const isUnassigned = col.id === 'unassigned';
    const blocks = assignPickupTimetableLanes(col.blocks);
    const seats = blocks.reduce((sum, b) => sum + b.seats, 0);
    const conflicts = blocks.filter(b => b.conflict).length;
    return `<div style="flex:1 0 auto;min-width:158px;border-left:1px solid #E5E7EB">
      <div style="position:sticky;top:0;z-index:2;height:${PICKUP_TIMETABLE_HEAD_PX}px;box-sizing:border-box;background:${isUnassigned ? '#FEF2F2' : '#F8FAFC'};border-bottom:1px solid #E5E7EB;padding:6px 8px;text-align:center">
        <div style="font-size:11.5px;font-weight:800;color:${isUnassigned ? '#B91C1C' : '#111827'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${col.name}</div>
        <div style="font-size:9px;margin-top:2px;color:${conflicts ? '#B45309' : '#6B7280'}">${blocks.length ? `배차 ${blocks.length}건 · ${seats}명${conflicts ? ` · 겹침 ${conflicts}` : ''}` : '일정 없음'}</div>
      </div>
      <div style="position:relative;height:${bodyHeight}px">
        ${gridLinesHtml}
        ${blocks.map(block => renderPickupTimetableBlock(block, dayStart, isUnassigned)).join('')}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;padding:8px 14px;border-bottom:1px solid #E5E7EB;background:#FCFCFD;font-size:9.5px;color:#6B7280">
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;border:1px solid #C7D2FE;background:#EEF2FF;vertical-align:-1px"></i> 배차 완료</span>
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;border:1px solid #FBBF24;background:#FFFBEB;vertical-align:-1px"></i> 시간 겹침</span>
      <span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;border:1px solid #FCA5A5;background:#FEF2F2;vertical-align:-1px"></i> 미배정</span>
      <span style="margin-left:auto">${formatPickupMinutes(dayStart)}~${formatPickupMinutes(dayStart + totalMinutes)} 구간만 표시</span>
    </div>
    <div style="display:flex;min-width:max-content">
      <div style="position:sticky;left:0;z-index:3;width:62px;flex-shrink:0;background:#fff;border-right:1px solid #E5E7EB">
        <div style="position:sticky;top:0;z-index:4;height:${PICKUP_TIMETABLE_HEAD_PX}px;box-sizing:border-box;background:#F8FAFC;border-bottom:1px solid #E5E7EB;display:flex;align-items:center;justify-content:center;font-size:10px;color:#6B7280">시간</div>
        <div style="position:relative;height:${bodyHeight}px">${gutterHtml}</div>
      </div>
      ${columnsHtml}
    </div>`;
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
  const time = student.flightTime ? student.flightTime : '<span style="color:#DC2626;font-weight:800">시간 미정 — 학생 상세에서 입력 필요</span>';
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

// 항공편 도착 시각 기준 편도 이동+대기로 한 건당 90분(1.5시간)을 점유한다고 가정하고 배차 시간대를 계산한다.
// 담당자별 시간 단위 배차표는 아직 없고, 우선 같은 날짜 내 다른 배차 건과의 시간 겹침만으로 가능/불가를 판단한다.
const PICKUP_SLOT_MINUTES = 90;

function getPickupTimeWindowMinutes(student) {
  const time = student?.flightTime;
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  const start = h * 60 + m;
  return { start, end: start + PICKUP_SLOT_MINUTES };
}

function pickupTimeStrToMinutes(str) {
  if (!str || !/^\d{2}:\d{2}$/.test(str)) return null;
  const [h, m] = str.split(':').map(Number);
  return h * 60 + m;
}

function pickupMinutesToTimeStr(minutes) {
  if (minutes == null) return '';
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`;
}

// 여러 학생의 flightTime 기준 window를 모아 최소 시작~최대 종료 구간을 계산(개별 stored 시간이 없을 때의 기본값 산출용)
function getPickupStudentsTimeWindow(studentIds) {
  const windows = (studentIds || [])
    .map(id => MOCK_STUDENTS.find(s => s.id === id))
    .map(getPickupTimeWindowMinutes)
    .filter(Boolean);
  if (!windows.length) return null;
  return { start: Math.min(...windows.map(w => w.start)), end: Math.max(...windows.map(w => w.end)) };
}

// 배차 그룹에 수동 설정된 startTime/endTime이 있으면 그걸 우선 사용하고, 없으면 학생 flightTime 기준으로 산출한다.
function getPickupGroupTimeWindowMinutes(group) {
  const start = pickupTimeStrToMinutes(group?.startTime);
  const end = pickupTimeStrToMinutes(group?.endTime);
  if (start != null && end != null && end > start) return { start, end };
  return getPickupStudentsTimeWindow(group?.studentIds);
}

function pickupWindowsOverlap(a, b) {
  return Boolean(a && b && a.start < b.end && b.start < a.end);
}

// targetWindow가 주어지면 그 시간대 기준으로, 아니면 학생들의 flightTime 기준으로 겹침 여부를 판단한다.
// 시간 정보가 없으면 겹침 여부를 판단할 수 없으니 '가능'으로 표시(보수적으로 막지 않음).
function isPickupManagerAvailable(managerId, dateKey, studentIds, excludeGroupId, targetWindow) {
  const window = targetWindow || getPickupStudentsTimeWindow(studentIds);
  if (!window) return true;
  const otherGroups = getPickupDispatchGroups(dateKey).filter(group => Number(group.managerId) === Number(managerId) && group.id !== excludeGroupId);
  return !otherGroups.some(group => pickupWindowsOverlap(getPickupGroupTimeWindowMinutes(group), window));
}

function openPickupDispatchModal(dateKey, groupId) {
  const group = groupId ? getPickupDispatchGroups(dateKey).find(item => item.id === Number(groupId)) : null;
  const studentIds = group ? [...group.studentIds] : [...pickupSelectedStudentIds];
  if (!studentIds.length) return;
  const students = studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
  document.getElementById('pickup-dispatch-date').value = dateKey;
  document.getElementById('pickup-dispatch-group-id').value = group?.id || '';
  document.getElementById('pickup-dispatch-student-ids').value = studentIds.join(',');
  document.getElementById('pickup-dispatch-modal-title').textContent = group
    ? `배차 ${getPickupDispatchGroups(dateKey).indexOf(group) + 1} 정보 수정`
    : `선택 인원 배차 · ${students.length}명`;
  document.getElementById('pickup-dispatch-selected-students').innerHTML = students.map(student => renderPickupDispatchStudentInfo(student)).join('');
  document.getElementById('pickup-dispatch-modal-vehicle').innerHTML = `<option value="">등록 차량 선택</option>${MOCK_PICKUP_VEHICLES.filter(vehicle => vehicle.active !== false).map(vehicle => `<option value="${vehicle.id}" ${Number(group?.vehicleId) === vehicle.id ? 'selected' : ''} ${Number(vehicle.capacity) < students.length ? 'disabled' : ''}>${vehicle.model} (${vehicle.plate}) · ${vehicle.capacity}명${Number(vehicle.capacity) < students.length ? ' (정원 부족)' : ''}</option>`).join('')}`;
  document.getElementById('pickup-dispatch-delete-btn').style.display = group ? '' : 'none';
  const defaultWindow = group ? getPickupGroupTimeWindowMinutes(group) : getPickupStudentsTimeWindow(studentIds);
  document.getElementById('pickup-dispatch-start-time').value = defaultWindow ? pickupMinutesToTimeStr(defaultWindow.start) : '';
  document.getElementById('pickup-dispatch-end-time').value = defaultWindow ? pickupMinutesToTimeStr(defaultWindow.end) : '';

  // 수정할 때는 그 배차 자체를 고치는 것이라 「다른 배차에 태우기」를 띄우지 않는다.
  const section = document.getElementById('pickup-dispatch-existing-section');
  if (group) {
    if (section) section.style.display = 'none';
    document.getElementById('pickup-dispatch-existing-list').innerHTML = '';
  } else {
    renderPickupDispatchExistingList(dateKey, studentIds, null);
  }
  const newTarget = document.getElementById('pickup-dispatch-target-new');
  if (newTarget) newTarget.checked = true;

  updatePickupDispatchModalManagerAvailability(group?.managerId);
  updatePickupDispatchTarget();
  openModal('pickup-dispatch-modal');
  if (typeof refreshIcons === 'function') refreshIcons();
}

// 픽업 시작·종료 시간 입력값 기준으로 담당자 목록의 가능/불가 표시를 갱신한다.
function updatePickupDispatchModalManagerAvailability(preselectManagerId) {
  const managerSelect = document.getElementById('pickup-dispatch-modal-manager');
  if (!managerSelect) return;
  const dateKey = document.getElementById('pickup-dispatch-date')?.value;
  const groupId = Number(document.getElementById('pickup-dispatch-group-id')?.value || 0) || null;
  const studentIds = (document.getElementById('pickup-dispatch-student-ids')?.value || '').split(',').map(Number).filter(Boolean);
  const startTime = document.getElementById('pickup-dispatch-start-time')?.value;
  const endTime = document.getElementById('pickup-dispatch-end-time')?.value;
  const startMin = pickupTimeStrToMinutes(startTime);
  const endMin = pickupTimeStrToMinutes(endTime);
  const targetWindow = (startMin != null && endMin != null && endMin > startMin) ? { start: startMin, end: endMin } : null;
  const selectedId = preselectManagerId != null ? String(preselectManagerId) : managerSelect.value;
  managerSelect.innerHTML = `<option value="">담당자 선택</option>${MOCK_PICKUP_MANAGERS.filter(manager => manager.visible !== false).map(manager => {
    const available = isPickupManagerAvailable(manager.id, dateKey, studentIds, groupId, targetWindow);
    return `<option value="${manager.id}" ${String(manager.id) === selectedId ? 'selected' : ''}>${manager.name} · ${manager.phone}${targetWindow ? ` · ${available ? '✅ 가능' : '❌ 불가(시간 겹침)'}` : ''}</option>`;
  }).join('')}`;
  const note = document.getElementById('pickup-dispatch-modal-manager-availability');
  if (note) {
    note.textContent = targetWindow
      ? `설정한 픽업 시간(${startTime}~${endTime}) 기준으로 담당자 가능 여부를 표시합니다.`
      : (startTime || endTime ? '종료 시간은 시작 시간보다 이후여야 담당자 가능 여부를 확인할 수 있어.' : '픽업 시작·종료 시간을 입력하면 담당자별 가능 여부를 확인할 수 있어.');
  }
}

function savePickupDispatchModal() {
  const dateKey = document.getElementById('pickup-dispatch-date').value;
  const groupId = Number(document.getElementById('pickup-dispatch-group-id').value || 0);
  const studentIds = document.getElementById('pickup-dispatch-student-ids').value.split(',').map(Number).filter(Boolean);
  const picked = document.querySelector('input[name="pickup-dispatch-target"]:checked');
  const target = picked ? picked.value : 'new';

  // 이미 잡아 둔 배차에 태우는 경우. 담당자·차량·시간은 그 배차 것을 그대로 쓴다.
  if (target !== 'new') {
    const host = getPickupDispatchGroups(dateKey).find(item => item.id === Number(target));
    if (!host) return showToast('고른 배차를 찾을 수 없어.', 'warning');
    const merged = [...new Set([...host.studentIds, ...studentIds])];
    const capacity = Number(host.vehicleCapacity) || 0;
    if (capacity && merged.length > capacity) {
      return showToast(`이 배차는 정원 ${capacity}명이라 ${merged.length}명을 태울 수 없어.`, 'warning');
    }
    host.studentIds = merged;
    pickupSelectedStudentIds = pickupSelectedStudentIds.filter(id => !studentIds.includes(id));
    closeModal('pickup-dispatch-modal');
    renderPickupCalendar();
    return showToast(`${studentIds.length}명을 기존 배차에 태웠습니다.`, 'success');
  }

  const managerId = Number(document.getElementById('pickup-dispatch-modal-manager').value || 0);
  const vehicleId = Number(document.getElementById('pickup-dispatch-modal-vehicle').value || 0);
  const startTime = document.getElementById('pickup-dispatch-start-time').value;
  const endTime = document.getElementById('pickup-dispatch-end-time').value;
  const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === vehicleId && item.active !== false);
  if (!managerId || !vehicle) return showToast('픽업 담당자와 등록 차량을 선택해줘.', 'warning');
  if (!startTime || !endTime) return showToast('픽업 시작·종료 시간을 입력해줘.', 'warning');
  if (endTime <= startTime) return showToast('종료 시간은 시작 시간보다 이후여야 해.', 'warning');
  if (Number(vehicle.capacity) < studentIds.length) return showToast(`탑승 ${studentIds.length}명보다 큰 정원의 차량을 선택해줘.`, 'warning');
  const groups = getPickupDispatchGroups(dateKey);
  let group = groupId ? groups.find(item => item.id === groupId) : null;
  if (!group) {
    group = { id: Date.now(), studentIds };
    groups.push(group);
    PICKUP_DISPATCH_GROUPS[dateKey] = groups;
  }
  Object.assign(group, { studentIds, managerId, vehicleId, vehicleCapacity: Number(vehicle.capacity), vehicleModel: vehicle.model, vehiclePlate: vehicle.plate, startTime, endTime, status: 'dispatched' });
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
  const contact = [student.nick ? `Nick: ${student.nick}` : '', student.phone || '', student.email || '']
    .filter(Boolean).join(' · ');
  const time = student.flightTime ? `입국 ${student.flightTime}` : '<span style="color:#DC2626;font-weight:700">입국 시간 미정</span>';
  return `<div style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:#fff;border:1px solid #E5E7EB;border-radius:11px">
    <span style="display:inline-grid;place-items:center;width:40px;height:40px;flex:0 0 40px;border-radius:50%;background:#F3F4F6;color:#9CA3AF"><i data-lucide="user" style="width:20px;height:20px"></i></span>
    <div style="flex:1;min-width:0">
      <b style="font-size:14px;color:#111827">${student.name}</b>
      <div style="font-size:11.5px;color:#6B7280;margin-top:4px">${contact || '연락처 미등록'}</div>
      <div style="font-size:11.5px;color:#2563EB;font-weight:600;margin-top:7px"><i data-lucide="plane" style="width:13px;height:13px;vertical-align:-2px;margin-right:4px"></i>${student.flightInfo || '항공편 미등록'} · ${time}</div>
    </div>
  </div>`;
}

// 이미 잡아 둔 배차. 고른 학생을 새 배차로 빼지 않고 여기에 태울 수 있다.
// 정원이 모자란 배차는 고를 수 없게 두되 목록에서 빼지는 않는다 — 왜 못 태우는지 보여야 한다.
function renderPickupDispatchExistingList(dateKey, studentIds, excludeGroupId) {
  const section = document.getElementById('pickup-dispatch-existing-section');
  const list = document.getElementById('pickup-dispatch-existing-list');
  if (!section || !list) return;
  const groups = getPickupDispatchGroups(dateKey).filter(group => group.id !== excludeGroupId);
  if (!groups.length) {
    section.style.display = 'none';
    list.innerHTML = '';
    return;
  }
  section.style.display = '';
  list.innerHTML = groups.map(group => {
    const manager = MOCK_PICKUP_MANAGERS.find(item => item.id === Number(group.managerId));
    const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === Number(group.vehicleId));
    const riders = group.studentIds.map(id => MOCK_STUDENTS.find(student => student.id === id)).filter(Boolean);
    const capacity = Number(group.vehicleCapacity) || Number(vehicle?.capacity) || 0;
    const after = riders.length + studentIds.length;
    const full = capacity > 0 && after > capacity;
    const window = getPickupGroupTimeWindowMinutes(group);
    const timeLabel = window ? `${pickupMinutesToTimeStr(window.start)}~${pickupMinutesToTimeStr(window.end)}` : '시간 미정';
    return `<label style="display:flex;align-items:flex-start;gap:10px;padding:13px 14px;border:1px solid #E5E7EB;border-radius:11px;background:#fff;cursor:${full ? 'not-allowed' : 'pointer'};opacity:${full ? '.55' : '1'}">
      <input type="radio" name="pickup-dispatch-target" value="${group.id}" ${full ? 'disabled' : ''} style="margin-top:2px;width:16px;height:16px;accent-color:#2563EB;flex-shrink:0" onchange="updatePickupDispatchTarget()"/>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <b style="font-size:12.5px;color:#111827">${manager?.name || '담당자 미지정'} · ${vehicle ? `${vehicle.model} (${vehicle.plate})` : '차량 미지정'}</b>
          <span style="flex:0 0 auto;font-size:11.5px;color:#6B7280;font-variant-numeric:tabular-nums">${timeLabel}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:7px">
          <span class="tsa-badge" style="background:${full ? '#FEF2F2' : '#EEF2FF'};color:${full ? '#B91C1C' : '#4338CA'}">${riders.length} / ${capacity || '-'}명</span>
          <span style="font-size:11px;color:#6B7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${riders.map(student => student.name).join(', ') || '탑승자 없음'}</span>
        </div>
        ${full ? `<div style="font-size:10.5px;color:#B91C1C;margin-top:6px">${studentIds.length}명을 더 태우면 정원 ${capacity}명을 넘습니다.</div>` : ''}
      </div>
    </label>`;
  }).join('');
}

// 고른 쪽만 파랗게 띄운다. 새 배차가 아니면 담당자·차량·시간 입력은 잠근다.
function updatePickupDispatchTarget() {
  const picked = document.querySelector('input[name="pickup-dispatch-target"]:checked');
  const isNew = !picked || picked.value === 'new';
  const box = document.getElementById('pickup-dispatch-new-box');
  if (box) {
    box.style.borderColor = isNew ? '#2563EB' : '#E5E7EB';
    box.style.borderWidth = isNew ? '2px' : '1px';
  }
  ['pickup-dispatch-modal-manager', 'pickup-dispatch-modal-vehicle', 'pickup-dispatch-start-time', 'pickup-dispatch-end-time'].forEach(id => {
    const field = document.getElementById(id);
    if (field) field.disabled = !isNew;
  });
  document.querySelectorAll('#pickup-dispatch-existing-list label').forEach(label => {
    const input = label.querySelector('input[type="radio"]');
    const on = Boolean(input && input.checked);
    label.style.borderColor = on ? '#2563EB' : '#E5E7EB';
    label.style.borderWidth = on ? '2px' : '1px';
    label.style.background = on ? '#F8FAFF' : '#fff';
  });
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

// 차량은 담당자 화면의 보조 정보다. 등록과 수정은 모달에서 하고, 화면에는 목록만 남긴다.
// 등록 폼은 창 위쪽에 그대로 있다. [수정]을 누르면 그 값을 폼에 올린다.
function openPickupVehicleModal(vehicleId = null) {
  const vehicle = MOCK_PICKUP_VEHICLES.find(item => item.id === Number(vehicleId));
  const title = document.getElementById('pickup-vehicle-form-title');
  if (title) title.textContent = vehicle ? '차량 수정' : '차량 등록';
  const cancel = document.getElementById('pickup-vehicle-cancel');
  if (cancel) cancel.style.display = vehicle ? '' : 'none';
  document.getElementById('pickup-vehicle-id').value = vehicle?.id || '';
  document.getElementById('pickup-vehicle-model').value = vehicle?.model || '';
  document.getElementById('pickup-vehicle-plate').value = vehicle?.plate || '';
  document.getElementById('pickup-vehicle-capacity').value = String(vehicle?.capacity ?? 0);
  document.getElementById('pickup-vehicle-memo').value = vehicle?.memo || '';
  if (!document.getElementById('pickup-vehicle-tbody')) openModal('pickup-vehicle-window');
}

// 그 차가 실제로 물려 있는 배차 건수. 삭제를 막는 근거이자 목록에 그대로 보여주는 값이다.
function countPickupVehicleUsage(vehicleId) {
  return Object.values(PICKUP_DISPATCH_GROUPS).flat()
    .filter(group => Number(group.vehicleId) === Number(vehicleId)).length;
}

function renderPickupVehicleTable() {
  const body = document.getElementById('pickup-vehicle-tbody');
  const countEl = document.getElementById('pickup-vehicle-count');
  if (countEl) countEl.textContent = `${MOCK_PICKUP_VEHICLES.length}대`;
  const chip = document.getElementById('pickup-vehicle-count-chip');
  if (chip) chip.textContent = `${MOCK_PICKUP_VEHICLES.length}대`;
  if (!body) return;

  body.innerHTML = MOCK_PICKUP_VEHICLES.length ? MOCK_PICKUP_VEHICLES.map(vehicle => `<tr>
    <td><b style="font-size:12px;color:#111827">${vehicle.model}</b></td>
    <td style="color:#374151;font-variant-numeric:tabular-nums">${vehicle.plate}</td>
    <td style="color:#374151">${vehicle.capacity}명</td>
    <td style="color:#6B7280">${vehicle.memo || '-'}</td>
    <td style="text-align:right;white-space:nowrap">
      <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openPickupVehicleModal(${vehicle.id})">수정</button>
      <button class="tsa-btn tsa-btn-xs" style="margin-left:5px;background:#EF4444;border-color:#EF4444;color:#fff" onclick="removePickupVehicle(${vehicle.id})">삭제</button>
    </td>
  </tr>`).join('') : '<tr><td colspan="5" style="padding:26px;text-align:center;color:#9CA3AF;font-size:11.5px">등록된 차량이 없습니다. 위 [차량 등록]에서 추가하세요.</td></tr>';
  if (typeof refreshIcons === 'function') refreshIcons();
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
  resetPickupVehicleForm();
  renderPickupVehicleTable();
  renderPickupDateAssignments();
  showToast('차량 정보가 저장되었습니다.', 'success');
}

function removePickupVehicle(vehicleId) {
  if (countPickupVehicleUsage(vehicleId)) {
    showToast('배차에 사용 중인 차량은 삭제할 수 없어.', 'warning');
    return;
  }
  const index = MOCK_PICKUP_VEHICLES.findIndex(vehicle => vehicle.id === vehicleId);
  if (index >= 0) MOCK_PICKUP_VEHICLES.splice(index, 1);
  renderPickupVehicleTable();
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

// 달을 넘긴다고 날짜가 골라지지는 않는다 — 고른 날짜는 그대로 둔다.
function changePickupCalendarMonth(offset) {
  const month = APP.pickupCalendarMonth;
  APP.pickupCalendarMonth = new Date(month.getFullYear(), month.getMonth() + offset, 1);
  renderPickupCalendar();
}

function goPickupCalendarToday() {
  const today = getPickupToday();
  APP.pickupCalendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  APP.pickupSelectedDate = PICKUP_TODAY;
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
  renderPickupManagerTable();
  showToast('픽업 담당자 프로필이 저장되었습니다.', 'success');
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

  const avatarSrc = std.profilePhoto || (std.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png');

  if (tab === 'invoice') {
    content.style.position = 'relative';
    content.innerHTML = renderInvoiceDocumentSnapshot(getDisplayInvoice(std), std);
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
            <div><strong>Passport No:</strong> ${APP._invoiceRevealPassport ? (std.passportNum || 'N/A') : maskPassportNumber(std.passportNum, 'N/A')}</div>
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
            <tr><th style="text-align:left;padding:10px 12px;background:#F1F5F9;border:1px solid #CBD5E1">Passport Number</th><td style="padding:10px 12px;border:1px solid #CBD5E1">${APP._invoiceRevealPassport ? (std.passportNum || 'N/A') : maskPassportNumber(std.passportNum, 'N/A')}</td></tr>
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
  const tab = APP.selectedInvoiceTab;
  const studentId = APP._invoiceDocStudentId;
  const needsReveal = (tab === 'loa' || tab === 'invitation') && studentId != null;
  if (!needsReveal) {
    window.print();
    return;
  }
  APP._invoiceRevealPassport = true;
  switchInvoiceTab(tab);
  logPassportDocumentPrint(studentId, tab === 'loa' ? '입학 허가서(LOA)' : '초청장(Invitation)');
  const restoreMask = () => {
    APP._invoiceRevealPassport = false;
    switchInvoiceTab(tab);
    window.removeEventListener('afterprint', restoreMask);
  };
  window.addEventListener('afterprint', restoreMask);
  setTimeout(() => window.print(), 50);
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

  const labels = { no_course: '미수강', waiting: '입학 대기', current: '재학생', completed: '졸업' };
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
    const typeColors = {
      '1:1': { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0' },
      '1:4': { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
      '1:8': { bg: '#EEF2FF', color: '#4338CA', border: '#C7D2FE' },
    };
    const timetableTemplate = getCourseTimetableTemplate(c);
    const types = [...MOCK_MASTER_CLASS_TYPES].filter(t => t.visible !== false).sort((a, b) => a.order - b.order);
    const timetableItems = types.flatMap(type => (c.subjectsByType?.[type.code] || []).map(ref => {
      const subject = MOCK_MASTER_SUBJECTS.find(subjectItem => subjectItem.id === ref.id);
      const color = typeColors[type.code] || { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
      const hours = Math.max(1, Number(ref.hours) || 1);
      return `
        <span style="display:inline-flex;align-items:center;overflow:hidden;border:1px solid ${color.border};background:#fff;border-radius:7px;white-space:nowrap">
          <span style="padding:4px 7px;font-size:10px;color:#374151">
            <strong style="color:${color.color}">${type.code}</strong>
            · ${subject?.name || ref.id || '과목 미선택'}${hours > 1 ? ` ${hours}시간` : ''}
          </span>
        </span>
      `;
    })).join('');

    // 추천 레벨 배지
    const levelsBadge = (c.levels || [])
      .map(lvId => MOCK_MASTER_LEVELS.find(m => m.id === lvId))
      .filter(Boolean)
      .map(lv => `<span class="tsa-badge tsa-badge-gray" style="font-size:10px;margin:1px">${lv.name}</span>`)
      .join('') || '<span style="color:#D1D5DB">-</span>';

    return `
      <tr${c.active === false ? ' style="opacity:0.55"' : ''}>
        <td style="text-align:center;color:#9CA3AF;font-size:11px">${idx + 1}</td>
        <td>
          <div style="font-weight:700;font-size:13px;color:#1A1D23">${c.name}</div>
          ${c.active === false ? '<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px;margin-top:2px">비활성</span>' : ''}
        </td>
        <td>${levelsBadge}</td>
        <td style="text-align:center">
          <span style="font-weight:900;font-size:13px;color:#111827">${timetableTemplate.length}</span><span style="font-size:10.5px;color:#6B7280">시간</span>
        </td>
        <td style="min-width:520px">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:5px">
            ${timetableItems || '<span style="color:#9CA3AF;font-size:11px">등록된 과목 없음</span>'}
          </div>
        </td>
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
// 과정 수정 팝업 임시 상태. { '1:1': [{id,hours}], '1:4': [...], '1:8': [...] } — 순서 없이 유형별로만 관리한다.
let _courseSubjectDraft = { '1:1': [], '1:4': [], '1:8': [] };

function cloneCourseSubjectsByType(subjectsByType) {
  const draft = { '1:1': [], '1:4': [], '1:8': [] };
  Object.entries(subjectsByType || {}).forEach(([classType, refs]) => {
    if (!draft[classType]) draft[classType] = [];
    (refs || []).forEach(ref => {
      if (ref && ref.id) draft[classType].push({ id: ref.id, hours: Math.max(1, Number(ref.hours) || 1) });
    });
  });
  return draft;
}

function openCourseModal() {
  _editingCourseIdx = null;
  document.getElementById('course-modal-title').textContent = '신규 과정 및 기본 시간표 추가';
  document.getElementById('course-modal-subtitle').textContent = '과정 정보와 유형별 과목 구성을 설정해.';
  document.getElementById('add-course-name').value = '';

  renderCourseLevelCheckboxes([]);
  _courseSubjectDraft = cloneCourseSubjectsByType({
    '1:1': [{ id: 'SUB_01' }, { id: 'SUB_03' }, { id: 'SUB_04' }, { id: 'SUB_05' }],
    '1:4': [{ id: 'SUB_08' }, { id: 'SUB_10' }],
    '1:8': [{ id: 'SUB_02' }, { id: 'SUB_03' }],
  });
  renderCourseClassTypeSections();
  openModal('course-add-modal');
  updateCourseCurriculumPreview();
}

function openEditCourseModal(idx) {
  _editingCourseIdx = idx;
  const c = MOCK_COURSES[idx];
  if (!c) return;

  document.getElementById('course-modal-title').textContent = '과정 및 기본 시간표 수정';
  document.getElementById('course-modal-subtitle').textContent = '과정 정보와 유형별 과목 구성을 수정해.';
  document.getElementById('add-course-name').value = c.name;

  renderCourseLevelCheckboxes(c.levels || []);
  _courseSubjectDraft = cloneCourseSubjectsByType(c.subjectsByType);
  renderCourseClassTypeSections();
  openModal('course-add-modal');
  updateCourseCurriculumPreview();
}

function renderCourseLevelCheckboxes(selectedLevels) {
  const lvContainer = document.getElementById('course-level-checkboxes-container');
  if (lvContainer) {
    lvContainer.innerHTML = MOCK_MASTER_LEVELS.map(l => {
      const isChecked = selectedLevels.includes(l.id) ? 'checked' : '';
      return `
        <label style="display:flex;align-items:center;gap:6px;font-size:12.5px;cursor:pointer;margin:0">
          <input type="checkbox" name="course-levels-cb" value="${l.id}" ${isChecked} onchange="updateCourseCurriculumPreview()"/>
          <span>${l.name}</span>
        </label>
      `;
    }).join('');
  }
}

function getCourseSubjectIds(course) {
  const ids = new Set();
  (course.timetableTemplate || []).forEach(item => {
    if (item?.subjectId) ids.add(item.subjectId);
  });
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
  if (Array.isArray(course.timetableTemplate) && course.timetableTemplate.length) {
    return course.timetableTemplate.reduce((result, item) => {
      const type = item?.classType;
      if (type) result[type] = (result[type] || 0) + 1;
      return result;
    }, { '1:1': 0, '1:4': 0, '1:8': 0 });
  }
  const mappedHours = {};
  Object.entries(course.subjectsByType || {}).forEach(([type, refs]) => {
    mappedHours[type] = (refs || []).reduce((sum, ref) => sum + Math.max(0, Number(ref?.hours) || 0), 0);
  });
  return {
    '1:1': Number(mappedHours['1:1'] ?? course.classHours?.['1:1'] ?? course.oneone) || 0,
    '1:4': Number(mappedHours['1:4'] ?? course.classHours?.['1:4'] ?? course.group1on4) || 0,
    '1:8': Number(mappedHours['1:8'] ?? course.classHours?.['1:8'] ?? course.group) || 0,
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

// ===== 차수(enrollment) · 구간(segment) 단위 청구 =====
// 수강이 늘어나는 길이 둘이라 청구 단위도 둘이다.
//   차수 안에서 연장 → 구간이 붙는다   → 그 구간만 추가 발행 (기존 인보이스는 그대로)
//   새로 코스 등록   → 차수가 생긴다   → 차수 전체로 새 인보이스
// 그래서 항목 키를 'education' 하나로 두면 "연장분"을 가리킬 이름이 없다. 구간 id를 붙인다.
const BILLING_GROUP_OF = key => String(key).split(':')[0];

// 정산이 보는 차수 목록. 목데이터 학생은 enrollments 가 없고 학생 단위 필드만 있어서,
// 그 경우 1차 수강 하나를 합성한다 — 코스 등록을 한 번도 저장하지 않은 학생도 정산이 돌아야 한다.
function getBillingEnrollments(s) {
  const list = Array.isArray(s?.enrollments) ? s.enrollments : [];
  if (list.length) {
    // enrollments 는 unshift 로 쌓여 최신이 앞이다. 정산은 오래된 것부터 1차·2차로 센다.
    return list.slice().reverse().map((enrollment, idx) => ({ ...enrollment, sessionNumber: idx + 1 }));
  }
  const prices = calculatePrices(s);
  const savedFees = s?.courseRegistrationFees || {};
  // 코스 등록 이력이 없는 학생은 청구액이 s.fees 에만 있다. 등록금/기타 비용을 여기서 살려낸다
  // (0 은 유효한 값이라 ?? 로는 못 넘긴다 — 합성 시점에 한 번만 정한다).
  const feeRows = Array.isArray(s?.fees) ? s.fees : [];
  const isRegFee = f => /등록|입학|Registration/i.test(f.item || '');
  const registrationFromFees = feeRows.filter(isRegFee).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  const localFromFees = feeRows.filter(f => !isRegFee(f)).reduce((sum, f) => sum + Number(f.amount || 0), 0);
  return [{
    id: 'current',
    synthesized: true,
    sessionNumber: 1,
    course: s?.course || '',
    startDate: s?.startDate || '',
    endDate: s?.endDate || '',
    duration: s?.duration || 0,
    segments: Array.isArray(s?.courseSegments) ? s.courseSegments : [],
    dormSegments: Array.isArray(s?.dormSegments) ? s.dormSegments : [],
    dorm: s?.dorm || '',
    registrationAmount: Number(savedFees.registration || registrationFromFees || prices.registration || 0),
    tuitionAmount: Number(savedFees.tuition || prices.tuition || 0),
    dormAmount: isStudentWalkIn(s) ? 0 : Number(savedFees.dorm || prices.dorm || 0),
    extrasTotal: Number(savedFees.extras || localFromFees || 0),
    extraItems: Array.isArray(savedFees.extraItems) ? savedFees.extraItems : [],
    billingItemStatuses: s?.billingItemStatuses,
    commissionItemStatuses: s?.commissionItemStatuses,
  }];
}

// 납부 상태처럼 값을 '쓰는' 쪽은 사본이 아니라 원본을 잡아야 한다.
// getBillingEnrollments() 는 sessionNumber 를 붙이려고 전개 복사본을 돌려주므로 거기에 쓰면 사라진다.
// 합성 차수(코스 등록 이력이 없는 학생)라면 학생 레코드 자체가 원본이다.
function getBillingEnrollmentRecord(s, enrollmentId) {
  const found = (s.enrollments || []).find(e => String(e.id) === String(enrollmentId));
  return found || s;
}

function getBillingEnrollment(s, enrollmentId) {
  const list = getBillingEnrollments(s);
  return list.find(e => String(e.id) === String(enrollmentId)) || list[list.length - 1] || null;
}

// 한 차수의 청구 항목 — 등록금 1줄, 수강 구간마다 1줄, 기숙사 구간마다 1줄, 기타 비용 1줄.
// 구간이 없으면(구형·합성 데이터) 차수 합계로 한 줄만 만든다.
function getEnrollmentBillingRows(s, enrollment) {
  if (!enrollment) return [];
  const prices = calculatePrices(s);
  const savedFees = s?.courseRegistrationFees || {};
  const registrationFromFees = Array.isArray(s?.fees)
    ? s.fees.filter(f => /등록|Registration/i.test(f.item || '')).reduce((sum, f) => sum + Number(f.amount || 0), 0)
    : 0;
  const localFromFees = Array.isArray(s?.fees)
    ? s.fees.filter(f => !/등록|Registration/i.test(f.item || '')).reduce((sum, f) => sum + Number(f.amount || 0), 0)
    : 0;

  const period = seg => [seg?.startDate, seg?.endDate].filter(Boolean).map(d => String(d).replace(/^20/, '').replace(/-/g, '.')).join(' ~ ');
  const rows = [];

  // 등록금 — 차수마다 다시 받는다(운영 확정). 학생당 1회가 아니다.
  rows.push({
    key: 'reg', group: 'registration', label: '등록금', sub: `${enrollment.sessionNumber}차 수강 등록`,
    amount: Number(enrollment.registrationAmount ?? savedFees.registration ?? registrationFromFees ?? prices.registration ?? 0),
  });

  // 수강료 — 구간마다. 차수 안에서 연장하면 여기에 줄이 하나 붙는다.
  const segs = Array.isArray(enrollment.segments) ? enrollment.segments.filter(Boolean) : [];
  if (segs.length) {
    segs.forEach((seg, idx) => rows.push({
      key: `edu:${seg.id ?? idx}`, group: 'education',
      label: seg.course || enrollment.course || '수강료',
      sub: `${period(seg) || '-'}${seg.duration ? ` · ${seg.duration}주` : ''}`,
      extension: idx > 0,
      amount: Number(seg.tuitionAmount || 0),
    }));
  } else {
    rows.push({
      key: 'edu:0', group: 'education', label: enrollment.course || '수강료',
      sub: `${period(enrollment) || '-'}${enrollment.duration ? ` · ${enrollment.duration}주` : ''}`,
      amount: Number(enrollment.tuitionAmount ?? savedFees.tuition ?? prices.tuition ?? 0),
    });
  }

  // 기숙사 — 수강과 별개로 늘어날 수 있어 구간을 따로 센다(운영 확정).
  const dormSegs = Array.isArray(enrollment.dormSegments) ? enrollment.dormSegments.filter(Boolean) : [];
  if (dormSegs.length) {
    dormSegs.forEach((seg, idx) => rows.push({
      key: `dorm:${seg.id ?? idx}`, group: 'dorm',
      label: [seg.accomType, seg.capacity ? `${seg.capacity}인실` : ''].filter(Boolean).join(' · ') || '기숙사비',
      sub: `${period(seg) || '-'}${seg.duration ? ` · ${seg.duration}주` : ''}`,
      extension: idx > 0,
      amount: Number(seg.cost || 0),
    }));
  } else {
    rows.push({
      key: 'dorm:0', group: 'dorm', label: enrollment.dorm || '기숙사비', sub: '기숙사 배정 기준',
      amount: isStudentWalkIn(s) ? 0 : Number(enrollment.dormAmount ?? savedFees.dorm ?? prices.dorm ?? 0),
    });
  }

  const extraItems = Array.isArray(enrollment.extraItems) ? enrollment.extraItems : [];
  const localAmount = Number(enrollment.extrasTotal ?? savedFees.extras ?? localFromFees ?? 0);
  rows.push({
    key: 'local', group: 'local', label: '기타 비용', sub: '기타 현지 비용',
    amount: localAmount,
    commissionBase: extraItems.length
      ? extraItems
          .filter(item => !/등록금|Registration/i.test(item.name || item.label || '') && item.commissionEnabled !== false)
          .reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : localAmount,
  });

  return decorateBillingRows(s, enrollment, rows);
}

// 커미션·납부 상태를 붙인다. 커미션 정책은 4개 그룹 단위라 구간마다 나눠 적용한다.
// 정액(fixed)은 그룹에 한 번만 붙인다 — 구간마다 붙이면 연장할 때마다 커미션이 배로 늘어난다.
function decorateBillingRows(s, enrollment, rows) {
  const commissionPolicies = getAgencyCommissionPolicyItems(s);
  const normalize = status => status === 'paid' ? 'paid' : 'unpaid';
  const itemStatuses = enrollment.billingItemStatuses || {};
  const commissionStatuses = enrollment.commissionItemStatuses || {};
  const legacyItemStatuses = s?.billingItemStatuses || {};
  const legacyCommissionStatuses = s?.commissionItemStatuses || {};
  const defaultPaid = s?.remittanceStatus === 'paid' ? 'paid' : 'unpaid';
  const defaultCommission = s?.commissionStatus === 'paid' || s?.commissionPaid ? 'paid' : 'unpaid';
  const fixedUsed = {};

  return rows.map(row => {
    const policy = commissionPolicies[row.group] || { type: 'none', value: 0, rate: 0 };
    let commission = 0;
    if (policy.type === 'fixed') {
      if (!fixedUsed[row.group] && row.amount > 0) {
        commission = calculateAgencyItemCommission(row.commissionBase ?? row.amount, policy);
        fixedUsed[row.group] = true;
      }
    } else {
      commission = calculateAgencyItemCommission(row.commissionBase ?? row.amount, policy);
    }
    // 차수에 상태가 없으면 학생 단위 값으로 떨어진다 — 코스 등록 이전에 쌓인 데이터를 위한 폴백.
    const paid = itemStatuses[row.key] ?? legacyItemStatuses[row.group] ?? defaultPaid;
    const comm = commissionStatuses[row.key] ?? legacyCommissionStatuses[row.group] ?? defaultCommission;
    return {
      ...row,
      enrollmentId: enrollment.id,
      commission,
      commissionRate: policy.rate || 0,
      commissionType: policy.type,
      commissionValue: policy.value || 0,
      paymentStatus: normalize(paid),
      commissionStatus: commission > 0 ? normalize(comm) : 'none',
    };
  });
}

// 학생 단위 4항목 요약. 에이전시 목록·월별 정산·학생 팝업이 쓰는 기존 계약을 그대로 지키되,
// 이제 마지막 등록분만이 아니라 모든 차수를 합산한다.
function getStudentBillingBreakdown(s) {
  const commissionPolicies = getAgencyCommissionPolicyItems(s);
  const allRows = getBillingEnrollments(s).flatMap(enrollment => getEnrollmentBillingRows(s, enrollment));
  const groups = [
    { key: 'registration', label: '등록금' },
    { key: 'education', label: '수강료' },
    { key: 'dorm', label: '기숙사비' },
    { key: 'local', label: '기타 비용' },
  ];
  const items = groups.map(group => {
    const mine = allRows.filter(row => row.group === group.key);
    const amount = mine.reduce((sum, row) => sum + row.amount, 0);
    const commission = mine.reduce((sum, row) => sum + row.commission, 0);
    const policy = commissionPolicies[group.key] || { type: 'none', value: 0, rate: 0 };
    return {
      key: group.key, label: group.label, amount, commission,
      commissionRate: policy.rate || 0,
      commissionType: policy.type,
      commissionValue: policy.value || 0,
      // 한 줄이라도 미납이면 그룹은 미납이다.
      paymentStatus: mine.some(row => row.amount > 0 && row.paymentStatus !== 'paid') ? 'unpaid' : 'paid',
      commissionStatus: commission > 0
        ? (mine.some(row => row.commission > 0 && row.commissionStatus !== 'paid') ? 'unpaid' : 'paid')
        : 'none',
      rows: mine,
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

// 같은 그룹(수강료·기숙사비)에 줄이 둘 이상이면 구간으로 나뉜 것이라 소제목을 얹고 들여쓴다.
// 한 줄뿐이면 예전처럼 평평하게 둔다 — 연장이 없는 학생 화면이 괜히 복잡해지지 않게.
function isBillingSegmentRow(rows, row) {
  return rows.filter(item => item.group === row.group).length > 1;
}

function renderBillingGroupHeading(rows, row) {
  if (!isBillingSegmentRow(rows, row)) return '';
  const mine = rows.filter(item => item.group === row.group);
  if (mine[0].key !== row.key) return '';
  const label = { education: '수강료', dorm: '기숙사비', registration: '등록금', local: '기타 비용' }[row.group] || row.group;
  const total = mine.reduce((sum, item) => sum + item.amount, 0);
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:4px 0 -2px;font-size:11px;font-weight:800;color:#374151">
    <span>${label}</span><span style="color:#9CA3AF;font-weight:700">$${total.toLocaleString()}</span>
  </div>`;
}

function renderAgencyPaidBadge(status) {
  const paid = status === 'paid';
  return `<span class="tsa-badge ${paid ? 'tsa-badge-success' : 'tsa-badge-danger'}" style="font-size:10px">${paid ? '완납' : '미납'}</span>`;
}

function renderAgencyCommissionBadge(status) {
  const paid = status === 'paid';
  return `<span class="tsa-badge ${paid ? 'tsa-badge-success' : 'tsa-badge-danger'}" style="font-size:10px">${paid ? '지급' : '미지급'}</span>`;
}

// ===== 인보이스 발행/추가 발행/발행 취소/재발행/수정(차액) 발행 =====
// 항목마다 발행 시점이 달라, 발행 여부는 인보이스가 아니라 항목이 갖는다(계산해서 얻는다).
// 발행 취소된 문서는 지우지 않고 사유와 함께 이력에 남긴다.

// 기준 인보이스에 포함된 모든 항목이 현재 완납 상태인지 확인 (결제 전/후 액션 분기용)
function isBaseInvoiceFullyPaid(s, invoice) {
  if (!invoice) return false;
  const rows = getEnrollmentBillingRows(s, getBillingEnrollment(s, invoice.enrollmentId));
  return invoice.items.every(item => {
    const billed = rows.find(row => row.key === item.key);
    return billed && billed.paymentStatus === 'paid';
  });
}

function nextInvoiceSeq(s) {
  return (s.invoices || []).length + 1;
}

// 항목이 어느 인보이스에 실렸는지는 항목 쪽에 저장하지 않고 인보이스에서 되찾는다.
// 항목에도 상태를 적어두면 발행 취소·재발행 때마다 두 곳을 맞춰야 하고,
// 한 번 어긋나면 어느 쪽이 맞는지 알 방법이 없다. 진실은 인보이스 하나만 갖는다.
function getItemActiveInvoice(s, key, enrollmentId) {
  return (s.invoices || []).find(inv =>
    inv.status === 'issued' && inv.type !== 'amendment'
    && (enrollmentId === undefined || String(inv.enrollmentId) === String(enrollmentId))
    && (inv.items || []).some(item => item.key === key)) || null;
}

// 한 차수에 속한(취소되지 않은) 기준 인보이스들.
function getEnrollmentInvoices(s, enrollmentId) {
  return (s.invoices || []).filter(inv =>
    inv.type !== 'amendment' && String(inv.enrollmentId) === String(enrollmentId));
}

// 금액이 0인 항목은 청구할 것이 없으므로 처음부터 발행 대상이 아니다.
// 「미발행」으로 남겨두면 영영 끝나지 않은 것처럼 보인다.
function isBillableBillingItem(item) {
  return Number(item.amount) > 0;
}

// 정산 탭이 쓰는 발행 현황 한 덩어리 — 항목별 발행 여부와 발행/미발행 합계.
// 합계를 셋으로 가르는 이유: 청구 총액만 보여주면 실제로 나간 금액이 얼마인지 화면에 드러나지 않는다.
function getInvoiceIssueSummary(s, enrollmentArg) {
  const enrollment = enrollmentArg && typeof enrollmentArg === 'object'
    ? enrollmentArg
    : getBillingEnrollment(s, enrollmentArg ?? currentAdetailEnrollmentId);
  const rows = getEnrollmentBillingRows(s, enrollment).map(row => {
    const billable = isBillableBillingItem(row);
    const invoice = billable ? getItemActiveInvoice(s, row.key, enrollment.id) : null;
    return { ...row, billable, invoice, issued: !!invoice };
  });
  const sum = list => list.reduce((total, row) => total + row.amount, 0);
  // 학생 전체 합계는 차수를 가로질러 따로 센다 — 화면 아래 한 줄이 이 값을 쓴다.
  const allEnrollments = getBillingEnrollments(s).map(item => {
    const itemRows = getEnrollmentBillingRows(s, item).map(row => ({
      ...row,
      issued: isBillableBillingItem(row) && !!getItemActiveInvoice(s, row.key, item.id),
    }));
    return {
      enrollment: item,
      gross: sum(itemRows),
      issuedTotal: sum(itemRows.filter(row => row.issued)),
      unissuedTotal: sum(itemRows.filter(row => isBillableBillingItem(row) && !row.issued)),
    };
  });
  return {
    enrollment,
    enrollments: allEnrollments,
    rows,
    issuable: rows.filter(row => row.billable && !row.issued),
    issuedTotal: sum(rows.filter(row => row.issued)),
    unissuedTotal: sum(rows.filter(row => row.billable && !row.issued)),
    grossTotal: sum(rows),
    studentTotal: allEnrollments.reduce((total, item) => total + item.gross, 0),
    breakdown: getStudentBillingBreakdown(s),
  };
}

// 발행 종류. 처음이면 정발행, 살아 있는 인보이스가 이미 있으면 추가 발행,
// 전부 취소된 뒤 다시 내는 것이면 재발행이다.
function getNextInvoiceType(s, enrollmentId) {
  const list = getEnrollmentInvoices(s, enrollmentId);
  if (!list.length) return 'issue';
  return list.some(inv => inv.status === 'issued') ? 'additional' : 'reissue';
}

// 수정(차액) 발행 대상 — 완납된 기준 인보이스 중 가장 최근 것.
// 미발행 항목은 금액을 그냥 고치면 되므로 차액 발행이 필요 없다.
function getAmendableInvoice(s, enrollmentId) {
  const list = getEnrollmentInvoices(s, enrollmentId)
    .filter(inv => inv.status === 'issued' && isBaseInvoiceFullyPaid(s, inv));
  return list.length ? list[list.length - 1] : null;
}

const INVOICE_TYPE_LABEL = { issue: '정발행', additional: '추가 발행', reissue: '재발행', amendment: '수정(차액)' };

// 발행 이력 표에 쓰는 인보이스별 결제 상태. 정발행/재발행은 청구 항목, 수정(차액) 인보이스는
// 차액 대상 항목의 현재 납부 여부(항목별 paymentStatus, 납부 내역 관리 승인 결과)를 기준으로 판정한다.
// 발행 취소된 건은 이미 "취소됨" 배지로 상태를 표시하므로 결제 상태는 계산하지 않는다.
function getInvoicePaymentStatus(s, invoice) {
  if (invoice.status === 'void') return null;
  const keys = invoice.type === 'amendment'
    ? (invoice.deltaItems || []).map(item => item.key)
    : invoice.items.map(item => item.key);
  if (!keys.length) return null;
  const rows = getEnrollmentBillingRows(s, getBillingEnrollment(s, invoice.enrollmentId));
  const paidCount = keys.filter(key => rows.find(row => row.key === key)?.paymentStatus === 'paid').length;
  if (paidCount === 0) return 'unpaid';
  if (paidCount === keys.length) return 'paid';
  return 'partial';
}

function renderInvoicePaymentStatusBadge(status) {
  if (status === 'paid') return '<span class="tsa-badge tsa-badge-success">완납</span>';
  if (status === 'partial') return '<span class="tsa-badge tsa-badge-warning">부분납</span>';
  if (status === 'unpaid') return '<span class="tsa-badge tsa-badge-danger">미납</span>';
  return '<span style="font-size:10px;color:#9CA3AF">-</span>';
}

// 정산 탭/에이전시 허브 탭을 현재 상태 그대로 다시 그린다 (기존 submitRemittanceReceipt와 동일 패턴)
function reopenSettleTab(studentId) {
  APP._invoiceViewingId = null;
  if (document.getElementById('adetail-page-enrollment-content')) {
    switchAgencyEnrollmentHubTab('settle');
  } else {
    switchAdetailTab('settle', undefined, studentId);
  }
}

function issueOrReissueInvoice(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;
  // 같은 항목이 두 인보이스에 실리면 청구 금액이 이중이 된다.
  // 그래서 화면에서 체크박스를 감추는 데 그치지 않고, 후보 자체를 issuable(미발행·청구 대상)에서만 고른다.
  // 화면에 남아 있던 낡은 체크박스를 눌러도 여기서 걸러진다.
  const summary = getInvoiceIssueSummary(s);
  const enrollment = summary.enrollment;
  const checkedItems = summary.issuable.filter(item => document.getElementById(`inv-check-${item.key}`)?.checked);
  if (!checkedItems.length) { showToast('발행할 청구 항목을 하나 이상 선택해 주세요.', 'warning'); return; }

  if (!s.invoices) s.invoices = [];
  const seq = nextInvoiceSeq(s);
  const type = getNextInvoiceType(s, enrollment.id);
  const items = checkedItems.map(item => ({ key: item.key, label: item.label, amount: item.amount }));
  const gross = items.reduce((sum, item) => sum + item.amount, 0);
  const invoice = {
    id: `${studentId}-${Date.now()}`,
    seq,
    type,
    status: 'issued',
    // 인보이스는 차수에 속한다. 번호는 학생 단위 연번을 그대로 쓰고,
    // 어느 차수의 것인지는 발행 이력 표의 「차수」 열이 알려준다.
    enrollmentId: enrollment.id,
    enrollmentLabel: `${enrollment.sessionNumber}차 수강`,
    enrollmentCourse: enrollment.course || '',
    invoiceNo: `TSA-${studentId}-${seq}`,
    issueDate: new Date().toISOString().slice(0, 10),
    issuedBy: stayCurrentActor(),
    items,
    gross,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    baseInvoiceId: null,
    deltaItems: null,
    deltaTotal: null,
  };
  s.invoices.push(invoice);

  const itemLabels = items.map(item => item.label).join(' · ');
  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[인보이스 ${INVOICE_TYPE_LABEL[type]}] ${s.name} 학생 ${enrollment.sessionNumber}차 수강 인보이스(${invoice.invoiceNo})가 ${stayCurrentActor()}에 의해 발행되었습니다. 포함 항목: ${itemLabels}`,
    type: 'info',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✅ ${invoice.invoiceNo} (${enrollment.sessionNumber}차 수강 · ${INVOICE_TYPE_LABEL[type]}) 인보이스가 발행되었습니다 — ${itemLabels}.`, 'success');
  reopenSettleTab(studentId);
}

// 발행 취소는 인보이스 한 건을 지목해서 한다. 등록금 인보이스와 수강료 인보이스가
// 동시에 살아 있을 수 있어 "지금 활성인 그 한 장"이라는 것이 성립하지 않는다.
// 문서는 지우지 않고 사유와 함께 이력에 남긴다 — 그래서 이름도 '폐기'가 아니라 '발행 취소'다.
function cancelInvoice(studentId, invoiceId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;
  const invoice = (s.invoices || []).find(inv => inv.id === invoiceId);
  if (!invoice) return;
  if (invoice.status === 'void') { showToast('이미 발행 취소된 인보이스입니다.', 'warning'); return; }

  const itemLabels = (invoice.items || []).map(item => item.label).join(' · ');
  const backNote = invoice.type === 'amendment' ? '' : `\n포함 항목(${itemLabels})은 「미발행」으로 돌아갑니다.`;
  if (!window.confirm(`${invoice.invoiceNo} (${invoice.seq}차) 발행을 취소할까요?${backNote}\n문서는 이력에 그대로 남습니다.`)) return;

  const reason = prompt('발행 취소 사유를 입력하십시오:');
  if (reason === null) return;
  if (!reason.trim()) { showToast('발행 취소 사유를 입력해 주세요.', 'warning'); return; }

  invoice.status = 'void';
  invoice.voidedAt = new Date().toISOString().slice(0, 10);
  invoice.voidedBy = stayCurrentActor();
  invoice.voidReason = reason.trim();

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[인보이스 발행 취소] ${s.name} 학생 ${invoice.seq}차 인보이스(${invoice.invoiceNo}) 발행이 ${stayCurrentActor()}에 의해 취소되었습니다. 사유: ${reason.trim()}`,
    type: 'warning',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`${invoice.invoiceNo} 발행이 취소되었습니다.`, 'success');
  reopenSettleTab(studentId);
}

function issueAmendmentInvoice(studentId) {
  const s = MOCK_STUDENTS.find(std => std.id === studentId);
  if (!s) return;
  const base = getAmendableInvoice(s);
  if (!base) {
    showToast('완납된 기준 인보이스가 있을 때만 수정 인보이스를 발행할 수 있습니다.', 'warning');
    return;
  }

  const deltaItems = [];
  base.items.forEach(item => {
    const input = document.getElementById(`inv-amend-${item.key}`);
    if (!input) return;
    const newAmount = parseFloat(input.value || 0);
    const previousAmount = Number(item.amount);
    const diff = newAmount - previousAmount;
    if (Math.abs(diff) > 0.001) {
      deltaItems.push({ key: item.key, label: item.label, previousAmount, newAmount, diff });
    }
  });

  if (!deltaItems.length) { showToast('변경된 금액이 없습니다.', 'warning'); return; }

  const seq = nextInvoiceSeq(s);
  const deltaTotal = deltaItems.reduce((sum, item) => sum + item.diff, 0);
  const invoice = {
    id: `${studentId}-${Date.now()}`,
    seq,
    type: 'amendment',
    status: 'issued',
    invoiceNo: `TSA-${studentId}-${seq}A`,
    issueDate: new Date().toISOString().slice(0, 10),
    issuedBy: stayCurrentActor(),
    items: deltaItems.map(item => ({ key: item.key, label: item.label, amount: item.diff })),
    gross: deltaTotal,
    voidedAt: null,
    voidedBy: null,
    voidReason: null,
    baseInvoiceId: base.id,
    deltaItems,
    deltaTotal,
  };
  s.invoices.push(invoice);

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[수정 인보이스 발행] ${s.name} 학생 ${seq}차 수정 인보이스(${invoice.invoiceNo})가 ${stayCurrentActor()}에 의해 발행되었습니다. 차액 ${deltaTotal >= 0 ? '+' : ''}$${deltaTotal.toLocaleString()}`,
    type: 'info',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✅ ${invoice.invoiceNo} 수정 인보이스가 발행되었습니다 (차액 ${deltaTotal >= 0 ? '+' : ''}$${deltaTotal.toLocaleString()}).`, 'success');
  reopenSettleTab(studentId);
}

function viewInvoiceHistoryDocument(studentId, invoiceId) {
  APP._invoiceViewingId = invoiceId;
  renderAgencyInlineDocument(studentId, 'invoice');
}

// 정산 탭 우측 "공식 인보이스" 패널 전체 — 발행 액션과 발행 이력을 조립한다.
// 좌측 패널은 발행(첫 발행/추가 발행)과 완납 건의 수정(차액) 발행만 맡고,
// 발행 취소·보기처럼 인보이스 한 건을 지목하는 동작은 아래 발행 이력 표에 있다.
// 발행 액션은 "아직 안 나간 항목을 내보내는 것" 하나만 남긴다.
// 발행 취소·보기처럼 인보이스 한 건을 지목하는 동작은 전부 아래 발행 이력 표가 맡는다.
function renderInvoiceActionPanel(s) {
  const summary = getInvoiceIssueSummary(s);
  const enrollment = summary.enrollment;
  const amendable = getAmendableInvoice(s, enrollment.id);
  const type = getNextInvoiceType(s, enrollment.id);
  // 미납이어도 청구는 나가야 한다(운영 확정). 대신 무엇이 남아 있는지 옆에 알려준다.
  const unpaid = summary.rows
    .filter(row => row.issued && row.paymentStatus !== 'paid')
    .reduce((sum, row) => sum + row.amount, 0);

  const issueHtml = summary.issuable.length ? `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px">
        <div style="font-size:10.5px;color:#6B7280">선택한 항목이 <strong style="color:#4338CA">한 장</strong>으로 발행됩니다. 발행된 항목은 이 목록에서 잠깁니다.${unpaid ? `<br><span style="color:#B45309;font-weight:700">이 차수에 미납 $${unpaid.toLocaleString()}이 남아 있습니다 — 발행은 그대로 진행됩니다.</span>` : ''}</div>
        <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="white-space:nowrap" type="button" onclick="issueOrReissueInvoice(${s.id})">
          <i data-lucide="file-plus-2"></i> ${type === 'issue' ? '인보이스 발행' : type === 'reissue' ? '인보이스 재발행' : '선택 항목 추가 발행'}
        </button>
      </div>` : `
      <div style="margin-top:12px;padding:10px 12px;border:1px solid #A7F3D0;border-radius:9px;background:#ECFDF5;font-size:11.5px;color:#065F46">
        ${enrollment.sessionNumber}차 수강의 청구 항목이 모두 발행됐습니다. 항목을 바꾸려면 아래 발행 이력에서 해당 인보이스의 <strong>발행 취소</strong>를 누르세요.
      </div>`;

  if (!amendable) return issueHtml;

  return `${issueHtml}
    <div style="border:1px solid #C7D2FE;border-radius:10px;padding:14px;background:#F8F9FF;margin-top:16px">
      <div style="font-weight:700;font-size:12.5px;color:#3730A3;margin-bottom:4px">수정 인보이스 발행 (결제 완료 · ${amendable.seq}차 기준 차액 청구/환불)</div>
      <div style="font-size:10.5px;color:#6B7280;margin-bottom:10px">금액을 수정한 항목만 차액으로 새로 발행됩니다. 완납된 원본 인보이스(${amendable.invoiceNo})는 그대로 보존됩니다.</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px">
        ${amendable.items.map(item => `
          <div style="display:grid;grid-template-columns:1fr 90px 100px;gap:8px;align-items:center;padding:8px 10px;background:#fff;border:1px solid #E5E7EB;border-radius:8px;font-size:12px">
            <span style="font-weight:700;color:#374151">${item.label}</span>
            <span style="text-align:right;color:#9CA3AF;font-size:10.5px">기존 $${item.amount.toLocaleString()}</span>
            <input type="number" id="inv-amend-${item.key}" class="tsa-input" style="font-size:11.5px;padding:5px 8px;text-align:right" value="${item.amount}"/>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button class="tsa-btn tsa-btn-primary tsa-btn-sm" type="button" onclick="issueAmendmentInvoice(${s.id})">
          <i data-lucide="file-diff"></i> 수정 인보이스 발행(차액)
        </button>
      </div>
    </div>`;
}

// 우측 패널: 발행된 인보이스 문서 미리보기 전용 (발행 시 이 영역에 결과가 표시된다)
function renderInvoiceDocumentPanel(s) {
  return `
    <div style="font-size:13px;font-weight:800;color:#111827;margin-bottom:10px">공식 인보이스 (Invoice)</div>
    <div style="height:560px;overflow:auto;border:1px solid #E9EDF4;border-radius:10px;background:#FAFAFA">
      <div id="agency-inline-doc-content" style="zoom:.68;padding:20px;min-height:700px;position:relative;overflow:hidden"></div>
    </div>
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:12px">
      <button class="tsa-btn tsa-btn-outline tsa-btn-sm" type="button" onclick="openAgencyDocumentsInline(${s.id}, 'invoice')">크게 보기</button>
      <button class="tsa-btn tsa-btn-primary tsa-btn-sm" type="button" onclick="printAgencyInlineDocument()"><i data-lucide="printer"></i> 인쇄하기 (Print)</button>
    </div>
  `;
}

// 하단 전체 폭 패널: 발행 이력 (1차/2차 등 차수, 종류, 발행일, 상태를 한눈에 확인)
function renderInvoiceHistoryPanel(s) {
  const history = (s.invoices || []).slice().reverse();

  const historyHtml = history.length ? `
    <table class="tsa-table" style="font-size:11px;margin-top:2px">
      <thead><tr><th>No</th><th>차수</th><th>종류</th><th>포함 항목</th><th>발행일</th><th>발행자</th><th style="text-align:right">금액</th><th style="text-align:center">상태</th><th style="text-align:center">결제 상태</th><th style="text-align:center">동작</th></tr></thead>
      <tbody>
        ${history.map(inv => `
          <tr${inv.status === 'void' ? ' style="color:#9CA3AF"' : ''}>
            <td>${inv.seq}차</td>
            <td>${inv.enrollmentLabel ? `${escapeStudentPopupHtml(inv.enrollmentLabel)}${inv.enrollmentCourse ? `<div style="font-size:9.5px;color:#9CA3AF">${escapeStudentPopupHtml(inv.enrollmentCourse)}</div>` : ''}` : '-'}</td>
            <td>${INVOICE_TYPE_LABEL[inv.type] || inv.type}</td>
            <td>${(inv.items || []).map(item => item.label).join(' · ') || '-'}</td>
            <td>${inv.issueDate}</td>
            <td>${inv.issuedBy || '-'}</td>
            <td style="text-align:right;font-weight:700">${inv.type === 'amendment' ? `${inv.deltaTotal >= 0 ? '+' : ''}$${Number(inv.deltaTotal).toLocaleString()}` : `$${Number(inv.gross).toLocaleString()}`}</td>
            <td style="text-align:center">${inv.status === 'void' ? `<span class="tsa-badge tsa-badge-gray" title="취소 사유: ${inv.voidReason || '-'} (${inv.voidedAt || '-'} · ${inv.voidedBy || '-'})">취소됨</span>` : '<span class="tsa-badge tsa-badge-success">발행중</span>'}</td>
            <td style="text-align:center">${renderInvoicePaymentStatusBadge(getInvoicePaymentStatus(s, inv))}</td>
            <td style="text-align:center;white-space:nowrap">
              <button class="tsa-btn tsa-btn-outline tsa-btn-xs" type="button" onclick="viewInvoiceHistoryDocument(${s.id}, '${inv.id}')">보기</button>
              ${inv.status === 'issued' ? `<button class="tsa-btn tsa-btn-outline tsa-btn-xs" style="color:#DC2626;border-color:#FCA5A5;margin-left:4px" type="button" onclick="cancelInvoice(${s.id}, '${inv.id}')">발행 취소</button>` : ''}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>` : `<div style="text-align:center;padding:14px;color:#9CA3AF;font-size:11.5px">발행된 인보이스가 없습니다.</div>`;

  return `
    <div style="border:1px solid #E9EDF4;border-radius:10px;padding:16px;background:#FAFAFA">
      <div style="font-size:12.5px;font-weight:700;color:#1E3A8A;margin-bottom:10px">🧾 인보이스 발행 이력</div>
      ${historyHtml}
    </div>
  `;
}

// 인보이스 문서 뷰어(모달/정산 탭 인라인 미리보기 공용)에 표시할 인보이스를 결정한다.
// 발행 이력에서 특정 건을 "보기"로 선택했으면 그 건을, 아니면 가장 최근 발행 건을 보여준다.
function getDisplayInvoice(std) {
  const list = std.invoices || [];
  if (APP._invoiceViewingId) {
    const found = list.find(inv => inv.id === APP._invoiceViewingId);
    if (found) return found;
  }
  return list.length ? list[list.length - 1] : null;
}

// 발행된 인보이스 스냅샷을 문서 형태로 렌더링한다. 실시간 재계산이 아니라
// 발행 당시 저장된 items 스냅샷만 사용해 발행 시점 금액이 이후 변경에 영향받지 않게 한다.
function renderInvoiceDocumentSnapshot(invoice, std) {
  if (!invoice) {
    return `
      <div style="max-width:920px;margin:0 auto;padding:60px 20px;text-align:center;color:#9CA3AF;border:1px dashed #CBD5E1;border-radius:10px">
        <div style="font-size:14px;font-weight:800;margin-bottom:6px;color:#6B7280">발행된 인보이스가 없습니다</div>
        <div style="font-size:11.5px">정산 탭에서 청구 항목을 선택하고 인보이스를 발행해 주세요.</div>
      </div>`;
  }

  const route = std.remittanceRoute || std.enrollments?.[0]?.remittanceRoute || 'agency';
  const routeLabel = getRemittanceRouteLabel(route);
  const isAmendment = invoice.type === 'amendment';
  const typeLabelKo = INVOICE_TYPE_LABEL[invoice.type] || invoice.type;
  const statusNote = invoice.status === 'void'
    ? `<div style="margin-top:8px;text-align:right"><span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#FEE2E2;color:#B91C1C;font-weight:900">VOIDED · 발행 취소됨 (${invoice.voidedAt})</span></div>`
    : '';

  const baseInvoice = isAmendment ? (std.invoices || []).find(inv => inv.id === invoice.baseInvoiceId) : null;

  const bodyHtml = isAmendment ? `
    <div style="font-size:12px;font-weight:900;color:#7C2D12;margin:0 0 8px">AMENDMENT DETAILS (기준: ${baseInvoice ? baseInvoice.invoiceNo : '-'})</div>
    <table style="width:100%;border-collapse:collapse;font-size:11.5px">
      <thead><tr style="background:#FFEDD5;color:#7C2D12"><th style="padding:9px 10px;text-align:left">항목</th><th style="padding:9px 10px;text-align:right">기존 금액</th><th style="padding:9px 10px;text-align:right">수정 금액</th><th style="padding:9px 10px;text-align:right">차액</th></tr></thead>
      <tbody>
        ${invoice.deltaItems.map(item => `
          <tr>
            <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB">${item.label}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB;text-align:right">$${item.previousAmount.toLocaleString()}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB;text-align:right">$${item.newAmount.toLocaleString()}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:900;color:${item.diff >= 0 ? '#DC2626' : '#047857'}">${item.diff >= 0 ? '+' : ''}$${item.diff.toLocaleString()}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin:12px 0 22px">
      <div style="width:280px;font-size:14px;display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #7C2D12">
        <strong>차액 합계 (${invoice.deltaTotal >= 0 ? '추가 청구' : '환불'})</strong>
        <strong style="color:${invoice.deltaTotal >= 0 ? '#DC2626' : '#047857'}">${invoice.deltaTotal >= 0 ? '+' : ''}$${Number(invoice.deltaTotal).toLocaleString()}</strong>
      </div>
    </div>
  ` : `
    <div style="font-size:12px;font-weight:900;color:#172554;margin:0 0 8px">USD BILLING DETAILS</div>
    <table style="width:100%;border-collapse:collapse;font-size:11.5px">
      <thead><tr style="background:#E0E7FF;color:#312E81"><th style="padding:9px 10px;text-align:left">항목</th><th style="padding:9px 10px;text-align:right">금액 (USD)</th></tr></thead>
      <tbody>
        ${invoice.items.map(item => `
          <tr>
            <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB">${item.label}</td>
            <td style="padding:9px 10px;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:800">$${item.amount.toLocaleString()}</td>
          </tr>`).join('')}
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin:12px 0 22px">
      <div style="width:280px;font-size:15px;display:flex;justify-content:space-between;padding:10px 0;border-top:2px solid #172554;color:#172554">
        <strong>총 청구액</strong><strong>$${Number(invoice.gross).toLocaleString()}</strong>
      </div>
    </div>
  `;

  return `
    <div style="max-width:920px;margin:0 auto;background:#fff;border:1px solid #DDE3EC;color:#1F2937;font-family:Arial, sans-serif">
      <div style="padding:24px 28px;background:${isAmendment ? '#7C2D12' : '#172554'};color:#fff;display:flex;justify-content:space-between;align-items:start">
        <div><div style="font-size:22px;font-weight:900;letter-spacing:1px">TALKSTATION ACADEMY</div><div style="font-size:11px;color:#BFDBFE;margin-top:5px">Cebu Campus · ${isAmendment ? 'Amendment Invoice (차액 청구/환불)' : 'Official Student Invoice'}</div></div>
        <div style="text-align:right"><div style="font-size:24px;font-weight:300;letter-spacing:2px">${isAmendment ? 'AMENDMENT' : 'INVOICE'}</div><div style="font-size:11px;color:#BFDBFE;margin-top:5px">${invoice.invoiceNo} · ${invoice.seq}차 발행 (${typeLabelKo})</div></div>
      </div>
      <div style="padding:24px 28px">
        <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px;margin-bottom:20px">
          <div><div style="font-size:10px;font-weight:800;color:#64748B;margin-bottom:7px">STUDENT INFORMATION</div><div style="font-size:16px;font-weight:900">${std.name}</div><div style="font-size:11.5px;line-height:1.7;color:#475569;margin-top:5px">Nick: ${std.nick} · ${std.nationality || '-'}<br>Passport: ${APP._invoiceRevealPassport ? (std.passportNum || 'N/A') : maskPassportNumber(std.passportNum, 'N/A')}<br>Agency: ${std.agency || 'Direct Student'}</div></div>
          <div style="font-size:11.5px;line-height:1.8">
            <div style="display:flex;justify-content:space-between"><span style="color:#64748B">Issue Date</span><strong>${invoice.issueDate}</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#64748B">Invoice No</span><strong>${invoice.invoiceNo}</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:#64748B">Payment Route</span><strong>${routeLabel}</strong></div>
            ${statusNote}
          </div>
        </div>
        ${bodyHtml}
        <div style="padding:13px 15px;background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;font-size:10.5px;line-height:1.7;color:#475569">
          <strong>IMPORTANT TERMS</strong><br>
          1. SSP, 비자 연장, ACR I-Card 등 정부 관련 비용은 현지 통화로 별도 청구될 수 있으며 고지 없이 변경될 수 있습니다.<br>
          2. 본 문서는 ${invoice.seq}차 발행 인보이스이며, 이전 차수 인보이스는 발행 이력에서 확인할 수 있습니다.<br>
          3. 취소 및 환불은 어학원 공식 환불 정책과 과정별 조건을 따릅니다.
        </div>
        <div style="display:flex;justify-content:space-between;align-items:end;margin-top:28px"><div style="font-size:10.5px;line-height:1.6;color:#64748B">TalkStation Academy · Cebu Campus<br>Official Student Billing Document</div><div style="width:190px;text-align:center;font-size:10.5px"><div style="height:30px;border-bottom:1px solid #334155;margin-bottom:6px"></div><strong>Authorized Signature / Seal</strong></div></div>
      </div>
    </div>`;
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
    <div style="width:100%;text-align:center;line-height:1.2">
      <div style="display:flex;align-items:center;justify-content:center;gap:4px;white-space:nowrap">
        <strong style="font-size:11.5px;color:#111827">$${amount.toLocaleString()}</strong>
        ${renderAgencyPaidBadge(item.paymentStatus)}
      </div>
      <div style="border-top:1px solid #E5E7EB;margin-top:4px;padding-top:4px;display:flex;justify-content:center;align-items:center;gap:3px;white-space:nowrap">
          <span style="font-size:10.5px;font-weight:800;color:${commission > 0 ? '#4F46E5' : '#9CA3AF'}">${commissionText}</span>
          <span style="font-size:9px;color:#9CA3AF">${commissionMeta}</span>
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
  return `
    <div style="font-size:11px;color:${balance > 0 ? '#DC2626' : '#059669'};background:${balance > 0 ? '#FEF2F2' : '#ECFDF5'};border:1px solid ${balance > 0 ? '#FECACA' : '#BBF7D0'};border-radius:8px;padding:8px 10px;margin-bottom:10px">
      현재 납부 상태: ${balance > 0 ? '미납' : '완납'} · 남은 어학원 송금액 $${balance.toLocaleString()}
    </div>
  `;
}

const COURSE_TYPE_THEME = {
  '1:1': { name: '1:1 개인 수업', border: '#A7F3D0', bg: '#ECFDF5', text: '#047857', textStrong: '#065F46', chipOn: '#059669' },
  '1:4': { name: '1:4 소그룹 수업', border: '#FED7AA', bg: '#FFF7ED', text: '#C2410C', textStrong: '#9A3412', chipOn: '#EA580C' },
  '1:8': { name: '1:8 중그룹 수업', border: '#C7D2FE', bg: '#EEF2FF', text: '#4338CA', textStrong: '#3730A3', chipOn: '#4338CA' },
};

function renderCourseClassTypeSections() {
  const container = document.getElementById('course-classtype-sections');
  if (!container) return;

  const types = [...MOCK_MASTER_CLASS_TYPES].filter(t => t.visible !== false).sort((a, b) => a.order - b.order);

  container.innerHTML = `
    <div class="tsa-form-group">
      <label class="tsa-label">유형별 과목 구성 <span style="color:#EF4444">*</span></label>
      <div style="font-size:10.5px;color:#6B7280;margin:3px 0 10px">필요한 과목을 클릭해서 켜. 실제 요일·시간·강사·그룹·강의실은 배정 단계에서 정해.</div>
      <div id="course-type-groups" style="display:flex;flex-direction:column;gap:10px"></div>
    </div>
    <div id="course-curriculum-preview" style="border:1px solid #C7D2FE;background:#EEF2FF;border-radius:10px;padding:13px">
    </div>
  `;
  const groupsEl = document.getElementById('course-type-groups');
  groupsEl.innerHTML = types.map(type => renderCourseTypeGroup(type.code)).join('');
}

function renderCourseTypeGroup(classType) {
  const theme = COURSE_TYPE_THEME[classType] || { name: classType, border: '#E5E7EB', bg: '#F9FAFB', text: '#4B5563', textStrong: '#111827', chipOn: '#4B5563' };
  const subjects = MOCK_MASTER_SUBJECTS.filter(s => s.visible !== false).sort((a, b) => a.order - b.order);
  const selected = _courseSubjectDraft[classType] || [];
  const totalHours = selected.reduce((sum, ref) => sum + (ref.hours || 1), 0);

  const chips = subjects.map(subject => {
    const ref = selected.find(item => item.id === subject.id);
    const on = !!ref;
    const hours = ref ? ref.hours : 1;
    return `
      <div class="course-subject-chip" style="display:flex;flex-direction:column;align-items:center;gap:3px">
        <button type="button" onclick="toggleCourseSubjectChip('${classType}','${subject.id}')"
          style="width:100%;border-radius:8px;padding:7px 4px;text-align:center;font-size:11.5px;font-weight:${on ? 800 : 600};cursor:pointer;border:1.3px solid ${on ? theme.chipOn : '#E5E7EB'};color:${on ? '#fff' : '#6B7280'};background:${on ? theme.chipOn : '#F9FAFB'}">
          ${subject.name}
        </button>
        ${on ? `
          <div style="display:flex;align-items:center;gap:4px;font-size:10px;color:${theme.text}">
            <button type="button" onclick="adjustCourseSubjectHours('${classType}','${subject.id}',-1)" style="width:16px;height:16px;border-radius:4px;border:1px solid ${theme.border};background:#fff;color:${theme.text};font-weight:800;line-height:1;cursor:pointer">-</button>
            <span style="font-weight:700;min-width:26px;text-align:center">${hours}시간</span>
            <button type="button" onclick="adjustCourseSubjectHours('${classType}','${subject.id}',1)" style="width:16px;height:16px;border-radius:4px;border:1px solid ${theme.border};background:#fff;color:${theme.text};font-weight:800;line-height:1;cursor:pointer">+</button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="type-group" style="border:1px solid ${theme.border};border-radius:10px;overflow:hidden">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 12px;background:${theme.bg}">
        <span style="font-size:12px;font-weight:800;color:${theme.text}">${theme.name}</span>
        <span style="font-size:11px;font-weight:700;color:${theme.textStrong}">총 ${totalHours}시간</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;padding:10px 12px 12px;background:#fff">
        ${chips}
      </div>
    </div>
  `;
}

function toggleCourseSubjectChip(classType, subjectId) {
  if (!_courseSubjectDraft[classType]) _courseSubjectDraft[classType] = [];
  const list = _courseSubjectDraft[classType];
  const idx = list.findIndex(ref => ref.id === subjectId);
  if (idx >= 0) list.splice(idx, 1);
  else list.push({ id: subjectId, hours: 1 });
  refreshCourseTypeGroup(classType);
}

function adjustCourseSubjectHours(classType, subjectId, delta) {
  const ref = (_courseSubjectDraft[classType] || []).find(item => item.id === subjectId);
  if (!ref) return;
  ref.hours = Math.max(1, Math.min(8, (ref.hours || 1) + delta));
  refreshCourseTypeGroup(classType);
}

function refreshCourseTypeGroup(classType) {
  const types = [...MOCK_MASTER_CLASS_TYPES].filter(t => t.visible !== false).sort((a, b) => a.order - b.order);
  const idx = types.findIndex(t => t.code === classType);
  const groupsEl = document.getElementById('course-type-groups');
  if (groupsEl && idx >= 0 && groupsEl.children[idx]) {
    groupsEl.children[idx].outerHTML = renderCourseTypeGroup(classType);
  }
  updateCourseCurriculumPreview();
}

function getCourseTimetableTemplate(course) {
  if (Array.isArray(course?.timetableTemplate) && course.timetableTemplate.length) {
    return course.timetableTemplate.map(item => ({
      classType: item.classType || item.type || '1:1',
      subjectId: item.subjectId || item.subject || '',
    }));
  }
  const rows = [];
  Object.entries(course?.subjectsByType || {}).forEach(([classType, refs]) => {
    (refs || []).forEach(ref => {
      const hours = Math.max(1, Number(ref?.hours) || 1);
      for (let index = 0; index < hours; index += 1) rows.push({ classType, subjectId: ref.id });
    });
  });
  if (!rows.length) {
    (course?.subjects || []).forEach(subject => {
      const subjectId = typeof subject === 'string' ? subject : subject.id;
      if (subjectId) rows.push({ classType: '1:1', subjectId });
    });
  }
  return rows;
}

function getCourseCurriculumDraft() {
  const subjectsByType = {};
  const classHours = { '1:1': 0, '1:4': 0, '1:8': 0 };
  Object.entries(_courseSubjectDraft).forEach(([classType, refs]) => {
    // 클릭한 순서가 아니라 과목 마스터의 고정 순서로 정렬해서, 저장할 때마다 결과가 흔들리지 않게 한다.
    subjectsByType[classType] = (refs || [])
      .map(ref => ({ id: ref.id, hours: Math.max(1, Number(ref.hours) || 1) }))
      .sort((a, b) => (MOCK_MASTER_SUBJECTS.find(s => s.id === a.id)?.order ?? 999) - (MOCK_MASTER_SUBJECTS.find(s => s.id === b.id)?.order ?? 999));
    classHours[classType] = subjectsByType[classType].reduce((sum, ref) => sum + ref.hours, 0);
  });
  return { subjectsByType, classHours };
}

function updateCourseCurriculumPreview() {
  const preview = document.getElementById('course-curriculum-preview');
  if (!preview) return;
  const courseName = document.getElementById('add-course-name')?.value.trim() || '과정명 미입력';
  const { subjectsByType, classHours } = getCourseCurriculumDraft();
  const selectedLevels = [...document.querySelectorAll('input[name="course-levels-cb"]:checked')]
    .map(cb => MOCK_MASTER_LEVELS.find(level => level.id === cb.value)?.name)
    .filter(Boolean);
  const types = [...MOCK_MASTER_CLASS_TYPES].filter(t => t.visible !== false).sort((a, b) => a.order - b.order);
  const totalDaily = Object.values(classHours).reduce((sum, value) => sum + value, 0);
  const compositionCode = `[${classHours['1:1'] || 0}/${classHours['1:4'] || 0}/${classHours['1:8'] || 0}]`;
  const hasAnySubject = Object.values(subjectsByType).some(refs => refs.length > 0);
  const typeSummary = types.map(type => {
    const refs = subjectsByType[type.code] || [];
    if (!refs.length) return '';
    const names = refs.map(ref => {
      const subject = MOCK_MASTER_SUBJECTS.find(subjectItem => subjectItem.id === ref.id);
      return `${subject?.name || ref.id}${ref.hours > 1 ? ` ${ref.hours}시간` : ''}`;
    }).join(', ');
    return `<span style="display:inline-flex;align-items:center;gap:4px;margin:5px 6px 0 0;padding:4px 7px;border-radius:6px;background:#fff;border:1px solid #DDE4FF">
      <strong>${getClassTypeDisplayName(type)}</strong> ${names}
    </span>`;
  }).join('');
  preview.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
      <div>
        <div style="font-size:11px;color:#4F46E5;font-weight:800">등록 결과 미리보기</div>
        <div style="font-size:13px;font-weight:800;color:#1F2937;margin-top:3px">${courseName}</div>
        <div style="font-size:10.5px;color:#4F46E5;font-weight:700;margin-top:4px">
          기본형 ${compositionCode} · 1:1 ${classHours['1:1'] || 0}시간 · 1:4 ${classHours['1:4'] || 0}시간 · 1:8 ${classHours['1:8'] || 0}시간
        </div>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;font-weight:800;color:#4338CA">총 ${totalDaily}시간</div>
        <div style="font-size:10px;color:#6B7280;margin-top:2px">실제 시간과 자원은 추후 배정</div>
      </div>
    </div>
    <div style="font-size:11px;color:#4B5563;margin-top:7px">
      추천레벨: ${selectedLevels.length ? selectedLevels.join(', ') : '-'}
      <div style="margin-top:4px">${hasAnySubject ? typeSummary : '<span style="color:#B45309">과목을 한 개 이상 선택해.</span>'}</div>
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

  const { subjectsByType, classHours } = getCourseCurriculumDraft();
  const curriculumRefs = Object.values(subjectsByType).flat();
  if (!curriculumRefs.length) {
    showToast('과목을 한 개 이상 선택해줘.', 'warning');
    return;
  }
  const subjects = [...new Set(curriculumRefs.map(ref => ref.id))].map(id => ({ id }));

  const existingCourse = _editingCourseIdx !== null ? MOCK_COURSES[_editingCourseIdx] : null;
  const type = existingCourse ? existingCourse.type : '일반 영어';
  const fee = existingCourse ? existingCourse.fee : 0;
  const active = existingCourse ? existingCourse.active !== false : true;

  const courseData = {
    name, type, fee,
    active, subjects, subjectsByType, classHours, levels,
    timetableTemplate: undefined, // 순서 개념을 없앴으므로 과거에 저장된 값이 있어도 subjectsByType을 우선하도록 비워둠
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
        <td style="font-weight:600;font-size:12.5px">
          ${l.name}
          ${Array.isArray(l.subLevels) && l.subLevels.length ? `<div style="display:flex;gap:4px;margin-top:4px;flex-wrap:wrap">${l.subLevels.map(sub => `<span style="font-size:9.5px;font-weight:600;color:#6B7280;background:#F3F4F6;border-radius:5px;padding:2px 6px">${sub.name}</span>`).join('')}</div>` : ''}
        </td>
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
    : `1:${maxStudents} ${name}`;
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
    const code = classMode === 'individual' ? '1:1' : `1:${maxStudents}`;
    MOCK_MASTER_CLASS_TYPES.push({ id: newId, code, name, classMode, minStudents: 1, maxStudents, order: MOCK_MASTER_CLASS_TYPES.length + 1, visible: true });
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

// 세부 레벨 입력 행을 동적으로 추가 (레벨당 개수 제한 없음 — 2개, 3개, 4개 등 자유롭게 구성)
function addLevelModalSubRow(value = '') {
  const container = document.getElementById('level-modal-sublevels');
  if (!container) return;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;align-items:center';
  const escaped = String(value).replace(/"/g, '&quot;');
  row.innerHTML = `
    <input type="text" class="tsa-input level-modal-sub-input" placeholder="예: GL1" value="${escaped}" style="flex:1"/>
    <button type="button" onclick="this.closest('div').remove()" style="border:0;background:none;color:#EF4444;cursor:pointer;font-size:11px;flex-shrink:0;padding:4px 6px">삭제</button>
  `;
  container.appendChild(row);
}

function renderLevelModalSubRows(subLevels, fallbackBaseName) {
  const container = document.getElementById('level-modal-sublevels');
  if (!container) return;
  container.innerHTML = '';
  const names = (Array.isArray(subLevels) && subLevels.length)
    ? subLevels.map(s => s.name)
    : [`${fallbackBaseName}-1`, `${fallbackBaseName}-2`];
  names.forEach(name => addLevelModalSubRow(name));
}

function openLevelModal() {
  _editingLevelIdx = null;
  document.getElementById('level-modal-title').textContent = '레벨 추가';
  document.getElementById('level-modal-id').value = '';
  document.getElementById('level-modal-name').value = '';
  document.getElementById('level-modal-order').value = MOCK_MASTER_LEVELS.length + 1;
  const container = document.getElementById('level-modal-sublevels');
  if (container) container.innerHTML = '';
  addLevelModalSubRow('');
  addLevelModalSubRow('');
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
  renderLevelModalSubRows(l.subLevels, l.name);
  openModal('level-modal');
}

function saveMasterLevel() {
  const name = document.getElementById('level-modal-name').value.trim();
  const order = parseInt(document.getElementById('level-modal-order').value, 10) || 1;
  const subNames = Array.from(document.querySelectorAll('#level-modal-sublevels .level-modal-sub-input'))
    .map(input => input.value.trim())
    .filter(Boolean);

  if (!name) {
    showToast('레벨명을 입력하세요.', 'warning');
    return;
  }
  if (!subNames.length) {
    showToast('세부 레벨을 최소 1개 입력하세요.', 'warning');
    return;
  }

  if (_editingLevelIdx !== null) {
    const l = MOCK_MASTER_LEVELS[_editingLevelIdx];
    l.name = name;
    l.order = order;
    l.subLevels = subNames.map((subName, i) => ({
      id: l.subLevels?.[i]?.id || `${l.id}_${i + 1}`,
      name: subName,
      order: i + 1,
      visible: true,
    }));
    showToast('레벨 정보가 수정되었습니다.', 'success');
  } else {
    const newId = 'LV_' + String(MOCK_MASTER_LEVELS.length + 1).padStart(2, '0');
    MOCK_MASTER_LEVELS.push({
      id: newId, name, order, visible: true,
      subLevels: subNames.map((subName, i) => ({ id: `${newId}_${i + 1}`, name: subName, order: i + 1, visible: true })),
    });
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

/* =============================================
   PARTNERSHIP INQUIRIES (에이전시 제휴 문의)
   ============================================= */
let _piStatusFilter = 'all';
let _piExpandedId = null;

function openPartnershipInquiryModal() {
  ['pi-agency-name', 'pi-contact-name', 'pi-phone', 'pi-email', 'pi-message'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const countryEl = document.getElementById('pi-country');
  if (countryEl) countryEl.value = '';
  openModal('modal-partnership-inquiry');
}

function submitPartnershipInquiry() {
  const agencyName = document.getElementById('pi-agency-name').value.trim();
  const contactName = document.getElementById('pi-contact-name').value.trim();
  const country = document.getElementById('pi-country').value;
  const phone = document.getElementById('pi-phone').value.trim();
  const email = document.getElementById('pi-email').value.trim();
  const message = document.getElementById('pi-message').value.trim();

  if (!agencyName) { showToast('회사명을 입력해 주세요.', 'danger'); return; }
  if (!contactName) { showToast('담당자 성함을 입력해 주세요.', 'danger'); return; }
  if (!country) { showToast('국가를 선택해 주세요.', 'danger'); return; }
  if (!email) { showToast('이메일을 입력해 주세요.', 'danger'); return; }

  const nextId = MOCK_PARTNERSHIP_INQUIRIES.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  MOCK_PARTNERSHIP_INQUIRIES.unshift({
    id: nextId, agencyName, contactName, country, phone, email, message,
    submittedAt: stayNowStamp(), status: 'new', partnerRegistered: false, notes: []
  });

  closeModal('modal-partnership-inquiry');
  _piStatusFilter = 'all';
  renderPartnershipInquiries();
  showToast(`✓ ${agencyName} 제휴 문의가 등록되었습니다.`, 'success');
}

function setPartnershipInquiryFilter(status) {
  _piStatusFilter = status;
  renderPartnershipInquiries();
}

function updatePartnershipInquiryStatus(id, status) {
  const inquiry = MOCK_PARTNERSHIP_INQUIRIES.find(p => p.id === id);
  if (!inquiry) return;
  inquiry.status = status;
  renderPartnershipInquiries();
  showToast('문의 상태가 변경되었습니다.', 'success');
}

function togglePartnershipRegistration(id) {
  const inquiry = MOCK_PARTNERSHIP_INQUIRIES.find(p => p.id === id);
  if (!inquiry) return;
  inquiry.partnerRegistered = !inquiry.partnerRegistered;
  renderPartnershipInquiries();
  showToast(inquiry.partnerRegistered ? `✓ ${inquiry.agencyName} 제휴 등록 처리되었습니다.` : `${inquiry.agencyName} 제휴 등록이 취소되었습니다.`, 'success');
}

function togglePartnershipInquiryNotes(id) {
  _piExpandedId = _piExpandedId === id ? null : id;
  renderPartnershipInquiries();
}

function addPartnershipInquiryNote(id) {
  const inquiry = MOCK_PARTNERSHIP_INQUIRIES.find(p => p.id === id);
  if (!inquiry) return;
  const input = document.getElementById(`pi-note-input-${id}`);
  const text = input ? input.value.trim() : '';
  if (!text) { showToast('메모 내용을 입력해 주세요.', 'danger'); return; }

  if (!Array.isArray(inquiry.notes)) inquiry.notes = [];
  const nextNoteId = inquiry.notes.reduce((max, n) => Math.max(max, n.id), 0) + 1;
  inquiry.notes.push({ id: nextNoteId, text, author: stayCurrentActor(), at: stayNowStamp() });

  _piExpandedId = id;
  renderPartnershipInquiries();
  showToast('답변 메모가 저장되었습니다.', 'success');
}

function renderPartnershipInquiries() {
  const tbody = document.getElementById('pi-tbody');
  if (!tbody) return;

  ['all', 'new', 'contacted', 'closed'].forEach(status => {
    const btn = document.getElementById(`pi-filter-${status}`);
    if (!btn) return;
    btn.classList.toggle('tsa-btn-primary', _piStatusFilter === status);
    btn.classList.toggle('tsa-btn-outline', _piStatusFilter !== status);
  });

  const statusMeta = {
    new: { label: '신규', badge: 'tsa-badge-warning' },
    contacted: { label: '응대중', badge: 'tsa-badge-info' },
    closed: { label: '완료', badge: 'tsa-badge-success' }
  };

  const filtered = MOCK_PARTNERSHIP_INQUIRIES
    .filter(p => _piStatusFilter === 'all' || p.status === _piStatusFilter)
    .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));

  const countEl = document.getElementById('pi-count');
  if (countEl) countEl.textContent = `${filtered.length}건${_piStatusFilter !== 'all' ? ` · ${statusMeta[_piStatusFilter].label}` : ''} (전체 ${MOCK_PARTNERSHIP_INQUIRIES.length}건)`;

  tbody.innerHTML = filtered.map(p => {
    const meta = statusMeta[p.status] || statusMeta.new;
    const notes = Array.isArray(p.notes) ? p.notes : [];
    const isExpanded = _piExpandedId === p.id;
    const row = `<tr>
    <td style="font-size:11px">
      <b>${lessonEsc(p.agencyName)}</b>
      <div style="font-size:10px;color:#9CA3AF">${lessonEsc(p.contactName)}</div>
    </td>
    <td style="font-size:11px">${lessonEsc(p.country)}</td>
    <td style="font-size:11px">
      <div>${lessonEsc(p.email)}</div>
      ${p.phone ? `<div style="font-size:10px;color:#9CA3AF">${lessonEsc(p.phone)}</div>` : ''}
    </td>
    <td style="font-size:11px;max-width:260px;white-space:pre-wrap">${lessonEsc(p.message || '-')}</td>
    <td style="font-size:11px;white-space:nowrap">${lessonEsc(p.submittedAt)}</td>
    <td style="font-size:11px">
      <select class="tsa-input" style="padding:4px 6px;font-size:11px" onchange="updatePartnershipInquiryStatus(${p.id}, this.value)">
        <option value="new" ${p.status === 'new' ? 'selected' : ''}>신규</option>
        <option value="contacted" ${p.status === 'contacted' ? 'selected' : ''}>응대중</option>
        <option value="closed" ${p.status === 'closed' ? 'selected' : ''}>완료</option>
      </select>
      <span class="tsa-badge ${meta.badge}" style="display:block;margin-top:4px;text-align:center">${meta.label}</span>
    </td>
    <td style="font-size:11px;text-align:center">
      ${p.partnerRegistered
        ? `<span class="tsa-badge tsa-badge-success" style="cursor:pointer" onclick="togglePartnershipRegistration(${p.id})" title="클릭하면 제휴 등록을 취소합니다"><i data-lucide="badge-check" style="width:11px;height:11px"></i> 등록완료</span>`
        : `<button class="tsa-btn tsa-btn-sm tsa-btn-outline" style="white-space:nowrap" onclick="togglePartnershipRegistration(${p.id})">제휴 등록 처리</button>`}
    </td>
    <td style="font-size:11px">
      <button class="tsa-btn tsa-btn-sm ${isExpanded ? 'tsa-btn-primary' : 'tsa-btn-outline'}" style="white-space:nowrap" onclick="togglePartnershipInquiryNotes(${p.id})">
        <i data-lucide="message-square" style="width:12px;height:12px"></i> 메모 ${notes.length}
      </button>
    </td>
  </tr>`;

    if (!isExpanded) return row;

    const notesHtml = notes.length
      ? notes.map(n => `<div style="padding:8px 10px;border-radius:8px;background:#F9FAFB;border:1px solid #E5E7EB;margin-bottom:6px">
          <div style="font-size:11px;color:#374151;white-space:pre-wrap">${lessonEsc(n.text)}</div>
          <div style="font-size:10px;color:#9CA3AF;margin-top:4px">${lessonEsc(n.author)} · ${lessonEsc(n.at)}</div>
        </div>`).join('')
      : '<div style="font-size:11px;color:#9CA3AF;padding:4px 0">아직 남긴 답변 메모가 없습니다.</div>';

    const panel = `<tr>
      <td colspan="8" style="background:#F9FAFB;padding:14px 16px">
        <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px">💬 ${lessonEsc(p.agencyName)} — 답변 메모</div>
        <div style="max-height:180px;overflow-y:auto;margin-bottom:10px">${notesHtml}</div>
        <div style="display:flex;gap:8px;align-items:flex-start">
          <textarea id="pi-note-input-${p.id}" class="tsa-input" rows="2" style="flex:1" placeholder="상담 결과, 다음 액션 등을 메모로 남겨주세요."></textarea>
          <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="white-space:nowrap" onclick="addPartnershipInquiryNote(${p.id})">메모 저장</button>
        </div>
      </td>
    </tr>`;
    return row + panel;
  }).join('') || '<tr><td colspan="8" style="padding:30px;text-align:center;color:#9CA3AF;font-size:11px">접수된 제휴 문의가 없습니다.</td></tr>';

  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 0);
}
