import Vue, { VNode } from 'vue';
import DatabaseFunctions from './helpers/database_functions';
import FirestoreSync from './helpers/firestore_sync';

declare global {
  namespace JSX {
    // tslint:disable no-empty-interface
    interface Element extends VNode {}
    // tslint:disable no-empty-interface
    interface ElementClass extends Vue {}
    interface IntrinsicElements {
      [elem: string]: any;
    }
  }

  interface Window {
    db: DatabaseFunctions;
    syncDB?: FirestoreSync;
  }

  type obj = {
    [key: string]: any;
  };

  type NapsterSongData = {
    title: string;
    artist: string;
    length: number;
    albumId: string;
    thumbnail: string;
  };

  type SongData = {
    filePath: string;
    title: string;
    thumbnail: string;
    artist: string;
    length: number;
    numListens: number;
    albumId: string;
    liked: boolean;
  };

  type DBSongData = {
    filePath: string;
    title: string;
    thumbnail: string;
    artist: string;
    length: number;
    numListens: number;
    albumId: string;
    liked: 1 | 0;
  };

  type FirestoreSongData = {
    albumId: string;
    artist: string;
    title: string;
    liked: boolean;
    numListens: number;
    length: number;
    youtubeId: string;
  };

  type AlbumBaseData = {
    id: string;
    name: string;
  };

  type AlbumData = AlbumBaseData & {
    imagePath: string;
    numSongs: number;
    artist: string;
  };

  type FirestoreAlbumData = AlbumBaseData & {
    numSongs: number;
    artist: string;
  };

  type CustomAlbumData = AlbumBaseData & {
    songs: string[];
  };

  type FirestoreCustomAlbumData = CustomAlbumData;

  type DBCustomAlbumData = AlbumBaseData & {
    songs: string;
  };

  type ArtistData = {
    name: string;
    images: string[];
    numSongs: number;
  };

  type DownloadProgress = {
    timestamp: number;
    total: number;
    percent: number;
    albumId: string;
    title: string;
    artist: string;
  };

  type Enqueue = (data: { songs: SongData[]; shuffle?: boolean }) => void;

  type ContextMenuItem = {
    icon:
      | 'heart-icon'
      | 'heart-outline-icon'
      | 'play-icon'
      | 'playlist-play-icon'
      | 'playlist-plus-icon'
      | 'delete-icon';
    title: string;
    handler: string;
    colour?: string;
  };
}
