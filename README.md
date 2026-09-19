# visitor-cci

Next.js 16 (App Router, TypeScript, Tailwind) + PostgreSQL + TypeORM

## เริ่มต้น

1. ตั้งค่า `.env` (คัดลอกจาก `.env.example`)

   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/visitor_cci
   ```

2. เตรียม PostgreSQL — เลือกอย่างใดอย่างหนึ่ง
   - ใช้ Docker: `npm run db:up`
   - ใช้ Postgres ที่ติดตั้งในเครื่อง: สร้าง database `visitor_cci` แล้วแก้ user/password ใน `DATABASE_URL`

3. รัน dev server

   ```
   npm run dev
   ```

   เปิด http://localhost:3030 — ตรวจสอบการเชื่อมต่อ DB ที่ http://localhost:3030/api/health

## โครงสร้าง

```
src/
  lib/db/
    data-source.ts     # TypeORM DataSource (อ่าน DATABASE_URL)
    index.ts           # getDataSource() singleton (ปลอดภัยกับ hot-reload)
    entities/          # Entity ต่างๆ (Visitor)
    migrations/        # Migration files
  app/
    page.tsx           # หน้าแรก — Server Component อ่านข้อมูลจาก DB
    actions.ts         # Server Action สำหรับบันทึกข้อมูล
    api/visitors/      # REST API: GET / POST
    api/health/        # ตรวจสอบสถานะ DB
```

## Migration

ใน dev `synchronize: true` จะ sync schema จาก entity อัตโนมัติ
ใน production ให้ใช้ migration:

```
npm run migration:generate   # สร้าง migration จากความต่างของ entity กับ DB
npm run migration:run        # รัน migration
npm run migration:revert     # ย้อนกลับ migration ล่าสุด
```

## หมายเหตุ

- `next.config.ts` ตั้ง `serverExternalPackages: ["typeorm", "pg", "reflect-metadata"]` เพื่อให้ TypeORM ทำงานกับ decorators ได้
- `tsconfig.json` เปิด `experimentalDecorators` และ `emitDecoratorMetadata`

## หน้าต่างๆ

| path | หน้าที่ |
|---|---|
| `/` | landing — ลิงก์ไปหน้าแสดงผลและ admin |
| `/schedule?date=YYYY-MM-DD` | โปสเตอร์ตารางผู้มาติดต่อ (ไม่ใส่ date = วันนี้ เวลาไทย) |
| `/tv?date=YYYY-MM-DD` | โหมดจอ TV แนวตั้ง (เต็มจอ, แบ่งหน้าอัตโนมัติ, สลับหน้าวนลูป, refresh ข้อมูลเอง) |
| `/admin?date=YYYY-MM-DD` | จัดการรายการ / ตั้งค่าโปสเตอร์ / ธีมสี พร้อม preview สด |
| `/api/health` | ตรวจสถานะ DB |

## ข้อมูลตัวอย่าง

```
npm run db:seed                # ใส่ตารางตัวอย่างวันที่ 2026-09-17
npm run db:seed -- 2026-10-01  # ระบุวันที่เอง
```

## โครงสร้าง (schedule)

```
src/lib/db/entities/
  VisitSchedule.ts       # ตารางนัดรายวัน (visit_schedules)
  Setting.ts             # key-value JSON (settings) — key "poster" เก็บค่าตั้งค่าโปสเตอร์
  MasterItem.ts          # ข้อมูลหลัก (master_items): type = room | company | host | department
src/lib/schedule/
  queries.ts             # อ่านข้อมูล (schedule ตามวัน, settings, วันที่ที่มีข้อมูล)
  actions.ts             # Server Actions: saveSchedule / copySchedule / savePosterSettings
src/lib/master/
  types.ts / queries.ts / actions.ts   # ข้อมูลหลัก: CRUD + นำเข้าจากตารางนัด
src/components/schedule/
  SchedulePoster.tsx     # โปสเตอร์ (รับ data + settings เป็น props)
  TvSchedule.tsx         # โหมด TV: scale เต็มจอ, วัดแถวแล้วแบ่งหน้า, หมุนหน้าตามเวลาจริง
  schedule.module.css    # สไตล์ (CSS Module)
  icons.tsx / types.ts   # ไอคอน SVG, types + DEFAULT_SETTINGS
src/app/admin/
  AdminPanel.tsx         # client component: ฟอร์ม + preview สด
  ThemeTab.tsx           # แท็บธีมสี: preset + color picker
  MasterTab.tsx          # แท็บข้อมูลหลัก: เพิ่ม / แก้ inline / ลบ / นำเข้า
  Combobox.tsx           # dropdown แบบ select2 (ค้นหา, คีย์บอร์ด, เพิ่มค่าใหม่ในช่อง)
  TimePicker24.tsx       # time picker 24 ชม.
  ScaledPreview.tsx      # ย่อโปสเตอร์ 1024px ให้พอดี container
scripts/seed.ts          # ข้อมูลตัวอย่าง
public/logo.png          # โลโก้
```

ฟอนต์ Kanit / Montserrat โหลดผ่าน `next/font/google`

## ธีมสี

สีทั้งหมดใน `schedule.module.css` derive จาก 5 ตัวแปร (`--primary`, `--primary-dark`, `--accent`, `--ink`, `--page-bg`) ด้วย `color-mix()` และ `--tc` ต่อแถวสำหรับกล่องเวลา
ค่าเก็บใน `settings.theme` — preset 26 แบบ (แบ่งกลุ่ม โทนเย็น / โทนอุ่น / โทนกลาง) อยู่ที่ `THEME_PRESETS` ใน `types.ts` เพิ่มได้ด้วย helper `p(id, name, group, [primary, primaryDark, accent, ink, pageBg], timeColors)`

## โหมด TV (`/tv`)

ออกแบบสำหรับจอ 55" แนวตั้ง (1080×1920) แต่ปรับตาม viewport จริงอัตโนมัติ

- เปิด `http://<server>/tv` บน browser ของจอ TV แล้วกด F11 (หรือ kiosk mode)
- ไม่ใส่ `?date=` = วันนี้ (เวลาไทย) และเปลี่ยนวันเองหลังเที่ยงคืน
- ถ้ารายการเกินหนึ่งหน้า จะแบ่งหน้าตามความสูงจริงของแถว แล้วสลับหน้าทุก `tvPageIntervalSec` วินาที (default 30) วนลูป
- ดึงข้อมูลใหม่ทุก `tvRefreshSec` วินาที (default 60) — แก้ใน admin แล้วจออัปเดตเองโดยไม่ต้อง reload
- ตั้งค่าทั้งสองได้ที่ admin → ตั้งค่า → โหมด TV

## วิดีโอคู่มือ

- `docs/user-guide.html` — player พร้อมสารบัญบท (เปิดในเบราว์เซอร์)
- `docs/user-guide.webm` — ไฟล์วิดีโอ (Chrome / Edge / Firefox / VLC)
- อัดใหม่จากแอปจริง: รัน dev server แล้ว `npm run guide:video` (ใช้ Playwright, สร้างข้อมูลทดสอบวันที่ 2030-12-31 แล้วลบเองตอนจบ)

> หมายเหตุ: หน้า `/admin` ยังไม่มีระบบล็อกอิน — ควรใส่ auth ก่อนใช้งานจริง
"# visitor-cci" 
