import { Router } from 'express';
import * as imagesController from './work-order-images.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { validate } from '../../middlewares/validate';
import { upload } from '../../middlewares/upload';
import { workOrderIdParamSchema, imageIdParamSchema } from './work-order-images.validator';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: workOrderIdParamSchema }),
  imagesController.list,
);

router.post(
  '/',
  authorize('ADMIN', 'RECEPTIONIST', 'MECHANIC'),
  validate({ params: workOrderIdParamSchema }),
  upload.single('image'),
  imagesController.upload,
);

router.delete(
  '/:id',
  authorize('ADMIN'),
  validate({ params: imageIdParamSchema }),
  imagesController.remove,
);

export default router;
