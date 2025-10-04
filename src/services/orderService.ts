import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { OrderResponse, OrderItemResponse, PaginationInfo } from '../types/api';
import { OrderStatus } from '@prisma/client';

export class OrderService {
  /**
   * Get all orders (admin) with pagination
   */
  async getAllOrders(
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: OrderStatus;
      searchTerm?: string;
    }
  ): Promise<{ orders: OrderResponse[]; pagination: PaginationInfo }> {
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.searchTerm && {
        OR: [
          { orderNumber: { contains: filters.searchTerm, mode: 'insensitive' } },
          { shippingAddress: { contains: filters.searchTerm, mode: 'insensitive' } },
        ],
      }),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const mappedOrders: OrderResponse[] = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost.toString()) : undefined,
      subtotal: order.subtotal ? parseFloat(order.subtotal.toString()) : 0,
      total: order.total ? parseFloat(order.total.toString()) : 0,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        productPrice: parseFloat(item.productPrice.toString()),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal.toString()),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
        },
      })),
    }));

    return {
      orders: mappedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(id: number): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost.toString()) : undefined,
      subtotal: order.subtotal ? parseFloat(order.subtotal.toString()) : 0,
      total: order.total ? parseFloat(order.total.toString()) : 0,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        productPrice: parseFloat(item.productPrice.toString()),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal.toString()),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
        },
      })),
    };
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<OrderResponse> {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost.toString()) : undefined,
      subtotal: order.subtotal ? parseFloat(order.subtotal.toString()) : 0,
      total: order.total ? parseFloat(order.total.toString()) : 0,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        productPrice: parseFloat(item.productPrice.toString()),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal.toString()),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
        },
      })),
    };
  }

  /**
   * Update order status (admin)
   */
  async updateOrderStatus(id: number, status: OrderStatus): Promise<OrderResponse> {
    // Check if order exists
    const existing = await prisma.order.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost.toString()) : undefined,
      subtotal: order.subtotal ? parseFloat(order.subtotal.toString()) : 0,
      total: order.total ? parseFloat(order.total.toString()) : 0,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        productPrice: parseFloat(item.productPrice.toString()),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal.toString()),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
        },
      })),
    };
  }

  /**
   * Get order statistics (admin)
   */
  async getOrderStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    statusBreakdown: Record<OrderStatus, number>;
    recentOrders: OrderResponse[];
  }> {
    const [totalOrders, revenueResult, orders, recentOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: {
          total: true,
        },
      }),
      prisma.order.findMany({
        select: {
          status: true,
        },
      }),
      prisma.order.findMany({
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Calculate status breakdown
    const statusBreakdown: Record<OrderStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };

    orders.forEach((order) => {
      statusBreakdown[order.status] = (statusBreakdown[order.status] || 0) + 1;
    });

    const mappedRecentOrders: OrderResponse[] = recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost.toString()) : undefined,
      subtotal: order.subtotal ? parseFloat(order.subtotal.toString()) : 0,
      total: order.total ? parseFloat(order.total.toString()) : 0,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        productPrice: parseFloat(item.productPrice.toString()),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal.toString()),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
        },
      })),
    }));

    return {
      totalOrders,
      totalRevenue: revenueResult._sum.total ? parseFloat(revenueResult._sum.total.toString()) : 0,
      statusBreakdown,
      recentOrders: mappedRecentOrders,
    };
  }

  /**
   * Create order (checkout process)
   */
  async createOrder(data: {
    items: Array<{
      productId: number;
      quantity: number;
    }>;
    shippingAddress: string;
    shippingMethod: string;
    shippingCost?: number;
  }): Promise<OrderResponse> {
    // Validate products and check stock
    const productIds = data.items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new AppError('One or more products not found or inactive', 400, 'INVALID_PRODUCTS');
    }

    // Check stock availability
    for (const item of data.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new AppError(`Product ${item.productId} not found`, 400, 'PRODUCT_NOT_FOUND');
      }
      if (product.stockQuantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
          400,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const itemSubtotal = parseFloat(product.price.toString()) * item.quantity;
      subtotal += itemSubtotal;

      return {
        productId: item.productId,
        productName: product.name,
        productPrice: product.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    const shippingCost = data.shippingCost || 0;
    const total = subtotal + shippingCost;

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          shippingAddress: data.shippingAddress,
          shippingMethod: data.shippingMethod,
          shippingCost: shippingCost,
          subtotal: subtotal,
          total: total,
          status: 'PENDING',
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      // Decrement stock for each product
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      return newOrder;
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      shippingAddress: order.shippingAddress,
      shippingMethod: order.shippingMethod,
      shippingCost: order.shippingCost ? parseFloat(order.shippingCost.toString()) : undefined,
      subtotal: order.subtotal ? parseFloat(order.subtotal.toString()) : 0,
      total: order.total ? parseFloat(order.total.toString()) : 0,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        productName: item.productName,
        productPrice: parseFloat(item.productPrice.toString()),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal.toString()),
        product: {
          id: item.product.id,
          name: item.product.name,
          imageUrl: item.product.imageUrl || undefined,
        },
      })),
    };
  }
}

export const orderService = new OrderService();

