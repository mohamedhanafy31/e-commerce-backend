import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { TagResponse } from '../types/api';

export class TagService {
  /**
   * Get all tags
   */
  async getAllTags(): Promise<TagResponse[]> {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      productCount: tag._count.products,
      createdAt: tag.createdAt.toISOString(),
    }));
  }

  /**
   * Get tag by ID
   */
  async getTagById(id: number): Promise<TagResponse> {
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!tag) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    return {
      id: tag.id,
      name: tag.name,
      productCount: tag._count.products,
      createdAt: tag.createdAt.toISOString(),
    };
  }

  /**
   * Create new tag
   */
  async createTag(data: { name: string }): Promise<TagResponse> {
    // Check if tag with same name exists
    const existing = await prisma.tag.findUnique({
      where: { name: data.name.toLowerCase() },
    });

    if (existing) {
      throw new AppError(
        'Tag with this name already exists',
        400,
        'TAG_EXISTS'
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name: data.name.toLowerCase(),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      productCount: tag._count.products,
      createdAt: tag.createdAt.toISOString(),
    };
  }

  /**
   * Update tag
   */
  async updateTag(id: number, data: { name?: string }): Promise<TagResponse> {
    // Check if tag exists
    const existing = await prisma.tag.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    // If name is being updated, check for duplicates
    if (data.name && data.name.toLowerCase() !== existing.name) {
      const duplicate = await prisma.tag.findUnique({
        where: { name: data.name.toLowerCase() },
      });

      if (duplicate) {
        throw new AppError(
          'Tag with this name already exists',
          400,
          'TAG_EXISTS'
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.toLowerCase() }),
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      id: tag.id,
      name: tag.name,
      productCount: tag._count.products,
      createdAt: tag.createdAt.toISOString(),
    };
  }

  /**
   * Delete tag
   */
  async deleteTag(id: number): Promise<void> {
    // Check if tag exists
    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!tag) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    // Check if tag has products
    if (tag._count.products > 0) {
      throw new AppError(
        `Cannot delete tag with ${tag._count.products} associated products`,
        400,
        'TAG_HAS_PRODUCTS'
      );
    }

    await prisma.tag.delete({
      where: { id },
    });
  }

  /**
   * Get tags with product counts
   */
  async getTagsWithCounts(): Promise<Array<{
    id: number;
    name: string;
    productCount: number;
  }>> {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      productCount: tag._count.products,
    }));
  }
}

export const tagService = new TagService();
