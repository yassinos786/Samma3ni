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
@Document(collection = "albums")
public class AlbumProfile {
    @Id
    private String id;
    private String title;
    private String artist;
    private String coverFile;
    private String releaseYear;
    private String description;
    private LocalDateTime updatedAt;
}
