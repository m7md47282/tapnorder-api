import { QueryFilter } from '@/repositories/types';
import { Branch, CreateBranchCommand, UpdateBranchCommand, BranchQuery } from '../entities/branch.entity';
import { IBranchRepository } from '../repositories/interfaces/branch.repository.interface';
import { BranchRepository } from '../repositories/branch/branch.repository';
import { IBranchService } from './interfaces/branch.service.interface';
import { IPlaceRepository } from '../repositories/interfaces/place.repository.interface';
import { PlaceRepository } from '../repositories/place/place.repository';

/**
 * Branch Service - Contains ALL business logic and validation
 * Follows SOLID principles and Clean Architecture
 * Uses repository for data access ONLY
 * Implements comprehensive business rules and validation
 */
export class BranchService implements IBranchService {
  private readonly branchRepository: IBranchRepository;
  private readonly placeRepository: IPlaceRepository;

  constructor(
    branchRepository?: IBranchRepository,
    placeRepository?: IPlaceRepository
  ) {
    this.branchRepository = branchRepository ?? new BranchRepository();
    this.placeRepository = placeRepository ?? new PlaceRepository();
  }

  async createBranch(command: CreateBranchCommand): Promise<Branch> {
    // Business validation
    this.validateCreateCommand(command);

    // Validate that the parent place exists
    const parentPlace = await this.placeRepository.getById(command.placeId);
    if (!parentPlace) {
      throw new Error(`Place with ID "${command.placeId}" not found`);
    }

    // Check if branch with same name already exists for this place
    const existingBranches = await this.branchRepository.getByPlaceId(command.placeId);
    const duplicateBranch = existingBranches.find(branch => 
      branch.name.toLowerCase() === command.name.toLowerCase()
    );

    if (duplicateBranch) {
      throw new Error(`Branch with name "${command.name}" already exists for this place`);
    }

    // Create new branch with business rules applied
    // Only include optional settings fields if they are defined (not undefined)
    const settings: Branch['settings'] = {
      currency: command.settings.currency,
      timezone: command.settings.timezone,
      language: command.settings.language,
      allowOnlineOrders: command.settings.allowOnlineOrders ?? true,
      requireOrderConfirmation: command.settings.requireOrderConfirmation ?? false
    };

    // Only add optional fields if they are defined
    if (command.settings.minimumOrderAmount !== undefined) {
      settings.minimumOrderAmount = command.settings.minimumOrderAmount;
    }
    if (command.settings.deliveryFee !== undefined) {
      settings.deliveryFee = command.settings.deliveryFee;
    }
    if (command.settings.serviceFee !== undefined) {
      settings.serviceFee = command.settings.serviceFee;
    }
    if (command.settings.taxRate !== undefined) {
      settings.taxRate = command.settings.taxRate;
    }

    const branchData: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'> = {
      placeId: command.placeId,
      name: command.name,
      description: command.description,
      address: command.address,
      contact: command.contact,
      businessHours: command.businessHours,
      settings,
      status: 'pending_approval' // New branches require approval
    };

    const branchId = await this.branchRepository.create(branchData as any);
    const createdBranch = await this.branchRepository.getById(branchId);
    
    if (!createdBranch) {
      throw new Error('Failed to create branch');
    }

