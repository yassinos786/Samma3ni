import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AudioPlayerService } from '../../services/audio-player.service';
import { SongService } from '../../services/song.service';
import { FavoritesService } from '../../services/favorites.service';
import { Song } from '../../models/song.model';

@Component({
  selector: 'app-player-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- Slide-Up Queue Drawer -->
    @if (showQueue()) {
      <div class="queue-drawer animate-fade-in">
        <div class="queue-header">
          <div class="queue-title-box">
            <span class="material-symbols-outlined">queue_music</span>
            <h4>Playback Queue</h4>
            <span class="queue-count">({{ player.playlist().length }} tracks)</span>
          </div>
          <button class="queue-close-btn" (click)="showQueue.set(false)">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="queue-list">
          @for (s of player.playlist(); track s.id; let i = $index) {
            <div 
              class="queue-item" 
              [class.active]="player.currentSong()?.id === s.id"
              (click)="player.playSong(s)">
              <div class="queue-idx">
                @if (player.currentSong()?.id === s.id && player.isPlaying()) {
                  <span class="material-symbols-outlined playing-icon">volume_up</span>
                } @else {
                  <span>{{ i + 1 }}</span>
                }
              </div>
              <div class="queue-thumb">
                @if (s.coverFile) {
                  <img [src]="songService.getCoverUrl(s.id)" alt="" />
                } @else {
                  <span class="material-symbols-outlined">music_note</span>
                }
              </div>
              <div class="queue-info">
                <span class="q-title">{{ s.title }}</span>
                <span class="q-artist">{{ s.artist }}</span>
              </div>
            </div>
          }
        </div>
      </div>
    }

    <footer class="player-bar" [class.active]="player.currentSong()">
      <!-- Left: Song details -->
      <div class="track-details">
        @if (player.currentSong(); as song) {
          <div class="thumb-wrapper" [class.playing]="player.isPlaying()">
            @if (song.coverFile) {
              <img 
                [src]="songService.getCoverUrl(song.id)" 
                [alt]="song.title"
                class="thumb-img"
              />
            } @else {
              <div class="thumb-fallback">
                <span class="material-symbols-outlined">music_note</span>
              </div>
            }
          </div>
          <div class="track-meta">
            <div class="meta-title-row">
              <span class="title" [title]="song.title">{{ song.title }}</span>
              @if (player.isPlaying()) {
                <div class="soundwave-mini">
                  <span></span><span></span><span></span><span></span>
                </div>
              }
            </div>
            <a 
              [routerLink]="['/artist', song.artist]" 
              class="artist-link" 
              [title]="'View ' + song.artist">
              {{ song.artist }}
            </a>
          </div>

          <!-- Like Toggle Button -->
          <button 
            class="bar-like-btn" 
            [class.liked]="favs.isLiked(song.id)"
            [class.animate-heart-pop]="justLiked()"
            (click)="toggleLikeWithAnim(song)"
            [title]="favs.isLiked(song.id) ? 'Unlike' : 'Like'">
            <span class="material-symbols-outlined" [class.filled]="favs.isLiked(song.id)">
              favorite
            </span>
          </button>
        } @else {
          <div class="empty-state">
            <span class="material-symbols-outlined icon">headphones</span>
            <span>Select a song to start listening</span>
          </div>
        }
      </div>

      <!-- Center: Controls & Seek bar -->
      <div class="player-controls">
        <div class="buttons-row">
          <!-- Shuffle Button -->
          <button 
            class="control-btn" 
            [class.active]="player.isShuffle()"
            (click)="player.toggleShuffle()"
            title="Shuffle">
            <span class="material-symbols-outlined">shuffle</span>
          </button>

          <!-- Prev Button -->
          <button 
            class="control-btn" 
            (click)="player.playPrevious()"
            title="Previous track">
            <span class="material-symbols-outlined">skip_previous</span>
          </button>

          <!-- Play/Pause Main Button -->
          <button 
            class="play-main-btn" 
            [class.is-active-playing]="player.isPlaying()"
            (click)="player.togglePlay()"
            [disabled]="!player.currentSong()"
            [title]="player.isPlaying() ? 'Pause' : 'Play'">
            @if (player.isLoading()) {
              <span class="spinner"></span>
            } @else {
              <span class="material-symbols-outlined filled">
                {{ player.isPlaying() ? 'pause' : 'play_arrow' }}
              </span>
            }
          </button>

          <!-- Next Button -->
          <button 
            class="control-btn" 
            (click)="player.playNext()"
            title="Next track">
            <span class="material-symbols-outlined">skip_next</span>
          </button>

          <!-- Loop Mode Button -->
          <button 
            class="control-btn" 
            [class.active]="player.loopMode() !== 'none'"
            (click)="player.toggleLoop()"
            [title]="'Repeat: ' + player.loopMode()">
            <span class="material-symbols-outlined">
              {{ player.loopMode() === 'one' ? 'repeat_one' : 'repeat' }}
            </span>
          </button>
        </div>

        <!-- Seek Timeline -->
        <div class="timeline-row">
          <span class="time-label">{{ player.formatTime(player.currentTime()) }}</span>
          
          <div class="slider-container">
            <input 
              type="range" 
              class="seek-slider" 
              min="0" 
              [max]="player.duration() || 100" 
              [value]="player.currentTime()" 
              (input)="onSeekChange($event)"
              [disabled]="!player.currentSong()"
            />
            <div 
              class="slider-fill" 
              [style.width.%]="player.progressPercent()">
            </div>
          </div>

          <span class="time-label">{{ player.formatTime(player.duration()) }}</span>
        </div>
      </div>

      <!-- Right: Volume & Extras -->
      <div class="player-extras">
        <button class="volume-btn" (click)="player.toggleMute()" title="Mute/Unmute">
          <span class="material-symbols-outlined">
            @if (player.isMuted() || player.volume() === 0) {
              volume_off
            } @else if (player.volume() < 0.5) {
              volume_down
            } @else {
              volume_up
            }
          </span>
        </button>

        <div class="volume-slider-container">
          <input 
            type="range" 
            class="volume-slider" 
            min="0" 
            max="1" 
            step="0.01" 
            [value]="player.isMuted() ? 0 : player.volume()" 
            (input)="onVolumeChange($event)"
          />
          <div 
            class="volume-fill" 
            [style.width.%]="(player.isMuted() ? 0 : player.volume()) * 100">
          </div>
        </div>

        <!-- Queue Drawer Toggle Button -->
        <button 
          class="queue-toggle-btn" 
          [class.active]="showQueue()"
          (click)="showQueue.update(v => !v)"
          [title]="player.playlist().length + ' tracks in queue'">
          <span class="material-symbols-outlined">queue_music</span>
          <span class="count">{{ player.playlist().length }}</span>
        </button>
      </div>
    </footer>
  `,
  styles: [`
    .player-bar {
      height: var(--player-height);
      background: rgba(18, 18, 24, 0.95);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-top: 1px solid var(--border-subtle);
      display: grid;
      grid-template-columns: 1fr 2fr 1fr;
      align-items: center;
      padding: 0 24px;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      user-select: none;
      animation: screenGliderUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    /* Track details (Left) */
    .track-details {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .thumb-wrapper {
      width: 54px;
      height: 54px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      flex-shrink: 0;
      background: var(--bg-card);
      box-shadow: var(--shadow-sm);
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;

      &.playing {
        border-radius: 50%;
        box-shadow: 0 0 18px rgba(30, 215, 96, 0.45);
        animation: spinVinyl 10s linear infinite;
      }
    }

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .thumb-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1f2937, #111827);
      color: var(--text-muted);

      .material-symbols-outlined {
        font-size: 24px;
      }
    }

    .track-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;

      .meta-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .title {
        font-size: 0.92rem;
        font-weight: 700;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .soundwave-mini {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 13px;
        flex-shrink: 0;

        span {
          width: 2.5px;
          background: var(--primary);
          border-radius: 1px;
          animation: miniSoundwave 0.8s infinite ease-in-out alternate;

          &:nth-child(1) { height: 4px; animation-delay: 0.1s; }
          &:nth-child(2) { height: 13px; animation-delay: 0.3s; }
          &:nth-child(3) { height: 7px; animation-delay: 0.18s; }
          &:nth-child(4) { height: 11px; animation-delay: 0.42s; }
        }
      }

      .artist-link {
        font-size: 0.78rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-decoration: none;

        &:hover {
          color: var(--primary);
          text-decoration: underline;
        }
      }
    }

    @keyframes miniSoundwave {
      0% { height: 3px; }
      100% { height: 13px; }
    }

    .bar-like-btn {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: 50%;
      transition: all 0.2s;
      flex-shrink: 0;

      &:hover {
        color: #fff;
        transform: scale(1.15);
      }

      &.liked {
        color: var(--accent-rose);
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    .empty-state {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-muted);
      font-size: 0.85rem;

      .icon {
        font-size: 22px;
      }
    }

    /* Controls (Center) */
    .player-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
    }

    .buttons-row {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .control-btn {
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      transition: all 0.2s;

      .material-symbols-outlined {
        font-size: 22px;
      }

      &:hover {
        color: #fff;
        transform: scale(1.1);
      }

      &.active {
        color: var(--primary);
      }
    }

    .play-main-btn {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #fff;
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      &:hover:not(:disabled) {
        background: var(--primary);
        transform: scale(1.1);
        box-shadow: 0 6px 20px rgba(30, 215, 96, 0.5);
      }

      &.is-active-playing {
        background: var(--primary);
        box-shadow: 0 0 20px rgba(30, 215, 96, 0.6);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .material-symbols-outlined {
        font-size: 28px;
      }
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 3px solid rgba(0, 0, 0, 0.2);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .timeline-row {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;

      .time-label {
        font-size: 0.72rem;
        color: var(--text-muted);
        font-variant-numeric: tabular-nums;
        width: 36px;
        text-align: center;
      }
    }

    .slider-container, .volume-slider-container {
      position: relative;
      flex: 1;
      display: flex;
      align-items: center;
    }

    .seek-slider, .volume-slider {
      width: 100%;
      position: relative;
      z-index: 2;
    }

    .slider-fill, .volume-fill {
      position: absolute;
      left: 0;
      height: 4px;
      background: linear-gradient(90deg, #1ed760, #00b4d8);
      border-radius: var(--radius-full);
      pointer-events: none;
      z-index: 1;
      transition: height 0.15s ease;
      box-shadow: 0 0 8px rgba(30, 215, 96, 0.4);

      .slider-container:hover &, .volume-slider-container:hover & {
        height: 6px;
      }
    }

    /* Extras (Right) */
    .player-extras {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 14px;
    }

    .volume-btn {
      color: var(--text-secondary);
      display: flex;
      align-items: center;

      &:hover {
        color: #fff;
      }

      .material-symbols-outlined {
        font-size: 22px;
      }
    }

    .volume-slider-container {
      width: 100px;
      flex: none;
    }

    .queue-toggle-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 18px; }
      .count { font-weight: 700; color: #fff; }

      &:hover, &.active {
        background: rgba(30, 215, 96, 0.15);
        border-color: rgba(30, 215, 96, 0.4);
        color: var(--primary);
        .count { color: var(--primary); }
      }
    }

    /* Queue Drawer */
    .queue-drawer {
      position: fixed;
      bottom: calc(var(--player-height) + 16px);
      right: 24px;
      width: 360px;
      max-height: 460px;
      background: rgba(24, 24, 32, 0.96);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8);
      z-index: 1050;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .queue-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-subtle);

      .queue-title-box {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;

        h4 { font-size: 0.95rem; font-weight: 700; }
        .queue-count { font-size: 0.78rem; color: var(--text-muted); }
        .material-symbols-outlined { color: var(--primary); font-size: 20px; }
      }

      .queue-close-btn {
        color: var(--text-muted);
        display: flex;
        align-items: center;
        &:hover { color: #fff; }
      }
    }

    .queue-list {
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .queue-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 0.15s;

      &:hover { background: rgba(255, 255, 255, 0.06); }

      &.active {
        background: rgba(30, 215, 96, 0.12);
        .q-title { color: var(--primary); font-weight: 700; }
      }

      .queue-idx {
        width: 20px;
        text-align: center;
        font-size: 0.75rem;
        color: var(--text-muted);
        .playing-icon { font-size: 16px; color: var(--primary); }
      }

      .queue-thumb {
        width: 36px;
        height: 36px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--bg-card);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        img { width: 100%; height: 100%; object-fit: cover; }
        .material-symbols-outlined { font-size: 18px; color: var(--text-muted); }
      }

      .queue-info {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .q-title {
          font-size: 0.84rem;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .q-artist {
          font-size: 0.74rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    @media (max-width: 768px) {
      .player-bar {
        grid-template-columns: 1fr auto;
        padding: 0 16px;
      }
      .player-extras {
        display: none;
      }
      .timeline-row {
        display: none;
      }
      .queue-drawer {
        right: 12px;
        left: 12px;
        width: auto;
      }
    }
  `]
})
export class PlayerBarComponent {
  readonly player = inject(AudioPlayerService);
  readonly songService = inject(SongService);
  readonly favs = inject(FavoritesService);

  readonly showQueue = signal<boolean>(false);
  readonly justLiked = signal<boolean>(false);

  toggleLikeWithAnim(song: Song) {
    this.favs.toggleLike(song);
    this.justLiked.set(true);
    setTimeout(() => this.justLiked.set(false), 450);
  }

  onSeekChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.player.seek(value);
  }

  onVolumeChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    this.player.setVolume(value);
  }
}
