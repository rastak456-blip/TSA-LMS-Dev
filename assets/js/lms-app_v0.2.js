/**
 * ============================================================
 *  TSA LMS · lms-app.js  v2.5 (100% 기획 매칭 리빌드 버전)
 *  TalkStation Academy — 통합 운영 관리 포털 JS 엔진
 * ============================================================
 */

/* =============================================
   GLOBAL STATE
   ============================================= */
const APP = {
  user: null,
  branch: 'ph-cebu',
  conflictMode: false,
  pricingMode: 'A',
  currentStudent: null,
  currentTeacher: null,
  assignTarget: { teacherName: '', period: 0 },
  selectedInvoiceTab: 'invoice',
  selectedInvoiceStudent: null,
  selectedDormStudent: null,
  selectedDay: '월',
  selectedWeek: 0,
  timetableTab: '1on1',
  timetableStatus: 'Draft',
  bellSystem: { duration: 50, break: 10, start: '08:00', total: 8, lunchAfter: 4, lunchDuration: 30 },
};

/* =============================================
   MOCK DATA
   ============================================= */
const MOCK_STUDENTS = [
  {
    id: 1, name: 'HONG GILDONG', nick: 'Kevin', gender: '남', age: 24, nationality: '한국', flag: '🇰🇷',
    course: 'IELTS 전문 코스', level: 'Band 6.0', duration: 8, dorm: 'Room 101 / Bed A', visaExpiry: '2026-07-25', sspExpiry: '면제',
    departureDate: '2026-07-27', startDate: '2026-06-01', arrivalDate: '2026-06-01',
    attendance: 96.4, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    quiz: [88, 92, 85, 90, 94],
    passportStatus: '보관 중',
    flightInfo: 'KE631 | 06-01 입국',
    flightOutInfo: 'KE632 | 07-27 출국',
    dietType: '일반식',
    healthNotes: '알레르기 없음. 복약 정보 없음.',
    grades: { speaking: [80, 85, 88, 90], listening: [75, 80, 85, 88], reading: [90, 92, 95, 94], writing: [70, 75, 78, 82] },
    fees: [
      { id: 101, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 102, item: 'SSP 로컬 발급 대행피', amount: 120, paid: true },
      { id: 103, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: false },
      { id: 104, item: '비자 연장 대행 수수료(1차)', amount: 80, paid: false },
    ]
  },
  {
    id: 2, name: 'LEE YOUNGEOH', nick: 'James', gender: '남', age: 22, nationality: '한국', flag: '🇰🇷',
    course: '일반 코스', level: 'Intermediate', duration: 4, dorm: 'Room 101 / Bed B', visaExpiry: '2026-07-06', sspExpiry: '면제',
    departureDate: '2026-07-06', startDate: '2026-06-08', arrivalDate: '2026-06-08',
    attendance: 88.2, status: 'current', remittanceStatus: 'submitted', agency: '한국 영어마을', warning: 1,
    quiz: [70, 76, 80, 74, 78],
    passportStatus: '보관 중',
    flightInfo: 'PR733 | 06-08 입국',
    flightOutInfo: 'PR734 | 07-06 출국',
    dietType: '일반식',
    healthNotes: '매일 2회 정기 복약(비염 약)',
    grades: { speaking: [65, 70, 72, 75], listening: [68, 70, 74, 76], reading: [70, 75, 78, 80], writing: [60, 62, 65, 68] },
    fees: [
      { id: 201, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 202, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: true },
    ]
  },
  { 
    id: 3, name: 'CHOI HANGSON', nick: 'Amy', gender: '여', age: 20, nationality: '한국', flag: '🇰🇷', 
    course: '주니어 패키지', level: 'Beginner', duration: 4, dorm: 'Room 102 / Bed A', visaExpiry: '2026-07-01', sspExpiry: '면제', 
    departureDate: '2026-06-29',
    attendance: 100, status: 'current', agency: '서울 유학원', warning: 0, 
    quiz: [95, 98, 96, 99, 100],
    passportStatus: '보관 중',
    flightInfo: 'KE631 | 06-01 입국',
    dietType: '채식',
    healthNotes: '땅콩 알레르기 있음(섭취 절대 주의)',
    grades: { speaking: [90, 92, 95, 98], listening: [92, 94, 96, 99], reading: [95, 96, 98, 100], writing: [88, 90, 92, 95] },
    fees: [
      { id: 301, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 302, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: true },
    ]
  },
  { 
    id: 4, name: 'TANAKA YUKI', nick: 'Yuki', gender: '여', age: 19, nationality: '일본', flag: '🇯🇵', 
    course: '일반 코스', level: 'Intermediate', duration: 4, dorm: 'Room 102 / Bed B', visaExpiry: '2026-06-22', sspExpiry: '면제', 
    departureDate: '2026-07-06',
    attendance: 91.7, status: 'current', agency: 'Tokyo Language', warning: 0, 
    quiz: [82, 85, 88, 84, 90],
    passportStatus: '미제출',
    flightInfo: 'JL772 | 06-08 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [75, 78, 80, 82], listening: [78, 80, 82, 85], reading: [80, 82, 85, 88], writing: [70, 72, 75, 76] },
    fees: [
      { id: 401, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 402, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: false },
    ]
  },
  { 
    id: 5, name: 'PARK SOYEON', nick: 'Sophie', gender: '여', age: 26, nationality: '베트남', flag: '🇻🇳', 
    course: 'IELTS 전문 코스', level: 'Band 5.5', duration: 12, dorm: 'Room 201 / Bed A', visaExpiry: '2026-06-13', sspExpiry: '2026-06-13', 
    departureDate: '2026-08-07',
    attendance: 94.1, status: 'current', remittanceStatus: 'unpaid', agency: 'VN Academy', warning: 2,
    quiz: [78, 80, 82, 86, 88],
    passportStatus: '보관 중',
    flightInfo: 'VN630 | 05-15 입국',
    dietType: '할랄',
    healthNotes: '정서 불안으로 인한 ADHD 복약 지도 필요 (아침 식후)',
    grades: { speaking: [70, 72, 75, 78], listening: [72, 74, 76, 80], reading: [75, 78, 80, 82], writing: [65, 68, 70, 72] },
    fees: [
      { id: 501, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 502, item: 'SSP 발급 수수료', amount: 120, paid: true },
      { id: 503, item: '비자 연장 대행 1차', amount: 80, paid: true },
    ]
  },
  { 
    id: 6, name: 'WANG LEI', nick: 'Leo', gender: '남', age: 28, nationality: '중국', flag: '🇨🇳', 
    course: '비즈니스 영어', level: 'Advanced', duration: 8, dorm: 'Room 102 / Bed C', visaExpiry: '2026-06-15', sspExpiry: '2026-06-15', 
    departureDate: '2026-07-27',
    attendance: 82.3, status: 'current', agency: 'Beijing Partner', warning: 3, 
    quiz: [65, 70, 68, 72, 75],
    passportStatus: '만료 재발급 중',
    flightInfo: 'CA179 | 06-01 입국',
    dietType: '일반식',
    healthNotes: '당뇨 복약 필요(매 끼니 식전)',
    grades: { speaking: [60, 62, 65, 66], listening: [62, 64, 66, 68], reading: [65, 68, 70, 72], writing: [55, 58, 60, 62] },
    fees: [
      { id: 601, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 602, item: 'SSP 발급 피', amount: 120, paid: false },
    ]
  },
  { 
    id: 7, name: 'KIM MINSU', nick: 'Tom', gender: '남', age: 16, nationality: '한국', flag: '🇰🇷', 
    course: '주니어 패키지', level: 'Beginner', duration: 2, dorm: 'Room 103 / Bed A', visaExpiry: '2026-06-22', sspExpiry: '면제', 
    departureDate: '2026-06-22',
    attendance: 98.5, status: 'new', agency: '직접 등록', warning: 0, 
    quiz: [92, 95, 97],
    passportStatus: '보관 중',
    flightInfo: 'KE631 | 06-08 입국',
    dietType: '일반식',
    healthNotes: '기관지 천식(비상용 흡입기 소지)',
    grades: { speaking: [85, 88, 90], listening: [88, 90, 92], reading: [90, 92, 94], writing: [80, 82, 85] },
    fees: [
      { id: 701, item: '입학금 (Registration Fee)', amount: 100, paid: true },
    ]
  },
  { 
    id: 8, name: 'SATO KENJI', nick: 'Ken', gender: '남', age: 30, nationality: '일본', flag: '🇯🇵', 
    course: '비즈니스 영어', level: 'Advanced', duration: 4, dorm: 'Room 102 / Bed D', visaExpiry: '2026-06-29', sspExpiry: '면제', 
    departureDate: '2026-06-29',
    attendance: 87.5, status: 'completed', agency: 'Osaka Study', warning: 0, 
    quiz: [85, 88, 90, 87, 92, 94, 91, 89],
    passportStatus: '보관 중',
    flightInfo: 'JL772 | 05-01 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [80, 82, 85, 88], listening: [82, 84, 86, 90], reading: [85, 88, 90, 92], writing: [75, 78, 80, 84] },
    fees: [
      { id: 801, item: '입학금 (Registration Fee)', amount: 100, paid: true },
    ]
  },
  {
    id: 9, name: 'KIM MINJUN', nick: 'Minjun', gender: '남', age: 21, nationality: '한국', flag: '🇰🇷',
    course: 'IELTS 전문 코스', level: 'Band 6.0', duration: 8, dorm: 'Room 304 / Bed A', visaExpiry: '2026-08-15', sspExpiry: '면제',
    departureDate: '2026-08-20', startDate: '2026-06-01', arrivalDate: '2026-06-01',
    attendance: 88.0, status: 'current', remittanceStatus: 'unpaid', remittanceMemo: '환율 변동으로 금액 재확인 중 — 이체 예정일 6/20', remittanceReceipt: '영수증_Minjun_임시.pdf', agency: '한국 영어마을', warning: 1,
    quiz: [80, 85, 82, 88, 90],
    passportStatus: '보관 중',
    flightInfo: 'KE631 | 06-01 입국',
    flightOutInfo: 'KE632 | 08-20 출국',
    dietType: '일반식',
    healthNotes: '알레르기 없음. 특이사항 없음.',
    grades: { speaking: [75, 78, 80, 82], listening: [78, 80, 82, 85], reading: [80, 82, 85, 88], writing: [70, 72, 75, 76] },
    fees: [
      { id: 901, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 902, item: '교재 및 생활 보증금', amount: 150, paid: true },
    ]
  },
  // ── 한국 영어마을 소속 추가 학생 (모든 상태 커버) ──
  {
    id: 10, name: 'LEE SUBIN', nick: 'Subin', gender: '여', age: 23, nationality: '한국', flag: '🇰🇷',
    course: 'IELTS 전문 코스', level: 'Band 6.5', duration: 12, dorm: 'Room 202 / Bed A', visaExpiry: '2026-04-20', sspExpiry: '면제',
    departureDate: '2026-04-20', startDate: '2026-01-20', arrivalDate: '2026-01-20',
    attendance: 94.2, status: 'completed', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    quiz: [90, 92, 95, 94, 96, 97],
    passportStatus: '반환 완료',
    flightInfo: 'KE633 | 01-20 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [85, 88, 90, 92], listening: [88, 90, 92, 95], reading: [90, 92, 95, 97], writing: [80, 84, 87, 90] },
    fees: [
      { id: 1001, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 1002, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: true },
    ]
  },
  {
    id: 11, name: 'JUNG TAEHWAN', nick: 'Tae', gender: '남', age: 27, nationality: '한국', flag: '🇰🇷',
    course: '일반 코스', level: 'Intermediate', duration: 4, dorm: '미배정', visaExpiry: '2026-05-10', sspExpiry: '면제',
    departureDate: '2026-05-10', startDate: '2026-04-10', arrivalDate: '2026-04-10',
    attendance: 61.0, status: 'resigned', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 4,
    quiz: [55, 60, 48],
    passportStatus: '반환 완료',
    flightInfo: 'KE701 | 04-10 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [50, 52, 55], listening: [55, 58, 60], reading: [60, 62, 65], writing: [45, 48, 50] },
    fees: [
      { id: 1101, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 1102, item: '조기퇴원 위약금 (Penalty)', amount: 200, paid: false },
    ]
  },
  {
    id: 12, name: 'NGUYEN THI LAN', nick: 'Lan', gender: '여', age: 29, nationality: '베트남', flag: '🇻🇳',
    course: '가디언 코스', level: 'Intermediate', duration: 8, dorm: 'Room 203 / Bed A', visaExpiry: '2026-06-18', sspExpiry: '2026-06-18',
    departureDate: '2026-08-01', startDate: '2026-06-01', arrivalDate: '2026-06-01',
    attendance: 97.5, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    quiz: [88, 91, 93, 90],
    passportStatus: '보관 중',
    flightInfo: 'VN632 | 06-01 입국',
    flightOutInfo: 'VN633 | 08-01 출국',
    dietType: '할랄',
    healthNotes: 'SSP 만료 임박 — 갱신 진행 중.',
    grades: { speaking: [80, 83, 86, 88], listening: [78, 82, 85, 87], reading: [82, 85, 88, 90], writing: [75, 78, 80, 83] },
    fees: [
      { id: 1201, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 1202, item: 'SSP 발급 수수료', amount: 120, paid: true },
    ]
  },
  {
    id: 13, name: 'PHAM MINH DUC', nick: 'Duc', gender: '남', age: 25, nationality: '베트남', flag: '🇻🇳',
    course: 'IELTS 전문 코스', level: 'Band 5.0', duration: 12, dorm: 'Room 303 / Bed A', visaExpiry: '2026-09-01', sspExpiry: '2026-08-01',
    departureDate: '2026-09-01', startDate: '2026-06-15', arrivalDate: '2026-06-15',
    attendance: 0, status: 'new', agency: '한국 영어마을', warning: 0,
    quiz: [],
    passportStatus: '미제출',
    flightInfo: 'VN634 | 06-15 입국 예정',
    dietType: '일반식',
    healthNotes: '신규 등록 — 건강정보 미제출.',
    grades: { speaking: [], listening: [], reading: [], writing: [] },
    fees: []
  },
  {
    id: 14, name: 'OH HYUNJIN', nick: 'Jenny', gender: '여', age: 15, nationality: '한국', flag: '🇰🇷',
    course: '주니어 패키지', level: 'Beginner', duration: 4, dorm: 'Room 104 / Bed A', visaExpiry: '2026-07-01', sspExpiry: '면제',
    departureDate: '2026-07-01', startDate: '2026-06-01', arrivalDate: '2026-06-01',
    attendance: 100, status: 'current', agency: '한국 영어마을', warning: 0,
    quiz: [95, 98, 97],
    passportStatus: '보관 중',
    flightInfo: 'KE603 | 06-01 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [88, 92, 95], listening: [90, 93, 96], reading: [92, 95, 98], writing: [85, 88, 91] },
    fees: [
      { id: 1401, item: '입학금 (Registration Fee)', amount: 100, paid: false },
    ]
  },
  {
    id: 15, name: 'BAE JONGHO', nick: 'John', gender: '남', age: 31, nationality: '한국', flag: '🇰🇷',
    course: '가디언 코스', level: 'Upper-Intermediate', duration: 8, dorm: 'Room 305 / Bed A', visaExpiry: '2026-08-10', sspExpiry: '면제',
    departureDate: '2026-08-10', startDate: '2026-06-10', arrivalDate: '2026-06-10',
    attendance: 0, status: 'new', remittanceStatus: 'submitted', agency: '한국 영어마을', warning: 0,
    quiz: [],
    passportStatus: '보관 중',
    flightInfo: 'KE721 | 06-10 입국 예정',
    dietType: '일반식',
    healthNotes: '당뇨 복약 필요(매 식전).',
    grades: { speaking: [], listening: [], reading: [], writing: [] },
    fees: [
      { id: 1501, item: '입학금 (Registration Fee)', amount: 100, paid: true },
    ]
  },
  // ── 추가 목업 데이터 ──
  {
    id: 16, name: 'YAMAMOTO HANA', nick: 'Hana', gender: '여', age: 20, nationality: '일본', flag: '🇯🇵',
    course: '일반 코스', level: 'Upper-Intermediate', duration: 8, dorm: 'Room 204 / Bed A', visaExpiry: '2026-08-05', sspExpiry: '면제',
    departureDate: '2026-08-05', startDate: '2026-06-09', arrivalDate: '2026-06-09',
    attendance: 91.0, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    quiz: [84, 87, 89, 91],
    passportStatus: '보관 중',
    flightInfo: 'JL774 | 06-09 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [78, 82, 85, 88], listening: [80, 83, 86, 89], reading: [82, 85, 88, 91], writing: [74, 77, 80, 83] },
    fees: [
      { id: 1601, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 1602, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: true },
    ]
  },
  {
    id: 17, name: 'CHEN XIAOYU', nick: 'Lily', gender: '여', age: 22, nationality: '중국', flag: '🇨🇳',
    course: 'IELTS 전문 코스', level: 'Band 5.5', duration: 16, dorm: 'Room 205 / Bed A', visaExpiry: '2026-06-14', sspExpiry: '2026-06-14',
    departureDate: '2026-10-01', startDate: '2026-06-01', arrivalDate: '2026-06-01',
    attendance: 88.5, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 1,
    quiz: [76, 80, 83, 85],
    passportStatus: '보관 중',
    flightInfo: 'MU553 | 06-01 입국',
    dietType: '일반식',
    healthNotes: 'SSP 만료 3일 이내 — 긴급 갱신 필요.',
    grades: { speaking: [72, 75, 78, 80], listening: [74, 77, 80, 83], reading: [76, 79, 82, 85], writing: [68, 71, 74, 77] },
    fees: [
      { id: 1701, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 1702, item: 'SSP 발급 수수료', amount: 120, paid: true },
      { id: 1703, item: 'SSP 갱신 수수료', amount: 120, paid: false },
    ]
  },
  {
    id: 18, name: 'BATKHUU ENKHJIN', nick: 'Enkhee', gender: '여', age: 24, nationality: '몽골', flag: '🇲🇳',
    course: '일반 코스', level: 'Intermediate', duration: 8, dorm: 'Room 206 / Bed A', visaExpiry: '2026-07-20', sspExpiry: '2026-07-20',
    departureDate: '2026-07-20', startDate: '2026-05-25', arrivalDate: '2026-05-25',
    attendance: 93.3, status: 'current', agency: '한국 영어마을', warning: 0,
    quiz: [79, 82, 85, 83],
    passportStatus: '보관 중',
    flightInfo: 'OM301 | 05-25 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [70, 74, 77, 80], listening: [72, 76, 79, 82], reading: [74, 78, 81, 84], writing: [66, 70, 73, 76] },
    fees: [
      { id: 1801, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 1802, item: 'SSP 발급 수수료', amount: 120, paid: false },
      { id: 1803, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: false },
    ]
  },
  {
    id: 19, name: 'PARK JIHO', nick: 'Jiho', gender: '남', age: 19, nationality: '한국', flag: '🇰🇷',
    course: '주니어 패키지', level: 'Beginner', duration: 4, dorm: 'Room 104 / Bed B', visaExpiry: '2026-07-08', sspExpiry: '면제',
    departureDate: '2026-07-08', startDate: '2026-06-08', arrivalDate: '2026-06-08',
    attendance: 100, status: 'current', remittanceStatus: 'submitted', agency: '한국 영어마을', warning: 0,
    quiz: [90, 93],
    passportStatus: '보관 중',
    flightInfo: 'KE635 | 06-08 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [82, 86], listening: [85, 89], reading: [88, 92], writing: [79, 83] },
    fees: [
      { id: 1901, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 1902, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: false },
    ]
  },
  {
    id: 20, name: 'NGUYEN VAN LONG', nick: 'Long', gender: '남', age: 26, nationality: '베트남', flag: '🇻🇳',
    course: 'IELTS 전문 코스', level: 'Band 5.0', duration: 12, dorm: 'Room 306 / Bed A', visaExpiry: '2026-09-15', sspExpiry: '2026-09-01',
    departureDate: '2026-09-15', startDate: '2026-06-15', arrivalDate: '2026-06-15',
    attendance: 0, status: 'new', agency: '한국 영어마을', warning: 0,
    quiz: [],
    passportStatus: '미제출',
    flightInfo: 'VN636 | 06-15 입국 예정',
    dietType: '일반식',
    healthNotes: '신규 등록 — 건강정보 미제출.',
    grades: { speaking: [], listening: [], reading: [], writing: [] },
    fees: []
  },
  {
    id: 21, name: 'KIM YEONHEE', nick: 'Yeon', gender: '여', age: 28, nationality: '한국', flag: '🇰🇷',
    course: '가디언 코스', level: 'Intermediate', duration: 4, dorm: 'Room 207 / Bed A', visaExpiry: '2026-07-03', sspExpiry: '면제',
    departureDate: '2026-07-03', startDate: '2026-06-03', arrivalDate: '2026-06-03',
    attendance: 95.0, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    quiz: [86, 89, 91],
    passportStatus: '보관 중',
    flightInfo: 'KE637 | 06-03 입국',
    dietType: '채식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [80, 84, 87], listening: [82, 86, 89], reading: [84, 88, 91], writing: [76, 80, 83] },
    fees: [
      { id: 2101, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2102, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: true },
    ]
  },
  {
    id: 22, name: 'TANAKA RYOTA', nick: 'Ryota', gender: '남', age: 23, nationality: '일본', flag: '🇯🇵',
    course: '일반 코스', level: 'Intermediate', duration: 8, dorm: 'Room 105 / Bed A', visaExpiry: '2026-05-20', sspExpiry: '면제',
    departureDate: '2026-05-20', startDate: '2026-03-20', arrivalDate: '2026-03-20',
    attendance: 79.0, status: 'completed', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 2,
    quiz: [68, 71, 74, 70, 73, 76, 72, 75],
    passportStatus: '반환 완료',
    flightInfo: 'JL776 | 03-20 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [62, 65, 68, 70], listening: [64, 67, 70, 72], reading: [66, 69, 72, 74], writing: [58, 61, 64, 66] },
    fees: [
      { id: 2201, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2202, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: true },
    ]
  },
  {
    id: 23, name: 'OH SEUNGMIN', nick: 'Sean', gender: '남', age: 25, nationality: '한국', flag: '🇰🇷',
    course: 'IELTS 전문 코스', level: 'Band 5.5', duration: 8, dorm: '미배정', visaExpiry: '2026-04-15', sspExpiry: '면제',
    departureDate: '2026-04-15', startDate: '2026-02-15', arrivalDate: '2026-02-15',
    attendance: 55.0, status: 'resigned', remittanceStatus: 'submitted', agency: '한국 영어마을', warning: 5,
    quiz: [60, 55, 58],
    passportStatus: '반환 완료',
    flightInfo: 'KE701 | 02-15 입국',
    dietType: '일반식',
    healthNotes: '출석 저조로 퇴원 처리.',
    grades: { speaking: [55, 58, 60], listening: [57, 60, 62], reading: [59, 62, 64], writing: [50, 53, 55] },
    fees: [
      { id: 2301, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2302, item: '조기퇴원 위약금 (Penalty)', amount: 200, paid: false },
    ]
  },
  {
    id: 24, name: 'LI JIAYI', nick: 'Joy', gender: '여', age: 21, nationality: '중국', flag: '🇨🇳',
    course: '주니어 패키지', level: 'Beginner', duration: 4, dorm: 'Room 208 / Bed A', visaExpiry: '2026-08-20', sspExpiry: '2026-08-20',
    departureDate: '2026-08-20', startDate: '2026-07-20', arrivalDate: '2026-07-20',
    attendance: 0, status: 'new', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    quiz: [],
    passportStatus: '보관 중',
    flightInfo: 'CZ388 | 07-20 입국 예정',
    dietType: '일반식',
    healthNotes: '신규 등록 — 입학 전.',
    grades: { speaking: [], listening: [], reading: [], writing: [] },
    fees: [
      { id: 2401, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2402, item: 'SSP 발급 수수료', amount: 120, paid: true },
      { id: 2403, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: true },
    ]
  },
  {
    id: 25, name: 'SHIN EUNSOO', nick: 'Erin', gender: '여', age: 17, nationality: '한국', flag: '🇰🇷',
    course: '주니어 패키지', level: 'Upper-Beginner', duration: 8, dorm: 'Room 106 / Bed A', visaExpiry: '2026-08-01', sspExpiry: '면제',
    departureDate: '2026-08-01', startDate: '2026-06-01', arrivalDate: '2026-06-01',
    attendance: 100, status: 'current', agency: '한국 영어마을', warning: 0,
    quiz: [92, 95, 97, 96],
    passportStatus: '보관 중',
    flightInfo: 'KE639 | 06-01 입국',
    dietType: '일반식',
    healthNotes: '특이사항 없음.',
    grades: { speaking: [84, 88, 91, 94], listening: [86, 90, 93, 96], reading: [88, 92, 95, 98], writing: [80, 84, 87, 90] },
    fees: [
      { id: 2501, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2502, item: '교재 및 생활 보증금(Deposit)', amount: 150, paid: false },
    ]
  },
  // 대기생 (입금 및 서류 확인 중, 수강 시작 전)
  {
    id: 26, name: 'PARK SOOYEON', nick: 'Sue', gender: '여', age: 22, nationality: '한국', flag: '🇰🇷',
    course: '일반 코스', level: 'Intermediate', duration: 8, dorm: '미배정', visaExpiry: '2026-09-01', sspExpiry: '면제',
    departureDate: '2026-09-01', startDate: '2026-07-01', arrivalDate: '2026-07-01',
    attendance: 0, status: 'waiting', agency: '한국 영어마을', warning: 0,
    passportStatus: '미보관', flightInfo: 'KE501 | 07-01 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [{ id: 2601, item: '입학금 (Registration Fee)', amount: 100, paid: true }]
  },
  {
    id: 27, name: 'NGUYEN MINH TU', nick: 'Tu', gender: '남', age: 24, nationality: '베트남', flag: '🇻🇳',
    course: 'IELTS 전문 코스', level: 'Band 5.0', duration: 12, dorm: '미배정', visaExpiry: '2026-10-15', sspExpiry: '미취득',
    departureDate: '2026-10-15', startDate: '2026-07-15', arrivalDate: '2026-07-14',
    attendance: 0, status: 'waiting', agency: '한국 영어마을', warning: 0,
    passportStatus: '미보관', flightInfo: 'VN810 | 07-14 입국 예정', dietType: '일반식', healthNotes: 'SSP 신청 예정',
    fees: [{ id: 2701, item: '입학금 (Registration Fee)', amount: 100, paid: false }]
  },
  {
    id: 28, name: 'WANG FANG', nick: 'Fang', gender: '여', age: 20, nationality: '중국', flag: '🇨🇳',
    course: '주니어 패키지', level: 'Beginner', duration: 4, dorm: '미배정', visaExpiry: '2026-08-20', sspExpiry: '미취득',
    departureDate: '2026-08-20', startDate: '2026-07-20', arrivalDate: '2026-07-20',
    attendance: 0, status: 'waiting', agency: '한국 영어마을', warning: 0,
    passportStatus: '미보관', flightInfo: 'CZ302 | 07-20 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [{ id: 2801, item: '입학금 (Registration Fee)', amount: 100, paid: true }]
  },
  {
    id: 29, name: 'KIM JUNHO', nick: 'Junho', gender: '남', age: 27, nationality: '한국', flag: '🇰🇷',
    course: '가디언 코스', level: 'Upper-Intermediate', duration: 8, dorm: '미배정', visaExpiry: '2026-09-30', sspExpiry: '면제',
    departureDate: '2026-09-30', startDate: '2026-08-01', arrivalDate: '2026-08-01',
    attendance: 0, status: 'waiting', agency: '한국 영어마을', warning: 0,
    passportStatus: '미보관', flightInfo: 'KE703 | 08-01 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [{ id: 2901, item: '입학금 (Registration Fee)', amount: 100, paid: true }]
  },
  {
    id: 30, name: 'TANAKA KENJI', nick: 'Kenji', gender: '남', age: 25, nationality: '일본', flag: '🇯🇵',
    course: '일반 코스', level: 'Pre-Intermediate', duration: 6, dorm: '미배정', visaExpiry: '2026-10-01', sspExpiry: '면제',
    departureDate: '2026-10-01', startDate: '2026-08-15', arrivalDate: '2026-08-15',
    attendance: 0, status: 'waiting', agency: '한국 영어마을', warning: 0,
    passportStatus: '미보관', flightInfo: 'JL744 | 08-15 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [{ id: 3001, item: '입학금 (Registration Fee)', amount: 100, paid: false }]
  },
];

