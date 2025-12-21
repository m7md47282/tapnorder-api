import { Table, CreateTableCommand, UpdateTableCommand, TableQuery } from '../../entities/table.entity';

/**
 * Table Service Interface
 * Defines contract for table business logic operations
 * Follows Interface Segregation Principle
 */
export interface ITableService {
  createTable(command: CreateTableCommand): Promise<Table>;
  updateTable(command: UpdateTableCommand): Promise<Table>;
  deleteTable(id: string): Promise<void>;
  getTableById(id: string): Promise<Table | null>;
  queryTables(query: TableQuery): Promise<Table[]>;
  getTablesByPlaceId(placeId: string): Promise<Table[]>;
  getTablesByBranchId(branchId: string): Promise<Table[]>;
  getTablesByStatus(placeId: string, status: Table['status']): Promise<Table[]>;
}

