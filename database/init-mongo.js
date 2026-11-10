// Samma3ni - MongoDB Initialization & Indexes Script
// Usage: mongosh samma3ni database/init-mongo.js

const targetDb = db.getSiblingDB("samma3ni");

["songs", "artists", "albums", "users"].forEach((col) => {
  if (!targetDb.getCollectionNames().includes(col)) {
    targetDb.createCollection(col);
  }
});

// Indexes for search, artist/album browsing and analytics
targetDb.songs.createIndex({ title: 1, artist: 1 });
targetDb.songs.createIndex({ genre: 1 });
targetDb.songs.createIndex({ plays: -1 });
targetDb.artists.createIndex({ name: 1 }, { unique: true });
targetDb.albums.createIndex({ name: 1 });
targetDb.users.createIndex({ email: 1 }, { unique: true });

print("✓ Samma3ni MongoDB database and indexes initialized.");
