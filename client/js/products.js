/* =========================
   拾情話憶 - products.js (支援後端 API 版)
========================= */

// 1. 確保與後端網址同步
const API_BASE_URL = 'https://643df25ad9157656-39-12-34-105.serveousercontent.com'; 
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

// --- 基礎工具 ---
function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('#cart-count').forEach(el => {
    el.textContent = count;
  });
}

function getProductId(product) {
  return product?.id || product?.slug || Date.now();
}

function getProductName(product) {
  return product?.name || '未命名商品';
}

function getProductPrice(product) {
  return Number(product?.price || 0);
}

// 修正：支援後端 uploads 資料夾路徑
function getProductImage(product) {
  const path = product?.image_url || product?.imageUrl || product?.image;
  if (!path) return FALLBACK_IMAGE;
  // 如果是上傳的圖片，補上 API 前綴
  return path.includes('uploads') ? `${API_BASE_URL}/${path}` : path;
}

function getProductCategory(product) {
  return product?.category || '精選茶飲';
}

function money(n) {
  return `NT$ ${Number(n || 0)}`;
}

// --- 畫面渲染 ---
function createProductCard(product) {
  const id = getProductId(product);
  return `
    <article class="product-card">
      <div class="product-media">
        <span class="product-tag">${getProductCategory(product)}</span>
        <a href="./product-detail.html?slug=${product.slug || id}">
          <img src="${getProductImage(product)}" alt="${getProductName(product)}">
        </a>
      </div>
      <div class="product-body">
        <div class="product-title-row">
          <div class="product-title">
            <a href="./product-detail.html?slug=${product.slug || id}">${getProductName(product)}</a>
          </div>
          <div class="price">${money(getProductPrice(product))}</div>
        </div>
        <div class="product-meta">風格日常 · 細節生活</div>
        <p class="muted">${product.description || ''}</p>
        <div class="product-actions">
          <a class="btn" href="./product-detail.html?slug=${product.slug || id}">查看詳情</a>
          <button class="btn btn-outline" onclick="quickAddToCart('${id}')">加入購物車</button>
        </div>
      </div>
    </article>
  `;
}

let allProducts = [];

function renderProducts(products) {
  const container = document.getElementById('product-list');
  if (!container) return;

  container.innerHTML = products.length
    ? products.map(createProductCard).join('')
    : `<div class="empty-state">目前沒有符合條件的商品</div>`;
}

// --- 篩選與排序邏輯 ---
function applyFilters() {
  const keyword = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  const category = document.getElementById('category-filter')?.value || '';
  const sort = document.getElementById('sort-filter')?.value || 'new';

  let filtered = [...allProducts].filter(product => {
    const matchKeyword = getProductName(product).toLowerCase().includes(keyword);
    const matchCategory = !category || getProductCategory(product) === category;
    return matchKeyword && matchCategory;
  });

  if (sort === 'price-asc') {
    filtered.sort((a, b) => getProductPrice(a) - getProductPrice(b));
  } else if (sort === 'price-desc') {
    filtered.sort((a, b) => getProductPrice(b) - getProductPrice(a));
  } else {
    // 預設由新到舊 (根據 ID 或建立時間)
    filtered.sort((a, b) => Number(getProductId(b)) - Number(getProductId(a)));
  }

  renderProducts(filtered);
}

// --- 購物車功能 ---
function quickAddToCart(productId) {
  const product = allProducts.find(item => String(getProductId(item)) === String(productId));
  if (!product) return alert('找不到商品資料');

  const cart = getCart();
  const existing = cart.find(item => String(item.id) === String(productId));

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: getProductId(product),
      name: getProductName(product),
      price: getProductPrice(product),
      imageUrl: getProductImage(product),
      quantity: 1
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert('已加入購物車');
}

/* =========================
   修正：從後端 API 讀取真實資料
========================= */
async function loadProducts() {
  const container = document.getElementById('product-list');
  if (!container) return;

  try {
    // 1. 嘗試發送請求至後端
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' }
    });
    
    if (!res.ok) throw new Error('API 無法連線');
    
    const result = await res.json();
    allProducts = Array.isArray(result.data) ? result.data : [];

    // 2. 如果後端完全沒資料，再考慮載入 Mock 資料作為備援 (或者直接留空)
    if (allProducts.length === 0 && window.mockProducts) {
       console.log("資料庫為空，顯示 Mock 資料");
       allProducts = window.mockProducts;
    }

    applyFilters();

  } catch (error) {
    console.error("載入失敗:", error);
    // 備援：若連不上後端，嘗試使用載入的 Mock 資料
    if (window.mockProducts) {
        allProducts = window.mockProducts;
        applyFilters();
    } else {
        container.innerHTML = `<div class="empty-state">商品載入失敗，請確認後端連線</div>`;
    }
  }
}

/* =========================
   監聽器與初始化
========================= */
document.getElementById('search-input')?.addEventListener('input', applyFilters);
document.getElementById('category-filter')?.addEventListener('change', applyFilters);
document.getElementById('sort-filter')?.addEventListener('change', applyFilters);

updateCartCount();
loadProducts();

// 將功能掛載到全域供 HTML 調用
window.quickAddToCart = quickAddToCart;
