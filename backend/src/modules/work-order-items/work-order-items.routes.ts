import { Router } from 'express';
import * as itemsController from './work-order-items.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  workOrderIdParamSchema,
  itemIdParamSchema,
  createItemSchema,
  updateItemSchema,
} from './work-order-items.validator';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: workOrderIdParamSchema }),
  itemsController.list,
);

router.post(
  '/',
  authorize('ADMIN', 'MECHANIC'),
  validate({ params: workOrderIdParamSchema, body: createItemSchema }),
  itemsController.create,
);

router.patch(
  '/:id',
  authorize('ADMIN', 'MECHANIC'),
  validate({ params: itemIdParamSchema, body: updateItemSchema }),
  itemsController.update,
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MECHANIC'),
  validate({ params: itemIdParamSchema }),
  itemsController.remove,
);

export default router;
