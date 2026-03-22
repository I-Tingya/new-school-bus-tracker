import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('trips')
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_id' })
  routeId: string;

  @Column({ name: 'bus_id' })
  busId: string;

  @Column({ name: 'driver_id' })
  driverId: string;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status: 'ACTIVE' | 'ENDED';

  @CreateDateColumn({ name: 'started_at' })
  startedAt: Date;

  @Column({ name: 'ended_at', nullable: true })
  endedAt: Date;
}
