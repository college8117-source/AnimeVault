import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import { firebaseConfig } from './firebase.js';

import { api } from './api.js';


/* =========================================================
   FIREBASE
========================================================= */

const firebaseApp =
  initializeApp(firebaseConfig);

const auth =
  getAuth(firebaseApp);


/* =========================================================
   DOM
========================================================= */

const loginBox =
  document.querySelector('#loginBox');

const adminArea =
  document.querySelector('#adminArea');

const loginForm =
  document.querySelector('#loginForm');

const emailInput =
  document.querySelector('#email');

const passwordInput =
  document.querySelector('#password');

const logoutButton =
  document.querySelector('#logout');

const adminStatus =
  document.querySelector('#adminStatus');


const animeSelect =
  document.querySelector('#animeSelect');

const newAnimeButton =
  document.querySelector('#newAnimeButton');

const editAnimeButton =
  document.querySelector('#editAnimeButton');

const animeEditor =
  document.querySelector('#animeEditor');

const animeEditorTitle =
  document.querySelector('#animeEditorTitle');

const animeForm =
  document.querySelector('#animeForm');

const animeName =
  document.querySelector('#animeName');

const animeDescription =
  document.querySelector('#animeDescription');

const animeSaveText =
  document.querySelector('#animeSaveText');

const closeAnimeEditor =
  document.querySelector('#closeAnimeEditor');

const cancelAnimeButton =
  document.querySelector('#cancelAnimeButton');


const seasonTabs =
  document.querySelector('#seasonTabs');

const newSeasonButton =
  document.querySelector('#newSeasonButton');

const editSeasonButton =
  document.querySelector('#editSeasonButton');

const seasonEditor =
  document.querySelector('#seasonEditor');

const seasonEditorTitle =
  document.querySelector('#seasonEditorTitle');

const seasonForm =
  document.querySelector('#seasonForm');

const seasonNumberInput =
  document.querySelector('#seasonNumber');

const seasonSaveText =
  document.querySelector('#seasonSaveText');

const closeSeasonEditor =
  document.querySelector('#closeSeasonEditor');

const cancelSeasonButton =
  document.querySelector('#cancelSeasonButton');


const selectedSeasonInfo =
  document.querySelector('#selectedSeasonInfo');

const episodeList =
  document.querySelector('#episodeList');

const uploadSection =
  document.querySelector('#uploadSection');

const addEpisodeButton =
  document.querySelector('#addEpisodeButton');

const uploadQueue =
  document.querySelector('#uploadQueue');

const uploadAllButton =
  document.querySelector('#uploadAllButton');

const overallProgressBox =
  document.querySelector('#overallProgressBox');

const overallProgressBar =
  document.querySelector('#overallProgressBar');

const overallProgressPercent =
  document.querySelector('#overallProgressPercent');

const overallProgressText =
  document.querySelector('#overallProgressText');


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let animeList = [];

let selectedAnime = null;

let seasons = [];

let selectedSeason = null;

let episodes = [];

let editingAnimeId = null;

let editingSeasonId = null;

let uploadItems = [];


/* =========================================================
   HELPERS
========================================================= */

function escapeHtml(value) {

  return String(value ?? '')
    .replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));

}


function setStatus(
  message,
  type = 'normal'
) {

  if (!adminStatus) {
    return;
  }

  adminStatus.textContent =
    message || '';

  adminStatus.dataset.type =
    type;

}


function setButtonLoading(
  button,
  loading,
  text
) {

  if (!button) {
    return;
  }

  if (loading) {

    button.disabled = true;

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      text || 'Please wait...';

  } else {

    button.disabled = false;

    button.textContent =
      button.dataset.originalText ||
      text ||
      button.textContent;

  }

}


function getFirebaseToken() {

  if (!currentUser) {

    return Promise.reject(
      new Error(
        'Admin is not logged in.'
      )
    );

  }

  return currentUser.getIdToken();

}


/* =========================================================
   API WRAPPER
========================================================= */

async function adminApi(
  endpoint,
  options = {}
) {

  const token =
    await getFirebaseToken();


  const headers = {

    ...(options.headers || {}),

    Authorization:
      `Bearer ${token}`,

    'Content-Type':
      'application/json'

  };


  return api(
    endpoint,
    {
      ...options,
      headers
    }
  );

}


/* =========================================================
   LOGIN
========================================================= */

