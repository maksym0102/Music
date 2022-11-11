module.exports = {
  pluginOptions: {
    electronBuilder: {
      externals: ['fluent-ffmpeg'],
      chainWebpackRendererProcess: config => {
        config.plugin('define').tap(args => {
          args[0]['process.env.FLUENTFFMPEG_COV'] = false;
          return args;
        });
      },
      nodeIntegration: true,
      customFileProtocol: './',
      builderOptions: {
        productName: 'Music',
        appId: 'com.LutetiumVanadium.Music',
        directories: {
          output: 'release',
          buildResources: 'public',
        },
        dmg: {
          contents: [
            {
              x: 410,
              y: 150,
              type: 'link',
              path: '/Applications',
            },
            {
              x: 130,
              y: 150,
              type: 'file',
            },
          ],
        },
        mac: {
          icon: 'icons/icon.icns',
        },
        win: {
          icon: 'icons/icon.ico',
          target: ['nsis'],
        },
        linux: {
          icon: 'icons/linux',
          target: ['AppImage', 'tar.gz'],
          category: 'AudioVideo',
        },
      },
    },
  },
};
