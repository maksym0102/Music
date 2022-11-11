# Code Structure

## Directories

The main source files are in `src`, but there are others in the `public` folder as well.

- ### `public`

  Contains the html files as well as assets used directly in it.

- ### `src`

  Main source files for the main electron process as well as the main window.

  - ### Electron Files

    The entry point for the main process is `src/background.ts`, which starts the windows and registers the required event handlers.

    There are 2 other files, `src/menu.ts` which has the Menu bar options declarations, and `src/downloader.ts` which has everything required to download to Album images as well as songs.

  - ### Renderer Files

    The entry point is `src/main.ts` which initialises the Vue instance.
    There are also some global type declerations in `src/*.d.ts`.

    `src/global.scss` contains global styles like default style reseters. `src/pageAnimations.scss` has the required classes for transitions between pages. `src/vars.scss` has some declarations used throughout the styles of various components.

    `src/App.vue` is the main Vue file.

- ### `src/assets`

  Images used in the frontend.

- ### `src/components`

  Contains Vue components which are not top level route components.

- ### `src/helpers`

  General functions and classes that can be used for data processing.

- ### `src/router`

  Has the declarations for what all routes are present, and which components to render based on that.

- ### `src/store`

  The global `vuex` store declarations, which handles global state.

- ### `src/views`

  Contains the Vue components which are rendered based on the router in `src/router`

## routes

All the relavent components for these are givin within the `src/views` directory. They are registered in `src/router/index.ts`.

- ### `/`

  The main page, it opens to this which shows most heard songs as well as albums with most songs.

- ### `/albums`

  Lists all the Custom albums and albums which are downloaded.

- ### `/albums/album`

  Shows the songs for one Custom Album or one Album.

- ### `/artists`

  Shows all the Artists.

- ### `/artists/artist`

  Shows the songs for one Artist.

- ### `/albums/liked`

  This shows all the liked songs.

- ### `/music`

  This shows all downloaded music.

- ### `/queue`

  This shows the controls for the playing songs, including the current playing song and the queue.

- ### `/register-api-keys`

  This is shown when the app is first installed, where user can register the API Keys.

- ### `/search`

  This is the page which shows the search results for downloading songs.

- ### `/settings`

  This shows all available settings.

- ### `/sync-status`

  After initial API Key registration, if Firebase keys are given, they will be redirected to this page, while initial set up happens.
