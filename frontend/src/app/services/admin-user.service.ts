import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminUser, UsersResponse } from '../models/song.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/users`;

  getUsers(query?: string, role?: string, status?: string): Observable<UsersResponse> {
    let params = new HttpParams();
    if (query && query.trim()) params = params.set('q', query.trim());
    if (role && role !== 'ALL') params = params.set('role', role);
    if (status && status !== 'ALL') params = params.set('status', status);

    return this.http.get<UsersResponse>(this.baseUrl, { params });
  }

  createUser(payload: { email: string; password: string; name?: string; role?: string; status?: string; phone?: string }): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateUser(id: string, payload: { name?: string; email?: string; password?: string; role?: string; status?: string; phone?: string }): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, payload);
  }

  toggleStatus(id: string, status?: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, status ? { status } : {});
  }

  updateRole(id: string, role: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/role`, { role });
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
