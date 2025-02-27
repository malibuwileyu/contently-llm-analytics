import { Test } from '@nestjs/testing';
import { Socket, Server } from 'socket.io';
import { AnalyticsGateway } from '../analytics.gateway';
import { JwtAuthGuard } from '../../../../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from '../../../../cache/cache.service';

describe('AnalyticsGateway', () => {
  let gateway: AnalyticsGateway;
  let mockServer: jest.Mocked<Server>;
  let mockClient: jest.Mocked<Socket>;
  let jwtService: JwtService;

  beforeEach(async () => {
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    } as any;

    mockClient = {
      id: 'test-client-id',
      data: {
        user: { id: 'test-user-id' },
      },
      join: jest.fn(),
      leave: jest.fn(),
    } as any;

    const module = await Test.createTestingModule({
      providers: [
        AnalyticsGateway,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn().mockResolvedValue({ sub: 'test-user-id' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret'),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            delete: jest.fn(),
            getOrSet: jest.fn(),
          },
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: jest.fn().mockResolvedValue(true),
    })
    .compile();

    gateway = module.get<AnalyticsGateway>(AnalyticsGateway);
    jwtService = module.get<JwtService>(JwtService);
    gateway.server = mockServer;
  });

  describe('handleConnection', () => {
    it('should initialize client subscriptions', async () => {
      await gateway.handleConnection(mockClient);
      expect(mockClient.data.user.id).toBe('test-user-id');
    });
  });

  describe('handleDisconnect', () => {
    it('should remove client subscriptions', async () => {
      await gateway.handleConnection(mockClient);
      gateway.handleDisconnect(mockClient);
      gateway.handleSubscribeToAnalytics(mockClient, { brandId: 'test-brand' });
      expect(mockClient.join).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscribeToAnalytics', () => {
    it('should subscribe client to brand analytics', async () => {
      await gateway.handleConnection(mockClient);
      const brandId = 'test-brand';
      gateway.handleSubscribeToAnalytics(mockClient, { brandId });
      expect(mockClient.join).toHaveBeenCalledWith(`analytics:${brandId}`);
    });

    it('should handle multiple subscriptions', async () => {
      await gateway.handleConnection(mockClient);
      const brands = ['brand-1', 'brand-2', 'brand-3'];
      brands.forEach(brandId => {
        gateway.handleSubscribeToAnalytics(mockClient, { brandId });
      });
      expect(mockClient.join).toHaveBeenCalledTimes(3);
      brands.forEach(brandId => {
        expect(mockClient.join).toHaveBeenCalledWith(`analytics:${brandId}`);
      });
    });
  });

  describe('unsubscribeFromAnalytics', () => {
    it('should unsubscribe client from brand analytics', async () => {
      await gateway.handleConnection(mockClient);
      const brandId = 'test-brand';
      gateway.handleSubscribeToAnalytics(mockClient, { brandId });
      gateway.handleUnsubscribeFromAnalytics(mockClient, { brandId });
      expect(mockClient.leave).toHaveBeenCalledWith(`analytics:${brandId}`);
    });
  });

  describe('broadcastAnalyticsUpdate', () => {
    it('should broadcast updates to subscribed clients', async () => {
      const brandId = 'test-brand';
      const data = {
        metric1: 'value1',
        metric2: 'value2',
      };

      await gateway.broadcastAnalyticsUpdate(brandId, data);

      expect(mockServer.to).toHaveBeenCalledWith(`analytics:${brandId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('analyticsUpdate', {
        brandId,
        timestamp: expect.any(Date),
        data,
      });
    });

    it('should filter metrics based on subscription', async () => {
      const brandId = 'test-brand';
      const data = {
        metric1: 'value1',
        metric2: 'value2',
        metric3: 'value3',
      };
      const metrics = ['metric1', 'metric3'];

      await gateway.broadcastAnalyticsUpdate(brandId, data, metrics);

      expect(mockServer.to).toHaveBeenCalledWith(`analytics:${brandId}`);
      expect(mockServer.emit).toHaveBeenCalledWith('analyticsUpdate', {
        brandId,
        timestamp: expect.any(Date),
        data: {
          metric1: 'value1',
          metric3: 'value3',
        },
      });
    });
  });
});
