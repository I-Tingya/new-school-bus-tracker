import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Trip } from '../database/entities/tenant/trip.entity';
import { Bus } from '../database/entities/tenant/bus.entity';
import { StartTripRequest } from 'shared-types';
import { NotificationService } from '../notification/notification.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class TripService {
  constructor(
    @Inject('TRIP_REPOSITORY')
    private readonly tripRepo: Repository<Trip>,
    @Inject('BUS_REPOSITORY')
    private readonly busRepo: Repository<Bus>,
    private readonly notificationService: NotificationService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async getActiveTripForBus(busId: string) {
    const activeTrip = await this.tripRepo.findOneBy({ busId, status: 'ACTIVE' });
    return activeTrip || null;
  }

  async getActiveTripForRoute(routeId: string) {
    const activeTrip = await this.tripRepo.findOneBy({ routeId, status: 'ACTIVE' });
    return activeTrip || null;
  }

  async startTrip(data: StartTripRequest, driverId: string) {
    const bus = await this.busRepo.findOneBy({ id: data.busId });
    if (!bus) throw new NotFoundException('Bus not found');

    const activeTrip = await this.tripRepo.findOneBy({ busId: data.busId, status: 'ACTIVE' });
    if (activeTrip) throw new BadRequestException('Bus already has an active trip');

    const trip = this.tripRepo.create({
      routeId: data.routeId,
      busId: data.busId,
      driverId,
      status: 'ACTIVE',
      startedAt: new Date(),
    });

    const savedTrip = await this.tripRepo.save(trip);
    
    // Trigger notification
    this.notificationService.notifyTripStarted(savedTrip.id, data.routeId);
    if (this.realtimeGateway.server) {
      this.realtimeGateway.server.emit('tripStarted', { tripId: savedTrip.id, routeId: data.routeId, busId: data.busId });
    }

    return savedTrip;
  }

  async endTrip(tripId: string, driverId: string) {
    const trip = await this.tripRepo.findOneBy({ id: tripId, driverId });
    if (!trip) throw new NotFoundException('Trip not found or not owned by driver');

    trip.status = 'ENDED';
    trip.endedAt = new Date();
    const result = await this.tripRepo.save(trip);

    if (this.realtimeGateway.server) {
      this.realtimeGateway.server.emit('tripEnded', { tripId: result.id, routeId: result.routeId });
    }

    return result;
  }

  async sos(tripId: string, driverId: string, lat: number, lng: number) {
    const trip = await this.tripRepo.findOneBy({ id: tripId, driverId });
    if (!trip) throw new NotFoundException('Trip not found or not active');

    // Trigger Admin SOS push notification
    this.notificationService.notifyAdminSOS(tripId, driverId, lat, lng);
    return { success: true, message: 'SOS Alert triggered successfully' };
  }
}
