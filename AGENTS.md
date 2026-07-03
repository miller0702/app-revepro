# AGENTS.md — egw-mobile

Guía para agentes de IA en la app móvil **EGW Writings** (Expo React Native, offline-first).

## Contexto

App de lectura para usuarios finales (`LECTOR`): biblioteca de libros, podcasts/radio, videos. Consume **egw-api** con JWT Bearer y mantiene datos locales en SQLite para offline. Documentación de arquitectura y sync en **egw-docs**.

## Stack y requisitos

| Tecnología | Versión / nota |
|------------|----------------|
| Node.js | 20+ |
| pnpm | 10.24.0 (`.npmrc`: `node-linker=hoisted`) |
| Expo SDK | 54 |
| React Native | 0.81 |
| React | 19 |
| Expo Router | file-based routing |
| Zustand | estado global (auth, player, settings) |
| TanStack Query | 5 |
| expo-sqlite | offline local |
| expo-secure-store | tokens JWT |
| expo-audio / expo-video | reproducción |

Requiere **egw-api** en `http://localhost:8000/api/v1`. En dispositivo físico, cambiar `apiUrl` a la IP de la máquina en `development.ts`.

Expo Go debe coincidir con **SDK 54**.

## Comandos esenciales

```bash
pnpm install
pnpm start:dev    # Metro puerto 8003, EGW_ENV=development
pnpm android      # / pnpm ios
```

## Estructura del código

```
app/                      # rutas Expo Router
├── _layout.tsx           # auth gate, tema, mini player
├── (auth)/               # login, register, forgot-password
├── (tabs)/               # library, audio, videos, favorites, profile
├── (system)/             # maintenance, offline, unavailable
├── book/[id].tsx
├── reader/[id].tsx
├── podcast/[id].tsx
└── video/[id].tsx

src/
├── api/                  # client.ts + auth, library, streaming, sync
├── components/           # cards, AudioMiniPlayer, ReaderControls
├── components/skeletons/ # ContentSkeletons (carga obligatoria en listas/cards)
├── components/ui/        # Button, Input, Screen, Skeleton, SearchBar, etc.
├── config/environments/
├── db/                   # schema SQLite + helpers offline
├── hooks/                # useTheme
├── navigation/           # systemRoutes.ts
├── offline/              # syncService.ts (push/pull)
├── providers/            # AppThemeProvider
├── storage/              # AsyncStorage (lastSync, prefs)
├── stores/               # authStore, playerStore, settingsStore
├── theme/                # colors, tokens, navigationTheme
└── utils/
```

Convención: **rutas en `app/`**, lógica reutilizable en `src/`.

## Pantallas y estado

| Área | Estado |
|------|--------|
| Auth (login, registro, recuperar) | Completo |
| Biblioteca + búsqueda + sync | Completo |
| Detalle libro + descarga offline | Parcial (cola `download_queue` sin worker) |
| Lector HTML | Completo (usa API; offline desde SQLite pendiente) |
| Audio (radio + podcasts) + mini player | Completo |
| Videos + reproductor | Completo |
| Favoritos | Placeholder |
| Perfil (tema, tamaño fuente, logout) | Completo |
| Pantallas sistema (offline, maintenance) | Completo |

## Offline y sync

1. SQLite (`egw_offline.db`): `books`, `chapters`, `bookmarks`, `reading_progress`, `download_queue`.
2. Cambios locales con `synced = 0` → `POST /api/v1/sync/push`.
3. Pull remoto → `GET /api/v1/sync/state?since=<ISO8601>`.
4. Tokens en **SecureStore**; `lastSync` en AsyncStorage (prefijo `egw:`).

Ver flujo completo en [ARCHITECTURE.md](https://github.com/tu-org/egw-docs/blob/main/ARCHITECTURE.md).

## Convenciones de código

- Config por `EGW_ENV` + `app.config.ts` (`extra.egwEnv`).
- Auth: JWT en SecureStore; interceptor axios con refresh en 401.
- Theming: tokens en `src/theme/tokens.ts`; light/dark/system.
- TypeScript `strict: true`.
- Textos de UI en **español**.
- **Estados de carga:** en cards, listas y contenedores usar **skeleton** (`src/components/ui/Skeleton.tsx`, `src/components/skeletons/ContentSkeletons.tsx`). Prohibido `"Cargando..."` o `ActivityIndicator` como placeholder de layout. Ver [MOBILE-UI.md](https://github.com/tu-org/egw-docs/blob/main/MOBILE-UI.md) en egw-docs.
- No añadir ESLint/Prettier propios salvo que el proyecto los adopte; usar `pnpm lint` (`expo lint`).

Credencial seed: `lector@egw.local` / `Lector123!`

## Reglas para agentes

1. **Offline-first:** preferir guardar localmente y sincronizar; no asumir conectividad permanente.
2. Respetar contrato API en [openapi.yaml](https://github.com/tu-org/egw-docs/blob/main/openapi.yaml); cambios de sync requieren coordinación con egw-api.
3. Nuevas pantallas: seguir Expo Router (file-based) y componentes `ui/` existentes.
4. Media pesada: consumir URLs de la API (`GET /media/:id/url`), no embeber archivos grandes en la app.
5. Usar **pnpm**; no `npm install`.
6. Commits: Conventional Commits (ej. `fix(mobile): sync bookmark timestamp`).
7. Probar en simulador y, si aplica, dispositivo físico con IP local en config.
8. Mantener compatibilidad con Expo SDK 54; verificar dependencias nativas antes de añadir paquetes.
9. **Skeleton obligatorio** en cualquier card/lista/contenedor con datos async; ver [MOBILE-UI.md](https://github.com/tu-org/egw-docs/blob/main/MOBILE-UI.md) en egw-docs.

## Trabajo pendiente (referencia ROADMAP)

- Lector offline desde SQLite.
- Worker de `download_queue`.
- Favoritos conectados a API.
- Merge completo de datos en sync pull.
- Publicación TestFlight / Internal testing.

## Documentación externa

- [ARCHITECTURE.md](https://github.com/tu-org/egw-docs/blob/main/ARCHITECTURE.md) — flujo offline
- [DATABASE.md](https://github.com/tu-org/egw-docs/blob/main/DATABASE.md) — espejo SQLite
- [ENV.md](https://github.com/tu-org/egw-docs/blob/main/ENV.md)
