/* ══════════════════════════════════════════
   WEATHER WIDGET — Rubí, Barcelona, España
   Open-Meteo API (no API key required)
   Coords: lat=41.4934, lon=2.0337
   ══════════════════════════════════════════ */

const WEATHER_CONFIG = {
    lat: 41.4934,
    lon: 2.0337,
    city: 'Rubí, Barcelona',
    timezone: 'Europe/Madrid'
};

const WMO_CODES = {
    0: { icon: '☀️', desc: 'Despejado' },
    1: { icon: '🌤', desc: 'Principalmente despejado' },
    2: { icon: '⛅', desc: 'Parcialmente nublado' },
    3: { icon: '☁️', desc: 'Nublado' },
    45: { icon: '🌫', desc: 'Niebla' },
    48: { icon: '🌫', desc: 'Niebla con escarcha' },
    51: { icon: '🌦', desc: 'Llovizna ligera' },
    53: { icon: '🌦', desc: 'Llovizna moderada' },
    55: { icon: '🌧', desc: 'Llovizna intensa' },
    61: { icon: '🌧', desc: 'Lluvia ligera' },
    63: { icon: '🌧', desc: 'Lluvia moderada' },
    65: { icon: '🌧', desc: 'Lluvia intensa' },
    71: { icon: '🌨', desc: 'Nieve ligera' },
    73: { icon: '🌨', desc: 'Nieve moderada' },
    75: { icon: '❄️', desc: 'Nieve intensa' },
    77: { icon: '🌨', desc: 'Granizo' },
    80: { icon: '🌦', desc: 'Chubascos leves' },
    81: { icon: '🌧', desc: 'Chubascos moderados' },
    82: { icon: '⛈', desc: 'Chubascos fuertes' },
    95: { icon: '⛈', desc: 'Tormenta' },
    96: { icon: '⛈', desc: 'Tormenta con granizo' },
    99: { icon: '⛈', desc: 'Tormenta severa' },
};

async function fetchWeather() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_CONFIG.lat}&longitude=${WEATHER_CONFIG.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=${WEATHER_CONFIG.timezone}&forecast_days=1`;

    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        renderWeather(data);
        document.getElementById('weather-badge').textContent = 'Live';
    } catch (err) {
        console.error('[Weather]', err);
        renderWeatherError();
    }
}

function renderWeather(data) {
    const cur = data.current;
    const day = data.daily;
    const code = cur.weather_code;
    const wmo = WMO_CODES[code] || { icon: '🌡', desc: 'Desconocido' };

    document.getElementById('weather-icon').textContent = wmo.icon;
    document.getElementById('weather-temp').textContent = `${Math.round(cur.temperature_2m)}°`;
    document.getElementById('weather-feels').textContent = `Sensación: ${Math.round(cur.apparent_temperature)}°C`;
    document.getElementById('weather-desc').textContent = wmo.desc;
    document.getElementById('weather-humidity').textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById('weather-wind').textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
    document.getElementById('weather-max').textContent = `${Math.round(day.temperature_2m_max[0])}°C`;
    document.getElementById('weather-min').textContent = `${Math.round(day.temperature_2m_min[0])}°C`;
}

function renderWeatherError() {
    document.getElementById('weather-content').innerHTML = `
    <div class="widget-error">
      <div class="widget-error-icon">🌐</div>
      <div class="widget-error-msg">No se pudo obtener el clima</div>
      <div class="widget-error-retry" onclick="fetchWeather()">Reintentar</div>
    </div>`;
}
