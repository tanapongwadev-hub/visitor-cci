/**
 * อัดวิดีโอคู่มือการใช้งานจากแอปจริง (ต้องรัน dev server ที่ :3030 ก่อน)
 *   npm run guide:video
 * ผลลัพธ์: docs/user-guide.webm (+ .mp4 ถ้าแปลงได้)
 *
 * ใช้วันที่ทดสอบ GUIDE_DATE — ข้อมูลที่สร้างระหว่างอัดจะถูกลบทิ้งตอนจบ
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";

const BASE = process.env.GUIDE_BASE ?? "http://localhost:3030";
const GUIDE_DATE = "2030-12-31";
const OUT_DIR = "docs";
const TMP_DIR = path.join(OUT_DIR, ".video-tmp");
const SIZE = { width: 1440, height: 900 };
const SPEED = Number(process.env.GUIDE_SPEED ?? 1); // <1 = เร็วขึ้น

fs.mkdirSync(TMP_DIR, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: TMP_DIR, size: SIZE },
  locale: "th-TH",
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
const T0 = Date.now();
const chapters = [];
/** บันทึกจุดเริ่มบท (วินาทีในวิดีโอ) สำหรับสารบัญใน user-guide.html */
const chapter = (name) => chapters.push({ t: Math.max(0, (Date.now() - T0) / 1000 - 0.3), name });
page.on("dialog", (d) => d.accept()); // confirm/alert ในแอป -> ตอบตกลง

const wait = (ms) => page.waitForTimeout(ms * SPEED);

