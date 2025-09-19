// js/main.js
const PATHS = {
  db: 'data/anime.json',
  popular: 'data/popular_this_session.json',
  suggest: 'data/suggest.json',
  newRelease: 'data/new_release.json'
};

let animeList = [];
let popularList = [];
let suggestList = [];
let newList = [];

const searchInput = document.getElementById('search');

async function fetchJson(path){
  try {
    const r = await fetch(path);
    if(!r.ok) return [];
    const json = await r.json();
    return Array.isArray(json) ? json : [];
  } catch (e) {
    console.warn('Fetch failed:', path, e);
    return [];
  }
}

function escapeHtml(s){ if(!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function matchesSearch(anime, q){
  if(!q) return true;
  q = q.toLowerCase();
  if((anime.title||'').toLowerCase().includes(q)) return true;
  if((anime.desc||'').toLowerCase().includes(q)) return true;
  if((anime.categories||[]).some(c => c.toLowerCase().includes(q))) return true;
  return false;
}

function cardHtml(anime){
  const img = anime.image || anime.cover || 'https://via.placeholder.com/400x600?text=No+Image';
  const link = anime.link || '#';
  return `
    <div class="card">
      <a href="${link}" target="_blank" rel="noopener">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(anime.title)}">
        <h3>${escapeHtml(anime.title)}</h3>
      </a>
    </div>
  `;
}

function renderList(list, containerId, limit){
  const q = (searchInput && searchInput.value || '').trim();
  const container = document.getElementById(containerId);
  if(!container) return;
  const filtered = list.filter(a => matchesSearch(a, q));
  const items = (typeof limit === 'number' && limit > 0) ? filtered.slice(0, limit) : filtered;
  if(items.length === 0){
    container.innerHTML = '<div class="no-items">Tiada item ditemui.</div>';
    return;
  }
  container.innerHTML = items.map(cardHtml).join('');
}

function renderGenres(){
  const container = document.getElementById('genres-list');
  if(!container) return;
  // kumpul semua kategori dari semua sumber
  const set = new Set();
  [animeList, popularList, suggestList, newList].forEach(arr => {
    (arr || []).forEach(a => (a.categories || []).forEach(c => set.add(c)));
  });
  const cats = Array.from(set).sort();
  if(cats.length === 0){
    container.innerHTML = '<div class="no-items">Tiada genre.</div>';
    return;
  }
  container.innerHTML = cats.map(c => `<button class="genre-btn" data-genre="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  container.querySelectorAll('.genre-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if(searchInput) searchInput.value = btn.dataset.genre;
      renderAll();
      document.getElementById('library')?.scrollIntoView({behavior:'smooth'});
    });
  });
}

function recentByDate(limit = 8){
  const sorted = (animeList || []).slice().sort((a,b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0));
  return sorted.slice(0, limit);
}

function renderAll(){
  // Jika file-specific list wujud, gunakan; kalau tidak, fallback ke flags di animeList
  const q = (searchInput && searchInput.value || '').trim();

  // Popular
  if((popularList || []).length) renderList(popularList, 'popular-library', 12);
  else renderList(animeList.filter(a => a.isPopular), 'popular-library', 12);

  // Hot / New (use new_release.json first, else items with isHot, else recent by date)
  if((newList || []).length) renderList(newList, 'hot-library', 8);
  else if(animeList.some(a => a.isHot)) renderList(animeList.filter(a => a.isHot), 'hot-library', 8);
  else renderList(recentByDate(8), 'hot-library', 8);

  // All
  renderList((animeList || []).slice().sort((a,b)=> new Date(b.dateAdded||0)-new Date(a.dateAdded||0)), 'all-library');

  // Suggested
  if((suggestList || []).length) renderList(suggestList, 'suggested-library', 6);
  else renderList(animeList.filter(a => a.isSuggested), 'suggested-library', 6);

  // Genres
  renderGenres();
}

async function init(){
  // parallel load (each returns [] on failure)
  [animeList, popularList, suggestList, newList] = await Promise.all([
    fetchJson(PATHS.db),
    fetchJson(PATHS.popular),
    fetchJson(PATHS.suggest),
    fetchJson(PATHS.newRelease)
  ]);
  renderAll();
}

if(searchInput){
  searchInput.addEventListener('input', () => renderAll());
}

document.addEventListener('DOMContentLoaded', init);
