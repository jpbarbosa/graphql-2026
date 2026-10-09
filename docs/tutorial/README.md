# graphql-2026: the tutorial

A step-by-step build of a full-stack GraphQL app, written to be read as a reference and
recorded as a video series. Each chapter is one episode: a goal, the steps with the code that
matters, an **On camera** note for what to show, and a checkpoint that proves it works.

The app is a movie graph: movies, people and the credits that connect them. It has full CRUD,
filtering through the URL, and a force-directed graph view, all served by one GraphQL API and
built twice: once on **Relay** (`web/`) and once on **Apollo Client 4** (`web-apollo/`).

| # | Chapter | What it teaches |
|---|---|---|
| 01 | [The stack](01-the-stack.md) | Why each piece, and the shape of the repo |
| 02 | [Workspace and Docker](02-workspace-and-docker.md) | npm workspaces, one compose file, no host ports |
| 03 | [The database](03-database.md) | Drizzle schema, migrations, a seed that is itself a graph |
| 04 | [The schema, code first](04-schema-code-first.md) | Pothos, the Node interface, global IDs, `schema.graphql` as the contract |
| 05 | [N+1 and DataLoader](05-n-plus-one.md) | Watching 348 queries become 5 |
| 06 | [Pagination and filters](06-pagination-and-filters.md) | Connections, `totalCount` on demand, filter inputs, `@oneOf` |
| 07 | [Mutations](07-mutations.md) | Relay-style input and payload, validation errors, deletes |
| 08 | [Relay: setup](08-relay-setup.md) | Compiler, Babel, router loaders, render-as-you-fetch |
| 09 | [Relay: fragments](09-relay-fragments.md) | Colocation, masking, pagination fragments, `@alias` |
| 10 | [Relay: mutations](10-relay-mutations.md) | Payload fragments, `@deleteRecord`, optimistic updates |
| 11 | [The graph view](11-graph-visualization.md) | A nested query is already a graph |
| 12 | [Apollo Client 4](12-apollo-client.md) | The same app, another philosophy |
| 13 | [Next steps](13-next-steps.md) | Subscriptions, trusted documents, `@defer`, auth |
| 14 | [Six degrees of Matt Damon](14-shortest-path.md) | Shortest path as a resolver, breadth-first in SQL, Relay vs `skipToken` |

## Run it

Copy `.env.example` to `.env` and put your Postgres user and password in it, then start:

```sh
cp .env.example .env
docker compose up -d
```

Then open <https://graphql-2026.dev.jp7.io> (Relay), <https://graphql-2026-apollo.dev.jp7.io>
(Apollo) and GraphiQL at <https://graphql-2026.dev.jp7.io/graphql>. The first boot installs
dependencies, creates the `graphql_2026` database on `shared-postgres` and seeds it.

## Conventions used in every chapter

- Commands run from the repository root unless a chapter says otherwise.
- Code blocks are excerpts. The file named above each one is the full version.
- "On camera" lines are direction for the recording: what to have on screen and what to say.
