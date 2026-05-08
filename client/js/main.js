/**
 * 拾情話憶 - main.js (後端 API 串接版)
 * 整合：Localtunnel API、圖片路徑修正、購物車管理
 */

// 1. 設定後端基本網址 (確保與你 login.js 的 API 網址一致)
const API_BASE_URL = 'https://shiqingbackend.loca.lt'; 
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

// --- 基礎工具函式 ---
function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

function updateCartCount() {
    const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    document.querySelectorAll('#cart-count').forEach(el => {
        el.textContent = count;
    });
}

function getProductId(product) { return product?.id || product?.slug || Date.now(); }
function getProductName(product) { return product?.name || '未命名商品'; }
function getProductPrice(product) { return Number(product?.price || 0); }

// 核心修正：判斷是否為伺服器上傳的圖片
function getProductImage(product) { 
    let img = product?.image_url || product?.imageUrl || product?.image;
    if (!img) return FALLBACK_IMAGE;

    // 如果路徑包含 uploads/ (代表是伺服器檔案)，補上後端網址
    if (img.includes('uploads/')) {
        return `${API_BASE_URL}/${img}`;
    }
    
    // 如果是相對路徑且開頭有斜線，移除它以符合 GitHub Pages
    return img.startsWith('/') ? img.substring(1) : img;
}

function getProductCategory(product) { 
    return typeof product?.category === 'object' ? product.category.name : (product?.category || '精選茶飲'); 
}
function money(n) { return `NT$ ${Number(n || 0)}`; }

// --- 畫面渲染邏輯 ---
function createProductCard(product) {
    const id = getProductId(product);
    const slug = product.slug || id;
    return `
    <article class="product-card">
      <div class="product-media">
        <span class="product-tag">${getProductCategory(product)}</span>
        <a href="product-detail.html?slug=${slug}">
            <img src="${getProductImage(product)}" alt="${getProductName(product)}">
        </a>
      </div>
      <div class="product-body">
        <div class="product-title-row">
          <div class="product-title">
            <a href="product-detail.html?slug=${slug}">${getProductName(product)}</a>
          </div>
          <div class="price">${money(getProductPrice(product))}</div>
        </div>
        <div class="product-meta">品牌精選 · 限量推薦</div>
        <p class="muted">${product.description || ''}</p>
        <div class="product-actions">
          <a class="btn" href="product-detail.html?slug=${slug}">查看商品</a>
          <button class="btn btn-outline" onclick="quickAddToCart('${id}')">加入購物車</button>
        </div>
      </div>
    </article>
  `;
}

// --- 核心功能邏輯 ---
let featuredProducts = [];

window.quickAddToCart = function(productId) {
    const product = featuredProducts.find(item => String(getProductId(item)) === String(productId));
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
    saveCart(cart);
    updateCartCount();
    alert('已加入購物車');
};

async function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;

    try {
        // 嘗試連線後端 API 並加入 Bypass 標頭
        const res = await fetch(`${API_BASE_URL}/api/products`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        
        if (!res.ok) throw new Error('API 無法連線');
        
        const result = await res.json();
        featuredProducts = Array.isArray(result.data) ? result.data : [];

        // 如果資料庫是空的，則顯示 Mock 資料
        if (featuredProducts.length === 0) {
            featuredProducts = window.mockProducts || [];
        }
    } catch (error) {
        console.warn("後端載入失敗，正在切換至 Mock 資料...", error);
        featuredProducts = window.mockProducts || [];
    }

    // 渲染前 3 筆商品
    container.innerHTML = featuredProducts.slice(0, 3).map(createProductCard).join('') || 
                          '<div class="empty-state">目前沒有商品可顯示</div>';
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    loadFeaturedProducts();
});
