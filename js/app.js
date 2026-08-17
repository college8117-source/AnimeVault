const grid = document.querySelector("#grid");
const status = document.querySelector("#status");
const search = document.querySelector("#search");

let anime = [];
let loading = false;


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}


/* =========================================================
   RENDER ANIME
========================================================= */

function render(items) {

  if (!items.length) {

    grid.innerHTML = "";

    status.textContent =
      search.value.trim()
        ? "No anime found."
        : "No anime available.";

    return;
  }


  grid.innerHTML = items.map(a => {

    const description =
      a.description?.trim()
        ? a.description
        : "Anime library entry";


    return `
      <a
        class="card anime-card"
        href="anime.html?id=${encodeURIComponent(a.id)}"
        aria-label="Open ${esc(a.name)}"
      >

        <div class="card-content">

          <span class="card-label">
            ANIME
          </span>

          <h2>
            ${esc(a.name)}
          </h2>

          <p class="muted">
            ${esc(description)}
          </p>

        </div>

        <span class="card-arrow">
          →
        </span>

      </a>
    `;

  }).join("");


  status.textContent =
    `${items.length} anime available`;
}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

  loading = true;

  grid.innerHTML = `
    <div class="loading-card">
      <div class="loading-line"></div>
      <div class="loading-line short"></div>
    </div>

    <div class="loading-card">
      <div class="loading-line"></div>
      <div class="loading-line short"></div>
    </div>

    <div class="loading-card">
      <div class="loading-line"></div>
      <div class="loading-line short"></div>
    </div>
  `;

  status.textContent =
    "Loading anime...";
}


/* =========================================================
   LOAD ANIME
========================================================= */

async function load() {

  if (loading) {
    return;
  }


  showLoading();


  try {

    const result =
      await api("/anime");


    anime =
      Array.isArray(result.anime)
        ? result.anime
        : [];


    loading = false;

    render(anime);


  } catch (error) {

    loading = false;

    grid.innerHTML = `
      <div class="error-card">

        <h2>
          Unable to load anime
        </h2>

        <p class="muted">
          ${esc(
            error.message ||
            "Something went wrong."
          )}
        </p>

        <button
          id="retryButton"
          type="button"
        >
          Try Again
        </button>

      </div>
    `;


    status.textContent =
      "Unable to connect to AnimeVault.";


    const retryButton =
      document.querySelector(
        "#retryButton"
      );


    retryButton?.addEventListener(
      "click",
      load
    );
  }
}


/* =========================================================
   SEARCH
========================================================= */

search?.addEventListener(
  "input",
  () => {

    const query =
      search.value
        .trim()
        .toLowerCase();


    if (!query) {

      render(anime);

      return;
    }


    const filtered =
      anime.filter(item => {

        const name =
          String(
            item.name || ""
          ).toLowerCase();


        return name.includes(query);

      });


    render(filtered);
  }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

load();