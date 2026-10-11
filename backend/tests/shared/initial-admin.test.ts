import { describe, expect, it } from 'vitest';
import { getInitialAdminConfig } from '../../src/config/initial-admin';

const production = { NODE_ENV: 'production', ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'strong-password-12345' };

describe('administrador inicial', () => {
  it('conserva las credenciales de demostración en desarrollo', () => {
    expect(getInitialAdminConfig({ NODE_ENV: 'development' })).toMatchObject({ email: 'admin@workshop.com', password: 'Admin123!' });
  });

  it('utiliza las credenciales propias del destino en producción', () => {
    expect(getInitialAdminConfig({ ...production, ADMIN_FULL_NAME: 'Administrador' })).toEqual({ email: 'admin@example.com', password: 'strong-password-12345', fullName: 'Administrador' });
  });

  it('impide que producción use un correo implícito', () => {
    expect(() => getInitialAdminConfig({ ...production, ADMIN_EMAIL: '' })).toThrow('email');
  });

  it('impide que producción use una contraseña implícita', () => {
    expect(() => getInitialAdminConfig({ ...production, ADMIN_PASSWORD: '' })).toThrow('password');
  });

  it('rechaza la contraseña fija de desarrollo en producción', () => {
    expect(() => getInitialAdminConfig({ ...production, ADMIN_PASSWORD: 'Admin123!' })).toThrow('password');
  });

  it('rechaza contraseñas multibyte que bcrypt truncaría', () => {
    expect(() => getInitialAdminConfig({ ...production, ADMIN_PASSWORD: 'á'.repeat(37) })).toThrow('password');
  });
});
