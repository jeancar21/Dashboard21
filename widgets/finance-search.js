/* ══════════════════════════════════════════
   FINANCE SEARCH WIDGET
   ▸ Buscador de valores (Google Finance Style)
   ▸ Integración con TradingView & Enlaces Directos
   ══════════════════════════════════════════ */

let currentSearchSymbol = 'NASDAQ:AAPL';

function fetchFinanceSearch() {
    renderFinanceSearchUI();
}

function renderFinanceSearchUI() {
    const el = document.getElementById('finance-search-content');
    if (!el) return;

    el.innerHTML = `
        <div class="search-box-container">
            <div class="search-input-wrapper">
                <input type="text" id="fn-search-input" placeholder="Buscar símbolo (ej: TSLA, GOOGL)..." onkeydown="handleFinanceSearch(event)">
                <button onclick="executeFinanceSearch()" class="btn-search-exec">🔍</button>
            </div>
        </div>
        <div id="fn-search-result-container" style="height: 300px; margin-top: 15px; border-radius: 8px; overflow: hidden; background: rgba(0,0,0,0.2);">
            <!-- TradingView Mini Chart will load here -->
        </div>
        <div id="fn-external-links" class="fn-links-grid" style="display:none; margin-top: 15px;">
            <button onclick="openFinance('google')" class="btn-link-gf">Ver en Google Finance</button>
            <button onclick="openFinance('yahoo')" class="btn-link-yf">Yahoo Finance</button>
        </div>
    `;

    // Load default chart
    updateSearchWidgetResult(currentSearchSymbol);
}

function handleFinanceSearch(e) {
    if (e.key === 'Enter') {
        executeFinanceSearch();
    }
}

function executeFinanceSearch() {
    const input = document.getElementById('fn-search-input');
    let symbol = input.value.trim().toUpperCase();
    if (!symbol) return;

    // Basic heuristic: if no exchange prefix, assume common ones or let TV try to resolve
    if (!symbol.includes(':')) {
        // Try to guess exchange or just pass as is
        currentSearchSymbol = symbol;
    } else {
        currentSearchSymbol = symbol;
    }

    updateSearchWidgetResult(currentSearchSymbol);
    document.getElementById('fn-external-links').style.display = 'grid';
}

function updateSearchWidgetResult(symbol) {
    const container = document.getElementById('fn-search-result-container');
    if (!container) return;

    container.innerHTML = ''; // Clear previous

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.async = true;

    const config = {
        "symbol": symbol,
        "width": "100%",
        "height": "100%",
        "locale": "es",
        "dateRange": "12M",
        "colorTheme": "dark",
        "isTransparent": true,
        "autosize": true,
        "largeChartUrl": ""
    };

    script.innerHTML = JSON.stringify(config);
    container.appendChild(script);
}

function openFinance(platform) {
    const input = document.getElementById('fn-search-input');
    let symbol = input.value.trim().toUpperCase() || 'AAPL';
    // Remove exchange if present for direct links
    const cleanSymbol = symbol.split(':').pop();

    let url = '';
    if (platform === 'google') {
        url = `https://www.google.com/finance/quote/${cleanSymbol}:NASDAQ`; // Heuristic
    } else {
        url = `https://finance.yahoo.com/quote/${cleanSymbol}`;
    }
    window.open(url, '_blank');
}

function getFinanceSearchHTML() {
    return `
    <div class="widget-header">
      <span class="widget-icon">🔍</span>
      <span class="widget-title">Explorador de Mercado</span>
      <span class="widget-badge" style="background:rgba(66, 133, 244, 0.1); color: #4285f4; border-color: rgba(66, 133, 244, 0.3);">Google Finance</span>
    </div>
    <div id="finance-search-content" class="finance-search-body">
      <div class="loading-skeleton"><div class="skeleton-line"></div></div>
    </div>`;
}
