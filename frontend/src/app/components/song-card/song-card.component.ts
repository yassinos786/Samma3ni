import { Component, inject, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Song } from '../../models/song.model';
import { SongService } from '../../services/song.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { FavoritesService } from '../../services/favorites.service';
import { ArtistAlbumService } from '../../services/artist-album.service';

@Component({
  selector: 'app-song-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div 
      class="song-card" 
      [class.is-current]="isCurrentSong()"
      [class.is-playing]="isCurrentSong() && player.isPlaying()"
      [class.is-quran]="isQuranTrack()"
      (click)="onPlayClick()">
      
      <!-- Peeking & Spinning Vinyl Disc -->
      <div class="vinyl-disc" [class.spinning]="isCurrentSong() && player.isPlaying()">
        <div class="vinyl-center" [ngStyle]="{ 'background': getGenreGradient() }">
          <div class="vinyl-spindle"></div>
        </div>
      </div>

      <!-- Cover Container -->
      <div class="cover-wrapper" [ngStyle]="{ 'background': getGenreGradient() }">
        @if (getCoverUrl() && !imgFailed()) {
          <img 
            [src]="getCoverUrl()" 
            [alt]="song().title"
            class="cover-img"
            (error)="imgFailed.set(true)"
            loading="lazy"
          />
        } @else {
          <div class="cover-fallback" [ngStyle]="{ 'background': getGenreGradient() }">
            <span class="material-symbols-outlined music-icon">music_note</span>
          </div>
        }

        <!-- Play Button Overlay -->
        <button 
          class="play-overlay-btn" 
          [class.visible]="isCurrentSong()"
          (click)="$event.stopPropagation(); onPlayClick()"
          [title]="isCurrentSong() && player.isPlaying() ? 'Pause' : 'Play'">
          <span class="material-symbols-outlined">
            {{ isCurrentSong() && player.isPlaying() ? 'pause' : 'play_arrow' }}
          </span>
        </button>

        <!-- Dynamic 4-Bar Equalizer when playing -->
        @if (isCurrentSong() && player.isPlaying()) {
          <div class="playing-equalizer">
            <span></span><span></span><span></span><span></span>
          </div>
        }

        <!-- Like Button on Cover (Top Right) -->
        <button 
          class="card-like-btn" 
          [class.liked]="favs.isLiked(song().id)"
          [class.animate-heart-pop]="justLiked()"
          (click)="$event.stopPropagation(); toggleLikeWithAnim()"
          [title]="favs.isLiked(song().id) ? 'Unlike' : 'Like'">
          <span class="material-symbols-outlined" [class.filled]="favs.isLiked(song().id)">
            favorite
          </span>
        </button>
      </div>

      <!-- Info Area -->
      <div class="song-info">
        <h4 class="song-title" [title]="song().title">{{ song().title }}</h4>
        
        <!-- Clickable Artist Link -->
        <a 
          [routerLink]="['/artist', song().artist]" 
          class="song-artist" 
          (click)="$event.stopPropagation()"
          [title]="'View ' + song().artist + ' profile'">
          {{ song().artist }}
        </a>

        <div class="song-meta">
          @if (song().album) {
            <a 
              [routerLink]="['/album', song().album]" 
              class="album-tag" 
              (click)="$event.stopPropagation()"
              [title]="'View album ' + song().album">
              {{ song().album }}
            </a>
          } @else if (song().genre) {
            <span class="genre-tag" [class.quran-tag]="isQuranTrack()">{{ song().genre }}</span>
          }

          <div class="plays-count">
            <span class="material-symbols-outlined">headphones</span>
            <span>{{ song().playCount | number }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .song-card {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      cursor: pointer;
      border: 1px solid var(--border-subtle);
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
      transform-style: preserve-3d;

      &:hover {
        background: var(--bg-card-hover);
        transform: perspective(1000px) rotateY(-5deg) rotateX(4deg) translateY(-8px) scale(1.02);
        box-shadow: -8px 20px 38px -6px rgba(0, 0, 0, 0.75), 0 0 25px rgba(30, 215, 96, 0.2);
        border-color: rgba(255, 255, 255, 0.25);

        .vinyl-disc {
          transform: translateX(22px) rotate(30deg);
        }

        .play-overlay-btn {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .card-like-btn {
          opacity: 1;
        }

        .cover-img {
          transform: scale(1.07);
        }
      }

      &.is-current {
        border-color: rgba(30, 215, 96, 0.55);
        background: rgba(30, 215, 96, 0.06);
        box-shadow: 0 8px 24px -4px rgba(30, 215, 96, 0.25);

        .song-title {
          color: var(--primary);
        }
      }

      &.is-playing {
        border-color: var(--primary);
        box-shadow: 0 12px 32px -4px rgba(30, 215, 96, 0.4), 0 0 15px rgba(30, 215, 96, 0.25);

        .vinyl-disc {
          transform: translateX(24px);
        }
      }

      &.is-quran.is-current {
        border-color: rgba(16, 185, 129, 0.7);
        background: rgba(16, 185, 129, 0.08);
        box-shadow: 0 8px 28px -4px rgba(16, 185, 129, 0.35);

        .song-title {
          color: #34d399;
        }
      }
    }

    /* Peeking & Spinning Vinyl Disc */
    .vinyl-disc {
      position: absolute;
      top: 16px;
      right: 16px;
      width: calc(100% - 32px);
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      background: radial-gradient(circle, #2a2a2a 0%, #171717 38%, #080808 70%, #000 100%);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.7);
      pointer-events: none;
      z-index: 0;
      transform: translateX(0) rotate(0deg);
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      display: flex;
      align-items: center;
      justify-content: center;

      &::before {
        content: '';
        position: absolute;
        inset: 4px;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.06);
        box-shadow: inset 0 0 0 4px rgba(255, 255, 255, 0.02),
                    inset 0 0 0 8px rgba(0, 0, 0, 0.6),
                    inset 0 0 0 12px rgba(255, 255, 255, 0.02),
                    inset 0 0 0 18px rgba(0, 0, 0, 0.6),
                    inset 0 0 0 24px rgba(255, 255, 255, 0.02);
      }

      .vinyl-center {
        width: 33%;
        height: 33%;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 6px rgba(0, 0, 0, 0.8);
        position: relative;
        z-index: 1;

        .vinyl-spindle {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #09090b;
          border: 2px solid #52525b;
        }
      }

      &.spinning {
        animation: spinVinyl 6s linear infinite;
      }
    }

    .cover-wrapper {
      position: relative;
      z-index: 1;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: #111;
      box-shadow: var(--shadow-sm);
    }

    .cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .cover-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .music-icon {
        font-size: 52px;
        color: rgba(255, 255, 255, 0.65);
      }
    }

    .card-like-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.65);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.7);
      opacity: 0;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 3;

      &:hover {
        transform: scale(1.18);
        color: #fff;
        background: rgba(0, 0, 0, 0.9);
      }

      &.liked {
        opacity: 1;
        color: var(--accent-rose);
      }

      .material-symbols-outlined {
        font-size: 18px;
      }
    }

    .play-overlay-btn {
      position: absolute;
      right: 12px;
      bottom: 12px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary);
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6);
      opacity: 0;
      transform: translateY(10px) scale(0.9);
      transition: all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 2;

      .material-symbols-outlined {
        font-size: 28px;
      }

      &:hover {
        background: var(--primary-hover);
        transform: scale(1.1) !important;
        box-shadow: 0 10px 24px rgba(30, 215, 96, 0.5);
      }

      &.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .playing-equalizer {
      position: absolute;
      left: 12px;
      bottom: 12px;
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 18px;
      background: rgba(0, 0, 0, 0.72);
      padding: 4px 7px;
      border-radius: 6px;
      backdrop-filter: blur(8px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
      z-index: 2;

      span {
        width: 3px;
        background: var(--primary);
        border-radius: 2px;
        animation: musicEqualizer 0.85s infinite ease-in-out;

        &:nth-child(1) { height: 6px; animation-delay: 0.1s; }
        &:nth-child(2) { height: 16px; animation-delay: 0.35s; }
        &:nth-child(3) { height: 10px; animation-delay: 0.2s; }
        &:nth-child(4) { height: 14px; animation-delay: 0.45s; }
      }
    }

    .song-info {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .song-title {
      font-size: 0.98rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      transition: color 0.2s;
    }

    .song-artist {
      font-size: 0.84rem;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: var(--primary);
        text-decoration: underline;
      }
    }

    .song-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 0.75rem;
      gap: 8px;
    }

    .album-tag, .genre-tag {
      padding: 3px 9px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);
      font-weight: 600;
      text-transform: capitalize;
      text-decoration: none;
      max-width: 110px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-block;
      transition: all 0.2s ease;
    }

    .genre-tag.quran-tag {
      background: rgba(16, 185, 129, 0.18);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .album-tag:hover {
      background: rgba(30, 215, 96, 0.18);
      color: var(--primary);
      transform: translateY(-1px);
    }

    .plays-count {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-muted);
      flex-shrink: 0;

      .material-symbols-outlined {
        font-size: 15px;
      }
    }
  `]
})
export class SongCardComponent {
  readonly songService = inject(SongService);
  readonly artistAlbumService = inject(ArtistAlbumService);
  readonly player = inject(AudioPlayerService);
  readonly favs = inject(FavoritesService);

  readonly song = input.required<Song>();
  readonly play = output<Song>();
  readonly imgFailed = signal<boolean>(false);
  readonly justLiked = signal<boolean>(false);

  readonly isCurrentSong = computed(() => {
    return this.player.currentSong()?.id === this.song().id;
  });

  getCoverUrl(): string | null {
    if (this.song().coverFile) {
      return this.songService.getCoverUrl(this.song().id);
    }
    if (this.song().album) {
      const albCover = this.artistAlbumService.getAlbumCover(this.song().album);
      if (albCover) return albCover;
    }
    return null;
  }

  onPlayClick() {
    this.play.emit(this.song());
  }

  toggleLikeWithAnim() {
    this.favs.toggleLike(this.song());
    this.justLiked.set(true);
    setTimeout(() => this.justLiked.set(false), 450);
  }

  isQuranTrack(): boolean {
    const g = (this.song().genre || '').toLowerCase();
    return g.includes('quran') || g.includes('islamic');
  }

  handleImageError(event: Event) {
    (event.target as HTMLElement).style.display = 'none';
  }

  getGenreGradient(): string {
    const genre = (this.song().genre || '').toLowerCase();
    if (genre.includes('quran') || genre.includes('qur') || genre.includes('islamic')) return 'linear-gradient(135deg, #047857, #064e3b)';
    if (genre.includes('deep house') || genre.includes('afro')) return 'linear-gradient(135deg, #f97316, #7c2d12)';
    if (genre.includes('house')) return 'linear-gradient(135deg, #a855f7, #2563eb)';
    if (genre.includes('techno')) return 'linear-gradient(135deg, #10b981, #064e3b)';
    if (genre.includes('rock')) return 'linear-gradient(135deg, #e11d48, #4c0519)';
    if (genre.includes('pop')) return 'linear-gradient(135deg, #ec4899, #831843)';
    if (genre.includes('hip') || genre.includes('rap') || genre.includes('trap')) return 'linear-gradient(135deg, #f59e0b, #78350f)';
    if (genre.includes('electronic') || genre.includes('dance')) return 'linear-gradient(135deg, #06b6d4, #083344)';
    if (genre.includes('tarab') || genre.includes('arabic')) return 'linear-gradient(135deg, #10b981, #064e3b)';
    if (genre.includes('rai') || genre.includes('mezoued') || genre.includes('chaabi')) return 'linear-gradient(135deg, #eab308, #854d0e)';
    if (genre.includes('jazz') || genre.includes('blues')) return 'linear-gradient(135deg, #6366f1, #312e81)';
    if (genre.includes('r&b') || genre.includes('soul')) return 'linear-gradient(135deg, #8b5cf6, #4c1d95)';
    return 'linear-gradient(135deg, #3b82f6, #1e1b4b)';
  }
}
