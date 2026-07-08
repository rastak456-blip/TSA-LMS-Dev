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
  _adminStatusFilter: 'all',
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
    attendance: 88.2, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 1,
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
    attendance: 98.5, status: 'current', agency: '직접 등록', warning: 0, 
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
    attendance: 0, status: 'current', agency: '한국 영어마을', warning: 0,
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
    attendance: 0, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
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
    attendance: 100, status: 'current', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
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
    attendance: 0, status: 'waiting', agency: '한국 영어마을', warning: 0,
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
    attendance: 55.0, status: 'resigned', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 5,
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
    attendance: 0, status: 'waiting', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
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
    course: '주니어 패키지', level: 'Upper-Beginner', duration: 8, dorm: 'Room 106 / Bed A',
    dormAccomType: '기숙사', dormType: '2인실', dormGrade: '이코노미',
    dormIn: '2026-05-31', dormOut: '2026-08-01',
    visaExpiry: '2026-08-01', sspExpiry: '면제',
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
    ],
    changeRequests: [
      { id: 9001, field: '수강 기간', from: '6주', to: '8주', reason: '학부모 요청으로 연장', status: 'approved', requestDate: '2026-05-10', changedBy: '한국 영어마을', approvedBy: '슈퍼 어드민', approvedDate: '2026-05-11' },
      { id: 9002, field: '항공편 (입국)', from: 'KE501 | 2026-05-28', to: 'KE639 | 2026-06-01', reason: '항공편 일정 변경', status: 'approved', requestDate: '2026-05-20', changedBy: '한국 영어마을', approvedBy: '슈퍼 어드민', approvedDate: '2026-05-21' },
      { id: 9003, field: '비상 연락처', from: '010-9988-0000', to: '010-9988-1234 (부)', reason: '보호자 연락처 업데이트', status: 'approved', requestDate: '2026-06-02', changedBy: '한국 영어마을', approvedBy: '슈퍼 어드민', approvedDate: '2026-06-02' },
      { id: 9004, field: '식단 구분', from: '일반식', to: '채식', reason: '건강상 이유로 채식 전환 요청', status: 'approved', requestDate: '2026-06-05', changedBy: '한국 영어마을', approvedBy: '슈퍼 어드민', approvedDate: '2026-06-05' },
      { id: 9005, field: '기숙사 퇴실일', from: '2026-07-28', to: '2026-08-01', reason: '귀국 항공편 일정에 맞춰 퇴실 연장', status: 'approved', requestDate: '2026-06-10', changedBy: '어드민', approvedBy: '슈퍼 어드민', approvedDate: '2026-06-10' },
    ],
    remittanceHistory: [
      { id: 'RH-2501', amount: 2261, currency: 'USD', bank: '국민은행', remitDate: '2026-05-25', receipt: '영수증_Erin_1차.pdf', status: 'approved', note: '1차 송금 확인 완료', approvedDate: '2026-05-26' },
      { id: 'RH-2502', amount: 150,  currency: 'USD', bank: '신한은행', remitDate: '2026-06-01', receipt: '영수증_Erin_보증금.pdf', status: 'approved', note: '보증금 입금 확인 완료', approvedDate: '2026-06-01' },
    ],
  },
  // 대기생 (입금 및 서류 확인 중, 수강 시작 전)
  {
    id: 26, name: 'PARK SOOYEON', nick: 'Sue', gender: '여', age: 22, nationality: '한국', flag: '🇰🇷',
    course: '일반 코스', level: 'Intermediate', duration: 8, dorm: '미배정', dormAccomType: '기숙사', dormType: '2인실', dormGrade: '이코노미', visaExpiry: '2026-09-01', sspExpiry: '면제',
    departureDate: '2026-09-01', startDate: '2026-07-01', arrivalDate: '2026-07-01',
    attendance: 0, status: 'waiting', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    passportNum: 'M10000026', passportStatus: '미보관', flightInfo: 'KE501 | 07-01 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [
      { id: 2601, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2602, item: '수강료 (Tuition)', amount: 2400, paid: true },
      { id: 2603, item: '기숙사비 (Dorm)', amount: 600, paid: true },
    ]
  },
  {
    id: 27, name: 'NGUYEN MINH TU', nick: 'Tu', gender: '남', age: 24, nationality: '베트남', flag: '🇻🇳',
    course: 'IELTS 전문 코스', level: 'Band 5.0', duration: 12, dorm: '미배정', dormAccomType: '기숙사', dormType: '1인실', dormGrade: '스탠다드', visaExpiry: '2026-10-15', sspExpiry: '미취득',
    departureDate: '2026-10-15', startDate: '2026-07-15', arrivalDate: '2026-07-14',
    attendance: 0, status: 'waiting', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    passportNum: 'M10000027', passportStatus: '미보관', flightInfo: 'VN810 | 07-14 입국 예정', dietType: '일반식', healthNotes: 'SSP 신청 예정',
    fees: [{ id: 2701, item: '입학금 (Registration Fee)', amount: 100, paid: false }]
  },
  {
    id: 28, name: 'WANG FANG', nick: 'Fang', gender: '여', age: 20, nationality: '중국', flag: '🇨🇳',
    course: '주니어 패키지', level: 'Beginner', duration: 4, dorm: '미배정', dormAccomType: '기숙사', dormType: '4인실', dormGrade: '스탠다드', visaExpiry: '2026-08-20', sspExpiry: '미취득',
    departureDate: '2026-08-20', startDate: '2026-07-20', arrivalDate: '2026-07-20',
    attendance: 0, status: 'waiting', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    passportNum: 'G10000028', passportStatus: '미보관', flightInfo: 'CZ302 | 07-20 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [
      { id: 2801, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2802, item: '수강료 (Tuition)', amount: 1800, paid: true },
      { id: 2803, item: '기숙사비 (Dorm)', amount: 500, paid: true },
    ]
  },
  {
    id: 29, name: 'KIM JUNHO', nick: 'Junho', gender: '남', age: 27, nationality: '한국', flag: '🇰🇷',
    course: '가디언 코스', level: 'Upper-Intermediate', duration: 8, dorm: '미배정', dormAccomType: '기숙사', dormType: '2인실', dormGrade: '이코노미', visaExpiry: '2026-09-30', sspExpiry: '면제',
    departureDate: '2026-09-30', startDate: '2026-08-01', arrivalDate: '2026-08-01',
    attendance: 0, status: 'waiting', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    passportNum: 'M10000029', passportStatus: '미보관', flightInfo: 'KE703 | 08-01 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [
      { id: 2901, item: '입학금 (Registration Fee)', amount: 100, paid: true },
      { id: 2902, item: '수강료 (Tuition)', amount: 2100, paid: true },
      { id: 2903, item: '기숙사비 (Dorm)', amount: 600, paid: true },
    ]
  },
  {
    id: 30, name: 'TANAKA KENJI', nick: 'Kenji', gender: '남', age: 25, nationality: '일본', flag: '🇯🇵',
    course: '일반 코스', level: 'Pre-Intermediate', duration: 6, dorm: '미배정', dormAccomType: '기숙사', dormType: '2인실', dormGrade: '이코노미', visaExpiry: '2026-10-01', sspExpiry: '면제',
    departureDate: '2026-10-01', startDate: '2026-08-15', arrivalDate: '2026-08-15',
    attendance: 0, status: 'waiting', remittanceStatus: 'paid', agency: '한국 영어마을', warning: 0,
    passportNum: 'TJ10000030', passportStatus: '미보관', flightInfo: 'JL744 | 08-15 입국 예정', dietType: '일반식', healthNotes: '',
    fees: [{ id: 3001, item: '입학금 (Registration Fee)', amount: 100, paid: false }]
  },
  // 미납 대기생 추가
  {
    id: 31, name: 'SANTOS MARIA', nick: 'Maria', gender: '여', age: 23, nationality: '필리핀', flag: '🇵🇭',
    course: '일반 코스', level: 'Beginner', duration: 8, dorm: '미배정', dormAccomType: '기숙사', dormType: '2인실', dormGrade: '이코노미', visaExpiry: '2026-10-10', sspExpiry: '미취득',
    departureDate: '2026-10-10', startDate: '2026-08-10', arrivalDate: '2026-08-10',
    attendance: 0, status: 'waiting', remittanceStatus: 'unpaid', agency: '한국 영어마을', warning: 0,
    passportNum: 'P10000031', passportStatus: '미보관', flightInfo: 'PR105 | 08-10 입국 예정', dietType: '일반식', healthNotes: '',
    grades: { speaking: [], listening: [], reading: [], writing: [] }, quiz: [],
    fees: [{ id: 3101, item: '입학금 (Registration Fee)', amount: 100, paid: false }]
  },
  {
    id: 32, name: 'NAKAMURA RYO', nick: 'Ryo', gender: '남', age: 22, nationality: '일본', flag: '🇯🇵',
    course: 'IELTS 전문 코스', level: 'Band 5.0', duration: 8, dorm: '미배정', dormAccomType: '기숙사', dormType: '2인실', dormGrade: '이코노미', visaExpiry: '2026-11-01', sspExpiry: '면제',
    departureDate: '2026-11-01', startDate: '2026-09-01', arrivalDate: '2026-09-01',
    attendance: 0, status: 'waiting', remittanceStatus: 'unpaid', agency: '한국 영어마을', warning: 0,
    passportNum: 'TJ10000032', passportStatus: '미보관', flightInfo: 'NH821 | 09-01 입국 예정', dietType: '일반식', healthNotes: '',
    grades: { speaking: [], listening: [], reading: [], writing: [] }, quiz: [],
    fees: [{ id: 3201, item: '입학금 (Registration Fee)', amount: 100, paid: false }]
  },
];

