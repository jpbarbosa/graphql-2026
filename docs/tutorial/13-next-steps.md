# 13 · Next steps

> **Goal:** know what this demo leaves out on purpose, and where each piece would go.

Each item below is a chapter-sized addition. None of them changes what the earlier chapters
built, which is the point: a GraphQL schema grows by addition.

## Subscriptions over SSE

Yoga serves subscriptions over Server-Sent Events with no extra server: `createPubSub()`,
a `builder.subscriptionField('movieChanged', ...)` that subscribes to it, and the mutations
publishing after they commit. Relay takes a `subscribe` function next to `fetchGraphQL` in
`web/src/relay.ts`, and Apollo a link that understands `text/event-stream`. Open two tabs and
watch an edit in one appear in the other.

## Trusted documents (persisted queries)

Both clients know every operation at build time. The Relay compiler can write them to a
manifest (`persistConfig` in `relay.config.json`, which then sends a hash instead of the
text), GraphQL Codegen can do the same for Apollo, and Yoga's persisted operations plugin can
refuse anything not in the manifests. The public API then accepts exactly the queries your apps
ship, and nothing an attacker writes.

## `@defer` and `@stream`

Incremental delivery is still a draft in the spec (RFC 2 as of mid-2026), but Yoga and Relay
both implement it. The movie page could render the details at once and `@defer` the credits.
Treat it as experimental until the spec lands.

## Authentication and authorization

Put the user on the context in `createYoga({ context })`, then add
`@pothos/plugin-scope-auth` and declare who may call each mutation, field by field. Global IDs
and `node(id:)` make this matter: any object is reachable by ID, so authorization belongs on
the type, not on the query that happened to lead to it.

## Typed errors in the schema

`BAD_USER_INPUT` in `extensions` (chapter 07) is a convention. `@pothos/plugin-errors` makes
errors part of the schema instead (`CreateMoviePayload | ValidationError`), so clients see
them in their generated types.

## Federation

When the movie graph is one service among several, Hive Gateway or Apollo Router composes
subgraphs into one schema. The clients in this repo would not change: they only ever see a
schema.

## Production build

The API runs as `node src/server.ts` with `NODE_ENV=production` (no schema writing, no
GraphiQL if you turn it off). The web apps build with `npm run build --workspace web` to static
files any CDN can serve, with `/graphql` routed to the API as it is here.
