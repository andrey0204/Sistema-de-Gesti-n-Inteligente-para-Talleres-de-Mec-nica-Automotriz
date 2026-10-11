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
      STORAGE_PROVIDER: 'local',
      DATABASE_URL: 'mysql://test:test@localhost:3306/mechanic_workshop_test',
      JWT_ACCESS_SECRET: 'test-access-secret-0123456789',
      JWT_REFRESH_SECRET: 'test-refresh-secret-0123456789',
      JWT_ACCESS_EXPIRATION: '15m',
      JWT_REFRESH_EXPIRATION: '7d',
    },
    coverage: {
      provider: 'v8',
      // Solo se mide lo que este alcance puede probar: lógica de negocio,
      // validación y middlewares. Los controladores, repositorios y rutas son
      // la frontera con Express y Prisma; cubrirlos exige pruebas de
      // integración contra una base de datos, que quedaron fuera de alcance.
      // Incluirlos aquí solo produciría un porcentaje engañoso.
      include: [
        'src/shared/**/*.ts',
        'src/middlewares/authenticate.ts',
        'src/middlewares/authorize.ts',
        'src/middlewares/validate.ts',
        'src/middlewares/error-handler.ts',
        'src/modules/**/*.service.ts',
        'src/modules/**/*.validator.ts',
        'src/modules/**/*.state-machine.ts',
      ],
    },
  },
});
