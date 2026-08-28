/* =============================================
   LUNCH MEAL PLAN (점심 도시락 식단)
   - 학생 포털 : 1주치 점심 도시락 메뉴 확인 및 A/B 메인 선택
   - 어드민    : 주간 식단 편성 · 학생별 선택 현황 · 일자별 집계
   ============================================= */

const MEAL_TODAY = '2026-06-17';
const MEAL_DOW_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const MEAL_OPTION_KEYS = ['A', 'B'];
const MEAL_OPTION_META = {
  A: { label: 'MAIN A', color: '#5E5CE6', bg: '#EEF2FF', border: '#C7D2FE' },
  B: { label: 'MAIN B', color: '#0D9488', bg: '#F0FDFA', border: '#99F6E4' },
};
const MEAL_CHOICE_META = {
  A:    { label: 'A 선택', color: '#5E5CE6', bg: '#EEF2FF' },
  B:    { label: 'B 선택', color: '#0D9488', bg: '#CCFBF1' },
  skip: { label: '미신청',  color: '#B45309', bg: '#FEF3C7' },
  none: { label: '미선택',  color: '#9CA3AF', bg: '#F3F4F6' },
};
const MEAL_DIET_TAGS = ['일반식', '채식', '할랄', '글루텐 프리', '저칼로리', '매운맛'];
const MEAL_ALLERGENS = ['대두', '밀', '계란', '우유', '갑각류', '생선', '땅콩', '견과류'];

/* ── 날짜 유틸 ──────────────────────────────── */
function mealDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function mealAddDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return mealDateStr(dt);
}

/* 해당 날짜가 속한 주의 월요일 */
function getMealWeekStart(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = dt.getDay();
  dt.setDate(dt.getDate() - (dow === 0 ? 6 : dow - 1));
  return mealDateStr(dt);
}

/* 월~금 5일치 날짜 배열 */
function getMealWeekDates(weekStart) {
  return [0, 1, 2, 3, 4].map(i => mealAddDays(weekStart, i));
}

