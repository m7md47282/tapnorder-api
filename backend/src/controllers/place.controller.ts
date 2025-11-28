import { Request, Response } from 'express';
import { PlaceService } from '../services/place.service';
import { IPlaceService } from '../services/interfaces/place.service.interface';
import { PlaceRepository } from '../repositories/place/place.repository';
import { CreatePlaceCommand, UpdatePlaceCommand, PlaceQuery } from '../entities/place.entity';

/**
 * Place Controller - Presentation Layer (Firebase Functions)
 * NO business logic - delegates to service layer
 * Handles HTTP requests and responses
 * Follows Clean Architecture principles
 */
export class PlaceController {
  private readonly placeService: IPlaceService;

  constructor(placeService?: IPlaceService) {
    this.placeService = placeService ?? new PlaceService(new PlaceRepository());
  }

  /**
   * Create a new place
   * POST /places
   */
  async createPlace(req: Request, res: Response): Promise<void> {
    try {
      const command: CreatePlaceCommand = req.body;
      
      // Extract ownerId from authenticated user (in real implementation)
      // For now, we'll expect it in the request body
      if (!command.ownerId) {
        res.status(400).json({
          success: false,
          message: 'Owner ID is required',
          errors: ['Owner ID must be provided']
        });
        return;
      }

      const place = await this.placeService.createPlace(command);
      
      res.status(201).json({
        success: true,
        data: place,
        message: 'Place created successfully'
      });
    } catch (error) {
      console.error('Error creating place:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create place',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Update an existing place
   * PUT /place?id={id}
   */
  async updatePlace(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.query.id as string;
      const updateData = req.body;
      
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided as query parameter']
        });
        return;
      }
      
      const command: UpdatePlaceCommand = {
        id: placeId,
        ...updateData
      };

      const place = await this.placeService.updatePlace(command);
      
      res.status(200).json({
        success: true,
        data: place,
        message: 'Place updated successfully'
      });
    } catch (error) {
      console.error('Error updating place:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to update place',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Delete a place
   * DELETE /place?id={id}
   */
  async deletePlace(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.query.id as string;
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided as query parameter']
        });
        return;
      }
      await this.placeService.deletePlace(placeId);
      
      res.status(200).json({
        success: true,
        message: 'Place deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting place:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to delete place',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get a place by ID
   * GET /place?id={id}
   */
  async getPlaceById(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.query.id as string;
      
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided as query parameter']
        });
        return;
      }
      const place = await this.placeService.getPlaceById(placeId);
      
      if (!place) {
        res.status(404).json({
          success: false,
          message: 'Place not found'
        });
        return;
      }
      
