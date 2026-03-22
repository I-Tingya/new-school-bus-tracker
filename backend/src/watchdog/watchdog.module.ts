import { Module } from '@nestjs/common';
import { WatchdogService } from './watchdog.service';
import { TenantModule } from '../tenant/tenant.module';
// NotificationModule is @Global, but good practice to explicitly depend if needed, though omitted for brev.

@Module({
  imports: [TenantModule],
  providers: [WatchdogService],
})
export class WatchdogModule {}
