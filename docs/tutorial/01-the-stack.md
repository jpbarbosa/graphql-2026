# 01 · The stack

> **Goal:** know what we are building, which tools we use and why each one earns its place.
> **Code:** the whole repo, at a glance.

## What you'll show

- The finished app: the movie list with filters, a movie page, the graph view.
- The repository layout and how a request travels through it.
- The one idea the series keeps returning to: **the schema is the contract**.

## The app

A small movie database whose data is a graph on purpose:

```
Person ──(ACTOR, as "Cobb")──▶ Movie ◀──(DIRECTOR)── Person
                                 │
                                 └── Genre
```

Every screen is a different walk over that graph: a list of movies with their directors, a
person's filmography, a movie's cast, and a force-directed view of all of it at once.

## The stack (October 2026)

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node 24 LTS, TypeScript run natively (`node src/server.ts`, restarted by nodemon) | Type stripping is stable; no `tsx`, no build step for the API |
| Server | GraphQL Yoga 5 on graphql-js 17 | Spec compliant, framework agnostic, ships GraphiQL |
| Schema | Pothos 4 (code first) + relay and dataloader plugins | The schema is inferred from TypeScript, with no codegen on the server |
| Database | Postgres 18 + Drizzle ORM | SQL-shaped query builder with typed rows |
| Web | React 19, Vite 8, TanStack Router, Tailwind 4, React Compiler | Typed routes with loaders, no manual memoization |
| Client A | Relay 21 | The compiler enforces the GraphQL way: colocated fragments and data masking |
| Client B | Apollo Client 4 | The most common client, with data masking turned on to compare like with like |
| Graph view | react-force-graph-2d | Canvas force layout that handles hundreds of nodes |
| Dev infra | Docker Compose, Traefik, a shared Postgres | Real HTTPS hostnames, no host ports |

## The repository

```
graphql-2026/
├── api/            GraphQL server: Drizzle schema, Pothos types, Yoga
│   └── schema.graphql   generated SDL, the contract both web apps compile against
├── shared/         client-agnostic React: UI kit, URL filters, graph model and canvas
├── web/            Relay client
├── web-apollo/     Apollo Client 4 client
├── docs/tutorial/  this series
└── compose.yaml    the whole stack
```

`shared/` holds everything that does not talk to GraphQL, so `web/` and `web-apollo/` differ
only in their data layer. Diff the two folders and you see exactly what a GraphQL client does.

## How a request travels

```
browser ── https://graphql-2026.dev.jp7.io/graphql ──▶ Traefik ──▶ graphql-2026-api:4000 (Yoga)
        └─ https://graphql-2026.dev.jp7.io/*        ──▶ Traefik ──▶ graphql-2026-web:5173 (Vite)
```

The page and the API share one origin, so there is no CORS to configure.

**On camera:** open the app, click through movies, a movie page and the graph. Then open
GraphiQL and run the default query. Say: "everything you just saw is one endpoint and one
schema; the rest of the series builds it from an empty folder."

## Checkpoint

You can name what each top-level folder owns, and where the schema file lives.
