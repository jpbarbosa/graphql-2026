import { resolve } from 'node:path'
import { generate } from '@graphql-codegen/cli'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import codegenConfig from './codegen.ts'

const schemaFile = resolve(import.meta.dirname, '../api/schema.graphql')
const sourceDir = resolve(import.meta.dirname, 'src')
const generatedDir = resolve(sourceDir, 'gql')

// `graphql-codegen --watch` needs Watchman or a polling watcher of its own; Vite already
// watches every file, so codegen reruns in-process from that watcher instead.
function graphqlCodegen(): Plugin {
  let running: Promise<string | null> | null = null
  let again = false
  const run = (): Promise<string | null> => {
    if (running) {
      again = true
      return running
    }
    running = generate({ ...codegenConfig, cwd: import.meta.dirname, silent: true }, true)
      .then(() => null, (error: Error) => error.message)
      .finally(() => {
        running = null
        if (again) {
          again = false
          void run()
        }
      })
    return running
  }
  const isInput = (file: string) =>
    file === schemaFile ||
    (file.startsWith(sourceDir) && /\.tsx?$/.test(file) && !file.startsWith(generatedDir) && !file.endsWith('routeTree.gen.ts'))

  return {
    name: 'graphql-codegen',
    async buildStart() {
      const error = await run()
      if (error) this.error(error)
    },
    configureServer(server) {
      // A failed run leaves the previous src/gql in place, so the page would keep working on
      // stale types. The overlay is replayed to every page that connects until a run passes.
      let lastError: string | null = null
      const showError = () =>
        lastError && server.ws.send({ type: 'error', err: { message: lastError, stack: '', plugin: 'graphql-codegen' } })
      server.ws.on('connection', showError)
      server.watcher.add(schemaFile)
      const onChange = async (file: string) => {
        if (!isInput(file)) return
        lastError = await run()
        if (lastError) {
          server.config.logger.error(lastError)
          showError()
        }
      }
      server.watcher.on('change', onChange).on('add', onChange).on('unlink', onChange)
    },
  }
}

// shared/ is reached through a workspace symlink and served from outside this root, where
// Vite's watcher does not look, so without this an edit there never reaches the browser.
function watchShared(): Plugin {
  return {
    name: 'watch-shared',
    configureServer(server) {
      server.watcher.add(resolve(import.meta.dirname, '../shared/src'))
    },
  }
}

// In Docker, Traefik terminates TLS for the app's hostname, so the HMR socket must be wss on
// 443 or the https page blocks it as mixed content.
const hmrHost = process.env.VITE_HMR_HOST

export default defineConfig({
  plugins: [
    graphqlCodegen(),
    watchShared(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT ?? 5174),
    strictPort: true,
    allowedHosts: ['graphql-2026-apollo.dev.jp7.io', 'localhost'],
    hmr: hmrHost ? { protocol: 'wss', host: hmrHost, clientPort: 443 } : undefined,
    proxy: process.env.API_ORIGIN ? { '/graphql': process.env.API_ORIGIN } : undefined,
  },
})
