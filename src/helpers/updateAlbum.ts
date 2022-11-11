/* eslint-disable no-unused-expressions */
import { remote } from 'electron';
import path from 'path';
import axios from 'axios';

import { SyncTables } from '@/helpers/firestore_sync';

const { app } = remote;

const getAlbumInfo = async (
  albumId: string,
  napsterKey: string
): Promise<{ id: string; name: string; artist: string }> => {
  try {
    const response = await axios.get(`https://api.napster.com/v2.2/albums/${albumId}`, {
      params: {
        apikey: napsterKey,
      },
    });

    if (response.status !== 200) throw response.headers.status;

    const { id, name, artistName: artist } = response.data.albums[0];

    return { id, name, artist };
  } catch (error) {
    console.error(error);
    return {
      id: '',
      name: '',
      artist: '',
    };
  }
};

const updateAlbum = async (albumId: string, napsterKey: string) => {
  const imagePath = `file://${path.join(
    app.getPath('userData'),
    'album_images',
    `${albumId}.jpg`
  )}`;

  let numSongs = await window.db.getNumSongs(albumId);

  if (numSongs++ > 0) {
    await window.db.updateAlbum({
      id: albumId,
      numSongs,
    });
    window.syncDB?.update(SyncTables.Albums, albumId, {
      id: albumId,
      numSongs,
    });

    return;
  }

  const { id, name, artist } = await getAlbumInfo(albumId, napsterKey);

  if (albumId !== id) {
    throw new Error(`Failed album ${albumId}`);
  }

  console.log(`Adding album ${name}.`);

  const album: AlbumData = {
    id,
    name,
    imagePath,
    numSongs,
    artist,
  };

  window.db.insertAlbum(album);
  window.syncDB?.insertAlbum(album);
};

export default updateAlbum;
