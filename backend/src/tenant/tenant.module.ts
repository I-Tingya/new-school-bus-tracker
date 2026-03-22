import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../database/entities/global/tenant.entity';
import { TenantService } from './tenant.service';
import { TenantConnectionService } from './tenant-connection.service';
import { TenantController } from './tenant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant], 'global')],
  providers: [TenantService, TenantConnectionService],
  controllers: [TenantController],
  exports: [TenantService, TenantConnectionService],
})
export class TenantModule {}
