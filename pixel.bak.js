/* =============================================================
   pixel.js — 浮动像素画板（点击任意区域先展开，展开后绘画，仅按钮收回）
   ============================================================= */

// 首先显示画板（因为本模块已加载）
document.addEventListener('DOMContentLoaded', function() {
    const wrapper = document.getElementById('floatPixelWrapper');
    if (wrapper) wrapper.classList.add('show');
});

/* =============================================================
   浮动像素画板类
   ============================================================= */
class FloatPixelArt {
    constructor() {
        this.wrapper = document.getElementById('floatPixelWrapper');
        this.canvas = document.getElementById('floatPixelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.overlay = document.getElementById('pixelOverlay');

        this.gridSize = 24;
        this.colors = [];
        this.currentColor = '#ff6b6b';
        this.isDrawing = false;
        this.mode = 'draw';
        this.isExpanded = false;

        // 初始化网格
        for (let i = 0; i < this.gridSize; i++) {
            this.colors[i] = new Array(this.gridSize).fill(null);
        }

        // ---------- 切换逻辑 ----------
        // 点击画板任何区域（包括画布）若未展开则展开，若已展开则忽略（让画布事件处理）
        this.wrapper.addEventListener('click', (e) => {
            // 如果点击的是按钮或输入框，由它们自己的事件处理
            if (e.target.closest('button') || e.target.closest('input')) return;

            // 如果已经展开，不做任何切换（绘画由 canvas 事件处理）
            if (this.isExpanded) return;

            // 未展开：点击任何区域（包括画布）都展开
            this.expand();
        });

        // “收回”按钮 —— 唯一收回入口
        document.getElementById('floatClose').addEventListener('click', (e) => {
            e.stopPropagation();
            this.collapse();
        });

        // ---------- 工具栏事件 ----------
        document.getElementById('floatColor').addEventListener('input', (e) => {
            this.currentColor = e.target.value;
        });
        document.getElementById('floatClear').addEventListener('click', () => this.clear());
        document.getElementById('floatMode').addEventListener('click', () => {
            this.mode = (this.mode === 'draw') ? 'erase' : 'draw';
            const btn = document.getElementById('floatMode');
            btn.textContent = this.mode === 'draw' ? '绘制' : '擦除';
            btn.classList.toggle('active-tool');
        });

        // ---------- 绘画事件（鼠标） ----------
        this.canvas.addEventListener('mousedown', (e) => {
            // 如果画板未展开，先展开，不执行绘画
            if (!this.isExpanded) {
                this.expand();
                return;
            }
            // 已展开则正常绘画
            this.onMouseDown(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isExpanded) return; // 未展开不绘画
            this.onMouseMove(e);
        });

        this.canvas.addEventListener('mouseup', () => this.onMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

        // 触屏事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // 如果画板未展开，先展开，不执行绘画
            if (!this.isExpanded) {
                this.expand();
                return;
            }
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width * this.canvas.width;
            const y = (touch.clientY - rect.top) / rect.height * this.canvas.height;
            this.onPointerDown(x, y);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (!this.isExpanded) return;
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width * this.canvas.width;
            const y = (touch.clientY - rect.top) / rect.height * this.canvas.height;
            this.onPointerMove(x, y);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => this.onMouseUp());

        // ---------- 初始化 ----------
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.render();
    }

    resizeCanvas() {
        const w = this.canvas.offsetWidth;
        const h = this.canvas.offsetHeight;
        if (w > 0 && h > 0) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.pixelSize = w / this.gridSize;
            this.render();
        }
    }

    getGridIndex(x, y) {
        const col = Math.floor(x / this.pixelSize);
        const row = Math.floor(y / this.pixelSize);
        if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) return null;
        return { col, row };
    }

    onPointerDown(x, y) {
        this.isDrawing = true;
        const idx = this.getGridIndex(x, y);
        if (!idx) return;
        const { col, row } = idx;
        if (this.mode === 'draw') {
            this.colors[row][col] = this.currentColor;
        } else {
            this.colors[row][col] = null;
        }
        this.render();
    }

    onPointerMove(x, y) {
        if (!this.isDrawing) return;
        const idx = this.getGridIndex(x, y);
        if (!idx) return;
        const { col, row } = idx;
        if (this.mode === 'draw') {
            this.colors[row][col] = this.currentColor;
        } else {
            this.colors[row][col] = null;
        }
        this.render();
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * this.canvas.width;
        const y = (e.clientY - rect.top) / rect.height * this.canvas.height;
        this.onPointerDown(x, y);
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * this.canvas.width;
        const y = (e.clientY - rect.top) / rect.height * this.canvas.height;
        this.onPointerMove(x, y);
    }

    onMouseUp() {
        this.isDrawing = false;
    }

    clear() {
        for (let i = 0; i < this.gridSize; i++) {
            this.colors[i] = new Array(this.gridSize).fill(null);
        }
        this.render();
    }

    render() {
        const ctx = this.ctx;
        const ps = this.pixelSize;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        // 网格
        ctx.strokeStyle = '#e9edf4';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.gridSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * ps, 0);
            ctx.lineTo(i * ps, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * ps);
            ctx.lineTo(w, i * ps);
            ctx.stroke();
        }

        for (let r = 0; r < this.gridSize; r++) {
            for (let c = 0; c < this.gridSize; c++) {
                const color = this.colors[r][c];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(c * ps, r * ps, ps, ps);
                }
            }
        }
    }

    expand() {
        if (this.isExpanded) return;
        this.isExpanded = true;
        this.wrapper.classList.add('expanded');
        this.overlay.classList.add('active');
        setTimeout(() => this.resizeCanvas(), 550);
    }

    collapse() {
        if (!this.isExpanded) return;
        this.isExpanded = false;
        this.wrapper.classList.remove('expanded');
        this.overlay.classList.remove('active');
        setTimeout(() => this.resizeCanvas(), 550);
    }
}

/* =============================================================
   启动画板
   ============================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const pixel = new FloatPixelArt();
    window.__floatPixel = pixel;
});