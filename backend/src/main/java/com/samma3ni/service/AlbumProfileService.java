package com.samma3ni.service;

import com.samma3ni.model.AlbumProfile;
import com.samma3ni.repository.AlbumProfileRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AlbumProfileService {

    private final AlbumProfileRepository albumRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public AlbumProfileService(AlbumProfileRepository albumRepository) {
        this.albumRepository = albumRepository;
    }

    public List<AlbumProfile> getAllAlbums() {
        return albumRepository.findAll();
    }

    public Optional<AlbumProfile> getAlbumByTitle(String title) {
        return albumRepository.findByTitleIgnoreCase(title);
    }

    public AlbumProfile updateAlbumProfile(String title, String artist, String releaseYear, String description, MultipartFile coverFile) throws IOException {
        AlbumProfile profile = albumRepository.findByTitleIgnoreCase(title)
                .orElse(AlbumProfile.builder().title(title).artist(artist).build());

        if (artist != null && !artist.isBlank()) {
            profile.setArtist(artist);
        }
        if (releaseYear != null) {
            profile.setReleaseYear(releaseYear);
        }
        if (description != null) {
            profile.setDescription(description);
        }

        if (coverFile != null && !coverFile.isEmpty()) {
            Path albumsPath = Paths.get(uploadDir, "albums");
            Files.createDirectories(albumsPath);

            String filename = UUID.randomUUID() + "_" + coverFile.getOriginalFilename();
            Path filePath = albumsPath.resolve(filename);
            Files.write(filePath, coverFile.getBytes());
            profile.setCoverFile(filename);
        }

        profile.setUpdatedAt(LocalDateTime.now());
        return albumRepository.save(profile);
    }

    public Path getCoverPath(String title) {
        AlbumProfile profile = albumRepository.findByTitleIgnoreCase(title)
                .orElseThrow(() -> new RuntimeException("Album not found"));

        if (profile.getCoverFile() == null) {
            throw new RuntimeException("No cover for album");
        }
        
        Path inAlbums = Paths.get(uploadDir, "albums", profile.getCoverFile());
        if (Files.exists(inAlbums)) {
            return inAlbums;
        }
        Path inCovers = Paths.get(uploadDir, "covers", profile.getCoverFile());
        if (Files.exists(inCovers)) {
            return inCovers;
        }
        return inAlbums;
    }

    public void deleteProfile(String title) {
        albumRepository.findByTitleIgnoreCase(title).ifPresent(albumRepository::delete);
    }
}
