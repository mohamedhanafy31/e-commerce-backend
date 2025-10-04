import { Router } from 'express';
import { tagController } from '../controllers/tagController';
import { authenticateAdmin } from '../middleware/auth';
import { validate } from '../utils/validation';
import { createTagSchema, updateTagSchema } from '../utils/validation';

const router = Router();

// Public routes - Get tags
router.get('/', tagController.getAllTags.bind(tagController));
router.get('/:id', tagController.getTagById.bind(tagController));

// Admin routes - Manage tags
router.post(
  '/admin',
  authenticateAdmin,
  validate(createTagSchema),
  tagController.createTag.bind(tagController)
);

router.put(
  '/admin/:id',
  authenticateAdmin,
  validate(updateTagSchema),
  tagController.updateTag.bind(tagController)
);

router.delete(
  '/admin/:id',
  authenticateAdmin,
  tagController.deleteTag.bind(tagController)
);

export { router as tagRoutes };
