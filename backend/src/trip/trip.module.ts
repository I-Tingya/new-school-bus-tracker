import { Module } from '@nestjs/common';
import { tripProviders } from './trip.providers';
import { TripService } from './trip.service';
import { TripController } from './trip.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  providers: [...tripProviders, TripService],
  controllers: [TripController],
  exports: [TripService],
})
export class TripModule {}
