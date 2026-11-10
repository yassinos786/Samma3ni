package com.samma3ni.controller;

import com.samma3ni.model.ArtistProfile;
import com.samma3ni.service.ArtistProfileService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artists")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class ArtistController {

    private final ArtistProfileService artistService;

    public ArtistController(ArtistProfileService artistService) {
        this.artistService = artistService;
    }

    @GetMapping
    public ResponseEntity<List<ArtistProfile>> getAll() {
        return ResponseEntity.ok(artistService.getAllArtists());
    }

    @GetMapping("/{name}")
    public ResponseEntity<ArtistProfile> getByName(@PathVariable String name) {
        return artistService.getArtistByName(name)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{name}/avatar")
    public ResponseEntity<Resource> getAvatar(@PathVariable String name) {
        try {
            Path avatarPath = artistService.getAvatarPath(name);
            UrlResource resource = new UrlResource(avatarPath.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();

            String filename = avatarPath.getFileName().toString().toLowerCase();
            MediaType mediaType = filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok().contentType(mediaType).body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateArtist(
            @RequestParam String name,
            @RequestParam(required = false) String bio,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar) {
        try {
            ArtistProfile saved = artistService.updateArtistProfile(name, bio, avatar);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{name}")
    public ResponseEntity<?> deleteArtist(@PathVariable String name) {
        artistService.deleteProfile(name);
        return ResponseEntity.ok().build();
    }
}
