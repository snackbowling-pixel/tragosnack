const supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

const loginView = document.getElementById('loginView');
const adminView = document.getElementById('adminView');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const userInfo = document.getElementById('userInfo');
const logoutBtn = document.getElementById('logoutBtn');
const reloadBtn = document.getElementById('reloadBtn');
const addItemBtn = document.getElementById('addItemBtn');
const adminMenuContainer = document.getElementById('adminMenuContainer');
const adminStatus = document.getElementById('adminStatus');

const itemModal = document.getElementById('itemModal');
const modalTitle = document.getElementById('modalTitle');
const itemForm = document.getElementById('itemForm');
const itemSection = document.getElementById('itemSection');
const itemName = document.getElementById('itemName');
const itemPrice = document.getElementById('itemPrice');
const itemDescription = document.getElementById('itemDescription');
const itemTags = document.getElementById('itemTags');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const modalError = document.getElementById('modalError');

let sectionsCache = [];
let itemsCache = [];
let editingId = null;

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function showStatus(msg, isError = false) {
    adminStatus.textContent = msg;
    adminStatus.style.color = isError ? '#e07070' : 'var(--gold)';
    if (msg) setTimeout(() => { if (adminStatus.textContent === msg) adminStatus.textContent = ''; }, 3000);
}

// ============ AUTH ============
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        showAdminView(session.user);
    } else {
        showLoginView();
    }
}

function showLoginView() {
    loginView.classList.remove('hidden');
    adminView.classList.add('hidden');
}

function showAdminView(user) {
    loginView.classList.add('hidden');
    adminView.classList.remove('hidden');
    userInfo.textContent = `Sesión: ${user.email}`;
    loadMenu();
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const submitBtn = loginForm.querySelector('button[type=submit]');
    submitBtn.disabled = true;

    const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.value.trim(),
        password: loginPassword.value
    });

    submitBtn.disabled = false;

    if (error) {
        loginError.textContent = 'Credenciales inválidas o usuario no existe.';
        return;
    }
    showAdminView(data.user);
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLoginView();
});

// ============ LOAD MENU ============
async function loadMenu() {
    adminMenuContainer.innerHTML = '<div id="loadingState">Cargando...</div>';

    const { data: sections, error: secErr } = await supabase
        .from('menu_sections')
        .select('*')
        .order('sort_order', { ascending: true });
    if (secErr) {
        adminMenuContainer.innerHTML = '<div class="error-msg">Error al cargar secciones.</div>';
        console.error(secErr);
        return;
    }

    const { data: items, error: itemsErr } = await supabase
        .from('menu_items')
        .select('*')
        .order('sort_order', { ascending: true });
    if (itemsErr) {
        adminMenuContainer.innerHTML = '<div class="error-msg">Error al cargar items.</div>';
        console.error(itemsErr);
        return;
    }

    sectionsCache = sections;
    itemsCache = items;
    renderAdminMenu();
    populateSectionSelect();
}

function renderAdminMenu() {
    const itemsBySection = {};
    for (const it of itemsCache) {
        (itemsBySection[it.section_id] = itemsBySection[it.section_id] || []).push(it);
    }

    const html = sectionsCache.map(sec => {
        const items = itemsBySection[sec.id] || [];
        return `
            <div class="menu-section">
                <div class="section-title">${escapeHtml(sec.name)}</div>
                <div class="grid">
                    ${items.map(renderAdminItem).join('') || '<div class="dim small">Sin items en esta sección.</div>'}
                </div>
            </div>
        `;
    }).join('');

    adminMenuContainer.innerHTML = html;

    adminMenuContainer.querySelectorAll('[data-edit-id]').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.editId));
    });
    adminMenuContainer.querySelectorAll('[data-delete-id]').forEach(btn => {
        btn.addEventListener('click', () => deleteItem(btn.dataset.deleteId, btn.dataset.deleteName));
    });
}

function renderAdminItem(item) {
    const price = item.price ? `<span class="price">$${escapeHtml(item.price)}</span>` : '';
    const desc = item.description ? `<div class="desc">${escapeHtml(item.description)}</div>` : '';
    const tags = item.tags ? `<div class="tags-chip">#${escapeHtml(item.tags)}</div>` : '';
    return `
        <div class="admin-item">
            <div class="admin-item-info">
                <span class="name">${escapeHtml(item.name)}</span>
                ${price}
                ${desc}
                ${tags}
            </div>
            <div class="admin-item-actions">
                <button class="btn-edit" data-edit-id="${item.id}">Editar</button>
                <button class="btn-danger" data-delete-id="${item.id}" data-delete-name="${escapeHtml(item.name)}">Borrar</button>
            </div>
        </div>
    `;
}

function populateSectionSelect() {
    itemSection.innerHTML = sectionsCache
        .map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`)
        .join('');
}

// ============ MODAL ============
function openAddModal() {
    editingId = null;
    modalTitle.textContent = 'Nuevo item';
    itemForm.reset();
    modalError.textContent = '';
    if (sectionsCache.length > 0) itemSection.value = sectionsCache[0].id;
    itemModal.classList.remove('hidden');
    itemName.focus();
}

function openEditModal(id) {
    const item = itemsCache.find(i => i.id === id);
    if (!item) return;
    editingId = id;
    modalTitle.textContent = 'Editar item';
    modalError.textContent = '';
    itemSection.value = item.section_id;
    itemName.value = item.name;
    itemPrice.value = item.price || '';
    itemDescription.value = item.description || '';
    itemTags.value = item.tags || '';
    itemModal.classList.remove('hidden');
    itemName.focus();
}

function closeModal() {
    itemModal.classList.add('hidden');
    editingId = null;
}

addItemBtn.addEventListener('click', openAddModal);
cancelModalBtn.addEventListener('click', closeModal);
reloadBtn.addEventListener('click', loadMenu);

itemModal.addEventListener('click', (e) => {
    if (e.target === itemModal) closeModal();
});

itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    modalError.textContent = '';
    const submitBtn = itemForm.querySelector('button[type=submit]');
    submitBtn.disabled = true;

    const payload = {
        section_id: itemSection.value,
        name: itemName.value.trim(),
        price: itemPrice.value.trim() || null,
        description: itemDescription.value.trim() || null,
        tags: itemTags.value.trim()
    };

    let result;
    if (editingId) {
        result = await supabase.from('menu_items').update(payload).eq('id', editingId);
    } else {
        // sort_order: ultimo de la seccion + 10
        const sectionItems = itemsCache.filter(i => i.section_id === payload.section_id);
        const maxOrder = sectionItems.reduce((m, i) => Math.max(m, i.sort_order || 0), 0);
        payload.sort_order = maxOrder + 10;
        result = await supabase.from('menu_items').insert(payload);
    }

    submitBtn.disabled = false;

    if (result.error) {
        modalError.textContent = 'Error al guardar: ' + result.error.message;
        console.error(result.error);
        return;
    }

    closeModal();
    showStatus(editingId ? 'Item actualizado.' : 'Item agregado.');
    await loadMenu();
});

// ============ DELETE ============
async function deleteItem(id, name) {
    if (!confirm(`¿Borrar "${name}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) {
        showStatus('Error al borrar: ' + error.message, true);
        console.error(error);
        return;
    }
    showStatus('Item borrado.');
    await loadMenu();
}

// ============ INIT ============
if (window.SUPABASE_URL.startsWith('https://YOUR_PROJECT')) {
    loginError.textContent = 'config.js sin configurar. Editá config.js con tus credenciales de Supabase.';
    loginForm.querySelector('button[type=submit]').disabled = true;
} else {
    checkSession();
}
