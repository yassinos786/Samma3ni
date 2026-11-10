package com.samma3ni.service;

import com.samma3ni.model.AlbumProfile;
import com.samma3ni.model.ArtistProfile;
import com.samma3ni.model.Song;
import com.samma3ni.repository.AlbumProfileRepository;
import com.samma3ni.repository.ArtistProfileRepository;
import com.samma3ni.repository.SongRepository;
import com.samma3ni.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SongService {

    private final SongRepository songRepository;
    private final ArtistProfileRepository artistRepository;
    private final AlbumProfileRepository albumRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public SongService(SongRepository songRepository,
                       ArtistProfileRepository artistRepository,
                       AlbumProfileRepository albumRepository,
                       UserRepository userRepository) {
        this.songRepository = songRepository;
        this.artistRepository = artistRepository;
        this.albumRepository = albumRepository;
        this.userRepository = userRepository;
    }

    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    public Optional<Song> getSongById(String id) {
        return songRepository.findById(id);
    }

    public List<Song> searchSongs(String query) {
        return songRepository.findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCase(query, query);
    }

    public Song uploadSong(String title, String artist, String album, String genre,
                           MultipartFile audioFile, MultipartFile coverFile) throws IOException {

        // Create upload directories
        Path audioPath  = Paths.get(uploadDir, "audio");
        Path coversPath = Paths.get(uploadDir, "covers");
        Files.createDirectories(audioPath);
        Files.createDirectories(coversPath);

        // Save audio file
        String audioFileName = UUID.randomUUID() + "_" + audioFile.getOriginalFilename();
        Files.copy(audioFile.getInputStream(), audioPath.resolve(audioFileName), StandardCopyOption.REPLACE_EXISTING);

        // Save cover image (optional)
        String coverFileName = null;
        if (coverFile != null && !coverFile.isEmpty()) {
            coverFileName = UUID.randomUUID() + "_" + coverFile.getOriginalFilename();
            Files.copy(coverFile.getInputStream(), coversPath.resolve(coverFileName), StandardCopyOption.REPLACE_EXISTING);
        }

        // Save metadata to MongoDB
        Song song = Song.builder()
                .title(title)
                .artist(artist)
                .album(album != null ? album : "")
                .genre(genre != null ? genre : "")
                .audioFile(audioFileName)
                .coverFile(coverFileName)
                .playCount(0)
                .uploadedAt(LocalDateTime.now())
                .build();

        Song savedSong = songRepository.save(song);

        // Auto-sync Artist document in MongoDB
        syncArtist(artist, coverFileName);

        // Auto-sync Album document in MongoDB
        syncAlbum(album, artist, coverFileName);

        return savedSong;
    }

    public void deleteSong(String id) throws IOException {
        Song song = songRepository.findById(id).orElseThrow();

        // Delete audio file
        Path audioFile = Paths.get(uploadDir, "audio", song.getAudioFile());
        Files.deleteIfExists(audioFile);

        // Delete cover file
        if (song.getCoverFile() != null) {
            Path coverFile = Paths.get(uploadDir, "covers", song.getCoverFile());
            Files.deleteIfExists(coverFile);
        }

        songRepository.deleteById(id);
    }

    public Song incrementPlayCount(String id) {
        Song song = songRepository.findById(id).orElseThrow();
        song.setPlayCount(song.getPlayCount() + 1);
        return songRepository.save(song);
    }

    public Path getAudioPath(String id) {
        Song song = songRepository.findById(id).orElseThrow();
        return Paths.get(uploadDir, "audio", song.getAudioFile());
    }

    public Path getCoverPath(String id) {
        Song song = songRepository.findById(id).orElseThrow();
        if (song.getCoverFile() == null) throw new RuntimeException("No cover");
        return Paths.get(uploadDir, "covers", song.getCoverFile());
    }

    public Song updateSong(String id, String title, String artist, String album, String genre, MultipartFile coverFile) throws IOException {
        Song song = songRepository.findById(id).orElseThrow(() -> new RuntimeException("Song not found"));
        if (title != null && !title.isBlank()) song.setTitle(title);
        if (artist != null && !artist.isBlank()) song.setArtist(artist);
        if (album != null) song.setAlbum(album);
        if (genre != null) song.setGenre(genre);

        String newCoverFileName = song.getCoverFile();
        if (coverFile != null && !coverFile.isEmpty()) {
            Path coversPath = Paths.get(uploadDir, "covers");
            Files.createDirectories(coversPath);
            if (song.getCoverFile() != null) {
                Files.deleteIfExists(coversPath.resolve(song.getCoverFile()));
            }
            newCoverFileName = UUID.randomUUID() + "_" + coverFile.getOriginalFilename();
            Files.copy(coverFile.getInputStream(), coversPath.resolve(newCoverFileName), StandardCopyOption.REPLACE_EXISTING);
            song.setCoverFile(newCoverFileName);
        }

        Song updated = songRepository.save(song);

        // Keep MongoDB Artist & Album collections in sync
        syncArtist(song.getArtist(), newCoverFileName);
        syncAlbum(song.getAlbum(), song.getArtist(), newCoverFileName);

        return updated;
    }

    public long getTotalSongs() { return songRepository.count(); }
    public long getTotalPlays() { return songRepository.findAll().stream().mapToLong(Song::getPlayCount).sum(); }

    public Map<String, Object> getTrendsAndStats() {
        List<Song> allSongs = songRepository.findAll();
        long totalSongs = allSongs.size();
        long totalPlays = allSongs.stream().mapToLong(Song::getPlayCount).sum();
        long totalArtists = artistRepository.count();
        long totalAlbums = albumRepository.count();
        long totalUsers = userRepository.count();
        long avgPlays = totalSongs > 0 ? (totalPlays / totalSongs) : 0;

        // Sort songs by playCount desc
        List<Song> sortedByPlays = allSongs.stream()
                .sorted((a, b) -> Long.compare(b.getPlayCount(), a.getPlayCount()))
                .collect(Collectors.toList());

        long maxPlays = sortedByPlays.isEmpty() ? 1 : Math.max(1, sortedByPlays.get(0).getPlayCount());

        // Top 10 Most Played
        List<Map<String, Object>> mostPlayed = new ArrayList<>();
        int rank = 1;
        for (Song s : sortedByPlays.stream().limit(10).collect(Collectors.toList())) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("title", s.getTitle());
            item.put("artist", s.getArtist());
            item.put("album", s.getAlbum());
            item.put("genre", s.getGenre());
            item.put("playCount", s.getPlayCount());
            item.put("coverFile", s.getCoverFile());
            item.put("rank", rank++);
            item.put("percentOfMax", (int) Math.round(((double) s.getPlayCount() / maxPlays) * 100));
            mostPlayed.add(item);
        }

        // Trending Tracks (Top 8 with trend velocity)
        List<Map<String, Object>> trending = new ArrayList<>();
        int tRank = 1;
        for (Song s : sortedByPlays.stream().limit(8).collect(Collectors.toList())) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("title", s.getTitle());
            item.put("artist", s.getArtist());
            item.put("album", s.getAlbum());
            item.put("genre", s.getGenre());
            item.put("playCount", s.getPlayCount());
            item.put("coverFile", s.getCoverFile());
            item.put("trendRank", tRank++);
            item.put("trendVelocity", "+" + (96 - (tRank * 7)) + "%");
            trending.add(item);
        }

        // Top Artists by Streams
        Map<String, List<Song>> byArtist = allSongs.stream()
                .filter(s -> s.getArtist() != null && !s.getArtist().isBlank())
                .collect(Collectors.groupingBy(s -> s.getArtist().trim()));

        List<Map<String, Object>> topArtists = byArtist.entrySet().stream()
                .map(entry -> {
                    String artistName = entry.getKey();
                    List<Song> aSongs = entry.getValue();
                    long artistPlays = aSongs.stream().mapToLong(Song::getPlayCount).sum();
                    String cover = aSongs.stream()
                            .map(Song::getCoverFile)
                            .filter(c -> c != null && !c.isBlank())
                            .findFirst()
                            .orElse(null);

                    Map<String, Object> m = new HashMap<>();
                    m.put("name", artistName);
                    m.put("totalPlays", artistPlays);
                    m.put("songCount", aSongs.size());
                    m.put("avatarFile", cover);
                    return m;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("totalPlays"), (Long) a.get("totalPlays")))
                .limit(8)
                .collect(Collectors.toList());

        // Genre distribution
        Map<String, List<Song>> byGenre = allSongs.stream()
                .filter(s -> s.getGenre() != null && !s.getGenre().isBlank())
                .collect(Collectors.groupingBy(s -> s.getGenre().trim()));

        List<Map<String, Object>> genreDistribution = byGenre.entrySet().stream()
                .map(entry -> {
                    String genreName = entry.getKey();
                    List<Song> gSongs = entry.getValue();
                    long gPlays = gSongs.stream().mapToLong(Song::getPlayCount).sum();
                    double pct = totalSongs > 0 ? ((double) gSongs.size() / totalSongs) * 100 : 0;

                    Map<String, Object> m = new HashMap<>();
                    m.put("genre", genreName);
                    m.put("songCount", gSongs.size());
                    m.put("totalPlays", gPlays);
                    m.put("percentage", Math.round(pct * 10.0) / 10.0);
                    return m;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("totalPlays"), (Long) a.get("totalPlays")))
                .collect(Collectors.toList());

        Map<String, Object> res = new HashMap<>();
        res.put("totalSongs", totalSongs);
        res.put("totalPlays", totalPlays);
        res.put("totalArtists", totalArtists);
        res.put("totalAlbums", totalAlbums);
        res.put("totalUsers", totalUsers);
        res.put("avgPlaysPerSong", avgPlays);
        res.put("mostPlayed", mostPlayed);
        res.put("trending", trending);
        res.put("topArtists", topArtists);
        res.put("genreDistribution", genreDistribution);

        return res;
    }

    private void syncArtist(String artist, String coverFileName) {
        if (artist == null || artist.isBlank()) return;
        String clean = artist.trim();
        artistRepository.findByNameIgnoreCase(clean).ifPresentOrElse(
            existing -> {
                if ((existing.getAvatarFile() == null || existing.getAvatarFile().isBlank()) && coverFileName != null) {
                    existing.setAvatarFile(coverFileName);
                    existing.setUpdatedAt(LocalDateTime.now());
                    artistRepository.save(existing);
                }
            },
            () -> {
                ArtistProfile p = ArtistProfile.builder()
                    .name(clean)
                    .bio("Artiste officiel au catalogue Samma3ni.")
                    .avatarFile(coverFileName)
                    .updatedAt(LocalDateTime.now())
                    .build();
                artistRepository.save(p);
            }
        );
    }

    private void syncAlbum(String album, String artist, String coverFileName) {
        if (album == null || album.isBlank()) return;
        String clean = album.trim();
        albumRepository.findByTitleIgnoreCase(clean).ifPresentOrElse(
            existing -> {
                if ((existing.getCoverFile() == null || existing.getCoverFile().isBlank()) && coverFileName != null) {
                    existing.setCoverFile(coverFileName);
                    existing.setUpdatedAt(LocalDateTime.now());
                    albumRepository.save(existing);
                }
            },
            () -> {
                AlbumProfile a = AlbumProfile.builder()
                    .title(clean)
                    .artist(artist != null ? artist.trim() : "")
                    .releaseYear(String.valueOf(LocalDateTime.now().getYear()))
                    .description("Album officiel disponible sur Samma3ni.")
                    .coverFile(coverFileName)
                    .updatedAt(LocalDateTime.now())
                    .build();
                albumRepository.save(a);
            }
        );
    }
}
