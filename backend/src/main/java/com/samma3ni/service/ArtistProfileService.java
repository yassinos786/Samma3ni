package com.samma3ni.service;

import com.samma3ni.model.ArtistProfile;
import com.samma3ni.repository.ArtistProfileRepository;
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
public class ArtistProfileService {

    private final ArtistProfileRepository artistRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public ArtistProfileService(ArtistProfileRepository artistRepository) {
        this.artistRepository = artistRepository;
    }

    public List<ArtistProfile> getAllArtists() {
        return artistRepository.findAll();
    }

    public Optional<ArtistProfile> getArtistByName(String name) {
        return artistRepository.findByNameIgnoreCase(name);
    }

    public ArtistProfile updateArtistProfile(String name, String bio, MultipartFile avatarFile) throws IOException {
        ArtistProfile profile = artistRepository.findByNameIgnoreCase(name)
                .orElse(ArtistProfile.builder().name(name).build());

        if (bio != null) {
            profile.setBio(bio);
        }

        if (avatarFile != null && !avatarFile.isEmpty()) {
            Path artistsPath = Paths.get(uploadDir, "artists");
            Files.createDirectories(artistsPath);

            String filename = UUID.randomUUID() + "_" + avatarFile.getOriginalFilename();
            Path filePath = artistsPath.resolve(filename);
            Files.write(filePath, avatarFile.getBytes());
            profile.setAvatarFile(filename);
        }

        profile.setUpdatedAt(LocalDateTime.now());
        return artistRepository.save(profile);
    }

    public Path getAvatarPath(String name) {
        ArtistProfile profile = artistRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> new RuntimeException("Artist not found"));

        if (profile.getAvatarFile() == null) {
            throw new RuntimeException("No avatar for artist");
        }
        
        Path inArtists = Paths.get(uploadDir, "artists", profile.getAvatarFile());
        if (Files.exists(inArtists)) {
            return inArtists;
        }
        Path inCovers = Paths.get(uploadDir, "covers", profile.getAvatarFile());
        if (Files.exists(inCovers)) {
            return inCovers;
        }
        return inArtists;
    }

    public void deleteProfile(String name) {
        artistRepository.findByNameIgnoreCase(name).ifPresent(artistRepository::delete);
    }
}
