/**
 * 拾情話憶 - 會員中心核心邏輯
 */

// 標籤切換邏輯
window.switchTab = function(event, tabName) {
    if (event) event.preventDefault();
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.getElementById(`tab-${tabName}`).style.display = 'block';

    document.querySelectorAll('.account-link').forEach(link => link.classList.remove('active'));
    if(event) event.currentTarget.classList.add('active');
};

function getToken() { return localStorage.getItem('token'); }

// ==========================================
// 新增：讀取並更新右上角購物車數量
// ==========================================
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    document.querySelectorAll('#cart-count').forEach(el => {
        el.textContent = count;
    });
}

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
        <div class="profile-item" style="margin-bottom:15px;"><strong>角色</strong><p>${user.role === 'admin' ? '管理員' : '一般會員'}</p></div>
        <div class="profile-item" style="margin-bottom:15px;"><strong>加入時間</strong><p>${formatDate(createTime)}</p></div>
    `;
}

function renderOrders(orders, container) {
    if (!Array.isArray(orders) || !orders.length) {
        return setEmptyState(container, '目前還沒有訂單資料。趕快去選購喜歡的商品吧！');
    }

    const statusSteps = ['訂單成立', '備貨中', '已寄件', '已送達', '已取件'];

    container.innerHTML = orders.map(order => {
        let items = [];
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch(e) {}

        const itemsHtml = items.map(item => `
            <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 10px; color: #333;">
                <span>${item.name} <span style="color:var(--primary-strong); font-weight:bold;">× ${item.quantity}</span></span>
                <span>${money(item.price * item.quantity)}</span>
            </div>
        `).join('');

        const currentStatus = order.order_status || order.orderStatus || '訂單成立';
        const currentIndex = statusSteps.indexOf(currentStatus) !== -1 ? statusSteps.indexOf(currentStatus) : 0;
        const progressPercentage = (currentIndex / (statusSteps.length - 1)) * 100;

        const progressHtml = `
            <div style="margin: 30px 0; padding: 0 10px;">
                <div style="display: flex; justify-content: space-between; position: relative;">
                    <div style="position: absolute; top: 10px; left: 0; width: 100%; height: 4px; background: #eee; z-index: 1;"></div>
                    <div style="position: absolute; top: 10px; left: 0; width: ${progressPercentage}%; height: 4px; background: var(--primary-strong); z-index: 1; transition: width 0.5s;"></div>
                    
                    ${statusSteps.map((status, index) => {
                        const isCompleted = index <= currentIndex;
                        return `
                        <div style="position: relative; z-index: 2; text-align: center; width: 60px;">
                            <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isCompleted ? 'var(--primary-strong)' : '#eee'}; margin: 0 auto 8px; border: 3px solid white; box-shadow: 0 0 0 1px ${isCompleted ? 'var(--primary-strong)' : '#ddd'};"></div>
                            <div style="font-size: 12px; font-weight: ${isCompleted ? 'bold' : 'normal'}; color: ${isCompleted ? 'var(--primary-strong)' : '#999'};">${status}</div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;

        let paymentLabel = '';
        if(order.payment_method === 'credit-card') paymentLabel = '信用卡';
        else if(order.payment_method === 'atm') paymentLabel = 'ATM 轉帳';
        else if(order.payment_method === 'cod') paymentLabel = '貨到付款';
        else paymentLabel = order.payment_method || '未指定';

        return `
            <div class="order-card" style="border:1px solid #eaeaea; padding:25px; border-radius:12px; margin-bottom:20px; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                    <strong style="font-size: 18px; font-family: var(--font-display);">訂單 #${order.id ?? '-'}</strong>
                    <span style="color: #888; font-size: 14px;">${formatDate(order.created_at || order.createdAt)}</span>
                </div>

                ${progressHtml}

                <hr style="border: none; border-top: 1px dashed #eee; margin: 20px 0;">

                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #555;">訂購明細</h4>
                    ${itemsHtml}
                </div>
                
                <div style="font-size: 15px; color: #444; margin-bottom: 15px; line-height: 1.6;">
                    <p style="margin: 0;"><strong>收件人：</strong>${order.receiver_name} (${order.receiver_phone})</p>
                    <p style="margin: 0;"><strong>收貨地址：</strong>${order.receiver_address}</p>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px solid #f5f5f5; padding-top: 15px;">
                    <span class="muted" style="font-size:14px; color:#666;">付款方式：${paymentLabel}</span>
                    <strong style="color: var(--primary-strong); font-size: 20px;">總計：${money(order.total_amount || order.totalAmount)}</strong>
                </div>
            </div>
        `;
    }).join('');
}

function setupAuthNav() {
    const token = getToken();
    const role = localStorage.getItem('userRole');
    const navBtns = document.querySelectorAll('.nav-auth-btn, #logout-btn, #sidebar-logout-btn');
    
    if (token && role === 'admin') {
        const navContainer = document.querySelector('.main-nav');
        if (navContainer) {
            navContainer.innerHTML = `
                <a href="index.html">前台首頁</a>
                <a href="admin.html">商品管理</a>
                <a href="admin-orders.html">訂單管理</a>
                <a href="#" id="admin-logout-btn">登出</a>
            `;
            document.getElementById('admin-logout-btn').onclick = (e) => {
                e.preventDefault();
                if (confirm('確定要登出嗎？')) {
                    localStorage.clear();
                    window.location.href = 'index.html'; 
                }
            };
        }
    } else if (token) {
        navBtns.forEach(btn => {
            btn.textContent = '登出';
            btn.href = '#';
            btn.style.display = 'block'; 
            btn.onclick = (e) => {
                e.preventDefault();
                if (confirm('確定要登出嗎？')) {
                    localStorage.clear();
                    window.location.href = 'index.html'; 
                }
            };
        });
    }
}

async function loadMemberProfile() {
    setupAuthNav(); 

    const profileContainer = document.getElementById('member-profile');
    const ordersContainer = document.getElementById('order-list');
    const token = getToken();

    if (!profileContainer) return;

    if (!token) {
        alert("請先登入");
        window.location.href = 'login.html'; 
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

        if (!meRes.ok || !me.success) {
            if (meRes.status === 401 || meRes.status === 403 || meRes.status === 404) {
                localStorage.clear();
                alert("登入狀態異常，請重新登入");
                window.location.href = 'login.html';
                return;
            }
            throw new Error(me.message || '無法載入個人資料');
        }

        renderProfile(me.data, profileContainer);
        const myOrders = orderRes.ok ? await orderRes.json().catch(() => ({})) : { data: [] };
        renderOrders(myOrders.data || [], ordersContainer);

    } catch (error) {
        setEmptyState(profileContainer, '伺服器連線失敗，請檢查後端連線狀態。');
    }
}

// ==========================================
// 修改這裡：載入時同時更新購物車數量與會員資料
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount(); 
    loadMemberProfile();
});
