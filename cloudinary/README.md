# Cloudinary setup

Create a Cloudinary account.

Add these to `backend/.env`:

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

Never expose `CLOUDINARY_API_SECRET` in frontend code.

The frontend receives only a signed upload payload from the Node backend.
