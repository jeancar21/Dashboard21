/* ══════════════════════════════════════════
   DUAL CLOCK WIDGET
   ══════════════════════════════════════════ */

const CITIES_DB = [
    { id: 'local', name: '📍 Hora Local', tz: 'local' },
    { id: 'mad', name: '🇪🇸 Madrid, España', tz: 'Europe/Madrid' },
    { id: 'bcn', name: '🇪🇸 Barcelona, España', tz: 'Europe/Madrid' },
    { id: 'lim', name: '🇵🇪 Lima, Perú', tz: 'America/Lima' },
    { id: 'bog', name: '🇨🇴 Bogotá, Colombia', tz: 'America/Bogota' },
    { id: 'bue', name: '🇦🇷 Buenos Aires, ARG', tz: 'America/Argentina/Buenos_Aires' },
    { id: 'scl', name: '🇨🇱 Santiago, Chile', tz: 'America/Santiago' },
    { id: 'mex', name: '🇲🇽 Ciudad de México', tz: 'America/Mexico_City' },
    { id: 'nyc', name: '🇺🇸 Nueva York, USA', tz: 'America/New_York' },
    { id: 'mia', name: '🇺🇸 Miami, USA', tz: 'America/New_York' },
    { id: 'la', name: '🇺🇸 Los Ángeles, USA', tz: 'America/Los_Angeles' },
    { id: 'lon', name: '🇬🇧 Londres, UK', tz: 'Europe/London' },
    { id: 'par', name: '🇫🇷 París, Francia', tz: 'Europe/Paris' },
    { id: 'ber', name: '🇩🇪 Berlín, Alemania', tz: 'Europe/Berlin' },
    { id: 'rom', name: '🇮🇹 Roma, Italia', tz: 'Europe/Rome' },
    { id: 'tok', name: '🇯🇵 Tokio, Japón', tz: 'Asia/Tokyo' },
    { id: 'syd', name: '🇦🇺 Sídney, Australia', tz: 'Australia/Sydney' },
    { id: 'dxb', name: '🇦🇪 Dubái, EAU', tz: 'Asia/Dubai' },
    { id: 'hkg', name: '🇭🇰 Hong Kong', tz: 'Asia/Hong_Kong' },
    { id: 'sin', name: '🇸🇬 Singapur', tz: 'Asia/Singapore' }
];

let clockState = {
    city1: 'local',
    city2: 'mad',
    activeSearchIdx: null
};

function initClock() {
    // Load from local storage
    const saved = localStorage.getItem('dashboard-clocks');
    if (saved) {
        try {
            clockState = Object.assign(clockState, JSON.parse(saved));
            clockState.activeSearchIdx = null; // reset search state
        } catch (e) { }
    }

    function update() {
        const now = new Date();

        // Always update the tiny header clock with local time
        const headerClockEl = document.getElementById('header-clock');
        if (headerClockEl) {
            headerClockEl.textContent = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        }

        updateCityPanel(1, clockState.city1, now);
        updateCityPanel(2, clockState.city2, now);
    }

    // Immediate first update
    update();
    setInterval(update, 1000);
}

function updateCityPanel(idx, cityId, now) {
    const city = CITIES_DB.find(c => c.id === cityId) || CITIES_DB[0];
    const tzNameEl = document.getElementById(`clock-tz-${idx}`);
    const timeEl = document.getElementById(`clock-time-${idx}`);
    const dateEl = document.getElementById(`clock-date-${idx}`);

    if (!tzNameEl || !timeEl || !dateEl) return;

    tzNameEl.innerHTML = city.name;

    const optsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const optsDate = { weekday: 'short', day: 'numeric', month: 'short' };

    if (city.tz !== 'local') {
        optsTime.timeZone = city.tz;
        optsDate.timeZone = city.tz;
    }

    timeEl.textContent = now.toLocaleTimeString('es-ES', optsTime);
    let dateStr = now.toLocaleDateString('es-ES', optsDate);
    dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1).replace(/\./g, '');
}

// ── Search UI Logic ──
function toggleClockSearch() {
    const area = document.getElementById('clock-search-area');
    if (area.style.display === 'none') {
        openClockSearch(1);
    } else {
        closeClockSearch();
    }
}

function openClockSearch(idx) {
    clockState.activeSearchIdx = idx;
    document.getElementById('clock-search-area').style.display = 'block';
    document.getElementById('clock-search-title').innerHTML = `Elegir Ciudad <span style="color:var(--accent-blue)">${idx}</span>:`;

    // Highlight selected panel
    const p1 = document.getElementById('clock-tz-1').parentElement;
    const p2 = document.getElementById('clock-tz-2').parentElement;
    p1.style.borderColor = idx === 1 ? 'var(--accent-blue)' : 'var(--border)';
    p2.style.borderColor = idx === 2 ? 'var(--accent-blue)' : 'var(--border)';
    p1.style.background = idx === 1 ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-glass)';
    p2.style.background = idx === 2 ? 'rgba(59, 130, 246, 0.05)' : 'var(--bg-glass)';

    document.getElementById('clock-search-input').value = '';
    filterClockCities();
    document.getElementById('clock-search-input').focus();
}

function closeClockSearch() {
    document.getElementById('clock-search-area').style.display = 'none';
    const p1 = document.getElementById('clock-tz-1').parentElement;
    const p2 = document.getElementById('clock-tz-2').parentElement;
    p1.style.borderColor = 'var(--border)';
    p2.style.borderColor = 'var(--border)';
    p1.style.background = 'var(--bg-glass)';
    p2.style.background = 'var(--bg-glass)';
    clockState.activeSearchIdx = null;
}

function filterClockCities() {
    const query = (document.getElementById('clock-search-input').value || '').toLowerCase();
    const resEl = document.getElementById('clock-search-results');

    const filtered = CITIES_DB.filter(c => c.name.toLowerCase().includes(query) || c.tz.toLowerCase().includes(query));

    resEl.innerHTML = filtered.map(c => `
        <div style="padding:8px 10px; font-size:12px; cursor:pointer; background:var(--bg-card); border-radius:4px; display:flex; justify-content:space-between; align-items:center;" 
             onmouseover="this.style.background='var(--border)'" 
             onmouseout="this.style.background='var(--bg-card)'"
             onclick="selectClockCity('${c.id}')">
            <span>${c.name}</span> <span style="color:var(--text-muted); font-size:9px; font-family:var(--font-mono);">${c.tz}</span>
        </div>
    `).join('');
}

function selectClockCity(cityId) {
    if (clockState.activeSearchIdx === 1) clockState.city1 = cityId;
    if (clockState.activeSearchIdx === 2) clockState.city2 = cityId;

    localStorage.setItem('dashboard-clocks', JSON.stringify({
        city1: clockState.city1,
        city2: clockState.city2
    }));

    updateCityPanel(1, clockState.city1, new Date());
    updateCityPanel(2, clockState.city2, new Date());

    // Auto switch to select second city if first was just selected
    if (clockState.activeSearchIdx === 1) {
        openClockSearch(2);
    } else {
        closeClockSearch();
    }
}
