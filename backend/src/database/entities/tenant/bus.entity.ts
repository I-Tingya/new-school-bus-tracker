import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('buses')
export class Bus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  number: string;

  @Column({ default: 0 })
  capacity: number;

  @Column({ name: 'driver_id', nullable: true })
  driverId: string;
}
