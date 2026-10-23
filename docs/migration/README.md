# Verso — Plan de migración al stack 2026

> **Documento vivo.** Es la referencia única para migrar Verso (antes *Musify*) del stack MEAN de 2017 al stack actual.
> Marca cada casilla (`- [x]`) en el mismo commit que implementa el paso, y registra el avance en
> la [bitácora](#16-bitácora-de-avance) al final.

| Dato | Valor |
|---|---|
| Fecha de elaboración | 2026-10-20 |
| Versiones verificadas contra | registro npm, `nodejs.org/dist/index.json`, notas de versión oficiales |
| Alcance | `api/` (Node + Express + MongoDB), `client/` (Angular) y despliegue en Azure (Fase 7) |
| Nombre del proyecto | **Verso** (antes *Musify*, renombrado el 2026-10-20). Paquetes: `verso-api`, `verso-client` |
| Estado global | 🔴 No iniciado |

**Leyenda de estado** (úsala en la tabla de fases): 🔴 No iniciado · 🟡 En progreso · 🟢 Terminado · ⏸️ Bloqueado

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Versiones: actual → objetivo](#2-versiones-actual--objetivo)
3. [Inventario del proyecto actual](#3-inventario-del-proyecto-actual)
4. [Defectos detectados en el código actual](#4-defectos-detectados-en-el-código-actual)
5. [Estrategia y reglas de la migración](#5-estrategia-y-reglas-de-la-migración)
6. [Arquitectura objetivo](#6-arquitectura-objetivo)
7. [Fase 0 — Preparación y red de seguridad](#fase-0--preparación-y-red-de-seguridad)
8. [Fase 1 — Corrección de defectos críticos (stack actual)](#fase-1--corrección-de-defectos-críticos-stack-actual)
9. [Fase 2 — Refactor de la API a async/await (stack actual)](#fase-2--refactor-de-la-api-a-asyncawait-stack-actual)
10. [Fase 3 — Infraestructura: Node 24 + MongoDB 8 + datos](#fase-3--infraestructura-node-24--mongodb-8--datos)
11. [Fase 4 — API: Mongoose 9, Express 5 y librerías modernas](#fase-4--api-mongoose-9-express-5-y-librerías-modernas)
12. [Fase 5 — Cliente: Angular 22 desde cero y port](#fase-5--cliente-angular-22-desde-cero-y-port)
13. [Fase 6 — Calidad, DevOps y documentación](#fase-6--calidad-devops-y-documentación)
14. [Fase 7 — Despliegue en Azure](#fase-7--despliegue-en-azure)
15. [Apéndices](#15-apéndices) (equivalencias, riesgos, comandos, fuentes)
16. [Bitácora de avance](#16-bitácora-de-avance)

---

## 1. Resumen ejecutivo

Verso está construido sobre versiones de **2017** (Angular 4, Node 8, Mongoose 4, MongoDB ≤ 3.6). Ninguna
recibe parches de seguridad y el proyecto **no se puede instalar** en un Node moderno: Angular CLI 1.1.3 no
arranca en Node ≥ 10.

El tamaño del proyecto hace viable una migración completa:

| Parte | Tamaño |
|---|---|
| API | 4 controladores (~860 líneas), 4 modelos, 4 routers, 1 middleware, 1 servicio JWT, 27 endpoints |
| Cliente | 13 componentes, 5 servicios, 4 modelos, 9 vistas HTML (~1 700 líneas en total), Bootstrap 3 + jQuery |

**Decisiones clave:**

1. **Primero la API, después el cliente.** Solo se hablan por REST. Si el contrato HTTP se mantiene, el cliente
   Angular 4 sigue funcionando contra la API nueva mientras se reescribe el cliente.
2. **La API se migra en sitio y por pasos** (Fases 1 → 4). Cada paso se puede probar.
3. **El cliente se crea desde cero en Angular 22 y se porta** (Fase 5). No se encadenan 18 `ng update`:
   cada salto exige otra versión de Node y de TypeScript, y las migraciones de Protractor, TSLint y Karma se
   hacen a mano. Con 13 componentes, portar sale más barato y el resultado es más limpio.
4. **Los datos de MongoDB se pasan con `mongodump` / `mongorestore`** a un MongoDB 8.0 en Docker. Así no hay
   que actualizar el servidor por cada versión intermedia (3.6 → 4.0 → 4.2 → … → 8.0).

### Tablero de fases

| Fase | Descripción | Riesgo | Esfuerzo estimado | Estado |
|---|---|---|---|---|
| 0 | Preparación, respaldo, pruebas de humo | Bajo | 0.5–1 día | 🔴 |
| 1 | Corrección de defectos críticos | Bajo | 0.5 día | 🔴 |
| 2 | API a async/await (sin cambiar versiones) | Medio | 1–2 días | 🔴 |
| 3 | Node 24 + MongoDB 8 + migración de datos | Medio | 0.5–1 día | 🔴 |
| 4 | Mongoose 9 + Express 5 + librerías | Medio | 1–2 días | 🔴 |
| 5 | Cliente Angular 22 | Alto | 4–6 días | 🔴 |
| 6 | Calidad, Docker, CI, documentación | Bajo | 1 día | 🔴 |
| 7 | Despliegue en Azure (Container Apps, DocumentDB, Blob, Static Web Apps) | Medio | 2–3 días | 🔴 |

---

## 2. Versiones: actual → objetivo

Versiones "instaladas" según `package-lock.json`. Versiones "más reciente" verificadas el 2026-10-20.

### API

| Paquete | Declarada | Instalada | Más reciente | **Objetivo** | Notas |
|---|---|---|---|---|---|
| Node.js | — (sin `engines`) | 8.x (de facto) | 26.12.0 (Current) | **24.x LTS "Krypton"** | Node 20 ya no tiene soporte; Node 22 está en mantenimiento |
| express | `^4.15.2` | 4.16.3 | 5.3.0 | **5.x** | Rama 4.x en 4.22.3 |
| mongoose | `^4.9.6` | 4.13.12 | 9.11.2 | **9.x** | Sin callbacks; pre-hooks sin `next()` |
| mongodb (driver) | — (transitivo) | 2.2.34 | 7.7.0 | **7.x** (lo trae Mongoose 9) | Requiere Node ≥ 20.19 |
| MongoDB Server | — | ≤ 3.6 | 9.0.x (ver nota) | **8.0** | 8.0 es la línea de soporte largo |
| body-parser | `^1.17.1` | — | — | **eliminar** | Viene integrado en `express.json()` |
| bcrypt-nodejs | `0.0.3` | — | abandonado | **bcryptjs 3.x** | Valida los hashes `$2a$` existentes |
| jwt-simple | `^0.5.1` | — | — | **jsonwebtoken 9.x** | `expiresIn`, `verify` con errores tipados |
| moment | `^2.18.1` | — | en mantenimiento | **eliminar** | Ya no hace falta con `jsonwebtoken` |
| connect-multiparty | `^2.0.0` | — | abandonado | **multer 2.x** | |
| mongoose-pagination | `^1.0.0` | — | abandonado | **eliminar** | `skip`/`limit` + `countDocuments` |
| npm, to, update | en `dependencies` | — | — | **eliminar** | Dependencias basura |
| nodemon | `^1.11.0` | — | 3.1.14 | **eliminar** | `node --watch` viene en Node |
| cors | — | — | — | **agregar** | Reemplaza las cabeceras manuales |
| helmet | — | — | — | **agregar** | Cabeceras de seguridad |

> **Nota MongoDB:** las fuentes no coinciden sobre si 9.0.x ya es estable (una lista 8.3.13 como última estable).
> Para este proyecto se recomienda **8.0** por ser la línea de soporte largo. Si quieres usar 9.0, confirma su estado en
> <https://www.mongodb.com/legal/support-policy/lifecycles> y que el driver 7.x lo soporta.

### Cliente

| Paquete | Declarada | Instalada | Más reciente | **Objetivo** | Notas |
|---|---|---|---|---|---|
| @angular/* | `^4.0.0` | 4.2.4 | 22.2.3 | **22.x** | |
| @angular/cli | `1.1.3` | 1.1.3 | 22.2.3 | **22.x** | |
| @angular/http | `^4.0.0` | 4.2.4 | eliminado (v8+) | **HttpClient** | |
| TypeScript | `~2.3.3` | 2.3.4 | 7.0.2 | **la que fije Angular 22** | ⚠️ No instales `typescript@latest`, ver nota |
| rxjs | `^5.1.0` | 5.4.1 | 7.8.2 | **7.8.x** | 9.0 está en beta |
| zone.js | `^0.8.4` | 0.8.12 | 0.16.3 | **eliminar** | Las apps nuevas son zoneless por defecto (v21+) |
| core-js | `^2.4.1` | — | — | **eliminar** | El CLI moderno no lo necesita |
| Bootstrap | 3.x (en `assets/`) | — | 5.3.x | **5.3.x** (npm) | Sin jQuery |
| jQuery | 1.12.4 (en `assets/`) | — | — | **eliminar** | |
| Karma + Jasmine | 1.7 / 2.6 | — | — | **Vitest** | Por defecto desde Angular 21 |
| Protractor | 5.1 | — | eliminado | **Playwright** | |
| TSLint + codelyzer | 5.3 / 3.0 | — | eliminado | **angular-eslint** | |

> **Nota TypeScript:** `typescript@latest` en npm es la 7.x. Angular 22 trabaja con la 6.x según sus notas de
> versión. **Deja que `ng new` / `ng update` fijen la versión** y comprueba la tabla de compatibilidad en
> <https://angular.dev/reference/versions> antes de cambiarla a mano.
>
> **Nota Node para Angular 22:** las notas de versión indican Node ≥ 22. Node 24 LTS cumple el requisito y
> permite usar la misma versión de Node en API y cliente.

---

## 3. Inventario del proyecto actual

### 3.1 API (`api/`)

```
api/
├── index.js                  # Conexión Mongo (callback) + app.listen (puerto 3979)
├── app.js                    # Express, body-parser, CORS manual, montaje de rutas en /api
├── controllers/{user,artist,album,song}.js
├── models/{user,artists,album,song}.js
├── routers/{user,artists,album,songs}.js
├── middlewares/authenticated.js   # ensureAuth (jwt-simple)
└── services/jwt.js                # createToken (jwt-simple)
```

**Modelos y colecciones** (Mongoose pone en minúsculas y plural el nombre del modelo; **mantener los mismos nombres
de modelo** para no cambiar las colecciones):

| Modelo | Colección | Campos |
|---|---|---|
| `User` | `users` | name, surname, email, password, role, image |
| `Artists` | `artists` | name, description, image |
| `Albums` | `albums` | title, description, year (Number), image, artist → `Artists` |
| `Song` | `songs` | number (String), name, duration (String), file, album → `Albums` |

**Contrato REST** (prefijo `/api`, puerto `3979`). 🔒 = requiere header `Authorization`. **Este contrato se
congela** durante las fases 1–4 (ver [regla R1](#5-estrategia-y-reglas-de-la-migración)).

| Método | Ruta | Auth | Controlador | Campo multipart |
|---|---|---|---|---|
| GET | `/probando-controlador` | 🔒 | user.pruebas | |
| POST | `/registarUsuario` | | user.saveUser | |
| POST | `/loginUsuario` | | user.loginUser (`gethash` → token) | |
| PUT | `/actualizarUsuario/:id` | 🔒 | user.updateUser | |
| POST | `/actualizarImagenUsuario/:id` | 🔒 | user.uploadImage | `image` |
| GET | `/obtenerImagenUsuario/:imageFile` | | user.getImageFile | |
| GET | `/obtenerArtista/:id` | 🔒 | artist.getArtist | |
| POST | `/registarArtista` | 🔒 | artist.saveArtist | |
| GET | `/obtenerArtistas/:page?` | 🔒 | artist.getArtists (4 por página) | |
| PUT | `/actualizarArtista/:id` | 🔒 | artist.updateArtist | |
| DELETE | `/eliminarArtista/:id` | 🔒 | artist.deleteArtist (cascada) | |
| POST | `/actualizarImagenArtista/:id` | 🔒 | artist.uploadImage | `image` |
| GET | `/obtenerImagenArtista/:imageFile` | | artist.getImageFile | |
| GET | `/obtenerAlbum/:id` | 🔒 | album.getAlbum | |
| POST | `/registarAlbum` | 🔒 | album.saveAlbum | |
| GET | `/obtenerAlbums/:artist` | 🔒 | album.getAlbums | |
| PUT | `/actualizarAlbum/:id` | 🔒 | album.updateAlbum | |
| DELETE | `/eliminarAlbum/:id` | 🔒 | album.deleteAlbum (cascada) | |
| POST | `/actualizarImagenAlbum/:id` | 🔒 | album.uploadImage | `image` |
| GET | `/obtenerImagenAlbum/:imageFile` | | album.getImageFile | |
| POST | `/registarCancion` | 🔒 | song.saveSong | |
| GET | `/obtenerCancion/:id` | 🔒 | song.getSong | |
| GET | `/obtenerCanciones/:album?` | 🔒 | song.getSongs | |
| PUT | `/actualizarCancion/:id` | 🔒 | song.updateSongs | |
| DELETE | `/eliminarCancion/:id` | 🔒 | song.deleteSong | |
| POST | `/actualizarFileCancion/:id` | 🔒 | song.uploadFile | `file` |
| GET | `/obtenerFileCancion/:songFile` | | song.getSongFile | |

> Los nombres con errores de ortografía (`registar*`) **se mantienen** mientras viva el cliente Angular 4. Si se
> quiere renombrarlos, se hace en la Fase 5.10 con una API versionada (`/api/v2`) y no antes.

Los archivos subidos se guardan en `api/uploads/{users,artists,album,song}/`. Esa carpeta **no está en git**:
respáldala por separado.

### 3.2 Cliente (`client/`)

| Ruta Angular | Componente | Servicios que usa |
|---|---|---|
| `''` | HomeComponent | — |
| `artistas/:page` | ArtistListComponent | ArtistService |
| `crear-artista` | ArtistAddComponent | ArtistService |
| `editar-artista/:id` | ArtistEditComponent | ArtistService, UploadService |
| `artista/:id` | ArtistDetailComponent | ArtistService, AlbumService |
| `crear-album/:artist` | AlbumAddComponent | AlbumService |
| `album/:id` | AlbumDetailComponent | AlbumService, SongService |
| `editar-album/:id` | AlbumEditComponent | AlbumService, UploadService |
| `mis-datos` | UserEditComponent | UserService (+ su propio `makeFileRequest`) |
| `crear-tema/:album` | SongAddComponent | SongService |
| `editar-tema/:id` | SongEditComponent | SongService, UploadService |
| `player/:id` | PlayerComponent | — (lee `localStorage.SOUND_SONG`) |
| `**` | ArtistListComponent | |

**Patrones del cliente actual que hay que reemplazar:**

- `HttpModule` / `Http` con `.map(res => res.json())` y `Headers` armados a mano en cada método.
- Imports de RxJS 5 por efecto secundario (`import 'rxjs/add/operator/map'`).
- Sesión en `localStorage`: `identity` (usuario en JSON) y `token` (string JSON **con comillas**; la API las
  quita con `replace(/['"]+/g, '')`).
- Control de roles **solo en plantillas** (`*ngIf="identity.role == 'ROLE_ADMIN'"`). No hay guards de rutas.
- Errores leídos con `JSON.parse(error._body)` en 18 sitios (API privada de `@angular/http`).
- Reproductor manejado con `document.getElementById` (`album-detail.component.ts` → `startPlayer`).
- Subidas con `XMLHttpRequest` a mano (`UploadService.makeFileRequest`, duplicado en `UserEditComponent`).
- URL de la API escrita directo en `services/global.ts` (`http://localhost:3979/api/`).
- Bootstrap 3 + jQuery 1.12 cargados desde `src/index.html`. Clases usadas: `btn-default`, `pull-right`,
  `jumbotron`, `col-lg-*`, `glyphicon-{book,cog,log-out,music,play,search,star}`.

---

## 4. Defectos detectados en el código actual

Estos defectos existen hoy. Algunos **cambian de comportamiento o rompen** al actualizar versiones, así que se
corrigen en la Fase 1, antes de migrar.

| ID | Severidad | Ubicación | Problema | Efecto |
|---|---|---|---|---|
| D1 | 🔴 Seguridad | `api/services/jwt.js:15` | `exp: moment().add(30,'days').unix` sin `()` | `exp` es una función, `JSON.stringify` la omite: **los tokens nunca expiran** |
| D2 | 🔴 Seguridad | `api/controllers/user.js:26` | `user.role = 'ROLE_ADMIN'` en el registro | **Cualquier persona que se registre es administrador** |
| D3 | 🔴 Seguridad | `api/controllers/user.js:98` | Login sin `gethash` devuelve el documento completo | **Expone el hash de la contraseña** |
| D4 | 🔴 Seguridad | `services/jwt.js:4`, `middlewares/authenticated.js:4` | Secreto JWT escrito en el código y duplicado | Cualquiera con acceso al repo puede firmar tokens |
| D5 | 🔴 Seguridad | `getImageFile` / `getSongFile` en los 4 controladores | Concatenan `'./uploads/x/' + req.params.*` | Riesgo de *path traversal* (`..%2F..%2F`) |
| D6 | 🔴 Crash | `api/controllers/artist.js:104-140` | `deleteArtist` usa `songRemoved` antes de definirla y responde varias veces | `ReferenceError` / `ERR_HTTP_HEADERS_SENT` tumba el proceso. Las canciones nunca se borran |
| D7 | 🟠 Rompe al migrar | `api/controllers/artist.js:14` | `populate({ path: 'album' })` sobre `Artist`, que no tiene ese campo | En Mongoose 6+ lanza error (`strictPopulate`) |
| D8 | 🟠 Rompe en macOS/Linux | `artist.js:153`, `album.js:185`, `song.js:186`, `user.js:143` | `file_path.split('\\')`: solo funciona con rutas de Windows | En macOS/Linux el nombre del archivo sale mal o `undefined` |
| D9 | 🟠 Funcional | `api/controllers/user.js:25` vs `:79` | El login pone el email en minúsculas, el registro no | Quien se registra con mayúsculas no puede iniciar sesión |
| D10 | 🟡 Funcional | `api/models/user.js` | Sin índice único en `email` | Puede haber usuarios duplicados |
| D11 | 🟡 Funcional | `middlewares/authenticated.js:24` | Token inválido responde **404** | Debería ser 401 |
| D12 | 🟡 Funcional | `*/uploadImage`, `song.uploadFile` | Extensión tomada de `split('.')[1]`, sin límite de tamaño | `foto.final.png` se rechaza; se aceptan archivos enormes |
| D13 | 🟡 Deprecado | 4 controladores | `fs.exists` (deprecado) | Avisos y comportamiento frágil |
| D14 | 🟡 Funcional | `findByIdAndUpdate` sin `{ new: true }` | Devuelve el documento **anterior** a la actualización | El cliente muestra datos viejos (comportamiento actual, decidir si mantenerlo) |
| D15 | 🟡 Calidad | `api/index.js:1`, `services/jwt.js:1`, `controllers/user.js:1` | `'use strinct'` / `'user strinct'` | Modo estricto desactivado sin querer |
| D16 | 🟡 Funcional | `api/index.js:4` | `process.env.port` en minúsculas | La convención `PORT` se ignora |

---

## 5. Estrategia y reglas de la migración

### Reglas

- **R1 — Contrato congelado.** Durante las fases 1–4 **no cambian** rutas, métodos, nombres de campos ni forma de
  las respuestas (`{ artist }`, `{ total_items, artists }`, `{ token }`, …). Los únicos cambios permitidos son los
  arreglos de seguridad de la Fase 1, documentados en la tabla de la sección 4.
- **R2 — Un paso, un commit.** Cada casilla del checklist es como máximo un commit; un commit puede cerrar
  varias casillas relacionadas. Mensajes con prefijo de fase: `migration(f2): convert artist controller to async/await`.
- **R3 — Siempre en verde.** Antes de marcar una casilla, las pruebas de humo (Fase 0.3) deben pasar.
- **R4 — Ramas.** Una rama por fase a partir de `master`: `migration/f0-preparation`, `migration/f1-bugfixes`, …
  Se integra con PR o merge `--no-ff` al terminar la fase.
- **R5 — Reversible.** Cada fase lista cómo se revierte. No se borra nada de la versión vieja (por ejemplo
  `client/`) hasta que la nueva esté aceptada.
- **R6 — Fuente de verdad de versiones.** Antes de iniciar una fase, comprueba la versión vigente con
  `npm view <paquete> dist-tags` y anota en la bitácora cualquier diferencia con este documento.

### Definición de terminado (por fase)

1. Todas las casillas de la fase están marcadas.
2. Las pruebas de humo pasan (`npm test` en `api/`).
3. Probado a mano: registro, login, CRUD de artista/álbum/canción, subida de imagen y de audio, reproducción.
4. Hay una entrada en la [bitácora](#16-bitácora-de-avance).
5. La rama de la fase está integrada en `master`.

---

## 6. Arquitectura objetivo

### 6.1 API (fin de la Fase 4)

```
api/
├── .env.example               # PORT, MONGODB_URI, JWT_SECRET, CORS_ORIGIN, UPLOADS_DIR
├── Dockerfile
├── package.json               # "type": "module", engines.node >= 24
├── src/
│   ├── index.js               # bootstrap: conecta a Mongo y levanta el servidor
│   ├── app.js                 # express(), middlewares globales, rutas, manejo de errores
│   ├── config/
│   │   ├── env.js             # lectura y validación de variables de entorno
│   │   └── db.js              # mongoose.connect con promesas
│   ├── middlewares/
│   │   ├── auth.js            # ensureAuth (+ requireRole)
│   │   ├── upload.js          # fábricas de multer (imagen / audio)
│   │   └── error-handler.js   # 404 + manejador de errores central
│   ├── models/{user,artist,album,song}.js
│   ├── controllers/{user,artist,album,song}.js   # async/await
│   ├── routes/{user,artist,album,song}.js
│   └── services/
│       ├── token.js           # jsonwebtoken sign/verify
│       └── files.js           # servir archivos de forma segura
├── test/
│   └── smoke.test.js          # node:test + supertest
└── uploads/                   # en .gitignore (salvo .gitkeep)
```

### 6.2 Cliente (fin de la Fase 5)

Sigue la guía de estilo de Angular (v20+): nombres de archivo sin sufijo `.component`, componentes standalone,
signals, zoneless y OnPush por defecto (v22).

```
client/
├── angular.json
├── proxy.conf.json            # /api → http://localhost:3979 en desarrollo
├── src/
│   ├── main.ts                # bootstrapApplication(App, appConfig)
│   ├── styles.css             # @import de Bootstrap 5 y Bootstrap Icons + estilos propios
│   ├── environments/
│   └── app/
│       ├── app.ts / app.html / app.config.ts / app.routes.ts
│       ├── core/
│       │   ├── auth/          # auth-store.ts, auth.interceptor.ts, auth.guard.ts, admin.guard.ts
│       │   ├── api/           # artist-api.ts, album-api.ts, song-api.ts, user-api.ts, upload-api.ts
│       │   ├── models/        # interfaces tipadas
│       │   └── player/        # player-store.ts (estado global del reproductor)
│       ├── features/
│       │   ├── home/
│       │   ├── auth/          # login, register (hoy viven en app.component)
│       │   ├── artists/       # artist-list, artist-detail, artist-form (alta + edición)
│       │   ├── albums/        # album-detail, album-form
│       │   ├── songs/         # song-form
│       │   └── user/          # user-edit
│       └── shared/
│           ├── player/        # componente reproductor
│           └── ui/            # alert, paginación, etc.
└── e2e/                       # Playwright
```

---

## Fase 0 — Preparación y red de seguridad

**Objetivo:** poder reproducir el estado actual, respaldar todo y tener pruebas automáticas que detecten cualquier
cambio en el contrato.

### 0.1 Entorno reproducible

```bash
git checkout -b migration/f0-preparation
echo "8" > api/.nvmrc
echo "8" > client/.nvmrc
nvm install 8 && nvm use 8
(cd api && npm ci) && (cd client && npm ci)
```

- [ ] Rama `migration/f0-preparation` creada
- [ ] `.nvmrc` con `8` en `api/` y `client/`
- [ ] `npm ci` funciona en `api/` y `client/` con Node 8
- [ ] La API arranca (`npm start`) y responde en `http://localhost:3979/api/probando-controlador` (401/403 sin token)
- [ ] El cliente arranca (`./node_modules/.bin/ng serve`) y permite iniciar sesión

> Si no puedes instalar Node 8 en macOS ARM: `docker run -it --rm -v "$PWD":/app -w /app node:8 bash`.

### 0.2 Respaldo

```bash
# Versión del servidor actual
mongo --eval 'db.version()'            # o mongosh si ya lo tienes

# Dump (usa el mongodump que corresponda al servidor; para servidores < 4.2 usa el que trae ese servidor)
mongodump --db curso_mean2 --out ./backups/$(date +%F)-pre-migration

# Archivos subidos (no están en git)
tar czf ./backups/$(date +%F)-uploads.tgz -C api uploads
```

- [ ] Versión del servidor MongoDB actual anotada en la bitácora: `____`
- [ ] Dump de `curso_mean2` generado y verificado (que haya `.bson` por colección)
- [ ] `api/uploads/` comprimido
- [ ] `backups/` agregado a `.gitignore` (**no** subir datos al repo)
- [ ] Conteo de documentos por colección anotado (para comparar tras la Fase 3):

```js
// en mongo/mongosh, base curso_mean2
['users','artists','albums','songs'].forEach(c => print(c, db.getCollection(c).count()))
```

| Colección | Documentos antes | Documentos después (Fase 3) |
|---|---|---|
| users | | |
| artists | | |
| albums | | |
| songs | | |

### 0.3 Pruebas de humo de la API

Estas pruebas fijan el contrato REST. Se escriben con `mocha` + `supertest` porque `node:test` no existe en
Node 8. En la Fase 4 se pasan a `node:test`.

```bash
cd api
npm i -D mocha@5 supertest@3   # versiones que aún soportan Node 8
```

Para que `supertest` use la app sin abrir puertos, **separa la conexión de la app**: hoy `app.js` ya exporta
`app` sin llamar a `listen`, así que las pruebas pueden importar `app.js` y conectar Mongoose a una base aparte
(`curso_mean2_test`).

```js
// api/test/smoke.test.js (esqueleto; Node 8 → sin async/await en top-level, mocha soporta promesas)
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

const TEST_DB = 'mongodb://localhost:27017/curso_mean2_test';
let token;

before(() => mongoose.connect(TEST_DB).then(() => mongoose.connection.db.dropDatabase()));
after(() => mongoose.disconnect());

describe('Usuarios', () => {
  it('registra', () => request(app).post('/api/registarUsuario')
    .send({ name: 'Test', surname: 'User', email: 'test@verso.dev', password: 'secret' })
    .expect(200));

  it('login devuelve token con gethash', () => request(app).post('/api/loginUsuario')
    .send({ email: 'test@verso.dev', password: 'secret', gethash: true })
    .expect(200)
    .then(res => { token = res.body.token; if (!token) throw new Error('sin token'); }));
});

describe('Artistas', () => {
  it('rechaza sin token', () => request(app).get('/api/obtenerArtistas/1').expect(403));
  it('crea, lista, actualiza y borra', () => { /* ... */ });
});
// Repetir para álbumes, canciones y subidas (usar .attach('image', 'test/fixtures/cover.png'))
```

- [ ] `mocha` + `supertest` instalados y script `"test": "mocha --exit test/"` en `api/package.json`
- [ ] Fixtures en `api/test/fixtures/` (`cover.png`, `track.mp3` pequeño)
- [ ] Pruebas: registro, login (con y sin `gethash`), acceso sin token
- [ ] Pruebas: CRUD de artista + paginación (`total_items`, 4 por página)
- [ ] Pruebas: CRUD de álbum + `obtenerAlbums/:artist`
- [ ] Pruebas: CRUD de canción + `obtenerCanciones` con y sin `:album`
- [ ] Pruebas: subida y descarga de imagen y de audio
- [ ] Todas en verde con el código actual (las que fallan por defectos D1–D16 se marcan `it.skip` con el ID del defecto)

### 0.4 Checklist manual del cliente (baseline)

Captura de pantalla de cada vista para comparar después: `docs/migration/baseline/*.png`.

- [ ] Login y registro
- [ ] Listado de artistas paginado
- [ ] Detalle de artista con álbumes
- [ ] Detalle de álbum con canciones y botón reproducir
- [ ] Alta y edición de artista, álbum y canción (con subida de archivo)
- [ ] Edición de "mis datos" con imagen
- [ ] Reproductor funcionando
- [ ] Capturas guardadas en `docs/migration/baseline/`

**Reversión:** no aplica; esta fase no cambia comportamiento.

---

## Fase 1 — Corrección de defectos críticos (stack actual)

**Objetivo:** corregir los defectos de la sección 4 que son de seguridad o que rompen al migrar. Todo sigue en
Node 8 y Mongoose 4.

```bash
git checkout master && git checkout -b migration/f1-bugfixes
```

### 1.1 Secreto JWT fuera del código (D4)

```js
// api/services/jwt.js y api/middlewares/authenticated.js
var secret = process.env.JWT_SECRET;
if (!secret) { throw new Error('JWT_SECRET no definido'); }
```

- [ ] `JWT_SECRET` leído de `process.env` en los dos archivos
- [ ] `api/.env.example` creado con `PORT=3979`, `MONGODB_URI=mongodb://localhost:27017/curso_mean2`, `JWT_SECRET=cambia-esto`
- [ ] `.env` en `.gitignore`
- [ ] **Secreto nuevo** generado (`openssl rand -base64 48`). Al rotarlo se invalidan todos los tokens viejos, que no expiran por D1

### 1.2 Expiración del token (D1)

```js
exp: moment().add(30, 'days').unix()
```

- [ ] `()` agregados
- [ ] Prueba: un token con `exp` vencido recibe 401 (D11: cambiar el 404 por 401 en el `catch` del middleware)

### 1.3 Rol por defecto (D2) y exposición del hash (D3)

```js
user.role = 'ROLE_USER';
user.email = params.email.toLowerCase();   // D9
```

```js
// loginUser, rama sin gethash
var userObj = user.toObject();
delete userObj.password;
res.status(200).send(userObj);
```

- [ ] Registro asigna `ROLE_USER`
- [ ] Script `api/scripts/promote-admin.js <email>` para dar `ROLE_ADMIN` (o comando documentado en mongosh:
      `db.users.updateOne({ email: 'x' }, { $set: { role: 'ROLE_ADMIN' } })`)
- [ ] Login no devuelve `password`. **También** `updateUser`, que devuelve el documento completo
- [ ] Email en minúsculas al registrar (D9)
- [ ] Script de una sola vez que pasa a minúsculas los emails existentes (comprobar antes que no se generen duplicados)

### 1.4 `deleteArtist` (D6)

Reescribir la cascada con una sola respuesta: borrar las canciones de **todos** los álbumes del artista, después
los álbumes y al final el artista.

```js
function deleteArtist(req, res) {
  var artistId = req.params.id;
  Artist.findByIdAndRemove(artistId).exec()
    .then(function (artistRemoved) {
      if (!artistRemoved) { return res.status(404).send({ message: 'El artista no existe' }); }
      return Album.find({ artist: artistRemoved._id }, '_id').exec()
        .then(function (albums) {
          var albumIds = albums.map(function (a) { return a._id; });
          return Song.remove({ album: { $in: albumIds } }).exec();
        })
        .then(function () { return Album.remove({ artist: artistRemoved._id }).exec(); })
        .then(function () { res.status(200).send({ artist: artistRemoved }); });
    })
    .catch(function () { res.status(500).send({ message: 'Error al eliminar el artista' }); });
}
```

- [ ] `deleteArtist` corregido (una sola respuesta y cascada completa)
- [ ] Revisar `deleteAlbum` (`album.js` ~línea 140-160): mismo patrón de varias respuestas
- [ ] Prueba de humo de la cascada sin `skip`

### 1.5 `populate` inválido (D7)

- [ ] Quitar `.populate({ path: 'album' })` de `getArtist` (`artist.js:14`). El cliente pide los álbumes aparte con `obtenerAlbums/:artist`

### 1.6 Subidas multiplataforma (D8, D12)

```js
var file_name = path.basename(req.files.image.path);
var file_ext = path.extname(file_name).slice(1).toLowerCase();
```

- [ ] Los 4 `split('\\')` reemplazados por `path.basename` / `path.extname`
- [ ] Probado en macOS (o Linux)
- [ ] `api/uploads/{users,artists,album,song}/.gitkeep` versionados y `api/uploads/**` (salvo `.gitkeep`) en `.gitignore`. Hoy la carpeta no existe al clonar y `connect-multiparty` falla

### 1.7 Servir archivos de forma segura (D5, D13)

```js
function getImageFile(req, res) {
  var root = path.resolve('uploads/artists');
  res.sendFile(req.params.imageFile, { root: root }, function (err) {
    if (err) { res.status(404).send({ message: 'No existe la imagen' }); }
  });
}
```

`sendFile` con `root` rechaza las rutas con `..` (responde 403) y sustituye a `fs.exists`.

- [ ] Los 4 `getImageFile` / `getSongFile` usan `sendFile` con `root`
- [ ] Prueba: `GET /api/obtenerImagenArtista/..%2F..%2Fpackage.json` **no** devuelve el archivo
- [ ] Decidir si un archivo que no existe responde 404 (recomendado) o 200 como hoy. Anotarlo en la bitácora

### 1.8 Varios

- [ ] `'use strict'` corregido en `index.js`, `services/jwt.js`, `controllers/user.js` (D15). ⚠️ Activar el modo estricto puede sacar a la luz variables no declaradas: correr las pruebas
- [ ] `process.env.PORT || 3979` (D16)
- [ ] Índice único en `email` (D10): `email: { type: String, unique: true, lowercase: true, trim: true }`. Comprobar antes que no hay duplicados: `db.users.aggregate([{ $group: { _id: { $toLower: '$email' }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }])`
- [ ] Dependencias basura eliminadas: `npm rm npm to update`

**Criterio de aceptación:** pruebas de humo en verde (sin `skip` de D1–D16) y el cliente Angular 4 sigue funcionando.

**Reversión:** `git revert` del merge de la fase. Los datos no cambian, salvo el paso a minúsculas de los emails:
se revierte con el dump de la Fase 0.

---

## Fase 2 — Refactor de la API a async/await (stack actual)

**Objetivo:** quitar todos los callbacks de Mongoose **antes** de actualizar. Mongoose 7+ ya no acepta
callbacks. Node 8 soporta `async/await` (desde 7.6) y las queries de Mongoose 4 devuelven promesas con `.exec()`,
así que el cambio se prueba con las versiones actuales.

```bash
git checkout -b migration/f2-async
```

### 2.1 Envoltorio de errores asíncronos

Express 4 no captura los rechazos de promesas, así que hace falta un envoltorio. En Express 5 ya no hará falta
(Fase 4.4).

```js
// api/middlewares/async-handler.js
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

```js
// app.js — manejador de errores central (al final, después de las rutas)
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.publicMessage || 'Error en la petición' });
});
```

### 2.2 Patrón de conversión

**Antes:**
```js
Artist.findById(artistId).exec((err, artist) => {
  if (err) { res.status(500).send({ message: 'Error en la petición' }); }
  else if (!artist) { res.status(404).send({ message: 'El artista no existe' }); }
  else { res.status(200).send({ artist }); }
});
```

**Después:**
```js
async function getArtist(req, res) {
  const artist = await Artist.findById(req.params.id).exec();
  if (!artist) return res.status(404).send({ message: 'El artista no existe' });
  res.status(200).send({ artist });
}
// en el router: api.get('/obtenerArtista/:id', md_auth.ensureAuth, asyncHandler(ArtistController.getArtist));
```

**Paginación sin `mongoose-pagination`** (mismo contrato `{ total_items, artists }`):

```js
async function getArtists(req, res) {
  const page = Math.max(parseInt(req.params.page, 10) || 1, 1);
  const itemsPerPage = 4;
  const [artists, total] = await Promise.all([
    Artist.find().sort('name').skip((page - 1) * itemsPerPage).limit(itemsPerPage).exec(),
    Artist.count().exec(),   // en la Fase 4: countDocuments()
  ]);
  res.status(200).send({ total_items: total, artists });
}
```

**bcrypt con promesas** (sigue siendo `bcrypt-nodejs` hasta la Fase 4):

```js
const util = require('util');
const hash = util.promisify((pw, cb) => bcrypt.hash(pw, null, null, cb));
const compare = util.promisify(bcrypt.compare);
```

### 2.3 Checklist por controlador

**user.js**
- [ ] `saveUser`
- [ ] `loginUser`
- [ ] `updateUser`
- [ ] `uploadImage`
- [ ] `getImageFile` (ya resuelto en 1.7, comprobar)

**artist.js**
- [ ] `getArtist`
- [ ] `saveArtist`
- [ ] `getArtists` (sin `mongoose-pagination`)
- [ ] `updateArtist`
- [ ] `deleteArtist`
- [ ] `uploadImage`

**album.js**
- [ ] `getAlbum`
- [ ] `saveAlbum`
- [ ] `getAlbums`
- [ ] `updateAlbum`
- [ ] `deleteAlbum`
- [ ] `uploadImage`

**song.js**
- [ ] `getSong`
- [ ] `saveSong`
- [ ] `getSongs` (populate anidado `album → artist`)
- [ ] `updateSongs`
- [ ] `deleteSong`
- [ ] `uploadFile`

**Transversal**
- [ ] `asyncHandler` aplicado en los 4 routers
- [ ] Manejador de errores central en `app.js`
- [ ] `index.js`: `mongoose.connect(uri).then(() => app.listen(...)).catch(err => { console.error(err); process.exit(1); })`
- [ ] `mongoose.Promise = global.Promise` (necesario en Mongoose 4; se quita en la Fase 4)
- [ ] `npm rm mongoose-pagination`
- [ ] `grep -rn "(err," api/controllers` no devuelve callbacks de Mongoose
- [ ] `console.log` de depuración eliminados (`console.log(params)`, `'Llego!'`, …)

**Criterio de aceptación:** pruebas de humo en verde y sin callbacks de Mongoose en `api/`.

**Reversión:** `git revert` del merge.

---

## Fase 3 — Infraestructura: Node 24 + MongoDB 8 + datos

**Objetivo:** pasar el servidor de datos a MongoDB 8.0 y comprobar qué falla en Node 24 antes de tocar las
dependencias.

```bash
git checkout -b migration/f3-infra
```

### 3.1 MongoDB 8.0 en Docker

```yaml
# docker-compose.yml (raíz del repo) — por ahora solo mongo
services:
  mongo:
    image: mongo:8.0
    container_name: verso-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  mongo-data:
```

- [ ] Detener el MongoDB local viejo (`brew services stop mongodb-community` o el que corresponda) para liberar el puerto 27017
- [ ] `docker compose up -d mongo` y `docker compose ps` en estado *healthy*
- [ ] `mongosh` instalado (en MongoDB ≥ 6 ya no existe el shell `mongo`): `brew install mongosh`
- [ ] MongoDB Database Tools 100.x instalados: `brew install mongodb-database-tools`

### 3.2 Migración de datos

```bash
mongorestore --uri="mongodb://localhost:27017" \
  --nsInclude='curso_mean2.*' \
  --nsFrom='curso_mean2.*' --nsTo='verso.*' \
  ./backups/AAAA-MM-DD-pre-migration
```

> **Renombrado de la base de datos:** el proyecto se llama **Verso**, pero la base sigue llamándose `curso_mean2`
> (nombre heredado del curso original). El restore la renombra a **`verso`**. Desde aquí, todas las referencias
> usan `mongodb://localhost:27017/verso`.

- [ ] Restore sin errores, en la base **`verso`**
- [ ] `MONGODB_URI` actualizado a `mongodb://localhost:27017/verso` en `api/.env`, `api/.env.example` y (si aún existe) `api/index.js`
- [ ] Conteos por colección iguales a los de la Fase 0.2 (completar la tabla)
- [ ] Índices revisados: `db.users.getIndexes()` (el índice único de email de la Fase 1.8 se crea al arrancar Mongoose; en producción se recomienda `autoIndex: false` y crear los índices con un script)
- [ ] `db.adminCommand({ getParameter: 1, featureCompatibilityVersion: 1 })` devuelve `8.0`

> **Alternativa sin Docker:** actualizar en sitio exige pasar por cada versión mayor
> (3.6 → 4.0 → 4.2 → 4.4 → 5.0 → 6.0 → 7.0 → 8.0) y ajustar `featureCompatibilityVersion` en cada salto.
> **No se recomienda** para este proyecto.

### 3.3 Mongoose 4 contra MongoDB 8 (comprobación)

El driver 2.2 **no es compatible** con MongoDB 8.0: usa el protocolo `OP_QUERY`, que se eliminó en MongoDB 6.0.
**Lo esperado es que la API vieja no pueda conectarse.** Por eso la Fase 3 y la Fase 4.1 se ejecutan juntas o seguidas.

- [ ] Comprobado (y anotado en la bitácora) que Mongoose 4 no conecta con MongoDB 8. Paso informativo

### 3.4 Node 24

```bash
nvm install 24 && nvm use 24
echo "24" > api/.nvmrc
```

- [ ] Node 24 instalado y `.nvmrc` de la API actualizado
- [ ] `client/.nvmrc` **se queda en 8** hasta la Fase 5 (el cliente viejo no corre en Node 24)
- [ ] Documentar en el README de la API que el cliente viejo necesita `nvm use 8` en su carpeta

**Reversión:** `docker compose down`, volver a arrancar el MongoDB local viejo y `nvm use 8`. Los datos del
servidor viejo no se tocaron.

---

## Fase 4 — API: Mongoose 9, Express 5 y librerías modernas

**Objetivo:** API en Node 24 + Express 5 + Mongoose 9, con ES Modules, configuración por entorno, pruebas con
`node:test` y la estructura de la sección 6.1.

```bash
git checkout -b migration/f4-api-modern
```

### 4.1 Mongoose 9 y driver 7

```bash
cd api && npm i mongoose@9
```

Cambios obligatorios (Mongoose 5 → 9 acumulados):

| Antes (Mongoose 4) | Después (Mongoose 9) |
|---|---|
| `mongoose.Promise = global.Promise` | eliminar |
| `mongoose.connect(uri, cb)` | `await mongoose.connect(uri)` |
| `Model.count()` | `Model.countDocuments()` / `estimatedDocumentCount()` |
| `Model.findByIdAndRemove()` | `Model.findByIdAndDelete()` |
| `Query.remove()` / `Model.remove()` | `Model.deleteMany()` / `deleteOne()` |
| `Schema.ObjectId` | `Schema.Types.ObjectId` |
| callbacks en cualquier método | eliminados (ya hecho en la Fase 2) |
| `pre('save', function (next) { … next() })` | `pre('save', async function () { … })` (Mongoose 9 quitó `next`) |
| `populate` de rutas que no están en el esquema | error (`strictPopulate`, ya resuelto en D7) |
| `strictQuery` | `false` por defecto desde v7: los filtros con campos desconocidos **no se descartan**. Revisar |
| `find(null)` / `findOne(null)` | lanza error en v9: validar los ids antes de consultar |
| `findByIdAndUpdate(id, update)` | devuelve el documento previo; usar `{ returnDocument: 'after' }` si se quiere el nuevo (D14) |

**Modelo de ejemplo:**

```js
// src/models/user.js
import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['ROLE_USER', 'ROLE_ADMIN'], default: 'ROLE_USER' },
    image: { type: String, default: null },
  },
  { versionKey: false },
);

export const User = model('User', userSchema);   // misma colección: users
```

> Con `select: false`, el login debe pedir la contraseña de forma explícita: `User.findOne({ email }).select('+password')`.
> No agregues `timestamps: true` sin decidirlo: cambia la forma de las respuestas (regla R1).

- [ ] `mongoose@9` instalado y la API conecta con MongoDB 8
- [ ] Los 4 modelos en `src/models/` con validaciones (`required`, `enum`, `trim`)
- [ ] Nombres de modelo intactos (`User`, `Artists`, `Albums`, `Song`) → mismas colecciones
- [ ] Tabla de equivalencias aplicada en los 4 controladores
- [ ] Validar `ObjectId` en las rutas con `:id` (`isValidObjectId`) y responder 400 o 404 en vez de 500
- [ ] Decisión de D14 (documento previo o nuevo) anotada en la bitácora

### 4.2 Reemplazo de librerías

```bash
npm rm body-parser bcrypt-nodejs jwt-simple moment connect-multiparty nodemon
npm i bcryptjs jsonwebtoken multer cors helmet
```

**Contraseñas — `bcryptjs`** (compatible con los hashes `$2a$` que genera `bcrypt-nodejs`; nadie tiene que
cambiar su contraseña):

```js
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 12);
const ok = await bcrypt.compare(password, user.password);
```

**Tokens — `jsonwebtoken`:**

```js
// src/services/token.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function createToken(user) {
  const { _id, name, surname, email, role, image } = user;
  return jwt.sign({ sub: String(_id), name, surname, email, role, image }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '30d',
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}
```

```js
// src/middlewares/auth.js
import { verifyToken } from '../services/token.js';

export function ensureAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(403).send({ message: 'La petición no tiene la cabecera de autenticación' });
  // Compatibilidad: el cliente viejo manda el token entre comillas; el nuevo manda "Bearer <token>"
  const token = header.replace(/^Bearer\s+/i, '').replace(/['"]+/g, '');
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'El token ha expirado' : 'Token no válido';
    res.status(401).send({ message });
  }
}

export const requireRole = (role) => (req, res, next) =>
  req.user?.role === role ? next() : res.status(403).send({ message: 'Permisos insuficientes' });
```

> ⚠️ El campo de error era `menssage` (con doble n) en el middleware y en varios controladores. El cliente lee
> `body.message`. Unificar en `message` **corrige** un error del cliente, así que no rompe el contrato.

**Subidas — `multer`:**

```js
// src/middlewares/upload.js
import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

function uploader({ folder, field, exts, maxMb }) {
  const storage = multer.diskStorage({
    destination: path.join(env.UPLOADS_DIR, folder),
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  });
  const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase();
    if (exts.includes(ext)) return cb(null, true);
    const err = new Error('Extensión de archivo no válida');
    err.status = 400;
    err.publicMessage = err.message;
    cb(err);
  };
  return multer({ storage, fileFilter, limits: { fileSize: maxMb * 1024 * 1024 } }).single(field);
}

export const uploadUserImage   = uploader({ folder: 'users',   field: 'image', exts: ['png', 'jpg', 'jpeg', 'gif', 'webp'], maxMb: 5 });
export const uploadArtistImage = uploader({ folder: 'artists', field: 'image', exts: ['png', 'jpg', 'jpeg', 'gif', 'webp'], maxMb: 5 });
export const uploadAlbumImage  = uploader({ folder: 'album',   field: 'image', exts: ['png', 'jpg', 'jpeg', 'gif', 'webp'], maxMb: 5 });
export const uploadSongFile    = uploader({ folder: 'song',    field: 'file',  exts: ['mp3', 'ogg'], maxMb: 30 });
```

En el controlador, `req.files.image.path` pasa a ser `req.file.filename`.

> Los nombres de campo multipart (`image` / `file`) **son parte del contrato**: no se cambian.

- [ ] `bcryptjs`: login de un usuario creado antes de la migración probado con éxito
- [ ] `jsonwebtoken` + `ensureAuth` nuevo; acepta el token con comillas y `Bearer`
- [ ] `requireRole('ROLE_ADMIN')` aplicado a las rutas de escritura de artistas, álbumes y canciones. **Hoy cualquier usuario autenticado puede escribir**; el control de rol solo está en el cliente
- [ ] `multer` en las 4 subidas, con nombres de archivo aleatorios y límite de tamaño
- [ ] `menssage` → `message` en toda la API (`grep -rn menssage api/`)
- [ ] `moment` eliminado

### 4.3 ES Modules y configuración

```jsonc
// api/package.json (fragmento)
{
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "node --watch --env-file-if-exists=.env src/index.js",
    "start": "node src/index.js",
    "test": "node --test --env-file-if-exists=.env.test",
    "lint": "eslint ."
  }
}
```

```js
// src/config/env.js
const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Falta la variable de entorno ${key}`);
}

export const env = Object.freeze({
  PORT: Number(process.env.PORT ?? 3979),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
  UPLOADS_DIR: process.env.UPLOADS_DIR ?? 'uploads',
});
```

```js
// src/index.js
import mongoose from 'mongoose';
import { app } from './app.js';
import { env } from './config/env.js';

await mongoose.connect(env.MONGODB_URI);
const server = app.listen(env.PORT, () => console.log(`API escuchando en http://localhost:${env.PORT}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  });
}
```

- [ ] `"type": "module"` y todos los archivos con `import`/`export` (extensión `.js` obligatoria en los imports relativos)
- [ ] Código movido a `src/` según la sección 6.1
- [ ] `src/config/env.js` con validación de variables
- [ ] `node --watch` en lugar de `nodemon`; `--env-file-if-exists` en lugar de `dotenv`
- [ ] Apagado ordenado (SIGINT/SIGTERM)
- [ ] `engines.node >= 24`

### 4.4 Express 5

```bash
npm i express@5
```

| Cambio en Express 5 | Qué hacer en Verso |
|---|---|
| Parámetros opcionales: `/:page?` ya no es válido (path-to-regexp v8) | `/obtenerArtistas{/:page}` y `/obtenerCanciones{/:album}` |
| Comodín `*` sin nombre ya no es válido | No se usa hoy. Si se agrega, `/*splat` |
| Los rechazos de handlers `async` llegan a `next(err)` | Quitar `asyncHandler` de la Fase 2 |
| `body-parser` integrado; `urlencoded` con `extended: false` por defecto | `express.json()` y `express.urlencoded()` |
| `req.body` es `undefined` si no hay parser para ese tipo de contenido | No suponer `req.body` en GET; usar `req.body ?? {}` donde aplique |
| `res.status()` solo acepta enteros 100–999 | Revisar que no haya `res.status('200')` |
| Eliminados `res.send(status)`, `res.json(obj, status)`, `req.param()`, `app.del()`, `res.sendfile()` | Buscar con `grep` y reemplazar |
| `req.query` es de solo lectura (getter) | No modificar `req.query` |

```js
// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { userRoutes } from './routes/user.js';
import { artistRoutes } from './routes/artist.js';
import { albumRoutes } from './routes/album.js';
import { songRoutes } from './routes/song.js';
import { notFound, errorHandler } from './middlewares/error-handler.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // el cliente carga imágenes y audio de la API
app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

app.get('/health', (req, res) => res.send({ status: 'ok' }));
app.use('/api', userRoutes, artistRoutes, albumRoutes, songRoutes);

app.use(notFound);
app.use(errorHandler);
```

```js
// src/routes/artist.js
import { Router } from 'express';
import * as Artist from '../controllers/artist.js';
import { ensureAuth, requireRole } from '../middlewares/auth.js';
import { uploadArtistImage } from '../middlewares/upload.js';

const admin = [ensureAuth, requireRole('ROLE_ADMIN')];
export const artistRoutes = Router()
  .get('/obtenerArtista/:id', ensureAuth, Artist.getArtist)
  .post('/registarArtista', admin, Artist.saveArtist)
  .get('/obtenerArtistas{/:page}', ensureAuth, Artist.getArtists)
  .put('/actualizarArtista/:id', admin, Artist.updateArtist)
  .delete('/eliminarArtista/:id', admin, Artist.deleteArtist)
  .post('/actualizarImagenArtista/:id', admin, uploadArtistImage, Artist.uploadImage)
  .get('/obtenerImagenArtista/:imageFile', Artist.getImageFile);
```

- [ ] `express@5` instalado
- [ ] Rutas opcionales con la sintaxis `{/:param}` (2 rutas)
- [ ] `asyncHandler` eliminado
- [ ] `cors` con lista de orígenes configurable (reemplaza las cabeceras manuales con `*`)
- [ ] `helmet` con `crossOriginResourcePolicy: cross-origin` (si no, el navegador bloquea las imágenes y el audio)
- [ ] `notFound` + `errorHandler` centralizados (incluye `MulterError` → 400, `CastError` → 400)
- [ ] Endpoint `/health`
- [ ] *Rate limit* en `/loginUsuario` y `/registarUsuario` (`express-rate-limit`)

### 4.5 Pruebas con `node:test`

```bash
npm rm mocha && npm i -D supertest
```

```js
// test/smoke.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app.js';

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI);   // .env.test → verso_test
  await mongoose.connection.dropDatabase();
});
after(() => mongoose.disconnect());

describe('auth', () => {
  it('registra un usuario con ROLE_USER', async () => {
    const res = await request(app).post('/api/registarUsuario')
      .send({ name: 'T', surname: 'U', email: 'T@Verso.dev', password: 'secret' });
    assert.equal(res.status, 200);
  });
});
```

- [ ] Las pruebas de la Fase 0.3 pasadas a `node:test` + ESM
- [ ] `.env.test` con una base de datos separada
- [ ] Pruebas nuevas: rol (un usuario normal recibe 403 al crear un artista), token vencido (401), *path traversal*, extensión no válida (400), archivo demasiado grande
- [ ] `node --test --experimental-test-coverage` ≥ 70 % en controladores

### 4.6 Calidad del código de la API

```bash
npm i -D eslint @eslint/js globals prettier
```

- [ ] `eslint.config.js` (flat config) con `@eslint/js` recommended y `globals.node`
- [ ] Prettier con la configuración compartida con el cliente
- [ ] `npm audit` sin vulnerabilidades *high*/*critical*
- [ ] (Opcional) Validación de *payloads* con `zod` en registro, login y altas
- [ ] (Opcional) Migrar a TypeScript: Node 24 ejecuta `.ts` directamente (*type stripping*); solo hay que agregar `tsc --noEmit` en CI

**Criterio de aceptación:** API en Node 24 + Express 5 + Mongoose 9 + MongoDB 8, pruebas en verde, y el
**cliente Angular 4 (en Node 8) funciona contra la API nueva** sin cambios.

**Reversión:** `git revert` del merge + `nvm use 8` + restaurar el dump en el MongoDB viejo.

---

## Fase 5 — Cliente: Angular 22 desde cero y port

**Objetivo:** cliente nuevo en Angular 22 (standalone, signals, zoneless, OnPush, HttpClient, Bootstrap 5,
Vitest, Playwright) con el mismo comportamiento que el actual.

> **Por qué desde cero y no con `ng update`:** habría que pasar por 18 versiones mayores (4→5→…→22), cada una
> con su propia versión de Node y de TypeScript. Además `@angular/http` (eliminado en v8), Protractor, TSLint y
> `.angular-cli.json` → `angular.json` exigen trabajo manual. Con 13 componentes, portar es más rápido y deja
> un código idiomático.

```bash
git checkout -b migration/f5-client
nvm use 24
```

### 5.1 Crear el proyecto

```bash
npx @angular/cli@22 new verso --directory=client-next --style=css --routing --ssr=false --skip-git
cd client-next
echo "24" > .nvmrc
```

> Se crea en `client-next/` junto al cliente actual. Al final de la fase, `client/` pasa a `legacy/client/`
> (o se borra) y `client-next/` se renombra a `client/` (paso 5.12).

**Novedades por defecto en un proyecto Angular 22** (repasa las notas oficiales antes de empezar, ver Apéndice D):

| Característica | Desde | Impacto en Verso |
|---|---|---|
| Componentes standalone (sin `NgModule`) | v19 (por defecto) | Se elimina `AppModule` |
| Builder `application` (esbuild + Vite) | v17 | `ng serve` / `ng build` mucho más rápidos |
| Control de flujo `@if` / `@for` / `@switch` | v17 (`*ngIf` deprecado en v20) | Reescribir las plantillas |
| Zoneless (sin `zone.js`) | v21 (por defecto en apps nuevas) | La detección de cambios depende de signals y eventos |
| **OnPush por defecto** | **v22** | ⚠️ Cambiar una propiedad normal desde un `subscribe` **no refresca la vista**. Usar signals |
| HttpClient con backend Fetch por defecto | v22 | Sin impacto; `withXhr()` si se necesita progreso de subida |
| Signal Forms, `resource()` / `httpResource()` estables | v22 | Opción moderna para formularios y lecturas |
| Vitest como *test runner* | v21 | Karma desaparece |
| Guía de estilo: archivos sin sufijo (`artist-list.ts`) | v20 | Convención de nombres |

- [ ] `client-next/` creado con Angular 22 y Node 24
- [ ] `ng serve` y `ng test` funcionan con el proyecto vacío
- [ ] `ng add angular-eslint` (lint con flat config)
- [ ] Prettier configurado (misma configuración que la API)
- [ ] `strict: true` en `tsconfig.json` (viene por defecto)

### 5.2 Configuración base

**Proxy de desarrollo** (sin CORS en local y con la misma URL relativa en todos los entornos):

```json
// proxy.conf.json
{ "/api": { "target": "http://localhost:3979", "secure": false, "changeOrigin": true } }
```

```jsonc
// angular.json → projects.verso.architect.serve.options
"proxyConfig": "proxy.conf.json"
```

```ts
// src/environments/environment.ts (crear con: ng generate environments)
export const environment = { apiUrl: '/api' };
```

```ts
// src/app/app.config.ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/api/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
```

- [ ] `proxy.conf.json` + `environment.apiUrl`. **Nada de URLs escritas en el código** (reemplaza `global.ts`)
- [ ] `app.config.ts` con router (`withComponentInputBinding` para recibir `:id` / `:page` como `input()`) y HttpClient con interceptores
- [ ] Bootstrap 5 + Bootstrap Icons: `npm i bootstrap bootstrap-icons` y en `styles.css`:
      `@import 'bootstrap/dist/css/bootstrap.min.css'; @import 'bootstrap-icons/font/bootstrap-icons.css';`
- [ ] `assets/css/styles.css` del cliente viejo portado a `src/styles.css` (tema oscuro), ajustado a Bootstrap 5
- [ ] **No** se copian `assets/js/jquery-*.js` ni `assets/bootstrap/`
- [ ] Si se necesitan componentes JS de Bootstrap (dropdown, collapse): `@ng-bootstrap/ng-bootstrap`, o `bootstrap.bundle.min.js` en `angular.json → scripts`

### 5.3 Modelos tipados

```ts
// src/app/core/models/index.ts
export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export interface User   { _id: string; name: string; surname: string; email: string; role: Role; image: string | null; }
export interface Artist { _id: string; name: string; description: string; image: string | null; }
export interface Album  { _id: string; title: string; description: string; year: number; image: string | null; artist: string | Artist; }
export interface Song   { _id: string; number: string; name: string; duration: string; file: string | null; album: string | Album; }

export interface ArtistsPage { total_items: number; artists: Artist[]; }
export interface LoginRequest { email: string; password: string; gethash?: boolean; }
```

Las clases de `client/src/app/models/*.ts` con constructor posicional (`new Song("1", "", "", "", "")`) se
reemplazan por interfaces y objetos literales.

- [ ] Interfaces de `User`, `Artist`, `Album`, `Song` y de las respuestas de la API
- [ ] Ningún `any` en los servicios

### 5.4 Autenticación

```ts
// src/app/core/auth/auth-store.ts
import { Injectable, computed, signal } from '@angular/core';
import { User } from '../models';

const TOKEN_KEY = 'token';
const IDENTITY_KEY = 'identity';

function read<T>(key: string): T | null {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class AuthStore {
  // Compatible con la sesión del cliente viejo: 'token' se guardaba con JSON.stringify
  readonly token = signal<string | null>(read<string>(TOKEN_KEY));
  readonly identity = signal<User | null>(read<User>(IDENTITY_KEY));
  readonly isLoggedIn = computed(() => !!this.token());
  readonly isAdmin = computed(() => this.identity()?.role === 'ROLE_ADMIN');

  setSession(token: string, identity: User) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    this.token.set(token);
    this.identity.set(identity);
  }

  updateIdentity(identity: User) {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
    this.identity.set(identity);
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(IDENTITY_KEY);
    this.token.set(null);
    this.identity.set(null);
  }
}
```

```ts
// src/app/core/auth/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth-store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthStore).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
```

```ts
// src/app/core/api/error.interceptor.ts — cierra la sesión si el token vence
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth/auth-store';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) { auth.logout(); router.navigateByUrl('/'); }
      return throwError(() => err);
    }),
  );
};
```

```ts
// src/app/core/auth/guards.ts
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStore } from './auth-store';

export const authGuard: CanActivateFn = () =>
  inject(AuthStore).isLoggedIn() || inject(Router).createUrlTree(['/']);

export const adminGuard: CanActivateFn = () =>
  inject(AuthStore).isAdmin() || inject(Router).createUrlTree(['/artistas', 1]);
```

- [ ] `AuthStore` con signals y compatible con las claves `token` / `identity` existentes
- [ ] `authInterceptor` (reemplaza los `Headers` armados en cada método de cada servicio)
- [ ] `errorInterceptor` (401 → cerrar sesión). Los mensajes se leen de `err.error.message` (reemplaza los 18 `JSON.parse(error._body)`)
- [ ] `authGuard` y `adminGuard` en las rutas (hoy no hay guards)
- [ ] Componentes `features/auth/login` y `features/auth/register` (hoy están en `app.component`)

### 5.5 Servicios de API

```ts
// src/app/core/api/artist-api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Artist, ArtistsPage } from '../models';

@Injectable({ providedIn: 'root' })
export class ArtistApi {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  list(page: number)                      { return this.http.get<ArtistsPage>(`${this.base}/obtenerArtistas/${page}`); }
  get(id: string)                         { return this.http.get<{ artist: Artist }>(`${this.base}/obtenerArtista/${id}`); }
  create(artist: Partial<Artist>)         { return this.http.post<{ artist: Artist }>(`${this.base}/registarArtista`, artist); }
  update(id: string, a: Partial<Artist>)  { return this.http.put<{ artist: Artist }>(`${this.base}/actualizarArtista/${id}`, a); }
  remove(id: string)                      { return this.http.delete<{ artist: Artist }>(`${this.base}/eliminarArtista/${id}`); }
  uploadImage(id: string, file: File) {
    const body = new FormData();
    body.append('image', file, file.name);
    return this.http.post<{ artist: Artist }>(`${this.base}/actualizarImagenArtista/${id}`, body);
  }
  imageUrl(file: string | null)           { return file ? `${this.base}/obtenerImagenArtista/${file}` : null; }
}
```

- [ ] `UserApi` (registro, login, actualización, imagen)
- [ ] `ArtistApi`
- [ ] `AlbumApi`
- [ ] `SongApi` (subida con el campo **`file`**, no `image`)
- [ ] `UploadService` eliminado: cada API sube con `FormData` + `HttpClient`. Si se quiere barra de progreso: `reportProgress: true, observe: 'events'` con `withXhr()` (el backend Fetch no informa el progreso de subida)
- [ ] Ningún `.map(res => res.json())` ni `import 'rxjs/add/...'`

### 5.6 Rutas

```ts
// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/auth/guards';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home').then(m => m.Home) },
  { path: 'artistas/:page', canActivate: [authGuard], loadComponent: () => import('./features/artists/artist-list').then(m => m.ArtistList) },
  { path: 'crear-artista', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/artists/artist-form').then(m => m.ArtistForm) },
  { path: 'editar-artista/:id', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/artists/artist-form').then(m => m.ArtistForm) },
  { path: 'artista/:id', canActivate: [authGuard], loadComponent: () => import('./features/artists/artist-detail').then(m => m.ArtistDetail) },
  { path: 'crear-album/:artist', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/albums/album-form').then(m => m.AlbumForm) },
  { path: 'album/:id', canActivate: [authGuard], loadComponent: () => import('./features/albums/album-detail').then(m => m.AlbumDetail) },
  { path: 'editar-album/:id', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/albums/album-form').then(m => m.AlbumForm) },
  { path: 'mis-datos', canActivate: [authGuard], loadComponent: () => import('./features/user/user-edit').then(m => m.UserEdit) },
  { path: 'crear-tema/:album', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/songs/song-form').then(m => m.SongForm) },
  { path: 'editar-tema/:id', canActivate: [authGuard, adminGuard], loadComponent: () => import('./features/songs/song-form').then(m => m.SongForm) },
  { path: '**', redirectTo: 'artistas/1' },
];
```

> Las URLs públicas **no cambian**, así que los enlaces y marcadores existentes siguen funcionando.
> `player/:id` deja de ser una ruta: el reproductor pasa a ser un componente fijo en el layout (5.8).
> Angular 22 cambió el valor por defecto de `paramsInheritanceStrategy` a `'always'`. Con rutas planas como
> estas no afecta, pero tenlo en cuenta si agregas rutas hijas.

- [ ] Rutas con carga diferida (`loadComponent`)
- [ ] Guards aplicados según la tabla
- [ ] Formularios de alta y edición unificados (`artist-form`, `album-form`, `song-form`): de 6 componentes a 3
- [ ] `**` redirige en lugar de renderizar el listado

### 5.7 Componentes: patrón con signals (obligatorio por OnPush)

```ts
// src/app/features/artists/artist-list.ts
import { Component, computed, inject, input, numberAttribute } from '@angular/core';
import { RouterLink } from '@angular/router';
import { httpResource } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ArtistsPage } from '../../core/models';
import { AuthStore } from '../../core/auth/auth-store';
import { ArtistApi } from '../../core/api/artist-api';

const PAGE_SIZE = 4;

@Component({
  selector: 'app-artist-list',
  imports: [RouterLink],
  templateUrl: './artist-list.html',
})
export class ArtistList {
  readonly page = input(1, { transform: numberAttribute });   // :page de la URL
  protected readonly auth = inject(AuthStore);
  protected readonly api = inject(ArtistApi);

  protected readonly data = httpResource<ArtistsPage>(() => `${environment.apiUrl}/obtenerArtistas/${this.page()}`);
  protected readonly totalPages = computed(() => Math.ceil((this.data.value()?.total_items ?? 0) / PAGE_SIZE));

  remove(id: string) {
    this.api.remove(id).subscribe(() => this.data.reload());
  }
}
```

```html
<!-- src/app/features/artists/artist-list.html -->
@if (auth.isAdmin()) {
  <a routerLink="/crear-artista" class="btn btn-outline-light">Añadir artista</a>
}

@if (data.isLoading()) {
  <div class="spinner-border" role="status"></div>
} @else if (data.error()) {
  <div class="alert alert-danger">No se pudieron cargar los artistas.</div>
} @else {
  <div class="row g-3">
    @for (artist of data.value()?.artists; track artist._id) {
      <div class="col-6 col-md-3">
        <a [routerLink]="['/artista', artist._id]">
          <img class="img-fluid rounded" [src]="api.imageUrl(artist.image)" [alt]="artist.name" />
          <p>{{ artist.name }}</p>
        </a>
      </div>
    } @empty {
      <p>No hay artistas.</p>
    }
  </div>
}
```

> `httpResource` pasa por `HttpClient`, así que los interceptores (token, 401) también se aplican.

**Formularios:** el cliente actual usa `ngModel` (template-driven). Opciones en Angular 22:

| Opción | Cuándo |
|---|---|
| **Signal Forms** (estables en v22) | Recomendado para código nuevo; se integra con signals y OnPush. Comprueba la API exacta en angular.dev, porque cambió durante la fase experimental |
| Reactive Forms (`FormBuilder` + `toSignal(form.valueChanges)`) | Si el equipo ya la conoce; muy estable |
| Template-driven (`ngModel`) | Port 1:1 más rápido; funciona con OnPush porque los eventos de la plantilla marcan la vista |

Checklist de componentes:

- [ ] `App` (layout: navbar, menú lateral, `<router-outlet>`, reproductor)
- [ ] `Home`
- [ ] `Login` / `Register` (sacados de `app.component`)
- [ ] `ArtistList` (paginación con `totalPages`)
- [ ] `ArtistDetail` (artista + álbumes; borrar álbum con confirmación)
- [ ] `ArtistForm` (alta + edición + imagen)
- [ ] `AlbumDetail` (álbum + canciones; botón reproducir → `PlayerStore`)
- [ ] `AlbumForm` (alta + edición + imagen)
- [ ] `SongForm` (alta + edición + archivo de audio)
- [ ] `UserEdit` (datos + imagen; actualiza `AuthStore.identity`)
- [ ] Componente `Alert` compartido (reemplaza los `alertMessage` sueltos)
- [ ] Confirmación de borrado (hoy usa variables `confirmado`) → modal o `confirm()` simple
- [ ] Sin `*ngIf`/`*ngFor` (`ng generate @angular/core:control-flow` si se porta copiando plantillas)
- [ ] Ningún componente con `ChangeDetectionStrategy.Eager` (el antiguo `Default`): todo el estado en signals

### 5.8 Reproductor

Hoy `startPlayer` manipula el DOM con `document.getElementById` y guarda la canción en `localStorage.SOUND_SONG`.

```ts
// src/app/core/player/player-store.ts
import { Injectable, signal } from '@angular/core';
import { Song } from '../models';

@Injectable({ providedIn: 'root' })
export class PlayerStore {
  readonly current = signal<Song | null>(JSON.parse(localStorage.getItem('SOUND_SONG') ?? 'null'));

  play(song: Song) {
    localStorage.setItem('SOUND_SONG', JSON.stringify(song));
    this.current.set(song);
  }
}
```

```html
<!-- src/app/shared/player/player.html -->
@if (player.current(); as song) {
  <img [src]="albumImage(song)" alt="" />
  <span>{{ song.name }}</span>
  <audio #audio controls autoplay [src]="songUrl(song)"></audio>
}
```

- [ ] `PlayerStore` con signal; sin `document.getElementById`
- [ ] Componente `Player` en el layout (`App`), visible en todas las rutas
- [ ] `autoplay` al cambiar de canción (con `effect` + `viewChild('audio')` si hace falta llamar a `.play()`)
- [ ] Al recargar, recuerda la última canción (`SOUND_SONG`)

### 5.9 UI: Bootstrap 3 → 5

| Bootstrap 3 (actual) | Bootstrap 5 |
|---|---|
| `btn-default` | `btn-secondary` / `btn-outline-secondary` |
| `pull-right` / `pull-left` | `float-end` / `float-start` (mejor `d-flex justify-content-end`) |
| `jumbotron` | eliminado → `p-5 mb-4 bg-body-tertiary rounded-3` |
| `col-xs-*` | `col-*` |
| `img-responsive` | `img-fluid` |
| `panel`, `well` | `card` |
| `form-group` / `control-label` / `help-block` | `mb-3` / `form-label` / `form-text` |
| `label label-*` | `badge text-bg-*` |
| `hidden-xs` | `d-none d-sm-block` |
| `data-toggle` | `data-bs-toggle` |
| `glyphicon glyphicon-book` | `bi bi-book` |
| `glyphicon-cog` | `bi bi-gear` |
| `glyphicon-log-out` | `bi bi-box-arrow-right` |
| `glyphicon-music` | `bi bi-music-note-beamed` |
| `glyphicon-play` | `bi bi-play-fill` |
| `glyphicon-search` | `bi bi-search` |
| `glyphicon-star` | `bi bi-star-fill` |

- [ ] Las 9 vistas portadas con clases de Bootstrap 5
- [ ] Los 7 glyphicons reemplazados por Bootstrap Icons
- [ ] Clases propias con errores de ortografía corregidas o mantenidas a propósito (`clarefix`, `tittle`)
- [ ] Tema oscuro con `data-bs-theme="dark"` en `<html>` (soporte nativo de Bootstrap 5.3) en lugar de CSS a mano
- [ ] Diseño *responsive* comprobado a 375 px de ancho
- [ ] Accesibilidad: `alt` en las imágenes, `label` en los inputs, foco visible, contraste AA

### 5.10 (Opcional) API v2 con nombres limpios

Solo cuando el cliente viejo esté retirado. Montar en la API un segundo router `/api/v2` con rutas REST
(`GET /artists?page=1`, `POST /artists`, `PATCH /artists/:id`, …) que reutilice los mismos controladores, y
apuntar el cliente nuevo ahí. `/api` queda deprecado y se elimina en una versión posterior.

- [ ] Decisión tomada y anotada en la bitácora (hacer o no hacer)

### 5.11 Pruebas del cliente

```bash
ng test                 # Vitest
npm i -D @playwright/test && npx playwright install
```

- [ ] Pruebas unitarias de `AuthStore`, interceptores y guards
- [ ] Pruebas de cada servicio API con `provideHttpClientTesting()` + `HttpTestingController`
- [ ] Pruebas de componentes clave (`ArtistList`, `ArtistForm`)
- [ ] E2E con Playwright: login → listar artistas → crear artista con imagen → crear álbum → subir canción → reproducir → borrar
- [ ] Comparación visual con las capturas de la Fase 0.4

### 5.12 Cambio de cliente

```bash
git mv client legacy-client        # o eliminar si se acepta perder el historial en esa ruta
git mv client-next client
```

- [ ] Prueba completa de aceptación con el cliente nuevo contra la API nueva
- [ ] Cliente viejo movido a `legacy-client/` (se borra en la Fase 6)
- [ ] `client-next` renombrado a `client`
- [ ] `ng build` de producción sin avisos de *budget*

**Criterio de aceptación:** las pruebas E2E pasan y todas las funciones del checklist 0.4 se comportan igual o mejor.

**Reversión:** el cliente viejo sigue en `legacy-client/` y funciona con `nvm use 8` contra la API nueva.

---

## Fase 6 — Calidad, DevOps y documentación

### 6.1 Docker completo

```dockerfile
# api/Dockerfile
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
RUN mkdir -p uploads/users uploads/artists uploads/album uploads/song && chown -R node:node /app
USER node
EXPOSE 3979
HEALTHCHECK CMD wget -qO- http://localhost:3979/health || exit 1
CMD ["node", "src/index.js"]
```

```dockerfile
# client/Dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx ng build

FROM nginx:alpine
COPY --from=build /app/dist/verso/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf   # try_files $uri /index.html; + proxy /api → api:3979
```

```yaml
# docker-compose.yml (final)
services:
  mongo:
    image: mongo:8.0
    volumes: [mongo-data:/data/db]
    healthcheck:
      test: ["CMD", "mongosh", "--quiet", "--eval", "db.adminCommand('ping').ok"]
      interval: 10s
  api:
    build: ./api
    env_file: ./api/.env
    environment:
      MONGODB_URI: mongodb://mongo:27017/verso
    volumes: [uploads:/app/uploads]
    depends_on:
      mongo: { condition: service_healthy }
  client:
    build: ./client
    ports: ["8080:80"]
    depends_on: [api]
volumes:
  mongo-data:
  uploads:
```

- [ ] `api/Dockerfile` + `.dockerignore` (`node_modules`, `uploads`, `.env`)
- [ ] `client/Dockerfile` + `nginx.conf` (SPA fallback + proxy `/api`)
- [ ] `docker compose up --build` levanta todo y la app funciona en `http://localhost:8080`
- [ ] Volumen persistente para `uploads`

### 6.2 CI (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  api:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:8.0
        ports: ["27017:27017"]
    defaults: { run: { working-directory: api } }
    env:
      MONGODB_URI: mongodb://localhost:27017/verso_test
      JWT_SECRET: ci-secret
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: api/.nvmrc, cache: npm, cache-dependency-path: api/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm test
  client:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: client } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: client/.nvmrc, cache: npm, cache-dependency-path: client/package-lock.json }
      - run: npm ci
      - run: npx ng lint
      - run: npx ng test --watch=false
      - run: npx ng build
```

> Revisa las versiones mayores vigentes de `actions/checkout` y `actions/setup-node` al crear el workflow.

- [ ] Workflow de CI en verde para API y cliente
- [ ] Dependabot o Renovate configurado (`.github/dependabot.yml`) para npm, Docker y GitHub Actions
- [ ] Protección de la rama `master` (CI obligatorio)

### 6.3 Seguridad final

- [ ] `npm audit` limpio en API y cliente
- [ ] Ningún secreto en el repo (`git log -p | grep -i secret` y *secret scanning* de GitHub activo)
- [ ] El secreto JWT viejo `clave_secreta_curso` está en el historial de git: confirmar que se rotó (1.1)
- [ ] CORS restringido a los orígenes reales
- [ ] Usuario administrador creado por script, no por el registro público

### 6.4 Documentación y limpieza

- [ ] `README.md` raíz: badges y tabla de stack actualizados (Angular 22, Node 24, Express 5, MongoDB 8, Bootstrap 5, TypeScript)
- [ ] `api/README.md`: requisitos, variables de entorno, scripts, Docker. Quitar las notas de Node 8/10 y `bcrypt-nodejs`
- [ ] `client/README.md`: requisitos, proxy, scripts, pruebas. Quitar las notas de Angular CLI 1.x
- [ ] `.nvmrc` = `24` en `api/` y `client/` (o uno solo en la raíz)
- [ ] `legacy-client/` eliminado
- [ ] Este documento: fases 0–6 en 🟢 en el tablero y entrada en la bitácora (el estado global pasa a "Terminado" al cerrar la Fase 7)

---

## Fase 7 — Despliegue en Azure

**Objetivo:** publicar Verso en Azure con servicios gestionados, sin operar servidores ni Kubernetes. La API
queda **sin estado** (los archivos salen del disco del contenedor), así que puede tener varias réplicas.

```bash
git checkout -b migration/f7-azure
```

**Requisitos:** Fase 6 terminada (Docker, CI y `/health` funcionando), una suscripción de Azure y la CLI
`az` con sesión iniciada (`az login`). Revisa las versiones vigentes de los paquetes `@azure/*` antes de
instalarlos (regla R6).

### 7.1 Arquitectura en Azure

```
                    ┌──────────────────────────────┐
  Navegador ───────▶│ Static Web Apps (verso-web)  │  Angular 22 (archivos estáticos)
      │             └──────────────────────────────┘
      │  /api/*     ┌──────────────────────────────┐   Key Vault (JWT_SECRET, MONGODB_URI)
      ├────────────▶│ Container Apps (verso-api)   │◀── identidad administrada (verso-api-id)
      │             │ Node 24 + Express 5, 1–3 rép.│──▶ Azure DocumentDB (MongoDB 8.0)
      │             └──────────────┬───────────────┘──▶ Application Insights
      │   302 + SAS (lectura, 1 h) │
      └────────────────────────────▼
                    ┌──────────────────────────────┐
                    │ Blob Storage (users, artists,│  imágenes y audio; streaming con Range
                    │ album, song) — privado       │
                    └──────────────────────────────┘
```

| Pieza local (Fase 6) | Servicio Azure | Por qué |
|---|---|---|
| contenedor `api` | **Azure Container Apps** | Ejecuta el `Dockerfile` existente. Escalado HTTP, revisiones y HTTPS incluidos, sin gestionar Kubernetes |
| contenedor `mongo` | **Azure DocumentDB** (antes *Cosmos DB for MongoDB vCore*) | Compatible con el protocolo de MongoDB; Mongoose 9 funciona sin cambios. Alternativa: MongoDB Atlas en una región de Azure (ver 7.4) |
| volumen `uploads` | **Blob Storage** | Archivos fuera del contenedor: la API puede tener varias réplicas y el audio se sirve con peticiones `Range` (adelantar la canción) |
| contenedor `client` (nginx) | **Static Web Apps** | Un SPA estático no necesita cómputo; el plan Free incluye HTTPS y dominio propio |
| `api/.env` | **Key Vault** + identidad administrada | Ningún secreto en variables sueltas ni en el repo |
| logs de consola | **Application Insights** (OpenTelemetry) | Trazas de cada petición: Express → MongoDB → Blob |

**Fuera de alcance** (no aportan nada con una sola API en una sola región): AKS, Service Bus, Event Hubs,
Front Door multirregión. Se reconsideran si aparece trabajo en segundo plano (p. ej. transcodificar audio al
subirlo: Blob → Event Grid → Azure Functions).

### 7.2 Almacenamiento de archivos con drivers intercambiables

El código decide dónde guardar según `STORAGE_DRIVER`: `local` (disco, como hasta la Fase 6) o `azure`
(Blob Storage). En desarrollo, `azure` usa el emulador **Azurite**.

```bash
npm i @azure/storage-blob @azure/identity
```

```js
// src/config/env.js (agregar)
  STORAGE_DRIVER: process.env.STORAGE_DRIVER ?? 'local',              // 'local' | 'azure'
  AZURE_STORAGE_ACCOUNT: process.env.AZURE_STORAGE_ACCOUNT,           // en Azure (identidad administrada)
  AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING, // solo Azurite / local
```

```js
// src/services/storage/index.js
import { env } from '../../config/env.js';

export const storage = env.STORAGE_DRIVER === 'azure'
  ? await import('./azure-blob.js')
  : await import('./local-disk.js');
```

```js
// src/services/storage/local-disk.js — el comportamiento de las Fases 1.7 y 4.2
import path from 'node:path';
import { env } from '../../config/env.js';

export async function save(folder, file) {
  return file.filename;                       // multer.diskStorage ya lo escribió
}

export async function send(res, folder, name) {
  res.sendFile(name, { root: path.resolve(env.UPLOADS_DIR, folder) }, (err) => {
    if (err) res.status(404).send({ message: 'No existe el archivo' });
  });
}
```

```js
// src/services/storage/azure-blob.js
import path from 'node:path';
import crypto from 'node:crypto';
import { DefaultAzureCredential } from '@azure/identity';
import {
  BlobServiceClient, BlobSASPermissions, StorageSharedKeyCredential, generateBlobSASQueryParameters,
} from '@azure/storage-blob';
import { env } from '../../config/env.js';

const service = env.AZURE_STORAGE_CONNECTION_STRING
  ? BlobServiceClient.fromConnectionString(env.AZURE_STORAGE_CONNECTION_STRING)   // Azurite
  : new BlobServiceClient(`https://${env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net`, new DefaultAzureCredential());

const CONTENT_TYPES = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  mp3: 'audio/mpeg', ogg: 'audio/ogg',
};
const SAS_MINUTES = 60;
let delegationKey;                            // vale hasta 7 días; se pide uno nuevo cada 6 h

export async function save(folder, file) {
  const ext = path.extname(file.originalname).toLowerCase();
  const name = crypto.randomUUID() + ext;
  await service.getContainerClient(folder).getBlockBlobClient(name).uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: CONTENT_TYPES[ext.slice(1)] ?? 'application/octet-stream' },
  });
  return name;
}

async function readUrl(blob, folder, name) {
  const permissions = BlobSASPermissions.parse('r');
  const expiresOn = new Date(Date.now() + SAS_MINUTES * 60_000);
  if (service.credential instanceof StorageSharedKeyCredential) {
    return blob.generateSasUrl({ permissions, expiresOn });           // Azurite / clave de cuenta
  }
  if (!delegationKey || new Date(delegationKey.signedExpiresOn) < expiresOn) {
    delegationKey = await service.getUserDelegationKey(
      new Date(Date.now() - 5 * 60_000), new Date(Date.now() + 6 * 3_600_000));
  }
  const sas = generateBlobSASQueryParameters(
    { containerName: folder, blobName: name, permissions, expiresOn }, delegationKey, service.accountName);
  return `${blob.url}?${sas}`;
}

export async function send(res, folder, name) {
  if (name !== path.basename(name)) return res.status(404).send({ message: 'No existe el archivo' });
  const blob = service.getContainerClient(folder).getBlobClient(name);
  if (!(await blob.exists())) return res.status(404).send({ message: 'No existe el archivo' });
  res.redirect(302, await readUrl(blob, folder, name));
}
```

```js
// src/middlewares/upload.js (cambio): en Azure el archivo se queda en memoria y lo sube el controlador
const storage = env.STORAGE_DRIVER === 'azure'
  ? multer.memoryStorage()
  : multer.diskStorage({ /* igual que en 4.2 */ });
```

```js
// controlador (ejemplo: artist.uploadImage / artist.getImageFile)
import { storage } from '../services/storage/index.js';

const image = await storage.save('artists', req.file);
// … findByIdAndUpdate(id, { image }) como antes

export const getImageFile = (req, res) => storage.send(res, 'artists', req.params.imageFile);
```

> **Contrato (R1):** las rutas `obtenerImagen*` y `obtenerFileCancion` pasan de responder **200 con el
> archivo** a **302 hacia una URL firmada** de Blob Storage. `<img>` y `<audio>` siguen la redirección
> solos, así que el cliente no cambia. Las pruebas de humo que comprueban el archivo deben seguir la
> redirección (`supertest`: `.redirects(1)`). La URL firmada caduca en 1 h y solo permite lectura.

```yaml
# docker-compose.yml (agregar) — emulador de Blob Storage para desarrollo
  azurite:
    image: mcr.microsoft.com/azure-storage/azurite
    command: azurite-blob --blobHost 0.0.0.0 --loose
    ports: ["10000:10000"]
```

Para probar el driver `azure` en local, arranca Azurite con Compose y la API **en el host** (`npm run dev`) con
`STORAGE_DRIVER=azure` y `AZURE_STORAGE_CONNECTION_STRING=UseDevelopmentStorage=true`. La redirección apunta a
`http://127.0.0.1:10000/…`, que el navegador alcanza. Si la API corre dentro de Compose, la URL firmada apuntaría
a `azurite:10000` y el navegador no podría resolverla.

- [ ] `src/services/storage/{index,local-disk,azure-blob}.js`; los 4 controladores usan `storage.save` / `storage.send`
- [ ] `multer.memoryStorage()` cuando `STORAGE_DRIVER=azure` (los límites de tamaño de 4.2 se mantienen)
- [ ] Servicio `azurite` en `docker-compose.yml` y contenedores `users`, `artists`, `album`, `song` creados al arrancar (script o `createIfNotExists`)
- [ ] Pruebas de humo en verde con `STORAGE_DRIVER=local` **y** con `STORAGE_DRIVER=azure` contra Azurite
- [ ] Prueba: `GET /api/obtenerImagenArtista/..%2F..%2Fpackage.json` responde 404 con el driver `azure`
- [ ] Adelantar una canción en el reproductor funciona (Blob responde `206 Partial Content`)
- [ ] `.env.example` con `STORAGE_DRIVER`, `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_CONNECTION_STRING`

### 7.3 Recursos base

Variables usadas en el resto de la fase. Los nombres de ACR, Storage y Key Vault son **globales**: cámbialos
si ya existen. Elige una región que tenga Container Apps, DocumentDB y Static Web Apps.

```bash
RG=rg-verso
LOCATION=eastus2
ACR=versoacr$RANDOM          # solo minúsculas y números
ST=versost$RANDOM
KV=verso-kv-$RANDOM
ID=verso-api-id

az group create -n $RG -l $LOCATION
az acr create -g $RG -n $ACR --sku Basic
az identity create -g $RG -n $ID
ID_RES=$(az identity show -g $RG -n $ID --query id -o tsv)
ID_CLIENT=$(az identity show -g $RG -n $ID --query clientId -o tsv)
ID_PRINCIPAL=$(az identity show -g $RG -n $ID --query principalId -o tsv)

# Storage: sin acceso público ni claves compartidas; solo Microsoft Entra ID
az storage account create -g $RG -n $ST -l $LOCATION --sku Standard_ZRS --kind StorageV2 \
  --allow-blob-public-access false --allow-shared-key-access false --min-tls-version TLS1_2
ST_ID=$(az storage account show -g $RG -n $ST --query id -o tsv)

# Key Vault con RBAC
az keyvault create -g $RG -n $KV -l $LOCATION --enable-rbac-authorization true
KV_ID=$(az keyvault show -n $KV --query id -o tsv)
KV_URI=$(az keyvault show -n $KV --query properties.vaultUri -o tsv)

# Permisos de la identidad de la API
az role assignment create --assignee-object-id $ID_PRINCIPAL --assignee-principal-type ServicePrincipal \
  --role AcrPull --scope $(az acr show -n $ACR --query id -o tsv)
az role assignment create --assignee-object-id $ID_PRINCIPAL --assignee-principal-type ServicePrincipal \
  --role "Storage Blob Data Contributor" --scope $ST_ID
az role assignment create --assignee-object-id $ID_PRINCIPAL --assignee-principal-type ServicePrincipal \
  --role "Key Vault Secrets User" --scope $KV_ID

# Permisos para ti (subir archivos y escribir secretos)
ME=$(az ad signed-in-user show --query id -o tsv)
az role assignment create --assignee $ME --role "Storage Blob Data Contributor" --scope $ST_ID
az role assignment create --assignee $ME --role "Key Vault Secrets Officer" --scope $KV_ID

for c in users artists album song; do
  az storage container create --account-name $ST -n $c --auth-mode login
done
```

> Las asignaciones de rol tardan unos minutos en aplicarse. Si un comando siguiente devuelve 403, espera y repite.

- [ ] Grupo de recursos, ACR, identidad, Storage (4 contenedores privados) y Key Vault creados
- [ ] Roles asignados a la identidad: `AcrPull`, `Storage Blob Data Contributor`, `Key Vault Secrets User`
- [ ] Nombres reales anotados en la bitácora (ACR, Storage, Key Vault)

### 7.4 Base de datos: Azure DocumentDB

Crear el clúster desde el portal (**Azure DocumentDB**; en documentación anterior aparece como *Azure Cosmos DB
for MongoDB (vCore)*). El nombre del comando de la CLI cambió con el renombrado: si prefieres la CLI,
comprueba el vigente con `az find documentdb`.

| Opción | Valor |
|---|---|
| Versión de MongoDB | **8.0** (la misma que en local; si no está disponible, la más alta que ofrezca) |
| Nivel | *Free* para pruebas; el nivel de entrada de pago para uso real |
| Alta disponibilidad | Desactivada al principio; activarla si hay usuarios reales |
| Red | Acceso público con reglas de firewall: tu IP (para el restore) y *permitir servicios de Azure* (para Container Apps) |

Copia la cadena de conexión **tal como la da el portal** (con todos sus parámetros, como `tls=true`; no quites
ninguno) y sustituye usuario y contraseña.

```bash
# Cadena del portal, sin base de datos: para las herramientas de MongoDB
DOCDB_URI='mongodb+srv://<usuario>:<contraseña>@<host>/?tls=true&…'
# La misma cadena con /verso antes del "?": la que usa la API
MONGODB_URI_AZURE='mongodb+srv://<usuario>:<contraseña>@<host>/verso?tls=true&…'

# Desde la máquina con el MongoDB 8 local de la Fase 3
mongodump --uri="mongodb://localhost:27017" --db=verso --out=./backups/$(date +%F)-pre-azure
mongorestore --uri="$DOCDB_URI" --nsInclude='verso.*' ./backups/AAAA-MM-DD-pre-azure
```

```bash
az keyvault secret set --vault-name $KV -n mongodb-uri --value "$MONGODB_URI_AZURE"
az keyvault secret set --vault-name $KV -n jwt-secret  --value "$(openssl rand -base64 48)"
```

> **Alternativa — MongoDB Atlas en Azure:** si alguna consulta falla en DocumentDB (es compatible con el
> protocolo, pero no es el mismo servidor), crea un clúster de Atlas en la misma región de Azure. El resto de la
> fase no cambia: solo es otra `MONGODB_URI`. Anota la decisión en la bitácora.

- [ ] Clúster creado; versión y nivel anotados en la bitácora
- [ ] Restore sin errores y conteos por colección iguales a los de la Fase 3.2
- [ ] Índices creados con el script de la Fase 3.2 (`autoIndex: false` en producción), incluido el único de `email`
- [ ] Pruebas de humo de la API **local** contra DocumentDB en verde (`MONGODB_URI=$MONGODB_URI_AZURE npm test`)
- [ ] Secretos `mongodb-uri` y `jwt-secret` en Key Vault. El `jwt-secret` es nuevo: todas las sesiones se cierran (esperado)
- [ ] Regla de firewall de tu IP eliminada al terminar la migración de datos

### 7.5 Archivos existentes a Blob Storage

```bash
for c in users artists album song; do
  az storage blob upload-batch --account-name $ST --auth-mode login -d $c -s api/uploads/$c \
    --pattern '[!.]*' --overwrite false      # '[!.]*' omite .gitkeep
done
```

Los nombres de archivo no cambian, así que los campos `image` y `file` guardados en MongoDB siguen siendo
válidos.

- [ ] Conteo de blobs por contenedor = conteo de archivos en `api/uploads/*` (sin `.gitkeep`)
- [ ] Una imagen y una canción antiguas se ven y suenan desde la app desplegada (7.6)

### 7.6 API en Azure Container Apps

```bash
TAG=$(git rev-parse --short HEAD)
az acr build -r $ACR -t verso-api:$TAG ./api

az monitor log-analytics workspace create -g $RG -n verso-logs -l $LOCATION
LOGS_ID=$(az monitor log-analytics workspace show -g $RG -n verso-logs --query customerId -o tsv)
LOGS_KEY=$(az monitor log-analytics workspace get-shared-keys -g $RG -n verso-logs --query primarySharedKey -o tsv)
az containerapp env create -g $RG -n verso-env -l $LOCATION \
  --logs-workspace-id $LOGS_ID --logs-workspace-key $LOGS_KEY

az containerapp create -g $RG -n verso-api --environment verso-env \
  --image $ACR.azurecr.io/verso-api:$TAG \
  --registry-server $ACR.azurecr.io --registry-identity $ID_RES \
  --user-assigned $ID_RES \
  --ingress external --target-port 3979 \
  --min-replicas 1 --max-replicas 3 \
  --cpu 0.5 --memory 1Gi \
  --secrets "jwt-secret=keyvaultref:${KV_URI}secrets/jwt-secret,identityref:$ID_RES" \
            "mongodb-uri=keyvaultref:${KV_URI}secrets/mongodb-uri,identityref:$ID_RES" \
  --env-vars NODE_ENV=production JWT_SECRET=secretref:jwt-secret MONGODB_URI=secretref:mongodb-uri \
             STORAGE_DRIVER=azure AZURE_STORAGE_ACCOUNT=$ST AZURE_CLIENT_ID=$ID_CLIENT \
             CORS_ORIGIN=https://PENDIENTE   # se completa en 7.7

API_URL=https://$(az containerapp show -g $RG -n verso-api --query properties.configuration.ingress.fqdn -o tsv)
curl -s $API_URL/health
```

Sondas de salud (*liveness* y *readiness*) contra `/health`: configúralas en el portal (Container App →
*Health probes*) o con un YAML (`az containerapp update --yaml`).

> - `AZURE_CLIENT_ID` le indica a `DefaultAzureCredential` qué identidad administrada usar.
> - `--min-replicas 1` evita el arranque en frío. Con `0` sale más barato, pero la primera petición tras un rato
>   sin uso tarda varios segundos (arranque de Node + conexión a MongoDB).
> - El `HEALTHCHECK` del `Dockerfile` lo ignora Container Apps; usa las sondas.

- [ ] Imagen construida en ACR con el tag del commit
- [ ] Container App en ejecución; `GET $API_URL/health` responde `{ "status": "ok" }`
- [ ] Secretos referenciados desde Key Vault (ningún valor secreto en `--env-vars`)
- [ ] Sondas de *liveness* y *readiness* contra `/health`
- [ ] Pruebas de humo contra `$API_URL` en verde
- [ ] Con 2 réplicas forzadas (`--min-replicas 2`): subir una imagen y verla funciona sin importar qué réplica atienda

### 7.7 Cliente en Azure Static Web Apps

```json
// client/public/staticwebapp.config.json — fallback del SPA (equivale al try_files de nginx)
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "/*.{css,js,ico,png,jpg,svg,webp,woff2}"]
  }
}
```

```ts
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://verso-api.<id>.<región>.azurecontainerapps.io/api',   // $API_URL/api
};
```

```bash
az staticwebapp create -g $RG -n verso-web -l $LOCATION --sku Free
WEB_URL=https://$(az staticwebapp show -g $RG -n verso-web --query defaultHostname -o tsv)

# CORS de la API: solo el origen del cliente
az containerapp update -g $RG -n verso-api --set-env-vars CORS_ORIGIN=$WEB_URL
```

El despliegue del cliente lo hace el workflow de 7.9. Para una primera prueba manual:

```bash
cd client && npx ng build
npx @azure/static-web-apps-cli deploy dist/verso/browser \
  --deployment-token "$(az staticwebapp secrets list -g $RG -n verso-web --query properties.apiKey -o tsv)" \
  --env production
```

> **Mismo origen (opcional):** con el plan *Standard* de Static Web Apps se puede enlazar la Container App como
> *backend* y llamar a `/api` sin CORS ni URL absoluta. Con el plan Free se usa la URL absoluta y CORS, como arriba.

- [ ] `staticwebapp.config.json` en `client/public/` (llega a `dist/` con `ng build`)
- [ ] `environment.prod.ts` apunta a `$API_URL/api`
- [ ] `CORS_ORIGIN` de la API = URL de Static Web Apps (y el dominio propio, si lo hay)
- [ ] Recargar el navegador en `/artistas/1` no da 404
- [ ] Checklist manual de la Fase 0.4 completo contra la app desplegada

### 7.8 Observabilidad con Application Insights

```bash
npm i @azure/monitor-opentelemetry
```

```js
// src/telemetry.js — se carga antes que el resto para que la instrumentación funcione
import { useAzureMonitor } from '@azure/monitor-opentelemetry';

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) useAzureMonitor();
```

```jsonc
// api/package.json — y el CMD del Dockerfile: ["node", "--import", "./src/telemetry.js", "src/index.js"]
"start": "node --import ./src/telemetry.js src/index.js"
```

```bash
az monitor app-insights component create -g $RG -a verso-insights -l $LOCATION \
  --workspace $(az monitor log-analytics workspace show -g $RG -n verso-logs --query id -o tsv)
AI_CONN=$(az monitor app-insights component show -g $RG -a verso-insights --query connectionString -o tsv)
az containerapp update -g $RG -n verso-api --set-env-vars APPLICATIONINSIGHTS_CONNECTION_STRING="$AI_CONN"

# Tope diario de ingesta para no llevarse sorpresas en la factura
az monitor log-analytics workspace update -g $RG -n verso-logs --quota 1
```

> **ES Modules:** la instrumentación automática de paquetes importados con `import` necesita registrar el *hook*
> de módulos de OpenTelemetry. Sigue la sección de ESM del README de `@azure/monitor-opentelemetry` para la
> versión que instales y comprueba el resultado en el *Application map* (regla R6).

- [ ] `src/telemetry.js` cargado con `--import` en `start` y en el `Dockerfile`
- [ ] En Application Insights → *Application map* aparecen la API, MongoDB y Blob Storage
- [ ] Una petición lenta se puede seguir de punta a punta en *Transaction search*
- [ ] Alerta por correo si la tasa de respuestas 5xx supera un umbral (p. ej. 5 % en 5 min)
- [ ] Tope diario de ingesta configurado en Log Analytics

### 7.9 Despliegue continuo (GitHub Actions con OIDC)

Sin secretos de larga duración: GitHub se autentica en Azure con una credencial federada.

```bash
APP_ID=$(az ad app create --display-name verso-github --query appId -o tsv)
az ad sp create --id $APP_ID
az ad app federated-credential create --id $APP_ID --parameters '{
  "name": "verso-master",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:CristianSifuentes/Verso:ref:refs/heads/master",
  "audiences": ["api://AzureADTokenExchange"]
}'
az role assignment create --assignee $APP_ID --role Contributor --scope $(az group show -n $RG --query id -o tsv)
```

> El `subject` distingue mayúsculas: debe coincidir con `owner/repo` tal como aparece en GitHub.

En GitHub → *Settings* → *Secrets and variables* → *Actions*, crear las **variables** `AZURE_CLIENT_ID`
(`$APP_ID`), `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, `ACR`, `RG` y el **secreto**
`SWA_DEPLOYMENT_TOKEN` (token de Static Web Apps de 7.7).

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [master]
permissions:
  id-token: write
  contents: read
jobs:
  api:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { ref: "${{ github.event.workflow_run.head_sha }}" }
      - uses: azure/login@v2
        with:
          client-id: ${{ vars.AZURE_CLIENT_ID }}
          tenant-id: ${{ vars.AZURE_TENANT_ID }}
          subscription-id: ${{ vars.AZURE_SUBSCRIPTION_ID }}
      - run: |
          TAG=$(git rev-parse --short HEAD)
          az acr build -r ${{ vars.ACR }} -t verso-api:$TAG ./api
          az containerapp update -g ${{ vars.RG }} -n verso-api --image ${{ vars.ACR }}.azurecr.io/verso-api:$TAG
  client:
    if: github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { ref: "${{ github.event.workflow_run.head_sha }}" }
      - uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.SWA_DEPLOYMENT_TOKEN }}
          action: upload
          app_location: client
          output_location: dist/verso/browser
```

> Revisa las versiones mayores vigentes de las acciones al crear el workflow (como en 6.2). Los jobs hacen
> checkout de `workflow_run.head_sha`, así que se despliega exactamente el commit que pasó CI.

- [ ] App registrada con credencial federada para `master` y rol `Contributor` sobre `rg-verso` (no sobre la suscripción)
- [ ] Variables y secreto creados en GitHub
- [ ] Un push a `master` con CI en verde despliega API y cliente sin pasos manuales
- [ ] Cada despliegue de la API crea una revisión nueva en Container Apps (`az containerapp revision list -g $RG -n verso-api -o table`)

### 7.10 Costos y seguridad

| Recurso | Plan inicial | Qué vigilar |
|---|---|---|
| Container Apps | Consumo, 1–3 réplicas | Tiene una cuota gratuita mensual; `--min-replicas 1` consume siempre una réplica |
| DocumentDB | Free (pruebas) / nivel de entrada | El nivel Free tiene límites de almacenamiento y sin SLA |
| Blob Storage | Standard ZRS | Almacenamiento + transferencia de salida del audio |
| Static Web Apps | Free | Límite de ancho de banda del plan |
| ACR | Basic | Borrar imágenes viejas (`az acr run --cmd "acr purge …"`) |
| Log Analytics / App Insights | Pago por GB | La partida que más sorprende: tope diario (7.8) |

Calcula el total en <https://azure.microsoft.com/pricing/calculator/> con tu región y anótalo en la bitácora.

- [ ] Presupuesto con alerta en *Cost Management* (`rg-verso`, p. ej. al 80 % y 100 % del monto elegido)
- [ ] Storage sin acceso público ni claves compartidas (`--allow-shared-key-access false` comprobado)
- [ ] Ningún secreto en variables de entorno de la Container App ni en GitHub, salvo el token de SWA
- [ ] Firewall de DocumentDB sin IPs personales
- [ ] (Opcional) Dominio propio en Static Web Apps y en la Container App, con certificado gestionado

**Criterio de aceptación:** la app desplegada pasa el checklist manual de la Fase 0.4 y las pruebas de humo
contra `$API_URL`; un push a `master` despliega solo; Application Insights muestra las peticiones de punta a
punta; y ningún secreto vive fuera de Key Vault (salvo el token de despliegue de SWA en GitHub).

**Reversión:**
- **API:** volver a desplegar la imagen anterior (cada imagen lleva el tag de su commit):
  `az containerapp update -g $RG -n verso-api --image $ACR.azurecr.io/verso-api:<tag anterior>`. Las imágenes
  disponibles se listan con `az acr repository show-tags -n $ACR --repository verso-api -o table`.
- **Todo Azure:** el entorno local de la Fase 6 (`docker compose up`) no se tocó. Los datos y archivos en
  Azure son copias; para eliminar todo: `az group delete -n $RG`. ⚠️ Antes, `mongodump` de DocumentDB y
  `az storage blob download-batch` si hubo altas en Azure que quieras conservar.

---

## 15. Apéndices

### A. Tabla de equivalencias rápida

| Antes | Después |
|---|---|
| `require()` / `module.exports` | `import` / `export` (ESM) |
| `nodemon index.js` | `node --watch --env-file-if-exists=.env src/index.js` |
| `body-parser` | `express.json()` / `express.urlencoded()` |
| cabeceras CORS manuales | `cors({ origin })` |
| `jwt-simple` + `moment` | `jsonwebtoken` con `expiresIn` |
| `bcrypt-nodejs` (callbacks) | `bcryptjs` (promesas) |
| `connect-multiparty` + `req.files.x.path` | `multer` + `req.file.filename` |
| `mongoose-pagination` `.paginate()` | `.skip().limit()` + `countDocuments()` |
| `findByIdAndRemove` / `.remove()` | `findByIdAndDelete` / `deleteMany()` |
| callback `(err, doc) =>` | `await` |
| `fs.exists` + `sendFile(path.resolve(x))` | `res.sendFile(name, { root })` |
| `/:param?` | `{/:param}` |
| `NgModule` + `declarations` | componentes standalone + `imports` |
| `HttpModule` / `Http` / `Headers` | `provideHttpClient()` + interceptores |
| `.map(res => res.json())` | `http.get<T>()` (JSON automático) |
| `import 'rxjs/add/operator/map'` | `pipe(map(...))` |
| `JSON.parse(error._body).message` | `(err as HttpErrorResponse).error.message` |
| `*ngIf` / `*ngFor` | `@if` / `@for (...; track x._id)` |
| propiedades mutables + `subscribe` | `signal()`, `computed()`, `httpResource()` |
| `ActivatedRoute.params.forEach` | `input()` + `withComponentInputBinding()` |
| `document.getElementById(...)` | `viewChild()` + binding en la plantilla |
| `XMLHttpRequest` + `FormData` | `HttpClient.post(url, formData)` |
| `GLOBAL.url` | `environment.apiUrl` + `proxy.conf.json` |
| Bootstrap 3 + jQuery en `index.html` | Bootstrap 5 por npm, sin jQuery |
| Glyphicons | Bootstrap Icons |
| Karma + Jasmine | Vitest |
| Protractor | Playwright |
| TSLint + codelyzer | angular-eslint |
| `.angular-cli.json` | `angular.json` |
| `api/uploads/` en disco + `sendFile` | Blob Storage + `302` a URL firmada (SAS) |
| `api/.env` con secretos | Key Vault + identidad administrada |
| `docker compose` en un servidor | Container Apps (API) + Static Web Apps (cliente) |
| `console.log` | Application Insights (OpenTelemetry) |

### B. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Pérdida de datos al migrar MongoDB | Baja | Alto | Dump verificado (0.2) + conteos comparados (3.2); el servidor viejo no se toca |
| Pérdida de archivos subidos (no están en git) | Media | Alto | `tar` en 0.2 + volumen persistente en 6.1 |
| Los usuarios no pueden iniciar sesión tras cambiar bcrypt | Baja | Alto | `bcryptjs` lee `$2a$`; prueba explícita en 4.2 |
| Todos los usuarios pierden la sesión al rotar el secreto | Segura | Bajo | Esperado y deseado (D1); avisar si hay usuarios reales |
| Usuarios que eran admin por D2 pierden permisos | Media | Medio | Decidir antes de la Fase 1 quién debe ser admin; script de promoción |
| Las vistas no se refrescan por OnPush (Angular 22) | Alta | Medio | Patrón signals obligatorio (5.7); E2E |
| Cambia el contrato de la API sin querer | Media | Alto | Regla R1 + pruebas de humo desde la Fase 0 |
| Versiones distintas de las de este plan al ejecutarlo | Alta | Bajo | Regla R6: comprobar con `npm view` y anotar en la bitácora |
| Node 8 no instala en el equipo actual | Media | Bajo | Docker `node:8` (0.1) |
| Una consulta de Mongoose no funciona en DocumentDB | Baja | Medio | Pruebas de humo contra DocumentDB antes de desplegar (7.4); alternativa MongoDB Atlas en Azure |
| Factura de Azure inesperada | Media | Medio | Presupuesto con alertas y tope de ingesta de logs (7.8, 7.10) |
| Archivos perdidos al pasar a Blob Storage | Baja | Alto | `upload-batch` sin sobrescribir + conteos (7.5); `api/uploads/` local se conserva |

### C. Comandos de referencia

```bash
# Versiones vigentes
npm view @angular/core dist-tags
npm view express dist-tags
npm view mongoose dist-tags
curl -s https://nodejs.org/dist/index.json | head -c 400

# MongoDB
docker compose up -d mongo
mongosh "mongodb://localhost:27017/verso" --eval 'db.getCollectionNames()'
mongodump  --uri="mongodb://localhost:27017" --db=verso --out=./backups/$(date +%F)
mongorestore --uri="mongodb://localhost:27017" --nsInclude='verso.*' ./backups/AAAA-MM-DD

# API
cd api && nvm use && npm run dev
npm test
npm audit

# Cliente
cd client && nvm use && npx ng serve        # http://localhost:4200 (proxy → :3979)
npx ng test
npx playwright test
npx ng build

# Buscar restos del código viejo
grep -rn "menssage\|bcrypt-nodejs\|jwt-simple\|moment\|multiparty\|paginate\|findByIdAndRemove\|\.remove(" api/src
grep -rn "@angular/http\|rxjs/add\|\*ngIf\|\*ngFor\|getElementById\|_body" client/src
```

### D. Fuentes oficiales

- Angular — guía de actualización: <https://angular.dev/update-guide>
- Angular — compatibilidad de versiones (Node / TypeScript / RxJS): <https://angular.dev/reference/versions>
- Angular — notas de versión: <https://github.com/angular/angular/blob/main/CHANGELOG.md>
- Angular 22, resumen de novedades: <https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0>
- Node.js — calendario de versiones: <https://nodejs.org/en/about/previous-releases>
- Express 5 — guía de migración: <https://expressjs.com/en/guide/migrating-5.html>
- Mongoose — guías de migración: <https://mongoosejs.com/docs/migrating_to_5.html> … <https://mongoosejs.com/docs/migrating_to_9.html>
- MongoDB — compatibilidad del driver de Node: <https://www.mongodb.com/docs/drivers/node/current/compatibility/>
- MongoDB — ciclo de vida: <https://www.mongodb.com/legal/support-policy/lifecycles>
- Bootstrap 5 — migración: <https://getbootstrap.com/docs/5.3/migration/>
- Bootstrap Icons: <https://icons.getbootstrap.com/>
- Azure Container Apps: <https://learn.microsoft.com/azure/container-apps/>
- Azure Container Apps — secretos desde Key Vault: <https://learn.microsoft.com/azure/container-apps/manage-secrets>
- Azure DocumentDB: <https://learn.microsoft.com/azure/documentdb/>
- Azure Blob Storage para JavaScript: <https://learn.microsoft.com/azure/storage/blobs/storage-quickstart-blobs-nodejs>
- SAS de delegación de usuario: <https://learn.microsoft.com/azure/storage/blobs/storage-blob-user-delegation-sas-create-javascript>
- Azurite: <https://learn.microsoft.com/azure/storage/common/storage-use-azurite>
- Azure Static Web Apps — configuración: <https://learn.microsoft.com/azure/static-web-apps/configuration>
- Azure Monitor OpenTelemetry para Node.js: <https://learn.microsoft.com/azure/azure-monitor/app/opentelemetry-enable?tabs=nodejs>
- GitHub Actions con OIDC en Azure: <https://learn.microsoft.com/azure/developer/github/connect-from-azure-openid-connect>
- Calculadora de precios de Azure: <https://azure.microsoft.com/pricing/calculator/>

---

## 16. Bitácora de avance

Agrega una fila al cerrar cada sesión de trabajo o fase. Anota aquí las decisiones (D14, 1.7, 5.10, …) y
cualquier versión distinta de las de este documento.

| Fecha | Fase | Qué se hizo | Decisiones / desviaciones | Commit / PR |
|---|---|---|---|---|
| 2026-10-20 | — | Plan de migración creado | Objetivo: Node 24, Express 5, Mongoose 9, MongoDB 8.0, Angular 22 | b6257f5 |
| 2026-10-20 | — | Proyecto renombrado de Musify a **Verso** | La base `curso_mean2` se renombra a `verso` en la Fase 3 (no antes, para no perder los datos locales) | |
| 2026-10-23 | — | Fase 7 (despliegue en Azure) agregada al plan | Container Apps + DocumentDB + Blob Storage + Static Web Apps + Key Vault + Application Insights. Archivos servidos con `302` a URL firmada (cambio de estado HTTP aceptado en R1) | |
| | | | | |
