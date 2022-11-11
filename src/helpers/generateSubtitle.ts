interface Options {
  type: string;
  numSongs?: number;
  artist?: string;
}

const generateSubtitle = ({ type, numSongs, artist }: Options) => {
  if (numSongs !== undefined) {
    return `${type} · ${numSongs} ${numSongs === 1 ? 'song' : 'songs'}`;
  } if (artist !== undefined) {
    return `${type} · ${artist}`;
  }

  return type;
};

export default generateSubtitle;
