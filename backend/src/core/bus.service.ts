import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Bus } from '../database/entities/tenant/bus.entity';

@Injectable()
export class BusService {
  constructor(
    @Inject('BUS_REPOSITORY')
    private readonly busRepo: Repository<Bus>,
  ) {}

  async findAll() {
    return this.busRepo.find();
  }

  async create(data: Partial<Bus>) {
    const bus = this.busRepo.create(data);
    return this.busRepo.save(bus);
  }

  async update(id: string, data: Partial<Bus>) {
    await this.busRepo.update(id, data);
    return this.busRepo.findOneBy({ id });
  }

  async delete(id: string) {
    return this.busRepo.delete(id);
  }
}
