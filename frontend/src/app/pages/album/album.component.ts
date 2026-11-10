import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SongService } from '../../services/song.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { FavoritesService } from '../../services/favorites.service';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { Song } from '../../models/song.model';
import { ArtistAlbumService } from '../../services/artist-album.service';

@Component({
  selector: 'app-album',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, HeaderComponent],
  template: `
    <div class="album-layout">
      <!-- Left Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <app-header></app-header>

        <main class="album-content">
          <!-- Back Link -->
          <div class="top-nav">
            <a routerLink="/" class="back-btn">
              <span class="material-symbols-outlined">arrow_back</span>
              <span>Back to Discover</span>
            </a>
          </div>

          <!-- Album Hero Header -->
          <header class="album-hero">
            <div class="hero-bg-blur" [style.background-image]="'url(' + getAlbumCover() + ')'"></div>
            <div class="hero-content">
              <div class="album-cover-box">
                @if (getAlbumCover()) {
                  <div class="cover-backdrop" [style.background-image]="'url(' + getAlbumCover() + ')'"></div>
                  <img [src]="getAlbumCover()" [alt]="albumTitle()" class="cover-img" />
                } @else {
                  <div class="cover-fallback">
                    <span class="material-symbols-outlined">album</span>
                  </div>
                }
              </div>

              <div class="album-details">
                <span class="album-type-badge">ALBUM</span>
                <h1 class="album-title">{{ albumTitle() }}</h1>

                <div class="album-meta-row">
                  @if (albumArtist()) {
                    <a [routerLink]="['/artist', albumArtist()]" class="artist-pill-link">
                      <span class="material-symbols-outlined">person</span>
                      <span>{{ albumArtist() }}</span>
                    </a>
                    <span class="sep">•</span>
                  }
                  @if (getAlbumYear()) {
                    <span class="meta-item">{{ getAlbumYear() }}</span>
                    <span class="sep">•</span>
                  }
                  <span class="meta-item">{{ albumSongs().length }} {{ albumSongs().length === 1 ? 'track' : 'tracks' }}</span>
                  <span class="sep">•</span>
                  <span class="meta-item">{{ totalStreams() | number }} streams</span>
                </div>

                <div class="action-buttons">
                  <button class="btn btn-play-all" (click)="playAll()">
                    <span class="material-symbols-outlined filled">
                      {{ isAlbumPlaying() ? 'pause' : 'play_arrow' }}
                    </span>
                    <span>{{ isAlbumPlaying() ? 'Pause' : 'Play Album' }}</span>
                  </button>
                  <button class="btn btn-shuffle" (click)="shuffleAll()">
                    <span class="material-symbols-outlined">shuffle</span>
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <!-- Tracklist Section -->
          <section class="section tracks-section">
            <div class="tracks-table-card">
              <table class="tracks-table">
                <thead>
                  <tr>
                    <th class="col-idx">#</th>
                    <th>Title</th>
                    <th>Artist</th>
                    <th>Streams</th>
                    <th class="col-like"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (song of albumSongs(); track song.id; let i = $index) {
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
                        <span class="track-title">{{ song.title }}</span>
                      </td>

                      <td>
                        <a 
                          [routerLink]="['/artist', song.artist]" 
                          class="artist-link" 
                          (click)="$event.stopPropagation()">
                          {{ song.artist }}
                        </a>
                      </td>

                      <td class="plays-cell">
                        <span class="material-symbols-outlined stream-icon">headphones</span>
                        <span>{{ song.playCount | number }}</span>
                      </td>

                      <td class="col-like">
                        <button 
                          class="like-btn" 
                          [class.liked]="favs.isLiked(song.id)"
                          (click)="$event.stopPropagation(); favs.toggleLike(song)"
                          [title]="favs.isLiked(song.id) ? 'Unlike' : 'Like'">
                          <span class="material-symbols-outlined" [class.filled]="favs.isLiked(song.id)">
                            favorite
                          </span>
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <!-- About the Album / Liner Notes -->
          @if (getAlbumDescription()) {
            <section class="section about-section">
              <h2 class="section-title">About {{ albumTitle() }}</h2>
              <div class="about-card">
                <div class="about-bg-blur" [style.background-image]="'url(' + getAlbumCover() + ')'"></div>
                <div class="about-content">
                  <div class="about-meta-head">
                    <div class="about-avatar-sml">
                      @if (getAlbumCover()) {
                        <img [src]="getAlbumCover()" [alt]="albumTitle()" />
                      } @else {
                        <span class="material-symbols-outlined">album</span>
                      }
                    </div>
                    <div class="about-identity">
                      <div class="verified-tag">
                        <span class="material-symbols-outlined check-icon">album</span>
                        <span>Album Release</span>
                      </div>
                      <h3 class="about-artist-name">{{ albumTitle() }}</h3>
                      <span class="about-stats-count">{{ albumArtist() }} @if (getAlbumYear()) { • {{ getAlbumYear() }} }</span>
                    </div>
                  </div>

                  <p class="about-bio-body">{{ getAlbumDescription() }}</p>
                </div>
              </div>
            </section>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .album-layout {
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

    .album-content {
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

    /* Album Hero */
    .album-hero {
      position: relative;
      border-radius: var(--radius-lg);
      padding: 40px;
      margin-bottom: 36px;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(30, 215, 96, 0.15) 50%, rgba(20, 20, 26, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: var(--shadow-md);
    }

    .hero-bg-blur {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.18;
      filter: blur(40px);
      transform: scale(1.1);
      pointer-events: none;
    }

    .hero-content {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 32px;
    }

    .album-cover-box {
      width: 200px;
      height: 200px;
      border-radius: 20px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.7);
      border: 3px solid rgba(255, 255, 255, 0.15);
      flex-shrink: 0;
      background: #0d0d12;
      display: flex;
      align-items: center;
      justify-content: center;

      .cover-backdrop {
        position: absolute;
        inset: -12px;
        background-size: cover;
        background-position: center;
        filter: blur(22px);
        opacity: 0.55;
        transform: scale(1.15);
        pointer-events: none;
      }

      .cover-img {
        position: relative;
        z-index: 2;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 4px;
      }

      .cover-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1f2937, #111827);
        color: rgba(255, 255, 255, 0.6);
        .material-symbols-outlined { font-size: 80px; }
      }
    }

    .album-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .album-type-badge {
      font-size: 0.75rem;
      font-weight: 800;
      letter-spacing: 1.2px;
      color: var(--primary);
    }

    .album-title {
      font-family: 'Outfit', sans-serif;
      font-size: 2.6rem;
      font-weight: 900;
      letter-spacing: -0.8px;
      color: #fff;
      line-height: 1.15;
    }

    .album-meta-row {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-secondary);
      font-size: 0.92rem;
      margin-top: 4px;

      .artist-pill-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #fff;
        font-weight: 700;
        text-decoration: none;

        .material-symbols-outlined { font-size: 18px; color: var(--primary); }
        &:hover { text-decoration: underline; color: var(--primary); }
      }

      .sep { color: var(--text-muted); }
      .meta-item { color: var(--text-secondary); }
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
    }

    /* Section Styling */
    .tracks-table-card {
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

    .idx-text {
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    .play-cell-btn {
      display: none;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin: 0 auto;
      &:hover { color: var(--primary); transform: scale(1.15); }
      .material-symbols-outlined { font-size: 20px; }
    }

    .track-title {
      font-weight: 600;
      color: #fff;
    }

    .artist-link {
      color: var(--text-secondary);
      text-decoration: none;
      &:hover { color: var(--primary); text-decoration: underline; }
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

      &:hover { color: #fff; }
      &.liked { color: var(--accent-rose); }
      .material-symbols-outlined { font-size: 18px; }
    }

    /* Spotify-Style About Album Section */
    .about-card {
      position: relative;
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      padding: 36px 40px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
      transition: border-color 0.2s;
      margin-top: 24px;

      &:hover {
        border-color: rgba(255, 255, 255, 0.2);
      }
    }

    .about-bg-blur {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.12;
      filter: blur(50px);
      transform: scale(1.1);
      pointer-events: none;
    }

    .about-content {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .about-meta-head {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .about-avatar-sml {
      width: 72px;
      height: 72px;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid rgba(255, 255, 255, 0.2);
      background: #0d0d12;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;

      img { width: 100%; height: 100%; object-fit: contain; }
      .material-symbols-outlined { font-size: 36px; color: var(--text-muted); }
    }

    .verified-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: var(--primary);
      font-size: 0.76rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;

      .check-icon { font-size: 15px; }
    }

    .about-artist-name {
      font-size: 1.4rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 2px;
    }

    .about-stats-count {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .about-bio-body {
      font-size: 0.98rem;
      line-height: 1.75;
      color: rgba(255, 255, 255, 0.85);
      background: rgba(0, 0, 0, 0.35);
      padding: 20px 24px;
      border-radius: var(--radius-md);
      border-left: 4px solid var(--primary);
      margin: 0;
      white-space: pre-line;
    }

    @media (max-width: 768px) {
      .hero-content { flex-direction: column; text-align: center; }
      .album-details { align-items: center; }
      .album-meta-row { justify-content: center; }
      .album-title { font-size: 2rem; }
      .album-content { padding: 16px; }
    }
  `]
})
export class AlbumComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly songService = inject(SongService);
  readonly player = inject(AudioPlayerService);
  readonly favs = inject(FavoritesService);
  readonly artistAlbumService = inject(ArtistAlbumService);

  readonly albumTitle = signal<string>('');
  readonly allSongs = signal<Song[]>([]);

  readonly albumSongs = computed(() => {
    const title = this.albumTitle().toLowerCase().trim();
    if (!title) return [];
    return this.allSongs().filter(s => (s.album || '').toLowerCase().trim() === title);
  });

  readonly albumArtist = computed(() => {
    const list = this.albumSongs();
    return list.length > 0 ? list[0].artist : '';
  });

  readonly totalStreams = computed(() => {
    return this.albumSongs().reduce((sum, s) => sum + s.playCount, 0);
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const name = params.get('name') || '';
      this.albumTitle.set(decodeURIComponent(name));
      this.loadAll();
    });
  }

  loadAll() {
    this.songService.getAllSongs().subscribe({
      next: (songs) => this.allSongs.set(songs),
      error: () => {}
    });
  }

  getAlbumCover(): string | null {
    const custom = this.artistAlbumService.getAlbumCover(this.albumTitle());
    if (custom) return custom;
    const firstWithCover = this.albumSongs().find(s => !!s.coverFile);
    return firstWithCover ? this.songService.getCoverUrl(firstWithCover.id) : null;
  }

  getAlbumDescription(): string {
    return this.artistAlbumService.getAlbumDescription(this.albumTitle());
  }

  getAlbumYear(): string {
    return this.artistAlbumService.getAlbumYear(this.albumTitle());
  }

  readonly isAlbumPlaying = computed(() => {
    const cur = this.player.currentSong();
    return this.player.isPlaying() && !!cur && this.albumSongs().some(s => s.id === cur.id);
  });

  playSong(song: Song) {
    this.player.playSong(song, this.albumSongs());
  }

  playAll() {
    const list = this.albumSongs();
    if (list.length === 0) return;
    const cur = this.player.currentSong();
    if (cur && list.some(s => s.id === cur.id)) {
      this.player.togglePlay();
    } else {
      this.player.playSong(list[0], list);
    }
  }

  shuffleAll() {
    const list = [...this.albumSongs()].sort(() => Math.random() - 0.5);
    if (list.length > 0) {
      this.player.playSong(list[0], list);
    }
  }
}