const MOCK_TALK_LMS_TEACHERS = [
  {
    id: 'talk_t1', name: 'John Doe', nick: 'John', gender: '남',
    birthday: '1991-04-12', email: 'john.doe@talkstation.co', phone: '+63-917-111-2222',
    joinDate: '2024-05-10', jobGrade: 'Regular Tutor', talkStatus: 'Employed',
    experience: 'Experienced', photoUrl: 'assets/images/teacher_male.png'
  },
  {
    id: 'talk_t2', name: 'Mary Smith', nick: 'Mary', gender: '여',
    birthday: '1994-08-25', email: 'mary.smith@talkstation.co', phone: '+63-917-333-4444',
    joinDate: '2025-02-15', jobGrade: 'Probationary Tutor', talkStatus: 'Training',
    experience: 'Now', photoUrl: 'assets/images/teacher_female.png'
  },
  {
    id: 'talk_t3', name: 'Robert Lee', nick: 'Bob', gender: '남',
    birthday: '1989-11-30', email: 'robert.lee@talkstation.co', phone: '+63-917-555-6666',
    joinDate: '2023-09-01', jobGrade: 'Regular Tutor', talkStatus: 'Employed',
    experience: 'Experienced', photoUrl: 'assets/images/teacher_male.png'
  },
  {
    id: 'talk_t4', name: 'Patricia Clark', nick: 'Patty', gender: '여',
    birthday: '1992-02-14', email: 'patricia.c@talkstation.co', phone: '+63-917-777-8888',
    joinDate: '2022-10-20', jobGrade: 'Regular Tutor', talkStatus: 'Employed',
    experience: 'Experienced', photoUrl: 'assets/images/teacher_female.png'
  },
  {
    id: 'talk_t5', name: 'William Wright', nick: 'Will', gender: '남',
    birthday: '1995-07-07', email: 'william.w@talkstation.co', phone: '+63-917-999-0000',
    joinDate: '2025-04-01', jobGrade: 'Probationary Tutor', talkStatus: 'Training',
    experience: 'Now', photoUrl: 'assets/images/teacher_male.png'
  }
];

