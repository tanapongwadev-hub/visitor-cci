import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "visit_schedules" })
@Index(["date", "sortOrder"])
export class VisitSchedule {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** วันที่นัด (YYYY-MM-DD) */
  @Column({ type: "date" })
  date: string;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @Column({ type: "varchar", length: 20 })
  time: string;

  /** ชื่อบริษัท / กิจกรรม */
  @Column({ type: "varchar", length: 255 })
  company: string;

  /** รายชื่อผู้มาติดต่อ คั่นด้วยขึ้นบรรทัดใหม่ */
  @Column({ type: "text", default: "" })
  visitorNames: string;

  @Column({ type: "varchar", length: 50, default: "VISITOR" })
  label: string;

  @Column({ type: "varchar", length: 255, default: "" })
  hostName: string;

  @Column({ type: "varchar", length: 255, default: "" })
  hostDept: string;

  @Column({ type: "varchar", length: 50, default: "" })
  room: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
