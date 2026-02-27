/* ══════════════════════════════════════════
   BINANCE P2P WIDGET
   Uses Binance P2P public endpoint
   Shows USDT/PEN and USDT/EUR listings
   ══════════════════════════════════════════ */

// State: track which tab is active for each pair
const p2pState = {
    pen: { side: 'BUY', data: { BUY: null, SELL: null } },
    eur: { side: 'BUY', data: { BUY: null, SELL: null } },
};

async function fetchP2P(fiat, tradeType) {
    const payload = {
        asset: 'USDT',
        fiat: fiat,
        merchantCheck: false,
        page: 1,
        payTypes: [],
        publisherType: null,
        rows: 5,
        tradeType: tradeType, // 'BUY' | 'SELL'
    };

    // Use a CORS proxy since the Binance P2P API blocks direct browser requests
    const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search';

    try {
        const res = await fetch(BINANCE_P2P_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return data.data || [];
    } catch (err) {
        // Fallback: try allorigins CORS proxy
        try {
            const target = encodeURIComponent(BINANCE_P2P_URL);
            const proxyUrl = `https://api.allorigins.win/raw?url=${target}`;
            const proxyRes = await fetch(proxyUrl, {
                method: 'GET', // allorigins only supports GET, so we embed body differently
            });
            // allorigins doesn't support POST, so we use another approach
            throw new Error('proxy_no_post');
        } catch {
            // Try cors.sh or similar
            try {
                const corsProxy = 'https://corsproxy.io/?';
                const res2 = await fetch(corsProxy + encodeURIComponent(BINANCE_P2P_URL), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-requested-with': 'XMLHttpRequest' },
                    body: JSON.stringify(payload),
                });
                if (!res2.ok) throw new Error(`Proxy HTTP ${res2.status}`);
                const data2 = await res2.json();
                return data2.data || [];
            } catch (err2) {
                console.error('[P2P]', fiat, tradeType, err2);
                return null; // null = error state
            }
        }
    }
}

function formatPayMethods(methods) {
    if (!methods || methods.length === 0) return 'N/A';
    return methods.map(m => m.tradeMethodShortName || m.tradeMethodName || m.identifier).join(', ');
}

function renderP2PContent(pair, side, ads) {
    const contentId = `p2p-${pair}-content`;
    const updateId = `p2p-${pair}-update`;
    const el = document.getElementById(contentId);
    if (!el) return;

    const currencySymbols = { pen: 'S/', eur: '€' };
    const sym = currencySymbols[pair] || '';
    const priceColorClass = pair === 'eur' ? 'p2p-price-eur-color' : '';

    if (ads === null) {
        el.innerHTML = `
      <div class="widget-error">
        <div class="widget-error-icon">⚠️</div>
        <div class="widget-error-msg">Error al cargar datos P2P.<br>El navegador puede bloquear la petición.</div>
        <div class="widget-error-retry" onclick="refreshP2P('${pair}')">Reintentar</div>
      </div>`;
        return;
    }

    if (ads.length === 0) {
        el.innerHTML = `<div class="widget-error"><div class="widget-error-msg">Sin anuncios disponibles</div></div>`;
        return;
    }

    // Best price summary
    const bestPrice = parseFloat(ads[0].adv.price);
    const worstPrice = parseFloat(ads[ads.length - 1].adv.price);
    const spreadPct = ads.length > 1 ? (((worstPrice - bestPrice) / bestPrice) * 100).toFixed(2) : '0.00';

    const rows = ads.map((item, idx) => {
        const adv = item.adv;
        const user = item.advertiser;
        const price = parseFloat(adv.price).toFixed(2);
        const minAmt = parseFloat(adv.minSingleTransAmount).toFixed(0);
        const maxAmt = parseFloat(adv.dynamicMaxSingleTransAmount || adv.maxSingleTransAmount).toFixed(0);
        const methods = formatPayMethods(adv.tradeMethods);
        const orders = user.userStatsRet?.completedOrderNum || '?';
        const completion = user.userStatsRet?.recentExecuteRate != null
            ? (user.userStatsRet.recentExecuteRate * 100).toFixed(1) + '%'
            : '?%';

        return `
      <div class="p2p-row">
        <div class="p2p-trader">
          <div class="p2p-trader-name">#${idx + 1} ${user.nickName || 'Trader'}</div>
          <div class="p2p-methods">${methods}</div>
          <div class="p2p-limits">${sym}${minAmt} – ${sym}${maxAmt} · ${orders} trades · ${completion}</div>
        </div>
        <div class="p2p-price-block">
          <div class="p2p-price ${priceColorClass}">${sym}${price}</div>
          <div class="p2p-currency">por USDT</div>
        </div>
      </div>`;
    }).join('');

    const sideLabel = side === 'BUY' ? '🟢 Mejor precio compra' : '🔴 Mejor precio venta';

    el.innerHTML = `
    <div class="p2p-summary">
      <div class="p2p-summary-card">
        <div class="p2p-summary-label">${sideLabel}</div>
        <div class="p2p-summary-value ${side === 'BUY' ? 'buy-color' : 'sell-color'}">${sym}${bestPrice.toFixed(2)}</div>
      </div>
      <div class="p2p-summary-card">
        <div class="p2p-summary-label">📊 Spread</div>
        <div class="p2p-summary-value" style="color:var(--text-secondary)">${spreadPct}%</div>
      </div>
    </div>
    ${rows}`;

    const updateEl = document.getElementById(updateId);
    if (updateEl) updateEl.textContent = `Actualizado: ${new Date().toLocaleTimeString('es-ES')}`;
}

async function loadP2PForPair(pair) {
    const fiatMap = { pen: 'PEN', eur: 'EUR' };
    const fiat = fiatMap[pair];
    const state = p2pState[pair];
    const currentSide = state.side;

    // Load both sides in parallel
    const [buyAds, sellAds] = await Promise.all([
        fetchP2P(fiat, 'BUY'),
        fetchP2P(fiat, 'SELL'),
    ]);

    state.data.BUY = buyAds;
    state.data.SELL = sellAds;

    // Render active tab
    renderP2PContent(pair, currentSide, state.data[currentSide]);
}

function switchP2PTab(pair, sideRaw) {
    const side = sideRaw.toUpperCase();
    p2pState[pair].side = side;

    // Toggle tab styles
    const tabPrefix = `${sideRaw}-${pair}`;
    const buyBtn = document.querySelector(`[data-tab="buy-${pair}"]`);
    const sellBtn = document.querySelector(`[data-tab="sell-${pair}"]`);
    if (buyBtn) buyBtn.classList.toggle('active', side === 'BUY');
    if (sellBtn) sellBtn.classList.toggle('active', side === 'SELL');

    // If we already have data, render immediately
    if (p2pState[pair].data[side] !== null) {
        renderP2PContent(pair, side, p2pState[pair].data[side]);
    } else {
        loadP2PForPair(pair);
    }
}

async function refreshP2P(pair) {
    p2pState[pair].data = { BUY: null, SELL: null };
    const el = document.getElementById(`p2p-${pair}-content`);
    if (el) el.innerHTML = `<div class="loading-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line"></div></div>`;
    await loadP2PForPair(pair);
}

async function fetchAllP2P() {
    await Promise.all([
        loadP2PForPair('pen'),
        loadP2PForPair('eur'),
    ]);
    // Notify P2P calculator to refresh
    if (typeof notifyCalcP2PUpdated === 'function') notifyCalcP2PUpdated();
}
