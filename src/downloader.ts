import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import ytdl from 'ytdl-core';
import ytsr, { Video } from 'ytsr';
import ffmpeg from 'fluent-ffmpeg';

export const downloadImage = async (id: string) => {
  try {
    const downloadPath = path.join(app.getPath('userData'), 'album_images', `${id}.jpg`);

    if (fs.existsSync(downloadPath)) return null;

    const url = `https://api.napster.com/imageserver/v2/albums/${id}/images/500x500.jpg`;
    const writer = fs.createWriteStream(downloadPath);

    const response = await axios.get(url, { responseType: 'stream' });

    if (response.status !== 200) throw response.status;

    response.data.pipe(writer);

    return new Promise((res, rej) => {
      writer.on('finish', res);
      writer.on('error', rej);
    });
  } catch (err) {
    console.error(err);
    return null;
  }
};

type ProgressHandler = (progress: DownloadProgress, channel: string) => void;

interface YtData {
  title: string;
  artist: string;
  id: string;
  duration: number;
}

export class YtDownloader {
  _progressHandler: ProgressHandler | null = null;

  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  _parseLink(link: string) {
    return link
      .split('?')[1]
      .split('&')
      .filter(s => s.slice(0, 2) === 'v=')[0]
      .slice(2);
  }

  _parseDur(dur: string) {
    return Math.floor(
      dur
        .split(':')
        .map(parseFloat)
        .reverse()
        .reduce((sum, time, index) => sum + time * 60 ** index, 0)
    );
  }

  changeBasePath(path: string) {
    this.basePath = path;
  }

  onProgress(handler: ProgressHandler) {
    console.assert(typeof handler === 'function', 'onProgress callback must be a function');
    this._progressHandler = handler;
    return this;
  }

  async _getAudioUrl(videoId: string) {
    const info = await ytdl.getInfo(videoId, {
      quality: 'highestaudio',
      // typescript thinks there are missing properties on the object, but they are optional
      // @ts-ignore
      format: {
        hasAudio: true,
        hasVideo: false,
      },
    });

    const formats = ytdl
      .filterFormats(info.formats, 'audioonly')
      .filter(f => f.audioCodec === 'mp4a.40.2');

    if (formats.length) return formats[0].url;

    if (info.formats.length) return info.formats[0].url;

    return undefined;
  }

  async getYoutubeData(title: string, artist: string): Promise<YtData[]> {
    const filters = await ytsr.getFilters(`${title} by ${artist} Offical Music Video`);
    const filter = filters.get('Type').filter((f: any) => f.name === 'Video')[0];

    const results = await ytsr(null, { limit: 4, nextpageRef: filter.ref });

    return (results.items as Video[]).map((r: Video) => ({
      id: this._parseLink(r.link),
      duration: this._parseDur(r.duration ?? '0'),
      title,
      artist,
    }));
  }

  async downloadWithData(ytData: YtData[], albumId: string, path: string, channel: string) {
    let url: string | undefined;

    let i = 0;

    while (url === undefined && i < ytData.length) {
      url = await this._getAudioUrl(ytData[i].id); // eslint-disable-line no-await-in-loop
      i++;
    }
    i--;

    const data = ytData[i];

    return {
      ...data,
      albumId,
      path,
      download: new Promise((res, rej) => {
        ffmpeg(url)
          .noVideo()
          .audioCodec('libmp3lame')
          .saveToFile(path)
          .on('end', res)
          .on('error', rej)
          .on('progress', progress => {
            if (channel && this._progressHandler) {
              const timestamp = this._parseDur(progress.timemark);

              this._progressHandler(
                {
                  timestamp,
                  total: data.duration,
                  percent: timestamp / data.duration,
                  albumId,
                  title: data.title,
                  artist: data.artist,
                },
                channel
              );
            }
          });
      }),
    };
  }

  async download(title: string, artist: string, albumId: string, channel: string) {
    const ytData = await this.getYoutubeData(title, artist);
    return this.downloadWithData(
      ytData,
      albumId,
      path.join(this.basePath, `${title}.mp3`),
      channel
    );
  }
}
