import { Router } from 'express';
import { ImageController } from '../controllers/imageController';
import { authenticateAdmin } from '../middleware/auth';
import { uploadSingleImage, uploadMultipleImages, handleUploadError } from '../middleware/upload';

const router = Router();

// All image routes require admin authentication
router.use(authenticateAdmin);

// Upload single image
router.post('/upload', uploadSingleImage, handleUploadError, ImageController.uploadImage);

// Upload multiple images
router.post('/upload-multiple', uploadMultipleImages, handleUploadError, ImageController.uploadMultipleImages);

// Delete image
router.delete('/:publicId', ImageController.deleteImage);

// Get optimized image URL
router.get('/:publicId/optimized', ImageController.getOptimizedImageUrl);

export { router as imageRoutes };
