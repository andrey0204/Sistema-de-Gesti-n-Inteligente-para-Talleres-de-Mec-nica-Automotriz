import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { loginSchema, refreshSchema } from './auth.validator';

const router = Router();

router.post('/login', validate({ body: loginSchema }), authController.login);
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);
router.post('/logout', authenticate, validate({ body: refreshSchema }), authController.logout);

export default router;
