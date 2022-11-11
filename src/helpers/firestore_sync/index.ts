/* eslint-disable no-await-in-loop, no-restricted-syntax */
import { ipcRenderer, remote } from 'electron';
import { isDeepStrictEqual, promisify } from 'util';
import { promises as fs, exists } from 'fs';
import path from 'path';
import firebase from 'firebase/app';
import 'firebase/firestore';

import { Tables } from '../database_functions';
import * as translator from './translator';
import * as _ from './sync_status';

const { app } = remote;

type VoidCallback = (() => void) | undefined;
type StatusUpdateCallback = ((status: _.SyncStatus) => void) | undefined;

export interface FirestoreKeys {
  appId: string;
  apiKey: string;
  projectId: string;
}

const cleanSong = (map: FirestoreSongData) => ({
  title: map.title,
  albumId: map.albumId,
  artist: map.artist,
  liked: map.liked,
  numListens: map.numListens,
  thumbnail: `file://${path.join(app.getPath('userData'), 'album_images', `${map.albumId}.jpg`)}`,
});

export enum SyncTables {
  Songs = 'songs',
  Albums = 'albums',
  CustomAlbums = 'customalbums',
}

class FirestoreSync {
  firestore: firebase.firestore.Firestore;

  app: firebase.app.App;

  onUpdate: VoidCallback;

  onStatusUpdate: StatusUpdateCallback;

  private _numFailed = 0;

  constructor(keys: FirestoreKeys) {
    this.app = firebase.initializeApp({
      appId: keys.appId,
      apiKey: keys.apiKey,
      projectId: keys.projectId,
      databaseURL: `https://${keys.projectId}.firebaseio.com`,
    });

    this.firestore = this.app.firestore();

    console.log('Connected to Firestore');
  }

  async init() {
    ipcRenderer.on('firestore-download:progress', (evt, progress: DownloadProgress) => {
      this._dispatch(new _.SyncSongsProgress(progress, this._numFailed));
    });

    console.log('Listening for updates');
    this.firestore.collection(SyncTables.Songs).onSnapshot(this._songHandler.bind(this));
    this.firestore.collection(SyncTables.Albums).onSnapshot(this._albumHandler.bind(this));
    this.firestore
      .collection(SyncTables.CustomAlbums)
      .onSnapshot(this._customAlbumHandler.bind(this));

    this._dispatch(new _.SyncSongsInitial());
    console.log('Starting songs');
    await this._initSongs();
    console.log('Finished songs');
    this._dispatch(new _.SyncAlbumsInitial());
    console.log('Starting albums');
    await this._initAlbums();
    console.log('Finished albums');
    this._dispatch(new _.SyncCustomAlbumsInitial());
    console.log('Starting customalbums');
    await this._initCustomAlbums();
    console.log('Finished customalbums');

    this._dispatch(new _.SyncCleaningUp());
    window.db.cleanup();
    this._dispatch(new _.SyncComplete());

    if (this.onUpdate) this.onUpdate();
  }

  private _dispatch(status: _.SyncStatus) {
    if (this.onStatusUpdate) {
      this.onStatusUpdate(status);
    }
  }

  update(table: SyncTables, id: string, data: obj) {
    return this.firestore
      .collection(table)
      .doc(id)
      .update(data);
  }

  insert(table: SyncTables, id: string, data: obj) {
    return this.firestore
      .collection(table)
      .doc(id)
      .set(data);
  }

  insertSong(song: SongData, youtubeId = '') {
    return this.insert(SyncTables.Songs, song.title, translator.songToFirestore(song, youtubeId));
  }

  insertAlbum(album: AlbumData) {
    return this.insert(SyncTables.Albums, album.id, translator.albumToFirestore(album));
  }

  insertCustomAlbum(album: CustomAlbumData) {
    return this.insert(SyncTables.CustomAlbums, album.id, album);
  }

  delete(table: SyncTables, id: string) {
    return this.firestore
      .collection(table)
      .doc(id)
      .delete();
  }

  async deleteEmptyAlbums() {
    const { docs } = await this.firestore
      .collection(SyncTables.Albums)
      .where('numSongs', '<', 1)
      .get();
    await Promise.all(docs.map(d => d.ref.delete()));
  }

  async incrementNumListens(song: SongData) {
    await this.firestore
      .collection(SyncTables.Songs)
      .doc(song.title)
      .update({
        numListens: firebase.firestore.FieldValue.increment(1),
      });
  }

