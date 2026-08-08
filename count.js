/* =============================================================
   counter.js — 访客计数器 (卡片右上侧)
   ============================================================= */

// 注入样式
function injectCounterStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .visitor-counter {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 0.7rem;
            color: #94a3b8;
            font-weight: 400;
            letter-spacing: 0.02em;
            user-select: none;
            background: rgba(255,255,255,0.30);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            padding: 4px 14px 4px 12px;
            border-radius: 30px;
            border: 1px solid rgba(255,255,255,0.20);
            margin-left: auto;  /* 靠右对齐 */
            flex-shrink: 0;
            white-space: nowrap;
        }
        .visitor-counter .icon {
            font-size: 0.8rem;
            margin-right: 2px;
        }
        .visitor-counter .number {
            font-weight: 600;
            color: #7c3aed;
            font-variant-numeric: tabular-nums;
            min-width: 20px;
            display: inline-block;
            text-align: center;
        }
        .visitor-counter .label {
            color: #94a3b8;
        }
        .visitor-counter .dot {
            display: inline-block;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #34d399;
            margin-right: 2px;
            animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
        }

        /* 响应式：小屏隐藏文字保留数字 */
        @media (max-width: 480px) {
            .visitor-counter .label {
                display: none;
            }
            .visitor-counter {
                padding: 4px 10px;
                gap: 4px;
            }
        }
        @media (max-width: 380px) {
            .visitor-counter .dot {
                display: none;
            }
            .visitor-counter .icon {
                display: none;
            }
        }
    `;
    document.head.appendChild(style);
}

// =============================================================
// 访客计数器类
// =============================================================
class VisitorCounter {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'visitor_count';
        this.useBusuanzi = options.useBusuanzi || false;
        this.count = 0;

        // 初始化
        this.init();
    }

    init() {
        // 如果使用不蒜子
        if (this.useBusuanzi) {
            this.initBusuanzi();
            return;
        }

        // 使用 localStorage
        this.initLocalStorage();
    }

    initLocalStorage() {
        try {
            let count = parseInt(localStorage.getItem(this.storageKey));
            if (isNaN(count) || count < 0) {
                count = 0;
            }
            // 每次访问 +1
            count += 1;
            localStorage.setItem(this.storageKey, String(count));
            this.count = count;
            this.render(count);
        } catch (e) {
            console.warn('访客计数失败:', e);
            this.count = 0;
            this.render(0);
        }
    }

    initBusuanzi() {
        // 加载不蒜子脚本
        const script = document.createElement('script');
        script.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js';
        script.async = true;
        script.onload = () => {
            // 等待不蒜子渲染完成
            setTimeout(() => {
                const el = document.getElementById('busuanzi_value_site_pv');
                if (el) {
                    const count = parseInt(el.textContent) || 0;
                    this.count = count;
                    this.render(count);
                }
            }, 500);
        };
        script.onerror = () => {
            // 不蒜子加载失败，回退到 localStorage
            console.warn('不蒜子加载失败，回退到本地存储');
            this.useBusuanzi = false;
            this.initLocalStorage();
        };
        document.head.appendChild(script);

        // 先显示占位
        this.render('...');
    }

    render(count) {
        // 查找主卡片的 header
        const header = document.querySelector('.card .header');
        if (!header) {
            // 如果没有找到，则延迟重试或放到其他位置
            setTimeout(() => this.render(count), 100);
            return;
        }

        // 检查是否已经存在计数器
        let container = header.querySelector('.visitor-counter');
        if (!container) {
            container = document.createElement('div');
            container.className = 'visitor-counter';
            // 插入到 header 的末尾（flex 会自动靠右因为 margin-left: auto）
            header.appendChild(container);
        }

        // 更新内容
        const dot = '<span class="dot"></span>';
        const icon = '🤵‍';
        const label = '位朋友来访';
        const num = typeof count === 'number' ? count.toLocaleString() : count;

        container.innerHTML = `
            ${dot}
            <span class="icon">${icon}</span>
            <span class="number">${num}</span>
            <span class="label">${label}</span>
        `;
    }
}

// =============================================================
// 启动
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    injectCounterStyles();

    // 判断是否使用不蒜子（通过 URL 参数）
    const useBusuanzi = new URLSearchParams(window.location.search).get('busuanzi') === 'true';

    // 延迟确保 DOM 渲染完成
    setTimeout(() => {
        const counter = new VisitorCounter({
            useBusuanzi: useBusuanzi,
            storageKey: 'jyuzung_visitor_count'
        });
        window.__counter = counter;
    }, 300);
});