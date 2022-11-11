import Vue from 'vue';
import Router from 'vue-router';

import AlbumPage from '@/views/AlbumPage.vue';
import AlbumsPage from '@/views/AlbumsPage.vue';
import ArtistPage from '@/views/ArtistPage.vue';
import ArtistsPage from '@/views/ArtistsPage.vue';
import HomePage from '@/views/HomePage.vue';
import LikedPage from '@/views/LikedPage.vue';
import MusicPage from '@/views/MusicPage.vue';
import QueuePage from '@/views/QueuePage.vue';
import RegisterApiKeysPage from '@/views/RegisterApiKeysPage.vue';
import SearchPage from '@/views/SearchPage.vue';
import SettingsPage from '@/views/SettingsPage.vue';
import SyncStatusPage from '@/views/SyncStatusPage.vue';

Vue.use(Router);

// The route names are what is shown when the user scrolls down some amount,
// but some pages dont require for the name to come when scrolling, those route names
// are prefixed with a `\` (double in the code for escaping)
export default new Router({
  routes: [
    {
      path: '/albums/album',
      name: '\\album-page',
      component: AlbumPage,
      props: options => {
        const album: AlbumData = {
          id: options.query.id as string,
          name: options.query.name as string,
          imagePath: options.query.imagePath as string,
          artist: options.query.artist as string,
          numSongs: parseInt(options.query.numSongs as string, 10),
        };

        return {
          isCustom: false,
          album,
        };
      },
    },
    {
      path: '/albums/album',
      name: '\\c-album-page',
      component: AlbumPage,
      props: options => {
        const album: CustomAlbumData = {
          id: options.query.id as string,
          name: options.query.name as string,
          songs: options.query.songs as string[],
        };

        return {
          isCustom: true,
          album,
        };
      },
    },
    {
      path: '/albums',
      name: 'Albums',
      component: AlbumsPage,
    },
    {
      path: '/artists',
      name: 'Artists',
      component: ArtistsPage,
    },
    {
      path: '/artists/artist',
      name: '\\artist-page',
      component: ArtistPage,
      props: options => ({
        artist: options.query,
      }),
    },
    {
      path: '/',
      name: 'Home',
      component: HomePage,
    },
    {
      path: '/albums/liked',
      name: '\\liked-page',
      component: LikedPage,
    },
    {
      path: '/music',
      name: 'My Music',
      component: MusicPage,
    },
    {
      path: '/queue',
      name: '\\queue-page',
      component: QueuePage,
    },
    {
      path: '/register-keys',
      name: 'Register Api Keys',
      component: RegisterApiKeysPage,
    },
    {
      path: '/search',
      name: 'Download',
      component: SearchPage,
    },
    {
      path: '/settings',
      name: 'Settings',
      component: SettingsPage,
    },
    {
      path: '/sync-status',
      name: 'Sync Status',
      component: SyncStatusPage,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
