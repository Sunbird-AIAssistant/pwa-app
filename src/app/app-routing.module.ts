import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './auth.guard';

export const routes: Routes = [
{
  path: '',  // default route
  loadChildren: () =>
    import('./pages/splash/splash.module').then(m => m.SplashPageModule),
  pathMatch: 'full'
},
{
  path: 'login',  // direct login path
  loadChildren: () =>
    import('./components/prajayatna-auth/auth.module').then(m => m.AuthModule)
},  
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'my-pitara',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/mypitara/mypitara.module').then(m => m.MyPitaraPageModule)
  },
  {
    path: 'story',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/story/story.module').then(m => m.StoryPageModule)
  },
  {
    path: 'player',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/player/player.module').then( m => m.PlayerPageModule)
  },
  {
    path: 'teacher-sakhi',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/teacher-sakhi/teacher-sakhi.module').then( m => m.TeacherSakhiPageModule)
  },
  {
    path: 'view-all',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/view-all/view-all.module').then( m => m.ViewAllPageModule)
  },
  {
    path: 'create-playlist',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/create-playlist/create-playlist.module').then( m => m.CreatePlaylistPageModule)
  },
  {
    path: 'search',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/search/search.module').then( m => m.SearchPageModule)
  },
  {
    path: 'qr-scan-result',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/qr-scan-result/qr-scan-result.module').then( m => m.QrScanResultPageModule)
  },
  {
    path: 'parent-sakhi',
     canActivate: [authGuard],
    loadChildren: () => import('./pages/parent-sakhi/parent-sakhi.module').then( m => m.ParentSakhiPageModule)
  },
  {
    path: 'playlist-details',
     canActivate: [authGuard],
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
