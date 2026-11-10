package com.samma3ni.config;

import com.samma3ni.model.AlbumProfile;
import com.samma3ni.model.ArtistProfile;
import com.samma3ni.model.Song;
import com.samma3ni.repository.AlbumProfileRepository;
import com.samma3ni.repository.ArtistProfileRepository;
import com.samma3ni.repository.SongRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Configuration
public class DataInitializer {

    private static final Map<String, String> ARTIST_BIOS = Map.of(
        "Gipsy Kings", "Groupe légendaire originaire d'Arles et de Montpellier, pionniers mondiaux de la rumba flamenca et de la pop gitane.",
        "Amr Diab", "الهضبة - Pionnier de la musique méditerranéenne moderne et superstar emblématique de la pop arabe.",
        "Sabah Fakhri", "سلطان الطرب والقدود الحلبية وأسطورة الغناء العربي الأصيل والموشحات التراثية الخالدة.",
        "صباح فخري", "سلطان الطرب والقدود الحلبية وأسطورة الغناء العربي الأصيل والموشحات التراثية الخالدة.",
        "Jadal", "فرقة روك عربي أردنية رائدة ومؤسسة لموجة الإندي روك البديل في العالم العربي.",
        "Emp1re", "Producteur et compositeur électro/urbain innovant explorant des sonorités hybrides modernes.",
        "Cheb Khaled", "ملك الراي وسفير الموسيقى المغاربية والجزائرية في العالم (King of Raï), créateur des tubes universels Didi, Aïcha et C'est la vie.",
        "Saber Rebai", "أمير الطرب العربي وفخر الموسيقى التونسية، صاحب الحنجرة الذهبية والأغاني الخالدة مثل سيدي منصور وبرشا.",
        "Michael Jackson", "The King of Pop. Global cultural icon and the most awarded music artist in history, creator of the legendary Thriller album."
    );

    private static final Map<String, String> ALBUM_DESCRIPTIONS = Map.of(
        "Gipsy Kings (1987)", "Album éponyme légendaire certifié or et platine, comprenant les hymnes mondiaux Bamboléo et Djobi Djoba.",
        "Mosaïque", "Deuxième album studio mythique des Gipsy Kings, avec l'incontournable reprise de Volare.",
        "Este Mundo", "Cinquième album studio culte des Gipsy Kings comprenant le chef-d'œuvre Baila Me.",
        "WAYAH", "Album phare d'Amr Diab paru en 2009, récompensé aux World Music Awards.",
        "Arabic Rock", "Album pionnier du rock indépendant arabe par le groupe Jadal.",
        "Single Track", "Morceau officiel exclusif haute fidélité disponible sur Samma3ni.",
        "Khaled (1992)", "L'album historique de Cheb Khaled produit par Don Was, propulsant le Raï maghrébin au sommet mondial avec le tube Didi.",
        "Sidi Mansour (2000)", "L'album triomphal de Saber Rebai revisitant le patrimoine tunisien avec l'hymne universel Sidi Mansour (Ya Baba).",
        "Thriller", "L'album le plus vendu de tous les temps dans l'histoire de la musique, produit par Quincy Jones et Michael Jackson."
    );

    private static final Map<String, String> ALBUM_YEARS = Map.of(
        "Gipsy Kings (1987)", "1987",
        "Mosaïque", "1989",
        "Este Mundo", "1991",
        "WAYAH", "2009",
        "Arabic Rock", "2009",
        "Single Track", "2024",
        "Khaled (1992)", "1992",
        "Sidi Mansour (2000)", "2000",
        "Thriller", "1982"
    );

    @Bean
    public CommandLineRunner initDatabase(
            MongoTemplate mongoTemplate,
            SongRepository songRepository,
            ArtistProfileRepository artistRepository,
            AlbumProfileRepository albumRepository) {
        return args -> {
            // 1. Ensure core collections exist
            if (!mongoTemplate.collectionExists("songs")) {
                mongoTemplate.createCollection("songs");
            }
            if (!mongoTemplate.collectionExists("artists")) {
                mongoTemplate.createCollection("artists");
            }
            if (!mongoTemplate.collectionExists("albums")) {
                mongoTemplate.createCollection("albums");
            }

            System.out.println(">>> [MongoDB] Core collections verified: songs, artists, albums.");

            // 2. Populate 'artists' and 'albums' from existing songs
            List<Song> songs = songRepository.findAll();
            for (Song song : songs) {
                // Handle Artist
                String artistName = song.getArtist();
                if (artistName != null && !artistName.isBlank()) {
                    String cleanName = artistName.trim();
                    artistRepository.findByNameIgnoreCase(cleanName).ifPresentOrElse(
                        existing -> {
                            // If existing has no avatar but song has cover, use it
                            if ((existing.getAvatarFile() == null || existing.getAvatarFile().isBlank()) && song.getCoverFile() != null) {
                                existing.setAvatarFile(song.getCoverFile());
                                artistRepository.save(existing);
                            }
                        },
                        () -> {
                            String bio = ARTIST_BIOS.getOrDefault(cleanName, "Artiste officiel au catalogue Samma3ni.");
                            ArtistProfile profile = ArtistProfile.builder()
                                .name(cleanName)
                                .bio(bio)
                                .avatarFile(song.getCoverFile())
                                .updatedAt(LocalDateTime.now())
                                .build();
                            artistRepository.save(profile);
                            System.out.println(">>> [MongoDB] Created artist document: " + cleanName);
                        }
                    );
                }

                // Handle Album
                String albumTitle = song.getAlbum();
                if (albumTitle != null && !albumTitle.isBlank()) {
                    String cleanAlbum = albumTitle.trim();
                    albumRepository.findByTitleIgnoreCase(cleanAlbum).ifPresentOrElse(
                        existing -> {
                            if ((existing.getCoverFile() == null || existing.getCoverFile().isBlank()) && song.getCoverFile() != null) {
                                existing.setCoverFile(song.getCoverFile());
                                albumRepository.save(existing);
                            }
                        },
                        () -> {
                            String desc = ALBUM_DESCRIPTIONS.getOrDefault(cleanAlbum, "Album officiel sur la plateforme Samma3ni.");
                            String year = ALBUM_YEARS.getOrDefault(cleanAlbum, "2024");
                            AlbumProfile profile = AlbumProfile.builder()
                                .title(cleanAlbum)
                                .artist(cleanArtistName(song.getArtist()))
                                .releaseYear(year)
                                .description(desc)
                                .coverFile(song.getCoverFile())
                                .updatedAt(LocalDateTime.now())
                                .build();
                            albumRepository.save(profile);
                            System.out.println(">>> [MongoDB] Created album document: " + cleanAlbum);
                        }
                    );
                }
            }

            System.out.printf(">>> [MongoDB] Total in database: %d songs, %d artists, %d albums.%n",
                songRepository.count(), artistRepository.count(), albumRepository.count());
        };
    }

    private String cleanArtistName(String artist) {
        return (artist != null && !artist.isBlank()) ? artist.trim() : "Artiste Samma3ni";
    }
}
