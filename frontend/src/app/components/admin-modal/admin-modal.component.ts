import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { SongService } from '../../services/song.service';
import { ToastService } from '../../services/toast.service';
import { Song, Stats } from '../../models/song.model';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-card">
          <!-- Modal Header -->
          <div class="modal-header">
            <div class="header-title">
              <span class="material-symbols-outlined icon">
                {{ authService.isAdmin() ? 'admin_panel_settings' : 'lock' }}
              </span>
              <h3>{{ authService.isAdmin() ? 'Admin Control Center' : 'Admin Login' }}</h3>
            </div>
            <button class="close-btn" (click)="close.emit()">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            @if (!authService.isAdmin()) {
              <!-- Login Form -->
              <form class="login-form" (ngSubmit)="login()">
                <p class="login-desc">Enter administrator credentials to manage library and upload tracks.</p>

                <div class="form-group">
                  <label for="username">Username</label>
                  <div class="input-wrapper">
                    <span class="material-symbols-outlined">person</span>
                    <input 
                      id="username" 
                      type="text" 
                      [(ngModel)]="loginUsername" 
                      name="username" 
                      placeholder="admin" 
                      required 
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="password">Password</label>
                  <div class="input-wrapper">
                    <span class="material-symbols-outlined">key</span>
                    <input 
                      id="password" 
                      type="password" 
                      [(ngModel)]="loginPassword" 
                      name="password" 
                      placeholder="admin123" 
                      required 
                    />
                  </div>
                </div>

                <div class="hint-box">
                  <span class="material-symbols-outlined">lightbulb</span>
                  <span>Default credentials: <b>admin</b> / <b>admin123</b></span>
                </div>

                <button type="submit" class="btn btn-primary submit-btn" [disabled]="isLoggingIn()">
                  @if (isLoggingIn()) {
                    <span class="btn-spinner"></span>
                    <span>Signing In...</span>
                  } @else {
                    <span>Sign In to Admin</span>
                  }
                </button>
              </form>
            } @else {
              <!-- Admin Dashboard Navigation Tabs -->
              <div class="admin-tabs">
                <button 
                  class="tab-btn" 
                  [class.active]="activeTab() === 'upload'"
                  (click)="activeTab.set('upload')">
                  <span class="material-symbols-outlined">cloud_upload</span>
                  <span>Upload Song</span>
                </button>
                <button 
                  class="tab-btn" 
                  [class.active]="activeTab() === 'manage'"
                  (click)="activeTab.set('manage')">
                  <span class="material-symbols-outlined">list</span>
                  <span>Manage Songs ({{ songs().length }})</span>
                </button>
                <button 
                  class="tab-btn" 
                  [class.active]="activeTab() === 'stats'"
                  (click)="loadStats(); activeTab.set('stats')">
                  <span class="material-symbols-outlined">analytics</span>
                  <span>Analytics</span>
                </button>
              </div>

              <!-- Tab Content: Upload Track -->
              @if (activeTab() === 'upload') {
                <form class="upload-form" (ngSubmit)="submitUpload()">
                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label>Title *</label>
                      <input 
                        type="text" 
                        [(ngModel)]="uploadTitle" 
                        name="title" 
                        placeholder="e.g. Blinding Lights" 
                        required 
                      />
                    </div>
                    <div class="form-group flex-1">
                      <label>Artist *</label>
                      <input 
                        type="text" 
                        [(ngModel)]="uploadArtist" 
                        name="artist" 
                        placeholder="e.g. The Weeknd" 
                        required 
                      />
                    </div>
                  </div>

                  <div class="form-row">
                    <div class="form-group flex-1">
                      <label>Album (Optional)</label>
                      <input 
                        type="text" 
                        [(ngModel)]="uploadAlbum" 
                        name="album" 
                        placeholder="e.g. After Hours" 
                      />
                    </div>
                    <div class="form-group flex-1">
                      <label>Genre</label>
                      <select [(ngModel)]="uploadGenre" name="genre">
                        <option value="Pop">Pop</option>
                        <option value="Rock">Rock</option>
                        <option value="Hip-Hop">Hip-Hop</option>
                        <option value="Tarab">Tarab / Arabic</option>
                        <option value="Electronic">Electronic</option>
                        <option value="Lo-Fi">Lo-Fi</option>
                        <option value="Jazz">Jazz</option>
                        <option value="Classical">Classical</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <!-- Audio File Picker -->
                  <div class="form-group">
                    <label>Audio File (.mp3, .wav, .m4a) *</label>
                    <div class="drop-zone" [class.has-file]="!!selectedAudioFile">
                      <input 
                        type="file" 
                        id="audioFileInput" 
                        accept="audio/*" 
                        (change)="onAudioSelected($event)" 
                        required 
                      />
                      <label for="audioFileInput" class="drop-label">
                        <span class="material-symbols-outlined icon">audio_file</span>
                        @if (selectedAudioFile) {
                          <span class="file-name">{{ selectedAudioFile.name }} ({{ formatFileSize(selectedAudioFile.size) }})</span>
                        } @else {
                          <span>Click to browse audio file</span>
                        }
                      </label>
                    </div>
                  </div>

                  <!-- Cover Image Picker -->
                  <div class="form-group">
                    <label>Cover Artwork (Optional)</label>
                    <div class="cover-picker-row">
                      <div class="cover-preview">
                        @if (coverPreviewUrl()) {
                          <img [src]="coverPreviewUrl()" alt="Cover preview" />
                        } @else {
                          <span class="material-symbols-outlined">image</span>
                        }
                      </div>
                      <div class="cover-input-box">
                        <input 
                          type="file" 
                          id="coverFileInput" 
                          accept="image/*" 
                          (change)="onCoverSelected($event)" 
                        />
                        <label for="coverFileInput" class="btn btn-outline small-btn">
                          <span class="material-symbols-outlined">add_photo_alternate</span>
                          <span>Choose Cover Image</span>
                        </label>
                        @if (selectedCoverFile) {
                          <span class="selected-text">{{ selectedCoverFile.name }}</span>
                        }
                      </div>
                    </div>
                  </div>

                  <div class="modal-footer">
                    <button type="button" class="btn btn-outline" (click)="close.emit()">Cancel</button>
                    <button type="submit" class="btn btn-primary" [disabled]="isUploading() || !uploadTitle || !uploadArtist || !selectedAudioFile">
                      @if (isUploading()) {
                        <span class="btn-spinner"></span>
                        <span>Uploading Song...</span>
                      } @else {
                        <span class="material-symbols-outlined">upload</span>
                        <span>Upload Track</span>
                      }
                    </button>
                  </div>
                </form>
              }

              <!-- Tab Content: Manage Library -->
              @if (activeTab() === 'manage') {
                <div class="manage-list">
                  @if (songs().length === 0) {
                    <div class="empty-list">No tracks found. Upload one to get started!</div>
                  } @else {
                    <div class="table-container">
                      <table class="songs-table">
                        <thead>
                          <tr>
                            <th>Cover</th>
                            <th>Title & Artist</th>
                            <th>Genre</th>
                            <th>Streams</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (song of songs(); track song.id) {
                            <tr>
                              <td>
                                <div class="table-cover">
                                  @if (song.coverFile) {
                                    <img [src]="songService.getCoverUrl(song.id)" alt="" />
                                  } @else {
                                    <span class="material-symbols-outlined">music_note</span>
                                  }
                                </div>
                              </td>
                              <td>
                                <div class="cell-title">{{ song.title }}</div>
                                <div class="cell-sub">{{ song.artist }}</div>
                              </td>
                              <td>
                                <span class="genre-pill">{{ song.genre || 'N/A' }}</span>
                              </td>
                              <td>{{ song.playCount | number }}</td>
                              <td>
                                <button 
                                  class="delete-btn" 
                                  title="Delete track"
                                  (click)="deleteSong(song)">
                                  <span class="material-symbols-outlined">delete</span>
                                </button>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }

              <!-- Tab Content: Analytics & Stats -->
              @if (activeTab() === 'stats') {
                <div class="stats-panel">
                  <div class="stats-cards">
                    <div class="stat-card">
                      <span class="material-symbols-outlined stat-icon green">library_music</span>
                      <div class="stat-content">
                        <span class="stat-value">{{ currentStats()?.totalSongs || songs().length }}</span>
                        <span class="stat-label">Total Tracks</span>
                      </div>
                    </div>
                    <div class="stat-card">
                      <span class="material-symbols-outlined stat-icon blue">headphones</span>
                      <div class="stat-content">
                        <span class="stat-value">{{ currentStats()?.totalPlays || 0 | number }}</span>
                        <span class="stat-label">Total Streams</span>
                      </div>
                    </div>
                  </div>
                </div>
              }
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(8px);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    .modal-card {
      width: 640px;
      max-width: 100%;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-subtle);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-subtle);

      .header-title {
        display: flex;
        align-items: center;
        gap: 10px;

        .icon {
          color: var(--primary);
          font-size: 24px;
        }

        h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }
      }

      .close-btn {
        color: var(--text-muted);
        display: flex;
        align-items: center;

        &:hover {
          color: #fff;
        }
      }
    }

    .modal-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    /* Login Form */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .login-desc {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin-bottom: 6px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      input[type="text"], input[type="password"], select {
        width: 100%;
        height: 44px;
        padding: 0 14px;
        border-radius: var(--radius-sm);
        background: var(--bg-card);
        border: 1px solid var(--border-subtle);
        color: #fff;
        font-size: 0.9rem;

        &:focus {
          border-color: var(--primary);
        }
      }

      .input-wrapper {
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

    .form-row {
      display: flex;
      gap: 16px;

      .flex-1 {
        flex: 1;
      }
    }

    .hint-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      background: rgba(30, 215, 96, 0.08);
      border: 1px solid rgba(30, 215, 96, 0.2);
      color: var(--text-secondary);
      font-size: 0.82rem;

      .material-symbols-outlined {
        color: var(--primary);
        font-size: 18px;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 11px 22px;
      border-radius: var(--radius-full);
      font-size: 0.9rem;
      font-weight: 700;

      &.btn-primary {
        background: var(--primary);
        color: #000;
        box-shadow: var(--shadow-sm);

        &:hover:not(:disabled) {
          background: var(--primary-hover);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      &.btn-outline {
        border: 1px solid var(--border-subtle);
        color: var(--text-main);

        &:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      }
    }

    .submit-btn {
      margin-top: 10px;
      height: 44px;
    }

    /* Admin studio tabs */
    .admin-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 16px;
      margin-bottom: 20px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: var(--radius-full);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-secondary);
      background: rgba(255, 255, 255, 0.03);

      .material-symbols-outlined {
        font-size: 18px;
      }

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
      }

      &.active {
        background: var(--primary);
        color: #000;

        .material-symbols-outlined {
          color: #000;
        }
      }
    }

    /* Upload form */
    .upload-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .drop-zone {
      position: relative;
      border: 2px dashed var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 24px;
      text-align: center;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.02);
      transition: all 0.2s;

      &:hover, &.has-file {
        border-color: var(--primary);
        background: rgba(30, 215, 96, 0.05);
      }

      input[type="file"] {
        position: absolute;
        inset: 0;
        opacity: 0;
        cursor: pointer;
      }

      .drop-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        color: var(--text-secondary);
        font-size: 0.88rem;
        cursor: pointer;

        .icon {
          font-size: 32px;
          color: var(--primary);
        }

        .file-name {
          color: #fff;
          font-weight: 600;
        }
      }
    }

    .cover-picker-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .cover-preview {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-sm);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .material-symbols-outlined {
        color: var(--text-muted);
        font-size: 30px;
      }
    }

    .cover-input-box {
      display: flex;
      flex-direction: column;
      gap: 6px;

      input[type="file"] {
        display: none;
      }

      .small-btn {
        padding: 6px 14px;
        font-size: 0.8rem;
      }

      .selected-text {
        font-size: 0.78rem;
        color: var(--text-secondary);
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border-subtle);
    }

    /* Table */
    .table-container {
      max-height: 400px;
      overflow-y: auto;
    }

    .songs-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;

      th {
        text-align: left;
        padding: 10px 12px;
        color: var(--text-muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        border-bottom: 1px solid var(--border-subtle);
      }

      td {
        padding: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      }
    }

    .table-cover {
      width: 38px;
      height: 38px;
      border-radius: 4px;
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
    }

    .cell-title {
      font-weight: 600;
      color: #fff;
    }

    .cell-sub {
      font-size: 0.78rem;
      color: var(--text-secondary);
    }

    .genre-pill {
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-secondary);
    }

    .delete-btn {
      color: var(--text-muted);
      padding: 6px;
      border-radius: 4px;

      &:hover {
        color: var(--accent-rose);
        background: rgba(244, 63, 94, 0.1);
      }

      .material-symbols-outlined {
        font-size: 20px;
      }
    }

    /* Stats panel */
    .stats-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);

      .stat-icon {
        font-size: 36px;
        padding: 12px;
        border-radius: var(--radius-sm);

        &.green {
          color: var(--primary);
          background: rgba(30, 215, 96, 0.1);
        }

        &.blue {
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
        }
      }

      .stat-content {
        display: flex;
        flex-direction: column;

        .stat-value {
          font-size: 1.6rem;
          font-weight: 800;
          color: #fff;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
      }
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
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdminModalComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly songService = inject(SongService);
  readonly toast = inject(ToastService);

  readonly isOpen = input<boolean>(false);
  readonly initialTab = input<string>('upload');
  readonly songs = input<Song[]>([]);

  readonly close = output<void>();
  readonly songUploaded = output<Song>();
  readonly songDeleted = output<string>();

  readonly activeTab = signal<'upload' | 'manage' | 'stats'>('upload');
  readonly isLoggingIn = signal<boolean>(false);
  readonly isUploading = signal<boolean>(false);
  readonly currentStats = signal<Stats | null>(null);

  // Login form model
  loginUsername = 'admin';
  loginPassword = '';

  // Upload form model
  uploadTitle = '';
  uploadArtist = '';
  uploadAlbum = '';
  uploadGenre = 'Pop';
  selectedAudioFile: File | null = null;
  selectedCoverFile: File | null = null;
  readonly coverPreviewUrl = signal<string | null>(null);

  ngOnInit() {
    if (this.authService.isAdmin()) {
      this.loadStats();
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  login() {
    this.isLoggingIn.set(true);
    this.authService.login({ username: this.loginUsername, password: this.loginPassword }).subscribe({
      next: (res) => {
        this.isLoggingIn.set(false);
        this.toast.success(`Welcome to Samma3ni Admin, ${res.username}!`);
        this.activeTab.set('upload');
        this.loadStats();
      },
      error: () => {
        this.isLoggingIn.set(false);
        this.toast.error('Invalid admin credentials');
      }
    });
  }

  onAudioSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedAudioFile = input.files[0];
    }
  }

  onCoverSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedCoverFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.coverPreviewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(this.selectedCoverFile);
    }
  }

  submitUpload() {
    if (!this.uploadTitle || !this.uploadArtist || !this.selectedAudioFile) {
      this.toast.error('Title, artist and audio file are required');
      return;
    }

    const formData = new FormData();
    formData.append('title', this.uploadTitle);
    formData.append('artist', this.uploadArtist);
    if (this.uploadAlbum) formData.append('album', this.uploadAlbum);
    if (this.uploadGenre) formData.append('genre', this.uploadGenre);
    formData.append('audio', this.selectedAudioFile);
    if (this.selectedCoverFile) {
      formData.append('cover', this.selectedCoverFile);
    }

    this.isUploading.set(true);
    this.songService.uploadSong(formData).subscribe({
      next: (song) => {
        this.isUploading.set(false);
        this.toast.success(`"${song.title}" uploaded successfully!`);
        this.songUploaded.emit(song);
        this.resetUploadForm();
        this.activeTab.set('manage');
      },
      error: (err) => {
        this.isUploading.set(false);
        this.toast.error('Failed to upload song: ' + (err.error?.error || err.message));
      }
    });
  }

  deleteSong(song: Song) {
    if (confirm(`Are you sure you want to delete "${song.title}"?`)) {
      this.songService.deleteSong(song.id).subscribe({
        next: () => {
          this.toast.success(`Deleted "${song.title}"`);
          this.songDeleted.emit(song.id);
          this.loadStats();
        },
        error: (err) => {
          this.toast.error('Failed to delete song: ' + (err.error?.error || err.message));
        }
      });
    }
  }

  loadStats() {
    this.songService.getStats().subscribe({
      next: stats => this.currentStats.set(stats),
      error: () => {}
    });
  }

  resetUploadForm() {
    this.uploadTitle = '';
    this.uploadArtist = '';
    this.uploadAlbum = '';
    this.uploadGenre = 'Pop';
    this.selectedAudioFile = null;
    this.selectedCoverFile = null;
    this.coverPreviewUrl.set(null);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
