/**
 * 拾情話憶 - main.js (後端 API 串接版)
 * 整合：Localtunnel API、圖片路徑修正、購物車管理
 */

// 1. 設定後端基本網址 (確保與你 login.js 的 API 網址一致)
const API_BASE_URL = 'https://643df25ad9157656-39-12-34-105.serveousercontent.com'; 
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

// --- 跑馬燈邏輯開始 ---
let counter = 0;
const size = 100; 
const slide = document.querySelector('.carousel-slide');
const imagesList = document.querySelectorAll('.carousel-slide img');
const prevBtn = document.querySelector('.prev-btn');
const nextBtn = document.querySelector('.next-btn');

// 重置自動播放的計時器
let autoPlay;
function startTimer() {
  stopTimer();
  autoPlay = setInterval(moveNext, 3000); // 建議 3 秒換一張，閱讀比較舒服
}
function stopTimer() {
  clearInterval(autoPlay);
}

// 在 main.js 的 updateSlide 內增加
// 在你的 moveNext() 或 updateSlide() 函式中加入點點更新
function updateSlide() {
  slide.style.transform = `translateX(${-100 * counter}%)`;
  
  // 修復點點：先移除所有 active，再加給當前那一個
  const allDots = document.querySelectorAll('.dot');
  allDots.forEach((dot, index) => {
    if (index === counter) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

// 記得在頁面初始化時，也要手動產生 12 個點點（如果你不想在 HTML 硬寫 12 個）
const dotsContainer = document.querySelector('.dots-container');
if (dotsContainer) {
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      counter = i;
      updateSlide();
      stopTimer(); // 點擊後暫停自動播放
      startTimer();
    });
    dotsContainer.appendChild(dot);
  }
}

function moveNext() {
  counter = (counter >= imagesList.length - 1) ? 0 : counter + 1;
  updateSlide();
}

function movePrev() {
  counter = (counter <= 0) ? imagesList.length - 1 : counter - 1;
  updateSlide();
}

// 綁定按鈕事件
if (nextBtn && prevBtn) {
  nextBtn.addEventListener('click', () => {
    stopTimer();
    moveNext();
    startTimer(); // 點擊後重新計時
  });

  prevBtn.addEventListener('click', () => {
    stopTimer();
    movePrev();
    startTimer();
  });
}

// 初始化
if (slide && imagesList.length > 0) {
  startTimer();
}
// --- 跑馬燈邏輯結束 ---

updateCartCount();
loadFeaturedProducts();
window.quickAddToCart = quickAddToCart;
