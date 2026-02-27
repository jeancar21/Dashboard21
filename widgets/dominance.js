/* ══════════════════════════════════════════
   MARKET DOMINANCE & GLOBAL WIDGET
   CoinGecko public API /global endpoint
   ══════════════════════════════════════════ */

async function fetchGlobalMarket() {
  try {
    const res = await fetch('https://api.coinlore.net/api/global/');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderGlobalMarket(data[0]);
    document.getElementById('dominance-badge').textContent = 'CoinLore';
  } catch (err) {
    console.error('[Global]', err);
    renderDominanceError();
  }
}

function formatMarketCap(value) {
  if (value >= 1e12) return '$' + (value / 1e12).toFixed(2) + 'T';
  if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return '$' + (value / 1e6).toFixed(2) + 'M';
  return '$' + parseFloat(value).toLocaleString();
}

function renderGlobalMarket(data) {
  const el = document.getElementById('dominance-content');
  if (!el) return;

  const totalMcap = data.total_mcap || 0;
  const total24hVol = data.total_volume || 0;
  const btcDom = data.btc_d || '--';
  const ethDom = data.eth_d || '--';
  const btcDomNum = parseFloat(btcDom);
  const activeCoins = data.coins_count?.toLocaleString() || '--';
  const mcapChange = parseFloat(data.mcap_change);
  const mcapChangeStr = !isNaN(mcapChange)
    ? `<span style="color:${mcapChange >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}">${mcapChange >= 0 ? '+' : ''}${mcapChange.toFixed(2)}% 24h</span>`
    : '';

  el.innerHTML = `
    <div class="dominance-grid">
      <div class="dominance-card market-cap-total">
        <div class="dominance-label">🌐 Market Cap Total ${mcapChangeStr}</div>
        <div class="dominance-value">${formatMarketCap(totalMcap)}</div>
      </div>
      <div class="dominance-card">
        <div class="dominance-label">₿ BTC Dominancia</div>
        <div class="dominance-value">${btcDom}%</div>
        <div class="dominance-sub">del market total</div>
      </div>
      <div class="dominance-card">
        <div class="dominance-label">Ξ ETH Dominancia</div>
        <div class="dominance-value">${ethDom}%</div>
        <div class="dominance-sub">del market total</div>
      </div>
      <div class="dominance-card">
        <div class="dominance-label">📊 Volumen 24h</div>
        <div class="dominance-value">${formatMarketCap(total24hVol)}</div>
        <div class="dominance-sub">trading global</div>
      </div>
      <div class="dominance-card">
        <div class="dominance-label">🔢 Monedas Activas</div>
        <div class="dominance-value" style="font-size:16px;">${activeCoins}</div>
        <div class="dominance-sub">en el mercado</div>
      </div>
      <div class="btc-bar-container">
        <div class="btc-bar-label">
          <span>₿ BTC Dominancia</span>
          <span>${btcDom}%</span>
        </div>
        <div class="btc-bar-track">
          <div class="btc-bar-fill" id="btc-bar-fill"></div>
        </div>
      </div>
    </div>`;

  // Animate bar after render
  requestAnimationFrame(() => {
    const barEl = document.getElementById('btc-bar-fill');
    if (barEl) barEl.style.width = btcDomNum + '%';
  });
}

function renderDominanceError() {
  document.getElementById('dominance-content').innerHTML = `
    <div class="widget-error">
      <div class="widget-error-icon">🌐</div>
      <div class="widget-error-msg">Error al cargar datos de mercado</div>
      <div class="widget-error-retry" onclick="fetchGlobalMarket()">Reintentar</div>
    </div>`;
}
