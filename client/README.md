# Verso Client

Angular 4 single-page application for the Verso music player. Consumes the Verso REST API to manage artists, albums, songs, and user accounts.

## Tech Stack

| Technology | Version |
|---|---|
| Angular | 4.x |
| Angular CLI | 1.1.3 |
| TypeScript | ~2.3.3 |
| RxJS | 5.x |
| Node.js | 6.x – 8.x (required by Angular CLI 1.x) |
| npm | 3.x – 5.x |

> **Node.js version note:** Angular CLI 1.1.3 does not support Node.js 10+. Use Node.js 6 or 8 via [nvm](https://github.com/nvm-sh/nvm). Running `nvm use 8` before installing is the safest approach.

## Prerequisites

- **Node.js** 6.x or 8.x
- **npm** 3.x – 5.x
- **Angular CLI 1.1.3** — installed locally via `node_modules/.bin/ng` after `npm install`
- The **Verso API** running on `http://localhost:3979` (see `api/README.md`)

## Installation

```bash
# 1. Navigate to the client directory
cd client

# 2. Install dependencies (use Node.js 6 or 8)
npm install
```

If `npm install` fails with native module errors, confirm your Node.js version:

```bash
node -v   # should be v6.x or v8.x
```

## Running in Development

```bash
npm start
# or
./node_modules/.bin/ng serve
```

The app will be available at **http://localhost:4200**.

The dev server proxies nothing by default — the Angular services must call the API at `http://localhost:3979` directly. Make sure the API is running before using the app.

Live reload is enabled: the browser refreshes automatically when source files change.

## Build for Production

```bash
npm run build -- --env=prod
# or
./node_modules/.bin/ng build --env=prod
```

Output is placed in `client/dist/`. Serve the contents of `dist/` with any static file server (nginx, Apache, `http-server`, etc.).

## Application Routes

| Path | Component | Description |
|---|---|---|
| `/` | `HomeComponent` | Landing / home page |
| `/artistas/:page` | `ArtistListComponent` | Paginated artist list |
| `/crear-artista` | `ArtistAddComponent` | Add a new artist |
| `/editar-artista/:id` | `ArtistEditComponent` | Edit an artist |
| `/artista/:id` | `ArtistDetailComponent` | Artist detail and album list |
| `/crear-album/:artist` | `AlbumAddComponent` | Add a new album to an artist |
| `/album/:id` | `AlbumDetailComponent` | Album detail and song list |
| `/editar-album/:id` | `AlbumEditComponent` | Edit an album |
| `/mis-datos` | `UserEditComponent` | Edit the logged-in user's profile |
| `/crear-tema/:album` | `SongAddComponent` | Add a song to an album |
| `/editar-tema/:id` | `SongEditComponent` | Edit a song |
| `/player/:id` | `PlayerComponent` | Audio player for a song |
| `**` | `ArtistListComponent` | Fallback — redirects to artist list |

## Project Structure

```
client/
├── .angular-cli.json         # Angular CLI configuration
├── src/
│   ├── index.html            # Root HTML shell
│   ├── main.ts               # Bootstrap entry point
│   ├── styles.css            # Global styles
│   ├── environments/
│   │   ├── environment.ts    # Development environment config
│   │   └── environment.prod.ts
│   ├── assets/
│   │   ├── css/styles.css    # Third-party / legacy CSS
│   │   └── js/jquery-1.12.4.min.js
│   └── app/
│       ├── app.module.ts     # Root NgModule — declares all components
│       ├── app.routing.ts    # Route definitions
│       ├── app.component.*   # Root component (shell)
│       ├── components/       # Feature components
│       │   ├── home.component.*
│       │   ├── user-edit.component.*
│       │   ├── artist-list.component.*
│       │   ├── artist-add.component.*
│       │   ├── artist-edit.component.*
│       │   ├── artist-detail.component.*
│       │   ├── album-add.component.*
│       │   ├── album-edit.component.*
│       │   ├── album-detail.component.*
│       │   ├── song-add.component.*
│       │   ├── song-edit.component.*
│       │   └── player.component.*
│       └── models/
│           └── song.ts       # Song TypeScript model
├── e2e/                      # End-to-end tests (Protractor)
├── karma.conf.js             # Unit test runner config
└── protractor.conf.js        # E2E test runner config
```

## Testing

```bash
# Unit tests (Karma + Jasmine)
npm test

# End-to-end tests (Protractor — requires the dev server to be running)
npm run e2e
```

## Notes

- The app uses `@angular/http` (the legacy HTTP client), not `HttpClient`. All API calls go through `Http` with `Headers` objects.
- Authentication state is expected to be stored in `localStorage` (JWT token) by the service layer.
- The Angular CLI version (1.1.3) is old. Do not run `ng update` — it will break the project. Upgrade to Angular 5+ intentionally if needed, not automatically.

## Links

https://www.youtube.com/watch?v=FgNVWyg8txY