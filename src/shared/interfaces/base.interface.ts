/**
 * Base interface for all entities in the system
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string;

  /** When the entity was created */
  createdAt: Date;

  /** When the entity was last updated */
  updatedAt: Date;

  /** When the entity was soft deleted (if applicable) */
  deletedAt?: Date;
} 