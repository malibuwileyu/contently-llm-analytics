import { Test, TestingModule } from '@nestjs/testing';
import { Socket, Server } from 'socket.io';
import { AnalyticsGateway } from '../analytics.gateway';
import { createMockService } from '../../../../shared/test-utils';

describe('AnalyticsGateway', () => {
  let gateway: AnalyticsGateway;
  let mockServer: jest.Mocked<Server>;
  let mockClient: jest.Mocked<Socket>;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockClient = {
      id: 'test-client-id',
      data: {
        user: { id: 'test-user-id' }
      },
      join: jest.fn(),
      leave: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsGateway],
    }).compile();

    gateway = module.get<AnalyticsGateway>(AnalyticsGateway);
    gateway.server = mockServer;
  });

  describe('handleConnection', () => {
    it('should initialize client subscriptions', async () => {
      // Act
      await gateway.handleConnection(mockClient);

      // Assert
      expect(mockClient.data.user.id).toBe('test-user-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client subscriptions', async () => {
      // Arrange
      await gateway.handleConnection(mockClient);

      // Act
      gateway.handleDisconnect(mockClient);

      // Assert
      // Subscribe to analytics and verify it doesn't work
      gateway.handleSubscribeToAnalytics(mockClient, { brandId: 'test-brand' });
      expect(mockClient.join).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToAnalytics', () => {
    it('should subscribe client to brand analytics', async () => {
      // Arrange
      await gateway.handleConnection(mockClient);
      const brandId = 'test-brand';

      // Act
      gateway.handleSubscribeToAnalytics(mockClient, { brandId });

      // Assert
      expect(mockClient.join).toHaveBeenCalledWith(`analytics:${brandId}`);
    });

    it('should handle multiple subscriptions', async () => {
      // Arrange
      await gateway.handleConnection(mockClient);
      const brands = ['brand-1', 'brand-2', 'brand-3'];

      // Act
      brands.forEach(brandId => {
        gateway.handleSubscribeToAnalytics(mockClient, { brandId });
      });

      // Assert
      expect(mockClient.join).toHaveBeenCalledTimes(3);
      brands.forEach(brandId => {
        expect(mockClient.join).toHaveBeenCalledWith(`analytics:${brandId}`);
      });
    });
  });

  describe('unsubscribeFromAnalytics', () => {
    it('should unsubscribe client from brand analytics', async () => {
      // Arrange
      await gateway.handleConnection(mockClient);
      const brandId = 'test-brand';
      gateway.handleSubscribeToAnalytics(mockClient, { brandId });

      // Act
      gateway.handleUnsubscribeFromAnalytics(mockClient, { brandId });

      // Assert
      expect(mockClient.leave).toHaveBeenCalledWith(`analytics:${brandId}`);
    });
  });

  describe('broadcastAnalyticsUpdate', () => {
    it('should broadcast updates to subscribed clients', async () => {
      // Arrange
      const brandId = 'test-brand';
      const data = {
        metric1: 'value1',
        metric2: 'value2'
      };

      // Act
      await gateway.broadcastAnalyticsUpdate(brandId, data);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(`analytics:${brandId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('analyticsUpdate', {
        brandId,
        timestamp: expect.any(Date),
        data
      });
    });

    it('should filter metrics based on subscription', async () => {
      // Arrange
      const brandId = 'test-brand';
      const data = {
        metric1: 'value1',
        metric2: 'value2',
        metric3: 'value3'
      };
      const metrics = ['metric1', 'metric3'];

      // Act
      await gateway.broadcastAnalyticsUpdate(brandId, data, metrics);

      // Assert
      expect(mockServer.to).toHaveBeenCalledWith(`analytics:${brandId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('analyticsUpdate', {
        brandId,
        timestamp: expect.any(Date),
        data: {
          metric1: 'value1',
          metric3: 'value3'
        }
      });
    });
  });
}); 