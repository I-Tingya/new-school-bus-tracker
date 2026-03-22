import { Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { Student } from '../database/entities/tenant/student.entity';
import { Bus } from '../database/entities/tenant/bus.entity';
import { Route } from '../database/entities/tenant/route.entity';
import { Alert } from '../database/entities/tenant/alert.entity';

export const coreProviders = [
  {
    provide: 'STUDENT_REPOSITORY',
    scope: Scope.REQUEST,
    inject: [REQUEST, TenantConnectionService],
    useFactory: async (req: any, connectionService: TenantConnectionService) => {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
      if (!tenantId) throw new Error('No tenantId found in request (JwtAuthGuard bypassed)');
      const dataSource = await connectionService.getTenantConnection(tenantId);
      return dataSource.getRepository(Student);
    },
  },
  {
    provide: 'BUS_REPOSITORY',
    scope: Scope.REQUEST,
    inject: [REQUEST, TenantConnectionService],
    useFactory: async (req: any, connectionService: TenantConnectionService) => {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
      if (!tenantId) throw new Error('No tenantId found in request');
      const dataSource = await connectionService.getTenantConnection(tenantId);
      return dataSource.getRepository(Bus);
    },
  },
  {
    provide: 'ROUTE_REPOSITORY',
    scope: Scope.REQUEST,
    inject: [REQUEST, TenantConnectionService],
    useFactory: async (req: any, connectionService: TenantConnectionService) => {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
      if (!tenantId) throw new Error('No tenantId found in request');
      const dataSource = await connectionService.getTenantConnection(tenantId);
      return dataSource.getRepository(Route);
    },
  },
  {
    provide: 'ALERT_REPOSITORY',
    scope: Scope.REQUEST,
    inject: [REQUEST, TenantConnectionService],
    useFactory: async (req: any, connectionService: TenantConnectionService) => {
      const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];
      if (!tenantId) throw new Error('No tenantId found in request');
      const dataSource = await connectionService.getTenantConnection(tenantId);
      return dataSource.getRepository(Alert);
    },
  },
];
