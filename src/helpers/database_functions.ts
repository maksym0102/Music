import { remote } from 'electron';
import sqlite3 from 'sqlite3';
import * as path from 'path';
import { open, Database } from 'sqlite';

export enum Tables {
  Songs = 'songdata',
  Albums = 'albumdata',
  CustomAlbums = 'customalbums',
}

const { app } = remote;

export const stringifyArr = (arr: any[]) => JSON.stringify(arr).slice(1, -1);

export const parseArr = (arr: string) => JSON.parse(`[${arr}]`);

type Count = { cnt: number };

class DatabaseFunctions {
  // _db is not initialised in the contructor, but in _init()
  // which is called within the contructor
  // @ts-ignore
  private _db: Database<sqlite3.Database, sqlite3.Statement>;

  ready = false;

  promises: (() => void)[] = [];

  constructor() {
    this.ready = false;
    this.promises = [];
    this._init();
  }

  private async _init() {
    const dbPath = path.join(app.getPath('userData'), 'song_info.db');

    this._db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await Promise.all([
      this._db.run(
        `CREATE TABLE IF NOT EXISTS ${Tables.Songs} (
          filePath TEXT,
          title TEXT,
          thumbnail TEXT,
          artist TEXT,
          length INT,
          numListens INT,
          liked BOOLEAN,
          albumId TEXT
        )`
      ),
      this._db.run(
        `CREATE TABLE IF NOT EXISTS ${Tables.Albums} (
          id TEXT,
          imagePath TEXT,
          name TEXT,
          numSongs INT,
          artist TEXT
        )`
      ),
      this._db.run(
        `CREATE TABLE IF NOT EXISTS ${Tables.CustomAlbums} (
          id TEXT,
          name TEXT,
          songs TEXT
        )`
      ),
    ]);

    this.ready = true;
    this.promises.forEach(res => res());
  }

  isReady() {
    return new Promise(res => {
      if (this.ready) {
        res();
      } else {
        this.promises.push(res);
      }
    });
  }

  async getNumLiked() {
    await this.isReady();

    return (
      (await this._db.get<Count>(`SELECT COUNT(*) AS cnt FROM ${Tables.Songs} WHERE liked`)) ?? {
        cst: 0,
      }
    ).cnt;
  }

  async getTop(): Promise<{ songs: SongData[]; albums: AlbumData[] }> {
    await this.isReady();

    return {
      songs: (
        await this._db.all<DBSongData[]>(
          `SELECT * FROM ${Tables.Songs} ORDER BY NOT liked, numListens DESC LIMIT 5`
        )
      ).map(s => ({
        ...s,
        liked: s.liked === 1,
      })),
      albums: await this._db.all<AlbumData[]>(
        `SELECT * FROM ${Tables.Albums} ORDER BY numSongs DESC LIMIT 5`
      ),
    };
  }

  async getTopSongs(): Promise<SongData[]> {
    await this.isReady();

    return (
      await this._db.all<DBSongData[]>(
        `SELECT * FROM ${Tables.Songs} ORDER BY NOT liked, numListens DESC`
      )
    ).map(s => ({
      ...s,
      liked: s.liked === 1,
    }));
  }

  async getSongs(where?: string, whereArgs: any[] = []): Promise<SongData[]> {
    await this.isReady();

    return (
      await this._db.all<DBSongData[]>(
        `SELECT * FROM ${Tables.Songs} ${
          where ? `${where ? `WHERE ${where}` : ''}` : ''
        } ORDER BY LOWER(title), title`,
        ...whereArgs
      )
    ).map(s => ({
      ...s,
      liked: s.liked === 1,
    }));
  }

  async getAlbums(where?: string, whereArgs: any[] = []) {
    await this.isReady();

    return this._db.all<AlbumData[]>(
      `SELECT * FROM ${Tables.Albums} ${where ? `WHERE ${where}` : ''} ORDER BY LOWER(name), name`,
      ...whereArgs
    );
  }

  async getCustomAlbums(where?: string, whereArgs: any[] = []): Promise<CustomAlbumData[]> {
    await this.isReady();

    return (
      await this._db.all<DBCustomAlbumData[]>(
        `SELECT * FROM ${Tables.CustomAlbums}
        ${where ? `WHERE ${where}` : ''}
        ORDER BY LOWER(name), name`,
        ...whereArgs
      )
    ).map(a => ({ ...a, songs: parseArr(a.songs) }));
  }

  async getNumSongs(albumId: string) {
    await this.isReady();

    return (
      (await this._db.get<{ cnt: number }>(
        `SELECT COUNT(*) AS cnt FROM ${Tables.Songs} WHERE albumId LIKE ?`,
        [albumId]
      )) ?? { cnt: 0 }
    ).cnt;
  }

