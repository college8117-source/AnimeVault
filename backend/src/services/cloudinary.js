import { v2 as cloudinary } from 'cloudinary';


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
    String(fileName || 'episode')
      .replace(
        /\.[^/.]+$/,
        ''
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      )
      .slice(
        0,
        120
      );


  const publicId =
    `${safeFileName}_${Date.now()}`;


  /*
   * Only these parameters are signed.
   *
   * resource_type is NOT part of the signature.
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
   GET ORIGINAL VIDEO URL
========================================================= */

export function getVideoUrl(
  publicId
) {

  configure();


  /*
   * IMPORTANT:
   *
   * No format transformation is requested.
   *
   * This allows Cloudinary to deliver the uploaded
   * asset in its original stored format.
   */

  return cloudinary.url(
    publicId,
    {
      resource_type:
        'video',

      type:
        'upload',

      secure:
        true
    }
  );

}