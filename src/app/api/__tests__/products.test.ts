import { NextRequest } from 'next/server';
import { GET, POST } from '../products/route';
import { prisma } from '@/lib/prisma';

// Mock the Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    rebateConfig: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products with rebate configs', async () => {
      // Mock products data
      const mockProducts = [
        {
          id: 1,
          name: 'Product 1',
          price: 99.99,
          rebateConfigs: [
            { id: 1, level: 1, percentage: 10 },
            { id: 2, level: 2, percentage: 5 },
          ],
        },
        {
          id: 2,
          name: 'Product 2',
          price: 199.99,
          rebateConfigs: [
            { id: 3, level: 1, percentage: 15 },
            { id: 4, level: 2, percentage: 7 },
          ],
        },
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValueOnce(mockProducts);

      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        include: {
          rebateConfigs: {
            orderBy: {
              level: 'asc',
            },
          },
        },
      });
    });

    it('should handle errors and return 500 status', async () => {
      (prisma.product.findMany as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to fetch products' });
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product with rebate configs', async () => {
      // Mock request body
      const mockRequestBody = {
        name: 'New Product',
        description: 'Product description',
        price: 299.99,
        image: '/products/new.jpg',
        rebateConfigs: [
          { level: 1, percentage: 10 },
          { level: 2, percentage: 5 },
        ],
      };

      // Mock created product
      const mockCreatedProduct = {
        id: 3,
        name: 'New Product',
        description: 'Product description',
        price: 299.99,
        image: '/products/new.jpg',
      };

      (prisma.product.create as jest.Mock).mockResolvedValueOnce(mockCreatedProduct);
      (prisma.rebateConfig.create as jest.Mock).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'New Product',
          description: 'Product description',
          price: 299.99,
          image: '/products/new.jpg',
        },
      });
      expect(prisma.rebateConfig.create).toHaveBeenCalledTimes(2);
    });

    it('should handle errors and return 500 status', async () => {
      // Mock request body
      const mockRequestBody = {
        name: 'New Product',
        description: 'Product description',
        price: 299.99,
        image: '/products/new.jpg',
        rebateConfigs: [
          { level: 1, percentage: 10 },
          { level: 2, percentage: 5 },
        ],
      };

      (prisma.$transaction as jest.Mock).mockRejectedValueOnce(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/products', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to create product' });
    });
  });
});
