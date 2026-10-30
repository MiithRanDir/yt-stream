"use client";

import { useState, type FormEvent } from "react";
import { apiFetch, errorMessage } from "@/lib/client-api";
import type { PrivacyStatus, StreamKeyInfo } from "@/lib/types";
import { CopyField, Spinner } from "./ui";

const PRIVACY_OPTIONS: { value: PrivacyStatus; label: string; hint: string }[] = [
  { value: "private", label: "ส่วนตัว", hint: "ดูได้เฉพาะบัญชีคุณ" },
  { value: "unlisted", label: "ไม่เปิดเผย", hint: "คนที่รู้ลิงก์เท่านั้น" },
  { value: "public", label: "สาธารณะ", hint: "ทุกคนค้นหาเจอ" },
];

type Props = {
  onGoManage: () => void;
  onError: (message: string) => void;
};

export function CreatePanel({ onGoManage, onError }: Props) {
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState<PrivacyStatus>("private");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<StreamKeyInfo | null>(null);

  if (result) {
    return <KeyResult info={result} onBack={() => setResult(null)} onManage={onGoManage} />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const created = await apiFetch<StreamKeyInfo>("/api/streams", {
        method: "POST",
        body: JSON.stringify({ title: trimmed, privacy }),
      });
      setTitle("");
      setResult(created);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label htmlFor="stream-title" className="mb-2 block text-sm font-semibold">
          ชื่อไลฟ์ (Title)
        </label>
        <input
          id="stream-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={90}
          placeholder="เช่น ไลฟ์ขายของ evening 2 ทุ่ม"
          className="w-full rounded-2xl border border-line bg-panel px-4 py-4 text-base placeholder:text-mut focus:border-hot focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-mut">{title.trim().length}/90</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">โหมดการมองเห็น</p>
        <div className="grid grid-cols-3 gap-2">
          {PRIVACY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPrivacy(option.value)}
              className={`rounded-2xl border px-2 py-3 text-center transition-colors ${
                privacy === option.value
                  ? "border-hot bg-hot/15 text-ink"
                  : "border-line bg-panel text-mut"
              }`}
            >
              <span className="block text-sm font-semibold">{option.label}</span>
              <span className="mt-0.5 block text-[10px] leading-tight">{option.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-hot px-5 py-4 text-base font-bold text-white disabled:opacity-40"
      >
        {busy ? <Spinner /> : null}
        {busy ? "กำลังสร้างคีย์…" : "สร้าง Stream Key"}
      </button>

      <p className="text-xs leading-relaxed text-mut">
        ระบบจะสร้างไลฟ์แบบ auto-start — พอแอปไลฟ์ต่อเข้าคีย์เมื่อไหร่
        YouTube จะขึ้นสถานะ &quot;สด&quot; ให้อัตโนมัติ ไม่ต้องกดปุ่มใดเพิ่ม
        (ใช้ quota YouTube API 102 หน่วยต่อการสร้าง)
      </p>
    </form>
  );
}

function KeyResult({
  info,
  onBack,
  onManage,
}: {
  info: StreamKeyInfo;
  onBack: () => void;
  onManage: () => void;
}) {
  const serverUrl = info.ingestUrl.slice(0, info.ingestUrl.lastIndexOf("/") + 1);
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-ok/40 bg-ok/10 px-4 py-3">
        <p className="text-sm font-semibold text-ok">สร้างสำเร็จ ✔</p>
        <p className="mt-0.5 text-xs text-mut">“{info.title}”</p>
      </div>

      <CopyField label="STREAM KEY (เอาไปวางในช่อง Key)" value={info.streamKey} />
      <CopyField label="SERVER URL (RTMP)" value={serverUrl} />

      <div className="rounded-2xl border border-warn/40 bg-warn/10 px-4 py-3 text-xs leading-relaxed text-warn">
        ห้ามแชร์คีย์นี้ให้คนอื่น — ผู้ถือคีย์สามารถส่งภาพเข้าไลฟ์ของคุณได้
        คีย์จะเปลี่ยนทุกครั้งเมื่อสร้างไลฟ์ใหม่
      </div>

      <div className="rounded-2xl border border-line bg-panel px-4 py-3 text-sm leading-relaxed">
        <p className="mb-1 font-semibold">วิธีไลฟ์จากมือถือ</p>
        <ol className="list-decimal space-y-1 pl-5 text-mut">
          <li>เปิดแอปไลฟ์ เช่น PRISM Live Studio → เลือก Custom RTMP</li>
          <li>วาง Server URL และ Stream Key ด้านบน</li>
          <li>กดเริ่มไลฟ์ในแอป — YouTube จะขึ้น “สด” อัตโนมัติภายในไม่กี่วินาที</li>
        </ol>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-2xl border border-line bg-panel px-4 py-3.5 text-sm font-semibold"
        >
          สร้างอีกอัน
        </button>
        <button
          type="button"
          onClick={onManage}
          className="flex-1 rounded-2xl bg-hot px-4 py-3.5 text-sm font-bold text-white"
        >
          ไปหน้าจัดการ
        </button>
      </div>
    </div>
  );
}
