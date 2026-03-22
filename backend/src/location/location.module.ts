import { Module } from '@nestjs/common';
import { locationProviders } from './location.providers';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { TenantModule } from '../tenant/tenant.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [TenantModule, RealtimeModule],
  providers: [...locationProviders, LocationService],
  controllers: [LocationController],
  exports: [LocationService],
})
export class LocationModule {}
