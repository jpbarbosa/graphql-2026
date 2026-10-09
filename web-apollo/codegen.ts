import type { CodegenConfig } from '@graphql-codegen/cli'

// Apollo Client's own recommendation for data masking: the client preset's type-level
// masking stays off, and `mask` + `apolloUnmask` shape the types to match what Apollo
// removes at runtime (see src/apollo-client.d.ts).
const config: CodegenConfig = {
  schema: '../api/schema.graphql',
  documents: ['src/**/*.{ts,tsx}', '!src/gql/**'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/': {
      preset: 'client',
      presetConfig: { fragmentMasking: false },
      config: {
        avoidOptionals: { field: true, inputValue: false },
        defaultScalarType: 'unknown',
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        inlineFragmentTypes: 'mask',
        customDirectives: { apolloUnmask: true },
        enumsAsTypes: true,
        useTypeImports: true,
      },
    },
    './src/gql/possible-types.ts': {
      plugins: ['fragment-matcher'],
      config: { useExplicitTyping: true },
    },
  },
}

export default config
