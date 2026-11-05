/* checkout.js — purchase page
   Flow: cart -> checkout.html (details) -> order created (ord_ UUID v7)
         -> confirmation -> "Go to payment" (PAYMENT_URL?order=ID)
   Needs: ids.js, products.js, cart.js loaded first. */

// Change this to your real payment page / gateway link.
const PAYMENT_URL = 'payment.html';

const ORDERS_KEY = 'orders';

const formView  = document.getElementById('checkout-form-view');
const doneView  = document.getElementById('done-view');
const emptyView = document.getElementById('empty-view');
const form      = document.getElementById('checkout-form');
const errorEl   = document.getElementById('form-error');

/* ---------- orders storage ---------- */
function loadOrders() {
    try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; }
    catch { return []; }
}

function saveOrder(order) {
    const all = loadOrders();
    all.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
}

function findOrder(id) {
    return IDS.isValid(id, 'purchase') ? loadOrders().find(o => o.id === id) || null : null;
}

/* ---------- rendering ---------- */
function renderLines(box, lines) {
    box.innerHTML = '';
    lines.forEach(l => {
        const row = mk('div', 'cart-line');
        const info = mk('div', 'cart-info');
        info.append(
            mk('strong', '', l.name + (l.qty > 1 ? ' × ' + l.qty : '')),
            mk('small', '', money(l.price) + (l.qty > 1 ? ' each' : ''))
        );
        row.append(info, mk('span', 'line-total', money(l.subtotal)));
        box.append(row);
    });
}

function idRow(id) {
    const box = document.getElementById('done-id');
    box.innerHTML = '';
    box.append(mk('code', '', id));
    const copy = mk('button', 'btn copy-id', 'Copy');
    copy.type = 'button';
    copy.addEventListener('click', () => {
        navigator.clipboard.writeText(id);
        copy.textContent = 'Copied!';
        setTimeout(() => copy.textContent = 'Copy', 1200);
    });
    box.append(copy);
}

function showDone(order) {
    formView.hidden = true;
    emptyView.hidden = true;
    doneView.hidden = false;

    idRow(order.id);
    renderLines(document.getElementById('done-lines'), order.lines);
    document.getElementById('done-total').textContent = money(order.total);

    const pay = document.getElementById('pay-btn');
    pay.href = PAYMENT_URL + '?order=' + encodeURIComponent(order.id);
}

function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
}

/* ---------- submit ---------- */
form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.hidden = true;

    const mcName = document.getElementById('mc-name').value.trim();
    const email  = document.getElementById('mc-email').value.trim();

    if (!/^[A-Za-z0-9_]{3,16}$/.test(mcName))
        return showError('Username must be 3–16 characters: letters, numbers or underscore.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return showError('Please enter a valid email.');

    const lines = Cart.lines();
    if (!lines.length) return location.reload();

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    const order = {
        id: IDS.purchase(),
        userId: IDS.user(),
        visitId: IDS.visit(),
        mcName,
        email,
        // snapshot of what was bought, with the price at purchase time
        lines: lines.map(l => ({
            id: l.id, name: l.name, type: l.type,
            price: l.price, qty: l.qty, subtotal: l.subtotal
        })),
        total: Cart.total(),
        currency: CURRENCY,
        status: 'pending',          // pending -> paid (set by the server after payment)
        created: new Date().toISOString()
    };
    order.seal = await IDS.seal(
        order.id, order.userId, order.mcName, order.total,
        order.lines.map(l => l.id + 'x' + l.qty).join(',')
    );

    try {
        saveOrder(order);
    } catch {
        submitBtn.disabled = false;
        return showError('Could not save your order (storage is blocked).');
    }

    Cart.clear();
    history.replaceState(null, '', 'checkout.html?order=' + encodeURIComponent(order.id));
    showDone(order);
});

/* ---------- initial view ---------- */
(function init() {
    const id = new URLSearchParams(location.search).get('order');

    if (id) {                       // refresh / returning from payment
        const order = findOrder(id);
        if (order) return showDone(order);
    }

    const lines = Cart.lines();
    if (!lines.length) {
        formView.hidden = true;
        emptyView.hidden = false;
        return;
    }

    renderLines(document.getElementById('order-lines'), lines);
    document.getElementById('order-total').textContent = money(Cart.total());
})();
