"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, errorMessage } from "@/lib/client-api";
import type { BroadcastSummary } from "@/lib/types";
import { Badge, CopyField, Modal, Spinner } from "./ui";

type Props = {
  onError: (message: string) => void;
  onCreateNew: () => void;
};

const LIVEISH = new Set(["live", "liveStarting", "recording", "testing"]);

const STATUS_META: Record<string, { label: string; tone: string }> = {
  live: { label: "กำลังสด", tone: "text-live" },
  liveStarting: { label: "กำลังเริ่ม", tone: "text-live" },
  recording: { label: "กำลังบันทึก", tone: "text-warn" },
  testing: { label: "กำลังทดสอบ", tone: "text-warn" },
  ready: { label: "พร้อมไลฟ์", tone: "text-mut" },
  upcoming: { label: "ตั้งเวลาไว้", tone: "text-mut" },
  scheduled: { label: "ตั้งเวลาไว้", tone: "text-mut" },
  revoked: { label: "ถูกระงับ", tone: "text-mut" },
  completed: { label: "จบแล้ว", tone: "text-ok" },
};

const PRIVACY_LABEL: Record<string, string> = {
  private: "ส่วนตัว",
  unlisted: "ไม่เปิดเผย",
  public: "สาธารณะ",
};

export function ManagePanel({ onError, onCreateNew }: Props) {
  const [items, setItems] = useState<BroadcastSummary[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ponytail: state updates only happen after an await so the initial-load
  // effect never triggers a cascading render (react-hooks/set-state-in-effect).
  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<BroadcastSummary[]>("/api/streams");
      setItems(data);
      setFailed(false);
    } catch (err) {
      onError(errorMessage(err));
      setFailed(true);
    }
  }, [onError]);

  useEffect(() => {
    // refresh() setStates only after `await`, i.e. never synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function manualRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  if (items === null && !failed) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-mut">
        <Spinner /> กำลังโหลดรายชื่อไลฟ์…
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-panel px-5 py-10 text-center">
        <p className="text-sm text-mut">โหลดรายชื่อไลฟ์ไม่สำเร็จ</p>
        <button
          type="button"
          onClick={manualRefresh}
          className="mt-4 rounded-2xl bg-panel-2 px-5 py-3 text-sm font-semibold"
        >
          ลองใหม่
        </button>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => {
    const aLive = LIVEISH.has(a.broadcastStatus) ? 0 : 1;
    const bLive = LIVEISH.has(b.broadcastStatus) ? 0 : 1;
    if (aLive !== bLive) return aLive - bLive;
    return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-mut">พบ {items.length} ไลฟ์</p>
        <button
          type="button"
          onClick={manualRefresh}
          disabled={refreshing}
          className="rounded-xl border border-line bg-panel px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {refreshing ? <Spinner /> : "รีเฟรช"}
        </button>
      </div>

      {sorted.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line bg-panel px-5 py-10 text-center">
          <p className="text-sm text-mut">ยังไม่มีไลฟ์ — สร้างคีย์แรกกันเลย</p>
          <button
            type="button"
            onClick={onCreateNew}
            className="mt-4 rounded-2xl bg-hot px-5 py-3 text-sm font-bold text-white"
          >
            + สร้าง Stream Key
          </button>
        </div>
      )}

      {sorted.map((item) => (
        <BroadcastCard key={item.broadcastId} item={item} onChanged={manualRefresh} onError={onError} />
      ))}
    </div>
  );
}

