import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsConfig, createMetricsConfig } from '../config/metrics.config';
import { PrometheusMetricsService } from './services/prometheus-metrics.service';
import { DatabaseMetricsService } from './services/database-metrics.service';
import { BusinessMetricsService } from './services/business-metrics.service';
import { MetricsController } from './controllers/metrics.controller';
import { HttpMetricsInterceptor } from './interceptors/http-metrics.interceptor';

/**
 * Metrics module options
 */
export interface MetricsModuleOptions {
  /** Whether to enable metrics collection */
  isGlobal?: boolean;

  /** Whether to register the metrics controller */
  registerController?: boolean;

  /** Metrics configuration */
  config?: Partial<MetricsConfig>;
}

/**
 * Metrics module
 */
@Module({})
export class MetricsModule {
  /**
   * Registers the metrics module
   * @param options Module options
   * @returns Dynamic module
   */
  static register(options: MetricsModuleOptions = {}): DynamicModule {
    const metricsConfigProvider: Provider = {
      provide: 'METRICS_CONFIG',
      useFactory: () => {
        const defaultConfig = createMetricsConfig();
        return {
          ...defaultConfig,
          ...options.config,
        };
      },
    };

    const providers = [
      metricsConfigProvider,
      PrometheusMetricsService,
      DatabaseMetricsService,
      BusinessMetricsService,
      HttpMetricsInterceptor,
      // Register the HTTP metrics interceptor at the module level
      {
        provide: APP_INTERCEPTOR,
        useClass: HttpMetricsInterceptor,
      },
    ];

    const exports = [
      PrometheusMetricsService,
      DatabaseMetricsService,
      BusinessMetricsService,
      HttpMetricsInterceptor,
    ];

    const controllers =
      options.registerController !== false ? [MetricsController] : [];

    const imports = [TypeOrmModule.forFeature([])];

    // If controller is _registered, add route configuration
    if (options.registerController !== false) {
      imports.push(
        RouterModule.register([
          {
            path: 'metrics',
            module: MetricsModule,
          },
        ]),
      );
    }

    return {
      module: MetricsModule,
      imports,
      providers,
      exports,
      controllers,
      global: options.isGlobal === true,
    };
  }
}
