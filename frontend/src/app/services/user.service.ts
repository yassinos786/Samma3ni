import { Injectable, signal } from '@angular/core';
import { Song } from '../models/song.model';

export interface UserProfile {
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  provider: 'google' | 'facebook' | 'phone' | 'guest' | 'email';
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly USER_KEY = 'samma3ni_user_session';
  private readonly GUEST_PLAYS_KEY = 'samma3ni_guest_plays_count';
  private readonly GOOGLE_CLIENT_ID_KEY = 'samma3ni_google_client_id';
  private readonly FB_APP_ID_KEY = 'samma3ni_fb_app_id';

  // Free listening limit for unauthenticated users
  readonly MAX_FREE_PLAYS = 3;

  readonly currentUser = signal<UserProfile | null>(this.loadUser());
  readonly showAuthModal = signal<boolean>(false);
  readonly isMandatoryAuth = signal<boolean>(false);
  readonly guestPlaysCount = signal<number>(this.loadGuestPlays());
  readonly pendingSong = signal<Song | null>(null);
  readonly promoDismissed = signal<boolean>(localStorage.getItem('samma3ni_promo_dismissed') === 'true');

  // Configurable Client IDs for Google & Facebook
  readonly googleClientId = signal<string>(
    localStorage.getItem(this.GOOGLE_CLIENT_ID_KEY) || '1042784535311-samma3ni.apps.googleusercontent.com'
  );
  readonly fbAppId = signal<string>(
    localStorage.getItem(this.FB_APP_ID_KEY) || '1428571428571428'
  );

  private loadUser(): UserProfile | null {
    try {
      const data = localStorage.getItem(this.USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private loadGuestPlays(): number {
    try {
      const count = parseInt(localStorage.getItem(this.GUEST_PLAYS_KEY) || '0', 10);
      return isNaN(count) ? 0 : count;
    } catch {
      return 0;
    }
  }

  /**
   * Evaluates if user can play a track:
   * - Authenticated users: Unlimited streams (always true).
   * - Unauthenticated guests: Maximum 3 free tracks. On 4th track, blocks stream & forces mandatory auth modal!
   */
  canPlaySong(song: Song): boolean {
    if (this.currentUser()) {
      return true; // Authenticated = unlimited streaming
    }

    if (this.guestPlaysCount() >= this.MAX_FREE_PLAYS) {
      this.pendingSong.set(song);
      this.isMandatoryAuth.set(true);
      this.showAuthModal.set(true);
      return false; // Lock playback!
    }

    // Still within free trial (1, 2, or 3)
    const nextCount = this.guestPlaysCount() + 1;
    this.guestPlaysCount.set(nextCount);
    localStorage.setItem(this.GUEST_PLAYS_KEY, nextCount.toString());
    return true;
  }

  openAuth(mandatory = false, songToPlay?: Song) {
    this.isMandatoryAuth.set(mandatory);
    if (songToPlay) {
      this.pendingSong.set(songToPlay);
    }
    this.showAuthModal.set(true);
  }

  closeAuth() {
    if (this.isMandatoryAuth()) {
      return; // Cannot dismiss when mandatory limit reached!
    }
    this.showAuthModal.set(false);
  }

  saveGoogleClientId(clientId: string) {
    this.googleClientId.set(clientId);
    localStorage.setItem(this.GOOGLE_CLIENT_ID_KEY, clientId);
  }

  saveFbAppId(appId: string) {
    this.fbAppId.set(appId);
    localStorage.setItem(this.FB_APP_ID_KEY, appId);
  }

  loginWithEmail(name: string, email: string, avatarUrl?: string) {
    const finalName = name.trim() || email.split('@')[0] || 'Auditeur';
    const profile: UserProfile = {
      name: finalName,
      email: email.trim(),
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=1ed760&color=000&size=128`,
      provider: 'email'
    };
    this.saveUser(profile);
  }

  loginWithGoogleProfile(name: string, email: string, avatarUrl: string) {
    const finalName = name.trim() || 'Google User';
    const profile: UserProfile = {
      name: finalName,
      email: email.trim() || `${finalName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=2563eb&color=fff&size=128`,
      provider: 'google'
    };
    this.saveUser(profile);
  }

  loginWithFacebookProfile(name: string, email: string, avatarUrl: string) {
    const finalName = name.trim() || 'Facebook User';
    const profile: UserProfile = {
      name: finalName,
      email: email.trim() || `${finalName.toLowerCase().replace(/\s+/g, '')}@facebook.com`,
      avatarUrl: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=1877f2&color=fff&size=128`,
      provider: 'facebook'
    };
    this.saveUser(profile);
  }

  loginWithPhone(name: string, phone: string) {
    const finalName = name.trim() || `Auditeur ${phone.slice(-4)}`;
    const profile: UserProfile = {
      name: finalName,
      phone,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=7c3aed&color=fff&size=128`,
      provider: 'phone'
    };
    this.saveUser(profile);
  }

  loginAsGuest() {
    const profile: UserProfile = {
      name: 'Auditeur Samma3ni',
      provider: 'guest'
    };
    this.saveUser(profile);
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem(this.USER_KEY);
  }

  dismissPromo() {
    this.promoDismissed.set(true);
    localStorage.setItem('samma3ni_promo_dismissed', 'true');
  }

  private saveUser(profile: UserProfile) {
    this.currentUser.set(profile);
    localStorage.setItem(this.USER_KEY, JSON.stringify(profile));
    this.showAuthModal.set(false);
    this.isMandatoryAuth.set(false);
  }
}
