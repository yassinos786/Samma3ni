import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, of, catchError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ArtistProfile {
  id?: string;
  name: string;
  avatarFile?: string;
  avatarUrl?: string;
  bio?: string;
}

export interface AlbumProfile {
  id?: string;
  title: string;
  artist?: string;
  coverFile?: string;
  coverUrl?: string;
  releaseYear?: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ArtistAlbumService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly artistsApiUrl = `${environment.apiUrl}/artists`;
  private readonly albumsApiUrl = `${environment.apiUrl}/albums`;

  private readonly ARTISTS_KEY = 'samma3ni_artist_avatars';
  private readonly ALBUMS_KEY = 'samma3ni_album_covers';
  private readonly BIOS_KEY = 'samma3ni_artist_bios';
  private readonly ALBUM_DESC_KEY = 'samma3ni_album_desc';
  private readonly ALBUM_YEARS_KEY = 'samma3ni_album_years';

  // Reactive state maps: name -> image URL (or DataURL)
  readonly artistAvatars = signal<Record<string, string>>(this.loadInitial(this.ARTISTS_KEY));
  readonly artistBios = signal<Record<string, string>>(this.loadInitial(this.BIOS_KEY));
  readonly albumCovers = signal<Record<string, string>>(this.loadInitial(this.ALBUMS_KEY));
  readonly albumDescriptions = signal<Record<string, string>>(this.loadInitial(this.ALBUM_DESC_KEY));
  readonly albumYears = signal<Record<string, string>>(this.loadInitial(this.ALBUM_YEARS_KEY));

  constructor() {
    this.syncFromBackend();
  }

  private loadInitial(key: string): Record<string, string> {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  private persist(key: string, data: Record<string, string>) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  }

  syncFromBackend() {
    this.http.get<ArtistProfile[]>(this.artistsApiUrl).pipe(
      catchError(() => of([]))
    ).subscribe(artists => {
      if (artists && artists.length > 0) {
        const avatars = { ...this.artistAvatars() };
        const bios = { ...this.artistBios() };
        for (const a of artists) {
          const key = a.name.toLowerCase().trim();
          if (a.avatarFile) {
            avatars[key] = `${this.artistsApiUrl}/${encodeURIComponent(a.name)}/avatar`;
          }
          if (a.bio) {
            bios[key] = a.bio;
          }
        }
        this.artistAvatars.set(avatars);
        this.artistBios.set(bios);
        this.persist(this.ARTISTS_KEY, avatars);
        this.persist(this.BIOS_KEY, bios);
      }
    });

    this.http.get<AlbumProfile[]>(this.albumsApiUrl).pipe(
      catchError(() => of([]))
    ).subscribe(albums => {
      if (albums && albums.length > 0) {
        const covers = { ...this.albumCovers() };
        const descs = { ...this.albumDescriptions() };
        const years = { ...this.albumYears() };
        for (const alb of albums) {
          const key = alb.title.toLowerCase().trim();
          if (alb.coverFile) {
            covers[key] = `${this.albumsApiUrl}/${encodeURIComponent(alb.title)}/cover`;
          }
          if (alb.description) {
            descs[key] = alb.description;
          }
          if (alb.releaseYear) {
            years[key] = alb.releaseYear;
          }
        }
        this.albumCovers.set(covers);
        this.albumDescriptions.set(descs);
        this.albumYears.set(years);
        this.persist(this.ALBUMS_KEY, covers);
        this.persist(this.ALBUM_DESC_KEY, descs);
        this.persist(this.ALBUM_YEARS_KEY, years);
      }
    });
  }

  // ── Public Getters ────────────────────────────────────────────────────────

  getArtistAvatar(name: string | undefined | null): string | null {
    if (!name) return null;
    const key = name.toLowerCase().trim();
    return this.artistAvatars()[key] || null;
  }

