const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

// 工具函式 (與 main.js 保持同步)
const getProductImage = (p) => p?.imageUrl || p?.image || FALLBACK_IMAGE;
const getProductName = (p) => p?.name || '未命名商品';
const getProductPrice = (p) => Number(p?.price || 0);
const getProductCategory = (p) => typeof p?.category === 'object' ? p.category.name : (p?.category || '精選茶飲');
const money = (n) => `NT$ ${Number(n || 0)}`;

async function loadProductDetail() {
  const slug = new URLSearchParams(window.location.search).get('slug');
  const container = document.getElementById('product-detail');
  if (!container || !slug) return;

  let product = null;

  try {
    const res = await fetch(`/api/products/${slug}`);
    if (res.ok) {
      const result = await res.json();
      product = result.data;
    }
  } catch (e) {
    console.warn("詳情頁 API 載入失敗，搜尋 Mock 資料");
  }

  if (!product && window.mockProducts) {
    product = window.mockProducts.find(p => p.slug === slug || String(p.id) === slug);
  }

  if (!product) {
    container.innerHTML = '<div class="empty-state">找不到該商品資訊</div>';
    return;
  }

  container.innerHTML = `
    <section class="detail-card">
      <div class="detail-image">
        <img src="${getProductImage(product)}" alt="${getProductName(product)}">
      </div>
      <div class="detail-info">
        <span class="section-label">${getProductCategory(product)}</span>
        <h1>${getProductName(product)}</h1>
        <p class="price">${money(getProductPrice(product))}</p>
        <p class="muted">${product.description || ''}</p>
        <div class="detail-highlights">
          <div><span>庫存</span><strong>${product.stock || 0}</strong></div>
          <div><span>分類</span><strong>${getProductCategory(product)}</strong></div>
        </div>
        <div class="qty-row">
          <span>數量</span>
          <div class="qty-box">
            <button onclick="changeQty(-1)">−</button>
            <input id="qty-input" type="number" value="1" min="1">
            <button onclick="changeQty(1)">＋</button>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn" id="add-to-cart-btn">加入購物車</button>
          <a class="btn btn-light" href="cart.html">前往購物車</a>
        </div>
      </div>
    </section>
  `;

  document.getElementById('add-to-cart-btn').onclick = () => {
    const qty = Number(document.getElementById('qty-input').value);
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find(item => String(item.id) === String(product.id));
    if (existing) { existing.quantity += qty; }
    else {
      cart.push({ id: product.id, name: product.name, price: product.price, imageUrl: getProductImage(product), quantity: qty });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('已加入購物車');
    location.reload(); // 更新數量顯示
  };
}

window.changeQty = (step) => {
  const input = document.getElementById('qty-input');
  input.value = Math.max(1, Number(input.value) + step);
};

loadProductDetail();
