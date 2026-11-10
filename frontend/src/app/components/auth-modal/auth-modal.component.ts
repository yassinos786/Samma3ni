import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

type FormMode = 'login' | 'register';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (userService.showAuthModal()) {
      <div class="auth-modal-backdrop" (click)="onBackdropClick($event)">
        <div class="auth-modal-card animate-zoom-in" (click)="$event.stopPropagation()">
          
          <!-- Close button (Hidden if Mandatory 3-song limit reached) -->
          @if (!userService.isMandatoryAuth()) {
            <button class="modal-close-icon" (click)="closeModal()" title="Fermer">
              <span class="material-symbols-outlined">close</span>
            </button>
          }

          <!-- Mandatory 3-Song Limit Alert Banner -->
          @if (userService.isMandatoryAuth()) {
            <div class="mandatory-limit-banner">
              <div class="limit-icon-wrap">
                <span class="material-symbols-outlined">lock</span>
              </div>
              <div class="limit-text">
                <strong>Limite d'écoute atteinte (3/3 morceaux)</strong>
                <span>Connectez-vous pour débloquer l'écoute illimitée et continuer la lecture.</span>
              </div>
            </div>
          }

          <!-- Brand Header -->
          <div class="auth-header">
            <div class="auth-brand-logo">
              <div class="sound-wave-circle">
                <span></span><span></span><span></span><span></span>
              </div>
              <div class="brand-title-wrap">
                <h3 class="auth-brand-name">samma3ni</h3>
                <span class="auth-sub-ar">سَمَّعْنِي</span>
              </div>
            </div>
            <h4 class="auth-lead-text">
              {{ mode() === 'login' ? 'Connexion à votre compte' : 'Créer un compte Samma3ni' }}
            </h4>
            <p class="auth-sub-lead">
              {{ mode() === 'login' ? 'Accédez à votre bibliothèque et à l\'écoute illimitée' : 'Rejoignez-nous et écoutez vos artistes préférés en continu' }}
            </p>
          </div>

          <!-- Mode Switcher Tabs (Connexion / Inscription) -->
          <div class="mode-tabs">
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="mode() === 'login'" 
              (click)="setMode('login')">
              Se connecter
            </button>
            <button 
              type="button" 
              class="tab-btn" 
              [class.active]="mode() === 'register'" 
              (click)="setMode('register')">
              Créer un compte
            </button>
          </div>

          <!-- Classic Form (Email + Password) -->
          <form (ngSubmit)="onSubmit()" class="classic-auth-form">
            
            <!-- Full Name (Only for Register) -->
            @if (mode() === 'register') {
              <div class="form-group animate-fade-in">
                <label for="fullName">Nom complet</label>
                <div class="input-wrapper">
                  <span class="material-symbols-outlined input-icon">person</span>
                  <input 
                    id="fullName" 
                    type="text" 
                    [(ngModel)]="name" 
                    name="name" 
                    placeholder="ex: Yassine Mansour" 
                    required 
                    autocomplete="name"
                  />
                </div>
              </div>
            }

            <!-- Email Address -->
            <div class="form-group">
              <label for="authEmail">Adresse Email</label>
              <div class="input-wrapper">
                <span class="material-symbols-outlined input-icon">mail</span>
                <input 
                  id="authEmail" 
                  type="email" 
                  [(ngModel)]="email" 
                  name="email" 
                  placeholder="nom@exemple.com" 
                  required 
                  autocomplete="email"
                />
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <div class="label-row">
                <label for="authPassword">Mot de passe</label>
                @if (mode() === 'login') {
                  <a href="#" class="forgot-link" (click)="onForgotPassword($event)">Mot de passe oublié ?</a>
                }
              </div>
              <div class="input-wrapper">
                <span class="material-symbols-outlined input-icon">lock</span>
                <input 
                  id="authPassword" 
                  [type]="showPassword() ? 'text' : 'password'" 
                  [(ngModel)]="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  autocomplete="current-password"
                />
                <button 
                  type="button" 
                  class="toggle-pwd-btn" 
                  (click)="showPassword.set(!showPassword())" 
                  title="Afficher/Masquer le mot de passe">
                  <span class="material-symbols-outlined">
                    {{ showPassword() ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Remember me (Login mode) -->
            @if (mode() === 'login') {
              <div class="form-options-row">
                <label class="remember-checkbox">
                  <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
                  <span>Se souvenir de moi</span>
                </label>
              </div>
            }

            <!-- Submit Button -->
            <button 
              type="submit" 
              class="btn-auth-submit" 
              [disabled]="isSubmitting()">
              @if (isSubmitting()) {
                <span class="spinner-inline"></span>
                <span>Traitement en cours…</span>
              } @else {
                <span>{{ mode() === 'login' ? 'Se connecter' : 'Créer mon compte' }}</span>
                <span class="material-symbols-outlined">
                  {{ mode() === 'login' ? 'login' : 'arrow_forward' }}
                </span>
              }
            </button>
          </form>

          <!-- Bottom Toggle Link -->
          <div class="auth-bottom-switch">
            @if (mode() === 'login') {
              <span>Pas encore de compte ?</span>
              <button type="button" class="switch-link" (click)="setMode('register')">
                Inscrivez-vous gratuitement
              </button>
            } @else {
              <span>Vous avez déjà un compte ?</span>
              <button type="button" class="switch-link" (click)="setMode('login')">
                Connectez-vous ici
              </button>
            }
          </div>

          <!-- Legal Footer -->
          <p class="auth-legal-note">
            En continuant, vous acceptez les <a href="#" (click)="$event.preventDefault()">Conditions d'utilisation</a> et la <a href="#" (click)="$event.preventDefault()">Politique de confidentialité</a> de Samma3ni.
          </p>

        </div>
      </div>
    }
  `,
  styles: [`
    .auth-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      padding: 16px;
      user-select: none;
    }

    /* Clean Modern White Card */
    .auth-modal-card {
      position: relative;
      background: #ffffff;
      color: #18181b;
      width: 430px;
      max-width: 95vw;
      border-radius: 24px;
      padding: 32px 28px 24px;
      box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.65), 0 0 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .modal-close-icon {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: #f4f4f5;
      color: #71717a;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #e4e4e7;
        color: #18181b;
        transform: rotate(90deg);
      }

      .material-symbols-outlined {
        font-size: 19px;
      }
    }

    /* Mandatory Limit Alert Banner */
    .mandatory-limit-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      border-radius: 14px;
      padding: 12px 14px;
      color: #991b1b;
      font-size: 0.82rem;

      .limit-icon-wrap {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #fee2e2;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .material-symbols-outlined {
          font-size: 18px;
          color: #dc2626;
        }
      }

      .limit-text {
        display: flex;
        flex-direction: column;
        gap: 2px;

        strong {
          font-weight: 800;
          color: #7f1d1d;
        }
      }
    }

    /* Brand Header */
    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 8px;
    }

    .auth-brand-logo {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .sound-wave-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;

      span {
        width: 3.5px;
        background: #1ed760;
        border-radius: 2px;
        animation: musicEqualizer 1s infinite ease-in-out;

        &:nth-child(1) { height: 10px; animation-delay: 0.1s; }
        &:nth-child(2) { height: 20px; animation-delay: 0.3s; }
        &:nth-child(3) { height: 14px; animation-delay: 0.2s; }
        &:nth-child(4) { height: 8px; animation-delay: 0.4s; }
      }
    }

    .brand-title-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .auth-brand-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1.65rem;
      font-weight: 900;
      color: #000;
      letter-spacing: -0.5px;
      line-height: 1.1;
    }

    .auth-sub-ar {
      font-size: 0.88rem;
      font-weight: 700;
      color: #1ed760;
      letter-spacing: 0.5px;
    }

    .auth-lead-text {
      font-size: 1.15rem;
      font-weight: 800;
      color: #18181b;
      margin-top: 4px;
    }

    .auth-sub-lead {
      font-size: 0.78rem;
      color: #71717a;
      line-height: 1.35;
      max-width: 320px;
    }

    /* Mode Tabs */
    .mode-tabs {
      display: flex;
      background: #f4f4f5;
      padding: 4px;
      border-radius: 14px;
      gap: 4px;

      .tab-btn {
        flex: 1;
        padding: 9px 0;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: #71717a;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: #ffffff;
          color: #18181b;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        &:hover:not(.active) {
          color: #18181b;
        }
      }
    }

    /* Form Styles */
    .classic-auth-form {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.78rem;
        font-weight: 700;
        color: #52525b;
      }

      .label-row {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .forgot-link {
          font-size: 0.74rem;
          color: #2563eb;
          text-decoration: none;
          font-weight: 600;
          &:hover { text-decoration: underline; }
        }
      }
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: #f4f4f5;
      border: 1.5px solid #e4e4e7;
      border-radius: 12px;
      padding: 0 12px;
      height: 46px;
      transition: all 0.2s;

      &:focus-within {
        background: #ffffff;
        border-color: #18181b;
        box-shadow: 0 0 0 3px rgba(24, 24, 27, 0.08);
      }

      .input-icon {
        color: #71717a;
        font-size: 20px;
        margin-right: 8px;
        flex-shrink: 0;
      }

      input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 0.9rem;
        color: #18181b;
        font-family: inherit;

        &::placeholder {
          color: #a1a1aa;
        }
      }

      .toggle-pwd-btn {
        background: transparent;
        border: none;
        color: #71717a;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        border-radius: 6px;
        &:hover { color: #18181b; }
        .material-symbols-outlined { font-size: 19px; }
      }
    }

    .form-options-row {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .remember-checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.78rem;
        color: #52525b;
        cursor: pointer;

        input[type="checkbox"] {
          accent-color: #18181b;
          cursor: pointer;
          width: 15px;
          height: 15px;
        }
      }
    }

    .btn-auth-submit {
      margin-top: 4px;
      height: 48px;
      border-radius: 12px;
      background: #18181b;
      color: #ffffff;
      font-size: 0.92rem;
      font-weight: 800;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

      &:hover:not(:disabled) {
        background: #000000;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
      }

      &:disabled {
        opacity: 0.65;
        cursor: not-allowed;
      }

      .material-symbols-outlined {
        font-size: 19px;
      }
    }

    .spinner-inline {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    /* Bottom Switch Link */
    .auth-bottom-switch {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #71717a;
      text-align: center;
      flex-wrap: wrap;

      .switch-link {
        background: none;
        border: none;
        color: #18181b;
        font-weight: 800;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
        font-size: 0.8rem;
        &:hover { color: #2563eb; }
      }
    }

    /* Legal Note */
    .auth-legal-note {
      text-align: center;
      font-size: 0.72rem;
      color: #a1a1aa;
      line-height: 1.4;

      a {
        color: #71717a;
        text-decoration: underline;
        &:hover { color: #18181b; }
      }
    }

    @keyframes musicEqualizer {
      0%, 100% { transform: scaleY(0.4); }
      50% { transform: scaleY(1); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .animate-zoom-in {
      animation: zoomIn 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
    }

    .animate-fade-in {
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AuthModalComponent {
  readonly userService = inject(UserService);
  readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);

  readonly mode = signal<FormMode>('login');
  readonly showPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  name = '';
  email = '';
  password = '';
  rememberMe = true;

  setMode(newMode: FormMode) {
    this.mode.set(newMode);
  }

  closeModal() {
    this.userService.closeAuth();
  }

  onBackdropClick(event: MouseEvent) {
    if (!this.userService.isMandatoryAuth()) {
      this.closeModal();
    }
  }

  onForgotPassword(event: MouseEvent) {
    event.preventDefault();
    this.toast.info('Pour réinitialiser votre mot de passe, contactez l\'assistance Samma3ni ou créez un nouveau compte.');
  }

  onSubmit() {
    if (!this.email || !this.email.trim()) {
      this.toast.error('Veuillez renseigner votre adresse email.');
      return;
    }
    if (!this.password || !this.password.trim()) {
      this.toast.error('Veuillez renseigner votre mot de passe.');
      return;
    }

    if (this.mode() === 'register' && (!this.name || !this.name.trim())) {
      this.toast.error('Veuillez renseigner votre nom complet.');
      return;
    }

    this.isSubmitting.set(true);

    if (this.mode() === 'login') {
      this.performLogin();
    } else {
      this.performRegister();
    }
  }

  private performLogin() {
    const payload = {
      email: this.email.trim(),
      password: this.password.trim()
    };

    this.http.post<any>(`${environment.apiUrl}/auth/login`, payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res?.token) {
            localStorage.setItem('samma3ni_jwt', res.token);
            localStorage.setItem('samma3ni_token', res.token);
            if (res?.role) localStorage.setItem('samma3ni_role', res.role);
            if (res?.username) localStorage.setItem('samma3ni_username', res.username);
          }
          const displayName = res?.name || res?.username || this.email.split('@')[0];
          this.userService.loginWithEmail(displayName, this.email.trim(), res?.avatarUrl);
          this.toast.success(`Bienvenue, ${displayName} ! Connexion réussie.`);
          this.resetForm();
          this.closeModal();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.error?.error || 'Email ou mot de passe incorrect.';
          this.toast.error(msg);
        }
      });
  }

  private performRegister() {
    const payload = {
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password.trim()
    };

    this.http.post<any>(`${environment.apiUrl}/auth/register`, payload)
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res?.token) {
            localStorage.setItem('samma3ni_jwt', res.token);
            localStorage.setItem('samma3ni_token', res.token);
            if (res?.role) localStorage.setItem('samma3ni_role', res.role);
            if (res?.username) localStorage.setItem('samma3ni_username', res.username);
          }
          const displayName = res?.name || this.name.trim();
          this.userService.loginWithEmail(displayName, this.email.trim(), res?.avatarUrl);
          this.toast.success(`Bienvenue sur Samma3ni, ${displayName} ! Votre compte est créé.`);
          this.resetForm();
          this.closeModal();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err?.error?.error || 'Erreur lors de la création du compte.';
          this.toast.error(msg);
        }
      });
  }

  private resetForm() {
    this.name = '';
    this.email = '';
    this.password = '';
  }
}
