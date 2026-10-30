// Small typed fetch wrapper for the client: unwraps ApiResult and throws
// the server's Thai message as an Error so call sites just catch it.

import type { ApiResult } from "./types";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const json = (await res.json().catch(() => null)) as ApiResult<T> | null;
  if (!json) throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดปกติ (${res.status})`);
  if (!json.ok) throw new Error(json.error);
  return json.data;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "เกิดข้อผิดพลาดไม่ทราบสาเหตุ";
}
