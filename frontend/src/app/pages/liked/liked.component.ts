import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SongService } from '../../services/song.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { FavoritesService } from '../../services/favorites.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { Song } from '../../models/song.model';

@Component({
  selector: 'app-liked',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, HeaderComponent],
  template: `
    <div class="liked-layout">
      <!-- Left Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <app-header></app-header>

        <main class="liked-content">
          <!-- Back Link -->
          <div class="top-nav">
            <a routerLink="/" class="back-btn">
              <span class="material-symbols-outlined">arrow_back</span>
              <span>Back to Discover</span>
            </a>
          </div>

          <!-- Liked Songs Hero Banner -->
          <header class="liked-hero">
            <div class="heart-icon-box">
              <span class="material-symbols-outlined heart-icon filled">favorite</span>
            </div>

            <div class="hero-details">
              <span class="badge">PLAYLIST</span>
              <h1 class="hero-title">Liked Songs</h1>
              <p class="hero-sub">Your personal collection of favorite tracks on Samma3ni.</p>

              <div class="meta-row">
                <span class="count">{{ likedSongs().length }} {{ likedSongs().length === 1 ? 'song' : 'songs' }}</span>
              </div>

              @if (likedSongs().length > 0) {
                <div class="action-buttons">
                  <button class="btn btn-play-all" (click)="playAll()">
                    <span class="material-symbols-outlined filled">
                      {{ isLikedPlaying() ? 'pause' : 'play_arrow' }}
                    </span>
                    <span>{{ isLikedPlaying() ? 'Pause' : 'Play Liked Songs' }}</span>
                  </button>
                  <button class="btn btn-shuffle" (click)="shuffleAll()">
                    <span class="material-symbols-outlined">shuffle</span>
                    <span>Shuffle</span>
                  </button>
                </div>
              }
            </div>
          </header>

          <!-- Tracks List -->
          @if (likedSongs().length === 0) {
            <div class="empty-liked">
              <span class="material-symbols-outlined empty-icon">favorite_border</span>
              <h3>No liked songs yet</h3>
              <p>Click the heart icon on any song while listening to add it to your collection.</p>
              <a routerLink="/" class="btn btn-browse">Browse Music</a>
            </div>
          } @else {
            <section class="tracks-card">
              <table class="tracks-table">
                <thead>
                  <tr>
                    <th class="col-idx">#</th>
                    <th>Title & Artist</th>
                    <th>Album</th>
                    <th>Genre</th>
                    <th>Streams</th>
                    <th class="col-like"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (song of likedSongs(); track song.id; let i = $index) {
                    <tr 
                      class="track-row" 
                      [class.is-current]="player.currentSong()?.id === song.id"
                      (click)="playSong(song)">
                      
                      <td class="col-idx">
                        <span class="idx-text">{{ i + 1 }}</span>
                        <button class="play-cell-btn" (click)="$event.stopPropagation(); playSong(song)">
                          <span class="material-symbols-outlined">
                            {{ player.currentSong()?.id === song.id && player.isPlaying() ? 'pause' : 'play_arrow' }}
                          </span>
                        </button>
                      </td>

                      <td>
                        <div class="title-cell">
                          <div class="track-thumb">
                            @if (song.coverFile) {
                              <img [src]="songService.getCoverUrl(song.id)" alt="" />
                            } @else {
                              <span class="material-symbols-outlined">music_note</span>
                            }
                          </div>
                          <div class="title-meta">
                            <span class="track-title">{{ song.title }}</span>
                            <a 
                              [routerLink]="['/artist', song.artist]" 
                              class="artist-sub-link" 
                              (click)="$event.stopPropagation()">
                              {{ song.artist }}
                            </a>
                          </div>
                        </div>
                      </td>

                      <td>
                        @if (song.album) {
                          <a 
                            [routerLink]="['/album', song.album]" 
                            class="album-link" 
                            (click)="$event.stopPropagation()">
                            {{ song.album }}
                          </a>
                        } @else {
                          <span class="muted-text">-</span>
                        }
                      </td>

                      <td>
                        <span class="genre-pill">{{ song.genre || 'Other' }}</span>
                      </td>

                      <td class="plays-cell">
                        <span class="material-symbols-outlined stream-icon">headphones</span>
                        <span>{{ song.playCount | number }}</span>
                      </td>

                      <td class="col-like">
                        <button 
                          class="like-btn liked" 
                          (click)="$event.stopPropagation(); favs.toggleLike(song)"
                          title="Remove from Liked Songs">
                          <span class="material-symbols-outlined filled">favorite</span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </section>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .liked-layout {
      display: flex;
      height: 100vh;
      width: 100vw;
      background: var(--bg-darkest);
      overflow: hidden;
      position: relative;

      app-sidebar {
        animation: screenGliderLeft 0.75s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        z-index: 10;
        display: flex;
      }
    }

    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      background: var(--bg-base);
      animation: screenGliderRight 0.75s cubic-bezier(0.16, 1, 0.3, 1) backwards;

      app-header {
        animation: screenGliderDown 0.65s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      }
    }

    .liked-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 24px 36px calc(var(--player-height) + 40px);
    }

    .top-nav {
      margin-bottom: 20px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--text-secondary);
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      transition: all 0.2s;

      &:hover { color: #fff; background: rgba(255, 255, 255, 0.08); }
    }

    .liked-hero {
      display: flex;
      align-items: center;
      gap: 32px;
      padding: 40px;
      border-radius: var(--radius-lg);
      margin-bottom: 36px;
      background: linear-gradient(135deg, rgba(236, 72, 153, 0.3) 0%, rgba(139, 92, 246, 0.2) 50%, rgba(20, 20, 26, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: var(--shadow-md);
    }

    .heart-icon-box {
      width: 160px;
      height: 160px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 16px 36px rgba(236, 72, 153, 0.35);
      flex-shrink: 0;

      .heart-icon {
        font-size: 80px;
        color: #fff;
      }
    }

    .hero-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .badge {
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent-rose);
      letter-spacing: 1px;
    }

    .hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: 2.8rem;
      font-weight: 900;
      letter-spacing: -1px;
      color: #fff;
      line-height: 1.1;
    }

    .hero-sub {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }

    .meta-row {
      margin-top: 4px;
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 600;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 14px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 26px;
      border-radius: var(--radius-full);
      font-size: 0.92rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      outline: none;

      &.btn-play-all {
        background: var(--primary);
        color: #000;
        box-shadow: 0 4px 20px rgba(30, 215, 96, 0.4);
        &:hover { background: var(--primary-hover); transform: scale(1.04); }
      }

      &.btn-shuffle {
        border: 1px solid var(--border-subtle);
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
        &:hover { background: rgba(255, 255, 255, 0.12); }
      }

      &.btn-browse {
        background: var(--primary);
        color: #000;
        text-decoration: none;
        margin-top: 8px;
        &:hover { background: var(--primary-hover); }
      }
    }

    .empty-liked {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--border-subtle);
      max-width: 480px;
      margin: 40px auto;
      text-align: center;
      gap: 12px;

      .empty-icon { font-size: 54px; color: var(--text-muted); }
      h3 { font-size: 1.4rem; font-weight: 800; color: #fff; }
      p { font-size: 0.9rem; color: var(--text-secondary); }
    }

    .tracks-card {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
    }

    .tracks-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;

      th {
        padding: 12px 18px;
        color: var(--text-muted);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--border-subtle);
      }

      .track-row {
        cursor: pointer;
        transition: background 0.15s;

        td {
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        &:hover {
          background: var(--bg-card-hover);
          .idx-text { display: none; }
          .play-cell-btn { display: flex; }
        }

        &.is-current {
          background: rgba(30, 215, 96, 0.08);
          .track-title { color: var(--primary); }
        }
      }
    }

    .col-idx {
      width: 50px;
      text-align: center;
      position: relative;
    }

    .idx-text { color: var(--text-muted); font-size: 0.85rem; }

    .play-cell-btn {
      display: none;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin: 0 auto;
      &:hover { color: var(--primary); transform: scale(1.15); }
      .material-symbols-outlined { font-size: 20px; }
    }

    .title-cell {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .track-thumb {
      width: 40px;
      height: 40px;
      border-radius: 4px;
      overflow: hidden;
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
      img { width: 100%; height: 100%; object-fit: cover; }
      .material-symbols-outlined { font-size: 20px; color: var(--text-muted); }
    }

    .title-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .track-title { font-weight: 600; color: #fff; }

    .artist-sub-link {
      font-size: 0.8rem;
      color: var(--text-secondary);
      text-decoration: none;
      &:hover { color: var(--primary); text-decoration: underline; }
    }

    .album-link {
      color: var(--text-secondary);
      text-decoration: none;
      &:hover { color: var(--primary); text-decoration: underline; }
    }

    .muted-text { color: var(--text-muted); }

    .genre-pill {
      font-size: 0.72rem;
      padding: 3px 9px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-secondary);
    }

    .plays-cell {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      .stream-icon { font-size: 16px; }
    }

    .col-like {
      width: 44px;
      text-align: right;
    }

    .like-btn {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 50%;
      cursor: pointer;

      &.liked { color: var(--accent-rose); }
      .material-symbols-outlined { font-size: 20px; }
    }

    @media (max-width: 768px) {
      .liked-hero { flex-direction: column; text-align: center; }
      .hero-details { align-items: center; }
      .action-buttons { justify-content: center; }
      .hero-title { font-size: 2.2rem; }
      .liked-content { padding: 16px; }
    }
  `]
})
export class LikedComponent implements OnInit {
  readonly songService = inject(SongService);
  readonly player = inject(AudioPlayerService);
  readonly favs = inject(FavoritesService);

  readonly allSongs = signal<Song[]>([]);

  readonly likedSongs = computed(() => {
    const ids = this.favs.likedIds();
    return this.allSongs().filter(s => ids.includes(s.id));
  });

  ngOnInit() {
    this.songService.getAllSongs().subscribe({
      next: (songs) => this.allSongs.set(songs),
      error: () => {}
    });
  }

  readonly isLikedPlaying = computed(() => {
    const cur = this.player.currentSong();
    return this.player.isPlaying() && !!cur && this.likedSongs().some(s => s.id === cur.id);
  });

  playSong(song: Song) {
    this.player.playSong(song, this.likedSongs());
  }

  playAll() {
    const list = this.likedSongs();
    if (list.length === 0) return;
    const cur = this.player.currentSong();
    if (cur && list.some(s => s.id === cur.id)) {
      this.player.togglePlay();
    } else {
      this.player.playSong(list[0], list);
    }
  }

  shuffleAll() {
    const list = [...this.likedSongs()].sort(() => Math.random() - 0.5);
    if (list.length > 0) {
      this.player.playSong(list[0], list);
    }
  }
}
