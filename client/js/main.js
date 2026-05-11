/**
 * 拾情話憶 - main.js (聲音按鈕優化版)
 */

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
function money(n) { return `NT$ ${Number(n || 0).toLocaleString()}`; }

// --- 聲音切換控制 (符號邏輯) ---
function setupVideoSound() {
    const video = document.getElementById('hero-video');
    const unmuteBtn = document.getElementById('unmute-btn');
    if (!video || !unmuteBtn) return;

    unmuteBtn.onclick = (e) => {
        e.stopPropagation();
        if (video.muted) {
            video.muted = false;
            video.volume = 1.0;
            video.play().catch(() => {});
            unmuteBtn.textContent = '🔇'; // 切換成靜音符號 (點擊會關聲音)
        } else {
            video.muted = true;
            unmuteBtn.textContent = '🔊'; // 切換成播放符號 (點擊會開聲音)
        }
    };
}

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
        featuredProducts = window.mockProducts || [];
    }

    container.innerHTML = featuredProducts.slice(0, 3).map(createProductCard).join('') || 
                          '<div class="empty-state">目前沒有商品可顯示</div>';
}

// --- 全域導覽列：登入/登出與管理員專屬選單 ---
function setupAuthNav() {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole'); 
    const navContainer = document.querySelector('.main-nav');
    
    if (token && role === 'admin') {
        if (navContainer) {
            const path = window.location.pathname;
            const isIndex = path.includes('index.html') || path.endsWith('/');
            const isAdmin = path.includes('admin.html');
            const isOrders = path.includes('admin-orders.html');

            navContainer.innerHTML = `
                <a href="index.html" class="${isIndex ? 'active' : ''}">前台首頁</a>
                <a href="admin.html" class="${isAdmin ? 'active' : ''}">商品管理</a>
                <a href="admin-orders.html" class="${isOrders ? 'active' : ''}">訂單管理</a>
                <a href="#" id="admin-logout-btn">登出</a>
            `;

            document.getElementById('admin-logout-btn').onclick = (e) => {
                e.preventDefault();
                if (confirm('確定要登出嗎？')) {
                    localStorage.clear();
                    window.location.href = 'index.html'; 
                }
            };
        }
    } else if (token) {
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
    }
}

// --- 跑馬燈邏輯 ---
let counter = 0;
function setupCarousel() {
    const slide = document.querySelector('.carousel-slide');
    const imagesList = document.querySelectorAll('.carousel-slide img');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    const dotsContainer = document.querySelector('.dots-container');

    if (!slide || imagesList.length === 0) return;

    imagesList.forEach((_, i) => {
        const dot = document.createElement('span');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.onclick = () => { counter = i; updateSlide(); };
        dotsContainer.appendChild(dot);
    });

    function updateSlide() {
        slide.style.transform = `translateX(${-100 * counter}%)`;
        document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === counter));
    }

    nextBtn.onclick = () => { counter = (counter + 1) % imagesList.length; updateSlide(); };
    prevBtn.onclick = () => { counter = (counter - 1 + imagesList.length) % imagesList.length; updateSlide(); };
    
    setInterval(() => { counter = (counter + 1) % imagesList.length; updateSlide(); }, 4000);
}

// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    setupAuthNav();
    updateCartCount();
    loadFeaturedProducts();
    setupVideoSound();
    setupCarousel();
});
