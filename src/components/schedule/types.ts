export type ScheduleRow = {
  id: string;
  time: string;
  /** ชื่อบริษัท / กิจกรรม */
  company: string;
  /** รายชื่อผู้มาติดต่อ (แต่ละคนคนละบรรทัด) */
  visitorNames: string[];
  label: string;
  hostName: string;
  hostDept: string;
  room: string;
};

export type ScheduleData = {
  /** วันที่ YYYY-MM-DD */
  date: string;
  /** เช่น "17 SEPTEMBER 2026" */
  dateLabel: string;
  rows: ScheduleRow[];
};

export type FooterItem = { en: string; th: string };

/** ธีมสีของโปสเตอร์ — ทุกค่าเป็น hex #rrggbb */
export type PosterTheme = {
  /** สีหลัก: หัวตาราง, เส้นคั่น, ไอคอน */
  primary: string;
  /** สีเข้ม: ปลาย gradient หัวตาราง, footer */
  primaryDark: string;
  /** สีเน้น: แถบเฉียงเหนือ footer */
  accent: string;
  /** สีตัวอักษรหลัก */
  ink: string;
  /** สีพื้นหลังรอบโปสเตอร์ */
  pageBg: string;
  /** สีกล่องเวลา วนซ้ำตามลำดับแถว */
  timeColors: string[];
};

export type ThemeGroup = "cool" | "warm" | "neutral";
export const THEME_GROUP_LABELS: Record<ThemeGroup, string> = {
  cool: "โทนเย็น",
  warm: "โทนอุ่น",
  neutral: "โทนกลาง / เข้ม",
};

export type ThemePreset = { id: string; name: string; group: ThemeGroup; theme: PosterTheme };

// helper ให้เขียน preset สั้นๆ: p(id, name, group, [primary, primaryDark, accent, ink, pageBg], timeColors)
function p(id: string, name: string, group: ThemeGroup, c: [string, string, string, string, string], timeColors: string[]): ThemePreset {
  return { id, name, group, theme: { primary: c[0], primaryDark: c[1], accent: c[2], ink: c[3], pageBg: c[4], timeColors } };
}

