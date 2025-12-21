import { QueryFilter } from '@/repositories/types';
import { Table, CreateTableCommand, UpdateTableCommand, TableQuery } from '../entities/table.entity';
import { ITableRepository } from '../repositories/interfaces/table.repository.interface';
import { TableRepository } from '../repositories/table/table.repository';
import { ITableService } from './interfaces/table.service.interface';
import { IPlaceRepository } from '../repositories/interfaces/place.repository.interface';
import { PlaceRepository } from '../repositories/place/place.repository';

/**
 * Table Service - Contains ALL business logic and validation
 * Follows SOLID principles and Clean Architecture
 * Uses repository for data access ONLY
 * Implements comprehensive business rules and validation
 */
export class TableService implements ITableService {
  private readonly tableRepository: ITableRepository;
  private readonly placeRepository: IPlaceRepository;

  constructor(
    tableRepository?: ITableRepository,
    placeRepository?: IPlaceRepository
  ) {
    this.tableRepository = tableRepository ?? new TableRepository();
    this.placeRepository = placeRepository ?? new PlaceRepository();
  }

  async createTable(command: CreateTableCommand): Promise<Table> {
    // Business validation
    this.validateCreateCommand(command);

    // Validate that the place exists
    const place = await this.placeRepository.getById(command.placeId);
    if (!place) {
      throw new Error(`Place with ID "${command.placeId}" not found`);
    }

    // Validate branch if provided
    if (command.branchId) {
      // Note: In a real implementation, you might want to validate the branch exists
      // For now, we'll just check if it's provided
    }

    // Check if table with same number already exists for this place
    const existingTable = await this.tableRepository.getByTableNumber(
      command.placeId,
      command.tableNumber
    );

    if (existingTable) {
      throw new Error(`Table with number "${command.tableNumber}" already exists for this place`);
    }

    // Validate capacity
    if (command.capacity < 1) {
      throw new Error('Table capacity must be at least 1');
    }

    // Create new table with business rules applied
    const tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'> = {
      tableNumber: command.tableNumber,
      capacity: command.capacity,
      status: command.status || 'AVAILABLE',
      placeId: command.placeId,
      branchId: command.branchId,
      location: command.location,
      notes: command.notes,
      isActive: command.isActive !== undefined ? command.isActive : true
    };

    const tableId = await this.tableRepository.create(tableData as any);
    const createdTable = await this.tableRepository.getById(tableId);
    
    if (!createdTable) {
      throw new Error('Failed to create table');
    }

    return createdTable;
  }

  async updateTable(command: UpdateTableCommand): Promise<Table> {
    // Business validation
    this.validateUpdateCommand(command);

    const existingTable = await this.tableRepository.getById(command.id);
    if (!existingTable) {
      throw new Error('Table not found');
    }

    // Validate capacity if provided
    if (command.capacity !== undefined && command.capacity < 1) {
      throw new Error('Table capacity must be at least 1');
    }

    // Check if table number is being changed and if it conflicts with existing table
    if (command.tableNumber && command.tableNumber !== existingTable.tableNumber) {
      const conflictingTable = await this.tableRepository.getByTableNumber(
        existingTable.placeId,
        command.tableNumber
      );

      if (conflictingTable && conflictingTable.id !== command.id) {
        throw new Error(`Table with number "${command.tableNumber}" already exists for this place`);
      }
    }

    // Check if table has active order and is being set to unavailable status
    if (command.status && 
        existingTable.currentOrderId && 
        (command.status === 'AVAILABLE' || command.status === 'OUT_OF_SERVICE')) {
      throw new Error('Cannot change status: table has an active order');
    }

    // Prepare update data
    const updateData: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>> = {};

    if (command.tableNumber !== undefined) {
      updateData.tableNumber = command.tableNumber;
    }
    if (command.capacity !== undefined) {
      updateData.capacity = command.capacity;
    }
    if (command.status !== undefined) {
      updateData.status = command.status;
    }
    if (command.location !== undefined) {
      updateData.location = command.location;
    }
    if (command.notes !== undefined) {
      updateData.notes = command.notes;
    }
    if (command.isActive !== undefined) {
      updateData.isActive = command.isActive;
    }
    if (command.serverId !== undefined) {
      updateData.serverId = command.serverId;
    }
    if (command.serverName !== undefined) {
      updateData.serverName = command.serverName;
    }

    await this.tableRepository.update(command.id, updateData);
    const updatedTable = await this.tableRepository.getById(command.id);
    
    if (!updatedTable) {
      throw new Error('Failed to update table');
    }

    return updatedTable;
  }

  async deleteTable(id: string): Promise<void> {
    const table = await this.tableRepository.getById(id);
    if (!table) {
      throw new Error('Table not found');
    }

    // Business rule: Cannot delete table with active order
    if (table.currentOrderId) {
      throw new Error('Cannot delete table: table has an active order');
    }

    await this.tableRepository.delete(id);
  }

  async getTableById(id: string): Promise<Table | null> {
    return this.tableRepository.getById(id);
  }

  async queryTables(query: TableQuery): Promise<Table[]> {
    return this.tableRepository.queryTables(query);
  }

  async getTablesByPlaceId(placeId: string): Promise<Table[]> {
    return this.tableRepository.getByPlaceId(placeId);
  }

  async getTablesByBranchId(branchId: string): Promise<Table[]> {
    return this.tableRepository.getByBranchId(branchId);
  }

  async getTablesByStatus(placeId: string, status: Table['status']): Promise<Table[]> {
    const tables = await this.tableRepository.getByPlaceId(placeId);
    return tables.filter(table => table.status === status);
  }

  // Private validation methods
  private validateCreateCommand(command: CreateTableCommand): void {
    if (!command.tableNumber || command.tableNumber.trim() === '') {
      throw new Error('Table number is required');
    }

    if (!command.capacity || command.capacity < 1) {
      throw new Error('Table capacity must be at least 1');
    }

    if (!command.placeId || command.placeId.trim() === '') {
      throw new Error('Place ID is required');
    }

    if (command.status && !['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'OUT_OF_SERVICE'].includes(command.status)) {
      throw new Error('Invalid table status');
    }
  }

  private validateUpdateCommand(command: UpdateTableCommand): void {
    if (!command.id || command.id.trim() === '') {
      throw new Error('Table ID is required');
    }

    if (command.tableNumber !== undefined && command.tableNumber.trim() === '') {
      throw new Error('Table number cannot be empty');
    }

    if (command.capacity !== undefined && command.capacity < 1) {
      throw new Error('Table capacity must be at least 1');
    }

    if (command.status && !['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'OUT_OF_SERVICE'].includes(command.status)) {
      throw new Error('Invalid table status');
    }
  }
}

