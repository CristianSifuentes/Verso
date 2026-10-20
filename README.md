<div align="center">

```
██╗   ██╗███████╗██████╗ ███████╗ ██████╗ 
██║   ██║██╔════╝██╔══██╗██╔════╝██╔═══██╗
██║   ██║█████╗  ██████╔╝███████╗██║   ██║
╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██║   ██║
 ╚████╔╝ ███████╗██║  ██║███████║╚██████╔╝
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ 
```

### *A full-stack music streaming platform — crafted with Angular & the MEAN stack*

---

![Angular](https://img.shields.io/badge/Angular-4.x-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-3.x-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## Table of Contents

| # | Section |
|---|---------|
| 1 | [Project Overview](#1-project-overview) |
| 2 | [Architecture Diagram](#2-architecture-diagram) |
| 3 | [Tech Stack](#3-tech-stack) |
| 4 | [Repository Structure](#4-repository-structure) |
| 5 | [Frontend — Angular Client](#5-frontend--angular-client) |
| 6 | [Component Hierarchy](#6-component-hierarchy) |
| 7 | [Data Models](#7-data-models) |
| 8 | [Services Layer](#8-services-layer) |
| 9 | [Routing Configuration](#9-routing-configuration) |
| 10 | [State & Session Management](#10-state--session-management) |
| 11 | [Backend — Node.js / Express API](#11-backend--nodejs--express-api) |
| 12 | [MongoDB Schemas](#12-mongodb-schemas) |
| 13 | [REST API Reference](#13-rest-api-reference) |
| 14 | [Authentication & Authorization](#14-authentication--authorization) |
| 15 | [File Upload System](#15-file-upload-system) |
| 16 | [Styling System](#16-styling-system) |
| 17 | [Getting Started](#17-getting-started) |
| 18 | [Environment Configuration](#18-environment-configuration) |
| 19 | [Author](#19-author) |

---

## 1. Project Overview

**Verso** is a full-stack music streaming application built on the **MEAN stack** — MongoDB, Express, Angular, and Node.js. It enables users to browse artists, explore album catalogs, and stream songs through an integrated HTML5 audio player, all within a dark-themed, responsive single-page application.

The platform implements a **two-tier role system** (`ROLE_ADMIN` / `ROLE_USER`), where administrators manage the entire music catalog while standard users enjoy a polished read-only streaming experience. Every interaction is secured by **JWT-based authentication** with a 30-day token lifetime.

```
┌─────────────────────────────────────────────────────────┐
│  WHAT VERSO DELIVERS                                     │
│                                                          │
│  ♪  Stream music via embedded HTML5 audio player         │
│  ♬  Browse artists, albums, and song catalogs            │
│  ✦  Secure JWT authentication with role-based access     │
│  ▲  Image uploads for artists, albums & user profiles    │
│  ≡  Paginated artist listing (4 items/page)              │
│  ◉  User profile management with avatar upload           │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Architecture Diagram

```
╔══════════════════════════════════════════════════════════════════╗
║                        VERSO ARCHITECTURE                        ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   ┌─────────────────────────────────────────────────────────┐    ║
║   │              BROWSER  (Angular 4 SPA)                   │    ║
║   │                                                         │    ║
║   │  ┌──────────────────────────────────────────────────┐   │    ║
║   │  │  AppComponent  (Auth Gate + Navigation Sidebar)  │   │    ║
║   │  └────────────────────┬─────────────────────────────┘   │    ║
║   │                       │ Angular Router                  │    ║
║   │  ┌──────────┐ ┌───────┴───────┐ ┌─────────────────┐     │    ║
║   │  │  Artist  │ │     Album     │ │      Song       │     │    ║
║   │  │  CRUD    │ │     CRUD      │ │   CRUD + Play   │     │    ║
║   │  └──────────┘ └───────────────┘ └────────┬────────┘     │    ║
║   │                                           │             │    ║
║   │  ┌────────────────────────────────────────▼─────────┐   │    ║
║   │  │         PlayerComponent  (HTML5 Audio)           │   │    ║
║   │  └──────────────────────────────────────────────────┘   │    ║
║   │                                                         │    ║
║   │         Angular Services  ─>  HTTP calls + JWT          │    ║
║   └─────────────────────────┬───────────────────────────────┘    ║
║                             │  REST over HTTP                    ║
║                             │  Authorization: <token>            ║
║   ┌─────────────────────────▼───────────────────────────────┐    ║
║   │              NODE.JS / EXPRESS  (port 3979)             │    ║
║   │                                                         │    ║
║   │  ┌──────────────┐  ┌────────────────────────────────┐   │    ║
║   │  │   Routers    │  │   ensureAuth() Middleware      │   │    ║
║   │  │  /api/...    │->│   JWT decode & role check      │   │    ║
║   │  └──────┬───────┘  └────────────────────────────────┘   │    ║
║   │         │                                               │    ║
║   │  ┌──────▼───────────────────────────────────────────┐   │    ║
║   │  │   Controllers  (user · artist · album · song)    │   │    ║
║   │  └──────┬───────────────────────────────────────────┘   │    ║
║   │         │ Mongoose ODM                                  │    ║
║   └─────────┼───────────────────────────────────────────────┘    ║
║             │                                                    ║
║   ┌─────────▼───────────────────────────────────────────────┐    ║
║   │                    MONGODB                              │    ║
║   │            Database: curso_mean2                        │    ║
║   │   Collections: users · artists · albums · songs         │    ║
║   └─────────────────────────────────────────────────────────┘    ║
║                                                                  ║
║   ┌─────────────────────────────────────────────────────────┐    ║
║   │                  FILE SYSTEM (uploads/)                 │    ║
║   │         users/   artists/   album/   song/              │    ║
║   └─────────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 3. Tech Stack

### Frontend

| Technology | Version | Role |
|---|---|---|
| **Angular** | 4.x | SPA framework |
| **TypeScript** | ~2.3.3 | Language |
| **RxJS** | ^5.1.0 | Reactive streams |
| **Zone.js** | ^0.8.4 | Change detection |
| **Bootstrap** | 3.x (local) | UI framework |
| **jQuery** | 1.12.4 | Bootstrap DOM support |
| **Angular CLI** | 1.1.3 | Build toolchain |

### Backend

| Technology | Version | Role |
|---|---|---|
| **Node.js** | LTS | Runtime |
| **Express** | ^4.15.2 | HTTP framework |
| **Mongoose** | ^4.9.6 | MongoDB ODM |
| **mongoose-pagination** | ^1.0.0 | Paginated queries |
| **jwt-simple** | ^0.5.1 | JWT generation & decoding |
| **bcrypt-nodejs** | 0.0.3 | Password hashing |
| **connect-multiparty** | ^2.0.0 | Multipart file uploads |
| **moment** | ^2.18.1 | Date/time utilities |
| **body-parser** | ^1.17.1 | Request body parsing |
| **nodemon** | ^1.11.0 | Dev auto-reload |

---

## 4. Repository Structure

```
Verso/
│
├── client/                          # Angular 4 SPA
│   ├── .angular-cli.json            # Angular CLI config (prefix: app)
│   ├── tsconfig.json                # TypeScript -> ES5 compilation
│   ├── tslint.json                  # Code quality rules
│   ├── package.json                 # Frontend dependencies
│   │
│   └── src/
│       ├── index.html               # SPA shell
│       ├── main.ts                  # Bootstrap entry point
│       ├── polyfills.ts             # Browser polyfills
│       ├── styles.css               # Root stylesheet
│       │
│       ├── environments/
│       │   ├── environment.ts       # development flag
│       │   └── environment.prod.ts  # production flag
│       │
│       └── app/
│           ├── app.module.ts        # Root NgModule (declarations, imports)
│           ├── app.component.ts     # Root component — auth & navigation
│           ├── app.component.html   # Login/register forms + sidebar
│           ├── app.routing.ts       # Route definitions (12 routes)
│           │
│           ├── models/              # TypeScript interfaces
│           │   ├── artist.ts
│           │   ├── album.ts
│           │   ├── song.ts
│           │   └── user.ts
│           │
│           ├── services/            # HTTP + utility services
│           │   ├── global.ts        # API base URL config
│           │   ├── user.service.ts
│           │   ├── artist.service.ts
│           │   ├── album.service.ts
│           │   ├── song.service.ts
│           │   └── upload.service.ts
│           │
│           ├── components/          # Feature components (13 total)
│           │   ├── home/
│           │   ├── artist-list/
│           │   ├── artist-add/
│           │   ├── artist-edit/
│           │   ├── artist-detail/
│           │   ├── album-add/
│           │   ├── album-edit/
│           │   ├── album-detail/
│           │   ├── song-add/
│           │   ├── song-edit/
│           │   ├── player/
│           │   └── user-edit/
│           │
│           └── assets/
│               ├── bootstrap/       # Bootstrap 3 CSS + JS
│               ├── css/styles.css   # Dark-theme custom styles (~250 lines)
│               └── js/jquery-1.12.4.min.js
│
└── api/                             # Node.js / Express REST API
    ├── index.js                     # Server entry + MongoDB connection
    ├── app.js                       # Express app, CORS, middleware config
    ├── package.json                 # Backend dependencies
    │
    ├── controllers/
    │   ├── user.js
    │   ├── artist.js
    │   ├── album.js
    │   └── song.js
    │
    ├── models/
    │   ├── user.js
    │   ├── artists.js
    │   ├── album.js
    │   └── song.js
    │
    ├── routers/
    │   ├── user.js
    │   ├── artists.js
    │   ├── album.js
    │   └── songs.js
    │
    ├── middlewares/
    │   └── authenticated.js         # JWT guard middleware
    │
    ├── services/
    │   └── jwt.js                   # Token generation helper
    │
    └── uploads/                     # Static file storage
        ├── users/
        ├── artists/
        ├── album/
        └── song/
```

---

## 5. Frontend — Angular Client

### NgModule Bootstrap

`AppModule` is the root module. It imports Angular's `HttpModule`, `FormsModule`, `RouterModule` (via `app.routing.ts`), and declares all 13 feature components. The `AppComponent` acts as both the authentication gate and the persistent navigation shell.

### AppComponent — Auth Gate & Navigation Shell

```typescript
// app.component.ts — simplified flow
export class AppComponent {
  identity: User;            // hydrated from localStorage on init
  token: string;             // JWT from localStorage
  user: User;                // login form model
  userRegister: User;        // register form model

  ngOnInit() {
    this.identity = this._userService.getIdentity();
    this.token    = this._userService.getToken();
  }

  onSubmitLogin()    { /* signup() -> store identity & token */ }
  onSubmitRegister() { /* register() -> auto-login */           }
  logout()           { /* clear localStorage */                 }
}
```

The root template renders the sidebar navigation when `identity` is truthy, and the login/register panel otherwise — a clean SPA authentication gate pattern.

---

## 6. Component Hierarchy

```
AppComponent  ──────────────────────────────── [Auth Gate + Sidebar Nav]
│
├─ HomeComponent                               [Landing page]
│
├─ ArtistListComponent  (/artistas/:page)      [Paginated grid, 4/page]
│   └─ [delete confirmation overlay per item]
│
├─ ArtistAddComponent   (/crear-artista)       [Form + image upload]
├─ ArtistEditComponent  (/editar-artista/:id)  [Pre-filled form + upload]
│
├─ ArtistDetailComponent  (/artista/:id)       [Artist info + album list]
│   └─ [inline album delete confirmation]
│
├─ AlbumAddComponent  (/crear-album/:artist)   [Linked to artist]
├─ AlbumEditComponent (/editar-album/:id)      [Pre-filled + image upload]
│
├─ AlbumDetailComponent  (/album/:id)          [Album info + song list]
│   ├─ [song delete confirmation overlay]
│   └─ PlayerComponent  (embedded)             [HTML5 audio playback]
│
├─ SongAddComponent  (/crear-tema/:album)      [Metadata + audio upload]
├─ SongEditComponent (/editar-tema/:id)        [Pre-filled + file upload]
│
├─ PlayerComponent   (/player/:id)             [Full-page player view]
│   └─ [reads SOUND_SONG from localStorage]
│
└─ UserEditComponent (/mis-datos)              [Profile form + avatar upload]
```

---

## 7. Data Models

All four TypeScript interfaces mirror the backend Mongoose schemas exactly, ensuring type-safe HTTP transport with zero serialization friction.

```typescript
// models/user.ts
export class User {
  constructor(
    public _id:      string,
    public name:     string,
    public surname:  string,
    public email:    string,
    public password: string,
    public role:     string,   // 'ROLE_ADMIN' | 'ROLE_USER'
    public image:    string
  ) {}
}

// models/artist.ts
export class Artist {
  constructor(
    public _id:         string,
    public name:        string,
    public description: string,
    public image:       string
  ) {}
}

// models/album.ts
export class Album {
  constructor(
    public _id:         string,
    public title:       string,
    public description: string,
    public year:        string,
    public image:       string,
    public artist:      string   // Artist._id reference
  ) {}
}

// models/song.ts
export class Song {
  constructor(
    public _id:      string,
    public number:   string,
    public name:     string,
    public duration: string,
    public file:     string,   // audio filename
    public album:    string    // Album._id reference
  ) {}
}
```

---

## 8. Services Layer

All services follow the same pattern: inject `Http` and `GlobalService`, attach the JWT token in the `Authorization` header, and return typed Observables.

### GlobalService — Single Source of Truth for API Config

```typescript
// services/global.ts
export const Global = {
  url: 'http://localhost:3979/api/'
};
```

### HTTP Pattern (all services)

```typescript
// Shared request-building pattern across all services
getArtists(token: string, page: number): Observable<any> {
  const headers = new Headers({
    'Content-Type':  'application/json',
    'Authorization': token
  });
  return this._http
    .get(`${this.url}obtenerArtistas/${page}`, { headers })
    .map(res => res.json())
    .catch(err => Observable.throw(err));
}
```

### Service API Summary

| Service | Methods | Scope |
|---|---|---|
| **UserService** | `signup`, `register`, `update_user`, `getIdentity`, `getToken` | Auth + profile |
| **ArtistService** | `getArtists(page)`, `getArtist(id)`, `addArtist`, `editArtist`, `deleteArtist` | Artist CRUD |
| **AlbumService** | `getAlbums(artistId)`, `getAlbum(id)`, `addAlbum`, `editAlbum`, `deleteAlbum` | Album CRUD |
| **SongService** | `getSongs(albumId)`, `getSong(id)`, `addSong`, `editSong`, `deleteSong` | Song CRUD |
| **UploadService** | `makeFileRequest(url, params, files, token, name)` | Image & audio uploads |

### UploadService — XHR-based Multipart Upload

```typescript
makeFileRequest(url: string, params: Array<string>, files: Array<File>,
                token: string, name: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    const xhr      = new XMLHttpRequest();

    for (const file of files) formData.append(name, file, file.name);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        xhr.status === 200
          ? resolve(JSON.parse(xhr.response))
          : reject(xhr.response);
      }
    };

    xhr.open('POST', url, true);
    xhr.setRequestHeader('Authorization', token);
    xhr.send(formData);
  });
}
```

---

## 9. Routing Configuration

```typescript
// app.routing.ts — all application routes
const appRoutes: Routes = [
  { path: '',               component: HomeComponent },
  { path: 'artistas/:page', component: ArtistListComponent },
  { path: 'artista/:id',    component: ArtistDetailComponent },

  // Artist management (Admin)
  { path: 'crear-artista',        component: ArtistAddComponent  },
  { path: 'editar-artista/:id',   component: ArtistEditComponent },

  // Album management (Admin)
  { path: 'crear-album/:artist',  component: AlbumAddComponent   },
  { path: 'album/:id',            component: AlbumDetailComponent },
  { path: 'editar-album/:id',     component: AlbumEditComponent  },

  // Song management (Admin)
  { path: 'crear-tema/:album',    component: SongAddComponent    },
  { path: 'editar-tema/:id',      component: SongEditComponent   },

  // Player & User
  { path: 'player/:id',           component: PlayerComponent     },
  { path: 'mis-datos',            component: UserEditComponent   },

  // Fallback
  { path: '**',                   component: ArtistListComponent }
];
```

---

## 10. State & Session Management

Verso uses **browser localStorage** as its client-side state store — a pragmatic choice for an Angular 4 application without NgRx or a dedicated state library.

```
┌─────────────────────────────────────────────────────────────┐
│                    localStorage Keys                        │
├──────────────┬──────────────────────────────────────────────┤
│  identity    │  Serialized User object (name, role, image)  │
│  token       │  JWT string (30-day lifetime)                │
│  SOUND_SONG  │  Serialized Song object for PlayerComponent  │
└──────────────┴──────────────────────────────────────────────┘
```

### Authentication Flow

```
User submits login form
        │
        ▼
UserService.signup(user)           <- POST /loginUsuario
        │ user object returned
        ▼
UserService.signup(user, true)     <- POST /loginUsuario?gethash=true
        │ JWT token returned
        ▼
localStorage.setItem('identity', JSON.stringify(user))
localStorage.setItem('token',    JSON.stringify(token))
        │
        ▼
AppComponent re-renders sidebar navigation
All services read token on each request from localStorage
```

### Song Playback Flow

```
User clicks play on a song in AlbumDetailComponent
        │
        ▼
localStorage.setItem('SOUND_SONG', JSON.stringify(song))
        │
        ▼
Router navigates to /player/:id
        │
        ▼
PlayerComponent.ngOnInit() reads SOUND_SONG
Renders song metadata + album art
HTML5 <audio> streams from /api/obtenerFileCancion/:file
```

---

## 11. Backend — Node.js / Express API

### Server Bootstrap

```javascript
// index.js
const mongoose = require('mongoose');
const app      = require('./app');

mongoose.connect('mongodb://localhost:27017/curso_mean2')
  .then(() => {
    console.log('MongoDB connected: curso_mean2');
    app.listen(3979, () => console.log('API running on :3979'));
  })
  .catch(err => console.log(err));
```

### Express Configuration

```javascript
// app.js — key configuration
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// CORS — open to all origins (development config)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin',  '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Access-Control-Allow-Headers',
    'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Route registration
app.use('/api', userRoutes);
app.use('/api', artistRoutes);
app.use('/api', albumRoutes);
app.use('/api', songRoutes);
```

---

## 12. MongoDB Schemas

### User

```javascript
const UserSchema = new Schema({
  name:     String,
  surname:  String,
  email:    String,
  password: String,   // bcrypt hash
  role:     String,   // 'ROLE_ADMIN' | 'ROLE_USER'
  image:    String    // filename in uploads/users/
});
```

### Artist

```javascript
const ArtistSchema = new Schema({
  name:        String,
  description: String,
  image:       String   // filename in uploads/artists/
});
```

### Album

```javascript
const AlbumSchema = new Schema({
  title:       String,
  description: String,
  year:        Number,
  image:       String,
  artist:      { type: Schema.ObjectId, ref: 'Artist' }  // FK -> Artist
});
```

### Song

```javascript
const SongSchema = new Schema({
  number:   String,
  name:     String,
  duration: String,
  file:     String,                                      // filename in uploads/song/
  album:    { type: Schema.ObjectId, ref: 'Album'  }    // FK -> Album
});
```

---

## 13. REST API Reference

> **Base URL:** `http://localhost:3979/api`
> **Auth header:** `Authorization: <jwt-token>`
> **Admin-only routes** require `role === 'ROLE_ADMIN'` decoded from the JWT payload.

### User Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/loginUsuario` | — | Login. Returns user object. Append `?gethash=true` to receive JWT token instead. |
| `POST` | `/registarUsuario` | — | Register a new user account |
| `PUT` | `/actualizarUsuario/:id` | ✓ | Update user profile (own account only) |
| `POST` | `/actualizarImagenUsuario/:id` | ✓ | Upload or replace user avatar |
| `GET` | `/obtenerImagenUsuario/:imageFile` | — | Serve user avatar image |

### Artist Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/obtenerArtistas/:page?` | ✓ | any | Paginated artist list |
| `GET` | `/obtenerArtista/:id` | ✓ | any | Single artist detail |
| `POST` | `/registarArtista` | ✓ | Admin | Create a new artist |
| `PUT` | `/actualizarArtista/:id` | ✓ | Admin | Update artist metadata |
| `DELETE` | `/eliminarArtista/:id` | ✓ | Admin | Delete artist |
| `POST` | `/actualizarImagenArtista/:id` | ✓ | Admin | Upload artist image |
| `GET` | `/obtenerImagenArtista/:imageFile` | — | — | Serve artist image |

### Album Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/obtenerAlbums/:artist` | ✓ | any | Albums by artist ID |
| `GET` | `/obtenerAlbum/:id` | ✓ | any | Single album detail |
| `POST` | `/registarAlbum` | ✓ | Admin | Create a new album |
| `PUT` | `/actualizarAlbum/:id` | ✓ | Admin | Update album metadata |
| `DELETE` | `/eliminarAlbum/:id` | ✓ | Admin | Delete album |
| `POST` | `/actualizarImagenAlbum/:id` | ✓ | Admin | Upload album artwork |
| `GET` | `/obtenerImagenAlbum/:imageFile` | — | — | Serve album artwork |

### Song Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/obtenerCanciones/:album?` | ✓ | any | Songs by album ID |
| `GET` | `/obtenerCancion/:id` | ✓ | any | Single song metadata |
| `POST` | `/registarCancion` | ✓ | Admin | Create a new song |
| `PUT` | `/actualizarCancion/:id` | ✓ | Admin | Update song metadata |
| `DELETE` | `/eliminarCancion/:id` | ✓ | Admin | Delete song |
| `POST` | `/actualizarFileCancion/:id` | ✓ | Admin | Upload audio file |
| `GET` | `/obtenerFileCancion/:songFile` | — | — | Stream audio file |

---

## 14. Authentication & Authorization

### JWT Token Structure

```javascript
// services/jwt.js
const payload = {
  sub:     user._id,
  name:    user.name,
  surname: user.surname,
  email:   user.email,
  role:    user.role,
  image:   user.image,
  iat:     moment().unix(),
  exp:     moment().add(30, 'days').unix()   // 30-day lifetime
};

return jwt.encode(payload, 'clave_secreta_curso');
```

### Authentication Middleware

```javascript
// middlewares/authenticated.js
exports.ensureAuth = (req, res, next) => {
  if (!req.headers.authorization)
    return res.status(403).send({ message: 'No authorization header' });

  const token = req.headers.authorization.replace(/['"]+/g, '');
  try {
    const payload = jwt.decode(token, 'clave_secreta_curso');
    if (payload.exp <= moment().unix())
      return res.status(401).send({ message: 'Token expired' });
    req.user = payload;
    next();
  } catch (ex) {
    return res.status(404).send({ message: 'Invalid token' });
  }
};
```

### Role Matrix

```
┌─────────────────────────────────────────────────────────┐
│                     ROLE MATRIX                         │
├────────────────────────┬────────────┬───────────────────┤
│ Action                 │ ROLE_USER  │    ROLE_ADMIN     │
├────────────────────────┼────────────┼───────────────────┤
│ Browse artists/albums  │     ✓      │         ✓         │
│ Stream songs           │     ✓      │         ✓         │
│ Edit own profile       │     ✓      │         ✓         │
│ Create/edit artists    │     ✗      │         ✓         │
│ Create/edit albums     │     ✗      │         ✓         │
│ Create/edit songs      │     ✗      │         ✓         │
│ Delete any entity      │     ✗      │         ✓         │
│ Upload media files     │     ✗      │         ✓         │
└────────────────────────┴────────────┴───────────────────┘
```

---

## 15. File Upload System

Verso handles four distinct binary asset types through a unified upload architecture built on `connect-multiparty` and native `XMLHttpRequest`.

```
┌────────────────────────────────────────────────────────────┐
│                    UPLOAD PIPELINE                         │
│                                                            │
│  Angular Component                                         │
│       │  <input type="file">                               │
│       ▼                                                    │
│  UploadService.makeFileRequest()                           │
│       │  XHR FormData POST + Authorization header          │
│       ▼                                                    │
│  Express Route -> connect-multiparty middleware            │
│       │  Parses multipart body -> req.files                │
│       ▼                                                    │
│  Controller validates extension (png / jpg / gif / mp3)    │
│       │                                                    │
│  ┌────▼─────────────────────────────┐                      │
│  │  fs.rename(tmpPath, destPath)    │                      │
│  │                                  │                      │
│  │  uploads/users/    <- avatars    │                      │
│  │  uploads/artists/  <- art imgs   │                      │
│  │  uploads/album/    <- album art  │                      │
│  │  uploads/song/     <- audio      │                      │
│  └──────────────────────────────────┘                      │
│       │                                                    │
│  Mongoose update: { image: filename } or { file: filename }│
└────────────────────────────────────────────────────────────┘
```

Static assets are served directly by Express via `res.sendFile(filePath)` at `GET /obtener*` endpoints — enabling Angular to load images and stream audio with plain `<img [src]>` and `<audio [src]>` bindings.

---

## 16. Styling System

Verso uses a hand-crafted **dark theme** over Bootstrap 3, delivering a polished music-app aesthetic without a component library.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| Sidebar background | `#1C1C1F` | Navigation sidebar |
| Item background | `#222326` | Artist/album card backgrounds |
| Page background | `#18191B` | Body background |
| Accent / highlight | `#84BD00` | Active states, hover borders, buttons |
| Primary text | `#FFFFFF` | Headings and body copy |
| Muted text | `#888888` | Secondary / placeholder text |

### Layout Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  VIEWPORT                                                        │
│                                                                  │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Sidebar Nav │  │           Content Area                   │ │
│  │  25% width   │  │           75% width (scrollable)         │ │
│  │  fixed left  │  │                                          │ │
│  │  #1C1C1F     │  │   ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │ │
│  │              │  │   │ Card │ │ Card │ │ Card │ │ Card │  │ │
│  │  • Avatar    │  │   │ 23%  │ │ 23%  │ │ 23%  │ │ 23%  │  │ │
│  │  • Nav links │  │   └──────┘ └──────┘ └──────┘ └──────┘  │ │
│  │  • Logout    │  │                                          │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Player Bar  (fixed bottom · 90.5% width · z-index 9999)  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Key CSS Classes

| Class | Description |
|---|---|
| `.actived` | Green left-border indicator for active nav link |
| `.navigation` | Fixed-position sidebar container |
| `#user_logged` | Sidebar user profile / avatar block |
| `.artist-item` | Artist grid card (317px height, hover effect) |
| `.album-item` | Album grid card (300px height) |
| `.song-item` | Song list row with floating action buttons |
| `.player` | Fixed-bottom audio player bar |
| `.seguro-artista` | Artist delete confirmation overlay |
| `.seguro-album` | Album delete confirmation overlay |
| `.seguro-cancion` | Song delete confirmation overlay |

---

## 17. Getting Started

### Prerequisites

```bash
node  >= 6.x
npm   >= 3.x
mongodb >= 3.x    # must be running locally on port 27017
npm install -g @angular/cli@1.1.3
```

### 1 — Clone & Install

```bash
git clone <repo-url>
cd Verso

# Backend
cd api && npm install

# Frontend
cd ../client && npm install
```

### 2 — Start MongoDB

```bash
mongod --dbpath /data/db
# The 'curso_mean2' database is created automatically on first connection
```

### 3 — Start the API

```bash
cd api
npm start
# API running at http://localhost:3979
# MongoDB connected: curso_mean2
```

### 4 — Start the Angular Client

```bash
cd client
ng serve
# App running at http://localhost:4200
```

### 5 — Create an Admin Account

Register through the UI at `http://localhost:4200`, then grant admin rights via the MongoDB shell:

```javascript
use curso_mean2
db.users.updateOne(
  { email: "your@email.com" },
  { $set: { role: "ROLE_ADMIN" } }
)
```

---

## 18. Environment Configuration

| Variable | File | Default Value | Description |
|---|---|---|---|
| API base URL | `client/src/app/services/global.ts` | `http://localhost:3979/api/` | Backend URL for all HTTP calls |
| MongoDB URI | `api/index.js` | `mongodb://localhost:27017/curso_mean2` | Database connection string |
| API port | `api/index.js` | `3979` | Express server port |
| JWT secret | `api/services/jwt.js` | `clave_secreta_curso` | Token signing key |
| JWT lifetime | `api/services/jwt.js` | 30 days | Token expiry duration |
| Upload directory | `api/controllers/*.js` | `./uploads/` | File storage root |

> **Before deploying to production:** rotate the JWT secret, move the API URL into Angular's `environment.prod.ts`, restrict CORS to your domain, and point MongoDB to a secured Atlas cluster.

---

## 19. Author

<div align="center">

**Cristian Sifuentes Covarrubia**

*MEAN Stack Developer*

---

*Built with Angular 4 · Node.js · Express · MongoDB*
*Dark-themed UI crafted with Bootstrap 3 and custom CSS*

</div>

---

<div align="center">

```
──────────────────────────────────────────────────────────
  crafted with precision  ·  designed with purpose
──────────────────────────────────────────────────────────
```

</div>
