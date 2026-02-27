/* ══════════════════════════════════════════════════════════
   PERSONAL DASHBOARD — MAIN APP ORCHESTRATOR
   ══════════════════════════════════════════════════════════ */

// ── Auto-refresh intervals (ms) ──
const REFRESH_INTERVALS = {
    crypto: 30_000,  // 30s
    p2p: 45_000,  // 45s
    exchange: 300_000, // 5min
    weather: 600_000, // 10min
    news: 300_000, // 5min
    global: 60_000,  // 1min
    sports: 1_800_000, // 30min
};

// ── Available widgets catalog (for Add Widget modal) ──
const WIDGET_CATALOG = [
    {
        id: 'fear-greed',
        name: 'Fear & Greed',
        desc: 'Índice de miedo/codicia del mercado',
        icon: '😱',
        available: true,
        fetch: fetchFearGreed,
        html: getFearGreedHTML,
    },
    {
        id: 'gas-tracker',
        name: 'Gas Ethereum',
        desc: 'Precios de gas en tiempo real',
        icon: '⛽',
        available: true,
        fetch: fetchGasTracker,
        html: getGasTrackerHTML,
    },
    {
        id: 'portfolio-note',
        name: 'Notas Rápidas',
        desc: 'Bloc de notas personal',
        icon: '📝',
        available: true,
        fetch: null,
        html: getNotesHTML,
    },
    {
        id: 'binance-api',
        name: 'Mi Cuenta Binance',
        desc: 'Balance y trades (requiere API key)',
        icon: '🔐',
        available: false,
        note: 'Próximamente — Requiere API Key',
    },
    {
        id: 'twitter-feed',
        name: 'Twitter Crypto',
        desc: 'Tweets de influencers crypto',
        icon: '🐦',
        available: false,
        note: 'Próximamente',
    },
    {
        id: 'stocks',
        name: 'Bolsa de Valores',
        desc: 'Cotizaciones (CAT, Tech, Alzas/Bajas)',
        icon: '📈',
        available: true,
        fetch: fetchStocks,
        html: getStocksHTML,
    },
    {
        id: 'finance-search',
        name: 'Explorador Financiero',
        desc: 'Buscador de acciones y gráficos (Google Finance Style)',
        icon: '🔍',
        available: true,
        fetch: fetchFinanceSearch,
        html: getFinanceSearchHTML,
    },
];

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
    // Force stocks widget to show if it was accidentally removed
    let rm = JSON.parse(localStorage.getItem('removed-widgets') || '[]');
    if (rm.includes('widget-stocks')) {
        rm = rm.filter(id => id !== 'widget-stocks');
        localStorage.setItem('removed-widgets', JSON.stringify(rm));
    }

    initClock();
    setupRefreshButton();
    await loadAllWidgets();
    hideRemovedWidgets();
    injectCloseButtons();
    setupAutoRefresh();
    updateLastRefreshTime();
    initDragAndDrop();
});

async function loadAllWidgets() {
    await Promise.allSettled([
        fetchWeather(),
        fetchCryptoPrices(),
        fetchAllP2P(),
        fetchExchangeRates(),
        fetchCryptoNews(),
        fetchGlobalMarket(),
        fetchAllSports(),
        fetchStocks(),
        fetchFinanceSearch(),
    ]);
    updateLastRefreshTime();
}

function updateLastRefreshTime() {
    const el = document.getElementById('last-update-text');
    if (el) el.textContent = `Actualizado: ${new Date().toLocaleTimeString('es-ES')}`;
}

function setupAutoRefresh() {
    setInterval(() => fetchCryptoPrices(), REFRESH_INTERVALS.crypto);
    setInterval(() => fetchAllP2P(), REFRESH_INTERVALS.p2p);
    setInterval(() => fetchExchangeRates(), REFRESH_INTERVALS.exchange);
    setInterval(() => fetchWeather(), REFRESH_INTERVALS.weather);
    setInterval(() => fetchCryptoNews(), REFRESH_INTERVALS.news);
    setInterval(() => fetchGlobalMarket(), REFRESH_INTERVALS.global);
    setInterval(() => fetchAllSports(), REFRESH_INTERVALS.sports);
    setInterval(() => fetchStocks(), 3_600_000); // TradingView updates itself, we only re-init every hour
}