function formatMealDayLabel(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${m}/${d}(${MEAL_DOW_LABEL[new Date(y, m - 1, d).getDay()]})`;
}

function formatMealWeekLabel(weekStart) {
  const end = mealAddDays(weekStart, 4);
  return `${weekStart.replace(/-/g, '.')} ~ ${end.substring(5).replace('-', '.')}`;
}

/* 신청 마감: 해당 주 시작 직전 금요일 18:00 */
function getMealWeekDeadline(weekStart) {
  return `${mealAddDays(weekStart, -3)} 18:00`;
}

/* 당일 포함 지난 날짜는 주방 발주가 끝난 것으로 보고 변경 불가 */
function isMealDayLocked(dateStr) {
  return dateStr <= MEAL_TODAY;
}

/* ── 식단 데이터 ────────────────────────────── */
function makeMealOption(emoji, name, desc, kcal, tags, allergens) {
  return { emoji, name, desc, kcal, tags, allergens };
}

let MOCK_MEAL_PLANS = {
  '2026-06-15': {
    weekStart: '2026-06-15',
    published: true,
    note: '주 5일 점심 도시락 · 밥/국/반찬 2종 공통 + 메인 선택',
    days: {
      '2026-06-15': {
        A: makeMealOption('🍗', '닭갈비 도시락', '춘천식 닭갈비 + 볶음밥 + 무생채', 720, ['일반식', '매운맛'], ['대두', '밀']),
        B: makeMealOption('🥗', '두부 스테이크 도시락', '두부 스테이크 + 현미밥 + 구운 채소', 540, ['채식', '저칼로리'], ['대두']),
      },
      '2026-06-16': {
        A: makeMealOption('🥘', '김치 제육 도시락', '돼지고기 김치볶음 + 계란말이 + 백미밥', 780, ['일반식', '매운맛'], ['대두', '계란']),
        B: makeMealOption('🥙', '치킨 시저 샐러드 도시락', '그릴 치킨 + 로메인 + 통밀 롤', 520, ['일반식', '저칼로리'], ['밀', '계란', '우유']),
      },
      '2026-06-17': {
        A: makeMealOption('🥩', '소불고기 도시락', '소불고기 + 잡채 + 백미밥', 810, ['일반식'], ['대두', '밀']),
        B: makeMealOption('🍚', '야채 비빔밥 도시락', '나물 5종 + 고추장 + 들기름', 610, ['채식'], ['대두']),
      },
      '2026-06-18': {
        A: makeMealOption('🍖', '치킨 아도보 도시락', '필리핀식 치킨 아도보 + 갈릭라이스', 760, ['일반식', '할랄'], ['대두']),
        B: makeMealOption('🍤', '쉬림프 팟타이 도시락', '새우 팟타이 + 스프링롤 2p', 690, ['일반식'], ['갑각류', '계란', '땅콩']),
      },
      '2026-06-19': {
        A: makeMealOption('🌶️', '제육볶음 도시락', '매운 제육볶음 + 콩나물무침 + 백미밥', 800, ['일반식', '매운맛'], ['대두']),
        B: makeMealOption('🐟', '연어 포케 볼', '연어 + 아보카도 + 현미 + 폰즈 소스', 580, ['일반식', '저칼로리'], ['생선', '대두']),
      },
    },
  },
  '2026-06-22': {
    weekStart: '2026-06-22',
    published: true,
    note: '',
    days: {
      '2026-06-22': {
        A: makeMealOption('🍗', '치킨 가라아게 도시락', '가라아게 + 양배추 샐러드 + 백미밥', 790, ['일반식'], ['밀', '계란', '대두']),
        B: makeMealOption('🍛', '렌틸 커리 도시락', '렌틸콩 커리 + 바스마티 라이스 + 난', 600, ['채식', '할랄'], ['밀']),
      },
      '2026-06-23': {
        A: makeMealOption('🥩', '소불고기 덮밥', '소불고기 덮밥 + 미소국', 770, ['일반식'], ['대두', '밀']),
        B: makeMealOption('🌯', '그릴 베지 랩', '구운 채소 + 후무스 + 통밀 토르티야', 530, ['채식', '저칼로리'], ['밀', '대두']),
      },
      '2026-06-24': {
        A: makeMealOption('🍱', '돈까스 도시락', '등심 돈까스 + 감자 샐러드 + 백미밥', 850, ['일반식'], ['밀', '계란', '우유']),
        B: makeMealOption('🐟', '참치 포케 볼', '참치 + 오이 + 에다마메 + 현미', 570, ['일반식', '저칼로리'], ['생선', '대두']),
      },
      '2026-06-25': {
        A: makeMealOption('🌶️', '마파두부 덮밥', '마파두부 + 청경채 볶음', 720, ['일반식', '매운맛'], ['대두', '밀']),
        B: makeMealOption('🥗', '그릴 치킨 샐러드', '허브 치킨 + 믹스 그린 + 발사믹', 500, ['일반식', '저칼로리', '글루텐 프리'], []),
      },
      '2026-06-26': {
        A: makeMealOption('🥩', '비프 스테이크 도시락', '척아이롤 스테이크 + 매쉬포테이토', 880, ['일반식'], ['우유']),
        B: makeMealOption('🍝', '해산물 토마토 파스타', '새우·홍합 토마토 파스타 + 갈릭브레드', 740, ['일반식'], ['밀', '갑각류', '우유']),
      },
    },
  },
};

/* 학생별 선택 : { studentId, date, choice: 'A' | 'B' | 'skip' } */
let MOCK_MEAL_CHOICES = [];
let _mealSeeded = false;

/* 화면 상태 */
let studentMealWeekStart = getMealWeekStart(MEAL_TODAY);
let studentMealDraft = {};
let mealAdminWeekStart = getMealWeekStart(MEAL_TODAY);
let mealAdminTab = 'plan';
let mealStatusFilters = { agency: 'all', diet: 'all', onlyMissing: false, keyword: '' };

/* ── 데이터 접근 ────────────────────────────── */
function getMealTargetStudents() {
  if (typeof MOCK_STUDENTS === 'undefined') return [];
  return MOCK_STUDENTS.filter(s => s.status === 'current');
}

function getMealPortalStudent() {
  if (typeof MOCK_STUDENTS === 'undefined') return null;
  return MOCK_STUDENTS.find(s => s.nick === 'Minjun') || MOCK_STUDENTS[0] || null;
}

/* 주간 식단이 없으면 빈 템플릿을 만들어 편성 화면에서 바로 입력할 수 있게 한다 */
function ensureMealPlan(weekStart) {
  if (!MOCK_MEAL_PLANS[weekStart]) {
    const days = {};
    getMealWeekDates(weekStart).forEach(d => {
      days[d] = {
        A: makeMealOption('🍚', '', '', 0, ['일반식'], []),
        B: makeMealOption('🥗', '', '', 0, ['채식'], []),
      };
    });
    MOCK_MEAL_PLANS[weekStart] = { weekStart, published: false, note: '', days };
  }
  return MOCK_MEAL_PLANS[weekStart];
}

function getMealPlan(weekStart) {
  return MOCK_MEAL_PLANS[weekStart] || null;
}

function getMealOption(dateStr, key) {
  const plan = getMealPlan(getMealWeekStart(dateStr));
  if (!plan || !plan.days[dateStr]) return null;
  return plan.days[dateStr][key] || null;
}

function isMealPlanReady(plan, dateStr) {
  if (!plan || !plan.published) return false;
  const day = plan.days[dateStr];
  return !!(day && day.A && day.A.name && day.B && day.B.name);
}

function getMealChoice(studentId, dateStr) {
  const found = MOCK_MEAL_CHOICES.find(c => c.studentId === studentId && c.date === dateStr);
  return found ? found.choice : null;
}

function setMealChoice(studentId, dateStr, choice) {
  const idx = MOCK_MEAL_CHOICES.findIndex(c => c.studentId === studentId && c.date === dateStr);
  if (choice === null) {
    if (idx >= 0) MOCK_MEAL_CHOICES.splice(idx, 1);
    return;
  }
  if (idx >= 0) MOCK_MEAL_CHOICES[idx].choice = choice;
  else MOCK_MEAL_CHOICES.push({ studentId, date: dateStr, choice });
}

/* 학생 식단 구분(채식·할랄 등)과 메뉴 태그가 맞는지 확인 */
function isMealSuitableForStudent(student, option) {
  if (!student || !option) return true;
  const diet = student.dietType || '일반식';
  if (diet === '일반식') return true;
  return (option.tags || []).includes(diet);
}

/* 데모용 선택 데이터 시드 : 학생 식단 구분을 존중해서 채운다 */
function ensureMealSeed() {
  if (_mealSeeded) return;
  const students = getMealTargetStudents();
  if (!students.length) return;
  _mealSeeded = true;

  ['2026-06-15', '2026-06-22'].forEach(weekStart => {
    const plan = getMealPlan(weekStart);
    if (!plan) return;
    getMealWeekDates(weekStart).forEach((date, di) => {
      const isNextWeek = weekStart > getMealWeekStart(MEAL_TODAY);
      students.forEach(s => {
        const h = (s.id * 7 + di * 13) % 10;
        // 다음 주는 아직 신청 중이라 미선택 비율을 높게 둔다
        if (isNextWeek && h >= 5) return;
        if (!isNextWeek && h >= 9) return;

        let choice;
        if (!isMealSuitableForStudent(s, plan.days[date].A)) {
          choice = isMealSuitableForStudent(s, plan.days[date].B) ? 'B' : 'skip';
        } else if (h % 3 === 0) {
          choice = 'B';
        } else if (h === 7) {
          choice = 'skip';
        } else {
          choice = 'A';
        }
        MOCK_MEAL_CHOICES.push({ studentId: s.id, date, choice });
      });
    });
  });
}

/* ── 집계 ───────────────────────────────────── */
function getMealDayStats(dateStr) {
  const students = getMealTargetStudents();
  const stats = { A: 0, B: 0, skip: 0, none: 0, total: students.length };
  students.forEach(s => {
    const c = getMealChoice(s.id, dateStr);
    if (c === 'A') stats.A++;
    else if (c === 'B') stats.B++;
    else if (c === 'skip') stats.skip++;
    else stats.none++;
  });
  return stats;
}

function getMealWeekStats(weekStart) {
  return getMealWeekDates(weekStart).map(d => ({ date: d, ...getMealDayStats(d) }));
}

/* =============================================
   학생 포털 : 1주치 점심 식단 확인 및 선택
   ============================================= */
/* 저장 전 임시 선택(draft)을 우선 적용한 실제 화면 값 */
function getEffectiveMealChoice(studentId, dateStr) {
  return studentMealDraft[dateStr] !== undefined ? studentMealDraft[dateStr] : getMealChoice(studentId, dateStr);
}

function hasStudentMealDraftChanges() {
  const student = getMealPortalStudent();
  if (!student) return false;
  return Object.keys(studentMealDraft).some(d => (studentMealDraft[d] || null) !== (getMealChoice(student.id, d) || null));
}

/* 메뉴 진입 시에는 임시 선택을 비우고 새로 그린다 */
function initStudentMealView() {
  studentMealDraft = {};
  renderStudentMealView();
}

function renderStudentMealView() {
  ensureMealSeed();
  const student = getMealPortalStudent();
  const wrap = document.getElementById('student-meal-week-body');
  if (!wrap || !student) return;

  const labelEl = document.getElementById('student-meal-week-label');
  if (labelEl) labelEl.textContent = formatMealWeekLabel(studentMealWeekStart);

  const badgeEl = document.getElementById('student-meal-week-badge');
  if (badgeEl) {
    const cur = getMealWeekStart(MEAL_TODAY);
    badgeEl.textContent = studentMealWeekStart === cur ? '이번 주'
      : studentMealWeekStart === mealAddDays(cur, 7) ? '다음 주'
      : studentMealWeekStart === mealAddDays(cur, -7) ? '지난 주' : '';
    badgeEl.style.display = badgeEl.textContent ? 'inline-flex' : 'none';
  }

  const deadlineEl = document.getElementById('student-meal-deadline');
  if (deadlineEl) {
    deadlineEl.innerHTML = `신청 마감 <b>${getMealWeekDeadline(studentMealWeekStart)}</b> · 마감 이후에는 SS 스탭을 통해서만 변경할 수 있습니다.`;
  }

  const dietEl = document.getElementById('student-meal-diet-info');
  if (dietEl) {
    dietEl.innerHTML = `내 식단 구분 <b>${student.dietType || '일반식'}</b>${student.healthNotes ? ` · ${student.healthNotes}` : ''}`;
  }

  const plan = getMealPlan(studentMealWeekStart);
  if (!plan || !plan.published) {
    wrap.innerHTML = `<div class="tsa-card" style="padding:34px;text-align:center;color:#9CA3AF;font-size:13px">
      <div style="font-size:28px;margin-bottom:8px">🍽️</div>
      해당 주차 식단이 아직 공개되지 않았습니다.<br/>식단이 확정되면 이 화면에서 바로 선택할 수 있습니다.
    </div>`;
    updateStudentMealSummary();
    return;
  }

  wrap.innerHTML = getMealWeekDates(studentMealWeekStart).map(date => {
    const day = plan.days[date] || {};
    const locked = isMealDayLocked(date);
    const current = getEffectiveMealChoice(student.id, date);
    const ready = isMealPlanReady(plan, date);

    const optionCards = MEAL_OPTION_KEYS.map(key => {
      const opt = day[key];
      const meta = MEAL_OPTION_META[key];
      if (!opt || !opt.name) {
        return `<div style="flex:1;border:1px dashed #E5E7EB;border-radius:10px;padding:14px;text-align:center;color:#9CA3AF;font-size:11.5px">메뉴 준비 중</div>`;
      }
      const selected = current === key;
      const suitable = isMealSuitableForStudent(student, opt);
      return `<div onclick="${locked ? '' : `selectStudentMeal('${date}','${key}')`}"
        style="flex:1;min-width:0;border:2px solid ${selected ? meta.color : '#E5E7EB'};background:${selected ? meta.bg : '#fff'};
          border-radius:10px;padding:12px 14px;cursor:${locked ? 'not-allowed' : 'pointer'};opacity:${locked && !selected ? '0.6' : '1'};transition:all .15s">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px">
          <span style="font-size:9.5px;font-weight:800;letter-spacing:.4px;color:${meta.color};background:${meta.bg};border:1px solid ${meta.border};border-radius:20px;padding:2px 8px">${meta.label}</span>
          ${selected ? `<span style="font-size:10.5px;font-weight:800;color:${meta.color}">✓ 선택함</span>` : ''}
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:24px">${opt.emoji || '🍱'}</span>
          <div style="min-width:0">
            <div style="font-size:13px;font-weight:800;color:#111827">${opt.name}</div>
            <div style="font-size:11px;color:#6B7280;margin-top:2px">${opt.desc || ''}</div>
          </div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:9px">
          ${(opt.tags || []).map(t => `<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px;padding:1px 7px">${t}</span>`).join('')}
          ${opt.kcal ? `<span class="tsa-badge tsa-badge-gray" style="font-size:9.5px;padding:1px 7px">${opt.kcal} kcal</span>` : ''}
        </div>
        ${(opt.allergens || []).length ? `<div style="font-size:10px;color:#B45309;margin-top:6px">⚠️ 알레르기 유발: ${opt.allergens.join(', ')}</div>` : ''}
        ${!suitable ? `<div style="font-size:10px;color:#DC2626;font-weight:700;margin-top:5px">내 식단 구분(${student.dietType})과 맞지 않는 메뉴입니다.</div>` : ''}
      </div>`;
    }).join('');

    const skipSelected = current === 'skip';

    return `<div class="tsa-card" style="margin-bottom:12px;border-left:3px solid ${locked ? '#D1D5DB' : '#10B981'}">
      <div class="tsa-card-header" style="padding:10px 16px;background:${locked ? '#F9FAFB' : '#F8FFFB'}">
        <h3 class="tsa-card-title" style="font-size:13px">
          <span style="color:${locked ? '#9CA3AF' : '#10B981'}">${formatMealDayLabel(date)}</span>
          <span style="font-size:11px;color:#9CA3AF;font-weight:500;margin-left:6px">${date}</span>
        </h3>
        <div style="display:flex;align-items:center;gap:8px">
          ${locked
            ? `<span class="tsa-badge tsa-badge-gray">🔒 마감</span>`
            : `<span class="tsa-badge" style="background:#D1FAE5;color:#065F46">선택 가능</span>`}
          <span class="tsa-badge" style="background:${(MEAL_CHOICE_META[current || 'none']).bg};color:${(MEAL_CHOICE_META[current || 'none']).color}">${(MEAL_CHOICE_META[current || 'none']).label}</span>
        </div>
      </div>
      <div class="tsa-card-body" style="padding:12px 16px">
        ${ready
          ? `<div style="display:flex;gap:10px;flex-wrap:wrap">${optionCards}</div>`
          : `<div style="padding:16px;text-align:center;color:#9CA3AF;font-size:12px">이 날짜 메뉴는 아직 등록되지 않았습니다.</div>`}
        <div style="display:flex;justify-content:flex-end;margin-top:9px">
          <button class="tsa-btn tsa-btn-sm ${skipSelected ? 'tsa-btn-primary' : 'tsa-btn-outline'}"
            ${locked ? 'disabled style="opacity:.5;cursor:not-allowed"' : `onclick="selectStudentMeal('${date}','skip')"`}>
            ${skipSelected ? '✓ ' : ''}이 날은 도시락 미신청
          </button>
        </div>
      </div>
    </div>`;
  }).join('');

  updateStudentMealSummary();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function changeStudentMealWeek(delta) {
  if (hasStudentMealDraftChanges() && !confirm('저장하지 않은 선택이 있습니다. 주차를 이동하면 사라집니다. 계속할까요?')) return;
  studentMealWeekStart = mealAddDays(studentMealWeekStart, delta * 7);
  initStudentMealView();
}

function goStudentMealThisWeek() {
  if (hasStudentMealDraftChanges() && !confirm('저장하지 않은 선택이 있습니다. 주차를 이동하면 사라집니다. 계속할까요?')) return;
  studentMealWeekStart = getMealWeekStart(MEAL_TODAY);
  initStudentMealView();
}

function selectStudentMeal(dateStr, choice) {
  if (isMealDayLocked(dateStr)) {
    if (typeof showToast === 'function') showToast('이미 마감된 날짜는 변경할 수 없습니다.', 'warning');
    return;
  }
  const student = getMealPortalStudent();
  if (!student) return;

  // 같은 선택을 다시 누르면 해제
  const currentDraft = getEffectiveMealChoice(student.id, dateStr);
  studentMealDraft[dateStr] = currentDraft === choice ? null : choice;

  const opt = choice !== 'skip' ? getMealOption(dateStr, choice) : null;
  if (opt && !isMealSuitableForStudent(student, opt) && studentMealDraft[dateStr] === choice) {
    if (typeof showToast === 'function') {
      showToast(`선택한 메뉴는 '${student.dietType}' 식단과 맞지 않습니다. 그래도 선택하려면 저장 후 SS 스탭에게 알려 주세요.`, 'warning');
    }
  }

  renderStudentMealView();
}

function updateStudentMealSummary() {
  const student = getMealPortalStudent();
  const el = document.getElementById('student-meal-summary');
  if (!el || !student) return;

  const dates = getMealWeekDates(studentMealWeekStart);
  const effective = dates.map(d => getEffectiveMealChoice(student.id, d));
  const decided = effective.filter(c => c === 'A' || c === 'B').length;
  const skipped = effective.filter(c => c === 'skip').length;
  const pending = effective.filter(c => !c).length;
  const openDates = dates.filter(d => !isMealDayLocked(d));
  const dirty = hasStudentMealDraftChanges();

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div style="font-size:12px;color:#374151">
        도시락 신청 <b style="color:#10B981;font-size:15px">${decided}</b> / ${dates.length}일
        · 미신청 <b>${skipped}</b>일 · 미선택 <b style="color:${pending ? '#B45309' : '#9CA3AF'}">${pending}</b>일
      </div>
      <div style="font-size:11px;color:#9CA3AF">변경 가능한 날짜 ${openDates.length}일</div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      ${dirty ? '<span style="font-size:11px;color:#B45309;font-weight:700">저장하지 않은 변경이 있습니다</span>' : ''}
      <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="resetStudentMealDraft()" ${dirty ? '' : 'disabled style="opacity:.5"'}>되돌리기</button>
      <button class="tsa-btn tsa-btn-primary" onclick="saveStudentMealChoices()" ${dirty ? '' : 'disabled style="opacity:.5"'}>
        <i data-lucide="check"></i> 식단 선택 저장
      </button>
    </div>`;
  if (typeof refreshIcons === 'function') refreshIcons();
}

