import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorHandler';

// Admin registration schema
export const adminRegisterSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email must not exceed 255 characters')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number'
    ),
});

// Admin login schema
export const adminLoginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(1, 'Password is required'),
});

// Category schemas
export const createCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters')
    .trim(),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
});

export const updateCategorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
});

// Tag schemas
export const createTagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must not exceed 50 characters')
    .trim()
    .toLowerCase(),
});

export const updateTagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must not exceed 50 characters')
    .trim()
    .toLowerCase()
    .optional(),
});

// Review schemas
export const createReviewSchema = z.object({
  productId: z.number()
    .int('Product ID must be an integer')
    .positive('Product ID must be positive'),
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  reviewText: z.string()
    .max(2000, 'Review text must not exceed 2000 characters')
    .trim()
    .optional(),
  reviewerName: z.string()
    .max(100, 'Reviewer name must not exceed 100 characters')
    .trim()
    .optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5')
    .optional(),
  reviewText: z.string()
    .max(2000, 'Review text must not exceed 2000 characters')
    .trim()
    .optional(),
  reviewerName: z.string()
    .max(100, 'Reviewer name must not exceed 100 characters')
    .trim()
    .optional(),
});

// Order schemas
export const createCheckoutOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.number().int().positive('Product ID must be positive'),
      quantity: z.number().int().positive('Quantity must be positive'),
    })
  ).min(1, 'Order must have at least one item'),
  shippingAddress: z.string()
    .min(10, 'Shipping address must be at least 10 characters')
    .max(500, 'Shipping address must not exceed 500 characters')
    .trim(),
  shippingMethod: z.string()
    .min(1, 'Shipping method is required')
    .max(100, 'Shipping method must not exceed 100 characters')
    .trim(),
  shippingCost: z.number()
    .nonnegative('Shipping cost must be non-negative')
    .optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']),
});

// Product creation schema
export const createProductSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must not exceed 255 characters')
    .trim(),
  description: z.string()
    .max(5000, 'Description must not exceed 5000 characters')
    .optional(),
  price: z.number()
    .positive('Price must be positive')
    .max(999999.99, 'Price too high'),
  sku: z.string()
    .min(1, 'SKU is required')
    .max(100, 'SKU must not exceed 100 characters')
    .regex(/^[A-Z0-9-_]+$/, 'SKU must contain only uppercase letters, numbers, hyphens, and underscores')
    .trim(),
  stockQuantity: z.number()
    .int('Stock quantity must be an integer')
    .min(0, 'Stock quantity cannot be negative'),
  imageUrl: z.string()
    .url('Invalid image URL')
    .max(500, 'Image URL must not exceed 500 characters')
    .optional(),
  categoryIds: z.array(z.number().int().positive())
    .min(1, 'At least one category is required')
    .optional(),
  tagIds: z.array(z.number().int().positive())
    .optional(),
  isActive: z.boolean().default(true),
  // SEO fields
  metaTitle: z.string()
    .max(60, 'Meta title must not exceed 60 characters')
    .optional(),
  metaDescription: z.string()
    .max(160, 'Meta description must not exceed 160 characters')
    .optional(),
  slug: z.string()
    .max(100, 'Slug must not exceed 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
});

// Product update schema (all fields optional)
export const updateProductSchema = createProductSchema.partial();

// Category schema
export const categorySchema = z.object({
  name: z.string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
});

// Tag schema
export const tagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must not exceed 50 characters')
    .trim()
    .toLowerCase(),
});

// Review schema
export const reviewSchema = z.object({
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must not exceed 5'),
  reviewText: z.string()
    .max(2000, 'Review text must not exceed 2000 characters')
    .optional(),
  reviewerName: z.string()
    .max(100, 'Reviewer name must not exceed 100 characters')
    .optional(),
});

// Order creation schema
export const createOrderSchema = z.object({
  shippingAddress: z.string()
    .min(10, 'Shipping address must be at least 10 characters')
    .max(500, 'Shipping address must not exceed 500 characters')
    .trim(),
  shippingMethod: z.string()
    .min(1, 'Shipping method is required')
    .max(100, 'Shipping method must not exceed 100 characters'),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 1)
    .refine(val => val > 0, 'Page must be positive'),
  limit: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : 20)
    .refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  search: z.string()
    .max(255, 'Search term must not exceed 255 characters')
    .optional(),
  categoryId: z.string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : undefined)
    .refine(val => val === undefined || val > 0, 'Category ID must be positive'),
});

// Validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      const validated = schema.parse(req.body);
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = (error as any).errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        throw new AppError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          details
        );
      }
      next(error);
    }
  };
};

// Validate query parameters
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      console.log('🔍 Validating query parameters:', req.query);
      const validated = schema.parse(req.query);
      console.log('✅ Query validation successful:', validated);
      
      // Instead of modifying req.query, pass validated data through res.locals
      (req as any).validatedQuery = validated;
      next();
    } catch (error) {
      console.error('❌ Query validation failed:', error);
      if (error instanceof z.ZodError) {
        const details = (error as any).errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        console.error('Validation details:', details);
        throw new AppError(
          'Invalid query parameters',
          400,
          'VALIDATION_ERROR',
          details
        );
      }
      next(error);
    }
  };
};
