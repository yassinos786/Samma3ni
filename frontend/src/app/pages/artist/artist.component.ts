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
  selector: 'app-artist',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent, HeaderComponent],
  template: `
    <div class="artist-layout">
      <!-- Left Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <app-header></app-header>

        <main class="artist-content">
          <!-- Back Link -->
          <div class="top-nav">
            <a routerLink="/" class="back-btn">
              <span class="material-symbols-outlined">arrow_back</span>
              <span>Back to Discover</span>
            </a>
          </div>

          <!-- Artist Hero Header -->
          <header class="artist-hero">
            <div class="hero-bg-blur" [style.background-image]="'url(' + getArtistAvatar() + ')'"></div>
            <div class="hero-content">
              <div class="artist-avatar-box">
                @if (getArtistAvatar()) {
                  <div class="avatar-backdrop" [style.background-image]="'url(' + getArtistAvatar() + ')'"></div>
                  <img [src]="getArtistAvatar()" [alt]="artistName()" class="avatar-img" />
                } @else {
                  <div class="avatar-fallback">
                    <span class="material-symbols-outlined">person</span>
                  </div>
                }
              </div>

              <div class="artist-details">
                <div class="verified-badge">
                  <span class="material-symbols-outlined check-icon">verified</span>
                  <span>Verified Artist</span>
                </div>
                <h1 class="artist-name">{{ artistName() }}</h1>

                <div class="artist-metrics">
                  <div class="metric">
                    <span class="val">{{ totalStreams() | number }}</span>
                    <span class="lbl">Total Streams</span>
                  </div>
                  <span class="sep">•</span>
                  <div class="metric">
                    <span class="val">{{ artistSongs().length }}</span>
                    <span class="lbl">Tracks</span>
                  </div>
                  <span class="sep">•</span>
                  <div class="metric">
                    <span class="val">{{ albums().length }}</span>
                    <span class="lbl">Releases</span>
                  </div>
                </div>

                <div class="action-buttons">
                  <button class="btn btn-play-all" (click)="playAll()">
                    <span class="material-symbols-outlined filled">
                      {{ isArtistPlaying() ? 'pause' : 'play_arrow' }}
                    </span>
                    <span>{{ isArtistPlaying() ? 'Pause' : 'Play All Tracks' }}</span>
                  </button>
                  <button class="btn btn-shuffle" (click)="shuffleAll()">
                    <span class="material-symbols-outlined">shuffle</span>
                    <span>Shuffle</span>
                  </button>
                </div>
              </div>
            </div>
          </header>

          <!-- Popular Tracks Section -->
          <section class="section tracks-section">
            <h2 class="section-title">Popular Tracks</h2>

            <div class="tracks-table-card">
              <table class="tracks-table">
                <thead>
                  <tr>
                    <th class="col-idx">#</th>
                    <th>Title</th>
                    <th>Album</th>
                    <th>Streams</th>
                    <th class="col-like"></th>
                  </tr>
                </thead>
                <tbody>
                  @for (song of artistSongs(); track song.id; let i = $index) {
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
                          <span class="track-title">{{ song.title }}</span>
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

          <!-- Albums / Releases by this Artist -->
          @if (albums().length > 0) {
            <section class="section albums-section">
              <h2 class="section-title">Discography & Albums</h2>
              <div class="albums-grid">
                @for (alb of albums(); track alb.title) {
                  <a [routerLink]="['/album', alb.title]" class="album-card">
                    <div class="album-cover-box">
                      @if (alb.coverUrl) {
                        <img [src]="alb.coverUrl" [alt]="alb.title" />
                      } @else {
                        <div class="album-fallback">
                          <span class="material-symbols-outlined">album</span>
                        </div>
                      }
                      <button class="album-play-icon" (click)="$event.preventDefault(); playAlbum(alb.title)">
                        <span class="material-symbols-outlined filled">play_arrow</span>
                      </button>
                    </div>
                    <h4 class="album-name">{{ alb.title }}</h4>
                    <span class="album-sub">{{ alb.count }} {{ alb.count === 1 ? 'track' : 'tracks' }}</span>
                  </a>
                }
              </div>
            </section>
          }

          <!-- About the Artist Section (Spotify Style) -->
          @if (getArtistBio()) {
            <section class="section about-section">
              <h2 class="section-title">About {{ artistName() }}</h2>
              <div class="about-card">
                <div class="about-bg-blur" [style.background-image]="'url(' + getArtistAvatar() + ')'"></div>
                <div class="about-content">
                  <div class="about-meta-head">
                    <div class="about-avatar-sml">
                      @if (getArtistAvatar()) {
                        <img [src]="getArtistAvatar()" [alt]="artistName()" />
                      } @else {
                        <span class="material-symbols-outlined">person</span>
                      }
                    </div>
                    <div class="about-identity">
                      <div class="verified-tag">
                        <span class="material-symbols-outlined check-icon">verified</span>
                        <span>Verified Artist Profile</span>
                      </div>
                      <h3 class="about-artist-name">{{ artistName() }}</h3>
                      <span class="about-stats-count">{{ totalStreams() | number }} Total Streams on Samma3ni</span>
                    </div>
                  </div>

                  <p class="about-bio-body">{{ getArtistBio() }}</p>
                </div>
              </div>
            </section>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .artist-layout {
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

    .artist-content {
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

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
      }
    }

    /* Artist Hero */
    .artist-hero {
      position: relative;
      border-radius: var(--radius-lg);
      padding: 40px;
      margin-bottom: 36px;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(30, 215, 96, 0.2) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(20, 20, 26, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: var(--shadow-md);
    }

    .hero-bg-blur {
      position: absolute;
      inset: 0;
      background-size: cover;
      background-position: center;
      opacity: 0.15;
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

    .artist-avatar-box {
      width: 190px;
      height: 190px;
      border-radius: 22px;
      overflow: hidden;
      position: relative;
      box-shadow: 0 16px 36px rgba(0, 0, 0, 0.65);
      border: 3px solid rgba(255, 255, 255, 0.15);
      flex-shrink: 0;
      background: #0d0d12;
      display: flex;
      align-items: center;
      justify-content: center;

      .avatar-backdrop {
        position: absolute;
        inset: -12px;
        background-size: cover;
        background-position: center;
        filter: blur(22px);
        opacity: 0.55;
        transform: scale(1.15);
        pointer-events: none;
      }

      .avatar-img {
        position: relative;
        z-index: 2;
        max-width: 100%;
        max-height: 100%;
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 4px;
      }

      .avatar-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #3b82f6, #1e1b4b);
        color: rgba(255, 255, 255, 0.7);
        .material-symbols-outlined { font-size: 80px; }
      }
    }

    .artist-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .verified-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--accent-cyan);
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;

      .check-icon {
        font-size: 18px;
      }
    }

    .artist-name {
      font-family: 'Outfit', sans-serif;
      font-size: 3.4rem;
      font-weight: 900;
      letter-spacing: -1px;
      color: #fff;
      line-height: 1.1;
      text-shadow: 0 4px 18px rgba(0, 0, 0, 0.4);
    }

    .artist-metrics {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-secondary);
      font-size: 0.92rem;
      margin-top: 6px;

      .metric {
        display: flex;
        align-items: baseline;
        gap: 6px;

        .val { font-weight: 800; color: #fff; }
        .lbl { font-size: 0.82rem; color: var(--text-muted); }
      }

      .sep { color: var(--text-muted); font-size: 0.6rem; }
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-top: 20px;
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
    .section {
      margin-bottom: 36px;
    }

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 16px;
    }

    /* Table */
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
          padding: 12px 18px;
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

    .track-title {
      font-weight: 600;
      color: #fff;
    }

    .album-link {
      color: var(--text-secondary);
      text-decoration: none;
      &:hover { color: var(--primary); text-decoration: underline; }
    }

    .muted-text { color: var(--text-muted); }

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

    /* Albums Grid */
    .albums-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 20px;
    }

    .album-card {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-decoration: none;
      border: 1px solid var(--border-subtle);
      transition: all 0.2s;

      &:hover {
        background: var(--bg-card-hover);
        transform: translateY(-4px);
        box-shadow: var(--shadow-md);

        .album-play-icon {
          opacity: 1;
          transform: translateY(0);
        }
      }
    }

    .album-cover-box {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: var(--radius-sm);
      overflow: hidden;
      background: #111;
      position: relative;

      img { width: 100%; height: 100%; object-fit: cover; }

      .album-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1e1e24, #0f0f13);
        .material-symbols-outlined { font-size: 54px; color: var(--text-muted); }
      }
    }

    .album-play-icon {
      position: absolute;
      right: 12px;
      bottom: 12px;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--primary);
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      opacity: 0;
      transform: translateY(8px);
      transition: all 0.25s ease;
      z-index: 2;

      &:hover {
        background: var(--primary-hover);
        transform: scale(1.1) !important;
      }
    }

    .album-name {
      font-size: 0.95rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .album-sub {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    /* Spotify-Style About Section */
    .about-card {
      position: relative;
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
      padding: 36px 40px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
      transition: border-color 0.2s;

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
      color: var(--accent-cyan);
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
      color: var(--primary);
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
      .artist-details { align-items: center; }
      .artist-metrics { justify-content: center; }
      .artist-name { font-size: 2rem; }
      .artist-content { padding: 16px; }
    }
  `]
})
export class ArtistComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly songService = inject(SongService);
  readonly player = inject(AudioPlayerService);
  readonly favs = inject(FavoritesService);
  readonly artistAlbumService = inject(ArtistAlbumService);

  readonly artistName = signal<string>('');
  readonly allSongs = signal<Song[]>([]);

  readonly artistSongs = computed(() => {
    const name = this.artistName().toLowerCase().trim();
    if (!name) return [];
    return this.allSongs().filter(s => s.artist.toLowerCase().trim().includes(name) || name.includes(s.artist.toLowerCase().trim()));
  });

  readonly totalStreams = computed(() => {
    return this.artistSongs().reduce((sum, s) => sum + s.playCount, 0);
  });

  readonly albums = computed(() => {
    const list = this.artistSongs();
    const map = new Map<string, { title: string; count: number; coverUrl: string | null }>();

    for (const s of list) {
      const albumTitle = s.album ? s.album.trim() : 'Singles & EPs';
      const customCover = this.artistAlbumService.getAlbumCover(albumTitle);
      if (!map.has(albumTitle)) {
        map.set(albumTitle, {
          title: albumTitle,
          count: 1,
          coverUrl: customCover || (s.coverFile ? this.songService.getCoverUrl(s.id) : null)
        });
      } else {
        const item = map.get(albumTitle)!;
        item.count++;
      }
    }

    return Array.from(map.values());
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const name = params.get('name') || '';
      this.artistName.set(decodeURIComponent(name));
      this.loadAll();
    });
  }

  loadAll() {
    this.songService.getAllSongs().subscribe({
      next: (songs) => this.allSongs.set(songs),
      error: () => {}
    });
  }

  getArtistAvatar(): string | null {
    const custom = this.artistAlbumService.getArtistAvatar(this.artistName());
    if (custom) return custom;
    const firstWithCover = this.artistSongs().find(s => !!s.coverFile);
    return firstWithCover ? this.songService.getCoverUrl(firstWithCover.id) : null;
  }

  getArtistBio(): string {
    return this.artistAlbumService.getArtistBio(this.artistName());
  }

  readonly isArtistPlaying = computed(() => {
    const cur = this.player.currentSong();
    return this.player.isPlaying() && !!cur && this.artistSongs().some(s => s.id === cur.id);
  });

  playSong(song: Song) {
    this.player.playSong(song, this.artistSongs());
  }

  playAll() {
    const list = this.artistSongs();
    if (list.length === 0) return;
    const cur = this.player.currentSong();
    if (cur && list.some(s => s.id === cur.id)) {
      this.player.togglePlay();
    } else {
      this.player.playSong(list[0], list);
    }
  }

  shuffleAll() {
    const list = [...this.artistSongs()].sort(() => Math.random() - 0.5);
    if (list.length > 0) {
      this.player.playSong(list[0], list);
    }
  }

  playAlbum(albumTitle: string) {
    const albumTracks = this.artistSongs().filter(s => (s.album || 'Singles & EPs') === albumTitle);
    if (albumTracks.length > 0) {
      this.player.playSong(albumTracks[0], albumTracks);
    }
  }
}
