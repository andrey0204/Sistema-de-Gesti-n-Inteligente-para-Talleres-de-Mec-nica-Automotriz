import type { Server } from 'node:http';
import bcrypt from 'bcrypt';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { getInitialAdminConfig } from '../src/config/initial-admin';

async function main(): Promise<void> {
  const config = getInitialAdminConfig(process.env);
  let server: Server | undefined;
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let baseUrl: string | undefined;
  try {
    const rows = await prisma.$queryRaw<Array<{ name: string }>>`SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`;
    const tables = new Set(rows.map(row => row.name));
    const expected = ['users', 'clients', 'vehicles', 'work_orders', 'work_order_items', 'work_order_images', 'maintenance_reminders', 'refresh_tokens', '_prisma_migrations'];
    if (expected.some(name => !tables.has(name))) throw new Error('Faltan tablas del sistema en Aiven.');
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN', deletedAt: null } });
    const admin = admins.find(user => user.email === config.email);
    if (!admin || !await bcrypt.compare(config.password, admin.password)) throw new Error('El administrador del destino no está preparado.');
    if (await bcrypt.compare('Admin123!', admin.password)) throw new Error('El administrador utiliza la contraseña de desarrollo.');
    console.log('Aiven: las ocho tablas del sistema y el historial de migraciones están presentes.');
    console.log(`Administradores activos: ${admins.length}. Contraseña propia del destino verificada con bcrypt.`);

    server = await new Promise<Server>((resolve, reject) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
      listener.once('error', reject);
    });
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('No se pudo iniciar la API de prueba.');
    baseUrl = `http://127.0.0.1:${address.port}`;
    const request = (route: string, options?: RequestInit) => fetch(`${baseUrl}${route}`, { ...options, signal: AbortSignal.timeout(15000) });
    const health = await request('/api/health');
    if (health.status !== 200) throw new Error('La API no responde a la comprobación de salud.');
    const response = await request('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: config.email, password: config.password }) });
    const login = await response.json();
    // Conservar los tokens para limpiar la sesión aunque falle una comprobación posterior.
    accessToken = login.data?.accessToken;
    refreshToken = login.data?.refreshToken;
    if (response.status !== 200 || login.data?.user.role !== 'ADMIN' || !accessToken || !refreshToken) throw new Error('Falló el inicio de sesión por HTTP.');
    const protectedRoute = await request('/api/users', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (protectedRoute.status !== 200) throw new Error('Falló el acceso a la ruta protegida del administrador.');
    console.log('API sobre Aiven: salud, inicio de sesión ADMIN y ruta protegida correctos.');
  } finally {
    try {
      if (refreshToken && accessToken && baseUrl) {
        const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ refreshToken }), signal: AbortSignal.timeout(15000) });
        if (logout.status !== 200) throw new Error('No se pudo cerrar la sesión de prueba.');
        console.log('Sesión de prueba cerrada.');
      }
    } finally {
      if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
      await prisma.$disconnect();
    }
  }
}

main().catch(() => {
  console.error('No se completó la verificación del destino. Revisa las migraciones y el administrador.');
  process.exitCode = 1;
});
