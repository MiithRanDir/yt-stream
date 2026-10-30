"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Bottom sheet-style modal for mobile use. */
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-line bg-panel p-5 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-panel-2 px-3 py-1 text-sm text-mut"
          >
            ปิด
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Read-only text field with a copy-to-clipboard button. */
export function CopyField({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // iOS with no permission: select-all fallback so the user can copy manually
      const range = document.createRange();
      const target = document.getElementById(`cf-${label}`);
      if (target) {
        range.selectNodeContents(target);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-mut">{label}</span>
        <button
          type="button"
          onClick={copy}
          className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
            copied ? "bg-ok/20 text-ok" : "bg-panel-2 text-ink"
          }`}
        >
          {copied ? "คัดลอกแล้ว" : "คัดลอก"}
        </button>
      </div>
      <p
        id={`cf-${label}`}
        className={`select-all rounded-xl border border-line bg-app px-3 py-2.5 break-all text-sm ${
          mono ? "font-mono text-hot" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function Badge({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-app px-2.5 py-0.5 text-[11px] ${tone}`}
    >
      {children}
    </span>
  );
}

export function Spinner() {
  return (
    <span
      className="inline-block size-4 animate-spin rounded-full border-2 border-mut border-t-transparent align-middle"
      aria-label="กำลังโหลด"
    />
  );
}
