/**
 * Place Entity - Domain Model
 * Represents a restaurant or food establishment
 * Follows Clean Architecture principles
 */

export interface Place {
  id: string;
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  businessHours: {
    [key: string]: {
      open: string; // HH:MM format
      close: string; // HH:MM format
      isOpen: boolean;
    };
  };
  settings: {
    currency: string;
    timezone: string;
    language: string;
    allowOnlineOrders: boolean;
    requireOrderConfirmation: boolean;
    minimumOrderAmount?: number;
    deliveryFee?: number;
    serviceFee?: number;
    taxRate?: number;
  };
  status: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  ownerId: string; // Reference to the user who owns this place
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlaceCommand {
  name: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  businessHours: {
    [key: string]: {
      open: string;
      close: string;
      isOpen: boolean;
    };
  };
  settings: {
    currency: string;
    timezone: string;
    language: string;
    allowOnlineOrders?: boolean;
    requireOrderConfirmation?: boolean;
    minimumOrderAmount?: number;
    deliveryFee?: number;
    serviceFee?: number;
    taxRate?: number;
  };
  ownerId: string;
}

export interface UpdatePlaceCommand {
  id: string;
  name?: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  businessHours?: {
    [key: string]: {
      open?: string;
      close?: string;
      isOpen?: boolean;
    };
  };
  settings?: {
    currency?: string;
    timezone?: string;
    language?: string;
    allowOnlineOrders?: boolean;
    requireOrderConfirmation?: boolean;
    minimumOrderAmount?: number;
    deliveryFee?: number;
    serviceFee?: number;
    taxRate?: number;
  };
  status?: 'active' | 'inactive' | 'suspended' | 'pending_approval';
}

export interface PlaceQuery {
  ownerId?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  city?: string;
  state?: string;
  allowOnlineOrders?: boolean;
  searchTerm?: string;
}
