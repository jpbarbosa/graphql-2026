# 10 · Relay: mutations

> **Goal:** mutations that update every screen showing the changed data, with no refetch and no
> hand-written cache code, plus one optimistic update for instant feedback.
> **Code:** `web/src/components/MovieForm.tsx`, `MovieCredits.tsx`, `AddCreditForm.tsx`,
> `web/src/pages/MovieDetailPage.tsx`.

## What you'll show

- Saving a movie and seeing the list row change, though only the form submitted.
- Adding a credit refreshing both the movie and the person.
- Removing a credit instantly, and rolling back when the server says no.
- Deleting a movie with `@deleteRecord`.

## Steps

### 1. Update through fragments

`web/src/components/MovieForm.tsx`:

```ts
const updateMutation = graphql`
  mutation MovieFormUpdateMutation($input: UpdateMovieInput!) {
    updateMovie(input: $input) {
      movie {
        ...MovieForm_movie
        ...MovieRow_movie
      }
    }
  }
`
```

The payload spreads the fragments of every component that shows a movie. Relay normalizes the
response by `id` (a global ID, chapter 04) and merges it into the store; every component
subscribed to that record re-renders. The list row updates even though the list never ran a
query.

```ts
commitUpdate({
  variables: { input: { id: movie.id, ...fields } },
  onCompleted: () => setSaved(true),
  onError: (failure) => setError(failure.message),
})
```

`failure.message` is the server's `BAD_USER_INPUT` message, thanks to the network rule from
chapter 08.

### 2. A mutation that touches two records

`AddCreditForm.tsx` refreshes both ends of the new edge:

```graphql
mutation AddCreditFormMutation($input: AddCreditInput!) {
  addCredit(input: $input) {
    movie { ...MovieCredits_movie ...MovieRow_movie }
    person { ...PersonCredits_person }
  }
}
```

This is why chapter 07's payload returns `movie` and `person`: the client asks for exactly the
shape its screens render.

The form also creates people inline. When the search finds nobody, the picker offers
"+ Create", which runs `createPerson` and selects the result.

### 3. Optimistic removal

`MovieCredits.tsx`:

```ts
commitRemove({
  variables: { input: { id: creditId } },
  optimisticUpdater: (store) => {
    const record = store.get(movie.id)
    const credits = record?.getLinkedRecords('credits')
    if (record && credits) record.setLinkedRecords(credits.filter((credit) => credit.getDataID() !== creditId), 'credits')
  },
})
```

The updater edits the store before the request leaves. When the response arrives, Relay
discards the optimistic layer and applies the real payload; if the request fails, it discards
the layer and the credit reappears. The mutation itself:

```graphql
removeCredit(input: $input) {
  deletedCreditId @deleteRecord
  movie { ...MovieCredits_movie ...MovieRow_movie }
  person { ...PersonCredits_person }
}
```

### 4. Deleting a record

```graphql
deleteMovie(input: $input) {
  deletedMovieId @deleteRecord
}
```

`@deleteRecord` removes the record from the store. One consequence: a cached list still has an
edge pointing at it, now with a `null` node, until its next fetch. `MovieList` filters those
out:

```ts
const movies = data.movies.edges.flatMap((edge) => (edge.node ? [edge.node] : []))
```

Relay also has `@deleteEdge(connections: [...])` to remove the edge itself, but it needs the ID
of every cached connection, and this list has one per filter combination. Filtering plus
`store-and-network` on the list route is simpler and always correct.

**On camera:** open a movie, hover a cast member, click ×. It vanishes before the request
finishes (slow the network to "Slow 4G" in DevTools to make it visible). Then edit the title,
save, go back to the list and show the new title already there.

## Checkpoint

Create a movie, add a director and an actor (creating the actor inline), rename it, remove the
actor, delete the movie. Every screen agrees at every step without a reload, and none of the
edits is followed by a refetch: each mutation's own response carried the new data.
