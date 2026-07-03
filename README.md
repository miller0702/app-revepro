# EGW Mobile

App Expo React Native para lectura, audio/podcasts y videos (Plan Plata).

## Requisitos

- Node.js 20+
- pnpm 10+ (`corepack enable`)
- API [egw-api](https://github.com/tu-org/egw-api) en ejecución

## Entornos

Config en `src/config/environments/`. Ver [ENV.md](https://github.com/tu-org/egw-docs/blob/main/ENV.md).

| Comando | Ambiente |
|---------|----------|
| `pnpm start:dev` | development (Metro puerto **8003**) |
| `pnpm start:prod` | production |

## Instalación

```bash
pnpm install
pnpm start:dev
```

> **Expo Go:** el proyecto usa SDK 54. La versión de Expo Go en el teléfono debe coincidir.

## Credenciales (API con seed)

- `lector@egw.local` / `Lector123!`