function resetStudentMealDraft() {
  studentMealDraft = {};
  renderStudentMealView();
}

function saveStudentMealChoices() {
  const student = getMealPortalStudent();
  if (!student) return;
  const changed = Object.keys(studentMealDraft).filter(d => (studentMealDraft[d] || null) !== (getMealChoice(student.id, d) || null));
  if (!changed.length) {
    if (typeof showToast === 'function') showToast('변경된 내용이 없습니다.', 'info');
    return;
  }
  changed.forEach(d => setMealChoice(student.id, d, studentMealDraft[d]));
  studentMealDraft = {};
  renderStudentMealView();
  if (typeof showToast === 'function') showToast(`✓ ${changed.length}일치 점심 식단 선택이 저장되었습니다.`, 'success');
}

/* =============================================
   어드민 : 식단 관리
   ============================================= */
function renderMealAdminView() {
  ensureMealSeed();
  ensureMealPlan(mealAdminWeekStart);
  switchMealTab(mealAdminTab);
}

function switchMealTab(tab) {
  mealAdminTab = tab;
  ['plan', 'status', 'aggregate'].forEach(t => {
    const btn = document.getElementById(`meal-tab-${t}`);
    const panel = document.getElementById(`meal-panel-${t}`);
    if (btn) btn.classList.toggle('active', t === tab);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });
  renderMealAdminHeader();
  if (tab === 'plan') renderMealPlanEditor();
  else if (tab === 'status') renderMealChoiceStatus();
  else renderMealAggregate();
  if (typeof refreshIcons === 'function') refreshIcons();
}

