"use client";

import {
  HEX_RE,
  THEME_GROUP_LABELS,
  THEME_PRESETS,
  type PosterTheme,
  type ThemeGroup,
} from "@/components/schedule/types";

type Props = {
  theme: PosterTheme;
  onChange: (theme: PosterTheme) => void;
};

const COLOR_FIELDS: { key: keyof Omit<PosterTheme, "timeColors">; label: string; hint: string }[] = [
  { key: "primary", label: "สีหลัก", hint: "หัวตาราง, เส้นคั่น, ไอคอน" },
  { key: "primaryDark", label: "สีเข้ม", hint: "ปลาย gradient หัวตาราง, footer" },
  { key: "accent", label: "สีเน้น", hint: "แถบเฉียงเหนือ footer" },
  { key: "ink", label: "สีตัวอักษร", hint: "ข้อความหลักทั้งหมด" },
  { key: "pageBg", label: "พื้นหลังรอบโปสเตอร์", hint: "เห็นเฉพาะเมื่อจอกว้างกว่า 1024px" },
];

const MAX_TIME_COLORS = 12;
const GROUPS = Object.keys(THEME_GROUP_LABELS) as ThemeGroup[];

export default function ThemeTab({ theme, onChange }: Props) {
  const activePreset = THEME_PRESETS.find((p) => JSON.stringify(p.theme) === JSON.stringify(theme));

  function setColor(key: keyof Omit<PosterTheme, "timeColors">, value: string) {
    onChange({ ...theme, [key]: value });
  }
  function setTimeColor(i: number, value: string) {
    const next = [...theme.timeColors];
    next[i] = value;
    onChange({ ...theme, timeColors: next });
  }
  function removeTimeColor(i: number) {
    if (theme.timeColors.length <= 1) return;
    onChange({ ...theme, timeColors: theme.timeColors.filter((_, j) => j !== i) });
  }
  function addTimeColor() {
    if (theme.timeColors.length >= MAX_TIME_COLORS) return;
    onChange({ ...theme, timeColors: [...theme.timeColors, theme.primary] });
  }

  return (
    <>
      <Card title={`ธีมสำเร็จรูป (${THEME_PRESETS.length})`}>
        <div className="flex flex-col gap-3">
          {GROUPS.map((g) => (
            <div key={g}>
              <div className="mb-1.5 text-xs font-medium text-zinc-500">{THEME_GROUP_LABELS[g]}</div>
              <div className="grid grid-cols-3 gap-1.5">
                {THEME_PRESETS.filter((p) => p.group === g).map((p) => {
                  const active = activePreset?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onChange(structuredClone(p.theme))}
                      title={p.name}
                      className={`rounded-lg border p-1.5 text-left transition ${
                        active
                          ? "border-teal-700 ring-2 ring-teal-700/30"
                          : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-700"
                      }`}
                    >
                      <div className="mb-1 flex h-5 overflow-hidden rounded">
                        <span className="flex-[1.6]" style={{ background: p.theme.primary }} />
                        <span className="flex-1" style={{ background: p.theme.primaryDark }} />
                        <span className="flex-1" style={{ background: p.theme.accent }} />
                        {p.theme.timeColors.slice(0, 4).map((c, i) => (
                          <span key={i} className="flex-1" style={{ background: c }} />
                        ))}
                      </div>
                      <div className="truncate text-[11px] font-medium">{p.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {!activePreset ? <p className="mt-2 text-xs text-zinc-500">กำลังใช้สีที่กำหนดเอง</p> : null}
      </Card>

      <Card title="สีหลัก">
        <div className="flex flex-col gap-2">
          {COLOR_FIELDS.map((f) => (
            <ColorField
              key={f.key}
              label={f.label}
              hint={f.hint}
              value={theme[f.key]}
              onChange={(v) => setColor(f.key, v)}
            />
          ))}
        </div>
      </Card>

      <Card
        title={`สีกล่องเวลา (${theme.timeColors.length})`}
        actions={
          <button
            className={btnCls}
            onClick={addTimeColor}
            disabled={theme.timeColors.length >= MAX_TIME_COLORS}
          >
            + เพิ่มสี
          </button>
        }
      >
        <p className="mb-2 text-xs text-zinc-500">
          แถวที่ 1 ใช้สีที่ 1, แถวที่ 2 ใช้สีที่ 2 … เมื่อครบจะวนกลับมาสีแรก (gradient เข้มขึ้นอัตโนมัติ)
        </p>
        <div className="flex flex-col gap-1.5">
          {theme.timeColors.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-6 text-xs text-zinc-500">#{i + 1}</span>
              <span
                className="h-7 w-16 rounded-md text-center text-xs font-bold leading-7 text-white"
                style={{ background: `linear-gradient(135deg, ${c}, color-mix(in srgb, ${c} 78%, black))` }}
              >
                09:00
              </span>
              <ColorInput value={c} onChange={(v) => setTimeColor(i, v)} />
              <button
                className={`${btnCls} ml-auto text-red-600`}
                onClick={() => removeTimeColor(i)}
                disabled={theme.timeColors.length <= 1}
                title="ลบสี"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------------ */

const btnCls =
  "inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700";

function ColorField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="text-sm">{label}</div>
        <div className="text-xs text-zinc-500">{hint}</div>
      </div>
      <ColorInput value={value} onChange={onChange} />
    </div>
  );
}

/** color picker + ช่องพิมพ์ hex — รับเฉพาะ #rrggbb */
function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const valid = HEX_RE.test(value);
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={valid ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-zinc-300 bg-transparent p-0.5 dark:border-zinc-600"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
        spellCheck={false}
        maxLength={7}
        className={`w-24 rounded-md border px-2 py-1 font-mono text-xs uppercase outline-none focus:ring-2 focus:ring-teal-600/20 dark:bg-zinc-900 ${
          valid ? "border-zinc-300 dark:border-zinc-600" : "border-red-500"
        }`}
      />
    </div>
  );
}

function Card({ title, actions, children }: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {actions ? <div className="ml-auto flex gap-1">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
