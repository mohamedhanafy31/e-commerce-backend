import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';
import { 
  CloudinaryUploadResult, 
  CloudinaryUploadOptions, 
  CloudinaryDeleteResult,
  ProductImageResponse 
} from '../types/cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class CloudinaryService {
  /**
   * Upload an image to Cloudinary
   */
  static async uploadImage(
    file: Express.Multer.File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      console.log('📤 Uploading image to Cloudinary:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        folder: options.folder || env.CLOUDINARY_FOLDER
      });

      const uploadOptions: CloudinaryUploadOptions = {
        folder: env.CLOUDINARY_FOLDER,
        resource_type: 'auto',
        overwrite: true,
        ...options,
      };

      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        uploadOptions
      );

      console.log('✅ Image uploaded successfully:', {
        public_id: result.public_id,
        secure_url: result.secure_url,
        format: result.format,
        size: result.bytes
      });

      return result;
    } catch (error) {
      console.error('❌ Error uploading image to Cloudinary:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(
    files: Express.Multer.File[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    try {
      console.log('📤 Uploading multiple images to Cloudinary:', files.length);

      const uploadPromises = files.map((file, index) => 
        this.uploadImage(file, {
          ...options,
          public_id: options.public_id ? `${options.public_id}_${index}` : undefined,
        })
      );

      const results = await Promise.all(uploadPromises);
      
      console.log('✅ Multiple images uploaded successfully:', results.length);
      return results;
    } catch (error) {
      console.error('❌ Error uploading multiple images to Cloudinary:', error);
      throw new Error('Failed to upload multiple images to Cloudinary');
    }
  }

  /**
   * Delete an image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<CloudinaryDeleteResult> {
    try {
      console.log('🗑️ Deleting image from Cloudinary:', publicId);

      const result = await cloudinary.uploader.destroy(publicId);
      
      console.log('✅ Image deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error deleting image from Cloudinary:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<CloudinaryDeleteResult> {
    try {
      console.log('🗑️ Deleting multiple images from Cloudinary:', publicIds.length);

      const result = await cloudinary.api.delete_resources(publicIds);
      
      console.log('✅ Multiple images deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Error deleting multiple images from Cloudinary:', error);
      throw new Error('Failed to delete multiple images from Cloudinary');
    }
  }

  /**
   * Transform image URL with Cloudinary transformations
   */
  static getTransformedUrl(
    publicId: string,
    transformations: any = {}
  ): string {
    try {
      const defaultTransformations = {
        quality: 'auto',
        fetch_format: 'auto',
        ...transformations,
      };

      const url = cloudinary.url(publicId, defaultTransformations);
      
      console.log('🔄 Generated transformed URL:', url);
      return url;
    } catch (error) {
      console.error('❌ Error generating transformed URL:', error);
      throw new Error('Failed to generate transformed URL');
    }
  }

  /**
   * Get optimized image URL for product display
   */
  static getProductImageUrl(publicId: string, size: 'thumbnail' | 'medium' | 'large' = 'medium'): string {
    const sizeConfig = {
      thumbnail: { width: 200, height: 200, crop: 'fill' },
      medium: { width: 400, height: 400, crop: 'fill' },
      large: { width: 800, height: 800, crop: 'fill' },
    };

    return this.getTransformedUrl(publicId, {
      ...sizeConfig[size],
      quality: 'auto',
      fetch_format: 'auto',
    });
  }

  /**
   * Convert Cloudinary upload result to ProductImageResponse
   */
  static toProductImageResponse(uploadResult: CloudinaryUploadResult): ProductImageResponse {
    return {
      id: uploadResult.public_id,
      url: uploadResult.url,
      secure_url: uploadResult.secure_url,
      public_id: uploadResult.public_id,
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      folder: uploadResult.folder ?? env.CLOUDINARY_FOLDER,
      created_at: uploadResult.created_at,
    };
  }
}
