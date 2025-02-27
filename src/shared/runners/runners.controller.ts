import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { MainRunnerService } from './main-runner.service';
import { FeatureRegistryService } from './feature-registry.service';
import { FeatureContext, FeatureResult } from '../../modules/answer-engine/runners/answer-engine.runner';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Controller for feature runners
 */
@ApiTags('runners')
@Controller('runners')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class RunnersController {
  constructor(
    private readonly mainRunnerService: MainRunnerService,
    private readonly featureRegistry: FeatureRegistryService
  ) {}

  /**
   * Get all registered runners
   */
  @Get()
  @ApiOperation({ summary: 'Get all registered runners' })
  async getAllRunners(): Promise<{ runners: string[] }> {
    const runners = this.featureRegistry.getAllRunners();
    return {
      runners: runners.map(runner => runner.getName())
    };
  }

  /**
   * Get enabled runners
   */
  @Get('enabled')
  @ApiOperation({ summary: 'Get enabled runners' })
  async getEnabledRunners(): Promise<{ runners: string[] }> {
    const runners = await this.featureRegistry.getEnabledRunners();
    return {
      runners: runners.map(runner => runner.getName())
    };
  }

  /**
   * Run all enabled features
   */
  @Post('run-all')
  @ApiOperation({ summary: 'Run all enabled features' })
  @ApiBody({ description: 'Feature context' })
  async runAll(@Body() context: FeatureContext): Promise<{ results: Record<string, FeatureResult> }> {
    const resultsMap = await this.mainRunnerService.runAll(context);
    const results: Record<string, FeatureResult> = {};
    
    for (const [name, result] of resultsMap.entries()) {
      results[name] = result;
    }
    
    return { results };
  }

  /**
   * Run a specific feature
   */
  @Post('run/:name')
  @ApiOperation({ summary: 'Run a specific feature' })
  @ApiParam({ name: 'name', description: 'Name of the feature to run' })
  @ApiBody({ description: 'Feature context' })
  async runOne(
    @Param('name') name: string,
    @Body() context: FeatureContext
  ): Promise<{ result: FeatureResult }> {
    const result = await this.mainRunnerService.runOne(name, context);
    return { result };
  }
} 