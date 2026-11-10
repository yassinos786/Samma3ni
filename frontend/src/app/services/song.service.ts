import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Song, Stats } from '../models/song.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SongService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/songs`;

  getAllSongs(): Observable<Song[]> {
    return this.http.get<Song[]>(this.baseUrl);
  }

  searchSongs(query: string): Observable<Song[]> {
    return this.http.get<Song[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
  }

  getSongById(id: string): Observable<Song> {
    return this.http.get<Song>(`${this.baseUrl}/${id}`);
  }

  incrementPlay(id: string): Observable<Song> {
    return this.http.post<Song>(`${this.baseUrl}/${id}/play`, {});
  }

  uploadSong(formData: FormData): Observable<Song> {
    return this.http.post<Song>(`${this.baseUrl}/upload`, formData);
  }

  updateSong(id: string, formData: FormData): Observable<Song> {
    return this.http.put<Song>(`${this.baseUrl}/${id}`, formData);
  }

  deleteSong(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.baseUrl}/stats`);
  }

  getStreamUrl(id: string): string {
    return `${this.baseUrl}/${id}/stream`;
  }

  getCoverUrl(id: string): string {
    return `${this.baseUrl}/${id}/cover`;
  }
}