loginForm?.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    const email =
      emailInput?.value.trim() || '';

    const password =
      passwordInput?.value || '';


    if (!email) {

      setStatus(
        'Email is required.',
        'error'
      );

      return;

    }


    if (!password) {

      setStatus(
        'Password is required.',
        'error'
      );

      return;

    }


    const button =
      loginForm.querySelector('button');


    try {

      setButtonLoading(
        button,
        true,
        'Logging in...'
      );


      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


      if (passwordInput) {
        passwordInput.value = '';
      }


      setStatus(
        'Login successful.',
        'success'
      );


    } catch (error) {

      console.error(
        'Firebase login error:',
        error
      );


      setStatus(
        error?.message ||
        'Login failed.',
        'error'
      );


    } finally {

      if (button) {

        button.disabled =
          false;

        button.textContent =
          'Login';

      }

    }

  }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutButton?.addEventListener(
  'click',
  async () => {

    try {

      await signOut(auth);

      resetAdminState();

      setStatus(
        'Logged out successfully.',
        'success'
      );


    } catch (error) {

      console.error(error);

      setStatus(
        error?.message ||
        'Logout failed.',
        'error'
      );

    }

  }
);


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  async user => {

    currentUser =
      user;


    if (!user) {

      loginBox?.classList.remove(
        'hidden'
      );

      adminArea?.classList.add(
        'hidden'
      );

      return;

    }


    loginBox?.classList.add(
      'hidden'
    );

    adminArea?.classList.remove(
      'hidden'
    );


    setStatus(
      'Checking admin access...'
    );


    try {

      await loadAnime();

    } catch (error) {

      console.error(
        'Admin initialization error:',
        error
      );


      setStatus(
        error?.message ||
        'Failed to load admin panel.',
        'error'
      );

    }

  }
);


/* =========================================================
   RESET STATE
========================================================= */

function resetAdminState() {

  animeList = [];

  selectedAnime = null;

  seasons = [];

  selectedSeason = null;

  episodes = [];

  uploadItems = [];

  editingAnimeId = null;

  editingSeasonId = null;


  if (animeSelect) {

    animeSelect.innerHTML =
      '<option value="">Select Anime</option>';

  }


  if (seasonTabs) {

    seasonTabs.innerHTML =
      '<div class="empty-state">Select an anime first.</div>';

  }


  if (episodeList) {

    episodeList.innerHTML =
      '<div class="empty-state">Select a season to see episodes.</div>';

  }


  if (uploadQueue) {

    uploadQueue.innerHTML =
      '';

  }


  if (uploadSection) {

    uploadSection.classList.add(
      'hidden'
    );

  }

}


/* =========================================================
   LOAD ANIME
========================================================= */

async function loadAnime() {

  setStatus(
    'Loading anime library...'
  );


  const result =
    await adminApi(
      '/admin/anime'
    );


  animeList =
    result?.anime || [];


  renderAnimeSelect();


  setStatus(
    animeList.length
      ? `${animeList.length} anime loaded.`
      : 'No anime found.',
    'success'
  );

}


/* =========================================================
   RENDER ANIME SELECT
========================================================= */

function renderAnimeSelect() {

  if (!animeSelect) {
    return;
  }


  animeSelect.innerHTML = `

    <option value="">
      Select Anime
    </option>

    ${animeList.map(anime => `

      <option value="${escapeHtml(anime.id)}">

        ${escapeHtml(anime.name)}

      </option>

    `).join('')}

  `;


  if (selectedAnime) {

    animeSelect.value =
      selectedAnime.id;

  }

}


/* =========================================================
   ANIME SELECTED
========================================================= */

animeSelect?.addEventListener(
  'change',
  async () => {

    const id =
      animeSelect.value;


    if (!id) {

      selectedAnime = null;

      seasons = [];

      selectedSeason = null;

      episodes = [];

      if (editAnimeButton) {
        editAnimeButton.disabled = true;
      }

      if (newSeasonButton) {
        newSeasonButton.disabled = true;
      }

      renderSeasons();

      renderEpisodes();

      return;

    }


    selectedAnime =
      animeList.find(
        anime =>
          anime.id === id
      ) || null;


    if (editAnimeButton) {

      editAnimeButton.disabled =
        !selectedAnime;

    }


    if (newSeasonButton) {

      newSeasonButton.disabled =
        !selectedAnime;

    }


    try {

      await loadSeasons();

    } catch (error) {

      console.error(error);

      setStatus(
        error?.message ||
        'Failed to load seasons.',
        'error'
      );

    }

  }
);


/* =========================================================
   LOAD SEASONS
========================================================= */

async function loadSeasons() {

  if (!selectedAnime) {
    return;
  }


  const result =
    await adminApi(
      `/admin/seasons/${encodeURIComponent(
        selectedAnime.id
      )}`
    );


  seasons =
    result?.seasons || [];


  selectedSeason =
    null;


  episodes =
    [];


  renderSeasons();

  renderEpisodes();

}


