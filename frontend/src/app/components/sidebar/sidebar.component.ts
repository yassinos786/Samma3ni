import { Component, output, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="sidebar">
      <!-- App Brand Logo -->
      <a routerLink="/" class="logo-container logo-link">
        <div class="logo-icon">
          <div class="sound-wave">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="logo-text">
          <span class="app-name">Samma3ni</span>
          <span class="arabic-tag">سَمَّعْنِي</span>
        </div>
      </a>

      <!-- Main Navigation -->
      <nav class="nav-section">
        <div class="section-label">MENU</div>
        <ul class="nav-links">
          <li>
            <button 
              class="nav-item" 
              [class.active]="activeTab() === 'discover'"
              (click)="selectTab('discover')">
              <span class="material-symbols-outlined" [class.filled]="activeTab() === 'discover'">explore</span>
              <span>Discover</span>
            </button>
          </li>
          <li>
            <button 
              class="nav-item" 
              [class.active]="activeTab() === 'popular'"
              (click)="selectTab('popular')">
              <span class="material-symbols-outlined" [class.filled]="activeTab() === 'popular'">trending_up</span>
              <span>Trending</span>
            </button>
          </li>
          <li>
            <button 
              class="nav-item" 
              [class.active]="activeTab() === 'all'"
              (click)="selectTab('all')">
              <span class="material-symbols-outlined" [class.filled]="activeTab() === 'all'">library_music</span>
              <span>All Tracks</span>
            </button>
          </li>
          <li>
            <a routerLink="/liked" class="nav-item liked-nav-item">
              <span class="material-symbols-outlined heart-icon filled">favorite</span>
              <span>Liked Songs</span>
            </a>
          </li>
        </ul>
      </nav>

      <!-- Genres Quick Jump -->
      <div class="nav-section genres-wrapper">
        <div class="section-label">GENRES & MOODS</div>
        <div class="genre-pill-list">
          @for (genre of genres; track genre) {
            <button 
              class="genre-chip" 
              [class.selected]="selectedGenre() === genre"
              (click)="selectGenre(genre)">
              {{ genre }}
            </button>
          }
        </div>
      </div>

      <!-- Footer Info -->
      <div class="sidebar-footer">
        <div class="creator-badge">
          <span>Samma3ni • سَمَّعْنِي</span>
          <span class="sub">Tunisian & Regional Streaming</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-width);
      height: 100%;
      background: var(--bg-surface);
      border-right: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      padding: 24px 18px 20px;
      user-select: none;
      flex-shrink: 0;
      overflow: hidden;
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border-subtle);
      margin-bottom: 20px;
      flex-shrink: 0;
      text-decoration: none;
      cursor: pointer;
    }

    .logo-icon {
      width: 44px;
      height: 44px;
      background: var(--primary-gradient);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--glow-primary);
    }

    .sound-wave {
      display: flex;
      align-items: center;
      gap: 3px;
      height: 20px;

      span {
        width: 3.5px;
        background: #000;
        border-radius: 2px;
        animation: musicEqualizer 1.2s infinite ease-in-out;

        &:nth-child(1) { height: 10px; animation-delay: 0.1s; }
        &:nth-child(2) { height: 18px; animation-delay: 0.3s; }
        &:nth-child(3) { height: 14px; animation-delay: 0.2s; }
        &:nth-child(4) { height: 8px; animation-delay: 0.4s; }
      }
    }

    .logo-text {
      display: flex;
      flex-direction: column;
    }

    .app-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #fff;
    }

    .arabic-tag {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--primary);
      letter-spacing: 0.5px;
    }

    .nav-section {
      margin-bottom: 20px;
      flex-shrink: 0;

      .section-label {
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 1.2px;
        color: var(--text-muted);
        margin-bottom: 12px;
        padding-left: 10px;
      }
    }

    .genres-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-bottom: 14px;
    }

    .nav-links {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .nav-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.92rem;
      font-weight: 600;
      transition: all 0.2s ease;

      .material-symbols-outlined {
        font-size: 22px;
        transition: color 0.2s;
      }

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
      }

      &.active {
        color: var(--primary);
        background: rgba(30, 215, 96, 0.12);

        .material-symbols-outlined {
          color: var(--primary);
        }
      }
    }

    .liked-nav-item {
      text-decoration: none;
      .heart-icon {
        color: #ec4899;
      }
      &:hover {
        background: rgba(236, 72, 153, 0.12) !important;
        color: #fff !important;
      }
    }

    .genre-pill-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 2px 4px 10px;
      overflow-y: auto;
      max-height: 100%;
    }

    .genre-chip {
      padding: 5px 11px;
      border-radius: var(--radius-full);
      background: var(--bg-card);
      color: var(--text-secondary);
      font-size: 0.74rem;
      font-weight: 600;
      border: 1px solid var(--border-subtle);
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: var(--bg-card-hover);
        color: #fff;
        border-color: rgba(255, 255, 255, 0.2);
      }

      &.selected {
        background: var(--primary);
        color: #000;
        font-weight: 700;
        border-color: var(--primary);
      }
    }

    .sidebar-footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid var(--border-subtle);
      padding-left: 6px;
      flex-shrink: 0;

      .creator-badge {
        display: flex;
        flex-direction: column;
        font-size: 0.72rem;
        color: var(--text-muted);

        .sub {
          font-size: 0.65rem;
          opacity: 0.7;
        }
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        display: none;
      }
    }
  `]
})
export class SidebarComponent {
  readonly activeTab = input<string>('discover');
  readonly selectedGenre = input<string>('All');

  readonly tabChange = output<string>();
  readonly genreChange = output<string>();

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

  private readonly router = inject(Router);

  selectTab(tab: string) {
    this.tabChange.emit(tab);
    if (this.router.url !== '/' && !this.router.url.startsWith('/?')) {
      this.router.navigate(['/'], { queryParams: { tab } });
    }
  }

  selectGenre(genre: string) {
    this.genreChange.emit(genre);
    if (this.router.url !== '/' && !this.router.url.startsWith('/?')) {
      this.router.navigate(['/'], { queryParams: { genre } });
    }
  }
}
