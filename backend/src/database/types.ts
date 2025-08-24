export interface DatabaseConfig {
  type: 'firebase'; // Add more as needed
  credentials?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

export interface DatabaseQueryResult<T> {
  data: T[];
  metadata?: {
    total?: number;
    hasMore?: boolean;
    lastCursor?: string;
  };
}

export interface DatabaseTransaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: { field: string; direction: 'asc' | 'desc' }[];
  transaction?: DatabaseTransaction;
}

export interface DatabaseFilter {
  field: string;
  operator: string;
  value: unknown;
}

// Common database operations interface
export interface IDatabaseOperations {
  find<T>(
    collection: string,
    filters?: DatabaseFilter[],
    options?: QueryOptions
  ): Promise<DatabaseQueryResult<T>>;
  
  findOne<T>(
    collection: string,
    filters?: DatabaseFilter[]
  ): Promise<T | null>;
  
  findById<T>(
    collection: string,
    id: string
  ): Promise<T | null>;
  
  create<T>(
    collection: string,
    data: Partial<T>,
    options?: { transaction?: DatabaseTransaction }
  ): Promise<string>;
  
  update<T>(
    collection: string,
    id: string,
    data: Partial<T>,
    options?: { transaction?: DatabaseTransaction }
  ): Promise<void>;
  
  delete(
    collection: string,
    id: string,
    options?: { transaction?: DatabaseTransaction }
  ): Promise<void>;
  
  createBatch<T>(
    collection: string,
    items: Partial<T>[],
    options?: { transaction?: DatabaseTransaction }
  ): Promise<string[]>;
  
  updateBatch<T>(
    collection: string,
    items: { id: string; data: Partial<T> }[],
    options?: { transaction?: DatabaseTransaction }
  ): Promise<void>;
  
  deleteBatch(
    collection: string,
    ids: string[],
    options?: { transaction?: DatabaseTransaction }
  ): Promise<void>;
  
  startTransaction(): Promise<DatabaseTransaction>;
  
  // Real-time operations (optional - implementations can throw if not supported)
  subscribe<T>(
    collection: string,
    callback: (data: T[]) => void,
    filters?: DatabaseFilter[]
  ): () => void;
  
  subscribeToDocument<T>(
    collection: string,
    id: string,
    callback: (data: T | null) => void
  ): () => void;
}
