import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

const backendDir = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const actions = {
  migrate: [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
  status: [require.resolve('prisma/build/index.js'), 'migrate', 'status'],
  seed: ['--import', 'tsx', path.join(backendDir, 'prisma/seed.ts')],
  verify: ['--import', 'tsx', path.join(backendDir, 'scripts/verify-aiven.ts')],
};

try {
  const action = process.argv[2];
  if (!Object.hasOwn(actions, action)) throw new Error('Unknown Aiven command.');
  const config = dotenv.parse(fs.readFileSync(path.join(backendDir, '.env.production')));
  const url = new URL(config.DATABASE_URL);
  if (config.NODE_ENV !== 'production' || !url.hostname.endsWith('.aivencloud.com') ||
      url.hostname !== config.AIVEN_HOST || url.pathname !== `/${config.AIVEN_DATABASE}` ||
      url.protocol !== 'mysql:' || url.searchParams.get('sslaccept') !== 'strict' ||
      url.searchParams.get('sslcert') !== 'aiven-ca.pem') {
    throw new Error('The verified Aiven production configuration is required. Run db:check:prod first.');
  }
  const child = spawn(process.execPath, actions[action], {
    cwd: backendDir,
    // La configuración del destino prevalece sobre las variables del entorno local.
    env: { ...process.env, ...config },
    stdio: 'inherit',
  });
  child.once('error', () => {
    console.error('Could not run the Aiven command.');
    process.exitCode = 1;
  });
  child.once('exit', code => { process.exitCode = code ?? 1; });
} catch {
  console.error('Revisa backend/.env.production y ejecuta db:check:prod antes de preparar Aiven.');
  process.exitCode = 1;
}
