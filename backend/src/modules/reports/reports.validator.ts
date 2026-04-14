import { z } from 'zod/v4';

export const periodQuerySchema = z.object({
  from: z.coerce.date({ error: 'from date is required' }),
  to: z.coerce.date({ error: 'to date is required' }),
});
