import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stop } from '../database/entities/tenant/stop.entity';

@Injectable()
export class StopService {
  constructor(
    @Inject('STOP_REPOSITORY')
    private readonly stopRepo: Repository<Stop>,
  ) {}

  async findByRouteId(routeId: string) {
    return this.stopRepo.find({
      where: { routeId },
      order: { sequence: 'ASC' },
    });
  }

  async findByIds(ids: string[]) {
    if (ids.length === 0) return [];
    return this.stopRepo.findByIds(ids);
  }

  async create(data: Partial<Stop>) {
    const stop = this.stopRepo.create(data);
    return this.stopRepo.save(stop);
  }

  async update(id: string, data: Partial<Stop>) {
    await this.stopRepo.update(id, data);
    return this.stopRepo.findOneBy({ id });
  }

  async delete(id: string) {
    return this.stopRepo.delete(id);
  }
}
