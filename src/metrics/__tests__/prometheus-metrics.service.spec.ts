import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrometheusMetricsService } from '../services/prometheus-metrics.service';

describe('PrometheusMetricsService', () => {
  let service: PrometheusMetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrometheusMetricsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'metrics') {
                return {
                  enabled: true,
                  prefix: 'test_',
                  endpoint: '/metrics',
                };
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<PrometheusMetricsService>(PrometheusMetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more tests as needed
}); 