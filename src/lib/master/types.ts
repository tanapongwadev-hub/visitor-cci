export type MasterType = "room" | "company" | "host" | "department";

export const MASTER_TYPES: { type: MasterType; label: string; detailLabel?: string }[] = [
  { type: "room", label: "ห้องประชุม" },
  { type: "company", label: "บริษัท / กิจกรรม" },
  { type: "host", label: "ผู้รับแขก", detailLabel: "ฝ่าย / แผนก" },
  { type: "department", label: "ฝ่าย / แผนก" },
];

export const MASTER_LABEL: Record<MasterType, string> = Object.fromEntries(
  MASTER_TYPES.map((t) => [t.type, t.label]),
) as Record<MasterType, string>;

export type MasterItemDto = {
  id: string;
  type: MasterType;
  name: string;
  detail: string;
};

export type MasterData = Record<MasterType, MasterItemDto[]>;

export const EMPTY_MASTER: MasterData = { room: [], company: [], host: [], department: [] };

export function isMasterType(t: unknown): t is MasterType {
  return MASTER_TYPES.some((m) => m.type === t);
}
