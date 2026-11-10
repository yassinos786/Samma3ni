import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { Song } from '../models/song.model';
import { SongService } from './song.service';
import { UserService } from './user.service';
import { ToastService } from './toast.service';

export type LoopMode = 'none' | 'all' | 'one';

@Injectable({
  providedIn: 'root'
})
export class AudioPlayerService {
  private readonly songService = inject(SongService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly audio = new Audio();

  readonly currentSong = signal<Song | null>(null);
  readonly isPlaying = signal<boolean>(false);
  readonly currentTime = signal<number>(0);
  readonly duration = signal<number>(0);
  readonly volume = signal<number>(0.8);
  readonly isMuted = signal<boolean>(false);
  readonly loopMode = signal<LoopMode>('none');
  readonly isShuffle = signal<boolean>(false);
  readonly playlist = signal<Song[]>([]);
  readonly isLoading = signal<boolean>(false);

  readonly progressPercent = computed(() => {
    const cur = this.currentTime();
    const dur = this.duration();
    if (!dur || dur <= 0) return 0;
    return Math.min(100, Math.max(0, (cur / dur) * 100));
  });

  readonly currentIndex = computed(() => {
    const song = this.currentSong();
    if (!song) return -1;
    return this.playlist().findIndex(s => s.id === song.id);
  });

  private playCountLogged = false;

  constructor() {
    this.initAudioEvents();
    this.restoreSettings();

    // Auto-resume pending track upon successful sign-in
    effect(() => {
      const user = this.userService.currentUser();
      const pending = this.userService.pendingSong();
      if (user && pending) {
        this.userService.pendingSong.set(null);
        setTimeout(() => {
          this.playSong(pending);
          this.toast.success(`Bienvenue, ${user.name} ! Écoute illimitée débloquée.`);
        }, 150);
      }
    });
  }

  private restoreSettings() {
    const savedVol = localStorage.getItem('samma3ni_volume');
    if (savedVol !== null) {
      const vol = parseFloat(savedVol);
      if (!isNaN(vol)) {
        this.setVolume(vol);
      }
    } else {
      this.audio.volume = this.volume();
    }
  }

  private initAudioEvents() {
    this.audio.addEventListener('play', () => {
      this.isPlaying.set(true);
      this.isLoading.set(false);
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying.set(false);
    });

    this.audio.addEventListener('waiting', () => {
      this.isLoading.set(true);
    });

    this.audio.addEventListener('playing', () => {
      this.isLoading.set(false);
    });

    this.audio.addEventListener('timeupdate', () => {
      this.currentTime.set(this.audio.currentTime);

      // Increment play count after 5 seconds of playing
      if (!this.playCountLogged && this.audio.currentTime >= 5 && this.currentSong()) {
        this.playCountLogged = true;
        const songId = this.currentSong()!.id;
        this.songService.incrementPlay(songId).subscribe({
          next: updatedSong => {
            // Update local playCount in song and playlist
            this.currentSong.update(s => s ? { ...s, playCount: updatedSong.playCount } : null);
            this.playlist.update(list => list.map(s => s.id === songId ? { ...s, playCount: updatedSong.playCount } : s));
          },
          error: () => {}
        });
      }
    });

    this.audio.addEventListener('durationchange', () => {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        this.duration.set(this.audio.duration);
      }
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio.duration && !isNaN(this.audio.duration)) {
        this.duration.set(this.audio.duration);
      }
      this.isLoading.set(false);
    });

