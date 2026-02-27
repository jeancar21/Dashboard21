/* ══════════════════════════════════════════
   SPORTS WIDGET — v6 (VIRTUAL SCOREBOARD - COMPROBADO)
   ▸ FC Barcelona  — ESPN Scoreboard (esp.1 + uefa.champions)
   ▸ Alianza Lima  — ESPN Scoreboard (per.1 + conmebol.libertadores)
   ══════════════════════════════════════════ */

const TEAM_MAP = {
    barcelona: {
        id: '83',
        leagues: ['soccer/esp.1', 'soccer/uefa.champions'],
        name: 'Barcelona',
        color: '#a50044'
    },
    alianza: {
        id: '2034',
        leagues: ['soccer/per.1', 'soccer/conmebol.libertadores'],
        name: 'Alianza Lima',
        color: '#002a5c'
    }
};

const sportsTabState = { barcelona: 'next', alianza: 'next' };
const sportsCache = {};

async function fetchAllSports() {
    await Promise.allSettled([
        fetchTeamDataV6('barcelona'),
        fetchTeamDataV6('alianza'),
        fetchSportsNews('barcelona'),
        fetchAlianzaNews()
    ]);
}

async function fetchTeamDataV6(teamKey) {
    const cfg = TEAM_MAP[teamKey];
    setSportsLoading(teamKey);

    // Calculate dynamic date range (Past 45 days to Future 60 days)
    const now = new Date();
    const start = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const dateRange = `${fmtYMD(start)}-${fmtYMD(end)}`;

    let allEvents = [];

    try {
        // Fetch from multiple competitions (League + Cup/Libertadores)
        const fetchPromises = cfg.leagues.map(async (league) => {
            const baseUrl = `https://site.api.espn.com/apis/site/v2/sports/${league}/scoreboard?dates=${dateRange}&limit=100`;

            const res = await fetch(baseUrl);
            if (!res.ok) return [];
            const data = await res.json();
            return data.events || [];
        });

        const results = await Promise.all(fetchPromises);
        let events = results.flat();

        // Filter events where our team is playing
        allEvents = events.filter(ev => {
            const comp = ev.competitions?.[0];
            if (!comp) return false;
            return comp.competitors.some(c => c.team?.id === cfg.id || c.team?.displayName?.includes(cfg.name));
        });

        // Split into Next and Last
        const next = allEvents.filter(ev => new Date(ev.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
        const last = allEvents.filter(ev => new Date(ev.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));

        sportsCache[teamKey] = { next, last };
        renderSportsTab(teamKey, sportsTabState[teamKey]);
    } catch (e) {
        console.error(`[Sports] ${teamKey} failed:`, e);
        const el = document.getElementById(`sports-${teamKey}-content`);
        if (el) el.innerHTML = `<div class="widget-error"><div class="widget-error-msg">Error al sincronizar datos</div></div>`;
    }
}

function fmtYMD(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function switchSportsTab(teamKey, tab) {
    sportsTabState[teamKey] = tab;
    const widget = document.getElementById(`widget-sports-${teamKey}`);
    if (widget) {
        widget.querySelectorAll('.tab-btn').forEach(btn => {
            const isTarget = btn.getAttribute('data-sports-tab') === `${teamKey}-${tab}`;
            btn.classList.toggle('active', isTarget);
        });
    }
    if (sportsCache[teamKey]) renderSportsTab(teamKey, tab);
}

function renderSportsTab(teamKey, tab) {
    const el = document.getElementById(`sports-${teamKey}-content`);
    if (!el || !sportsCache[teamKey]) return;

    const events = sportsCache[teamKey][tab];
    const cfg = TEAM_MAP[teamKey];

    if (!events || events.length === 0) {
        el.innerHTML = `<div class="widget-error-msg" style="padding:15px; font-size:11px; text-align:center;">${tab === 'next' ? 'Sin próximos partidos' : 'Sin resultados recientes'}</div>`;
        return;
    }

    el.innerHTML = events.slice(0, 4).map(ev => {
        const comp = ev.competitions[0];
        const league = ev.season?.displayName || 'Competición';
        const home = comp.competitors.find(c => c.homeAway === 'home');
        const away = comp.competitors.find(c => c.homeAway === 'away');
        const isTeamHome = home.team.id === cfg.id || home.team.displayName.includes(cfg.name);

        let statusHtml = '';
        if (tab === 'last') {
            const scoreStr = `${home.score}–${away.score}`;
            const winner = comp.competitors.find(c => (c.team.id === cfg.id || c.team.displayName.includes(cfg.name)))?.winner;
            const color = winner === true ? 'var(--accent-green)' : (winner === false ? 'var(--accent-red)' : 'var(--text-secondary)');
            statusHtml = `<span class="sports-score" style="color:${color}; font-weight:800;">${scoreStr}</span>`;
        } else {
            const dt = new Date(ev.date);
            const dateStr = dt.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
            statusHtml = `<span class="sports-date">${dateStr}</span>`;
        }

        return `
            <div class="sports-match-row">
                <div class="sports-teams">
                    <span class="sports-team-name ${isTeamHome ? 'is-team' : ''}">${esc(home.team.displayName)}</span>
                    <span class="sports-vs">vs</span>
                    <span class="sports-team-name ${!isTeamHome ? 'is-team' : ''}">${esc(away.team.displayName)}</span>
                </div>
                <div class="sports-meta">
                    <span class="sports-league">🏆 ${esc(league)}</span>
                    ${statusHtml}
                </div>
            </div>`;
    }).join('');
}

function setSportsLoading(teamKey) {
    const el = document.getElementById(`sports-${teamKey}-content`);
    if (el) el.innerHTML = `<div class="loading-skeleton"><div class="skeleton-line"></div><div class="skeleton-line"></div></div>`;
}

// ── NEWS LOGIC (REFACTORED V7) ──
async function fetchAlianzaNews() {
    // Alianza Lima: Using Google News Peru RSS for highest reliability
    const rssUrl = 'https://news.google.com/rss/search?q=Alianza+Lima+club&hl=es-PE&gl=PE&ceid=PE:es-419';
    await renderNewsSection('Alianza Lima', 'alianza-news-list', rssUrl, 'Google News PE');
}

async function fetchSportsNews(teamKey) {
    if (teamKey === 'alianza') return;

    // FC Barcelona: Using Mundo Deportivo RSS
    const rssUrl = 'https://www.mundodeportivo.com/rss/futbol/fc-barcelona.xml';
    await renderNewsSection('FC Barcelona', 'sports-barcelona-news', rssUrl, 'Mundo Deportivo');
}

async function renderNewsSection(teamName, elementId, rssUrl, sourceLabel) {
    const el = document.getElementById(elementId);
    if (!el) return;

    try {
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&_cb=${Date.now()}`);
        const data = await res.json();

        if (data.status === 'ok' && data.items && data.items.length > 0) {
            el.innerHTML = data.items.slice(0, 5).map(item => {
                const title = item.title.replace(/\s*[-–|]\s*[^-–|]+$/, '').trim();
                const ago = item.pubDate ? sportsTimeAgo(new Date(item.pubDate)) : '';

                return `
                    <div class="news-item" onclick="window.open('${item.link}','_blank')" style="cursor:pointer; padding: 10px; border-bottom: 1px solid var(--border);">
                        <div class="news-title" style="font-size:11.5px; font-weight: 500; line-height: 1.4; margin-bottom: 4px;">${esc(title)}</div>
                        <div class="news-meta" style="font-size:10px; color: var(--text-muted); display: flex; justify-content: space-between;">
                            <span>${sourceLabel}</span>
                            <span>${ago}</span>
                        </div>
                    </div>`;
            }).join('');
        } else {
            throw new Error('Invalid RSS response');
        }
    } catch (e) {
        console.error(`[News] ${teamName} failed:`, e);
        el.innerHTML = `<div style="padding:15px; font-size:11px; text-align:center; color: var(--text-muted);">No se pudieron cargar noticias de ${teamName}.</div>`;
    }
}

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sportsTimeAgo(date) {
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}
