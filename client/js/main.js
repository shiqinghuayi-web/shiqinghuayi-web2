/**
 * 拾情話憶 - main.js (後端 API 串接版)
 */
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

function getProductImage(product) { 
    let img = product?.image_url || product?.imageUrl || product?.image;
    if (!img) return FALLBACK_IMAGE;
    if (img.includes('uploads/')) return `${API_BASE_URL}/${img}`;
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
        const res = await fetch(`${API_BASE_URL}/api/products`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
        });
        
        if (!res.ok) throw new Error('API 無法連線');
        
        const result = await res.json();
        featuredProducts = Array.isArray(result.data) ? result.data : [];

        if (featuredProducts.length === 0) {
            featuredProducts = window.mockProducts || [];
        }
    } catch (error) {
        console.warn("後端載入失敗，正在切換至 Mock 資料...", error);
        featuredProducts = window.mockProducts || [];
    }

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

let autoPlay;
function startTimer() {
  stopTimer();
  autoPlay = setInterval(moveNext, 3000); 
}
function stopTimer() { clearInterval(autoPlay); }

function updateSlide() {
  slide.style.transform = `translateX(${-100 * counter}%)`;
  const allDots = document.querySelectorAll('.dot');
  allDots.forEach((dot, index) => {
    if (index === counter) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}

const dotsContainer = document.querySelector('.dots-container');
if (dotsContainer) {
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('span');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      counter = i;
      updateSlide();
      stopTimer(); 
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

if (nextBtn && prevBtn) {
  nextBtn.addEventListener('click', () => { stopTimer(); moveNext(); startTimer(); });
  prevBtn.addEventListener('click', () => { stopTimer(); movePrev(); startTimer(); });
}

if (slide && imagesList.length > 0) startTimer();
// --- 跑馬燈邏輯結束 ---

// --- 全域導覽列：登入/登出與管理員切換 ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole'); // 抓取身分
    const navAuthBtns = document.querySelectorAll('.nav-auth-btn');
    
    if (token) {
        // 1. 把登入改登出
        navAuthBtns.forEach(btn => {
            btn.textContent = '登出';
            btn.href = '#';
            btn.onclick = (e) => {
                e.preventDefault();
                if (confirm('確定要登出嗎？')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('userRole');
                    window.location.href = 'index.html'; 
                }
            };
        });

        // 2. 如果是管理員，把購物車按鈕改成商品管理
        if (role === 'admin') {
            const cartLinks = document.querySelectorAll('a[href="cart.html"], a[href="/cart.html"]');
            cartLinks.forEach(link => {
                link.innerHTML = '商品管理'; 
                link.href = 'admin.html';    
            });
        }
    }
});
