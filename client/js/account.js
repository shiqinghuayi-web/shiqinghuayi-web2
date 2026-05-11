/**
 * 拾情話憶 - 會員中心核心邏輯
 */
const API_BASE_URL = 'https://643df25ad9157656-39-12-34-105.serveousercontent.com'; 

function getToken() { return localStorage.getItem('token'); }

function setEmptyState(container, text) {
    if (container) container.innerHTML = `<div class="empty-state" style="padding:20px; color:#888; text-align:center;">${text}</div>`;
}

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

function money(v) { return `NT$ ${Number(v || 0).toLocaleString()}`; }

function renderProfile(user, container) {
    if (!user) return;
    const createTime = user.created_at || user.createdAt; 
    container.innerHTML = `
        <div class="profile-item" style="margin-bottom:15px;"><strong>姓名</strong><p>${user.name || '-'}</p></div>
        <div class="profile-item" style="margin-bottom:15px;"><strong>Email</strong><p>${user.email || '-'}</p></div>
        <div class="profile-item" style="margin-bottom:15px;"><strong>角色</strong><p>${user.role || 'USER'}</p></div>
        <div class="profile-item" style="margin-bottom:15px;"><strong>建立時間</strong><p>${formatDate(createTime)}</p></div>
    `;
}

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
            <p class="muted" style="font-size:14px; color:#666; margin:5px 0;">金額：${money(order.totalAmount)}</p>
        </div>
    `).join('');
}

// 設定登出按鈕
function setupAuthNav() {
    const token = getToken();
    const navBtns = document.querySelectorAll('.nav-auth-btn, #logout-btn, #sidebar-logout-btn');
    
    navBtns.forEach(btn => {
        if (token) {
            btn.textContent = '登出';
            btn.href = '#';
            btn.style.display = 'block'; 
            btn.onclick = (e) => {
                e.preventDefault();
                if (confirm('確定要登出嗎？')) {
                    localStorage.clear();
                    window.location.href = './index.html'; 
                }
            };
        } else {
            if (btn.id === 'logout-btn' || btn.id === 'sidebar-logout-btn') {
                btn.style.display = 'none';
            }
        }
    });
}

async function loadMemberProfile() {
    setupAuthNav(); 

    const profileContainer = document.getElementById('member-profile');
    const ordersContainer = document.getElementById('order-list');
    const token = getToken();

    if (!profileContainer) return;

    if (!token) {
        alert("請先登入");
        window.location.href = './login.html'; 
        return;
    }

    try {
        const [meRes, orderRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/auth/me`, { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Bypass-Tunnel-Reminder': 'true' 
                } 
            }),
            fetch(`${API_BASE_URL}/api/orders/my`, { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Bypass-Tunnel-Reminder': 'true' 
                } 
            }).catch(() => ({ ok: false }))
        ]);

        const me = await meRes.json().catch(() => ({}));

        // 核心防護：發現任何異常，立刻終止並跳轉
        if (!meRes.ok || !me.success) {
            if (meRes.status === 401 || meRes.status === 403 || meRes.status === 404) {
                localStorage.clear();
                alert("登入狀態異常，請重新登入");
                window.location.href = './login.html';
                return; // 加上 return，腳本就會在這裡停止，不會往下報錯！
            }
            throw new Error(me.message || '無法載入個人資料');
        }

        renderProfile(me.data, profileContainer);
        const myOrders = orderRes.ok ? await orderRes.json().catch(() => ({})) : { data: [] };
        renderOrders(myOrders.data || [], ordersContainer);

    } catch (error) {
        console.error('Account Error:', error);
        setEmptyState(profileContainer, '伺服器連線失敗，請檢查後端連線狀態。');
    }
}

document.addEventListener('DOMContentLoaded', loadMemberProfile);
