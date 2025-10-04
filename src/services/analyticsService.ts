import { prisma } from '../config/database';
import { OrderStatus } from '@prisma/client';

export class AnalyticsService {
  /**
   * Get dashboard overview statistics
   */
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    revenueGrowth: number;
    ordersGrowth: number;
  }> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalRevenue,
      totalOrders,
      totalProducts,
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthOrders,
      lastMonthOrders,
    ] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { not: 'PENDING' } },
      }),
      prisma.order.count({
        where: { status: { not: 'PENDING' } },
      }),
      prisma.product.count({
        where: { isActive: true },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: 'PENDING' },
          createdAt: { gte: firstDayOfThisMonth },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          status: { not: 'PENDING' },
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
      }),
      prisma.order.count({
        where: {
          status: { not: 'PENDING' },
          createdAt: { gte: firstDayOfThisMonth },
        },
      }),
      prisma.order.count({
        where: {
          status: { not: 'PENDING' },
          createdAt: {
            gte: firstDayOfLastMonth,
            lt: firstDayOfMonth,
          },
        },
      }),
    ]);

    // Calculate growth percentages
    const thisMonthRev = thisMonthRevenue._sum.total ? parseFloat(thisMonthRevenue._sum.total.toString()) : 0;
    const lastMonthRev = lastMonthRevenue._sum.total ? parseFloat(lastMonthRevenue._sum.total.toString()) : 0;
    const revenueGrowth = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev) * 100 : 0;

    const ordersGrowth = lastMonthOrders > 0 
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0;

    return {
      totalRevenue: totalRevenue._sum.total ? parseFloat(totalRevenue._sum.total.toString()) : 0,
      totalOrders,
      totalProducts,
      totalCustomers: totalOrders, // Approximate by orders for now
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      ordersGrowth: Math.round(ordersGrowth * 10) / 10,
    };
  }

  /**
   * Get sales data for chart (last 30 days)
   */
  async getSalesData(days: number = 30): Promise<Array<{
    date: string;
    revenue: number;
    orders: number;
  }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: { not: 'PENDING' },
      },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const salesByDate: Record<string, { revenue: number; orders: number }> = {};
    
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      if (!salesByDate[dateKey]) {
        salesByDate[dateKey] = { revenue: 0, orders: 0 };
      }
      salesByDate[dateKey].revenue += order.total ? parseFloat(order.total.toString()) : 0;
      salesByDate[dateKey].orders += 1;
    });

    // Convert to array and fill missing dates
    const result: Array<{ date: string; revenue: number; orders: number }> = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      const dateKey = date.toISOString().split('T')[0];
      
      result.push({
        date: dateKey,
        revenue: salesByDate[dateKey]?.revenue || 0,
        orders: salesByDate[dateKey]?.orders || 0,
      });
    }

    return result;
  }

  /**
   * Get top selling products
   */
  async getTopProducts(limit: number = 10): Promise<Array<{
    productId: number;
    productName: string;
    totalSold: number;
    revenue: number;
  }>> {
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: limit,
    });

    return topProducts.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      totalSold: item._sum.quantity || 0,
      revenue: item._sum.subtotal ? parseFloat(item._sum.subtotal.toString()) : 0,
    }));
  }

  /**
   * Get revenue by category
   */
  async getRevenueByCategory(): Promise<Array<{
    categoryName: string;
    revenue: number;
    orderCount: number;
  }>> {
    // Get all products with their categories
    const products = await prisma.product.findMany({
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Get order items
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { not: 'PENDING' },
        },
      },
      select: {
        productId: true,
        subtotal: true,
      },
    });

    // Map product to categories
    const categoryRevenue: Record<string, { revenue: number; count: number }> = {};

    orderItems.forEach((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.categories.length > 0) {
        product.categories.forEach((pc) => {
          const catName = pc.category.name;
          if (!categoryRevenue[catName]) {
            categoryRevenue[catName] = { revenue: 0, count: 0 };
          }
          categoryRevenue[catName].revenue += parseFloat(item.subtotal.toString());
          categoryRevenue[catName].count += 1;
        });
      }
    });

    return Object.entries(categoryRevenue)
      .map(([categoryName, data]) => ({
        categoryName,
        revenue: data.revenue,
        orderCount: data.count,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get order status distribution
   */
  async getOrderStatusDistribution(): Promise<Record<OrderStatus, number>> {
    const orders = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const distribution: Record<OrderStatus, number> = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
    };

    orders.forEach((item) => {
      distribution[item.status] = item._count.id;
    });

    return distribution;
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(threshold: number = 10): Promise<Array<{
    id: number;
    name: string;
    sku: string;
    stockQuantity: number;
    imageUrl?: string;
  }>> {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { lte: threshold },
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        imageUrl: true,
      },
      orderBy: {
        stockQuantity: 'asc',
      },
      take: 20,
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      stockQuantity: p.stockQuantity,
      imageUrl: p.imageUrl || undefined,
    }));
  }

  /**
   * Get recent reviews
   */
  async getRecentReviews(limit: number = 5): Promise<Array<{
    id: number;
    productId: number;
    productName: string;
    rating: number;
    reviewText?: string;
    reviewerName?: string;
    createdAt: string;
  }>> {
    const reviews = await prisma.review.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return reviews.map((review) => ({
      id: review.id,
      productId: review.productId,
      productName: review.product.name,
      rating: review.rating,
      reviewText: review.reviewText || undefined,
      reviewerName: review.reviewerName || undefined,
      createdAt: review.createdAt.toISOString(),
    }));
  }
}

export const analyticsService = new AnalyticsService();

