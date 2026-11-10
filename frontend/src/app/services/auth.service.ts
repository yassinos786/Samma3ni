import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { AuthResponse, User, ValidateResponse } from '../models/auth.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  readonly currentUser = signal<User | null>(null);
  readonly token = signal<string | null>(localStorage.getItem('samma3ni_token'));
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  readonly isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    this.restoreSession();
  }

  private restoreSession() {
    const savedToken = localStorage.getItem('samma3ni_token');
    const savedUsername = localStorage.getItem('samma3ni_username');
    const savedRole = localStorage.getItem('samma3ni_role');

    if (savedToken && savedUsername && savedRole) {
      this.currentUser.set({ username: savedUsername, role: savedRole });
      this.token.set(savedToken);

      // Validate in background
      this.validateToken().subscribe();
    }
  }

  login(credentials: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('samma3ni_token', res.token);
        localStorage.setItem('samma3ni_username', res.username);
        localStorage.setItem('samma3ni_role', res.role);

        this.token.set(res.token);
        this.currentUser.set({ username: res.username, role: res.role });
      })
    );
  }

  validateToken(): Observable<ValidateResponse> {
    const savedToken = this.token();
    if (!savedToken) {
      return of({ valid: false });
    }

    return this.http.get<ValidateResponse>(`${this.baseUrl}/validate`).pipe(
      catchError(() => {
        this.logout();
        return of({ valid: false });
      })
    );
  }

  logout() {
    localStorage.removeItem('samma3ni_token');
    localStorage.removeItem('samma3ni_username');
    localStorage.removeItem('samma3ni_role');
    this.token.set(null);
    this.currentUser.set(null);
  }
}
