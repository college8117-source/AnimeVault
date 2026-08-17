const content = document.querySelector("#content");


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
   DOWNLOAD EPISODE
========================================================= */

async function downloadEpisode(
  id,
  button
) {

  if (!id || !button) {
    return;
  }


  const originalText =
    button.textContent;


  try {

    button.disabled = true;

    button.textContent =
      "Preparing...";


    const data =
      await api(
        "/episodes/" +
        encodeURIComponent(id) +
        "/download"
      );


    if (!data?.url) {

      throw new Error(
        "Download URL is not available."
      );

    }


    button.textContent =
      "Starting...";


    /*
     * Original filename saved in Firestore.
     *
     * Examples:
     * Episode 1.mp4
     * Episode 2.webm
     * Episode 3.mkv
     */

    const fileName =
      String(
        data.fileName ||
        "episode"
      ).trim();


    /*
     * Fetch the Cloudinary file.
     */

    const response =
      await fetch(
        data.url
      );


    if (!response.ok) {

      throw new Error(
        "Unable to download video."
      );

    }


    /*
     * Convert response to Blob.
     */

    const blob =
      await response.blob();


    /*
     * Create temporary browser URL.
     */

    const blobUrl =
      URL.createObjectURL(
        blob
      );


    /*
     * Create hidden download link.
     */

    const link =
      document.createElement(
        "a"
      );


    link.href =
      blobUrl;

    link.download =
      fileName;

    link.style.display =
      "none";


    document.body.appendChild(
      link
    );


    /*
     * Start download.
     */

    link.click();


    /*
     * Cleanup.
     */

    link.remove();

    URL.revokeObjectURL(
      blobUrl
    );


    button.disabled = false;

    button.textContent =
      originalText;

  } catch (error) {

    console.error(error);


    alert(
      error?.message ||
      "Unable to download episode."
    );


    button.disabled = false;

    button.textContent =
      originalText;
  }

}


/* =========================================================
   LOADING UI
========================================================= */

function showLoading() {

  content.innerHTML = `

    <div class="anime-loading">

      <div class="loading-line large"></div>

      <div class="loading-line"></div>

      <div class="loading-line short"></div>

      <div class="loading-season"></div>

      <div class="loading-season"></div>

    </div>

  `;

}


/* =========================================================
   ERROR UI
========================================================= */

function showError(message) {

  content.innerHTML = `

    <div class="error-card">

      <span class="eyebrow">
        ERROR
      </span>

      <h1>
        Unable to load anime
      </h1>

      <p class="muted">
        ${esc(message)}
      </p>

      <button
        id="retryButton"
        type="button"
      >
        Try Again
      </button>

    </div>

  `;


  document
    .querySelector("#retryButton")
    ?.addEventListener(
      "click",
      load
    );

}


/* =========================================================
   RENDER ANIME
========================================================= */

function renderAnime(anime) {

  const seasons =
    Array.isArray(anime.seasons)
      ? anime.seasons
      : [];


  content.innerHTML = `

    <section class="anime-header">

      <span class="eyebrow">
        ANIME
      </span>

      <h1>
        ${esc(anime.name)}
      </h1>

      ${
        anime.description
          ? `
            <p class="anime-description">
              ${esc(anime.description)}
            </p>
          `
          : ""
      }

    </section>


    <section class="seasons-section">

      <div class="section-heading">

        <span class="eyebrow">
          EPISODES
        </span>

        <h2>
          Seasons
        </h2>

      </div>


      ${
        seasons.length
          ? seasons.map(
              renderSeason
            ).join("")
          : `
            <div class="empty-card">

              <h3>
                No episodes available
              </h3>

              <p class="muted">
                Episodes for this anime have not
                been uploaded yet.
              </p>

            </div>
          `
      }

    </section>

  `;


  attachDownloadEvents();

}


/* =========================================================
   RENDER SEASON
========================================================= */

function renderSeason(season) {

  const episodes =
    Array.isArray(
      season.episodes
    )
      ? season.episodes
      : [];


  return `

    <section
      class="season"
      data-season="${esc(
        season.seasonNumber
      )}"
    >

      <div class="season-header">

        <h2>
          Season
          ${esc(
            season.seasonNumber
          )}
        </h2>

        <span class="episode-count">

          ${
            episodes.length
          }

          ${
            episodes.length === 1
              ? "Episode"
              : "Episodes"
          }

        </span>

      </div>


      ${
        episodes.length
          ? `
            <div class="episodes">

              ${
                episodes
                  .map(
                    renderEpisode
                  )
                  .join("")
              }

            </div>
          `
          : `
            <div class="empty-season">

              <p class="muted">
                No episodes available.
              </p>

            </div>
          `
      }

    </section>

  `;

}


/* =========================================================
   RENDER EPISODE
========================================================= */

function renderEpisode(episode) {

  const title =
    episode.title?.trim();


  return `

    <article
      class="episode"
    >

      <div class="episode-info">

        <span class="episode-number">
          EP ${esc(
            episode.episodeNumber
          )}
        </span>

        <h3>
          ${
            title
              ? esc(title)
              : `Episode ${esc(
                  episode.episodeNumber
                )}`
          }
        </h3>

      </div>


      <button
        class="download-button"
        type="button"
        data-episode-id="${esc(
          episode.id
        )}"
      >

        Download

      </button>

    </article>

  `;

}


/* =========================================================
   ATTACH DOWNLOAD EVENTS
========================================================= */

function attachDownloadEvents() {

  const buttons =
    document.querySelectorAll(
      "[data-episode-id]"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          downloadEpisode(
            button.dataset.episodeId,
            button
          );

        }
      );

    }
  );

}


/* =========================================================
   LOAD ANIME
========================================================= */

async function load() {

  showLoading();


  const id =
    new URLSearchParams(
      window.location.search
    ).get("id");


  if (!id) {

    showError(
      "Anime was not selected."
    );

    return;
  }


  try {

    const result =
      await api(
        "/anime/" +
        encodeURIComponent(id)
      );


    if (!result?.anime) {

      throw new Error(
        "Anime data is unavailable."
      );

    }


    renderAnime(
      result.anime
    );


  } catch (error) {

    console.error(error);


    showError(
      error?.message ||
      "Unable to load anime."
    );

  }

}


/* =========================================================
   START
========================================================= */

load();