let MOCK_ASSIGNMENT_TAGS = [
  { id: "TAG-01", name: "일반 영어 스피킹", visible: true, priority: 1 },
  { id: "TAG-02", name: "일반 영어 리스닝", visible: true, priority: 2 },
  { id: "TAG-03", name: "문법", visible: true, priority: 3 },
  { id: "TAG-04", name: "리딩", visible: true, priority: 4 },
  { id: "TAG-05", name: "IELTS 전문", visible: true, priority: 5 },
  { id: "TAG-06", name: "주니어 ESL", visible: true, priority: 6 }
];

const MOCK_TEACHERS = [
  { id: 1, name: 'Sarah Johnson', nick: 'Sarah', gender: '여', type: 'IELTS 전문', room: 'A-101', contract: '정규직', available: true, todaySlots: 6, rating: 4.9, exp: 5, status: 'active', availability: [true,true,true,true,true,true,true,true], preferredCourses: ['IELTS 전문','리딩'], excludedCourses: ['주니어 ESL'], classTypes: ['1:1','1:4'],
    email: 'sarah.j@talkstation.co', phone: '+63-917-111-1111', birthday: '1990-03-15', joinDate: '2021-03-01', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Experienced',
    greeting: 'Hello! I\'m Teacher Sarah. I specialize in IELTS and will help you achieve your target band score!',
    intro: 'I am a dedicated English teacher with over 5 years of IELTS coaching experience. I focus on speaking fluency and reading comprehension.',
    education: 'Bachelor of Secondary Education, Major in English — University of Cebu', hobby: 'Reading novels, Yoga, Traveling' },

  { id: 2, name: 'Michael Cruz', nick: 'Mike', gender: '남', type: '일반 영어 (1:1)', room: 'A-102', contract: '정규직', available: true, todaySlots: 5, rating: 4.7, exp: 3, status: 'active', availability: [true,true,false,true,true,true,true,true], preferredCourses: ['일반 영어 스피킹','일반 영어 리스닝'], excludedCourses: [], classTypes: ['1:1'],
    email: 'mike.c@talkstation.co', phone: '+63-920-222-2222', birthday: '1993-07-22', joinDate: '2022-08-15', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Experienced',
    greeting: 'Hi there! I\'m Teacher Mike. Let\'s improve your conversational English together!',
    intro: 'I enjoy making English fun and practical. My teaching style focuses on real-life conversations.',
    education: 'Bachelor of Arts in Communication — Cebu Normal University', hobby: 'Basketball, Music, Cooking' },

  { id: 3, name: 'Anna Reyes', nick: 'Anna', gender: '여', type: '그룹 수업', room: 'B-201', contract: '파트타임', available: true, todaySlots: 4, rating: 4.6, exp: 2, status: 'active', availability: [true,true,true,true,true,true,false,false], preferredCourses: ['일반 영어 스피킹','문법'], excludedCourses: ['IELTS 전문'], classTypes: ['1:4','1:8'],
    email: 'anna.r@talkstation.co', phone: '+63-932-333-3333', birthday: '1995-01-10', joinDate: '2023-01-10', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Now',
    greeting: 'Hello everyone! I\'m Teacher Anna. Group classes are my specialty — energy and fun guaranteed!',
    intro: 'I believe learning is better together. I create engaging group activities to build confidence in speaking.',
    education: 'Bachelor of Elementary Education — University of San Jose-Recoletos', hobby: 'Singing, Dancing, Art' },

  { id: 4, name: 'James Park', nick: 'James', gender: '남', type: '비즈니스 영어', room: 'B-202', contract: '정규직', available: false, todaySlots: 0, rating: 4.8, exp: 7, status: 'active', availability: [false,false,false,false,false,false,false,false], preferredCourses: ['문법','리딩','일반 영어 리스닝'], excludedCourses: [], classTypes: ['1:1','1:4','1:8'],
    email: 'james.p@talkstation.co', phone: '+63-915-444-4444', birthday: '1985-11-30', joinDate: '2019-06-01', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Experienced',
    greeting: 'Hi! I\'m Teacher James. With 7 years of experience, I can guide you to fluency step by step.',
    intro: 'I specialize in grammar and comprehensive English skills. Currently on approved leave and returning soon.',
    education: 'Master of Arts in English Language Teaching — University of the Philippines', hobby: 'Chess, Running, Photography' },

  { id: 5, name: 'Emily Santos', nick: 'Emily', gender: '여', type: '주니어 전담', room: 'C-301', contract: '정규직', available: true, todaySlots: 6, rating: 4.9, exp: 4, status: 'active', availability: [true,true,true,true,true,true,true,true], preferredCourses: ['주니어 ESL','일반 영어 스피킹'], excludedCourses: ['IELTS 전문'], classTypes: ['1:1','1:4','1:8'],
    email: 'emily.s@talkstation.co', phone: '+63-918-555-5555', birthday: '1992-05-08', joinDate: '2021-09-01', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Experienced',
    greeting: 'Hi kids and parents! I\'m Teacher Emily. Learning English should be fun and I make sure it is!',
    intro: 'I am passionate about teaching young learners. My classes use games, songs, and stories to build English foundations.',
    education: 'Bachelor of Early Childhood Education — Southwestern University', hobby: 'Drawing, Storytelling, Baking' },

  { id: 6, name: 'David Lim', nick: 'David', gender: '남', type: '일반 영어 (1:1)', room: 'A-103', contract: '파트타임', available: true, todaySlots: 3, rating: 4.4, exp: 1, status: 'active', availability: [true,true,true,false,false,true,true,true], preferredCourses: ['일반 영어 스피킹'], excludedCourses: [], classTypes: ['1:1'],
    email: 'david.l@talkstation.co', phone: '+63-927-666-6666', birthday: '1997-09-14', joinDate: '2024-03-01', jobGrade: 'Probationary Tutor', talkStatus: 'Training', experience: 'Now',
    greeting: 'Hello! I\'m Teacher David. I\'m new but very enthusiastic about helping you speak English confidently!',
    intro: 'Fresh graduate with a passion for English teaching. I focus on pronunciation and everyday conversation.',
    education: 'Bachelor of Secondary Education, Major in English — Cebu Technological University', hobby: 'Video games, Cycling, Movies' },

  { id: 7, name: 'Grace Santos', nick: 'Grace', gender: '여', type: '일반 영어 (1:1)', room: 'A-104', contract: '파트타임', available: false, todaySlots: 0, rating: 4.5, exp: 2, status: 'resigned', availability: [false,false,false,false,false,false,false,false], preferredCourses: ['일반 영어 스피킹','일반 영어 리스닝'], excludedCourses: [], classTypes: ['1:1','1:4'],
    email: 'grace.s@talkstation.co', phone: '+63-933-777-7777', birthday: '1994-12-03', joinDate: '2022-05-16', jobGrade: 'Regular Tutor', talkStatus: 'Resigned', experience: 'Experienced',
    greeting: 'Hi! I\'m Teacher Grace. I love helping students find their confidence in English.',
    intro: 'Experienced in 1:1 and small group sessions. Focused on listening and speaking improvement.',
    education: 'Bachelor of Arts in English — University of Cebu-Lapu-Lapu and Mandaue', hobby: 'Singing, Hiking, Cooking' },

  { id: 8, name: 'Karen Villanueva', nick: 'Karen', gender: '여', type: '일반 영어 (1:1)', room: 'A-105', contract: '정규직', available: true, todaySlots: 5, rating: 4.6, exp: 3, status: 'active', availability: [true,true,true,true,true,true,false,false], preferredCourses: ['일반 영어 스피킹','문법'], excludedCourses: [], classTypes: ['1:1','1:4'],
    email: 'karen.v@talkstation.co', phone: '+63-919-888-8888', birthday: '1991-06-25', joinDate: '2022-02-07', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Experienced',
    greeting: 'Hello! I\'m Teacher Karen. I make sure every student leaves the class smiling and more confident!',
    intro: 'I specialize in helping intermediate learners break through their plateau and reach fluency.',
    education: 'Bachelor of Secondary Education — University of San Carlos', hobby: 'Badminton, K-drama, Cooking' },

  { id: 9, name: 'Mark Dela Cruz', nick: 'Mark', gender: '남', type: '그룹 수업', room: 'B-203', contract: '정규직', available: true, todaySlots: 4, rating: 4.5, exp: 2, status: 'active', availability: [true,true,true,true,true,false,false,false], preferredCourses: ['일반 영어 스피킹','일반 영어 리스닝'], excludedCourses: ['주니어 ESL'], classTypes: ['1:4','1:8'],
    email: 'mark.d@talkstation.co', phone: '+63-912-999-9999', birthday: '1994-04-18', joinDate: '2023-06-12', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Now',
    greeting: 'Hey! I\'m Teacher Mark. Group classes are where the magic happens — let\'s learn together!',
    intro: 'I create a comfortable and dynamic environment for group learning. Energy and humor are my teaching tools.',
    education: 'Bachelor of Arts in Mass Communication — Cebu Normal University', hobby: 'Guitar, Volleyball, Photography' },

  { id: 10, name: 'Lisa Fernandez', nick: 'Lisa', gender: '여', type: 'IELTS 전문', room: 'A-106', contract: '정규직', available: true, todaySlots: 6, rating: 4.8, exp: 6, status: 'active', availability: [true,true,true,true,true,true,true,true], preferredCourses: ['IELTS 전문','리딩','문법'], excludedCourses: [], classTypes: ['1:1'],
    email: 'lisa.f@talkstation.co', phone: '+63-921-101-0101', birthday: '1988-08-30', joinDate: '2020-01-15', jobGrade: 'Regular Tutor', talkStatus: 'Employed', experience: 'Experienced',
    greeting: 'Hello! I\'m Teacher Lisa. IELTS is my expertise and I\'ll guide you from Band 5 to Band 7 and beyond!',
    intro: 'With 6 years of IELTS preparation experience, I know exactly what examiners are looking for.',
    education: 'Master of Arts in Applied Linguistics — University of the Philippines Cebu', hobby: 'Reading academic journals, Jogging, Cooking' },
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
  { name: 'PHAM MINH DUC (Duc)',    course: 'IELTS 전문',   dorm: '1인실', duration: '12주', status: 'current',   total: '$4,200', branch: '강남지사', agencyStatus: 'current' },
  { name: 'OH HYUNJIN (Jenny)',     course: '주니어 패키지',dorm: '4인실', duration: '4주',  status: 'current',   total: '$1,720', branch: '강남지사', agencyStatus: 'waiting' },
  { name: 'BAE JONGHO (John)',      course: '가디언 코스',  dorm: '1인실', duration: '8주',  status: 'current',   total: '$2,400', branch: '강남지사', agencyStatus: 'current' },
];

