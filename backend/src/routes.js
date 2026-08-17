import { Router } from 'express';

import { requireAdmin } from './middleware/auth.js';

import {
  listAnime,
  getAnime,
  getEpisode,
  createAnime,
  createSeason,
  createEpisode
} from './services/firestore.js';

import {
  createSignedVideoUpload,
  getVideoUrl
} from './services/cloudinary.js';


export const router = Router();


/* =========================================================
   HEALTH
========================================================= */

router.get('/health', (_req, res) => {

  res.json({
    ok: true,
    service: 'AnimeVault API'
  });

});


/* =========================================================
   PUBLIC — LIST ANIME
========================================================= */

router.get('/anime', async (_req, res, next) => {

  try {

    const anime =
      await listAnime();

    res.json({
      anime
    });

  } catch (error) {

    next(error);

  }

});


/* =========================================================
   PUBLIC — SINGLE ANIME
========================================================= */

router.get('/anime/:id', async (req, res, next) => {

  try {

    const anime =
      await getAnime(
        req.params.id
      );


    if (!anime) {

      return res.status(404).json({
        error: 'Anime not found.'
      });

    }


    res.json({
      anime
    });

  } catch (error) {

    next(error);

  }

});


/* =========================================================
   PUBLIC — EPISODE DOWNLOAD
========================================================= */

router.get(
  '/episodes/:id/download',
  async (req, res, next) => {

    try {

      const episode =
        await getEpisode(
          req.params.id
        );


      if (!episode) {

        return res.status(404).json({
          error: 'Episode not found.'
        });

      }


      if (!episode.cloudinaryPublicId) {

        return res.status(404).json({
          error: 'Video is not available.'
        });

      }


      const url =
        getVideoUrl(
          episode.cloudinaryPublicId
        );


      /*
       * Preserve the original uploaded filename.
       *
       * Example:
       * Episode 1.mp4
       * Episode 2.webm
       * Episode 3.mkv
       */

      const fileName =
        String(
          episode.fileName ||
          'episode'
        ).trim();


      res.json({
        url,
        fileName
      });

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

router.use(
  '/admin',
  requireAdmin
);


/* =========================================================
   ADMIN — CREATE / GET ANIME
========================================================= */

router.post(
  '/admin/anime',
  async (req, res, next) => {

    try {

      const name =
        req.body.name?.trim();

      const description =
        req.body.description?.trim() || '';


      if (!name) {

        return res.status(422).json({
          error: 'Anime name is required.'
        });

      }


      const anime =
        await createAnime({
          name,
          description
        });


      res.status(201).json({
        anime
      });

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN — CREATE / GET SEASON
========================================================= */

router.post(
  '/admin/seasons',
  async (req, res, next) => {

    try {

      const animeId =
        req.body.animeId;

      const seasonNumber =
        Number(
          req.body.seasonNumber
        );


      if (!animeId) {

        return res.status(422).json({
          error: 'animeId is required.'
        });

      }


      if (
        !Number.isInteger(
          seasonNumber
        ) ||
        seasonNumber < 1
      ) {

        return res.status(422).json({
          error:
            'seasonNumber must be a positive integer.'
        });

      }


      const season =
        await createSeason({

          animeId,

          seasonNumber

        });


      res.status(201).json({
        season
      });

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN — CLOUDINARY SIGNATURE
========================================================= */

router.post(
  '/admin/cloudinary-signature',
  async (req, res, next) => {

    try {

      const fileName =
        req.body.fileName?.trim() ||
        'episode';


      const result =
        createSignedVideoUpload(
          fileName
        );


      res.json(result);

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN — CREATE EPISODE
========================================================= */

router.post(
  '/admin/episodes',
  async (req, res, next) => {

    try {

      const required = [
        'animeId',
        'seasonId',
        'episodeNumber',
        'cloudinaryPublicId'
      ];


      const missing =
        required.find(
          key => {

            const value =
              req.body[key];

            return (
              value === undefined ||
              value === null ||
              value === ''
            );

          }
        );


      if (missing) {

        return res.status(422).json({

          error:
            `${missing} is required.`

        });

      }


      const episodeNumber =
        Number(
          req.body.episodeNumber
        );


      if (
        !Number.isInteger(
          episodeNumber
        ) ||
        episodeNumber < 1
      ) {

        return res.status(422).json({

          error:
            'episodeNumber must be a positive integer.'

        });

      }


      const episode =
        await createEpisode({

          ...req.body,

          episodeNumber

        });


      res.status(201).json({
        episode
      });


    } catch (error) {

      /*
       * Duplicate episode
       */

      if (
        error.message?.includes(
          'already exists'
        )
      ) {

        return res.status(409).json({

          error:
            error.message

        });

      }


      next(error);

    }

  }
);