/* =========================================================
   ids.js  —  UUID v7 ID system (RFC 9562)
   Load BEFORE any script that uses it:
   <script src="ids.js"></script>
   ========================================================= */
const IDS = (() => {
    'use strict';

    // true  => "ord_0192f3a4-7b1c-7c3e-9a2d-5e6f7a8b9c0d"  (easy to read in support)
    // false => plain UUID v7
    const USE_PREFIX = true;

    // Type -> prefix
    const TYPES = {
        user:     'usr',
        visit:    'vis',
        message:  'msg',   // community post
        reply:    'rpl',   // community reply
        purchase: 'ord',   // purchase / order
        rank:     'rnk',   // rank (product)
        item:     'itm',   // item (product)
        clan:     'cln',
        clanMember: 'clm',
        ticket:   'tkt',   // inquiry / support ticket
        news:     'nws'
    };

    const UUID7_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const hex = b => b.toString(16).padStart(2, '0');

    /* ---------- core UUID v7 (monotonic) ---------- */
    let lastMs = 0;
    let counter = 0; // 12 bits, keeps order inside the same millisecond

    function randomBytes(n) {
        const a = new Uint8Array(n);
        crypto.getRandomValues(a);
        return a;
    }

    function uuid7() {
        let ms = Date.now();
        if (ms <= lastMs) {
            // same ms (or clock went back): increase counter
            counter++;
            if (counter > 0xfff) { lastMs++; counter = 0; }
            ms = lastMs;
        } else {
            lastMs = ms;
            counter = randomBytes(2)[0] & 0x7f; // random start, leaves room to count up
        }

        const b = new Uint8Array(16);
        // 48-bit timestamp
        b[0] = Math.floor(ms / 2 ** 40) & 0xff;
        b[1] = Math.floor(ms / 2 ** 32) & 0xff;
        b[2] = Math.floor(ms / 2 ** 24) & 0xff;
        b[3] = Math.floor(ms / 2 ** 16) & 0xff;
        b[4] = Math.floor(ms / 2 ** 8) & 0xff;
        b[5] = ms & 0xff;
        // version 7 + 12-bit counter
        b[6] = 0x70 | ((counter >> 8) & 0x0f);
        b[7] = counter & 0xff;
        // variant 10 + 62 random bits
        const r = randomBytes(8);
        b[8] = 0x80 | (r[0] & 0x3f);
        b.set(r.subarray(1), 9);

        const h = Array.from(b, hex).join('');
        return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }

    /* ---------- generic maker ---------- */
    function make(type) {
        const prefix = TYPES[type];
        if (!prefix) throw new Error('Unknown ID type: ' + type);
        const id = uuid7();
        return USE_PREFIX ? `${prefix}_${id}` : id;
    }

    /* ---------- parse / validate ---------- */
    function parse(id) {
        if (typeof id !== 'string') return null;
        let type = null, raw = id;
        const i = id.indexOf('_');
        if (i > -1) {
            const p = id.slice(0, i);
            type = Object.keys(TYPES).find(k => TYPES[k] === p) || null;
            if (!type) return null;
            raw = id.slice(i + 1);
        }
        if (!UUID7_RE.test(raw)) return null;
        const ms = parseInt(raw.replace(/-/g, '').slice(0, 12), 16);
        return { type, uuid: raw.toLowerCase(), timestamp: ms, date: new Date(ms) };
    }

    const isValid = (id, type) => {
        const p = parse(id);
        return !!p && (!type || p.type === type);
    };

    /* ---------- persistent user id / per-tab visit id ---------- */
    function stored(storage, key, type) {
        try {
            let v = storage.getItem(key);
            if (!isValid(v, type)) {
                v = make(type);
                storage.setItem(key, v);
            }
            return v;
        } catch {
            // storage blocked: keep one in memory for this page
            return (stored.mem[key] ||= make(type));
        }
    }
    stored.mem = {};

    const user  = () => stored(localStorage,   'ids_user',  'user');
    const visit = () => stored(sessionStorage, 'ids_visit', 'visit');

    /* ---------- seal (SHA-256 fingerprint of the content) ---------- */
    async function seal(...parts) {
        const data = parts.join('\u241F');
        if (crypto.subtle) { // needs HTTPS or localhost
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
            return Array.from(new Uint8Array(buf), hex).join('');
        }
        // fallback (weak, only when crypto.subtle is unavailable)
        let h = 5381;
        for (let i = 0; i < data.length; i++) h = ((h << 5) + h + data.charCodeAt(i)) >>> 0;
        return 'weak-' + h.toString(16);
    }

    /* ---------- public API ---------- */
    return {
        make, parse, isValid, seal, uuid7,
        user, visit,
        message:  () => make('message'),
        reply:    () => make('reply'),
        purchase: () => make('purchase'),
        rank:     () => make('rank'),
        item:     () => make('item'),
        clan:     () => make('clan'),
        clanMember: () => make('clanMember'),
        ticket:   () => make('ticket'),
        news:     () => make('news'),
        TYPES
    };
})();