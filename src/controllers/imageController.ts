import { Request, Response } from 'express';
import { CloudinaryService } from '../services/cloudinaryService';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types/api';

export class ImageController {
  /**
   * Upload a single image
   */
  static uploadImage = asyncHandler(async (req: Request, res: Response) => {
    console.log('📤 Image upload request received');
    
    if (!req.file) {
      return res.status(400).json({
        error: {
          code: 'NO_FILE',
          message: 'No image file provided.',
        },
      });
    }

    try {
      const uploadResult = await CloudinaryService.uploadImage(req.file, {
        folder: req.body.folder || 'ecommerce/products',
        public_id: req.body.public_id,
      });

      const imageResponse = CloudinaryService.toProductImageResponse(uploadResult);

      const response: ApiResponse = {
        data: imageResponse,
      };

      console.log('✅ Image uploaded successfully:', imageResponse.id);
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  });

  /**
   * Upload multiple images
   */
  static uploadMultipleImages = asyncHandler(async (req: Request, res: Response) => {
    console.log('📤 Multiple images upload request received');
    
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_FILES',
          message: 'No image files provided.',
        },
      });
    }

    try {
      const files = req.files as Express.Multer.File[];
      const uploadResults = await CloudinaryService.uploadMultipleImages(files, {
        folder: req.body.folder || 'ecommerce/products',
      });

      const imageResponses = uploadResults.map(result => 
        CloudinaryService.toProductImageResponse(result)
      );

      const response: ApiResponse = {
        data: imageResponses,
      };

      console.log('✅ Multiple images uploaded successfully:', imageResponses.length);
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ Error uploading multiple images:', error);
      throw error;
    }
  });

  /**
   * Delete an image
   */
  static deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;
    
    console.log('🗑️ Image deletion request received:', publicId);

    if (!publicId) {
      return res.status(400).json({
        error: {
          code: 'NO_PUBLIC_ID',
          message: 'No public ID provided.',
        },
      });
    }

    try {
      const deleteResult = await CloudinaryService.deleteImage(publicId);

      const response: ApiResponse = {
        data: {
          deleted: deleteResult.result === 'ok',
          public_id: publicId,
          result: deleteResult,
        },
      };

      console.log('✅ Image deleted successfully:', publicId);
      res.status(200).json(response);
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  });

  /**
   * Get optimized image URL
   */
  static getOptimizedImageUrl = asyncHandler(async (req: Request, res: Response) => {
    const { publicId } = req.params;
    const { size = 'medium', transformations } = req.query;
    
    console.log('🔄 Optimized image URL request received:', { publicId, size });

    if (!publicId) {
      return res.status(400).json({
        error: {
          code: 'NO_PUBLIC_ID',
          message: 'No public ID provided.',
        },
      });
    }

    try {
      let url: string;
      
      if (size === 'thumbnail' || size === 'medium' || size === 'large') {
        url = CloudinaryService.getProductImageUrl(publicId, size as 'thumbnail' | 'medium' | 'large');
      } else {
        // Custom transformations
        const customTransformations = transformations ? JSON.parse(transformations as string) : {};
        url = CloudinaryService.getTransformedUrl(publicId, customTransformations);
      }

      const response: ApiResponse = {
        data: {
          public_id: publicId,
          url,
          size,
        },
      };

      console.log('✅ Optimized image URL generated:', url);
      res.status(200).json(response);
    } catch (error) {
      console.error('❌ Error generating optimized image URL:', error);
      throw error;
    }
  });
}
