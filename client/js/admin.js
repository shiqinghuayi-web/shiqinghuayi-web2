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
                localStorage.clear(); 
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

// --- API：新增商品 ---
const formEl = document.getElementById('admin-product-form');
if (formEl) {
    formEl.addEventListener('submit', async e => {
        e.preventDefault();
        const formData = new FormData(formEl); 
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
            formEl.reset(); 
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
            loadAdminProducts(); 
        } else {
            alert('刪除失敗，請檢查後端日誌');
        }
    } catch (error) {
        alert('連線錯誤，無法刪除');
    }
};

// --- API：載入所有訂單 (管理員專用) ---
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

        list.innerHTML = orders.map(order => `
            <div class="panel-card" style="margin-bottom:15px; border-left: 5px solid var(--primary); padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong style="font-size: 16px;">訂單 #${order.id} <span style="color:#888; font-weight:normal; margin-left: 10px;">顧客: ${order.user_name}</span></strong>
                    <select onchange="updateOrderStatus(${order.id}, this.value)" style="padding:8px; border-radius:5px; border: 1px solid #ccc; font-weight: bold; color: var(--primary-strong);">
                        <option value="訂單成立" ${order.order_status === '訂單成立' ? 'selected' : ''}>訂單成立</option>
                        <option value="備貨中" ${order.order_status === '備貨中' ? 'selected' : ''}>備貨中</option>
                        <option value="已寄件" ${order.order_status === '已寄件' ? 'selected' : ''}>已寄件</option>
                        <option value="已送達" ${order.order_status === '已送達' ? 'selected' : ''}>已送達</option>
                        <option value="已取件" ${order.order_status === '已取件' ? 'selected' : ''}>已取件</option>
                    </select>
                </div>
                <div style="font-size:14px; color: #555; line-height: 1.6;">
                    <p style="margin: 0;"><strong>收件人：</strong>${order.receiver_name} (${order.receiver_phone})</p>
                    <p style="margin: 0;"><strong>地址：</strong>${order.receiver_address}</p>
                    <p style="margin: 0;"><strong>總金額：</strong>NT$ ${order.total_amount}</p>
                </div>
            </div>
        `).join('');
    } catch (e) { 
        console.error("訂單加載失敗", e); 
        list.innerHTML = '<div class="empty-state">無法讀取訂單資料。</div>';
    }
}

// --- API：更新訂單狀態 ---
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
        
        if (res.ok) {
            alert(`訂單 #${orderId} 狀態已成功更新為「${newStatus}」`);
        } else {
            alert('更新失敗，請確認權限');
        }
    } catch(err) {
        alert('網路連線錯誤');
    }
};

// 初始執行
loadAdminProducts();
loadAllOrders();