/* ---------- overlay: คำบรรยาย + เคอร์เซอร์จำลอง ---------- */
async function overlay() {
  await page.evaluate(() => {
    if (document.getElementById("__guide_style")) return;
    const style = document.createElement("style");
    style.id = "__guide_style";
    style.textContent = `
      #__cap{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);max-width:82vw;z-index:2147483646;
        background:rgba(15,23,42,.88);color:#fff;padding:14px 26px;border-radius:14px;font:500 22px/1.45 Kanit,"Segoe UI",Tahoma,sans-serif;
        box-shadow:0 10px 40px rgba(0,0,0,.35);opacity:0;transition:opacity .35s;pointer-events:none;text-align:center;white-space:pre-line}
      #__cap.show{opacity:1}
      #__cap b{color:#5eead4}
      #__cur{position:fixed;left:0;top:0;width:26px;height:26px;z-index:2147483647;pointer-events:none;
        transition:left .55s cubic-bezier(.2,.7,.2,1),top .55s cubic-bezier(.2,.7,.2,1);filter:drop-shadow(0 2px 3px rgba(0,0,0,.45))}
      #__cur svg{width:100%;height:100%}
      #__cur.click:after{content:"";position:absolute;left:-14px;top:-14px;width:40px;height:40px;border-radius:50%;
        border:3px solid #14b8a6;animation:__rip .5s ease-out forwards}
      @keyframes __rip{from{transform:scale(.3);opacity:1}to{transform:scale(1.4);opacity:0}}
      #__title{position:fixed;inset:0;z-index:2147483645;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;
        background:linear-gradient(135deg,#0f766e,#134e4a);color:#fff;font-family:Kanit,"Segoe UI",Tahoma,sans-serif;opacity:0;transition:opacity .5s;pointer-events:none}
      #__title.show{opacity:1}
      #__title h1{font-size:54px;font-weight:700;margin:0;letter-spacing:.5px}
      #__title p{font-size:24px;margin:0;opacity:.85}
      #__spot{position:fixed;z-index:2147483644;pointer-events:none;border:3px solid #14b8a6;border-radius:10px;
        box-shadow:0 0 0 9999px rgba(0,0,0,.28);opacity:0;transition:all .4s}
      #__spot.show{opacity:1}
      nextjs-portal{display:none!important}
    `;
    document.head.appendChild(style);
    const cap = document.createElement("div");
    cap.id = "__cap";
    const cur = document.createElement("div");
    cur.id = "__cur";
    cur.innerHTML = `<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6 1.5L16.5 20l-3 1.3-3.5-7.6L5 18z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
    cur.style.left = "700px";
    cur.style.top = "450px";
    const spot = document.createElement("div");
    spot.id = "__spot";
    document.body.append(cap, cur, spot);
  });
}

async function say(text, ms = 3200) {
  await overlay();
  await page.evaluate((t) => {
    const cap = document.getElementById("__cap");
    cap.innerHTML = t;
    cap.classList.add("show");
  }, text);
  await wait(ms);
}
async function hush() {
  await page.evaluate(() => document.getElementById("__cap")?.classList.remove("show"));
}

async function title(h, p, ms = 3000) {
  await overlay();
  await page.evaluate(
    ([h, p]) => {
      let t = document.getElementById("__title");
      if (!t) {
        t = document.createElement("div");
        t.id = "__title";
        document.body.appendChild(t);
      }
      t.innerHTML = `<h1>${h}</h1><p>${p}</p>`;
      requestAnimationFrame(() => t.classList.add("show"));
    },
    [h, p],
  );
  await wait(ms);
  await page.evaluate(() => document.getElementById("__title")?.classList.remove("show"));
  await wait(600);
}

/** เลื่อนเคอร์เซอร์จำลองไปยัง element (พร้อม scroll ให้เห็น) */
async function moveTo(locator, { spotlight = false } = {}) {
  await locator.scrollIntoViewIfNeeded();
  await wait(250);
  const box = await locator.boundingBox();
  if (!box) throw new Error("element not visible");
  const x = box.x + Math.min(box.width / 2, 120);
  const y = box.y + box.height / 2;
  await overlay();
  await page.evaluate(
    ([x, y, b, s]) => {
      const cur = document.getElementById("__cur");
      cur.style.left = `${x}px`;
      cur.style.top = `${y}px`;
      const spot = document.getElementById("__spot");
      if (s) {
        Object.assign(spot.style, { left: `${b.x - 6}px`, top: `${b.y - 6}px`, width: `${b.width + 12}px`, height: `${b.height + 12}px` });
        spot.classList.add("show");
      } else spot.classList.remove("show");
    },
    [x, y, box, spotlight],
  );
  await page.mouse.move(x, y);
  await wait(650);
  return { x, y };
}
async function unspot() {
  await page.evaluate(() => document.getElementById("__spot")?.classList.remove("show"));
}

async function click(locator, opts) {
  const { x, y } = await moveTo(locator, opts);
  await page.evaluate(() => {
    const c = document.getElementById("__cur");
    c.classList.remove("click");
    void c.offsetWidth;
    c.classList.add("click");
  });
  await page.mouse.click(x, y);
  await wait(500);
}

async function typeInto(locator, text, { clear = true, delay = 55 } = {}) {
  await click(locator);
  if (clear) await page.keyboard.press("Control+A");
  await page.keyboard.type(text, { delay: delay * SPEED });
  await wait(400);
}

const btn = (text) => page.getByRole("button", { name: text, exact: false }).first();
const tab = (text) => page.locator("button", { hasText: text }).first();
const combos = () => page.locator('input[role="combobox"]');

/* ================================================================= */
/*                              ฉากต่างๆ                              */
/* ================================================================= */

await page.goto(`${BASE}/`);
await page.waitForLoadState("networkidle");
await title("คู่มือการใช้งาน Visitor Schedule", "ระบบตารางผู้มาติดต่อ — Chiewchan Industry", 3400);

// ---- 1. หน้าแรก ----
chapter("หน้าแรก");
await say("<b>หน้าแรก</b>  มี 2 ทางเข้า: หน้าแสดงผล (โปสเตอร์) และ Admin สำหรับจัดการข้อมูล");
await click(page.getByRole("link", { name: /Admin/ }), { spotlight: true });
await unspot();
await page.waitForURL(/\/admin/);
await page.waitForLoadState("networkidle");
await wait(800);

// ---- 2. ภาพรวม admin ----
chapter("ภาพรวมหน้า Admin");
await say("<b>หน้า Admin</b>  ซ้ายคือแผงควบคุม 4 แท็บ — ขวาคือตัวอย่างสดของโปสเตอร์ที่อัปเดตทันทีขณะพิมพ์", 3800);
await moveTo(page.locator("header").first(), { spotlight: true });
await say("<b>แถบบน</b>  เลือกวันที่ / ‹ › เลื่อนวัน / ปุ่ม วันนี้ / เปิดหน้าแสดงผล / เปิดโหมด TV", 3600);
await unspot();

// ---- 3. เลือกวันที่ ----
chapter("เลือกวันที่");
const dateInput = page.locator('header input[type="date"]');
await click(dateInput, { spotlight: true });
await say(`เลือกวันที่ที่ต้องการจัดตาราง (ตัวอย่างใช้ ${GUIDE_DATE})`, 1800);
await dateInput.fill(GUIDE_DATE);
await page.keyboard.press("Tab");
await unspot();
await page.waitForURL((u) => u.search.includes(GUIDE_DATE));
await wait(1200);

// ---- 4. เพิ่มรายการ ----
chapter("เพิ่มรายการนัด");
await say("<b>แท็บ ตารางนัด</b>  กด <b>+ เพิ่มรายการ</b> เพื่อสร้างนัดใหม่", 2400);
await click(btn("เพิ่มรายการ"), { spotlight: true });
await unspot();
await say("รายการหนึ่งแบ่งเป็น 3 กลุ่ม: <b>นัดหมาย</b> (เวลา, ห้อง) · <b>ผู้มาติดต่อ</b> · <b>ผู้รับแขก</b>", 3600);

// เวลา
await say("<b>เวลา</b>  พิมพ์เป็น 24 ชม. เช่น 9.30 ระบบจะแปลงเป็น 09:30 ให้ หรือคลิกไอคอนนาฬิกาเพื่อเลือก", 2200);
await typeInto(page.locator('input[placeholder="09:00"]').first(), "9.30");
await page.keyboard.press("Enter");
await wait(900);
await click(page.getByRole("button", { name: "เลือกเวลา" }).first());
await wait(1400);
await page.keyboard.press("Escape");

// ห้อง
await say("<b>ห้องประชุม</b>  พิมพ์เพื่อค้นหาจากข้อมูลหลัก แล้วเลือกด้วยเมาส์หรือลูกศร/Enter", 2400);
await typeInto(combos().nth(0), "ห้อง");
await wait(900);
const roomOpt = page.locator('[role="option"]').first();
if (await roomOpt.isVisible()) await click(roomOpt);
else {
  await page.keyboard.press("Control+A");
  await page.keyboard.type("ห้องประชุม 1", { delay: 50 });
  await page.keyboard.press("Escape");
}

// บริษัท
await say("<b>บริษัท / กิจกรรม</b>  เลือกจากรายการ หรือพิมพ์ชื่อใหม่แล้วกด <b>+ เพิ่มในข้อมูลหลัก</b> ได้จากในช่องเลย", 2600);
await typeInto(combos().nth(1), "TYM");
await wait(800);
await page.keyboard.press("Enter");

// รายชื่อ
await say("<b>รายชื่อผู้มาติดต่อ</b>  บรรทัดละคนหรือกลุ่ม — เกิน 5 บรรทัดโปสเตอร์จะจัดเป็น 2 คอลัมน์ให้อัตโนมัติ", 2400);
await typeInto(page.locator("textarea").first(), "MR. HATTORI, MR. SHUICHI\nMR. WEERANAH", { delay: 35 });

// ผู้รับแขก
await say("<b>ผู้รับแขก</b>  เลือกจากรายการ → <b>ฝ่าย/แผนก</b> จะถูกเติมให้อัตโนมัติ", 2400);
await typeInto(combos().nth(2), "คุณ");
await wait(900);
const hostOpt = page.locator('[role="option"]').first();
if ((await hostOpt.isVisible()) && !(await hostOpt.textContent()).includes("เพิ่มในข้อมูลหลัก")) await click(hostOpt);
else {
  await page.keyboard.press("Escape");
  await typeInto(combos().nth(3), "ฝ่ายบุคคล");
  await page.keyboard.press("Escape");
}
await wait(800);
await moveTo(page.locator("section.mx-auto").first(), { spotlight: true });
await say("สังเกต <b>ตัวอย่างสด</b> ด้านขวา — แถวใหม่ปรากฏบนโปสเตอร์ทันที ยังไม่ต้องบันทึก", 3000);
await unspot();

// ---- 5. ตรวจซ้ำ ----
chapter("ป้องกันเวลา+ห้องซ้ำ");
await say("<b>ป้องกันการจองซ้ำ</b>  ลองเพิ่มรายการที่ เวลา + ห้อง เหมือนกัน…", 2200);
await click(btn("เพิ่มรายการ"));
await typeInto(page.locator('input[placeholder="09:00"]').nth(1), "09:30");
await page.keyboard.press("Enter");
const firstRoom = await combos().nth(0).inputValue();
await typeInto(combos().nth(4), firstRoom);
await page.keyboard.press("Escape");
await wait(600);
await moveTo(page.locator("span.bg-red-600").first(), { spotlight: true });
await say("ระบบเตือนทันทีว่า <b>ซ้ำกับรายการ #1</b> และจะไม่ยอมบันทึกจนกว่าจะแก้ — เปลี่ยนเวลาให้ต่างกัน", 3400);
await unspot();
await typeInto(page.locator('input[placeholder="09:00"]').nth(1), "10:30");
await page.keyboard.press("Enter");
await typeInto(combos().nth(5), "GCC");
await page.keyboard.press("Escape");
await wait(600);

// ---- 6. เรียง / บันทึก ----
chapter("เรียงลำดับและบันทึก");
await say("<b>เรียงตามเวลา</b> จัดลำดับให้อัตโนมัติ หรือใช้ปุ่ม ↑ ↓ ที่หัวการ์ดเลื่อนเอง", 2200);
await click(btn("เรียงตามเวลา"), { spotlight: true });
await unspot();
await say("กด <b>บันทึก</b> — ข้อมูลลงฐานข้อมูล หน้าแสดงผลและจอ TV จะอัปเดตเอง", 2200);
await click(btn("บันทึก").last(), { spotlight: true });
await unspot();
await wait(2200);

// ---- 7. preview TV ----
chapter("ตัวอย่างโหมด TV");
await say("<b>ตัวอย่างโหมด TV</b>  สลับดูว่าบนจอ 55\" แนวตั้งจะแบ่งหน้าอย่างไร", 2200);
await click(page.locator("button", { hasText: "TV 55" }), { spotlight: true });
await unspot();
await wait(2600);
await click(page.locator("button", { hasText: "โปสเตอร์" }).first());

// ---- 8. ข้อมูลหลัก ----
chapter("ข้อมูลหลัก");
await click(tab("ข้อมูลหลัก"), { spotlight: true });
await unspot();
await say("<b>แท็บ ข้อมูลหลัก</b>  จัดการรายการ ห้องประชุม / บริษัท / ผู้รับแขก / ฝ่าย ที่ใช้ใน dropdown", 3200);
await typeInto(page.locator('input[placeholder^="เพิ่มห้องประชุม"]'), "ห้องสาธิต");
await page.keyboard.press("Enter");
await wait(1600);
await say("แก้ชื่อได้โดยพิมพ์ทับในแถวแล้วกด Enter · ปุ่ม ✕ ลบ · <b>นำเข้าจากตารางนัด</b> ดึงค่าที่เคยใช้มาเป็นข้อมูลหลัก", 3600);
const demoRow = page.locator("li", { has: page.locator('input[value="ห้องสาธิต"]') }).first();
if (await demoRow.count()) await click(demoRow.locator("button", { hasText: "✕" }));
await wait(1200);

// ---- 9. ตั้งค่า ----
chapter("ตั้งค่า");
await click(tab("ตั้งค่า"), { spotlight: true });
await unspot();
await say("<b>แท็บ ตั้งค่า</b>  ชื่อบริษัท คำขวัญ ข้อความขอบคุณ ค่านิยม 3 ข้อ และเวลาสลับหน้าของโหมด TV", 3400);
await page.mouse.wheel(0, 500);
await wait(1800);
await page.mouse.wheel(0, -500);

// ---- 10. ธีมสี ----
chapter("ธีมสี");
await click(tab("ธีมสี"), { spotlight: true });
await unspot();
await say("<b>แท็บ ธีมสี</b>  ธีมสำเร็จรูป 26 แบบ หรือกำหนดสีเอง — ตัวอย่างด้านขวาเปลี่ยนทันที", 2600);
await click(page.locator("button", { hasText: "Navy" }).first());
await wait(1600);
await click(page.locator("button", { hasText: "Burgundy" }).first());
await wait(1600);
await say("ถ้ายังไม่กด บันทึก จะไม่มีผลกับหน้าจริง — กด <b>ยกเลิกการแก้ไข</b> เพื่อคืนค่า", 2400);
await click(btn("ยกเลิกการแก้ไข").last());
await wait(800);

// ---- 11. หน้าแสดงผล ----
chapter("หน้าแสดงผล");
await hush();
await page.goto(`${BASE}/schedule?date=${GUIDE_DATE}`);
await page.waitForLoadState("networkidle");
await wait(600);
await say("<b>หน้าแสดงผล</b>  /schedule?date=YYYY-MM-DD — โปสเตอร์ของวันนั้น (ไม่ใส่วันที่ = วันนี้) สั่งพิมพ์ได้ด้วย Ctrl+P", 3600);
await page.mouse.wheel(0, 600);
await wait(1500);

// ---- 12. โหมด TV ----
chapter("โหมด TV");
await hush();
await page.goto(`${BASE}/tv?date=${GUIDE_DATE}`);
await page.waitForLoadState("networkidle");
await wait(800);
await say("<b>โหมด TV</b>  เปิด /tv บนจอแนวตั้งแล้วกด F11 — เต็มจอพอดี, เกินหน้าจะสลับเองทุก 30 วิ, ดึงข้อมูลใหม่ทุก 60 วิ", 4200);

// ---- จบ ----
await title("จบคู่มือ", "สรุป: Admin → ตารางนัด → บันทึก → เปิด /tv บนจอ", 3200);

/* ---------- ปิดและเก็บไฟล์ ---------- */
const video = page.video();
await ctx.close();
await browser.close();
const src = await video.path();
const webm = path.join(OUT_DIR, "user-guide.webm");
fs.copyFileSync(src, webm);
fs.rmSync(TMP_DIR, { recursive: true, force: true });
console.log("saved", webm, `${(fs.statSync(webm).size / 1e6).toFixed(1)} MB`);

// หน้า player พร้อมสารบัญบท
const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const html = `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>คู่มือการใช้งาน Visitor Schedule</title>
<style>
body{margin:0;font-family:Kanit,"Segoe UI",Tahoma,sans-serif;background:#0f172a;color:#e2e8f0}
.wrap{max-width:1280px;margin:0 auto;padding:24px 16px;display:grid;gap:20px;grid-template-columns:minmax(0,1fr) 300px}
@media(max-width:900px){.wrap{grid-template-columns:1fr}}
h1{font-size:22px;margin:0 0 12px;grid-column:1/-1}
video{width:100%;border-radius:12px;background:#000;box-shadow:0 20px 60px rgba(0,0,0,.5)}
.ch{background:#1e293b;border-radius:12px;padding:12px;align-self:start}
.ch h2{font-size:15px;margin:0 0 8px;color:#94a3b8;font-weight:500}
.ch button{display:flex;gap:10px;width:100%;text-align:left;background:none;border:0;color:#e2e8f0;padding:8px 10px;border-radius:8px;cursor:pointer;font:inherit;font-size:15px}
.ch button:hover,.ch button.on{background:#0f766e}
.ch time{color:#5eead4;font-variant-numeric:tabular-nums;min-width:38px}
p.note{grid-column:1/-1;color:#94a3b8;font-size:14px;margin:0}
</style></head><body><div class="wrap">
<h1>คู่มือการใช้งาน Visitor Schedule</h1>
<video id="v" src="user-guide.webm" controls playsinline></video>
<div class="ch"><h2>สารบัญ</h2>${chapters.map((c) => `<button data-t="${c.t.toFixed(1)}"><time>${fmt(c.t)}</time><span>${c.name}</span></button>`).join("")}</div>
<p class="note">ไฟล์วิดีโอ: user-guide.webm (เปิดด้วย Chrome / Edge / Firefox / VLC) — สร้างจากแอปจริงด้วย <code>npm run guide:video</code></p>
</div>
<script>
const v=document.getElementById("v"),bs=[...document.querySelectorAll(".ch button")];
bs.forEach(b=>b.onclick=()=>{v.currentTime=+b.dataset.t;v.play()});
v.addEventListener("timeupdate",()=>{let cur=null;bs.forEach(b=>{if(v.currentTime>=+b.dataset.t)cur=b});bs.forEach(b=>b.classList.toggle("on",b===cur))});
</script></body></html>`;
fs.writeFileSync(path.join(OUT_DIR, "user-guide.html"), html);
console.log("saved", path.join(OUT_DIR, "user-guide.html"), `(${chapters.length} chapters)`);

// แปลงเป็น mp4 ด้วย ffmpeg ที่มากับ Playwright (ถ้ามี encoder)
const ffDir = path.join(process.env.LOCALAPPDATA ?? "", "ms-playwright");
const ff = fs.existsSync(ffDir) ? fs.readdirSync(ffDir).find((d) => d.startsWith("ffmpeg")) : null;
if (ff) {
  const exe = path.join(ffDir, ff, "ffmpeg-win64.exe");
  const mp4 = path.join(OUT_DIR, "user-guide.mp4");
  const r = spawnSync(exe, ["-y", "-i", webm, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "23", "-preset", "veryfast", mp4], { stdio: "pipe" });
  if (r.status === 0) console.log("saved", mp4, `${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB`);
  else console.log("mp4 conversion not available (keeping .webm)");
}

/* ---------- ลบข้อมูลทดสอบ ---------- */
if (process.env.DATABASE_URL) {
  const c = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const r = await c.query("delete from visit_schedules where date = $1", [GUIDE_DATE]);
  await c.query("delete from master_items where name = $1", ["ห้องสาธิต"]);
  await c.end();
  console.log(`cleaned ${r.rowCount} guide row(s) for ${GUIDE_DATE}`);
}
