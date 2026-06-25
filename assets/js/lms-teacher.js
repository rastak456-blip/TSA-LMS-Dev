/* =============================================
   TEACHER MANAGEMENT
   ============================================= */
let _teacherTagFilter = '전체';

function setTeacherTagFilter(tag) {
  _teacherTagFilter = tag;
  document.querySelectorAll('.teacher-tag-filter-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tag === tag);
  });
  const filtered = MOCK_TEACHERS.filter(t => {
    if (_teacherTagFilter === '전체') return true;
    return (t.preferredCourses || []).includes(_teacherTagFilter);
  });
  renderTeacherList(filtered);
}

function renderTeacherTagFilters() {
  const wrap = document.getElementById('teacher-tag-filter-wrap');
  if (!wrap) return;
  const tags = ['전체', ...MOCK_ASSIGNMENT_TAGS.filter(t => t.visible).map(t => t.name)];
  wrap.innerHTML = tags.map(tag => `
    <button class="tsa-dorm-filter-chip teacher-tag-filter-btn ${tag === '전체' ? 'active' : ''}"
      data-tag="${tag}" onclick="setTeacherTagFilter('${tag}')">${tag}</button>
  `).join('');
}

function initTeacherList() {
  _teacherTagFilter = '전체';
  renderTeacherTagFilters();
  renderTeacherKPIs();
  renderTeacherList(MOCK_TEACHERS);
}

function previewTeacherPhoto(input, teacherId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('td-photo-preview');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover"/>`;
    const t = MOCK_TEACHERS.find(x => x.id === teacherId);
    if (t) t.photoUrl = e.target.result;
  };
  reader.readAsDataURL(file);
}

function saveTeacherDetailInline() {
  const t = APP.currentTeacher;
  if (!t) return;
  const getVal = (id, fallback) => { const el = document.getElementById(id); return el ? el.value.trim() : fallback; };
  // 어학원 운영 탭 항목만 저장
  const room     = getVal('td-room', t.room);
  const contract = getVal('td-contract', t.contract);
  const status   = getVal('td-status', t.status);
  const rating   = parseFloat(getVal('td-rating', t.rating)) || t.rating;
  const classTypes = [...document.querySelectorAll('input[name="td-classtype"]:checked')].map(cb => cb.value);

  t.room     = room;
  t.contract = contract;
  t.status   = status;
  t.rating   = rating;
  if (classTypes.length > 0) t.classTypes = classTypes;

  // 시간표 강의실 동기화
  const ttRow = MOCK_TIMETABLE.find(r => r.teacher === t.nick);
  if (ttRow) ttRow.room = room;

  // 헤더 갱신
  const nameEl = document.getElementById('modal-teacher-name');
  const metaEl = document.getElementById('modal-teacher-meta');
  if (nameEl) nameEl.textContent = `${t.nick} (${t.name})`;
  if (metaEl) metaEl.textContent = `${t.gender}성 · ${t.contract} · ${status==='active'?'재직':status==='leave'?'휴가':'퇴사'}`;
  showToast(`✓ ${t.nick} 강사 어학원 운영 정보가 저장되었습니다.`, 'success');
  renderTeacherList(MOCK_TEACHERS);
}

function renderTeacherKPIs() {
  const active = MOCK_TEACHERS.filter(t => t.status !== 'resigned');
  const withPreferred = active.filter(t => (t.preferredCourses||[]).length > 0);
  const withExcluded  = active.filter(t => (t.excludedCourses||[]).length > 0);
  const onLeave       = MOCK_TEACHERS.filter(t => t.status === 'leave');
  const setKpi = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setKpi('kpi-teacher-total',     MOCK_TEACHERS.filter(t=>t.status!=='resigned').length + '명');
  setKpi('kpi-teacher-preferred', withPreferred.length + '명');
  setKpi('kpi-teacher-excluded',  withExcluded.length + '명');
  setKpi('kpi-teacher-leave',     onLeave.length + '명');
}

