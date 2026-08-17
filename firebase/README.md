# Firebase setup

1. Create a Firebase project.
2. Enable Authentication -> Email/Password.
3. Create Firestore Database.
4. Register a Web App.
5. Put its configuration in `frontend/js/admin.js`.
6. Create a Firebase service account.
7. Put service-account values in `backend/.env`.
8. Give your admin user the custom claim `admin: true`.

The backend is the authority for admin APIs.

Cloudinary is used for videos; Firebase Storage is not used for video storage.
