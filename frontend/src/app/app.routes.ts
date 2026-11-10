import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { StudioComponent } from './pages/studio/studio.component';
import { ArtistComponent } from './pages/artist/artist.component';
import { AlbumComponent } from './pages/album/album.component';
import { LikedComponent } from './pages/liked/liked.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'studio', component: StudioComponent },
  { path: 'admin', redirectTo: 'studio' },
  { path: 'backstage', redirectTo: 'studio' },
  { path: 'artist/:name', component: ArtistComponent },
  { path: 'album/:name', component: AlbumComponent },
  { path: 'liked', component: LikedComponent },
  { path: '**', redirectTo: '' }
];
