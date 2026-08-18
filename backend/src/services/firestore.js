import { firestore } from "../firebase.js";


/* =========================================================
   SERIALIZE FIRESTORE DOCUMENT
========================================================= */

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
    String(name || "")
      .trim()
      .toLowerCase();


  if (!normalizedName) {
    return null;
  }


  const snapshot = await firestore()
    .collection("anime")
    .where(
      "nameLower",
      "==",
      normalizedName
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
   GET ANIME WITH SEASONS + EPISODES
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
      .where(
        "animeId",
        "==",
        id
      )
      .orderBy(
        "seasonNumber"
      )
      .get();


  const seasons = [];


  for (
    const seasonDoc
    of seasonSnapshot.docs
  ) {

    const episodeSnapshot =
      await firestore()
        .collection("episodes")
        .where(
          "seasonId",
          "==",
          seasonDoc.id
        )
        .orderBy(
          "episodeNumber"
        )
        .get();


    seasons.push({

      ...serialize(
        seasonDoc
      ),

      episodes:
        episodeSnapshot.docs.map(
          serialize
        )

    });

  }


  return {

    ...serialize(
      animeDoc
    ),

    seasons

  };

}


/* =========================================================
   GET SINGLE EPISODE
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
   GET ALL SEASONS FOR ANIME
========================================================= */

export async function listSeasons(
  animeId
) {

  const snapshot =
    await firestore()
      .collection("seasons")
      .where(
        "animeId",
        "==",
        animeId
      )
      .orderBy(
        "seasonNumber"
      )
      .get();


  return snapshot.docs.map(
    serialize
  );

}


/* =========================================================
   GET ALL EPISODES FOR SEASON
========================================================= */

export async function listEpisodes(
  seasonId
) {

  const snapshot =
    await firestore()
      .collection("episodes")
      .where(
        "seasonId",
        "==",
        seasonId
      )
      .orderBy(
        "episodeNumber"
      )
      .get();


  return snapshot.docs.map(
    serialize
  );

}


/* =========================================================
   CREATE ANIME
========================================================= */

export async function createAnime({
  name,
  description
}) {

  const cleanName =
    String(name || "")
      .trim();


  if (!cleanName) {

    throw new Error(
      "Anime name is required."
    );

  }


  const existing =
    await findAnimeByName(
      cleanName
    );


  if (existing) {
    return existing;
  }


  const now =
    new Date().toISOString();


  const cleanDescription =
    String(
      description || ""
    ).trim();


  const ref =
    await firestore()
      .collection("anime")
      .add({

        name:
          cleanName,

        nameLower:
          cleanName.toLowerCase(),

        description:
          cleanDescription,

        createdAt:
          now,

        updatedAt:
          now

      });


  return {

    id:
      ref.id,

    name:
      cleanName,

    nameLower:
      cleanName.toLowerCase(),

    description:
      cleanDescription,

    createdAt:
      now,

    updatedAt:
      now

  };

}


/* =========================================================
   UPDATE ANIME
========================================================= */

