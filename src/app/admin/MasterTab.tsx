"use client";

import { useState } from "react";
import Combobox from "./Combobox";
import { MASTER_TYPES, type MasterData, type MasterItemDto, type MasterType } from "@/lib/master/types";

type Props = {
  master: MasterData;
  pending: boolean;
  onCreate: (type: MasterType, name: string, detail?: string) => void;
  onUpdate: (item: MasterItemDto, name: string, detail: string) => void;
  onDelete: (item: MasterItemDto) => void;
  onImport: () => void;
};

const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-600 dark:bg-zinc-900";
const btnCls =
  "inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700";

export default function MasterTab({ master, pending, onCreate, onUpdate, onDelete, onImport }: Props) {
  const total = Object.values(master).reduce((n, list) => n + list.length, 0);
  const deptOptions = master.department.map((d) => ({ value: d.name }));

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-zinc-500">ข้อมูลหลักทั้งหมด {total} รายการ</span>
        <button className={`${btnCls} ml-auto`} onClick={onImport} disabled={pending} title="ดึงค่าที่ใช้อยู่ในตารางนัดทุกวันมาเป็นข้อมูลหลัก">
          นำเข้าจากตารางนัด
        </button>
      </div>

      {MASTER_TYPES.map((t) => (
        <MasterSection
          key={t.type}
          type={t.type}
          label={t.label}
          detailLabel={t.detailLabel}
          items={master[t.type]}
          deptOptions={t.type === "host" ? deptOptions : undefined}
          pending={pending}
          onCreate={(name, detail) => onCreate(t.type, name, detail)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

function MasterSection({
  type,
  label,
  detailLabel,
  items,
  deptOptions,
  pending,
  onCreate,
  onUpdate,
  onDelete,
}: {
  type: MasterType;
  label: string;
  detailLabel?: string;
  items: MasterItemDto[];
  deptOptions?: { value: string }[];
  pending: boolean;
  onCreate: (name: string, detail: string) => void;
  onUpdate: (item: MasterItemDto, name: string, detail: string) => void;
  onDelete: (item: MasterItemDto) => void;
}) {
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");

  function submit() {
    const n = name.trim();
    if (!n) return;
    onCreate(n, detail.trim());
    setName("");
    setDetail("");
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="text-sm font-semibold">{label}</h2>
        <span className="text-xs text-zinc-500">({items.length})</span>
      </div>

      {/* เพิ่มใหม่ */}
      <div className={`mb-2 grid gap-2 ${detailLabel ? "grid-cols-[1fr_1fr_auto]" : "grid-cols-[1fr_auto]"}`}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`เพิ่ม${label}ใหม่…`}
          className={inputCls}
        />
        {detailLabel ? (
          deptOptions ? (
            <Combobox value={detail} onChange={setDetail} options={deptOptions} placeholder={detailLabel} className={inputCls} />
          ) : (
            <input value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={detailLabel} className={inputCls} />
          )
        ) : null}
        <button className={btnCls} onClick={submit} disabled={pending || !name.trim()}>
          + เพิ่ม
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-zinc-500">ยังไม่มีข้อมูล</p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((it) => (
            <MasterRow
              key={it.id}
              item={it}
              detailLabel={detailLabel}
              deptOptions={deptOptions}
              pending={pending}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
      {type === "host" ? (
        <p className="mt-2 text-xs text-zinc-500">เลือกผู้รับแขกในตารางนัดแล้ว ฝ่าย/แผนกจะถูกเติมให้อัตโนมัติ</p>
      ) : null}
    </div>
  );
}

/** แถวข้อมูลหลัก — แก้ inline: พิมพ์แล้วออกจากช่อง (blur) หรือกด Enter จะบันทึก */
function MasterRow({
  item,
  detailLabel,
  deptOptions,
  pending,
  onUpdate,
  onDelete,
}: {
  item: MasterItemDto;
  detailLabel?: string;
  deptOptions?: { value: string }[];
  pending: boolean;
  onUpdate: (item: MasterItemDto, name: string, detail: string) => void;
  onDelete: (item: MasterItemDto) => void;
}) {
  const [name, setName] = useState(item.name);
  const [detail, setDetail] = useState(item.detail);
  const dirty = name.trim() !== item.name || detail.trim() !== item.detail;

  function commit() {
    if (!dirty) return;
    if (!name.trim()) {
      setName(item.name);
      return;
    }
    onUpdate(item, name.trim(), detail.trim());
  }

  return (
    <li className={`flex items-center gap-2 py-1.5 ${detailLabel ? "" : ""}`}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        className={`${inputCls} ${dirty ? "border-amber-400" : "border-transparent bg-transparent hover:border-zinc-300"}`}
      />
      {detailLabel ? (
        deptOptions ? (
          <div className="w-1/2" onBlur={commit}>
            <Combobox
              value={detail}
              onChange={setDetail}
              options={deptOptions}
              placeholder={detailLabel}
              className={`${inputCls} ${dirty ? "border-amber-400" : "border-transparent bg-transparent hover:border-zinc-300"}`}
            />
          </div>
        ) : (
          <input
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            onBlur={commit}
            placeholder={detailLabel}
            className={`${inputCls} w-1/2 ${dirty ? "border-amber-400" : "border-transparent bg-transparent hover:border-zinc-300"}`}
          />
        )
      ) : null}
      <button
        className={`${btnCls} shrink-0 text-red-600`}
        onClick={() => confirm(`ลบ "${item.name}" ออกจากข้อมูลหลัก?\n(รายการในตารางนัดที่ใช้ค่านี้อยู่จะไม่ถูกแก้)`) && onDelete(item)}
        disabled={pending}
        title="ลบ"
      >
        ✕
      </button>
    </li>
  );
}
