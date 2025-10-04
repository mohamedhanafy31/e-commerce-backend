import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CategoryResponse } from '../types/api';

export class CategoryService {
  /**
   * Get all categories
   */
  async getAllCategories(): Promise<CategoryResponse[]> {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description || undefined,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
    }));
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: number): Promise<CategoryResponse> {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description || undefined,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
    };
  }

  /**
   * Create new category
   */
  async createCategory(data: {
    name: string;
    description?: string;
  }): Promise<CategoryResponse> {
    // Check if category with same name exists
    const existing = await prisma.category.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      throw new AppError(
        'Category with this name already exists',
        400,
        'CATEGORY_EXISTS'
      );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description || undefined,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
    };
  }

  /**
   * Update category
   */
  async updateCategory(
    id: number,
    data: {
      name?: string;
      description?: string;
    }
  ): Promise<CategoryResponse> {
    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: data.name },
      });

      if (duplicate) {
        throw new AppError(
          'Category with this name already exists',
          400,
          'CATEGORY_EXISTS'
        );
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: category.id,
      name: category.name,
      description: category.description || undefined,
      productCount: category._count.products,
      createdAt: category.createdAt.toISOString(),
    };
  }

  /**
   * Delete category
   */
  async deleteCategory(id: number): Promise<void> {
    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404, 'CATEGORY_NOT_FOUND');
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new AppError(
        `Cannot delete category with ${category._count.products} associated products`,
        400,
        'CATEGORY_HAS_PRODUCTS'
      );
    }

    await prisma.category.delete({
      where: { id },
    });
  }

  /**
   * Get categories with product counts
   */
  async getCategoriesWithCounts(): Promise<Array<{
    id: number;
    name: string;
    productCount: number;
  }>> {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      productCount: cat._count.products,
    }));
  }
}

export const categoryService = new CategoryService();
