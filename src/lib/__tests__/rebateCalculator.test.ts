import { calculateRebates, getUplineUsers, processRebates } from '../rebateCalculator';
import { prisma } from '../prisma';

// Mock the Prisma client
jest.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    rebateConfig: {
      findMany: jest.fn(),
    },
    rebate: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    walletTransaction: {
      create: jest.fn(),
    },
  },
}));

describe('Rebate Calculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUplineUsers', () => {
    it('should return an empty array if user has no upline', async () => {
      // Mock user with no upline
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 1,
        name: 'User 1',
        upline: null,
      });

      const result = await getUplineUsers(1);
      expect(result).toEqual([]);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return upline users up to the specified level', async () => {
      // Mock user with upline chain
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 3,
        name: 'User 3',
        upline: { id: 2, name: 'User 2' },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 2,
        name: 'User 2',
        upline: { id: 1, name: 'User 1' },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 1,
        name: 'User 1',
        upline: null,
      });

      const result = await getUplineUsers(3);
      
      expect(result).toHaveLength(2);
      expect(result[0].user.id).toBe(2);
      expect(result[0].level).toBe(1);
      expect(result[1].user.id).toBe(1);
      expect(result[1].level).toBe(2);
      
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(3);
    });

    it('should respect the maxLevels parameter', async () => {
      // Mock user with upline chain
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 3,
        name: 'User 3',
        upline: { id: 2, name: 'User 2' },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 2,
        name: 'User 2',
        upline: { id: 1, name: 'User 1' },
      });

      const result = await getUplineUsers(3, 1);
      
      expect(result).toHaveLength(1);
      expect(result[0].user.id).toBe(2);
      expect(result[0].level).toBe(1);
      
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('calculateRebates', () => {
    it('should calculate rebates for upline users based on product rebate config', async () => {
      // Mock rebate configs
      (prisma.rebateConfig.findMany as jest.Mock).mockResolvedValueOnce([
        { level: 1, percentage: 10 },
        { level: 2, percentage: 5 },
      ]);

      // Mock upline users
      const mockGetUplineUsers = jest.spyOn({ getUplineUsers }, 'getUplineUsers');
      mockGetUplineUsers.mockResolvedValueOnce([
        { user: { id: 2, name: 'User 2' }, level: 1 },
        { user: { id: 1, name: 'User 1' }, level: 2 },
      ]);

      // Mock rebate creation
      (prisma.rebate.create as jest.Mock).mockResolvedValueOnce({
        id: 1,
        purchaseId: 1,
        receiverId: 2,
        generatorId: 3,
        level: 1,
        percentage: 10,
        amount: 10,
        status: 'pending',
      });

      (prisma.rebate.create as jest.Mock).mockResolvedValueOnce({
        id: 2,
        purchaseId: 1,
        receiverId: 1,
        generatorId: 3,
        level: 2,
        percentage: 5,
        amount: 5,
        status: 'pending',
      });

      const result = await calculateRebates(1, 3, 1, 100);
      
      expect(result).toHaveLength(2);
      expect(prisma.rebateConfig.findMany).toHaveBeenCalledWith({
        where: { productId: 1 },
        orderBy: { level: 'asc' },
      });
      
      expect(prisma.rebate.create).toHaveBeenCalledTimes(2);
      expect(prisma.rebate.create).toHaveBeenCalledWith({
        data: {
          purchaseId: 1,
          receiverId: 2,
          generatorId: 3,
          level: 1,
          percentage: 10,
          amount: 10,
          status: 'pending',
        },
      });
      
      expect(prisma.rebate.create).toHaveBeenCalledWith({
        data: {
          purchaseId: 1,
          receiverId: 1,
          generatorId: 3,
          level: 2,
          percentage: 5,
          amount: 5,
          status: 'pending',
        },
      });
    });
  });

  describe('processRebates', () => {
    it('should process pending rebates and update wallet balances', async () => {
      // Mock pending rebates
      (prisma.rebate.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          receiverId: 2,
          amount: 10,
          level: 1,
          status: 'pending',
          receiver: { id: 2, name: 'User 2' },
        },
        {
          id: 2,
          receiverId: 1,
          amount: 5,
          level: 2,
          status: 'pending',
          receiver: { id: 1, name: 'User 1' },
        },
      ]);

      // Mock user updates
      (prisma.user.update as jest.Mock).mockResolvedValue({});
      
      // Mock wallet transaction creation
      (prisma.walletTransaction.create as jest.Mock).mockResolvedValue({});
      
      // Mock rebate status update
      (prisma.rebate.update as jest.Mock).mockResolvedValue({});

      await processRebates();
      
      expect(prisma.rebate.findMany).toHaveBeenCalledWith({
        where: { status: 'pending' },
        include: { receiver: true },
      });
      
      expect(prisma.user.update).toHaveBeenCalledTimes(2);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { walletBalance: { increment: 10 } },
      });
      
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { walletBalance: { increment: 5 } },
      });
      
      expect(prisma.walletTransaction.create).toHaveBeenCalledTimes(2);
      expect(prisma.rebate.update).toHaveBeenCalledTimes(2);
    });

    it('should mark rebate as failed if processing fails', async () => {
      // Mock pending rebates
      (prisma.rebate.findMany as jest.Mock).mockResolvedValueOnce([
        {
          id: 1,
          receiverId: 2,
          amount: 10,
          level: 1,
          status: 'pending',
          receiver: { id: 2, name: 'User 2' },
        },
      ]);

      // Mock user update to throw an error
      (prisma.user.update as jest.Mock).mockRejectedValueOnce(new Error('Database error'));
      
      // Mock rebate status update
      (prisma.rebate.update as jest.Mock).mockResolvedValue({});

      await processRebates();
      
      expect(prisma.rebate.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'failed' },
      });
    });
  });
});
