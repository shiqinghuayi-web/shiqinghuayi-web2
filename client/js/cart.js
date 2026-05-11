const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

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
  return product?.id || product?.productId || product?.slug || Date.now();
}

function getProductName(product) {
  return product?.name || product?.title || '未命名商品';
}

function getProductPrice(product) {
  return Number(product?.price || product?.unitPrice || 0);
}

function getProductImage(product) {
  return product?.imageUrl || product?.image || product?.coverImage || FALLBACK_IMAGE;
}

function getProductCategory(product) {
  if (typeof product?.category === 'object' && product.category !== null) {
    return product.category.name || '商品分類';
  }
  return product?.category || '商品分類';
}

function createCartItem(product, quantity = 1) {
  return {
    id: getProductId(product),
    productId: getProductId(product),
    slug: product?.slug || '',
    name: getProductName(product),
    title: getProductName(product),
    price: getProductPrice(product),
    unitPrice: getProductPrice(product),
    imageUrl: getProductImage(product),
    image: getProductImage(product),
    quantity
  };
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const productId = String(getProductId(product));
  const existing = cart.find(item => String(item.id) === productId);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push(createCartItem(product, quantity));
  }

  saveCart(cart);
  updateCartCount();
}

function money(n) {
  return `NT$ ${Number(n || 0)}`;
}

function getItemId(item) {
  return item?.id || item?.productId;
}
function getItemName(item) {
  return item?.name || item?.title || '未命名商品';
}
function getItemPrice(item) {
  return Number(item?.price || item?.unitPrice || 0);
}
function getItemImage(item) {
  return item?.imageUrl || item?.image || FALLBACK_IMAGE;
}

function changeItemQty(id, step) {
  const cart = getCart().map(item => {
    if (String(getItemId(item)) === String(id)) {
      return { ...item, quantity: Math.max(1, Number(item.quantity || 1) + step) };
    }
    return item;
  });
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  saveCart(getCart().filter(item => String(getItemId(item)) !== String(id)));
  renderCart();
}

function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const cartSummary = document.getElementById('cart-summary');
  const cart = getCart();
  if (!cartItems || !cartSummary) return;
  updateCartCount();

  if (!cart.length) {
    cartItems.innerHTML = '<div class="empty-state">你的購物車目前是空的，先去挑幾樣喜歡的商品吧。</div>';
    cartSummary.innerHTML = `<h3 style="margin-top:0">訂單摘要</h3><p class="muted">目前尚未加入商品</p><a class="btn full" href="products.html">前往選購</a>`;
    return;
  }

  cartItems.innerHTML = cart.map(item => {
    const qty = Number(item.quantity || 1);
    const total = getItemPrice(item) * qty;
    return `
      <article class="cart-item">
        <img src="${getItemImage(item)}" alt="${getItemName(item)}">
        <div>
          <h3 style="margin:0 0 8px;color:var(--primary-strong)">${getItemName(item)}</h3>
          <p class="muted">單價：${money(getItemPrice(item))}</p>
          <div class="qty-row">
            <div class="qty-box">
              <button type="button" onclick="changeItemQty('${getItemId(item)}', -1)">−</button>
              <input type="number" readonly value="${qty}">
              <button type="button" onclick="changeItemQty('${getItemId(item)}', 1)">＋</button>
            </div>
          </div>
        </div>
        <div>
          <p class="price">${money(total)}</p>
          <button class="btn btn-outline" onclick="removeItem('${getItemId(item)}')">移除</button>
        </div>
      </article>
    `;
  }).join('');

  const subtotal = cart.reduce((sum,item) => sum + getItemPrice(item) * Number(item.quantity || 1), 0);
  const shipping = subtotal >= 1500 ? 0 : 80;
  const total = subtotal + shipping;

  cartSummary.innerHTML = `
    <h3 style="margin-top:0">訂單摘要</h3>
    <div class="summary-line"><span>小計</span><span>${money(subtotal)}</span></div>
    <div class="summary-line"><span>運費</span><span>${shipping === 0 ? '免運' : money(shipping)}</span></div>
    <hr class="divider">
    <div class="summary-total"><span>總計</span><span>${money(total)}</span></div>
    <a class="btn full" href="checkout.html">前往結帳</a>
  `;
}

renderCart();
window.changeItemQty = changeItemQty;
window.removeItem = removeItem;

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
