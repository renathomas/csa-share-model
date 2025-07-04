import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller.js';
import { validate } from '../middlewares/validation.js';
import { authenticateToken } from '../middlewares/auth.js';
import { createSubscriptionSchema } from '../../../packages/shared/dist/schemas.js';

const router = Router();

// All subscription routes require authentication
router.use(authenticateToken);

router.post('/', validate(createSubscriptionSchema), subscriptionController.createSubscription);
router.get('/', subscriptionController.getUserSubscriptions);
router.get('/:id', subscriptionController.getSubscription);

export default router; 