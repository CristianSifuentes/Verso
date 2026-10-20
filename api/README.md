# Verso API

REST API for the Verso music player application. Built with Node.js, Express, and MongoDB (MEAN stack).

## Tech Stack

| Technology | Version |
|---|---|
| Node.js | 8.x – 10.x (recommended) |
| Express | 4.x |
| MongoDB | 3.x – 4.x |
| Mongoose | 4.9.6 |
| JWT (jwt-simple) | 0.5.1 |
| bcrypt-nodejs | 0.0.3 |
| nodemon | 1.11.0 (dev) |

> **Node.js version note:** `bcrypt-nodejs` has native bindings compiled at install time. Use Node.js 8 or 10 via [nvm](https://github.com/nvm-sh/nvm) to avoid build errors. Node.js 12+ may require replacing `bcrypt-nodejs` with `bcryptjs`.

## Prerequisites

- **Node.js** 8.x or 10.x
- **npm** 5.x+
- **MongoDB** 3.x or 4.x running locally on the default port `27017`
- **nodemon** (installed as a dev dependency)

### Start MongoDB

```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Direct launch
mongod --dbpath /data/db
```

## Installation

```bash
# 1. Navigate to the api directory
cd api

# 2. Install dependencies
npm install

# 3. Create the upload directories required by the file upload middleware
mkdir -p uploads/users uploads/artists uploads/album uploads/song
```

## Running the API

```bash
# Development (with auto-reload via nodemon)
npm start

# Production
node index.js
```

The server starts on **http://localhost:3979** by default.

You can override the port with the environment variable:

```bash
PORT=4000 npm start
```

> **Note:** The codebase reads `process.env.port` (lowercase). Set the variable accordingly or update `index.js` to use `process.env.PORT`.

## Database

- **Connection:** `mongodb://localhost:27017/curso_mean2`
- **Database name:** `curso_mean2`

MongoDB is created automatically by Mongoose on first connection — no manual setup needed beyond having the daemon running.

## Known Issues

### File upload path parsing (macOS / Linux)
The upload controllers (`controllers/user.js`, `controllers/artist.js`, `controllers/album.js`, `controllers/song.js`) split the uploaded file path using `file_path.split('\\')`, which is the Windows path separator. On macOS/Linux the path separator is `/`, so image/file uploads will silently fail (the parsed filename will be `undefined`).

**Fix:** Replace every occurrence of:

```js
var file_split = file_path.split('\\');
var file_name = file_split[2];
```

with:

```js
var file_name = path.basename(file_path);
```

`path` is already imported in each controller (`var path = require('path')`).

### JWT secret is hardcoded
The JWT signing secret `clave_secreta_curso` is hardcoded in both `services/jwt.js` and `middlewares/authenticated.js`. For any environment beyond local development, move it to an environment variable.

## API Endpoints

All authenticated routes require the `Authorization` header with a valid JWT token obtained from the login endpoint.

### Users

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/registarUsuario` | No | Register a new user |
| POST | `/api/loginUsuario` | No | Login and obtain JWT token |
| PUT | `/api/actualizarUsuario/:id` | Yes | Update user data |
| POST | `/api/actualizarImagenUsuario/:id` | Yes | Upload user profile image |
| GET | `/api/obtenerImagenUsuario/:imageFile` | No | Serve user image file |

**Login response** — send `gethash: true` in the request body to receive a JWT token:

```json
POST /api/loginUsuario
{ "email": "user@example.com", "password": "secret", "gethash": true }
```

### Artists

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/obtenerArtistas/:page?` | Yes | List artists (paginated, 4 per page) |
| GET | `/api/obtenerArtista/:id` | Yes | Get a single artist |
| POST | `/api/registarArtista` | Yes | Create an artist |
| PUT | `/api/actualizarArtista/:id` | Yes | Update an artist |
| DELETE | `/api/eliminarArtista/:id` | Yes | Delete an artist and its albums/songs |
| POST | `/api/actualizarImagenArtista/:id` | Yes | Upload artist image |
| GET | `/api/obtenerImagenArtista/:imageFile` | No | Serve artist image |

### Albums

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/obtenerAlbums/:artist` | Yes | Get albums for an artist |
| GET | `/api/obtenerAlbum/:id` | Yes | Get a single album |
| POST | `/api/registarAlbum` | Yes | Create an album |
| PUT | `/api/actualizarAlbum/:id` | Yes | Update an album |
| DELETE | `/api/eliminarAlbum/:id` | Yes | Delete an album |
| POST | `/api/actualizarImagenAlbum/:id` | Yes | Upload album cover image |
| GET | `/api/obtenerImagenAlbum/:imageFile` | No | Serve album image |

### Songs

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/obtenerCanciones/:album?` | Yes | Get songs for an album |
| GET | `/api/obtenerCancion/:id` | Yes | Get a single song |
| POST | `/api/registarCancion` | Yes | Create a song |
| PUT | `/api/actualizarCancion/:id` | Yes | Update a song |
| DELETE | `/api/eliminarCancion/:id` | Yes | Delete a song |
| POST | `/api/actualizarFileCancion/:id` | Yes | Upload audio file for a song |
| GET | `/api/obtenerFileCancion/:songFile` | No | Stream/serve song audio file |

## Project Structure

```
api/
├── index.js              # Entry point — DB connection and server boot
├── app.js                # Express app, middleware, and route registration
├── controllers/
│   ├── user.js           # User CRUD and image upload
│   ├── artist.js         # Artist CRUD, image upload, cascade delete
│   ├── album.js          # Album CRUD and cover image upload
│   └── song.js           # Song CRUD and audio file upload
├── models/
│   ├── user.js           # Mongoose User schema
│   ├── artists.js        # Mongoose Artist schema
│   ├── album.js          # Mongoose Album schema (ref: Artists)
│   └── song.js           # Mongoose Song schema (ref: Albums)
├── routers/
│   ├── user.js           # User routes
│   ├── artists.js        # Artist routes
│   ├── album.js          # Album routes
│   └── songs.js          # Song routes
├── middlewares/
│   └── authenticated.js  # JWT verification middleware
├── services/
│   └── jwt.js            # JWT token creation
└── uploads/              # Created manually — not tracked by git
    ├── users/
    ├── artists/
    ├── album/
    └── song/
```
