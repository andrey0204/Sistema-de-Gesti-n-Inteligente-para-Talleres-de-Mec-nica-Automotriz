import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Zona horaria fija: buena parte de lo que se prueba aquí son las
    // conversiones entre los campos «solo fecha» que el backend guarda a
    // medianoche UTC y el día del calendario colombiano (UTC-5). Sin fijarla,
    // los tests pasarían o fallarían según la máquina que los corra.
    env: {
      TZ: 'America/Bogota',
    },
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/composables/**/*.ts'],
    },
  },
})
