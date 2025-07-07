import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.js';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

// All order routes require authentication
router.use(authenticateToken);

// Get all orders for the authenticated user
router.get('/', orderController.getOrders);

// Get specific order by ID
router.get('/:id', orderController.getOrder);

// Create new order (typically done automatically with subscription)
router.post('/', orderController.createOrder);

// Update order (notes, etc.) - only before cutoff time
router.put('/:id', orderController.updateOrder);

// Cancel order
router.post('/:id/cancel', orderController.cancelOrder);

// Lock order (admin/system use)
router.post('/:id/lock', orderController.lockOrder);

// Fulfill order (admin/system use)
router.post('/:id/fulfill', orderController.fulfillOrder);

export default router; 