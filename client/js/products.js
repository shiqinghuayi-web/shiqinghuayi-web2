
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1517705008128-361805f42e86?auto=format&fit=crop&w=1200&q=80";

function getCart() {
  return JSON.parse(localStorage.getItem('cart') || '[]');
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
  const count = getCart().reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

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
  return (
    product?.imageUrl ||
    product?.image ||
    product?.coverImage ||
    FALLBACK_IMAGE
  );
}

function getProductCategory(product) {
  if (
    typeof product?.category === 'object' &&
    product.category !== null
  ) {
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

  const existing = cart.find(
    item => String(item.id) === productId
  );

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

function createProductCard(product) {

  const id = getProductId(product);

  return `
    <article class="product-card">

      <div class="product-media">
        <span class="product-tag">
          ${getProductCategory(product)}
        </span>

        <img
          src="${getProductImage(product)}"
          alt="${getProductName(product)}"
        >
      </div>

      <div class="product-body">

        <div class="product-title-row">
          <div class="product-title">
            ${getProductName(product)}
          </div>

          <div class="price">
            ${money(getProductPrice(product))}
          </div>
        </div>

        <div class="product-meta">
          風格日常 · 細節生活
        </div>

        <p class="muted">
          ${product.description || ''}
        </p>

        <div class="product-actions">

          <!-- 修正 product-detail 路徑 -->
          <a
            class="btn"
            href="./product-detail.html?slug=${product.slug || id}"
          >
            查看詳情
          </a>

          <button
            class="btn btn-outline"
            onclick="quickAddToCart('${id}')"
          >
            加入購物車
          </button>

        </div>

      </div>
    </article>
  `;
}

let allProducts = [];

function renderProducts(products) {

  const container =
    document.getElementById('product-list');

  if (!container) return;

  container.innerHTML = products.length
    ? products.map(createProductCard).join('')
    : `
      <div class="empty-state">
        目前沒有符合條件的商品
      </div>
    `;
}

function applyFilters() {

  const keyword =
    (
      document.getElementById('search-input')?.value || ''
    )
    .trim()
    .toLowerCase();

  const category =
    document.getElementById('category-filter')?.value || '';

  const sort =
    document.getElementById('sort-filter')?.value || 'new';

  let filtered = [...allProducts].filter(product => {

    const matchKeyword =
      getProductName(product)
      .toLowerCase()
      .includes(keyword);

    const matchCategory =
      !category ||
      getProductCategory(product) === category;

    return matchKeyword && matchCategory;
  });

  if (sort === 'price-asc') {

    filtered.sort(
      (a, b) =>
        getProductPrice(a) - getProductPrice(b)
    );

  } else if (sort === 'price-desc') {

    filtered.sort(
      (a, b) =>
        getProductPrice(b) - getProductPrice(a)
    );

  } else {

    filtered.sort(
      (a, b) =>
        Number(getProductId(b)) -
        Number(getProductId(a))
    );
  }

  renderProducts(filtered);
}

function quickAddToCart(productId) {

  const product = allProducts.find(
    item =>
      String(getProductId(item)) ===
      String(productId)
  );

  if (!product) {
    return alert('找不到商品資料');
  }

  addToCart(product, 1);

  alert('已加入購物車');
}

/* =========================
   改成讀 mockProducts
========================= */

function loadProducts() {

  const container =
    document.getElementById('product-list');

  if (!container) return;

  try {

    allProducts = window.mockProducts || [];

    applyFilters();

  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        商品載入失敗
      </div>
    `;
  }
}

/* =========================
   監聽器
========================= */

document
  .getElementById('search-input')
  ?.addEventListener('input', applyFilters);

document
  .getElementById('category-filter')
  ?.addEventListener('change', applyFilters);

document
  .getElementById('sort-filter')
  ?.addEventListener('change', applyFilters);

/* =========================
   初始化
========================= */

updateCartCount();

loadProducts();

window.quickAddToCart = quickAddToCart;