/* =========================================================
   RENDER SEASONS
========================================================= */

function renderSeasons() {

  if (!seasonTabs) {
    return;
  }


  if (!selectedAnime) {

    seasonTabs.innerHTML =
      '<div class="empty-state">Select an anime first.</div>';

    return;

  }


  if (!seasons.length) {

    seasonTabs.innerHTML =
      '<div class="empty-state">No seasons yet. Add Season to begin.</div>';


    if (editSeasonButton) {

      editSeasonButton.disabled =
        true;

    }


    if (uploadSection) {

      uploadSection.classList.add(
        'hidden'
      );

    }


    return;

  }


  seasonTabs.innerHTML =
    seasons.map(season => `

      <button
        type="button"
        class="season-tab ${
          selectedSeason?.id === season.id
            ? 'active'
            : ''
        }"
        data-season-id="${escapeHtml(
          season.id
        )}"
      >
        Season
        ${escapeHtml(
          season.seasonNumber
        )}
      </button>

    `).join('');


  seasonTabs
    .querySelectorAll('.season-tab')
    .forEach(button => {

      button.addEventListener(
        'click',
        async () => {

          const season =
            seasons.find(
              item =>
                item.id ===
                button.dataset.seasonId
            );


          if (!season) {
            return;
          }


          selectedSeason =
            season;


          renderSeasons();

          updateSeasonUI();


          try {

            await loadEpisodes();

          } catch (error) {

            console.error(error);

            setStatus(
              error?.message ||
              'Failed to load episodes.',
              'error'
            );

          }

        }
      );

    });


  if (!selectedSeason) {

    selectedSeason =
      seasons[0];

    renderSeasons();

    updateSeasonUI();

    loadEpisodes().catch(error => {

      console.error(error);

      setStatus(
        error?.message ||
        'Failed to load episodes.',
        'error'
      );

    });

  }

}


/* =========================================================
   UPDATE SEASON UI
========================================================= */

function updateSeasonUI() {

  if (!selectedSeason) {

    if (selectedSeasonInfo) {

      selectedSeasonInfo.textContent =
        'Select a season.';

    }


    if (editSeasonButton) {

      editSeasonButton.disabled =
        true;

    }


    if (uploadSection) {

      uploadSection.classList.add(
        'hidden'
      );

    }


    return;

  }


  if (selectedSeasonInfo) {

    selectedSeasonInfo.innerHTML = `

      <strong>
        ${escapeHtml(
          selectedAnime?.name || ''
        )}
      </strong>

      <span>
        •
      </span>

      <strong>
        Season
        ${escapeHtml(
          selectedSeason.seasonNumber
        )}
      </strong>

    `;

  }


  if (editSeasonButton) {

    editSeasonButton.disabled =
      false;

  }


  if (uploadSection) {

    uploadSection.classList.remove(
      'hidden'
    );

  }


  updateUploadButton();

}


/* =========================================================
   LOAD EPISODES
========================================================= */

async function loadEpisodes() {

  if (!selectedSeason) {
    return;
  }


  if (episodeList) {

    episodeList.innerHTML =
      '<div class="loading-state">Loading episodes...</div>';

  }


  const result =
    await adminApi(
      `/admin/episodes/${encodeURIComponent(
        selectedSeason.id
      )}`
    );


  episodes =
    result?.episodes || [];


  renderEpisodes();

  updateUploadButton();

}


/* =========================================================
   RENDER EPISODES
========================================================= */

function renderEpisodes() {

  if (!episodeList) {
    return;
  }


  if (!selectedSeason) {

    episodeList.innerHTML =
      '<div class="empty-state">Select a season to see episodes.</div>';

    return;

  }


  if (!episodes.length) {

    episodeList.innerHTML =
      '<div class="empty-state">No episodes uploaded yet.</div>';

    return;

  }


  episodeList.innerHTML =
    episodes.map(
      episode => `

        <div
          class="episode-manager-row"
          data-episode-id="${escapeHtml(
            episode.id
          )}"
        >

          <div class="episode-number">

            ${escapeHtml(
              episode.episodeNumber
            )}

          </div>


          <div class="episode-details">

            <strong>

              Episode
              ${escapeHtml(
                episode.episodeNumber
              )}

            </strong>


            <span>

              ${escapeHtml(
                episode.title ||
                episode.fileName ||
                'Untitled episode'
              )}

            </span>

          </div>


          <div class="episode-file">

            ${escapeHtml(
              episode.fileName ||
              'Video'
            )}

          </div>


          <div class="episode-actions">

            <button
              type="button"
              class="small-button edit-episode"
              data-id="${escapeHtml(
                episode.id
              )}"
            >
              Edit
            </button>


            <button
              type="button"
              class="small-button danger delete-episode"
              data-id="${escapeHtml(
                episode.id
              )}"
            >
              Delete
            </button>

          </div>

        </div>

      `
    ).join('');


  episodeList
    .querySelectorAll('.delete-episode')
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          deleteEpisodeHandler(
            button.dataset.id
          )
      );

    });


  episodeList
    .querySelectorAll('.edit-episode')
    .forEach(button => {

      button.addEventListener(
        'click',
        () =>
          editEpisodeHandler(
            button.dataset.id
          )
      );

    });

}


