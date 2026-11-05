/* store.js — renders products and the cart panel */
const ranksBox = document.getElementById('ranks');
const itemsBox = document.getElementById('items');
const linesBox = document.getElementById('cart-lines');
const totalEl  = document.getElementById('cart-total');
const badge    = document.getElementById('cart-badge');
const checkout = document.getElementById('checkout-btn');

function productCard(p) {
    const card = mk('article', 'product');
    const head = mk('div', 'product-head');
    head.append(icon(p.icon), mk('h3', '', p.name));
    card.append(head, mk('p', 'desc', p.desc), mk('p', 'price', money(p.price)));

    const row = mk('div', 'product-actions');

    const add = mk('button', 'btn', 'Add to cart');
    add.type = 'button';
    add.addEventListener('click', () => {
        Cart.add(p.id);
        add.textContent = 'Added ✓';
        setTimeout(() => add.textContent = 'Add to cart', 900);
    });

    // Buy now: add to cart and open the purchase page directly
    const buy = mk('a', 'btn btn-ghost', 'Buy now');
    buy.href = 'checkout.html';
    buy.addEventListener('click', () => Cart.add(p.id));

    row.append(add, buy);
    card.append(row);
    return card;
}

function renderProducts() {
    PRODUCTS.forEach(p => (p.type === 'rank' ? ranksBox : itemsBox).append(productCard(p)));
}

function renderCart() {
    const lines = Cart.lines();
    linesBox.innerHTML = '';

    if (!lines.length) {
        linesBox.append(mk('p', 'empty', 'Your cart is empty.'));
    }

    lines.forEach(l => {
        const row = mk('div', 'cart-line');

        const info = mk('div', 'cart-info');
        info.append(mk('strong', '', l.name), mk('small', '', money(l.price) + (l.type === 'rank' ? ' • Rank' : ' each')));

        const ctrl = mk('div', 'cart-ctrl');
        if (l.type === 'item') {
            const minus = mk('button', 'qty-btn', '−'); minus.type = 'button';
            const plus  = mk('button', 'qty-btn', '+'); plus.type = 'button';
            minus.addEventListener('click', () => l.qty > 1 ? Cart.setQty(l.id, l.qty - 1) : Cart.remove(l.id));
            plus.addEventListener('click', () => Cart.setQty(l.id, l.qty + 1));
            ctrl.append(minus, mk('span', 'qty', l.qty), plus);
        }
        const del = mk('button', 'qty-btn del', '✕'); del.type = 'button';
        del.setAttribute('aria-label', 'Remove ' + l.name);
        del.addEventListener('click', () => Cart.remove(l.id));
        ctrl.append(del);

        row.append(info, mk('span', 'line-total', money(l.subtotal)), ctrl);
        linesBox.append(row);
    });

    totalEl.textContent = money(Cart.total());

    const n = Cart.count();
    badge.textContent = n;
    badge.hidden = n === 0;

    // can't open the purchase page with an empty cart
    checkout.classList.toggle('disabled', n === 0);
    checkout.setAttribute('aria-disabled', n === 0);
}

checkout.addEventListener('click', e => { if (!Cart.count()) e.preventDefault(); });
document.getElementById('clear-btn').addEventListener('click', () => Cart.clear());

// updates when the cart changes here or in another tab
window.addEventListener('cart:change', renderCart);
window.addEventListener('storage', e => { if (e.key === 'cart_items') renderCart(); });

renderProducts();
renderCart();