    this.audio.addEventListener('ended', () => {
      this.handleSongEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.error('Audio playback error', e);
      this.isLoading.set(false);
      this.isPlaying.set(false);
    });
  }

  playSong(song: Song, newPlaylist?: Song[]) {
    if (newPlaylist && newPlaylist.length > 0) {
      this.playlist.set(newPlaylist);
    } else if (this.playlist().length === 0) {
      this.playlist.set([song]);
    } else if (!this.playlist().some(s => s.id === song.id)) {
      this.playlist.update(list => [...list, song]);
    }

    const isSameSong = this.currentSong()?.id === song.id;
    if (isSameSong) {
      if (this.isPlaying()) {
        this.pause();
      } else {
        this.play();
      }
      return;
    }

    // Limite d'écoute gratuite : connexion requise à partir du 4e morceau
    if (!this.userService.canPlaySong(song)) {
      this.pause();
      this.toast.error('Limite d\'écoute gratuite atteinte (3 morceaux). Connectez-vous pour débloquer l\'écoute illimitée.');
      return;
    }

    this.currentSong.set(song);
    this.playCountLogged = false;
    this.currentTime.set(0);
    this.duration.set(song.duration || 0);
    this.isLoading.set(true);

    const streamUrl = this.songService.getStreamUrl(song.id);
    this.audio.src = streamUrl;
    this.audio.load();
    this.audio.play().catch(err => {
      console.warn('Auto-play prevented or stream failed:', err);
      this.isPlaying.set(false);
      this.isLoading.set(false);
    });
  }

  togglePlay() {
    if (!this.currentSong()) {
      const list = this.playlist();
      if (list.length > 0) {
        this.playSong(list[0]);
      }
      return;
    }

    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (this.audio.src) {
      this.audio.play().catch(console.error);
    }
  }

  pause() {
    this.audio.pause();
  }

  seek(time: number) {
    if (isNaN(time) || time < 0) return;
    this.audio.currentTime = time;
    this.currentTime.set(time);
  }

  seekByPercentage(percent: number) {
    const dur = this.duration();
    if (dur > 0) {
      const targetTime = (percent / 100) * dur;
      this.seek(targetTime);
    }
  }

  setVolume(vol: number) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume.set(clamped);
    this.audio.volume = clamped;
    localStorage.setItem('samma3ni_volume', clamped.toString());
    if (clamped === 0) {
      this.isMuted.set(true);
    } else if (this.isMuted()) {
      this.isMuted.set(false);
    }
  }

  toggleMute() {
    if (this.isMuted()) {
      this.isMuted.set(false);
      const prevVol = this.volume() > 0 ? this.volume() : 0.8;
      this.audio.volume = prevVol;
      this.volume.set(prevVol);
    } else {
      this.isMuted.set(true);
      this.audio.volume = 0;
    }
  }

  toggleLoop() {
    const modes: LoopMode[] = ['none', 'all', 'one'];
    const nextIndex = (modes.indexOf(this.loopMode()) + 1) % modes.length;
    this.loopMode.set(modes[nextIndex]);
  }

  toggleShuffle() {
    this.isShuffle.update(v => !v);
  }

  playNext() {
    const list = this.playlist();
    if (list.length === 0) return;

    if (this.loopMode() === 'one') {
      this.seek(0);
      this.play();
      return;
    }

    if (this.isShuffle()) {
      const randomIdx = Math.floor(Math.random() * list.length);
      this.playSong(list[randomIdx]);
      return;
    }

    const curIdx = this.currentIndex();
    if (curIdx < list.length - 1) {
      this.playSong(list[curIdx + 1]);
    } else if (this.loopMode() === 'all') {
      this.playSong(list[0]);
    } else {
      this.pause();
      this.seek(0);
    }
  }

  playPrevious() {
    // If more than 3 seconds into song, restart track
    if (this.currentTime() > 3) {
      this.seek(0);
      return;
    }

    const list = this.playlist();
    if (list.length === 0) return;

    if (this.isShuffle()) {
      const randomIdx = Math.floor(Math.random() * list.length);
      this.playSong(list[randomIdx]);
      return;
    }

    const curIdx = this.currentIndex();
    if (curIdx > 0) {
      this.playSong(list[curIdx - 1]);
    } else if (this.loopMode() === 'all') {
      this.playSong(list[list.length - 1]);
    } else {
      this.seek(0);
    }
  }

  private handleSongEnded() {
    if (this.loopMode() === 'one') {
      this.seek(0);
      this.play();
      return;
    }
    this.playNext();
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}
