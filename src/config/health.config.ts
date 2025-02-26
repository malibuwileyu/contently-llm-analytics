import { registerAs } from '@nestjs/config';

export interface HealthConfig {
  checkInterval: number;
  historySize: number;
  timeout: number;
  memory: {
    thresholdPercent: number;
  };
  disk: {
    thresholdPercent: number;
    mountPoints: string[];
  };
  externalServices: Record<string, string>;
}

export default registerAs('health', (): HealthConfig => ({
  // How often to run health checks (in milliseconds)
  checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10),
  
  // How many health check results to keep in history
  historySize: parseInt(process.env.HEALTH_HISTORY_SIZE || '100', 10),
  
  // Timeout for health checks (in milliseconds)
  timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
  
  // Memory health check configuration
  memory: {
    // Threshold for memory usage (percentage)
    thresholdPercent: parseInt(process.env.HEALTH_MEMORY_THRESHOLD || '90', 10),
  },
  
  // Disk health check configuration
  disk: {
    // Threshold for disk usage (percentage)
    thresholdPercent: parseInt(process.env.HEALTH_DISK_THRESHOLD || '90', 10),
    
    // Mount points to check
    mountPoints: (process.env.HEALTH_DISK_MOUNT_POINTS || '/').split(','),
  },
  
  // External services to check
  externalServices: {
    // Add external services here
    // Example: 'service-name': 'https://service-url/health'
    ...(process.env.EXTERNAL_SERVICES ? JSON.parse(process.env.EXTERNAL_SERVICES) : {}),
  },
})); 