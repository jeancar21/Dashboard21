/* ══════════════════════════════════════════
   STOCKS WIDGET — v9 (FINANCIAL TABLE FORMAT)
   ▸ Diseño inspirado en Terminal Bloomberg.
   ▸ Formato de tabla apilada profesional.
   ▸ CAT (Caterpillar) + Sector Tecnológico.
   ══════════════════════════════════════════ */

function fetchStocks() {
    const el = document.getElementById('stocks-content');
    if (!el) return;

    // Usamos el widget de "Market Quotes" de TradingView para una tabla apilada profesional.
    // Este formato es el más cercano a una terminal de Bloomberg.
    el.innerHTML = `
        <div class="tradingview-widget-container" style="height: 520px;">
            <div class="tradingview-widget-container__widget"></div>
            <div style="padding: 8px; font-size: 9px; text-align: center; color: #5d606b; background: #131722; border-top: 1px solid #2a2e39;">
                MERCADOS EN TIEMPO REAL • FUENTE: BLOOMBERG/TV
            </div>
        </div>
    `;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js';
    script.async = true;

    const config = {
        "width": "100%",
        "height": "100%",
        "symbolsGroups": [
            {
                "name": "ENFOQUE INDUSTRIAL",
                "originalName": "Industrial",
                "symbols": [
                    { "name": "NYSE:CAT", "displayName": "CATERPILLAR (CAT)" },
                    { "name": "NYSE:DE", "displayName": "JOHN DEERE" },
                    { "name": "NYSE:GE", "displayName": "GEN. ELECTRIC" }
                ]
            },
            {
                "name": "SECTOR TECNOLÓGICO",
                "originalName": "Technology",
                "symbols": [
                    { "name": "NASDAQ:NVDA", "displayName": "NVIDIA" },
                    { "name": "NASDAQ:AAPL", "displayName": "APPLE" },
                    { "name": "NASDAQ:MSFT", "displayName": "MICROSOFT" },
                    { "name": "NASDAQ:TSLA", "displayName": "TESLA" },
                    { "name": "NASDAQ:GOOGL", "displayName": "GOOGLE" },
                    { "name": "NASDAQ:AMZN", "displayName": "AMAZON" },
                    { "name": "NASDAQ:META", "displayName": "META (FB)" }
                ]
            }
        ],
        "showSymbolLogo": true,
        "colorTheme": "dark",
        "isTransparent": true,
        "locale": "es"
    };

    script.innerHTML = JSON.stringify(config);
    el.querySelector('.tradingview-widget-container').appendChild(script);
}

function getStocksHTML() {
    return `
    <div class="widget-header" style="background: #000; border-bottom: 2px solid #2962ff;">
      <span class="widget-icon">📊</span>
      <span class="widget-title" style="letter-spacing: 1px; font-weight: 800; color: #fff;">TERMINAL BURSÁTIL</span>
      <span class="widget-badge" style="background: #2962ff; color: #fff; border: none; font-size: 9px;">BLOOMBERG STYLE</span>
    </div>
    <div id="stocks-content" style="min-height: 500px; padding: 0; background: #131722;">
      <div class="loading-skeleton" style="padding: 20px;">
        <div class="skeleton-line" style="height: 40px; margin-bottom: 20px;"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line"></div>
      </div>
    </div>`;
}
