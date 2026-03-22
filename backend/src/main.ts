import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { LocationUpdate } from 'shared-types';

import { utilities as nestWinstonUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { RealtimeModule } from './realtime/realtime.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WatchdogModule } from './watchdog/watchdog.module';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { CoreModule } from './core/core.module';
import { TripModule } from './trip/trip.module';
import { LocationModule } from './location/location.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    RealtimeModule,
    WatchdogModule,
    AuthModule,
    TenantModule,
    CoreModule,
    TripModule,
    LocationModule,
    NotificationModule,
  ],
})
export class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonUtilities.format.nestLike('SchoolBusTracker', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'system.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          )
        })
      ],
    }),
  });
  
  app.enableCors();
  
  // Dummy usage to ensure shared-types is correctly imported
  const testUpdate: LocationUpdate = {
    driverId: '1',
    tripId: '1',
    latitude: 0,
    longitude: 0,
    timestamp: new Date().toISOString()
  };
  
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