function changeMealAdminWeek(delta) {
  mealAdminWeekStart = mealAddDays(mealAdminWeekStart, delta * 7);
  ensureMealPlan(mealAdminWeekStart);
  switchMealTab(mealAdminTab);
}

function goMealAdminThisWeek() {
  mealAdminWeekStart = getMealWeekStart(MEAL_TODAY);
  ensureMealPlan(mealAdminWeekStart);
  switchMealTab(mealAdminTab);
}

function renderMealAdminHeader() {
  const plan = ensureMealPlan(mealAdminWeekStart);
  const labelEl = document.getElementById('meal-admin-week-label');
  if (labelEl) labelEl.textContent = formatMealWeekLabel(mealAdminWeekStart);

  const stateEl = document.getElementById('meal-admin-week-state');
  if (stateEl) {
    stateEl.innerHTML = plan.published
      ? `<span class="tsa-badge" style="background:#D1FAE5;color:#065F46">공개됨</span>`
      : `<span class="tsa-badge tsa-badge-warning">미공개(임시 저장)</span>`;
  }

  const deadlineEl = document.getElementById('meal-admin-deadline');
  if (deadlineEl) deadlineEl.textContent = `학생 신청 마감 ${getMealWeekDeadline(mealAdminWeekStart)}`;

  const weekStats = getMealWeekStats(mealAdminWeekStart);
  const totalStudents = getMealTargetStudents().length;
  const totalSlots = totalStudents * 5;
  const decided = weekStats.reduce((sum, d) => sum + d.A + d.B, 0);
  const missing = weekStats.reduce((sum, d) => sum + d.none, 0);
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('meal-kpi-students', `${totalStudents}명`);
  setText('meal-kpi-decided', `${decided}건`);
  setText('meal-kpi-missing', `${missing}건`);
  setText('meal-kpi-rate', totalSlots ? `${Math.round((decided / totalSlots) * 100)}%` : '-');
}

