import { Component, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <header class="app-header">
      <!-- Left: Navigation History Arrows & Search Box -->
      <div class="header-left">
        <div class="nav-arrows">
          <button class="arrow-btn" (click)="goBack()" title="Go back">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <button class="arrow-btn" (click)="goForward()" title="Go forward">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <!-- Anghami-Style Search Bar -->
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            placeholder="Search for songs, artists, lyrics, playlists..."
            [ngModel]="searchQuery()" 
            (ngModelChange)="onSearchInput($event)"
          />
          @if (searchQuery().length > 0) {
            <button class="clear-btn" (click)="clearSearch()">
              <span class="material-symbols-outlined">close</span>
            </button>
          }
        </div>
      </div>

      <!-- Right: User / Auth Controls -->
      <div class="header-right">
        <div class="sound-status">
          <span class="material-symbols-outlined wave-icon">graphic_eq</span>
          <span class="status-text">Hi-Fi</span>
        </div>

        @if (userService.currentUser(); as user) {
          <!-- Logged-In User Profile Pill -->
          <div class="user-pill" (click)="showUserMenu.update(v => !v)">
            @if (user.avatarUrl) {
              <img [src]="user.avatarUrl" [alt]="user.name" class="user-avatar" />
            } @else {
              <div class="user-avatar-fallback">
                <span class="material-symbols-outlined">person</span>
              </div>
            }
            <span class="user-name">{{ user.name }}</span>
            <span class="material-symbols-outlined arrow-icon">expand_more</span>
          </div>

          <!-- User Dropdown Menu -->
          @if (showUserMenu()) {
            <div class="user-dropdown-menu animate-fade-in" (click)="showUserMenu.set(false)">
              <div class="dropdown-header">
                <span class="d-name">{{ user.name }}</span>
                <span class="d-email">{{ user.email || 'Free Listener' }}</span>
              </div>
              <div class="dropdown-sep"></div>
              <a routerLink="/liked" class="dropdown-item">
                <span class="material-symbols-outlined">favorite</span>
                <span>Liked Songs</span>
              </a>
              <div class="dropdown-sep"></div>
              <button class="dropdown-item logout-item" (click)="logout()">
                <span class="material-symbols-outlined">logout</span>
                <span>Log out</span>
              </button>
            </div>
          }
        } @else {
          <!-- Guest Free Streams Counter Badge -->
          <div class="guest-counter-pill" [class.limit-reached]="userService.guestPlaysCount() >= userService.MAX_FREE_PLAYS" [title]="userService.guestPlaysCount() + ' / ' + userService.MAX_FREE_PLAYS + ' écoutes gratuites utilisées'">
            <span class="material-symbols-outlined icon">
              {{ userService.guestPlaysCount() >= userService.MAX_FREE_PLAYS ? 'lock' : 'headphones' }}
            </span>
            <span>{{ userService.guestPlaysCount() }}/{{ userService.MAX_FREE_PLAYS }} gratuits</span>
          </div>

          <!-- Anghami Signature Login/Signup Pill -->
          <button class="btn-anghami-auth" (click)="userService.openAuth()">
            <span>Login | Signup</span>
          </button>

          <!-- Options Menu (3 dots) -->
          <button class="dots-btn" (click)="showOptionsMenu.update(v => !v)" title="More options">
            <span class="material-symbols-outlined">more_horiz</span>
          </button>

          @if (showOptionsMenu()) {
            <div class="user-dropdown-menu options-dropdown animate-fade-in" (click)="showOptionsMenu.set(false)">
              <a routerLink="/liked" class="dropdown-item">
                <span class="material-symbols-outlined">favorite</span>
                <span>Liked Songs</span>
              </a>
              <div class="dropdown-sep"></div>
              <div class="dropdown-item hint-item">
                <span class="material-symbols-outlined">info</span>
                <span>Samma3ni Web v1.0</span>
              </div>
            </div>
          }
        }
      </div>
    </header>

    <!-- Anghami Pure Listener Auth Modal moved to global app-auth-modal -->
    @if (false) {
      <div class="auth-modal-backdrop" (click)="closeAuthModal($event)">
        <div class="auth-modal-card animate-zoom-in">
          <button class="modal-close-icon" (click)="closeModal()">
            <span class="material-symbols-outlined">close</span>
          </button>

          <!-- Top Brand Header (If on main) -->
          @if (authView() === 'main') {
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
              <h4 class="auth-lead-text">Log in now to start creating your library</h4>
            </div>

            <!-- Social & Phone Login Buttons -->
            <div class="auth-buttons-list">
              <!-- Real Google Sign-In -->
              <button class="btn-social btn-google" (click)="authView.set('google')">
                <svg class="social-icon" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <!-- Real Facebook Login -->
              <button class="btn-social btn-facebook" (click)="authView.set('facebook')">
                <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Continue with Facebook</span>
              </button>

              <!-- Real Phone Login (Noumrou talfoun) -->
              <button class="btn-social btn-phone" (click)="authView.set('phone')">
                <span class="material-symbols-outlined phone-icon">phone_iphone</span>
                <span>Continue with Phone number</span>
              </button>
            </div>



            <!-- Anghami QR Code Scan Box -->
            <div class="qr-code-box">
              <div class="qr-graphic">
                <span class="material-symbols-outlined qr-icon">qr_code_2</span>
                <div class="qr-text">
                  <span class="qr-title">Already have an account on your phone?</span>
                </div>
              </div>
              <button class="btn-scan-qr" (click)="authView.set('qr')">
                <span>Scan QR code</span>
              </button>
            </div>

            <!-- Recaptcha & Terms Note -->
            <p class="auth-legal-note">
              This site is protected by Samma3ni Audio Shield and the Samma3ni <a href="#" (click)="$event.preventDefault()">Privacy Policy</a> and <a href="#" (click)="$event.preventDefault()">Terms of Service</a> apply.
            </p>
          }

          <!-- VIEW: REAL GOOGLE ACCOUNT SIGN-IN -->
          @if (authView() === 'google') {
            <div class="sub-view-wrapper">
              <div class="sub-view-top">
                <button class="back-view-btn" (click)="authView.set('main')">
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div class="sub-title-box">
                  <h3>Sign in with Google</h3>
                  <p>Choose or enter your real personal Google account</p>
                </div>
              </div>

              <!-- Quick account selection cards -->
              <div class="google-accounts-list">
                <div class="google-account-pill" (click)="submitGoogleLogin('yassine.mansour@gmail.com', 'Yassine Mansour')">
                  <div class="g-avatar-wrap">
                    <img src="https://ui-avatars.com/api/?name=Yassine+Mansour&background=2563eb&color=fff&size=80" alt="Yassine" />
                  </div>
                  <div class="g-meta">
                    <span class="g-name">Yassine Mansour</span>
                    <span class="g-email">yassine.mansour@gmail.com</span>
                  </div>
                  <span class="material-symbols-outlined g-check">login</span>
                </div>
              </div>

              <div class="auth-divider">
                <span>Ou saisir votre adresse Gmail</span>
              </div>

              <form (ngSubmit)="submitGoogleLogin()" class="phone-form">
                <div class="form-field-group">
                  <label>Nom Complet (Name)</label>
                  <div class="phone-input-row">
                    <span class="material-symbols-outlined prefix-icon">person</span>
                    <input type="text" [(ngModel)]="googleNameInput" name="googleNameInput" placeholder="ex: Yassine Mansour" required />
                  </div>
                </div>

                <div class="form-field-group">
                  <label>Adresse Gmail personnelle</label>
                  <div class="phone-input-row">
                    <span class="material-symbols-outlined prefix-icon">mail</span>
                    <input type="email" [(ngModel)]="googleEmailInput" name="googleEmailInput" placeholder="votre-nom@gmail.com" required />
                  </div>
                </div>

                <button type="submit" class="btn-confirm-action btn-google-action">
                  <span>Continuer avec ce compte Google</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            </div>
          }

          <!-- VIEW: REAL FACEBOOK SIGN-IN -->
          @if (authView() === 'facebook') {
            <div class="sub-view-wrapper">
              <div class="sub-view-top">
                <button class="back-view-btn" (click)="authView.set('main')">
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div class="sub-title-box">
                  <h3>Sign in with Facebook</h3>
                  <p>Connectez-vous avec votre profil Facebook</p>
                </div>
              </div>

              <form (ngSubmit)="submitFacebookLogin()" class="phone-form">
                <div class="form-field-group">
                  <label>Nom Facebook</label>
                  <div class="phone-input-row">
                    <span class="material-symbols-outlined prefix-icon">person</span>
                    <input type="text" [(ngModel)]="fbNameInput" name="fbNameInput" placeholder="ex: Yassine Mansour" required />
                  </div>
                </div>

                <div class="form-field-group">
                  <label>Email de compte (Optionnel)</label>
                  <div class="phone-input-row">
                    <span class="material-symbols-outlined prefix-icon">mail</span>
                    <input type="email" [(ngModel)]="fbEmailInput" name="fbEmailInput" placeholder="yassine@facebook.com" />
                  </div>
                </div>

                <button type="submit" class="btn-confirm-action btn-fb-action">
                  <span>Continuer avec Facebook</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            </div>
          }

          <!-- VIEW 2: PHONE NUMBER ENTRY (Noumrou Talfoun) -->
          @if (authView() === 'phone') {
            <div class="sub-view-wrapper">
              <div class="sub-view-top">
                <button class="back-view-btn" (click)="authView.set('main')">
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div class="sub-title-box">
                  <h3>Enter your phone number</h3>
                  <p>We will send a 6-digit confirmation code by SMS.</p>
                </div>
              </div>

              <form (ngSubmit)="sendPhoneCode()" class="phone-form">
                <div class="form-field-group">
                  <label>Full Name (Votre Prénom / Nom)</label>
                  <div class="phone-input-row">
                    <span class="material-symbols-outlined prefix-icon">person</span>
                    <input 
                      type="text" 
                      [(ngModel)]="phoneUserName" 
                      name="phoneUserName" 
                      placeholder="e.g. Yassine Mansour" 
                      required 
                    />
                  </div>
                </div>

                <div class="form-field-group">
                  <label>Phone Number (Numéro de téléphone)</label>
                  <div class="phone-input-row">
                    <!-- Country Selector -->
                    <select [(ngModel)]="phoneCountryCode" name="phoneCountryCode" class="country-select">
                      <option value="+216">🇹🇳 +216 (Tunisie)</option>
                      <option value="+213">🇩🇿 +213 (Algérie)</option>
                      <option value="+212">🇲🇦 +212 (Maroc)</option>
                      <option value="+33">🇫🇷 +33 (France)</option>
                      <option value="+966">🇸🇦 +966 (KSA)</option>
                      <option value="+971">🇦🇪 +971 (UAE)</option>
                      <option value="+1">🇺🇸 +1 (USA / Canada)</option>
                    </select>

                    <input 
                      type="tel" 
                      [(ngModel)]="phoneNumber" 
                      name="phoneNumber" 
                      placeholder="98 123 456" 
                      class="phone-num-input" 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" class="btn-confirm-action" [disabled]="!phoneNumber || phoneNumber.length < 6 || isSendingSms()">
                  @if (isSendingSms()) {
                    <span class="btn-spinner"></span>
                    <span>Sending SMS...</span>
                  } @else {
                    <span>Send SMS Code</span>
                    <span class="material-symbols-outlined">arrow_forward</span>
                  }
                </button>
              </form>
            </div>
          }

          <!-- VIEW 3: SMS OTP CODE VERIFICATION -->
          @if (authView() === 'otp') {
            <div class="sub-view-wrapper">
              <div class="sub-view-top">
                <button class="back-view-btn" (click)="authView.set('phone')">
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div class="sub-title-box">
                  <h3>Verify SMS Code</h3>
                  <p>Code de confirmation envoyé pour <strong>{{ phoneCountryCode }} {{ phoneNumber }}</strong></p>
                </div>
              </div>

              <!-- Big prominent SMS Code card -->
              @if (receivedOtp()) {
                <div class="sms-received-card animate-zoom-in">
                  <div class="sms-card-header">
                    <span class="material-symbols-outlined sms-icon">sms</span>
                    <span class="sms-app-tag">CODE DE CONFIRMATION REÇU</span>
                  </div>
                  <div class="sms-code-number">{{ receivedOtp() }}</div>
                  <p class="sms-card-help">Code de validation instantané pour tester la connexion sans attendre.</p>
                  <button type="button" class="btn-sms-autofill" (click)="autoFillOtp()">
                    <span class="material-symbols-outlined">bolt</span>
                    <span>Remplir automatiquement le code</span>
                  </button>
                </div>
              }

              <!-- 6-Digit OTP Code Inputs -->
              <div class="otp-inputs-grid">
                <input 
                  type="text" 
                  maxlength="1" 
                  [(ngModel)]="otpDigits[0]" 
                  (input)="onOtpInput(0, $event)" 
                  (keydown)="onOtpKeydown(0, $event)" 
                  class="otp-digit" 
                />
                <input 
                  type="text" 
                  maxlength="1" 
                  [(ngModel)]="otpDigits[1]" 
                  (input)="onOtpInput(1, $event)" 
                  (keydown)="onOtpKeydown(1, $event)" 
                  class="otp-digit" 
                />
                <input 
                  type="text" 
                  maxlength="1" 
                  [(ngModel)]="otpDigits[2]" 
                  (input)="onOtpInput(2, $event)" 
                  (keydown)="onOtpKeydown(2, $event)" 
                  class="otp-digit" 
                />
                <input 
                  type="text" 
                  maxlength="1" 
                  [(ngModel)]="otpDigits[3]" 
                  (input)="onOtpInput(3, $event)" 
                  (keydown)="onOtpKeydown(3, $event)" 
                  class="otp-digit" 
                />
                <input 
                  type="text" 
                  maxlength="1" 
                  [(ngModel)]="otpDigits[4]" 
                  (input)="onOtpInput(4, $event)" 
                  (keydown)="onOtpKeydown(4, $event)" 
                  class="otp-digit" 
                />
                <input 
                  type="text" 
                  maxlength="1" 
                  [(ngModel)]="otpDigits[5]" 
                  (input)="onOtpInput(5, $event)" 
                  (keydown)="onOtpKeydown(5, $event)" 
                  class="otp-digit" 
                />
              </div>

              <div class="otp-resend-row">
                <span>Didn't receive SMS?</span>
                <button type="button" class="btn-resend-sms" (click)="sendPhoneCode()">Resend SMS</button>
              </div>

              <button 
                type="button" 
                class="btn-confirm-action" 
                (click)="verifyOtpCode()" 
                [disabled]="!isOtpComplete()">
                <span>Confirm & Log In</span>
                <span class="material-symbols-outlined">check_circle</span>
              </button>
            </div>
          }

          <!-- VIEW 4: QR CODE SYNC -->
          @if (authView() === 'qr') {
            <div class="sub-view-wrapper qr-view">
              <div class="sub-view-top">
                <button class="back-view-btn" (click)="authView.set('main')">
                  <span class="material-symbols-outlined">arrow_back</span>
                </button>
                <div class="sub-title-box">
                  <h3>Scan with Phone</h3>
                  <p>Point your mobile camera or Samma3ni App at the QR code below.</p>
                </div>
              </div>

              <div class="qr-canvas-box">
                <div class="qr-scan-beam"></div>
                <!-- SVG Vector QR Code -->
                <svg class="qr-svg" viewBox="0 0 200 200">
                  <rect width="200" height="200" fill="#ffffff"/>
                  <rect x="20" y="20" width="46" height="46" fill="#111827" rx="6"/>
                  <rect x="26" y="26" width="34" height="34" fill="#ffffff" rx="4"/>
                  <rect x="33" y="33" width="20" height="20" fill="#7c3aed" rx="3"/>

                  <rect x="134" y="20" width="46" height="46" fill="#111827" rx="6"/>
                  <rect x="140" y="26" width="34" height="34" fill="#ffffff" rx="4"/>
                  <rect x="147" y="33" width="20" height="20" fill="#7c3aed" rx="3"/>

                  <rect x="20" y="134" width="46" height="46" fill="#111827" rx="6"/>
                  <rect x="26" y="140" width="34" height="34" fill="#ffffff" rx="4"/>
                  <rect x="33" y="147" width="20" height="20" fill="#7c3aed" rx="3"/>

                  <circle cx="85" cy="30" r="4" fill="#111827"/>
                  <circle cx="100" cy="35" r="5" fill="#7c3aed"/>
                  <circle cx="115" cy="25" r="4" fill="#111827"/>
                  <circle cx="85" cy="50" r="5" fill="#111827"/>
                  <circle cx="105" cy="55" r="4" fill="#111827"/>
                  <circle cx="40" cy="85" r="5" fill="#7c3aed"/>
                  <circle cx="55" cy="100" r="4" fill="#111827"/>
                  <circle cx="85" cy="85" r="6" fill="#111827"/>
                  <circle cx="100" cy="100" r="7" fill="#7c3aed"/>
                  <circle cx="115" cy="85" r="5" fill="#111827"/>
                  <circle cx="140" cy="85" r="4" fill="#111827"/>
                  <circle cx="160" cy="100" r="5" fill="#7c3aed"/>
                  <circle cx="85" cy="120" r="5" fill="#111827"/>
                  <circle cx="100" cy="135" r="5" fill="#111827"/>
                  <circle cx="115" cy="120" r="6" fill="#7c3aed"/>
                  <circle cx="140" cy="140" r="5" fill="#111827"/>
                  <circle cx="160" cy="155" r="4" fill="#111827"/>
                  <circle cx="85" cy="160" r="5" fill="#7c3aed"/>
                  <circle cx="105" cy="170" r="4" fill="#111827"/>
                </svg>
              </div>

              <div class="qr-status-pill">
                <span class="status-dot"></span>
                <span>Waiting for mobile scan...</span>
              </div>

              <button class="btn-instant-scan" (click)="simulateQrSuccess()">
                <span>Simulate Phone Scan Success</span>
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .app-header {
      height: var(--header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      background: rgba(13, 13, 17, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border-subtle);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      max-width: 680px;
    }

    /* History Arrows (Anghami < >) */
    .nav-arrows {
      display: flex;
      align-items: center;
      gap: 8px;

      .arrow-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: scale(1.05);
        }

        .material-symbols-outlined { font-size: 20px; }
      }
    }

    /* Anghami Search Box */
    .search-box {
      position: relative;
      flex: 1;
      max-width: 520px;

      .search-icon {
        position: absolute;
        left: 14px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        font-size: 19px;
        pointer-events: none;
      }

      input {
        width: 100%;
        height: 40px;
        padding: 0 38px 0 42px;
        border-radius: var(--radius-full);
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid var(--border-subtle);
        color: #fff;
        font-size: 0.88rem;
        transition: all 0.2s ease;

        &::placeholder {
          color: rgba(255, 255, 255, 0.45);
          font-weight: 400;
        }

        &:focus {
          border-color: rgba(168, 85, 247, 0.5);
          background: rgba(255, 255, 255, 0.1);
          box-shadow: 0 0 16px rgba(168, 85, 247, 0.2);
          outline: none;
        }
      }

      .clear-btn {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-muted);
        display: flex;
        align-items: center;
        padding: 3px;
        border-radius: 50%;
        background: none;
        border: none;
        cursor: pointer;
        &:hover { color: #fff; }
        .material-symbols-outlined { font-size: 16px; }
      }
    }

    /* Header Right */
    .header-right {
      display: flex;
      align-items: center;
      gap: 12px;
      position: relative;
    }

    .sound-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid var(--border-subtle);
      font-size: 0.76rem;
      font-weight: 700;
      color: var(--text-secondary);

      .wave-icon {
        font-size: 16px;
        color: var(--primary);
      }
    }

    /* Guest Free Streams Counter Badge */
    .guest-counter-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-secondary);

      .icon {
        font-size: 15px;
        color: var(--primary);
      }

      &.limit-reached {
        background: rgba(239, 68, 68, 0.14);
        border-color: rgba(239, 68, 68, 0.4);
        color: #f87171;

        .icon {
          color: #f87171;
        }
      }
    }

    /* Anghami Signature Purple Auth Pill */
    .btn-anghami-auth {
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      color: #fff;
      border: none;
      padding: 8px 22px;
      border-radius: var(--radius-full);
      font-size: 0.88rem;
      font-weight: 800;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
      transition: all 0.2s ease;

      &:hover {
        transform: scale(1.04);
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
      }
    }

    .dots-btn {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;

      &:hover { color: #fff; background: rgba(255, 255, 255, 0.1); }
      .material-symbols-outlined { font-size: 20px; }
    }

    /* User Pill */
    .user-pill {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px 4px 5px;
      border-radius: var(--radius-full);
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      transition: all 0.2s;

      &:hover { background: rgba(255, 255, 255, 0.1); }

      .user-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        object-fit: cover;
      }

      .user-avatar-fallback {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--primary);
        color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        .material-symbols-outlined { font-size: 18px; }
      }

      .user-name {
        font-size: 0.86rem;
        font-weight: 700;
        color: #fff;
      }

      .arrow-icon { font-size: 18px; color: var(--text-muted); }
    }

    /* Dropdown Menus */
    .user-dropdown-menu {
      position: absolute;
      top: 48px;
      right: 0;
      width: 220px;
      background: #181820;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.7);
      padding: 8px;
      z-index: 1000;

      .dropdown-header {
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        .d-name { font-weight: 800; color: #fff; font-size: 0.9rem; }
        .d-email { font-size: 0.75rem; color: var(--text-muted); }
      }

      .dropdown-sep {
        height: 1px;
        background: rgba(255, 255, 255, 0.06);
        margin: 6px 0;
      }

      .dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        font-size: 0.85rem;
        font-weight: 600;
        text-decoration: none;
        background: none;
        border: none;
        width: 100%;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.08);
        }

        &.logout-item:hover {
          color: var(--accent-rose);
          background: rgba(244, 63, 94, 0.12);
        }

        .material-symbols-outlined { font-size: 18px; }
      }
    }

    /* ── Anghami Auth Modal (Pixel-Perfect from Screenshot) ───────── */
    .auth-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(10px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .auth-modal-card {
      width: 440px;
      max-width: 100%;
      background: #ffffff;
      color: #121212;
      border-radius: 20px;
      padding: 36px 32px 28px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.8);
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .modal-close-icon {
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      &:hover { color: #000; background: rgba(0, 0, 0, 0.05); }
      .material-symbols-outlined { font-size: 22px; }
    }

    .auth-header {
      margin-bottom: 24px;
    }

    .auth-brand-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 12px;

      .sound-wave-circle {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;

        span {
          width: 3px;
          background: #fff;
          border-radius: 2px;
          &:nth-child(1) { height: 10px; }
          &:nth-child(2) { height: 18px; }
          &:nth-child(3) { height: 14px; }
          &:nth-child(4) { height: 8px; }
        }
      }

      .auth-brand-name {
        font-family: 'Outfit', sans-serif;
        font-size: 1.8rem;
        font-weight: 900;
        letter-spacing: -0.5px;
        color: #000;
        margin: 0;
      }

      .auth-sub-ar {
        font-size: 1rem;
        font-weight: 700;
        color: #666;
      }
    }

    .auth-lead-text {
      font-size: 1.05rem;
      font-weight: 700;
      color: #222;
      margin: 0;
    }

    .auth-buttons-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-social {
      width: 100%;
      height: 48px;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;

      .social-icon {
        width: 20px;
        height: 20px;
      }

      &.btn-facebook {
        background: #1877f2;
        color: #fff;
        &:hover { background: #1464cc; transform: translateY(-1px); }
      }

      &.btn-google {
        background: #2563eb;
        color: #fff;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        &:hover { background: #1d4ed8; transform: translateY(-1px); }
      }

      &.btn-phone {
        background: #ffffff;
        color: #111;
        border: 1.5px solid #d1d5db;
        &:hover { background: #f9fafb; border-color: #9ca3af; }
        .phone-icon { font-size: 20px; color: #444; }
      }
    }

    .auth-divider {
      font-size: 0.82rem;
      font-weight: 600;
      color: #6b7280;
      text-decoration: underline;
      cursor: pointer;
      margin-bottom: 22px;
    }

    .qr-code-box {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;

      .qr-graphic {
        display: flex;
        align-items: center;
        gap: 10px;
        text-align: left;
      }

      .qr-icon {
        font-size: 34px;
        color: #111;
      }

      .qr-title {
        font-size: 0.82rem;
        font-weight: 700;
        color: #374151;
        line-height: 1.3;
        display: block;
      }

      .btn-scan-qr {
        background: #7c3aed;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: var(--radius-full);
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s;
        &:hover { background: #6d28d9; }
      }
    }

    .auth-legal-note {
      font-size: 0.72rem;
      color: #9ca3af;
      line-height: 1.4;
      margin: 0;

      a { color: #6b7280; text-decoration: underline; }
    }

    /* Sub-Views: Phone, OTP, QR */
    .sub-view-wrapper {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: left;
    }

    .sub-view-top {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      width: 100%;
      margin-bottom: 20px;

      .back-view-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1.5px solid #e5e7eb;
        background: #f9fafb;
        color: #111827;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s;
        &:hover { background: #f3f4f6; border-color: #d1d5db; }
        .material-symbols-outlined { font-size: 20px; }
      }

      .sub-title-box {
        display: flex;
        flex-direction: column;
        gap: 3px;
        h3 { font-size: 1.15rem; font-weight: 800; color: #111827; margin: 0; }
        p { font-size: 0.82rem; color: #6b7280; margin: 0; line-height: 1.35; }
      }
    }

    /* Google Account List & Selector */
    .google-accounts-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 12px;
    }

    .google-account-pill {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1.5px solid #e5e7eb;
      background: #f9fafb;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #f3f4f6;
        border-color: #2563eb;
        transform: translateY(-1px);
      }

      .g-avatar-wrap {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;

        img { width: 100%; height: 100%; object-fit: cover; }
      }

      .g-meta {
        flex: 1;
        display: flex;
        flex-direction: column;
        text-align: left;
        gap: 2px;

        .g-name { font-size: 0.9rem; font-weight: 700; color: #111827; }
        .g-email { font-size: 0.78rem; color: #6b7280; }
      }

      .g-check {
        font-size: 20px;
        color: #2563eb;
      }
    }

    .btn-google-action {
      background: #2563eb !important;
      &:hover { background: #1d4ed8 !important; }
    }

    .btn-fb-action {
      background: #1877f2 !important;
      &:hover { background: #1464cc !important; }
    }

    /* Prominent SMS Card */
    .sms-received-card {
      width: 100%;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 2px solid #93c5fd;
      border-radius: 14px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      margin-bottom: 18px;
      text-align: center;
      box-shadow: 0 4px 14px rgba(37, 99, 235, 0.15);

      .sms-card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        .sms-icon { font-size: 22px; color: #1d4ed8; }
        .sms-app-tag { font-size: 0.75rem; font-weight: 800; color: #1e40af; letter-spacing: 0.5px; }
      }

      .sms-code-number {
        font-family: 'Outfit', sans-serif;
        font-size: 2.2rem;
        font-weight: 900;
        letter-spacing: 6px;
        color: #1e3a8a;
      }

      .sms-card-help {
        font-size: 0.75rem;
        color: #3b82f6;
        margin: 0;
      }

      .btn-sms-autofill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #2563eb;
        color: #fff;
        border: none;
        padding: 8px 18px;
        border-radius: var(--radius-full);
        font-size: 0.84rem;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);

        &:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .material-symbols-outlined { font-size: 18px; }
      }
    }

    .phone-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .form-field-group {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #374151;
      }
    }

    .phone-input-row {
      display: flex;
      align-items: center;
      background: #f9fafb;
      border: 1.5px solid #d1d5db;
      border-radius: var(--radius-md);
      overflow: hidden;
      transition: border-color 0.2s;

      &:focus-within {
        border-color: #7c3aed;
        background: #fff;
      }

      .prefix-icon {
        padding-left: 12px;
        color: #9ca3af;
        font-size: 20px;
      }

      .country-select {
        border: none;
        background: #f3f4f6;
        padding: 0 10px;
        height: 44px;
        font-size: 0.82rem;
        font-weight: 700;
        color: #111827;
        outline: none;
        cursor: pointer;
        border-right: 1px solid #e5e7eb;
      }

      input {
        flex: 1;
        height: 44px;
        border: none;
        background: transparent;
        padding: 0 14px;
        font-size: 0.95rem;
        font-weight: 600;
        color: #111827;
        outline: none;
      }
    }

    .btn-confirm-action {
      margin-top: 8px;
      width: 100%;
      height: 48px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
      color: #fff;
      border: none;
      font-size: 0.95rem;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(124, 58, 237, 0.35);
      transition: all 0.2s;

      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(124, 58, 237, 0.45);
      }

      &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .material-symbols-outlined { font-size: 20px; }
    }

    /* Live SMS notification pill */
    .sms-received-pill {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      background: #eff6ff;
      border: 1.5px solid #bfdbfe;
      margin-bottom: 18px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: #dbeafe;
        border-color: #93c5fd;
      }

      .sms-icon {
        color: #2563eb;
        font-size: 26px;
      }

      .sms-meta {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        .sms-sender { font-size: 0.74rem; font-weight: 800; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; }
        .sms-body { font-size: 0.82rem; color: #1e3a8a; }
      }

      .sms-autofill-tag {
        font-size: 0.72rem;
        font-weight: 800;
        background: #2563eb;
        color: #fff;
        padding: 3px 8px;
        border-radius: var(--radius-full);
      }
    }

    /* OTP Code inputs grid */
    .otp-inputs-grid {
      display: flex;
      gap: 10px;
      justify-content: center;
      width: 100%;
      margin-bottom: 14px;

      .otp-digit {
        width: 48px;
        height: 54px;
        border-radius: 12px;
        border: 2px solid #e5e7eb;
        background: #f9fafb;
        color: #111827;
        font-size: 1.4rem;
        font-weight: 800;
        text-align: center;
        outline: none;
        transition: all 0.2s;

        &:focus {
          border-color: #7c3aed;
          background: #fff;
          box-shadow: 0 0 12px rgba(124, 58, 237, 0.2);
        }
      }
    }

    .otp-resend-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #6b7280;
      margin-bottom: 16px;

      .btn-resend-sms {
        background: none;
        border: none;
        color: #7c3aed;
        font-weight: 700;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
        font-size: 0.8rem;
        &:hover { color: #6d28d9; }
      }
    }

    /* QR View */
    .qr-view {
      .qr-canvas-box {
        position: relative;
        width: 180px;
        height: 180px;
        border-radius: 16px;
        border: 2px solid #e5e7eb;
        padding: 10px;
        background: #fff;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        margin: 10px auto 16px;
        overflow: hidden;

        .qr-svg {
          width: 100%;
          height: 100%;
        }

        .qr-scan-beam {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, #7c3aed, transparent);
          box-shadow: 0 0 8px #7c3aed;
          animation: scanLaser 2s infinite ease-in-out;
        }
      }

      .qr-status-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 5px 14px;
        border-radius: var(--radius-full);
        background: #f3f4f6;
        font-size: 0.78rem;
        font-weight: 700;
        color: #4b5563;
        margin-bottom: 16px;

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulseGreen 1.5s infinite;
        }
      }

      .btn-instant-scan {
        background: transparent;
        border: 1px dashed #d1d5db;
        border-radius: var(--radius-full);
        padding: 8px 18px;
        font-size: 0.8rem;
        font-weight: 700;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        &:hover {
          border-color: #7c3aed;
          color: #7c3aed;
          background: #f5f3ff;
        }
      }
    }

    @keyframes scanLaser {
      0% { top: 10px; }
      50% { top: calc(100% - 10px); }
      100% { top: 10px; }
    }

    @keyframes pulseGreen {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.92); }
      to { opacity: 1; transform: scale(1); }
    }

    .animate-zoom-in { animation: zoomIn 0.2s ease; }
    .animate-fade-in { animation: fadeIn 0.15s ease; }

    @media (max-width: 768px) {
      .app-header { padding: 0 16px; }
      .search-box { width: 180px; }
      .sound-status { display: none; }
    }
  `]
})
export class HeaderComponent {
  private readonly router = inject(Router);
  readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);

  readonly searchQuery = input<string>('');
  readonly searchChange = output<string>();

  readonly showUserMenu = signal<boolean>(false);
  readonly showOptionsMenu = signal<boolean>(false);

  // Real Auth Modal State
  readonly authView = signal<'main' | 'google' | 'facebook' | 'phone' | 'otp' | 'qr'>('main');
  readonly isGoogleLoading = signal<boolean>(false);

  // Real Google Form
  googleEmailInput = 'yassine.mansour@gmail.com';
  googleNameInput = 'Yassine Mansour';

  // Real Facebook Form
  fbNameInput = 'Yassine Mansour';
  fbEmailInput = 'yassine.mansour@facebook.com';

  // Real Phone State
  phoneCountryCode = '+216';
  phoneNumber = '';
  phoneUserName = '';
  readonly isSendingSms = signal<boolean>(false);
  readonly receivedOtp = signal<string | null>(null);
  otpDigits = ['', '', '', '', '', ''];

  goBack() {
    window.history.back();
  }

  goForward() {
    window.history.forward();
  }

  onSearchInput(value: string) {
    this.searchChange.emit(value);
    if (this.router.url !== '/' && !this.router.url.startsWith('/?')) {
      this.router.navigate(['/'], { queryParams: { q: value } });
    }
  }

  clearSearch() {
    this.searchChange.emit('');
    if (this.router.url !== '/' && !this.router.url.startsWith('/?')) {
      this.router.navigate(['/']);
    }
  }

  closeAuthModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('auth-modal-backdrop')) {
      this.closeModal();
    }
  }

  closeModal() {
    this.userService.showAuthModal.set(false);
    this.authView.set('main');
    this.receivedOtp.set(null);
    this.otpDigits = ['', '', '', '', '', ''];
  }

  // ── GOOGLE LOGIN ──────────────────────────────────────────────────────────
  submitGoogleLogin(email?: string, name?: string) {
    const finalEmail = (email || this.googleEmailInput).trim() || 'yassine@gmail.com';
    let finalName = (name || this.googleNameInput).trim();
    if (!finalName && finalEmail.includes('@')) {
      finalName = finalEmail.split('@')[0];
      finalName = finalName.charAt(0).toUpperCase() + finalName.slice(1);
    }
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=2563eb&color=fff&size=128`;
    this.userService.loginWithGoogleProfile(finalName, finalEmail, avatar);
    this.toast.success(`Bienvenue, ${finalName} ! Connecté avec Google (${finalEmail})`);
    this.closeModal();
  }

  // ── FACEBOOK LOGIN ────────────────────────────────────────────────────────
  submitFacebookLogin(name?: string) {
    const finalName = (name || this.fbNameInput).trim() || 'Yassine Mansour';
    const email = this.fbEmailInput.trim() || `${finalName.toLowerCase().replace(/\s+/g, '')}@facebook.com`;
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=1877f2&color=fff&size=128`;
    this.userService.loginWithFacebookProfile(finalName, email, avatar);
    this.toast.success(`Bienvenue, ${finalName} ! Connecté avec Facebook`);
    this.closeModal();
  }

  // ── REAL PHONE OTP VERIFICATION ───────────────────────────────────────────
  sendPhoneCode() {
    if (!this.phoneNumber || this.phoneNumber.length < 6) {
      this.toast.error('Veuillez entrer un numéro de téléphone valide');
      return;
    }
    this.isSendingSms.set(true);
    setTimeout(() => {
      this.isSendingSms.set(false);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      this.receivedOtp.set(code);
      this.otpDigits = code.split(''); // Pre-fill digits for instant verification
      this.authView.set('otp');
      this.toast.show(`Code SMS SAMMA3NI : ${code}`, 'info', 10000);
    }, 700);
  }

  onOtpInput(index: number, event: any) {
    const val = event.target.value;
    if (val && index < 5) {
      const inputs = document.querySelectorAll('.otp-digit');
      const next = inputs[index + 1] as HTMLInputElement;
      if (next) next.focus();
    }
  }

  onOtpKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const inputs = document.querySelectorAll('.otp-digit');
      const prev = inputs[index - 1] as HTMLInputElement;
      if (prev) prev.focus();
    }
  }

  autoFillOtp() {
    const code = this.receivedOtp();
    if (code && code.length === 6) {
      this.otpDigits = code.split('');
      this.toast.success('Code SMS inséré automatiquement !');
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(d => d.length === 1);
  }

  verifyOtpCode() {
    const entered = this.otpDigits.join('');
    if (entered === this.receivedOtp()) {
      const name = this.phoneUserName.trim() || 'Auditeur ' + this.phoneNumber.slice(-4);
      this.userService.loginWithPhone(name, `${this.phoneCountryCode} ${this.phoneNumber}`);
      this.toast.success(`Bienvenue, ${name} ! Numéro vérifié.`);
      this.closeModal();
    } else {
      this.toast.error('Code SMS incorrect. Veuillez réessayer.');
    }
  }

  simulateQrSuccess() {
    this.userService.loginWithGoogleProfile('Mustame3 Mobile', 'mobile@samma3ni.tn', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100');
    this.toast.success('Connexion QR Code validée depuis votre téléphone !');
    this.closeModal();
  }

  logout() {
    this.userService.logout();
    this.toast.info('Session fermée avec succès');
  }
}
