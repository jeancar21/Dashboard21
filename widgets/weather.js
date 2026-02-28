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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${WEATHER_CONFIG.lat}&longitude=${WEATHER_CONFIG.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=${WEATHER_CONFIG.timezone}&forecast_days=7`;

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

    renderForecast(day);
}

function renderForecast(daily) {
    const forecastContainer = document.getElementById('weather-forecast');
    if (!forecastContainer) return;

    let html = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daily.time.length; i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr);
        dateObj.setHours(0, 0, 0, 0);

        let dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
        dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

        if (dateObj.getTime() === today.getTime()) {
            dayName = 'Hoy';
        }

        const maxTemp = Math.round(daily.temperature_2m_max[i]);
        const minTemp = Math.round(daily.temperature_2m_min[i]);
        const code = daily.weather_code[i];
        const wmo = WMO_CODES[code] || { icon: '🌡' };

        html += `
            <div class="forecast-day">
                <div class="forecast-date">${dayName}</div>
                <div class="forecast-icon">${wmo.icon}</div>
                <div class="forecast-temp">
                    <span class="f-max">${maxTemp}°</span>
                    <span class="f-min">${minTemp}°</span>
                </div>
            </div>
        `;
    }

    forecastContainer.innerHTML = html;
}

// Geolocation Feature
async function requestGeolocation() {
    const badge = document.getElementById('weather-badge');
    badge.textContent = 'Ubicando...';

    if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización.');
        badge.textContent = 'Live';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            WEATHER_CONFIG.lat = lat;
            WEATHER_CONFIG.lon = lon;

            try {
                // Reverse geocoding to get city name
                const revUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`;
                const revRes = await fetch(revUrl);
                if (revRes.ok) {
                    const revData = await revRes.json();
                    const city = revData.city || revData.locality || 'Ubicación actual';
                    const country = revData.countryCode || '';
                    WEATHER_CONFIG.city = `${city}${country ? ', ' + country : ''}`;

                    const titleEl = document.getElementById('weather-title');
                    if (titleEl) titleEl.textContent = `Clima — ${WEATHER_CONFIG.city}`;
                }
            } catch (e) {
                console.error('[Weather Geo]', e);
            }

            fetchWeather();
        },
        (error) => {
            console.error('[Weather Geo] Error:', error);
            alert('No se pudo obtener tu ubicación. Verifica los permisos.');
            badge.textContent = 'Live';
        },
        { timeout: 10000 }
    );
}

function renderWeatherError() {
    document.getElementById('weather-content').innerHTML = `
    <div class="widget-error">
      <div class="widget-error-icon">🌐</div>
      <div class="widget-error-msg">No se pudo obtener el clima</div>
      <div class="widget-error-retry" onclick="fetchWeather()">Reintentar</div>
    </div>`;
}
