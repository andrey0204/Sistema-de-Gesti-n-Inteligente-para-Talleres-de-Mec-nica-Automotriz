import { z } from 'zod/v4';

export function getInitialAdminConfig(source: NodeJS.ProcessEnv) {
  const production = source.NODE_ENV === 'production';
  const parsed = z.object({
    email: z.email(),
    password: z.string().min(production ? 12 : 8).refine(
      value => Buffer.byteLength(value, 'utf8') <= 72,
      'Password must not exceed 72 bytes',
    ),
    fullName: z.string().trim().min(2),
  }).safeParse({
    email: source.ADMIN_EMAIL || (production ? undefined : 'admin@workshop.com'),
    password: source.ADMIN_PASSWORD || (production ? undefined : 'Admin123!'),
    fullName: source.ADMIN_FULL_NAME || 'System Administrator',
  });
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map(issue => issue.path.join('.')))];
    throw new Error(`Invalid initial administrator configuration: ${fields.join(', ')}`);
  }
  return parsed.data;
}
