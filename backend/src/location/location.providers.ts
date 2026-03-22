import { Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { Location } from '../database/entities/tenant/location.entity';
import { Trip } from '../database/entities/tenant/trip.entity';

export const locationProviders = [
  {
    provide: 'LOCATION_REPOSITORY',
    scope: Scope.REQUEST,
    inject: [REQUEST, TenantConnectionService],
    useFactory: async (req: any, connectionService: TenantConnectionService) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) throw new Error('No tenantId');
      const dataSource = await connectionService.getTenantConnection(tenantId);
      return dataSource.getRepository(Location);
    },
  },
  {
    provide: 'TRIP_REPOSITORY',
    scope: Scope.REQUEST,
    inject: [REQUEST, TenantConnectionService],
    useFactory: async (req: any, connectionService: TenantConnectionService) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) throw new Error('No tenantId');
      const dataSource = await connectionService.getTenantConnection(tenantId);
      return dataSource.getRepository(Trip);
    },
  },
];
