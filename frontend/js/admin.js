import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyBJZPJXu0PWo_JGZY7ohA7m4SVEgp_wEig",
  authDomain: "animevault-1.firebaseapp.com",
  projectId: "animevault-1",
  storageBucket: "animevault-1.firebasestorage.app",
  messagingSenderId: "879320021973",
  appId: "1:879320021973:web:ba236a7386e136d0451b5c",
};


/* =========================================================
   FIREBASE INITIALIZATION
========================================================= */

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginBox = document.getElementById("loginBox");
const adminArea = document.getElementById("adminArea");

const loginForm = document.getElementById("loginForm");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const logoutButton = document.getElementById("logout");

const episodeForm = document.getElementById("episodeForm");

const animeNameInput = document.getElementById("animeName");
const animeDescriptionInput =
  document.getElementById("animeDescription");

const seasonNumberInput =
  document.getElementById("seasonNumber");

const episodeNumberInput =
  document.getElementById("episodeNumber");

const episodeTitleInput =
  document.getElementById("episodeTitle");

const videoFileInput =
  document.getElementById("videoFile");

const chooseFileButton =
  document.getElementById("chooseFileButton");

const selectedFileText =
  document.getElementById("selectedFile");

const uploadButton =
  document.getElementById("uploadButton");

const uploadButtonText =
  document.getElementById("uploadButtonText");

const uploadProgressBox =
  document.getElementById("uploadProgressBox");

const progressBar =
  document.getElementById("progressBar");

const progressPercent =
  document.getElementById("progressPercent");

const uploadProgressText =
  document.getElementById("uploadProgressText");

const uploadStatusBox =
  document.getElementById("uploadStatusBox");

const uploadStatusIcon =
  document.getElementById("uploadStatusIcon");

const uploadStatus =
  document.getElementById("uploadStatus");

const adminStatus =
  document.getElementById("adminStatus");


/* =========================================================
   API
========================================================= */

const API_URL =
  window.ANIMEVAULT_API ||
  "http://localhost:4000/api";


/* =========================================================
   UTILITY
========================================================= */

function setAdminMessage(message) {
  adminStatus.textContent = message;
}


function escapeHtml(value) {

  return String(value ?? "")
    .replace(/[&<>"']/g, character => {

      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };

      return entities[character];
    });
}


function formatFileSize(bytes) {

  if (!bytes) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  const size =
    bytes /
    Math.pow(1024, index);

  return `${size.toFixed(2)} ${units[index]}`;
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
  endpoint,
  options = {}
) {

  const token =
    localStorage.getItem(
      "animevault_admin_token"
    );

  const headers = {
    ...(options.headers || {})
  };


  if (!(options.body instanceof FormData)) {

    headers["Content-Type"] =
      "application/json";
  }


  if (token) {

    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data.error ||
      "Request failed."
    );
  }


  return data;
}


/* =========================================================
   AUTH TOKEN
========================================================= */

async function saveAuthToken(user) {

  const token =
    await user.getIdToken(true);

  localStorage.setItem(
    "animevault_admin_token",
    token
  );

  return token;
}


/* =========================================================
   LOGIN
========================================================= */

loginForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {

      setAdminMessage(
        "Email and password are required."
      );

      return;
    }


    try {

      setAdminMessage(
        "Signing in..."
      );


      const credentials =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );


      await saveAuthToken(
        credentials.user
      );


      setAdminMessage(
        "Login successful."
      );


    } catch (error) {

      console.error(error);

      setAdminMessage(
        getFirebaseErrorMessage(
          error
        )
      );
    }
  }
);


/* =========================================================
   LOGOUT
========================================================= */

