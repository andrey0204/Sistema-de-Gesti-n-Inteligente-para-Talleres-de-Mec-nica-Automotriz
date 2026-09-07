import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Variables mínimas y deterministas: los tests no deben depender del .env
    // real ni de la base de datos. config/env.ts hace process.exit(1) si falta
    // alguna, así que se definen aquí antes de importar cualquier módulo.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'mysql://test:test@localhost:3306/mechanic_workshop_test',
      JWT_ACCESS_SECRET: 'test-access-secret-0123456789',
      JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.routes.ts', 'src/config/swagger.ts', 'src/server.ts'],
    },
  },
});
