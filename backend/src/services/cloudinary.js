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
   GET VIDEO URL
========================================================= */

export function getVideoUrl(
  publicId,
  originalFileName = ''
) {

  configure();


  /*
   * Extract the original extension.
   *
   * Examples:
   * video.mp4  -> mp4
   * video.webm -> webm
   * video.mkv  -> mkv
   */

  const match =
    String(
      originalFileName || ''
    ).match(
      /\.([a-zA-Z0-9]+)$/
    );


  const extension =
    match
      ? match[1].toLowerCase()
      : null;


  /*
   * Without a requested format Cloudinary delivers
   * the originally uploaded format.
   *
   * When we know the original extension, explicitly
   * include it in the delivery URL so the requested
   * format remains unambiguous.
   */

  const options = {

    resource_type:
      'video',

    type:
      'upload',

    secure:
      true

  };


  if (extension) {

    options.format =
      extension;

  }


  return cloudinary.url(
    publicId,
    options
  );

}