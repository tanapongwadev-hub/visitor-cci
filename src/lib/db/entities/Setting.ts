import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

/** key-value store สำหรับค่าตั้งค่าต่างๆ (value เป็น JSON) */
@Entity({ name: "settings" })
export class Setting {
  @PrimaryColumn({ type: "varchar", length: 100 })
  key: string;

  @Column({ type: "jsonb" })
  value: unknown;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
