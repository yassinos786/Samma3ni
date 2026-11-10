import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { HeaderComponent } from '../../components/header/header.component';
import { SongCardComponent } from '../../components/song-card/song-card.component';
import { SongService } from '../../services/song.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { FavoritesService } from '../../services/favorites.service';
import { ArtistAlbumService } from '../../services/artist-album.service';
import { Song } from '../../models/song.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SidebarComponent,
    HeaderComponent,
    SongCardComponent
  ],
  template: `
    <div class="home-layout">
      <!-- Left Public Sidebar -->
      <app-sidebar 
        [activeTab]="activeTab()" 
        [selectedGenre]="selectedGenre()" 
        (tabChange)="onTabChange($event)" 
        (genreChange)="onGenreChange($event)">
      </app-sidebar>

      <!-- Main Public View Area -->
      <div class="main-wrapper">
        <!-- Clean Public Top Header -->
        <app-header 
          [searchQuery]="searchQuery()" 
          (searchChange)="onSearchChange($event)">
        </app-header>

        <!-- Scrollable Music Catalog -->
        <main class="main-content">
          <!-- Hero Banner -->
          @if (activeTab() === 'discover' && !searchQuery()) {
            <section class="hero-banner">
              <div class="hero-gradient-overlay"></div>
              <div class="hero-content">
                <span class="greeting-badge">{{ getGreeting() }}</span>
                <h1 class="hero-title">Experience music without limits.</h1>
                <p class="hero-desc">Stream your favorite high-fidelity audio tracks with seamless playback and smart seeking.</p>

              
              </div>

              
            </section>
          }

          <!-- Horizontal Genre Chips Filter Bar -->
          <div class="genre-horizontal-bar">
            @for (g of genres; track g) {
              <button 
                class="genre-chip-bar" 
                [class.selected]="selectedGenre() === g"
                (click)="onGenreChange(g)">
                {{ g }}
              </button>
            }
          </div>

          <!-- Catalog Header & Controls -->
          <section class="catalog-section">
            <div class="catalog-header">
              <div class="catalog-title-box">
                @if (searchQuery()) {
                  <h2 class="section-title">Search Results for "{{ searchQuery() }}"</h2>
                  <span class="track-count">{{ filteredSongs().length }} found</span>
                } @else if (selectedGenre() !== 'All') {
                  <h2 class="section-title">{{ selectedGenre() }} Tracks</h2>
                  <span class="track-count">{{ filteredSongs().length }} songs</span>
                } @else if (activeTab() === 'popular') {
                  <h2 class="section-title">Trending & Most Streamed</h2>
                  <span class="track-count">{{ filteredSongs().length }} songs</span>
                } @else {
                  <h2 class="section-title">Discover Music</h2>
                  <span class="track-count">{{ filteredSongs().length }} songs available</span>
                }
              </div>

              <!-- View Switcher -->
              <div class="view-controls">
                <button 
                  class="view-btn" 
                  [class.active]="viewMode() === 'grid'" 
                  (click)="viewMode.set('grid')"
                  title="Grid View">
                  <span class="material-symbols-outlined">grid_view</span>
                </button>
                <button 
                  class="view-btn" 
                  [class.active]="viewMode() === 'list'" 
                  (click)="viewMode.set('list')"
                  title="List View">
                  <span class="material-symbols-outlined">view_list</span>
                </button>
              </div>
            </div>

            <!-- Loading State -->
            @if (isLoading()) {
              <div class="pro-hologram-spinner">
                <div class="hologram-stage">
                  <div class="radar-ring r1"></div>
                  <div class="radar-ring r2"></div>
                  <div class="radar-ring r3"></div>
                  <div class="gyro-outer"></div>
                  <div class="gyro-inner"></div>
                  <div class="hologram-disc">
                    <span class="material-symbols-outlined disc-core-icon">graphic_eq</span>
                  </div>
                  <div class="satellite-particle sat-1"></div>
                  <div class="satellite-particle sat-2"></div>
                </div>
                <div class="hologram-meta">
                  <span class="loading-tech-text">SYNCHRONIZING AUDIO REPOSITORY</span>
                  <span class="loading-sub-text">Hi-Fi FLAC Streams • Spatial 3D Engine • 320 kbps</span>
                </div>
              </div>
            }

            <!-- Empty State -->
            @if (!isLoading() && filteredSongs().length === 0) {
              <div class="empty-state">
                <div class="empty-icon-circle">
                  <span class="material-symbols-outlined">library_music</span>
                </div>
                <h3>No songs found</h3>
                @if (searchQuery()) {
                  <p>No tracks match "{{ searchQuery() }}". Try searching for another artist or song.</p>
                  <button class="btn btn-outline" (click)="searchQuery.set('')">Clear Search</button>
                } @else {
                  <p>No songs found in this category. Select another genre or check back later!</p>
                  <button class="btn btn-outline" (click)="selectedGenre.set('All')">View All Tracks</button>
                }
              </div>
            }

            <!-- Grid View -->
            @if (!isLoading() && filteredSongs().length > 0 && viewMode() === 'grid') {
              <div class="songs-grid">
                @for (song of filteredSongs(); track song.id) {
                  <app-song-card 
                    [song]="song" 
                    (play)="onPlaySong($event)">
                  </app-song-card>
                }
              </div>
            }

            <!-- List View Table -->
            @if (!isLoading() && filteredSongs().length > 0 && viewMode() === 'list') {
              <div class="songs-list-container">
                <table class="songs-list-table">
                  <thead>
                    <tr>
                      <th class="col-num">#</th>
                      <th class="col-main">Title</th>
                      <th class="col-album">Album</th>
                      <th class="col-genre">Genre</th>
                      <th class="col-plays">Streams</th>
                      <th class="col-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (song of filteredSongs(); track song.id; let idx = $index) {
                      <tr 
                        class="list-row" 
                        [class.is-current]="player.currentSong()?.id === song.id"
                        (click)="onPlaySong(song)">
                        
                        <td class="col-num">
                          <span class="track-number">{{ idx + 1 }}</span>
                          <button class="row-play-btn" (click)="$event.stopPropagation(); onPlaySong(song)">
                            <span class="material-symbols-outlined">
                              {{ player.currentSong()?.id === song.id && player.isPlaying() ? 'pause' : 'play_arrow' }}
                            </span>
                          </button>
                        </td>

                        <td class="col-main">
                          <div class="title-cell">
                            <div class="row-thumb">
                              @if (song.coverFile) {
                                <img [src]="songService.getCoverUrl(song.id)" alt="" />
                              } @else {
                                <span class="material-symbols-outlined">music_note</span>
                              }
                            </div>
                            <div class="title-meta">
                              <span class="row-title">{{ song.title }}</span>
                              <a [routerLink]="['/artist', song.artist]" class="row-artist-link" (click)="$event.stopPropagation()">{{ song.artist }}</a>
                            </div>
                          </div>
                        </td>

                        <td class="col-album">
                          @if (song.album) {
                            <a [routerLink]="['/album', song.album]" class="row-album-link" (click)="$event.stopPropagation()">{{ song.album }}</a>
                          } @else {
                            <span>-</span>
                          }
                        </td>
                        
                        <td class="col-genre">
                          <span class="genre-chip-small">{{ song.genre || 'Other' }}</span>
                        </td>

                        <td class="col-plays">
                          <span class="material-symbols-outlined headphone-icon">headphones</span>
                          <span>{{ song.playCount | number }}</span>
                        </td>

                        <td class="col-action">
                          <div class="row-action-flex">
                            <button 
                              class="row-like-btn" 
                              [class.liked]="favs.isLiked(song.id)"
                              (click)="$event.stopPropagation(); favs.toggleLike(song)"
                              [title]="favs.isLiked(song.id) ? 'Unlike' : 'Like'">
                              <span class="material-symbols-outlined" [class.filled]="favs.isLiked(song.id)">favorite</span>
                            </button>

                            @if (player.currentSong()?.id === song.id && player.isPlaying()) {
                              <div class="list-equalizer">
                                <span></span><span></span><span></span>
                              </div>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </section>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .home-layout {
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
      position: relative;
      background: var(--bg-base);
      animation: screenGliderRight 0.75s cubic-bezier(0.16, 1, 0.3, 1) backwards;

      app-header {
        animation: screenGliderDown 0.65s cubic-bezier(0.16, 1, 0.3, 1) backwards;
      }
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 24px 32px calc(var(--player-height) + 36px);
    }

    .hero-banner {
      position: relative;
      border-radius: var(--radius-lg);
      padding: 40px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      overflow: hidden;
      background: linear-gradient(-45deg, rgba(30, 215, 96, 0.18), rgba(6, 182, 212, 0.15), rgba(139, 92, 246, 0.12), rgba(23, 23, 30, 0.88));
      background-size: 300% 300%;
      animation: ambientMesh 14s ease infinite;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 16px 36px -10px rgba(0, 0, 0, 0.6), 0 0 25px rgba(30, 215, 96, 0.1);
    }

    .hero-gradient-overlay {
      position: absolute;
      top: -50%;
      left: -20%;
      width: 70%;
      height: 150%;
      background: radial-gradient(circle, rgba(30, 215, 96, 0.25) 0%, transparent 70%);
      pointer-events: none;
      filter: blur(50px);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      max-width: 620px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .greeting-badge {
      display: inline-block;
      align-self: flex-start;
      padding: 4px 14px;
      border-radius: var(--radius-full);
      background: rgba(30, 215, 96, 0.15);
      border: 1px solid rgba(30, 215, 96, 0.35);
      color: var(--primary);
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      animation: floatBadge 3.5s ease-in-out infinite;
      box-shadow: 0 0 12px rgba(30, 215, 96, 0.2);
    }

    .hero-title {
      font-family: 'Outfit', sans-serif;
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      line-height: 1.15;
      color: #fff;
    }

    .hero-desc {
      font-size: 1rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .featured-actions {
      margin-top: 10px;
    }

    .btn-hero-play {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 13px 26px;
      border-radius: var(--radius-full);
      background: var(--primary);
      color: #000;
      font-size: 0.95rem;
      font-weight: 700;
      box-shadow: var(--glow-primary);
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      &:hover {
        background: var(--primary-hover);
        transform: scale(1.04);
      }

      .material-symbols-outlined {
        font-size: 24px;
      }
    }

    .featured-preview-card {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 18px;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(12px);
      padding: 16px 20px;
      border-radius: var(--radius-md);
      border: 1px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 280px;

      &:hover {
        background: rgba(0, 0, 0, 0.65);
        border-color: rgba(30, 215, 96, 0.4);
        transform: translateY(-2px);
      }

      .preview-cover {
        width: 64px;
        height: 64px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        background: var(--bg-card);
        display: flex;
        align-items: center;
        justify-content: center;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .icon {
          font-size: 32px;
          color: var(--text-muted);
        }
      }

      .preview-info {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .preview-tag {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: var(--primary);
        }

        .preview-title {
          font-size: 1rem;
          font-weight: 700;
          color: #fff;
        }

        .preview-artist {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
      }
    }

    /* Horizontal Genre Filter Bar */
    .genre-horizontal-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow-x: auto;
      padding: 2px 2px 14px;
      margin-bottom: 22px;
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        height: 4px;
      }
    }

    .genre-chip-bar {
      padding: 7px 18px;
      border-radius: var(--radius-full);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 700;
      white-space: nowrap;
      border: 1px solid var(--border-subtle);
      transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
      cursor: pointer;
      flex-shrink: 0;

      &:hover:not(.selected) {
        background: var(--bg-card-hover);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.25);
        transform: translateY(-2px);
      }

      &.selected {
        background: var(--primary);
        color: #000;
        border-color: var(--primary);
        box-shadow: 0 4px 16px rgba(30, 215, 96, 0.45);
        transform: translateY(-1px) scale(1.03);
      }
    }

    /* Anghami Signature Discover Layout */
    .anghami-section {
      margin-bottom: 38px;
    }

    .anghami-section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 16px;

      .head-title-wrap {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .head-title {
        font-family: 'Outfit', sans-serif;
        font-size: 1.35rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.3px;
        margin: 0;
      }

      .head-sub {
        font-size: 0.85rem;
        color: var(--text-muted);
      }

      .btn-anghami-see-all {
        background: transparent;
        border: 1px solid var(--border-subtle);
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-weight: 700;
        padding: 5px 16px;
        border-radius: var(--radius-full);
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          color: #fff;
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
        }
      }
    }

    /* Popular Artists Horizontal Scroll Row */
    .artists-scroll-row {
      display: flex;
      gap: 20px;
      overflow-x: auto;
      padding: 4px 4px 12px;
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        height: 4px;
      }
    }

    .artist-circle-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      width: 130px;
      flex-shrink: 0;
      padding: 12px 10px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid transparent;
      transition: all 0.25s cubic-bezier(0.2, 0, 0, 1);
      cursor: pointer;

      &:hover {
        background: var(--bg-card);
        border-color: rgba(255, 255, 255, 0.08);
        transform: translateY(-4px);

        .artist-play-hover {
          opacity: 1;
          transform: scale(1);
        }
      }

      .artist-circle-thumb {
        position: relative;
        width: 104px;
        height: 104px;
        border-radius: 50%;
        overflow: hidden;
        background: var(--bg-card-hover);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .material-symbols-outlined {
          font-size: 46px;
          color: var(--text-muted);
        }

        .artist-play-hover {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

          .material-symbols-outlined {
            font-size: 38px;
            color: var(--primary);
            filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
          }
        }
      }

      .artist-circle-name {
        font-size: 0.92rem;
        font-weight: 700;
        color: #fff;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .artist-circle-sub {
        font-size: 0.76rem;
        color: var(--text-muted);
        margin-top: 2px;
        text-transform: capitalize;
      }
    }

    /* Instrumental & Mood Essentials Row (Screenshot match) */
    .mood-cards-row {
      display: flex;
      gap: 18px;
      overflow-x: auto;
      padding: 4px 4px 12px;
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        height: 4px;
      }
    }

    .mood-card {
      width: 190px;
      flex-shrink: 0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-4px);

        .mood-play-btn {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .mood-art-box {
        position: relative;
        width: 190px;
        height: 190px;
        border-radius: 14px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow: hidden;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35);

        .mood-art-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%);
          pointer-events: none;
        }

        .mood-tag {
          position: relative;
          z-index: 2;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.8);
        }

        .mood-title-on-art {
          position: relative;
          z-index: 2;
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          line-height: 1.25;
          color: #fff;
          margin: 0;
        }

        .mood-play-btn {
          position: absolute;
          bottom: 14px;
          right: 14px;
          z-index: 3;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: #fff;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;

          &:hover {
            transform: scale(1.1) !important;
            background: var(--primary);
          }

          .material-symbols-outlined {
            font-size: 24px;
          }
        }
      }

      .mood-card-name {
        font-size: 0.92rem;
        font-weight: 700;
        color: #fff;
        line-height: 1.3;
      }

      .mood-card-desc {
        font-size: 0.78rem;
        color: var(--text-muted);
        line-height: 1.35;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    /* Featured Albums Horizontal Scroll */
    .albums-scroll-row {
      display: flex;
      gap: 18px;
      overflow-x: auto;
      padding: 4px 4px 12px;
      scrollbar-width: thin;

      &::-webkit-scrollbar {
        height: 4px;
      }
    }

    .album-anghami-card {
      width: 175px;
      flex-shrink: 0;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 10px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid transparent;
      transition: all 0.2s ease;
      cursor: pointer;

      &:hover {
        background: var(--bg-card);
        border-color: rgba(255, 255, 255, 0.08);
        transform: translateY(-4px);

        .album-play-overlay {
          opacity: 1;
          transform: scale(1);
        }
      }

      .album-art-wrap {
        position: relative;
        width: 100%;
        aspect-ratio: 1;
        border-radius: 10px;
        overflow: hidden;
        background: var(--bg-card-hover);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .material-symbols-outlined {
          position: absolute;
          inset: 0;
          margin: auto;
          font-size: 48px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .album-play-overlay {
          position: absolute;
          bottom: 10px;
          right: 10px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          opacity: 0;
          transform: scale(0.85);
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;

          &:hover {
            transform: scale(1.1) !important;
          }

          .material-symbols-outlined {
            font-size: 24px;
            color: #000;
          }
        }
      }

      .album-card-title {
        font-size: 0.92rem;
        font-weight: 700;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .album-card-artist {
        font-size: 0.8rem;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .album-card-meta {
        font-size: 0.74rem;
        color: var(--text-muted);
      }
    }

    .catalog-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .catalog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .catalog-title-box {
      display: flex;
      align-items: baseline;
      gap: 12px;

      .section-title {
        font-family: 'Outfit', sans-serif;
        font-size: 1.5rem;
        font-weight: 700;
        color: #fff;
      }

      .track-count {
        font-size: 0.85rem;
        color: var(--text-muted);
        font-weight: 500;
      }
    }

    .view-controls {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-card);
      padding: 4px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-subtle);

      .view-btn {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        color: var(--text-muted);

        .material-symbols-outlined {
          font-size: 20px;
        }

        &:hover {
          color: #fff;
        }

        &.active {
          background: rgba(255, 255, 255, 0.1);
          color: var(--primary);
        }
      }
    }

    .songs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
      gap: 20px;

      app-song-card {
        animation: cardCascade 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;

        &:nth-child(1) { animation-delay: 0.03s; }
        &:nth-child(2) { animation-delay: 0.06s; }
        &:nth-child(3) { animation-delay: 0.09s; }
        &:nth-child(4) { animation-delay: 0.12s; }
        &:nth-child(5) { animation-delay: 0.15s; }
        &:nth-child(6) { animation-delay: 0.18s; }
        &:nth-child(7) { animation-delay: 0.21s; }
        &:nth-child(8) { animation-delay: 0.24s; }
        &:nth-child(9) { animation-delay: 0.27s; }
        &:nth-child(10) { animation-delay: 0.30s; }
        &:nth-child(11) { animation-delay: 0.33s; }
        &:nth-child(12) { animation-delay: 0.36s; }
      }
    }

    .songs-list-container {
      background: var(--bg-card);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      overflow: hidden;
    }

    .songs-list-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;

      th {
        padding: 14px 18px;
        color: var(--text-muted);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        border-bottom: 1px solid var(--border-subtle);
        font-weight: 600;
      }

      .list-row {
        cursor: pointer;
        transition: transform 0.22s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease;

        td {
          padding: 12px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }

        &:hover {
          background: var(--bg-card-hover);
          transform: translateX(4px);

          .track-number {
            display: none;
          }

          .row-play-btn {
            display: flex;
          }
        }

        &.is-current {
          background: rgba(30, 215, 96, 0.06);

          .row-title {
            color: var(--primary);
          }
        }
      }

      .col-num {
        width: 50px;
        text-align: center;
        position: relative;
      }

      .track-number {
        color: var(--text-muted);
        font-size: 0.82rem;
      }

      .row-play-btn {
        display: none;
        align-items: center;
        justify-content: center;
        color: #fff;
        width: 24px;
        height: 24px;
        margin: 0 auto;

        &:hover {
          color: var(--primary);
          transform: scale(1.15);
        }

        .material-symbols-outlined {
          font-size: 20px;
        }
      }

      .col-main {
        min-width: 250px;
      }

      .title-cell {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .row-thumb {
        width: 42px;
        height: 42px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--bg-surface);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .material-symbols-outlined {
          color: var(--text-muted);
          font-size: 20px;
        }
      }

      .title-meta {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .row-title {
          font-weight: 600;
          color: #fff;
        }

        .row-artist-link {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-decoration: none;
          &:hover { color: var(--primary); text-decoration: underline; }
        }
      }

      .row-album-link {
        color: var(--text-secondary);
        text-decoration: none;
        &:hover { color: var(--primary); text-decoration: underline; }
      }

      .col-album {
        color: var(--text-secondary);
      }

      .row-action-flex {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
      }

      .row-like-btn {
        color: var(--text-muted);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 50%;
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.2s;

        &:hover { color: #fff; opacity: 1; transform: scale(1.1); }
        &.liked { color: var(--accent-rose); opacity: 1; }
        .material-symbols-outlined { font-size: 19px; }
      }

      .genre-chip-small {
        padding: 3px 10px;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary);
        font-size: 0.72rem;
        font-weight: 600;
      }

      .col-plays {
        color: var(--text-muted);
        display: flex;
        align-items: center;
        gap: 6px;

        .headphone-icon {
          font-size: 16px;
        }
      }

      .col-action {
        width: 40px;
        text-align: right;
      }

      .list-equalizer {
        display: flex;
        align-items: flex-end;
        gap: 2px;
        height: 14px;

        span {
          width: 3px;
          background: var(--primary);
          border-radius: 1px;
          animation: musicEqualizer 1s infinite ease-in-out;

          &:nth-child(1) { height: 6px; animation-delay: 0.1s; }
          &:nth-child(2) { height: 12px; animation-delay: 0.3s; }
          &:nth-child(3) { height: 8px; animation-delay: 0.2s; }
        }
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 80px 20px;
      color: var(--text-secondary);

      .pulse-loader {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--primary);
        animation: pulseGlow 1.5s infinite ease-in-out;
      }
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 14px;
      padding: 70px 20px;
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      border: 1px dashed var(--border-subtle);
      max-width: 560px;
      margin: 30px auto;

      .empty-icon-circle {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.04);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-muted);

        .material-symbols-outlined {
          font-size: 36px;
        }
      }

      h3 {
        font-family: 'Outfit', sans-serif;
        font-size: 1.4rem;
        font-weight: 700;
      }

      p {
        color: var(--text-secondary);
        font-size: 0.92rem;
        max-width: 420px;
        line-height: 1.5;
      }

      .btn {
        margin-top: 8px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 11px 24px;
        border-radius: var(--radius-full);
        font-size: 0.9rem;
        font-weight: 700;

        &.btn-outline {
          border: 1px solid var(--border-subtle);
          color: #fff;
          &:hover { background: rgba(255, 255, 255, 0.08); }
        }
      }
    }

    @media (max-width: 1024px) {
      .hero-banner {
        flex-direction: column;
        align-items: flex-start;
      }
      .featured-preview-card {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px 16px calc(var(--player-height) + 24px);
      }
      .hero-banner {
        padding: 24px;
      }
      .hero-title {
        font-size: 1.8rem;
      }
      .songs-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 14px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  readonly songService = inject(SongService);
  readonly player = inject(AudioPlayerService);
  readonly favs = inject(FavoritesService);
  readonly artistAlbumService = inject(ArtistAlbumService);

  readonly songs = signal<Song[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly searchQuery = signal<string>('');
  readonly selectedGenre = signal<string>('All');
  readonly activeTab = signal<string>('discover');
  readonly viewMode = signal<'grid' | 'list'>('grid');

  readonly genres = [
    'All',
    'Turkish',
    'Remix',
    'Tarab',
    'Tunisian',
    'Quran',
    'Raï',
    'Latin',
    'Pop',
    'Rock',
    'Afrobeat',
    'Mezoued',
    'Deep House',
    'Hip-Hop',
    'Classical',
    'Acoustic'
  ];

  readonly featuredArtists = computed(() => {
    const list = this.songs();
    const map = new Map<string, { name: string; avatarUrl: string }>();
    for (const s of list) {
      if (s.artist && !map.has(s.artist)) {
        const avatar = this.artistAlbumService.getArtistAvatar(s.artist) || '';
        map.set(s.artist, { name: s.artist, avatarUrl: avatar });
      }
    }
    return Array.from(map.values());
  });

  readonly featuredAlbums = computed(() => {
    const list = this.songs();
    const map = new Map<string, { title: string; artist: string; count: number; year: string; coverUrl: string }>();
    for (const s of list) {
      if (s.album) {
        if (!map.has(s.album)) {
          const cover = this.artistAlbumService.getAlbumCover(s.album) || (s.coverFile ? this.songService.getCoverUrl(s.id) : '');
          const year = this.artistAlbumService.getAlbumYear(s.album);
          map.set(s.album, { title: s.album, artist: s.artist, count: 1, year, coverUrl: cover });
        } else {
          map.get(s.album)!.count++;
        }
      }
    }
    return Array.from(map.values());
  });

  readonly moodCards = [
    {
      title: 'Jaw Tounsi & Mezoued',
      tag: 'TUNISIAN POPULAR',
      desc: 'Authentic Mezoued, Stambeli & vibrant celebration rhythms',
      gradient: 'linear-gradient(135deg, #e11d48 0%, #b91c1c 100%)',
      genre: 'Mezoued'
    },
    {
      title: 'Salatin El Tarab',
      tag: 'CLASSIC TARAB',
      desc: 'Timeless voices, authentic muwashahat and classic Arab heritage',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
      genre: 'Tarab'
    },
    {
      title: 'Gammarth House & Afro',
      tag: 'NIGHTLIFE & CLUB',
      desc: 'Electronic beats, Melodic House & Mediterranean vibes',
      gradient: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
      genre: 'Deep House'
    },
    {
      title: 'Flamenco & Latin Fiesta',
      tag: 'GUITAR & PASSION',
      desc: 'Gipsy Kings, rumba catalana & fiery acoustic strums',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
      genre: 'Latin'
    },
    {
      title: 'Oud & Acoustic Soul',
      tag: 'CHILLOUT & MEDITATION',
      desc: 'Peaceful acoustic strings and eastern melodies',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      genre: 'Acoustic'
    },
    {
      title: 'Nights of Istanbul & Turkish Nostalgia',
      tag: 'TURKISH MUSIC / طرب تركي',
      desc: 'Aramam, Tarkan, Mahsun Kırmızıgül & Bosphorus Deep House Beats',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      genre: 'Turkish'
    },
    {
      title: 'Club & Oriental Remixes',
      tag: 'REMIX VIBES / ريمكس',
      desc: 'Amr Diab Wayah, Tamer Hosny, Sherine & energetic club vibes',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
      genre: 'Remix'
    }
  ];

  playMood(mood: any) {
    let list = this.songs().filter(s => {
      const g = (s.genre || '').toLowerCase();
      const mg = (mood.genre || '').toLowerCase();
      if (mg === 'turkish') {
        return g.includes('turkish') || s.title.includes('تركي') || s.artist.toLowerCase().includes('tarkan') || s.artist.toLowerCase().includes('tatl');
      }
      if (mg === 'remix') {
        return g.includes('remix') || s.title.toLowerCase().includes('remix');
      }
      return g.includes(mg) ||
        (mood.title.includes('Latin') && s.artist.toLowerCase().includes('gipsy')) ||
        (mood.title.includes('Tarab') && (s.artist.toLowerCase().includes('sabah') || s.artist.toLowerCase().includes('amr')));
    });

    if (list.length > 0) {
      this.player.playSong(list[0], list);
    } else {
      this.onGenreChange(mood.genre);
    }
  }

  playAlbumTracks(albumTitle: string) {
    const albumSongs = this.songs().filter(s => s.album && s.album.toLowerCase() === albumTitle.toLowerCase());
    if (albumSongs.length > 0) {
      this.player.playSong(albumSongs[0], albumSongs);
    }
  }

  readonly filteredSongs = computed(() => {
    let list = this.songs();
    const query = this.searchQuery().trim().toLowerCase();
    const genre = this.selectedGenre();
    const tab = this.activeTab();

    if (query) {
      list = list.filter(s =>
        s.title.toLowerCase().includes(query) ||
        s.artist.toLowerCase().includes(query) ||
        (s.album && s.album.toLowerCase().includes(query)) ||
        (s.genre && s.genre.toLowerCase().includes(query))
      );
    }

    if (genre !== 'All') {
      const gLower = genre.toLowerCase();
      if (gLower === 'remix') {
        list = list.filter(s =>
          (s.genre && s.genre.toLowerCase().includes('remix')) ||
          s.title.toLowerCase().includes('remix') ||
          (s.album && s.album.toLowerCase().includes('remix'))
        );
      } else if (gLower === 'turkish') {
        list = list.filter(s =>
          (s.genre && s.genre.toLowerCase().includes('turkish')) ||
          s.title.toLowerCase().includes('تركي') ||
          s.artist.toLowerCase().includes('tarkan') ||
          s.artist.toLowerCase().includes('tatlıses') ||
          s.artist.toLowerCase().includes('tatlises') ||
          s.artist.toLowerCase().includes('kırmızıgül') ||
          s.artist.toLowerCase().includes('kirmizigul') ||
          s.artist.toLowerCase().includes('iskenderli') ||
          s.artist.toLowerCase().includes('burak')
        );
      } else {
        list = list.filter(s => s.genre && s.genre.toLowerCase().includes(gLower));
      }
    }

    if (tab === 'popular') {
      list = [...list].sort((a, b) => b.playCount - a.playCount);
    }

    return list;
  });

  readonly featuredSong = computed(() => {
    const list = this.songs();
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.playCount - a.playCount)[0];
  });

  private readonly route = inject(ActivatedRoute);

  ngOnInit() {
    this.loadSongs();
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        this.activeTab.set(params['tab']);
      }
      if (params['genre']) {
        this.selectedGenre.set(params['genre']);
        this.activeTab.set('all');
      }
      if (params['q']) {
        this.searchQuery.set(params['q']);
      }
    });
  }

  loadSongs() {
    this.isLoading.set(true);
    this.songService.getAllSongs().subscribe({
      next: (data) => {
        this.songs.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onPlaySong(song: Song) {
    this.player.playSong(song, this.filteredSongs());
  }

  onTabChange(tab: string) {
    this.activeTab.set(tab);
    if (tab === 'all') {
      this.selectedGenre.set('All');
      this.searchQuery.set('');
    }
  }

  onGenreChange(genre: string) {
    this.selectedGenre.set(genre);
  }

  onSearchChange(query: string) {
    this.searchQuery.set(query);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }
}
