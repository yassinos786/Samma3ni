package com.samma3ni.controller;

import com.samma3ni.model.AlbumProfile;
import com.samma3ni.service.AlbumProfileService;
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
@RequestMapping("/api/albums")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class AlbumController {

    private final AlbumProfileService albumService;

    public AlbumController(AlbumProfileService albumService) {
        this.albumService = albumService;
    }

    @GetMapping
    public ResponseEntity<List<AlbumProfile>> getAll() {
        return ResponseEntity.ok(albumService.getAllAlbums());
    }

    @GetMapping("/{title}")
    public ResponseEntity<AlbumProfile> getByTitle(@PathVariable String title) {
        return albumService.getAlbumByTitle(title)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{title}/cover")
    public ResponseEntity<Resource> getCover(@PathVariable String title) {
        try {
            Path coverPath = albumService.getCoverPath(title);
            UrlResource resource = new UrlResource(coverPath.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();

            String filename = coverPath.getFileName().toString().toLowerCase();
            MediaType mediaType = filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok().contentType(mediaType).body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateAlbum(
            @RequestParam String title,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String releaseYear,
            @RequestParam(required = false) String description,
            @RequestParam(value = "cover", required = false) MultipartFile cover) {
        try {
            AlbumProfile saved = albumService.updateAlbumProfile(title, artist, releaseYear, description, cover);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{title}")
    public ResponseEntity<?> deleteAlbum(@PathVariable String title) {
        albumService.deleteProfile(title);
        return ResponseEntity.ok().build();
    }
}
