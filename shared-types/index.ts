export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  DRIVER = 'DRIVER',
  PARENT = 'PARENT'
}

export interface LocationUpdate {
  driverId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface StartTripRequest {
  driverId: string;
  busId: string;
  routeId: string;
}

export interface Tenant {
  id: string;
  name: string;
  dbName: string;
  createdAt: string;
  stats?: {
    students: number;
    buses: number;
    routes: number;
  };
}

export interface CreateTenantRequest {
  name: string;
}

export interface Student {
  id: string;
  name: string;
  address: string;
  grade?: string;
}

export interface Bus {
  id: string;
  number: string;
  capacity: number;
}

export interface Route {
  id: string;
  name: string;
  stops: string[]; // JSON string or array of stop names for now
}
