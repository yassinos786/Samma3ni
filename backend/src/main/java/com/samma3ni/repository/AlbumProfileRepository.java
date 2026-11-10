package com.samma3ni.repository;

import com.samma3ni.model.AlbumProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface AlbumProfileRepository extends MongoRepository<AlbumProfile, String> {
    Optional<AlbumProfile> findByTitleIgnoreCase(String title);
}
