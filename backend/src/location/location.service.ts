import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Location } from '../database/entities/tenant/location.entity';
import { Trip } from '../database/entities/tenant/trip.entity';
import { LocationUpdate } from 'shared-types';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class LocationService {
  constructor(
    @Inject('LOCATION_REPOSITORY')
    private readonly locationRepo: Repository<Location>,
    @Inject('TRIP_REPOSITORY')
    private readonly tripRepo: Repository<Trip>,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly notificationService: NotificationService,
  ) {}

  async processLocationUpdate(update: LocationUpdate): Promise<Location> {
    const trip = await this.tripRepo.findOneBy({ id: update.tripId, status: 'ACTIVE' });
    if (!trip) throw new BadRequestException('Invalid or inactive trip');

    const location = this.locationRepo.create({
      tripId: update.tripId,
      lat: update.latitude,
      lng: update.longitude,
      speed: 0,
      timestamp: new Date(update.timestamp),
    });

    await this.locationRepo.save(location);
    this.realtimeGateway.broadcastLocation(update);

    // Mock Proximity threshold check
    // If bus is within X bounds of a stop, trigger notification
    if (Math.random() > 0.95) {
      this.notificationService.notifyProximity('mock_stop_id', trip.busId);
    }

    return location;
  }
}