const MOCK_TEACHERS = [
  { id: 1, name: 'Sarah Johnson', nick: 'Sarah', gender: '여', type: 'IELTS 전문', room: 'A-101', contract: '정규직', available: true, todaySlots: 6, rating: 4.9, exp: 5, status: 'active', availability: [true, true, true, true, true, true, true, true] },
  { id: 2, name: 'Michael Cruz', nick: 'Mike', gender: '남', type: '일반 영어 (1:1)', room: 'A-102', contract: '정규직', available: true, todaySlots: 5, rating: 4.7, exp: 3, status: 'active', availability: [true, true, false, true, true, true, true, true] },
  { id: 3, name: 'Anna Reyes', nick: 'Anna', gender: '여', type: '그룹 수업', room: 'B-201', contract: '파트타임', available: true, todaySlots: 4, rating: 4.6, exp: 2, status: 'active', availability: [true, true, true, true, true, true, false, false] },
  { id: 4, name: 'James Park', nick: 'James', gender: '남', type: '비즈니스 영어', room: 'B-202', contract: '정규직', available: false, todaySlots: 0, rating: 4.8, exp: 7, status: 'leave', availability: [false, false, false, false, false, false, false, false] },
  { id: 5, name: 'Emily Santos', nick: 'Emily', gender: '여', type: '주니어 전담', room: 'C-301', contract: '정규직', available: true, todaySlots: 6, rating: 4.9, exp: 4, status: 'active', availability: [true, true, true, true, true, true, true, true] },
  { id: 6, name: 'David Lim', nick: 'David', gender: '남', type: '일반 영어 (1:1)', room: 'A-103', contract: '파트타임', available: true, todaySlots: 3, rating: 4.4, exp: 1, status: 'active', availability: [true, true, true, false, false, true, true, true] },
  { id: 7, name: 'Grace Santos', nick: 'Grace', gender: '여', type: '일반 영어 (1:1)', room: 'A-104', contract: '파트타임', available: false, todaySlots: 0, rating: 4.5, exp: 2, status: 'resigned', availability: [false, false, false, false, false, false, false, false] },
];

const MOCK_TIMETABLE = [
  { teacher: 'Sarah', room: 'A-101', color: '#5E5CE6', bg: '#EEF2FF', slots: [
    { p:1, student:'Kevin', type:'IELTS 1:1', locked: true },
    { p:2, student:null },
    { p:3, student:'Sophie', type:'IELTS 1:1', locked: true },
    { p:4, student:null },
    { p:5, student:'Minjun', type:'IELTS 1:1', locked: false, subject: 'IELTS Speaking', level: 'Band 6.0' },
    { p:6, student:null },
    { p:7, student:null },
    { p:8, student:null },
  ]},
  { teacher: 'Mike', room: 'A-102', color: '#0EA5E9', bg: '#E0F2FE', slots: [
    { p:1, student:null },
    { p:2, student:null },
    { p:3, student:'Ken', type:'1:1 General', locked: true },
    { p:4, student:'Yuki', type:'1:1 General', locked: false },
    { p:5, student:null },
    { p:6, student:null },
    { p:7, student:'James', type:'1:1 General', locked: false },
    { p:8, student:null },
  ]},
  { teacher: 'Anna', room: 'B-201', color: '#16A34A', bg: '#DCFCE7', slots: [
    { p:1, student:'그룹 A', students: ['James', 'Yuki'], type:'Group', locked: false, subject:'Basic TOEFL', level:'Level 2' },
    { p:2, student:'그룹 A', students: ['James', 'Yuki'], type:'Group', locked: false, subject:'Basic TOEFL', level:'Level 2' },
    { p:3, student:null },
    { p:4, student:null },
    { p:5, student:'그룹 B', students: ['Kevin', 'Sophie'], type:'Group', locked: false, subject:'Speaking Clinic', level:'Level 4' },
    { p:6, student:'그룹 B', students: ['Kevin', 'Sophie'], type:'Group', locked: false, subject:'Speaking Clinic', level:'Level 4' },
    { p:7, student:null },
    { p:8, student:null },
  ]},
  { teacher: 'Emily', room: 'C-301', color: '#D97706', bg: '#FEF3C7', slots: [
    { p:1, student:'Tom', type:'주니어 1:1', locked: false },
    { p:2, student:null },
    { p:3, student:null },
    { p:4, student:'그룹 주니어', students: ['Tom', 'Amy'], type:'주니어 Group', locked: false, subject:'Story Book', level:'Level 1' },
    { p:5, student:'Amy', type:'주니어 1:1', locked: false },
    { p:6, student:null },
    { p:7, student:'그룹 주니어', students: ['Tom', 'Amy'], type:'주니어 Group', locked: false, subject:'Story Book', level:'Level 1' },
    { p:8, student:null },
  ]},
];

// Convert databases for Day of the Week availability & timetable slots
MOCK_TEACHERS.forEach(t => {
  if (Array.isArray(t.availability)) {
    const defaultAvail = [...t.availability];
    t.availability = {
      '월': [...defaultAvail],
      '화': [...defaultAvail],
      '수': [...defaultAvail],
      '목': [...defaultAvail],
      '금': [...defaultAvail],
      '토': [false, false, false, false, false, false, false, false],
      '일': [false, false, false, false, false, false, false, false],
    };
  }
});