export const THEME_PRESETS: ThemePreset[] = [
  // ---- โทนเย็น ----
  p("teal", "Teal (ค่าเริ่มต้น)", "cool", ["#147973", "#0a5e61", "#4bb5b0", "#10334a", "#edf4f6"],
    ["#22988d", "#43bfd0", "#419be1", "#758be6", "#8c67d8", "#c16ca9", "#d79263"]),
  p("navy", "Navy", "cool", ["#1e4d8c", "#163b6e", "#5b8fd6", "#14243a", "#edf1f7"],
    ["#2f6bc4", "#3b8ed0", "#4aa3b8", "#6b7fd6", "#8a6fd0", "#b86aa3", "#d4905c"]),
  p("ocean", "Ocean", "cool", ["#0b6e99", "#084f70", "#4fb3d9", "#0f2a3a", "#eaf3f8"],
    ["#1a8fc1", "#2aa7c9", "#3ab8b0", "#5a9ad6", "#7c86d8", "#a877c0", "#d19060"]),
  p("sky", "Sky", "cool", ["#2c8fd6", "#1f6aa3", "#7fc3f0", "#12293a", "#eaf4fc"],
    ["#3a9be0", "#4fb0e8", "#4fc0c8", "#6a9ae8", "#8a8ae0", "#b07ac8", "#d8965a"]),
  p("turquoise", "Turquoise", "cool", ["#17a2b8", "#117a8b", "#6fd4e4", "#0e2f36", "#eaf6f8"],
    ["#1fb0c8", "#30c0d8", "#40b8a8", "#5aa0e0", "#8088d8", "#b078b8", "#d8985a"]),
  p("mint", "Mint", "cool", ["#2aa38a", "#1f7d6a", "#7fd6c2", "#10302a", "#ebf7f4"],
    ["#31b598", "#45c2b0", "#4fb8d0", "#5f9fe0", "#8a8ad8", "#b87ab8", "#d8985a"]),
  p("emerald", "Emerald", "cool", ["#1f8a4c", "#166b3a", "#5cc48a", "#12321f", "#eef6f0"],
    ["#2aa35a", "#3cb488", "#3fa8b8", "#5c9ad6", "#7f7ed0", "#b57aa0", "#d5985a"]),
  p("forest", "Forest", "cool", ["#2f5d3a", "#22452a", "#7fb08a", "#16261a", "#eef3ee"],
    ["#3e7a4b", "#5a9160", "#7aa35a", "#3f9a8a", "#5c8ac0", "#8f7ab8", "#c0894e"]),
  p("indigo", "Indigo", "cool", ["#3f51b5", "#303f9f", "#7986cb", "#1a1f3a", "#eef0f8"],
    ["#4a5fc8", "#5c6bc0", "#5f8fd8", "#4fa8d0", "#8a7ad0", "#b070b8", "#d8905a"]),
  p("royal", "Royal Purple", "cool", ["#5b3d9e", "#43297a", "#9b7fd6", "#241a3a", "#f1eef7"],
    ["#6f4bc0", "#8a5fd0", "#a06ac8", "#c0699e", "#5c8bd6", "#3fa8b8", "#d4905c"]),
  p("slate-blue", "Slate Blue", "cool", ["#4a5f8f", "#35466b", "#8ea3d0", "#1c2436", "#eef0f5"],
    ["#5a72ad", "#6f86c8", "#5f9bc9", "#68a9b0", "#8d7fc0", "#b07aa0", "#c99060"]),

  // ---- โทนอุ่น ----
  p("sunset", "Sunset", "warm", ["#c2562c", "#953f1e", "#f0995a", "#3d1f12", "#faf0ea"],
    ["#d9652f", "#e0853a", "#d6a03c", "#c17a5a", "#a66a8c", "#6f7fc0", "#4c9fb5"]),
  p("coral", "Coral", "warm", ["#e0654c", "#b34a35", "#f5a08a", "#3d1d16", "#fcefec"],
    ["#ec7357", "#f08a5a", "#e8a05a", "#d4705a", "#b86a90", "#7a7fc8", "#4fa0b8"]),
  p("amber", "Amber", "warm", ["#b8860b", "#8a6508", "#e6b84f", "#3b2e0a", "#faf5e8"],
    ["#d09a1a", "#e0ad3a", "#c98a3c", "#b5715a", "#8a6fb0", "#4d8fc0", "#3fa89a"]),
  p("copper", "Copper", "warm", ["#a0522d", "#7a3d20", "#d68a5e", "#331a10", "#f8f0eb"],
    ["#b8623a", "#cc7a45", "#d09050", "#b77060", "#9a6a90", "#6a7fb8", "#4f9fa8"]),
  p("crimson", "Crimson", "warm", ["#b3262e", "#861a21", "#e0666c", "#3a1214", "#faeeee"],
    ["#c9353e", "#d9565c", "#c96a8a", "#9b5fb8", "#5f7fd0", "#3fa1b5", "#d98c4a"]),
  p("burgundy", "Burgundy", "warm", ["#8c2b3f", "#6a1f30", "#c9667a", "#3a1520", "#f7eef0"],
    ["#a8394f", "#c25a6a", "#b96a8f", "#8f6bb8", "#6c7fd0", "#4a9fb8", "#d6975a"]),
  p("rose", "Rose", "warm", ["#b84a6e", "#8c3653", "#e08aa8", "#3a1524", "#faeef2"],
    ["#cc5a80", "#d9749a", "#c07ab8", "#9670c8", "#6a85d0", "#4aa3bd", "#d99060"]),
  p("plum", "Plum", "warm", ["#7a3b6e", "#5a2a52", "#b878aa", "#2e1529", "#f5eef4"],
    ["#8f4a82", "#a85a98", "#b8709a", "#8c68b8", "#5f7fc8", "#3f9fb0", "#d0905a"]),
  p("mahogany", "Mahogany", "warm", ["#6e2a1e", "#4f1d14", "#b0654f", "#2b120c", "#f7efec"],
    ["#84372a", "#9e4a38", "#b06048", "#a06a6a", "#8a6f98", "#5f7fb0", "#4a9aa0"]),
  p("olive", "Olive", "warm", ["#6b7a2a", "#4f5b1e", "#a8b85a", "#262c10", "#f3f5ea"],
    ["#7f9230", "#98a640", "#7fa860", "#5a9a80", "#5f88b8", "#8f7ab0", "#c38f4a"]),
  p("lime", "Lime", "warm", ["#6a9a1a", "#4f7512", "#a8d648", "#1f2e0a", "#f3f8ea"],
    ["#7aa820", "#8fbf30", "#6fb85a", "#4faa88", "#5a90c0", "#8a7ab8", "#d0954a"]),

  // ---- โทนกลาง / เข้ม ----
  p("charcoal", "Charcoal", "neutral", ["#3a4750", "#26313a", "#7f8f99", "#1c2429", "#eff1f3"],
    ["#4b5a66", "#5f7380", "#5c8a99", "#6a7fb0", "#8a76a8", "#a86f8e", "#bf8a5a"]),
  p("steel", "Steel", "neutral", ["#556b7d", "#3e4f5e", "#93a8b8", "#1e2830", "#eef1f3"],
    ["#647d92", "#7590a8", "#6f9db0", "#7aa8b8", "#8a8ab8", "#a880a0", "#c09a68"]),
  p("midnight", "Midnight", "neutral", ["#1f2a44", "#141c30", "#5b6fa8", "#0f1424", "#eceef3"],
    ["#2f3f6e", "#3d5288", "#3f6aa8", "#4a8ab8", "#6e7cc0", "#9070b0", "#b8865a"]),
  p("graphite-gold", "Graphite & Gold", "neutral", ["#2b2b2b", "#151515", "#c9a227", "#1a1a1a", "#f0f0f0"],
    ["#3a3a3a", "#555555", "#6f6f6f", "#8a7a3a", "#b09030", "#c9a227", "#d8b85a"]),
];

