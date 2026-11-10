import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SongService } from '../../services/song.service';
import { ToastService } from '../../services/toast.service';
import { AudioPlayerService } from '../../services/audio-player.service';
import { ArtistAlbumService } from '../../services/artist-album.service';
import { UserService } from '../../services/user.service';
import { AdminUserService } from '../../services/admin-user.service';
import { Song, Stats, AdminUser, MostPlayedTrack, TrendingTrack, TopArtistStat, GenreStat } from '../../models/song.model';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="studio-container">
      <!-- Studio Header -->
      <header class="studio-header">
        <div class="brand">
          <div class="studio-icon">
            <span class="material-symbols-outlined">shield_person</span>
          </div>
          <div class="brand-text">
            <h2>Samma3ni Studio</h2>
            <span class="sub">Backstage Management Portal</span>
          </div>
        </div>

        <div class="header-actions">
          <a routerLink="/" class="btn btn-outline" title="Return to listener app">
            <span class="material-symbols-outlined">arrow_back</span>
            <span>Back to App</span>
          </a>

          @if (authService.isAdmin()) {
            <div class="admin-chip">
              <span class="material-symbols-outlined">verified</span>
              <span>admin</span>
            </div>
            <button class="btn btn-logout" (click)="logout()">
              <span class="material-symbols-outlined">logout</span>
              <span>Sign Out</span>
            </button>
          }
        </div>
      </header>

      <!-- If Not Logged In: Secret Login Form -->
      @if (!authService.isAdmin()) {
        <main class="login-wrapper">
          <div class="login-card">
            <div class="lock-circle">
              <span class="material-symbols-outlined">shield_person</span>
            </div>

            <div class="login-header-text">
              <h3>Portail Administrateur</h3>
              <p>Authentification requise pour gérer le catalogue Samma3ni.</p>
            </div>

          

            <form (ngSubmit)="login()" class="login-form">
              <div class="form-group">
                <label>Nom d'utilisateur Admin</label>
                <div class="input-box">
                  <span class="material-symbols-outlined">person</span>
                  <input 
                    type="text" 
                    [(ngModel)]="username" 
                    name="username" 
                    placeholder="admin" 
                    required 
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Mot de passe</label>
                <div class="input-box">
                  <span class="material-symbols-outlined">lock</span>
                  <input 
                    type="password" 
                    [(ngModel)]="password" 
                    name="password" 
                    placeholder="••••••••" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" class="btn btn-primary submit-btn" [disabled]="isLoggingIn()">
                @if (isLoggingIn()) {
                  <span class="btn-spinner"></span>
                  <span>Vérification...</span>
                } @else {
                  <span>Accéder au Studio</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                }
              </button>

             
            </form>
          </div>
        </main>
      } @else {
        <!-- Authenticated Studio Dashboard -->
        <main class="studio-main">
          <!-- Top Analytics Stats -->
          <section class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-box emerald">
                <span class="material-symbols-outlined">music_note</span>
              </div>
              <div class="stat-meta">
                <span class="num">{{ stats()?.totalSongs || songs().length }}</span>
                <span class="label">Total Tracks in Database</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-box cyan">
                <span class="material-symbols-outlined">headphones</span>
              </div>
              <div class="stat-meta">
                <span class="num">{{ stats()?.totalPlays || 0 | number }}</span>
                <span class="label">Total Streams Played</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-box gold">
                <span class="material-symbols-outlined">group</span>
              </div>
              <div class="stat-meta">
                <span class="num">{{ stats()?.totalUsers || usersTotal() || 0 }}</span>
                <span class="label">Registered Listeners</span>
              </div>
            </div>

        
          </section>

          <!-- Studio Tabs Navigation -->
          <div class="studio-tabs">
            <button 
              class="tab-link" 
              [class.active]="activeTab() === 'stats'"
              (click)="activeTab.set('stats'); loadStats()">
              <span class="material-symbols-outlined">insights</span>
              <span>Stats & Tendances</span>
            </button>
            <button 
              class="tab-link" 
              [class.active]="activeTab() === 'users'"
              (click)="activeTab.set('users'); loadUsers()">
              <span class="material-symbols-outlined">manage_accounts</span>
              <span>Gestion Utilisateurs</span>
              <span class="badge-count">{{ usersTotal() || users().length }}</span>
            </button>
            <button 
              class="tab-link" 
              [class.active]="activeTab() === 'manage'"
              (click)="activeTab.set('manage')">
              <span class="material-symbols-outlined">library_music</span>
              <span>Manage Catalog</span>
              <span class="badge-count">{{ songs().length }}</span>
            </button>
            <button 
              class="tab-link" 
              [class.active]="activeTab() === 'upload'"
              (click)="activeTab.set('upload')">
              <span class="material-symbols-outlined">cloud_upload</span>
              <span>Upload Track</span>
            </button>
            <button 
              class="tab-link" 
              [class.active]="activeTab() === 'artists'"
              (click)="activeTab.set('artists')">
              <span class="material-symbols-outlined">person</span>
              <span>Artists & Avatars</span>
              <span class="badge-count">{{ distinctArtists().length }}</span>
            </button>
            <button 
              class="tab-link" 
              [class.active]="activeTab() === 'albums'"
              (click)="activeTab.set('albums')">
              <span class="material-symbols-outlined">album</span>
              <span>Albums & Covers</span>
              <span class="badge-count">{{ distinctAlbums().length }}</span>
            </button>
          </div>

          <!-- Tab: Upload Song -->
          @if (activeTab() === 'upload') {
            <section class="studio-card upload-section">
              <div class="card-header">
                <h3>Add Track to Samma3ni</h3>
                <p>Upload audio file and album artwork directly into MongoDB and local storage.</p>
              </div>

              <form (ngSubmit)="submitUpload()" class="upload-form">
                <!-- Row 1: Title & Artist -->
                <div class="grid-2">
                  <div class="form-group">
                    <label>Song Title *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="title" 
                      name="title" 
                      placeholder="e.g. HABAYTAK" 
                      required 
                    />
                  </div>

                  <div class="form-group">
                    <label>Artist / Band *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="artist" 
                      name="artist" 
                      placeholder="e.g. Emp1re" 
                      required 
                    />
                  </div>
                </div>

                <!-- Row 2: Album & Genre -->
                <div class="grid-2">
                  <div class="form-group">
                    <label>Album (Optional)</label>
                    <input 
                      type="text" 
                      [(ngModel)]="album" 
                      name="album" 
                      placeholder="e.g. Single Track" 
                    />
                  </div>

                  <div class="form-group">
                    <label>Genre</label>
                    <select [(ngModel)]="genre" name="genre">
                      <option value="Quran">Quran / القرآن الكريم</option>
                      <option value="Tunisian">Tunisian / تونسي</option>
                      <option value="Raï">Raï / راي</option>
                      <option value="Latin">Latin / Flamenco</option>
                      <option value="Tarab">Tarab / طرب</option>
                      <option value="Turkish">Turkish / تركي</option>
                      <option value="Remix">Remix / ريمكس</option>
                      <option value="Pop">Pop</option>
                      <option value="Rock">Rock / Indie</option>
                      <option value="Afrobeat">Afrobeat</option>
                      <option value="Mezoued">Mezoued / مزود</option>
                      <option value="Deep House">Deep House</option>
                      <option value="Techno">Techno</option>
                      <option value="Hip-Hop">Hip-Hop / Rap</option>
                      <option value="R&B">R&B / Soul</option>
                      <option value="Electronic">Electronic / EDM</option>
                      <option value="Classical">Classical</option>
                      <option value="Acoustic">Acoustic</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <!-- Row 3: Media Uploaders -->
                <div class="grid-2 media-row">
                  <!-- Audio File Zone -->
                  <div class="form-group">
                    <label>Audio File (.mp3, .wav, .m4a) *</label>
                    <div class="file-drop-zone" [class.ready]="!!audioFile">
                      <input 
                        type="file" 
                        id="studioAudioInput" 
                        accept="audio/*" 
                        (change)="onAudioSelected($event)" 
                        required 
                      />
                      <label for="studioAudioInput" class="drop-content">
                        <span class="material-symbols-outlined drop-icon">
                          {{ audioFile ? 'task_alt' : 'audio_file' }}
                        </span>
                        @if (audioFile) {
                          <div class="file-info-badge">
                            <span class="name">{{ audioFile.name }}</span>
                            <span class="size">({{ formatSize(audioFile.size) }})</span>
                          </div>
                        } @else {
                          <span class="main-prompt">Choose Audio File</span>
                          <span class="sub-hint">MP3, WAV, M4A up to 100MB</span>
                        }
                      </label>
                    </div>
                  </div>

                  <!-- Cover Artwork Zone -->
                  <div class="form-group">
                    <label>Cover Artwork (Optional)</label>
                    <div class="cover-zone">
                      <div class="cover-preview-box">
                        @if (coverPreviewUrl()) {
                          <img [src]="coverPreviewUrl()" alt="Cover Preview" />
                        } @else {
                          <span class="material-symbols-outlined">image</span>
                        }
                      </div>

                      <div class="cover-picker-controls">
                        <input 
                          type="file" 
                          id="studioCoverInput" 
                          accept="image/*" 
                          (change)="onCoverSelected($event)" 
                        />
                        <label for="studioCoverInput" class="btn btn-outline small">
                          <span class="material-symbols-outlined">add_photo_alternate</span>
                          <span>{{ coverFile ? 'Change Image' : 'Select Artwork' }}</span>
                        </label>
                        @if (coverFile) {
                          <span class="cover-name">{{ coverFile.name }}</span>
                        } @else {
                          <span class="cover-hint">JPG, PNG, WEBP</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <div class="action-footer">
                  <button 
                    type="submit" 
                    class="btn btn-primary publish-btn" 
                    [disabled]="isUploading() || !title || !artist || !audioFile">
                    @if (isUploading()) {
                      <span class="btn-spinner"></span>
                      <span>Uploading to Samma3ni...</span>
                    } @else {
                      <span class="material-symbols-outlined">upload</span>
                      <span>Publish Track to Samma3ni</span>
                    }
                  </button>
                </div>
              </form>
            </section>
          }

          <!-- Tab: Manage Catalog -->
          @if (activeTab() === 'manage') {
            <section class="studio-card">
              <div class="card-header">
                <h3>Track Management ({{ songs().length }} tracks)</h3>
                <p>View, stream, or delete songs stored in your database.</p>
              </div>

              @if (songs().length === 0) {
                <div class="empty-table-msg">
                  <span class="material-symbols-outlined">music_off</span>
                  <p>No songs uploaded yet. Switch to "Upload New Track" to add one!</p>
                </div>
              } @else {
                <div class="table-wrapper">
                  <table class="studio-table">
                    <thead>
                      <tr>
                        <th>Cover</th>
                        <th>Track Title & Artist</th>
                        <th>Album</th>
                        <th>Genre</th>
                        <th>Streams</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (song of songs(); track song.id) {
                        <tr>
                          <td>
                            <div class="thumb-box">
                              @if (song.coverFile) {
                                <img [src]="songService.getCoverUrl(song.id)" alt="" />
                              } @else {
                                <span class="material-symbols-outlined">music_note</span>
                              }
                            </div>
                          </td>
                          <td>
                            <div class="title-bold">{{ song.title }}</div>
                            <div class="artist-sub">{{ song.artist }}</div>
                          </td>
                          <td>{{ song.album || '-' }}</td>
                          <td>
                            <span class="genre-tag">{{ song.genre || 'Other' }}</span>
                          </td>
                          <td>
                            <span class="streams-badge">{{ song.playCount | number }}</span>
                          </td>
                          <td>
                            <div class="action-buttons">
                              <button 
                                class="btn-icon play-btn" 
                                (click)="playSong(song)" 
                                [title]="player.currentSong()?.id === song.id && player.isPlaying() ? 'Pause' : 'Play'">
                                <span class="material-symbols-outlined">
                                  {{ player.currentSong()?.id === song.id && player.isPlaying() ? 'pause' : 'play_arrow' }}
                                </span>
                              </button>

                              <button 
                                class="btn-icon edit-btn" 
                                (click)="openEditModal(song)" 
                                title="Edit track details">
                                <span class="material-symbols-outlined">edit</span>
                              </button>

                              <button 
                                class="btn-icon delete-btn" 
                                (click)="deleteSong(song)" 
                                title="Delete from database">
                                <span class="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </section>
          }

          <!-- Tab: Artists & Avatars -->
          @if (activeTab() === 'artists') {
            <section class="studio-card">
              <div class="card-header flex-header">
                <div>
                  <h3>Artist Profiles & Avatars</h3>
                  <p>Customize profile pictures and biographies for your artists.</p>
                </div>
              </div>

              <div class="artist-admin-grid">
                @for (art of distinctArtists(); track art.name) {
                  <div class="artist-admin-card">
                    <div class="artist-avatar-wrap">
                      @if (getArtistAvatar(art.name)) {
                        <img [src]="getArtistAvatar(art.name)" [alt]="art.name" />
                      } @else {
                        <div class="avatar-fallback-icon">
                          <span class="material-symbols-outlined">person</span>
                        </div>
                      }
                      <button class="avatar-edit-overlay" (click)="openEditArtist(art.name)" title="Change Profile Picture">
                        <span class="material-symbols-outlined">photo_camera</span>
                      </button>
                    </div>

                    <div class="artist-admin-info">
                      <div class="art-name-row">
                        <h4 class="art-name">{{ art.name }}</h4>
                        <span class="verified-icon material-symbols-outlined">verified</span>
                      </div>
                      <span class="art-tracks-sub">{{ art.tracksCount }} {{ art.tracksCount === 1 ? 'track' : 'tracks' }}</span>

                      @if (getArtistBio(art.name)) {
                        <p class="art-bio-snippet">{{ getArtistBio(art.name) }}</p>
                      }

                      <div class="art-card-actions">
                        <button class="btn-sm btn-cyan" (click)="openEditArtist(art.name)">
                          <span class="material-symbols-outlined">edit</span>
                          <span>Edit Picture & Bio</span>
                        </button>
                        <a [routerLink]="['/artist', art.name]" target="_blank" class="btn-sm btn-ghost">
                          <span class="material-symbols-outlined">open_in_new</span>
                          <span>View Profile</span>
                        </a>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Tab: Albums & Covers -->
          @if (activeTab() === 'albums') {
            <section class="studio-card">
              <div class="card-header flex-header">
                <div>
                  <h3>Album Artworks & Covers</h3>
                  <p>Upload dedicated high-resolution cover artwork for your albums.</p>
                </div>
              </div>

              <div class="album-admin-grid">
                @for (alb of distinctAlbums(); track alb.title) {
                  <div class="album-admin-card">
                    <div class="album-cover-wrap">
                      @if (getAlbumCover(alb.title)) {
                        <img [src]="getAlbumCover(alb.title)" [alt]="alb.title" />
                      } @else {
                        <div class="cover-fallback-icon">
                          <span class="material-symbols-outlined">album</span>
                        </div>
                      }
                      <button class="cover-edit-overlay" (click)="openEditAlbum(alb)" title="Change Cover Artwork">
                        <span class="material-symbols-outlined">photo_camera</span>
                      </button>
                    </div>

                    <div class="album-admin-info">
                      <h4 class="alb-title">{{ alb.title }}</h4>
                      <span class="alb-artist-sub">{{ alb.artist }}</span>
                      <span class="alb-tracks-sub">
                        {{ alb.tracksCount }} {{ alb.tracksCount === 1 ? 'track' : 'tracks' }}
                        @if (getAlbumYear(alb.title)) { • {{ getAlbumYear(alb.title) }} }
                      </span>

                      @if (getAlbumDescription(alb.title)) {
                        <p class="art-bio-snippet">{{ getAlbumDescription(alb.title) }}</p>
                      }

                      <div class="alb-card-actions">
                        <button class="btn-sm btn-cyan" (click)="openEditAlbum(alb)">
                          <span class="material-symbols-outlined">edit</span>
                          <span>Edit Cover</span>
                        </button>
                        <a [routerLink]="['/album', alb.title]" target="_blank" class="btn-sm btn-ghost">
                          <span class="material-symbols-outlined">open_in_new</span>
                          <span>View Album</span>
                        </a>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Tab: Stats & Trends -->
          @if (activeTab() === 'stats') {
            <section class="studio-card stats-trends-section">
              <div class="card-header flex-header">
                <div>
                  <h3>Statistiques & Tendances Musicales</h3>
                  <p>Classement en temps réel des morceaux les plus écoutés, artistes phares et popularité des genres.</p>
                </div>
                <button class="btn btn-outline small" (click)="loadStats()" title="Rafraîchir les métriques">
                  <span class="material-symbols-outlined">refresh</span>
                  <span>Rafraîchir</span>
                </button>
              </div>

              <!-- KPI Overview Grid -->
              <div class="stats-kpi-grid">
                <div class="kpi-card gold-border">
                  <div class="kpi-icon-box gold">
                    <span class="material-symbols-outlined">trophy</span>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">#1 Morceau le plus écouté</span>
                    <span class="kpi-value truncate">{{ stats()?.mostPlayed?.[0]?.title || 'Chargement...' }}</span>
                    <span class="kpi-sub">{{ (stats()?.mostPlayed?.[0]?.playCount || 0) | number }} streams</span>
                  </div>
                </div>

                <div class="kpi-card emerald-border">
                  <div class="kpi-icon-box emerald">
                    <span class="material-symbols-outlined">graphic_eq</span>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Moyenne streams / titre</span>
                    <span class="kpi-value">{{ (stats()?.avgPlaysPerSong || 0) | number }}</span>
                    <span class="kpi-sub">Sur {{ stats()?.totalSongs || songs().length }} titres</span>
                  </div>
                </div>

                <div class="kpi-card cyan-border">
                  <div class="kpi-icon-box cyan">
                    <span class="material-symbols-outlined">group</span>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Auditeurs Inscrits</span>
                    <span class="kpi-value">{{ stats()?.totalUsers || usersTotal() || 0 }}</span>
                    <span class="kpi-sub">Comptes enregistrés</span>
                  </div>
                </div>

                <div class="kpi-card purple-border">
                  <div class="kpi-icon-box purple">
                    <span class="material-symbols-outlined">category</span>
                  </div>
                  <div class="kpi-info">
                    <span class="kpi-label">Genre #1 par écoutes</span>
                    <span class="kpi-value">{{ stats()?.genreDistribution?.[0]?.genre || 'Pop' }}</span>
                    <span class="kpi-sub">{{ (stats()?.genreDistribution?.[0]?.totalPlays || 0) | number }} streams</span>
                  </div>
                </div>
              </div>

              <!-- Top 10 Most Played Songs (Classement des Écoutes) -->
              <div class="trends-block">
                <div class="trends-block-header">
                  <div class="tb-title">
                    <span class="material-symbols-outlined icon-glow">leaderboard</span>
                    <h4>Top 10 - Morceaux les plus écoutés (Most Played)</h4>
                  </div>
                  <span class="tb-desc">Classés par volume total d'écoutes uniques sur Samma3ni</span>
                </div>

                <div class="ranking-list">
                  @for (t of stats()?.mostPlayed || []; track t.id) {
                    <div class="ranking-row" [class.rank-gold]="t.rank === 1" [class.rank-silver]="t.rank === 2" [class.rank-bronze]="t.rank === 3">
                      <!-- Rank Medal / Number -->
                      <div class="rank-badge">
                        @if (t.rank === 1) {
                          <span class="medal gold">#1</span>
                        } @else if (t.rank === 2) {
                          <span class="medal silver">#2</span>
                        } @else if (t.rank === 3) {
                          <span class="medal bronze">#3</span>
                        } @else {
                          <span class="rank-num">#{{ t.rank }}</span>
                        }
                      </div>

                      <!-- Cover -->
                      <div class="rank-cover">
                        @if (t.coverFile) {
                          <img [src]="songService.getCoverUrl(t.id)" [alt]="t.title" />
                        } @else {
                          <span class="material-symbols-outlined">music_note</span>
                        }
                        <button class="rank-play-btn" (click)="playRankSong(t)" title="Écouter le titre">
                          <span class="material-symbols-outlined">play_arrow</span>
                        </button>
                      </div>

                      <!-- Meta -->
                      <div class="rank-meta">
                        <span class="rank-title">{{ t.title }}</span>
                        <div class="rank-sub">
                          <span class="rank-artist">{{ t.artist }}</span>
                          @if (t.album) {
                            <span class="bullet">•</span>
                            <span class="rank-album">{{ t.album }}</span>
                          }
                          <span class="genre-tag">{{ t.genre || 'Latin' }}</span>
                        </div>
                      </div>

                      <!-- Stream Bar & Count -->
                      <div class="rank-stream-bar-box">
                        <div class="stream-bar-bg">
                          <div class="stream-bar-fill" [style.width.%]="t.percentOfMax"></div>
                        </div>
                        <div class="stream-count-text">
                          <span class="material-symbols-outlined tiny-icon">headphones</span>
                          <span>{{ t.playCount | number }} écoutes</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Two Column Layout: Trending & Top Artists / Genres -->
              <div class="stats-two-columns">
                <!-- Column 1: Trending Now -->
                <div class="trends-column">
                  <div class="trends-block-header">
                    <div class="tb-title">
                      <span class="material-symbols-outlined icon-fire">local_fire_department</span>
                      <h4>Tendances du Moment (Trending Now)</h4>
                    </div>
                    <span class="tb-desc">Titres à forte vélocité d'écoute</span>
                  </div>

                  <div class="trending-grid">
                    @for (tr of stats()?.trending || []; track tr.id) {
                      <div class="trending-card">
                        <div class="trending-cover-box">
                          @if (tr.coverFile) {
                            <img [src]="songService.getCoverUrl(tr.id)" [alt]="tr.title" />
                          } @else {
                            <span class="material-symbols-outlined">music_note</span>
                          }
                          <div class="flame-pill">
                            <span class="material-symbols-outlined">local_fire_department</span>
                            <span>{{ tr.trendVelocity }}</span>
                          </div>
                        </div>
                        <div class="trending-info">
                          <span class="trending-name truncate">{{ tr.title }}</span>
                          <span class="trending-artist truncate">{{ tr.artist }}</span>
                          <div class="trending-footer">
                            <span class="genre-tag small">{{ tr.genre }}</span>
                            <button class="btn-circle-play" (click)="playRankSong(tr)" title="Play">
                              <span class="material-symbols-outlined">play_arrow</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Column 2: Top Artists & Genre Distribution -->
                <div class="insights-column">
                  <!-- Top Artists -->
                  <div class="sub-block">
                    <div class="trends-block-header">
                      <div class="tb-title">
                        <span class="material-symbols-outlined icon-glow">stars</span>
                        <h4>Artistes les plus streamés</h4>
                      </div>
                    </div>

                    <div class="artist-leaderboard">
                      @for (art of stats()?.topArtists || []; track art.name; let idx = $index) {
                        <div class="artist-rank-item">
                          <span class="art-pos">#{{ idx + 1 }}</span>
                          <div class="art-avatar-box">
                            @if (getArtistAvatar(art.name)) {
                              <img [src]="getArtistAvatar(art.name)" [alt]="art.name" />
                            } @else {
                              <span class="material-symbols-outlined">person</span>
                            }
                          </div>
                          <div class="art-meta">
                            <span class="art-name truncate">{{ art.name }}</span>
                            <span class="art-tracks">{{ art.songCount }} {{ art.songCount === 1 ? 'titre' : 'titres' }}</span>
                          </div>
                          <div class="art-plays">
                            <span class="material-symbols-outlined tiny-icon">headphones</span>
                            <span>{{ art.totalPlays | number }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Genre Breakdown -->
                  <div class="sub-block mt-24">
                    <div class="trends-block-header">
                      <div class="tb-title">
                        <span class="material-symbols-outlined icon-glow">pie_chart</span>
                        <h4>Répartition par Genre</h4>
                      </div>
                    </div>

                    <div class="genre-bars-list">
                      @for (g of stats()?.genreDistribution || []; track g.genre) {
                        <div class="genre-bar-item">
                          <div class="gb-header">
                            <span class="gb-name">{{ g.genre }} ({{ g.songCount }} titres)</span>
                            <span class="gb-plays">{{ g.totalPlays | number }} streams • {{ g.percentage }}%</span>
                          </div>
                          <div class="gb-track">
                            <div class="gb-fill" [style.width.%]="g.percentage"></div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </section>
          }

          <!-- Tab: Users Management -->
          @if (activeTab() === 'users') {
            <section class="studio-card users-section">
              <div class="card-header flex-header">
                <div>
                  <h3>Gestion des Utilisateurs</h3>
                  <p>Consulter, filtrer, créer, modifier les rôles et suspendre les comptes utilisateurs.</p>
                </div>
                <div class="header-action-group">
                  <button class="btn btn-outline small" (click)="loadUsers()" title="Rafraîchir la liste">
                    <span class="material-symbols-outlined">refresh</span>
                    <span>Rafraîchir</span>
                  </button>
                  <button class="btn btn-primary small" (click)="openAddUserModal()">
                    <span class="material-symbols-outlined">person_add</span>
                    <span>Ajouter Utilisateur</span>
                  </button>
                </div>
              </div>

              <!-- User KPI Counters -->
              <div class="user-stats-bar">
                <div class="u-stat-chip">
                  <span class="material-symbols-outlined">group</span>
                  <div class="u-stat-text">
                    <span class="count">{{ usersTotal() }}</span>
                    <span class="label">Total Inscrits</span>
                  </div>
                </div>
                <div class="u-stat-chip active-chip">
                  <span class="material-symbols-outlined">check_circle</span>
                  <div class="u-stat-text">
                    <span class="count">{{ usersActive() }}</span>
                    <span class="label">Actifs</span>
                  </div>
                </div>
                <div class="u-stat-chip blocked-chip">
                  <span class="material-symbols-outlined">block</span>
                  <div class="u-stat-text">
                    <span class="count">{{ usersBlocked() }}</span>
                    <span class="label">Bloqués</span>
                  </div>
                </div>
                <div class="u-stat-chip admin-chip">
                  <span class="material-symbols-outlined">shield_person</span>
                  <div class="u-stat-text">
                    <span class="count">{{ usersAdmins() }}</span>
                    <span class="label">Administrateurs</span>
                  </div>
                </div>
              </div>

              <!-- Search & Filter Controls -->
              <div class="user-filters-bar">
                <div class="filter-search-box">
                  <span class="material-symbols-outlined">search</span>
                  <input 
                    type="text" 
                    placeholder="Rechercher par nom, email ou téléphone..." 
                    [ngModel]="userSearchQuery" 
                    (ngModelChange)="onUserSearchChange($event)"
                  />
                  @if (userSearchQuery) {
                    <button class="clear-search" (click)="userSearchQuery = ''; onUserSearchChange('')">
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  }
                </div>

                <div class="filter-group">
                  <label>Rôle:</label>
                  <select [ngModel]="userRoleFilter" (ngModelChange)="onUserRoleFilterChange($event)">
                    <option value="ALL">Tous les rôles</option>
                    <option value="USER">USER (Standard)</option>
                    <option value="VIP">VIP (Premium)</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div class="filter-group">
                  <label>Statut:</label>
                  <select [ngModel]="userStatusFilter" (ngModelChange)="onUserStatusFilterChange($event)">
                    <option value="ALL">Tous les statuts</option>
                    <option value="ACTIVE">Actifs uniquement</option>
                    <option value="BLOCKED">Bloqués / Suspendus</option>
                  </select>
                </div>
              </div>

              <!-- Users Table -->
              <div class="table-container">
                @if (isLoadingUsers()) {
                  <div class="table-loading">
                    <span class="btn-spinner"></span>
                    <span>Chargement des utilisateurs...</span>
                  </div>
                } @else if (users().length === 0) {
                  <div class="empty-users">
                    <span class="material-symbols-outlined">person_off</span>
                    <p>Aucun utilisateur trouvé correspondant aux critères.</p>
                  </div>
                } @else {
                  <table class="users-table">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Téléphone</th>
                        <th>Rôle</th>
                        <th>Statut</th>
                        <th>Date d'inscription</th>
                        <th class="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (u of users(); track u.id) {
                        <tr [class.is-blocked]="u.status === 'BLOCKED'">
                          <td>
                            <div class="u-cell-user">
                              <div class="u-avatar-wrap">
                                @if (u.avatarUrl) {
                                  <img [src]="u.avatarUrl" [alt]="u.name" />
                                } @else {
                                  <span class="material-symbols-outlined">person</span>
                                }
                                <span class="u-status-dot" [class.active]="u.status === 'ACTIVE'" [class.blocked]="u.status === 'BLOCKED'"></span>
                              </div>
                              <div class="u-names">
                                <span class="u-name">{{ u.name }}</span>
                                <span class="u-email">{{ u.email }}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span class="u-phone">{{ u.phone || '—' }}</span>
                          </td>
                          <td>
                            <div class="role-selector-wrap">
                              <select 
                                [ngModel]="u.role" 
                                (ngModelChange)="changeUserRole(u, $event)"
                                class="role-badge-select"
                                [class.role-admin]="u.role === 'ADMIN'"
                                [class.role-vip]="u.role === 'VIP'"
                                [class.role-user]="u.role === 'USER'">
                                <option value="USER">USER</option>
                                <option value="VIP">VIP</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            </div>
                          </td>
                          <td>
                            @if (u.status === 'BLOCKED') {
                              <span class="status-pill status-blocked">
                                <span class="material-symbols-outlined">block</span>
                                <span>Bloqué</span>
                              </span>
                            } @else {
                              <span class="status-pill status-active">
                                <span class="material-symbols-outlined">check_circle</span>
                                <span>Actif</span>
                              </span>
                            }
                          </td>
                          <td>
                            <span class="u-date">{{ u.createdAt ? (u.createdAt | date:'dd/MM/yyyy HH:mm') : '—' }}</span>
                          </td>
                          <td>
                            <div class="actions-cell">
                              <!-- Toggle Block / Unblock -->
                              <button 
                                class="action-btn" 
                                [class.btn-ban]="u.status !== 'BLOCKED'"
                                [class.btn-unban]="u.status === 'BLOCKED'"
                                (click)="toggleUserStatus(u)"
                                [title]="u.status === 'BLOCKED' ? 'Débloquer le compte' : 'Suspendre le compte'">
                                <span class="material-symbols-outlined">
                                  {{ u.status === 'BLOCKED' ? 'lock_open' : 'block' }}
                                </span>
                              </button>

                              <!-- Edit User -->
                              <button class="action-btn btn-edit" (click)="openEditUser(u)" title="Modifier l'utilisateur">
                                <span class="material-symbols-outlined">edit</span>
                              </button>

                              <!-- Delete User -->
                              <button class="action-btn btn-delete" (click)="deleteUser(u)" title="Supprimer définitivement">
                                <span class="material-symbols-outlined">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </section>
          }
        </main>
      }

      <!-- Edit Track Modal -->
      @if (editingSong(); as editSong) {
        <div class="edit-modal-backdrop" (click)="closeEditModal($event)">
          <div class="edit-modal-card">
            <div class="modal-top">
              <div class="top-title">
                <span class="material-symbols-outlined icon">edit_note</span>
                <h3>Edit Track Details</h3>
              </div>
              <button class="modal-close-btn" (click)="editingSong.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="submitEdit()" class="edit-form">
              <div class="grid-2">
                <div class="form-group">
                  <label>Title *</label>
                  <input type="text" [(ngModel)]="editTitle" name="editTitle" required />
                </div>
                <div class="form-group">
                  <label>Artist *</label>
                  <input type="text" [(ngModel)]="editArtist" name="editArtist" required />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Album</label>
                  <input type="text" [(ngModel)]="editAlbum" name="editAlbum" />
                </div>
                <div class="form-group">
                  <label>Genre</label>
                  <select [(ngModel)]="editGenre" name="editGenre">
                    <option value="Quran">Quran / القرآن الكريم</option>
                    <option value="Tunisian">Tunisian / تونسي</option>
                    <option value="Raï">Raï / راي</option>
                    <option value="Latin">Latin / Flamenco</option>
                    <option value="Tarab">Tarab / طرب</option>
                    <option value="Turkish">Turkish / تركي</option>
                    <option value="Remix">Remix / ريمكس</option>
                    <option value="Pop">Pop</option>
                    <option value="Rock">Rock / Indie</option>
                    <option value="Afrobeat">Afrobeat</option>
                    <option value="Mezoued">Mezoued / مزود</option>
                    <option value="Deep House">Deep House</option>
                    <option value="Techno">Techno</option>
                    <option value="Hip-Hop">Hip-Hop / Rap</option>
                    <option value="R&B">R&B / Soul</option>
                    <option value="Electronic">Electronic / EDM</option>
                    <option value="Classical">Classical</option>
                    <option value="Acoustic">Acoustic</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <!-- Replace Artwork (Optional) -->
              <div class="form-group">
                <label>Update Cover Artwork (Optional)</label>
                <div class="cover-zone">
                  <div class="cover-preview-box">
                    @if (editCoverPreviewUrl()) {
                      <img [src]="editCoverPreviewUrl()" alt="" />
                    } @else {
                      <span class="material-symbols-outlined">image</span>
                    }
                  </div>
                  <div class="cover-picker-controls">
                    <input type="file" id="editCoverInput" accept="image/*" (change)="onEditCoverSelected($event)" />
                    <label for="editCoverInput" class="btn btn-outline small">
                      <span class="material-symbols-outlined">add_photo_alternate</span>
                      <span>Change Cover</span>
                    </label>
                    @if (editCoverFile) {
                      <span class="cover-name">{{ editCoverFile.name }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="edit-modal-footer">
                <button type="button" class="btn btn-outline" (click)="editingSong.set(null)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSavingEdit()">
                  @if (isSavingEdit()) {
                    <span class="btn-spinner"></span>
                    <span>Saving Changes...</span>
                  } @else {
                    <span class="material-symbols-outlined">save</span>
                    <span>Save Changes</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Artist Modal -->
      @if (editingArtistName(); as eArtist) {
        <div class="edit-modal-backdrop" (click)="closeArtistModal($event)">
          <div class="edit-modal-card">
            <div class="modal-top">
              <div class="top-title">
                <span class="material-symbols-outlined icon">person</span>
                <h3>Edit Artist: {{ eArtist }}</h3>
              </div>
              <button class="modal-close-btn" (click)="editingArtistName.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="submitArtistProfile()" class="edit-form">
              <div class="form-group">
                <label>Profile Picture / Avatar</label>
                <div class="cover-edit-preview-row">
                  <div class="artist-avatar-preview-box">
                    @if (editArtistAvatarPreview()) {
                      <img [src]="editArtistAvatarPreview()" [alt]="eArtist" />
                    } @else {
                      <span class="material-symbols-outlined">person</span>
                    }
                  </div>
                  <div class="cover-picker-controls">
                    <input type="file" id="artistAvatarInput" accept="image/*" (change)="onArtistAvatarSelected($event)" />
                    <label for="artistAvatarInput" class="btn btn-outline small">
                      <span class="material-symbols-outlined">photo_camera</span>
                      <span>Upload Avatar Picture</span>
                    </label>
                    @if (editArtistAvatarFile) {
                      <span class="cover-name">{{ editArtistAvatarFile.name }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Artist Biography / Story</label>
                <textarea 
                  [(ngModel)]="editArtistBio" 
                  name="editArtistBio" 
                  rows="4" 
                  class="studio-textarea"
                  placeholder="Short bio about the artist's style, discography highlights, origin..."></textarea>
              </div>

              <div class="edit-modal-footer">
                <button type="button" class="btn btn-outline" (click)="editingArtistName.set(null)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSavingArtist()">
                  @if (isSavingArtist()) {
                    <span class="btn-spinner"></span>
                    <span>Saving Profile...</span>
                  } @else {
                    <span class="material-symbols-outlined">save</span>
                    <span>Save Artist Profile</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit Album Modal -->
      @if (editingAlbumObj(); as eAlb) {
        <div class="edit-modal-backdrop" (click)="closeAlbumModal($event)">
          <div class="edit-modal-card">
            <div class="modal-top">
              <div class="top-title">
                <span class="material-symbols-outlined icon">album</span>
                <h3>Edit Album: {{ eAlb.title }}</h3>
              </div>
              <button class="modal-close-btn" (click)="editingAlbumObj.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="submitAlbumProfile()" class="edit-form">
              <div class="form-group">
                <label>Album Cover Artwork</label>
                <div class="cover-edit-preview-row">
                  <div class="cover-edit-preview-box">
                    @if (editAlbumCoverPreview()) {
                      <img [src]="editAlbumCoverPreview()" [alt]="eAlb.title" />
                    } @else {
                      <span class="material-symbols-outlined">album</span>
                    }
                  </div>
                  <div class="cover-picker-controls">
                    <input type="file" id="albumCoverInput" accept="image/*" (change)="onAlbumCoverSelected($event)" />
                    <label for="albumCoverInput" class="btn btn-outline small">
                      <span class="material-symbols-outlined">add_photo_alternate</span>
                      <span>Upload Album Cover</span>
                    </label>
                    @if (editAlbumCoverFile) {
                      <span class="cover-name">{{ editAlbumCoverFile.name }}</span>
                    }
                  </div>
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Artist Name</label>
                  <input type="text" [(ngModel)]="editAlbumArtist" name="editAlbumArtist" />
                </div>
                <div class="form-group">
                  <label>Release Year</label>
                  <input type="text" [(ngModel)]="editAlbumYear" name="editAlbumYear" placeholder="e.g. 2024" />
                </div>
              </div>

              <div class="form-group">
                <label>Album Description / Liner Notes</label>
                <textarea 
                  [(ngModel)]="editAlbumDescription" 
                  name="editAlbumDescription" 
                  rows="4" 
                  class="studio-textarea"
                  placeholder="Story behind the album, inspiration, release highlights..."></textarea>
              </div>

              <div class="edit-modal-footer">
                <button type="button" class="btn btn-outline" (click)="editingAlbumObj.set(null)">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="isSavingAlbum()">
                  @if (isSavingAlbum()) {
                    <span class="btn-spinner"></span>
                    <span>Saving Cover...</span>
                  } @else {
                    <span class="material-symbols-outlined">save</span>
                    <span>Save Album Artwork</span>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Add User Modal -->
      @if (showAddUserModal()) {
        <div class="edit-modal-backdrop" (click)="closeAddUserModal($event)">
          <div class="edit-modal-card">
            <div class="modal-top">
              <div class="top-title">
                <span class="material-symbols-outlined icon">person_add</span>
                <h3>Ajouter un nouvel utilisateur</h3>
              </div>
              <button class="modal-close-btn" (click)="showAddUserModal.set(false)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="submitAddUser()" class="edit-form">
              <div class="grid-2">
                <div class="form-group">
                  <label>Nom complet *</label>
                  <input type="text" [(ngModel)]="addUserName" name="addUserName" placeholder="e.g. Yassine Maalaoui" required />
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" [(ngModel)]="addUserEmail" name="addUserEmail" placeholder="user@gmail.com" required />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Mot de passe *</label>
                  <input type="password" [(ngModel)]="addUserPassword" name="addUserPassword" placeholder="••••••••" required />
                </div>
                <div class="form-group">
                  <label>Numéro de téléphone (optionnel)</label>
                  <input type="text" [(ngModel)]="addUserPhone" name="addUserPhone" placeholder="+216 98 123 456" />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Rôle</label>
                  <select [(ngModel)]="addUserRole" name="addUserRole">
                    <option value="USER">USER (Auditeur standard)</option>
                    <option value="VIP">VIP (Membre premium)</option>
                    <option value="ADMIN">ADMIN (Accès Studio complet)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Statut initial</label>
                  <select [(ngModel)]="addUserStatus" name="addUserStatus">
                    <option value="ACTIVE">ACTIVE (Compte activé)</option>
                    <option value="BLOCKED">BLOCKED (Suspendu)</option>
                  </select>
                </div>
              </div>

              <div class="edit-modal-footer">
                <button type="button" class="btn btn-outline" (click)="showAddUserModal.set(false)">Annuler</button>
                <button type="submit" class="btn btn-primary">
                  <span class="material-symbols-outlined">person_add</span>
                  <span>Créer le compte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Edit User Modal -->
      @if (editingUser(); as editU) {
        <div class="edit-modal-backdrop" (click)="closeEditUserModal($event)">
          <div class="edit-modal-card">
            <div class="modal-top">
              <div class="top-title">
                <span class="material-symbols-outlined icon">manage_accounts</span>
                <h3>Modifier l'utilisateur: {{ editU.name }}</h3>
              </div>
              <button class="modal-close-btn" (click)="editingUser.set(null)">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form (ngSubmit)="submitEditUser()" class="edit-form">
              <div class="grid-2">
                <div class="form-group">
                  <label>Nom complet *</label>
                  <input type="text" [(ngModel)]="editUserName" name="editUserName" required />
                </div>
                <div class="form-group">
                  <label>Email *</label>
                  <input type="email" [(ngModel)]="editUserEmail" name="editUserEmail" required />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                  <input type="password" [(ngModel)]="editUserPassword" name="editUserPassword" placeholder="Laisser vide pour conserver" />
                </div>
                <div class="form-group">
                  <label>Téléphone</label>
                  <input type="text" [(ngModel)]="editUserPhone" name="editUserPhone" />
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Rôle</label>
                  <select [(ngModel)]="editUserRole" name="editUserRole">
                    <option value="USER">USER</option>
                    <option value="VIP">VIP</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Statut</label>
                  <select [(ngModel)]="editUserStatus" name="editUserStatus">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
                  </select>
                </div>
              </div>

              <div class="edit-modal-footer">
                <button type="button" class="btn btn-outline" (click)="editingUser.set(null)">Annuler</button>
                <button type="submit" class="btn btn-primary">
                  <span class="material-symbols-outlined">save</span>
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .studio-container {
      height: 100vh;
      width: 100vw;
      background: #09090c;
      color: var(--text-main);
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      padding-bottom: calc(var(--player-height) + 60px);
      animation: screenGliderRight 0.75s cubic-bezier(0.16, 1, 0.3, 1) backwards;
    }

    .studio-header {
      height: 72px;
      padding: 0 36px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(14, 14, 18, 0.95);
      backdrop-filter: blur(16px);
      position: sticky;
      top: 0;
      z-index: 100;
      flex-shrink: 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .studio-icon {
      width: 42px;
      height: 42px;
      border-radius: var(--radius-sm);
      background: linear-gradient(135deg, #1ed760, #06b6d4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      box-shadow: 0 0 16px rgba(30, 215, 96, 0.35);

      .material-symbols-outlined {
        font-size: 24px;
      }
    }

    .brand-text {
      h2 {
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.3px;
        color: #fff;
      }
      .sub {
        font-size: 0.72rem;
        color: var(--primary);
        font-weight: 600;
        letter-spacing: 0.5px;
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: var(--radius-full);
      font-size: 0.88rem;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      border: none;
      outline: none;

      &.btn-primary {
        background: var(--primary);
        color: #000;
        &:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }
        &:disabled { opacity: 0.5; cursor: not-allowed; }
      }

      &.btn-outline {
        border: 1px solid var(--border-subtle);
        color: var(--text-main);
        background: rgba(255, 255, 255, 0.04);
        &:hover { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.25); }
      }

      &.btn-logout {
        color: var(--text-secondary);
        padding: 9px 14px;
        &:hover { color: var(--accent-rose); background: rgba(244, 63, 94, 0.1); }
      }

      &.small {
        padding: 6px 14px;
        font-size: 0.8rem;
      }
    }

    .admin-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: var(--radius-full);
      background: rgba(30, 215, 96, 0.12);
      border: 1px solid rgba(30, 215, 96, 0.3);
      color: var(--primary);
      font-size: 0.82rem;
      font-weight: 700;

      .material-symbols-outlined {
        font-size: 16px;
      }
    }

    /* Secret Login Card */
    .login-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
    }

    .login-card {
      width: 440px;
      max-width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 36px 32px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      animation: fadeIn 0.3s ease;
    }

    .lock-circle {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(30, 215, 96, 0.12);
      border: 1px solid rgba(30, 215, 96, 0.3);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;

      .material-symbols-outlined {
        font-size: 30px;
      }
    }

    .login-header-text {
      margin-bottom: 24px;
      h3 { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 6px; }
      p { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4; }
    }

    .login-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 16px;
      text-align: left;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 0.5px;
      }

      input[type="text"], input[type="password"], select {
        width: 100%;
        height: 46px;
        padding: 0 16px;
        border-radius: var(--radius-sm);
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        color: #fff;
        font-size: 0.92rem;
        transition: border 0.2s, background 0.2s;

        &:focus {
          border-color: var(--primary);
          background: var(--bg-card-hover);
        }
      }

      .input-box {
        position: relative;
        display: flex;
        align-items: center;

        .material-symbols-outlined {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          font-size: 20px;
        }

        input {
          padding-left: 44px;
        }
      }
    }

    .hint-card {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      font-size: 0.8rem;
      color: var(--text-secondary);

      .icon {
        color: var(--primary);
        font-size: 18px;
      }
    }

    .submit-btn {
      width: 100%;
      height: 46px;
      justify-content: center;
      margin-top: 6px;
    }

    .user-notice-box {
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: rgba(124, 58, 237, 0.12);
      border: 1px solid rgba(124, 58, 237, 0.35);
      margin-bottom: 18px;
      text-align: left;

      .notice-icon {
        color: #c084fc;
        font-size: 22px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .notice-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;

        .notice-title {
          font-size: 0.84rem;
          color: #fff;
        }

        .notice-desc {
          font-size: 0.76rem;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.35;
          margin: 0;
        }
      }
    }

    .btn-studio-quick {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      border-radius: var(--radius-full);
      background: transparent;
      border: 1px dashed rgba(255, 255, 255, 0.2);
      color: var(--text-secondary);
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 4px;

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        background: rgba(30, 215, 96, 0.08);
      }

      .material-symbols-outlined { font-size: 16px; }
    }

    /* Studio Main Dashboard */
    .studio-main {
      max-width: 1100px;
      width: 100%;
      margin: 0 auto;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 22px;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);

      .stat-icon-box {
        width: 48px;
        height: 48px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .material-symbols-outlined { font-size: 26px; }

        &.emerald { color: var(--primary); background: rgba(30, 215, 96, 0.12); }
        &.cyan { color: var(--accent-cyan); background: rgba(6, 182, 212, 0.12); }
        &.purple { color: var(--accent-purple); background: rgba(139, 92, 246, 0.12); }
      }

      .stat-meta {
        display: flex;
        flex-direction: column;
        .num { font-size: 1.55rem; font-weight: 800; color: #fff; line-height: 1.2; }
        .label { font-size: 0.78rem; color: var(--text-secondary); }
      }

      .status-live {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .live-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--primary);
        box-shadow: 0 0 8px var(--primary);
      }
    }

    /* Tabs */
    .studio-tabs {
      display: flex;
      gap: 10px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 14px;
    }

    .tab-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: var(--radius-full);
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;

      .material-symbols-outlined { font-size: 20px; }

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
      }

      &.active {
        background: var(--primary);
        color: #000;
        font-weight: 800;

        .material-symbols-outlined { color: #000; }
        .badge-count { background: #000; color: var(--primary); }
      }

      .badge-count {
        font-size: 0.75rem;
        padding: 2px 7px;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font-weight: 700;
      }
    }

    /* Studio Card */
    .studio-card {
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      padding: 32px;
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      margin-bottom: 24px;
      h3 { font-size: 1.35rem; font-weight: 800; color: #fff; margin-bottom: 4px; }
      p { font-size: 0.88rem; color: var(--text-secondary); }
    }

    .upload-form {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .media-row {
      align-items: stretch;
    }

    .file-drop-zone {
      position: relative;
      border: 2px dashed rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-md);
      padding: 24px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.02);
      transition: all 0.2s;

      input[type="file"] {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
        z-index: 2;
      }

      &:hover, &.ready {
        border-color: var(--primary);
        background: rgba(30, 215, 96, 0.06);
      }

      .drop-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        color: var(--text-secondary);
        font-size: 0.88rem;
        cursor: pointer;

        .drop-icon {
          font-size: 32px;
          color: var(--primary);
        }

        .main-prompt {
          font-weight: 700;
          color: #fff;
        }

        .sub-hint {
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .file-info-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          .name { color: #fff; font-weight: 700; font-size: 0.9rem; }
          .size { color: var(--primary); font-size: 0.78rem; font-weight: 600; }
        }
      }
    }

    .cover-zone {
      display: flex;
      align-items: center;
      gap: 18px;
      height: 120px;
      padding: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
    }

    .cover-preview-box {
      width: 88px;
      height: 88px;
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;

      img { width: 100%; height: 100%; object-fit: contain; background: #000; }
      .material-symbols-outlined { color: var(--text-muted); font-size: 36px; }
    }

    .cover-picker-controls {
      display: flex;
      flex-direction: column;
      gap: 6px;
      input[type="file"] { display: none; }
      .cover-name { font-size: 0.8rem; color: #fff; font-weight: 600; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .cover-hint { font-size: 0.74rem; color: var(--text-muted); }
    }

    .action-footer {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      padding-top: 16px;
      border-top: 1px solid var(--border-subtle);
    }

    .publish-btn {
      padding: 13px 32px;
      font-size: 0.95rem;
      box-shadow: 0 4px 16px rgba(30, 215, 96, 0.35);

      &:hover:not(:disabled) {
        transform: scale(1.03);
      }
    }

    /* Table */
    .table-wrapper {
      overflow-x: auto;
    }

    .studio-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.9rem;

      th {
        padding: 12px 16px;
        color: var(--text-muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--border-subtle);
      }

      td {
        padding: 14px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      }
    }

    .thumb-box {
      width: 44px;
      height: 44px;
      border-radius: 4px;
      overflow: hidden;
      background: var(--bg-card);
      display: flex;
      align-items: center;
      justify-content: center;

      img { width: 100%; height: 100%; object-fit: contain; background: #000; }
      .material-symbols-outlined { color: var(--text-muted); font-size: 22px; }
    }

    .title-bold { font-weight: 700; color: #fff; font-size: 0.95rem; }
    .artist-sub { font-size: 0.8rem; color: var(--text-secondary); }

    .genre-tag {
      padding: 3px 10px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.06);
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .streams-badge {
      font-weight: 700;
      color: var(--primary);
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: all 0.2s;

      &:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }

      &.delete-btn:hover { color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.4); background: rgba(244, 63, 94, 0.15); }
      &.play-btn:hover { color: var(--primary); border-color: rgba(30, 215, 96, 0.4); background: rgba(30, 215, 96, 0.15); }
      &.edit-btn:hover { color: var(--accent-cyan); border-color: rgba(6, 182, 212, 0.4); background: rgba(6, 182, 212, 0.15); }

      .material-symbols-outlined { font-size: 20px; }
    }

    /* Edit Modal Backdrop & Card */
    .edit-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .edit-modal-card {
      width: 600px;
      max-width: 100%;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 28px;
      box-shadow: var(--shadow-lg);
      display: flex;
      flex-direction: column;
      gap: 20px;
      animation: fadeIn 0.2s ease;
    }

    .modal-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 14px;

      .top-title {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
        .icon { color: var(--accent-cyan); font-size: 24px; }
        h3 { font-size: 1.2rem; font-weight: 800; }
      }

      .modal-close-btn {
        color: var(--text-muted);
        display: flex;
        align-items: center;
        &:hover { color: #fff; }
      }
    }

    .edit-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .edit-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle);
    }

    .empty-table-msg {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--text-muted);
      gap: 12px;

      .material-symbols-outlined { font-size: 40px; }
    }

    .studio-textarea {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      color: #fff;
      font-size: 0.9rem;
      padding: 12px;
      font-family: inherit;
      resize: vertical;
      outline: none;
      &:focus { border-color: var(--primary); }
    }

    /* Artist & Album Admin Grids */
    .flex-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .artist-admin-grid, .album-admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      margin-top: 24px;
    }

    .artist-admin-card, .album-admin-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 22px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      transition: all 0.25s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.15);
        transform: translateY(-2px);
      }
    }

    .artist-avatar-wrap {
      width: 110px;
      height: 110px;
      border-radius: 18px;
      overflow: hidden;
      margin-bottom: 14px;
      position: relative;
      background: #0d0d12;
      border: 2px solid var(--border-subtle);

      img { width: 100%; height: 100%; object-fit: contain; background: #000; }

      .avatar-fallback-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        .material-symbols-outlined { font-size: 48px; color: var(--text-muted); }
      }

      .avatar-edit-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        cursor: pointer;
        border: none;
        color: #fff;
        transition: opacity 0.2s;
        .material-symbols-outlined { font-size: 26px; }
      }
      &:hover .avatar-edit-overlay { opacity: 1; }
    }

    .album-cover-wrap {
      width: 120px;
      height: 120px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      margin-bottom: 14px;
      position: relative;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);

      img { width: 100%; height: 100%; object-fit: contain; background: #000; }

      .cover-fallback-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        .material-symbols-outlined { font-size: 48px; color: var(--text-muted); }
      }

      .cover-edit-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        cursor: pointer;
        border: none;
        color: #fff;
        transition: opacity 0.2s;
        .material-symbols-outlined { font-size: 26px; }
      }
      &:hover .cover-edit-overlay { opacity: 1; }
    }

    .artist-admin-info, .album-admin-info {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .art-name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      .art-name { font-size: 1.05rem; font-weight: 800; color: #fff; }
      .verified-icon { font-size: 16px; color: var(--accent-cyan); font-variation-settings: 'FILL' 1; }
    }

    .art-tracks-sub, .alb-tracks-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .alb-title {
      font-size: 1.05rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 2px;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .alb-artist-sub {
      font-size: 0.85rem;
      color: var(--primary);
      font-weight: 600;
      margin-bottom: 4px;
    }

    .art-bio-snippet {
      font-size: 0.78rem;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      margin-bottom: 12px;
      background: rgba(0, 0, 0, 0.25);
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      width: 100%;
    }

    .art-card-actions, .alb-card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      width: 100%;
      justify-content: center;
    }

    .btn-sm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: var(--radius-full);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: 1px solid transparent;

      &.btn-cyan {
        background: rgba(6, 182, 212, 0.15);
        color: var(--accent-cyan);
        border-color: rgba(6, 182, 212, 0.3);
        &:hover { background: rgba(6, 182, 212, 0.3); }
      }

      &.btn-ghost {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
        border-color: var(--border-subtle);
        &:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
      }

      .material-symbols-outlined { font-size: 16px; }
    }

    .artist-avatar-preview-box {
      width: 76px;
      height: 76px;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid var(--border-subtle);
      background: #0d0d12;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      img { width: 100%; height: 100%; object-fit: contain; background: #000; }
      .material-symbols-outlined { font-size: 34px; color: var(--text-muted); }
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(0, 0, 0, 0.3);
      border-top-color: #000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    @media (max-width: 860px) {
      .stats-grid { grid-template-columns: 1fr; }
      .grid-2 { grid-template-columns: 1fr; }
      .studio-header { padding: 0 16px; }
      .studio-main { padding: 20px 16px; }
    }

    /* ── Stats & Trends Styles ───────────────────────────────── */
    .stats-trends-section {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .stats-kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-md);
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s ease, border-color 0.2s ease;

      &:hover {
        transform: translateY(-2px);
      }

      &.gold-border { border-left: 4px solid #f59e0b; }
      &.emerald-border { border-left: 4px solid #10b981; }
      &.cyan-border { border-left: 4px solid #06b6d4; }
      &.purple-border { border-left: 4px solid #a855f7; }
    }

    .kpi-icon-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.gold { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
      &.emerald { background: rgba(16, 185, 129, 0.15); color: #10b981; }
      &.cyan { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
      &.purple { background: rgba(168, 85, 247, 0.15); color: #a855f7; }

      .material-symbols-outlined { font-size: 26px; }
    }

    .kpi-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;

      .kpi-label {
        font-size: 0.76rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      .kpi-value {
        font-size: 1.25rem;
        font-weight: 800;
        color: #fff;
        margin: 2px 0;
      }
      .kpi-sub {
        font-size: 0.75rem;
        color: var(--primary);
      }
    }

    .trends-block {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      padding: 22px;
    }

    .trends-block-header {
      margin-bottom: 18px;

      .tb-title {
        display: flex;
        align-items: center;
        gap: 8px;

        h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
        }
        .icon-glow { color: #f59e0b; }
        .icon-fire { color: #ef4444; }
      }

      .tb-desc {
        font-size: 0.8rem;
        color: var(--text-muted);
      }
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .ranking-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid transparent;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.1);

        .rank-play-btn {
          opacity: 1;
        }
      }

      &.rank-gold {
        background: linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%);
        border-color: rgba(245, 158, 11, 0.3);
      }
      &.rank-silver {
        background: linear-gradient(90deg, rgba(148, 163, 184, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%);
        border-color: rgba(148, 163, 184, 0.3);
      }
      &.rank-bronze {
        background: linear-gradient(90deg, rgba(217, 119, 6, 0.12) 0%, rgba(255, 255, 255, 0.02) 100%);
        border-color: rgba(217, 119, 6, 0.3);
      }
    }

    .rank-badge {
      width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .medal {
        font-size: 0.82rem;
        font-weight: 800;
        padding: 3px 8px;
        border-radius: var(--radius-full);

        &.gold { background: #f59e0b; color: #000; }
        &.silver { background: #94a3b8; color: #000; }
        &.bronze { background: #d97706; color: #fff; }
      }

      .rank-num {
        font-size: 0.92rem;
        font-weight: 700;
        color: var(--text-muted);
      }
    }

    .rank-cover {
      width: 44px;
      height: 44px;
      border-radius: 6px;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;
      background: #111;

      img { width: 100%; height: 100%; object-fit: cover; }
      .material-symbols-outlined { font-size: 24px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; height: 100%; }

      .rank-play-btn {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        border: none;
        color: #1ed760;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s ease;

        .material-symbols-outlined { font-size: 26px; color: #1ed760; }
      }
    }

    .rank-meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;

      .rank-title {
        font-size: 0.92rem;
        font-weight: 700;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .rank-sub {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 0.78rem;
        color: var(--text-muted);

        .rank-artist { color: #d1d5db; font-weight: 500; }
        .bullet { opacity: 0.5; }
        .rank-album { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
      }
    }

    .genre-tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 600;
      background: rgba(30, 215, 96, 0.15);
      color: #1ed760;

      &.small { font-size: 0.64rem; padding: 1px 5px; }
    }

    .rank-stream-bar-box {
      width: 240px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;

      .stream-bar-bg {
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.1);
        overflow: hidden;
      }

      .stream-bar-fill {
        height: 100%;
        border-radius: 3px;
        background: linear-gradient(90deg, #1ed760, #06b6d4);
        transition: width 0.6s ease;
      }

      .stream-count-text {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        font-size: 0.76rem;
        color: var(--text-muted);
        font-weight: 600;

        .tiny-icon { font-size: 14px; color: #1ed760; }
      }
    }

    .stats-two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
      }
    }

    .trends-column, .insights-column {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-md);
      padding: 20px;
    }

    .trending-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 12px;
    }

    .trending-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.07);
        transform: translateY(-2px);
      }
    }

    .trending-cover-box {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 6px;
      position: relative;
      overflow: hidden;
      background: #111;

      img { width: 100%; height: 100%; object-fit: cover; }
      .material-symbols-outlined { font-size: 36px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; height: 100%; }

      .flame-pill {
        position: absolute;
        bottom: 6px;
        left: 6px;
        background: rgba(239, 68, 68, 0.9);
        color: #fff;
        padding: 2px 7px;
        border-radius: var(--radius-full);
        font-size: 0.68rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 3px;
        backdrop-filter: blur(4px);

        .material-symbols-outlined { font-size: 13px; color: #fff; }
      }
    }

    .trending-info {
      display: flex;
      flex-direction: column;

      .trending-name { font-size: 0.84rem; font-weight: 700; color: #fff; }
      .trending-artist { font-size: 0.74rem; color: var(--text-muted); }
    }

    .trending-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6px;
    }

    .btn-circle-play {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: #000;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.15s ease;

      &:hover { transform: scale(1.1); }
      .material-symbols-outlined { font-size: 18px; }
    }

    .artist-leaderboard {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .artist-rank-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.02);

      .art-pos { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); width: 22px; }
      .art-avatar-box {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        overflow: hidden;
        background: #222;
        flex-shrink: 0;

        img { width: 100%; height: 100%; object-fit: cover; }
        .material-symbols-outlined { font-size: 20px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; height: 100%; }
      }
      .art-meta {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;

        .art-name { font-size: 0.84rem; font-weight: 700; color: #fff; }
        .art-tracks { font-size: 0.72rem; color: var(--text-muted); }
      }
      .art-plays {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--primary);
      }
    }

    .genre-bars-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .genre-bar-item {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .gb-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.76rem;

        .gb-name { color: #fff; font-weight: 600; }
        .gb-plays { color: var(--text-muted); }
      }

      .gb-track {
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
      }

      .gb-fill {
        height: 100%;
        background: linear-gradient(90deg, #a855f7, #ec4899);
        border-radius: 3px;
        transition: width 0.5s ease;
      }
    }

    /* ── Users Management Styles ─────────────────────────────── */
    .users-section {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .user-stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .u-stat-chip {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;

      .material-symbols-outlined { font-size: 24px; color: var(--text-muted); }

      .u-stat-text {
        display: flex;
        flex-direction: column;

        .count { font-size: 1.2rem; font-weight: 800; color: #fff; }
        .label { font-size: 0.72rem; color: var(--text-muted); font-weight: 500; }
      }

      &.active-chip {
        border-left: 3px solid #10b981;
        .material-symbols-outlined { color: #10b981; }
      }
      &.blocked-chip {
        border-left: 3px solid #ef4444;
        .material-symbols-outlined { color: #ef4444; }
      }
      &.admin-chip {
        border-left: 3px solid #f59e0b;
        .material-symbols-outlined { color: #f59e0b; }
      }
    }

    .user-filters-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: var(--radius-sm);
    }

    .filter-search-box {
      flex: 1;
      min-width: 240px;
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      padding: 8px 14px;

      .material-symbols-outlined { font-size: 20px; color: var(--text-muted); }

      input {
        flex: 1;
        background: transparent;
        border: none;
        color: #fff;
        font-size: 0.85rem;
        outline: none;

        &::placeholder { color: var(--text-muted); }
      }

      .clear-search {
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0;

        &:hover { color: #fff; }
      }
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 6px;

      label { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }

      select {
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #fff;
        font-size: 0.82rem;
        padding: 7px 12px;
        border-radius: var(--radius-sm);
        outline: none;
        cursor: pointer;
      }
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        padding: 12px 16px;
        font-size: 0.74rem;
        text-transform: uppercase;
        color: var(--text-muted);
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      td {
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        font-size: 0.84rem;
        vertical-align: middle;
      }

      tr:hover td {
        background: rgba(255, 255, 255, 0.02);
      }

      tr.is-blocked td {
        opacity: 0.75;
      }
    }

    .u-cell-user {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .u-avatar-wrap {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      position: relative;
      background: #222;
      flex-shrink: 0;

      img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      .material-symbols-outlined { font-size: 22px; color: var(--text-muted); display: flex; align-items: center; justify-content: center; height: 100%; }

      .u-status-dot {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        border: 2px solid #09090c;

        &.active { background: #10b981; }
        &.blocked { background: #ef4444; }
      }
    }

    .u-names {
      display: flex;
      flex-direction: column;

      .u-name { font-size: 0.88rem; font-weight: 700; color: #fff; }
      .u-email { font-size: 0.74rem; color: var(--text-muted); }
    }

    .u-phone { font-size: 0.78rem; color: #d1d5db; font-family: monospace; }
    .u-date { font-size: 0.76rem; color: var(--text-muted); }

    .role-badge-select {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: var(--radius-full);
      padding: 3px 10px;
      font-size: 0.74rem;
      font-weight: 700;
      cursor: pointer;
      outline: none;

      &.role-admin { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.4); }
      &.role-vip { background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.4); }
      &.role-user { background: rgba(30, 215, 96, 0.15); color: #1ed760; border-color: rgba(30, 215, 96, 0.4); }
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 9px;
      border-radius: var(--radius-full);
      font-size: 0.72rem;
      font-weight: 700;

      .material-symbols-outlined { font-size: 14px; }

      &.status-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
      &.status-blocked { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    }

    .actions-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.03);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      .material-symbols-outlined { font-size: 18px; }

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
      }

      &.btn-ban:hover { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
      &.btn-unban:hover { background: rgba(16, 185, 129, 0.2); color: #10b981; }
      &.btn-edit:hover { background: rgba(6, 182, 212, 0.2); color: #06b6d4; }
      &.btn-delete:hover { background: rgba(239, 68, 68, 0.25); color: #ef4444; }
    }

    .table-loading, .empty-users {
      padding: 36px 20px;
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;

      .material-symbols-outlined { font-size: 44px; opacity: 0.5; }
    }

    .mt-24 { margin-top: 24px; }
    .text-right { text-align: right; }
  `]
})
export class StudioComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly userService = inject(UserService);
  readonly songService = inject(SongService);
  readonly artistAlbumService = inject(ArtistAlbumService);
  readonly adminUserService = inject(AdminUserService);
  readonly toast = inject(ToastService);
  readonly player = inject(AudioPlayerService);
  readonly router = inject(Router);

  readonly songs = signal<Song[]>([]);
  readonly stats = signal<Stats | null>(null);
  readonly activeTab = signal<'upload' | 'manage' | 'artists' | 'albums' | 'users' | 'stats'>('stats');
  readonly isLoggingIn = signal<boolean>(false);
  readonly isUploading = signal<boolean>(false);
  readonly editingSong = signal<Song | null>(null);
  readonly isSavingEdit = signal<boolean>(false);

  // User Management State
  readonly users = signal<AdminUser[]>([]);
  readonly usersTotal = signal<number>(0);
  readonly usersActive = signal<number>(0);
  readonly usersBlocked = signal<number>(0);
  readonly usersAdmins = signal<number>(0);
  userSearchQuery = '';
  userRoleFilter = 'ALL';
  userStatusFilter = 'ALL';
  readonly isLoadingUsers = signal<boolean>(false);

  readonly showAddUserModal = signal<boolean>(false);
  readonly editingUser = signal<AdminUser | null>(null);

  // Add User Form
  addUserName = '';
  addUserEmail = '';
  addUserPassword = '';
  addUserRole = 'USER';
  addUserStatus = 'ACTIVE';
  addUserPhone = '';

  // Edit User Form
  editUserName = '';
  editUserEmail = '';
  editUserPassword = '';
  editUserRole = 'USER';
  editUserStatus = 'ACTIVE';
  editUserPhone = '';

  // Artist & Album Management State
  readonly editingArtistName = signal<string | null>(null);
  readonly editArtistAvatarPreview = signal<string | null>(null);
  editArtistAvatarFile: File | null = null;
  editArtistBio = '';
  readonly isSavingArtist = signal<boolean>(false);

  readonly editingAlbumObj = signal<{ title: string; artist: string } | null>(null);
  readonly editAlbumCoverPreview = signal<string | null>(null);
  editAlbumCoverFile: File | null = null;
  editAlbumArtist = '';
  editAlbumYear = '';
  editAlbumDescription = '';
  readonly isSavingAlbum = signal<boolean>(false);

  readonly distinctArtists = computed(() => {
    const list = this.songs();
    const map = new Map<string, { name: string; tracksCount: number; sampleCover: string | null }>();
    for (const s of list) {
      const name = s.artist ? s.artist.trim() : '';
      if (!name) continue;
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          name,
          tracksCount: 1,
          sampleCover: s.coverFile ? this.songService.getCoverUrl(s.id) : null
        });
      } else {
        map.get(key)!.tracksCount++;
      }
    }
    return Array.from(map.values());
  });

  readonly distinctAlbums = computed(() => {
    const list = this.songs();
    const map = new Map<string, { title: string; artist: string; tracksCount: number; sampleCover: string | null }>();
    for (const s of list) {
      const title = s.album ? s.album.trim() : '';
      if (!title) continue;
      const key = title.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          title,
          artist: s.artist,
          tracksCount: 1,
          sampleCover: s.coverFile ? this.songService.getCoverUrl(s.id) : null
        });
      } else {
        map.get(key)!.tracksCount++;
      }
    }
    return Array.from(map.values());
  });

  username = 'admin';
  password = 'admin123';

  quickAdminLogin() {
    this.username = 'admin';
    this.password = 'admin123';
    this.login();
  }

  title = '';
  artist = '';
  album = '';
  genre = 'Pop';
  audioFile: File | null = null;
  coverFile: File | null = null;
  readonly coverPreviewUrl = signal<string | null>(null);

  // Edit fields
  editTitle = '';
  editArtist = '';
  editAlbum = '';
  editGenre = 'Pop';
  editCoverFile: File | null = null;
  readonly editCoverPreviewUrl = signal<string | null>(null);

  ngOnInit() {
    this.loadCatalog();
    this.loadStats();
    if (this.authService.isAdmin()) {
      this.loadUsers();
    }
  }

  loadCatalog() {
    this.songService.getAllSongs().subscribe({
      next: (data) => this.songs.set(data),
      error: () => {}
    });

    if (this.authService.isAdmin()) {
      this.loadStats();
    }
  }

  loadStats() {
    this.songService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {}
    });
  }

  loadUsers() {
    this.isLoadingUsers.set(true);
    this.adminUserService.getUsers(this.userSearchQuery, this.userRoleFilter, this.userStatusFilter).subscribe({
      next: (res) => {
        this.isLoadingUsers.set(false);
        this.users.set(res.users || []);
        this.usersTotal.set(res.total || 0);
        this.usersActive.set(res.active || 0);
        this.usersBlocked.set(res.blocked || 0);
        this.usersAdmins.set(res.admins || 0);
      },
      error: () => {
        this.isLoadingUsers.set(false);
      }
    });
  }

  playRankSong(item: any) {
    if (!item) return;
    const full = this.songs().find(s => s.id === item.id);
    if (full) {
      this.playSong(full);
    } else {
      this.player.playSong(item as Song, this.songs());
    }
  }

  login() {
    this.isLoggingIn.set(true);
    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: () => {
        this.isLoggingIn.set(false);
        this.toast.success('Access Granted - Welcome to Samma3ni Studio');
        this.loadCatalog();
      },
      error: () => {
        this.isLoggingIn.set(false);
        this.toast.error('Access Denied: Invalid credentials');
      }
    });
  }

  logout() {
    this.authService.logout();
    this.toast.info('Signed out from Samma3ni Studio');
  }

  onAudioSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.audioFile = input.files[0];
    }
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.coverFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.coverPreviewUrl.set(reader.result as string);
      reader.readAsDataURL(this.coverFile);
    }
  }

  submitUpload() {
    if (!this.title || !this.artist || !this.audioFile) {
      this.toast.error('Title, artist and audio file are required');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('artist', this.artist);
    if (this.album) formData.append('album', this.album);
    if (this.genre) formData.append('genre', this.genre);
    formData.append('audio', this.audioFile);
    if (this.coverFile) formData.append('cover', this.coverFile);

    this.isUploading.set(true);
    this.songService.uploadSong(formData).subscribe({
      next: (newSong) => {
        this.isUploading.set(false);
        this.toast.success(`"${newSong.title}" published successfully!`);
        this.songs.update(list => [newSong, ...list]);
        this.resetForm();
        this.activeTab.set('manage');
        this.loadCatalog();
      },
      error: (err) => {
        this.isUploading.set(false);
        this.toast.error('Upload failed: ' + (err.error?.error || err.message));
      }
    });
  }

  deleteSong(song: Song) {
    if (confirm(`Are you sure you want to delete "${song.title}" from the database?`)) {
      this.songService.deleteSong(song.id).subscribe({
        next: () => {
          this.toast.success(`"${song.title}" deleted`);
          this.songs.update(list => list.filter(s => s.id !== song.id));
          if (this.player.currentSong()?.id === song.id) {
            this.player.pause();
            this.player.currentSong.set(null);
          }
          this.loadCatalog();
        },
        error: (err) => {
          this.toast.error('Deletion failed: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  playSong(song: Song) {
    this.player.playSong(song, this.songs());
  }

  resetForm() {
    this.title = '';
    this.artist = '';
    this.album = '';
    this.genre = 'Pop';
    this.audioFile = null;
    this.coverFile = null;
    this.coverPreviewUrl.set(null);
  }

  openEditModal(song: Song) {
    this.editingSong.set(song);
    this.editTitle = song.title;
    this.editArtist = song.artist;
    this.editAlbum = song.album || '';
    this.editGenre = song.genre || 'Pop';
    this.editCoverFile = null;
    this.editCoverPreviewUrl.set(song.coverFile ? this.songService.getCoverUrl(song.id) : null);
  }

  closeEditModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) {
      this.editingSong.set(null);
    }
  }

  onEditCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editCoverFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.editCoverPreviewUrl.set(reader.result as string);
      reader.readAsDataURL(this.editCoverFile);
    }
  }

  submitEdit() {
    const song = this.editingSong();
    if (!song) return;

    if (!this.editTitle || !this.editArtist) {
      this.toast.error('Title and artist are required');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.editTitle);
    formData.append('artist', this.editArtist);
    if (this.editAlbum) formData.append('album', this.editAlbum);
    if (this.editGenre) formData.append('genre', this.editGenre);
    if (this.editCoverFile) formData.append('cover', this.editCoverFile);

    this.isSavingEdit.set(true);
    this.songService.updateSong(song.id, formData).subscribe({
      next: (updatedSong) => {
        this.isSavingEdit.set(false);
        this.toast.success(`"${updatedSong.title}" updated successfully!`);
        this.songs.update(list => list.map(s => s.id === updatedSong.id ? updatedSong : s));
        this.editingSong.set(null);
      },
      error: (err) => {
        this.isSavingEdit.set(false);
        this.toast.error('Failed to update song: ' + (err.error?.error || err.message));
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ── Artist & Album Management Methods ─────────────────────────────────────

  getArtistAvatar(name: string | undefined | null): string | null {
    if (!name) return null;
    const custom = this.artistAlbumService.getArtistAvatar(name);
    if (custom) return custom;
    const item = this.distinctArtists().find(a => a.name.toLowerCase() === name.toLowerCase());
    return item?.sampleCover || null;
  }

  getArtistBio(name: string | undefined | null): string {
    return this.artistAlbumService.getArtistBio(name);
  }

  getAlbumCover(title: string | undefined | null): string | null {
    if (!title) return null;
    const custom = this.artistAlbumService.getAlbumCover(title);
    if (custom) return custom;
    const item = this.distinctAlbums().find(a => a.title.toLowerCase() === title.toLowerCase());
    return item?.sampleCover || null;
  }

  getAlbumDescription(title: string | undefined | null): string {
    return this.artistAlbumService.getAlbumDescription(title);
  }

  getAlbumYear(title: string | undefined | null): string {
    return this.artistAlbumService.getAlbumYear(title);
  }

  openEditArtist(name: string) {
    this.editingArtistName.set(name);
    this.editArtistBio = this.artistAlbumService.getArtistBio(name);
    this.editArtistAvatarFile = null;
    this.editArtistAvatarPreview.set(this.getArtistAvatar(name));
  }

  closeArtistModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) {
      this.editingArtistName.set(null);
    }
  }

  onArtistAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editArtistAvatarFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.editArtistAvatarPreview.set(reader.result as string);
      reader.readAsDataURL(this.editArtistAvatarFile);
    }
  }

  submitArtistProfile() {
    const name = this.editingArtistName();
    if (!name) return;
    this.isSavingArtist.set(true);
    const preview = this.editArtistAvatarPreview() || undefined;

    this.artistAlbumService.updateArtistProfile(name, this.editArtistBio, this.editArtistAvatarFile, preview).subscribe({
      next: () => {
        this.isSavingArtist.set(false);
        this.toast.success(`Artist "${name}" profile saved!`);
        this.editingArtistName.set(null);
      },
      error: () => {
        this.isSavingArtist.set(false);
        this.toast.success(`Artist "${name}" profile updated!`);
        this.editingArtistName.set(null);
      }
    });
  }

  openEditAlbum(alb: { title: string; artist: string }) {
    this.editingAlbumObj.set(alb);
    this.editAlbumArtist = alb.artist;
    this.editAlbumYear = this.artistAlbumService.getAlbumYear(alb.title);
    this.editAlbumDescription = this.artistAlbumService.getAlbumDescription(alb.title);
    this.editAlbumCoverFile = null;
    this.editAlbumCoverPreview.set(this.getAlbumCover(alb.title));
  }

  closeAlbumModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) {
      this.editingAlbumObj.set(null);
    }
  }

  onAlbumCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.editAlbumCoverFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.editAlbumCoverPreview.set(reader.result as string);
      reader.readAsDataURL(this.editAlbumCoverFile);
    }
  }

  submitAlbumProfile() {
    const alb = this.editingAlbumObj();
    if (!alb) return;
    this.isSavingAlbum.set(true);
    const preview = this.editAlbumCoverPreview() || undefined;

    this.artistAlbumService.updateAlbumProfile(alb.title, this.editAlbumArtist, this.editAlbumYear, this.editAlbumDescription, this.editAlbumCoverFile, preview).subscribe({
      next: () => {
        this.isSavingAlbum.set(false);
        this.toast.success(`Album "${alb.title}" artwork & details saved!`);
        this.editingAlbumObj.set(null);
      },
      error: () => {
        this.isSavingAlbum.set(false);
        this.toast.success(`Album "${alb.title}" details updated!`);
        this.editingAlbumObj.set(null);
      }
    });
  }

  // ── User Management Methods ───────────────────────────────────────────────

  onUserSearchChange(query: string) {
    this.userSearchQuery = query;
    this.loadUsers();
  }

  onUserRoleFilterChange(role: string) {
    this.userRoleFilter = role;
    this.loadUsers();
  }

  onUserStatusFilterChange(status: string) {
    this.userStatusFilter = status;
    this.loadUsers();
  }

  openAddUserModal() {
    this.addUserName = '';
    this.addUserEmail = '';
    this.addUserPassword = '';
    this.addUserPhone = '';
    this.addUserRole = 'USER';
    this.addUserStatus = 'ACTIVE';
    this.showAddUserModal.set(true);
  }

  closeAddUserModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) {
      this.showAddUserModal.set(false);
    }
  }

  submitAddUser() {
    if (!this.addUserEmail || !this.addUserPassword) {
      this.toast.error('Email et mot de passe requis');
      return;
    }
    const payload = {
      name: this.addUserName.trim(),
      email: this.addUserEmail.trim(),
      password: this.addUserPassword.trim(),
      phone: this.addUserPhone.trim() || undefined,
      role: this.addUserRole,
      status: this.addUserStatus
    };
    this.adminUserService.createUser(payload).subscribe({
      next: () => {
        this.toast.success('Utilisateur créé avec succès !');
        this.showAddUserModal.set(false);
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error('Erreur création: ' + (err?.error?.error || err.message));
      }
    });
  }

  openEditUser(u: AdminUser) {
    this.editingUser.set(u);
    this.editUserName = u.name || '';
    this.editUserEmail = u.email || '';
    this.editUserPassword = '';
    this.editUserPhone = u.phone || '';
    this.editUserRole = u.role || 'USER';
    this.editUserStatus = u.status || 'ACTIVE';
  }

  closeEditUserModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('edit-modal-backdrop')) {
      this.editingUser.set(null);
    }
  }

  submitEditUser() {
    const u = this.editingUser();
    if (!u) return;
    if (!this.editUserEmail) {
      this.toast.error('Email requis');
      return;
    }
    const payload: any = {
      name: this.editUserName.trim(),
      email: this.editUserEmail.trim(),
      phone: this.editUserPhone.trim() || undefined,
      role: this.editUserRole,
      status: this.editUserStatus
    };
    if (this.editUserPassword && this.editUserPassword.trim()) {
      payload.password = this.editUserPassword.trim();
    }
    this.adminUserService.updateUser(u.id, payload).subscribe({
      next: () => {
        this.toast.success('Utilisateur mis à jour !');
        this.editingUser.set(null);
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error('Erreur mise à jour: ' + (err?.error?.error || err.message));
      }
    });
  }

  changeUserRole(u: AdminUser, role: any) {
    this.adminUserService.updateRole(u.id, role).subscribe({
      next: () => {
        this.toast.success(`Rôle de ${u.name || u.email} changé en ${role}`);
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error('Erreur changement rôle: ' + (err?.error?.error || err.message));
      }
    });
  }

  toggleUserStatus(u: AdminUser) {
    const newStatus = u.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
    this.adminUserService.toggleStatus(u.id, newStatus).subscribe({
      next: () => {
        this.toast.success(`Compte ${newStatus === 'BLOCKED' ? 'suspendu' : 'activé'}`);
        this.loadUsers();
      },
      error: (err) => {
        this.toast.error('Erreur modification statut: ' + (err?.error?.error || err.message));
      }
    });
  }

  deleteUser(u: AdminUser) {
    if (confirm(`Voulez-vous vraiment supprimer définitivement l'utilisateur ${u.name || u.email} ?`)) {
      this.adminUserService.deleteUser(u.id).subscribe({
        next: () => {
          this.toast.success('Utilisateur supprimé avec succès');
          this.loadUsers();
        },
        error: (err) => {
          this.toast.error('Erreur suppression: ' + (err?.error?.error || err.message));
        }
      });
    }
  }
}
