import type { Response } from 'express';
import { orderService } from '../services/order.service.js';
import { AppError } from '../middlewares/error-handler.js';
import type { AuthenticatedRequest } from '../middlewares/auth.js';

export async function getOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { limit = 20, offset = 0 } = req.query;
    const orders = await orderService.getUserOrders(userId, Number(limit), Number(offset));
    
    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get orders',
    });
  }
}

export async function getOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Order ID is required', 400);
    }
    
    const order = await orderService.getOrderById(id);
    
    // Verify ownership
    if (order.userId !== userId) {
      throw new AppError('Unauthorized to view this order', 403);
    }
    
    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get order',
    });
  }
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { subscriptionId, notes, addons } = req.body;
    
    // Note: In Phase 1, orders are created automatically when subscription is created
    // This endpoint is for manual order creation if needed
    
    res.json({
      success: true,
      message: 'Orders are created automatically with subscriptions',
    });
  } catch (error) {
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    });
  }
}

export async function updateOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Order ID is required', 400);
    }
    
    const { notes } = req.body;
    
    const updatedOrder = await orderService.updateOrder(id, userId, { notes });
    
    res.json({
      success: true,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update order',
    });
  }
}

export async function cancelOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Order ID is required', 400);
    }
    
    const cancelledOrder = await orderService.cancelOrder(id, userId);
    
    res.json({
      success: true,
      data: cancelledOrder,
    });
  } catch (error) {
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel order',
    });
  }
}

export async function lockOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Order ID is required', 400);
    }
    
    const lockedOrder = await orderService.lockOrder(id);
    
    res.json({
      success: true,
      data: lockedOrder,
    });
  } catch (error) {
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to lock order',
    });
  }
}

export async function fulfillOrder(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      throw new AppError('Order ID is required', 400);
    }
    
    const fulfilledOrder = await orderService.fulfillOrder(id);
    
    res.json({
      success: true,
      data: fulfilledOrder,
    });
  } catch (error) {
    res.status(error instanceof AppError ? error.statusCode : 500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fulfill order',
    });
  }
} 