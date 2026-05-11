/**
 * 拾情話憶 - 會員中心核心邏輯
 */

// 1. 基礎配置：請確保此 IP 與 B 電腦主機 IP 一致
const API_BASE_URL = 'https://643df25ad9157656-39-12-34-105.serveousercontent.com'; 

// --- 工具函式 ---
function getToken() {
    return localStorage.getItem('token');
}

function setEmptyState(container, text) {
    if (container) container.innerHTML = `<div class="empty-state" style="padding:20px; color:#888; text-align:center;">${text}</div>`;
}

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

function money(v) {
    return `NT$ ${Number(v || 0).toLocaleString()}`;
}

// --- 渲染函式 ---

// 渲染個人資料
function renderProfile(user, container) {
    if (!user) return;
    // 這裡修正了後端回傳可能是 created_at (PostgreSQL 預設) 的問題
    const createTime = user.created_at || user.createdAt; 
    
    container.innerHTML = `
        <div class="profile-item" style="margin-bottom:15px;"><strong>姓名</strong><p>${user.name || '-'}</p></div>
        <div class="profile-item" style="margin-bottom:15px;"><strong>Email</strong><p>${user.email || '-'}</p></div>
        <div class="profile-item" style="margin-bottom:15px;"><strong>角色</strong><p>${user.role || 'USER'}</p></div>
        <div class="profile-item" style="margin-bottom:15px;"><strong>建立時間</strong><p>${formatDate(createTime)}</p></div>
    `;
}

// 渲染訂單列表
function renderOrders(orders, container) {
    if (!Array.isArray(orders) || !orders.length) {
        return setEmptyState(container, '目前還沒有訂單資料。');
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card" style="border:1px solid #eee; padding:15px; border-radius:8px; margin-bottom:10px;">
            <div style="display:flex; justify-content:space-between; align-items:center">
                <strong>訂單 #${order.id ?? '-'}</strong>
                <span class="status-pill" style="background:#f4b084; color:white; padding:2px 8px; border-radius:4px; font-size:12px;">
                    ${order.orderStatus || '處理中'}
                </span>
            </div>
            <p class="muted" style="font-size:14px; color:#666; margin:5px 0;">付款狀態：${order.paymentStatus || '未付款'}</p>
            <p class="muted" style="font-size:14px; color:#666; margin:5px 0;">金額：${money(order.totalAmount)}</p>
            <p class="muted" style="font-size:14px; color:#666; margin:5px 0;">建立時間：${formatDate(order.created_at || order.createdAt)}</p>
        </div>
    `).join('');
}

// --- 登出邏輯 ---
function handleLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    const token = getToken();

    if (!logoutBtn) return;

    if (!token) {
        logoutBtn.style.setProperty('display', 'none', 'important'); 
        return;
    } else {
        logoutBtn.style.display = 'block'; 
    }

    // 移除舊的監聽器防止重複綁定
    logoutBtn.onclick = (e) => {
        e.preventDefault();
        if (confirm('確定要登出嗎？')) {
            localStorage.removeItem('token');
            window.location.href = '/login.html'; // 登出後回登入頁
        }
    };
}

// --- 主邏輯：載入會員資料 ---
async function loadMemberProfile() {
    const profileContainer = document.getElementById('member-profile');
    const ordersContainer = document.getElementById('order-list');
    const token = getToken();

    if (!profileContainer || !ordersContainer) return;

    if (!token) {
        setEmptyState(profileContainer, '尚未登入，請先登入會員帳號。');
        setEmptyState(ordersContainer, '登入後即可查看訂單紀錄。');
        handleLogout();
        return;
    }

    try {
        // 使用 Promise.all 同時請求個人資訊與訂單
        // 注意：API 加上了 API_BASE_URL 前綴
        const [meRes, orderRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/auth/me`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            }),
            fetch(`${API_BASE_URL}/api/orders/my`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            }).catch(() => ({ ok: false })) // 預防訂單 API 還沒寫好
        ]);

        const me = await meRes.json().catch(() => ({}));
        
        // 驗證登入狀態
        if (!meRes.ok || !me.success) {
            throw new Error(me.message || '登入已失效');
        }

        // 渲染個人資料
        renderProfile(me.data, profileContainer);

        // 處理訂單資料 (如果訂單 API 噴錯，給予空陣列)
        const myOrders = orderRes.ok ? await orderRes.json().catch(() => ({})) : { data: [] };
        renderOrders(myOrders.data || [], ordersContainer);

    } catch (error) {
        console.error('載入失敗:', error);
        localStorage.removeItem('token');
        setEmptyState(profileContainer, '登入已失效，請重新登入。');
        setEmptyState(ordersContainer, '請重新登入後查看資料。');
    }
    
    // 執行登出按鈕顯示檢查
    handleLogout();
}

// 啟動
document.addEventListener('DOMContentLoaded', loadMemberProfile);
