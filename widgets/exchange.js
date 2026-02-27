/* ══════════════════════════════════════════
   EXCHANGE RATES WIDGET
   open.er-api.com (free, no key required)
   ══════════════════════════════════════════ */

const EXCHANGE_PAIRS = [
    { from: 'USD', to: 'PEN', flags: '🇺🇸→🇵🇪', name: 'Dólar → Sol', sub: 'USD/PEN' },
    { from: 'USD', to: 'EUR', flags: '🇺🇸→🇪🇺', name: 'Dólar → Euro', sub: 'USD/EUR' },
    { from: 'EUR', to: 'PEN', flags: '🇪🇺→🇵🇪', name: 'Euro → Sol', sub: 'EUR/PEN' },
    { from: 'EUR', to: 'USD', flags: '🇪🇺→🇺🇸', name: 'Euro → Dólar', sub: 'EUR/USD' },
    { from: 'USD', to: 'GBP', flags: '🇺🇸→🇬🇧', name: 'Dólar → Libra', sub: 'USD/GBP' },
];

async function fetchExchangeRates() {
    try {
        // Fetch USD base and EUR base in parallel
        const [resUSD, resEUR] = await Promise.all([
            fetch('https://open.er-api.com/v6/latest/USD'),
            fetch('https://open.er-api.com/v6/latest/EUR'),
        ]);
        if (!resUSD.ok || !resEUR.ok) throw new Error('HTTP error');
        const usdData = await resUSD.json();
        const eurData = await resEUR.json();

        const rates = {
            USD: { PEN: usdData.rates.PEN, EUR: usdData.rates.EUR, GBP: usdData.rates.GBP },
            EUR: { PEN: eurData.rates.PEN, USD: eurData.rates.USD },
        };

        renderExchangeRates(rates);
        document.getElementById('exchange-badge').textContent = 'Live';

        // Feed rates to P2P calculator
        if (typeof updateCalcMarketRates === 'function') {
            updateCalcMarketRates(usdData.rates.PEN, usdData.rates.EUR);
        }
    } catch (err) {
        console.error('[Exchange]', err);
        renderExchangeError();
    }
}

function renderExchangeRates(rates) {
    const el = document.getElementById('exchange-list');
    if (!el) return;

    el.innerHTML = EXCHANGE_PAIRS.map(pair => {
        const rate = rates[pair.from]?.[pair.to];
        const rateStr = rate != null ? rate.toFixed(4) : 'N/A';
        return `
      <div class="exchange-row">
        <div class="exchange-pair">
          <span class="exchange-flags">${pair.flags}</span>
          <div>
            <div class="exchange-name">${pair.name}</div>
            <div class="exchange-sub">${pair.sub}</div>
          </div>
        </div>
        <div class="exchange-rate">${rateStr}</div>
      </div>`;
    }).join('');
}

function renderExchangeError() {
    document.getElementById('exchange-list').innerHTML = `
    <div class="widget-error">
      <div class="widget-error-icon">💱</div>
      <div class="widget-error-msg">Error al cargar tipos de cambio</div>
      <div class="widget-error-retry" onclick="fetchExchangeRates()">Reintentar</div>
    </div>`;
}
