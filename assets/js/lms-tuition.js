/* =============================================
   TUITION CONFIG
   수강료 구성
   ============================================= */

const TUITION_RATE_TABLE_WEEKS = [1, 2, 3, 4, 8, 12, 16, 20, 24];
const TUITION_LONG_DISCOUNT_WEEKS = [17, 18, 19, 20, 21, 22, 23, 24];

function getTuitionRatePolicy() {
  if (!window.MOCK_TUITION_RATE_POLICY) {
    window.MOCK_TUITION_RATE_POLICY = {
      shortPremium: { 1: 75, 2: 50, 3: 25 },
      longDiscountRanges: [
        { startWeek: 17, endWeek: 20, rate: 0 },
        { startWeek: 21, endWeek: 23, rate: 0 },
        { startWeek: 24, endWeek: 24, rate: 0 },
      ],
      rounding: 'nearest10',
    };
  }
  const policy = window.MOCK_TUITION_RATE_POLICY;
  if (!policy.weeklyRules) {
    policy.weeklyRules = {};
    for (let weeks = 1; weeks <= 24; weeks += 1) {
      const legacyRange = (policy.longDiscountRanges || []).find(item => weeks >= Number(item.startWeek) && weeks <= Number(item.endWeek));
      const shortRate = Number(policy.shortPremium?.[weeks] || 0);
      const discountRate = Number(legacyRange?.rate || policy.longDiscount?.[weeks] || 0);
      policy.weeklyRules[weeks] = weeks < 4
        ? { type: shortRate ? 'premium' : 'proportional', rate: shortRate }
        : weeks === 4
          ? { type: 'base', rate: 0 }
          : { type: discountRate ? 'discount' : 'proportional', rate: discountRate };
    }
  }
  if (!Array.isArray(policy.formulaHistory)) policy.formulaHistory = [];
  return policy;
}

function roundTuitionAmount(amount) {
  return Math.round(Number(amount || 0) / 10) * 10;
}

function calculateManagedTuitionFee(baseAmount, weeks) {
  const base = Number(baseAmount || 0);
  const duration = Number(weeks || 0);
  if (!base || !duration) return 0;
  const policy = getTuitionRatePolicy();
  const regularAmount = (base / 4) * duration;
  const weeklyRule = policy.weeklyRules?.[duration];
  if (weeklyRule) {
    const rate = Math.min(100, Math.max(0, Number(weeklyRule.rate || 0)));
    if (weeklyRule.type === 'premium') return roundTuitionAmount(regularAmount * (1 + rate / 100));
    if (weeklyRule.type === 'discount') return roundTuitionAmount(regularAmount * (1 - rate / 100));
    return roundTuitionAmount(regularAmount);
  }
  if (duration < 4) {
    const premium = Number(policy.shortPremium?.[duration] || 0);
    return roundTuitionAmount(regularAmount * (1 + premium / 100));
  }
  const range = (policy.longDiscountRanges || []).find(item => duration >= Number(item.startWeek) && duration <= Number(item.endWeek));
  const discount = Number(range?.rate || policy.longDiscount?.[duration] || 0);
  return roundTuitionAmount(regularAmount * (1 - discount / 100));
}

function renderTuitionRateCells(baseFee) {
  return TUITION_RATE_TABLE_WEEKS.map(weeks => {
    const amount = calculateManagedTuitionFee(baseFee, weeks);
    const policy = getTuitionRatePolicy();
    const rule = policy.weeklyRules?.[weeks] || { type: 'proportional', rate: 0 };
    const rate = Number(rule.rate || 0);
    const note = rule.type === 'premium' && rate ? `+${rate}%` : rule.type === 'discount' && rate ? `-${rate}%` : '';
    return `<td style="text-align:right;white-space:nowrap;font-weight:${weeks === 4 ? '800' : '500'}">$${amount.toLocaleString()}${note ? `<div style="font-size:9px;color:${rule.type === 'premium' ? '#D97706' : '#059669'}">${note}</div>` : ''}</td>`;
  }).join('');
}

