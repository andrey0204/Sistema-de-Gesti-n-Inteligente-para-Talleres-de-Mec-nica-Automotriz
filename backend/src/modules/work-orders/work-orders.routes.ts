import { Router } from 'express';
import * as workOrdersController from './work-orders.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  updateStatusSchema,
  assignMechanicSchema,
  workOrderIdParamSchema,
  listWorkOrdersQuerySchema,
} from './work-orders.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ query: listWorkOrdersQuerySchema }),
  workOrdersController.list,
);

router.get(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: workOrderIdParamSchema }),
  workOrdersController.getById,
);

router.post(
  '/',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ body: createWorkOrderSchema }),
  workOrdersController.create,
);

router.patch(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: workOrderIdParamSchema, body: updateWorkOrderSchema }),
  workOrdersController.update,
);

router.patch(
  '/:id/status',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: workOrderIdParamSchema, body: updateStatusSchema }),
  workOrdersController.updateStatus,
);

router.patch(
  '/:id/assign',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: workOrderIdParamSchema, body: assignMechanicSchema }),
  workOrdersController.assignMechanic,
);

export default router;