  private _getId(map: obj) {
    return map.id ?? map.title;
  }

  private _needsUpdate(local: obj, online: obj, table: SyncTables) {
    switch (table) {
      case SyncTables.Albums:
        return (
          local.artist !== online.artist ||
          local.id !== online.id ||
          local.name !== online.name ||
          local.numSongs !== online.numSongs
        );
        break;
      case SyncTables.CustomAlbums:
        return (
          local.id !== online.id ||
          local.name !== online.name ||
          !isDeepStrictEqual(local.songs, online.songs)
        );
      case SyncTables.Songs:
        return (
          local.albumId !== online.albumId ||
          local.artist !== online.artist ||
          local.liked !== online.liked ||
          local.numListens !== online.numListens ||
          local.title !== online.title
        );
      default:
        return false;
    }
  }

  private _diff(local: obj[], online: obj[], table: SyncTables) {
    const toAdd: number[] = [];
    const toDelete: number[] = [];
    const toUpdate: number[] = [];

    let i = 0;
    let j = 0;

    while (i < local.length && j < online.length) {
      const lId = this._getId(local[i]);
      const oId = this._getId(online[j]);

      if (lId === oId) {
        if (this._needsUpdate(local[i], online[j], table)) {
          toUpdate.push(j);
        }
        i++;
        j++;
      } else if (lId < oId) {
        toDelete.push(i);
        i++;
      } else {
        toAdd.push(j);
        j++;
      }
    }

    for (; i < local.length; i++) {
      toDelete.push(i);
    }

    for (; j < online.length; j++) {
      toAdd.push(j);
    }

    console.log(`${toAdd.length}, ${toDelete.length}, ${toUpdate.length}`);

    return { toAdd, toDelete, toUpdate };
  }

  private async _addSong(firestoreSong: FirestoreSongData) {
    try {
      console.log('Downloading', firestoreSong.title);

      await ipcRenderer.invoke('download:image', firestoreSong.albumId);

      const { duration, path: filePath } = await ipcRenderer.invoke(
        'firestore-download:song',
        firestoreSong
      );

      const song = translator.songFromFirestore(firestoreSong, filePath, duration);

      console.log('Downloaded', song.title);

      await window.db.insertSong(song);

      return true;
    } catch (e) {
      console.log(`Failed ${firestoreSong.title}; id: ${firestoreSong.youtubeId}`);
      console.log(e);
      this._numFailed++;
      return false;
    }
  }

  private async _deleteSong(title: string, path: string) {
    await Promise.all([
      window.db.deleteSong(title),
      promisify(exists)(path).then(exists => (exists ? fs.unlink(path) : Promise.resolve())),
    ]);
  }

  private async _initSongs() {
    const snapshot = await this.firestore.collection(SyncTables.Songs).get();

    const dbSongs = await window.db.getSongs();
    const firestoreSongs = snapshot.docs.map(d => d.data() as FirestoreSongData);

    dbSongs.sort((a, b) => (a.title < b.title ? -1 : 1));
    firestoreSongs.sort((a, b) => (a.title < b.title ? -1 : 1));

    const { toAdd, toDelete, toUpdate } = this._diff(dbSongs, firestoreSongs, SyncTables.Songs);

    const failed: number[] = [];

    for (const idx of toAdd) {
      this._dispatch(new _.SyncSongsName(firestoreSongs[idx].title, false, this._numFailed));
      const success = await this._addSong(firestoreSongs[idx]);
      if (!success) failed.push(idx);
    }
    for (const idx of toDelete) {
      this._dispatch(new _.SyncSongsName(dbSongs[idx].title, true, this._numFailed));
      await this._deleteSong(dbSongs[idx].title, dbSongs[idx].filePath);
    }
    for (const idx of toUpdate) {
      const song = firestoreSongs[idx];
      await window.db.update(Tables.Songs, cleanSong(song), 'title LIKE ?', [song.title]);
    }

    this._dispatch(new _.SyncSongsFailed(this._numFailed));

    this._numFailed = failed.length;

    for (const idx of failed) {
      this._numFailed--;
      this._dispatch(new _.SyncSongsName(firestoreSongs[idx].title, false, this._numFailed));
      await this._addSong(firestoreSongs[idx]);
    }
  }

