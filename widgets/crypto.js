/* ══════════════════════════════════════════
   CRYPTO PRICES WIDGET
   CoinGecko public API (no key required)
   ══════════════════════════════════════════ */

const CRYPTO_COINS = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', emoji: '₿' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', emoji: 'Ξ' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', emoji: '🔶' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', emoji: '◎' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', emoji: '✕' },
    { id: 'tether', symbol: 'USDT', name: 'Tether', emoji: '₮' },
];

async function fetchCryptoPrices() {
    const ids = CRYPTO_COINS.map(c => c.id).join(',');
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderCryptoPrices(data);
        document.getElementById('crypto-badge').textContent = 'Live';
    } catch (err) {
        console.error('[Crypto]', err);
        renderCryptoError();
    }
}

function formatPrice(price) {
    if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (price >= 1) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function renderCryptoPrices(data) {
    const el = document.getElementById('crypto-list');
    if (!el) return;

    el.innerHTML = CRYPTO_COINS.map(coin => {
        const info = data[coin.id];
        if (!info) return '';
        const price = info.usd;
        const change = info.usd_24h_change;
        const isUp = change >= 0;
        const changeStr = (isUp ? '+' : '') + change.toFixed(2) + '%';

        return `
      <div class="crypto-row">
        <div class="crypto-symbol-block">
          <span class="crypto-emoji">${coin.emoji}</span>
          <div>
            <div class="crypto-symbol">${coin.symbol}</div>
            <div class="crypto-name">${coin.name}</div>
          </div>
        </div>
        <div class="crypto-price">${formatPrice(price)}</div>
        <div class="crypto-change ${isUp ? 'up' : 'down'}">${changeStr}</div>
      </div>`;
    }).join('');
}

function renderCryptoError() {
    const el = document.getElementById('crypto-list');
    if (!el) return;
    el.innerHTML = `
    <div class="widget-error">
      <div class="widget-error-icon">📉</div>
      <div class="widget-error-msg">Error al cargar precios</div>
      <div class="widget-error-retry" onclick="fetchCryptoPrices()">Reintentar</div>
    </div>`;
}
