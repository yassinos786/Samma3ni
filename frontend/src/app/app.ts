import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { PlayerBarComponent } from './components/player-bar/player-bar.component';
import { ToastComponent } from './components/toast/toast.component';
import { AuthModalComponent } from './components/auth-modal/auth-modal.component';
import { ToastService } from './services/toast.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    PlayerBarComponent,
    ToastComponent,
    AuthModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly userService = inject(UserService);

  // App startup & Pro audio splash sequence
  readonly isBooting = signal<boolean>(true);
  readonly bootExiting = signal<boolean>(false);
  readonly bootProgress = signal<number>(15);
  readonly bootStatus = signal<string>('INITIALIZING SAMMA3NI AUDIO ENGINE...');

  ngOnInit() {
    this.runBootSequence();
  }

  private runBootSequence() {
    const steps = [
      { p: 38, msg: 'LOADING HI-FI AUDIO SYSTEM...' },
      { p: 70, msg: 'CALIBRATING 3D SPATIAL SOUND...' },
      { p: 94, msg: 'SYNCHRONIZING STREAMING CATALOG...' },
      { p: 100, msg: 'AUDIO ENGINE ONLINE • READY' }
    ];

    let stepIdx = 0;
    const timer = setInterval(() => {
      if (stepIdx < steps.length) {
        this.bootProgress.set(steps[stepIdx].p);
        this.bootStatus.set(steps[stepIdx].msg);
        stepIdx++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          this.bootExiting.set(true);
          setTimeout(() => {
            this.isBooting.set(false);
          }, 550);
        }, 220);
      }
    }, 220);
  }

  /**
   * Secret keyboard shortcut: Ctrl + Shift + S (or Ctrl + Shift + A)
   * Instantly navigates to the secret studio backstage portal!
   */
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && (event.key === 'S' || event.key === 's' || event.key === 'A' || event.key === 'a')) {
      event.preventDefault();
      this.toast.info('Opening Samma3ni Studio Backstage...');
      this.router.navigate(['/studio']);
    }
  }
}
