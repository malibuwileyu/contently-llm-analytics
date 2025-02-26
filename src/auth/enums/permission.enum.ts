export enum Permission {
  // Content permissions
  CREATE_CONTENT = 'create:content',
  READ_CONTENT = 'read:content',
  UPDATE_CONTENT = 'update:content',
  DELETE_CONTENT = 'delete:content',

  // User management permissions
  MANAGE_USERS = 'manage:users',
  VIEW_USERS = 'view:users',

  // Analytics permissions
  VIEW_ANALYTICS = 'view:analytics',
  MANAGE_ANALYTICS = 'manage:analytics',

  // System permissions
  MANAGE_SYSTEM = 'manage:system',
  VIEW_SYSTEM = 'view:system'
} 