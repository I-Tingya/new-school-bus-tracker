import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { Student } from '../database/entities/tenant/student.entity';
import { Bus } from '../database/entities/tenant/bus.entity';
import { Route } from '../database/entities/tenant/route.entity';
import { Stop } from '../database/entities/tenant/stop.entity';
import { Trip } from '../database/entities/tenant/trip.entity';
import { Location } from '../database/entities/tenant/location.entity';
import { Alert } from '../database/entities/tenant/alert.entity';

@Injectable()
export class TenantConnectionService {
  private readonly logger = new Logger(TenantConnectionService.name);
  private dataSources: Map<string, DataSource> = new Map();

  async getTenantConnection(tenantId: string): Promise<DataSource> {
    if (this.dataSources.has(tenantId)) {
      return this.dataSources.get(tenantId)!;
    }

    const dbName = `school_${tenantId.replace(/-/g, '_')}`;
    this.logger.log(`Creating new DataSource for tenant: ${tenantId} (DB: ${dbName})`);

    // Parse the DATABASE_URL to get host/port/user/pass
    // Example: postgresql://dev_user:dev_password@postgres:5432/school_bus_tracker
    const dbUrl = process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5432/school_bus_tracker';
    const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = dbUrl.match(regex);
    
    let config: any = {
      type: 'postgres',
      database: dbName,
      entities: [Student, Bus, Route, Stop, Trip, Location, Alert],
      synchronize: true,
    };

    if (match) {
      config.username = match[1];
      config.password = match[2];
      config.host = match[3];
      config.port = parseInt(match[4]);
    } else {
      // Fallback to individual components if URL parsing fails or if it's a different format
      config.url = dbUrl; 
    }

    const dataSource = new DataSource(config);

    try {
      await dataSource.initialize();
      this.dataSources.set(tenantId, dataSource);
      return dataSource;
    } catch (err) {
      this.logger.error(`Failed to initialize DataSource for tenant ${tenantId}: ${err.message}`);
      throw err;
    }
  }
}
