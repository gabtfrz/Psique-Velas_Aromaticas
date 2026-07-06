import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuração do Vite (build/dev). A configuração de testes fica em vitest.config.ts,
// que estende esta via mergeConfig — evita o conflito de tipos entre vite 8 e o vite
// aninhado do vitest ao declarar `test` aqui.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    // Não publicar source maps em produção: reduz a superfície de exposição do
    // código-fonte no DevTools (aba Sources). Não é segurança por si só, mas higiene.
    sourcemap: false,
    // Remove console.* e debugger do bundle de produção (evita vazar dados em log).
    // O Vite 8 minifica via oxc (rolldown); drop_console fica nas opções do minificador.
    rolldownOptions:
      process.env.NODE_ENV === 'production'
        ? { output: { minify: { compress: { dropConsole: true, dropDebugger: true } } } }
        : undefined,
  },
})