let MOCK_MASTER_SUBJECTS = [
  { id: 'SUB_01', name: '스피킹', type: 'ESL', desc: '회화 및 스피킹 중심 수업', order: 1, visible: true },
  { id: 'SUB_02', name: '문법', type: 'ESL', desc: 'Grammar 기본 및 응용', order: 2, visible: true },
  { id: 'SUB_03', name: '리딩', type: 'ESL', desc: '독해 및 지문 읽기 수업', order: 3, visible: true },
  { id: 'SUB_04', name: '라이팅', type: 'IELTS', desc: 'IELTS 에세이 및 첨삭 수업', order: 4, visible: true },
  { id: 'SUB_05', name: '리스닝', type: 'IELTS', desc: 'IELTS 듣기 연습 및 문항 풀이', order: 5, visible: true },
  { id: 'SUB_06', name: '회화', type: 'Junior', desc: '주니어 기초 대화 패턴', order: 6, visible: true },
  { id: 'SUB_07', name: '단어', type: 'Junior', desc: '보카 및 어휘 암기 단독 세션', order: 7, visible: true },
  { id: 'SUB_08', name: '일상회화', type: 'ESL', desc: '성인 일상 생활 회화', order: 8, visible: true },
  { id: 'SUB_09', name: '프레젠테이션', type: 'Business', desc: '비즈니스 프레젠테이션 스킬', order: 9, visible: true },
  { id: 'SUB_10', name: '토론', type: 'Business', desc: '비즈니스 토론 및 협상', order: 10, visible: true }
];

