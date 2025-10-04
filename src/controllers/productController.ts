import { Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiResponse } from '../types/api';

export class ProductController {
  // Get products with pagination and filtering (public)
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      minPrice,
      maxPrice,
    } = req.query;

    const filters = {
      search: search as string,
      categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
      isActive: true, // Only show active products to public
    };

    const pagination = {
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100), // Max 100 items per page
    };

    const result = await ProductService.getProducts(filters, pagination);

    const response: ApiResponse = {
      data: {
        products: result.products,
        pagination: result.pagination,
      },
    };

    // Encourage client/proxy caching for 60 seconds (public endpoint)
    res.set('Cache-Control', 'public, max-age=60');
    res.status(200).json(response);
  });

  // Get single product by ID (public)
  static getProductById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Product ID must be a valid number',
        },
      });
    }

    const product = await ProductService.getProductById(productId);

    const response: ApiResponse = {
      data: product,
    };

    res.status(200).json(response);
  });

  // Search products (public)
  static searchProducts = asyncHandler(async (req: Request, res: Response) => {
    const { q: search, page = 1, limit = 20 } = req.query;

    if (!search) {
      return res.status(400).json({
        error: {
          code: 'SEARCH_REQUIRED',
          message: 'Search query is required',
        },
      });
    }

    const filters = {
      search: search as string,
      isActive: true,
    };

    const pagination = {
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    };

    const result = await ProductService.getProducts(filters, pagination);

    const response: ApiResponse = {
      data: result.products,
      pagination: result.pagination,
    };

    res.status(200).json(response);
  });

  // Create product (admin only)
  static createProduct = asyncHandler(async (req: Request, res: Response) => {
    const productData = req.body;

    const product = await ProductService.createProduct(productData);

    const response: ApiResponse = {
      data: product,
    };

    res.status(201).json(response);
  });

  // Update product (admin only)
  static updateProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Product ID must be a valid number',
        },
      });
    }

    const updateData = req.body;
    const product = await ProductService.updateProduct(productId, updateData);

    const response: ApiResponse = {
      data: product,
    };

    res.status(200).json(response);
  });

  // Delete product (admin only)
  static deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { hard } = req.query;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Product ID must be a valid number',
        },
      });
    }

    const hardDelete = hard === 'true';
    await ProductService.deleteProduct(productId, hardDelete);

    const response: ApiResponse = {
      data: {
        message: hardDelete ? 'Product permanently deleted' : 'Product deactivated',
        productId,
      },
    };

    res.status(200).json(response);
  });

  // Update stock (admin only)
  static updateStock = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity } = req.body;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ID',
          message: 'Product ID must be a valid number',
        },
      });
    }

    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_QUANTITY',
          message: 'Quantity must be a non-negative number',
        },
      });
    }

    const product = await ProductService.updateStock(productId, quantity);

    const response: ApiResponse = {
      data: product,
    };

    res.status(200).json(response);
  });

  // Get all products for admin (includes inactive)
  static getAdminProducts = asyncHandler(async (req: Request, res: Response) => {
    console.log('📦 Admin products request received');
    console.log('🔍 Request query:', req.query);
    console.log('🔍 Validated query:', (req as any).validatedQuery);
    
    const {
      page = 1,
      limit = 20,
      search,
      categoryId,
      isActive,
      minPrice,
      maxPrice,
    } = (req as any).validatedQuery || req.query;

    console.log('📊 Parsed parameters:', { page, limit, search, categoryId, isActive, minPrice, maxPrice });

    const filters = {
      search: search as string,
      categoryId: categoryId ? parseInt(categoryId as string, 10) : undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
    };

    const pagination = {
      page: parseInt(page as string, 10),
      limit: Math.min(parseInt(limit as string, 10), 100),
    };

    console.log('🔧 Filters:', filters);
    console.log('📄 Pagination:', pagination);

    try {
      const result = await ProductService.getProducts(filters, pagination);
      console.log('✅ Products retrieved successfully:', result.products.length, 'products');

      const response: ApiResponse = {
        data: {
          products: result.products,
          pagination: result.pagination,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('❌ Error in getAdminProducts:', error);
      throw error;
    }
  });
}
