import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
      console.log(`API docs available at http://localhost:${env.PORT}/docs`);
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