let MOCK_MASTER_LEVELS = [
  { id: 'LV_01', name: 'Beginner', order: 1, desc: '입문 기초 레벨', visible: true },
  { id: 'LV_02', name: 'Elementary', order: 2, desc: '초급 기초 회화 레벨', visible: true },
  { id: 'LV_03', name: 'Intermediate', order: 3, desc: '중급 프리토킹 준비 레벨', visible: true },
  { id: 'LV_04', name: 'Upper-Int', order: 4, desc: '중상급 프리토킹 심화 레벨', visible: true },
  { id: 'LV_05', name: 'Advanced', order: 5, desc: '고급 토론 및 아카데믹 레벨', visible: true }
];

// 구버전/IELTS Band 등 표준 5단계(Beginner/Elementary/Intermediate/Upper-Int/Advanced) 외 레벨값 매핑
const LEVEL_NORMALIZE_MAP = {
  'Upper-Beginner':      'Elementary',
  'Pre-Intermediate':    'Elementary',
  'Upper-Intermediate':  'Upper-Int',
  'Band 5.0':            'Intermediate',
  'Band 5.5':            'Upper-Int',
  'Band 6.0':            'Upper-Int',
  'Band 6.5':            'Advanced',
  'Band 7.0':            'Advanced',
};

const MOCK_COURSES = [
  { name: '일반 코스', type: '일반 영어', oneone: 4, group1on4: 2, group: 1, fee: 800, active: true, subjects: [{ id: 'SUB_01', hours: 2 }, { id: 'SUB_02', hours: 1 }, { id: 'SUB_03', hours: 1 }], levels: ['LV_01', 'LV_03', 'LV_04'] },
  { name: 'IELTS 전문 코스', type: 'IELTS', oneone: 5, group1on4: 0, group: 2, fee: 950, active: true, subjects: [{ id: 'SUB_03', hours: 2 }, { id: 'SUB_04', hours: 1 }, { id: 'SUB_01', hours: 1 }, { id: 'SUB_05', hours: 1 }], levels: ['LV_04', 'LV_05'] },
  { name: '주니어 패키지', type: '주니어', oneone: 5, group1on4: 1, group: 0, fee: 880, active: true, subjects: [{ id: 'SUB_06', hours: 3 }, { id: 'SUB_07', hours: 1 }, { id: 'SUB_02', hours: 1 }], levels: ['LV_01', 'LV_02'] },
  { name: '가디언 코스', type: '가디언', oneone: 3, group1on4: 1, group: 1, fee: 700, active: true, subjects: [{ id: 'SUB_08', hours: 2 }, { id: 'SUB_05', hours: 1 }], levels: ['LV_01', 'LV_03'] },
  { name: '비즈니스 영어', type: '비즈니스', oneone: 4, group1on4: 0, group: 1, fee: 900, active: true, subjects: [{ id: 'SUB_09', hours: 2 }, { id: 'SUB_10', hours: 2 }], levels: ['LV_03', 'LV_04'] },
];