/* ── 탭 1 : 주간 식단 편성 ─────────────────── */
function renderMealPlanEditor() {
  const wrap = document.getElementById('meal-plan-editor');
  if (!wrap) return;
  const plan = ensureMealPlan(mealAdminWeekStart);

  const noteEl = document.getElementById('meal-plan-note');
  if (noteEl) noteEl.value = plan.note || '';

  wrap.innerHTML = getMealWeekDates(mealAdminWeekStart).map(date => {
    const day = plan.days[date] || {};
    const stats = getMealDayStats(date);
    const locked = isMealDayLocked(date);

    const optionForm = MEAL_OPTION_KEYS.map(key => {
      const opt = day[key] || makeMealOption('🍱', '', '', 0, [], []);
      const meta = MEAL_OPTION_META[key];
      const count = key === 'A' ? stats.A : stats.B;
      return `<div style="flex:1;min-width:260px;border:1px solid ${meta.border};background:${meta.bg};border-radius:10px;padding:12px 14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:9px">
          <span style="font-size:10px;font-weight:800;letter-spacing:.4px;color:${meta.color}">${meta.label}</span>
          <span style="font-size:11px;font-weight:800;color:${meta.color}">선택 ${count}명</span>
        </div>
        <div style="display:grid;grid-template-columns:52px 1fr;gap:7px;margin-bottom:7px">
          <input id="mpe-${date}-${key}-emoji" class="tsa-input" style="text-align:center;padding:6px" value="${opt.emoji || ''}" maxlength="4"/>
          <input id="mpe-${date}-${key}-name" class="tsa-input" style="padding:6px 9px" placeholder="메뉴명 (예: 닭갈비 도시락)" value="${(opt.name || '').replace(/"/g, '&quot;')}"/>
        </div>
        <input id="mpe-${date}-${key}-desc" class="tsa-input" style="padding:6px 9px;margin-bottom:7px" placeholder="구성 설명" value="${(opt.desc || '').replace(/"/g, '&quot;')}"/>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
          <input id="mpe-${date}-${key}-kcal" type="number" min="0" class="tsa-input" style="padding:6px 9px" placeholder="kcal" value="${opt.kcal || ''}"/>
          <input id="mpe-${date}-${key}-tags" class="tsa-input" style="padding:6px 9px" placeholder="태그(쉼표)" value="${(opt.tags || []).join(', ')}"/>
        </div>
        <input id="mpe-${date}-${key}-allergens" class="tsa-input" style="padding:6px 9px;margin-top:7px" placeholder="알레르기 유발 원료(쉼표)" value="${(opt.allergens || []).join(', ')}"/>
      </div>`;
    }).join('');

    return `<div class="tsa-card" style="margin-bottom:12px">
      <div class="tsa-card-header" style="padding:10px 16px;background:#F8F9FC">
        <h3 class="tsa-card-title" style="font-size:13px">${formatMealDayLabel(date)} <span style="font-size:11px;color:#9CA3AF;font-weight:500">${date}</span></h3>
        <div style="display:flex;align-items:center;gap:8px;font-size:11px;color:#6B7280">
          ${locked ? '<span class="tsa-badge tsa-badge-gray">🔒 신청 마감</span>' : '<span class="tsa-badge" style="background:#D1FAE5;color:#065F46">신청 진행중</span>'}
          <span>미선택 <b style="color:${stats.none ? '#B45309' : '#9CA3AF'}">${stats.none}명</b></span>
        </div>
      </div>
      <div class="tsa-card-body" style="padding:12px 16px;display:flex;gap:10px;flex-wrap:wrap">${optionForm}</div>
    </div>`;
  }).join('');
}

