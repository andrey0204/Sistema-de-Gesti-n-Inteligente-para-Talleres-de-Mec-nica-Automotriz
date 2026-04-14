import { Router } from 'express';
import * as vehiclesController from './vehicles.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  listVehiclesQuerySchema,
} from './vehicles.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ query: listVehiclesQuerySchema }),
  vehiclesController.list,
);

router.get(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: vehicleIdParamSchema }),
  vehiclesController.getById,
);

router.post(
  '/',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ body: createVehicleSchema }),
  vehiclesController.create,
);

router.patch(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: vehicleIdParamSchema, body: updateVehicleSchema }),
  vehiclesController.update,
);

router.delete(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: vehicleIdParamSchema }),
  vehiclesController.remove,
);

export default router;