      res.status(200).json({
        success: true,
        data: place
      });
    } catch (error) {
      console.error('Error getting place:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get place',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get places by owner
   * GET /places/owner/:ownerId
   */
  async getPlacesByOwner(req: Request, res: Response): Promise<void> {
    try {
      const ownerId = req.params[0];
      if(!ownerId) {
        res.status(400).json({
          success: false,
          message: 'Owner ID is required',
          errors: ['Owner ID must be provided']
        });
        return;
      }
      const places = await this.placeService.getPlacesByOwner(ownerId);
      
      res.status(200).json({
        success: true,
        data: places,
        count: places.length
      });
    } catch (error) {
      console.error('Error getting places by owner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get places by owner',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get active places
   * GET /places/active
   */
  async getActivePlaces(req: Request, res: Response): Promise<void> {
    try {
      const places = await this.placeService.getActivePlaces();
      
      res.status(200).json({
        success: true,
        data: places,
        count: places.length
      });
    } catch (error) {
      console.error('Error getting active places:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get active places',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Search places
   * GET /places/search?q=searchTerm
   */
  async searchPlaces(req: Request, res: Response): Promise<void> {
    try {
      const searchTerm = req.query.q as string;
      
      if (!searchTerm) {
        res.status(400).json({
          success: false,
          message: 'Search term is required',
          errors: ['Query parameter "q" is required']
        });
        return;
      }
      
      const places = await this.placeService.searchPlaces(searchTerm);
      
      res.status(200).json({
        success: true,
        data: places,
        count: places.length
      });
    } catch (error) {
      console.error('Error searching places:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to search places',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get places by location
   * GET /places/location?city=cityName&state=stateName
   */
  async getPlacesByLocation(req: Request, res: Response): Promise<void> {
    try {
      const city = req.query.city as string;
      const state = req.query.state as string;
      
      if (!city) {
        res.status(400).json({
          success: false,
          message: 'City is required',
          errors: ['Query parameter "city" is required']
        });
        return;
      }
      
      const places = await this.placeService.getPlacesByLocation(city, state);
      
      res.status(200).json({
        success: true,
        data: places,
        count: places.length
      });
    } catch (error) {
      console.error('Error getting places by location:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get places by location',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get places with online orders
   * GET /places/online-orders
   */
  async getPlacesWithOnlineOrders(req: Request, res: Response): Promise<void> {
    try {
      const places = await this.placeService.getPlacesWithOnlineOrders();
      
      res.status(200).json({
        success: true,
        data: places,
        count: places.length
      });
    } catch (error) {
      console.error('Error getting places with online orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get places with online orders',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Query places with filters
   * GET /places/query
   */
  async queryPlaces(req: Request, res: Response): Promise<void> {
    try {
      const query: PlaceQuery = req.query;
      if(!query) {
        res.status(400).json({
          success: false,
          message: 'Query is required',
          errors: ['Query must be provided']
        });
        return;
      }
      const places = await this.placeService.queryPlaces(query);
      
      res.status(200).json({
        success: true,
        data: places,
        count: places.length
      });
    } catch (error) {
      console.error('Error querying places:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to query places',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Get nearby places
   * GET /places/nearby?lat=latitude&lng=longitude&radius=radiusKm
   */
  async getNearbyPlaces(req: Request, res: Response): Promise<void> {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lng = parseFloat(req.query.lng as string);
      const radius = parseFloat(req.query.radius as string) || 10; // Default 10km
      
      if (isNaN(lat) || isNaN(lng)) {
        res.status(400).json({
          success: false,
          message: 'Valid latitude and longitude are required',
          errors: ['Query parameters "lat" and "lng" must be valid numbers']
        });
        return;
      }
      
      const places = await this.placeService.getNearbyPlaces(lat, lng, radius);
      
      res.status(200).json({
        success: true,
        data: places,
        count: places.length
      });
    } catch (error) {
      console.error('Error getting nearby places:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get nearby places',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Activate a place
   * POST /places/:id/activate
   */
  async activatePlace(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.params[0];
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }
      await this.placeService.activatePlace(placeId);
      
      res.status(200).json({
        success: true,
        message: 'Place activated successfully'
      });
    } catch (error) {
      console.error('Error activating place:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to activate place',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Deactivate a place
   * POST /places/:id/deactivate
   */
  async deactivatePlace(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.params[0];
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }
      await this.placeService.deactivatePlace(placeId);
      
      res.status(200).json({
        success: true,
        message: 'Place deactivated successfully'
      });
    } catch (error) {
      console.error('Error deactivating place:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to deactivate place',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Suspend a place
   * POST /places/:id/suspend
   */
  async suspendPlace(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.params[0];
      const { reason } = req.body;
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }

      await this.placeService.suspendPlace(placeId, reason);
      
      res.status(200).json({
        success: true,
        message: 'Place suspended successfully'
      });
    } catch (error) {
      console.error('Error suspending place:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to suspend place',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Check if place can accept orders
   * GET /places/:id/can-accept-orders
   */
  async canAcceptOrders(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.params[0];
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }
      const canAccept = await this.placeService.canPlaceAcceptOrders(placeId);
      
      res.status(200).json({
        success: true,
        data: { canAcceptOrders: canAccept }
      });
    } catch (error) {
      console.error('Error checking if place can accept orders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check if place can accept orders',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }

  /**
   * Check if place is open
   * GET /places/:id/is-open
   */
  async isPlaceOpen(req: Request, res: Response): Promise<void> {
    try {
      const placeId = req.params[0];
      if(!placeId) {
        res.status(400).json({
          success: false,
          message: 'Place ID is required',
          errors: ['Place ID must be provided']
        });
        return;
      }
      const isOpen = await this.placeService.isPlaceOpen(placeId);
      
      res.status(200).json({
        success: true,
        data: { isOpen }
      });
    } catch (error) {
      console.error('Error checking if place is open:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check if place is open',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      });
    }
  }
}
