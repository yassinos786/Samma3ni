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
@Document(collection = "artists")
public class ArtistProfile {
    @Id
    private String id;
    private String name;
    private String avatarFile;
    private String bio;
    private LocalDateTime updatedAt;
}
