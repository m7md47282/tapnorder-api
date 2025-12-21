import { Routes } from '@angular/router';
import { AuthGuard, RoleGuard, GuestGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public Routes
  { 
    path: '', 
    loadComponent: () => import('./pages/index/index.component').then(m => m.IndexComponent) 
  },
  
  // Demo Routes
  { 
    path: 'demo', 
    loadComponent: () => import('./pages/demo/demo.component').then(m => m.DemoComponent) 
  },
  { 
    path: 'demo/menu/:tableId', 
    loadComponent: () => import('./pages/demo/customer-menu/customer-menu.component').then(m => m.CustomerMenuComponent) 
  },
  { 
    path: 'demo/cart', 
            loadComponent: () => import('./pages/demo/cart/cart.component').then(m => m.DemoCartComponent) 
  },
  { 
    path: 'demo/order-tracking/:orderId', 
    loadComponent: () => import('./pages/demo/order-tracking/order-tracking.component').then(m => m.DemoOrderTrackingComponent) 
  },
  
  // Production Routes
  { 
    path: 'menu', 
    loadComponent: () => import('./pages/menu/menu.component').then(m => m.MenuComponent) 
  },
  { 
    path: 'cart', 
    loadComponent: () => import('./pages/cart/cart.component').then(m => m.CartComponent) 
  },
  { 
    path: 'order-tracking/:orderId', 
    loadComponent: () => import('./pages/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent) 
  },
  { 
    path: 'order-status', 
    loadComponent: () => import('./pages/order-status/order-status.component').then(m => m.OrderStatusComponent) 
  },
  
  // Authentication Routes
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard]
  },
  { 
    path: 'setup-admin', 
    loadComponent: () => import('./pages/setup-admin/setup-admin.component').then(m => m.SetupAdminComponent),
    canActivate: [GuestGuard]
  },
  
  // Staff Routes (Protected)
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  { 
    path: 'cashier', 
    loadComponent: () => import('./pages/cashier-dashboard/cashier-dashboard.component').then(m => m.CashierDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['cashier', 'admin'] }
  },
  { 
    path: 'kitchen', 
    loadComponent: () => import('./pages/kitchen-dashboard/kitchen-dashboard.component').then(m => m.KitchenDashboardComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['kitchen', 'admin'] }
  },
  
  // Unauthorized route
  { 
    path: 'unauthorized', 
    loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) 
  },
  
  // Catch-all route
  { 
    path: '**', 
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) 
  }
];
