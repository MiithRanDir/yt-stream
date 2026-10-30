import type { ReactNode } from "react";
import Link from "next/link";

/** Shared shell for legal pages (privacy/terms) — plain server-rendered text. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-xs text-mut">Last updated / ล่าสุด: {updated}</p>
      <div className="mt-6 space-y-6 text-sm leading-relaxed text-ink/90 [&_a]:text-hot [&_h2]:mb-1 [&_h2]:mt-5 [&_h2]:text-base [&_h2]:font-semibold [&_li]:ml-5 [&_p]:mb-2">
        {children}
      </div>
      <Link href="/" className="mt-10 inline-block text-sm text-mut underline">
        ← Back to app / กลับหน้าแอป
      </Link>
    </main>
  );
}
