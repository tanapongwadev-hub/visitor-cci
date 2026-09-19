import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/** ข้อมูลหลัก (master data): ห้องประชุม / บริษัท-กิจกรรม / ผู้รับแขก / ฝ่าย-แผนก */
@Entity({ name: "master_items" })
@Index(["type", "name"], { unique: true })
export class MasterItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** room | company | host | department */
  @Column({ type: "varchar", length: 20 })
  type: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  /** ข้อมูลเสริม — สำหรับ host = ฝ่าย/แผนก */
  @Column({ type: "varchar", length: 255, default: "" })
  detail: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
