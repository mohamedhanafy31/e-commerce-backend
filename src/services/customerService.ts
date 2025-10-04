import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface CustomerResponse {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export class CustomerService {
  static async getCustomerById(id: number): Promise<CustomerResponse> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      throw new AppError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      isActive: customer.isActive,
      createdAt: customer.createdAt.toISOString(),
      lastLogin: customer.lastLogin?.toISOString(),
    };
  }
}

export const customerService = CustomerService;