logoutButton.addEventListener(
  "click",
  async () => {

    try {

      await signOut(auth);

      localStorage.removeItem(
        "animevault_admin_token"
      );

      setAdminMessage(
        "Logged out successfully."
      );

    } catch (error) {

      console.error(error);

      setAdminMessage(
        "Unable to logout."
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

    if (user) {

      try {

        await saveAuthToken(user);

        loginBox.classList.add(
          "hidden"
        );

        adminArea.classList.remove(
          "hidden"
        );

        setAdminMessage(
          "Admin session active."
        );

      } catch (error) {

        console.error(error);

        await signOut(auth);

        loginBox.classList.remove(
          "hidden"
        );

        adminArea.classList.add(
          "hidden"
        );
      }

    } else {

      loginBox.classList.remove(
        "hidden"
      );

      adminArea.classList.add(
        "hidden"
      );

      localStorage.removeItem(
        "animevault_admin_token"
      );
    }
  }
);


/* =========================================================
   CHOOSE FILE
========================================================= */

chooseFileButton.addEventListener(
  "click",
  () => {

    videoFileInput.click();

  }
);


/* =========================================================
   FILE SELECTED
========================================================= */

videoFileInput.addEventListener(
  "change",
  () => {

    const file =
      videoFileInput.files[0];


    if (!file) {

      selectedFileText.textContent =
        "No file selected";

      return;
    }


    selectedFileText.textContent =
      `${file.name} • ${formatFileSize(file.size)}`;

  }
);


/* =========================================================
   FORM SUBMIT
========================================================= */

episodeForm.addEventListener(
  "submit",
  async event => {

    event.preventDefault();


    const animeName =
      animeNameInput.value.trim();

    const description =
      animeDescriptionInput.value.trim();

    const seasonNumber =
      Number(
        seasonNumberInput.value
      );

    const episodeNumber =
      Number(
        episodeNumberInput.value
      );

    const episodeTitle =
      episodeTitleInput.value.trim();

    const file =
      videoFileInput.files[0];


    /* -----------------------------------------------------
       VALIDATION
    ----------------------------------------------------- */

    if (!animeName) {

      setAdminMessage(
        "Anime name is required."
      );

      animeNameInput.focus();

      return;
    }


    if (!seasonNumber || seasonNumber < 1) {

      setAdminMessage(
        "Enter a valid season number."
      );

      seasonNumberInput.focus();

      return;
    }


    if (!episodeNumber || episodeNumber < 1) {

      setAdminMessage(
        "Enter a valid episode number."
      );

      episodeNumberInput.focus();

      return;
    }


    if (!file) {

      setAdminMessage(
        "Please choose an episode video."
      );

      return;
    }


    if (!file.type.startsWith("video/")) {

      setAdminMessage(
        "Please select a valid video file."
      );

      return;
    }


    /* -----------------------------------------------------
       START UI
    ----------------------------------------------------- */

    setUploadState(true);

    hideStatus();

    setProgress(
      0,
      "Preparing upload..."
    );


    try {

      /* ===================================================
         STEP 1
         GET CLOUDINARY SIGNATURE
      =================================================== */

      setProgress(
        5,
        "Preparing secure Cloudinary upload..."
      );


      const signature =
        await apiRequest(
          "/admin/cloudinary-signature",
          {
            method: "POST",

            body: JSON.stringify({
              fileName: file.name
            })
          }
        );


      /* ===================================================
         STEP 2
         UPLOAD TO CLOUDINARY
      =================================================== */

      const cloudinaryResult =
        await uploadToCloudinary(
          file,
          signature
        );


      /* ===================================================
         STEP 3
         CREATE ANIME
      =================================================== */

      setProgress(
        80,
        "Saving anime information..."
      );


      const animeResponse =
        await apiRequest(
          "/admin/anime",
          {
            method: "POST",

            body: JSON.stringify({

              name: animeName,

              description: description
            })
          }
        );


      const anime =
        animeResponse.anime;


      /* ===================================================
         STEP 4
         CREATE SEASON
      =================================================== */

      setProgress(
        87,
        "Creating season..."
      );


      const seasonResponse =
        await apiRequest(
          "/admin/seasons",
          {
            method: "POST",

            body: JSON.stringify({

              animeId: anime.id,

              seasonNumber:
                seasonNumber
            })
          }
        );


      const season =
        seasonResponse.season;


      /* ===================================================
         STEP 5
         SAVE EPISODE
      =================================================== */

      setProgress(
        94,
        "Saving episode information..."
      );


      await apiRequest(
        "/admin/episodes",
        {
          method: "POST",

          body: JSON.stringify({

            animeId:
              anime.id,

            seasonId:
              season.id,

            episodeNumber:
              episodeNumber,

            title:
              episodeTitle,

            fileName:
              file.name,

            fileSize:
              file.size,

            cloudinaryPublicId:
              cloudinaryResult.public_id,

            cloudinaryUrl:
              cloudinaryResult.secure_url

          })
        }
      );


      /* ===================================================
         COMPLETE
      =================================================== */

      setProgress(
        100,
        "Upload completed successfully."
      );


      showSuccess(
        "Anime episode uploaded successfully."
      );


      episodeForm.reset();

      selectedFileText.textContent =
        "No file selected";


    } catch (error) {

      console.error(error);

      showError(
        error.message ||
        "Upload failed."
      );

    } finally {

      setUploadState(false);
    }
  }
);


/* =========================================================
   CLOUDINARY UPLOAD WITH PROGRESS
========================================================= */

function uploadToCloudinary(
  file,
  signature
) {

  return new Promise(
    (resolve, reject) => {

      const xhr =
        new XMLHttpRequest();


      const url =
        `https://api.cloudinary.com/v1_1/` +
        `${encodeURIComponent(
          signature.cloud_name
        )}` +
        `/video/upload`;


      xhr.open(
        "POST",
        url,
        true
      );


      xhr.upload.addEventListener(
        "progress",
        event => {

          if (!event.lengthComputable) {
            return;
          }


          const percent =
            Math.round(
              (event.loaded /
                event.total) *
              100
            );


          const overall =
            5 +
            Math.round(
              percent * 0.70
            );


          setProgress(
            overall,
            `Uploading video... ${percent}%`
          );
        }
      );


      xhr.onload = () => {

        try {

          const result =
            JSON.parse(
              xhr.responseText
            );


          if (
            xhr.status >= 200 &&
            xhr.status < 300 &&
            !result.error
          ) {

            resolve(result);

          } else {

            reject(
              new Error(
                result.error?.message ||
                "Cloudinary upload failed."
              )
            );
          }

        } catch {

          reject(
            new Error(
              "Invalid Cloudinary response."
            )
          );
        }
      };


      xhr.onerror = () => {

        reject(
          new Error(
            "Network error during video upload."
          )
        );
      };


      xhr.onabort = () => {

        reject(
          new Error(
            "Video upload was cancelled."
          )
        );
      };


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      formData.append(
        "api_key",
        signature.api_key
      );


      formData.append(
        "timestamp",
        signature.timestamp
      );


      formData.append(
        "folder",
        signature.folder
      );


      formData.append(
        "public_id",
        signature.public_id
      );


      formData.append(
        "resource_type",
        "video"
      );


      formData.append(
        "signature",
        signature.signature
      );


      xhr.send(
        formData
      );
    }
  );
}


/* =========================================================
   PROGRESS UI
========================================================= */

function setProgress(
  percent,
  message
) {

  const safePercent =
    Math.max(
      0,
      Math.min(
        100,
        percent
      )
    );


  uploadProgressBox.classList.remove(
    "hidden"
  );


  progressBar.style.width =
    `${safePercent}%`;


  progressPercent.textContent =
    `${safePercent}%`;


  uploadProgressText.textContent =
    message;
}


/* =========================================================
   UPLOAD STATE
========================================================= */

function setUploadState(
  uploading
) {

  uploadButton.disabled =
    uploading;


  chooseFileButton.disabled =
    uploading;


  uploadButtonText.textContent =
    uploading
      ? "Uploading..."
      : "Upload Anime";
}


/* =========================================================
   SUCCESS
========================================================= */

function showSuccess(
  message
) {

  uploadStatusBox.classList.remove(
    "hidden"
  );


  uploadStatusIcon.textContent =
    "✓";


  uploadStatus.textContent =
    message;


  setAdminMessage(
    message
  );
}


/* =========================================================
   ERROR
========================================================= */

function showError(
  message
) {

  uploadStatusBox.classList.remove(
    "hidden"
  );


  uploadStatusIcon.textContent =
    "!";


  uploadStatus.textContent =
    message;


  setAdminMessage(
    message
  );
}


/* =========================================================
   HIDE STATUS
========================================================= */

function hideStatus() {

  uploadStatusBox.classList.add(
    "hidden"
  );
}


/* =========================================================
   FIREBASE ERROR MESSAGES
========================================================= */

function getFirebaseErrorMessage(
  error
) {

  const code =
    error?.code || "";


  const messages = {

    "auth/invalid-credential":
      "Invalid email or password.",

    "auth/invalid-email":
      "Please enter a valid email.",

    "auth/user-not-found":
      "Admin account not found.",

    "auth/wrong-password":
      "Invalid email or password.",

    "auth/too-many-requests":
      "Too many login attempts. Try again later.",

    "auth/network-request-failed":
      "Network error. Check your internet connection."

  };


  return (
    messages[code] ||
    error?.message ||
    "Login failed."
  );
}