    return createdBranch;
  }

  async updateBranch(command: UpdateBranchCommand): Promise<Branch> {
    // Business validation
    this.validateUpdateCommand(command);

    const existingBranch = await this.branchRepository.getById(command.id);
    if (!existingBranch) {
      throw new Error('Branch not found');
    }

    // Apply business rules for updates
    const updateData: Partial<Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>> = {};

    if (command.name !== undefined) {
      // Check for duplicate names within the same place's branches
      const placeBranches = await this.branchRepository.getByPlaceId(existingBranch.placeId);
      const duplicateBranch = placeBranches.find(branch => 
        branch.id !== command.id && 
        branch.name.toLowerCase() === command.name?.toLowerCase()
      );

      if (duplicateBranch) {
        throw new Error(`Branch with name "${command.name}" already exists for this place`);
      }
      updateData.name = command.name;
    }

    if (command.description !== undefined) {
      updateData.description = command.description;
    }

    if (command.address !== undefined) {
      this.validateAddress(command.address as Branch['address']);
      updateData.address = { ...existingBranch.address, ...command.address } as Branch['address'];
    }

    if (command.contact !== undefined) {
      this.validateContact(command.contact);
      updateData.contact = { ...existingBranch.contact, ...command.contact };
    }

    if (command.businessHours !== undefined) {
      this.validateBusinessHours(command.businessHours as Branch['businessHours']);
      updateData.businessHours = { ...existingBranch.businessHours, ...command.businessHours } as Branch['businessHours'];
    }

    if (command.settings !== undefined) {
      updateData.settings = { ...existingBranch.settings, ...command.settings };
    }

    if (command.status !== undefined) {
      // Validate status transition
      this.validateStatusTransition(existingBranch.status, command.status);
      updateData.status = command.status;
    }

    await this.branchRepository.update(command.id, updateData);
    const updatedBranch = await this.branchRepository.getById(command.id);
    
    if (!updatedBranch) {
      throw new Error('Failed to update branch');
    }

    return updatedBranch;
  }

  async deleteBranch(branchId: string): Promise<void> {
    const branch = await this.branchRepository.getById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    // Business rule: Cannot delete active branches
    if (branch.status === 'active') {
      throw new Error('Cannot delete active branch. Please deactivate it first');
    }

    await this.branchRepository.delete(branchId);
  }

  async getBranchById(branchId: string): Promise<Branch | null> {
    return this.branchRepository.getById(branchId);
  }

  async getBranchesByPlace(placeId: string): Promise<Branch[]> {
    return this.branchRepository.getByPlaceId(placeId);
  }

  async getActiveBranches(): Promise<Branch[]> {
    return this.branchRepository.getActiveBranches();
  }

  async searchBranches(searchTerm: string): Promise<Branch[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters long');
    }
    return this.branchRepository.searchBranches(searchTerm.trim());
  }

  async getBranchesByLocation(city: string, state?: string): Promise<Branch[]> {
    if (!city || city.trim().length === 0) {
      throw new Error('City is required for location search');
    }
    return this.branchRepository.getByLocation(city.trim(), state?.trim());
  }

  async getBranchesWithOnlineOrders(): Promise<Branch[]> {
    return this.branchRepository.getBranchesWithOnlineOrders();
  }

  async activateBranch(branchId: string): Promise<void> {
    const branch = await this.branchRepository.getById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    if (branch.status === 'active') {
      throw new Error('Branch is already active');
    }

    // Business rule: Only pending_approval branches can be activated
    if (branch.status !== 'pending_approval') {
      throw new Error('Only pending approval branches can be activated');
    }

    await this.branchRepository.update(branchId, { status: 'active' });
  }

  async deactivateBranch(branchId: string): Promise<void> {
    const branch = await this.branchRepository.getById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    if (branch.status === 'inactive') {
      throw new Error('Branch is already inactive');
    }

    await this.branchRepository.update(branchId, { status: 'inactive' });
  }

  async suspendBranch(branchId: string): Promise<void> {
    const branch = await this.branchRepository.getById(branchId);
    if (!branch) {
      throw new Error('Branch not found');
    }

    if (branch.status === 'suspended') {
      throw new Error('Branch is already suspended');
    }

    await this.branchRepository.update(branchId, { 
      status: 'suspended'
    });
  }

  async validateBranchPlace(branchId: string, placeId: string): Promise<boolean> {
    const branch = await this.branchRepository.getById(branchId);
    return branch ? branch.placeId === placeId : false;
  }

  async canBranchAcceptOrders(branchId: string): Promise<boolean> {
    const branch = await this.branchRepository.getById(branchId);
    if (!branch) return false;

    return branch.status === 'active' && 
           branch.settings.allowOnlineOrders && 
           await this.isBranchOpen(branchId);
  }

  async isBranchOpen(branchId: string): Promise<boolean> {
    const branch = await this.branchRepository.getById(branchId);
    if (!branch) return false;

    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof branch.businessHours;
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    const todayHours = branch.businessHours[dayOfWeek];
    if (!todayHours || !todayHours.isOpen) return false;

    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  }

  async queryBranches(query: BranchQuery): Promise<Branch[]> {
    // Build filters based on query
    const filters = [];

    if (query.placeId) {
      filters.push({ field: 'placeId', operator: '==', value: query.placeId });
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
      return this.branchRepository.getAll();
    }

    return this.branchRepository.queryBranches(filters as QueryFilter[]);
  }

  async getNearbyBranches(latitude: number, longitude: number, radiusKm: number): Promise<Branch[]> {
    if (radiusKm <= 0 || radiusKm > 100) {
      throw new Error('Radius must be between 0 and 100 kilometers');
    }

    return this.branchRepository.getNearbyBranches(latitude, longitude, radiusKm);
  }

  // Business validation methods
  validateBusinessHours(businessHours: Branch['businessHours']): boolean {
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

  validateAddress(address: Branch['address']): boolean {
    return !!(address.street && address.city && address.state && address.zipCode && address.country);
  }

  validateContact(contact: Branch['contact']): boolean {
    // At least one contact method should be provided
    return !!(contact.phone || contact.email || contact.website);
  }

  private validateCreateCommand(command: CreateBranchCommand): void {
    if (!command.name || command.name.trim().length === 0) {
      throw new Error('Branch name is required');
    }

    if (command.name.length > 100) {
      throw new Error('Branch name must be 100 characters or less');
    }

    if (!command.placeId || command.placeId.trim().length === 0) {
      throw new Error('Place ID is required');
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

  private validateUpdateCommand(command: UpdateBranchCommand): void {
    if (!command.id || command.id.trim().length === 0) {
      throw new Error('Branch ID is required');
    }

    if (command.name !== undefined) {
      if (command.name.trim().length === 0) {
        throw new Error('Branch name cannot be empty');
      }
      if (command.name.length > 100) {
        throw new Error('Branch name must be 100 characters or less');
      }
    }

    if (command.address !== undefined && !this.validateAddress(command.address as Branch['address'])) {
      throw new Error('Valid address is required');
    }

    if (command.contact !== undefined && !this.validateContact(command.contact)) {
      throw new Error('At least one contact method is required');
    }

    if (command.businessHours !== undefined && !this.validateBusinessHours(command.businessHours as Branch['businessHours'])) {
      throw new Error('Valid business hours are required');
    }
  }

  private validateStatusTransition(currentStatus: Branch['status'], newStatus: Branch['status']): void {
    const validTransitions: Record<Branch['status'], Branch['status'][]> = {
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

