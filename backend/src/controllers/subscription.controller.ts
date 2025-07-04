import { type Request, type Response, type NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service.js';
import { type AuthenticatedRequest } from '../middlewares/auth.js';

export class SubscriptionController {
  async createSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const subscriptionData = {
        ...req.body,
        userId: req.user.id
      };

      const subscription = await subscriptionService.createSubscription(subscriptionData);
      
      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: subscription
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubscription(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const subscriptionId = req.params.id;
      if (!subscriptionId) {
        return res.status(400).json({
          success: false,
          error: 'Subscription ID is required'
        });
      }
      
      const subscription = await subscriptionService.getSubscriptionById(subscriptionId);
      
      res.status(200).json({
        success: true,
        data: subscription
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserSubscriptions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const subscriptions = await subscriptionService.getUserSubscriptions(req.user.id);
      
      res.status(200).json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subscriptionController = new SubscriptionController(); 