function saveMealPlanEditor(publish) {
  const plan = ensureMealPlan(mealAdminWeekStart);
  const parseList = v => v.split(',').map(x => x.trim()).filter(Boolean);
  const draft = {};
  let emptyCount = 0;

  getMealWeekDates(mealAdminWeekStart).forEach(date => {
    draft[date] = {};
    MEAL_OPTION_KEYS.forEach(key => {
      const get = suffix => (document.getElementById(`mpe-${date}-${key}-${suffix}`) || {}).value || '';
      const name = get('name').trim();
      if (!name) emptyCount++;
      draft[date][key] = {
        emoji: get('emoji').trim() || '🍱',
        name,
        desc: get('desc').trim(),
        kcal: Number(get('kcal')) || 0,
        tags: parseList(get('tags')),
        allergens: parseList(get('allergens')),
      };
    });
  });

  // 공개 전 검증에서 걸리면 기존 식단을 덮어쓰지 않는다
  if (publish && emptyCount > 0) {
    if (typeof showToast === 'function') showToast(`메뉴명이 비어 있는 항목이 ${emptyCount}개 있습니다. 모두 입력해야 공개할 수 있습니다.`, 'warning');
    return;
  }

  Object.keys(draft).forEach(date => { plan.days[date] = draft[date]; });

  const noteEl = document.getElementById('meal-plan-note');
  plan.note = noteEl ? noteEl.value.trim() : '';

  if (publish) {
    plan.published = true;
    if (typeof showToast === 'function') showToast(`✓ ${formatMealWeekLabel(mealAdminWeekStart)} 식단을 학생에게 공개했습니다.`, 'success');
  } else {
    if (typeof showToast === 'function') showToast('식단이 임시 저장되었습니다.', 'info');
  }

  renderMealAdminHeader();
  renderMealPlanEditor();
}

function unpublishMealPlan() {
  const plan = ensureMealPlan(mealAdminWeekStart);
  if (!plan.published) return;
  if (!confirm('식단 공개를 취소하면 학생 화면에서 해당 주차 메뉴가 보이지 않습니다. 계속할까요?')) return;
  plan.published = false;
  if (typeof showToast === 'function') showToast('식단 공개가 취소되었습니다.', 'info');
  renderMealAdminHeader();
  renderMealPlanEditor();
}

/* 지난 주 식단을 그대로 복사해서 편성 시간을 줄인다 */
function copyPrevMealWeek() {
  const prevStart = mealAddDays(mealAdminWeekStart, -7);
  const prev = getMealPlan(prevStart);
  if (!prev) {
    if (typeof showToast === 'function') showToast('지난 주 식단이 없습니다.', 'warning');
    return;
  }
  if (!confirm(`${formatMealWeekLabel(prevStart)} 식단을 현재 주차로 복사할까요? 입력 중인 내용은 덮어씁니다.`)) return;

  const plan = ensureMealPlan(mealAdminWeekStart);
  getMealWeekDates(prevStart).forEach((prevDate, i) => {
    const targetDate = mealAddDays(mealAdminWeekStart, i);
    MEAL_OPTION_KEYS.forEach(key => {
      plan.days[targetDate][key] = { ...prev.days[prevDate][key], tags: [...prev.days[prevDate][key].tags], allergens: [...prev.days[prevDate][key].allergens] };
    });
  });
  plan.note = prev.note;
  if (typeof showToast === 'function') showToast('지난 주 식단을 복사했습니다. 확인 후 저장해 주세요.', 'success');
  renderMealPlanEditor();
}