/* =========================================================
   NEW ANIME
========================================================= */

newAnimeButton?.addEventListener(
  'click',
  () => {

    editingAnimeId =
      null;


    if (animeEditorTitle) {

      animeEditorTitle.textContent =
        'Create New Anime';

    }


    if (animeSaveText) {

      animeSaveText.textContent =
        'Create Anime';

    }


    if (animeName) {

      animeName.value =
        '';

    }


    if (animeDescription) {

      animeDescription.value =
        '';

    }


    animeEditor?.classList.remove(
      'hidden'
    );


    animeName?.focus();

  }
);


/* =========================================================
   EDIT ANIME
========================================================= */

editAnimeButton?.addEventListener(
  'click',
  () => {

    if (!selectedAnime) {
      return;
    }


    editingAnimeId =
      selectedAnime.id;


    if (animeEditorTitle) {

      animeEditorTitle.textContent =
        'Edit Anime';

    }


    if (animeSaveText) {

      animeSaveText.textContent =
        'Save Changes';

    }


    if (animeName) {

      animeName.value =
        selectedAnime.name || '';

    }


    if (animeDescription) {

      animeDescription.value =
        selectedAnime.description || '';

    }


    animeEditor?.classList.remove(
      'hidden'
    );


    animeName?.focus();

  }
);


/* =========================================================
   CLOSE ANIME EDITOR
========================================================= */

function closeAnimeEditorHandler() {

  editingAnimeId =
    null;


  animeEditor?.classList.add(
    'hidden'
  );

}


closeAnimeEditor?.addEventListener(
  'click',
  closeAnimeEditorHandler
);


cancelAnimeButton?.addEventListener(
  'click',
  closeAnimeEditorHandler
);


/* =========================================================
   SAVE ANIME
========================================================= */

animeForm?.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    const name =
      animeName?.value.trim() || '';

    const description =
      animeDescription?.value.trim() || '';


    if (!name) {

      setStatus(
        'Anime name is required.',
        'error'
      );

      return;

    }


    const wasEditing =
      Boolean(editingAnimeId);


    try {

      setButtonLoading(
        animeForm.querySelector(
          'button[type="submit"]'
        ),
        true,
        'Saving...'
      );


      let result;


      if (editingAnimeId) {

        result =
          await adminApi(
            `/admin/anime/${encodeURIComponent(
              editingAnimeId
            )}`,
            {
              method: 'PUT',

              body: JSON.stringify({
                name,
                description
              })

            }
          );

      } else {

        result =
          await adminApi(
            '/admin/anime',
            {
              method: 'POST',

              body: JSON.stringify({
                name,
                description
              })

            }
          );

      }


      selectedAnime =
        result?.anime || null;


      await loadAnime();


      if (selectedAnime && animeSelect) {

        animeSelect.value =
          selectedAnime.id;

      }


      if (editAnimeButton) {

        editAnimeButton.disabled =
          !selectedAnime;

      }


      if (newSeasonButton) {

        newSeasonButton.disabled =
          !selectedAnime;

      }


      await loadSeasons();


      closeAnimeEditorHandler();


      setStatus(
        wasEditing
          ? 'Anime updated successfully.'
          : 'Anime created successfully.',
        'success'
      );


    } catch (error) {

      console.error(error);

      setStatus(
        error?.message ||
        'Failed to save anime.',
        'error'
      );


    } finally {

      const button =
        animeForm.querySelector(
          'button[type="submit"]'
        );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          wasEditing
            ? 'Save Changes'
            : 'Create Anime';

      }

    }

  }
);


/* =========================================================
   NEW SEASON
========================================================= */

