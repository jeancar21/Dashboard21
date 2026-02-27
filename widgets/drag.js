/* ══════════════════════════════════════════════════════════
   DRAG & DROP — Pointer Events based (reliable on all layouts)
   Replaces HTML5 DnD API which has issues with CSS Grid
   ══════════════════════════════════════════════════════════ */

let _dragWidget = null;   // the widget being dragged
let _dragGhost = null;   // visual clone following the mouse
let _placeholder = null;   // empty slot in the grid
let _startMouseX = 0;
let _startMouseY = 0;
let _offsetX = 0;
let _offsetY = 0;
let _isDragging = false;

function initDragAndDrop() {
    restoreWidgetOrder();
    addDragHandles();

    // Watch for dynamically added widgets
    const grid = document.getElementById('dashboard-grid');
    if (grid) {
        const obs = new MutationObserver(() => addDragHandles());
        obs.observe(grid, { childList: true });
    }

    // Global mouse / touch move & up listeners
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onPointerUp);
}

function addDragHandles() {
    document.querySelectorAll('.widget:not(.widget-add):not([data-drag-ok])').forEach(widget => {
        widget.dataset.dragOk = '1';
        const header = widget.querySelector('.widget-header');
        if (!header || header.querySelector('.drag-handle')) return;

        const handle = document.createElement('div');
        handle.className = 'drag-handle';
        handle.title = 'Mantén para mover';
        handle.innerHTML = `
      <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor">
        <circle cx="3" cy="2"  r="1.5"/>
        <circle cx="9" cy="2"  r="1.5"/>
        <circle cx="3" cy="7"  r="1.5"/>
        <circle cx="9" cy="7"  r="1.5"/>
        <circle cx="3" cy="12" r="1.5"/>
        <circle cx="9" cy="12" r="1.5"/>
      </svg>`;

        handle.addEventListener('mousedown', onHandleMouseDown);
        handle.addEventListener('touchstart', onHandleTouchStart, { passive: false });
        header.insertBefore(handle, header.firstChild);
    });
}

/* ── Start drag ── */
function onHandleMouseDown(e) {
    e.preventDefault();
    startDrag(e.currentTarget.closest('.widget'), e.clientX, e.clientY);
}

function onHandleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    startDrag(e.currentTarget.closest('.widget'), touch.clientX, touch.clientY);
}

function startDrag(widget, mouseX, mouseY) {
    if (!widget) return;
    _dragWidget = widget;
    _isDragging = false;  // becomes true after first move

    const rect = widget.getBoundingClientRect();
    _offsetX = mouseX - rect.left;
    _offsetY = mouseY - rect.top;
    _startMouseX = mouseX;
    _startMouseY = mouseY;

    // Create placeholder matching widget size
    _placeholder = document.createElement('div');
    _placeholder.className = 'drag-placeholder';
    _placeholder.style.height = rect.height + 'px';
    _placeholder.style.minHeight = 'unset';

    // Create ghost (visual clone)
    _dragGhost = widget.cloneNode(true);
    _dragGhost.style.cssText = `
    position: fixed;
    left: ${rect.left}px;
    top: ${rect.top}px;
    width: ${rect.width}px;
    height: ${rect.height}px;
    z-index: 9999;
    opacity: 0.85;
    pointer-events: none;
    box-shadow: 0 24px 64px rgba(0,0,0,0.85), 0 0 0 2px rgba(168,85,247,0.5);
    border-radius: var(--radius-lg);
    transition: none;
    transform: scale(1.02);
  `;
    document.body.appendChild(_dragGhost);
    document.body.style.cursor = 'grabbing';
}

/* ── Move ── */
function onPointerMove(e) {
    if (!_dragWidget) return;
    moveGhost(e.clientX, e.clientY);
}
function onTouchMove(e) {
    if (!_dragWidget) return;
    e.preventDefault();
    const touch = e.touches[0];
    moveGhost(touch.clientX, touch.clientY);
}

function moveGhost(mouseX, mouseY) {
    if (!_isDragging) {
        // Require 5px movement before activating drag
        const dist = Math.hypot(mouseX - _startMouseX, mouseY - _startMouseY);
        if (dist < 5) return;
        _isDragging = true;
        // Insert placeholder where widget currently is
        _dragWidget.parentNode.insertBefore(_placeholder, _dragWidget);
        _dragWidget.style.display = 'none';
    }

    // Move ghost
    _dragGhost.style.left = (mouseX - _offsetX) + 'px';
    _dragGhost.style.top = (mouseY - _offsetY) + 'px';

    // Find which widget we're hovering over and move placeholder
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    const children = [...grid.children].filter(el => el !== _placeholder && el !== _dragWidget);
    let closest = null;
    let closestDist = Infinity;

    children.forEach(el => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dist = Math.hypot(mouseX - cx, mouseY - cy);
        if (dist < closestDist) {
            closestDist = dist;
            closest = el;
        }
    });

    if (closest) {
        const r = closest.getBoundingClientRect();
        const half = r.left + r.width / 2;
        if (mouseX < half) {
            grid.insertBefore(_placeholder, closest);
        } else {
            grid.insertBefore(_placeholder, closest.nextSibling);
        }
    }
}

/* ── End drag ── */
function onPointerUp() {
    if (!_dragWidget) return;

    if (_isDragging && _placeholder && _placeholder.parentNode) {
        // Place widget where placeholder is
        _placeholder.parentNode.insertBefore(_dragWidget, _placeholder);
        _dragWidget.style.display = '';
        _placeholder.remove();
        saveWidgetOrder();
    } else {
        // Was a click, not a drag
        _dragWidget.style.display = '';
        if (_placeholder && _placeholder.parentNode) _placeholder.remove();
    }

    // Cleanup ghost
    if (_dragGhost) { _dragGhost.remove(); _dragGhost = null; }
    document.body.style.cursor = '';
    _dragWidget = null;
    _placeholder = null;
    _isDragging = false;
}

/* ── Persistence ── */
function saveWidgetOrder() {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;
    const order = [...grid.querySelectorAll('.widget[id]')].map(w => w.id);
    localStorage.setItem('dashboard-widget-order', JSON.stringify(order));
}

function restoreWidgetOrder() {
    try {
        const saved = localStorage.getItem('dashboard-widget-order');
        if (!saved) return;
        const order = JSON.parse(saved);
        const grid = document.getElementById('dashboard-grid');
        if (!grid) return;
        const addCard = document.getElementById('widget-add');
        order.forEach(id => {
            const el = document.getElementById(id);
            if (el && el !== addCard) grid.insertBefore(el, addCard);
        });
    } catch (e) {
        console.warn('[Drag] restoreWidgetOrder:', e);
    }
}
