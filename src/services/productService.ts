import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ProductResponse, PaginationInfo } from '../types/api';
import { CloudinaryService } from '../services/cloudinaryService';

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  sku: string;
  stockQuantity: number;
  imageUrl?: string;
  categoryIds?: number[];
  tagIds?: number[];
  isActive?: boolean;
  // SEO fields
  metaTitle?: string;
  metaDescription?: string;
  slug?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export class ProductService {
  // Get products with pagination and filtering
  static async getProducts(
    filters: ProductFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ): Promise<{ products: ProductResponse[]; pagination: PaginationInfo }> {
    console.log('🔍 ProductService.getProducts called with:', { filters, pagination });
    
    const { search, categoryId, isActive, minPrice, maxPrice } = filters;
    const { page, limit } = pagination;
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Only add isActive filter if explicitly provided
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    console.log('🔧 Initial where clause:', where);

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
      console.log('🔍 Added search filter:', where.OR);
    }

    // Add price filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
      console.log('💰 Added price filter:', where.price);
    }

    // Add category filter
    if (categoryId) {
      where.categories = {
        some: {
          categoryId,
        },
      };
      console.log('📂 Added category filter:', where.categories);
    }

    console.log('🔧 Final where clause:', JSON.stringify(where, null, 2));

    try {
      // Get total count for pagination
      console.log('📊 Getting total count...');
      const totalItems = await prisma.product.count({ where });
      const totalPages = Math.ceil(totalItems / limit);
      console.log('📊 Total items:', totalItems, 'Total pages:', totalPages);

      // Get products
      console.log('📦 Fetching products with skip:', skip, 'take:', limit);
      const products = await prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      });

      console.log('📦 Raw products from DB:', products.length, 'products');
      console.log('📦 First product sample:', products[0] ? {
        id: products[0].id,
        name: products[0].name,
        price: products[0].price,
        stockQuantity: products[0].stockQuantity
      } : 'No products');

      // Transform to response format
      const productResponses: ProductResponse[] = products.map(product => {
        return {
          id: product.id,
          name: product.name,
          description: product.description || undefined,
          price: Number(product.price),
          sku: product.sku,
          stock_quantity: product.stockQuantity,
          image_url: product.imageUrl || undefined,
          is_active: product.isActive,
          categories: [], // TODO: Add back categories
          tags: [], // TODO: Add back tags
          average_rating: undefined, // TODO: Add back rating calculation
          created_at: product.createdAt.toISOString(),
          updated_at: product.updatedAt.toISOString(),
        };
      });

      console.log('✅ Transformed products:', productResponses.length, 'products');

      const paginationInfo: PaginationInfo = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      };

      console.log('📄 Pagination info:', paginationInfo);

      return {
        products: productResponses,
        pagination: paginationInfo,
      };
    } catch (error) {
      console.error('❌ Error in ProductService.getProducts:', error);
      throw error;
    }
  }

  // Get single product by ID
  static async getProductById(id: number): Promise<ProductResponse> {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    const avgRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : undefined;

    return {
      id: product.id,
      name: product.name,
      description: product.description || undefined,
      price: Number(product.price),
      sku: product.sku,
      stock_quantity: product.stockQuantity,
      image_url: product.imageUrl || undefined,
      is_active: product.isActive,
      categories: product.categories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name,
        description: pc.category.description || undefined,
      })),
      tags: product.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
      average_rating: avgRating ? Math.round(avgRating * 10) / 10 : undefined,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }

  // Create new product (admin only)
  static async createProduct(data: CreateProductData): Promise<ProductResponse> {
    const { categoryIds = [], tagIds = [], ...productData } = data;

    // Check if SKU already exists
    const existingProduct = await prisma.product.findUnique({
      where: { sku: data.sku },
    });

    if (existingProduct) {
      throw new AppError('Product with this SKU already exists', 409, 'SKU_EXISTS');
    }

    // Verify categories exist
    if (categoryIds.length > 0) {
      const categories = await prisma.category.findMany({
        where: { id: { in: categoryIds } },
      });

      if (categories.length !== categoryIds.length) {
        throw new AppError('One or more categories not found', 400, 'INVALID_CATEGORIES');
      }
    }

    // Verify tags exist
    if (tagIds.length > 0) {
      const tags = await prisma.tag.findMany({
        where: { id: { in: tagIds } },
      });

      if (tags.length !== tagIds.length) {
        throw new AppError('One or more tags not found', 400, 'INVALID_TAGS');
      }
    }

    // Create product with relationships
    const product = await prisma.product.create({
      data: {
        ...productData,
        categories: {
          create: categoryIds.map(categoryId => ({ categoryId })),
        },
        tags: {
          create: tagIds.map(tagId => ({ tagId })),
        },
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return {
      id: product.id,
      name: product.name,
      description: product.description || undefined,
      price: Number(product.price),
      sku: product.sku,
      stock_quantity: product.stockQuantity,
      image_url: product.imageUrl || undefined,
      is_active: product.isActive,
      categories: product.categories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name,
        description: pc.category.description || undefined,
      })),
      tags: product.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }

  // Update product (admin only)
  static async updateProduct(id: number, data: UpdateProductData): Promise<ProductResponse> {
    const { categoryIds, tagIds, ...updateData } = data;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // Check SKU uniqueness if updating SKU
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });

      if (skuExists) {
        throw new AppError('Product with this SKU already exists', 409, 'SKU_EXISTS');
      }
    }

    // Update product in transaction
    const product = await prisma.$transaction(async (tx) => {
      // Update basic product data
      const updatedProduct = await tx.product.update({
        where: { id },
        data: updateData,
      });

      // Update categories if provided
      if (categoryIds !== undefined) {
        // Remove existing category relationships
        await tx.productCategory.deleteMany({
          where: { productId: id },
        });

        // Add new category relationships
        if (categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: categoryIds.map(categoryId => ({ productId: id, categoryId })),
          });
        }
      }

      // Update tags if provided
      if (tagIds !== undefined) {
        // Remove existing tag relationships
        await tx.productTag.deleteMany({
          where: { productId: id },
        });

        // Add new tag relationships
        if (tagIds.length > 0) {
          await tx.productTag.createMany({
            data: tagIds.map(tagId => ({ productId: id, tagId })),
          });
        }
      }

      // Return updated product with relationships
      return tx.product.findUnique({
        where: { id },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });
    });

    if (!product) {
      throw new AppError('Failed to update product', 500, 'UPDATE_FAILED');
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description || undefined,
      price: Number(product.price),
      sku: product.sku,
      stock_quantity: product.stockQuantity,
      image_url: product.imageUrl || undefined,
      is_active: product.isActive,
      categories: product.categories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name,
        description: pc.category.description || undefined,
      })),
      tags: product.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }

  // Delete product (admin only) - soft delete by default
  static async deleteProduct(id: number, hardDelete: boolean = false): Promise<void> {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    if (hardDelete) {
      // Hard delete - remove from database and delete image from Cloudinary if present
      // Best-effort: failure to delete the Cloudinary asset should not block DB deletion
      const imageUrl = product.imageUrl;
      if (imageUrl && imageUrl.includes('cloudinary.com')) {
        try {
          const publicId = ProductService.extractCloudinaryPublicId(imageUrl);
          if (publicId) {
            await CloudinaryService.deleteImage(publicId);
          }
        } catch (e) {
          console.warn('⚠️ Failed to delete Cloudinary image for product', { id, imageUrl, error: e });
        }
      }

      await prisma.product.delete({ where: { id } });
    } else {
      // Soft delete - mark as inactive
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    }
  }

  /**
   * Extract Cloudinary public_id from a secure_url/url
   * Expected formats like:
   * https://res.cloudinary.com/<cloud>/image/upload/v<version>/<folder>/.../<public_id>
   */
  private static extractCloudinaryPublicId(imageUrl: string): string | null {
    try {
      const parts = imageUrl.split('/');
      const uploadIndex = parts.findIndex(p => p === 'upload');
      if (uploadIndex === -1) return null;
      // Skip optional version segment (e.g., v1699999999)
      const afterUpload = parts.slice(uploadIndex + 1);
      const startsWithVersion = afterUpload[0]?.startsWith('v') && /^v\d+$/.test(afterUpload[0]);
      const publicIdParts = afterUpload.slice(startsWithVersion ? 1 : 0);
      if (publicIdParts.length === 0) return null;
      // Join remaining segments to get public_id
      return publicIdParts.join('/');
    } catch {
      return null;
    }
  }

  // Update stock quantity
  static async updateStock(id: number, quantity: number): Promise<ProductResponse> {
    if (quantity < 0) {
      throw new AppError('Stock quantity cannot be negative', 400, 'INVALID_STOCK');
    }

    const product = await prisma.product.update({
      where: { id },
      data: { stockQuantity: quantity },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    return {
      id: product.id,
      name: product.name,
      description: product.description || undefined,
      price: Number(product.price),
      sku: product.sku,
      stock_quantity: product.stockQuantity,
      image_url: product.imageUrl || undefined,
      is_active: product.isActive,
      categories: product.categories.map(pc => ({
        id: pc.category.id,
        name: pc.category.name,
        description: pc.category.description || undefined,
      })),
      tags: product.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
      })),
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    };
  }
}