function setupRefreshButton() {
    const btn = document.getElementById('btn-refresh');
    if (!btn) return;
    btn.addEventListener('click', async () => {
        btn.classList.add('spinning');
        btn.disabled = true;

        // Animate all widgets
        document.querySelectorAll('.widget').forEach(w => w.classList.add('refreshing'));
        setTimeout(() => document.querySelectorAll('.widget').forEach(w => w.classList.remove('refreshing')), 600);

        await loadAllWidgets();

        btn.classList.remove('spinning');
        btn.disabled = false;
    });
}

/* ════════════════════════════
   ADD WIDGET MODAL
   ════════════════════════════ */
function showAddWidgetModal() {
    const overlay = document.getElementById('modal-overlay');
    const grid = document.getElementById('available-widgets-grid');
    if (!overlay || !grid) return;

    grid.innerHTML = WIDGET_CATALOG.map(w => `
    <button
      class="modal-widget-btn ${!w.available ? 'disabled' : ''}"
      onclick="${w.available ? `addWidget('${w.id}')` : 'void(0)'}"
      ${!w.available ? 'disabled' : ''}
    >
      <span class="mwb-icon">${w.icon}</span>
      <span class="mwb-info">
        <span class="mwb-name">${w.name}</span>
        <span class="mwb-desc">${w.note || w.desc}</span>
      </span>
    </button>
  `).join('');

    overlay.classList.add('visible');
}

function hideAddWidgetModal() {
    document.getElementById('modal-overlay')?.classList.remove('visible');
}

function addWidget(widgetId) {
    const catalog = WIDGET_CATALOG.find(w => w.id === widgetId);
    if (!catalog || !catalog.available) return;
    if (document.getElementById(`widget-${widgetId}`)) {
        hideAddWidgetModal();
        document.getElementById(`widget-${widgetId}`)?.scrollIntoView({ behavior: 'smooth' });
        return;
    }

    const grid = document.getElementById('dashboard-grid');
    const addCard = document.getElementById('widget-add');
    const widgetEl = document.createElement('div');
    widgetEl.className = 'widget';
    widgetEl.id = `widget-${widgetId}`;
    widgetEl.innerHTML = catalog.html ? catalog.html() : `<div class="widget-error"><div class="widget-error-msg">Widget no disponible</div></div>`;
    widgetEl.style.animationDelay = '0s';

    grid.insertBefore(widgetEl, addCard);
    injectCloseButtons(); // Ensure new widget gets a close button
    hideAddWidgetModal();

    if (catalog.fetch) catalog.fetch();
}

function injectCloseButtons() {
    document.querySelectorAll('.widget:not(.widget-add)').forEach(widget => {
        const header = widget.querySelector('.widget-header');
        if (header && !header.querySelector('.btn-close-widget')) {
            const btn = document.createElement('button');
            btn.className = 'btn-close-widget';
            btn.innerHTML = '✕';
            btn.title = 'Eliminar widget';
            btn.onclick = (e) => {
                e.stopPropagation();
                removeWidget(widget.id || widget.getAttribute('data-widget'));
            };
            header.appendChild(btn);
        }
    });
}

function removeWidget(id) {
    if (!id) return;
    const el = document.getElementById(id) || document.querySelector(`[data-widget="${id}"]`);
    if (!el) return;

    if (confirm('¿Estás seguro de que deseas eliminar este widget?')) {
        el.style.transform = 'scale(0.8)';
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.display = 'none';
            // Save to removed widgets list
            const removed = JSON.parse(localStorage.getItem('removed-widgets') || '[]');
            if (!removed.includes(id)) {
                removed.push(id);
                localStorage.setItem('removed-widgets', JSON.stringify(removed));
            }
        }, 300);
    }
}

