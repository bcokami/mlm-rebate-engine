import { NextRequest } from 'next/server';
import { GET, POST } from '../purchases/route';
import { prisma } from '@/lib/prisma';
import { calculateRebates } from '@/lib/rebateCalculator';
import { getServerSession } from 'next-auth';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    purchase: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(prisma)),
  },
}));

jest.mock('@/lib/rebateCalculator', () => ({
  calculateRebates: jest.fn(),
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

describe('Purchases API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/purchases', () => {
    it('should return user purchases when authenticated', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { id: '1', name: 'Test User' },
      });

      // Mock purchases data
      const mockPurchases = [
        {
          id: 1,
          userId: 1,
          productId: 1,
          quantity: 1,
          totalAmount: 99.99,
          product: { id: 1, name: 'Product 1' },
          user: { id: 1, name: 'Test User' },
          rebates: [],
        },
      ];

      (prisma.purchase.findMany as jest.Mock).mockResolvedValueOnce(mockPurchases);

      const request = new NextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPurchases);
      expect(prisma.purchase.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        include: {
          product: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          rebates: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/purchases');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'You must be logged in to view purchases' });
    });
  });

  describe('POST /api/purchases', () => {
    it('should create a new purchase and calculate rebates', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { id: '1', name: 'Test User' },
      });

      // Mock request body
      const mockRequestBody = {
        productId: 1,
        quantity: 1,
      };

      // Mock product
      const mockProduct = {
        id: 1,
        name: 'Product 1',
        price: 99.99,
      };

      // Mock created purchase
      const mockCreatedPurchase = {
        id: 1,
        userId: 1,
        productId: 1,
        quantity: 1,
        totalAmount: 99.99,
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValueOnce(mockProduct);
      (prisma.purchase.create as jest.Mock).mockResolvedValueOnce(mockCreatedPurchase);
      (calculateRebates as jest.Mock).mockResolvedValueOnce([]);

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify(mockRequestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedPurchase);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(prisma.purchase.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          productId: 1,
          quantity: 1,
          totalAmount: 99.99,
        },
      });
      expect(calculateRebates).toHaveBeenCalledWith(1, 1, 1, 99.99);
    });

    it('should return 401 when not authenticated', async () => {
      // Mock unauthenticated session
      (getServerSession as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ productId: 1, quantity: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'You must be logged in to make a purchase' });
    });

    it('should return 404 when product not found', async () => {
      // Mock authenticated session
      (getServerSession as jest.Mock).mockResolvedValueOnce({
        user: { id: '1', name: 'Test User' },
      });

      // Mock product not found
      (prisma.product.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/purchases', {
        method: 'POST',
        body: JSON.stringify({ productId: 999, quantity: 1 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Product not found' });
    });
  });
});
