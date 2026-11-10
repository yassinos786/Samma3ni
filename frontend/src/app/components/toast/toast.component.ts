import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="toast.type">
          <span class="material-symbols-outlined icon">
            @if (toast.type === 'success') { check_circle }
            @else if (toast.type === 'error') { error }
            @else { info }
          </span>
          <span class="message">{{ toast.message }}</span>
          <button class="close-btn" (click)="toastService.dismiss(toast.id)">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: var(--radius-md);
      background: var(--bg-card);
      color: var(--text-main);
      box-shadow: var(--shadow-lg);
      border: 1px solid var(--border-subtle);
      animation: slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      min-width: 280px;
      max-width: 420px;

      &.success {
        border-color: rgba(30, 215, 96, 0.4);
        .icon { color: var(--primary); }
      }

      &.error {
        border-color: rgba(244, 63, 94, 0.4);
        .icon { color: var(--accent-rose); }
      }

      &.info {
        border-color: rgba(6, 182, 212, 0.4);
        .icon { color: var(--accent-cyan); }
      }

      .icon {
        font-size: 22px;
      }

      .message {
        font-size: 0.88rem;
        font-weight: 500;
        flex: 1;
      }

      .close-btn {
        opacity: 0.6;
        font-size: 16px;
        display: flex;
        align-items: center;
        &:hover { opacity: 1; }
      }
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