export const DEFAULT_THEME: PosterTheme = THEME_PRESETS[0].theme;

export const HEX_RE = /^#[0-9a-f]{6}$/i;

/** ค่าตั้งค่าโปสเตอร์ — เก็บใน settings table key = "poster" */
export type PosterSettings = {
  companyNameEn: string;
  companyNameTh: string;
  welcomeText: string;
  showMotto: boolean;
  mottoLines: string[];
  thanksEn: string;
  thanksTh: string;
  footerItems: [FooterItem, FooterItem, FooterItem];
  /** ให้คลิกแก้ชื่อผู้รับแขกในหน้าแสดงผลได้ */
  editableHost: boolean;
  /** รูปแบบแสดงผู้รับแขก: "table" = เป็นคอลัมน์ในตาราง (แบบเดิม), "header" = เป็นหัวข้อของแต่ละรายการ */
  hostLayout: "table" | "header";
  /** อัตราขยายขนาดตัวอักษรทั้งโปสเตอร์ (1 = ขนาดปกติ, 0.8–2) */
  fontScale: number;
  /** ขนาด/น้ำหนักตัวอักษรแยกต่อส่วน (คูณเพิ่มจาก fontScale อีกที) */
  visitorScale: number;
  visitorBold: boolean;
  hostScale: number;
  hostBold: boolean;
  roomScale: number;
  roomBold: boolean;
  /** ข้อความเมื่อยังไม่ระบุผู้รับแขก */
  defaultHostName: string;
  defaultHostDept: string;
  theme: PosterTheme;
  /** โหมด TV: สลับหน้าทุกกี่วินาที (เมื่อรายการเกินหนึ่งหน้า) */
  tvPageIntervalSec: number;
  /** โหมด TV: ดึงข้อมูลใหม่ทุกกี่วินาที */
  tvRefreshSec: number;
};

