import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/reviewService';
import { ApiResponse } from '../types/api';

export class ReviewController {
  /**
   * Get reviews for a product
   */
  async getProductReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = parseInt(req.query.productId as string, 10);
      
      if (!productId) {
        res.status(400).json({
          error: {
            code: 'MISSING_PRODUCT_ID',
            message: 'Product ID is required',
          },
        });
        return;
      }

      const reviews = await reviewService.getProductReviews(productId);
      
      const response: ApiResponse = {
        data: { reviews },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all reviews (admin)
   */
  async getAllReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters = {
        productId: req.query.productId ? parseInt(req.query.productId as string, 10) : undefined,
        minRating: req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined,
        maxRating: req.query.maxRating ? parseInt(req.query.maxRating as string, 10) : undefined,
      };

      const reviews = await reviewService.getAllReviews(filters);
      
      const response: ApiResponse = {
        data: { reviews },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const review = await reviewService.getReviewById(id);
      
      const response: ApiResponse = {
        data: { review },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create review
   */
  async createReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const review = await reviewService.createReview(req.body);
      
      const response: ApiResponse = {
        data: { review },
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update review (admin)
   */
  async updateReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const review = await reviewService.updateReview(id, req.body);
      
      const response: ApiResponse = {
        data: { review },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete review (admin)
   */
  async deleteReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await reviewService.deleteReview(id);
      
      const response: ApiResponse = {
        data: { message: 'Review deleted successfully' },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product average rating
   */
  async getProductAverageRating(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const productId = parseInt(req.params.productId, 10);
      const stats = await reviewService.getProductAverageRating(productId);
      
      const response: ApiResponse = {
        data: stats,
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get review statistics (admin)
   */
  async getReviewStatistics(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await reviewService.getReviewStatistics();
      
      const response: ApiResponse = {
        data: stats,
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const reviewController = new ReviewController();

