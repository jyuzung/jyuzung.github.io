/* =============================================================
   weather.js — 天气获取 + 粒子背景
   ============================================================= */

// 首先显示天气相关的 UI（因为本模块已加载）
document.addEventListener('DOMContentLoaded', function() {
    const weatherBar = document.getElementById('weatherBar');
    const citySwitcher = document.getElementById('citySwitcher');
    if (weatherBar) weatherBar.classList.add('show');
    if (citySwitcher) citySwitcher.classList.add('show');
});

/* =============================================================
   🌤  配置区
   ============================================================= */
const CONFIG = {
    defaultCity: '广州',
    particleCount: {
        sunny: 70,
        cloudy: 40,
        rainy: 160,
        snowy: 130,
        foggy: 50,
        thunder: 110,
        default: 60,
    },
    refreshInterval: 10 * 60 * 1000,
};

/* =============================================================
   工具函数
   ============================================================= */
function lerp(a, b, t) { return a + (b - a) * t; }

function rand(min, max) { return Math.random() * (max - min) + min; }

function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

/* =============================================================
   天气状态映射
   ============================================================= */
const WEATHER_MAP = {
    sunny: {
        keywords: ['sunny', 'clear', 'fair', 'hot'],
        emoji: '☀️',
        label: '晴天',
        bg: ['#f9e5b3', '#f6d5a8', '#f0c8a0'],
        particle: {
            color: ['#fde68a', '#fcd34d', '#ffffff', '#fbbf24'],
            size: [3, 12],
            speed: [0.2, 0.5],
            count: CONFIG.particleCount.sunny,
            type: 'float',
            glow: true,
        },
        bodyBg: 'linear-gradient(145deg, #f9e5b3 0%, #f6d5a8 40%, #f0c8a0 100%)',
    },
    cloudy: {
        keywords: ['cloudy', 'overcast', 'partly cloudy', 'mostly cloudy'],
        emoji: '☁️',
        label: '多云',
        bg: ['#d5d8df', '#c8ccd8', '#b8c0cb'],
        particle: {
            color: ['#e8ecf1', '#d5d8df', '#c8ccd8', '#f0f2f5'],
            size: [15, 40],
            speed: [0.15, 0.35],
            count: CONFIG.particleCount.cloudy,
            type: 'drift',
            glow: false,
        },
        bodyBg: 'linear-gradient(145deg, #d5d8df 0%, #c8ccd8 50%, #b8c0cb 100%)',
    },
    rainy: {
        keywords: ['rain', 'drizzle', 'shower', 'light rain', 'moderate rain', 'heavy rain', 'rainy'],
        emoji: '🌧️',
        label: '雨天',
        bg: ['#2c3e50', '#3a5a6f', '#4a6a7f'],
        particle: {
            color: ['#8bb8d4', '#a8d0e6', '#c8e4f0', '#7aa9c4'],
            size: [1.5, 4],
            speed: [6, 12],
            count: CONFIG.particleCount.rainy,
            type: 'fall',
            glow: false,
            tilt: true,
        },
        bodyBg: 'linear-gradient(145deg, #2c3e50 0%, #3a5a6f 40%, #4a6a7f 100%)',
    },
    snowy: {
        keywords: ['snow', 'sleet', 'blizzard', 'snowy', 'light snow', 'heavy snow'],
        emoji: '❄️',
        label: '雪天',
        bg: ['#e8ecf1', '#d5dce6', '#c0cbd8'],
        particle: {
            color: ['#ffffff', '#f0f4f8', '#e8ecf1', '#fafcff'],
            size: [3, 10],
            speed: [0.8, 2.0],
            count: CONFIG.particleCount.snowy,
            type: 'snow',
            glow: false,
            spin: true,
        },
        bodyBg: 'linear-gradient(145deg, #e8ecf1 0%, #d5dce6 50%, #c0cbd8 100%)',
    },
    foggy: {
        keywords: ['mist', 'fog', 'haze', 'foggy'],
        emoji: '🌫️',
        label: '雾天',
        bg: ['#d5d8df', '#c8ccd5', '#e0e4eb'],
        particle: {
            color: ['#f0f2f5', '#e8ecf1', '#ffffff', '#d5d8df'],
            size: [30, 60],
            speed: [0.1, 0.25],
            count: CONFIG.particleCount.foggy,
            type: 'drift',
            glow: true,
            opacity: 0.25,
        },
        bodyBg: 'linear-gradient(145deg, #d5d8df 0%, #c8ccd5 40%, #e0e4eb 100%)',
    },
    thunder: {
        keywords: ['thunder', 'thunderstorm', 'lightning', 'storm'],
        emoji: '⛈️',
        label: '雷雨',
        bg: ['#1a1a2e', '#16213e', '#0f3460'],
        particle: {
            color: ['#6b9fc4', '#8bb8d4', '#a8d0e6', '#4a8aaf'],
            size: [1.5, 4.5],
            speed: [7, 14],
            count: CONFIG.particleCount.thunder,
            type: 'fall',
            glow: false,
            tilt: true,
            lightning: true,
        },
        bodyBg: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
    },
};

