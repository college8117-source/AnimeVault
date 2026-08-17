# AnimeVault — Firebase + Cloudinary

Complete project skeleton with working frontend/backend code.

Stack:
- HTML5
- CSS3
- Vanilla JavaScript
- Node.js + Express
- Firebase Authentication + Firestore
- Cloudinary Video Storage

Supabase is NOT used.

## Run backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

The Firebase and Cloudinary credentials are intentionally blank. Configure them after creating the accounts.

## Frontend

Serve the `frontend` directory with a local static server such as VS Code Live Server.

## Admin security

The backend verifies Firebase ID tokens and requires the Firebase custom claim `admin: true`.

## Video flow

Admin -> Firebase login -> Node/Express -> signed Cloudinary upload -> Firestore episode metadata -> public episode page -> Cloudinary download URL.
