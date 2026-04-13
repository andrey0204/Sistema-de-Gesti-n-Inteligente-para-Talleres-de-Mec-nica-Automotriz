import { Router } from 'express';
import * as clientsController from './clients.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createClientSchema,
  updateClientSchema,
  clientIdParamSchema,
  listClientsQuerySchema,
} from './clients.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ query: listClientsQuerySchema }),
  clientsController.list,
);

router.get(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: clientIdParamSchema }),
  clientsController.getById,
);

router.post(
  '/',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ body: createClientSchema }),
  clientsController.create,
);

router.patch(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: clientIdParamSchema, body: updateClientSchema }),
  clientsController.update,
);

router.delete(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: clientIdParamSchema }),
  clientsController.remove,
);

export default router;
