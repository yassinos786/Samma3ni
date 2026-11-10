package com.samma3ni.repository;

import com.samma3ni.model.ArtistProfile;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ArtistProfileRepository extends MongoRepository<ArtistProfile, String> {
    Optional<ArtistProfile> findByNameIgnoreCase(String name);
}
