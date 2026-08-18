import { Router } from 'express';

import { requireAdmin } from './middleware/auth.js';

import {
  listAnime,
  getAnime,
  getEpisode,
  createAnime,
  updateAnime,
  createSeason,
  listSeasons,
  updateSeason,
  createEpisode,
  listEpisodes,
  updateEpisode,
  deleteEpisode
} from './services/firestore.js';

import {
  createSignedVideoUpload,
  getVideoUrl,
  deleteVideo
} from './services/cloudinary.js';


const router = Router();


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
   PUBLIC - LIST ANIME
========================================================= */

router.get('/anime', async (_req, res, next) => {

  try {

    const anime = await listAnime();

    res.json({
      anime
    });

  } catch (error) {

    next(error);

  }

});


/* =========================================================
   PUBLIC - SINGLE ANIME
========================================================= */

router.get('/anime/:id', async (req, res, next) => {

  try {

    const anime = await getAnime(
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
   PUBLIC - EPISODE DOWNLOAD
========================================================= */

router.get(
  '/episodes/:id/download',
  async (req, res, next) => {

    try {

      const episode = await getEpisode(
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

      const url = getVideoUrl(
        episode.cloudinaryPublicId
      );

      const fileName = String(
        episode.fileName || 'episode'
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
   ADMIN - LIST ANIME
========================================================= */

router.get(
  '/admin/anime',
  async (_req, res, next) => {

    try {

      const anime = await listAnime();

      res.json({
        anime
      });

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - CREATE ANIME
========================================================= */

router.post(
  '/admin/anime',
  async (req, res, next) => {

    try {

      const name =
        typeof req.body.name === 'string'
          ? req.body.name.trim()
          : '';

      const description =
        typeof req.body.description === 'string'
          ? req.body.description.trim()
          : '';

      if (!name) {

        return res.status(422).json({
          error: 'Anime name is required.'
        });

      }

      const anime = await createAnime({
        name,
        description
      });

      res.status(201).json({
        anime
      });

    } catch (error) {

      if (
        error.message?.includes(
          'already exists'
        )
      ) {

        return res.status(409).json({
          error: error.message
        });

      }

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - UPDATE ANIME
========================================================= */

router.put(
  '/admin/anime/:id',
  async (req, res, next) => {

    try {

      const name =
        typeof req.body.name === 'string'
          ? req.body.name.trim()
          : '';

      const description =
        typeof req.body.description === 'string'
          ? req.body.description.trim()
          : '';

      if (!name) {

        return res.status(422).json({
          error: 'Anime name is required.'
        });

      }

      const anime = await updateAnime(
        req.params.id,
        {
          name,
          description
        }
      );

      res.json({
        anime
      });

    } catch (error) {

      if (
        error.message?.includes(
          'already exists'
        )
      ) {

        return res.status(409).json({
          error: error.message
        });

      }

      if (
        error.message ===
        'Anime not found.'
      ) {

        return res.status(404).json({
          error: 'Anime not found.'
        });

      }

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - LIST SEASONS
========================================================= */

router.get(
  '/admin/seasons/:animeId',
  async (req, res, next) => {

    try {

      const seasons = await listSeasons(
        req.params.animeId
      );

      res.json({
        seasons
      });

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - CREATE SEASON
========================================================= */

router.post(
  '/admin/seasons',
  async (req, res, next) => {

    try {

      const animeId =
        typeof req.body.animeId === 'string'
          ? req.body.animeId.trim()
          : '';

      const seasonNumber =
        Number(req.body.seasonNumber);

      if (!animeId) {

        return res.status(422).json({
          error: 'animeId is required.'
        });

      }

      if (
        !Number.isInteger(seasonNumber) ||
        seasonNumber < 1
      ) {

        return res.status(422).json({
          error:
            'seasonNumber must be a positive integer.'
        });

      }

      const season = await createSeason({
        animeId,
        seasonNumber
      });

      res.status(201).json({
        season
      });

    } catch (error) {

      if (
        error.message?.includes(
          'already exists'
        )
      ) {

        return res.status(409).json({
          error: error.message
        });

      }

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - UPDATE SEASON
========================================================= */

router.put(
  '/admin/seasons/:id',
  async (req, res, next) => {

    try {

      const seasonNumber =
        Number(req.body.seasonNumber);

      if (
        !Number.isInteger(seasonNumber) ||
        seasonNumber < 1
      ) {

        return res.status(422).json({
          error:
            'seasonNumber must be a positive integer.'
        });

      }

      const season = await updateSeason(
        req.params.id,
        seasonNumber
      );

      res.json({
        season
      });

    } catch (error) {

      if (
        error.message?.includes(
          'already exists'
        )
      ) {

        return res.status(409).json({
          error: error.message
        });

      }

      if (
        error.message ===
        'Season not found.'
      ) {

        return res.status(404).json({
          error: 'Season not found.'
        });

      }

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - LIST EPISODES
========================================================= */

router.get(
  '/admin/episodes/:seasonId',
  async (req, res, next) => {

    try {

      const episodes = await listEpisodes(
        req.params.seasonId
      );

      res.json({
        episodes
      });

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - CLOUDINARY SIGNATURE
========================================================= */

router.post(
  '/admin/cloudinary-signature',
  async (req, res, next) => {

    try {

      const fileName =
        typeof req.body.fileName === 'string'
          ? req.body.fileName.trim()
          : 'episode';

      const result =
        createSignedVideoUpload(
          fileName || 'episode'
        );

      res.json(result);

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - CREATE EPISODE
========================================================= */

router.post(
  '/admin/episodes',
  async (req, res, next) => {

    try {

      const requiredFields = [
        'animeId',
        'seasonId',
        'episodeNumber',
        'cloudinaryPublicId'
      ];

      const missing =
        requiredFields.find(
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
        !Number.isInteger(episodeNumber) ||
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

      if (
        error.message?.includes(
          'already exists'
        )
      ) {

        return res.status(409).json({
          error: error.message
        });

      }

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - UPDATE EPISODE
========================================================= */

router.put(
  '/admin/episodes/:id',
  async (req, res, next) => {

    try {

      const episodeNumber =
        Number(
          req.body.episodeNumber
        );

      if (
        !Number.isInteger(episodeNumber) ||
        episodeNumber < 1
      ) {

        return res.status(422).json({
          error:
            'episodeNumber must be a positive integer.'
        });

      }

      const episode =
        await updateEpisode(
          req.params.id,
          {
            episodeNumber,
            title:
              typeof req.body.title === 'string'
                ? req.body.title
                : '',
            description:
              typeof req.body.description === 'string'
                ? req.body.description
                : '',
            language:
              typeof req.body.language === 'string'
                ? req.body.language
                : ''
          }
        );

      res.json({
        episode
      });

    } catch (error) {

      if (
        error.message?.includes(
          'already exists'
        )
      ) {

        return res.status(409).json({
          error: error.message
        });

      }

      if (
        error.message ===
        'Episode not found.'
      ) {

        return res.status(404).json({
          error: 'Episode not found.'
        });

      }

      next(error);

    }

  }
);


/* =========================================================
   ADMIN - DELETE EPISODE
========================================================= */

router.delete(
  '/admin/episodes/:id',
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

      if (
        episode.cloudinaryPublicId
      ) {

        await deleteVideo(
          episode.cloudinaryPublicId
        );

      }

      await deleteEpisode(
        req.params.id
      );

      res.json({
        ok: true,
        message:
          'Episode deleted successfully.',
        episodeId:
          req.params.id
      });

    } catch (error) {

      next(error);

    }

  }
);


/* =========================================================
   EXPORT
========================================================= */

export { router };