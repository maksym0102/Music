/* eslint-disable no-unused-expressions */
import { app, BrowserWindow, ipcMain, globalShortcut } from 'electron';
import path from 'path';

import { YtDownloader, downloadImage } from './downloader';
import createMenu from './menu';

const isDevelopment = process.env.NODE_ENV !== 'production';

// Use correct data path
app.setPath('userData', path.join(app.getPath('appData'), 'Music'));
app.allowRendererProcessReuse = true;

const resources = process.env.WEBPACK_DEV_SERVER_URL
  ? path.join(app.getAppPath(), '../public')
  : __dirname;

let win: BrowserWindow | null = null;
let help: BrowserWindow | null = null;
let remote: BrowserWindow | null = null;
let downloader: YtDownloader;

const toggleHelp = () => {
  if (help === null) {
    help = new BrowserWindow({
      width: 1220,
      height: 830,
      icon: path.join(resources, 'logo.png'),
    });

    help.on('closed', () => {
      help = null;
    });

    help.loadURL(`file://${path.join(resources, 'help.html')}`);
  } else {
    help.close();
  }
};

const setUpRemote = (song: SongData) => {
  remote = new BrowserWindow({
    width: 500,
    height: 105,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      webSecurity: !isDevelopment,
    },
    icon: path.join(resources, 'logo.png'),
    frame: false,
  });

  remote.on('closed', () => {
    remote = null;
  });

  remote.loadURL(`file://${path.join(resources, 'remote.html')}`);

  ipcMain.on('remote-ready', () => {
    remote?.webContents.send('song-update', song);
  });
};

// Methods to handle the remote controller
ipcMain.on('toggle-remote', (evt, song: SongData) => {
  if (!song && remote) {
    remote.close();
  } else if (song && !remote) {
    setUpRemote(song);
  }
});

ipcMain.on('main-song-update', (evt, song: SongData) => {
  remote?.webContents.send('song-update', song);
});

ipcMain.on('main-play-pause', (evt, isPaused) => {
  remote?.webContents.send('song-pause-play', isPaused);
  win?.webContents.send('song-pause-play', isPaused);
});

ipcMain.on('remote-prev', () => {
  win?.webContents.send('prev-track', true);
});

ipcMain.on('remote-next', () => {
  win?.webContents.send('next-track');
});

ipcMain.on('remote-pause-play', () => {
  win?.webContents.send('pause-play');
});
function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    darkTheme: true,
    width: 1260,
    height: 875,
    icon: path.join(resources, 'logo.png'),
    title: 'Music',
    webPreferences: {
      // Use pluginOptions.nodeIntegration, leave this alone
      // See the link for more info
      // nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration
      nodeIntegration: (process.env.ELECTRON_NODE_INTEGRATION as unknown) as boolean,
      webSecurity: !isDevelopment,
    },
  });

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    // Load the index.html when not in development
    win.loadURL(`file://${__dirname}/index.html`);
  }

  createMenu(win, isDevelopment, toggleHelp);

  globalShortcut.register('MediaPlayPause', () => win?.webContents.send('pause-play', false));
  globalShortcut.register('MediaNextTrack', () => win?.webContents.send('next-track'));
  globalShortcut.register('MediaPreviousTrack', () => win?.webContents.send('prev-track'));
  globalShortcut.register('MediaStop', () => win?.webContents.send('stop-track'));

  win.on('closed', () => {
    win = null;
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer');

    // Install Vue Devtools
    try {
      await installExtension(VUEJS_DEVTOOLS);
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}

ipcMain.handle('get:music-dir', () => downloader.basePath);

ipcMain.handle('download:image', (_, albumId: string) => downloadImage(albumId));

ipcMain.handle('download:song', async (_, song: NapsterSongData) => {
  const details = await downloader.download(song.title, song.artist, song.albumId, 'download');
  await details.download;

  delete details.download;

  return details;
});

ipcMain.handle('firestore-download:song', async (_, song: FirestoreSongData) => {
  const { artist, title, albumId } = song;

  const ytData = await downloader.getYoutubeData(title, artist);

  if (song.youtubeId.length > 0) {
    ytData.unshift({
      artist,
      duration: song.length,
      id: song.youtubeId,
      title,
    });
  }

  const details = await downloader.downloadWithData(
    ytData,
    albumId,
    path.join(downloader.basePath, `${title}.mp3`),
    'firestore-download'
  );

  await details.download;

  delete details.download;

  return details;
});

ipcMain.on('download:init', (_, path: string) => {
  downloader = new YtDownloader(path);

  downloader.onProgress((progress, channel) => {
    // eslint-disable-next-line no-unused-expressions
    win?.webContents.send(`${channel}:progress`, progress);
  });
});

ipcMain.on('download:update-base-path', (_, path: string) => {
  downloader.changeBasePath(path);
});
