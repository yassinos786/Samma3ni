# Base de Données - MongoDB (`samma3ni`)

Ce répertoire contient le script d'initialisation des collections et index MongoDB pour la plateforme **Samma3ni**.

## Collections

| Collection | Description |
| :--- | :--- |
| `songs` | Catalogue des pistes audio (titre, artiste, album, genre, chemin audio, pochette, compteur `plays`) |
| `artists` | Profils des artistes et biographies |
| `albums` | Regroupements d'albums et métadonnées associées |
| `users` | Comptes utilisateurs et rôles (authentification JWT / OAuth) |

## Exécution manuelle

```bash
mongosh samma3ni database/init-mongo.js
```
