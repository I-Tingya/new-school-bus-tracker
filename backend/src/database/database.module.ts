import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './entities/global/tenant.entity';
import { User } from './entities/global/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      name: 'global',
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://dev_user:dev_password@localhost:5432/school_bus_tracker',
      entities: [Tenant, User],
      synchronize: true, 
    }),
  ],
})
export class DatabaseModule {}
