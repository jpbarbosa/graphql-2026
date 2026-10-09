import type { GraphQLCodegenDataMasking } from '@apollo/client/masking'

// Tells Apollo's hooks that the generated types are masked, so a parent's `data` hides the
// fields its children's fragments own, exactly as the runtime does with `dataMasking: true`.
declare module '@apollo/client' {
  export interface TypeOverrides extends GraphQLCodegenDataMasking.TypeOverrides {}
}