/* ── 탭 2 : 학생별 선택 현황 ───────────────── */
function buildMealStatusFilterOptions() {
  const agencySel = document.getElementById('meal-filter-agency');
  if (agencySel && !agencySel.dataset.built) {
    const agencies = [...new Set(getMealTargetStudents().map(s => s.agency).filter(Boolean))];
    agencySel.innerHTML = `<option value="all">전체 에이전시</option>` + agencies.map(a => `<option value="${a}">${a}</option>`).join('');
    agencySel.dataset.built = '1';
  }
  const dietSel = document.getElementById('meal-filter-diet');
  if (dietSel && !dietSel.dataset.built) {
    const diets = [...new Set(getMealTargetStudents().map(s => s.dietType || '일반식'))];
    dietSel.innerHTML = `<option value="all">전체 식단 구분</option>` + diets.map(d => `<option value="${d}">${d}</option>`).join('');
    dietSel.dataset.built = '1';
  }
}

function setMealStatusFilter(key, value) {
  mealStatusFilters[key] = value;
  renderMealChoiceStatus();
}

function renderMealChoiceStatus() {
  buildMealStatusFilterOptions();
  const tbody = document.getElementById('meal-status-tbody');
  const headEl = document.getElementById('meal-status-thead');
  if (!tbody || !headEl) return;

  const dates = getMealWeekDates(mealAdminWeekStart);
  headEl.innerHTML = `<tr>
    <th style="width:36px;text-align:center">#</th>
    <th>학생</th>
    <th>코스</th>
    <th>에이전시</th>
    <th style="text-align:center">식단 구분</th>
    ${dates.map(d => `<th style="text-align:center">${formatMealDayLabel(d)}</th>`).join('')}
    <th style="text-align:center">선택률</th>
  </tr>`;

  let students = getMealTargetStudents();
  if (mealStatusFilters.agency !== 'all') students = students.filter(s => s.agency === mealStatusFilters.agency);
  if (mealStatusFilters.diet !== 'all') students = students.filter(s => (s.dietType || '일반식') === mealStatusFilters.diet);
  if (mealStatusFilters.keyword) {
    const kw = mealStatusFilters.keyword.toLowerCase();
    students = students.filter(s => `${s.name} ${s.nick} ${s.nationality} ${s.agency}`.toLowerCase().includes(kw));
  }
  if (mealStatusFilters.onlyMissing) {
    students = students.filter(s => dates.some(d => !getMealChoice(s.id, d)));
  }

  const countEl = document.getElementById('meal-status-count');
  if (countEl) countEl.textContent = `${students.length}명`;

  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="${dates.length + 6}" style="text-align:center;padding:26px;color:#9CA3AF;font-size:12px">조건에 맞는 학생이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = students.map((s, idx) => {
    const cells = dates.map(d => {
      const c = getMealChoice(s.id, d) || 'none';
      const meta = MEAL_CHOICE_META[c];
      const opt = c === 'A' || c === 'B' ? getMealOption(d, c) : null;
      const locked = isMealDayLocked(d);
      const title = opt ? `${opt.emoji} ${opt.name}` : meta.label;
      return `<td style="text-align:center">
        <button title="${title}${locked ? ' (마감된 날짜)' : ' · 클릭하여 변경'}"
          onclick="${locked ? '' : `cycleMealChoice(${s.id},'${d}')`}"
          style="border:none;border-radius:20px;padding:3px 9px;font-size:10.5px;font-weight:800;cursor:${locked ? 'default' : 'pointer'};
            background:${meta.bg};color:${meta.color};opacity:${locked ? '0.75' : '1'}">${c === 'none' ? '–' : meta.label.replace(' 선택', '')}</button>
      </td>`;
    }).join('');

    const decided = dates.filter(d => { const c = getMealChoice(s.id, d); return c === 'A' || c === 'B'; }).length;
    const missing = dates.filter(d => !getMealChoice(s.id, d)).length;
    const rate = Math.round((decided / dates.length) * 100);

    return `<tr>
      <td style="text-align:center;color:#9CA3AF;font-size:11px">${idx + 1}</td>
      <td>
        <div style="font-size:12.5px;font-weight:700;color:#111827">${s.flag || ''} ${s.nick}</div>
        <div style="font-size:10.5px;color:#9CA3AF">${s.name}</div>
      </td>
      <td style="font-size:11.5px;color:#374151">${s.course || '-'}</td>
      <td style="font-size:11.5px;color:#374151">${s.agency || '-'}</td>
      <td style="text-align:center"><span class="tsa-badge ${(s.dietType && s.dietType !== '일반식') ? 'tsa-badge-warning' : 'tsa-badge-gray'}" style="font-size:9.5px">${s.dietType || '일반식'}</span></td>
      ${cells}
      <td style="text-align:center">
        <div style="font-size:12px;font-weight:800;color:${missing ? '#B45309' : '#10B981'}">${rate}%</div>
        ${missing ? `<div style="font-size:10px;color:#B45309">미선택 ${missing}일</div>` : '<div style="font-size:10px;color:#9CA3AF">완료</div>'}
      </td>
    </tr>`;
  }).join('');
}

/* 어드민이 표에서 바로 학생 선택을 바꿀 수 있게 A → B → 미신청 → 미선택 순환 */
function cycleMealChoice(studentId, dateStr) {
  const order = ['A', 'B', 'skip', null];
  const cur = getMealChoice(studentId, dateStr);
  const next = order[(order.indexOf(cur) + 1) % order.length];
  setMealChoice(studentId, dateStr, next);
  renderMealAdminHeader();
  renderMealChoiceStatus();
}

