import { Injectable, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Tenant } from '../database/entities/global/tenant.entity';
import { TenantConnectionService } from './tenant-connection.service';
import { Student } from '../database/entities/tenant/student.entity';
import { Bus } from '../database/entities/tenant/bus.entity';
import { Route } from '../database/entities/tenant/route.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectDataSource('global') private readonly globalDataSource: DataSource,
    private readonly connectionService: TenantConnectionService,
  ) {}

  private async getTenantStats(tenantId: string) {
    try {
      const ds = await this.connectionService.getTenantConnection(tenantId);
      const [students, buses, routes] = await Promise.all([
        ds.getRepository(Student).count(),
        ds.getRepository(Bus).count(),
        ds.getRepository(Route).count(),
      ]);
      return {
        students,
        buses,
        routes,
      };
    } catch (err) {
      console.error(`Failed to get stats for tenant ${tenantId}:`, err.message);
      return { students: 0, buses: 0, routes: 0 };
    }
  }

  async createTenant(name: string): Promise<Tenant> {
    const tenantRepo = this.globalDataSource.getRepository(Tenant);
    
    const existing = await tenantRepo.findOneBy({ name });
    if (existing) {
      throw new ConflictException(`Tenant with name ${name} already exists.`);
    }

    const tenant = new Tenant();
    tenant.name = name;
    tenant.dbName = `school_${Date.now()}`; // Temp slug
    await tenantRepo.save(tenant);
    
    const dbName = `school_${tenant.id.replace(/-/g, '_')}`;
    tenant.dbName = dbName;
    await tenantRepo.save(tenant);

    await this.globalDataSource.query(`CREATE DATABASE ${dbName}`);

    return tenant;
  }

  async findAll(): Promise<any[]> {
    const tenants = await this.globalDataSource.getRepository(Tenant).find();
    return Promise.all(tenants.map(async t => ({
      ...t,
      stats: await this.getTenantStats(t.id)
    })));
  }

  async findOne(id: string): Promise<any | null> {
    const t = await this.globalDataSource.getRepository(Tenant).findOneBy({ id });
    if (!t) return null;
    return {
      ...t,
      stats: await this.getTenantStats(t.id)
    };
  }

  async getGlobalStudentCount(): Promise<number> {
    const tenants = await this.findAll();
    return tenants.reduce((acc, t) => acc + (t.stats?.students || 0), 0);
  }
}
