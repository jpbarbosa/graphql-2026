# graphql-2026

A full-stack GraphQL demo: a movie graph with CRUD, URL-driven filters and a force-directed
graph view, served by one API and built twice, on **Relay** and on **Apollo Client 4**, so the
two clients can be compared file by file.

The step-by-step guide, written for reference and for recording a video series, is in
[`docs/tutorial/`](docs/tutorial/README.md).

## Run

Copy `.env.example` to `.env` and put your Postgres user and password in it, then start:

```sh
cp .env.example .env
docker compose up -d
```

| URL | What |
|---|---|
| https://graphql-2026.dev.jp7.io | web, the Relay client |
| https://graphql-2026-apollo.dev.jp7.io | web-apollo, the Apollo Client 4 client |
| https://graphql-2026.dev.jp7.io/graphql | the API, with GraphiQL in a browser |

It runs on this machine's shared infrastructure (see `~/Sites/CLAUDE.md`): Postgres is
`shared-postgres` on the `services` network and Traefik routes the hostnames over
`traefik-proxy`. No service publishes a host port. The first boot installs dependencies into
Docker volumes, creates the `graphql_2026` database and seeds it.

## Layout

| Folder | What |
|---|---|
| `api/` | Yoga + Pothos + Drizzle. `schema.graphql` is generated on boot and committed: it is the contract |
| `shared/` | React code that never touches GraphQL: UI kit, URL filters, graph model and canvas |
| `web/` | Relay 21 client (React 19, Vite 8, TanStack Router, Tailwind 4) |
| `web-apollo/` | The same app on Apollo Client 4 |
| `docs/tutorial/` | The guide, one chapter per episode |

## Everyday commands

| To | Run |
|---|---|
| follow the API log | `docker compose logs -f graphql-2026-api` |
| print every SQL statement | `LOG_SQL=1 docker compose up -d graphql-2026-api` |
| drop the database and reseed | `docker compose run --rm graphql-2026-migrate npm run db:reset --workspace api` |
| install after changing a `package.json` | `docker compose run --rm graphql-2026-install` |
| typecheck every workspace, on the host | `npm run typecheck` |

Changing the database schema: edit `api/src/db/schema.ts`, then
`npx --workspace api drizzle-kit generate` and restart `graphql-2026-migrate`.
