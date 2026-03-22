import { Controller, Post, Body, UseGuards, Req, Headers } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LocationService } from './location.service';
import { LocationUpdate } from 'shared-types';

// @UseGuards(JwtAuthGuard)
@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post('update')
  updateLocation(@Body() data: LocationUpdate) {
    return this.locationService.processLocationUpdate(data);
  }
}
