import { QueryFilter } from '@/repositories/types';
import { Place, CreatePlaceCommand, UpdatePlaceCommand, PlaceQuery } from '../entities/place.entity';
import { IPlaceRepository } from '../repositories/interfaces/place.repository.interface';
import { PlaceRepository } from '../repositories/place/place.repository';
import { IPlaceService } from './interfaces/place.service.interface';

/**
 * Place Service - Contains ALL business logic and validation
 * Follows SOLID principles and Clean Architecture
 * Uses repository for data access ONLY
 * Implements comprehensive business rules and validation
 */
export class PlaceService implements IPlaceService {
  private readonly placeRepository: IPlaceRepository;

  constructor(placeRepository?: IPlaceRepository) {
    this.placeRepository = placeRepository ?? new PlaceRepository();
  }

  async createPlace(command: CreatePlaceCommand): Promise<Place> {
    // Business validation
    this.validateCreateCommand(command);

    // Check if place with same name already exists for this owner
    const existingPlaces = await this.placeRepository.getByOwnerId(command.ownerId);
    const duplicatePlace = existingPlaces.find(place => 
      place.name.toLowerCase() === command.name.toLowerCase()
    );

    if (duplicatePlace) {
      throw new Error(`Place with name "${command.name}" already exists for this owner`);
    }

    // Create new place with business rules applied
    const placeData: Omit<Place, 'id' | 'createdAt' | 'updatedAt'> = {
      name: command.name,
      description: command.description,
      address: command.address,
      contact: command.contact,
      businessHours: command.businessHours,
      settings: {
        currency: command.settings.currency,
        timezone: command.settings.timezone,
        language: command.settings.language,
        allowOnlineOrders: command.settings.allowOnlineOrders ?? true,
        requireOrderConfirmation: command.settings.requireOrderConfirmation ?? false,
        minimumOrderAmount: command.settings.minimumOrderAmount,
        deliveryFee: command.settings.deliveryFee,
        serviceFee: command.settings.serviceFee,
        taxRate: command.settings.taxRate
      },
      status: 'pending_approval', // New places require approval
      ownerId: command.ownerId
    };

    const placeId = await this.placeRepository.create(placeData as any);
    const createdPlace = await this.placeRepository.getById(placeId);
    
    if (!createdPlace) {
      throw new Error('Failed to create place');
    }

    return createdPlace;
  }

  async updatePlace(command: UpdatePlaceCommand): Promise<Place> {
    // Business validation
    this.validateUpdateCommand(command);

    const existingPlace = await this.placeRepository.getById(command.id);
    if (!existingPlace) {
      throw new Error('Place not found');
    }

    // Apply business rules for updates
    const updateData: Partial<Omit<Place, 'id' | 'createdAt' | 'updatedAt'>> = {};

    if (command.name !== undefined) {
      // Check for duplicate names within the same owner's places
      const ownerPlaces = await this.placeRepository.getByOwnerId(existingPlace.ownerId);
      const duplicatePlace = ownerPlaces.find(place => 
        place.id !== command.id && 
        place.name.toLowerCase() === command.name?.toLowerCase()
      );

      if (duplicatePlace) {
        throw new Error(`Place with name "${command.name}" already exists for this owner`);
      }
      updateData.name = command.name;
    }

    if (command.description !== undefined) {
      updateData.description = command.description;
    }

    if (command.address !== undefined) {
      this.validateAddress(command.address as Place['address']);
      updateData.address = { ...existingPlace.address, ...command.address } as Place['address'];
    }

    if (command.contact !== undefined) {
      this.validateContact(command.contact as Place['contact']);
      updateData.contact = { ...existingPlace.contact, ...command.contact };
    }

    if (command.businessHours !== undefined) {
      this.validateBusinessHours(command.businessHours as Place['businessHours']);
      updateData.businessHours = { ...existingPlace.businessHours, ...command.businessHours } as Place['businessHours'];
    }

    if (command.settings !== undefined) {
      updateData.settings = { ...existingPlace.settings, ...command.settings } as Place['settings'];
    }

    if (command.status !== undefined) {
      // Business rule: Only allow certain status transitions
      this.validateStatusTransition(existingPlace.status, command.status);
      updateData.status = command.status;
    }

    await this.placeRepository.update(command.id, updateData);
    const updatedPlace = await this.placeRepository.getById(command.id);
    
    if (!updatedPlace) {
      throw new Error('Failed to update place');
    }

    return updatedPlace;
  }

  async deletePlace(placeId: string): Promise<void> {
    const place = await this.placeRepository.getById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    // Business rule: Check if place can be deleted
    if (place.status === 'active') {
      throw new Error('Cannot delete active place. Deactivate first.');
    }

    await this.placeRepository.delete(placeId);
  }

  async getPlaceById(placeId: string): Promise<Place | null> {
    return this.placeRepository.getById(placeId);
  }

  async getPlacesByOwner(ownerId: string): Promise<Place[]> {
    return this.placeRepository.getByOwnerId(ownerId);
  }

  async getActivePlaces(): Promise<Place[]> {
    return this.placeRepository.getActivePlaces();
  }

