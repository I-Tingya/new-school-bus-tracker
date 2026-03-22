import { Controller, Post, Get, Body, Param, UseGuards, Req, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripService } from './trip.service';
import { StartTripRequest } from 'shared-types';

// @UseGuards(JwtAuthGuard)
@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Get('active/:busId')
  getActiveTrip(@Param('busId') busId: string) {
    return this.tripService.getActiveTripForBus(busId);
  }

  @Get('active/route/:routeId')
  getActiveTripForRoute(@Param('routeId') routeId: string) {
    return this.tripService.getActiveTripForRoute(routeId);
  }

  @Post('start')
  startTrip(@Body() data: StartTripRequest, @Headers('x-driver-id') driverId: string) {
    return this.tripService.startTrip(data, driverId || '00000000-0000-0000-0000-000000000000');
  }

  @Post(':id/end')
  endTrip(@Param('id') id: string, @Headers('x-driver-id') driverId: string) {
    return this.tripService.endTrip(id, driverId || '00000000-0000-0000-0000-000000000000');
  }

  @Post(':id/sos')
  triggerSOS(@Param('id') id: string, @Body() body: { lat: number, lng: number }, @Headers('x-driver-id') driverId: string) {
    return this.tripService.sos(id, driverId || '00000000-0000-0000-0000-000000000000', body.lat, body.lng);
  }
}
