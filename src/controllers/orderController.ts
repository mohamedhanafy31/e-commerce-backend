import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/orderService';
import { ApiResponse } from '../types/api';
import { OrderStatus } from '@prisma/client';

export class OrderController {
  /**
   * Get all orders (admin)
   */
  async getAllOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const status = req.query.status as OrderStatus | undefined;
      const searchTerm = req.query.search as string | undefined;

      const result = await orderService.getAllOrders(page, limit, {
        status,
        searchTerm,
      });

      const response: ApiResponse = {
        data: {
          orders: result.orders,
        },
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const order = await orderService.getOrderById(id);

      const response: ApiResponse = {
        data: { order },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const orderNumber = req.params.orderNumber;
      const order = await orderService.getOrderByNumber(orderNumber);

      const response: ApiResponse = {
        data: { order },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;

      const order = await orderService.updateOrderStatus(id, status as OrderStatus);

      const response: ApiResponse = {
        data: { order },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order statistics (admin)
   */
  async getOrderStatistics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await orderService.getOrderStatistics();

      const response: ApiResponse = {
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create order (checkout)
   */
  async createOrder(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const order = await orderService.createOrder(req.body);

      const response: ApiResponse = {
        data: { order },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();