// Ensure every active teacher in MOCK_TEACHERS has a row in MOCK_TIMETABLE
MOCK_TEACHERS.forEach(t => {
  if (t.status !== 'resigned' && !MOCK_TIMETABLE.some(row => row.teacher === t.nick)) {
    const typeColors = {
      'IELTS 전문': '#5E5CE6',
      '일반 영어 (1:1)': '#0EA5E9',
      '그룹 수업': '#16A34A',
      '주니어 전담': '#D97706',
      '비즈니스 영어': '#7C3AED'
    };
    const bgColors = {
      'IELTS 전문': '#EEF2FF',
      '일반 영어 (1:1)': '#E0F2FE',
      '그룹 수업': '#DCFCE7',
      '주니어 전담': '#FEF3C7',
      '비즈니스 영어': '#F5F3FF'
    };
    MOCK_TIMETABLE.push({
      teacher: t.nick,
      room: t.room || 'TBD',
      color: typeColors[t.type] || '#5E5CE6',
      bg: bgColors[t.type] || '#EEF2FF',
      slots: [1,2,3,4,5,6,7,8].map(p => ({
        p: p,
        student: null,
        type: null,
        locked: false
      }))
    });
  }
});

// 요일별 슬롯 확장 — 이미 확장된 경우(slot.day 존재) 중복 실행 방지
if (!MOCK_TIMETABLE[0]?.slots[0]?.day) {
  MOCK_TIMETABLE.forEach(t => {
    const genericSlots = [...t.slots];
    t.slots = [];
    ['월', '화', '수', '목', '금', '토', '일'].forEach(day => {
      genericSlots.forEach(slot => {
        const student = (day === '토' || day === '일') ? null : slot.student;
        const students = (day === '토' || day === '일') ? [] : (slot.students ? [...slot.students] : []);
        t.slots.push({
          p: slot.p,
          day: day,
          student: student,
          students: students,
          type: student ? slot.type : null,
          locked: slot.locked,
          subject: slot.subject,
          level: slot.level
        });
      });
    });
  });
}

const MOCK_AGENCY_STUDENTS = [
  { name: 'HONG GILDONG (Kevin)',   course: 'IELTS 전문',   dorm: '2인실', duration: '8주',  status: 'current',   total: '$2,890', branch: '강남지사', agencyStatus: 'active' },
  { name: 'LEE YOUNGEOH (James)',   course: '일반 코스',    dorm: '2인실', duration: '4주',  status: 'current',   total: '$1,360', branch: '강남지사', agencyStatus: 'waiting' },
  { name: 'CHOI HANGSON (Amy)',     course: '주니어 패키지',dorm: '2인실', duration: '4주',  status: 'completed', total: '$1,720', branch: '부산지사', agencyStatus: 'active' },
  { name: 'KIM MINJUN (Minjun)',    course: 'IELTS 전문',   dorm: '1인실', duration: '8주',  status: 'current',   total: '$2,890', branch: '강남지사', agencyStatus: 'waiting' },
  { name: 'LEE SUBIN (Subin)',      course: 'IELTS 전문',   dorm: '2인실', duration: '12주', status: 'completed', total: '$4,200', branch: '강남지사', agencyStatus: 'active' },
  { name: 'JUNG TAEHWAN (Tae)',     course: '일반 코스',    dorm: '미배정',duration: '4주',  status: 'resigned',  total: '$1,360', branch: '강남지사', agencyStatus: 'active' },
  { name: 'NGUYEN THI LAN (Lan)',   course: '가디언 코스',  dorm: '2인실', duration: '8주',  status: 'current',   total: '$2,400', branch: '강남지사', agencyStatus: 'active' },
  { name: 'PHAM MINH DUC (Duc)',    course: 'IELTS 전문',   dorm: '1인실', duration: '12주', status: 'new',       total: '$4,200', branch: '강남지사', agencyStatus: 'waiting' },
  { name: 'OH HYUNJIN (Jenny)',     course: '주니어 패키지',dorm: '4인실', duration: '4주',  status: 'current',   total: '$1,720', branch: '강남지사', agencyStatus: 'waiting' },
  { name: 'BAE JONGHO (John)',      course: '가디언 코스',  dorm: '1인실', duration: '8주',  status: 'new',       total: '$2,400', branch: '강남지사', agencyStatus: 'waiting' },
];

const MOCK_COURSES = [
  { name: '일반 코스', type: '일반 영어', oneone: 4, group: 2, fee: 800, active: true },
  { name: 'IELTS 전문 코스', type: 'IELTS', oneone: 5, group: 0, fee: 950, active: true },
  { name: '주니어 패키지', type: '주니어', oneone: 5, group: 1, fee: 880, active: true },
  { name: '가디언 코스', type: '가디언', oneone: 3, group: 1, fee: 700, active: true },
  { name: '비즈니스 영어', type: '비즈니스', oneone: 4, group: 0, fee: 900, active: false },
];

const MOCK_DORM_ROOMS = [
  {
    roomNo: '101', type: '2인실', genderRestriction: '남성',
    beds: [
      { id: 'A', student: 'Kevin (김홍길동)', color: '#5E5CE6', start: '06-01', end: '07-26' },
      { id: 'B', student: 'James (이영어)', color: '#0EA5E9', start: '06-08', end: '07-06' },
    ]
  },
  {
    roomNo: '102', type: '4인실', genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Amy (최학생)', color: '#D97706', start: '06-01', end: '06-29' },
      { id: 'B', student: 'Yuki (田中雪)', color: '#7C3AED', start: '06-08', end: '07-06' },
      { id: 'C', student: null },
      { id: 'D', student: null },
    ]
  },
  {
    roomNo: '201', type: '1인실', genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Sophie (박소연)', color: '#EF4444', start: '05-15', end: '08-14' },
    ]
  },
];

// day 필드 없는 기존 슬롯을 '월' 기본값으로 정규화
MOCK_TIMETABLE.forEach(t => t.slots.forEach(sl => { if (!sl.day) sl.day = '월'; }));

const MOCK_TIMETABLE_HISTORY = [
  { date: '2026-06-08', time: '14:32', actor: 'Head Teacher (Kim)', change: 'Sarah 강사 3교시 → 5교시 이동', reason: '시간 중복 자동 감지 후 재배정', type: 'warn' },
  { date: '2026-06-07', time: '09:15', actor: 'Head Teacher (Kim)', change: 'Mike 강사 7교시 James 배정', reason: '신규 등록 학생 배정', type: 'ok' },
  { date: '2026-06-06', time: '16:00', actor: 'Super Admin', change: '6월 2주차 시간표 전체 확정', reason: '정기 주간 시간표 확정', type: 'ok' },
];

const MOCK_SUBSTITUTE_LOGS = [
  { date: '2026-06-08', originalTeacher: 'Sarah', subTeacher: 'Mike', subject: 'IELTS 1:1', reason: 'Sarah Johnson 지각으로 대체 투입' }
];

const ROLE_CONFIG = {
  super_admin:       { label: '슈퍼 어드민', avatar: 'SA', bg: 'linear-gradient(135deg,#5E5CE6,#818CF8)', menus: ['admin','staff'], breadSec: '본사 관리' },
  head_teacher:      { label: '티칭 헤드', avatar: 'HT', bg: 'linear-gradient(135deg,#0EA5E9,#38BDF8)', menus: ['admin'], breadSec: '학사 관리' },
  accounting:        { label: '회계 담당자', avatar: 'AC', bg: 'linear-gradient(135deg,#16A34A,#4ADE80)', menus: ['admin','staff'], breadSec: '재무 관리' },
  ss_staff:          { label: 'SS 스탭', avatar: 'SS', bg: 'linear-gradient(135deg,#D97706,#FCD34D)', menus: ['admin','staff'], breadSec: '기숙사 관리' },
  teacher:           { label: '강사', avatar: 'TC', bg: 'linear-gradient(135deg,#7C3AED,#A78BFA)', menus: [], breadSec: '수업 관리' },
  student:           { label: '학생', avatar: 'ST', bg: 'linear-gradient(135deg,#10B981,#059669)', menus: [], breadSec: '학생 서비스' },
  staff_housekeeping:{ label: '하우스키핑', avatar: 'HK', bg: 'linear-gradient(135deg,#EF4444,#FCA5A5)', menus: ['staff'], breadSec: '운영 관리' },
  agency_head:       { label: '에이전시 본사', avatar: 'AH', bg: 'linear-gradient(135deg,#0EA5E9,#67E8F9)', menus: ['agency'], breadSec: '에이전시' },
  agency_branch:     { label: '에이전시 지사', avatar: 'AB', bg: 'linear-gradient(135deg,#5E5CE6,#A5B4FC)', menus: ['agency'], breadSec: '에이전시' },
};

const BRANCH_CONFIG = {
  'ph-cebu': { label: '🇵🇭 세부 캠퍼스', country: '필리핀 세부 (Cebu)' },
  'mt-malta': { label: '🇲🇹 몰타 캠퍼스', country: '몰타 (Malta) — 확장 예정' },
};

/* =============================================
   LOGIN
   ============================================= */
function switchLoginTab(tab) {
  document.getElementById('ltab-admin').classList.toggle('active', tab === 'admin');
  document.getElementById('ltab-agency').classList.toggle('active', tab === 'agency');
  document.getElementById('lform-admin').style.display = tab === 'admin' ? 'block' : 'none';
  document.getElementById('lform-agency').style.display = tab === 'agency' ? 'block' : 'none';
}

function handleLogin(type) {
  let role;
  if (type === 'admin') {
    role = document.getElementById('login-role').value;
    APP.branch = document.getElementById('login-branch').value;
  } else {
    role = document.getElementById('login-agency-type').value;
  }

  APP.user = role;
  const cfg = ROLE_CONFIG[role];

  // Apply user info
  const avatarEl = document.getElementById('user-avatar');
  if (role === 'teacher') {
    avatarEl.innerHTML = `<img src="assets/images/teacher_female.png" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt=""/>`;
    avatarEl.style.background = 'none';
  } else if (role === 'student') {
    avatarEl.innerHTML = `<img src="assets/images/student_female.png" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" alt=""/>`;
    avatarEl.style.background = 'none';
  } else {
    avatarEl.textContent = cfg.avatar;
    avatarEl.style.background = cfg.bg;
  }
  document.getElementById('user-display-name').textContent = cfg.label;
  document.getElementById('user-display-role').textContent = cfg.label.toUpperCase();
  document.getElementById('role-badge').textContent = cfg.label;
  document.getElementById('breadcrumb-section').textContent = cfg.breadSec;

  // Branch
  const bCfg = BRANCH_CONFIG[APP.branch] || BRANCH_CONFIG['ph-cebu'];
  document.getElementById('sidebar-branch-label').textContent = bCfg.country;

  // Show / Hide sidebar menus
  applyMenuVisibility(cfg.menus);

  // Agency badge
  if (type === 'agency') {
    const agencyType = document.getElementById('login-agency-type').value;
    document.getElementById('agency-login-badge').textContent =
      agencyType === 'agency_head' ? '🏢 한국 영어마을 본사' : '🏬 한국 영어마을 강남지사';
  }

  // Show app
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-layout').style.display = 'block';

  // Navigate to appropriate default and initialize portal data
  if (role === 'teacher') {
    initTeacherPortal();
    navigate('teacher-dashboard');
  } else if (role === 'student') {
    initStudentPortal();
    navigate('student-dashboard');
  } else if (cfg.menus.includes('agency')) {
    navigate('agency-home');
  } else {
    if (role === 'super_admin') {
      initGlobalDashboard();
    }
    navigate('dashboard');
  }

  // Init all widgets
  initClockTick();
  initTimetableGrid();
  initStudentList();
  initTeacherList();
  initAgencyStudentList();
  initCoursePricing();
  initDormGantt();
  initCalculators();
  updateFeeEstimate();
}

function applyMenuVisibility(menus) {
  const role = APP.user;

  // Generic role categories
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = (menus && menus.includes('admin')) ? '' : 'none';
  });
  document.querySelectorAll('.staff-only').forEach(el => {
    el.style.display = (menus && (menus.includes('staff') || menus.includes('admin'))) ? '' : 'none';
  });
  document.querySelectorAll('.agency-only').forEach(el => {
    el.style.display = (menus && menus.includes('agency')) ? '' : 'none';
  });

  // Specific role menus
  document.querySelectorAll('.teacher-only').forEach(el => {
    el.style.display = (role === 'teacher') ? '' : 'none';
  });
  document.querySelectorAll('.student-only').forEach(el => {
    el.style.display = (role === 'student') ? '' : 'none';
  });
  document.querySelectorAll('.super-admin-only').forEach(el => {
    el.style.display = (role === 'super_admin') ? '' : 'none';
  });

  // Hide general sections for teacher or student completely
  if (role === 'teacher' || role === 'student') {
    document.querySelectorAll('.admin-only, .staff-only, .agency-only').forEach(el => el.style.display = 'none');
  }
}

function handleLogout() {
  APP.user = null;
  // Restore normal Overview menu label
  document.getElementById('menu-dashboard').innerHTML = '<i data-lucide="layout-dashboard"></i> 대시보드';
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('app-layout').style.display = 'none';
}

/* =============================================
   NAVIGATION
   ============================================= */
const VIEW_MAP = {
  dashboard: { el: 'view-dashboard', menu: 'menu-dashboard', label: '대시보드', sec: '개요' },
  timetable: { el: 'view-timetable', menu: 'menu-timetable', label: '시간표 배정', sec: '학사 관리' },
  'weekly-timetable': { el: 'view-weekly-timetable', menu: 'menu-weekly-timetable', label: '주간 시간표', sec: '학사 관리' },
  students: { el: 'view-students', menu: 'menu-students', label: '학생 정보 관리', sec: '학사 관리' },
  teachers: { el: 'view-teachers', menu: 'menu-teachers', label: '강사 정보 관리', sec: '학사 관리' },
  'agency-home': { el: 'view-agency-home', menu: 'menu-agency-home', label: '에이전시 홈', sec: '에이전시' },
  'agency-students': { el: 'view-agency-students', menu: 'menu-agency-students', label: '학생 관리', sec: '에이전시' },
  'agency-dorm': { el: 'view-agency-dorm', menu: 'menu-agency-dorm', label: 'B2B 송금 관리', sec: '에이전시' },
  'agency-invoice': { el: 'view-agency-invoice', menu: 'menu-agency-invoice', label: '인보이스·정산', sec: '에이전시' },
  'dorm-erp': { el: 'view-dorm-erp', menu: 'menu-dorm-erp', label: '기숙사·ERP', sec: '운영' },
  'course-pricing': { el: 'view-course-pricing', menu: 'menu-course-pricing', label: '교육과정·요율', sec: '학사 관리' },
  'bell-settings': { el: 'view-bell-settings', menu: 'menu-bell-settings', label: '교시 및 벨 설정', sec: '학사 관리' },
  'teacher-dashboard': { el: 'view-teacher-dashboard', menu: 'menu-teacher-dashboard', label: '강사 대시보드', sec: '수업 관리' },
  'teacher-timetable': { el: 'view-teacher-timetable', menu: 'menu-teacher-timetable', label: '주간 시간표', sec: '수업 관리' },
  'student-dashboard': { el: 'view-student-dashboard', menu: 'menu-student-dashboard', label: '학생 대시보드', sec: '학생 서비스' },
  'student-timetable-change': { el: 'view-student-timetable-change', menu: 'menu-student-timetable-change', label: '강사 변경 신청', sec: '학생 서비스' },
  'student-dorm': { el: 'view-student-dorm', menu: 'menu-student-dorm', label: '기숙사 현황', sec: '학생 서비스' },
  'student-feedback': { el: 'view-student-feedback', menu: 'menu-student-feedback', label: '강사 평점 입력', sec: '학생 서비스' },
  'global-dashboard': { el: 'view-global-dashboard', menu: 'menu-global-dashboard', label: '글로벌 대시보드', sec: '본사 관리' },
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
  const menuEl = document.getElementById(cfg.menu);
  if (menuEl) menuEl.classList.add('active');

  // Highlight parent menu for timetable sub-items and expand/collapse submenu accordingly
  const parentMenu = document.getElementById('menu-timetable-parent');
  const submenu = document.getElementById('timetable-submenu');
  const arrow = document.getElementById('timetable-submenu-arrow');
  if (parentMenu) {
    if (view === 'timetable' || view === 'bell-settings' || view === 'weekly-timetable') {
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
  } else if (view === 'bell-settings') {
    if (typeof initBellSettingsView === 'function') initBellSettingsView();
  } else if (view === 'dashboard') {
    if (typeof initAdminInbox === 'function') initAdminInbox();
  } else if (view === 'agency-home') {
    if (typeof initAgencyStudentList === 'function') initAgencyStudentList();
    if (typeof initAgencyRequestInbox === 'function') initAgencyRequestInbox();
  } else if (view === 'agency-students') {
    if (typeof initAgencyStudentList === 'function') initAgencyStudentList();
  } else if (view === 'agency-dorm') {
    if (typeof initAgencyStudentList === 'function') initAgencyStudentList();
    if (typeof initAgencyDormRemit === 'function') initAgencyDormRemit();
  } else if (view === 'agency-invoice') {
    if (typeof initAgencyInvoice === 'function') initAgencyInvoice();
  }
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

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

  const activeStudents = MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'new');

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
    alert(`❌ 미확정 학생 배정 차단 (H-09)!\n\n학생 ${s.name}은(는) 학비가 완납되지 않은 미확정(Waiting) 상태이므로 수업을 배정할 수 없습니다.`);
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
    (s.status === 'current' || s.status === 'new') &&
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
    const activeStudents = MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'new');
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
          (s.status === 'current' || s.status === 'new') &&
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
   STUDENT MANAGEMENT
   ============================================= */
