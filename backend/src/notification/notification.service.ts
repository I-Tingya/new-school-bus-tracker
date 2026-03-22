import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor() {
    this.logger.log('NotificationService initialized (Mock FCM Mode)');
  }

  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    this.logger.log(`[PUSH] ${title} - ${body} (To: ${token})`);
  }

  async notifyTripStarted(tripId: string, routeName: string) {
    this.logger.log(`Notifying parents for Trip ${tripId}: Route ${routeName} has started.`);
    await this.sendPushNotification(
      'mock-parent-device-token',
      'School Bus Update',
      `The bus for ${routeName} has started its trip.`
    );
  }

  async notifyProximity(stopId: string, busNumber: string) {
    this.logger.log(`Proximity Alert! Bus ${busNumber} is nearing Stop ${stopId}`);
    await this.sendPushNotification(
      'mock-parent-device-token',
      'Bus Arriving Soon',
      `Bus ${busNumber} is approaching your stop.`
    );
  }

  async notifyAdminSOS(tripId: string, driverId: string, lat: number, lng: number) {
    this.logger.error(`🚨 SOS ALERT! Trip ${tripId} by Driver ${driverId} at (${lat}, ${lng}) !🚨 `);
    await this.sendPushNotification(
      'mock-admin-device-token',
      '🚨 SOS EMERGENCY 🚨',
      `Driver ${driverId} hit SOS. Location: ${lat}, ${lng}`
    );
  }
}
