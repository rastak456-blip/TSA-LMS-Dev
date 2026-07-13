/* =============================================
   TUITION CONFIG
   수강료 구성
   ============================================= */

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
    const policy = course.tuitionPolicy || {};
    const eightWeek = Number(policy.fee8 || Math.round(baseFee * 2));
    const twelveWeek = Number(policy.fee12 || Math.round(baseFee * 3));
    const sixteenWeek = Number(policy.fee16 || Math.round(baseFee * 4));
    const twentyWeek = Number(policy.fee20 || Math.round(baseFee * 5));
    const twentyFourWeek = Number(policy.fee24 || Math.round(baseFee * 6));
    const visible = course.active !== false;
    return `
      <tr>
        <td>
          <div style="font-weight:700;color:#111827">${course.name}</div>
          <div style="font-size:10.5px;color:#9CA3AF">커리큘럼 설정과 연결</div>
        </td>
        <td>4주</td>
        <td style="text-align:right;font-weight:800">$${baseFee.toLocaleString()}</td>
        <td style="text-align:right">$${eightWeek.toLocaleString()}</td>
        <td style="text-align:right">$${twelveWeek.toLocaleString()}</td>
        <td style="text-align:right">$${sixteenWeek.toLocaleString()}</td>
        <td style="text-align:right">$${twentyWeek.toLocaleString()}</td>
        <td style="text-align:right">$${twentyFourWeek.toLocaleString()}</td>
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
  const mode = document.getElementById('tuition-calc-mode')?.value || 'auto';
  const fee8 = mode === 'auto' ? base * 2 : (parseInt(document.getElementById('tuition-fee-8w')?.value, 10) || 0);
  const fee12 = mode === 'auto' ? base * 3 : (parseInt(document.getElementById('tuition-fee-12w')?.value, 10) || 0);
  const fee16 = mode === 'auto' ? base * 4 : (parseInt(document.getElementById('tuition-fee-16w')?.value, 10) || 0);
  const fee20 = mode === 'auto' ? base * 5 : (parseInt(document.getElementById('tuition-fee-20w')?.value, 10) || 0);
  const fee24 = mode === 'auto' ? base * 6 : (parseInt(document.getElementById('tuition-fee-24w')?.value, 10) || 0);

  const input8 = document.getElementById('tuition-fee-8w');
  const input12 = document.getElementById('tuition-fee-12w');
  const input16 = document.getElementById('tuition-fee-16w');
  const input20 = document.getElementById('tuition-fee-20w');
  const input24 = document.getElementById('tuition-fee-24w');
  [input8, input12, input16, input20, input24].forEach(input => {
    if (!input) return;
    input.disabled = mode === 'auto';
    input.style.background = mode === 'auto' ? '#F3F4F6' : '#fff';
  });
  if (mode === 'auto') {
    if (input8) input8.value = fee8;
    if (input12) input12.value = fee12;
    if (input16) input16.value = fee16;
    if (input20) input20.value = fee20;
    if (input24) input24.value = fee24;
  }

  const preview = document.getElementById('tuition-course-preview');
  if (preview) {
    const rows = [
      { label: '4주 수강료', value: base, active: true },
      { label: '8주', value: fee8 },
      { label: '12주', value: fee12 },
      { label: '16주', value: fee16 },
      { label: '20주', value: fee20 },
      { label: '24주', value: fee24 },
    ];
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
    calcMode: document.getElementById('tuition-calc-mode')?.value || 'auto',
    fee8: parseInt(document.getElementById('tuition-fee-8w')?.value, 10) || baseFee * 2,
    fee12: parseInt(document.getElementById('tuition-fee-12w')?.value, 10) || baseFee * 3,
    fee16: parseInt(document.getElementById('tuition-fee-16w')?.value, 10) || baseFee * 4,
    fee20: parseInt(document.getElementById('tuition-fee-20w')?.value, 10) || baseFee * 5,
    fee24: parseInt(document.getElementById('tuition-fee-24w')?.value, 10) || baseFee * 6,
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
    const policy = template.tuitionPolicy || {};
    const visible = template.active !== false;
    return `
      <tr>
        <td style="font-weight:700;color:#111827">${template.accomType || '-'}</td>
        <td>${capacityLabel}</td>
        <td>${template.condition || '-'}</td>
        <td>4주</td>
        <td style="text-align:right;font-weight:800">$${baseFee.toLocaleString()}</td>
        <td style="text-align:right">$${Number(policy.fee8 || Math.round(baseFee * 2)).toLocaleString()}</td>
        <td style="text-align:right">$${Number(policy.fee12 || Math.round(baseFee * 3)).toLocaleString()}</td>
        <td style="text-align:right">$${Number(policy.fee16 || Math.round(baseFee * 4)).toLocaleString()}</td>
        <td style="text-align:right">$${Number(policy.fee20 || Math.round(baseFee * 5)).toLocaleString()}</td>
        <td style="text-align:right">$${Number(policy.fee24 || Math.round(baseFee * 6)).toLocaleString()}</td>
        <td style="text-align:center">
          <span class="tsa-badge ${visible ? 'tsa-badge-success' : 'tsa-badge-gray'}" style="cursor:pointer" onclick="toggleTuitionDormVisibility(${idx})">${visible ? '노출' : '숨김'}</span>
        </td>
        <td style="text-align:center">
          <button class="tsa-btn tsa-btn-outline tsa-btn-xs" onclick="openTuitionDormModal(${idx})">수정</button>
        </td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="12" style="text-align:center;color:#9CA3AF;padding:24px">등록된 기숙사 요금표가 없습니다.</td></tr>`;
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
  const mode = document.getElementById('tuition-dorm-calc-mode')?.value || 'auto';
  const fee8 = mode === 'auto' ? base * 2 : (parseInt(document.getElementById('tuition-dorm-fee-8w')?.value, 10) || 0);
  const fee12 = mode === 'auto' ? base * 3 : (parseInt(document.getElementById('tuition-dorm-fee-12w')?.value, 10) || 0);
  const fee16 = mode === 'auto' ? base * 4 : (parseInt(document.getElementById('tuition-dorm-fee-16w')?.value, 10) || 0);
  const fee20 = mode === 'auto' ? base * 5 : (parseInt(document.getElementById('tuition-dorm-fee-20w')?.value, 10) || 0);
  const fee24 = mode === 'auto' ? base * 6 : (parseInt(document.getElementById('tuition-dorm-fee-24w')?.value, 10) || 0);

  const input8 = document.getElementById('tuition-dorm-fee-8w');
  const input12 = document.getElementById('tuition-dorm-fee-12w');
  const input16 = document.getElementById('tuition-dorm-fee-16w');
  const input20 = document.getElementById('tuition-dorm-fee-20w');
  const input24 = document.getElementById('tuition-dorm-fee-24w');
  [input8, input12, input16, input20, input24].forEach(input => {
    if (!input) return;
    input.disabled = mode === 'auto';
    input.style.background = mode === 'auto' ? '#F3F4F6' : '#fff';
  });
  if (mode === 'auto') {
    if (input8) input8.value = fee8;
    if (input12) input12.value = fee12;
    if (input16) input16.value = fee16;
    if (input20) input20.value = fee20;
    if (input24) input24.value = fee24;
  }

  const preview = document.getElementById('tuition-dorm-preview');
  if (preview) {
    const rows = [
      { label: '4주 요금', value: base, active: true },
      { label: '8주', value: fee8 },
      { label: '12주', value: fee12 },
      { label: '16주', value: fee16 },
      { label: '20주', value: fee20 },
      { label: '24주', value: fee24 },
    ];
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
      calcMode: document.getElementById('tuition-dorm-calc-mode')?.value || 'auto',
      fee8: parseInt(document.getElementById('tuition-dorm-fee-8w')?.value, 10) || baseFee * 2,
      fee12: parseInt(document.getElementById('tuition-dorm-fee-12w')?.value, 10) || baseFee * 3,
      fee16: parseInt(document.getElementById('tuition-dorm-fee-16w')?.value, 10) || baseFee * 4,
      fee20: parseInt(document.getElementById('tuition-dorm-fee-20w')?.value, 10) || baseFee * 5,
      fee24: parseInt(document.getElementById('tuition-dorm-fee-24w')?.value, 10) || baseFee * 6,
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
      { name: '등록금', amount: 100, condition: '전체 학생', visible: true, memo: '' },
      { name: 'SSP 발급비', amount: 120, condition: 'SSP 필요 국가', visible: true, memo: '' },
      { name: '비자 연장비 1차', amount: 80, condition: '30일 초과 체류', visible: true, memo: '' },
      { name: 'ACR I-Card', amount: 70, condition: '59일 초과 체류', visible: true, memo: '' },
      { name: '공항 픽업비', amount: 30, condition: '공항 픽업 신청 시', visible: false, memo: '' },
    ];
  }
  return window.MOCK_TUITION_EXTRA_ITEMS;
}

function renderTuitionLocalFeeList() {
  const tbody = document.getElementById('tuition-localfee-list-body');
  if (!tbody) return;

  tbody.innerHTML = getTuitionLocalFeeItems().map((item, idx) => `
    <tr>
      <td style="font-weight:700;color:#111827">${item.name}</td>
      <td style="text-align:right;font-weight:800">$${item.amount.toLocaleString()}</td>
      <td>${item.condition}</td>
      <td style="text-align:center"><span class="tsa-badge ${item.visible !== false ? 'tsa-badge-success' : 'tsa-badge-gray'}">${item.visible !== false ? '노출' : '숨김'}</span></td>
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
  setVal('tuition-extra-item-condition', item?.condition || '');
  setVal('tuition-extra-item-visible', item?.visible === false ? 'hidden' : 'visible');
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

  const nextItem = {
    name,
    amount,
    condition: document.getElementById('tuition-extra-item-condition')?.value.trim() || '전체 학생',
    visible: (document.getElementById('tuition-extra-item-visible')?.value || 'visible') === 'visible',
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
