(function() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
        alert('權限不足，請以管理員帳號登入。');
        window.location.href = 'index.html'; 
        return;
    }

    const logoutBtn = document.getElementById('admin-logout-btn');
    if(logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            if (confirm('確定要登出嗎？')) {
                localStorage.clear(); 
                window.location.href = 'index.html';
            }
        };
    }
})();

function money(n) { return `NT$ ${Number(n || 0).toLocaleString()}`; }
function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString();
}

async function loadAllOrders() {
    const list = document.getElementById('admin-order-list');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}`, 
                'Bypass-Tunnel-Reminder': 'true' 
            }
        });
        const result = await res.json();
        const orders = result.data || [];

        if (orders.length === 0) {
            list.innerHTML = '<div class="empty-state">目前還沒有任何訂單。</div>';
            return;
        }

        list.innerHTML = orders.map(order => {
            let items = [];
            try {
                items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
            } catch(e) {}

            // 明細字體放大、加粗
            const itemsHtml = items.map(item => `
                <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 8px; color: #333;">
                    <span>${item.name} <span style="color:var(--primary-strong); font-weight:bold;">× ${item.quantity}</span></span>
                    <span>${money(item.price * item.quantity)}</span>
                </div>
            `).join('');

            let paymentLabel = '';
            if(order.payment_method === 'credit-card') paymentLabel = '信用卡';
            else if(order.payment_method === 'atm') paymentLabel = 'ATM 轉帳';
            else if(order.payment_method === 'cod') paymentLabel = '貨到付款';
            else paymentLabel = order.payment_method || '未指定';

            return `
            <div class="panel-card" style="margin-bottom:20px; border-left: 5px solid var(--primary); padding: 20px; background: #fff;">
                <div style="display:flex; justify-content:space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 15px; margin-bottom: 15px;">
                    <strong style="font-size: 18px;">訂單 #${order.id} <span style="color:#888; font-weight:normal; font-size: 14px; margin-left: 10px;">${formatDate(order.created_at)}</span></strong>
                    <select onchange="updateOrderStatus(${order.id}, this.value)" style="padding:8px 12px; font-size: 16px; border-radius:5px; border: 2px solid var(--primary-strong); font-weight: bold; color: var(--primary-strong); cursor: pointer;">
                        <option value="訂單成立" ${order.order_status === '訂單成立' ? 'selected' : ''}>訂單成立</option>
                        <option value="備貨中" ${order.order_status === '備貨中' ? 'selected' : ''}>備貨中</option>
                        <option value="已寄件" ${order.order_status === '已寄件' ? 'selected' : ''}>已寄件</option>
                        <option value="已送達" ${order.order_status === '已送達' ? 'selected' : ''}>已送達</option>
                        <option value="已取件" ${order.order_status === '已取件' ? 'selected' : ''}>已取件</option>
                    </select>
                </div>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 16px; color: #555;">訂購明細</h4>
                    ${itemsHtml}
                    <div style="text-align: right; margin-top: 10px; font-size: 18px; color: var(--primary-strong); font-weight: bold;">
                        總計：${money(order.total_amount)}
                    </div>
                </div>

                <div style="font-size:16px; color: #444; line-height: 1.8;">
                    <p style="margin: 0;"><strong>收件人：</strong>${order.receiver_name} (${order.receiver_phone})</p>
                    <p style="margin: 0;"><strong>收件地址：</strong>${order.receiver_address}</p>
                    <p style="margin: 0;"><strong>付款方式：</strong>${paymentLabel}</p>
                </div>
            </div>
        `}).join('');
    } catch (e) { 
        console.error("訂單加載失敗", e); 
    }
}

window.updateOrderStatus = async (orderId, newStatus) => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) alert(`訂單 #${orderId} 狀態已成功更新為「${newStatus}」`);
    } catch(err) { alert('網路連線錯誤'); }
};

loadAllOrders();
