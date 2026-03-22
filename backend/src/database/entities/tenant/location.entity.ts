import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'trip_id' })
  tripId: string;

  @Column('float')
  lat: number;

  @Column('float')
  lng: number;

  @Column('float', { nullable: true })
  speed: number;

  @CreateDateColumn()
  timestamp: Date;
}
