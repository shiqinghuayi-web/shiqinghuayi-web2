// --- 權限與導覽列切換邏輯 ---
(function() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    // 阻擋非管理員
    if (!token || role !== 'admin') {
        alert('權限不足，請以管理員帳號登入。');
        window.location.href = 'index.html'; 
        return;
    }

    // 將導覽列的「登入」自動改為「登出」
    const navAuthBtns = document.querySelectorAll('.nav-auth-btn');
    navAuthBtns.forEach(btn => {
        btn.textContent = '登出';
        btn.href = '#';
        btn.onclick = (e) => {
            e.preventDefault();
            if (confirm('確定要登出嗎？')) {
                localStorage.clear(); // 清除所有登入與購物車資料
                window.location.href = 'index.html';
            }
        };
    });
})();



function money(n) { return `NT$ ${Number(n || 0)}`; }

function getProductImage(product) {
    const path = product?.image_url || product?.imageUrl;
    if (!path) return FALLBACK_IMAGE;
    return path.includes('uploads') ? `${API_BASE_URL}/${path}` : path;
}

// --- 渲染商品卡片 (加上刪除按鈕) ---
function createProductCard(product) {
    const category = typeof product.category === 'object' ? product.category.name : (product.category || '未分類');
    return `
    <article class="product-card">
      <div class="product-media">
        <span class="product-tag">${category}</span>
        <img src="${getProductImage(product)}" alt="${product.name}">
      </div>
      <div class="product-body">
        <div class="product-title-row">
          <div class="product-title">${product.name}</div>
          <div class="price">${money(product.price)}</div>
        </div>
        <div class="product-meta">庫存：${Number(product.stock || 0)}</div>
        <p class="muted">${product.description || ''}</p>
        
        <div style="margin-top: 15px; text-align: right;">
          <button class="btn btn-outline" style="color: #d9534f; border-color: #d9534f; padding: 5px 15px;" onclick="deleteProduct('${product.id}')">刪除商品</button>
        </div>
      </div>
    </article>
  `;
}

// --- API：載入商品 ---
async function loadAdminProducts() {
    const list = document.getElementById('admin-product-list');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const result = await res.json();
        let products = Array.isArray(result.data) ? result.data : [];
        
        list.innerHTML = products.length 
            ? products.map(createProductCard).join('') 
            : '<div class="empty-state">目前沒有商品資料。</div>';
    } catch (error) {
        list.innerHTML = '<div class="empty-state">無法連線至後端伺服器。</div>';
    }
}

// --- API：新增商品 (修復 reset 錯誤) ---
const formEl = document.getElementById('admin-product-form');
if (formEl) {
    formEl.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(formEl); // 安全抓取表單
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Bypass-Tunnel-Reminder': 'true'
                },
                body: formData 
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message || '上架失敗');

            alert('商品上架成功！');
            formEl.reset(); // 安全重置表單
            loadAdminProducts();
        } catch (error) {
            alert(error.message);
        }
    });
}

// --- API：刪除商品 ---
window.deleteProduct = async (id) => {
    if (!confirm('警告：確定要永久刪除這個商品嗎？')) return;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
            method: 'DELETE',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Bypass-Tunnel-Reminder': 'true'
            }
        });
        
        if (res.ok) {
            alert('商品已成功刪除');
            loadAdminProducts(); // 重新載入列表
        } else {
            alert('刪除失敗，請檢查後端日誌');
        }
    } catch (error) {
        alert('連線錯誤，無法刪除');
    }
};

loadAdminProducts();

// 在 admin.js 最下方新增
async function loadAllOrders() {
    const list = document.getElementById('admin-order-list');
    if (!list) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Bypass-Tunnel-Reminder': 'true' }
        });
        const result = await res.json();
        const orders = result.data || [];

        list.innerHTML = orders.map(order => `
            <div class="panel-card" style="margin-bottom:15px; border-left: 5px solid var(--primary);">
                <div style="display:flex; justify-content:space-between;">
                    <strong>訂單 #${order.id} - 顧客: ${order.user_name}</strong>
                    <select onchange="updateOrderStatus(${order.id}, this.value)" style="padding:5px; border-radius:5px;">
                        <option value="訂單成立" ${order.order_status === '訂單成立' ? 'selected' : ''}>訂單成立</option>
                        <option value="備貨中" ${order.order_status === '備貨中' ? 'selected' : ''}>備貨中</option>
                        <option value="已寄件" ${order.order_status === '已寄件' ? 'selected' : ''}>已寄件</option>
                        <option value="已送達" ${order.order_status === '已送達' ? 'selected' : ''}>已送達</option>
                        <option value="已取件" ${order.order_status === '已取件' ? 'selected' : ''}>已取件</option>
                    </select>
                </div>
                <p style="font-size:14px; margin-top:10px;">金額: NT$ ${order.total_amount} | 地址: ${order.receiver_address}</p>
            </div>
        `).join('');
    } catch (e) { console.error("訂單加載失敗", e); }
}

window.updateOrderStatus = async (orderId, newStatus) => {
    await fetch(`${API_BASE_URL}/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Bypass-Tunnel-Reminder': 'true'
        },
        body: JSON.stringify({ status: newStatus })
    });
    alert(`訂單 #${orderId} 狀態已更新為 ${newStatus}`);
};

// 初始執行
loadAllOrders();
