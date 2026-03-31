(function () {
  const STORAGE_KEY = 'soultype-cart';

  /** @type {{ id: string, name: string, price: number, qty: number }[]} */
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveCart(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  const cartCountEl = document.getElementById('cart-count');
  const cartItemsEl = document.getElementById('cart-items');
  const cartEmptyEl = document.getElementById('cart-empty');
  const cartFooterEl = document.getElementById('cart-footer');
  const cartTotalEl = document.getElementById('cart-total');
  const cartPanel = document.getElementById('cart-panel');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartToggle = document.getElementById('cart-toggle');
  const cartClose = document.getElementById('cart-close');
  const clearCartBtn = document.getElementById('clear-cart');
  const checkoutBtn = document.getElementById('checkout-btn');
  const toastEl = document.getElementById('toast');

  function formatMoney(n) {
    return '$' + n.toFixed(2);
  }

  function getTotals(items) {
    const count = items.reduce((s, i) => s + i.qty, 0);
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    return { count, total };
  }

  function renderCart() {
    const items = loadCart();
    const { count, total } = getTotals(items);

    if (cartCountEl) {
      cartCountEl.textContent = String(count);
      cartCountEl.hidden = count === 0;
    }

    if (!cartItemsEl || !cartEmptyEl || !cartFooterEl || !cartTotalEl) return;

    cartItemsEl.innerHTML = '';
    if (items.length === 0) {
      cartEmptyEl.hidden = false;
      cartFooterEl.hidden = true;
      return;
    }

    cartEmptyEl.hidden = true;
    cartFooterEl.hidden = false;
    cartTotalEl.textContent = formatMoney(total);

    items.forEach((line) => {
      const li = document.createElement('li');
      li.className = 'cart-line';
      li.dataset.id = line.id;

      const info = document.createElement('div');
      info.className = 'cart-line-info';
      const name = document.createElement('span');
      name.className = 'cart-line-name';
      name.textContent = line.name;
      const sub = document.createElement('span');
      sub.className = 'cart-line-sub';
      sub.textContent = formatMoney(line.price) + ' × ' + line.qty;
      info.append(name, sub);

      const controls = document.createElement('div');
      controls.className = 'cart-line-controls';

      const minus = document.createElement('button');
      minus.type = 'button';
      minus.className = 'qty-btn';
      minus.setAttribute('aria-label', 'Decrease quantity');
      minus.textContent = '−';

      const qty = document.createElement('span');
      qty.className = 'qty-val';
      qty.textContent = String(line.qty);

      const plus = document.createElement('button');
      plus.type = 'button';
      plus.className = 'qty-btn';
      plus.setAttribute('aria-label', 'Increase quantity');
      plus.textContent = '+';

      minus.addEventListener('click', () => updateQty(line.id, -1));
      plus.addEventListener('click', () => updateQty(line.id, 1));

      controls.append(minus, qty, plus);
      li.append(info, controls);
      cartItemsEl.appendChild(li);
    });
  }

  function updateQty(id, delta) {
    let items = loadCart();
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) return;
    items[idx].qty += delta;
    if (items[idx].qty <= 0) items = items.filter((i) => i.id !== id);
    saveCart(items);
    renderCart();
  }

  function addToCart(id, name, price) {
    const items = loadCart();
    const existing = items.find((i) => i.id === id);
    if (existing) existing.qty += 1;
    else items.push({ id, name, price: Number(price), qty: 1 });
    saveCart(items);
    renderCart();
    showToast('Added to cart: ' + name);
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add('toast-visible');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      toastEl.classList.remove('toast-visible');
      toastEl.hidden = true;
    }, 2800);
  }

  function openCart() {
    if (!cartPanel || !cartBackdrop || !cartToggle) return;
    cartPanel.classList.add('cart-open');
    cartBackdrop.hidden = false;
    cartToggle.setAttribute('aria-expanded', 'true');
    cartPanel.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    if (!cartPanel || !cartBackdrop || !cartToggle) return;
    cartPanel.classList.remove('cart-open');
    cartBackdrop.hidden = true;
    cartToggle.setAttribute('aria-expanded', 'false');
    cartPanel.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.btn-buy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const name = btn.getAttribute('data-name');
      const price = btn.getAttribute('data-price');
      if (id && name && price) addToCart(id, name, price);
    });
  });

  cartToggle?.addEventListener('click', () => {
    if (cartPanel?.classList.contains('cart-open')) closeCart();
    else openCart();
  });
  cartClose?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);

  clearCartBtn?.addEventListener('click', () => {
    saveCart([]);
    renderCart();
    showToast('Cart cleared');
  });

  checkoutBtn?.addEventListener('click', () => {
    const items = loadCart();
    if (items.length === 0) return;
    const { total } = getTotals(items);
    showToast('Demo checkout — total would be ' + formatMoney(total));
    closeCart();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });

  const form = document.getElementById('form');
  const formMessage = document.getElementById('form-message');
  const emailInput = document.getElementById('email');

  form?.addEventListener('submit', (e) => {
    if (!emailInput?.checkValidity()) {
      e.preventDefault();
      if (formMessage) {
        formMessage.hidden = false;
        formMessage.textContent = 'Please enter a valid email address.';
        formMessage.classList.add('form-error');
      }
      return;
    }
    if (formMessage) {
      formMessage.hidden = true;
      formMessage.classList.remove('form-error');
    }
    showToast('Submitting…');
  });

  const modal = document.getElementById('info-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalClose = document.getElementById('modal-close');

  const modalContent = {
    privacy: {
      title: 'Privacy',
      html: '<p>We respect your privacy. This demo site does not collect personal data beyond what you type in the signup form for display purposes.</p>',
    },
    terms: {
      title: 'Terms',
      html: '<p>This is a demonstration storefront. Products and checkout are not real transactions.</p>',
    },
  };

  document.querySelectorAll('[data-modal]').forEach((link) => {
    link.addEventListener('click', (ev) => {
      const key = link.getAttribute('data-modal');
      if (!key || !modalContent[key] || !modal || !modalTitle || !modalBody) return;
      ev.preventDefault();
      modalTitle.textContent = modalContent[key].title;
      modalBody.innerHTML = modalContent[key].html;
      if (typeof modal.showModal === 'function') modal.showModal();
    });
  });

  modalClose?.addEventListener('click', () => modal?.close());
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.close();
  });

  renderCart();
})();
