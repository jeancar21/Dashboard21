/* ══════════════════════════════════════════
   P2P CALCULATOR WIDGET
   Converts: PEN ↔ USDT ↔ EUR
   Shows comparison vs direct market rate
   ══════════════════════════════════════════ */

// State shared with binance-p2p.js p2pState
let _calcMarketRatePenUsd = null; // from exchange widget
let _calcMarketRateEurUsd = null;

// Called from exchange widget after rates load
function updateCalcMarketRates(penPerUsd, eurPerUsd) {
  _calcMarketRatePenUsd = penPerUsd;
  _calcMarketRateEurUsd = eurPerUsd;
  runCalcIfReady();
}

function getCalcRates() {
  // Best P2P buy price: how many PEN per USDT (cheapest = best for buyer)
  const p2pBuyPen = p2pState?.pen?.data?.BUY?.[0]?.adv?.price
    ? parseFloat(p2pState.pen.data.BUY[0].adv.price) : null;

  // Best P2P sell price for EUR: how many EUR per USDT
  const p2pSellEur = p2pState?.eur?.data?.SELL?.[0]?.adv?.price
    ? parseFloat(p2pState.eur.data.SELL[0].adv.price) : null;

  return { p2pBuyPen, p2pSellEur };
}

function runCalcIfReady() {
  const amtInput = document.getElementById('calc2-pen-input');
  if (!amtInput) return;
  runCalc();
}

function runCalc() {
  const penInput = parseFloat(document.getElementById('calc2-pen-input')?.value) || 0;
  const { p2pBuyPen, p2pSellEur } = getCalcRates();

  // ── Via P2P chain: PEN → USDT → EUR ──
  let usdtFromPen = p2pBuyPen ? penInput / p2pBuyPen : null;
  let eurFromUsdt = (p2pSellEur && usdtFromPen) ? usdtFromPen * p2pSellEur : null;

  // ── Via direct market rate: PEN → USD → EUR ──
  let eurDirect = null;
  if (_calcMarketRatePenUsd && _calcMarketRateEurUsd && penInput > 0) {
    const usdFromPen = penInput / _calcMarketRatePenUsd;
    eurDirect = usdFromPen * (1 / _calcMarketRateEurUsd); // EUR = USD / eurPerUsd... wait
    // Actually: if eurPerUsd = EUR per 1 USD then EUR = USD * eurPerUsd
    // open.er-api gives USD base: rates.EUR = how many EUR per 1 USD
    eurDirect = usdFromPen * _calcMarketRateEurUsd;
  }

  // ── Update UI ──
  const usdtEl = document.getElementById('calc2-usdt-result');
  const eurP2PEl = document.getElementById('calc2-eur-p2p');
  const eurDirEl = document.getElementById('calc2-eur-direct');
  const diffEl = document.getElementById('calc2-diff');
  const rateP2PEl = document.getElementById('calc2-rate-pen');
  const rateEurEl = document.getElementById('calc2-rate-eur');

  // P2P rate display
  if (rateP2PEl) rateP2PEl.textContent = p2pBuyPen ? `S/ ${p2pBuyPen.toFixed(3)}/USDT` : 'Cargando...';
  if (rateEurEl) rateEurEl.textContent = p2pSellEur ? `€ ${p2pSellEur.toFixed(4)}/USDT` : 'Cargando...';

  if (usdtEl) usdtEl.textContent = usdtFromPen !== null
    ? `${usdtFromPen.toFixed(4)} USDT` : '-- USDT';

  if (eurP2PEl) eurP2PEl.textContent = eurFromUsdt !== null
    ? `€ ${eurFromUsdt.toFixed(2)}` : '--';

  // Sync comparison copy
  const eurP2PBEl = document.getElementById('calc2-eur-p2p-b');
  if (eurP2PBEl) eurP2PBEl.textContent = eurFromUsdt !== null ? `€ ${eurFromUsdt.toFixed(2)}` : '--';

  if (eurDirEl) eurDirEl.textContent = eurDirect !== null
    ? `€ ${eurDirect.toFixed(2)}` : '--';

  // Difference
  if (diffEl && eurFromUsdt !== null && eurDirect !== null) {
    const diff = eurFromUsdt - eurDirect;
    const diffPct = (diff / eurDirect * 100).toFixed(2);
    const isPos = diff >= 0;
    diffEl.textContent = `${isPos ? '+' : ''}€ ${diff.toFixed(2)} (${isPos ? '+' : ''}${diffPct}%) vs mercado`;
    diffEl.style.color = isPos ? 'var(--accent-green)' : 'var(--accent-red)';
  } else if (diffEl) {
    diffEl.textContent = 'Esperando tasas P2P...';
    diffEl.style.color = 'var(--text-muted)';
  }
}

// Called by binance-p2p.js after each load
function notifyCalcP2PUpdated() {
  runCalcIfReady();
}

function getP2PCalcWidgetHTML() {
  return `
    <div class="widget-header">
      <span class="widget-icon">🧮</span>
      <span class="widget-title">Calculadora P2P</span>
      <span class="widget-badge" style="background:rgba(240,185,11,0.1);border-color:rgba(240,185,11,0.3);color:var(--accent-gold);">PEN↔EUR</span>
    </div>

    <div class="calc2-section">
      <label class="calc2-label">💰 Tengo en Soles (PEN)</label>
      <input
        id="calc2-pen-input"
        type="number"
        value="1000"
        min="0"
        placeholder="Ingresa monto en soles"
        oninput="runCalc()"
        class="calc2-input"
      />
    </div>

    <div class="calc2-chain">
      <div class="calc2-step">
        <div class="calc2-step-top">
          <span class="calc2-step-label">Paso 1 — PEN → USDT (P2P Binance)</span>
          <span class="calc2-rate" id="calc2-rate-pen">Cargando...</span>
        </div>
        <div class="calc2-step-value" id="calc2-usdt-result">-- USDT</div>
      </div>
      <div class="calc2-arrow">↓</div>
      <div class="calc2-step">
        <div class="calc2-step-top">
          <span class="calc2-step-label">Paso 2 — USDT → EUR (P2P Binance)</span>
          <span class="calc2-rate" id="calc2-rate-eur">Cargando...</span>
        </div>
        <div class="calc2-step-value highlight" id="calc2-eur-p2p">--</div>
      </div>
    </div>

    <div class="calc2-comparison">
      <div class="calc2-comp-header">📊 Comparativo</div>
      <div class="calc2-comp-row">
        <span class="calc2-comp-label">🔄 Vía P2P Binance</span>
        <span class="calc2-comp-value" id="calc2-eur-p2p-b">--</span>
      </div>
      <div class="calc2-comp-row">
        <span class="calc2-comp-label">🌐 Tipo cambio mercado</span>
        <span class="calc2-comp-value" id="calc2-eur-direct">--</span>
      </div>
      <div class="calc2-diff" id="calc2-diff">Esperando tasas...</div>
    </div>`;
}