// 기숙사 템플릿 (인실 x 컨디션 x 총개수 x 비용)
let MOCK_DORM_TEMPLATES = [
  { id: 1, accomType: '가든 호텔',    capacity: 1, condition: '스탠다드', count: 10, costDay: 30,  costWeek: 180, cost: 800 },
  { id: 2, accomType: '가든 호텔',    capacity: 2, condition: '이코노미', count: 20, costDay: 22,  costWeek: 140, cost: 600 },
  { id: 3, accomType: 'IT Park 콘도', capacity: 1, condition: '디럭스',   count: 5,  costDay: 50,  costWeek: 300, cost: 1200 },
  { id: 4, accomType: '가든 호텔',    capacity: 4, condition: '스탠다드', count: 8,  costDay: 18,  costWeek: 110, cost: 500 }
];

// 호실 단위 데이터
let MOCK_DORM_ROOMS = [
  {
    roomNo: '101', accomType: '가든 호텔', type: '2인실 (스탠다드)', capacity: 2, genderRestriction: '남성',
    beds: [
      { id: 'A', student: 'Kevin (김홍길동)', color: '#5E5CE6', start: '06-01', end: '07-27', studentId: 1,
        history: [
          { student: 'Carlos (GARCIA CARLOS)', start: '03-03', end: '04-27', reason: '졸업' },
          { student: 'Riku (TANAKA RIKU)', start: '05-01', end: '05-31', reason: '졸업' },
        ]
      },
      { id: 'B', student: 'James (이영어)', color: '#0EA5E9', start: '06-08', end: '07-06', studentId: 2,
        history: [
          { student: 'Mia (LEE MINJI)', start: '04-14', end: '06-01', reason: '졸업' },
        ]
      },
    ]
  },
  {
    roomNo: '102', accomType: '가든 호텔', type: '4인실 (스탠다드)', capacity: 4, genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Amy (최학생)', color: '#D97706', start: '06-01', end: '06-29', studentId: 3,
        history: [{ student: 'Sara (KIM SARA)', start: '03-10', end: '05-04', reason: '졸업' }]
      },
      { id: 'B', student: 'Yuki (田中雪)', color: '#7C3AED', start: '06-08', end: '07-06', studentId: 4,
        history: [{ student: 'Nana (SUZUKI NANA)', start: '04-21', end: '06-01', reason: '졸업' }]
      },
      { id: 'C', student: null, history: [{ student: 'Emma (PARK EMMA)', start: '02-03', end: '04-27', reason: '호실이동' }] },
      { id: 'D', student: null, incoming: { student: 'Fang (WANG FANG)', date: '06-20' }, history: [{ student: 'Lily (CHOI LILY)', start: '03-17', end: '05-11', reason: '졸업' }] },
    ]
  },
  {
    roomNo: '201', accomType: 'IT Park 콘도', type: '1인실 (프리미엄)', capacity: 1, genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Sophie (박소연)', color: '#EF4444', start: '05-15', end: '08-14', studentId: 5,
        history: [{ student: 'Elena (IVANOVA ELENA)', start: '02-10', end: '05-11', reason: '졸업' }]
      },
    ]
  },
  {
    roomNo: '103', accomType: '가든 호텔', type: '2인실 (스탠다드)', capacity: 2, genderRestriction: '남성',
    beds: [
      { id: 'A', student: 'Tom (김민수)', color: '#10B981', start: '06-08', end: '06-22', studentId: 7,
        history: [
          { student: 'Jake (LEE JAKE)', start: '03-24', end: '05-18', reason: '졸업' },
          { student: 'Ray (KIM RAY)', start: '05-19', end: '06-01', reason: '호실이동' },
        ]
      },
      { id: 'B', student: null, history: [{ student: 'Finn (BROWN FINN)', start: '04-07', end: '05-25', reason: '중도퇴소' }] }
    ]
  },
  {
    roomNo: '203', accomType: '가든 호텔', type: '2인실 (스탠다드)', capacity: 2, genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Lan (NGUYEN THI LAN)', color: '#8B5CF6', start: '06-01', end: '07-27', studentId: 12,
        history: [{ student: 'Mai (TRAN THI MAI)', start: '03-03', end: '05-25', reason: '졸업' }]
      },
      { id: 'B', student: null, history: [{ student: 'Aoi (YOSHIDA AOI)', start: '04-14', end: '05-18', reason: '졸업' }] }
    ]
  },
  {
    roomNo: '202', accomType: '가든 호텔', type: '1인실 (스탠다드)', capacity: 1, genderRestriction: '남성',
    beds: [
      { id: 'A', student: null, lastCheckout: '06-09', history: [{ student: 'Marco (ROSSI MARCO)', start: '02-17', end: '04-13', reason: '졸업' }] }
    ]
  },
  {
    roomNo: '104', accomType: '가든 호텔', type: '2인실 (스탠다드)', capacity: 2, genderRestriction: '여성',
    beds: [
      { id: 'A', student: null, history: [{ student: 'Rina (YAMADA RINA)', start: '03-10', end: '05-04', reason: '졸업' }] },
      { id: 'B', student: null, history: [{ student: 'Chloe (WANG CHLOE)', start: '04-07', end: '05-18', reason: '졸업' }] }
    ]
  },
  {
    roomNo: '301', accomType: '가든 호텔', type: '4인실 (스탠다드)', capacity: 4, genderRestriction: '남성',
    beds: [
      { id: 'A', student: 'Duc (PHAM MINH DUC)', color: '#F59E0B', start: '06-15', end: '09-13',
        history: [{ student: 'Nam (NGUYEN VAN NAM)', start: '03-03', end: '06-01', reason: '졸업' }]
      },
      { id: 'B', student: 'John (BAE JONGHO)', color: '#10B981', start: '06-10', end: '08-08',
        history: [{ student: 'Kento (KOBAYASHI KENTO)', start: '04-21', end: '06-08', reason: '졸업' }]
      },
      { id: 'C', student: null, history: [{ student: 'Ivan (PETROV IVAN)', start: '02-03', end: '03-29', reason: '졸업' }] },
      { id: 'D', student: null, history: [{ student: 'Alex (MÜLLER ALEX)', start: '03-17', end: '05-11', reason: '졸업' }] },
    ]
  },
  {
    roomNo: '302', accomType: '가든 호텔', type: '4인실 (스탠다드)', capacity: 4, genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Hana (YAMAMOTO HANA)', color: '#8B5CF6', start: '06-09', end: '08-03',
        history: [{ student: 'Saki (FUJII SAKI)', start: '03-24', end: '06-01', reason: '졸업' }]
      },
      { id: 'B', student: null, history: [{ student: 'Yuna (MOON YUNA)', start: '04-07', end: '05-25', reason: '졸업' }] },
      { id: 'C', student: null, history: [{ student: 'Anya (KOZLOV ANYA)', start: '02-17', end: '04-06', reason: '졸업' }] },
      { id: 'D', student: null, history: [] },
    ]
  },
  {
    roomNo: '204', accomType: 'IT Park 콘도', type: '1인실 (프리미엄)', capacity: 1, genderRestriction: '여성',
    beds: [
      { id: 'A', student: null, history: [{ student: 'Grace (CHEN GRACE)', start: '03-03', end: '05-25', reason: '졸업' }] }
    ]
  },
  {
    roomNo: '106', accomType: '가든 호텔', type: '2인실 (스탠다드)', capacity: 2, genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Erin (SHIN EUNSOO)', color: '#EC4899', start: '05-31', end: '08-01', studentId: 25,
        history: []
      },
      { id: 'B', student: null, history: [] }
    ]
  },
  {
    roomNo: '207', accomType: '가든 호텔', type: '2인실 (스탠다드)', capacity: 2, genderRestriction: '여성',
    beds: [
      { id: 'A', student: 'Yeon (KIM YEONHEE)', color: '#EC4899', start: '05-31', end: '06-29', studentId: 21,
        history: [
          { studentId: 21, student: 'Yeon (KIM YEONHEE)', start: '03-03', end: '04-27', reason: '호실이동' },
          { student: 'Hara (OH HARA)', start: '04-28', end: '05-25', reason: '졸업' },
        ]
      },
      { id: 'B', student: null,
        history: [
          { student: 'Soo (JUNG SOOYEON)', start: '02-17', end: '04-13', reason: '졸업' },
        ]
      },
    ]
  },
  {
    roomNo: '105', accomType: '가든 호텔', type: '2인실 (스탠다드)', capacity: 2, genderRestriction: '남성',
    beds: [
      { id: 'A', student: 'Long (NGUYEN VAN LONG)', color: '#0EA5E9', start: '06-15', end: '09-13',
        history: [{ student: 'Minh (LE VAN MINH)', start: '03-10', end: '06-08', reason: '졸업' }]
      },
      { id: 'B', student: null, history: [{ student: 'Ben (TAYLOR BEN)', start: '04-21', end: '05-18', reason: '졸업' }] }
    ]
  },
];




