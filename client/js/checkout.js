


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

function getItemName(item) {
  return item?.name || item?.title || '未命名商品';
}
function getItemPrice(item) {
  return Number(item?.price || item?.unitPrice || 0);
}

function renderCheckout() {
  const cart = getCart();
  const itemsContainer = document.getElementById('checkout-items');
  const totalContainer = document.getElementById('checkout-total');
  if (!itemsContainer || !totalContainer) return;

  if (!cart.length) {
    itemsContainer.innerHTML = '<div class="empty-state">購物車沒有商品，無法進行結帳。</div>';
    totalContainer.innerHTML = '<a class="btn full" href="/products.html">前往商品頁</a>';
    return;
  }

  itemsContainer.innerHTML = cart.map(item => `
    <div class="summary-line" style="margin-bottom:10px">
      <span>${getItemName(item)} × ${Number(item.quantity || 1)}</span>
      <span>${money(getItemPrice(item) * Number(item.quantity || 1))}</span>
    </div>
  `).join('');

  const subtotal = cart.reduce((sum,item) => sum + getItemPrice(item) * Number(item.quantity || 1), 0);
  const shipping = subtotal >= 1500 ? 0 : 80;
  const total = subtotal + shipping;

  totalContainer.innerHTML = `
    <div class="summary-line"><span>小計</span><span>${money(subtotal)}</span></div>
    <div class="summary-line"><span>運費</span><span>${shipping === 0 ? '免運' : money(shipping)}</span></div>
    <hr class="divider">
    <div class="summary-total"><span>總計</span><span>${money(total)}</span></div>
  `;
}

document.getElementById('checkout-form')?.addEventListener('submit', async e => {
  e.preventDefault();
  const cart = getCart();
  if (!cart.length) return alert('購物車是空的');

  const formData = new FormData(e.currentTarget);
  const payload = {
    receiverName: formData.get('receiverName'),
    receiverPhone: formData.get('receiverPhone'),
    receiverAddress: formData.get('receiverAddress'),
    paymentMethod: formData.get('paymentMethod'),
    items: cart,
    totalAmount: cart.reduce((sum,item) => sum + getItemPrice(item) * Number(item.quantity || 1), 0)
  };

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/orders', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        ...(token ? {Authorization:`Bearer ${token}`} : {})
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || '訂單建立失敗');
    localStorage.removeItem('cart');
    alert('訂單已送出');
    window.location.href = '/account.html';
  } catch (error) {
    alert(error.message || '目前無法送出訂單');
  }
});

renderCheckout();
