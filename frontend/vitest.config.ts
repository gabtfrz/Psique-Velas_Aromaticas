import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

// Estende a configuração do Vite (plugins + alias @) e adiciona apenas o bloco `test`.
// O `defineConfig` de vitest/config tipa `test` nativamente, sem depender de augmentation.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './testes/setup.ts',
    },
  })
)
