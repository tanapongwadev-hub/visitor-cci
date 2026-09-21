import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1789986721108 implements MigrationInterface {
    name = 'Migration1789986721108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "visit_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "date" date NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', "time" character varying(20) NOT NULL, "company" character varying(255) NOT NULL, "visitorNames" text NOT NULL DEFAULT '', "label" character varying(50) NOT NULL DEFAULT 'VISITOR', "hostName" character varying(255) NOT NULL DEFAULT '', "hostDept" character varying(255) NOT NULL DEFAULT '', "room" character varying(50) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cf5c1e8430312e0c014afb60ca6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e18dffffdee1c258085f758c92" ON "visit_schedules"  ("date", "sortOrder") `);
        await queryRunner.query(`CREATE TABLE "settings" ("key" character varying(100) NOT NULL, "value" jsonb NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_c8639b7626fa94ba8265628f214" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "master_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying(20) NOT NULL, "name" character varying(255) NOT NULL, "detail" character varying(255) NOT NULL DEFAULT '', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_388206be580e4b20829bc1b08dd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0b8d45b9d063ea06b30431ed27" ON "master_items"  ("type", "name") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_0b8d45b9d063ea06b30431ed27"`);
        await queryRunner.query(`DROP TABLE "master_items"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e18dffffdee1c258085f758c92"`);
        await queryRunner.query(`DROP TABLE "visit_schedules"`);
    }

}
