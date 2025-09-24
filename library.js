let allAnime = [];

async function loadAnime() {
  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = "<p>Loading...</p>";

  try {
    const response = await fetch("anime-list.json");
    allAnime = await response.json();
    displayAnime("All"); // default show all
  } catch (err) {
    grid.innerHTML = "<p style='color:red'>❌ Failed to load anime list.</p>";
    console.error(err);
  }
}

function searchAnime() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const title = card.querySelector("h3").innerText.toLowerCase();
    const alt = card.querySelector(".altTitle").innerText.toLowerCase();
    if (title.includes(input) || alt.includes(input)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

function displayAnime(genre) {
  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = "";

  const filtered = genre === "All" ? allAnime : allAnime.filter(a => a.genre.includes(genre));

  if (filtered.length === 0) {
    grid.innerHTML = "<p>No anime found in this genre.</p>";
    return;
  }

  filtered.forEach(anime => {
    const card = document.createElement("a");
    card.href = anime.page;
    card.className = "card";
    card.innerHTML = `
      <img src="${anime.cover}" alt="${anime.title}">
      <h3>${anime.title}</h3>
      <p class="altTitle" style="display:none;">${anime.altTitle || ""}</p>
    `;
    grid.appendChild(card);
  });
}

function filterAnime(genre) {
  displayAnime(genre);
}

loadAnime();
