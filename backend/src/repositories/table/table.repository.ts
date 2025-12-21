import { BaseRepository } from '../base.repository';
import { Table, TableQuery } from '../../entities/table.entity';
import { ITableRepository } from '../interfaces/table.repository.interface';
import { QueryFilter } from '../types';

/**
 * Table Repository - Extends BaseRepository, Implements ITableRepository
 * Follows SOLID principles and Clean Architecture
 * NO business logic - only data access operations
 * Uses Firebase directly for data persistence
 */
export class TableRepository extends BaseRepository<Table> implements ITableRepository {
  constructor() {
    super('tables');
  }

  async getByPlaceId(placeId: string): Promise<Table[]> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    return this.query(filters);
  }

  async getByBranchId(branchId: string): Promise<Table[]> {
    const filters: QueryFilter[] = [
      { field: 'branchId', operator: '==', value: branchId }
    ];
    return this.query(filters);
  }

  async getByStatus(status: Table['status']): Promise<Table[]> {
    const filters: QueryFilter[] = [
      { field: 'status', operator: '==', value: status }
    ];
    return this.query(filters);
  }

  async getByLocation(location: string): Promise<Table[]> {
    const filters: QueryFilter[] = [
      { field: 'location', operator: '==', value: location }
    ];
    return this.query(filters);
  }

  async getActiveTables(): Promise<Table[]> {
    const filters: QueryFilter[] = [
      { field: 'isActive', operator: '==', value: true }
    ];
    return this.query(filters);
  }

  async queryTables(query: TableQuery): Promise<Table[]> {
    const filters: QueryFilter[] = [];

    if (query.placeId) {
      filters.push({ field: 'placeId', operator: '==', value: query.placeId });
    }

    if (query.branchId) {
      filters.push({ field: 'branchId', operator: '==', value: query.branchId });
    }

    if (query.status) {
      filters.push({ field: 'status', operator: '==', value: query.status });
    }

    if (query.location) {
      filters.push({ field: 'location', operator: '==', value: query.location });
    }

    if (query.isActive !== undefined) {
      filters.push({ field: 'isActive', operator: '==', value: query.isActive });
    }

    let tables = await this.query(filters);

    // Filter by search term in memory (to avoid Firestore index issues)
    if (query.search) {
      const searchLower = query.search.toLowerCase();
      tables = tables.filter(table => 
        table.tableNumber.toLowerCase().includes(searchLower) ||
        (table.location && table.location.toLowerCase().includes(searchLower))
      );
    }

    return tables;
  }

  async getByTableNumber(placeId: string, tableNumber: string): Promise<Table | null> {
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId },
      { field: 'tableNumber', operator: '==', value: tableNumber }
    ];
    return this.queryOne(filters);
  }

  async getTablesWithActiveOrders(placeId: string): Promise<Table[]> {
    // Get all tables for the place and filter in memory
    // Firestore doesn't support != null queries efficiently
    const filters: QueryFilter[] = [
      { field: 'placeId', operator: '==', value: placeId }
    ];
    const tables = await this.query(filters);
    return tables.filter(table => table.currentOrderId !== undefined && table.currentOrderId !== null);
  }
}

