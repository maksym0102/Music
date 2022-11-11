/* eslint-disable no-restricted-syntax, no-await-in-loop, no-unused-expressions */
import { remote, ipcRenderer } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import axios from 'axios';
import * as mm from 'music-metadata';

import { SyncTables } from './firestore_sync';
import updateAlbum from './updateAlbum';

const { app } = remote;

interface Config {
  napsterKey: string;
  folderStored: string;
}

const getSongDetails = async (title: string, config: Config): Promise<SongData | null> => {
  try {
    const response = await axios.get('https://api.napster.com/v2.2/search', {
      params: {
        apikey: config.napsterKey,
        type: 'track',
        per_type_limit: 1, // eslint-disable-line @typescript-eslint/camelcase
        query: title,
      },
    });
    if (response.status !== 200) throw response.headers.status;

    const track = response.data.search.data.tracks[0];

    const filePath = path.join(config.folderStored, `${title}.mp3`);

    return {
      albumId: track.albumId,
      artist: track.artistName,
      title: track.name,
      length: Math.round(
        (await mm.parseFile(filePath)).format.duration ?? (track.playbackSeconds as number)
      ),
      thumbnail: `file://${path.join(
        app.getPath('userData'),
        'album_images',
        `${track.albumId}.jpg`
      )}`,
      filePath,
      liked: false,
      numListens: 0,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};

const getSongData = async (songTitles: string[], config: Config) => {
  const allSongs = await Promise.all(songTitles.map(title => getSongDetails(title, config)));

  return {
    failed: allSongs
      .map((song, index) => {
        if (song) return null;
        return songTitles[index];
      })
      .filter(value => value !== null) as string[],
    songs: allSongs.filter(value => value !== null) as SongData[],
  };
};

export const addSongRange = async (songTitles: string[], config: Config) => {
  const { songs, failed } = await getSongData(songTitles, config);

  const { songs: retry, failed: unavailable } = await getSongData(failed, config);

  songs.push(...retry);

  if (unavailable.length) console.error(unavailable.length, 'songs unavailable: ', { unavailable });

  for (const song of songs) {
    await ipcRenderer.invoke('download:image', song.albumId);

    await updateAlbum(song.albumId, config.napsterKey);
    await window.db.insertSong(song);
    window.syncDB?.insertSong(song);
  }
};

export const delSongRange = async (songsTitles: string[]) => {
  for (const title of songsTitles) {
    await window.db.deleteSong(title);
    window.syncDB?.delete(SyncTables.Songs, title);
  }
};

export const checkMusicDir = async (folderStored: string) => {
  const songsDb = (await window.db.getSongs()).map(s => s.title);
  const songsLs = (await fs.readdir(folderStored))
    .filter(name => path.extname(name) === '.mp3')
    .map(name => name.slice(0, name.length - 4));

  songsDb.sort();
  songsLs.sort();

  const toAdd: string[] = [];
  const toDel: string[] = [];

  let i = 0;
  let j = 0;

  while (i < songsDb.length && j < songsLs.length) {
    if (songsDb[i] === songsLs[j]) {
      i++;
      j++;
    } else if (songsDb[i] < songsLs[j]) {
      toDel.push(songsDb[i]);
      i++;
    } else {
      toAdd.push(songsLs[j]);
      j++;
    }
  }

  toDel.push(...songsDb.slice(i));
  toAdd.push(...songsLs.slice(j));

  return { toAdd, toDel };
};

const performChecks = async (config: Config) => {
  const { toAdd, toDel } = await checkMusicDir(config.folderStored);

  await addSongRange(toAdd, config);
  await delSongRange(toDel);

  window.db.cleanup();
};

export default performChecks;
