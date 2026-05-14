const STORAGE_KEY = 'note-architect-v3';

const state = loadState();

bindTabs();
bindScenes();
bindCharacters();
bindWorldEntries();
bindTimeline();
bindDataTools();
renderAll();

function defaultState() {
  return { scenes: [], characters: [], worldEntries: [], timelineEvents: [] };
}
function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try { return { ...defaultState(), ...JSON.parse(raw) }; } catch { return defaultState(); }
}
function persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid() { return crypto.randomUUID(); }

function bindTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`tab-${button.dataset.tab}`).classList.add('active');
    });
  });
}

function bindScenes() {
  document.getElementById('save-scene').addEventListener('click', () => {
    const title = val('scene-title');
    const content = val('scene-content');
    if (!title || !content) return alert('シーンのタイトルと本文を入力してください。');
    state.scenes.unshift({ id: uid(), title, content, createdAt: new Date().toISOString() });
    persist(); clear(['scene-title', 'scene-content']); renderScenes();
  });
}
function bindCharacters() {
  document.getElementById('save-character').addEventListener('click', () => {
    const name = val('character-name');
    if (!name) return alert('キャラクター名を入力してください。');
    state.characters.unshift({ id: uid(), name, role: val('character-role'), note: val('character-note'), createdAt: new Date().toISOString() });
    persist(); clear(['character-name', 'character-role', 'character-note']); renderCharacters();
  });
}
function bindWorldEntries() {
  document.getElementById('save-world').addEventListener('click', () => {
    const name = val('world-name');
    if (!name) return alert('世界観エントリ名を入力してください。');
    state.worldEntries.unshift({ id: uid(), type: document.getElementById('world-type').value, name, description: val('world-description'), createdAt: new Date().toISOString() });
    persist(); clear(['world-name', 'world-description']); renderWorldEntries();
  });
}
function bindTimeline() {
  document.getElementById('save-timeline').addEventListener('click', () => {
    const eventAt = val('timeline-at'); const label = val('timeline-label');
    if (!eventAt || !label) return alert('時点とイベント名を入力してください。');
    state.timelineEvents.unshift({ id: uid(), eventAt, label, description: val('timeline-description'), createdAt: new Date().toISOString() });
    persist(); clear(['timeline-at', 'timeline-label', 'timeline-description']); renderTimeline();
  });
}

function bindDataTools() {
  document.getElementById('export-json').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `note-architect-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('import-json').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      Object.assign(state, defaultState(), data);
      persist();
      renderAll();
      alert('インポートしました。');
    } catch {
      alert('JSONの形式が不正です。');
    }
    event.target.value = '';
  });

  document.getElementById('clear-all').addEventListener('click', () => {
    if (!confirm('全データを削除します。よろしいですか？')) return;
    Object.assign(state, defaultState());
    persist();
    renderAll();
  });
}

function renderAll() { renderScenes(); renderCharacters(); renderWorldEntries(); renderTimeline(); }

function renderScenes() {
  const list = document.getElementById('scene-list');
  list.innerHTML = state.scenes.map((s) => `<li>${itemHeader(s.title, s.id, 'scene')}<div class="muted">${s.content.length}文字</div></li>`).join('');
  bindListActions('scene', state.scenes, renderScenes);
}
function renderCharacters() {
  const list = document.getElementById('character-list');
  list.innerHTML = state.characters.map((c) => `<li>${itemHeader(c.name, c.id, 'character')}<div>${escapeHtml(c.role || '役割未設定')}</div><div class="muted">${escapeHtml(c.note || '')}</div></li>`).join('');
  bindListActions('character', state.characters, renderCharacters);
}
function renderWorldEntries() {
  const list = document.getElementById('world-list');
  list.innerHTML = state.worldEntries.map((e) => `<li>${itemHeader(`[${e.type}] ${e.name}`, e.id, 'world')}<div class="muted">${escapeHtml(e.description || '')}</div></li>`).join('');
  bindListActions('world', state.worldEntries, renderWorldEntries);
}
function renderTimeline() {
  const list = document.getElementById('timeline-list');
  list.innerHTML = state.timelineEvents.map((e) => `<li>${itemHeader(`${e.eventAt} - ${e.label}`, e.id, 'timeline')}<div class="muted">${escapeHtml(e.description || '')}</div></li>`).join('');
  bindListActions('timeline', state.timelineEvents, renderTimeline);
}

function itemHeader(label, id, type) {
  return `<div class="item-header"><strong>${escapeHtml(label)}</strong><span><button data-action="edit" data-type="${type}" data-id="${id}">編集</button><button data-action="delete" data-type="${type}" data-id="${id}" class="danger-inline">削除</button></span></div>`;
}

function bindListActions(type, bucket, rerender) {
  document.querySelectorAll(`button[data-type="${type}"]`).forEach((btn) => {
    btn.onclick = () => {
      const target = bucket.find((x) => x.id === btn.dataset.id);
      if (!target) return;
      if (btn.dataset.action === 'delete') {
        const idx = bucket.findIndex((x) => x.id === target.id);
        if (idx >= 0) bucket.splice(idx, 1);
      } else if (btn.dataset.action === 'edit') {
        const next = prompt('編集内容を入力してください。', JSON.stringify(target, null, 2));
        if (!next) return;
        try {
          const parsed = JSON.parse(next);
          Object.assign(target, parsed);
        } catch {
          alert('JSON形式で編集してください。');
          return;
        }
      }
      persist(); rerender();
    };
  });
}

function val(id) { return document.getElementById(id).value.trim(); }
function clear(ids) { ids.forEach((id) => { document.getElementById(id).value = ''; }); }
function escapeHtml(value) { return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
