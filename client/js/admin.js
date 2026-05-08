const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

// --- 基礎工具 ---
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('#cart-count').forEach(el => { el.textContent = count; });
}
function money(n) { return `NT$ ${Number(n || 0)}`; }

// 配合資料庫欄位 (image_url) 的讀取
function getProductImage(product) {
  return product?.image_url || product?.imageUrl || product?.image || FALLBACK_IMAGE;
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

// 1. 載入商品清單
async function loadAdminProducts() {
  const list = document.getElementById('admin-product-list');
  if (!list) return;
  
  try {
    // 呼叫你 server.js 定義的 /api/products
    const res = await fetch('/api/products');
    const result = await res.json();
    
    let products = Array.isArray(result.data) ? result.data : [];
    
    // 如果後端沒資料，就顯示 Mock 資料作為預覽 (方便你測試排版)
    if (products.length === 0 && window.mockProducts) {
      console.log("資料庫為空，顯示 Mock 預覽");
      products = window.mockProducts;
    }

    list.innerHTML = products.length 
      ? products.map(createProductCard).join('') 
      : '<div class="empty-state">目前沒有商品資料。</div>';
  } catch (error) {
    console.error("載入失敗:", error);
    list.innerHTML = '<div class="empty-state">無法連線至後端伺服器。</div>';
  }
}

// 2. 新增商品表單提交
document.getElementById('admin-product-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const token = localStorage.getItem('token'); // 取得登入時存下的 Token

  const payload = {
    name: String(formData.get('name')).trim(),
    slug: String(formData.get('slug')).trim(),
    price: Number(formData.get('price')),
    stock: Number(formData.get('stock')),
    imageUrl: String(formData.get('imageUrl')).trim(),
    description: String(formData.get('description')).trim()
  };

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 帶上 Token 給後端驗證權限
      },
      body: JSON.stringify(payload)
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || '新增商品失敗');
    }

    alert('商品成功存入資料庫！');
    e.currentTarget.reset();
    loadAdminProducts(); // 重新整理列表
  } catch (error) {
    alert(error.message);
  }
});

// 初始化
updateCartCount();
loadAdminProducts();
