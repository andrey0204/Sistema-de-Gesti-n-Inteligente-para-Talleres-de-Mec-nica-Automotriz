import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  listUsersQuerySchema,
} from './users.validator';

const router = Router();

// All routes require authentication + admin role
router.use(authenticate, authorize('ADMIN'));

router.get('/', validate({ query: listUsersQuerySchema }), usersController.list);
router.get('/:id', validate({ params: userIdParamSchema }), usersController.getById);
router.post('/', validate({ body: createUserSchema }), usersController.create);
router.patch('/:id', validate({ params: userIdParamSchema, body: updateUserSchema }), usersController.update);
router.delete('/:id', validate({ params: userIdParamSchema }), usersController.remove);
router.patch('/:id/restore', validate({ params: userIdParamSchema }), usersController.restore);

export default router;
