import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { Tenant, CreateTenantRequest } from 'shared-types';

@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

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

  @Get('stats/students')
  async getStats() {
    const count = await this.tenantService.getGlobalStudentCount();
    return { totalStudents: count };
  }
}
