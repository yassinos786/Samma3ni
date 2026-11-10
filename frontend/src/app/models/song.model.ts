export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  duration?: number;
  audioFile: string;
  coverFile?: string;
  playCount: number;
  uploadedAt: string;
}

export interface MostPlayedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  playCount: number;
  coverFile?: string;
  rank: number;
  percentOfMax: number;
}

export interface TrendingTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  genre?: string;
  playCount: number;
  coverFile?: string;
  trendRank: number;
  trendVelocity: string;
}

export interface TopArtistStat {
  name: string;
  totalPlays: number;
  songCount: number;
  avatarFile?: string;
}

export interface GenreStat {
  genre: string;
  songCount: number;
  totalPlays: number;
  percentage: number;
}

export interface Stats {
  totalSongs: number;
  totalPlays: number;
  totalArtists?: number;
  totalAlbums?: number;
  totalUsers?: number;
  avgPlaysPerSong?: number;
  mostPlayed?: MostPlayedTrack[];
  trending?: TrendingTrack[];
  topArtists?: TopArtistStat[];
  genreDistribution?: GenreStat[];
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN' | 'VIP';
  status: 'ACTIVE' | 'BLOCKED';
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  active: number;
  blocked: number;
  admins: number;
}
