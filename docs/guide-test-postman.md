# Guide de test Postman — API Music App

Base URL : `http://localhost:3000`

## Légende

- 🔓 Public — aucun token requis
- 🔒 Connecté — header `Authorization: Bearer <accessToken>` requis
- 👑 Admin — connecté + `role: ADMIN`
- 🎤 Artiste/Admin — connecté + `role: ARTIST` ou `ADMIN`
- 👤 Propriétaire — connecté + doit être le créateur de la ressource (ou admin)

**Rappel body JSON sur Postman** : onglet **Body** → `raw` → type `JSON` (sauf pour l'upload de track qui utilise `form-data`).

---

## 1. AUTH (`/auth`)

### 🔓 Register
```
POST /auth/register
```
```json
{
  "name": "Nathan",
  "email": "nathan@example.com",
  "passwordHash": "motdepasse123"
}
```
✅ Renvoie l'utilisateur créé (sans mot de passe).
❌ Testez avec un email déjà utilisé → `400 Bad Request`.

### 🔓 Login
```
POST /auth/login
```
```json
{
  "email": "nathan@example.com",
  "passwordHash": "motdepasse123"
}
```
✅ Renvoie `{ user, accessToken, refreshToken }`.
**Copiez `accessToken` et `refreshToken`** pour la suite des tests.
❌ Mauvais mot de passe → `401 Unauthorized`.

### 🔓 Refresh
```
POST /auth/refresh
```
```json
{
  "refreshToken": "COLLEZ_LE_REFRESH_TOKEN"
}
```
✅ Renvoie une nouvelle paire de tokens (l'ancien refreshToken devient invalide — rotation).
❌ Réutiliser un ancien refreshToken déjà consommé → `401 Unauthorized`.

### 🔓 Logout
```
POST /auth/logout
```
```json
{
  "refreshToken": "COLLEZ_LE_REFRESH_TOKEN"
}
```
✅ Révoque tous les refresh tokens actifs de l'utilisateur.

### 🔒 Profil connecté
```
GET /auth/me
```
Header : `Authorization: Bearer <accessToken>`
✅ Renvoie les infos de l'utilisateur connecté.
❌ Sans token → `401 Unauthorized`.

---

## 2. USERS (`/users`)

### 🔒 Mon profil
```
GET /users/me
```

### 🔒 Modifier mon profil
```
PATCH /users/me
```
```json
{ "name": "Nouveau nom" }
```

### 🔒 Mes préférences
```
GET /users/me/preferences
```
✅ Crée des préférences par défaut si aucune n'existe encore (`theme: dark`, `defaultVolume: 80`).

### 🔒 Modifier mes préférences
```
PATCH /users/me/preferences
```
```json
{ "theme": "light", "defaultVolume": 60 }
```

### 👑 Lister tous les utilisateurs
```
GET /users
```
❌ Avec un token `USER` normal → `403 Forbidden`.

### 👑 Changer le rôle d'un utilisateur
```
PATCH /users/:id/role
```
```json
{ "role": "ADMIN" }
```
⚠️ `:id` est l'`id` numérique (Int) de l'utilisateur.

---

## 3. GENRES (`/genres`)

### 🔓 Lister les genres
```
GET /genres
```

### 🔓 Détail d'un genre
```
GET /genres/:id
```
⚠️ `:id` est un UUID (string), pas un nombre.

### 👑 Créer un genre
```
POST /genres
```
```json
{ "name": "Afrobeat" }
```

### 👑 Modifier un genre
```
PATCH /genres/:id
```
```json
{ "name": "Afrobeats" }
```

### 👑 Supprimer un genre
```
DELETE /genres/:id
```

---

## 4. ARTISTS (`/artists`)

### 🔓 Lister les artistes
```
GET /artists
```

### 🔓 Détail d'un artiste
```
GET /artists/:id
```

### 👑 Créer un artiste
```
POST /artists
```
```json
{ "name": "Burna Boy", "bio": "Artiste afrobeat nigérian" }
```

### 👑 Modifier un artiste
```
PATCH /artists/:id
```

### 👑 Supprimer un artiste
```
DELETE /artists/:id
```

---

## 5. ALBUMS (`/albums`)

### 🔓 Lister les albums
```
GET /albums
```

### 🔓 Filtrer par artiste
```
GET /albums?artistId=UUID_DE_L_ARTISTE
```

### 🔓 Détail d'un album
```
GET /albums/:id
```

### 👑 Créer un album
```
POST /albums
```
```json
{
  "title": "Love, Damini",
  "releaseYear": 2022,
  "coverUrl": "https://exemple.com/cover.jpg",
  "artistId": "UUID_DE_L_ARTISTE"
}
```
❌ `artistId` inexistant → `404 Not Found`.

### 👑 Modifier un album
```
PATCH /albums/:id
```

### 👑 Supprimer un album
```
DELETE /albums/:id
```

---

## 6. TRACKS (`/tracks`)

### 🔓 Lister les morceaux
```
GET /tracks
```

### 🔓 Détail d'un morceau
```
GET /tracks/:id
```

### 🎤 Créer un morceau (upload de fichier)
```
POST /tracks
```
Onglet **Body** → `form-data` (⚠️ pas `raw`) :

| Key | Type | Valeur |
|---|---|---|
| `title` | Text | Last Last |
| `durationSeconds` | Text | 210 |
| `artistId` | Text | UUID_DE_L_ARTISTE |
| `albumId` | Text | UUID_DE_L_ALBUM (optionnel) |
| `genreId` | Text | UUID_DU_GENRE |
| `file` | **File** | sélectionnez un .mp3/.wav/.m4a/.mp4 |

❌ Fichier > 20 Mo → erreur taille.
❌ Format non supporté → `400 Bad Request`.
❌ `artistId`/`albumId`/`genreId` inexistant → `404 Not Found`.

### 🎤 Modifier un morceau
```
PATCH /tracks/:id
```
```json
{ "title": "Nouveau titre" }
```

### 👑 Supprimer un morceau
```
DELETE /tracks/:id
```

### 🔒 Incrémenter le compteur d'écoutes
```
POST /tracks/:id/play
```
✅ N'importe quel utilisateur connecté peut déclencher ça.

---

## 7. PLAYLISTS (`/playlists`)

### 🔒 Créer une playlist
```
POST /playlists
```
```json
{ "name": "Mes favoris", "isPublic": false }
```

### 🔓 Lister les playlists
```
GET /playlists
```
- Sans token → seulement les playlists publiques
- Avec token → publiques + les vôtres (même privées)

### 🔓 Détail d'une playlist
```
GET /playlists/:id
```
❌ Playlist privée d'un autre utilisateur → `403 Forbidden`.

### 👤 Modifier une playlist
```
PATCH /playlists/:id
```
```json
{ "name": "Nouveau nom", "isPublic": true }
```
❌ Playlist d'un autre utilisateur (non admin) → `403 Forbidden`.

### 👤 Supprimer une playlist
```
DELETE /playlists/:id
```

### 👤 Ajouter un morceau
```
POST /playlists/:id/tracks
```
```json
{ "trackId": "UUID_DU_TRACK" }
```
❌ Morceau déjà présent → `400 Bad Request`.

### 👤 Retirer un morceau
```
DELETE /playlists/:id/tracks/:trackId
```

### 👤 Réorganiser la playlist
```
PATCH /playlists/:id/reorder
```
```json
{ "fromPos": 2, "toPos": 0 }
```

---

## 8. PLAYER (`/player`)

Toutes les routes sont 🔒 (connecté), et agissent uniquement sur **votre propre** player.

### État du player
```
GET /player
```
✅ Crée automatiquement le player s'il n'existe pas encore.

### Démarrer/reprendre la lecture
```
POST /player/play
```
```json
{ "trackId": "UUID_DU_TRACK" }
```
Ou sans `trackId` pour reprendre le morceau en cours :
```json
{}
```
❌ Aucun morceau en cours et pas de `trackId` → `400 Bad Request`.

### Pause
```
POST /player/pause
```

### Morceau suivant
```
POST /player/next
```
⚠️ Nécessite des morceaux dans la queue (voir section Queue). Sans queue remplie → `404 Not Found`.

### Morceau précédent
```
POST /player/previous
```

### Volume
```
PATCH /player/volume
```
```json
{ "volume": 75 }
```

### Se positionner dans le morceau
```
PATCH /player/seek
```
```json
{ "positionSeconds": 45 }
```

### Mode répétition
```
PATCH /player/repeat-mode
```
```json
{ "repeatMode": "all" }
```
Valeurs possibles : `"none"`, `"one"`, `"all"`.

### Shuffle
```
PATCH /player/shuffle
```
```json
{ "shuffle": true }
```

---

## 9. QUEUE (`/queue`)

Toutes les routes sont 🔒 (connecté), sur **votre propre** queue.

### Voir la file d'attente
```
GET /queue
```

### Ajouter un morceau à la file
```
POST /queue/tracks
```
```json
{ "trackId": "UUID_DU_TRACK" }
```
Répétez pour ajouter plusieurs morceaux (l'ordre = ordre d'ajout).

### Retirer un morceau précis
```
DELETE /queue/tracks/:trackId
```

### Mélanger la file
```
POST /queue/shuffle
```

### Vider la file
```
DELETE /queue
```

---

## 10. SEARCH (`/search`)

Toutes les routes sont 🔓 publiques.

### Recherche globale
```
GET /search?q=love
```
✅ Renvoie `{ tracks, artists, genres }` combinés.

### Recherche par titre de morceau
```
GET /search/tracks?q=love
```

### Recherche par artiste
```
GET /search/artists?q=drake
```

### Recherche par genre
```
GET /search/genres?q=rock
```
❌ `q` absent ou vide → `400 Bad Request`.

---

## Scénario de test de bout en bout recommandé

1. `POST /auth/register` → créer un compte
2. Passer ce compte en `ADMIN` manuellement via `npx prisma studio` (table `User`, champ `role`)
3. `POST /auth/login` → récupérer `accessToken`
4. `POST /genres` → créer un genre
5. `POST /artists` → créer un artiste
6. `POST /albums` → créer un album (avec l'`artistId`)
7. `POST /tracks` (form-data + fichier) → créer un morceau
8. `POST /playlists` → créer une playlist
9. `POST /playlists/:id/tracks` → y ajouter le morceau
10. `POST /queue/tracks` → ajouter le morceau à la queue
11. `POST /player/play` avec le `trackId` → démarrer la lecture
12. `POST /player/next` → tester la navigation dans la queue
13. `GET /search?q=...` → vérifier que le morceau/artiste/genre remonte bien

---

## Rappels utiles

- Les ID de `User` sont des **entiers** (`Int`), tous les autres (`Artist`, `Album`, `Genre`, `Track`, `Playlist`) sont des **UUID** (`string`).
- Un `accessToken` expire après **15 minutes** — utilisez `/auth/refresh` pour en obtenir un nouveau sans se reconnecter.
- Pour créer facilement un `ADMIN` de test, modifiez directement le champ `role` dans `npx prisma studio` après inscription.