function matchWeatherType(conditionText) {
    const text = conditionText.toLowerCase();
    for (const [type, data] of Object.entries(WEATHER_MAP)) {
        for (const kw of data.keywords) {
            if (text.includes(kw)) return type;
        }
    }
    return 'sunny';
}

/* =============================================================
   粒子系统 (Canvas)
   ============================================================= */
class Particle {
    constructor(canvasWidth, canvasHeight, config) {
        this.w = canvasWidth;
        this.h = canvasHeight;
        this.reset(config);
    }

    reset(config) {
        const { color, size, speed, type, glow, tilt, spin, opacity } = config;
        this.type = type || 'float';
        this.glow = glow || false;
        this.tilt = tilt || false;
        this.spin = spin || false;

        this.color = color[randInt(0, color.length - 1)];
        this.size = rand(size[0], size[1]);
        this.opacity = opacity !== undefined ? rand(opacity * 0.6, opacity) : rand(0.5, 1.0);

        this.x = rand(0, this.w);
        this.y = rand(0, this.h);

        const spd = rand(speed[0], speed[1]);
        if (type === 'fall' || type === 'snow') {
            this.vx = tilt ? rand(-0.6, 0.6) : rand(-0.2, 0.2);
            this.vy = spd * (type === 'snow' ? rand(0.3, 1.0) : 1.0);
        } else if (type === 'drift') {
            this.vx = rand(-spd, spd);
            this.vy = rand(-spd * 0.3, spd * 0.3);
        } else {
            this.vx = rand(-spd, spd);
            this.vy = rand(-spd, spd);
        }

        this.rotation = rand(0, Math.PI * 2);
        this.rotationSpeed = spin ? rand(-0.02, 0.02) : 0;
        this.life = 0;
        this.maxLife = rand(40, 120);
        this.twinkle = glow ? rand(0, 1) : 0;
        this.twinkleSpeed = glow ? rand(0.01, 0.03) : 0;
    }

    update(w, h) {
        this.w = w;
        this.h = h;
        this.x += this.vx;
        this.y += this.vy;

        if (this.type === 'fall' || this.type === 'snow') {
            if (this.y > this.h + 20) {
                this.y = -20;
                this.x = rand(0, this.w);
                this.vy = rand(0.3, 1.0) * (this.type === 'snow' ? 1.5 : 4);
            }
            if (this.x < -20) this.x = this.w + 20;
            if (this.x > this.w + 20) this.x = -20;
        } else {
            if (this.x < -50) this.x = this.w + 50;
            if (this.x > this.w + 50) this.x = -50;
            if (this.y < -50) this.y = this.h + 50;
            if (this.y > this.h + 50) this.y = -50;
        }

        if (this.spin) this.rotation += this.rotationSpeed;
        if (this.twinkle) {
            this.twinkle += this.twinkleSpeed;
            if (this.twinkle > 1 || this.twinkle < 0) this.twinkleSpeed *= -1;
        }
        if (this.life < this.maxLife) this.life++;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / this.maxLife) * this.opacity;
        const twinkleFactor = this.twinkle ? 0.5 + 0.5 * Math.sin(this.twinkle * Math.PI * 2) : 1;

        ctx.save();
        ctx.globalAlpha = alpha * twinkleFactor;

