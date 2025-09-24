// js/main.js
const CLIENT_ID = "bdebbb86432e7a51b466524bf6b6c57d"; // Your MAL Client ID

let animeList = [];
let popularList = [];
let suggestList = [];
let newList = [];

const searchInput = document.getElementById("search");

/* ---------------- Fetch Helpers ---------------- */
async function fetchMAL(endpoint, token) {
  try {
    const r = await fetch("https://api.myanimelist.net/v2" + endpoint, {
      headers: { Authorization: "Bearer " + token }
    });
    if (!r.ok) {
      console.warn("MAL fetch error:", r.status, endpoint);
      return [];
    }
    const json = await r.json();
    return json.data || [];
  } catch (e) {
    console.warn("MAL fetch failed:", endpoint, e);
    return [];
  }
}

function normalizeMAL(item) {
  const node = item.node || item;
  return {
    title: node.title,
    image: node.main_picture?.large || node.main_picture?.medium,
    link: "https://myanimelist.net/anime/" + node.id,
    desc: node.synopsis || "",
    categories: (node.genres || []).map(g => g.name),
    dateAdded: node.start_date || null
  };
}

/* ---------------- Render Helpers ---------------- */
function escapeHtml(s) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function matchesSearch(anime, q) {
  if (!q) return true;
  q = q.toLowerCase();
  if ((anime.title || "").toLowerCase().includes(q)) return true;
  if ((anime.desc || "").toLowerCase().includes(q)) return true;
  if ((anime.categories || []).some(c => c.toLowerCase().includes(q)))
    return true;
  return false;
}

function cardHtml(anime) {
  const img =
    anime.image ||
    anime.cover ||
    "https://via.placeholder.com/400x600?text=No+Image";
  const link = anime.link || "#";
  return `
    <div class="card">
      <a href="${link}" target="_blank">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(anime.title)}">
        <h3>${escapeHtml(anime.title)}</h3>
      </a>
    </div>
  `;
}

function renderList(list, containerId, limit) {
  const q = (searchInput && searchInput.value) || "";
  const container = document.getElementById(containerId);
  if (!container) return;
  const filtered = list.filter(a => matchesSearch(a, q));
  const items =
    typeof limit === "number" && limit > 0
      ? filtered.slice(0, limit)
      : filtered;
  if (items.length === 0) {
    container.innerHTML = '<div class="no-items">No items found.</div>';
    return;
  }
  container.innerHTML = items.map(cardHtml).join("");
}

function renderGenres() {
  const container = document.getElementById("genres-list");
  if (!container) return;
  const set = new Set();
  [animeList, popularList, suggestList, newList].forEach(arr => {
    (arr || []).forEach(a => (a.categories || []).forEach(c => set.add(c)));
  });
  const cats = Array.from(set).sort();
  if (cats.length === 0) {
    container.innerHTML = '<div class="no-items">No genres.</div>';
    return;
  }
  container.innerHTML = cats
    .map(
      c =>
        `<button class="genre-btn" data-genre="${escapeHtml(
          c
        )}">${escapeHtml(c)}</button>`
    )
    .join("");
  container.querySelectorAll(".genre-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      if (searchInput) searchInput.value = btn.dataset.genre;
      renderAll();
      document
        .getElementById("library")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

function recentByDate(limit = 8) {
  const sorted = (animeList || [])
    .slice()
    .sort(
      (a, b) =>
        new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0)
    );
  return sorted.slice(0, limit);
}

function renderAll() {
  // Popular
  if ((popularList || []).length)
    renderList(popularList.map(normalizeMAL), "popular-library", 12);

  // Hot / New
  if ((newList || []).length)
    renderList(newList.map(normalizeMAL), "hot-library", 8);
  else renderList(recentByDate(8), "hot-library", 8);

  // All
  renderList(animeList.map(normalizeMAL), "all-library");

  // Suggested
  if ((suggestList || []).length)
    renderList(suggestList.map(normalizeMAL), "suggested-library", 6);

  // Genres
  renderGenres();
}

/* ---------------- Init ---------------- */
async function init() {
  const token = localStorage.getItem("mal_access_token");
  if (!token) {
    console.warn("No MAL access token. Please log in.");
    return;
  }

  // Replace with the MAL data you want to display
  animeList = await fetchMAL(
    "/users/@me/animelist?status=watching&limit=50&fields=title,main_picture,genres,synopsis,start_date",
    token
  );
  popularList = await fetchMAL(
    "/anime/ranking?ranking_type=airing&limit=12&fields=title,main_picture,genres,synopsis,start_date",
    token
  );
  suggestList = await fetchMAL(
    "/anime/ranking?ranking_type=all&limit=6&fields=title,main_picture,genres,synopsis,start_date",
    token
  );
  newList = await fetchMAL(
    "/anime/ranking?ranking_type=upcoming&limit=8&fields=title,main_picture,genres,synopsis,start_date",
    token
  );

  renderAll();
}

if (searchInput) {
  searchInput.addEventListener("input", () => renderAll());
}

document.addEventListener("DOMContentLoaded", init);
