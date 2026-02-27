/* ══════════════════════════════════════════
   CLOCK WIDGET
   ══════════════════════════════════════════ */

function initClock() {
    function update() {
        const now = new Date();
        const timeEl = document.getElementById('clock-time');
        const dateEl = document.getElementById('clock-date');
        const headerClockEl = document.getElementById('header-clock');

        const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const shortStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        if (timeEl) timeEl.textContent = timeStr;
        if (dateEl) dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
        if (headerClockEl) headerClockEl.textContent = shortStr;
    }
    update();
    setInterval(update, 1000);
}
