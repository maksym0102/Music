import path from 'path';
import { remote } from 'electron';

const { app } = remote;

export const songToFirestore = (
  { albumId, artist, length, liked, numListens, title }: SongData,
  youtubeId = ''
): FirestoreSongData => ({
  albumId,
  artist,
  length,
  liked,
  numListens,
  title,
  youtubeId,
});

export const songFromFirestore = (
  { albumId, artist, liked, numListens, title }: FirestoreSongData,
  filePath: string,
  length: number
): SongData => ({
  albumId,
  artist,
  length,
  liked,
  numListens,
  title,
  filePath,
  thumbnail: `file://${path.join(app.getPath('userData'), 'album_images', `${albumId}.jpg`)}`,
});

export const albumToFirestore = ({
  artist,
  id,
  name,
  numSongs,
}: AlbumData): FirestoreAlbumData => ({
  artist,
  id,
  name,
  numSongs,
});

export const albumFromFirestore = ({
  artist,
  id,
  name,
  numSongs,
}: FirestoreAlbumData): AlbumData => ({
  artist,
  id,
  name,
  numSongs,
  imagePath: `file://${path.join(app.getPath('userData'), 'album_images', `${id}.jpg`)}`,
});
