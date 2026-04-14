import { Router } from 'express';
import * as reportsController from './reports.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { periodQuerySchema } from './reports.validator';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'RECEPTIONIST'));

router.get(
  '/orders-by-period',
  validate({ query: periodQuerySchema }),
  reportsController.ordersByPeriod,
);

router.get(
  '/orders-by-status',
  reportsController.ordersByStatus,
);

router.get(
  '/vehicles-by-period',
  validate({ query: periodQuerySchema }),
  reportsController.vehiclesByPeriod,
);

router.get(
  '/clients-by-period',
  validate({ query: periodQuerySchema }),
  reportsController.clientsByPeriod,
);

export default router;
