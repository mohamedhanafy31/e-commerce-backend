import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ReviewResponse } from '../types/api';

export class ReviewService {
  /**
   * Get reviews for a product
   */
  async getProductReviews(productId: number): Promise<ReviewResponse[]> {
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      reviewText: review.reviewText || undefined,
      reviewerName: review.reviewerName || undefined,
      createdAt: review.createdAt.toISOString(),
    }));
  }

  /**
   * Get all reviews (admin)
   */
  async getAllReviews(filters?: {
    productId?: number;
    minRating?: number;
    maxRating?: number;
  }): Promise<ReviewResponse[]> {
    const reviews = await prisma.review.findMany({
      where: {
        ...(filters?.productId && { productId: filters.productId }),
        ...(filters?.minRating && { rating: { gte: filters.minRating } }),
        ...(filters?.maxRating && { rating: { lte: filters.maxRating } }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      reviewText: review.reviewText || undefined,
      reviewerName: review.reviewerName || undefined,
      createdAt: review.createdAt.toISOString(),
      product: {
        id: review.product.id,
        name: review.product.name,
      },
    }));
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: number): Promise<ReviewResponse> {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      reviewText: review.reviewText || undefined,
      reviewerName: review.reviewerName || undefined,
      createdAt: review.createdAt.toISOString(),
      product: {
        id: review.product.id,
        name: review.product.name,
      },
    };
  }

  /**
   * Create a review
   */
  async createReview(data: {
    productId: number;
    rating: number;
    reviewText?: string;
    reviewerName?: string;
  }): Promise<ReviewResponse> {
    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      throw new AppError(
        'Rating must be between 1 and 5',
        400,
        'INVALID_RATING'
      );
    }

    const review = await prisma.review.create({
      data: {
        productId: data.productId,
        rating: data.rating,
        reviewText: data.reviewText,
        reviewerName: data.reviewerName,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      reviewText: review.reviewText || undefined,
      reviewerName: review.reviewerName || undefined,
      createdAt: review.createdAt.toISOString(),
      product: {
        id: review.product.id,
        name: review.product.name,
      },
    };
  }

  /**
   * Update a review (admin)
   */
  async updateReview(
    id: number,
    data: {
      rating?: number;
      reviewText?: string;
      reviewerName?: string;
    }
  ): Promise<ReviewResponse> {
    // Check if review exists
    const existing = await prisma.review.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    // Validate rating if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      throw new AppError(
        'Rating must be between 1 and 5',
        400,
        'INVALID_RATING'
      );
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...(data.rating && { rating: data.rating }),
        ...(data.reviewText !== undefined && { reviewText: data.reviewText }),
        ...(data.reviewerName !== undefined && { reviewerName: data.reviewerName }),
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: review.id,
      productId: review.productId,
      rating: review.rating,
      reviewText: review.reviewText || undefined,
      reviewerName: review.reviewerName || undefined,
      createdAt: review.createdAt.toISOString(),
      product: {
        id: review.product.id,
        name: review.product.name,
      },
    };
  }

  /**
   * Delete a review (admin)
   */
  async deleteReview(id: number): Promise<void> {
    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError('Review not found', 404, 'REVIEW_NOT_FOUND');
    }

    await prisma.review.delete({
      where: { id },
    });
  }

  /**
   * Get average rating for a product
   */
  async getProductAverageRating(productId: number): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const result = await prisma.review.aggregate({
      where: { productId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      averageRating: result._avg.rating || 0,
      totalReviews: result._count.id,
    };
  }

  /**
   * Get review statistics (admin)
   */
  async getReviewStatistics(): Promise<{
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  }> {
    const [total, avgResult, reviews] = await Promise.all([
      prisma.review.count(),
      prisma.review.aggregate({
        _avg: {
          rating: true,
        },
      }),
      prisma.review.findMany({
        select: {
          rating: true,
        },
      }),
    ]);

    // Calculate rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((review) => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });

    return {
      totalReviews: total,
      averageRating: avgResult._avg.rating || 0,
      ratingDistribution: distribution,
    };
  }
}

export const reviewService = new ReviewService();

