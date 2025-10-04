// Cloudinary Image Types
export interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  folder: string;
  original_filename: string;
  resource_type: 'image' | 'video' | 'raw';
  version: number;
  signature: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  folder?: string;
  original_filename: string;
  resource_type: string;
  version: number;
  signature: string;
  etag: string;
  placeholder: boolean;
  access_mode: string;
  original_extension?: string;
  api_key?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  public_id?: string;
  overwrite?: boolean;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  format?: string;
  quality?: string | number;
  width?: number;
  height?: number;
  crop?: string;
  gravity?: string;
  transformation?: any[];
}

export interface CloudinaryDeleteResult {
  result: 'ok' | 'not found';
  deleted: {
    [resourceType: string]: string[];
  };
  partial: boolean;
  deleted_count: number;
}

// Product Image specific types
export interface ProductImageUpload {
  file: Express.Multer.File;
  productId?: number;
  folder?: string;
}

export interface ProductImageResponse {
  id: string;
  url: string;
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  folder: string;
  created_at: string;
}
