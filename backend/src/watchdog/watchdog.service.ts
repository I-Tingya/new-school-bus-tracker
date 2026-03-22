import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Trip } from '../database/entities/tenant/trip.entity';
import { Location } from '../database/entities/tenant/location.entity';
import { NotificationService } from '../notification/notification.service';
import { TenantService } from '../tenant/tenant.service';
import { TenantConnectionService } from '../tenant/tenant-connection.service';

@Injectable()
export class WatchdogService {
  private readonly logger = new Logger(WatchdogService.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly tenantService: TenantService,
    private readonly connectionService: TenantConnectionService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async checkOfflineDrivers() {
    this.logger.log('Watchdog running: Checking for offline drivers...');
    
    // In a multi-tenant system, we must iterate active tenants
    const tenants = await this.tenantService.findAll();
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);

    for (const tenant of tenants) {
      try {
        const dataSource = await this.connectionService.getTenantConnection(tenant.id);
        const tripRepo = dataSource.getRepository(Trip);
        const locationRepo = dataSource.getRepository(Location);

        const activeTrips = await tripRepo.find({ where: { status: 'ACTIVE' } });
        
        for (const trip of activeTrips) {
          // Find latest location for this trip
          const latestLoc = await locationRepo.findOne({
            where: { tripId: trip.id },
            order: { timestamp: 'DESC' }
          });

          if (!latestLoc) continue;

          if (latestLoc.timestamp < threeMinutesAgo) {
            this.logger.warn(`Watchdog Alert: Driver ${trip.driverId} (Trip ${trip.id}) went offline!`);
            await this.notificationService.sendPushNotification(
              'admin-topic', 
              'Driver Offline Alert', 
              `Driver for Bus ${trip.busId} has stopped sending GPS data.`
            );
          }
        }
      } catch (err) {
        this.logger.error(`Watchdog failed for tenant ${tenant.id}`, err);
      }
    }
  }
}
