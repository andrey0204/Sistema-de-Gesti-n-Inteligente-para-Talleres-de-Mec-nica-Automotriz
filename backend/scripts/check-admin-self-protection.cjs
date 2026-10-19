// Comprobación HTTP local con datos sintéticos: no conecta con MySQL.
// Requiere compilar antes con npm run build.
const { createRequire } = require('node:module');
const path = require('node:path');
const requireBackend = createRequire(path.resolve(__dirname, '../package.json'));
Object.assign(process.env, {
  NODE_ENV: 'test',
  DOTENV_CONFIG_QUIET: 'true',
  DATABASE_URL: 'mysql://test:test@127.0.0.1:3306/mechanic_workshop_test',
  JWT_ACCESS_SECRET: 'temporary-test-access-secret-2026',
  JWT_REFRESH_SECRET: 'temporary-test-refresh-secret-2026',
  STORAGE_PROVIDER: 'local',
  CORS_ORIGIN: 'http://localhost:5173',
});
const repository = requireBackend('./dist/modules/users/users.repository');
let writes = 0;
repository.findById = async id => ({ id, email: `user${id}@example.com`, fullName: 'Usuario de prueba', role: id === 1 ? 'ADMIN' : 'MECHANIC', deletedAt: null });
repository.update = async (id, data) => { writes++; return { id, ...data }; };
repository.softDelete = async id => { writes++; return { id, deletedAt: new Date() }; };
const app = requireBackend('./dist/app').default;
const { prisma } = requireBackend('./dist/config/database');
const jwt = requireBackend('jsonwebtoken');
const admin = jwt.sign({ id: 1, email: 'user1@example.com', role: 'ADMIN' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
const mechanic = jwt.sign({ id: 2, email: 'user2@example.com', role: 'MECHANIC' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '5m' });
async function main() {
  let server;
  try {
    server = await new Promise((resolve, reject) => {
      const listener = app.listen(0, '127.0.0.1', error => error ? reject(error) : resolve(listener));
      listener.once('error', reject);
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    const request = (path, method, body, token = admin) => fetch(base + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(5000),
    });
    for (const role of ['MECHANIC', 'RECEPTIONIST']) {
      const result = await request('/api/users/1', 'PATCH', { role, actorId: 2 });
      const payload = await result.json();
      if (result.status !== 403 || payload.error?.code !== 'FORBIDDEN' || writes !== 0) throw new Error('cambio del rol propio');
    }
    const selfDelete = await request('/api/users/1', 'DELETE', { actorId: 2 });
    if (selfDelete.status !== 403 || writes !== 0) throw new Error('baja propia');
    console.log('HTTP: rol propio y baja propia rechazados con 403, sin escrituras; actorId del cuerpo no suplanta al JWT.');
    const ownProfile = await request('/api/users/1', 'PATCH', { fullName: 'Nombre actualizado', role: 'ADMIN' });
    if (ownProfile.status !== 200 || writes !== 1) throw new Error('perfil propio permitido');
    const otherRole = await request('/api/users/2', 'PATCH', { role: 'RECEPTIONIST' });
    if (otherRole.status !== 200 || writes !== 2) throw new Error('rol de otra cuenta');
    const otherDelete = await request('/api/users/2', 'DELETE');
    if (otherDelete.status !== 200 || writes !== 3) throw new Error('baja de otra cuenta');
    console.log('HTTP: perfil propio y administración de otra cuenta permitidos con 200.');
    const unauthorized = await request('/api/users/2', 'DELETE', undefined, '');
    const forbidden = await request('/api/users/2', 'DELETE', undefined, mechanic);
    if (unauthorized.status !== 401 || forbidden.status !== 403 || writes !== 3) throw new Error('autenticación y roles');
    console.log('HTTP: sin sesión 401; mecánico 403. Datos y escrituras simulados; sin consultas a MySQL.');
  } catch (error) {
    console.error('Falló la comprobación HTTP local: ' + error.message);
    process.exitCode = 1;
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await prisma.$disconnect();
  }
}

main().catch(() => { console.error('No se completó la comprobación HTTP local.'); process.exitCode = 1; });
