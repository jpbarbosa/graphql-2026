import { execFile } from 'node:child_process'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const run = promisify(execFile)
const relayCli = createRequire(import.meta.url).resolve('relay-compiler/cli.js')
const schemaFile = resolve(import.meta.dirname, '../api/schema.graphql')
const sourceDir = resolve(import.meta.dirname, 'src')

// `relay-compiler --watch` requires Watchman, which the node image does not ship, so the
// compiler reruns from Vite's own watcher on every change to a source file or to the schema.
function relayCompiler(): Plugin {
  let running: Promise<string | null> | null = null
  let again = false
  const compile = (): Promise<string | null> => {
    if (running) {
      again = true
      return running
    }
    running = run(process.execPath, [relayCli, '--output', 'quiet-with-errors'], { cwd: import.meta.dirname })
      .then(() => null, (error: { stdout?: string; stderr?: string }) => `${error.stdout ?? ''}${error.stderr ?? ''}`)
      .finally(() => {
        running = null
        if (again) {
          again = false
          void compile()
        }
      })
    return running
  }
  const isInput = (file: string) =>
    file === schemaFile || (file.startsWith(sourceDir) && /\.tsx?$/.test(file) && !file.includes('__generated__') && !file.endsWith('routeTree.gen.ts'))

  return {
    name: 'relay-compiler',
    async buildStart() {
      const error = await compile()
      if (error) this.error(error)
    },
    configureServer(server) {
      // A failed compile leaves the previous artifacts in place, so the page would keep working
      // on stale data. The overlay is replayed to every page that connects until a compile passes.
      let lastError: string | null = null
      const showError = () =>
        lastError && server.ws.send({ type: 'error', err: { message: lastError, stack: '', plugin: 'relay-compiler' } })
      server.ws.on('connection', showError)
      server.watcher.add(schemaFile)
      const onChange = async (file: string) => {
        if (!isInput(file)) return
        lastError = await compile()
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
    relayCompiler(),
    watchShared(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    babel({ plugins: ['relay'], presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: Number(process.env.VITE_PORT ?? 5173),
    strictPort: true,
    allowedHosts: ['graphql-2026.dev.jp7.io', 'localhost'],
    hmr: hmrHost ? { protocol: 'wss', host: hmrHost, clientPort: 443 } : undefined,
    proxy: process.env.API_ORIGIN ? { '/graphql': process.env.API_ORIGIN } : undefined,
  },
})
