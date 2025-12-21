/**
 * Table Entity - Domain Model
 * Represents a restaurant table with status tracking
 * Follows Clean Architecture principles
 */

export type TableStatus = 
  | 'AVAILABLE'      // Table is available for seating
  | 'OCCUPIED'       // Table is currently occupied
  | 'RESERVED'       // Table is reserved
  | 'CLEANING'       // Table is being cleaned
  | 'OUT_OF_SERVICE'; // Table is out of service

export interface Table {
  id: string;
  tableNumber: string; // Table number/identifier (e.g., "1", "A1", "VIP-1")
  capacity: number; // Number of seats (minimum: 1)
  status: TableStatus;
  placeId: string; // Place ID this table belongs to
  branchId?: string; // Branch ID (optional, for branch-specific tables)
  currentOrderId?: string; // ID of current active order
  serverId?: string; // ID of assigned server
  serverName?: string; // Name of assigned server
  reservationTime?: Date; // Reservation time
  seatedAt?: Date; // When guests were seated
  notes?: string; // Additional notes
  location?: string; // Location (e.g., 'Indoor', 'Outdoor', 'Bar Area')
  isActive: boolean; // Whether the table is active
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableCommand {
  tableNumber: string;
  capacity: number; // minimum: 1
  placeId: string;
  branchId?: string;
  status?: TableStatus; // default: 'AVAILABLE'
  location?: string;
  notes?: string;
  isActive?: boolean; // default: true
}

export interface UpdateTableCommand {
  id: string;
  tableNumber?: string;
  capacity?: number; // minimum: 1
  status?: TableStatus;
  location?: string;
  notes?: string;
  isActive?: boolean;
  serverId?: string;
  serverName?: string;
}

export interface TableQuery {
  placeId?: string;
  branchId?: string;
  status?: TableStatus;
  location?: string;
  isActive?: boolean;
  search?: string; // Search term for table number or location
}

