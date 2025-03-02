/**
 * Interface for feature runners
 */
export interface FeatureRunner {
  /**
   * Get the name of the runner
   */
  getName(): string;

  /**
   * Check if the feature is enabled
   */
  isEnabled(): Promise<boolean>;

  /**
   * Run the feature
   */
  run(context: FeatureContext): Promise<FeatureResult>;
}

/**
 * Context for feature execution
 */
export interface FeatureContext {
  /**
   * ID of the brand
   */
  brandId: string;

  /**
   * Additional metadata for the feature
   */
  metadata?: Record<string, unknown>;
}

/**
 * Result of feature execution
 */
export interface FeatureResult {
  /**
   * Whether the feature execution was successful
   */
  success: boolean;

  /**
   * Result data
   */
  data?: Record<string, unknown>;

  /**
   * Error information if execution failed
   */
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
}
