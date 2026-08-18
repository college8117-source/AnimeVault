import { v2 as cloudinary } from 'cloudinary';


/* =========================================================
   CONFIGURE CLOUDINARY
========================================================= */

function configure() {

  const {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET
  } = process.env;


  if (
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    throw new Error(
      'Cloudinary is not configured.'
    );
  }


  cloudinary.config({
    cloud_name:
      CLOUDINARY_CLOUD_NAME,

    api_key:
      CLOUDINARY_API_KEY,

    api_secret:
      CLOUDINARY_API_SECRET
  });
}


/* =========================================================
   CREATE SIGNED VIDEO UPLOAD
========================================================= */

export function createSignedVideoUpload(
  fileName
) {

  configure();


  const timestamp =
    Math.floor(
      Date.now() / 1000
    );


  const folder =
    process.env.CLOUDINARY_FOLDER ||
    'animevault';


  const safeFileName =
    String(
      fileName || 'episode'
    )
      .replace(
        /\.[^/.]+$/,
        ''
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      )
      .slice(0, 120);


  const publicId =
    `${safeFileName}_${Date.now()}`;


  /*
   * IMPORTANT:
   *
   * resource_type is NOT included
   * in the signature.
   */

  const paramsToSign = {

    folder,

    public_id:
      publicId,

    timestamp

  };


  const signature =
    cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );


  return {

    signature,

    timestamp,

    folder,

    public_id:
      publicId,

    api_key:
      process.env.CLOUDINARY_API_KEY,

    cloud_name:
      process.env.CLOUDINARY_CLOUD_NAME

  };

}


/* =========================================================
   GET VIDEO URL
========================================================= */

export function getVideoUrl(
  publicId
) {

  configure();


  return cloudinary.url(
    publicId,
    {
      resource_type: 'video',
      type: 'upload',
      secure: true
    }
  );

}


/* =========================================================
   DELETE VIDEO
========================================================= */

export async function deleteVideo(
  publicId
) {

  configure();


  if (!publicId) {

    throw new Error(
      'Cloudinary public ID is required.'
    );

  }


  const result =
    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: 'video',
        type: 'upload',
        invalidate: true
      }
    );


  /*
   * Cloudinary normally returns:
   *
   * { result: "ok" }
   *
   * or:
   *
   * { result: "not found" }
   */

  if (
    result.result !== 'ok' &&
    result.result !== 'not found'
  ) {

    throw new Error(
      `Cloudinary delete failed: ${result.result}`
    );

  }


  return result;

}