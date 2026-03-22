import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'db_name', unique: true })
  dbName: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
