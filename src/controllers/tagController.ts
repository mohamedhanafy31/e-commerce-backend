import { Request, Response, NextFunction } from 'express';
import { tagService } from '../services/tagService';
import { ApiResponse } from '../types/api';

export class TagController {
  /**
   * Get all tags
   */
  async getAllTags(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tags = await tagService.getAllTags();
      
      const response: ApiResponse = {
        data: { tags },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get tag by ID
   */
  async getTagById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const tag = await tagService.getTagById(id);
      
      const response: ApiResponse = {
        data: { tag },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create tag
   */
  async createTag(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const tag = await tagService.createTag(req.body);
      
      const response: ApiResponse = {
        data: { tag },
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update tag
   */
  async updateTag(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const tag = await tagService.updateTag(id, req.body);
      
      const response: ApiResponse = {
        data: { tag },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete tag
   */
  async deleteTag(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await tagService.deleteTag(id);
      
      const response: ApiResponse = {
        data: { message: 'Tag deleted successfully' },
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const tagController = new TagController();
