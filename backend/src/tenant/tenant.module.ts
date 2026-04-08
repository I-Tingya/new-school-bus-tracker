import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../database/entities/global/tenant.entity';
import { TenantService } from './tenant.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantController } from './tenant.controller';
import { GeocodingService } from '../core/geocoding.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant], 'global')],
  providers: [TenantService, TenantConnectionService, GeocodingService],
  controllers: [TenantController],
  exports: [TenantService, TenantConnectionService, GeocodingService],
})
export class TenantModule {}