function initStudentList() {
  renderStudentList(MOCK_STUDENTS);
}

function renderStudentList(list) {
  const tbody = document.getElementById('student-list-body');
  if (!tbody) return;

  const sorted = [...list].sort((a, b) => b.id - a.id);
  const total = sorted.length;

  tbody.innerHTML = sorted.map((s, idx) => {
    const rowNum = total - idx;
    const statusBadge = s.status === 'current'   ? '<span class="tsa-badge tsa-badge-success">재학생</span>'
      : s.status === 'new'      ? '<span class="tsa-badge tsa-badge-primary">신입생</span>'
      : s.status === 'waiting'  ? '<span class="tsa-badge tsa-badge-warning">대기생</span>'
      : s.status === 'resigned' ? '<span class="tsa-badge tsa-badge-danger">퇴원</span>'
      : '<span class="tsa-badge tsa-badge-gray">졸업생</span>';

    const visaUrgent = isVisaUrgent(s.visaExpiry);
    const attColor = s.attendance >= 90 ? '#16A34A' : s.attendance >= 85 ? '#D97706' : '#EF4444';
    const avatarSrc = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';

    return `<tr>
      <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${rowNum}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <img class="tsa-avatar" src="${avatarSrc}" style="width:34px;height:34px;object-fit:cover;border-radius:50%;border:1px solid #E5E7EB;" alt="${s.nick}"/>
          <div>
            <div style="font-weight:700;font-size:13px;color:#1A1D23">
              ${s.nick} (${s.name})
              <span class="tsa-badge tsa-badge-outline" style="font-size:10px;margin-left:4px;padding:1px 5px;background:#F3F4F6;color:#4B5563;border:1px solid #E5E7EB;">${s.agency}</span>
            </div>
            <div style="font-size:11px;color:#6B7280">${s.flag} ${s.nationality} · ${s.gender}성 ${s.age}세</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-size:12px;font-weight:600;color:#374151">${s.course}</div>
        <div style="font-size:11px;color:#6B7280">${s.duration}주 · <span style="color:#5E5CE6;font-weight:600">${s.level || '-'}</span></div>
      </td>
      <td style="font-size:12px;font-weight:500">${s.dorm}</td>
      <td>
        <span class="tsa-badge tsa-badge-info" style="font-size:10.5px">${s.passportStatus}</span>
      </td>
      <td style="font-size:11px;color:#374151;font-weight:600">
        ${fmtFlightStr(s.flightInfo)}
      </td>
      <td>
        <div style="font-size:12px;font-weight:600;color:#374151">${fmtDate(s.departureDate) || '미설정'}</div>
        <div style="font-size:10px;color:#D97706;font-weight:700">${getDepartureDDay(s.departureDate)}</div>
      </td>
      <td>
        <div style="font-size:12px;font-weight:${visaUrgent?'700':'500'};color:${visaUrgent?'#EF4444':'#374151'}">${s.visaExpiry}</div>
        ${visaUrgent ? '<div style="font-size:10px;color:#EF4444">⚠ 만료 임박</div>' : ''}
        ${s.sspExpiry !== '면제' ? `<div style="font-size:10px;color:#9CA3AF">SSP: ${s.sspExpiry}</div>` : '<div style="font-size:10px;color:#16A34A">SSP 면제</div>'}
      </td>
      <td>
        <div style="font-weight:700;color:${attColor};font-size:13px">${s.attendance}%</div>
        <div class="tsa-progress" style="width:80px">
          <div class="tsa-progress-bar" style="width:${s.attendance}%;background:${attColor}"></div>
        </div>
        ${s.warning > 0 ? `<div style="font-size:10px;color:#EF4444;margin-top:2px">경고 ${s.warning}회</div>` : ''}
      </td>
      <td style="text-align:center">
        <div style="display:flex;gap:6px;justify-content:center">
          ${statusBadge}
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openStudentDetail(${s.id})">
            <i data-lucide="eye" style="font-size:11px"></i> 상세
          </button>
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openStudentEditModal(${s.id})" style="border-color:#5E5CE6;color:#5E5CE6">
            <i data-lucide="pencil" style="font-size:11px"></i> 수정
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function filterStudentList(filter) {
  document.querySelectorAll('#student-filter-pills .tsa-pill').forEach(p => {
    const text = p.textContent.toLowerCase();
    const match =
      (filter === 'all'       && text.includes('전체'))  ||
      (filter === 'new'       && text.includes('신입'))  ||
      (filter === 'current'   && text.includes('재학'))  ||
      (filter === 'completed' && text.includes('졸업'))  ||
      (filter === 'waiting'   && text.includes('대기'));
    if (match) p.classList.add('active');
    else if (filter !== 'search') p.classList.remove('active');
  });

  let list = [...MOCK_STUDENTS];
  if (filter === 'new') list = list.filter(s => s.status === 'new');
  else if (filter === 'current') list = list.filter(s => s.status === 'current');
  else if (filter === 'completed') list = list.filter(s => s.status === 'completed');
  else if (filter === 'waiting') list = list.filter(s => s.status === 'waiting');
  else if (filter === 'search') {
    const q = document.getElementById('student-search').value.toLowerCase();
    list = list.filter(s => {
      if (s.name.toLowerCase().includes(q)) return true;
      if (s.nick.toLowerCase().includes(q)) return true;
      if (s.nationality.toLowerCase().includes(q)) return true;
      if (s.agency.toLowerCase().includes(q)) return true;
      if (s.dorm && s.dorm.toLowerCase().includes(q)) return true;
      if (s.visaExpiry && s.visaExpiry.includes(q)) return true;
      if (s.sspExpiry && s.sspExpiry.toLowerCase().includes(q)) return true;
      const assignedTeacher = MOCK_TIMETABLE.find(t =>
        t.slots.some(slot => slot.student === s.nick)
      );
      if (assignedTeacher && assignedTeacher.teacher.toLowerCase().includes(q)) return true;
      return false;
    });
  }

  renderStudentList(list);
}

function openStudentDetail(id) {
  APP.currentStudent = MOCK_STUDENTS.find(s => s.id === id);
  if (!APP.currentStudent) return;
  const s = APP.currentStudent;
  document.getElementById('modal-student-name').textContent = `${s.nick} (${s.name})`;
  document.getElementById('modal-student-meta').textContent = `${s.flag} ${s.nationality} · ${s.gender}성 ${s.age}세 · ${s.course}`;
  
  // Activate basic tab
  document.querySelectorAll('#student-detail-modal .tsa-tab').forEach((t, idx) => {
    t.classList.toggle('active', idx === 0);
  });

  switchStudentTab('basic', null);
  openModal('student-detail-modal');
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
    case 'basic':
      const avatarSrc = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';
      container.innerHTML = `
        <div style="display:flex;gap:20px;align-items:start;margin-bottom:16px">
          <div style="width:100px;height:100px;border-radius:12px;overflow:hidden;border:1px solid #E9EDF4;flex-shrink:0">
            <img src="${avatarSrc}" style="width:100%;height:100%;object-fit:cover" alt="Student photo"/>
          </div>
          <div class="tsa-info-grid" style="flex:1;grid-template-columns:repeat(3,1fr);gap:16px">
            ${infoItem('여권 성명', s.name)}
            ${infoItem('닉네임 (호칭)', s.nick)}
            ${infoItem('성별 / 나이', `${s.gender}성 ${s.age}세`)}
            ${infoItem('국적', `${s.flag} ${s.nationality}`)}
            ${infoItem('등록 코스', s.course)}
            ${infoItem('연수 기간', `${s.duration}주`)}
            ${infoItem('기숙사', s.dorm)}
            ${infoItem('등록 에이전시', s.agency)}
            ${infoItem('비자 만료일', `<span style="color:${isVisaUrgent(s.visaExpiry)?'#EF4444':'inherit'}">${fmtDate(s.visaExpiry)}</span>`)}
            ${infoItem('SSP 만료일', fmtDate(s.sspExpiry))}
            ${infoItem('퇴교 / 출국일자', s.departureDate ? `${fmtDate(s.departureDate)} <strong style="color:#D97706">(${getDepartureDDay(s.departureDate)})</strong>` : '미설정')}
            ${infoItem('출석 경고', s.warning > 0 ? `<span style="color:#EF4444;font-weight:700">${s.warning}회 (주의)</span>` : '없음')}
            ${infoItem('누적 출석률', `<span style="color:${s.attendance>=90?'#16A34A':'#D97706'};font-weight:800">${s.attendance}%</span>`)}
          </div>
        </div>
        <div class="tsa-divider"></div>
        <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:12px;padding:18px">
          <div style="font-size:12.5px;font-weight:700;color:#92400E;margin-bottom:12px;display:flex;align-items:center;gap:6px">
            <i data-lucide="heart" style="font-size:16px;color:#D97706"></i> 건강 관리 및 식단 특이사항 설정
          </div>
          <div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;align-items:start">
            <div>
              <label class="tsa-label" style="color:#92400E">식단 구분</label>
              <select id="edit-student-diet" class="tsa-input" style="border-color:#FDE68A">
                <option value="일반식" ${s.dietType === '일반식' ? 'selected' : ''}>일반식 (General)</option>
                <option value="채식" ${s.dietType === '채식' ? 'selected' : ''}>채식 (Vegetarian)</option>
                <option value="할랄" ${s.dietType === '할랄' ? 'selected' : ''}>할랄 (Halal)</option>
                <option value="글루텐 프리" ${s.dietType === '글루텐 프리' ? 'selected' : ''}>글루텐 프리 (Gluten-Free)</option>
              </select>
            </div>
            <div>
              <label class="tsa-label" style="color:#92400E">건강 정보 및 복약/알레르기 메모</label>
              <div style="display:flex;gap:10px">
                <input id="edit-student-health-notes" type="text" class="tsa-input" style="border-color:#FDE68A" value="${s.healthNotes || ''}" placeholder="복약 시간대, 알레르기 유무 및 세부 정보를 입력하세요"/>
                <button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="background:#D97706;border:none;flex-shrink:0" onclick="saveStudentHealth(${s.id})">
                  <i data-lucide="check" style="font-size:12px"></i> 특이사항 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'history':
      container.innerHTML = `
        <div style="padding:12px;background:#EEF2FF;border-radius:10px;margin-bottom:14px">
          <div style="font-size:11px;font-weight:700;color:#4F46E5;margin-bottom:6px">📌 수강 완료 이력 (조회 전용)</div>
        </div>
        <table class="tsa-table">
          <thead><tr><th>수강 기간</th><th>코스명</th><th>강사</th><th>출석률</th><th>평가</th></tr></thead>
          <tbody>
            <tr>
              <td style="font-size:12px">2025-09-01 ~ 2025-12-28</td>
              <td style="font-size:12px">일반 영어 코스 (16주)</td>
              <td style="font-size:12px">Sarah, Mike</td>
              <td><span style="color:#16A34A;font-weight:700">97.2%</span></td>
              <td><span class="tsa-badge tsa-badge-success">우수</span></td>
            </tr>
          </tbody>
        </table>
      `;
      break;

    case 'grades':
      renderGradesTab();
      break;

    case 'attendance':
      container.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
          <div style="padding:14px;background:#F0FDF4;border-radius:10px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:#16A34A">${s.attendance}%</div>
            <div style="font-size:11px;color:#16A34A;font-weight:600">누적 출석률</div>
          </div>
          <div style="padding:14px;background:${s.warning>0?'#FEF2F2':'#F0FDF4'};border-radius:10px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:${s.warning>0?'#EF4444':'#16A34A'}">${s.warning}회</div>
            <div style="font-size:11px;color:${s.warning>0?'#EF4444':'#16A34A'};font-weight:600">경고 횟수</div>
          </div>
          <div style="padding:14px;background:#EEF2FF;border-radius:10px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:#5E5CE6">${s.attendance >= 85 ? '✓' : '✗'}</div>
            <div style="font-size:11px;color:#5E5CE6;font-weight:600">졸업 요건 (85%)</div>
          </div>
        </div>
      `;
      break;

    case 'fees':
      renderFeesTab();
      break;
  }
}

function saveStudentHealth(id) {
  const diet = document.getElementById('edit-student-diet').value;
  const notes = document.getElementById('edit-student-health-notes').value.trim();
  
  const student = MOCK_STUDENTS.find(s => s.id === id);
  if (student) {
    student.dietType = diet;
    student.healthNotes = notes || '특이사항 없음.';
    APP.currentStudent = student;
    showToast(`✓ ${student.nick} 학생의 건강 및 식단 정보가 저장되었습니다.`, 'success');
    switchStudentTab('basic', null);
  }
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
   TEACHER MANAGEMENT
   ============================================= */
function initTeacherList() {
  renderTeacherList(MOCK_TEACHERS);
}

function renderTeacherList(list) {
  const tbody = document.getElementById('teacher-list-body');
  if (!tbody) return;

  const typeColors = { 'IELTS 전문': '#5E5CE6', '일반 영어 (1:1)': '#0EA5E9', '그룹 수업': '#16A34A', '비즈니스 영어': '#7C3AED', '주니어 전담': '#D97706' };

  const sorted = [...list].sort((a, b) => b.id - a.id);
  const total = sorted.length;

  tbody.innerHTML = sorted.map((t, idx) => {
    const rowNum = total - idx;
    let statusLabel = '가용';
    let statusClass = 'tsa-badge-success';
    if (t.status === 'leave') {
      statusLabel = '휴가중';
      statusClass = 'tsa-badge-warning';
    } else if (t.status === 'resigned') {
      statusLabel = '퇴사';
      statusClass = 'tsa-badge-gray';
    }

    const avatarSrc = t.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png';

    return `
      <tr>
        <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${rowNum}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <img class="tsa-avatar" src="${avatarSrc}" style="width:34px;height:34px;object-fit:cover;border-radius:50%;border:1px solid #E5E7EB;" alt="${t.nick}"/>
            <div>
              <div style="font-weight:700;font-size:13px;color:#1A1D23">${t.name}</div>
              <div style="font-size:11px;color:#6B7280">경력 ${t.exp}년 · 평점 ⭐ ${t.rating}</div>
            </div>
          </div>
        </td>
        <td><span class="tsa-badge" style="background:${typeColors[t.type]||'#E5E7EB'}20;color:${typeColors[t.type]||'#6B7280'}">${t.type}</span></td>
        <td style="font-size:12px;font-weight:500">Room ${t.room}</td>
        <td><span class="tsa-badge ${t.contract==='정규직'?'tsa-badge-primary':'tsa-badge-gray'}">${t.contract}</span></td>
        <td style="font-size:12px"><strong style="color:#374151">${t.todaySlots}</strong><span style="color:#9CA3AF">/8 교시</span></td>
        <td><span class="tsa-badge ${statusClass}">${statusLabel}</span></td>
        <td style="text-align:center">
          <div style="display:flex;gap:6px;justify-content:center">
            <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openTeacherDetail(${t.id})">
              <i data-lucide="eye" style="font-size:11px"></i> 상세
            </button>
            <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openTeacherEditModal(${t.id})" style="border-color:#5E5CE6;color:#5E5CE6">
              <i data-lucide="pencil" style="font-size:11px"></i> 수정
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTeacherList(status) {
  document.querySelectorAll('#teacher-filter-pills .tsa-pill').forEach(p => {
    const text = p.textContent.toLowerCase();
    if (status === 'all' && text.includes('전체')) p.classList.add('active');
    else if (status === 'active' && text.includes('재직')) p.classList.add('active');
    else if (status === 'leave' && text.includes('휴가')) p.classList.add('active');
    else if (status === 'resigned' && text.includes('퇴사')) p.classList.add('active');
    else p.classList.remove('active');
  });

  let list = [...MOCK_TEACHERS];
  if (status === 'active') list = list.filter(t => t.status === 'active');
  else if (status === 'leave') list = list.filter(t => t.status === 'leave');
  else if (status === 'resigned') list = list.filter(t => t.status === 'resigned');

  renderTeacherList(list);
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

function openStudentRegisterModal() {
  document.getElementById('student-form-title').textContent = "👤 신규 학생 등록";
  document.getElementById('student-form-subtitle').textContent = "신규 입학생의 인적 정보 및 연수 계획을 설정합니다.";
  
  // Clear form
  document.getElementById('sf-id').value = "";
  document.getElementById('sf-passportNum').value = "";
  document.getElementById('sf-startDate').value = "";
  document.getElementById('sf-name').value = "";
  document.getElementById('sf-nick').value = "";
  document.getElementById('sf-gender').value = "남";
  document.getElementById('sf-age').value = "";
  document.getElementById('sf-nationality').value = "한국";
  document.getElementById('sf-course').value = "일반 코스";
  document.getElementById('sf-duration').value = "4";
  document.getElementById('sf-dorm').value = "";
  document.getElementById('sf-agency').value = "직접 등록";
  document.getElementById('sf-visa').value = "";
  document.getElementById('sf-ssp').value = "면제";
  document.getElementById('sf-passport').value = "보관 중";
  document.getElementById('sf-flight').value = "";
  document.getElementById('sf-departure').value = "";
  document.getElementById('sf-diet').value = "일반식";
  document.getElementById('sf-status').value = "new";
  document.getElementById('sf-health').value = "";

  openModal('student-form-modal');
}

function openStudentEditModal(id) {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  document.getElementById('student-form-title').textContent = `👤 학생 정보 수정 - ${s.nick}`;
  document.getElementById('student-form-subtitle').textContent = "선택한 학생의 등록 세부 정보를 업데이트합니다.";

  // Populate form
  document.getElementById('sf-id').value = s.id;
  document.getElementById('sf-passportNum').value = s.passportNum || "";
  document.getElementById('sf-startDate').value = s.startDate || "";
  document.getElementById('sf-name').value = s.name || "";
  document.getElementById('sf-nick').value = s.nick || "";
  document.getElementById('sf-gender').value = s.gender || "남";
  document.getElementById('sf-age').value = s.age || "";
  document.getElementById('sf-nationality').value = s.nationality || "한국";
  document.getElementById('sf-course').value = s.course || "일반 코스";
  document.getElementById('sf-duration').value = s.duration || "4";
  document.getElementById('sf-dorm').value = s.dorm || "";
  document.getElementById('sf-agency').value = s.agency || "직접 등록";
  document.getElementById('sf-visa').value = s.visaExpiry || "";
  document.getElementById('sf-ssp').value = s.sspExpiry || "면제";
  document.getElementById('sf-passport').value = s.passportStatus || "보관 중";
  document.getElementById('sf-flight').value = s.flightInfo || "";
  document.getElementById('sf-departure').value = s.departureDate || "";
  document.getElementById('sf-diet').value = s.dietType || "일반식";
  document.getElementById('sf-status').value = s.status || "new";
  document.getElementById('sf-health').value = s.healthNotes || "";

  // Close details modal if open
  closeModal('student-detail-modal');
  openModal('student-form-modal');
}

function saveStudentForm() {
  const idVal = document.getElementById('sf-id').value;
  const passportNum = document.getElementById('sf-passportNum').value.trim();
  const startDate = document.getElementById('sf-startDate').value;
  const name = document.getElementById('sf-name').value.trim();
  const nick = document.getElementById('sf-nick').value.trim();
  const gender = document.getElementById('sf-gender').value;
  const age = parseInt(document.getElementById('sf-age').value);

  // 신규 등록 시에만 검증
  if (!idVal) {
    if (!passportNum) {
      showToast('여권번호를 입력해 주세요.', 'danger');
      return;
    }
    if (!startDate) {
      showToast('수강 시작일을 입력해 주세요.', 'danger');
      return;
    }
    const dayOfWeek = new Date(startDate).getDay();
    if (dayOfWeek !== 1) {
      showToast('수강 시작일은 반드시 월요일이어야 합니다.', 'danger');
      return;
    }
    const dupPassport = MOCK_STUDENTS.find(s => s.passportNum && s.passportNum.toUpperCase() === passportNum.toUpperCase());
    if (dupPassport) {
      showToast(`중복된 여권번호입니다 — 이미 등록된 학생: ${dupPassport.nick} (${dupPassport.name})`, 'danger');
      return;
    }
  }
  const nationality = document.getElementById('sf-nationality').value;
  const course = document.getElementById('sf-course').value;
  const duration = parseInt(document.getElementById('sf-duration').value);
  const dorm = document.getElementById('sf-dorm').value.trim();
  const agency = document.getElementById('sf-agency').value.trim();
  const visaExpiry = document.getElementById('sf-visa').value;
  const sspExpiry = document.getElementById('sf-ssp').value.trim();
  const passportStatus = document.getElementById('sf-passport').value;
  const flightInfo = document.getElementById('sf-flight').value.trim();
  const departureDate = document.getElementById('sf-departure').value;
  const dietType = document.getElementById('sf-diet').value;
  const status = document.getElementById('sf-status').value;
  const healthNotes = document.getElementById('sf-health').value.trim();

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
      s.course = course;
      s.duration = duration;
      s.dorm = dorm;
      s.agency = agency;
      s.visaExpiry = visaExpiry;
      s.sspExpiry = sspExpiry;
      s.passportStatus = passportStatus;
      s.flightInfo = flightInfo;
      s.departureDate = departureDate || "";
      s.dietType = dietType;
      s.status = status;
      s.healthNotes = healthNotes || "특이사항 없음.";

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
    // Register new student
    const newId = Math.max(...MOCK_STUDENTS.map(std => std.id), 0) + 1;
    
    // Default departure date calculation if not provided: today + duration weeks
    let depDate = departureDate;
    if (!depDate) {
      const today = new Date();
      today.setDate(today.getDate() + (duration * 7));
      depDate = today.toISOString().split('T')[0];
    }

    const newStudent = {
      id: newId,
      passportNum: passportNum.toUpperCase(),
      startDate: startDate,
      name: name,
      nick: nick,
      gender: gender,
      age: age,
      nationality: nationality,
      flag: flag,
      course: course,
      duration: duration,
      dorm: dorm || "미배정",
      visaExpiry: visaExpiry || "미설정",
      sspExpiry: sspExpiry || "면제",
      passportStatus: passportStatus,
      flightInfo: flightInfo || "미등록",
      departureDate: depDate,
      dietType: dietType,
      status: status,
      healthNotes: healthNotes || "특이사항 없음.",
      attendance: 100.0,
      warning: 0,
      quiz: [],
      grades: { speaking: [], listening: [], reading: [], writing: [] },
      fees: [
        { id: newId * 1000 + 1, item: '입학금 (Registration Fee)', amount: 100, paid: false },
        { id: newId * 1000 + 2, item: '교재 및 보증금 (Deposit)', amount: 150, paid: false }
      ]
    };
    MOCK_STUDENTS.push(newStudent);
    showToast(`✓ [학생 등록 완료] 신규 입학생 ${nick} (${name})이 성공적으로 등록되었습니다.`, 'success');
  }

  closeModal('student-form-modal');
  filterStudentList('all');
  renderUnassignedQueue();
  renderTimetable(APP.conflictMode);
}

/* =============================================
   TEACHER REGISTER & EDIT FORM HANDLERS
   ============================================= */
function openTeacherRegisterModal() {
  document.getElementById('teacher-form-title').textContent = "🧑‍🏫 신규 강사 등록";
  document.getElementById('teacher-form-subtitle').textContent = "학원 소속 신규 강사의 기본 정보 및 배정 강의실을 설정합니다.";

  // Clear form
  document.getElementById('tf-id').value = "";
  document.getElementById('tf-name').value = "";
  document.getElementById('tf-nick').value = "";
  document.getElementById('tf-gender').value = "여";
  document.getElementById('tf-exp').value = "";
  document.getElementById('tf-room').value = "";
  document.getElementById('tf-type').value = "일반 영어 (1:1)";
  document.getElementById('tf-contract').value = "정규직";
  document.getElementById('tf-status').value = "active";
  document.getElementById('tf-available').value = "true";

  openModal('teacher-form-modal');
}

function openTeacherEditModal(id) {
  const t = MOCK_TEACHERS.find(tch => tch.id === id);
  if (!t) return;

  document.getElementById('teacher-form-title').textContent = `🧑‍🏫 강사 정보 수정 - ${t.nick}`;
  document.getElementById('teacher-form-subtitle').textContent = "선택한 강사의 인사 카드 및 담당 계약 조건을 편집합니다.";

  // Populate form
  document.getElementById('tf-id').value = t.id;
  document.getElementById('tf-name').value = t.name || "";
  document.getElementById('tf-nick').value = t.nick || "";
  document.getElementById('tf-gender').value = t.gender || "여";
  document.getElementById('tf-exp').value = t.exp || "";
  document.getElementById('tf-room').value = t.room || "";
  document.getElementById('tf-type').value = t.type || "일반 영어 (1:1)";
  document.getElementById('tf-contract').value = t.contract || "정규직";
  document.getElementById('tf-status').value = t.status || "active";
  document.getElementById('tf-available').value = String(t.available);

  // Close details modal if open
  closeModal('teacher-detail-modal');
  openModal('teacher-form-modal');
}

function saveTeacherForm() {
  const idVal = document.getElementById('tf-id').value;
  const name = document.getElementById('tf-name').value.trim();
  const nick = document.getElementById('tf-nick').value.trim();
  const gender = document.getElementById('tf-gender').value;
  const exp = parseInt(document.getElementById('tf-exp').value);
  const room = document.getElementById('tf-room').value.trim();
  const type = document.getElementById('tf-type').value;
  const contract = document.getElementById('tf-contract').value;
  const status = document.getElementById('tf-status').value;
  const available = document.getElementById('tf-available').value === 'true';

  if (idVal) {
    // Edit
    const t = MOCK_TEACHERS.find(tch => tch.id == idVal);
    if (t) {
      const oldNick = t.nick;
      t.name = name;
      t.nick = nick;
      t.gender = gender;
      t.exp = exp;
      t.room = room;
      t.type = type;
      t.contract = contract;
      t.status = status;
      t.available = available;

      // Update nickname and room in MOCK_TIMETABLE too!
      const ttRow = MOCK_TIMETABLE.find(row => row.teacher === oldNick);
      if (ttRow) {
        ttRow.teacher = nick;
        ttRow.room = room;
      }

      showToast(`✓ [강사 수정 완료] ${t.nick} 강사의 계약 정보가 정상 업데이트되었습니다.`, 'success');
    }
  } else {
    // Register new teacher
    const newId = Math.max(...MOCK_TEACHERS.map(tch => tch.id), 0) + 1;
    const newTeacher = {
      id: newId,
      name: name,
      nick: nick,
      gender: gender,
      type: type,
      room: room,
      contract: contract,
      available: available,
      todaySlots: 0,
      rating: 4.5,
      exp: exp,
      status: status,
      availability: {
        '월': [true, true, true, true, true, true, true, true],
        '화': [true, true, true, true, true, true, true, true],
        '수': [true, true, true, true, true, true, true, true],
        '목': [true, true, true, true, true, true, true, true],
        '금': [true, true, true, true, true, true, true, true],
        '토': [false, false, false, false, false, false, false, false],
        '일': [false, false, false, false, false, false, false, false],
      }
    };
    MOCK_TEACHERS.push(newTeacher);

    // Also push a blank timetable row for the new teacher
    const typeColors = {
      'IELTS 전문': '#5E5CE6',
      '일반 영어 (1:1)': '#0EA5E9',
      '그룹 수업': '#16A34A',
      '주니어 전담': '#D97706',
      '비즈니스 영어': '#7C3AED'
    };
    const bgColors = {
      'IELTS 전문': '#EEF2FF',
      '일반 영어 (1:1)': '#E0F2FE',
      '그룹 수업': '#DCFCE7',
      '주니어 전담': '#FEF3C7',
      '비즈니스 영어': '#F5F3FF'
    };
    
    MOCK_TIMETABLE.push({
      teacher: nick,
      room: room,
      color: typeColors[type] || '#5E5CE6',
      bg: bgColors[type] || '#EEF2FF',
      slots: ['월', '화', '수', '목', '금', '토', '일'].flatMap(day => 
        [1,2,3,4,5,6,7,8].map(p => ({
          p: p,
          day: day,
          student: null,
          type: null,
          locked: false
        }))
      )
    });

    showToast(`✓ [강사 등록 완료] 신규 강사 ${nick}님이 성공적으로 등록되었으며, 가용 시간표 노드가 활성화되었습니다.`, 'success');
  }

  closeModal('teacher-form-modal');
  filterTeacherList('all');
  renderTimetable(APP.conflictMode);
}

function openTeacherDetail(id) {
  APP.currentTeacher = MOCK_TEACHERS.find(t => t.id === id);
  if (!APP.currentTeacher) return;
  const t = APP.currentTeacher;
  document.getElementById('modal-teacher-name').textContent = `${t.name} (${t.nick})`;
  document.getElementById('modal-teacher-meta').textContent = `${t.gender}성 · ${t.type} · ${t.contract}`;
  
  // Activate basic tab
  document.querySelectorAll('#teacher-detail-modal .tsa-tab').forEach((tab, idx) => {
    tab.classList.toggle('active', idx === 0);
  });

  switchTeacherTab('profile', null);
  openModal('teacher-detail-modal');
}

function switchTeacherTab(tab, el) {
  if (el) {
    document.querySelectorAll('#teacher-detail-modal .tsa-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  const t = APP.currentTeacher;
  const container = document.getElementById('teacher-modal-tab-content');
  if (!t || !container) return;

  switch (tab) {
    case 'profile':
      const tAvatarSrc = t.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png';
      container.innerHTML = `
        <div style="display:flex;gap:20px;align-items:start;margin-bottom:16px">
          <div style="width:100px;height:100px;border-radius:12px;overflow:hidden;border:1px solid #E9EDF4;flex-shrink:0">
            <img src="${tAvatarSrc}" style="width:100%;height:100%;object-fit:cover" alt="Teacher photo"/>
          </div>
          <div class="tsa-info-grid" style="flex:1;grid-template-columns:repeat(3,1fr);gap:16px">
            ${infoItem('성명', t.name)}
            ${infoItem('닉네임', t.nick)}
            ${infoItem('성별', t.gender+'성')}
            ${infoItem('전문 분야', t.type)}
            ${infoItem('담당 교실', 'Room '+t.room)}
            ${infoItem('고용 형태', t.contract)}
            ${infoItem('경력', t.exp+'년')}
            ${infoItem('평점', '⭐ '+t.rating+'/5.0')}
            ${infoItem('가용 상태', t.status === 'active' ? '<span style="color:#16A34A;font-weight:700">가용</span>' : t.status === 'leave' ? '<span style="color:#F59E0B;font-weight:700">휴가중</span>' : '퇴사')}
          </div>
        </div>
      `;
      break;

    case 'availability':
      renderTeacherAvailabilityTab();
      break;

    case 'schedule':
      container.innerHTML = `
        <div style="padding:12px;background:#EEF2FF;border-radius:8px;margin-bottom:14px;font-size:12px;color:#4F46E5">
          <strong>조회 전용:</strong> 실제 배정은 "시간표 및 수업 배정" 메뉴에서만 가능합니다.
        </div>
        <table class="tsa-table" style="font-size:12px">
          <thead><tr><th>요일 / 교시</th><th>학생</th><th>수업 유형</th><th>교실</th></tr></thead>
          <tbody>
            ${(MOCK_TIMETABLE.find(m=>m.teacher===t.nick)||{slots:[]}).slots.filter(s=>s.student).map(s=>`
              <tr>
                <td style="font-weight:600">${s.day}요일 ${s.p}교시</td>
                <td style="font-weight:600">${s.student}</td>
                <td><span class="tsa-badge tsa-badge-primary" style="font-size:10px">${s.type||'-'}</span></td>
                <td>Room ${t.room}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      break;

    case 'eval':
      container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
          <div style="padding:14px;background:#F0FDF4;border-radius:10px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:#16A34A">⭐ ${t.rating}</div>
            <div style="font-size:11px;color:#16A34A;font-weight:600">학생 평균 평점</div>
          </div>
          <div style="padding:14px;background:#EEF2FF;border-radius:10px;text-align:center">
            <div style="font-size:24px;font-weight:800;color:#5E5CE6">98.5%</div>
            <div style="font-size:11px;color:#5E5CE6;font-weight:600">근태 출근율</div>
          </div>
        </div>
        <div style="font-size:12px;font-weight:600;color:#374151;margin-bottom:8px">대체 수업 배정 히스토리 로그</div>
        <table class="tsa-table" style="font-size:11.5px">
          <thead><tr><th>날짜</th><th>대체 교사</th><th>과목</th><th>사유</th></tr></thead>
          <tbody>
            ${(() => {
              const subLogs = MOCK_SUBSTITUTE_LOGS.filter(log => log.originalTeacher === t.nick || log.subTeacher === t.nick);
              if (subLogs.length === 0) {
                return `<tr><td colspan="4" style="text-align:center;color:#9CA3AF">대체 수업 이력이 없습니다.</td></tr>`;
              }
              return subLogs.map(log => `
                <tr>
                  <td>${log.date}</td>
                  <td><strong>${log.subTeacher}</strong> (원래: ${log.originalTeacher})</td>
                  <td>${log.subject}</td>
                  <td>${log.reason}</td>
                </tr>
              `).join('');
            })()}
          </tbody>
        </table>
      `;
      break;
  }
}

function renderTeacherAvailabilityTab() {
  const t = APP.currentTeacher;
  const container = document.getElementById('teacher-modal-tab-content');
  if (!t) return;

  const days = ['월', '화', '수', '목', '금', '토', '일'];

  container.innerHTML = `
    <div style="font-size:12px;color:#6B7280;margin-bottom:14px">요일 및 교시별 강사 시간표 가용성을 직접 편집합니다. 체크해제 시 배정이 원천 차단됩니다.</div>
    <div style="overflow-x:auto">
      <table class="tsa-table" style="font-size:11px; text-align: center;">
        <thead>
          <tr>
            <th style="text-align: left;">교시</th>
            ${days.map(d => `<th style="text-align: center;">${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${[1,2,3,4,5,6,7,8].map(p => `
            <tr>
              <td style="font-weight:700; text-align: left; white-space: nowrap;">${p}교시</td>
              ${days.map(d => {
                let isChecked = false;
                if (t.availability) {
                  if (t.availability[d]) {
                    isChecked = t.availability[d][p-1];
                  } else if (Array.isArray(t.availability)) {
                    isChecked = t.availability[p-1];
                  }
                }
                return `
                  <td style="text-align: center; vertical-align: middle;">
                    <input type="checkbox" id="avail-${d}-p-${p}" ${isChecked ? 'checked' : ''} style="width:16px;height:16px;accent-color:#5E5CE6; cursor:pointer"/>
                  </td>
                `;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:14px;display:flex;justify-content:flex-end">
      <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="saveTeacherAvailability(${t.id})">
        <i data-lucide="check"></i> 요일별 가용성 변경 저장
      </button>
    </div>
  `;
}

function saveTeacherAvailability(id) {
  const t = MOCK_TEACHERS.find(tch => tch.id === id);
  if (t) {
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    
    // Conflict Detection
    let conflicts = [];
    days.forEach(d => {
      for (let p = 1; p <= 8; p++) {
        const isChecked = document.getElementById(`avail-${d}-p-${p}`).checked;
        if (!isChecked) {
          const tTimetable = MOCK_TIMETABLE.find(time => time.teacher === t.nick);
          if (tTimetable) {
            const slot = tTimetable.slots.find(slot => Number(slot.p) === Number(p) && slot.day === d && slot.student);
            if (slot) {
              conflicts.push({ day: d, period: p, student: slot.student, slotObj: slot });
            }
          }
        }
      }
    });

    if (conflicts.length > 0) {
      const conflictMsg = conflicts.map(c => `[${c.day}요일 ${c.period}교시: ${c.student}]`).join(', ');
      const resolveOption = prompt(`⚠️ 가용성 변경 배정 충돌 발생!\n\n${t.nick} 강사의 가용성을 비활성화하려는 시간대에 이미 학생이 배정되어 있습니다:\n${conflictMsg}\n\n[1] 입력: 배정 일괄 해제 (해당 학생들 미배정 이동)\n[2] 입력: 배정 유지 (강제 저장하되 경고 표시)\n\n취소하려면 ESC를 누르거나 빈 칸으로 두십시오.`, "1");
      
      if (resolveOption === "1") {
        conflicts.forEach(c => {
          c.slotObj.student = '';
          c.slotObj.type = '';
        });
        showToast("✓ 충돌 시간대 학생 배정이 성공적으로 일괄 해제되었습니다.", "info");
      } else if (resolveOption === "2") {
        showToast("✓ 배정이 유지된 상태로 가용성이 저장되었습니다.", "warning");
      } else {
        return; // cancel save
      }
    }

    if (!t.availability || Array.isArray(t.availability)) {
      t.availability = {};
    }
    days.forEach(d => {
      if (!t.availability[d]) {
        t.availability[d] = [true, true, true, true, true, true, true, true];
      }
      for (let p = 1; p <= 8; p++) {
        const isChecked = document.getElementById(`avail-${d}-p-${p}`).checked;
        t.availability[d][p-1] = isChecked;
      }
    });
    showToast(`✓ [가용성 연동 완료] ${t.nick} 강사의 요일별 가용성이 업데이트되어 시간표 셀이 동기화되었습니다.`, 'success');
    renderTimetable(APP.conflictMode);
    closeModal('teacher-detail-modal');
  }
}

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

  const unpaidStudents = students.filter(s => s.remittanceStatus === 'unpaid' || s.remittanceStatus === 'submitted');
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

  // 미납 송금 건수 (대기 학생 제외, unpaid/submitted만)
  const unpaidRemitCount = students.filter(s => s.status !== '대기' && (s.remittanceStatus === 'unpaid' || s.remittanceStatus === 'submitted')).length;
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
  { id:1, studentName:'HONG GILDONG (Kevin)',  course:'IELTS 전문 코스', net:2080, remitDate:'2026-05-10', receipt:'영수증_Kevin.pdf',  status:'approved', note:'송금 확인 완료. 등록 확정 처리.' },
  { id:2, studentName:'LEE YOUNGEOH (James)',  course:'일반 코스',        net:1138, remitDate:'2026-06-08', receipt:'영수증_James.pdf',  status:'pending',  note:'' },
  { id:3, studentName:'KIM MINJUN (Minjun)',   course:'IELTS 전문 코스', net:2240, remitDate:'2026-06-12', receipt:'영수증_Minjun.pdf', status:'rejected', note:'영수증 금액 불일치 ($2,240 vs $2,320). 재제출 요망.' },
  { id:4, studentName:'NGUYEN THI LAN (Lan)',  course:'가디언 코스',      net:1600, remitDate:'2026-05-28', receipt:'영수증_Lan.pdf',    status:'approved', note:'에이전시 선납 확인 완료.' },
  { id:5, studentName:'PHAM MINH DUC (Duc)',   course:'IELTS 전문 코스', net:3360, remitDate:'2026-06-14', receipt:'영수증_Duc.pdf',    status:'pending',  note:'' },
];
const MOCK_CHANGE_REQUESTS = [
  { id:1, studentName:'이수빈 (James)',  field:'항공편 (입국)', oldVal:'PR502 | 2026-06-15', newVal:'PR734 | 2026-06-20', reason:'항공편 변경됨',     reqDate:'2026-05-20', status:'approved' },
  { id:2, studentName:'박민준 (Minjun)', field:'수강 기간',     oldVal:'8주',               newVal:'12주',              reason:'학생 요청으로 연장', reqDate:'2026-06-02', status:'pending'  },
  { id:3, studentName:'김수빈 (Subin)',  field:'비자 만료일',   oldVal:'2026-08-01',         newVal:'2026-10-01',        reason:'비자 갱신 완료',     reqDate:'2026-06-05', status:'rejected' },
];

function switchReqTab(tab) {
  document.getElementById('req-panel-remit').style.display  = tab === 'remit'  ? '' : 'none';
  document.getElementById('req-panel-change').style.display = tab === 'change' ? '' : 'none';
  const remitBtn  = document.getElementById('req-tab-remit');
  const changeBtn = document.getElementById('req-tab-change');
  if (!remitBtn || !changeBtn) return;
  remitBtn.style.borderBottomColor  = tab === 'remit'  ? '#D97706' : 'transparent';
  remitBtn.style.color              = tab === 'remit'  ? '#D97706' : '#6B7280';
  changeBtn.style.borderBottomColor = tab === 'change' ? '#D97706' : 'transparent';
  changeBtn.style.color             = tab === 'change' ? '#D97706' : '#6B7280';
}

function initAgencyRequestInbox() {
  const pending  = [...MOCK_REMIT_REQUESTS, ...MOCK_CHANGE_REQUESTS].filter(r => r.status === 'pending').length;
  const approved = [...MOCK_REMIT_REQUESTS, ...MOCK_CHANGE_REQUESTS].filter(r => r.status === 'approved').length;
  const rejected = [...MOCK_REMIT_REQUESTS, ...MOCK_CHANGE_REQUESTS].filter(r => r.status === 'rejected').length;
  const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setEl('req-pending-count',  `대기중 ${pending}건`);
  setEl('req-approved-count', `승인 ${approved}건`);
  setEl('req-rejected-count', `반려 ${rejected}건`);

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

function openRemitRequestModal()  { alert('송금 영수증 제출 모달 (추후 구현 예정)'); }
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
      const isWaiting  = s.status === 'waiting' || s.status === 'new';
      const isSubmitted = s.remittanceStatus === 'submitted';
      const hasDraft   = !isWaiting && !isSubmitted && (s.remittanceMemo || s.remittanceReceipt);

      if (!isWaiting) { totalNet += net; unpaidCount++; }
      if (hasDraft) draftCount++;

      // 등록 상태 배지
      const stateBadge = isWaiting
        ? `<span class="tsa-badge tsa-badge-warning" style="font-size:10px">대기</span>`
        : `<span class="tsa-badge tsa-badge-success" style="font-size:10px">확정</span>`;

      // Net 금액
      const netDisplay = isWaiting
        ? `<div style="font-size:13px;font-weight:700;color:#9CA3AF">~$${net.toLocaleString()}</div>
           <div style="font-size:10px;color:#D1D5DB;font-style:italic">예상(미확정)</div>`
        : `<div style="font-size:14px;font-weight:800;color:#1E1B4B">$${net.toLocaleString()}</div>`;

      // 영수증/메모 상태 셀
      let draftCell = '';
      if (isWaiting) {
        draftCell = `<span style="font-size:10px;color:#D1D5DB">-</span>`;
      } else if (isSubmitted) {
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
      if (isWaiting) {
        actionBtn = `<span style="font-size:10px;color:#D1D5DB;font-style:italic">등록 확정 후 처리</span>`;
      } else if (isSubmitted) {
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

      const rowBg = isWaiting ? 'background:#FAFAFA' : (hasDraft ? 'background:#F0F7FF' : '');

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
    .filter(s => s.remittanceStatus === 'submitted' || s.remittanceStatus === 'paid')
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
    showToast('⚠ 은행 송금 영수증 파일을 첨부해 주세요.', 'danger');
    return;
  }

  const memoEl = document.getElementById('remit-modal-memo');
  s.remittanceStatus = 'submitted';
  s.remittanceReceipt = remitModalFile;
  s.remittanceDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
  s.remittanceMemo = memoEl ? memoEl.value.trim() : (s.remittanceMemo || '');

  closeModal('modal-remit-submit');
  showToast(`✓ ${s.name} 학생의 송금 영수증이 어드민 승인 대기함으로 전송되었습니다.`, 'success');

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
    else if (s.remittanceStatus === 'submitted') { paidLabel = '승인대기'; paidClass = 'tsa-badge-warning'; }

    let statusLabel = '대기', statusClass = 'tsa-badge-warning';
    if (s.status === 'current') { statusLabel = '확정'; statusClass = 'tsa-badge-success'; }
    else if (s.status === 'completed') { statusLabel = '졸업'; statusClass = 'tsa-badge-gray'; }
    else if (s.status === 'resigned') { statusLabel = '퇴원'; statusClass = 'tsa-badge-danger'; }

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
      const hasInvoice = s.remittanceStatus === 'paid' || s.remittanceStatus === 'submitted';
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

  const checkedStatuses = Array.from(document.querySelectorAll('.filter-agency-status-cb:checked')).map(cb => cb.value);
  list = list.filter(s => {
    let state = 'waiting';
    if (s.status === 'completed') state = 'completed';
    else if (s.status === 'resigned') state = 'resigned';
    else if (s.status === 'current') state = 'active';
    else state = 'waiting'; // 'new' 또는 미지정
    return checkedStatuses.includes(state);
  });

  const checkedPaid = Array.from(document.querySelectorAll('.filter-agency-paid-cb:checked')).map(cb => cb.value);
  list = list.filter(s => {
    let state = 'unpaid';
    if (s.remittanceStatus === 'paid') state = 'paid';
    else if (s.remittanceStatus === 'submitted') state = 'partial';
    return checkedPaid.includes(state);
  });

  const sortedList = [...list].sort((a, b) => b.id - a.id);
  const totalList = sortedList.length;

  tbody.innerHTML = sortedList.map((s, idx) => {
    const rowNum = totalList - idx;
    const isChecked = agencySelectedStudentIds.includes(s.id) ? 'checked' : '';
    const prices = calculatePrices(s);

    let state = '대기';
    let badgeClass = 'tsa-badge-warning';
    if (s.status === 'completed') { state = '졸업생'; badgeClass = 'tsa-badge-gray'; }
    else if (s.status === 'resigned') { state = '퇴원'; badgeClass = 'tsa-badge-danger'; }
    else if (s.status === 'current') { state = '확정'; badgeClass = 'tsa-badge-success'; }

    let paidLabel = '미납';
    let paidClass = 'tsa-badge-danger';
    if (s.remittanceStatus === 'paid') { paidLabel = '완납'; paidClass = 'tsa-badge-success'; }
    else if (s.remittanceStatus === 'submitted') { paidLabel = '승인대기'; paidClass = 'tsa-badge-warning'; }

    const avatarSrc = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';

    let teacherName = '미배정';
    const tMatch = MOCK_TIMETABLE.find(t => t.slots.some(slot => slot.student === s.nick));
    if (tMatch) teacherName = tMatch.teacher;

    return `
      <tr>
        <td><input type="checkbox" class="agency-student-cb" data-id="${s.id}" ${isChecked} onchange="toggleSelectAgencyStudent(${s.id})"/></td>
        <td style="text-align:center;color:#9CA3AF;font-size:11px;width:36px">${rowNum}</td>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <img src="${avatarSrc}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;" alt=""/>
            <div>
              <div style="font-weight:600;font-size:13px">${s.name}</div>
              <div style="font-size:10.5px;color:#6B7280">Nick: ${s.nick}</div>
            </div>
          </div>
        </td>
        <td>${s.nationality}</td>
        <td>${s.course}</td>
        <td><span class="tsa-badge ${badgeClass}">${state}</span></td>
        <td><span class="tsa-badge ${paidClass}">${paidLabel}</span></td>
        <td>${fmtDate(s.startDate)} ~ (${s.duration}주)</td>
        <td class="col-flight" style="font-size:11px;line-height:1.8">
          <div><span style="color:#6B7280;font-size:10px">입국</span> ${fmtFlightStr(s.flightInfo) || '-'}</div>
          <div><span style="color:#6B7280;font-size:10px">출국</span> ${fmtFlightStr(s.flightOutInfo) || fmtDate(s.departureDate) || '-'}</div>
        </td>
        <td class="col-visa">${fmtDate(s.visaExpiry)}</td>
        <td class="col-ssp">${fmtDate(s.sspExpiry)}</td>
        <td class="col-dorm">${s.dorm}</td>
        <td class="col-commission">${state === '대기'
          ? `<span style="color:#9CA3AF;font-size:11px">~$${prices.commission.toLocaleString()}</span><br><span style="font-size:9.5px;color:#D1D5DB;font-style:italic">예상(미확정)</span>`
          : `$${prices.commission.toLocaleString()} (20%)`}</td>
        <td>${state === '대기'
          ? `<span style="color:#9CA3AF;font-size:11px">~$${prices.gross.toLocaleString()}</span><br><span style="font-size:9.5px;color:#D1D5DB;font-style:italic">예상(미확정)</span>`
          : `$${prices.gross.toLocaleString()}`}</td>
        <td style="text-align:center">
          <div style="display:flex;gap:6px;justify-content:center">
            <button class="tsa-btn tsa-btn-outline tsa-btn-xs" style="color:#5E5CE6;border-color:#5E5CE6" onclick="openAgencyStudentDetailModal(${s.id})">상세/수정</button>
            ${state === '대기'
              ? `<button class="tsa-btn tsa-btn-xs" disabled style="background:#F3F4F6;color:#D1D5DB;border:1px solid #E5E7EB;cursor:not-allowed" title="등록 확정 후 서류 출력 가능">서류출력</button>`
              : `<button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openAgencyDocumentsInline(${s.id})">서류출력</button>`}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const select = document.getElementById('remit-student-select');
  if (select) {
    // 확정 학생 중 미납만 송금 대상 (대기생은 제외)
    const remitList = list.filter(s => s.remittanceStatus !== 'paid' && s.status === 'current');
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
  
  document.querySelectorAll('.filter-agency-status-cb').forEach(cb => {
    cb.checked = (cb.value === 'waiting' || cb.value === 'active');
  });
  document.querySelectorAll('.filter-agency-paid-cb').forEach(cb => {
    cb.checked = true;
  });
  initAgencyStudentList();
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

function filterAgencyStudentListByKpi(type) {
  navigate('agency-students');
  resetAgencyFilters();
  if (type === 'active') {
    document.querySelectorAll('.filter-agency-status-cb').forEach(cb => {
      cb.checked = (cb.value === 'active');
    });
  } else if (type === 'new') {
    document.querySelectorAll('.filter-agency-status-cb').forEach(cb => {
      cb.checked = (cb.value === 'waiting');
    });
  } else if (type === 'unpaid') {
    document.querySelectorAll('.filter-agency-paid-cb').forEach(cb => {
      cb.checked = (cb.value === 'unpaid');
    });
  } else if (type === 'visa') {
    document.getElementById('filter-agency-visa').value = '30';
  }
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
  document.getElementById('areg-arrival-date').value = '';
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

  calculateAregExpectedFees();
}

function calculateAregExpectedFees() {
  const startVal = document.getElementById('areg-start-date').value;
  if (!startVal) return;

  const course = document.getElementById('areg-course').value;
  const dorm = document.getElementById('areg-dorm').value;
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
  const dorm = document.getElementById('areg-dorm').value;
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
    gender: gender,
    age: age,
    nationality: nationality,
    flag: nationality === '한국' ? '🇰🇷' : nationality === '일본' ? '🇯🇵' : nationality === '중국' ? '🇨🇳' : nationality === '베트남' ? '🇻🇳' : '🇲🇳',
    course: course,
    duration: duration,
    dorm: dorm,
    visaExpiry: visaExpiry || '면제',
    sspExpiry: sspExpiry || '면제',
    arrivalDate: arrivalDate,
    dormIn: dormIn,
    dormOut: dormOut,
    startDate: startDateVal,
    departureDate: dormOut,
    attendance: 100,
    status: 'new',
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
    showToast('⚠ 해외 송금 확인을 위한 은행 영수증 증빙 파일을 첨부해 주세요.', 'danger');
    return;
  }

  s.remittanceStatus = 'submitted';
  s.remittanceReceipt = remitSelectedFile;
  s.remittanceDate = new Date().toISOString().replace('T', ' ').substring(0, 16);

  showToast(`✓ ${s.name} 학생의 순 송금액(Net) 영수증이 어드민 승인 대기함으로 전송되었습니다.`, 'success');

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
  
  let stateStr = '대기 (Waiting)';
  if (s.status === 'completed') stateStr = '졸업 (Completed)';
  else if (s.status === 'resigned') stateStr = '퇴원 (Resigned)';
  else if (s.remittanceStatus === 'paid') stateStr = '확정 (Active)';

  document.getElementById('adetail-title-subtitle').textContent = `등록 상태: ${stateStr} · ${s.agency || '한국 영어마을'}`;
  
  const avatar = document.getElementById('adetail-avatar');
  avatar.src = s.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';

  switchAdetailTab('basic');
  openModal('agency-student-detail-modal');
}

function switchAdetailTab(tab) {
  currentAdetailTab = tab;
  
  const tabsList = ['basic', 'flight', 'docs', 'class', 'settle', 'visa'];
  tabsList.forEach(t => {
    const el = document.getElementById(`adetail-tab-${t}`);
    if (el) el.classList.toggle('active', t === tab);
  });

  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  const container = document.getElementById('adetail-tab-content');
  if (!s || !container) return;

  const isActive = s.remittanceStatus === 'paid';
  const lockAttr = isActive ? 'disabled style="background:#F3F4F6"' : '';
  const changeBtn = (field, label) => isActive ? `<button class="tsa-btn tsa-btn-xs tsa-btn-outline" style="margin-left:8px;color:#EF4444;border-color:#FCA5A5" onclick="openAgencyChangeRequestModal('${field}', '${label}')"><i data-lucide="file-pen" style="font-size:10px"></i> 변경 요청</button>` : '';

  let html = '';

  if (tab === 'basic') {
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
          <label class="tsa-label">나이</label>
          <input id="ad-age" type="number" class="tsa-input" value="${s.age}" ${lockAttr}/>
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
                  <i data-lucide="heart-pulse" style="font-size:13px;color:#D97706"></i> 식이 및 건강 특이사항
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
                  <div style="background:#fff;border:1px solid #FDE68A;border-radius:7px;padding:10px">
                    <div style="font-size:10px;color:#9CA3AF;font-weight:600;margin-bottom:4px">식단 구분</div>
                    <div style="display:inline-block;background:${dietBg};color:${dietBadgeColor};font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px">
                      ${dietLabel[s.dietType] || s.dietType || '일반식 (Regular)'}
                    </div>
                  </div>
                  <div style="background:#fff;border:1px solid ${hasHealthAlert ? '#FCA5A5' : '#FDE68A'};border-radius:7px;padding:10px;${hasHealthAlert ? 'border-color:#FCA5A5' : ''}">
                    <div style="font-size:10px;color:#9CA3AF;font-weight:600;margin-bottom:4px">건강 · 복약 · 알레르기</div>
                    <div style="font-size:12px;color:${hasHealthAlert ? '#B91C1C' : '#374151'};font-weight:${hasHealthAlert ? '700' : '400'}">
                      ${hasHealthAlert ? '⚠ ' : ''}${s.healthNotes || '특이사항 없음'}
                    </div>
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px">
        <div class="tsa-form-group">
          <label class="tsa-label">입국일자 (기숙사 입실일) ${changeBtn('dormIn', '기숙사 입실일')}</label>
          <input id="ad-dorm-in" type="date" class="tsa-input" value="${s.dormIn || s.startDate}" ${lockAttr}/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">퇴교일자 (기숙사 퇴실일) ${changeBtn('dormOut', '기숙사 퇴실일')}</label>
          <input id="ad-dorm-out" type="date" class="tsa-input" value="${s.dormOut || s.departureDate}" ${lockAttr}/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">✈ 입국 항공편 (편명 · 입국일)</label>
          <input id="ad-flight" type="text" class="tsa-input" value="${s.flightInfo || ''}" placeholder="예) KE631 | 2026-06-01 입국"/>
          <small style="color:#6B7280;margin-top:4px;display:block">※ 픽업 스태프에게 즉시 공유 — 변경 시 24시간 전 갱신 필수</small>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">✈ 출국 항공편 (편명 · 출국일)</label>
          <input id="ad-flight-out" type="text" class="tsa-input" value="${s.flightOutInfo || ''}" placeholder="예) KE632 | 2026-07-27 출국"/>
          <small style="color:#6B7280;margin-top:4px;display:block">※ 공항 배웅 서비스 해당 시 필수 기재</small>
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
          <label class="tsa-label">희망 기숙사 ${changeBtn('dorm', '희망 기숙사')}</label>
          <select id="ad-dorm" class="tsa-input" ${lockAttr}>
            <option value="1인실 (Premium A)" ${s.dorm.includes('1인실') ? 'selected' : ''}>1인실 (Premium A)</option>
            <option value="2인실 (Standard B)" ${s.dorm.includes('2인실') ? 'selected' : ''}>2인실 (Standard B)</option>
            <option value="4인실 (Dormitory C)" ${s.dorm.includes('4인실') ? 'selected' : ''}>4인실 (Dormitory C)</option>
          </select>
        </div>
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
        </div>
      </div>
    `;
  } else if (tab === 'settle') {
    const prices = calculatePrices(s);

    let crHistoryHtml = '';
    if (s.changeRequests && s.changeRequests.length > 0) {
      crHistoryHtml = `
        <div style="border-top:1px solid #E5E7EB;margin-top:16px;padding-top:12px">
          <div style="font-weight:700;font-size:11.5px;color:#374151;margin-bottom:6px">🔄 변경 요청 처리 이력</div>
          <table class="tsa-table" style="font-size:11px">
            <thead>
              <tr>
                <th>변경 항목</th>
                <th>기존 값</th>
                <th>요청 값</th>
                <th>처리 상태</th>
                <th>요청 일자</th>
              </tr>
            </thead>
            <tbody>
              ${s.changeRequests.map(r => {
                let badge = `<span class="tsa-badge tsa-badge-warning">대기</span>`;
                if (r.status === 'accepted') badge = `<span class="tsa-badge tsa-badge-success">승인</span>`;
                else if (r.status === 'rejected') badge = `<span class="tsa-badge tsa-badge-danger" title="${r.rejectReason || ''}">반려</span>`;
                return `
                  <tr>
                    <td>${r.field}</td>
                    <td>${r.from}</td>
                    <td>${r.to}</td>
                    <td>${badge}</td>
                    <td>${r.requestDate}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    const isAgency = APP.user === 'agency_head' || APP.user === 'agency_branch';
    let localFeesHtml = `
      <div style="border:1px solid #E9EDF4;border-radius:10px;padding:14px;background:#FAFAFA;grid-column:span 2;margin-top:4px">
        <div style="font-weight:700;font-size:12.5px;color:#1E3A8A;margin-bottom:8px">💵 현지 부대비용 (로컬피) 청구 및 수납 관리</div>
        <table class="tsa-table" style="font-size:11.5px;margin-bottom:10px">
          <thead>
            <tr>
              <th>청구 항목</th>
              <th style="text-align:right">금액</th>
              <th style="text-align:center">수납 상태</th>
              ${!isAgency ? '<th style="text-align:center">수납 처리</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${s.fees ? s.fees.map(f => {
              const statusBadge = f.paid 
                ? '<span class="tsa-badge tsa-badge-success">수납완료</span>' 
                : '<span class="tsa-badge tsa-badge-danger">미납</span>';
              
              const actionButton = !isAgency
                ? (f.paid 
                    ? `<button class="tsa-btn tsa-btn-outline tsa-btn-xs" disabled style="background:#F3F4F6">완료</button>` 
                    : `<button class="tsa-btn tsa-btn-success tsa-btn-xs" style="background:#10B981;border:none" onclick="payLocalFee(${s.id}, ${f.id})">납부 처리</button>`)
                : '';
              
              return `
                <tr>
                  <td>${f.item}</td>
                  <td style="text-align:right;font-weight:700">$${f.amount.toLocaleString()}</td>
                  <td style="text-align:center">${statusBadge}</td>
                  ${!isAgency ? `<td style="text-align:center">${actionButton}</td>` : ''}
                </tr>
              `;
            }).join('') : '<tr><td colspan="4" style="text-align:center">청구 내역 없음</td></tr>'}
          </tbody>
        </table>
    `;

    const unpaidFees = s.fees ? s.fees.filter(f => !f.paid) : [];
    if (unpaidFees.length > 0) {
      const today = new Date();
      const arrival = new Date(s.arrivalDate || s.startDate);
      const diffDays = Math.ceil((today - arrival) / (1000 * 60 * 60 * 24));
      if (diffDays >= 90) {
        localFeesHtml += `
          <div style="background:#FEF2F2;border:1px solid #FCA5A5;padding:8px 12px;border-radius:6px;color:#B91C1C;font-size:11px;font-weight:700;">
            ⚠️ 미수금 90일 이상 연체 경고: 입국일로부터 ${diffDays}일 경과하였으나 미납된 현지 부대비용이 존재합니다. 에이전시 정산 요망.
          </div>
        `;
      }
    }
    localFeesHtml += `</div>`;

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
        </div>
        ${crHistoryHtml}
      </div>
    `;
  } else if (tab === 'visa') {
    html = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:10px">
        <div class="tsa-form-group">
          <label class="tsa-label">여권 번호 ${changeBtn('passportNum', '여권 번호')}</label>
          <input id="ad-passport-num" type="text" class="tsa-input" value="${s.passportNum || 'M12345678'}" ${lockAttr}/>
        </div>
        <div class="tsa-form-group">
          <label class="tsa-label">여권 만료일 ${changeBtn('passportExpiry', '여권 만료일')}</label>
          <input id="ad-passport-expiry" type="date" class="tsa-input" value="${s.passportExpiry || '2030-12-31'}" ${lockAttr}/>
        </div>
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
  }

  container.innerHTML = html;
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

function saveAgencyStudentDetails() {
  const s = MOCK_STUDENTS.find(std => std.id === currentAdetailStudentId);
  if (!s) return;

  const isActive = s.remittanceStatus === 'paid';

  if (!isActive) {
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
    s.age = age;
    s.nationality = nationality;

    const course = document.getElementById('ad-course').value;
    const duration = parseInt(document.getElementById('ad-duration').value) || 4;
    const startDate = document.getElementById('ad-start-date').value;
    const dorm = document.getElementById('ad-dorm').value;

    s.course = course;
    s.duration = duration;
    s.startDate = startDate;
    s.dorm = dorm;

    s.dormIn = document.getElementById('ad-dorm-in').value;
    s.dormOut = document.getElementById('ad-dorm-out').value;
  }

  const phoneVal = document.getElementById('ad-phone') ? document.getElementById('ad-phone').value.trim() : s.phone;
  const specialVal = document.getElementById('ad-special') ? document.getElementById('ad-special').value.trim() : s.healthNotes;
  const flightVal = document.getElementById('ad-flight') ? document.getElementById('ad-flight').value.trim() : s.flightInfo;
  const flightOutVal = document.getElementById('ad-flight-out') ? document.getElementById('ad-flight-out').value.trim() : s.flightOutInfo;

  if (flightVal !== s.flightInfo) {
    const today = new Date();
    let isWithin24Hrs = false;
    if (s.startDate) {
      const startD = new Date(s.startDate);
      const diffMs = startD - today;
      const diffHrs = diffMs / (1000 * 60 * 60);
      if (diffHrs >= 0 && diffHrs <= 24) {
        isWithin24Hrs = true;
      }
    }
    if (isWithin24Hrs) {
      alert("⚠ 경고: 수강 시작일(입국일) 24시간 이내의 급박한 항공 스케줄 변경입니다. 현지 공항 픽업 스태프 배정에 차질이 있을 수 있습니다.");
    }
  }

  s.phone = phoneVal;
  s.healthNotes = specialVal;
  s.flightInfo = flightVal;
  s.flightOutInfo = flightOutVal;

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
  const changeBody = document.getElementById('admin-change-inbox-body');
  const remitCount = document.getElementById('admin-waiting-remits-count');
  const changeCount = document.getElementById('admin-waiting-changes-count');

  if (!remitBody) return;

  const waitingRemits = MOCK_STUDENTS.filter(s => s.remittanceStatus === 'submitted');
  remitCount.textContent = `송금 대기: ${waitingRemits.length}건`;

  if (waitingRemits.length === 0) {
    remitBody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#9CA3AF">승인 대기 중인 송금 영수증이 없습니다.</td></tr>`;
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

  const pendingRequests = [];
  MOCK_STUDENTS.forEach(s => {
    if (s.changeRequests) {
      s.changeRequests.forEach(cr => {
        if (cr.status === 'pending') {
          pendingRequests.push({ student: s, cr: cr });
        }
      });
    }
  });

  changeCount.textContent = `변경 대기: ${pendingRequests.length}건`;

  if (pendingRequests.length === 0) {
    changeBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#9CA3AF">승인 대기 중인 중요 정보 변경 요청이 없습니다.</td></tr>`;
  } else {
    changeBody.innerHTML = pendingRequests.map(item => {
      const s = item.student;
      const cr = item.cr;
      return `
        <tr>
          <td>한국 영어마을</td>
          <td><strong>${s.name} (Nick: ${s.nick})</strong></td>
          <td><span class="tsa-badge tsa-badge-primary">${cr.field}</span></td>
          <td style="color:#6B7280;text-decoration:line-through">${cr.from}</td>
          <td style="font-weight:700;color:#10B981">${cr.to}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${cr.reason}</td>
          <td style="text-align:center">
            <button class="tsa-btn tsa-btn-success tsa-btn-xs" style="background:#10B981;border:none" onclick="confirmAdminChangeRequest(${s.id}, ${cr.id})">승인</button>
            <button class="tsa-btn tsa-btn-danger tsa-btn-xs" onclick="rejectAdminChangeRequest(${s.id}, ${cr.id})">반려</button>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  if (typeof initAdminAttendanceInbox === 'function') {
    initAdminAttendanceInbox();
  }
}

function confirmAdminRemittance(id) {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  s.remittanceStatus = 'paid';
  s.status = 'current'; 
  s.passportStatus = '보관 중';

  const agencyStd = MOCK_AGENCY_STUDENTS.find(a => a.name.includes(s.name) || a.name.includes(s.nick));
  if (agencyStd) {
    agencyStd.agencyStatus = 'active';
  }

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[송금 완료 승인] ${s.name} (${s.nick}) 학생의 B2B 송금이 확인되어 등록이 확정(Active)되었습니다.`,
    type: 'success',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ ${s.name} 학생의 송금 영수증을 정상 승인하였습니다. 학생 상태가 Active로 전환되었습니다.`, 'success');
  
  initAdminInbox();
  initAgencyStudentList();
  if (typeof initStudentList === 'function') initStudentList();
}

function rejectAdminRemittance(id) {
  const s = MOCK_STUDENTS.find(std => std.id === id);
  if (!s) return;

  const reason = prompt("송금 영수증 반려 사유를 입력하십시오:");
  if (reason === null) return;

  s.remittanceStatus = 'unpaid';
  s.remittanceReceipt = null;

  MOCK_AGENCY_NOTIFICATIONS.unshift({
    id: 'N-' + Date.now(),
    text: `[송금 반려] ${s.name} 학생의 송금 확인 요청이 반려되었습니다. 사유: ${reason || '이체 확인 불가'}`,
    type: 'danger',
    date: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  showToast(`✓ ${s.name} 학생의 송금을 반려 처리하였습니다.`, 'warning');
  
  initAdminInbox();
  initAgencyStudentList();
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
   DORMITORY & ERP
   ============================================= */
function initDormGantt() {
  const container = document.getElementById('dorm-gantt-container');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:10px;gap:8px">
      <button class="tsa-btn tsa-btn-outline tsa-btn-sm" style="border-color:#10B981;color:#10B981" onclick="openDormRoomChangeModal()"><i data-lucide="refresh-cw"></i> 🔄 룸 체인지 실행</button>
      <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="openDormAssignModal()"><i data-lucide="plus-square"></i> 기숙사 호실 배정 추천</button>
    </div>
  ` + MOCK_DORM_ROOMS.map(room => `
    <div style="border:1px solid #E9EDF4;border-radius:12px;overflow:hidden;margin-bottom:12px">
      <div style="background:#F8F9FC;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #E9EDF4">
        <div>
          <span style="font-size:13px;font-weight:700;color:#1A1D23">Room ${room.roomNo}</span>
          <span class="tsa-badge tsa-badge-gray" style="margin-left:8px;font-size:10px">${room.type}</span>
        </div>
        <span style="font-size:10.5px;color:#6B7280;font-weight:600">제한: [${room.genderRestriction}]</span>
      </div>
      <div style="padding:12px;display:flex;flex-direction:column;gap:7px">
        ${room.beds.map(bed => {
          let studentPhotoHtml = '';
          if (bed.student) {
            const studentNick = bed.student.split(' ')[0];
            const std = MOCK_STUDENTS.find(m => m.nick === studentNick);
            if (std) {
              const avatarSrc = std.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png';
              studentPhotoHtml = `<img src="${avatarSrc}" style="width:20px;height:20px;border-radius:50%;object-fit:cover;margin-right:6px;border:1px solid rgba(255,255,255,0.6);" alt=""/>`;
            }
          }
          return `
            <div style="display:flex;align-items:center;gap:10px">
              <span style="font-size:11px;font-weight:700;color:#6B7280;width:40px;flex-shrink:0">Bed ${bed.id}</span>
              ${bed.student
                ? `<div class="tsa-gantt-bar" style="flex:1;background:${bed.color};display:flex;align-items:center;">
                    ${studentPhotoHtml}
                    <span>${bed.student}</span>
                    <span style="margin-left:auto;font-size:10px;opacity:0.8">${bed.start} ~ ${bed.end}</span>
                  </div>`
                : `<div style="flex:1;height:32px;border-radius:7px;border:1.5px dashed #D1D5DB;display:flex;align-items:center;justify-content:center;font-size:11px;color:#9CA3AF">공실 (예약 가능)</div>`
              }
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
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
  const total = parseFloat(document.getElementById('elec-total-charge').value) || 0;
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
  const weight = parseFloat(document.getElementById('laundry-weight').value) || 0;
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
   COURSE & PRICING
   ============================================= */
function initCoursePricing() {
  renderCourseList();
  updateFeeEstimate();
}

function renderCourseList() {
  const tbody = document.getElementById('course-list-body');
  if (!tbody) return;

  tbody.innerHTML = MOCK_COURSES.map(c => `
    <tr>
      <td>
        <div style="font-weight:700;font-size:13px;color:#1A1D23">${c.name}</div>
      </td>
      <td><span class="tsa-badge tsa-badge-primary" style="font-size:10px">${c.type}</span></td>
      <td style="font-size:12px">1:1 ${c.oneone}h + 그룹 ${c.group}h</td>
      <td style="font-weight:700;font-size:13px;color:#374151">$${c.fee}</td>
      <td><span class="tsa-badge ${c.active?'tsa-badge-success':'tsa-badge-gray'}">${c.active?'활성':'비활성'}</span></td>
      <td style="text-align:center">
        <div style="display:flex;gap:5px;justify-content:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="showToast('과정 수정 모달 (개발 대기)','info')">수정</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCourseModal() {
  openModal('course-add-modal');
}

function saveCourse() {
  showToast('신규 과정이 추가되었습니다 (목록 반영)', 'success');
  closeModal('course-add-modal');
}

function setPricingMode(mode) {
  APP.pricingMode = mode;
  document.getElementById('mode-btn-a').className = `tsa-btn ${mode==='A'?'tsa-btn-primary':'tsa-btn-outline'}`;
  document.getElementById('mode-btn-b').className = `tsa-btn ${mode==='B'?'tsa-btn-primary':'tsa-btn-outline'}`;
  document.getElementById('active-mode-label').textContent = mode==='A' ? 'A안 (절댓값 할증)' : 'B안 (차등 가산)';

  if (mode === 'A') {
    document.getElementById('rate-1w').value = 200;
    document.getElementById('rate-2w').value = 150;
    document.getElementById('rate-3w').value = 125;
  } else {
    document.getElementById('rate-1w').value = 40;
    document.getElementById('rate-2w').value = 60;
    document.getElementById('rate-3w').value = 85;
  }
  updatePricingParams();
  showToast(`${mode}안 할증 요율이 적용되었습니다 — 견적 반영`, 'success');
}

function updatePricingParams() {
  updateFeeEstimate();
}

function updateFeeEstimate() {
  const course = parseFloat(document.getElementById('fee-course-general')?.value) || 800;
  const dorm = parseFloat(document.getElementById('fee-dorm-2')?.value) || 600;
  const reg = parseFloat(document.getElementById('fee-register')?.value) || 100;
  const el = document.getElementById('fee-estimate-total');
  if (el) el.textContent = `$${(course + dorm + reg).toLocaleString()}`;
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
   TEACHER PORTAL LOGIC
   ============================================= */
let teacherDashboardData = {
  teacherNick: 'Sarah',
  completedSlots: [false, false, false, false, false, false, false, false],
  attendance: ['출석', '출석', '출석', '출석', '출석', '출석', '출석', '출석'],
  quizzes: [85, 90, 80, 75, 85, 90, 0, 0],
  progress: ['', '', '', '', '', '', '', ''],
  feedback: ['', '', '', '', '', '', '', '']
};

function initTeacherPortal() {
  setupTeacherDashboard();
  setupTeacherTimetable();
}

function setupTeacherDashboard() {
  const tbody = document.getElementById('teacher-today-classes-body');
  if (!tbody) return;

  const tTimetable = MOCK_TIMETABLE.find(t => t.teacher === 'Sarah');
  if (!tTimetable) return;

  // 요일 필터: APP.selectedDay 또는 현재 요일 사용 (데모 기본값 '월')
  const dayMap = { 0: '일', 1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토' };
  const todayDay = APP.selectedDay || dayMap[new Date().getDay()] || '월';
  const todaySlots = tTimetable.slots.filter(s => s.day === todayDay);
  // 교시 순으로 정렬
  todaySlots.sort((a, b) => a.p - b.p);

  const times = {
    1: '08:00 - 08:50', 2: '09:00 - 09:50', 3: '10:00 - 10:50', 4: '11:00 - 11:50',
    5: '12:30 - 13:20', 6: '13:30 - 14:20', 7: '14:30 - 15:20', 8: '15:30 - 16:20'
  };

  let completedCount = 0;
  let activeSlots = 0;
  let html = '';

  todaySlots.forEach((s) => {
    const timeStr = times[s.p] || '';
    if (!s.student) {
      html += `
        <tr style="background:#FAFAFA">
          <td style="font-weight:700;color:#9CA3AF">${s.p}교시</td>
          <td style="color:#9CA3AF;font-size:12px">${timeStr}</td>
          <td colspan="4" style="color:#C4C9D4;font-style:italic;font-size:12px">
            <span style="display:flex;align-items:center;gap:6px">
              <i data-lucide="clock" style="font-size:13px;color:#D1D5DB"></i> 빈 슬롯 — 수업 미배정
            </span>
          </td>
        </tr>
      `;
      return;
    }

    activeSlots++;
    const isDone = teacherDashboardData.completedSlots[s.p - 1];
    if (isDone) completedCount++;

    const std = MOCK_STUDENTS.find(m => m.nick === s.student);
    const avatarSrc = std ? (std.gender === '남' ? 'assets/images/student_male.png' : 'assets/images/student_female.png') : 'assets/images/student_male.png';

    const isSub = (s.p === 2);
    const subBadge = isSub ? `<span class="tsa-badge tsa-badge-warning" style="font-size:9.5px;padding:1px 5px;margin-left:6px">대체 배정</span>` : '';

    const actionButton = isDone
      ? `<span class="tsa-badge tsa-badge-success"><i data-lucide="check-check"></i> 입력 완료</span>`
      : `<button class="tsa-btn tsa-btn-primary tsa-btn-sm" style="padding:4px 8px;font-size:11px" onclick="openTeacherInputModal(${s.p}, '${s.student}', ${isSub})">출결/성적 입력</button>`;

    html += `
      <tr style="${isSub && !isDone ? 'background:#FFFDF5;border-left:3px solid #F59E0B' : ''}">
        <td style="font-weight:700">${s.p}교시</td>
        <td style="color:#6B7280;font-size:12px">${timeStr}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <img src="${avatarSrc}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;border:1px solid #E5E7EB;" alt=""/>
            <span style="font-weight:700">${s.student}</span>
            ${subBadge}
          </div>
        </td>
        <td><span class="tsa-badge tsa-badge-primary">${s.type || '1:1'}</span></td>
        <td><div style="font-size:11px;color:#6B7280">${s.subject || 'IELTS Speaking'} (${s.level || 'Band 6.0'})</div></td>
        <td style="text-align:center">${actionButton}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
  document.getElementById('teacher-completed-stats').textContent = `완료 ${completedCount}/${activeSlots}`;
  if (typeof refreshIcons === 'function') refreshIcons();

  // Substitute class alert card control
  const hasSubAlert = assignedSlots.some(s => s.p === 2) && !teacherDashboardData.completedSlots[1];
  document.getElementById('card-sub-alert').style.display = hasSubAlert ? 'block' : 'none';
}

function setupTeacherTimetable() {
  const gridBody = document.getElementById('teacher-weekly-grid-body');
  if (!gridBody) return;

  const times = {
    1: '08:00 - 08:50', 2: '09:00 - 09:50', 3: '10:00 - 10:50', 4: '11:00 - 11:50',
    5: '12:30 - 13:20', 6: '13:30 - 14:20', 7: '14:30 - 15:20', 8: '15:30 - 16:20'
  };

  const tTimetable = MOCK_TIMETABLE.find(t => t.teacher === 'Sarah');
  if (!tTimetable) return;

  document.getElementById('teacher-timetable-room').textContent = `지정 강의실: Room ${tTimetable.room || '101'}`;

  let html = '';
  for (let p = 1; p <= 8; p++) {
    const timeStr = times[p];
    const slot = tTimetable.slots.find(s => s.p === p);

    html += `<tr><td style="font-weight:700">${p}교시 (${timeStr})</td>`;
    
    // Fill Mon-Fri (Monday is the default matching slot)
    for (let day = 0; day < 5; day++) {
      if (slot && slot.student) {
        // Mock weekday content, Monday is actual match
        const isMon = (day === 0);
        const name = slot.student;
        const sub = slot.subject || 'IELTS Prep';
        html += `
          <td style="background:${tTimetable.bg || '#EEF2FF'};border-color:#C7D2FE">
            <div style="font-weight:700;color:${tTimetable.color || '#5E5CE6'}">${name}</div>
            <div style="font-size:10px;opacity:0.75;margin-top:2px">${sub} (Room ${tTimetable.room})</div>
          </td>
        `;
      } else {
        html += `<td style="background:#FAFAFA;color:#9CA3AF;font-style:italic;text-align:center">비어있음</td>`;
      }
    }
    html += '</tr>';
  }
  gridBody.innerHTML = html;
}

let activeTeacherInput = { period: 0, studentNick: '', isSub: false };

function openTeacherInputModal(period, studentNick, isSub = false) {
  activeTeacherInput = { period, studentNick, isSub };

  document.getElementById('teacher-modal-subtitle').innerHTML = `<strong>${studentNick}</strong> 학생 · ${period}교시 수업`;
  
  // Handover card control (visible if it's substitute class)
  const handoverPanel = document.getElementById('sub-handover-panel');
  if (handoverPanel) {
    if (isSub) {
      handoverPanel.style.display = 'block';
      // Load Minjun's health details or mock handover info
      const s = MOCK_STUDENTS.find(std => std.nick === studentNick);
      document.getElementById('sub-handover-progress').textContent = s ? s.healthNotes : '진도: Grammar Focus Book 2 / Ch.1';
      document.getElementById('sub-handover-health').textContent = s ? `식이: ${s.dietType || '일반식'}, 건강: ${s.healthNotes || '없음'}` : '일반 식단';
    } else {
      handoverPanel.style.display = 'none';
    }
  }

  // Set default values in inputs
  const idx = period - 1;
  const currentAtt = teacherDashboardData.attendance[idx] || '출석';
  const currentQuiz = teacherDashboardData.quizzes[idx] || 85;
  const currentProg = teacherDashboardData.progress[idx] || 'IELTS Target Band 6.0 Ch.5 Page 112';
  const currentFeedback = teacherDashboardData.feedback[idx] || '';

  // Select radio button
  updateAttLabelStyle(currentAtt);
  
  // Set quiz range slider
  document.getElementById('teacher-input-quiz-score').value = currentQuiz;
  document.getElementById('teacher-quiz-score-val').textContent = `${currentQuiz} 점`;

  // Set progress and feedback inputs
  document.getElementById('teacher-input-progress').value = currentProg;
  document.getElementById('teacher-input-feedback').value = currentFeedback;

  openModal('modal-teacher-class-input');
}

function updateAttLabelStyle(val) {
  const lbls = ['present', 'late', 'absent', 'leave'];
  const mapping = { '출석': 'present', '지각': 'late', '결석': 'absent', '조퇴': 'leave' };
  const activeId = mapping[val];

  lbls.forEach(l => {
    const el = document.getElementById(`att-lbl-${l}`);
    if (el) {
      el.style.background = 'white';
      el.style.borderColor = '#E5E7EB';
      el.style.color = '#374151';
      const radInput = el.querySelector('input');
      if (radInput) radInput.checked = false;
    }
  });

  const activeEl = document.getElementById(`att-lbl-${activeId}`);
  if (activeEl) {
    activeEl.style.background = '#EEF2FF';
    activeEl.style.borderColor = '#C7D2FE';
    activeEl.style.color = '#5E5CE6';
    const radInput = activeEl.querySelector('input');
    if (radInput) radInput.checked = true;
  }
}

function submitClassPerformanceInput() {
  const period = activeTeacherInput.period;
  const studentNick = activeTeacherInput.studentNick;
  const idx = period - 1;

  // Read values
  const attVal = document.querySelector('input[name="teacher-attendance-val"]:checked').value;
  const quizVal = parseInt(document.getElementById('teacher-input-quiz-score').value);
  const progVal = document.getElementById('teacher-input-progress').value.trim();
  const feedbackVal = document.getElementById('teacher-input-feedback').value.trim();

  if (!progVal) {
    showToast('수업 진도를 입력해 주세요.', 'danger');
    return;
  }

  // Save to teacher memory
  teacherDashboardData.completedSlots[idx] = true;
  teacherDashboardData.attendance[idx] = attVal;
  teacherDashboardData.quizzes[idx] = quizVal;
  teacherDashboardData.progress[idx] = progVal;
  teacherDashboardData.feedback[idx] = feedbackVal;

  // Sync back to student database
  const s = MOCK_STUDENTS.find(std => std.nick === studentNick);
  if (s) {
    s.quiz.push(quizVal);
    s.healthNotes = `[최종 수업 피드백] ${progVal} (${feedbackVal})`;
    
    // Recalculate student attendance average slightly
    if (attVal === '결석') {
      s.attendance = Math.max(60, Math.round(s.attendance * 0.98 * 10) / 10);
    } else {
      s.attendance = Math.min(100, Math.round(s.attendance * 1.01 * 10) / 10);
    }
  }

  closeModal('modal-teacher-class-input');
  setupTeacherDashboard();
  showToast(`✓ [입력 완료] ${studentNick} 학생의 출결(${attVal}), 성적(${quizVal}점)이 반영 완료되었습니다.`, 'success');
}

function openSubstituteHandoverModal() {
  // Directly open input modal for 2교시 (substitute)
  openTeacherInputModal(2, 'Minjun', true);
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
    container.querySelectorAll('i').forEach(s => {
      s.className = 'ki-outline ki-star';
      s.style.color = '#D1D5DB';
    });
    container.dataset.rating = "0";
  });
}

function setStarRating(element, rating) {
  const container = element.parentElement;
  container.dataset.rating = rating;

  const stars = container.querySelectorAll('i');
  for (let i = 0; i < stars.length; i++) {
    if (i < rating) {
      stars[i].className = 'ki-filled ki-star';
      stars[i].style.color = '#F59E0B';
    } else {
      stars[i].className = 'ki-outline ki-star';
      stars[i].style.color = '#D1D5DB';
    }
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
function openDormRoomChangeModal() {
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
   BELL & PERIOD SETTINGS PAGE
   ============================================= */
function initBellSettingsView() {
  // Set input values to current state
  const settings = APP.bellSystem || { duration: 50, break: 10, start: '08:00', total: 8, lunchAfter: 4, lunchDuration: 30 };
  
  document.getElementById('bell-settings-duration').value = settings.duration;
  document.getElementById('bell-settings-break').value = settings.break;
  document.getElementById('bell-settings-start').value = settings.start || '08:00';
  document.getElementById('bell-settings-total-periods').value = settings.total || 8;
  document.getElementById('bell-settings-lunch-after').value = settings.lunchAfter || 4;
  document.getElementById('bell-settings-lunch-duration').value = settings.lunchDuration || 30;

  // Draw preview
  previewBellSettings();
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

/* =============================================
   AUTO-INIT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  console.log('TSA LMS v2.5 ready — 로그인 화면에서 시작');
});
