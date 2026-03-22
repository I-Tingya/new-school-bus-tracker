import { Module } from '@nestjs/common';
import { coreProviders } from './core.providers';
import { StudentService } from './student.service';
import { BusService } from './bus.service';
import { RouteService } from './route.service';
import { AlertService } from './alert.service';
import { CoreController } from './core.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  providers: [
    ...coreProviders,
    StudentService,
    BusService,
    RouteService,
    AlertService,
  ],
  controllers: [CoreController],
  exports: [StudentService, BusService, RouteService, AlertService],
})
export class CoreModule {}
