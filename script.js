// Carta pública: usa fetch() directo a la REST API de Supabase
// para evitar cargar el SDK completo (auth + realtime + storage)
// que no se necesita acá. Resultado: menos JS, menos RAM, sin websockets.

const SB_HEADERS = {
    apikey: window.SUPABASE_ANON_KEY,
    Authorization: `Bearer ${window.SUPABASE_ANON_KEY}`
};

const searchInput = document.getElementById('itemSearch');
const pills = document.querySelectorAll('.pill');
const noResults = document.getElementById('noResults');
const menuContainer = document.getElementById('menuContainer');
const loadingState = document.getElementById('loadingState');

let currentFilter = 'all';

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderItem(item) {
    const price = item.price ? `<span class="price">$${escapeHtml(item.price)}</span>` : '';
    const desc = item.description ? `<div class="desc">${escapeHtml(item.description)}</div>` : '';
    return `
        <div class="item" data-tags="${escapeHtml(item.tags || '')}">
            <div class="item-top">
                <span class="name">${escapeHtml(item.name)}</span>
                ${price}
            </div>
            ${desc}
        </div>
    `;
}

function renderMenu(sections, itemsBySection) {
    const html = sections.map(sec => {
        const items = itemsBySection[sec.id] || [];
        if (items.length === 0) return '';
        return `
            <div class="menu-section">
                <div class="section-title">${escapeHtml(sec.name)}</div>
                <div class="grid">
                    ${items.map(renderItem).join('')}
                </div>
            </div>
        `;
    }).join('');

    menuContainer.innerHTML = html;
}

async function fetchTable(name) {
    const url = `${window.SUPABASE_URL}/rest/v1/${name}?select=*&order=sort_order.asc`;
    const res = await fetch(url, { headers: SB_HEADERS });
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    return res.json();
}

async function loadMenu() {
    try {
        const [sections, items] = await Promise.all([
            fetchTable('menu_sections'),
            fetchTable('menu_items')
        ]);

        const itemsBySection = {};
        for (const it of items) {
            (itemsBySection[it.section_id] = itemsBySection[it.section_id] || []).push(it);
        }

        loadingState.style.display = 'none';
        renderMenu(sections, itemsBySection);
        attachFilter();
    } catch (err) {
        console.error('Error loading menu:', err);
        loadingState.textContent = 'Error al cargar el menu. Reintenta en unos segundos.';
    }
}

function attachFilter() {
    const items = document.querySelectorAll('.item');
    const sectionEls = document.querySelectorAll('.menu-section');

    function filterMenu() {
        const query = searchInput.value.toLowerCase();
        let anyVisible = false;

        items.forEach(item => {
            const tags = item.getAttribute('data-tags') || '';
            const content = item.innerText.toLowerCase();

            const matchesSearch = content.includes(query);
            const matchesFilter = (currentFilter === 'all' || tags.includes(currentFilter));

            if (matchesSearch && matchesFilter) {
                item.classList.remove('hidden');
                anyVisible = true;
            } else {
                item.classList.add('hidden');
            }
        });

        sectionEls.forEach(sec => {
            const visibleCount = sec.querySelectorAll('.item:not(.hidden)').length;
            sec.classList.toggle('hidden', visibleCount === 0);
        });

        noResults.style.display = anyVisible ? 'none' : 'block';
    }

    searchInput.addEventListener('input', filterMenu);

    pills.forEach(pill => {
        pill.addEventListener('click', () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.getAttribute('data-filter');
            filterMenu();
        });
    });
}

loadMenu();
