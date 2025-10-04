import { Router } from 'express';
import { ProductController } from '../controllers/productController';
import { authenticateAdmin } from '../middleware/auth';
import { validate, validateQuery } from '../utils/validation';
import { 
  createProductSchema, 
  updateProductSchema, 
  paginationSchema 
} from '../utils/validation';

const router = Router();

// Admin product routes (authentication required) - must come before /:id route
router.use('/admin', authenticateAdmin); // All admin routes below require authentication

router.get('/admin', validateQuery(paginationSchema), ProductController.getAdminProducts);
// Get single product for admin (includes inactive)
router.get('/admin/:id', ProductController.getProductById);
router.post('/admin', validate(createProductSchema), ProductController.createProduct);
router.put('/admin/:id', validate(updateProductSchema), ProductController.updateProduct);
router.delete('/admin/:id', ProductController.deleteProduct);
router.put('/admin/:id/stock', ProductController.updateStock);

// Public product routes (no authentication required)
router.get('/', validateQuery(paginationSchema), ProductController.getProducts);
router.get('/search', validateQuery(paginationSchema), ProductController.searchProducts);
router.get('/:id', ProductController.getProductById);

export { router as productRoutes };
