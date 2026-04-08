import { Controller, Post, Body, Get, Param, NotFoundException, Query } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { GeocodingService, GeocodeResult } from '../core/geocoding.service';
import { Tenant, CreateTenantRequest } from 'shared-types';

@Controller('tenant')
export class TenantController {
  constructor(
    private readonly tenantService: TenantService,
    private readonly geocodingService: GeocodingService,
  ) {}

  @Post()
  async createTenant(@Body() data: CreateTenantRequest): Promise<Tenant> {
    const result = await this.tenantService.createTenant(data.name);
    return {
      ...result,
      createdAt: result.createdAt.toISOString(),
    };
  }

  @Get()
  async getTenants(): Promise<Tenant[]> {
    const tenants = await this.tenantService.findAll();
    return tenants.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  // ── Geocoding (Global endpoints, no tenant context needed) ─────────────────────────────────
  @Get('geocode/suggest')
  getAddressSuggestions(@Query('input') input: string) {
    return this.geocodingService.getAddressSuggestions(input);
  }

  @Post('geocode/address')
  geocodeAddress(@Body() body: { address: string }) {
    return this.geocodingService.geocodeAddress(body.address);
  }

  @Post('geocode/place')
  getCoordinatesFromPlace(@Body() body: { placeId: string }) {
    return this.geocodingService.getCoordinatesFromPlaceId(body.placeId);
  }

  @Get('stats/students')
  async getStats() {
    const count = await this.tenantService.getGlobalStudentCount();
    return { totalStudents: count };
  }

  @Get(':id')
  async getTenant(@Param('id') id: string): Promise<Tenant> {
    const t = await this.tenantService.findOne(id);
    if (!t) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return {
      ...t,
      createdAt: t.createdAt.toISOString(),
    };
  }
}
