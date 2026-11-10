package com.samma3ni.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "songs")
public class Song {
    @Id
    private String id;
    private String title;
    private String artist;
    private String album;
    private String genre;
    private int duration;       // seconds
    private String audioFile;   // filename in uploads/audio/
    private String coverFile;   // filename in uploads/covers/
    private long playCount;
    private LocalDateTime uploadedAt;
}
