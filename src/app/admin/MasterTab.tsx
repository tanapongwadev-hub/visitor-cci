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

const PAGE_SIZE = 8;
const inputCls =
  "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-zinc-600 dark:bg-zinc-900";
const btnCls =
  "inline-flex items-center justify-center gap-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700";

export default function MasterTab({ master, pending, onCreate, onUpdate, onDelete, onImport }: Props) {
  const [selectedType, setSelectedType] = useState<MasterType>(MASTER_TYPES[0].type);
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");

  const total = Object.values(master).reduce((sum, items) => sum + items.length, 0);
  const selected = MASTER_TYPES.find((item) => item.type === selectedType) ?? MASTER_TYPES[0];
  const items = master[selected.type];
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const visibleItems = items.slice(pageStart, pageStart + PAGE_SIZE);
  const firstPageButton = Math.min(Math.max(1, currentPage - 2), Math.max(1, pageCount - 4));
  const pageButtons = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPageButton + index);
  const deptOptions = master.department.map((item) => ({ value: item.name }));
  const detailOptions = selected.type === "host" ? deptOptions : undefined;

  function selectType(type: MasterType) {
    setSelectedType(type);
    setPage(1);
    setName("");
    setDetail("");
  }

  function submit() {
    const cleanName = name.trim();
    if (!cleanName) return;
    onCreate(selected.type, cleanName, detail.trim());
    setName("");
    setDetail("");
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold">ทะเบียนข้อมูลกลาง</h2>
            <p className="mt-0.5 text-xs text-zinc-500">ทั้งหมด {total} รายการ · เลือกหมวดเพื่อดูและแก้ไขข้อมูล</p>
          </div>
          <button
            type="button"
            className={`${btnCls} ml-auto`}
            onClick={onImport}
            disabled={pending}
            title="ดึงค่าที่ใช้อยู่ในตารางนัดทุกวันมาเป็นข้อมูลหลัก"
          >
            นำเข้าจากตารางนัด
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-px bg-zinc-200 dark:bg-zinc-800 sm:grid-cols-3 xl:grid-cols-5" aria-label="หมวดข้อมูลหลัก">
          {MASTER_TYPES.map((type) => {
            const active = type.type === selected.type;
            return (
              <button
                type="button"
                key={type.type}
                onClick={() => selectType(type.type)}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-16 items-center gap-3 px-3 py-2.5 text-left last:col-span-2 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600 xl:last:col-span-1 ${
                  active
                    ? "bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200"
                    : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {active ? <span className="absolute inset-x-0 bottom-0 h-1 bg-teal-600" aria-hidden="true" /> : null}
                <span className={`text-xl font-semibold tabular-nums ${active ? "text-teal-700 dark:text-teal-300" : "text-zinc-400"}`}>
                  {master[type.type].length}
                </span>
                <span className="text-xs font-medium leading-tight">{type.label}</span>
              </button>
            );
          })}
        </nav>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-1 rounded-full bg-teal-600" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-semibold">{selected.label}</h2>
            <p className="text-xs text-zinc-500">เพิ่มรายการใหม่ หรือแก้ไขข้อมูลในตารางได้ทันที</p>
          </div>
          <span className="ml-auto rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {items.length} รายการ
          </span>
        </div>

        <div className={`mb-3 grid gap-2 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/60 ${selected.detailLabel ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]"}`}>
          <label>
            <span className="mb-1 block text-[11px] font-medium text-zinc-500">ชื่อรายการใหม่</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submit()}
              placeholder={`เพิ่ม${selected.label}…`}
              className={inputCls}
            />
          </label>
          {selected.detailLabel ? (
            <label>
              <span className="mb-1 block text-[11px] font-medium text-zinc-500">{selected.detailLabel}</span>
              {detailOptions ? (
                <Combobox
                  value={detail}
                  onChange={setDetail}
                  options={detailOptions}
                  placeholder={`เลือก${selected.detailLabel}`}
                  className={inputCls}
                />
              ) : (
                <input value={detail} onChange={(event) => setDetail(event.target.value)} className={inputCls} />
              )}
            </label>
          ) : null}
          <button
            type="button"
            className="self-end rounded-md bg-teal-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-50"
            onClick={submit}
            disabled={pending || !name.trim()}
          >
            + เพิ่มรายการ
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 px-4 py-8 text-center dark:border-zinc-700">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">ยังไม่มีข้อมูล{selected.label}</p>
            <p className="mt-1 text-xs text-zinc-500">เพิ่มรายการใหม่ด้านบน หรือนำเข้าจากตารางนัด</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
            <div className="overflow-x-auto">
              <table className={`w-full border-collapse text-left text-sm ${selected.detailLabel ? "min-w-[640px]" : "min-w-[480px]"}`}>
                <thead className="bg-zinc-50 text-[11px] uppercase tracking-[0.08em] text-zinc-500 dark:bg-zinc-800/70 dark:text-zinc-400">
                  <tr>
                    <th scope="col" className="w-12 px-3 py-2.5 text-center font-medium">#</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">ชื่อรายการ</th>
                    {selected.detailLabel ? <th scope="col" className="w-[38%] px-3 py-2.5 font-medium">{selected.detailLabel}</th> : null}
                    <th scope="col" className="w-20 px-3 py-2.5"><span className="sr-only">จัดการ</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {visibleItems.map((item, index) => (
                    <MasterTableRow
                      key={item.id}
                      number={pageStart + index + 1}
                      item={item}
                      detailLabel={selected.detailLabel}
                      detailOptions={detailOptions}
                      pending={pending}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="mr-auto text-xs text-zinc-500">
                แสดง {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, items.length)} จาก {items.length} รายการ
              </p>
              <button
                type="button"
                className={`${btnCls} px-2.5 py-1 text-xs`}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                aria-label="หน้าก่อนหน้า"
              >
                ‹
              </button>
              <div className="flex items-center gap-1" aria-label="เลือกหน้าข้อมูลหลัก">
                {pageButtons.map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === currentPage ? "page" : undefined}
                    className={`h-7 min-w-7 rounded-md px-1.5 text-xs font-medium ${
                      pageNumber === currentPage
                        ? "bg-teal-700 text-white"
                        : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className={`${btnCls} px-2.5 py-1 text-xs`}
                onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
                disabled={currentPage === pageCount}
                aria-label="หน้าถัดไป"
              >
                ›
              </button>
            </div>
          </div>
        )}

        {selected.type === "host" ? (
          <p className="mt-2 text-xs text-zinc-500">เมื่อเลือกผู้รับแขกในตารางนัด ระบบจะเติมฝ่าย/แผนกให้อัตโนมัติถ้าช่องแผนกยังว่าง</p>
        ) : null}
      </section>
    </div>
  );
}

/** แถวข้อมูลหลัก — ออกจากช่องหรือกด Enter เพื่อบันทึกการแก้ไข */
function MasterTableRow({
  number,
  item,
  detailLabel,
  detailOptions,
  pending,
  onUpdate,
  onDelete,
}: {
  number: number;
  item: MasterItemDto;
  detailLabel?: string;
  detailOptions?: { value: string }[];
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

  const editableClass = `${inputCls} ${
    dirty
      ? "border-amber-400 bg-amber-50/60 dark:bg-amber-950/20"
      : "border-transparent bg-transparent hover:border-zinc-300 dark:bg-transparent"
  }`;

  return (
    <tr className="bg-white hover:bg-zinc-50/70 dark:bg-zinc-900 dark:hover:bg-zinc-800/30">
      <td className="px-3 py-2 text-center text-xs tabular-nums text-zinc-400">{number}</td>
      <td className="px-2 py-1.5">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => event.key === "Enter" && (event.target as HTMLInputElement).blur()}
          aria-label={`ชื่อรายการ ${number}`}
          className={editableClass}
        />
      </td>
      {detailLabel ? (
        <td className="px-2 py-1.5">
          {detailOptions ? (
            <div onBlur={commit}>
              <Combobox
                value={detail}
                onChange={setDetail}
                options={detailOptions}
                placeholder={detailLabel}
                className={editableClass}
              />
            </div>
          ) : (
            <input
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              onBlur={commit}
              placeholder={detailLabel}
              className={editableClass}
            />
          )}
        </td>
      ) : null}
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          className="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-50 dark:hover:bg-red-950/40"
          onClick={() => confirm(`ลบ "${item.name}" ออกจากข้อมูลหลัก?\n(รายการในตารางนัดที่ใช้ค่านี้อยู่จะไม่ถูกแก้)`) && onDelete(item)}
          disabled={pending}
        >
          ลบ
        </button>
      </td>
    </tr>
  );
}