function hideRemovedWidgets() {
    const removed = JSON.parse(localStorage.getItem('removed-widgets') || '[]');
    removed.forEach(id => {
        const el = document.getElementById(id) || document.querySelector(`[data-widget="${id}"]`);
        if (el) el.style.display = 'none';
    });
}

/* ════════════════════════════
   EXTRA WIDGETS (Add-able)
   ════════════════════════════ */

// ── Fear & Greed Index ──
function getFearGreedHTML() {
    return `
    <div class="widget-header">
      <span class="widget-icon">😱</span>
      <span class="widget-title">Fear & Greed Index</span>
      <span class="widget-badge" id="fg-badge">alternative.me</span>
    </div>
    <div id="fear-greed-content">
      <div class="loading-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div></div>
    </div>`;
}

async function fetchFearGreed() {
    try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const item = data.data?.[0];
        if (!item) throw new Error('No data');
        renderFearGreed(item);
    } catch (err) {
        console.error('[FearGreed]', err);
        const el = document.getElementById('fear-greed-content');
        if (el) el.innerHTML = `<div class="widget-error"><div class="widget-error-msg">Error al cargar índice</div><div class="widget-error-retry" onclick="fetchFearGreed()">Reintentar</div></div>`;
    }
}

function renderFearGreed(item) {
    const el = document.getElementById('fear-greed-content');
    if (!el) return;
    const value = parseInt(item.value);
    const label = item.value_classification;
    const colorMap = {
        'Extreme Fear': '#ef4444', 'Fear': '#f97316',
        'Neutral': '#eab308', 'Greed': '#22c55e', 'Extreme Greed': '#10b981',
    };
    const color = colorMap[label] || '#a0a0a0';
    const angle = (value / 100) * 180;

    el.innerHTML = `
    <div style="text-align:center; padding: 8px 0;">
      <div style="font-size: 56px; font-weight: 800; color: ${color}; font-family: var(--font-mono); line-height:1;">${value}</div>
      <div style="font-size: 16px; font-weight: 600; color: ${color}; margin-top: 6px;">${label}</div>
      <div style="margin-top: 14px; height: 8px; background: linear-gradient(90deg, #ef4444, #f97316, #eab308, #22c55e); border-radius: 4px; position:relative;">
        <div style="position:absolute; top:-4px; left:calc(${value}% - 8px); width:16px; height:16px; background:white; border-radius:50%; border: 2px solid ${color}; box-shadow: 0 0 8px ${color};"></div>
      </div>
      <div style="display:flex; justify-content:space-between; font-size:10px; color:var(--text-muted); margin-top:4px;">
        <span>Miedo</span><span>Codicia</span>
      </div>
    </div>`;
    document.getElementById('fg-badge').textContent = 'Live';
}

// ── Gas Tracker ──
function getGasTrackerHTML() {
    return `
    <div class="widget-header">
      <span class="widget-icon">⛽</span>
      <span class="widget-title">Gas Ethereum</span>
      <span class="widget-badge" id="gas-badge">Etherscan</span>
    </div>
    <div id="gas-content">
      <div class="loading-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div></div>
    </div>`;
}

async function fetchGasTracker() {
    // Use blocknative gas prices API (free, no key for basic)
    try {
        const res = await fetch('https://api.blocknative.com/gasprices/blockprices', {
            headers: { 'Authorization': '' }
        });
        const data = await res.json();
        const bp = data.blockPrices?.[0]?.estimatedPrices;
        if (!bp) throw new Error('no data');

        const fast = Math.round(bp.find(p => p.confidence === 99)?.maxFeePerGas || 0);
        const normal = Math.round(bp.find(p => p.confidence === 70)?.maxFeePerGas || 0);
        const slow = Math.round(bp.find(p => p.confidence === 40)?.maxFeePerGas || 0);
        renderGas(fast, normal, slow);
    } catch {
        // Fallback: open gas oracle
        try {
            const res2 = await fetch('https://api.gasprice.io/v1/estimates');
            const d2 = await res2.json();
            renderGas(
                Math.round(d2.result?.fast?.feeCap || 0),
                Math.round(d2.result?.normal?.feeCap || 0),
                Math.round(d2.result?.slow?.feeCap || 0)
            );
        } catch (e2) {
            const el = document.getElementById('gas-content');
            if (el) el.innerHTML = `<div class="widget-error"><div class="widget-error-msg">Error al cargar gas</div></div>`;
        }
    }
}

