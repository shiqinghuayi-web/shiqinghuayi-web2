function getCart() { return JSON.parse(localStorage.getItem('cart') || '[]'); }
function saveCart(cart) { localStorage.setItem('cart', JSON.stringify(cart)); }

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.querySelectorAll('#cart-count').forEach(el => { el.textContent = count; });
}

function getProductPrice(product) { return Number(product?.price || product?.unitPrice || 0); }
function getItemName(item) { return item?.name || item?.title || '未命名商品'; }
function getItemPrice(item) { return Number(item?.price || item?.unitPrice || 0); }
function money(n) { return `NT$ ${Number(n || 0)}`; }

function renderCheckout() {
  const cart = getCart();
  const itemsContainer = document.getElementById('checkout-items');
  const totalContainer = document.getElementById('checkout-total');
  if (!itemsContainer || !totalContainer) return;

  if (!cart.length) {
    itemsContainer.innerHTML = '<div class="empty-state">購物車沒有商品，無法進行結帳。</div>';
    totalContainer.innerHTML = '<a class="btn full" href="products.html">前往商品頁</a>';
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
    if(!token) {
        alert('請先登入會員再結帳');
        window.location.href = 'login.html';
        return;
    }

    // 核心修正：加上 API_BASE_URL 與穿透標頭
    const res = await fetch(`${API_BASE_URL}/api/orders`, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`,
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    if (!res.ok || !result.success) throw new Error(result.message || '訂單建立失敗');
    
    localStorage.removeItem('cart');
    alert('🎉 訂單已成功送出！');
    window.location.href = 'account.html';
  } catch (error) {
    alert(error.message || '目前無法送出訂單');
  }
});

renderCheckout();
updateCartCount();
