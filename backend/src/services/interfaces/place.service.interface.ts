import { Place, CreatePlaceCommand, UpdatePlaceCommand, PlaceQuery } from '../../entities/place.entity';

/**
 * Place Service Interface
 * Follows Interface Segregation Principle
 * Defines contract for place business operations
 * Contains ALL business logic and validation
 */
export interface IPlaceService {
  // Core CRUD Operations
  createPlace(command: CreatePlaceCommand): Promise<Place>;
  updatePlace(command: UpdatePlaceCommand): Promise<Place>;
  deletePlace(placeId: string): Promise<void>;
  getPlaceById(placeId: string): Promise<Place | null>;
  
  // Business Operations
  getPlacesByOwner(ownerId: string): Promise<Place[]>;
  getActivePlaces(): Promise<Place[]>;
  searchPlaces(searchTerm: string): Promise<Place[]>;
  getPlacesByLocation(city: string, state?: string): Promise<Place[]>;
  getPlacesWithOnlineOrders(): Promise<Place[]>;
  
  // Status Management
  activatePlace(placeId: string): Promise<void>;
  deactivatePlace(placeId: string): Promise<void>;
  suspendPlace(placeId: string, reason?: string): Promise<void>;
  
  // Business Validation
  validatePlaceOwnership(placeId: string, ownerId: string): Promise<boolean>;
  canPlaceAcceptOrders(placeId: string): Promise<boolean>;
  isPlaceOpen(placeId: string): Promise<boolean>;
  
  // Advanced Queries
  queryPlaces(query: PlaceQuery): Promise<Place[]>;
  getNearbyPlaces(latitude: number, longitude: number, radiusKm: number): Promise<Place[]>;
  
  // Business Rules
  validateBusinessHours(businessHours: Place['businessHours']): boolean;
  validateAddress(address: Place['address']): boolean;
  validateContact(contact: Place['contact']): boolean;
}
