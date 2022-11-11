import { app, Menu, MenuItemConstructorOptions, BrowserWindow } from 'electron';

const createMenu = (win: BrowserWindow, dev: boolean, toggleHelp: () => void) => {
  const isMac = process.platform === 'darwin';

  const viewSubmenu: MenuItemConstructorOptions[] = [
    { role: 'toggleDevTools' },
    { type: 'separator' },
    { role: 'resetZoom' },
    { role: 'zoomIn' },
    { role: 'zoomOut' },
    { type: 'separator' },
    { role: 'togglefullscreen' },
  ];

  if (dev) {
    viewSubmenu.unshift({ role: 'reload' }, { role: 'forceReload' });
  }

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'close' }, { role: 'quit' }],
    },
    {
      label: 'Controls',
      submenu: [
        {
          label: 'Pause/Play',
          click: () => win.webContents.send('pause-play', false),
        },
        {
          label: 'Previous Track',
          click: () => win.webContents.send('prev-track'),
          accelerator: 'CmdOrCtrl+Left',
        },
        {
          label: 'Next Track',
          click: () => win.webContents.send('next-track'),
          accelerator: 'CmdOrCtrl+Right',
        },
        { type: 'separator' },
        {
          label: 'Increase Volume',
          click: () => win.webContents.send('volume++'),
          accelerator: 'Up',
        },
        {
          label: 'Decrease Volume',
          click: () => win.webContents.send('volume--'),
          accelerator: 'Down',
        },
        { type: 'separator' },
        {
          label: 'Shuffle Songs',
          click: () => win.webContents.send('shuffle-songs'),
          accelerator: 's',
        },
        {
          label: 'Loop Current Song',
          click: () => win.webContents.send('loop-song'),
          accelerator: 'l',
        },
        { type: 'separator' },
        {
          label: 'Jump Backward',
          click: () => win.webContents.send('jump-back'),
          accelerator: 'PageDown',
        },
        {
          label: 'Seek Backward',
          click: () => win.webContents.send('seek-back'),
          accelerator: 'Left',
        },
        {
          label: 'Seek Forward',
          click: () => win.webContents.send('seek-ahead'),
          accelerator: 'Right',
        },
        {
          label: 'Jump Forward',
          click: () => win.webContents.send('jump-ahead'),
          accelerator: 'PageUp',
        },
      ],
    },
    {
      label: 'View',
      submenu: viewSubmenu,
    },
    {
      label: 'Help',
      accelerator: 'CmdOrCtrl+h',
      click: toggleHelp,
    },
  ];

  if (isMac) {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

export default createMenu;
