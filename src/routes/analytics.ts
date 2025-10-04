import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController';
import { authenticateAdmin } from '../middleware/auth';

const router = Router();

// All analytics endpoints require admin authentication
router.get(
  '/dashboard',
  authenticateAdmin,
  analyticsController.getDashboardStats.bind(analyticsController)
);

router.get(
  '/sales',
  authenticateAdmin,
  analyticsController.getSalesData.bind(analyticsController)
);

router.get(
  '/top-products',
  authenticateAdmin,
  analyticsController.getTopProducts.bind(analyticsController)
);

router.get(
  '/revenue-by-category',
  authenticateAdmin,
  analyticsController.getRevenueByCategory.bind(analyticsController)
);

router.get(
  '/order-status',
  authenticateAdmin,
  analyticsController.getOrderStatusDistribution.bind(analyticsController)
);

router.get(
  '/low-stock',
  authenticateAdmin,
  analyticsController.getLowStockProducts.bind(analyticsController)
);

router.get(
  '/recent-reviews',
  authenticateAdmin,
  analyticsController.getRecentReviews.bind(analyticsController)
);

export { router as analyticsRoutes };

