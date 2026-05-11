/* =========================
   拾情話憶 - products.js (支援後端 API 版)
========================= */

const API_BASE_URL = 'https://643df25ad9157656-39-12-34-105.serveousercontent.com'; 
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

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
  const path = product?.image_url || product?.imageUrl || product?.image;
  if (!path) return FALLBACK_IMAGE;
  return path.includes('uploads') ? `${API_BASE_URL}/${path}` : path;
}

function getProductCategory(product) { return product?.category || '精選茶飲'; }
function money(n) { return `NT$ ${Number(n || 0)}`; }

function createProductCard(product) {
  const id = getProductId(product);
  return `
    <article class="product-card">
      <div class="product-media">
        <span class="product-tag">${getProductCategory(product)}</span>
        <a href="product-detail.html?slug=${product.slug || id}">
          <img src="${getProductImage(product)}" alt="${getProductName(product)}">
        </a>
      </div>
      <div class="product-body">
        <div class="product-title-row">
          <div class="product-title">
            <a href="product-detail.html?slug=${product.slug || id}">${getProductName(product)}</a>
          </div>
          <div class="price">${money(getProductPrice(product))}</div>
        </div>
        <div class="product-meta">風格日常 · 細節生活</div>
        <p class="muted">${product.description || ''}</p>
        <div class="product-actions">
          <a class="btn" href="product-detail.html?slug=${product.slug || id}">查看詳情</a>
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
    filtered.sort((a, b) => Number(getProductId(b)) - Number(getProductId(a)));
  }

  renderProducts(filtered);
}

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

async function loadProducts() {
  const container = document.getElementById('product-list');
  if (!container) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/products`, {
      headers: { 'Bypass-Tunnel-Reminder': 'true' }
    });
    
    if (!res.ok) throw new Error('API 無法連線');
    
    const result = await res.json();
    allProducts = Array.isArray(result.data) ? result.data : [];

    if (allProducts.length === 0 && window.mockProducts) {
       allProducts = window.mockProducts;
    }
    applyFilters();

  } catch (error) {
    console.error("載入失敗:", error);
    if (window.mockProducts) {
        allProducts = window.mockProducts;
        applyFilters();
    } else {
        container.innerHTML = `<div class="empty-state">商品載入失敗，請確認後端連線</div>`;
    }
  }
}

document.getElementById('search-input')?.addEventListener('input', applyFilters);
document.getElementById('category-filter')?.addEventListener('change', applyFilters);
document.getElementById('sort-filter')?.addEventListener('change', applyFilters);

updateCartCount();
loadProducts();

window.quickAddToCart = quickAddToCart;

// --- 全域導覽列：登入/登出與管理員切換 ---
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole'); 
    const navAuthBtns = document.querySelectorAll('.nav-auth-btn');
    
    if (token) {
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

        if (role === 'admin') {
            const cartLinks = document.querySelectorAll('a[href="cart.html"], a[href="/cart.html"]');
            cartLinks.forEach(link => {
                link.innerHTML = '商品管理'; 
                link.href = 'admin.html';    
            });
        }
    }
});
