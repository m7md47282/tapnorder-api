/**
 * Branch Entity - Domain Model
 * Represents a branch/location that belongs to a place
 * Each branch acts like a place with its own workers and items
 * Follows Clean Architecture principles
 */

export interface Branch {
  id: string;
  placeId: string; // Reference to the parent place
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBranchCommand {
  placeId: string; // Required - branch must belong to a place
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
}

export interface UpdateBranchCommand {
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

export interface BranchQuery {
  placeId?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'pending_approval';
  city?: string;
  state?: string;
  allowOnlineOrders?: boolean;
  searchTerm?: string;
}

