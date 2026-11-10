package com.samma3ni.controller;

import com.samma3ni.model.Song;
import com.samma3ni.service.SongService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/songs")
@CrossOrigin(originPatterns = "*", allowCredentials = "true")
public class SongController {

    private final SongService songService;

    public SongController(SongService songService) {
        this.songService = songService;
    }

    // ── Public Endpoints ─────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<Song>> getAllSongs() {
        return ResponseEntity.ok(songService.getAllSongs());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Song>> search(@RequestParam String q) {
        return ResponseEntity.ok(songService.searchSongs(q));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Song> getSong(@PathVariable String id) {
        return songService.getSongById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /** Stream audio with HTTP Range support for seeking */
    @GetMapping("/{id}/stream")
    public ResponseEntity<Resource> streamAudio(
            @PathVariable String id,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader) {

        try {
            Path filePath = songService.getAudioPath(id);
            UrlResource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) return ResponseEntity.notFound().build();

            long fileLength = filePath.toFile().length();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
            headers.add(HttpHeaders.ACCEPT_RANGES, "bytes");

            // Handle range request (for audio seeking)
            if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
                String[] ranges = rangeHeader.substring(6).split("-");
                long start = Long.parseLong(ranges[0]);
                long end = ranges.length > 1 && !ranges[1].isEmpty()
                        ? Long.parseLong(ranges[1])
                        : fileLength - 1;
                long contentLength = end - start + 1;

                headers.add(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileLength);
                headers.setContentLength(contentLength);

                return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                        .headers(headers)
                        .body(new RangeResource(resource, start, contentLength));
            }

            headers.setContentLength(fileLength);
            return ResponseEntity.ok().headers(headers).body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /** Get cover image */
    @GetMapping("/{id}/cover")
    public ResponseEntity<Resource> getCover(@PathVariable String id) {
        try {
            Path coverPath = songService.getCoverPath(id);
            UrlResource resource = new UrlResource(coverPath.toUri());
            if (!resource.exists()) return ResponseEntity.notFound().build();

            String filename = coverPath.getFileName().toString().toLowerCase();
            MediaType mediaType = filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG;
            return ResponseEntity.ok().contentType(mediaType).body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    /** Increment play count */
    @PostMapping("/{id}/play")
    public ResponseEntity<Song> incrementPlay(@PathVariable String id) {
        return ResponseEntity.ok(songService.incrementPlayCount(id));
    }

    // ── Admin Endpoints ───────────────────────────────────────────────────────

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadSong(
            @RequestParam String title,
            @RequestParam String artist,
            @RequestParam(required = false) String album,
            @RequestParam(required = false) String genre,
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam(value = "cover", required = false) MultipartFile coverFile) {

        try {
            Song song = songService.uploadSong(title, artist, album, genre, audioFile, coverFile);
            return ResponseEntity.status(HttpStatus.CREATED).body(song);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateSong(
            @PathVariable String id,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String artist,
            @RequestParam(required = false) String album,
            @RequestParam(required = false) String genre,
            @RequestParam(value = "cover", required = false) MultipartFile coverFile) {
        try {
            Song updated = songService.updateSong(id, title, artist, album, genre, coverFile);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSong(@PathVariable String id) {
        try {
            songService.deleteSong(id);
            return ResponseEntity.ok(Map.of("message", "Song deleted"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        return ResponseEntity.ok(songService.getTrendsAndStats());
    }

    @GetMapping("/stats/trends")
    public ResponseEntity<?> getTrends() {
        return ResponseEntity.ok(songService.getTrendsAndStats());
    }
}
