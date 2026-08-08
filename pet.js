/* =============================================================
   pet.js — 简洁像素小猫 (32×32 网格 · 清晰块面)
   ============================================================= */

// 注入宠物样式
function injectPetStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .pet-container {
            position: fixed;
            bottom: 100px;
            right: 200px;
            z-index: 30;
            cursor: pointer;
            user-select: none;
            transition: transform 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .pet-container:hover {
            transform: scale(1.05);
        }
        .pet-container canvas {
            display: block;
            image-rendering: pixelated;
            image-rendering: crisp-edges;
            width: 128px;
            height: 128px;
        }

        .pet-bubble {
            position: absolute;
            bottom: 125px;
            left: 50%;
            transform: translateX(-50%) translateY(-4px);
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1.5px solid rgba(124, 58, 237, 0.20);
            border-radius: 18px;
            padding: 6px 18px;
            font-size: 0.85rem;
            font-weight: 500;
            color: #1e293b;
            font-family: "Inter", sans-serif;
            box-shadow: 0 8px 32px rgba(124, 58, 237, 0.12);
            opacity: 0;
            transform: translateX(-50%) translateY(-4px) scale(0.9);
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: none;
            white-space: nowrap;
            max-width: 220px;
            text-align: center;
        }
        .pet-bubble::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 8px solid rgba(255, 255, 255, 0.96);
        }
        .pet-bubble.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
        }

        @media (max-width: 600px) {
            .pet-container { bottom: 80px; right: 120px; transform: scale(0.8); transform-origin: bottom right; }
            .pet-container:hover { transform: scale(0.85); }
            .pet-bubble { font-size: 0.75rem; padding: 4px 14px; max-width: 160px; bottom: 110px; }
        }
        @media (max-width: 400px) {
            .pet-container { bottom: 70px; right: 80px; transform: scale(0.65); transform-origin: bottom right; }
            .pet-container:hover { transform: scale(0.7); }
            .pet-bubble { font-size: 0.7rem; padding: 3px 10px; max-width: 130px; bottom: 95px; }
        }
    `;
    document.head.appendChild(style);
}

// =============================================================
// 像素小猫
// =============================================================
class PixelPet {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = 'pet-container';
        document.body.appendChild(this.container);

        this.bubble = document.createElement('div');
        this.bubble.className = 'pet-bubble';
        this.container.appendChild(this.bubble);

        this.canvas = document.createElement('canvas');
        this.canvas.width = 128;
        this.canvas.height = 128;
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');

        // 32×32 网格，每格 4px
        this.grid = 32;
        this.ps = 4;

        // 颜色
        this.c = {
            body: '#c4b5fd',
            bodyDark: '#8b5cf6',
            bodyLight: '#ede9fe',
            ear: '#a78bfa',
            earInner: '#fbcfe8',
            eyeWhite: '#ffffff',
            pupil: '#4c1d95',
            highlight: '#ffffff',
            nose: '#f472b6',
            blush: '#fce7f3',
            mouth: '#f472b6',
            whisker: 'rgba(30,41,59,0.20)',
            paw: '#fbcfe8',
            belly: '#f5f3ff',
            stripe: '#8b5cf6',
            tail: '#c4b5fd',
            tailDark: '#8b5cf6',
        };

        // 状态
        this.state = 'idle';
        this.isBlinking = false;
        this.floatOffset = 0;
        this.jumpProgress = 0;
        this.isActionLocked = false;

        this.messages = [
            '喵 ~ 你好呀！', '摸我干嘛！', '今天心情不错 ~',
            '代码写完了吗？', '一起玩吧！', '好困啊 ~',
            '你真好！❤️', '哇！跳起来了！', '伸个懒腰 ~',
            '洗脸脸 ~', '嗯？怎么了？', '啾咪 ~ 💜'
        ];

        this.container.addEventListener('click', () => this.onClick());
        this.container.addEventListener('mouseenter', () => this.onHover());

        this.animate();
        this.startFloat();
        this.startBlinkCycle();
        this.startRandomActions();
        setTimeout(() => this.showMessage('喵 ~ 你好呀！', 2000), 1500);
    }

    // ----- 绘制工具 -----
    px(col, row) { return { x: col * this.ps, y: row * this.ps }; }
    drawPixel(ctx, col, row, color) {
        const { x, y } = this.px(col, row);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, this.ps, this.ps);
    }
    drawRect(ctx, c1, r1, c2, r2, color) {
        for (let r = r1; r <= r2; r++)
            for (let c = c1; c <= c2; c++)
                this.drawPixel(ctx, c, r, color);
    }
    drawCircle(ctx, cx, cy, radius, color) {
        for (let r = -radius; r <= radius; r++)
            for (let c = -radius; c <= radius; c++)
                if (c * c + r * r <= radius * radius)
                    this.drawPixel(ctx, cx + c, cy + r, color);
    }
    drawLine(ctx, x1, y1, x2, y2, color) {
        const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
        let err = dx - dy, cx = x1, cy = y1;
        while (true) {
            this.drawPixel(ctx, cx, cy, color);
            if (cx === x2 && cy === y2) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy;
                cx += sx; }
            if (e2 < dx) { err += dx;
                cy += sy; }
        }
    }

    // ----- 绘制小猫 -----
    drawPet(ctx) {
        const ps = this.ps;
        ctx.clearRect(0, 0, 128, 128);

        ctx.save();

        // 浮动
        if (this.state === 'idle' || this.state === 'blink') {
            ctx.translate(0, Math.sin(this.floatOffset) * 1.5);
        }

        // 跳跃
        if (this.state === 'jump') {
            const t = this.jumpProgress;
            ctx.translate(0, -Math.sin(t * Math.PI) * 20);
            ctx.translate(16, 16);
            ctx.rotate(Math.sin(t * Math.PI) * 0.12);
            ctx.translate(-16, -16);
        }

        // 伸懒腰
        if (this.state === 'stretch') {
            const t = this.stateTimer / this.actionDuration;
            ctx.translate(16, 20);
            ctx.scale(1, 1 + t * 0.12);
            ctx.translate(-16, -20);
        }

        // 挥手
        if (this.state === 'wave') {
            const t = this.stateTimer / this.actionDuration;
            ctx.translate(16, 16);
            ctx.rotate(Math.sin(t * Math.PI * 3) * 0.12);
            ctx.translate(-16, -16);
        }

        // ---- 绘制各部分 ----
        // 尾巴
        const tailPoints = [
            [23, 16],
            [25, 16],
            [27, 17],
            [28, 19],
            [27, 21],
            [25, 22],
            [23, 22]
        ];
        tailPoints.forEach(([c, r]) => {
            this.drawPixel(ctx, c, r, this.c.tail);
            this.drawPixel(ctx, c + 1, r, this.c.tail);
            this.drawPixel(ctx, c - 1, r, this.c.tail);
        });

        // 后腿
        this.drawRect(ctx, 7, 22, 10, 25, this.c.body);
        this.drawRect(ctx, 21, 22, 24, 25, this.c.body);
        this.drawPixel(ctx, 8, 26, this.c.paw);
        this.drawPixel(ctx, 9, 26, this.c.paw);
        this.drawPixel(ctx, 22, 26, this.c.paw);
        this.drawPixel(ctx, 23, 26, this.c.paw);

        // 身体
        for (let r = 13; r <= 22; r++) {
            for (let c = 9; c <= 22; c++) {
                const dx = (c - 15.5) / 7;
                const dy = (r - 17.5) / 5;
                if (dx * dx + dy * dy <= 1) {
                    if (r > 18 && c > 11 && c < 20) {
                        this.drawPixel(ctx, c, r, this.c.belly);
                    } else {
                        this.drawPixel(ctx, c, r, this.c.body);
                    }
                }
            }
        }
        // 斑纹
        [
            [12, 17],
            [13, 18],
            [19, 17],
            [18, 18],
            [14, 19],
            [17, 19]
        ].forEach(([c, r]) => this.drawPixel(ctx, c, r, this.c.stripe));

        // 前腿
        this.drawRect(ctx, 11, 21, 13, 24, this.c.body);
        this.drawRect(ctx, 18, 21, 20, 24, this.c.body);
        this.drawPixel(ctx, 11, 25, this.c.paw);
        this.drawPixel(ctx, 12, 25, this.c.paw);
        this.drawPixel(ctx, 19, 25, this.c.paw);
        this.drawPixel(ctx, 20, 25, this.c.paw);

        // 头部 (圆形)
        const headCx = 16,
            headCy = 10,
            headR = 7;
        for (let r = -headR; r <= headR; r++) {
            for (let c = -headR; c <= headR; c++) {
                if (c * c + r * r <= headR * headR) {
                    const col = headCx + c,
                        row = headCy + r;
                    // 脸颊
                    if ((col === 10 || col === 22) && row > 10) {
                        this.drawPixel(ctx, col, row, this.c.body);
                        this.drawPixel(ctx, col + (col < 16 ? -1 : 1), row, this.c.body);
                    } else {
                        this.drawPixel(ctx, col, row, this.c.body);
                    }
                }
            }
        }
        // 下巴
        for (let c = 14; c <= 18; c++) {
            this.drawPixel(ctx, c, 16, this.c.bodyLight);
        }

        // 耳朵
        for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 5 - r; c++) {
                this.drawPixel(ctx, 9 + c, 2 + r, this.c.ear);
                if (c > 0 && c < 4 - r && r > 0)
                    this.drawPixel(ctx, 9 + c, 2 + r, this.c.earInner);
                this.drawPixel(ctx, 18 + c, 2 + r, this.c.ear);
                if (c > 0 && c < 4 - r && r > 0)
                    this.drawPixel(ctx, 18 + c, 2 + r, this.c.earInner);
            }
        }

        // 眼睛
        const eyeY = 9;
        if (!this.isBlinking) {
            // 左眼
            this.drawCircle(ctx, 12, eyeY, 3, this.c.eyeWhite);
            this.drawCircle(ctx, 13, eyeY, 1.5, this.c.pupil);
            this.drawPixel(ctx, 13, eyeY - 1, this.c.highlight);
            // 右眼
            this.drawCircle(ctx, 20, eyeY, 3, this.c.eyeWhite);
            this.drawCircle(ctx, 19, eyeY, 1.5, this.c.pupil);
            this.drawPixel(ctx, 19, eyeY - 1, this.c.highlight);
        } else {
            // 闭眼
            this.drawLine(ctx, 10, eyeY, 14, eyeY, this.c.bodyDark);
            this.drawLine(ctx, 18, eyeY, 22, eyeY, this.c.bodyDark);
        }

        // 鼻子
        this.drawPixel(ctx, 15, 12, this.c.nose);
        this.drawPixel(ctx, 16, 12, this.c.nose);
        this.drawPixel(ctx, 15, 13, this.c.nose);
        this.drawPixel(ctx, 16, 13, this.c.nose);

        // 嘴巴
        this.drawPixel(ctx, 14, 14, this.c.mouth);
        this.drawPixel(ctx, 17, 14, this.c.mouth);
        this.drawPixel(ctx, 15, 15, this.c.mouth);
        this.drawPixel(ctx, 16, 15, this.c.mouth);

        // 腮红
        this.drawCircle(ctx, 10, 13, 2, this.c.blush);
        this.drawCircle(ctx, 22, 13, 2, this.c.blush);

        // 胡须
        this.drawLine(ctx, 7, 11, 3, 10, this.c.whisker);
        this.drawLine(ctx, 7, 12, 2, 12, this.c.whisker);
        this.drawLine(ctx, 7, 13, 3, 14, this.c.whisker);
        this.drawLine(ctx, 25, 11, 29, 10, this.c.whisker);
        this.drawLine(ctx, 25, 12, 30, 12, this.c.whisker);
        this.drawLine(ctx, 25, 13, 29, 14, this.c.whisker);

        // 额头斑纹
        this.drawPixel(ctx, 15, 5, this.c.stripe);
        this.drawPixel(ctx, 16, 5, this.c.stripe);
        this.drawPixel(ctx, 17, 5, this.c.stripe);

        ctx.restore();
    }

    // ----- 动画循环 -----
    animate() {
        this.drawPet(this.ctx);
        requestAnimationFrame(() => this.animate());
    }

    // ----- 定时器 -----
    startFloat() {
        setInterval(() => { this.floatOffset += 0.04; }, 30);
    }

    startBlinkCycle() {
        setInterval(() => {
            if (!this.isBlinking && this.state === 'idle') {
                this.isBlinking = true;
                setTimeout(() => { this.isBlinking = false; }, 150);
            }
        }, 2500 + Math.random() * 2000);
    }

    startRandomActions() {
        setInterval(() => {
            if (this.state === 'idle' && !this.isActionLocked) {
                const actions = ['stretch', 'wave', 'idle', 'idle'];
                const chosen = actions[Math.floor(Math.random() * actions.length)];
                if (chosen !== 'idle') this.performAction(chosen);
            }
        }, 5000 + Math.random() * 6000);
    }

    performAction(action) {
        if (this.isActionLocked) return;
        this.isActionLocked = true;
        this.state = action;
        this.stateTimer = 0;
        this.actionDuration = 1800 + Math.random() * 1200;

        const msgs = {
            'stretch': ['伸个懒腰 ~ 🐾', '好舒服啊 ~', '睡醒了 ~'],
            'wave': ['嗨！你好呀 ~', '看这里！👋', '喵 ~'],
        };
        if (Math.random() > 0.5 && msgs[action]) {
            this.showMessage(msgs[action][Math.floor(Math.random() * msgs[action].length)], 1600);
        }

        clearTimeout(this.actionTimeout);
        this.actionTimeout = setTimeout(() => {
            this.state = 'idle';
            this.isActionLocked = false;
        }, this.actionDuration);
    }

    // ----- 交互 -----
    onClick() {
        if (this.isActionLocked) return;
        this.isActionLocked = true;
        this.state = 'jump';
        this.jumpProgress = 0;

        const msgs = ['哇！跳起来了！', '好高呀！', '嘿嘿 ~', '喵！'];
        this.showMessage(msgs[Math.floor(Math.random() * msgs.length)], 1400);

        const jumpInterval = setInterval(() => {
            this.jumpProgress += 0.06;
            if (this.jumpProgress >= 1) {
                this.jumpProgress = 1;
                this.state = 'idle';
                this.isActionLocked = false;
                clearInterval(jumpInterval);
            }
        }, 20);

        setTimeout(() => {
            if (this.state !== 'jump') return;
            const msgs2 = ['摸我干嘛！', '嘿嘿 ~', '你真好 ❤️', '好痒 ~'];
            this.showMessage(msgs2[Math.floor(Math.random() * msgs2.length)], 1600);
        }, 400);
    }

    onHover() {
        this.container.style.transform = 'scale(1.05) rotate(-2deg)';
        setTimeout(() => { this.container.style.transform = ''; }, 300);
    }

    showMessage(text, duration = 2500) {
        this.bubble.textContent = text;
        this.bubble.classList.add('show');
        clearTimeout(this.messageTimeout);
        this.messageTimeout = setTimeout(() => {
            this.bubble.classList.remove('show');
        }, duration);
    }
}

// =============================================================
// 启动
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    injectPetStyles();
    setTimeout(() => {
        const pet = new PixelPet();
        window.__pet = pet;
    }, 500);
});