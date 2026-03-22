import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Route } from '../database/entities/tenant/route.entity';

@Injectable()
export class RouteService {
  constructor(
    @Inject('ROUTE_REPOSITORY')
    private readonly routeRepo: Repository<Route>,
  ) {}

  async findAll() {
    return this.routeRepo.find();
  }

  async create(data: Partial<Route>) {
    const route = this.routeRepo.create(data);
    return this.routeRepo.save(route);
  }

  async update(id: string, data: Partial<Route>) {
    await this.routeRepo.update(id, data);
    return this.routeRepo.findOneBy({ id });
  }

  async delete(id: string) {
    return this.routeRepo.delete(id);
  }
}
