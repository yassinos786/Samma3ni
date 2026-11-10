package com.samma3ni.repository;

import com.samma3ni.model.Song;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SongRepository extends MongoRepository<Song, String> {
    List<Song> findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCase(String title, String artist);
    List<Song> findByArtistIgnoreCase(String artist);
    List<Song> findByGenreIgnoreCase(String genre);
}
