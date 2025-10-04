import { Router } from 'express';
import { categoryController } from '../controllers/categoryController';
import { authenticateAdmin } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createCategorySchema, updateCategorySchema } from '../utils/validation';

const router = Router();

// Public routes - Get categories
router.get('/', categoryController.getAllCategories.bind(categoryController));
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

// Admin routes - Manage categories
router.post(
  '/admin',
  authenticateAdmin,
  validate(createCategorySchema),
  categoryController.createCategory.bind(categoryController)
);

router.put(
  '/admin/:id',
  authenticateAdmin,
  validate(updateCategorySchema),
  categoryController.updateCategory.bind(categoryController)
);

router.delete(
  '/admin/:id',
  authenticateAdmin,
  categoryController.deleteCategory.bind(categoryController)
);

export { router as categoryRoutes };