newSeasonButton?.addEventListener(
  'click',
  () => {

    if (!selectedAnime) {
      return;
    }


    editingSeasonId =
      null;


    if (seasonEditorTitle) {

      seasonEditorTitle.textContent =
        'Create Season';

    }


    if (seasonSaveText) {

      seasonSaveText.textContent =
        'Create Season';

    }


    if (seasonNumberInput) {

      seasonNumberInput.value =
        getNextSeasonNumber();

    }


    seasonEditor?.classList.remove(
      'hidden'
    );


    seasonNumberInput?.focus();

  }
);


/* =========================================================
   GET NEXT SEASON NUMBER
========================================================= */

function getNextSeasonNumber() {

  if (!seasons.length) {

    return 1;

  }


  return (
    Math.max(
      ...seasons.map(
        season =>
          Number(
            season.seasonNumber
          ) || 0
      )
    ) + 1
  );

}


/* =========================================================
   EDIT SEASON
========================================================= */

editSeasonButton?.addEventListener(
  'click',
  () => {

    if (!selectedSeason) {
      return;
    }


    editingSeasonId =
      selectedSeason.id;


    if (seasonEditorTitle) {

      seasonEditorTitle.textContent =
        'Edit Season';

    }


    if (seasonSaveText) {

      seasonSaveText.textContent =
        'Save Changes';

    }


    if (seasonNumberInput) {

      seasonNumberInput.value =
        selectedSeason.seasonNumber;

    }


    seasonEditor?.classList.remove(
      'hidden'
    );


    seasonNumberInput?.focus();

  }
);


/* =========================================================
   CLOSE SEASON EDITOR
========================================================= */

function closeSeasonEditorHandler() {

  editingSeasonId =
    null;


  seasonEditor?.classList.add(
    'hidden'
  );

}


closeSeasonEditor?.addEventListener(
  'click',
  closeSeasonEditorHandler
);


cancelSeasonButton?.addEventListener(
  'click',
  closeSeasonEditorHandler
);


/* =========================================================
   SAVE SEASON
========================================================= */

seasonForm?.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    if (!selectedAnime) {
      return;
    }


    const number =
      Number(
        seasonNumberInput?.value
      );


    if (
      !Number.isInteger(number) ||
      number < 1
    ) {

      setStatus(
        'Enter a valid season number.',
        'error'
      );

      return;

    }


    const wasEditing =
      Boolean(editingSeasonId);


    try {

      setButtonLoading(
        seasonForm.querySelector(
          'button[type="submit"]'
        ),
        true,
        'Saving...'
      );


      let result;


      if (editingSeasonId) {

        result =
          await adminApi(
            `/admin/seasons/${encodeURIComponent(
              editingSeasonId
            )}`,
            {
              method: 'PUT',

              body: JSON.stringify({
                seasonNumber:
                  number
              })

            }
          );

      } else {

        result =
          await adminApi(
            '/admin/seasons',
            {
              method: 'POST',

              body: JSON.stringify({

                animeId:
                  selectedAnime.id,

                seasonNumber:
                  number

              })

            }
          );

      }


      await loadSeasons();


      const targetId =
        result?.season?.id;


      if (targetId) {

        selectedSeason =
          seasons.find(
            season =>
              season.id === targetId
          ) || null;


        renderSeasons();

        updateSeasonUI();

        await loadEpisodes();

      }


      closeSeasonEditorHandler();


      setStatus(
        wasEditing
          ? 'Season updated successfully.'
          : 'Season created successfully.',
        'success'
      );


    } catch (error) {

      console.error(error);

      setStatus(
        error?.message ||
        'Failed to save season.',
        'error'
      );


    } finally {

      const button =
        seasonForm.querySelector(
          'button[type="submit"]'
        );


      if (button) {

        button.disabled =
          false;

        button.textContent =
          wasEditing
            ? 'Save Changes'
            : 'Create Season';

      }

    }

  }
);


/* =========================================================
   ADD EPISODE ROW
========================================================= */

addEpisodeButton?.addEventListener(
  'click',
  () => {

    if (!selectedSeason) {

      setStatus(
        'Please select a season first.',
        'error'
      );

      return;

    }


    createUploadRow();

  }
);


/* =========================================================
   CREATE UPLOAD ROW
========================================================= */

function createUploadRow(
  file = null
) {

  const id =
    crypto.randomUUID();


  const item = {

    id,

    file,

    episodeNumber:
      getNextEpisodeNumber(),

    title: '',

    status:
      'waiting'

  };


  uploadItems.push(
    item
  );


  renderUploadQueue();

}


/* =========================================================
   GET NEXT EPISODE NUMBER
========================================================= */

