const KEY = 'community_posts';
const postsBox = document.getElementById('posts');

function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
}

function hasDuplicates(posts) {
    const seen = new Set();
    for (const p of posts) {
        if (seen.has(p.id)) return true;
        seen.add(p.id);
        for (const r of p.replies || []) {
            if (seen.has(r.id)) return true;
            seen.add(r.id);
        }
    }
    return false;
}

function save(posts) {
    if (hasDuplicates(posts)) {
        alert('Duplicate ID detected. Save blocked.');
        return false;
    }
    localStorage.setItem(KEY, JSON.stringify(posts));
    return true;
}

function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text; // يمنع إدخال أكواد ضارة
    return e;
}

function idBadge(id) {
    const row = el('div', 'msg-id');
    row.append(el('code', '', id));
    const copy = el('button', 'copy-id', 'Copy');
    copy.type = 'button';
    copy.addEventListener('click', () => {
        navigator.clipboard.writeText(id);
        copy.textContent = 'Copied!';
        setTimeout(() => copy.textContent = 'Copy', 1200);
    });
    row.append(copy);
    return row;
}

function render() {
    const posts = load();
    postsBox.innerHTML = '';

    posts.forEach(post => {
        const card = el('article', 'post');
        card.append(el('h3', '', post.title));
        card.append(el('p', 'meta', post.name + ' • ' + post.date + ' • ' + post.userId.slice(0, 12)));
        card.append(el('p', '', post.text));
        card.append(idBadge(post.id));

        const replies = el('div', 'replies');
        post.replies.forEach(r => {
            const item = el('div', 'reply');
            item.append(el('strong', '', r.name + ': '));
            item.append(document.createTextNode(r.text));
            item.append(idBadge(r.id));
            replies.append(item);
        });
        card.append(replies);

        const form = el('form', 'reply-form');
        const name = el('input'); name.placeholder = 'Your name (optional)'; name.maxLength = 20;
        const text = el('input'); text.placeholder = 'Write a reply...'; text.maxLength = 300; text.required = true;
        const btn = el('button', '', 'Reply'); btn.type = 'submit';
        form.append(name, text, btn);

        form.addEventListener('submit', async e => {
            e.preventDefault();
            const all = load();
            const target = all.find(p => p.id === post.id);
            const reply = {
                id: IDS.reply(),
                userId: IDS.user(),
                visitId: IDS.visit(),
                name: name.value.trim() || 'Guest',
                text: text.value.trim()
            };
            reply.seal = await IDS.seal(reply.id, reply.userId, reply.visitId, reply.text);
            target.replies.push(reply);
            if (save(all)) render();
        });

        card.append(form);
        postsBox.append(card);
    });
}

document.getElementById('post-form').addEventListener('submit', async e => {
    e.preventDefault();
    const posts = load();
    const post = {
        id: IDS.message(),
        userId: IDS.user(),
        visitId: IDS.visit(),
        name: document.getElementById('post-name').value.trim() || 'Guest',
        title: document.getElementById('post-title').value.trim(),
        text: document.getElementById('post-text').value.trim(),
        date: new Date().toLocaleDateString(),
        replies: []
    };
    post.seal = await IDS.seal(post.id, post.userId, post.visitId, post.title, post.text);
    posts.unshift(post);
    if (save(posts)) {
        e.target.reset();
        render();
    }
});

render();