function renderTeacherList(list) {
  const tbody = document.getElementById('teacher-list-body');
  if (!tbody) return;

  const typeColors = { 'IELTS 전문': '#5E5CE6', '일반 영어 (1:1)': '#0EA5E9', '그룹 수업': '#16A34A', '비즈니스 영어': '#7C3AED', '주니어 전담': '#D97706' };

  const sorted = [...list].sort((a, b) => b.id - a.id);
  const total = sorted.length;

  tbody.innerHTML = sorted.map((t, idx) => {
    const rowNum = total - idx;
    let statusLabel = '재직';
    let statusClass = 'tsa-badge-success';
    if (t.status === 'resigned') {
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
              <div style="font-size:11px;color:#6B7280">${t.joinDate ? '입사 ' + t.joinDate : '입사일 미등록'} · 평점 ⭐ ${t.rating}</div>
            </div>
          </div>
        </td>
        <td>
          ${(t.preferredCourses||[]).length > 0
            ? (t.preferredCourses||[]).map(tag=>`<span style="font-size:10px;padding:2px 7px;border-radius:8px;background:#D1FAE5;color:#065F46;font-weight:600;display:inline-block;margin:1px">${tag}</span>`).join('')
            : '<span style="font-size:11px;color:#D1D5DB">-</span>'}
        </td>
        <td>
          ${(t.excludedCourses||[]).length > 0
            ? (t.excludedCourses||[]).map(tag=>`<span style="font-size:10px;padding:2px 7px;border-radius:8px;background:#FEE2E2;color:#991B1B;font-weight:600;display:inline-block;margin:1px">${tag}</span>`).join('')
            : '<span style="font-size:11px;color:#D1D5DB">-</span>'}
        </td>
        <td>
          ${(t.classTypes||[]).map(ct => {
            const ctBg = ct==='1:1'?'#EEF2FF':ct==='1:4'?'#FEF3C7':'#D1FAE5';
            const ctColor = ct==='1:1'?'#3730A3':ct==='1:4'?'#92400E':'#065F46';
            return `<span style="font-size:11px;padding:2px 8px;border-radius:8px;font-weight:700;background:${ctBg};color:${ctColor};display:inline-block;margin:1px">${ct}</span>`;
          }).join('') || '<span style="font-size:11px;color:#D1D5DB">-</span>'}
        </td>
        <td style="font-size:12px;font-weight:500">Room ${t.room}</td>
        <td><span class="tsa-badge ${t.contract==='정규직'?'tsa-badge-primary':'tsa-badge-gray'}">${t.contract}</span></td>
        <td style="font-size:12px"><strong style="color:#374151">${t.todaySlots}</strong><span style="color:#9CA3AF">/8 교시</span></td>
        <td><span class="tsa-badge ${statusClass}">${statusLabel}</span></td>
        <td style="text-align:center">
          <div style="display:flex;gap:6px;justify-content:center">
            <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openTeacherDetail(${t.id})">
              <i data-lucide="eye" style="font-size:11px"></i> 상세
            </button>
            <button class="tsa-btn tsa-btn-outline tsa-btn-sm" onclick="openTeacherDetail(${t.id}, 'schedule')" style="border-color:#0EA5E9;color:#0EA5E9">
              <i data-lucide="calendar" style="font-size:11px"></i> 스케줄
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

function openTeacherScheduleModal(nick) {
  const teacher = MOCK_TEACHERS.find(t => t.nick === nick);
  const ttRow = MOCK_TIMETABLE.find(r => r.teacher === nick);
  if (!teacher) return;

  const PERIODS = [
    { p: 1, time: '08:00~09:00' }, { p: 2, time: '09:00~10:00' },
    { p: 3, time: '10:00~11:00' }, { p: 4, time: '11:00~12:00' },
    { p: 5, time: '13:00~14:00' }, { p: 6, time: '14:00~15:00' },
    { p: 7, time: '15:00~16:00' }, { p: 8, time: '16:00~17:00' },
  ];
  const DAYS = ['월', '화', '수', '목', '금'];
  const avail = teacher.availability || {};
  const color = ttRow ? ttRow.color : '#5E5CE6';
  const bg = ttRow ? ttRow.bg : '#EEF2FF';
  const slots = ttRow ? ttRow.slots : [];

  const avatarSrc = teacher.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png';

  // Header
  document.getElementById('ts-modal-teacher-name').textContent = `${teacher.name} (${teacher.nick})`;
  document.getElementById('ts-modal-teacher-type').textContent = `${teacher.type} · Room ${teacher.room} · 경력 ${teacher.exp}년 · ⭐ ${teacher.rating}`;
  document.getElementById('ts-modal-teacher-avatar').src = avatarSrc;

  // Weekly schedule grid
  const slotMap = {};
  slots.forEach(s => { slotMap[s.p] = s; });

  let rows = '';
  PERIODS.forEach(({ p, time }) => {
    const slot = slotMap[p] || { student: null };
    let cellHtml = '';
    if (slot.student) {
      const names = slot.students ? slot.students.join(', ') : slot.student;
      const tag = slot.type ? `<span style="font-size:10px;opacity:.75">${slot.type}</span>` : '';
      const subj = slot.subject ? `<div style="font-size:10px;margin-top:2px;opacity:.8">${slot.subject}${slot.level ? ' · ' + slot.level : ''}</div>` : '';
      cellHtml = `<td colspan="5" style="background:${bg};border-left:3px solid ${color};padding:7px 10px">
        <div style="font-weight:700;font-size:12px;color:${color}">${names} ${tag}</div>${subj}
      </td>`;
    } else {
      // Per-day availability
      cellHtml = DAYS.map(d => {
        const dayAvail = Array.isArray(avail[d]) ? avail[d][p - 1] : true;
        if (dayAvail) {
          return `<td style="text-align:center;color:#D1FAE5;font-size:18px">·</td>`;
        } else {
          return `<td style="text-align:center;background:#FEF2F2;color:#FCA5A5;font-size:11px">✕</td>`;
        }
      }).join('');
    }

    rows += `<tr>
      <td style="text-align:center;font-size:11px;color:#6B7280;white-space:nowrap;padding:6px 10px;border-right:1px solid #E5E7EB">
        <strong style="color:#374151">${p}교시</strong><br/><span style="font-size:10px">${time}</span>
      </td>
      ${cellHtml}
    </tr>`;
  });

  // Day availability summary
  let daySummary = DAYS.map(d => {
    const dayArr = Array.isArray(avail[d]) ? avail[d] : [];
    const count = dayArr.filter(Boolean).length;
    const active = count > 0;
    return `<div style="text-align:center;padding:6px 12px;border-radius:8px;background:${active ? bg : '#F3F4F6'};border:1.5px solid ${active ? color : '#E5E7EB'}">
      <div style="font-weight:700;color:${active ? color : '#9CA3AF'};font-size:13px">${d}</div>
      <div style="font-size:11px;color:${active ? '#374151' : '#9CA3AF'}">${count}교시</div>
    </div>`;
  }).join('');

  document.getElementById('ts-modal-day-summary').innerHTML = daySummary;
  document.getElementById('ts-modal-grid-body').innerHTML = rows;

  openModal('teacher-schedule-modal');
  if (window.lucide) lucide.createIcons();
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
   TEACHER REGISTER & EDIT FORM HANDLERS
   ============================================= */
function renderTeacherTagCheckboxes(preferredList, excludedList) {
  const tags = MOCK_ASSIGNMENT_TAGS.filter(t => t.visible).map(t => t.name);
  const prefWrap = document.getElementById('tf-preferred-tags');
  const exclWrap = document.getElementById('tf-excluded-tags');
  if (prefWrap) prefWrap.innerHTML = tags.map(tag => {
    const checked = (preferredList||[]).includes(tag) ? 'checked' : '';
    return `<label style="display:flex;align-items:center;gap:5px;cursor:pointer;padding:4px 10px;border-radius:8px;background:${checked?'#D1FAE5':'#F9FAFB'};border:1px solid ${checked?'#6EE7B7':'#E5E7EB'};font-size:12px">
      <input type="checkbox" name="tf-preferred" value="${tag}" ${checked} style="accent-color:#10B981" onchange="syncTeacherTagCheckbox('preferred','${tag}',this.checked)"/> ${tag}
    </label>`;
  }).join('');
  if (exclWrap) exclWrap.innerHTML = tags.map(tag => {
    const checked = (excludedList||[]).includes(tag) ? 'checked' : '';
    return `<label style="display:flex;align-items:center;gap:5px;cursor:pointer;padding:4px 10px;border-radius:8px;background:${checked?'#FEE2E2':'#F9FAFB'};border:1px solid ${checked?'#FCA5A5':'#E5E7EB'};font-size:12px">
      <input type="checkbox" name="tf-excluded" value="${tag}" ${checked} style="accent-color:#EF4444" onchange="syncTeacherTagCheckbox('excluded','${tag}',this.checked)"/> ${tag}
    </label>`;
  }).join('');
}

function syncTeacherTagCheckbox(type, tag, checked) {
  const name = type === 'preferred' ? 'tf-preferred' : 'tf-excluded';
  const otherName = type === 'preferred' ? 'tf-excluded' : 'tf-preferred';
  if (checked) {
    // 반대쪽에서 동일 태그 해제
    document.querySelectorAll(`input[name="${otherName}"][value="${tag}"]`).forEach(cb => { cb.checked = false; });
  }
  // 스타일 갱신
  document.querySelectorAll(`input[name="${name}"]`).forEach(cb => {
    const label = cb.parentElement;
    const isChecked = cb.checked;
    label.style.background = isChecked ? (type==='preferred'?'#D1FAE5':'#FEE2E2') : '#F9FAFB';
    label.style.borderColor = isChecked ? (type==='preferred'?'#6EE7B7':'#FCA5A5') : '#E5E7EB';
  });
}

function getCheckedTags(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(cb => cb.value);
}

function openTeacherRegisterModal() {
  // 폼 초기화
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('tf-id', '');
  setVal('tf-name', ''); setVal('tf-gender', ''); setVal('tf-gender-display', '');
  setVal('tf-birthday', ''); setVal('tf-email', ''); setVal('tf-phone', '');
  setVal('tf-joindate', ''); setVal('tf-jobgrade', ''); setVal('tf-talkstatus', '');
  setVal('tf-room', ''); setVal('tf-contract', '정규직');
  setVal('tf-status', 'active'); setVal('tf-rating', '');

  // 수업 유형 체크 해제
  document.querySelectorAll('input[name="tf-classtype"]').forEach(cb => { cb.checked = false; });

  // 톡스 미리보기 숨김, 수기 입력 폼 표시 (기본값)
  const preview = document.getElementById('tf-talk-preview');
  if (preview) preview.style.display = 'none';
  const manualForm = document.getElementById('tf-manual-form');
  if (manualForm) manualForm.style.display = 'block';

  // 사진 미리보기 초기화
  const manualPhoto = document.getElementById('tf-manual-photo-preview');
  if (manualPhoto) manualPhoto.innerHTML = `No<br>Image<br><span style="font-size:10px">클릭 첨부</span>`;
  const photoWrap = document.getElementById('tf-photo-preview');
  if (photoWrap) photoWrap.innerHTML = `<div style="font-size:11px;color:#9CA3AF;text-align:center;padding:8px">No<br>Image</div>`;

  // 수기 필드 초기화
  ['tf-name','tf-birthday','tf-email','tf-phone','tf-joindate'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  // 톡스 드롭다운 초기화 (기본값 = 선택 안 함)
  initTalkTeacherDropdown();

  openModal('teacher-form-modal');
}

function openTeacherEditModal(id) {
  const t = MOCK_TEACHERS.find(tch => tch.id === id);
  if (!t) return;

  document.getElementById('teacher-form-title').textContent = `🧑‍🏫 강사 정보 수정 - ${t.nick}`;
  document.getElementById('teacher-form-subtitle').textContent = "선택한 강사의 인사 카드 및 계약 조건을 편집합니다.";

  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
  setVal('tf-id', t.id); setVal('tf-name', t.name||''); setVal('tf-nick', t.nick||'');
  setVal('tf-gender', t.gender||'여'); setVal('tf-exp', t.exp||''); setVal('tf-room', t.room||'');
  setVal('tf-contract', t.contract||'정규직'); setVal('tf-status', t.status||'active');
  setVal('tf-available', String(t.available));

  renderTeacherTagCheckboxes(t.preferredCourses||[], t.excludedCourses||[]);
  document.querySelectorAll('input[name="tf-classtype"]').forEach(cb => {
    cb.checked = (t.classTypes||[]).includes(cb.value);
  });

  const matchingGroup = document.getElementById('tf-talk-matching-group');
  if (matchingGroup) matchingGroup.style.display = 'none';
  closeModal('teacher-detail-modal');
  openModal('teacher-form-modal');
}

function initTalkTeacherDropdown() {
  const select = document.getElementById('tf-talk-matching');
  if (!select) return;
  
  select.innerHTML = '<option value="">== 선택 안 함 (직접 수동 입력) ==</option>';
  MOCK_TALK_LMS_TEACHERS.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.name} (${t.nick}) - ${t.gender}성`;
    select.appendChild(opt);
  });
  select.value = "";
}

function previewTeacherPhotoManual(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const wrap = document.getElementById('tf-manual-photo-preview');
    if (wrap) wrap.innerHTML = `<img src="${e.target.result}" style="width:80px;height:96px;object-fit:cover"/>`;
  };
  reader.readAsDataURL(file);
}

function onTalkTeacherMatched(matchedId) {
  const preview    = document.getElementById('tf-talk-preview');
  const manualForm = document.getElementById('tf-manual-form');

  if (!matchedId) {
    // 선택 안 함 → 수기 입력 폼 표시
    if (preview) preview.style.display = 'none';
    if (manualForm) manualForm.style.display = 'block';
    // 필드 초기화
    ['tf-name','tf-birthday','tf-email','tf-phone','tf-joindate'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    return;
  }

  // 톡스 선택 → 수기 폼 숨김
  if (manualForm) manualForm.style.display = 'none';
  const teacher = MOCK_TALK_LMS_TEACHERS.find(t => t.id === matchedId)
    || MOCK_TEACHERS.find(t => String(t.id) === String(matchedId));
  if (!teacher) return;

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  // 미리보기 섹션 (tfp- 접두사)
  setVal('tfp-name',         teacher.name || '');
  setVal('tfp-gender-display', teacher.gender === '남' ? '남성' : '여성');
  setVal('tfp-birthday',     teacher.birthday || '-');
  setVal('tfp-email',        teacher.email || '-');
  setVal('tfp-phone',        teacher.phone || '-');
  setVal('tfp-joindate',     teacher.joinDate || '-');
  setVal('tfp-jobgrade',     teacher.jobGrade || '-');
  setVal('tfp-talkstatus',   teacher.talkStatus || 'Employed');
  // 저장용 히든 필드 (saveTeacherForm에서 사용)
  setVal('tf-name',      teacher.name || '');
  setVal('tf-gender',    teacher.gender || '여');
  setVal('tf-birthday',  teacher.birthday || '');
  setVal('tf-email',     teacher.email || '');
  setVal('tf-phone',     teacher.phone || '');
  setVal('tf-joindate',  teacher.joinDate || '');
  setVal('tf-jobgrade',  teacher.jobGrade || '');
  setVal('tf-talkstatus', teacher.talkStatus || 'Employed');
  setVal('tf-experience', teacher.experience || 'Now');

  // 사진 미리보기
  const photoWrap = document.getElementById('tf-photo-preview');
  if (photoWrap) {
    const src = teacher.photoUrl || (teacher.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png');
    photoWrap.innerHTML = `<img src="${src}" style="width:100%;height:100%;object-fit:cover"/>`;
  }

  if (preview) preview.style.display = 'block';
  showToast(`✓ [${teacher.name}] 정보가 연동되었습니다.`, 'success');
}

function saveTeacherForm() {
  const idVal    = document.getElementById('tf-id').value;
  const name     = (document.getElementById('tf-name')?.value || '').trim();
  const nick     = name.split(' ')[0] || name; // 첫 이름을 닉네임으로
  const gender   = document.getElementById('tf-gender')?.value || '여';
  const room       = (document.getElementById('tf-room')?.value || '').trim();
  const rating     = parseFloat(document.getElementById('tf-rating')?.value) || 4.5;
  const talkStatus = document.getElementById('tf-talkstatus')?.value || 'Employed';
  const experience = document.getElementById('tf-experience')?.value || 'Now';
  // 톡스 재직 상태 → 어학원 상태 자동 매핑
  const statusMap  = { 'Employed':'active', 'Resigning':'active', 'Training':'active', 'Resigned':'resigned', 'Dropout':'resigned' };
  const status     = statusMap[talkStatus] || 'active';
  const contract   = '정규직';
  const classTypes = [...document.querySelectorAll('input[name="tf-classtype"]:checked')].map(cb => cb.value);
  const email    = document.getElementById('tf-email')?.value || '';
  const phone    = document.getElementById('tf-phone')?.value || '';
  const birthday = document.getElementById('tf-birthday')?.value || '';
  const joinDate = document.getElementById('tf-joindate')?.value || '';
  const jobGrade = document.getElementById('tf-jobgrade')?.value || '';
  const available = status === 'active';

  if (!name) { showToast('토크스테이션에서 강사를 선택하세요.', 'danger'); return; }

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
      t.preferredCourses = preferredCourses;
      t.excludedCourses  = excludedCourses;
      t.classTypes       = classTypes;

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
      name, nick, gender, room, contract, available,
      type: '일반 영어 (1:1)',
      todaySlots: 0, rating, exp: 0, status,
      email, phone, birthday, joinDate, jobGrade, talkStatus, experience,
      preferredCourses: [], excludedCourses: [],
      classTypes,
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

function openTeacherDetail(id, activeTab = 'profile') {
  APP.currentTeacher = MOCK_TEACHERS.find(t => t.id === id);
  if (!APP.currentTeacher) return;
  const t = APP.currentTeacher;
  document.getElementById('modal-teacher-name').textContent = `${t.name} (${t.nick})`;
  document.getElementById('modal-teacher-meta').textContent = `${t.gender}성 · ${t.type} · ${t.contract}`;
  
  const tabNames = ['profile', 'availability', 'schedule', 'eval', 'tags'];
  const activeIndex = tabNames.indexOf(activeTab);

  // Activate basic tab
  document.querySelectorAll('#teacher-detail-modal .tsa-tab').forEach((tab, idx) => {
    tab.classList.toggle('active', idx === activeIndex);
  });

  switchTeacherTab(activeTab, null);
  openModal('teacher-detail-modal');
}

function switchCoursePricingTab(tab, el) {
  if (el) {
    el.parentNode.querySelectorAll('.tsa-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  document.querySelectorAll('.course-pricing-tab-content').forEach(c => c.style.display = 'none');
  if (tab === 'fees') {
    document.getElementById('course-pricing-tab-fees').style.display = 'block';
  } else if (tab === 'curriculum') {
    document.getElementById('course-pricing-tab-curriculum').style.display = 'block';
    renderCourseList();
  } else if (tab === 'master') {
    document.getElementById('course-pricing-tab-master').style.display = 'block';
    renderMasterSettings();
  }
}

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
  renderClassroomStatus();
}

function switchTeacherManageTab(tab, el) {
  if (el) {
    el.parentNode.querySelectorAll('.tsa-tab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
  }
  document.querySelectorAll('.teacher-manage-tab-content').forEach(c => c.style.display = 'none');
  if (tab === 'list') {
    document.getElementById('teacher-tab-list').style.display = 'block';
    initTeacherList();
  } else if (tab === 'tags') {
    document.getElementById('teacher-tab-tags').style.display = 'block';
    renderAssignmentTags();
  }
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
    case 'profile': {
      const ro = 'background:#F9FAFB;color:#6B7280;cursor:not-allowed;border-color:#E5E7EB';
      const tLbl = `<span style="font-size:10px;padding:1px 6px;border-radius:6px;background:#EEF2FF;color:#5E5CE6;font-weight:600;margin-left:4px">톡스</span>`;
      const photoSrc = t.photoUrl || (t.gender === '남' ? 'assets/images/teacher_male.png' : 'assets/images/teacher_female.png');
      container.innerHTML = `
        <div style="background:#EEF2FF;border:0.5px solid #C7D2FE;border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:12px;color:#3730A3;display:flex;align-items:center;gap:8px">
          🔗 <span>아래 항목은 <b>토크스테이션 LMS</b>에서 관리됩니다. 수정이 필요하면 토크스테이션에서 변경 후 다시 불러오세요.</span>
        </div>

        <div style="display:flex;gap:20px;align-items:start;margin-bottom:20px">
          <!-- 사진 -->
          <div style="flex-shrink:0;text-align:center">
            <div id="td-photo-preview" style="width:90px;height:110px;border-radius:10px;overflow:hidden;border:1px solid #E9EDF4;background:#F3F4F6;display:flex;align-items:center;justify-content:center;margin-bottom:6px">
              ${t.photoUrl
                ? `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover"/>`
                : `<div style="font-size:11px;color:#9CA3AF;text-align:center;padding:8px">No<br>Image</div>`}
            </div>
            <button onclick="document.getElementById('td-photo-file').click()" style="font-size:11px;padding:4px 10px;border:0.5px solid #D1D5DB;border-radius:6px;background:#fff;cursor:pointer;color:#374151">사진 첨부</button>
            <input id="td-photo-file" type="file" accept="image/*" style="display:none" onchange="previewTeacherPhoto(this,${t.id})"/>
          </div>

          <!-- 인적 정보 -->
          <div style="flex:1;display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="tsa-form-group"><label class="tsa-label">영문 성명 ${tLbl}</label><input class="tsa-input" value="${t.name||''}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label">성별 ${tLbl}</label><input class="tsa-input" value="${t.gender==='여'?'여성':'남성'}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label">생년월일 ${tLbl}</label><input class="tsa-input" value="${t.birthday||'-'}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label">입사일 ${tLbl}</label><input class="tsa-input" value="${t.joinDate||'-'}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label">이메일 ${tLbl}</label><input class="tsa-input" value="${t.email||'-'}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label">전화번호 ${tLbl}</label><input class="tsa-input" value="${t.phone||'-'}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label">직급 ${tLbl}</label><input class="tsa-input" value="${t.jobGrade||'-'}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label">톡스 재직 상태 ${tLbl}</label><input class="tsa-input" value="${t.talkStatus||'Employed'}" style="${ro}" readonly/></div>
          </div>
        </div>

        <!-- 프로필 콘텐츠 -->
        <div style="border-top:1px solid #E5E7EB;padding-top:14px;display:flex;flex-direction:column;gap:10px">
          <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:4px">프로필 콘텐츠 ${tLbl}</div>
          <div class="tsa-form-group"><label class="tsa-label" style="font-size:11px">인사말</label><textarea class="tsa-input" rows="2" style="${ro};resize:none" readonly>${t.greeting||''}</textarea></div>
          <div class="tsa-form-group"><label class="tsa-label" style="font-size:11px">소개</label><textarea class="tsa-input" rows="2" style="${ro};resize:none" readonly>${t.intro||''}</textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <div class="tsa-form-group"><label class="tsa-label" style="font-size:11px">학력</label><input class="tsa-input" value="${t.education||''}" style="${ro}" readonly/></div>
            <div class="tsa-form-group"><label class="tsa-label" style="font-size:11px">취미 / 특기</label><input class="tsa-input" value="${t.hobby||''}" style="${ro}" readonly/></div>
          </div>
        </div>
      `;
      break;
    }

    case 'school': {
      const ctColors = {'1:1':['#EEF2FF','#3730A3'], '1:4':['#FEF3C7','#92400E'], '1:8':['#D1FAE5','#065F46']};
      container.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:16px;padding:4px 0">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div class="tsa-form-group"><label class="tsa-label">담당 강의실</label><input id="td-room" class="tsa-input" value="${t.room||''}"/></div>
            <div class="tsa-form-group"><label class="tsa-label">어학원 평점</label>
              <input id="td-rating" class="tsa-input" type="number" step="0.1" min="0" max="5" value="${t.rating||''}"/>
            </div>
          </div>
          <div style="background:#F8F9FF;border:0.5px solid #C7D2FE;border-radius:8px;padding:10px 14px;font-size:12px;color:#3730A3;margin-top:8px">
            🔗 재직 상태: <strong>${t.talkStatus||'Employed'}</strong> (톡스 기준) &nbsp;·&nbsp; 어학원 상태: <strong>${t.status==='active'?'재직':t.status==='leave'?'휴가':'퇴사'}</strong>
          </div>
          <div>
            <label class="tsa-label" style="margin-bottom:8px;display:block">수업 가능 유형</label>
            <div style="display:flex;gap:10px">
              ${['1:1','1:4','1:8'].map(ct => {
                const [bg,c] = ctColors[ct];
                const chk = (t.classTypes||[]).includes(ct) ? 'checked' : '';
                return `<label style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:6px 14px;border-radius:8px;border:0.5px solid ${c}30;background:${bg};font-size:13px;font-weight:600;color:${c}">
                  <input type="checkbox" name="td-classtype" value="${ct}" ${chk} style="accent-color:${c}"/> ${ct} 수업
                </label>`;
              }).join('')}
            </div>
          </div>
        </div>
      `;
      break;
    }

    case 'schedule':
    case 'availability':
      renderTeacherAvailabilityTab();
      break;

    case 'schedule':
      const ttRow = MOCK_TIMETABLE.find(r => r.teacher === t.nick);
      const PERIODS = [
        { p: 1, time: '08:00~09:00' }, { p: 2, time: '09:00~10:00' },
        { p: 3, time: '10:00~11:00' }, { p: 4, time: '11:00~12:00' },
        { p: 5, time: '13:00~14:00' }, { p: 6, time: '14:00~15:00' },
        { p: 7, time: '15:00~16:00' }, { p: 8, time: '16:00~17:00' },
      ];
      const DAYS = ['월', '화', '수', '목', '금'];
      const avail = t.availability || {};
      const color = ttRow ? ttRow.color : '#5E5CE6';
      const bg = ttRow ? ttRow.bg : '#EEF2FF';
      const slots = ttRow ? ttRow.slots : [];

      const slotMap = {};
      slots.forEach(s => {
        slotMap[`${s.day}-${s.p}`] = s;
      });

      let gridRows = '';
      PERIODS.forEach(({ p, time }) => {
        let cellHtml = DAYS.map(d => {
          const slot = slotMap[`${d}-${p}`] || { student: null };
          if (slot.student) {
            const names = slot.students ? slot.students.join(', ') : slot.student;
            const tag = slot.type ? `<span style="font-size:10px;opacity:.75;display:block;margin-top:2px">${slot.type}</span>` : '';
            const subj = slot.subject ? `<div style="font-size:10px;margin-top:2px;opacity:.8;line-height:1.2">${slot.subject}</div>` : '';
            return `<td style="background:${bg};border-left:3px solid ${color};padding:6px 8px;text-align:left;vertical-align:top">
              <div style="font-weight:700;font-size:12px;color:${color}">${names}</div>
              ${tag}${subj}
            </td>`;
          } else {
            const dayAvail = Array.isArray(avail[d]) ? avail[d][p - 1] : true;
            if (dayAvail) {
              return `<td style="text-align:center;color:#10B981;font-size:18px;font-weight:bold;vertical-align:middle">·</td>`;
            } else {
              return `<td style="text-align:center;background:#FEF2F2;color:#FCA5A5;font-size:11px;vertical-align:middle">✕</td>`;
            }
          }
        }).join('');

        gridRows += `<tr>
          <td style="text-align:center;font-size:11px;color:#6B7280;white-space:nowrap;padding:6px 8px;border-right:1px solid #E5E7EB;vertical-align:middle">
            <strong style="color:#374151">${p}교시</strong><br/><span style="font-size:9.5px">${time}</span>
          </td>
          ${cellHtml}
        </tr>`;
      });

      container.innerHTML = `
        <div style="padding:10px 12px;background:#EEF2FF;border-radius:8px;margin-bottom:12px;font-size:11.5px;color:#4F46E5">
          <strong>조회 전용:</strong> 실제 배정 및 변경은 "시간표 및 수업 배정" 메뉴에서 진행해 주십시오.
        </div>
        <div style="overflow-x:auto">
          <table class="tsa-table" style="font-size:11.5px;width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#F3F4F6">
                <th style="padding:6px 8px;text-align:center;color:#6B7280;font-weight:600;border-right:1px solid #E5E7EB;width:90px">교시 / 시간</th>
                ${DAYS.map(d => `<th style="padding:6px 8px;text-align:center;color:#374151;font-weight:700">${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${gridRows}
            </tbody>
          </table>
        </div>
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

    case 'tags':
      const masterTags = (typeof MOCK_ASSIGNMENT_TAGS !== 'undefined') ? MOCK_ASSIGNMENT_TAGS.filter(tag => tag.visible) : [];
      
      const preferredHtml = masterTags.map(tag => {
        const checked = (t.preferredCourses || []).includes(tag.name) ? 'checked' : '';
        const disabled = (t.prohibitedCourses || []).includes(tag.name) ? 'disabled' : '';
        return `
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;padding:6px 10px;background:#F8F9FC;border:1px solid #E9EDF4;border-radius:8px">
            <input type="checkbox" name="pref-tag" value="${tag.name}" ${checked} ${disabled} onchange="handleTeacherTagCheckChange()"/>
            <span>${tag.name}</span>
          </label>
        `;
      }).join('');

      const excludedHtml = masterTags.map(tag => {
        const checked = (t.prohibitedCourses || []).includes(tag.name) ? 'checked' : '';
        const disabled = (t.preferredCourses || []).includes(tag.name) ? 'disabled' : '';
        return `
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;padding:6px 10px;background:#F8F9FC;border:1px solid #E9EDF4;border-radius:8px">
            <input type="checkbox" name="excl-tag" value="${tag.name}" ${checked} ${disabled} onchange="handleTeacherTagCheckChange()"/>
            <span>${tag.name}</span>
          </label>
        `;
      }).join('');

      container.innerHTML = `
        <div style="font-size:12.5px;font-weight:700;color:#374151;margin-bottom:12px">🏷️ 강사 역량 태그 및 배정 제약 설정</div>
        
        <div style="margin-bottom:16px">
          <div style="font-size:11.5px;font-weight:700;color:#1E3A8A;margin-bottom:8px">⭐ 장점 과정 설정 (우선 배정 태그, 다중 선택 가능)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px" id="pref-tag-container">
            ${preferredHtml || '<div style="font-size:11px;color:#9CA3AF">등록된 노출 배정 태그가 없습니다. [배정 태그 설정 관리]에서 추가해 주십시오.</div>'}
          </div>
        </div>

        <div style="margin-bottom:16px">
          <div style="font-size:11.5px;font-weight:700;color:#DC2626;margin-bottom:8px">❌ 제외 과정 설정 (배정 금지 태그, 다중 선택 가능)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px" id="excl-tag-container">
            ${excludedHtml || '<div style="font-size:11px;color:#9CA3AF">등록된 노출 배정 태그가 없습니다.</div>'}
          </div>
        </div>

        <div class="tsa-divider" style="margin:16px 0"></div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <div class="tsa-form-group">
            <label class="tsa-label">수업 가용 타입</label>
            <select id="tag-class-type" class="tsa-input">
              <option value="both" ${t.classType === 'both' ? 'selected' : ''}>1:1 및 그룹 수업 모두 가능</option>
              <option value="1on1" ${t.classType === '1on1' ? 'selected' : ''}>1:1 수업만 가능</option>
              <option value="group" ${t.classType === 'group' ? 'selected' : ''}>그룹 수업만 가능</option>
            </select>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">담당 강의실</label>
            <input id="tag-room" type="text" class="tsa-input" value="${t.assignedRoom || t.room || ''}" placeholder="A-101"/>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">근무 시작 시간</label>
            <input id="tag-work-start" type="time" class="tsa-input" value="${t.workHours ? t.workHours.start : '08:00'}"/>
          </div>
          <div class="tsa-form-group">
            <label class="tsa-label">근무 종료 시간</label>
            <input id="tag-work-end" type="time" class="tsa-input" value="${t.workHours ? t.workHours.end : '17:00'}"/>
          </div>
        </div>
        <div style="margin-top:16px;display:flex;justify-content:flex-end">
          <button class="tsa-btn tsa-btn-primary" onclick="saveTeacherTags(${t.id})">
            <i data-lucide="check"></i> 역량 태그 및 배정 제약 저장
          </button>
        </div>
      `;
      if (typeof refreshIcons === 'function') refreshIcons();
      break;
  }
}

function getAvailState(t, d, p) {
  // 3단계: 'open'(가용) / 'gray'(화상수업) / 'black'(블랙타임)
  if (t.availState && t.availState[d] && t.availState[d][p-1] !== undefined) {
    return t.availState[d][p-1];
  }
  // 기존 boolean availability에서 마이그레이션
  if (t.availability) {
    const val = t.availability[d] ? t.availability[d][p-1] : (Array.isArray(t.availability) ? t.availability[p-1] : true);
    return val ? 'open' : 'black';
  }
  return 'open';
}

function cycleAvailState(teacherId, d, p) {
  const t = MOCK_TEACHERS.find(x => x.id === teacherId);
  if (!t) return;
  if (!t.availState) {
    t.availState = {};
    ['월','화','수','목','금','토','일'].forEach(day => {
      t.availState[day] = [1,2,3,4,5,6,7,8].map(period => getAvailState(t, day, period));
    });
  }
  if (!t.availState[d]) t.availState[d] = Array(8).fill('open');
  const cur = t.availState[d][p-1];
  const next = cur === 'open' ? 'gray' : cur === 'gray' ? 'black' : 'open';
  t.availState[d][p-1] = next;

  const cell = document.getElementById(`avail-${d}-p-${p}`);
  if (cell) {
    const stateStyles = {
      open:  { bg:'#EEF2FF', color:'#5E5CE6', border:'#C7D2FE', text:'가용' },
      gray:  { bg:'#FEF3C7', color:'#B45309', border:'#FDE68A', text:'화상' },
      black: { bg:'#F3F4F6', color:'#6B7280', border:'#D1D5DB', text:'차단' }
    };
    const s = stateStyles[next];
    cell.style.background = s.bg;
    cell.style.color = s.color;
    cell.style.borderColor = s.border;
    cell.textContent = s.text;
  }
}

function renderTeacherAvailabilityTab() {
  const t = APP.currentTeacher;
  const container = document.getElementById('teacher-modal-tab-content');
  if (!t) return;

  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const stateStyles = {
    open:  { bg:'#EEF2FF', color:'#5E5CE6', border:'#C7D2FE', text:'가용' },
    gray:  { bg:'#FEF3C7', color:'#B45309', border:'#FDE68A', text:'화상' },
    black: { bg:'#F3F4F6', color:'#6B7280', border:'#D1D5DB', text:'차단' }
  };

  container.innerHTML = `
    <div style="display:flex;gap:16px;align-items:center;margin-bottom:14px;flex-wrap:wrap">
      <div style="font-size:12px;color:#6B7280">셀을 클릭하면 상태가 순환됩니다.</div>
      <div style="display:flex;gap:8px;font-size:11px">
        <span style="padding:2px 10px;border-radius:8px;background:#EEF2FF;color:#5E5CE6;border:1px solid #C7D2FE;font-weight:600">가용 — 배정 가능</span>
        <span style="padding:2px 10px;border-radius:8px;background:#FEF3C7;color:#B45309;border:1px solid #FDE68A;font-weight:600">화상 — 화상 수업</span>
        <span style="padding:2px 10px;border-radius:8px;background:#F3F4F6;color:#6B7280;border:1px solid #D1D5DB;font-weight:600">차단 — 블랙타임</span>
      </div>
    </div>
    <div style="overflow-x:auto">
      <table class="tsa-table" style="font-size:11px;text-align:center">
        <thead>
          <tr>
            <th style="text-align:left">교시</th>
            ${days.map(d => `<th style="text-align:center;min-width:60px">${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${[1,2,3,4,5,6,7,8].map(p => `
            <tr>
              <td style="font-weight:700;text-align:left;white-space:nowrap">${p}교시</td>
              ${days.map(d => {
                const state = getAvailState(t, d, p);
                const s = stateStyles[state];
                return `<td style="text-align:center;vertical-align:middle;padding:4px">
                  <div id="avail-${d}-p-${p}"
                    onclick="cycleAvailState(${t.id},'${d}',${p})"
                    style="cursor:pointer;padding:5px 8px;border-radius:6px;border:1px solid ${s.border};background:${s.bg};color:${s.color};font-size:11px;font-weight:600;user-select:none;min-width:40px">
                    ${s.text}
                  </div>
                </td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="margin-top:14px;display:flex;justify-content:flex-end">
      <button class="tsa-btn tsa-btn-primary tsa-btn-sm" onclick="saveTeacherAvailability(${t.id})">
        <i data-lucide="check"></i> 가용성 저장
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