function getNextEpisodeNumber() {

  const existingNumbers =
    episodes.map(
      episode =>
        Number(
          episode.episodeNumber
        )
    );


  const queueNumbers =
    uploadItems.map(
      item =>
        Number(
          item.episodeNumber
        )
    );


  const numbers = [

    ...existingNumbers,

    ...queueNumbers

  ].filter(
    Number.isFinite
  );


  if (!numbers.length) {

    return 1;

  }


  return (
    Math.max(
      ...numbers
    ) + 1
  );

}


/* =========================================================
   RENDER UPLOAD QUEUE
========================================================= */

function renderUploadQueue() {

  if (!uploadQueue) {
    return;
  }


  uploadQueue.innerHTML =
    uploadItems.map(
      (item, index) => `

        <div
          class="upload-queue-item"
          data-id="${escapeHtml(item.id)}"
        >

          <div class="queue-number">
            ${index + 1}
          </div>


          <div class="queue-fields">

            <div class="field">

              <label>
                Episode Number
              </label>

              <input
                type="number"
                min="1"
                class="queue-episode-number"
                value="${escapeHtml(
                  item.episodeNumber
                )}"
              >

            </div>


            <div class="field">

              <label>

                Episode Name

                <span class="optional">
                  Optional
                </span>

              </label>

              <input
                type="text"
                class="queue-title"
                value="${escapeHtml(
                  item.title
                )}"
                placeholder="Episode name"
              >

            </div>


            <div class="field file-field">

              <label>
                Video File
              </label>

              <input
                type="file"
                class="queue-file"
                accept="video/*"
              >


              <span class="queue-file-name">

                ${
                  item.file
                    ? escapeHtml(
                        item.file.name
                      )
                    : 'No file selected'
                }

              </span>

            </div>

          </div>


          <div class="queue-status">

            <span class="queue-status-text">

              ${
                item.status === 'success'
                  ? '✓ Uploaded'
                  : item.status === 'uploading'
                    ? 'Uploading...'
                    : item.status === 'error'
                      ? 'Failed'
                      : 'Waiting'
              }

            </span>


            <button
              type="button"
              class="small-button danger remove-upload"
            >
              Remove
            </button>

          </div>

        </div>

      `
    ).join('');


  uploadQueue
    .querySelectorAll('.upload-queue-item')
    .forEach(row => {

      const id =
        row.dataset.id;


      const item =
        uploadItems.find(
          upload =>
            upload.id === id
        );


      if (!item) {
        return;
      }


      const episodeInput =
        row.querySelector(
          '.queue-episode-number'
        );


      const titleInput =
        row.querySelector(
          '.queue-title'
        );


      const fileInput =
        row.querySelector(
          '.queue-file'
        );


      episodeInput?.addEventListener(
        'input',
        () => {

          item.episodeNumber =
            Number(
              episodeInput.value
            );

        }
      );


      titleInput?.addEventListener(
        'input',
        () => {

          item.title =
            titleInput.value;

        }
      );


      fileInput?.addEventListener(
        'change',
        () => {

          item.file =
            fileInput.files?.[0] ||
            null;


          renderUploadQueue();

          updateUploadButton();

        }
      );


      row.querySelector(
        '.remove-upload'
      )?.addEventListener(
        'click',
        () => {

          uploadItems =
            uploadItems.filter(
              upload =>
                upload.id !== id
            );


          renderUploadQueue();

          updateUploadButton();

        }
      );

    });


  updateUploadButton();

}


/* =========================================================
   UPDATE UPLOAD BUTTON
========================================================= */

function updateUploadButton() {

  if (!uploadAllButton) {
    return;
  }


  uploadAllButton.disabled =
    !selectedSeason ||
    !uploadItems.length ||
    uploadItems.some(
      item =>
        !item.file
    );

}


/* =========================================================
   UPLOAD ALL
========================================================= */

