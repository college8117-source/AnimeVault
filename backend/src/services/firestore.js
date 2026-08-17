import { firestore } from "../firebase.js";

const serialize = (doc) => ({
  id: doc.id,
  ...doc.data()
});


/* =========================================================
   GET ALL ANIME
========================================================= */

export async function listAnime() {

  const snapshot = await firestore()
    .collection("anime")
    .orderBy("name")
    .get();

  return snapshot.docs.map(serialize);
}


/* =========================================================
   FIND ANIME BY NAME
========================================================= */

export async function findAnimeByName(name) {

  const normalizedName =
    name.trim().toLowerCase();

  const snapshot = await firestore()
    .collection("anime")
    .where("nameLower", "==", normalizedName)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return serialize(snapshot.docs[0]);
}


/* =========================================================
   GET ANIME
========================================================= */

export async function getAnime(id) {

  const animeDoc =
    await firestore()
      .collection("anime")
      .doc(id)
      .get();

  if (!animeDoc.exists) {
    return null;
  }

  const seasonSnapshot =
    await firestore()
      .collection("seasons")
      .where("animeId", "==", id)
      .orderBy("seasonNumber")
      .get();

  const seasons = [];

  for (const seasonDoc of seasonSnapshot.docs) {

    const episodeSnapshot =
      await firestore()
        .collection("episodes")
        .where(
          "seasonId",
          "==",
          seasonDoc.id
        )
        .orderBy("episodeNumber")
        .get();

    seasons.push({
      ...serialize(seasonDoc),

      episodes:
        episodeSnapshot.docs.map(
          serialize
        )
    });
  }

  return {
    ...serialize(animeDoc),
    seasons
  };
}


/* =========================================================
   GET EPISODE
========================================================= */

export async function getEpisode(id) {

  const doc =
    await firestore()
      .collection("episodes")
      .doc(id)
      .get();

  return doc.exists
    ? serialize(doc)
    : null;
}


/* =========================================================
   CREATE ANIME
========================================================= */

export async function createAnime({
  name,
  description
}) {

  const cleanName =
    name.trim();

  const existing =
    await findAnimeByName(
      cleanName
    );

  if (existing) {
    return existing;
  }

  const now =
    new Date().toISOString();

  const ref =
    await firestore()
      .collection("anime")
      .add({

        name: cleanName,

        nameLower:
          cleanName.toLowerCase(),

        description:
          description || "",

        createdAt: now,

        updatedAt: now
      });

  return {

    id: ref.id,

    name: cleanName,

    nameLower:
      cleanName.toLowerCase(),

    description:
      description || "",

    createdAt: now,

    updatedAt: now
  };
}


/* =========================================================
   FIND SEASON
========================================================= */

export async function findSeason(
  animeId,
  seasonNumber
) {

  const snapshot =
    await firestore()
      .collection("seasons")
      .where(
        "animeId",
        "==",
        animeId
      )
      .where(
        "seasonNumber",
        "==",
        Number(seasonNumber)
      )
      .limit(1)
      .get();

  if (snapshot.empty) {
    return null;
  }

  return serialize(
    snapshot.docs[0]
  );
}


/* =========================================================
   CREATE OR GET SEASON
========================================================= */

export async function createSeason({
  animeId,
  seasonNumber
}) {

  const number =
    Number(seasonNumber);

  const existing =
    await findSeason(
      animeId,
      number
    );

  if (existing) {
    return existing;
  }

  const now =
    new Date().toISOString();

  const ref =
    await firestore()
      .collection("seasons")
      .add({

        animeId,

        seasonNumber:
          number,

        createdAt:
          now,

        updatedAt:
          now
      });

  return {

    id: ref.id,

    animeId,

    seasonNumber:
      number,

    createdAt:
      now,

    updatedAt:
      now
  };
}


/* =========================================================
   FIND EPISODE
========================================================= */

export async function findEpisode(
  seasonId,
  episodeNumber
) {

  const snapshot =
    await firestore()
      .collection("episodes")
      .where(
        "seasonId",
        "==",
        seasonId
      )
      .where(
        "episodeNumber",
        "==",
        Number(episodeNumber)
      )
      .limit(1)
      .get();

  if (snapshot.empty) {
    return null;
  }

  return serialize(
    snapshot.docs[0]
  );
}


/* =========================================================
   CREATE EPISODE
========================================================= */

export async function createEpisode(
  data
) {

  const episodeNumber =
    Number(data.episodeNumber);


  const existing =
    await findEpisode(
      data.seasonId,
      episodeNumber
    );


  if (existing) {

    throw new Error(
      `Episode ${episodeNumber} already exists in this season.`
    );
  }


  const now =
    new Date().toISOString();


  const ref =
    await firestore()
      .collection("episodes")
      .add({

        animeId:
          data.animeId,

        seasonId:
          data.seasonId,

        episodeNumber,

        title:
          data.title || "",

        description:
          data.description || "",

        language:
          data.language || "",

        duration:
          data.duration || "",

        fileName:
          data.fileName || "",

        fileSize:
          Number(
            data.fileSize || 0
          ),

        cloudinaryPublicId:
          data.cloudinaryPublicId,

        cloudinaryUrl:
          data.cloudinaryUrl || "",

        createdAt:
          now,

        updatedAt:
          now
      });


  return {

    id: ref.id,

    animeId:
      data.animeId,

    seasonId:
      data.seasonId,

    episodeNumber,

    title:
      data.title || "",

    description:
      data.description || "",

    language:
      data.language || "",

    duration:
      data.duration || "",

    fileName:
      data.fileName || "",

    fileSize:
      Number(
        data.fileSize || 0
      ),

    cloudinaryPublicId:
      data.cloudinaryPublicId,

    cloudinaryUrl:
      data.cloudinaryUrl || "",

    createdAt:
      now,

    updatedAt:
      now
  };
}