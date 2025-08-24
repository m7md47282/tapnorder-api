import { Router } from 'express';
import { MenuController } from '../controllers/menu.controller';
import { MenuService } from '../services/menu.service';
import { MenuRepository } from '../repositories/menu/menu.repository';
import { FirebaseClient } from '../database/clients/firebase-client';

interface Config {
  firebase: {
    projectId?: string;
    privateKey?: string;
    clientEmail?: string;
  };
}

export async function createMenuRouter(config: Config): Promise<Router> {
  const router = Router();

  // Initialize Firebase client and repositories
  const firebaseClient = new FirebaseClient({
    type: 'firebase',
    credentials: {
      project_id: config.firebase.projectId,
      private_key: config.firebase.privateKey,
      client_email: config.firebase.clientEmail
    }
  });

  // Initialize repository and service
  const menuRepository = new MenuRepository(firebaseClient);
  const menuService = new MenuService(menuRepository);
  const menuController = new MenuController(menuService);

  // Define routes
  // GET /api/menus/:placeId - Get menu by place ID
  router.get('/:placeId', menuController.getMenuByPlaceId);

  // POST /api/menus/:placeId - Create new menu for a place
  router.post('/:placeId', menuController.createMenu);

  // PUT /api/menus/:placeId - Update menu for a place
  router.put('/:placeId', menuController.updateMenu);

  // PUT /api/menus/:placeId/items/:itemId - Update specific menu item
  router.put('/:placeId/items/:itemId', menuController.updateMenuItem);

  return router;
}