uploadAllButton?.addEventListener(
  'click',
  async () => {

    if (!selectedAnime) {

      setStatus(
        'Please select an anime.',
        'error'
      );

      return;

    }


    if (!selectedSeason) {

      setStatus(
        'Please select a season.',
        'error'
      );

      return;

    }


    if (!uploadItems.length) {

      setStatus(
        'Please add at least one episode.',
        'error'
      );

      return;

    }


    if (
      uploadItems.some(
        item =>
          !item.file
      )
    ) {

      setStatus(
        'Please select a video file for every episode.',
        'error'
      );

      return;

    }


    const numbers =
      uploadItems.map(
        item =>
          Number(
            item.episodeNumber
          )
      );


    if (
      numbers.some(
        number =>
          !Number.isInteger(number) ||
          number < 1
      )
    ) {

      setStatus(
        'Every episode must have a valid episode number.',
        'error'
      );

      return;

    }


    const uniqueNumbers =
      new Set(numbers);


    if (
      uniqueNumbers.size !==
      numbers.length
    ) {

      setStatus(
        'Two upload rows cannot have the same episode number.',
        'error'
      );

      return;

    }


    try {

      uploadAllButton.disabled =
        true;


      overallProgressBox?.classList.remove(
        'hidden'
      );


      if (overallProgressBar) {

        overallProgressBar.style.width =
          '0%';

      }


      if (overallProgressPercent) {

        overallProgressPercent.textContent =
          '0%';

      }


      let completed =
        0;


      for (
        const item
        of uploadItems
      ) {

        item.status =
          'uploading';


        renderUploadQueue();


        try {

          await uploadSingleEpisode(
            item,
            percent => {

              const total =
                uploadItems.length;


              const currentProgress =
                percent / 100;


              const overall =
                (
                  (
                    completed +
                    currentProgress
                  ) /
                  total
                ) *
                100;


              const rounded =
                Math.round(
                  overall
                );


              if (overallProgressBar) {

                overallProgressBar.style.width =
                  `${rounded}%`;

              }


              if (overallProgressPercent) {

                overallProgressPercent.textContent =
                  `${rounded}%`;

              }


              if (overallProgressText) {

                overallProgressText.textContent =
                  `Uploading episode ${completed + 1} of ${total}...`;

              }

            }
          );


          item.status =
            'success';


          completed++;


          renderUploadQueue();


        } catch (error) {

          console.error(
            `Episode ${item.episodeNumber} upload error:`,
            error
          );


          item.status =
            'error';


          renderUploadQueue();


          setStatus(
            `Episode ${item.episodeNumber}: ${
              error?.message ||
              'Upload failed.'
            }`,
            'error'
          );

        }

      }


      if (overallProgressBar) {

        overallProgressBar.style.width =
          '100%';

      }


      if (overallProgressPercent) {

        overallProgressPercent.textContent =
          '100%';

      }


      if (overallProgressText) {

        overallProgressText.textContent =
          'Upload process completed.';

      }


      await loadEpisodes();


      uploadItems =
        uploadItems.filter(
          item =>
            item.status !==
            'success'
        );


      renderUploadQueue();


      setStatus(
        'Episode upload process completed.',
        'success'
      );


    } catch (error) {

      console.error(error);

      setStatus(
        error?.message ||
        'Upload process failed.',
        'error'
      );


    } finally {

      updateUploadButton();

    }

  }
);


/* =========================================================
   SINGLE EPISODE UPLOAD
========================================================= */

async function uploadSingleEpisode(
  item,
  onProgress
) {

  const file =
    item.file;


  if (!file) {

    throw new Error(
      'Video file is missing.'
    );

  }


  if (!selectedAnime) {

    throw new Error(
      'Anime is not selected.'
    );

  }


  if (!selectedSeason) {

    throw new Error(
      'Season is not selected.'
    );

  }


  /* -------------------------------------------------------
     STEP 1
     Get Cloudinary signature
  ------------------------------------------------------- */

  const signature =
    await adminApi(
      '/admin/cloudinary-signature',
      {

        method: 'POST',

        body: JSON.stringify({

          fileName:
            file.name

        })

      }
    );


  if (
    !signature ||
    !signature.cloud_name ||
    !signature.api_key ||
    !signature.timestamp ||
    !signature.signature
  ) {

    throw new Error(
      'Invalid Cloudinary signature response.'
    );

  }


  /* -------------------------------------------------------
     STEP 2
     Upload directly to Cloudinary
  ------------------------------------------------------- */

  const cloudinaryUrl =
    `https://api.cloudinary.com/v1_1/${
      encodeURIComponent(
        signature.cloud_name
      )
    }/video/upload`;


  const formData =
    new FormData();


  formData.append(
    'file',
    file
  );


  formData.append(
    'api_key',
    signature.api_key
  );


  formData.append(
    'timestamp',
    signature.timestamp
  );


  formData.append(
    'signature',
    signature.signature
  );


  if (signature.folder) {

    formData.append(
      'folder',
      signature.folder
    );

  }


  if (signature.public_id) {

    formData.append(
      'public_id',
      signature.public_id
    );

  }


  const uploadResult =
    await uploadToCloudinary(
      cloudinaryUrl,
      formData,
      onProgress
    );


  if (!uploadResult?.public_id) {

    throw new Error(
      'Cloudinary did not return a public ID.'
    );

  }


  /* -------------------------------------------------------
     STEP 3
     Save episode in backend
  ------------------------------------------------------- */

  const episodeNumber =
    Number(
      item.episodeNumber
    );


  await adminApi(
    '/admin/episodes',
    {

      method: 'POST',

      body: JSON.stringify({

        animeId:
          selectedAnime.id,

        seasonId:
          selectedSeason.id,

        episodeNumber,

        title:
          item.title || '',

        fileName:
          file.name,

        fileSize:
          file.size,

        cloudinaryPublicId:
          uploadResult.public_id,

        cloudinaryUrl:
          uploadResult.secure_url || ''

      })

    }
  );

}