function openTuitionFormulaPolicyModal() {
  const policy = getTuitionRatePolicy();
  const row = document.getElementById('tuition-formula-policy-row');
  if (!row) return;
  row.innerHTML = Array.from({ length: 24 }, (_, index) => index + 1).map(weeks => {
    const rule = policy.weeklyRules?.[weeks] || { type: weeks === 4 ? 'base' : 'proportional', rate: 0 };
    const locked = weeks === 4;
    return `
      <div style="min-width:174px;border:1px solid ${locked ? '#C7D2FE' : '#E5E7EB'};background:${locked ? '#EEF2FF' : '#fff'};border-radius:10px;padding:10px">
        <div style="font-weight:900;color:${locked ? '#4338CA' : '#111827'};margin-bottom:8px">${weeks}주${locked ? ' · 기준' : ''}</div>
        <select id="tuition-formula-type-${weeks}" class="tsa-input" style="height:36px;font-size:11px;margin-bottom:7px" ${locked ? 'disabled' : ''} onchange="handleTuitionFormulaTypeChange(${weeks})">
          <option value="proportional" ${rule.type === 'proportional' ? 'selected' : ''}>기본 비례</option>
          <option value="premium" ${rule.type === 'premium' ? 'selected' : ''}>할증</option>
          <option value="discount" ${rule.type === 'discount' ? 'selected' : ''}>할인</option>
          ${locked ? '<option value="base" selected>4주 기준</option>' : ''}
        </select>
        <div style="display:flex;align-items:center;gap:5px">
          <input id="tuition-formula-rate-${weeks}" type="number" min="0" max="100" step="1" class="tsa-input" style="height:36px;font-size:11px" value="${Number(rule.rate || 0)}" ${locked || rule.type === 'proportional' ? 'disabled' : ''} oninput="previewTuitionFormulaPolicy()" />
          <span style="font-size:11px;color:#6B7280">%</span>
        </div>
        <div id="tuition-formula-preview-${weeks}" style="font-size:11px;font-weight:800;margin-top:8px;color:#374151"></div>
      </div>`;
  }).join('');
  previewTuitionFormulaPolicy();
  renderTuitionFormulaHistory();
  openModal('tuition-formula-policy-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function handleTuitionFormulaTypeChange(weeks) {
  const type = document.getElementById(`tuition-formula-type-${weeks}`)?.value || 'proportional';
  const rate = document.getElementById(`tuition-formula-rate-${weeks}`);
  if (rate) {
    rate.disabled = type === 'proportional' || type === 'base';
    if (rate.disabled) rate.value = '0';
  }
  previewTuitionFormulaPolicy();
}

function readTuitionFormulaRulesFromForm() {
  return Object.fromEntries(Array.from({ length: 24 }, (_, index) => index + 1).map(weeks => {
    const type = weeks === 4 ? 'base' : (document.getElementById(`tuition-formula-type-${weeks}`)?.value || 'proportional');
    const rate = type === 'premium' || type === 'discount'
      ? Math.min(100, Math.max(0, Number(document.getElementById(`tuition-formula-rate-${weeks}`)?.value || 0)))
      : 0;
    return [weeks, { type, rate }];
  }));
}

function previewTuitionFormulaPolicy() {
  const sampleBase = 800;
  const rules = readTuitionFormulaRulesFromForm();
  Object.entries(rules).forEach(([weeksKey, rule]) => {
    const weeks = Number(weeksKey);
    const regular = (sampleBase / 4) * weeks;
    const amount = rule.type === 'premium'
      ? roundTuitionAmount(regular * (1 + rule.rate / 100))
      : rule.type === 'discount'
        ? roundTuitionAmount(regular * (1 - rule.rate / 100))
        : roundTuitionAmount(regular);
    const originalAmount = roundTuitionAmount(regular);
    const adjustment = Math.abs(amount - originalAmount);
    const target = document.getElementById(`tuition-formula-preview-${weeks}`);
    if (target) {
      const sign = rule.type === 'premium' ? `+${rule.rate}%` : rule.type === 'discount' ? `-${rule.rate}%` : '비례';
      const adjustmentLabel = rule.type === 'premium' ? '할증 금액' : rule.type === 'discount' ? '할인 금액' : '조정 금액';
      const adjustmentColor = rule.type === 'premium' ? '#C2410C' : rule.type === 'discount' ? '#047857' : '#9CA3AF';
      const adjustmentSign = rule.type === 'premium' ? '+' : rule.type === 'discount' ? '-' : '';
      target.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;padding-top:7px;border-top:1px solid #E5E7EB;font-size:10px;color:#6B7280"><span>원 금액</span><b style="color:#374151">$${originalAmount.toLocaleString()}</b></div>
        <div style="display:flex;justify-content:space-between;gap:8px;margin-top:4px;font-size:10px;color:${adjustmentColor}"><span>${adjustmentLabel} <b>${sign}</b></span><b>${adjustmentSign}$${adjustment.toLocaleString()}</b></div>
        <div style="display:flex;justify-content:space-between;gap:8px;margin-top:7px;padding-top:7px;border-top:1px dashed #CBD5E1;font-size:11px"><span style="color:#111827">최종 금액</span><b style="font-size:15px;color:#111827">$${amount.toLocaleString()}</b></div>`;
    }
  });
}

function saveTuitionFormulaPolicy() {
  const policy = getTuitionRatePolicy();
  const previousRules = JSON.parse(JSON.stringify(policy.weeklyRules || {}));
  const nextRules = readTuitionFormulaRulesFromForm();
  const changes = Array.from({ length: 24 }, (_, index) => index + 1).filter(weeks => {
    const before = previousRules[weeks] || { type: weeks === 4 ? 'base' : 'proportional', rate: 0 };
    const after = nextRules[weeks];
    return before.type !== after.type || Number(before.rate || 0) !== Number(after.rate || 0);
  }).map(weeks => ({ weeks, before: previousRules[weeks] || { type: weeks === 4 ? 'base' : 'proportional', rate: 0 }, after: nextRules[weeks] }));
  if (!changes.length) {
    showToast('변경된 공식이 없어.', 'warning');
    return;
  }
  policy.weeklyRules = nextRules;
  policy.shortPremium = Object.fromEntries([1, 2, 3].map(weeks => [weeks, policy.weeklyRules[weeks].type === 'premium' ? policy.weeklyRules[weeks].rate : 0]));
  policy.longDiscountRanges = [];
  delete policy.longDiscount;
  const roleKey = typeof APP !== 'undefined' ? APP.user : null;
  const savedBy = roleKey && typeof ROLE_CONFIG !== 'undefined' && ROLE_CONFIG[roleKey] ? ROLE_CONFIG[roleKey].label : '슈퍼 어드민';
  policy.formulaHistory.unshift({
    id: Date.now(),
    savedAt: new Date().toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    savedBy,
    changes,
  });
  renderTuitionCourseList();
  renderTuitionDormList();
  renderTuitionFormulaHistory();
  showToast('기간별 요금 공식이 저장되었습니다.', 'success');
}

function formatTuitionFormulaRule(rule) {
  if (!rule || rule.type === 'proportional') return '기본 비례';
  if (rule.type === 'base') return '4주 기준';
  if (rule.type === 'premium') return `할증 ${Number(rule.rate || 0)}%`;
  if (rule.type === 'discount') return `할인 ${Number(rule.rate || 0)}%`;
  return '-';
}

function renderTuitionFormulaHistory() {
  const target = document.getElementById('tuition-formula-history');
  if (!target) return;
  const history = getTuitionRatePolicy().formulaHistory || [];
  target.innerHTML = history.length ? history.map((entry, index) => `
    <details ${index === 0 ? 'open' : ''} style="border:1px solid #E5E7EB;border-radius:10px;background:#fff;overflow:hidden">
      <summary style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 13px;cursor:pointer;list-style:none">
        <div><b style="font-size:11.5px;color:#111827">${entry.savedBy}</b><span style="font-size:10.5px;color:#6B7280;margin-left:8px">${entry.savedAt}</span></div>
        <span class="tsa-badge tsa-badge-primary">${entry.changes.length}개 주차 변경</span>
      </summary>
      <div style="border-top:1px solid #E5E7EB;padding:8px 13px 11px;display:grid;gap:6px">
        ${entry.changes.map(change => `
          <div style="display:grid;grid-template-columns:44px 1fr 18px 1fr;gap:8px;align-items:center;font-size:10.5px">
            <b style="color:#374151">${change.weeks}주</b>
            <span style="padding:5px 7px;border-radius:6px;background:#F8FAFC;color:#64748B">${formatTuitionFormulaRule(change.before)}</span>
            <span style="text-align:center;color:#9CA3AF">→</span>
            <span style="padding:5px 7px;border-radius:6px;background:${change.after.type === 'premium' ? '#FFF7ED' : change.after.type === 'discount' ? '#ECFDF5' : '#EEF2FF'};color:${change.after.type === 'premium' ? '#C2410C' : change.after.type === 'discount' ? '#047857' : '#4338CA'};font-weight:800">${formatTuitionFormulaRule(change.after)}</span>
          </div>`).join('')}
      </div>
    </details>`).join('') : '<div style="padding:18px;text-align:center;border:1px dashed #CBD5E1;border-radius:10px;color:#94A3B8;font-size:11px">아직 저장된 공식 변경 이력이 없습니다.</div>';
}

function initTuitionConfig() {
  renderTuitionCourseList();
  renderTuitionDormList();
  renderTuitionLocalFeeList();
}

function switchTuitionConfigTab(tab, el) {
  document.querySelectorAll('.tuition-config-tab-content').forEach(content => {
    content.style.display = 'none';
  });
  const target = document.getElementById(`tuition-config-tab-${tab}`);
  if (target) target.style.display = '';

  if (el) {
    el.parentElement.querySelectorAll('.tsa-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
}

function renderTuitionCourseList() {
  const tbody = document.getElementById('tuition-course-list-body');
  if (!tbody) return;

  tbody.innerHTML = MOCK_COURSES.map((course, idx) => {
    const baseFee = Number(course.fee || 0);
    const visible = course.active !== false;
    return `
      <tr>
        <td>
          <div style="font-weight:700;color:#111827">${course.name}</div>
          <div style="font-size:10.5px;color:#9CA3AF">커리큘럼 설정과 연결</div>
        </td>
        <td>4주</td>
        ${renderTuitionRateCells(baseFee)}
        <td style="text-align:center"><span class="tsa-badge ${visible ? 'tsa-badge-success' : 'tsa-badge-gray'}">${visible ? '노출' : '숨김'}</span></td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openTuitionCourseModal(${idx})">수정</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openTuitionCourseModal(idx = null) {
  const isEdit = idx !== null && idx !== undefined;
  const course = isEdit ? MOCK_COURSES[idx] : null;
  const setTuitionVal = (id, val) => {
    const target = document.getElementById(id);
    if (target) target.value = val ?? '';
  };

  const title = document.getElementById('tuition-course-modal-title');
  if (title) title.textContent = isEdit ? '과정별 수강료 수정' : '과정별 수강료 추가';

  const editEl = document.getElementById('tuition-course-edit-index');
  if (editEl) editEl.value = isEdit ? String(idx) : '';

  const courseSelect = document.getElementById('tuition-course-name');
  if (courseSelect) {
    courseSelect.innerHTML = MOCK_COURSES.map((c, i) => `<option value="${i}" ${isEdit && i === idx ? 'selected' : ''}>${c.name}</option>`).join('');
    courseSelect.disabled = isEdit;
  }

  const targetCourse = course || MOCK_COURSES[0];
  setTuitionVal('tuition-base-fee', targetCourse ? Number(targetCourse.fee || 0) : '');
  setTuitionVal('tuition-calc-mode', course?.tuitionPolicy?.calcMode || 'auto');
  setTuitionVal('tuition-fee-8w', course?.tuitionPolicy?.fee8 || '');
  setTuitionVal('tuition-fee-12w', course?.tuitionPolicy?.fee12 || '');
  setTuitionVal('tuition-fee-16w', course?.tuitionPolicy?.fee16 || '');
  setTuitionVal('tuition-fee-20w', course?.tuitionPolicy?.fee20 || '');
  setTuitionVal('tuition-fee-24w', course?.tuitionPolicy?.fee24 || '');
  setTuitionVal('tuition-course-memo', '');

  previewTuitionCourseModal();
  openModal('tuition-course-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function handleTuitionCourseSelectChange() {
  const idx = parseInt(document.getElementById('tuition-course-name')?.value, 10);
  const course = MOCK_COURSES[idx];
  if (!course) return;
  const baseFeeEl = document.getElementById('tuition-base-fee');
  if (baseFeeEl) baseFeeEl.value = Number(course.fee || 0);
  previewTuitionCourseModal();
}

function previewTuitionCourseModal() {
  const base = parseInt(document.getElementById('tuition-base-fee')?.value, 10) || 0;
  const preview = document.getElementById('tuition-course-preview');
  if (preview) {
    const rows = TUITION_RATE_TABLE_WEEKS.map(weeks => ({ label: `${weeks}주`, value: calculateManagedTuitionFee(base, weeks), active: weeks === 4 }));
    preview.innerHTML = rows.map(row => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:9px;background:${row.active ? '#EEF2FF' : '#fff'};border:1px solid ${row.active ? '#C7D2FE' : '#E5E7EB'}">
        <div style="font-size:12px;font-weight:700;color:${row.active ? '#4338CA' : '#374151'}">${row.label}</div>
        <div style="font-size:14px;font-weight:900;color:#111827">$${Number(row.value || 0).toLocaleString()}</div>
      </div>
    `).join('');
  }
}

function saveTuitionCoursePolicy() {
  const editIdxRaw = document.getElementById('tuition-course-edit-index')?.value;
  const selectedIdx = parseInt(document.getElementById('tuition-course-name')?.value, 10);
  const idx = editIdxRaw !== '' ? parseInt(editIdxRaw, 10) : selectedIdx;
  const course = MOCK_COURSES[idx];
  if (!course) return;

  const baseFee = parseInt(document.getElementById('tuition-base-fee')?.value, 10) || 0;
  if (baseFee <= 0) {
    showToast('4주 수강료를 입력해줘.', 'warning');
    return;
  }

  course.fee = baseFee;
  course.tuitionPolicy = {
    basePeriod: 4,
    baseFee,
    calcMode: 'managed',
    ...Object.fromEntries(TUITION_RATE_TABLE_WEEKS.map(weeks => [`fee${weeks}`, calculateManagedTuitionFee(baseFee, weeks)])),
    memo: document.getElementById('tuition-course-memo')?.value.trim() || '',
  };

  closeModal('tuition-course-modal');
  renderTuitionCourseList();
  if (typeof renderCourseList === 'function') renderCourseList();
  showToast('과정별 수강료가 저장되었습니다.', 'success');
}

function renderTuitionDormList() {
  const tbody = document.getElementById('tuition-dorm-list-body');
  if (!tbody) return;

  const templates = typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES : [];
  tbody.innerHTML = templates.map((template, idx) => {
    const capacityLabel = `${template.capacity || '-'}인실`;
    const baseFee = Number(template.cost || 0);
    const visible = template.active !== false;
    return `
      <tr>
        <td style="font-weight:700;color:#111827">${template.accomType || '-'}</td>
        <td>${capacityLabel}</td>
        <td>${template.condition || '-'}</td>
        <td>4주</td>
        ${renderTuitionRateCells(baseFee)}
        <td style="text-align:center">
          <span class="tsa-badge ${visible ? 'tsa-badge-success' : 'tsa-badge-gray'}" style="cursor:pointer" onclick="toggleTuitionDormVisibility(${idx})">${visible ? '노출' : '숨김'}</span>
        </td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openTuitionDormModal(${idx})">수정</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="15" style="text-align:center;color:#9CA3AF;padding:24px">등록된 기숙사 요금표가 없습니다.</td></tr>`;
}

function openTuitionShortPremiumModal() {
  const policy = getTuitionRatePolicy();
  [1, 2, 3].forEach(weeks => {
    const input = document.getElementById(`tuition-premium-${weeks}`);
    if (input) input.value = Number(policy.shortPremium?.[weeks] || 0);
  });
  previewTuitionShortPremiumPolicy();
  openModal('tuition-short-premium-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function previewTuitionShortPremiumPolicy() {
  const preview = document.getElementById('tuition-short-premium-preview');
  if (!preview) return;
  const sampleBase = 800;
  preview.innerHTML = `<div style="font-size:11px;font-weight:800;color:#374151;margin-bottom:8px">4주 요금 $800 기준 미리보기</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">${[1, 2, 3].map(weeks => {
    const rate = Math.max(0, Number(document.getElementById(`tuition-premium-${weeks}`)?.value || 0));
    const amount = roundTuitionAmount((sampleBase / 4) * weeks * (1 + rate / 100));
    return `<div style="padding:10px;border:1px solid #FED7AA;background:#FFF7ED;border-radius:9px;text-align:center"><b style="font-size:11px;color:#9A3412">${weeks}주 · +${rate}%</b><div style="font-size:15px;font-weight:900;margin-top:4px">$${amount.toLocaleString()}</div></div>`;
  }).join('')}</div>`;
}

function saveTuitionShortPremiumPolicy() {
  const policy = getTuitionRatePolicy();
  [1, 2, 3].forEach(weeks => {
    policy.shortPremium[weeks] = Math.max(0, Number(document.getElementById(`tuition-premium-${weeks}`)?.value || 0));
  });
  closeModal('tuition-short-premium-modal');
  renderTuitionCourseList();
  renderTuitionDormList();
  showToast('단기 할증률이 저장되었습니다.', 'success');
}

let editingTuitionLongDiscountRanges = [];

function readTuitionLongDiscountRangesFromForm() {
  return editingTuitionLongDiscountRanges.map((range, index) => ({
    startWeek: Number(document.getElementById(`tuition-range-start-${index}`)?.value || range.startWeek),
    endWeek: Number(document.getElementById(`tuition-range-end-${index}`)?.value || range.endWeek),
    rate: Math.min(100, Math.max(0, Number(document.getElementById(`tuition-range-rate-${index}`)?.value || 0))),
  }));
}

function renderTuitionLongDiscountRanges() {
  const fields = document.getElementById('tuition-long-discount-fields');
  if (!fields) return;
  const weekOptions = TUITION_LONG_DISCOUNT_WEEKS.map(weeks => `<option value="${weeks}">${weeks}주</option>`).join('');
  fields.innerHTML = editingTuitionLongDiscountRanges.map((range, index) => `
    <div style="display:grid;grid-template-columns:36px 1fr 24px 1fr 1fr 42px;gap:10px;align-items:end;padding:12px;border:1px solid #E5E7EB;border-radius:10px;background:#fff">
      <div style="width:28px;height:28px;border-radius:50%;background:#ECFDF5;color:#047857;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;margin-bottom:6px">${index + 1}</div>
      <div class="tsa-form-group"><label class="tsa-label">시작 주차</label><select id="tuition-range-start-${index}" class="tsa-input" onchange="syncTuitionLongDiscountRanges()">${weekOptions}</select></div>
      <div style="text-align:center;color:#9CA3AF;padding-bottom:11px">~</div>
      <div class="tsa-form-group"><label class="tsa-label">종료 주차</label><select id="tuition-range-end-${index}" class="tsa-input" onchange="syncTuitionLongDiscountRanges()">${weekOptions}</select></div>
      <div class="tsa-form-group"><label class="tsa-label">할인율 (%)</label><input id="tuition-range-rate-${index}" type="number" min="0" max="100" step="1" class="tsa-input" value="${Number(range.rate || 0)}" oninput="syncTuitionLongDiscountRanges()"/></div>
      <button type="button" class="tsa-btn tsa-btn-outline tsa-btn-sm" style="color:#EF4444;margin-bottom:1px" onclick="removeTuitionLongDiscountRange(${index})" title="구간 삭제"><i data-lucide="trash-2"></i></button>
    </div>
  `).join('');
  editingTuitionLongDiscountRanges.forEach((range, index) => {
    const start = document.getElementById(`tuition-range-start-${index}`);
    const end = document.getElementById(`tuition-range-end-${index}`);
    if (start) start.value = String(range.startWeek);
    if (end) end.value = String(range.endWeek);
  });
  if (typeof refreshIcons === 'function') refreshIcons();
}

function syncTuitionLongDiscountRanges() {
  editingTuitionLongDiscountRanges = readTuitionLongDiscountRangesFromForm();
  previewTuitionLongDiscountPolicy();
}

function addTuitionLongDiscountRange() {
  editingTuitionLongDiscountRanges = readTuitionLongDiscountRangesFromForm();
  const lastEnd = editingTuitionLongDiscountRanges.reduce((max, range) => Math.max(max, Number(range.endWeek || 16)), 16);
  const nextWeek = Math.min(24, lastEnd + 1);
  if (lastEnd >= 24) {
    showToast('24주까지 모든 할인 구간이 설정되어 있어.', 'warning');
    return;
  }
  editingTuitionLongDiscountRanges.push({ startWeek: nextWeek, endWeek: nextWeek, rate: 0 });
  renderTuitionLongDiscountRanges();
  previewTuitionLongDiscountPolicy();
}

function removeTuitionLongDiscountRange(index) {
  editingTuitionLongDiscountRanges = readTuitionLongDiscountRangesFromForm();
  editingTuitionLongDiscountRanges.splice(index, 1);
  renderTuitionLongDiscountRanges();
  previewTuitionLongDiscountPolicy();
}

function openTuitionLongDiscountModal() {
  const policy = getTuitionRatePolicy();
  editingTuitionLongDiscountRanges = (policy.longDiscountRanges || [
    { startWeek: 17, endWeek: 20, rate: 0 },
    { startWeek: 21, endWeek: 23, rate: 0 },
    { startWeek: 24, endWeek: 24, rate: 0 },
  ]).map(range => ({ ...range }));
  renderTuitionLongDiscountRanges();
  previewTuitionLongDiscountPolicy();
  openModal('tuition-long-discount-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function previewTuitionLongDiscountPolicy() {
  const preview = document.getElementById('tuition-long-discount-preview');
  if (!preview) return;
  const ranges = readTuitionLongDiscountRangesFromForm();
  const sampleBase = 800;
  preview.innerHTML = `<div style="font-size:11px;font-weight:800;color:#374151;margin-bottom:8px">4주 요금 $800 기준 미리보기</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">${TUITION_LONG_DISCOUNT_WEEKS.map(weeks => {
    const range = ranges.find(item => weeks >= item.startWeek && weeks <= item.endWeek);
    const rate = Number(range?.rate || 0);
    const amount = roundTuitionAmount((sampleBase / 4) * weeks * (1 - rate / 100));
    return `<div style="padding:9px;border:1px solid ${range ? '#A7F3D0' : '#E5E7EB'};background:${range ? '#ECFDF5' : '#F9FAFB'};border-radius:9px;text-align:center"><b style="font-size:10.5px;color:${range ? '#047857' : '#6B7280'}">${weeks}주 · ${range ? `-${rate}%` : '할인 없음'}</b><div style="font-size:14px;font-weight:900;margin-top:4px">$${amount.toLocaleString()}</div></div>`;
  }).join('')}</div>`;
}

function saveTuitionLongDiscountPolicy() {
  const ranges = readTuitionLongDiscountRangesFromForm().sort((a, b) => a.startWeek - b.startWeek);
  if (!ranges.length) {
    showToast('장기 할인 구간을 1개 이상 등록해줘.', 'warning');
    return;
  }
  for (let index = 0; index < ranges.length; index += 1) {
    const range = ranges[index];
    if (range.startWeek > range.endWeek) {
      showToast(`${index + 1}번 구간의 종료 주차가 시작 주차보다 빨라.`, 'warning');
      return;
    }
    const overlaps = ranges.some((other, otherIndex) => otherIndex !== index && range.startWeek <= other.endWeek && range.endWeek >= other.startWeek);
    if (overlaps) {
      showToast('할인 구간이 서로 겹쳐 있어. 주차 범위를 다시 확인해줘.', 'warning');
      return;
    }
  }
  const policy = getTuitionRatePolicy();
  policy.longDiscountRanges = ranges;
  delete policy.longDiscount;
  closeModal('tuition-long-discount-modal');
  renderTuitionCourseList();
  renderTuitionDormList();
  showToast('장기 구간별 할인율이 저장되었습니다.', 'success');
}

function toggleTuitionDormVisibility(idx) {
  if (typeof MOCK_DORM_TEMPLATES === 'undefined') return;
  const template = MOCK_DORM_TEMPLATES[idx];
  if (!template) return;
  template.active = template.active === false ? true : false;
  renderTuitionDormList();
  showToast(`기숙사 요금이 ${template.active ? '노출' : '숨김'} 처리되었습니다.`, 'success');
}

function getVisibleDormMasterOptions(listName, currentValue = '') {
  let source = [];
  if (listName === 'MOCK_DORM_MASTER_ACCOM_TYPES' && typeof MOCK_DORM_MASTER_ACCOM_TYPES !== 'undefined') {
    source = MOCK_DORM_MASTER_ACCOM_TYPES;
  } else if (listName === 'MOCK_DORM_MASTER_GRADES' && typeof MOCK_DORM_MASTER_GRADES !== 'undefined') {
    source = MOCK_DORM_MASTER_GRADES;
  } else if (listName === 'MOCK_DORM_MASTER_CAPACITIES' && typeof MOCK_DORM_MASTER_CAPACITIES !== 'undefined') {
    source = MOCK_DORM_MASTER_CAPACITIES;
  }
  const rows = Array.isArray(source) ? source.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  const visibleRows = rows.filter(item => item.visible !== false || item.name === currentValue);
  const masterValues = visibleRows.map(item => item.name);

  let fallbackValues = [];
  if (!masterValues.length && typeof MOCK_DORM_TEMPLATES !== 'undefined') {
    if (listName === 'MOCK_DORM_MASTER_ACCOM_TYPES') {
      fallbackValues = MOCK_DORM_TEMPLATES.map(item => item.accomType);
    } else if (listName === 'MOCK_DORM_MASTER_GRADES') {
      fallbackValues = MOCK_DORM_TEMPLATES.map(item => item.condition);
    } else if (listName === 'MOCK_DORM_MASTER_CAPACITIES') {
      fallbackValues = MOCK_DORM_TEMPLATES.map(item => item.capacity ? `${item.capacity}인실` : '');
    }
  }

  return Array.from(new Set([...masterValues, ...fallbackValues].filter(Boolean)));
}

function populateTuitionDormMasterSelects(template = null) {
  const fillSelect = (id, values, currentValue, placeholder) => {
    const select = document.getElementById(id);
    if (!select) return;
    const uniqueValues = Array.from(new Set([currentValue, ...values].filter(Boolean)));
    select.innerHTML = [
      `<option value="">${placeholder}</option>`,
      ...uniqueValues.map(value => `<option value="${value}">${value}</option>`),
    ].join('');
    select.value = currentValue || '';
  };

  fillSelect(
    'tuition-dorm-accom-type',
    getVisibleDormMasterOptions('MOCK_DORM_MASTER_ACCOM_TYPES', template?.accomType || ''),
    template?.accomType || '',
    '숙소 유형 선택'
  );
  fillSelect(
    'tuition-dorm-condition',
    getVisibleDormMasterOptions('MOCK_DORM_MASTER_GRADES', template?.condition || ''),
    template?.condition || '',
    '등급 선택'
  );

  const capacityLabel = template?.capacity ? `${template.capacity}인실` : '';
  fillSelect(
    'tuition-dorm-capacity',
    getVisibleDormMasterOptions('MOCK_DORM_MASTER_CAPACITIES', capacityLabel),
    capacityLabel,
    '인실 기준 선택'
  );
}

function openTuitionDormModal(idx = null) {
  const templates = typeof MOCK_DORM_TEMPLATES !== 'undefined' ? MOCK_DORM_TEMPLATES : [];
  const isEdit = idx !== null && idx !== undefined;
  const template = isEdit ? templates[idx] : null;

  const title = document.getElementById('tuition-dorm-modal-title');
  if (title) title.textContent = isEdit ? '기숙사 요금 수정' : '기숙사 요금 추가';

  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  };

  populateTuitionDormMasterSelects(template);
  setVal('tuition-dorm-edit-index', isEdit ? idx : '');
  setVal('tuition-dorm-base-fee', template?.cost || '');
  setVal('tuition-dorm-calc-mode', template?.tuitionPolicy?.calcMode || 'auto');
  setVal('tuition-dorm-fee-8w', template?.tuitionPolicy?.fee8 || '');
  setVal('tuition-dorm-fee-12w', template?.tuitionPolicy?.fee12 || '');
  setVal('tuition-dorm-fee-16w', template?.tuitionPolicy?.fee16 || '');
  setVal('tuition-dorm-fee-20w', template?.tuitionPolicy?.fee20 || '');
  setVal('tuition-dorm-fee-24w', template?.tuitionPolicy?.fee24 || '');
  setVal('tuition-dorm-memo', template?.tuitionPolicy?.memo || '');

  previewTuitionDormModal();
  openModal('tuition-dorm-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function previewTuitionDormModal() {
  const base = parseInt(document.getElementById('tuition-dorm-base-fee')?.value, 10) || 0;
  const preview = document.getElementById('tuition-dorm-preview');
  if (preview) {
    const rows = TUITION_RATE_TABLE_WEEKS.map(weeks => ({ label: `${weeks}주`, value: calculateManagedTuitionFee(base, weeks), active: weeks === 4 }));
    preview.innerHTML = rows.map(row => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:9px;background:${row.active ? '#ECFDF5' : '#fff'};border:1px solid ${row.active ? '#A7F3D0' : '#E5E7EB'}">
        <div style="font-size:12px;font-weight:700;color:${row.active ? '#047857' : '#374151'}">${row.label}</div>
        <div style="font-size:14px;font-weight:900;color:#111827">$${Number(row.value || 0).toLocaleString()}</div>
      </div>
    `).join('');
  }
}

function saveTuitionDormPolicy() {
  if (typeof MOCK_DORM_TEMPLATES === 'undefined') return;

  const editIdxRaw = document.getElementById('tuition-dorm-edit-index')?.value || '';
  const accomType = document.getElementById('tuition-dorm-accom-type')?.value.trim() || '';
  const capacityLabel = document.getElementById('tuition-dorm-capacity')?.value || '';
  const capacity = parseInt(capacityLabel, 10) || 0;
  const condition = document.getElementById('tuition-dorm-condition')?.value.trim() || '';
  const baseFee = parseInt(document.getElementById('tuition-dorm-base-fee')?.value, 10) || 0;

  if (!accomType) {
    showToast('숙소 유형을 선택해줘.', 'warning');
    return;
  }
  if (capacity <= 0) {
    showToast('인실 기준을 선택해줘.', 'warning');
    return;
  }
  if (baseFee < 0) {
    showToast('4주 요금은 0 이상으로 입력해줘.', 'warning');
    return;
  }

  const nextTemplate = {
    id: editIdxRaw !== '' && MOCK_DORM_TEMPLATES[parseInt(editIdxRaw, 10)] ? MOCK_DORM_TEMPLATES[parseInt(editIdxRaw, 10)].id : Date.now(),
    accomType,
    capacity,
    condition: condition || '스탠다드',
    count: editIdxRaw !== '' && MOCK_DORM_TEMPLATES[parseInt(editIdxRaw, 10)] ? MOCK_DORM_TEMPLATES[parseInt(editIdxRaw, 10)].count : 0,
    costDay: 0,
    costWeek: 0,
    cost: baseFee,
    active: editIdxRaw !== '' && MOCK_DORM_TEMPLATES[parseInt(editIdxRaw, 10)]
      ? MOCK_DORM_TEMPLATES[parseInt(editIdxRaw, 10)].active !== false
      : true,
    tuitionPolicy: {
      basePeriod: 4,
      baseFee,
      calcMode: 'managed',
      ...Object.fromEntries(TUITION_RATE_TABLE_WEEKS.map(weeks => [`fee${weeks}`, calculateManagedTuitionFee(baseFee, weeks)])),
      memo: document.getElementById('tuition-dorm-memo')?.value.trim() || '',
    },
  };

  if (editIdxRaw !== '') {
    const idx = parseInt(editIdxRaw, 10);
    if (MOCK_DORM_TEMPLATES[idx]) MOCK_DORM_TEMPLATES[idx] = nextTemplate;
  } else {
    MOCK_DORM_TEMPLATES.push(nextTemplate);
  }

  closeModal('tuition-dorm-modal');
  renderTuitionDormList();
  showToast('기숙사 요금이 저장되었습니다.', 'success');
}

function getTuitionLocalFeeItems() {
  if (!window.MOCK_TUITION_EXTRA_ITEMS) {
    window.MOCK_TUITION_EXTRA_ITEMS = [
      { name: '등록금', amount: 100, type: 'required', commissionEnabled: true, applicationMemo: '전체 학생', memo: '' },
      { name: 'SSP 발급비', amount: 120, type: 'optional', commissionEnabled: false, applicationMemo: 'SSP 필요 국가', memo: '' },
      { name: '비자 연장비 1차', amount: 80, type: 'optional', commissionEnabled: false, applicationMemo: '30일 초과 체류', memo: '' },
      { name: 'ACR I-Card', amount: 70, type: 'optional', commissionEnabled: false, applicationMemo: '59일 초과 체류', memo: '' },
      { name: '공항 픽업비', amount: 30, type: 'optional', commissionEnabled: true, applicationMemo: '공항 픽업 신청 시', memo: '' },
      { name: '액티비티비', amount: 50, type: 'optional', commissionEnabled: false, applicationMemo: '교외 활동 및 프로그램 신청 시', memo: '' },
      { name: 'IELTS 시험비', amount: 250, type: 'optional', commissionEnabled: false, applicationMemo: 'IELTS 공식 시험 신청 시', memo: '' },
    ];
  }
  const requiredDefaults = [
    { name: '액티비티비', amount: 50, type: 'optional', commissionEnabled: false, applicationMemo: '교외 활동 및 프로그램 신청 시', memo: '' },
    { name: 'IELTS 시험비', amount: 250, type: 'optional', commissionEnabled: false, applicationMemo: 'IELTS 공식 시험 신청 시', memo: '' },
  ];
  requiredDefaults.forEach(defaultItem => {
    if (!window.MOCK_TUITION_EXTRA_ITEMS.some(item => item.name === defaultItem.name)) {
      window.MOCK_TUITION_EXTRA_ITEMS.push({ ...defaultItem });
    }
  });
  window.MOCK_TUITION_EXTRA_ITEMS.forEach(item => {
    if (!item.type) item.type = item.name === '등록금' ? 'required' : 'optional';
    if (typeof item.commissionEnabled !== 'boolean') item.commissionEnabled = true;
    if (!item.applicationMemo) item.applicationMemo = item.condition || '';
    delete item.visible;
  });
  return window.MOCK_TUITION_EXTRA_ITEMS;
}

function renderTuitionLocalFeeList() {
  const tbody = document.getElementById('tuition-localfee-list-body');
  if (!tbody) return;

  tbody.innerHTML = getTuitionLocalFeeItems().map((item, idx) => `
    <tr>
      <td style="font-weight:700;color:#111827">${item.name}</td>
      <td style="text-align:center"><span class="tsa-badge ${item.type === 'required' ? 'tsa-badge-danger' : 'tsa-badge-gray'}">${item.type === 'required' ? '필수' : '옵션'}</span></td>
      <td style="text-align:center"><span class="tsa-badge ${item.commissionEnabled ? 'tsa-badge-primary' : 'tsa-badge-gray'}">${item.commissionEnabled ? '있음' : '없음'}</span></td>
      <td style="text-align:right;font-weight:800">$${item.amount.toLocaleString()}</td>
      <td>${item.applicationMemo || '-'}</td>
      <td style="text-align:center">
        <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openTuitionExtraItemModal(${idx})">수정</button>
      </td>
    </tr>
  `).join('');
}

function openTuitionExtraItemModal(idx = null) {
  const isEdit = idx !== null && idx !== undefined;
  const items = getTuitionLocalFeeItems();
  const item = isEdit ? items[idx] : null;

  const title = document.getElementById('tuition-extra-item-modal-title');
  if (title) title.textContent = isEdit ? '기타 항목 수정' : '기타 항목 추가';

  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
  };

  setVal('tuition-extra-item-edit-index', isEdit ? idx : '');
  setVal('tuition-extra-item-name', item?.name || '');
  setVal('tuition-extra-item-amount', item?.amount || '');
  setVal('tuition-extra-item-type', item?.type || 'optional');
  setVal('tuition-extra-item-commission', item?.commissionEnabled === false ? 'none' : 'enabled');
  setVal('tuition-extra-item-application-memo', item?.applicationMemo || item?.condition || '');
  setVal('tuition-extra-item-memo', item?.memo || '');

  openModal('tuition-extra-item-modal');
  setTimeout(function() { if (typeof refreshIcons === 'function') refreshIcons(); }, 50);
}

function saveTuitionExtraItem() {
  const items = getTuitionLocalFeeItems();
  const editIdxRaw = document.getElementById('tuition-extra-item-edit-index')?.value || '';
  const name = document.getElementById('tuition-extra-item-name')?.value.trim() || '';
  const amount = parseInt(document.getElementById('tuition-extra-item-amount')?.value, 10) || 0;

  if (!name) {
    showToast('항목명을 입력해줘.', 'warning');
    return;
  }
  if (amount < 0) {
    showToast('금액은 0 이상으로 입력해줘.', 'warning');
    return;
  }

  const applicationMemo = document.getElementById('tuition-extra-item-application-memo')?.value.trim() || '';
  const nextItem = {
    name,
    amount,
    type: document.getElementById('tuition-extra-item-type')?.value === 'required' ? 'required' : 'optional',
    commissionEnabled: document.getElementById('tuition-extra-item-commission')?.value !== 'none',
    applicationMemo,
    condition: applicationMemo,
    memo: document.getElementById('tuition-extra-item-memo')?.value.trim() || '',
  };

  if (editIdxRaw !== '') {
    const idx = parseInt(editIdxRaw, 10);
    if (items[idx]) items[idx] = nextItem;
  } else {
    items.push(nextItem);
  }

  closeModal('tuition-extra-item-modal');
  renderTuitionLocalFeeList();
  showToast('기타 항목이 저장되었습니다.', 'success');
}
