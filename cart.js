/* cart.js — cart system (stored in localStorage)
   Needs: products.js loaded first.
   Stores only { id, qty }. Prices are ALWAYS re-read from products.js,
   so editing localStorage can't change a price. */
const Cart = (() => {
    'use strict';
    const KEY = 'cart_items';

    function read() {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY));
            if (!Array.isArray(raw)) return [];
            // drop unknown products and fix bad quantities
            return raw
                .filter(i => i && productById(i.id))
                .map(i => ({ id: i.id, qty: clamp(productById(i.id), i.qty) }));
        } catch { return []; }
    }

    function write(items) {
        try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage blocked */ }
        window.dispatchEvent(new CustomEvent('cart:change'));
    }

    function clamp(p, qty) {
        const max = p.type === 'rank' ? 1 : (p.max || 99);
        qty = Math.floor(Number(qty)) || 1;
        return Math.min(Math.max(qty, 1), max);
    }

    function add(id, qty = 1) {
        const p = productById(id);
        if (!p) return false;
        const items = read();
        const found = items.find(i => i.id === id);
        if (found) found.qty = clamp(p, found.qty + qty);
        else items.push({ id, qty: clamp(p, qty) });
        write(items);
        return true;
    }

    function setQty(id, qty) {
        const p = productById(id);
        if (!p) return;
        write(read().map(i => i.id === id ? { id, qty: clamp(p, qty) } : i));
    }

    const remove = id => write(read().filter(i => i.id !== id));
    const clear  = () => write([]);

    // items joined with product data
    const lines = () => read().map(i => {
        const p = productById(i.id);
        return { ...p, qty: i.qty, subtotal: +(p.price * i.qty).toFixed(2) };
    });

    const count = () => read().reduce((n, i) => n + i.qty, 0);
    const total = () => +lines().reduce((s, l) => s + l.subtotal, 0).toFixed(2);

    return { add, setQty, remove, clear, lines, count, total };
})();

/* tiny DOM helper (textContent => no HTML injection) */
function mk(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) e.textContent = text;
    return e;
}

function icon(name) {
    return mk('span', 'material-symbols-outlined', name);
}
