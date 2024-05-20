import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./pages/splash/splash.module').then( m => m.SplashPageModule),
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'my-pitara',
    loadChildren: () => import('./pages/mypitara/mypitara.module').then(m => m.MyPitaraPageModule)
  },
  {
    path: 'story',
    loadChildren: () => import('./pages/story/story.module').then(m => m.StoryPageModule)
  },
  {
    path: 'player',
    loadChildren: () => import('./pages/player/player.module').then( m => m.PlayerPageModule)
  },
  {
    path: 'teacher-sakhi',
    loadChildren: () => import('./pages/teacher-sakhi/teacher-sakhi.module').then( m => m.TeacherSakhiPageModule)
  },
  {
    path: 'view-all',
    loadChildren: () => import('./pages/view-all/view-all.module').then( m => m.ViewAllPageModule)
  },
  {
    path: 'create-playlist',
    loadChildren: () => import('./pages/create-playlist/create-playlist.module').then( m => m.CreatePlaylistPageModule)
  },
  {
    path: 'search',
    loadChildren: () => import('./pages/search/search.module').then( m => m.SearchPageModule)
  },
  {
    path: 'qr-scan-result',
    loadChildren: () => import('./pages/qr-scan-result/qr-scan-result.module').then( m => m.QrScanResultPageModule)
  },
  {
    path: 'parent-sakhi',
    loadChildren: () => import('./pages/parent-sakhi/parent-sakhi.module').then( m => m.ParentSakhiPageModule)
  },
  {
    path: 'playlist-details',
    loadChildren: () => import('./pages/playlist-details/playlist-details.module').then( m => m.PlaylistDetailsPageModule)
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
