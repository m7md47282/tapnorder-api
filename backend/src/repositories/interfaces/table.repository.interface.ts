import { IBaseRepository } from '../base.repository';
import { Table, TableQuery } from '../../entities/table.entity';

/**
 * Table Repository Interface
 * Extends IBaseRepository with table-specific queries
 * Follows SOLID principles and Clean Architecture
 */
export interface ITableRepository extends IBaseRepository<Table> {
  /**
   * Get tables by place ID
   */
  getByPlaceId(placeId: string): Promise<Table[]>;

  /**
   * Get tables by branch ID
   */
  getByBranchId(branchId: string): Promise<Table[]>;

  /**
   * Get tables by status
   */
  getByStatus(status: Table['status']): Promise<Table[]>;

  /**
   * Get tables by location
   */
  getByLocation(location: string): Promise<Table[]>;

  /**
   * Get active tables
   */
  getActiveTables(): Promise<Table[]>;

  /**
   * Query tables with filters
   */
  queryTables(query: TableQuery): Promise<Table[]>;

  /**
   * Get table by table number and place ID
   */
  getByTableNumber(placeId: string, tableNumber: string): Promise<Table | null>;

  /**
   * Get tables with active orders
   */
  getTablesWithActiveOrders(placeId: string): Promise<Table[]>;
}

