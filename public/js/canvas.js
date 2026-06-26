// =============================================
// プリバム — キャンバス ドラッグ&ドロップ
// =============================================

const CANVAS_W = 1400;
const CANVAS_H = 2000;
const ICON_W   = 90;
const DRAG_THRESHOLD = 6;   // ドラッグ判定の最小移動距離（px）
const SAVE_DELAY     = 400; // 位置保存のデバウンス（ms）

// グリッド初期配置用
const GRID_COLS    = 4;
const GRID_X_START = 40;
const GRID_Y_START = 140;
const GRID_X_GAP   = 300;
const GRID_Y_GAP   = 180;

// ランダムなステッカー回転（-7 〜 +7度）
function randomRotation() {
  return ((Math.random() - 0.5) * 14).toFixed(1);
}

// ステッカーカードのHTML生成
function createSticker(profile) {
  const div = document.createElement('div');
  div.className = 'icon-sticker';
  div.dataset.targetId = profile.user_id;
  div.dataset.rotation = randomRotation();
  div.style.transform = `rotate(${div.dataset.rotation}deg)`;

  const imgHtml = profile.icon_url
    ? `<img src="${profile.icon_url}" alt="${escapeHtml(profile.nickname)}" class="sticker-photo" loading="lazy">`
    : `<div class="sticker-photo sticker-photo--empty"><span>🌟</span></div>`;

  div.innerHTML = `
    <div class="sticker-inner">
      ${imgHtml}
      <div class="sticker-name">${escapeHtml(profile.nickname)}</div>
    </div>
    <div class="sticker-shadow"></div>
  `;

  return div;
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// ──────────────────────────────
// ドラッグ状態
// ──────────────────────────────
let dragging    = null;
let dragOffset  = { x: 0, y: 0 };
let dragMoved   = false;
let dragStart   = { x: 0, y: 0 };
let saveTimer   = null;

const canvas   = document.getElementById('canvas');
const viewport = document.getElementById('canvasViewport');
const emptyEl  = document.getElementById('canvasEmpty');

// ──────────────────────────────
// ドラッグ開始（マウス）
// ──────────────────────────────
function onMouseDown(e) {
  if (e.button !== 0) return;
  startDrag(e.currentTarget, e.clientX, e.clientY);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
  e.preventDefault();
}

function onMouseMove(e) {
  if (!dragging) return;
  moveDrag(e.clientX, e.clientY);
}

function onMouseUp(e) {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  endDrag();
}

// ──────────────────────────────
// ドラッグ開始（タッチ）
// ──────────────────────────────
function onTouchStart(e) {
  const touch = e.touches[0];
  startDrag(e.currentTarget, touch.clientX, touch.clientY);
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('touchend', onTouchEnd);
}

function onTouchMove(e) {
  if (!dragging) return;
  const touch = e.touches[0];
  const dx = Math.abs(touch.clientX - dragStart.x);
  const dy = Math.abs(touch.clientY - dragStart.y);
  if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
    dragMoved = true;
    e.preventDefault(); // スクロールを止める
  }
  if (dragMoved) moveDrag(touch.clientX, touch.clientY);
}

function onTouchEnd() {
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('touchend', onTouchEnd);
  endDrag();
}

// ──────────────────────────────
// 共通ロジック
// ──────────────────────────────
function startDrag(el, clientX, clientY) {
  dragging = el;
  dragMoved = false;
  dragStart = { x: clientX, y: clientY };

  const rect = el.getBoundingClientRect();
  dragOffset.x = clientX - rect.left;
  dragOffset.y = clientY - rect.top;

  el.classList.add('is-dragging');
  el.style.zIndex = 1000;
}

function moveDrag(clientX, clientY) {
  const dx = Math.abs(clientX - dragStart.x);
  const dy = Math.abs(clientY - dragStart.y);
  if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) dragMoved = true;
  if (!dragMoved) return;

  const canvasRect = canvas.getBoundingClientRect();

  let x = clientX - canvasRect.left - dragOffset.x;
  let y = clientY - canvasRect.top  - dragOffset.y;

  // キャンバス内に収める
  x = Math.max(0, Math.min(x, CANVAS_W - ICON_W));
  y = Math.max(0, Math.min(y, CANVAS_H - ICON_W));

  dragging.style.left = x + 'px';
  dragging.style.top  = y + 'px';
}

function endDrag() {
  if (!dragging) return;

  dragging.classList.remove('is-dragging');
  dragging.style.zIndex = '';

  if (!dragMoved) {
    // タップ → プロフへ遷移
    const targetId = dragging.dataset.targetId;
    window.location.href = `/profile/view/${targetId}`;
  } else {
    // ドラッグ終了 → 位置保存
    schedSave(dragging);
  }

  dragging = null;
}

// ──────────────────────────────
// 位置保存（デバウンス）
// ──────────────────────────────
function schedSave(el) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => savePosition(el), SAVE_DELAY);
}

async function savePosition(el) {
  const target_id = el.dataset.targetId;
  const x = parseInt(el.style.left, 10);
  const y = parseInt(el.style.top,  10);
  try {
    await fetch('/canvas/position', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_id, x, y }),
    });
  } catch (err) {
    console.error('位置保存失敗:', err);
  }
}

// ──────────────────────────────
// アイコン配置
// ──────────────────────────────
function placeSticker(el, profile, index) {
  let x = profile.x;
  let y = profile.y;

  // 未保存の場合はグリッド配置
  if (x == null || y == null) {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    x = GRID_X_START + col * GRID_X_GAP;
    y = GRID_Y_START + row * GRID_Y_GAP;
  }

  el.style.left = x + 'px';
  el.style.top  = y + 'px';
}

// ──────────────────────────────
// 初期ロード
// ──────────────────────────────
async function loadCanvas() {
  try {
    const res  = await fetch('/canvas/data');
    const list = await res.json();

    if (list.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }

    list.forEach((profile, i) => {
      const el = createSticker(profile);
      placeSticker(el, profile, i);
      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('touchstart', onTouchStart, { passive: true });
      canvas.appendChild(el);
    });

  } catch (err) {
    console.error('キャンバスロード失敗:', err);
  }
}

loadCanvas();