  private async _songHandler(
    snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
  ) {
    const docChanges = snapshot.docChanges();

    if (!snapshot.metadata.hasPendingWrites && snapshot.docs.length !== docChanges.length) {
      for (const change of docChanges) {
        switch (change.type) {
          case 'added':
            await this._addSong(change.doc.data() as FirestoreSongData);
            break;
          case 'modified':
            await window.db.updateSong(cleanSong(change.doc.data() as FirestoreSongData));
            break;
          case 'removed':
            await this._deleteSong(
              change.doc.id,
              path.join(await ipcRenderer.invoke('get:music-dir'), `${change.doc.id}.mp3`)
            );
            break;
          default:
            break;
        }
      }
    }

    if (this.onUpdate) this.onUpdate();
  }

  private async _addAlbum(firestoreAlbum: FirestoreAlbumData) {
    const album = translator.albumFromFirestore(firestoreAlbum);

    console.log(`Adding album ${album.name}`);

    await Promise.all([
      ipcRenderer.invoke('download:image', album.id),
      window.db.insertAlbum(album),
    ]);
  }

  private async _initAlbums() {
    const snapshot = await this.firestore.collection(SyncTables.Albums).get();

    const dbAlbums = await window.db.getAlbums();
    const firestoreAlbums = snapshot.docs.map(d => d.data() as FirestoreAlbumData);

    dbAlbums.sort((a, b) => (a.id < b.id ? -1 : 1));
    firestoreAlbums.sort((a, b) => (a.id < b.id ? -1 : 1));

    const { toAdd, toDelete, toUpdate } = this._diff(dbAlbums, firestoreAlbums, SyncTables.Albums);

    await Promise.all(
      toAdd.map(idx => {
        this._dispatch(new _.SyncAlbumsName(firestoreAlbums[idx].name));
        return this._addAlbum(firestoreAlbums[idx]);
      })
    );
    await Promise.all(toDelete.map(idx => window.db.deleteAlbum(dbAlbums[idx].id)));
    await Promise.all(
      toUpdate.map(idx => {
        const album = firestoreAlbums[idx];
        return window.db.update(Tables.Albums, album, 'id LIKE ?', [album.id]);
      })
    );
  }

  private async _albumHandler(
    snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
  ) {
    const docChanges = snapshot.docChanges();
    if (!snapshot.metadata.hasPendingWrites && snapshot.docs.length !== docChanges.length) {
      for (const change of docChanges) {
        switch (change.type) {
          case 'added':
            await this._addAlbum(change.doc.data() as FirestoreAlbumData);
            break;
          case 'modified':
            await window.db.update(Tables.Albums, change.doc.data(), 'id LIKE ?', [change.doc.id]);
            break;
          case 'removed':
            await window.db.deleteAlbum(change.doc.id);
            break;
          default:
            break;
        }
      }
    }

    if (this.onUpdate) this.onUpdate();
  }

  private async _initCustomAlbums() {
    const snapshot = await this.firestore.collection(SyncTables.CustomAlbums).get();

    const dbAlbums = await window.db.getCustomAlbums();
    const firestoreAlbums = snapshot.docs.map(d => d.data() as FirestoreCustomAlbumData);

    dbAlbums.sort((a, b) => (a.id < b.id ? -1 : 1));
    firestoreAlbums.sort((a, b) => (a.id < b.id ? -1 : 1));

    const { toAdd, toDelete, toUpdate } = this._diff(
      dbAlbums,
      firestoreAlbums,
      SyncTables.CustomAlbums
    );

    await Promise.all(
      toAdd.map(idx => {
        const { name } = firestoreAlbums[idx];
        this._dispatch(new _.SyncCustomAlbumsName(name));
        return window.db.insertCustomAlbum(firestoreAlbums[idx]);
      })
    );
    await Promise.all(toDelete.map(idx => window.db.deleteCustomAlbum(dbAlbums[idx].id)));
    await Promise.all(toUpdate.map(idx => window.db.updateCustomAlbum(firestoreAlbums[idx])));
  }

  private async _customAlbumHandler(
    snapshot: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>
  ) {
    const docChanges = snapshot.docChanges();
    if (!snapshot.metadata.hasPendingWrites && snapshot.docs.length !== docChanges.length) {
      for (const change of docChanges) {
        switch (change.type) {
          case 'added':
            await window.db.insertCustomAlbum(change.doc.data() as FirestoreCustomAlbumData);
            break;
          case 'modified':
            await window.db.updateCustomAlbum(change.doc.data());
            break;
          case 'removed':
            await window.db.deleteCustomAlbum(change.doc.id);
            break;
          default:
            break;
        }
      }
    }
    if (this.onUpdate) this.onUpdate();
  }
}

export default FirestoreSync;
