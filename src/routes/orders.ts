import { Router } from 'express';
import { orderController } from '../controllers/orderController';
import { authenticateAdmin } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createCheckoutOrderSchema, updateOrderStatusSchema } from '../utils/validation';

const router = Router();

// Public routes
router.post(
  '/create',
  validate(createCheckoutOrderSchema),
  orderController.createOrder.bind(orderController)
);

router.get(
  '/track/:orderNumber',
  orderController.getOrderByNumber.bind(orderController)
);

// Admin routes
router.get(
  '/admin',
  authenticateAdmin,
  orderController.getAllOrders.bind(orderController)
);

router.get(
  '/admin/statistics',
  authenticateAdmin,
  orderController.getOrderStatistics.bind(orderController)
);

router.get(
  '/admin/:id',
  authenticateAdmin,
  orderController.getOrderById.bind(orderController)
);

router.put(
  '/admin/:id/status',
  authenticateAdmin,
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus.bind(orderController)
);

export { router as orderRoutes };