export async function updateAnime(
  id,
  {
    name,
    description
  }
) {

  const ref =
    firestore()
      .collection("anime")
      .doc(id);


  const doc =
    await ref.get();


  if (!doc.exists) {

    throw new Error(
      "Anime not found."
    );

  }


  const cleanName =
    String(name || "")
      .trim();


  if (!cleanName) {

    throw new Error(
      "Anime name is required."
    );

  }


  const existing =
    await findAnimeByName(
      cleanName
    );


  if (
    existing &&
    existing.id !== id
  ) {

    throw new Error(
      "Another anime with this name already exists."
    );

  }


  const now =
    new Date().toISOString();


  const updates = {

    name:
      cleanName,

    nameLower:
      cleanName.toLowerCase(),

    description:
      String(
        description || ""
      ).trim(),

    updatedAt:
      now

  };


  await ref.update(
    updates
  );


  return {

    id,

    ...doc.data(),

    ...updates

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
        Number(
          seasonNumber
        )
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
    Number(
      seasonNumber
    );


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

    id:
      ref.id,

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
   UPDATE SEASON
========================================================= */

export async function updateSeason(
  id,
  seasonNumber
) {

  const number =
    Number(
      seasonNumber
    );


  if (
    !Number.isInteger(number) ||
    number < 1
  ) {

    throw new Error(
      "Season number must be a positive integer."
    );

  }


  const ref =
    firestore()
      .collection("seasons")
      .doc(id);


  const doc =
    await ref.get();


  if (!doc.exists) {

    throw new Error(
      "Season not found."
    );

  }


  const data =
    doc.data();


  const existing =
    await findSeason(
      data.animeId,
      number
    );


  if (
    existing &&
    existing.id !== id
  ) {

    throw new Error(
      `Season ${number} already exists for this anime.`
    );

  }


  const now =
    new Date().toISOString();


  await ref.update({

    seasonNumber:
      number,

    updatedAt:
      now

  });


  return {

    id,

    ...data,

    seasonNumber:
      number,

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
        Number(
          episodeNumber
        )
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
    Number(
      data.episodeNumber
    );


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


  const episodeData = {

    animeId:
      data.animeId,

    seasonId:
      data.seasonId,

    episodeNumber,

    title:
      String(
        data.title || ""
      ).trim(),

    description:
      String(
        data.description || ""
      ).trim(),

    language:
      String(
        data.language || ""
      ).trim(),

    duration:
      String(
        data.duration || ""
      ).trim(),

    fileName:
      String(
        data.fileName || ""
      ).trim(),

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


  const ref =
    await firestore()
      .collection("episodes")
      .add(
        episodeData
      );


  return {

    id:
      ref.id,

    ...episodeData

  };

}


/* =========================================================
   UPDATE EPISODE
========================================================= */

export async function updateEpisode(
  id,
  data
) {

  const ref =
    firestore()
      .collection("episodes")
      .doc(id);


  const doc =
    await ref.get();


  if (!doc.exists) {

    throw new Error(
      "Episode not found."
    );

  }


  const oldData =
    doc.data();


  const episodeNumber =
    Number(
      data.episodeNumber ??
      oldData.episodeNumber
    );


  if (
    !Number.isInteger(
      episodeNumber
    ) ||
    episodeNumber < 1
  ) {

    throw new Error(
      "Episode number must be a positive integer."
    );

  }


  const existing =
    await findEpisode(
      oldData.seasonId,
      episodeNumber
    );


  if (
    existing &&
    existing.id !== id
  ) {

    throw new Error(
      `Episode ${episodeNumber} already exists in this season.`
    );

  }


  const now =
    new Date().toISOString();


  const updates = {

    episodeNumber,

    title:
      String(
        data.title ??
        oldData.title ??
        ""
      ).trim(),

    description:
      String(
        data.description ??
        oldData.description ??
        ""
      ).trim(),

    language:
      String(
        data.language ??
        oldData.language ??
        ""
      ).trim(),

    updatedAt:
      now

  };


  await ref.update(
    updates
  );


  return {

    id,

    ...oldData,

    ...updates

  };

}


/* =========================================================
   DELETE EPISODE
========================================================= */

export async function deleteEpisode(
  id
) {

  const ref =
    firestore()
      .collection("episodes")
      .doc(id);


  const doc =
    await ref.get();


  if (!doc.exists) {

    throw new Error(
      "Episode not found."
    );

  }


  const episode =
    serialize(doc);


  await ref.delete();


  return episode;

}

/* =========================================================
   DELETE EPISODE
========================================================= */

export async function deleteEpisode(id) {

  if (!id) {
    throw new Error('Episode ID is required.');
  }

  const ref =
    firestore()
      .collection('episodes')
      .doc(id);

  const doc =
    await ref.get();

  if (!doc.exists) {
    throw new Error('Episode not found.');
  }

  const episode =
    serialize(doc);

  await ref.delete();

  return episode;
}