  async getArtists(): Promise<ArtistData[]> {
    await this.isReady();

    const preSongs = await this._db.all<{ name: string; numSongs: number }[]>(
      `SELECT artist as name, COUNT(*) as numSongs FROM ${Tables.Songs} GROUP BY artist`
    );

    const artists = await Promise.all(
      preSongs.map(async preSong => {
        const images = await this._db.all<{ imagePath: string }[]>(
          `SELECT imagePath FROM ${Tables.Albums} WHERE artist LIKE ? ORDER BY numSongs DESC LIMIT 4`,
          preSong.name
        );

        return {
          ...preSong,
          images: images.length === 4 ? images.map(i => i.imagePath) : [images[0].imagePath],
        };
      })
    );

    return artists;
  }

  async insert(table: Tables, data: obj) {
    await this.isReady();

    const values = Object.values(data);

    const keys = `(${Object.keys(data).join(',')})`;
    const questionMarks = `(${new Array(values.length).fill('?').join(',')})`;

    await this._db.run(`INSERT INTO ${table} ${keys} VALUES ${questionMarks}`, ...values);
  }

  async insertSong(song: SongData) {
    return this.insert(Tables.Songs, song);
  }

  async insertAlbum(album: AlbumData) {
    return this.insert(Tables.Albums, album);
  }

  async insertCustomAlbum(customAlbum: CustomAlbumData) {
    return this.insert(Tables.CustomAlbums, {
      ...customAlbum,
      songs: stringifyArr(customAlbum.songs),
    });
  }

  async delete(table: Tables, where?: string, whereArgs: any[] = []) {
    await this.isReady();

    return (
      await this._db.run(`DELETE FROM ${table} ${where ? `WHERE ${where}` : ''}`, ...whereArgs)
    ).changes;
  }

  async deleteSong(title: string) {
    await this.isReady();

    return this.delete(Tables.Songs, 'title LIKE ?', [title]);
  }

  async deleteAlbum(id: string) {
    await this.isReady();

    return this.delete(Tables.Albums, 'id LIKE ?', [id]);
  }

  async deleteEmptyAlbums() {
    await this.isReady();

    return this.delete(Tables.Albums, 'numSongs < 1');
  }

  async deleteCustomAlbum(id: string) {
    await this.isReady();

    return this.delete(Tables.CustomAlbums, 'id LIKE ?', [id]);
  }

  async update(table: Tables, values: obj, where?: string, whereArgs: any[] = []) {
    await this.isReady();

    const keys = `${Object.keys(values).join(' = ?,')} = ?`;

    return (
      await this._db.run(
        `UPDATE ${table} SET ${keys} ${where ? `WHERE ${where}` : ''}`,
        ...Object.values(values),
        ...whereArgs
      )
    ).changes;
  }

  async updateSong(song: Partial<SongData>) {
    return this.update(Tables.Songs, song, 'title LIKE ?', [song.title]);
  }

  async updateAlbum(album: Partial<AlbumData>) {
    return this.update(Tables.Albums, album, 'id LIKE ?', [album.id]);
  }

  async updateCustomAlbum(album: Partial<CustomAlbumData>) {
    let data: Partial<DBCustomAlbumData>;

    if (album.songs) {
      data = {
        ...album,
        songs: stringifyArr(album.songs),
      };
    } else {
      data = album as AlbumBaseData;
    }

    return this.update(Tables.CustomAlbums, data, 'id LIKE ?', [album.id]);
  }

  async incrementNumListens(song: SongData) {
    await this.isReady();

    return (
      await this._db.run(
        `UPDATE ${Tables.Songs} SET numListens = numListens + 1 WHERE title LIKE ?`,
        song.title
      )
    ).changes;
  }

  async nextCustomAlbumId() {
    await this.isReady();

    const album = await this._db.get<DBCustomAlbumData>(
      `SELECT * FROM ${Tables.CustomAlbums} ORDER BY id DESC`
    );

    let num = 0;

    if (album !== undefined) {
      num = parseInt(album.id.substring(4), 10) + 1;
    }
    return `cst.${num}`;
  }

  async cleanup() {
    await this.isReady();

    const data = await this._db.all<{ cnt: number; id: string }[]>(
      `SELECT COUNT(*) as cnt, albumId as id FROM ${Tables.Songs} GROUP BY albumId;`
    );

    // Update numSongs to be correct
    Promise.all(
      data.map(async element => {
        await this.update(Tables.Albums, { numSongs: element.cnt }, 'id LIKE ?', [element.id]);
      })
    );

    const albumIds = stringifyArr(data.map(e => e.id));

    // Delete albums which do not appear in songdata
    await this.delete(Tables.Albums, `id NOT IN (${albumIds})`);
  }
}

export default DatabaseFunctions;