  getArtistBio(name: string | undefined | null): string {
    if (!name) return '';
    const key = name.toLowerCase().trim();
    return this.artistBios()[key] || '';
  }

  getAlbumCover(title: string | undefined | null): string | null {
    if (!title) return null;
    const key = title.toLowerCase().trim();
    return this.albumCovers()[key] || null;
  }

  getAlbumDescription(title: string | undefined | null): string {
    if (!title) return '';
    const key = title.toLowerCase().trim();
    return this.albumDescriptions()[key] || '';
  }

  getAlbumYear(title: string | undefined | null): string {
    if (!title) return '';
    const key = title.toLowerCase().trim();
    return this.albumYears()[key] || '';
  }

  // ── Admin Update Methods ──────────────────────────────────────────────────

  updateArtistProfile(name: string, bio: string, avatarFile: File | null, previewDataUrl?: string): Observable<any> {
    const key = name.toLowerCase().trim();

    // 1. Instant local update
    if (previewDataUrl) {
      const updatedAvatars = { ...this.artistAvatars(), [key]: previewDataUrl };
      this.artistAvatars.set(updatedAvatars);
      this.persist(this.ARTISTS_KEY, updatedAvatars);
    }
    if (bio !== undefined) {
      const updatedBios = { ...this.artistBios(), [key]: bio };
      this.artistBios.set(updatedBios);
      this.persist(this.BIOS_KEY, updatedBios);
    }

    // 2. Server persistence
    const formData = new FormData();
    formData.append('name', name);
    if (bio) formData.append('bio', bio);
    if (avatarFile) formData.append('avatar', avatarFile);

    const headers = this.getAuthHeaders();
    return this.http.post(this.artistsApiUrl, formData, { headers }).pipe(
      tap(() => {
        // Backend now serves the official avatar URL
        const updated = { ...this.artistAvatars(), [key]: `${this.artistsApiUrl}/${encodeURIComponent(name)}/avatar?t=${Date.now()}` };
        this.artistAvatars.set(updated);
        this.persist(this.ARTISTS_KEY, updated);
      }),
      catchError(err => {
        // Even if server request failed (e.g. backend awaiting restart), local change stays active!
        return of({ success: true, localOnly: true });
      })
    );
  }

  updateAlbumProfile(title: string, artist: string, year: string, description: string, coverFile: File | null, previewDataUrl?: string): Observable<any> {
    const key = title.toLowerCase().trim();

    // 1. Instant local update
    if (previewDataUrl) {
      const updatedCovers = { ...this.albumCovers(), [key]: previewDataUrl };
      this.albumCovers.set(updatedCovers);
      this.persist(this.ALBUMS_KEY, updatedCovers);
    }
    if (year !== undefined) {
      const updatedYears = { ...this.albumYears(), [key]: year };
      this.albumYears.set(updatedYears);
      this.persist(this.ALBUM_YEARS_KEY, updatedYears);
    }
    if (description !== undefined) {
      const updatedDescs = { ...this.albumDescriptions(), [key]: description };
      this.albumDescriptions.set(updatedDescs);
      this.persist(this.ALBUM_DESC_KEY, updatedDescs);
    }

    // 2. Server persistence
    const formData = new FormData();
    formData.append('title', title);
    if (artist) formData.append('artist', artist);
    if (year) formData.append('releaseYear', year);
    if (description) formData.append('description', description);
    if (coverFile) formData.append('cover', coverFile);

    const headers = this.getAuthHeaders();
    return this.http.post(this.albumsApiUrl, formData, { headers }).pipe(
      tap(() => {
        const updated = { ...this.albumCovers(), [key]: `${this.albumsApiUrl}/${encodeURIComponent(title)}/cover?t=${Date.now()}` };
        this.albumCovers.set(updated);
        this.persist(this.ALBUMS_KEY, updated);
      }),
      catchError(err => {
        return of({ success: true, localOnly: true });
      })
    );
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.auth.token();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
}
