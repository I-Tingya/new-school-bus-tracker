import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Alert } from '../database/entities/tenant/alert.entity';

@Injectable()
export class AlertService {
  constructor(
    @Inject('ALERT_REPOSITORY')
    private readonly alertRepo: Repository<Alert>,
  ) {}

  async create(message: string): Promise<Alert> {
    const alert = this.alertRepo.create({ message, resolved: false });
    return this.alertRepo.save(alert);
  }

  async findAll(resolvedOnly?: boolean): Promise<Alert[]> {
    const where = resolvedOnly !== undefined ? { resolved: resolvedOnly } : {};
    return this.alertRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async resolve(id: string): Promise<Alert | null> {
    await this.alertRepo.update(id, { resolved: true });
    return this.alertRepo.findOneBy({ id });
  }
}