export const DEFAULT_SETTINGS: PosterSettings = {
  companyNameEn: "CHIEWCHAN INDUSTRY (1989) CO., LTD.",
  companyNameTh: "บริษัท เชี่ยวชาญ อินดัสทรี่ (1989) จำกัด",
  welcomeText: "WELCOME TO",
  showMotto: true,
  mottoLines: ["PEOPLE", "PARTNERSHIP", "A BRIGHTER", "TOMORROW"],
  thanksEn: "THANK YOU FOR VISITING US",
  thanksTh: "ขอบคุณที่มาเยี่ยมชม",
  footerItems: [
    { en: "PEOPLE", th: "พัฒนาคน" },
    { en: "PARTNERSHIP", th: "เติบโตไปด้วยกัน" },
    { en: "A BRIGHTER TOMORROW", th: "สู่อนาคตที่ดีกว่า" },
  ],
  editableHost: false,
  hostLayout: "header",
  fontScale: 1,
  visitorScale: 1,
  visitorBold: true,
  hostScale: 1,
  hostBold: true,
  roomScale: 1,
  roomBold: true,
  defaultHostName: "ระบุชื่อผู้รับแขก",
  defaultHostDept: "ระบุฝ่าย / แผนก",
  theme: DEFAULT_THEME,
  tvPageIntervalSec: 30,
  tvRefreshSec: 60,
};

/** ขนาดจอ TV 55" แนวตั้ง (Full HD portrait) — ใช้เป็นกรอบ preview ใน admin */
export const TV_PORTRAIT = { width: 1080, height: 1920 } as const;

/** ขนาดโปสเตอร์ต้นฉบับ (สัดส่วน 2:3) — ใช้เป็นกรอบ preview โหมด "โปสเตอร์" ใน admin เพื่อให้แบ่งหน้าเหมือนหน้าแสดงผลจริง */
export const POSTER_PORTRAIT = { width: 1024, height: 1536 } as const;

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

/** "2026-09-17" -> "17 SEPTEMBER 2026" */
export function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** วันที่วันนี้ (เวลาไทย) ในรูปแบบ YYYY-MM-DD */
export function todayBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

/** "2026-09-17" -> "17/09/2026" */
export function formatDateTh(date: string): string {
  const [y, m, d] = date.split("-");
  return y && m && d ? `${d}/${m}/${y}` : date;
}

/** ทำชื่อห้องให้เทียบกันได้: ตัดช่องว่าง + ตัวพิมพ์ใหญ่ ("Room 1" = "ROOM1") */
export function normalizeRoom(room: string): string {
  return room.replace(/\s+/g, "").toUpperCase();
}

export type SlotDuplicate = {
  /** index ของแถวที่ซ้ำกัน (ตั้งแต่ 2 ขึ้นไป) */
  indexes: number[];
  time: string;
  room: string;
};

/** หาแถวที่ เวลา + ห้อง ซ้ำกัน (ภายในวันเดียวกัน) — ข้ามแถวที่ยังไม่กรอกเวลาหรือห้อง */
export function findDuplicateSlots(rows: { time: string; room: string }[]): SlotDuplicate[] {
  const groups = new Map<string, number[]>();
  rows.forEach((r, i) => {
    const time = r.time.trim();
    const room = normalizeRoom(r.room);
    if (!time || !room) return;
    const key = `${time}|${room}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  });
  return [...groups.values()]
    .filter((idx) => idx.length > 1)
    .map((indexes) => ({ indexes, time: rows[indexes[0]].time.trim(), room: rows[indexes[0]].room.trim() }));
}

export function isValidDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}
