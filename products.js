/* products.js — product catalog (ranks + items)
   IDs are fixed UUID v7 values (generated once with ids.js). Never regenerate them
   on page load, otherwise old carts/orders would point to nothing. */
const CURRENCY = 'USD';

const PRODUCTS = [
    // ---- Ranks (one per order) ----
    { id: 'rnk_01a1a796-193e-7059-a418-70a8149f0371', type: 'rank', icon: 'workspace_premium',
      name: 'VIP', price: 5, desc: 'Colored name, /fly in the lobby, 2 homes.' },
    { id: 'rnk_01a1a796-1943-701d-911c-e1110a0d43e0', type: 'rank', icon: 'diamond',
      name: 'VIP+', price: 12, desc: 'Everything in VIP, plus kits and 5 homes.' },
    { id: 'rnk_01a1a796-1943-701e-916a-ee657cabace4', type: 'rank', icon: 'military_tech',
      name: 'MVP', price: 25, desc: 'All perks, priority queue and a custom prefix.' },

    // ---- Items (quantity allowed) ----
    { id: 'itm_01a1a796-1944-7064-8fa3-7b7da75fc8c6', type: 'item', icon: 'swords',
      name: 'Enchanted Sword', price: 2, desc: 'Sharpness V, Unbreaking III.', max: 10 },
    { id: 'itm_01a1a796-1944-7065-9694-e75fec0b408e', type: 'item', icon: 'shield',
      name: 'Armor Set', price: 4, desc: 'Full diamond set, Protection IV.', max: 10 },
    { id: 'itm_01a1a796-1944-7066-94d2-97090f2dd384', type: 'item', icon: 'paid',
      name: 'In-game Coins x1000', price: 3, desc: '1000 server coins.', max: 20 },
    { id: 'itm_01a1a796-1944-7067-822d-8523454f203a', type: 'item', icon: 'key',
      name: 'Crate Key', price: 1.5, desc: 'One key for the daily crate.', max: 50 }
];

const productById = id => PRODUCTS.find(p => p.id === id) || null;
const money = n => new Intl.NumberFormat('en', { style: 'currency', currency: CURRENCY }).format(n);