        if (this.glow) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 20;
        }

        ctx.translate(this.x, this.y);

        if (this.spin) {
            ctx.rotate(this.rotation);
        }

        if (this.type === 'fall' && this.tilt) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size * 0.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-4, -6);
            ctx.lineTo(4, 6);
            ctx.stroke();
        } else if (this.type === 'snow') {
            const r = this.size * 0.6;
            ctx.fillStyle = this.color;
            if (this.size > 6) {
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    const outer = r;
                    const inner = r * 0.4;
                    const rad = i % 2 === 0 ? outer : inner;
                    if (i === 0) ctx.moveTo(rad * Math.cos(angle), rad * Math.sin(angle));
                    else ctx.lineTo(rad * Math.cos(angle), rad * Math.sin(angle));
                }
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'drift' && this.size > 20) {
            const r = this.size * 0.5;
            ctx.fillStyle = this.color;
            ctx.globalAlpha = alpha * twinkleFactor * 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.arc(-r * 0.7, -r * 0.3, r * 0.7, 0, Math.PI * 2);
            ctx.arc(r * 0.7, -r * 0.3, r * 0.7, 0, Math.PI * 2);
            ctx.arc(-r * 0.3, r * 0.3, r * 0.6, 0, Math.PI * 2);
            ctx.arc(r * 0.3, r * 0.3, r * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

/* =============================================================
   主控制器
   ============================================================= */
class WeatherBackground {
    constructor() {
        this.canvas = document.getElementById('weather-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.particles = [];
        this.currentWeather = 'sunny';
        this.lightningFlash = 0;
        this.lightningTimer = 0;

        this.city = CONFIG.defaultCity;
        this.temperature = '--';
        this.conditionText = '加载中';

        this.isLoading = false;
        this.animationId = null;

        this.cityDisplay = document.getElementById('cityDisplay');
        this.tempDisplay = document.getElementById('tempDisplay');
        this.conditionDisplay = document.getElementById('conditionDisplay');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        document.getElementById('refreshBtn').addEventListener('click', () => this.fetchWeather());
        document.getElementById('switchBtn').addEventListener('click', () => this.switchCity());
        document.getElementById('cityInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.switchCity();
        });

        this.fetchWeather();
        setInterval(() => this.fetchWeather(), CONFIG.refreshInterval);
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        for (const p of this.particles) {
            p.w = this.width;
            p.h = this.height;
        }
    }

    async fetchWeather() {
        if (this.isLoading) return;
        this.isLoading = true;

        const city = encodeURIComponent(this.city);
        const url = `https://wttr.in/${city}?format=%C|%t|%l&lang=zh`;

        try {
            const resp = await fetch(url, {
                signal: AbortSignal.timeout(8000),
                headers: { 'Accept': 'text/plain' }
            });
            const text = await resp.text();

            let cleanText = text;
            if (text.includes('<') || text.includes('>')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                cleanText = doc.body.textContent || '晴';
            }

            const parts = cleanText.split('|').map(s => s.trim());
            const conditionRaw = parts[0] || '晴';
            const tempRaw = parts[1] || '--°C';
            const locationRaw = parts[2] || this.city;

            const tempMatch = tempRaw.match(/([+-]?\d+)°C/);
            this.temperature = tempMatch ? tempMatch[1] + '°C' : tempRaw;

            const weatherType = matchWeatherType(conditionRaw);
            this.currentWeather = weatherType;
            this.conditionText = conditionRaw;

            const weatherData = WEATHER_MAP[weatherType];

            this.cityDisplay.textContent = `📍 ${locationRaw}`;
            this.tempDisplay.textContent = this.temperature;

            this.conditionDisplay.innerHTML = '';
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = weatherData.emoji;
            const textSpan = document.createElement('span');
            textSpan.textContent = conditionRaw;
            this.conditionDisplay.appendChild(emojiSpan);
            this.conditionDisplay.appendChild(textSpan);

            this.switchWeather(weatherType);

        } catch (err) {
            console.warn('天气获取失败，使用默认天气', err);
            this.currentWeather = 'sunny';
            this.switchWeather('sunny');
            this.cityDisplay.textContent = `📍 ${this.city}`;
            this.tempDisplay.textContent = '--°C';
            this.conditionDisplay.innerHTML = '';
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = '☀️';
            const textSpan = document.createElement('span');
            textSpan.textContent = '晴 (离线)';
            this.conditionDisplay.appendChild(emojiSpan);
            this.conditionDisplay.appendChild(textSpan);
        }

        this.isLoading = false;
    }

    switchCity() {
        const input = document.getElementById('cityInput');
        const val = input.value.trim();
        if (val && val !== this.city) {
            this.city = val;
            this.fetchWeather();
        }
    }

    switchWeather(type) {
        const data = WEATHER_MAP[type] || WEATHER_MAP.sunny;
        document.body.style.background = data.bodyBg;

        const config = data.particle;
        const count = config.count || CONFIG.particleCount.default;

        this.particles = [];
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.width, this.height, config));
        }

        this.lightningFlash = 0;
        this.lightningTimer = 0;

        if (!this.animationId) {
            this.animate();
        }
    }

    animate() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        ctx.clearRect(0, 0, w, h);

        if (this.currentWeather === 'thunder') {
            this.lightningTimer++;
            if (this.lightningTimer > rand(60, 200)) {
                this.lightningFlash = 1.0;
                this.lightningTimer = 0;
            }
            if (this.lightningFlash > 0) {
                this.lightningFlash *= 0.92;
                if (this.lightningFlash > 0.05) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.25})`;
                    ctx.fillRect(0, 0, w, h);
                    if (Math.random() > 0.7) {
                        ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlash * 0.15})`;
                        ctx.fillRect(0, 0, w, h);
                    }
                } else {
                    this.lightningFlash = 0;
                }
            }
        }

        const config = WEATHER_MAP[this.currentWeather]?.particle || WEATHER_MAP.sunny.particle;
        for (const p of this.particles) {
            p.update(w, h);
            p.draw(ctx);
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

/* =============================================================
   启动天气
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const app = new WeatherBackground();
    window.__weatherApp = app;
    window.addEventListener('beforeunload', () => app.stop());
});