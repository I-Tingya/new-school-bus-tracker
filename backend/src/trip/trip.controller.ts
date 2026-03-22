import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TripService } from './trip.service';
import { StartTripRequest } from 'shared-types';

@UseGuards(JwtAuthGuard)
@Controller('trip')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post('start')
  startTrip(@Body() data: StartTripRequest, @Req() req: any) {
    return this.tripService.startTrip(data, req.user.id);
  }

  @Post(':id/end')
  endTrip(@Param('id') id: string, @Req() req: any) {
    return this.tripService.endTrip(id, req.user.id);
  }

  @Post(':id/sos')
  triggerSOS(@Param('id') id: string, @Body() body: { lat: number, lng: number }, @Req() req: any) {
    return this.tripService.sos(id, req.user.id, body.lat, body.lng);
  }
}