  async searchPlaces(searchTerm: string): Promise<Place[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters long');
    }
    return this.placeRepository.searchPlaces(searchTerm.trim());
  }

  async getPlacesByLocation(city: string, state?: string): Promise<Place[]> {
    if (!city || city.trim().length === 0) {
      throw new Error('City is required for location search');
    }
    return this.placeRepository.getByLocation(city.trim(), state?.trim());
  }

  async getPlacesWithOnlineOrders(): Promise<Place[]> {
    return this.placeRepository.getPlacesWithOnlineOrders();
  }

  async activatePlace(placeId: string): Promise<void> {
    const place = await this.placeRepository.getById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    if (place.status === 'active') {
      throw new Error('Place is already active');
    }

    // Business rule: Only pending_approval places can be activated
    if (place.status !== 'pending_approval') {
      throw new Error('Only pending approval places can be activated');
    }

    await this.placeRepository.update(placeId, { status: 'active' });
  }

  async deactivatePlace(placeId: string): Promise<void> {
    const place = await this.placeRepository.getById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    if (place.status === 'inactive') {
      throw new Error('Place is already inactive');
    }

    await this.placeRepository.update(placeId, { status: 'inactive' });
  }

  async suspendPlace(placeId: string): Promise<void> {
    const place = await this.placeRepository.getById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    if (place.status === 'suspended') {
      throw new Error('Place is already suspended');
    }

    await this.placeRepository.update(placeId, { 
      status: 'suspended'
    });
  }

  async validatePlaceOwnership(placeId: string, ownerId: string): Promise<boolean> {
    const place = await this.placeRepository.getById(placeId);
    return place ? place.ownerId === ownerId : false;
  }

  async canPlaceAcceptOrders(placeId: string): Promise<boolean> {
    const place = await this.placeRepository.getById(placeId);
    if (!place) return false;

    return place.status === 'active' && 
           place.settings.allowOnlineOrders && 
           await this.isPlaceOpen(placeId);
  }

  async isPlaceOpen(placeId: string): Promise<boolean> {
    const place = await this.placeRepository.getById(placeId);
    if (!place) return false;

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof place.businessHours;
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todayHours = place.businessHours[dayOfWeek];
    if (!todayHours || !todayHours.isOpen) return false;

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }

  async queryPlaces(query: PlaceQuery): Promise<Place[]> {
    // Build filters based on query
    const filters = [];

    if (query.ownerId) {
      filters.push({ field: 'ownerId', operator: '==', value: query.ownerId });
    }

    if (query.status) {
      filters.push({ field: 'status', operator: '==', value: query.status });
    }

    if (query.city) {
      filters.push({ field: 'address.city', operator: '==', value: query.city });
    }

    if (query.state) {
      filters.push({ field: 'address.state', operator: '==', value: query.state });
    }

    if (query.allowOnlineOrders !== undefined) {
      filters.push({ field: 'settings.allowOnlineOrders', operator: '==', value: query.allowOnlineOrders });
    }

    if (filters.length === 0) {
      return this.placeRepository.getAll();
    }

    return this.placeRepository.queryPlaces(filters as QueryFilter[]);
  }

  async getNearbyPlaces(latitude: number, longitude: number, radiusKm: number): Promise<Place[]> {
    if (radiusKm <= 0 || radiusKm > 100) {
      throw new Error('Radius must be between 0 and 100 kilometers');
    }

    return this.placeRepository.getNearbyPlaces(latitude, longitude, radiusKm);
  }

  // Business validation methods
  validateBusinessHours(businessHours: Place['businessHours']): boolean {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const hours = businessHours[day];
      if (hours && hours.isOpen) {
        if (!this.isValidTimeFormat(hours.open) || !this.isValidTimeFormat(hours.close)) {
          return false;
        }
        if (hours.open >= hours.close) {
          return false;
        }
      }
    }
    return true;
  }

  validateAddress(address: Place['address']): boolean {
    return !!(address.street && address.city && address.state && address.zipCode && address.country);
  }

  validateContact(contact: Place['contact']): boolean {
    // At least one contact method should be provided
    return !!(contact.phone || contact.email || contact.website);
  }

  private validateCreateCommand(command: CreatePlaceCommand): void {
    if (!command.name || command.name.trim().length === 0) {
      throw new Error('Place name is required');
    }

    if (command.name.length > 100) {
      throw new Error('Place name must be 100 characters or less');
    }

    if (!command.ownerId || command.ownerId.trim().length === 0) {
      throw new Error('Owner ID is required');
    }

    if (!this.validateAddress(command.address)) {
      throw new Error('Valid address is required');
    }

    if (!this.validateContact(command.contact)) {
      throw new Error('At least one contact method is required');
    }

    if (!this.validateBusinessHours(command.businessHours)) {
      throw new Error('Valid business hours are required');
    }

    if (!command.settings.currency || command.settings.currency.length !== 3) {
      throw new Error('Valid 3-letter currency code is required');
    }

    if (!command.settings.timezone) {
      throw new Error('Timezone is required');
    }

    if (!command.settings.language || command.settings.language.length !== 2) {
      throw new Error('Valid 2-letter language code is required');
    }
  }

  private validateUpdateCommand(command: UpdatePlaceCommand): void {
    if (!command.id || command.id.trim().length === 0) {
      throw new Error('Place ID is required');
    }

    if (command.name !== undefined) {
      if (command.name.trim().length === 0) {
        throw new Error('Place name cannot be empty');
      }
      if (command.name.length > 100) {
        throw new Error('Place name must be 100 characters or less');
      }
    }

    if (command.address !== undefined && !this.validateAddress(command.address as Place['address'])) {
      throw new Error('Valid address is required');
    }

    if (command.contact !== undefined && !this.validateContact(command.contact)) {
      throw new Error('At least one contact method is required');
    }

    if (command.businessHours !== undefined && !this.validateBusinessHours(command.businessHours as Place['businessHours'])) {
      throw new Error('Valid business hours are required');
    }
  }

  private validateStatusTransition(currentStatus: Place['status'], newStatus: Place['status']): void {
    const validTransitions: Record<Place['status'], Place['status'][]> = {
      'pending_approval': ['active', 'inactive'],
      'active': ['inactive', 'suspended'],
      'inactive': ['active'],
      'suspended': ['active', 'inactive']
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }
  }

  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}
