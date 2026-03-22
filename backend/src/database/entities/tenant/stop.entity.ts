import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('stops')
export class Stop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'route_id' })
  routeId: string;

  @Column('float')
  lat: number;

  @Column('float')
  lng: number;

  @Column()
  sequence: number;
}