// day 필드 없는 기존 슬롯을 '월' 기본값으로 정규화
MOCK_TIMETABLE.forEach(t => t.slots.forEach(sl => { if (!sl.day) sl.day = '월'; }));

/* ─── 수업 출석 로그 (학생별 교시 기록) ─── */
const MOCK_CLASS_LOG = [
  // Kevin (id:1) — 06-09~06-20
  ...(() => {
    const entries = [];
    const days = ['2026-06-09','2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14',
                  '2026-06-15','2026-06-16','2026-06-17','2026-06-18','2026-06-19','2026-06-20'];
    const statuses = ['present','present','present','present','late','present','absent','present','present','late','present','present'];
    const types    = ['1:1','1:4','1:1','1:6','1:1','1:4','1:1','1:1','1:4','1:1','1:6','1:1'];
    const subjects = ['Speaking','Grammar','Writing','Listening','Speaking','Reading','Writing','Speaking','Grammar','Speaking','Listening','Writing'];
    const notes    = ['발음 교정 집중. 자신감 향상 보임.','시제 오류 반복. 추가 연습 필요.','Essay 구조 지도.','','지각 10분. 집중도 양호.','Reading speed 개선 중.','결석 — 병원','Speaking flow 매우 좋아짐.','분사구문 학습.','','','문장 구조 재점검.'];
    const teachers = ['Sarah','Mike','Sarah','Emily','Sarah','Mike','Sarah','Sarah','Mike','Sarah','Emily','Sarah'];
    days.forEach((d, i) => {
      for (let p = 1; p <= 8; p++) {
        const st = (p === 5 && i === 4) ? 'late' : (p === 3 && i === 6) ? 'absent' : statuses[i % statuses.length];
        entries.push({ studentId:1, date:d, period:p, type: p<=4 ? types[i%types.length] : (p<=6?'1:4':'1:6'), teacherName: teachers[i%teachers.length], subject: subjects[(i+p)%subjects.length], status: p===3&&i===6?'absent':(p===5&&i===4?'late':st==='absent'&&p!==3?'present':st), note: p===1&&notes[i]?notes[i]:'' });
      }
    });
    return entries;
  })(),
  // James (id:2) — 06-09~06-20
  ...(() => {
    const entries = [];
    const days = ['2026-06-09','2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14',
                  '2026-06-15','2026-06-16','2026-06-17','2026-06-18','2026-06-19','2026-06-20'];
    const subjects = ['Grammar','Speaking','Listening','Writing','Grammar','Speaking','Listening','Writing','Grammar','Speaking','Listening','Writing'];
    const teachers = ['Mike','Sarah','Emily','Mike','Mike','Sarah','Emily','Mike','Mike','Sarah','Emily','Mike'];
    days.forEach((d, i) => {
      for (let p = 1; p <= 8; p++) {
        const absent = (i === 2 && p >= 6) || (i === 7 && p === 4);
        const late   = (i === 5 && p === 1);
        entries.push({ studentId:2, date:d, period:p, type: p<=4?'1:4':(p<=6?'1:1':'1:6'), teacherName:teachers[i%teachers.length], subject:subjects[(i+p)%subjects.length], status: absent?'absent':(late?'late':'present'), note: p===1&&i===0?'문법 기초 점검 완료. 이해 빠름.':'' });
      }
    });
    return entries;
  })(),
  // Amy (id:3) — 06-09~06-20
  ...(() => {
    const entries = [];
    const days = ['2026-06-09','2026-06-10','2026-06-11','2026-06-12','2026-06-13','2026-06-14',
                  '2026-06-15','2026-06-16'];
    const subjects = ['Phonics','Reading','Speaking','Writing','Phonics','Listening','Speaking','Reading'];
    days.forEach((d, i) => {
      for (let p = 1; p <= 8; p++) {
        const earlyLeave = (i === 3 && p >= 7);
        const absent     = (i === 6 && p === 2);
        entries.push({ studentId:3, date:d, period:p, type:p<=4?'1:6':'1:4', teacherName:'Emily', subject:subjects[(i+p)%subjects.length], status: earlyLeave?'early_leave':(absent?'absent':'present'), note: earlyLeave&&p===7?'부모 요청으로 조기 귀가.':'' });
      }
    });
    return entries;
  })(),
  // Erin (id:25) — 주니어 패키지 06-01~06-20
  ...(() => {
    const entries = [];
    const days = ['2026-06-01','2026-06-02','2026-06-03','2026-06-04','2026-06-05','2026-06-08',
                  '2026-06-09','2026-06-10','2026-06-11','2026-06-12','2026-06-15','2026-06-16',
                  '2026-06-17','2026-06-18','2026-06-19'];
    const subjects = ['Phonics','Story Reading','Speaking','Writing','Vocabulary','Grammar','Phonics','Story Reading','Speaking','Writing','Vocabulary','Listening','Phonics','Speaking','Writing'];
    const notes = [
      '첫 수업. 발음 기초 점검. 긍정적 태도 매우 좋음.','리딩 속도 양호. 단어 어휘력 보완 필요.','스피킹 자신감 있음.',
      '','단어 퀴즈 96점. 우수함.','','','문장 구조 이해력 뛰어남.','','','','',
      '일찍 발표 자원. 리더십 돋보임.','','라이팅 문단 구성 매우 좋아짐.'
    ];
    days.forEach((d, i) => {
      const periods = [1, 2, 3, 5, 6]; // 주니어 수업 교시
      periods.forEach((p, pi) => {
        const absent = (i === 9 && p === 2);
        const late   = (i === 6 && p === 1);
        const status = absent ? 'absent' : late ? 'late' : 'present';
        entries.push({
          studentId: 25, date: d, period: p,
          type: p <= 3 ? '1:1' : '1:8',
          teacherName: p <= 3 ? 'Emily' : 'Emily',
          subject: subjects[(i + pi) % subjects.length],
          status,
          note: p === 1 && notes[i] ? notes[i] : (absent ? '사전 연락 후 결석 처리' : late ? '5분 지각' : '')
        });
      });
    });
    return entries;
  })(),
];

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