function renderGas(fast, normal, slow) {
    const el = document.getElementById('gas-content');
    if (!el) return;
    const rows = [
        { label: '🚀 Rápido', gwei: fast, color: 'var(--accent-red)' },
        { label: '⚡ Normal', gwei: normal, color: 'var(--accent-gold)' },
        { label: '🐢 Lento', gwei: slow, color: 'var(--accent-green)' },
    ];
    el.innerHTML = rows.map(r => `
    <div class="exchange-row">
      <span style="font-size:13px; font-weight:600;">${r.label}</span>
      <span style="font-family:var(--font-mono); font-size:16px; font-weight:700; color:${r.color}">${r.gwei} Gwei</span>
    </div>`).join('');
    document.getElementById('gas-badge').textContent = 'Live';
}

// ── Notes Widget ──
function getNotesHTML() {
    return `
    <div class="widget-header">
      <span class="widget-icon">📝</span>
      <span class="widget-title">Notas Rápidas</span>
      <span class="widget-badge">Local</span>
    </div>
    <textarea id="notes-area"
      placeholder="Escribe tus notas aquí... Se guardan automáticamente."
      style="width:100%; min-height:140px; background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-family:var(--font-main); font-size:13px; padding:12px; resize:vertical; outline:none; line-height:1.5;"
      oninput="saveNotes(this.value)"
    >${localStorage.getItem('dashboard-notes') || ''}</textarea>`;
}

function saveNotes(val) {
    localStorage.setItem('dashboard-notes', val);
}

// ── Calculator Widget ──
function getCalculatorHTML() {
    return `
    <div class="widget-header">
      <span class="widget-icon">🧮</span>
      <span class="widget-title">Calculadora P2P</span>
      <span class="widget-badge">Conversión</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:10px;">
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
        <div>
          <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">USDT que tienes</label>
          <input id="calc-usdt" type="number" placeholder="100" value="100"
            style="width:100%; background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-family:var(--font-mono); font-size:15px; padding:8px 12px; outline:none;"
            oninput="calcConvert()">
        </div>
        <div>
          <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:4px;">Precio P2P (PEN)</label>
          <input id="calc-rate-pen" type="number" placeholder="3.72" value="3.72" step="0.001"
            style="width:100%; background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-sm); color:var(--text-primary); font-family:var(--font-mono); font-size:15px; padding:8px 12px; outline:none;"
            oninput="calcConvert()">
        </div>
      </div>
      <div id="calc-result"
        style="background:rgba(240,185,11,0.08); border:1px solid rgba(240,185,11,0.2); border-radius:var(--radius-sm); padding:14px; text-align:center;">
        <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">Recibirías en Soles</div>
        <div id="calc-pen-result" style="font-family:var(--font-mono); font-size:26px; font-weight:700; color:var(--accent-gold);">S/ 372.00</div>
      </div>
    </div>`;
}

function calcConvert() {
    const usdt = parseFloat(document.getElementById('calc-usdt')?.value) || 0;
    const rate = parseFloat(document.getElementById('calc-rate-pen')?.value) || 0;
    const res = (usdt * rate).toFixed(2);
    const el = document.getElementById('calc-pen-result');
    if (el) el.textContent = `S/ ${parseFloat(res).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
}

// ── Keyboard shortcut: Escape closes modal ──
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') hideAddWidgetModal();
});
