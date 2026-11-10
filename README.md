# Samma3ni - Plateforme de Streaming Audio

[![Spring Boot 3](https://img.shields.io/badge/Spring_Boot-3.4.0-6DB33F?logo=springboot&logoColor=white)](https://spring.io/)
[![Java 21](https://img.shields.io/badge/Java-21-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Angular](https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white)](https://angular.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Plateforme de streaming audio développée avec **Spring Boot 3 (Java 21)**, **MongoDB** et **Angular**.

---

## Fonctionnalités Principales

### Expérience Audio & Streaming
- **Streaming HTTP Range (Code `206 Partial Content`)** : lecture progressive et navigation instantanée dans la piste sans téléchargement complet préalable (`RangeResource`).
- **Lecteur Audio Persistant** : contrôles Lecture/Pause, Suivant/Précédent, boucle, aléatoire (`Shuffle`), volume, file d'attente dynamique et barre de progression.
- **Égaliseur & Thème Sombre** : vue grille / liste et filtrage par genre en temps réel.
- **Suivi des Écoutes** : compteur de streams mis à jour en temps réel dans MongoDB.

### Interface d'Administration (Samma3ni Studio)
- **Accès Sécurisé par JWT** : route dédiée (`/studio`) et authentification par rôle `ADMIN`.
- **Tableau de Bord & Analytiques** : nombre total de pistes, statistiques d'écoutes, gestion des utilisateurs, artistes et albums.
- **Gestion du Catalogue** : upload multipart (fichier audio + pochette + métadonnées), édition et suppression.

---

## Guide de Démarrage Rapide

### Prérequis
- **Java 21+** & **Maven 3.9+**
- **Node.js 20+** & **npm**
- **MongoDB** en local sur le port `27017` *(ou via Docker Compose)*

### 0. Configuration (Optionnel)
```bash
cp .env.example .env
```

### 1. Démarrer avec Docker Compose (Recommandé)
```bash
docker-compose up --build
```

### 2. Démarrer en local (Développement)

**Backend (Spring Boot 3) :**
```bash
cd backend
mvn spring-boot:run
```
L'API démarre sur `http://localhost:8085` (ou `8080` selon `SERVER_PORT`).

**Frontend (Angular) :**
```bash
cd frontend
npm install
npm start
```
Application accessible sur `http://localhost:4200`.

### 3. Endpoints Principaux
- `GET /api/songs` - Liste des pistes audio
- `GET /api/songs/search?q={query}` - Recherche instantanée
- `GET /api/songs/{id}/stream` - Flux audio avec support `Range` (HTTP 206)
- `GET /api/songs/{id}/cover` - Pochette de l'album
- `POST /api/songs/{id}/play` - Incrément du compteur d'écoutes
- `POST /api/auth/login` - Authentification JWT
- `POST /api/songs/upload` - Upload administrateur (Multipart)

---

## Structure du Projet

```
Samma3ni/
├── backend/
│   ├── src/main/java/com/samma3ni/
│   │   ├── config/          # SecurityConfig, JwtAuthFilter, DataInitializer
│   │   ├── controller/      # SongController, AuthController, Artist/Album, RangeResource
│   │   ├── model/           # Song, ArtistProfile, AlbumProfile, User
│   │   ├── repository/      # Repositories Spring Data MongoDB
│   │   └── service/         # SongService, JwtService, EmailService, SmsService
│   ├── src/main/resources/  # application.properties
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── src/app/
│   │   ├── components/      # Sidebar, Header, SongCard, PlayerBar, Modals, Toast
│   │   ├── pages/           # Home, Studio (Admin), Artist, Album, Liked
│   │   ├── models/          # song.model.ts, auth.model.ts
│   │   └── services/        # SongService, AudioPlayerService, AuthService...
│   ├── Dockerfile
│   └── package.json
│
├── database/                # Script d'initialisation & indexation MongoDB
├── docker-compose.yml
├── .env.example
├── LICENSE
└── README.md
```

---

## Licence

Distribué sous licence **MIT** - voir le fichier [LICENSE](LICENSE).
