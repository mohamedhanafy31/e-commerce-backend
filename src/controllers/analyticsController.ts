import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService';
import { ApiResponse } from '../types/api';

export class AnalyticsController {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await analyticsService.getDashboardStats();

      const response: ApiResponse = {
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get sales data
   */
  async getSalesData(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const days = parseInt(req.query.days as string, 10) || 30;
      const salesData = await analyticsService.getSalesData(days);

      const response: ApiResponse = {
        data: { salesData },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get top products
   */
  async getTopProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const topProducts = await analyticsService.getTopProducts(limit);

      const response: ApiResponse = {
        data: { topProducts },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get revenue by category
   */
  async getRevenueByCategory(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categoryRevenue = await analyticsService.getRevenueByCategory();

      const response: ApiResponse = {
        data: { categoryRevenue },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order status distribution
   */
  async getOrderStatusDistribution(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const distribution = await analyticsService.getOrderStatusDistribution();

      const response: ApiResponse = {
        data: { distribution },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const threshold = parseInt(req.query.threshold as string, 10) || 10;
      const products = await analyticsService.getLowStockProducts(threshold);

      const response: ApiResponse = {
        data: { products },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get recent reviews
   */
  async getRecentReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 5;
      const reviews = await analyticsService.getRecentReviews(limit);

      const response: ApiResponse = {
        data: { reviews },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();

