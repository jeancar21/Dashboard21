/* ══════════════════════════════════════════
   CRYPTO NEWS WIDGET
   CryptoPanic public RSS via rss2json
   ══════════════════════════════════════════ */

async function fetchCryptoNews() {
    // Use rss2json to fetch CryptoPanic RSS (free tier)
    const RSS_URL = encodeURIComponent('https://cryptopanic.com/news/rss/');
    const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${RSS_URL}&count=8`;

    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (data.status !== 'ok' || !data.items?.length) throw new Error('No items');
        renderCryptoNews(data.items);
        document.getElementById('news-badge').textContent = 'CryptoPanic';
    } catch (err) {
        console.error('[News]', err);
        // Fallback: use another crypto news RSS
        fetchNewsFromFallback();
    }
}

async function fetchNewsFromFallback() {
    try {
        const RSS_URL = encodeURIComponent('https://cointelegraph.com/rss');
        const API_URL = `https://api.rss2json.com/v1/api.json?rss_url=${RSS_URL}&count=8`;
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status !== 'ok' || !data.items?.length) throw new Error('No items');
        renderCryptoNews(data.items, 'CoinTelegraph');
        document.getElementById('news-badge').textContent = 'CoinTelegraph';
    } catch (err2) {
        console.error('[News Fallback]', err2);
        renderNewsError();
    }
}

function timeAgo(dateStr) {
    const now = new Date();
    const then = new Date(dateStr);
    const diffMs = now - then;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Hace ${days}d`;
}

function renderCryptoNews(items, source = 'CryptoPanic') {
    const el = document.getElementById('news-list');
    if (!el) return;

    el.innerHTML = items.slice(0, 7).map(item => {
        const title = item.title || 'Sin título';
        const link = item.link || item.guid || '#';
        const date = item.pubDate || '';
        const ago = date ? timeAgo(date) : '';

        return `
      <div class="news-item" onclick="window.open('${link}', '_blank')">
        <div class="news-title">${title}</div>
        <div class="news-meta">
          <span class="news-source">${source}</span>
          ${ago ? `<span>${ago}</span>` : ''}
        </div>
      </div>`;
    }).join('');
}

function renderNewsError() {
    document.getElementById('news-list').innerHTML = `
    <div class="widget-error">
      <div class="widget-error-icon">📰</div>
      <div class="widget-error-msg">No se pudo cargar noticias</div>
      <div class="widget-error-retry" onclick="fetchCryptoNews()">Reintentar</div>
    </div>`;
}
