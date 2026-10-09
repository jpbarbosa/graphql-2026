# 07 · Mutations

> **Goal:** create, update and delete movies, people and credits, with input validation that
> clients can show next to the right field.
> **Code:** `api/src/graphql/movie.ts`, `api/src/graphql/person.ts`, `api/src/graphql/credit.ts`,
> `api/src/graphql/builder.ts` (`badInput`).

## What you'll show

- The input/payload shape every mutation shares.
- A validation error with a machine-readable `field`.
- Why `addCredit` returns the movie and the person, not just the credit.

## Steps

### 1. One shape for every mutation

```ts
builder.relayMutationField(
  'createMovie',
  {
    inputFields: (t) => ({
      title: t.string({ required: true }),
      released: t.int({ required: true }),
      runtime: t.int(),
      rating: t.float(),
      tagline: t.string(),
      genreIds: t.globalIDList({ for: Genre }),
    }),
  },
  { resolve: async (_root, { input }, { db }) => { /* insert, return { movie } */ } },
  { outputFields: (t) => ({ movie: t.field({ type: Movie, resolve: (payload) => payload.movie }) }) },
)
```

That produces `createMovie(input: CreateMovieInput!): CreateMoviePayload!`. One `input`
argument keeps every mutation's variables a single object, and a payload *type* (not a bare
`Movie`) leaves room to return more later without breaking clients.

The full set:

| Mutation | Payload |
|---|---|
| `createMovie`, `updateMovie` | `movie` |
| `deleteMovie` | `deletedMovieId` |
| `createPerson`, `updatePerson` | `person` |
| `deletePerson` | `deletedPersonId` |
| `addCredit` | `credit`, `movie`, `person` |
| `removeCredit` | `deletedCreditId`, `movie`, `person` |

### 2. Partial updates

In `updateMovie` every field except `id` is optional, and absent and `null` mean different
things: absent leaves the column alone, `null` clears it. Pothos passes `undefined` for an
absent field and Drizzle's `set()` skips `undefined`, so the distinction survives untouched:

```ts
const { id, genreIds, title, released, ...rest } = input
await tx.update(movies).set({
  ...rest,
  ...(title != null && { title: title.trim() }),
  ...(released != null && { released }),
  updatedAt: new Date(),
})
```

`title` and `released` are required columns, so a `null` for them is ignored rather than
written.

### 3. Errors a form can use

```ts
export function badInput(field: string, message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: 'BAD_USER_INPUT', field } })
}
```

```json
{
  "errors": [{
    "message": "Rating goes from 0 to 10",
    "path": ["createMovie"],
    "extensions": { "code": "BAD_USER_INPUT", "field": "rating" }
  }],
  "data": null
}
```

Yoga replaces any unexpected error with `Unexpected error.`, so a stack trace or a SQL message
never reaches a client. A `GraphQLError` you throw on purpose passes through as written.

### 4. Return what changed

`addCredit` changes a movie's cast *and* a person's filmography. Returning both lets a client
select whatever its screens show of each and refresh them in the same round trip:

```graphql
mutation {
  addCredit(input: { movieId: "...", personId: "...", role: ACTOR, character: "Ripley" }) {
    movie { credits { person { name } } }
    person { credits { movie { title } } }
  }
}
```

Chapters 10 and 12 show both clients using this to update their cache without a refetch.

**On camera:** in GraphiQL, create a movie, add a credit, then send `rating: 12` and show the
error's `extensions.field`.

## Checkpoint

The create, update, add-credit and delete round trip works from GraphiQL, and
`deleteMovie(input: { id: "<a Person ID>" })` is rejected with `is not of type: Movie`.
