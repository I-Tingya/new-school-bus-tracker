import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('routes')
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  stops: string[];
}