function BroadcastCard({
  item,
  onChanged,
  onError,
}: {
  item: BroadcastSummary;
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"stop" | "delete" | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyInfo, setKeyInfo] = useState<{ ingestUrl: string; streamKey: string } | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);

  const meta = STATUS_META[item.broadcastStatus] ?? {
    label: item.broadcastStatus,
    tone: "text-mut",
  };
  const isFinished = item.broadcastStatus === "completed";

  function armConfirm(action: "stop" | "delete") {
    if (confirming === action) {
      setConfirming(null);
      void runAction(action);
    } else {
      setConfirming(action);
      window.setTimeout(() => setConfirming(null), 4000);
    }
  }

  async function runAction(action: "stop" | "delete") {
    setBusyAction(action);
    try {
      if (action === "stop") {
        await apiFetch(`/api/streams/${item.broadcastId}/stop`, { method: "POST" });
      } else {
        await apiFetch(`/api/streams/${item.broadcastId}`, { method: "DELETE" });
      }
      await onChanged();
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function openKeyModal() {
    setKeyOpen(true);
    if (keyInfo || keyLoading || !item.streamId) return;
    setKeyLoading(true);
    try {
      setKeyInfo(await apiFetch<{ ingestUrl: string; streamKey: string }>(`/api/streams/${item.broadcastId}/key`));
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setKeyLoading(false);
    }
  }

  return (
    <article className="rounded-3xl border border-line bg-panel p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</h3>
        <Badge tone={meta.tone}>
          {LIVEISH.has(item.broadcastStatus) && (
            <span className="live-dot size-1.5 rounded-full bg-live" />
          )}
          {meta.label}
        </Badge>
      </div>

      <p className="mb-3 text-xs text-mut">
        {PRIVACY_LABEL[item.privacy] ?? item.privacy}
        {item.scheduledStartTime
          ? ` · ${new Date(item.scheduledStartTime).toLocaleString("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
            })}`
          : ""}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={openKeyModal}
          disabled={!item.streamId}
          className="rounded-xl bg-panel-2 px-3 py-2.5 disabled:opacity-40"
        >
          ดูคีย์
        </button>
        <button
          type="button"
          onClick={() => setRenameOpen(true)}
          disabled={isFinished}
          className="rounded-xl bg-panel-2 px-3 py-2.5 disabled:opacity-40"
        >
          แก้ชื่อ
        </button>
        <button
          type="button"
          onClick={() => armConfirm("stop")}
          disabled={isFinished || busyAction === "stop"}
          className={`rounded-xl px-3 py-2.5 ${
            confirming === "stop" ? "bg-warn text-black" : "bg-panel-2"
          } disabled:opacity-40`}
        >
          {busyAction === "stop" ? (
            <Spinner />
          ) : confirming === "stop" ? (
            "กดอีกครั้งเพื่อยืนยัน"
          ) : (
            "หยุดไลฟ์"
          )}
        </button>
        <button
          type="button"
          onClick={() => armConfirm("delete")}
          disabled={busyAction === "delete"}
          className={`rounded-xl px-3 py-2.5 ${
            confirming === "delete" ? "bg-live text-white" : "bg-panel-2 text-hot"
          } disabled:opacity-40`}
        >
          {busyAction === "delete" ? (
            <Spinner />
          ) : confirming === "delete" ? (
            "กดอีกครั้งเพื่อลบ"
          ) : (
            "ลบคีย์"
          )}
        </button>
      </div>

      {/* key toggles remount the modal so its form starts from the latest title */}
      <RenameModal
        key={renameOpen ? "rename-open" : "rename-closed"}
        open={renameOpen}
        currentTitle={item.title}
        broadcastId={item.broadcastId}
        onClose={() => setRenameOpen(false)}
        onChanged={onChanged}
        onError={onError}
      />
      <KeyModal
        open={keyOpen}
        title={item.title}
        info={keyInfo}
        loading={keyLoading}
        onClose={() => setKeyOpen(false)}
      />
    </article>
  );
}

function RenameModal({
  open,
  currentTitle,
  broadcastId,
  onClose,
  onChanged,
  onError,
}: {
  open: boolean;
  currentTitle: string;
  broadcastId: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
  onError: (message: string) => void;
}) {
  const [title, setTitle] = useState(currentTitle);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      await apiFetch(`/api/streams/${broadcastId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: trimmed }),
      });
      onClose();
      await onChanged();
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} title="เปลี่ยนชื่อไลฟ์" onClose={onClose}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={90}
        className="w-full rounded-2xl border border-line bg-app px-4 py-3.5 text-base focus:border-hot focus:outline-none"
      />
      <button
        type="button"
        onClick={save}
        disabled={saving || !title.trim()}
        className="mt-4 w-full rounded-2xl bg-hot px-4 py-3.5 text-sm font-bold text-white disabled:opacity-40"
      >
        {saving ? <Spinner /> : "บันทึก"}
      </button>
    </Modal>
  );
}

function KeyModal({
  open,
  title,
  info,
  loading,
  onClose,
}: {
  open: boolean;
  title: string;
  info: { ingestUrl: string; streamKey: string } | null;
  loading: boolean;
  onClose: () => void;
}) {
  const serverUrl = info
    ? info.ingestUrl.slice(0, info.ingestUrl.lastIndexOf("/") + 1)
    : "";

  return (
    <Modal open={open} title={`คีย์ของ “${title}”`} onClose={onClose}>
      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-mut">
          <Spinner /> กำลังดึงคีย์…
        </div>
      )}
      {!loading && info && (
        <>
          <CopyField label="STREAM KEY" value={info.streamKey} />
          <CopyField label="SERVER URL (RTMP)" value={serverUrl} />
          <p className="text-xs text-mut">
            หมายเหตุ: YouTube อาจหมุนเวียน (rotate) คีย์ใหม่ทุกครั้งที่จบไลฟ์
            — ใช้ค่าที่แสดงล่าสุดเสมอ
          </p>
        </>
      )}
      {!loading && !info && (
        <p className="py-4 text-sm text-mut">โหลดคีย์ไม่สำเร็จ — ปิดแล้วกดดูคีย์ใหม่อีกครั้ง</p>
      )}
    </Modal>
  );
}
