import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { HealthService } from './health.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly healthService: HealthService,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => this.healthService.checkLiveness(),
      async () => this.healthService.checkReadiness(),
      async () => this.healthService.checkDatabase(),
    ]);
  }

  @Get('liveness')
  @Public()
  @HealthCheck()
  async checkLiveness() {
    return this.health.check([async () => this.healthService.checkLiveness()]);
  }

  @Get('readiness')
  @Public()
  @HealthCheck()
  async checkReadiness() {
    return this.health.check([async () => this.healthService.checkReadiness()]);
  }

  @Get('database')
  @Public()
  @HealthCheck()
  async checkDatabase() {
    return this.health.check([async () => this.healthService.checkDatabase()]);
  }
}
