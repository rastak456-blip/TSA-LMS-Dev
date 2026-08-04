/* =============================================
   [lms_v0.3.html 전용] 주간 수업 편성 / 주간 현황 복원
   ---------------------------------------------
   이 파일은 archive/lms_v0.3.html 에서만 사용한다.
   현재 운영 중인 lms.html의 assets/js/lms-classroom.js는
   그룹·1:1 배정 기반 아키텍처(PRD v3.0)로 넘어가면서
   구버전의 "주간 수업 편성" 그리드 기능(switchClassScheduleTab,
   renderCsAssignGrid, renderCsWeekView 등)을 더 이상 포함하지 않는다.
   MOCK_CLASS_SESSIONS, CS_PERIODS, CS_TYPE_COLOR, _csCurrentWeek,
   _csCurrentDay 등은 lms-classroom.js가 이미 선언해두고 있으므로
   여기서는 새로 만들지 않고 그대로 재사용한다.
   ============================================= */

let _csAssignTypeFilter = '전체';

function csWeekLabel(w) {
  const d = new Date(w);
  const end = new Date(d); end.setDate(d.getDate() + 4);
  const fmt = x => `${x.getMonth() + 1}/${x.getDate()}`;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 (${fmt(d)} ~ ${fmt(end)})`;
}

function initClassSchedule() {
  _csCurrentWeek = '2026-06-22';
  _csCurrentDay = '월';
  switchClassScheduleTab('rooms');
}

function switchClassScheduleTab(tab) {
  ['rooms', 'assign', 'view'].forEach(t => {
    const panel = document.getElementById('cs-panel-' + t);
    if (panel) panel.style.display = t === tab ? '' : 'none';
    const btn = document.getElementById('cs-tab-' + t);
    if (btn) {
      btn.style.color = t === tab ? '#5E5CE6' : '#6B7280';
      btn.style.borderBottomColor = t === tab ? '#5E5CE6' : 'transparent';
    }
  });
  if (tab === 'rooms') renderCsRooms();
  if (tab === 'assign') renderCsAssignGrid();
  if (tab === 'view') renderCsWeekView();
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function shiftCsWeek(delta) {
  const d = new Date(_csCurrentWeek);
  d.setDate(d.getDate() + delta * 7);
  _csCurrentWeek = d.toISOString().slice(0, 10);
  ['cs-week-label', 'cs-week-label-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = csWeekLabel(_csCurrentWeek);
  });
  const assignPanel = document.getElementById('cs-panel-assign');
  const viewPanel = document.getElementById('cs-panel-view');
  if (assignPanel && assignPanel.style.display !== 'none') renderCsAssignGrid();
  if (viewPanel && viewPanel.style.display !== 'none') renderCsWeekView();
}

function selectCsDay(day, btn) {
  _csCurrentDay = day;
  document.querySelectorAll('.cs-day-btn').forEach(b => b.classList.remove('cs-day-active'));
  if (btn) btn.classList.add('cs-day-active');
  renderCsAssignGrid();
}

function setCsAssignTypeFilter(type, btn) {
  _csAssignTypeFilter = type;
  if (btn && btn.parentNode) {
    btn.parentNode.querySelectorAll('button').forEach(b => { b.className = 'tsa-btn tsa-btn-xs tsa-btn-outline'; });
    btn.className = 'tsa-btn tsa-btn-xs tsa-btn-primary';
  }
  renderCsAssignGrid();
}

function renderCsAssignGrid() {
  const label = document.getElementById('cs-week-label');
  if (label) label.textContent = csWeekLabel(_csCurrentWeek);
  const grid = document.getElementById('cs-assign-grid');
  if (!grid) return;

  let activeRooms = MOCK_CLASS_ROOMS.filter(r => r.roomNo);
  if (_csAssignTypeFilter !== '전체') {
    activeRooms = activeRooms.filter(r => r.type === _csAssignTypeFilter);
  }

  if (activeRooms.length === 0) {
    grid.innerHTML = '<div style="color:#9CA3AF;font-size:13px;padding:20px;text-align:center">해당 유형의 강의실이 없어.</div>';
    return;
  }
  const typeStyle = t => { const [bg, c] = (CS_TYPE_COLOR[t] || '#F3F4F6|#6B7280').split('|'); return `background:${bg};color:${c}`; };

  grid.innerHTML = activeRooms.map(room => {
    const teacher = MOCK_TEACHERS.find(t => t.nick === room.teacherNick);
    const avatarBg = teacher ? '#EEF2FF' : '#F3F4F6';
    const avatarColor = teacher ? '#5E5CE6' : '#9CA3AF';
    const sessions = MOCK_CLASS_SESSIONS.filter(s => s.roomId === room.id && s.day === _csCurrentDay && s.weekOf === _csCurrentWeek);

    const periodMap = {};
    sessions.forEach(s => s.periods.forEach(p => { periodMap[p] = s; }));

    const slots = Object.keys(CS_PERIODS).map(p => {
      const period = parseInt(p, 10);
      const session = periodMap[period];
      if (session) {
        const students = session.studentIds.map(sid => {
          const st = MOCK_STUDENTS.find(x => x.id === sid);
          return st ? `<span class="cs-chip">${st.nick}</span>` : '';
        }).join('');
        const emptySlots = room.capacity - session.studentIds.length;
        const emptyChips = emptySlots > 0 ? `<span class="cs-chip-empty">+${emptySlots} 자리</span>` : '';
        return `<div class="cs-slot cs-slot-occ">
          <div class="cs-slot-p">${period}교시</div>
          <div style="flex:1;display:flex;flex-wrap:wrap;gap:3px">${students}${emptyChips}</div>
          <button onclick="openCsAssignModal(${room.id},${period})" style="font-size:10px;padding:2px 6px;border:none;background:#C7D2FE;color:#3730A3;border-radius:4px;cursor:pointer">+추가</button>
          <button onclick="removeCsSession(${session.id})" style="font-size:10px;padding:2px 6px;border:none;background:#FEE2E2;color:#991B1B;border-radius:4px;cursor:pointer">해제</button>
        </div>`;
      }
      return `<div class="cs-slot">
        <div class="cs-slot-p">${period}교시</div>
        <button class="cs-slot-add" onclick="openCsAssignModal(${room.id},${period})">+ 배정하기</button>
      </div>`;
    }).join('');

    return `<div class="cs-room-card">
      <div class="cs-room-card-header">
        <div>
          <span style="font-size:13px;font-weight:700;color:#111827">${room.roomNo}</span>
          <span style="font-size:11px;padding:2px 8px;border-radius:8px;margin-left:6px;${typeStyle(room.type)}">${room.type}</span>
        </div>
        <button onclick="openCsBulkAssignModal(${room.id})" style="font-size:11px;padding:4px 10px;border:0.5px solid #5E5CE6;border-radius:6px;background:#EEF2FF;color:#5E5CE6;cursor:pointer;white-space:nowrap">일괄 배정</button>
      </div>
      <div style="padding:8px 14px;border-bottom:0.5px solid #E5E7EB;display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <div style="width:22px;height:22px;border-radius:50%;background:${avatarBg};color:${avatarColor};font-size:10px;font-weight:600;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${teacher ? teacher.nick.charAt(0) : '?'}
        </div>
        <div style="font-size:12px;color:#374151;font-weight:600">${teacher ? teacher.nick : '강사 미배정'}</div>
        ${teacher && (teacher.preferredCourses || []).length > 0
          ? (teacher.preferredCourses || []).map(tag => `<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#D1FAE5;color:#065F46;font-weight:600">${tag}</span>`).join('')
          : ''}
      </div>
      <div style="padding:10px 14px">${slots}</div>
    </div>`;
  }).join('');
  if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
}

function csStudentPickerHtml(room) {
  const eligible = MOCK_STUDENTS.filter(s => s.remittanceStatus === 'paid' && (s.status === 'current' || s.status === 'waiting'));
  if (!eligible.length) return '<div style="color:#9CA3AF;font-size:12px">배정 가능한 학생이 없어.</div>';
  return eligible.map(s => `<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border:0.5px solid #E5E7EB;border-radius:8px;cursor:pointer">
      <input type="${room.capacity === 1 ? 'radio' : 'checkbox'}" name="cs-student" value="${s.id}" style="accent-color:#5E5CE6"/>
      <div style="flex:1">
        <div style="font-size:12.5px;font-weight:600">${s.nick} <span style="font-size:11px;color:#6B7280">${s.name}</span></div>
        <div style="font-size:11px;color:#9CA3AF">${s.flag || ''} ${s.nationality} · ${s.course}</div>
      </div>
    </label>`).join('');
}

function openCsBulkAssignModal(roomId) {
  const room = MOCK_CLASS_ROOMS.find(r => r.id === roomId);
  if (!room) return;
  _csAssignTarget = { roomId, period: null };
  document.getElementById('cs-assign-modal-title').textContent = `${room.roomNo} · 일괄 배정`;
  document.getElementById('cs-assign-info').innerHTML = `<b>${room.roomNo}</b> &nbsp;|&nbsp; ${room.type} · 최대 ${room.capacity}명 &nbsp;<span style="color:#6B7280;font-size:12px">교시를 복수 선택해 한 번에 배정해</span>`;

  const sessions = MOCK_CLASS_SESSIONS.filter(s => s.roomId === roomId && s.day === _csCurrentDay && s.weekOf === _csCurrentWeek);
  const occupiedPeriods = new Set(sessions.flatMap(s => s.periods));
  const pWrap = document.getElementById('cs-period-checkboxes');
  pWrap.innerHTML = Object.keys(CS_PERIODS).map(p => {
    const isOccupied = occupiedPeriods.has(parseInt(p, 10));
    return `<label style="display:flex;align-items:center;gap:4px;cursor:${isOccupied ? 'not-allowed' : 'pointer'};padding:4px 10px;border-radius:6px;border:0.5px solid ${isOccupied ? '#E5E7EB' : '#C7D2FE'};font-size:12px;background:${isOccupied ? '#F3F4F6' : '#fff'};opacity:${isOccupied ? '0.5' : '1'}">
      <input type="checkbox" name="cs-period" value="${p}" ${isOccupied ? 'disabled' : ''} style="accent-color:#5E5CE6"/> ${p}교시
      ${isOccupied ? '<span style="font-size:10px;color:#9CA3AF">배정됨</span>' : ''}
    </label>`;
  }).join('');

  document.getElementById('cs-student-list').innerHTML = csStudentPickerHtml(room);
  document.getElementById('cs-assign-modal').style.display = 'block';
  document.getElementById('cs-assign-backdrop').style.display = 'block';
}

function openCsAssignModal(roomId, period) {
  const room = MOCK_CLASS_ROOMS.find(r => r.id === roomId);
  if (!room) return;
  _csAssignTarget = { roomId, period };
  document.getElementById('cs-assign-modal-title').textContent = `${room.roomNo} · ${period}교시 배정`;
  document.getElementById('cs-assign-info').innerHTML = `<b>${room.roomNo}</b> · ${period}교시 (${CS_PERIODS[period]}) &nbsp;|&nbsp; ${room.type} · 최대 ${room.capacity}명`;

  const pWrap = document.getElementById('cs-period-checkboxes');
  pWrap.innerHTML = Object.keys(CS_PERIODS).map(p => {
    const checked = parseInt(p, 10) === period ? 'checked' : '';
    return `<label style="display:flex;align-items:center;gap:4px;cursor:pointer;padding:4px 10px;border-radius:6px;border:0.5px solid #E5E7EB;font-size:12px">
      <input type="checkbox" name="cs-period" value="${p}" ${checked} style="accent-color:#5E5CE6"/> ${p}교시
    </label>`;
  }).join('');

  document.getElementById('cs-student-list').innerHTML = csStudentPickerHtml(room);
  document.getElementById('cs-assign-modal').style.display = 'block';
  document.getElementById('cs-assign-backdrop').style.display = 'block';
}

function closeCsAssignModal() {
  document.getElementById('cs-assign-modal').style.display = 'none';
  document.getElementById('cs-assign-backdrop').style.display = 'none';
  _csAssignTarget = null;
}

function confirmCsAssign() {
  if (!_csAssignTarget) return;
  const { roomId } = _csAssignTarget;
  const room = MOCK_CLASS_ROOMS.find(r => r.id === roomId);
  const selectedPeriods = [...document.querySelectorAll('input[name="cs-period"]:checked')].map(cb => parseInt(cb.value, 10));
  const selectedStudents = [...document.querySelectorAll('input[name="cs-student"]:checked')].map(cb => parseInt(cb.value, 10));
  if (selectedPeriods.length === 0) { showToast('교시를 선택해줘.', 'warning'); return; }
  if (selectedStudents.length === 0) { showToast('학생을 선택해줘.', 'warning'); return; }
  if (selectedStudents.length > room.capacity) { showToast(`정원 초과야. 최대 ${room.capacity}명.`, 'danger'); return; }

  for (const sid of selectedStudents) {
    for (const p of selectedPeriods) {
      const conflict = MOCK_CLASS_SESSIONS.find(s => s.day === _csCurrentDay && s.weekOf === _csCurrentWeek && s.periods.includes(p) && s.studentIds.includes(sid) && s.roomId !== roomId);
      if (conflict) {
        const st = MOCK_STUDENTS.find(x => x.id === sid);
        showToast(`⚠ ${st?.nick} 학생이 ${p}교시에 이미 다른 수업에 배정되어 있어.`, 'danger');
        return;
      }
    }
  }

  MOCK_CLASS_SESSIONS.push({
    id: _csSessionNextId++, roomId,
    day: _csCurrentDay, periods: selectedPeriods,
    studentIds: selectedStudents,
    course: document.getElementById('cs-assign-course').value,
    level: document.getElementById('cs-assign-level').value,
    weekOf: _csCurrentWeek
  });
  showToast('✓ 수업을 배정했어.', 'success');
  closeCsAssignModal();
  renderCsAssignGrid();
}

function removeCsSession(id) {
  if (!confirm('이 수업 배정을 해제할까?')) return;
  MOCK_CLASS_SESSIONS = MOCK_CLASS_SESSIONS.filter(s => s.id !== id);
  showToast('배정을 해제했어.', 'success');
  renderCsAssignGrid();
}

function setCsViewMode(mode, btn) {
  _csViewMode = mode;
  _csFilterSelect = 'all';
  _csFilterSearch = '';
  document.querySelectorAll('#cs-panel-view .tsa-btn').forEach(b => { b.className = 'tsa-btn tsa-btn-xs tsa-btn-outline'; });
  if (btn) btn.className = 'tsa-btn tsa-btn-xs tsa-btn-primary';
  renderCsWeekView();
}

function renderCsWeekView() {
  const el2 = document.getElementById('cs-week-label-2');
  if (el2) el2.textContent = csWeekLabel(_csCurrentWeek);

  const filterBar = document.getElementById('cs-view-filter-bar');
  if (filterBar) {
    let selectHtml = '';
    let label = '';

    if (_csViewMode === 'room') {
      label = '강의실 필터';
      const rooms = MOCK_CLASS_ROOMS.filter(r => r.roomNo);
      selectHtml = `<select class="tsa-input" style="width:160px;height:32px;font-size:12px;padding:4px 8px;border-radius:6px" onchange="_csFilterSelect=this.value; renderCsWeekView();">
        <option value="all" ${_csFilterSelect === 'all' ? 'selected' : ''}>전체 강의실</option>
        ${rooms.map(r => `<option value="${r.id}" ${_csFilterSelect == r.id ? 'selected' : ''}>${r.roomNo} (${r.type})</option>`).join('')}
      </select>`;
    } else if (_csViewMode === 'teacher') {
      label = '강사 필터';
      const teachers = MOCK_TEACHERS.filter(t => t.status !== 'resigned');
      selectHtml = `<select class="tsa-input" style="width:160px;height:32px;font-size:12px;padding:4px 8px;border-radius:6px" onchange="_csFilterSelect=this.value; renderCsWeekView();">
        <option value="all" ${_csFilterSelect === 'all' ? 'selected' : ''}>전체 강사</option>
        ${teachers.map(t => `<option value="${t.nick}" ${_csFilterSelect === t.nick ? 'selected' : ''}>${t.nick} (${t.name})</option>`).join('')}
      </select>`;
    } else if (_csViewMode === 'student') {
      label = '학생 필터';
      const students = MOCK_STUDENTS.filter(s => s.status === 'current' || s.status === 'waiting');
      selectHtml = `<select class="tsa-input" style="width:160px;height:32px;font-size:12px;padding:4px 8px;border-radius:6px" onchange="_csFilterSelect=this.value; renderCsWeekView();">
        <option value="all" ${_csFilterSelect === 'all' ? 'selected' : ''}>전체 학생</option>
        ${students.map(s => `<option value="${s.id}" ${_csFilterSelect == s.id ? 'selected' : ''}>${s.nick} (${s.name})</option>`).join('')}
      </select>`;
    }

    const placeholderText = _csViewMode === 'room' ? '강의실/학생 검색...' : (_csViewMode === 'teacher' ? '강사/학생/강의실 검색...' : '학생/강사/강의실 검색...');

    filterBar.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#F8F9FC;padding:8px 12px;border-radius:8px;border:1px solid #E5E7EB">
        <span style="font-size:12px;font-weight:700;color:#4B5563;display:flex;align-items:center;gap:4px">
          <i data-lucide="filter" style="width:14px;height:14px;color:#5E5CE6"></i> ${label}
        </span>
        ${selectHtml}
        <span style="color:#D1D5DB">|</span>
        <div style="position:relative;display:flex;align-items:center">
          <i data-lucide="search" style="position:absolute;left:8px;width:12px;height:12px;color:#9CA3AF"></i>
          <input type="text" placeholder="${placeholderText}" class="tsa-input" value="${_csFilterSearch}" oninput="_csFilterSearch=this.value.trim(); renderCsWeekView();" style="width:200px;height:32px;font-size:12px;padding:4px 8px;padding-left:26px;padding-right:24px;border-radius:6px" />
          ${_csFilterSearch ? `<button onclick="_csFilterSearch=''; renderCsWeekView();" style="position:absolute;right:8px;background:none;border:none;color:#9CA3AF;cursor:pointer;font-size:12px">✕</button>` : ''}
        </div>
        ${(_csFilterSelect !== 'all' || _csFilterSearch) ? `
          <button onclick="_csFilterSelect='all'; _csFilterSearch=''; renderCsWeekView();" class="tsa-btn tsa-btn-xs" style="background:#F3F4F6;color:#4B5563;border:1px solid #D1D5DB;height:32px;padding:0 10px;display:flex;align-items:center;gap:4px;border-radius:6px">
            <i data-lucide="rotate-ccw" style="width:12px;height:12px"></i> 필터 초기화
          </button>
        ` : ''}
      </div>
    `;
    if (typeof refreshIcons === 'function') setTimeout(refreshIcons, 50);
  }

  const wrap = document.getElementById('cs-view-table-wrap');
  if (!wrap) return;
  const days = ['월', '화', '수', '목', '금'];
  const periods = Object.keys(CS_PERIODS);

  const typeStyle = t => { const [bg, c] = (CS_TYPE_COLOR[t] || '#F3F4F6|#6B7280').split('|'); return `background:${bg};color:${c}`; };

  let html = `<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">
    <thead><tr style="background:#F9FAFB">
      <th style="padding:8px 12px;text-align:left;border-bottom:0.5px solid #E5E7EB;color:#6B7280;font-weight:600;white-space:nowrap;width:100px">교시</th>
      ${days.map(d => `<th style="padding:8px 12px;text-align:center;border-bottom:0.5px solid #E5E7EB;color:#6B7280;font-weight:600">${d}요일</th>`).join('')}
    </tr></thead><tbody>`;

  periods.forEach(p => {
    html += `<tr style="border-bottom:0.5px solid #F3F4F6">
      <td style="padding:8px 12px;color:#4B5563;white-space:nowrap;font-size:11.5px;border-right:1px solid #E5E7EB;vertical-align:middle;text-align:center">
        <strong style="color:#111827">${p}교시</strong><br><span style="font-size:9.5px;color:#9CA3AF">${CS_PERIODS[p]}</span>
      </td>`;
    days.forEach(day => {
      let sessions = MOCK_CLASS_SESSIONS.filter(s => s.weekOf === _csCurrentWeek && s.day === day && s.periods.includes(parseInt(p, 10)));

      if (_csViewMode === 'room') {
        if (_csFilterSelect !== 'all') sessions = sessions.filter(s => s.roomId == _csFilterSelect);
        if (_csFilterSearch) {
          sessions = sessions.filter(s => {
            const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
            const roomMatch = room?.roomNo && room.roomNo.toLowerCase().includes(_csFilterSearch.toLowerCase());
            const studentMatch = s.studentIds.some(id => {
              const st = MOCK_STUDENTS.find(x => x.id === id);
              return st && (st.nick.toLowerCase().includes(_csFilterSearch.toLowerCase()) || st.name.toLowerCase().includes(_csFilterSearch.toLowerCase()));
            });
            return roomMatch || studentMatch;
          });
        }
      } else if (_csViewMode === 'teacher') {
        if (_csFilterSelect !== 'all') {
          sessions = sessions.filter(s => {
            const r = MOCK_CLASS_ROOMS.find(x => x.id === s.roomId);
            return r?.teacherNick === _csFilterSelect;
          });
        }
        if (_csFilterSearch) {
          sessions = sessions.filter(s => {
            const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
            const roomMatch = room?.roomNo && room.roomNo.toLowerCase().includes(_csFilterSearch.toLowerCase());
            const teacherMatch = room?.teacherNick && (
              room.teacherNick.toLowerCase().includes(_csFilterSearch.toLowerCase()) ||
              (MOCK_TEACHERS.find(t => t.nick === room.teacherNick)?.name || '').toLowerCase().includes(_csFilterSearch.toLowerCase())
            );
            const studentMatch = s.studentIds.some(id => {
              const st = MOCK_STUDENTS.find(x => x.id === id);
              return st && (st.nick.toLowerCase().includes(_csFilterSearch.toLowerCase()) || st.name.toLowerCase().includes(_csFilterSearch.toLowerCase()));
            });
            return roomMatch || teacherMatch || studentMatch;
          });
        }
      } else if (_csViewMode === 'student') {
        if (_csFilterSelect !== 'all') sessions = sessions.filter(s => s.studentIds.includes(parseInt(_csFilterSelect, 10)));
        if (_csFilterSearch) {
          sessions = sessions.filter(s => {
            const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
            const roomMatch = room?.roomNo && room.roomNo.toLowerCase().includes(_csFilterSearch.toLowerCase());
            const teacherMatch = room?.teacherNick && (
              room.teacherNick.toLowerCase().includes(_csFilterSearch.toLowerCase()) ||
              (MOCK_TEACHERS.find(t => t.nick === room.teacherNick)?.name || '').toLowerCase().includes(_csFilterSearch.toLowerCase())
            );
            const studentMatch = s.studentIds.some(id => {
              const st = MOCK_STUDENTS.find(x => x.id === id);
              return st && (st.nick.toLowerCase().includes(_csFilterSearch.toLowerCase()) || st.name.toLowerCase().includes(_csFilterSearch.toLowerCase()));
            });
            return roomMatch || teacherMatch || studentMatch;
          });
        }
      }

      if (sessions.length === 0) {
        html += `<td style="padding:12px 8px;text-align:center;color:#D1D5DB;font-size:11px">-</td>`;
      } else {
        html += `<td style="padding:6px 8px;vertical-align:top">`;
        sessions.forEach(s => {
          const room = MOCK_CLASS_ROOMS.find(r => r.id === s.roomId);
          const teacherName = room?.teacherNick ? `${room.teacherNick} (강사)` : '강사 미배정';
          const names = s.studentIds.map(id => MOCK_STUDENTS.find(x => x.id === id)?.nick || '').filter(Boolean).join(', ');

          html += `<div style="border-radius:6px;padding:6px 8px;margin-bottom:4px;border-left:3px solid ${room?.type === '1:1' ? '#5E5CE6' : (room?.type === '1:4' ? '#B45309' : '#065F46')}; ${typeStyle(room?.type || '1:1')}">
            <div style="display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:11px">
              <span>${room?.roomNo || '-'} (${room?.type || ''})</span>
              <span style="font-size:9.5px;font-weight:normal;opacity:0.8">${teacherName}</span>
            </div>
            <div style="font-size:10.5px;font-weight:600;margin-top:2px">${names}</div>
            <div style="font-size:9px;opacity:0.75;margin-top:1px">${s.course || ''} [${s.level || ''}]</div>
          </div>`;
        });
        html += `</td>`;
      }
    });
    html += `</tr>`;
  });

  html += `</tbody></table></div>`;
  wrap.innerHTML = html;
}
