import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/categoryService';
import { ApiResponse } from '../types/api';

export class CategoryController {
  /**
   * Get all categories
   */
  async getAllCategories(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const categories = await categoryService.getAllCategories();
      
      const response: ApiResponse = {
        data: { categories },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await categoryService.getCategoryById(id);
      
      const response: ApiResponse = {
        data: { category },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create category
   */
  async createCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const category = await categoryService.createCategory(req.body);
      
      const response: ApiResponse = {
        data: { category },
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update category
   */
  async updateCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await categoryService.updateCategory(id, req.body);
      
      const response: ApiResponse = {
        data: { category },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete category
   */
  async deleteCategory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await categoryService.deleteCategory(id);
      
      const response: ApiResponse = {
        data: { message: 'Category deleted successfully' },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const categoryController = new CategoryController();
