// 請確保 config.js 在此檔案之前載入，或者手動定義 API_BASE_URL


// 工具函式：支援後端上傳路徑
const getProductImage = (p) => {
    let img = p?.image_url || p?.imageUrl || p?.image;
    if (!img) return FALLBACK_IMAGE;
    return img.includes('uploads/') ? `${API_BASE_URL}/${img}` : img;
};
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
    // 修正：必須補上 API_BASE_URL
    const res = await fetch(`${API_BASE_URL}/api/products/${slug}`, {
        headers: { 'Bypass-Tunnel-Reminder': 'true' }
    });
    if (res.ok) {
      const result = await res.json();
      product = result.data;
    }
  } catch (e) {
    console.warn("詳情頁 API 載入失敗，搜尋 Mock 資料");
  }

  // 備援方案：找不到 API 資料才用 Mock
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
    const productId = product.id || product.slug;
    
    const existing = cart.find(item => String(item.id) === String(productId));
    if (existing) { 
        existing.quantity += qty; 
    } else {
        cart.push({ 
            id: productId, 
            name: getProductName(product), 
            price: getProductPrice(product), 
            imageUrl: getProductImage(product), 
            quantity: qty 
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('已成功加入購物車！');
    // 不要 location.reload()，會導致跳回頂端，使用者體驗不好
    if(window.updateCartCount) window.updateCartCount(); 
  };
}

window.changeQty = (step) => {
  const input = document.getElementById('qty-input');
  input.value = Math.max(1, Number(input.value) + step);
};

loadProductDetail();
