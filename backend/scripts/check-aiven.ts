import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const backendDir = path.resolve(__dirname, '..');
const configPath = path.join(backendDir, '.env.production');

async function main(): Promise<void> {
  const content = await fs.readFile(configPath, 'utf8');
  // No cargar .env: esta comprobación debe apuntar únicamente al destino.
  const config = dotenv.parse(content);
  if (!config.AIVEN_PASSWORD?.trim()) {
    throw new Error('Completa AIVEN_PASSWORD en backend/.env.production y guarda el archivo.');
  }
  if (!/^[a-zA-Z0-9.-]+\.aivencloud\.com$/.test(config.AIVEN_HOST ?? '')) {
    throw new Error('Revisa AIVEN_HOST en backend/.env.production.');
  }
  const port = Number(config.AIVEN_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535 || !config.AIVEN_USER || !config.AIVEN_DATABASE) {
    throw new Error('Revisa el puerto, usuario y base de datos de Aiven.');
  }
  await fs.access(path.join(backendDir, 'prisma/aiven-ca.pem'));

  const connectionUrl = new URL(`mysql://${encodeURIComponent(config.AIVEN_USER)}:${encodeURIComponent(config.AIVEN_PASSWORD)}@${config.AIVEN_HOST}:${port}/${encodeURIComponent(config.AIVEN_DATABASE)}`);
  connectionUrl.searchParams.set('sslcert', 'aiven-ca.pem');
  connectionUrl.searchParams.set('sslaccept', 'strict');
  connectionUrl.searchParams.set('connection_limit', '5');
  connectionUrl.searchParams.set('connect_timeout', '15');

  const prisma = new PrismaClient({ datasources: { db: { url: connectionUrl.toString() } }, log: [] });
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    const tls = await prisma.$queryRaw<Array<{ Value: string }>>`SHOW SESSION STATUS LIKE 'Ssl_cipher'`;
    if (!tls[0]?.Value) throw new Error('La conexión no utilizó TLS.');

    // Guardar la URL solamente después de una conexión y una consulta correctas.
    if (await fs.readFile(configPath, 'utf8') !== content) {
      throw new Error('La configuración cambió durante la prueba. Ejecuta el comando de nuevo.');
    }
    const entry = `DATABASE_URL="${connectionUrl.toString()}"`;
    const updated = /^[ \t]*DATABASE_URL[ \t]*=.*$/m.test(content)
      ? content.replace(/^[ \t]*DATABASE_URL[ \t]*=.*$/m, () => entry)
      : `${content}\n${entry}\n`;
    await fs.writeFile(configPath, updated, { mode: 0o600 });
    console.log('Aiven: conexión, consulta y cifrado TLS correctos.');
    console.log('DATABASE_URL guardada en backend/.env.production sin mostrar credenciales.');
    console.log('Comprueba las tablas y el administrador con npm run db:verify:aiven.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Los errores de Prisma pueden contener datos de conexión: mostrar solo su código.
  const code = (error as { code?: string })?.code;
  if (code) {
    console.error(`No se completó la comprobación de Aiven (${code}). Revisa la configuración y la conexión.`);
  } else if (error instanceof Error && !(error.constructor.name.startsWith('Prisma'))) {
    console.error(error.message);
  } else {
    console.error('No se completó la comprobación de Aiven. Revisa la configuración y la conexión.');
  }
  process.exitCode = 1;
});