function syncDormTemplatesFromRooms() {
  const uniqueTypes = {};
  MOCK_DORM_ROOMS.forEach(r => {
    if (!r.roomNo) return; // 미배정 호실 제외
    const conditionMatch = r.type ? r.type.match(/\(([^)]+)\)/) : null;
    const condition = conditionMatch ? conditionMatch[1] : '스탠다드';
    const capacity = r.capacity || (r.beds ? r.beds.length : 1);
    const key = `${r.accomType}__${capacity}__${condition}`;

    if (!uniqueTypes[key]) {
      uniqueTypes[key] = {
        accomType: r.accomType,
        capacity: capacity,
        condition: condition,
        count: 0
      };
    }
    uniqueTypes[key].count++;
  });

  const newTemplates = [];
  let idCounter = 1;
  for (const key in uniqueTypes) {
    const ut = uniqueTypes[key];
    const exist = MOCK_DORM_TEMPLATES.find(t => t.accomType === ut.accomType && t.capacity === ut.capacity && t.condition === ut.condition);
    newTemplates.push({
      id: exist ? exist.id : idCounter++,
      accomType: ut.accomType,
      capacity: ut.capacity,
      condition: ut.condition,
      count: ut.count,
      costDay: exist ? exist.costDay : 0,
      costWeek: exist ? exist.costWeek : 0,
      cost: exist ? exist.cost : 0
    });
    idCounter = Math.max(idCounter, exist ? exist.id + 1 : idCounter);
  }
  MOCK_DORM_TEMPLATES.length = 0;
  newTemplates.forEach(t => MOCK_DORM_TEMPLATES.push(t));
}


