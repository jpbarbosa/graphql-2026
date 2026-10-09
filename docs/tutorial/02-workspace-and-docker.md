# 02 · Workspace and Docker

> **Goal:** one repository, four npm workspaces, and a single `docker compose up` that runs it.
> **Code:** `package.json`, `compose.yaml`.

## What you'll show

- npm workspaces linking `shared/` into both web apps.
- Why every container mounts the source but keeps `node_modules` in a volume.
- Traefik labels giving each app a real HTTPS hostname with no published port.

## Steps

### 1. The workspace

`package.json` at the root declares the workspaces:

```json
{
  "name": "graphql-2026",
  "private": true,
  "type": "module",
  "workspaces": ["api", "shared", "web", "web-apollo"]
}
```

Each folder has its own `package.json`. `shared` is named `@graphql-2026/shared` and exports
source files directly (no build step), so Vite compiles it as part of each app:

```json
"exports": {
  "./ui": "./src/ui.tsx",
  "./filters": "./src/filters.ts",
  "./graph": "./src/graph.ts",
  "./GraphCanvas": "./src/GraphCanvas.tsx",
  "./GraphPanels": "./src/GraphPanels.tsx"
}
```

Use a scoped name for a local package. A bare name like `shared` exists on the public
registry, and a typo in a version range would install a stranger's package.

**On camera:** `ls node_modules/@graphql-2026` shows a symlink to `../../shared`.

### 2. One install, many services

`compose.yaml` defines a YAML anchor every Node service reuses:

```yaml
x-node: &node
  image: node:24.19.0-alpine
  working_dir: /app
  init: true
  volumes:
    - .:/app
    - node-modules:/app/node_modules
    - api-node-modules:/app/api/node_modules
    # ...one volume per workspace
```

The source is bind-mounted so edits on the Mac hot-reload inside the container. The
`node_modules` folders are named volumes, because the Mac's copies hold darwin binaries
(Rolldown, the Relay compiler, Tailwind's oxide engine) that cannot run on Linux.

A one-shot `graphql-2026-install` service runs `npm install` once, and every other service
waits for it to finish, so no two containers ever write `node_modules` at the same time:

```yaml
depends_on:
  graphql-2026-install:
    condition: service_completed_successfully
```

### 3. The boot order

```
graphql-2026-install ──▶ graphql-2026-migrate ──▶ graphql-2026-api
                     └─▶ graphql-2026-web
                     └─▶ graphql-2026-web-apollo
```

`graphql-2026-migrate` creates the database if it is missing, applies migrations and seeds an
empty database (chapter 03). The API starts only after it exits successfully.

### 4. Hostnames instead of ports

No service publishes a port. Traefik, already running on this machine with a wildcard
certificate for `*.dev.jp7.io`, routes by labels:

```yaml
labels:
  traefik.http.routers.graphql-2026-api.rule: >-
    (Host(`graphql-2026.dev.jp7.io`) || Host(`graphql-2026-apollo.dev.jp7.io`)) && PathPrefix(`/graphql`)
  traefik.http.routers.graphql-2026-api.priority: "200"
  traefik.http.services.graphql-2026-api.loadbalancer.server.port: "4000"
```

`/graphql` goes to the API on both hostnames; everything else goes to that hostname's Vite.
The higher priority on the API router is what makes the path rule win, while the API is up.

Traefik drops a container's routers while its healthcheck is still starting or failing. Then
the web router is the only one left that matches, and Vite answers `/graphql` with the app's
`index.html`: a 200 on the wrong page, which is the hardest kind of outage to spot. So the web
routers exclude the path outright, and an API that is down shows as Traefik's 404:

```yaml
traefik.http.routers.graphql-2026-web.rule: Host(`graphql-2026.dev.jp7.io`) && !PathPrefix(`/graphql`)
```

The API's healthcheck also sets `start_interval: 1s`, so after a restart the route comes back
as soon as the server answers, instead of after the first regular 15 second interval.

Vite's hot reload socket must then be `wss` on 443, or the HTTPS page blocks it as mixed
content. Each `vite.config.ts` reads that from the environment:

```ts
hmr: hmrHost ? { protocol: 'wss', host: hmrHost, clientPort: 443 } : undefined,
```

### 5. Restarting the API on save

Node has a built-in `node --watch`, but in these containers it misses saves done by writing a
new file and renaming it over the old one, which is how `sed -i`, Vim and JetBrains' "safe
write" save. On this Docker mount, Node's watcher follows each file by inode and loses it when
the inode is replaced. Vite never has this problem because it watches through chokidar, so the
API does too, through nodemon:

```json
"dev": "nodemon --quiet --watch src --ext ts --exec 'node src/server.ts'"
```

Node still runs the TypeScript itself; nodemon only decides when to restart it.

### 6. Service names carry the project prefix

The containers join the shared `traefik-proxy` network, where Docker registers each service
name as a DNS alias. Two projects with a service called `web` on that network would get a
silent round-robin between them, so every service here is `graphql-2026-*`.

**On camera:** `docker compose up -d`, then `docker compose ps`. Open both hostnames.

### 7. Credentials stay out of the repository

The database URLs carry a password, so they live in `.env`, which is gitignored. Compose reads
it automatically, and refuses to start without it rather than falling back to a default:

```yaml
DATABASE_URL: ${DATABASE_URL:?set DATABASE_URL in .env, see .env.example}
```

`.env.example` is committed with placeholders, so a fresh clone knows exactly what to fill in.

## Running it somewhere else

The compose file expects two external networks and a Postgres named `shared-postgres`, which
is this machine's setup. Elsewhere, add a `postgres:18` service with that container name,
drop the external networks, and publish ports `4000`, `5173` and `5174`.

## Checkpoint

```sh
docker compose ps --format '{{.Service}}\t{{.Status}}'
curl -s https://graphql-2026.dev.jp7.io/graphql -H 'content-type: application/json' \
  -d '{"query":"{ genres { name } }"}'
```

The API reports `healthy` and the query returns the genres.