/* ── 탭 3 : 일자별 집계 ────────────────────── */
function renderMealAggregate() {
  const wrap = document.getElementById('meal-aggregate-body');
  if (!wrap) return;

  const plan = getMealPlan(mealAdminWeekStart);
  const weekStats = getMealWeekStats(mealAdminWeekStart);
  const students = getMealTargetStudents();

  const dayCards = weekStats.map(st => {
    const optA = plan ? (plan.days[st.date] || {}).A : null;
    const optB = plan ? (plan.days[st.date] || {}).B : null;
    const bar = (val, color) => `<div style="height:8px;border-radius:4px;background:${color};width:${st.total ? (val / st.total) * 100 : 0}%"></div>`;
    return `<div class="tsa-card" style="padding:14px 16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:13px;font-weight:800;color:#111827">${formatMealDayLabel(st.date)}</div>
        <div style="font-size:11px;color:#9CA3AF">${st.date}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:9px">
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px">
            <span style="color:#5E5CE6;font-weight:700">A · ${optA && optA.name ? `${optA.emoji} ${optA.name}` : '미등록'}</span>
            <b style="color:#5E5CE6">${st.A}인분</b>
          </div>
          <div style="background:#F1F4F9;border-radius:4px;overflow:hidden">${bar(st.A, '#5E5CE6')}</div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:3px">
            <span style="color:#0D9488;font-weight:700">B · ${optB && optB.name ? `${optB.emoji} ${optB.name}` : '미등록'}</span>
            <b style="color:#0D9488">${st.B}인분</b>
          </div>
          <div style="background:#F1F4F9;border-radius:4px;overflow:hidden">${bar(st.B, '#0D9488')}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-top:10px;padding-top:9px;border-top:1px dashed #E5E7EB">
        <span>미신청 <b>${st.skip}</b></span>
        <span>미선택 <b style="color:${st.none ? '#B45309' : '#9CA3AF'}">${st.none}</b></span>
        <span>총 발주 <b style="color:#111827">${st.A + st.B}인분</b></span>
      </div>
    </div>`;
  }).join('');

  /* 식단 구분(채식·할랄)별 대응 현황 — 주방에서 별도 준비가 필요한 인원 */
  const dietGroups = {};
  students.forEach(s => {
    const diet = s.dietType || '일반식';
    if (!dietGroups[diet]) dietGroups[diet] = [];
    dietGroups[diet].push(s);
  });

  const dietRows = Object.entries(dietGroups).map(([diet, list]) => {
    const mismatched = [];
    getMealWeekDates(mealAdminWeekStart).forEach(d => {
      list.forEach(s => {
        const c = getMealChoice(s.id, d);
        if (c !== 'A' && c !== 'B') return;
        const opt = getMealOption(d, c);
        if (opt && !isMealSuitableForStudent(s, opt)) mismatched.push(`${s.nick} ${formatMealDayLabel(d)}`);
      });
    });
    return `<tr>
      <td><span class="tsa-badge ${diet === '일반식' ? 'tsa-badge-gray' : 'tsa-badge-warning'}">${diet}</span></td>
      <td style="text-align:center;font-weight:800;color:#111827">${list.length}명</td>
      <td style="font-size:11.5px;color:#6B7280">${list.map(s => s.nick).join(', ')}</td>
      <td style="font-size:11.5px;color:${mismatched.length ? '#DC2626' : '#10B981'}">
        ${mismatched.length ? `⚠️ ${mismatched.join(' / ')}` : '이상 없음'}
      </td>
    </tr>`;
  }).join('');

  const allergenCount = {};
  getMealWeekDates(mealAdminWeekStart).forEach(d => {
    MEAL_OPTION_KEYS.forEach(k => {
      const opt = getMealOption(d, k);
      (opt ? opt.allergens || [] : []).forEach(a => { allergenCount[a] = (allergenCount[a] || 0) + 1; });
    });
  });

  wrap.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-bottom:18px">${dayCards}</div>

    <div class="tsa-card" style="margin-bottom:16px">
      <div class="tsa-card-header"><h3 class="tsa-card-title"><i data-lucide="heart-pulse" style="color:#D97706"></i> 식단 구분별 대응 현황</h3></div>
      <div style="overflow-x:auto">
        <table class="tsa-table" style="font-size:12px">
          <thead><tr><th style="width:110px">식단 구분</th><th style="width:70px;text-align:center">인원</th><th>대상 학생</th><th style="width:280px">선택 메뉴 적합성</th></tr></thead>
          <tbody>${dietRows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#9CA3AF">재학생 데이터가 없습니다.</td></tr>'}</tbody>
        </table>
      </div>
    </div>

    <div class="tsa-card">
      <div class="tsa-card-header"><h3 class="tsa-card-title"><i data-lucide="triangle-alert" style="color:#EF4444"></i> 이번 주 알레르기 유발 원료 사용 횟수</h3></div>
      <div class="tsa-card-body" style="display:flex;gap:8px;flex-wrap:wrap">
        ${Object.keys(allergenCount).length
          ? Object.entries(allergenCount).sort((a, b) => b[1] - a[1]).map(([a, c]) =>
              `<span class="tsa-badge tsa-badge-warning">${a} · ${c}회</span>`).join('')
          : '<span style="font-size:12px;color:#9CA3AF">등록된 알레르기 정보가 없습니다.</span>'}
      </div>
    </div>`;

  if (typeof refreshIcons === 'function') refreshIcons();
}
