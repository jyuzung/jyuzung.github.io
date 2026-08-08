/* =============================================================
   guestbook.js — 左侧可收起留言板 + MockAPI 云端存储
   ============================================================= */

// API 配置
const API_BASE = 'https://6a75506a32ae1141278342d5.mockapi.io/v1/gbData';

// =============================================================
// 1. 注入侧边栏样式（避免污染主样式）
// =============================================================
function injectGuestbookStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* ----- 侧边栏容器 ----- */
        .gb-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            width: 380px;
            max-width: 85vw;
            z-index: 50;
            background: rgba(255, 255, 255, 0.75);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-right: 1px solid rgba(255, 255, 255, 0.4);
            box-shadow: 4px 0 40px rgba(0, 0, 0, 0.08);
            transform: translateX(-100%);
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: flex;
            flex-direction: column;
            padding: 1.5rem 1.2rem 1.2rem;
            font-family: "Inter", -apple-system, sans-serif;
            overflow: hidden;
        }
        .gb-sidebar.open {
            transform: translateX(0);
        }

        /* ----- 切换按钮（固定在左侧边缘） ----- */
        .gb-toggle-btn {
            position: fixed;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 51;
            background: rgba(255, 255, 255, 0.70);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.5);
            border-left: none;
            border-radius: 0 16px 16px 0;
            padding: 0.6rem 0.4rem 0.6rem 0.6rem;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 2px 0 16px rgba(0, 0, 0, 0.04);
            color: #1e293b;
            line-height: 1;
            user-select: none;
        }
        .gb-toggle-btn:hover {
            background: rgba(255, 255, 255, 0.90);
            padding-left: 0.8rem;
            box-shadow: 4px 0 24px rgba(0, 0, 0, 0.08);
        }
        /* 侧边栏打开时，按钮隐藏或偏移 */
        .gb-sidebar.open ~ .gb-toggle-btn {
            opacity: 0;
            pointer-events: none;
        }

        /* ----- 侧边栏头部 ----- */
        .gb-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
            padding-bottom: 0.8rem;
            border-bottom: 1px solid rgba(203, 213, 225, 0.3);
            margin-bottom: 0.8rem;
        }
        .gb-header .title {
            font-weight: 700;
            font-size: 1.1rem;
            color: #0f172a;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        .gb-header .title .count {
            font-size: 0.7rem;
            font-weight: 400;
            color: #94a3b8;
            background: #e9edf4;
            padding: 0.05rem 0.6rem;
            border-radius: 30px;
        }
        .gb-header .close-btn {
            background: none;
            border: none;
            font-size: 1.4rem;
            color: #94a3b8;
            cursor: pointer;
            padding: 0 0.2rem;
            transition: color 0.2s;
            font-family: inherit;
            line-height: 1;
        }
        .gb-header .close-btn:hover {
            color: #1e293b;
        }

        /* ----- 操作栏（清空按钮） ----- */
        .gb-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
            margin-bottom: 0.6rem;
        }
        .gb-actions button {
            background: #f1f4f9;
            border: none;
            border-radius: 30px;
            padding: 0.2rem 0.8rem;
            font-size: 0.7rem;
            font-weight: 500;
            color: #475569;
            cursor: pointer;
            transition: 0.2s;
            font-family: inherit;
        }
        .gb-actions button:hover {
            background: #e2e8f0;
            color: #0f172a;
        }
        .gb-actions .clear-btn {
            background: rgba(239, 68, 68, 0.10);
            color: #ef4444;
        }
        .gb-actions .clear-btn:hover {
            background: rgba(239, 68, 68, 0.20);
        }

        /* ----- 留言列表（可滚动） ----- */
        .gb-list {
            flex: 1;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            padding-right: 4px;
            margin-bottom: 0.8rem;
            min-height: 0;
        }
        .gb-list::-webkit-scrollbar {
            width: 3px;
        }
        .gb-list::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.03);
            border-radius: 10px;
        }
        .gb-list::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }

        .gb-item {
            background: rgba(255, 255, 255, 0.50);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border-radius: 0.8rem;
            padding: 0.6rem 0.8rem;
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.2s;
            flex-shrink: 0;
        }
        .gb-item:hover {
            background: rgba(255, 255, 255, 0.75);
        }
        .gb-item .meta {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.2rem;
            flex-wrap: wrap;
        }
        .gb-item .avatar-letter {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: #fff;
            font-size: 0.6rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .gb-item .nickname {
            font-weight: 600;
            font-size: 0.8rem;
            color: #0f172a;
        }
        .gb-item .time {
            font-size: 0.6rem;
            color: #94a3b8;
            margin-left: auto;
        }
        .gb-item .content {
            font-size: 0.85rem;
            color: #1e293b;
            padding-left: 2.2rem;
            word-break: break-word;
        }
        .gb-item .delete-btn {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            font-size: 0.65rem;
            padding: 0 0.2rem;
            transition: color 0.2s;
            font-family: inherit;
        }
        .gb-item .delete-btn:hover {
            color: #ef4444;
        }
        .gb-empty {
            text-align: center;
            color: #94a3b8;
            font-size: 0.8rem;
            padding: 1.5rem 0;
        }

        /* ----- 输入表单 ----- */
        .gb-form {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            flex-shrink: 0;
            padding-top: 0.6rem;
            border-top: 1px solid rgba(203, 213, 225, 0.3);
        }
        .gb-form input,
        .gb-form textarea {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
            border: 1px solid rgba(203, 213, 225, 0.4);
            border-radius: 10px;
            padding: 0.4rem 0.7rem;
            font-size: 0.75rem;
            font-family: inherit;
            color: #0f172a;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }
        .gb-form input:focus,
        .gb-form textarea:focus {
            border-color: #6366f1;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.10);
        }
        .gb-form input {
            flex: 1 1 80px;
            min-width: 60px;
        }
        .gb-form textarea {
            flex: 1 1 100%;
            min-height: 44px;
            resize: vertical;
        }
        .gb-form .submit-btn {
            background: #6366f1;
            border: none;
            border-radius: 30px;
            padding: 0.3rem 1.2rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #fff;
            cursor: pointer;
            transition: 0.2s;
            font-family: inherit;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
            align-self: flex-end;
        }
        .gb-form .submit-btn:hover {
            background: #4f46e5;
            transform: scale(1.02);
        }
        .gb-form .submit-btn:active {
            transform: scale(0.97);
        }

        /* ----- Toast 提示（复用原有样式，调整位置到左侧） ----- */
        .gb-toast {
            position: fixed;
            left: 50%;
            bottom: 5rem;
            transform: translateX(-50%);
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            color: #fff;
            padding: 0.6rem 1.6rem;
            border-radius: 40px;
            font-size: 0.85rem;
            font-weight: 500;
            z-index: 999;
            box-shadow: 0 8px 32px rgba(0,0,0,0.20);
            border: 1px solid rgba(255,255,255,0.10);
            transition: opacity 0.3s ease, transform 0.3s ease;
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
            font-family: "Inter", sans-serif;
            pointer-events: none;
            max-width: 90vw;
            text-align: center;
        }
        .gb-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }

        /* ----- 响应式：小屏适配 ----- */
        @media (max-width: 480px) {
            .gb-sidebar {
                width: 100vw;
                max-width: 100vw;
                padding: 1rem 0.8rem;
            }
            .gb-item .content {
                padding-left: 0;
            }
            .gb-item .meta {
                flex-wrap: wrap;
            }
            .gb-item .time {
                margin-left: 0;
                width: 100%;
                padding-left: 2.2rem;
            }
            .gb-toggle-btn {
                padding: 0.4rem 0.3rem 0.4rem 0.5rem;
                font-size: 1rem;
            }
        }
    `;
    document.head.appendChild(style);
}

// =============================================================
// 2. 注入侧边栏 HTML
// =============================================================
function injectGuestbookHTML() {
    const html = `
        <!-- 侧边栏 -->
        <div class="gb-sidebar" id="gbSidebar">
            <div class="gb-header">
                <div class="title">
                    💬 留言板
                    <span class="count" id="gbCount">0 条</span>
                </div>
                <button class="close-btn" id="gbCloseBtn" title="收起">✕</button>
            </div>
            <div class="gb-actions">
                <button class="clear-btn" id="gbClearBtn">清空全部</button>
            </div>
            <div class="gb-list" id="gbList">
                <div class="gb-empty">📭 加载中...</div>
            </div>
            <div class="gb-form">
                <input type="text" id="gbNickname" placeholder="你的名字" maxlength="20" />
                <textarea id="gbContent" placeholder="想说什么呢？" maxlength="500"></textarea>
                <button class="submit-btn" id="gbSubmitBtn">✉ 发送</button>
            </div>
        </div>
        <!-- 切换按钮 -->
        <button class="gb-toggle-btn" id="gbToggleBtn" title="打开留言板">💬</button>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

// =============================================================
// 3. 留言板主类
// =============================================================
class Guestbook {
    constructor() {
        // DOM 引用
        this.sidebar = document.getElementById('gbSidebar');
        this.toggleBtn = document.getElementById('gbToggleBtn');
        this.closeBtn = document.getElementById('gbCloseBtn');
        this.listEl = document.getElementById('gbList');
        this.countEl = document.getElementById('gbCount');
        this.nicknameInput = document.getElementById('gbNickname');
        this.contentInput = document.getElementById('gbContent');
        this.submitBtn = document.getElementById('gbSubmitBtn');
        this.clearBtn = document.getElementById('gbClearBtn');

        this.messages = [];
        this.isOpen = false;

        // 绑定事件
        this.bindEvents();

        // 加载数据
        this.loadMessages();

        // 默认展开（可选）
        // this.open();
    }

    bindEvents() {
        // 切换按钮：打开
        this.toggleBtn.addEventListener('click', () => this.open());

        // 关闭按钮：收起
        this.closeBtn.addEventListener('click', () => this.close());

        // 点击外部关闭（点击侧边栏外部）
        document.addEventListener('click', (e) => {
            if (this.isOpen) {
                const isClickInside = this.sidebar.contains(e.target);
                const isClickToggle = this.toggleBtn.contains(e.target);
                if (!isClickInside && !isClickToggle) {
                    this.close();
                }
            }
        });

        // 提交留言
        this.submitBtn.addEventListener('click', () => this.submitMessage());

        // 清空全部
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Ctrl+Enter 快捷提交
        this.contentInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.submitMessage();
            }
        });

        // 删除按钮（委托）
        this.listEl.addEventListener('click', (e) => {
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.deleteMessage(id);
            }
        });
    }

    // ----- 侧边栏控制 -----
    open() {
        this.isOpen = true;
        this.sidebar.classList.add('open');
        // 加载最新数据（每次打开时刷新）
        this.loadMessages();
    }

    close() {
        this.isOpen = false;
        this.sidebar.classList.remove('open');
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    // ----- API 操作 -----
    async loadMessages() {
        try {
            const resp = await fetch(API_BASE);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const data = await resp.json();
            // MockAPI 返回的数据可能包含 id, gbNickName, gbContent, createdAt 等
            this.messages = data.map(item => ({
                id: item.id,
                nickname: item.gbNickName || item.nickname || '匿名',
                content: item.gbContent || item.content || '',
                time: item.createdAt ? new Date(item.createdAt).toLocaleString('zh-CN') : new Date().toLocaleString('zh-CN'),
                timestamp: item.createdAt ? new Date(item.createdAt).getTime() : Date.now()
            }));
            // 按时间倒序（最新在前）
            this.messages.sort((a, b) => b.timestamp - a.timestamp);
            this.render();
        } catch (err) {
            console.error('加载留言失败:', err);
            this.showToast('加载留言失败，请刷新重试');
            this.messages = [];
            this.render();
        }
    }

    async addMessage(nickname, content) {
        if (!nickname.trim() || !content.trim()) {
            this.showToast('请填写昵称和内容');
            return false;
        }

        const payload = {
            gbNickName: nickname.trim().slice(0, 20),
            gbContent: content.trim().slice(0, 500)
        };

        try {
            const resp = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const result = await resp.json();
            this.showToast('✅ 留言成功！');
            // 重新加载列表
            await this.loadMessages();
            return true;
        } catch (err) {
            console.error('发送留言失败:', err);
            this.showToast('发送失败，请稍后重试');
            return false;
        }
    }

    async deleteMessage(id) {
        if (!confirm('确定要删除这条留言吗？')) return;
        try {
            const resp = await fetch(`${API_BASE}/${id}`, {
                method: 'DELETE'
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            this.showToast('🗑️ 已删除');
            await this.loadMessages();
        } catch (err) {
            console.error('删除失败:', err);
            this.showToast('删除失败，请稍后重试');
        }
    }

    async clearAll() {
        if (this.messages.length === 0) {
            this.showToast('暂无留言');
            return;
        }
        if (!confirm('确定要清空所有留言吗？（将逐条删除）')) return;

        // 逐条删除（MockAPI 不支持批量删除）
        let failCount = 0;
        for (const msg of this.messages) {
            try {
                await fetch(`${API_BASE}/${msg.id}`, { method: 'DELETE' });
            } catch {
                failCount++;
            }
        }
        if (failCount > 0) {
            this.showToast(`清空完成，${failCount} 条删除失败`);
        } else {
            this.showToast('🗑️ 已清空全部留言');
        }
        await this.loadMessages();
    }

    async submitMessage() {
        const nickname = this.nicknameInput.value;
        const content = this.contentInput.value;
        const success = await this.addMessage(nickname, content);
        if (success) {
            this.nicknameInput.value = '';
            this.contentInput.value = '';
            this.nicknameInput.focus();
        }
    }

    // ----- 渲染 -----
    render() {
        const count = this.messages.length;
        this.countEl.textContent = `${count} 条`;

        if (count === 0) {
            this.listEl.innerHTML = `<div class="gb-empty">📭 还没有留言，快来写下第一句吧～</div>`;
            return;
        }

        this.listEl.innerHTML = this.messages.map(msg => {
            const initial = (msg.nickname || '?').charAt(0).toUpperCase() || '?';
            const safeNick = this.escapeHTML(msg.nickname || '匿名');
            const safeContent = this.escapeHTML(msg.content || '');
            return `
                <div class="gb-item">
                    <div class="meta">
                        <div class="avatar-letter">${initial}</div>
                        <span class="nickname">${safeNick}</span>
                        <span class="time">${msg.time || ''}</span>
                        <button class="delete-btn" data-id="${msg.id}" title="删除">✕</button>
                    </div>
                    <div class="content">${safeContent}</div>
                </div>
            `;
        }).join('');

        // 滚动到顶部（显示最新）
        this.listEl.scrollTop = 0;
    }

    // ----- 工具 -----
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    showToast(msg) {
        const existing = document.querySelector('.gb-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'gb-toast';
        toast.textContent = msg;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 2500);
    }
}

// =============================================================
// 4. 启动
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    // 注入样式和 HTML
    injectGuestbookStyles();
    injectGuestbookHTML();

    // 延迟一帧确保 DOM 渲染完成
    requestAnimationFrame(() => {
        const guestbook = new Guestbook();
        window.__guestbook = guestbook;

        // 默认展开（首次加载时自动打开，吸引注意）
        setTimeout(() => guestbook.open(), 300);
    });
});