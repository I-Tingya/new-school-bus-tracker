import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Student } from '../database/entities/tenant/student.entity';
import { Route } from '../database/entities/tenant/route.entity';

@Injectable()
export class StudentService {
  constructor(
    @Inject('STUDENT_REPOSITORY')
    private readonly studentRepo: Repository<Student>,
    @Inject('ROUTE_REPOSITORY')
    private readonly routeRepo: Repository<Route>,
  ) {}

  async findAll() {
    return this.studentRepo.find();
  }

  async create(data: Partial<Student>) {
    const student = this.studentRepo.create(data);
    return this.studentRepo.save(student);
  }

  async update(id: string, data: Partial<Student>) {
    await this.studentRepo.update(id, data);
    return this.studentRepo.findOneBy({ id });
  }

  async delete(id: string) {
    // Clean up routes that use this student as a stop
    const routes = await this.routeRepo.find();
    for (const route of routes) {
      if (route.stops && route.stops.includes(id)) {
        route.stops = route.stops.filter(sid => sid !== id);
        await this.routeRepo.save(route);
      }
    }
    return this.studentRepo.delete(id);
  }
}
