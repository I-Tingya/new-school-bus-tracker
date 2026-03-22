import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  grade: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @Column({ name: 'stop_id', nullable: true })
  stopId: string;
}
