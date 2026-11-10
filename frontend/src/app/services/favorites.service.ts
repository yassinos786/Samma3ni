import { Injectable, signal, computed } from '@angular/core';
import { Song } from '../models/song.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly storageKey = 'samma3ni_liked_songs';
  readonly likedIds = signal<string[]>(this.loadFromStorage());

  constructor(private toast: ToastService) {}

  private loadFromStorage(): string[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage(ids: string[]) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(ids));
    } catch {}
  }

  isLiked(songId: string): boolean {
    return this.likedIds().includes(songId);
  }

  toggleLike(song: Song) {
    const current = this.likedIds();
    const exists = current.includes(song.id);

    if (exists) {
      const updated = current.filter(id => id !== song.id);
      this.likedIds.set(updated);
      this.saveToStorage(updated);
      this.toast.info(`Removed "${song.title}" from Liked Songs`);
    } else {
      const updated = [...current, song.id];
      this.likedIds.set(updated);
      this.saveToStorage(updated);
      this.toast.success(`Added "${song.title}" to Liked Songs`);
    }
  }
}
