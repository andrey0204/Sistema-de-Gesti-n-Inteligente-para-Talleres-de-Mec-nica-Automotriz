import { Router } from 'express';
import * as remindersController from './maintenance-reminders.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createReminderSchema,
  updateReminderSchema,
  reminderIdParamSchema,
  listRemindersQuerySchema,
} from './maintenance-reminders.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ query: listRemindersQuerySchema }),
  remindersController.list,
);

router.get(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: reminderIdParamSchema }),
  remindersController.getById,
);

router.post(
  '/',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ body: createReminderSchema }),
  remindersController.create,
);

router.patch(
  '/:id',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: reminderIdParamSchema, body: updateReminderSchema }),
  remindersController.update,
);

router.patch(
  '/:id/complete',
  authorize('ADMIN', 'RECEPTIONIST'),
  validate({ params: reminderIdParamSchema }),
  remindersController.complete,
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  validate({ params: reminderIdParamSchema }),
  remindersController.remove,
);

export default router;
