(function() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (!token || role !== 'admin') {
        alert('權限不足，請以管理員帳號登入。');
        window.location.href = 'index.html'; 
    }
})();

const API_BASE_URL = 'https://643df25ad9157656-39-12-34-105.serveousercontent.com'; // 確保你的隧道網址正確
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

// --- 基礎工具 ---
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    document.querySelectorAll('#cart-count').forEach(el => { el.textContent = count; });
}
function money(n) { return `NT$ ${Number(n || 0)}`; }

// 核心修正：讀取伺服器上傳的圖片路徑
function getProductImage(product) {
    const path = product?.image_url || product?.imageUrl;
    if (!path) return FALLBACK_IMAGE;
    // 如果路徑包含 uploads，則補上後端 API 位址
    return path.includes('uploads') ? `${API_BASE_URL}/${path}` : path;
}

// --- 渲染邏輯 ---
function createProductCard(product) {
    const category = product?.category || '精選茶飲';
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
      </div>
    </article>
  `;
}

// --- API 請求 ---

async function loadAdminProducts() {
    const list = document.getElementById('admin-product-list');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        const result = await res.json();
        let products = Array.isArray(result.data) ? result.data : [];
        
        if (products.length === 0 && window.mockProducts) {
            products = window.mockProducts;
        }

        list.innerHTML = products.length 
            ? products.map(createProductCard).join('') 
            : '<div class="empty-state">目前沒有商品資料。</div>';
    } catch (error) {
        list.innerHTML = '<div class="empty-state">無法連線至後端伺服器。</div>';
    }
}

// 核心修正：使用 FormData 上傳檔案
document.getElementById('admin-product-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_BASE_URL}/api/products`, {
            method: 'POST',
            headers: { 
                // 注意：上傳檔案時「不可以」設定 Content-Type，瀏覽器會自動處理
                'Authorization': `Bearer ${token}`,
                'Bypass-Tunnel-Reminder': 'true'
            },
            body: formData 
        });

        const result = await res.json();
        if (!res.ok || !result.success) throw new Error(result.message || '上架失敗');

        alert('商品上架成功（含圖片已儲存）！');
        e.currentTarget.reset();
        loadAdminProducts();
    } catch (error) {
        alert(error.message);
    }
});

updateCartCount();
loadAdminProducts();
