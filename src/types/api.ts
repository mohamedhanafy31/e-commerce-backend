// API Response types based on PRD specifications

export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// Product related types
export interface ProductResponse {
  id: number;
  name: string;
  description?: string;
  price: number;
  sku: string;
  stock_quantity: number;
  image_url?: string;
  is_active: boolean;
  categories: CategoryBasic[];
  tags: TagBasic[];
  average_rating?: number;
  created_at: string;
  updated_at: string;
}

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
  productCount: number;
  createdAt: string;
}

// Simplified category for product responses
export interface CategoryBasic {
  id: number;
  name: string;
  description?: string;
}

export interface TagResponse {
  id: number;
  name: string;
  productCount: number;
  createdAt: string;
}

// Simplified tag for product responses
export interface TagBasic {
  id: number;
  name: string;
}

// Order related types
export interface OrderResponse {
  id: number;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED';
  shippingAddress: string;
  shippingMethod: string;
  shippingCost?: number;
  subtotal?: number;
  total?: number;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemResponse {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  productPrice: number;
  quantity: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
}

// Review related types
export interface ReviewResponse {
  id: number;
  productId: number;
  rating: number;
  reviewText?: string;
  reviewerName?: string;
  createdAt: string;
  product?: {
    id: number;
    name: string;
  };
}

// Cart related types
export interface CartItem {
  productId: number;
  quantity: number;
}

export interface CartResponse {
  items: Array<{
    productId: number;
    product: ProductResponse;
    quantity: number;
    subtotal: number;
  }>;
  totalItems: number;
  subtotal: number;
}

// Admin auth types
export interface AdminResponse {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface LoginResponse {
  admin: AdminResponse;
  token: string;
  expiresAt: string;
}
