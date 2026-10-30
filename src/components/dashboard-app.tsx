"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, errorMessage } from "@/lib/client-api";
import type { MeData } from "@/lib/types";
import { CreatePanel } from "./create-panel";
import { ManagePanel } from "./manage-panel";

type Tab = "create" | "manage";

type Props = { initial: { email: string; name: string; picture: string } };

export function DashboardApp({ initial }: Props) {
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(null);
  const [tab, setTab] = useState<Tab>("create");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    apiFetch<MeData>("/api/auth/me")
      .then(setMe)
      .catch((err) => showToast(errorMessage(err)));
  }, [showToast]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/");
  }

  const profile = me ?? { ...initial, channel: null };

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-4">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {profile.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.picture}
              alt=""
              className="size-9 shrink-0 rounded-full border border-line"
            />
          ) : (
            <div className="size-9 shrink-0 rounded-full bg-panel-2" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {me?.channel.title ?? (profile.name || profile.email)}
            </p>
            <p className="truncate text-xs text-mut">
              {me ? `เชื่อมต่อ YouTube แล้ว (${me.email})` : "กำลังเชื่อมต่อ…"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-xl border border-line bg-panel px-3 py-2 text-xs text-mut"
        >
          ออกจากระบบ
        </button>
      </header>

      {toast && (
        <div className="mb-4 rounded-2xl border border-hot/40 bg-hot/10 px-4 py-3 text-sm">
          {toast}
        </div>
      )}

      {tab === "create" ? (
        <CreatePanel onError={showToast} onGoManage={() => setTab("manage")} />
      ) : (
        <ManagePanel onError={showToast} onCreateNew={() => setTab("create")} />
      )}

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md gap-2 border-t border-line bg-panel/95 px-4 pt-2 backdrop-blur">
        {(
          [
            { id: "create", label: "สร้างคีย์" },
            { id: "manage", label: "จัดการไลฟ์" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-t-xl py-3 text-sm font-semibold transition-colors ${
              tab === item.id
                ? "border-b-2 border-hot text-ink"
                : "border-b-2 border-transparent text-mut"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}
