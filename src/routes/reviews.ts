import { Router } from 'express';
import { reviewController } from '../controllers/reviewController';
import { authenticateAdmin } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createReviewSchema, updateReviewSchema } from '../utils/validation';

const router = Router();

// Public routes
router.get('/', reviewController.getProductReviews.bind(reviewController));
router.get('/:id', reviewController.getReviewById.bind(reviewController));
router.post(
  '/',
  validate(createReviewSchema),
  reviewController.createReview.bind(reviewController)
);

// Admin routes
router.get(
  '/admin/all',
  authenticateAdmin,
  reviewController.getAllReviews.bind(reviewController)
);

router.get(
  '/admin/statistics',
  authenticateAdmin,
  reviewController.getReviewStatistics.bind(reviewController)
);

router.put(
  '/admin/:id',
  authenticateAdmin,
  validate(updateReviewSchema),
  reviewController.updateReview.bind(reviewController)
);

router.delete(
  '/admin/:id',
  authenticateAdmin,
  reviewController.deleteReview.bind(reviewController)
);

// Product rating
router.get(
  '/product/:productId/rating',
  reviewController.getProductAverageRating.bind(reviewController)
);

export { router as reviewRoutes };