/* =========================================================
   CLOUDINARY XHR UPLOAD
========================================================= */

function uploadToCloudinary(
  url,
  formData,
  onProgress
) {

  return new Promise(
    (resolve, reject) => {

      const xhr =
        new XMLHttpRequest();


      xhr.open(
        'POST',
        url,
        true
      );


      xhr.upload.onprogress =
        event => {

          if (
            !event.lengthComputable
          ) {

            return;

          }


          const percent =
            Math.round(
              (
                event.loaded /
                event.total
              ) * 100
            );


          onProgress?.(
            percent
          );

        };


      xhr.onload =
        () => {

          let data;


          try {

            data =
              JSON.parse(
                xhr.responseText
              );

          } catch {

            reject(
              new Error(
                'Invalid Cloudinary response.'
              )
            );

            return;

          }


          if (
            xhr.status >= 200 &&
            xhr.status < 300
          ) {

            resolve(data);

          } else {

            reject(
              new Error(
                data?.error?.message ||
                'Cloudinary upload failed.'
              )
            );

          }

        };


      xhr.onerror =
        () => {

          reject(
            new Error(
              'Network error during Cloudinary upload.'
            )
          );

        };


      xhr.onabort =
        () => {

          reject(
            new Error(
              'Upload cancelled.'
            )
          );

        };


      xhr.ontimeout =
        () => {

          reject(
            new Error(
              'Cloudinary upload timed out.'
            )
          );

        };


      xhr.send(
        formData
      );

    }
  );

}


/* =========================================================
   EDIT EPISODE
========================================================= */

async function editEpisodeHandler(
  id
) {

  const episode =
    episodes.find(
      item =>
        item.id === id
    );


  if (!episode) {
    return;
  }


  const newNumber =
    window.prompt(
      'Episode number:',
      episode.episodeNumber
    );


  if (
    newNumber === null
  ) {

    return;

  }


  const number =
    Number(
      newNumber
    );


  if (
    !Number.isInteger(number) ||
    number < 1
  ) {

    window.alert(
      'Enter a valid episode number.'
    );

    return;

  }


  const newTitle =
    window.prompt(
      'Episode name:',
      episode.title || ''
    );


  if (
    newTitle === null
  ) {

    return;

  }


  try {

    await adminApi(
      `/admin/episodes/${encodeURIComponent(
        id
      )}`,
      {

        method: 'PUT',

        body: JSON.stringify({

          episodeNumber:
            number,

          title:
            newTitle

        })

      }
    );


    await loadEpisodes();


    setStatus(
      'Episode updated successfully.',
      'success'
    );


  } catch (error) {

    console.error(error);

    setStatus(
      error?.message ||
      'Failed to update episode.',
      'error'
    );

  }

}


/* =========================================================
   DELETE EPISODE
========================================================= */

async function deleteEpisodeHandler(
  id
) {

  const episode =
    episodes.find(
      item =>
        item.id === id
    );


  if (!episode) {
    return;
  }


  const confirmed =
    window.confirm(
      `Delete Episode ${episode.episodeNumber}?\n\nThis will remove the episode from AnimeVault and delete its Cloudinary video.`
    );


  if (!confirmed) {
    return;
  }


  try {

    setStatus(
      'Deleting episode...'
    );


    await adminApi(
      `/admin/episodes/${encodeURIComponent(
        id
      )}`,
      {

        method: 'DELETE'

      }
    );


    await loadEpisodes();


    setStatus(
      'Episode deleted successfully.',
      'success'
    );


  } catch (error) {

    console.error(error);

    setStatus(
      error?.message ||
      'Failed to delete episode.',
      'error'
    );

  }

}


/* =========================================================
   INITIAL QUEUE
========================================================= */

if (
  uploadItems.length === 0
) {

  renderUploadQueue();

}


/* =========================================================
   INITIAL BUTTON STATE
========================================================= */

if (editAnimeButton) {

  editAnimeButton.disabled =
    true;

}


if (newSeasonButton) {

  newSeasonButton.disabled =
    true;

}


if (editSeasonButton) {

  editSeasonButton.disabled =
    true;

}


updateUploadButton();